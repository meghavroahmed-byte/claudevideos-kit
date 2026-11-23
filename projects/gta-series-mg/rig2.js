// ===== Full-body rig v2 for the user's character (front + side views) =====
// Head/torso/hands/shoes are cut from the user's own sheet; sleeves and jeans are drawn as jointed tubes
// so arms and legs can bend at elbow/knee. Needs rigcore.js (piece, erase, drawP, R, mouthFront, mouthSide, blinkEyes...).
const R2 = {};
const V = (x, y) => [x, y];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k], len = a => Math.hypot(a[0], a[1]);
const dirA = a => [Math.sin(a * D2R), Math.cos(a * D2R)]; // 0 = straight down, +90 = pointing +x
function ik2(S, T, L1, L2, bend) { // returns elbow/knee; bend = +1/-1 picks side
  let d = sub(T, S), D = len(d); D = Math.min(Math.max(D, Math.abs(L1 - L2) + 1), L1 + L2 - 0.5); const u = mul(d, 1 / (len(d) || 1)); const a = (L1 * L1 - L2 * L2 + D * D) / (2 * D), h = Math.sqrt(Math.max(0, L1 * L1 - a * a)); const n = [-u[1] * bend, u[0] * bend]; const E = add(add(S, mul(u, a)), mul(n, h)); return [E, add(S, mul(u, D))];
}
function tube(g, pts, ws, fill, o = {}) {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  for (const pass of [0, 1]) { for (let i = 0; i < pts.length - 1; i++) { const w = (ws[i] + ws[i + 1]) / 2; g.strokeStyle = pass ? fill : LINE; g.lineWidth = pass ? w : w + 8; g.beginPath(); g.moveTo(...pts[i]); g.lineTo(...pts[i + 1]); g.stroke(); } }
  if (o.crease) { g.strokeStyle = o.crease; g.lineWidth = 6; for (let i = 0; i < pts.length - 1; i++) { const d = sub(pts[i + 1], pts[i]), L = len(d), u = mul(d, 1 / L), n = [-u[1], u[0]], w = ws[i] * 0.28 * (o.side || 1); g.beginPath(); g.moveTo(...add(add(pts[i], mul(u, L * 0.18)), mul(n, w))); g.lineTo(...add(add(pts[i], mul(u, L * 0.82)), mul(n, w))); g.stroke(); } }
  g.restore();
}
function cuffLine(g, A, B, w) { const d = sub(B, A), u = mul(d, 1 / len(d)), n = [-u[1], u[0]], c = sub(B, mul(u, 16)); g.save(); g.strokeStyle = LINE; g.lineWidth = 3; g.beginPath(); g.moveTo(...add(c, mul(n, w / 2 - 1))); g.lineTo(...sub(c, mul(n, w / 2 - 1))); g.stroke(); g.restore(); }
function drawAt(g, pc, P, ang, flip) { g.save(); g.translate(P[0], P[1]); g.rotate(ang * D2R); if (flip) g.scale(-1, 1); g.drawImage(pc.c, pc.ox - pc.px, pc.oy - pc.py); g.restore(); }

function buildRig2(S) {
  buildRig(S);
  R2.jeans = sampleColor(S, [[230, 800], [250, 900], [340, 820]]); R2.jeansHi = 'rgba(90,96,120,0.55)';
  R2.sleeve = R.fSleeve; R2.sleeveHi = 'rgba(120,128,145,0.45)';
  // FRONT torso (no head, no arms, no legs)
  const fHead = [[213, 250], [238, 206], [300, 196], [342, 222], [352, 300], [347, 360], [330, 386], [300, 397], [270, 400], [240, 392], [220, 372], [209, 320]];
  const lArm = [[182, 370], [150, 393], [131, 440], [123, 520], [119, 578], [117, 676], [124, 737], [138, 757], [162, 762], [178, 745], [186, 690], [194, 665], [196, 600], [197, 450], [202, 408]];
  const rArm = [[368, 392], [405, 398], [430, 410], [442, 470], [442, 555], [422, 640], [400, 690], [372, 694], [378, 600], [382, 500], [378, 440]];
  R2.fTorso = piece(S, [[100, 330], [205, 330], [208, 195], [360, 195], [362, 335], [470, 335], [470, 672], [100, 672]], [280, 400]);
  erase(R2.fTorso, fHead); erase(R2.fTorso, lArm); erase(R2.fTorso, rArm);
  erase(R2.fTorso, [[346, 640], [400, 640], [400, 680], [346, 680]]); // pocket-hand wedge from the sheet
  erase(R2.fTorso, [[386, 445], [470, 445], [470, 680], [388, 680]]); erase(R2.fTorso, [[100, 445], [189, 445], [187, 680], [100, 680]]); // anything outside the torso sides
  erase(R2.fTorso, [[392, 330], [470, 330], [470, 445], [386, 445]]); erase(R2.fTorso, [[100, 330], [176, 330], [182, 445], [100, 445]]);
  { const g = R2.fTorso.c.getContext('2d'); g.save(); g.translate(-R2.fTorso.ox, -R2.fTorso.oy); g.fillStyle = '#7d8492'; polyPath(g, fHead.map(([x, y]) => [lerp(x, 278, 0.08), lerp(y, 300, 0.08)])); g.fill();
    g.globalCompositeOperation = 'destination-over'; g.fillStyle = HOODIE; polyPath(g, [[196, 400], [380, 400], [386, 668], [190, 668]]); g.fill(); g.globalCompositeOperation = 'source-over';
    g.strokeStyle = LINE; g.lineWidth = 4; g.beginPath(); g.moveTo(193, 450); g.lineTo(190, 666); g.moveTo(381, 450); g.lineTo(386, 666); g.moveTo(340, 667); g.lineTo(387, 667); g.stroke();
    g.strokeStyle = 'rgba(150,156,170,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(340, 655); g.lineTo(384, 655); g.stroke(); g.restore(); }
  R2.fHead = piece(S, fHead, [278, 392]);
  R2.fHand = piece(S, [[119, 674], [184, 674], [182, 690], [174, 708], [178, 745], [162, 763], [138, 758], [124, 738], [121, 700]], [151, 680]);
  R2.fShoeL = piece(S, [[150, 1010], [226, 1010], [238, 1040], [234, 1074], [140, 1076], [136, 1050]], [190, 1012]);
  R2.fShoeR = piece(S, [[338, 1010], [412, 1010], [428, 1050], [426, 1076], [334, 1074], [330, 1040]], [378, 1012]);
  // SIDE (faces left): head+torso, arm painted out
  const sideArm = [[640, 418], [650, 470], [652, 525], [658, 560], [632, 615], [628, 650], [628, 672], [616, 690], [610, 730], [618, 756], [640, 760], [656, 752], [666, 730], [664, 700], [674, 684], [680, 640], [684, 580], [688, 500], [690, 445], [686, 418], [666, 408]];
  R2.sUpper = piece(S, [[560, 195], [760, 195], [760, 672], [560, 672]], [662, 690]); fillAtop(R2.sUpper, sideArm, HOODIE);
  { const g = R2.sUpper.c.getContext('2d'); g.save(); g.translate(-R2.sUpper.ox, -R2.sUpper.oy); g.strokeStyle = 'rgba(120,128,145,0.5)'; g.lineWidth = 5; g.beginPath(); g.moveTo(640, 430); g.quadraticCurveTo(655, 560, 640, 660); g.stroke(); g.restore(); }
  R2.sHand = piece(S, [[628, 668], [676, 668], [674, 684], [666, 700], [666, 730], [656, 752], [640, 760], [618, 756], [610, 730], [616, 690], [626, 676]], [650, 676]);
  R2.sShoe = piece(S, [[572, 1012], [636, 998], [702, 996], [714, 1030], [710, 1076], [570, 1076], [562, 1050]], [672, 1006]);
  R2.sSkin = R.sSkin;
  // EXPRESSION heads from the sheet: angry bust + confused (phone figure)
  R2.hAngry = piece(S, [[1352, 700], [1362, 640], [1395, 605], [1430, 597], [1468, 605], [1498, 640], [1510, 700], [1505, 760], [1490, 790], [1460, 805], [1425, 808], [1392, 800], [1365, 785], [1352, 750]], [1424.5, 721]);
  R2.angrySkin = sampleColor(S, [[1410, 745], [1440, 745]]);
  R2.hConf = R.pHead; R2.confSkin = sampleColor(S, [[1770, 335], [1800, 335]]);
  // BACK view
  R2.bTorso = piece(S, [[958, 195], [1112, 195], [1130, 390], [1136, 445], [1132, 672], [940, 672], [936, 445], [940, 390]], [1035, 400]);
  { const g = R2.bTorso.c.getContext('2d'); g.save(); g.translate(-R2.bTorso.ox, -R2.bTorso.oy); g.strokeStyle = LINE; g.lineWidth = 4; g.beginPath(); g.moveTo(940, 445); g.lineTo(940, 668); g.moveTo(1131, 445); g.lineTo(1131, 668); g.stroke(); g.restore(); }
  R2.bHand = piece(S, [[880, 674], [940, 674], [938, 700], [936, 740], [925, 757], [904, 757], [886, 737], [879, 700]], [910, 678]);
  R2.bShoeL = piece(S, [[915, 1022], [990, 1022], [997, 1050], [992, 1076], [908, 1076], [903, 1050]], [953, 1024]);
  R2.bShoeR = piece(S, [[1078, 1022], [1152, 1022], [1160, 1050], [1155, 1076], [1074, 1076], [1070, 1050]], [1115, 1024]);
}
// ---------- procedural hand with fingers (front/back views) ----------
// pose: {curl:[thumb,index,middle,ring,pinky] 0..1, spread} or a preset name
const HANDS = { open: { curl: [0, 0, 0, 0, 0], spread: 0.25 }, relax: { curl: [0.2, 0.25, 0.3, 0.35, 0.4], spread: 0.1 }, fist: { curl: [0.9, 1, 1, 1, 1], spread: 0 }, point: { curl: [0.8, 0, 1, 1, 1], spread: 0 }, peace: { curl: [0.9, 0, 0, 1, 1], spread: 0.35 }, thumb: { curl: [-1, 1, 1, 1, 1], spread: 0 }, grip: { curl: [0.55, 0.65, 0.65, 0.65, 0.65], spread: 0 }, three: { curl: [0.9, 0, 0, 0, 1], spread: 0.3 } };
function handV(g, P, ang, mirror, pose, skin, t = 0) {
  const ps = typeof pose === 'string' ? HANDS[pose] : pose; const cu = ps.curl, sp = ps.spread || 0;
  g.save(); g.translate(P[0], P[1]); g.rotate(ang * D2R); if (mirror) g.scale(-1, 1); g.lineCap = 'round'; g.lineJoin = 'round';
  const fing = (x, L, c, a, w) => { const bend = clamp(c); const seg1 = L * 0.5 * (1 - bend * 0.6), seg2 = L * 0.5 * (1 - bend * 0.75); const d1 = dirA(a), p1 = [x, 34], p2 = add(p1, mul(d1, seg1)), p3 = add(p2, mul(dirA(a + bend * 160), seg2)); return [[p1, p2, p3], w]; };
  const F = [fing(-14, 50, cu[1], 10 * sp + 3, 11), fing(-4, 56, cu[2], 3 * sp, 11.5), fing(6, 52, cu[3], -6 * sp, 11), fing(15, 42, cu[4], -15 * sp - 4, 10)];
  const thC = cu[0], thA = thC < 0 ? lerp(-32, -100, -thC) : lerp(-32, 25, clamp(thC)); const T1 = [-18, 8], T2 = add(T1, mul(dirA(thA), 26)), T3 = add(T2, mul(dirA(thA + (thC > 0 ? thC * 50 : 0)), 22));
  const strokeLimb = (pts, w, pass) => { g.strokeStyle = pass ? skin : LINE; g.lineWidth = pass ? w : w + 6; g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.stroke(); };
  // outline pass then fill pass (palm, fingers, thumb)
  for (const pass of [0, 1]) { g.fillStyle = pass ? skin : LINE; g.beginPath(); g.roundRect(-21 - (pass ? 0 : 3), -4 - (pass ? 0 : 3), 42 + (pass ? 0 : 6), 44 + (pass ? 0 : 6), 14); g.fill(); }
  [3, 2, 1, 0].forEach(i => { const [pts, w] = F[i]; strokeLimb(pts, w, 0); strokeLimb(pts, w, 1); });
  strokeLimb([T1, T2, T3], 13, 0); strokeLimb([T1, T2, T3], 13, 1);
  g.strokeStyle = 'rgba(90,50,30,0.35)'; g.lineWidth = 2.5; F.forEach(([pts]) => { if (len(sub(pts[2], pts[1])) > 8) { const m = pts[1]; g.beginPath(); g.moveTo(m[0] - 5, m[1]); g.lineTo(m[0] + 5, m[1]); g.stroke(); } });
  g.restore();
}
// ---------- faces ----------
function headF(g, hr, p, t) {
  const face = p.face || 'normal', bl = p.blink != null ? p.blink : blinkAuto(t, 1), m = p.mouth || 0;
  g.save(); g.translate(278, 392); g.rotate(hr * D2R); g.translate(-278, -392);
  if (face === 'angry' || face === 'confused') {
    const pc = face === 'angry' ? R2.hAngry : R2.hConf, sc = face === 'angry' ? 0.82 : 1, ec = face === 'angry' ? [1424.5, 721] : [1783.5, 315];
    g.drawImage(R2.fHead.c, R2.fHead.ox, R2.fHead.oy); g.save(); g.beginPath(); [[230, 252], [250, 217], [285, 209], [318, 222], [336, 262], [338, 330], [326, 373], [300, 392], [268, 394], [242, 383], [228, 350], [224, 300]].forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip();
    g.save(); g.translate(280.5, 312); g.scale(sc, sc); g.translate(-ec[0], -ec[1]); g.drawImage(pc.c, pc.ox, pc.oy);
    if (face === 'angry') { blinkEyes(g, [[1402, 721, 12, 7], [1447, 721, 12, 7]], bl, R2.angrySkin); if (m > 0.15) mouthFront(g, 1426, 772, 30, m); }
    else { blinkEyes(g, [[1765, 315, 10, 6], [1802, 315, 10, 6]], bl, R2.confSkin); mouthFront(g, 1784, 355, 30, m); }
    g.restore(); g.restore(); g.restore(); return;
  }
  g.drawImage(R2.fHead.c, R2.fHead.ox, R2.fHead.oy);
  blinkEyes(g, [[262, 311, 10, 6], [299, 313, 10, 6]], face === 'happy' ? Math.max(bl, 0.35) : bl, R.fSkin);
  const brow = (x0, y0, x1, y1) => { g.save(); g.strokeStyle = '#1b1414'; g.lineWidth = 6.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.restore(); };
  const skinPatch = (x, y, w, h) => { g.save(); g.fillStyle = R.fSkin; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, 7); g.fill(); g.restore(); };
  if (face === 'sad') { skinPatch(262, 296, 17, 6); brow(249, 300, 275, 290); brow(292, 289, 306, 294);
    g.save(); g.strokeStyle = '#3b1214'; g.lineWidth = 3.5; g.lineCap = 'round'; g.beginPath(); g.arc(281, 372, 14, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); g.restore();
    const tp = (t * 0.6) % 1; g.save(); g.globalAlpha = 1 - tp; g.fillStyle = '#8fd3ff'; g.strokeStyle = '#3a7fb0'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(254, 322 + tp * 40, 4, 6, 0, 0, 7); g.fill(); g.stroke(); g.restore(); }
  else if (face === 'happy') { skinPatch(262, 296, 17, 6); brow(249, 293, 275, 291); g.save(); g.fillStyle = '#3b1214'; g.beginPath(); g.moveTo(265, 352); g.quadraticCurveTo(281, 372, 299, 352); g.closePath(); g.fill(); g.fillStyle = '#f4f1ea'; g.beginPath(); g.moveTo(267, 353); g.quadraticCurveTo(281, 358, 297, 353); g.lineTo(296, 356); g.quadraticCurveTo(281, 361, 268, 356); g.closePath(); g.fill(); g.restore();
    g.save(); g.fillStyle = 'rgba(230,120,100,0.28)'; g.beginPath(); g.ellipse(250, 335, 10, 6, 0, 0, 7); g.ellipse(310, 337, 10, 6, 0, 0, 7); g.fill(); g.restore(); }
  else if (face === 'surprised') { skinPatch(262, 296, 17, 6); brow(249, 287, 275, 284); mouthFront(g, 281.5, 353.5, 22, Math.max(0.85, m)); }
  else mouthFront(g, 281.5, 353.5, 30, m);
  if (p.cheek) { g.fillStyle = R.fSkin; g.beginPath(); g.ellipse(306, 348, 14 * p.cheek, 10 * p.cheek, 0, 0, 7); g.fill(); }
  g.restore();
}
// ---------------- BACK view (walking away) ----------------
function drawCharB(g, X, Y, s, p) {
  const t = p.t || 0, b = p.body || {};
  g.save(); g.translate(X, Y); g.scale(s * (b.sx || 1), s * (b.sy || 1) * (1 + Math.sin(t * 2.6) * 0.006)); g.translate(-1035, -1076); g.translate(b.dx || 0, b.dy || 0); if (b.rot) { g.translate(1035, 700); g.rotate(b.rot * D2R); g.translate(-1035, -700); }
  const leg = (hip, q, side) => { const lift = q.lift || 0, a = (q.a || 0) * side; const K = add(hip, mul(dirA(a), 150 * (1 - 0.15 * lift))); const A = add(K, mul(dirA(a * 0.3), 158 * (1 - 0.5 * lift))); return [hip, K, add(A, [0, 0])]; };
  const LL = leg([1000, 700], p.legL || {}, -1), RL = leg([1072, 700], p.legR || {}, 1);
  for (const [L, sh, side, q] of [[LL, R2.bShoeL, -1, p.legL || {}], [RL, R2.bShoeR, 1, p.legR || {}]]) { g.save(); const lf = q.lift || 0; g.translate(L[2][0], L[2][1]); g.scale(1, 1 - 0.55 * lf); g.translate(-L[2][0], -L[2][1]); drawAt(g, sh, add(L[2], [0, 4]), 0, false); g.restore(); tube(g, L, [78, 70, 62], R2.jeans, { crease: R2.jeansHi, side: side }); }
  g.save(); g.fillStyle = R2.jeans; g.strokeStyle = LINE; g.lineWidth = 4; g.beginPath(); g.moveTo(944, 650); g.lineTo(1128, 650); g.lineTo(1126, 730); g.quadraticCurveTo(1080, 738, 1036, 760); g.quadraticCurveTo(992, 738, 946, 730); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = 'rgba(90,96,120,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(1036, 680); g.lineTo(1036, 755); g.stroke(); g.restore();
  drawP(g, R2.bTorso);
  const arm = (Sh, q, side) => { const a = (q.a || 0) * side, e = (q.e || 0) * side; const E = add(Sh, mul(dirA(a), 141)), W = add(E, mul(dirA(a + e), 118)); return [Sh, E, W]; };
  for (const [Sh, q, side] of [[[924, 430], p.armL || {}, -1], [[1146, 430], p.armR || {}, 1]]) { const A = arm(Sh, q, side); tube(g, A, [64, 62, 58], R2.sleeve, { crease: R2.sleeveHi, side }); cuffLine(g, A[1], A[2], 58); const d = sub(A[2], A[1]); drawAt(g, R2.bHand, A[2], Math.atan2(-d[0], d[1]) / D2R, side > 0); }
  g.restore();
}
// ---------------- FRONT view ----------------
// p: {t, mouth, blink, head (deg), body:{dx,dy,rot,sx,sy}, armL/armR: {a, e} (deg, outward +) or {to:[x,y]}, legL/legR: {a, k, lift}, item:{type, hand:'R'|'L', bite}}
function drawCharF(g, X, Y, s, p) {
  const t = p.t || 0, b = p.body || {}, br = Math.sin(t * 2.6) * 0.006;
  g.save(); g.translate(X, Y); g.scale(s * (b.sx || 1) * (p.flip ? -1 : 1), s * (b.sy || 1) * (1 + br)); g.translate(-280, -1076);
  g.translate(b.dx || 0, b.dy || 0); if (b.rot) { g.translate(280, 700); g.rotate(b.rot * D2R); g.translate(-280, -700); }
  // legs
  const leg = (hip, q, side) => { const thighL = 150, shinL = 158; const lift = q.lift || 0; const a = (q.a || 0) * side; const K = add(hip, mul(dirA(a), thighL * (1 - 0.45 * lift))); const A = add(K, mul(dirA(a * 0.3 + (q.k || 0) * side * 0.15), shinL)); return [hip, K, A]; };
  const LL = leg([246, 700], p.legL || {}, -1), RL = leg([332, 700], p.legR || {}, 1);
  for (const [L, sh, side] of [[LL, R2.fShoeL, -1], [RL, R2.fShoeR, 1]]) { drawAt(g, sh, add(L[2], [0, 4]), ((p[side < 0 ? 'legL' : 'legR'] || {}).foot || 0) * side, false); tube(g, L, [76, 68, 60], R2.jeans, { crease: R2.jeansHi, side: -side }); }
  // pelvis / waistband
  g.save(); g.fillStyle = R2.jeans; g.strokeStyle = LINE; g.lineWidth = 4; g.beginPath(); g.moveTo(198, 650); g.lineTo(380, 650); g.lineTo(378, 712); g.quadraticCurveTo(330, 712, 290, 742); g.quadraticCurveTo(246, 712, 200, 712); g.closePath(); g.fill(); g.stroke(); g.restore();
  drawP(g, R2.fTorso);
  // arms
  const arm = (Sh, q, side) => { const L1 = 141, L2 = 120; let E, W; if (q.to) { [E, W] = ik2(Sh, q.to, L1, L2, q.bend || -side); } else { const a = (q.a || 0) * side, e = (q.e || 0) * side; E = add(Sh, mul(dirA(a), L1)); W = add(E, mul(dirA(a + e), L2)); } return [Sh, E, W]; };
  const AL = arm([186, 438], p.armL || {}, -1), AR = arm([382, 438], p.armR || {}, 1);
  const handAng = (A) => { const d = sub(A[2], A[1]); return Math.atan2(-d[0], d[1]) / D2R; };
  const drawArm = (A, side, front) => { tube(g, A, [64, 62, 58], R2.sleeve, { crease: R2.sleeveHi, side }); cuffLine(g, A[1], A[2], 58); const hp = side > 0 ? p.handR : p.handL; if (hp) handV(g, A[2], handAng(A), side > 0, hp, R.fSkin, t); else drawAt(g, R2.fHand, A[2], handAng(A) + (side > 0 ? 4 : -4), side > 0); };
  // item held behind fingers
  const itemAt = (A, it) => { if (!it) return; const P = add(A[2], mul(dirA(handAng(A)), 46)); drawItem(g, it, P, t); };
  drawArm(AL, -1); if (p.item && p.item.hand === 'L') itemAt(AL, p.item);
  drawArm(AR, 1); if (p.item && p.item.hand !== 'L') itemAt(AR, p.item);
  // head
  const hr = p.head != null ? p.head : Math.sin(t * 1.7) * 1.8;
  headF(g, hr, p, t);
  g.restore();
}
// ---------------- SIDE view (faces left; flip to face right) ----------------
// p: {t, mouth, body:{dx,dy,rot}, near/far arm {a,e} (deg, + = forward) or {to}, near/far leg {a,k,f} (deg, + forward; k knee bend; f foot)}
function drawCharS(g, X, Y, s, p) {
  const t = p.t || 0, b = p.body || {};
  g.save(); g.translate(X, Y); g.scale(s * (p.flip ? -1 : 1) * (b.sx || 1), s * (b.sy || 1)); g.translate(-662, -1076); g.translate(b.dx || 0, b.dy || 0);
  const HIP = [662, 700], SH = [662, 440];
  const legPts = q => { const a = -(q.a || 0), k = q.k || 0; const K = add(HIP, mul(dirA(a), 152)); const A = add(K, mul(dirA(a + k), 158)); return [HIP, K, A, a + k]; };
  const armPts = (q, sh) => { if (q.to) { const [E, W] = ik2(sh, q.to, 125, 112, q.bend || 1); return [sh, E, W]; } const a = -(q.a || 0), e = -(q.e || 0); const E = add(sh, mul(dirA(a), 125)); return [sh, E, add(E, mul(dirA(a + e), 112))]; };
  const shade = (fn) => { g.save(); g.filter = 'brightness(0.72)'; fn(); g.restore(); };
  if (p.ground) { const ay = q => { const a = -(q.a || 0), k = q.k || 0; return HIP[1] + dirA(a)[1] * 152 + dirA(a + k)[1] * 158; }; const dy = 1010 - Math.max(ay(p.nearLeg || {}), ay(p.farLeg || {})); g.translate(0, dy); }
  const rot = b.rot || 0, shR = rotPt(SH, HIP, rot);
  const drawLeg = (L, q) => { drawAt(g, R2.sShoe, L[2], -(L[3] * 0.0) - (q.f || 0), false); tube(g, L.slice(0, 3), [94, 76, 62], R2.jeans, { crease: R2.jeansHi, side: 1 }); };
  const drawArmS = (A) => { tube(g, A, [54, 50, 46], R2.sleeve, { crease: R2.sleeveHi, side: 1 }); cuffLine(g, A[1], A[2], 46); const d = sub(A[2], A[1]); drawAt(g, R2.sHand, A[2], Math.atan2(-d[0], d[1]) / D2R + 8, false); };
  const FA = armPts(p.far || {}, add(shR, [10, 0])), NA = armPts(p.near || {}, shR);
  shade(() => drawArmS(FA)); const FL = legPts(p.farLeg || {}), NL = legPts(p.nearLeg || {});
  shade(() => drawLeg(FL, p.farLeg || {}));
  drawLeg(NL, p.nearLeg || {});
  g.save(); g.translate(HIP[0], HIP[1]); g.rotate(rot * D2R); g.translate(-HIP[0], -HIP[1]); drawP(g, R2.sUpper, 0, () => mouthSide(g, p.mouth || 0)); g.restore();
  if (p.item && p.item.hand === 'far') { } drawArmS(NA); if (p.item) { const d = sub(NA[2], NA[1]); drawItem(g, p.item, add(NA[2], mul(mul(d, 1 / len(d)), 40)), t); }
  g.restore();
}
// props held in hand
function drawItem(g, it, P, t) {
  g.save(); g.translate(P[0], P[1]); g.rotate((it.rot || 0) * D2R); const s = it.s || 1; g.scale(s, s); g.lineWidth = 4; g.strokeStyle = LINE;
  if (it.type === 'apple') { g.fillStyle = '#e8343a'; g.beginPath(); g.arc(-14, 0, 30, 0, 7); g.arc(14, 0, 30, 0, 7); g.fill(); g.beginPath(); g.arc(-14, 0, 30, Math.PI * 0.6, Math.PI * 1.7); g.stroke(); g.beginPath(); g.arc(14, 0, 30, -Math.PI * 0.7, Math.PI * 0.4); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(-18, -12, 8, 5, -0.5, 0, 7); g.fill(); g.strokeStyle = '#5a3a1a'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, -26); g.lineTo(4, -44); g.stroke(); g.fillStyle = '#3aa64a'; g.beginPath(); g.ellipse(14, -42, 12, 6, -0.4, 0, 7); g.fill();
    const bite = it.bite || 0; for (let i = 0; i < bite; i++) { g.fillStyle = '#fbf3d8'; g.beginPath(); g.arc(30 - i * 4, -10 + i * 16, 14, 0, 7); g.fill(); } }
  else if (it.type === 'glass') { g.fillStyle = 'rgba(200,235,255,0.55)'; g.beginPath(); g.moveTo(-26, -50); g.lineTo(26, -50); g.lineTo(20, 46); g.lineTo(-20, 46); g.closePath(); g.fill(); g.stroke(); const lvl = it.level != null ? it.level : 0.8; g.fillStyle = 'rgba(70,160,230,0.75)'; g.beginPath(); g.moveTo(-20 - 6 * (1 - lvl), 46 - 92 * lvl); g.lineTo(20 + 6 * (1 - lvl), 46 - 92 * lvl); g.lineTo(20, 46); g.lineTo(-20, 46); g.closePath(); g.fill(); }
  else if (it.type === 'phone') { g.fillStyle = '#20263a'; g.beginPath(); g.roundRect(-24, -44, 48, 88, 10); g.fill(); g.stroke(); g.fillStyle = '#69b8ff'; g.fillRect(-18, -36, 36, 70); }
  g.restore();
}
