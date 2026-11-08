// Refine sentence timings using whisper output: banded char-level alignment script <-> whisper text.
// Writes temp/timeline.json with per-sentence s,e and per-char times (ct).
const fs = require('fs'); const P = 'D:/ClaudeVideos/projects/vo-asif/';
const sents = require(P + 'sents.json');
const tr = JSON.parse(fs.readFileSync(P + 'temp/tr.json', 'utf8')).transcription;
const keep = ch => /[\u0980-\u09FFA-Za-z0-9]/.test(ch);
// whisper chars with times
const wc = [], wt = [];
tr.forEach(s => { const a = s.offsets.from / 1000, b = s.offsets.to / 1000; const cs = [...s.text].filter(keep); cs.forEach((c, i) => { wc.push(c); wt.push(a + (b - a) * (i + 0.5) / cs.length); }); });
// script chars with back-reference to (sentence, index in text)
const sc = [], sref = [];
sents.forEach((s, si) => { [...s.text].forEach((c, k) => { if (keep(c)) { sc.push(c); sref.push([si, k]); } }); });
const n = sc.length, m = wc.length, BAND = 900, W = 2 * BAND + 1, ratio = m / n;
console.log('script chars', n, 'whisper chars', m);
const tb = new Uint8Array((n + 1) * W); let prev = new Float64Array(W).fill(-1e9), cur = new Float64Array(W);
const jc = i => Math.round(i * ratio);
// row 0
for (let d = 0; d < W; d++) { const j = jc(0) + d - BAND; if (j >= 0 && j <= m) { prev[d] = -j; tb[d] = 2; } }
for (let i = 1; i <= n; i++) {
  cur.fill(-1e9); const c0 = jc(i), p0 = jc(i - 1);
  for (let d = 0; d < W; d++) {
    const j = c0 + d - BAND; if (j < 0 || j > m) continue; let best = -1e9, bk = 0;
    // diag from (i-1, j-1)
    const dd = (j - 1) - p0 + BAND; if (j >= 1 && dd >= 0 && dd < W && prev[dd] > -1e8) { const v = prev[dd] + (sc[i - 1] === wc[j - 1] ? 2 : -1); if (v > best) { best = v; bk = 0; } }
    // up from (i-1, j): gap in whisper
    const du = j - p0 + BAND; if (du >= 0 && du < W && prev[du] > -1e8) { const v = prev[du] - 1; if (v > best) { best = v; bk = 1; } }
    // left from (i, j-1)
    if (d >= 1 && cur[d - 1] > -1e8) { const v = cur[d - 1] - 1; if (v > best) { best = v; bk = 2; } }
    cur[d] = best; tb[i * W + d] = bk;
  }
  [prev, cur] = [cur, prev];
}
// traceback from (n, m)
let i = n, j = m; const map = new Int32Array(n).fill(-1);
while (i > 0 && j >= 0) { const d = j - jc(i) + BAND; if (d < 0 || d >= W) { console.log('fell off band at', i, j); break; } const bk = tb[i * W + d]; if (bk === 0) { map[i - 1] = j - 1; i--; j--; } else if (bk === 1) { i--; } else { j--; } }
// times for matched chars, interpolate unmatched
const t = new Float64Array(n).fill(NaN); let matched = 0;
for (let k = 0; k < n; k++) if (map[k] >= 0 && sc[k] === wc[map[k]]) { t[k] = wt[map[k]]; matched++; }
console.log('matched', matched, (100 * matched / n).toFixed(1) + '%');
// enforce monotonic + interpolate
let last = -1; for (let k = 0; k < n; k++) { if (!isNaN(t[k])) { if (last >= 0 && t[k] < t[last]) t[k] = NaN; else last = k; } }
let a = -1; for (let k = 0; k <= n; k++) { if (k === n || !isNaN(t[k])) { const ta = a >= 0 ? t[a] : sents[0].t0, tb2 = k < n ? t[k] : sents[sents.length - 1].t1; for (let q = a + 1; q < k; q++) t[q] = ta + (tb2 - ta) * (q - a) / (k - a); a = k; } }
// per sentence
const out = sents.map(s => ({ s: s.t0, e: s.t1, text: s.text, ct: new Array([...s.text].length).fill(null) }));
sc.forEach((c, k) => { const [si, ki] = sref[k]; out[si].ct[ki] = +t[k].toFixed(2); });
out.forEach((o, si) => { const v = o.ct.filter(x => x != null); if (v.length) { const ns = v[0] - 0.08, ne = v[v.length - 1] + 0.15; if (Math.abs(ns - o.s) > 0.8) console.log('shift', si, o.s.toFixed(2), '->', ns.toFixed(2)); o.s = +ns.toFixed(2); o.e = +ne.toFixed(2); }
  let lastv = o.s; for (let k = 0; k < o.ct.length; k++) { if (o.ct[k] == null) o.ct[k] = lastv; else lastv = o.ct[k]; } });
fs.writeFileSync(P + 'temp/timeline.json', JSON.stringify({ dur: 1140.96, segs: out }));
console.log('written');
