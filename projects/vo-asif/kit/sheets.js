// node sheets.js minT prefix -> renders mid-frames of beats with t0>=minT and builds 4x3 sheets
const { execFileSync } = require('child_process');
const fs = require('fs');
const [minT, prefix, page, bfile, fp] = [+process.argv[2], process.argv[3], process.argv[4] || 'story16.html', process.argv[5] || 'out/beats.json', process.argv[6] || 'v'];
const beats = JSON.parse(fs.readFileSync(bfile, 'utf8')).filter(b => b[1] >= minT);
const times = beats.map(b => Math.round(((b[1] + Math.min(b[2], b[1] + 8)) / 2 + 0.6) * 10) / 10);
execFileSync('node', ['run.js', 'still', page, 'out/x.jpg', times.join(',')], { stdio: 'ignore' });
for (let s = 0; s < times.length; s += 12) {
  const chunk = times.slice(s, s + 12), args = ['-loglevel', 'error', '-y'];
  chunk.forEach(t => args.push('-i', `out/${fp}_${t}.jpg`));
  const n = chunk.length;
  let fc = chunk.map((_, i) => `[${i}]scale=480:270[s${i}]`).join(';') + ';' + chunk.map((_, i) => `[s${i}]`).join('') + `xstack=inputs=${n}:layout=` + chunk.map((_, i) => `${(i % 4) * 480}_${Math.floor(i / 4) * 270}`).join('|') + ':fill=black';
  args.push('-filter_complex', fc, '-frames:v', '1', `out/${prefix}_${s}.jpg`);
  execFileSync('ffmpeg', args);
  console.log(`out/${prefix}_${s}.jpg`, chunk[0], '-', chunk[chunk.length - 1]);
}
