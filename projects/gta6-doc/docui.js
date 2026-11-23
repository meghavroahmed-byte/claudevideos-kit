// gta6ui.js: v2 "Ice & Ember" type layer on top of the 3D (user's approved short style):
// small section chip at the top, ONE big glowing kinetic keyword headline in the lower third, plain counters,
// whip-blur transitions between sections. Never shown over the face (face pieces replace these frames).
const A = window.TL.ev, S = window.TL.st;
const BN = s => String(s).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const GOLD = '#ffcf5a', ICE = '#8fe3ff', CASH = '#5cff9d', PINK = '#ff3d9a', RED = '#ff4d5a';
drawFinish = function (g, i) { const v = g.createRadialGradient(W / 2, H * 0.48, H * 0.3, W / 2, H * 0.48, H * 0.78); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = v; g.fillRect(0, 0, W, H); g.save(); g.globalAlpha = 0.05; g.globalCompositeOperation = 'overlay'; g.drawImage(GRAIN[i % GRAIN.length], 0, 0, W, H); g.restore(); };
function headline(g, t, t0, t1, txt, col = GOLD, y = 1660, size = 132) {
  if (t < t0 || t > t1) return; const lt = t - t0, u = clamp(lt / 0.24), out = clamp((t1 - t) / 0.2); const sc = lerp(2.2, 1, eOut(u)) * (1 + 0.012 * Math.sin(lt * 5));
  g.save(); g.globalAlpha = clamp(u * 3) * out; g.translate(W / 2, y + Math.sin(lt * 2) * 4); g.scale(sc, sc); if (u < 1) g.filter = `blur(${(1 - u) * 12}px)`;
  g.font = `800 ${size}px ${FONT}`; const w = g.measureText(txt).width; if (w > 980) { const k = 980 / w; g.scale(k, k); }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.shadowColor = col; g.shadowBlur = 55; g.lineWidth = size * 0.15; g.strokeStyle = '#0a0503'; g.strokeText(txt, 0, 0); g.shadowBlur = 0;
  const gr = g.createLinearGradient(0, -size / 2, 0, size / 2); gr.addColorStop(0, '#fff8dc'); gr.addColorStop(0.5, col); gr.addColorStop(1, mix(col, '#5a1a00', 0.45)); g.fillStyle = gr; g.fillText(txt, 0, 0); g.restore();
  if (lt < 0.7) { g.save(); g.globalAlpha = (1 - lt / 0.7) * 0.7 * out; g.strokeStyle = col; g.lineWidth = 6; g.beginPath(); g.ellipse(W / 2, y, 120 + lt * 900, 36 + lt * 300, 0, 0, 7); g.stroke(); g.restore(); }
}
function chipTop(g, t, t0, t1, txt, col) { if (t < t0 || t > t1) return; const p = popIn(t, t0, t1); g.save(); g.globalAlpha = p.a; g.translate(W / 2, 250); g.scale(p.s, p.s); g.font = `700 36px ${FONT}`; const w = g.measureText(txt).width + 80, h = 62; rr(g, -w / 2, -h / 2, w, h, h / 2); g.fillStyle = 'rgba(8,5,3,0.75)'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 16; g.stroke(); g.shadowBlur = 0; g.fillStyle = col; g.beginPath(); g.arc(-w / 2 + 30, 0, 6, 0, 7); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 12, 2); g.restore(); }
function counter(g, t, t0, t1, from, to, fmt, y, size = 112, col = '#ffffff') { if (t < t0 || t > t1) return; const k = back(clamp((t - t0) / 0.3)) * clamp((t1 - t) / 0.2); const v = lerp(from, to, eOut((t - t0) / 1.0)); g.save(); g.translate(W / 2, y); g.scale(k, k); g.font = `800 ${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = size * 0.18; g.strokeStyle = '#000'; g.shadowColor = col; g.shadowBlur = 30; g.strokeText(fmt(v), 0, 0); g.shadowBlur = 0; g.fillStyle = col; g.fillText(fmt(v), 0, 0); g.restore(); }
function whip(g, t, ts, dir) { const d = t - ts; if (d < 0 || d > 0.24) return; const w = 1 - eOut(d / 0.24); const c = g.canvas; g.save(); g.globalAlpha = 0.85 * w; g.filter = `blur(${w * 26}px)`; g.drawImage(c, dir * w * 160, 0); g.restore(); if (d < 0.08) { g.save(); g.globalAlpha = 0.35 * (1 - d / 0.08); g.fillStyle = '#fff3d6'; g.fillRect(0, 0, W, H); g.restore(); } }
function glitch(g, t, ts) { const d = t - ts; if (d < 0 || d > 0.2) return; const c = g.canvas; for (let s = 0; s < 12; s++) { const y0 = Math.floor(((Math.sin(s * 91.7 + Math.floor(t * 60)) + 1) / 2) * H), h = 30 + (s * 37) % 140, off = (Math.sin(s * 13.1 + Math.floor(t * 60) * 1.7)) * 140 * (1 - d / 0.2); g.drawImage(c, 0, y0, W, h, off, y0, W, h); } g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.5 * (1 - d / 0.2); g.fillStyle = '#ff2a6a'; g.fillRect(0, (t * 977 % 1) * H, W, 6); g.restore(); }
SCENE.ui = (g, t) => {
  if (window.PLATE) return;
  (window.CUTS || []).forEach((c, i) => { if (i % 3 === 2) glitch(g, t, c); else whip(g, t, c, i % 2 ? 1 : -1); });
  // A hook (3D part after the face)
  chipTop(g, t, 2.05, S.A[1], 'GTA 6 · খরচ', GOLD); headline(g, t, 2.2, S.A[1], 'এত দামি কেন?', GOLD);
  // B Burj Khalifa
  chipTop(g, t, S.B[0] + 0.1, S.B[1], 'খরচের টাকা দিয়ে…', GOLD);
  counter(g, t, A.taka - 0.1, A.burj - 0.1, 0, 2000000000, v => '$' + Math.round(v).toLocaleString('en-US'), 1660, 84, CASH);
  headline(g, t, A.burj, A.shunchen - 0.05, 'বুর্জ খলিফা!', ICE); headline(g, t, A.shunchen, S.B[1], 'ঠিকই শুনছেন!', GOLD);
  // C budget
  chipTop(g, t, S.C[0] + 0.1, S.C[1], 'GTA 6 · বাজেট', CASH);
  counter(g, t, A.b1, A.b2 - 0.05, 0, 1, v => '$' + BN(v.toFixed(0)) + ' বিলিয়ন', 1660, 120, CASH);
  counter(g, t, A.b2, A.b3 - 0.05, 1, 1.5, v => '$' + BN(v.toFixed(1)) + ' বিলিয়ন', 1660, 120, CASH);
  headline(g, t, A.b3, A.cmp - 0.05, '$২ বিলিয়ন', GOLD, 1660, 150);
  headline(g, t, A.cmp, A.dami - 0.05, 'বুর্জ খলিফা = $১.৫ বিলিয়ন', ICE, 1660, 96);
  headline(g, t, A.dami, S.C[1], 'বুর্জ খলিফার চেয়েও দামি!', RED, 1660, 96);
  // D why so much + developers
  chipTop(g, t, S.D[0] + 0.1, S.D[1], 'কেন এত খরচ?', ICE);
  headline(g, t, A.etotaka - 0.1, A.devs - 0.05, 'এত টাকা কেন?', GOLD);
  headline(g, t, A.devs, A.years - 0.05, 'হাজার হাজার ডেভেলপার', ICE, 1660, 104); headline(g, t, A.years, S.D[1], 'বছরের পর বছর', ICE);
  // E / F features
  chipTop(g, t, S.E[0], S.F[1], 'খরচের ৫ কারণ', PINK);
  headline(g, t, A.open, A.chars - 0.05, 'বিশাল ওপেন ওয়ার্ল্ড', PINK, 1660, 110); headline(g, t, A.chars, A.mocap - 0.05, 'বাস্তবসম্মত চরিত্র', ICE, 1660, 110);
  headline(g, t, A.mocap, A.voice - 0.05, 'মোশন ক্যাপচার', ICE); headline(g, t, A.voice, A.tech - 0.05, 'ভয়েস অ্যাক্টিং', GOLD); headline(g, t, A.tech, S.F[1], 'আধুনিক প্রযুক্তি', ICE, 1660, 120);
  // G virtual world (3D after the middle face)
  chipTop(g, t, 54.3, S.G[1], 'শুধু একটা গেম না', ICE); headline(g, t, A.virtual - 0.1, S.G[1], 'ভার্চুয়াল দুনিয়া', ICE);
  // H release day
  chipTop(g, t, S.H[0] + 0.1, S.H[1], 'রিলিজের ২৪ ঘণ্টায়', GOLD);
  headline(g, t, S.H[0] + 1.5, A.inc - 0.05, '২৪ ঘণ্টা', RED, 1660, 150);
  counter(g, t, A.inc, A.kolpona - 0.05, 0, 3, v => '$' + BN(v.toFixed(0)) + ' বিলিয়ন', 1660, 132, CASH);
  headline(g, t, A.kolpona, A.labh - 0.05, 'কল্পনা করুন…', GOLD); counter(g, t, A.labh, S.H[1], 0, 1, v => 'লাভ $' + BN(v.toFixed(0)) + ' বিলিয়ন+', 1660, 116, GOLD);
  // I ending (3D part before the last face)
  chipTop(g, t, S.I[0] + 0.1, 82.1, 'আপনি কোন দলে?', PINK); headline(g, t, S.I[0] + 0.3, A.phone - 0.05, 'খেলছেন?', CASH, 1660, 150); headline(g, t, A.phone, 82.1, 'নাকি ইউটিউবে দেখছেন?', PINK, 1660, 104);
};
