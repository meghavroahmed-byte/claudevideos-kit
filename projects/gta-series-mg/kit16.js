// 16:9 explainer kit: anatomy/science diagrams, charts, extra icons, backgrounds
const L16 = { horizon: 560, groundTop: 770, pathY: 1010, propY: 860, ms: 0.55, hs: 0.55, ts: 0.75 };
const L = (o) => Object.assign({}, L16, o);
const BONE = '#f3ead2', BONE_D = '#cdbf9c', BONE_L = '#6b5a3a', RED = '#e8262c', GOOD = '#2ecc71';

function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function glow(g, x, y, r, col, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col.replace('A', a)); gr.addColorStop(1, col.replace('A', 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
function studio(g, c1, c2, t, seed = 1) {
  const gr = g.createRadialGradient(W / 2, H * 0.45, 80, W / 2, H / 2, W * 0.75); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 30; i++) { const x = hash(seed + i) * W + Math.sin(t * 0.4 + i) * 20, y = hash(seed + i + 50) * H + Math.cos(t * 0.3 + i) * 15, r = 20 + hash(seed + i + 90) * 80; g.fillStyle = `rgba(255,255,255,${0.02 + hash(seed + i + 7) * 0.04})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  // subtle grid
  g.strokeStyle = 'rgba(255,255,255,0.035)'; g.lineWidth = 1; for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
}
function ink(g, col, w) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; }

// ---------- SKELETON (front view) ----------
// o: {h: px height, thick: 0.7..1.4, damage: 0..1, hl: 'teeth'|'spine'|'joints'|'bones'|null, t}
function skeleton(g, x, footY, o) {
  const h = o.h || 600, s = h / 600, th = o.thick || 1, dmg = o.damage || 0, t = o.t || 0;
  const col = mixC(BONE, '#d8c99a', dmg * 0.6);
  g.save(); g.translate(x, footY - h); g.scale(s, s);
  const bone = (x1, y1, x2, y2, w) => {
    ink(g, BONE_L, w * th + 6); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    ink(g, col, w * th); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    for (const [px, py] of [[x1, y1], [x2, y2]]) { g.fillStyle = col; g.strokeStyle = BONE_L; g.lineWidth = 3; g.beginPath(); g.arc(px, py, w * th * 0.75, 0, 7); g.fill(); g.stroke(); }
  };
  // legs
  bone(-28, 330, -34, 450, 18); bone(-34, 455, -36, 575, 15); bone(28, 330, 34, 450, 18); bone(34, 455, 36, 575, 15);
  g.fillStyle = col; g.strokeStyle = BONE_L; g.lineWidth = 3; rr(g, -66, 572, 40, 18, 8); g.fill(); g.stroke(); rr(g, 26, 572, 40, 18, 8); g.fill(); g.stroke();
  // pelvis
  g.fillStyle = col; g.beginPath(); g.moveTo(-62, 280); g.quadraticCurveTo(-70, 330, -30, 340); g.lineTo(0, 320); g.lineTo(30, 340); g.quadraticCurveTo(70, 330, 62, 280); g.quadraticCurveTo(0, 300, -62, 280); g.fill(); g.stroke();
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(-28, 312, 9, 0, 7); g.arc(28, 312, 9, 0, 7); g.fill();
  // spine
  const spineRed = dmg * (o.hl === 'spine' ? 1 : 0.6);
  for (let i = 0; i < 12; i++) {
    const y = 120 + i * 14, bend = dmg * Math.sin(i / 11 * Math.PI) * 10;
    g.fillStyle = mixC(col, '#e05040', spineRed * (i > 6 ? 1 : 0.4) * (0.7 + 0.3 * Math.sin(t * 6))); g.strokeStyle = BONE_L; g.lineWidth = 2.5;
    rr(g, -9 + bend, y, 18, 11, 4); g.fill(); g.stroke();
  }
  // ribs
  ink(g, BONE_L, 9 * th); for (let i = 0; i < 6; i++) { const y = 130 + i * 18, w = 58 - Math.abs(i - 2) * 4; g.beginPath(); g.ellipse(0, y + 12, w, 22, 0, Math.PI * 1.05, Math.PI * 1.95, true); g.stroke(); }
  ink(g, col, 6 * th); for (let i = 0; i < 6; i++) { const y = 130 + i * 18, w = 58 - Math.abs(i - 2) * 4; g.beginPath(); g.ellipse(0, y + 12, w, 22, 0, Math.PI * 1.05, Math.PI * 1.95, true); g.stroke(); }
  // clavicles + arms
  bone(-10, 110, -66, 108, 9); bone(10, 110, 66, 108, 9);
  bone(-70, 112, -84, 220, 14); bone(-84, 224, -92, 320, 11); bone(70, 112, 84, 220, 14); bone(84, 224, 92, 320, 11);
  g.fillStyle = col; g.beginPath(); g.ellipse(-94, 340, 13, 20, 0, 0, 7); g.ellipse(94, 340, 13, 20, 0, 0, 7); g.fill(); g.stroke();
  // skull
  g.fillStyle = col; g.strokeStyle = BONE_L; g.lineWidth = 3.5; g.beginPath(); g.ellipse(0, 40, 42, 48, 0, 0, 7); g.fill(); g.stroke();
  g.beginPath(); rr(g, -26, 70, 52, 32, 10); g.fill(); g.stroke();
  g.fillStyle = '#2a2116'; g.beginPath(); g.ellipse(-15, 40, 11, 13, 0, 0, 7); g.ellipse(15, 40, 11, 13, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(0, 52); g.lineTo(-5, 64); g.lineTo(5, 64); g.fill();
  for (let i = 0; i < 6; i++) { g.fillStyle = (dmg > 0.3 && (i === 1 || i === 4)) ? '#5a3a1a' : '#fffaf0'; g.fillRect(-19 + i * 6.5, 78, 5, 9); }
  // highlights
  const pulse = 0.5 + 0.5 * Math.sin(t * 5);
  if (o.hl === 'joints') for (const [jx, jy] of [[-34, 452], [34, 452], [-84, 222], [84, 222], [-28, 330], [28, 330]]) { g.strokeStyle = dmg > 0.5 ? RED : GOOD; g.lineWidth = 4; g.globalAlpha = 0.5 + 0.5 * pulse; g.beginPath(); g.arc(jx, jy, 20, 0, 7); g.stroke(); g.globalAlpha = 1; }
  if (o.hl === 'spine') { g.strokeStyle = dmg > 0.5 ? RED : GOOD; g.lineWidth = 5; g.globalAlpha = 0.5 + 0.5 * pulse; rr(g, -28, 110, 56, 190, 20); g.stroke(); g.globalAlpha = 1; }
  if (o.hl === 'teeth') { g.strokeStyle = dmg > 0.5 ? RED : GOOD; g.lineWidth = 5; g.globalAlpha = 0.5 + 0.5 * pulse; g.beginPath(); g.ellipse(0, 84, 38, 22, 0, 0, 7); g.stroke(); g.globalAlpha = 1; }
  if (o.hl === 'bones') { g.strokeStyle = GOOD; g.lineWidth = 4; g.globalAlpha = 0.4 + 0.4 * pulse; for (const [a, b, c, d] of [[-34, 330, -34, 575], [34, 330, 34, 575]]) { g.beginPath(); g.moveTo(a - 22, b); g.lineTo(c - 22, d); g.moveTo(a + 22, b); g.lineTo(c + 22, d); g.stroke(); } g.globalAlpha = 1; }
  g.restore();
}
// height ruler next to skeleton
function ruler(g, x, footY, h, k, label) {
  ink(g, '#ffd23f', 4); g.beginPath(); g.moveTo(x, footY); g.lineTo(x, footY - h * k); g.stroke();
  for (let y = 0; y <= h * k; y += 30) { g.beginPath(); g.moveTo(x, footY - y); g.lineTo(x + (y % 90 === 0 ? 22 : 12), footY - y); g.stroke(); }
  g.beginPath(); g.moveTo(x - 14, footY - h * k); g.lineTo(x + 14, footY - h * k); g.stroke();
  if (label && k > 0.95) btext(g, label, x + 10, footY - h - 34, 40, '#ffd23f');
}

// ---------- TEETH close-up ----------
function teeth(g, cx, cy, s, decay, t) {
  g.save(); g.translate(cx, cy); g.scale(s, s);
  // gums
  g.fillStyle = '#d9707a'; rr(g, -330, -150, 660, 110, 50); g.fill(); rr(g, -330, 40, 660, 110, 50); g.fill();
  g.fillStyle = '#5a1f28'; rr(g, -320, -40, 640, 80, 30); g.fill();
  const tooth = (x, y, w, h, up, i) => {
    const col = mixC('#fffaf0', '#d8c38a', decay * 0.7);
    g.fillStyle = col; g.strokeStyle = '#7a6a50'; g.lineWidth = 4;
    g.beginPath(); if (up) { g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w - 4, y + h - 10); g.quadraticCurveTo(x + w / 2, y + h + 6, x + 4, y + h - 10); }
    else { g.moveTo(x, y + h); g.lineTo(x + w, y + h); g.lineTo(x + w - 4, y + 10); g.quadraticCurveTo(x + w / 2, y - 6, x + 4, y + 10); }
    g.closePath(); g.fill(); g.stroke();
    if (decay > 0.05 && hash(i * 3.7) < 0.75) {
      const k = clamp(decay * 1.5 - hash(i) * 0.5);
      g.fillStyle = '#3a2410'; g.beginPath(); g.ellipse(x + w * (0.3 + hash(i + 2) * 0.4), y + h * (up ? 0.65 : 0.35), w * 0.22 * k + 1, h * 0.16 * k + 1, 0, 0, 7); g.fill();
      g.fillStyle = '#7a4a1a'; g.globalAlpha = 0.5 * k; g.beginPath(); g.ellipse(x + w * 0.6, y + h * 0.5, w * 0.3 * k, h * 0.2 * k, 0, 0, 7); g.fill(); g.globalAlpha = 1;
    } else if (decay < 0.05 && hash(i) > 0.6) { sparkleK(g, x + w * 0.7, y + h * 0.3, 0.5, t + i); }
  };
  const ws = [70, 70, 62, 52, 48, 48, 52, 62, 70, 70];
  let x = -ws.reduce((a, b) => a + b + 6, 0) / 2;
  ws.forEach((w, i) => { tooth(x, -110, w, 95, true, i); tooth(x, 15, w, 95, false, i + 20); x += w + 6; });
  g.restore();
}
function sparkleK(g, x, y, s, t, a = 1) { g.save(); g.translate(x, y); g.rotate(t * 2); g.scale(s, s); g.globalAlpha = a; g.fillStyle = '#ffffff'; g.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? 8 : 26, an = k * Math.PI / 4; g.lineTo(Math.cos(an) * r, Math.sin(an) * r); } g.fill(); g.restore(); }

// ---------- SPINE close-up ----------
// damage 0..1, bend 0..1 (forward flexion), t
function spine(g, cx, cy, s, damage, bend, t) {
  g.save(); g.translate(cx, cy); g.scale(s, s);
  const N = 6, pulse = 0.5 + 0.5 * Math.sin(t * 5);
  for (let i = 0; i < N; i++) {
    const a = (i - N / 2) * bend * 0.12, y = (i - N / 2) * 105;
    g.save(); g.translate(Math.sin(a) * 60 * bend * i * 0.4, y); g.rotate(a);
    // disc
    if (i < N - 1) {
      const dh = lerp(30, 12, damage), sq = bend * 6 * (damage > 0.5 ? 1 : 0.4);
      g.fillStyle = mixC('#6fb7e8', '#c86a5a', damage); g.strokeStyle = '#1f4a6a'; g.lineWidth = 4;
      g.beginPath(); g.ellipse(sq, 60 + dh / 2 - 6, 105 - sq, dh / 2 + 4, 0, 0, 7); g.fill(); g.stroke();
    }
    // vertebral body
    g.fillStyle = BONE; g.strokeStyle = BONE_L; g.lineWidth = 5;
    rr(g, -95, -40, 190, 92, 26); g.fill(); g.stroke();
    // spinous process
    g.beginPath(); g.moveTo(80, -20); g.lineTo(170, 0); g.lineTo(165, 22); g.lineTo(80, 30); g.closePath(); g.fill(); g.stroke();
    // bone spurs + inflammation
    if (damage > 0.3) {
      const k = clamp((damage - 0.3) / 0.7);
      g.fillStyle = BONE_D; g.beginPath(); g.moveTo(-95, 40); g.lineTo(-95 - 30 * k, 60); g.lineTo(-80, 52); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-95, -38); g.lineTo(-95 - 26 * k, -58); g.lineTo(-78, -40); g.fill(); g.stroke();
      glow(g, -60, 50, 120, 'rgba(255,40,30,A)', 0.35 * k * (0.6 + 0.4 * pulse));
    }
    g.restore();
  }
  g.restore();
}

// ---------- KNEE joint close-up ----------
function knee(g, cx, cy, s, damage, t) {
  g.save(); g.translate(cx, cy); g.scale(s, s);
  g.fillStyle = BONE; g.strokeStyle = BONE_L; g.lineWidth = 5;
  g.beginPath(); g.moveTo(-70, -300); g.lineTo(70, -300); g.lineTo(80, -60); g.quadraticCurveTo(100, -10, 40, -8); g.quadraticCurveTo(0, -30, -40, -8); g.quadraticCurveTo(-100, -10, -80, -60); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-95, 20); g.quadraticCurveTo(0, 0, 95, 20); g.lineTo(70, 90); g.lineTo(60, 300); g.lineTo(-60, 300); g.lineTo(-70, 90); g.closePath(); g.fill(); g.stroke();
  // cartilage
  const c = mixC('#8fe0ff', '#d0604a', damage);
  ink(g, c, lerp(16, 4, damage)); g.beginPath(); g.moveTo(-80, -14); g.quadraticCurveTo(-40, -30, 0, -26); g.quadraticCurveTo(40, -30, 80, -14); g.stroke();
  g.beginPath(); g.moveTo(-88, 16); g.quadraticCurveTo(0, -4, 88, 16); g.stroke();
  if (damage > 0.4) glow(g, 0, 0, 140, 'rgba(255,40,30,A)', 0.4 * (0.6 + 0.4 * Math.sin(t * 5)));
  else glow(g, 0, 0, 140, 'rgba(80,255,160,A)', 0.18);
  g.restore();
}

// ---------- simple flat human body (for thermoregulation etc.) ----------
function bodyOutline(g, x, y, s, fill, t, walk = 0) {
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = fill; g.strokeStyle = '#1b1b1b'; g.lineWidth = 6; g.lineCap = 'round';
  const w = Math.sin(t * 6) * walk;
  const limb = (pts, wd) => { g.lineWidth = wd + 8; g.strokeStyle = '#1b1b1b'; g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke(); g.lineWidth = wd; g.strokeStyle = fill; g.stroke(); };
  limb([[-20, -180], [-28 - w * 30, -90], [-30 - w * 40, 0]], 34); limb([[20, -180], [28 + w * 30, -90], [30 + w * 40, 0]], 34);
  limb([[-50, -360], [-70 + w * 25, -270], [-70 + w * 35, -190]], 26); limb([[50, -360], [70 - w * 25, -270], [70 - w * 35, -190]], 26);
  g.fillStyle = fill; g.strokeStyle = '#1b1b1b'; g.lineWidth = 6; rr(g, -62, -380, 124, 210, 40); g.fill(); g.stroke();
  g.beginPath(); g.arc(0, -430, 46, 0, 7); g.fill(); g.stroke();
  g.restore();
}
function thermometer(g, x, y, h, k, col) {
  g.save(); g.fillStyle = '#fff'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 6;
  rr(g, x - 18, y - h, 36, h, 18); g.fill(); g.stroke(); g.beginPath(); g.arc(x, y + 14, 30, 0, 7); g.fill(); g.stroke();
  g.fillStyle = col; g.beginPath(); g.arc(x, y + 14, 22, 0, 7); g.fill(); rr(g, x - 9, y - (h - 20) * k, 18, (h - 20) * k + 10, 9); g.fill();
  g.restore();
}
function sweatDrops(g, x, y, s, t, n = 8) {
  for (let i = 0; i < n; i++) {
    const life = (t * 0.6 + i / n) % 1, dx = (hash(i) - 0.5) * 120 * s, dy = (hash(i + 3) - 0.5) * 260 * s;
    g.save(); g.globalAlpha = 1 - life; g.translate(x + dx, y + dy - life * 40 * s); g.scale(s, s);
    g.fillStyle = '#6fd3ff'; g.strokeStyle = '#124'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -18); g.quadraticCurveTo(12, 0, 0, 9); g.quadraticCurveTo(-12, 0, 0, -18); g.fill(); g.stroke();
    g.restore();
    // evaporation wisps
    g.strokeStyle = `rgba(200,240,255,${0.5 * life})`; g.lineWidth = 3; g.beginPath(); g.moveTo(x + dx, y + dy - 30 * s); g.quadraticCurveTo(x + dx + 10, y + dy - 50 * s - life * 40, x + dx, y + dy - 70 * s - life * 60); g.stroke();
  }
}
function heatArrows(g, x, y, r, t, col, inward) {
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * Math.PI * 2 + t * 0.2, p = (t * 0.8 + k * 0.13) % 1;
    const r1 = inward ? lerp(r * 1.6, r, p) : lerp(r, r * 1.6, p);
    g.save(); g.globalAlpha = Math.sin(p * Math.PI); g.translate(x + Math.cos(a) * r1, y + Math.sin(a) * r1); g.rotate(a + (inward ? Math.PI : 0));
    g.fillStyle = col; g.beginPath(); g.moveTo(26, 0); g.lineTo(0, -12); g.lineTo(0, 12); g.closePath(); g.fill(); g.fillRect(-26, -5, 26, 10); g.restore();
  }
}
// quadruped (antelope) with optional internal heat overlay
function antelope(g, x, y, s, t, run, heat = 0, fallen = 0) {
  g.save(); g.translate(x, y); if (fallen) { g.rotate(fallen * 1.35); g.translate(0, -fallen * 30); }
  deer(g, 0, 0, s, t, mixC('#8a5a2a', '#a33a20', heat * 0.6), run);
  if (heat > 0) { g.globalCompositeOperation = 'source-over'; glow(g, 0, -90 * s, 120 * s, 'rgba(255,60,20,A)', heat * 0.7 * (0.7 + 0.3 * Math.sin(t * 8))); }
  g.restore();
}

// ---------- BRAIN (side view) ----------
// mode: 0 = calm/creative, 1 = hungry/afraid
function brain(g, cx, cy, s, mode, t) {
  g.save(); g.translate(cx, cy); g.scale(s, s);
  g.fillStyle = mixC('#f4a6b8', '#e98a9a', mode); g.strokeStyle = '#7a2a3a'; g.lineWidth = 7;
  g.beginPath();
  const pts = 22; for (let i = 0; i <= pts; i++) { const a = Math.PI + i / pts * Math.PI * 1.15, r = 200 + Math.sin(i * 2.3) * 14; const px = Math.cos(a) * r * 1.25, py = Math.sin(a) * r * 0.9; i ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.quadraticCurveTo(200, 110, 60, 120); g.quadraticCurveTo(0, 170, -60, 120); g.quadraticCurveTo(-260, 120, -250, 0); g.closePath(); g.fill(); g.stroke();
  // gyri
  ink(g, 'rgba(122,42,58,0.55)', 6); for (let i = 0; i < 7; i++) { g.beginPath(); const x0 = -200 + i * 60; g.moveTo(x0, -120 + (i % 2) * 30); g.bezierCurveTo(x0 + 30, -60, x0 - 20, -20, x0 + 20, 40 + (i % 3) * 20); g.stroke(); }
  // cerebellum + stem
  g.fillStyle = '#e48aa0'; g.strokeStyle = '#7a2a3a'; g.lineWidth = 6; g.beginPath(); g.ellipse(150, 120, 80, 48, 0.2, 0, 7); g.fill(); g.stroke();
  rr(g, 50, 120, 50, 120, 20); g.fill(); g.stroke();
  // amygdala alarm
  const pulse = 0.5 + 0.5 * Math.sin(t * 9);
  if (mode > 0) { glow(g, 20, 60, 140, 'rgba(255,30,30,A)', mode * (0.5 + 0.4 * pulse)); g.fillStyle = RED; g.beginPath(); g.arc(20, 60, 18, 0, 7); g.fill(); }
  // prefrontal creativity glow
  if (mode < 1) { glow(g, -170, -40, 190, 'rgba(255,220,80,A)', (1 - mode) * 0.65); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 - 0.8 + i * 0.4, r = 240 + Math.sin(t * 3 + i) * 10; g.strokeStyle = `rgba(255,220,80,${(1 - mode) * 0.8})`; g.lineWidth = 6; g.beginPath(); g.moveTo(-170 + Math.cos(a) * 200, -40 + Math.sin(a) * 160); g.lineTo(-170 + Math.cos(a) * r, -40 + Math.sin(a) * (r - 40)); g.stroke(); } }
  g.restore();
}

// ---------- charts ----------
function barChart(g, x, y, w, h, bars, k, o = {}) {
  // bars: [{v, label, col, val}]
  const max = o.max || Math.max(...bars.map(b => b.v)), bw = w / bars.length * 0.6, gap = w / bars.length;
  ink(g, 'rgba(255,255,255,0.6)', 4); g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y); g.stroke();
  bars.forEach((b, i) => {
    const kk = easeOut(clamp(k * bars.length - i * 0.6)), bh = h * b.v / max * kk, bx = x + i * gap + (gap - bw) / 2;
    g.fillStyle = b.col; rr(g, bx, y - bh, bw, bh, 14); g.fill(); g.strokeStyle = '#111'; g.lineWidth = 4; g.stroke();
    btext(g, b.label, bx + bw / 2, y + 46, o.ls || 40, '#fff');
    if (kk > 0.2 && b.val) btext(g, b.val, bx + bw / 2, y - bh - 36, o.vs || 48, b.vcol || '#ffd23f', kk);
  });
}
function weekCalendar(g, x, y, cw, ch, fill, col, t, labels) {
  const days = labels || ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র'];
  days.forEach((d, i) => {
    const cx = x + i * (cw + 14);
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 4; rr(g, cx, y, cw, ch, 16); g.fill(); g.stroke();
    const f = clamp(fill - i);
    if (f > 0) { g.fillStyle = col; rr(g, cx + 6, y + ch - 6 - (ch - 12) * f, cw - 12, (ch - 12) * f, 12); g.fill(); }
    btext(g, d, cx + cw / 2, y - 34, 36, '#fff');
  });
}
function bigNumber(g, s, x, y, size, col, k, sub) {
  if (k <= 0) return;
  glow(g, x, y, size * 2.2, 'rgba(255,210,63,A)', 0.25 * k);
  btext(g, s, x, y, size, col, k);
  if (sub) btext(g, sub, x, y + size * 0.85, size * 0.36, '#fff', k);
}
// circular feedback loop
function loopDiagram(g, cx, cy, r, nodes, k, t) {
  const n = nodes.length;
  // arrows
  for (let i = 0; i < n; i++) {
    const kk = clamp(k * n - i - 0.6); if (kk <= 0) continue;
    const a0 = -Math.PI / 2 + i / n * Math.PI * 2 + 0.33, a1 = a0 + (Math.PI * 2 / n - 0.66) * kk;
    ink(g, '#ffd23f', 10); g.beginPath(); g.arc(cx, cy, r, a0, a1); g.stroke();
    if (kk > 0.95) { const ax = cx + Math.cos(a1) * r, ay = cy + Math.sin(a1) * r; g.save(); g.translate(ax, ay); g.rotate(a1 + Math.PI / 2); g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(22, 0); g.lineTo(-10, -18); g.lineTo(-10, 18); g.fill(); g.restore(); }
  }
  // spin glow
  if (k >= 1) { const a = -Math.PI / 2 + t * 1.6; glow(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 60, 'rgba(255,240,150,A)', 0.8); }
  nodes.forEach((nd, i) => {
    const kk = easeOutBack(clamp(k * n - i)); if (kk <= 0) return;
    const a = -Math.PI / 2 + i / n * Math.PI * 2, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    iconTile(g, x, y, 78, kk, nd.icon, 0, nd.bg || '#fff8ea');
    btext(g, nd.label, x, y + 118, 40, '#fff', kk);
  });
}
function timelineBar(g, x, y, w, segs, k) {
  // segs: [{len, col, label}]
  const tot = segs.reduce((a, b) => a + b.len, 0); let cx = x;
  segs.forEach((s, i) => {
    const sw = w * s.len / tot, kk = clamp(k * segs.length - i);
    if (kk > 0) { g.fillStyle = s.col; rr(g, cx, y, sw * kk, 80, 14); g.fill(); g.strokeStyle = '#111'; g.lineWidth = 4; g.stroke(); if (kk > 0.6) btext(g, s.label, cx + sw / 2, y + 40, 36, s.tcol || '#111', 1, { stroke: s.col }); }
    cx += sw;
  });
}

// ---------- extra icons ----------
Object.assign(ICON, {
  washer(g, r) { g.fillStyle = '#eef3f8'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; rr(g, -r * 0.45, -r * 0.55, r * 0.9, r * 1.1, 10); g.fill(); g.stroke(); g.fillStyle = '#5ab8ff'; g.beginPath(); g.arc(0, r * 0.1, r * 0.3, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#1b1b1b'; g.fillRect(-r * 0.35, -r * 0.45, r * 0.3, r * 0.08); },
  microwave(g, r) { g.fillStyle = '#e9e9e9'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; rr(g, -r * 0.6, -r * 0.38, r * 1.2, r * 0.76, 10); g.fill(); g.stroke(); g.fillStyle = '#2a3a4a'; rr(g, -r * 0.5, -r * 0.28, r * 0.7, r * 0.56, 6); g.fill(); g.fillStyle = '#ffb02a'; g.fillRect(-r * 0.4, -r * 0.05, r * 0.5, r * 0.18); g.fillStyle = '#1b1b1b'; for (let i = 0; i < 3; i++) g.fillRect(r * 0.3, -r * 0.2 + i * r * 0.16, r * 0.18, r * 0.08); },
  car(g, r) { g.fillStyle = '#e8402c'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.beginPath(); g.moveTo(-r * 0.65, r * 0.15); g.lineTo(-r * 0.6, -r * 0.1); g.lineTo(-r * 0.3, -r * 0.15); g.lineTo(-r * 0.15, -r * 0.4); g.lineTo(r * 0.3, -r * 0.4); g.lineTo(r * 0.45, -r * 0.12); g.lineTo(r * 0.65, -r * 0.05); g.lineTo(r * 0.65, r * 0.15); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#9fd8ff'; g.fillRect(-r * 0.1, -r * 0.33, r * 0.35, r * 0.18); g.fillStyle = '#222'; g.beginPath(); g.arc(-r * 0.35, r * 0.18, r * 0.15, 0, 7); g.arc(r * 0.38, r * 0.18, r * 0.15, 0, 7); g.fill(); },
  clock(g, r, t = 0) { g.fillStyle = '#fff'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, r * 0.55, 0, 7); g.fill(); g.stroke(); ink(g, '#1b1b1b', 7); g.save(); g.rotate(t * 0.5); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r * 0.3); g.stroke(); g.restore(); ink(g, RED, 5); g.save(); g.rotate(t * 4); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r * 0.45); g.stroke(); g.restore(); },
  alarm(g, r, t = 0) { const j = Math.sin(t * 50) * 0.08; g.rotate(j); ICON.clock(g, r * 0.9, t); g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(-r * 0.38, -r * 0.48, r * 0.15, 0, 7); g.arc(r * 0.38, -r * 0.48, r * 0.15, 0, 7); g.fill(); },
  boss(g, r) { g.fillStyle = '#333'; g.beginPath(); g.arc(0, -r * 0.2, r * 0.25, 0, 7); g.fill(); g.beginPath(); g.moveTo(-r * 0.45, r * 0.55); g.quadraticCurveTo(0, -r * 0.05, r * 0.45, r * 0.55); g.fill(); g.fillStyle = RED; g.beginPath(); g.moveTo(0, r * 0.1); g.lineTo(-r * 0.06, r * 0.4); g.lineTo(0, r * 0.5); g.lineTo(r * 0.06, r * 0.4); g.fill(); },
  money(g, r) { g.fillStyle = '#6cc04a'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; rr(g, -r * 0.6, -r * 0.32, r * 1.2, r * 0.64, 8); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, r * 0.2, 0, 7); g.fill(); btext(g, '৳', 0, 0, r * 0.32, '#2a7a1a', 1, { stroke: '#fff' }); },
  bank(g, r) { g.fillStyle = '#ddd'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.beginPath(); g.moveTo(-r * 0.6, -r * 0.2); g.lineTo(0, -r * 0.55); g.lineTo(r * 0.6, -r * 0.2); g.closePath(); g.fill(); g.stroke(); for (let i = 0; i < 4; i++) { g.fillRect(-r * 0.45 + i * r * 0.28, -r * 0.15, r * 0.12, r * 0.5); g.strokeRect(-r * 0.45 + i * r * 0.28, -r * 0.15, r * 0.12, r * 0.5); } g.fillRect(-r * 0.6, r * 0.38, r * 1.2, r * 0.12); },
  police(g, r) { g.fillStyle = '#2a4aa0'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, -r * 0.55); g.lineTo(r * 0.45, -r * 0.35); g.lineTo(r * 0.38, r * 0.2); g.lineTo(0, r * 0.55); g.lineTo(-r * 0.38, r * 0.2); g.lineTo(-r * 0.45, -r * 0.35); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(0, 0, r * 0.16, 0, 7); g.fill(); },
  hospital(g, r) { g.fillStyle = '#fff'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; rr(g, -r * 0.5, -r * 0.45, r, r * 0.9, 10); g.fill(); g.stroke(); g.fillStyle = RED; g.fillRect(-r * 0.1, -r * 0.3, r * 0.2, r * 0.6); g.fillRect(-r * 0.3, -r * 0.1, r * 0.6, r * 0.2); },
  pension(g, r) { g.fillStyle = '#c99a5a'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.beginPath(); g.arc(-r * 0.05, -r * 0.3, r * 0.17, 0, 7); g.fill(); g.stroke(); rr(g, -r * 0.25, -r * 0.12, r * 0.4, r * 0.5, 12); g.fill(); g.stroke(); ink(g, '#6b4a2a', 6); g.beginPath(); g.moveTo(r * 0.25, -r * 0.1); g.lineTo(r * 0.32, r * 0.55); g.stroke(); },
  people(g, r) { for (const [x, s, c] of [[-r * 0.32, 0.8, '#e8a04a'], [r * 0.32, 0.8, '#4aa0e8'], [0, 1, '#e8402c']]) { g.fillStyle = c; g.strokeStyle = '#1b1b1b'; g.lineWidth = 4; g.beginPath(); g.arc(x, -r * 0.2 * s, r * 0.16 * s, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.arc(x, r * 0.35, r * 0.27 * s, Math.PI, 0); g.fill(); g.stroke(); } },
  shield(g, r) { g.fillStyle = GOOD; g.strokeStyle = '#1b1b1b'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, -r * 0.55); g.lineTo(r * 0.45, -r * 0.35); g.quadraticCurveTo(r * 0.45, r * 0.3, 0, r * 0.58); g.quadraticCurveTo(-r * 0.45, r * 0.3, -r * 0.45, -r * 0.35); g.closePath(); g.fill(); g.stroke(); ink(g, '#fff', 9); g.beginPath(); g.moveTo(-r * 0.18, 0); g.lineTo(-r * 0.03, r * 0.15); g.lineTo(r * 0.22, -r * 0.15); g.stroke(); },
  seed(g, r) { g.fillStyle = '#8a5a2a'; g.beginPath(); g.ellipse(0, r * 0.25, r * 0.16, r * 0.24, 0.3, 0, 7); g.fill(); ink(g, '#3a9a3a', 7); g.beginPath(); g.moveTo(0, r * 0.05); g.quadraticCurveTo(-r * 0.05, -r * 0.3, 0, -r * 0.45); g.stroke(); g.fillStyle = '#3a9a3a'; g.beginPath(); g.ellipse(-r * 0.16, -r * 0.3, r * 0.16, r * 0.07, -0.5, 0, 7); g.ellipse(r * 0.16, -r * 0.38, r * 0.16, r * 0.07, 0.5, 0, 7); g.fill(); },
  baby(g, r) { g.fillStyle = '#f2c09a'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.beginPath(); g.arc(0, -r * 0.15, r * 0.3, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#9fd8ff'; g.beginPath(); g.ellipse(0, r * 0.35, r * 0.35, r * 0.22, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(-r * 0.1, -r * 0.18, 4, 0, 7); g.arc(r * 0.1, -r * 0.18, 4, 0, 7); g.fill(); },
  land(g, r) { g.fillStyle = '#9a7a44'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.beginPath(); g.moveTo(-r * 0.6, r * 0.3); g.lineTo(-r * 0.3, -r * 0.2); g.lineTo(r * 0.6, -r * 0.2); g.lineTo(r * 0.3, r * 0.3); g.closePath(); g.fill(); g.stroke(); ink(g, '#6a8a2a', 5); for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-r * 0.45 + i * r * 0.25, r * 0.22); g.lineTo(-r * 0.2 + i * r * 0.25, -r * 0.12); g.stroke(); } },
  sweat(g, r) { ICON.boss; g.fillStyle = '#f2c09a'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, r * 0.4, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#6fd3ff'; for (const [x, y] of [[r * 0.45, -r * 0.3], [-r * 0.45, -r * 0.1], [r * 0.3, r * 0.4]]) { g.beginPath(); g.moveTo(x, y - 14); g.quadraticCurveTo(x + 10, y + 2, x, y + 8); g.quadraticCurveTo(x - 10, y + 2, x, y - 14); g.fill(); g.stroke(); } },
  wheat(g, r, t = 0) { for (let i = -1; i <= 1; i++) wheat(g, i * r * 0.25, r * 0.5, r * 0.95, t, '#e2b23a', i); },
  crown(g, r) { g.fillStyle = '#ffd23f'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.beginPath(); g.moveTo(-r * 0.5, r * 0.3); g.lineTo(-r * 0.5, -r * 0.25); g.lineTo(-r * 0.25, 0); g.lineTo(0, -r * 0.4); g.lineTo(r * 0.25, 0); g.lineTo(r * 0.5, -r * 0.25); g.lineTo(r * 0.5, r * 0.3); g.closePath(); g.fill(); g.stroke(); },
  sword(g, r) { ink(g, '#1b1b1b', 14); g.beginPath(); g.moveTo(-r * 0.4, r * 0.4); g.lineTo(r * 0.4, -r * 0.4); g.stroke(); ink(g, '#ccd', 8); g.stroke(); ink(g, '#8a5a2a', 12); g.beginPath(); g.moveTo(-r * 0.4, r * 0.15); g.lineTo(-r * 0.15, r * 0.4); g.stroke(); },
  coin(g, r) { for (let i = 0; i < 3; i++) { g.fillStyle = '#ffd23f'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 4; g.beginPath(); g.ellipse(0, r * 0.3 - i * r * 0.2, r * 0.4, r * 0.14, 0, 0, 7); g.fill(); g.stroke(); } },
  scroll(g, r) { g.fillStyle = '#f2e2b8'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; rr(g, -r * 0.4, -r * 0.5, r * 0.8, r, 8); g.fill(); g.stroke(); ink(g, '#8a7a5a', 4); for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-r * 0.28, -r * 0.32 + i * r * 0.15); g.lineTo(r * 0.28, -r * 0.32 + i * r * 0.15); g.stroke(); } },
  stopwatch(g, r, t = 0) { g.fillStyle = '#fff'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 6; g.beginPath(); g.arc(0, r * 0.06, r * 0.5, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#1b1b1b'; g.fillRect(-r * 0.08, -r * 0.6, r * 0.16, r * 0.12); ink(g, RED, 6); g.save(); g.translate(0, r * 0.06); g.rotate(t * 3); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r * 0.4); g.stroke(); g.restore(); },
  notebook(g, r) { g.fillStyle = '#c99a5a'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; rr(g, -r * 0.42, -r * 0.55, r * 0.84, r * 1.1, 8); g.fill(); g.stroke(); g.fillStyle = '#fff8e0'; rr(g, -r * 0.32, -r * 0.45, r * 0.64, r * 0.9, 4); g.fill(); ink(g, '#5a7ab0', 3); for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-r * 0.24, -r * 0.3 + i * r * 0.13); g.lineTo(r * 0.24, -r * 0.3 + i * r * 0.13); g.stroke(); } },
  film(g, r) { g.fillStyle = '#222'; rr(g, -r * 0.6, -r * 0.35, r * 1.2, r * 0.7, 8); g.fill(); g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { g.fillRect(-r * 0.55 + i * r * 0.2, -r * 0.3, r * 0.1, r * 0.08); g.fillRect(-r * 0.55 + i * r * 0.2, r * 0.22, r * 0.1, r * 0.08); } g.fillStyle = '#5ab8ff'; g.fillRect(-r * 0.5, -r * 0.18, r, r * 0.36); },
  bed(g, r) { g.fillStyle = '#8a5a3a'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.fillRect(-r * 0.6, 0, r * 1.2, r * 0.25); g.strokeRect(-r * 0.6, 0, r * 1.2, r * 0.25); g.fillStyle = '#9fd8ff'; rr(g, -r * 0.55, -r * 0.18, r * 1.1, r * 0.2, 8); g.fill(); g.stroke(); g.fillStyle = '#fff'; rr(g, -r * 0.55, -r * 0.3, r * 0.3, r * 0.15, 6); g.fill(); g.stroke(); },
  brain(g, r) { brain(g, 0, 0, r / 330, 0, 0); },
  heart(g, r) { g.fillStyle = RED; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, r * 0.45); g.bezierCurveTo(-r * 0.7, 0, -r * 0.35, -r * 0.6, 0, -r * 0.2); g.bezierCurveTo(r * 0.35, -r * 0.6, r * 0.7, 0, 0, r * 0.45); g.fill(); g.stroke(); },
  music(g, r) { g.fillStyle = '#1b1b1b'; g.beginPath(); g.ellipse(-r * 0.25, r * 0.3, r * 0.15, r * 0.11, -0.4, 0, 7); g.ellipse(r * 0.25, r * 0.18, r * 0.15, r * 0.11, -0.4, 0, 7); g.fill(); ink(g, '#1b1b1b', 7); g.beginPath(); g.moveTo(-r * 0.12, r * 0.3); g.lineTo(-r * 0.12, -r * 0.4); g.lineTo(r * 0.38, -r * 0.52); g.lineTo(r * 0.38, r * 0.18); g.stroke(); },
  book(g, r) { g.fillStyle = '#4a7ad0'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, -r * 0.3); g.quadraticCurveTo(-r * 0.3, -r * 0.45, -r * 0.6, -r * 0.35); g.lineTo(-r * 0.6, r * 0.4); g.quadraticCurveTo(-r * 0.3, r * 0.3, 0, r * 0.45); g.quadraticCurveTo(r * 0.3, r * 0.3, r * 0.6, r * 0.4); g.lineTo(r * 0.6, -r * 0.35); g.quadraticCurveTo(r * 0.3, -r * 0.45, 0, -r * 0.3); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(0, -r * 0.3); g.lineTo(0, r * 0.45); g.stroke(); },
  art(g, r) { g.fillStyle = '#f2d2a0'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.beginPath(); g.ellipse(0, 0, r * 0.55, r * 0.42, 0, 0, 7); g.fill(); g.stroke(); for (const [x, y, c] of [[-0.25, -0.15, RED], [0, -0.25, '#3a9ae8'], [0.25, -0.1, GOOD], [0.2, 0.18, '#ffd23f']]) { g.fillStyle = c; g.beginPath(); g.arc(x * r, y * r, r * 0.09, 0, 7); g.fill(); } },
  tooth(g, r) { g.fillStyle = '#fffaf0'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.beginPath(); g.moveTo(-r * 0.4, -r * 0.35); g.quadraticCurveTo(0, -r * 0.6, r * 0.4, -r * 0.35); g.quadraticCurveTo(r * 0.45, 0, r * 0.25, r * 0.5); g.lineTo(r * 0.08, r * 0.05); g.lineTo(-r * 0.08, r * 0.05); g.lineTo(-r * 0.25, r * 0.5); g.quadraticCurveTo(-r * 0.45, 0, -r * 0.4, -r * 0.35); g.fill(); g.stroke(); },
  bone(g, r) { ink(g, '#1b1b1b', r * 0.26); g.beginPath(); g.moveTo(-r * 0.4, r * 0.4); g.lineTo(r * 0.4, -r * 0.4); g.stroke(); ink(g, BONE, r * 0.18); g.stroke(); for (const [x, y] of [[-r * 0.45, r * 0.32], [-r * 0.32, r * 0.45], [r * 0.45, -r * 0.32], [r * 0.32, -r * 0.45]]) { g.fillStyle = BONE; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.beginPath(); g.arc(x, y, r * 0.13, 0, 7); g.fill(); g.stroke(); } },
  spear(g, r) { ink(g, '#6b4a2a', 9); g.beginPath(); g.moveTo(-r * 0.45, r * 0.45); g.lineTo(r * 0.3, -r * 0.3); g.stroke(); g.fillStyle = '#888'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 4; g.beginPath(); g.moveTo(r * 0.25, -r * 0.18); g.lineTo(r * 0.52, -r * 0.52); g.lineTo(r * 0.18, -r * 0.25); g.closePath(); g.fill(); g.stroke(); },
  smartphone(g, r) { ICON.phone(g, r); },
  trap(g, r) { ink(g, '#1b1b1b', 8); g.fillStyle = '#888'; g.beginPath(); g.arc(0, r * 0.1, r * 0.45, Math.PI, 0); g.stroke(); for (let i = 0; i < 7; i++) { const a = Math.PI + i / 6 * Math.PI; g.beginPath(); g.moveTo(Math.cos(a) * r * 0.45, r * 0.1 + Math.sin(a) * r * 0.45); g.lineTo(Math.cos(a) * r * 0.3, r * 0.1 + Math.sin(a) * r * 0.3); g.stroke(); } g.beginPath(); g.moveTo(-r * 0.55, r * 0.15); g.lineTo(r * 0.55, r * 0.15); g.stroke(); },
});

// ---------- backgrounds ----------
function modernRoom(g, t) {
  const wall = g.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, '#f1e3cf'); wall.addColorStop(1, '#e2cfb3'); g.fillStyle = wall; g.fillRect(0, 0, W, H);
  g.fillStyle = '#b98a5a'; g.fillRect(0, 820, W, 260); g.fillStyle = 'rgba(0,0,0,0.08)'; for (let x = 0; x < W; x += 160) g.fillRect(x, 820, 4, 260);
  // window with city
  g.fillStyle = '#9fd0f0'; rr(g, 1180, 140, 560, 420, 10); g.fill(); g.fillStyle = '#7aa8c8'; for (let i = 0; i < 8; i++) g.fillRect(1190 + i * 70, 360 - hash(i) * 160, 55, 300); g.strokeStyle = '#fff'; g.lineWidth = 16; rr(g, 1180, 140, 560, 420, 10); g.stroke(); g.beginPath(); g.moveTo(1460, 140); g.lineTo(1460, 560); g.stroke();
  // shelf + clock
  g.fillStyle = '#8a5a3a'; g.fillRect(140, 420, 380, 18);
  iconTile(g, 330, 250, 90, 1, (gg, r) => ICON.clock(gg, r, t * 6));
  // sofa
  g.fillStyle = '#4a6a9a'; rr(g, 120, 640, 700, 200, 40); g.fill(); g.fillStyle = '#5a7aaa'; rr(g, 160, 600, 620, 110, 30); g.fill();
}
let CITY16;
function buildCity16() {
  const c = mk(W, H), g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 980); sky.addColorStop(0, '#0f1630'); sky.addColorStop(0.65, '#27365f'); sky.addColorStop(1, '#4a4f78');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  for (const [layer, base, col, win] of [[0, 760, '#1c2546', 0.25], [1, 900, '#141a33', 0.55]]) {
    let x = -20, k = layer * 100;
    while (x < W) {
      const bw = 90 + hash(k++) * 140, bh = (layer ? 260 : 380) + hash(k++) * (layer ? 260 : 300);
      g.fillStyle = col; g.fillRect(x, base - bh + (layer ? 80 : 0), bw, bh + 200);
      for (let wy = base - bh + (layer ? 100 : 20); wy < base + 40; wy += 34) for (let wx = x + 12; wx < x + bw - 18; wx += 26) if (hash(wx * 7 + wy) > 0.55) { g.fillStyle = `rgba(255,205,120,${win * (0.4 + hash(wx + wy * 3) * 0.6)})`; g.fillRect(wx, wy, 12, 16); }
      x += bw + 6;
    }
  }
  g.fillStyle = '#262c40'; g.fillRect(0, 935, W, 145); g.fillStyle = '#3a4361'; g.fillRect(0, 935, W, 8);
  return c;
}
function soil(g, t, dig = 0) {
  const sky = g.createLinearGradient(0, 0, 0, 260); sky.addColorStop(0, '#f2c27a'); sky.addColorStop(1, '#f7e2b0'); g.fillStyle = sky; g.fillRect(0, 0, W, 260);
  const layers = ['#b0844e', '#9a6f3e', '#86602f', '#6f4e26', '#5a3e1e', '#46301a'];
  layers.forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, 260 + i * 140); for (let x = 0; x <= W; x += 30) g.lineTo(x, 260 + i * 140 + noise(x * 0.008 + i * 5) * 18); g.lineTo(W, H); g.lineTo(0, H); g.fill(); });
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(30,20,10,${0.2 + hash(i) * 0.3})`; g.beginPath(); g.ellipse(hash(i + 1) * W, 300 + hash(i + 2) * 760, 6 + hash(i + 3) * 20, 4 + hash(i + 4) * 12, hash(i) * 3, 0, 7); g.fill(); }
  // dig pit
  if (dig > 0) { g.fillStyle = 'rgba(30,18,8,0.55)'; g.beginPath(); g.moveTo(W / 2 - 600 * dig, 260); g.lineTo(W / 2 + 600 * dig, 260); g.lineTo(W / 2 + 480 * dig, 260 + 560 * dig); g.lineTo(W / 2 - 480 * dig, 260 + 560 * dig); g.closePath(); g.fill(); }
}
function desertLand(g, o) { land(g, L(Object.assign({ c1: '#d9b88a', c2: '#c9a070', c3: '#c8a060', c4: '#7a6a3a', g1: '#e2c08a', g2: '#c79a5a', pc: '#e8d0a0', noVolcano: true, sparse: true }, o))); }
function heatHaze(g, t, a = 0.25) { g.save(); g.globalAlpha = a; for (let y = 600; y < 900; y += 14) { g.fillStyle = `rgba(255,240,200,${0.08 + 0.06 * Math.sin(t * 4 + y)})`; g.fillRect(Math.sin(t * 3 + y * 0.1) * 12, y, W, 6); } g.restore(); }
// modern researcher (flat)
function researcher(g, x, y, s, t, o = {}) {
  caveman(g, x, y, s, { t, pose: o.pose || 'stand', walk: o.walk, col: '#2a2a2a', cloth: o.shirt || '#c8b48a', skin: '#e0b48a', hair: '#5a4a3a', flip: o.flip });
  g.save(); g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s);
  g.fillStyle = '#8a7a5a'; g.beginPath(); g.ellipse(0, -258, 46, 10, 0, 0, 7); g.fill(); rr(g, -26, -290, 52, 32, 10); g.fill(); // hat
  g.fillStyle = '#1b1b1b'; g.fillRect(-18, -232, 14, 6); g.fillRect(4, -232, 14, 6);
  if (o.notebook) { g.fillStyle = '#fff8e0'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 3; rr(g, 30, -150, 46, 58, 4); g.fill(); g.stroke(); }
  g.restore();
}
function chapterCard(g, num, title, k, t, col = '#ffd23f') {
  if (k <= 0) return;
  g.fillStyle = `rgba(8,8,16,${0.85 * k})`; g.fillRect(0, 0, W, H);
  const w = 1100 * easeOut(k);
  g.fillStyle = col; g.fillRect(W / 2 - w / 2, H / 2 + 70, w, 8);
  btext(g, num, W / 2, H / 2 - 110, 64, col, easeOutBack(k));
  btext(g, title, W / 2, H / 2 - 10, 120, '#fff', easeOutBack(clamp(k * 1.3 - 0.2)));
}
// progress bar (retention)
function progressBar(g, t, dur, chapters) {
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, H - 10, W, 10);
  g.fillStyle = '#ffd23f'; g.fillRect(0, H - 10, W * t / dur, 10);
  for (const c of chapters) { g.fillStyle = '#fff'; g.fillRect(W * c / dur - 2, H - 12, 4, 12); }
}

// mini scenes (from shorts)
function miniFruit(g, w, h, t) {
  const sk = g.createLinearGradient(0, 0, 0, h); sk.addColorStop(0, '#8fd0f2'); sk.addColorStop(1, '#d9f2c4'); g.fillStyle = sk; g.fillRect(0, 0, w, h);
  g.fillStyle = '#6aa84f'; g.fillRect(0, h * 0.78, w, h);
  g.fillStyle = '#6b4a2a'; g.fillRect(w * 0.3, h * 0.35, 40, h * 0.45);
  g.fillStyle = '#3f8a3a'; for (const [dx, dy, r] of [[0, 0, 150], [-110, 40, 110], [110, 40, 110], [0, -80, 110]]) { g.beginPath(); g.arc(w * 0.3 + 20 + dx, h * 0.3 + dy, r, 0, 7); g.fill(); }
  for (let i = 0; i < 9; i++) { g.fillStyle = '#e8402c'; g.beginPath(); g.arc(w * 0.3 + 20 + (hash(i) - 0.5) * 300, h * 0.3 + (hash(i + 4) - 0.4) * 180, 18, 0, 7); g.fill(); }
  const f = (t % 1.4) / 1.4; g.fillStyle = '#e8402c'; g.beginPath(); g.arc(w * 0.45, lerp(h * 0.42, h * 0.8, f * f), 20, 0, 7); g.fill();
  caveman(g, w * 0.72, h * 0.86, 0.85, { t, pose: 'stand', col: '#2e211a', cloth: '#7a5534', skin: '#8a5a3a', flip: true });
  g.fillStyle = '#9a6a3a'; g.beginPath(); g.moveTo(w * 0.5, h * 0.8); g.lineTo(w * 0.62, h * 0.8); g.lineTo(w * 0.6, h * 0.88); g.lineTo(w * 0.52, h * 0.88); g.fill();
}
function miniFish(g, w, h, t) {
  g.fillStyle = '#8fd0f2'; g.fillRect(0, 0, w, h); g.fillStyle = '#7fb35a'; g.fillRect(0, h * 0.42, w, 40);
  const wg = g.createLinearGradient(0, h * 0.5, 0, h); wg.addColorStop(0, '#2f8fd0'); wg.addColorStop(1, '#14507d'); g.fillStyle = wg; g.fillRect(0, h * 0.5, w, h);
  g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 4; for (let y = h * 0.56; y < h; y += 46) { g.beginPath(); for (let x = 0; x <= w; x += 20) g.lineTo(x, y + Math.sin(x * 0.04 + t * 3 + y) * 6); g.stroke(); }
  for (let i = 0; i < 3; i++) { const p = ((t * 0.7 + i / 3) % 1), x = w * (0.2 + i * 0.3), y = h * 0.55 - Math.sin(p * Math.PI) * h * 0.25; if (p < 0.9) fish(g, x + p * 80, y, 1.1, -Math.cos(p * Math.PI) * 0.9, '#f2a23a'); }
  caveman(g, w * 0.2, h * 0.5, 0.75, { t, pose: 'spear', col: '#2e211a', cloth: '#6b4a2e', skin: '#8a5a3a' });
}
function miniHunt(g, w, h, t) {
  const sk = g.createLinearGradient(0, 0, 0, h); sk.addColorStop(0, '#f2b066'); sk.addColorStop(1, '#f7dfa0'); g.fillStyle = sk; g.fillRect(0, 0, w, h);
  g.fillStyle = '#b08a4a'; g.fillRect(0, h * 0.72, w, h);
  const dx = ((t * 260) % (w + 400)) - 200;
  deer(g, w - dx, h * 0.8, 1.0, t, '#4a2e1a');
  caveman(g, w * 0.15, h * 0.86, 0.75, { t, pose: 'throw', k: (t * 0.8) % 1, col: '#2e211a', cloth: '#6b4a2e', skin: '#8a5a3a' });
  const sp = (t * 0.8) % 1; g.save(); g.translate(lerp(w * 0.22, w * 0.8, sp), h * 0.55 - Math.sin(sp * Math.PI) * 140); g.rotate(-0.4 + sp * 0.8); g.strokeStyle = '#6b4a2a'; g.lineWidth = 7; g.beginPath(); g.moveTo(-70, 0); g.lineTo(70, 0); g.stroke(); g.fillStyle = '#999'; g.beginPath(); g.moveTo(70, -8); g.lineTo(95, 0); g.lineTo(70, 8); g.fill(); g.restore();
}
function miniTool(g, w, h, t) {
  g.fillStyle = '#c9a77a'; g.fillRect(0, 0, w, h); g.fillStyle = '#9a7a52'; g.fillRect(0, h * 0.7, w, h);
  rock(g, w * 0.55, h * 0.8, 1.1, '#7d7a72', '#a8a59c');
  caveman(g, w * 0.32, h * 0.88, 0.9, { t, pose: 'hammer', col: '#2e211a', cloth: '#6b4a2e', skin: '#8a5a3a' });
  const hk = Math.abs(Math.sin(t * 6)); if (hk < 0.25) for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i - 3.5) * 0.35; g.strokeStyle = '#ffd23f'; g.lineWidth = 5; g.beginPath(); g.moveTo(w * 0.55 + Math.cos(a) * 20, h * 0.72 + Math.sin(a) * 20); g.lineTo(w * 0.55 + Math.cos(a) * 70, h * 0.72 + Math.sin(a) * 70); g.stroke(); }
  g.fillStyle = '#6d6a62'; g.beginPath(); g.moveTo(w * 0.8, h * 0.25); g.lineTo(w * 0.9, h * 0.35); g.lineTo(w * 0.8, h * 0.5); g.lineTo(w * 0.72, h * 0.37); g.closePath(); g.fill();
}
