---
name: realistic-shorts
description: Recovery + production guide for the user's "realistic 3D" explainer shorts (9:16, ~25-30 s, "What if / Why do we..." topics). Real 3D humans (RenderPeople) next to real animals/props (Sketchfab + Poly Haven) in HDRI-lit three.js worlds, one continuous camera take, auto-sized floating labels, x-ray circles, loud voice master + soft BGM. Use when the user asks for a new short "ei style e", "realistic 3D", "giant-rat er moto", "batch60 er moto", wants a BATCH60 video re-rendered, or says Claude/computer was lost and everything must be restored from this repo.
---

# Realistic 3D shorts (style v2): restore everything from this repo

This repo alone is enough to rebuild every video. Nothing else is needed except the API keys (ElevenLabs, Sketchfab), which the user adds again as secrets. The approved reference look is `projects/giant-rat`, the sample the user approved. The full list of 60 videos is in `projects/BATCH60.md`.

## 1. The user's rules (never break these)
- **NEW 2026-11-24 (overrides older rules below): NO floating 3D text labels of any kind** (no `label()`/`showLabel()`, no words inside x-ray circles, no badges). The user rejected all 58 batch videos because every one had text in the scene. The picture must explain itself.
- **Captions = Zack D. Films / toilet-paper style:** 2-4 word phrases, sentence case, Montserrat 700 46px, white, soft shadow, no thick outline, `top: 968px` (copy `#cap` CSS from `projects/toilet-paper/index.html`). Not one-word uppercase captions.
- **Editing:** Zack-style close-ups and hard cuts are allowed (keyCam keys 0.02 s apart = cut); split above/below-water views; 3D x-ray cutaways with real organ models (body fades translucent), never 2D drawings. Reference: `projects/duck-float`.
- **Style v2:**
  - Realistic 3D humans, never cartoons. Full body in frame.
  - **Humans must never look tiny next to animals.** Scale people to 1.78 m and the animal to its real size. Frame them together.
  - One continuous camera take per video (`keyCam` keys, smooth moves). No hard cuts and no whip cuts.
- **Not allowed:**
  - No glass info card.
  - No dark HUD panels.
  - No face stamps (the circle-face pop-ins). Videos #1 and #2 are an exception; they stay as delivered.
- **Allowed overlays:**
  - Floating 3D labels: white text with a dark outline, auto-sized and clamped on screen.
  - X-ray circles: small, and never covering the face.
  - Ghost silhouettes.
- **Voice:**
  - Never process or filter the user's own voice.
  - Generated ElevenLabs VO is used as-is: no EQ, no denoise.
- **Audio master (#3 onward):**
  - Loud master: `volume=7.5dB` plus `alimiter 0.8`.
  - SFX bed at +11 dB, sidechain-ducked under the voice.
  - Soft mood BGM at −6 dB, also ducked.
  - All SFX are synthesized: no stock files, unique palette per video.
- **Captions:** one word at a time, timed to the voice (`mkcaps.py`). The last caption is the end card (`CAP_END`).
- **Delivery:**
  - Files named `NN - Title.mp4`, 1080x1920, H.264 crf 17, AAC 192k.
  - Send them in order, one file per message.
  - Each message caption: `NN - Title  —  3D model credits: "<model>" by <author> (<licence>) | ...` (CC-BY needs credit).
  - The ready-made captions are in `projects/_tools/captions.txt`; the title and credit table is `projects/_tools/deliver.tsv`.
- **Language:** the user writes Bangla or Banglish. Reply the same way.
- **Credentials:** never print, commit or send API keys. Push only to the session's dev branch. No PRs unless asked.

## 2. Where everything lives
| Path | What |
|---|---|
| `projects/_assets/` | **The asset library (~4 GB, committed).** About 500 Poly Haven models (`<Name>/<Name>.gltf`, 1k), 144 HDRIs in `hdri/` (2k), about 100 textures in `tex/`, 197 Sketchfab GLBs in `sf/` with credits in `sf/CREDITS.json`, and people/rigs in `people/` (`Xbot.glb` is the animation source rig; also `readyplayer.me`, `Michelle`, `Soldier`). |
| `projects/_assets/sf/rp_*.glb` | RenderPeople humans: nathan (= `hero`, the main guy, T-shirt with the MR. CLOUD print), eric, carla, claudia, sophia, manuel. All CC-BY. |
| `projects/_kit/real.js` | The shared v2 scene kit (API below). Every project symlinks `src/real.js` to it. |
| `projects/_kit/*.py, v2init.sh` | Asset fetchers (`getph.py`, `getsf.py`, `sfbulk.py`), `mkcaps.py` (captions), `dims.py` (model sizes), `v2init.sh` (converts a project to v2). |
| `projects/_tools/` | Pipeline scripts: `tts.sh` (ElevenLabs), `al2.py` (word alignment), `mksfx.py` + `tl_*.py` (SFX timelines), `bgm.py` (procedural BGM), `render.sh` (3-way parallel render + mix), `v2run.sh` + `v2queue.txt` (render queue), `sfqueue.sh` (slow Sketchfab retry queue), and the delivery manifests. |
| `projects/<proj>/` | One folder per video:<br>• `script.txt`: the caption text.<br>• `audio/spoken.txt`: text respelled for TTS and alignment.<br>• `audio/vo.mp3` and `audio/vo.words.json`: committed.<br>• `sfx.py`: synthesizes `audio/sfx_bed.wav`.<br>• `src/shots.js`: the v2 scene. `src/shots_v1.js` is the old cartoon version.<br>• `src/caps.js`, `index.html`, `src/main.js`, `render.mjs`. |
| `projects/BATCH60.md` | The list of 60 videos (number, slug, title) plus status notes. |
| `memory/*.md` | Older notes on the user's preferences, from earlier projects. |

`.gitignore` excludes `*.wav`, `*.mp4`, `node_modules`, `deliver/`, `l.txt` and `.v2done`. All of these are regenerated with the steps below.

## 3. Fresh-machine setup (do once)
```bash
cd <repo>/projects
# node deps (three 0.170 + playwright) in one shared place, symlinked into each project
mkdir -p ~/vk && cd ~/vk && npm init -y >/dev/null && npm i three@0.170.0 playwright && npx playwright install chromium   # skip install if Chromium is pre-installed
cd <repo>/projects; for p in */; do [ -f "$p/render.mjs" ] && ln -sfn ~/vk/node_modules "$p/node_modules"; done
pip install numpy scipy pocketsphinx          # sfx/bgm synthesis + forced alignment (al2.py)
sudo apt-get install -y ffmpeg                # or brew install ffmpeg
```
The scripts in `_tools/` hard-code two paths: `S=` (a scratch folder) and `/home/user/claudevideos-kit`. Before using them, copy `_tools/*` into a scratch folder and fix those two variables with `sed`. In `tts.sh`, `$S/wv/bin/python` is any Python that has pocketsphinx installed.

Secrets:
- ElevenLabs: key for `api.elevenlabs.io`, sent as the `xi-api-key` header.
- Sketchfab: token for `api.sketchfab.com`, sent as `Authorization: Token ...`.

In Claude Code cloud, save both as environment network secrets. The scripts send the placeholder `proxy-injected` and the proxy injects the real key. On a plain PC, set the real key in the header via an env var. Never commit a key.

## 4. Make one video (new or re-render)
1. **Folder.** Copy an existing v2 project as a template; `giant-rat` is best. Then run `bash _kit/v2init.sh <proj>`. It makes the `assets` symlink to `../_assets`, the `real.js` link, and `index.html`/`main.js` from giant-rat.
2. **Script.** Write `script.txt` (~60-75 words, about 25-30 s). Copy it to `audio/spoken.txt`, respelling numbers and odd words the way they should be spoken.
3. **Voice** (ElevenLabs): run `tts.sh <proj>`.
   - Voice: "Megh Yt english", id `DDBVyamqcjlSuvNUZLUH`.
   - Model: `eleven_v4`, output `mp3_44100_192`.
   - Settings: stability 0.5, similarity_boost 0.75, style 0, speaker boost on, speed 1.0.
   - It writes `vo.mp3`/`vo.wav`, then `al2.py` writes `audio/vo.words.json` (`[{w,s,e}]`).
   - If the user sends their own voice, use it untouched; only align it.
4. **Captions:** `python3 _kit/mkcaps.py <proj>` writes `src/caps.js`.
5. **Scene:** write `src/shots.js`. Export `DURATION` (VO length + ~0.3 s), `CAPTIONS`, `FADES`, `PRELOAD`, `SHOTS=[{start:0,end:99,build}]`. Follow `no-sleep`, `ant-strength` or `medieval-doctor` as examples.
   - **Check stills before a full render:** `GL=swiftshader node render.mjs stills 0.5,3,7.2 out_dir`. Check scale (human vs animal), labels on screen, x-ray off the face, and nothing clipping into the camera.
6. **SFX.** Write a timeline file (see `_tools/tl_*.py`; it uses palette funcs plus `put(time, name, sound, dB)`). Then:
   - Run `python3 _tools/mksfx.py <proj> <dur> <seed> tl.py`. It writes `sfx.py`.
   - Run `cd <proj> && python3 sfx.py`. It writes `audio/sfx_bed.wav`.
   - Put a sound on every on-screen event.
7. **BGM:** `python3 _tools/bgm.py <proj> <dur>` writes `audio/bgm.wav`. To add a new video, add its slug to the `MOOD` dict.
8. **Render + mix:** `bash _tools/render.sh <proj> <dur>`.
   - It renders 3 parallel parts at 30 fps and concatenates them.
   - It mixes voice + SFX (+11 dB, ducked) + BGM (−6 dB, ducked), applies `+7.5 dB` and the limiter, and upscales to 1080x1920. Output: `<proj>/<proj>.mp4`.
   - With swiftshader (no GPU) one video takes about 10-20 min. Many videos: list slugs in `v2queue.txt` and run `v2run.sh` in the background. It skips projects that have a `.v2done` file.
9. **Verify:** pull ~12 frames (`ffmpeg -vf fps=0.5,scale=270:-1,tile=6x2`) and look at them before delivering.
10. **Deliver:** copy to `deliver/NN - Title.mp4`. Send with the caption line from `captions.txt`, or build one from `CREDITS.json` for the models used.

To re-render all 58 (#3-60), the slugs are in `_tools/deliver.tsv` (column 2). Regenerate `sfx_bed.wav` (`python3 sfx.py`), `bgm.wav` and `vo.wav` (ffmpeg from the committed `vo.mp3`), then run `render.sh`. #1-2 (`toilet-paper`, `anaconda`) are the old style. Do not touch them.

## 5. `real.js` kit API (cheat-sheet)
- `loadKit(renderer, {models, hdris, tex, people})`: preload. Model names are Poly Haven names or `sf/<name>`.
- `world(stage, hdri, {height, radius, sun, env})`: HDRI sky with a grounded skybox, sun and shadows. `scene.userData.key` is the sun light.
- **Props:**
  - `prop(name, scale)`: clone a model.
  - `fit(obj, size, 'x'|'y'|'z'|'max')`: scale an object to a real size in metres.
  - `creature(name, size)`: an animated GLB; drive it with `.play(t, clip, speed)`.
- **People:** `person(kind)` returns `{root, update(t, {idle, walk, run, headShake…}, w, poses), world(bone), headPos()}`.
  - Kinds: `hero`, `eric`, `carla`, `claudia`, `sophia`, `manuel`, `rpm`, `michelle`, `soldier`.
  - Poses are blended 0..1: `flinch point pointL handsHead handsChest handsBelly handsThroat armsUp spread armUp coverFace swim facepalm elbow shrug crouch lean leanBack lookUp lookDown headTilt nod slump`.
- **Overlays:**
  - `label(text, width)` + `showLabel(l, pos, t, a0, a1)`: floating label. Call `labelCam(cam)` every frame.
  - `xray(size).show(pos, k, drawFn(g, k, t), progress, t)`: 512² canvas circle. Keep it small and off the face.
  - `ghost(obj, color, {inPlace})` with `.fade(k)`.
  - `stream(n, color, size).update(from, dir, t0, t1, t, speed, spread)`: particles.
- **Camera and materials:** `keyCam(KEYS, t)` / `keyPath`: smooth camera from `[time, pos, look]` keys. `lavaMaterial()`, `waterMat()`, `texMat()`.

## 6. Getting more assets
- **Poly Haven** (CC0, no key): `python3 _kit/getph.py <model> hdri:<name> tex:<name>`. Browse at polyhaven.com; the API is `api.polyhaven.com/assets?t=models`.
- **Sketchfab** (key needed, free account):
  - Search: `python3 _kit/getsf.py search "brown bear" [animated]`. It lists only CC0, CC-BY and Free Standard results.
  - Download: `python3 _kit/getsf.py get <uid> <name>`. It saves `_assets/sf/<name>.glb` and adds the credit.
  - **Always look at the thumbnail or a still before using a model.** Auto-picks in `sfbulk.py` are often wrong; for example, the `sf/helicopter` file is really "CCity Building Set 1".
  - On 429 rate limits, wait or use `_tools/sfqueue.sh`.
- Check a model's real size with `python3 _kit/dims.py <file>`, then scale it with `fit()` to its true size.
- After adding assets, commit them (`_tools/libpush.sh` commits in chunks) so the library survives even if the sites disappear.

## 7. Known cleanup (optional)
Some `_assets/sf` auto-picks don't match their names. Examples: swordfish, piranha, dolphin, crab, car_sedan, moon, helicopter. Check each one before using it, then replace it or rename it. See the LIBRARY CLEANUP note in `BATCH60.md`.
