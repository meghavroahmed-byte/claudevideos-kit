// ===== "চিলি কেনো এতো লম্বা" — 9:16 satellite map short =====
const C_RED = '#ff2a2a', C_ORANGE = '#ff9f1c', C_BLUE = '#2f7bff', C_YEL = '#ffe14a';
const SA = ['Brazil', 'Argentina', 'Chile', 'Peru', 'Bolivia', 'Colombia', 'Venezuela', 'Ecuador', 'Paraguay', 'Uruguay', 'Guyana', 'Suriname'];
const latY = lat => P(0, lat)[1];
// fill a country only between two latitudes (screen-space band clip, camera has no rotation here)
function band(g, name, col, k, latTop, latBot, o = {}) { if (k <= 0) return; g.save(); const y0 = latY(latTop), y1 = latY(latBot); g.beginPath(); g.rect(-2000, y0, 5000, y1 - y0); g.clip(); fillC(g, name, col, k, o); g.restore(); }
// mainland width scan for the "narrow" shot
function widthAt(name, lat) { const f = FEAT[name]; const ny = myN(lat); let best = null; for (const r of f.rings) { const xs = []; for (let i = 0; i < r.length; i++) { const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % r.length]; if ((y1 - ny) * (y2 - ny) < 0) xs.push(x1 + (x2 - x1) * (ny - y1) / (y2 - y1)); } if (xs.length < 2) continue; xs.sort((a, b) => a - b); const sp = [xs[0], xs[xs.length - 1]]; if (!best || sp[1] - sp[0] > best[1] - best[0]) best = sp; } return best; }
let NARROW = null;
function findNarrow() { const w0 = widthAt('Chile', -31.6); console.log('NARROW ' + JSON.stringify(w0) + ' km ' + ((w0[1]-w0[0])*40075*Math.cos(31.6*D2)).toFixed(0)); return { la: -31.6, w: w0[1] - w0[0], x0: w0[0], x1: w0[1] }; let best = null; for (let la = -27; la >= -40; la -= 0.05) { const w = widthAt('Chile', la); if (w && (!best || w[1] - w[0] < best.w)) best = { la, w: w[1] - w[0], x0: w[0], x1: w[1] }; } return best; }
const lonOfN = nx => nx * 360 - 180;
function ribbonWave(g, t, k) { }
function magnifier(g, x, y, r, k) { if (k <= 0) return; const e = easeOutBack(k); g.save(); g.translate(x, y); g.scale(e, e); g.lineCap = 'round'; for (const [c, w] of [['rgba(0,0,0,0.5)', 26], ['#ffffff', 16]]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, 0, 7); g.moveTo(r * 0.72, r * 0.72); g.lineTo(r * 1.65, r * 1.65); g.stroke(); } g.fillStyle = 'rgba(180,230,255,0.18)'; g.beginPath(); g.arc(0, 0, r - 8, 0, 7); g.fill(); g.restore(); }
function bubble(g, x, y, s, k) { if (k <= 0) return; const e = easeOutBack(k); g.save(); g.translate(x, y); g.scale(s * e, s * e); g.fillStyle = '#ffffff'; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 6; g.beginPath(); g.roundRect(-150, -100, 300, 180, 40); g.moveTo(-60, 80); g.lineTo(-100, 140); g.lineTo(-10, 80); g.fill(); g.stroke(); g.fillStyle = '#ff2a4a'; for (let i = -1; i <= 1; i++) { g.beginPath(); g.arc(i * 70, -10, 18, 0, 7); g.fill(); } g.restore(); }
function xMark(g, x, y, r, k) { if (k <= 0) return; g.save(); g.strokeStyle = C_RED; g.lineWidth = 14; g.lineCap = 'round'; g.shadowColor = '#000'; g.shadowBlur = 10; const a = clamp(k * 2), c = clamp(k * 2 - 1); g.beginPath(); g.moveTo(x - r, y - r); g.lineTo(x - r + 2 * r * a, y - r + 2 * r * a); if (c > 0) { g.moveTo(x + r, y - r); g.lineTo(x + r - 2 * r * c, y - r + 2 * r * c); } g.stroke(); g.restore(); }
const ANDES = [[-69.2, -18], [-68.6, -21], [-68.0, -23.5], [-68.6, -26], [-69.4, -28], [-70.0, -30.5], [-70.0, -32.7], [-70.3, -35], [-71.0, -38], [-71.5, -41], [-71.8, -44], [-72.5, -47], [-73.2, -50], [-72.5, -52]];
function andesWall(g, t, k, lw = 16) { if (k <= 0) return; const pts = ANDES.map(([lo, la]) => P(lo, la)); const n = Math.max(2, Math.round(pts.length * k)); g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; for (const [c, w, b] of [['rgba(60,30,10,0.6)', lw + 12, 0], ['#f4e3c1', lw, 24]]) { g.strokeStyle = c; g.lineWidth = w; g.shadowColor = '#fff2c8'; g.shadowBlur = b; g.beginPath(); for (let i = 0; i < n; i++) i ? g.lineTo(...pts[i]) : g.moveTo(...pts[i]); g.stroke(); }
  for (let i = 0; i < n - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; for (let s = 0; s < 3; s++) { const u = (s + 0.5) / 3, x = lerp(x0, x1, u), y = lerp(y0, y1, u), h = lw * 1.6; g.fillStyle = '#7a5a3a'; g.beginPath(); g.moveTo(x - h * 0.8, y + h * 0.4); g.lineTo(x, y - h); g.lineTo(x + h * 0.8, y + h * 0.4); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x - h * 0.3, y - h * 0.45); g.lineTo(x, y - h); g.lineTo(x + h * 0.3, y - h * 0.45); g.fill(); } } g.restore(); }
const VILLAGES = [[-62, -4], [-70, -8], [-55, -10], [-47, -6], [-65, -15], [-50, -18], [-58, -24], [-44, -14], [-72, -14], [-63, -30], [-55, -30], [-70, -30], [-66, -38], [-62, 5], [-74, 3], [-67, -25]];
function village(g, x, y, k) { if (k <= 0) return; g.save(); g.globalAlpha = k; g.fillStyle = '#5a3418'; g.strokeStyle = '#f3e3c0'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 18, y + 12); g.lineTo(x, y - 18); g.lineTo(x + 18, y + 12); g.closePath(); g.fill(); g.stroke(); g.restore(); }

// ---------------- BEATS ----------------
// 0 hook: world -> South America, Chile glows
bt(0, { cut: true, cam: { lon: -20, lat: 10, z: 1500 }, drift: 0.35, draw: (g, t) => { label(g, 'চিলি কেনো এতো লম্বা?', 540, 300, 84, at(t, 0.25, 0.5), { col: C_YEL }); } });
bt('দক্ষিণ আমেরিকার', { cam: { lon: -60, lat: -27, z: 6000 }, mv: 1.8, borders: 0.5,
  draw: (g, t, lt, b) => { const k = at(t, '‘চিলি’', 0.6); fillC(g, 'Chile', C_RED, k); const [x, y] = P(-73, -30); label(g, 'চিলি', x - 150, y, 92, at(t, '‘চিলি’', 0.4, 0.15));
    const kl = at(t, 'লম্বা আর', 0.8); const [ax, ay] = P(-77.5, -18), [bx, by] = P(-77.5, -55); measure(g, ax, ay, bx, by, 'লম্বা', kl, { off: -50 });
    label(g, 'চিলি কেনো এতো লম্বা?', 540, 300, 84, 1 - at(t, 'দক্ষিণ আমেরিকার', 0.4, 0.6), { col: C_YEL }); const kc = at(t, 'চিকন', 0.4); const [cx, cy] = P(-70.5, -36); arrow(g, cx - 260, cy, cx - 50, cy, kc, { bend: 0, lw: 12 }); arrow(g, cx + 260, cy, cx + 50, cy, kc, { bend: 0, lw: 12 });
    charWin(g, t, at(t, 'অদ্ভুত', 0.4), { think: true, x: 860, y: 1650, r: 170 }); } });
// 1 London -> Baghdad overlay
bt('দেশটি লম্বায়', { cut: true, cam: { lon: 21, lat: 43, z: 7000 }, mv: 0.01, borders: 0.4,
  draw: (g, t, lt, b) => { const [lx, ly] = P(-0.13, 51.5), [gx, gy] = P(44.4, 33.3);
    const k = ease(at(t, 'ইউরোপের ওপর', 1.4)); const rot = Math.atan2(gy - ly, gx - lx) - Math.PI / 2; const mxp = (lx + gx) / 2, myp = (ly + gy) / 2;
    shapeAt(g, 'Chile', lerp(-300, mxp, k), lerp(2100, myp, k), C_RED, clamp(k * 3), { rot: lerp(0.6, rot, k), a: 0.78 });
    const km = at(t, 'বাগদাদ', 0.8, 0.3); measure(g, lx + 30, ly + 60, gx + 30, gy + 60, '~৪,৩০০ কিমি', km, { off: -70, size: 64 });
    label(g, 'ইউরোপ', 330, 380, 70, at(t, 'ইউরোপের', 0.4), { col: '#ffffff' }); cityDot(g, lx, ly, 'লন্ডন', at(t, 'লন্ডন', 0.4), { dy: -52 }); cityDot(g, gx, gy, 'বাগদাদ', at(t, 'বাগদাদ', 0.4), { dy: 56 }); } });
// 2 narrow
bt('অথচ চওড়ায়', { cut: true, cam: () => { NARROW = findNarrow(); const z = Math.min(40000, 330 / NARROW.w); return { lon: lonOfN((NARROW.x0 + NARROW.x1) / 2) + 0.3, lat: NARROW.la, z }; }, mv: 0.01, drift: 0.12,
  draw: (g, t, lt, b) => { fillC(g, 'Chile', C_RED, 0.55 + 0.1 * Math.sin(t * 4), { a: 0.45, blur: 20 }); const y = latY(NARROW.la), [x0] = PN(NARROW.x0, 0), [x1] = PN(NARROW.x1, 0);
    measure(g, x0, y, x1, y, '৬০ মাইলেরও কম!', at(t, '৬০ মাইলের', 0.7), { off: 90, size: 66 }); label(g, 'চওড়া', (x0 + x1) / 2, y - 260, 84, at(t, 'চওড়ায়', 0.4)); } });
// 3 why ribbon?
bt('কিন্তু একটি দেশের', { cut: true, cam: { lon: -69, lat: -37, z: 6200 }, mv: 0.01, borders: 0.35,
  draw: (g, t, lt, b) => { fillC(g, 'Chile', C_RED, 1, { a: 0.75 + 0.15 * Math.sin(t * 5) }); label(g, 'ফিতার মতো?', 620, 520, 96, at(t, 'ফিতার', 0.4), { col: C_YEL, it: true, rot: -0.12 }); const [x, y] = P(-72, -44); arrow(g, 760, 600, x + 20, y - 40, at(t, 'ফিতার', 0.6, 0.2), { bend: -0.25 });
    charWin(g, t, at(t, 'কীভাবে', 0.4), { think: true, x: 840, y: 1500, r: 175 }); } });
// 4 16th century, parchment, ships, conquest
bt('ষোলো শতকে', { cut: true, cam: { lon: -60, lat: -22, z: 5600 }, mv: 0.01,
  draw: (g, t, lt, b) => { parchment(g, 1); const kc = at(t, 'দখল করে', 1.2);
    SA.forEach((n, i) => fillC(g, n, '#9b1d1d', kc * clamp(1.2 - i * 0.05), { a: 0.55, blur: 0, sc: 'rgba(60,20,10,0.9)', lw: 2 }));
    VILLAGES.forEach(([lo, la], i) => { const [x, y] = P(lo, la); village(g, x, y, at(t, 'আদিবাসীদের', 0.3, i * 0.04) * (1 - at(t, 'সরিয়ে', 0.8, i * 0.05))); });
    const ks = at(t, 'ইউরোপীয়রা', 2.6); [[[-10, -5], [-34, -7]], [[-8, -24], [-40, -22]], [[-14, -36], [-54, -36]], [[-30, 12], [-58, 9]]].forEach(([a, c], i) => { const u = ease(clamp(ks - i * 0.1)), [x0, y0] = P(...a), [x1, y1] = P(...c); ship(g, lerp(x0, x1, u), lerp(y0, y1, u), 0.9, t, clamp(ks * 4 - i * 0.3), true); });
    label(g, 'ষোলো শতক', 540, 260, 110, at(t, 'ষোলো শতকে', 0.5), { col: '#3a1d08', sc: 'rgba(255,240,210,0.9)', font: 'Georgia, "Nirmala UI"' }); label(g, 'ইউরোপীয় দখল', 540, 1720, 74, kc, { col: '#fff1d6' }); } });
// 5 independence: small Chile
bt('পরে স্পেনের', { cam: { lon: -64, lat: -30, z: 6200 }, mv: 1.0, borders: 0.4,
  draw: (g, t, lt, b) => { const kp = clamp(1 - lt / 0.6); if (kp > 0) parchment(g, kp); SA.forEach((n, i) => { if (n !== 'Chile') fillC(g, n, POLPAL[i % POLPAL.length], at(t, 'স্বাধীন', 0.8, i * 0.03), { a: 0.38, blur: 0, sc: 'rgba(255,255,255,0.6)', lw: 2 }); });
    band(g, 'Chile', C_RED, at(t, 'চিলির আকার', 0.6), -25, -38); const [x, y] = P(-77, -31); label(g, 'চিলি', x - 60, y, 80, at(t, 'চিলির আকার', 0.4)); label(g, 'ছোট্ট শুরু', x - 40, y + 100, 56, at(t, 'বেশ ছোট', 0.4), { col: C_YEL, it: true });
    label(g, 'স্বাধীনতা · ১৮১৮', 540, 300, 80, at(t, 'স্বাধীন', 0.5)); } });
// 6 wants to expand east
bt('চিলি তখন চেয়েছিলো', { keep: false, cam: { lon: -66, lat: -31, z: 6800 }, mv: 1.0, borders: 0.4,
  draw: (g, t, lt, b) => { band(g, 'Chile', C_RED, 1, -25, -38); [-28, -31.5, -35].forEach((la, i) => { const [x0, y0] = P(-70.6, la), [x1, y1] = P(-62, la); arrow(g, x0, y0, x1, y1, at(t, 'পূর্ব দিকে', 0.8, i * 0.15), { bend: 0.06 }); });
    label(g, 'পূর্বে বাড়বো!', 700, 420, 86, at(t, 'সীমানা বাড়াতে', 0.4), { col: C_YEL, it: true }); charWin(g, t, at(t, 'চিলি তখন', 0.4), { point: true, x: 230, y: 1600, r: 170 }); } });
// 7 the Andes wall (close, snowy)
bt('কিন্তু পূর্ব দিকে তাকাতেই', { cut: true, cam: { lon: -70.2, lat: -32.8, z: 21000 }, mv: 0.01, drift: 0.1, shake: 0,
  draw: (g, t, lt, b) => { band(g, 'Chile', C_RED, 0.6, -25, -38, { a: 0.35 }); andesWall(g, t, at(t, 'পর্বতমালা', 1.2), 22); const [x, y] = P(-70.0, -32.4);
    label(g, 'আন্দিজ', x + 130, y - 330, 120, at(t, '‘আন্দিজ’', 0.4), { col: '#ffffff' }); label(g, 'দীর্ঘতম পর্বতমালা', x + 130, y - 210, 54, at(t, 'দীর্ঘতম', 0.4), { col: C_YEL, it: true });
    const kd = at(t, 'দেয়ালের', 0.35); [-33.4, -32.6, -31.8].forEach((la, i) => { const [x0, y0] = P(-71.4, la), [x1, y1] = P(-70.35, la); arrow(g, x0, y0, x1, y1, at(t, 'তাকাতেই', 0.6, i * 0.12), { bend: 0, lw: 12 }); xMark(g, x1 + 20, y1, 34, kd); });
    if (kd > 0 && kd < 1) { g.fillStyle = `rgba(255,255,255,${0.25 * (1 - kd)})`; g.fillRect(0, 0, PW, PH); } } });
// 8 squeezed between ocean and mountains
bt('একপাশে বিশাল', { cam: { lon: -71, lat: -32, z: 7000 }, mv: 1.2, borders: 0.35,
  draw: (g, t, lt, b) => { band(g, 'Chile', C_RED, 0.85 + 0.15 * Math.sin(t * 6), -25, -38); andesWall(g, t, 1, 12);
    label(g, 'প্রশান্ত মহাসাগর', 230, 1000, 68, at(t, 'প্রশান্ত', 0.5), { col: C_YEL, it: true, rot: -Math.PI / 2 }); const [ax, ay] = P(-66.5, -33); label(g, 'আন্দিজ', ax + 80, ay, 78, at(t, 'উঁচু পাহাড়ের', 0.4));
    const ks = at(t, 'চাপা পড়ায়', 0.5), sq = Math.sin(t * 9) * 12 * ks; const [cx, cy] = P(-70.8, -31.5); arrow(g, 120 + sq, cy, cx - 70 + sq, cy, ks, { bend: 0, col: C_YEL }); arrow(g, 1000 - sq, cy, cx + 90 - sq, cy, ks, { bend: 0, col: C_YEL });
    xMark(g, 540, 1500, 60, at(t, 'কোনো পথ', 0.5)); label(g, 'চওড়া হওয়ার পথ নেই', 540, 1640, 62, at(t, 'কোনো পথ', 0.4)); } });
// 9 grows south to the tip
bt('তাই তারা পাহাড়ের', { cam: { lon: -70, lat: -46, z: 5600 }, mv: 3.5, camDelay: 0.3, borders: 0.35,
  draw: (g, t, lt, b) => { const kg = ease(at(t, 'দক্ষিণ দিকে', 3.2)); const bot = lerp(-38, -56.2, kg); band(g, 'Chile', C_RED, 1, -25, bot); andesWall(g, t, 1, 10);
    const [x, y] = P(-71, bot); if (kg > 0 && kg < 1) arrow(g, x, y - 140, x, y + 60, 1, { bend: 0, lw: 12 });
    const ke = at(t, 'শেষ প্রান্ত', 0.5); const [tx, ty] = P(-68.5, -55.3); arrow(g, tx + 300, ty - 260, tx + 30, ty - 20, ke, { bend: 0.25 }); label(g, 'মহাদেশের শেষ প্রান্ত', 640, 1360, 64, ke, { col: C_YEL, it: true }); } });
// 10 war in the north: Bolivia & Peru lose the coast
bt('এরপর উত্তরে', { cut: true, cam: { lon: -67.5, lat: -20.5, z: 9000 }, mv: 0.01, borders: 0.45, shake: 0,
  draw: (g, t, lt, b) => { const kb = at(t, 'বলিভিয়া', 0.5), kp = at(t, 'পেরুর', 0.5), kw = at(t, 'দখল করে নিলো', 0.9);
    fillC(g, 'Bolivia', C_BLUE, kb); fillC(g, 'Peru', C_ORANGE, kp); band(g, 'Chile', C_RED, 1, -24.5, -60);
    band(g, 'Chile', mixC(C_BLUE, C_RED, kw), kb, -21.4, -24.5, { blur: 10 }); band(g, 'Chile', mixC(C_ORANGE, C_RED, kw), kp, -17, -21.4, { blur: 10 });
    const [bx, by] = P(-64.5, -17), [px, py] = P(-74, -11.5); label(g, 'বলিভিয়া', bx, by, 78, kb); label(g, 'পেরু', px, py, 78, kp);
    const kf = at(t, 'যুদ্ধ', 0.6); if (kf > 0 && kf < 1) { g.fillStyle = `rgba(255,200,120,${0.35 * Math.abs(Math.sin(kf * 12))})`; g.fillRect(0, 0, PW, PH); } label(g, 'যুদ্ধ!', 540, 300, 130, kf, { col: '#ff4b3a' });
    const [cx, cy] = P(-70.2, -21); arrow(g, cx - 330, cy - 120, cx - 30, cy, at(t, 'উপকূলও', 0.6), { bend: -0.2 }); label(g, 'সমুদ্র উপকূল', cx - 300, cy - 210, 58, at(t, 'উপকূলও', 0.4), { col: C_YEL, it: true }); } });
// 11 poor Bolivia searching for the sea
bt('আর সমুদ্র হারিয়ে', { cam: { lon: -66, lat: -19, z: 10500 }, mv: 1.0, borders: 0.45,
  draw: (g, t, lt, b) => { fillC(g, 'Bolivia', C_BLUE, 1, { a: 0.7 + 0.15 * Math.sin(t * 4) }); fillC(g, 'Peru', C_ORANGE, 1, { a: 0.6 }); fillC(g, 'Chile', C_RED, 1, { a: 0.75 });
    const km = at(t, 'খুঁজে', 0.5), [bx, by] = P(-65.5, -17); magnifier(g, bx + Math.sin(t * 1.7) * 160, by + Math.cos(t * 1.3) * 120, 80, km);
    label(g, 'আমার সমুদ্র কই?', 540, 330, 82, at(t, 'বেচারা', 0.4), { col: '#bfe0ff' }); label(g, 'বলিভিয়া', bx, by + 230, 70, 1);
    charWin(g, t, at(t, 'সমুদ্র হারিয়ে', 0.4), { point: true, x: 850, y: 1620, r: 165 }); } });
// 12 which country shape is weirdest?
bt('ম্যাপের কোন দেশটির', { cut: true, cam: { lon: 15, lat: 15, z: 1750 }, mv: 0.01, borders: 0.3,
  draw: (g, t, lt, b) => { const NM = ['চিলি', 'নরওয়ে', 'ইতালি', 'ভিয়েতনাম', 'ইন্দোনেশিয়া', 'গাম্বিয়া']; ['Chile', 'Norway', 'Italy', 'Vietnam', 'Indonesia', 'Gambia'].forEach((n, i) => { const col = [C_RED, C_YEL, C_ORANGE, '#36d399', C_BLUE, '#ff5ec4'][i], k = at(t, 'কোন দেশটির', 0.4, i * 0.3); fillC(g, n, col, k, { a: 0.95, blur: 30 }); const [x, y] = PN(...centroidN(n)); if (k > 0) { g.save(); g.strokeStyle = col; g.lineWidth = 6; g.globalAlpha = k; g.shadowColor = col; g.shadowBlur = 20; g.beginPath(); g.arc(x, y, 46 + 8 * Math.sin(t * 5 + i), 0, 7); g.stroke(); g.restore(); } label(g, NM[i], x, y - 78, 40, k, { col }); });
    label(g, 'কোন দেশটা সবচেয়ে অদ্ভুত?', 540, 330, 70, at(t, 'সবচেয়ে অদ্ভুত', 0.4), { col: C_YEL }); charWin(g, t, at(t, 'ম্যাপের কোন', 0.4), { point: true, x: 230, y: 1620, r: 170 }); } });
bt('কমেন্ট করে', { cam: { lon: 15, lat: 15, z: 1650 }, mv: 1.5,
  draw: (g, t, lt, b) => { ['Chile', 'Norway', 'Italy', 'Vietnam', 'Indonesia', 'Gambia'].forEach((n, i) => fillC(g, n, [C_RED, C_YEL, C_ORANGE, '#36d399', C_BLUE, '#ff5ec4'][i], 1, { a: 0.6, blur: 16 }));
    bubble(g, 760, 1380, 1.0, at(t, 'কমেন্ট', 0.4)); label(g, 'কমেন্টে জানান!', 540, 330, 92, at(t, 'কমেন্ট', 0.4), { col: '#ffffff' }); charWin(g, t, 1, { wave: true, x: 300, y: 1600, r: 200 }); } });

// ---------------- explicit SFX cues ----------------
sx('marker', 'লম্বা আর'); sx('swish', 'চিকন'); sx('swish', 'ইউরোপের ওপর', 0.1); sx('marker', 'বাগদাদ', 0.3); sx('marker', '৬০ মাইলের'); sx('marker', 'ফিতার', 0.2);
sx('wave', 'ইউরোপীয়রা', -0.2); sx('swish', 'সরিয়ে'); sx('marker', 'পূর্ব দিকে'); sx('thud', 'দেয়ালের'); sx('swish', 'পর্বতমালা');
sx('wave', 'প্রশান্ত', -0.3); sx('marker', 'চাপা পড়ায়'); sx('swish', 'দক্ষিণ দিকে'); sx('marker', 'শেষ প্রান্ত'); sx('boom', 'যুদ্ধ'); sx('swish', 'দখল করে নিলো');
sx('ding', 'খুঁজে'); sx('ding', 'কমেন্ট');