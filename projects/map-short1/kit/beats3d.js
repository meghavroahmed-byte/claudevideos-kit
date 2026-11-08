// ===== "চিলি কেনো এতো লম্বা" v2 — 3D terrain + globe + story cards =====
const C_RED = '#ff2a2a', C_ORANGE = '#ff9f1c', C_BLUE = '#2f7bff', C_YEL = '#ffe14a';
const SA = ['Brazil', 'Argentina', 'Chile', 'Peru', 'Bolivia', 'Colombia', 'Venezuela', 'Ecuador', 'Paraguay', 'Uruguay', 'Guyana', 'Suriname'];
const latY = lat => P(0, lat)[1];
function band(g, name, col, k, latTop, latBot, o = {}) { if (k <= 0) return; g.save(); const y0 = latY(latTop), y1 = latY(latBot); g.beginPath(); g.rect(-4000, y0, 12000, y1 - y0); g.clip(); fillC(g, name, col, k, o); g.restore(); }
function pin3(g, lon, lat, txt, k, o = {}) { if (k <= 0) return; const [x, y, vis] = SP(lon, lat); if (!vis) return; const e = easeOutBack(clamp(k)), h = (o.h || 130) * e, col = o.col || C_RED; g.save(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h); g.stroke(); g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(x, y, 18 * e, 7 * e, 0, 0, 7); g.fill(); g.fillStyle = col; g.strokeStyle = '#fff'; g.lineWidth = 6; g.shadowColor = col; g.shadowBlur = 20; g.beginPath(); g.arc(x, y - h, 22 * e, 0, 7); g.fill(); g.stroke(); g.restore(); if (txt) label(g, txt, x, y - h - 62, o.size || 58, k, { col: o.lc }); }
function flag3(g, lon, lat, kind, k, t, s = 1) { if (k <= 0) return; const [x, y, vis] = SP(lon, lat); if (!vis) return; const e = easeOutBack(clamp(k)); g.save(); g.translate(x, y); g.scale(e * s, e * s); g.strokeStyle = K_INK; g.lineWidth = 12; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -230); g.stroke(); g.strokeStyle = '#eee'; g.lineWidth = 6; g.stroke(); flagPaint(g, kind, 2, -226, 150, 96, t); g.restore(); }
function badge(g, txt, x, y, k, col = C_RED, size = 64) { if (k <= 0) return; const e = easeOutBack(clamp(k)); g.save(); g.translate(x, y); g.scale(e, e); g.font = `800 ${size}px Anek, "Nirmala UI"`; const w = g.measureText(txt).width + 70; g.fillStyle = col; g.strokeStyle = '#fff'; g.lineWidth = 7; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 20; g.beginPath(); g.roundRect(-w / 2, -size * 0.75, w, size * 1.5, size * 0.4); g.fill(); g.shadowBlur = 0; g.stroke(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 0, 4); g.restore(); }
function xMark(g, x, y, r, k) { if (k <= 0) return; g.save(); g.strokeStyle = C_RED; g.lineWidth = 16; g.lineCap = 'round'; g.shadowColor = '#000'; g.shadowBlur = 12; const a = clamp(k * 2), c = clamp(k * 2 - 1); g.beginPath(); g.moveTo(x - r, y - r); g.lineTo(x - r + 2 * r * a, y - r + 2 * r * a); if (c > 0) { g.moveTo(x + r, y - r); g.lineTo(x + r - 2 * r * c, y - r + 2 * r * c); } g.stroke(); g.restore(); }
function bubble(g, x, y, s, k) { if (k <= 0) return; const e = easeOutBack(k); g.save(); g.translate(x, y); g.scale(s * e, s * e); g.fillStyle = '#ffffff'; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 6; g.beginPath(); g.roundRect(-150, -100, 300, 180, 40); g.moveTo(-60, 80); g.lineTo(-100, 140); g.lineTo(-10, 80); g.fill(); g.stroke(); g.fillStyle = '#ff2a4a'; for (let i = -1; i <= 1; i++) { g.beginPath(); g.arc(i * 70, -10, 18, 0, 7); g.fill(); } g.restore(); }
function boomHud(g, x, y, t, t0) { const p = clamp((t - t0) / 0.7); if (p <= 0 || p >= 1) return; g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x, y, 60 + 220 * p, 'rgba(255,160,60,A)', 0.95 * (1 - p)); g.restore(); g.fillStyle = `rgba(255,235,170,${1 - p})`; star(g, x, y, 60 + 60 * p); for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(90,80,70,${0.6 * (1 - p)})`; g.beginPath(); g.arc(x + Math.cos(i) * 90 * p, y - 40 * p + Math.sin(i * 2) * 50 * p, 30 + 40 * p, 0, 7); g.fill(); } }
const ANDES = [[-69.2, -18], [-68.6, -21], [-68.0, -23.5], [-68.6, -26], [-69.4, -28], [-70.0, -30.5], [-70.0, -32.7], [-70.3, -35], [-71.0, -38], [-71.5, -41], [-71.8, -44], [-72.5, -47], [-73.2, -50], [-72.5, -52]];
function groundLine(g, pts, k, col, lw) { if (k <= 0) return; const P2 = pts.map(([lo, la]) => P(lo, la)), n = Math.max(2, Math.round(P2.length * k)); g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; for (const [c, w] of [['rgba(0,0,0,0.5)', lw + 10], [col, lw]]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); for (let i = 0; i < n; i++) i ? g.lineTo(...P2[i]) : g.moveTo(...P2[i]); g.stroke(); } g.restore(); }
const NARROW = { la: -31.6, lo0: -71.55, lo1: -70.6 };
const REG_SA = { lon: -62, lat: -27, span: 0.36, ex: 7, borders: 0.5 };
const REG_EU = { lon: 21, lat: 42, span: 0.32, ex: 5, borders: 0.45 };
const REG_NAR = { lon: -70.9, lat: -31.6, span: 0.035, ex: 3.5, borders: 0, clouds: 0.25 };
const REG_CL = { lon: -69, lat: -38, span: 0.3, ex: 7, borders: 0.45 };
const REG_AND = { lon: -70.2, lat: -32.8, span: 0.07, ex: 4.5, borders: 0, clouds: 0.3 };
const REG_MID = { lon: -71, lat: -33.5, span: 0.13, ex: 6, borders: 0.3 };
const REG_S = { lon: -70, lat: -44, span: 0.3, ex: 6, borders: 0.4 };
const REG_N = { lon: -68.5, lat: -20.5, span: 0.17, ex: 6, borders: 0.5 };
const ODD = ['Chile', 'Norway', 'Italy', 'Vietnam', 'Indonesia', 'Gambia'], ODDN = ['চিলি', 'নরওয়ে', 'ইতালি', 'ভিয়েতনাম', 'ইন্দোনেশিয়া', 'গাম্বিয়া'], ODDC = [C_RED, C_YEL, C_ORANGE, '#36d399', C_BLUE, '#ff5ec4'];

// 0 hook: spinning globe, title
bt(0, { globe: true, cam: { lon: 10, lat: 20, dist: 3.6 }, drift: { lon: -60, lat: -38, dist: -0.38 },
  globeDraw: (g, t, lt) => globeFill(g, 'Chile', C_RED, at(t, 'দক্ষিণ আমেরিকার', 0.5, -0.6)),
  hud: (g, t, lt) => { label(g, 'চিলি কেনো এতো লম্বা?', 540, 260, 88, at(t, 0.2, 0.5), { col: C_YEL }); charWin(g, t, at(t, 'তাকিয়ে', 0.4), { think: true, x: 850, y: 1640, r: 175 }); } });
// SA terrain, Chile glows, measure + squeeze
bt('‘চিলি’', { cut: true, reg: REG_SA, cam0: { lon: -63, lat: -24, d: 2.3, tilt: 18, head: 0 }, cam: { lon: -66, lat: -32, d: 1.35, tilt: 42, head: -18 }, mv: 3.5,
  ground: (g, t) => { fillC(g, 'Chile', C_RED, at(t, '‘চিলি’', 0.6), { a: 0.85, blur: 30 }); groundLine(g, [[-77, -18], [-77, -55.5]], at(t, 'লম্বা আর', 0.9), C_YEL, 10); },
  hud: (g, t, lt) => { const [x, y] = SP(-74, -27); label(g, 'চিলি', x - 60, y - 40, 100, at(t, '‘চিলি’', 0.4, 0.15)); const [mx, my] = SP(-78, -36); label(g, 'লম্বা!', mx - 40, my, 70, at(t, 'লম্বা আর', 0.4, 0.4), { col: C_YEL, it: true });
    const kc = at(t, 'চিকন', 0.4), [cx, cy] = SP(-70.8, -34); arrow(g, cx - 280, cy, cx - 60, cy, kc, { bend: 0, lw: 13 }); arrow(g, cx + 280, cy, cx + 60, cy, kc, { bend: 0, lw: 13 }); label(g, 'চিকন!', cx, cy - 110, 70, kc, { col: C_YEL, it: true });
    charWin(g, t, 1 - at(t, 'অদ্ভুত', 0.3, 1.2), { think: true, x: 850, y: 1640, r: 175 }); } });
// 1 Europe: London -> Baghdad
bt('দেশটি লম্বায়', { cut: true, reg: REG_EU, cam0: { lon: 22, lat: 41, d: 3.9, tilt: 22, head: -6 }, cam: { lon: 22, lat: 41.5, d: 3.35, tilt: 32, head: 3 }, mv: 7,
  ground: (g, t) => { const [lx, ly] = P(-0.13, 51.5), [gx, gy] = P(44.4, 33.3); const k = ease(at(t, 'ইউরোপের ওপর', 1.4)), rot = Math.atan2(gy - ly, gx - lx) - Math.PI / 2; shapeAt(g, 'Chile', lerp((lx + gx) / 2 - 900, (lx + gx) / 2, k), lerp((ly + gy) / 2 + 900, (ly + gy) / 2, k), C_RED, clamp(k * 3), { rot: lerp(0.8, rot, k), a: 0.85 });
    const km = at(t, 'বাগদাদ', 0.8, 0.3); if (km > 0) groundLine(g, [[-0.13, 51.5], [44.4, 33.3]].map(([a, b]) => [a + 1.5, b - 1.6]), km, C_YEL, 9); },
  hud: (g, t) => { pin3(g, -0.13, 51.5, 'লন্ডন', at(t, 'লন্ডন', 0.5)); pin3(g, 44.4, 33.3, 'বাগদাদ', at(t, 'বাগদাদ', 0.5)); flag3(g, -9, 46, 'chile', at(t, 'ইউরোপের ওপর', 0.5, 0.8), t, 0.8);
    const [mx, my] = SP(24, 41); badge(g, '~৪,৩০০ কিমি', mx + 80, my + 90, at(t, 'বাগদাদ', 0.5, 0.6), '#d4a017', 58); label(g, 'ইউরোপ', 540, 250, 84, at(t, 'ইউরোপের', 0.4)); } });
// 2 narrow width (close 3D)
bt('অথচ চওড়ায়', { cut: true, reg: REG_NAR, cam0: { lon: -71.0, lat: -31.85, d: 0.95, tilt: 42, head: -10 }, cam: { lon: -71.0, lat: -31.65, d: 0.75, tilt: 55, head: 6 }, mv: 2.6,
  ground: (g, t) => { fillC(g, 'Chile', C_RED, 1, { a: 0.28, blur: 12 }); const k = at(t, '৬০ মাইলের', 0.7); if (k > 0) groundLine(g, [[NARROW.lo0 - 0.05, NARROW.la], [NARROW.lo1 + 0.05, NARROW.la]], k, C_YEL, 14); },
  hud: (g, t) => { const [x0, y0] = SP(NARROW.lo0, NARROW.la), [x1, y1] = SP(NARROW.lo1, NARROW.la); badge(g, '৬০ মাইলেরও কম!', (x0 + x1) / 2, (y0 + y1) / 2 - 150, at(t, '৬০ মাইলের', 0.5, 0.3), '#d4a017', 64); label(g, 'চওড়া?', 540, 280, 96, at(t, 'চওড়ায়', 0.4));
    const [px, py] = SP(-71.7, -31.6); label(g, 'সমুদ্র', px - 120, py, 52, at(t, 'চওড়ায়', 0.4, 0.4), { col: '#bfe6ff', it: true }); const [ax, ay] = SP(-70.3, -31.5); label(g, 'পাহাড়', ax + 140, ay, 52, at(t, 'চওড়ায়', 0.4, 0.5), { col: '#ffe9c8', it: true }); } });
// 3 why like a ribbon?
bt('কিন্তু একটি দেশের', { cut: true, reg: REG_CL, cam0: { lon: -70, lat: -33, d: 1.25, tilt: 40, head: -28 }, cam: { lon: -71, lat: -40, d: 1.15, tilt: 46, head: 18 }, mv: 3,
  ground: (g, t) => fillC(g, 'Chile', C_RED, 1, { a: 0.75 + 0.15 * Math.sin(t * 5), blur: 30 }),
  hud: (g, t) => { label(g, 'ফিতার মতো কেনো?', 540, 270, 90, at(t, 'ফিতার', 0.4), { col: C_YEL, it: true }); charWin(g, t, at(t, 'কীভাবে', 0.4), { think: true, x: 830, y: 1600, r: 190 }); } });
// 4 16th century conquest: parchment 3D + story card
bt('ষোলো শতকে', { cut: true, reg: REG_SA, cam0: { lon: -60, lat: -18, d: 2.0, tilt: 30, head: 0 }, cam: { lon: -60, lat: -22, d: 1.75, tilt: 38, head: 0 }, mv: 5, parch: () => 1,
  ground: (g, t) => { const kc = at(t, 'দখল করে', 1.0); SA.forEach((n, i) => fillC(g, n, '#9b1d1d', kc, { a: 0.6, blur: 0, sc: 'rgba(60,20,10,0.9)', lw: 3 })); },
  hud: (g, t, lt) => { label(g, 'ষোলো শতক', 540, 230, 120, at(t, 'ষোলো শতকে', 0.5), { col: '#3a1d08', sc: 'rgba(255,240,210,0.9)', font: 'Georgia, "Nirmala UI"' }); storyCard(g, 'conquest', t, t - T('ইউরোপীয়রা'), at(t, 'ইউরোপীয়রা', 0.5) * (1 - at(t, 'দখল করে', 0.35, 0.2)), { y: 900 }); badge(g, 'ইউরোপীয় দখল', 540, 1700, at(t, 'দখল করে', 0.4, 0.3), '#7a1414'); } });
// 5 independence: small Chile
bt('পরে স্পেনের', { cut: true, reg: REG_SA, cam0: { lon: -64, lat: -28, d: 1.7, tilt: 38, head: 0 }, cam: { lon: -67, lat: -31, d: 1.25, tilt: 46, head: -30 }, mv: 6,
  ground: (g, t) => { SA.forEach((n, i) => { if (n !== 'Chile') fillC(g, n, POLPAL[i % POLPAL.length], at(t, 'স্বাধীন', 0.7, i * 0.04), { a: 0.45, blur: 0, sc: 'rgba(255,255,255,0.7)', lw: 3 }); }); band(g, 'Chile', C_RED, at(t, 'চিলির আকার', 0.6), -25, -38, { a: 0.9 }); },
  hud: (g, t) => { badge(g, 'স্বাধীনতা · ১৮১৮', 540, 250, at(t, 'স্বাধীন', 0.5), '#1f5fbf', 66); flag3(g, -70.6, -33.4, 'chile', at(t, 'চিলির আকার', 0.5), t, 0.9); const [x, y] = SP(-74, -30); label(g, 'ছোট্ট চিলি', x - 40, y + 30, 64, at(t, 'বেশ ছোট', 0.4), { col: C_YEL, it: true }); charWin(g, t, at(t, 'পরে স্পেনের', 0.4, 0.5), { point: true, x: 220, y: 1650, r: 170 }); } });
// 6 wants to grow east — camera behind Chile looking east
bt('চিলি তখন চেয়েছিলো', { reg: REG_SA, cam: { lon: -68, lat: -31.5, d: 0.95, tilt: 62, head: -90 }, mv: 1.6,
  ground: (g, t) => { SA.forEach((n, i) => { if (n !== 'Chile') fillC(g, n, POLPAL[i % POLPAL.length], 1, { a: 0.45, blur: 0, sc: 'rgba(255,255,255,0.7)', lw: 3 }); }); band(g, 'Chile', C_RED, 1, -25, -38, { a: 0.9 }); },
  hud: (g, t) => { [-28.5, -31.5, -34.5].forEach((la, i) => { const [x0, y0] = SP(-71.2, la), [x1, y1] = SP(-63, la); arrow(g, x0, y0, x1, y1, at(t, 'পূর্ব দিকে', 0.8, i * 0.15), { bend: 0.08, lw: 15 }); }); label(g, 'পূর্বে বাড়বো!', 540, 300, 92, at(t, 'সীমানা বাড়াতে', 0.4), { col: C_YEL, it: true }); flag3(g, -70.6, -33.4, 'chile', 1, t, 0.9); charWin(g, t, 1, { point: true, x: 220, y: 1650, r: 170 }); } });
// 7a people look east — story card
bt('কিন্তু পূর্ব দিকে তাকাতেই', { reg: REG_SA, cam: { lon: -68, lat: -31.5, d: 0.9, tilt: 64, head: -92 }, mv: 2,
  ground: (g, t) => band(g, 'Chile', C_RED, 1, -25, -38, { a: 0.9 }),
  hud: (g, t, lt) => storyCard(g, 'andes', t, lt, at(t, 'তাকাতেই', 0.45, -0.3), { y: 880 }) });
// 7b the Andes wall in 3D (low camera from the coast looking east)
bt('পৃথিবীর দীর্ঘতম', { cut: true, reg: REG_AND, cam0: { lon: -70.75, lat: -32.85, d: 0.62, tilt: 74, head: -92, ty: 0.02 }, cam: { lon: -70.45, lat: -32.8, d: 0.5, tilt: 76, head: -90, ty: 0.04 }, mv: 6, shake: 26, shakeAt: 'দেয়ালের',
  ground: (g, t) => { band(g, 'Chile', C_RED, 0.5, -25, -38, { a: 0.3 }); groundLine(g, ANDES, at(t, 'পর্বতমালা', 1.2), '#fff4d8', 10); },
  hud: (g, t) => { label(g, 'আন্দিজ', 540, 300, 150, at(t, '‘আন্দিজ’', 0.45)); badge(g, 'পৃথিবীর দীর্ঘতম পর্বতমালা', 540, 450, at(t, 'দীর্ঘতম', 0.4), '#8a5a2b', 52);
    const kd = at(t, 'দেয়ালের', 0.35); [-33.1, -32.8, -32.5].forEach((la, i) => { const [x0, y0] = SP(-71.3, la), [x1, y1] = SP(-70.25, la); arrow(g, x0, y0, x1, y1, at(t, 'দীর্ঘতম', 0.6, i * 0.12), { bend: 0, lw: 13 }); xMark(g, x1, y1 - 20, 34, kd); });
    if (kd > 0 && kd < 1) { g.fillStyle = `rgba(255,255,255,${0.3 * (1 - kd)})`; g.fillRect(0, 0, PW, PH); } badge(g, 'দেয়াল!', 540, 1560, kd, C_RED, 90); } });
// 8 squeezed: look north along the strip
bt('একপাশে বিশাল', { cut: true, reg: REG_MID, cam0: { lon: -71.2, lat: -36.5, d: 1.0, tilt: 62, head: 0 }, cam: { lon: -71.0, lat: -34.0, d: 0.85, tilt: 66, head: 4 }, mv: 8,
  ground: (g, t) => { band(g, 'Chile', C_RED, 0.85 + 0.15 * Math.sin(t * 6), -25, -38, { a: 0.75 }); groundLine(g, ANDES, 1, '#fff4d8', 8); },
  hud: (g, t) => { const [ox, oy] = SP(-73.6, -33.5); label(g, 'প্রশান্ত মহাসাগর', ox - 40, oy, 64, at(t, 'প্রশান্ত', 0.5), { col: '#bfe6ff', it: true, rot: -0.08 }); const [ax, ay] = SP(-69.6, -33.0); label(g, 'আন্দিজ', ax + 80, ay - 60, 76, at(t, 'উঁচু পাহাড়ের', 0.4));
    const ks = at(t, 'চাপা পড়ায়', 0.5), sq = Math.sin(t * 9) * 12 * ks, [cx, cy] = SP(-71.3, -34.4); arrow(g, 60 + sq, cy + 40, cx - 90 + sq, cy, ks, { bend: 0, col: C_YEL, lw: 16 }); arrow(g, 1020 - sq, cy + 40, cx + 110 - sq, cy, ks, { bend: 0, col: C_YEL, lw: 16 });
    xMark(g, 540, 1480, 60, at(t, 'কোনো পথ', 0.5)); badge(g, 'চওড়া হওয়ার পথ নেই', 540, 1640, at(t, 'কোনো পথ', 0.4), C_RED, 58); charWin(g, t, at(t, 'চাপা পড়ায়', 0.4) * (1 - at(t, 'কোনো পথ', 0.3, -0.3)), { think: true, x: 860, y: 1300, r: 150 }); } });
// 9 grows south (fly along the coast)
bt('তাই তারা পাহাড়ের', { cut: true, reg: REG_S, cam0: { lon: -71, lat: -37, d: 1.0, tilt: 52, head: 0 }, cam: { lon: -71.5, lat: -51, d: 1.25, tilt: 46, head: -15 }, mv: 5.2, camDelay: 0.2,
  ground: (g, t) => { const kg = ease(at(t, 'দক্ষিণ দিকে', 3.6)); band(g, 'Chile', C_RED, 1, -25, lerp(-38, -56.3, kg), { a: 0.85 }); groundLine(g, ANDES, 1, '#fff4d8', 8); },
  hud: (g, t) => { const kg = ease(at(t, 'দক্ষিণ দিকে', 3.6)), [x, y] = SP(-72, lerp(-38, -55, kg)); if (kg > 0 && kg < 1) arrow(g, x, y - 160, x, y + 40, 1, { bend: 0, lw: 14 }); const ke = at(t, 'শেষ প্রান্ত', 0.5); pin3(g, -67.3, -55.9, 'মহাদেশের শেষ প্রান্ত', ke, { col: C_YEL, size: 54 }); badge(g, 'দক্ষিণে লম্বা হতে থাকলো!', 540, 270, at(t, 'লম্বা হতে', 0.4), C_RED, 56); } });
// 10 war story card -> coast captured
bt('এরপর উত্তরে', { cut: true, reg: REG_N, cam0: { lon: -68.5, lat: -19, d: 1.3, tilt: 40, head: 0 }, cam: { lon: -69, lat: -21, d: 1.15, tilt: 46, head: -10 }, mv: 6,
  ground: (g, t) => { fillC(g, 'Bolivia', C_BLUE, at(t, 'বলিভিয়া', 0.4), { a: 0.85 }); fillC(g, 'Peru', C_ORANGE, at(t, 'পেরুর', 0.4), { a: 0.85 }); band(g, 'Chile', C_RED, 1, -24.5, -60, { a: 0.85 }); const kw = at(t, 'দখল করে নিলো', 0.9);
    band(g, 'Chile', mixC(C_BLUE, C_RED, kw), at(t, 'বলিভিয়া', 0.4), -21.4, -24.5, { a: 0.9 }); band(g, 'Chile', mixC(C_ORANGE, C_RED, kw), at(t, 'পেরুর', 0.4), -17, -21.4, { a: 0.9 }); },
  hud: (g, t, lt) => { const kc = at(t, 'যুদ্ধ', 0.45, -0.5) * (1 - at(t, 'উপকূলও', 0.35, -0.2)); storyCard(g, 'war', t, lt, kc, { y: 880 }); if (kc <= 0.01) { flag3(g, -65, -17, 'bolivia', at(t, 'উপকূলও', 0.4, -0.1), t, 0.8); flag3(g, -73, -13, 'peru', at(t, 'উপকূলও', 0.4), t, 0.8); flag3(g, -70.2, -22.5, 'chile', at(t, 'দখল করে নিলো', 0.4), t, 0.9);
    const [cx, cy] = SP(-70.3, -21.5); badge(g, 'সমুদ্র উপকূল', cx - 140, cy - 260, at(t, 'উপকূলও', 0.4), '#1f5fbf', 54); const t0 = T('দখল করে নিলো'); [[-70.2, -22.6], [-70.3, -19.8], [-69.8, -23.6]].forEach(([lo, la], i) => { const [bx, by] = SP(lo, la); boomHud(g, bx, by, t, t0 + i * 0.25); }); }
    label(g, 'যুদ্ধ!', 540, 230, 130, at(t, 'যুদ্ধ', 0.4), { col: '#ff4b3a' }); } });
// 11 poor Bolivia
bt('আর সমুদ্র হারিয়ে', { reg: REG_N, cam: { lon: -66.5, lat: -18.5, d: 1.0, tilt: 50, head: 15 }, mv: 2,
  ground: (g, t) => { fillC(g, 'Bolivia', C_BLUE, 1, { a: 0.7 + 0.15 * Math.sin(t * 4) }); fillC(g, 'Peru', C_ORANGE, 1, { a: 0.7 }); fillC(g, 'Chile', C_RED, 1, { a: 0.85 }); },
  hud: (g, t, lt) => { storyCard(g, 'bolivia', t, lt, at(t, 'বেচারা', 0.45, -0.3), { y: 860 }); label(g, 'আমার সমুদ্র কই?', 540, 200, 84, at(t, 'খুঁজে', 0.4), { col: '#bfe0ff' }); charWin(g, t, at(t, 'হারিয়ে', 0.4), { point: true, x: 860, y: 1660, r: 160 }); } });
// 12 which country is weirdest? globe tour
bt('ম্যাপের কোন দেশটির', { cut: true, globe: true, cam: { lon: -40, lat: 10, dist: 3.4 }, drift: { lon: 110, lat: 10, dist: 0 },
  globeDraw: (g, t) => ODD.forEach((n, i) => globeFill(g, n, ODDC[i], at(t, 'কোন দেশটির', 0.4, i * 0.25))),
  hud: (g, t) => { ODD.forEach((n, i) => { const [cx, cy] = centroidN(n), lon = cx * 360 - 180, lat = invMy(cy), [x, y, vis] = GP(lon, lat); if (vis) { const k = at(t, 'কোন দেশটির', 0.4, i * 0.25); if (k > 0) { g.save(); g.strokeStyle = ODDC[i]; g.lineWidth = 7; g.globalAlpha = k; g.shadowColor = ODDC[i]; g.shadowBlur = 20; g.beginPath(); g.arc(x, y, 40 + 6 * Math.sin(t * 5 + i), 0, 7); g.stroke(); g.restore(); label(g, ODDN[i], x, y - 74, 46, k, { col: ODDC[i] }); } } });
    label(g, 'কোন দেশটা সবচেয়ে অদ্ভুত?', 540, 250, 74, at(t, 'সবচেয়ে অদ্ভুত', 0.4), { col: C_YEL }); charWin(g, t, at(t, 'ম্যাপের কোন', 0.4), { point: true, x: 230, y: 1640, r: 175 }); } });
bt('কমেন্ট করে', { globe: true, cam: { lon: 70, lat: 18, dist: 3.4 }, mv: 2.4,
  globeDraw: (g, t) => ODD.forEach((n, i) => globeFill(g, n, ODDC[i], 1)),
  hud: (g, t) => { bubble(g, 780, 1330, 1.1, at(t, 'কমেন্ট', 0.4)); badge(g, 'কমেন্টে জানান!', 540, 260, at(t, 'কমেন্ট', 0.4), C_RED, 80); charWin(g, t, 1, { wave: true, x: 300, y: 1600, r: 210 }); } });

// ---------------- SFX cues ----------------
sx('wave', 'দক্ষিণ আমেরিকার', -0.3); sx('marker', 'লম্বা আর'); sx('swish', 'চিকন'); sx('swish', 'ইউরোপের ওপর', 0.1); sx('marker', 'বাগদাদ', 0.3); sx('marker', '৬০ মাইলের');
sx('wave', 'ইউরোপীয়রা', -0.2); sx('swish', 'সরিয়ে'); sx('boom', 'দখল করে'); sx('ding', 'স্বাধীন'); sx('marker', 'পূর্ব দিকে'); sx('swish', 'তাকাতেই'); sx('thud', 'দেয়ালের'); sx('swish', 'পর্বতমালা');
sx('wave', 'প্রশান্ত', -0.3); sx('marker', 'চাপা পড়ায়'); sx('swish', 'দক্ষিণ দিকে'); sx('marker', 'শেষ প্রান্ত'); sx('boom', 'যুদ্ধ'); sx('boom', 'দখল করে নিলো', 0.25); sx('swish', 'বেচারা'); sx('ding', 'খুঁজে'); sx('ding', 'কমেন্ট');
