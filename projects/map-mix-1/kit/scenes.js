// ===== Tilt-shift diorama scenes (drawn in 1920x1080 world space; toys stand in them) =====
function tiltShift(g, top = 0.3, bot = 0.82, amt = 7) {
  // blurred low-res copy, masked to top/bottom bands with soft gradients
  const [s, sx] = tmpC('TSS'); if (s.width !== 640) { s.width = 640; s.height = 360; } sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalCompositeOperation = 'copy'; sx.filter = `blur(${Math.max(1, amt / 3)}px)`; sx.drawImage(g.canvas, 0, 0, 640, 360); sx.filter = 'none'; sx.globalCompositeOperation = 'source-over';
  const [c, x] = tmpC('TSH'); if (c.width !== W) { c.width = W; c.height = H; } x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'copy'; x.drawImage(s, 0, 0, W, H); x.globalCompositeOperation = 'destination-in';
  const m = x.createLinearGradient(0, 0, 0, H); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(top, 'rgba(0,0,0,0)'); m.addColorStop(bot, 'rgba(0,0,0,0)'); m.addColorStop(1, 'rgba(0,0,0,1)'); x.fillStyle = m; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(c, 0, 0); g.restore();
}
function sky(g, t, top = '#7fb8e6', bot = '#d9eef7') { const sg = g.createLinearGradient(0, 0, 0, H * 0.6); sg.addColorStop(0, top); sg.addColorStop(1, bot); g.fillStyle = sg; g.fillRect(0, 0, W, H); for (let i = 0; i < 6; i++) { const x = ((hash(i) * W * 1.4 + t * (8 + i * 3)) % (W + 600)) - 300, y = 60 + hash(i + 3) * 260, s = 0.8 + hash(i + 5); g.save(); g.globalAlpha = 0.9; g.fillStyle = '#fff'; for (let j = 0; j < 5; j++) { g.beginPath(); g.ellipse(x + j * 50 * s, y + Math.sin(j * 2) * 12 * s, 70 * s, 40 * s, 0, 0, 7); g.fill(); } g.restore(); } }
function blobTree(g, x, y, s, t, col = '#4f8a3c') { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(0, 4, 90, 18, 0, 0, 7); g.fill(); g.fillStyle = shadeCyl(g, -16, 16, '#7a5232'); g.fillRect(-16, -120, 32, 124); const sw = Math.sin(t * 1.2 + x) * 3; for (const [dx, dy, r] of [[0, -230, 110], [-80, -170, 80], [80, -175, 85], [-40, -290, 75], [50, -280, 80]]) { g.fillStyle = shadeRad(g, dx + sw, dy, r, col, 0.25, 0.3); g.beginPath(); g.arc(dx + sw, dy, r, 0, 7); g.fill(); } g.restore(); }
function parkBench(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(0, 6, 190, 22, 0, 0, 7); g.fill(); g.fillStyle = '#3a3a3a'; for (const lx of [-150, 150]) { g.fillRect(lx - 8, -70, 16, 76); } for (let i = 0; i < 3; i++) { g.fillStyle = shadeCyl(g, -180, 180, '#a0662f'); rr(g, -180, -70 - i * 4 + 0, 360, 16, 4); g.fill(); } for (let i = 0; i < 3; i++) { g.fillStyle = shadeCyl(g, -180, 180, '#b5753a'); rr(g, -180, -170 + i * 28, 360, 18, 4); g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke(); } g.fillStyle = '#3a3a3a'; for (const lx of [-150, 150]) g.fillRect(lx - 6, -175, 12, 110); g.restore(); }
// seat front drawn over a toy placed at (x, y-62) so it reads as sitting
function benchFront(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = shadeCyl(g, -180, 180, '#a0662f'); rr(g, -186, -66, 372, 20, 5); g.fill(); g.strokeStyle = OUT; g.lineWidth = 2.5; g.stroke(); g.fillStyle = '#3a3a3a'; for (const lx of [-150, 150]) g.fillRect(lx - 8, -48, 16, 54); g.restore(); }
function park(g, t, o = {}) {
  sky(g, t, o.sunset ? '#f0a46a' : '#7fb8e6', o.sunset ? '#ffe2b0' : '#e2f2f8');
  // distant hills + treeline
  g.fillStyle = '#9cc28a'; g.beginPath(); g.moveTo(0, H * 0.58); for (let x = 0; x <= W; x += 40) g.lineTo(x, H * 0.55 - Math.sin(x * 0.004 + 1) * 40 - Math.sin(x * 0.011) * 18); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  for (let i = 0; i < 14; i++) blobTree(g, -60 + i * 150 + hash(i) * 60, H * 0.6, 0.45 + hash(i + 2) * 0.2, t, i % 3 ? '#5f9a48' : '#4a8040');
  // lawn
  const lg = g.createLinearGradient(0, H * 0.6, 0, H); lg.addColorStop(0, '#86c060'); lg.addColorStop(1, '#5c9a3c'); g.fillStyle = lg; g.fillRect(0, H * 0.6, W, H * 0.4);
  // path
  g.fillStyle = '#e6d3a8'; g.beginPath(); g.moveTo(W * 0.35, H * 0.6); g.quadraticCurveTo(W * 0.42, H * 0.8, W * 0.2, H); g.lineTo(W * 0.62, H); g.quadraticCurveTo(W * 0.6, H * 0.78, W * 0.45, H * 0.6); g.fill();
  for (let i = 0; i < 120; i++) { const x = hash(i + 40) * W, y = H * 0.62 + hash(i + 41) * H * 0.38; g.strokeStyle = 'rgba(40,90,30,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y - 10); g.stroke(); }
  for (let i = 0; i < 18; i++) { const x = hash(i + 90) * W, y = H * 0.66 + hash(i + 91) * H * 0.3; g.fillStyle = ['#ffd23f', '#ff7aa2', '#ffffff'][i % 3]; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
  blobTree(g, 220, H * 0.78, 1.1, t); blobTree(g, 1720, H * 0.8, 1.2, t, '#4a8a3a');
  if (o.bench !== false) { parkBench(g, o.b1 || 760, 860, 1.0); if (o.two !== false) parkBench(g, o.b2 || 1240, 870, 1.0); }
}
function cityStreet(g, t, o = {}) {
  sky(g, t, o.night ? '#0d1a33' : '#9bc6ea', o.night ? '#33476b' : '#e8f2f8');
  for (let i = 0; i < 12; i++) { const x = i * 170 - 40, h = 300 + hash(i) * 330; g.fillStyle = shadeCyl(g, x, x + 160, ['#c9b49a', '#a8b8c8', '#d8c2a0', '#9aa8b5'][i % 4]); g.fillRect(x, H * 0.66 - h, 160, h); g.fillStyle = o.night ? 'rgba(255,220,140,0.85)' : 'rgba(60,90,120,0.55)'; for (let r = 0; r < h / 60 - 1; r++) for (let c = 0; c < 3; c++) if (hash(i * 31 + r * 7 + c) > 0.3) g.fillRect(x + 22 + c * 45, H * 0.66 - h + 30 + r * 60, 26, 34); }
  g.fillStyle = '#6a6e75'; g.fillRect(0, H * 0.66, W, H * 0.34); g.fillStyle = '#c9c4ba'; g.fillRect(0, H * 0.66, W, 70); g.strokeStyle = '#f2f2f2'; g.lineWidth = 10; g.setLineDash([80, 60]); g.beginPath(); g.moveTo(0, H * 0.86); g.lineTo(W, H * 0.86); g.stroke(); g.setLineDash([]);
}
function hospital(g, t) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#dfeef0'); bg.addColorStop(1, '#b8d6d8'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = '#cfe3e5'; g.fillRect(0, H * 0.7, W, H * 0.3); g.fillStyle = '#ffffff'; rr(g, 1300, 200, 380, 260, 20); g.fill(); g.strokeStyle = '#8fb2b5'; g.lineWidth = 6; g.stroke(); g.strokeStyle = '#2fbf71'; g.lineWidth = 6; g.beginPath(); for (let x = 0; x <= 340; x += 4) { const u = (x / 340 * 3 + t * 0.8) % 1; const y = u > 0.4 && u < 0.5 ? -Math.sin((u - 0.4) / 0.1 * Math.PI * 2) * 70 : 0; x ? g.lineTo(1320 + x, 330 + y) : g.moveTo(1320 + x, 330 + y); } g.stroke();
  g.fillStyle = '#e74c3c'; g.fillRect(250, 220, 40, 120); g.fillRect(210, 260, 120, 40);
}
function spaceBG(g, t, o = {}) { const bg = g.createRadialGradient(W * 0.5, H * 0.5, 50, W * 0.5, H * 0.5, W * 0.8); bg.addColorStop(0, '#1b2a4a'); bg.addColorStop(1, '#03060f'); g.fillStyle = bg; g.fillRect(0, 0, W, H); for (let i = 0; i < 300; i++) { const a = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.5 + hash(i)) + i)); g.fillStyle = `rgba(255,255,255,${a * hash(i + 2)})`; g.beginPath(); g.arc(hash(i) * W, hash(i + 1) * H, hash(i + 3) * 2.2, 0, 7); g.fill(); } g.save(); g.globalCompositeOperation = 'screen'; glow(g, W * 0.7, H * 0.3, 500, 'rgba(120,80,200,A)', 0.25); glow(g, W * 0.25, H * 0.7, 420, 'rgba(60,160,220,A)', 0.2); g.restore(); }
