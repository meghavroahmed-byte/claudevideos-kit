// Read whisper -ojf -ml 1 output, print phrases split at gaps, with times.
const fs = require('fs');
const j = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const W = j.transcription.map(s => ({ t0: s.offsets.from / 1000, t1: s.offsets.to / 1000, w: s.text.trim() })).filter(x => x.w);
fs.writeFileSync(process.argv[3], JSON.stringify(W));
let cur = null; const out = [];
for (const x of W) {
  if (!cur || x.t0 - cur.t1 > 0.35) { if (cur) out.push(cur); cur = { t0: x.t0, t1: x.t1, s: x.w }; }
  else { cur.t1 = x.t1; cur.s += ' ' + x.w; }
}
if (cur) out.push(cur);
out.forEach(p => console.log(p.t0.toFixed(2).padStart(7), p.t1.toFixed(2).padStart(7), p.s));
