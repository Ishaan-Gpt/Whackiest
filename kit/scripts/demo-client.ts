/**
 * End-to-end test of the AFTER flow, driving the real server over stdio with the MCP SDK client, the way Claude Desktop
 * does: open → transcribe → find_library → plan_edit with a deliberately unsafe caption position → validate (must
 * REFUSE) → plan the fix → validate (must PASS) → render final.
 *
 *   npx tsx scripts/demo-client.ts <clip.mp4> [--words words.json] [--quality preview|final]
 */
import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const argv = process.argv.slice(2);
const clip = resolve(argv[0] ?? '../out/raw-talking-9x16.mp4');
const wordsJson = argv.includes('--words') ? argv[argv.indexOf('--words') + 1] : undefined;
const quality = argv.includes('--quality') ? argv[argv.indexOf('--quality') + 1] : 'final';

const transport = new StdioClientTransport({ command: process.execPath, args: ['--import', 'tsx', resolve(import.meta.dirname, '../src/server.ts')], stderr: 'inherit' });
const client = new Client({ name: 'edit-easy-demo', version: '0.1.0' });
await client.connect(transport);

const call = async (name: string, args: Record<string, unknown>) => {
  const r = await client.callTool({ name, arguments: args });
  const t = (r.content as { type: string; text: string }[]).map(c => c.text).join('\n');
  console.log(`\n── ${name} ${JSON.stringify(args).slice(0, 160)}${r.isError ? '  [ERROR]' : ''}\n${t.length > 1800 ? t.slice(0, 1800) + ' …' : t}`);
  if (r.isError) throw new Error(t);
  return JSON.parse(t);
};

const tools = await client.listTools();
console.log('tools:', tools.tools.map(t => t.name).join(', '));

const o = await call('open_clip', { path: clip, reset: true });
const id = o.clip_id;
const tr = await call('transcribe', wordsJson ? { clip_id: id, words_json_path: wordsJson } : { clip_id: id });
const words: string[] = tr.transcript.split(' ').map((s: string) => s.slice(s.indexOf(':') + 1));
const at = (re: RegExp, from = 0) => { const i = words.findIndex((w, k) => k >= from && re.test(w)); if (i < 0) throw new Error('word not found ' + re); return i; };

const caps = await call('find_library', { kind: 'caption', text: 'yellow outline bold', limit: 5 });
await call('find_library', { kind: 'sfx_event', limit: 6 });
const grade = await call('find_library', { kind: 'grade' });
const mus = await call('find_library', { kind: 'music' });
const look = caps.menu[0].id;

// the "model's" picks: menus and word indices only
const firstKeep = at(/^just$/i);                         // the clip opens mid-sentence: cut "really important for me,"
const planet = at(/^planet\.?$/i);
const took = at(/^took$/i);
const persp = at(/^perspective$/i);
const plan = (position: string) => [
  { op: 'cut', from_word: 0, to_word: firstKeep - 1 },
  { op: 'captions', look, position, size: 'large' },
  { op: 'punch_in', at_word: at(/^rolling$/i), scale: 'subtle' },
  { op: 'punch_in', at_word: took, scale: 'strong' },
  { op: 'sfx', event: 'scene', at_word: planet + 1 },
  { op: 'sfx', event: 'key-word', at_word: persp },
  { op: 'hero_word', word_index: persp },
  { op: 'grade', id: grade.menu[0].id },
  { op: 'music', id: mus.menu[0].id, level: 'bed' },
];

await call('plan_edit', { clip_id: id, ops: plan('bottom_edge') });
const bad = await call('validate_edit', { clip_id: id });
if (bad.verdict !== 'REFUSED') throw new Error('expected the verifier to refuse bottom_edge');
console.log('\n>>> REFUSAL SHOWN TO THE MODEL:\n' + bad.summary);
const refusedRender = await call('render', { clip_id: id, quality: 'preview' });
if (!refusedRender.refused) throw new Error('render should refuse an unverified plan');

await call('plan_edit', { clip_id: id, ops: plan('lower') });
const good = await call('validate_edit', { clip_id: id });
if (good.verdict !== 'PASS') throw new Error('fix did not pass');
await call('explain', { clip_id: id });
const out = await call('render', { clip_id: id, quality });
console.log('\nRENDERED:', out.path);
await client.close();
