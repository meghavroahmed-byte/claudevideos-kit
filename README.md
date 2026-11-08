# ClaudeVideos cloud kit

This holds the code, templates and data from Megh's video workflow (Bangla YouTube Shorts and long videos). It was copied from the Windows PC (`D:\ClaudeVideos`) so that Claude Code cloud sessions can use it.

**Not included:** original voice/video files, renders, Blender, whisper, node_modules. Upload media per project when needed.

## Layout
| Path | What |
|---|---|
| `skills/megh-video/SKILL.md` | House-style rules and workflow. **Read first.** |
| `memory/*.md` | Saved feedback and project notes. Start with `MEMORY.md`. |
| `projects/short-1899/kit` | Approved v2 "Ice & Ember" motion-graphics Short kit: `short2.html`, `mg.js`, `wpro.js`, `wkit.js`, plus the user's character rig (`rigcore.js`, `common.js`, `sheet.jpg`). |
| `projects/vo-asif/kit` | 16:9 long-video MG template kit: `hum.html`, `hum.js`, `beats.js`, plus `w2d.js` (a 2D window in every beat). |
| `projects/map-short1/kit` | 9:16 map-short engines. `map3d.html` is the 3D terrain/globe engine (three.js), built from `engine3d.js`, `tk2d.js`, `scenes.js` (chibi characters and story cards) and `beats3d.js`. `map.html` is the older flat 2D version. |
| `projects/short-1900`, `map-mix-1`, `infant-amnesia` | Other earlier project kits. |
| `assets/maps/merc` | NASA Blue Marble reprojected to Web Mercator, with ocean recoloured. `L0.jpg` covers the world at 4096 px; `L1_x_y.jpg` is a 6x6 grid of 4000 px tiles. |
| `assets/maps/elev/tiles` | 8-bit elevation in 3600 px equirectangular tiles, 60° each. Sea level is gray value 62; km = (v-62)*0.034. Source: NASA via Wikimedia Commons, CC BY-SA 4.0, credit required. |
| `assets/maps/tiles/bm_overview_6000.jpg` | Equirectangular Blue Marble used as the globe texture. |

## Running in the cloud (Linux)
1. Run `npm install` (see `package.json`).
2. Install ffmpeg with `apt-get install ffmpeg`.
3. Install Chrome or Chromium for puppeteer.
4. The kits use **absolute Windows paths**. Change them to repo-relative paths:
   - `D:/ClaudeVideos/cache/maps/...` → `assets/maps/...`
   - `D:/ClaudeVideos/cache/npm/.../puppeteer-core` → `puppeteer-core`
   - `CHROME` in `run.js` → the Linux Chrome path
5. Render pattern: `node run.js still <page.html> <out.png> "t1,t2"` for test frames, and `node run.js video <page.html> <out.mp4> <frames> 30 <startFrame>` for video. Split long videos into parts and run them in parallel. See each project's `render.ps1`.
6. **Voice:** never filter the user's voice. A plain gain is allowed if it's very quiet. SFX must be newly synthesized for every video (`sfx.ps1` shows how).
