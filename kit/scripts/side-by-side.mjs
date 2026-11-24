// out/before-after.mp4: BEFORE | AFTER side by side with labels (half size each, AFTER audio).
//   node scripts/side-by-side.mjs <before.mp4> <after.mp4> [out.mp4]
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
const [b, a] = [resolve(process.argv[2] ?? '../out/raw-talking-9x16.before.mp4'), resolve(process.argv[3] ?? '../out/raw-talking-9x16.edit-final.mp4')];
const out = resolve(process.argv[4] ?? join(dirname(a), 'before-after.mp4'));
const label = (t) => `drawbox=x=0:y=0:w=iw:h=90:color=black@0.6:t=fill,drawtext=text='${t}':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=18`;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', b, '-i', a, '-filter_complex',
  `[0:v]scale=540:960,setsar=1,${label('BEFORE')}[l];[1:v]scale=540:960,setsar=1,${label('AFTER · Edit Easy MCP')}[r];[l][r]hstack=inputs=2:shortest=1,format=yuv420p[v]`,
  '-map', '[v]', '-map', '1:a', '-shortest', '-c:v', 'libx264', '-crf', '20', '-c:a', 'aac', '-b:a', '192k', out], { stdio: 'inherit' });
console.log('wrote', out);
