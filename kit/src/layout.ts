/**
 * Caption geometry, computed once and shared by the verifier and the renderer, so what is checked is exactly what is
 * drawn. Sizes come from the look (reference px at a 1080 short edge, CaptionsEasy's convention:
 * library/caption/_impl/.../templates/src/text.ts `scaleOf`), widths from the font's real advance widths.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { captionLooks, fontFor, measure, type Look } from './lib.ts';
import { KIT, py, type Box, type Doc, type Op, type Word } from './state.ts';

export const FONT_CACHE = join(KIT, '.cache', 'fonts');
export interface FontMetrics { family: string; file: string; asc: number; desc: number; adv: Record<string, number> }

/** A static TTF for the look's font and weight (instanced from a variable WOFF2 when needed), cached. */
export function prepFont(look: Look): FontMetrics {
  const src = fontFor(look.font, look.weight);
  if (!src) throw new Error(`font ${look.font} is not in the library`);
  const family = `EE ${look.font} ${src.variable ? look.weight : src.weight}`;
  const slug = family.replace(/\s+/g, '-');
  mkdirSync(FONT_CACHE, { recursive: true });
  const meta = join(FONT_CACHE, slug + '.json');
  if (existsSync(meta)) return JSON.parse(readFileSync(meta, 'utf8'));
  const m = py(['font', src.file, String(look.weight), join(FONT_CACHE, slug + '.ttf'), family], 120_000) as FontMetrics;
  writeFileSync(meta, JSON.stringify(m));
  return m;
}
export const textWidth = (s: string, m: FontMetrics) => [...s].reduce((a, c) => a + (m.adv[c] ?? m.adv['n'] ?? 0.55), 0);

// caption rules from the library (principle/caption-timing, principle/text-legibility); fallbacks only if missing
export const capRules = () => {
  const t = measure('principle/caption-timing'), l = measure('principle/text-legibility');
  return {
    maxWords: (t.maxWordsPerCue as number) ?? 4, maxLines: (t.maxLines as number) ?? 2, joinMs: (t.cueJoinMs as number) ?? 500,
    holdMs: (t.cueHoldMs as number) ?? 200, bandY: (t.bandCentreY?.['9:16'] as number) ?? 0.7, minSize: (l.bodyMinShortSide as number) ?? 0.04,
  };
};
/** Block centre y as a fraction of height. "lower" is the library's 9:16 caption band (principle/caption-timing). */
export const anchorY = (pos: string) => ({ lower: capRules().bandY, middle: 0.5, upper: 0.25, top_edge: 0.07, bottom_edge: 0.86 } as Record<string, number>)[pos] ?? capRules().bandY;

/** Shorts safe area on 1080×1920: x 70–905, y 230–1480 (docs/CONTEXT.md §4, "the Shorts safe area"), scaled. */
export const safeArea = (W: number, H: number): Box => ({ x: (70 / 1080) * W, y: (230 / 1920) * H, w: (835 / 1080) * W, h: (1250 / 1920) * H });

export const LARGE = 1.75, LINE_H = 1.15;
export interface Line { words: Word[]; text: string[]; y: number; x0: number; x1: number; top: number; bottom: number; size: number }
export interface Card { words: Word[]; start: number; end: number; lines: Line[] }
export interface Layout { look: Look; font: FontMetrics; px: number; outline: number; cards: Card[]; anchor: number }

/** Remove cut spans: kept source ranges, and source time → output time. */
export function timeline(d: Doc) {
  const words = d.words ?? [];
  const cuts = d.ops.filter((o): o is Extract<Op, { op: 'cut' }> => o.op === 'cut').map(c => {
    const a = words[c.from_word], b = words[c.to_word];
    const prev = words[c.from_word - 1], next = words[c.to_word + 1];
    return [prev ? (prev.end + a.start) / 2 : 0, next ? (b.end + next.start) / 2 : d.clip.duration] as [number, number];
  }).sort((p, q) => p[0] - q[0]);
  const keep: [number, number][] = []; let t = 0;
  for (const [a, b] of cuts) { if (a > t) keep.push([t, a]); t = Math.max(t, b); }
  if (t < d.clip.duration) keep.push([t, d.clip.duration]);
  const cutWord = (i: number) => d.ops.some(o => o.op === 'cut' && i >= o.from_word && i <= o.to_word);
  const map = (s: number) => { let out = 0; for (const [a, b] of keep) { if (s >= b) out += b - a; else { if (s > a) out += s - a; break; } } return out; };
  return { keep, map, cutWord, duration: keep.reduce((s, [a, b]) => s + b - a, 0) };
}

export function layout(d: Doc, cap: Extract<Op, { op: 'captions' }>): Layout {
  const look = captionLooks().find(l => l.id === cap.look);
  if (!look) throw new Error(`caption look ${cap.look} is not renderable`);
  const font = prepFont(look);
  const { W, H } = { W: d.clip.width, H: d.clip.height };
  // "large" is a prototype default (1.75x), pending Ishaan's yes: the legacy looks are authored at ~50 px, small on a phone
  const S = Math.min(W, H) / 1080, px = look.size * S * (cap.size === 'large' ? LARGE : 1), outline = look.stroke ? Math.max(2, px * 0.08) : 0;
  const R = capRules(), safe = safeArea(W, H), tl = timeline(d);
  const hero = new Set(d.ops.filter(o => o.op === 'hero_word').map(o => (o as { word_index: number }).word_index));
  const words = (d.words ?? []).filter(w => !tl.cutWord(w.i)).map(w => ({ ...w, start: tl.map(w.start), end: tl.map(w.end) }));
  const per = look.maxWordsPerCard;
  // cards: up to the look's words per card, broken at sentence ends and pauses longer than the join gap
  const groups: Word[][] = []; let cur: Word[] = [];
  for (const w of words) {
    const prev = cur[cur.length - 1];
    if (cur.length && (cur.length >= per || (w.start - prev.end) * 1000 > R.joinMs || /[.?!]$/.test(prev.w))) { groups.push(cur); cur = []; }
    cur.push(w);
  }
  if (cur.length) groups.push(cur);
  const cs = (s: string) => (look.casing === 'upper' ? s.toUpperCase() : look.casing === 'lower' ? s.toLowerCase() : s);
  const clean = (s: string) => cs(s.replace(/[,;:.]+$/, ''));
  const anchor = anchorY(cap.position) * H + (cap.nudge_px ?? 0) * (H / 1920);
  const cards: Card[] = groups.map((g, gi) => {
    const next = groups[gi + 1];
    const end = Math.min(g[g.length - 1].end + R.holdMs / 1000, next ? next[0].start : Infinity);
    // lines: greedy fill to the safe width (hero words at the look's hero scale)
    const wpx = (w: Word) => textWidth(clean(w.w), font) * px * (hero.has(w.i) ? look.heroScale : 1);
    const space = textWidth(' ', font) * px;
    // lines are centred on the frame, so they wrap to the widest centred span inside the (asymmetric) safe area
    const maxW = 2 * Math.min(W / 2 - safe.x, safe.x + safe.w - W / 2) - 2 * outline;
    const rows: Word[][] = []; let row: Word[] = [], rw = 0;
    for (const w of g) {
      const ww = wpx(w);
      if (row.length && rw + space + ww > maxW) { rows.push(row); row = []; rw = 0; }
      rw += (row.length ? space : 0) + ww; row.push(w);
    }
    if (row.length) rows.push(row);
    // line pitch 1.15 em: CaptionsEasy's default lineHeight (caption/_impl shared/src/style.ts CaptionStyleSchema)
    const lh = rows.map(r => LINE_H * px * (r.some(w => hero.has(w.i)) ? look.heroScale : 1));
    const total = lh.reduce((a, b) => a + b, 0);
    let y = anchor - total / 2;
    // the menu positions (lower / middle / upper) are tailored by code: a tall card is shifted to stay inside the safe
    // area. Edge positions and explicit nudges are taken literally, so the verifier can refuse them.
    if (['lower', 'middle', 'upper'].includes(cap.position) && !cap.nudge_px) {
      const pad = outline + 2;
      y = Math.min(Math.max(y, safe.y + pad), safe.y + safe.h - pad - total);
    }
    const lines: Line[] = rows.map((r, k) => {
      const width = r.reduce((a, w, j) => a + wpx(w) + (j ? space : 0), 0);
      const line: Line = { words: r, text: r.map(w => clean(w.w)), y: y + lh[k] / 2, x0: W / 2 - width / 2 - outline, x1: W / 2 + width / 2 + outline, top: y - outline, bottom: y + lh[k] + outline, size: px };
      y += lh[k];
      return line;
    });
    return { words: g, start: g[0].start, end, lines };
  });
  return { look, font, px, outline, cards, anchor };
}
