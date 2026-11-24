/**
 * Project state: one JSON doc next to the clip (`<clip>.editeasy.json`), so every op the model planned, every verdict
 * and every render is inspectable in a text editor and undoable. The model never sees seconds: ops anchor to word
 * indices, and this file holds the words with their times.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { z } from 'zod';

export const KIT = resolve(import.meta.dirname, '..');
export const PY = process.env.EDITEASY_PYTHON ?? (process.platform === 'win32' ? 'python' : 'python3');

export interface Word { i: number; w: string; start: number; end: number }
export interface Box { x: number; y: number; w: number; h: number }
export interface Doc {
  version: 1;
  clip: { path: string; width: number; height: number; fps: number; duration: number; audio: boolean };
  face: { box: Box; source: string } | null;
  faceNote?: string;
  words: Word[] | null;
  transcript?: { source: string; language?: string };
  ops: Op[];
  history: Op[][];
  lastValidation?: { opsHash: string; pass: boolean; at: string };
  renders: { quality: string; path: string; at: string; loudness?: unknown }[];
}

// ── the typed editing language ──
export const POSITIONS = ['lower', 'middle', 'upper', 'top_edge', 'bottom_edge'] as const;
export function opSchema(m: { looks: [string, ...string[]]; events: [string, ...string[]]; grades: [string, ...string[]]; music: [string, ...string[]] }) {
  const w = z.number().int().min(0);
  return z.discriminatedUnion('op', [
    z.object({
      op: z.literal('captions'), look: z.enum(m.looks).describe('caption look id from find_library kind=caption'),
      position: z.enum(POSITIONS).default('lower').describe('where the caption block sits; top_edge / bottom_edge are platform UI zones'),
      size: z.enum(['as_designed', 'large']).default('as_designed').describe('as_designed = the look\'s own size; large = 1.75x for phone legibility'),
      nudge_px: z.number().int().min(-600).max(600).optional().describe('optional vertical nudge in px at 1080x1920 (the verifier checks the result)'),
    }),
    z.object({ op: z.literal('punch_in'), at_word: w, scale: z.enum(['subtle', 'strong']).default('subtle'), until_word: w.optional().describe('hold through this word; default: end of the sentence, max ~2.5 s') }),
    z.object({ op: z.literal('cut'), from_word: w, to_word: w }),
    z.object({ op: z.literal('sfx'), event: z.enum(m.events).describe('Style 1 sound-kit event'), at_word: w }),
    z.object({ op: z.literal('grade'), id: z.enum(m.grades) }),
    z.object({ op: z.literal('music'), id: z.enum(m.music), level: z.enum(['bed']).default('bed') }),
    z.object({ op: z.literal('hero_word'), word_index: w }),
  ]);
}
export type Op =
  | { op: 'captions'; look: string; position: (typeof POSITIONS)[number]; size?: 'as_designed' | 'large'; nudge_px?: number }
  | { op: 'punch_in'; at_word: number; scale: 'subtle' | 'strong'; until_word?: number }
  | { op: 'cut'; from_word: number; to_word: number }
  | { op: 'sfx'; event: string; at_word: number }
  | { op: 'grade'; id: string }
  | { op: 'music'; id: string; level: 'bed' }
  | { op: 'hero_word'; word_index: number };

// ── clip registry: clip id → path, kept in the user's home so ids survive a server restart ──
const REG = join(homedir(), '.editeasy-mcp', 'clips.json');
const reg = (): Record<string, string> => (existsSync(REG) ? JSON.parse(readFileSync(REG, 'utf8')) : {});
export function clipIdFor(path: string) {
  const id = basename(path).replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 24) + '-' + createHash('sha1').update(resolve(path)).digest('hex').slice(0, 6);
  const r = reg(); r[id] = resolve(path); mkdirSync(dirname(REG), { recursive: true }); writeFileSync(REG, JSON.stringify(r, null, 2));
  return id;
}
export function clipPath(id: string) {
  const p = reg()[id];
  if (!p) throw new Error(`unknown clip_id "${id}". Call open_clip with the clip's path first.`);
  return p;
}
export const docPath = (clip: string) => clip + '.editeasy.json';
export const load = (id: string): Doc => {
  const p = docPath(clipPath(id));
  if (!existsSync(p)) throw new Error(`no project for ${id}; call open_clip first`);
  return JSON.parse(readFileSync(p, 'utf8'));
};
export const save = (d: Doc) => writeFileSync(docPath(d.clip.path), JSON.stringify(d, null, 2));
export const opsHash = (ops: Op[]) => createHash('sha1').update(JSON.stringify(ops)).digest('hex').slice(0, 12);

// ── tools on the user's machine ──
export function probe(path: string): Doc['clip'] {
  const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', path], { encoding: 'utf8' }));
  const v = j.streams.find((s: any) => s.codec_type === 'video');
  if (!v) throw new Error('no video stream in ' + path);
  const [n, d] = String(v.avg_frame_rate || v.r_frame_rate).split('/').map(Number);
  let width = v.width, height = v.height;
  const rot = Math.abs(Number(v.side_data_list?.find((s: any) => s.rotation != null)?.rotation ?? v.tags?.rotate ?? 0));
  if (rot === 90 || rot === 270) [width, height] = [height, width];
  return { path: resolve(path), width, height, fps: d ? Math.round((n / d) * 1000) / 1000 : n, duration: Number(j.format.duration), audio: j.streams.some((s: any) => s.codec_type === 'audio') };
}
export function py(args: string[], timeoutMs = 15 * 60_000): any {
  const s = execFileSync(PY, ['-I', join(KIT, 'py', 'helper.py'), ...args], { encoding: 'utf8', timeout: timeoutMs, maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'pipe'] });
  return JSON.parse(s);
}
