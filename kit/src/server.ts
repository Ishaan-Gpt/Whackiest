#!/usr/bin/env node
/**
 * edit-easy: an MCP stdio server that gives any AI a typed editing language, the Edit Easy taste library and a verifier.
 * The model picks from short menus and returns validated JSON; it never writes coordinates, timings or colours, and
 * code proves every edit before it renders ("rules first, model second", docs/CONTEXT.md §2).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { anchorY, capRules, layout } from './layout.ts';
import { byId, captionLooks, find, grades, items, music, sfxEvents, sfxFor, style1 } from './lib.ts';
import { punchScale, render } from './render.ts';
import { clipIdFor, docPath, load, opSchema, opsHash, probe, py, save, type Doc, type Op } from './state.ts';
import { verify } from './verify.ts';

const nonEmpty = (a: string[], what: string) => { if (!a.length) throw new Error(`the library has no ${what}`); return a as [string, ...string[]]; };
const looks = captionLooks();
const OP = opSchema({
  looks: nonEmpty(looks.map(l => l.id), 'renderable caption looks'),
  events: nonEmpty(sfxEvents(), 'Style 1 sound events'),
  grades: nonEmpty(grades().map(g => g.id), 'grades'),
  music: nonEmpty(music().map(m => m.id), 'music'),
});

const server = new McpServer({ name: 'edit-easy', version: '0.1.0' }, {
  instructions: 'Edit Easy edits a talking-head clip into a reel. Flow: open_clip → transcribe → find_library (pick from the menus) → plan_edit (typed ops anchored to word indices) → validate_edit → render. If validate_edit REFUSES a rule, apply its Fix with plan_edit and validate again; never render around a refusal. Never invent seconds, pixels or colours: anchor to word indices and pick ids from find_library.',
});
const text = (o: unknown) => ({ content: [{ type: 'text' as const, text: typeof o === 'string' ? o : JSON.stringify(o, null, 2) }] });
const fail = (msg: string) => ({ ...text(msg), isError: true });
const wrap = <A,>(fn: (a: A) => unknown) => async (a: A) => { try { return text(await fn(a)); } catch (e) { return fail(`error: ${(e as Error).message}`); } };

// 1 ── open_clip
server.registerTool('open_clip', {
  title: 'Open a clip',
  description: 'Probe a video with ffprobe (duration, size, fps, audio), create or reopen its project doc (<clip>.editeasy.json next to the clip) and return a clip_id. Finds the face box with a local detector unless face_box is given.',
  inputSchema: {
    path: z.string().describe('absolute path to the raw clip on this computer'),
    face_box: z.object({ x: z.number().int(), y: z.number().int(), w: z.number().int().positive(), h: z.number().int().positive() }).optional().describe('optional face box in clip pixels; omit to detect'),
    reset: z.boolean().default(false).describe('start a fresh plan even if a project doc exists'),
  },
}, wrap(({ path, face_box, reset }: { path: string; face_box?: { x: number; y: number; w: number; h: number }; reset: boolean }) => {
  const p = resolve(path);
  if (!existsSync(p)) throw new Error(`no file at ${p}`);
  const clip = probe(p), id = clipIdFor(p);
  let d: Doc = existsSync(docPath(p)) && !reset ? JSON.parse(readFileSync(docPath(p), 'utf8')) : { version: 1, clip, face: null, words: null, ops: [], history: [], renders: [] };
  d.clip = clip;
  if (face_box) { d.face = { box: face_box, source: 'given by the user' }; delete d.faceNote; }
  else if (!d.face) {
    try {
      const f = py(['face', p, String(clip.duration)], 120_000);
      if (f.box) d.face = { box: f.box, source: `${f.method} (${f.frames}/5 frames)` }; else d.faceNote = 'the local face detector found no frontal face; the face rule is skipped.';
    } catch (e) { d.faceNote = `face detector unavailable (${(e as Error).message.split('\n')[0]}); the face rule is skipped. Install opencv-python-headless<5 or pass face_box.`; }
  }
  save(d);
  return { clip_id: id, ...clip, aspect: clip.width / clip.height < 0.6 ? '9:16' : `${clip.width}:${clip.height}`, face: d.face ?? d.faceNote, words: d.words?.length ?? 0, ops: d.ops.length, project: docPath(p), next: d.words ? 'find_library / plan_edit' : 'transcribe' };
}));

// 2 ── transcribe
server.registerTool('transcribe', {
  title: 'Transcribe (word timestamps)',
  description: 'Word-level timestamps, locally and free (faster-whisper on CPU). Returns the words with their indices: every edit anchors to these indices. If faster-whisper is not installed, pass words_json_path to a JSON list of {w,start,end}.',
  inputSchema: {
    clip_id: z.string(),
    model: z.enum(['tiny', 'base', 'small']).default('base'),
    words_json_path: z.string().optional().describe('fallback: a JSON file of [{"w","start","end"}] (seconds)'),
  },
}, wrap(({ clip_id, model, words_json_path }: { clip_id: string; model: string; words_json_path?: string }) => {
  const d = load(clip_id);
  let words: { w: string; start: number; end: number }[], source: string, language: string | undefined;
  if (words_json_path) {
    const raw = JSON.parse(readFileSync(resolve(words_json_path), 'utf8'));
    words = (Array.isArray(raw) ? raw : raw.words).map((w: any) => ({ w: String(w.w ?? w.word).trim(), start: Number(w.start), end: Number(w.end) }));
    source = `user-supplied ${words_json_path}`;
  } else {
    try { const r = py(['transcribe', d.clip.path, model]); words = r.words; source = r.model; language = r.language; }
    catch (e) { throw new Error(`faster-whisper failed (${(e as Error).message.split('\n').slice(-3).join(' ')}). Install it with "pip install faster-whisper", or pass words_json_path.`); }
  }
  d.words = words.map((w, i) => ({ i, ...w }));
  d.transcript = { source, language };
  save(d);
  return { words: d.words.length, source, language, transcript: d.words.map(w => `${w.i}:${w.w}`).join(' '), note: 'anchor ops with these indices (at_word, from_word/to_word, word_index).' };
}));

// 3 ── find_library
const KINDS = ['caption', 'sfx_event', 'font', 'grade', 'camera', 'music'] as const;
server.registerTool('find_library', {
  title: 'Find in the taste library',
  description: 'Short menus from the Edit Easy library (id + one line). kind=caption lists caption looks this renderer draws; sfx_event lists Style 1 sound-kit events and the sound each one plays; grade, music, font, camera list items. Use the returned ids in plan_edit.',
  inputSchema: {
    kind: z.enum(KINDS),
    text: z.string().optional().describe('optional words to match against name, summary and tags'),
    tags: z.array(z.string()).optional(),
    limit: z.number().int().min(1).max(20).default(8),
  },
}, wrap(({ kind, text: q, tags, limit }: { kind: (typeof KINDS)[number]; text?: string; tags?: string[]; limit: number }) => {
  if (kind === 'sfx_event') {
    const ev = style1().events;
    return { kit: 'sound-kit/style1 (the default kit; sound effects come from Style 1 by its map)', menu: Object.entries(ev).filter(([k, e]) => !q || `${k} ${e.why ?? ''}`.toLowerCase().includes(q.toLowerCase())).slice(0, limit).map(([k, e]) => ({ event: k, sound: sfxFor(k)?.id, level_db: e.level_db, when: (e.why ?? '').split(/[;.]/)[0].slice(0, 110) })) };
  }
  if (kind === 'caption') {
    const ok = new Set(looks.map(l => l.id));
    const ranked = find(items(), { kind: 'caption', text: q, tags }, { limit: 200 }).filter(p => ok.has(p.item.id));
    const pool = ranked.length || q ? ranked.map(p => p.item.id) : looks.map(l => l.id);
    return {
      note: `${looks.length} of ${items().filter(i => i.kind === 'caption').length} library caption looks are drawable by this renderer (flat colour + font in the library). Positions: lower (library 9:16 band, y=${Math.round(anchorY('lower') * 1920)} on 1920), middle, upper; top_edge and bottom_edge sit in platform UI zones.`,
      menu: pool.slice(0, limit).map(id => { const l = looks.find(x => x.id === id)!; return { id, summary: l.summary, font: `${l.font} ${l.weight}`, size_px: l.size, words_per_card: l.maxWordsPerCard, active_word: l.active }; }),
    };
  }
  const k = kind === 'camera' ? 'camera' : kind;
  const picks = find(items(), { kind: k as any, text: q, tags }, { limit });
  const menu = picks.map(p => ({ id: p.item.id, summary: p.item.summary.slice(0, 140) }));
  const extra = kind === 'camera' ? { note: `plan_edit uses punch_in (scale subtle = ${punchScale('subtle')}× from camera/punch-in, strong = ${punchScale('strong')}× from principle/punch-in); other moves are listed for reference.` }
    : kind === 'music' ? { note: 'level "bed" uses the item gainDb and ducks under the voice. Credit lines are returned by render.' } : {};
  return { ...extra, menu };
}));

// 4 ── plan_edit
server.registerTool('plan_edit', {
  title: 'Plan the edit (typed ops)',
  description: 'Set the edit as typed ops. Time anchors are word indices from transcribe, never seconds. Ops: captions{look,position}, punch_in{at_word,scale}, cut{from_word,to_word}, sfx{event,at_word}, grade{id}, music{id,level:"bed"}, hero_word{word_index}. mode "replace" (default) replaces the plan; "add" appends. The previous plan is kept for undo.',
  inputSchema: { clip_id: z.string(), ops: z.array(OP).min(1).max(40), mode: z.enum(['replace', 'add']).default('replace') },
}, wrap(({ clip_id, ops, mode }: { clip_id: string; ops: Op[]; mode: 'replace' | 'add' }) => {
  const d = load(clip_id);
  d.history.push(d.ops);
  d.ops = mode === 'add' ? [...d.ops, ...ops] : ops;
  delete d.lastValidation;
  save(d);
  return { ops: d.ops.length, plan: d.ops, next: 'validate_edit' };
}));

// 5 ── validate_edit
server.registerTool('validate_edit', {
  title: 'Verify the edit',
  description: 'The verifier: checks every op against measurable rules (Shorts safe area, text off the face, words per line, min font size, Style 1 sfx only, sfx spacing, punch-in spacing, music ducked, loudness target). Returns PASS / REFUSED / SKIPPED per rule with a plain reason and the fix. render refuses while anything is REFUSED.',
  inputSchema: { clip_id: z.string() },
}, wrap(({ clip_id }: { clip_id: string }) => {
  const d = load(clip_id);
  const v = verify(d);
  d.lastValidation = { opsHash: opsHash(d.ops), pass: v.pass, at: new Date().toISOString() };
  save(d);
  return { verdict: v.pass ? 'PASS' : 'REFUSED', summary: v.summary, rules: v.verdicts };
}));

// 6 ── render
server.registerTool('render', {
  title: 'Render the MP4',
  description: 'Render with ffmpeg on this computer: cuts, punch-ins keyed to word times, the grade LUT, word-timed captions in the library look, Style 1 sfx at kit levels, the music bed ducked under the voice, loudness to −14 LUFS. Runs the verifier first and refuses if it fails. preview = half size, fast; final = full size, two-pass loudness.',
  inputSchema: { clip_id: z.string(), quality: z.enum(['preview', 'final']).default('preview') },
}, wrap(({ clip_id, quality }: { clip_id: string; quality: 'preview' | 'final' }) => {
  const d = load(clip_id);
  const v = verify(d);
  if (!v.pass) return { refused: true, summary: v.summary, note: 'not rendered: fix the plan with plan_edit, then validate_edit.' };
  const r = render(d, quality);
  d.renders.push({ quality, path: r.path, at: new Date().toISOString(), loudness: r.loudness });
  save(d);
  return { path: r.path, seconds_to_render: Math.round(r.seconds), loudness: r.loudness, steps: r.log, credits: r.credits.length ? r.credits.map(c => `Show this credit with the video: ${c}`) : undefined };
}));

// 7 ── undo
server.registerTool('undo', {
  title: 'Undo the last plan change',
  description: 'Restore the plan as it was before the last plan_edit.',
  inputSchema: { clip_id: z.string() },
}, wrap(({ clip_id }: { clip_id: string }) => {
  const d = load(clip_id);
  const prev = d.history.pop();
  if (!prev) return { undone: false, note: 'nothing to undo', plan: d.ops };
  d.ops = prev; delete d.lastValidation; save(d);
  return { undone: true, plan: d.ops };
}));

// 8 ── explain
server.registerTool('explain', {
  title: 'Explain the edit',
  description: 'Why each decision: which library item each op uses (with its provenance), which rules it was checked against, and the last verdict.',
  inputSchema: { clip_id: z.string() },
}, wrap(({ clip_id }: { clip_id: string }) => {
  const d = load(clip_id);
  const w = d.words ?? [];
  const word = (i: number) => (w[i] ? `word ${i} "${w[i].w}" at ${w[i].start.toFixed(2)} s` : `word ${i}`);
  const prov = (id: string) => { const it = byId(id); return it ? `${it.id}: ${it.summary.slice(0, 120)} (from ${it.provenance.source})` : id; };
  const ops = d.ops.map(o => {
    switch (o.op) {
      case 'captions': { const L = w.length ? layout(d, o) : undefined; return { op: o, item: prov(o.look), why: `font ${L?.font.family ?? '?'} from the library at ${L?.px.toFixed(0)} px; block centred at y=${Math.round(anchorY(o.position) * d.clip.height + (o.nudge_px ?? 0))}; cards of ≤ ${capRules().maxWords} words broken at pauses > ${capRules().joinMs} ms (principle/caption-timing)`, rules: ['caption_safe_area', 'caption_face', 'caption_words_per_line', 'caption_min_size'] }; }
      case 'punch_in': return { op: o, item: prov(o.scale === 'subtle' ? 'camera/punch-in' : 'principle/punch-in'), why: `${punchScale(o.scale)}× on ${word(o.at_word)}, centred on the face, snap ease (packages/camera EASES.snap) over 0.25 s, cut back at the sentence end`, rules: ['punch_in_spacing', 'anchors_valid'] };
      case 'cut': return { op: o, why: `removes ${word(o.from_word)} through ${word(o.to_word)}; every later anchor moves with its word`, rules: ['anchors_valid'] };
      case 'sfx': { const s = sfxFor(o.event); return { op: o, item: s ? prov(s.id) : 'none', why: `Style 1 event "${o.event}" plays ${s?.id} at ${s?.levelDb} dB on ${word(o.at_word)} (${s?.why})`, rules: ['sfx_from_style1', 'sfx_spacing'] }; }
      case 'grade': return { op: o, item: prov(o.id), why: 'applied as lut3d from the item\'s .cube', rules: [] };
      case 'music': return { op: o, item: prov(o.id), why: `bed at the item's gainDb, sidechain-ducked under the voice; credit: ${(byId(o.id)?.data as any)?.credit ?? 'none'}`, rules: ['music_under_voice'] };
      case 'hero_word': return { op: o, why: `${word(o.word_index)} drawn at the look's hero scale in its active colour`, rules: ['hero_word_needs_captions'] };
    }
  });
  return { clip: d.clip.path, transcript: d.transcript, face: d.face ?? d.faceNote, ops, last_validation: d.lastValidation ?? 'not validated since the last change', renders: d.renders };
}));

await server.connect(new StdioServerTransport());
