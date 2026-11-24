// ACT G: the refusal and the close. Studio (pure white, one hard shadow, pixel type, lime labels). dur 32 s
import { MooviFilm } from '../moovi-film.js';
import * as U from './_eg.js';
const { W, H, cl, lerp, seg, eo, expo, io, back, spring, ring, bump, hash, LIME, PX } = U;
let o, m, SH, WM, wm, ed1, raw13, ed15; const RED = '#FF3B30';
// phone (scene A): outer slab and inner screen
const PX0 = 442, PY0 = 66, PW = 317, PH = 566, SX = PX0 + 7, SY = PY0 + 7, SW = PW - 14, SH_ = PH - 14, SCX = SX + (SW - 44) / 2 + 4;
const SAFE = [SX + 14, SY + 54, SW - 68, SH_ * .74 - 54];
function plateAt(t) {
  const S = [SCX, SY + SH_ * .61], B = [SCX + 22, SY + SH_ * .868]; let x = SX - 150, y = SY + SH_ * .44;
  const a = io(seg(t, .9, 2.0)); x = lerp(x, S[0], a); y = lerp(y, S[1], a) - 30 * Math.sin(Math.PI * a);
  if (t > 2.0 && t < 3.7) { const w = bump(t, 2.0, 3.7); x += 9 * w * Math.sin(t * 3.1); y += 6 * w * Math.sin(t * 4.3 + 1); }
  const b = io(seg(t, 3.7, 4.9)); x = lerp(x, B[0], b); y = lerp(y, B[1], b);
  if (t > 6.16) x += 5 * ring(t - 6.16, 9, 40);
  const f = spring(t - 8.48, 5, 8.5); x = lerp(x, S[0], f); y = lerp(y, S[1] + 8, f);
  return { x, y, a: seg(t, .9, 1.05), rot: .05 * Math.sin(Math.PI * a) * (a < 1 ? 1 : 0) - .04 * Math.sin(Math.PI * b) * (b < 1 ? 1 : 0) };
}
function icon(c, k, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineWidth = 2.6; c.lineJoin = 'round'; c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 5;
  if (k === 0) { c.beginPath(); c.moveTo(0, 9); c.bezierCurveTo(-16, -3, -9, -13, 0, -5); c.bezierCurveTo(9, -13, 16, -3, 0, 9); c.fill(); }
  else if (k === 1) { c.beginPath(); c.arc(0, -1, 10, .9, Math.PI * 2 + .2); c.lineTo(9, 10); c.closePath(); c.stroke(); }
  else if (k === 2) { c.beginPath(); c.moveTo(-11, -9); c.lineTo(12, -9); c.lineTo(0, 11); c.lineTo(-3, -1); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(-3, -1); c.lineTo(12, -9); c.stroke(); }
  else { c.shadowBlur = 0; U.rr(c, -11, -11, 22, 22, 5); c.fill(); c.fillStyle = '#000'; c.fillRect(-4, -4, 8, 8); }
  c.restore(); }
function phoneA(c, t) {
  U.slab(c, PX0, PY0, PW, PH, 34, '#000'); U.cover(c, ed1, SX, SY, SW, SH_, 28, 1.53 + .035 * seg(t, 0, 11.7), .5, 0);
  c.save(); U.rr(c, SX, SY, SW, SH_, 28); c.clip();
  // the caption (under the app's own UI, as on a real phone)
  const P = plateAt(t), fixed = t > 9.0, stop = t > 6.16 && t < 8.48, PWd = 206, PHt = 42;
  if (P.a > 0) { c.save(); c.globalAlpha = P.a; c.translate(P.x, P.y); c.rotate(P.rot); c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 10; c.shadowOffsetY = 3; c.fillStyle = '#fff'; U.rr(c, -PWd / 2, -PHt / 2, PWd, PHt, 8); c.fill(); c.shadowColor = 'transparent';
    const k = fixed ? Math.floor(seg((t - 9.3) % 1.2, 0, .9) * 2 - 1e-6) : -1; c.font = '800 18px "Inter Tight"'; c.textBaseline = 'middle'; c.textAlign = 'left'; const ws = ['inexorably', 'underneath'], w0 = c.measureText(ws[0] + ' ').width, tw = c.measureText(ws.join(' ')).width; let x = -tw / 2;
    ws.forEach((w, i) => { const ww = c.measureText(w).width; if (i === k) { c.fillStyle = LIME; c.fillRect(x - 4, -13, ww + 8, 26); } c.fillStyle = '#000'; c.fillText(w, x, 1); x += w0; }); c.restore(); }
  // app UI
  let g = c.createLinearGradient(0, SY + SH_ * .66, 0, SY + SH_); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.6)'); c.fillStyle = g; c.fillRect(SX, SY + SH_ * .66, SW, SH_ * .34);
  const by = SY + SH_ - 44; c.fillStyle = '#000'; c.fillRect(SX, by, SW, 44); for (let i = 0; i < 5; i++) { c.fillStyle = i === 2 ? '#fff' : 'rgba(255,255,255,.55)'; i === 2 ? c.fillRect(SX + 30 + i * 60 - 9, by + 13, 18, 18) : c.fillRect(SX + 30 + i * 60 - 7, by + 15, 14, 14); }
  c.fillStyle = '#fff'; c.beginPath(); c.arc(SX + 30, by - 62, 13, 0, 7); c.fill(); c.fillRect(SX + 52, by - 68, 92, 11); c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(SX + 154, by - 72, 58, 20); c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(SX + 16, by - 38, 180, 9); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(SX + 16, by - 22, 124, 9);
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(SX, by - 3, SW, 3); c.fillStyle = '#fff'; c.fillRect(SX, by - 3, SW * ((t * .09) % 1), 3);
  const bx = SX + SW - 30; [.5, .6, .7].forEach((f, i) => { icon(c, i, bx, SY + SH_ * f, 1.12); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(bx - 9, SY + SH_ * f + 19, 18, 5); }); icon(c, 3, bx, by - 30, 1.1);
  c.restore();
  // safe-area outline
  const sa = eo(seg(t, .7, 1.5)) * (1 - seg(t, 10.6, 11.1)); if (sa > 0) { c.save(); c.globalAlpha = sa; c.setLineDash([9, 7]); c.lineDashOffset = -t * 9; c.lineWidth = 2.5; c.strokeStyle = stop ? RED : fixed ? LIME : '#fff'; c.strokeRect(SAFE[0], SAFE[1], SAFE[2], SAFE[3] * (t < 1.5 ? sa : 1)); c.setLineDash([]);
    c.font = PX(400, 12); const lw = c.measureText('safe area').width + 12; c.fillStyle = stop ? RED : fixed ? LIME : '#fff'; c.fillRect(SAFE[0], SAFE[1] - 20, lw, 20); c.fillStyle = stop ? '#fff' : '#000'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('safe area', SAFE[0] + 6, SAFE[1] - 10); c.restore(); }
  // refusal marks, drawn over the app UI so they read
  if (t > 6.16 && !fixed) { const fl = t < 6.26 ? 1 : .0; c.save(); c.translate(P.x, P.y); c.strokeStyle = RED; c.lineWidth = fl ? 7 : 3.5; const pd = fl ? 9 : 4; U.rr(c, -PWd / 2 - pd, -PHt / 2 - pd, PWd + pd * 2, PHt + pd * 2, 11); c.stroke(); if (t > 6.26) { const s = back(seg(t, 6.26, 6.56)); c.translate(-PWd / 2 - 2, -PHt / 2 - 2); c.scale(s, s); c.fillStyle = RED; c.beginPath(); c.arc(0, 0, 15, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(-5.5, -5.5); c.lineTo(5.5, 5.5); c.moveTo(5.5, -5.5); c.lineTo(-5.5, 5.5); c.stroke(); } c.restore();
    if (fl) { c.strokeStyle = RED; c.lineWidth = 8; U.rr(c, PX0 - 6, PY0 - 6, PW + 12, PH + 12, 38); c.stroke(); } }
  if (t > 9.1 && t < 11.8) { const s = back(seg(t, 9.1, 9.45)) * (1 - seg(t, 10.9, 11.2)); c.save(); c.translate(P.x + PWd / 2 + 2, P.y - PHt / 2 - 2); c.scale(s, s); c.fillStyle = LIME; c.beginPath(); c.arc(0, 0, 17, 0, 7); c.fill(); c.strokeStyle = '#000'; c.lineWidth = 2.5; c.stroke(); c.lineWidth = 4; c.beginPath(); c.moveTo(-7, 0); c.lineTo(-2, 6); c.lineTo(8, -6); c.stroke(); c.restore(); }
  // the AI's cursor holding the caption
  const ca = seg(t, .9, 1.05) * (1 - seg(t, 10.0, 10.3)); if (ca > 0) { const lv = io(seg(t, 9.5, 10.3)); c.save(); c.globalAlpha = ca; U.cursor(c, P.x + 58 - 260 * lv + (t > 6 && t < 7.6 ? 0 : 0), P.y + 8 + 150 * lv, 1.15, t > 1.4 && t < 9.4 ? .8 : 0, 'ai'); c.restore(); }
}
function clipCard(c, img, x, y, w, h, tag, t, live) { U.slab(c, x, y, w, h, 20, '#000'); U.cover(c, img, x + 6, y + 6, w - 12, h - 12, 15, 1.03); if (tag) { c.font = PX(400, 13); const tw = c.measureText(tag).width + 14 + (live ? 14 : 0); c.fillStyle = live ? '#fff' : LIME; c.fillRect(x + 16, y + 16, tw, 22); if (live && Math.floor(t * 2) % 2 === 0) { c.fillStyle = RED; c.fillRect(x + 22, y + 22, 10, 10); } c.fillStyle = '#000'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(tag, x + 23 + (live ? 14 : 0), y + 27.5); }
  if (live) for (let b = 0; b < 11; b++) { const hh = 5 + 30 * live * Math.abs(Math.sin(b * 1.7 + t * 8 + Math.sin(t * 3 + b))); c.fillStyle = b % 4 === 1 ? LIME : '#fff'; c.fillRect(x + 28 + b * 13, y + h - 26 - hh, 8, hh); } }
function wordmark(t) { const c = wm; c.clearRect(0, 0, 780, 190); c.globalCompositeOperation = 'source-over'; c.font = '800 138px "Inter Tight"'; c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.fillStyle = '#000'; let x = 6; ['Edit', 'Easy'].forEach((w, i) => { const p = expo(seg(t, 13.78 + i * .24, 14.5 + i * .24)); c.save(); c.globalAlpha = seg(t, 13.78 + i * .24, 13.95 + i * .24); if (p < .96) c.filter = `blur(${((1 - p) * 10).toFixed(1)}px)`; c.fillText(w, x, 140 + 34 * (1 - p)); c.restore(); x += c.measureText(w + ' ').width - 8; });
  for (const t0 of [16.9, 22.0]) { const s = seg(t, t0, t0 + 1.5); if (s > 0 && s < 1) { const xx = lerp(-200, 980, io(s)); c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(xx - 110, 0, xx + 110, 60); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.62)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 780, 190); c.globalCompositeOperation = 'source-over'; } } }
const STRESS = [.2, .96, 1.58, 2.3, 2.98, 3.7, 4.28, 4.58, 5.26, 6.16, 7.16, 7.34, 8.48, 9.24, 10.04, 10.84, 11.56, 12.5, 13.0, 13.78, 14.02, 14.8, 15.52, 16.82, 17.54, 18.2, 19.2, 19.94, 20.66];
export default { dur: 24.6,
  async init(cv) { o = cv.getContext('2d'); m = new MooviFilm(512); SH = new U.Shadow(); WM = document.createElement('canvas'); WM.width = 780; WM.height = 190; wm = WM.getContext('2d');
    await Promise.all([document.fonts.load(PX(400, 20)), document.fonts.load(PX(700, 20)), document.fonts.load('800 20px "Inter Tight"')]); [ed1, raw13, ed15] = await Promise.all(['ed-1.0', 'raw-13.0', 'ed-15.0'].map(n => U.loadImg(U.TEX + n + '.jpg'))); },
  frame(t) {
    const c = o; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.filter = 'none'; U.studio(c); if (t < .55) { c.fillStyle = `rgba(10,10,12,${1 - eo(seg(t, 0, .55))})`; c.fillRect(0, 0, W, H); } let talk = 0; for (const w of STRESS) talk += .42 * ring(t - w, 8, 20);
    const z = t < 11.45 ? (1 + .035 * t / 11.45) * Math.pow(2.3, Math.pow(1 - seg(t, 0, .9), 4)) : 1 + .05 * seg(t, 11.45, 24.6), zc = t < 11.45 ? [600, 349] : [640, 400];
    const cam = k => { k.translate(zc[0], zc[1]); k.scale(z, z); k.translate(-zc[0], -zc[1]); };
    const offA = -1600 * io(seg(t, 11.1, 11.75)), offB = 1600 * (1 - io(seg(t, 11.2, 11.9))), A = t < 11.75, B = t > 11.2;
    SH.begin(); let mvA = null; const sA = 400, xA = 1022, bA = 706;
    // ---- shadows + moovi renders
    const drawA = (k, tt, oa) => { k.save(); cam(k); k.translate(oa, 0); phoneA(k, tt); k.restore(); };
    const dirA = eo(seg(t, 6.05, 6.3)) * (1 - io(seg(t, 9.2, 9.8)));
    const poseA = { direct: dirA, squint: .6 * dirA, lean: .5 * eo(seg(t, .9, 1.6)) * (1 - dirA), look: [-.7 + .12 * Math.sin(t * 1.4), lerp(.2, -.25, io(seg(t, 3.7, 4.9))) * (1 - seg(t, 9.8, 10.6))], hop: .16 * bump(t, 6.05, 6.4), squash: -.35 * bump(t, 5.87, 6.07) + .5 * ring(t - 6.4, 8, 18) + talk, celebrate: .28 * bump(t, 9.1, 10.6), wave: .7 * bump(t, 7.1, 8.0), shadow: 0 };
    // scene B / end: moovi travels from centre to the chair
    const q = io(seg(t, 18.7, 19.5)), sB = lerp(420, 380, q), xB = lerp(640, 330, q), SEAT = 506, bB = lerp(704, SEAT + .105 * 380, q) - 120 * Math.sin(Math.PI * q), gB = lerp(704 - .105 * 420, 664, q);
    const pres = eo(seg(t, 16.3, 16.7)) * (1 - io(seg(t, 18.3, 18.7)));
    const poseB = { direct: pres, celebrate: .35 * bump(t, 16.4, 18.4) + .5 * bump(t, 14.7, 15.5), hop: .2 * bump(t, 14.75, 15.2) + .1 * bump(t, 13.75, 14.1), look: t < 18.6 ? [lerp(.6, -.5, io(seg(t, 15.5, 16.4))) * (1 - seg(t, 17.9, 18.5)), .1 + .5 * bump(t, 13.7, 14.6)] : [.1 * Math.sin(t * 1.1), .05], lean: .5 * bump(t, 11.9, 13.3), squash: -.45 * bump(t, 18.5, 18.72) + .6 * ring(t - 19.5, 7, 17) + talk, wave: eo(seg(t, 21.4, 21.8)) * (1 - io(seg(t, 23.2, 23.8))), think: .6 * bump(t, 23.5, 24.5), shadow: 0 };
    // layout B
    const outE = io(seg(t, 18.5, 19.2)), rawX = 236 + offB - 760 * outE, CW = 200, CH = 356, CY = 262;
    const fly = seg(t, 15.52, 16.4), fe = io(fly), land = spring(t - 16.4, 7, 15), reelX = lerp(250, 884, fe) + offB + 760 * outE, reelY = CY - 150 * Math.sin(Math.PI * fe) + 14 * (1 - land) * 0, reelR = .22 * Math.sin(Math.PI * fe) + .05 * ring(t - 16.4, 5, 14), reelA = seg(t, 15.52, 15.67);
    const chX = 330 - 620 * (1 - expo(seg(t, 18.45, 19.2))), chOn = t > 18.45;
    if (A) { mvA = m.render(t, poseA); SH.cast(bA - sA * .105, k => { k.translate(xA + offA, bA); k.scale(-1, 1); k.drawImage(mvA, -sA / 2, -sA, sA, sA); }, cam); SH.cast(PY0 + PH, k => { U.rr(k, PX0 + offA, PY0, PW, PH, 34); k.fill(); }, cam); }
    if (A) { // A is composited now (its Moovi canvas gets reused by B below)
      SH.lay(c, .17); U.giant(c, t < 6.16 ? '' : t < 9.06 ? 'stop' : 'fixed', 250 + offA * .5, 640, 250, t < 6.16 ? 0 : t < 9.06 ? seg(t, 6.16, 6.28) : seg(t, 9.06, 9.18));
      const n = offA < -5 ? 4 : 1; for (let k = 0; k < n; k++) { c.globalAlpha = n > 1 ? .5 / (k * .7 + 1) : 1; drawA(c, t, -1600 * io(seg(t - k * .012, 11.1, 11.75))); } c.globalAlpha = 1;
      c.save(); cam(c); c.translate(xA + offA, bA); c.scale(-1, 1); c.drawImage(mvA, -sA / 2, -sA, sA, sA); c.restore(); }
    if (B) { const mv = m.render(t, poseB); SH.begin();
      SH.cast(gB, k => { k.translate(xB + offB, bB); k.drawImage(mv, -sB / 2, -sB, sB, sB); }, cam);
      if (outE < 1) { SH.cast(CY + CH, k => { U.rr(k, rawX, CY, CW, CH, 20); k.fill(); }, cam); if (reelA > 0) SH.cast(CY + CH, k => { k.translate(reelX + CW / 2, reelY + CH / 2); k.rotate(reelR); U.rr(k, -CW / 2, -CH / 2, CW, CH, 20); k.fill(); }, cam); }
      if (chOn) SH.cast(664, k => { U.chair(k, chX, SEAT, 258, 664, 'back'); U.chair(k, chX, SEAT, 258, 664, 'front'); }, cam);
      SH.lay(c, .17);
      const gw = t < 13.0 ? ['', 0] : t < 14.8 ? ['talk', seg(t, 13.0, 13.12)] : t < 17.54 ? ['moovi', seg(t, 14.8, 14.92)] : t < 18.5 ? ['watch', seg(t, 17.54, 17.66)] : t < 19.6 ? ['', 0] : ['mcp', seg(t, 19.6, 19.72)];
      c.save(); cam(c); if (t < 18.5) U.giant(c, gw[0], 150 + offB * .5, 640, 200, gw[1]); else U.giant(c, gw[0], 64, 640, 214, gw[1]);
      if (outE < 1) { clipCard(c, raw13, rawX, CY, CW, CH, 'rec', t, seg(t, 11.7, 12.0) * (1 - seg(t, 13.3, 13.8))); }
      if (chOn) U.chair(c, chX, SEAT, 258, 664, 'back');
      if (reelA > 0 && outE < 1 && fly < .5) { c.save(); c.globalAlpha = reelA; c.translate(reelX + CW / 2, reelY + CH / 2); c.rotate(reelR); clipCard(c, ed15, -CW / 2, -CH / 2, CW, CH, 'edited', t, 0); c.restore(); }
      c.translate(xB + offB, bB); c.drawImage(mv, -sB / 2, -sB, sB, sB); c.translate(-(xB + offB), -bB);
      if (chOn) U.chair(c, chX, SEAT, 258, 664, 'front');
      if (reelA > 0 && outE < 1 && fly >= .5) { c.save(); c.translate(reelX + CW / 2, reelY + CH / 2); c.rotate(reelR); const sc = 1 + .05 * ring(t - 16.4, 6, 16) + .05 * ring(t - 17.54, 6, 16); c.scale(sc, sc); clipCard(c, ed15, -CW / 2, -CH / 2, CW, CH, 'edited', t, 0); c.restore();
        if (t > 17.5 && t < 18.6) for (let hI = 0; hI < 4; hI++) { const hp = seg(t, 17.54 + hI * .16, 18.5 + hI * .16); if (hp > 0 && hp < 1) { c.save(); c.globalAlpha = 1 - hp * hp; c.translate(reelX + CW + 26 + 14 * Math.sin(hI * 2 + hp * 5), CY + 250 - 230 * eo(hp) - hI * 12); c.scale(1.5, 1.5); c.fillStyle = hI % 2 ? '#B9DB2E' : '#000'; c.beginPath(); c.moveTo(0, 9); c.bezierCurveTo(-16, -3, -9, -13, 0, -5); c.bezierCurveTo(9, -13, 16, -3, 0, 9); c.fill(); c.restore(); } }
        if (t > 16.45 && t < 18.5) { const k = eo(seg(t, 16.45, 16.8)); c.strokeStyle = '#B9DB2E'; c.lineWidth = 4; for (const a of [-.2, -.8, -1.4]) { c.beginPath(); c.moveTo(reelX + CW + 4 + Math.cos(a) * 8, CY + Math.sin(a) * 8); c.lineTo(reelX + CW + 4 + Math.cos(a) * (8 + 18 * k), CY + Math.sin(a) * (8 + 18 * k)); c.stroke(); } } }
      // end card type
      if (t > 13.7) { wordmark(t); const wq = io(seg(t, 18.6, 19.5)), ws = lerp(.62, 1, wq); c.save(); c.translate(lerp(452, 556, wq), lerp(30, 196, wq)); c.scale(ws, ws); c.drawImage(WM, 0, 0); c.restore(); }
      if (t > 19.2) { U.label(c, 'the mcp that edits', 566, 366, seg(t, 19.5, 19.6), t, { size: 32, spark: eo(seg(t, 19.6, 20.0)) });
        const line = 'works with the AI you already use \u00b7 free \u00b7 open source', n = Math.floor(33 * seg(t, 19.2, 20.3) + (line.length - 33) * seg(t, 20.34, 20.95)); c.font = '500 17px "JetBrains Mono"'; c.fillStyle = '#000'; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(line.slice(0, n), 568, 462); if (n < line.length || Math.floor(t * 2.5) % 2 === 0) c.fillRect(568 + c.measureText(line.slice(0, n)).width + 2, 448, 9, 16);
        if (t > 20.9) U.pixbar(c, 568, 486, 12, seg(t, 21.0, 23.7)); }
      c.restore(); }
    // label stack, top-left
    const X = 70, Y = 54;
    if (t > .96 && t < 6.16) { U.label(c, 'an ai tries something', X, Y, seg(t, .96, 1.06), t); if (t > 4.28) U.label(c, 'caption under the buttons', X, Y + 42, seg(t, 4.28, 4.38), t, { size: 18 }); }
    else if (t >= 6.16 && t < 11.1) { U.label(c, 'under the buttons', X, Y, seg(t, 6.16, 6.26), t, { strike: 1, sp: eo(seg(t, 8.48, 8.98)) }); const ty = Y + 78, hide = seg(t, 10.2, 10.3);
      if (!hide) { U.typed(c, 'caption is under', X, ty, 22, seg(t, 6.86, 7.2), t); if (t > 7.2) U.typed(c, 'the app\u2019s buttons,', X, ty + 30, 22, seg(t, 7.2, 7.55), t); if (t > 7.55) U.typed(c, 'move it up', X, ty + 60, 22, seg(t, 7.55, 7.9), t, { cur: 1 }); }
      U.label(c, 'inside the safe area', X, hide ? Y + 42 : ty + 84, seg(t, 9.1, 9.2), t, { spark: eo(seg(t, 9.2, 9.55)) }); if (t > 9.7 && t < 11.1) U.pixbar(c, X, (hide ? Y + 42 : ty + 84) + 52, 8, seg(t, 9.7, 11.0)); }
    else if (t > 12.5 && t < 18.5) { if (t < 14.8) U.label(c, 'just show up and talk', X, Y, seg(t, 12.5, 12.6), t); else if (t < 15.52) U.label(c, 'with moovi inside', X, Y, seg(t, 14.8, 14.9), t, { spark: eo(seg(t, 14.9, 15.3)) }); else { U.label(c, 'manual editing', X, Y, seg(t, 15.52, 15.62), t, { strike: 1, sp: eo(seg(t, 15.7, 16.1)) }); U.label(c, 'done for you', X, Y + 42, seg(t, 16.4, 16.5), t, { spark: eo(seg(t, 16.5, 16.85)) }); U.label(c, 'people stop to watch', X, Y + 84, seg(t, 17.54, 17.64), t); } }
  } };
