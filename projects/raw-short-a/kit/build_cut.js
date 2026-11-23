// node build_cut.js <edl.json> <outdir>
// Cuts the raw footage by the EDL one segment at a time (low memory), then joins.
// The VOICE is NOT filtered (user rule): only trim + 12 ms de-click fades (+ atempo if speed != 1).
// Writes <outdir>/cut.mov (1080x1920 30fps, lightly graded face-cam), <outdir>/voice.wav, <outdir>/timeline.json
const fs = require('fs');
const { spawnSync } = require('child_process');
const [edlF, outDir] = process.argv.slice(2);
const E = JSON.parse(fs.readFileSync(edlF, 'utf8'));
const sp = E.speed || 1, F = 0.012;
const grade = "hqdn3d=2.5:2:4:3,eq=contrast=1.06:saturation=1.08:brightness=0.005,unsharp=5:5:0.6:5:5:0";
const tl = []; let t = 0; const list = [];
E.segs.forEach(([a, b, txt], i) => {
  const d = b - a, f = `${outDir}/seg_${String(i).padStart(2, '0')}.mov`;
  const af = `afade=t=in:d=${F},afade=t=out:st=${(d - F).toFixed(3)}:d=${F}` + (sp !== 1 ? `,atempo=${sp}` : '') + ',aresample=48000';
  const vf = (sp !== 1 ? `setpts=PTS/${sp},` : '') + `fps=30,${grade},format=yuv420p`;
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(a), '-i', E.src, '-t', d.toFixed(3), '-vf', vf, '-af', af, '-c:v', 'libx264', '-preset', 'fast', '-crf', '14', '-c:a', 'pcm_s16le', '-ac', '2', f], { stdio: 'inherit' });
  if (r.status) throw new Error('seg ' + i);
  list.push(`file '${f.split('/').pop()}'`);
  const nd = d / sp; tl.push({ i, s: +t.toFixed(3), e: +(t + nd).toFixed(3), src: [a, b], text: txt || '' }); t += nd;
});
fs.writeFileSync(outDir + '/segs.txt', list.join('\n') + '\n');
spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', outDir + '/segs.txt', '-c', 'copy', outDir + '/cut.mov'], { stdio: 'inherit' });
spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', outDir + '/cut.mov', '-vn', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', outDir + '/voice.wav'], { stdio: 'inherit' });
fs.writeFileSync(outDir + '/timeline.json', JSON.stringify({ dur: +t.toFixed(3), segs: tl }, null, 1));
console.log('dur', t.toFixed(2));
