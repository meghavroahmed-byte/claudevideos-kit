---
name: lost-humans-long-video
description: "19-min 16:9 \"extinct human species\" video from the MD-ASIF-BAPARY Cartesia voiceover (2026-11-08) — project, reusable 16:9 MG template kit, output paths"
metadata:
  node_type: memory
  type: project
  originSessionId: 481fdc7c-1f8f-4a5e-bb2a-602c28936371
  modified: 2026-11-08T04:35:07.461Z
---

On 2026-11-08 I made a 19-min 16:9 video from the user's Cartesia voiceover. Topic: why only Homo sapiens survives; covers erectus, Neanderthal, Denisovan, floresiensis.
- Voiceover: `C:\Users\avroa\Downloads\cartesia_2026-11-07T20_00_02Z_MD-ASIF-BAPARY_sonic-3.6_bn.wav`. The user pasted the script in chat.
- Project: `D:\ClaudeVideos\projects\vo-asif`.

**Reusable 16:9 v2 template kit** (`kit/hum.js`, `hum.html`, `beats.js`):
- Templates: hero, list, stat, cmp, scene, char, map, chapter, timeline, bars, dna, tree, net, height, brain, rewind, profile, duo, big, custom.
- Section colour modes: ice, ember, gold, violet, jungle, teal, red.
- About 30 new line icons.
- Beats are one line each: `bt('anchor text', 'tpl', {...})`.
- Use this kit for future long videos.

**Other parts:**
- SFX palette: `sfx/sfx_vo-asif_*` (bone-flute whooshes, stone clicks, frame drums, riser, shimmer, drone bed). Mixed by `mix.js` from render metadata.
- Output: `D:\ClaudeVideos\renders\Haray Jawa Manush Projati (vo-asif).mp4` and `vo-asif_phone.mp4`.
- Timing comes from silence alignment, not whisper, so some beats may land up to ~1 sentence off. User feedback on this is pending.

**v2 (2026-11-08)** came after the user's feedback that v1 was all MG with no 2D ([[feedback-mg-plus-2d-every-beat]]):
- New `kit/w2d.js` auto-adds an acting 2D window to every beat:
  - hero gets a circle window; stat a left circle; cmp scene panels; big a top card; chapter a band; map a corner pip.
  - Diagram templates are scaled to 0.72 with a portrait side card.
- The user's rig appears every ~3 beats (pointing, talking or thinking).
- Output: `... (vo-asif v2).mp4` and `vo-asif_v2_phone.mp4`. The v1 parts are in `out_v1`.

Related: [[megh-video-skill]], [[pc-video-toolchain]], [[feedback-v2-mg-style-wins]]
