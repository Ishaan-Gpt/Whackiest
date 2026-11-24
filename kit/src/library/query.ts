/**
 * Selection: filter (hard, structured) → rank (prior + learned use − recency) → seeded tie-break.
 *
 * This is how the engine picks a caption, a sound or a recipe for a beat without ever loading the library into a
 * model: a model (when there is one) sees only the top few with their one-line summaries. Learned signals (keep rate
 * per item per context, from Postgres later) arrive as `stats`; with none, the authored weight decides.
 */
import type { Item } from './schema';
import type { Kind } from './kinds';

export interface Want {
  kind: Kind;
  style?: string;
  role?: string;
  genre?: string;
  tags?: string[];
  /** for sfx: the event to sound */
  event?: string;
  /** for sfx: restrict to a sound kit */
  kit?: string;
  /** what the moment has: { face: true, words: 3 } — items whose needs are not met are dropped */
  has?: { face?: boolean; mask?: boolean; words?: number; number?: boolean };
  /** free text matched against name/summary/tags (cheap stand-in for embeddings until they land) */
  text?: string;
  includeTrial?: boolean;
}

export interface Pick { item: Item; score: number; why: string[] }
export interface Stats { [itemId: string]: { keepRate: number; n: number } }

export function find(items: Item[], want: Want, o: { seed?: number; recent?: string[]; stats?: Stats; limit?: number } = {}): Pick[] {
  const recent = o.recent ?? [];
  const words = (want.text ?? '').toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
  const out: Pick[] = [];
  for (const it of items) {
    if (it.kind !== want.kind || it.status === 'retired' || (it.status === 'trial' && !want.includeTrial)) continue;
    if (want.style && !(it.styles.includes('*') || it.styles.includes(want.style))) continue;
    if (want.role && it.roles.length && !(it.roles.includes(want.role) || it.roles.includes('any'))) continue;
    if (want.genre && it.genres.length && !it.genres.includes(want.genre)) continue;
    if (want.tags && !want.tags.every(t => it.tags.includes(t))) continue;
    const h = want.has ?? {};
    if (it.needs.face && h.face === false) continue;
    if (it.needs.mask && !h.mask) continue;
    if (it.needs.number && !h.number) continue;
    if (it.needs.maxWords && h.words && h.words > it.needs.maxWords) continue;
    let fit: { rank: number } | undefined;
    if (want.event) {
      const fits = (it.data.fits as { event: string; rank: number }[] | undefined) ?? [];
      fit = fits.find(f => f.event === want.event);
      if (!fit) continue;
    }
    if (want.kit && !((it.data.kits as string[] | undefined) ?? []).includes(want.kit)) continue;

    const why: string[] = [];
    let s = it.weight; why.push(`prior ${it.weight}`);
    if (fit) { s += 0.3 / fit.rank; why.push(`fits ${want.event} rank ${fit.rank}`); }
    const st = o.stats?.[it.id];
    if (st && st.n >= 5) { const b = (st.keepRate - 0.5) * Math.min(1, st.n / 50); s += b; why.push(`kept ${(st.keepRate * 100) | 0}% of ${st.n}`); }
    if (words.length) {
      const hay = `${it.name} ${it.summary} ${it.tags.join(' ')}`.toLowerCase();
      const m = words.filter(w => hay.includes(w)).length;
      if (!m) continue;
      s += 0.15 * m; why.push(`text ${m}`);
    }
    const r = recent.lastIndexOf(it.id);
    if (r >= 0) { const p = 0.4 * (1 - (recent.length - 1 - r) / Math.max(4, recent.length)); s -= p; why.push(`used recently −${p.toFixed(2)}`); }
    if (it.status === 'imported') { s -= 0.05; why.push('imported, not yet re-judged'); }
    out.push({ item: it, score: s, why });
  }
  const seed = o.seed ?? 0;
  out.sort((a, b) => b.score - a.score || hash(a.item.id, seed) - hash(b.item.id, seed));
  return out.slice(0, o.limit ?? 5);
}

/** The best single item, or undefined. */
export const pickOne = (items: Item[], want: Want, o?: Parameters<typeof find>[2]) => find(items, want, { ...o, limit: 1 })[0]?.item;

function hash(s: string, seed: number) {
  let h = 2166136261 ^ seed;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
