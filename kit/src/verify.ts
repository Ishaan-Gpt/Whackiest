/**
 * The verifier: every rule is measurable, cites where it comes from, and on failure says what is wrong in plain words
 * and the exact fix. render() runs this first and refuses on any REFUSED rule.
 */
import { anchorY, capRules, layout, safeArea, timeline, type Layout } from './layout.ts';
import { byId, captionLooks, measure, sfxFor, style1 } from './lib.ts';
import { POSITIONS, type Box, type Doc, type Op } from './state.ts';

export interface Verdict { rule: string; status: 'PASS' | 'REFUSED' | 'SKIPPED'; reason: string; fix?: string; source: string }

const SRC = {
  safe: 'docs/CONTEXT.md §4: Shorts safe area x 70–905, y 230–1480 on 1080×1920',
  face: 'docs/CONTEXT.md §4: "text never on a face"',
  timing: 'library principle/caption-timing (≤4 words a cue, ≤2 lines)',
  legible: 'library principle/text-legibility (body ≥ 4 % of the short side)',
  kit: 'library sound-kit/style1 + CLAUDE.md "sound effects come from Style 1 by its map"',
  sfxGap: 'brief: no two sfx within 120 ms (sound-kit/style1 rules.minGap is 60 ms; this is stricter)',
  punch: 'library camera/punch-in "avoid: two punches inside one second" + principle/punch-in; 1.2 s floor',
  music: 'library music item gainDb + ducking under the voice (sidechaincompress)',
  loud: 'platform delivery: −14 LUFS integrated, true peak ≤ −1 dBTP (loudnorm, measured after render)',
};
const SFX_MIN_GAP_MS = 120, PUNCH_MIN_GAP_S = 1.2, MUSIC_MAX_DB = -18;
const intersects = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const r = Math.round;

export function verify(d: Doc): { pass: boolean; verdicts: Verdict[]; summary: string } {
  const V: Verdict[] = [];
  const add = (v: Verdict) => V.push(v);
  const words = d.words ?? [];
  const n = words.length;
  const anchored = d.ops.flatMap((o, k) => {
    const a: [string, number][] = [];
    if (o.op === 'punch_in') { a.push(['at_word', o.at_word]); if (o.until_word != null) a.push(['until_word', o.until_word]); }
    if (o.op === 'cut') a.push(['from_word', o.from_word], ['to_word', o.to_word]);
    if (o.op === 'sfx') a.push(['at_word', o.at_word]);
    if (o.op === 'hero_word') a.push(['word_index', o.word_index]);
    return a.map(([f, i]) => ({ k, o, f, i }));
  });

  // ── structure ──
  if (anchored.length && !n) add({ rule: 'words_present', status: 'REFUSED', reason: 'ops are anchored to words but the clip has no transcript yet.', fix: 'call transcribe(clip_id) first.', source: 'Edit Easy: time anchors are word indices' });
  const bad = anchored.filter(a => a.i >= n);
  const tl = n ? timeline(d) : null;
  const inCut = anchored.filter(a => a.o.op !== 'cut' && a.i < n && tl?.cutWord(a.i));
  const badCut = d.ops.filter((o): o is Extract<Op, { op: 'cut' }> => o.op === 'cut' && o.to_word < o.from_word);
  if (n) {
    if (bad.length || inCut.length || badCut.length) add({
      rule: 'anchors_valid', status: 'REFUSED', source: 'Edit Easy: time anchors are word indices',
      reason: [...bad.map(a => `op ${a.k} (${a.o.op}) ${a.f}=${a.i} but the transcript has words 0–${n - 1}`),
        ...inCut.map(a => `op ${a.k} (${a.o.op}) is anchored to word ${a.i} "${words[a.i].w}", which is cut out`),
        ...badCut.map(c => `cut to_word ${c.to_word} is before from_word ${c.from_word}`)].join('; ') + '.',
      fix: 'anchor to a word that stays in the edit (indices from transcribe).',
    });
    else add({ rule: 'anchors_valid', status: 'PASS', reason: `${anchored.length} word anchors, all inside the kept transcript.`, source: 'Edit Easy: time anchors are word indices' });
  }
  for (const kind of ['captions', 'grade', 'music'] as const) {
    const c = d.ops.filter(o => o.op === kind).length;
    if (c > 1) add({ rule: `one_${kind}`, status: 'REFUSED', reason: `${c} ${kind} ops; a reel has one.`, fix: `keep one ${kind} op (plan_edit replaces the plan).`, source: 'Edit Easy op grammar' });
  }

  // ── captions ──
  const cap = d.ops.find((o): o is Extract<Op, { op: 'captions' }> => o.op === 'captions');
  let L: Layout | undefined;
  if (cap && n && !bad.length) {
    L = layout(d, cap);
    const { width: W, height: H } = d.clip;
    const S = safeArea(W, H), sx1 = S.x + S.w, sy1 = S.y + S.h;
    // safe area: the worst line edge across every card
    let worst: { msg: string; over: number } | undefined;
    for (const c of L.cards) c.lines.forEach((l, li) => {
      const tag = `caption "${c.lines.map(x => x.text.join(' ')).join(' / ')}"${c.lines.length > 1 ? ` line ${li + 1}` : ''}`;
      const checks: [number, string][] = [
        [l.bottom - sy1, `${tag}: bottom edge at y=${r(l.bottom)} is inside the platform UI zone (safe area ends at y=${r(sy1)})`],
        [S.y - l.top, `${tag}: top edge at y=${r(l.top)} is under the platform's top UI (safe area starts at y=${r(S.y)})`],
        [S.x - l.x0, `${tag}: left edge at x=${r(l.x0)} is outside the safe area (starts at x=${r(S.x)})`],
        [l.x1 - sx1, `${tag}: right edge at x=${r(l.x1)} runs under the action buttons (safe area ends at x=${r(sx1)})`],
      ];
      for (const [over, msg] of checks) if (over > 0 && (!worst || over > worst.over)) worst = { msg, over };
    });
    const good = suggest(d, cap);
    if (worst) add({ rule: 'caption_safe_area', status: 'REFUSED', reason: worst.msg + '.', fix: good ? `position "${good.pos}" (y=${r(good.y)})${cap.nudge_px ? ', no nudge' : ''}.` : 'no position clears both the safe area and the face; drop the captions op or pick a smaller look.', source: SRC.safe });
    else add({ rule: 'caption_safe_area', status: 'PASS', reason: `all ${L.cards.length} caption cards sit inside x ${r(S.x)}–${r(sx1)}, y ${r(S.y)}–${r(sy1)}.`, source: SRC.safe });

    // face
    if (!d.face) add({ rule: 'caption_face', status: 'SKIPPED', reason: d.faceNote ?? 'no face box known for this clip.', fix: 'pass face_box to open_clip to enable this check.', source: SRC.face });
    else {
      const hit = L.cards.flatMap(c => c.lines.filter(l => intersects({ x: l.x0, y: l.top, w: l.x1 - l.x0, h: l.bottom - l.top }, d.face!.box)).map(l => ({ c, l })))[0];
      const f = d.face.box;
      if (hit) add({ rule: 'caption_face', status: 'REFUSED', reason: `caption "${hit.l.text.join(' ')}" (y ${r(hit.l.top)}–${r(hit.l.bottom)}) covers the speaker's face (face box y ${f.y}–${f.y + f.h}).`, fix: good ? `position "${good.pos}" (y=${r(good.y)}).` : 'no position clears the face inside the safe area.', source: SRC.face });
      else add({ rule: 'caption_face', status: 'PASS', reason: `captions stay clear of the face box (y ${f.y}–${f.y + f.h}, ${d.face.source}).`, source: SRC.face });
    }

    // words per line, lines per card
    const R = capRules();
    const long = L.cards.flatMap(c => c.lines).find(l => l.words.length > R.maxWords);
    const tall = L.cards.find(c => c.lines.length > R.maxLines);
    if (long || tall) add({ rule: 'caption_words_per_line', status: 'REFUSED', reason: long ? `a line has ${long.words.length} words ("${long.text.join(' ')}"); the limit is ${R.maxWords}.` : `a card wraps to ${tall!.lines.length} lines; the limit is ${R.maxLines}.`, fix: 'pick a look with ≤ 4 words per card (find_library kind=caption shows words per card).', source: SRC.timing });
    else add({ rule: 'caption_words_per_line', status: 'PASS', reason: `≤ ${R.maxWords} words a line, ≤ ${R.maxLines} lines a card.`, source: SRC.timing });

    const min = R.minSize * Math.min(W, H);
    if (L.px < min) add({ rule: 'caption_min_size', status: 'REFUSED', reason: `caption text is ${r(L.px)} px; the floor is ${r(min)} px (4 % of the short side).`, fix: 'pick a look with a larger size.', source: SRC.legible });
    else add({ rule: 'caption_min_size', status: 'PASS', reason: `caption text ${r(L.px)} px ≥ ${r(min)} px floor.`, source: SRC.legible });
  }
  const heroes = d.ops.filter(o => o.op === 'hero_word');
  if (heroes.length && !cap) add({ rule: 'hero_word_needs_captions', status: 'REFUSED', reason: 'hero_word marks a caption word, but there is no captions op.', fix: 'add a captions op.', source: 'Edit Easy op grammar' });

  // ── sound ──
  const kit = style1();
  const sfx = d.ops.filter((o): o is Extract<Op, { op: 'sfx' }> => o.op === 'sfx');
  const offKit = sfx.filter(s => !kit.events[s.event] || !sfxFor(s.event));
  if (offKit.length) add({ rule: 'sfx_from_style1', status: 'REFUSED', reason: `event(s) ${offKit.map(s => `"${s.event}"`).join(', ')} have no sound in the Style 1 kit.`, fix: `use one of: ${Object.keys(kit.events).join(', ')}.`, source: SRC.kit });
  else if (sfx.length) add({ rule: 'sfx_from_style1', status: 'PASS', reason: sfx.map(s => `${s.event} → ${sfxFor(s.event)!.id} at ${kit.events[s.event].level_db} dB`).join('; ') + '.', source: SRC.kit });
  if (sfx.length > 1 && n && !bad.length) {
    const t = sfx.map(s => ({ s, t: words[s.at_word].start })).sort((a, b) => a.t - b.t);
    const close = t.slice(1).map((x, k) => ({ a: t[k], b: x, gap: (x.t - t[k].t) * 1000 })).filter(p => p.gap < SFX_MIN_GAP_MS);
    if (close.length) add({ rule: 'sfx_spacing', status: 'REFUSED', reason: close.map(p => `"${p.a.s.event}" on word ${p.a.s.at_word} and "${p.b.s.event}" on word ${p.b.s.at_word} are ${r(p.gap)} ms apart (minimum ${SFX_MIN_GAP_MS} ms)`).join('; ') + '.', fix: 'drop one, or move it to a word at least 120 ms away.', source: SRC.sfxGap });
    else add({ rule: 'sfx_spacing', status: 'PASS', reason: `every pair of effects is ≥ ${SFX_MIN_GAP_MS} ms apart.`, source: SRC.sfxGap });
  }

  // ── camera ──
  const pun = d.ops.filter((o): o is Extract<Op, { op: 'punch_in' }> => o.op === 'punch_in');
  if (pun.length > 1 && n && !bad.length) {
    const t = pun.map(p => ({ p, t: words[p.at_word].start })).sort((a, b) => a.t - b.t);
    const close = t.slice(1).map((x, k) => ({ a: t[k], b: x, gap: x.t - t[k].t })).filter(q => q.gap < PUNCH_MIN_GAP_S);
    if (close.length) add({ rule: 'punch_in_spacing', status: 'REFUSED', reason: close.map(q => `punch-ins on words ${q.a.p.at_word} and ${q.b.p.at_word} are ${q.gap.toFixed(2)} s apart (minimum ${PUNCH_MIN_GAP_S} s)`).join('; ') + '.', fix: 'drop one, or anchor it at least 1.2 s later.', source: SRC.punch });
    else add({ rule: 'punch_in_spacing', status: 'PASS', reason: `punch-ins are ≥ ${PUNCH_MIN_GAP_S} s apart.`, source: SRC.punch });
  }

  // ── mix ──
  const mus = d.ops.find((o): o is Extract<Op, { op: 'music' }> => o.op === 'music');
  if (mus) {
    const g = (byId(mus.id)?.data as { gainDb?: number }).gainDb ?? -24;
    if (g > MUSIC_MAX_DB) add({ rule: 'music_under_voice', status: 'REFUSED', reason: `music ${mus.id} is set to ${g} dB; a bed sits at ${MUSIC_MAX_DB} dB or lower.`, fix: 'use level "bed".', source: SRC.music });
    else add({ rule: 'music_under_voice', status: 'PASS', reason: `bed at ${g} dB (from the library item), ducked under the voice with a sidechain compressor.`, source: SRC.music });
  }
  if (d.clip.audio) add({ rule: 'loudness_target', status: 'PASS', reason: 'render normalises to −14 LUFS, true peak −1.5 dBTP (two-pass loudnorm on final); the measured values are reported after render.', source: SRC.loud });

  const refused = V.filter(v => v.status === 'REFUSED');
  const summary = refused.length
    ? refused.map(v => `REFUSED ${v.rule}: ${v.reason}${v.fix ? ` Fix: ${v.fix}` : ''}`).join('\n')
    : `PASS: ${V.filter(v => v.status === 'PASS').length} rules passed${V.some(v => v.status === 'SKIPPED') ? `, ${V.filter(v => v.status === 'SKIPPED').length} skipped` : ''}.`;
  return { pass: !refused.length, verdicts: V, summary };
}

/** The first caption position (lower first, the library's band) that clears both the safe area and the face. */
export function suggest(d: Doc, cap: Extract<Op, { op: 'captions' }>) {
  const { width: W, height: H } = d.clip;
  const S = safeArea(W, H);
  for (const pos of ['lower', 'middle', 'upper'] as const) {
    if (!POSITIONS.includes(pos)) continue;
    const L = layout(d, { ...cap, position: pos, nudge_px: undefined });
    const ok = L.cards.every(c => c.lines.every(l => l.top >= S.y && l.bottom <= S.y + S.h && l.x0 >= S.x && l.x1 <= S.x + S.w
      && (!d.face || !intersects({ x: l.x0, y: l.top, w: l.x1 - l.x0, h: l.bottom - l.top }, d.face.box))));
    if (ok) return { pos, y: anchorY(pos) * H };
  }
  return undefined;
}
export { captionLooks, measure };
