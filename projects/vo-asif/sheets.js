// node sheets.js -> temp/cs/sheetN.jpg (5x4 grid of beat stills, numbered by beat index)
const fs = require('fs'), { execFileSync } = require('child_process');
const P = 'D:/ClaudeVideos/projects/vo-asif/';
const b = require(P + 'stills/beats.json');
const ts = b.map(x => +Math.max(x[1] + 0.3, x[2] - 0.5).toFixed(2));
const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
fs.mkdirSync(P + 'temp/cs', { recursive: true });
for (let s = 0; s < Math.ceil(ts.length / 20); s++) {
  if (only && !only.includes(s)) continue;
  const list = ts.slice(s * 20, s * 20 + 20).map(t => `file '${P}${process.env.STILLS || 'stills'}/s_${t}.jpg'`).join('\n');
  fs.writeFileSync(P + `temp/cs/l${s}.txt`, list);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', P + `temp/cs/l${s}.txt`, '-vf', `scale=480:270,drawtext=text='%{eif\\:n+${s * 20}\\:d}':x=8:y=8:fontsize=30:fontcolor=yellow:box=1:boxcolor=black@0.7,tile=5x4`, '-frames:v', '1', P + `temp/cs/sheet${s}.jpg`]);
}
console.log('ok');
