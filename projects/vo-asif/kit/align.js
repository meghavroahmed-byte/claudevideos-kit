// Align script sentences to voiceover pauses with DP. node align.js script.txt pauses.csv duration out.json
const fs = require('fs');
const [sf, pf, durS, out] = process.argv.slice(2);
const DUR = +durS;
const text = fs.readFileSync(sf, 'utf8');
const sents = text.split(/(?<=[।?!])["”]?\s+/).map(s => s.trim()).filter(Boolean);
const clen = s => s.replace(/[\s,—\-"“”'।?!;:]/g, '').length;
const L = sents.map(clen);
let P = fs.readFileSync(pf, 'utf8').trim().split(/\r?\n/).map(l => l.split(',').map(Number));
// speech start/end
let s0 = 0, s1 = DUR;
if (P.length && P[0][0] < 0.05) { s0 = P[0][1]; P = P.slice(1); }
if (P.length && P[P.length - 1][1] > DUR - 0.05) { s1 = P[P.length - 1][0]; P = P.slice(0, -1); }
const ends = [...P.map(p => p[0]), s1];            // candidate end times
const starts = [s0, ...P.map(p => p[1])];           // start time after each pause index-1
const pdur = P.map(p => p[1] - p[0]);
const totalChars = L.reduce((a, b) => a + b, 0);
const speech = (s1 - s0) - pdur.reduce((a, b) => a + b, 0) * 0.5;
const rate = speech / totalChars;
const N = L.length, M = ends.length;
const cum = [0]; L.forEach(l => cum.push(cum[cum.length - 1] + l));
const INF = 1e18;
// dp[i][j] = min cost having consumed i sentences, last group ending at candidate j (j = -1 => start)
const dp = Array.from({ length: N + 1 }, () => new Float64Array(M + 1).fill(INF));
const bk = Array.from({ length: N + 1 }, () => new Int32Array((M + 1) * 2).fill(-1));
dp[0][0] = 0; // index 0 = "before first", candidate j stored as j+1
for (let i = 0; i < N; i++) for (let jj = 0; jj <= M; jj++) {
  const c0 = dp[i][jj]; if (c0 >= INF) continue;
  const st = jj === 0 ? s0 : starts[jj];
  for (let k = 1; k <= 3 && i + k <= N; k++) {
    const ch = cum[i + k] - cum[i], e = ch * rate;
    let skip = 0;
    for (let j = jj; j < M; j++) {
      const en = ends[j];
      const d = en - st; if (d <= 0) continue;
      if (d > e * 2.2 + 3) break;
      const isLast = i + k === N;
      if (isLast && j !== M - 1) { if (j < M - 1) skip += Math.max(0, pdur[j] - 0.3) * 6; continue; }
      if (!isLast && j === M - 1) break;
      const c = c0 + ((d - e) / Math.max(e, 0.8)) ** 2 * 12 + skip + (k - 1) * 1.2 - (j < M - 1 ? Math.min(pdur[j], 0.8) * 1.5 : 0);
      if (c < dp[i + k][j + 1]) { dp[i + k][j + 1] = c; bk[i + k][(j + 1) * 2] = jj; bk[i + k][(j + 1) * 2 + 1] = k; }
      if (j < M - 1) skip += Math.max(0, pdur[j] - 0.3) * 6;
    }
  }
}
// backtrack
let i = N, jj = M, groups = [];
if (dp[N][M] >= INF) throw new Error('no alignment');
while (i > 0) { const pj = bk[i][jj * 2], k = bk[i][jj * 2 + 1]; groups.unshift({ i0: i - k, i1: i, st: pj === 0 ? s0 : starts[pj], en: ends[jj - 1] }); i -= k; jj = pj; }
const res = [];
for (const g of groups) {
  const tot = cum[g.i1] - cum[g.i0]; let acc = 0;
  for (let s = g.i0; s < g.i1; s++) { const a = g.st + (g.en - g.st) * acc / tot; acc += L[s]; const b = g.st + (g.en - g.st) * acc / tot; res.push({ i: s, s: +a.toFixed(2), e: +b.toFixed(2), text: sents[s] }); }
}
fs.writeFileSync(out, JSON.stringify(res, null, 0));
console.log('sentences', N, 'pauses', P.length, 'rate', rate.toFixed(4), 'cost', dp[N][M].toFixed(1));
const show = [0, 5, 10, 30, 60, 90, 120, 150, 176]; for (const k of show) if (res[k]) console.log(res[k].s, res[k].e, res[k].text.slice(0, 40));
