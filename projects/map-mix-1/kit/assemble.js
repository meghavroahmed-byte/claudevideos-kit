// Build frame-accurate video from base renders + patches -> ../temp/video_only.mp4
const { execFileSync } = require('child_process'); const path = require('path'); const fs = require('fs');
const FF = 'C:/Users/avroa/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe';
const OUT = path.join(__dirname, '../out'), NF = 15257;
// [tag, firstGlobalFrame, endGlobalFrame(exclusive)] — later entries override earlier ones
const SRC = [['R1', 0, 3734], ['R2a', 3734, 5600], ['R2b', 5600, 7467], ['R4', 7672, 11465], ['R5', 11465, 15257],
  ['R3', 7467, 7686], ['P1', 1188, 1383], ['P2', 2541, 2700], ['P3', 4059, 4232], ['P4', 9600, 9876], ['P5', 12765, 13113], ['P6', 13491, 13869], ['P7', 14814, 15024]];
const owner = new Array(NF).fill(-1); SRC.forEach(([tag, a, b], i) => { if (!fs.existsSync(path.join(OUT, tag + '.mp4'))) { console.log('missing', tag); return; } for (let f = a; f < b && f < NF; f++) owner[f] = i; });
const missing = owner.filter(o => o < 0).length; if (missing) { console.log('frames without source:', missing); process.exit(1); }
const segs = []; for (let f = 0; f < NF; f++) { const o = owner[f]; if (segs.length && segs[segs.length - 1].o === o && segs[segs.length - 1].b === f) segs[segs.length - 1].b = f + 1; else segs.push({ o, a: f, b: f + 1 }); }
const args = ['-y', '-v', 'error']; segs.forEach(s => args.push('-i', path.join(OUT, SRC[s.o][0] + '.mp4')));
const fc = segs.map((s, k) => `[${k}:v]trim=start_frame=${s.a - SRC[s.o][1]}:end_frame=${s.b - SRC[s.o][1]},setpts=PTS-STARTPTS[v${k}]`).join(';') + ';' + segs.map((s, k) => `[v${k}]`).join('') + `concat=n=${segs.length}:v=1:a=0[v]`;
args.push('-filter_complex', fc, '-map', '[v]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', path.join(__dirname, '../temp/video_only.mp4'));
console.log(segs.length, 'segments:', segs.map(s => `${SRC[s.o][0]}[${s.a}-${s.b})`).join(' '));
execFileSync(FF, args, { stdio: 'inherit' }); console.log('ok');
