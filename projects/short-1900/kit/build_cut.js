// Build the cut, graded, cleaned, sped-up face-cam master from edl.json.
// Writes ../temp/cut.mp4 (1080x1920 30fps) and ../temp/timeline.json (segment times in the edited timeline).
const fs = require('fs');
const { spawnSync } = require('child_process');
const E = JSON.parse(fs.readFileSync('edl.json', 'utf8'));
const sp = E.speed, F = 0.012;
const grade = "hqdn3d=3:2.5:5:4,eq=contrast=1.05:saturation=1.04:brightness=0.01,colorbalance=rs=-0.01:bs=0.02:rm=0.01:bm=-0.01,curves=all='0/0.015 0.3/0.285 0.7/0.72 1/0.99',unsharp=5:5:0.5:5:5:0,vignette=PI/6";
let fc = '', cat = '', tl = [], t = 0;
E.segs.forEach(([a, b, txt], i) => {
  const d = b - a;
  fc += `[0:v]trim=${a}:${b},setpts=PTS-STARTPTS[v${i}];`;
  fc += `[0:a]atrim=${a}:${b},asetpts=PTS-STARTPTS,afade=t=in:d=${F},afade=t=out:st=${(d - F).toFixed(3)}:d=${F}[a${i}];`;
  cat += `[v${i}][a${i}]`;
  const nd = d / sp; tl.push({ i, s: +t.toFixed(3), e: +(t + nd).toFixed(3), src: [a, b], text: txt }); t += nd;
});
fc += `${cat}concat=n=${E.segs.length}:v=1:a=1[cv][ca];`;
fc += `[cv]setpts=PTS/${sp},fps=30,${grade},format=yuv420p[vo];`;
fc += `[ca]atempo=${sp},highpass=f=80,afftdn=nr=12:nf=-40,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=3dB,equalizer=f=3200:t=q:w=1.2:g=2.5,equalizer=f=250:t=q:w=1:g=-2[ao]`;
fs.writeFileSync('../temp/timeline.json', JSON.stringify({ dur: +t.toFixed(3), segs: tl }, null, 1));
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', E.src, '-filter_complex', fc, '-map', '[vo]', '-map', '[ao]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-c:a', 'pcm_s16le', '-ar', '48000', '../temp/cut.mov'], { stdio: 'inherit' });
console.log('exit', r.status, 'dur', t.toFixed(2));
