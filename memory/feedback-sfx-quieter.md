---
name: SFX quieter than the voice
description: 2026-11-24 user: SFX is too loud, it is heard over the voice
type: feedback
---
The user said the SFX is louder than the voice. The voice must always be clearly on top.

**Why:** the old mix boosted the SFX bed +11 dB with light ducking (ratio 2).

**How to apply:** render.sh now mixes the SFX bed at −2 dB with hard sidechain ducking under the voice (threshold 0.02, ratio 6). Keep individual `put()` gains around −14..−20 dB; nothing louder than about −10. Before delivering, listen and check that the voice clearly sits above every effect.
