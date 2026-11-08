---
name: feedback-unique-sfx
description: "User wants unique, new sound effects in every video — never reuse the same whoosh/pop/boom set, never stock sounds that appear in other creators' videos"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 481fdc7c-1f8f-4a5e-bb2a-602c28936371
  modified: 2026-11-07T19:08:37.126Z
---

On 2026-11-08 the user said: "sound effect gulo ak ee use korbana ogula unique ar new new ta use korba jeno onno karor video er sathe na mile jay".

Until then every edit used the same synthesized set (pink-noise whoosh, two-sine pop, sine-sweep boom, drone bed) from the shared join.ps1.

**Why:** they want their videos to sound distinct, both from their own earlier videos and from other creators. Stock or reused SFX make a channel sound generic.

**How to apply:**
- Design a fresh SFX palette for EACH video, synthesized with ffmpeg (`aevalsrc`/`anoisesrc` + filters).
- Vary per video: noise colour, filter sweeps, pitch, envelopes, layering, stereo panning.
- Theme the palette to the topic, e.g. icy crackle and wind gusts for winter; metallic sirens and sub-booms for war; organic thumps for body/science.
- Make several variants per type (e.g. 3–4 different whooshes rotated across cuts), so even inside one video the same sound doesn't repeat back-to-back.
- Never download stock packs or reuse a previous project's .wav files.
- Name the palette per project (e.g. `sfx_<project>_whoosh1.wav`).
- Mention in the delivery message that the SFX are new for this video.
- Related: [[megh-video-skill]].
