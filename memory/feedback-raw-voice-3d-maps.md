---
name: feedback-raw-voice-3d-maps
description: "Never process the user's voice (keep raw quality); map shorts must have 3D feel + characters/scenes like the reference, not flat 'still picture' maps — 2026-11-09"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 481fdc7c-1f8f-4a5e-bb2a-602c28936371
  modified: 2026-11-08T19:33:19.946Z
---

On 2026-11-09 the user rejected the first Chile map short ([[map-short-style]]).

1. **Voice:** "keno edit korecho", the user wants the same quality as the raw voice they sent.
   - Don't add highpass, afftdn, compressor or loudnorm on their voice.
   - Use it as is. At most apply a plain overall gain if it's very quiet; better, lower the SFX instead.
2. **Map looked like a still picture ("isthir chobi"):**
   - They want a 3D vibe: perspective-tilted terrain, camera flying, depth, parallax, relief.
   - Flat 2D zoom/pan on satellite tiles is not enough.
3. **Too plain ("sada mata"):**
   - The reference uses characters (illustrated people acting the story) and many more elements per shot.
   - Fill shots with characters/scenes, objects, icons and effects, not just labels and arrows.
   - Use the user's character more.

**Why:** they judge against the reference's busy, cinematic 3D map style; "best quality" is the bar.

**How to apply:**
- Map videos: three.js 3D map (tilted terrain with an elevation displacement map, globe intros, clouds/atmosphere, camera fly-throughs). Story scenes with characters in between. Many overlays per beat.
- Any video: never filter the user's voice.

Related: [[pc-video-toolchain]], [[feedback-pro-visual-bar]]
