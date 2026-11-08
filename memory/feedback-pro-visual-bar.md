---
name: feedback-pro-visual-bar
description: "User rejected the first winter video as \"normal\" — black backgrounds, few characters, basic text motion; the quality bar for every video"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 481fdc7c-1f8f-4a5e-bb2a-602c28936371
  modified: 2026-11-06T19:23:20.994Z
---

On 2026-11-07 the user rejected the first cut of the winter video. Their reasons:
- The motion graphics looked "normal".
- Many scenes had just a black background, including scenes with their character.
- When the voice says how people survived, those people were not shown doing it.
- The text animation was basic.

They want my model's "best of best" every time, and want me to use the skills they installed. Their skill is `~/.claude/skills/cartoon-3d-short`.

**Why:** Retention and a pro look are their main goal. Flat icons on dark backgrounds read as cheap.

**How to apply:**
- Every scene needs a real environment. Never use a flat or black fill: use a painted tundra, hut interior, cave, a work bench with a blurred background, or a city.
- Show characters literally acting out each sentence: sewing, scraping, digging, carrying, sitting by the fire, storytelling.
- Use ink-outlined, cel-lit characters with expressions.
- Use kinetic text: word reveals, glass tags, shine, count-ups.
- Add depth: blurred foregrounds, lens snow, bokeh.
- Vary camera moves and transitions (dissolve, zoom, whip, flash).
- Maps: fly through clouds, show people walking the routes, drop pins.
- Review contact sheets of every beat before rendering.

The reusable kit for this lives in `wpro.js` in the session rig folder.

Related: [[video-style-preferences]], [[sheetkal-winter-video]]
