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

// ---------- animated premium paper backgrounds (house style, see SKILL.md) ----------
// (1) RELIEF: white embossed topographic paper; contour terraces flow slowly (phase), lit from top-left.
// (2) CRUMPLE: white crumpled paper; facet normals fixed, the light slowly orbits so the creases breathe.
// Both are computed at half resolution per frame and scaled up (soft, premium), plus a static full-res grain.
function _vnoise(seed, w, h, cell) { let s = seed >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; const gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2, gr = new Float32Array(gw * gh); for (let i = 0; i < gr.length; i++) gr[i] = rnd(); return (px, py) => { const fx = px / cell, fy = py / cell, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty); const a = gr[iy * gw + ix], b = gr[iy * gw + ix + 1], c = gr[(iy + 1) * gw + ix], d = gr[(iy + 1) * gw + ix + 1]; return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; }; }
function _grain(w, h, seed, amp) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); const im = x.createImageData(w, h), D = im.data; let s = seed >>> 0; for (let i = 0; i < D.length; i += 4) { s = (s * 1664525 + 1013904223) >>> 0; const v = 128 + ((s / 4294967296) - 0.5) * amp; D[i] = D[i + 1] = D[i + 2] = v; D[i + 3] = 255; } x.putImageData(im, 0, 0); return c; }
function buildRelief(W_, H_, seed = 3, o = {}) { const w = W_ >> 1, h = H_ >> 1; let s = seed >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const n1 = _vnoise(seed + 1, w, h, 260), n2 = _vnoise(seed + 2, w, h, 120), wx = _vnoise(seed + 3, w, h, 200), wy = _vnoise(seed + 4, w, h, 200);
  const blobs = []; for (let i = 0; i < 6; i++) blobs.push([rnd() * w, rnd() * h, 60 + rnd() * 140, (rnd() > 0.5 ? 1 : -1) * (0.5 + rnd() * 0.6)]);
  const H = new Float32Array(w * h); let mn = 1e9, mx = -1e9;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const X = x + (wx(x, y) - 0.5) * 120, Y = y + (wy(x, y) - 0.5) * 120; let v = n1(X, Y) * 1.4 + n2(X, Y) * 0.6; for (const [bx, by, r, a] of blobs) { const d2 = ((X - bx) ** 2 + (Y - by) ** 2) / (r * r); v += a * Math.exp(-d2); } H[y * w + x] = v; if (v < mn) mn = v; if (v > mx) mx = v; }
  for (let i = 0; i < H.length; i++) H[i] = (H[i] - mn) / (mx - mn);
  const c = document.createElement('canvas'); c.width = w; c.height = h; return { w, h, H, S: new Float32Array(w * h), c, x: c.getContext('2d'), im: c.getContext('2d').createImageData(w, h), N: o.bands || 14, base: o.base || [240, 238, 234], tint: o.tint || [0, 0, 0], grain: _grain(W_, H_, seed + 9, 16) }; }
function drawRelief(g, R, t, o = {}) { const { w, h, H, S, N, im } = R, D = im.data, ph = t * (o.speed || 0.06) + (o.phase || 0);
  for (let i = 0; i < H.length; i++) { const q = H[i] * N + ph, f = q - Math.floor(q), r = f < 0.16 ? (f / 0.16) * (f / 0.16) * (3 - 2 * f / 0.16) : 1; S[i] = Math.floor(q) + r; }
  const [br, bgc, bb] = R.base, k = o.k || 26;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x, j = (y > 1 ? y - 2 : y) * w + (x > 1 ? x - 2 : x); let sh = (S[j] - S[i]) * k; sh = sh > 40 ? 40 : sh < -55 ? -55 : sh; const ao = (1 - H[i]) * 14; const p = i * 4; D[p] = br + sh - ao; D[p + 1] = bgc + sh - ao; D[p + 2] = bb + sh - ao; D[p + 3] = 255; }
  R.x.putImageData(im, 0, 0); g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(R.c, 0, 0, w * 2, h * 2); g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.5; g.drawImage(R.grain, 0, 0); g.restore(); }
function buildCrumple(W_, H_, seed = 5, o = {}) { const w = W_ >> 1, h = H_ >> 1; let s = seed >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const P = [], M = o.facets || 260; for (let i = 0; i < M; i++) { const z = 0.75 + rnd() * 0.25, a = rnd() * 6.283, r = Math.sqrt(1 - z * z); P.push([rnd() * w, rnd() * h, Math.cos(a) * r, Math.sin(a) * r, z]); }
  const NX = new Float32Array(w * h), NY = new Float32Array(w * h), NZ = new Float32Array(w * h); const cell = 64, gw = Math.ceil(w / cell), gh = Math.ceil(h / cell), grid = Array.from({ length: gw * gh }, () => []); P.forEach((p, i) => grid[Math.min(gh - 1, p[1] / cell | 0) * gw + Math.min(gw - 1, p[0] / cell | 0)].push(i));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const cx = x / cell | 0, cy = y / cell | 0; let b1 = 1e12, b2 = 1e12, i1 = 0; for (let yy = Math.max(0, cy - 2); yy <= Math.min(gh - 1, cy + 2); yy++) for (let xx = Math.max(0, cx - 2); xx <= Math.min(gw - 1, cx + 2); xx++) for (const i of grid[yy * gw + xx]) { const d = (P[i][0] - x) ** 2 + (P[i][1] - y) ** 2; if (d < b1) { b2 = b1; b1 = d; i1 = i; } else if (d < b2) b2 = d; }
    const p = P[i1], e = Math.sqrt(b2) - Math.sqrt(b1), soft = e < 3 ? e / 3 : 1, k = y * w + x; NX[k] = p[2] * soft; NY[k] = p[3] * soft; NZ[k] = 1 - (1 - p[4]) * soft; if (e < 1.2) { NX[k] *= -0.6; NY[k] *= -0.6; } }
  const c = document.createElement('canvas'); c.width = w; c.height = h; return { w, h, NX, NY, NZ, c, x: c.getContext('2d'), im: c.getContext('2d').createImageData(w, h), base: o.base || [242, 240, 236], grain: _grain(W_, H_, seed + 9, 18) }; }
function drawCrumple(g, C, t, o = {}) { const { NX, NY, NZ, im } = C, D = im.data, a = -2.3 + Math.sin(t * (o.speed || 0.35)) * 0.6, lx = Math.cos(a) * 0.55, ly = Math.sin(a) * 0.55, lz = 0.83, [br, bgc, bb] = o.base || C.base, k = o.k || 70;
  for (let i = 0, p = 0; i < NX.length; i++, p += 4) { const d = NX[i] * lx + NY[i] * ly + NZ[i] * lz - 0.83; const v = d * k; D[p] = br + v; D[p + 1] = bgc + v; D[p + 2] = bb + v; D[p + 3] = 255; }
  C.x.putImageData(im, 0, 0); g.save(); g.imageSmoothingEnabled = true; g.drawImage(C.c, 0, 0, C.w * 2, C.h * 2); g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.5; g.drawImage(C.grain, 0, 0); g.restore(); }
// paper mode: inside MG shots every coloured glow becomes a soft raised drop-shadow (looks embossed on paper)
(() => { const P_ = CanvasRenderingContext2D.prototype, sc = Object.getOwnPropertyDescriptor(P_, 'shadowColor'), sb = Object.getOwnPropertyDescriptor(P_, 'shadowBlur'), oy = Object.getOwnPropertyDescriptor(P_, 'shadowOffsetY');
  Object.defineProperty(P_, 'shadowColor', { get() { return sc.get.call(this); }, set(v) { sc.set.call(this, window.PAPERMODE && v && v !== 'transparent' && !/rgba\([^)]*,\s*0\)$/.test(v) ? 'rgba(45,15,15,0.26)' : v); }, configurable: true });
  Object.defineProperty(P_, 'shadowBlur', { get() { return sb.get.call(this); }, set(v) { sb.set.call(this, window.PAPERMODE ? Math.min(v, 26) : v); if (window.PAPERMODE) oy.set.call(this, v > 0 ? Math.min(12, 3 + v * 0.25) : 0); }, configurable: true }); })();
// paper mode: light text inks (white/pastel, meant for dark screens) print as near-black on paper.
// Text that sits on its own dark/red tag must use a colour listed in window.PAPER_KEEP to stay light.
(() => { const P_ = CanvasRenderingContext2D.prototype, ft = P_.fillText; const lum = c => { if (typeof c !== 'string') return 0; let r, g, b; if (c[0] === '#') { const h = c.length === 4 ? c.slice(1).split('').map(x => x + x).join('') : c.slice(1, 7); r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16); } else { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return 0; [r, g, b] = m[1].split(',').map(Number); } return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
  P_.fillText = function (s, x, y, mw) { if (window.DARKMODE) { const fs = this.fillStyle; if (typeof fs === 'string' && !(window.PAPER_KEEP || []).includes(fs.toLowerCase()) && lum(fs) < 0.22) { this.fillStyle = window.DARK_INK || '#f6f2ec'; const r = mw === undefined ? ft.call(this, s, x, y) : ft.call(this, s, x, y, mw); this.fillStyle = fs; return r; } } if (window.PAPERMODE) { const fs = this.fillStyle; if (typeof fs === 'string' && !(window.PAPER_KEEP || []).includes(fs.toLowerCase()) && lum(fs) > 0.72) { this.fillStyle = window.PAPER_INK || '#1a1414'; const r = mw === undefined ? ft.call(this, s, x, y) : ft.call(this, s, x, y, mw); this.fillStyle = fs; return r; } } return mw === undefined ? ft.call(this, s, x, y) : ft.call(this, s, x, y, mw); }; })();
// ---------- original house backgrounds (not copies of any reference) ----------
// PAPER-CUT: stacked cream sheets with gently undulating cut edges; each front sheet throws a soft shadow up onto the
// one behind; edges drift slowly (subtle animation). o.accent: rgb string for one thin accent sheet near the bottom.
function paperCut(g, t, o = {}) { const W_ = g.canvas.width, H_ = g.canvas.height, n = o.layers || 7, seed = o.seed || 1, sp = o.speed || 0.25;
  g.save(); g.fillStyle = o.top || '#f7f5f1'; g.fillRect(0, 0, W_, H_);
  const tones = o.tones || ['#f5f2ed', '#f1ede7', '#ede8e1', '#f3efe9', '#e9e4dc', '#f0ebe4', '#e6e0d7', '#ece6de'];
  for (let i = 0; i < n; i++) { const by = H_ * (0.12 + 0.88 * (i + 1) / (n + 0.4)), A = 26 + 22 * Math.sin(seed * 3.1 + i * 1.7), f = 0.0042 + 0.0018 * Math.sin(seed + i * 2.3), ph = seed * 5 + i * 1.9 + t * sp * (i % 2 ? 1 : -0.8), f2 = f * 2.7, A2 = A * 0.35;
    g.beginPath(); g.moveTo(-20, H_ + 20); for (let x = -20; x <= W_ + 20; x += 12) g.lineTo(x, by + Math.sin(x * f + ph) * A + Math.sin(x * f2 - ph * 1.3) * A2); g.lineTo(W_ + 20, H_ + 20); g.closePath();
    g.shadowColor = 'rgba(40,20,15,0.20)'; g.shadowBlur = 34; g.shadowOffsetY = -10; g.fillStyle = (o.accent && i === n - 2) ? `rgb(${o.accent})` : tones[(i + seed) % tones.length]; g.fill();
    g.shadowColor = 'transparent'; g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; g.stroke(); }
  g.restore(); }
// FOLDED PAPER: a few large clean folds (origami-like facets); the light slowly orbits so folds breathe.
function buildFolds(W_, H_, seed = 2, cols = 3, rows = 5) { let s = seed >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; const P = [];
  for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) { const edge = r === 0 || r === rows || c === 0 || c === cols; P.push([c / cols * W_ + (edge && (c === 0 || c === cols) ? 0 : (rnd() - 0.5) * W_ / cols * 0.7), r / rows * H_ + (edge && (r === 0 || r === rows) ? 0 : (rnd() - 0.5) * H_ / rows * 0.7)]); }
  const T = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const a = r * (cols + 1) + c, b = a + 1, d = a + cols + 1, e = d + 1; const flip = rnd() > 0.5; const tri = flip ? [[a, b, e], [a, e, d]] : [[a, b, d], [b, e, d]]; tri.forEach(q => { const ang = rnd() * 6.283, tilt = 0.12 + rnd() * 0.3; T.push({ q, n: [Math.cos(ang) * tilt, Math.sin(ang) * tilt, 1] }); }); }
  return { P, T, grain: _grain(W_, H_, seed + 9, 16) }; }
function drawFolds(g, F, t, o = {}) { const a = -2.2 + Math.sin(t * (o.speed || 0.3)) * 0.7, L = [Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0.8], base = o.base || [243, 240, 235];
  g.save(); for (const tr of F.T) { const [n0, n1, n2] = tr.n, ln = Math.hypot(n0, n1, n2), d = (n0 * L[0] + n1 * L[1] + n2 * L[2]) / ln - 0.8; const v = d * (o.k || 90); g.fillStyle = `rgb(${base[0] + v | 0},${base[1] + v | 0},${base[2] + v | 0})`; g.beginPath(); tr.q.forEach((i, j) => j ? g.lineTo(F.P[i][0], F.P[i][1]) : g.moveTo(F.P[i][0], F.P[i][1])); g.closePath(); g.fill(); g.strokeStyle = g.fillStyle; g.lineWidth = 1.5; g.stroke(); }
  for (const tr of F.T) { g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.2; g.beginPath(); tr.q.forEach((i, j) => j ? g.lineTo(F.P[i][0], F.P[i][1]) : g.moveTo(F.P[i][0], F.P[i][1])); g.closePath(); g.stroke(); }
  g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.5; g.drawImage(F.grain, 0, 0); g.restore(); }
