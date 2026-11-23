---
name: megh-doc-edit
description: Edits Voice Of Megh's Bangla YouTube Shorts/Reels into ultra-premium, documentary-grade videos made of ~75% self-made 2D animation and motion graphics plus ~25% stock footage placed only inside motion-graphics frames. The creator's own face appears only on the hook, once in the middle and on the ending, and the voice and cut are left untouched. Every on-screen element gets its own sound. Use whenever this creator sends a raw or already-cut talking-head video (Google Drive link or file) and asks for an edit, a "pro level" or "documentary style" video, or "amar style e edit".
---

# Megh documentary edit: the creator's full rulebook

This file is everything the creator ("Megh", channel **Voice Of Megh**) taught over many sessions. It is written for any agentic AI that can run code: shell, ffmpeg, Python, a headless browser and web requests. Follow it literally. The creator's bar is **"best of best, ultra level, top-class documentary."** Anything "normal", "simple" or "generic" gets rejected.

---

## 0. Talking to the creator
- They write in **Banglish** or **Bangla script**. Reply in the same script they used last.
- Keep replies short and concrete: what you did, what is next, and what is blocked.
- They often send several short messages in a row while you work. Read all of them; a later message overrides an earlier one.
- When they say **"stop"**, stop every running job at once and wait. Disable any scheduled auto-resume until they say to continue.
- They usually say "do it, I'm going to sleep." Then work end to end without asking for approval. Ask only when a decision is truly theirs, such as an API key or a new direction.
- Never ask them to paste API keys into chat. Use the platform's secure credential mechanism.

## 1. Hard rules (non-negotiable)
1. **Never process the voice.** No EQ, denoise, compressor, loudnorm on the voice track, or pitch change. A plain gain to reach loudness is the only thing allowed.
2. **If they send an already-cut video, do not re-cut it.** No removed pauses, no speed-up, no slow-down. Keep their timeline frame-exact; picture and graphics follow their audio.
   - If they send *raw* footage instead, cutting is fine: remove retakes, mistakes and long silences. Even then, no speed change unless they ask.
3. **Face rules:**
   - Show their real face **at the hook (the first 2–3 s, a must)**, **once in the middle** and **at the ending (a must)**. In total it is ~10–15% of the runtime.
   - Use **only** shots where they look straight into the camera with a straight head. Check every candidate frame at 4–6 fps close-ups. If in doubt, drop it.
   - **Keep their real room background.** Never cut out or replace the background; they called it "fake".
   - Grade the face lightly and naturally, matched to the video's palette (see §5). No heavy denoise, over-sharpening or plastic skin.
   - Motion graphics may sit *around* the face (corner brackets, a lower-third keyword, edge light), but **never text over or above the head**.
4. **No captions or subtitles.** Short keyword headlines that are part of the graphics are OK.
5. **About 75% of the picture is self-made 2D animation and motion graphics.** You draw and animate everything yourself in code: icons, diagrams, characters, scenes, "motion capture" visuals and so on. Never pull animated graphics or templates from outside.
6. **When they talk about a specific game, movie, product or event, use real footage OF THAT THING** (official trailer or gameplay, 2–3 s clips), placed inside motion-graphics frames. Generic stock is only a fallback. YouTube is often not downloadable from a cloud sandbox; if so, ask them to put the trailer/gameplay files in their Drive folder.
7. **About 25% stock footage, used only inside motion graphics.** Put clips in framed windows, cards or circle windows, with labels, brackets and counters over them. Never drop them in randomly at full screen. Use 2–3 s per clip, each chosen to match the exact spoken line.
8. **Each video must look different from every other video.** Change the world/background, palette, MG vocabulary, transition set and sound palette every time. When they send two videos, make the two styles completely different, and both best quality.
9. **Ultra-level sound design.** Every on-screen event gets its own sound, down to a tiny glass shard falling (§6).
10. Deliver a full-quality file **and** a phone preview under 30 MB.
11. Never delete or overwrite the creator's original files.

## 2. What they rejected (never repeat these)
- **Bright, simple daylight 3D worlds** with one prop per shot: "akdom simple". Plain 3D renders without motion-graphics density.
- **A random stock 3D avatar as their character** (a hat-wearing Ready Player Me man). Don't put strangers in their videos. Their own character is a light-grey-hoodie guy with black hair, a beard and dark jeans (a 2D character sheet); only use it when they ask.
- **Background replacement behind their face**: "fake".
- **Alpha-pop or jumpy transitions** between face and graphics. Use smooth overlapping transitions such as zoom-in or whip with motion blur, 0.25–0.35 s.
- **Gaudy colours.** Neon purple/pink backgrounds looked "non-professional". Saturated cartoon palettes are out too.
- **Too much stock footage**, or stock used as random full-screen B-roll.
- Glass "info cards" stacked at the top of the frame, and big stamped words over the face.
- Thin synthetic beeps as SFX, constant hiss beds, and pitched "eu eu" squeaks for body movement.
- Full-screen cartoon worlds in place of motion graphics (an old rejection).


## 2b. Feedback 2026-11-23 night (after the GTA edits; hard rules)
- **Text is never tilted or rotated.** Stamps, labels and headlines all sit straight, clean and centred. Crooked or "bent" text looks amateur.
- **Face shots need pro motion graphics on the chest area, below the chin.** Use a kinetic lower third (a line drawing on, a glowing keyword sliding in, a small icon), never a sticky note or cheap card, and never anything over the head.
- **No colour cast on their face footage.** No yellow/warm overlay, no tint. Keep the camera colour natural (at most a tiny contrast or sharpness touch). Grade overlays apply only to graphics, never on top of the face.
- **2D animation must live INSIDE the motion graphics, exactly like the reference short.** Every beat has an MG layout plus a framed, animated 2D scene with characters acting out the line (people working, walking, reacting, the creator's own hoodie character every few beats). Charts and text alone are "normal" and get rejected.
- **For a game topic, use the REAL game:**
  - Steam store trailers (DASH via yt-dlp) and screenshots.
  - Wikipedia covers, logos and screenshots (fetch with a polite User-Agent and back off on 429).
  - The official site for new games.
  - Put them inside MG frames.

## 3. The look: documentary motion graphics, approved density
The approved reference is their short "প্রাচীন যুগে শীতকালে মানুষ কীভাবে বেঁচে থাকত?" (YouTube `Q0xgugDSDwM`). Match its density and polish, with a new palette and theme per video:
- **A new beat every ~2 s** (about 23 beats in 50 s). Something always moves; each beat pushes in slowly.
- **Background:** a dark, rich, section-coloured gradient with a subtle drifting dot grid, a perspective floor grid, soft bokeh orbs and themed particles. Grade with bloom, vignette and fine grain. Never flat black, never a plain room.
- **MG vocabulary** (use many, vary per beat):
  - line-art icons that **draw on** with glow
  - icon badges with a ring that draws round
  - ring gauges, thermometer gauges, progress bars
  - big counting numbers ($ counters, years)
  - bar charts with a source note, comparison bars (A vs B)
  - radial diagrams ("3 uses" around a hub, spokes drawing out)
  - checklists that tick, strike-through lists with a red X
  - timelines, maps with glowing routes and moving markers
  - circle/rounded windows containing animated 2D scenes, or stock footage
  - corner brackets / HUD frames, lower thirds, small section chips at the top ("কারণ ১ · মানুষ")
- **Kinetic type, keywords only:** slam (scale-down with blur and a ring burst), glitch (RGB split), highlight bar (a colour bar wipes in behind the word), sub-line fade-up. Bangla fonts: a condensed Bengali display face (Anek Bangla) plus a clean Bengali UI face (Hind Siliguri).
- **2D animation inside frames:** small illustrated scenes acting out the line, such as people working at desks, a city skyline, a tower rising, money raining, a performer in a marker suit, a voice booth, a clock. Simple flat-vector with glow; keep it in proportion with the MG layout.
- **Transitions vary every cut:** circle wipe, zoom-blur, bars, whip (motion blur and offset), glitch slices, a flash frame, dissolve. Each one has a sound.
- **Section colours mean something:** money = gold/green, tech = teal/cyan, danger/"too expensive" = red, a question = violet or white. Choose a fresh base palette per video.
  - Good pro palettes: graphite + teal + warm gold (documentary); ice + ember; deep navy + amber.
- **Grade:** cinematic, gentle contrast curve, split tone (cool shadows, warm highlights), soft vignette, ~4–6% film grain. The face and the graphics must feel like one film.

## 4. Workflow
1. **Get the media.**
   - Drive folder: list it via `https://drive.google.com/embeddedfolderview?id=<FOLDER_ID>`, then download each file with `https://drive.usercontent.google.com/download?id=<FILE_ID>&export=download&confirm=t`.
   - If the folder looks empty, the upload is probably still running or the file isn't shared. Tell them and re-check when they say.
   - Probe it: duration, resolution, fps. If it's 720p, upscale face shots with lanczos and say so.
2. **Transcribe with word timings.**
   - Use Whisper large-v3 with `language=bn`, word timestamps, and `condition_on_previous_text=False`. Pass each line as `initial_prompt` when they give a script; long single passes hallucinate repeats.
   - If they paste the script with timestamps, use their text and their line times, and use Whisper only for word anchors.
   - Never drop a chunk because Whisper garbled it. Check RMS energy in 0.1 s steps.
3. **Pick face windows.** Hook (from 0), one middle line (a reaction or emotional line, e.g. "আছে আছে, ওয়েট করেন"), and the ending line plus the outro. Make 4–6 fps crop contact sheets and verify straight-to-camera gaze for every frame.
4. **Beat plan.** For every line, write down:
   - the beat type (MG-only / stock-in-frame / face)
   - the main graphic and the 2D animation
   - the headline keyword
   - the transition in
   - every SFX cue
   Anchor each animation to the exact word it illustrates. Numbers must match the spoken words literally.
   - Budget: ~75% MG + 2D, ~25% stock-in-frames, ~10–15% face.
5. **Stock footage** (2–3 s clips, only for the line they illustrate):
   - **Mixkit** (no key): scrape `https://mixkit.co/free-stock-video/<query>/` for `assets.mixkit.co/videos/<id>/<id>-360.mp4`, then download `<id>-1080.mp4`, falling back to `-720`.
   - **Pexels**:
     - The API needs the key in the `Authorization` header with **no "Bearer" prefix**.
     - Without the API, open `https://www.pexels.com/search/videos/<query>/` in a headless browser to pass the Cloudflare challenge, then read the `videos.pexels.com/video-files/...mp4` URLs.
   - Preview candidates on a thumbnail sheet before using them; titles on listing pages are often misaligned.
   - Grade every clip to the video's palette. Crop it to the window shape and add a slow push-in.
6. **Build the graphics in code.**
   - A canvas/HTML page renders each frame at 1080×1920 / 30 fps and is driven by a headless browser that pipes JPEG frames into ffmpeg.
   - Stock and face frames are pre-extracted to JPEG and drawn into the MG windows.
   - Render in 3 parallel parts and join with the concat demuxer.
7. **Check contact sheets of every beat** before the full render (one still every 2–3 s). Fix:
   - empty frames and overlaps
   - text off the edge
   - anything blown out
   - text over the head
8. **Sound design** (§6), then **mix:**
   - Voice raw plus plain gain to about **−14 LUFS integrated, true peak ≤ −1.5 dBFS** (use a limiter on the final bus only).
   - SFX bed about **6 dB under the voice**, with light sidechain ducking (ratio 2).
   - Music bed about 17–20 dB under the voice.
9. **Deliver:** H.264 CRF 16 full file, plus a 720p preview under 30 MB. In one short message, list what was made, what was only checked by frames, and any factual doubts in their script.
10. **Save** any new feedback as a rule in this file (or your memory) right away.

## 6. Sound design (ultra level)
- **Every** visible event gets a sound, cued to the frame:
  - cuts and transitions: whoosh, whip, glitch, flash-hit
  - icons drawing on: soft tick/scan
  - badges and pills popping: bubbly pop
  - counters rolling: digital ticks plus a final ding or cash register
  - bars growing: rising tone
  - ticks and checks: a ding each
  - money: bundle thud, coins, banknote flutter
  - a tower rising: construction rumble
  - a clock: ticking
  - typing: keyboard
  - a camera: shutter
  - reveals: riser into impact
  - a joke: a comedic sting
  - and literally a glass-shard sound if a shard falls
- Use **realistic generated SFX**, made new for each video, not stock packs and not thin synth beeps. Text-to-SFX (for example the ElevenLabs `sound-generation` endpoint) works well with descriptive prompts like "heavy stack of paper money bundles dropping onto a wooden pallet". Duration must be 0.5–30 s.
- Vary repeats: ±5% pitch and ±2 dB per hit, so no two sound identical. Layer the big moments (sub + body + top).
- Music: two soft beds (tension, then a drive/tech mood), looped with 1.5 s crossfades, ducked under the voice. No bed hiss.
- Never put a constant noise bed under the whole video.

## 7. Final QA checklist
- [ ] Hook opens on their straight-to-camera face; the ending closes on their face; the middle face beat is present; ~10–15% face in total.
- [ ] No text over or above the head; no captions.
- [ ] Voice untouched; their cut untouched (frame-exact length); no speed change.
- [ ] ~75% self-made 2D/MG; stock ~25%, always inside MG frames, each clip matching its line.
- [ ] Something changes every ~2 s; transitions vary; section colours make sense.
- [ ] Palette, world and sound palette differ from their previous videos; looks professional, not gaudy.
- [ ] Numbers and words on screen match the narration exactly.
- [ ] Every on-screen event has a sound; −14 LUFS, peak ≤ −1.5 dBFS.
- [ ] Full file plus a phone preview under 30 MB delivered; short report in their language.

## 8. Reference implementation (in the creator's repo `claudevideos-kit`)
- `projects/short-1899/kit/short2.html` + `mg.js`, `wpro.js`, `wkit.js`: the approved 2D MG engine:
  - beats and transitions
  - `bgMG`, `drawIcon`, `iconBadge`, `hlText`, `glitchText`, `slam`, `ringGauge`, `thermoGauge`
  - `worldIn` (draws a 2D scene inside a window)
- `projects/raw-short-a/kit/gta.js`:
  - extra icons: dollar, tower, code, cam, mic, chip, globe, chart, pad, eye, team, cal…
  - `moneyCounter`, `moneyRain`, `cashStack`, `dubai` (a tower rising), `devStudio`, `mocapStage`, `voiceBooth`, `openMap`
- `projects/raw-short-a/kit/build_cut.js` (cut raw footage, voice untouched) and `assemble.py` (xfade face↔graphics, voice gain, ducked SFX).
- `projects/gta6-doc/mixdoc.py`: places the per-event SFX palette and the looped music beds.
- `memory/*.md`: the dated feedback history behind these rules.
