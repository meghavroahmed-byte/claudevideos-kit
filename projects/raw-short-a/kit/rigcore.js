// Character rig built from the user's character sheet + shared drawing helpers
const D2R = Math.PI / 180;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeOut = t => { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
const easeOutBack = t => { t = clamp(t); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const seg = (t, a, b) => clamp((t - a) / (b - a));
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise = t => { const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };
const HOODIE = '#c3c8d2', JEANS = '#272b39', LINE = '#16161c';

function piece(src, poly, pivot) { const p = cutPoly(src, poly); return { c: p.c, ox: p.ox, oy: p.oy, px: pivot ? pivot[0] : 0, py: pivot ? pivot[1] : 0, poly }; }
function rectPoly(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }
function polyPath(g, poly, ox = 0, oy = 0) { g.beginPath(); poly.forEach(([x, y], k) => k ? g.lineTo(x - ox, y - oy) : g.moveTo(x - ox, y - oy)); g.closePath(); }
function fillAtop(pc, poly, color) { const g = pc.c.getContext('2d'); g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = color; polyPath(g, poly, pc.ox, pc.oy); g.fill(); g.restore(); }
function erase(pc, poly) { const g = pc.c.getContext('2d'); g.save(); g.globalCompositeOperation = 'destination-out'; polyPath(g, poly, pc.ox, pc.oy); g.fill(); g.restore(); }
function shadeCopy(pc, color) {
  const c = mk(pc.c.width, pc.c.height), g = c.getContext('2d'); g.drawImage(pc.c, 0, 0);
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return Object.assign({}, pc, { c });
}
function drawP(g, pc, ang = 0, fn) {
  g.save();
  if (ang) { g.translate(pc.px, pc.py); g.rotate(ang * D2R); g.translate(-pc.px, -pc.py); }
  g.drawImage(pc.c, pc.ox, pc.oy);
  if (fn) fn();
  g.restore();
}
function rotPt([x, y], [cx, cy], a) { a *= D2R; const dx = x - cx, dy = y - cy; return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)]; }
function sampleColor(src, pts) {
  const g = src.getContext('2d'); let r = 0, gg = 0, b = 0;
  for (const [x, y] of pts) { const d = g.getImageData(x, y, 1, 1).data; r += d[0]; gg += d[1]; b += d[2]; }
  return `rgb(${r / pts.length | 0},${gg / pts.length | 0},${b / pts.length | 0})`;
}

const R = {};
function buildRig(S) {
  // SIDE (faces left)
  const sideArm = [[640, 418], [650, 470], [652, 525], [658, 560], [632, 615], [628, 650], [628, 672], [616, 690], [610, 730], [618, 756], [640, 760], [656, 752], [666, 730], [664, 700], [674, 684], [680, 640], [684, 580], [688, 500], [690, 445], [686, 418], [666, 408]];
  R.sArm = piece(S, sideArm, [664, 440]);
  R.sArmB = shadeCopy(R.sArm, 'rgba(15,20,45,0.38)');
  R.sUpper = piece(S, [[560, 195], [760, 195], [760, 676], [560, 676]], [660, 660]);
  fillAtop(R.sUpper, sideArm, HOODIE);
  R.sThigh = piece(S, rectPoly(560, 668, 760, 888), [661, 700]);
  fillAtop(R.sThigh, sideArm, JEANS);
  R.sShin = piece(S, rectPoly(560, 862, 760, 1092), [661, 876]);
  R.sThighB = shadeCopy(R.sThigh, 'rgba(10,12,30,0.45)');
  R.sShinB = shadeCopy(R.sShin, 'rgba(10,12,30,0.45)');
  R.sSkin = sampleColor(S, [[598, 325], [605, 330]]);

  // FRONT
  const fHead = [[213, 250], [238, 206], [300, 196], [342, 222], [352, 300], [347, 360], [330, 386], [300, 397], [270, 400], [240, 392], [220, 372], [209, 320]];
  const fArmUp = [[182, 370], [150, 393], [131, 440], [123, 520], [119, 578], [197, 578], [196, 520], [197, 450], [202, 408]];
  const fArmLo = [[117, 548], [197, 548], [196, 600], [194, 665], [186, 690], [174, 708], [178, 745], [162, 762], [138, 757], [124, 737], [121, 700], [117, 676]];
  const fHand = [[119, 674], [184, 674], [182, 690], [174, 708], [178, 745], [162, 763], [138, 758], [124, 738], [121, 700]];
  R.fBody = piece(S, [[100, 195], [362, 195], [362, 335], [462, 335], [462, 1092], [100, 1092]], [280, 1078]);
  erase(R.fBody, fHead); erase(R.fBody, fArmUp); erase(R.fBody, fArmLo);
  {
    const g = R.fBody.c.getContext('2d');
    g.save(); g.translate(-R.fBody.ox, -R.fBody.oy);
    g.fillStyle = '#7d8492'; polyPath(g, fHead.map(([x, y]) => [lerp(x, 278, 0.08), lerp(y, 300, 0.08)])); g.fill();
    g.globalCompositeOperation = 'destination-over';
    g.fillStyle = HOODIE; g.beginPath(); g.moveTo(205, 405); g.lineTo(178, 420); g.lineTo(186, 470); g.lineTo(192, 668); g.lineTo(205, 668); g.closePath(); g.fill();
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = LINE; g.lineWidth = 3; g.beginPath(); g.moveTo(186, 470); g.lineTo(192, 668); g.stroke();
    g.restore();
  }
  R.fHead = piece(S, fHead, [278, 392]);
  R.fHand = piece(S, fHand, [151, 680]);
  R.fSleeve = sampleColor(S, [[150, 470], [155, 520], [150, 610]]);
  R.fSkin = sampleColor(S, [[262, 322], [300, 324], [258, 330]]);

  // CHINTA bust
  R.cBust = piece(S, [[1285, 195], [1522, 195], [1522, 330], [1585, 330], [1585, 562], [1285, 562]], [1430, 560]);
  R.cSkin = sampleColor(S, [[1388, 318], [1428, 318]]);

  // PHONE full body
  const pHead = [[1718, 260], [1740, 210], [1785, 198], [1830, 210], [1852, 260], [1852, 340], [1838, 380], [1810, 398], [1780, 402], [1750, 396], [1728, 378], [1716, 330]];
  R.pBody = piece(S, [[1700, 195], [1962, 195], [1962, 1092], [1615, 1092], [1615, 752], [1686, 744], [1686, 572], [1615, 566], [1615, 372], [1700, 368]], [1785, 1078]);
  erase(R.pBody, pHead);
  { const g = R.pBody.c.getContext('2d'); g.save(); g.translate(-R.pBody.ox, -R.pBody.oy); g.globalCompositeOperation = 'destination-over'; g.fillStyle = '#7d8492'; polyPath(g, pHead.map(([x, y]) => [lerp(x, 1785, 0.08), lerp(y, 300, 0.08)])); g.fill(); g.restore(); }
  R.pHead = piece(S, pHead, [1785, 395]);

  // BACK view
  R.bBody = piece(S, rectPoly(862, 195, 1210, 1092), [1035, 1078]);
}

// ---------- mouths (lip-sync) ----------
function mouthFront(g, cx, cy, w, o) {
  if (o < 0.07) return;
  const h = 1.5 + o * 8.5, mw = w * (0.6 + 0.2 * o), y = cy + h * 0.32;
  g.save();
  g.beginPath(); g.ellipse(cx, y, mw / 2, h / 2, 0, 0, 7);
  g.fillStyle = '#3b1214'; g.fill();
  g.save(); g.clip();
  if (o > 0.25) { g.fillStyle = '#f4f1ea'; g.fillRect(cx - mw / 2, y - h / 2, mw, h * 0.3); }
  if (o > 0.4) { g.fillStyle = '#b8505a'; g.beginPath(); g.ellipse(cx, y + h * 0.42, mw * 0.32, h * 0.3, 0, 0, 7); g.fill(); }
  g.restore();
  g.lineWidth = 1.6; g.strokeStyle = LINE; g.beginPath(); g.ellipse(cx, y, mw / 2, h / 2, 0, 0, 7); g.stroke();
  g.restore();
}
function mouthSide(g, o) {
  if (o < 0.07) return;
  const d = o * 7;
  g.save(); g.fillStyle = '#3b1214'; g.strokeStyle = LINE; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(585, 338.5); g.lineTo(602, 339.5); g.lineTo(590, 339.5 + d); g.lineTo(586, 338.5 + d * 0.85); g.closePath(); g.fill(); g.stroke();
  g.restore();
}
function blinkEyes(g, eyes, amt, skin) {
  if (amt <= 0) return;
  for (const [x, y, w, h] of eyes) {
    g.save(); g.fillStyle = skin;
    g.beginPath(); g.ellipse(x, y - h * (1 - amt), w, h * amt + 1, 0, 0, 7); g.fill();
    if (amt > 0.6) { g.strokeStyle = LINE; g.lineWidth = 2; g.beginPath(); g.moveTo(x - w, y + 1); g.quadraticCurveTo(x, y + h * 0.7, x + w, y + 1); g.stroke(); }
    g.restore();
  }
}
// periodic natural blinks
function blinkAuto(t, seed = 0) {
  const period = 3.3 + hash(seed) * 1.2, ph = ((t + seed * 1.7) % period) / period * period;
  const d = Math.abs(ph - 0.1); return d < 0.09 ? 1 - d / 0.09 : 0;
}

// continuous sleeve front arm
function frontArm(g, a1, a2, pass) {
  const dir = a => [-Math.sin(a * D2R), Math.cos(a * D2R)];
  const S0 = [168, 422], L1 = 141.4, L2 = 117.2, Wd = 68;
  const d1 = dir(a1), d2 = dir(a1 + a2);
  const E = [S0[0] + L1 * d1[0], S0[1] + L1 * d1[1]], Wr = [E[0] + L2 * d2[0], E[1] + L2 * d2[1]];
  const path = () => { g.beginPath(); g.moveTo(S0[0], S0[1]); g.lineTo(E[0], E[1]); g.lineTo(Wr[0], Wr[1]); };
  g.save(); g.lineJoin = 'round'; g.lineCap = 'butt';
  if (pass === 'outline') {
    g.strokeStyle = LINE; g.lineWidth = Wd + 7; path(); g.stroke();
    g.fillStyle = LINE; g.beginPath(); g.arc(S0[0], S0[1], (Wd + 7) / 2, 0, 7); g.fill();
  } else {
    g.strokeStyle = R.fSleeve; g.lineWidth = Wd; path(); g.stroke();
    g.fillStyle = R.fSleeve; g.beginPath(); g.arc(S0[0], S0[1], Wd / 2, 0, 7); g.fill();
    const n = d => [d[1], -d[0]], n1 = n(d1), n2 = n(d2);
    g.strokeStyle = 'rgba(120,128,145,0.45)'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(S0[0] - n1[0] * 22 + d1[0] * 40, S0[1] - n1[1] * 22 + d1[1] * 40); g.lineTo(E[0] - n1[0] * 22 - d1[0] * 12, E[1] - n1[1] * 22 - d1[1] * 12); g.stroke();
    g.beginPath(); g.moveTo(E[0] - n2[0] * 22 + d2[0] * 14, E[1] - n2[1] * 22 + d2[1] * 14); g.lineTo(Wr[0] - n2[0] * 22 - d2[0] * 26, Wr[1] - n2[1] * 22 - d2[1] * 26); g.stroke();
    g.strokeStyle = LINE; g.lineWidth = 3;
    const c = [Wr[0] - d2[0] * 16, Wr[1] - d2[1] * 16];
    g.beginPath(); g.moveTo(c[0] - n2[0] * (Wd / 2 - 1), c[1] - n2[1] * (Wd / 2 - 1)); g.lineTo(c[0] + n2[0] * (Wd / 2 - 1), c[1] + n2[1] * (Wd / 2 - 1)); g.stroke();
    g.translate(Wr[0], Wr[1]); g.rotate((a1 + a2 - 2.94) * D2R);
    g.drawImage(R.fHand.c, R.fHand.ox - R.fHand.px, R.fHand.oy - R.fHand.py);
  }
  g.restore();
}

// ---------- character drawers (world coords) ----------
// st: {t, mouth, up (0..1 arm raise), wave (deg osc), headRot, squash}
function drawFront(g, X, Y, s, st, anchor = [280, 1078]) {
  const t = st.t, breath = Math.sin(t * 2.6) * 0.008;
  const up = st.up || 0, wave = st.wave || 0;
  const a1 = 4.46 + lerp(3 * Math.sin(t * 2.6), st.upAng || 64, up);
  const a2 = -1.5 + lerp(0, st.loAng || 92, up) + wave;
  g.save(); g.translate(X, Y); g.scale(s * (st.sx || 1), s * (1 + breath) * (st.sy || 1)); g.translate(-anchor[0], -anchor[1]);
  frontArm(g, a1, a2, 'outline');
  drawP(g, R.fBody);
  frontArm(g, a1, a2, 'fill');
  const hr = (st.headRot != null ? st.headRot : Math.sin(t * 1.7) * 1.8) - up * 2;
  drawP(g, R.fHead, hr, () => {
    blinkEyes(g, [[262, 311, 10, 6], [299, 313, 10, 6]], blinkAuto(t, 1), R.fSkin);
    mouthFront(g, 281.5, 353.5, 30, st.mouth || 0);
  });
  g.restore();
}
function drawPhone(g, X, Y, s, st) {
  const t = st.t;
  g.save(); g.translate(X, Y); g.scale(s, s * (1 + Math.sin(t * 2.6) * 0.007)); g.translate(-1785, -1078);
  drawP(g, R.pBody);
  drawP(g, R.pHead, st.headRot != null ? st.headRot : Math.sin(t * 1.5) * 1.5, () => mouthFront(g, 1784, 355, 32, st.mouth || 0));
  g.restore();
}
function drawBack(g, X, Y, s, st) {
  g.save(); g.translate(X, Y); g.scale(s, s * (1 + Math.sin(st.t * 2.6) * 0.007)); g.translate(-1035, -1078);
  drawP(g, R.bBody, Math.sin(st.t * 1.2) * 0.6); g.restore();
}
function drawChinta(g, X, Y, z, st) {
  const t = st.t;
  g.save(); g.translate(X, Y); g.scale(z, z * (1 + Math.sin(t * 2.4) * 0.006)); g.rotate((Math.sin(t * 1.3) * 1.2 - 1) * D2R); g.translate(-1430, -560);
  drawP(g, R.cBust, 0, () => {
    blinkEyes(g, [[1388, 306, 10, 6], [1428, 306, 10, 6]], blinkAuto(t, 2), R.cSkin);
    mouthFront(g, 1408, 347, 26, st.mouth || 0);
  });
  g.restore();
}
// side walk; p = cycle phase, e = walk amount (0 = standing)
function drawSide(g, X, Y, s, st) {
  const p = st.p || 0, e = st.e != null ? st.e : 1;
  const A = 18 * e, K = 40 * e, AR = 22 * e;
  const legs = ph => [A * Math.sin(2 * Math.PI * ph), -K * Math.pow(Math.max(0, Math.cos(2 * Math.PI * ph)), 1.3)];
  const [t1, k1] = legs(p), [t2, k2] = legs(p + 0.5);
  const foot = (th, kn) => rotPt(rotPt([640, 1076], [661, 876], kn), [661, 700], th)[1];
  const drop = 1076 - Math.max(foot(t1, k1), foot(t2, k2));
  g.save(); g.translate(X, Y + drop * s); g.scale(s * (st.flip ? -1 : 1), s); g.translate(-661, -1076);
  const arm = AR * Math.sin(2 * Math.PI * p);
  drawP(g, R.sArmB, arm);
  drawP(g, R.sThighB, t2, () => drawP(g, R.sShinB, k2));
  drawP(g, R.sThigh, t1, () => drawP(g, R.sShin, k1));
  g.save(); g.translate(661, 700); g.rotate(-2.5 * e * D2R); g.translate(-661, -700);
  drawP(g, R.sUpper, 0, () => mouthSide(g, st.mouth || 0));
  drawP(g, R.sArm, -arm);
  g.restore();
  g.restore();
}
function shadow(g, x, y, w, a = 0.3) { g.save(); g.fillStyle = `rgba(0,0,0,${a})`; g.beginPath(); g.ellipse(x, y, w, w * 0.14, 0, 0, 7); g.fill(); g.restore(); }
