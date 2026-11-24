// ACT D: "any AI connects". STUDIO style (pure white, one hard cast shadow, pixel type, lime labels).
// Moovi stands; Antigravity / Claude / Gemini fly in from depth, cable into the MCP port on his halo;
// raw footage drops in, the finished reel pops out and stands beside him.
import { MooviFilm } from '../moovi-film.js';
import { W, H, FLOOR, INK, IRIS, clamp, seg, lerp, smooth, expoOut, cubicIn, cubicOut, backOut, spring, ring, hash, key, rr, mk,
  loadImg, tintIcon, beginCam, drawMoovi, cover, finish, subjBegin, subjEnd, typed, snapWord, label, pixBar, loadPixelFont, PALE, BLACK, LIME,
  M_FEET, M_HALO } from './_studio.js';

const TEX = '/hackathon/whackiest-2026/out/v3/tex/', ICON = '/hackathon/whackiest-2026/film-v2/icons/';
const MX = 640, S = 400, RX = 990, RW = 172, RH = 306;
const MARKS = [{ n: 'antigravity', x: 292, y: 452, T: 5.7 }, { n: 'claude', x: 690, y: 108, T: 6.36 }, { n: 'gemini', x: 1040, y: 176, T: 7.1 }];
const T_CON = 8.64, T_DROP = 13.72, T_HIT = 14.34, T_POP = 17.5, T_LAND = 18.1, P0 = 99, PER = 2.4, NP = 4, T_END = 18.9;
const WORDS = [0.2, 0.66, 1.46, 1.8, 2.7, 3.08, 3.68, 4.32, 5.0, 5.7, 6.36, 7.1, 8.14, 8.64, 9.36, 9.7, 10.22, 10.82, 11.58, 12.02, 12.38, 13.46, 13.76, 14.34, 14.62, 15.7, 16.08, 16.28, 17.4, 17.66, 18.04, 18.6, 18.82];
let o, m, raw, eds = [], icons = [], layer, lx;

const bez = (a, c, b, u) => [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];

function drawMark(g, i, x, y, s, a, blur) {
  g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = a; if (blur > 0.4) g.filter = `blur(${blur}px)`;
  if (i === 0) { g.strokeStyle = BLACK; g.lineWidth = 13; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-30, 30); g.quadraticCurveTo(-8, -52, 4, -34); g.quadraticCurveTo(14, -18, 30, 30); g.stroke();
    g.fillStyle = BLACK; g.beginPath(); g.arc(30, -32, 8, 0, 7); g.fill(); }
  else g.drawImage(icons[i], -40, -40, 80, 80);
  g.filter = 'none'; g.font = '400 19px "Silkscreen"'; g.textAlign = 'center'; g.fillStyle = BLACK; g.fillText(MARKS[i].n, 0, 72);
  g.restore();
}
function drawReel(g, t, x, y, rot, sc, sqy) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc * (2 - sqy), sc * sqy);
  g.fillStyle = BLACK; rr(g, -RW / 2 - 6, -RH - 6, RW + 12, RH + 12, 16); g.fill();
  const c0 = T_LAND + 0.35, CP = 0.5, k = t < c0 ? 0 : 1 + Math.floor((t - c0) / CP), since = t < c0 ? 9 : (t - c0) % CP;
  const cur = eds[k % eds.length], prev = eds[(k + eds.length - 1) % eds.length], f = seg(since, 0, 0.22);
  if (f < 1 && k > 0) cover(g, prev, -RW / 2, -RH, RW, RH, 11);
  g.save(); g.globalAlpha = k > 0 ? f : 1; const zz = 1.06 - 0.06 * expoOut(seg(since, 0, 0.6)); rr(g, -RW / 2, -RH, RW, RH, 11); g.clip();
  g.translate(0, -RH / 2); g.scale(zz, zz); cover(g, cur, -RW / 2, -RH / 2, RW, RH, 0); g.restore();
  // pixel play bar inside the reel
  const n = 9, fill = t < T_LAND ? 0 : ((t - T_LAND) / 1.7) * n + 1;
  for (let i = 0; i < n; i++) { const px = -RW / 2 + 14 + i * 16.4; g.fillStyle = i < fill ? '#FFFFFF' : 'rgba(255,255,255,0.35)'; g.fillRect(px, -22, 11, 8); }
  g.restore();
}

export default { dur: 19.8,
  async init(c) {
    o = c.getContext('2d'); m = new MooviFilm(512); await loadPixelFont();
    raw = await loadImg(TEX + 'raw-2.0.jpg');
    eds = await Promise.all(['ed-4.3', 'ed-8.0', 'ed-12.0', 'ed-15.0', 'ed-1.0'].map(n => loadImg(TEX + n + '.jpg')));
    icons[1] = await tintIcon(ICON + 'claude.svg', 160, '#D97757');
    icons[2] = await tintIcon(ICON + 'googlegemini.svg', 160, (x, s) => { const g = x.createLinearGradient(0, s, s, 0); g.addColorStop(0, '#5B7CFA'); g.addColorStop(1, '#9A7BF0'); return g; });
    layer = mk(W, H); lx = layer.getContext('2d');
  },
  frame(t) {
    finish(o);
    // ---------- camera
    const z = key(t, [[0, 1.17], [1.2, 1.02], [2.7, 1.06], [3.6, 1.0], [5.5, 1.04], [5.9, 0.97], [7.4, 0.985], [8.6, 1.03], [9.7, 0.99], [10.8, 1.02], [12.5, 0.98], [13.7, 1.01], [14.4, 1.05], [16.4, 1.0], [17.4, 1.04], [18.2, 0.98], [19.8, 1.03]]) + 0.004 * Math.sin(t * 1.3);
    const cx = key(t, [[0, 640], [2.7, 630], [5.5, 640], [7.4, 660], [9.7, 640], [12.5, 650], [14.4, 635], [17.4, 640], [18.2, 676], [18.9, 680], [19.8, 760]]) + 5 * Math.sin(t * 0.8) + ring(t - T_LAND, 6, 26) * 4;
    const cy = key(t, [[0, 400], [1.2, 372], [5.5, 366], [5.9, 352], [9.7, 350], [12.5, 362], [14.4, 380], [16.4, 360], [18.2, 362], [19.8, 356]]) + 3 * Math.sin(t * 1.1 + 1) + ring(t - T_HIT, 6, 24) * 5;
    beginCam(o, z, cx, cy);
    const CAM = o.getTransform();

    // ---------- Moovi's motion (needed first: the halo port moves with him)
    const hopP = seg(t, 3.0, 3.5), hop = hopP > 0 && hopP < 1 ? 0.3 * 4 * hopP * (1 - hopP) : 0;
    const pulseN = Math.floor((t - P0) / PER), pph = t >= P0 && pulseN < NP ? ((t - P0) % PER) / PER : -1;   // pulse cycle phase or -1
    let sy = 1 + 0.012 * Math.sin(t * 1.9);
    sy -= 0.05 * smooth(seg(t, T_HIT - 0.4, T_HIT)) * (t < T_HIT ? 1 : 0) * -1;                 // stretches up to catch
    sy -= 0.16 * Math.exp(-5 * Math.max(0, t - T_HIT)) * Math.cos(15 * (t - T_HIT)) * (t >= T_HIT ? 1 : 0);   // absorb squash
    sy -= 0.10 * Math.sin(seg(t, T_POP - 0.3, T_POP) * Math.PI / 2) * (t < T_POP ? 1 : 0);                    // anticipation
    sy += 0.13 * Math.exp(-6 * Math.max(0, t - T_POP)) * Math.cos(16 * (t - T_POP)) * (t >= T_POP ? 1 : 0);    // release stretch
    sy -= 0.09 * Math.sin(seg(t, 2.75, 3.0) * Math.PI / 2) * (t < 3.0 ? 1 : 0);                           // hop anticipation
    sy -= 0.12 * Math.exp(-6 * Math.max(0, t - 3.5)) * Math.cos(15 * (t - 3.5)) * (t >= 3.5 ? 1 : 0);
    for (const w of WORDS) { const d = t - w; if (d > 0 && d < 0.3) sy += Math.sin(d / 0.3 * Math.PI) * 0.022; }      // landing
    if (pph >= 0.35) sy -= 0.03 * ring((pph - 0.35) * PER, 6, 16);
    const sx = 1 + (1 - sy) * 0.7;
    const bounce = 0.5 + 0.5 * Math.sin(t * 2.4);
    const hx = MX, hy = FLOOR - ((M_FEET - M_HALO) * S + (0.05 * Math.sin(t * 1.7) + 0.08 * bounce + hop) * 0.3 * S) * sy, hr = 0.165 * S;
    const ports = [[hx - hr, hy + 4], [hx + hr * 0.45, hy - hr * 0.9], [hx + hr, hy + 2]];

    // ---------- graphics layer behind the subject: giant pale word, the three marks, type stack
    lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalAlpha = 1; lx.filter = 'none'; lx.clearRect(0, 0, W, H); lx.setTransform(CAM);
    lx.save(); lx.font = '700 250px "Silkscreen"'; const wa = lx.measureText('ai').width, wm = lx.measureText('mcp').width; lx.restore();
    typed(lx, 'ai', MX - wa / 2, 500, 250, t, 3.68, { cps: 7, col: PALE, w: 700, cursor: false, out: 9.36 });
    snapWord(lx, 'mcp', MX - wm / 2, 500, 250, t, 9.36, { col: PALE, w: 700 });
    MARKS.forEach((k, i) => { const dt = t - k.T; if (dt <= -0.02) return;
      const pos = d => { const e = expoOut(seg(d, 0, 0.55)), sp = spring(d, 7, 12); return [lerp(MX, k.x, e), lerp(380, k.y, e) - Math.sin(e * Math.PI) * 40, 0.08 + 0.92 * sp]; };
      const bob = Math.sin(t * 1.2 + i * 2.1) * 4 * seg(dt, 0.5, 1.2), tick = pph >= 0 && pph < 0.12 ? 1 + 0.08 * Math.sin(pph / 0.12 * Math.PI) : 1;
      if (dt < 0.6) for (let q = 5; q >= 1; q--) { const d = dt - q * 0.03; if (d < 0) continue; const [x, y, s] = pos(d); drawMark(lx, i, x, y, s, 0.14, 3 + q); }
      const [x, y, s] = pos(Math.max(0, dt)); drawMark(lx, i, x, y + bob, s * tick, seg(dt, -0.02, 0.06), (1 - seg(dt, 0, 0.3)) * 6);
      k.px = x; k.py = y + bob; });
    const LX = 84;
    label(lx, 'a new app', LX, 78, t, 1.64, { solid: false, strike: seg(t, 1.94, 2.2), out: T_DROP - 0.05 });
    label(lx, 'the ai you already use', LX, 130, t, 3.9, { solid: true, spark: seg(t, 3.95, 4.15), dot: true, out: T_DROP - 0.05 });
    label(lx, 'raw footage', LX, 78, t, T_DROP, { solid: false, strike: seg(t, 17.15, 17.4) });
    label(lx, 'finished video', LX, 130, t, 17.4, { solid: true, spark: seg(t, 17.45, 17.65), dot: true });
    const BW = 72, BY = 262;
    typed(lx, 'learn nothing', LX, BY, BW, t, 0.66, { cps: 24, out: 2.7 }); typed(lx, 'i live inside', LX, BY, BW, t, 2.7, { cps: 24, out: MARKS[0].T });
    snapWord(lx, 'antigravity', LX, BY, BW, t, MARKS[0].T, { out: MARKS[1].T }); snapWord(lx, 'claude', LX, BY, BW, t, MARKS[1].T, { out: MARKS[2].T });
    snapWord(lx, 'gemini', LX, BY, BW, t, MARKS[2].T, { out: T_CON }); snapWord(lx, 'connect', LX, BY, BW, t, T_CON, { out: 9.36 }); snapWord(lx, 'my mcp', LX, BY, BW, t, 9.36, { out: 10.82 });
    snapWord(lx, 'real tools', LX, BY, BW, t, 10.82, { out: T_DROP }); snapWord(lx, 'footage in', LX, BY, BW, t, T_DROP, { out: 14.62 }); snapWord(lx, 'just ask', LX, BY, BW, t, 14.62, { out: T_POP }); snapWord(lx, 'video out', LX, BY, BW, t, T_POP);
    // ask for the edit in plain words: a prompt box types itself, then sends
    if (t >= 14.62 && t < T_POP + 0.1) { const d = t - 14.62, snd = seg(t, 16.75, 17.0), msg = 'make this a punchy reel with captions', n = Math.min(msg.length, Math.floor(d * 22));
      lx.save(); lx.translate(LX + snd * snd * 520, 326 + snd * 60); lx.scale(1 - snd * 0.8, 1 - snd * 0.8); lx.globalAlpha = 1 - snd * snd; const pw = d < 0.05 ? 200 : 500;
      lx.fillStyle = '#FFFFFF'; rr(lx, 0, 0, pw, 62, 16); lx.fill(); lx.strokeStyle = BLACK; lx.lineWidth = 3.5; lx.stroke();
      lx.font = '600 23px "Inter Tight"'; lx.fillStyle = BLACK; lx.textAlign = 'left'; lx.textBaseline = 'middle'; const tx = msg.slice(0, n); lx.fillText(tx, 20, 32);
      if (n < msg.length || Math.floor(d / 0.2) % 2) lx.fillRect(22 + lx.measureText(tx).width, 19, 3, 26);
      const hot = n >= msg.length; lx.fillStyle = hot ? LIME : '#E9E9E9'; rr(lx, pw - 52, 10, 42, 42, 11); lx.fill(); lx.stroke(); lx.fillStyle = BLACK; lx.beginPath(); lx.moveTo(pw - 39, 40); lx.lineTo(pw - 31, 20); lx.lineTo(pw - 23, 40); lx.lineTo(pw - 31, 35); lx.fill(); lx.restore();
      label(lx, 'plain words', LX, 400, t, 16.08, { solid: true, size: 22, dot: true, out: 16.9 }); }
    if (t >= T_CON) { const f = t < 10.8 ? seg(t, T_CON, 9.6) * 12 + 0.01 : t < T_DROP ? 6 + Math.floor((t - 10.8) / 0.27) : t < P0 ? seg(t, T_HIT, T_LAND) * 12 + 0.01 : pph >= 0 ? pph * 12 + 1 : 12;
      pixBar(lx, LX + 2, 292, 12, Math.min(12, f)); }
    o.save(); o.setTransform(1, 0, 0, 1, 0, 0); o.drawImage(layer, 0, 0); o.restore();

    // ---------- in front: pixel cables into the halo's MCP port, pulses, the footage drop
    const cables = pass => { if (t >= T_CON) MARKS.forEach((k, i) => { const t0 = T_CON + i * 0.2, pr = cubicOut(seg(t, t0, t0 + 0.5)); if (pr <= 0) return;
      const a = [k.px + (ports[i][0] - k.px) * 0.0, k.py], b = ports[i], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      const a2 = i === 1 ? [a[0] - 54, a[1] + 26] : [a[0] + dx / L * 58, a[1] + dy / L * 58 + (i === 0 ? -6 : 14)], c = [(a2[0] + b[0]) / 2 + (i === 1 ? -50 : 0), (a2[1] + b[1]) / 2 + (i === 1 ? -10 : 58)];
      const N = Math.round(L / 11), nd = Math.floor(pr * N);
      if (pass) { if (pr >= 1) { o.fillStyle = BLACK; o.fillRect(b[0] - 8, b[1] - 8, 16, 16); o.fillStyle = LIME; o.fillRect(b[0] - 4, b[1] - 4, 8, 8);
        const fl = t - (t0 + 0.5); if (fl < 0.4) { const st = Math.floor(fl / 0.08); o.strokeStyle = st % 2 ? BLACK : '#B9D93A'; o.lineWidth = 4; const r = 14 + st * 9; o.strokeRect(b[0] - r, b[1] - r, r * 2, r * 2); } } return; }
      o.fillStyle = BLACK; for (let j = 0; j <= nd; j++) { const [x, y] = bez(a2, c, b, j / N); o.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6); }
      if (pr < 1) { const [x, y] = bez(a2, c, b, nd / N); o.fillRect(x - 8, y - 8, 16, 16); }
      // pulses: lime packets run mark -> port (gentle stream before the beat section, then one clean pulse per cycle)
      const run = u => { if (u <= 0 || u >= 1) return; for (let q = 0; q < 3; q++) { const uu = u - q * 0.06; if (uu <= 0) continue; const [x, y] = bez(a2, c, b, Math.round(uu * N) / N), r = 8 - q * 2; o.fillStyle = BLACK; o.fillRect(x - r - 2, y - r - 2, r * 2 + 4, r * 2 + 4); o.fillStyle = LIME; o.fillRect(x - r, y - r, r * 2, r * 2); } };
      if (pr >= 1 && t < T_POP) run(((t - t0) * 0.9 + i * 0.3) % 1.25);
      if (pph >= 0) run((pph - i * 0.03) / 0.35);
    }); };
    cables(0);
    // your AI gets a set of real editing tools: pixel tool tiles run up from the MCP port and snap in under each mark
    for (let j = 0; j < 6; j++) { const i = j % 3, k = MARKS[i], t0 = 10.9 + j * 0.24, p = seg(t, t0, t0 + 0.4); if (p <= 0) continue; const e = cubicOut(p), d = t - t0 - 0.4;
      const tx = k.px + (j < 3 ? -20 : 20), ty = k.py + 104, x = lerp(ports[i][0], tx, e), y = lerp(ports[i][1], ty, e) - Math.sin(e * Math.PI) * 30, sc = (0.4 + 0.6 * e) * (1 + (d > 0 ? ring(d, 9, 26) * 0.5 : 0));
      o.save(); o.translate(x, y); o.scale(sc, sc); o.fillStyle = d > 0 && d < 0.07 ? LIME : '#FFFFFF'; o.fillRect(-16, -16, 32, 32); o.strokeStyle = BLACK; o.lineWidth = 3; o.strokeRect(-16, -16, 32, 32); o.fillStyle = BLACK;
      if (j === 0) { o.fillRect(-9, -9, 6, 6); o.fillRect(-9, 3, 6, 6); o.fillRect(-3, -3, 4, 6); o.fillRect(1, -7, 4, 4); o.fillRect(5, -10, 4, 4); o.fillRect(1, 3, 4, 4); o.fillRect(5, 6, 4, 4); }           // cut
      else if (j === 1) { o.fillRect(-9, -9, 18, 5); o.fillRect(-3, -9, 6, 18); }                                                                                                             // captions
      else if (j === 2) { o.fillRect(-6, -9, 12, 4); o.fillRect(2, -9, 4, 14); o.fillRect(-6, -9, 4, 16); o.fillRect(-10, 3, 8, 6); o.fillRect(-2, 1, 8, 6); }                                // music
      else if (j === 3) { o.fillRect(-10, -10, 8, 4); o.fillRect(-10, -10, 4, 8); o.fillRect(2, 6, 8, 4); o.fillRect(6, 2, 4, 8); o.fillRect(-4, -4, 8, 8); }                                // reframe
      else if (j === 4) { o.beginPath(); o.arc(0, 0, 10, Math.PI / 2, Math.PI * 1.5); o.fill(); o.lineWidth = 3; o.beginPath(); o.arc(0, 0, 9, 0, 7); o.stroke(); }                           // grade
      else { for (let q = 0; q < 5; q++) { const h2 = [6, 14, 20, 10, 16][q]; o.fillRect(-10 + q * 4.4, -h2 / 2, 3, h2); } }                                                                    // sound
      o.restore(); if (d > 0 && d < 0.2) { const st = Math.floor(d / 0.05), r = 20 + st * 6; o.strokeStyle = st % 2 ? BLACK : '#B9D93A'; o.lineWidth = 3; o.strokeRect(tx - r, ty - r, r * 2, r * 2); } }
    // handoff to the architecture act: one horizontal pixel "studio line" runs right out of the MCP port
    if (t >= T_END) { const g = expoOut(seg(t, T_END, T_END + 0.6)), x0 = ports[2][0] + 14, x1 = lerp(x0, 1520, g); o.fillStyle = BLACK; for (let x = x0; x < x1; x += 14) o.fillRect(x - 4, ports[2][1] - 4, 8, 8);
      o.fillRect(x1 - 9, ports[2][1] - 9, 18, 18); o.fillStyle = LIME; o.fillRect(x1 - 4, ports[2][1] - 4, 8, 8); }
    // ---------- subject: Moovi + the finished reel, one hard cast shadow
    const s = subjBegin();
    const direct = smooth(seg(t, T_LAND, T_LAND + 0.45));
    const look = key(t, [[0, [0, 0]], [0.7, [-0.5, 0]], [1.1, [0.5, 0]], [1.5, [-0.4, 0]], [2.0, [0, 0]], [3.1, [0, 0.3]], [3.7, [0, 0.7]], [4.4, [0, 0]], [5.4, [0, 0]], [5.8, [-0.9, 0]], [6.3, [-0.7, 0.1]], [6.6, [0.2, 0.9]], [7.0, [0.3, 0.9]], [7.3, [0.9, 0.7]], [8.1, [0.5, 0.4]], [8.7, [-0.6, 0.3]], [9.1, [0.3, 0.9]], [9.5, [0, 0.8]], [10.2, [0, 0]],
      [11.0, [-0.8, -0.1]], [11.6, [0.2, 0.9]], [12.2, [0.9, 0.6]], [12.8, [0, 0]], [13.5, [0, 0]], [13.9, [0, 1]], [T_HIT, [0, 0.2]], [14.8, [-0.9, 0.5]], [16.3, [-0.9, 0.4]], [16.9, [0, 0]], [17.3, [0, -0.2]], [17.8, [0.7, 0.6]], [18.2, [0.95, 0]], [19.2, [0.95, 0.1]], [19.8, [1, 0.3]]]);
    const wave = smooth(seg(t, 0.3, 0.6)) * (1 - smooth(seg(t, 1.6, 2.0))) * 0.8 + smooth(seg(t, 10.2, 10.6)) * (1 - smooth(seg(t, 12.4, 12.8))) * 0.6;
    const turn = 0.22 * Math.sin((t - 0.6) * 9) * seg(t, 0.6, 0.8) * (1 - seg(t, 1.6, 2.0));
    const think = smooth(seg(t, T_HIT, T_HIT + 0.25)) * (1 - smooth(seg(t, T_POP - 0.1, T_POP + 0.25))) + smooth(seg(t, 9.3, 9.5)) * (1 - smooth(seg(t, 10.0, 10.4))) * 0.7;
    const cv = m.render(t, { direct, look, think, hop, shadow: 0, squint: 0.25 * think, celebrate: 0, wave, turn });
    drawMoovi(s, cv, MX, FLOOR, S, { sx, sy });
    if (t >= T_POP) { const p = seg(t, T_POP, T_LAND), e = p; // ballistic arc out of his body, lands upright
      const x = lerp(MX + 40, RX, e), y = lerp(FLOOR - 0.25 * S, FLOOR, e) - 4 * 150 * e * (1 - e) + (lerp(0, 0, e)), dl = t - T_LAND;
      const sc = lerp(0.12, 1, cubicOut(seg(p, 0, 0.7))), rot = lerp(-0.5, 0.02, cubicOut(p)) + ring(dl, 5, 17) * 0.05;
      const sq = 1 - (dl > 0 ? 0.14 * Math.exp(-6 * dl) * Math.cos(17 * dl) : 0) + (pph >= 0.45 && pph < 0.6 ? 0.02 * Math.sin((pph - 0.45) / 0.15 * Math.PI) : 0);
      if (p < 1) for (let q = 4; q >= 1; q--) { const e2 = seg(t - q * 0.025, T_POP, T_LAND); if (e2 <= 0) continue; s.globalAlpha = 0.14; drawReel(s, t, lerp(MX + 40, RX, e2), lerp(FLOOR - 0.25 * S, FLOOR, e2) - 600 * e2 * (1 - e2), lerp(-0.5, 0.02, cubicOut(e2)), lerp(0.12, 1, cubicOut(seg(e2, 0, 0.7))), 1); }
      s.globalAlpha = 1; drawReel(s, t, x, y, rot, sc, sq); }
    subjEnd(o, FLOOR);

    cables(1);
    if (t >= 9.36) { const lw = smooth(seg(t, T_END + 0.1, 19.7)) * 520; o.save(); o.translate(lw, lw * 0.03); const fl = pph >= 0.33 && pph < 0.5; label(o, 'mcp', hx - hr - 124, hy - hr - 14, t, 9.36, { solid: true, size: 21 });
      if (fl) { const st = Math.floor((pph - 0.33) / 0.035); o.strokeStyle = st % 2 ? '#B9D93A' : BLACK; o.lineWidth = 4; const r = hr + 6 + st * 7; o.strokeRect(hx - r, hy - r * 0.62, r * 2, r * 1.24); }
      o.restore(); }
    // footage card: drops under gravity into him, absorbed on the squash
    if (t >= T_DROP && t < T_HIT + 0.16) { const card = (tt, a) => { const p = seg(tt, T_DROP, T_HIT), ab = seg(tt, T_HIT, T_HIT + 0.16), y = lerp(-150, FLOOR - 0.27 * S, p * p), sc = lerp(1, 0.25, ab);
        o.save(); o.translate(MX + 14 - 14 * p, y); o.rotate(lerp(-0.22, 0.06, p)); o.scale(sc, sc * lerp(1, 0.6, ab)); o.globalAlpha = a * (1 - ab * ab);
        o.fillStyle = BLACK; rr(o, -56, -96, 112, 192, 12); o.fill(); cover(o, raw, -51, -91, 102, 182, 8); o.restore(); };
      for (let q = 4; q >= 1; q--) if (t - q * 0.022 > T_DROP) card(t - q * 0.022, 0.15); card(t, 1); }
    if (t >= T_HIT && t < T_HIT + 0.35) { const d = t - T_HIT, st = Math.floor(d / 0.045); o.fillStyle = BLACK; for (let q = 0; q < 10; q++) { const an = q / 10 * 6.283 + 0.3, r = 110 + st * 16 + hash(q) * 20, zs = Math.max(4, 16 - st * 1.6); o.fillRect(MX + Math.cos(an) * r * 1.1 - zs / 2, FLOOR - 0.27 * S + Math.sin(an) * r * 0.8 - zs / 2, zs, zs); } }
    o.restore(); finish(o);
  } };
