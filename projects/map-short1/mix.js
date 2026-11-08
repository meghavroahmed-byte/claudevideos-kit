// Build SFX track for map-short1 from render metadata: node mix.js p0.json p1.json ...
const fs = require('fs'); const P = 'D:/ClaudeVideos/projects/map-short1/'; const SR = 48000, DUR = 71;
function readWav(f) { const b = fs.readFileSync(f); let p = 12, fmt, data; while (p < b.length - 8) { const id = b.toString('ascii', p, p + 4), sz = b.readUInt32LE(p + 4); if (id === 'fmt ') fmt = { ch: b.readUInt16LE(p + 10), bits: b.readUInt16LE(p + 22), af: b.readUInt16LE(p + 8) }; if (id === 'data') { data = b.subarray(p + 8, p + 8 + sz); break; } p += 8 + sz + (sz & 1); }
  const bps = fmt.bits / 8, n = data.length / bps / fmt.ch, L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { const rd = o => fmt.bits === 16 ? data.readInt16LE(o) / 32768 : fmt.af === 3 ? data.readFloatLE(o) : data.readInt32LE(o) / 2147483648; L[i] = rd(i * bps * fmt.ch); R[i] = fmt.ch > 1 ? rd(i * bps * fmt.ch + bps) : L[i]; } return [L, R]; }
const S = n => readWav(P + 'sfx/sfx_map1_' + n + '.wav');
const SW = [1, 2, 3].map(i => S('swish' + i)), MK = [1, 2].map(i => S('marker' + i)), PL = [1, 2, 3, 4].map(i => S('plunk' + i));
const ONE = { thud: S('thud'), boom: S('boom'), wave: S('wave'), ding: S('ding'), whip: S('whip') };
const N = SR * DUR, L = new Float32Array(N), R = new Float32Array(N);
const add = ([a, b], t, g) => { const o = Math.round(t * SR); for (let i = 0; i < a.length; i++) { const k = o + i; if (k < 0 || k >= N) continue; L[k] += a[i] * g; R[k] += b[i] * g; } };
let cuts = [], pops = [], beats = [], ev = [];
for (const f of process.argv.slice(2)) { const j = JSON.parse(fs.readFileSync(f, 'utf8')); cuts.push(...j.cuts); pops.push(...j.pops); if (j.beats && j.beats.length) beats = j.beats; if (j.sfx && j.sfx.length) ev = j.sfx; }
cuts = [...new Set(cuts)].sort((a, b) => a - b); pops = [...new Set(pops)].sort((a, b) => a - b);
let ns = 0, nm = 0, np = 0;
cuts.forEach(t => { if (t > 0.3) add(ONE.whip, t - 0.2, 0.32); });
beats.forEach(([t0, , cut]) => { if (!cut && t0 > 0.3) add(SW[ns++ % 3], t0 - 0.1, 0.4); });
const busy = [];
ev.forEach(([t, k]) => { busy.push(t); if (k === 'swish') add(SW[ns++ % 3], t - 0.1, 0.45); else if (k === 'marker') add(MK[nm++ % 2], t, 0.32); else add(ONE[k], t - (k === 'wave' ? 0.4 : 0), { thud: 0.75, boom: 0.7, wave: 0.35, ding: 0.4 }[k]); });
let lastp = -9; pops.forEach(t => { if (t - lastp < 0.28) return; if (cuts.some(c => Math.abs(c - t) < 0.15) || busy.some(b => Math.abs(b - t) < 0.12)) return; lastp = t; add(PL[np++ % 4], t, 0.28); });
const out = Buffer.alloc(44 + N * 4); out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVEfmt ', 8); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { out.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(L[i] * 32767))), 44 + i * 4); out.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(R[i] * 32767))), 46 + i * 4); }
fs.writeFileSync(P + 'temp/sfx_track.wav', out);
console.log('cuts', cuts.length, 'events', ev.length, 'plunks', np, 'swishes', ns);
