// Build the SFX track (48k stereo) from render metadata: node mix.js part1.json part2.json ...
const fs = require('fs'); const P = 'D:/ClaudeVideos/projects/vo-asif/'; const SR = 48000, DUR = 1142;
function readWav(f) { const b = fs.readFileSync(f); let p = 12, fmt, data; while (p < b.length - 8) { const id = b.toString('ascii', p, p + 4), sz = b.readUInt32LE(p + 4); if (id === 'fmt ') fmt = { ch: b.readUInt16LE(p + 10), bits: b.readUInt16LE(p + 22), af: b.readUInt16LE(p + 8) }; if (id === 'data') { data = b.subarray(p + 8, p + 8 + sz); break; } p += 8 + sz + (sz & 1); }
  const bps = fmt.bits / 8, n = data.length / bps / fmt.ch, L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { const rd = o => fmt.bits === 16 ? data.readInt16LE(o) / 32768 : fmt.af === 3 ? data.readFloatLE(o) : data.readInt32LE(o) / 2147483648; L[i] = rd(i * bps * fmt.ch); R[i] = fmt.ch > 1 ? rd(i * bps * fmt.ch + bps) : L[i]; } return [L, R]; }
const S = n => readWav(P + 'sfx/sfx_vo-asif_' + n + '.wav');
const WH = [1, 2, 3, 4].map(i => S('whoosh' + i)), CL = [1, 2, 3, 4].map(i => S('click' + i)), DR = [1, 2, 3].map(i => S('drum' + i)), RIS = S('riser'), SHIM = S('shimmer');
const N = SR * DUR, L = new Float32Array(N), R = new Float32Array(N);
const add = ([a, b], t, g) => { const o = Math.round(t * SR); for (let i = 0; i < a.length; i++) { const k = o + i; if (k < 0 || k >= N) continue; L[k] += a[i] * g; R[k] += b[i] * g; } };
let cuts = [], pops = [], beats = [];
for (const f of process.argv.slice(2)) { const j = JSON.parse(fs.readFileSync(f, 'utf8')); cuts.push(...j.cuts); pops.push(...j.pops); if (j.beats && j.beats.length) beats = j.beats; }
cuts = [...new Set(cuts)].sort((a, b) => a - b); pops = [...new Set(pops)].sort((a, b) => a - b);
const btype = {}; beats.forEach(([t0, tpl, tr]) => btype[t0.toFixed(2)] = [tpl, tr]);
let nw = 0, nd = 0, nc = 0;
cuts.forEach((t, i) => { const [tpl, tr] = btype[t.toFixed(2)] || []; if (tpl === 'chapter') { add(RIS, t - 1.55, 0.55); add(DR[nd++ % 3], t, 0.8); return; } if (tpl === 'big' || tr === 'flash') add(DR[nd++ % 3], t + 0.02, 0.45); add(WH[nw++ % 4], t - 0.22, tr === 'whip' || tr === 'glitch' ? 0.55 : 0.4); if (tpl === 'dna') add(SHIM, t + 0.7, 0.35); });
let lastp = -9; pops.forEach(t => { if (t - lastp < 0.3) return; if (cuts.some(c => Math.abs(c - t) < 0.15)) return; lastp = t; add(CL[nc++ % 4], t, 0.3); });
// write 16-bit stereo wav
const out = Buffer.alloc(44 + N * 4); out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVEfmt ', 8); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { out.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(L[i] * 32767))), 44 + i * 4); out.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(R[i] * 32767))), 46 + i * 4); }
fs.writeFileSync(P + 'temp/sfx_track.wav', out);
console.log('cuts', cuts.length, 'pops used', nc, 'drums', nd, 'whooshes', nw);
