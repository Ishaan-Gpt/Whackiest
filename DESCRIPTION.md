# Edit Easy: the MCP that edits

**wHACKiest 2026 · Track 1 "Make MCP Matter" · Less magic, more utility.**

Everything needed to fill the official 8-slide template is below, in the template's own order and words: title,
Problem Statement, Proposed Solution, Tech Stack, Process Flow / Architecture, Novelty / Innovation, Impact &
Feasibility, Business Model. Each section opens with a one-line answer for the slide, followed by the detail to pick from.
Tags in brackets say what is true today:
- **[built]**: works now in the prototype in this repo.
- **[library]**: exists today as our library or motion kit.
- **[hack day]**: planned for the 24-hour build on 1 December.

The track asks for *"an MCP-powered solution a regular person would actually use every day: intelligent agents that
work with the apps, services and tools people already rely on … useful, reliable and controlled interactions that make
everyday tasks simpler."* Every section below answers one of those phrases.

---

## Slide 1 · Title

| Field | Value |
|---|---|
| Project | **Edit Easy: the MCP that edits** |
| Tagline | *Talk to the camera. Your AI hands back a finished reel.* |
| Track | **1 · Make MCP Matter** |
| Team name / college / team ID / members / USNs | *(fill in: Ishaan + team, 2–4 members from one college)* |
| Mascot | **Moovi**, the jelly editor who narrates the demo film |

---

## Slide 2 · Problem Statement

**The problem in one line:** every business now lives on short video, but editing is the one everyday skill AI still
hasn't handed to normal people, so the clips they shoot sit unposted in their gallery.

**Who it affects, and how many:**
- **Small businesses on WhatsApp and Instagram.** India's chai stalls, salons, kirana stores, home bakers and
  tuition/coaching classes. The WhatsApp Business app alone is used by about 15 million Indian small businesses
  (Outlook Business), and Meta reported more than 200 million monthly Business-app users worldwide (2023).
- **Creators, students, teachers and startups** who must post regularly to be seen. None of them are editors.
- **The audience is already there:** 97% of surveyed Indian internet users watch video on Meta's platforms every day,
  98% urban and 94% rural (Meta-commissioned IPSOS study, 2026). On Reels, 81% say it drives product discovery and 47%
  say it influences what they buy. 91% of online adults in India chat with a business every week (Kantar 2025, cited by
  Meta).

**Why it matters (real example):** a shop owner films a good 40-second clip of the morning rush. Opening CapCut or
Premiere shows a timeline with hundreds of tiny buttons. Asking ChatGPT how to edit it returns ten steps of homework
("import the clip, add captions, keep them inside the safe area …"). So the clip sits in the gallery, the post never
goes out, and the attention goes to the competitor who did post. Attention is the currency, and editing is the toll
gate.

**Existing solutions and their gaps:**

| Today's option | What it does | The gap |
|---|---|---|
| Pro editors (Premiere, DaVinci, CapCut desktop) | everything | a skill most people will never learn; hours per reel |
| Template apps (CapCut templates, InShot) | one-tap looks | generic; ignores what was said; text lands on faces and under app buttons |
| Chatbots (ChatGPT, Gemini, Claude) on their own | advice | can't touch the file: they hand back homework, not a video |
| Hosted video MCPs (Tella, invideo, OpusClip, Descript, Kapwing, Reap, Submagic, Shotstack, HeyGen …; 20+ in Nov 2026) | let an AI drive a cloud editor | **none checks the AI's edit or refuses a broken one**; most are credit-priced; footage leaves your device; the AI writes raw coordinates and timings, so it guesses |

---

## Slide 3 · Proposed Solution

**One line:** Edit Easy is an MCP server that turns the AI you already use (Claude, ChatGPT, Gemini, Antigravity, or
a free local model) into a real, reliable video editor. You drop in a raw clip, ask in plain words, and get back a
finished reel that has been checked against an editor's rules before a single frame is rendered.

**The idea in three sentences (from the film's script):** You just talk to the camera and be yourself. Your AI picks
the edit from menus built out of a hand-collected taste library, every edit is pinned to a word you said, and a
verifier stops anything a good editor never would. It renders on your own machine, so it's private and free.

### Key features (with real tool and library names)

The finished reel is far more than captions and a zoom. The AI composes every layer of a professional short:

| Layer | What the AI can do through Edit Easy | Where it comes from |
|---|---|---|
| **Cut** | remove filler and dead air ("um", long pauses); jump-cut reframes; pacing to a rhythm floor | `plan_edit` cut ops anchored to word indices **[built]**; pace + principle items **[library]** |
| **Captions** | 158 caption looks × 49 caption animations, hero-word emphasis, safe-area and face-aware placement | `library/caption`, `library/caption-animation` **[built: exposed via `find_library`]** |
| **Camera** | 64 camera moves as code: punch-in/out, dolly, crash zoom, whip pan, orbit, crane, roll, rack focus, speed ramp, handheld, snorricam, dolly-zoom, Ken Burns … | `library/camera` (64 items) **[library]**; punch-in **[built]** |
| **Effects** | ~50 motion effects: word rise/elastic/slam/slide, typewriter, pop/glide/slam-in, glow bloom, shatter, strike-drop, highlight sweep, marker loop, click ripple, cursor move, progress fill, odometer count, stamp slam, coin flip, shine sweep, spark ring, contact shadow, grain + vignette, motion blur, clip grade | Style 1 motion kit **[library]**, wired as an `effect` op **[hack day]** |
| **UI components** | ~60 animated UI pieces dropped onto the video on a word: phone, browser, laptop, lock screen, notification, chat bubble, voice note, comment feed, Instagram reply sticker, search bar, typing box, cursor, CTA pill, progress pill, highlighter, selection ring, focus brackets, loupe, checklist, sticky note, receipt, stamp, seal, coin, price tag, editor timeline, 3D number, flip board, countdown, file and dropzone, colour swatch, shield, bookmark, paper plane, reel UI, logo grid, icon ring, deck, carousel … | Style 1 kit `ui` + 33 parametric props **[library]**, wired as a `graphic` op **[hack day]** |
| **Transitions** | push-through, pull-out reveal, hard cut on the beat, riser into cut, shatter out, collapse to a point, search-to-site, page dissolve, line swap, zoom-out open, hard reframe, mono aside, picture-in-picture morph | 19 kit transitions + 3 `library/transition` items **[library]** |
| **Scene recipes** | 40 proven beat templates: hook claim / question / stack-slam / lock-screen story, problem bill / reject list / trap / crash, explain-by-annotation, steps list, looks grid, stat reveal, proof coin / seal / export, compare plain-vs-styled, demo trio / browser flow / phone hero, social logos / comments / reply, notification landing, CTA comment / save-share, outro logo land / follow | Style 1 `scenes` **[library]** as one-call `apply_recipe` **[hack day]** |
| **Sound** | 27 designed sound effects in the Style 1 sound kit with an event map (whoosh on a cut, pop on a caption, hit on a sentence end), spaced ≥ 120 ms, plus a music bed ducked under the voice | `library/sfx`, `library/sound-kit`, `library/music`, `library/mix-profile` **[built]** |
| **Look** | 21 licensed fonts, the Natural Punch grade, 11 backgrounds, 8 visual kits (crimson poster, golden hand, launch, launch UI, level ladder, motion, night glass, red table) | `library/font`, `library/grade` **[built]**; kits **[library]** |
| **Loudness** | final mix normalised to −14 LUFS, true peak −1.5 dBTP (platform standard) | `render` two-pass loudnorm **[built]** |

### Plus the parts that make it "controlled and reliable"

- **Menus, not freedom:** the AI never writes a coordinate, a timing or a colour. It picks named items from short menus
  that `find_library` generates from the library, so it can be creative without ever being able to guess.
- **Word-anchored edits:** every op is pinned to a word index (`@word(12)`), so cutting a word moves its caption, zoom,
  effect and sound with it. Nothing drifts.
- **A verifier in the loop:** 13 measurable rules run on every plan. On failure the AI gets a plain-English reason and
  the exact fix, then repairs its own plan. `render` refuses until everything passes. Example from the prototype:
  *"REFUSED caption_safe_area: caption bottom at y 1789 is under the app's buttons (limit 1480). Fix: position lower
  (y=1344)."*
- **Undo and explain:** `undo` rolls back any step, and `explain` tells the user, in plain words, why each layer is
  there.

### User flow

1. **Connect once:** add Edit Easy to Claude Desktop / ChatGPT / Gemini / Antigravity as an MCP server (one config
   line, local stdio), or use the remote endpoint **[hack day]**.
2. **Drop the clip:** a phone video from the gallery, Drive or WhatsApp. *"Make this a punchy reel for my chai stall,
   captions in Hindi-English."*
3. **The AI works through the tools:**
   - `open_clip` → `transcribe` (local, word timestamps);
   - `find_library` (menus of looks, moves, effects, UI and sounds);
   - `plan_edit` (typed ops pinned to words);
   - `validate_edit` (refused, then fixed, then PASS);
   - `render`.
4. **Get the reel:** an MP4 on your machine, 1080×1920, captioned, graded, scored, loudness-matched, with a short
   explanation of each choice.
5. **Post:** to Instagram / YouTube Shorts / WhatsApp Status **[hack day: share step]**. Tweak in plain words ("bigger
   captions", "less zoom"), or `undo`.

### What we build in the 24 hours (MVP)

| Hours | Gate (what must work) | Fallback |
|---|---|---|
| 0–4 | the spine end to end on 3 real clips: open → transcribe → find → plan → validate → render | the prototype in this repo already passes this |
| 4–10 | new op kinds: `graphic` (UI components), `effect`, `transition`, `camera_move` (all 64), `apply_recipe`, each with its own verifier rules (graphic inside safe area, never on the face, effects spaced, one transition per cut) | ship `graphic` + `camera_move` only |
| 10–16 | apps layer: clip in from Drive/WhatsApp share, reel out to YouTube/Instagram share sheet, optional ElevenLabs voice-over with the user's own key; remote MCP endpoint on AWS | local only |
| 16–20 | proof: blind side-by-side on 5 clips ("raw prompt" vs "through Edit Easy"), and counts of safe-area / face / loudness violations before and after the verifier | report what we measured, honestly |
| 20–24 | demo rehearsal, README, nothing new | — |

---

## Slide 4 · Tech Stack

| Layer | Tool | Why we picked it |
|---|---|---|
| **AI (brain)** | the user's own: Claude, ChatGPT, Gemini, Antigravity, or a local model via Ollama | zero cost to us, no lock-in; MCP makes them interchangeable |
| **Protocol** | **Model Context Protocol**, official TypeScript SDK (`@modelcontextprotocol/sdk`), stdio + Streamable HTTP | the open standard every major AI app now speaks |
| **Server** | Node 22, TypeScript, `zod` schemas for every tool input | typed ops the model can't malform; schema errors come back as fixes |
| **Edit model** | our own edit document: typed ops anchored to word indices, with history for `undo` | edits survive cuts; diffable; explainable |
| **Speech-to-text** | `faster-whisper` on the CPU (word timestamps) | local, free, private; no API key |
| **Taste library** | `library/<kind>/<slug>/` items with provenance and licence (`pnpm lib:check`), plus the Style 1 motion kit | taste as data, not hard-coded; every look is citable |
| **Verifier** | pure TypeScript rules (safe area 70–905 × 230–1480 on 1080×1920, face box, words per line, min text size, sfx spacing, punch-in spacing, music level, loudness) | deterministic, testable, explains itself |
| **Render** | `ffmpeg` (cut, overlay, `loudnorm` two-pass, sidechain ducking), and headless Chromium + canvas / three.js for motion graphics and UI components, frame-deterministic | runs on any laptop, no GPU, no cloud bill |
| **Face-aware layout** | face box from the client (prototype); on-device face detection (MediaPipe) **[hack day]** | captions and UI never cover the speaker |
| **Voice-over (optional)** | ElevenLabs with the user's own key **[hack day]** (sponsor) | narration and dubbing for people who won't speak on camera |
| **Cloud (optional)** | AWS: remote MCP endpoint (Lambda/ECS) + S3 for uploads **[hack day]** (sponsor) | for phone-only users without a laptop |
| **Apps around it** | Google Drive, WhatsApp share in; YouTube Shorts, Instagram Reels, WhatsApp Status out **[hack day]** | "work with the apps people already rely on" |

---

## Slide 5 · Process Flow / Architecture

**Process flow, from input through processing to output:**

```
INPUT                     PROCESSING (Edit Easy MCP server, on your machine)                        OUTPUT
raw phone clip  ──►  open_clip ──► transcribe ──► find_library ──► plan_edit ──► validate_edit ──► render ──►  finished reel (MP4)
+ plain-words ask        │          (faster-        (menus from       (typed ops      (13 rules:     (ffmpeg +       + explain()
  from your AI           │           whisper,        the taste         pinned to       refuse with    canvas/three   + undo()
                         │           word stamps)    library)          words)          reason + fix)  + loudnorm)
                         └──────────── edit document (ops + history) ◄─────── AI repairs and retries ◄──┘
```

**Architecture diagram** (draw as blocks; labels are the tech):

```
 ┌──────────────── USER ────────────────┐
 │ phone / laptop · gallery · Drive ·   │
 │ WhatsApp                             │
 └──────────────┬───────────────────────┘
                │ clip + "make this a reel"
 ┌──────────────▼───────────────────────┐        ┌──────────────────────────────┐
 │ AI CLIENT (the user's own)           │  MCP   │ EDIT EASY MCP SERVER         │
 │ Claude · ChatGPT · Gemini ·          ├───────►│ Node 22 · TS · MCP SDK · zod │
 │ Antigravity · Ollama                 │◄───────┤ tools: open_clip, transcribe,│
 └──────────────────────────────────────┘ results│ find_library, plan_edit,     │
                                                  │ validate_edit, render, undo, │
                                                  │ explain (+ hack day: graphic,│
                                                  │ effect, transition,          │
                                                  │ camera_move, apply_recipe,   │
                                                  │ share)                       │
                                                  └──┬──────────┬───────────┬────┘
                         ┌───────────────────────────┘          │           └───────────────────────┐
              ┌──────────▼─────────┐         ┌──────────────────▼─────────┐          ┌──────────────▼──────────┐
              │ TASTE LIBRARY      │         │ VERIFIER                   │          │ RENDER ENGINE           │
              │ captions · anims · │         │ safe area · face · words/  │          │ ffmpeg · headless       │
              │ camera · effects · │         │ line · text size · sfx gap │          │ Chromium canvas/three   │
              │ UI · transitions · │         │ · punch-in gap · music     │          │ · loudnorm −14 LUFS     │
              │ recipes · sfx ·    │         │ level · loudness · anchors │          │ · on the user's machine │
              │ fonts · grade      │         │ (refuse + reason + fix)    │          └─────────────────────────┘
              └────────────────────┘         └────────────────────────────┘
   optional:  faster-whisper (local STT) · ElevenLabs (user key, voice-over) · AWS (remote MCP + S3) · Drive/YouTube/IG
```

Data moves as **typed ops**, never pixels: the AI only ever sends names from the menus plus word indices. The server
resolves them to pixels, timings and sounds.

---

## Slide 6 · Novelty / Innovation

**USP:** Edit Easy is the only video MCP where the AI composes from a hand-collected taste library through menus, every
edit is pinned to a spoken word, and a verifier refuses broken edits with a reason. It renders locally for free, with
whatever AI you already use.

**What's new:**
1. **Taste as a library, exposed as menus.** The model chooses from hundreds of curated looks, moves, effects, UI
   components and sounds, each with provenance. It never generates raw parameters, so it can't produce "AI slop".
2. **Word-anchored edit language.** Edits are anchored to word indices, not timestamps, so cuts never desync captions,
   zooms, effects or sounds.
3. **A refusing verifier in the MCP loop.** This is "controlled and reliable" made literal: the AI sees *why* an edit is
   wrong and fixes it itself.
4. **Bring-your-own-AI, local-first, zero cost.** No credits, no upload, no new app to learn.
5. **Explainable output.** `explain` shows the reason behind every layer, as in the film's exploded frame.

**Competitive comparison** (state of the field, November 2026):

| | Edit Easy MCP | Hosted video MCPs (Tella, invideo, OpusClip, Descript …) | CapCut / template apps | Chatbot alone |
|---|---|---|---|---|
| Works with the AI you already use | ✅ any MCP client | ✅ | ❌ | — |
| AI picks from curated taste (no guessing) | ✅ menus from library | ❌ free-form params / internal assistant | ⚠️ fixed templates | ❌ |
| Effects, camera moves, UI components, transitions | ✅ library-backed | ⚠️ varies | ✅ manual | ❌ |
| Edits pinned to spoken words | ✅ | ⚠️ transcript cuts only | ❌ | ❌ |
| Verifies and **refuses** bad edits with a reason | ✅ 13 rules | ❌ none found | ❌ | ❌ |
| Footage stays on your device | ✅ local render | ❌ cloud | ⚠️ | — |
| Cost to the user | **free** | credits / Pro plans | freemium | — |
| Explains every choice | ✅ `explain` | ❌ | ❌ | — |

---

## Slide 7 · Impact & Feasibility

**Impact:**
- **Who benefits:** small businesses, creators, teachers, students and startups that need to post but can't edit; also
  agencies that make reels for local shops (our own agency work for restaurants is where this started).
- **Measurable outcomes** (we will measure on hack day, not guess):
  - time from raw clip to postable reel;
  - violations per reel (captions under app buttons, text on faces, clashing sounds, loudness off target) before and
    after the verifier;
  - a blind preference test of "raw prompt" vs "through Edit Easy" on 5 real clips.
- **Scalability:** the library grows by adding items, not code. Every new look, effect or UI component becomes a new
  menu option for every AI, and the MCP standard means every new AI client works on day one.

**Feasibility:**
- **Technical:** the spine already works in this repo (8 MCP tools, 13 verifier rules, local transcription, ffmpeg render
  with loudness). The motion kit (UI components, effects, transitions, recipes) already exists and renders
  frame-deterministically in headless Chromium. The demo film itself was rendered with this approach: a 3:14 film at
  720p on a 4-core CPU with no GPU.
- **Time:** 24 h covers the new op kinds and the apps layer (see the MVP table); the spine is de-risked.
- **Cost:** ₹0 per reel to the user and to us (their AI, their machine). Optional cloud and voice use their own keys.

**Risks and how we handle them:**

| Risk | Handling |
|---|---|
| The AI picks a bad combination | the verifier refuses with a fix; menus are short; `undo` |
| Slow render on old laptops | render at 720p first, then 1080p; graphics are cached per frame |
| Face detection misses | captions fall back to the safest position; the rule is reported as SKIPPED, never silently passed |
| Library licensing | every item carries provenance and licence; `lib:check` blocks unlicensed media |
| Phone-only users | remote MCP on AWS **[hack day]** |

---

## Slide 8 · Business Model

- **Target customers:** Indian small businesses on WhatsApp Business and Instagram (about 15M on the Business app in
  India), creators and educators, and social-media agencies serving local brands.
- **Revenue model (freemium, the core stays free):**
  - **Free:** the open-source MCP server and core library, local render, any AI.
  - **Pro packs:** premium caption looks, effect kits, UI-component kits, music and sound kits, festival and seasonal
    packs (Diwali, Eid, sale season).
  - **Brand kit:** a business's fonts, colours and logo turned into library items, so every reel is on brand.
  - **Hosted remote MCP** for phone-only users, with a per-month plan and cloud render.
  - **Agency / B2B:** team workspaces, client brand kits, bulk rendering.
- **Go-to-market:**
  - our own agency clients (restaurants and local brands) as the first users;
  - listings in MCP directories and AI connector galleries;
  - the college and creator community;
  - reels made with Edit Easy carry an optional "edited with Edit Easy" end card.
- **Key costs and partners:** library curation, hosting for the remote endpoint; partners: AI clients (MCP), ElevenLabs
  (voice), AWS (hosting).
- **Sustainability / growth:** every pack sold funds more taste in the free library; a contributor marketplace lets
  editors sell their own looks as library items.

---

## Demo film (3–5 min, for the submission video)

- **The film:** *"Edit Easy · narrated by Moovi"*, 3:14 at 720p (`film/`), covering problem → solution → architecture
  in the order the submission asks for.
- **The story:**
  - Hook: "Building software is dead in 2026, if you can't get it seen."
  - Attention is the new currency: chai stall → online shop → coaching class → startup → salon.
  - Nobody's an editor.
  - Moovi introduces himself and morphs into the editor.
  - Any AI plugs into the MCP.
  - The architecture as one studio line, from request to "passed", rendered locally, private and free.
  - Word-pinned edits and taste menus.
  - The exploded frame.
  - The refusal.
  - Close: "Edit Easy, the MCP that edits."
- **Made with:** a code-native pipeline (canvas / three.js, deterministic per frame) with a Fish Audio voice. It's the
  same kind of motion graphics, UI components and effects the library gives every user.

## Links

- Repo: `github.com/Ishaan-Gpt/whackiest` (this repo): the MCP kit (`kit/`), the film source (`film/`), this
  description.
- Video: *(YouTube link, unlisted)*
- PPT: *(Drive link, "anyone with the link")*

## Sources

- Meta (IPSOS) "Reels is shaping India's video-first future", June 2026: 97% / 98% / 94% daily video; 81% discovery,
  47% purchase influence. about.fb.com/news/2026/06/reels-is-shaping-indias-video-first-future-across-gen-z-women-bharat/
- Meta "Business AI on WhatsApp for small businesses in India", May 2026: 91% of online adults chat with a business
  weekly (Kantar 2025). about.fb.com/news/2026/05/introducing-business-ai-on-whatsapp-for-small-businesses-in-india/
- Outlook Business: WhatsApp Business used by 15 million Indian small businesses; Meta: 200M+ monthly Business-app users
  (2023).
- Tella, "The Best MCP Servers for Video Editing in 2026" (Nov 2026); invideo MCP; OpusClip "10 best video editing MCP
  servers" (Nov 2026): the field map used in the comparison.
