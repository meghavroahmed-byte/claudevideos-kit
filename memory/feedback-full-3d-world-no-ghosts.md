---
name: Full 3D worlds (no photo HDRI backgrounds) and no ghost people
description: 2026-11-24 user: photo/HDRI backgrounds next to 3D characters look bad; build nature, buildings, everything in 3D; never use white ghost/shadow people
type: feedback
---
The user said the realistic photo backgrounds (HDRI GroundedSkybox) don't match the 3D characters and look bad. Everything visible must be 3D: buildings, streets, trees, grass, rocks, sky. They also said never to use white translucent "ghost/shadow" people (kit `ghost()`); show real 3D people instead, downloading more characters online when needed.

**How to apply:**
- Don't show HDRI photos as the visible background. Use HDRIs only for lighting/reflections (scene.environment), with a 3D sky (three.js Sky shader or a gradient dome) plus 3D ground.
- Build sets from 3D models: Sketchfab city blocks/skyscrapers/houses, Poly Haven trees/shrubs/grass/rocks, textured ground planes. Fill the frame so no empty void shows.
- No `ghost()` silhouettes for people. For "fading/imagined" people, use the real model (dissolve or fade the real textures), not a white hologram.
- Pro level: check each shot still before the full render.
