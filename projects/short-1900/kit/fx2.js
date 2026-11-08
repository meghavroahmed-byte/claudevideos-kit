// fx2.js — extra motion layers used instead of captions
function cornersAnim(g, t, col = 'rgba(255,255,255,0.85)', k = 1) {
  if (k <= 0) return; const m = 60 + Math.sin(t * 2) * 6, L = 90 * easeOut(clamp(k)); g.save(); g.strokeStyle = col; g.lineWidth = 6; g.lineCap = 'round';
  [[m, m + 120, 1, 1], [PW - m, m + 120, -1, 1], [m, PH - m - 260, 1, -1], [PW - m, PH - m - 260, -1, -1]].forEach(([x, y, sx, sy]) => { g.beginPath(); g.moveTo(x, y + sy * L); g.lineTo(x, y); g.lineTo(x + sx * L, y); g.stroke(); });
  g.fillStyle = '#e5392f'; g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6); g.beginPath(); g.arc(m + 40, m + 160, 12, 0, 7); g.fill(); g.restore();
}
function mapGrid(g, t, a = 0.18, col = '40,80,80') {
  g.save(); g.strokeStyle = `rgba(${col},${a})`; g.lineWidth = 2; const off = (t * 30) % 120;
  for (let x = -120 + off; x < PW + 120; x += 120) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, PH); g.stroke(); }
  for (let y = -120 + off * 0.5; y < PH + 120; y += 120) { g.beginPath(); g.moveTo(0, y); g.lineTo(PW, y); g.stroke(); }
  g.fillStyle = `rgba(${col},${a * 3})`; for (let y = 0; y < PH; y += 40) { g.fillRect(0, y + (off % 40), y % 200 === 0 ? 30 : 14, 3); g.fillRect(PW - (y % 200 === 0 ? 30 : 14), y + (off % 40), 30, 3); }
  g.restore();
}
function shockwave(g, t, t0, cy = 1150) {
  const k = seg(t, t0 + 0.05, t0 + 2.2); if (k <= 0 || k >= 1) return; const e = easeOut(k); g.save(); g.translate(540, cy); g.scale(1, 0.32);
  g.strokeStyle = `rgba(255,220,170,${(1 - k) * 0.9})`; g.lineWidth = 50 * (1 - k) + 6; g.shadowColor = 'rgba(255,160,80,0.9)'; g.shadowBlur = 40; g.beginPath(); g.arc(0, 0, 80 + e * 1600, 0, 7); g.stroke(); g.restore();
}
function debris(g, t, t0, n = 60) {
  const lt = t - t0; if (lt <= 0 || lt > 3) return; g.save();
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (hash(i) - 0.5) * 2.6, v = 400 + hash(i + 3) * 900, x = 540 + Math.cos(a) * v * lt, y = 1050 + Math.sin(a) * v * lt + 500 * lt * lt, s = 3 + hash(i + 5) * 9;
    g.globalAlpha = clamp(1 - lt / 3); g.fillStyle = hash(i + 7) > 0.6 ? '#ffb070' : '#2a1d1d'; g.save(); g.translate(x, y); g.rotate(lt * 8 + i); g.fillRect(-s, -s / 2, s * 2, s); g.restore(); }
  g.restore();
}
function ecg(g, t, y, tFlat, col = '#e5392f') {
  g.save(); g.fillStyle = 'rgba(255,255,255,0.75)'; g.shadowColor = 'rgba(0,0,0,0.15)'; g.shadowBlur = 20; g.beginPath(); g.roundRect(70, y - 110, PW - 140, 220, 30); g.fill(); g.shadowColor = 'transparent';
  g.beginPath(); g.roundRect(70, y - 110, PW - 140, 220, 30); g.clip(); g.strokeStyle = 'rgba(229,57,47,0.12)'; g.lineWidth = 2; for (let x = 70; x < PW; x += 40) { g.beginPath(); g.moveTo(x, y - 110); g.lineTo(x, y + 110); g.stroke(); }
  const head = 90 + ((t * 420) % (PW - 180)); g.strokeStyle = col; g.lineWidth = 7; g.lineJoin = 'round'; g.shadowColor = col; g.shadowBlur = 14; g.beginPath();
  for (let x = 90; x <= head; x += 4) { const tt = t - (head - x) / 420, flat = tt > tFlat; const ph = (tt * 1.4) % 1; let v = 0; if (!flat) { if (ph > 0.3 && ph < 0.34) v = -70; else if (ph >= 0.34 && ph < 0.38) v = 60; else if (ph > 0.5 && ph < 0.6) v = -14 * Math.sin((ph - 0.5) / 0.1 * Math.PI); } x === 90 ? g.moveTo(x, y + v) : g.lineTo(x, y + v); }
  g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(head, y, 9, 0, 7); g.fill(); g.restore();
}
function missilePanel(g, t, launches, k) {
  if (k <= 0) return; g.save(); g.globalAlpha = clamp(k * 2); const x = 70, y = 1430, w = 560, h = 150; g.translate(0, (1 - easeOut(clamp(k))) * 200);
  g.fillStyle = 'rgba(40,46,50,0.88)'; g.shadowColor = 'rgba(0,0,0,0.25)'; g.shadowBlur = 24; g.beginPath(); g.roundRect(x, y, w, h, 28); g.fill(); g.shadowColor = 'transparent';
  launches.forEach((lt, i) => { const kk = easeOutBack(seg(t, lt, lt + 0.3)), cx = x + 50 + i * 64, cy = y + h / 2; g.save(); g.translate(cx, cy + (1 - clamp(kk)) * 40); g.globalAlpha = 0.25 + 0.75 * clamp(kk); g.rotate(-0.6);
    g.fillStyle = kk > 0 ? '#ff5a36' : '#888'; g.beginPath(); g.moveTo(0, -38); g.quadraticCurveTo(12, -20, 11, 20); g.lineTo(-11, 20); g.quadraticCurveTo(-12, -20, 0, -38); g.fill(); g.fillRect(-18, 10, 36, 8);
    if (kk > 0 && t - lt < 1.5) { g.fillStyle = '#ffd08a'; g.beginPath(); g.moveTo(-7, 22); g.lineTo(0, 22 + 22 + Math.sin(t * 40) * 6); g.lineTo(7, 22); g.fill(); } g.restore(); });
  g.restore();
}
function ripples(g, x, y, t, k, col = '229,57,47') {
  if (k <= 0) return; g.save(); g.translate(x, y); g.scale(1, 0.55);
  for (let i = 0; i < 4; i++) { const ph = (t * 0.6 + i / 4) % 1; g.strokeStyle = `rgba(${col},${(1 - ph) * 0.8 * k})`; g.lineWidth = 8 * (1 - ph) + 2; g.beginPath(); g.arc(0, 0, 60 + ph * 900, 0, 7); g.stroke(); }
  g.restore();
}
function oilFlow(g, t, pts, k, stopT) {
  if (k <= 0 || pts.length < 2) return; const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  const at = u => { let s = u * tot; for (let i = 0; i < L.length; i++) { if (s <= L[i]) { const f = s / L[i]; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; } s -= L[i]; } return pts[pts.length - 1]; };
  const tt = t < stopT ? t : stopT + (1 - Math.exp(-(t - stopT) * 4)) / 4, red = clamp((t - stopT) / 0.4);
  g.save(); for (let i = 0; i < 14; i++) { const u = (tt * 0.12 + i / 14) % 1, [x, y] = at(u); g.globalAlpha = k * Math.sin(u * Math.PI); g.fillStyle = red > 0 ? `rgb(${lerp(29, 229, red)},${lerp(35, 57, red)},${lerp(38, 47, red)})` : '#1d2326'; g.save(); g.translate(x, y); g.scale(0.55, 0.55); g.beginPath(); g.moveTo(0, -50); g.bezierCurveTo(40, 0, 50, 20, 50, 35); g.arc(0, 35, 50, 0, Math.PI); g.bezierCurveTo(-50, 20, -40, 0, 0, -50); g.fill(); g.restore(); } g.restore();
}
function orbitRing(g, t, k = 1) {
  if (k <= 0) return; g.save(); g.translate(540, 960); g.rotate(-0.35); g.globalAlpha = k;
  [[520, 0.28, 0.5], [600, 0.2, -0.35]].forEach(([r, sq, sp], j) => { g.save(); g.scale(1, sq); g.strokeStyle = 'rgba(255,190,140,0.45)'; g.lineWidth = 3; g.setLineDash([14, 12]); g.lineDashOffset = -t * 40; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); g.setLineDash([]);
    for (let i = 0; i < 3; i++) { const a = t * sp + i * 2.1 + j; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (Math.sin(a) < 0 && Math.abs(x) < 400) continue; g.fillStyle = '#ffd6a8'; g.shadowColor = '#ff9a5a'; g.shadowBlur = 20; g.beginPath(); g.arc(x, y, 9 / sq * 0.4 + 6, 0, 7); g.fill(); } g.restore(); });
  g.restore();
}
