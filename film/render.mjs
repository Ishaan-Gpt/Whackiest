// node render.mjs <act> <out.mp4> [fps=24] [workers=2]  -> renders ACT.frame(t) for t in [0,dur) to 1280x720 H.264
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import { readFileSync, existsSync, statSync, writeFileSync, mkdirSync } from 'node:fs'; import { join, extname } from 'node:path'; import { execSync, spawn } from 'node:child_process';
const ROOT = '/home/user/EditEasy', T = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p) || statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': T[extname(p)] || 'application/octet-stream' }); r.end(readFileSync(p)); });
await new Promise(ok => srv.listen(0, ok));
const [act, out, fpsA, wA] = process.argv.slice(2); const fps = +(fpsA || 24), W = +(wA || 2);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const url = `http://localhost:${srv.address().port}/hackathon/whackiest-2026/film-v5/acts/_act.html?act=${act}`;
const tmp = `/tmp/claude-0/-home-user/84b7a806-7b4c-5c4a-a78f-79418712ec15/scratchpad/r-${act}`; mkdirSync(tmp, { recursive: true });
const probe = await b.newPage({ viewport: { width: 1280, height: 720 } }); await probe.goto(url); await probe.waitForFunction('window.ready', null, { timeout: 120000 });
const dur = await probe.evaluate('window.ACT.dur'); await probe.close(); const N = Math.round(dur * fps); const t0 = Date.now();
await Promise.all(Array.from({ length: W }, async (_, w) => {
  const lo = Math.floor(N * w / W), hi = Math.floor(N * (w + 1) / W);
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } }); pg.on('pageerror', e => console.log('PAGEERROR', e.message));
  await pg.goto(url); await pg.waitForFunction('window.ready', null, { timeout: 120000 });
  for (let i = Math.max(0, lo - 12); i < hi; i++) { // 12-frame pre-roll so any per-page state settles
    const data = await pg.evaluate(t => { window.ACT.frame(t); return document.getElementById('c').toDataURL('image/jpeg', 0.92); }, i / fps);
    if (i >= lo) writeFileSync(`${tmp}/f${String(i).padStart(5, '0')}.jpg`, Buffer.from(data.split(',')[1], 'base64'));
    if (w === 0 && i % 48 === 0) console.log(act, i, '/', hi, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
}));
await b.close(); srv.close();
execSync(`ffmpeg -y -loglevel error -framerate ${fps} -i ${tmp}/f%05d.jpg -frames:v ${N} -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p ${out}`);
console.log('done', out, N, 'frames', ((Date.now() - t0) / 1000).toFixed(0) + 's');
