# CLAUDE.md: read this first (Megh / "Voice of Megh" video workspace)

This repo is the user's complete short-video workspace: kits, a ~4 GB 3D asset library, finished projects, tools, rules and memory. Claude Code loads this file automatically, so a new account or computer only needs the repo. Read `memory/MEMORY.md` and `.claude/skills/realistic-shorts/SKILL.md` for detail.

## Talking with the user
- The user writes Bangla or Banglish. Reply the same way: Bangla script if they write Bangla script, Banglish if Banglish.
- They often send a topic or an English script and then go to sleep. Finish the video, check it, and send it without waiting.
- Deliver each video as `deliver/<Title>.mp4` (1080x1920). Caption it with the title plus the 3D model credits from `projects/_assets/sf/CREDITS.json` (CC-BY needs credit).

## CURRENT house style (2026-11-24; newest rules win over anything older in memory/)
1. **Realistic 3D people.** RenderPeople humans from the library (`person('eric'|'carla'|'claudia'|'sophia'|'manuel'|'nathan')`, babies `person('baby2')`).
   - Use a **different main person each video**. Don't reuse the same man every time.
   - Download more rigged characters from Sketchfab when needed.
   - **Everyone wears clothes.** Babies get real loose clothing shells (`dress()` in `projects/baby-memory/src/dress.js`), never painted-on tight clothes.
2. **Everything in 3D, no photo backgrounds.** Use `world3d()` in `_kit/real.js`: the HDRI only lights the scene, with a gradient 3D sky and a 3D ground. Buildings, streets, trees, grass and props are all 3D models (Sketchfab and Poly Haven).
3. **Never use white ghost/shadow people** (`ghost()`). Show real 3D people and animals.
4. **No floating text labels or words in the scene.** No glass info card, no face stamps.
5. **Captions** follow the toilet-paper / Zack D. Films style: 2–4 word phrases, small white text with a soft shadow. Copy the `#cap` CSS from `projects/toilet-paper/index.html`.
6. **Zack D. Films style motion:**
   - Several shots and locations per video, with a moving camera and cuts every 2–4 s.
   - People act out the script: walk, run, point, react.
   - Scenes are busy and alive.
   - For body or organ topics, the camera goes INSIDE the character (the body turns see-through and real organ models show inside).
7. **Clean animation:**
   - No hands clipping into the body.
   - Feet planted (`person.plant()`).
   - Correct walk, run and swim motion.
   - Check stills from more than one angle before rendering.
8. **Audio:**
   - Voice on top. SFX quieter than the voice (bed −2 dB with hard ducking, in `render.sh`).
   - Soft BGM.
   - Never process or filter the user's own recorded voice.
9. **Quality bar:** "pro level". Render test stills of every shot and fix problems before the full render. Don't leave anything pointless or ugly in frame.

Good recent examples to copy from: `projects/baby-memory`, `projects/dino-world`, `projects/how-rare`.

## Voice (ElevenLabs)
- Voice "Megh Yt english", voice_id `DDBVyamqcjlSuvNUZLUH`.
- Model `eleven_v4`, output `mp3_44100_192`.
- Settings: stability 0.5, similarity_boost 0.75, style 0, speaker boost on, speed 1.0.
- Script: `projects/_tools/tts.sh <project>`. It reads `script.txt`, aligns with `audio/spoken.txt` (respell words the aligner doesn't know), and writes `audio/vo.mp3`, `vo.wav` and `vo.words.json`.

## Keys (never stored in the repo)
- ElevenLabs: host `api.elevenlabs.io`, header `xi-api-key`.
- Sketchfab: host `api.sketchfab.com`, `Authorization: Token ...`.

In a Claude Code cloud session, ask the user with the secure credential form (`request_credential`); never ask them to paste keys in chat. The scripts send the placeholder `proxy-injected` and the proxy fills in the real key.

## One-time setup in a fresh session
```bash
cd projects
mkdir -p ~/vk && (cd ~/vk && npm init -y >/dev/null && npm i three@0.170.0 playwright @fontsource/montserrat @fontsource/righteous)
for p in */; do [ -f "$p/render.mjs" ] && ln -sfn ~/vk/node_modules "$p/node_modules"; done
pip install numpy scipy pocketsphinx
# if `projects/_assets/sf/trees_realistic.glb` is missing (115 MB, too big for GitHub):
python3 _kit/getsf.py get b5b506fc4f5d4af9b546283bdf0c6a15 trees_realistic
```
In the cloud, Chromium for Playwright is usually pre-installed. Don't run `playwright install` there. Render with `GL=swiftshader`.

## Making a video (short version; full steps in the skill)
1. Make a project folder from a recent example, e.g. copy `baby-memory`:
   - copy `index.html`, `render.mjs` and `src/main.js`;
   - symlink `src/real.js` to `../../_kit/real.js` and `assets` to `../_assets`.
2. Write `script.txt` and `audio/spoken.txt`, then run `bash _tools/tts.sh <proj>`. Build phrase captions in `src/caps.js`.
3. Write `src/shots.js`: a `SHOTS` array (one build per location) with `PRELOAD = loadKit(...)`.
4. Check stills: `GL=swiftshader node render.mjs stills 1.0,5.0,... st`, then look at them.
5. Sound:
   - SFX: write a timeline `_tools/tl_<proj>.py`, run `python3 _tools/mksfx.py <proj> <dur> <seed> _tools/tl_<proj>.py`, then `cd <proj> && python3 sfx.py`.
   - BGM: add the slug to `MOOD` in `_tools/bgm.py`, then `python3 _tools/bgm.py <proj> <dur>`.
6. Render: `bash _tools/render.sh <proj> <dur>` (3 parallel parts plus the mix). Heavy models are slow (10–20 s/frame), so keep polygon counts down. Use `grassTufts()`, not hundreds of Poly Haven grass clumps.
7. Pull a frame strip, check it, copy to `deliver/`, and send.

## Where things are
| Path | What |
|---|---|
| `projects/_assets/` | 3D library: Poly Haven models/HDRIs/textures, Sketchfab GLBs in `sf/` (`CREDITS.json` = titles, authors, licences, uids) |
| `projects/_kit/real.js` | Realistic kit: `loadKit`, `world3d`, `prop`, `fit`, `creature`, `person` (retargets RenderPeople / Character Creator / MakeHuman rigs), `grassTufts`, `keyCam` |
| `projects/_kit/getsf.py`, `getph.py` | Download more Sketchfab models (CC0/CC-BY only) and Poly Haven assets. Always look at a model before using it; Sketchfab names are often wrong. |
| `projects/_tools/` | `tts.sh`, `al2.py`, `mksfx.py` + `tl_*.py`, `bgm.py`, `render.sh` |
| `projects/BATCH60.md`, `projects/EDIT_LIST.md` | The old 60-video batch; 27 of them the user wants redone in the current style |
| `memory/` | Every past rule and feedback (`MEMORY.md` is the index). Older entries may be superseded by the list above. |
| `.claude/skills/` | `realistic-shorts` (recovery/production guide), `zach-d-films`, `neon-3d-short` |

Push work to a branch and ask before merging to `main`. Never commit API keys.
