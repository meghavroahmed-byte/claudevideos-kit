// docui.js: documentary 2D layer over the 3D (Vice-neon palette): section chip, kinetic headline,
// infographics (bar chart, comparison bars, checklist, 24h ring, poll card), cut transitions, film finish.
// Never drawn over the face: face pieces replace these frames in assembly.
const A = window.TL.ev, S = window.TL.st;
const BN = s => String(s).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const PINK = '#f2b84b', CYAN = '#4fc7d6', VIO = '#d9c7a1', MINT = '#7fd6a8', HOT = '#e5533d', WHITE = '#f4f2ec';
const ease3 = k => 1 - Math.pow(1 - clamp(k), 3);
// film finish: teal/magenta split, soft contrast, vignette, grain
drawFinish = function (g, i) {
  g.save(); g.globalCompositeOperation = 'soft-light'; const sp = g.createLinearGradient(0, 0, 0, H); sp.addColorStop(0, 'rgba(20,60,80,0.28)'); sp.addColorStop(1, 'rgba(120,80,30,0.22)'); g.fillStyle = sp; g.fillRect(0, 0, W, H); g.restore();
  const v = g.createRadialGradient(W / 2, H * 0.47, H * 0.3, W / 2, H * 0.47, H * 0.8); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.62)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.06; g.globalCompositeOperation = 'overlay'; g.drawImage(GRAIN[i % GRAIN.length], 0, 0, W, H); g.restore();
};
function headline(g, t, t0, t1, txt, col = PINK, y = 1640, size = 128) {
  if (t < t0 || t > t1) return; const lt = t - t0, u = clamp(lt / 0.22), out = clamp((t1 - t) / 0.18); const sc = lerp(1.8, 1, ease3(u));
  g.save(); g.globalAlpha = clamp(u * 3) * out; g.translate(W / 2, y); g.scale(sc, sc); if (u < 1) g.filter = `blur(${(1 - u) * 10}px)`;
  g.font = `800 ${size}px ${FONT}`; const w = g.measureText(txt).width; if (w > 960) { const k = 960 / w; g.scale(k, k); }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.shadowColor = col; g.shadowBlur = 50; g.lineWidth = size * 0.14; g.strokeStyle = '#06080b'; g.strokeText(txt, 0, 0); g.shadowBlur = 0;
  const gr = g.createLinearGradient(0, -size / 2, 0, size / 2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, col); gr.addColorStop(1, mix(col, '#1a1208', 0.4)); g.fillStyle = gr; g.fillText(txt, 0, 0); g.restore();
}
function chipTop(g, t, t0, t1, txt, col) { if (t < t0 || t > t1) return; const p = popIn(t, t0, t1); g.save(); g.globalAlpha = p.a; g.translate(W / 2, 240); g.scale(p.s, p.s); g.font = `700 34px ${FONT}`; const w = g.measureText(txt).width + 84, h = 60; g.strokeStyle = col; g.lineWidth = 2.5; g.shadowColor = col; g.shadowBlur = 18; rr(g, -w / 2, -h / 2, w, h, 6); g.stroke(); g.shadowBlur = 0; g.fillStyle = 'rgba(8,3,14,0.55)'; g.fill(); g.fillStyle = col; g.fillRect(-w / 2, -h / 2, 8, h); g.fillStyle = WHITE; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '2px'; g.fillText(txt, 6, 2); g.letterSpacing = '0px'; g.restore(); }
function counter(g, t, t0, t1, from, to, fmt, y, size = 112, col = WHITE) { if (t < t0 || t > t1) return; const k = back(clamp((t - t0) / 0.3)) * clamp((t1 - t) / 0.2); const v = lerp(from, to, eOut((t - t0) / 1.0)); g.save(); g.translate(W / 2, y); g.scale(k, k); g.font = `800 ${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = size * 0.16; g.strokeStyle = '#000'; g.shadowColor = col; g.shadowBlur = 30; g.strokeText(fmt(v), 0, 0); g.shadowBlur = 0; g.fillStyle = col; g.fillText(fmt(v), 0, 0); g.restore(); }
// documentary frame: thin neon brackets + tiny caption line
function docFrame(g, x, y, w, h, col, k) { if (k <= 0) return; g.save(); g.globalAlpha = k; g.strokeStyle = col; g.lineWidth = 4; g.shadowColor = col; g.shadowBlur = 14; const L = 40 * k; g.beginPath(); for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const px = x + sx * w, py = y + sy * h, dx = sx ? -1 : 1, dy = sy ? -1 : 1; g.moveTo(px, py + dy * L); g.lineTo(px, py); g.lineTo(px + dx * L, py); } g.stroke(); g.restore(); }
// vertical bar chart (budget estimates)
function barChart(g, t, t0, t1) { if (t < t0 || t > t1) return; const fo = clamp((t1 - t) / 0.25), x0 = 150, base = 1500, bw = 190, gap = 90; docFrame(g, 90, 1060, 900, 560, CYAN, clamp((t - t0) / 0.3) * fo);
  const bars = [[1, 'এক', A.b1, CYAN], [1.5, 'দেড়', A.b2, VIO], [2, 'দুই', A.b3, PINK]];
  g.save(); g.globalAlpha = fo; g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { const y = base - i * 90; g.beginPath(); g.moveTo(x0 - 20, y); g.lineTo(x0 + 3 * (bw + gap), y); g.stroke(); }
  bars.forEach(([v, lb, ts, col], i) => { const k = ease3((t - ts) / 0.7); if (t < ts) return; const h = v * 180 * k, x = x0 + i * (bw + gap); const gr = g.createLinearGradient(0, base - h, 0, base); gr.addColorStop(0, col); gr.addColorStop(1, mix(col, '#1a0030', 0.6)); g.fillStyle = gr; g.shadowColor = col; g.shadowBlur = 24; g.fillRect(x, base - h, bw, h); g.shadowBlur = 0;
    g.font = `800 52px ${FONT}`; g.textAlign = 'center'; g.fillStyle = WHITE; g.fillText('$' + BN(v), x + bw / 2, base - h - 34); g.font = `700 32px ${FONT}`; g.fillStyle = col; g.fillText(lb + ' বিলিয়ন', x + bw / 2, base + 44); });
  g.font = `600 26px ${FONT}`; g.fillStyle = 'rgba(255,255,255,0.6)'; g.textAlign = 'left'; g.fillText('সূত্র: বিভিন্ন রিপোর্ট (আনুমানিক)', 120, 1100); g.restore(); }
// comparison bars GTA 6 vs Burj Khalifa
function compare(g, t, t0, t1) { if (t < t0 || t > t1) return; const fo = clamp((t1 - t) / 0.25); docFrame(g, 90, 1180, 900, 380, PINK, clamp((t - t0) / 0.3) * fo);
  [['বুর্জ খলিফা', 0.75, '$১.৫ বিলিয়ন', CYAN, t0 + 0.2], ['GTA 6', 1.0, '$২ বিলিয়ন', PINK, A.dami - 0.2]].forEach(([lb, v, val, col, ts], i) => { if (t < ts) return; const y = 1290 + i * 150, k = ease3((t - ts) / 0.8); g.save(); g.globalAlpha = fo; g.font = `800 44px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = WHITE; g.fillText(lb, 130, y - 40); g.textAlign = 'right'; g.fillStyle = col; g.fillText(val, 950, y - 40); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(130, y, 820, 26); g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 22; g.fillRect(130, y, 820 * v * k, 26); g.restore(); }); }
// checklist of the 5 reasons
function checklist(g, t) { const items = [['বিশাল ওপেন ওয়ার্ল্ড', A.open], ['বাস্তবসম্মত চরিত্র', A.chars], ['মোশন ক্যাপচার', A.mocap], ['ভয়েস অ্যাক্টিং', A.voice], ['অত্যাধুনিক প্রযুক্তি', A.tech]]; if (t < A.open - 0.1 || t > S.F[1] + 0.2) return; const fo = clamp((S.F[1] + 0.2 - t) / 0.25);
  items.forEach(([s, ts], i) => { if (t < ts) return; const k = ease3((t - ts) / 0.35), y = 1180 + i * 84, cur = i === items.filter(it => t >= it[1]).length - 1; g.save(); g.globalAlpha = fo * (cur ? 1 : 0.6); g.translate(-200 * (1 - k), 0); g.strokeStyle = cur ? PINK : CYAN; g.lineWidth = 4; g.strokeRect(90, y - 24, 48, 48); const ck = ease3((t - ts - 0.15) / 0.25); if (ck > 0) { g.beginPath(); g.moveTo(98, y); g.lineTo(98 + 12 * Math.min(1, ck * 2), y + 12 * Math.min(1, ck * 2)); if (ck > 0.5) g.lineTo(110 + 22 * (ck - 0.5) * 2, y + 12 - 30 * (ck - 0.5) * 2); g.strokeStyle = MINT; g.lineWidth = 7; g.stroke(); } g.font = `800 ${cur ? 50 : 42}px ${FONT}`; g.fillStyle = WHITE; g.textBaseline = 'middle'; g.textAlign = 'left'; g.shadowColor = '#000'; g.shadowBlur = 12; g.fillText(s, 160, y + 2); g.restore(); }); }
// 24h ring gauge
function ring24(g, t, t0, t1) { if (t < t0 || t > t1) return; const fo = clamp((t1 - t) / 0.25), k = ease3((t - t0) / 2.2), cx = W / 2, cy = 1340, r = 170; g.save(); g.globalAlpha = fo; g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = 26; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); g.strokeStyle = HOT; g.shadowColor = HOT; g.shadowBlur = 30; g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); g.stroke(); g.shadowBlur = 0; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2 - Math.PI / 2; g.strokeStyle = i / 24 <= k ? WHITE : 'rgba(255,255,255,0.25)'; g.lineWidth = i % 6 ? 3 : 6; g.beginPath(); g.moveTo(cx + Math.cos(a) * (r - 46), cy + Math.sin(a) * (r - 46)); g.lineTo(cx + Math.cos(a) * (r - 30), cy + Math.sin(a) * (r - 30)); g.stroke(); }
  g.font = `800 92px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = WHITE; g.fillText(BN(Math.round(24 * k)) + 'ঘ', cx, cy + 4); g.restore(); }
// poll card (the ending question)
function poll(g, t, t0, t1) { if (t < t0 || t > t1) return; const fo = clamp((t1 - t) / 0.2); docFrame(g, 110, 1180, 860, 420, MINT, clamp((t - t0) / 0.3) * fo); g.save(); g.globalAlpha = fo; g.font = `700 34px ${FONT}`; g.fillStyle = 'rgba(255,255,255,0.7)'; g.textAlign = 'left'; g.fillText('কমেন্টে জানান', 150, 1240);
  [['🎮  খেলছি', 0.32, MINT, t0 + 0.3], ['📱  শুধু ইউটিউবে দেখি', 0.68, PINK, t0 + 0.7]].forEach(([s, v, col, ts], i) => { if (t < ts) return; const k = ease3((t - ts) / 1.0), y = 1330 + i * 130; g.fillStyle = 'rgba(255,255,255,0.08)'; rr(g, 150, y - 40, 780, 80, 40); g.fill(); g.fillStyle = col; g.globalAlpha = fo * 0.55; rr(g, 150, y - 40, Math.max(80, 780 * v * k), 80, 40); g.fill(); g.globalAlpha = fo; g.font = `800 42px ${FONT}`; g.fillStyle = WHITE; g.textBaseline = 'middle'; g.fillText(s, 180, y + 2); g.textAlign = 'right'; g.fillText(BN(Math.round(v * 100 * k)) + '%', 905, y + 2); g.textAlign = 'left'; }); g.restore(); }
// cut transitions
function whip(g, t, ts, dir) { const d = t - ts; if (d < 0 || d > 0.22) return; const w = 1 - eOut(d / 0.22); const c = g.canvas; g.save(); g.globalAlpha = 0.85 * w; g.filter = `blur(${w * 24}px)`; g.drawImage(c, dir * w * 150, 0); g.restore(); }
function flash(g, t, ts) { const d = t - ts; if (d < 0 || d > 0.12) return; g.save(); g.globalAlpha = 0.45 * (1 - d / 0.12); g.fillStyle = '#ffe6f6'; g.fillRect(0, 0, W, H); g.restore(); }
function glitch(g, t, ts) { const d = t - ts; if (d < 0 || d > 0.2) return; const c = g.canvas; for (let s = 0; s < 12; s++) { const y0 = Math.floor(((Math.sin(s * 91.7 + Math.floor(t * 60)) + 1) / 2) * H), h = 30 + (s * 37) % 140, off = Math.sin(s * 13.1 + Math.floor(t * 60) * 1.7) * 140 * (1 - d / 0.2); g.drawImage(c, 0, y0, W, h, off, y0, W, h); } }
SCENE.ui = (g, t) => {
  if (window.PLATE) return;
  (window.CUTS || []).forEach((c, i) => { const m = i % 4; if (m === 0) whip(g, t, c, 1); else if (m === 1) flash(g, t, c); else if (m === 2) whip(g, t, c, -1); else glitch(g, t, c); });
  // 2.6-4.0 hook continuation
  chipTop(g, t, 2.6, 4.0, 'পর্ব ১ · দাম', PINK); headline(g, t, 2.7, 4.0, 'এত দামি কেন?', PINK);
  // 4.0-10.6 money -> Burj
  chipTop(g, t, 4.0, 10.6, 'খরচের টাকায়…', CYAN); counter(g, t, A.taka - 0.1, A.burj - 0.1, 0, 2000000000, v => '$' + Math.round(v).toLocaleString('en-US'), 1620, 84, MINT); headline(g, t, A.burj, 10.6, 'বুর্জ খলিফা!', CYAN);
  // 12.9-14 after face
  headline(g, t, 12.9, 14.0, 'বুর্জ খলিফা তৈরি করা যেত!', PINK, 1640, 96);
  // 14-23 budget chart
  chipTop(g, t, 14.0, 29.6, 'GTA 6 · বাজেট', MINT); barChart(g, t, A.b1 - 0.6, 23.0);
  // 23-29.6 comparison
  compare(g, t, 23.0, 29.6); headline(g, t, A.dami, 29.6, 'বুর্জ খলিফার চেয়েও দামি!', HOT, 1700, 92);
  // 29.6-33.6 the question
  chipTop(g, t, 29.6, 33.6, 'প্রশ্ন', VIO); headline(g, t, A.etotaka - 0.1, 33.6, 'এত টাকা কেন?', VIO, 1640, 140);
  // 36-41.5 developers
  chipTop(g, t, 36.0, 41.5, 'কারণ ১ · মানুষ', CYAN); counter(g, t, A.devs, A.years - 0.05, 0, 1000, v => 'হাজার হাজার', 1640, 110, CYAN); headline(g, t, A.years, 41.5, 'বছরের পর বছর', CYAN);
  // 41.5-49.8 reasons checklist
  chipTop(g, t, 41.5, 49.8, 'খরচের ৫ কারণ', PINK); checklist(g, t);
  // 49.8-56.6 virtual world
  chipTop(g, t, 49.8, 56.6, 'শুধু গেম না', CYAN); headline(g, t, A.virtual - 0.1, 56.6, 'ভার্চুয়াল দুনিয়া', CYAN, 1640, 130);
  // 56.6-65.6 release day
  chipTop(g, t, 56.6, 65.6, 'রিলিজের ২৪ ঘণ্টা', HOT); ring24(g, t, A.h24 - 1.2, A.inc - 0.05); counter(g, t, A.inc, 65.6, 0, 3, v => '$' + BN(v.toFixed(0)) + ' বিলিয়ন', 1640, 132, MINT);
  // 65.6-66.0, 67.8-72.4 ending (between faces)
  chipTop(g, t, 67.8, 72.4, 'আপনি কোন দলে?', MINT); poll(g, t, 67.85, 72.4);
};
