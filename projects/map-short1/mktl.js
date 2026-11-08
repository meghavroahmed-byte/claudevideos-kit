// Timeline from hand-checked sentence bounds (silence + whisper anchors) with per-char times that skip internal pauses.
const fs = require('fs'), { execSync } = require('child_process'); const P = 'D:/ClaudeVideos/projects/map-short1/';
const txt = fs.readFileSync(P + 'script.txt', 'utf8').replace(/\r/g, '');
const sents = []; txt.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean).forEach(p => (p.match(/[^।?!]+[।?!]+[’'"]?|[^।?!]+$/g) || [p]).map(s => s.trim()).filter(Boolean).forEach(s => sents.push(s)));
const BOUNDS = [[0.18, 7.41], [8.07, 15.54], [16.0, 18.61], [19.15, 22.06], [22.55, 27.82], [28.39, 32.14], [32.55, 35.15], [35.55, 42.07], [42.4, 50.68], [51.23, 56.66], [57.11, 62.16], [62.57, 64.64], [64.83, 66.57], [67.11, 69.71]];
if (sents.length !== BOUNDS.length) throw new Error('sentences ' + sents.length);
const log = execSync(`ffmpeg -hide_banner -i "${P}temp/vo_orig.wav" -af silencedetect=n=-32dB:d=0.12 -f null - 2>&1`).toString();
const pz = []; let st = null; for (const l of log.split(/\n/)) { let m = l.match(/silence_start: ([\d.]+)/); if (m) st = +m[1]; m = l.match(/silence_end: ([\d.]+)/); if (m && st != null) { pz.push([st, +m[1]]); st = null; } }
const keep = ch => /[\u0980-\u09FFA-Za-z0-9]/.test(ch);
const segs = sents.map((text, i) => {
  const [s, e] = BOUNDS[i]; const inner = pz.filter(([a, b]) => a > s + 0.05 && b < e - 0.05);
  // speech intervals
  const iv = []; let c = s; for (const [a, b] of inner) { iv.push([c, a]); c = b; } iv.push([c, e]); const tot = iv.reduce((q, [a, b]) => q + b - a, 0);
  const at = f => { let r = f * tot; for (const [a, b] of iv) { if (r <= b - a) return a + r; r -= b - a; } return e; };
  const W = [...text].map(ch => keep(ch) ? 1 : 0), n = W.reduce((a, b) => a + b, 0); let k = 0;
  const ct = [...text].map((ch, j) => { const v = +at(k / n).toFixed(2); k += W[j]; return v; });
  return { s, e, text, ct };
});
fs.writeFileSync(P + 'temp/timeline.json', JSON.stringify({ dur: 69.97, segs }));
segs.forEach((g, i) => console.log(i, g.s, g.e, g.text.slice(0, 26)));
