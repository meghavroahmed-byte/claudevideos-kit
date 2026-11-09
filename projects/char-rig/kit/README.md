# User's character: full-body rig (rig2)

Use this character in EVERY video made for the user. Always full body (hands + legs), never the old half-body bust.
Approved demo: `D:\ClaudeVideos\renders\character_movement_demo_v2.mp4` (source: `demo.html`).

## Files
- `sheet.jpg`: the user's character sheet (never edit).
- `common.js`, `rigcore.js`: helpers + `prepareSheet()`, `mk()`, `lerp`, `clamp`, `ease`, `hash`, `R` (old rig parts).
- `rig2.js`: full-body rig. `buildRig2(S)` once, then draw functions.
- `anim2.js`: `ACT` action library; each `ACT.name(localTime, opts)` returns a pose object.
- `run.js`: puppeteer render (`still <page> <out> <arg>` / `video <page> <out> <frames> <fps> <start>`).
- `demo.html`: full working example (timeline, turns, walking speeds, chair, labels).

## Setup
```html
<script src="common.js"></script><script src="rigcore.js"></script>
<script src="rig2.js"></script><script src="anim2.js"></script>
<script>(async()=>{ const S = await prepareSheet(); buildRig2(S); /* ... */ })();</script>
```

## Draw
`(X, Y)` = feet on ground, `s` = scale (0.66 ≈ 600 px tall figure on 1080p).
- Front: `drawCharF(g, X, Y, s, pose)`
- Side: `drawCharS(g, X, Y, s, pose)` faces LEFT; `pose.flip = true` faces right. `pose.ground` keeps feet on ground.
- Back (walking away): `drawCharB(g, X, Y, s, pose)`
- Easiest: `const p = Object.assign({ t }, ACT.walkS(lt)); draw by p.view ('F' | 'S' | 'B')`.

## Actions (ACT)
- Side: `walkS` (cyc 1.0), `runS` (cyc 0.62), `standS`, `sitS` ({down, up}).
- Front: `idle, wave, waveF, point, talk, think, shrug, clap, eat (apple), drink (glass), jumpF, dance, cheer, walkF`
- Faces/emotion: `angry, sad, surprised, confused`, happy via `thumbsUp`/`fistPump`/`waveF`.
- Fingers: `thumbsUp, count (1-2-3), fistPump`.
- Back: `walkB`.
- No foot sliding: walk speed = `504 * s` px/s, run = `1335 * s` px/s.
- Turning: squash X scale to ~0.08 and swap view at midpoint (see `poseAt` in demo.html).

## Pose fields (custom poses)
- `armL/armR`: `{a, e}` (shoulder/elbow deg) or `{to:[x,y], bend}` IK in rig space (left bend +1, right -1 so elbows point out).
- `legL/legR` (front/back): `{a, lift}`; side: `nearLeg/farLeg {a, k, f}`, `near/far` arms.
- `handL/handR`: `'open' | 'relax' | 'fist' | 'point' | 'peace' | 'thumb' | 'grip' | 'three'` or `{curl:[5], spread}`; omit = sheet hand.
- `face`: `'normal' | 'angry' | 'confused' | 'sad' | 'happy' | 'surprised'`; `mouth` 0-1 (lip-sync from voice RMS), `blink`, `cheek`.
- `head` (tilt deg), `body {dx, dy, rot, sy}`, `item` (apple / glass / phone).

## Style rules (from the user)
- Full body always; character should act out the lines (walk in, point, react with face).
- Show it often (every 3-5 beats), inside the video's MG / scene frames.
- Copy this kit into the new project's `kit/` folder; don't build videos inside char-rig.
