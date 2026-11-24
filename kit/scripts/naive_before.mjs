// BEFORE side of the demo (NOT an MCP tool): what a chat model without Edit Easy typically hands back, run as-is.
// One static caption, ffmpeg's default font, centred, no word timing, no safe-area or face check, no audio work.
// Labelled BEFORE so the comparison is fair: this is the typical "here's an ffmpeg command" answer, not a straw man.
//   node scripts/naive_before.mjs <clip.mp4> [out.mp4] ["caption text"]
import { execFileSync } from 'node:child_process';
import { basename, dirname, extname, join, resolve } from 'node:path';
const src = resolve(process.argv[2] ?? '../out/raw-talking-9x16.mp4');
const out = resolve(process.argv[3] ?? join(dirname(src), basename(src, extname(src)) + '.before.mp4'));
const text = (process.argv[4] ?? 'Looking at Earth from space').replace(/[:'\\]/g, '');
// the command a model typically writes: drawtext, default font, centre of frame, white with a thin border
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src,
  '-vf', `drawtext=text='${text}':fontcolor=white:fontsize=48:borderw=2:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2`,
  '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-c:a', 'copy', out], { stdio: 'inherit' });
console.log('wrote', out);
