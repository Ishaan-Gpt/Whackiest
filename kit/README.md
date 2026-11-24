# Edit Easy MCP (wHACKiest 2026 prototype)

An MCP server that becomes the editing backbone for the AI you already have. Claude Desktop, Claude Code, or any other
MCP client connects to it. The server gives that AI three things:

- a **typed editing language** made of short menus and word-index anchors,
- the **Edit Easy taste library** (caption looks, Style 1 sound kit, grade, music, camera) read from `library/`,
- a **verifier** that proves every edit before anything is rendered.

The model only picks from menus and returns JSON that the schema validates. It never writes seconds, pixels or
colours. Code places everything, checks it, and renders it with ffmpeg on the user's own machine. Nothing calls a paid
API.

This is a hackathon prototype that lives outside `packages/`. Everything below has been run end to end. The limits
section lists what it does not do.

## Tools (server name `edit-easy`)

| Tool | What it does |
|---|---|
| `open_clip(path, face_box?, reset?)` | Probes the clip with ffprobe (size, fps, duration, audio) and returns a `clip_id`. It writes the project doc `<clip>.editeasy.json` next to the clip, holding the ops, the undo history, verdicts and renders. It finds a face box with OpenCV's Haar detector unless you pass `face_box`. |
| `transcribe(clip_id, model?, words_json_path?)` | Gets word timestamps locally with faster-whisper (`base`, CPU int8). It returns `index:word` pairs. As a fallback, `words_json_path` takes a JSON file of `[{"w","start","end"}]`. |
| `find_library(kind, text?, tags?, limit?)` | Returns short menus from the library through its own `find()`. Kinds: `caption` (only the looks this renderer draws faithfully, 6 of 157 today), `sfx_event` (the Style 1 events and the sound each one plays), `grade`, `music`, `font`, `camera`. |
| `plan_edit(clip_id, ops[], mode?)` | Takes typed ops: `captions{look, position, size?, nudge_px?}`, `punch_in{at_word, scale: subtle\|strong, until_word?}`, `cut{from_word, to_word}`, `sfx{event, at_word}`, `grade{id}`, `music{id, level:"bed"}`, `hero_word{word_index}`. The enum values are built from the library when the server starts. |
| `validate_edit(clip_id)` | The verifier. Returns PASS, REFUSED or SKIPPED for each rule, with a plain reason, the fix and the source. |
| `render(clip_id, quality: preview\|final)` | Renders with ffmpeg only. It runs the verifier first and refuses if any rule fails. |
| `undo(clip_id)` | Restores the plan as it was before the last `plan_edit`. |
| `explain(clip_id)` | For each op: which library item it uses (with provenance), which rules checked it, and the last verdict. |

### Verifier rules (all in `src/verify.ts`, each cites its source)

- `caption_safe_area`: every caption line must sit inside the Shorts safe area, x 70–905 and y 230–1480 on 1080×1920
  (from docs/CONTEXT.md §4, scaled for other sizes). Line boxes come from the font's real advance widths.
- `caption_face`: no caption line may cross the face box.
- `caption_words_per_line`: at most 4 words a line and 2 lines a card (from `principle/caption-timing`).
- `caption_min_size`: text must be at least 4 % of the short side (from `principle/text-legibility`).
- `sfx_from_style1`: an effect plays only if the Style 1 kit maps a sound to its event.
- `sfx_spacing`: effects must be at least 120 ms apart.
- `punch_in_spacing`: punch-ins must be at least 1.2 s apart.
- `music_under_voice`: the music bed must sit at the item's `gainDb` (−24) and be sidechain-ducked under the voice.
- `loudness_target`: the mix is normalised to −14 LUFS with true peak ≤ −1.5 dBTP, and the measured values are
  reported after the render.
- `anchors_valid`: every anchor must be a real word index, and no anchor may sit inside a cut.

`lower`, `middle` and `upper` are menu positions, and code keeps a tall card inside the safe area. `top_edge`,
`bottom_edge` and any explicit `nudge_px` are taken literally, so the verifier can refuse them. This is the refusal the
end-to-end test produced:

```
REFUSED caption_safe_area: caption "perspective / for" line 2: bottom edge at y=1789 is inside the platform UI zone (safe area ends at y=1480). Fix: position "lower" (y=1344).
```

### What render does

1. **Cuts:** keeps the segments and rejoins them with 10 ms audio fades, so a cut never clicks.
2. **Punch-ins:** scales and crops every frame, centred on the face. The push uses the snap (expo-out) ease from
   `packages/camera` over 0.25 s. The punch holds to the end of the sentence and cuts back.
   - `subtle` = 1.15×, from `camera/punch-in`.
   - `strong` = 1.3×, from `principle/punch-in`.
3. **Grade:** applies `lut3d` from the grade item's `.cube` file.
4. **Captions:**
   - Word-timed ASS captions in the library look: its font, text, active-word and stroke colours, hero scale, and a
     rise-in animation.
   - The font comes from `library/font`. A variable WOFF2 is turned into a static TTF at the look's weight with
     fontTools and cached in `.cache/fonts`.
5. **Sound effects:** Style 1 sounds placed with `adelay`, at the kit's levels.
6. **Music:** the bed is ducked under the voice with `sidechaincompress`.
7. **Loudness:**
   - `final` uses two-pass `loudnorm` to −14 LUFS, then measures the result with `ebur128`.
   - `preview` renders at half size, single pass.

## Install on Windows 11 (no GPU needed)

1. **Node 22:** run `winget install OpenJS.NodeJS.LTS`, or use the installer from nodejs.org. Check it with
   `node -v`, which should print v22 or later.
2. **ffmpeg:** run `winget install Gyan.FFmpeg`. This build includes libass and lut3d. Open a new terminal and check it
   with `ffmpeg -version`.
3. **Python 3.11 or 3.12:** install it from python.org and tick "Add python.exe to PATH". Then run:
   ```
   cd C:\path\to\EditEasy\hackathon\whackiest-2026\kit
   python -m pip install -r requirements.txt
   ```
   - On the first `transcribe`, faster-whisper downloads the `base` model (~140 MB) from Hugging Face.
   - Run one transcribe before you record, so the download doesn't happen on camera.
   - If `python` is not the right interpreter, set `EDITEASY_PYTHON` to its full path.
4. **The kit:** in the same folder, run `npm install`.

No system fonts are needed, because the renderer loads the fonts from `library/font` itself.

### Connect it to Claude Desktop

Open Settings, then Developer, then Edit Config, which opens `%APPDATA%\Claude\claude_desktop_config.json`. Add the
server below, using your real path, then quit Claude Desktop fully from the tray and reopen it.

```json
{
  "mcpServers": {
    "edit-easy": {
      "command": "node",
      "args": [
        "C:\\path\\to\\EditEasy\\hackathon\\whackiest-2026\\kit\\node_modules\\tsx\\dist\\cli.mjs",
        "C:\\path\\to\\EditEasy\\hackathon\\whackiest-2026\\kit\\src\\server.ts"
      ]
    }
  }
}
```

The config calls `node` with tsx's CLI file on purpose. On Windows, Claude Desktop starts servers without a shell, so
`npx` and `.cmd` shims can fail there.

### Connect it to Claude Code

```
claude mcp add edit-easy -- node "C:\path\to\EditEasy\hackathon\whackiest-2026\kit\node_modules\tsx\dist\cli.mjs" "C:\path\to\EditEasy\hackathon\whackiest-2026\kit\src\server.ts"
```

## Test it

```
cd hackathon/whackiest-2026/kit
npx tsx scripts/demo-client.ts ../out/raw-talking-9x16.mp4 --quality final   # the AFTER flow over real MCP stdio
node scripts/naive_before.mjs ../out/raw-talking-9x16.mp4                       # the BEFORE side
node scripts/side-by-side.mjs                                                   # out/before-after.mp4
npx tsc -p tsconfig.json                                                        # typecheck (needs `pnpm install` at the repo root)
```

`demo-client.ts` uses the SDK's `Client` over stdio and runs these steps:

1. Open, transcribe and read the menus.
2. Plan with `position: "bottom_edge"`.
3. Validate, which must REFUSE.
4. Render, which must refuse too.
5. Plan the fix (`lower`).
6. Validate, which must PASS.
7. Explain, then render the final.

Last run on a Linux CPU container with an 18.8 s output:
- Verifier: 10 rules passed.
- Render time: 51 s for final, about 25 s for preview.
- Loudness: −14.3 LUFS integrated, true peak −1.4 dBTP.

## Limits (honest)

- **Caption looks:** only looks with a flat colour, a sentence, word or karaoke layout, and a font shipped in
  `library/font` are offered (6 of 157). Box, pill, gradient and pack looks stay out of the menu until the template
  engine draws them.
- **Caption animation:** the in-animation is a simple rise and fade. Per-letter and spring animations are not drawn.
- **Caption size:** the legacy looks are authored at about 50 px. `size: "large"` (1.75×) is a prototype default
  **waiting for Ishaan's yes**. The default stays `as_designed`.
- **Face box:** a Haar detector unions 5 frames, so the box is generous. If the detector finds no face, the face rule
  is SKIPPED with a reason, and `face_box` can be passed by hand.
- **Sound effects:** layered `then` sounds and `cascade`/`every` rules from the kit are not mixed yet. Each event
  plays its one ranked sound.
- **Grade:** only the LUT is applied. The item's vignette and grain values are not.
- **Music:** the Funkorama bed is CC BY 4.0, and render returns the credit line, which must be shown with the video.
- **Thresholds:** the safe-area numbers, the 120 ms sfx gap and the 1.2 s punch gap are written in `verify.ts` with
  their sources. They are not library items yet. They should become a `principle` item once Ishaan agrees.
