# Film v5 brief: "Edit Easy" hackathon film, narrated by Moovi (read fully before you start)

**Deadline:** your act must be finished, with frames checked, within **55 minutes** of starting. A finished good act
beats an unfinished great one. Ishaan (the owner) judges taste harshly: anything that looks like a generic AI
explainer (cards on a grid, centred bullet text, stock gradients, floating chips) is a 0/10.

## The film
A ~3:20 hackathon film for "Edit Easy", an MCP server that turns the AI you already use (Antigravity, Claude, Gemini)
into a video editor: you just talk on camera, drop in the raw footage, and a finished, edited clip comes back. It runs:
hook (already made) → A attention → B nobody's an editor → C Moovi becomes the editor → D any AI connects → E how it
works inside → F one frame explodes → G the refusal and the close. Each act is its own page; they're cut together with
the voice afterwards, so **your act must start and end on a clean, calm frame** (no half-finished motion at t=0 or at
t=dur).

## The narrator: Moovi
A 3D jelly creature with only two big glossy navy eyes (no mouth), little gooey nubs for hands and feet, and a floating
jelly wheel-halo. He's rendered by a real raymarched SDF shader, deterministic per frame:
```js
import { MooviFilm } from '../moovi-film.js';
const m = new MooviFilm(512);           // one square transparent WebGL2 canvas, 512 px; ~0.18 s per render
const cv = m.render(t, { wave, frame, think, morph, direct, celebrate, squint, lean, look:[x,y], hop, squash, turn, blink, shadow });
ctx.drawImage(cv, x, y, w, h);           // composite him anywhere, any size (he includes a soft contact shadow)
```
Pose weights are 0..1 and you blend them yourself over time with easing (e.g. `wave: ease(clamp((t-2)/0.4))`).
`direct` = reaches out right to point; `frame` = director's frame with both nubs; `think` = halo spins and bridges to
his head; `celebrate` = both nubs up, big bounces; `morph` = his whole body becomes a jelly play button (eyes stay);
`look` = eyes/body look toward a point; `hop` lifts him (body units, ~0.3 is a jump); `squash` is a landing squash
impulse (-1..1); `turn` yaws his body. **Physics must feel real:** anticipation before a hop, squash on landing, overshoot
and settle (damped springs: `x(t) = 1 - e^{-kt} cos(wt)`), never linear moves, never pops. Render him **once per
frame at most twice** (each render costs ~0.18 s). Size him so he reads (300-560 px tall on the 1280×720 frame).
Palette: icy white `#F7FAFD`, ice blue `#CFE6F7`, navy ink `#0E1A2B`, iris blue `#5B7CFA`; one warm accent allowed per
act for the world (chai, a red refusal).

## Two narrating styles (Ishaan's direction)
1. **IN-WORLD:** Moovi stands inside the place he's talking about, at real scale, with the world built around him in
   depth (parallax layers, a ground plane, his contact shadow on it, depth-of-field blur on far layers, light
   sources that flare). E.g. beside a chai stall with a steaming kettle, in front of a coaching class whiteboard, next
   to a phone with a feed scrolling.
2. **STUDIO:** seamless warm-white infinite cove (`#F4F5F7` to `#E9ECF1` floor gradient, a soft horizon), Moovi with his
   soft shadow, sometimes sitting on a simple designed chair; around him, the relevant images, UI, tools and logos
   arrive with proper easing (expo/back), motion blur (draw 4-6 subframes at falling alpha, or `ctx.filter='blur()'`
   along the move), light flares, rack-focus blur. Things enter from depth (scale + blur → sharp), never pop.

## Craft rules (from Ishaan's motion skill; obey all)
- **What is said is what's seen.** Every noun in the line appears on screen at the moment it's spoken (timings below).
- **Fast-paced but smooth:** a new visual idea every ~1.5-3 s, cuts on motion, dynamic camera (push-ins, whip pans with
  directional blur, parallax dollies, a slow log-space zoom); the camera is never dead still and never jittery.
- **No numbers on screen** (no counts, no stats); no fake metrics. Words on screen only as UI or as one big keyword at a
  time, centred or locked to an object, in "Inter Tight" 600-800 or "Instrument Serif" italic for one emphasis word.
- No floating chips/pills, no bullet lists, no explainer cards on a grid, no emoji.
- UI must look like real, well-designed product UI (rounded 12-20 px, real spacing, subtle shadows), simplified.
- Logos: `/hackathon/whackiest-2026/film-v2/icons/{claude,googlegemini,instagram,youtube,whatsapp}.svg` (simple-icons,
  CC0, single-colour paths: load as Image and tint). There is no Antigravity icon: write "Antigravity" as a clean
  wordmark beside a neutral rocket-ish arc glyph you draw (don't imitate Google's branding).
- Footage stills you can use as "raw take" / "finished clip" frames: `/hackathon/whackiest-2026/out/v3/tex/raw-*.jpg`
  (flat, ungraded) and `ed-*.jpg` (edited, captioned). Treat them as the user's clip.
- Deterministic: `frame(t)` must draw the same image for the same t regardless of call order. No `Math.random()` (use a
  seeded hash), no `performance.now()`, no state carried between frames.

## Files and tools
- Write your act as `film-v5/acts/<name>.js`: `export default { dur, async init(canvas), frame(t) }`. Draw into the
  1280×720 canvas (2D context; you may use three.js on your own offscreen canvas and drawImage it; the importmap has
  `three` and `three/addons/`). See `acts/_demo.js`.
- Check frames: `cd film-v5 && node grab.mjs <name> ../out/v5/frames/<name>/f 0.5 3 6 ...` → JPEGs and a contact sheet
  `f-sheet.jpg`; **look at them with the Read tool** and fix what's wrong. Never render MP4s (the lead renders).
- Rendering cost: keep a frame under ~0.4 s (one Moovi render + 2D drawing is fine; avoid huge blur filters on full
  frames every subframe).
- Don't edit `moovi-film.js`, `_act.html`, `grab.mjs`, `render.mjs`, or anyone else's act. Don't commit; the lead does.

## Deliverable (your final message)
1. The act file path(s) and `dur`.
2. **Four key frames per act** at its strongest moments plus the contact sheet path, and the timestamps.
3. One line per known weakness. Be honest; don't oversell.

## UPDATE: the STUDIO look now follows Ishaan's reference (overrides the studio notes above)
Reference frame: `/home/user/EditEasy/hackathon/whackiest-2026/out/v5/ref/reference-frame.jpg` (look at it). Why it works:
1. **Pure white world made real by ONE hard key light**: the subject sits on a black canvas-and-wood **director's chair**
   (crossed legs, two arm rests, canvas back) and throws a **long, crisp-edged grey cast shadow down-right** onto the
   white floor. No cove gradient, no soft vignette: pure `#FFFFFF`-ish with that one hard shadow (draw Moovi's and the
   chair's shadows as a sheared, darkened silhouette of the composite, slightly blurred at the far end).
2. **Typography speaks software:** a **pixel/bitmap font ("Silkscreen", loaded in `_act.html`, weights 400/700)** for
   the kinetic words, lowercase, black, big; supporting labels small.
3. **One neon accent marks the change:** lime highlighter `#D9F56B` behind labels; the old thing is struck through on a
   paler lime label, the new thing sits on a solid lime label beneath it, with a tiny 3-tick sparkle.
4. **Pixel progress bars** (a row of black squares filling one by one, outlined empty squares) show things happening.
5. **Depth by text BEHIND the subject:** a giant pale-grey (`#E2E2E2`) pixel word sits behind Moovi/the chair and is
   partly covered by him.
6. **Composition:** subject centred-low; graphics stacked top-left; words animate in like typing (character by character
   with a block cursor) or snap in with a 2-frame pixel glitch, never a soft fade.
Keep it **no numbers** (no "100%"): use words ("manual editing" struck → "done for you").
Moovi is the subject; when seated, put him on the director's chair. IN-WORLD acts keep their worlds, but may borrow the
lime label + pixel type for the one keyword per beat.

## ROUND 2 (v6): Ishaan's notes, all binding. Deadline: 40 minutes from when you read this.
Ishaan: "animations are good", but (1) the voice had long pauses and the picture sat still for 5-10 s at a time
("stuck in a place with less frames"), (2) beats jumped A → Z with no connection, (3) Moovi never introduced himself and
the MCP/architecture had no real place.
1. **The voice is now continuous.** Each act has ONE take that runs nearly its whole length. Your act's new `dur`, and
   the exact start/end time of every spoken word inside your act, are in `film-v5/vo-v6.json` (`words[].t` = when the word
   starts, already offset into your act). **Re-time every visual beat to those word stamps**: the thing named appears
   on its word, not before, not 2 s later. Set `dur` to the value in the JSON exactly. The new lines differ from round 1;
   read yours there and in `SCRIPT-V6.md`.
2. **No dead frames, ever.** Something new must happen at least every ~1 s (a new element, a label snapping, a camera
   move changing direction, Moovi reacting: a nod/hop/look/point/blink-squash, particles, a progress bar ticking). The
   camera is always drifting/pushing (slow log-space push or parallax) and never holds; no stretch longer than ~1.2 s may
   look like a still. Add more graphics and more action than round 1; keep the same look.
3. **Flow, not jumps.** Every transition is a motivated move: a whip pan with directional blur, a push through an
   object, a match cut on shape (a circle becomes the halo, a card becomes the next scene), an element carried from one
   beat into the next. Your act's first frame must continue from the previous act's last frame and its last frame lead
   into the next act (order: hook → a_attention → b_noeditor → c_morph → d_anyai → h_arch → e_inside → f_explode → g_close).
4. **Moovi talks.** He is the narrator: while a word is spoken he's alive (small bounce on stressed words, eyes looking
   at what he's talking about, nubs gesturing). Don't leave him idle.
5. Check by grabbing a dense strip (e.g. every 0.5 s for a 6 s window) to prove nothing sits still, then the four key
   frames. Report as before.
