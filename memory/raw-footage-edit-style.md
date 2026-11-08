---
name: raw-footage-edit-style
description: "When editing the user's raw on-camera footage: show their face rarely; mostly top-level explainer graphics, maps, 2D cartoon animation over their voice"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 481fdc7c-1f8f-4a5e-bb2a-602c28936371
  modified: 2026-11-07T13:42:48.936Z
---

On 2026-11-07 the user said they will send raw, unedited footage of themselves talking. It is not a voiceover.

What they want:
- I find the cuts myself: retakes, mistakes, silences.
- I build the full edit.
- Their face must NOT be shown often.

The visuals should mostly be motion graphics, map animation, 2D cartoon animation and explainer style, all at "top level". "Normal" quality will not do.

The face-cam shots must never look raw ("খ্যাত"). The footage is grainy. Treat it fully:
- denoise
- color grade
- skin tone
- sharpen
- vignette or framing
- stabilize
- audio cleanup

**Face shots: only where they look straight into the camera.** Never use shots where they look left or right, off-camera, while holding the mic. The user was annoyed this was missed on 2026-11-07. Before choosing face beats, check gaze frame by frame on a contact sheet.

**No samples or approval stops.** The user said "নমুনা টমুনা না": do the full edit end-to-end and deliver the finished video. Check quality myself (contact sheets, frames) instead of asking.

The first raw video (announced 2026-11-07) is a **9:16 Short**. The user spoke slowly in it ("সোলো"). To fix the pace:
- Tighten the pauses.
- Speed the speech up about 1.1–1.25x with pitch-preserving atempo, so the voice stays natural.

**Delivered 2026-11-07, awaiting feedback:** `D:\seedance 2.5\IMG_1899 - Short (edited v2).mp4`
- Format: 50.8 s, 9:16, -14.3 LUFS.
- Project: `D:\ClaudeVideos\projects\short-1899`.
  - `kit/short2.html` and `kit/mg.js` (the motion-graphics kit)
  - `kit/edl.json` (the cut list)
  - `kit/join_s.ps1` (join and mix)
- The earlier `out/short_final.mp4` (the cartoon version) was rejected.

**IMG_1900 feedback (2026-11-07):**
- A face shot where the head was turned slightly to the side got through, and the user complained again. Be STRICT: if in doubt, drop the shot. Check at 6 fps close-ups.
- A quick spoken phrase ("যেটা অলরেডি হয়েই গেছে", 0.8 s) was cut because whisper rendered it as junk ("কো কো"). Never drop a speech chunk just because its transcript is garbage. Check the RMS energy profile of every gap and re-transcribe with a prompt.
- Use the user's character LIGHTLY in every raw-footage edit (pointing at the map/globe, worried bust, on the phone for the CTA). Pre-render it as PNG sprites from the rig with lip-sync.
- The bar is "best of best". Apply every past lesson at once: karaoke captions, varied transitions, shake, depth layers, cloud fly-through maps, a distinct colour per section, no navy backgrounds.

**Why:** they see themselves as the voice and the explainer graphics as the show. The [[feedback-pro-visual-bar]] applies too.

**How to apply:**
- Face on screen about 10–15% of runtime: the intro hook, a few key or emotional lines, the outro. The rest is full-screen graphics over their audio.
- Use graphics to hide jump cuts.
- Work under `D:\ClaudeVideos\projects\` per CLAUDE.md.
- Never alter or delete the raw files.

Related: [[video-style-preferences]], [[sheetkal-winter-video]]
