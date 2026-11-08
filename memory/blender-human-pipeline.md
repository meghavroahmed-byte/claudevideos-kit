---
name: blender-human-pipeline
description: "Portable Blender 4.2 + MPFB realistic-human pipeline on D: (built 2026-11-07), render speed on this PC, gotchas"
metadata:
  node_type: memory
  type: project
  originSessionId: 481fdc7c-1f8f-4a5e-bb2a-602c28936371
  modified: 2026-11-07T17:44:48.239Z
---

On 2026-11-07 I built a pipeline for "Zack D style" 3D humans ([[zackd-style-reference]]). The test shot is `D:\ClaudeVideos\renders\blender_human_test.mp4`.

**Setup:**
- Blender 4.2.23 portable at `D:\ClaudeVideos\tools\blender\blender.exe`. A `portable` folder keeps its config on D:.
- MPFB 2.0.18 extension is installed. The MakeHuman CC0 asset pack is at `portable\extensions\.user\user_default\mpfb\data`.
- Downloads are in `D:\ClaudeVideos\tools\blender_dl`.

**Project:** `D:\ClaudeVideos\projects\blender-test`.
- `build_human.py`
  - builds `human.blend` (`blender -b --python`), using the MPFB services from `bl_ext.user_default.mpfb.services.*`
  - macro sliders → `bake_targets` → face-unit targets from `data/targets/expression/units/caucasian`, loaded under ARKit names (jawOpen, eyeSquintLeft, …) so `FaceService.interpolate_targets` copies them onto eyebrows and eyelashes
  - default rig, ENHANCED_SSS skin, mhclo assets
- `scene.py`
  - poses by armature-space rotation (`rotw`), keys expressions and drives the child shape keys from the body
  - heatmap: emission added to the shirt material from distance to an empty parented to spine03, giving a core plus `sin` rings
  - floor is a shadow catcher with transparent film; ffmpeg overlays the frames on a `gradients` sky `bg.png`
  - AgX Punchy; Cycles CPU at 24 samples with denoise, 720x1280, upscaled to 1080x1920

**Speed:** about 57 s per frame at 720p on this PC (i3-4160, HD 5450, 8 GB). 84 frames took about 80 min, so a 30 s short is roughly 11–12 h.

**Gotchas:**
- The default casualsuit04 shirt has a MakeHuman logo.
- An arm-down angle of 62° makes the hands cross in front. Use about 55°.
- The heatmap must be a material effect: a shrinkwrapped disk tore apart.
- A world-gradient background renders grey, so use the composite instead.
- Body animation is hand-keyed, so motion is limited without Mixamo.
