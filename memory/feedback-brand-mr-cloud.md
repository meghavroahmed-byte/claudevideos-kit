---
name: feedback-brand-mr-cloud
description: "The main character always wears 'MR. CLOUD' printed on the chest — a brand watermark so the videos can't be copied as someone else's"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-11-18
---

On 2026-11-18, during the how-rare short, the user asked for "MR. CLOUD" (in English, exactly that text) to be written on the main character's chest, or somewhere on them. It works as a watermark so nobody can copy the video.

**Why:** brand protection. The character is the one who appears most, so the print is on screen for most of the video and can't be cropped out like a corner logo.

**How to apply:**
- In every video, the main character gets a chest print reading "MR. CLOUD": white heavy letters with a dark outline, curved onto the torso.
- In the zach-d-films engine this is `makeHuman(outfit, { chestText: 'MR. CLOUD' })`, implemented in `projects/how-rare/src/human.js`. Copy that human.js into new projects. For outfits without a shirt (swim), print it on the chest skin anyway, or add a small tank top.
- Check a still to confirm the text is readable at the usual camera distance.
