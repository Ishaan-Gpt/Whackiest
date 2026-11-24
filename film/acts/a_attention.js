// Act A: "attention is the money of every business". IN-WORLD. 26 s.
import { MooviFilm } from '../moovi-film.js';
const W = 1280, H = 720, GY = 610, TAU = Math.PI * 2;
let ctx, M, buf, bctx, ov, octx, L = {}, reel = null;
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, p) => a + (b - a) * p;
const seg = (t, a, b) => cl((t - a) / (b - a));
const eo3 = p => 1 - Math.pow(1 - p, 3), ei2 = p => p * p, ei3 = p => p * p * p;
const eio = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const eoX = p => p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);
const eoB = p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
const spr = (dt, k = 7, w = 16) => dt <= 0 ? 0 : 1 - Math.exp(-k * dt) * Math.cos(w * dt);
const imp = (dt, k = 9, w = 22) => dt <= 0 ? 0 : Math.exp(-k * dt) * Math.cos(w * dt);
const h1 = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const mk = (w, h, fn, blur) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); if (!blur) return c;
  const d = document.createElement('canvas'); d.width = w; d.height = h; const k = d.getContext('2d'); k.filter = `blur(${blur}px)`; k.drawImage(c, 0, 0); return d;
};
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const lg = (g, x0, y0, x1, y1, stops) => { const d = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => d.addColorStop(s[0], s[1])); return d; };
function glow(g, x, y, r, col, a = 1) {
  const d = g.createRadialGradient(x, y, 0, x, y, r); d.addColorStop(0, col); d.addColorStop(1, 'rgba(0,0,0,0)');
  g.save(); g.globalAlpha *= a; g.globalCompositeOperation = 'lighter'; g.fillStyle = d; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore();
}
function flare(g, x, y, r, a, col = 'rgba(255,214,150,1)') {
  glow(g, x, y, r, col, a * .55); glow(g, x, y, r * .3, 'rgba(255,246,225,1)', a);
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * .5; g.translate(x, y);
  for (const [sx, sy] of [[r * 1.7, 2.2], [3, r * .7]]) { const d = g.createRadialGradient(0, 0, 0, 0, 0, 1); d.addColorStop(0, col); d.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); g.scale(sx, sy); g.fillStyle = d; g.fillRect(-1, -1, 2, 2); g.restore(); }
  g.restore();
}
function steam(g, t, x, y, n, spread, height, a = .16) {
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) {
    const p = (t * (.32 + .12 * h1(i)) + h1(i + 9)) % 1, px = x + Math.sin(p * 4 + i * 1.7 + t * .6) * spread * (.2 + p) + p * p * spread * .8, py = y - Math.pow(p, .8) * height, r = 7 + p * 44;
    const d = g.createRadialGradient(px, py, 0, px, py, r); d.addColorStop(0, `rgba(255,248,240,${a * Math.sin(Math.pow(p, .6) * Math.PI)})`); d.addColorStop(1, 'rgba(255,248,240,0)');
    g.fillStyle = d; g.fillRect(px - r, py - r, 2 * r, 2 * r);
  } g.restore();
}
// Moovi: one render per frame; feet sit at 0.91 of his square canvas
const WT = [.6, 1.54, 2.4, 2.7, 3.34, 4.44, 4.8, 5.66, 6.2, 7.3, 7.62, 8.2, 9.02, 9.28, 9.76, 10.44, 10.72, 11.42, 11.56, 12.72, 13.0, 13.4, 14.78, 15.48, 16.48, 16.8, 17.58, 18.64, 19.16, 19.32, 20.2, 20.9, 21.18, 21.66, 22.98, 23.22, 23.68, 24.16, 24.66, 25.72, 26.0, 26.72, 26.9];
const talk = t => { let h = 0; for (const w of WT) { const x = t - w; if (x > 0 && x < .26) h += .05 * Math.sin(Math.PI * x / .26); } return h; };
function moovi(g, t, cx, footY, S, pose, flip) {
  const cv = M.render(t, { ...pose, hop: (pose.hop || 0) + talk(t) }); g.save(); g.translate(cx, footY - .91 * S); if (flip) g.scale(-1, 1); g.drawImage(cv, -S / 2, 0, S, S); g.restore();
}
function shadow(g, cx, y, rx, a) { g.save(); g.translate(cx, y); g.scale(1, .16); const d = g.createRadialGradient(0, 0, 0, 0, 0, rx); d.addColorStop(0, `rgba(10,8,20,${a})`); d.addColorStop(1, 'rgba(10,8,20,0)'); g.fillStyle = d; g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore(); }
// lime label with pixel type that types in with a block cursor
function label(g, t, t0, word, x, y, size, o = {}) {
  if (t < t0) return; const n = Math.min(word.length, Math.floor((t - t0) / .045) + 1), done = (t - t0) / .045 > word.length + 2;
  g.save(); g.font = `700 ${size}px "Silkscreen"`; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  const s = word.slice(0, n), full = g.measureText(word).width, w = g.measureText(s).width, pad = size * .36, gl = (t - t0) < .07 ? 6 : 0;
  g.translate(x - full / 2 + gl, y); g.fillStyle = 'rgba(10,10,20,.28)'; g.fillRect(-pad + 5, -size * .98 + 6, w + pad * 2 + (done ? 0 : size * .6), size * 1.34);
  g.fillStyle = o.col || '#D9F56B'; g.fillRect(-pad, -size * .98, w + pad * 2 + (done ? 0 : size * .6), size * 1.34);
  g.fillStyle = '#0E1A2B'; g.fillText(s, 0, 0); if (!done && Math.floor(t * 12) % 2 === 0 || !done && n < word.length) g.fillRect(w + 4, -size * .74, size * .46, size * .8);
  if (o.strike && t > o.strike) { g.fillStyle = '#0E1A2B'; g.fillRect(-6, -size * .42, (full + 12) * eo3(seg(t, o.strike, o.strike + .18)), size * .1); }
  if (done && !o.strike) { g.strokeStyle = '#D9F56B'; g.lineWidth = 4; const k = cl((t - t0 - .5) / .15); for (let i = 0; i < 3; i++) { const a = -1.25 + i * .5; g.beginPath(); g.moveTo(full + pad + 10 + Math.cos(a) * 6, -size - 4 + Math.sin(a) * 6); g.lineTo(full + pad + 10 + Math.cos(a) * (6 + 16 * k), -size - 4 + Math.sin(a) * (6 + 16 * k)); g.stroke(); } }
  g.restore();
}
function coin(g, x, y, r, spin, flat) {
  g.save(); g.translate(x, y);
  if (flat) { g.fillStyle = '#A8701C'; g.beginPath(); g.ellipse(0, 4, r, r * .36, 0, 0, TAU); g.fill(); g.fillStyle = lg(g, -r, 0, r, 0, [[0, '#F2B94A'], [.45, '#FFE9A6'], [1, '#E3A233']]); g.beginPath(); g.ellipse(0, 0, r, r * .36, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(160,100,20,.6)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(0, 0, r * .68, r * .23, 0, 0, TAU); g.stroke(); }
  else { const sx = Math.max(.12, Math.abs(Math.cos(spin))); g.scale(sx, 1); g.fillStyle = '#A8701C'; g.beginPath(); g.arc(2.5 / sx * (1 - sx), 0, r, 0, TAU); g.fill(); g.fillStyle = lg(g, -r, -r, r, r, [[0, '#FFF0B8'], [.5, '#F6C353'], [1, '#D8922A']]); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.strokeStyle = 'rgba(160,100,20,.7)'; g.lineWidth = 1.6; g.beginPath(); g.arc(0, 0, r * .68, 0, TAU); g.stroke(); g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(-r * .3, -r * .35, r * .22, r * .1, -.7, 0, TAU); g.fill(); }
  g.restore();
}
function heart(g, x, y, s, col) { g.save(); g.translate(x, y); g.scale(s / 20, s / 20); g.fillStyle = col; g.beginPath(); g.moveTo(0, 16); g.bezierCurveTo(-26, -2, -14, -22, 0, -8); g.bezierCurveTo(14, -22, 26, -2, 0, 16); g.fill(); g.restore(); }

/* ───────── street (prerendered depth layers) ───────── */
const SW = 2400;
function pFar(g) { for (let i = 0, x = -20; x < SW; i++) { const w = 70 + h1(i) * 110, h = 150 + h1(i + 40) * 230; g.fillStyle = ['#8A6C86', '#7A6384', '#96708A'][i % 3]; g.fillRect(x, 500 - h, w, h + 60); if (h1(i + 7) > .6) { g.fillRect(x + w * .3, 500 - h - 22, 26, 22); } for (let k = 0; k < 6; k++) if (h1(i * 9 + k) > .6) { g.fillStyle = 'rgba(255,205,130,.55)'; g.fillRect(x + 10 + h1(i + k) * (w - 24), 500 - h + 16 + k * 26, 9, 12); g.fillStyle = '#7A6384'; } x += w + 4; } }
function pMid(g) {
  for (let i = 0, x = -30; x < SW; i++) {
    const w = 150 + h1(i + 3) * 130, h = 250 + h1(i + 80) * 190, c = ['#4B3A58', '#5A4160', '#44365A', '#63485F'][i % 4]; g.fillStyle = c; g.fillRect(x, 520 - h, w, h + 40);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, 520 - h, w, 8);
    for (let r = 0; r < Math.floor(h / 62); r++) for (let k = 0; k < Math.floor(w / 46); k++) { const lit = h1(i * 31 + r * 7 + k) > .52, wx = x + 14 + k * 46, wy = 520 - h + 26 + r * 62; g.fillStyle = lit ? ['#FFC66E', '#FFD895', '#F7A95C'][(i + r + k) % 3] : 'rgba(20,16,36,.55)'; g.fillRect(wx, wy, 24, 32); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(wx + 11, wy, 2, 32); if (h1(i + r * 3 + k * 5) > .7) { g.fillStyle = 'rgba(30,22,40,.8)'; g.fillRect(wx - 5, wy + 32, 34, 4); for (let b = 0; b < 6; b++) g.fillRect(wx - 5 + b * 6.4, wy + 20, 2, 14); } }
    if (h1(i + 5) > .4) { g.fillStyle = '#2E2740'; g.fillRect(x + w * .55, 520 - h - 34, 34, 34); g.fillRect(x + w * .55 + 4, 520 - h - 44, 26, 12); }
    x += w + 2;
  }
  g.strokeStyle = 'rgba(20,14,30,.75)'; g.lineWidth = 2; for (let k = 0; k < 4; k++) { g.beginPath(); for (let x = 0; x <= SW; x += 20) { const u = (x % 480) / 480; g.lineTo(x, 190 + k * 13 + 34 * Math.sin(u * Math.PI)); } g.stroke(); }
  for (let x = 240; x < SW; x += 480) { g.fillStyle = '#2A2234'; g.fillRect(x - 5, 170, 10, 360); g.fillRect(x - 34, 182, 68, 6); }
}
const SIGNS = ['MOBILE', 'SWEETS', 'TAILOR', 'MEDICAL', 'KIRANA', 'PHOTO', 'JUICE', 'SAREES', 'CYCLE'];
function pShops(g) {
  for (let i = 0, x = -40; x < SW; i++) {
    const w = 230 + h1(i + 11) * 70, wall = ['#C9A27B', '#B98B76', '#A9B0A0', '#C4B08A'][i % 4], open = h1(i + 2) > .3;
    g.fillStyle = wall; g.fillRect(x, 330, w, 210); g.fillStyle = 'rgba(40,20,30,.25)'; g.fillRect(x, 330, w, 210);
    if (open) { g.fillStyle = lg(g, 0, 400, 0, 540, [[0, '#FFD389'], [1, '#E08E45']]); g.fillRect(x + 16, 404, w - 32, 136); g.fillStyle = 'rgba(70,35,25,.75)'; for (let s = 0; s < 3; s++) { g.fillRect(x + 22, 432 + s * 30, w - 44, 4); for (let k = 0; k < 9; k++) { g.fillStyle = ['#B8432F', '#2F6F73', '#E9C46A', '#5B7CFA'][(i + s + k) % 4]; g.fillRect(x + 28 + k * (w - 60) / 9, 416 + s * 30, 12, 16); } g.fillStyle = 'rgba(70,35,25,.75)'; } }
    else { g.fillStyle = '#7C7F8C'; g.fillRect(x + 16, 404, w - 32, 136); g.fillStyle = 'rgba(0,0,0,.2)'; for (let s = 0; s < 14; s++) g.fillRect(x + 16, 404 + s * 10, w - 32, 3); }
    const sc = ['#A8322A', '#1F5B4A', '#22406E', '#D9A441'][(i * 3 + 1) % 4]; g.fillStyle = sc; g.fillRect(x + 8, 338, w - 16, 54); g.strokeStyle = 'rgba(255,235,190,.8)'; g.lineWidth = 2; g.strokeRect(x + 13, 343, w - 26, 44);
    g.fillStyle = sc === '#D9A441' ? '#5A1E18' : '#FFE7A8'; g.font = '800 30px "Inter Tight"'; g.textAlign = 'center'; g.fillText(SIGNS[i % SIGNS.length], x + w / 2, 376);
    for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#EFE2C8' : ['#B8432F', '#2F6F73', '#D9A441'][i % 3]; g.beginPath(); g.moveTo(x + 6 + k * (w - 12) / 8, 394); g.lineTo(x + 6 + (k + 1) * (w - 12) / 8, 394); g.lineTo(x - 6 + (k + 1) * (w + 12) / 8, 428); g.lineTo(x - 6 + k * (w + 12) / 8, 428); g.fill(); }
    g.fillStyle = 'rgba(30,18,30,.5)'; g.fillRect(x - 2, 330, 4, 210); x += w;
  }
}
const FGP = [[72, 1.25], [352, 1.05], [995, 1.3], [1395, 1.1], [1900, 1.2]];
function pFg(g) { // near blurred crowd, backs of heads with raised phones (screens added live)
  g.fillStyle = '#17121F'; FGP.forEach(([x, s]) => { g.beginPath(); g.ellipse(x, 640, 62 * s, 74 * s, 0, 0, TAU); g.fill(); rr(g, x - 130 * s, 700 - 10 * s, 260 * s, 300, 80); g.fill(); g.save(); g.translate(x + 150 * s, 640); g.rotate(-.12); g.fillRect(-16 * s, -40, 34 * s, 300); rr(g, -48 * s, -190 * s, 96 * s, 170 * s, 12); g.fill(); g.restore(); });
}
function person(g, x, by, s, lit, dir, i) {
  g.save(); g.translate(x, by); g.scale(s * dir, s); const cloth = ['#3A2E48', '#4A2F3A', '#2E3A4E', '#51403A'][i % 4];
  g.fillStyle = cloth; rr(g, -34, -128, 68, 140, [26, 26, 6, 6]); g.fill();
  g.fillStyle = '#2A1F2C'; g.beginPath(); g.ellipse(4 * lit, -152, 21, 24, 0, 0, TAU); g.fill();
  g.strokeStyle = cloth; g.lineWidth = 15; g.lineCap = 'round'; g.beginPath(); g.moveTo(22, -104); g.lineTo(40, -84); g.lineTo(46, -118); g.stroke();
  g.fillStyle = '#0B0D14'; rr(g, 38, -146, 18, 32, 3); g.fill();
  if (lit > 0) { g.fillStyle = `rgba(207,230,247,${lit})`; rr(g, 39.5, -144, 15, 28, 2); g.fill(); g.save(); g.beginPath(); g.ellipse(4 * lit, -152, 21, 24, 0, 0, TAU); g.clip(); const d = g.createRadialGradient(34, -140, 0, 34, -140, 42); d.addColorStop(0, `rgba(190,220,255,${.85 * lit})`); d.addColorStop(1, 'rgba(190,220,255,0)'); g.fillStyle = d; g.fillRect(-30, -180, 80, 60); g.restore(); glow(g, 47, -130, 46, 'rgba(150,190,255,1)', .5 * lit); }
  g.restore();
}
const CROWD = [[70, 566, .92, 1], [215, 590, 1.12, 1], [345, 556, .86, 1], [905, 558, .88, -1], [1010, 592, 1.12, -1], [1150, 566, .95, -1], [1245, 598, 1.2, -1], [-40, 600, 1.2, 1], [470, 548, .78, 1], [800, 548, .78, -1]];
function streetBg(g, cam, z, k, dusk) { // k: 0 sharp-ish set, 1 deep-DOF set
  g.fillStyle = lg(g, 0, 0, 0, 540, [[0, '#35406F'], [.38, '#8A5E86'], [.7, '#F0966A'], [1, '#FFD08C']]); g.fillRect(0, 0, W, H);
  glow(g, 760 - cam * .05, 430, 520, 'rgba(255,200,120,1)', .5);
  const set = k ? [L.far1, L.mid1, L.shops1] : [L.far0, L.mid0, L.shops0];
  [.12, .3, .55].forEach((d, i) => { const s = 1 + (z - 1) * (.3 + i * .25); g.save(); g.translate(640, 440); g.scale(s, s); g.translate(-640, -440); g.drawImage(set[i], -((cam * d) % (SW - W - 40)) - 20, 0); g.restore(); });
  g.fillStyle = lg(g, 0, 532, 0, H, [[0, '#6A4C58'], [.25, '#523C4C'], [1, '#261E2C']]); g.fillRect(0, 532, W, H - 532);
  g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 7; i++) { const x = ((i * 310 - cam * .55) % 1900 + 1900) % 1900 - 300; g.save(); g.translate(x, 548); g.scale(1, .18); const d = g.createRadialGradient(0, 0, 0, 0, 0, 190); d.addColorStop(0, 'rgba(255,180,100,.34)'); d.addColorStop(1, 'rgba(255,180,100,0)'); g.fillStyle = d; g.fillRect(-190, -190, 380, 600); g.restore(); } g.restore();
  if (dusk) { g.fillStyle = `rgba(14,18,44,${dusk})`; g.fillRect(0, 0, W, H); }
}
function bulbs(g, t, cam, y0, a = 1) { for (let i = 0; i < 26; i++) { const x = ((i * 92 - cam * .7) % 2300 + 2300) % 2300 - 400, u = ((x + cam * .7) % 460 + 460) % 460 / 460, y = y0 + 46 * Math.sin(u * Math.PI); const tw = .7 + .3 * Math.sin(t * 3 + i * 2.1); glow(g, x, y, 26, 'rgba(255,205,130,1)', .8 * tw * a); g.fillStyle = `rgba(255,244,214,${a})`; g.beginPath(); g.arc(x, y, 3.4, 0, TAU); g.fill(); } }

function stMoovi(g, t) { // lands from the title, then looks from phone to phone
  const p = seg(t, .6, 1.02), mx = lerp(830, 640, eio(p)), my = lerp(352, GY, p) - 190 * Math.sin(Math.PI * p), S = lerp(300, 450, eo3(p));
  if (t < .6) return; shadow(g, mx, GY + 6, 170, .5 * seg(t, .9, 1.02));
  const lk = Math.sin((t - 1.3) * 2.6) * cl((t - 1.2) * 2), dt = t - 1.02;
  const ch = seg(t, 6.25, 6.75), lx = t < 4.4 ? .85 * lk : lerp(.85 * lk, .8, eio(seg(t, 4.4, 4.8)));
  moovi(g, t, mx, my - 46 * Math.sin(Math.PI * ch), S, { direct: eoB(seg(t, 4.55, 4.95)) * (1 - eo3(seg(t, 5.95, 6.3))), look: [t < 1.1 ? -.4 : lx, t < 1.02 ? -.4 : .12], squash: p < 1 ? .5 * Math.sin(Math.PI * p) : -.9 * imp(dt, 8, 19) - .45 * seg(t, 6.05, 6.25) * (1 - ch), lean: .5 * seg(t, 2.3, 2.8) * (1 - seg(t, 3.6, 4)) + .5 * seg(t, 6.3, 7), shadow: p < 1 ? 0 : .9, turn: t < 4.4 ? .25 * lk : .25 * lk * (1 - seg(t, 4.4, 4.8)) + .3 * seg(t, 6.3, 7) });
}
function sStreet(g, t) {
  const z = 1 + .3 * (1 - eo3(seg(t, .6, 1.6))) + .05 * seg(t, 1, 4.2) + .07 * eio(seg(t, 4.2, 7)), cam = 80 + t * 46 + 170 * ei2(seg(t, 4.3, 7));
  streetBg(g, cam, z, 0, 0);
  g.save(); g.translate(640, 440); g.scale(z, z); g.translate(-640, -440);
  bulbs(g, t, cam, 290);
  // shop signs fight for the eye: neon flares fire in turn
  for (let i = 0; i < 5; i++) { const ph = (t * 1.6 + i * .37) % 1.85, a = ph < .5 ? Math.sin(ph / .5 * Math.PI) : 0; const a2 = Math.max(0, 1 - Math.abs(t - (4.5 + i * .3)) / .28); if (a2 > 0) flare(g, ((180 + i * 265 - cam * .55) % 1500 + 1500) % 1500 - 100, 364, 170, a2 * 1.2); if (a > 0 && t > 1.1) flare(g, ((180 + i * 265 - cam * .55) % 1500 + 1500) % 1500 - 100, 364, 90, a * .8, i % 2 ? 'rgba(255,120,110,1)' : 'rgba(255,214,150,1)'); }
  const px = -(cam - 80) * .35;
  CROWD.forEach(([x, by, s, dir], i) => { const t0 = 1.25 + ((i * 7) % 10) * .2, lit = cl(spr(t - t0, 9, 20)) * (.8 + .2 * Math.sin(t * 9 + i)); person(g, x + px * s, by, s, t > t0 ? lit : 0, dir, i); if (t > t0 && t > 2.7) { const hp = ((t - 2.7) * .85 + h1(i + 77)) % 1; g.save(); g.globalAlpha = Math.sin(hp * Math.PI) * .9; heart(g, x + px * s + 47 * s * dir + 8 * Math.sin(hp * 6 + i), by - 150 * s - hp * 110, 7 + 8 * hp, i % 3 ? '#FF4D6D' : '#F7FAFD'); g.restore(); } });
  stMoovi(g, t);
  g.restore();
  // near crowd, out of focus, phones glowing
  const fx = -((cam - 80) * 1.5) - 40, fa = eo3(seg(t, .85, 1.5));
  g.save(); g.translate(0, (1 - fa) * 220 + 170 * eio(seg(t, 4.2, 5.4))); g.drawImage(L.fg, fx, 0);
  FGP.forEach(([x, s], i) => { const t0 = 1.12 + i * .27, a = cl(spr(t - t0, 9, 20)); if (t > t0) { g.save(); g.translate(fx + x + 150 * s, 640); g.rotate(-.12); g.filter = 'blur(5px)'; g.globalAlpha = .95 * a; g.fillStyle = lg(g, 0, -180 * s, 0, -30 * s, [[0, i % 2 ? '#CFE6F7' : '#F7FAFD'], [.55, i % 2 ? '#5B7CFA' : '#CFE6F7'], [1, i % 2 ? '#2B3A8C' : '#8FB4F2']]); rr(g, -40 * s, -180 * s, 80 * s, 150 * s, 8); g.fill(); g.fillStyle = '#FF4D6D'; g.beginPath(); g.arc(24 * s, -60 * s, 9 * s, 0, TAU); g.fill(); g.filter = 'none'; g.restore(); glow(g, fx + x + 150 * s, 540, 190, 'rgba(140,185,255,1)', .32 * a); } });
  g.restore();
  label(g, t, 3.34, 'attention', 640, 150, 54);
}

/* ───────── chai stall + online shop ───────── */
function stall(g, t, x) {
  const top = 420; g.save(); g.translate(x, 0);
  g.fillStyle = '#4A2D1A'; g.fillRect(14, 150, 14, 460); g.fillRect(436, 150, 14, 460);
  for (let k = 0; k < 12; k++) { g.fillStyle = k % 2 ? '#F1E3C6' : '#B8432F'; g.beginPath(); g.moveTo(-6 + k * 40, 122); g.lineTo(34 + k * 40, 122); g.lineTo(28 + k * 42 - 14, 186); g.arc(8 + k * 42 - 14, 186, 20, 0, Math.PI); g.fill(); }
  g.fillStyle = 'rgba(40,10,10,.28)'; g.fillRect(-16, 176, 500, 14);
  // hand-painted board
  g.save(); g.translate(150, 250); g.rotate(.03 * Math.sin(t * 1.3)); g.strokeStyle = '#2A1A12'; g.lineWidth = 2; g.beginPath(); g.moveTo(-70, -48); g.lineTo(-70, -80); g.moveTo(70, -48); g.lineTo(70, -80); g.stroke();
  g.fillStyle = '#1F5B4A'; rr(g, -104, -48, 208, 96, 6); g.fill(); g.strokeStyle = '#F2C14E'; g.lineWidth = 3; rr(g, -97, -41, 194, 82, 4); g.stroke();
  g.font = 'italic 76px "Instrument Serif"'; g.textAlign = 'center'; g.fillStyle = '#A8322A'; g.fillText('Chai', 3, 25); g.fillStyle = '#FFD46B'; g.fillText('Chai', 0, 22);
  g.fillStyle = '#F2C14E'; for (const sx of [-82, 82]) { g.beginPath(); g.arc(sx, 0, 4, 0, TAU); g.fill(); } g.restore();
  // cart
  g.fillStyle = lg(g, 0, top, 0, 560, [[0, '#2E6C8E'], [1, '#1E4A66']]); g.fillRect(10, top + 12, 444, 128);
  g.strokeStyle = '#F2C14E'; g.lineWidth = 2.5; for (let k = 0; k < 6; k++) { const cx = 48 + k * 74; g.beginPath(); g.moveTo(cx, top + 34); g.lineTo(cx + 26, top + 76); g.lineTo(cx, top + 118); g.lineTo(cx - 26, top + 76); g.closePath(); g.stroke(); g.fillStyle = '#E8563F'; g.beginPath(); g.arc(cx, top + 76, 7, 0, TAU); g.fill(); }
  g.fillStyle = lg(g, 0, top - 4, 0, top + 16, [[0, '#B87A45'], [1, '#7A4B2A']]); rr(g, -4, top - 2, 472, 18, 4); g.fill(); g.fillStyle = 'rgba(255,220,160,.5)'; g.fillRect(0, top - 2, 464, 2.5);
  for (const wx of [80, 384]) { g.strokeStyle = '#231A17'; g.lineWidth = 9; g.beginPath(); g.arc(wx, 566, 42, 0, TAU); g.stroke(); g.lineWidth = 3; for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(wx, 566); g.lineTo(wx + 40 * Math.cos(k * .785), 566 + 40 * Math.sin(k * .785)); g.stroke(); } g.fillStyle = '#8A8F96'; g.beginPath(); g.arc(wx, 566, 7, 0, TAU); g.fill(); }
  // stove, flame, kettle
  g.fillStyle = '#23262C'; rr(g, 40, top - 24, 120, 24, 4); g.fill(); g.fillStyle = '#3A3F48'; g.fillRect(52, top - 30, 96, 6);
  for (let k = 0; k < 7; k++) { const fx = 64 + k * 12, fh = 9 + 6 * Math.sin(t * 17 + k * 2.3); g.fillStyle = 'rgba(90,150,255,.9)'; g.beginPath(); g.ellipse(fx, top - 30 - fh / 2, 4, fh / 2 + 2, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,190,90,.8)'; g.beginPath(); g.ellipse(fx, top - 36 - fh / 2, 2, fh / 3, 0, 0, TAU); g.fill(); }
  glow(g, 100, top - 36, 60, 'rgba(110,160,255,1)', .5);
  const ky = top - 44; g.strokeStyle = '#3A3F48'; g.lineWidth = 6; g.beginPath(); g.arc(100, ky - 62, 44, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
  g.fillStyle = lg(g, 40, 0, 160, 0, [[0, '#7E858E'], [.3, '#F1F3F5'], [.55, '#B9C0C8'], [1, '#6A7079']]);
  g.beginPath(); g.moveTo(146, ky - 40); g.quadraticCurveTo(176, ky - 52, 190, ky - 86); g.lineTo(200, ky - 82); g.quadraticCurveTo(190, ky - 30, 150, ky - 14); g.fill();
  g.beginPath(); g.moveTo(52, ky + 8); g.quadraticCurveTo(38, ky - 34, 62, ky - 66); g.lineTo(138, ky - 66); g.quadraticCurveTo(162, ky - 34, 148, ky + 8); g.closePath(); g.fill();
  g.fillStyle = '#9AA1AA'; g.beginPath(); g.ellipse(100, ky - 66, 39, 8, 0, 0, TAU); g.fill(); g.fillStyle = '#2B2F36'; g.beginPath(); g.arc(100, ky - 76, 7, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,190,110,.45)'; g.beginPath(); g.ellipse(128, ky - 30, 7, 30, .15, 0, TAU); g.fill();
  // glasses of chai
  for (let k = 0; k < 5; k++) { const gx = 232 + k * 31, gy = top - 2; g.fillStyle = lg(g, 0, gy - 34, 0, gy, [[0, '#D9A066'], [1, '#8A4B1E']]); g.beginPath(); g.moveTo(gx - 11, gy - 34); g.lineTo(gx + 11, gy - 34); g.lineTo(gx + 8, gy); g.lineTo(gx - 8, gy); g.fill(); g.fillStyle = '#F3DDB8'; g.fillRect(gx - 11, gy - 36, 22, 4); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(gx - 12, gy - 42); g.lineTo(gx - 8, gy); g.lineTo(gx + 8, gy); g.lineTo(gx + 12, gy - 42); g.stroke(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(gx - 7, gy - 30, 2.5, 22); }
  // biscuit jar and the coin plate
  g.fillStyle = 'rgba(220,235,245,.28)'; rr(g, 392, top - 76, 52, 74, 9); g.fill(); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5; g.stroke(); for (let k = 0; k < 9; k++) { g.fillStyle = k % 2 ? '#C98A4B' : '#E0B070'; g.beginPath(); g.ellipse(404 + (k % 3) * 14, top - 14 - Math.floor(k / 3) * 15, 9, 6, h1(k), 0, TAU); g.fill(); } g.fillStyle = '#B8432F'; rr(g, 388, top - 88, 60, 14, 4); g.fill();
  g.restore();
  steam(g, t, x + 196, top - 132, 16, 34, 210, .2); steam(g, t + 3, x + 100, top - 122, 8, 22, 150, .12); steam(g, t + 7, x + 294, top - 44, 10, 40, 110, .09);
  // warm bulb
  const bx = x + 330, by = 236 + 3 * Math.sin(t * 1.1); g.strokeStyle = '#1B1414'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 326, 186); g.lineTo(bx, by - 16); g.stroke(); g.fillStyle = '#3A2A20'; g.fillRect(bx - 6, by - 20, 12, 10);
  g.fillStyle = '#FFF3D0'; g.beginPath(); g.arc(bx, by, 13, 0, TAU); g.fill(); flare(g, bx, by, 170, .85 + .08 * Math.sin(t * 7));
  glow(g, x + 240, top + 10, 300, 'rgba(255,170,80,1)', .2);
}
function shopUI(g, t, x, a) {
  const y = 96, w = 440, h = 496; g.save(); g.translate(x + w / 2, y + h / 2); const s = lerp(.82, 1, a); g.scale(s, s); g.translate(-w / 2, -h / 2); g.globalAlpha = cl(a * 1.6);
  g.shadowColor = 'rgba(8,10,30,.5)'; g.shadowBlur = 50; g.shadowOffsetY = 24; g.fillStyle = '#FBFAF7'; rr(g, 0, 0, w, h, 18); g.fill(); g.shadowColor = 'transparent';
  g.save(); rr(g, 0, 0, w, h, 18); g.clip();
  g.fillStyle = '#EEECE7'; g.fillRect(0, 0, w, 40); for (let k = 0; k < 3; k++) { g.fillStyle = ['#E8695C', '#EDBB4E', '#6DC06A'][k]; g.beginPath(); g.arc(20 + k * 17, 20, 5, 0, TAU); g.fill(); }
  g.fillStyle = '#fff'; rr(g, 96, 9, 250, 22, 11); g.fill(); g.fillStyle = '#6B7280'; g.font = '500 12px "Inter Tight"'; g.textAlign = 'center'; g.fillText('chaiwala.shop', 221, 24);
  g.textAlign = 'left'; g.fillStyle = '#0E1A2B'; g.font = 'italic 28px "Instrument Serif"'; g.fillText('Chaiwala', 24, 76); g.font = '600 13px "Inter Tight"'; g.fillStyle = '#4B5563'; g.fillText('Shop', 236, 72); g.fillText('Our story', 286, 72);
  // cart
  const added = t > 10.44, pop = added ? 1 + .5 * imp(t - 10.44, 8, 20) : 1; g.strokeStyle = '#0E1A2B'; g.lineWidth = 2; g.lineJoin = 'round'; g.beginPath(); g.moveTo(386, 58); g.lineTo(392, 58); g.lineTo(397, 74); g.lineTo(414, 74); g.lineTo(417, 63); g.lineTo(394, 63); g.stroke(); g.fillStyle = '#0E1A2B'; g.beginPath(); g.arc(399, 80, 2.4, 0, TAU); g.arc(412, 80, 2.4, 0, TAU); g.fill();
  if (added) { g.fillStyle = '#E8563F'; g.beginPath(); g.arc(418, 57, 6 * pop, 0, TAU); g.fill(); }
  // hero
  g.fillStyle = lg(g, 0, 96, w, 230, [[0, '#F6D9A8'], [1, '#E9A45C']]); rr(g, 20, 96, w - 40, 138, 14); g.fill(); g.fillStyle = '#3A1E10'; g.font = '700 23px "Inter Tight"'; g.fillText('Masala chai,', 40, 148); g.fillText('at your door.', 40, 176); g.fillStyle = '#0E1A2B'; rr(g, 40, 192, 96, 28, 14); g.fill(); g.fillStyle = '#fff'; g.font = '600 12px "Inter Tight"'; g.fillText('Shop blends', 54, 210);
  const gx = 340, gy = 214; g.fillStyle = lg(g, 0, gy - 80, 0, gy, [[0, '#C98A4B'], [1, '#7A3F18']]); g.beginPath(); g.moveTo(gx - 28, gy - 84); g.lineTo(gx + 28, gy - 84); g.lineTo(gx + 20, gy); g.lineTo(gx - 20, gy); g.fill(); g.fillStyle = '#F7E6C6'; g.fillRect(gx - 28, gy - 88, 56, 8); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(gx - 18, gy - 74, 5, 60); steam(g, t, x - x + gx, gy - 92, 5, 10, 40, .3);
  // products
  [['Masala blend', '#DDE8D6', '#3F6B4E'], ['Kulhad set', '#F1DDD0', '#B5653A']].forEach(([nm, bg, fg], k) => {
    const cx = 20 + k * 206, cy = 250; g.fillStyle = '#fff'; g.shadowColor = 'rgba(20,20,40,.1)'; g.shadowBlur = 14; g.shadowOffsetY = 4; rr(g, cx, cy, 194, 226, 14); g.fill(); g.shadowColor = 'transparent';
    g.fillStyle = bg; rr(g, cx + 8, cy + 8, 178, 120, 10); g.fill(); g.fillStyle = fg;
    if (k === 0) { rr(g, cx + 68, cy + 30, 58, 82, 6); g.fill(); g.fillStyle = '#F4EBD3'; g.fillRect(cx + 68, cy + 54, 58, 30); g.fillStyle = fg; g.font = 'italic 17px "Instrument Serif"'; g.textAlign = 'center'; g.fillText('masala', cx + 97, cy + 75); g.textAlign = 'left'; }
    else for (let c = 0; c < 3; c++) { const ux = cx + 56 + c * 42, uy = cy + 108 - (c === 1 ? 6 : 0); g.fillStyle = c === 1 ? '#C97A48' : fg; g.beginPath(); g.moveTo(ux - 18, uy - 44); g.lineTo(ux + 18, uy - 44); g.lineTo(ux + 12, uy); g.lineTo(ux - 12, uy); g.fill(); g.fillStyle = '#7A3F18'; g.beginPath(); g.ellipse(ux, uy - 44, 18, 5, 0, 0, TAU); g.fill(); }
    g.fillStyle = '#0E1A2B'; g.font = '600 15px "Inter Tight"'; g.fillText(nm, cx + 12, cy + 152); g.fillStyle = '#8A93A0'; g.font = '500 12px "Inter Tight"'; g.fillText(k ? 'Hand-thrown clay cups' : 'Slow-roasted whole spice', cx + 12, cy + 170);
    const on = k === 0 && added, pr = k === 0 ? 1 - .06 * cl(1 - Math.abs(t - 10.44) / .09) : 1; g.save(); g.translate(cx + 97, cy + 198); g.scale(pr, pr); g.fillStyle = on ? '#2E7D5B' : '#0E1A2B'; rr(g, -85, -15, 170, 30, 15); g.fill(); g.fillStyle = '#fff'; g.font = '600 13px "Inter Tight"'; g.textAlign = 'center'; g.fillText(on ? 'Added to cart' : 'Add to cart', 0, 5); g.restore(); g.textAlign = 'left';
  });
  // cursor
  const cp = eio(seg(t, 9.7, 10.4)), ux = lerp(380, 130, cp), uy = lerp(560, 452, cp) + (t > 10.4 && t < 10.5 ? 2 : 0); if (t > 9.6) { g.save(); g.translate(ux, uy); g.fillStyle = '#0E1A2B'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 22); g.lineTo(6, 17); g.lineTo(10, 26); g.lineTo(14, 24); g.lineTo(10, 15); g.lineTo(17, 15); g.closePath(); g.fill(); g.stroke(); g.restore(); }
  g.restore(); g.restore();
  if (a > .5) glow(g, x + w / 2, 620, 300, 'rgba(180,210,255,1)', .14 * a);
}
function parcel(g, x, y, sz, rot) { g.save(); g.translate(x, y); g.rotate(rot); g.shadowColor = 'rgba(10,8,20,.35)'; g.shadowBlur = 16; g.shadowOffsetY = 8; g.fillStyle = lg(g, -sz, -sz, sz, sz, [[0, '#D9A66B'], [1, '#B07A40']]); rr(g, -sz, -sz * .8, sz * 2, sz * 1.6, sz * .12); g.fill(); g.shadowColor = 'transparent'; g.fillStyle = '#F1E3C6'; g.fillRect(-sz * .16, -sz * .8, sz * .32, sz * 1.6); g.fillStyle = 'rgba(90,50,20,.25)'; g.fillRect(-sz, -sz * .1, sz * 2, sz * .06); g.fillStyle = '#fff'; rr(g, sz * .3, sz * .2, sz * .55, sz * .4, 3); g.fill(); heart(g, sz * .57, sz * .42, sz * .2, '#FF4D6D'); g.restore(); }
function sChai(g, t) {
  const pan = eio(seg(t, 8.5, 9.15)), z = 1.22 - .08 * seg(t, 7, 8.5) - .1 * pan + .05 * seg(t, 9.2, 12.6), cam = 790 + (t - 7) * 34 + pan * 260;
  streetBg(g, cam, 1.05, 1, .12);
  g.save(); g.translate(640 - 70 * ei2(seg(t, 11.1, 12.6)), 460); g.scale(z, z); g.translate(-640, -460);
  bulbs(g, t, cam, 150, .7);
  const sx = lerp(215, 30, pan), mx = lerp(900, 664, pan), S = lerp(450, 420, pan);
  shadow(g, sx + 232, GY + 6, 330, .55); stall(g, t, sx);
  const ua = eoX(seg(t, 8.7, 9.35)), ux = lerp(1500, 818, ua); if (ua > 0) { shadow(g, lerp(1560, 1040, ua), GY - 6, 260, .4 * ua); shopUI(g, t, ux, ua); }
  shadow(g, mx, GY + 6, 160, .5);
  const dir = eoB(seg(t, 7.25, 7.65)) * (1 - eo3(seg(t, 8.45, 8.8)));
  const lookS = t < 8.85 ? -.8 : t < 9.95 ? lerp(-.8, .85, eio(seg(t, 8.85, 9.12))) : t < 10.25 ? lerp(.85, -.7, eio(seg(t, 9.95, 10.2))) : lerp(-.7, .85, eio(seg(t, 10.25, 10.7)));
  const cel = eoB(seg(t, 11.25, 11.6)) * (1 - seg(t, 12.3, 12.6)) * .8, hp2 = seg(t, 11.2, 11.62);
  moovi(g, t, mx, GY - 30 * Math.sin(Math.PI * seg(t, 8.53, 9.0)) - 34 * Math.sin(Math.PI * hp2), S, { direct: cl(dir, 0, 1.1), celebrate: cl(cel, 0, 1), look: [-lookS, .5 * seg(t, 11.2, 11.5)], lean: .4 * dir, squash: -.5 * imp(t - 9.0, 9, 20) * (t > 9.0 ? 1 : 0) - .5 * imp(t - 11.62, 9, 20) * (t > 11.62 ? 1 : 0) }, true);
  // "chai stall": Moovi flips coins onto the counter
  for (let i = 0; i < 3; i++) { const t0 = 7.62 + i * .16, p = seg(t, t0, t0 + .46); if (t < t0) continue; const tx = sx + 336 + i * 15 - (i === 2 ? 22 : 0), ty = 412 - (i === 2 ? 7 : 0), x0 = mx - 150, y0 = 400; if (p < 1) coin(g, lerp(x0, tx, p), lerp(y0, ty, p) - 150 * Math.sin(Math.PI * p), 11, p * 14); else { const b = Math.abs(imp(t - t0 - .46, 7, 18)) * 14; coin(g, tx, ty - b, 12, 0, true); if (t - t0 - .46 < .25) glow(g, tx, ty, 34, 'rgba(255,230,150,1)', 1 - (t - t0 - .46) / .25); } }
  // "that same chai": a glass leaves the stall and lands in the shop
  const gp = seg(t, 10.2, 10.74); if (gp > 0 && gp < 1) { const q = eio(gp), x = lerp(sx + 356, ux + 340, q), y = lerp(400, 250, q) - 230 * Math.sin(Math.PI * q); g.save(); g.translate(x, y); g.rotate(Math.sin(q * Math.PI) * -.5); const k = 1 + .6 * Math.sin(Math.PI * q); g.scale(k, k); g.fillStyle = lg(g, 0, -34, 0, 0, [[0, '#D9A066'], [1, '#8A4B1E']]); g.beginPath(); g.moveTo(-11, -34); g.lineTo(11, -34); g.lineTo(8, 0); g.lineTo(-8, 0); g.fill(); g.fillStyle = '#F3DDB8'; g.fillRect(-11, -36, 22, 4); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-12, -42); g.lineTo(-8, 0); g.lineTo(8, 0); g.lineTo(12, -42); g.stroke(); g.restore(); steam(g, t, x, y - 40, 4, 8, 40, .25); }
  if (t > 10.74 && t < 11.1) flare(g, ux + 340, 250, 120, 1 - (t - 10.74) / .36);
  // "to the whole country": parcels fan out of the shop
  for (let i = 0; i < 9; i++) { const t0 = 11.16 + i * .13, p = seg(t, t0, t0 + .95); if (p <= 0 || p >= 1) continue; const q = eo3(p), an = -2.75 + i * .33 + (i % 2) * .12, d = 950 * q; parcel(g, ux + 220 + Math.cos(an) * d, 330 + Math.sin(an) * d * .8 + 260 * p * p, 16 + 44 * q, (h1(i) - .5) * 1.2 + p * (i % 2 ? 2.4 : -2.4)); }
  g.restore();
}

/* ───────── recording phone held up in the foreground; its viewfinder is the live scene ───────── */
function handPhone(g, x, y, sx0, sy0, rot, t) {
  const sw = 150, sh = 290; g.save(); g.translate(x, y + 5 * Math.sin(t * 1.9)); g.rotate(rot + .012 * Math.sin(t * 2.6));
  g.fillStyle = '#6B432C'; rr(g, -sw / 2 - 30, 60, 60, 420, 28); g.fill(); g.fillStyle = '#7A4E33'; rr(g, -60, 110, 150, 400, 50); g.fill();
  g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 30; g.shadowOffsetY = 12; g.fillStyle = '#0B0D14'; rr(g, -sw / 2 - 7, -sh / 2 - 7, sw + 14, sh + 14, 24); g.fill(); g.shadowColor = 'transparent';
  g.save(); rr(g, -sw / 2, -sh / 2, sw, sh, 17); g.clip(); g.drawImage(g.canvas, sx0, sy0, 310, 600, -sw / 2, -sh / 2, sw, sh);
  g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(-sw / 2, sh / 2 - 54, sw, 54); g.fillRect(-sw / 2, -sh / 2, sw, 30);
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2; for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { g.beginPath(); g.moveTo(cx * 50, cy * 80 - cy * 16); g.lineTo(cx * 50, cy * 80); g.lineTo(cx * 50 - cx * 16, cy * 80); g.stroke(); }
  if (Math.sin(t * 6) > -.3) { g.fillStyle = '#FF3B30'; g.beginPath(); g.arc(-sw / 2 + 18, -sh / 2 + 15, 5, 0, TAU); g.fill(); } g.fillStyle = '#fff'; g.font = '700 11px "Inter Tight"'; g.textAlign = 'left'; g.fillText('REC', -sw / 2 + 28, -sh / 2 + 19);
  g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(0, sh / 2 - 27, 17, 0, TAU); g.stroke(); g.fillStyle = '#FF3B30'; rr(g, -8, sh / 2 - 35, 16, 16, 4); g.fill(); g.restore();
  g.fillStyle = '#8A5A3C'; for (let k = 0; k < 4; k++) { rr(g, sw / 2 - 12, -40 + k * 40, 42, 30, 15); g.fill(); } rr(g, -sw / 2 - 30, 20, 44, 88, 20); g.fill();
  g.restore();
}

/* ───────── coaching class ───────── */
function pClass(g) {
  g.fillStyle = '#EADFC8'; g.fillRect(0, 0, 1700, 440); g.fillStyle = '#7FA39C'; g.fillRect(0, 440, 1700, 130); g.fillStyle = '#4E6F6A'; g.fillRect(0, 436, 1700, 6); g.fillStyle = lg(g, 0, 570, 0, 720, [[0, '#8E7C69'], [1, '#5E5146']]); g.fillRect(0, 570, 1700, 150);
  g.fillStyle = '#B9BEC4'; rr(g, 470, 112, 700, 316, 6); g.fill(); g.fillStyle = '#FDFDFB'; g.fillRect(482, 124, 676, 292); g.fillStyle = '#9AA0A7'; g.fillRect(560, 428, 520, 10); g.fillStyle = '#E8563F'; g.fillRect(600, 420, 36, 8); g.fillStyle = '#2B4EA8'; g.fillRect(650, 420, 36, 8);
  g.fillStyle = '#1B2A5E'; g.font = 'italic 46px "Instrument Serif"'; g.fillText('Laws of motion', 520, 186); g.strokeStyle = '#D93A2B'; g.lineWidth = 3; g.beginPath(); g.moveTo(520, 198); g.quadraticCurveTo(650, 208, 786, 196); g.stroke();
  g.strokeStyle = '#1B2A5E'; g.lineWidth = 3; g.strokeRect(560, 300, 90, 60); g.beginPath(); g.moveTo(520, 360); g.lineTo(760, 360); g.moveTo(650, 330); g.lineTo(730, 330); g.lineTo(716, 320); g.moveTo(730, 330); g.lineTo(716, 340); g.stroke(); g.font = 'italic 30px "Instrument Serif"'; g.fillText('F', 736, 318); g.fillText('m', 592, 340);
  g.beginPath(); g.moveTo(850, 380); g.lineTo(850, 230); g.moveTo(850, 380); g.lineTo(1110, 380); g.stroke(); g.strokeStyle = '#D93A2B'; g.beginPath(); g.moveTo(856, 374); g.quadraticCurveTo(980, 370, 1090, 240); g.stroke(); g.font = 'italic 34px "Instrument Serif"'; g.fillText('F = ma', 900, 190);
  g.fillStyle = '#C7D7DE'; g.fillRect(120, 150, 210, 240); g.fillStyle = lg(g, 120, 150, 330, 390, [[0, '#FFE2A8'], [1, '#F6B978']]); g.fillRect(132, 162, 186, 216); g.fillStyle = '#8A7A66'; g.fillRect(222, 162, 6, 216); g.fillRect(132, 266, 186, 6);
  g.fillStyle = '#F3E9A6'; g.fillRect(1260, 190, 120, 160); g.fillStyle = '#C7624A'; g.fillRect(1272, 204, 96, 44); g.fillStyle = '#3F6B4E'; g.fillRect(1400, 220, 110, 140);
  g.fillStyle = '#DADDE0'; rr(g, 610, 62, 420, 16, 8); g.fill();
}
function pClassFg(g) { g.fillStyle = '#3A2718'; for (const [x, w] of [[-60, 520], [520, 480], [1080, 560]]) { rr(g, x, 646, w, 30, 6); g.fill(); g.fillRect(x + 20, 676, 16, 60); g.fillRect(x + w - 36, 676, 16, 60); } [[90, '#1B1620'], [300, '#231A1C'], [640, '#1B1620'], [850, '#20181F'], [1200, '#1B1620'], [1420, '#231A1C']].forEach(([x, c], i) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, 590 + (i % 2) * 14, 46, 54, 0, 0, TAU); g.fill(); rr(g, x - 84, 640 + (i % 2) * 14, 168, 200, 50); g.fill(); }); }
function sClass(g, t) {
  const u = t - 12.6, z = 1.04 + .04 * u, cam = 90 + u * 34;
  g.save(); g.translate(640, 380); g.scale(z, z); g.translate(-640, -380); g.drawImage(L.cls, -cam, 0);
  // ceiling fan + tube light
  g.save(); g.translate(360 - cam, 40); g.scale(1, .16); g.rotate(t * 9); g.fillStyle = 'rgba(70,60,50,.55)'; for (let k = 0; k < 3; k++) { g.rotate(TAU / 3); rr(g, 10, -16, 150, 32, 16); g.fill(); } g.restore();
  flare(g, 820 - cam, 70, 230, .5, 'rgba(225,240,255,1)');
  shadow(g, 320, GY + 4, 160, .35); moovi(g, t, 320, GY, 440, { direct: eoB(seg(u, .25, .7)), look: [.6 * eo3(seg(u, .2, .6)) - .9 * eio(seg(u, 1.1, 1.4)), .1], lean: .3 });
  g.restore();
  g.drawImage(L.clsFg, -cam * 1.6 - 20, 14);
  handPhone(g, 1010, 520, 300, 60, .06, t);
}

/* ───────── startup desk ───────── */
function pDesk(g) {
  g.fillStyle = lg(g, 0, 0, 0, 560, [[0, '#1E2742'], [1, '#2B3556']]); g.fillRect(0, 0, 1700, 560); g.fillStyle = lg(g, 0, 560, 0, 720, [[0, '#3A3346'], [1, '#1E1A28']]); g.fillRect(0, 560, 1700, 160);
  g.fillStyle = '#0F1630'; rr(g, 980, 70, 520, 330, 8); g.fill(); for (let i = 0; i < 60; i++) { const x = 990 + h1(i) * 500, y = 90 + h1(i + 50) * 290, r = 5 + h1(i + 90) * 16; g.fillStyle = ['rgba(255,196,110,.5)', 'rgba(120,160,255,.45)', 'rgba(255,240,220,.4)'][i % 3]; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } g.fillStyle = '#39456E'; g.fillRect(1236, 70, 8, 330); g.fillRect(980, 230, 520, 6);
  g.fillStyle = '#F2F0EA'; rr(g, 150, 110, 330, 230, 8); g.fill(); for (let i = 0; i < 9; i++) { g.fillStyle = ['#FFD66B', '#FF9E80', '#A9D8FF', '#C6F0C2'][i % 4]; g.save(); g.translate(196 + (i % 3) * 104, 156 + Math.floor(i / 3) * 70); g.rotate((h1(i) - .5) * .18); g.fillRect(-28, -26, 60, 54); g.fillStyle = 'rgba(14,26,43,.5)'; g.fillRect(-18, -12, 38, 4); g.fillRect(-18, 0, 26, 4); g.restore(); }
  g.fillStyle = '#3B2A22'; g.fillRect(560, 250, 300, 12); g.fillStyle = '#2F7D5B'; for (let k = 0; k < 7; k++) { g.beginPath(); g.ellipse(640 + (k - 3) * 9, 214 - Math.abs(k - 3) * -4, 8, 34, (k - 3) * .22, 0, TAU); g.fill(); } g.fillStyle = '#C9714B'; rr(g, 616, 226, 50, 26, 5); g.fill(); for (let k = 0; k < 5; k++) { g.fillStyle = ['#E8563F', '#EFE2C8', '#5B7CFA', '#EDBB4E', '#EFE2C8'][k]; g.fillRect(720 + k * 20, 196, 16, 54); }
}
function sDesk(g, t) {
  const u = t - 14.3, z = 1.1 - .05 * u, cam = 260 - u * 30, top = 470;
  g.save(); g.translate(700, 420); g.scale(z, z); g.translate(-700, -420); g.drawImage(L.desk, -cam, 0);
  const dx = 620; shadow(g, dx + 280, GY + 8, 380, .5);
  g.fillStyle = '#2A1F1C'; g.fillRect(dx + 20, top, 16, 150); g.fillRect(dx + 540, top, 16, 150); g.fillStyle = lg(g, 0, top - 4, 0, top + 18, [[0, '#C08552'], [1, '#8A5A34']]); rr(g, dx - 10, top - 4, 600, 20, 5); g.fill(); g.fillStyle = 'rgba(255,225,180,.5)'; g.fillRect(dx - 6, top - 4, 592, 2.5);
  // laptop with a real landing page on it
  const lx = dx + 150, ly = top - 6; g.fillStyle = '#B9BEC6'; g.beginPath(); g.moveTo(lx - 20, ly); g.lineTo(lx + 280, ly); g.lineTo(lx + 262, ly - 9); g.lineTo(lx - 2, ly - 9); g.fill(); g.fillStyle = '#14161C'; rr(g, lx, ly - 182, 260, 174, 10); g.fill();
  g.save(); rr(g, lx + 8, ly - 174, 244, 156, 5); g.clip(); g.fillStyle = '#FBFAF7'; g.fillRect(lx, ly - 180, 260, 180); g.fillStyle = '#0E1A2B'; g.font = '700 9px "Inter Tight"'; g.textAlign = 'left'; g.fillText('nimbu', lx + 20, ly - 156); g.fillStyle = '#5B7CFA'; rr(g, lx + 200, ly - 166, 40, 14, 7); g.fill(); g.fillStyle = '#0E1A2B'; g.font = '700 19px "Inter Tight"'; g.fillText('Ship on day one.', lx + 20, ly - 118); g.fillStyle = '#8A93A0'; g.font = '500 8px "Inter Tight"'; g.fillText('The fastest way from idea to live.', lx + 20, ly - 102);
  const ty = cl((u - .5) * 3); g.fillStyle = '#0E1A2B'; rr(g, lx + 20, ly - 90, 64, 18, 9); g.fill(); g.fillStyle = '#fff'; g.font = '600 8px "Inter Tight"'; g.fillText('Get started', lx + 31, ly - 78); g.fillStyle = lg(g, lx, 0, lx + 260, 0, [[0, '#CFE6F7'], [1, '#5B7CFA']]); rr(g, lx + 20, ly - 62 + 20 * (1 - eo3(ty)), 220, 60, 8); g.fill(); g.restore();
  glow(g, lx + 130, ly - 96, 260, 'rgba(190,215,255,1)', .3);
  // mug + lamp
  g.fillStyle = '#F2EDE4'; rr(g, dx + 60, top - 40, 34, 38, 5); g.fill(); g.strokeStyle = '#F2EDE4'; g.lineWidth = 5; g.beginPath(); g.arc(dx + 96, top - 22, 10, -1.3, 1.3); g.stroke(); steam(g, t, dx + 77, top - 44, 7, 14, 90, .14);
  g.strokeStyle = '#D8DBE0'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(dx + 520, top - 6); g.lineTo(dx + 540, top - 120); g.lineTo(dx + 470, top - 190); g.stroke(); g.fillStyle = '#D8DBE0'; g.beginPath(); g.moveTo(dx + 480, top - 204); g.lineTo(dx + 440, top - 164); g.lineTo(dx + 478, top - 150); g.lineTo(dx + 500, top - 186); g.fill(); g.fillRect(dx + 494, top - 12, 54, 8);
  flare(g, dx + 462, top - 160, 150, .8);
  shadow(g, 430, GY + 4, 160, .5); moovi(g, t, 430, GY, 430, { think: eo3(seg(u, .25, .7)) * (1 - seg(u, 1.4, 1.7)), look: [.8 * eo3(seg(u, .1, .5)), -.05], lean: .35 });
  g.restore();
  handPhone(g, 130, 540, 330, 70, -.07, t);
}

/* ───────── salon shutter ───────── */
function pSalon(g) {
  g.fillStyle = '#D9C7A8'; g.fillRect(0, 0, 1700, 610); g.fillStyle = 'rgba(120,80,60,.12)'; for (let i = 0; i < 40; i++) g.fillRect(h1(i) * 1700, h1(i + 9) * 600, 40 + h1(i + 3) * 120, 3);
  g.fillStyle = lg(g, 0, 610, 0, 720, [[0, '#6C5A52'], [1, '#3A302E']]); g.fillRect(0, 610, 1700, 110); g.fillStyle = '#8A7868'; g.fillRect(0, 600, 1700, 14);
  // interior
  g.fillStyle = lg(g, 0, 180, 0, 600, [[0, '#F7E3C0'], [1, '#E9B77A']]); g.fillRect(520, 180, 640, 420);
  for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#2A2630' : '#EDE6DA'; g.fillRect(520 + i * 40, 560 + j * 20, 40, 20); }
  for (const mx of [600, 860]) { g.fillStyle = '#5A3A22'; rr(g, mx, 230, 200, 230, 10); g.fill(); g.fillStyle = lg(g, mx, 230, mx + 200, 460, [[0, '#DCEBF2'], [1, '#A9C4D2']]); rr(g, mx + 12, 242, 176, 206, 6); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(mx + 30, 448); g.lineTo(mx + 90, 242); g.lineTo(mx + 120, 242); g.lineTo(mx + 60, 448); g.fill(); for (let k = 0; k < 6; k++) { g.fillStyle = '#FFF6D8'; g.beginPath(); g.arc(mx + 20 + k * 32, 222, 7, 0, TAU); g.fill(); } g.fillStyle = '#7A4B2A'; g.fillRect(mx - 10, 466, 220, 10); for (let k = 0; k < 5; k++) { g.fillStyle = ['#E8563F', '#5B7CFA', '#2F7D5B', '#EDBB4E', '#F2F0EA'][k]; rr(g, mx + 10 + k * 26, 436 - (k % 2) * 8, 14, 30 + (k % 2) * 8, 3); g.fill(); } }
  g.fillStyle = '#2A2630'; rr(g, 1010, 440, 110, 30, 10); g.fill(); rr(g, 1020, 370, 90, 80, 14); g.fill(); g.fillRect(1058, 470, 14, 80); rr(g, 1020, 546, 90, 12, 6); g.fill(); g.fillStyle = '#A8322A'; rr(g, 1028, 378, 74, 60, 10); g.fill();
  // frame + sign
  g.fillStyle = '#B49C7C'; g.fillRect(500, 160, 20, 440); g.fillRect(1160, 160, 20, 440); g.fillStyle = '#5E6470'; g.fillRect(500, 160, 680, 26);
  g.fillStyle = '#A8322A'; rr(g, 470, 40, 740, 110, 8); g.fill(); g.strokeStyle = '#FFD46B'; g.lineWidth = 4; rr(g, 482, 52, 716, 86, 5); g.stroke(); g.fillStyle = '#FFD46B'; g.font = 'italic 78px "Instrument Serif"'; g.textAlign = 'center'; g.fillText('New Look Salon', 840, 122);
  g.fillStyle = '#4A5B7A'; g.fillRect(1290, 200, 260, 400); g.fillStyle = 'rgba(0,0,0,.18)'; for (let s = 0; s < 40; s++) g.fillRect(1290, 200 + s * 10, 260, 3);
}
function sSalon(g, t) {
  const u = t - 16.3, z = 1.02 + .035 * u, cam = 150 + u * 26, up = eio(seg(u, .45, 1.3)), ys = lerp(600, 214, up) - 10 * imp(u - 1.3, 7, 24) * (u > 1.3 ? 1 : 0) + (up > 0 && up < 1 ? 1.5 * Math.sin(t * 70) : 0);
  g.save(); g.translate(640, 420); g.scale(z, z); g.translate(-640, -420); g.drawImage(L.salon, -cam, 0);
  const X = 520 - cam; for (const mx of [600, 860]) for (let k = 0; k < 6; k++) glow(g, mx - cam + 20 + k * 32, 222, 26, 'rgba(255,225,160,1)', .7 * up);
  // shutter
  g.fillStyle = lg(g, 0, ys - 420, 0, ys, [[0, '#7E8590'], [1, '#A2A8B2']]); g.fillRect(X, 186, 640, Math.max(0, ys - 186)); for (let y = ys - 10; y > 186; y -= 14) { g.fillStyle = 'rgba(20,24,34,.26)'; g.fillRect(X, y, 640, 4); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(X, y - 3, 640, 2); }
  g.fillStyle = '#4B505A'; g.fillRect(X, ys - 12, 640, 14); g.fillStyle = '#23262C'; rr(g, X + 300, ys - 9, 40, 8, 3); g.fill(); g.fillStyle = lg(g, 0, ys, 0, ys + 60, [[0, 'rgba(20,12,10,.4)'], [1, 'rgba(20,12,10,0)']]); g.fillRect(X, ys + 2, 640, Math.min(60, 600 - ys));
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = lg(g, 0, 600, 0, 720, [[0, `rgba(255,200,120,${.4 * up})`], [1, 'rgba(255,200,120,0)']]); g.beginPath(); g.moveTo(X, 600); g.lineTo(X + 640, 600); g.lineTo(X + 760, 720); g.lineTo(X - 120, 720); g.fill(); g.restore();
  // barber pole
  const bx = 468 - cam; g.save(); rr(g, bx - 13, 260, 26, 150, 13); g.clip(); g.fillStyle = '#F4F1EA'; g.fillRect(bx - 13, 260, 26, 150); for (let k = -2; k < 10; k++) { g.fillStyle = k % 2 ? '#D93A2B' : '#2B4EA8'; g.beginPath(); const y = 260 + k * 26 + (t * 40) % 52; g.moveTo(bx - 13, y); g.lineTo(bx + 13, y - 18); g.lineTo(bx + 13, y - 6); g.lineTo(bx - 13, y + 12); g.fill(); } g.restore(); g.fillStyle = '#8A8F96'; rr(g, bx - 16, 248, 32, 14, 5); g.fill(); rr(g, bx - 16, 408, 32, 14, 5); g.fill();
  shadow(g, 250, 646, 160, .45); const hp = seg(u, 1.25, 1.65);
  moovi(g, t, 250, 640 - 46 * Math.sin(Math.PI * hp), 440, { direct: eoB(seg(u, .2, .55)) * (1 - seg(u, 1.0, 1.25)), celebrate: eo3(seg(u, 1.2, 1.5)), look: [.8, .5 * up], squash: -.4 * seg(u, 1.05, 1.25) * (1 - hp) - .6 * imp(u - 1.65, 9, 20) * (u > 1.65 ? 1 : 0) });
  g.restore();
  handPhone(g, 1080, 540, 120, 80, .08, t);
}

/* ───────── the phone: eyes held, hearts → coins ───────── */
const PX = 880, PY = 60, PW = 280, PH = 556, MX = 690, WX = 452;
const FLICK = [18.62, 18.9, 19.14, 19.36], NUB = [[MX - 140, 368], [MX + 140, 368]];
const REELS = [['@sharma.chai', 'first kettle of the morning'], ['@physics.with.anu', 'one law, one minute'], ['@newlook.salon', 'shutter up, doors open'], ['@nimbu.hq', 'shipping from a small desk'], ['@you', 'just talking to camera']];
function reelArt(g, k, w, h, t) {
  if (k === 4 && reel) { const s = Math.max(w / reel.width, h / reel.height) * (1.04 + .02 * Math.sin(t * .8)); g.drawImage(reel, (w - reel.width * s) / 2, (h - reel.height * s) / 2, reel.width * s, reel.height * s); return; }
  const src = [L.chaiR, L.cls, L.salon, L.desk][k % 4], sx = [0, 560, 560, 560][k % 4]; g.drawImage(src, sx, 60, 560 * w / h * (600 / 560) * .93, 600, 0, 0, w, h);
}
function feed(g, t) {
  let pos = 0, vel = 0; FLICK.forEach(f => { const p = seg(t, f, f + .3); pos += eoX(p); if (p > 0 && p < 1) vel = 1 - p; });
  const w = PW - 20, h = PH - 20; g.save(); g.translate(PX + 10, PY + 10); rr(g, 0, 0, w, h, 30); g.clip(); g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const n = vel > .03 ? 10 : 1; for (let sIdx = 0; sIdx < n; sIdx++) {
    const pp = pos - sIdx * vel * .022; g.globalAlpha = 1 / (sIdx + 1); const i0 = Math.floor(pp);
    for (const i of [i0, i0 + 1]) { if (i > 4 || i < 0) continue; const y = (i - pp) * h; g.save(); g.translate(0, y); g.beginPath(); g.rect(0, 0, w, h); g.clip(); reelArt(g, i, w, h, t);
      g.fillStyle = lg(g, 0, h - 190, 0, h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.6)']]); g.fillRect(0, h - 190, w, 190);
      g.fillStyle = '#CFE6F7'; g.beginPath(); g.arc(30, h - 62, 14, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'left'; g.font = '700 14px "Inter Tight"'; g.fillText(REELS[i][0], 52, h - 57); g.font = '500 13px "Inter Tight"'; g.fillText(REELS[i][1], 16, h - 30);
      const liked = i === 4 && t > 20.22, hs = liked ? 1 + .5 * imp(t - 20.22, 8, 20) : 1; heart(g, w - 30, h - 196, 22 * hs, liked ? '#FF4D6D' : 'rgba(255,255,255,.95)');
      g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 2.4; g.lineJoin = 'round'; g.beginPath(); g.arc(w - 30, h - 150, 11, .9, TAU + .3); g.lineTo(w - 40, h - 136); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(w - 42, h - 98); g.lineTo(w - 18, h - 110); g.lineTo(w - 26, h - 86); g.lineTo(w - 31, h - 97); g.closePath(); g.stroke();
      g.restore(); }
  }
  g.globalAlpha = 1; g.fillStyle = '#fff'; g.font = '700 15px "Inter Tight"'; g.textAlign = 'center'; g.fillText('Reels', w / 2, 34);
  const bh = t - 20.22; if (bh > 0 && bh < .9) { g.globalAlpha = cl((0.9 - bh) / .25); heart(g, w / 2, h / 2 - 20, 92 * (spr(bh, 8, 18)), '#fff'); g.globalAlpha = 1; }
  if (t > 20.7) for (let k = 0; k < 5; k++) { const p = ((t - 20.7) * .7 + k * .25) % 1; g.globalAlpha = Math.sin(p * Math.PI) * .9; heart(g, w - 30 + 14 * Math.sin(p * 5 + k * 2), h - 210 - p * 230, 9 + 9 * p, '#FF4D6D'); } g.globalAlpha = 1; const wf = seg(t, 27.4, 27.95); if (wf > 0) { g.fillStyle = `rgba(255,255,255,${wf})`; g.fillRect(0, 0, w, h); }
  g.restore(); return pos;
}
const CUST = Array.from({ length: 9 }, (_, i) => ({ x: 232 + (i % 5) * 64 + (i > 4 ? 34 : 0), by: i > 4 ? GY + 30 : GY - 16, s: i > 4 ? 1.02 : .86, t0: 20.84 + ((i * 4) % 9) * .1 }));
function sPhone(g, t) {
  const e = eio(seg(t, 27.3, 27.95)), zf = Math.exp(Math.log(9) * ei3(seg(t, 27.3, 28.2)));
  const zb = 1.2 - .09 * eio(seg(t, 20.5, 21.8)) + .05 * seg(t, 21.8, 27.3) + .02 * Math.sin(t * .9), z = zb * zf, cam = 1150 + (t - 18.4) * 16;
  const CX = lerp(870, 740, eio(seg(t, 20.5, 21.8))) + 8 * Math.sin(t * .7), CY = 380;
  streetBg(g, cam, 1 + (zb - 1) * .5 + (zf - 1) * .2, 1, .46);
  g.save(); g.translate(lerp(640, 640, e), lerp(360, 360, e)); g.scale(z, z); g.translate(-lerp(CX, PX + PW / 2, e), -lerp(CY, PY + PH / 2, e));
  bulbs(g, t, cam, 120, .6);
  label(g, t, 26.0, 'attention', 400, 176, 44, { col: '#EEF8B8', strike: 26.74 });
  label(g, t, 26.9, 'currency', 428, 262, 60);
  // phone
  const glowA = .5 + .1 * Math.sin(t * 2.3); g.save(); g.translate(PX + PW / 2, GY + 8); g.scale(1, .2); const d = g.createRadialGradient(0, 0, 0, 0, 0, 420); d.addColorStop(0, `rgba(170,205,255,${.5 * glowA})`); d.addColorStop(1, 'rgba(170,205,255,0)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = d; g.fillRect(-420, -420, 840, 840); g.restore();
  shadow(g, PX + PW / 2, GY + 8, 230, .6);
  g.fillStyle = lg(g, PX, 0, PX + PW, 0, [[0, '#8C95A6'], [.04, '#2A3246'], [.96, '#1A2134'], [1, '#6A7386']]); rr(g, PX, PY, PW, PH, 40); g.fill(); g.fillStyle = '#05070C'; rr(g, PX + 5, PY + 5, PW - 10, PH - 10, 35); g.fill();
  feed(g, t); if (t < 27.5) { g.fillStyle = '#05070C'; rr(g, PX + PW / 2 - 38, PY + 18, 76, 20, 10); g.fill(); }
  glow(g, PX + PW / 2, PY + PH / 2, 420, 'rgba(150,190,255,1)', .16 + .5 * seg(t, 27.3, 27.9));
  // thumb flicking, then the tap that stops it
  let th = 0; FLICK.forEach(f => { const p = seg(t, f - .1, f + .2); if (p > 0 && p < 1) th = p < .45 ? eo3(p / .45) : 1 - eio((p - .45) / .55); });
  const tin = eo3(seg(t, 18.42, 18.62)) * (1 - eio(seg(t, 20.4, 20.8))), tap = Math.max(0, 1 - Math.abs(t - 20.2) / .08);
  if (tin > 0) { g.save(); g.translate(PX + PW + 190 * (1 - tin) + 30 - 30 * tap, PY + 520 - th * 150 + 200 * (1 - tin) - 60 * seg(t, 19.6, 20.1)); g.rotate(-.62 - th * .12); g.scale(1 - .05 * tap, 1 - .05 * tap); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 24; g.shadowOffsetX = -8; g.shadowOffsetY = 10; g.fillStyle = lg(g, -40, 0, 40, 0, [[0, '#A56E4A'], [.5, '#8A5A3C'], [1, '#6B432C']]); rr(g, -38, -190, 76, 520, 38); g.fill(); g.shadowColor = 'transparent'; g.fillStyle = 'rgba(255,225,205,.55)'; rr(g, -22, -180, 44, 46, [20, 20, 10, 10]); g.fill(); g.strokeStyle = 'rgba(60,30,15,.3)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-26, -60); g.quadraticCurveTo(0, -52, 26, -60); g.stroke(); g.restore(); }
  // likes turn into customers
  const cust = (c, i) => { const dt = t - c.t0 - .55; if (dt <= 0) return; const k = spr(dt, 8, 17), eyeT = 23.62 + i * .06, ek = t > eyeT ? spr(t - eyeT, 10, 22) : 0, pay = Math.max(0, 1 - Math.abs(t - (24.4 + i * .1)) / .2);
    shadow(g, c.x, c.by + 4, 60 * c.s, .4); g.save(); g.translate(c.x, c.by); g.scale(1 + .1 * (1 - k), k * (1 + .05 * Math.sin(t * 3 + i) * 0) + .04 * pay); g.translate(-c.x, -c.by); person(g, c.x, c.by, c.s, .9, 1, i + 2);
    g.fillStyle = i % 2 ? '#D9A66B' : '#F1E3C6'; rr(g, c.x - 44 * c.s, c.by - 70 * c.s, 26 * c.s, 32 * c.s, 3); g.fill(); g.strokeStyle = '#3A2A20'; g.lineWidth = 2; g.beginPath(); g.arc(c.x - 31 * c.s, c.by - 70 * c.s, 8 * c.s, Math.PI, 0); g.stroke();
    if (ek > 0) { for (const ex of [-3, 12]) { g.fillStyle = '#F7FAFD'; g.beginPath(); g.ellipse(c.x + (ex + 4) * c.s, c.by - 154 * c.s, 5.5 * c.s * ek, 6.5 * c.s * ek, 0, 0, TAU); g.fill(); g.fillStyle = '#0E1A2B'; g.beginPath(); g.arc(c.x + (ex + 6.5) * c.s, c.by - 154 * c.s, 2.6 * c.s * ek, 0, TAU); g.fill(); } if (t - eyeT < .3) glow(g, c.x + 8 * c.s, c.by - 154 * c.s, 40, 'rgba(220,235,255,1)', 1 - (t - eyeT) / .3); }
    g.restore(); };
  CUST.forEach((c, i) => { if (i <= 4) cust(c, i); });
  // coins: landed pile (behind Moovi if further back)
  const N = 84, items = [];
  for (let i = 0; i < N; i++) {
    const c = CUST[i % 9], t0 = 24.36 + i * .02 + h1(i) * .06, side = i % 2, fx = c.x + 8, fy = c.by - 150 * c.s, [nx, ny] = NUB[side], a = seg(t, t0, t0 + .6), tA = t0 + .6;
    const row = h1(i + 20), px = MX + (side ? 1 : -1) * (40 + Math.pow(h1(i + 31), 1.5) * 150) - (side ? 0 : 60 * h1(i + 5)), py = GY - 22 + row * 66;
    items.push({ i, t0, a, tA, fx, fy, nx: nx + (h1(i + 8) - .5) * 40, ny, px, py, b: seg(t, tA, tA + .5) });
  }
  const pile = it => { if (t < it.tA) return; const p = it.b, x = lerp(it.nx, it.px, p), y = p < 1 ? lerp(it.ny, it.py, ei2(p)) - 60 * Math.sin(Math.PI * p) * (1 - p) : it.py - 12 * Math.abs(imp(t - it.tA - .5, 8, 17)); if (p < 1) coin(g, x, y, 16, t * 13 + it.i); else coin(g, x, y, 17 + (it.py - GY) * .06, 0, true); };
  items.filter(it => it.py < GY + 4).sort((p, q) => p.py - q.py).forEach(pile);
  // Moovi
  const cel = eoB(seg(t, 24.36, 24.7)) * (1 - eio(seg(t, 25.5, 26.0))), hop = seg(t, 24.36, 24.78), hop2 = seg(t, 26.9, 27.25), jolt = seg(t, 20.2, 20.5);
  const K = [[18.4, 0, 0], [18.7, .85, .1], [20.5, .85, .1], [21.1, -.8, 0], [22.9, -.8, 0], [23.25, 0, 0], [24.2, 0, 0], [24.5, .1, .6], [25.5, -.2, .5], [26.0, -.6, .5], [27.2, -.6, .5], [27.5, .85, .15], [28.2, .85, .15]];
  let lk = [0, 0]; for (let i = 0; i < K.length - 1; i++) if (t >= K[i][0]) { const q = eio(seg(t, K[i][0], K[i + 1][0])); lk = [lerp(K[i][1], K[i + 1][1], q), lerp(K[i][2], K[i + 1][2], q)]; }
  shadow(g, MX, GY + 6, 170, .55);
  moovi(g, t, MX, GY - 50 * Math.sin(Math.PI * hop) - 40 * Math.sin(Math.PI * hop2) - 22 * Math.sin(Math.PI * jolt), 470, { celebrate: cl(cel, 0, 1.08), frame: eoB(seg(t, 23.2, 23.55)) * (1 - eio(seg(t, 24.15, 24.4))), wave: eo3(seg(t, 21.7, 22.0)) * (1 - eio(seg(t, 22.7, 23.1))), direct: eoB(seg(t, 18.9, 19.25)) * (1 - seg(t, 20.0, 20.3)) + eoB(seg(t, 27.3, 27.6)), look: lk, squash: -.45 * seg(t, 24.2, 24.36) * (1 - hop) - .7 * imp(t - 24.78, 9, 20) * (t > 24.78 ? 1 : 0) - .6 * imp(t - 27.25, 9, 20) * (t > 27.25 ? 1 : 0) - .4 * imp(t - 20.5, 9, 20) * (t > 20.5 ? 1 : 0), lean: .3 * seg(t, 18.5, 18.9) * (1 - seg(t, 20.4, 20.7)) + .5 * seg(t, 27.3, 27.8), turn: .35 * seg(t, 27.3, 27.8) });
  CUST.forEach((c, i) => { if (i > 4) cust(c, i); });
  items.filter(it => it.py >= GY + 4).sort((p, q) => p.py - q.py).forEach(pile);
  // hearts off the reel fly out and land as people
  CUST.forEach((c, i) => { const p = seg(t, c.t0, c.t0 + .55); if (p <= 0 || p >= 1) return; const q = eio(p), fx = PX + PW - 40, fy = PY + PH - 206, tx = c.x, ty = c.by - 110 * c.s, cx = (fx + tx) / 2, cy = 60 + h1(i + 60) * 80, x = (1 - q) * (1 - q) * fx + 2 * q * (1 - q) * cx + q * q * tx, y = (1 - q) * (1 - q) * fy + 2 * q * (1 - q) * cy + q * q * ty; glow(g, x, y, 50, 'rgba(255,120,150,1)', .5); heart(g, x, y, 18 + 26 * Math.sin(Math.PI * q), '#FF4D6D'); });
  CUST.forEach((c, i) => { const dt = t - c.t0 - .55; if (dt > 0 && dt < .3) glow(g, c.x, c.by - 110 * c.s, 90, 'rgba(255,150,170,1)', 1 - dt / .3); });
  // coins leave the customers for the raised nubs
  items.forEach(it => { if (t < it.t0 || it.a >= 1) return; const p = it.a, q = eio(p), cx = (it.fx + it.nx) / 2, cy = 150 + h1(it.i + 60) * 90, x = (1 - q) * (1 - q) * it.fx + 2 * q * (1 - q) * cx + q * q * it.nx, y = (1 - q) * (1 - q) * it.fy + 2 * q * (1 - q) * cy + q * q * it.ny; g.save(); g.globalAlpha = cl(p * 6); coin(g, x, y, 15, p * 16 + it.i); g.restore(); if (p < .3) glow(g, x, y, 40, 'rgba(255,225,140,1)', .8 * (1 - p / .3)); });
  if (t > 24.4 && t < 26.4) glow(g, MX, 330, 260, 'rgba(255,205,110,1)', .13 * seg(t, 24.4, 25) * (1 - seg(t, 25.8, 26.4)));
  g.restore();
  const wa = seg(t, 27.8, 28.12); if (wa > 0) { g.fillStyle = `rgba(255,255,255,${wa})`; g.fillRect(0, 0, W, H); }
}

/* ───────── intro: CONTENT in its selection box, pushed through the O ───────── */
const BT = 352;
function intro(t) {
  const base = 466, CAP = 116; octx.setTransform(1, 0, 0, 1, 0, 0); octx.clearRect(0, 0, W, H); octx.font = L.disp.replace('F', '100px'); octx.textAlign = 'left'; octx.textBaseline = 'alphabetic';
  const m0 = octx.measureText('CONTENT'), F = 100 * CAP / (octx.measureText('E').actualBoundingBoxAscent || 73); octx.font = L.disp.replace('F', F + 'px');
  const m = octx.measureText('CONTENT'), tw = m.actualBoundingBoxRight + m.actualBoundingBoxLeft, hs = 900 / tw, x0 = 190 + m.actualBoundingBoxLeft * hs;
  const wC = octx.measureText('C').width, wCO = octx.measureText('CO').width, ox = x0 + (wC + wCO) / 2 * hs, oy = base - CAP / 2;
  const sag = t > .42 ? 9 * imp(t - .42, 7, 21) : 0;
  const p = ei2(seg(t, .62, 1.0)), z = Math.exp(Math.log(70) * p), e = eo3(seg(t, .62, .9));
  octx.translate(lerp(ox, 640, e), lerp(oy, 380, e)); octx.scale(z, z); octx.translate(-ox, -oy);
  const bg = octx.createRadialGradient(640, 360, 0, 640, 360, 760); bg.addColorStop(0, '#F5F4F1'); bg.addColorStop(1, '#E5E4E1'); octx.fillStyle = bg; octx.fillRect(-2000, -2000, 5000, 5000);
  octx.save(); octx.translate(x0, base + sag); octx.scale(hs, 1); octx.fillStyle = '#161616'; octx.fillText('CONTENT', 0, 0); octx.restore();
  octx.fillStyle = '#C8323A'; octx.font = `${L.hand ? '400 55px "KalamHook"' : 'italic 52px "Instrument Serif"'}`; octx.lineWidth = 1.6; octx.strokeStyle = '#C8323A'; octx.lineJoin = 'round'; octx.strokeText('= getting seen', 700, 572); octx.fillText('= getting seen', 700, 572);
  // the O's counter opens onto the street
  const hr = eo3(seg(t, .6, .74)); if (hr > 0) { octx.globalCompositeOperation = 'destination-out'; octx.beginPath(); octx.ellipse(ox, oy, F * .13 * hs * hr, CAP * .27 * hr, 0, 0, TAU); octx.fill(); octx.globalCompositeOperation = 'source-over'; }
  octx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(ov, 0, 0);
  // Moovi drops onto the word
  if (t >= .6) { const zs = 1 + .3 * (1 - eo3(seg(t, .6, 1.6))); ctx.save(); ctx.translate(640, 440); ctx.scale(zs, zs); ctx.translate(-640, -440); stMoovi(ctx, t); ctx.restore(); }
  if (t < .6) { const f = seg(t, .1, .42), y = lerp(-120, BT, ei2(f)) + sag, ant = seg(t, .5, .6); if (t > .42) shadow(ctx, 830, BT + 4, 120, .22); moovi(ctx, t, 830, y, 300, { look: [-.3, -.5], squash: (t > .42 ? -.9 * imp(t - .42, 7, 21) : .35 * f) - .5 * ant, shadow: 0 }); }
}

const SC = [[0, sStreet], [7.0, sChai], [12.6, sClass], [14.3, sDesk], [16.3, sSalon], [18.4, sPhone]], WD = .17;
function scene(g, t) {
  let i = 0; while (i < SC.length - 1 && t >= SC[i + 1][0]) i++; SC[i][1](g, t);
  if (i === 0 && t < 1.0) { if (g === ctx) intro(t); }
  const v = g.createRadialGradient(640, 380, 380, 640, 380, 860); v.addColorStop(0, 'rgba(8,6,18,0)'); v.addColorStop(1, `rgba(8,6,18,${.42 * (t < 1 ? seg(t, .6, 1) : 1) * (1 - seg(t, 27.5, 28))})`); g.fillStyle = v; g.fillRect(0, 0, W, H);
}
export default {
  dur: 28.2,
  async init(canvas) {
    ctx = canvas.getContext('2d'); M = new MooviFilm(512);
    buf = document.createElement('canvas'); buf.width = W; buf.height = H; bctx = buf.getContext('2d');
    ov = document.createElement('canvas'); ov.width = W; ov.height = H; octx = ov.getContext('2d');
    L.far0 = mk(SW, H, pFar, 5); L.mid0 = mk(SW, H, pMid, 2.2); L.shops0 = mk(SW, H, pShops, 1.1);
    L.far1 = mk(SW, H, pFar, 11); L.mid1 = mk(SW, H, pMid, 8); L.shops1 = mk(SW, H, pShops, 6);
    L.fg = mk(SW, H, pFg, 9); L.cls = mk(1700, H, pClass, .7); L.clsFg = mk(1700, H, pClassFg, 7); L.desk = mk(1700, H, pDesk, 1.6); L.salon = mk(1700, H, pSalon, .6);
    L.chaiR = mk(700, 720, g => { g.fillStyle = lg(g, 0, 0, 0, 720, [[0, '#3A2A3E'], [1, '#C97A48']]); g.fillRect(0, 0, 700, 720); stall(g, 2, 60); }, 0);
    try { const fa = new FontFace('ArchivoHook', 'url(/library/font/archivo/archivo-latin-wdth-normal.woff2)', { weight: '100 900', stretch: '62% 125%' }); await fa.load(); document.fonts.add(fa); L.disp = '900 expanded F "ArchivoHook"'; } catch (e) { L.disp = '900 F "Inter Tight"'; }
    try { const ff = new FontFace('KalamHook', 'url(/library/font/kalam/Kalam-Regular.ttf)'); await ff.load(); document.fonts.add(ff); L.hand = true; } catch (e) { L.hand = false; }
    reel = await new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = '/hackathon/whackiest-2026/out/v3/tex/ed-8.0.jpg'; });
  },
  frame(t) {
    t = cl(t, 0, 28.2); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    let wi = -1; for (let i = 1; i < SC.length; i++) if (Math.abs(t - SC[i][0]) < WD) wi = i;
    if (wi < 0) return scene(ctx, t);
    const tc = SC[wi][0], dir = wi % 2 ? 1 : -1, D = 1100, n = 30; let shift, vel;
    if (t < tc) { const p = (t - (tc - WD)) / WD; shift = -dir * D * p * p * .5; vel = D * p * .34; } else { const p = (t - tc) / WD; shift = dir * D * (1 - p) * (1 - p) * .5; vel = D * (1 - p) * .34; }
    bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.globalAlpha = 1; scene(bctx, t);
    ctx.fillStyle = '#0A0C11'; ctx.fillRect(0, 0, W, H);
    for (let k = 0; k < n; k++) { ctx.globalAlpha = 1 / (k + 1); const x = shift + (k / (n - 1) - .5) * vel * dir; ctx.drawImage(buf, x, 0); if (x > 0) ctx.drawImage(buf, 0, 0, 2, H, 0, 0, x + 1, H); else if (x < 0) ctx.drawImage(buf, W - 2, 0, 2, H, W + x - 1, 0, -x + 1, H); }
    ctx.globalAlpha = 1;
  }
};
