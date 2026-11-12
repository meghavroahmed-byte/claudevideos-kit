// Shared: load sheet, remove background -> window.CUT (canvas with alpha)
function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

async function prepareSheet() {
  const img = await loadImg(window.SHEET_URL || 'sheet.jpg');
  const W = img.width, H = img.height;
  const c = mk(W, H), x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  const id = x.getImageData(0, 0, W, H), d = id.data;
  const N = W * H, bg = new Uint8Array(N);
  const col = i => [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  // reference bg = average of border pixels
  let ref = [0, 0, 0], n = 0;
  for (let xx = 0; xx < W; xx += 10) { const p = col(xx + 5 * W); ref[0] += p[0]; ref[1] += p[1]; ref[2] += p[2]; n++; }
  ref = ref.map(v => v / n);
  // flood fill from borders
  const st = [];
  for (let xx = 0; xx < W; xx++) { st.push(xx, (H - 1) * W + xx); }
  for (let yy = 0; yy < H; yy++) { st.push(yy * W, yy * W + W - 1); }
  for (const s of st) bg[s] = 1;
  while (st.length) {
    const i = st.pop(), px = i % W, py = (i / W) | 0, pc = col(i);
    const nb = [px > 0 ? i - 1 : -1, px < W - 1 ? i + 1 : -1, py > 0 ? i - W : -1, py < H - 1 ? i + W : -1];
    for (const j of nb) {
      if (j < 0 || bg[j]) continue;
      const q = col(j);
      if (dist(q, pc) < 14 && dist(q, ref) < 48) { bg[j] = 1; st.push(j); }
    }
  }
  // enclosed bg pockets: only large connected regions close to bg colour
  const cand = new Uint8Array(N), seen = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (!bg[i] && dist(col(i), ref) < 20) cand[i] = 1;
  for (let s = 0; s < N; s++) {
    if (!cand[s] || seen[s]) continue;
    const comp = [s], q = [s]; seen[s] = 1;
    while (q.length) {
      const i = q.pop(), px = i % W;
      for (const j of [px > 0 ? i - 1 : -1, px < W - 1 ? i + 1 : -1, i - W, i + W]) {
        if (j < 0 || j >= N || seen[j] || !cand[j]) continue;
        seen[j] = 1; q.push(j); comp.push(j);
      }
    }
    if (comp.length > 2500) for (const i of comp) bg[i] = 1;
  }
  // alpha with 1px soft edge
  for (let i = 0; i < N; i++) d[i * 4 + 3] = bg[i] ? 0 : 255;
  for (let i = W; i < N - W; i++) {
    if (bg[i]) continue;
    if (bg[i - 1] || bg[i + 1] || bg[i - W] || bg[i + W]) d[i * 4 + 3] = 170;
  }
  x.putImageData(id, 0, 0);
  window.REF = ref;
  return c;
}

// polygon cut: returns {c, ox, oy} canvas containing only polygon area of src
function cutPoly(src, pts, pad = 2) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [px, py] of pts) { x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); }
  x0 = Math.floor(x0 - pad); y0 = Math.floor(y0 - pad); x1 = Math.ceil(x1 + pad); y1 = Math.ceil(y1 + pad);
  const c = mk(x1 - x0, y1 - y0), g = c.getContext('2d');
  g.beginPath(); pts.forEach(([px, py], k) => k ? g.lineTo(px - x0, py - y0) : g.moveTo(px - x0, py - y0)); g.closePath();
  g.save(); g.clip(); g.drawImage(src, -x0, -y0); g.restore();
  return { c, ox: x0, oy: y0 };
}
