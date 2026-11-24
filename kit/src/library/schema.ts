/**
 * A library item = one folder: library/<kind>/<slug>/item.json + its files (+ card.md, preview.*).
 * item.json is the manifest validated here. The id is "<kind>/<slug>" and equals the folder path, so it can never drift.
 */
import { z } from 'zod';
import { KIND_IDS, type Kind } from './kinds';

export const Status = z.enum([
  'authored',   // made by hand / by Claude in development, passed review
  'imported',   // carried over from an older product; works but not yet re-judged in Edit Easy
  'generated',  // invented by the engine (phase 3+), passed lint + critic + review
  'trial',      // invented for one user/video, not yet promoted to the shared library
  'retired',    // kept for history, never selected
]);

export const Needs = z.object({
  face: z.boolean().optional(),
  mask: z.boolean().optional(),
  maxWords: z.number().int().optional(),
  minDurMs: z.number().optional(),
  number: z.boolean().optional(),
}).catchall(z.unknown());

export const Item = z.object({
  id: z.string().regex(/^[a-z0-9-]+\/[a-z0-9][a-z0-9._-]*$/, 'id is "<kind>/<slug>", lowercase'),
  kind: z.enum(KIND_IDS as [Kind, ...Kind[]]),
  name: z.string().min(1),
  version: z.number().int().positive().default(1),
  status: Status.default('authored'),
  /** who owns it: "ishaan", the co-founder's handle, "engine" */
  owner: z.string().default('ishaan'),
  provenance: z.object({
    /** where it came from: "metahack", "moovi", "captionseasy", "template:t07-...", "reference:<id>", "user:<id>" */
    source: z.string(),
    path: z.string().optional(),
    note: z.string().optional(),
  }),
  /** one line, shown in menus and to agents: what it is and when to use it */
  summary: z.string().min(1).max(240),
  tags: z.array(z.string()).default([]),
  /** style ids it belongs to ("*" = any) */
  styles: z.array(z.string()).default(['*']),
  /** beat roles it serves: hook, claim, number, list-item, negative, payoff, cta, chapter, any */
  roles: z.array(z.string()).default([]),
  genres: z.array(z.string()).default([]),
  needs: Needs.default({}),
  /** authored prior 0..1; usage data adjusts it at selection time, it is never overwritten by usage */
  weight: z.number().min(0).max(1).default(0.5),
  /** energy 0 (quiet) .. 1 (loud), for loud/quiet alternation */
  energy: z.number().min(0).max(1).optional(),
  /** files in the item folder (media, code), relative */
  files: z.array(z.string()).default([]),
  /** other items it is built from or pairs with: "font/anton", "sfx/style1.snap" */
  uses: z.array(z.string()).default([]),
  /** where its runtime implementation lives, when it is code: "@editeasy/camera#punch-in", "templates/t01-x/src/look.ts" */
  impl: z.string().optional(),
  /** lint rule ids that enforce it (principles) */
  lint: z.array(z.string()).default([]),
  /** kind-specific payload, validated by DATA[kind] when one exists */
  data: z.record(z.string(), z.unknown()).default({}),
});
export type Item = z.infer<typeof Item>;
export type ItemInput = z.input<typeof Item>;

/** Kind-specific data. Kinds without an entry keep free-form data until they earn a schema. */
export const DATA: Partial<Record<Kind, z.ZodType>> = {
  sfx: z.object({
    category: z.enum(['click', 'pop', 'whoosh', 'hit', 'riser', 'tone', 'foley', 'ui', 'typing', 'other']),
    /** the events it fits, best first */
    fits: z.array(z.object({
      event: z.string(),
      rank: z.number().int().min(1).default(1),
      levelDb: z.number().optional(),
      align: z.enum(['start', 'peak', 'end']).default('start'),
    })),
    /** "onsets" = cut short slices at the sound's onsets (typing), else play whole */
    slices: z.enum(['whole', 'onsets']).default('whole'),
    sliceLen: z.number().optional(),
    measured: z.object({ durMs: z.number(), peakMs: z.number(), peakDb: z.number().optional() }).optional(),
    licence: z.string(),
    kits: z.array(z.string()).default([]),
    // ── placement metadata (schema learned from OpusClip AI Producer's sound library, MIT plugin; values are ours)
    /** broad family: ui | transition | impact | tension | foley | tone | human | comedy */
    family: z.string().optional(),
    /** timbre from the measured spectral centroid: sub < deep < warm < crisp < bright < airy */
    tone: z.enum(['sub', 'deep', 'warm', 'crisp', 'bright', 'airy']).optional(),
    centroidHz: z.number().optional(),
    /** one line: the moment it is for */
    useWhen: z.string().optional(),
    /** where the moment lands on the sound: its first hit, its loudest point, or its tail */
    placement: z.enum(['first_hit', 'peak', 'end']).optional(),
    /** onset times inside the file, ms (a multi-hit sound lists each hit) */
    hitsMs: z.array(z.number()).optional(),
    /** still audible on a phone speaker (not sub-only) */
    phoneSafe: z.boolean().optional(),
    /** gain that sets it at its kit level under a voice at about -18 dB RMS */
    suggestedGainDb: z.number().optional(),
  }),
  'sound-kit': z.object({
    events: z.record(z.string(), z.object({ sounds: z.array(z.string()), levelDb: z.number().optional(), why: z.string().optional() }).catchall(z.unknown())),
    rules: z.object({ minGap: z.number().default(0.06), priority: z.array(z.string()).default([]), jitterDb: z.number().default(0), peakCeilingDb: z.number().default(-6) }),
  }),
  music: z.object({ mood: z.string(), bpm: z.number().optional(), licence: z.string(), credit: z.string().optional(), gainDb: z.number().default(-24) }),
  font: z.object({ family: z.string(), files: z.array(z.object({ file: z.string(), weight: z.number(), style: z.enum(['normal', 'italic']).default('normal') })), licence: z.string(), role: z.array(z.enum(['display', 'body', 'script', 'mono', 'serif'])).default([]) }),
  caption: z.object({ look: z.record(z.string(), z.unknown()), maxWordsPerCard: z.number().int().optional() }),
  grade: z.object({ lut: z.string().optional(), contrast: z.number().optional(), saturation: z.number().optional(), brightness: z.number().optional(), warmth: z.number().optional(), vignette: z.number().optional(), grain: z.number().optional() }).catchall(z.unknown()),
  camera: z.object({ group: z.string(), scope: z.enum(['edit', 'coded', 'gen']), keywords: z.array(z.string()).default([]) }).catchall(z.unknown()),
};

export function validateData(item: Item): string[] {
  const s = DATA[item.kind];
  if (!s) return [];
  const r = s.safeParse(item.data);
  return r.success ? [] : r.error.issues.map(i => `data.${i.path.join('.')}: ${i.message}`);
}
