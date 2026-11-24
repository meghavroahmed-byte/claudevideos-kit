---
name: Toilet-paper style is the house style (not realistic v2)
description: 2026-11-24 user: realistic RenderPeople v2 videos rejected; wants the toilet-paper (#1) style: makeHuman characters with expressive arm/leg acting, rich A-to-Z hand-built props
type: feedback
---
The user said the realistic v2 approach (RenderPeople humans, Poly Haven/Sketchfab props) isn't what they want. The style they want is projects/toilet-paper ("What did people use before toilet paper?"):
- characters from the kit's `makeHuman` (human.js) that move arms and legs nicely and act out every line;
- many hand-built, period-accurate props, from sheep's wool to sponges, pottery shards, corn cobs and longships (ancient.js / tp.js), each beat showing its own detailed thing;
- phrase captions in that video's style.

**How to apply:** build new shorts on the toilet-paper engine (src/human.js, anim.js, ancient.js, tp.js, props.js, main.js and index.html from projects/toilet-paper), not on _kit/real.js. All 58 batch projects keep a version in that engine as `src/shots_v1.js`; when restoring one, strip the face `stamp()` and glass `infoCard()` calls (still banned) and remove floating text. If the user supplies their own character design, use it for the main character. 3D is fine, as long as it is in this style.
Still apply: new/different characters per video, moving camera + cuts, busy scenes, SFX below the voice.
