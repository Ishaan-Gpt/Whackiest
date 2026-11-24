// ACT H: the architecture as a "studio line". STUDIO style. Camera dollies along one pixel conveyor; stations light on their words.
import { MooviFilm } from '../moovi-film.js';
import { clamp, seg, lerp, smooth, cubicIn, cubicOut, backOut, spring, ring, key, rr, loadImg, tintIcon, beginCam, drawMoovi, cover, finish,
  subjBegin, subjEnd, typed, snapWord, label, pixBar, loadPixelFont, PALE, BLACK, LIME } from './_studio.js';
import { preview } from './_eg.js';

const TEX = '/hackathon/whackiest-2026/out/v3/tex/', ICON = '/hackathon/whackiest-2026/film-v2/icons/';
const LY = 520, FL = 606, S = 400, GREY = '#CFCFCF';
const ST = { ai: 200, gate: 880, clip: 1330, shelf: 2480, plan: 3080, scan: 3540, rend: 4040, end: 4450 };
const TL = { ai: 4.66, gate: 6.24, clip: 7.98, shelf: 11.4, plan: 13.9, scan: 15.0, rend: 19.3, mach: 20.58 };
const WORDS = ['so', 'today', 'i', 'um', 'tried', 'the', 'new', 'menu'];
const PICKS = [{ r: 0, c: 0, kind: 0, v: 1 }, { r: 0, c: 3, kind: 1, v: 1 }, { r: 1, c: 2, kind: 2, v: 0 }];
const TK = [15.3, 15.85, 16.38, 16.9];
// camera keys: t, cx, cy, ln z, stop
const K = [[0, 668, 376, 1.07, 1], [1.3, 650, 385, 0.98], [2.2, 800, 380, 0.74], [3.4, 1000, 370, 0.6], [4.6, 600, 365, 0.82], [5.5, 520, 360, 0.9], [6.3, 760, 360, 0.88],
  [7.0, 900, 355, 0.92], [7.9, 1180, 355, 0.9], [8.6, 1260, 345, 1.0], [9.3, 1380, 350, 0.98], [10.6, 1520, 350, 0.92], [11.5, 2330, 355, 0.84], [12.6, 2480, 345, 0.92],
  [13.3, 2640, 350, 0.9], [13.95, 2940, 350, 0.9], [14.6, 3060, 345, 0.98], [15.2, 3440, 350, 0.86], [17.2, 3520, 340, 0.98], [18.3, 3640, 350, 0.92], [18.9, 3700, 350, 1.0],
  [19.5, 3960, 345, 0.92], [20.2, 3990, 350, 0.98], [21.0, 4000, 400, 0.92], [22.0, 4030, 370, 0.98], [22.8, 4060, 340, 1.12], [23.15, 4050, 345, 1.08],
  [23.75, 2250, 380, 0.275, 1], [24.5, 2240, 378, 0.29, 1], [25.0, 1640, 340, 0.95, 1], [25.2, 1642, 340, 0.955, 1]].map(k => [k[0], k[1], k[2], Math.log(k[3]), k[4] || 0]);
const HOPS = [[3.9, 4.25, 640, 860], [4.25, 4.6, 860, 1090], [10.62, 10.95, 1090, 1480], [10.95, 11.28, 1480, 1860], [11.28, 11.6, 1860, 2180], [13.2, 13.55, 2180, 2560],
  [14.45, 14.78, 2560, 2900], [14.78, 15.1, 2900, 3250], [19.6, 19.9, 3250, 3500], [19.9, 20.2, 3500, 3740], [24.42, 24.98, 3740, 2060, 700]];
const STRESS = [0.2, 2.4, 3.42, 4.7, 5.56, 6.24, 8.42, 9.84, 11.4, 12.52, 13.9, 15.0, 15.8, 16.34, 18.48, 19.3, 20.9, 22.72, 24.26];
const HW = [[2.14, 'tiny studio'], [3.22, 'one line'], [4.7, 'your ai'], [5.56, 'request'], [6.24, 'mcp server'], [7.98, 'open clip'], [9.18, 'every word'], [11.4, 'pick looks'],
  [12.52, 'taste'], [13.9, 'plan'], [15.0, 'check'], [15.8, 'rules'], [18.48, 'passed'], [19.3, 'render'], [20.72, 'your machine'], [22.72, 'private'], [24.26, 'free']];
const GW = [['mcp', 640, 668, -9, 1.4], ['studio', 1000, 900, 2.14, 4.6], ['words', 1500, 1400, 9.18, 11.2], ['taste', 2450, 2420, 11.94, 13.6], ['plan', 3050, 2960, 13.9, 14.9],
  ['rules', 3500, 3470, 15.8, 18.3], ['render', 4000, 3970, 19.3, 22.0]];
const DM = [[292, 452], [690, 108], [1040, 176]], MN = ['antigravity', 'claude', 'gemini'];
let o, m, raw, ed, icons = [], tiles = [], GX, GY, z = 1, cx = 640, cy = 360;

function cr(t, j) {
  const n = K.length; if (t <= K[0][0]) return K[0][j]; if (t >= K[n - 1][0]) return K[n - 1][j];
  let i = 0; while (i < n - 2 && t >= K[i + 1][0]) i++;
  const a = K[i], b = K[i + 1], h = b[0] - a[0], u = (t - a[0]) / h;
  const tg = k => (k <= 0 || k >= n - 1 || K[k][4]) ? 0 : (K[k + 1][j] - K[k - 1][j]) / (K[k + 1][0] - K[k - 1][0]);
  const m0 = tg(i) * h, m1 = tg(i + 1) * h, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * a[j] + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * b[j] + (u3 - u2) * m1;
}
const wt = (g, par = 1, ref = 0) => { g.translate(640, 360); g.scale(z, z); g.translate(-cx * par - ref * (1 - par), -cy); };
const sl = (g, x, y, w, h, r, fill, stroke, lw = 4) => { rr(g, x, y, w, h, r); g.fillStyle = fill; g.fill(); g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); };
const win = (t, a, b, r = 0.25) => smooth(seg(t, a, a + r)) * (1 - smooth(seg(t, b - r, b)));
const vis = (X, half) => Math.abs(X - cx) < 640 / z + half + 320;
const head = t => 640 + (ST.end - 640) * cubicOut(seg(t, 1.3, 3.3));
const tArr = X => X <= 640 ? 0.85 : 1.3 + 2 * (1 - Math.cbrt(1 - (X - 640) / (ST.end - 640)));
function unfold(g, X, t) { const a = backOut(seg(t, tArr(X), tArr(X) + 0.3)); g.translate(X, LY); g.scale(1, Math.max(0.001, a)); g.translate(-X, -LY); return a > 0; }
function mark(g, i, x, y, s, na = 0) {
  g.save(); g.translate(x, y); g.scale(s, s);
  if (i === 0) { g.strokeStyle = BLACK; g.lineWidth = 13; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-30, 30); g.quadraticCurveTo(-8, -52, 4, -34); g.quadraticCurveTo(14, -18, 30, 30); g.stroke();
    g.fillStyle = BLACK; g.beginPath(); g.arc(30, -32, 8, 0, 7); g.fill(); } else g.drawImage(icons[i], -40, -40, 80, 80);
  if (na > 0.02) { g.globalAlpha = na; g.font = '400 19px "Silkscreen"'; g.textAlign = 'center'; g.fillStyle = BLACK; g.fillText(MN[i], 0, 72); }
  g.restore();
}
function tick(g, x, y, r, p) { if (p <= 0) return; g.save(); g.translate(x, y); g.scale(p, p); g.fillStyle = '#27B35A'; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = r * 0.3; g.lineCap = 'butt'; g.beginPath(); g.moveTo(-r * 0.45, 0); g.lineTo(-r * 0.1, r * 0.35); g.lineTo(r * 0.5, -r * 0.35); g.stroke(); g.restore(); }

// ---------------- stations (world coords, standing on LY)
function stAI(g, t) { const lit = t >= TL.ai, k = lit ? BLACK : GREY, x = ST.ai - 170, y = LY - 250;
  sl(g, x, y, 340, 230, 16, '#fff', k); g.fillStyle = k; g.fillRect(x, y + 56, 340, 3);
  g.fillStyle = lit ? '#E6E6E6' : '#F3F3F3'; g.fillRect(x + 20, y + 74, 170, 16); g.fillRect(x + 20, y + 98, 110, 16);
  sl(g, x + 16, y + 170, 308, 44, 8, '#fff', k, 3); typed(g, 'make this a reel', x + 28, y + 199, 17, t, 4.72, { cps: 26, out: 5.44 });
  g.fillStyle = lit ? LIME : '#F1F1F1'; g.fillRect(x + 284, y + 178, 28, 28); g.strokeStyle = k; g.lineWidth = 3; g.strokeRect(x + 284, y + 178, 28, 28);
  if (t >= 5.44) { g.fillStyle = LIME; g.fillRect(x + 132, y + 124, 190, 30); g.fillStyle = BLACK; g.font = '400 13px "Silkscreen"'; g.textAlign = 'left'; g.fillText('make this a reel', x + 142, y + 144); }
}
function stGate(g, t) { const lit = t >= TL.gate, k = lit ? BLACK : GREY, X = ST.gate, Y = LY - 125, R = 100, a = lit ? t * 0.5 + ring(t - 6.95, 3, 9) * 0.8 : 0;
  sl(g, X - 70, LY - 20, 140, 20, 4, '#fff', k);
  g.save(); g.translate(X, Y); g.rotate(a);
  for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; g.strokeStyle = k; g.lineWidth = 12; g.beginPath(); g.moveTo(Math.cos(an) * R, Math.sin(an) * R); g.lineTo(Math.cos(an) * (R + 26), Math.sin(an) * (R + 26)); g.stroke();
    g.fillStyle = lit ? '#CFE6F7' : '#F4F4F4'; g.beginPath(); g.arc(Math.cos(an) * (R + 30), Math.sin(an) * (R + 30), 13, 0, 7); g.fill(); g.lineWidth = 4; g.stroke(); }
  g.strokeStyle = k; g.lineWidth = 32; g.beginPath(); g.arc(0, 0, R, 0, 7); g.stroke(); g.strokeStyle = lit ? '#CFE6F7' : '#F4F4F4'; g.lineWidth = 24; g.beginPath(); g.arc(0, 0, R, 0, 7); g.stroke();
  g.restore();
}
function envelope(g, x, y, s, a) { g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = a;
  sl(g, -42, -28, 84, 56, 0, LIME, BLACK, 4); g.beginPath(); g.moveTo(-42, -28); g.lineTo(0, 6); g.lineTo(42, -28); g.stroke();
  if (a >= 1) { g.fillStyle = BLACK; g.fillRect(-1.5, -52, 3, 24); sl(g, -92, -84, 184, 32, 4, '#fff', BLACK, 3); g.fillStyle = BLACK; g.font = '400 13px "Silkscreen"'; g.textAlign = 'center'; g.fillText('make this a reel', 0, -63); }
  g.restore(); }
function packet(g, t) { if (t < 5.42 || t > 7.05) return;
  const pos = tt => { const p = smooth(seg(tt, 5.52, 6.95)), q = seg(tt, 6.5, 6.95); return [lerp(350, ST.gate, p), lerp(LY - 50, LY - 125, smooth(q)) - Math.sin(q * Math.PI) * 40 - 3 * Math.sin(tt * 14)]; };
  const sc = backOut(seg(t, 5.42, 5.6)) * (1 - cubicIn(seg(t, 6.88, 7.05)));
  for (let q = 3; q >= 1; q--) { const [x, y] = pos(t - q * 0.03); envelope(g, x, y, sc, 0.15); } const [x, y] = pos(t); envelope(g, x, y, sc, 1); }
function stClip(g, t) { const lit = t >= TL.clip, k = lit ? BLACK : GREY, X = ST.clip, op = spring(t - 8.05, 6, 12), top = LY - 144 - 190 * op;
  g.save(); g.globalAlpha = lit ? 1 : 0.35; g.fillStyle = BLACK; rr(g, X - 66, top - 4, 132, 218, 12); g.fill(); cover(g, raw, X - 60, top + 2, 120, 206, 8);
  if (t >= 9.18 && t < 10.75) { const sy = top + 10 + 190 * (0.5 + 0.5 * Math.sin((t - 9.18) * 7)); g.fillStyle = LIME; g.fillRect(X - 60, sy, 120, 5); }
  g.restore(); sl(g, X - 95, LY - 130, 190, 130, 10, '#fff', k); g.fillStyle = k; g.fillRect(X - 70, LY - 118, 140, 5); g.fillRect(X - 22, LY - 62, 44, 8);
}
function wordTiles(g, t) { if (t < 9.18) return; g.font = '400 20px "Silkscreen"'; g.textAlign = 'center'; g.textBaseline = 'middle';
  tiles.forEach((w, i) => { const t0 = 9.2 + i * 0.165, p = seg(t, t0, t0 + 0.32); if (p <= 0) return; const e = cubicOut(p), dl = t - t0 - 0.32;
    const x = lerp(ST.clip + 30, w.x, e), y = lerp(LY - 250, w.y, e) - Math.sin(e * Math.PI) * 70 - ring(dl, 8, 22) * 8, sc = lerp(0.4, 1, e);
    g.save(); g.translate(x + w.w / 2, y + 20); g.rotate((1 - e) * -0.5); g.scale(sc, sc);
    sl(g, -w.w / 2, -20, w.w, 40, 6, dl > 0 && dl < 0.18 ? LIME : '#fff', BLACK, 3); g.fillStyle = i === 3 ? '#999' : BLACK; g.fillText(WORDS[i], 0, 2); g.restore(); });
  g.textBaseline = 'alphabetic'; }
const tileXY = p => [ST.shelf - 200 + 22 + p.c * 74, p.r ? LY - 72 : LY - 184];
function tasteTile(g, x, y, kind, v, t, lime, k = BLACK) { sl(g, x, y, 64, 64, 6, lime ? LIME : '#fff', k, 3); preview(g, kind, v, x + 8, y + 8, 48, 48, t * 3, k); }
function stShelf(g, t) { const lit = t >= TL.shelf, k = lit ? BLACK : GREY, X = ST.shelf;
  sl(g, X - 200, LY - 230, 400, 230, 8, '#fff', k); g.fillStyle = k; g.fillRect(X - 200, LY - 118, 400, 4);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) { const pi = PICKS.findIndex(p => p.r === r && p.c === c); if (pi >= 0 && t >= 11.45 + 0.6 * pi + 0.28) continue;
    const [x, y] = tileXY({ r, c }); tasteTile(g, x, y, pi >= 0 ? PICKS[pi].kind : (c + r * 3) % 5, pi >= 0 ? PICKS[pi].v : c + r, lit ? t : 0, false, k); }
  // grabber rail + arm
  g.fillStyle = k; g.fillRect(X - 230, LY - 296, 690, 8); g.fillRect(X - 230, LY - 296, 8, 296); g.fillRect(X + 452, LY - 296, 8, 296);
  const gx = key(t, GX), gy = key(t, GY); g.fillRect(gx - 22, LY - 306, 44, 22); g.fillRect(gx - 4, LY - 290, 8, gy - (LY - 290) - 8);
  g.fillRect(gx - 36, gy - 12, 72, 8); g.fillRect(gx - 36, gy - 12, 6, 24); g.fillRect(gx + 30, gy - 12, 6, 24);
  PICKS.forEach((p, i) => { const T0 = 11.45 + 0.6 * i, tp = 13.95 + i * 0.15; if (t < T0 + 0.28) return; let x, y;
    if (t < T0 + 0.58) { x = gx - 32; y = gy; } else if (t < tp) { x = X + 215 + i * 70; y = LY - 72 - Math.abs(ring(t - T0 - 0.58, 8, 20)) * 10; }
    else { const e = cubicOut(seg(t, tp, tp + 0.3)); if (e >= 1) return; x = lerp(X + 215 + i * 70, ST.plan - 150 + [30, 130, 220][i], e); y = lerp(LY - 72, LY - 150 + i * 35, e) - Math.sin(e * Math.PI) * 60; }
    tasteTile(g, x, y, p.kind, p.v, t, true); });
}
function stPlan(g, t) { const lit = t >= TL.plan, k = lit ? BLACK : GREY, X = ST.plan;
  sl(g, X - 180, LY - 250, 360, 250, 14, '#fff', k); g.fillStyle = k; g.fillRect(X - 180, LY - 216, 360, 3); for (let i = 0; i < 3; i++) g.fillRect(X - 164 + i * 16, LY - 238, 8, 8);
  if (!lit) return; let x = X - 156;
  WORDS.forEach((w, i) => { const ww = 14 + w.length * 6; if (t >= 13.9 + i * 0.07) { g.fillStyle = BLACK; g.fillRect(x, LY - 196, ww, 20); } x += ww + 6; });
  for (let i = 0; i < 3; i++) { const ta = 13.95 + i * 0.15 + 0.3; if (t < ta) continue; const bx = X - 150 + [30, 130, 220][i], bw = [90, 70, 80][i] * backOut(seg(t, ta, ta + 0.2)), by = LY - 150 + i * 35;
    g.fillStyle = LIME; g.fillRect(bx, by, bw, 24); g.strokeStyle = BLACK; g.lineWidth = 3; g.strokeRect(bx, by, bw, 24); g.fillStyle = BLACK; g.fillRect(bx + 8, LY - 176, 3, by - (LY - 176)); }
  if (t > 14.3) { const px = X - 160 + ((t - 14.3) * 150) % 320; g.fillStyle = BLACK; g.fillRect(px, LY - 206, 3, 190); g.fillRect(px - 5, LY - 210, 13, 8); }
}
function planCard(g, t) { if (t < 14.85 || t > 19.42) return; const x = key(t, [[14.85, 3270], [15.3, 3440], [17.2, 3640], [18.2, 3800], [19.15, 3800], [19.4, 3930]]), y = LY - 88, sc = backOut(seg(t, 14.85, 15.05));
  g.save(); g.translate(x, y + 74); g.scale(sc, sc); sl(g, -55, -74, 110, 74, 8, '#fff', BLACK, 3); g.fillStyle = BLACK; g.fillRect(-43, -60, 86, 10); g.fillStyle = LIME; g.fillRect(-43, -42, 40, 10); g.fillRect(5, -26, 34, 10); g.fillStyle = '#999'; g.fillRect(-20, -26, 18, 10);
  if (t >= 18.48) { const d = t - 18.48, s2 = lerp(2.6, 1, cubicIn(seg(d, 0, 0.12))); g.translate(0, -40); g.rotate(-0.12 + ring(d - 0.12, 8, 30) * 0.06); g.scale(s2, s2);
    sl(g, -78, -24, 156, 48, 0, LIME, BLACK, 5); g.fillStyle = BLACK; g.font = '700 30px "Silkscreen"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('passed', 0, 2); g.textBaseline = 'alphabetic'; }
  g.restore(); }
function picto(g, i, x, y, k) { g.save(); g.translate(x + 28, y + 28); g.strokeStyle = k; g.fillStyle = k; g.lineWidth = 3;
  if (i === 0) { g.strokeRect(-18, -18, 36, 36); g.setLineDash([4, 4]); g.strokeRect(-10, -10, 20, 20); }
  else if (i === 1) { g.beginPath(); g.arc(0, 0, 17, 0, 7); g.stroke(); g.fillRect(-8, -6, 4, 4); g.fillRect(4, -6, 4, 4); g.beginPath(); g.arc(0, 2, 8, 0.3, 2.84); g.stroke(); }
  else if (i === 2) { [14, 26, 34, 20].forEach((h, j) => g.fillRect(-17 + j * 9, 17 - h, 6, h)); }
  else { g.beginPath(); g.arc(0, 0, 17, 0, 7); g.stroke(); g.beginPath(); g.moveTo(0, -11); g.lineTo(0, 0); g.lineTo(8, 5); g.stroke(); }
  g.restore(); }
function stScan(g, t) { const lit = t >= TL.scan, k = lit ? BLACK : GREY, X = ST.scan;
  g.fillStyle = k; g.fillRect(X - 141, LY - 250, 22, 250); g.fillRect(X + 119, LY - 250, 22, 250);
  if (lit && t < 17.3) { const sy = LY - 130 + 105 * Math.sin((t - 15) * 5); g.fillStyle = 'rgba(217,245,107,0.35)'; g.fillRect(X - 119, sy, 238, LY - sy); g.fillStyle = LIME; g.fillRect(X - 119, sy - 3, 238, 6); }
  sl(g, X - 160, LY - 330, 320, 80, 8, '#fff', k);
  for (let i = 0; i < 4; i++) { const x = X - 142 + i * 73, ok = t >= TK[i]; sl(g, x, LY - 318, 56, 56, 6, ok ? LIME : '#fff', k, 3); picto(g, i, x, LY - 318, k); tick(g, x + 50, LY - 266, 13, spring(t - TK[i], 9, 16)); }
}
function stRend(g, t) { const X = ST.rend, ml = t >= TL.mach, km = ml ? BLACK : GREY, lit = t >= TL.rend, k = lit ? BLACK : GREY;
  sl(g, X - 190, LY - 284, 380, 250, 12, '#fff', km); g.strokeStyle = km; g.lineWidth = 3; g.strokeRect(X - 176, LY - 270, 352, 222);
  g.beginPath(); g.moveTo(X - 230, LY); g.lineTo(X + 230, LY); g.lineTo(X + 190, LY - 34); g.lineTo(X - 190, LY - 34); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 4; g.stroke();
  g.fillStyle = ml && t < 20.9 && Math.floor(t * 20) % 2 ? LIME : km; for (let i = 0; i < 16; i++) g.fillRect(X - 176 + i * 22.5, LY - 24, 12, 6); g.fillRect(X - 60, LY - 12, 120, 5);
  sl(g, X - 120, LY - 224, 240, 190, 14, '#fff', k); const rd = seg(t, 19.4, 20.1);
  g.save(); rr(g, X - 92, LY - 204, 184, 116, 8); g.clip(); g.fillStyle = lit ? '#1A1A1A' : '#F1F1F1'; g.fillRect(X - 92, LY - 204, 184, 116);
  if (lit) { const gl = (t < 20.2 ? 0.75 + 0.25 * Math.sin(t * 22) : 0.45 + 0.1 * Math.sin(t * 3)), gr = g.createRadialGradient(X, LY - 146, 4, X, LY - 146, 110); gr.addColorStop(0, `rgba(217,245,107,${gl})`); gr.addColorStop(1, 'rgba(217,245,107,0)'); g.fillStyle = gr; g.fillRect(X - 92, LY - 204, 184, 116);
    if (t < 20.15) { g.globalAlpha = 0.4 + 0.6 * rd; cover(g, ed, X - 28, LY - 196, 56, 100, 4); } }
  g.restore(); g.strokeStyle = k; g.lineWidth = 3; rr(g, X - 92, LY - 204, 184, 116, 8); g.stroke();
  pixBar(g, X - 92, LY - 72, 8, lit ? rd * 8 + 0.01 : 0, { s: 16, gap: 8, col: k });
  // finished reel pops out, waits, then rides off the end of the line
  if (t >= 20.12) { const e = seg(t, 20.12, 20.5), ex = cubicIn(seg(t, 23.3, 24.3)), x = lerp(X + 120, X + 310, cubicOut(e)) + 520 * ex, y = LY - 8 - Math.sin(e * Math.PI) * 70, sc = lerp(0.35, 1, cubicOut(e)), sq = 1 - 0.12 * Math.abs(ring(t - 20.5, 6, 17));
    g.save(); g.translate(x, y); g.rotate(-0.1 * ex); g.scale(sc * (2 - sq), sc * sq); g.fillStyle = BLACK; rr(g, -50, -172, 100, 172, 12); g.fill(); cover(g, ed, -45, -167, 90, 162, 8); g.restore(); }
  // lock
  if (t >= 22.1) { const dp = spring(t - 22.1, 7, 13), shut = t >= 22.72, lx = X + 190, ly = LY - 300 - 60 * (1 - dp) + ring(t - 22.72, 9, 30) * 6;
    g.save(); g.translate(lx, ly); g.strokeStyle = BLACK; g.lineWidth = 11; g.beginPath(); const up = shut ? 0 : 20; g.moveTo(-20, 4); g.lineTo(-20, -14 - up); g.arc(0, -14 - up, 20, Math.PI, 0); g.lineTo(20, shut ? 4 : -up - 6); g.stroke();
    sl(g, -38, 0, 76, 60, 10, shut ? LIME : '#fff', BLACK, 5); g.fillStyle = BLACK; g.fillRect(-6, 20, 12, 12); g.fillRect(-3, 30, 6, 14);
    const fd = t - 22.72; if (fd > 0 && fd < 0.3) { const st = Math.floor(fd / 0.06), r = 56 + st * 14; g.lineWidth = 4; g.strokeStyle = st % 2 ? '#B9D93A' : BLACK; g.strokeRect(-r, -r + 12, r * 2, r * 2); }
    g.restore(); }
}
function priceTag(g, t) { if (t < 23.74) return; const X = 2600, Y = -330 - 900 * (1 - spring(t - 23.74, 6, 10)), fp = seg(t, 24.26, 24.5), fl = Math.abs(Math.cos(fp * Math.PI)), free = fp > 0.5;
  g.save(); g.fillStyle = BLACK; g.fillRect(X - 5, Y - 1600, 10, 1460); g.translate(X, Y); g.rotate(ring(t - 23.74, 2.5, 7) * 0.12); g.scale(1, Math.max(0.03, fl));
  sl(g, -340, -150, 680, 300, 30, free ? LIME : '#fff', BLACK, 14); g.fillStyle = BLACK; g.beginPath(); g.arc(-270, 0, 26, 0, 7); g.fill();
  g.font = '700 190px "Silkscreen"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = free ? BLACK : '#BBB'; g.fillText(free ? 'free' : 'price', 30, 8);
  if (!free) { g.fillStyle = BLACK; g.fillRect(-190, -4, 440, 14); } g.restore(); g.textBaseline = 'alphabetic'; }
const STN = [[ST.ai, stAI, 190], [ST.gate, stGate, 150], [ST.clip, stClip, 110], [ST.shelf, stShelf, 470], [ST.plan, stPlan, 190], [ST.scan, stScan, 170], [ST.rend, stRend, 760]];
const NAMES = [[ST.ai, LY - 250, 'your ai', TL.ai], [ST.gate, LY - 268, 'mcp server', TL.gate], [ST.clip, LY - 345, 'your clip', 8.42], [1590, LY - 165, 'every word', 9.6], [ST.shelf, LY - 310, 'taste library', 12.52],
  [ST.plan, LY - 255, 'plan the edit', TL.plan], [ST.scan, LY - 335, 'editor rules', 15.8], [ST.rend, LY - 290, 'render', TL.rend]];

export default { dur: 25.2,
  async init(c) {
    o = c.getContext('2d'); m = new MooviFilm(512); await loadPixelFont();
    raw = await loadImg(TEX + 'raw-2.0.jpg'); ed = await loadImg(TEX + 'ed-4.3.jpg');
    icons[1] = await tintIcon(ICON + 'claude.svg', 160, '#D97757');
    icons[2] = await tintIcon(ICON + 'googlegemini.svg', 160, (x, s) => { const g = x.createLinearGradient(0, s, s, 0); g.addColorStop(0, '#5B7CFA'); g.addColorStop(1, '#9A7BF0'); return g; });
    o.font = '400 20px "Silkscreen"'; let x = [ST.clip + 125, ST.clip + 125];
    WORDS.forEach((w, i) => { const r = i < 4 ? 0 : 1, ww = o.measureText(w).width + 26; tiles.push({ x: x[r], y: r ? LY - 50 : LY - 98, w: ww }); x[r] += ww + 8; });
    const up = LY - 262; GX = [[11.2, ST.shelf - 100]]; GY = [[11.2, up]];
    PICKS.forEach((p, i) => { const T0 = 11.45 + 0.6 * i, [tx, ty] = tileXY(p), dx = ST.shelf + 215 + i * 70 + 32;
      GX.push([T0, GX[GX.length - 1][1]], [T0 + 0.18, tx + 32], [T0 + 0.36, tx + 32], [T0 + 0.52, dx], [T0 + 0.6, dx]);
      GY.push([T0 + 0.1, up], [T0 + 0.18, up], [T0 + 0.28, ty], [T0 + 0.36, up], [T0 + 0.5, up], [T0 + 0.58, LY - 72]); });
    GX.push([13.6, ST.shelf + 100]); GY.push([13.5, up]);
  },
  frame(t) {
    finish(o); cx = cr(t, 1) + 3 * Math.sin(t * 0.9); cy = cr(t, 2) + 2 * Math.sin(t * 0.7 + 1); z = Math.exp(cr(t, 3)) * (1 + 0.004 * Math.sin(t * 1.3));
    beginCam(o, 1, 640, 360);
    // giant pale words behind (parallax)
    for (const [str, Xc, ref, t0, out] of GW) { if (t < t0 || t >= out) continue; o.save(); wt(o, 0.6, ref); o.font = '700 250px "Silkscreen"'; const w = o.measureText(str).width; snapWord(o, str, Xc - w / 2, 500, 250, t, t0, { col: PALE, w: 700, out }); o.restore(); }
    // Moovi motion
    let mx = 640, lift = 0, sy = 1 + 0.012 * Math.sin(t * 1.9);
    for (const [a, b, x0, x1, hh] of HOPS) { if (t >= b) { mx = x1; sy -= 0.12 * Math.exp(-6 * (t - b)) * Math.cos(15 * (t - b)); } else if (t >= a) { const p = (t - a) / (b - a); mx = lerp(x0, x1, p); lift = (hh || 95) * 4 * p * (1 - p); sy += 0.05 * Math.sin(p * Math.PI); } else if (t > a - 0.15 && t >= (HOPS[HOPS.indexOf(HOPS.find(h => h[0] === a)) - 1]?.[1] ?? -1)) sy -= 0.08 * Math.sin(seg(t, a - 0.15, a) * Math.PI / 2); }
    for (const ts of STRESS) if (t > ts && t < ts + 0.7) sy -= 0.045 * ring(t - ts, 7, 20);
    if (t > 18.5 && t < 19.1) lift += 50 * Math.abs(Math.sin((t - 18.5) / 0.3 * Math.PI));
    const sx = 1 + (1 - sy) * 0.7, hx = mx, hy = FL - 260 * sy, hr = 66;
    // track + flowing pulses
    o.save(); wt(o); const hd = head(t);
    if (t >= 1.25) { const x0 = 370, x1 = Math.min(hd, ST.end), va = Math.max(x0, cx - 700 / z), vb = Math.min(x1, cx + 700 / z);
      if (vb > va) { o.fillStyle = BLACK; o.fillRect(va, LY - 1, vb - va, 3); o.fillRect(va, LY + 17, vb - va, 3); const off = (t * 60) % 24;
        if (z > 0.45) for (let x = Math.ceil((va - x0) / 24) * 24 + x0 + off; x < vb - 8; x += 24) o.fillRect(x, LY + 6, 8, 8); else o.fillRect(va, LY + 8, vb - va, 4);
        for (let x = 480; x < vb; x += 240) if (x > va) { o.fillRect(x, LY + 20, 4, 12); o.fillRect(x - 8, LY + 32, 20, 4); }
        if (x1 >= ST.end) o.fillRect(ST.end, LY - 12, 8, 44);
        const litX = t >= TL.rend ? ST.rend : t >= TL.scan ? ST.scan : t >= TL.plan ? ST.plan : t >= TL.shelf ? ST.shelf : t >= TL.clip ? ST.clip : t >= 7.0 ? lerp(ST.gate, ST.clip, seg(t, 7.0, 7.95)) : 0;
        for (let i = 0; i < 12; i++) { const x = ST.gate + ((t * 260 + i * 330) % 3300); if (x > litX || x < va || x > vb) continue; o.fillStyle = BLACK; o.fillRect(x - 9, LY - 2, 18, 18); o.fillStyle = LIME; o.fillRect(x - 6, LY + 1, 12, 12); } } }
    // opening: d_anyai's cables straighten into the line
    if (t < 1.3) { const e = smooth(seg(t, 0.25, 1.2)), ports = [[hx - hr, hy + 4], [hx + hr * 0.45, hy - hr * 0.9], [hx + hr, hy + 2]]; o.fillStyle = BLACK;
      DM.forEach((k, i) => { const b = ports[i], dx = b[0] - k[0], dy = b[1] - k[1], L = Math.hypot(dx, dy), a0 = i === 1 ? [k[0] - 54, k[1] + 26] : [k[0] + dx / L * 58, k[1] + dy / L * 58 + (i === 0 ? -6 : 14)], c0 = [(a0[0] + b[0]) / 2 + (i === 1 ? -50 : 0), (a0[1] + b[1]) / 2 + (i === 1 ? -10 : 58)];
        const A = [lerp(a0[0], 370, e), lerp(a0[1], LY + 10, e)], C = [lerp(c0[0], 505, e), lerp(c0[1], LY + 10, e)], B = [lerp(b[0], 640, e), lerp(b[1], LY + 10, e)], N = Math.round(L / 11);
        for (let j = 0; j <= N; j++) { const u = j / N, x = (1 - u) * (1 - u) * A[0] + 2 * (1 - u) * u * C[0] + u * u * B[0], y = (1 - u) * (1 - u) * A[1] + 2 * (1 - u) * u * C[1] + u * u * B[1]; o.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6); } }); }
    o.restore();
    // stations layer (hard shadow about the line)
    const s = subjBegin(); s.save(); wt(s);
    for (const [X, fn, half] of STN) { if (!vis(X, half)) continue; s.save(); if (unfold(s, X, t)) fn(s, t); s.restore(); }
    if (vis(ST.clip + 300, 400)) wordTiles(s, t); if (vis(600, 500)) packet(s, t); if (vis(3600, 500)) planCard(s, t);
    s.restore(); subjEnd(o, 360 + (LY - cy) * z);
    // marks: fly from d_anyai's places into the AI card header
    o.save(); wt(o);
    DM.forEach((k, i) => { const e = smooth(seg(t, 0.3 + i * 0.1, 1.15 + i * 0.1)), bob = Math.sin((t + 22) * 1.2 + i * 2.1) * 4 * (1 - e);
      mark(o, i, lerp(k[0], ST.ai - 170 + 36 + i * 46, e), lerp(k[1], LY - 250 + 29, e) + bob - Math.sin(e * Math.PI) * 50, lerp(1, 0.3, e), 1 - e * 3); });
    for (const [X, top, str, t0] of NAMES) { if (t < t0 || !vis(X, 200)) continue; const size = 15 / z; o.font = `400 ${size}px "Silkscreen"`; const w = o.measureText(str).width + size * 1.24; label(o, str, X - w / 2, top - size * 2.6, t, t0, { size }); }
    for (const [X, , half] of STN) { const t0 = Object.values(TL)[STN.findIndex(q => q[0] === X) >= 3 ? STN.findIndex(q => q[0] === X) : STN.findIndex(q => q[0] === X)], d = t - t0; if (d > 0 && d < 0.3) { const st = Math.floor(d / 0.06), r = Math.min(half, 240) + 20 + st * 16; o.strokeStyle = st % 2 ? '#B9D93A' : BLACK; o.lineWidth = 5; o.strokeRect(X - r, LY - 150 - r * 0.75, r * 2, r * 1.5); } }
    if (t >= 20.72 && vis(ST.rend, 300)) label(o, 'your machine', ST.rend - 120, LY + 46, t, 20.72, { size: 24, dot: true });
    priceTag(o, t); o.restore();
    // Moovi (+ the reel from d_anyai leaving down the line)
    const s2 = subjBegin(); s2.save(); wt(s2);
    if (t < 1.05) { const x = 990 + 1700 * cubicIn(seg(t, 0.3, 1.05)); s2.save(); s2.translate(x, FL); s2.rotate(-0.1 * seg(t, 0.3, 0.6)); s2.fillStyle = BLACK; rr(s2, -92, -312, 184, 318, 16); s2.fill(); cover(s2, ed, -86, -306, 172, 306, 11); s2.restore(); }
    const lk = clamp((cx - mx) / 420, -1, 1), look = [lk + 0.1 * Math.sin(t * 2.3), t > 20.5 && t < 22 ? -0.4 : 0.15 * Math.sin(t * 1.7)];
    const pose = { wave: Math.max(win(t, 4.7, 5.5), win(t, 6.15, 7.25)), direct: Math.max(win(t, 8.0, 9.0), 0.8 * win(t, 11.6, 13.0), win(t, 19.0, 19.6), win(t, 20.4, 21.3)), think: win(t, 13.7, 14.4),
      frame: win(t, 15.9, 17.2), celebrate: Math.max(win(t, 18.45, 19.1, 0.15), win(t, 22.75, 23.3)), look, shadow: 0, hop: 0 };
    drawMoovi(s2, m.render(t, pose), mx, FL - lift, S, { sx, sy });
    s2.restore(); subjEnd(o, 360 + (FL - cy) * z);
    // HUD (top-left stack)
    if (t < 1.4) { o.save(); o.translate(640, 360); o.scale(1.07, 1.07); o.translate(-668, -376);
      label(o, 'raw footage', 84, 78, t, -9, { solid: false, strike: 1, out: 0.2 }); label(o, 'finished edit', 84, 130, t, -9, { dot: true, spark: 1, out: 0.2 });
      snapWord(o, 'edit out', 84, 262, 72, t, -9, { out: 0.2 }); snapWord(o, 'underneath', 84, 262, 72, t, 0.2, { out: 1.4 }); if (t < 0.2) pixBar(o, 86, 292, 12, 12); o.restore(); }
    else { label(o, 'the studio line', 64, 70, t, 1.45, { size: 20, dot: true, spark: seg(t, 1.5, 1.7), out: 22.1 });
      label(o, 'sent to a cloud', 64, 34, t, 22.1, { size: 20, solid: false, strike: seg(t, 22.72, 22.9) }); label(o, 'stays on your machine', 64, 70, t, 22.75, { size: 20, dot: true, spark: seg(t, 22.8, 23) });
      HW.forEach(([t0, str], i) => snapWord(o, str, 64, 152, 52, t, t0, { out: HW[i + 1] ? HW[i + 1][0] : 1e9 }));
      if (t >= 3.3) pixBar(o, 66, 170, 12, key(t, [[3.3, 0], [4.7, 1.01], [6.24, 2.5], [7.98, 4.01], [9.18, 5.01], [11.4, 6.5], [13.9, 8.01], [15, 9.01], [18.48, 10.01], [19.4, 10.01], [20.1, 12.01]]), { s: 14, gap: 5 }); }
    o.restore(); finish(o);
  } };
