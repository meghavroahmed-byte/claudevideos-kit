// Build the SFX track from render metadata (out/*.mp4.json) -> ../temp/sfx_track.wav (44.1k stereo 16-bit)
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '../out'), SFX = path.join(__dirname, '../sfx'), DUR = 508.56, SR = 44100;
const ev = { trs: new Map(), pops: new Set(), booms: new Set(), ticks: new Set(), risers: new Set() };
for (const f of fs.readdirSync(OUT).filter(f => f.endsWith('.mp4.json'))) { const j = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')); (j.trs || []).forEach(([t, tr]) => ev.trs.set(t, tr)); ['pops', 'booms', 'ticks', 'risers'].forEach(k => (j[k] || []).forEach(v => ev[k].add(v))); }
function readWav(name) { const b = fs.readFileSync(path.join(SFX, `sfx_mapmix1_${name}.wav`)); let p = 12, data = null, ch = 2; while (p < b.length) { const id = b.toString('ascii', p, p + 4), sz = b.readUInt32LE(p + 4); if (id === 'fmt ') ch = b.readUInt16LE(p + 10); if (id === 'data') { data = b.subarray(p + 8, p + 8 + sz); break; } p += 8 + sz; } const n = data.length / 2 / ch, L = new Float32Array(n), R = new Float32Array(n); for (let i = 0; i < n; i++) { L[i] = data.readInt16LE(i * 2 * ch) / 32768; R[i] = data.readInt16LE((i * ch + (ch - 1)) * 2) / 32768; } return [L, R]; }
const cache = {}; const W = n => cache[n] || (cache[n] = readWav(n));
const N = Math.ceil(DUR * SR), L = new Float32Array(N), R = new Float32Array(N);
function put(name, t, gain) { if (t < 0 || t >= DUR) return; const [a, b] = W(name), o = Math.round(t * SR); for (let i = 0; i < a.length && o + i < N; i++) { L[o + i] += a[i] * gain; R[o + i] += b[i] * gain; } }
let rot = 0; const pick = (base, n) => `${base}${(rot++ % n) + 1}`;
// transitions
const trMap = { whip: ['whoosh', 4, 0.55, -0.12], zoom: ['whoosh', 4, 0.5, -0.2], swipe: ['whoosh', 4, 0.5, -0.15], bars: ['paper', 3, 0.6, -0.05], ink: ['paper', 3, 0.65, -0.05], circle: ['whoosh', 4, 0.45, -0.18], dissolve: ['whoosh', 4, 0.3, -0.25], glitch: ['tick', 2, 0.7, 0], flash: ['thump', 3, 0.55, 0] };
let nT = 0; for (const [t, tr] of [...ev.trs].sort((a, b) => a[0] - b[0])) { const m = trMap[tr]; if (!m) continue; put(pick(m[0], m[1]), t + m[3], m[2]); if (tr === 'glitch') { put('tick2', t + 0.06, 0.5); put('tick1', t + 0.12, 0.4); } nT++; }
// pops: thin out (min 0.22s apart), rotate 4 chimes
let last = -9, nP = 0; for (const t of [...ev.pops].sort((a, b) => a - b)) { if (t - last < 0.22) continue; last = t; put(pick('pop', 4), t, 0.32); nP++; }
for (const t of ev.booms) put(pick('thump', 3), t, 0.75);
for (const t of ev.ticks) for (let i = 0; i < 10; i++) put(i % 2 ? 'tick1' : 'tick2', t + i * 0.12, 0.25);
for (const t of ev.risers) put(pick('riser', 2), t, 0.45);
// write
const buf = Buffer.alloc(44 + N * 4); buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
let pk = 0; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); const sc = pk > 0.95 ? 0.95 / pk : 1;
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * sc)) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * sc)) * 32767), 46 + i * 4); }
fs.writeFileSync(path.join(__dirname, '../temp/sfx_track.wav'), buf);
console.log(`transitions ${nT}, pops ${nP}/${ev.pops.size}, booms ${ev.booms.size}, ticks ${ev.ticks.size}, risers ${ev.risers.size}, peak scale ${sc.toFixed(2)}`);
