// ===== "Neon Money" MG add-ons for the GTA-6 budget short (raw-short-a) =====
// Section palettes on top of mg.js. Scenes are drawn in 1920x1080 world space for worldIn().
Object.assign(CC, { pink: '#ff3d9a', pink2: '#ff9ad0', cyan: '#3de8ff', violet: '#9b6bff', gold: '#ffcf5a', gold2: '#fff0b0', cash: '#5cff9d' });
const BGPAL = {
  vice: { p: ['#3a0f3f', '#170824', '#05020a'], ac: '255,61,154', parts: 'ember' },
  gold: { p: ['#3a2a08', '#170f04', '#050301'], ac: '255,207,90', parts: 'ember' },
  tech: { p: ['#07304a', '#04131f', '#010508'], ac: '61,232,255', parts: 'snow' },
  cash: { p: ['#073a22', '#03170e', '#010603'], ac: '92,255,157', parts: 'snow' },
  red: { p: ['#3a0a12', '#16050a', '#050103'], ac: '255,77,90', parts: 'ember' },
  violet: { p: ['#22114a', '#0c0620', '#030108'], ac: '155,107,255', parts: 'snow' },
};
function bgX(g, t, mode = 'vice', o = {}) {
  const P = BGPAL[mode] || BGPAL.vice, cx = o.cx || PW / 2, cy = o.cy || PH * 0.42, ac = P.ac;
  const rg = g.createRadialGradient(cx, cy, 40, cx, cy, PH * 0.78); rg.addColorStop(0, P.p[0]); rg.addColorStop(0.55, P.p[1]); rg.addColorStop(1, P.p[2]); g.fillStyle = rg; g.fillRect(0, 0, PW, PH);
  // drifting dot grid
  g.save(); g.fillStyle = `rgb(${ac})`; const sp = 54, ox = (t * 6) % sp, oy = (t * 10) % sp;
  for (let y = -sp; y < PH + sp; y += sp) for (let x = -sp; x < PW + sp; x += sp) { const d = Math.hypot(x - cx, y - cy) / PH, r = 1.6 + 1.2 * Math.sin(t * 1.5 + x * 0.02 + y * 0.013); g.globalAlpha = 0.2 * (1 - d); g.beginPath(); g.arc(x + ox, y + oy, Math.max(0.4, r), 0, 7); g.fill(); }
  g.restore();
  if (o.floor !== false) { const hz = o.hz || 1320; g.save(); g.strokeStyle = `rgba(${ac},0.24)`; g.lineWidth = 2; for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(PW / 2 + i * 30, hz); g.lineTo(PW / 2 + i * 260, PH + 40); g.stroke(); } for (let j = 0; j < 14; j++) { const p = ((j + t * 0.6) % 14) / 14, y = hz + Math.pow(p, 2.2) * (PH - hz + 60); g.globalAlpha = p; g.beginPath(); g.moveTo(0, y); g.lineTo(PW, y); g.stroke(); } const hg = g.createLinearGradient(0, hz - 120, 0, hz + 40); hg.addColorStop(0, `rgba(${ac},0)`); hg.addColorStop(1, `rgba(${ac},0.18)`); g.globalAlpha = 1; g.fillStyle = hg; g.fillRect(0, hz - 120, PW, 160); g.restore(); }
  g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 3; i++) { const x = PW * (0.2 + 0.6 * hash(i + 11)) + Math.sin(t * 0.3 + i) * 60, y = PH * (0.2 + 0.5 * hash(i + 13)) + Math.cos(t * 0.25 + i) * 80; glow(g, x, y, 360 + i * 80, `rgba(${ac},A)`, 0.09); } g.restore();
  partsP(g, t, P.parts, o.np || 36, 0.8);
}
// ---------- extra icons ----------
const rectP = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
Object.assign(ICONS, {
  dollar: () => [pb([60, -60], [40, -95], [-70, -95], [-65, -40]).concat(pb([-65, -40], [-60, 0], [65, -10], [65, 45])).concat(pb([65, 45], [65, 100], [-50, 100], [-70, 60])), L2(0, -115, 0, 115)],
  pad: () => [pb([-70, -50], [-140, -50], [-150, 80], [-100, 85]).concat(pb([-100, 85], [-70, 88], [-55, 35], [0, 35])).concat(pb([0, 35], [55, 35], [70, 88], [100, 85])).concat(pb([100, 85], [150, 80], [140, -50], [70, -50])).concat([[-70, -50]]), L2(-90, 0, -50, 0), L2(-70, -20, -70, 20), pc(60, -10, 9, 0, PI2, 10), pc(90, 15, 9, 0, PI2, 10)],
  tower: () => [[[-60, 110], [-30, 40], [-22, -20], [-12, -70], [-4, -105], [0, -140], [4, -105], [12, -70], [22, -20], [30, 40], [60, 110]], L2(-90, 110, 90, 110), L2(-24, 20, 24, 20), L2(-16, -40, 16, -40)],
  code: () => [[[-50, -60], [-110, 0], [-50, 60]], [[50, -60], [110, 0], [50, 60]], L2(25, -85, -25, 85)],
  cam: () => [rectP(-100, -55, 50, 60), [[50, -20], [110, -55], [110, 60], [50, 25]], pc(-25, 3, 26, 0, PI2, 24), pc(-70, -80, 22, 0, PI2, 18), pc(10, -80, 22, 0, PI2, 18)],
  cal: () => [rectP(-95, -75, 95, 95), L2(-95, -30, 95, -30), L2(-50, -100, -50, -55), L2(50, -100, 50, -55), ...[-55, 0, 55].map(x => pc(x, 15, 8, 0, PI2, 8)), ...[-55, 0, 55].map(x => pc(x, 60, 8, 0, PI2, 8))],
  pin: () => [pc(0, -40, 60, Math.PI * 0.8, Math.PI * 2.2, 36).concat([[0, 100]]).concat([[-48, 0]]), pc(0, -40, 24, 0, PI2, 20)],
  car: () => [[[-120, 40], [-120, 0], [-80, -10], [-50, -55], [45, -55], [80, -10], [120, 0], [120, 40], [-120, 40]], pc(-65, 45, 24, 0, PI2, 20), pc(65, 45, 24, 0, PI2, 20), L2(-40, -45, -40, -10), L2(10, -50, 10, -10)],
  team: () => [pc(0, -55, 28, 0, PI2, 24), pb([-55, 60], [-55, 0], [-35, -18], [0, -20]).concat(pb([0, -20], [35, -18], [55, 0], [55, 60])), pc(-80, -30, 20, 0, PI2, 18), pc(80, -30, 20, 0, PI2, 18), pb([-115, 60], [-115, 20], [-100, 5], [-80, 5]), pb([115, 60], [115, 20], [100, 5], [80, 5])],
  mic: () => [pb([-30, -40], [-30, -110], [30, -110], [30, -40]).concat(pb([30, -40], [30, 10], [-30, 10], [-30, -40])), pb([-60, -30], [-60, 50], [60, 50], [60, -30]), L2(0, 40, 0, 95), L2(-40, 95, 40, 95)],
  star: () => { const o = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 45 : 105; o.push([Math.cos(a) * r, Math.sin(a) * r]); } return [o]; },
  chip: () => [rectP(-70, -70, 70, 70), rectP(-35, -35, 35, 35), ...[-45, -15, 15, 45].flatMap(v => [L2(v, -70, v, -100), L2(v, 70, v, 100), L2(-70, v, -100, v), L2(70, v, 100, v)])],
  chart: () => [L2(-100, 90, 110, 90), L2(-100, 90, -100, -100), rectP(-75, 20, -40, 90), rectP(-20, -20, 15, 90), rectP(35, -70, 70, 90), [[-80, -10], [-10, -50], [50, -100], [95, -110]]],
  film: () => [rectP(-100, -70, 100, 70), ...[-75, -35, 5, 45, 85].map(x => rectP(x - 10, -60, x + 5, -45)), ...[-75, -35, 5, 45, 85].map(x => rectP(x - 10, 45, x + 5, 60)), [[-25, -25], [35, 0], [-25, 25], [-25, -25]]],
  eye: () => [pb([-110, 0], [-60, -70], [60, -70], [110, 0]).concat(pb([110, 0], [60, 70], [-60, 70], [-110, 0])), pc(0, 0, 32, 0, PI2, 24)],
  check: () => [[[-70, 0], [-20, 50], [80, -60]]],
  bag: () => [pb([-50, -60], [-40, -110], [40, -110], [50, -60]), pb([-60, -60], [-110, 0], [-110, 100], [0, 100]).concat(pb([0, 100], [110, 100], [110, 0], [60, -60])).concat([[-60, -60]]), L2(0, -20, 0, 70), pb([25, -10], [10, -25], [-25, -15], [0, 20]).concat(pb([0, 20], [30, 40], [10, 70], [-25, 55]))],
});
// ---------- number / money helpers ----------
const BNd = s => String(s).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
function moneyCounter(g, x, y, size, v0, v1, k, pre = '$', post = '', col = CC.cash) {
  if (k <= 0) return; const lt = tAge('MC' + x + y + v1, k), u = easeOut(clamp(lt / 1.1)), v = lerp(v0, v1, u);
  const s = pre + (v1 >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(1)) + post;
  g.save(); g.font = `900 ${size}px "Anek Bangla", "Nirmala UI"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = clamp(lt * 4);
  g.shadowColor = col; g.shadowBlur = 40; g.lineWidth = size * 0.12; g.strokeStyle = 'rgba(0,0,0,0.8)'; g.lineJoin = 'round'; g.strokeText(s, x, y);
  const gr = g.createLinearGradient(0, y - size / 2, 0, y + size / 2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, col); g.fillStyle = gr; g.fillText(s, x, y); g.restore();
}
// banknote in screen space
function bill(g, x, y, s, rot, a = 1) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.globalAlpha = a; g.fillStyle = '#7ccf8c'; g.strokeStyle = '#1d5a2c'; g.lineWidth = 4; rr(g, -80, -38, 160, 76, 8); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(29,90,44,0.6)'; g.lineWidth = 3; rr(g, -68, -27, 136, 54, 6); g.stroke(); g.fillStyle = '#d9f5dd'; g.beginPath(); g.ellipse(0, 0, 22, 26, 0, 0, 7); g.fill(); g.fillStyle = '#1d5a2c'; g.font = 'bold 30px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', 0, 2); g.font = 'bold 16px Arial'; g.fillText('100', -52, -16); g.fillText('100', 52, 16); g.restore();
}
function moneyRain(g, t, n = 30, a = 1, speed = 1) { for (let i = 0; i < n; i++) { const sp = (260 + hash(i) * 340) * speed, x = hash(i + 1) * (PW + 200) - 100 + Math.sin(t * 1.3 + i) * 50, y = ((hash(i + 2) * (PH + 300) + t * sp) % (PH + 300)) - 150; bill(g, x, y, 0.55 + hash(i + 3) * 0.6, Math.sin(t * 2 + i * 1.7) * 0.9, a * (0.55 + 0.45 * hash(i + 4))); } }
function cashStack(g, x, y, s, n, k) { const m = Math.floor(n * clamp(k)); for (let i = 0; i < m; i++) { g.save(); g.translate(x + Math.sin(i * 2.3) * 3 * s, y - i * 9 * s); g.scale(s, s); g.fillStyle = i % 2 ? '#6fc27f' : '#7ccf8c'; g.strokeStyle = '#1d5a2c'; g.lineWidth = 2.5; rr(g, -90, -8, 180, 16, 4); g.fill(); g.stroke(); g.fillStyle = '#e9d27a'; g.fillRect(-14, -8, 28, 16); g.restore(); } }
// ---------- world-space scenes (1920x1080) ----------
function sunsetSky(g, t, o = {}) {
  const gr = g.createLinearGradient(0, 0, 0, 760); gr.addColorStop(0, o.top || '#1a0b3d'); gr.addColorStop(0.45, o.mid || '#7a1f7a'); gr.addColorStop(0.8, o.low || '#ff5e7e'); gr.addColorStop(1, o.hz || '#ffb36b'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // striped sun
  const sx = o.sx || 960, sy = o.sy || 620, sr = o.sr || 230; g.save(); g.beginPath(); g.arc(sx, sy, sr, 0, 7); g.clip(); const sg = g.createLinearGradient(0, sy - sr, 0, sy + sr); sg.addColorStop(0, '#fff3a8'); sg.addColorStop(1, '#ff4f8b'); g.fillStyle = sg; g.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  g.fillStyle = o.mid || '#7a1f7a'; for (let i = 0; i < 7; i++) { const yy = sy + 20 + i * 34 + ((t * 18) % 34), h = 4 + i * 2.6; g.fillRect(sx - sr, yy, sr * 2, h); } g.restore();
  g.save(); g.globalCompositeOperation = 'screen'; glow(g, sx, sy, sr * 2.6, 'rgba(255,120,160,A)', 0.35); g.restore();
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + 0.6 * hash(i) * (0.6 + 0.4 * Math.sin(t * 3 + i))})`; g.fillRect(hash(i + 1) * W, hash(i + 2) * 380, 2, 2); }
}
function skyline(g, t, y0, o = {}) {
  const pan = o.pan || 0; const cols = o.col || ['#2a0f3e', '#1a0828'];
  for (let layer = 0; layer < 2; layer++) { const par = layer ? 1 : 0.5; g.fillStyle = cols[layer]; for (let i = -2; i < 34; i++) { const bw = 70 + hash(i + layer * 50) * 80, x = ((i * 70 - pan * par) % 2400 + 2400) % 2400 - 240, h = (layer ? 150 : 230) + hash(i * 3 + layer) * (layer ? 260 : 360); g.fillRect(x, y0 - h, bw, h + 400);
    if (layer) { for (let wy = y0 - h + 18; wy < y0 - 10; wy += 26) for (let wx = x + 10; wx < x + bw - 12; wx += 20) { const on = hash(wx * 0.37 + wy * 0.11) > 0.55; if (on) { g.fillStyle = hash(wx + wy) > 0.5 ? 'rgba(255,220,140,0.85)' : 'rgba(120,230,255,0.8)'; g.fillRect(wx, wy, 9, 12); } } g.fillStyle = cols[layer]; }
  } }
}
function neonSign(g, x, y, s, txt, col, t) { g.save(); g.font = `900 ${s}px "Plus Jakarta Sans", Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; const fl = Math.sin(t * 13) > 0.92 ? 0.4 : 1; g.globalAlpha = fl; g.shadowColor = col; g.shadowBlur = 30; g.strokeStyle = col; g.lineWidth = 5; g.strokeText(txt, x, y); g.fillStyle = 'rgba(255,255,255,0.9)'; g.globalAlpha = fl * 0.6; g.fillText(txt, x, y); g.restore(); }
function sportsCar(g, x, y, s, col = '#ff3d9a', t = 0, dir = 1) {
  g.save(); g.translate(x, y); g.scale(s * dir, s);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(0, 8, 200, 18, 0, 0, 7); g.fill();
  const bg_ = g.createLinearGradient(0, -90, 0, 0); bg_.addColorStop(0, mixC(col, '#ffffff', 0.35)); bg_.addColorStop(1, mixC(col, '#000000', 0.35)); g.fillStyle = bg_; g.strokeStyle = '#140712'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(-190, -20); g.lineTo(-185, -48); g.lineTo(-90, -62); g.lineTo(-40, -98); g.lineTo(60, -98); g.lineTo(120, -62); g.lineTo(190, -52); g.lineTo(196, -20); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = 'rgba(120,220,255,0.75)'; g.beginPath(); g.moveTo(-28, -90); g.lineTo(55, -90); g.lineTo(100, -62); g.lineTo(-70, -62); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#fff6c0'; g.shadowColor = '#fff2a0'; g.shadowBlur = 25; rr(g, 168, -46, 24, 12, 4); g.fill(); g.fillStyle = '#ff2a4a'; g.shadowColor = '#ff2a4a'; rr(g, -192, -44, 16, 12, 4); g.fill(); g.shadowBlur = 0;
  for (const wx of [-115, 115]) { g.fillStyle = '#111'; g.beginPath(); g.arc(wx, -10, 34, 0, 7); g.fill(); g.strokeStyle = '#999'; g.lineWidth = 4; g.save(); g.translate(wx, -10); g.rotate(t * 18); for (let i = 0; i < 5; i++) { g.rotate(PI2 / 5); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 22); g.stroke(); } g.restore(); }
  g.restore();
}
function viceCity(g, t, o = {}) {
  sunsetSky(g, t, o); skyline(g, t, 820, { pan: (o.pan || 0) + t * 30 });
  // sea / road
  const rg = g.createLinearGradient(0, 820, 0, H); rg.addColorStop(0, '#2b0d35'); rg.addColorStop(1, '#0b0410'); g.fillStyle = rg; g.fillRect(0, 820, W, H - 820);
  g.save(); g.strokeStyle = 'rgba(255,61,154,0.8)'; g.shadowColor = '#ff3d9a'; g.shadowBlur = 16; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 900); g.lineTo(W, 900); g.stroke(); g.strokeStyle = 'rgba(255,240,200,0.7)'; g.shadowBlur = 0; g.lineWidth = 6; g.setLineDash([60, 50]); g.lineDashOffset = t * 600; g.beginPath(); g.moveTo(0, 990); g.lineTo(W, 990); g.stroke(); g.restore();
  for (let i = 0; i < 7; i++) { const x = ((i * 330 - t * 160 - (o.pan || 0)) % 2310 + 2310) % 2310 - 200; palm(g, x, 905, 300 + hash(i) * 120, '#12051c', t, i); }
  if (o.car !== false) sportsCar(g, o.carX || 960 + Math.sin(t * 0.7) * 60, 1035, o.carS || 1.1, o.carCol || '#ff3d9a', t, 1);
  if (o.sign) neonSign(g, o.sign[1] || 1500, o.sign[2] || 330, 70, o.sign[0], CC.pink, t);
}
// Burj-Khalifa-like supertall, generic stepped spire, rises with k
function supertall(g, x, y, h, k, t) {
  const hh = h * clamp(k); g.save(); g.beginPath(); g.rect(x - 300, y - hh, 600, hh + 4); g.clip();
  const tiers = [[1, 130], [0.82, 104], [0.64, 80], [0.47, 58], [0.32, 40], [0.2, 24], [0.1, 12]];
  tiers.forEach(([f, w], i) => { const top = y - h * f, gr = g.createLinearGradient(x - w, 0, x + w, 0); gr.addColorStop(0, '#5d7591'); gr.addColorStop(0.45, '#e7f1fb'); gr.addColorStop(1, '#40556e'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - w, y); g.lineTo(x - w * 0.82, top); g.lineTo(x + w * 0.82, top); g.lineTo(x + w, y); g.closePath(); g.fill(); g.strokeStyle = 'rgba(20,40,60,0.35)'; g.lineWidth = 2; for (let yy = top + 14; yy < y; yy += 18) { g.beginPath(); g.moveTo(x - w * 0.9, yy); g.lineTo(x + w * 0.9, yy); g.stroke(); } });
  g.strokeStyle = '#dfe9f3'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y - h * 0.1); g.lineTo(x, y - h * 1.12); g.stroke(); g.restore();
  if (k < 1 && k > 0) { const cy = y - hh; g.save(); g.strokeStyle = '#ffcf5a'; g.lineWidth = 5; g.beginPath(); g.moveTo(x + 20, cy); g.lineTo(x + 20, cy - 120); g.lineTo(x + 240, cy - 120); g.moveTo(x - 60, cy - 120); g.lineTo(x + 20, cy - 120); g.stroke(); g.beginPath(); g.moveTo(x + 200, cy - 120); g.lineTo(x + 200, cy - 60 + Math.sin(t * 2) * 10); g.stroke(); g.fillStyle = '#ffcf5a'; g.fillRect(x + 185, cy - 60 + Math.sin(t * 2) * 10, 30, 24); g.restore(); }
  g.save(); g.globalCompositeOperation = 'screen'; glow(g, x, y - h * 1.12, 40, 'rgba(255,80,80,A)', 0.6 + 0.4 * Math.sin(t * 5)); g.restore();
}
function dubai(g, t, k, o = {}) {
  sunsetSky(g, t, { top: '#0e1f3d', mid: '#3a4f8a', low: '#f09a6a', hz: '#ffd39a', sx: 1500, sy: 700, sr: 150 });
  skyline(g, t, 900, { pan: 200, col: ['#26305a', '#141a33'] });
  const dg = g.createLinearGradient(0, 900, 0, H); dg.addColorStop(0, '#c99a6a'); dg.addColorStop(1, '#7a5236'); g.fillStyle = dg; g.fillRect(0, 900, W, H);
  supertall(g, o.x || 960, 905, o.h || 820, k, t);
}
function monitor(g, x, y, w, h, t, seed, col = '#3de8ff') {
  g.fillStyle = '#0b0f18'; rr(g, x - 6, y - 6, w + 12, h + 12, 8); g.fill(); const sg = g.createLinearGradient(x, y, x, y + h); sg.addColorStop(0, '#0e2a3c'); sg.addColorStop(1, '#061520'); g.fillStyle = sg; g.fillRect(x, y, w, h);
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); const sc = (t * 40 + seed * 50) % 18; for (let i = 0; i < h / 12 + 2; i++) { const ln = 0.2 + 0.7 * hash(i + seed * 13 + Math.floor((t * 40 + seed * 50) / 18)); g.fillStyle = i % 3 ? col : '#ff3d9a'; g.globalAlpha = 0.75; g.fillRect(x + 8 + (i % 4) * 8, y + 6 + i * 12 - sc, (w - 30) * ln, 5); } g.restore();
  g.fillStyle = '#222a36'; g.fillRect(x + w / 2 - 8, y + h + 6, 16, 22); g.fillRect(x + w / 2 - 40, y + h + 26, 80, 8);
  g.save(); g.globalCompositeOperation = 'screen'; glow(g, x + w / 2, y + h / 2, w, 'rgba(61,232,255,A)', 0.12); g.restore();
}
function coder(g, x, y, s, t, seed, col = '#ff3d9a') { // seated person seen from behind-ish
  g.save(); g.translate(x, y); g.scale(s, s); const bob = Math.sin(t * 3 + seed) * 2;
  g.fillStyle = '#1b1426'; rr(g, -48, -40, 96, 110, 26); g.fill();
  g.fillStyle = mixC(col, '#1b1426', 0.55); rr(g, -44, -36 + bob, 88, 90, 30); g.fill();
  g.fillStyle = '#2a1b14'; g.beginPath(); g.arc(0, -64 + bob, 30, 0, 7); g.fill(); g.fillStyle = '#16100c'; g.beginPath(); g.arc(0, -72 + bob, 28, Math.PI, PI2); g.fill();
  const ty = Math.sin(t * 22 + seed) * 4; g.strokeStyle = mixC(col, '#1b1426', 0.4); g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(-36, -20); g.lineTo(-30, -70 + ty); g.moveTo(36, -20); g.lineTo(30, -70 - ty); g.stroke();
  g.restore();
}
function devStudio(g, t, o = {}) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0a0f1e'); gr.addColorStop(1, '#05070d'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // back wall neon strip + logo-less banner
  g.save(); g.strokeStyle = '#ff3d9a'; g.shadowColor = '#ff3d9a'; g.shadowBlur = 24; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 210); g.lineTo(W, 210); g.stroke(); g.restore();
  const rows = o.rows || 3, pan = (o.pan || 0) + t * 25;
  for (let r = 0; r < rows; r++) { const sc = 0.55 + r * 0.25, yy = 420 + r * 220; for (let i = -1; i < 9; i++) { const x = ((i * 300 * sc - pan * sc) % (W + 300) + W + 300) % (W + 300) - 150; monitor(g, x - 70 * sc, yy - 150 * sc, 140 * sc, 86 * sc, t, i + r * 10); g.fillStyle = '#1a1f2c'; g.fillRect(x - 130 * sc, yy - 40 * sc, 260 * sc, 18 * sc); coder(g, x, yy + 70 * sc, sc, t, i + r * 7, ['#ff3d9a', '#3de8ff', '#ffcf5a', '#9b6bff'][(i + r) & 3]); } }
  const vg = g.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 1100); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
}
// motion-capture stage: actor in marker suit + cameras + wireframe twin on a screen
function mocapStage(g, t, o = {}) {
  g.fillStyle = '#0a0a12'; g.fillRect(0, 0, W, H); const fy = 860;
  g.save(); g.strokeStyle = 'rgba(61,232,255,0.35)'; g.lineWidth = 2; for (let i = -20; i <= 20; i++) { g.beginPath(); g.moveTo(W / 2 + i * 40, fy); g.lineTo(W / 2 + i * 160, H); g.stroke(); } for (let j = 0; j < 8; j++) { const y = fy + Math.pow(j / 8, 1.8) * (H - fy); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } g.restore();
  // cameras on truss
  for (let i = 0; i < 6; i++) { const x = 160 + i * 320; g.fillStyle = '#20232e'; g.fillRect(x - 30, 120, 60, 40); g.fillStyle = Math.sin(t * 6 + i) > 0 ? '#ff2a4a' : '#5a1020'; g.beginPath(); g.arc(x + 20, 130, 6, 0, 7); g.fill(); g.save(); g.globalAlpha = 0.08; g.fillStyle = '#3de8ff'; g.beginPath(); g.moveTo(x, 160); g.lineTo(780, fy); g.lineTo(1140, fy); g.closePath(); g.fill(); g.restore(); }
  g.fillStyle = '#2b2f3c'; g.fillRect(0, 100, W, 20);
  // actor (stick body in black suit with markers) doing a punch/run loop
  const ph = t * 1.6, ax = o.ax || 820; const J = poseMocap(ph);
  const body = (sx, sy, sc, col, wire) => { g.save(); g.translate(sx, sy); g.scale(sc, sc); g.lineCap = 'round'; g.lineJoin = 'round'; const seg_ = (a, b, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(J[a][0], J[a][1]); g.lineTo(J[b][0], J[b][1]); g.stroke(); };
    g.strokeStyle = col; const w0 = wire ? 4 : 34; [['hip', 'neck', w0 * 1.3], ['neck', 'elL', w0], ['elL', 'haL', w0 * 0.8], ['neck', 'elR', w0], ['elR', 'haR', w0 * 0.8], ['hip', 'knL', w0 * 1.1], ['knL', 'ftL', w0 * 0.9], ['hip', 'knR', w0 * 1.1], ['knR', 'ftR', w0 * 0.9]].forEach(s => seg_(...s));
    g.fillStyle = col; g.beginPath(); g.arc(J.head[0], J.head[1], wire ? 26 : 34, 0, 7); wire ? g.stroke() : g.fill();
    for (const k in J) { g.fillStyle = wire ? '#3de8ff' : '#e9ff7a'; g.shadowColor = g.fillStyle; g.shadowBlur = 14; g.beginPath(); g.arc(J[k][0], J[k][1], wire ? 7 : 8, 0, 7); g.fill(); } g.shadowBlur = 0; g.restore(); };
  body(ax, fy - 10, 1.25, '#15161c', false);
  // screen with wireframe twin
  const sx = o.sx || 1330, sy = 300, sw_ = 470, sh = 380; g.fillStyle = '#05121c'; rr(g, sx, sy, sw_, sh, 14); g.fill(); g.strokeStyle = '#3de8ff'; g.lineWidth = 4; g.shadowColor = '#3de8ff'; g.shadowBlur = 20; rr(g, sx, sy, sw_, sh, 14); g.stroke(); g.shadowBlur = 0;
  g.save(); g.beginPath(); g.rect(sx, sy, sw_, sh); g.clip(); body(sx + sw_ / 2, sy + sh - 20, 0.7, '#3de8ff', true); g.restore();
  g.fillStyle = '#3de8ff'; g.font = 'bold 26px Consolas, monospace'; g.fillText('● CAPTURE  ' + Math.floor(t * 120 % 1000).toString().padStart(3, '0'), sx + 20, sy + 36);
}
function poseMocap(ph) {
  const s = Math.sin(ph * Math.PI * 2), c = Math.cos(ph * Math.PI * 2);
  const hip = [0, -230], neck = [6 * s, -420], head = [8 * s, -480];
  return { hip, neck, head, elL: [-70, -350 + 30 * s], haL: [-60 + 90 * Math.max(0, s), -420 + 40 * s], elR: [70, -350 - 30 * s], haR: [60 + 120 * Math.max(0, -s), -430 - 40 * s], knL: [-40 + 30 * s, -120], ftL: [-50 + 50 * s, 0], knR: [40 - 30 * s, -120 - 10 * c], ftR: [50 - 50 * s, 0] };
}
// voice recording booth
function voiceBooth(g, t, o = {}) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1d0d22'); gr.addColorStop(1, '#0b050e'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // foam wall
  for (let y = 0; y < 700; y += 60) for (let x = 0; x < W; x += 60) { g.fillStyle = ((x + y) / 60) % 2 ? '#24132a' : '#1b0e20'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 60, y); g.lineTo(x + 30, y + 60); g.closePath(); g.fill(); }
  // mic stand + pop filter
  const mx = 1080, my = 470; g.strokeStyle = '#3a3a46'; g.lineWidth = 12; g.beginPath(); g.moveTo(mx + 160, H); g.lineTo(mx + 160, my + 60); g.lineTo(mx + 30, my + 20); g.stroke();
  g.fillStyle = '#c9ccd6'; rr(g, mx - 40, my - 120, 80, 170, 40); g.fill(); g.strokeStyle = '#6b6f7c'; g.lineWidth = 3; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(mx - 36, my - 100 + i * 14); g.lineTo(mx + 36, my - 100 + i * 14); g.stroke(); }
  g.save(); g.globalAlpha = 0.5; g.strokeStyle = '#555'; g.lineWidth = 6; g.beginPath(); g.arc(mx - 130, my - 40, 90, 0, 7); g.stroke(); g.fillStyle = 'rgba(40,40,50,0.35)'; g.fill(); g.restore();
  // actor silhouette + headphones talking
  const ax = 640, ay = 1080; g.fillStyle = '#0d0710'; g.beginPath(); g.ellipse(ax, ay, 260, 300, 0, Math.PI, PI2); g.fill(); g.beginPath(); g.arc(ax + 30, ay - 420, 120, 0, 7); g.fill(); g.strokeStyle = '#ff3d9a'; g.lineWidth = 18; g.beginPath(); g.arc(ax + 30, ay - 430, 135, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); g.fillStyle = '#ff3d9a'; rr(g, ax - 115, ay - 470, 40, 80, 14); g.fill(); rr(g, ax + 135, ay - 470, 40, 80, 14); g.fill();
  const jaw = Math.abs(Math.sin(t * 11)) * 14; g.fillStyle = '#0d0710'; g.beginPath(); g.ellipse(ax + 150, ay - 380 + jaw / 2, 30, 20 + jaw / 2, 0, 0, 7); g.fill();
  // waveform
  g.save(); g.strokeStyle = '#ffcf5a'; g.shadowColor = '#ffcf5a'; g.shadowBlur = 16; g.lineWidth = 6; g.beginPath(); for (let x = 1260; x < 1860; x += 8) { const a = (Math.sin(x * 0.05 + t * 9) * 0.6 + Math.sin(x * 0.013 - t * 4) * 0.4) * 90 * (0.4 + 0.6 * Math.abs(Math.sin(t * 2.3))); x === 1260 ? g.moveTo(x, 300 + a) : g.lineTo(x, 300 + a); } g.stroke(); g.restore();
  g.fillStyle = '#ff2a4a'; g.beginPath(); g.arc(1290, 160, 14 * (0.7 + 0.3 * Math.sin(t * 6)), 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 34px Consolas, monospace'; g.fillText('REC', 1320, 172);
}
// stylized fictional open-world map (island state)
const ISL = [[300, 260], [520, 180], [820, 200], [1060, 150], [1320, 230], [1560, 210], [1700, 380], [1640, 560], [1720, 760], [1520, 900], [1260, 860], [1060, 960], [760, 900], [520, 940], [330, 800], [260, 600], [340, 430]];
function openMap(g, t, o = {}) {
  g.fillStyle = '#0a2a44'; g.fillRect(0, 0, W, H); g.save(); g.strokeStyle = 'rgba(61,232,255,0.08)'; g.lineWidth = 2; for (let x = 0; x < W; x += 80) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 80) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } g.restore();
  const path = () => { g.beginPath(); ISL.forEach(([x, y], i) => { const n = ISL[(i + 1) % ISL.length]; const mx = (x + n[0]) / 2, my = (y + n[1]) / 2; i ? g.quadraticCurveTo(x, y, mx, my) : g.moveTo(mx, my); }); g.closePath(); };
  g.save(); g.shadowColor = '#3de8ff'; g.shadowBlur = 50; g.fillStyle = '#e7d6a6'; path(); g.fill(); g.restore(); g.save(); path(); g.clip();
  const lg = g.createLinearGradient(0, 200, 0, 950); lg.addColorStop(0, '#5f8f4e'); lg.addColorStop(1, '#3f6b3a'); g.fillStyle = lg; g.fillRect(0, 0, W, H);
  g.fillStyle = '#c9d0d8'; for (let i = 0; i < 80; i++) { const x = 1100 + hash(i) * 500, y = 520 + hash(i + 1) * 320; g.fillRect(x, y, 14 + hash(i + 2) * 20, 14 + hash(i + 3) * 20); }
  g.fillStyle = '#a9b3bf'; for (let i = 0; i < 50; i++) { const x = 420 + hash(i + 5) * 300, y = 330 + hash(i + 6) * 220; g.fillRect(x, y, 12 + hash(i + 7) * 14, 12 + hash(i + 8) * 14); }
  g.strokeStyle = '#f3e7c4'; g.lineWidth = 9; g.lineCap = 'round'; [[[350, 700], [700, 640], [1000, 600], [1300, 680], [1600, 620]], [[600, 260], [640, 500], [700, 640], [760, 860]], [[1000, 600], [1100, 360], [1300, 260]], [[1300, 680], [1380, 860]]].forEach(r => { g.beginPath(); r.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); });
  g.restore(); g.save(); g.strokeStyle = '#fff6da'; g.lineWidth = 4; path(); g.stroke(); g.restore();
  if (o.route) { const k = o.route; glowRoute(g, (p => p), [[420, 380], [640, 500], [1000, 600], [1300, 680], [1520, 820]], k, '#ff3d9a', 10); }
}
// ---------- the user's character (full body rig2) inside frames ----------
let CHC, CHG;
function charFull(g, x, y, s, act, lt, o = {}) {
  if (!CHC) { CHC = mk(W, H); CHG = CHC.getContext('2d'); }
  const pose = Object.assign({ t: NOW, mouth: o.talk === false ? 0 : mouthAt(NOW) }, ACT[act](lt, o), o.pose || {}); if (o.face) pose.face = o.face;
  g.save(); g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(x, y + 4, 170 * s, 26 * s, 0, 0, 7); g.fill(); g.restore();
  if (pose.view === 'B') drawCharB(g, x, y, s, pose); else if (pose.view === 'S') drawCharS(g, x, y, s, Object.assign({ flip: o.flip }, pose)); else drawCharF(g, x, y, s, pose);
}
// little glowing "label" pill used on maps / scenes (screen space)
function pill(g, s, x, y, k, col = CC.pink, size = 40) { if (k <= 0) return; const lt = tAge('PL' + s + x, k), e = easeOutBack(clamp(lt / 0.4)); g.save(); g.translate(x, y); g.scale(e, e); g.font = `bold ${size}px "Nirmala UI"`; const w = g.measureText(s).width + size * 1.2, h = size * 1.6; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 24; rr(g, -w / 2, -h / 2, w, h, h / 2); g.fill(); g.shadowBlur = 0; g.fillStyle = '#0b0410'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 0, 3); g.restore(); }
// vs / comparison bar
function hbar(g, x, y, w, h, v, col, k, label, val) { if (k <= 0) return; const lt = tAge('HB' + label + y, k), u = easeOut(clamp(lt / 0.9)); g.save(); g.globalAlpha = clamp(lt * 4); glass(g, x, y, w, h, 0.5, 'rgba(255,255,255,0.18)', h / 2); g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 24; rr(g, x + 6, y + 6, Math.max(h - 12, (w - 12) * v * u), h - 12, (h - 12) / 2); g.fill(); g.shadowBlur = 0; g.font = 'bold 44px "Nirmala UI"'; g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(label, x + 10, y - 40); g.textAlign = 'right'; g.fillStyle = col; g.fillText(val, x + w - 10, y - 40); g.restore(); }
