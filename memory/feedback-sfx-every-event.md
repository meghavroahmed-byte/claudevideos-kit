---
name: feedback-sfx-every-event
description: "Every on-screen event in every video gets its own SFX — actions, impacts, water, breaths, camera moves; nothing visible happens silently"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-11-17
---

On 2026-11-17 (flood-slide short) the user said: "protteka bishoyer SFX sound byabohar koro protteka video r".

**Why:** a video where things move or hit with no sound feels flat. They want the sound design to follow everything that happens on screen.

**How to apply:**
- Before mixing, list every visible event with its time: each action (climb, slip, push, brace), impact (bump, splash, landing), state change (water rising, filling, pressure), breath or voice reaction (gasp, panic breathing), and every big camera move (whip out, push in, fly-through). Give each one a sound.
- Repeated actions (strokes, steps, squeaks) get a sound each time, with small variations.
- Level: the voice must stay clear, but the SFX must also be clearly heard. The flood-slide mixes went like this:
  - v1 (SFX bed about 11 dB under the voice, no ducking): user said the SFX were louder than the voice. Peaky hits (splash, whoosh, roar) cut through on a phone.
  - v5 (-8 dB plus heavy ducking, SFX about 20 dB under): too quiet.
  - v6: the user asked for more SFX. The SFX bed sits about 6 dB under the voice (voice -15.6 LUFS, ducked SFX about -21 LUFS). It uses light sidechain ducking (threshold 0.05, ratio 2) and a limiter on the final mix.
- Continuous beds (water ambience, underwater rumble) stay LOW, about 10 dB under the event sounds, and swell only when the action calls for it (flood, filling). In v6 the user said "panir awaz pura video te onk zore".
- Small things count too: a continuous water bed that follows the water level, every slip, step, slap, breath and drip. In the user's words: "sukkho sukkho je kono bishoyer sound".
- Still follows [[feedback-unique-sfx]]: synthesize a new palette for each video, never stock or reused files.
