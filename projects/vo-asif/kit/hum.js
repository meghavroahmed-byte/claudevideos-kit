// ===== "Lost Humans" 16:9 MG templates (v2 Ice & Ember house style, extended) =====
const SECC = { ice: CC.ice, ember: CC.ember2, gold: '#ffc04a', violet: '#c9a2ff', jungle: '#7dffb0', teal: '#6ff5e6', red: CC.red, dark: CC.ice };
let SECNOW = { mode: 'ice', label: '' };
const colOf = o => o.col || SECC[o.mode || SECNOW.mode] || CC.ice;
const rgbOf = c => hex2rgb(c).join(',');
window.SFXL = window.SFXL || new Set();
const sfx = (time, kind) => SFXL.add(kind + '@' + time.toFixed(2));
// entrance: by anchor string or by delay after beat start
function ent(t, b, a, delay = 0, d = 0.38, cap) { if (a) { let ta = Math.min(T(a), b.t0 + (cap != null ? cap : delay + 1.2)); POPS.add(+ta.toFixed(2)); return easeOutBack(seg(t, ta, ta + d)); } const st = b.t0 + delay; POPS.add(+st.toFixed(2)); return easeOutBack(seg(t, st, st + d)); }
function entS(t, b, a, delay = 0, d = 0.6, cap) { if (a) { const ta = Math.min(T(a), b.t0 + (cap != null ? cap : delay + 1.6)); return ease(seg(t, ta, ta + d)); } return ease(seg(t, b.t0 + delay, b.t0 + delay + d)); }
function fit(g, s, maxW, base) { g.save(); g.font = fontPx(base); const w = g.measureText(s).width; g.restore(); return w > maxW ? Math.floor(base * maxW / w) : base; }
function deco(g, t, b, o) {
  const col = colOf(o); bgMG(g, t, o.mode || SECNOW.mode, { floor: o.floor, np: o.np });
  corners(g, 34, 34, PW - 68, PH - 68, col, 0.32, 46, 3);
  if (o.chip) chip(g, o.chip, 70, 82, col, 28, entS(t, b, null, 0.05, 0.3), 'left');
  if (b.sec) { g.save(); g.globalAlpha = 0.55; g.font = 'bold 22px Consolas, "Nirmala UI"'; g.fillStyle = col; g.textAlign = 'right'; g.fillText(b.sec, PW - 70, PH - 58); g.fillRect(PW - 70 - g.measureText(b.sec).width, PH - 48, g.measureText(b.sec).width * (0.5 + 0.5 * Math.sin(t * 0.7)), 2); g.restore(); }
}
function word(g, o, s, x, y, size, k, col, style) {
  if (!s || k <= 0) return; const st = style || o.style || 'slam';
  if (st === 'glitch') glitchText(g, s, x, y, size, k, col); else if (st === 'hl') hlText(g, s, x, y, size, k, CC.ink, col); else if (st === 'title') title(g, s, x, y, k, size, col); else slam(g, s, x, y, size, k, col);
}
function xMarkMG(g, x, y, r, k) { if (k <= 0) return; g.save(); g.strokeStyle = CC.red; g.lineWidth = 12; g.lineCap = 'round'; g.shadowColor = CC.red; g.shadowBlur = 20; const a = clamp(k * 2), c = clamp(k * 2 - 1); g.beginPath(); g.moveTo(x - r, y - r); g.lineTo(x - r + 2 * r * a, y - r + 2 * r * a); if (c > 0) { g.moveTo(x + r, y - r); g.lineTo(x + r - 2 * r * c, y - r + 2 * r * c); } g.stroke(); g.restore(); }
function checkMG(g, x, y, r, k, col = CC.green) { if (k <= 0) return; g.save(); g.strokeStyle = col; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = col; g.shadowBlur = 20; const p = [[x - r, y], [x - r * 0.3, y + r * 0.7], [x + r, y - r * 0.7]]; const a = clamp(k * 2), c = clamp(k * 2 - 1); g.beginPath(); g.moveTo(p[0][0], p[0][1]); g.lineTo(lerp(p[0][0], p[1][0], a), lerp(p[0][1], p[1][1], a)); if (c > 0) g.lineTo(lerp(p[1][0], p[2][0], c), lerp(p[1][1], p[2][1], c)); g.stroke(); g.restore(); }

// ---------- extra line-art icons ----------
const sinPts = (x0, x1, amp, f, ph, y0 = 0, n = 40) => { const o = []; for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n); o.push([x, y0 + amp * Math.sin(x * f + ph)]); } return o; };
Object.assign(ICONS, {
  cat: () => [[[-72, -10], [-82, -100], [-30, -62], [30, -62], [82, -100], [72, -10]].concat(pc(0, -10, 72, 0, Math.PI, 20, 70)), pc(-28, -12, 9, 0, PI2, 10), pc(28, -12, 9, 0, PI2, 10), [[-8, 18], [8, 18], [0, 28], [-8, 18]], L2(-20, 30, -100, 18), L2(-20, 38, -100, 48), L2(20, 30, 100, 18), L2(20, 38, 100, 48)],
  skull: () => [pc(0, -20, 85, Math.PI * 0.8, Math.PI * 2.2, 40).concat([[50, 60], [45, 95], [-45, 95], [-50, 60], [-69, 30]]), pc(-32, 8, 20, 0, PI2, 16), pc(32, 8, 20, 0, PI2, 16), [[0, 34], [-10, 56], [10, 56], [0, 34]], L2(-22, 80, -22, 95), L2(0, 80, 0, 95), L2(22, 80, 22, 95)],
  dna: () => { const o = [sinPts(-115, 115, 52, 0.034, 0), sinPts(-115, 115, 52, 0.034, Math.PI)]; for (let x = -105; x <= 105; x += 21) { const y = 52 * Math.sin(x * 0.034); o.push(L2(x, y, x, -y)); } return o; },
  bone: () => [L2(-62, -13, 62, -13), L2(-62, 13, 62, 13), pc(-76, -20, 20, Math.PI * 0.1, Math.PI * 1.6, 14), pc(-76, 20, 20, Math.PI * 0.4, Math.PI * 1.9, 14), pc(76, -20, 20, -Math.PI * 0.6, Math.PI * 0.9, 14), pc(76, 20, 20, -Math.PI * 0.9, Math.PI * 0.6, 14)],
  finger: () => [pc(0, -72, 17, 0, PI2, 20, 30), pc(0, -8, 20, 0, PI2, 20, 30), pc(0, 60, 23, 0, PI2, 20, 32)],
  brain: () => { const o = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * PI2, r = 1 + 0.07 * Math.sin(a * 9); o.push([Math.cos(a) * 112 * r, Math.sin(a) * 82 * r]); } return [o, pb([0, -80], [-14, -30], [14, 20], [0, 80]), pb([-90, -20], [-60, -50], [-40, 0], [-20, -30]), pb([90, -10], [60, -50], [40, 10], [20, -20]), pb([-80, 40], [-50, 20], [-40, 60], [-20, 40]), pb([75, 45], [50, 20], [40, 60], [20, 45])]; },
  axe: () => [pb([0, -112], [74, -60], [70, 64], [0, 106]).concat(pb([0, 106], [-70, 64], [-74, -60], [0, -112])), L2(0, -112, -18, 0), L2(-18, 0, 0, 106), L2(-18, 0, 46, -42), L2(-18, 0, 42, 50), L2(-18, 0, -56, -40)],
  foot: () => [pc(0, 30, 44, 0, PI2, 30, 74), pc(-30, -62, 13, 0, PI2, 10), pc(-6, -74, 12, 0, PI2, 10), [ ...pc(15, -72, 10, 0, PI2, 10)], pc(33, -63, 9, 0, PI2, 10), pc(47, -49, 8, 0, PI2, 10)],
  island: () => [sinPts(-120, 120, 6, 0.08, 0, 72), sinPts(-100, 100, 5, 0.09, 1, 92), pb([-95, 62], [-60, 4], [60, 4], [95, 62]), pb([10, 14], [20, -40], [30, -70], [24, -100]), pb([24, -100], [60, -112], [82, -92], [92, -70]), pb([24, -100], [-12, -116], [-38, -100], [-48, -78]), pb([24, -100], [40, -132], [70, -132], [86, -120])],
  tree: () => [L2(0, 110, 0, 20), [[0, 20], [-70, -40], [-96, -96]], [[0, 20], [72, -30], [104, -82]], [[0, -10], [0, -110]], [[-70, -40], [-40, -96]], [[72, -30], [44, -92]], pc(-96, -96, 14, 0, PI2, 12), pc(104, -82, 14, 0, PI2, 12), pc(0, -110, 16, 0, PI2, 12), pc(-40, -96, 12, 0, PI2, 12), pc(44, -92, 12, 0, PI2, 12)],
  people: () => { const o = []; for (const [x, s] of [[-78, 0.8], [78, 0.8], [0, 1]]) { o.push(pc(x, -40 * s - 10, 24 * s, 0, PI2, 16)); o.push(pb([x - 48 * s, 70], [x - 48 * s, 6 * s], [x + 48 * s, 6 * s], [x + 48 * s, 70])); } return o; },
  pyramid: () => [[[-115, 85], [0, -95], [115, 85], [-115, 85]], L2(0, -95, 34, 85), L2(-75, 25, 85, 25), L2(-40, -30, 48, -30)],
  city: () => [[[-112, 92], [-112, -20], [-62, -20], [-62, 92]], [[-62, 92], [-62, -84], [-12, -84], [-12, 92]], [[-12, 92], [-12, 0], [40, 0], [40, 92]], [[40, 92], [40, -112], [96, -112], [96, 92]], L2(-125, 92, 125, 92), L2(68, -112, 68, -140), ...[-50, -20, 10].map(y => L2(-48, y, -26, y)), ...[-80, -50, -20, 10, 40].map(y => L2(56, y, 80, y))],
  net: () => { const N = [[-92, -58], [0, -92], [92, -50], [-62, 44], [64, 52], [0, -4]], o = []; [[0, 1], [1, 2], [0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [3, 4], [0, 3], [2, 4]].forEach(([a, b]) => o.push(L2(N[a][0], N[a][1], N[b][0], N[b][1]))); N.forEach(([x, y]) => o.push(pc(x, y, 14, 0, PI2, 12))); return o; },
  mountain: () => [[[-122, 92], [-52, -40], [-12, 8], [40, -92], [122, 92]], [[18, -50], [40, -92], [62, -50], [50, -56], [40, -44], [28, -56], [18, -50]]],
  lungs: () => [L2(0, -104, 0, -30), [[-26, -8], [0, -30], [26, -8]], pb([-14, -46], [-96, -66], [-116, 92], [-22, 82]).concat([[-14, -46]]), pb([14, -46], [96, -66], [116, 92], [22, 82]).concat([[14, -46]])],
  heart: () => [pb([0, -40], [0, -92], [-92, -92], [-92, -30]).concat(pb([-92, -30], [-92, 20], [-20, 50], [0, 92])).concat(pb([0, 92], [20, 50], [92, 20], [92, -30])).concat(pb([92, -30], [92, -92], [0, -92], [0, -40]))],
  flower: () => { const o = []; for (let i = 0; i < 6; i++) { const a = i / 6 * PI2; o.push(pc(Math.cos(a) * 34, -40 + Math.sin(a) * 34, 22, 0, PI2, 16)); } o.push(pc(0, -40, 13, 0, PI2, 12), pb([0, -8], [12, 30], [-12, 60], [0, 104]), pb([0, 56], [30, 34], [52, 44], [2, 66])); return o; },
  grave: () => [[[-62, 92], [-62, -40]].concat(pc(0, -40, 62, Math.PI, PI2, 20)).concat([[62, 92]]), L2(-110, 92, 110, 92), L2(0, -60, 0, 20), L2(-28, -30, 28, -30)],
  tooth: () => [pb([-50, -60], [-62, -112], [-10, -96], [0, -82]).concat(pb([0, -82], [10, -96], [62, -112], [50, -60])).concat(pb([50, -60], [46, 20], [40, 70], [24, 104])).concat(pb([24, 104], [10, 70], [-10, 70], [-24, 104])).concat(pb([-24, 104], [-40, 70], [-46, 20], [-50, -60]))],
  jaw: () => [pb([-104, -64], [-96, 92], [96, 92], [104, -64]), pb([-62, -64], [-58, 44], [58, 44], [62, -64]), ...[-80, -56, -28, 0, 28, 56, 80].map((x, i) => { const y = i === 0 || i === 6 ? -10 : 52 - Math.abs(x) * 0.1; return L2(x * 0.78, y, x * 0.92, y + 18); })],
  ruler: () => [[[-120, -32], [120, -32], [120, 32], [-120, 32], [-120, -32]], ...Array.from({ length: 11 }, (_, i) => L2(-110 + i * 22, -32, -110 + i * 22, i % 5 ? -14 : 2))],
  elephant: () => [pc(-8, 0, 80, 0, PI2, 30, 54), pc(78, -30, 40, 0, PI2, 22), pb([110, -16], [132, 22], [122, 62], [104, 72]), L2(-52, 44, -52, 96), L2(-16, 52, -16, 96), L2(22, 52, 22, 96), L2(54, 44, 54, 96), pc(66, -26, 20, 0, PI2, 16, 30), pb([96, 2], [114, 16], [126, 10], [132, 0])],
  lizard: () => [pb([-125, 18], [-60, -14], [0, 26], [60, -2]).concat(pb([60, -2], [90, -18], [112, -12], [130, 0])), pb([-125, 18], [-60, 16], [0, 50], [60, 24]).concat([[96, 16], [130, 0]]), [[-30, 30], [-50, 66], [-64, 70]], [[0, 40], [16, 72], [30, 74]], [[40, 30], [24, 62], [10, 66]], [[70, 20], [90, 52], [104, 54]], pc(108, -6, 4, 0, PI2, 8), [[130, 0], [146, -6], [154, -14]], [[146, -6], [156, 2]]],
  bird: () => [pc(-14, -16, 52, 0, PI2, 24, 28), pb([28, -30], [50, -62], [42, -92], [56, -106]), pc(62, -108, 12, 0, PI2, 12), L2(72, -108, 126, -88), L2(-14, 8, -20, 104), L2(4, 8, 10, 104), [[-20, 104], [-36, 110]], [[10, 104], [26, 110]], L2(-62, -22, -96, -2)],
  volcano: () => [[[-122, 92], [-36, -50], [36, -50], [122, 92]], L2(-36, -50, 36, -50), pc(4, -80, 18, 0, PI2, 14), pc(26, -106, 24, 0, PI2, 16), pc(-8, -132, 28, 0, PI2, 18)],
  swords: () => [L2(-92, 92, 82, -82), L2(92, 92, -82, -82), L2(-70, 36, -36, 70), L2(70, 36, 36, 70), [[82, -82], [96, -100], [72, -92]], [[-82, -82], [-96, -100], [-72, -92]]],
  dice: () => [[[-80, -80], [80, -80], [80, 80], [-80, 80], [-80, -80]], pc(-40, -40, 12, 0, PI2, 10), pc(40, 40, 12, 0, PI2, 10), pc(0, 0, 12, 0, PI2, 10), pc(40, -40, 12, 0, PI2, 10), pc(-40, 40, 12, 0, PI2, 10)],
  book: () => [pb([0, -70], [-40, -92], [-90, -86], [-112, -70]).concat([[-112, 80]]).concat(pb([-112, 80], [-80, 66], [-40, 70], [0, 90])), pb([0, -70], [40, -92], [90, -86], [112, -70]).concat([[112, 80]]).concat(pb([112, 80], [80, 66], [40, 70], [0, 90])), L2(0, -70, 0, 90), L2(-90, -40, -24, -36), L2(-90, -6, -24, -2), L2(24, -36, 90, -40), L2(24, -2, 90, -6)],
  flask: () => [[[-24, -104], [-24, -30], [-92, 82], [92, 82], [24, -30], [24, -104]], L2(-36, -104, 36, -104), L2(-62, 32, 62, 32), pc(-20, 56, 9, 0, PI2, 10), pc(16, 46, 6, 0, PI2, 10), pc(30, 64, 8, 0, PI2, 10)],
  micro: () => [L2(-82, 96, 82, 96), pb([44, 96], [96, 40], [66, -40], [14, -62]), [[-34, -104], [8, -114], [30, -30], [-12, -20], [-34, -104]], L2(-64, 30, 44, 30), L2(-14, -20, -4, 14), pc(-40, -112, 12, 0, PI2, 10)],
  wave: () => [sinPts(-120, 120, 16, 0.05, 0, -40), sinPts(-120, 120, 16, 0.05, 1.2, 10), sinPts(-120, 120, 16, 0.05, 2.4, 60)],
  check: () => [[[-70, 0], [-20, 56], [80, -64]]],
  warn: () => [[[0, -104], [112, 92], [-112, 92], [0, -104]], L2(0, -40, 0, 30), pc(0, 60, 8, 0, PI2, 10)],
  crown: () => [[[-96, 62], [-106, -52], [-52, 2], [0, -84], [52, 2], [106, -52], [96, 62], [-96, 62]], L2(-96, 86, 96, 86), pc(0, -84, 10, 0, PI2, 10)],
  page: () => [[[-78, -108], [78, -108], [78, 108], [-78, 108], [-78, -108]], ...[-76, -48, -20, 8, 36].map(y => L2(-54, y, 54, y)), L2(-54, 76, 0, 76), L2(-54, 92, -10, 92)],
  couple: () => [pc(-58, -56, 24, 0, PI2, 16), pb([-104, 92], [-104, -10], [-12, -10], [-12, 92]), pc(58, -56, 24, 0, PI2, 16), pb([12, 92], [12, -10], [104, -10], [104, 92]), pb([0, -66], [0, -86], [-26, -86], [-26, -68]).concat(pb([-26, -68], [-26, -54], [-6, -44], [0, -34])).concat(pb([0, -34], [6, -44], [26, -54], [26, -68])).concat(pb([26, -68], [26, -86], [0, -86], [0, -66]))],
  trade: () => [pb([-90, -20], [-70, -90], [70, -90], [90, -20]), [[70, -38], [90, -20], [104, -44]], pb([90, 20], [70, 90], [-70, 90], [-90, 20]), [[-70, 38], [-90, 20], [-104, 44]]],
  needle: () => [L2(-100, 100, 82, -82), pc(88, -88, 12, 0, PI2, 12, 7), pb([88, -88], [140, -40], [20, 40], [-40, -20])],
  eye: () => [pb([-112, 0], [-50, -64], [50, -64], [112, 0]).concat(pb([112, 0], [50, 64], [-50, 64], [-112, 0])), pc(0, 0, 32, 0, PI2, 20), pc(0, 0, 11, 0, PI2, 10)],
  run: () => [pc(22, -84, 17, 0, PI2, 14), L2(16, -62, -6, 12), [[-40, -50], [8, -46], [52, -18]], [[-56, 72], [-24, 42], [-6, 12], [32, 44], [22, 96]]],
  monkey: () => [L2(-118, -96, 118, -96), [[-24, -96], [-16, -36]], [[24, -96], [16, -36]], pc(0, -26, 20, 0, PI2, 14), pc(0, 24, 30, 0, PI2, 18, 40), [[-16, 58], [-30, 100]], [[16, 58], [30, 100]], pb([24, 40], [70, 40], [70, 90], [50, 96])],
  o2: () => [pc(-34, 6, 42, 0, PI2, 28), pc(44, -26, 26, 0, PI2, 20), pc(36, 58, 18, 0, PI2, 16)],
  drop: () => [pb([0, -104], [30, -44], [72, 0], [72, 40]).concat(pb([72, 40], [72, 96], [-72, 96], [-72, 40])).concat(pb([-72, 40], [-72, 0], [-30, -44], [0, -104]))],
  palm: () => [pb([0, 104], [14, 40], [24, -20], [16, -70]), pb([16, -70], [60, -86], [90, -64], [104, -38]), pb([16, -70], [-26, -90], [-62, -72], [-80, -44]), pb([16, -70], [36, -110], [76, -112], [96, -98]), pb([16, -70], [-6, -112], [-44, -116], [-64, -104])],
  map: () => [[[-110, -70], [-40, -92], [40, -70], [110, -92], [110, 72], [40, 94], [-40, 72], [-110, 94], [-110, -70]], L2(-40, -92, -40, 72), L2(40, -70, 40, 94)],
  pin: () => [pb([0, 100], [-80, 0], [-70, -100], [0, -100]).concat(pb([0, -100], [70, -100], [80, 0], [0, 100])), pc(0, -40, 26, 0, PI2, 16)],
  arrows: () => [[[-110, 0], [90, 0]], [[60, -30], [96, 0], [60, 30]], [[-110, -60], [40, -60]], [[16, -82], [44, -60], [16, -38]], [[-110, 60], [40, 60]], [[16, 38], [44, 60], [16, 82]]],
  stairs: () => [[[-110, 96], [-110, 50], [-56, 50], [-56, 4], [-2, 4], [-2, -42], [52, -42], [52, -88], [106, -88]]],
});

// ---------- glowing humanoid silhouette (for compares) ----------
function silFig(g, x, y, h, col, k, wf = 1, o = {}) {
  if (k <= 0) return; const s = h / 400, e = easeOutBack(clamp(k)); g.save(); g.translate(x, y); g.scale(s * wf * e, s * e); g.lineCap = 'round'; g.lineJoin = 'round';
  const pth = () => { g.beginPath(); g.arc(0, -350, 42, 0, 7); g.moveTo(-58, -290); g.quadraticCurveTo(-70, -200, -48, -160); g.lineTo(48, -160); g.quadraticCurveTo(70, -200, 58, -290); g.closePath(); };
  const limbs = [[[-62, -280], [-82, -200], [-86, -130]], [[62, -280], [82, -200], [86, -130]], [[-28, -160], [-34, -80], [-36, 0]], [[28, -160], [34, -80], [36, 0]]];
  const stroke = (w, c, blur) => { g.strokeStyle = c; g.shadowColor = col; g.shadowBlur = blur; g.lineWidth = w / s; for (const L of limbs) { g.beginPath(); L.forEach(([a, b2], i) => i ? g.lineTo(a, b2) : g.moveTo(a, b2)); g.stroke(); } };
  g.fillStyle = `rgba(${rgbOf(col)},0.22)`; pth(); g.fill(); stroke(30 * s * (o.thick || 1), `rgba(${rgbOf(col)},0.35)`, 0);
  g.strokeStyle = col; g.lineWidth = 4 / s; g.shadowColor = col; g.shadowBlur = 18; pth(); g.stroke(); stroke(5 * s, col, 18);
  g.restore();
}
// ---------- worldIn scenes (1920x1080 world space) ----------
function acacia(c, x, y, s, col = '#2a1a10') { c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = 16; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-10, -90, 10, -170); c.moveTo(4, -110); c.quadraticCurveTo(50, -150, 90, -175); c.moveTo(2, -120); c.quadraticCurveTo(-50, -150, -80, -172); c.stroke(); c.fillStyle = col; for (const [dx, w] of [[-80, 110], [10, 150], [95, 100]]) { c.beginPath(); c.ellipse(dx, -190, w, 30, 0, 0, 7); c.fill(); } c.restore(); }
function savanna(c, t, o = {}) {
  const pan = o.pan || 0, hz = 640;
  const sky = c.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#40285a'); sky.addColorStop(0.55, '#e0804a'); sky.addColorStop(1, '#ffd08a'); c.fillStyle = sky; c.fillRect(-200, -200, W + 400, H + 400);
  glow(c, 1380, hz - 40, 520, 'rgba(255,220,150,A)', 0.55); c.fillStyle = '#fff0c8'; c.beginPath(); c.arc(1380, hz - 40, 70, 0, 7); c.fill();
  ridge(c, hz + 10, 130, 0.003, 7, pan * 0.1, '#9a5a52'); ridge(c, hz + 60, 60, 0.006, 11, pan * 0.25, '#7a4630');
  const gr = c.createLinearGradient(0, hz + 50, 0, H); gr.addColorStop(0, '#c08a40'); gr.addColorStop(1, '#6a4420'); c.fillStyle = gr; c.fillRect(-200, hz + 50, W + 400, H);
  for (let i = -1; i < 7; i++) { const k = i + Math.floor(pan * 0.4 / 380); const x = i * 380 - ((pan * 0.4) % 380) + hash(k) * 120; if (hash(k * 3) < 0.35) continue; acacia(c, x, hz + 80 + hash(k + 1) * 30, 0.7 + hash(k + 2) * 0.5, '#3a2014'); }
  c.strokeStyle = 'rgba(60,34,12,0.45)'; c.lineWidth = 3; for (let i = 0; i < 120; i++) { const x = ((hash(i) * W - pan * 1.1) % W + W) % W, y = hz + 120 + hash(i + 3) * (H - hz - 120), h = 14 + hash(i + 5) * 26, sw = Math.sin(t * 2 + i) * 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + sw, y - h); c.stroke(); }
  dust(c, t, '255,220,160', 0.5);
}
function jungle(c, t, o = {}) {
  const pan = o.pan || 0, hz = 600;
  const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#a8d8c0'); sky.addColorStop(0.5, '#4a8a6a'); sky.addColorStop(1, '#0e2a1c'); c.fillStyle = sky; c.fillRect(-200, -200, W + 400, H + 400);
  ridge(c, hz, 180, 0.004, 3, pan * 0.1, '#3a7a5a'); ridge(c, hz + 120, 140, 0.006, 9, pan * 0.25, '#24583e');
  for (let L = 0; L < 3; L++) { const cols = ['#2e6a48', '#1c4a30', '#0e2a1a'][L]; for (let i = -1; i < 9; i++) { const k = i + L * 50; const x = i * 250 - ((pan * (0.3 + L * 0.3)) % 250) + hash(k) * 100; palm(c, x, H - 120 + L * 60 + hash(k + 1) * 40, 380 + L * 120 + hash(k + 2) * 120, cols, t, k); } }
  for (let i = 0; i < 14; i++) fern(c, (i * 160 - pan * 1.2 % 160 + W) % (W + 200) - 100, H + 10, 1.6 + hash(i) * 0.8, '#0a2014', t, i);
  c.save(); c.globalCompositeOperation = 'screen'; for (let i = 0; i < 4; i++) { const x = 300 + i * 420 + Math.sin(t * 0.2 + i) * 40; const sg = c.createLinearGradient(x, 0, x + 200, H); sg.addColorStop(0, 'rgba(220,255,200,0.22)'); sg.addColorStop(1, 'rgba(220,255,200,0)'); c.fillStyle = sg; c.beginPath(); c.moveTo(x, -50); c.lineTo(x + 80, -50); c.lineTo(x + 380, H); c.lineTo(x + 160, H); c.fill(); } c.restore();
  c.fillStyle = 'rgba(200,240,220,0.18)'; c.fillRect(-200, hz - 40, W + 400, 200);
}
function islandScene(c, t, o = {}) {
  const sea = o.sea || 0, w = lerp(1.0, 0.55, sea), hz = 520;
  const sky = c.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, o.dusk ? '#2a1a40' : '#4a90c8'); sky.addColorStop(1, o.dusk ? '#e08a5a' : '#cfeaf5'); c.fillStyle = sky; c.fillRect(-200, -200, W + 400, H + 400);
  for (let i = 0; i < 5; i++) cloud(c, ((hash(i) * W + t * 8) % (W + 300)) - 150, 120 + hash(i + 2) * 200, 1.2 + hash(i + 3), 0.55);
  if (o.volcano) volcano(c, 1250, hz + 40, 1.1, '#4a3a40', t, 0.7);
  const sg = c.createLinearGradient(0, hz, 0, H); sg.addColorStop(0, '#2a8ab0'); sg.addColorStop(1, '#063a5a'); c.fillStyle = sg; c.fillRect(-200, hz, W + 400, H);
  const cx = o.cx || 860, iy = hz + 240; c.fillStyle = '#e8d098'; c.beginPath(); c.ellipse(cx, iy, 720 * w, 150 * w, 0, Math.PI, 0); c.fill(); c.fillStyle = '#3a8a4a'; c.beginPath(); c.ellipse(cx, iy - 10, 600 * w, 130 * w, 0, Math.PI, 0); c.fill();
  for (let i = 0; i < 7; i++) { const x = cx + (i - 3) * 150 * w; palm(c, x, iy - 30 * w - hash(i) * 20, (220 + hash(i + 1) * 120) * w, '#1e4a2a', t, i); }
  c.fillStyle = 'rgba(42,138,176,0.75)'; c.fillRect(-200, iy - 6 + (1 - w) * 0, W + 400, H);
  c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 4; for (let j = 0; j < 8; j++) { const y = iy + 20 + j * 50; c.beginPath(); for (let x = -50; x <= W + 50; x += 20) { const yy = y + Math.sin(x * 0.02 + t * 2 + j) * 6; x === -50 ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.globalAlpha = 0.5 - j * 0.05; c.stroke(); } c.globalAlpha = 1;
}
function digSite(c, t, o = {}) {
  const cols = ['#5a3a24', '#6e4a2c', '#4a3020', '#7a5634', '#3e281a', '#5e4028']; let y = -40;
  cols.forEach((cl, i) => { c.fillStyle = cl; c.beginPath(); c.moveTo(-200, H + 200); c.lineTo(-200, y); for (let x = -200; x <= W + 200; x += 30) c.lineTo(x, y + noise(x * 0.004 + i * 7) * 30); c.lineTo(W + 200, H + 200); c.fill(); y += 160 + hash(i) * 60; });
  for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(${150 + hash(i) * 60},${130 + hash(i + 1) * 50},${110},0.5)`; c.beginPath(); c.ellipse(hash(i + 3) * W, hash(i + 4) * H, 6 + hash(i + 5) * 20, 4 + hash(i + 6) * 12, hash(i) * 3, 0, 7); c.fill(); }
  const fx = o.fx || 960, fy = o.fy || 620; c.fillStyle = 'rgba(20,10,4,0.55)'; c.beginPath(); c.ellipse(fx, fy, 320, 150, 0, 0, 7); c.fill();
  c.save(); c.globalCompositeOperation = 'screen'; const bm = c.createLinearGradient(fx, -100, fx, fy); bm.addColorStop(0, 'rgba(255,240,200,0)'); bm.addColorStop(1, 'rgba(255,230,170,0.35)'); c.fillStyle = bm; c.beginPath(); c.moveTo(fx - 80, -100); c.lineTo(fx + 80, -100); c.lineTo(fx + 260, fy + 60); c.lineTo(fx - 260, fy + 60); c.fill(); glow(c, fx, fy, 260, 'rgba(255,220,150,A)', 0.5 + 0.1 * Math.sin(t * 3)); c.restore();
  c.save(); c.translate(fx, fy); c.rotate(-0.4); const it = o.item || 'finger';
  if (it === 'finger') { for (const [yy, rx, ry] of [[-34, 10, 18], [0, 12, 18], [36, 13, 20]]) { c.beginPath(); c.ellipse(0, yy, rx, ry, 0, 0, 7); c.fillStyle = BONE; c.fill(); c.strokeStyle = '#6b5a3a'; c.lineWidth = 3; c.stroke(); } }
  else if (it === 'skull') { c.scale(1.4, 1.4); c.fillStyle = BONE; c.beginPath(); c.arc(0, -10, 60, Math.PI * 0.85, Math.PI * 2.15); c.lineTo(36, 50); c.lineTo(-36, 50); c.closePath(); c.fill(); c.fillStyle = '#2a1a10'; c.beginPath(); c.arc(-22, 4, 14, 0, 7); c.arc(22, 4, 14, 0, 7); c.fill(); }
  else { c.fillStyle = BONE; c.beginPath(); c.moveTo(-80, -20); c.quadraticCurveTo(-70, 50, 0, 50); c.quadraticCurveTo(70, 50, 80, -20); c.lineTo(60, -20); c.quadraticCurveTo(50, 28, 0, 28); c.quadraticCurveTo(-50, 28, -60, -20); c.closePath(); c.fill(); c.fillStyle = '#fffbe8'; for (let i = 0; i < 6; i++) c.fillRect(-50 + i * 18, 18, 10, 12); }
  c.restore();
  for (let i = 0; i < 18; i++) { const life = (t * 0.5 + i / 18) % 1; c.fillStyle = `rgba(200,170,130,${0.5 * (1 - life)})`; c.beginPath(); c.arc(fx + (hash(i) - 0.5) * 400, fy - life * 300, 3 + hash(i + 1) * 4, 0, 7); c.fill(); }
}
function bgWorld(c, t, mode) { bgMG(c, t, mode, { floor: true }); }
// species "people" presets on top of person()
const SPP = {
  erectus: { skin: '#9a6440', coat: '#7a5232' }, nean: { skin: '#c48a64', coat: '#6a4a30', fur: '#d8c8a8' }, deni: { skin: '#a8724c', coat: '#5a4a5a' }, flores: { skin: '#8a5a38', coat: '#5a6a3a' }, sap: { skin: '#b07850', coat: '#8a5a36' },
};
function folk(c, sp, x, y, s, t, act, o = {}) { const p = SPP[sp] || {}; const sx = sp === 'nean' ? 1.18 : 1; c.save(); c.translate(x, y); c.scale(sx, 1); person(c, 0, 0, s, t, Object.assign({ act, skin: p.skin, coat: p.coat, fur: p.fur, light: o.light || 'golden', lx: o.lx != null ? o.lx - x : 600, seed: o.seed != null ? o.seed : x * 0.01 }, o)); c.restore(); }

// ================= TEMPLATES =================
const TPL = {};
// hero icon + keyword
TPL.hero = (g, t, b, o) => {
  const lt = t - b.t0, col = colOf(o), L = o.side !== 'R', ix = L ? 540 : 1380, tx = L ? 1330 : 600, iy = 520; deco(g, t, b, o);
  const ki = ent(t, b, o.ia, 0.05, 0.5);
  g.save(); g.strokeStyle = `rgba(${rgbOf(col)},0.35)`; g.lineWidth = 3; g.setLineDash([6, 14]); g.lineDashOffset = -t * 40; g.beginPath(); g.arc(ix, iy, 330, 0, 7); g.stroke(); g.restore();
  g.save(); g.globalCompositeOperation = 'screen'; glow(g, ix, iy, 360, `rgba(${rgbOf(col)},A)`, 0.18 * clamp(ki)); g.restore();
  if (b.w2) { const kw = easeOutBack(clamp(lt / 0.5)); win2D(g, t, b, { x: ix, y: iy, r: 262 * kw, col }, b.w2.sc, 1.2, b.w2.me); ringGauge(g, ix, iy, 280, clamp(lt / 1.2), col, clamp(ki), 10); iconBadge(g, o.icon || 'q', ix + (L ? -200 : 200), iy + 200, 74, ent(t, b, null, 0.35), col); }
  else { ringGauge(g, ix, iy, 270, clamp(lt / 1.2), col, clamp(ki), 10); drawIcon(g, o.icon || 'q', ix, iy, o.is || 1.9, clamp(lt / 0.9), col, 8, { fill: 0.1, rot: o.spin ? t * 0.3 : 0 }); }
  if (o.icon2) iconBadge(g, o.icon2, ix + (L ? 250 : -250), iy - 250, 78, ent(t, b, o.i2a, 0.7), o.col2 || col);
  const hasSub = !!o.sub, wy = hasSub ? 440 : 520, sz = fit(g, o.word, 820, o.ws || 140);
  word(g, o, o.word, tx, wy, sz, ent(t, b, o.a, 0.15), col);
  if (o.sub) hlText(g, o.sub, tx, 620, fit(g, o.sub, 760, o.ss || 64), ent(t, b, o.sa, 0.55), CC.ink, o.col2 || col);
  if (o.sub2) subLine(g, o.sub2, tx, 740, 46, entS(t, b, o.s2a, 1.0), '#d8ecf8');
  if (o.num) bigNum(g, o.num, tx, 790, 110, col, ent(t, b, o.na, 0.9));
  if (o.x) xMarkMG(g, ix, iy, 160, entS(t, b, o.x, 0, 0.5));
  if (o.ok) checkMG(g, ix + (L ? 200 : -200), iy + 200, 60, entS(t, b, o.ok, 0, 0.5));
};
// list of icon badges
TPL.list = (g, t, b, o) => {
  const col = colOf(o); deco(g, t, b, o); const n = o.items.length, two = n > 4, per = two ? Math.ceil(n / 2) : n;
  if (o.title) word(g, o, o.title, 960, 150, fit(g, o.title, 1500, o.ts || 90), ent(t, b, o.ta, 0), col, o.tstyle || 'glitch');
  o.items.forEach((it, i) => {
    const [ic, lb, a, flag, fa, c2] = it, row = two ? Math.floor(i / per) : 0, ci = two ? i % per : i, nn = two ? (row ? n - per : per) : n;
    const sp = Math.min(two ? 520 : 440, 1700 / nn), x = 960 + (ci - (nn - 1) / 2) * sp, y = two ? (row ? 770 : 430) : 560, r = two ? 92 : 115;
    const k = a ? ent(t, b, a, 0, 0.38, 1.0 + i * 1.6) : ent(t, b, null, 0.3 + i * 0.35), cc = c2 || col;
    iconBadge(g, ic, x, y, r, k, cc);
    if (k > 0) { g.save(); g.globalAlpha = clamp(k); g.font = fontPx(fit(g, lb, sp - 30, two ? 44 : 50)); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.shadowColor = '#000'; g.shadowBlur = 14; g.fillText(lb, x, y + r + 62); g.restore(); }
    const fk = flag ? (fa ? S(t, fa, 0.45) : entS(t, b, null, 0.9 + i * 0.35, 0.45)) : 0;
    if (flag === 'x') xMarkMG(g, x, y, r * 0.55, fk); else if (flag === 'v') checkMG(g, x + r * 0.7, y - r * 0.7, 34, fk);
  });
  if (o.foot) hlText(g, o.foot, 960, 985, fit(g, o.foot, 1400, 56), ent(t, b, o.fa, 1.4), CC.ink, col);
};
// big statistic
TPL.stat = (g, t, b, o) => {
  const lt = t - b.t0, col = colOf(o); deco(g, t, b, o); const k = ent(t, b, o.a, 0.1);
  ringGauge(g, 960, 500, 330, clamp(lt / 1.6) * (o.ring != null ? o.ring : 1), col, clamp(k), 8);
  for (let i = 0; i < 3; i++) { g.save(); g.globalAlpha = 0.25 - i * 0.06; g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.arc(960, 500, 380 + i * 36, -lt * (1 + i) * 0.6, -lt * (1 + i) * 0.6 + 2.2); g.stroke(); g.restore(); }
  if (b.w2) { const kw = easeOutBack(clamp(lt / 0.5)); win2D(g, t, b, { x: 290, y: 520, r: 205 * kw, col }, b.w2.sc, 1.2, b.w2.me); ringGauge(g, 290, 520, 222, clamp(lt / 1.2), col, kw, 6); if (o.icon) drawIcon(g, o.icon2 || o.icon, 1630, 520, 1.2, clamp((lt - 0.2) / 0.8), o.col2 || col, 7); }
  else if (o.icon) { drawIcon(g, o.icon, 330, 520, 1.3, clamp(lt / 0.8), col, 7); drawIcon(g, o.icon2 || o.icon, 1590, 520, 1.3, clamp((lt - 0.2) / 0.8), o.col2 || col, 7); }
  bigNum(g, o.num, 960, 470, fit(g, o.num, 760, o.ns || 220), col, k, o.sub);
  if (o.word) word(g, o, o.word, 960, 140, fit(g, o.word, 1500, 84), ent(t, b, o.wa, 0), col, 'glitch');
  if (o.foot) hlText(g, o.foot, 960, 960, fit(g, o.foot, 1500, 58), ent(t, b, o.fa, 0.9), CC.ink, o.col2 || col);
};
// A vs B compare
TPL.cmp = (g, t, b, o) => {
  const col = colOf(o); deco(g, t, b, o); if (o.title) word(g, o, o.title, 960, 120, fit(g, o.title, 1500, 76), ent(t, b, o.ta, 0), col, 'glitch');
  [[o.L, 150], [o.R, 1030]].forEach(([s, x0], i) => {
    if (!s) return; const k = s.a ? ent(t, b, s.a, 0, 0.38, 0.4 + i * 1.6) : ent(t, b, null, 0.2 + i * 0.6), c2 = s.col || (i ? (o.col2 || col) : col); if (k <= 0) return;
    g.save(); const e = easeOutBack(clamp(tAge('CMP' + i, k) / 0.45)); g.translate(x0 + 370, 560); g.scale(e, e); g.translate(-(x0 + 370), -560); glass(g, x0, 220, 740, 700, 0.5, `rgba(${rgbOf(c2)},0.5)`); g.restore();
    const lt = tAge('CMPi' + i, k); const ws = b.w2 && (i ? b.w2.R : b.w2.L);
    if (ws && !s.fig) { win2D(g, t, b, { x: x0 + 40, y: 250 + (1 - clamp(lt / 0.4)) * 30, w: 660, h: 430, rad: 24, col: c2 }, ws, 1.15, null); if (s.icon) iconBadge(g, s.icon, x0 + 110, 320, 56, clamp(lt * 2), c2); }
    else if (s.icon) drawIcon(g, s.icon, x0 + 370, 470, s.is || 1.5, clamp(lt / 0.8), c2, 8, { fill: 0.1 });
    if (s.fig) silFig(g, x0 + 370, 690, s.fig[0], c2, clamp(lt / 0.6), s.fig[1]);
    hlText(g, s.label, x0 + 370, 760, fit(g, s.label, 660, 62), clamp(lt * 2), CC.ink, c2);
    if (s.sub) subLine(g, s.sub, x0 + 370, 850, 42, clamp(lt - 0.4), '#d8ecf8');
    const mk = s.ma ? S(t, s.ma, 0.45) : 0; if (s.mark === 'x') xMarkMG(g, x0 + 640, 300, 44, mk); else if (s.mark === 'v') checkMG(g, x0 + 640, 300, 44, mk);
  });
  const kv = ent(t, b, null, 0.5); if (kv > 0 && o.vs !== false) { g.save(); g.translate(960, 570); g.scale(easeOutBack(clamp(kv)), easeOutBack(clamp(kv))); g.fillStyle = 'rgba(4,10,18,0.9)'; g.beginPath(); g.arc(0, 0, 62, 0, 7); g.fill(); g.strokeStyle = col; g.lineWidth = 4; g.stroke(); g.fillStyle = '#fff'; g.font = 'bold 44px Consolas'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.mid || 'VS', 0, 2); g.restore(); }
};
// framed mini-world + keyword column
TPL.scene = (g, t, b, o) => {
  const lt = t - b.t0, len = Math.max(1, b.t1 - b.t0), col = colOf(o), R = o.side === 'R'; deco(g, t, b, o);
  const u = ease(clamp(lt / len)), cam = { fx: lerp(o.fx0 || 960, o.fx1 || o.fx0 || 960, u), fy: lerp(o.fy0 || 540, o.fy1 || o.fy0 || 540, u), z: lerp(o.z0 || 1, o.z1 || (o.z0 || 1) * 1.12, u) };
  const ke = easeOut(clamp(lt / 0.5));
  const clip = o.circle ? { x: R ? 1340 : 580, y: 540, r: 410 * (0.9 + 0.1 * ke), col } : { x: R ? 720 : 80, y: 110 + (1 - ke) * 40, w: 1120, h: 860, rad: 34, col };
  worldIn(g, c => o.draw(c, t, lt, b), cam, clip, t);
  const cx = o.circle ? (R ? 560 : 1400) : (R ? 370 : 1570), cw = o.circle ? 760 : 540;
  if (o.icon) iconBadge(g, o.icon, cx, 280, 100, ent(t, b, o.ia, 0.3), col);
  const wy = o.icon ? 520 : 440; word(g, o, o.word, cx, wy, fit(g, o.word || '', cw, o.ws || 110), ent(t, b, o.a, 0.2), col);
  if (o.sub) hlText(g, o.sub, cx, wy + 160, fit(g, o.sub, cw - 20, o.ss || 54), ent(t, b, o.sa, 0.6), CC.ink, o.col2 || col);
  if (o.sub2) subLine(g, o.sub2, cx, wy + 270, 42, entS(t, b, o.s2a, 1.0), '#d8ecf8');
  if (o.num) bigNum(g, o.num, cx, wy + 300, 96, o.col2 || col, ent(t, b, o.na, 0.9));
  if (o.tagIn) tag(g, o.tagIn, o.circle ? (R ? 1340 : 580) : (R ? 1280 : 640), o.circle ? 940 : 920, ent(t, b, o.tia, 0.8), col, 48);
};
// the user's character in a circle window + MG keywords
TPL.char = (g, t, b, o) => {
  const lt = t - b.t0, col = colOf(o); deco(g, t, b, o); const R = o.side === 'R', cx = R ? 1400 : 520;
  const ke = easeOutBack(clamp(lt / 0.5));
  worldIn(g, c => { if (o.bg) o.bg(c, t); else { bgMG(c, t, o.mode || SECNOW.mode); c.save(); c.globalCompositeOperation = 'screen'; glow(c, 960, 520, 700, `rgba(${rgbOf(col)},A)`, 0.25); c.restore(); } hero(c, t, 960, { up: o.up || 0, upAng: o.upAng, loAng: o.loAng, wave: o.wave ? Math.sin(t * 6) * 14 : 0 }); }, { fx: 960, fy: o.fy || 590, z: o.z || 1.55 }, { x: cx, y: 560, r: 400 * ke, col }, t);
  ringGauge(g, cx, 560, 440, clamp(lt / 1.4), col, 1, 5);
  const tx = R ? 560 : 1360; if (o.icon) drawIcon(g, o.icon, tx, 250, 1.1, clamp((lt - 0.2) / 0.7), col, 7);
  word(g, o, o.word, tx, 480, fit(g, o.word, 820, o.ws || 120), ent(t, b, o.a, 0.2), col, o.style || 'glitch');
  if (o.sub) hlText(g, o.sub, tx, 640, fit(g, o.sub, 780, 58), ent(t, b, o.sa, 0.6), CC.ink, o.col2 || col);
  if (o.items) o.items.forEach(([ic, a], i) => iconBadge(g, ic, tx + (i - (o.items.length - 1) / 2) * 200, 820, 70, a ? P(t, a) : ent(t, b, null, 0.8 + i * 0.3), col));
};
// pro map fly-through (full frame map is allowed)
TPL.map = (g, t, b, o) => {
  const lt = t - b.t0, col = colOf(o), k = ease(seg(t, b.t0, b.t1)); const c0 = o.c0, c1 = o.c1 || o.c0; const cam = {}; for (const kk of ['lon', 'lat', 'zoom', 'tilt', 'rot']) cam[kk] = lerp(c0[kk] != null ? c0[kk] : (kk === 'tilt' ? 0.8 : 0), c1[kk] != null ? c1[kk] : (c0[kk] != null ? c0[kk] : (kk === 'tilt' ? 0.8 : 0)), k);
  worldIn(g, c => { const Pj = mapPro(c, cam, t, (mg, SP) => { (o.routes || []).forEach(([pts, a, rc, d]) => glowRoute(mg, SP, pts, a ? S(t, a, d || 2.5) : clamp((lt - 0.3) / (d || 3)), rc || col, 9)); (o.areas || []).forEach(([pts, a, ac]) => { const kk = a ? S(t, a, 0.8) : clamp(lt / 0.8); if (kk <= 0) return; mg.save(); mg.globalAlpha = 0.45 * kk; mg.fillStyle = ac || col; mg.beginPath(); pts.forEach((p, i) => { const [x, y] = SP(p); i ? mg.lineTo(x, y) : mg.moveTo(x, y); }); mg.closePath(); mg.fill(); mg.globalAlpha = 0.9 * kk; mg.strokeStyle = ac || col; mg.lineWidth = 5; mg.stroke(); mg.restore(); }); }, { through: o.through ? 1 - seg(t, b.t0, b.t0 + 1) : 0 });
    (o.routes || []).forEach(([pts, a, rc, d]) => { if (o.march) marchers(c, Pj, pts, a ? S(t, a, d || 2.5) : clamp((lt - 0.3) / (d || 3)), t); });
    (o.pins || []).forEach(([ll, lb, a, pcol]) => { const [x, y] = Pj(ll); mapPin(c, x, y, lb, a ? P(t, a) : ent(t, b, null, 0.6), pcol || col); }); }, { fx: 960, fy: 540, z: 1 }, { x: 0, y: 0, w: PW, h: PH, rad: 0, col: 'rgba(0,0,0,0)' }, t);
  const vg = g.createLinearGradient(0, 0, 0, PH); vg.addColorStop(0, 'rgba(2,6,12,0.7)'); vg.addColorStop(0.22, 'rgba(2,6,12,0)'); vg.addColorStop(0.72, 'rgba(2,6,12,0)'); vg.addColorStop(1, 'rgba(2,6,12,0.85)'); g.fillStyle = vg; g.fillRect(0, 0, PW, PH);
  if (o.chip) chip(g, o.chip, 70, 82, col, 28, clamp(lt * 3), 'left');
  if (o.word) word(g, o, o.word, 960, 960, fit(g, o.word, 1400, o.ws || 84), ent(t, b, o.a, 0.3), col, o.style || 'hl');
  if (o.top) glitchText(g, o.top, 960, 110, fit(g, o.top, 1400, 70), ent(t, b, o.ta, 0.1), '#ffffff');
  if (o.num) bigNum(g, o.num, o.nx || 1560, o.ny || 260, 110, col, ent(t, b, o.na, 0.6), o.nsub);
  if (o.cold) { const kf = S(t, o.cold, 0.9); snowStorm(g, t, Math.round(120 * kf), 1.1, 0.6); }
  if (b.w2) { const kw = easeOutBack(clamp((lt - 0.4) / 0.5)); win2D(g, t, b, { x: 1700, y: 770, r: 160 * kw, col }, b.w2.sc, 1.3, b.w2.me); ringGauge(g, 1700, 770, 176, clamp(lt / 1.4), col, clamp(kw), 5); }
};
// chapter card
TPL.chapter = (g, t, b, o) => {
  const lt = t - b.t0, col = colOf(o); bgMG(g, t, o.mode || SECNOW.mode, { floor: false, np: 70 }); tunnel(g, t, 960, 540, rgbOf(col), 0.8);
  g.save(); g.globalAlpha = 0.18 * clamp(lt / 0.6); drawIcon(g, o.icon || 'skull', 960, 520, 4.2, clamp(lt / 1.2), col, 6); g.restore();
  const k = clamp(lt / 0.5); chip(g, o.num, 960, 300, col, 34, k);
  title(g, o.name, 960, 520, clamp((lt - 0.15) * 2), fit(g, o.name, 1500, 150), '#ffffff');
  if (o.years) tag(g, o.years, 960, 720, clamp((lt - 0.6) * 2), col, 54);
  lightStreak(g, clamp(lt / 0.8), 540);
  if (b.w2) { const kw = easeOut(clamp((lt - 0.3) / 0.6)); if (kw > 0) { const clip = { x: 560, y: 790 + (1 - kw) * 40, w: 800, h: 230, rad: 26, col }; win2D(g, t, b, clip, b.w2.sc, 1.3, null); } }
  if (lt < 0.6) { g.save(); g.strokeStyle = col; g.globalAlpha = 1 - lt / 0.6; g.lineWidth = 6; g.beginPath(); g.arc(960, 520, 100 + lt * 1400, 0, 7); g.stroke(); g.restore(); }
};
// timeline of species
const SPEC = { erectus: ['হোমো ইরেক্টাস', 2000000, 110000, '#ffc04a'], nean: ['নিয়ান্ডারথাল', 400000, 40000, '#8fe3ff'], deni: ['ডেনিসোভান', 300000, 30000, '#c9a2ff'], flores: ['ফ্লোরেসিয়েনসিস', 100000, 50000, '#7dffb0'], sap: ['হোমো স্যাপিয়েন্স', 300000, 0, '#ff8a5a'] };
TPL.timeline = (g, t, b, o) => {
  const lt = t - b.t0, col = colOf(o); deco(g, t, b, Object.assign({ floor: false }, o)); const maxV = o.max || 2000000, x0 = 160, x1 = 1760, lg = o.scale === 'log';
  const X = v => { const u = lg ? Math.log10(Math.max(v, 1000) / 1000) / Math.log10(maxV / 1000) : v / maxV; return x1 - clamp(u) * (x1 - x0); };
  const ay = o.ay || 900; g.save(); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, ay); g.lineTo(x0 + (x1 - x0) * clamp(lt / 0.8), ay); g.stroke();
  (o.ticks || []).forEach(([v, lb]) => { const x = X(v); if (x > x0 + (x1 - x0) * clamp(lt / 0.8)) return; g.fillStyle = '#fff'; g.fillRect(x - 2, ay - 12, 4, 24); g.font = '30px "Nirmala UI"'; g.textAlign = 'center'; g.fillStyle = '#cfe6f5'; g.fillText(lb, x, ay + 50); }); g.restore();
  const rows = o.rows || ['erectus', 'nean', 'deni', 'flores', 'sap'], rh = Math.min(120, 560 / rows.length);
  rows.forEach((sp, i) => {
    const [nm, from, to, c2] = SPEC[sp], y = (o.y0 || 250) + i * rh, k = o.ra && o.ra[i] ? S(t, o.ra[i], 1.0) : ease(clamp((lt - 0.3 - i * 0.25) / 1.0)); if (k <= 0) return;
    const xa = X(from), xb = X(to), xe = lerp(xa, xb, k); const dim = o.focus && o.focus !== sp ? 0.35 : 1;
    g.save(); g.globalAlpha = dim; const gr = g.createLinearGradient(xa, 0, xb, 0); gr.addColorStop(0, `rgba(${rgbOf(c2)},0.15)`); gr.addColorStop(1, c2); g.fillStyle = gr; g.shadowColor = c2; g.shadowBlur = 18; rr(g, xa, y - rh * 0.3, Math.max(8, xe - xa), rh * 0.6, rh * 0.3); g.fill(); g.shadowBlur = 0;
    g.font = fontPx(Math.min(40, rh * 0.42)); g.textBaseline = 'middle'; const tw = g.measureText(nm).width; const inside = xe - xa > tw + 40; g.textAlign = inside ? 'left' : 'right'; g.fillStyle = inside ? '#0a0806' : '#fff'; g.fillText(nm, inside ? xa + 20 : xa - 16, y + 2);
    const ex = o.ext && o.ext[i] ? S(t, o.ext[i], 0.5) : 0; if (ex > 0 && sp !== 'sap') { drawIcon(g, 'skull', xb + 34, y, 0.26, ex, CC.red, 5); }
    g.restore();
  });
  if (o.mark) { const [v, lb, a] = o.mark, km = a ? S(t, a, 0.6) : clamp((lt - 1) / 0.6); if (km > 0) { const x = X(v); g.save(); g.strokeStyle = '#fff'; g.globalAlpha = km; g.lineWidth = 4; g.setLineDash([12, 10]); g.shadowColor = col; g.shadowBlur = 20; g.beginPath(); g.moveTo(x, (o.y0 || 250) - 90); g.lineTo(x, ay); g.stroke(); g.restore(); chip(g, lb, x, (o.y0 || 250) - 110, col, 32, km); } }
  if (o.word) word(g, o, o.word, 960, 100, fit(g, o.word, 1500, 72), ent(t, b, o.a, 0), col, 'glitch');
  chip(g, 'আজ', x1, ay - 50, CC.green, 28, clamp(lt * 2));
};
// value bars
TPL.bars = (g, t, b, o) => {
  const lt = t - b.t0, col = colOf(o); deco(g, t, b, Object.assign({ floor: false }, o)); const mx = o.max || Math.max(...o.items.map(i => i[1])); const n = o.items.length, rh = Math.min(190, 640 / n), y0 = 540 - (n - 1) * rh / 2 + (o.title ? 50 : 0);
  if (o.title) word(g, o, o.title, 960, 130, fit(g, o.title, 1500, 78), ent(t, b, o.ta, 0), col, 'glitch');
  o.items.forEach(([lb, v, a, c2, vl, ic], i) => {
    const y = y0 + i * rh, k = a ? S(t, a, 1.1) : ease(clamp((lt - 0.3 - i * 0.4) / 1.1)), cc = c2 || col; const kk = a ? P(t, a) : 0; if (k <= 0 && kk <= 0) return;
    g.save(); g.globalAlpha = clamp(k * 3); g.font = fontPx(fit(g, lb, 440, 48)); g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(lb, 600, y); g.restore();
    const wmax = 1150, lw = Math.max(o.minW || 10, wmax * (o.log ? Math.log10(v) / Math.log10(mx) : v / mx)) * k; g.save(); g.fillStyle = 'rgba(255,255,255,0.07)'; rr(g, 640, y - rh * 0.28, wmax, rh * 0.56, rh * 0.28); g.fill(); const gr = g.createLinearGradient(640, 0, 640 + lw, 0); gr.addColorStop(0, mixC(cc, '#000000', 0.4)); gr.addColorStop(1, cc); g.fillStyle = gr; g.shadowColor = cc; g.shadowBlur = 22; rr(g, 640, y - rh * 0.28, Math.max(4, lw), rh * 0.56, rh * 0.28); g.fill(); g.restore();
    if (vl) { g.save(); g.globalAlpha = clamp(k * 2); g.font = 'bold 46px "Nirmala UI"'; g.textBaseline = 'middle'; const tw = g.measureText(vl).width; const inside = lw > tw + 50; g.textAlign = inside ? 'right' : 'left'; g.fillStyle = inside ? '#0a0806' : cc; g.fillText(vl, inside ? 640 + lw - 22 : 640 + lw + 20, y + 2); g.restore(); }
  });
  if (o.foot) hlText(g, o.foot, 960, 990, fit(g, o.foot, 1500, 54), ent(t, b, o.fa, 1.6), CC.ink, col);
};
// DNA helix
TPL.dna = (g, t, b, o) => {
  const lt = t - b.t0, col = colOf(o); deco(g, t, b, Object.assign({ floor: false }, o)); const cy = o.cy || 600, amp = 120, n = 44, x0 = 160, x1 = 1760, kd = clamp(lt / 1.0);
  const kp = o.pa ? S(t, o.pa, 1.2) : clamp((lt - 0.8) / 1.2); const hiN = Math.round(n * (o.frac || 0.1) * kp), hiStart = Math.floor(n * (o.at || 0.45));
  for (let i = 0; i < n; i++) { const x = lerp(x0, x1, i / (n - 1)); if (x > lerp(x0, x1, kd)) break; const ph = x * 0.009 + t * 1.6, y1 = cy + Math.sin(ph) * amp, y2 = cy - Math.sin(ph) * amp, dep = Math.cos(ph); const hi = i >= hiStart && i < hiStart + hiN;
    g.save(); g.strokeStyle = hi ? (o.col2 || CC.ember2) : `rgba(${rgbOf(col)},${0.35 + 0.25 * Math.abs(dep)})`; g.lineWidth = hi ? 9 : 6; g.shadowColor = hi ? (o.col2 || CC.ember2) : col; g.shadowBlur = hi ? 26 : 10; g.beginPath(); g.moveTo(x, y1); g.lineTo(x, y2); g.stroke();
    for (const [yy, d] of [[y1, dep], [y2, -dep]]) { g.fillStyle = d > 0 ? '#ffffff' : `rgba(${rgbOf(col)},0.7)`; g.beginPath(); g.arc(x, yy, 9 + 4 * d, 0, 7); g.fill(); } g.restore(); }
  if (o.num) bigNum(g, o.num, 960, 210, o.ns || 150, o.col2 || CC.ember2, ent(t, b, o.na, 0.8), o.sub);
  if (o.word) word(g, o, o.word, 960, o.num ? 940 : 180, fit(g, o.word, 1500, 76), ent(t, b, o.a, 0.2), col, o.num ? 'hl' : 'glitch');
  if (o.labels) o.labels.forEach(([lb, x, a, c2]) => tag(g, lb, x, 880, a ? P(t, a) : ent(t, b, null, 1), c2 || col, 44));
};
// human family tree
TPL.tree = (g, t, b, o) => {
  const lt = t - b.t0, col = colOf(o); deco(g, t, b, Object.assign({ floor: false }, o)); const base = [960, 1020], hub = [960, 760];
  const leaves = o.leaves || ['erectus', 'nean', 'sap', 'deni', 'flores'], xs = [230, 590, 960, 1330, 1690];
  const kg = o.fast ? 1 : o.ga ? S(t, o.ga, 1.4) : clamp(lt / 1.4);
  g.save(); g.strokeStyle = '#c8a070'; g.lineWidth = 34; g.lineCap = 'round'; g.shadowColor = col; g.shadowBlur = 16; g.beginPath(); g.moveTo(base[0], base[1]); g.lineTo(hub[0], lerp(base[1], hub[1], clamp(kg * 3))); g.stroke(); g.restore();
  leaves.forEach((sp, i) => {
    const [nm, , , c2] = SPEC[sp], x = xs[i], y = 290 + (i === 2 ? -40 : Math.abs(i - 2) * 40), kr = kg * 1.8 - 0.3 - i * 0.1, kb = clamp(kr); if (kb <= 0) return;
    const bk = o.brk && o.brk[i], br = bk ? (Array.isArray(bk) ? S(t, bk[0], 1.4, bk[1]) : S(t, bk, 1.4)) : 0, fall = sp === 'sap' ? 0 : br;
    g.save(); const mx = lerp(hub[0], x, 0.5), my = lerp(hub[1], y, 0.4) + 60; const pt = u => { const v = 1 - u; return [v * v * hub[0] + 2 * v * u * mx + u * u * x, v * v * hub[1] + 2 * v * u * my + u * u * y]; };
    g.strokeStyle = sp === 'sap' ? c2 : '#b08a60'; g.lineWidth = sp === 'sap' ? 18 : 14; g.lineCap = 'round'; g.shadowColor = c2; g.shadowBlur = 14; g.beginPath(); const brkU = 0.55;
    for (let j = 0; j <= 30; j++) { const u = j / 30 * kb; if (fall > 0 && u > brkU) break; const [px, py] = pt(u); j ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
    if (fall > 0 && kb >= 1) { const [bx, by] = pt(brkU); g.translate(bx, by + fall * fall * 900); g.rotate(fall * (i < 2 ? -1.2 : 1.2)); g.globalAlpha = 1 - fall; g.beginPath(); for (let j = 0; j <= 20; j++) { const u = brkU + (1 - brkU) * j / 20, [px, py] = pt(u); j ? g.lineTo(px - bx, py - by) : g.moveTo(px - bx, py - by); } g.stroke(); g.translate(x - bx, y - by); }
    else g.translate(x, y);
    if (kb >= 1) { const kl = clamp((kr - 1) * 4 + 0.3); g.fillStyle = 'rgba(4,10,18,0.85)'; g.beginPath(); g.arc(0, 0, 70, 0, 7); g.fill(); g.strokeStyle = c2; g.lineWidth = 4; g.stroke(); drawIcon(g, sp === 'flores' ? 'body' : sp === 'deni' ? 'finger' : sp === 'nean' ? 'skull' : sp === 'erectus' ? 'axe' : 'people', 0, 0, sp === 'sap' ? 0.42 : 0.4, kl, c2, 6);
      g.font = fontPx(36); g.textAlign = 'center'; g.fillStyle = '#fff'; g.shadowColor = '#000'; g.shadowBlur = 10; g.globalAlpha *= clamp(kl); g.fillText(nm, 0, 118); }
    g.restore();
  });
  if (o.word) word(g, o, o.word, 960, 92, fit(g, o.word, 1400, 70), ent(t, b, o.a, 0.3), col, 'glitch');
  if (o.glow) { const kk = S(t, o.glow, 1); g.save(); g.globalCompositeOperation = 'screen'; glow(g, 960, 250, 300, `rgba(${rgbOf(SPEC.sap[3])},A)`, 0.5 * kk); g.restore(); }
};
// network of groups
TPL.net = (g, t, b, o) => {
  const lt = t - b.t0, col = colOf(o); deco(g, t, b, Object.assign({ floor: false }, o)); const kind = o.kind || 'big';
  const region = kind === 'split' ? [[80, 920, 'big'], [1000, 1840, 'small']] : [[80, 1840, kind]];
  region.forEach(([xa, xb, kd], ri) => {
    const cc = kd === 'big' ? (o.colA || col) : (o.colB || SECC.ice), N = kd === 'big' ? 34 : 18, nodes = [];
    for (let i = 0; i < N; i++) { if (kd === 'big') nodes.push([lerp(xa + 60, xb - 60, hash(i * 3 + ri)), lerp(230, 900, hash(i * 3 + 1 + ri)), i]); else { const cl = Math.floor(i / 3), cxl = lerp(xa + 120, xb - 120, (cl % 3) / 2), cyl = 330 + Math.floor(cl / 3) * 380; nodes.push([cxl + (hash(i) - 0.5) * 120, cyl + (hash(i + 7) - 0.5) * 120, cl]); } }
    const kn = clamp((lt - 0.2) / 1.2);
    const links = []; nodes.forEach((a, i) => nodes.forEach((c2, j) => { if (j <= i) return; const d = Math.hypot(a[0] - c2[0], a[1] - c2[1]); if (kd === 'big' ? d < 330 : (a[2] === c2[2])) links.push([a, c2, d]); }));
    links.forEach(([a, c2], li) => { const kk = clamp(kn * 1.6 - hash(li) * 0.6); drawLine(g, a[0], a[1], c2[0], c2[1], kk, `rgba(${rgbOf(cc)},0.55)`, 2.5); if (kd === 'big' && kk >= 1) { const p = (t * 0.5 + hash(li + 3)) % 1; g.save(); g.globalCompositeOperation = 'screen'; glow(g, lerp(a[0], c2[0], p), lerp(a[1], c2[1], p), 16, 'rgba(255,240,190,A)', 0.9); g.restore(); } });
    nodes.forEach(([x, y, cl], i) => { const kk = clamp(kn * 2 - hash(i + 9)); if (kk <= 0) return; const dead = kd === 'small' && o.die && cl === 1 ? S(t, o.die, 1) : 0; g.save(); g.globalAlpha = kk * (1 - dead * 0.85); g.fillStyle = 'rgba(4,10,18,0.9)'; g.beginPath(); g.arc(x, y, 22, 0, 7); g.fill(); g.strokeStyle = dead > 0 ? mixC(cc, '#555555', dead) : cc; g.lineWidth = 3; g.shadowColor = cc; g.shadowBlur = 14; g.stroke(); drawIcon(g, 'body', x, y + 2, 0.14, 1, cc, 4); g.restore(); });
    if (kd === 'small' && o.die) { const dk = S(t, o.die, 1); if (dk > 0) drawIcon(g, 'skull', nodes[3][0], nodes[3][1] - 110, 0.5, dk, CC.red, 6); }
    if (kind === 'split') { const lb = kd === 'big' ? (o.la || 'স্যাপিয়েন্স') : (o.lb || 'নিয়ান্ডারথাল'); hlText(g, lb, (xa + xb) / 2, 990, 54, ent(t, b, ri ? o.lba : o.laa, 0.4 + ri * 0.5), CC.ink, cc); }
  });
  if (kind === 'split') { g.save(); g.strokeStyle = 'rgba(255,255,255,0.25)'; g.setLineDash([10, 12]); g.lineWidth = 3; g.beginPath(); g.moveTo(960, 180); g.lineTo(960, 940); g.stroke(); g.restore(); }
  if (o.pkt) { const kp = S(t, o.pkt, 2.2); if (kp > 0 && kp < 1) { const x = lerp(220, 1700, kp), y = 560 + Math.sin(kp * 9) * 160; iconBadge(g, o.pktIcon || 'needle', x, y, 60, 1, CC.ember2); } }
  if (o.word) word(g, o, o.word, 960, 110, fit(g, o.word, 1500, 76), ent(t, b, o.a, 0.1), col, 'glitch');
};
// height compare with ruler
TPL.height = (g, t, b, o) => {
  const lt = t - b.t0, col = colOf(o); deco(g, t, b, Object.assign({ floor: false }, o)); const gy = 900, pxm = 330;
  g.save(); g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 3; g.beginPath(); g.moveTo(120, gy); g.lineTo(1800, gy); g.stroke(); for (let m = 0; m <= 20; m++) { const y = gy - m * pxm / 10; if (y < 180) break; g.beginPath(); g.moveTo(170, y); g.lineTo(m % 5 ? 190 : 210, y); g.stroke(); if (m % 5 === 0) { g.fillStyle = '#cfe6f5'; g.font = '28px Consolas'; g.textAlign = 'right'; g.fillText(BN((m / 10).toFixed(1)) + ' মি', 160, y + 8); } } g.restore();
  o.figs.forEach(([lb, h, c2, a, wf], i) => { const x = 960 + (i - (o.figs.length - 1) / 2) * (o.sp || 520), k = a ? S(t, a, 0.7) : clamp((lt - 0.2 - i * 0.4) / 0.7); silFig(g, x, gy, h * pxm, c2 || col, k, wf || 1); if (k > 0) { hlText(g, lb, x, gy + 70, fit(g, lb, 460, 46), k, CC.ink, c2 || col); g.save(); g.globalAlpha = k; g.strokeStyle = c2 || col; g.setLineDash([8, 8]); g.lineWidth = 2; g.beginPath(); g.moveTo(200, gy - h * pxm); g.lineTo(x, gy - h * pxm); g.stroke(); g.restore(); } });
  if (o.word) word(g, o, o.word, 960, 110, fit(g, o.word, 1400, 76), ent(t, b, o.a, 0.1), col, 'glitch');
};
// brain size compare
TPL.brain = (g, t, b, o) => {
  const lt = t - b.t0, col = colOf(o); deco(g, t, b, o); const n = o.items.length;
  o.items.forEach(([lb, s, c2, a, vl], i) => { const x = 960 + (i - (n - 1) / 2) * 560, k = a ? S(t, a, 0.9) : clamp((lt - 0.2 - i * 0.5) / 0.9); if (k <= 0) return; g.save(); g.globalCompositeOperation = 'screen'; glow(g, x, 520, 260 * s, `rgba(${rgbOf(c2)},A)`, 0.3 * k); g.restore(); drawIcon(g, 'brain', x, 520, 1.6 * s * easeOutBack(k), k, c2, 7, { fill: 0.12 }); hlText(g, lb, x, 820, fit(g, lb, 480, 54), k, CC.ink, c2); if (vl) subLine(g, vl, x, 910, 44, k, '#d8ecf8'); });
  if (o.word) word(g, o, o.word, 960, 120, fit(g, o.word, 1400, 80), ent(t, b, o.a, 0.1), col, 'glitch');
};
// time rewind
TPL.rewind = (g, t, b, o) => {
  const lt = t - b.t0, col = colOf(o); bgMG(g, t, o.mode || SECNOW.mode, { floor: false }); tunnel(g, t, 960, 520, rgbOf(col), 2.2 - clamp(lt / 3) * 1.6);
  const kp = o.a ? S(t, o.a, 0.4) : clamp((lt - 2) / 0.4); const cx = 960, cy = 470; glass(g, cx - 250, cy - 250, 500, 500, 0.4, `rgba(${rgbOf(col)},0.4)`, 250); drawIcon(g, 'clock', cx, cy, 2.1, clamp(lt / 0.5), col, 7);
  const sp = -lt * 16 * (1 - kp * 0.95); g.save(); g.translate(cx, cy); g.strokeStyle = CC.ember2; g.lineWidth = 10; g.lineCap = 'round'; g.shadowColor = CC.ember2; g.shadowBlur = 20; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(sp) * 160, -Math.cos(sp) * 160); g.moveTo(0, 0); g.lineTo(Math.sin(sp / 12) * 100, -Math.cos(sp / 12) * 100); g.stroke(); g.restore();
  const yr = Math.round(lerp(o.from || 2026, o.to || -48000, easeIO(clamp(lt / (o.dur || 2))))); g.save(); g.font = 'bold 96px Consolas, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.shadowColor = col; g.shadowBlur = 30; g.globalAlpha = 1 - kp; g.fillText(BN(String(Math.abs(yr))) + (yr < 0 ? ' খ্রি.পূ.' : ''), cx, 860); g.restore();
  slam(g, o.word, cx, 860, fit(g, o.word, 1400, 120), kp, CC.ember2); chip(g, o.chip || '⟲ টাইম মেশিন', cx, 120, CC.ember2, 32, clamp(lt * 3));
};
// species profile card: framed scene + stat rows
TPL.profile = (g, t, b, o) => {
  const lt = t - b.t0, col = colOf(o); deco(g, t, b, o); const ke = easeOutBack(clamp(lt / 0.5));
  worldIn(g, c => o.draw(c, t, lt, b), { fx: o.fx || 960, fy: o.fy || 600, z: (o.z || 1.3) * (1 + 0.04 * clamp(lt / 6)) }, { x: 470, y: 560, r: 380 * ke, col }, t);
  ringGauge(g, 470, 560, 420, clamp(lt / 1.6), col, 1, 5);
  if (o.name) title(g, o.name, 1340, 170, clamp((lt - 0.1) * 2), fit(g, o.name, 900, 92), col);
  o.rows.forEach(([ic, lb, a], i) => { const y = 340 + i * 150, k = a ? P(t, a) : ent(t, b, null, 0.5 + i * 0.5); if (k <= 0) return; iconBadge(g, ic, 960, y, 56, k, col); g.save(); g.globalAlpha = clamp(k); g.font = fontPx(fit(g, lb, 760, 52)); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.shadowColor = '#000'; g.shadowBlur = 12; g.fillText(lb, 1050 - (1 - easeOut(clamp(tAge('PR' + i, k) / 0.4))) * 40, y + 2); g.restore(); });
};
// split screen: two framed mini worlds
TPL.duo = (g, t, b, o) => {
  const lt = t - b.t0, col = colOf(o); deco(g, t, b, o);
  [[o.L, 70], [o.R, 990]].forEach(([s, x0], i) => { if (!s) return; const k = s.a ? S(t, s.a, 0.5) : clamp((lt - 0.1 - i * 0.5) / 0.5); if (k <= 0) return; const cc = s.col || col; worldIn(g, c => s.draw(c, t, lt), { fx: s.fx || 960, fy: s.fy || 560, z: (s.z || 1.1) * (1 + 0.05 * clamp(lt / 6)) }, { x: x0, y: 170 + (1 - easeOut(k)) * 60, w: 860, h: 640, rad: 30, col: cc }, t); hlText(g, s.label, x0 + 430, 900, fit(g, s.label, 780, 58), k, CC.ink, cc); if (s.mark === 'x') xMarkMG(g, x0 + 780, 240, 40, S(t, s.ma, 0.5)); else if (s.mark === 'v') checkMG(g, x0 + 780, 240, 40, S(t, s.ma, 0.5)); });
  if (o.word) word(g, o, o.word, 960, 92, fit(g, o.word, 1400, 70), ent(t, b, o.a, 0.1), col, 'glitch');
};
// big question / statement on tunnel
TPL.big = (g, t, b, o) => {
  const lt = t - b.t0, col = colOf(o); bgMG(g, t, o.mode || SECNOW.mode, { floor: false, np: 60 }); if (o.tunnel !== false) tunnel(g, t, 960, 540, rgbOf(col), 0.6);
  const W2 = !!b.w2, dy = W2 ? 230 : 0;
  if (o.ecg) ecg(g, t, W2 ? 1000 : 760, `rgba(${rgbOf(col)},0.9)`, 0.6);
  if (W2) { const kw = easeOut(clamp(lt / 0.5)); const clip = { x: 560, y: 80 + (1 - kw) * 40, w: 800, h: 450, rad: 30, col }; g.save(); g.globalAlpha = kw; g.fillStyle = 'rgba(0,0,0,0.5)'; g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 40; g.beginPath(); g.roundRect(clip.x, clip.y, clip.w, clip.h, 30); g.fill(); g.restore(); win2D(g, t, b, clip, b.w2.sc, 1.2, b.w2.me); corners(g, clip.x - 16, clip.y - 16, clip.w + 32, clip.h + 32, col, 0.6 * kw, 34, 3); }
  const ls = lerp(24, 2, easeOut(clamp(lt / 1.6))); g.save(); g.font = fontPx(fit(g, o.word, 1600, W2 ? Math.min(o.ws || 110, 100) : (o.ws || 110))); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.globalAlpha = entS(t, b, o.a, 0.05, 0.6); g.letterSpacing = ls + 'px'; g.shadowColor = col; g.shadowBlur = 34; g.fillText(o.word, 960, (o.sub ? 470 : 540) + dy + (W2 && !o.sub ? 40 : 0)); g.restore();
  if (o.sub) subLine(g, o.sub, 960, 610 + dy, 54, entS(t, b, o.sa, 0.7), col);
  if (o.icon) { if (W2) iconBadge(g, o.icon, 1350, 110, 58, ent(t, b, null, 0.4), col); else drawIcon(g, o.icon, 960, 250, 0.9, clamp((lt - 0.3) / 0.7), col, 7); }
};
function ecg(g, t, y, col, a = 1) { g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = 4; g.shadowColor = col; g.shadowBlur = 16; g.beginPath(); for (let x = 0; x <= PW; x += 6) { const ph = ((x / PW) * 2 - t * 0.9) % 1, u = (ph + 1) % 1; const yy = u > 0.45 && u < 0.55 ? Math.sin((u - 0.45) / 0.1 * Math.PI * 2) * -90 * Math.exp(-((u - 0.5) ** 2) * 400) : 0; x ? g.lineTo(x, y + yy) : g.moveTo(x, y + yy); } g.stroke(); g.restore(); }
