// ACT E: how it works inside. Studio (pure white, one hard shadow, pixel type, lime labels). dur 30 s
import { MooviFilm } from '../moovi-film.js';
import * as U from './_eg.js';
const { W, H, cl, lerp, seg, eo, expo, io, back, spring, ring, bump, hash, LIME, PX } = U;
let o, m, SH, WL, wl, raw;
const WORDS = ['so', 'today', 'i', 'um', 'tried', 'the', 'new', 'menu'], CUT = 3, TW = [];
const ROWY = 230, ROWX = 296, GAP = 14, TH = 62, T_CUT = 3.28, T_CLOSE = 6.36;
const PINS = [{ i: 1, t: 1.14, L: 62, k: 'cap' }, { i: 4, t: 1.4, L: 96, k: 'zoom' }, { i: 7, t: 1.68, L: 62, k: 'snd' }];
const ORDER = [0, 1, 2, 4, 5, 6, 7];
const MENU = ['captions', 'camera', 'sounds', 'fonts'], PICK = [1, 0, 2, 1], RV = [14.88, 15.84, 16.82, 17.4], TP = [15.4, 16.35, 17.22, 17.95], ORN = { 1: [4.36, 5.1], 4: [5.22, 5.86], 7: [5.82, 6.5] };
const STRESS = [.2, 1.14, 1.68, 3.28, 4.36, 5.22, 5.82, 6.36, 7.72, 8.32, 9.6, 10.24, 10.98, 12.38, 13.18, 13.58, 14.88, 15.84, 16.82, 17.4, 18.16, 19.44, 19.94, 20.58];

const tileX = (i, t) => { let x = ROWX; for (let k = 0; k < i; k++) x += TW[k] + GAP; if (i > CUT) x -= (TW[CUT] + GAP) * spring(t - T_CLOSE, 5, 9); return x; };
const litOf = (i, t) => { let a = ORN[i] ? bump(t, ORN[i][0], ORN[i][1]) : 0; const k = ORDER.indexOf(i); if (k >= 0) a = Math.max(a, bump(t, 7.66 + k * .14, 8.02 + k * .14)); return a; };
function tileState(i, t) {
  const ta = -.55 + i * .17, p = expo(seg(t, ta, ta + .75)), w = TW[i]; let x = tileX(i, t) + w / 2, y = ROWY + 5 * Math.sin(t * 1.3 + i * .9), a = seg(t, ta, ta + .1), rot = 0, s = lerp(.25, 1, p);
  x = lerp(246, x, p); y = lerp(420, y, p) - 70 * Math.sin(Math.PI * p);
  for (const pn of PINS) if (pn.i === i) y += 8 * ring(t - pn.t - .26, 7, 22);
  if (i === 6) y += 9 * ring(t - 12.0, 6, 20); if (i === 7) y += 9 * ring(t - 12.55, 6, 20);
  const lit = litOf(i, t); y -= 7 * lit;
  if (i === CUT) { const u = t - T_CUT; y -= 120 * eo(seg(u, 0, .6)); rot = .2 * eo(seg(u, 0, .6)); a *= 1 - seg(u, .22, .55); }
  return { x, y, w, a, rot, s, p, lit };
}
function drawTile(c, i, t) {
  const S = tileState(i, t); if (S.a <= 0) return; c.save(); c.globalAlpha = S.a; c.translate(S.x, S.y); c.rotate(S.rot); c.scale(S.s, S.s); if (S.p < .92) c.filter = `blur(${((1 - S.p) * 7).toFixed(1)}px)`;
  const sel = i === CUT && t > 2.98; U.slab(c, -S.w / 2, -TH / 2, S.w, TH, 9, sel ? '#000' : S.lit > .25 ? LIME : '#fff');
  c.font = PX(400, 30); c.fillStyle = sel ? '#fff' : '#000'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(WORDS[i], 0, 1);
  if (sel) { c.fillStyle = '#000'; c.fillRect(-S.w / 2 - 8, -1.5, S.w + 16, 3); }
  c.restore();
}
function drawPin(c, pn, t) {
  const td = t - pn.t; if (td <= 0) return; const S = tileState(pn.i, t), fall = -300 * (1 - Math.pow(cl(td / .26), 2)), ax = S.x, top = S.y - TH / 2, bot = S.y + TH / 2;
  // ornament on its thread (drawn first, under the tile edge)
  const pa = spring(td - .34, 6, 10), ang = .5 * ring(td - .34, 2.4, 7) + (pn.i > CUT ? .5 * ring(t - T_CLOSE, 2.1, 7.5) : 0) + .03 * Math.sin(t * 1.7 + pn.i), act = S.lit;
  if (td > .34) { c.save(); c.translate(ax, bot); c.rotate(ang); const L = pn.L * pa; c.strokeStyle = '#000'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, L); c.stroke(); c.translate(0, L); c.scale(cl(pa) * (1 + .16 * act), cl(pa) * (1 + .16 * act));
    if (pn.k === 'cap') { U.slab(c, -58, 0, 116, 40, 6); c.fillStyle = LIME; c.fillRect(-46, 8, 92 * (.25 + .75 * Math.max(act, .0) + (act > 0 ? 0 : .75)), 24); c.font = PX(400, 20); c.fillStyle = '#000'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('today', 0, 21); }
    else if (pn.k === 'zoom') { const a = 40, b = 28, k = 12; c.strokeStyle = '#000'; c.lineWidth = 3.5; c.lineCap = 'butt'; c.translate(0, b + 4); for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { c.beginPath(); c.moveTo(sx * a, sy * (b - k)); c.lineTo(sx * a, sy * b); c.lineTo(sx * (a - k), sy * b); c.stroke(); } const z = .45 + .4 * act + .04 * Math.sin(t * 2); c.fillStyle = LIME; c.fillRect(-a * z, -b * z, a * 2 * z, b * 2 * z); c.lineWidth = 2; c.strokeRect(-a * z, -b * z, a * 2 * z, b * 2 * z); }
    else { c.translate(0, 26); for (let r = 0; r < 3; r++) { const q = (act * 1.4 + r * .3) % 1; if (act > .02) { c.strokeStyle = `rgba(0,0,0,${(1 - q) * act})`; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, 26 + q * 34, 0, 7); c.stroke(); } } c.fillStyle = '#000'; c.beginPath(); c.arc(0, 0, 25, 0, 7); c.fill(); for (let b = 0; b < 5; b++) { const hh = 8 + 18 * Math.abs(Math.sin(b * 1.9 + 1 + (act > 0 ? t * 9 : 0))) * (.45 + .55 * act); c.fillStyle = b === 2 ? LIME : '#fff'; c.fillRect(-15 + b * 6.5, -hh / 2, 4, hh); } }
    c.restore(); }
  // the pin: needle + glossy lime head
  c.save(); c.translate(ax, top + fall); const sq = 1 - .22 * ring(td - .26, 9, 26); c.strokeStyle = '#000'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -16); c.lineTo(0, 5); c.stroke(); c.scale(1 / sq, sq); c.beginPath(); c.arc(0, -22, 12, 0, 7); c.fillStyle = LIME; c.fill(); c.lineWidth = 2.5; c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-4, -27, 4, 2.6, -.6, 0, 7); c.fill(); c.restore();
}
function phone(c, t) { // the raw clip, standing at left, being listened to
  U.slab(c, 66, 286, 178, 308, 22, '#000'); U.cover(c, raw, 73, 293, 164, 294, 16, 1.02 + .01 * Math.sin(t)); const on = 1 - seg(t, 1.5, 2.0);
  c.fillStyle = '#000'; c.fillRect(-900, 606, 3400, 5); c.font = PX(400, 18); c.fillStyle = LIME; c.fillRect(66, 622, c.measureText('transcribe').width + 22, 30); c.fillStyle = '#000'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('transcribe', 77, 638);
  if (on > 0) for (let b = 0; b < 9; b++) { const hh = 5 + 30 * on * Math.abs(Math.sin(b * 1.7 + t * 8 + Math.sin(t * 3 + b))); c.fillStyle = b % 3 === 1 ? LIME : '#fff'; c.fillRect(101 + b * 12.5, 560 - hh, 8, hh); }
}
// ---------- scene B: the AI and the menus
function aiCard(c, t) {
  const pe = expo(seg(t, 9.44, 10.1)), sm = io(seg(t, 12.0, 12.6)); if (t < 9.44) return; const gone = t > 18.22; if (gone) return; const gl = t > 18.1 ? (t < 18.16 ? 14 : -8) : 0;
  const cx = lerp(lerp(640, 430, pe), 215, sm) + gl, cy = lerp(lerp(290, 345, pe), 300, sm), s = lerp(.6, 1.3, pe) * lerp(1, .57, sm);
  c.save(); c.translate(cx, cy); c.scale(s, s); c.globalAlpha = seg(t, 9.44, 9.6); if (pe < .95) c.filter = `blur(${((1 - pe) * 12).toFixed(1)}px)`;
  U.slab(c, -180, -125, 360, 250, 18); c.fillStyle = '#000'; c.fillRect(-180 + 1, -125 + 46, 358, 2.5); U.sparkle(c, -152, -101, 11, '#000'); c.font = PX(400, 18); c.fillStyle = '#000'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('your ai', -132, -100);
  for (let d = 0; d < 3; d++) { c.fillStyle = Math.floor(t * 3) % 3 === d ? '#000' : '#C9C9C9'; c.fillRect(124 + d * 12, -104, 7, 7); }
  // the blank frame it would like to draw on
  c.setLineDash([7, 6]); c.strokeStyle = '#000'; c.lineWidth = 2; c.strokeRect(-150, -58, 300, 152); c.setLineDash([]);
  const s1 = io(seg(t, 10.24, 11.25)) * .86, dz = seg(t, 11.3, 11.95), P = u => [-128 + u * 250, 18 + 34 * Math.sin(u * 9) + 14 * Math.sin(u * 23 + 1)];
  if (dz < .12) { c.strokeStyle = '#000'; c.lineWidth = 4; c.lineJoin = 'round'; c.beginPath(); for (let u = 0; u <= s1; u += .01) { const [x, y] = P(u); u ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  const [px, py] = P(s1);
  if (t > 9.9 && dz < .12) { const ar = expo(seg(t, 9.9, 10.3)); c.save(); c.translate(px + (1 - ar) * 150, py - (1 - ar) * 120 + 2 * Math.sin(t * 30) * (s1 > 0 && s1 < .85 ? 1 : 0)); c.rotate(-.72 + .08 * Math.sin(t * 11)); c.globalAlpha *= ar;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(16, -9); c.lineTo(16, 9); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#000'; c.stroke(); c.fillStyle = '#000'; c.beginPath(); c.moveTo(0, 0); c.lineTo(6, -3.4); c.lineTo(6, 3.4); c.fill();
    c.fillStyle = LIME; c.fillRect(16, -9, 96, 18); c.strokeRect(16, -9, 96, 18); c.fillStyle = '#000'; c.fillRect(112, -9, 16, 18); c.restore(); }
  if (dz >= .12 && dz < 1) for (let k = 0; k < 34; k++) { const u = k < 20 ? hash(k) * s1 : s1, [x, y] = P(u), e = eo(dz), ox = k < 20 ? 0 : (k - 20) * 7 * .74, oy = k < 20 ? 0 : -(k - 20) * 7 * .66, sz = 12 * (1 - dz * .8); c.fillStyle = k % 5 === 0 ? '#B9DB2E' : '#000'; c.fillRect(Math.round((x + ox + (hash(k + 9) - .5) * 90 * e) / 4) * 4, Math.round((y + oy + (hash(k + 40) - .3) * 60 * e + 70 * dz * dz) / 4) * 4, sz, sz); }
  if (t > 12.6) { let n = 0; for (let i = 0; i < 4; i++) if (t > TP[i]) n++; U.pixbar(c, -46, 8, 4, n / 4, 20); }
  c.restore();
}
const cardPos = (i, t) => { const td = 13.62 + i * .1, p = back(seg(t, td, td + .6)), q = io(seg(t, 18.1, 19.0)); let x = lerp(985, 480 + 140 * i, p), y = lerp(560, 292 + 13 * (i - 1.5) * (i - 1.5), p), r = lerp(.7, (-9 + 6 * i) * Math.PI / 180, p), s = lerp(.08, 1, p);
  x = lerp(x, 760 + i * 95, q); y = lerp(y, 250 - i * 14, q); s *= lerp(1, .34, q); r *= 1 - q; return { x, y, r, s, a: seg(t, td, td + .08) * (1 - seg(q, .55, .95)), q }; };
function menuCard(c, i, t) {
  const S = cardPos(i, t); if (S.a <= 0) return; const tp = TP[i], hit = t > tp, rv = seg(t, RV[i] - .14, RV[i] + .2), fx = Math.max(.03, Math.abs(Math.cos(Math.PI * rv))); c.save(); c.globalAlpha = S.a; c.translate(S.x, S.y - 5 * ring(t - tp, 5, 18)); c.rotate(S.r); c.scale(S.s * fx, S.s * (1 + .06 * Math.sin(Math.PI * rv))); if (S.q > .05) c.filter = `blur(${(S.q * 5).toFixed(1)}px)`;
  if (rv < .5) { U.slab(c, -64, -100, 128, 200, 12, '#000'); U.sparkle(c, 0, 0, 22 + 3 * Math.sin(t * 5 + i), LIME); c.restore(); return; }
  U.slab(c, -64, -100, 128, 200, 12); c.font = PX(400, 14); c.fillStyle = '#000'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(MENU[i], -52, -82); c.fillRect(-64, -68, 128, 2);
  for (let r = 0; r < 3; r++) { const y = -62 + r * 53, ch = hit && r === PICK[i]; if (ch) { c.fillStyle = LIME; c.fillRect(-58, y + 3, 116, 48); c.strokeStyle = '#000'; c.lineWidth = 2; c.strokeRect(-58, y + 3, 116, 48); }
    U.preview(c, i, r + i, -50, y + 6, ch ? 84 : 100, 42, t * 3 + r + i); if (ch) { c.strokeStyle = '#000'; c.lineWidth = 3; c.beginPath(); c.moveTo(34, y + 28); c.lineTo(40, y + 34); c.lineTo(50, y + 20); c.stroke(); } }
  c.restore();
}
function aiCursor(c, t) {
  if (t < 12.5 || t > 18.25) return; const pts = [[330, 350]]; for (let i = 0; i < 4; i++) { const S = cardPos(i, 17.9); pts.push([S.x + 22, S.y - 62 + PICK[i] * 53 + 30]); }
  let x = pts[0][0], y = pts[0][1]; for (let i = 0; i < 4; i++) { const tp = TP[i], p = io(seg(t, tp - .4, tp - .02)); const ax = x, ay = y; x = lerp(ax, pts[i + 1][0], p); y = lerp(ay, pts[i + 1][1], p) - 26 * Math.sin(Math.PI * p) * (p > 0 && p < 1 ? 1 : 0); }
  let pr = 0; for (let i = 0; i < 4; i++) pr = Math.max(pr, bump(t, TP[i] - .05, TP[i] + .17)); const wb = 1 - seg(t, 14.8, 15.1); x += 60 * wb * Math.sin(t * 1.9) + 40 * wb; y += 22 * wb * Math.sin(t * 3.1); c.save(); c.globalAlpha = seg(t, 12.5, 12.6) * (1 - seg(t, 18.1, 18.2)); U.cursor(c, x, y, 1.15, pr, 'ai'); c.restore();
}
// ---------- scene C: the wall of taste, receding into white
const VPX = 1262, VPY = 300, X0 = 560, DU = .17, RH = 126;
function wall(c, t) {
  c.clearRect(0, 0, W, H); const uo = (t - 18) * .03, j0 = Math.floor(uo / DU);
  for (let j = j0 + 54; j >= j0; j--) { const u0 = j * DU - uo, u1 = u0 + DU * .88; if (u1 <= 0) continue; const d0 = 1 + Math.max(u0, 0), d1 = 1 + u1, dm = (d0 + d1) / 2, xa = VPX + (X0 - VPX) / d0, xb = VPX + (X0 - VPX) / d1; const edge = u0 < 0 ? cl(u1 / (DU * .88)) : 1, fog = Math.pow(1 / dm, 1.15) * edge; if (fog < .02) continue;
    for (let r = 0; r < 6; r++) { const h0 = -416 + r * RH + 6, h1 = h0 + RH - 12, id = j * 7 + r, hs = hash(id), lit = Math.sin(t * .9 + hs * 60) > .97; c.globalAlpha = fog; c.beginPath(); c.moveTo(xa, VPY + h0 / d0); c.lineTo(xb, VPY + h0 / d1); c.lineTo(xb, VPY + h1 / d1); c.lineTo(xa, VPY + h1 / d0); c.closePath();
      const dark = hs > .86; c.fillStyle = lit || (hs > .72 && hs <= .86) ? LIME : dark ? '#111' : '#fff'; c.fill(); c.strokeStyle = '#000'; c.lineWidth = Math.max(.6, 2.4 / dm); c.stroke();
      if (dm < 5.5 && edge > .5) { const cw = (xb - xa), ch = (h1 - h0) / dm, cy = VPY + (h0 + h1) / 2 / dm; c.save(); c.translate((xa + xb) / 2, cy); c.transform(1, ((h0 + h1) / 2) * (1 / d1 - 1 / d0) / cw, 0, 1, 0, 0); U.preview(c, Math.floor(hash(id + .5) * 5), Math.floor(hash(id + .25) * 6), -cw * .42, -ch * .36, cw * .84, ch * .72, t * 1.5 + hs * 9, dark ? '#fff' : '#000'); c.restore(); } } }
  c.globalAlpha = 1;
}
export default { dur: 21.4,
  async init(cv) { o = cv.getContext('2d'); m = new MooviFilm(512); SH = new U.Shadow(); WL = document.createElement('canvas'); WL.width = W; WL.height = H; wl = WL.getContext('2d');
    await Promise.all([document.fonts.load(PX(400, 20)), document.fonts.load(PX(700, 20))]); raw = await U.loadImg(U.TEX + 'raw-2.0.jpg'); o.font = PX(400, 30); for (const w of WORDS) TW.push(Math.round(o.measureText(w).width) + 40); },
  frame(t) {
    const c = o; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.filter = 'none'; U.studio(c);
    // camera (scene A glide)
    const g = io(seg(t, 3.9, 4.6)) * (1 - io(seg(t, 6.0, 6.8))), pan = io(seg(t, 4.4, 6.0)), op = 1 - Math.pow(1 - seg(t, 0, 1.1), 4), z = Math.pow(2.3, 1 - op) * (1 + .04 * Math.min(t, 9) / 9) * lerp(1, 1.42, g) * (1 + .03 * seg(t, 9.5, 18.2)), cx = lerp(170, lerp(640, lerp(560, 940, pan), g), op), cy = lerp(430, lerp(360, 320, g), op);
    const cam = (k, f = 1) => { k.translate(640, 360); k.scale(lerp(1, z, f), lerp(1, z, f)); k.translate(-lerp(640, cx, f), -lerp(360, cy, f)); };
    const offA = -1700 * io(seg(t, 8.85, 9.5)), qC = io(seg(t, 18.1, 19.0)), inC = t > 18.1;
    // Moovi
    const ms = lerp(380, 290, qC), mx = lerp(1060, 400, qC), mb = lerp(704, 688, qC) , gy = mb - ms * .105;
    const wag = eo(seg(t, 10.95, 11.25)) * (1 - io(seg(t, 11.9, 12.3))), fr = eo(seg(t, 13.6, 14.0)) * (1 - io(seg(t, 18.0, 18.4))), dir = .8 * bump(t, 3.15, 3.9) + bump(t, 4.3, 5.05) + bump(t, 5.15, 5.78) + bump(t, 5.8, 6.5) + .7 * bump(t, 7.6, 8.8), lean = eo(seg(t, 0, .5)) * (1 - io(seg(t, 2.4, 3.0))) * .9 + .6 * qC; let talk = 0; for (const w of STRESS) talk += .42 * ring(t - w, 8, 20);
    const look = t < 9 ? [-.75 + .2 * Math.sin(t * .6), .35] : t < 18.1 ? [lerp(-.75, -.5, seg(t, 12, 12.6)) + .15 * Math.sin(t * 1.3), .1 + .12 * Math.sin(t * 2.1)] : [lerp(-.5, .9, qC), lerp(.1, -.9, qC)];
    const hopT = t - 18.2, hop = inC ? .28 * Math.max(0, Math.sin(Math.PI * seg(hopT, .1, .75))) : 0, sq = -.5 * bump(t, 18.1, 18.32) + .6 * ring(hopT - .75, 7, 16) + talk;
    const pose = { lean, direct: cl(dir + .85 * fr), wave: wag, squint: wag * .8, look, hop, squash: sq, shadow: 0, think: .5 * bump(t, 19.6, 20.9), turn: .55 * qC };
    const mv = m.render(t, pose);
    // shadows
    SH.begin(); SH.cast(gy, k => { k.translate(mx, mb); k.scale(-1, 1); k.drawImage(mv, -ms / 2, -ms, ms, ms); }, k => cam(k));
    if (t < 9.55) SH.cast(594, k => { U.rr(k, 66 + offA, 286, 178, 308, 22); k.fill(); }, k => cam(k));
    SH.lay(c, .17);
    if (inC) { const a = seg(t, 18.3, 19.0); c.fillStyle = `rgba(0,0,0,${.085 * a})`; c.beginPath(); c.moveTo(X0, VPY + 340); c.lineTo(VPX, VPY); c.lineTo(W, VPY); c.lineTo(W, H); c.lineTo(X0 + U.K1 * 80 / U.K2, H); c.closePath(); c.fill(); }
    // giant pale word behind everything
    c.save(); cam(c, .45); const gw = t < 1.14 ? ['words', 1] : t < 8.9 ? ['pinned', seg(t, 1.14, 1.26)] : t < 13.58 ? ['', 0] : t < 18.1 ? ['menus', seg(t, 13.58, 13.7)] : ['', 0];
    U.giant(c, gw[0], 372, 612, 196, gw[1]); c.restore();
    if (inC) { wall(wl, t); const a = seg(t, 18.2, 18.9), b = lerp(16, 0, eo(seg(t, 18.5, 19.7))); c.save(); c.globalAlpha = a; if (b > .3) c.filter = `blur(${b.toFixed(1)}px)`; const dz = 1 + .05 * seg(t, 18, 21.4) + .5 * Math.pow(seg(t, 20.5, 21.4), 3); c.translate(VPX, VPY); c.scale(dz, dz); c.translate(-VPX, -VPY); c.drawImage(WL, 0, 0); c.restore(); }
    // scene A world
    if (t < 9.55) { const n = offA < -5 && offA > -1690 ? 4 : 1; for (let k = 0; k < n; k++) { const tt = t - k * .012, oa = -1700 * io(seg(tt, 8.85, 9.5)); c.save(); c.globalAlpha = n > 1 ? .5 / (k * .7 + 1) : 1; cam(c); c.translate(oa, 0); phone(c, tt); for (const pn of PINS) drawPin(c, pn, tt); for (let i = 0; i < WORDS.length; i++) drawTile(c, i, tt); c.restore(); } }
    // scene B
    if (t > 9.4 && t < 19.1) { c.save(); cam(c); for (let i = 0; i < 4; i++) menuCard(c, i, t); aiCard(c, t); c.restore(); }
    // Moovi on top
    c.save(); cam(c); c.translate(mx, mb); c.scale(-1, 1); c.drawImage(mv, -ms / 2, -ms, ms, ms); c.restore();
    c.save(); cam(c); aiCursor(c, t); c.restore();
    // label stack, top-left (screen space)
    const X = 70, Y = 54;
    if (t < .58) { U.label(c, 'listening', X, Y, 1, t); U.pixbar(c, X, Y + 52, 8, seg(t, -.6, 1.3)); }
    else if (t < 7.62) { U.label(c, 'pin each edit to a word', X, Y, seg(t, .58, .68), t); if (t > 3.28) U.label(c, 'cut the um', X, Y + 42, seg(t, 3.28, 3.38), t, { strike: t > 6.36, sp: eo(seg(t, 6.36, 6.7)) }); }
    else if (t < 8.9) { U.label(c, 'captions that drift', X, Y, seg(t, 7.62, 7.72), t, { strike: 1, sp: eo(seg(t, 7.72, 8.1)) }); U.label(c, 'pinned to the word', X, Y + 42, seg(t, 8.32, 8.42), t, { spark: eo(seg(t, 8.42, 8.8)) }); }
    else if (t > 9.6 && t < 18.1) { const st = t > 11.0; U.label(c, 'ai draws the frame', X, Y, seg(t, 9.6, 9.7), t, st ? { strike: 1, sp: eo(seg(t, 11.0, 11.4)) } : {}); U.label(c, 'ai picks from my menus', X, Y + 42, seg(t, 13.18, 13.28), t, { spark: eo(seg(t, 13.28, 13.6)) }); }
    else if (t >= 18.2) { U.label(c, 'collected by hand', X, Y, seg(t, 19.94, 20.04), t, { spark: eo(seg(t, 20.04, 20.4)) }); U.typed(c, 'taste', X - 4, Y + 146, 100, seg(t, 19.44, 19.85), t, { w: 700 }); U.pixbar(c, X, Y + 176, 12, seg(t, 18.5, 21.2)); }
    // exit: one dark taste tile flies at the camera and becomes the next (dark) stage
    if (t > 20.5) { const e = Math.pow(seg(t, 20.5, 21.36), 3.2), x = lerp(742, -30, e), y = lerp(246, -30, e), w = lerp(84, W + 60, e), h = lerp(96, H + 60, e); c.save(); U.rr(c, x, y, w, h, lerp(6, 0, e)); c.fillStyle = '#0A0A0C'; c.fill(); c.strokeStyle = '#000'; c.lineWidth = 2.5; c.stroke(); c.clip(); c.globalAlpha = 1 - seg(e, .25, .8); U.preview(c, 2, 1, x + w * .2, y + h * .25, w * .6, h * .5, t * 6, '#fff'); c.restore(); }
  } };
