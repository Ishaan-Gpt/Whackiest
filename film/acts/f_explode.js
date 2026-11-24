// ACT F: the exploded frame. One finished vertical frame pulls apart into six glass layers, each with the reason it exists.
import * as THREE from 'three';
import { MooviFilm } from '../moovi-film.js';

const TEX = '/hackathon/whackiest-2026/out/v3/tex/';
const W = 1.8, H = 3.2, GAP = 0.8, FLOOR = -1.86;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const io = x => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const outExpo = x => { x = clamp(x); return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); };
const spring = (x, k = 4.2, w = 6.5) => x <= 0 ? 0 : 1 - Math.exp(-k * x) * Math.cos(w * x);

// back → front
const LAYERS = [
  { key: 'footage', reason: 'your raw take', side: 1, row: 0 },
  { key: 'grade', reason: 'warm skin', side: 1, row: 1 },
  { key: 'camera', reason: 'push on the key word', side: 1, row: 2 },
  { key: 'caption', reason: 'inside the safe area, off the face', side: -1, row: 2 },
  { key: 'sound', reason: 'on the cut', side: -1, row: 1 },
  { key: 'music', reason: 'ducked under the voice', side: -1, row: 0 },
];
const HLT = [4.84, 5.84, 6.76, 8.06, 9.08, 9.72, 10.5];   // the footage, the grade, the camera move, the caption, the sound, the music                 // highlight tour: start, seconds per layer
const BACK0 = 13.3;                          // layers glide back together

let ctx, renderer, scene, camera, stack, mirror, comp, cctx, small, sctx, moovi;
let finMat, finSheen, items = [];

const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function glassBase(g, w, h, a = 0.028) {
  const gr = g.createLinearGradient(0, 0, w, h);
  gr.addColorStop(0, `rgba(220,236,255,${a * 1.8})`); gr.addColorStop(0.45, `rgba(200,225,255,${a * 0.5})`); gr.addColorStop(1, `rgba(190,215,255,${a * 1.2})`);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(235,245,255,0.55)'; g.lineWidth = 5; g.strokeRect(0, 0, w, h);      // inner rim, clipped by the rounded geometry
}
function layerCanvas(key, imgs) {
  const w = 540, h = 960, c = mk(w, h), g = c.getContext('2d');
  if (key === 'footage') { g.drawImage(imgs.raw, 0, 0, w, h); g.strokeStyle = 'rgba(235,245,255,0.5)'; g.lineWidth = 4; g.strokeRect(0, 0, w, h); return c; }
  if (key === 'grade') {
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, 'rgba(255,176,92,0.24)'); gr.addColorStop(0.55, 'rgba(255,138,84,0.12)'); gr.addColorStop(1, 'rgba(255,112,96,0.2)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,214,170,0.75)'; g.lineWidth = 5; g.strokeRect(0, 0, w, h);
    // a tone curve, the colourist's mark
    const x0 = 70, x1 = 470, y0 = 300, y1 = 60;
    g.strokeStyle = 'rgba(255,225,190,0.28)'; g.lineWidth = 1.5; g.setLineDash([4, 7]); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
    g.strokeStyle = 'rgba(255,236,210,0.95)'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0);
    g.bezierCurveTo(x0 + 150, y0 - 10, x1 - 190, y1 + 10, x1, y1); g.stroke();
    for (const [px, py] of [[x0, y0], [232, 205], [x1, y1]]) { g.fillStyle = '#fff3e2'; g.beginPath(); g.arc(px, py, 9, 0, 7); g.fill(); }
    return c;
  }
  glassBase(g, w, h);
  if (key === 'camera') {
    const rr = (x, y, ww, hh, r) => { g.beginPath(); g.roundRect(x, y, ww, hh, r); };
    g.strokeStyle = 'rgba(207,230,247,0.5)'; g.lineWidth = 3; g.setLineDash([10, 12]); rr(40, 70, 460, 820, 26); g.stroke(); g.setLineDash([]);
    const ix = 150, iy = 180, iw = 260, ih = 462;                                            // where the push lands
    g.strokeStyle = '#f7fafd'; g.lineWidth = 6; g.lineCap = 'round';
    for (const [cx, cy, sx, sy] of [[ix, iy, 1, 1], [ix + iw, iy, -1, 1], [ix, iy + ih, 1, -1], [ix + iw, iy + ih, -1, -1]]) {
      g.beginPath(); g.moveTo(cx + sx * 46, cy); g.lineTo(cx, cy); g.lineTo(cx, cy + sy * 46); g.stroke();
    }
    g.strokeStyle = 'rgba(207,230,247,0.45)'; g.lineWidth = 2;
    for (const [ax, ay, bx, by] of [[40, 70, ix, iy], [500, 70, ix + iw, iy], [40, 890, ix, iy + ih], [500, 890, ix + iw, iy + ih]]) { g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); }
    // motion arc with an arrowhead
    g.strokeStyle = '#8fa8ff'; g.lineWidth = 6; g.beginPath(); g.moveTo(92, 800); g.quadraticCurveTo(130, 520, 262, 420); g.stroke();
    g.fillStyle = '#8fa8ff'; g.beginPath(); g.moveTo(286, 402); g.lineTo(242, 400); g.lineTo(266, 438); g.closePath(); g.fill();
    g.fillStyle = '#f7fafd'; g.beginPath(); g.arc(92, 800, 9, 0, 7); g.fill();
    return c;
  }
  if (key === 'caption') {
    g.strokeStyle = 'rgba(207,230,247,0.42)'; g.lineWidth = 2.5; g.setLineDash([6, 10]); g.beginPath(); g.roundRect(54, 120, 432, 690, 22); g.stroke(); g.setLineDash([]);
    g.font = '800 104px "Inter Tight"'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
    const a = 'I ', b = 'only', wa = g.measureText(a).width, wb = g.measureText(b).width, x = (w - wa - wb) / 2, y = 716;
    g.strokeStyle = 'rgba(8,12,20,0.9)'; g.lineWidth = 16; g.strokeText(a, x, y); g.strokeText(b, x + wa, y);
    g.fillStyle = '#ffd23f'; g.fillText(a, x, y); g.fillStyle = '#ffffff'; g.fillText(b, x + wa, y);
    return c;
  }
  if (key === 'sound') {
    const cy = 500, n = 46;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), env = 0.25 + 0.75 * Math.pow(Math.sin(u * Math.PI), 0.7), cut = Math.exp(-Math.pow((u - 0.42) * 9, 2));
      const a = (18 + 150 * env * (0.25 + 0.75 * hash(i + 3)) + 150 * cut);
      g.fillStyle = cut > 0.3 ? '#ffffff' : 'rgba(143,168,255,0.95)';
      g.beginPath(); g.roundRect(44 + u * 446, cy - a / 2, 6, a, 3); g.fill();
    }
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2.5; g.setLineDash([5, 8]); g.beginPath(); g.moveTo(44 + 0.42 * 446 + 3, 330); g.lineTo(44 + 0.42 * 446 + 3, 670); g.stroke(); g.setLineDash([]);
    return c;
  }
  // music: one soft beat line that dips where the voice is
  const cy = 860; g.lineCap = 'round';
  g.strokeStyle = 'rgba(207,230,247,0.95)'; g.lineWidth = 5; g.beginPath();
  for (let x = 40; x <= 500; x += 4) { const u = (x - 40) / 460, duck = 1 - 0.72 * smooth((u - 0.2) / 0.16) * (1 - smooth((u - 0.72) / 0.16)); const y = cy - 44 * duck * Math.sin(u * Math.PI * 9); x === 40 ? g.moveTo(x, y) : g.lineTo(x, y); }
  g.stroke();
  for (let k = 0; k < 9; k++) { const u = (k + 0.5) / 9, duck = 1 - 0.72 * smooth((u - 0.2) / 0.16) * (1 - smooth((u - 0.72) / 0.16)); g.fillStyle = `rgba(247,250,253,${0.45 + 0.55 * duck})`; g.beginPath(); g.arc(40 + u * 460, cy - 44 * duck, 4 + 5 * duck, 0, 7); g.fill(); }
  return c;
}
function sheenCanvas() {
  const c = mk(256, 256), g = c.getContext('2d'); g.translate(128, 128); g.rotate(-0.5);
  const gr = g.createLinearGradient(-46, 0, 46, 0);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(-46, -300, 92, 600); return c;
}
const tex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

export default {
  dur: 17.7,
  async init(canvas) {
    ctx = canvas.getContext('2d');
    const [raw, fin] = await Promise.all([loadImg(TEX + 'raw-5.5.jpg'), loadImg(TEX + 'ed-8.0.jpg')]);
    const gl = mk(1280, 720);
    renderer = new THREE.WebGLRenderer({ canvas: gl, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1); renderer.setSize(1280, 720, false); renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(28, 16 / 9, 0.1, 100);
    stack = new THREE.Group(); mirror = new THREE.Group(); scene.add(mirror, stack);
    mirror.position.y = 2 * FLOOR; mirror.scale.y = -1;

    const shape = new THREE.Shape(), r = 0.11, x = -W / 2, y = -H / 2;
    shape.moveTo(x + r, y); shape.lineTo(x + W - r, y); shape.quadraticCurveTo(x + W, y, x + W, y + r); shape.lineTo(x + W, y + H - r);
    shape.quadraticCurveTo(x + W, y + H, x + W - r, y + H); shape.lineTo(x + r, y + H); shape.quadraticCurveTo(x, y + H, x, y + H - r); shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
    const geo = new THREE.ShapeGeometry(shape, 10), pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / W + 0.5, pos.getY(i) / H + 0.5);
    const edgeGeo = new THREE.BufferGeometry().setFromPoints(shape.getPoints(10).map(p => new THREE.Vector3(p.x, p.y, 0)));
    const sheenImg = sheenCanvas();
    const basic = map => new THREE.MeshBasicMaterial({ map, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
    const sheenTex = () => { const t = tex(sheenImg); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; };

    LAYERS.forEach((L, i) => {
      const mat = basic(tex(layerCanvas(L.key, { raw }))), sMat = basic(sheenTex());
      const eMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, depthTest: false });
      const it = { L, i, mat, sMat, eMat, nodes: [] };
      for (const grp of [stack, mirror]) {
        const n = new THREE.Group();
        const m = new THREE.Mesh(geo, mat), s = new THREE.Mesh(geo, sMat), e = new THREE.LineLoop(edgeGeo, eMat);
        m.renderOrder = i * 3; s.renderOrder = i * 3 + 1; e.renderOrder = i * 3 + 2; n.add(m, s, e); grp.add(n); it.nodes.push(n);
      }
      items.push(it);
    });
    finMat = basic(tex((() => { const c = mk(540, 960), g = c.getContext('2d'); g.drawImage(fin, 0, 0, 540, 960); g.strokeStyle = 'rgba(235,245,255,0.6)'; g.lineWidth = 4; g.strokeRect(0, 0, 540, 960); return c; })()));
    finSheen = basic(sheenTex());
    for (const grp of [stack, mirror]) {
      const n = new THREE.Group(), m = new THREE.Mesh(geo, finMat), s = new THREE.Mesh(geo, finSheen);
      m.renderOrder = 50; s.renderOrder = 51; n.add(m, s); n.userData.fin = true; grp.add(n);
    }
    comp = mk(1280, 720); cctx = comp.getContext('2d'); small = mk(320, 180); sctx = small.getContext('2d');
    moovi = new MooviFilm(512);
  },

  frame(t) {
    // ---------- timing ----------
    const back = io((t - BACK0) / 2.2);                                        // 17 → 19.6 reassemble
    const eOf = i => spring((t - 1.05 - (5 - i) * 0.06) / 1.25) * (1 - io((t - BACK0 - i * 0.07) / 1.9));
    const eAll = smooth((t - 1.0) / 1.6) * (1 - back);
    const yaw = lerp(-0.1 - 0.02 * t, -0.86, io((t - 1.0) / 2.6)) + 0.3 * smooth((t - 3.6) / 9.5) - (-0.44 + 0.07) * 0 // slow orbit
      + lerp(0, 0.6 - 0.085, io((t - BACK0) / 2.6));                                                                // settle near front
    const fin = Math.max(1 - smooth((t - 1.05) / 0.5), smooth((t - 15.2) / 0.6));
    let hlPos = 0; for (let i = 0; i < 6; i++) if (t >= HLT[i]) hlPos = i + Math.min(1, (t - HLT[i]) / (HLT[i + 1] - HLT[i])); if (t < HLT[0]) hlPos = (t - HLT[0]);                                              // which layer is lit (fractional)
    const hlOn = smooth((t - HLT[0] + 0.25) / 0.3) * (1 - smooth((t - HLT[6]) / 0.5));
    const hlW = i => hlOn * smooth(1 - Math.abs(hlPos - i - 0.5) * 1.55 + 0.42);
    const labelsOut = 1 - smooth((t - BACK0 + 0.2) / 0.7);

    // ---------- camera ----------
    const dist = lerp(lerp(9.3 - 0.1 * t, 11.7, io((t - 1.0) / 2.4)) - 0.9 * smooth((t - 3.6) / 9.5), 9.3 - 0.12 * smooth((t - 15.6) / 2.1), io((t - BACK0) / 2.8));
    const az = 0.05 * Math.sin(t * 0.21 + 0.6), el = lerp(0.085, 0.13, eAll);
    camera.position.set(Math.sin(az) * dist, 0.3 + Math.sin(el) * dist, Math.cos(az) * dist);
    const lookY = lerp(-0.1, 0.2, eAll); camera.lookAt(0, lookY, 0); camera.updateMatrixWorld();
    const hover = 0.035 * Math.sin(t * 0.9);
    for (const g of [stack, mirror]) g.rotation.y = yaw;
    stack.position.y = hover; mirror.position.y = 2 * FLOOR - hover;

    // ---------- layers ----------
    items.forEach(it => {
      const i = it.i, e = eOf(i), z = (i - 2.5) * GAP * e, h = hlW(i);
      it.nodes.forEach(n => { n.position.z = z; n.visible = fin < 0.999; });
      const dim = 1 - 0.24 * hlOn * (1 - h);
      it.mat.opacity = (i === 0 ? 1 : lerp(0.86, 1, h)) * dim * (1 - smooth((fin - 0.55) / 0.45) * (i === 0 ? 0 : 1));
      it.mat.color.setScalar(i === 0 ? lerp(0.86, 1, h) * (1 - 0.25 * hlOn * (1 - h)) : 1);
      it.eMat.opacity = (0.5 + 0.5 * h) * dim * e;
      it.eMat.color.setRGB(lerp(0.75, 1, h), lerp(0.86, 1, h), 1);
      // one sheen pass as the layer leaves, one while it is lit
      const s1 = (t - 1.4 - i * 0.12) / 1.2, s2 = hlPos - i;
      const sp = s1 > 0 && s1 < 1 ? s1 : (s2 > 0 && s2 < 1 && hlOn > 0 ? s2 : -1);
      it.sMat.opacity = sp < 0 ? 0 : Math.sin(sp * Math.PI) * 0.55; it.sMat.map.offset.x = sp < 0 ? 2 : lerp(0.95, -0.95, sp);
    });
    const fs = (t - 0.55) / 1.3, fs2 = (t - 15.9) / 1.2, fsp = fs > 0 && fs < 1 ? fs : (fs2 > 0 && fs2 < 1 ? fs2 : -1);
    finMat.opacity = fin; finSheen.opacity = fsp < 0 ? 0 : Math.sin(fsp * Math.PI) * 0.85 * fin; finSheen.map.offset.x = fsp < 0 ? 2 : lerp(0.95, -0.95, fsp);
    for (const g of [stack, mirror]) g.children.forEach(n => { if (n.userData.fin) { n.position.z = 0.002; n.visible = fin > 0.001; } });

    // rack focus: follows the lit layer; during the pull it sits on the caption
    const focus = hlOn > 0.01 ? lerp(3.4, clamp(hlPos - 0.5, 0, 5), hlOn) : 3.4;
    const blurBack = 1.0 * eAll * smooth((focus - 1.6) / 2.2), blurFront = 1.0 * eAll * smooth((3.4 - focus) / 2.2);

    // ---------- background stage ----------
    const stackCY = 360 - (hover - lookY) * (360 / (Math.tan(14 * Math.PI / 180) * dist));
    const ppu = 360 / (Math.tan(14 * Math.PI / 180) * dist), floorY = stackCY - FLOOR * ppu * 0.99 + 4;
    let g = ctx.createLinearGradient(0, 0, 0, 720);
    g.addColorStop(0, '#020203'); g.addColorStop(clamp(floorY / 720 - 0.02), '#0b0c10'); g.addColorStop(clamp(floorY / 720), '#15171c'); g.addColorStop(1, '#07080a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
    // a pool of light on the floor and a soft key behind the object
    ctx.save(); ctx.translate(640, floorY + 46); ctx.scale(1, 0.2);
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, 620); g.addColorStop(0, 'rgba(150,170,205,0.34)'); g.addColorStop(0.4, 'rgba(90,105,135,0.14)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(-700, -700, 1400, 1400); ctx.restore();
    g = ctx.createRadialGradient(640, stackCY, 40, 640, stackCY, 520);
    g.addColorStop(0, `rgba(96,122,190,${0.2 + 0.05 * eAll})`); g.addColorStop(0.5, 'rgba(50,62,96,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);

    // ---------- three passes: reflection, back layers, front layers ----------
    const pass = (showMirror, lo, hi, withFin) => {
      mirror.visible = showMirror; stack.visible = !showMirror;
      items.forEach(it => { const v = it.i >= lo && it.i <= hi && fin < 0.999; it.nodes[0].visible = v; it.nodes[1].visible = v; });
      for (const grp of [stack, mirror]) grp.children.forEach(n => { if (n.userData.fin) n.visible = withFin && fin > 0.001; });
      renderer.render(scene, camera);
    };
    pass(true, 0, 5, true);
    ctx.save(); ctx.beginPath(); ctx.rect(0, floorY, 1280, 720 - floorY); ctx.clip();
    ctx.filter = 'blur(5px)'; ctx.globalAlpha = 0.5; ctx.drawImage(renderer.domElement, 0, 0); ctx.filter = 'none'; ctx.globalAlpha = 1;
    g = ctx.createLinearGradient(0, floorY, 0, floorY + 150); g.addColorStop(0, 'rgba(9,10,13,0)'); g.addColorStop(1, 'rgba(7,8,10,0.97)');
    ctx.fillStyle = g; ctx.fillRect(0, floorY, 1280, 720 - floorY); ctx.restore();

    cctx.clearRect(0, 0, 1280, 720);
    pass(false, 0, 2, false);
    cctx.filter = blurBack > 0.15 ? `blur(${blurBack.toFixed(2)}px)` : 'none'; cctx.drawImage(renderer.domElement, 0, 0);
    pass(false, 3, 5, true);
    cctx.filter = blurFront > 0.15 ? `blur(${blurFront.toFixed(2)}px)` : 'none'; cctx.drawImage(renderer.domElement, 0, 0); cctx.filter = 'none';
    ctx.drawImage(comp, 0, 0);
    // bloom
    sctx.clearRect(0, 0, 320, 180); sctx.filter = 'blur(5px)'; sctx.drawImage(comp, 0, 0, 320, 180); sctx.filter = 'none';
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.5 + 0.12 * hlOn; ctx.drawImage(small, 0, 0, 1280, 720);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    // ---------- labels (2D, locked to projected corners) ----------
    stack.updateMatrixWorld(true);
    const proj = (x, y, z) => { const v = new THREE.Vector3(x, y, z).applyMatrix4(stack.matrixWorld).project(camera); return [(v.x * 0.5 + 0.5) * 1280, (1 - (v.y * 0.5 + 0.5)) * 720]; };
    const anchors = items.map(it => proj(it.L.side * (W / 2 - 0.11), H / 2, (it.i - 2.5) * GAP * eOf(it.i)));
    const topY = Math.min(...anchors.map(a => a[1]));
    const colL = Math.min(...anchors.map(a => a[0])) - 34, colR = Math.max(...anchors.map(a => a[0])) + 34;
    if (labelsOut > 0.001 && t > 2.5) items.forEach((it, k) => {
      const L = it.L, [ax, ay] = anchors[k], order = L.side < 0 ? 5 - it.i : it.i + 3;      // front layers first, then the back ones
      const p = clamp((t - Math.min(2.9 + order * 0.22, HLT[it.i]) ) / 0.7), draw = outExpo(p / 0.75), txt = smooth((p - 0.35) / 0.65) * labelsOut;
      if (p <= 0) return;
      const h = hlW(it.i), a = labelsOut * lerp(1, 0.6 + 0.4 * h, hlOn);
      const rowY = topY - 32 - L.row * 46, col = L.side < 0 ? colL : colR;
      const len1 = ay - 6 - rowY, len2 = Math.abs(col - ax), total = len1 + len2, d = draw * total;
      ctx.save(); ctx.globalAlpha = a; ctx.lineWidth = 1.5; ctx.strokeStyle = h > 0.5 ? '#ffffff' : 'rgba(207,230,247,0.85)'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(ax, ay - 6); ctx.lineTo(ax, ay - 6 - Math.min(d, len1));
      if (d > len1) ctx.lineTo(ax + L.side * (d - len1), rowY); ctx.stroke();
      ctx.fillStyle = '#f7fafd'; ctx.beginPath(); ctx.arc(ax, ay - 3, 3 + 1.5 * h, 0, 7); ctx.fill();
      ctx.globalAlpha = a * txt; ctx.textAlign = L.side < 0 ? 'right' : 'left'; ctx.textBaseline = 'alphabetic';
      const tx = col + L.side * (10 + 8 * (1 - txt));
      ctx.font = '600 12.5px "JetBrains Mono"'; ctx.fillStyle = h > 0.5 ? '#aebfff' : '#8fa8ff';
      try { ctx.letterSpacing = '2.2px'; } catch (e) {}
      ctx.fillText(L.key.toUpperCase(), tx - (L.side < 0 ? -2 : 0), rowY - 3);
      try { ctx.letterSpacing = '0px'; } catch (e) {}
      ctx.font = '500 19px "Inter Tight"'; ctx.fillStyle = '#f7fafd'; ctx.fillText(L.reason, tx, rowY + 19);
      ctx.restore();
    });

    // ---------- Moovi peeks in for the last beats ----------
    const mIn = spring((t - 14.6) / 1.3, 3.6, 5.2);
    if (t > 14.6) {
      const mc = moovi.render(t, { look: [-0.85, 0.12], lean: 0.55 * smooth((t - 15) / 0.8) + 0.3 * Math.sin(t * 5), turn: -0.2 });
      const mx = lerp(1300, 968, mIn), my = floorY - 262;
      ctx.drawImage(mc, mx, my, 310, 310);
    }

    // ---------- vignette ----------
    g = ctx.createRadialGradient(640, 370, 300, 640, 370, 800); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
  },
};
