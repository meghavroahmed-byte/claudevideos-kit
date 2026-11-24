---
name: Character animation must be clean (no clipping, real motion)
description: 2026-11-24 user: characters' hands sometimes sink into the body; swimming/walking etc. must look correct and pro
type: feedback
---
The user noticed hands and arms sometimes passing into the body (e.g. the duck-float arms and pose blends), and said all character motion (walking, swimming, sitting, reaching, A to Z) must look right, or the whole video looks bad.

**How to apply:**
- Check every pose in stills from more than one angle for arm/hand/leg intersections with the torso, other limbs and props. Fix with IK or by adjusting angles; don't ship clipping.
- Use proper motion for each action: real walk cycles with planted feet, a correct swim stroke (crawl/breaststroke/treading water), sitting with the butt on the seat and feet on the floor, hands actually touching what they hold.
- Use clip animation (Mixamo/RenderPeople clips) where possible instead of hand-made rotations; blend smoothly between actions.
- Before rendering the full video, look specifically at the hands in close-ups.
