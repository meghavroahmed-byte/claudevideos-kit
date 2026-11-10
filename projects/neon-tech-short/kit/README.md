# Neon Tech short kit (9:16)

A dark 3D-grid world with one continuous camera move, word-by-word kinetic captions (off by default), glass UI cards, a "TWIST!" slam, a comment card and a follow CTA. See `memory/neon-tech-style.md` for the style notes.

## Files
- `neon.js`: the engine. Camera keys, grid world, world objects (`worldPath`, `worldRing`, `worldTower`, `worldDot`), HUD, captions, UI pieces (`glassCard`, `pill`, `label`, `bigNumber`, `slam3D`, `ringGauge`, `typeText`, `cursorHand`), grade.
- `story.js`: one video. Copy it for each new video and change `CFG`, `CAM_KEYS`, `CAPS`, `SHAKES` and `SCENE.world` / `SCENE.ui`.
- `neon.html`: loads both files.
- `fonts/`: Plus Jakarta Sans (500/700/800) and Anek Bangla.

## Captions (OFF by default)
The user does not want subtitles, so `CFG.captions = false`. Turn it on only if they ask.

`{ t0, t1, text }`. In `text`:
- `*word*` or `*two words*` turns yellow.
- `!word!` turns pink/red.
- ` / ` forces a line break.

Add `words: [t, t, ...]` to give exact per-word start times from whisper. Without it, the words are spread evenly.

## Render (Linux, from repo root after `npm install`)
```
cd projects/neon-tech-short/kit
node run.js still neon.html out/x.png "1.5,5,8.5"   # test frames
node run.js video neon.html ../../../renders/demo.mp4 720 30
```
Then mux the voice and SFX with ffmpeg. The voice gets no filters (see the skill file).

## 3D version (real 3D world, like the reference)
- `neon3d.html` loads `neon.js` (HUD and cards) and the module `story3d.js`. That module imports `neon3d.js` (three.js plus bloom).
- `neon3d.js` builds two night worlds in one scene:
  - **Rail world:** fields, double track, catenary poles, trees, a lattice tower, and a lit train with a headlight beam.
  - **City world (z ≈ 430–720):** lit-window buildings, roads, street lights, taxis, neon signs, a glowing route (`setRoute(k)`), a pin, and a scooter rider (`riderAt(u)`).
  - Also exports `setBeam`, `ring`, `setCamKeys` (Catmull-Rom camera through keys) and `hooks.cam` (for example the drone chase in `story3d.js`).
- Render: `node run.js video neon3d.html ../../../renders/x.mp4 750 30`. Stills take a few seconds; a 25 s video takes about 8.5 minutes on the cloud CPU (software WebGL).
