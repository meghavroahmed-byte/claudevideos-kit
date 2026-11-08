---
name: map-short-style
description: "Map-animation Short style the user wants (ref: GeoGlobeTales Chile short) + downloaded NASA satellite tiles on D: — 2026-11-09"
metadata:
  node_type: memory
  type: project
  originSessionId: 481fdc7c-1f8f-4a5e-bb2a-602c28936371
  modified: 2026-11-08T18:44:34.883Z
---

On 2026-11-09 the user wants a 9:16 map-animation Short ("same to same") like the reference https://youtube.com/shorts/mB1U5W8nwTg. That reference is GeoGlobeTales: "Why Chile is so long", 80 s. They will send their own voiceover.

**Reference style:**
- Satellite basemap.
- The target country gets a red glow fill; neighbours get flat colour fills (orange, blue).
- A country shape is overlaid elsewhere for scale (Chile laid over Europe) with yellow km/mi measurement labels.
- White hand-drawn arrows, and fun objects on the map (a chili pepper on Chile).
- A parchment "15th century" map with ships sailing in.
- A colourful historical political map.
- 3D oblique terrain flyover (Andes).
- AI-illustrated story scenes, which we can't generate: use our 2D or the user's Seedance.
- Captions: the reference has them, but [[feedback-no-captions]] still applies unless the user says otherwise.

**Assets:**
- NASA Blue Marble (public domain, 24000x12000) from Wikimedia: `D:\ClaudeVideos\cache\maps\bluemarble_12000.jpg`.
- Split with Blender (`split.py`) into `tiles\bm_{tx}_{ty}.jpg`: 6x3 tiles of 4000 px, each 60°. Tile (0,0) is lon -180..-120, lat 90..30.
- Overview: `bm_overview_6000.jpg`.
- The ocean is flat navy, with no bathymetry.
- eoimages.gsfc.nasa.gov times out from this PC.
- ffmpeg can't decode images >16384 px.

**First one built 2026-11-09:**
- Project: `D:\ClaudeVideos\projects\map-short1`. Output: `D:\ClaudeVideos\renders\Chile Keno Eto Lomba (map short).mp4`. User feedback is pending.
- Reusable 9:16 satellite map engine: `kit/map.html`, with Mercator tiles from `prep.html` in `D:\ClaudeVideos\cache\maps\merc` (L0 at 4096 px plus 6x6 L1 tiles at 4000 px).
- Engine toolkit: fillC, band, shapeAt, label, arrow, measure, cityDot, parchment, ship, charWin. The camera is set per beat, `bt(anchor, {cam, draw})`.
- Whisper on this 70 s voice dropped half the lines, so timing came from silence pauses (`mktl.js`).
- Render: 3 workers, about 20 min for 70 s.

**v2 (3D) built 2026-11-09 after v1 was rejected** ([[feedback-raw-voice-3d-maps]]):
- Output: `... (map short v2 3D).mp4`.
- Engine: `kit/map3d.html` plus `engine3d.js` (three.js tilted terrain, 300x300 grid, displaced by elevation).
- Elevation: an 8-bit NASA-derived map, CC BY-SA 4.0 on Wikimedia, at `D:\ClaudeVideos\cache\maps\elev\tiles`. Sea level is gray 62; km = (v-62)*0.034.
- The same engine also does the globe intro/outro.
- `scenes.js`: chibi characters `chib()` (morion, feather, kepi, bowler; flag, musket, spear, telescope) and `storyCard()` scenes.
- `tk2d.js`: the 2D toolkit, which draws onto the ground texture.
- Camera 'd' is relative to the region span: bigger span = further away.
- Render: 3 workers, 15 min for 70 s.

Related: [[pc-video-toolchain]], [[iran-nuke-short-1900]]
