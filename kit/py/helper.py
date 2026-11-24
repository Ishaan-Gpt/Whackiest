"""Edit Easy MCP kit: the local, free perception helpers the Node server calls.

    python helper.py transcribe <media> [model]        -> {"words":[{"w","start","end"}], "model", "language"}
    python helper.py face <media> <duration>             -> {"box":{"x","y","w","h"}|null, "frames", "method"}
    python helper.py font <src> <weight> <out.ttf> <family> -> {"family","file","upm","asc","desc","adv":{char:em}}

Everything runs on the user's CPU: faster-whisper (MIT, model weights MIT) for words, OpenCV's bundled Haar cascade
(BSD) for a face box, fontTools (MIT) to turn a library font (static TTF or variable WOFF2) into one static TTF that
libass can load. Audio and frames are decoded by ffmpeg, so no PyAV/codec quirks on Windows.
"""
import json
import subprocess
import sys


def out(obj):
    sys.stdout.write(json.dumps(obj))
    sys.stdout.flush()


def transcribe(media, model_name="base"):
    import numpy as np
    from faster_whisper import WhisperModel

    raw = subprocess.run(["ffmpeg", "-v", "error", "-nostdin", "-i", media, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    audio = np.frombuffer(raw, np.float32)
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segs, info = model.transcribe(audio, word_timestamps=True, vad_filter=False)
    words = []
    for s in segs:
        for w in s.words or []:
            t = w.word.strip()
            if t:
                words.append({"w": t, "start": round(float(w.start), 3), "end": round(float(w.end), 3)})
    out({"words": words, "model": f"faster-whisper {model_name} (cpu int8)", "language": info.language})


def face(media, duration):
    import cv2
    import numpy as np

    duration = float(duration)
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    boxes = []
    for f in (0.1, 0.3, 0.5, 0.7, 0.9):
        jpg = subprocess.run(["ffmpeg", "-v", "error", "-nostdin", "-ss", str(duration * f), "-i", media, "-frames:v", "1",
                              "-f", "image2pipe", "-vcodec", "mjpeg", "-"], capture_output=True).stdout
        if not jpg:
            continue
        img = cv2.imdecode(np.frombuffer(jpg, np.uint8), cv2.IMREAD_GRAYSCALE)
        if img is None:
            continue
        h, w = img.shape
        found = cascade.detectMultiScale(img, scaleFactor=1.1, minNeighbors=6, minSize=(w // 8, w // 8))
        if len(found):
            x, y, bw, bh = max(found, key=lambda b: b[2] * b[3])
            boxes.append((x, y, bw, bh))
    if not boxes:
        out({"box": None, "frames": 0, "method": "opencv haar frontal face"})
        return
    # union of the per-frame boxes, so the box covers where the face goes during the clip; the Haar box is eyebrows to
    # mouth, so grow it to forehead and chin (+25 % up, +20 % down, +10 % each side)
    x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes)
    x1 = max(b[0] + b[2] for b in boxes); y1 = max(b[1] + b[3] for b in boxes)
    bw, bh = x1 - x0, y1 - y0
    x0 -= 0.10 * bw; x1 += 0.10 * bw; y0 -= 0.25 * bh; y1 += 0.20 * bh
    out({"box": {"x": int(max(0, x0)), "y": int(max(0, y0)), "w": int(x1 - max(0, x0)), "h": int(y1 - max(0, y0))},
         "frames": len(boxes), "method": "opencv haar frontal face, union of 5 frames, grown to forehead and chin"})


def font(src, weight, dst, family):
    from fontTools.ttLib import TTFont

    f = TTFont(src)
    if "fvar" in f:
        from fontTools.varLib import instancer
        axes = {a.axisTag: a for a in f["fvar"].axes}
        loc = {}
        for tag, a in axes.items():
            loc[tag] = max(a.minValue, min(a.maxValue, float(weight))) if tag == "wght" else a.defaultValue
        f = instancer.instantiateVariableFont(f, loc)
    f.flavor = None
    name = f["name"]
    for rec in list(name.names):
        if rec.nameID in (16, 17, 21, 22):
            name.removeNames(nameID=rec.nameID)
    for nid, val in ((1, family), (2, "Regular"), (4, family), (6, family.replace(" ", "-"))):
        name.setName(val, nid, 3, 1, 0x409)
        name.setName(val, nid, 1, 0, 0)
    if "OS/2" in f:
        f["OS/2"].usWeightClass = 400
        f["OS/2"].fsSelection = (f["OS/2"].fsSelection & ~0b100001) | 0b1000000  # REGULAR, not bold/italic
    if "head" in f:
        f["head"].macStyle = 0
    f.save(dst)
    upm = f["head"].unitsPerEm
    cmap = f.getBestCmap()
    hmtx = f["hmtx"].metrics
    adv = {}
    for code in range(32, 127):
        g = cmap.get(code)
        if g is not None and g in hmtx:
            adv[chr(code)] = round(hmtx[g][0] / upm, 4)
    hhea = f["hhea"]
    out({"family": family, "file": dst, "upm": upm, "asc": round(hhea.ascent / upm, 4), "desc": round(-hhea.descent / upm, 4), "adv": adv})


if __name__ == "__main__":
    cmd, *args = sys.argv[1:]
    {"transcribe": transcribe, "face": face, "font": font}[cmd](*args)
