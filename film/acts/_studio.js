// Shared STUDIO look + helpers for acts b_noeditor and d_anyai (seamless white cove, soft shadow, camera, easing).
export const W = 1280, H = 720, FLOOR = 606;
export const INK = '#0E1A2B', IRIS = '#5B7CFA', ICE = '#CFE6F7', WHITE = '#F7FAFD';
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const lerp = (a, b, x) => a + (b - a) * x;
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const expoOut = x => { x = clamp(x); return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); };
export const cubicIn = x => { x = clamp(x); return x * x * x; };
export const cubicOut = x => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
export const backOut = (x, s = 1.6) => { x = clamp(x) - 1; return 1 + (s + 1) * x * x * x + s * x * x; };
/** damped spring 0 -> 1 with overshoot; dt = seconds since release */
export const spring = (dt, k = 7, w = 13) => dt <= 0 ? 0 : 1 - Math.exp(-k * dt) * Math.cos(w * dt);
/** damped impulse (starts at 0, kicks, rings out) */
export const ring = (dt, k = 6, w = 18) => dt <= 0 ? 0 : Math.exp(-k * dt) * Math.sin(w * dt);
export const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
/** smooth keyframes: pts = [[t, v], ...] (v number or array) */
export function key(t, pts) {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (t < pts[i][0]) {
    const x = smooth((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0])), a = pts[i - 1][1], b = pts[i][1];
    return Array.isArray(a) ? a.map((v, j) => lerp(v, b[j], x)) : lerp(a, b, x);
  }
  return pts[pts.length - 1][1];
}
export function rr(o, x, y, w, h, r) { o.beginPath(); o.roundRect(x, y, w, h, r); }
export const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('img ' + src)); i.src = src; });
/** load a single-colour svg and tint it; fill may be a colour or (ctx,size)=>gradient */
export async function tintIcon(src, size, fill) {
  const im = await loadImg(src), c = mk(size, size), x = c.getContext('2d');
  x.drawImage(im, 0, 0, size, size); x.globalCompositeOperation = 'source-in';
  x.fillStyle = typeof fill === 'function' ? fill(x, size) : fill; x.fillRect(0, 0, size, size); return c;
}
export function blurred(src, px) { const c = mk(src.width, src.height), x = c.getContext('2d'); x.filter = `blur(${px}px)`; x.drawImage(src, 0, 0); return c; }

export const LIME = '#D9F56B', LIME_P = '#EDF9BE', PALE = '#E2E2E2', BLACK = '#111111', PAPER = '#FEFEFD';
export const makeCove = () => {};
/** camera: pure white world; z zoom about (cx, cy). Leaves the ctx transformed for the scene. Call o.restore() after. */
export function beginCam(o, z, cx, cy) {
  o.setTransform(1, 0, 0, 1, 0, 0); o.fillStyle = PAPER; o.fillRect(0, 0, W, H);
  o.save(); o.translate(W / 2, H / 2); o.scale(z, z); o.translate(-cx, -cy);
}
// ---- subject layer: everything that stands on the floor and throws the ONE hard cast shadow (chair, Moovi, props)
const SS = 1.25; let subj, sjx, shad, shx;
export function subjBegin() {
  if (!subj) { subj = mk(W * SS, H * SS); sjx = subj.getContext('2d'); shad = mk(W * SS, H * SS); shx = shad.getContext('2d'); }
  sjx.setTransform(1, 0, 0, 1, 0, 0); sjx.globalAlpha = 1; sjx.filter = 'none'; sjx.globalCompositeOperation = 'source-over'; sjx.clearRect(0, 0, subj.width, subj.height);
  sjx.setTransform(SS, 0, 0, SS, 0, 0); return sjx;
}
/** draw the hard key-light shadow (silhouette sheared down-right about the floor line) and then the subject itself */
export function subjEnd(o, floor = FLOOR, { shear = 0.85, drop = 0.26, a = 0.2 } = {}) {
  shx.setTransform(1, 0, 0, 1, 0, 0); shx.globalCompositeOperation = 'source-over'; shx.clearRect(0, 0, shad.width, shad.height);
  shx.drawImage(subj, 0, 0); shx.globalCompositeOperation = 'source-in'; shx.fillStyle = '#000'; shx.fillRect(0, 0, shad.width, shad.height);
  o.save(); o.transform(1, 0, -shear, -drop, shear * floor, floor + drop * floor); o.scale(1 / SS, 1 / SS);
  o.globalAlpha = a; o.filter = 'blur(2.2px)'; o.drawImage(shad, 0, 0); o.restore();
  o.save(); o.scale(1 / SS, 1 / SS); o.drawImage(subj, 0, 0); o.restore();
}
// ---- pixel type system (Silkscreen): typed words with a block cursor, 2-frame glitch snaps, lime labels, pixel bars
export const loadPixelFont = () => Promise.all(['400 20px "Silkscreen"', '700 20px "Silkscreen"'].map(f => document.fonts.load(f)));
const pf = (size, w = 400) => `${w} ${size}px "Silkscreen"`;
/** typed word, left aligned at (x, baseline y). t0 = start. out = time it snaps away (optional). */
export function typed(o, str, x, y, size, t, t0, { cps = 22, col = BLACK, w = 400, cursor = true, out = 1e9 } = {}) {
  const dt = t - t0; if (dt < 0 || t >= out) return 0; const n = Math.min(str.length, Math.floor(dt * cps) + 1), s = str.slice(0, n);
  o.save(); o.font = pf(size, w); o.textAlign = 'left'; o.textBaseline = 'alphabetic'; o.fillStyle = col; o.fillText(s, x, y);
  const tw = o.measureText(s).width, done = dt - str.length / cps;
  if (cursor && (done < 0 || (done < 0.9 && Math.floor(done / 0.15) % 2 === 0))) o.fillRect(x + tw + size * 0.08, y - size * 0.72, size * 0.5, size * 0.74);
  o.restore(); return tw;
}
/** word that snaps in with a 2-frame pixel glitch (slices offset, then lands) */
export function snapWord(o, str, x, y, size, t, t0, { col = BLACK, w = 400, out = 1e9, align = 'left' } = {}) {
  const dt = t - t0; if (dt < 0 || t >= out) return; const od = out - t;
  o.save(); o.font = pf(size, w); o.textAlign = align; o.textBaseline = 'alphabetic'; o.fillStyle = col;
  const g = dt < 0.04 ? 1 : dt < 0.085 ? 2 : od < 0.045 ? 2 : 0;
  if (!g) o.fillText(str, x, y);
  else { const tw = o.measureText(str).width, x0 = align === 'center' ? x - tw / 2 : x, bands = 5, bh = size * 1.1 / bands;
    for (let i = 0; i < bands; i++) { const off = (hash(i * 7 + g * 3 + str.length) - 0.5) * size * (g === 1 ? 1.1 : 0.4); if (g === 1 && hash(i + 31 + str.length) < 0.3) continue;
      o.save(); o.beginPath(); o.rect(x0 - size, y - size * 0.9 + i * bh, tw + size * 2, bh); o.clip(); o.fillText(str, x + off, y); o.restore(); } }
  o.restore();
}
/** highlighter label. strike = 0..1 draws the strike-through (old thing, pale lime); solid = new thing. Returns width. */
export function label(o, str, x, y, t, t0, { solid = true, strike = 0, size = 30, spark = 0, dot = false, out = 1e9 } = {}) {
  const dt = t - t0; if (dt < 0 || t >= out) return 0;
  o.save(); o.font = pf(size); const tw = o.measureText(str).width, padX = size * 0.62, h = size * 1.62, w = tw + padX * 2 + (dot ? size * 0.9 : 0);
  if (dt < 0.045) { o.fillStyle = BLACK; o.fillRect(x, y, w * 0.4, h); o.restore(); return w; }   // frame 1 of the snap: a black block
  const ww = dt < 0.09 ? w * 0.75 : w;
  o.fillStyle = solid ? LIME : LIME_P; o.fillRect(x, y, ww, h);
  o.save(); o.beginPath(); o.rect(x, y, ww, h); o.clip(); o.fillStyle = solid ? BLACK : 'rgba(17,17,17,0.62)'; o.textBaseline = 'middle'; o.textAlign = 'left';
  const tx = x + padX + (dot ? size * 0.9 : 0); if (dot) o.fillRect(x + padX, y + h / 2 - size * 0.22, size * 0.44, size * 0.44);
  o.fillText(str, tx, y + h / 2 + size * 0.04); o.restore();
  if (strike > 0) { o.fillStyle = 'rgba(17,17,17,0.8)'; o.fillRect(tx - 6, y + h / 2 - 1, (tw + 12) * clamp(strike), 2.5); }
  if (spark > 0) { o.strokeStyle = '#B9D93A'; o.lineWidth = 3; o.lineCap = 'butt'; const px = x + w + 8, py = y + h - 2, k = clamp(spark);
    [[-0.95, 1], [-0.45, 1.1], [0.05, 1]].forEach(([a, l]) => { const c = Math.cos(a), s = Math.sin(a); o.beginPath(); o.moveTo(px + c * 8, py + s * 8); o.lineTo(px + c * (8 + 13 * l * k), py + s * (8 + 13 * l * k)); o.stroke(); }); }
  o.restore(); return w;
}
/** pixel progress bar: n squares, `fill` of them black (fractional = last one blinking in) */
export function pixBar(o, x, y, n, fill, { s = 20, gap = 6, col = BLACK } = {}) {
  o.save(); o.fillStyle = col; o.strokeStyle = col; o.lineWidth = 2;
  for (let i = 0; i < n; i++) { const px = x + i * (s + gap); if (i < Math.floor(fill)) o.fillRect(px, y, s, s); else o.strokeRect(px + 1, y + 1, s - 2, s - 2); }
  o.restore();
}
/** blocky left -> right pixel wipe: erase cells of the given 2D context (destination-out). p 0..1 */
export function pixelWipe(x, p, cell = 40) {
  if (p <= 0) return; x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.filter = 'none'; x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
  if (p >= 1) x.fillRect(0, 0, W, H); else for (let c = 0; c * cell < W; c++) for (let r = 0; r * cell < H; r++) if (p * 1.3 > (c * cell) / W + hash(c * 57 + r * 131) * 0.3) x.fillRect(c * cell, r * cell, cell, cell);
  x.restore();
}
/** soft elliptical contact shadow */
export function shadow(o, x, y, rx, ry, a = 0.3, col = '40,62,104') {
  o.save(); o.translate(x, y); o.scale(1, ry / rx);
  const g = o.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.55, `rgba(${col},${a * 0.42})`); g.addColorStop(1, `rgba(${col},0)`);
  o.fillStyle = g; o.fillRect(-rx, -rx, rx * 2, rx * 2); o.restore();
}
/** Moovi anchored by his feet: (x, y) = point between his feet on the floor; size = render square in px.
 *  sx/sy squash about the feet, rot leans him about the feet. Returns halo centre in scene px. */
export const M_FEET = 0.91, M_HALO = 0.26, M_BODY = 0.66, M_UNIT = 0.32;
export function drawMoovi(o, cv, x, y, size, { sx = 1, sy = 1, rot = 0, alpha = 1 } = {}) {
  o.save(); o.translate(x, y); o.rotate(rot); o.scale(sx, sy); o.globalAlpha *= alpha;
  o.drawImage(cv, -size / 2, -size * M_FEET, size, size); o.restore();
}
/** cover-fit an image into a rounded rect */
export function cover(o, im, x, y, w, h, r) {
  const s = Math.max(w / im.width, h / im.height), sw = w / s, sh = h / s;
  o.save(); rr(o, x, y, w, h, r); o.clip(); o.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h); o.restore();
}
/** film grain-free finishing: a very light top sheen so the white never looks flat */
export function finish(o) { o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.filter = 'none'; o.globalCompositeOperation = 'source-over'; }
