// ===== topic scenes (all 2.5D, sit on the continuous floor) =====

// presenter: user's character on the floor beside a floating iso billboard of keywords
TPL.presenter = (g, t, b, o) => {
  const side = o.side || 'L', cx = side === 'L' ? 470 : W - 470, bx = side === 'L' ? W * 0.63 : W * 0.37;
  const P = ISO(bx, H * 0.66, 1), a = ib(b, t, 0.1, 0.6), col = o.col || PAL.gold;
  // billboard: vertical panel standing on floor (left face)
  if (o.board) {
    const bw = 560, bh = 380; floorShadow(g, P, -bw / 2, -20, bw, 60, 0.35);
    isoBox(g, P, -bw / 2 - 20, -10, 0, bw + 40, 40, 16, '#16213f', { rim: rgba(col, 0.6), alpha: a });
    onFace(g, P, 'left', -bw / 2, 30, 16 + bh * a, 1, c => {
      c.fillStyle = 'rgba(8,14,32,0.92)'; c.beginPath(); c.roundRect(0, 0, bw, bh * a, 18); c.fill(); c.strokeStyle = col; c.lineWidth = 4; c.stroke();
      if (a > 0.8) { c.font = `800 52px ${FONT_H}`; c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.board.title || '', bw / 2, 66);
        (o.board.items || []).forEach((it, i) => { const p = kp(b, t, i, 0.45); if (p <= 0) return; c.globalAlpha = p; c.font = `700 40px ${FONT_U}`; c.fillStyle = PAL.white; c.textAlign = 'left'; c.fillText(it, 80 + (1 - p) * 40, 150 + i * 70); c.fillStyle = col; c.beginPath(); c.arc(50, 150 + i * 70, 9, 0, 7); c.fill(); c.globalAlpha = 1; }); }
    });
  }
  if (o.icon) { const p = ib(b, t, 0.3, 0.6); badge(g, o.icon, bx + 20, H * 0.33, 120, col, p); }
  if (o.slam) slam(g, o.slam, bx, H * 0.3, kp(b, t, o.board ? (o.board.items || []).length : 0, 0.3), { size: 120, col: o.slamCol || PAL.white });
  charIn(g, t, cx, H * 0.95, o.s || 0.62, { pose: o.pose || 'front', up: o.up != null ? o.up * kp(b, t, 0, 0.5) : 0, upAng: o.upAng, loAng: o.loAng, wave: o.wave ? Math.sin(t * 6) * 10 : 0, rim: col, sx: side === 'R' && o.pose === 'side' ? 1 : 1, flip: o.flip });
};

// chapter card: reason number as big iso blocks + title
TPL.chapter = (g, t, b, o) => {
  const col = o.col || PAL.gold, P = ISO(W / 2 - 260, H * 0.58, 1.1), a = ib(b, t, 0, 0.7);
  const n = o.n || 1;
  for (let i = 0; i < 4; i++) { const on = i < n, h = (on ? 120 : 30) * a; floorShadow(g, P, i * 130 - 60, -60, 110, 110, 0.3); isoBox(g, P, i * 130 - 60, -60, 0, 110, 110, h, on ? col : '#1a2648', { rim: on ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.15)' }); if (on && i === n - 1) { const q = P(i * 130 - 5, -5, h); glow(g, q[0], q[1], 180, col, 0.6); txt(g, BN(n), q[0], q[1] - 6, { size: 90, col: PAL.ink, w: 800 }); } }
  txt(g, o.kicker || ('কারণ ' + BN(n)), W / 2, H * 0.2, { size: 44, col, w: 700, font: FONT_U, track: 8, alpha: ip(b, t, 0.3, 0.5) });
  slam(g, o.title || '', W / 2, H * 0.3, ip(b, t, 0.5, 0.4), { size: 104, col: PAL.white });
};

// crib experiment in iso: crib, baby, mobile, ribbon to ankle; kicking animates mobile
TPL.crib = (g, t, b, o) => {
  const P = ISO(W / 2 - 60, H * 0.68, 1.05), a = ip(b, t, 0, 0.6), d = t - b.t0;
  const ribbon = o.ribbon === 'key' ? kp(b, t, 0, 0.8) : (o.ribbon ? 1 : 0);
  const kick = o.kick === 'key' ? kp(b, t, o.ribbon === 'key' ? 1 : 0, 0.4) : (o.kick || 0);
  floorShadow(g, P, -260, -160, 520, 320, 0.45);
  isoBox(g, P, -260, -160, 0, 520, 320, 70, '#3c2a5c', { rim: 'rgba(255,220,255,0.5)', alpha: a });
  isoBox(g, P, -250, -150, 70, 500, 300, 16, '#e8e2f4', { rim: 'rgba(255,255,255,0.8)', alpha: a });
  // baby lying (iso blob)
  const bx = -40, by = 0; const kk = Math.abs(Math.sin(d * 8)) * 26 * kick;
  const head = P(bx - 120, by, 120), body = P(bx, by, 106), foot = P(bx + 120, by + 20, 100 + kk);
  g.save(); g.globalAlpha = a; g.fillStyle = '#ffd9c0'; g.beginPath(); g.ellipse(head[0], head[1], 46, 40, 0, 0, 7); g.fill(); g.strokeStyle = '#8a5a40'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#9fd6ff'; g.beginPath(); g.ellipse(body[0], body[1], 92, 46, -0.45, 0, 7); g.fill(); g.stroke();
  g.strokeStyle = '#ffd9c0'; g.lineWidth = 26; g.lineCap = 'round'; g.beginPath(); g.moveTo(body[0] + 50, body[1] + 10); g.lineTo(foot[0], foot[1]); g.stroke(); g.strokeStyle = '#ffd9c0'; g.beginPath(); g.moveTo(body[0] + 40, body[1] + 24); g.lineTo(foot[0] - 30, foot[1] + 30 - kk * 0.5); g.stroke(); g.restore();
  // crib bars (front)
  for (let k = 0; k <= 12; k++) { const p0 = P(-260 + k * 43, 160, 70), p1 = P(-260 + k * 43, 160, 190); g.strokeStyle = 'rgba(230,220,250,0.9)'; g.lineWidth = 5; g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); }
  const r0 = P(-260, 160, 190), r1 = P(260, 160, 190); g.lineWidth = 8; g.beginPath(); g.moveTo(r0[0], r0[1]); g.lineTo(r1[0], r1[1]); g.stroke();
  // mobile above
  const mp = P(0, -40, 470); g.strokeStyle = '#cfd6e6'; g.lineWidth = 5; const pole0 = P(-260, -160, 70); const pole1 = P(-260, -160, 520); g.beginPath(); g.moveTo(pole0[0], pole0[1]); g.lineTo(pole1[0], pole1[1]); g.lineTo(mp[0], mp[1] - 50); g.stroke();
  mobileToy(g, mp[0], mp[1] + 40, 0.95, t, Math.max(kick, o.idle || 0.15));
  if (ribbon > 0) { g.save(); g.strokeStyle = '#ff7aa8'; g.lineWidth = 5; g.shadowColor = '#ff7aa8'; g.shadowBlur = 12; strokeOn(g, ribbon, 1200); g.beginPath(); g.moveTo(foot[0], foot[1]); g.quadraticCurveTo(foot[0] + 140, (foot[1] + mp[1]) / 2, mp[0] + 140, mp[1] + 60); g.stroke(); g.restore(); }
  if (kick > 0.3) for (let k = 0; k < 3; k++) { const nt = (d * 0.9 + k / 3) % 1; txt(g, '♪', mp[0] - 220 + k * 220, mp[1] - 40 - nt * 160, { size: 60, col: PAL.gold, alpha: (1 - nt) * kick, font: 'Segoe UI Symbol' }); }
  (o.tags || []).forEach((tg, i) => chip(g, tg, W - 330, 280 + i * 90, i ? PAL.pink : PAL.gold, { size: 34, alpha: kp(b, t, (o.ribbon === 'key' ? 1 : 0) + (o.kick === 'key' ? 1 : 0) + i, 0.5) }));
};

// house with framed pictures; walls get demolished and rebuilt (neurogenesis analogy)
TPL.house = (g, t, b, o) => {
  const P = ISO(W / 2 + 40, H * 0.66, 1), a = ip(b, t, 0, 0.6), brk = o.demolish ? kp(b, t, 0, 1.4) : 0, rebuild = o.rebuild ? kp(b, t, 1, 1.4) : 0;
  isoBox(g, P, -360, -260, 0, 720, 520, 14, '#2a2f45', { rim: 'rgba(255,255,255,0.3)', alpha: a });
  const walls = [[-360, -260, 720, 20], [-360, -260, 20, 520], [-20, -260, 20, 300], [-360, 40, 360, 20]];
  walls.forEach((w, i) => { const fall = clamp(brk * 1.5 - i * 0.15); if (fall >= 1 && !rebuild) return;
    const h = 260 * (1 - fall) * a; if (h > 2) { isoBox(g, P, w[0], w[1], 14, w[2], w[3], h, '#d9cfc0', { rim: 'rgba(255,255,255,0.6)' });
      if (i < 2 && fall < 0.3) { const fx = i === 0 ? w[0] + 120 : w[0] + 20, fy = i === 0 ? w[1] + 20 : w[1] + 140; onFace(g, P, i === 0 ? 'left' : 'right', i === 0 ? -260 : -340, i === 0 ? -240 : -180, 14 + h - 40, 1, c => { for (let k = 0; k < 3; k++) { c.fillStyle = '#6b4a2a'; c.fillRect(k * 170, 0, 130, 110); c.fillStyle = ['#ffcf7a', '#8fd0ff', '#ff9fb8'][k]; c.fillRect(k * 170 + 10, 10, 110, 90); c.save(); c.translate(k * 170 + 65, 55); c.scale(1, -1); icon(c, ['baby', 'cake', 'heart'][k], 0, 0, 0.6, '#1d2236', 1, { glow: false }); c.restore(); } }); } }
    if (fall > 0 && fall < 1) for (let k = 0; k < 8; k++) { const q = P(w[0] + hash(k + i * 9) * w[2], w[1] + hash(k + i * 7) * w[3], 260 * (1 - fall) + k * 10); g.fillStyle = '#c9bca8'; g.fillRect(q[0] + (hash(k) - 0.5) * 80 * fall, q[1] + 140 * fall * fall, 16, 12); }
  });
  if (rebuild > 0) { const nw = [[-180, -100, 20, 360], [120, -260, 20, 300], [-360, -60, 300, 20]]; nw.forEach((w, i) => { const h = 260 * clamp(rebuild * 1.4 - i * 0.2); if (h > 2) isoBox(g, P, w[0], w[1], 14, w[2], w[3], h, '#8fe6b8', { rim: 'rgba(255,255,255,0.7)' }); }); }
  if (o.label) chip(g, o.label, W / 2, 140, o.col || PAL.pink, { size: 40, alpha: ip(b, t, 0.3, 0.4) });
};

// family photo album: baby photo with question
TPL.album = (g, t, b, o) => {
  const P = ISO(W / 2 - 40, H * 0.6, 1.05), a = ip(b, t, 0, 0.7), open = kp(b, t, 0, 0.9);
  floorShadow(g, P, -340, -230, 680, 460, 0.45);
  isoBox(g, P, -340, -230, 0, 680, 460, 30, '#6a2b3a', { rim: 'rgba(255,200,200,0.5)', alpha: a });
  isoBox(g, P, -320, -210, 30, 640, 420, 8, '#efe6d6', { rim: 'rgba(255,255,255,0.7)', alpha: a });
  onFace(g, P, 'top', -320, -210, 38, 1, c => { c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(318, 0, 4, 420);
    const ph = (x, y, k) => { c.save(); c.translate(x, y); c.rotate((k - 1) * 0.05); c.fillStyle = '#fff'; c.fillRect(-90, -100, 180, 210); c.fillStyle = ['#ffd6a8', '#a8d8ff', '#ffc2d1', '#c8f0c0'][k]; c.fillRect(-78, -88, 156, 156); c.save(); c.rotate(-Math.PI / 4); c.scale(1, 1.3); icon(c, 'baby', 0, 0, 1.0, '#2a2d40', 1, { glow: false }); c.restore(); c.restore(); };
    ph(160, 120, 0); ph(160, 300, 1); ph(480, 120, 2); ph(480, 300, 3); });
  if (o.q) { const p = kp(b, t, 1, 0.5); const q = P(160, 0, 200); if (p > 0) { glow(g, q[0], q[1], 200, PAL.violet, 0.5 * p); slam(g, o.q, q[0], q[1] - 60, p, { size: 130, col: PAL.violet }); } }
  if (o.label) chip(g, o.label, W / 2, 130, PAL.violet, { size: 40, alpha: ip(b, t, 0.4, 0.4) });
};

// lab mice: each mouse with a memory meter; neurogenesis up/down arrows
TPL.mice = (g, t, b, o) => {
  const P = ISO(W / 2, H * 0.62, 1), list = o.mice || [];
  list.forEach((m, i) => { const x = (i - (list.length - 1) / 2) * 420; const p = kb(b, t, 0, 0.5);
    isoBox(g, P, x - 150, -110, 0, 300, 220, 24, '#132551', { rim: rgba(m.col || PAL.cyan, 0.7), alpha: p });
    const q = P(x, 0, 24); icon(g, 'mouse', q[0], q[1] - 90, 1.6 * clamp(p), PAL.white, clamp(p), { lw: 5 });
    txt(g, m.label, q[0], q[1] + 120, { size: 36, col: m.col || PAL.cyan, w: 700, alpha: p });
    const mem = lerp(m.from, m.to, kp(b, t, 1, 1.6)); const bw = 220, bx = q[0] - bw / 2, by = q[1] - 250;
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.roundRect(bx, by, bw, 22, 11); g.fill(); g.fillStyle = mem > 0.5 ? PAL.green : PAL.red; g.beginPath(); g.roundRect(bx, by, Math.max(10, bw * mem), 22, 11); g.fill();
    txt(g, 'স্মৃতি', q[0], by - 30, { size: 26, font: FONT_U, col: PAL.white, alpha: p * 0.85, w: 600 });
    if (m.neuro) { const ap = kp(b, t, 1, 0.5); txt(g, m.neuro === 'up' ? '▲ নতুন কোষ' : '▼ নতুন কোষ', q[0], by - 76, { size: 30, font: FONT_U, col: m.neuro === 'up' ? PAL.green : PAL.gold, alpha: ap, w: 700 }); }
  });
};

// water poured without a container spreads and vanishes
TPL.water = (g, t, b, o) => {
  const P = ISO(W / 2, H * 0.6, 1), pour = kp(b, t, 0, 0.8), spread = kp(b, t, 1, 2.2), d = t - b.t0;
  // glass
  const gp = P(-150, -150, 260 + (1 - pour) * 0); g.save(); g.translate(gp[0], gp[1]); g.rotate(-pour * 1.9); g.strokeStyle = 'rgba(200,230,255,0.9)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-50, -90); g.lineTo(-40, 90); g.lineTo(40, 90); g.lineTo(50, -90); g.stroke(); g.fillStyle = rgba(PAL.cyan, 0.5 * (1 - spread)); g.fillRect(-44, -20 + pour * 40, 88, 108 - pour * 40); g.restore();
  if (pour > 0.4) { g.save(); g.strokeStyle = rgba(PAL.cyan, 0.7 * (1 - spread)); g.lineWidth = 16; g.beginPath(); const fl = P(-60, -60, 0); g.moveTo(gp[0] + 60, gp[1] + 20); g.quadraticCurveTo(gp[0] + 120, (gp[1] + fl[1]) / 2, fl[0], fl[1]); g.stroke(); g.restore(); }
  // puddle on floor (iso ellipse growing, fading)
  const r = 60 + spread * 520; const c0 = P(0, 0, 0); g.save(); g.translate(c0[0], c0[1]); g.scale(1, 0.55); g.globalAlpha = clamp(1 - spread * 0.95);
  g.fillStyle = rgba(PAL.cyan, 0.35); g.beginPath(); for (let a = 0; a <= 6.3; a += 0.15) { const rr = r * (0.85 + 0.15 * Math.sin(a * 6 + d)); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.fill(); g.strokeStyle = rgba(PAL.cyan, 0.8); g.lineWidth = 3; g.stroke(); g.restore();
  if (o.words) o.words.forEach((w, i) => { const q = P(Math.cos(i * 2.1) * (100 + spread * 300), Math.sin(i * 2.1) * (100 + spread * 300), 30 + spread * 120); txt(g, w, q[0], q[1], { size: 34, font: FONT_U, col: PAL.white, w: 600, alpha: clamp(1 - spread * 1.2) * kp(b, t, 0, 0.6) }); });
  if (o.label) chip(g, o.label, W / 2, 140, PAL.cyan, { size: 40, alpha: ip(b, t, 0.3, 0.4) });
};

// two lockers: episodic (cracking) vs procedural (sealed)
TPL.lockers = (g, t, b, o) => {
  const P = ISO(W / 2, H * 0.7, 1), L = o.items || [];
  L.forEach((it, i) => { const p = kb(b, t, i, 0.6); if (p <= 0) return; const x = (i - (L.length - 1) / 2) * 380 - 90, col = it.col || PAL.gold, h = 380 * p;
    floorShadow(g, P, x, -60, 180, 140, 0.4); isoBox(g, P, x, -60, 0, 180, 140, h, shade(col, -0.45), { rim: col, edge: rgba(col, 0.6) });
    onFace(g, P, 'left', x + 10, 80, h - 20, 1, c => { c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 3; c.strokeRect(0, 0, 160, h - 40); c.save(); c.translate(80, 90); c.scale(1, -1); c.restore(); });
    const q = P(x + 90, 80, h * 0.62); badge(g, it.icon || 'lock', q[0] - 10, q[1], 56, col, p);
    txt(g, it.l, q[0], P(x + 90, 80, 0)[1] + 70, { size: 38, col, w: 800, alpha: p, stroke: 6, strokeCol: 'rgba(5,8,18,0.85)' }); if (it.sub) txt(g, it.sub, q[0], P(x + 90, 80, 0)[1] + 118, { size: 28, col: PAL.white, font: FONT_U, w: 600, alpha: p });
    if (it.crack) { const cp = kp(b, t, L.length + i, 1.0); g.save(); g.strokeStyle = PAL.red; g.lineWidth = 4; strokeOn(g, cp, 600); const c1 = P(x + 20, 80, h * 0.9); g.beginPath(); g.moveTo(c1[0], c1[1]); g.lineTo(c1[0] + 40, c1[1] + 60); g.lineTo(c1[0] + 10, c1[1] + 120); g.lineTo(c1[0] + 70, c1[1] + 190); g.stroke(); g.restore(); }
    if (it.sealed) { const sp = kp(b, t, L.length + i, 0.6); glow(g, q[0], q[1], 160, PAL.green, 0.5 * sp); }
  });
};

// black hole gap swallowing memory cards
TPL.blackHole = (g, t, b, o) => {
  const cx = W / 2, cy = H * 0.5, a = ip(b, t, 0, 0.8), d = t - b.t0;
  for (let r = 5; r >= 0; r--) { g.save(); g.translate(cx, cy); g.rotate(d * (0.2 + r * 0.08)); g.scale(1, 0.38); g.strokeStyle = rgba(r % 2 ? PAL.violet : PAL.gold2, 0.25 + r * 0.06); g.lineWidth = 10 - r; g.beginPath(); g.arc(0, 0, (180 + r * 70) * a, 0, 5.4); g.stroke(); g.restore(); }
  const hg = g.createRadialGradient(cx, cy, 0, cx, cy, 200 * a); hg.addColorStop(0, '#000'); hg.addColorStop(0.75, '#000'); hg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = hg; g.beginPath(); g.arc(cx, cy, 200 * a, 0, 7); g.fill();
  g.strokeStyle = rgba(PAL.gold, 0.9); g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 150 * a, 0, 7); g.stroke(); glow(g, cx, cy, 360, PAL.violet, 0.35);
  const items = o.items || ['baby', 'cake', 'foot', 'mic', 'heart', 'spoon', 'photo', 'eye'];
  items.forEach((ic, i) => { const ph = ((d * 0.25 + i / items.length) % 1); const ang = i * 2.4 + ph * 5, rr = (1 - ph) * 700; const x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr * 0.45; const sc = 0.2 + (1 - ph) * 0.8; g.save(); g.translate(x, y); g.rotate(ph * 3); g.scale(sc, sc); g.globalAlpha = clamp((1 - ph) * 3) * a; g.fillStyle = '#f2ece0'; g.fillRect(-70, -80, 140, 160); g.fillStyle = '#2b3554'; g.fillRect(-58, -68, 116, 110); icon(g, ic, 0, -14, 0.8, PAL.gold, 1, { glow: false }); g.restore(); });
  if (o.label) slam(g, o.label, cx, H * 0.18, kp(b, t, 0, 0.35), { size: 96, col: PAL.white });
};

// "?" monolith with orbiting question cards
TPL.question = (g, t, b, o) => {
  const P = ISO(W / 2, H * 0.72, 1), a = ib(b, t, 0, 0.6), col = o.col || PAL.violet;
  floorShadow(g, P, -80, -80, 160, 160, 0.4); isoBox(g, P, -80, -80, 0, 160, 160, 300 * a, shade(col, -0.5), { rim: col, edge: rgba(col, 0.7) });
  const q = P(0, 80, 220 * a); onFace(g, P, 'left', -60, 80, 280 * a, 1, c => { c.save(); c.scale(1, 1); c.font = `900 220px ${FONT_H}`; c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'top'; c.fillText(o.mark || '?', 60, 0); c.restore(); });
  glow(g, q[0], q[1], 260, col, 0.5);
  (o.qs || []).forEach((s, i) => { const p = kp(b, t, i, 0.5); if (p <= 0) return; const an = i * 2.1 + (t - b.t0) * 0.3, x = W / 2 + Math.cos(an) * 520, y = H * 0.46 + Math.sin(an) * 170; const w = tw(g, s, 34, 700, FONT_U) + 60; g.save(); g.globalAlpha = p; glass(g, x - w / 2, y - 40, w, 80, { edge: rgba(col, 0.7) }); txt(g, s, x, y, { size: 34, font: FONT_U, col: PAL.white, w: 700 }); g.restore(); });
};

// sealed folder: experiences dropped into a folder labelled "আমার জীবনের গল্প" + seal
TPL.folder = (g, t, b, o) => {
  const P = ISO(W / 2 + 80, H * 0.66, 1.05), a = ip(b, t, 0, 0.6);
  floorShadow(g, P, -260, -180, 520, 360, 0.4); isoBox(g, P, -260, -180, 0, 520, 360, 40, '#d9a54a', { rim: 'rgba(255,240,200,0.7)', alpha: a });
  onFace(g, P, 'top', -260, -180, 40, 1, c => { c.font = `800 46px ${FONT_H}`; c.fillStyle = '#3a2408'; c.textAlign = 'center'; c.fillText(o.title || 'আমার জীবনের গল্প', 260, 190); });
  (o.items || ['drop', 'heart', 'mic']).forEach((ic, i) => { const p = kp(b, t, i, 0.8); const q0 = P(-200 + i * 200, -180, 520), q1 = P(-100 + i * 100, 0, 60); const x = lerp(q0[0], q1[0], easeIn(p)), y = lerp(q0[1], q1[1], easeIn(p)); if (p < 1 || !o.noNarrator) badge(g, ic, x, y, 54 * (1 - (o.noNarrator ? p * 0.6 : 0)), [PAL.cyan, PAL.pink, PAL.gold][i % 3], p > 0 ? 1 : 0); });
  if (o.seal) { const p = kb(b, t, (o.items || [1, 2, 3]).length, 0.4); if (p > 0) { const q = P(0, 0, 60); g.save(); g.translate(q[0], q[1] - 20); g.scale(lerp(2, 1, p), lerp(2, 1, p)); g.globalAlpha = clamp(p * 2); g.fillStyle = '#b3202a'; g.beginPath(); g.arc(0, 0, 70, 0, 7); g.fill(); txt(g, o.seal, 0, 4, { size: 34, col: '#ffe', w: 800 }); g.restore(); } }
  if (o.missing) { const p = kp(b, t, 3, 0.5); slam(g, o.missing, W / 2, H * 0.18, p, { size: 80, col: PAL.red }); }
};
const easeIn = t => clamp(t) * clamp(t);

// tenants: same room, old tenant (baby silhouette) leaves, new tenant (user) arrives
TPL.tenants = (g, t, b, o) => {
  const P = ISO(W / 2, H * 0.7, 1), a = ip(b, t, 0, 0.6), out = kp(b, t, 0, 1.6), inn = kp(b, t, 1, 1.4);
  isoBox(g, P, -340, -220, 0, 680, 440, 14, '#2b3150', { rim: 'rgba(255,255,255,0.3)', alpha: a });
  isoBox(g, P, -340, -220, 14, 680, 18, 260, '#c9c0b4', { rim: 'rgba(255,255,255,0.5)', alpha: a }); isoBox(g, P, -340, -220, 14, 18, 440, 260, '#b8ae9f', { rim: 'rgba(255,255,255,0.5)', alpha: a });
  const door = P(-340, 120, 14); g.fillStyle = '#05070c'; g.beginPath(); g.moveTo(door[0], door[1]); const d2 = P(-340, 220, 14), d3 = P(-340, 220, 220), d4 = P(-340, 120, 220); g.lineTo(d2[0], d2[1]); g.lineTo(d3[0], d3[1]); g.lineTo(d4[0], d4[1]); g.closePath(); g.fill();
  const bp = P(lerp(40, -330, out), lerp(0, 170, out), 14); g.save(); g.globalAlpha = 1 - clamp(out * 1.3 - 0.3); neonBaby(g, bp[0], bp[1] - 160, 0.9, PAL.pink, 1, t); g.restore();
  if (inn > 0) { const cp = P(lerp(-330, 60, inn), lerp(170, 20, inn), 14); charIn(g, t, cp[0], cp[1], 0.42, { pose: inn < 0.95 ? 'side' : 'front', p: t * 1.6, e: inn < 0.95 ? 1 : 0, flip: true, alpha: clamp(inn * 3), rim: PAL.gold }); }
  if (o.label) chip(g, o.label, W / 2, 130, PAL.gold, { size: 40, alpha: ip(b, t, 0.3, 0.4) });
};

// comment CTA
TPL.cta = (g, t, b, o) => {
  const a = ib(b, t, 0, 0.6); g.save(); g.globalAlpha = clamp(a * 2);
  glass(g, W / 2 - 520, H * 0.3, 1040, 300, { edge: rgba(PAL.gold, 0.7) });
  txt(g, o.title || 'আপনার প্রথম স্মৃতি কী?', W / 2, H * 0.3 + 70, { size: 56, col: PAL.gold, w: 800 });
  g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.roundRect(W / 2 - 460, H * 0.3 + 130, 920, 110, 18); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.stroke();
  txt(g, typeOn(o.type || 'আমার বয়স তখন ৩ বছর…', seg(t, b.t0 + 0.8, b.t0 + 3)) + (Math.floor(t * 2.5) % 2 ? '|' : ''), W / 2 - 430, H * 0.3 + 186, { size: 40, font: FONT_U, col: PAL.white, align: 'left', w: 500 });
  g.restore();
  const p1 = kp(b, t, 0, 0.4), p2 = kp(b, t, 1, 0.4);
  if (p1 > 0) { g.save(); g.translate(W / 2 - 220, H * 0.78); g.scale(easeOutBack(p1), easeOutBack(p1)); g.fillStyle = '#2a64ff'; g.beginPath(); g.roundRect(-170, -50, 340, 100, 50); g.fill(); txt(g, '👍  লাইক', 0, 3, { size: 40, col: PAL.white, w: 700, font: FONT_U }); g.restore(); }
  if (p2 > 0) { g.save(); g.translate(W / 2 + 220, H * 0.78); g.scale(easeOutBack(p2), easeOutBack(p2)); g.fillStyle = '#ff2b2b'; g.beginPath(); g.roundRect(-200, -50, 400, 100, 50); g.fill(); txt(g, 'সাবস্ক্রাইব', 0, 3, { size: 42, col: PAL.white, w: 800 }); g.restore(); glow(g, W / 2 + 220, H * 0.78, 200, PAL.red, 0.3 * p2); }
};

// four reasons summary grid (icons light up one by one)
TPL.four = (g, t, b, o) => {
  const P = ISO(W / 2, H * 0.62, 1), R4 = o.items || [];
  R4.forEach((r, i) => { const p = kb(b, t, i, 0.5), x = (i % 2) * 330 - 300, y = Math.floor(i / 2) * 330 - 300, on = o.hl == null || o.hl === i; const col = on ? r.col : '#2a3558';
    floorShadow(g, P, x, y, 260, 260, 0.35); isoBox(g, P, x, y, 0, 260, 260, (on ? 60 : 24) * clamp(p), shade(col, -0.5), { rim: col, edge: rgba(col, on ? 0.9 : 0.3) });
    const q = P(x + 130, y + 130, 60); badge(g, r.icon, q[0], q[1] - 70, 58, col, p); txt(g, r.l, q[0], q[1] + 46, { size: 34, col: on ? PAL.white : 'rgba(255,255,255,0.4)', w: 700, alpha: p, stroke: 6, strokeCol: 'rgba(5,8,18,0.85)' });
    txt(g, BN(i + 1), q[0] - 100, q[1] - 120, { size: 44, col, w: 800, alpha: p }); });
  if (o.title) txt(g, o.title, W / 2, 120, { size: 54, col: PAL.white, w: 800, alpha: ip(b, t, 0, 0.5) });
};

// connection wires between hippocampus and cortex: under construction for babies
TPL.wires = (g, t, b, o) => {
  const cx = W / 2 - 80, cy = H * 0.5, s = 1.55; brainSide(g, cx, cy, s, { mode: 'holo', col: PAL.cyan, hl: o.hl || 'hip', show: ['pfc'], t });
  const A = brainPt(cx, cy, s, 'hip'), Bp = brainPt(cx, cy, s, 'pfc'), done = o.done ? 1 : 0;
  for (let k = 0; k < 7; k++) { const p = kp(b, t, 0, 1.2); const off = (k - 3) * 16; g.save(); g.strokeStyle = done ? PAL.green : (k % 2 ? PAL.gold : 'rgba(255,198,92,0.35)'); g.lineWidth = 4; if (!done) g.setLineDash([18, 14]); g.lineDashOffset = -t * 30; const reach = done ? p : p * (0.35 + hash(k) * 0.45);
    g.beginPath(); for (let f = 0; f <= reach + 0.001; f += 0.02) { const x = lerp(A[0], Bp[0], f), y = lerp(A[1], Bp[1], f) - Math.sin(f * Math.PI) * (140 + off); f ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.restore();
    if (!done && p >= 1) { const f = 0.35 + hash(k) * 0.45, x = lerp(A[0], Bp[0], f), y = lerp(A[1], Bp[1], f) - Math.sin(f * Math.PI) * (140 + off); glow(g, x, y, 26, PAL.red, 0.6 + 0.4 * Math.sin(t * 8 + k)); } }
  if (o.tag) { const p = kp(b, t, 1, 0.4); if (p > 0) { g.save(); g.translate(W / 2 + 470, H * 0.24); g.rotate(-0.08); g.scale(easeOutBack(p), easeOutBack(p)); g.fillStyle = PAL.gold; g.beginPath(); g.roundRect(-230, -50, 460, 100, 12); g.fill(); for (let k = -230; k < 230; k += 40) { g.fillStyle = '#111'; g.beginPath(); g.moveTo(k, -50); g.lineTo(k + 20, -50); g.lineTo(k - 10, 50); g.lineTo(k - 30, 50); g.fill(); } g.fillStyle = 'rgba(255,198,92,0.92)'; g.fillRect(-200, -32, 400, 64); txt(g, o.tag, 0, 2, { size: 40, col: '#111', w: 800 }); g.restore(); } }
  (o.labels || []).forEach((L, i) => { const pt = i === 0 ? A : Bp; leader(g, pt[0], pt[1], pt[0] + (i ? -260 : 300), pt[1] + (i ? -200 : 230), L, i ? PAL.violet : PAL.gold, kp(b, t, 0, 0.6), { size: 36 }); });
};
