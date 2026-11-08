// ===== the 30 named animation types (adapted to this topic), all drawn 2.5D =====
const TPL = {};
// key progress: b.kt[i] is absolute time of key i (from o.k anchors)
const KT = (b, i) => (b.kt && b.kt[i] != null ? b.kt[i] : b.t0 + 0.6 + i * 1.6);
const kp = (b, t, i, dur = 0.55) => ease(seg(t, KT(b, i), KT(b, i) + dur));
const kb = (b, t, i, dur = 0.5) => easeOutBack(seg(t, KT(b, i), KT(b, i) + dur));
const ip = (b, t, delay = 0, dur = 0.6) => ease(seg(t, b.t0 + delay, b.t0 + delay + dur));
const ib = (b, t, delay = 0, dur = 0.55) => easeOutBack(seg(t, b.t0 + delay, b.t0 + delay + dur));
function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

// ---------- brain (side view, frontal lobe on the left) ----------
let BRAIN_GYRI = null;
function brainPath(g) { g.beginPath(); g.moveTo(-196, 30); g.bezierCurveTo(-214, -60, -150, -150, -40, -158); g.bezierCurveTo(60, -166, 170, -120, 196, -30); g.bezierCurveTo(212, 20, 190, 58, 150, 66); g.bezierCurveTo(110, 74, 80, 70, 64, 92); g.bezierCurveTo(30, 118, -40, 110, -70, 96); g.bezierCurveTo(-120, 100, -186, 86, -196, 30); g.closePath(); }
function cerebPath(g) { g.beginPath(); g.ellipse(124, 100, 76, 44, -0.15, 0, 7); }
function brainSide(g, cx, cy, s, o = {}) {
  const mode = o.mode || 'solid', col = o.col || PAL.cyan, t = o.t || 0;
  if (!BRAIN_GYRI) { const R = seeded(7); BRAIN_GYRI = []; for (let k = 0; k < 34; k++) { let x = -180 + R() * 360, y = -140 + R() * 210; const pts = [[x, y]]; let a = R() * 6.28; for (let i = 0; i < 6; i++) { a += (R() - 0.5) * 2.2; x += Math.cos(a) * 26; y += Math.sin(a) * 18; pts.push([x, y]); } BRAIN_GYRI.push(pts); } }
  g.save(); g.translate(cx, cy); g.scale(s, s); g.rotate(o.rot || 0);
  // stem
  g.beginPath(); g.moveTo(40, 92); g.bezierCurveTo(50, 140, 54, 170, 70, 210); g.lineTo(104, 206); g.bezierCurveTo(92, 160, 92, 130, 96, 96); g.closePath();
  if (mode === 'holo') { g.strokeStyle = rgba(col, 0.6); g.lineWidth = 2.5 / s; g.stroke(); } else { g.fillStyle = '#9a6a88'; g.fill(); }
  // cerebellum
  cerebPath(g);
  if (mode === 'holo') { g.fillStyle = rgba(col, o.hl === 'cer' ? 0.35 : 0.08); g.fill(); g.strokeStyle = rgba(o.hl === 'cer' ? PAL.gold : col, 0.9); g.lineWidth = 3 / s; g.stroke(); }
  else { const cg = g.createRadialGradient(110, 80, 5, 124, 100, 80); cg.addColorStop(0, '#e2a9c4'); cg.addColorStop(1, '#8e5476'); g.fillStyle = cg; g.fill(); }
  g.save(); cerebPath(g); g.clip(); g.strokeStyle = mode === 'holo' ? rgba(col, 0.5) : 'rgba(90,40,70,0.55)'; g.lineWidth = 2.2 / s; for (let i = -4; i < 6; i++) { g.beginPath(); g.ellipse(124, 100 + i * 10, 80, 30, -0.15, 3.3, 6.1); g.stroke(); } g.restore();
  // cerebrum
  brainPath(g);
  if (mode === 'holo') { g.fillStyle = rgba(col, 0.1); g.fill(); g.strokeStyle = col; g.lineWidth = 3.5 / s; g.shadowColor = col; g.shadowBlur = 18; g.stroke(); g.shadowBlur = 0; }
  else { const bg = g.createRadialGradient(-60, -100, 20, 0, -20, 240); bg.addColorStop(0, '#f6c6db'); bg.addColorStop(0.55, '#d48cb0'); bg.addColorStop(1, '#8a4c74'); g.fillStyle = bg; g.fill(); g.strokeStyle = 'rgba(60,20,50,0.7)'; g.lineWidth = 3 / s; g.stroke(); }
  g.save(); brainPath(g); g.clip(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = mode === 'holo' ? rgba(col, 0.38) : 'rgba(110,50,85,0.55)'; g.lineWidth = (mode === 'holo' ? 2 : 3.2) / s;
  for (const pts of BRAIN_GYRI) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }
  if (mode !== 'holo') { g.globalCompositeOperation = 'source-atop'; const rim = g.createLinearGradient(-200, -160, 200, 100); rim.addColorStop(0, 'rgba(255,255,255,0.2)'); rim.addColorStop(0.5, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(20,0,40,0.35)'); g.fillStyle = rim; g.fillRect(-220, -180, 440, 300); }
  g.restore();
  // regions
  const R = (key, fn, c) => { const a = o.hl === key ? 1 : (o.show && o.show.includes(key) ? 0.55 : 0); if (!a) return; const pulse = 0.75 + 0.25 * Math.sin(t * 5); g.save(); g.globalAlpha = a; fn(); g.fillStyle = rgba(c, 0.55 * pulse); g.fill(); g.strokeStyle = c; g.lineWidth = 4 / s; g.shadowColor = c; g.shadowBlur = 26; g.stroke(); g.restore(); };
  R('pfc', () => { g.beginPath(); g.moveTo(-196, 30); g.bezierCurveTo(-214, -60, -150, -150, -70, -156); g.bezierCurveTo(-90, -80, -100, 0, -120, 92); g.bezierCurveTo(-160, 90, -190, 70, -196, 30); }, PAL.violet);
  R('hip', () => { g.beginPath(); g.moveTo(-36, 60); g.bezierCurveTo(-30, 30, 10, 20, 40, 26); g.bezierCurveTo(70, 30, 86, 10, 80, -6); g.bezierCurveTo(96, 6, 96, 40, 60, 46); g.bezierCurveTo(30, 50, 0, 50, -10, 72); g.bezierCurveTo(-30, 80, -44, 72, -36, 60); }, PAL.gold);
  R('amy', () => { g.beginPath(); g.ellipse(-52, 64, 18, 12, -0.4, 0, 7); }, PAL.pink);
  R('bg', () => { g.beginPath(); g.ellipse(-10, -30, 46, 30, 0.2, 0, 7); }, PAL.green);
  R('cer', () => cerebPath(g), PAL.teal);
  R('dg', () => { g.beginPath(); g.ellipse(30, 34, 22, 12, 0.2, 0, 7); }, PAL.red);
  g.restore();
}
// region anchor points (local) for leader lines
const BRAIN_PT = { pfc: [-150, -20], hip: [40, 30], amy: [-52, 64], bg: [-10, -30], cer: [124, 100], dg: [30, 34] };
function brainPt(cx, cy, s, k) { const p = BRAIN_PT[k]; return [cx + p[0] * s, cy + p[1] * s]; }
function leader(g, x0, y0, x1, y1, label, col, p, o = {}) {
  if (p <= 0) return; const mx = x1, my = y0 + (y1 - y0);
  g.save(); g.strokeStyle = col; g.lineWidth = 2.5; g.globalAlpha = clamp(p * 2); strokeOn(g, p, 900); g.beginPath(); g.moveTo(x0, y0); g.lineTo(lerp(x0, x1, 0.4), y1); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
  g.fillStyle = col; g.beginPath(); g.arc(x0, y0, 7, 0, 7); g.fill(); glow(g, x0, y0, 30, col, 0.8);
  const al = x1 > x0 ? 'left' : 'right'; txt(g, label, x1 + (al === 'left' ? 14 : -14), y1 - 2, { size: o.size || 40, align: al, col: PAL.white, alpha: clamp(p * 1.5 - 0.3), w: 700 });
  if (o.sub) txt(g, o.sub, x1 + (al === 'left' ? 16 : -16), y1 + 36, { size: 24, align: al, col, font: FONT_U, w: 600, alpha: clamp(p * 1.5 - 0.5), track: 2 });
  g.restore();
}

// ---------- world map raster ----------
let MAPDOTS = null;
function buildMap() {
  if (!window.WORLD) return; const Wm = 720, Hm = 360, c = mk(Wm, Hm), g = c.getContext('2d');
  const land = topojson.feature(WORLD, WORLD.objects.land); g.fillStyle = '#fff';
  const pr = ([lon, lat]) => [(lon + 180) / 360 * Wm, (90 - lat) / 180 * Hm];
  for (const f of land.features) { const geoms = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates; for (const pg of geoms) { g.beginPath(); for (const ring of pg) ring.forEach((pt, i) => { const [x, y] = pr(pt); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.fill('evenodd'); } }
  const d = g.getImageData(0, 0, Wm, Hm).data; MAPDOTS = [];
  for (let y = 4; y < Hm - 30; y += 7) for (let x = 0; x < Wm; x += 7) if (d[(y * Wm + x) * 4] > 128) MAPDOTS.push([x / Wm * 360 - 180, 90 - y / Hm * 180]);
}

// 1 MAP ROUTE — flat dot map lying on the floor, routes arc up into the air
TPL.mapRoute = (g, t, b, o) => {
  const s = 1.32, P = ISO(W / 2 - 40, H * 0.47, s), MW = 900, MH = 450; // map plane: x∈[-450,450] maps lon, y∈[-225,225] maps lat
  const L = (lon, lat) => [lon / 180 * MW / 2 + 60, -lat / 90 * MH / 2 + 40];
  const a = ip(b, t, 0, 0.9);
  // plate
  isoBox(g, P, -500 + 60, -270 + 40, -18, 1000, 540, 18, '#0d1a3a', { rim: rgba(PAL.cyan, 0.4), alpha: a });
  if (MAPDOTS) { g.save(); g.globalAlpha = a; for (let i = 0; i < MAPDOTS.length; i++) { const [lon, lat] = MAPDOTS[i]; const [x, y] = L(lon, lat); const q = P(x, y, 0); const wv = clamp((t - b.t0) * 1.6 - (lon + 180) / 360); if (wv <= 0) continue; g.fillStyle = (i % 9 === 0) ? 'rgba(255,198,92,0.8)' : 'rgba(110,170,255,0.55)'; g.fillRect(q[0] - 2.4, q[1] - 1.4, 4.8, 2.8); } g.restore(); }
  const pts = o.pts || [];
  pts.forEach((pt, i) => {
    const [x, y] = L(pt.lon, pt.lat), q = P(x, y, 0), p = kp(b, t, i, 0.5);
    if (p <= 0) return; const hgt = 70 * easeOutBack(p);
    g.save(); g.strokeStyle = pt.col || PAL.gold; g.lineWidth = 4; g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q[0], q[1] - hgt); g.stroke(); g.restore();
    glow(g, q[0], q[1], 40, pt.col || PAL.gold, p); glow(g, q[0], q[1] - hgt, 30, pt.col || PAL.gold, p);
    g.fillStyle = pt.col || PAL.gold; g.beginPath(); g.arc(q[0], q[1] - hgt, 9, 0, 7); g.fill();
    chip(g, pt.label, q[0], q[1] - hgt - 44, pt.col || PAL.gold, { size: 28, alpha: p, fill: 'rgba(8,12,26,0.85)' });
    if (pt.sub) txt(g, pt.sub, q[0], q[1] - hgt - 92, { size: 26, font: FONT_U, col: PAL.white, alpha: p * 0.85, w: 600 });
    if (i > 0) { // arc from previous
      const pv = pts[i - 1], [x0, y0] = L(pv.lon, pv.lat); const ap = kp(b, t, i, 1.0);
      g.save(); g.strokeStyle = rgba(pt.col || PAL.gold, 0.9); g.lineWidth = 4; g.setLineDash([14, 10]); g.lineDashOffset = -t * 40; g.beginPath();
      let last = null; for (let k = 0; k <= 40 * ap; k++) { const f = k / 40, xx = lerp(x0, x, f), yy = lerp(y0, y, f), z = Math.sin(f * Math.PI) * 180; const r = P(xx, yy, z); k ? g.lineTo(r[0], r[1]) : g.moveTo(r[0], r[1]); last = r; } g.stroke(); g.restore();
      if (last && ap < 1) glow(g, last[0], last[1], 46, PAL.white, 1);
    }
  });
};

// 2 HEADLINE — journal/newspaper slides in on an iso desk, headline typed, stamp slams
TPL.headline = (g, t, b, o) => {
  const a = ib(b, t, 0, 0.7), P = ISO(W / 2, H * 0.62, 1);
  g.save(); g.translate(0, (1 - a) * 300); g.globalAlpha = clamp(a * 2);
  // paper on the floor (top face) - big
  isoBox(g, P, -420, -300, 0, 840, 600, 10, '#ece4d2', { rim: 'rgba(255,255,255,0.6)' });
  onFace(g, P, 'top', -420, -300, 10, 1, c => {
    c.fillStyle = '#1b1b1f'; c.font = `900 92px Georgia, serif`; c.textAlign = 'center'; c.fillText(o.paper || 'SCIENCE', 420, 110);
    c.fillRect(40, 136, 760, 5); c.fillRect(40, 146, 760, 2);
    c.font = `600 22px Georgia, serif`; c.fillText(o.date || '', 420, 176);
    c.font = `800 52px ${FONT_H}`; c.fillText(typeOn(o.head || '', seg(t, b.t0 + 0.5, b.t0 + 2.2)), 420, 260);
    c.font = `500 30px ${FONT_U}`; c.fillStyle = '#3a3a44'; c.fillText(typeOn(o.sub || '', seg(t, b.t0 + 1.6, b.t0 + 3.4)), 420, 320);
    c.fillStyle = 'rgba(30,30,40,0.25)'; for (let i = 0; i < 6; i++) { c.fillRect(60, 370 + i * 30, 330, 12); c.fillRect(450, 370 + i * 30, 330, 12); }
  });
  g.restore();
  if (o.stamp) { const p = kb(b, t, 0, 0.35); if (p > 0) { g.save(); g.translate(W / 2 + 260, H * 0.42); g.rotate(-0.18); g.scale(lerp(2.2, 1, p), lerp(2.2, 1, p)); g.globalAlpha = clamp(p * 2); g.strokeStyle = PAL.red; g.lineWidth = 8; g.beginPath(); g.roundRect(-190, -60, 380, 120, 14); g.stroke(); txt(g, o.stamp, 0, 4, { size: 64, col: PAL.red, w: 800 }); g.restore(); } }
};

// 3 TEARDOWN — exploded iso layers lifting apart with labels
TPL.teardown = (g, t, b, o) => {
  const L = o.layers || [], P = ISO(W / 2 - 120, H * 0.78, 1.15), n = L.length;
  for (let i = 0; i < n; i++) {
    const p = kp(b, t, i, 0.7), lift = i * 50 + p * i * 70 + ip(b, t, 0, 0.8) * 0;
    const col = L[i].col || PAL.cyan;
    floorShadow(g, P, -170, -170, 340, 340, 0.12);
    const bx = isoBox(g, P, -170, -170, lift, 340, 340, 26, shade(col, -0.55), { rim: rgba(col, 0.9), edge: rgba(col, 0.6 + 0.4 * p) });
    onFace(g, P, 'top', -170, -170, lift + 26, 1, c => { c.strokeStyle = rgba(col, 0.35); c.lineWidth = 2; for (let k = 40; k < 340; k += 40) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k, 340); c.moveTo(0, k); c.lineTo(340, k); c.stroke(); } if (L[i].icon) { c.save(); c.translate(170, 170); c.rotate(-Math.PI / 4); c.scale(1, 1.6); icon(c, L[i].icon, 0, 0, 1.6, col, 1, { glow: false }); c.restore(); } });
    const q = P(170, 0, lift + 13); leader(g, q[0], q[1], q[0] + 240, q[1] - 30, L[i].name, col, p, { sub: L[i].sub, size: 40 });
  }
};

// 4 SPLIT FLAP — airport board flipping into words / numbers
const FLAPCH = 'অআইউএকখগঘচছজঝটঠডঢতথদধনপফবভমযরলশসহ০১২৩৪৫৬৭৮৯';
TPL.splitFlap = (g, t, b, o) => {
  const rows = o.rows || [], cw = 74, ch = 104, gap = 8;
  const totalH = rows.length * (ch + 26);
  const a = ib(b, t, 0, 0.6);
  g.save(); g.translate(W / 2, H * 0.5 - totalH / 2 + 10); g.scale(lerp(0.85, 1, a), lerp(0.85, 1, a)); g.globalAlpha = clamp(a * 2);
  // board housing with iso depth
  const maxLen = Math.max(...rows.map(r => [...r.s].length));
  const BW = maxLen * (cw + gap) + 80, BH = totalH + 60;
  g.fillStyle = '#05070f'; g.beginPath(); g.roundRect(-BW / 2 + 18, -40 + 18, BW, BH, 20); g.fill();
  g.fillStyle = '#10131f'; g.beginPath(); g.roundRect(-BW / 2, -40, BW, BH, 20); g.fill(); g.strokeStyle = 'rgba(255,198,92,0.35)'; g.lineWidth = 3; g.stroke();
  rows.forEach((r, ri) => {
    const chars = [...r.s], x0 = -(chars.length * (cw + gap)) / 2, y = ri * (ch + 26), st = KT(b, ri);
    chars.forEach((c, ci) => {
      const tt = t - st - ci * 0.06, done = tt > 0.5 + ci * 0.02; const x = x0 + ci * (cw + gap);
      const show = tt < 0 ? ' ' : done ? c : FLAPCH[Math.floor(hash(ci * 31 + Math.floor(tt * 24)) * FLAPCH.length)];
      const flip = tt > 0 && !done ? (tt * 24) % 1 : 0;
      g.fillStyle = '#1b2033'; g.beginPath(); g.roundRect(x, y, cw, ch, 8); g.fill();
      g.fillStyle = '#232a42'; g.beginPath(); g.roundRect(x, y, cw, ch / 2, [8, 8, 0, 0]); g.fill();
      txt(g, show, x + cw / 2, y + ch / 2 + 4, { size: 70, col: done ? (r.col || PAL.gold) : PAL.white, w: 700, font: FONT_H });
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x, y + ch / 2 - 1.5, cw, 3);
      if (flip) { g.fillStyle = `rgba(255,255,255,${0.12 * (1 - flip)})`; g.fillRect(x, y + ch / 2 * flip, cw, ch / 2 * (1 - flip)); }
    });
    if (r.label) txt(g, r.label, x0 - 24, y + ch / 2, { size: 30, align: 'right', font: FONT_U, col: rgba(r.col || PAL.gold, 0.9), w: 600, alpha: clamp((t - st) * 2) });
  });
  g.restore();
};

// 5 GIT CITY — contribution-graph city: towers erupting = new neurons every second
TPL.gitCity = (g, t, b, o) => {
  const P = ISO(W / 2, H * 0.52, 1), N = o.n || 14, cell = 34, R = seeded(o.seed || 3), d = t - b.t0;
  const items = []; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) items.push([i, j, R(), R()]);
  items.sort((A, B) => (A[0] + A[1]) - (B[0] + B[1]));
  const rate = o.rate || 1;
  for (const [i, j, r1, r2] of items) {
    const birth = r1 * 4 / rate + (i + j) * 0.03; const p = clamp((d - birth) / 0.5); const h = p > 0 ? 8 + easeOutBack(p) * (20 + r2 * r2 * 180) * (o.tall || 1) : 4;
    const old = o.old && r2 < 0.35; const col = old ? (d > (o.breakAt || 99) ? PAL.red : PAL.blue) : (r2 > 0.8 ? PAL.gold : PAL.green);
    const x = (i - N / 2) * cell, y = (j - N / 2) * cell;
    isoBox(g, P, x, y, 0, cell - 6, cell - 6, h, shade(col, p > 0 ? -0.35 : -0.75), { rim: p > 0 ? rgba(col, 0.9) : 'rgba(255,255,255,0.08)', rimW: 1.2 });
    if (p > 0 && p < 1) { const q = P(x + 14, y + 14, h); glow(g, q[0], q[1], 30, col, 1 - p); }
  }
  if (o.label) { const p = ip(b, t, 0.4, 0.5); txt(g, o.label, W / 2, 150, { size: 64, col: PAL.white, alpha: p, w: 800 }); }
  if (o.counter) { const v = Math.floor(Math.min(1, d / Math.max(2, b.t1 - b.t0 - 0.5)) * o.counter); chip(g, BN(v.toLocaleString('en-US')) + ' ' + (o.unit || ''), W / 2, H - 120, PAL.green, { size: 40 }); }
};

// 6 STAT CHART — iso 3D bars rising with counting values
TPL.statChart = (g, t, b, o) => {
  const bars = o.bars || [], n = bars.length, P = ISO(W / 2 - 60, H * 0.72, 1.1), sp = 170, mx = o.max || Math.max(...bars.map(x => x.val));
  if (o.title) txt(g, o.title, W / 2, 130, { size: 56, col: PAL.white, alpha: ip(b, t, 0, 0.5), w: 800 });
  isoBox(g, P, -n * sp / 2 - 60, -110, -14, n * sp + 120, 220, 14, '#0f1d44', { rim: 'rgba(120,170,255,0.3)', alpha: ip(b, t, 0, 0.5) });
  bars.forEach((bar, i) => {
    const p = kp(b, t, i, 0.9), h = 420 * (bar.val / mx) * easeOut(p), x = -n * sp / 2 + i * sp + 20;
    const col = bar.col || PAL.gold;
    if (p > 0) { floorShadow(g, P, x, -50, 100, 100, 0.3); isoBox(g, P, x, -50, 0, 100, 100, Math.max(4, h), col, { rim: 'rgba(255,255,255,0.7)' }); const q = P(x + 50, -50 + 50, h + 20); glow(g, q[0], q[1] - 30, 60, col, 0.5 * p);
      const v = bar.val * easeOut(p); txt(g, bar.txt || ((bar.pre || '') + BN(v.toFixed(bar.dec || 0)) + (bar.unit || '')), q[0], q[1] - 46, { size: 46, col: PAL.white, w: 800, alpha: p }); }
    const lq = P(x + 50, 80, 0); txt(g, bar.label, lq[0] + 10, lq[1] + 34, { size: 30, font: FONT_U, col: rgba(col, 0.95), w: 600, alpha: ip(b, t, 0.2, 0.5) });
  });
};

// 7 GLOBE ARCS — rotating dotted globe with glowing arcs
TPL.globeArcs = (g, t, b, o) => {
  const cx = o.x || W / 2, cy = o.y || H * 0.52, R = o.r || 330, rot = (t - b.t0) * 0.25 + (o.lon0 || 0) * D2R, tilt = 0.32, a = ib(b, t, 0, 0.8);
  const prj = (lon, lat) => { const la = lat * D2R, lo = lon * D2R + rot; let x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo); const y2 = y * Math.cos(tilt) - z * Math.sin(tilt), z2 = y * Math.sin(tilt) + z * Math.cos(tilt); return [cx + x * R * a, cy - y2 * R * a, z2]; };
  const gr = g.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.1, cx, cy, R * a); gr.addColorStop(0, '#16306a'); gr.addColorStop(1, '#060c20'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R * a, 0, 7); g.fill();
  glow(g, cx, cy, R * 1.5 * a, PAL.blue, 0.35); g.strokeStyle = rgba(PAL.cyan, 0.5); g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R * a, 0, 7); g.stroke();
  if (MAPDOTS) for (let i = 0; i < MAPDOTS.length; i += 2) { const [x, y, z] = prj(MAPDOTS[i][0], MAPDOTS[i][1]); if (z < 0) continue; g.fillStyle = `rgba(${i % 7 ? '120,180,255' : '255,198,92'},${0.3 + z * 0.6})`; g.fillRect(x - 1.8, y - 1.8, 3.6, 3.6); }
  (o.arcs || []).forEach((A, i) => {
    const p = kp(b, t, i, 1.1); if (p <= 0) return; const col = A.col || PAL.gold; g.save(); g.strokeStyle = col; g.lineWidth = 3.5; g.shadowColor = col; g.shadowBlur = 14; g.beginPath(); let first = true, last = null;
    for (let k = 0; k <= 50 * p; k++) { const f = k / 50, lon = lerp(A[0], A[2], f), lat = lerp(A[1], A[3], f); const [x, y, z] = prj(lon, lat); const lift = 1 + Math.sin(f * Math.PI) * 0.22; const X = cx + (x - cx) * lift, Y = cy + (y - cy) * lift; if (z < -0.15) { first = true; continue; } first ? g.moveTo(X, Y) : g.lineTo(X, Y); first = false; last = [X, Y]; }
    g.stroke(); g.restore(); if (last) glow(g, last[0], last[1], 34, PAL.white, p < 1 ? 1 : 0.4);
    for (const e of [[A[0], A[1]], [A[2], A[3]]]) { const [x, y, z] = prj(e[0], e[1]); if (z > 0) { g.fillStyle = col; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); } }
  });
  if (o.label) txt(g, o.label, cx, cy + R * a + 70, { size: 54, col: PAL.white, w: 800, alpha: ip(b, t, 0.6, 0.5) });
};

// 8 AGENT SWARM — swarm of agents (new neurons) flooding an old network, snapping its links
TPL.agentSwarm = (g, t, b, o) => {
  const d = t - b.t0, cx = W / 2, cy = H * 0.52, R = seeded(5), NOld = 26;
  const old = []; for (let i = 0; i < NOld; i++) old.push([cx + (R() - 0.5) * 900, cy + (R() - 0.5) * 520]);
  const inv = o.invade ? clamp((t - KT(b, 0)) / 3) : 0;
  // old links (memories) — break when invaded
  for (let i = 0; i < NOld; i++) for (let j = i + 1; j < NOld; j++) { const dx = old[i][0] - old[j][0], dy = old[i][1] - old[j][1], dd = Math.hypot(dx, dy); if (dd > 230) continue; const brk = hash(i * 50 + j) < inv; g.strokeStyle = brk ? 'rgba(255,79,139,0.25)' : 'rgba(255,198,92,0.6)'; g.lineWidth = brk ? 1 : 3; g.beginPath(); if (brk) { g.setLineDash([6, 10]); } g.moveTo(old[i][0], old[i][1]); g.lineTo(old[j][0], old[j][1]); g.stroke(); g.setLineDash([]); }
  old.forEach(([x, y], i) => { g.fillStyle = PAL.gold; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); glow(g, x, y, 34, PAL.gold, 0.5 * (1 - inv * 0.6)); });
  // swarm
  const N = o.n || 260;
  for (let k = 0; k < N; k++) {
    const st = hash(k * 3.1) * Math.max(1, (b.t1 - b.t0) * 0.6), p = clamp((d - st) / 1.6); if (p <= 0) continue;
    const ang = hash(k) * 6.28, fx = cx + Math.cos(ang) * 1200, fy = cy + Math.sin(ang) * 800;
    const tx = cx + (hash(k + 1) - 0.5) * 1000 + Math.sin(t * 2 + k) * 14, ty = cy + (hash(k + 2) - 0.5) * 560 + Math.cos(t * 2.3 + k) * 10;
    const e = easeOut(p), x = lerp(fx, tx, e), y = lerp(fy, ty, e);
    g.fillStyle = o.col || PAL.green; g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill(); if (k % 4 === 0) glow(g, x, y, 18, o.col || PAL.green, 0.6);
  }
  if (o.label) chip(g, o.label, W / 2, H - 110, o.col || PAL.green, { size: 38, alpha: ip(b, t, 0.5, 0.4) });
};

// 9 BEFORE / AFTER — two iso cards and a wipe slider sweeping between them
TPL.beforeAfter = (g, t, b, o) => {
  const sw = kp(b, t, 0, 1.2), cx = W / 2, cy = H * 0.52, w = 1500, h = 640, x0 = cx - w / 2, y0 = cy - h / 2;
  const side = (S, x, col) => { glass(g, x, y0, w / 2 - 10, h, { edge: rgba(col, 0.6) }); txt(g, S.title, x + w / 4, y0 + 70, { size: 48, col, w: 800 }); if (S.icon) badge(g, S.icon, x + w / 4, y0 + 270, 110, col, 1); (S.lines || []).forEach((l, i) => txt(g, l, x + w / 4, y0 + 450 + i * 56, { size: 36, font: FONT_U, col: PAL.white, w: 600 })); };
  const a = ib(b, t, 0, 0.6); g.save(); g.globalAlpha = clamp(a * 2); g.translate(cx, cy); g.scale(lerp(0.9, 1, a), lerp(0.9, 1, a)); g.translate(-cx, -cy);
  side(o.L, x0, o.L.col || PAL.blue);
  g.save(); g.beginPath(); g.rect(x0 + w / 2 + 10 - (1 - sw) * 0, y0 - 20, (w / 2) * sw + 20, h + 40); g.clip(); side(o.R, x0 + w / 2 + 10, o.R.col || PAL.gold); g.restore();
  const sx = x0 + w / 2 + (w / 2) * sw; g.fillStyle = PAL.white; g.fillRect(sx - 2, y0 - 30, 4, h + 60); glow(g, sx, cy, 80, PAL.white, 0.5 * (1 - sw) + 0.2);
  g.beginPath(); g.arc(sx, cy, 26, 0, 7); g.fillStyle = PAL.white; g.fill(); txt(g, '⇆', sx, cy + 2, { size: 30, col: PAL.ink, font: 'Segoe UI Symbol' });
  g.restore();
};

// 10 SWISS GRID — bold typographic poster with grid and sliding blocks
TPL.swissGrid = (g, t, b, o) => {
  const col = o.col || PAL.red, a = ip(b, t, 0, 0.5);
  g.save(); g.globalAlpha = a; const x0 = 200, y0 = 150, w = W - 400, h = H - 300;
  g.fillStyle = 'rgba(244,241,234,0.94)'; g.fillRect(x0, y0, w, h);
  g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 1.5; for (let i = 1; i < 12; i++) { g.beginPath(); g.moveTo(x0 + i * w / 12, y0); g.lineTo(x0 + i * w / 12, y0 + h); g.stroke(); } for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(x0, y0 + i * h / 8); g.lineTo(x0 + w, y0 + i * h / 8); g.stroke(); }
  const p1 = ib(b, t, 0.2, 0.6); g.fillStyle = col; g.fillRect(x0, y0, w * 0.42 * p1, h);
  txt(g, o.num || '', x0 + w * 0.21, y0 + h * 0.5, { size: 380, col: PAL.white, w: 900, alpha: p1 });
  if (o.kicker) txt(g, o.kicker, x0 + w * 0.47, y0 + 100, { size: 34, col, font: FONT_U, w: 700, align: 'left', track: 4, alpha: ip(b, t, 0.4, 0.4) });
  (o.lines || []).forEach((l, i) => { const p = kp(b, t, i, 0.5); g.save(); g.translate((1 - p) * 120, 0); txt(g, l, x0 + w * 0.47, y0 + 220 + i * 120, { size: i === 0 ? 84 : 56, col: '#101218', w: i === 0 ? 800 : 600, align: 'left', alpha: p }); g.restore(); });
  g.fillStyle = '#101218'; g.fillRect(x0 + w * 0.47, y0 + h - 70, w * 0.5 * ip(b, t, 0.8, 0.8), 8);
  g.restore();
};

// 11 BLUEPRINT DRAW — technical drawing appears line by line on a blueprint sheet lying in iso
TPL.blueprintDraw = (g, t, b, o) => {
  const P = ISO(W / 2, H * 0.36, 1), a = ip(b, t, 0, 0.6), sw = 1100, sh = 700;
  g.save(); g.globalAlpha = a;
  isoBox(g, P, -sw / 2, -sh / 2 + 120, 0, sw, sh, 8, '#123a8a', { rim: 'rgba(160,210,255,0.6)' });
  onFace(g, P, 'top', -sw / 2, -sh / 2 + 120, 8, 1, c => {
    c.strokeStyle = 'rgba(180,220,255,0.18)'; c.lineWidth = 1; for (let i = 0; i <= sw; i += 40) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, sh); c.stroke(); } for (let i = 0; i <= sh; i += 40) { c.beginPath(); c.moveTo(0, i); c.lineTo(sw, i); c.stroke(); }
    c.strokeStyle = 'rgba(220,240,255,0.95)'; c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round';
    const p = seg(t, b.t0 + 0.3, b.t0 + Math.min(4, (b.t1 - b.t0) * 0.7));
    c.save(); c.translate(sw / 2, sh / 2); c.rotate(Math.PI / 4); c.scale(1, 1.15);
    (BP[o.draw] || BP.crib)(c, p, t);
    c.restore();
    c.font = `600 22px Consolas, monospace`; c.fillStyle = 'rgba(220,240,255,0.7)'; c.fillText(o.code || 'FIG. 1', 30, sh - 30);
  });
  g.restore();
  (o.labels || []).forEach((L, i) => { const p = kp(b, t, i, 0.5); chip(g, L, W / 2 + (i % 2 ? 420 : -420), H * 0.25 + i * 90, PAL.cyan, { size: 32, alpha: p, fill: 'rgba(8,20,50,0.9)' }); });
};
const BP = {
  crib(c, p, t) { const seg2 = (k, n) => clamp(p * n - k); c.save(); strokeOn(c, seg2(0, 4), 2400); c.beginPath(); c.rect(-260, -60, 520, 220); for (let x = -240; x <= 240; x += 40) { c.moveTo(x, -60); c.lineTo(x, 160); } c.stroke(); c.restore();
    c.save(); strokeOn(c, seg2(1, 4), 900); c.beginPath(); c.moveTo(0, -60); c.lineTo(0, -230); c.moveTo(-120, -230); c.lineTo(120, -230); c.moveTo(-120, -230); c.lineTo(-120, -170); c.moveTo(0, -230); c.lineTo(0, -160); c.moveTo(120, -230); c.lineTo(120, -170); c.stroke(); c.restore();
    c.save(); strokeOn(c, seg2(2, 4), 900); c.beginPath(); c.arc(-120, -150, 20, 0, 7); c.moveTo(20, -140); c.arc(0, -140, 20, 0, 7); c.moveTo(140, -150); c.arc(120, -150, 20, 0, 7); c.stroke(); c.restore();
    c.save(); strokeOn(c, seg2(2.5, 4), 900); c.beginPath(); c.ellipse(-60, 80, 90, 34, 0, 0, 7); c.moveTo(70, 80); c.arc(50, 80, 22, 0, 7); c.stroke(); c.restore();
    c.save(); c.strokeStyle = '#ff7aa8'; strokeOn(c, seg2(3, 4), 900); c.beginPath(); c.moveTo(-150, 90); c.bezierCurveTo(-200, 20, -180, -100, -120, -130); c.stroke(); c.restore(); },
  hippo(c, p) { c.save(); strokeOn(c, p, 2600); c.beginPath(); c.moveTo(-220, 60); c.bezierCurveTo(-200, -40, -80, -80, 20, -60); c.bezierCurveTo(140, -40, 200, -120, 170, -180); c.bezierCurveTo(250, -140, 260, -20, 140, 10); c.bezierCurveTo(40, 30, -60, 30, -100, 100); c.bezierCurveTo(-140, 160, -230, 130, -220, 60); c.moveTo(-150, 70); c.bezierCurveTo(-100, 20, 0, 0, 100, -20); c.stroke(); c.restore(); },
  house(c, p) { c.save(); strokeOn(c, p, 3000); c.beginPath(); c.rect(-240, -160, 480, 320); c.moveTo(0, -160); c.lineTo(0, 160); c.moveTo(-240, 0); c.lineTo(240, 0); c.rect(-200, -130, 80, 60); c.rect(60, -130, 100, 70); c.rect(-180, 40, 120, 80); c.rect(90, 40, 90, 90); c.stroke(); c.restore(); },
};
