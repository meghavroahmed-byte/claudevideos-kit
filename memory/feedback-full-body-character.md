---
name: feedback-full-body-character
description: "Always use the user's character FULL BODY with real walk/arm/leg animation (rig2.js), never the half-body bust — 2026-11-09"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 481fdc7c-1f8f-4a5e-bb2a-602c28936371
  modified: 2026-11-09T00:42:40.813Z
---

On 2026-11-09 the user complained:
- Their character "can't walk properly".
- I kept using only half the body (the bust/circle window).

They want it animated like a real animated-film character: walking, running, arm and leg movement, eating, and every other kind of movement, with the full body (hands and legs). They asked to see a demo first.

**Built:** `D:\ClaudeVideos\projects\char-rig\kit`:
- `rig2.js`: full-body rig.
  - Front and side views.
  - Head, torso, hands and shoes are cut from `sheet.jpg`. Sleeves and jeans are jointed tubes.
  - IK arms let the hand reach the mouth or an object.
  - Props: apple, glass, phone.
- `anim2.js`: action library:
  - side: walkS, runS, standS, sitS
  - front: idle, wave, point, talk, think, shrug, clap, eat, drink, jumpF, dance, cheer, walkF
- `demo.html` plays a timeline with turn transitions.

**Gotchas fixed:**
- The sheet's pocket-hand wedge and the "Normal" label were removed from the torso cut.
- IK bend sign: the left arm needs bend +1 and the right arm bend -1, so elbows point outward.
- Walk speed is 504 px/s × scale and run speed 1335 px/s × scale, to avoid foot sliding.

Demo: `D:\ClaudeVideos\renders\character_movement_demo.mp4`. User feedback is pending.

**v2 additions (same day):**
- Faces via `p.face`: angry and confused are cut from the sheet and clipped into the normal hood; sad (tear), happy and surprised are drawn on.
- Finger hands via `p.handL`/`p.handR`: presets open, relax, fist, point, peace, thumb, grip, three, or a custom curl array. The `handV` hand has per-finger curl.
- Back view: `drawCharB` and the walkB action.
- New actions: thumbsUp, count, fistPump, angry, sad, surprised, confused, waveF.
- Demo v2: `D:\ClaudeVideos\renders\character_movement_demo_v2.mp4`.

**How to apply:** in future videos, use `rig2` full-body actions instead of the bust/`charWin`, unless the user asks otherwise.

Related: [[megh-video-skill]], [[video-style-preferences]]
