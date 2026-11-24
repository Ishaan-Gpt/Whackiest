// shared helpers for acts e_inside / g_close (studio style)
export const W = 1280, H = 720, INK = '#0E1A2B', IRIS = '#5B7CFA', ICE = '#CFE6F7', CORAL = '#F2553F';
export const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => cl((t - a) / (b - a));
export const eo = x => 1 - Math.pow(1 - x, 4);
export const expo = x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
export const io = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const back = x => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
export const spring = (x, k = 6, w = 11) => x <= 0 ? 0 : 1 - Math.exp(-k * x) * Math.cos(w * x);
export const ring = (x, k = 4, w = 10) => x <= 0 ? 0 : Math.exp(-k * x) * Math.sin(w * x); // decaying wobble impulse
export const bump = (t, a, b) => Math.sin(Math.PI * seg(t, a, b));
export const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
export const TEX = '/hackathon/whackiest-2026/out/v3/tex/';

export function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.roundRect(x, y, w, h, r); }
export const LIME = '#D9F56B', PALE = '#E4E4E4', K1 = .78, K2 = .30;
// pure white world; the only depth cue is one hard cast shadow (see Shadow)
export function studio(c) { c.fillStyle = '#FDFDFD'; c.fillRect(0, 0, W, H); }
// hard key light: silhouettes are drawn sheared down-right onto one layer, then laid once in flat grey
export class Shadow {
  constructor() { this.cv = document.createElement('canvas'); this.cv.width = W; this.cv.height = H; this.c = this.cv.getContext('2d'); }
  begin() { const c = this.c; c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, W, H); }
  // fn(c) draws opaque shapes in world space; gy = the ground line they stand over
  cast(gy, fn, pre) { const c = this.c; c.save(); if (pre) pre(c); c.transform(1, 0, -K1, -K2, K1 * gy, gy * (1 + K2)); c.fillStyle = '#000'; fn(c); c.restore(); }
  lay(dst, a = .15, blur = 2.2) { const c = this.c; c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = '#000'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
    dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0); dst.globalAlpha = a; dst.filter = `blur(${blur}px)`; dst.drawImage(this.cv, 0, 0); dst.restore(); }
}
export const PX = (w, s) => `${w} ${s}px "Silkscreen"`;
// typed pixel text with a block cursor; p = 0..1 typing progress. returns full width
export function typed(c, str, x, y, size, p, t, o = {}) {
  c.save(); c.font = PX(o.w ?? 400, size); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; const n = Math.floor(cl(p) * str.length + 1e-6), sub = str.slice(0, n), w = c.measureText(sub).width;
  c.fillStyle = o.col ?? '#000'; c.fillText(sub, x, y); if (p > 0 && (p < 1 || (o.cur && Math.floor(t * 2.5) % 2 === 0))) c.fillRect(x + w + size * .08, y - size * .72, size * .5, size * .74);
  const full = c.measureText(str).width; c.restore(); return full;
}
// lime highlighter label. o.strike = old thing on paler lime, struck through; p = snap-in progress (2-frame pixel glitch)
export function label(c, str, x, y, p, t, o = {}) {
  if (p <= 0) return 0; const size = o.size ?? 22; c.save(); c.font = PX(400, size); const w = c.measureText(str).width + 28, h = size + 18; const gl = p < 1 ? (p < .5 ? 10 : -4) : 0;
  c.fillStyle = o.strike ? '#EAF8AE' : LIME; c.fillRect(x + gl, y, w, h); if (p < 1) { c.fillStyle = '#000'; c.fillRect(x + gl + w * .2, y + h * .3, w * .5, 4); }
  c.fillStyle = o.strike ? 'rgba(0,0,0,.55)' : '#000'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(str, x + 14 + gl, y + h / 2 + 1);
  if (o.strike) { const sp = cl(o.sp ?? 1); c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(x + 10, y + h / 2, (w - 20) * sp, 2); }
  if (o.spark && p >= 1) { const k = cl(o.spark); c.strokeStyle = '#B9DB2E'; c.lineWidth = 3; c.lineCap = 'butt'; for (const a of [-.15, -.75, -1.35]) { c.beginPath(); c.moveTo(x + w + 6 + Math.cos(a) * 6, y + 2 + Math.sin(a) * 6); c.lineTo(x + w + 6 + Math.cos(a) * (6 + 11 * k), y + 2 + Math.sin(a) * (6 + 11 * k)); c.stroke(); } }
  c.restore(); return w;
}
export function pixbar(c, x, y, n, p, s = 16) { c.save(); for (let i = 0; i < n; i++) { const on = i < Math.floor(cl(p) * n + 1e-6); if (on) { c.fillStyle = '#000'; c.fillRect(x + i * (s + 4), y, s, s); } else { c.strokeStyle = '#000'; c.lineWidth = 2; c.strokeRect(x + i * (s + 4) + 1, y + 1, s - 2, s - 2); } } c.restore(); }
export function giant(c, str, x, y, size, p = 1) { if (p <= 0) return; c.save(); c.font = PX(700, size); c.fillStyle = PALE; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; const gl = p < 1 ? (p < .5 ? 14 : -6) : 0; c.fillText(str, x + gl, y); if (p < 1) { c.fillStyle = '#FDFDFD'; c.fillRect(x - 20, y - size * (p < .5 ? .5 : .3), 4000, size * .12); } c.restore(); }
// outlined flat object (white, black 2px line): the look of every prop in this world
export function slab(c, x, y, w, h, r, fill = '#fff', lw = 2.5) { rr(c, x, y, w, h, r); c.fillStyle = fill; c.fill(); c.strokeStyle = '#000'; c.lineWidth = lw; c.stroke(); }
// director's chair (black wood + canvas). cx centre, sy = seat top, w seat width; back=true draws parts behind the sitter
export function chair(c, cx, sy, w, gy, part) {
  c.save(); c.strokeStyle = '#111'; c.fillStyle = '#111'; c.lineCap = 'round'; const hw = w / 2;
  if (part === 'back') { c.lineWidth = w * .045; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * hw, sy + 6); c.lineTo(cx + s * hw, sy - w * .78); c.stroke(); } c.fillStyle = '#1b1b1b'; c.fillRect(cx - hw, sy - w * .74, w, w * .3); }
  else { c.fillRect(cx - hw - 4, sy, w + 8, w * .075); c.lineWidth = w * .042; c.beginPath(); c.moveTo(cx - hw + 6, sy + w * .07); c.lineTo(cx + hw + 14, gy); c.moveTo(cx + hw - 6, sy + w * .07); c.lineTo(cx - hw - 14, gy); c.stroke();
    c.lineWidth = w * .04; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * (hw + 2), sy + 4); c.lineTo(cx + s * (hw + 2), sy - w * .26); c.stroke(); c.fillRect(cx + s * (hw + 2) - w * .09 + (s < 0 ? -w * .02 : w * .02), sy - w * .3, w * .18, w * .05); }
    c.lineWidth = w * .03; c.beginPath(); c.moveTo(cx - hw - 26, gy); c.lineTo(cx - hw - 2, gy); c.moveTo(cx + hw + 2, gy); c.lineTo(cx + hw + 26, gy); c.stroke(); }
  c.restore();
}
export function floorShadow(c, x, y, rx, a = .12) { c.save(); c.translate(x, y); c.scale(1, .16); const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(14,26,43,${a})`); g.addColorStop(1, 'rgba(14,26,43,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, 7); c.fill(); c.restore(); }
// glossy white card with soft shadow
export function card(c, x, y, w, h, r, o = {}) {
  c.save(); c.shadowColor = `rgba(14,26,43,${o.sh ?? .16})`; c.shadowBlur = o.blur ?? 26; c.shadowOffsetY = o.dy ?? 12; rr(c, x, y, w, h, r); c.fillStyle = o.fill ?? '#fff'; c.fill(); c.restore();
  if (o.gloss !== false) { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(14,26,43,.045)'); rr(c, x, y, w, h, r); c.fillStyle = g; c.fill(); }
  rr(c, x + .5, y + .5, w - 1, h - 1, r); c.strokeStyle = o.stroke ?? 'rgba(14,26,43,.07)'; c.lineWidth = 1; c.stroke();
}
export function cover(c, img, x, y, w, h, r, z = 1, ax = .5, ay = .5) {
  c.save(); rr(c, x, y, w, h, r); c.clip(); const s = Math.max(w / img.width, h / img.height) * z, iw = img.width * s, ih = img.height * s;
  c.drawImage(img, x + (w - iw) * ax, y + (h - ih) * ay, iw, ih); c.restore();
}
// Moovi: cx = centre x, by = bottom of his square canvas, s = size
export function moovi(c, m, t, pose, cx, by, s, flip = false, blur = 0) {
  const cv = m.render(t, pose); c.save(); if (blur > .3) c.filter = `blur(${blur.toFixed(1)}px)`; c.translate(cx, by); if (flip) c.scale(-1, 1); c.drawImage(cv, -s / 2, -s, s, s); c.restore();
}
export function cursor(c, x, y, s = 1, press = 0, label = 'AI') {
  c.save(); c.translate(x, y); c.scale(s * (1 - .1 * press), s * (1 - .1 * press)); c.shadowColor = 'rgba(14,26,43,.3)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 26); c.lineTo(7, 20); c.lineTo(12, 31); c.lineTo(17, 29); c.lineTo(12, 18); c.lineTo(21, 18); c.closePath(); c.fillStyle = INK; c.fill(); c.shadowColor = 'transparent'; c.strokeStyle = '#fff'; c.lineWidth = 2; c.lineJoin = 'round'; c.stroke();
  if (label) { c.font = '700 13px "Inter Tight"'; const w = c.measureText(label).width + 16; rr(c, 20, 30, w, 22, 8); c.fillStyle = INK; c.fill(); c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(label, 28, 41.5); }
  c.restore();
}
export function sparkle(c, x, y, r, col = INK) { c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, q = i % 2 ? r * .32 : r; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); } c.closePath(); c.fill(); c.restore(); }
// tiny visual preview of a piece of taste. kind: 0 caption look, 1 camera move, 2 sound, 3 font, 4 grade. col = ink colour
export function preview(c, kind, v, x, y, w, h, ph = 0, col = '#000') {
  const u = Math.min(w, h); c.save(); c.translate(x + w / 2, y + h / 2); c.lineCap = 'butt'; c.lineJoin = 'miter'; const lw = Math.max(1, u * .06);
  if (kind === 0) { const bw = w * .34, bh = u * .24, g = w * .05, st = v % 3; c.fillStyle = col; c.fillRect(-bw - g / 2, -bh / 2, bw, bh);
    const ww = bw * (.82 + .18 * Math.sin(ph)), yy = -bh / 2 - (st === 1 ? bh * .15 : 0), hh = bh * (st === 1 ? 1.3 : 1); c.fillStyle = st === 2 ? '#fff' : LIME; c.fillRect(g / 2, yy, ww, hh); c.strokeStyle = col; c.lineWidth = lw * .7; c.strokeRect(g / 2, yy, ww, hh);
  } else if (kind === 1) { const a = w * .36, b = h * .3, k = u * .14, z = .6 + .18 * Math.sin(ph); c.strokeStyle = col; c.lineWidth = lw;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { c.beginPath(); c.moveTo(sx * a, sy * (b - k)); c.lineTo(sx * a, sy * b); c.lineTo(sx * (a - k), sy * b); c.stroke(); }
    if (v % 2) { c.fillStyle = LIME; c.fillRect(-a * z, -b * z, a * 2 * z, b * 2 * z); c.strokeRect(-a * z, -b * z, a * 2 * z, b * 2 * z); } else { const e = a * (.1 + .5 * z); c.beginPath(); c.moveTo(-a * .55, 0); c.lineTo(e, 0); c.moveTo(e - a * .22, -b * .36); c.lineTo(e, 0); c.lineTo(e - a * .22, b * .36); c.stroke(); }
  } else if (kind === 2) { const n = 7, bw = w * .075; for (let i = 0; i < n; i++) { const hh = h * (.12 + .52 * Math.abs(Math.sin(i * 1.3 + v * 2.1 + ph * .9)) * (1 - Math.abs(i - 3) / 5)); c.fillStyle = (i + v) % 4 === 0 ? '#B9DB2E' : col; c.fillRect((i - 3) * bw * 1.7 - bw / 2, -hh / 2, bw, hh); }
  } else if (kind === 3) { const f = [`800 ${u * .56}px "Inter Tight"`, `italic ${u * .66}px "Instrument Serif"`, `700 ${u * .44}px "Silkscreen"`][v % 3]; c.font = f; c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Aa', 0, u * .03);
  } else { const n = 4, bw = w * .72 / n, sh = [['#111', '#555', '#AAA', LIME], ['#222', '#888', '#CFCFCF', '#F2F2F2'], [LIME, '#B9DB2E', '#666', '#111']][v % 3]; for (let i = 0; i < n; i++) { c.fillStyle = sh[i]; c.fillRect(-w * .36 + i * bw, -h * .2, bw + .5, h * .4); } c.strokeStyle = col; c.lineWidth = lw * .7; c.strokeRect(-w * .36, -h * .2, w * .72, h * .4); }
  c.restore();
}
