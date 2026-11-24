# Edit Easy MCP · wHACKiest 2026 (Track 1: Make MCP Matter)

**Talk to the camera. Your AI hands back a finished reel.** Edit Easy is an MCP server that turns the AI you already use
(Claude, ChatGPT, Gemini, Antigravity, or a local model) into a reliable video editor: the AI picks from menus built out of
a hand-collected taste library, every edit is pinned to a spoken word, and a verifier refuses broken edits with a reason
and a fix before anything renders. Rendering is local and free.

- **[DESCRIPTION.md](DESCRIPTION.md)**: the full project description, slide by slide (problem, solution, tech stack,
  architecture, novelty, impact and feasibility, business model).
- **`kit/`**: the MCP server (8 tools: `open_clip`, `transcribe`, `find_library`, `plan_edit`, `validate_edit`, `render`,
  `undo`, `explain`; 13 verifier rules) and a scripted demo client.
- **`library/`**: the taste library the menus are built from (caption looks and animations, camera moves, sound effects
  and kits, fonts, grade, transitions, principles), each item with provenance and licence.
- **`film/`**: the source of the 3:14 demo film (canvas / three.js acts narrated by Moovi, deterministic per frame) and its
  script. Its pages expect to be served from the Edit Easy repo layout.

## Run it (Node 22, ffmpeg; faster-whisper optional for local transcription)

```bash
cd kit && npm install
npm run demo        # drives the server over MCP stdio: open → transcribe → find → plan → REFUSED → fix → PASS → render
```

Put a vertical talking clip at `out/raw-talking-9x16.mp4` first. To use it from Claude Desktop, see `kit/README.md` for the
config entry.
