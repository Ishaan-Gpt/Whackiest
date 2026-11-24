// ACT B: "nobody's an editor". STUDIO style. Moovi slumps on a chair; the pro timeline towers, the clip greys in the
// gallery, time / software / skill float out of reach; then the clutter wipes away and he's alone, calm.
import { MooviFilm } from '../moovi-film.js';
import { W, H, FLOOR, INK, IRIS, clamp, seg, lerp, smooth, expoOut, cubicIn, cubicOut, backOut, spring, ring, hash, key, rr, mk,
  loadImg, beginCam, drawMoovi, cover, finish, subjBegin, subjEnd, typed, snapWord, label, pixBar, pixelWipe, loadPixelFont, PALE, BLACK } from './_studio.js';

const TEX = '/hackathon/whackiest-2026/out/v3/tex/';
const WARM = '#D9A273', WARM_D = '#B97F52', WARM_L = '#E9BE96';
const MX = 640, SEAT = 480, MS = 330, PX = 1015;
// voice stamps (s)
const T_EDIT = 4.3, T_OUT = 9.45, T_CLIP = 9.9, T_GREY = 12.4, T_CAL = 12.1, T_FLOAT = [15.64, 16.44, 17.22], T_RIV = 19.2, T_GO = 20.02, T_WIPE = 20.9, T_RISE = 21.1;
// v6 voice word starts (s) for the talk bounce
const WORDS = [0.2, 0.62, 1.28, 1.82, 2.14, 3.16, 3.42, 3.88, 4.08, 4.42, 5.42, 5.82, 6.1, 7.24, 7.8, 8.28, 8.98, 9.88, 10.14, 10.56, 11.0, 11.48, 12.18, 12.68, 13.4, 13.54, 14.6, 15.04, 15.64, 16.44, 17.22, 17.64, 18.06, 19.22, 19.8, 20.02, 20.52, 20.74];
const HEART = ['01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000'];
let o, m, clip, clipGrey, TL, TLb, layer, lx, fl = [], riv = [];

function buildTimeline() {
  const c = mk(960, 540), x = c.getContext('2d'); let n = 0; const h = () => hash(++n);
  rr(x, 0, 0, 960, 540, 18); x.fillStyle = '#131C2B'; x.fill(); x.save(); x.clip();
  const pal = ['#5B7CFA', '#3E5BC9', '#7FA6E8', '#48607F', '#8C7BE0', '#3B8EA5', '#6A7890', '#E0A050'];
  // menu bar
  x.fillStyle = '#0D1420'; x.fillRect(0, 0, 960, 34);
  ['#52607A', '#52607A', '#52607A'].forEach((f, i) => { x.fillStyle = f; x.beginPath(); x.arc(18 + i * 16, 17, 4.5, 0, 7); x.fill(); });
  for (let i = 0, px = 80; px < 930; i++) { const w = 8 + Math.floor(h() * 3) * 9; x.fillStyle = `rgba(190,205,230,${0.16 + h() * 0.2})`; rr(x, px, 12, w, 10, 3); x.fill(); px += w + (i % 5 === 4 ? 22 : 6); }
  const panel = (px, py, w, hh) => { rr(x, px, py, w, hh, 8); x.fillStyle = '#19243A'; x.fill(); x.strokeStyle = 'rgba(160,180,220,0.10)'; x.lineWidth = 1; x.stroke(); };
  // bin
  panel(10, 42, 196, 258);
  for (let i = 0; i < 5; i++) { x.fillStyle = `rgba(190,205,230,${i ? 0.18 : 0.5})`; rr(x, 18 + i * 36, 50, 30, 8, 3); x.fill(); }
  for (let r = 0; r < 6; r++) for (let q = 0; q < 4; q++) { const px = 18 + q * 46, py = 68 + r * 38;
    x.fillStyle = `hsl(${205 + h() * 40},${18 + h() * 22}%,${26 + h() * 22}%)`; rr(x, px, py, 40, 24, 3); x.fill();
    x.fillStyle = 'rgba(190,205,230,0.22)'; x.fillRect(px, py + 28, 14 + h() * 24, 3); }
  // monitor
  panel(214, 42, 430, 258); x.fillStyle = '#080C14'; rr(x, 222, 50, 414, 214, 5); x.fill();
  x.save(); x.filter = 'saturate(0.5) brightness(0.8)'; cover(x, clip, 369, 54, 120, 206, 3); x.restore();
  for (let i = 0; i < 22; i++) { x.fillStyle = `rgba(190,205,230,${i === 10 ? 0.75 : 0.2 + h() * 0.15})`; rr(x, 228 + i * 18.6, 274, i === 10 ? 14 : 11, 14, 3); x.fill(); }
  // inspector
  panel(652, 42, 298, 258);
  for (let i = 0; i < 4; i++) { x.fillStyle = `rgba(190,205,230,${i === 1 ? 0.5 : 0.18})`; rr(x, 660 + i * 50, 50, 42, 8, 3); x.fill(); }
  for (let r = 0; r < 9; r++) { const py = 70 + r * 15; x.fillStyle = 'rgba(190,205,230,0.25)'; x.fillRect(660, py + 2, 26 + h() * 30, 4);
    x.fillStyle = 'rgba(190,205,230,0.12)'; rr(x, 730, py + 2, 120, 4, 2); x.fill(); const k = h(); x.fillStyle = IRIS; rr(x, 730, py + 2, 120 * k, 4, 2); x.fill();
    x.fillStyle = '#DCE6F7'; x.beginPath(); x.arc(730 + 120 * k, py + 4, 4, 0, 7); x.fill();
    x.fillStyle = 'rgba(190,205,230,0.2)'; rr(x, 862, py - 1, 30, 10, 3); x.fill(); rr(x, 898, py - 1, 10, 10, 3); x.fill(); rr(x, 914, py - 1, 10, 10, 3); x.fill(); rr(x, 930, py - 1, 10, 10, 3); x.fill(); }
  for (let i = 0; i < 3; i++) { const cx = 706 + i * 94, cy = 252; const g = x.createConicGradient(i, cx, cy);
    ['#5B7CFA', '#8C7BE0', '#E0A050', '#3B8EA5', '#5B7CFA'].forEach((cc, j) => g.addColorStop(j / 4, cc));
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 36, 0, 7); x.fill(); x.fillStyle = '#19243A'; x.beginPath(); x.arc(cx, cy, 30, 0, 7); x.fill();
    x.strokeStyle = 'rgba(190,205,230,0.25)'; x.beginPath(); x.moveTo(cx - 30, cy); x.lineTo(cx + 30, cy); x.moveTo(cx, cy - 30); x.lineTo(cx, cy + 30); x.stroke();
    x.fillStyle = '#F7FAFD'; x.beginPath(); x.arc(cx + (h() - 0.5) * 26, cy + (h() - 0.5) * 26, 3.5, 0, 7); x.fill(); }
  // tool strip
  for (let i = 0, px = 14; px < 940; i++) { x.fillStyle = `rgba(190,205,230,${i % 9 === 3 ? 0.6 : 0.2})`; rr(x, px, 309, 13, 13, 3); x.fill(); px += i % 6 === 5 ? 34 : 18; }
  // timeline
  panel(10, 330, 940, 202); x.fillStyle = 'rgba(190,205,230,0.3)';
  for (let i = 0; i < 106; i++) x.fillRect(100 + i * 8, 336 + (i % 5 ? 6 : 0), 1, i % 5 ? 4 : 10);
  for (let r = 0; r < 10; r++) { const py = 352 + r * 17.6; x.fillStyle = r % 2 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.12)'; x.fillRect(12, py, 936, 16);
    for (let i = 0; i < 4; i++) { x.fillStyle = `rgba(190,205,230,${0.16 + h() * 0.25})`; rr(x, 18 + i * 18, py + 3, i ? 9 : 16, 9, 2); x.fill(); }
    let px = 100 + h() * 40; const col = pal[Math.floor(h() * (r < 5 ? 5 : 8))];
    while (px < 930) { const w = Math.min(930 - px, 12 + h() * h() * 150); x.fillStyle = h() < 0.25 ? pal[Math.floor(h() * 8)] : col; x.globalAlpha = 0.85; rr(x, px, py + 1.5, w, 13, 3); x.fill(); x.globalAlpha = 1;
      if (r >= 5) { x.fillStyle = 'rgba(8,12,20,0.45)'; for (let k = 2; k < w - 2; k += 2.5) { const a = 1 + h() * 9; x.fillRect(px + k, py + 8 - a / 2, 1.2, a); } }
      else { x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(px + 3, py + 4, Math.min(w - 6, 14), 2); }
      px += w + (h() < 0.3 ? 6 + h() * 30 : 1.5); } }
  for (let i = 0; i < 7; i++) { const px = 120 + h() * 780; x.fillStyle = '#E0A050'; x.beginPath(); x.moveTo(px - 4, 337); x.lineTo(px + 4, 337); x.lineTo(px, 345); x.fill(); }
  x.fillStyle = '#F2B25C'; x.fillRect(486, 334, 2, 196); x.beginPath(); x.moveTo(479, 332); x.lineTo(495, 332); x.lineTo(487, 344); x.fill();
  x.restore(); return c;
}

function buildFloaters() {
  const S = 180, out = [];
  { const c = mk(S, S), x = c.getContext('2d'); x.translate(90, 90); // clock, no numerals (hands drawn live)
    x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(0, 0, 60, 0, 7); x.fill();
    x.strokeStyle = INK; x.lineWidth = 6; x.beginPath(); x.arc(0, 0, 57, 0, 7); x.stroke();
    for (let i = 0; i < 12; i++) { x.save(); x.rotate(i * Math.PI / 6); x.fillStyle = i % 3 ? 'rgba(14,26,43,0.35)' : INK; rr(x, -1.8, -49, 3.6, i % 3 ? 7 : 12, 2); x.fill(); x.restore(); }
    out.push(c); }
  { const c = mk(S, S), x = c.getContext('2d'); x.translate(90, 90); // software window
    rr(x, -72, -52, 144, 104, 14); x.fillStyle = '#FFFFFF'; x.fill(); x.strokeStyle = INK; x.lineWidth = 4; x.stroke();
    x.save(); rr(x, -72, -52, 144, 104, 14); x.clip(); x.fillStyle = INK; x.fillRect(-72, -52, 144, 22);
    ['#F2B25C', '#7FA6E8', '#5B7CFA'].forEach((f, i) => { x.fillStyle = f; x.beginPath(); x.arc(-58 + i * 12, -41, 3.6, 0, 7); x.fill(); });
    x.fillStyle = '#EEF2F8'; x.fillRect(-72, -30, 36, 82); for (let i = 0; i < 4; i++) { x.fillStyle = i === 1 ? IRIS : 'rgba(14,26,43,0.22)'; rr(x, -64, -20 + i * 13, 20, 5, 2.5); x.fill(); }
    x.fillStyle = '#DDE7F6'; rr(x, -28, -22, 92, 38, 6); x.fill(); x.fillStyle = IRIS; x.beginPath(); x.moveTo(12, -10); x.lineTo(26, -3); x.lineTo(12, 4); x.fill();
    [[0, 40, IRIS], [44, 30, '#7FA6E8'], [0, 22, '#B9C6DC'], [26, 52, '#F2B25C']].forEach(([a, w, f], i) => { x.fillStyle = f; rr(x, -28 + a, 24 + (i > 1 ? 11 : 0), w, 7, 3); x.fill(); });
    x.restore(); out.push(c); }
  { const c = mk(S, S), x = c.getContext('2d'); x.translate(90, 90); // skill sparkle
    const star = (cx, cy, R, f) => { x.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 - Math.PI / 2, b = a + Math.PI / 4, c2 = a + Math.PI / 2;
      if (!i) x.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); x.quadraticCurveTo(cx + Math.cos(b) * R * 0.16, cy + Math.sin(b) * R * 0.16, cx + Math.cos(c2) * R, cy + Math.sin(c2) * R); } x.fillStyle = f; x.fill(); };
    const g = x.createLinearGradient(-50, -60, 50, 60); g.addColorStop(0, '#8FA8FF'); g.addColorStop(1, '#4763E8');
    star(-6, 4, 62, g); star(46, -44, 22, '#F2B25C'); star(40, 46, 13, '#8FA8FF'); out.push(c); }
  return out;
}

export default { dur: 22,
  async init(c) {
    o = c.getContext('2d'); m = new MooviFilm(512); await loadPixelFont();
    clip = await loadImg(TEX + 'raw-5.5.jpg'); riv = await Promise.all(['ed-12.0', 'ed-15.0', 'ed-1.0'].map(n => loadImg(TEX + n + '.jpg')));
    clipGrey = mk(270, 480); { const x = clipGrey.getContext('2d'); x.filter = 'grayscale(1) contrast(0.7) brightness(1.12)'; x.drawImage(clip, 0, 0, 270, 480); }
    TL = buildTimeline(); fl = buildFloaters();
    layer = mk(W, H); lx = layer.getContext('2d');
  },
  frame(t) {
    finish(o);
    // ---------- camera: never holds. push / slam recoil / push into the buttons / loom / pan to the phone / tilt up / pan to the rival / settle for the rise
    const slam = t - T_EDIT, sh = ring(slam, 5, 30);
    const z = key(t, [[0, 1.3], [0.6, 1.1], [2.4, 1.16], [4.1, 1.2], [4.5, 0.97], [5.3, 1.0], [6.9, 1.2], [8.0, 1.08], [9.3, 1.14], [9.9, 0.98], [11.4, 1.04], [13.6, 1.0], [14.6, 1.03], [15.6, 0.98], [18.2, 1.02], [19.2, 0.97], [20.9, 1.03], [21.4, 1.0], [22, 1.0]]) + 0.004 * Math.sin(t * 1.3);
    const cx = key(t, [[0, 640], [2.4, 620], [4.1, 640], [5.3, 640], [6.9, 560], [8.0, 640], [9.3, 640], [9.9, 660], [11.4, 700], [13.6, 690], [14.6, 640], [15.6, 650], [18.2, 670], [19.2, 720], [20.9, 730], [21.4, 640], [22, 640]]) + 5 * Math.sin(t * 0.83) + sh * 7;
    const cy = key(t, [[0, 400], [2.4, 392], [4.1, 388], [4.5, 352], [5.3, 350], [6.9, 250], [8.0, 372], [9.3, 398], [9.9, 356], [13.6, 350], [14.6, 362], [15.6, 334], [18.2, 328], [19.2, 352], [20.9, 356], [21.4, 360], [22, 360]]) + 3 * Math.sin(t * 1.07 + 1) + sh * 5;
    beginCam(o, z, cx, cy);
    const CAM = o.getTransform();
    const rise = seg(t, T_RISE, 21.95);

    // ---------- graphics layer (everything the wipe clears), behind the subject
    const wipe = seg(t, T_WIPE, T_WIPE + 0.6);
    if (wipe < 1) {
      lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalAlpha = 1; lx.filter = 'none'; lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, W, H);
      lx.setTransform(CAM);
      // -- giant pale pixel word behind him
      lx.save(); lx.font = '700 200px "Silkscreen"'; const gs = w => Math.min(236, 200 * 1010 / lx.measureText(w).width); const gx = (w, z2) => { lx.font = `700 ${z2}px "Silkscreen"`; return MX - lx.measureText(w).width / 2; };
      const g1 = 'editors', g2 = 'waiting', z1 = gs(g1), z2 = gs(g2), x1 = gx(g1, z1), x2 = gx(g2, z2); lx.restore();
      typed(lx, g1, x1, 462, z1, t, 1.5, { cps: 11, col: PALE, w: 700, cursor: false, out: T_EDIT - 0.05 });
      typed(lx, g2, x2, 462, z2, t, 14.75, { cps: 12, col: PALE, w: 700, cursor: false });
      // -- pro timeline: slams in from the camera side, looms over him as he sinks, then whips up and out
      if (slam > -0.34 && t < T_OUT + 0.6) {
        const inn = expoOut(seg(slam, -0.34, 0)), bounce = ring(slam, 5.5, 22) * 0.035, loom = smooth(seg(t, 7.1, 8.7));
        const tr = (inn2, out2) => ({ s: lerp(1.9, 1.0, inn2) + bounce + loom * 0.1, y: lerp(-140, 0, inn2) + 318 + loom * 22 - out2 * 900, x: 640 - out2 * 160, r: lerp(-0.06, -0.012, inn2) + bounce * 0.3 - out2 * 0.12 + loom * 0.012 * Math.sin(t * 3) });
        const dr = (q, a) => { lx.save(); lx.translate(q.x, q.y); lx.rotate(q.r); lx.scale(q.s, q.s); lx.globalAlpha = a; lx.drawImage(TL, -480, -270); lx.restore(); };
        const outp = cubicIn(seg(t, T_OUT, T_OUT + 0.45)), a = seg(slam, -0.34, -0.14);
        if (inn < 1) for (let k = 4; k >= 1; k--) dr(tr(expoOut(seg(slam - k * 0.024, -0.34, 0)), 0), a * 0.16);
        if (outp > 0 && outp < 1) for (let k = 4; k >= 1; k--) dr(tr(1, cubicIn(seg(t - k * 0.02, T_OUT, T_OUT + 0.45))), 0.18);
        dr(tr(inn, outp), a);
        if (slam > 0) { const q = tr(inn, outp); lx.save(); lx.translate(q.x, q.y); lx.rotate(q.r); lx.scale(q.s, q.s);
          lx.fillStyle = '#F2B25C'; lx.fillRect(20 + (t - T_EDIT) * 14, 64, 2, 196);
          // all its tiny buttons: they light up one after another, a pixel cursor scurrying between them
          const bt = (t - 5.3) / 0.13, nb = Math.floor(bt); const bp = i => { const zone = Math.floor(hash(i * 3 + 1) * 4);
            return zone === 0 ? [-400 + hash(i * 7) * 850, -258 + 5] : zone === 1 ? [-466 + hash(i * 7) * 920, 39 + 6] : zone === 2 ? [-252 + Math.floor(hash(i * 7) * 22) * 18.6 + 5, 4 + 7] : [172 + hash(i * 7) * 290, -200 + Math.floor(hash(i * 5) * 9) * 15 + 4]; };
          if (bt > 0 && t < T_OUT) { for (let i = Math.max(0, nb - 9); i <= nb; i++) { const [bx, by] = bp(i), age = nb - i; lx.fillStyle = age < 2 ? '#D9F56B' : `rgba(217,245,107,${0.75 - age * 0.07})`; lx.fillRect(bx - 7, by - 7, 14, 14); if (age < 1) { lx.strokeStyle = '#D9F56B'; lx.lineWidth = 2; lx.strokeRect(bx - 12, by - 12, 24, 24); } }
            const [ax, ay] = bp(nb), [bx2, by2] = bp(nb + 1), f = smooth(bt - nb), ux = lerp(ax, bx2, f), uy = lerp(ay, by2, f);
            lx.fillStyle = '#FFFFFF'; lx.strokeStyle = BLACK; lx.lineWidth = 2; lx.beginPath(); lx.moveTo(ux, uy); lx.lineTo(ux, uy + 20); lx.lineTo(ux + 5, uy + 15); lx.lineTo(ux + 9, uy + 23); lx.lineTo(ux + 13, uy + 21); lx.lineTo(ux + 9, uy + 13); lx.lineTo(ux + 15, uy + 13); lx.closePath(); lx.fill(); lx.stroke(); }
          lx.restore(); }
      }
      // -- phone gallery: arrives from depth on the right; later shoved aside by the rival's reel
      const pin = t - T_CLIP;
      if (pin > 0) {
        const e = expoOut(seg(pin, 0, 0.7)), aside = smooth(seg(t, T_RIV - 0.3, T_RIV + 0.4)), sp = (0.55 + 0.45 * spring(pin, 6, 11)) * lerp(1, 0.74, aside), bob = Math.sin(t * 1.3) * 5;
        const px = lerp(PX - 90, PX, e) - aside * 150, py = 330 + bob + (1 - e) * 60 + aside * 46;
        const dn = seg(t, T_CAL + 0.08, 13.5); // day/night progress (two cycles)
        const night = dn > 0 && dn < 1 ? 0.5 - 0.5 * Math.cos(dn * Math.PI * 4) : 0;
        lx.save(); lx.translate(px, py); lx.rotate(0.05 - 0.02 * Math.sin(t * 0.8) - aside * 0.12); lx.scale(sp, sp); const A = seg(pin, 0, 0.12); lx.globalAlpha = A;
        if (e < 0.98) lx.filter = `blur(${(1 - e) * 10}px)`;
        rr(lx, -116, -236, 232, 472, 36); lx.fillStyle = BLACK; lx.fill(); lx.filter = 'none';
        rr(lx, -108, -228, 216, 456, 29); lx.fillStyle = '#FFFFFF'; lx.fill(); lx.save(); lx.clip();
        lx.fillStyle = BLACK; rr(lx, -30, -220, 60, 16, 8); lx.fill();
        lx.font = '400 20px "Silkscreen"'; lx.textAlign = 'left'; lx.fillText('gallery', -94, -172);
        lx.fillStyle = 'rgba(14,26,43,0.3)'; lx.fillRect(-94, -160, 54, 4);
        const grey = smooth(seg(t, T_GREY, T_GREY + 1.1)), pick = smooth(seg(pin, 0.2, 0.6)) * (1 - 0.6 * grey) * (1 + 0.12 * Math.sin(t * 6) * (1 - grey));
        for (let i = 0; i < 12; i++) { if (i === 4) continue; const q = i % 3, r = Math.floor(i / 3), x0 = -94 + q * 65, y0 = -140 + r * 88;
          const sh2 = 228 - hash(i + 3) * 26; lx.globalAlpha = A * (1 - 0.3 * pick); lx.fillStyle = `rgb(${sh2},${sh2},${sh2 + 3})`; rr(lx, x0, y0, 58, 80, 7); lx.fill();
          lx.fillStyle = 'rgba(255,255,255,0.75)'; lx.beginPath(); lx.arc(x0 + 18 + hash(i + 70) * 22, y0 + 24 + hash(i + 80) * 10, 8 + hash(i + 5) * 4, 0, 7); lx.fill();
          lx.beginPath(); lx.moveTo(x0, y0 + 80); lx.lineTo(x0 + 20 + hash(i + 11) * 20, y0 + 46 + hash(i + 12) * 10); lx.lineTo(x0 + 58, y0 + 80); lx.fill(); }
        lx.globalAlpha = A;
        { const x0 = -94 + 65, y0 = -140 + 88, k = 1 + 0.22 * pick; lx.save(); lx.translate(x0 + 29, y0 + 40); lx.scale(k, k);
          if (pick > 0.02) { lx.fillStyle = BLACK; rr(lx, -32, -43, 64, 86, 9); lx.fill(); }
          cover(lx, clip, -29, -40, 58, 80, 7); if (grey > 0) { lx.globalAlpha = A * grey; cover(lx, clipGrey, -29, -40, 58, 80, 7); lx.globalAlpha = A; }
          lx.fillStyle = `rgba(255,255,255,${0.95 - 0.5 * grey})`; lx.beginPath(); lx.moveTo(-6, -9); lx.lineTo(9, 0); lx.lineTo(-6, 9); lx.fill();
          lx.restore(); }
        if (dn > 0 && dn < 1) { lx.fillStyle = `rgba(14,20,34,${0.6 * night})`; lx.fillRect(-108, -228, 216, 456);
          const sx2 = ((dn * 2) % 1) * 520 - 260; const g = lx.createLinearGradient(sx2 - 90, -228, sx2 + 90, 228); g.addColorStop(0, 'rgba(255,236,200,0)'); g.addColorStop(0.5, 'rgba(255,236,200,0.5)'); g.addColorStop(1, 'rgba(255,236,200,0)');
          lx.fillStyle = g; lx.fillRect(-108, -228, 216, 456); }
        if (aside > 0) { lx.fillStyle = `rgba(254,254,253,${0.5 * aside})`; lx.fillRect(-108, -228, 216, 456); }
        lx.restore(); lx.restore(); lx.globalAlpha = 1;
        // -- calendar pages flying off + sun / moon arcing over the phone (day after day, no numbers)
        const cin = t - T_CAL, cgo = seg(t, T_RIV - 0.4, T_RIV - 0.1);
        if (cin > 0 && cgo < 1) {
          const ce = backOut(seg(cin, 0, 0.3)) * (1 - cgo), cxp = px - 172, cyp = py - 150 + Math.sin(t * 1.1 + 2) * 4, ca = seg(cin, 0, 0.08);
          const dots = () => { lx.fillStyle = 'rgba(17,17,17,0.2)'; for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) lx.fillRect(-25 + q * 14, -10 + r * 14, 7, 7); };
          for (let i = 6; i >= 0; i--) { const p = seg(cin, 0.1 + i * 0.26, 1.3 + i * 0.26); if (p <= 0 || p >= 1) continue;
            const e2 = cubicOut(p), fx = cxp + e2 * (150 + i * 26), fy = cyp + 12 - Math.sin(p * 2.6) * (110 + hash(i) * 50) - p * 60, flip = Math.cos(p * 9 + i);
            lx.save(); lx.translate(fx, fy); lx.rotate(p * (2.4 + hash(i + 2) * 2) * (i % 2 ? 1 : -1) * 0.6 + 0.2); lx.scale(lerp(1, 0.55, p), flip * lerp(1, 0.55, p)); lx.globalAlpha = ca * (1 - cubicIn(p)); if (p > 0.4) lx.filter = `blur(${(p - 0.4) * 9}px)`;
            lx.fillStyle = flip > 0 ? '#FFFFFF' : '#EDEDED'; lx.fillRect(-34, -30, 68, 60); lx.strokeStyle = BLACK; lx.lineWidth = 3; lx.strokeRect(-34, -30, 68, 60); if (flip > 0) dots();
            lx.restore(); }
          lx.save(); lx.translate(cxp, cyp); lx.rotate(-0.07); lx.scale(ce, ce); lx.globalAlpha = ca;
          lx.fillStyle = '#FFFFFF'; lx.fillRect(-40, -44, 80, 88); lx.fillStyle = BLACK; lx.fillRect(-40, -44, 80, 24); lx.strokeStyle = BLACK; lx.lineWidth = 4; lx.strokeRect(-40, -44, 80, 88);
          lx.fillRect(-24, -54, 7, 16); lx.fillRect(17, -54, 7, 16); dots();
          const ph = (cin - 0.1) / 0.26, pk = ph > 0 && ph < 7 ? Math.max(0, 1 - (ph % 1) * 2.4) : 0;
          if (pk > 0) { lx.fillStyle = '#FFFFFF'; lx.beginPath(); lx.moveTo(42, 46); lx.lineTo(40 - 30 * pk, 46); lx.lineTo(42, 44 - 30 * pk); lx.fill(); lx.fillStyle = BLACK; lx.beginPath(); lx.moveTo(40 - 30 * pk, 44); lx.lineTo(40, 44 - 30 * pk); lx.lineTo(40 - 26 * pk, 44 - 26 * pk); lx.fill(); }
          lx.restore();
          if (dn > 0 && dn < 1) { const ph2 = (dn * 2) % 1, isMoon = ph2 > 0.5, u = (ph2 % 0.5) / 0.5, ang = Math.PI * (1 - u);
            const sxp = px + 20 + Math.cos(ang) * 120, syp = py - 236 - Math.sin(ang) * 46, aa = Math.sin(u * Math.PI) ** 0.5;
            lx.save(); lx.globalAlpha = aa; lx.translate(sxp, syp); lx.fillStyle = isMoon ? BLACK : '#F5B45C';
            if (isMoon) { lx.beginPath(); lx.arc(0, 0, 13, 0.5, 0.5 + Math.PI * 1.4); lx.arc(7, -5, 11, 0.5 + Math.PI * 1.25, 0.75, true); lx.fill(); }
            else { lx.beginPath(); lx.arc(0, 0, 12, 0, 7); lx.fill(); for (let k = 0; k < 8; k++) { lx.save(); lx.rotate(k * Math.PI / 4 + t); lx.fillRect(-2, -24, 4, 8); lx.restore(); } }
            lx.restore(); }
        }
        // -- someone else's reel takes the attention: a rival phone whips in, the hearts that gathered by ours fly over to it
        const rin = t - T_RIV, RXp = 1120, RYp = 300;
        if (rin > 0) { const re = expoOut(seg(rin, 0, 0.5)), rs = 0.6 + 0.4 * spring(rin, 7, 12), rx = lerp(1420, RXp, re), ry = RYp + Math.sin(t * 1.5 + 1) * 5, beat = 1 + 0.02 * Math.sin(t * 9) * seg(t, T_GO, T_GO + 0.3);
          const ph = (tt, a) => { const e2 = expoOut(seg(tt - T_RIV, 0, 0.5)); lx.save(); lx.translate(lerp(1420, RXp, e2), ry); lx.rotate(-0.05 + 0.015 * Math.sin(t * 1.1)); lx.scale(rs * beat, rs * beat); lx.globalAlpha = a;
            rr(lx, -100, -204, 200, 408, 32); lx.fillStyle = BLACK; lx.fill(); if (a === 1) { const k = Math.floor((t - T_RIV) / 0.55) % riv.length; cover(lx, riv[k], -92, -196, 184, 392, 25);
              lx.fillStyle = '#FFFFFF'; for (let i = 0; i < 8; i++) lx.fillRect(-78 + i * 20, 170, 13, 7); lx.fillStyle = BLACK; rr(lx, -28, -188, 56, 14, 7); lx.fill(); } lx.restore(); };
          if (re < 1) for (let k = 4; k >= 1; k--) ph(t - k * 0.025, 0.15); ph(t, 1);
          // pixel hearts
          const heart = (hx, hy, u, a, rot) => { lx.save(); lx.translate(hx, hy); lx.rotate(rot); lx.globalAlpha = a; lx.fillStyle = BLACK; lx.fillRect(-4 * u - 3, -3.5 * u - 3, 8 * u + 6, 5 * u + 3); lx.fillStyle = '#FF3D57';
            for (let r = 0; r < 7; r++) for (let q = 0; q < 8; q++) if (HEART[r][q] === '1') lx.fillRect((q - 4) * u, (r - 3.5) * u, u + 0.5, u + 0.5); lx.restore(); };
          for (let i = 0; i < 16; i++) { const born = T_RIV + 0.02 + i * 0.05, d = t - born; if (d <= 0) continue;
            const hx0 = px - 30 + (hash(i * 9 + 1) - 0.5) * 230, hy0 = py - 60 + (hash(i * 9 + 2) - 0.5) * 330, go = T_GO + i * 0.035, g = cubicIn(seg(t, go, go + 0.4)) , up = Math.max(0, t - go - 0.4);
            const tx = rx + (hash(i * 9 + 3) - 0.5) * 150, ty = ry + 60 - hash(i * 9 + 4) * 200; if (up > 1.1) continue;
            const x = lerp(hx0, tx, g) + Math.sin(t * 3 + i) * 5 * (1 - g), y = lerp(hy0, ty, g) - Math.sin(g * Math.PI) * 70 + Math.cos(t * 2.6 + i) * 5 - up * 150;
            const pop = d < 0.05 ? 0.4 : d < 0.1 ? 1.3 : 1; heart(x, y, (3 + hash(i) * 2.5) * pop, 1 - seg(up, 0.5, 1.1), (hash(i + 5) - 0.5) * 0.5); }
          for (let i = 0; i < 26; i++) { const born = T_GO + 0.45 + i * 0.07, d = t - born; if (d <= 0 || d > 1.3) continue;   // and they keep coming for the other reel
            heart(rx + 70 + Math.sin(d * 5 + i) * 16 + (hash(i + 60) - 0.5) * 40, ry + 150 - d * 260, 3.5 + hash(i + 20) * 3, 1 - seg(d, 0.8, 1.3), Math.sin(d * 4 + i) * 0.3); } }
      }
      // -- type stack, top-left: lime labels (old struck -> new), one big pixel keyword, a stalling pixel bar
      const LX = 84, BY = 264, BS = 72;
      label(lx, 'editors', LX, 78, t, 1.82, { solid: false, strike: seg(t, 2.14, 2.4), out: T_EDIT - 0.2 });
      label(lx, 'most of us', LX, 130, t, 1.28, { solid: true, spark: seg(t, 1.32, 1.52), dot: true, out: T_EDIT - 0.2 });
      label(lx, 'real editing timeline', LX, 78, t, T_EDIT + 0.12, { solid: true, dot: true, out: 5.82 });
      label(lx, 'all its tiny buttons', LX, 78, t, 5.82, { solid: true, spark: seg(t, 5.9, 6.1), dot: true, out: 7.8 });
      label(lx, 'anyone', LX, 78, t, 7.8, { solid: false, strike: seg(t, 8.28, 8.5), out: T_OUT });
      label(lx, 'sinks into the chair', LX, 130, t, 8.28, { solid: true, spark: seg(t, 8.34, 8.54), dot: true, out: T_OUT });
      label(lx, 'post it', LX, 78, t, 10.56, { solid: false, strike: seg(t, 13.5, 13.75), out: 14.6 });
      label(lx, 'sits in the gallery', LX, 130, t, 11.0, { solid: true, spark: seg(t, 11.05, 11.25), dot: true, out: 13.4 });
      label(lx, 'never posted', LX, 130, t, 13.4, { solid: true, spark: seg(t, 13.45, 13.65), dot: true, out: 14.6 });
      label(lx, 'our attention', LX, 78, t, T_RIV + 0.02, { solid: false, strike: seg(t, T_GO, T_GO + 0.25) });
      label(lx, 'someone else', LX, 130, t, 20.52, { solid: true, spark: seg(t, 20.56, 20.76), dot: true });
      typed(lx, 'the catch', LX, BY, BS, t, 0.55, { cps: 26, out: 3.16 });
      typed(lx, 'one look', LX, BY, BS, t, 3.16, { cps: 26, out: T_EDIT - 0.2 });
      typed(lx, 'the clip', LX, BY, BS, t, T_CLIP + 0.1, { cps: 26, out: 11.4 });
      snapWord(lx, 'gallery', LX, BY, BS, t, 11.4, { out: 12.18 }); snapWord(lx, 'day after day', LX, BY, BS, t, 12.18, { out: 14.6 });
      typed(lx, 'waiting', LX, BY, BS, t, 14.6, { cps: 22, out: T_FLOAT[0] });
      snapWord(lx, 'time', LX, BY, BS, t, T_FLOAT[0], { out: T_FLOAT[1] }); snapWord(lx, 'software', LX, BY, BS, t, T_FLOAT[1], { out: T_FLOAT[2] }); snapWord(lx, 'skill', LX, BY, BS, t, T_FLOAT[2], { out: T_RIV });
      snapWord(lx, 'attention', LX, BY, BS, t, T_RIV);
      if (t > 17.64 && t < T_RIV) { lx.save(); lx.font = `400 ${BS}px "Silkscreen"`; lx.fillStyle = BLACK; lx.fillRect(LX - 8, 236, (lx.measureText('skill').width + 16) * expoOut(seg(t, 17.64, 17.95)), 8); lx.restore(); }
      if (t > 12.18 && t < 14.6) pixBar(lx, LX + 2, 292, 12, 1 + Math.floor((t - 12.18) / 0.2));
      if (t >= 14.6 && t < T_RIV) { const bt = t - 14.6, cyc = bt % 1.2; pixBar(lx, LX + 2, 292, 12, t > 17.95 ? 0 : cyc < 0.9 ? 1 + cyc / 0.2 : (Math.floor(cyc / 0.06) % 2 ? 5 : 0)); }
      if (t >= T_RIV) pixBar(lx, LX + 2, 292, 12, Math.max(0, 12 - Math.floor(Math.max(0, t - T_GO) / 0.055)));
      // -- the time, the software, the skill: rise just out of reach, drift off into blur
      for (let i = 0; i < 3; i++) { const dt = t - T_FLOAT[i]; if (dt <= 0 || dt > 2.6) continue;
        const up = backOut(seg(dt, 0, 0.55), 1.2), away = cubicIn(seg(dt, 0.75, 2.6)), hx = [575, 700, 815][i], hy = [150, 104, 150][i];
        const x = lerp(MX + (i - 1) * 30, hx, up) + away * (120 + i * 40) + Math.sin(dt * 2.2 + i) * 6, y = lerp(270, hy, up) - away * 210 + Math.cos(dt * 1.9 + i) * 5;
        const s = lerp(0.25, 1, up) * lerp(1, 0.45, away), a = seg(dt, 0, 0.12) * (1 - seg(dt, 1.8, 2.6));
        lx.save(); lx.translate(x, y); lx.rotate((i - 1) * 0.08 + away * 0.5 * (i % 2 ? -1 : 1) + Math.sin(dt * 1.4) * 0.05); lx.scale(s, s); lx.globalAlpha = a;
        const bl = (1 - seg(dt, 0, 0.3)) * 6 + away * 14; if (bl > 0.3) lx.filter = `blur(${bl}px)`;
        lx.drawImage(fl[i], -90, -90);
        if (i === 0) { lx.strokeStyle = INK; lx.lineCap = 'round'; lx.lineWidth = 5; lx.beginPath(); lx.moveTo(0, 0); lx.lineTo(Math.sin(t * 3) * 28, -Math.cos(t * 3) * 28); lx.stroke();
          lx.lineWidth = 3.4; lx.beginPath(); lx.moveTo(0, 0); lx.lineTo(Math.sin(t * 14) * 42, -Math.cos(t * 14) * 42); lx.stroke(); lx.fillStyle = INK; lx.beginPath(); lx.arc(0, 0, 5, 0, 7); lx.fill(); }
        lx.restore(); }
      pixelWipe(lx, wipe);
      o.save(); o.setTransform(1, 0, 0, 1, 0, 0); o.drawImage(layer, 0, 0); o.restore();
    }

    // ---------- subject: black director's chair + Moovi, one hard cast shadow down-right
    const flinch = slam > 0 ? Math.exp(-1.5 * Math.max(0, t - T_EDIT - 0.5)) * Math.min(1, slam / 0.09) : 0; // shrink + lean back
    const sink = smooth(seg(t, 7.9, 8.8)) * (1 - smooth(seg(t, T_OUT + 0.1, T_OUT + 0.7)));                    // sinks into the chair
    const talk = WORDS.reduce((a, w) => { const d = t - w; return d > 0 && d < 0.3 ? a + Math.sin(d / 0.3 * Math.PI) * 0.022 : a; }, 0);
    const sigh = (a) => { const p = seg(t, a, a + 1.3); return p > 0 && p < 1 ? Math.sin(p * Math.PI * 2) * (p < 0.5 ? 0.03 : 0.05) * (1 - p * 0.3) : 0; };
    const sg = sigh(2.3) + sigh(13.7) + sigh(18.0);
    const reach = T_FLOAT.reduce((a, T) => a + Math.sin(seg(t, T, T + 0.75) * Math.PI) * 0.05, 0);
    const ant = Math.sin(seg(t, T_RISE - 0.3, T_RISE) * Math.PI / 2) * (t < T_RISE ? 1 : 1 - seg(t, T_RISE, T_RISE + 0.12));   // anticipation before he gets up
    const up = cubicOut(rise), land = t - 21.95;
    const slump = lerp(1, 0, up);
    const sy = (1 - 0.06 * slump + sg + reach + talk - 0.17 * sink - 0.12 * ant + 0.1 * Math.sin(rise * Math.PI)) * (1 - 0.10 * flinch) + ring(slam, 6, 20) * 0.03 - (land > 0 ? 0.1 * Math.exp(-8 * land) : 0);
    const sx = (1 + 0.04 * slump - sg * 0.6 - reach * 0.5 - talk * 0.6 + 0.1 * sink + 0.08 * ant) * (1 - 0.07 * flinch);
    const rot = -0.075 * flinch + 0.012 * Math.sin(t * 1.7) + 0.02 * Math.sin(t * 0.9) * (1 - up);
    const s = subjBegin(), C1 = '#141414', C2 = '#3A3A3A';
    const bar = (x0, y0, x1, y1, w, c) => { s.strokeStyle = c; s.lineCap = 'round'; s.lineWidth = w; s.beginPath(); s.moveTo(x0, y0); s.lineTo(x1, y1); s.stroke(); };
    // the chair glitches out as he stands (2-frame pixel snap), so the next act opens on him alone
    const cg = t - 21.6, chairOn = cg < 0.09, cgx = cg > 0 ? (cg < 0.045 ? 26 : -14) : ring(t - 8.98, 5, 24) * 3;
    const creak = ring(t - 8.75, 4, 20) * 0.012;
    s.save(); s.translate(MX + cgx, FLOOR); s.rotate(creak); s.translate(-MX, -FLOOR); if (cg > 0) { s.beginPath(); for (let i = 0; i < 6; i++) if (hash(i + (cg < 0.045 ? 3 : 9)) > 0.35) s.rect(0, 250 + i * 62, W, 62); s.clip(); }
    if (chairOn) { bar(MX - 108, SEAT + 6, MX + 122, FLOOR - 16, 9, C2); bar(MX + 108, SEAT + 6, MX - 122, FLOOR - 16, 9, C2);
      bar(MX - 132, SEAT + 8, MX - 132, SEAT - 190, 11, C1); bar(MX + 132, SEAT + 8, MX + 132, SEAT - 190, 11, C1);
      s.fillStyle = C1; s.beginPath(); s.moveTo(MX - 132, SEAT - 182); s.quadraticCurveTo(MX, SEAT - 174, MX + 132, SEAT - 182); s.lineTo(MX + 132, SEAT - 104); s.quadraticCurveTo(MX, SEAT - 98, MX - 132, SEAT - 104); s.fill();
      s.beginPath(); s.moveTo(MX - 136, SEAT - 4); s.quadraticCurveTo(MX, SEAT + 10 + sink * 8, MX + 136, SEAT - 4); s.lineTo(MX + 132, SEAT + 16); s.quadraticCurveTo(MX, SEAT + 30 + sink * 10, MX - 132, SEAT + 16); s.fill(); }
    s.restore();
    // Moovi: he's the narrator, so he keeps moving: eyes go to what he's naming, nubs gesture on the phrases
    const squint = key(t, [[0, 0.5], [1.8, 0.35], [3.2, 0.3], [T_EDIT - 0.1, 0.3], [T_EDIT + 0.1, 0], [5.3, 0.1], [7.2, 0.3], [8.5, 0.9], [9.4, 0.8], [10.0, 0.2], [11.3, 0.3], [12.4, 0.5], [13.6, 0.75], [14.6, 0.35], [15.6, 0.1], [17.6, 0.2], [18.3, 0.7], [19.2, 0.15], [20.2, 0.5], [20.9, 0.4], [21.4, 0], [22, 0]]);
    const look = key(t, [[0, [0, -0.3]], [0.5, [0, 0]], [1.4, [-0.3, 0.1]], [2.1, [0, 0]], [2.8, [0.2, -0.4]], [3.3, [0, 0.2]], [3.9, [-0.5, 0.8]], [T_EDIT + 0.12, [-0.2, 0.95]], [5.3, [-0.7, 0.9]], [5.9, [0.7, 0.9]], [6.5, [-0.6, 0.6]], [7.1, [0.5, 1]], [7.9, [0, 0.6]], [8.6, [0, -0.5]], [9.4, [0, -0.4]],
      [10.1, [0.95, 0.15]], [10.9, [0, 0]], [11.5, [0.95, 0.2]], [12.3, [0.8, 0.8]], [13.0, [0.9, 0.5]], [13.6, [0.3, -0.4]], [14.6, [0, 0]], [15.3, [0, 0.1]], [15.8, [-0.1, 0.95]], [16.6, [0.2, 1]], [17.4, [0.5, 1]], [18.0, [0.75, 0.9]], [18.5, [0, -0.2]], [19.3, [0.9, 0.2]], [20.0, [0.6, 0.1]], [20.4, [1, 0.3]], [20.9, [0.3, -0.3]], [21.3, [0, 0]], [22, [0, 0]]]);
    const direct = smooth(seg(t, 10.1, 10.4)) * (1 - smooth(seg(t, 11.7, 12.1))) + smooth(seg(t, 19.9, 20.2)) * (1 - smooth(seg(t, 20.75, 21.0)));
    const wave = smooth(seg(t, 0.3, 0.6)) * (1 - smooth(seg(t, 1.2, 1.6))) * 0.7 + smooth(seg(t, 5.4, 5.7)) * (1 - smooth(seg(t, 6.6, 7.0))) * 0.5 + reach * 12 * 0.5;
    const think = smooth(seg(t, 14.7, 15.0)) * (1 - smooth(seg(t, 15.4, 15.7))) * 0.8;
    const cv = m.render(t, { squint, look, direct, wave: Math.min(1, wave), think, lean: -0.9 * flinch - 0.5 * sink + 0.3 * up, shadow: 0 });
    const hopArc = Math.sin(rise * Math.PI) * 46, fy = lerp(SEAT + 12 + sink * 20, 624, up) - hopArc, ms = lerp(MS, 470, up);
    drawMoovi(s, cv, MX - 10 * flinch, fy, ms, { sx, sy, rot });
    // front X legs, feet, arm rests (in front of him)
    if (chairOn) { s.save(); s.translate(MX + cgx, FLOOR); s.rotate(creak); s.translate(-MX, -FLOOR); if (cg > 0) { s.beginPath(); for (let i = 0; i < 6; i++) if (hash(i + (cg < 0.045 ? 3 : 9)) > 0.35) s.rect(0, 250 + i * 62, W, 62); s.clip(); }
      if (up < 0.5) { bar(MX - 134, SEAT + 12, MX + 150, FLOOR - 4, 12, C1); bar(MX + 134, SEAT + 12, MX - 150, FLOOR - 4, 12, C1);
      bar(MX - 176, FLOOR - 2, MX - 126, FLOOR - 8, 10, C1); bar(MX + 176, FLOOR - 2, MX + 126, FLOOR - 8, 10, C1);
      bar(MX - 150, SEAT - 66, MX - 150, SEAT + 10, 9, C1); bar(MX + 150, SEAT - 66, MX + 150, SEAT + 10, 9, C1);
      bar(MX - 168, SEAT - 70, MX - 128, SEAT - 76, 13, C1); bar(MX + 168, SEAT - 70, MX + 128, SEAT - 76, 13, C1); } s.restore(); }
    subjEnd(o, lerp(FLOOR, 610, up));
    o.restore(); // camera
    // continue from the previous act: its flash to white clears off as the camera pushes in
    if (t < 0.5) { o.fillStyle = `rgba(254,254,253,${1 - smooth(seg(t, 0, 0.5))})`; o.fillRect(0, 0, W, H); }
    finish(o);
  } };
