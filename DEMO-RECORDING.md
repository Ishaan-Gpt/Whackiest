# Demo recording guide: BEFORE / AFTER (Edit Easy MCP)

This guide covers the recording on your Windows 11 PC. It has two segments: Claude Desktop with no MCP (BEFORE), then
the same Claude Desktop with `edit-easy` connected (AFTER). You paste the same prompt word for word in both. Aim for
about 15–20 s of BEFORE and 60–75 s of AFTER on screen.

## Pre-flight (do all of this before you hit record)

- [ ] **ffmpeg:** `ffmpeg -version` works in a new terminal.
- [ ] **Python packages:** `python -m pip install -r hackathon\whackiest-2026\kit\requirements.txt` has been run.
- [ ] **Kit dependencies:** `npm install` has been run in `kit`.
- [ ] **Demo clip:** copy it to a short path with no spaces, e.g. `C:\demo\raw-talking.mp4`. Use a 9:16 talking head
      of 15–25 s: one of your own clips, or the NASA test clip `out\raw-talking-9x16.mp4`.
- [ ] **Warm-up run:** do one full dry run off camera on that same clip. This does three things:
  - downloads the whisper `base` model,
  - builds the font cache in `kit\.cache\fonts`,
  - shows you the real render time on your PC.

  Then run `open_clip` with `reset: true`, or just delete `C:\demo\raw-talking.mp4.editeasy.json`, so the take starts
  clean.
- [ ] **Delete old renders:** remove `C:\demo\raw-talking.edit-final.mp4` and `.edit-preview.mp4` if a dry run left
      them there.
- [ ] **Two Claude Desktop configs ready:**
  - BEFORE: the `edit-easy` entry removed from `claude_desktop_config.json`, or the server toggled off.
  - AFTER: the entry in place (snippet in `kit\README.md`). Quit Claude Desktop from the tray and reopen it after each
    switch.
- [ ] **AFTER connection check:** with AFTER on, the tools (hammer/plug) menu shows `edit-easy` with 8 tools.
- [ ] **Tool approval:** set it to "Allow always" for `edit-easy` during the dry run, so permission pop-ups don't
      interrupt the take.
- [ ] **Screen:** 1080p, Claude Desktop maximised, notifications off, font size up one step (Ctrl +).
- [ ] **Player ready:** a video player is open in the background (Windows Media Player or VLC), so the final MP4 can
      play straight away.

## The prompt (paste the same words both times)

> Edit C:\demo\raw-talking.mp4 into a 9:16 reel for Shorts. Word-by-word captions in a bold style with the spoken
> word highlighted, big, and put them right at the very bottom of the screen. Cut the dead start, add a couple of
> punch-ins on the key moments, one sound effect on the key word, a warm grade and a light music bed. Give me the
> finished MP4.

The words "right at the very bottom of the screen" are a normal user request. They are also what makes the verifier
refuse, because the very bottom is where YouTube's caption and like buttons sit.

## BEFORE (about 15–20 s on screen)

| # | Time | On screen | What happens / what you say |
|---|---|---|---|
| B1 | 3 s | Claude Desktop, no tools icon. Paste the prompt. | (VO) "Here's what my AI does today with a raw clip." |
| B2 | 8–10 s (speed-ramp the typing 4×) | Claude answers. | It will say it can't edit video files, give CapCut steps, or give an ffmpeg `drawtext` command. Scroll so the command or the steps are visible. |
| B3 | 5 s | Cut to the BEFORE MP4 playing: one static white line, default font, centred, no timing. | This is the output of `kit\scripts\naive_before.mjs`, i.e. that kind of command actually run. Keep the label "BEFORE" on screen. (VO) "Even when it runs, it's one static line, over the shirt, with no timing." |

## AFTER (aim for 60–75 s on screen)

| # | Real time | Screen time | On screen | What Claude should do / what you say |
|---|---|---|---|---|
| A1 | 3 s | 3 s | Tools menu open, showing `edit-easy` and its 8 tools. Close it and paste the same prompt. | (VO) "Same AI, same prompt. Now it has Edit Easy." |
| A2 | ~5 s | 4 s | Tool call `open_clip`. | It returns the size, fps and a face box. Expand the call once so the face box is visible. |
| A3 | 20–60 s on CPU | **speed-ramp to 3 s** | Tool call `transcribe`. | Word indices come back. Show the `0:really 1:important …` list for a beat. |
| A4 | ~5 s | 5 s | `find_library` calls (caption, sfx_event, grade, music). | Expand the caption menu. (VO) "It isn't inventing a style. It's picking from a library, and every item has a source." |
| A5 | ~5 s | 5 s | `plan_edit` with `position: "bottom_edge"`. | The ops are JSON with word indices and no seconds. Highlight `"position": "bottom_edge"`. |
| A6 | ~3 s | **8–10 s (hold)** | `validate_edit` returns **REFUSED**. Zoom in on the text. | The text reads like: `REFUSED caption_safe_area: caption "…" line 2: bottom edge at y=17xx is inside the platform UI zone (safe area ends at y=1480). Fix: position "lower" (y=1344).` **Say:** "And here's the part that matters: the edit gets refused. Its captions would sit under YouTube's buttons, so the code blocks it before I ever see it, and it tells the AI exactly how to fix it." |
| A7 | ~5 s | 5 s | Claude calls `plan_edit` again with `"position": "lower"`, then `validate_edit` returns **PASS**. | (VO) "The model fixes it and the verifier passes it. Rules first, model second." |
| A8 | 50–120 s | **speed-ramp to 4–5 s** | `render` with `quality: "final"`. Show a progress clock or a "rendering locally with ffmpeg" lower-third. | The result shows the path, the measured loudness (about −14 LUFS) and the music credit line. |
| A9 | — | 15–20 s | Play `C:\demo\raw-talking.edit-final.mp4` full screen, with sound. | Let the captions, a punch-in, the sound effect and the music play. No VO for the first 5 s. |
| A10 | — | 5–8 s | `before-after.mp4` (made with `node kit\scripts\side-by-side.mjs <before> <after>`). | (VO) "Any AI, your machine, zero API cost, and every edit is proven before you see it." |

Total screen time for A1–A10 comes to about 63–78 s. If you run long, trim A4 to one menu and A9 to 12 s.

### If Claude doesn't pick `bottom_edge` on its own

Claude might choose `lower` straight away. If so, type exactly: **"Put the captions right at the bottom edge."**
It will then plan `bottom_edge`, and A6 happens on the second call. This is the honest fallback, so keep it in the
take. If it still avoids the edge, ask: "nudge the captions down 300 px". An explicit nudge is checked literally and
is refused the same way.

### If something fails on camera

- **transcribe errors:** faster-whisper is not importable by the `python` Claude Desktop sees. Set `EDITEASY_PYTHON` in
  the server's `env` block in the config to the full path of `python.exe`.
- **render errors with "ffmpeg failed":** check that `ffmpeg` is on the PATH Claude Desktop sees. Quit it from the
  tray and reopen it after installing ffmpeg.
- **Last resort:** the face rule shows SKIPPED if no face was found. That is fine to show, because the reason is
  plain.

## After recording

- Do not commit any clips or renders. `out\` and every `*.mp4` are git-ignored.
- If the music bed is in the final video, put the credit in the video description:
  "Funkorama" by Kevin MacLeod (incompetech.com), CC BY 4.0.
