import { MooviFilm } from '../moovi-film.js';
let o, m;
export default { dur: 2,
  async init(c) { o = c.getContext('2d'); m = new MooviFilm(512); },
  frame(t) { o.fillStyle = '#f2f3f5'; o.fillRect(0, 0, 1280, 720); o.drawImage(m.render(t, { wave: 1 }), 390, 60, 500, 500);
    o.fillStyle = '#0e1a2b'; o.font = '600 44px "Inter Tight"'; o.textAlign = 'center'; o.fillText('harness ok', 640, 640); } };
