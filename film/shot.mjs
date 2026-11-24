// usage: node shot.mjs <page path under /home/user/EditEasy> <out.png> [waitExpr]
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import { readFileSync, existsSync, statSync } from 'node:fs'; import { join, extname } from 'node:path';
const ROOT = '/home/user/EditEasy', T = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.wav': 'audio/wav', '.mp4': 'video/mp4' };
const srv = http.createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!existsSync(p) || statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': T[extname(p)] || 'application/octet-stream' }); r.end(readFileSync(p)); });
await new Promise(ok => srv.listen(0, ok));
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1280, height: 720 } }); pg.on('pageerror', e => console.log('ERR', e.message)); pg.on('console', m => m.type() === 'error' && console.log('CONSOLE', m.text()));
await pg.goto(`http://localhost:${srv.address().port}${process.argv[2]}`); await pg.waitForFunction(process.argv[4] || 'window.done', null, { timeout: 120000 });
console.log('ms', await pg.evaluate('window.ms')); await pg.screenshot({ path: process.argv[3] }); await b.close(); srv.close();
