/**
 * Render with ffmpeg only (no paid API; runs on Windows, macOS and Linux CPU). Everything the filter graph reads (fonts,
 * LUT, captions, sounds) is copied into a work folder next to the clip and referenced by bare relative names, so no
 * Windows drive-letter escaping ever reaches a filter string.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { layout, timeline, type Layout } from './layout.ts';
import { byId, itemDir, measure, sfxFor } from './lib.ts';
import type { Doc, Op } from './state.ts';

const ass = (hex: string | null, alpha = 0) => { const h = (hex ?? '#FFFFFF').replace('#', '').padEnd(6, '0'); return `&H${alpha.toString(16).padStart(2, '0').toUpperCase()}${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}`.toUpperCase(); };
const ts = (s: number) => { s = Math.max(0, s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return `${h}:${String(m).padStart(2, '0')}:${x.toFixed(2).padStart(5, '0')}`; };

/** Punch-in scale factors from the library: subtle = camera/punch-in amount, strong = principle/punch-in minScale. */
export function punchScale(kind: 'subtle' | 'strong') {
  const amt = (byId('camera/punch-in')?.data as { amount?: { value: number } } | undefined)?.amount?.value ?? 1.15;
  return kind === 'subtle' ? amt : ((measure('principle/punch-in').minScale as number) ?? 1.3);
}
/** Ease of the push: packages/camera EASES.snap (expo-out, "a crash zoom lands"), over 0.25 s; the return is a cut. */
const EASE_S = 0.25;

export function buildAss(d: Doc, L: Layout) {
  const { width: W, height: H } = d.clip, lk = L.look;
  const hero = new Set(d.ops.filter(o => o.op === 'hero_word').map(o => (o as { word_index: number }).word_index));
  const size = L.px * (L.font.asc + L.font.desc);   // libass sizes a font by its ascent+descent box
  const head = `[Script Info]\nScriptType: v4.00+\nPlayResX: ${W}\nPlayResY: ${H}\nWrapStyle: 2\nScaledBorderAndShadow: yes\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Cap,${L.font.family},${size.toFixed(1)},${ass(lk.text)},${ass(lk.text)},${ass(lk.stroke ?? '#000000')},${ass('#000000', 0x90)},0,0,0,0,100,100,0,0,1,${L.outline.toFixed(1)},${(L.px * 0.04).toFixed(1)},5,0,0,0,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  const ev: string[] = [];
  const act = lk.active ?? lk.text;
  for (const c of L.cards) {
    // one event per spoken word so the active word can light up; a look with no highlight gets one event per card
    const spans = lk.highlight === 'none' ? [{ k: -1, a: c.start, b: c.end }]
      : c.words.map((w, k) => ({ k, a: k ? w.start : c.start, b: k < c.words.length - 1 ? c.words[k + 1].start : c.end }));
    spans.forEach((sp, si) => {
      if (sp.b - sp.a < 0.02) return;
      for (const l of c.lines) {
        const body = l.words.map((w, j) => {
          const isAct = sp.k >= 0 && c.words[sp.k].i === w.i, isHero = hero.has(w.i);
          const sc = (isHero ? lk.heroScale : 1) * (isAct ? lk.emphasisScale : 1) * 100;
          const col = isAct || isHero ? act : lk.text;
          const tag = `{\\c${ass(col)}${sc !== 100 ? `\\fscx${sc.toFixed(0)}\\fscy${sc.toFixed(0)}` : ''}}`;
          return tag + l.text[j].replace(/[{}]/g, '') + '{\\r}';
        }).join(' ');
        const x = W / 2, y = l.y;
        const anim = si === 0 && lk.inAnim && lk.inAnim.type !== 'none'
          ? `\\move(${x.toFixed(0)},${(y + L.px * 0.25).toFixed(0)},${x.toFixed(0)},${y.toFixed(0)},0,${lk.inAnim.durationMs})\\fad(${Math.round(lk.inAnim.durationMs * 0.6)},0)`
          : `\\pos(${x.toFixed(0)},${y.toFixed(0)})`;
        ev.push(`Dialogue: 0,${ts(sp.a)},${ts(sp.b)},Cap,,0,0,0,,{\\an5${anim}}${body}`);
      }
    });
  }
  return head + ev.join('\n') + '\n';
}

export interface RenderResult { path: string; seconds: number; loudness?: { lufs: number; truePeak: number }; log: string[]; credits: string[] }

export function render(d: Doc, quality: 'preview' | 'final'): RenderResult {
  const t0 = Date.now(), log: string[] = [], credits: string[] = [];
  const { width: W, height: H, duration } = d.clip;
  const src = d.clip.path;
  const work = src + '.editeasy-work';
  rmSync(work, { recursive: true, force: true }); mkdirSync(join(work, 'fonts'), { recursive: true });
  const out = join(dirname(src), basename(src, extname(src)) + `.edit-${quality}.mp4`);
  const words = d.words ?? [];
  const tl = timeline(d);
  const args = ['-v', 'error', '-y', '-nostdin', '-i', src];
  const fc: string[] = [];

  // cuts: keep segments, re-joined with 10 ms audio fades so a cut never clicks
  const K = tl.keep;
  K.forEach(([a, b], i) => {
    fc.push(`[0:v]trim=${a.toFixed(3)}:${b.toFixed(3)},setpts=PTS-STARTPTS[v${i}]`);
    if (d.clip.audio) fc.push(`[0:a]atrim=${a.toFixed(3)}:${b.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st=${Math.max(0, b - a - 0.01).toFixed(3)}:d=0.01[a${i}]`);
  });
  fc.push(`${K.map((_, i) => `[v${i}]${d.clip.audio ? `[a${i}]` : ''}`).join('')}concat=n=${K.length}:v=1:a=${d.clip.audio ? 1 : 0}[vc]${d.clip.audio ? '[ac]' : ''}`);
  if (K.length < 1) throw new Error('nothing left after cuts');
  if (d.ops.some(o => o.op === 'cut')) log.push(`cuts: kept ${K.map(([a, b]) => `${a.toFixed(2)}–${b.toFixed(2)} s`).join(', ')} (${tl.duration.toFixed(2)} s of ${duration.toFixed(2)} s)`);

  // punch-ins: per-frame scale then a crop that keeps the face centred
  let v = '[vc]';
  const pun = d.ops.filter((o): o is Extract<Op, { op: 'punch_in' }> => o.op === 'punch_in');
  if (pun.length) {
    const terms = pun.map(p => {
      const a = tl.map(words[p.at_word].start);
      let endW = p.until_word ?? p.at_word;
      if (p.until_word == null) { while (endW < words.length - 1 && !/[.?!]$/.test(words[endW].w) && words[endW + 1].end - words[p.at_word].start <= 2.5) endW++; }
      const b = Math.max(a + 0.6, tl.map(words[endW].end));
      const s = punchScale(p.scale);
      log.push(`punch_in ${p.scale} ${s}× from word ${p.at_word} "${words[p.at_word].w}" (${a.toFixed(2)} s) to word ${endW} "${words[endW].w}" (${b.toFixed(2)} s)`);
      return `between(t,${a.toFixed(3)},${b.toFixed(3)})*${(s - 1).toFixed(3)}*(1-pow(2,-10*min((t-${a.toFixed(3)})/${EASE_S},1)))`;
    });
    const z = `(1+${terms.join('+')})`;
    const f = d.face?.box, cx = f ? f.x + f.w / 2 : W / 2, cy = f ? f.y + f.h / 2 : H * 0.4;
    fc.push(`${v}scale=w='trunc(${W}*${z}/2)*2':h='trunc(${H}*${z}/2)*2':eval=frame:flags=bicubic,crop=${W}:${H}:'max(0,min(in_w-${W},${cx.toFixed(0)}*in_w/${W}-${W / 2}))':'max(0,min(in_h-${H},${cy.toFixed(0)}*in_h/${H}-${(cy).toFixed(0)}))'[vz]`);
    v = '[vz]';
  }
  // grade
  const g = d.ops.find((o): o is Extract<Op, { op: 'grade' }> => o.op === 'grade');
  if (g) {
    const it = byId(g.id)!; const lut = (it.data as { lut?: string }).lut;
    if (lut) { copyFileSync(join(itemDir(it.id), lut), join(work, 'grade.cube')); fc.push(`${v}lut3d=grade.cube[vg]`); v = '[vg]'; log.push(`grade ${it.id}: lut3d ${lut}`); }
    else log.push(`grade ${it.id} has no .cube file; skipped`);
  }
  // captions
  const cap = d.ops.find((o): o is Extract<Op, { op: 'captions' }> => o.op === 'captions');
  if (cap && words.length) {
    const L = layout(d, cap);
    copyFileSync(L.font.file, join(work, 'fonts', basename(L.font.file)));
    writeFileSync(join(work, 'captions.ass'), buildAss(d, L));
    fc.push(`${v}subtitles=captions.ass:fontsdir=fonts[vs]`); v = '[vs]';
    log.push(`captions ${cap.look} (${L.font.family}, ${L.px.toFixed(0)} px) at ${cap.position}: ${L.cards.length} cards`);
  }
  fc.push(`${v}${quality === 'preview' ? `scale=${Math.round(W / 2 / 2) * 2}:${Math.round(H / 2 / 2) * 2},` : ''}format=yuv420p[vout]`);

  // audio: voice (+ sfx at Style 1 levels) + a music bed ducked under the voice
  let aout: string | undefined;
  if (d.clip.audio) {
    let inputs = 1;
    const mus = d.ops.find((o): o is Extract<Op, { op: 'music' }> => o.op === 'music');
    fc.push(`[ac]aresample=48000,aformat=channel_layouts=stereo,asplit=2[vo][vsc]`);
    const mixIn = ['[vo]'];
    d.ops.filter((o): o is Extract<Op, { op: 'sfx' }> => o.op === 'sfx').forEach((s, k) => {
      const snd = sfxFor(s.event)!;
      const f = `sfx${k}${extname(snd.file)}`; copyFileSync(snd.file, join(work, f));
      args.push('-i', join(work, f));
      const ms = Math.max(0, Math.round(tl.map(words[s.at_word].start) * 1000));
      fc.push(`[${inputs}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${snd.levelDb}dB,adelay=${ms}|${ms}[s${k}]`);
      mixIn.push(`[s${k}]`); inputs++;
      log.push(`sfx ${s.event} → ${snd.id} at ${(ms / 1000).toFixed(2)} s, ${snd.levelDb} dB (Style 1 kit level)`);
    });
    if (mus) {
      const it = byId(mus.id)!; const gain = (it.data as { gainDb?: number }).gainDb ?? -24;
      const f = 'music' + extname(it.files[0]); copyFileSync(join(itemDir(it.id), it.files[0]), join(work, f));
      args.push('-stream_loop', '-1', '-i', join(work, f));
      fc.push(`[${inputs}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:${tl.duration.toFixed(3)},volume=${gain}dB,afade=t=out:st=${Math.max(0, tl.duration - 1.2).toFixed(3)}:d=1.2[mb]`);
      fc.push(`[mb][vsc]sidechaincompress=threshold=0.02:ratio=6:attack=15:release=350:makeup=1[md]`);
      mixIn.push('[md]'); inputs++;
      const credit = (it.data as { credit?: string }).credit; if (credit) credits.push(credit);
      log.push(`music ${it.id} at ${gain} dB, ducked under the voice (sidechaincompress)`);
    } else fc.push('[vsc]anullsink');
    fc.push(`${mixIn.join('')}amix=inputs=${mixIn.length}:normalize=0:duration=first[mix]`);
    aout = '[mix]';
    if (quality === 'preview') { fc.push(`[mix]loudnorm=I=-14:TP=-1.5:LRA=11[aout]`); aout = '[aout]'; }
  }
  writeFileSync(join(work, 'graph.txt'), fc.join(';\n'));
  const enc = quality === 'final' ? ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18'] : ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26'];
  const tmp = quality === 'final' ? join(work, 'pass1.mp4') : out;
  // -filter_complex_script reads the graph from a file (no command-line length limits on Windows)
  const a2 = [...args, '-filter_complex_script', 'graph.txt', '-map', '[vout]', ...(aout ? ['-map', aout, '-c:a', quality === 'final' ? 'pcm_s16le' : 'aac', '-b:a', '192k', '-ar', '48000'] : []), ...enc, '-r', String(d.clip.fps), '-movflags', '+faststart', quality === 'final' ? tmp.replace(/\.mp4$/, '.mov') : tmp];
  const r = spawnSync('ffmpeg', a2, { cwd: work, encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error('ffmpeg failed: ' + (r.stderr || r.error?.message || '').slice(-1500));

  let loudness: RenderResult['loudness'];
  if (quality === 'final') {
    const mov = tmp.replace(/\.mp4$/, '.mov');
    if (aout) {
      // two-pass loudnorm: measure the mix, then apply it linearly (no pumping), re-encoding only the audio
      const m = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', '-i', mov, '-vn', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 });
      const j = JSON.parse(m.stderr.slice(m.stderr.lastIndexOf('{'), m.stderr.lastIndexOf('}') + 1));
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-nostdin', '-i', mov, '-map', '0:v', '-map', '0:a', '-c:v', 'copy', '-af',
        `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,aresample=48000`,
        '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out]);
    } else execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', mov, '-c', 'copy', '-movflags', '+faststart', out]);
  }
  if (aout) {
    const m = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', '-i', out, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 });
    const s = m.stderr.slice(m.stderr.lastIndexOf('Summary:'));
    const I = Number(/I:\s+(-?[\d.]+) LUFS/.exec(s)?.[1]), P = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(s)?.[1]);
    loudness = { lufs: I, truePeak: P };
    log.push(`measured: ${I} LUFS integrated, true peak ${P} dBTP`);
  }
  if (!process.env.EDITEASY_KEEP_WORK) rmSync(work, { recursive: true, force: true });
  return { path: out, seconds: (Date.now() - t0) / 1000, loudness, log, credits };
}
