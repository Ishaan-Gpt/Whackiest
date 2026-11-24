// ACT C: Moovi becomes the editor. White studio (Ishaan's reference): pure white, one hard cast shadow down-right,
// Silkscreen pixel type, one lime label. The editor is drawn in the same icy jelly as Moovi and keeps his eyes.
import { MooviFilm } from '../moovi-film.js';
import { subjBegin, subjEnd, drawMoovi, FLOOR } from './_studio.js';

const TEX = '/hackathon/whackiest-2026/out/v3/tex/';
const INK = '#0E1A2B', IRIS = '#5B7CFA', ICE = '#CFE6F7', LIME = '#D9F56B', BLACK = '#111111';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const io = x => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const expoOut = x => { x = clamp(x); return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); };
const spring = (dt, k = 7, w = 13) => dt <= 0 ? 0 : 1 - Math.exp(-k * dt) * Math.cos(w * dt);
const ring = (dt, k = 6, w = 18) => dt <= 0 ? 0 : Math.exp(-k * dt) * Math.sin(w * dt);
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });

// layout (world px on the 1280×720 stage)
const PW = 460, PH = 570, PX = 410, PY = 36, BASE = PY + PH;          // editor panel; BASE = the floor line it stands on
const SCR = { x: 24, y: 98, w: 412, h: 252 }, TL = { x: 24, y: 364, w: 412, h: 184 };
const CW = 129, CH = 230;                                               // the clip inside the screen
const RAW = { x: 104, y: 258, w: 196, h: 348 }, FIN = { x: 968, y: 250, w: 200, h: 356 };
const SHX = 0.62, SHY = 0.2;                                            // the one hard key light: shadows fall down-right
const MS = 470, MX = 640 - MS / 2, MY = 196;                            // Moovi box

let ctx, moovi, raw, ed1, ed2, P, pc, gc, G;

// ---------- small drawing helpers ----------
function hardShadow(o, yb, a, draw) {                                   // sheared silhouette on the floor
  if (a <= 0.003) return;
  o.save(); o.transform(1, 0, -SHX, -SHY, SHX * yb, yb + SHY * yb); o.globalAlpha = a; o.fillStyle = '#1b2230'; draw(o); o.restore();
}
function cover(o, img, x, y, w, h, zoom = 1, fy = 0.4) {                // object-fit: cover with a zoom
  const ir = img.width / img.height, r = w / h; let sw = img.width, sh = img.height;
  if (ir > r) sw = sh * r; else sh = sw / r; sw /= zoom; sh /= zoom;
  o.drawImage(img, (img.width - sw) / 2, (img.height - sh) * fy, sw, sh, x, y, w, h);
}
function clipCard(o, img, x, y, w, h, r, zoom = 1, rim = true) {                    // an upright phone-shaped clip with a glass rim
  o.save(); o.beginPath(); o.roundRect(x, y, w, h, r); o.clip(); cover(o, img, x, y, w, h, zoom);
  const g = o.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(0.3, 'rgba(255,255,255,0)');
  o.fillStyle = g; o.fillRect(x, y, w, h); o.restore();
  if (rim) { o.strokeStyle = 'rgba(14,26,43,0.9)'; o.lineWidth = 2.5; o.beginPath(); o.roundRect(x, y, w, h, r); o.stroke(); }
}
function typed(o, str, t0, x, y, font, color, cps = 20) {               // types on character by character with a block cursor
  const dt = (ctx._t - t0); if (dt < 0) return 0;
  const n = Math.min(str.length, Math.floor(dt * cps)), s = str.slice(0, n);
  o.font = font; o.fillStyle = color; o.textBaseline = 'alphabetic'; o.textAlign = 'left'; o.fillText(s, x, y);
  const w = o.measureText(s).width, typing = n < str.length, m = o.measureText('M');
  if (typing || (dt - str.length / cps < 0.9 && Math.floor(dt * 5) % 2 === 0)) o.fillRect(x + w + 4, y - m.actualBoundingBoxAscent, m.width * 0.62, m.actualBoundingBoxAscent);
  return w;
}
function perspDraw(o, src, x, y, w, h, yaw, alpha = 1) {                // true keystone from vertical strips
  if (Math.abs(yaw) < 0.004) { o.globalAlpha = alpha; o.drawImage(src, x, y, w, h); o.globalAlpha = 1; return; }
  const N = 56, D = 1500, cx = x + w / 2, cy = y + h / 2, c = Math.cos(yaw), s = Math.sin(yaw), sw = src.width / N;
  o.globalAlpha = alpha;
  for (let i = 0; i < N; i++) {
    const u0 = i / N - 0.5, u1 = (i + 1) / N - 0.5, k0 = D / (D + u0 * w * s), k1 = D / (D + u1 * w * s);
    const x0 = cx + u0 * w * c * k0, x1 = cx + u1 * w * c * k1, hs = h * (k0 + k1) / 2;
    o.drawImage(src, i * sw, 0, sw, src.height, x0, cy - hs / 2, x1 - x0 + 0.7, hs);
  }
  o.globalAlpha = 1;
}
function jellyBead(o, x, y, r) {
  let g = o.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#d7eafa'); g.addColorStop(1, '#8fb9e6');
  o.fillStyle = g; o.beginPath(); o.arc(x, y, r, 0, 7); o.fill();
  o.strokeStyle = 'rgba(70,120,190,0.55)'; o.lineWidth = 1; o.stroke();
  o.fillStyle = 'rgba(255,255,255,0.95)'; o.beginPath(); o.ellipse(x - r * 0.32, y - r * 0.38, r * 0.3, r * 0.2, -0.6, 0, 7); o.fill();
}

// ---------- the jelly-glass editor, drawn into its own canvas (local 460×570, 2×) ----------
function drawPanel(t, S) {
  const o = P; o.setTransform(2, 0, 0, 2, 0, 0); o.clearRect(0, 0, PW, PH);
  // body: icy jelly slab
  o.save(); o.beginPath(); o.roundRect(2, 2, PW - 4, PH - 4, 46); o.clip();
  let g = o.createLinearGradient(0, 0, 0, PH); g.addColorStop(0, '#f9fcff'); g.addColorStop(0.5, '#e3f0fb'); g.addColorStop(1, '#b7d6f1');
  o.fillStyle = g; o.fillRect(0, 0, PW, PH);
  g = o.createRadialGradient(110, 40, 10, 110, 40, 420); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  o.fillStyle = g; o.fillRect(0, 0, PW, PH);
  g = o.createRadialGradient(380, 600, 20, 380, 600, 380); g.addColorStop(0, 'rgba(91,124,250,0.34)'); g.addColorStop(1, 'rgba(91,124,250,0)');
  o.fillStyle = g; o.fillRect(0, 0, PW, PH);
  // subsurface rim: darker blue inside the edge, then a bright lip
  o.strokeStyle = 'rgba(96,150,214,0.5)'; o.lineWidth = 16; o.filter = 'blur(7px)'; o.beginPath(); o.roundRect(0, 0, PW, PH, 46); o.stroke(); o.filter = 'none';
  o.strokeStyle = 'rgba(255,255,255,0.95)'; o.lineWidth = 3; o.beginPath(); o.roundRect(5, 5, PW - 10, PH - 10, 42); o.stroke();
  // top gloss
  g = o.createLinearGradient(0, 8, 0, 84); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  o.fillStyle = g; o.beginPath(); o.roundRect(34, 10, PW - 68, 30, 15); o.fill();
  o.restore();
  o.strokeStyle = 'rgba(88,138,200,0.85)'; o.lineWidth = 1.5; o.beginPath(); o.roundRect(2, 2, PW - 4, PH - 4, 46); o.stroke();

  // the face: his two eyes stay
  const [lx, ly] = S.look, bl = S.blink, ex = 230 + lx * 7, ey = 58 + ly * 4;
  for (const sx of [-1, 1]) {
    const cx = ex + sx * 44, rx = 17, ry = 22 * (1 - 0.92 * bl) * (1 - 0.35 * S.squint);
    g = o.createRadialGradient(cx - 4, ey - 6, 2, cx, ey, 24); g.addColorStop(0, '#2a3f66'); g.addColorStop(0.6, INK); g.addColorStop(1, '#070d18');
    o.fillStyle = g; o.beginPath(); o.ellipse(cx, ey, rx, Math.max(1.6, ry), 0, 0, 7); o.fill();
    if (ry > 8) {
      o.fillStyle = 'rgba(91,124,250,0.55)'; o.beginPath(); o.ellipse(cx + lx * 3, ey + 7, rx * 0.62, ry * 0.36, 0, 0, Math.PI); o.fill();
      o.fillStyle = '#fff'; o.beginPath(); o.ellipse(cx - 6 + lx * 2, ey - 8 + ly * 2, 5.4, 6.4 * (ry / 22), -0.4, 0, 7); o.fill();
      o.fillStyle = 'rgba(255,255,255,0.75)'; o.beginPath(); o.arc(cx + 6 + lx * 2, ey + 6, 2.2, 0, 7); o.fill();
    }
  }

  // screen
  o.save(); o.beginPath(); o.roundRect(SCR.x, SCR.y, SCR.w, SCR.h, 22); o.clip();
  g = o.createLinearGradient(0, SCR.y, 0, SCR.y + SCR.h); g.addColorStop(0, '#0b1524'); g.addColorStop(1, '#18294a');
  o.fillStyle = g; o.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
  const scx = SCR.x + SCR.w / 2, scy = SCR.y + SCR.h / 2;
  if (S.img) {
    o.save(); o.globalAlpha = 0.42; o.filter = 'blur(14px)'; cover(o, S.img, SCR.x - 20, SCR.y - 20, SCR.w + 40, SCR.h + 40, 1.2); o.restore();
    o.fillStyle = 'rgba(8,14,26,0.35)'; o.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
    const z = S.zoom; o.save(); o.beginPath(); o.roundRect(scx - CW / 2, scy - CH / 2, CW, CH, 10); o.clip();
    cover(o, S.img, scx - CW / 2, scy - CH / 2, CW, CH, z); o.restore();
    o.strokeStyle = 'rgba(255,255,255,0.5)'; o.lineWidth = 1.2; o.beginPath(); o.roundRect(scx - CW / 2, scy - CH / 2, CW, CH, 10); o.stroke();
    if (S.cap > 0.01) { o.save(); o.translate(scx, scy + 58); o.scale(S.cap, S.cap); o.font = '800 15px "Inter Tight"'; o.textAlign = 'center'; o.lineJoin = 'round'; o.strokeStyle = 'rgba(8,12,20,0.9)'; o.lineWidth = 4; o.strokeText('be yourself', 0, 0); o.fillStyle = '#fff'; o.fillText('be yourself', 0, 0); o.restore(); }
    if (S.flash > 0) { o.fillStyle = `rgba(255,255,255,${S.flash})`; o.fillRect(SCR.x, SCR.y, SCR.w, SCR.h); }
  }
  if (S.play > 0.01) {                                                  // the play button he morphed into
    o.save(); o.translate(scx + 6, scy); o.scale(S.play, S.play); o.globalAlpha = clamp(S.play);
    g = o.createLinearGradient(-30, -40, 30, 40); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#a9cdee');
    o.fillStyle = g; o.strokeStyle = g; o.lineJoin = 'round'; o.lineWidth = 22;
    o.beginPath(); o.moveTo(-22, -32); o.lineTo(30, 0); o.lineTo(-22, 32); o.closePath(); o.fill(); o.stroke();
    o.fillStyle = 'rgba(255,255,255,0.9)'; o.beginPath(); o.ellipse(-16, -22, 9, 5, 0.5, 0, 7); o.fill(); o.restore();
  }
  // glass reflection + travelling light sweep
  g = o.createLinearGradient(SCR.x, SCR.y, SCR.x + 250, SCR.y + 250); g.addColorStop(0, 'rgba(255,255,255,0.2)'); g.addColorStop(0.42, 'rgba(255,255,255,0.03)'); g.addColorStop(0.43, 'rgba(255,255,255,0)');
  o.fillStyle = g; o.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
  o.restore();
  o.strokeStyle = 'rgba(255,255,255,0.85)'; o.lineWidth = 2; o.beginPath(); o.roundRect(SCR.x - 1, SCR.y - 1, SCR.w + 2, SCR.h + 2, 23); o.stroke();
  o.strokeStyle = 'rgba(60,105,170,0.5)'; o.lineWidth = 1; o.beginPath(); o.roundRect(SCR.x - 2.5, SCR.y - 2.5, SCR.w + 5, SCR.h + 5, 24.5); o.stroke();

  // timeline tray
  g = o.createLinearGradient(0, TL.y, 0, TL.y + TL.h); g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0.78)');
  o.fillStyle = g; o.beginPath(); o.roundRect(TL.x, TL.y, TL.w, TL.h, 20); o.fill();
  o.strokeStyle = 'rgba(96,150,214,0.45)'; o.lineWidth = 1; o.stroke();
  const tx = TL.x + 16, tw = TL.w - 32, rows = [TL.y + 22, TL.y + 64, TL.y + 100, TL.y + 134];
  for (let r = 0; r < 4; r++) { o.fillStyle = 'rgba(14,26,43,0.055)'; o.beginPath(); o.roundRect(tx - 4, rows[r] - 3, tw + 8, [38, 26, 26, 32][r], 8); o.fill(); }
  const land = (t0, cx, cy, draw) => {                                  // every piece lands with a tiny bounce
    const dt = t - t0; if (dt <= 0) return; const s = spring(dt, 9, 16), a = clamp(dt / 0.08);
    o.save(); o.translate(cx, cy - 10 * (1 - expoOut(dt / 0.25))); o.scale(lerp(0.4, 1, s), lerp(0.4, 1, s)); o.globalAlpha = a; draw(); o.restore();
  };
  const F = S.fill;                                                     // start time of the fill
  if (F != null) {
    // clips
    const cl = [[0, 0.2], [0.21, 0.13], [0.35, 0.26], [0.62, 0.15], [0.78, 0.22]];
    if (t > S.tStrip && t < S.tClips) land(S.tStrip, tx + tw / 2, rows[0] + 16, () => { o.beginPath(); o.roundRect(-tw / 2, -16, tw, 32, 7); o.save(); o.clip(); for (let q = 0; q < 6; q++) cover(o, S.thumb, -tw / 2 + q * tw / 6, -16, tw / 6, 32, 1.4, 0.25); o.restore(); o.strokeStyle = IRIS; o.lineWidth = 1.6; o.stroke(); });
    cl.forEach(([u, w], i) => land(S.tClips + i * 0.05, tx + (u + w / 2) * tw, rows[0] + 16, () => {
      const ww = w * tw - 3; o.beginPath(); o.roundRect(-ww / 2, -16, ww, 32, 7); o.save(); o.clip();
      cover(o, S.thumb, -ww / 2, -16, ww, 32, 1.3 + 0.5 * hash(i), 0.25); o.restore();
      o.strokeStyle = IRIS; o.lineWidth = 1.6; o.stroke();
    }));
    // captions
    for (let i = 0; i < 9; i++) { const u = 0.02 + i * 0.108, w = 0.05 + 0.045 * hash(i + 9); land(S.tCaps + i * 0.04, tx + (u + w / 2) * tw, rows[1] + 10, () => { o.fillStyle = i === 4 ? INK : IRIS; o.beginPath(); o.roundRect(-w * tw / 2, -8, w * tw, 16, 6); o.fill(); o.fillStyle = 'rgba(255,255,255,0.8)'; o.fillRect(-w * tw / 2 + 5, -1.2, w * tw - 10, 2.4); }); }
    // zoom keyframes: diamonds joined by ramps
    const kf = [0.06, 0.2, 0.36, 0.5, 0.66, 0.8, 0.94];
    for (let i = 0; i < kf.length - 1; i += 2) { const dt = t - (S.tKeys + 0.05 + i * 0.05); if (dt > 0) { o.strokeStyle = 'rgba(14,26,43,0.55)'; o.lineWidth = 1.6; o.beginPath(); o.moveTo(tx + kf[i] * tw, rows[2] + 16); o.lineTo(tx + lerp(kf[i], kf[i + 1], expoOut(dt / 0.3)) * tw, rows[2] + 16 - 12 * expoOut(dt / 0.3)); o.stroke(); } }
    kf.forEach((u, i) => land(S.tKeys + i * 0.05, tx + u * tw, rows[2] + (i % 2 ? 4 : 16), () => { o.rotate(Math.PI / 4); o.fillStyle = INK; o.beginPath(); o.roundRect(-4.6, -4.6, 9.2, 9.2, 2); o.fill(); }));
    // sound wave
    for (let i = 0; i < 58; i++) { const dt = t - (S.tWave + i * 0.006); if (dt <= 0) continue; const u = i / 57, a = (4 + 22 * (0.3 + 0.7 * hash(i + 40)) * (0.45 + 0.55 * Math.abs(Math.sin(u * 9.4 + 0.6)))) * spring(dt, 10, 15); o.fillStyle = 'rgba(14,26,43,0.82)'; o.beginPath(); o.roundRect(tx + u * (tw - 4), rows[3] + 13 - a / 2, 3.4, a, 1.7); o.fill(); }
  }
  // playhead: a jelly bead on a hairline
  if (S.head != null) {
    const hx = tx + S.head * tw; o.strokeStyle = INK; o.lineWidth = 1.6; o.beginPath(); o.moveTo(hx, TL.y + 12); o.lineTo(hx, TL.y + TL.h - 8); o.stroke();
    jellyBead(o, hx, TL.y + 9, 9.5);
  }
  // light sweep across the glass
  if (S.sweep >= 0 && S.sweep <= 1) {
    o.save(); o.globalCompositeOperation = 'source-atop'; const sx = lerp(-260, PW + 120, S.sweep);
    g = o.createLinearGradient(sx, 0, sx + 230, 90); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    o.fillStyle = g; o.fillRect(0, 0, PW, PH); o.restore();
  }
}

export default {
  dur: 22.9,
  async init(canvas) {
    ctx = canvas.getContext('2d');
    [raw, ed1, ed2] = await Promise.all(['raw-9.0.jpg', 'ed-12.0.jpg', 'ed-15.0.jpg'].map(f => loadImg(TEX + f)));
    pc = mk(PW * 2, PH * 2); P = pc.getContext('2d'); moovi = new MooviFilm(512); gc = mk(512, 512); G = gc.getContext('2d');
  },

  frame(t) {
    ctx._t = t;
    // word stamps (vo-v6.json)
    const T_HOP = 1.15, T_HI = 2.96, T_NAME = 3.84, T_LABEL = 4.46, T_CODE = 6.46, T_MORPH = 8.58, T_ED = 9.5, T_BLINK = 11.1, T_RAW = 11.9, T_CAM = 12.88,
      T_FLY = 14.66, T_CUT = 15.74, T_CAP = 16.26, T_ZOOM = 17.04, T_SCORE = 18.3, T_DONE = 18.94, T_FIN = 19.38, T_READY = 21.12, T_POST = 21.76, T_BACKIN = 21.95, T_MELT = 22.05;
    const stress = [0.72, 1.86, 2.96, 3.84, 4.46, 5.2, 6.6, 7.34, 8.06, 10.08, 11.1, 12.22, 12.88, 13.54, 15.06, 15.74, 16.26, 17.04, 17.7, 18.3, 19.38, 20.16, 21.12, 21.76];
    const beat = stress.reduce((a, T) => a + ring(t - T, 7, 17), 0);
    const edIn = spring(t - T_ED, 6.5, 7.5), edOut = io((t - T_MELT) / 0.5), edA = smooth((t - T_ED) / 0.3) * (1 - smooth((t - T_MELT - 0.1) / 0.4));
    const fly = io((t - T_FLY) / 0.62), finOut = spring(t - T_FIN, 5, 8.5) * (1 - io((t - T_BACKIN) / 0.35));

    // camera: always drifting, a small push on every stressed word
    const z = 1 + 0.02 * Math.sin(t * 0.45) + 0.008 * t / 22.9 + 0.012 * beat + 0.05 * smooth((t - T_MORPH) / 1) * (1 - smooth((t - T_ED - 0.3) / 0.8)) - 0.028 * smooth((t - 22.1) / 0.7) * (1 + 0.3 * Math.sin(22.9 * 0.45));
    const zEnd = smooth((t - 22.0) / 0.85), zz = lerp(z, 1, zEnd);
    const cx = lerp(640 + 9 * Math.sin(t * 0.37) + 30 * smooth((t - T_FIN) / 1.2) * (1 - smooth((t - T_BACKIN) / 0.4)) - 26 * smooth((t - T_RAW) / 0.8) * (1 - smooth((t - T_FLY) / 0.6)), 640, zEnd), cy = lerp(360 + 5 * Math.sin(t * 0.29 + 1), 360, zEnd);
    const yaw = edA * (0.1 * Math.sin((t - T_ED) * 0.8) + 0.05 * ring(t - T_FLY - 0.6, 4, 10));

    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.fillStyle = '#FEFEFD'; ctx.fillRect(0, 0, 1280, 720);
    ctx.save(); ctx.translate(640, 360); ctx.scale(zz, zz); ctx.translate(-cx, -cy);

    // giant pale pixel name behind him
    { const str = 'moovi', n = Math.min(clamp(Math.floor((t - T_NAME) * 16), 0, 5), clamp(Math.ceil((T_ED + 0.1 - t) * 22), 0, 5));
      ctx.font = '700 190px "Silkscreen"'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#E2E2E2'; ctx.fillText(str.slice(0, n), 292 + (cx - 640) * 0.35, 392); }

    // ---------- subject layer (one hard shadow) ----------
    const s = subjBegin(), C1 = '#141414', C2 = '#3A3A3A', MXc = 640, SEAT = 480;
    const chX = -1100 * Math.pow(clamp((t - 1.55) / 0.9), 2.2), chOn = t < 2.5;
    const bar = (x0, y0, x1, y1, w, c) => { s.strokeStyle = c; s.lineCap = 'round'; s.lineWidth = w; s.beginPath(); s.moveTo(x0, y0); s.lineTo(x1, y1); s.stroke(); };
    const chairBack = () => { const MX = MXc + chX; bar(MX - 108, SEAT + 6, MX + 122, FLOOR - 16, 9, C2); bar(MX + 108, SEAT + 6, MX - 122, FLOOR - 16, 9, C2);
      bar(MX - 132, SEAT + 8, MX - 132, SEAT - 190, 11, C1); bar(MX + 132, SEAT + 8, MX + 132, SEAT - 190, 11, C1);
      s.fillStyle = C1; s.beginPath(); s.moveTo(MX - 132, SEAT - 182); s.quadraticCurveTo(MX, SEAT - 174, MX + 132, SEAT - 182); s.lineTo(MX + 132, SEAT - 104); s.quadraticCurveTo(MX, SEAT - 98, MX - 132, SEAT - 104); s.fill();
      s.beginPath(); s.moveTo(MX - 136, SEAT - 4); s.quadraticCurveTo(MX, SEAT + 10, MX + 136, SEAT - 4); s.lineTo(MX + 132, SEAT + 16); s.quadraticCurveTo(MX, SEAT + 30, MX - 132, SEAT + 16); s.fill(); };
    const chairFront = () => { const MX = MXc + chX; bar(MX - 134, SEAT + 12, MX + 150, FLOOR - 4, 12, C1); bar(MX + 134, SEAT + 12, MX - 150, FLOOR - 4, 12, C1);
      bar(MX - 176, FLOOR - 2, MX - 126, FLOOR - 8, 10, C1); bar(MX + 176, FLOOR - 2, MX + 126, FLOOR - 8, 10, C1);
      bar(MX - 150, SEAT - 66, MX - 150, SEAT + 10, 9, C1); bar(MX + 150, SEAT - 66, MX + 150, SEAT + 10, 9, C1);
      bar(MX - 168, SEAT - 70, MX - 128, SEAT - 76, 13, C1); bar(MX + 168, SEAT - 70, MX + 128, SEAT - 76, 13, C1); };

    // Moovi
    const mA = t < 15 ? 1 - smooth((t - T_ED - 0.02) / 0.28) : smooth((t - T_MELT - 0.05) / 0.35);
    let mCv = null; const hopP = clamp((t - T_HOP) / 0.6), seated = t < T_HOP;
    if (mA > 0.003) {
      const morph = t < 15 ? io((t - T_MORPH) / 0.75) : 0.7 * (1 - io((t - T_MELT) / 0.6));
      const antic = -0.6 * Math.sin(clamp((t - 0.8) / 0.35) * Math.PI) - 0.5 * Math.sin(clamp((t - T_MORPH + 0.3) / 0.3) * Math.PI) - 0.4 * Math.sin(clamp((t - T_HI + 0.25) / 0.25) * Math.PI);
      const land = 0.6 * ring(t - T_HOP - 0.6, 6, 15) + 0.5 * ring(t - T_HI - 0.45, 6, 15) + 0.4 * ring(t - T_MELT - 0.5, 7, 14);
      const wave = smooth((t - T_HI + 0.1) / 0.25) * (1 - smooth((t - 4.3) / 0.4));
      const lk = t < T_HOP ? [0, 0] : t < T_LABEL ? [0, 0.1] : t < 5.9 ? [-0.7 * smooth((t - T_LABEL) / 0.3), 0.6] : t < T_MORPH ? [0.3 * Math.sin(t * 5), -0.6 * smooth((t - T_CODE) / 0.3)] : [0, 0];
      const pose = { morph, wave, squash: antic + land + 0.25 * beat, look: lk, shadow: 0, lean: seated ? 0.3 * (1 - smooth(t / 0.8)) : 0.25 * Math.max(0, beat),
        think: 0.7 * smooth((t - T_CODE) / 0.3) * (1 - smooth((t - 8.1) / 0.4)), celebrate: 0.5 * Math.sin(clamp((t - T_HI) / 0.9) * Math.PI) + 0.4 * Math.sin(clamp((t - T_NAME) / 0.6) * Math.PI),
        hop: 0.3 * Math.sin(clamp((t - T_HI) / 0.45) * Math.PI) + 0.14 * Math.sin(clamp((t - T_MORPH - 0.1) / 0.5) * Math.PI) };
      mCv = moovi.render(t, pose);
      // made entirely of code: glyphs ripple over his jelly
      const cd = smooth((t - 6.2) / 0.3) * (1 - smooth((t - 8.5) / 0.4));
      if (cd > 0.01) { G.setTransform(1, 0, 0, 1, 0, 0); G.globalCompositeOperation = 'source-over'; G.clearRect(0, 0, 512, 512); G.drawImage(mCv, 0, 0); G.globalCompositeOperation = 'source-atop';
        G.font = '600 15px "JetBrains Mono"'; G.textBaseline = 'top'; const CH = '{}<>/=;()01[]fx+*', tick = Math.floor(t * 9);
        for (let r = 0; r < 30; r++) { const y = 40 + r * 15, band = Math.exp(-Math.pow((y - ((t - 6.3) * 330 % 620 - 40)) / 70, 2)); const a = cd * (0.16 + 0.8 * band); G.fillStyle = `rgba(60,92,235,${a.toFixed(3)})`;
          for (let c = 0; c < 46; c++) { const hh = hash(r * 53 + c * 7 + (hash(r + c * 3) > 0.6 ? tick : 0)); if (hh < 0.25) continue; G.fillText(CH[Math.floor(hh * CH.length) % CH.length], 20 + c * 10.4, y); } }
        mCv = gc; }
    }
    const mSize = lerp(330, 400, smooth(hopP)), mFeet = seated ? SEAT + 12 : lerp(SEAT + 12, FLOOR, hopP) - 150 * Math.sin(hopP * Math.PI);
    if (chOn) chairBack();
    if (mCv && seated) drawMoovi(s, mCv, 640, mFeet, mSize, {});
    if (chOn) chairFront();

    const pScale = lerp(0.3, 1, edIn) * (1 - 0.6 * edOut) * (1 + 0.03 * ring(t - T_FLY - 0.55, 7, 20) + (t > T_ED + 1 ? 0.012 * beat : 0));
    const rawIn = expoOut((t - T_RAW) / 0.6), rawX = lerp(-260, RAW.x, rawIn), rawGone = fly >= 1;
    const finX = lerp(700, FIN.x, finOut), finVis = t > T_FIN && t < T_BACKIN + 0.35;
    const cutT = ((t - T_DONE) % 1.6 + 1.6) % 1.6, cut = t > T_DONE && Math.floor((t - T_DONE) / 1.6) % 2 === 1, finImg = cut ? ed2 : ed1, punch = 1 + 0.07 * Math.exp(-cutT * 5) + 0.02 * cutT;
    if (finVis) { const fc = mk(FIN.w * 2, FIN.h * 2), fo = fc.getContext('2d'); fo.scale(2, 2); clipCard(fo, finImg, 1.5, 1.5, FIN.w - 3, FIN.h - 3, 18, punch);
      const sw = (t - T_FIN - 0.5) / 1.1; if (sw >= 0 && sw <= 1) { fo.globalCompositeOperation = 'source-atop'; const sx = lerp(-220, FIN.w + 60, sw), g = fo.createLinearGradient(sx, 0, sx + 170, 70); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); fo.fillStyle = g; fo.fillRect(0, 0, FIN.w, FIN.h); }
      const hop = 34 * Math.sin(clamp((t - T_POST) / 0.4) * Math.PI) + 8 * ring(t - T_READY, 6, 16);
      s.save(); s.translate(finX + FIN.w / 2, FLOOR - hop); s.rotate(-0.5 * (1 - clamp(finOut)) * (t < T_BACKIN ? 1 : 0)); perspDraw(s, fc, -FIN.w / 2, -FIN.h, FIN.w, FIN.h, yaw * 0.9); s.restore(); }
    if (edA > 0.003) {
      const playing = t > T_CUT, headU = t < T_FLY + 0.6 ? null : !playing ? 0 : t < T_DONE ? clamp((t - T_CUT) / (T_DONE - T_CUT)) : cutT / 1.6;
      const look = t < T_RAW ? [0, 0] : t < T_FLY + 0.3 ? [-smooth((t - T_RAW) / 0.3), 0.3 + 0.2 * Math.sin(t * 4)] : t < T_FIN ? [lerp(-1, 0.6 * Math.sin(t * 2.2), smooth((t - T_FLY - 0.3) / 0.4)), 1] : [smooth((t - T_FIN) / 0.3), 0.4];
      const bp = (t + 0.7) % 2.6, blink = Math.max(bp < 0.16 ? Math.sin(bp / 0.16 * Math.PI) : 0, Math.sin(clamp((t - T_BLINK) / 0.22) * Math.PI));
      const zoom = t < T_DONE ? 1 + 0.42 * spring(t - T_ZOOM, 6, 9) * (1 - 0.6 * smooth((t - 17.75) / 0.4)) : punch;
      drawPanel(t, { look, blink, squint: smooth((t - T_FIN) / 0.3), img: fly < 1 ? null : t < T_DONE ? raw : finImg, thumb: raw, zoom,
        flash: t >= T_DONE ? Math.max(0, 0.8 * (1 - (t - T_DONE) / 0.22)) : 0, cap: t < T_DONE ? spring(t - T_CAP, 9, 14) : 0,
        play: 1 - smooth((t - T_FLY - 0.35) / 0.25), fill: t > T_FLY ? 1 : null, tStrip: T_FLY + 0.62, tClips: T_CUT, tCaps: T_CAP, tKeys: T_ZOOM, tWave: T_SCORE, head: headU,
        sweep: Math.max((t - T_BLINK) / 0.9 <= 1 ? (t - T_BLINK) / 0.9 : -1, (t - T_SCORE - 0.3) / 1.0 <= 1 ? (t - T_SCORE - 0.3) / 1.0 : -1, (t - 20.2) / 1.2 <= 1 ? (t - 20.2) / 1.2 : -1) });
      const w = PW * pScale, h = PH * pScale; perspDraw(s, pc, 640 - w / 2, BASE - h, w, h, yaw, edA);
    }
    if (mCv && !seated) { const k = t < 15 ? 1 + 0.12 * smooth((t - T_ED) / 0.4) : 1 + 0.12 * (1 - smooth((t - T_MELT) / 0.5)); drawMoovi(s, mCv, 640, mFeet, mSize * k, { alpha: mA }); }
    // the raw take
    if (t > T_RAW && !rawGone) {
      const tgt = { x: PX + SCR.x + SCR.w / 2 - CW / 2, y: PY + SCR.y + SCR.h / 2 - CH / 2, w: CW, h: CH };
      const at = p => ({ x: lerp(rawX, tgt.x, p), y: lerp(RAW.y, tgt.y, p) - 70 * Math.sin(p * Math.PI), w: lerp(RAW.w, tgt.w, p), h: lerp(RAW.h, tgt.h, p) });
      const N = fly > 0.02 ? 5 : rawIn < 0.98 ? 4 : 1, bob = 4 * Math.sin(t * 6) * (fly > 0 ? 0 : 1);
      for (let k = N - 1; k >= 0; k--) { let r; if (fly > 0.02) r = at(io(clamp((t - T_FLY - k * 0.02) / 0.62))); else { const x = lerp(-260, RAW.x, expoOut((t - T_RAW - k * 0.018) / 0.6)); r = { x, y: RAW.y - Math.max(0, bob), w: RAW.w, h: RAW.h }; }
        s.globalAlpha = k === 0 ? 1 : 0.2 / k + 0.04; clipCard(s, raw, r.x, r.y, r.w, r.h, lerp(18, 10, fly), 1 + 0.03 * Math.sin(t * 3), k === 0); }
      s.globalAlpha = 1;
    }
    subjEnd(ctx, FLOOR);

    // labels locked to the cards
    if (t > T_RAW + 0.4 && t < T_FLY) { typed(ctx, 'raw take', T_RAW + 0.4, RAW.x + 2, RAW.y - 16, '400 15px "Silkscreen"', BLACK, 26);
      const n = Math.min(22, Math.floor((t - T_RAW - 0.3) * 60));
      for (let i = 0; i < n; i++) { const a = 0.5 + 0.5 * Math.sin(t * 9 + i * 1.7) * Math.sin(t * 3.1 + i * 0.6), lv = 1 + Math.round(3.4 * a * (0.4 + 0.6 * hash(i + 2))); ctx.fillStyle = BLACK; for (let q = 0; q < lv; q++) { ctx.fillRect(RAW.x + 2 + i * 8.8, FLOOR + 46 - q * 7 - 6, 6, 6); if (q) ctx.fillRect(RAW.x + 2 + i * 8.8, FLOOR + 46 + q * 7 - 6, 6, 6); } }
      if (t > T_CAM) { ctx.strokeStyle = BLACK; ctx.lineWidth = 3; const x0 = RAW.x - 12, y0 = RAW.y - 44, x1 = RAW.x + RAW.w + 12, y1 = FLOOR + 12, L = 22 * expoOut((t - T_CAM) / 0.2);
        for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x + sx * L, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * L); ctx.stroke(); }
        if (Math.floor(t * 3) % 2 === 0) { ctx.fillStyle = BLACK; ctx.fillRect(RAW.x + RAW.w - 52, RAW.y - 28, 10, 10); } ctx.font = '400 13px "Silkscreen"'; ctx.textAlign = 'left'; ctx.fillStyle = BLACK; ctx.fillText('rec', RAW.x + RAW.w - 36, RAW.y - 18); } }
    if (finVis && t > T_FIN + 0.4 && t < T_BACKIN) typed(ctx, 'your clip', T_FIN + 0.4, FIN.x + 2, FIN.y - 16, '400 15px "Silkscreen"', BLACK, 26);
    ctx.restore();

    // ---------- top-left: one pixel keyword per beat, the lime label, a pixel progress bar ----------
    ctx.save(); ctx.translate(72, 100 + 2 * Math.sin(t * 0.4));
    const KW = [[1.18, 'i come in'], [T_HI, 'hi,'], [3.6, "hi, i'm moovi"], [T_CODE, 'made of code'], [T_MORPH, 'i turn into'], [9.62, 'a whole studio'], [T_BLINK, 'in a blink'], [11.96, 'just talk'], [13.42, 'be yourself'],
      [T_FLY, 'raw take in'], [T_CUT, 'cut'], [T_CAP, 'caption'], [T_ZOOM, 'zoom'], [T_SCORE, 'score'], [T_FIN, 'finished clip'], [T_READY, 'ready to post']];
    let kw = null; for (const k of KW) if (t >= k[0]) kw = k;
    if (kw && t < 22.15) typed(ctx, kw[1], kw[0] - (kw[0] === 3.6 ? 4 / 24 : 0), 0, 70, '700 34px "Silkscreen"', BLACK, 24);
    const lab = t >= T_READY ? ['ready to post', T_READY] : t >= T_LABEL && t < T_ED ? ['the editor inside edit easy', T_LABEL] : t >= T_CUT && t < T_READY ? ['edited by moovi', T_CUT] : null;
    if (lab && t < 22.15) { const gl = t - lab[1] < 0.07 ? 6 : 0; ctx.font = '400 15px "Silkscreen"'; const w2 = ctx.measureText(lab[0]).width; ctx.textAlign = 'left';
      ctx.fillStyle = LIME; ctx.fillRect(gl, -18, w2 + 24, 26); ctx.fillStyle = BLACK; ctx.fillText(lab[0], 12 + gl, 0);
      const sp = clamp((t - lab[1] - 0.1) / 0.25); if (sp > 0) { ctx.strokeStyle = '#B9D93A'; ctx.lineWidth = 2.5; ctx.lineCap = 'square'; for (const a of [-1.15, -0.65, -0.15]) { ctx.beginPath(); ctx.moveTo(w2 + 30 + Math.cos(a) * 5, -20 + Math.sin(a) * 5); ctx.lineTo(w2 + 30 + Math.cos(a) * (5 + 9 * sp), -20 + Math.sin(a) * (5 + 9 * sp)); ctx.stroke(); } } }
    if (t > T_FLY && t < 22.15) { const on = t < T_CUT ? 0 : t < T_CAP ? 3 : t < T_ZOOM ? 6 : t < T_SCORE ? 9 : 12;
      for (let i = 0; i < 12; i++) { if (i < on) { ctx.fillStyle = BLACK; ctx.fillRect(i * 19, 90, 14, 14); } else { ctx.strokeStyle = BLACK; ctx.lineWidth = 1.5; ctx.strokeRect(i * 19 + 0.75, 90.75, 12.5, 12.5); } } }
    ctx.restore();
  },
};
