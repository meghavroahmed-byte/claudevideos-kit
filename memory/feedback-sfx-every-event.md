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
- Avoid hissy, white-noise-like sounds. In flood-slide v7 the user said the noisy SFX at the start sounded bad. The worst were breaths made from filtered noise and the bright top of the water gush. Make water sounds dark and low-passed, keep whooshes soft, and don't use fake noise breaths.
- No pitched "squeak" or sweeping-tone sounds for body actions such as sliding, slipping or rubbing. In flood-slide v8 the user said they sounded like a bird going "eu eu eu" and were very bad. Use dark, unpitched rubs, thumps and slaps instead.
- For slips, falls and slides, use a musical, pleasant cue: a soft descending marimba/mallet run plus a light water swish. Don't use a realistic rub or scrape, and no repeated foot thumps. The user found the rub plus "dep" thumps in flood-slide v9 annoying and asked for something that sounds nice (v10).
- Continuous water should not be filtered noise. In flood-slide v10 the user said it "sounds different", meaning wrong. Build it from many tiny resonant bubble blips (a babbling stream) over a soft low wash. Underwater gets slow, low bubbles with no hiss (v11).
- The user hates a constant "sho"/"shhh" hiss (flood-slide v11). Keep whooshes few, dark and low-passed (around 1 kHz), and only on big moves. No noise-based breaths at all. Low-pass the whole SFX bed at about 5 kHz before mixing.
- Small things count too: a continuous water bed that follows the water level, every slip, step, slap, breath and drip. In the user's words: "sukkho sukkho je kono bishoyer sound".
- Still follows [[feedback-unique-sfx]]: synthesize a new palette for each video, never stock or reused files.
