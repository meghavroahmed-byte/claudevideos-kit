// node envelope.js <in.wav> <out.js> <fps>  -> window.ENV = [dB per frame]
const fs = require('fs');
const [inp, out, fpsS] = process.argv.slice(2);
const fps = +fpsS || 30;
const b = fs.readFileSync(inp);
let p = 12, fmt = null, data = null;
while (p < b.length - 8) {
  const id = b.toString('ascii', p, p + 4), sz = b.readUInt32LE(p + 4);
  if (id === 'fmt ') fmt = { ch: b.readUInt16LE(p + 10), sr: b.readUInt32LE(p + 12), bits: b.readUInt16LE(p + 22) };
  if (id === 'data') { data = b.subarray(p + 8, p + 8 + sz); break; }
  p += 8 + sz + (sz & 1);
}
if (!fmt || fmt.bits !== 16) throw new Error('need 16-bit PCM wav');
const n = data.length / 2 / fmt.ch, win = fmt.sr / fps, frames = Math.ceil(n / win), env = [];
for (let f = 0; f < frames; f++) {
  let s = 0, c = 0;
  for (let i = Math.floor(f * win); i < Math.min(n, Math.floor((f + 1) * win)); i++) { const v = data.readInt16LE(i * 2 * fmt.ch) / 32768; s += v * v; c++; }
  env.push(+(10 * Math.log10(s / Math.max(1, c) + 1e-9)).toFixed(1));
}
fs.writeFileSync(out, 'window.ENV=' + JSON.stringify(env) + ';');
console.log('frames', frames, 'dur', (n / fmt.sr).toFixed(2));
