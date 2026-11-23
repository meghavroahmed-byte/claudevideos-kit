// gta6ui.js: 2D layer for the GTA-6 short: reference-style label pills (dark pill, red outline),
// red-ringed x-ray circles, money counters, stamps, the user's full-body character (rig iframe) with lip-sync.
// All times are in the edited timeline (seconds). window.TL / window.ENV come from tl.js.
const A = window.TL.ev;            // word anchors
const RIG = () => document.getElementById('rig').contentWindow;
const RED = '#ff3b3b', GOLD = '#ffd23f', MINT = '#43f0a0';
const BN = s => String(s).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
// lighter finish for a daylight world
drawFinish = function (g, i) {
  const v = g.createRadialGradient(W / 2, H * 0.5, H * 0.32, W / 2, H * 0.5, H * 0.8); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.38)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.04; g.globalCompositeOperation = 'overlay'; g.drawImage(GRAIN[i % GRAIN.length], 0, 0, W, H); g.restore();
};
function mouthAt(t) { const E = window.ENV || [], i = Math.round(t * 30); if (i < 1 || i >= E.length - 1) return 0; const db = (E[i - 1] + 2 * E[i] + E[i + 1]) / 4; return clamp((db + 42) / 20) * (0.65 + 0.35 * Math.abs(Math.sin(t * 17))); }
// ---- reference-style label pill (top) ----
function refPill(g, t, t0, t1, txt, y = 330, size = 58) {
  if (t < t0 || t > t1) return; const p = popIn(t, t0, t1);
  g.save(); g.globalAlpha = p.a; g.translate(W / 2, y); g.scale(p.s, p.s);
  g.font = `800 ${size}px ${FONT}`; const tw = g.measureText(txt).width, h = size * 1.55, w = tw + size * 1.2;
  g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 24; g.shadowOffsetY = 8; rr(g, -w / 2, -h / 2, w, h, 22); g.fillStyle = '#10232b'; g.fill();
  g.shadowColor = 'transparent'; g.lineWidth = 5; g.strokeStyle = '#ff5a3c'; g.stroke(); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,0.18)'; rr(g, -w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 16); g.stroke();
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 0, 4); g.restore();
}
// ---- red-ringed x-ray / zoom circle that pops on a 3D point; fn draws the inside (local coords, radius r) ----
function xray(g, t, t0, t1, p3, r, fn, o = {}) {
  if (t < t0 || t > t1) return; const s = window.toScr(...p3); if (!s.vis) return; const x = o.x != null ? o.x : s.x, y = o.y != null ? o.y : s.y;
  const k = Math.max(0.001, back(clamp((t - t0) / 0.4)) * clamp((t1 - t) / 0.25)), R = r * k;
  g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 40; g.beginPath(); g.arc(x, y, R + 10, 0, 7); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fill(); g.restore();
  g.save(); g.beginPath(); g.arc(x, y, R, 0, 7); g.clip(); g.translate(x, y); g.scale(R / r, R / r); fn(g, t - t0, r);
  const sh = g.createRadialGradient(0, 0, r * 0.6, 0, 0, r); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.45)'); g.fillStyle = sh; g.fillRect(-r, -r, r * 2, r * 2); g.restore();
  g.save(); g.lineWidth = 10; g.strokeStyle = RED; g.shadowColor = RED; g.shadowBlur = 18; g.beginPath(); g.arc(x, y, R, 0, 7); g.stroke(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.globalAlpha = 0.7; g.beginPath(); g.arc(x, y, Math.max(1, R - 9), 0, 7); g.stroke(); g.restore();
  if (o.lead && k > 0.6) { const L = o.lead; g.save(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.globalAlpha = clamp((t - t0 - 0.3) / 0.3); g.beginPath(); g.moveTo(x + Math.cos(L[0]) * R, y + Math.sin(L[0]) * R); g.lineTo(L[1], L[2]); g.stroke(); g.restore(); }
}
// ---- inside drawings ----
function inCash(g, lt, r) { // vault of cash + gold glow
  const gr = g.createRadialGradient(0, 0, 10, 0, 0, r); gr.addColorStop(0, '#3a2c10'); gr.addColorStop(1, '#120c04'); g.fillStyle = gr; g.fillRect(-r, -r, 2 * r, 2 * r);
  for (let i = 0; i < 26; i++) { const row = Math.floor(i / 5), col = i % 5, x = -r * 0.8 + col * r * 0.36 + (row % 2) * 18, y = r * 0.55 - row * 40 - Math.min(1, lt * 2) * 0; const k = clamp(lt * 3 - i * 0.06); if (k <= 0) continue; g.save(); g.translate(x, y + (1 - eOut(k)) * -200); g.fillStyle = i % 3 ? '#7cc98a' : '#6ab478'; g.strokeStyle = '#1d5a2c'; g.lineWidth = 3; rr(g, -48, -16, 96, 32, 5); g.fill(); g.stroke(); g.fillStyle = '#e9d27a'; g.fillRect(-10, -16, 20, 32); g.restore(); }
  g.save(); g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(0, -r * 0.2, 0, 0, -r * 0.2, r); gl.addColorStop(0, 'rgba(255,210,80,0.45)'); gl.addColorStop(1, 'rgba(255,210,80,0)'); g.fillStyle = gl; g.fillRect(-r, -r, 2 * r, 2 * r); g.restore();
  g.font = `800 ${r * 0.42}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = GOLD; g.shadowColor = '#000'; g.shadowBlur = 20; g.fillText('$$$', 0, -r * 0.45);
}
function inDevs(g, lt, r) { // open-plan office: rows of devs typing at glowing monitors
  const gr = g.createLinearGradient(0, -r, 0, r); gr.addColorStop(0, '#0d1626'); gr.addColorStop(1, '#05080f'); g.fillStyle = gr; g.fillRect(-r, -r, 2 * r, 2 * r);
  for (let row = 0; row < 4; row++) { const sc = 0.45 + row * 0.22, y = -r * 0.55 + row * r * 0.42; for (let i = -4; i <= 4; i++) { const x = i * 150 * sc + ((lt * 30 * sc) % (150 * sc)); const mw = 90 * sc, mh = 56 * sc; g.fillStyle = '#0a0f18'; rr(g, x - mw / 2 - 4, y - mh - 30 * sc, mw + 8, mh + 8, 4); g.fill(); const mg = g.createLinearGradient(0, y - mh - 26 * sc, 0, y - 26 * sc); mg.addColorStop(0, '#2ab8ff'); mg.addColorStop(1, '#0a4a7a'); g.fillStyle = mg; g.fillRect(x - mw / 2, y - mh - 26 * sc, mw, mh); g.fillStyle = 'rgba(255,255,255,0.7)'; for (let l = 0; l < 4; l++) g.fillRect(x - mw / 2 + 6, y - mh - 20 * sc + l * 11 * sc, (mw - 14) * (0.3 + 0.6 * ((Math.sin(i * 7 + l * 3 + Math.floor(lt * 6)) + 1) / 2)), 3 * sc);
      const bob = Math.sin(lt * 18 + i * 2 + row) * 2; g.fillStyle = ['#ff6b9a', '#3de8ff', '#ffd23f', '#9b6bff'][(i + row + 8) & 3]; rr(g, x - 30 * sc, y - 6 * sc + bob, 60 * sc, 70 * sc, 18 * sc); g.fill(); g.fillStyle = '#2a1b14'; g.beginPath(); g.arc(x, y - 22 * sc + bob, 20 * sc, 0, 7); g.fill(); } }
}
function inChest(g, lt, r) { g.fillStyle = '#2a1a0a'; g.fillRect(-r, -r, 2 * r, 2 * r); for (let i = 0; i < 40; i++) { const a = i * 2.4, d = (i / 40) * r * 0.85; const x = Math.cos(a) * d, y = Math.sin(a) * d * 0.6 + r * 0.15; g.save(); g.translate(x, y); g.rotate(a); const gg = g.createLinearGradient(-30, -10, 30, 10); gg.addColorStop(0, '#fff3a0'); gg.addColorStop(0.5, '#ffc83a'); gg.addColorStop(1, '#b07a10'); g.fillStyle = gg; rr(g, -34, -12, 68, 24, 4); g.fill(); g.restore(); }
  g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 8; i++) { const a = lt * 2 + i, x = Math.cos(a * 1.3 + i) * r * 0.6, y = Math.sin(a + i * 2) * r * 0.5; const s = (Math.sin(lt * 6 + i) + 1) * 6 + 4; g.fillStyle = 'rgba(255,255,220,0.9)'; g.beginPath(); g.moveTo(x, y - s * 2); g.lineTo(x + s * 0.4, y); g.lineTo(x, y + s * 2); g.lineTo(x - s * 0.4, y); g.fill(); g.beginPath(); g.moveTo(x - s * 2, y); g.lineTo(x, y + s * 0.4); g.lineTo(x + s * 2, y); g.lineTo(x, y - s * 0.4); g.fill(); } g.restore(); }
function inWire(g, lt, r) { // wireframe twin of the mocap actor
  g.fillStyle = '#04121c'; g.fillRect(-r, -r, 2 * r, 2 * r); g.strokeStyle = 'rgba(61,232,255,0.25)'; g.lineWidth = 1; for (let i = -r; i < r; i += 30) { g.beginPath(); g.moveTo(i, -r); g.lineTo(i, r); g.moveTo(-r, i); g.lineTo(r, i); g.stroke(); }
  const ph = lt * 3.2, s = Math.sin(ph); const J = { hip: [0, 30], neck: [6 * s, -110], head: [8 * s, -150], elL: [-55, -60 + 20 * s], haL: [-45 + 60 * Math.max(0, s), -100 + 25 * s], elR: [55, -60 - 20 * s], haR: [45 + 80 * Math.max(0, -s), -110 - 25 * s], knL: [-28 + 22 * s, 100], ftL: [-36 + 34 * s, 170], knR: [28 - 22 * s, 100], ftR: [36 - 34 * s, 170] };
  g.strokeStyle = '#3de8ff'; g.shadowColor = '#3de8ff'; g.shadowBlur = 12; g.lineWidth = 5; g.lineCap = 'round'; [['hip', 'neck'], ['neck', 'elL'], ['elL', 'haL'], ['neck', 'elR'], ['elR', 'haR'], ['hip', 'knL'], ['knL', 'ftL'], ['hip', 'knR'], ['knR', 'ftR']].forEach(([a, b]) => { g.beginPath(); g.moveTo(...J[a]); g.lineTo(...J[b]); g.stroke(); });
  g.beginPath(); g.arc(J.head[0], J.head[1], 26, 0, 7); g.stroke(); g.fillStyle = '#e9ff7a'; for (const k in J) { g.beginPath(); g.arc(J[k][0], J[k][1], 7, 0, 7); g.fill(); } g.shadowBlur = 0;
}
// ---- the user's character (full body) in a white rounded frame, lip-synced ----
function charCard(g, t, t0, t1, act, x, y, s, o = {}) {
  if (t < t0 || t > t1) return; const p = popIn(t, t0, t1), f = RIG(); if (!f || !f.drawChar) return;
  const cw = o.w || 420, ch = o.h || 560;
  const cv = f.drawChar(cw * 2, ch * 2, cw, ch * 2 - 40, s, act, t - t0, Object.assign({ t, mouth: o.talk === false ? 0 : mouthAt(t), face: o.face }, o.opts || {}));
  g.save(); g.globalAlpha = p.a; g.translate(x, y); g.scale(p.s, p.s);
  if (o.frame !== false) { g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 30; g.shadowOffsetY = 10; rr(g, -cw / 2, -ch / 2, cw, ch, 34); const bg = g.createLinearGradient(0, -ch / 2, 0, ch / 2); bg.addColorStop(0, o.bg0 || '#cfe9ff'); bg.addColorStop(1, o.bg1 || '#fdf3e3'); g.fillStyle = bg; g.fill(); g.shadowColor = 'transparent'; g.lineWidth = 6; g.strokeStyle = '#ffffff'; g.stroke(); g.save(); rr(g, -cw / 2, -ch / 2, cw, ch, 34); g.clip(); g.drawImage(cv, -cw, -ch * 1.5 + ch / 2 - ch / 2 + 20, cw * 2, ch * 2); g.restore(); }
  else g.drawImage(cv, -cw, -ch * 2 + 40, cw * 2, ch * 2);
  g.restore();
}
// big counter
function counter(g, t, t0, t1, from, to, fmt, y, size = 150, col = GOLD) { if (t < t0 || t > t1) return; const p = popIn(t, t0, t1); g.save(); g.globalAlpha = p.a; g.translate(W / 2, y); g.scale(p.s, p.s); const v = lerp(from, to, eOut((t - t0) / 1.0)); g.font = `800 ${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = size * 0.12; g.strokeStyle = 'rgba(10,14,20,0.85)'; g.lineJoin = 'round'; g.strokeText(fmt(v), 0, 0); const gr = g.createLinearGradient(0, -size / 2, 0, size / 2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, col); g.fillStyle = gr; g.shadowColor = col; g.shadowBlur = 30; g.fillText(fmt(v), 0, 0); g.restore(); }
// compare bars card
function compare(g, t, t0, t1, y) { withPop(g, t, t0, t1, W / 2, y + 150, () => { glassCard(g, 90, y, 900, 310, { line: 'rgba(255,90,60,0.6)' }); const rows = [['GTA 6', 1.0, '$২ বিলিয়ন', '#ff3d9a', t0 + 0.2], ['বুর্জ খলিফা', 0.75, '$১.৫ বিলিয়ন', '#53e0ff', t0 + 0.6]];
  rows.forEach(([lb, v, val, col, ts], i) => { const yy = y + 90 + i * 120, k = eOut((t - ts) / 0.9); g.font = `800 40px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(lb, 130, yy - 28); g.textAlign = 'right'; g.fillStyle = col; g.fillText(val, 950, yy - 28); rr(g, 130, yy + 4, 820, 30, 15); g.fillStyle = 'rgba(255,255,255,0.1)'; g.fill(); rr(g, 130, yy + 4, Math.max(30, 820 * v * clamp(k)), 30, 15); g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 20; g.fill(); g.shadowBlur = 0; }); }); }
// "x" list of items (open world / characters / mocap / voice / tech)
function featureRail(g, t, items, y) { items.forEach(([txt, ts, col], i) => { if (t < ts) return; const k = back(clamp((t - ts) / 0.35)); const done = t > (items[i + 1] ? items[i + 1][1] : 1e9); g.save(); g.globalAlpha = done ? 0.55 : 1; g.translate(W / 2, y + i * 0); g.restore(); }); }

SCENE.ui = (g, t) => {
  const S = window.TL.st;
  // A: hook
  refPill(g, t, 2.0, S.A[1] + 0.1, 'GTA 6');
  xray(g, t, 2.1, S.A[1] + 0.05, [0, 3.6, Z_('A') + 0.4], 210, inCash, { lead: [-2.3, 300, 1500] });
  stamp(g, t, 2.3, S.A[1] + 0.05, 'এত দামি কেন?', 1480, 112, GOLD, '#7a4a00');
  // B: Burj Khalifa
  refPill(g, t, S.B[0] + 0.1, A.burj - 0.05, 'খরচের টাকা');
  counter(g, t, S.B[0] + 0.3, A.burj, 0, 2000000000, v => '$' + Math.round(v).toLocaleString('en-US'), 1480, 92, MINT);
  refPill(g, t, A.burj, S.B[1], 'বুর্জ খলিফা');
  stamp(g, t, A.shunchen, A.shunchen + 2.0, 'ঠিকই শুনছেন!', 560, 120, GOLD, '#7a4a00');
  charCard(g, t, A.shunchen, S.B[1] + 0.05, 'surprised', 790, 1460, 0.42, { w: 360, h: 470, face: 'surprised' });
  // C: budget
  refPill(g, t, S.C[0] + 0.1, S.C[1], 'GTA 6 বাজেট');
  counter(g, t, A.b1, A.b2 - 0.05, 0, 1, v => '$' + BN(v.toFixed(0)) + ' বিলিয়ন', 1460, 120, GOLD);
  counter(g, t, A.b2, A.b3 - 0.05, 1, 1.5, v => '$' + BN(v.toFixed(1)) + ' বিলিয়ন', 1460, 120, GOLD);
  counter(g, t, A.b3, A.cmp - 0.1, 1.5, 2, v => '$' + BN(v.toFixed(0)) + ' বিলিয়ন', 1460, 130, '#ff7a5a');
  chip(g, t, A.b3 + 0.3, A.cmp - 0.1, 'বেশিরভাগ সূত্র মতে', W / 2, 1600, '#ff7a5a', 34);
  compare(g, t, A.cmp, A.dami - 0.05, 1300);
  stamp(g, t, A.dami, S.C[1], 'বুর্জ খলিফার চেয়েও দামি!', 1450, 84, '#ff3d6e', '#7a0f26');
  // D: question + developers
  stamp(g, t, S.D[0] + 0.05, A.devs - 0.1, 'এত টাকা কেন?', 520, 120, GOLD, '#7a4a00');
  charCard(g, t, S.D[0] + 0.2, A.devs - 0.1, 'confused', W / 2, 1380, 0.5, { w: 430, h: 560, face: 'confused' });
  refPill(g, t, A.devs, A.open - 0.05, 'হাজার হাজার ডেভেলপার');
  xray(g, t, A.devs + 0.1, A.open - 0.05, [0, 7, Z_('D') - 3], 250, inDevs, {});
  chip(g, t, A.years, A.open - 0.05, 'বছরের পর বছর কাজ', W / 2, 1560, GOLD, 40);
  // E/F: features
  refPill(g, t, A.open, A.chars - 0.05, 'বিশাল ওপেন ওয়ার্ল্ড');
  refPill(g, t, A.chars, A.mocap - 0.05, 'বাস্তবসম্মত চরিত্র');
  refPill(g, t, A.mocap, A.voice - 0.05, 'মোশন ক্যাপচার');
  xray(g, t, A.mocap + 0.1, A.voice + 0.6, [-2, 3.2, Z_('F')], 190, inWire, { x: 800, y: 760 });
  refPill(g, t, A.voice, A.tech - 0.05, 'ভয়েস অ্যাক্টিং');
  refPill(g, t, A.tech, S.F[1] + 0.05, 'আধুনিক প্রযুক্তি');
  // checklist on the side for the 5 features
  const feats = [['ওপেন ওয়ার্ল্ড', A.open], ['চরিত্র', A.chars], ['মোশন ক্যাপচার', A.mocap], ['ভয়েস', A.voice], ['প্রযুক্তি', A.tech]];
  if (t > A.open && t < S.F[1] + 0.1) { const fo = clamp((S.F[1] + 0.1 - t) / 0.25); feats.forEach(([s, ts], i) => { const k = back(clamp((t - ts) / 0.35)); if (k <= 0) return; g.save(); g.globalAlpha = fo; g.translate(70 - (1 - k) * 300, 1290 + i * 84); pill(g, s, 0, 0, i === feats.filter(f => t >= f[1]).length - 1 ? GOLD : MINT, { icon: true, size: 32 }); g.restore(); }); }
  // G: virtual world
  refPill(g, t, S.G[0] + 0.2, S.G[1], 'শুধু গেম না…');
  stamp(g, t, A.virtual, S.G[1] + 0.05, 'ভার্চুয়াল দুনিয়া', 1450, 120, '#53e0ff', '#0b3a5a');
  charCard(g, t, A.gameNoi, A.virtual - 0.05, 'shrug', W / 2, 1420, 0.48, { w: 420, h: 540 });
  // H: release day
  refPill(g, t, S.H[0] + 0.1, A.inc - 0.05, 'রিলিজের ২৪ ঘণ্টায়');
  counter(g, t, A.inc, A.kolpona - 0.05, 0, 3, v => '$' + BN(v.toFixed(0)) + ' বিলিয়ন', 1460, 130, MINT);
  xray(g, t, A.inc + 0.1, A.kolpona - 0.05, [5, 1.6, Z_('H')], 200, inChest, { x: 760, y: 1030 });
  refPill(g, t, A.kolpona, S.H[1], 'এক দিনেই লাভ');
  counter(g, t, A.labh, S.H[1], 0, 1, v => '$' + BN(v.toFixed(0)) + ' বিলিয়ন+', 1440, 130, GOLD);
  charCard(g, t, A.kolpona, S.H[1], 'surprised', 820, 1000, 0.36, { w: 320, h: 420, face: 'surprised' });
  // I: phone / comment
  refPill(g, t, S.I[0] + 0.1, A.comment - 0.05, 'আপনি কোন দলে?');
  charCard(g, t, A.phone, A.comment - 0.05, 'sad', 800, 1450, 0.4, { w: 360, h: 470, face: 'sad', opts: { pose: { item: { type: 'phone', hand: 'R' } } } });
  withPop(g, t, A.comment - 0.1, window.TL.dur, W / 2, 1450, () => { glassCard(g, 90, 1330, 900, 240); g.fillStyle = GOLD; g.beginPath(); g.arc(150, 1390, 16, 0, 7); g.fill(); label(g, 'কমেন্টে জানান', 182, 1390, GOLD, 26); g.font = `700 44px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; const ans = typeText(t, A.comment + 0.2, 'খেলছি 🎮  /  শুধু ইউটিউবে দেখি 📱', 16); g.fillText(ans, 150, 1475); });
};
function Z_(k) { return window.STZ ? window.STZ[k] : 0; }
const _boot = boot; boot = async () => { await _boot(); window.ready = false; const f = document.getElementById('rig'); while (!(f.contentWindow && f.contentWindow.rigReady)) await new Promise(r => setTimeout(r, 50)); window.ready = true; };
