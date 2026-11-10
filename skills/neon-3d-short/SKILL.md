---
name: neon-3d-short
description: The user's "Neon 3D" 9:16 explainer short. Night-lit three.js world, one continuous camera, glass UI cards, stamp words, synthesized SFX, built from their voiceover plus script. Modeled on two reference reels they love (a night train/rail one and a neon food-delivery city one). Use whenever the user sends a voiceover or script and asks for "oi type", "neon 3d", "3D short", "reference er moto", "anaros-dudh er moto", or "ei skill use koro" for a Short or Reel.
---

# Neon 3D short: the user's reference-style 3D explainer

The user is Bangla and writes in Banglish or Bangla script. Reply in the same script they use.

They want the look of the two reference reels **exactly**, but with their own voice and topic. The first finished video is `projects/anaros-dudh` ("আনারস + দুধ = বিষ?", 86 s, delivered 2026-11-09). Treat it as the working example and copy its structure.

## 0. Hard rules (the user said these)
- **No subtitles.** The caption engine exists but stays off (`CFG.captions = false`).
- **No Instagram follow card, no handle chip, no "EP · TECH" tag.** Keep `CFG.cta`, `CFG.handle_chip` and `CFG.tag` false. The thin orange progress bar at the top stays.
- Short stamp words ("খবরদার!", "ফ্যাক্ট ১", "TWIST!") and labels inside cards are OK. They are graphics, not subtitles.
- **Never filter the voice.** Mix it as-is, and add SFX under it.
- SFX must be **new for every video** (see `memory/feedback-unique-sfx.md`). Use a new seed and tweak the generators/theme. Never use stock sounds.
- Do the whole video end to end without asking for approval mid-way. Check quality yourself with contact sheets.
- Deliver the full-res mp4 **and** a phone preview under 30 MB with SendUserFile.
- Don't copy the reference creator's handle, logo or exact scenes. Copy the style only.

## 1. The look (what the references do)
- **One continuous camera** flies through a dark 3D night world. No hard cuts: beats change by flying to the next "station" and popping UI on and off.
- **World:** a deep-navy grid floor, a purple-to-navy sky dome, fog, floating dust, and bloom on emissive things. Hex **pedestals** with glowing coloured rims hold the props.
- **Props** are 3D, glossy, lit, and emissive where it makes sense. They act out the line: liquid curdles, enzymes cut chains, a red X slams onto a poison bottle, pins pop up on a globe, gas bubbles rise.
- **UI:** dark glass cards (thin border, small-caps label, big bold value), pills with a dot icon, counters, pH/progress bars, typed text. Cards sit in the lower third (y ≈ 1250–1600 of 1920).
- **Stamp words:** big extruded italic words with glow at the top third (y ≈ 560). Use them for the hook, myth/fact, "TWIST"-type turns and the verdict. Colours: pink/red for danger or myth, green for fact or safe, yellow for questions and keywords.
- **Ending:** a comment card with a question and a typed answer. No follow CTA.
- Palette: navy `#0a0d22`, yellow `#ffc93c`, pink `#ff3d6e`, green `#2ee59d`, cyan `#53e0ff`, orange `#ff8a3d`.

## 2. Files
Kit: `projects/neon-tech-short/kit/`

| File | What |
|---|---|
| `neon.js` | The 2D layer (classic script, globals). `CFG`, HUD/progress bar, `glassCard`, `pill`, `label`, `bigNumber`, `ringGauge`, `typeText`, `withPop`, `stamp`, `chip`, `slam3D`, `cursorHand`, grade. Also `boot()`, `frame(i)` and `still()`. |
| `core3d.js` | three.js core (ES module). Renderer, bloom, sky, lights, `gridFloor`, `dust`, `glowSprite`, `textSprite`, `instanced`/`setInst`, `setCamKeys` (Catmull-Rom camera through `{t,p,l,fov}` keys), `hooks.cam`/`hooks.shake`, `toScreen` (pin a 2D chip to a 3D point), `draw`. |
| `objects3d.js` | Reusable props: `pedestal`, `pineapple`, `pineSlice`, `glassOf`, `bowlOf`, `stomach` + `stomachUpdate` (curds, gas bubbles, liquid colour, pulse), `poisonBottle` (with a hidden red X), `shield` (check mark), `milkshake`, `enzyme`. Add new props here so later videos can reuse them. |
| `neon3d.js` / `story3d.js` | Older demo: rail world, train, tower, city, scooter rider, chase camera. Lift pieces from here for transport or city topics. |
| `tools/align.py` | Line timings from the voice plus script, no whisper needed (silencedetect + DP). |
| `tools/sfx.py` | Synthesizes the SFX track from the `window.SFXEV` cue list. |
| `tools/render.sh` | Parallel render (3 workers) and join. |
| `tools/mix.sh` | Voice + SFX → final mp4 + preview. |
| `run.js` | Puppeteer frame grabber (`still` / `video`). |

## 3. Workflow (voice + script → video)
1. **Set up.** Make `projects/<slug>/`, then copy in `voice.wav`, `script.txt`, plus `run.js` and `anaros.html` from `projects/anaros-dudh`. Rename the html and change its module `src`. Run `npm install` at the repo root if `node_modules` is missing.
2. **Timings.** Run `python3 ../neon-tech-short/kit/tools/align.py voice.wav script.txt lines.json`. A cost under ~15 is a good fit. If segments > clauses, raise `min_sil` (e.g. 0.35).
3. **Beat plan.** For every line write: the station or prop, what it does, the camera, the card or stamp, and the SFX cues. Group lines into 6–10 stations along +z (about every 30–40 units, alternating x by ±6). Every line must change something on screen.
4. **Build `<slug>.js`** by copying `anaros-dudh/anaros.js`:
   - Imports, then `CFG.duration`, `K.seed(n)`.
   - World: `gridFloor`, fog, dust.
   - Stations: build props with `objects3d` builders or new ones, keeping each prop to a few hundred triangles of primitives.
   - `VIS` list: hide every station outside its time window. This saves render time and stops far stations from showing through.
   - `K.setCamKeys([...])`: one key every 2–5 s, placed at line starts.
   - `update(t)`: all motion, as functions of `t` only (deterministic). Helpers `sm`, `env`.
   - `SCENE.ui = (g,t) => {...}`: cards and stamps, timed to `lines.json`.
   - `window.SFXEV = [[t,'kind'],...]`, then `boot()`.
5. **Check stills** before the full render: `node run.js still page.html out/x.png "t1,t2,..."`. Tile them with ffmpeg (`concat` + `tile`) and look at every beat. Fix the camera, exposure and overlaps.
6. **SFX.** Run `python3 ../neon-tech-short/kit/tools/sfx.py <slug>.js sfx_<slug>.wav <duration> <new-seed>`. Re-theme the generators for the topic: organic or liquid for body and food, metallic for tech, whooshy for travel.
7. **Render.** Run `bash ../neon-tech-short/kit/tools/render.sh page.html <duration>`. It takes about 30 minutes for 86 s. Run it in the background and wait with an until-loop. To fix a short glitch later, render just that frame range (`node run.js video page.html parts/fix.mp4 <n> 30 <startFrame>`) and splice it in.
8. **Mix and deliver.** Run `bash ../neon-tech-short/kit/tools/mix.sh parts/video.mp4 voice.wav sfx_<slug>.wav ../../renders/<slug>`, make a final contact sheet (`fps=1/3,tile`), then SendUserFile both files. Commit the code (media files are gitignored) and push.

## 4. Gotchas learned on the first video
- **Exposure:** bloom plus strong lights blow white props out. Keep a table SpotLight around 40, PointLights 5–10 and emissive intensities ≤ 0.2 on white things. Check the stills.
- **Portrait framing:** the frame is narrow. A prop about 10 units wide needs the camera about 25 units away (fov 46). Close-ups of props about 2 units wide can sit 6–8 units away.
- **Camera paths** are Catmull-Rom curves, so they can cut through a prop between keys. Add a key to steer around it, or hide that station with `VIS`.
- **Stations far down +z** show through the fog. Always use `VIS` windows.
- **`setDrawRange`** on tubes animates "draw-on" routes. For instanced props, update with `setInst` and set `instanceMatrix.needsUpdate`.
- **Bangla text:** canvas falls back from PJS to Anek Bangla automatically. Emoji may not render in headless Chrome, so use symbols like ✓ ✕ ⚠ ☠ → only.
- **Textures** (`loadAsync`) must finish before `boot()`. Use top-level `await` in the module.
- **Rendering:** a still takes a few seconds; video runs at about 0.7 s/frame per worker on 4 CPUs.

## 5. Related
- `memory/neon-tech-style.md`: the style notes and the user's yes/no list.
- `skills/megh-video/SKILL.md`: the user's other house style (v2 MG) and general rules (voice, delivery).
