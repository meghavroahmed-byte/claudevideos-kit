---
name: megh-video
description: The user's own house style and full workflow for making their Bangla YouTube videos (Shorts 9:16 and long 16:9) from a voiceover or their raw talking footage. It covers every rule they have taught: the approved "v2" motion-graphics look (dark ice/ember MG, draw-on icons, glass panels, kinetic keywords, small framed 2D accents), no captions, their own character used lightly, strict face-shot rules, audio, delivery and the PC toolchain. Use it whenever the user sends a voiceover, a raw video (.MOV/.mp4), a script or a reference and asks for a video, short, edit or explainer. Also use it for "amar style-e", "jevabe shikhaisi", "megh video", or when they say "skill use koro".
---

# Megh video: the user's house style

The user makes Bangla explainer videos for YouTube. They write in Banglish, so reply in Banglish (Bangla in Latin letters). If they write fully in Bangla script, reply in Bangla script.

Their bar is **"best of best"**. "Normal" or "generic" work gets rejected. Apply EVERY rule below at once, not just some.

## 0. Non-negotiables
- **Work on D:, never C:.** Projects go in `D:\ClaudeVideos\projects\<name>`, renders in `D:\ClaudeVideos\renders\`, temp files in `D:\ClaudeVideos\temp\`, caches in `D:\ClaudeVideos\cache\`.
- Never delete or alter the user's original footage or voice files.
- **No samples, no approval stops.** Do the whole video end to end and deliver it. Check quality yourself with contact sheets and frames, not by asking.
- **No captions or subtitles.** Where captions would have gone, add more motion graphics. Short keyword headlines, labels, pills and stamps that are part of the graphics are OK.
- Keep the user's **original voice**. Never replace it with TTS.
- Always deliver the full-res file plus a **phone preview under 30 MB**, sent with SendUserFile.

## 1. Input types
| They send | What to do |
|---|---|
| **Voiceover** (.wav/.mp3) | Get line timings, then the whole picture is animation. Their character narrates, lip-synced to the voice envelope. |
| **Raw footage** (them talking) | Find the cuts yourself (retakes, mistakes, silences), tighten the pauses, speed up about 1.1–1.25x with pitch-preserving `atempo` (1.18x worked). Then cover most of the runtime with graphics (section 4). |
| **Reference video/channel** | Make contact sheets (ffmpeg `fps=2,tile`), study the patterns, save them as a memory, and borrow the *style* only. Never copy their characters, logos or scenes. |

If they say "eita/oita type", ask which format they mean (Short 9:16 or long 16:9) only if it can't be inferred.

## 2. Look and feel: the "v2" motion-graphics house style
**The approved reference is the IMG_1899 v2 short:**
- File: `D:\seedance 2.5\IMG_1899 - Short (edited v2).mp4`
- Page: `D:\ClaudeVideos\projects\short-1899\kit\short2.html` with `mg.js`, `wpro.js`, `wkit.js`
- Start every new short by copying that kit and building on it.

On 2026-11-08 a Zack-D-style remake made of full-screen cartoon world shots was rejected. The user said the v2 one "beshi professional lage", so make every video like v2.

What v2 looks like:
- **Motion-graphics first.**
  - Dark ice/ember MG backgrounds (`bgMG`), colour-coded per section (e.g. ice blue for cold, ember gold for warmth/fire, red for danger, green for safety).
  - Glass panels, line-art icons that **draw on** (`drawIcon`), icon badges, ring and thermo gauges, counters, radial "3 uses" diagrams, check/strike/X marks.
  - HUD corners, chips, particles, snow/ember fields, light streaks, tunnels.
- **Kinetic type for keywords only:** `glitchText`, `slam`, `hlText`, `subLine`, `bigNum`. Short keywords, never full sentences.
- **2D animation is required in every MG beat, inside a frame.**
  - Use `worldIn` to put a mini world (tundra, cave, campfire, map, people acting) inside a circle or rounded card window.
  - Every beat must have one. On 2026-11-08 the user said "jekhanei motion graphics sekhanei 2d animation must" after a 19-min video that was almost all icons and text.
  - Never fill the whole screen with a cartoon scene. Full-screen cartoon looks "generic/unprofessional" to this user (rejected twice).
- **Pro map:** a full-frame `mapPro` fly-through with glowing routes and marchers is allowed.
- **Transitions:** circle, zoom, whip, bars, glitch, flash, dissolve. Change something every 1–3 s.
- **The user's character:** ALWAYS the **full-body rig** in `D:\ClaudeVideos\projects\char-rig\kit` (`rig2.js` + `anim2.js`, guide in its `README.md`, example `demo.html`). Never the old half-body bust from short-1899 (user said 2026-11-09: no half body, use full body with hands and legs; use it in every new session's video).
  - Walk, run, sit, eat, drink, gesture with fingers, show faces (angry/sad/happy/surprised/confused), walk away from behind.
  - Place it inside framed windows / scenes of the MG layout.
  - Show it OFTEN: about every 3–5 beats across the whole video (pointing, reacting, explaining), not just in the intro. The user complained it was barely shown.
  - Never use vector characters Claude drew.
- **Science or body topics:** clear diagrams and step-by-step animation, inside the MG layout.
- **Backgrounds:** no flat black, no plain navy studio, no room or house backgrounds.
- **Grade:** bloom, vignette, grain.
- **Element mix:** if the user gives one by percentage, follow it.

**Second approved style (2026-11-09): "2D that looks 3D, one continuous shot".** When the user asks for the fewshot.studio-style look, a full-screen world is allowed: an endless iso circuit/neuron floor, a camera that travels between scenes with no hard cuts, iso boxes with 3–4 tone shading, "একে বলে" term pills, and every named type from the ultra.skills "30 animations" list. Kit: `D:\ClaudeVideos\projects\infant-amnesia\kit` (see `render.ps1`, `align3.js`, `sfx.ps1`, `sfxmix.js`). The user's character still appears every few beats. After v1 feedback: keep the background calm (soft section-coloured sky, plain glossy floor, a few bokeh orbs; never busy circuit boards), and act the story out with cartoon humans from `kit\humans.js` (babies, mothers, scientists, kids), not only icons or neon outlines.

The Zack D Films channel was a reference the user once asked for. Its grammar (hook in the first second, x-ray/heatmap reveals, slow-mo) may only be used as small ideas INSIDE the v2 MG layout, never as full-screen cartoon shots.

## 3. Voiceover workflow
1. Copy the voice into the project. Transcribe with whisper.cpp:
   - Binary: `D:\ClaudeVideos\tools\whisper\bin\Release\whisper-cli.exe`
   - Model: `ggml-large-v3-turbo-q5_0.bin`
   - Flags: `-l bn -mc 0`
   - The Bangla output has spelling errors. Use it for **timestamps**, and the user's script for the text.
   - For files longer than ~3 min, don't use whisper. On this PC it is far too slow: a 19-min file failed after 90 min.
     - Ask for the script, or use the one the user pasted.
     - Run `silencedetect`, then the DP aligner `D:\ClaudeVideos\projects\vo-asif\align.js`.
   - **Long 16:9 videos:** start from the 16:9 template kit `D:\ClaudeVideos\projects\vo-asif\kit` (`hum.html` + `hum.js` + `beats.js`). It has about 20 MG templates, and you write one line per beat. Render with `render.ps1` (3 workers, ~1 h per 19 min) and mix SFX with `mix.js`.
2. Write a beat list: for each line, the shot, background, character action, camera move and FX. Each beat should change something visually.
3. Build, render frames, check contact sheets of **every beat**, fix, then do the final render.
4. Lip-sync the character from the voice RMS envelope.

## 4. Raw-footage workflow (extra rules)
- **Face on screen is only ~10–15% of runtime:** the hook, a few emotional lines, the outro. Everything else is full-screen graphics over their audio, which also hides the jump cuts.
- **STRICT gaze rule: use ONLY shots where they look straight into the camera with a straight neck.**
  - Check at 6 fps close-up contact sheets.
  - If in doubt, drop the shot. Side-looking shots got through twice and annoyed the user.
- **Never drop speech because whisper garbled it.**
  - Check the RMS energy profile (`astats` per 0.1 s) of every gap.
  - Re-transcribe hard chunks with `--prompt`.
  - A 0.8 s line ("যেটা অলরেডি হয়েই গেছে") was once lost this way.
- Face grade: hqdn3d denoise, eq, colorbalance or skin tone, curves, unsharp, vignette, stabilize. It must never look raw.
- Audio: highpass, afftdn, compressor, EQ.
- Use their character **lightly** (full-body rig2: pointing at a map, worried face, on the phone for the CTA).
- Keep the edit list in `edl.json`, and run a build script that writes `cut.mov` and `timeline.json`.

## 5. Audio mix
- **Never process the user's voice.**
  - No highpass, denoise, compressor or loudnorm. Keep it exactly as raw as they sent it.
  - On 2026-11-09 they complained the edited voice sounded different.
  - Balance the mix by setting the SFX and music level under the voice. Keep only a safety limiter on the final mix if peaks clip.
- SFX:
  - whoosh on cuts and transitions
  - pops on UI elements
  - deep boom or thud on impacts
  - a soft tension drone or music bed under the voice
- **SFX must be UNIQUE and NEW for every video.** On 2026-11-08 the user said not to reuse the same sounds, so their videos never sound like anyone else's.
  - Never reuse a previous project's .wav files, the old shared whoosh/pop/boom set, or stock SFX packs.
  - Design a fresh palette per video, synthesized with ffmpeg `aevalsrc`/`anoisesrc` plus filters.
  - Vary noise colour, filter sweeps, pitch, envelopes, layers and stereo pan.
  - Theme it to the topic: icy crackle and wind gusts for winter, sirens and sub-booms for war, organic thumps for the body, and so on.
  - Make 3–4 variants per type and rotate them, so no sound repeats back-to-back.
  - Name files `sfx_<project>_*.wav`.

## 6. Toolchain on this PC
The PC has no admin rights: i3-4160, 8 GB RAM, Radeon HD 5450. Tools:
- FFmpeg: `C:\Users\avroa\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe`
- Render pipeline: canvas/three.js page, then puppeteer-core (from the npm cache `D:\ClaudeVideos\cache\npm\_npx\...`), then frames piped to ffmpeg.
  - WebGL works on the software D3D11 driver.
  - three.js runs at about 0.2 s per frame.
  - 3 parallel render workers are OK.
- Fonts:
  - `@fontsource-variable/anek-bangla` for condensed headlines
  - Hind Siliguri for UI
  - Nirmala UI as the system fallback
- Map: world-atlas `countries-50m.json` plus topojson-client.
- Blender 4.2 portable plus MPFB (realistic humans) at `D:\ClaudeVideos\tools\blender`.
  - About 57 s per frame at 720p, so only for one-off hero shots.
  - Details are in the memory `blender-human-pipeline`.
- Long Windows paths break renders: `subst` a short drive letter, then remove it.

## 7. Gotchas
- **PowerShell 5.1 corrupts Bangla UTF-8** when you use `Get-Content -Raw`/`Set-Content`.
  - Use the Edit tool, or `[IO.File]::ReadAllText/WriteAllText` with UTF8.
  - Recovery: read as UTF-8, `GetEncoding(1252).GetBytes`, then decode as UTF-8.
- `Copy-Item` to D: right after `mkdir` sometimes fails. Use robocopy.
- Remote Control upload limit is 30 MB. Keep phone previews below that.

## 8. Final checklist before delivering
- [ ] Hook in the first second; something changes every 1–2 s
- [ ] v2 MG look: dark ice/ember MG, draw-on icons, glass panels, kinetic keywords; 2D scenes only in small framed windows
- [ ] The user's character acts out lines with expressions (lightly in raw-footage edits)
- [ ] Section colours differ; transitions vary; something changes every 1-3 s
- [ ] No captions; motion graphics fill that space instead
- [ ] Raw footage only: every face shot looks straight at the camera; no speech chunk lost (energy-checked)
- [ ] -14 LUFS, peak below -1 dBFS, SFX on cuts and impacts; SFX palette newly designed for THIS video (no reused sounds)
- [ ] Contact sheet of every beat reviewed
- [ ] Full-res file in `D:\ClaudeVideos\renders\` (or next to their source on D:) plus a phone preview under 30 MB sent
- [ ] Tell the user in Banglish what was made, where it is, and what was only checked by frames (not full playback)
- [ ] Save new feedback as memory, and update this skill if the user teaches a new rule
