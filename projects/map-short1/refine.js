// Char-level timing: align script chars to whisper token chars (from -ojf JSON), write temp/timeline.json with ct.
const fs = require('fs'); const P = 'D:/ClaudeVideos/projects/map-short1/';
const sents = require(P + 'sents.json'); const DUR = 69.97;
const J = JSON.parse(fs.readFileSync(P + 'temp/wh.json', 'utf8')).transcription;
const keep = ch => /[\u0980-\u09FFA-Za-z0-9]/.test(ch);
const wc = [], wt = [];
J.forEach(s => {
  const toks = (s.tokens || []).filter(k => !/^\[_/.test(k.text));
  if (!toks.length) { const a = s.offsets.from / 1000, b = s.offsets.to / 1000, cs = [...s.text].filter(keep); cs.forEach((c, i) => { wc.push(c); wt.push(a + (b - a) * (i + 0.5) / cs.length); }); return; }
  toks.forEach(k => { const a = k.offsets.from / 1000, b = k.offsets.to / 1000; const cs = [...k.text].filter(keep); cs.forEach((c, i) => { wc.push(c); wt.push(a + (b - a) * (i + 0.5) / cs.length); }); });
});
const sc = [], sref = [];
sents.forEach((s, si) => { [...s.text].forEach((c, k) => { if (keep(c)) { sc.push(c); sref.push([si, k]); } }); });
const n = sc.length, m = wc.length; console.log('script chars', n, 'whisper chars', m);
// full NW (small)
const S = Array.from({ length: n + 1 }, () => new Float64Array(m + 1)), TB = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1));
for (let i = 1; i <= n; i++) { S[i][0] = -i; TB[i][0] = 1; } for (let j = 1; j <= m; j++) { S[0][j] = -j; TB[0][j] = 2; }
for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) { let b = S[i - 1][j - 1] + (sc[i - 1] === wc[j - 1] ? 2 : -1), k = 0; if (S[i - 1][j] - 1 > b) { b = S[i - 1][j] - 1; k = 1; } if (S[i][j - 1] - 1 > b) { b = S[i][j - 1] - 1; k = 2; } S[i][j] = b; TB[i][j] = k; }
let i = n, j = m; const map = new Int32Array(n).fill(-1);
while (i > 0 && j > 0) { const k = TB[i][j]; if (k === 0) { map[i - 1] = j - 1; i--; j--; } else if (k === 1) i--; else j--; }
const t = new Float64Array(n).fill(NaN); let matched = 0;
for (let k = 0; k < n; k++) if (map[k] >= 0 && sc[k] === wc[map[k]]) { t[k] = wt[map[k]]; matched++; }
console.log('matched', matched, (100 * matched / n).toFixed(1) + '%');
let last = -1; for (let k = 0; k < n; k++) if (!isNaN(t[k])) { if (last >= 0 && t[k] < t[last]) t[k] = NaN; else last = k; }
let a = -1; for (let k = 0; k <= n; k++) { if (k === n || !isNaN(t[k])) { const ta = a >= 0 ? t[a] : 0.2, tb = k < n ? t[k] : DUR - 0.3; for (let q = a + 1; q < k; q++) t[q] = ta + (tb - ta) * (q - a) / (k - a); a = k; } }
const out = sents.map(s => ({ s: s.t0, e: s.t1, text: s.text, ct: new Array(s.text.length).fill(null) }));
sc.forEach((c, k) => { const [si, ki] = sref[k]; out[si].ct[ki] = +t[k].toFixed(2); });
out.forEach(o => { const v = o.ct.filter(x => x != null); if (v.length) { o.s = +(v[0] - 0.08).toFixed(2); o.e = +(v[v.length - 1] + 0.15).toFixed(2); } let lv = o.s; for (let k = 0; k < o.ct.length; k++) { if (o.ct[k] == null) o.ct[k] = lv; else lv = o.ct[k]; } });
fs.writeFileSync(P + 'temp/timeline.json', JSON.stringify({ dur: DUR, segs: out }));
out.forEach((o, k) => console.log(k, o.s, o.e, o.text.slice(0, 30)));
