---
name: feedback-3d-ember-style-face
description: "2026-11-23: GTA shorts must be the approved v2 'Ice & Ember' look BUILT IN 3D; face clips natural (no bg swap), smooth transitions, no text over the head"
metadata:
  node_type: memory
  type: feedback
---

On 2026-11-23 the user watched GTA 6 Short v1. It was a bright daylight three.js world with realistic people and the face background swapped for a blurred 3D plate. They were angry ("baler edit", "3d video ta akdom simple").

**What they want:**
- **The look of their own approved v2 short.** It is https://youtube.com/shorts/Q0xgugDSDwM ("প্রাচীন যুগে শীতকালে…", the IMG_1899 v2 Ice & Ember look), but made in **3D**. They said: "amr oi style er lagbe video but 3d te". That means:
  - a dark ember/ice night world with a glowing grid floor
  - neon outlines and bloom
  - section colours
  - a small section chip at the top
  - ONE big glowing kinetic keyword headline in the lower third
  - whip, flash and zoom transitions, with something changing every 1–2 s
  - 3D x-ray windows
  - realistic 3D people, Poly Haven models, no 2D cartoon
- **Face clips:**
  - Never cut out or replace the room background ("Background change fake").
  - Use a light natural grade only; the heavy denoise, sharpen and warm curve looked bad.
  - Join face ↔ 3D with smooth overlapping transitions (xfade zoomin, 0.3 s), not alpha pops.
  - No text above or over the head while the face is on screen.
- Still about 2 s of face at the start, middle and end, straight-to-camera shots only.

**How to apply:**
- `projects/gta6-short/gta6.js` has the NIGHT ember block and `neonOutline()`. `gta6ui.js` has the `headline()`, `chipTop()` and `whip()` layer.
- `projects/raw-short-a/kit/assemble.py` joins the 3D render and the natural face pieces with xfade, plus raw voice (plain gain) and ducked SFX.

Related: [[feedback-v2-mg-style-wins]], [[feedback-3d-reference-house-in-crisis]], [[raw-footage-edit-style]]
