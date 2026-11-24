/**
 * The taste library, read at runtime from the repo's `library/` folder (or EDITEASY_LIBRARY). Menus are built from the
 * items that are there today, never from hard-coded lists of looks, and selection goes through the library's own
 * `find()` (packages/library/src/query.ts: filter → rank by authored weight → seeded tie-break).
 *
 * The kit reads item.json files directly instead of importing the zod-validated loader, so it runs with nothing but its
 * own node_modules; `pnpm lib:check` at the repo root is what validates the items.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { find } from './library/query.ts';
import type { Item } from './library/schema.ts';

export const LIB_ROOT = resolve(process.env.EDITEASY_LIBRARY ?? join(import.meta.dirname, '../../library'));

let cache: Item[] | undefined;
export function items(): Item[] {
  if (cache) return cache;
  const out: Item[] = [];
  for (const kind of readdirSync(LIB_ROOT)) {
    const kd = join(LIB_ROOT, kind);
    if (kind.startsWith('_') || kind === 'dist' || !statSync(kd).isDirectory()) continue;
    for (const slug of readdirSync(kd)) {
      const f = join(kd, slug, 'item.json');
      if (slug.startsWith('_') || !existsSync(f)) continue;
      const raw = JSON.parse(readFileSync(f, 'utf8'));
      // the same defaults the schema fills in, so find() sees a complete item
      out.push({ styles: [], roles: [], genres: [], tags: [], needs: {}, uses: [], files: [], weight: 0.5, status: 'active', data: {}, ...raw });
    }
  }
  return (cache = out);
}
export const byId = (id: string) => items().find(i => i.id === id);
export const itemDir = (id: string) => join(LIB_ROOT, id);
export const measure = (id: string) => ((byId(id)?.data as { measure?: Record<string, unknown> } | undefined)?.measure ?? {}) as Record<string, any>;

// ── fonts ──
export interface FontSrc { item: string; file: string; weight: number; variable: boolean }
/** The library font file for a family at a weight: a static file of the nearest weight, or a variable font. */
export function fontFor(family: string, weight: number): FontSrc | undefined {
  const it = items().find(i => i.kind === 'font' && (i.data as any).family === family);
  if (!it) return undefined;
  const files = ((it.data as any).files ?? []) as { file: string; weight: number | string; style: string }[];
  const normal = files.filter(f => f.style !== 'italic');
  let best: FontSrc | undefined;
  for (const f of normal.length ? normal : files) {
    const variable = typeof f.weight === 'string' || /wght/.test(f.file);
    const w = variable ? weight : Number(f.weight);   // a variable file is instanced at the weight asked for
    const c = { item: it.id, file: join(itemDir(it.id), f.file), weight: w, variable };
    if (!best || Math.abs(c.weight - weight) < Math.abs(best.weight - weight)) best = c;
  }
  return best;
}

// ── caption looks ──
export interface Look {
  id: string; name: string; summary: string; font: string; weight: number; size: number; casing: string;
  text: string; active: string | null; stroke: string | null; heroScale: number; emphasisScale: number;
  maxWordsPerCard: number; highlight: string; inAnim: { type: string; durationMs: number } | null;
}
/**
 * Caption looks this renderer draws faithfully: a sentence / word / karaoke layout, a flat text colour, and a font the
 * library ships. Looks that need a box, pill, gradient or a custom pack renderer stay out of the menu until the
 * template engine draws them; the menu says so rather than drawing them wrong.
 */
export function captionLooks(): Look[] {
  const out: Look[] = [];
  for (const it of items()) {
    if (it.kind !== 'caption' || it.status === 'retired') continue;
    const l = (it.data as any).look;
    if (!l || !['sentence', 'word', 'karaoke'].includes(l.layout)) continue;
    const c = l.colours ?? {};
    if (!c.text || c.box || c.background || c.gradient || l.background !== 'none') continue;
    if (!['text', 'karaoke', 'none'].includes(l.highlight)) continue;
    if (!fontFor(l.type.fontId, l.type.fontWeight)) continue;
    out.push({
      id: it.id, name: it.name, summary: it.summary, font: l.type.fontId, weight: l.type.fontWeight, size: l.type.fontSize,
      casing: l.type.casing ?? 'none', text: c.text, active: c.active ?? null, stroke: c.stroke ?? null,
      heroScale: l.type.heroScale ?? 1.3, emphasisScale: l.emphasis?.scale ?? 1, maxWordsPerCard: l.settings?.maxWordsPerCard ?? 3,
      highlight: l.highlight, inAnim: l.inAnimation ? { type: l.inAnimation.type, durationMs: l.inAnimation.durationMs } : null,
    });
  }
  return out.sort((a, b) => (byId(b.id)!.weight - byId(a.id)!.weight) || a.id.localeCompare(b.id));
}

// ── sound ──
export const STYLE1 = 'sound-kit/style1';
export interface KitEvent { sounds: string[]; level_db: number; why?: string }
export const style1 = () => byId(STYLE1)!.data as { events: Record<string, KitEvent>; rules: { minGap: number } };
export const sfxEvents = () => Object.keys(style1().events);
/** The sound for an event: the library's find() over sfx items that fit the event and belong to the Style 1 kit. */
export function sfxFor(event: string) {
  const ev = style1().events[event];
  if (!ev) return undefined;
  // only sounds the Style 1 map names for this event; find() ranks them (authored weight, event fit)
  const pick = find(items(), { kind: 'sfx', event, kit: 'style1' }, { limit: 50 }).find(p => ev.sounds.includes(p.item.id));
  const id = pick?.item.id ?? ev.sounds[0];
  const it = id ? byId(id) : undefined;
  if (!it) return undefined;
  return { id: it.id, file: join(itemDir(it.id), it.files[0]), levelDb: ev.level_db, why: pick ? pick.why.join(', ') : 'first sound in the Style 1 map' };
}

export const grades = () => items().filter(i => i.kind === 'grade' && i.status !== 'retired');
export const music = () => items().filter(i => i.kind === 'music' && i.status !== 'retired');

export { find };
