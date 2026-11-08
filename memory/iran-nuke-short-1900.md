---
name: iran-nuke-short-1900
description: "IMG_1900 raw-footage Short (\"what if America nukes Iran\") built in the 3-reference combo style with three.js; project files and pipeline"
metadata:
  node_type: memory
  type: project
  originSessionId: 481fdc7c-1f8f-4a5e-bb2a-602c28936371
  modified: 2026-11-07T12:36:40.773Z
---

IMG_1900.MOV is the second raw talking-head Short (2026-11-07), 110 s raw.
- Topic: "কী হবে যদি আমেরিকা ইরানে পারমাণবিক হামলা করে?"
- Cut to 54.9 s at 1.18x.
- First edit in the 3-reference combo style ([[reference-visual-style]]).

Project: `D:\ClaudeVideos\projects\short-1900`
- `kit/v.html`: beats.
- `kit/scenes.js`: three.js scenes.
  - Middle East 3D map from world-atlas 50m: bomb, missile arcs, bases, war tint, Hormuz tankers, barrier.
  - globe with danger shell
  - night city with mushroom cloud
  - crowd
  - oil barrel
  - radiation sign
- `kit/core.js`: captions, headlines, editorial stage, flags, pills, gauge.
- `kit/join.ps1`: mix with boom and drone.
- npm deps are local: three@0.169, world-atlas, topojson-client, Anek Bangla variable (condensed), Hind Siliguri.
- WebGL works in headless Chrome (software D3D11), about 0.2 s per frame.
- Face windows (straight gaze only): 1.45–3.0, 48.2–49.4, 54.0–end.

**Gotcha:** never round-trip UTF-8 files through PowerShell 5.1 `Get-Content -Raw`/`Set-Content`. It reads BOM-less UTF-8 as ANSI and corrupts the Bangla. Use the Edit tool, or `[IO.File]` with UTF8.
- Recovery: read the file as UTF-8, `GetEncoding(1252).GetBytes`, then decode as UTF-8.
