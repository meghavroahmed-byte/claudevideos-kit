// paper.js: procedural premium paper texture for overlay / motion-graphics shots (Voice Of Megh house rule:
// every non-face MG shot sits on a paper background). Neutral-grey texture (128 = no change) used with 'overlay'
// so it keeps the scene's colours: fine grain + cloudy pulp + fibres + two soft folds + deckle-ish edge darkening.
// Usage: const PAPER_TEX = buildPaper(1080, 1920, seed);  paperOn(g, PAPER_TEX, strength, t)
function buildPaper(w, h, seed = 7) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  let s = seed >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  // value noise (cloudy pulp) at a few octaves
  const oct = (cell) => { const gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2, gr = new Float32Array(gw * gh); for (let i = 0; i < gr.length; i++) gr[i] = rnd(); return (px, py) => { const fx = px / cell, fy = py / cell, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty); const a = gr[iy * gw + ix], b = gr[iy * gw + ix + 1], c2 = gr[(iy + 1) * gw + ix], d = gr[(iy + 1) * gw + ix + 1]; return a + (b - a) * sx + (c2 - a) * sy + (a - b - c2 + d) * sx * sy; }; };
  const n1 = oct(180), n2 = oct(48), n3 = oct(9);
  const im = x.createImageData(w, h), D = im.data;
  for (let y = 0; y < h; y++) for (let X = 0; X < w; X++) { const v = 128 + (n1(X, y) - 0.5) * 60 + (n2(X, y) - 0.5) * 36 + (n3(X, y) - 0.5) * 22 + (rnd() - 0.5) * 30; const i = (y * w + X) * 4; D[i] = D[i + 1] = D[i + 2] = v; D[i + 3] = 255; }
  x.putImageData(im, 0, 0);
  // fibres
  x.lineCap = 'round';
  for (let i = 0; i < 2600; i++) { const px = rnd() * w, py = rnd() * h, L = 6 + rnd() * 26, a = rnd() * 6.283, bend = (rnd() - 0.5) * 10; x.strokeStyle = rnd() > 0.5 ? `rgba(255,255,255,${0.12 + rnd() * 0.2})` : `rgba(0,0,0,${0.08 + rnd() * 0.14})`; x.lineWidth = 0.6 + rnd() * 0.9; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * L / 2 + bend, py + Math.sin(a) * L / 2 - bend, px + Math.cos(a) * L, py + Math.sin(a) * L); x.stroke(); }
  // two soft folds (highlight one side, shadow the other)
  const fold = (x0, y0, x1, y1) => { const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny), ux = nx / nl, uy = ny / nl; for (let k = -1; k <= 1; k += 2) { const g = x.createLinearGradient(x0, y0, x0 + ux * 60 * k, y0 + uy * 60 * k); g.addColorStop(0, k > 0 ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(128,128,128,0)'); x.save(); x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.lineTo(x1 + ux * 60 * k, y1 + uy * 60 * k); x.lineTo(x0 + ux * 60 * k, y0 + uy * 60 * k); x.closePath(); x.fillStyle = g; x.fill(); x.restore(); } x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); };
  fold(0, h * 0.37, w, h * 0.35); fold(w * 0.58, 0, w * 0.55, h);
  // edge darkening like a sheet under a lamp
  const v = x.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.35, w / 2, h * 0.45, Math.max(w, h) * 0.75); v.addColorStop(0, 'rgba(128,128,128,0)'); v.addColorStop(1, 'rgba(40,40,40,0.55)'); x.fillStyle = v; x.fillRect(0, 0, w, h);
  return c;
}
// lay the paper over whatever background is already drawn (keeps its colours); a slow drift keeps it alive
function paperOn(g, tex, k = 0.6, t = 0) { if (!tex || k <= 0) return; g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = k; const dx = Math.sin(t * 0.15) * 6, dy = Math.cos(t * 0.11) * 6; g.drawImage(tex, -8 + dx, -8 + dy, g.canvas.width + 16, g.canvas.height + 16); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.13 * k; g.drawImage(tex, -8 + dx, -8 + dy, g.canvas.width + 16, g.canvas.height + 16); g.restore(); }
