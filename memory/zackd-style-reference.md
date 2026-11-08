---
name: zackd-style-reference
description: User wants shorts in the style of the Zack D. Films YouTube channel (3D explainer shorts); what that style is and how we can reproduce it
metadata:
  node_type: memory
  type: user
  originSessionId: 481fdc7c-1f8f-4a5e-bb2a-602c28936371
  modified: 2026-11-07T19:04:26.381Z
---

On 2026-11-07 the user gave the short "Could Ancient Armor Stop Bullets?" (`D:\seedance 2.5\YTDown...Ancient-Armor...mp4`, 29.5 s) and the channel https://www.youtube.com/@zackdfilms as the reference. They asked for videos "akdom amn type er", made from either a voiceover or their own raw footage.

Style seen across several shorts (armor, stitches, blood vessels, sword paradox):
- **Hook:** opens straight on a "what if / if you…" action, with no intro.
- **Scenes:** realistic 3D humans on a soft blue-sky gradient or simple bright environment; one idea per shot; cuts every 1–2 s.
- **Effects:**
  - x-ray or glow reveals: red heatmap rings for force, red or purple glow, the body turning into blood vessels
  - extreme macro close-ups (skin, stitches, bullet)
  - slow-motion projectiles and whip pans
- **Text:** one or two words of bold white caption at lower-centre. The user has said no captions ([[feedback-no-captions]]), so leave these out unless they ask.
- **Ending:** objects on stands or a side-by-side compare.

**Backgrounds:** on 2026-11-07 the user said the background must be different for each video. Design every video's world for its own topic (street, lab, battlefield, body interior, etc.); don't reuse the blue sky as a default.

On 2026-11-07 the user also asked about doing this style in 2D, with Zack D-like camera and character movement. I offered two options: pure 2D, or 2D characters in a 3D world (the cartoon-3d-short pipeline).

**Decision (2026-11-07):**
- **Style:** the user's reply repeated both options. I read it as a mix: mostly their 2D character in a 3D world (gliding 3D camera), with pure-2D shots where they suit the beat.
- **Character:** the user's own character sheet (rig in `D:\ClaudeVideos\projects\short-1899\kit`).
- **Input:** the user is sending a voiceover for the first one.

**Superseded (2026-11-08):** the Zack-D-style cartoon remake of IMG_1899 was rejected. The user prefers the v2 motion-graphics look; see [[feedback-v2-mg-style-wins]]. Use this note only as background on that channel's grammar.

**How to apply:**
- Photoreal animated humans are beyond our three.js/canvas pipeline. Use Seedance clips for the human shots; I write the prompts.
- Build the objects, x-ray/heatmap FX, macro shots, slow-mo, SFX and the edit ourselves.
- Use the user's own topic. Never copy the channel's characters, logo or scenes.
- Related: [[reference-visual-style]], [[video-style-preferences]].
