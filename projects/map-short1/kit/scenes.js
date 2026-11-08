// ===== story characters (chibi, ink outline) + illustrated story cards =====
const K_INK = '#1a1110';
function inkF(g, fill, lw = 5) { g.fillStyle = fill; g.fill(); g.strokeStyle = K_INK; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(); }
function limb(g, pts, w, col) { g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = K_INK; g.lineWidth = w + 9; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); }
const ARM = (sx, sy, a1, a2, L1 = 52, L2 = 46) => { const ex = sx + Math.sin(a1) * L1, ey = sy + Math.cos(a1) * L1; return [[sx, sy], [ex, ey], [ex + Math.sin(a1 + a2) * L2, ey + Math.cos(a1 + a2) * L2]]; };
function flagPaint(g, kind, x, y, w, h, t) {
  g.save(); g.translate(x, y); const wave = (u) => Math.sin(t * 6 + u * 5) * h * 0.08 * u;
  const strip = (y0, y1, col, x0 = 0, x1 = w) => { g.beginPath(); for (let u = 0; u <= 1.001; u += 0.1) g.lineTo(x0 + (x1 - x0) * u, y0 + wave((x0 + (x1 - x0) * u) / w)); for (let u = 1; u >= -0.001; u -= 0.1) g.lineTo(x0 + (x1 - x0) * u, y1 + wave((x0 + (x1 - x0) * u) / w)); g.closePath(); g.fillStyle = col; g.fill(); };
  if (kind === 'chile') { strip(h / 2, h, '#d52b1e'); strip(0, h / 2, '#ffffff', w / 3, w); strip(0, h / 2, '#0039a6', 0, w / 3); g.fillStyle = '#fff'; star(g, w / 6, h / 4 + wave(1 / 6), h * 0.13); }
  else if (kind === 'bolivia') { strip(0, h / 3, '#d52b1e'); strip(h / 3, 2 * h / 3, '#f9e300'); strip(2 * h / 3, h, '#007934'); }
  else if (kind === 'peru') { strip(0, h, '#d91023', 0, w / 3); strip(0, h, '#ffffff', w / 3, 2 * w / 3); strip(0, h, '#d91023', 2 * w / 3, w); }
  else if (kind === 'spain') { strip(0, h / 4, '#aa151b'); strip(h / 4, 3 * h / 4, '#f1bf00'); strip(3 * h / 4, h, '#aa151b'); g.strokeStyle = '#aa151b'; g.lineWidth = 5; g.beginPath(); g.moveTo(w * 0.15, h * 0.3); g.lineTo(w * 0.45, h * 0.7); g.moveTo(w * 0.45, h * 0.3); g.lineTo(w * 0.15, h * 0.7); g.stroke(); }
  g.strokeStyle = K_INK; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); for (let u = 0; u <= 1.001; u += 0.1) g.lineTo(w * u, wave(u)); g.lineTo(w, h + wave(1)); for (let u = 1; u >= -0.001; u -= 0.1) g.lineTo(w * u, h + wave(u)); g.closePath(); g.stroke(); g.restore();
}
function star(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
// o: {skin, coat, pants, hat, hair, pose, prop, flag, face, armor, flip, seed, ...}
function chib(g, x, y, s, t, o = {}) {
  const ph = t * (o.speed || 1) + (o.seed || 0), pose = o.pose || 'stand', run = pose === 'run', walk = pose === 'walk' || run;
  const sw = walk ? Math.sin(ph * (run ? 11 : 7)) : 0, bob = walk ? -Math.abs(Math.cos(ph * (run ? 11 : 7))) * (run ? 12 : 6) : Math.sin(ph * 2.2) * 2;
  g.save(); g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(0, 4, 60, 12, 0, 0, 7); g.fill();
  g.translate(0, bob); if (run) g.rotate(0.12);
  const coat = o.coat || '#8a5a36', pants = o.pants || '#3c2c22', skin = o.skin || '#c98a5e';
  for (const [hx, a] of [[-16, -sw * 0.55], [16, sw * 0.55]]) { const kx = hx + Math.sin(a) * 50, ky = -62 + Math.cos(a) * 30; limb(g, [[hx, -112], [kx, ky + 10], [kx + Math.sin(a * 0.4) * 10, -8]], 24, pants); g.beginPath(); g.ellipse(kx + Math.sin(a * 0.4) * 10 + 8, -6, 20, 11, 0, 0, 7); inkF(g, '#2b1d14', 4); }
  let aL = [0.25 + sw * 0.6, 0.3], aR = [-0.25 - sw * 0.6, -0.3];
  if (pose === 'point') aR = [-2.0, 0.1]; if (pose === 'cheer') { aL = [2.7 + Math.sin(ph * 8) * 0.15, 0.2]; aR = [-2.7 - Math.sin(ph * 8) * 0.15, -0.2]; } if (pose === 'sad') { aL = [0.1, 0.1]; aR = [-0.1, -0.1]; } if (pose === 'aim') { aR = [-1.55, 0.05]; aL = [1.2, -1.1]; } if (pose === 'look') { aR = [-2.5, -1.9]; aL = [2.4, 1.9]; }
  if (o.prop === 'flag' || o.prop === 'spear' || o.prop === 'sword') aR = pose === 'run' ? [-2.4, -0.2] : [-1.2, -0.9];
  limb(g, ARM(22, -198, aR[0], aR[1]), 20, coat); const rh = ARM(22, -198, aR[0], aR[1])[2];
  g.beginPath(); g.moveTo(-40, -205); g.quadraticCurveTo(-46, -150, -36, -105); g.lineTo(36, -105); g.quadraticCurveTo(46, -150, 40, -205); g.quadraticCurveTo(0, -222, -40, -205); inkF(g, coat, 5);
  if (o.armor) { g.beginPath(); g.moveTo(-32, -200); g.quadraticCurveTo(0, -150, 32, -200); g.lineTo(28, -130); g.quadraticCurveTo(0, -112, -28, -130); g.closePath(); inkF(g, '#c9ced6', 4); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(-14, -190, 8, 40); }
  if (o.belt !== false) { g.fillStyle = '#2b1d14'; g.fillRect(-38, -122, 76, 10); }
  if (o.poncho) { g.beginPath(); g.moveTo(-50, -200); g.lineTo(50, -200); g.lineTo(44, -120); g.lineTo(-44, -120); g.closePath(); inkF(g, o.poncho[0], 4); g.fillStyle = o.poncho[1]; g.fillRect(-46, -170, 92, 12); g.fillStyle = o.poncho[2]; g.fillRect(-45, -150, 90, 10); }
  if (o.buttons) { g.fillStyle = '#ffd34a'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(0, -195 + k * 20, 4, 0, 7); g.fill(); } }
  const hy = -262, hr = 60; g.save(); g.translate(0, hy); g.rotate(Math.sin(ph * 1.7) * 0.04 + (pose === 'sad' ? 0.15 : 0) + (pose === 'look' ? -0.1 : 0));
  if (o.hat === 'feather' || o.hat === 'hair' || o.hair) { g.beginPath(); g.ellipse(0, 8, hr + 6, hr + 14, 0, Math.PI * 0.95, Math.PI * 2.05); inkF(g, o.hair || '#1b1210', 5); }
  g.beginPath(); g.arc(0, 0, hr, 0, 7); inkF(g, skin, 5);
  g.fillStyle = 'rgba(255,120,100,0.25)'; g.beginPath(); g.arc(-34, 18, 10, 0, 7); g.arc(34, 18, 10, 0, 7); g.fill();
  const face = o.face || 'happy', bl = ((ph * 0.9) % 4) < 0.1;
  for (const ex of [-20, 20]) { if (bl) { g.strokeStyle = K_INK; g.lineWidth = 4; g.beginPath(); g.moveTo(ex - 9, 0); g.lineTo(ex + 9, 0); g.stroke(); continue; } g.beginPath(); g.ellipse(ex, -2, 11, face === 'shock' ? 15 : 13, 0, 0, 7); inkF(g, '#fff', 3.5); g.fillStyle = K_INK; g.beginPath(); g.arc(ex + (pose === 'look' ? 4 : 2), 0, 6, 0, 7); g.fill(); }
  g.strokeStyle = K_INK; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath();
  if (face === 'angry') { g.moveTo(-32, -22); g.lineTo(-10, -14); g.moveTo(32, -22); g.lineTo(10, -14); } else if (face === 'sad') { g.moveTo(-30, -14); g.lineTo(-10, -22); g.moveTo(30, -14); g.lineTo(10, -22); } else { g.moveTo(-30, -20); g.quadraticCurveTo(-20, -26, -10, -20); g.moveTo(30, -20); g.quadraticCurveTo(20, -26, 10, -20); } g.stroke();
  g.beginPath(); if (face === 'sad') { g.arc(0, 36, 13, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); } else if (face === 'shock' || face === 'angry') { g.ellipse(0, 30, 10, face === 'shock' ? 13 : 7, 0, 0, 7); inkF(g, '#5a1a1a', 4); } else { g.arc(0, 22, 15, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
  if (o.mustache) { g.fillStyle = '#2a1a12'; g.beginPath(); g.ellipse(-10, 14, 12, 5, 0.2, 0, 7); g.ellipse(10, 14, 12, 5, -0.2, 0, 7); g.fill(); }
  if (o.hat === 'morion') { g.beginPath(); g.ellipse(0, -36, 90, 18, 0, 0, 7); inkF(g, '#c9ced6', 4); g.beginPath(); g.arc(0, -40, 50, Math.PI, 0); inkF(g, '#b8bec8', 4); g.beginPath(); g.moveTo(-36, -60); g.quadraticCurveTo(0, -122, 36, -60); inkF(g, '#d8dde4', 4); g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(-28, -70, 10, 22); if (o.plume) { g.fillStyle = '#c0392b'; g.beginPath(); g.ellipse(14, -110, 10, 26, 0.5, 0, 7); g.fill(); } }
  else if (o.hat === 'feather') { g.fillStyle = '#c0392b'; g.fillRect(-58, -34, 116, 14); g.strokeStyle = K_INK; g.lineWidth = 3; g.strokeRect(-58, -34, 116, 14); for (const [fx, fa, fc] of [[-14, -0.3, '#f4d03f'], [6, 0, '#27ae60'], [24, 0.3, '#2e86c1']]) { g.save(); g.translate(fx, -36); g.rotate(fa + Math.sin(ph * 3 + fx) * 0.08); g.beginPath(); g.ellipse(0, -30, 9, 32, 0, 0, 7); inkF(g, fc, 3); g.restore(); } }
  else if (o.hat === 'kepi') { g.beginPath(); g.moveTo(-50, -34); g.lineTo(-44, -88); g.lineTo(44, -88); g.lineTo(50, -34); g.closePath(); inkF(g, o.hatCol || '#1f3a6e', 4); g.beginPath(); g.ellipse(20, -32, 44, 9, 0, 0, Math.PI); inkF(g, '#111', 3); g.fillStyle = '#d52b1e'; g.fillRect(-48, -48, 96, 8); }
  else if (o.hat === 'bowler') { g.beginPath(); g.ellipse(0, -40, 70, 14, 0, 0, 7); inkF(g, '#2b2b2b', 4); g.beginPath(); g.arc(0, -44, 40, Math.PI, 0); inkF(g, '#333', 4); g.fillStyle = '#c0392b'; g.fillRect(-40, -52, 80, 8); }
  if (o.sweat) { g.fillStyle = '#9fd8ff'; g.beginPath(); g.ellipse(52, -22 + (ph * 40) % 30, 7, 11, 0, 0, 7); g.fill(); }
  g.restore();
  const lh = ARM(-22, -198, aL[0], aL[1])[2];
  if (o.prop === 'spear') { g.save(); g.translate(rh[0], rh[1]); g.rotate(-0.15); limb(g, [[0, 130], [0, -190]], 7, '#8a5a2b'); g.beginPath(); g.moveTo(-10, -186); g.lineTo(0, -230); g.lineTo(10, -186); g.closePath(); inkF(g, '#d8dde4', 3); g.restore(); }
  if (o.prop === 'sword') { g.save(); g.translate(rh[0], rh[1]); g.rotate(-0.4 + Math.sin(ph * 6) * 0.2); limb(g, [[0, 10], [0, -130]], 9, '#e4e8ee'); g.fillStyle = '#c9a43a'; g.fillRect(-18, 4, 36, 9); g.restore(); }
  if (o.prop === 'flag') { g.save(); g.translate(rh[0], rh[1]); limb(g, [[0, 120], [0, -230]], 7, '#6b4a2b'); flagPaint(g, o.flag || 'chile', 2, -228, 150, 96, t + (o.seed || 0)); g.restore(); }
  if (o.prop === 'musket') { g.save(); g.translate(rh[0], rh[1]); g.rotate(pose === 'aim' ? -1.57 : -0.5); limb(g, [[0, 40], [0, -120]], 9, '#5a3a22'); limb(g, [[0, -60], [0, -150]], 5, '#555'); g.restore(); if (pose === 'aim' && Math.sin(ph * 2.3) > 0.9) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, rh[0] + 150, rh[1] + 4, 40, 'rgba(255,200,80,A)', 0.9); g.restore(); } }
  if (o.prop === 'telescope') { g.save(); g.translate(lh[0], lh[1]); g.rotate(-1.75); limb(g, [[0, 0], [0, 90]], 18, '#b07a2a'); limb(g, [[0, 70], [0, 130]], 13, '#7a5a2a'); g.restore(); }
  limb(g, ARM(-22, -198, aL[0], aL[1]), 20, coat);
  for (const [hx, hy2] of [lh, rh]) { g.beginPath(); g.arc(hx, hy2, 13, 0, 7); inkF(g, skin, 4); }
  g.restore();
}
function skyGrad(c, w, h, top, bot) { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bot); c.fillStyle = gr; c.fillRect(0, 0, w, h); }
function hills(c, w, y0, amp, f, seed, col, pan = 0) { c.fillStyle = col; c.beginPath(); c.moveTo(-20, 2000); for (let x = -20; x <= w + 20; x += 10) c.lineTo(x, y0 - amp * (0.5 + 0.5 * Math.sin(x * f + seed + pan)) - amp * 0.3 * Math.sin(x * f * 2.7 + seed * 2)); c.lineTo(w + 20, 2000); c.fill(); }
function peaks(c, w, base, hgt, n, seed, col, snow, pan = 0) { for (let i = -1; i <= n; i++) { const x = (i + 0.5) * w / n + (hash(i + seed) - 0.5) * 80 + pan, ph = hgt * (0.7 + hash(i * 3 + seed) * 0.5), pw = w / n * 0.9; c.beginPath(); c.moveTo(x - pw, base); c.lineTo(x - pw * 0.15, base - ph * 0.85); c.lineTo(x, base - ph); c.lineTo(x + pw * 0.2, base - ph * 0.8); c.lineTo(x + pw, base); c.closePath(); inkF(c, col, 4); if (snow) { c.beginPath(); c.moveTo(x - pw * 0.32, base - ph * 0.68); c.lineTo(x - pw * 0.15, base - ph * 0.85); c.lineTo(x, base - ph); c.lineTo(x + pw * 0.2, base - ph * 0.8); c.lineTo(x + pw * 0.36, base - ph * 0.62); c.lineTo(x + pw * 0.12, base - ph * 0.7); c.lineTo(x - pw * 0.05, base - ph * 0.6); c.lineTo(x - pw * 0.18, base - ph * 0.7); c.closePath(); inkF(c, '#f6fbff', 3); } } }
function sea(c, w, y0, h, t, col = '#2a8ab0') { const gr = c.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, col); gr.addColorStop(1, '#0d4a6e'); c.fillStyle = gr; c.fillRect(0, y0, w, h); c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 3; for (let j = 0; j < 7; j++) { const yy = y0 + 14 + j * h / 7; c.beginPath(); for (let x = 0; x <= w; x += 16) { const v = yy + Math.sin(x * 0.03 + t * 2 + j) * 5; x ? c.lineTo(x, v) : c.moveTo(x, v); } c.stroke(); } }
function palmT(c, x, y, h, t, col = '#2e6b3a') { c.save(); c.strokeStyle = K_INK; c.lineWidth = 22; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 20, y - h * 0.5, x + 10, y - h); c.stroke(); c.strokeStyle = '#8a5a2b'; c.lineWidth = 14; c.stroke(); for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.55 + Math.sin(t * 1.5 + i) * 0.05; c.beginPath(); c.moveTo(x + 10, y - h); c.quadraticCurveTo(x + 10 + Math.cos(a) * 80, y - h + Math.sin(a) * 60 - 30, x + 10 + Math.cos(a) * 150, y - h + Math.sin(a) * 40 + 40); c.lineWidth = 26; c.strokeStyle = K_INK; c.stroke(); c.lineWidth = 18; c.strokeStyle = col; c.stroke(); } c.restore(); }
function smoke(c, x, y, t, k = 1, n = 8) { for (let i = 0; i < n; i++) { const p = (t * 0.6 + i / n) % 1, r = 20 + p * 70; c.fillStyle = `rgba(230,225,215,${0.55 * (1 - p) * k})`; c.beginPath(); c.arc(x + Math.sin(i * 2.1) * 30 * p, y - p * 160, r, 0, 7); c.fill(); } }
function boomFx(c, x, y, t, t0) { const p = clamp((t - t0) / 0.6); if (p <= 0 || p >= 1) return; c.save(); c.globalCompositeOperation = 'lighter'; glow(c, x, y, 180 * p + 40, 'rgba(255,170,60,A)', 0.9 * (1 - p)); c.restore(); c.fillStyle = `rgba(255,230,150,${1 - p})`; star(c, x, y, 70 * (0.5 + p)); }
function llama(c, x, y, s, t) { c.save(); c.translate(x, y); c.scale(s, s); for (const lx of [-30, -12, 18, 36]) limb(c, [[lx, -70], [lx + Math.sin(t * 3 + lx) * 3, 0]], 10, '#f3e6d0'); c.beginPath(); c.ellipse(0, -90, 58, 32, 0, 0, 7); inkF(c, '#f3e6d0', 4); c.beginPath(); c.moveTo(36, -110); c.lineTo(44, -190); c.lineTo(66, -190); c.lineTo(62, -100); c.closePath(); inkF(c, '#f3e6d0', 4); c.beginPath(); c.ellipse(62, -196, 22, 14, 0.2, 0, 7); inkF(c, '#f3e6d0', 4); c.fillStyle = K_INK; c.beginPath(); c.arc(66, -200, 3.5, 0, 7); c.fill(); c.beginPath(); c.moveTo(48, -206); c.lineTo(46, -226); c.lineTo(56, -208); inkF(c, '#f3e6d0', 3); c.fillStyle = '#c0392b'; c.fillRect(-40, -122, 80, 10); c.restore(); }
const CW = 1000, CH = 1150; let SCC, SCG;
const STORY = {
  conquest: (c, t, lt) => { skyGrad(c, CW, CH, '#f4a35a', '#ffd9a0'); glow(c, 760, 520, 300, 'rgba(255,240,200,A)', 0.6); sea(c, CW, 560, 260, t); ship(c, 620 - lt * 6, 600, 1.9, t, 1, true); ship(c, 860 - lt * 4, 580, 1.3, t, 1, true);
    c.fillStyle = '#e8c88a'; c.beginPath(); c.moveTo(0, 760); c.quadraticCurveTo(500, 700, 1000, 790); c.lineTo(1000, 1150); c.lineTo(0, 1150); c.fill(); palmT(c, 90, 900, 420, t); palmT(c, 210, 960, 330, t, '#3a7d44');
    const run = clamp(lt / 3); [[260, 0], [380, 1], [150, 2]].forEach(([x, i]) => chib(c, x - run * 140 - i * 10, 1010 + i * 20, 0.95, t, { hat: 'feather', hair: '#1b1210', coat: '#b5783a', pants: '#8a5a2b', skin: '#a8673c', pose: 'run', flip: true, face: 'shock', seed: i, belt: false }));
    chib(c, 760 - run * 120, 1060, 1.1, t, { hat: 'morion', plume: true, armor: true, coat: '#7a2a2a', pants: '#3a2a22', prop: 'flag', flag: 'spain', pose: 'walk', flip: true, mustache: true, face: 'angry', seed: 3 });
    chib(c, 900 - run * 110, 1100, 1.05, t, { hat: 'morion', armor: true, coat: '#5a3a5a', prop: 'spear', pose: 'walk', flip: true, mustache: true, face: 'angry', seed: 5 }); },
  andes: (c, t, lt) => { skyGrad(c, CW, CH, '#6fb3e6', '#d7eefc'); for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.ellipse(((i * 300 + t * 12) % 1300) - 150, 120 + i * 40, 90, 26, 0, 0, 7); c.fill(); }
    const rise = easeOutBack(clamp(lt / 1.2)); c.save(); c.translate(0, (1 - rise) * 500); peaks(c, CW, 900, 760, 4, 3, '#8a6a52', true); peaks(c, CW, 980, 520, 5, 9, '#6e533f', true); c.restore();
    c.fillStyle = '#9bbf6a'; c.fillRect(0, 980, CW, 200); hills(c, CW, 1010, 30, 0.01, 2, '#7da455');
    chib(c, 170, 1110, 1.05, t, { hat: 'kepi', coat: '#1f3a6e', pants: '#c8c8c8', buttons: true, prop: 'telescope', pose: 'look', face: lt > 1 ? 'shock' : 'happy', seed: 1 });
    chib(c, 330, 1130, 0.95, t, { hat: 'kepi', coat: '#1f3a6e', pants: '#c8c8c8', buttons: true, prop: 'flag', flag: 'chile', pose: 'stand', face: 'shock', seed: 2 });
    const k = clamp(lt - 1.3); if (k > 0) { c.save(); c.globalAlpha = k; c.font = '900 150px Anek, "Nirmala UI"'; c.fillStyle = '#ffe14a'; c.strokeStyle = K_INK; c.lineWidth = 10; c.strokeText('!', 250, 860 - Math.sin(t * 8) * 6); c.fillText('!', 250, 860 - Math.sin(t * 8) * 6); c.restore(); } },
  war: (c, t, lt) => { skyGrad(c, CW, CH, '#e9a46a', '#f6dcb0'); hills(c, CW, 700, 90, 0.008, 1, '#c99a66'); hills(c, CW, 820, 60, 0.012, 4, '#b88550'); c.fillStyle = '#d8b07a'; c.fillRect(0, 880, CW, 300);
    const adv = clamp(lt / 4); smoke(c, 420, 900, t, 1, 10); smoke(c, 640, 930, t + 3, 0.8, 8);
    [[120, 0], [250, 1], [60, 2]].forEach(([x, i]) => chib(c, x + adv * 140, 1040 + i * 30, 0.9, t, { hat: 'kepi', coat: '#1f3a6e', pants: '#c8c8c8', buttons: true, prop: i === 1 ? 'flag' : 'musket', flag: 'chile', pose: i === 1 ? 'run' : 'aim', face: 'angry', seed: i }));
    [[860, 0, 'bolivia'], [740, 1, 'peru'], [940, 2, 'bolivia']].forEach(([x, i, fl]) => chib(c, x - adv * 40, 1050 + i * 28, 0.88, t, { hat: 'kepi', hatCol: i === 1 ? '#8a1c1c' : '#2e5a2e', coat: i === 1 ? '#c0392b' : '#3d6b3d', pants: '#e8e2d0', prop: i === 0 ? 'flag' : 'musket', flag: fl, pose: i === 0 ? 'stand' : 'aim', flip: true, face: 'shock', seed: i + 4 }));
    boomFx(c, 560, 980, t, Math.floor(t / 1.4) * 1.4); },
  bolivia: (c, t, lt) => { skyGrad(c, CW, CH, '#7cc2f0', '#e6f5ff'); peaks(c, CW, 760, 380, 3, 5, '#9a7a5e', true); c.fillStyle = '#c9a879'; c.fillRect(0, 760, CW, 400); hills(c, CW, 800, 26, 0.02, 3, '#b8956a');
    const k = 0.5 + 0.5 * Math.sin(t * 1.3); c.save(); c.globalAlpha = 0.35 + 0.25 * k; c.fillStyle = '#5ab4e8'; c.beginPath(); c.ellipse(820, 790, 160, 22, 0, 0, 7); c.fill(); c.restore();
    llama(c, 720, 1080, 1.2, t); chib(c, 300, 1110, 1.2, t, { hat: 'bowler', coat: '#6a3a2a', poncho: ['#c0392b', '#f9e300', '#007934'], prop: 'telescope', pose: 'look', face: 'sad', sweat: true, seed: 2 });
    c.save(); c.font = '900 120px Anek, "Nirmala UI"'; c.fillStyle = '#fff'; c.strokeStyle = K_INK; c.lineWidth = 9; const qy = 560 + Math.sin(t * 3) * 10; c.strokeText('?', 470, qy); c.fillText('?', 470, qy); c.strokeText('?', 560, qy - 60); c.fillText('?', 560, qy - 60); c.restore(); },
};
async function initScenes() { SCC = mk(CW, CH); SCG = SCC.getContext('2d'); }
function storyCard(g, name, t, lt, k, o = {}) { if (k <= 0) return; const e = easeOutBack(clamp(k)), w = 980 * e, h = 1127 * e, x = 540 - w / 2, y = (o.y || 820) - h / 2;
  SCG.setTransform(1, 0, 0, 1, 0, 0); SCG.clearRect(0, 0, CW, CH); const zz = o.zoom || 1.3; SCG.translate(500, 1150); SCG.scale(zz, zz); SCG.translate(-500, -1150); STORY[name](SCG, t, lt); SCG.setTransform(1, 0, 0, 1, 0, 0);
  g.save(); g.globalAlpha = clamp(k * 3); g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 50; g.fillStyle = '#fff'; g.beginPath(); g.roundRect(x - 10, y - 10, w + 20, h + 20, 40); g.fill(); g.shadowBlur = 0; g.beginPath(); g.roundRect(x, y, w, h, 32); g.clip(); g.drawImage(SCC, x, y, w, h); g.restore(); }
