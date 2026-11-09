---
name: cloud-kit-repo
description: Private GitHub repo meghavroahmed-byte/claudevideos-kit holds all video kits/skill/memory/map assets for cloud sessions (pushed 2026-11-09)
metadata:
  node_type: memory
  type: reference
  originSessionId: 481fdc7c-1f8f-4a5e-bb2a-602c28936371
  modified: 2026-11-08T20:47:54.083Z
---

On 2026-11-09 the user asked to take "everything possible" from the PC into cloud sessions.

- **Repo:** https://github.com/meghavroahmed-byte/claudevideos-kit (PRIVATE).
  - First commit 8d810f7, 275 files, ~125 MB.
- **Local copy:** `D:\ClaudeVideos\cloud-kit`. It contains:
  - the megh-video skill and the memory notes
  - project kits: short-1899 v2 MG, vo-asif 16:9, map-short1 3D map engine, and other projects
  - NASA Mercator tiles and elevation tiles
  - README with the Linux setup and path notes
- **Not included:** voices, videos, renders, Blender, whisper. Upload media per project.
- **Kits use absolute D:\ paths.** The README lists what to change in the cloud.
- **Portable tools on the PC:**
  - git: `D:\ClaudeVideos\tools\mingit\cmd\git.exe`
  - gh: `D:\ClaudeVideos\tools\gh\bin\gh.exe`, with `GH_CONFIG_DIR=D:\ClaudeVideos\tools\gh\config`, logged in as meghavroahmed-byte
- **To sync new work:**
  - Copy the changed kits into cloud-kit.
  - Commit and push from there, after asking the user.

Related: [[megh-video-skill]], [[pc-video-toolchain]]
