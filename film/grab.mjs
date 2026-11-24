// node grab.mjs <act> <outPrefix> t1 t2 ...  -> <outPrefix>-<t>.jpg (1280x720) and a contact sheet <outPrefix>-sheet.jpg
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import { readFileSync, existsSync, statSync } from 'node:fs'; import { join, extname } from 'node:path'; import { execSync } from 'node:child_process';
const ROOT = '/home/user/EditEasy', T = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p) || statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': T[extname(p)] || 'application/octet-stream' }); r.end(readFileSync(p)); });
await new Promise(ok => srv.listen(0, ok));
const [act, pre, ...ts] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1280, height: 720 } }); pg.on('pageerror', e => console.log('PAGEERROR', e.message)); pg.on('console', m => m.type() === 'error' && console.log('CONSOLE', m.text()));
await pg.goto(`http://localhost:${srv.address().port}/hackathon/whackiest-2026/film-v5/acts/_act.html?act=${act}`); await pg.waitForFunction('window.ready', null, { timeout: 120000 });
const outs = [];
for (const t of ts) { await pg.evaluate(t => window.ACT.frame(+t), t); const f = `${pre}-${t}.jpg`; await (await pg.$('#c')).screenshot({ path: f, type: 'jpeg', quality: 88 }); outs.push(f); }
await b.close(); srv.close();
if (outs.length > 1) { const n = outs.length, cols = n <= 4 ? 2 : 3; execSync(`ffmpeg -y -loglevel error ${outs.map(f => `-i ${f}`).join(' ')} -filter_complex "${outs.map((_, i) => `[${i}]scale=640:360[s${i}]`).join(';')};${outs.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${n}:layout=${outs.map((_, i) => `${(i % cols) * 640}_${Math.floor(i / cols) * 360}`).join('|')}:fill=black" ${pre}-sheet.jpg`); }
console.log('ok', outs.length);
