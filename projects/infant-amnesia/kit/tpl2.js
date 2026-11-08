// ===== named animation types 12-30 =====

// 12 PAPER DESK — iso desk, research paper slides off a stack, title + stamp
TPL.paperDesk = (g, t, b, o) => {
  const P = ISO(W / 2 - 80, H * 0.6, 1.05), a = ip(b, t, 0, 0.6);
  g.save(); g.globalAlpha = a;
  floorShadow(g, P, -380, -260, 760, 520, 0.4);
  isoBox(g, P, -380, -260, 0, 760, 520, 60, '#5a3a24', { rim: 'rgba(255,210,160,0.5)' });
  for (let i = 0; i < 5; i++) isoBox(g, P, -300 + i * 3, -200 - i * 2, 60 + i * 6, 300, 380, 6, '#d9d2c2', { rim: 'rgba(255,255,255,0.5)' });
  const s = kp(b, t, 0, 0.9);
  const px = -300 + s * 340, pz = 90 + Math.sin(s * Math.PI) * 60;
  isoBox(g, P, px, -200, pz, 300, 380, 6, '#f4efe4', { rim: 'rgba(255,255,255,0.8)' });
  onFace(g, P, 'top', px, -200, pz + 6, 1, c => {
    c.fillStyle = '#1b1b22'; c.font = `800 30px ${FONT_H}`; c.textAlign = 'center'; wrapText(c, o.title || '', 150, 60, 260, 38);
    c.font = `600 20px ${FONT_U}`; c.fillStyle = '#4a4a55'; c.fillText(o.author || '', 150, 170); c.fillText(o.inst || '', 150, 198);
    c.fillStyle = 'rgba(30,30,40,0.22)'; for (let i = 0; i < 6; i++) c.fillRect(30, 230 + i * 22, 240, 9);
  });
  // coffee + pen props
  isoCylinder(g, P, 260, 120, 60, 34, 70, '#e9e4da'); isoBox(g, P, 150, -230, 60, 180, 14, 8, PAL.gold, {});
  g.restore();
  if (o.year) { const p = kb(b, t, 1, 0.4); if (p > 0) { const q = P(px + 150, 0, pz + 140); chip(g, o.year, q[0], q[1], PAL.gold, { size: 44, scale: p, fill: 'rgba(8,12,26,0.92)' }); } }
};
function wrapText(c, s, x, y, maxW, lh) { const words = s.split(' '); let line = '', yy = y; for (const w of words) { const test = line ? line + ' ' + w : w; if (c.measureText(test).width > maxW && line) { c.fillText(line, x, yy); line = w; yy += lh; } else line = test; } c.fillText(line, x, yy); }
function isoCylinder(g, P, x, y, z, r, h, col) {
  const c0 = P(x, y, z), c1 = P(x, y, z + h), rx = r * C30 * 1.4, ry = r * S30 * 1.4;
  g.save(); const gr = g.createLinearGradient(c0[0] - rx, 0, c0[0] + rx, 0); gr.addColorStop(0, shade(col, -0.5)); gr.addColorStop(0.6, shade(col, 0.1)); gr.addColorStop(1, shade(col, -0.3));
  g.fillStyle = gr; g.beginPath(); g.ellipse(c0[0], c0[1], rx, ry, 0, 0, Math.PI); g.lineTo(c1[0] - rx, c1[1]); g.ellipse(c1[0], c1[1], rx, ry, 0, Math.PI, 0, true); g.closePath(); g.fill();
  g.fillStyle = shade(col, 0.25); g.beginPath(); g.ellipse(c1[0], c1[1], rx, ry, 0, 0, 7); g.fill(); g.fillStyle = '#3b2414'; g.beginPath(); g.ellipse(c1[0], c1[1], rx * 0.8, ry * 0.8, 0, 0, 7); g.fill(); g.restore();
}

// 13 LAPTOP REVEAL — iso laptop lid swings open, screen shows a "memory file" being saved
TPL.laptopReveal = (g, t, b, o) => {
  const P = ISO(W / 2 - 40, H * 0.66, 1.15), open = kp(b, t, 0, 1.0), lw = 520, ld = 340;
  floorShadow(g, P, -lw / 2, -ld / 2, lw, ld, 0.45);
  isoBox(g, P, -lw / 2, -ld / 2, 0, lw, ld, 18, '#9aa3b5', { rim: 'rgba(255,255,255,0.7)' });
  onFace(g, P, 'top', -lw / 2, -ld / 2, 18, 1, c => { c.fillStyle = '#20242e'; for (let r = 0; r < 4; r++) for (let k = 0; k < 12; k++) { c.beginPath(); c.roundRect(30 + k * 38, 30 + r * 38, 32, 32, 4); c.fill(); } c.fillStyle = '#7d8596'; c.beginPath(); c.roundRect(180, 200, 160, 100, 8); c.fill(); });
  // lid: rotate around back edge (y = -ld/2). angle from 0 (closed) to ~105deg
  const ang = lerp(0, 1.85, open), hl = ld;
  const Q = (u, v) => { const yy = -ld / 2 - Math.sin(ang - Math.PI / 2 + Math.PI / 2) * 0 - v * Math.cos(ang) * -1; return P(-lw / 2 + u, -ld / 2 + v * Math.cos(ang), 18 + v * Math.sin(ang)); };
  const c00 = Q(0, 0), c10 = Q(lw, 0), c11 = Q(lw, hl), c01 = Q(0, hl);
  g.save(); poly(g, [c00, c10, c11, c01]); g.fillStyle = '#c8cfdc'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; g.stroke(); g.restore();
  if (ang > Math.PI / 2) { // screen visible
    const ins = (u, v) => Q(u, v);
    const s00 = ins(18, 18), s10 = ins(lw - 18, 18), s01 = ins(18, hl - 18);
    g.save(); g.transform((s10[0] - s00[0]) / 480, (s10[1] - s00[1]) / 480, (s01[0] - s00[0]) / 300, (s01[1] - s00[1]) / 300, s00[0], s00[1]);
    g.fillStyle = '#0a1230'; g.fillRect(0, 0, 480, 300);
    g.save(); g.scale(1, -1); g.translate(0, -300); screenContent(g, t, b, o); g.restore();
    g.restore(); const sc = Q(lw / 2, hl / 2); glow(g, sc[0], sc[1], 260, PAL.cyan, 0.35 * clamp((ang - 1.6) * 4));
  }
};
function screenContent(c, t, b, o) {
  const p = seg(t, KT(b, 1), KT(b, 1) + 2.5);
  icon(c, o.icon || 'film', 120, 120, 1.1, PAL.cyan, 1);
  c.font = `700 30px ${FONT_U}`; c.fillStyle = PAL.white; c.textAlign = 'left'; c.fillText(o.file || 'স্মৃতি.mp4', 200, 110);
  c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(200, 140, 240, 18); c.fillStyle = PAL.green; c.fillRect(200, 140, 240 * p, 18);
  c.font = `600 22px ${FONT_U}`; c.fillStyle = rgba(PAL.green, 0.9); c.fillText(p >= 1 ? (o.done || 'সেভ হয়েছে ✓') : (o.doing || 'সেভ হচ্ছে… ') + BN(Math.floor(p * 100)) + '%', 200, 190);
}

// 14 NOTIFICATIONS — phone with notification cards stacking in
TPL.notifications = (g, t, b, o) => {
  const cx = o.x || W / 2, cy = H * 0.53, a = ib(b, t, 0, 0.6), pw = 470, ph = 880;
  g.save(); g.translate(cx, cy); g.rotate(-0.06); g.scale(lerp(0.8, 1, a), lerp(0.8, 1, a)); g.globalAlpha = clamp(a * 2);
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.roundRect(-pw / 2 + 26, -ph / 2 + 30, pw, ph, 60); g.fill();
  g.fillStyle = '#151a26'; g.beginPath(); g.roundRect(-pw / 2, -ph / 2, pw, ph, 60); g.fill(); g.strokeStyle = '#59627a'; g.lineWidth = 6; g.stroke();
  const sg = g.createLinearGradient(0, -ph / 2, 0, ph / 2); sg.addColorStop(0, '#24315f'); sg.addColorStop(1, '#0b1026'); g.fillStyle = sg; g.beginPath(); g.roundRect(-pw / 2 + 16, -ph / 2 + 16, pw - 32, ph - 32, 46); g.fill();
  txt(g, o.clock || '১১:৪৮', 0, -ph / 2 + 120, { size: 96, col: PAL.white, w: 600, font: FONT_U });
  (o.items || []).forEach((it, i) => {
    const p = kb(b, t, i, 0.5); if (p <= 0) return; const y = -ph / 2 + 230 + i * 128;
    g.save(); g.translate((1 - p) * 300, 0); g.globalAlpha = clamp(p * 2);
    g.fillStyle = 'rgba(240,240,250,0.92)'; g.beginPath(); g.roundRect(-pw / 2 + 34, y, pw - 68, 110, 22); g.fill();
    g.fillStyle = it.col || PAL.violet; g.beginPath(); g.roundRect(-pw / 2 + 52, y + 22, 64, 64, 16); g.fill(); icon(g, it.icon || 'q', -pw / 2 + 84, y + 54, 0.5, PAL.white, 1, { glow: false, lw: 5 });
    txt(g, it.app || 'মস্তিষ্ক', -pw / 2 + 134, y + 34, { size: 20, font: FONT_U, col: '#555b6e', align: 'left', w: 600 });
    txt(g, it.s, -pw / 2 + 134, y + 72, { size: 28, font: FONT_U, col: '#12141c', align: 'left', w: 700 });
    g.restore();
  });
  g.restore();
};

// 15 ISO FLOW — iso slabs (nodes) on the floor connected by flowing particle pipes
TPL.isoFlow = (g, t, b, o) => {
  const P = ISO(W / 2, H * 0.6, 1), nodes = o.nodes || [], byId = {};
  nodes.forEach((n, i) => byId[n.id] = Object.assign({ i }, n));
  // edges first (on floor)
  (o.edges || []).forEach(([A, B, k], ei) => {
    const a = byId[A], c = byId[B]; const p = kp(b, t, k != null ? k : c.i, 0.8); if (p <= 0) return;
    const p0 = P(a.x, a.y, 30), p1 = P(c.x, c.y, 30);
    g.save(); g.strokeStyle = rgba(c.col || PAL.cyan, 0.35); g.lineWidth = 10; g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(lerp(p0[0], p1[0], p), lerp(p0[1], p1[1], p)); g.stroke();
    g.strokeStyle = c.col || PAL.cyan; g.lineWidth = 3; g.stroke(); g.restore();
    if (p >= 1) for (let k2 = 0; k2 < 4; k2++) { const f = ((t * 0.7 + k2 / 4 + ei * 0.13) % 1); glow(g, lerp(p0[0], p1[0], f), lerp(p0[1], p1[1], f), 22, c.col || PAL.cyan, 1); }
  });
  nodes.forEach((n, i) => {
    const p = kb(b, t, n.k != null ? n.k : i, 0.5); if (p <= 0) return; const col = n.col || PAL.cyan, sz = n.big ? 170 : 120, h = 30 * p + (n.big ? 30 : 0);
    floorShadow(g, P, n.x - sz / 2, n.y - sz / 2, sz, sz, 0.35);
    isoBox(g, P, n.x - sz / 2, n.y - sz / 2, 0, sz, sz, h, shade(col, -0.6), { rim: col, edge: rgba(col, 0.8) });
    const q = P(n.x, n.y, h); badge(g, n.icon || 'brain', q[0], q[1] - 70, n.big ? 64 : 50, col, p);
    txt(g, n.label, q[0], q[1] + (n.big ? 120 : 96), { size: n.big ? 40 : 32, col: PAL.white, w: 700, alpha: p, stroke: 6, strokeCol: 'rgba(5,8,18,0.85)' });
  });
};

// 16 INK WASH — memory polaroids on the floor get swallowed by spreading black ink
TPL.inkWash = (g, t, b, o) => {
  const P = ISO(W / 2, H * 0.55, 1), items = o.items || ['baby', 'cake', 'foot', 'heart', 'mic', 'spoon'];
  items.forEach((ic, i) => {
    const x = (i % 3 - 1) * 260, y = (Math.floor(i / 3) - 0.5) * 300, p = ib(b, t, 0.1 + i * 0.15, 0.5);
    if (p <= 0) return; isoBox(g, P, x - 100, y - 110, 0, 200, 230, 6, '#efe9dd', { rim: 'rgba(255,255,255,0.8)', alpha: p });
    onFace(g, P, 'top', x - 100, y - 110, 6, 1, c => { c.fillStyle = '#26324f'; c.fillRect(16, 16, 168, 168); c.save(); c.translate(100, 100); c.rotate(-Math.PI / 4); c.scale(1, 1.4); icon(c, ic, 0, 0, 1.1, PAL.gold, 1, { glow: false }); c.restore(); });
  });
  // ink: blobs growing from points (drawn on floor plane)
  const ip0 = KT(b, 0), pr = clamp((t - ip0) / Math.max(1.5, o.dur || 2.6));
  if (pr > 0) { g.save(); const m = [C30, S30, -C30, S30, P(0, 0)[0], P(0, 0)[1]]; g.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
    g.fillStyle = '#020306'; for (let k = 0; k < 18; k++) { const bx = (hash(k) - 0.5) * 900, by = (hash(k + 4) - 0.5) * 700; const r = easeOut(clamp(pr * 1.4 - hash(k + 8) * 0.4)) * (180 + hash(k + 2) * 260); if (r <= 0) continue; g.beginPath(); for (let a = 0; a <= 6.3; a += 0.3) { const rr = r * (0.85 + 0.15 * Math.sin(a * 5 + k + t)); g.lineTo(bx + Math.cos(a) * rr, by + Math.sin(a) * rr); } g.fill(); }
    g.restore(); }
  if (o.word) slam(g, o.word, W / 2, H * 0.24, kp(b, t, 1, 0.4), { col: PAL.white, size: 110 });
};

// 17 TYPE SLAM — words slam onto screen one after another with impact shake
TPL.typeSlam = (g, t, b, o) => {
  const words = o.words || []; let shake = 0;
  words.forEach((w, i) => { const st = KT(b, i), d = t - st; if (d > 0 && d < 0.25) shake = Math.max(shake, (0.25 - d) * 60); });
  g.save(); g.translate((hash(Math.floor(t * 60)) - 0.5) * shake, (hash(Math.floor(t * 60) + 3) - 0.5) * shake);
  words.forEach((w, i) => { const p = kp(b, t, i, 0.28); if (p <= 0) return; const later = words.slice(i + 1).some((_, j) => t > KT(b, i + 1 + j)); const y = w.y != null ? w.y : H / 2 + (i - (words.length - 1) / 2) * (w.size || 130) * 1.05;
    slam(g, w.s, w.x || W / 2, y, p, { col: w.col || PAL.white, size: w.size || 130, alpha: later && o.stack === false ? 0.25 : 1, glow: w.col ? w.col : null, blur: 30 });
    if (p > 0 && p < 1) glow(g, w.x || W / 2, y, 300, w.col || PAL.white, 0.25 * (1 - p)); });
  g.restore();
};

// 18 DAY COUNTER — calendar grid, days crossed off, big counter + stamp
TPL.dayCounter = (g, t, b, o) => {
  const P = ISO(W / 2 + 140, H * 0.5, 1), cols = 7, rows = 5, cell = 92, n = o.days || 14, a = ip(b, t, 0, 0.5);
  const run = seg(t, KT(b, 0), KT(b, 0) + (o.runDur || 3));
  isoBox(g, P, -cols * cell / 2 - 30, -rows * cell / 2 - 30, 0, cols * cell + 60, rows * cell + 60, 14, '#f1ece2', { rim: 'rgba(255,255,255,0.8)', alpha: a });
  onFace(g, P, 'top', -cols * cell / 2 - 30, -rows * cell / 2 - 30, 14, 1, c => {
    c.fillStyle = o.col || PAL.red; c.fillRect(0, 0, cols * cell + 60, 26);
    for (let i = 0; i < cols * rows; i++) { const x = 30 + (i % cols) * cell, y = 40 + Math.floor(i / cols) * cell; c.strokeStyle = 'rgba(0,0,0,0.15)'; c.lineWidth = 2; c.strokeRect(x, y, cell - 6, cell - 6); c.font = `700 30px ${FONT_U}`; c.fillStyle = '#333'; c.textAlign = 'center'; c.fillText(BN(i + 1), x + cell / 2 - 3, y + 40);
      if (i < n * run) { c.strokeStyle = o.col || PAL.red; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 14, y + 14); c.lineTo(x + cell - 20, y + cell - 20); c.moveTo(x + cell - 20, y + 14); c.lineTo(x + 14, y + cell - 20); c.stroke(); } }
  });
  const v = Math.floor(n * run); txt(g, BN(v), 380, H * 0.48, { size: 230, col: o.col || PAL.red, w: 800, alpha: a, glow: o.col || PAL.red, blur: 30 });
  txt(g, o.unit || 'দিন', 380, H * 0.48 + 150, { size: 54, col: PAL.white, w: 700, alpha: a });
  if (o.stamp) { const p = kb(b, t, 1, 0.35); if (p > 0) { g.save(); g.translate(W / 2 + 180, H * 0.5); g.rotate(-0.2); const sc = lerp(2, 1, p); g.scale(sc, sc); g.globalAlpha = clamp(p * 2); g.strokeStyle = o.stampCol || PAL.green; g.lineWidth = 9; g.beginPath(); g.roundRect(-230, -70, 460, 140, 16); g.stroke(); txt(g, o.stamp, 0, 4, { size: 66, col: o.stampCol || PAL.green, w: 800 }); g.restore(); } }
};

// 19 HOLOGRAM — projector disk on the floor, light cone, rotating holographic subject
TPL.hologram = (g, t, b, o) => {
  const cx = o.x || W / 2, base = H * 0.82, a = ip(b, t, 0, 0.7), col = o.col || PAL.cyan;
  // projector
  g.save(); g.fillStyle = '#0b1328'; g.beginPath(); g.ellipse(cx, base, 230, 66, 0, 0, 7); g.fill(); g.strokeStyle = rgba(col, 0.9); g.lineWidth = 4; g.stroke(); g.beginPath(); g.ellipse(cx, base, 170, 46, 0, 0, 7); g.strokeStyle = rgba(col, 0.4); g.stroke(); g.restore();
  // cone
  const cg = g.createLinearGradient(0, base, 0, base - 640); cg.addColorStop(0, rgba(col, 0.32 * a)); cg.addColorStop(1, rgba(col, 0)); g.fillStyle = cg; g.beginPath(); g.moveTo(cx - 170, base); g.lineTo(cx - 380, base - 640); g.lineTo(cx + 380, base - 640); g.lineTo(cx + 170, base); g.fill();
  // subject with scanline flicker
  const HC = tmpCanvas('HOLO'); const hg = HC.getContext('2d'); hg.setTransform(1, 0, 0, 1, 0, 0); hg.clearRect(0, 0, W, H);
  const rot = Math.sin((t - b.t0) * 0.8) * 0.25, sx = Math.cos((t - b.t0) * 0.9);
  hg.save(); hg.translate(cx, base - 330); hg.scale(0.85 + 0.15 * Math.abs(sx), 1); hg.translate(-cx, -(base - 330));
  if (o.what === 'baby') neonBaby(hg, cx, base - 300, 1.3, col, 1, t); else if (o.what === 'person') neonPerson(hg, cx, base - 330, 1.4, col, 1, t); else brainSide(hg, cx, base - 330, 1.25 * a, { mode: 'holo', col, hl: o.hl, show: o.show, t });
  hg.restore();
  hg.globalCompositeOperation = 'destination-out'; hg.fillStyle = 'rgba(0,0,0,0.35)'; for (let y = (t * 80) % 8; y < H; y += 8) hg.fillRect(0, y, W, 3); hg.globalCompositeOperation = 'source-over';
  g.save(); g.globalAlpha = a * (0.85 + 0.15 * Math.sin(t * 40) * (hash(Math.floor(t * 12)) > 0.85 ? 1 : 0)); g.globalCompositeOperation = 'lighter'; g.drawImage(HC, 0, 0); g.restore();
  if (o.hl && BRAIN_PT[o.hl] && o.what !== 'baby' && o.what !== 'person') { const pp = brainPt(cx, base - 330, 1.25, o.hl); leader(g, pp[0], pp[1], cx + 470, base - 560, o.label || '', PAL.gold, kp(b, t, 0, 0.6), { sub: o.sub }); }
  else if (o.label) txt(g, o.label, cx, base + 110, { size: 50, col: PAL.white, w: 800, alpha: kp(b, t, 0, 0.5) });
};
const TMPC = {}; function tmpCanvas(k) { return TMPC[k] || (TMPC[k] = mk(W, H)); }

// 20 INK DOODLE — hand-drawn wobbly doodles on paper (memories as sketches)
TPL.inkDoodle = (g, t, b, o) => {
  const P = ISO(W / 2, H * 0.3, 1), a = ip(b, t, 0, 0.5), sw = 1200, sh = 760;
  isoBox(g, P, -sw / 2, -sh / 2 + 160, 0, sw, sh, 6, '#f3eee3', { rim: 'rgba(255,255,255,0.8)', alpha: a });
  onFace(g, P, 'top', -sw / 2, -sh / 2 + 160, 6, 1, c => {
    c.strokeStyle = 'rgba(80,120,200,0.25)'; c.lineWidth = 2; for (let y = 60; y < sh; y += 46) { c.beginPath(); c.moveTo(0, y); c.lineTo(sw, y); c.stroke(); } c.strokeStyle = 'rgba(220,60,60,0.35)'; c.beginPath(); c.moveTo(90, 0); c.lineTo(90, sh); c.stroke();
    (o.items || []).forEach((it, i) => { const p = kp(b, t, i, 0.9); if (p <= 0) return; const x = 260 + (i % 3) * 330, y = 220 + Math.floor(i / 3) * 300;
      c.save(); c.translate(x, y); c.rotate(-Math.PI / 4); c.scale(1.7, 2.2); c.translate(Math.sin(t * 9 + i) * 0.6, Math.cos(t * 8 + i) * 0.6);
      c.strokeStyle = it.col || '#1d2236'; c.lineWidth = 3.4; c.lineCap = 'round'; c.lineJoin = 'round'; strokeOn(c, p, 900); ICON[it.icon](c); c.stroke(); c.setLineDash([]); c.restore();
      c.save(); c.translate(x, y); c.rotate(-Math.PI / 4); c.scale(1, 1.25); c.font = `700 30px ${FONT_U}`; c.fillStyle = '#1d2236'; c.textAlign = 'center'; c.globalAlpha = clamp(p * 2 - 1); c.fillText(it.l || '', 0, 110); c.restore(); });
    if (o.fade) { const f = kp(b, t, (o.items || []).length, 1.6); c.fillStyle = `rgba(243,238,227,${f})`; c.fillRect(0, 0, sw, sh); }
  });
};

// 21 DEEP TIME — a timeline runway receding into the distance; markers fly toward camera
TPL.deepTime = (g, t, b, o) => {
  const marks = o.marks || [], hz = H * 0.28, cx = W / 2, d = t - b.t0;
  const travel = o.travel != null ? o.travel : d * (o.speed || 0.35);
  // runway
  g.save(); const rg = g.createLinearGradient(0, hz, 0, H); rg.addColorStop(0, 'rgba(255,198,92,0)'); rg.addColorStop(1, 'rgba(255,198,92,0.25)'); g.fillStyle = rg; g.beginPath(); g.moveTo(cx - 20, hz); g.lineTo(cx + 20, hz); g.lineTo(cx + 760, H); g.lineTo(cx - 760, H); g.fill();
  g.strokeStyle = rgba(PAL.gold, 0.8); g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 20, hz); g.lineTo(cx - 760, H); g.moveTo(cx + 20, hz); g.lineTo(cx + 760, H); g.stroke();
  for (let k = 0; k < 24; k++) { const z = ((k / 24 + travel) % 1); const y = hz + (H - hz) * Math.pow(z, 2.2); g.strokeStyle = `rgba(255,198,92,${0.15 + z * 0.5})`; g.lineWidth = 1 + z * 3; const hw = 20 + 740 * Math.pow(z, 2.2); g.beginPath(); g.moveTo(cx - hw, y); g.lineTo(cx + hw, y); g.stroke(); }
  g.restore(); glow(g, cx, hz, 260, o.col || PAL.violet, 0.6);
  // marks: each has position pos (0 far .. 1 near) = m.z + travel
  marks.forEach((m, i) => { const p = kp(b, t, i, 0.5); if (p <= 0) return; const z = clamp((m.z != null ? m.z : 0.15 + i * 0.2) + (o.travel != null ? 0 : travel * 0.5), 0, 1.05); const k = Math.pow(z, 2.2), y = hz + (H - hz) * k, sc = 0.25 + k * 1.2, x = cx + (m.side || (i % 2 ? 1 : -1)) * (60 + 680 * k);
    g.save(); g.globalAlpha = p * clamp((1.05 - z) * 6); g.translate(x, y - 60 * sc); g.scale(sc, sc);
    if (m.hole) { const gr = g.createRadialGradient(0, -40, 10, 0, -40, 200); gr.addColorStop(0, '#000'); gr.addColorStop(0.6, 'rgba(0,0,0,0.9)'); gr.addColorStop(1, 'rgba(160,123,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, -40, 200, 0, 7); g.fill(); g.strokeStyle = PAL.violet; g.lineWidth = 4; for (let r = 0; r < 3; r++) { g.beginPath(); g.ellipse(0, -40, 120 + r * 30, 40 + r * 10, t * (0.5 + r * 0.2), 0, 5); g.stroke(); } }
    glass(g, -180, -150, 360, 150, { edge: rgba(m.col || PAL.gold, 0.8) }); txt(g, m.label, 0, -96, { size: 62, col: m.col || PAL.gold, w: 800 }); if (m.sub) txt(g, m.sub, 0, -40, { size: 30, font: FONT_U, col: PAL.white, w: 600 });
    g.restore(); });
};

// 22 CONTOUR MAP — topographic rings (depth of the brain / fog), marker dives
TPL.contourMap = (g, t, b, o) => {
  const P = ISO(W / 2, H * 0.56, 1), col = o.col || PAL.teal, a = ip(b, t, 0, 0.6), d = t - b.t0;
  g.save(); const m = P(0, 0); g.setTransform(C30, S30, -C30, S30, m[0], m[1]);
  for (let r = 14; r >= 1; r--) { const rr = r * 34 + Math.sin(t * 0.8 + r) * 4; g.beginPath(); for (let k = 0; k <= 64; k++) { const an = k / 64 * 6.283; const w2 = rr * (1 + 0.12 * Math.sin(an * 3 + r * 0.7) + 0.08 * Math.cos(an * 5 - r)); g.lineTo(Math.cos(an) * w2, Math.sin(an) * w2 * 1.1); } g.closePath();
    g.fillStyle = `rgba(${10 + r * 4},${30 + r * 8},${60 + r * 10},${0.9 * a})`; g.fill(); g.strokeStyle = rgba(col, (0.25 + (14 - r) * 0.05) * a); g.lineWidth = 2.2; g.stroke(); }
  g.restore();
  // depth meter
  const dp = kp(b, t, 0, 2.0); const q = P(0, 0, 0); g.save(); g.strokeStyle = PAL.white; g.lineWidth = 3; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(q[0], q[1] - 360); g.lineTo(q[0], q[1] - 360 + 360 * dp); g.stroke(); g.restore();
  glow(g, q[0], q[1] - 360 + 360 * dp, 60, PAL.gold, 1); g.fillStyle = PAL.gold; g.beginPath(); g.arc(q[0], q[1] - 360 + 360 * dp, 12, 0, 7); g.fill();
  if (o.fog) { for (let k = 0; k < 7; k++) { const x = ((hash(k) * W + t * 30 * (k % 2 ? 1 : -1)) % (W + 600)) - 300, y = H * 0.3 + hash(k + 2) * H * 0.5; const fg = g.createRadialGradient(x, y, 0, x, y, 380); fg.addColorStop(0, `rgba(200,210,240,${0.16 * a})`); fg.addColorStop(1, 'rgba(200,210,240,0)'); g.fillStyle = fg; g.fillRect(x - 380, y - 380, 760, 760); } }
  if (o.label) chip(g, o.label, q[0] + 330, q[1] - 300, PAL.gold, { size: 40, alpha: kp(b, t, 0, 0.6), fill: 'rgba(8,12,26,0.9)' });
};

// 23 NEON SILHOUETTE — neon-tube outline figures with flicker
function neonStroke(g, col, lw, fn, p = 1) { g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = rgba(col, 0.35); g.lineWidth = lw * 3.2; strokeOn(g, p, 3000); fn(); g.stroke(); g.strokeStyle = col; g.lineWidth = lw; g.shadowColor = col; g.shadowBlur = 24; g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = lw * 0.35; g.shadowBlur = 0; g.stroke(); g.setLineDash([]); g.restore(); }
function neonBaby(g, x, y, s, col, p, t) { neonStroke(g, col, 5, () => { g.beginPath(); g.arc(x, y - 120 * s, 62 * s, 0, 7); g.moveTo(x - 70 * s, y + 90 * s); g.bezierCurveTo(x - 90 * s, y - 50 * s, x + 90 * s, y - 50 * s, x + 70 * s, y + 90 * s); g.closePath(); g.moveTo(x - 60 * s, y - 20 * s); g.lineTo(x - 110 * s, y + 30 * s); g.moveTo(x + 60 * s, y - 20 * s); g.lineTo(x + 110 * s, y + 30 * s); g.moveTo(x - 40 * s, y + 90 * s); g.lineTo(x - 50 * s, y + 150 * s); g.moveTo(x + 40 * s, y + 90 * s); g.lineTo(x + 50 * s, y + 150 * s); }, p); }
function neonPerson(g, x, y, s, col, p, t) { neonStroke(g, col, 5, () => { g.beginPath(); g.arc(x, y - 170 * s, 50 * s, 0, 7); g.moveTo(x - 100 * s, y + 160 * s); g.lineTo(x - 90 * s, y - 60 * s); g.bezierCurveTo(x - 80 * s, y - 110 * s, x + 80 * s, y - 110 * s, x + 90 * s, y - 60 * s); g.lineTo(x + 100 * s, y + 160 * s); g.moveTo(x - 90 * s, y - 60 * s); g.lineTo(x - 120 * s, y + 70 * s); g.moveTo(x + 90 * s, y - 60 * s); g.lineTo(x + 120 * s, y + 70 * s); }, p); }
TPL.neonSilhouette = (g, t, b, o) => {
  const fl = hash(Math.floor(t * 14)) > 0.93 ? 0.4 : 1;
  g.save(); g.globalAlpha = fl;
  (o.figs || [{ who: 'baby', x: W / 2, col: PAL.pink }]).forEach((f, i) => { const p = kp(b, t, i, 1.0); const draw = f.who === 'baby' ? neonBaby : neonPerson; draw(g, f.x, f.y || H * 0.55, f.s || 1.4, f.col || PAL.pink, p, t); if (f.label) txt(g, f.label, f.x, (f.y || H * 0.55) + 300, { size: 46, col: f.col || PAL.pink, w: 800, alpha: p, glow: f.col || PAL.pink }); if (f.mirror) { g.save(); g.strokeStyle = rgba(PAL.cyan, 0.8); g.lineWidth = 6; g.shadowColor = PAL.cyan; g.shadowBlur = 20; g.beginPath(); g.roundRect(f.x - 230, H * 0.12, 460, 760, 230); g.stroke(); g.restore(); } if (f.dot) { const dp = kp(b, t, f.dot, 0.4); if (dp > 0) { g.fillStyle = PAL.red; g.beginPath(); g.arc(f.x, (f.y || H * 0.55) - 118 * (f.s || 1.4), 14 * dp, 0, 7); g.fill(); glow(g, f.x, (f.y || H * 0.55) - 118 * (f.s || 1.4), 50, PAL.red, dp); } } });
  g.restore();
  // neon floor reflection
  g.save(); g.globalAlpha = 0.18; g.translate(0, H * 1.62); g.scale(1, -0.6); (o.figs || []).forEach((f, i) => { const draw = f.who === 'baby' ? neonBaby : neonPerson; draw(g, f.x, f.y || H * 0.55, f.s || 1.4, f.col || PAL.pink, kp(b, t, i, 1.0), t); }); g.restore();
};

// 24 PARTICLE LOGO — particles converge into a word / symbol
const PLCACHE = {};
function textPoints(s, size, step = 7) { const k = s + size; if (PLCACHE[k]) return PLCACHE[k]; const c = mk(1600, 500), g = c.getContext('2d'); g.font = `800 ${size}px ${FONT_H}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(s, 800, 250); const d = g.getImageData(0, 0, 1600, 500).data, pts = []; for (let y = 0; y < 500; y += step) for (let x = 0; x < 1600; x += step) if (d[(y * 1600 + x) * 4 + 3] > 128) pts.push([x - 800, y - 250]); return PLCACHE[k] = pts; }
TPL.particleLogo = (g, t, b, o) => {
  const pts = textPoints(o.word || 'আমি', o.size || 300, 6), p = kp(b, t, 0, 1.6), cx = W / 2, cy = o.y || H * 0.48, col = o.col || PAL.violet, out = o.burst ? kp(b, t, 1, 1.2) : 0;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < pts.length; i++) { const ang = hash(i) * 6.283, rr = 700 + hash(i + 1) * 600; const sx = cx + Math.cos(ang) * rr, sy = cy + Math.sin(ang) * rr * 0.6; const e = easeIO(clamp(p * 1.3 - hash(i + 2) * 0.3)); let x = lerp(sx, cx + pts[i][0], e), y = lerp(sy, cy + pts[i][1], e);
    if (out > 0) { x += Math.cos(ang) * out * 900; y += Math.sin(ang) * out * 600; }
    x += Math.sin(t * 3 + i) * 1.5; g.fillStyle = i % 5 ? rgba(col, 0.85) : 'rgba(255,255,255,0.9)'; g.fillRect(x - 2, y - 2, 4, 4); }
  g.restore(); if (p >= 1 && !out) glow(g, cx, cy, 500, col, 0.25 + 0.05 * Math.sin(t * 3));
  if (o.sub) txt(g, o.sub, cx, cy + 230, { size: 44, font: FONT_U, col: PAL.white, w: 600, alpha: kp(b, t, 0, 1.8) });
};

// 25 TURNTABLE — object rotating on a glowing iso platform, hotspot labels
TPL.turntable = (g, t, b, o) => {
  const cx = W / 2 - 120, cy = H * 0.74, a = ib(b, t, 0, 0.7), rot = (t - b.t0) * 0.6;
  // platform
  g.save(); g.fillStyle = '#081026'; g.beginPath(); g.ellipse(cx, cy + 26, 380 * a, 120 * a, 0, 0, 7); g.fill();
  g.fillStyle = '#122450'; g.beginPath(); g.ellipse(cx, cy, 380 * a, 120 * a, 0, 0, 7); g.fill(); g.strokeStyle = rgba(PAL.gold, 0.9); g.lineWidth = 4; g.stroke();
  for (let k = 0; k < 24; k++) { const an = k / 24 * 6.283 + rot; g.fillStyle = rgba(PAL.gold, 0.5 + 0.5 * Math.sin(an)); g.beginPath(); g.arc(cx + Math.cos(an) * 340 * a, cy + Math.sin(an) * 104 * a, 4, 0, 7); g.fill(); }
  g.restore(); glow(g, cx, cy, 380, PAL.gold, 0.25);
  const sx = Math.cos(rot * 0.7); g.save(); g.translate(cx, cy - 300); g.scale((0.8 + 0.2 * Math.abs(sx)) * (sx < 0 ? -1 : 1), 1);
  if (o.obj === 'mobile') mobileToy(g, 0, -120, 1.3, t, 1); else brainSide(g, 0, 0, 1.15 * a, { mode: o.mode || 'solid', hl: o.hl, show: o.show, t });
  g.restore();
  (o.tags || []).forEach((tg, i) => { const p = kp(b, t, i, 0.6); if (tg.k && o.obj !== 'mobile') { const pp = brainPt(cx, cy - 300, 1.15 * (sx < 0 ? -1 : 1) * (0.8 + 0.2 * Math.abs(sx)), tg.k); leader(g, pp[0], pp[1], cx + 520, cy - 560 + i * 130, tg.l, tg.col || PAL.gold, p, { sub: tg.sub, size: 40 }); } else chip(g, tg.l, cx + 560, cy - 520 + i * 110, tg.col || PAL.gold, { size: 36, alpha: p }); });
};
function mobileToy(g, x, y, s, t, kick) {
  const sw = Math.sin(t * 3) * 0.2 * kick; g.save(); g.translate(x, y); g.scale(s, s); g.rotate(sw * 0.3);
  g.strokeStyle = '#d7dbe6'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -120); g.lineTo(0, -60); g.moveTo(-150, -60); g.lineTo(150, -60); g.stroke();
  const toys = [['#ff6b8a', 'star'], ['#ffd25c', 'moon'], ['#5ddcff', 'cloud'], ['#7bff9e', 'heart']];
  toys.forEach(([c, k], i) => { const tx = -150 + i * 100, sy = Math.sin(t * 4 + i) * 10 * kick, rr = Math.sin(t * 5 + i) * 0.4 * kick; g.beginPath(); g.moveTo(tx, -60); g.lineTo(tx, 20 + sy); g.stroke(); g.save(); g.translate(tx, 44 + sy); g.rotate(rr); g.fillStyle = c; g.beginPath(); if (k === 'star') { for (let a = 0; a < 10; a++) { const r = a % 2 ? 12 : 28; g.lineTo(Math.cos(a * 0.628 - 1.57) * r, Math.sin(a * 0.628 - 1.57) * r); } } else if (k === 'moon') { g.arc(0, 0, 26, 0.6, 5.7); g.arc(10, 0, 20, 5.2, 1.1, true); } else if (k === 'cloud') { g.arc(-12, 4, 16, 0, 7); g.arc(8, -4, 20, 0, 7); g.arc(20, 8, 14, 0, 7); } else { g.moveTo(0, 22); g.bezierCurveTo(-34, 0, -20, -28, 0, -10); g.bezierCurveTo(20, -28, 34, 0, 0, 22); } g.fill(); g.restore(); });
  g.restore();
}

// 26 MONEY STACK — stacks of glowing blocks piling up (count of cells / people)
TPL.moneyStack = (g, t, b, o) => {
  const P = ISO(W / 2 + 120, H * 0.78, 1), d = t - b.t0, n = o.stacks || 5, per = o.per || 14, rate = o.rate || 12;
  const total = Math.floor(clamp(d - 0.3, 0, 99) * rate);
  for (let s = 0; s < n; s++) { const cnt = Math.min(per, Math.max(0, total - s * per)); const x = (s - n / 2) * 150, y = (s % 2) * 60 - 40;
    if (cnt > 0) floorShadow(g, P, x, y, 120, 80, 0.3);
    for (let k = 0; k < cnt; k++) { const drop = k === cnt - 1 && total < n * per ? (1 - ((d * rate) % 1)) * 40 : 0; isoBox(g, P, x, y, k * 22 + drop, 120, 80, 20, o.col || PAL.green, { rim: 'rgba(255,255,255,0.6)', rimW: 1.2 }); } }
  const shown = o.count ? Math.floor(o.count * Math.min(1, total / (n * per))) : total;
  txt(g, BN(shown.toLocaleString('en-US')), 360, H * 0.44, { size: 140, col: o.col || PAL.green, w: 800, glow: o.col || PAL.green, blur: 30 });
  if (o.unit) txt(g, o.unit, 360, H * 0.44 + 110, { size: 48, col: PAL.white, w: 700 });
};

// 27 RECEIPT — receipt prints out line by line
TPL.receipt = (g, t, b, o) => {
  const items = o.items || [], cx = W / 2 + (o.dx || 0), top = 180, lineH = 64, n = items.length;
  const pr = Math.max(...items.map((_, i) => kp(b, t, i, 0.4) * (i + 1)), 0); const len = 190 + pr * lineH + (o.total && t > KT(b, n) ? 150 : 0);
  // printer
  g.save(); g.fillStyle = '#1a1f2e'; g.beginPath(); g.roundRect(cx - 320, top - 90, 640, 110, 24); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.2)'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#05070c'; g.fillRect(cx - 260, top - 6, 520, 12); glow(g, cx + 260, top - 50, 30, PAL.green, 0.8 + 0.2 * Math.sin(t * 6)); g.restore();
  g.save(); g.beginPath(); g.rect(cx - 300, top, 600, H); g.clip(); g.translate(0, Math.sin(t * 30) * (pr % 1 > 0 && pr % 1 < 0.95 ? 1 : 0));
  g.fillStyle = '#f6f3ea'; g.beginPath(); g.moveTo(cx - 240, top); g.lineTo(cx + 240, top); g.lineTo(cx + 240, top + len); for (let x = cx + 240; x > cx - 240; x -= 20) g.lineTo(x - 10, top + len + 12 * ((x / 20) % 2 ? 1 : 0)); g.lineTo(cx - 240, top + len); g.closePath(); g.fill();
  txt(g, o.title || 'রসিদ', cx, top + 60, { size: 40, col: '#16161c', w: 800 }); g.strokeStyle = '#16161c'; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(cx - 210, top + 110); g.lineTo(cx + 210, top + 110); g.stroke(); g.setLineDash([]);
  items.forEach((it, i) => { const p = kp(b, t, i, 0.4); if (p <= 0) return; const y = top + 160 + i * lineH; txt(g, it.l, cx - 210, y, { size: 30, align: 'left', col: '#16161c', font: FONT_U, w: 600, alpha: p }); txt(g, it.r || '', cx + 210, y, { size: 30, align: 'right', col: it.col || '#c22', font: FONT_U, w: 700, alpha: p }); });
  if (o.total && t > KT(b, n)) { const p = kp(b, t, n, 0.4), y = top + 190 + n * lineH; g.fillStyle = '#16161c'; g.fillRect(cx - 210, y - 20, 420, 3); txt(g, o.total, cx, y + 50, { size: 44, col: '#c22', w: 800, alpha: p }); }
  g.restore();
};

// 28 ICEBERG — what you remember (tip) vs what stays inside (huge underwater part)
TPL.iceberg = (g, t, b, o) => {
  const wl = H * 0.38 + Math.sin(t * 1.2) * 4, cx = W / 2, a = ip(b, t, 0, 0.7);
  const sea = g.createLinearGradient(0, wl, 0, H); sea.addColorStop(0, 'rgba(20,70,140,0.75)'); sea.addColorStop(1, 'rgba(4,10,30,0.95)'); g.fillStyle = sea; g.fillRect(0, wl, W, H - wl);
  g.save(); g.globalAlpha = a; g.fillStyle = '#e8f4ff'; g.beginPath(); g.moveTo(cx - 140, wl); g.lineTo(cx - 60, wl - 150); g.lineTo(cx + 10, wl - 210); g.lineTo(cx + 80, wl - 120); g.lineTo(cx + 150, wl); g.closePath(); g.fill(); g.fillStyle = '#b9d6f2'; g.beginPath(); g.moveTo(cx + 10, wl - 210); g.lineTo(cx + 80, wl - 120); g.lineTo(cx + 150, wl); g.lineTo(cx + 30, wl); g.closePath(); g.fill();
  const ug = g.createLinearGradient(0, wl, 0, H); ug.addColorStop(0, 'rgba(150,200,240,0.65)'); ug.addColorStop(1, 'rgba(40,90,160,0.35)'); g.fillStyle = ug; g.beginPath(); g.moveTo(cx - 140, wl); g.lineTo(cx - 420, wl + 220); g.lineTo(cx - 360, wl + 520); g.lineTo(cx - 60, H + 40); g.lineTo(cx + 300, wl + 560); g.lineTo(cx + 460, wl + 260); g.lineTo(cx + 150, wl); g.closePath(); g.fill(); g.strokeStyle = 'rgba(200,230,255,0.6)'; g.lineWidth = 3; g.stroke();
  g.restore();
  g.strokeStyle = 'rgba(200,230,255,0.7)'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= W; x += 20) g.lineTo(x, wl + Math.sin(x * 0.02 + t * 2) * 4); g.stroke();
  (o.top || []).forEach((s, i) => chip(g, s, cx + 380, wl - 160 + i * 70, PAL.white, { size: 34, alpha: kp(b, t, i, 0.5) }));
  (o.bottom || []).forEach((s, i) => { const k = (o.top || []).length + i; chip(g, s.l || s, cx + (i % 2 ? 300 : -300), wl + 180 + i * 110, s.col || PAL.gold, { size: 36, alpha: kp(b, t, k, 0.5), fill: 'rgba(5,12,30,0.85)' }); });
  for (let k = 0; k < 20; k++) { const x = (hash(k) * W), y = H - ((t * 40 * (0.5 + hash(k + 1)) + hash(k + 2) * H) % (H - wl)); g.strokeStyle = 'rgba(200,230,255,0.4)'; g.beginPath(); g.arc(x, y, 3 + hash(k + 3) * 5, 0, 7); g.stroke(); }
};

// 29 POV DOODLE — first-person (baby's) view: looking up at the mobile, own feet kicking
TPL.povDoodle = (g, t, b, o) => {
  const d = t - b.t0, kick = o.kick != null ? (o.kick === 'key' ? kp(b, t, 0, 0.4) : o.kick) : 1;
  // ceiling / vignette dreamy
  const bg = g.createRadialGradient(W / 2, H * 0.3, 50, W / 2, H * 0.4, W * 0.7); bg.addColorStop(0, 'rgba(255,230,200,0.22)'); bg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  if (o.scene === 'mirror') {
    g.save(); g.strokeStyle = '#d9c38a'; g.lineWidth = 18; g.beginPath(); g.roundRect(W / 2 - 330, 90, 660, 760, 40); g.stroke(); g.fillStyle = 'rgba(150,200,255,0.12)'; g.fill(); g.restore();
    neonBaby(g, W / 2, H * 0.5, 1.4, PAL.cyan, 1, t);
    if (o.dot) { g.fillStyle = PAL.red; g.beginPath(); g.arc(W / 2, H * 0.5 - 168, 14, 0, 7); g.fill(); glow(g, W / 2, H * 0.5 - 168, 40, PAL.red, 1); }
    const touch = o.touch ? kp(b, t, 0, 0.7) : 0; // own hand reaching to own nose (bottom of POV)
    g.save(); g.strokeStyle = '#f2c6a0'; g.lineWidth = 60; g.lineCap = 'round'; g.beginPath(); g.moveTo(W * 0.72, H + 40); g.quadraticCurveTo(W * 0.66, H * 0.92, lerp(W * 0.7, W * 0.53, touch), lerp(H * 0.86, H * 0.64, touch)); g.stroke(); g.restore();
    if (o.touch && touch > 0.9) { slam(g, '!', W / 2 + 280, H * 0.3, kp(b, t, 1, 0.3), { size: 200, col: PAL.gold }); }
  } else {
    mobileToy(g, W / 2, H * 0.14, 2.4, t, kick);
    // ribbon
    const fy = H - 80 - Math.abs(Math.sin(d * 7)) * 60 * kick;
    if (o.ribbon !== false) { g.save(); g.strokeStyle = '#ff7aa8'; g.lineWidth = 6; g.beginPath(); g.moveTo(W * 0.62, fy); g.quadraticCurveTo(W * 0.78, H * 0.5, W / 2 + 330, H * 0.28); g.stroke(); g.restore(); }
    // feet
    for (const [x, ph] of [[W * 0.4, 0], [W * 0.62, 1.4]]) { const y = H - 80 - Math.abs(Math.sin(d * 7 + ph)) * 60 * kick; g.save(); g.translate(x, y); g.rotate(Math.sin(d * 7 + ph) * 0.2 * kick); g.fillStyle = '#f2c6a0'; g.beginPath(); g.ellipse(0, 0, 70, 100, 0, 0, 7); g.fill(); g.strokeStyle = '#7a4a30'; g.lineWidth = 3; g.stroke(); for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(-40 + k * 20, -90 + Math.abs(k - 2) * 6, 13 - k, 0, 7); g.fill(); g.stroke(); } g.restore(); }
    if (kick > 0.3) for (let k = 0; k < 3; k++) { const nt = (d * 0.8 + k / 3) % 1; txt(g, '♪', W / 2 - 300 + k * 300 + Math.sin(d * 3 + k) * 30, H * 0.45 - nt * 200, { size: 70, col: PAL.gold, alpha: (1 - nt) * kick, font: 'Segoe UI Symbol' }); }
  }
  // doodle frame jitter lines
  g.save(); g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 2; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(W / 2, H / 2, W * 0.55 + k * 12 + Math.sin(t * 5 + k) * 3, H * 0.6 + k * 10, 0, 0, 7); g.stroke(); } g.restore();
};

// 30 TERMINAL BLOOM — terminal types commands, output blooms into a glowing card
TPL.terminalBloom = (g, t, b, o) => {
  const a = ib(b, t, 0, 0.5), x0 = W / 2 - 640, y0 = 160, w = 1280, h = 620;
  g.save(); g.globalAlpha = clamp(a * 2); g.translate(W / 2, H / 2); g.scale(lerp(0.9, 1, a), lerp(0.9, 1, a)); g.translate(-W / 2, -H / 2);
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.roundRect(x0 + 24, y0 + 30, w, h, 22); g.fill();
  g.fillStyle = '#0b0f18'; g.beginPath(); g.roundRect(x0, y0, w, h, 22); g.fill(); g.strokeStyle = 'rgba(93,255,168,0.4)'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#161c2a'; g.beginPath(); g.roundRect(x0, y0, w, 56, [22, 22, 0, 0]); g.fill(); ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(x0 + 34 + i * 30, y0 + 28, 9, 0, 7); g.fill(); });
  txt(g, o.title || 'brain — memory.log', W / 2, y0 + 30, { size: 22, font: 'Consolas, monospace', col: 'rgba(255,255,255,0.6)', w: 500 });
  (o.lines || []).forEach((L, i) => { const st = KT(b, i), p = seg(t, st, st + Math.max(0.4, [...L.s].length * 0.035)); if (p <= 0) return; const y = y0 + 110 + i * 58;
    txt(g, (L.p != null ? L.p : '$ ') + typeOn(L.s, p) + (p < 1 && Math.floor(t * 3) % 2 ? '▌' : ''), x0 + 40, y, { size: 32, align: 'left', font: L.bn ? FONT_U : 'Consolas, monospace', col: L.col || PAL.green, w: 600 }); });
  g.restore();
  if (o.bloom) { const p = kb(b, t, (o.lines || []).length, 0.6); if (p > 0) { glow(g, W / 2, H / 2 + 80, 600 * p, o.bcol || PAL.pink, 0.5); g.save(); g.translate(W / 2, H / 2 + 80); g.scale(p, p); glass(g, -480, -110, 960, 220, { edge: o.bcol || PAL.pink, top: 'rgba(40,10,40,0.9)', bot: 'rgba(15,5,20,0.95)' }); txt(g, o.bloom, 0, -10, { size: 76, col: PAL.white, w: 800 }); if (o.bsub) txt(g, o.bsub, 0, 60, { size: 30, font: FONT_U, col: o.bcol || PAL.pink, w: 600, track: 2 }); g.restore(); } }
};
