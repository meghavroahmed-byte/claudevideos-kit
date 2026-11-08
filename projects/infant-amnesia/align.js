// Align script sentences to the voiceover using silencedetect pauses (DP, monotonic) -> temp/timeline.json
const fs = require('fs');
const P = 'D:/ClaudeVideos/projects/infant-amnesia/';
const END = 1462.26;
const txt = fs.readFileSync(P + 'script.txt', 'utf8').replace(/\r/g, '');
const paras = txt.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
const sents = [];
paras.forEach((p, pi) => {
  const parts = p.match(/[^।?!]+[।?!]+[’'"”]?|[^।?!]+$/g) || [p];
  parts.map(s => s.trim()).filter(Boolean).forEach((s, si) => {
    // glue tiny fragments (e.g. a closing quote) to the previous sentence
    if (s.replace(/[^\u0980-\u09FF]/g, '').length < 3 && sents.length) { sents[sents.length - 1].t += ' ' + s; return; }
    sents.push({ t: s, para: pi, first: si === 0 });
  });
});
const sil = fs.readFileSync(P + 'temp/sil.txt', 'utf8').split(/\n/);
const pauses = []; let st = null;
for (const l of sil) { let m = l.match(/silence_start: ([\d.]+)/); if (m) st = +m[1]; m = l.match(/silence_end: ([\d.]+)/); if (m && st != null) { pauses.push({ s: st, e: +m[1] }); st = null; } }
const firstSpeech = pauses.length && pauses[0].s < 0.05 ? pauses[0].e : 0;
const B = [{ s: firstSpeech, e: firstSpeech, d: 9 }].concat(pauses.filter(p => p.s > 0.05 && p.e < END - 0.05).map(p => ({ s: p.s, e: p.e, d: p.e - p.s }))).concat([{ s: END, e: END, d: 9 }]);
const spd = (a, b) => { let t = B[b].s - B[a].e; for (let k = a + 1; k < b; k++) t -= B[k].d; return t; };
const len = s => s.t.replace(/[\s,—;:‘’'"“”()\-]/g, '').replace(/[০-৯0-9]+/g, m => 'x'.repeat(m.length * 3)).length;
const C = sents.map(len), totC = C.reduce((a, b) => a + b, 0);
const r = spd(0, B.length - 1) / totC, S = sents.length, N = B.length, INF = 1e18;
const dp = Array.from({ length: S + 1 }, () => new Float64Array(N).fill(INF));
const bk = Array.from({ length: S + 1 }, () => new Int32Array(N).fill(-1));
dp[0][0] = 0;
for (let i = 1; i <= S; i++) {
  const exp = C[i - 1] * r;
  for (let b = 1; b < N; b++) {
    if (i === S && b !== N - 1) continue; let best = INF, arg = -1;
    for (let a = Math.max(0, b - 45); a < b; a++) {
      if (dp[i - 1][a] >= INF) continue; const d = spd(a, b); if (d <= 0.2) continue;
      let c = Math.log(d / exp) ** 2 * 10; c += 0.6 / (B[b].d + 0.15); if (i < S && sents[i].first) c += 1.2 / (B[b].d + 0.1);
      const v = dp[i - 1][a] + c; if (v < best) { best = v; arg = a; }
    }
    dp[i][b] = best; bk[i][b] = arg;
  }
}
let b = N - 1; const ends = [];
for (let i = S; i > 0; i--) { ends[i - 1] = b; b = bk[i][b]; }
const out = sents.map((s, i) => { const a = i === 0 ? 0 : ends[i - 1]; return { i, para: s.para, s: +B[a].e.toFixed(2), e: +B[ends[i]].s.toFixed(2), text: s.t }; });
fs.writeFileSync(P + 'temp/timeline.json', JSON.stringify({ dur: END, segs: out }), 'utf8');
fs.writeFileSync(P + 'temp/sents.txt', out.map(o => `${o.i}\t${o.s}\t${o.e}\t${o.text}`).join('\n'), 'utf8');
console.log('sents', S, 'pauses', N, 'rate', r.toFixed(4));
out.forEach(o => { const ratio = (o.e - o.s) / (C[o.i] * r); if (ratio < 0.6 || ratio > 1.6) console.log('odd', o.i, o.s, o.e, ratio.toFixed(2)); });
