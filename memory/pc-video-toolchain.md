---
name: pc-video-toolchain
description: "User's Windows PC setup for video editing with HyperFrames — portable Node 22 + FFmpeg in user folder, whisper.cpp blocked by missing VC++ runtime"
metadata:
  node_type: memory
  type: project
  originSessionId: 481fdc7c-1f8f-4a5e-bb2a-602c28936371
  modified: 2026-11-08T00:24:56.138Z
---

As of 2026-11-06 (Windows 10 Home):
- Node.js 22 and FFmpeg are installed **portable in the user folder**, because the admin (UAC) prompt didn't work. Don't assume a system-wide install or admin rights.
- HyperFrames is the video-render tool used for edits.
- whisper.cpp:
  - The old C: install vanished by 2026-11-07.
  - Re-installed on 2026-11-07 on D: as `D:\ClaudeVideos\tools\whisper\bin\Release\whisper-cli.exe` (release b5454; the "latest" link 404s).
  - Model: `D:\ClaudeVideos\tools\whisper\ggml-large-v3-turbo-q5_0.bin`.
  - VC++ DLLs were copied next to the exe from `C:\Program Files\OpenToonz`.
- The rig code copy for new projects is in `D:\ClaudeVideos\projects\short-1899\kit`.
- Copy-Item to D: sometimes fails with a "path not found" error right after mkdir. Use robocopy, which retries. It's slow on this 4-thread CPU (~4-5x realtime), so run long files in the background. Bangla output has spelling errors — use it for timestamps, the user's script for the text.
- No Python. Rendering pipeline: canvas page + puppeteer-core from the hyperframes npx cache + chrome-headless-shell in `~/.cache/hyperframes/chrome`, frames piped to ffmpeg. Bangla font: "Nirmala UI" (system).

- **Long voiceovers (2026-11-08):** whisper turbo on a 19-min file ran ~90 min and then exited with no output. A 60 s chunk alone took over 10 min. Don't use whisper for long files. Instead, align the user's script to the audio:
  - Take `silencedetect` pauses (-35 dB, 0.25 s).
  - Run a DP sentence aligner (`D:\ClaudeVideos\projects\vo-asif\align.js`) that snaps sentence ends to pauses by speaking rate, with digits weighted.
  - Done that way, it finished in seconds.
- 16:9 canvas render (`vo-asif/kit/hum.html`, half-res bloom, x264 fast): 3 workers together render ~9 fps, so a 19-min video takes ~1 h.

**Why:** No admin rights on this PC.
**How to apply:** Use the portable binaries; don't ask the user to install VC++ anymore.

Related: [[iran-cable-explainer]], [[top5-video-edits]]
