// PART 2 beats (anchors prefixed with § search the second voiceover)
function pie(g, x, y, r, frac, col, bg, k, label) {
  g.fillStyle = bg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.fillStyle = col; g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac * k); g.closePath(); g.fill();
  g.strokeStyle = '#111'; g.lineWidth = 6; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
  if (label) btext(g, label, x, y, r * 0.42, '#fff', k);
}
function snow(g, t, n = 120) { for (let i = 0; i < n; i++) { const x = (hash(i) * W + Math.sin(t + i) * 30) % W, y = (hash(i + 9) * H + t * (40 + hash(i + 3) * 60)) % H; g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(x, y, 2 + hash(i + 5) * 4, 0, 7); g.fill(); } }
function flute(g, x, y, s, holes, t) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-0.08);
  g.fillStyle = BONE; g.strokeStyle = BONE_L; g.lineWidth = 6; rr(g, -420, -40, 840, 80, 40); g.fill(); g.stroke();
  ink(g, 'rgba(107,90,58,0.4)', 3); for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(-400 + i * 70, -30); g.lineTo(-380 + i * 70, 30); g.stroke(); }
  for (let i = 0; i < 5; i++) { const k = clamp(holes - i); if (k > 0) { g.fillStyle = '#3a2a1a'; g.beginPath(); g.ellipse(-200 + i * 100, 0, 16 * k, 12 * k, 0, 0, 7); g.fill(); } }
  g.restore();
}
function notes(g, x, y, t, n = 5, col = '#ffd23f') { for (let i = 0; i < n; i++) { const life = (t * 0.5 + i / n) % 1; g.save(); g.globalAlpha = 1 - life; g.translate(x + Math.sin(life * 6 + i) * 60 + life * 120, y - life * 300); iconTile(g, 0, 0, 0.001, 0, () => { }); g.fillStyle = col; g.font = 'bold 70px "Segoe UI Symbol", sans-serif'; g.fillText(i % 2 ? '♪' : '♫', 0, 0); g.restore(); } }
function shellBead(g, x, y, s, hole, t) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#efe0c8'; g.strokeStyle = '#7a6040'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, -70); g.bezierCurveTo(70, -60, 80, 40, 0, 70); g.bezierCurveTo(-80, 40, -70, -60, 0, -70); g.fill(); g.stroke();
  ink(g, 'rgba(122,96,64,0.5)', 3); for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(0, 70, 40 + i * 25, -Math.PI * 0.75, -Math.PI * 0.25); g.stroke(); }
  if (hole > 0) { g.fillStyle = '#3a2a1a'; g.beginPath(); g.arc(0, -28, 12 * hole, 0, 7); g.fill(); }
  g.restore();
}
function necklace(g, x, y, r, k, t) {
  const n = 14; ink(g, '#7a5a3a', 4); g.beginPath(); g.arc(x, y - r * 0.4, r, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  for (let i = 0; i < n * k; i++) { const a = 0.15 * Math.PI + i / (n - 1) * 0.7 * Math.PI; shellBead(g, x + Math.cos(a) * r, y - r * 0.4 + Math.sin(a) * r, 0.28, 1, t); }
  if (k >= 1) for (let i = 0; i < 4; i++) sparkleK(g, x - r + hash(i) * 2 * r, y + hash(i + 2) * r * 0.6, 0.8, t + i, 0.5 + 0.5 * Math.sin(t * 4 + i));
}
function personNode(g, x, y, s, col, a = 1) { g.save(); g.globalAlpha = a; g.fillStyle = col; g.strokeStyle = '#111'; g.lineWidth = 4; g.beginPath(); g.arc(x, y - 30 * s, 22 * s, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.arc(x, y + 30 * s, 36 * s, Math.PI, 0); g.fill(); g.stroke(); g.restore(); }
function network(g, cx, cy, R, t, k, mode) {
  // mode: 'love' links + food to centre; 'alone' links cut, centre grey
  const n = 8, pts = Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * 6.283 + 0.3) * R, cy + Math.sin(i / n * 6.283 + 0.3) * R * 0.7]);
  pts.forEach(([x, y], i) => { const kk = clamp(k * n - i); if (kk <= 0) return;
    const cut = mode === 'alone'; ink(g, cut ? 'rgba(200,60,60,0.5)' : 'rgba(255,220,120,0.85)', cut ? 4 : 7); g.setLineDash(cut ? [14, 14] : []);
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(lerp(cx, x, kk), lerp(cy, y, kk)); g.stroke(); g.setLineDash([]);
    for (let j = 0; j < n; j++) if (!cut && (j === (i + 1) % n || j === (i + 3) % n)) { ink(g, 'rgba(255,220,120,0.35)', 3); g.beginPath(); g.moveTo(x, y); g.lineTo(pts[j][0], pts[j][1]); g.stroke(); }
    personNode(g, x, y, 1.1 * kk, ['#e8a04a', '#4aa0e8', '#e8402c', '#2ecc71', '#a04ae8', '#e8d04a', '#4ae8c8', '#e84aa0'][i]);
    if (mode === 'love') { const p = (t * 0.6 + i / n) % 1; g.fillStyle = '#a0402a'; g.beginPath(); g.arc(lerp(x, cx, p), lerp(y, cy, p), 10, 0, 7); g.fill(); }
  });
  personNode(g, cx, cy, 1.6, mode === 'alone' ? '#888' : '#ffd23f', mode === 'alone' ? 0.7 : 1);
}
function balance(g, x, y, tilt, leftFn, rightFn) {
  ink(g, '#ddd', 12); g.beginPath(); g.moveTo(x, y + 300); g.lineTo(x, y); g.stroke(); g.fillStyle = '#ddd'; rr(g, x - 120, y + 290, 240, 30, 10); g.fill();
  g.save(); g.translate(x, y); g.rotate(tilt); ink(g, '#ddd', 10); g.beginPath(); g.moveTo(-380, 0); g.lineTo(380, 0); g.stroke();
  for (const [sx, fn] of [[-380, leftFn], [380, rightFn]]) { g.save(); g.translate(sx, 0); g.rotate(-tilt); ink(g, '#ddd', 4); g.beginPath(); g.moveTo(0, 0); g.lineTo(-90, 160); g.moveTo(0, 0); g.lineTo(90, 160); g.stroke(); g.fillStyle = '#bbb'; g.beginPath(); g.ellipse(0, 165, 120, 24, 0, 0, 7); g.fill(); fn(g, 0, 100); g.restore(); }
  g.restore();
}
function cityGrowth(g, k, t) {
  const base = 900; g.fillStyle = '#9a7a44'; g.fillRect(0, base, W, H - base);
  for (let i = 0; i < 26; i++) { const x = 60 + i * 72, appear = clamp(k * 26 - hash(i) * 20); if (appear <= 0) continue;
    const tall = k > 0.5 ? (60 + hash(i + 3) * 360) * clamp((k - 0.5) * 2) : 0, h = 60 + tall;
    g.fillStyle = tall > 80 ? mixC('#c8a878', '#6a7a8a', clamp((k - 0.5) * 2)) : '#b08a5a'; g.fillRect(x, base - h * appear, 60, h * appear);
    if (tall < 80) { g.fillStyle = '#7a5a3a'; g.beginPath(); g.moveTo(x - 8, base - h * appear); g.lineTo(x + 30, base - h * appear - 40); g.lineTo(x + 68, base - h * appear); g.fill(); }
    else { g.fillStyle = 'rgba(255,220,140,0.7)'; for (let wy = base - h + 16; wy < base - 10; wy += 30) g.fillRect(x + 12, wy, 12, 14); }
  }
}

// ---------------- beats ----------------
beat('§রিচার্ড লি ভেবেছিলেন', (g, t) => {
  desertLand(g, { t, pan: 500, sunY: 200 }); heatHaze(g, t, 0.3);
  researcher(g, 560, 1000, 1.8, t, { notebook: true });
  const k = P(t, '§চরম দুর্দশা'); if (k > 0) { g.save(); g.translate(1250, 380); g.scale(k, k); g.fillStyle = '#fff'; g.strokeStyle = '#111'; g.lineWidth = 6; g.beginPath(); g.ellipse(0, 0, 420, 230, 0, 0, 7); g.fill(); g.stroke(); for (const [x, y, r] of [[-380, 230, 34], [-480, 300, 18]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); }
    g.save(); g.beginPath(); g.ellipse(0, 0, 400, 210, 0, 0, 7); g.clip(); g.fillStyle = '#5a3a2a'; g.fillRect(-420, -230, 840, 460); farmerBend(g, -120, 160, 1.2, 0.5 + 0.5 * Math.sin(t * 4), t); cave(g, 160, 170, 1.0, t, { pose: 'hammer', col: '#2a1a10', cloth: '#2a1a10', skin: '#2a1a10' }); g.restore();
    g.restore(); }
  pill(g, 'হাড়ভাঙা খাটুনি?', 1250, 700, P(t, '§হাড়ভাঙা খাটুনির'), RED, 60, '#fff');
});
beat('§কিন্তু অনুমানের ওপর নির্ভর', (g, t, b) => {
  const lt = t - b.t0;
  desertLand(g, { t, pan: lt * 90, sunY: 220 });
  for (let i = 0; i < 4; i++) cave(g, 900 + i * 170 + lt * 50, 1000, 1.35, t + i, { walk: true, col: '#3a2418', cloth: '#7a5534', skin: '#6a4430' });
  researcher(g, 420 + lt * 50, 1000, 1.4, t, { notebook: true, walk: true });
  iconTile(g, 360, 260, 95, P(t, '§নোটবুক'), ICON.notebook); iconTile(g, 600, 260, 95, P(t, '§স্টপওয়াচ'), (gg, r) => ICON.stopwatch(gg, r, t * 3));
  pill(g, 'সপ্তাহের পর সপ্তাহ', 1300, 220, P(t, '§সপ্তাহের পর সপ্তাহ'), '#ffd23f', 56);
});
beat('§তারা দিনের কোন ঘণ্টাটি', (g, t, b) => {
  studio(g, '#4a3a2a', '#140e08', t, 45);
  g.save(); g.translate(W / 2 - 120, 540); g.rotate(-0.04); g.fillStyle = '#fff8e0'; rr(g, -560, -420, 1120, 840, 14); g.fill(); ink(g, '#c8d8f0', 3); for (let i = 0; i < 13; i++) { g.beginPath(); g.moveTo(-520, -340 + i * 60); g.lineTo(520, -340 + i * 60); g.stroke(); }
  ink(g, '#e8a0a0', 3); g.beginPath(); g.moveTo(-380, -400); g.lineTo(-380, 400); g.stroke();
  const rows = ['০৭:১০ — ঘুম থেকে ওঠা', '০৮:০০ — খাবার সংগ্রহ', '১১:৪০ — ফিরে আসা', '১২:৩০ — আড্ডা', '১৫:০০ — হাতিয়ার', '১৮:৩০ — গল্প'];
  const k = seg(t, b.t0 + 0.3, b.t1 - 0.3);
  rows.forEach((r, i) => { const kk = clamp(k * rows.length - i); if (kk > 0) { g.save(); g.beginPath(); g.rect(-360, -360 + i * 120, 860 * kk, 110); g.clip(); btext(g, r, -360 + 420, -310 + i * 120, 50, '#2a3a6a', 1, { stroke: '#fff8e0' }); g.restore(); } });
  g.restore();
  iconTile(g, 1650, 300, 120, 1, (gg, r) => ICON.stopwatch(gg, r, t * 3));
  pill(g, 'প্রতিটি মিনিটের হিসাব', 1600, 900, P(t, '§প্রতিটি মিনিটের'), '#ffd23f', 52);
});
beat('§গবেষণা শেষে রিচার্ড লি', (g, t) => {
  studio(g, '#1a2a4a', '#050a18', t, 46);
  for (let i = 0; i < 5; i++) { const k = P(t, '§হতবাক', 0.3 + i * 0.07); researcher(g, 360 + i * 300, 1000, 1.3, t + i, { pose: k > 0.5 ? 'throw' : 'stand', k: 0 }); if (k > 0) symbolText(g, '!', 360 + i * 300, 560 - k * 40, 120, '#ffd23f', k); }
  pill(g, 'একটি সংখ্যা...', W / 2, 200, P(t, '§এমন একটি সংখ্যা'), '#ffd23f', 70);
});
beat('§তিনি দেখলেন, কালাহারির মতো', (g, t, b) => {
  studio(g, '#2a1a3a', '#08040e', t, 47); dust(g, t, 60, '255,220,150', 0.5);
  const k = S(t, '§মাত্র ১৭ ঘণ্টা', 1.2);
  if (k <= 0) { bigNumber(g, '? ঘণ্টা', W / 2, 470, 220, '#ffd23f', P(t, '§তিনি দেখলেন'), 'কালাহারির হিসাব'); } else bigNumber(g, BN(Math.round(k * 17)) + ' ঘণ্টা', W / 2, 470, 220, '#ffd23f', 1, 'প্রতি সপ্তাহে খাবার সংগ্রহ');
  iconTile(g, 300, 300, 90, P(t, '§চরম প্রতিকূল'), ICON.hourglass);
});
beat('§একটু খেয়াল করুন, দিনে ১৭ ঘণ্টা নয়', (g, t) => {
  studio(g, '#2a1a3a', '#08040e', t, 48);
  pill(g, 'দিনে ১৭ ঘণ্টা', 560, 420, P(t, '§দিনে ১৭ ঘণ্টা'), '#888', 80, '#fff'); xMark(g, 560, 420, 200, S(t, '§নয়', 0.4));
  pill(g, 'সপ্তাহে ১৭ ঘণ্টা', 1360, 420, P(t, '§পুরো এক সপ্তাহে'), '#2ecc71', 80); check(g, 1360, 640, 90, S(t, '§পুরো এক সপ্তাহে'));
});
beat('§অর্থাৎ সপ্তাহে আড়াই দিনের মতো', (g, t, b) => {
  studio(g, '#1f3a2a', '#06120a', t, 49);
  weekCalendar(g, 300, 330, 160, 420, S(t, '§আড়াই দিনের', 1.4) * 2.5, '#e0862a', t);
  if (t > T('§বাকি প্রতিটি ঘণ্টা')) for (let i = 2; i < 7; i++) { const x = 300 + i * 174; glow(g, x + 80, 540, 120, 'rgba(46,204,113,A)', 0.4 * S(t, '§বাকি প্রতিটি ঘণ্টা')); }
  pill(g, 'কাজ: ২.৫ দিন', 560, 880, P(t, '§আড়াই দিনের'), '#e0862a', 56, '#fff'); pill(g, 'বাকি সব নিজের', 1300, 880, P(t, '§বাকি প্রতিটি ঘণ্টা'), '#2ecc71', 56);
});
beat('§আজকের জীবনের সাথে যদি তুলনা', (g, t, b) => {
  g.drawImage(CITY16, 0, 0); g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 0, W, H);
  const k = S(t, '§বুধবার দুপুরের', 1.6) * 4.5;
  weekCalendar(g, 300, 330, 160, 420, k, RED, t);
  const wx = 300 + 4 * 174 + 80; if (k > 4.4) { ink(g, '#ffd23f', 8); g.beginPath(); g.moveTo(wx, 280); g.lineTo(wx, 780); g.stroke(); }
  pill(g, 'বুধবার দুপুর = ১৭ ঘণ্টা পার', W / 2, 900, P(t, '§১৭ ঘণ্টার বেশি'), RED, 56, '#fff');
  phoneP(g, t, 1700, {});
});
beat('§তখন অনেক বিজ্ঞানীই প্রশ্ন তুললেন', (g, t) => { studio(g, '#2a2a4a', '#0a0a18', t, 50); for (let i = 0; i < 3; i++) researcher(g, 560 + i * 400, 1000, 1.5, t + i, { flip: i === 2 }); stamp(g, 'ব্যতিক্রম?', W / 2, 330, S(t, '§ব্যতিক্রম', 0.4), '#ffd23f'); });
beat('§এই সন্দেহ দূর করার জন্য', (g, t, b) => {
  const Sm = drawMap(g, { lon: 30, lat: -5, zoom: 0.5 }, t);
  const [kx, ky] = Sm([22, -22]); pinDot(g, kx, ky, 14, t); btext(g, 'জু-হোয়ানসি', kx, ky + 50, 40, '#5a3a1a', 1, { stroke: '#f3e2bd' });
  [['হাদজা (তানজানিয়া)', '§তানজানিয়ার', [35, -4]], ['আচে (প্যারাগুয়ে)', '§প্যারাগুয়ের', [-57, -24]], ['মার্তু (অস্ট্রেলিয়া)', '§মার্তু', [125, -23]]].forEach(([lb, a, p]) => { const [x, y] = Sm(p), k = P(t, a); if (k > 0) { pinDot(g, x, y, 16 * k, t); btext(g, lb, x, y - 60, 46, '#7a2a14', k, { stroke: '#f3e2bd' }); } });
  pill(g, 'একই পরীক্ষা', W / 2, 100, P(t, '§একই পরীক্ষা'), '#7a2a14', 56, '#fff8ea');
});
beat('§তিনটি ভিন্ন মহাদেশের', (g, t) => {
  studio(g, '#3a2a1a', '#100a04', t, 51);
  ['আফ্রিকা', 'দক্ষিণ আমেরিকা', 'অস্ট্রেলিয়া'].forEach((lb, i) => card(g, 380 + i * 580, 520, 500, 600, P(t, '§তিনটি ভিন্ন', 0.35 + i * 0.12), lb, (c, w, h) => { const sk = c.createLinearGradient(0, 0, 0, h); sk.addColorStop(0, ['#f2b066', '#7fc06a', '#e8905a'][i]); sk.addColorStop(1, '#2a1a0a'); c.fillStyle = sk; c.fillRect(0, 0, w, h); cave(c, w * 0.35, h - 90, 1.0, t + i, { pose: 'spear' }); iconTile(c, w * 0.72, h * 0.32, 70, 1, (gg, r) => ICON.stopwatch(gg, r, t * 3 + i)); }, (i - 1) * 0.2));
});
beat('§আর প্রতিবারই ফলাফল এলো', (g, t) => {
  studio(g, '#1f3a2a', '#06120a', t, 52);
  barChart(g, 280, 900, 1360, 520, [{ v: 17, label: 'জু-হোয়ানসি', col: '#2ecc71', val: '১৭' }, { v: 15, label: 'হাদজা', col: '#2ecc71', val: '১৫' }, { v: 20, label: 'আচে', col: '#2ecc71', val: '২০' }, { v: 18, label: 'মার্তু', col: '#2ecc71', val: '১৫–২০' }], ease(seg(t, T('§আর প্রতিবারই'), T('§আর প্রতিবারই') + 2)), { max: 45, ls: 38 });
  pill(g, 'সপ্তাহে মাত্র ১৫–২০ ঘণ্টা', W / 2, 150, P(t, '§১৫ থেকে ২০ ঘণ্টা'), '#ffd23f', 64);
});
beat('§অর্থাৎ পৃথিবীতে বেঁচে থাকার', (g, t) => { camp(g, t, {}); meatRack(g, 700, 960, 1.5, 5); iconTile(g, 1350, 400, 130, P(t, '§পেট ভরে'), ICON.food); pill(g, 'পেট ভরা ✓', 1350, 620, P(t, '§পেট ভরে'), '#2ecc71', 64); });
// ---- chapter 4 ----
beat('§তাহলে এবার সেই বড় প্রশ্নটির', (g, t, b) => {
  const lt = t - b.t0;
  dayLand(g, t, { pan: 2000 + lt * 20, dawn: 0.3 });
  for (let i = 0; i < 4; i++) cave(g, 500 + i * 260, 1000, 1.4, t + i, { pose: 'sit' });
  questionMark(g, 1400, 300, P(t, '§কী করতো'), t, 260);
  chapterCard(g, 'পর্ব ৪', 'অবসরের রহস্য', seg(lt, 0, 0.4) * (1 - seg(lt, 2.2, 2.8)), t);
});
beat('§আসল রহস্যটা লুকিয়ে আছে', (g, t) => { studio(g, '#3a2a4a', '#0c0814', t, 53); const k = S(t, '§আসল রহস্যটা', 1); glow(g, W / 2, 520, 420, 'rgba(255,220,80,A)', 0.5 * k); iconTile(g, W / 2, 520, 180 * (0.6 + 0.4 * k), 1, (gg, r) => { gg.fillStyle = '#ffd23f'; gg.strokeStyle = '#111'; gg.lineWidth = 6; gg.beginPath(); gg.arc(-r * 0.2, 0, r * 0.25, 0, 7); gg.fill(); gg.stroke(); gg.fillRect(-r * 0.0, -r * 0.06, r * 0.55, r * 0.12); gg.strokeRect(0, -r * 0.06, r * 0.55, r * 0.12); gg.fillRect(r * 0.4, 0, r * 0.08, r * 0.18); }); });
beat('§তাদের পুরো সপ্তাহের সবচেয়ে গুরুত্বপূর্ণ', (g, t) => { studio(g, '#3a2a1a', '#100a04', t, 54); pill(g, '১৭ ঘণ্টা শিকার', W / 2, 460, P(t, '§১৭ ঘণ্টা'), '#e0862a', 90, '#fff'); xMark(g, W / 2, 460, 220, S(t, '§ছিলো না', 0.5)); });
beat('§সবচেয়ে গুরুত্বপূর্ণ ছিলো কাজের পরের', (g, t) => {
  dayLand(g, t, { pan: 2300, dawn: 0.45, sunY: 380, sunX: 1400 });
  palm(g, 700, 960, 520, '#2f6b3a', t, 3); g.save(); g.translate(780, 990); g.rotate(-1.2); cave(g, 0, 0, 1.6, t, {}); g.restore();
  pill(g, 'অলস দুপুর', 1350, 240, P(t, '§অলস দুপুরগুলো'), '#ffd23f', 90); foregroundGrass(g, t, {});
});
beat('§কারণ ওই অবসর সময়টা তাদের', (g, t) => { studio(g, '#2a2a4a', '#0a0a18', t, 55); iconTile(g, 620, 520, 150, P(t, '§খাবারের চেয়েও'), ICON.food); big(g, '<', W / 2, 520, P(t, '§খাবারের চেয়েও'), 200, '#fff'); questionMark(g, 1300, 520, P(t, '§বড় একটি কাজ'), t, 300); });
beat('§দুপুর গড়িয়ে বিকেল নামলে', (g, t) => {
  camp(g, t, { dawn: 0.55, sunY: 520, sunX: 1500 }); palm(g, 960, 960, 560, '#2f6b3a', t, 7);
  for (const [x, f, p] of [[640, false, 'sit'], [880, false, 'sit'], [1100, true, 'sit'], [1320, true, 'sit']]) cave(g, x, 990, 1.35, t + x, { pose: p, flip: f });
  for (let i = 0; i < 2; i++) { const x = 300 + ((t * 120 + i * 300) % 600); cave(g, x, 1010, 0.8, t * 1.5 + i, { walk: true }); }
  pill(g, 'আড্ডা', 640, 300, P(t, '§আড্ডা দিতো'), '#ffd23f', 60); pill(g, 'বাচ্চাদের সাথে খেলা', 960, 220, P(t, '§বাচ্চাদের'), '#2ecc71', 56); pill(g, 'চুল বেছে দেওয়া', 1320, 300, P(t, '§চুল বেছে'), '#5ab8ff', 56);
});
beat('§আপনার পাশেই হয়তো কেউ', (g, t, b) => {
  studio(g, '#4a3a2a', '#140e08', t, 56);
  const hole = S(t, '§ছোট ছোট ছিদ্র', 1.5); shellBead(g, 760, 520, 3.2, hole, t);
  g.save(); g.translate(760 + Math.sin(t * 20) * 6, 330); g.rotate(0.5); g.fillStyle = '#7d7a72'; g.beginPath(); g.moveTo(0, 0); g.lineTo(30, -160); g.lineTo(-30, -160); g.closePath(); g.fill(); g.restore();
  necklace(g, 1450, 460, 260, S(t, '§মালা গাঁথার', 1.5), t);
  pill(g, 'ঝিনুকের মালা', 1450, 900, P(t, '§মালা গাঁথার'), '#ffd23f', 60);
});
beat('§আরেকজন হয়তো এক টুকরো হাড়ের', (g, t, b) => {
  studio(g, '#4a3a2a', '#140e08', t, 57);
  g.save(); g.translate(W / 2, 520); g.rotate(-0.15); g.fillStyle = BONE; g.strokeStyle = BONE_L; g.lineWidth = 7; rr(g, -600, -90, 1200, 180, 90); g.fill(); g.stroke();
  const k = S(t, '§খোদাই করে', 2.2); ink(g, '#6b4a2a', 7); g.beginPath(); for (let i = 0; i <= 120 * k; i++) { const x = -540 + i * 9, y = Math.sin(i * 0.5) * 40 * (i % 12 < 6 ? 1 : -1); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.restore();
  pill(g, 'হাড়ে নকশা', W / 2, 860, P(t, '§সুন্দর নকশা'), '#ffd23f', 64);
});
beat('§দক্ষিণ আফ্রিকার ব্লম্বোস গুহায়', (g, t, b) => {
  const k = ease(seg(t, b.t0, b.t0 + 1.5));
  const Sm = drawMap(g, { lon: lerp(20, 21, k), lat: lerp(-5, -31, k), zoom: lerp(0.9, 2.4, k) }, t);
  const [cx, cy] = Sm([21.2, -34.4]); pinDot(g, cx, cy, 18, t); btext(g, 'ব্লম্বোস গুহা', cx, cy - 70, 56, '#5a3a1a', P(t, '§ব্লম্বোস'), { stroke: '#f3e2bd' });
  bigNumber(g, '৭০,০০০ বছর', W / 2, 160, 90, '#7a2a14', P(t, '§৭০ হাজার বছরের'));
  necklace(g, 1550, 820, 160, S(t, '§পুঁতি', 1), t);
});
beat('§সমুদ্রের তীর থেকে ওই গুহাটির', (g, t, b) => {
  const Sm = drawMap(g, { lon: 21.5, lat: -33.5, zoom: 2.8 }, t);
  const sea = Sm([22.5, -34.3]), cave_ = Sm([21.0, -33.6]);
  route(g, p => p, [sea, [lerp(sea[0], cave_[0], 0.5), sea[1] - 120], cave_], S(t, '§দূরত্ব', 1.5), '#a3201a', 8);
  pinDot(g, cave_[0], cave_[1], 16, t); btext(g, 'গুহা', cave_[0], cave_[1] - 60, 50, '#5a3a1a', 1, { stroke: '#f3e2bd' }); btext(g, 'সমুদ্রতীর', sea[0], sea[1] + 60, 50, '#1a4a7a', 1, { stroke: '#f3e2bd' });
  pill(g, 'অনেক দূরে', W / 2, 100, P(t, '§অনেক বেশি'), '#7a2a14', 60, '#fff8ea');
});
beat('§অর্থাৎ আজ থেকে ৭০ হাজার বছর আগে', (g, t, b) => {
  const lt = t - b.t0;
  if (t < T('§খোসা কুড়িয়ে')) { dayLand(g, t, { pan: lt * 260, c3: '#d8c890', g1: '#e8d8a0', g2: '#c8b070', noVolcano: true }); g.fillStyle = '#3a8ad0'; g.fillRect(0, 870, W, 210); caveman(g, 900, 980, 1.8, { t: t * 1.2, walk: true, col: '#2e211a', cloth: '#7a5534', skin: '#8a5a3a' }); pill(g, 'দীর্ঘ পথ হেঁটে', W / 2, 220, P(t, '§দীর্ঘ পথ'), '#ffd23f', 64); }
  else if (t < T('§ঘণ্টার পর ঘণ্টা বসে')) { studio(g, '#2a4a6a', '#0a1a2a', t, 58); for (let i = 0; i < 6; i++) shellBead(g, 300 + i * 260, 600 + Math.sin(i) * 60, 1.2, 0, t); pill(g, 'খোসা কুড়ানো', W / 2, 220, P(t, '§খোসা কুড়িয়ে'), '#5ab8ff', 64); }
  else { studio(g, '#4a3a2a', '#140e08', t, 59); necklace(g, W / 2, 520, 300, S(t, '§ঘণ্টার পর ঘণ্টা বসে', 2), t); pill(g, 'শুধুমাত্র সৌন্দর্যের টানে', W / 2, 920, P(t, '§সৌন্দর্যের টানে'), '#ffd23f', 64); }
});
beat('§শুধু তা-ই নয়, ২০০৮ সালে', (g, t, b) => {
  const k = ease(seg(t, b.t0, b.t0 + 1.5));
  const Sm = drawMap(g, { lon: lerp(30, 10, k), lat: lerp(20, 46, k), zoom: lerp(0.8, 2.4, k) }, t);
  const [x, y] = Sm([9.75, 48.38]); pinDot(g, x, y, 18, t); btext(g, 'জার্মানি', x, y - 70, 56, '#5a3a1a', P(t, '§জার্মানির'), { stroke: '#f3e2bd' });
  bigNumber(g, '৪০,০০০ বছর আগের বাঁশি', W / 2, 160, 70, '#7a2a14', P(t, '§৪০ হাজার বছর'));
  if (P(t, '§বাঁশি') > 0) { g.fillStyle = 'rgba(0,0,0,0.35)'; rr(g, 260, 760, 1400, 240, 30); g.fill(); flute(g, W / 2, 880, 1.4 * P(t, '§বাঁশি'), 5, t); pill(g, 'শকুনের ডানার হাড়', W / 2, 760, P(t, '§শকুনের ডানার'), '#fff', 44); }
});
beat('§তাতে খুব নিখুঁতভাবে পাঁচটি ছিদ্র', (g, t, b) => {
  studio(g, '#2a3a5a', '#08101a', t, 60);
  const k = S(t, '§পাঁচটি ছিদ্র', 1.5) * 5; flute(g, W / 2, 500, 1.9, k, t);
  big(g, BN(Math.min(5, Math.floor(k + 0.001))) + ' টি ছিদ্র', W / 2, 220, P(t, '§পাঁচটি ছিদ্র'), 80, '#ffd23f');
  if (t > T('§সুর তোলা')) notes(g, W / 2 + 300, 450, t, 6);
  pill(g, 'সুর তোলা সম্ভব', W / 2, 860, P(t, '§সুর তোলা'), '#2ecc71', 60);
});
beat('§এর মানে হলো, বরফ যুগের', (g, t) => {
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#6a8ab0'); sky.addColorStop(1, '#dfe8f2'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  ridge(g, 700, 260, 0.004, 3, 0, '#c8d8e8'); ridge(g, 820, 140, 0.006, 9, 0, '#e8f0f8'); g.fillStyle = '#f4f8fc'; g.fillRect(0, 880, W, 200);
  fire(g, 760, 960, 0.7, t);
  cave(g, 1080, 990, 1.6, t, { pose: 'sit', col: '#3a2a1a', cloth: '#8a6a4a', skin: '#8a5a3a' }); notes(g, 1150, 700, t, 5, '#fff');
  snow(g, t, 140);
  pill(g, 'বরফ যুগেও সংগীত', W / 2, 180, P(t, '§বরফ যুগের'), '#5ab8ff', 64); pill(g, 'প্রচুর অবসর', W / 2, 320, P(t, '§প্রচুর অবসর সময়ও'), '#2ecc71', 56);
});
beat('§কিন্তু এই শিল্পচর্চা ও আড্ডার পেছনে', (g, t) => { studio(g, '#2a2a4a', '#0a0a18', t, 61); chinta(g, t, 960); pill(g, 'গভীর উদ্দেশ্য', 1460, 320, P(t, '§গভীর একটি উদ্দেশ্য'), '#ffd23f', 64); });
beat('§একটু ভাবুন তো, সেই প্রাচীন পৃথিবীতে', (g, t) => {
  dayLand(g, t, { pan: 2600 });
  [['money', '§টাকা-পয়সা'], ['bank', '§কোনো ব্যাংক'], ['police', '§পুলিশ'], ['hospital', '§হাসপাতাল']].forEach(([ic, a], i) => { iconTile(g, 330 + i * 420, 400, 120, P(t, a), ICON[ic], S(t, a, 0.5)); });
});
beat('§তাহলে কোনো দিন যদি আপনি শিকারে', (g, t) => {
  studio(g, '#3a1a1a', '#100404', t, 62);
  card(g, 380, 520, 520, 640, P(t, '§খালি হাতে'), 'খালি হাতে', (c, w, h) => { c.fillStyle = '#c8a070'; c.fillRect(0, 0, w, h); cave(c, w / 2, h - 80, 1.3, t, { pose: 'stand' }); });
  card(g, 960, 520, 520, 640, P(t, '§মারাত্মক অসুস্থ'), 'অসুস্থ', (c, w, h) => { c.fillStyle = '#5a4a6a'; c.fillRect(0, 0, w, h); c.save(); c.translate(w / 2 - 80, h - 120); c.rotate(-Math.PI / 2); cave(c, 0, 0, 1.2, t, {}); c.restore(); iconTile(c, w / 2, 160, 60, 1, ICON.hospital); });
  card(g, 1540, 520, 520, 640, P(t, '§পা ভেঙে'), 'পা ভাঙা', (c, w, h) => { c.fillStyle = '#4a5a4a'; c.fillRect(0, 0, w, h); iconTile(c, w / 2, h / 2 - 20, 110, 1, ICON.bone, 0.75); });
  questionMark(g, W / 2, 110, P(t, '§কে বাঁচিয়ে'), t, 160);
});
beat('§উত্তরটা হলো—আপনার চারপাশের মানুষ', (g, t, b) => { studio(g, '#1f3a2a', '#06120a', t, 63); network(g, W / 2, 540, 420, t, S(t, '§চারপাশের মানুষ', 1.2), 'links'); pill(g, 'চারপাশের মানুষ', W / 2, 980, P(t, '§চারপাশের মানুষ'), '#2ecc71', 60); });
beat('§দলের মানুষেরা যদি আপনাকে ভালোবাসে', (g, t) => { studio(g, '#1f3a2a', '#06120a', t, 63); network(g, W / 2, 540, 420, t, 1, t > T('§খাবার ভাগ করে') ? 'love' : 'links'); pill(g, 'খাবার ভাগ করে খাওয়াবে', W / 2, 980, P(t, '§খাবার ভাগ করে'), '#2ecc71', 56); iconTile(g, 260, 200, 80, P(t, '§ভালোবাসে'), ICON.heart); });
beat('§আর তারা যদি আপনাকে পছন্দ না করে', (g, t) => { studio(g, '#3a1a1a', '#100404', t, 64); network(g, W / 2, 540, 420, t, 1, 'alone'); pill(g, 'কেউ বাঁচাবে না', W / 2, 980, P(t, '§না খেয়েই'), RED, 60, '#fff'); vg(g, 0.6, '40,0,0'); });
beat('§তাই দুপুরের ওই যে ঘণ্টার পর ঘণ্টা', (g, t) => {
  camp(g, t, { dawn: 0.5, sunY: 500, sunX: 1500 });
  [['গল্প', '§বসে গল্প করা', 'people'], ['হাসি-ঠাট্টা', '§হাসি-ঠাট্টা', 'heart'], ['যত্ন', '§যত্ন নেওয়া', 'hospital'], ['উপহার', '§উপহার বানিয়ে', 'art']].forEach(([lb, a, ic], i) => { iconTile(g, 300 + i * 440, 330, 100, P(t, a), ICON[ic]); btext(g, lb, 300 + i * 440, 490, 50, '#fff', P(t, a)); });
  stamp(g, 'সময় নষ্ট নয়!', W / 2, 760, S(t, '§সময় নষ্ট করা', 0.4), GOOD);
});
beat('§এটি ছিলো সেই পৃথিবীর একমাত্র জীবনবীমা', (g, t) => {
  studio(g, '#1f3a2a', '#06120a', t, 65);
  const k = S(t, '§জীবনবীমা', 1.2); for (let i = 0; i < 10; i++) { const a = -Math.PI * 0.95 + i / 9 * Math.PI * 0.9; personNode(g, W / 2 + Math.cos(a) * 340 * k, 600 + Math.sin(a) * 340 * k, 1.0, '#2ecc71'); }
  iconTile(g, W / 2, 560, 170, P(t, '§জীবনবীমা'), ICON.shield);
  pill(g, 'জীবনবীমা', W / 2, 920, P(t, '§ইন্স্যুরেন্স'), '#2ecc71', 70);
});
beat('§নৃবিজ্ঞানী জেমস সুজম্যান', (g, t) => {
  studio(g, '#2a3a4a', '#081018', t, 66);
  researcher(g, 380, 1000, 1.7, t, { notebook: true }); pill(g, 'জেমস সুজম্যান', 380, 340, P(t, '§জেমস সুজম্যান'), '#fff', 50);
  pie(g, 1200, 540, 300, 6 / 24, '#2ecc71', '#33404a', S(t, '§৬ ঘণ্টা', 1.2), '৬ ঘণ্টা');
  pill(g, 'প্রতিদিন: সামাজিক সম্পর্ক', 1200, 950, P(t, '§সামাজিক সম্পর্ক'), '#2ecc71', 52);
});
beat('§কারণ সেই পৃথিবীতে মানুষের সাথে সম্পর্কই', (g, t) => {
  studio(g, '#1f3a2a', '#06120a', t, 67);
  [['bank', '§ব্যাংক অ্যাকাউন্ট'], ['hospital', '§আপনার হাসপাতাল'], ['pension', '§পেনশন']].forEach(([ic, a], i) => { const x = 420 + i * 540, k = P(t, a); iconTile(g, x, 360, 110, k, ICON[ic]); big(g, '=', x, 560, k, 90); iconTile(g, x, 760, 110, P(t, a, 0.6), ICON.people); });
});
beat('§এরপর সূর্য ডুবে গেলে', (g, t, b) => {
  const n = ease(seg(t, b.t0, b.t0 + 2));
  camp(g, t, { dawn: 1 - n, night: n, sunY: lerp(560, 330, n), sunX: lerp(1500, 1500, n) });
  fire(g, 960, 960, 1.0 * n + 0.01, t); for (let i = 0; i < 20; i++) sparkleK(g, 600 + hash(i) * 720, 300 + hash(i + 3) * 400, 0.5, t + i, n * (0.5 + 0.5 * Math.sin(t * 3 + i)));
  pill(g, 'রাতের জাদু', W / 2, 160, P(t, '§রাতের জাদু'), '#8a3fd0', 70, '#fff');
});
beat('§২০১৪ সালে নৃবিজ্ঞানী পলি উইজনার', (g, t) => {
  studio(g, '#2a1a3a', '#08040e', t, 68);
  researcher(g, 300, 1000, 1.5, t, { notebook: true }); pill(g, 'পলি উইজনার (২০১৪)', 300, 360, P(t, '§পলি উইজনার'), '#fff', 46);
  pie(g, 900, 540, 230, 0.06, '#8a3fd0', '#e0862a', P(t, '§দিনের বেলায়'), 'দিন'); btext(g, 'খাবার • শিকার', 900, 830, 44, '#fff', P(t, '§দিনের বেলায়'));
  pie(g, 1500, 540, 230, 0.81, '#8a3fd0', '#33404a', S(t, '§৮১ শতাংশ', 1.2), '৮১%'); btext(g, 'রাত: গল্প', 1500, 830, 50, '#fff', P(t, '§রাতের বেলা'));
});
beat('§তারা আগুনের দিকে তাকিয়ে গল্প বলতো', (g, t) => {
  camp(g, t, { night: 1 }); fire(g, 960, 960, 1.1, t);
  for (const [x, f] of [[620, false], [1300, true]]) cave(g, x, 990, 1.4, t + x, { pose: 'sit', flip: f, col: '#1a0f0a', cloth: '#4a2a18', skin: '#4a2e20' });
  [['§পৃথিবী কীভাবে', (gg, x, y, a) => { gg.globalAlpha = a; gg.fillStyle = '#5ab0e0'; gg.beginPath(); gg.arc(x, y, 70, 0, 7); gg.fill(); gg.fillStyle = '#3a8a4a'; gg.beginPath(); gg.ellipse(x - 20, y - 10, 30, 22, 0, 0, 7); gg.fill(); }],
  ['§বীরত্বের কাহিনী', (gg, x, y, a) => { gg.globalAlpha = a; cave(gg, x, y + 90, 0.8, t, { pose: 'spear', col: '#ffd8a0', cloth: '#ffd8a0', skin: '#ffd8a0' }); }],
  ['§আত্মাদের', (gg, x, y, a) => { gg.globalAlpha = a * 0.7; gg.fillStyle = '#d8e8ff'; gg.beginPath(); gg.arc(x, y - 30, 50, Math.PI, 0); gg.lineTo(x + 50, y + 60); for (let i = 0; i < 4; i++) gg.lineTo(x + 50 - (i + 0.5) * 25, y + 40 + (i % 2) * 20); gg.closePath(); gg.fill(); gg.fillStyle = '#111'; gg.beginPath(); gg.arc(x - 18, y - 30, 8, 0, 7); gg.arc(x + 18, y - 30, 8, 0, 7); gg.fill(); }]].forEach(([a, fn], i) => { const k = S(t, a, 1); if (k > 0) { g.save(); fn(g, 600 + i * 360, 520 - k * 80 + Math.sin(t * 2 + i) * 10, k); g.restore(); } });
});
beat('§একটু লক্ষ্য করলেই বুঝবেন', (g, t) => { studio(g, '#3a1a1a', '#100404', t, 69); brain(g, W / 2, 520, 1.2 * P(t, '§একটু লক্ষ্য'), 1, t); pill(g, 'ক্ষুধার্ত ও ভীতু মস্তিষ্ক', W / 2, 960, P(t, '§ক্ষুধার্ত ও ভীতু'), RED, 60, '#fff'); xMark(g, 1550, 260, 90, S(t, '§আসতে পারে না', 0.5)); });
beat('§মানুষের মাথায় এমন দারুণ সব গল্প', (g, t, b) => {
  studio(g, '#2a2a1a', '#0c0a04', t, 70); const m = 1 - S(t, '§পেট ভরা থাকে', 1.5);
  brain(g, W / 2, 520, 1.2, m, t);
  iconTile(g, 300, 300, 90, P(t, '§পেট ভরা'), ICON.food); iconTile(g, 1620, 300, 90, P(t, '§নিরাপদ মনে করে'), ICON.shield);
  pill(g, 'পেট ভরা + নিরাপদ = সৃজনশীল', W / 2, 960, P(t, '§নিরাপদ মনে করে'), '#ffd23f', 56);
});
beat('§অর্থাৎ রাতের আগুনের পাশের', (g, t) => {
  camp(g, t, { night: 1 }); fire(g, 960, 960, 1.1, t);
  [['art', '§মানব সংস্কৃতি'], ['music', '§শিল্প ও'], ['book', '§সাহিত্যের']].forEach(([ic, a], i) => { const k = P(t, a, 0.6); iconTile(g, 560 + i * 400, lerp(900, 360, ease(k)), 100, k, ICON[ic]); });
  pill(g, 'সংস্কৃতির জন্ম', W / 2, 140, P(t, '§জন্ম হয়েছিলো'), '#ffd23f', 64);
});
beat('§এমনকি তাদের ঘুমের ধরনটাও', (g, t) => { camp(g, t, { night: 1 }); embers(g, 960, 940, 1, t); for (const x of [560, 760, 1200]) { g.save(); g.translate(x, 1000); g.rotate(-Math.PI / 2); cave(g, 0, 0, 1.2, t, { col: '#1a0f0a', cloth: '#3a2418', skin: '#3a2418' }); g.restore(); } pill(g, 'ঘুমও আলাদা', W / 2, 160, P(t, '§ঘুমের ধরনটাও'), '#5ab8ff', 64); });
beat('§বৈদ্যুতিক বাতি আবিষ্কারের আগে', (g, t, b) => {
  studio(g, '#0e1430', '#03050c', t, 71);
  btext(g, 'আজকের ঘুম', 300, 330, 46, '#fff'); timelineBar(g, 480, 290, 1100, [{ len: 8, col: '#5ab8ff', label: '৮ ঘণ্টা একটানা' }], ease(seg(t, T('§বৈদ্যুতিক বাতি'), T('§আট ঘণ্টা') + 0.8)));
  iconTile(g, 260, 600, 90, P(t, '§বৈদ্যুতিক বাতি'), ICON.bulb);
  btext(g, 'প্রাচীন ঘুম', 300, 650, 46, '#fff', P(t, '§ঘুমাতো না'));
  xMark(g, 1030, 330, 70, S(t, '§ঘুমাতো না', 0.4));
});
beat('§গবেষণায় দেখা যায়, প্রাচীন মানুষেরা', (g, t) => {
  studio(g, '#0e1430', '#03050c', t, 71);
  btext(g, 'প্রাচীন ঘুম', 300, 650, 46, '#fff');
  const k1 = S(t, '§চার ঘণ্টার মতো', 1), k2 = S(t, '§এক থেকে দুই ঘণ্টার', 1), k3 = S(t, '§পরের চার ঘণ্টার', 1);
  g.fillStyle = '#5ab8ff'; rr(g, 480, 610, 420 * k1, 80, 14); g.fill(); if (k1 > 0.6) btext(g, '৪ ঘণ্টা ঘুম', 690, 650, 36, '#111', 1, { stroke: '#5ab8ff' });
  g.fillStyle = '#ffd23f'; rr(g, 910, 610, 160 * k2, 80, 14); g.fill(); if (k2 > 0.6) { btext(g, 'জাগা', 990, 650, 34, '#111', 1, { stroke: '#ffd23f' }); }
  g.fillStyle = '#5ab8ff'; rr(g, 1080, 610, 420 * k3, 80, 14); g.fill(); if (k3 > 0.6) btext(g, '৪ ঘণ্টা ঘুম', 1290, 650, 36, '#111', 1, { stroke: '#5ab8ff' });
  // moon over the awake gap
  if (k2 > 0) { g.fillStyle = '#f4f0dc'; g.beginPath(); g.arc(990, 470, 50 * k2, 0, 7); g.fill(); }
  if (t > T('§নিস্তব্ধ অন্ধকারে')) { pill(g, 'শান্ত চিন্তা • নিচু স্বরে গল্প', W / 2, 900, P(t, '§নিস্তব্ধ অন্ধকারে'), '#ffd23f', 52); }
});
beat('§আজ রাত দুইটার সময়', (g, t) => {
  modernRoom(g, t); g.fillStyle = 'rgba(5,10,40,0.6)'; g.fillRect(0, 0, W, H);
  chinta(g, t, 960, { tint: 'rgba(20,30,90,0.35)' });
  iconTile(g, 1550, 300, 110, 1, (gg, r) => { ICON.clock(gg, r, 0); }); big(g, '২:০০', 1550, 480, 1, 70, '#ffd23f');
  pill(g, 'ইনসমনিয়া?', 420, 300, P(t, '§ইনসমনিয়া'), RED, 64, '#fff');
  pill(g, 'প্রাকৃতিক নিয়ম', 420, 480, P(t, '§প্রাকৃতিক নিয়মটাই'), '#2ecc71', 60);
});
// ---- chapter 5 ----
beat('§এবার আসা যাক আমাদের সবশেষ', (g, t, b) => { const lt = t - b.t0; studio(g, '#3a1a1a', '#100404', t, 72); iconTile(g, W / 2, 520, 200, P(t, '§এবার আসা যাক'), ICON.trap); chapterCard(g, 'পর্ব ৫', 'সভ্যতার ফাঁদ', seg(lt, 0, 0.4) * (1 - seg(lt, 2.2, 2.8)), t, RED); });
beat('§মানুষ যদি এতোই সুখে', (g, t) => { studio(g, '#2a2a4a', '#0a0a18', t, 73); chinta(g, t, 1250); iconTile(g, 500, 480, 160, P(t, '§মানুষ যদি এতোই'), (gg, r) => ICON.hourglass(gg, r, t)); questionMark(g, 500, 760, P(t, '§হারিয়ে গেলো'), t, 140); });
beat('§কে আমাদের এই দাসত্বের ফাঁদে', (g, t) => { studio(g, '#4a0a0a', '#100000', t, 74); const k = P(t, '§দাসত্বের ফাঁদে'); iconTile(g, W / 2, 500, 260 * k, 1, ICON.trap); vg(g, 0.6, '80,0,0'); pill(g, 'কে ফেললো?', W / 2, 900, P(t, '§ফেললো'), RED, 70, '#fff'); });
beat('§আজ থেকে প্রায় ১০ হাজার বছর আগে', (g, t, b) => {
  if (t < T('§বীজ পুঁতলো') - 0.4) {
    const k = ease(seg(t, b.t0, b.t0 + 1.6)); const Sm = drawMap(g, { lon: lerp(30, 41, k), lat: lerp(20, 34, k), zoom: lerp(0.8, 3.2, k) }, t);
    const FC = [[35, 31], [36, 34], [38, 36.5], [42, 37.5], [45, 36], [48, 33], [48, 30], [46, 31], [44, 33], [41, 35], [38, 34], [36, 31.5]];
    const a = S(t, '§উর্বর অর্ধচন্দ্রাকার', 0.8);
    g.save(); g.globalAlpha = a * (0.6 + 0.3 * Math.sin(t * 6)); g.fillStyle = '#3f9a3a'; g.beginPath(); FC.forEach((p, i) => { const [x, y] = Sm(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fill(); g.restore();
    bigNumber(g, '১০,০০০ বছর আগে', W / 2, 140, 80, '#7a2a14', P(t, '§১০ হাজার বছর'));
    btext(g, 'উর্বর অর্ধচন্দ্র', W / 2, 960, 60, '#1f5a1a', P(t, '§উর্বর অর্ধচন্দ্রাকার'), { stroke: '#f3e2bd' });
  } else {
    studio(g, '#4a3a1a', '#120c04', t, 75); g.fillStyle = '#6a4a2a'; g.fillRect(0, 700, W, 380);
    const k = S(t, '§বীজ পুঁতলো', 1.2); g.save(); g.translate(W / 2, lerp(400, 690, k)); g.fillStyle = '#8a5a2a'; g.beginPath(); g.ellipse(0, 0, 18, 26, 0.3, 0, 7); g.fill(); g.restore();
    if (k >= 1) wheat(g, W / 2, 700, 300 * ease(seg(t, T('§বীজ পুঁতলো') + 1.2, T('§বীজ পুঁতলো') + 3)), t, '#e2b23a', 1);
    pill(g, 'প্রথম বীজ', W / 2, 200, P(t, '§বীজ পুঁতলো'), '#2ecc71', 70);
  }
});
beat('§মানুষ শিকার ছেড়ে মাটিতে শস্য', (g, t) => {
  dayLand(g, t, { pan: 3000, noVolcano: true }); g.fillStyle = '#9a7a44'; g.fillRect(0, 820, W / 2, 260);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 11; i++) wheat(g, 40 + i * 80, 860 + r * 60, 100 * S(t, '§শস্য বোনা', 1.5), t, '#e2b23a', r * 11 + i);
  ink(g, '#6b4a2a', 8); for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(1060 + i * 140, 880); g.lineTo(1060 + i * 140, 1000); g.stroke(); } g.beginPath(); g.moveTo(1040, 910); g.lineTo(1800, 910); g.moveTo(1040, 960); g.lineTo(1800, 960); g.stroke();
  for (let i = 0; i < 4; i++) { const k = P(t, '§পোষ মানানো', 0.3 + i * 0.1); if (k > 0) { g.save(); g.translate(1150 + i * 170, 990); g.scale(k * 0.55, k * 0.55); deer(g, 0, 0, 1, 0, '#e8e0d0', 0); g.restore(); } }
  pill(g, 'শস্য বোনা', 480, 200, P(t, '§শস্য বোনা'), '#e2b23a', 60); pill(g, 'পশু পোষা', 1440, 200, P(t, '§পোষ মানানো'), '#e8e0d0', 60);
});
beat('§আপাতদৃষ্টিতে মনে হয়েছিলো', (g, t) => { studio(g, '#1f3a2a', '#06120a', t, 76); const k = ease(seg(t, T('§আপাতদৃষ্টিতে'), T('§সবচেয়ে বড় উন্নতি') + 0.6)); ink(g, GOOD, 26); g.beginPath(); g.moveTo(400, 860); g.lineTo(400 + 1100 * k, 860 - 560 * k); g.stroke(); if (k > 0.9) { g.fillStyle = GOOD; g.beginPath(); g.moveTo(1530, 280); g.lineTo(1440, 290); g.lineTo(1510, 360); g.fill(); } pill(g, 'উন্নতি!', 900, 260, P(t, '§সবচেয়ে বড় উন্নতি'), '#2ecc71', 90); });
beat('§কারণ এখন খাবারের ওপর নিয়ন্ত্রণ', (g, t) => { studio(g, '#4a3a1a', '#120c04', t, 77); iconTile(g, 600, 480, 150, P(t, '§খাবারের ওপর নিয়ন্ত্রণ'), (gg, r) => ICON.wheat(gg, r, t)); pill(g, 'নিয়ন্ত্রণ', 600, 720, P(t, '§নিয়ন্ত্রণ'), '#2ecc71', 60); antelope(g, 1320, 640, 1.4, t, 1); xMark(g, 1320, 500, 160, S(t, '§হাঁটতে হচ্ছে না', 0.5)); });
beat('§কিন্তু বাস্তবে কৃষিকাজ ছিলো', (g, t, b) => {
  studio(g, '#4a0a0a', '#100000', t, 78);
  for (let i = 0; i < 9; i++) wheat(g, 640 + i * 80, 760, 200, t, '#e2b23a', i);
  const snap = S(t, '§সবচেয়ে বড় ফাঁদ', 0.25); g.save(); g.translate(W / 2, 700); ink(g, '#ccc', 14);
  for (const sgn of [-1, 1]) { g.save(); g.rotate(sgn * (1 - snap) * 1.2); g.beginPath(); g.arc(0, 0, 380, sgn < 0 ? Math.PI : Math.PI * 2, sgn < 0 ? Math.PI * 1.5 : Math.PI * 1.5, sgn > 0); g.stroke(); for (let k = 0; k < 6; k++) { const a = Math.PI * (1 + k / 12 * (sgn < 0 ? 1 : -1)) + (sgn > 0 ? Math.PI * 0.5 : 0); } g.restore(); }
  g.restore();
  if (snap > 0 && snap < 1) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(0, 0, W, H); }
  stamp(g, 'সবচেয়ে বড় ফাঁদ!', W / 2, 260, snap); vg(g, 0.6, '80,0,0');
});
beat('§কীভাবে সেই ফাঁদ কাজ করলো', (g, t) => { studio(g, '#2a2a4a', '#0a0a18', t, 79); front(g, t, 960, { close: true }); questionMark(g, 1420, 260, P(t, '§জানেন'), t); });
beat('§কৃষিকাজের ফলে জমিতে', (g, t, b) => {
  studio(g, '#2a1a1a', '#0a0404', t, 80);
  const nodes = [{ icon: (gg, r) => ICON.wheat(gg, r, t), label: 'বেশি খাবার', a: '§অনেক বেশি খাবার' }, { icon: ICON.baby, label: 'জন্মহার ↑', a: '§জন্মহার' }, { icon: ICON.people, label: 'জনসংখ্যা ↑', a: '§জনসংখ্যা' }, { icon: ICON.food, label: 'আরও খাবার চাই', a: '§আরও বেশি খাবারের' }, { icon: ICON.land, label: 'আরও জমি', a: '§আরও বেশি জমি' }, { icon: ICON.sweat, label: 'আরও পরিশ্রম', a: '§শারীরিক পরিশ্রম' }];
  let k = 0; nodes.forEach((n, i) => { if (t >= T(n.a)) k = Math.max(k, (i + Math.min(1, (t - T(n.a)) / 0.6)) / nodes.length); });
  loopDiagram(g, W / 2, 520, 330, nodes, k, t);
  pill(g, 'ফাঁদের চক্র', 260, 120, 1, RED, 50, '#fff');
});
beat('§ঠিক এই জায়গাতেই ফাঁদের দরজাটা', (g, t) => {
  dayLand(g, t, { pan: 3400, noVolcano: true }); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, 0, W, H);
  const k = S(t, '§চিরতরে বন্ধ', 0.35);
  g.fillStyle = '#3a2418'; g.fillRect(0, 0, W * 0.5 * k, H); g.fillRect(W - W * 0.5 * k, 0, W * 0.5 * k, H);
  if (k >= 1) { ink(g, '#1a0f08', 10); g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke(); stamp(g, 'বন্ধ!', W / 2, 520, S(t, '§চিরতরে বন্ধ', 0.8)); }
});
beat('§কারণ আপনার দলের মানুষের সংখ্যা', (g, t) => {
  dayLand(g, t, { pan: 3600, noVolcano: true, sparse: true });
  for (let i = 0; i < 40 * S(t, '§কয়েক গুণ', 1.2); i++) cave(g, 80 + (i % 20) * 92, 980 + Math.floor(i / 20) * 50, 0.8, t + i, {});
  iconTile(g, 1600, 320, 100, P(t, '§বনের ফলমূল'), (gg, r) => ICON.food(gg, r), S(t, '§পারবেন না', 0.5));
  pill(g, 'এতো মানুষ!', 500, 260, P(t, '§কয়েক গুণ'), RED, 64, '#fff');
});
beat('§অর্থাৎ পেছনে ফিরে যাওয়ার সব পথ', (g, t) => {
  dayLand(g, t, { pan: 300 }); g.fillStyle = '#c9b07a'; g.beginPath(); g.moveTo(860, 1080); g.lineTo(1060, 1080); g.lineTo(980, 640); g.lineTo(940, 640); g.fill();
  const k = P(t, '§পেছনে ফিরে'); g.save(); g.translate(960, 820); g.scale(k, k); g.fillStyle = RED; rr(g, -260, -40, 520, 80, 10); g.fill(); g.fillStyle = '#fff'; for (let i = 0; i < 5; i++) g.fillRect(-240 + i * 110, -40, 50, 80); g.restore();
  pill(g, 'ফেরার পথ বন্ধ', 960, 220, P(t, '§চিরতরে বন্ধ'), RED, 70, '#fff');
});
beat('§এরপর মানুষের কাজের চাপ বাড়লো', (g, t, b) => { studio(g, '#3a1a1a', '#100404', t, 81); const k = seg(t, b.t0, b.t1); ink(g, RED, 14); g.beginPath(); for (let i = 0; i <= 100 * k; i++) { const u = i / 100; i ? g.lineTo(300 + u * 1300, 900 - Math.pow(u, 2.2) * 650) : g.moveTo(300, 900); } g.stroke(); btext(g, 'কাজের চাপ', 400, 200, 60, '#fff'); pill(g, 'ভয়াবহ হারে ↑', 1400, 260, P(t, '§ভয়াবহ হারে'), RED, 60, '#fff'); });
beat('§মাটি কোপানো, বীজ বোনা', (g, t) => {
  studio(g, '#4a3a1a', '#120c04', t, 82);
  const tasks = [['মাটি কোপানো', '§মাটি কোপানো'], ['বীজ বোনা', '§বীজ বোনা'], ['আগাছা পরিষ্কার', '§আগাছা'], ['ফসল কাটা', '§ফসল কাটা'], ['পাহারা', '§পাহারা দেওয়া']];
  tasks.forEach(([lb, a], i) => card(g, 220 + i * 370, 480, 340, 520, P(t, a), lb, (c, w, h) => { c.fillStyle = '#8a6a3a'; c.fillRect(0, 0, w, h); c.fillStyle = '#c8a060'; c.fillRect(0, 0, w, h * 0.45); if (i === 4) cave(c, w / 2, h - 60, 0.9, t, { pose: 'spear' }); else farmerBend(c, w / 2, h - 60, 0.9, 0.4 + 0.4 * Math.sin(t * 4 + i), t); }, (i - 2) * 0.1));
  pill(g, 'অন্তহীন খাটুনি', W / 2, 920, P(t, '§অন্তহীন খাটুনি'), RED, 64, '#fff');
});
beat('§আর এই হাড়ভাঙা খাটুনির ফলেই', (g, t) => { studio(g, '#4a1a1a', '#140404', t, 83); skeleton(g, 700, 1000, { h: 640, t, damage: 0.9, thick: 0.85, hl: 'spine' }); teeth(g, 1400, 340, 0.55, 0.9, t); spine(g, 1400, 760, 0.35, 0.9, 0.3, t); pill(g, 'সেই দ্বিতীয় কঙ্কাল', 700, 220, P(t, '§দ্বিতীয় কঙ্কালটি'), RED, 60, '#fff'); });
beat('§সময়ের সাথে সাথে বড় কৃষিগ্রাম', (g, t, b) => { const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#8fc6ea'); sky.addColorStop(1, '#f0e6c8'); g.fillStyle = sky; g.fillRect(0, 0, W, H); cityGrowth(g, seg(t, b.t0 + 0.3, b.t1 - 0.3), t); pill(g, 'গ্রাম → শহর', W / 2, 150, P(t, '§বড় বড় শহর'), '#ffd23f', 70); pill(g, 'ব্যবসা-বাণিজ্য', 400, 300, P(t, '§ব্যবসা-বাণিজ্য'), '#fff', 50); });
beat('§এরপর শহরে এলো সৈন্যবাহিনী', (g, t) => { g.drawImage(CITY16, 0, 0); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, W, H); [['sword', 'সৈন্যবাহিনী', '§সৈন্যবাহিনী'], ['crown', 'শাসক', '§শাসক'], ['coin', 'কর আদায়', '§কর আদায়কারী']].forEach(([ic, lb, a], i) => { iconTile(g, 420 + i * 540, 460, 140, P(t, a), ICON[ic]); btext(g, lb, 420 + i * 540, 680, 56, '#fff', P(t, a)); }); });
beat('§আর সবশেষে মানব ইতিহাসে জন্ম নিলো', (g, t) => {
  studio(g, '#2a2a3a', '#08080e', t, 84);
  balance(g, W / 2, 300, 0.15 * S(t, '§বিক্রি করে', 1), (gg, x, y) => iconTile(gg, x, y - 20, 70, 1, (g2, r) => ICON.clock(g2, r, t * 5)), (gg, x, y) => iconTile(gg, x, y - 20, 70, 1, ICON.food));
  pill(g, 'সময় ⇄ খাবার', W / 2, 160, P(t, '§বিনিময়ে'), '#ffd23f', 64); pill(g, 'সময় বিক্রি', W / 2, 960, P(t, '§বিক্রি করে'), RED, 64, '#fff');
});
beat('§তাই কোনো এক অন্ধকার রাতে', (g, t) => { studio(g, '#1a1424', '#05040a', t, 85); iconTile(g, W / 2, 480, 150, 1, (gg, r) => ICON.hourglass(gg, r, t)); g.fillStyle = '#111'; g.save(); g.translate(1200, 480); g.beginPath(); g.ellipse(0, 0, 70, 45, 0, 0, 7); g.fill(); g.fillRect(0, -30, 800, 60); g.restore(); xMark(g, 1250, 480, 140, S(t, '§চুরি করে নেয়নি', 0.5)); pill(g, 'হঠাৎ চুরি নয়', W / 2, 860, P(t, '§চুরি করে নেয়নি'), '#ffd23f', 60); });
beat('§প্রজন্মের পর প্রজন্ম ধরে খুব ধীরে', (g, t, b) => {
  studio(g, '#2a2a3a', '#08080e', t, 86); const k = seg(t, b.t0, b.t1);
  for (let i = 0; i < 9; i++) cave(g, 180 + i * 140, 520, 0.8 + i * 0.03, t + i, { col: mixC('#2ecc71', '#e8402c', i / 8), cloth: mixC('#2ecc71', '#e8402c', i / 8), skin: mixC('#2ecc71', '#e8402c', i / 8) });
  const kk = P(t, '§অলিখিত চুক্তির'); g.save(); g.translate(1550, 520); g.scale(kk, kk); iconTile(g, 0, 0, 170, 1, ICON.scroll); g.restore();
  pill(g, 'অলিখিত চুক্তি', 1550, 780, P(t, '§অলিখিত চুক্তির'), '#ffd23f', 56); pill(g, '"না" বলার সুযোগ নেই', W / 2, 960, P(t, '§না বলার সুযোগ'), RED, 56, '#fff');
});
beat('§আর আজ সকালে যে অ্যালার্মটা', (g, t) => { modernRoom(g, t); chinta(g, t, 1250, { tint: 'rgba(80,0,0,0.1)' }); iconTile(g, 520, 420, 170, 1, (gg, r) => ICON.alarm(gg, r, t)); if (Math.sin(t * 40) > 0) { ink(g, '#e8262c', 6); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(520, 420, 200 + i * 30, -0.6, 0.6); g.stroke(); g.beginPath(); g.arc(520, 420, 200 + i * 30, Math.PI - 0.6, Math.PI + 0.6); g.stroke(); } } pill(g, 'চুক্তির শেষ কিস্তি', 520, 760, P(t, '§সর্বশেষ কিস্তি'), RED, 60, '#fff'); });
beat('§আজ একজন আধুনিক মানুষ', (g, t) => { g.drawImage(CITY16, 0, 0); g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 0, W, H); const k = S(t, '§৯০ হাজার ঘণ্টা', 1.6); bigNumber(g, BN((Math.round(k * 90) * 1000).toLocaleString('en-US')) + ' ঘণ্টা', W / 2, 420, 150, '#ffd23f', P(t, '§৯০ হাজার ঘণ্টা'), 'সারাজীবনে শুধু কাজ'); iconTile(g, 300, 260, 90, 1, ICON.briefcase); });
beat('§সারাদিন কাজের শেষে শরীরে', (g, t) => {
  g.save(); g.beginPath(); g.rect(0, 0, W / 2, H); g.clip(); modernRoom(g, t); g.fillStyle = 'rgba(5,10,40,0.55)'; g.fillRect(0, 0, W, H); front(g, t, 480, { tint: 'rgba(20,30,90,0.4)' }); g.restore();
  g.save(); g.beginPath(); g.rect(W / 2, 0, W / 2, H); g.clip(); dayLand(g, t, { pan: 2300, dawn: 0.4, sunY: 360, sunX: 1500 }); cave(g, 1440, 990, 1.6, t, { pose: 'sit' }); necklace(g, 1640, 760, 90, 1, t); g.restore();
  ink(g, '#fff', 8); g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke();
  pill(g, 'সামান্য শক্তি বাকি', 480, 120, P(t, '§সামান্য শক্তি'), RED, 52, '#fff'); pill(g, 'দুপুরের শিল্পচর্চা', 1440, 120, P(t, '§রোজকার সাধারণ দুপুরের'), '#2ecc71', 52);
});
beat('§আজ আপনি সারাজীবন ধরে সাফল্যের', (g, t, b) => {
  const lt = t - b.t0; g.drawImage(CITY16, 0, 0);
  g.fillStyle = '#3a4361'; g.fillRect(0, 960, W, 120);
  ink(g, '#fff', 6); g.setLineDash([40, 30]); g.lineDashOffset = -lt * 400; g.beginPath(); g.moveTo(0, 1020); g.lineTo(W, 1020); g.stroke(); g.setLineDash([]);
  sideW(g, t, 1200, { p: lt / 0.6, flip: false });
  g.fillStyle = '#fff'; for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#111' : '#fff'; g.fillRect(60, 300 + i * 40, 40, 40); } pill(g, 'অবসর', 200, 240, P(t, '§বৃদ্ধ বয়সে অবসর'), '#2ecc71', 56);
  iconTile(g, 1600, 300, 90, P(t, '§টাকা জমাচ্ছেন'), ICON.coin); pill(g, 'সাফল্যের পেছনে', 1000, 140, P(t, '§সাফল্যের পেছনে'), '#ffd23f', 56);
});
beat('§অথচ আমাদের সেই প্রাচীন পূর্বপুরুষেরা', (g, t) => {
  dayLand(g, t, { pan: 2600, dawn: 0.3 });
  for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? '#111' : '#fff'; g.fillRect(i * 192, 1000, 192, 30); }
  ink(g, '#ddd', 10); g.beginPath(); g.moveTo(460, 1000); g.lineTo(460, 560); g.moveTo(1460, 1000); g.lineTo(1460, 560); g.stroke(); g.fillStyle = '#e8402c'; rr(g, 440, 540, 1040, 90, 14); g.fill(); btext(g, 'ফিনিশ লাইন', W / 2, 585, 56, '#fff', 1, { stroke: '#e8402c' });
  cave(g, W / 2, 1000, 2.0, t, { pose: 'sit' }); pill(g, 'জন্ম থেকেই এখানে', W / 2, 200, P(t, '§জন্ম থেকেই'), '#2ecc71', 64);
});
beat('§আপনি আপনার পুরো জীবনটা কঠোর পরিশ্রম', (g, t) => {
  studio(g, '#2a2a3a', '#08080e', t, 87);
  btext(g, 'আপনার জীবন', 300, 390, 46, '#fff'); timelineBar(g, 480, 350, 1200, [{ len: 9, col: RED, label: 'কাজ', tcol: '#fff' }, { len: 1.2, col: '#2ecc71', label: 'স্বাধীন' }], S(t, '§কঠোর পরিশ্রম করে', 1.5));
});
beat('§অথচ তারা তাদের জীবনের প্রথম দিন', (g, t) => {
  studio(g, '#2a2a3a', '#08080e', t, 87);
  btext(g, 'আপনার জীবন', 300, 390, 46, '#fff'); timelineBar(g, 480, 350, 1200, [{ len: 9, col: RED, label: 'কাজ', tcol: '#fff' }, { len: 1.2, col: '#2ecc71', label: 'স্বাধীন' }], 1);
  btext(g, 'তাদের জীবন', 300, 650, 46, '#fff', P(t, '§অথচ তারা তাদের')); timelineBar(g, 480, 610, 1200, [{ len: 1, col: '#2ecc71', label: 'প্রথম দিন থেকে শেষ দিন — স্বাধীন' }], S(t, '§প্রথম দিন থেকে', 1.5));
});
beat('§আজ যদি তারা ফিরে এসে দেখতো', (g, t, b) => {
  g.drawImage(CITY16, 0, 0);
  phoneP(g, t, 1300, {}); iconTile(g, 1600, 300, 90, 1, (gg, r) => ICON.alarm(gg, r, t));
  const k = P(t, '§ফিরে এসে'); cave(g, 520, 1000, 2.0 * Math.max(0.01, k), t, { pose: 'spear', beard: true });
  symbolText(g, '!?', 520, 420, 170, '#ffd23f', P(t, '§ভীষণ অবাক'));
  pill(g, 'অমূল্য স্বাধীনতা বিক্রি', 1300, 140, P(t, '§স্বাধীনতাটুকু বিক্রি'), RED, 56, '#fff');
  const fe = seg(t, AUDIO_END + 0.2, DUR - 0.6); if (fe > 0) { g.fillStyle = `rgba(0,0,0,${fe * 0.7})`; g.fillRect(0, 0, W, H); big(g, 'আপনার সময় — আপনার জীবন', W / 2, H / 2, easeOutBack(fe * 2), 90, '#ffd23f'); }
});
