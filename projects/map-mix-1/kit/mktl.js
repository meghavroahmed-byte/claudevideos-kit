// merge 9s-chunk transcripts -> ../temp/timeline.json ; words spread over speech islands (fine pauses)
const fs = require('fs'), path = require('path');
const T = path.join(__dirname, '../temp'), dir = path.join(T, 'ch');
const cuts = fs.readFileSync(path.join(dir, 'cuts.txt'), 'utf8').trim().split(',').map(Number);
// fine silences (start,end) from silencedetect stored as mids only -> recompute islands from env.js RMS
const env = fs.readFileSync(path.join(__dirname, 'env.js'), 'utf8').match(/\[(.*)\]/)[1].split(',').map(Number);
const FPS = 30; const voiced = env.map(v => v > -42);
const segs = [];
for (let i = 0; i < cuts.length - 1; i++) {
  const f = path.join(dir, `c${String(i).padStart(2, '0')}.wav.json`); if (!fs.existsSync(f)) continue;
  const j = JSON.parse(fs.readFileSync(f, 'utf8')); const text = j.transcription.map(s => s.text.trim()).join(' ').replace(/\s+/g, ' ').trim(); if (!text) continue;
  const a = cuts[i], b = cuts[i + 1];
  // speech islands inside [a,b): merge gaps < 0.12s, drop islands < 0.1s
  let isl = [], cur = null; for (let fr = Math.floor(a * FPS); fr < Math.floor(b * FPS); fr++) { if (voiced[fr]) { if (!cur) cur = [fr / FPS, fr / FPS]; cur[1] = (fr + 1) / FPS; } else if (cur && fr / FPS - cur[1] > 0.12) { isl.push(cur); cur = null; } }
  if (cur) isl.push(cur); isl = isl.filter(x => x[1] - x[0] > 0.1); if (!isl.length) isl = [[a, b]];
  const tot = isl.reduce((s, x) => s + x[1] - x[0], 0); const words = text.split(' '); const wl = words.map(w => w.length + 1); const wt = wl.reduce((s, x) => s + x, 0);
  // map each word to time by cumulative speech duration
  const at = frac => { let r = frac * tot; for (const x of isl) { const d = x[1] - x[0]; if (r <= d) return x[0] + r; r -= d; } return isl[isl.length - 1][1]; };
  let acc = 0; const wtimes = words.map((w, k) => { const s = at(acc / wt); acc += wl[k]; return [w, s, at(acc / wt)]; });
  // group words per island
  for (const x of isl) { const ws = wtimes.filter(w => w[1] >= x[0] - 0.01 && w[1] < x[1]); if (!ws.length) continue; segs.push({ s: +ws[0][1].toFixed(2), e: +ws[ws.length - 1][2].toFixed(2), text: ws.map(w => w[0]).join(' '), c: i }); }
}
fs.writeFileSync(path.join(T, 'timeline.json'), JSON.stringify({ dur: 508.56, segs }));
fs.writeFileSync(path.join(T, 'transcript.txt'), segs.map(s => `${s.s.toFixed(1)}-${s.e.toFixed(1)} | ${s.text}`).join('\n'));
console.log(segs.length, 'segments, chunks done:', new Set(segs.map(s => s.c)).size, 'of', cuts.length - 1);
