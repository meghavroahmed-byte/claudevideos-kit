# Global rules for every session

## Video work lives on D:, never on C:
The user's C: drive is small. For ANY video / animation / media project (HyperFrames, Remotion, ffmpeg edits, renders, AI models, downloads):

- Create the project folder under `D:\ClaudeVideos\projects\<project-name>` and move the session there (change_directory) before building anything. Do not build projects in the session's scratch folder on C:.
- Write renders and exports to `D:\ClaudeVideos\renders\` (or next to the user's own source files on D:, if they keep them there).
- Put temporary/intermediate files (extracted frames, transcodes, downloads, models) in `D:\ClaudeVideos\temp\`, not in %TEMP% or the scratchpad on C:.
- Caches are already redirected to D: — keep it that way:
  - npm/npx cache: `D:\ClaudeVideos\cache\npm` (set in the user .npmrc)
  - HyperFrames cache: `C:\Users\avroa\.cache\hyperframes` is a junction → `D:\ClaudeVideos\cache\hyperframes`
  - HyperFrames frame-extract cache: `%TEMP%\hyperframes-extract-cache-u` is a junction → `D:\ClaudeVideos\cache\hyperframes-extract`
  - If a new tool wants a big cache/model folder on C:, point it to `D:\ClaudeVideos\cache\<tool>` (env var, config, or a directory junction) instead.
- Long Windows paths break renders: if needed, map the D: project to a short drive letter with `subst` and remove the mapping when done.

## The user's character: use it in EVERY video project (any session)
- The user has their own character (hoodie guy from their sheet). Every video/animation you make for them must use THIS character, not a character you draw or a stock one.
- Always use the **full-body rig**, never a half-body bust or circle-window head: `D:\ClaudeVideos\projects\char-rig\kit\`
  - `rig2.js` (front / side / back views, finger hands, faces), `anim2.js` (ACT action library: walk, run, sit, eat, drink, wave, point, talk, think, angry, sad, happy, surprised, confused, thumbsUp, count, dance, walk-away…), needs `common.js`, `rigcore.js`, `sheet.jpg`.
  - Usage guide: `D:\ClaudeVideos\projects\char-rig\kit\README.md`; working example: `demo.html`.
  - Copy the kit into the new project's folder and build on it; never edit the user's `sheet.jpg`.
- Approved demo: `D:\ClaudeVideos\renders\character_movement_demo_v2.mp4`.
- If the megh-video skill exists, follow it too.

## Communication
- The user writes in Bangla / Banglish; reply in Banglish (Bangla in Latin letters) unless they write fully in Bangla script.
- Never delete the user's original source videos.
