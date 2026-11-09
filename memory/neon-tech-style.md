---
name: Neon Tech style (captioned 3D-grid shorts)
description: 2026-11-09 the user asked for a full copy of a reference creator's reel style (dark 3D world, word-by-word captions). Kit: projects/neon-tech-short/kit
type: project
---
The user sent 3 reference reels (2 from a Hinglish tech-explainer creator, 1 pastel 2D body-science cartoon by someone else) and asked for "hubhu" the same style, captions included.

**NO subtitles here either.** On 2026-11-09 the user saw the captioned demo and said "subtitle hbe na". The caption engine is kept but off (`CFG.captions = false`). Keep everything else from the reference look. Short labels inside cards and the FOLLOW/TWIST stamps are OK.

What the reference does (studied from contact sheets):
- 9:16, 30 fps, ~100-150 s. **One continuous camera move** through a dark 3D world (night rail line, neon city, blue perspective grid map). Almost no hard cuts (scene-cut detector found 0-6 per video). Beats change by popping UI on/off over the same moving world.
- Captions sit top-centre (~y 18-25%). Very bold geometric sans, white. 1-2 short lines (2-5 words). Words land one by one: grey and blurred, then they slide up and turn white. 1-2 keywords per line turn yellow (gradient + glow), or pink/red for bad/negative words.
- HUD: small letter-spaced "EP 12 · TECH" at top-left, Instagram handle chip at top-right, thin orange-to-yellow progress bar at the very top.
- Dark navy glass cards with thin borders and small caps labels. Green/red status pills, ID chips, dashed arrows, glowing route lines, tower pins with expanding rings, counters, % ring gauges.
- Signature beats: "TWIST!" as a 3D extruded yellow italic slam; a big yellow number ("7-8 MB", "2018", "4,00,000+"); "Comment karo:" card with typed answer; end "Aise *tech secrets* ke liye... FOLLOW" plus a profile card with a cursor clicking Follow.
- Dark scrim behind the captions, vignette, slight grain.

**How to apply:** start from projects/neon-tech-short/kit (neon.js engine, story.js per video). Use the user's own handle, never the reference creator's handle, logo or exact scenes. Captions follow the user's language (Banglish/Bangla; Anek Bangla font is the fallback).

**Also NO branding UI.** On 2026-11-09 the user said not to add the Instagram follow card or the top tags. Keep these off: the EP tag, the handle chip and the FOLLOW/profile CTA (`CFG.tag`, `CFG.handle_chip`, `CFG.cta` are all false). The thin progress bar stays.
The user wants videos made from their own voiceover plus script, "exactly" like the 2 reference reels (train/rail one and food-delivery city one).
