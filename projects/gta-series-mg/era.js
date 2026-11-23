// era.js: "GTA সিরিজের কোন গেম কত কামাইছে" — ERA-SHIFT edit.
// Every game gets its own era look (pixel 1997, Liberty grey 2001, Vice 80s, SA dusk, IV rain, V green, VI coral).
// Flat poster cards with hard offset shadows (no neon glow), a running "total revenue" HUD + era timeline,
// the creator's hoodie character acting in panels, real game box art / screenshots / trailers inside cards.
// Straight text only. Face at hook / middle / end with chest-level MG only. No captions.
const FPS = 30, DUR = 62.92;
const A = { nohisab: 8.6, g12: 11.38, g3: 15.94, r3: 17.8, vc: 19.92, emo: 21.0, r_vc: 23.72, sa: 25.98, cj: 27.58, r_sa: 33.0, g4: 35.3, r4: 36.4, g5: 40.22, mac: 42.8, r5: 46.46, g6: 50.62, r6: 53.26, nak: 55.16, comment: 57.82 };
const DINK = '#0b0b0d', PAPER = '#f6f3ea', CASH = '#62d26f';
const ERA = {
  pix: { yr: '1997', bg: ['#0f2416', '#040a06'], ac: '#8cff6b', ac2: '#ffd23f' },
  lib: { yr: '2001', bg: ['#26303b', '#0b0f14'], ac: '#ffc93c', ac2: '#e9edf2' },
  vice: { yr: '2002', bg: ['#0c1a33', '#05070f'], ac: '#ff5fa8', ac2: '#3fd6ff' },
  sa: { yr: '2004', bg: ['#3a210d', '#0d0703'], ac: '#45c95a', ac2: '#ff9d3c' },
  lc4: { yr: '2008', bg: ['#232b33', '#090c0f'], ac: '#e6c27a', ac2: '#a9bccd' },
  ls5: { yr: '2013', bg: ['#0f2d1e', '#050f0a'], ac: '#6fe07a', ac2: '#ffffff' },
  vi6: { yr: '2026', bg: ['#12202a', '#06090c'], ac: '#ff7a59', ac2: '#ffc65c' },
};
const YEARS = ['pix', 'lib', 'vice', 'sa', 'lc4', 'ls5', 'vi6'];
const P = (t, a, d = 0.35) => easeOutBack(seg(t, a, a + d)), S = (t, a, d = 0.5) => ease(seg(t, a, a + d));
const JAK = s => `800 ${s}px "Plus Jakarta Sans"`, BNF = s => `bold ${s}px "Nirmala UI"`;
// ---------- assets ----------
const FACE = [[0, 2.9], [41.6, 44.3], [59.8, 62.92]];
const CLIPS = [[35.3, 38.4, 'g4', 0, 118], [40.22, 41.6, 'g5', 2.0, 238], [44.3, 47.6, 'g5e', 0, 268], [47.6, 50.62, 'g5fp', 1.0, 178], [53.0, 57.0, 'g6e', 0, 128]];
const STILLS = ['logo6_full.png', 'g6_30.jpg', 'GTA1_PC_in-game_screenshot.png', 'GTA2_Box_art.jpg', 'GTA_-_Box_Front.jpg', 'Grand_Theft_Auto_VI.png', 'Grand_Theft_Auto_VI_screenshot.png', 'gta3_shot03.jpg', 'gta3_shot05.jpg', 'gta3_shot07.jpg', 'gta3de_shot04.jpg', 'gta4_shot02.jpg', 'gta4_shot04.jpg', 'gta4_shot09.jpg', 'gta5_shot04.jpg', 'gta5e_shot02.jpg', 'gta5e_shot05.jpg', 'sa_shot03.jpg', 'sa_shot04.jpg', 'sa_shot08.jpg', 'sade_shot00.jpg', 'sade_shot01.jpg', 'vc_shot01.jpg', 'vc_shot04.jpg', 'vc_shot09.jpg', 'vcde_shot00.jpg', 'vcde_shot01.jpg'];
const IMC = new Map(), IMG = {};
function getImg(src) { if (IMC.has(src)) return IMC.get(src); const p = new Promise(r => { const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = src; }); IMC.set(src, p); return p; }
async function preload(t) { const need = {}; STILLS.forEach(f => need[f] = `frames/img/${f}`);
  CLIPS.forEach(([a, b, dir, off, mx]) => { if (t >= a - 0.5 && t <= b + 0.5) { const n = Math.min(Math.max(0, Math.floor((clamp(t, a, b) - a + off) * FPS)), mx); need['c' + dir] = `frames/${dir}/${String(n).padStart(4, '0')}.jpg`; } });
  FACE.forEach(([a, b], j) => { if (t >= a - 0.5 && t <= b + 0.5) { const n = Math.max(0, Math.floor((clamp(t, a, b - 0.05) - a) * FPS)); need['f' + j] = `frames/face${j}/${String(n).padStart(4, '0')}.jpg`; } });
  for (const k in IMG) if (!(k in need)) delete IMG[k]; await Promise.all(Object.entries(need).map(async ([k, s]) => { IMG[k] = await getImg(s); })); }
// ---------- era backgrounds (self-drawn, flat, no neon) ----------
function epalm(g, x, y, h, col) { g.save(); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = h * 0.035; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + h * 0.08, y - h * 0.5, x + h * 0.02, y - h); g.stroke(); for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.48, L = h * 0.42; g.beginPath(); g.moveTo(x + h * 0.02, y - h); g.quadraticCurveTo(x + h * 0.02 + Math.cos(a) * L * 0.6, y - h + Math.sin(a) * L * 0.6 - h * 0.08, x + h * 0.02 + Math.cos(a) * L, y - h + Math.sin(a) * L + h * 0.16); g.lineWidth = h * 0.05; g.stroke(); } g.restore(); }
function skylineFlat(g, y, seed, col, hmax, wmin = 50) { g.fillStyle = col; let x = -20, i = 0; while (x < PW + 20) { const w = wmin + hash(seed + i) * 90, h = hmax * (0.3 + hash(seed + i + 50) * 0.7); g.fillRect(x, y - h, w - 6, h + 4); x += w; i++; } }
function bgEra(g, t, e) { const E = ERA[e]; const gr = g.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, E.bg[0]); gr.addColorStop(1, E.bg[1]); g.fillStyle = gr; g.fillRect(0, 0, PW, PH);
  g.save();
  if (e === 'pix') { const s = 60, off = (t * 40) % s; for (let y = -s; y < PH + s; y += s) for (let x = 0; x < PW; x += s) { const i = Math.floor((y - off + 4000) / s) * 31 + x / s; const road = (x / s) % 5 === 2 || Math.floor((y - off + 4000) / s) % 6 === 0; g.fillStyle = road ? 'rgba(140,255,107,0.10)' : `rgba(${hash(i) > 0.5 ? '255,210,63' : '140,255,107'},${0.02 + hash(i + 9) * 0.05})`; g.fillRect(x + 3, y + off + 3, s - 6, s - 6); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < PH; y += 4) g.fillRect(0, y, PW, 2); }
  else if (e === 'lib') { g.fillStyle = 'rgba(255,255,255,0.06)'; for (let y = 0; y < PH; y += 26) for (let x = (y / 26) % 2 * 13; x < PW; x += 26) { const r = 2.6 * (y / PH); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } skylineFlat(g, PH, 11, 'rgba(0,0,0,0.45)', 520); g.fillStyle = 'rgba(255,201,60,0.5)'; for (let i = 0; i < 40; i++) g.fillRect(hash(i) * PW, PH - hash(i + 3) * 360, 8, 12); }
  else if (e === 'vice') { const hz = 1280; const sg = g.createLinearGradient(0, 700, 0, hz); sg.addColorStop(0, 'rgba(255,95,168,0)'); sg.addColorStop(1, 'rgba(255,95,168,0.45)'); g.fillStyle = sg; g.fillRect(0, 700, PW, hz - 700); g.fillStyle = '#ff8a5c'; g.beginPath(); g.arc(540, hz, 260, Math.PI, 0); g.fill(); g.fillStyle = E.bg[0]; for (let i = 0; i < 6; i++) g.fillRect(260, hz - 30 - i * 34, 560, 6 + i * 1.5); g.fillStyle = '#071022'; g.fillRect(0, hz, PW, PH - hz); g.fillStyle = 'rgba(255,138,92,0.35)'; for (let i = 0; i < 12; i++) { const w = 240 - i * 16; g.fillRect(540 - w + Math.sin(t * 2 + i) * 10, hz + 18 + i * 22, w * 2, 4); } epalm(g, 90, hz + 40, 520, '#050913'); epalm(g, 1000, hz + 60, 620, '#050913'); }
  else if (e === 'sa') { const hz = 1350; g.fillStyle = 'rgba(255,157,60,0.25)'; g.beginPath(); g.arc(700, hz - 60, 340, 0, 7); g.fill(); g.fillStyle = '#ffb35c'; g.beginPath(); g.arc(700, hz - 60, 150, 0, 7); g.fill(); g.fillStyle = '#1c1006'; g.beginPath(); g.moveTo(0, hz); for (let x = 0; x <= PW; x += 60) g.lineTo(x, hz - 120 - Math.sin(x / 140) * 70 - hash(x) * 30); g.lineTo(PW, PH); g.lineTo(0, PH); g.fill(); skylineFlat(g, hz + 40, 23, '#120a04', 220, 40); epalm(g, 140, hz + 120, 480, '#0a0602'); g.fillStyle = 'rgba(255,190,120,0.18)'; for (let i = 0; i < 30; i++) { g.beginPath(); g.arc((hash(i) * PW + t * 30 * (0.5 + hash(i + 1))) % PW, hash(i + 2) * PH, 2 + hash(i + 4) * 3, 0, 7); g.fill(); } }
  else if (e === 'lc4') { skylineFlat(g, PH, 41, 'rgba(0,0,0,0.5)', 700, 70); g.fillStyle = 'rgba(230,194,122,0.35)'; for (let i = 0; i < 60; i++) g.fillRect(hash(i + 7) * PW, PH - hash(i + 8) * 600, 7, 10); g.strokeStyle = 'rgba(169,188,205,0.22)'; g.lineWidth = 2; for (let i = 0; i < 90; i++) { const x = (hash(i) * PW * 1.2 - t * 120 * 0.3) % PW, y = (hash(i + 5) * PH + t * 1500 * (0.7 + hash(i + 6) * 0.6)) % PH; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 6, y + 40); g.stroke(); } const fg = g.createLinearGradient(0, PH - 500, 0, PH); fg.addColorStop(0, 'rgba(169,188,205,0)'); fg.addColorStop(1, 'rgba(169,188,205,0.12)'); g.fillStyle = fg; g.fillRect(0, PH - 500, PW, 500); }
  else if (e === 'ls5') { g.fillStyle = '#0a1f14'; g.beginPath(); g.moveTo(0, 1500); for (let x = 0; x <= PW; x += 40) g.lineTo(x, 1380 - Math.sin(x / 200 + 1) * 110); g.lineTo(PW, PH); g.lineTo(0, PH); g.fill(); skylineFlat(g, 1560, 77, '#06140d', 300, 45); g.font = JAK(64); g.textAlign = 'center'; for (let i = 0; i < 16; i++) { const y = (hash(i) * PH - t * 60 * (0.5 + hash(i + 1))) % PH; g.fillStyle = 'rgba(111,224,122,0.07)'; g.fillText('$', hash(i + 3) * PW, (y + PH) % PH); } }
  else if (e === 'vi6') { const hz = 1300; const sg = g.createLinearGradient(0, 600, 0, hz); sg.addColorStop(0, 'rgba(255,122,89,0)'); sg.addColorStop(1, 'rgba(255,122,89,0.5)'); g.fillStyle = sg; g.fillRect(0, 600, PW, hz - 600); g.fillStyle = '#ffc65c'; g.beginPath(); g.arc(300, hz, 180, Math.PI, 0); g.fill(); g.fillStyle = '#081016'; g.fillRect(0, hz, PW, PH - hz); g.fillStyle = 'rgba(255,198,92,0.3)'; for (let i = 0; i < 10; i++) g.fillRect(300 - 170 + i * 8 + Math.sin(t * 2 + i) * 8, hz + 16 + i * 26, 340 - i * 16, 4); epalm(g, 820, hz + 80, 700, '#03070a'); epalm(g, 980, hz + 60, 520, '#03070a'); epalm(g, 60, hz + 70, 420, '#03070a'); }
  g.restore();
  const v = g.createRadialGradient(PW / 2, PH * 0.42, 200, PW / 2, PH * 0.42, PH * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = v; g.fillRect(0, 0, PW, PH); }
// ---------- flat poster card (real game art inside) ----------
function pcard(g, key, win, e, k, o = {}) { if (k <= 0) return; const E = ERA[e], im = IMG[key]; const u = easeOutBack(clamp(k)), cx = win.x + win.w / 2, cy = win.y + win.h / 2;
  g.save(); g.globalAlpha = clamp(k * 3); g.translate(cx, cy + (1 - u) * 160); g.scale(0.9 + 0.1 * u, 0.9 + 0.1 * u); g.translate(-cx, -cy);
  g.fillStyle = o.shadow || E.ac; g.fillRect(win.x + 20, win.y + 20, win.w, win.h); g.fillStyle = PAPER; g.fillRect(win.x - 10, win.y - 10, win.w + 20, win.h + 20);
  g.save(); g.beginPath(); g.rect(win.x, win.y, win.w, win.h); g.clip(); g.fillStyle = '#000'; g.fillRect(win.x, win.y, win.w, win.h);
  if (im) { const lt = Math.max(0, NOW - (o.t0 || 0)); const fit = o.contain ? Math.min(win.w / im.width, win.h / im.height) : Math.max(win.w / im.width, win.h / im.height); const z = fit * ((o.zoom || 1.06) + (o.still === false ? 0 : 0.06 * clamp(lt / 4))); const dw = im.width * z, dh = im.height * z; const dx = (o.dx || 0) - (o.still === false ? 0 : 24 * clamp(lt / 4)); g.drawImage(im, cx - dw / 2 + dx, cy - dh / 2 + (o.dy || 0), dw, dh); }
  if (o.retro) { g.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = win.y; y < win.y + win.h; y += 4) g.fillRect(win.x, y, win.w, 2); }
  g.restore();
  if (o.label) { g.font = BNF(34); const w = g.measureText(o.label).width + 48; g.fillStyle = E.ac; g.fillRect(win.x - 10, win.y + win.h - 4, w, 62); g.fillStyle = DINK; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(o.label, win.x + 14, win.y + win.h + 28); }
  if (o.year) { g.font = JAK(30); const w = g.measureText(o.year).width + 34; g.fillStyle = DINK; g.fillRect(win.x - 10, win.y - 52, w, 46); g.fillStyle = E.ac; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(o.year, win.x + 7, win.y - 28); }
  if (o.rec) { g.font = JAK(22); g.fillStyle = Math.floor(NOW * 2) % 2 ? '#ff3b3b' : 'rgba(255,59,59,0.3)'; g.beginPath(); g.arc(win.x + win.w - 110, win.y + 34, 9, 0, 7); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('PLAY', win.x + win.w - 92, win.y + 35); }
  g.restore(); }
// ---------- straight outlined headline (rises out of a mask line) ----------
function head(g, s, x, y, size, k, col = '#fff', o = {}) { if (k <= 0) return; const u = easeOut(clamp(k)); g.save(); g.font = o.lat ? JAK(size) : BNF(size); g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(s).width;
  g.beginPath(); g.rect(x - w / 2 - 40, y - size, w + 80, size * 1.9); g.clip(); const yy = y + (1 - u) * size * 1.4;
  g.lineJoin = 'round'; g.lineWidth = size * 0.16; g.strokeStyle = DINK; g.strokeText(s, x, yy); g.fillStyle = col; g.fillText(s, x, yy); g.restore();
  if (o.bar) { g.save(); g.fillStyle = o.bar; g.fillRect(x - (w / 2) * u, y + size * 0.62, w * u, 10); g.restore(); } }
// price plate: count-up with tick digits
function price(g, label, val, unit, x, y, e, k, o = {}) { if (k <= 0) return; const E = ERA[e], u = easeOutBack(clamp(k)), c = clamp((k - 0.15) / 0.7); const num = val < 10 ? (val * easeOut(c)).toFixed(o.dec || 0) : Math.round(val * easeOut(c)); const s = '$' + BN(num) + (o.plus && c >= 1 ? '+' : '');
  g.save(); g.translate(x, y); g.scale(u, u); g.font = BNF(o.size || 120); const w1 = g.measureText(s).width; g.font = BNF((o.size || 120) * 0.5); const w2 = g.measureText(' ' + unit).width; const W_ = w1 + w2 + 90, H_ = (o.size || 120) * 1.35;
  g.fillStyle = DINK; g.fillRect(-W_ / 2 + 16, -H_ / 2 + 16, W_, H_); g.fillStyle = E.ac; g.fillRect(-W_ / 2, -H_ / 2, W_, H_);
  g.fillStyle = DINK; g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = BNF(o.size || 120); g.fillText(s, -W_ / 2 + 45, 6); g.font = BNF((o.size || 120) * 0.5); g.fillText(' ' + unit, -W_ / 2 + 45 + w1, 12);
  g.font = BNF(34); const lw = g.measureText(label).width + 40; g.fillStyle = DINK; g.fillRect(-W_ / 2, -H_ / 2 - 54, lw, 54); g.fillStyle = E.ac; g.textAlign = 'left'; g.fillText(label, -W_ / 2 + 20, -H_ / 2 - 25); g.restore(); }
// ---------- the creator's character in a flat panel ----------
let WC, WG;
function charPanel(g, act, t, t0, win, e, o = {}) { const E = ERA[e]; const k = clamp((t - t0) / 0.3); if (k <= 0) return; const u = easeOutBack(k);
  WG.setTransform(1, 0, 0, 1, 0, 0); WG.globalAlpha = 1; WG.clearRect(0, 0, W, H); const c = WG; const gr = c.createLinearGradient(0, 0, 0, 1080); gr.addColorStop(0, o.bg0 || E.bg[0]); gr.addColorStop(1, o.bg1 || E.bg[1]); c.fillStyle = gr; c.fillRect(0, 0, 1920, 1080);
  c.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(960, 560, 120 + i * 70, 0, 7); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.05)'; c.stroke(); } c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(0, 900, 1920, 180);
  const lt = Math.max(0, t - t0), pose = Object.assign({ t, mouth: o.talk ? Math.abs(Math.sin(t * 12)) * 0.6 : 0 }, ACT[act](lt, o), o.pose || {}); if (o.face) pose.face = o.face; c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.ellipse(960, 1000, 200, 30, 0, 0, 7); c.fill(); drawCharF(c, 960, 1000, o.s || 0.95, pose); if (o.extra) o.extra(c, lt);
  const cx = win.x + win.w / 2, cy = win.y + win.h / 2; g.save(); g.translate(cx, cy); g.scale(u, u); g.translate(-cx, -cy);
  g.fillStyle = DINK; g.fillRect(win.x + 16, win.y + 16, win.w, win.h); g.fillStyle = PAPER; g.fillRect(win.x - 8, win.y - 8, win.w + 16, win.h + 16);
  g.save(); g.beginPath(); g.rect(win.x, win.y, win.w, win.h); g.clip(); const Z = Math.max(win.w / 1920, win.h / 1080) * (o.z || 1.3) * 1.4; g.translate(cx, cy); g.scale(Z, Z); g.translate(-960, -(o.cy || ((o.z || 1.3) >= 1.4 ? 430 : 540))); g.drawImage(WC, 0, 0); g.restore();
  if (o.tag) { g.font = BNF(30); const w = g.measureText(o.tag).width + 36; g.fillStyle = E.ac; g.fillRect(win.x - 8, win.y - 8, w, 50); g.fillStyle = DINK; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(o.tag, win.x + 10, win.y + 18); }
  g.restore(); }
// ---------- global HUD: era timeline + running total ----------
const TOT = [[A.r3 + 0.6, 0.508], [A.r_vc + 0.6, 1.121], [A.r_sa + 0.6, 2.044], [A.r4 + 0.6, 4.044], [A.r5 + 0.8, 19.044], [A.r6 + 0.8, 22.044]];
function totalAt(t) { let v = 0, pv = 0, ta = -9; for (const [a, x] of TOT) { if (t >= a) { pv = v; v = x; ta = a; } } const k = easeOut(clamp((t - ta) / 0.9)); return [pv + (v - pv) * k, t - ta < 1.2]; }
function hud(g, t, e) { const idx = YEARS.indexOf(e); g.save(); const y = 120, x0 = 110, x1 = 970, n = YEARS.length; g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
  const pos = i => x0 + (x1 - x0) * i / (n - 1); const cur = idx < 0 ? -1 : idx; g.strokeStyle = ERA[e] ? ERA[e].ac : '#fff'; g.lineWidth = 6; if (cur >= 0) { g.beginPath(); g.moveTo(x0, y); g.lineTo(pos(cur), y); g.stroke(); }
  YEARS.forEach((k, i) => { const on = i === cur, past = i < cur; g.fillStyle = on ? ERA[k].ac : past ? '#fff' : 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(pos(i), y, on ? 13 : 8, 0, 7); g.fill(); if (on) { g.strokeStyle = DINK; g.lineWidth = 4; g.stroke(); } g.font = JAK(on ? 30 : 22); g.textAlign = 'center'; g.fillStyle = on ? ERA[k].ac : 'rgba(255,255,255,0.55)'; g.fillText(ERA[k].yr, pos(i), y - 30); });
  const [v, live] = totalAt(t); if (t > A.r3) { const s = '$' + (v * 1e9).toLocaleString('en-US', { maximumFractionDigits: 0 }); g.font = JAK(46); const w = g.measureText(s).width; const bx = 540 - (w + 230) / 2; g.fillStyle = 'rgba(5,5,7,0.82)'; g.fillRect(bx, 170, w + 230, 70); g.fillStyle = live ? CASH : '#fff'; g.fillRect(bx, 170, 8, 70); g.font = BNF(28); g.fillStyle = 'rgba(255,255,255,0.7)'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('সিরিজের মোট', bx + 26, 207); g.font = JAK(46); g.fillStyle = live ? CASH : '#fff'; g.fillText(s, bx + 200, 208); }
  g.restore(); }
// ---------- small self-made pieces ----------
function redacted(g, t, x, y, w, k, e) { if (k <= 0) return; const E = ERA[e]; g.save(); g.globalAlpha = clamp(k * 3); g.fillStyle = PAPER; g.fillRect(x, y, w, 420); g.fillStyle = DINK; g.font = JAK(30); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('SALES REPORT · GTA / GTA 2', x + 30, y + 44); g.fillRect(x + 30, y + 72, w - 60, 4);
  for (let i = 0; i < 6; i++) { const kk = clamp((k - 0.15 - i * 0.08) / 0.2); g.fillStyle = 'rgba(11,11,13,0.35)'; g.fillRect(x + 30, y + 110 + i * 48, 160, 16); g.fillStyle = DINK; g.fillRect(x + 220, y + 104 + i * 48, (w - 260) * kk * (0.6 + hash(i) * 0.4), 30); }
  const mk = clamp((k - 0.7) / 0.2); if (mk > 0) { g.font = BNF(64); const s = 'তথ্য নেই'; const tw = g.measureText(s).width + 60; g.globalAlpha = mk; g.fillStyle = '#e8413a'; g.fillRect(x + w / 2 - tw / 2, y + 330, tw, 84); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(s, x + w / 2, y + 374); }
  const sx = x + 60 + (Math.sin(t * 2.2) * 0.5 + 0.5) * (w - 140), sy = y + 200 + Math.cos(t * 1.7) * 60; g.globalAlpha = 1; g.strokeStyle = E.ac; g.lineWidth = 10; g.beginPath(); g.arc(sx, sy, 46, 0, 7); g.stroke(); g.beginPath(); g.moveTo(sx + 32, sy + 32); g.lineTo(sx + 80, sy + 80); g.lineWidth = 16; g.stroke(); g.restore(); }
function qmarks(g, t, cx, cy, r, k, col) { for (let i = 0; i < 7; i++) { const kk = clamp((k - i * 0.08) / 0.25); if (kk <= 0) continue; const a = i / 7 * 6.28 + 0.3, b = Math.sin(t * 3 + i) * 10; g.save(); g.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8 + b); g.scale(easeOutBack(kk), easeOutBack(kk)); g.font = JAK(60 + hash(i) * 50); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 10; g.strokeStyle = DINK; g.strokeText('?', 0, 0); g.fillStyle = col; g.fillText('?', 0, 0); g.restore(); } }
function scramble(g, t, x, y, k, e) { if (k <= 0) return; const E = ERA[e]; g.save(); g.globalAlpha = clamp(k * 3); g.fillStyle = DINK; g.fillRect(x - 190, y - 60, 380, 120); g.strokeStyle = E.ac; g.lineWidth = 5; g.strokeRect(x - 190, y - 60, 380, 120); g.font = JAK(70); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = E.ac; let s = '$'; for (let i = 0; i < 5; i++) s += '0123456789?'[Math.floor(hash(i * 7 + x + Math.floor(t * 18)) * 11)]; g.fillText(s, x, y + 4); g.restore(); }
function hearts(g, t, cx, cy, k) { for (let i = 0; i < 9; i++) { const ph = (t * 0.6 + hash(i)) % 1; if (k <= 0) return; const x = cx + (hash(i + 3) - 0.5) * 700 + Math.sin(t * 2 + i) * 20, y = cy + 200 - ph * 600, s = (0.6 + hash(i + 5) * 0.8) * clamp(k * 2); g.save(); g.globalAlpha = Math.sin(ph * Math.PI); g.translate(x, y); g.scale(s, s); g.fillStyle = '#ff5fa8'; g.strokeStyle = DINK; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 20); g.bezierCurveTo(-46, -12, -24, -48, 0, -24); g.bezierCurveTo(24, -48, 46, -12, 0, 20); g.fill(); g.stroke(); g.restore(); } }
function barRace(g, t, t0, e) { const games = [['III', 0.508, 'lib'], ['VC', 0.613, 'vice'], ['SA', 0.923, 'sa'], ['IV', 2.0, 'lc4'], ['V', 15, 'ls5']]; const base = 1450, maxH = 1050, sc = maxH / 2.4, lt = t - t0;
  const v5 = clamp((lt - 0.9) / 1.4), camUp = easeIO(v5) * 0; g.save();
  games.forEach(([n, v, ee], i) => { const x = 120 + i * 175, kk = easeOut(clamp((lt - i * 0.15) / 0.5)); let h = Math.min(v, 2.4) * sc * kk; if (i === 4) h = (0.15 + 0.85 * easeIO(v5)) * (maxH + 380) * kk; g.fillStyle = DINK; g.fillRect(x + 12, base - h + 12, 130, h); g.fillStyle = ERA[ee].ac; g.fillRect(x, base - h, 130, h); g.font = JAK(40); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(n, x + 65, base + 56); g.font = BNF(30); g.fillStyle = '#fff'; if (i < 4 && kk > 0.9) g.fillText('$' + (v < 1 ? BN(Math.round(v * 1000)) + 'M' : BN(v) + 'B'), x + 65, base - h - 24); });
  g.fillStyle = '#fff'; g.fillRect(90, base, 900, 6); const k5 = clamp((lt - 1.6) / 0.4); if (k5 > 0) { g.save(); g.translate(845, 560); g.scale(easeOutBack(k5), easeOutBack(k5)); g.fillStyle = DINK; g.fillRect(-150 + 10, -50 + 10, 300, 100); g.fillStyle = '#fff'; g.fillRect(-150, -50, 300, 100); g.fillStyle = DINK; g.font = BNF(58); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$১৫B ↑', 0, 4); g.restore(); } g.restore(); }
function commentBox(g, t, t0, e, k) { if (k <= 0) return; const E = ERA[e]; const u = easeOutBack(clamp(k)); g.save(); g.translate(540, 820); g.scale(u, u); g.fillStyle = DINK; g.fillRect(-420 + 16, -170 + 16, 840, 340); g.fillStyle = PAPER; g.fillRect(-420, -170, 840, 340);
  g.fillStyle = '#d9d4c7'; g.beginPath(); g.arc(-340, -90, 40, 0, 7); g.fill(); g.font = BNF(34); g.fillStyle = DINK; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('কমেন্ট যোগ করুন…', -280, -92);
  const full = 'GTA 6 মোট আয় হবে $_____'; const n = Math.floor(clamp((t - t0 - 0.4) / 1.6) * full.length); g.font = BNF(44); g.fillText(full.slice(0, n) + (Math.floor(t * 3) % 2 ? '|' : ''), -360, 10); g.fillStyle = E.ac; g.fillRect(-420, 100, 840, 70); g.fillStyle = DINK; g.font = BNF(34); g.textAlign = 'center'; g.fillText('কমেন্ট করুন', 0, 136); g.restore(); }
function clock1d(g, t, cx, cy, r, k, e) { if (k <= 0) return; const E = ERA[e]; g.save(); g.globalAlpha = clamp(k * 3); g.fillStyle = DINK; g.beginPath(); g.arc(cx + 14, cy + 14, r, 0, 7); g.fill(); g.fillStyle = PAPER; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.fillStyle = E.ac; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r - 16, -Math.PI / 2, -Math.PI / 2 + 6.283 * easeIO(clamp(k))); g.fill(); g.strokeStyle = DINK; g.lineWidth = 12; g.lineCap = 'round'; const a = -Math.PI / 2 + t * 6; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7); g.stroke(); g.fillStyle = DINK; g.beginPath(); g.arc(cx, cy, 16, 0, 7); g.fill(); g.restore(); }
function macLaptop(g, t, x, y, s, k) { if (k <= 0) return; g.save(); g.translate(x, y); g.scale(s * easeOutBack(clamp(k)), s * easeOutBack(clamp(k))); g.fillStyle = DINK; g.fillRect(-190 + 10, -250 + 10, 380, 250); g.fillStyle = '#cfd3d8'; g.fillRect(-190, -250, 380, 250); g.fillStyle = '#10161c'; g.fillRect(-174, -236, 348, 210); g.fillStyle = '#cfd3d8'; g.fillRect(-230, 0, 460, 22); g.font = BNF(30); g.textAlign = 'center'; g.fillStyle = '#ff5b5b'; g.fillText('চলবে না ✕', 0, -150); const p = (t * 0.7) % 1; g.strokeStyle = '#fff'; g.lineWidth = 8; g.beginPath(); g.arc(0, -85, 30, p * 6.28, p * 6.28 + 4.5); g.stroke(); g.restore(); }
// chest lower-third for face shots (flat, nothing above the chin)
function chestPlate(g, t, t0, title, sub, e) { const E = ERA[e]; const k = clamp((t - t0) / 0.45); if (k <= 0) return; const y = 1480; g.save(); const gr = g.createLinearGradient(0, y - 260, 0, PH); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.6)'); g.fillStyle = gr; g.fillRect(0, y - 260, PW, PH - y + 260);
  g.font = BNF(92); const tw = g.measureText(title).width + 80, u = easeOut(clamp(k * 1.4)); g.fillStyle = DINK; g.fillRect(540 - tw / 2 + 14, y - 66 + 14, tw * u, 132); g.fillStyle = PAPER; g.fillRect(540 - tw / 2, y - 66, tw * u, 132); g.beginPath(); g.rect(540 - tw / 2, y - 66, tw * u, 132); g.clip(); g.fillStyle = DINK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(title, 540, y + 6 + (1 - easeOut(clamp((t - t0 - 0.1) / 0.35))) * 120); g.restore();
  const sk = easeOut(clamp((t - t0 - 0.3) / 0.35)); if (sk > 0) { g.save(); g.font = BNF(46); const sw = g.measureText(sub).width + 50; g.fillStyle = E.ac; g.fillRect(540 - sw / 2, y + 80, sw * sk, 72); g.beginPath(); g.rect(540 - sw / 2, y + 80, sw * sk, 72); g.clip(); g.fillStyle = DINK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sub, 540, y + 118); g.restore(); } }

// flat poster-style GTA VI logo on the chest: rises out of a mask with a hard duotone offset shadow, lands with a bounce
function logoFlat(g, t, t0, cx, cy, w) { const im = IMG['logo6_full.png']; const lt = t - t0; if (!im || lt <= 0) return; const h = w * 681 / 880;
  const k = clamp(lt / 0.32), u = easeOutBack(k), sh = clamp((lt - 0.18) / 0.25);
  const [c, x] = tmpC('LGSIL'); if (c.width !== Math.ceil(w)) { c.width = Math.ceil(w); c.height = Math.ceil(h); } x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, w, h); x.globalCompositeOperation = 'source-in'; x.fillStyle = ERA.vi6.ac; x.fillRect(0, 0, c.width, c.height);
  g.save(); g.beginPath(); g.rect(cx - w, cy - h / 2 - 60, 2 * w, h + 120); g.clip(); const yy = cy + (1 - u) * h * 1.15;
  g.drawImage(c, cx - w / 2 + 18 * sh, yy - h / 2 + 18 * sh); g.drawImage(im, cx - w / 2, yy - h / 2, w, h); g.restore();
  const lk = clamp((lt - 0.3) / 0.3); if (lk > 0) { g.save(); g.fillStyle = PAPER; g.fillRect(cx - (w / 2 + 30) * easeOut(lk), cy + h / 2 + 24, (w + 60) * easeOut(lk), 8); g.restore(); } }
// ---------- beats ----------
const B = []; const beat = (t0, e, tr, d) => B.push({ t0, e, tr, d });
// 0 FACE hook (punch zoom)
beat(0, 'face0', 'none', (g, t, b) => { logoFlat(g, t, 0.05, 540, 1190, 360); chestPlate(g, t, 0.6, 'GTA সিরিজ', 'কোন গেম কত কামাইছে?', 'vi6'); });
// 1 1997: GTA 1 + GTA 2 box art
beat(2.9, 'pix', 'pixel', (g, t, b) => { const lt = t - b.t0; head(g, '১৯৯৭', 540, 380, 170, S(t, b.t0 + 0.05, 0.4), ERA.pix.ac);
  pcard(g, 'GTA_-_Box_Front.jpg', { x: 90, y: 560, w: 420, h: 560 }, 'pix', clamp(lt / 0.35), { label: 'GTA', t0: b.t0, retro: true });
  pcard(g, 'GTA2_Box_art.jpg', { x: 570, y: 560, w: 420, h: 560 }, 'pix', clamp((t - 4.3) / 0.35), { label: 'GTA 2', t0: 4.3, retro: true, shadow: ERA.pix.ac2 });
  head(g, 'GTA আর GTA 2', 540, 1330, 92, S(t, 4.4), '#fff', { bar: ERA.pix.ac }); });
// 2 income report never published
beat(5.6, 'pix', 'push', (g, t, b) => { const lt = t - b.t0; pcard(g, 'GTA1_PC_in-game_screenshot.png', { x: 90, y: 300, w: 900, h: 520 }, 'pix', clamp(lt / 0.35), { label: 'GTA (১৯৯৭) গেমপ্লে', t0: b.t0, retro: true });
  redacted(g, t, 90, 900, 600, clamp((lt - 0.3) / 1.6), 'pix'); charPanel(g, 'confused', t, b.t0 + 0.6, { x: 720, y: 960, w: 290, h: 360 }, 'pix', { face: 'confused', z: 1.6, fy: 560 });
  head(g, 'আয়ের হিসাব প্রকাশ হয়নি', 540, 1490, 70, S(t, 6.8), '#fff', { bar: '#e8413a' }); });
// 3 "so I can't tell you either"
beat(8.6, 'pix', 'blocks', (g, t, b) => { const lt = t - b.t0; charPanel(g, 'shrug', t, b.t0, { x: 140, y: 360, w: 800, h: 820 }, 'pix', { z: 1.1, fy: 600, talk: true });
  qmarks(g, t, 540, 770, 470, clamp(lt / 1.2), ERA.pix.ac); head(g, 'সঠিক হিসাব কেউ জানে না', 540, 1350, 74, S(t, b.t0 + 0.4), '#fff', { bar: ERA.pix.ac }); });
// 4 how much did GTA 1 & 2 make? scrambling price tags
beat(11.38, 'pix', 'push', (g, t, b) => { const lt = t - b.t0; pcard(g, 'GTA_-_Box_Front.jpg', { x: 110, y: 380, w: 380, h: 500 }, 'pix', clamp(lt / 0.3), { label: 'GTA', t0: b.t0, retro: true });
  pcard(g, 'GTA2_Box_art.jpg', { x: 590, y: 380, w: 380, h: 500 }, 'pix', clamp((lt - 0.15) / 0.3), { label: 'GTA 2', t0: b.t0, retro: true, shadow: ERA.pix.ac2 });
  scramble(g, t, 300, 1040, clamp((lt - 0.5) / 0.3), 'pix'); scramble(g, t, 780, 1040, clamp((lt - 0.7) / 0.3), 'pix');
  head(g, 'মোট কত কামাইছে?', 540, 1290, 96, S(t, b.t0 + 0.5), '#fff'); charPanel(g, 'think', t, b.t0 + 1.2, { x: 340, y: 1420, w: 400, h: 330 }, 'pix', { z: 1.5, fy: 520 }); });
// 5 GTA III — Liberty City, $508M
beat(15.94, 'lib', 'rise', (g, t, b) => { const lt = t - b.t0; pcard(g, t < 18.3 ? 'gta3_shot05.jpg' : 'gta3_shot03.jpg', { x: 90, y: 330, w: 900, h: 620 }, 'lib', clamp(lt / 0.35), { label: 'GTA III · লিবার্টি সিটি', year: '2001', t0: t < 18.3 ? b.t0 : 18.3 });
  head(g, 'GTA 3', 540, 1110, 120, S(t, b.t0 + 0.2), ERA.lib.ac, { lat: true }); price(g, 'আনুমানিক আয়', 508, 'মিলিয়ন', 540, 1380, 'lib', clamp((t - A.r3) / 0.9));
  charPanel(g, 'point', t, A.r3 + 0.4, { x: 700, y: 1560, w: 300, h: 280 }, 'lib', { z: 1.6, fy: 520 }); });
// 6 Vice City — childhood emotion
beat(19.92, 'vice', 'vhs', (g, t, b) => { const lt = t - b.t0; pcard(g, t < 21.4 ? 'vc_shot04.jpg' : 'vcde_shot01.jpg', { x: 90, y: 320, w: 900, h: 560 }, 'vice', clamp(lt / 0.35), { label: 'Vice City', year: '2002', t0: t < 21.4 ? b.t0 : 21.4 });
  charPanel(g, 'cheer', t, A.emo - 0.1, { x: 230, y: 990, w: 620, h: 460 }, 'vice', { face: 'happy', z: 1.15, cy: 470, tag: 'ছোটবেলা' }); hearts(g, t, 540, 1150, clamp((t - A.emo) / 0.5));
  head(g, 'ছোটবেলার ইমোশন', 540, 1590, 92, S(t, A.emo + 0.1), '#fff', { bar: ERA.vice.ac }); });
// 7 Vice City revenue $613M
beat(22.9, 'vice', 'push', (g, t, b) => { const lt = t - b.t0; pcard(g, 'vc_shot01.jpg', { x: 90, y: 330, w: 900, h: 640 }, 'vice', clamp(lt / 0.35), { label: 'ভাইস সিটি · মায়ামি', t0: b.t0, shadow: ERA.vice.ac2 });
  price(g, 'আনুমানিক আয়', 613, 'মিলিয়ন', 540, 1270, 'vice', clamp((t - A.r_vc) / 0.9)); cashStack(g, 300, 1640, 1.3, 16, clamp((t - A.r_vc - 0.2) / 1.0)); cashStack(g, 540, 1640, 1.3, 22, clamp((t - A.r_vc - 0.3) / 1.0)); cashStack(g, 780, 1640, 1.3, 18, clamp((t - A.r_vc - 0.4) / 1.0)); });
// 8 San Andreas
beat(25.98, 'sa', 'rise', (g, t, b) => { const lt = t - b.t0; pcard(g, 'sa_shot03.jpg', { x: 90, y: 330, w: 900, h: 640 }, 'sa', clamp(lt / 0.35), { label: 'San Andreas', year: '2004', t0: b.t0 });
  head(g, 'স্যান অ্যান্ড্রিয়াস', 540, 1150, 100, S(t, b.t0 + 0.2), ERA.sa.ac2, { bar: ERA.sa.ac }); });
// 9 CJ — everyone knows him
beat(27.58, 'sa', 'push', (g, t, b) => { const lt = t - b.t0; pcard(g, 'sade_shot01.jpg', { x: 80, y: 330, w: 560, h: 820 }, 'sa', clamp(lt / 0.3), { label: 'CJ ভাই', t0: b.t0, dx: 40 });
  charPanel(g, 'point', t, b.t0 + 0.3, { x: 680, y: 560, w: 330, h: 520 }, 'sa', { z: 1.25, fy: 560, s: 0.95, pose: {}, tag: 'আমরা' });
  head(g, 'CJ ভাই', 540, 1330, 120, S(t, A.cj + 0.1), ERA.sa.ac, { bar: ERA.sa.ac2 }); head(g, 'কমবেশি সবাই চিনে', 540, 1490, 64, S(t, A.cj + 0.6), '#fff'); });
// 10 SA revenue $923M
beat(30.3, 'sa', 'blocks', (g, t, b) => { const lt = t - b.t0; pcard(g, 'sa_shot08.jpg', { x: 90, y: 330, w: 900, h: 600 }, 'sa', clamp(lt / 0.35), { label: 'গ্রোভ স্ট্রিট', t0: b.t0, shadow: ERA.sa.ac2 });
  head(g, 'CJ ভাইয়ের গেম কামাইছে…', 540, 1080, 66, S(t, b.t0 + 0.3), '#fff'); price(g, 'আনুমানিক আয়', 923, 'মিলিয়ন', 540, 1330, 'sa', clamp((t - A.r_sa) / 0.9));
  if (t > A.r_sa) moneyRain(g, t, 18, 0.9, 1); charPanel(g, 'surprised', t, A.r_sa + 0.3, { x: 380, y: 1560, w: 320, h: 280 }, 'sa', { face: 'surprised', z: 1.6, fy: 520 }); });
// 11 GTA IV — trailer footage, $2B
beat(35.3, 'lc4', 'rise', (g, t, b) => { const lt = t - b.t0; pcard(g, 'cg4', { x: 90, y: 330, w: 900, h: 620 }, 'lc4', clamp(lt / 0.35), { label: 'GTA IV · লিবার্টি সিটি', year: '2008', rec: true, still: false, zoom: 1.0 });
  head(g, 'GTA 4', 540, 1110, 120, S(t, b.t0 + 0.15), ERA.lc4.ac, { lat: true }); price(g, 'আনুমানিক আয়', 2, 'বিলিয়ন', 540, 1380, 'lc4', clamp((t - A.r4) / 0.9)); });
// 12 Niko + the race so far
beat(38.4, 'lc4', 'push', (g, t, b) => { const lt = t - b.t0; pcard(g, 'gta4_shot02.jpg', { x: 90, y: 330, w: 900, h: 560 }, 'lc4', clamp(lt / 0.35), { label: 'নিকো বেলিচ', t0: b.t0 });
  const games = [['GTA 3', 0.508, 'lib'], ['VC', 0.613, 'vice'], ['SA', 0.923, 'sa'], ['GTA 4', 2.0, 'lc4']]; games.forEach(([n, v, ee], i) => { const y = 1010 + i * 120, kk = easeOut(clamp((lt - 0.3 - i * 0.15) / 0.5)), w = 560 * v / 2 * kk; g.font = JAK(36); g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(n, 100, y); g.fillStyle = DINK; g.fillRect(290 + 10, y - 30 + 10, w, 60); g.fillStyle = ERA[ee].ac; g.fillRect(290, y - 30, w, 60); g.font = BNF(34); g.fillStyle = '#fff'; if (kk > 0.95) g.fillText('$' + (v < 1 ? BN(Math.round(v * 1000)) + 'M' : BN(v) + 'B'), 300 + w + 20, y); }); });
// 13 "now GTA 5"
beat(40.22, 'ls5', 'pixel', (g, t, b) => { const lt = t - b.t0; pcard(g, 'cg5', { x: 90, y: 330, w: 900, h: 620 }, 'ls5', clamp(lt / 0.3), { label: 'GTA V · লস সান্তোস', year: '2013', rec: true, still: false, zoom: 1.0 });
  head(g, 'এবার GTA 5', 540, 1170, 120, S(t, b.t0 + 0.15), ERA.ls5.ac, { bar: '#fff' }); });
// 14 FACE middle — the Mac joke
beat(41.6, 'face1', 'cut', (g, t, b) => { });
// 15 GTA V gameplay + $15B
beat(44.3, 'ls5', 'blocks', (g, t, b) => { const lt = t - b.t0; pcard(g, 'cg5e', { x: 90, y: 330, w: 900, h: 600 }, 'ls5', clamp(lt / 0.35), { label: 'GTA V গেমপ্লে', rec: true, still: false, zoom: 1.0 });
  if (t > A.r5) moneyRain(g, t, 34, 1, 1.3); head(g, 'এখন অবধি প্রায়', 540, 1070, 62, S(t, b.t0 + 0.6), '#fff'); price(g, 'মোট ব্যবসা', 15, 'বিলিয়ন', 540, 1300, 'ls5', clamp((t - A.r5) / 1.0), { size: 140 });
  charPanel(g, 'surprised', t, A.r5 + 0.2, { x: 300, y: 1520, w: 480, h: 330 }, 'ls5', { face: 'surprised', z: 1.5, fy: 520, tag: 'কী!' }); });
// 16 bar race — GTA V breaks the chart
beat(47.6, 'ls5', 'rise', (g, t, b) => { barRace(g, t, b.t0, 'ls5'); head(g, 'সবাইকে ছাড়িয়ে GTA 5', 540, 330, 74, S(t, b.t0 + 0.9), '#fff', { bar: ERA.ls5.ac });
  pcard(g, 'cg5fp', { x: 640, y: 1560, w: 360, h: 260 }, 'ls5', clamp((t - b.t0 - 0.2) / 0.3), { still: false, zoom: 1.0 }); });
// 17 GTA VI
beat(50.62, 'vi6', 'vhs', (g, t, b) => { const lt = t - b.t0; pcard(g, 'Grand_Theft_Auto_VI.png', { x: 230, y: 300, w: 620, h: 830 }, 'vi6', clamp(lt / 0.35), { label: 'GTA VI', t0: b.t0, contain: false });
  head(g, 'আমাদের ধনী গেম', 540, 1300, 92, S(t, b.t0 + 0.4), '#fff', { bar: ERA.vi6.ac }); head(g, 'GTA 6', 540, 1460, 120, S(t, b.t0 + 0.7), ERA.vi6.ac2, { lat: true }); });
// 18 $3B+ in ONE day ... "nake?"
beat(53.0, 'vi6', 'push', (g, t, b) => { const lt = t - b.t0; pcard(g, 'cg6e', { x: 90, y: 300, w: 900, h: 480 }, 'vi6', clamp(lt / 0.35), { label: 'GTA VI · লঞ্চ ট্রেইলার', rec: true, still: false, zoom: 1.0 });
  clock1d(g, t, 250, 1010, 150, clamp((t - A.r6 + 0.5) / 1.2), 'vi6'); head(g, 'মাত্র ১ দিনে', 700, 1010, 66, S(t, A.r6 - 0.2), '#fff');
  if (t > A.r6 + 0.4) moneyRain(g, t, 26, 0.9, 1.2); price(g, 'আয় (শোনা যায়)', 3, 'বিলিয়ন', 540, 1340, 'vi6', clamp((t - A.r6 - 0.3) / 0.9), { plus: true });
  charPanel(g, 'think', t, A.nak - 0.1, { x: 320, y: 1540, w: 440, h: 300 }, 'vi6', { z: 1.5, fy: 520, tag: 'নাকি?' }); });
// 19 comment box
beat(57.0, 'vi6', 'blocks', (g, t, b) => { const lt = t - b.t0; head(g, 'আপনার কী মনে হয়?', 540, 400, 84, S(t, b.t0 + 0.1), '#fff', { bar: ERA.vi6.ac }); commentBox(g, t, A.comment - 0.3, 'vi6', clamp((t - A.comment + 0.6) / 0.4));
  charPanel(g, 'point', t, b.t0 + 0.2, { x: 260, y: 1150, w: 560, h: 520 }, 'vi6', { z: 1.2, fy: 580, talk: true }); });
// 20 FACE end
beat(59.8, 'face2', 'cut', (g, t, b) => chestPlate(g, t, 60.0, 'কমেন্টে জানান', 'GTA 6 মোট কত কামাবে?', 'vi6'));
// ---------- render ----------
let OUTP, OG, PREVP, PG2, FINP, FG, SMALL;
B.sort((a, b) => a.t0 - b.t0); B.forEach((b, i) => b.t1 = i < B.length - 1 ? B[i + 1].t0 : DUR); window.CUTS = B.slice(1).map(b => b.t0);
function drawBeat(g, bi, t) { const b = B[bi], d = t - b.t0, len = Math.max(0.5, b.t1 - b.t0); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.clearRect(0, 0, PW, PH); NOW = t;
  const face = b.e.startsWith('face'); const u = 1 - Math.pow(1 - clamp(d / Math.min(len, 5)), 2); let z = 1 + 0.03 * u, sx = 0, sy = 0;
  if (face && b.t0 === 0) { z = lerp(1.0, 1.24, easeOut(clamp(t / 0.15))) + 0.03 * u; const sh = t > 0.1 ? Math.max(0, 1 - (t - 0.1) / 0.35) : 0; sx = Math.sin(t * 90) * 16 * sh; sy = Math.cos(t * 75) * 11 * sh; }
  else if (face) { z = lerp(1.0, 1.12, easeOut(clamp(d / 0.14))) + 0.03 * u; const sh = d > 0.08 ? Math.max(0, 1 - (d - 0.08) / 0.25) : 0; sx = Math.sin(d * 90) * 9 * sh; }
  g.save(); g.translate(PW / 2 + sx, PH * 0.4 + sy); g.scale(z, z); g.translate(-PW / 2, -PH * 0.4);
  if (face) { const im = IMG['f' + b.e.slice(4)]; if (im) g.drawImage(im, 0, 0, PW, PH); } else bgEra(g, t, b.e);
  g.restore(); if (!face) hud(g, t, b.e);
  g.save(); if (face) { g.translate(sx * 0.3, sy * 0.3); } b.d(g, t, b); g.restore(); }
function finish(dst, src, b, t) { dst.setTransform(1, 0, 0, 1, 0, 0); dst.globalAlpha = 1; dst.globalCompositeOperation = 'source-over'; dst.filter = 'none'; dst.drawImage(src, 0, 0);
  dst.globalCompositeOperation = 'overlay'; dst.globalAlpha = 0.05; const ox = Math.floor(hash(Math.floor(t * 24)) * 512), oy = Math.floor(hash(Math.floor(t * 24) + 7) * 512); dst.save(); dst.translate(-ox, -oy); dst.fillStyle = dst.createPattern(GRAIN, 'repeat'); dst.fillRect(ox, oy, PW, PH); dst.restore(); dst.globalCompositeOperation = 'source-over'; dst.globalAlpha = 1; }
function render(i) { const t = i / FPS; NOW = t; let bi = B.findIndex(b => t >= b.t0 && t < b.t1); if (bi < 0) bi = B.length - 1; const b = B[bi], d = t - b.t0;
  drawBeat(OG, bi, t); const TRD = { push: 0.32, rise: 0.32, pixel: 0.3, blocks: 0.36 }[b.tr] || 0;
  if (bi > 0 && d < TRD) { drawBeat(PG2, bi - 1, t); const p = easeIO(d / TRD); const [c, x] = tmpC('NEWP'); if (c.width !== PW) { c.width = PW; c.height = PH; } x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, PW, PH); x.drawImage(OUTP, 0, 0); OG.save(); OG.setTransform(1, 0, 0, 1, 0, 0); OG.clearRect(0, 0, PW, PH);
    if (b.tr === 'push') { OG.drawImage(PREVP, -p * PW, 0); OG.drawImage(c, PW - p * PW, 0); OG.fillStyle = ERA[b.e] ? ERA[b.e].ac : '#fff'; OG.fillRect(PW - p * PW - 14, 0, 14, PH); }
    else if (b.tr === 'rise') { OG.drawImage(PREVP, 0, -p * PH * 0.35); OG.fillStyle = 'rgba(0,0,0,' + p * 0.6 + ')'; OG.fillRect(0, 0, PW, PH); OG.drawImage(c, 0, PH - p * PH); OG.fillStyle = ERA[b.e] ? ERA[b.e].ac : '#fff'; OG.fillRect(0, PH - p * PH - 14, PW, 14); }
    else if (b.tr === 'pixel') { const q = d / TRD, src = q < 0.5 ? PREVP : c, lv = q < 0.5 ? q * 2 : (1 - q) * 2, s = Math.max(4, Math.round(lerp(PW, 18, easeIO(lv)))); const [sc, sx] = tmpC('PIX'); sc.width = s; sc.height = Math.round(s * PH / PW); sx.imageSmoothingEnabled = true; sx.drawImage(src, 0, 0, sc.width, sc.height); OG.imageSmoothingEnabled = false; OG.drawImage(sc, 0, 0, PW, PH); OG.imageSmoothingEnabled = true; }
    else if (b.tr === 'blocks') { OG.drawImage(PREVP, 0, 0); const ac = ERA[b.e] ? ERA[b.e].ac : '#fff'; for (let k = 0; k < 6; k++) { const pk = easeIO(clamp((d / TRD) * 1.7 - k * 0.12)), y0 = k * PH / 6, h = PH / 6 + 2; const dir = k % 2 ? 1 : -1; OG.save(); OG.beginPath(); const x0 = dir > 0 ? PW - pk * PW : 0; OG.rect(x0, y0, pk * PW, h); OG.clip(); OG.drawImage(c, 0, 0); OG.restore(); if (pk > 0 && pk < 1) { OG.fillStyle = ac; OG.fillRect(dir > 0 ? x0 - 12 : pk * PW, y0, 12, h); } } }
    OG.restore(); }
  if (bi > 0 && b.tr === 'vhs' && d < 0.3) { const w = 1 - d / 0.3; const [c, x] = tmpC('VHS'); if (c.width !== PW) { c.width = PW; c.height = PH; } x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, PW, PH); x.drawImage(OUTP, 0, 0); OG.save(); OG.setTransform(1, 0, 0, 1, 0, 0); OG.clearRect(0, 0, PW, PH); OG.drawImage(c, 0, 0); OG.globalCompositeOperation = 'screen'; OG.globalAlpha = 0.6 * w; OG.drawImage(c, 18 * w, 0); OG.drawImage(c, -18 * w, 0); OG.globalCompositeOperation = 'source-over'; OG.globalAlpha = 1; for (let s = 0; s < 8; s++) { const y0 = hash(s + Math.floor(t * 40)) * PH, h = 20 + hash(s + 3) * 90, off = (hash(s + 9 + Math.floor(t * 40)) - 0.5) * 120 * w; OG.drawImage(c, 0, y0, PW, h, off, y0, PW, h); } OG.fillStyle = `rgba(255,255,255,${0.12 * w})`; for (let y = 0; y < PH; y += 6) OG.fillRect(0, y, PW, 2); OG.restore(); }
  finish(FG, OUTP, b, t);
  if (bi === 0 && t < 0.1) { FG.fillStyle = `rgba(255,255,255,${0.75 * (1 - t / 0.1)})`; FG.fillRect(0, 0, PW, PH); }
  if (b.e.startsWith('face') && bi > 0 && d < 0.08) { FG.fillStyle = `rgba(255,255,255,${0.5 * (1 - d / 0.08)})`; FG.fillRect(0, 0, PW, PH); } }
(async () => {
  await new Promise(r => document.readyState === 'complete' ? r() : addEventListener('load', r));
  await Promise.all(['bold 40px "Nirmala UI"', '800 40px "Plus Jakarta Sans"'].map(f => document.fonts.load(f)));
  const SHEET = await prepareSheet(); buildRig2(SHEET); buildPost(); WC = mk(W, H); WG = WC.getContext('2d'); OUTP = mk(PW, PH); OG = OUTP.getContext('2d'); PREVP = mk(PW, PH); PG2 = PREVP.getContext('2d'); FINP = mk(PW, PH); FG = FINP.getContext('2d');
  window.frame = async i => { const t = i / FPS; await preload(t); render(i); return FINP.toDataURL('image/jpeg', 0.92); };
  window.still = async arg => { const out = []; for (const t of String(arg).split(',').map(Number)) { await preload(t); try { render(Math.round(t * FPS)); } catch (e) { console.log('ERR ' + t + ' ' + e.message + ' | ' + (e.stack || '').split('\n')[1]); } out.push([`s_${String(t).replace('.', '_')}.jpg`, FINP.toDataURL('image/jpeg', 0.85)]); } return out; };
  window.ready = true;
})();
