// draw.js: 2D scene pieces for the smriti MG short. Scenes are world space (1920x1080) for worldIn();
// flat colours with dark ink outlines, same look as wpro.js people.
const SKIN = '#f2c29b', SKIN_D = '#d99d74'; // INK comes from wpro.js

// ---- line-art icons for drawIcon (draw-on) ----
Object.assign(ICONS, {
  brain: () => [pb([-10, 90], [-150, 100], [-150, -60], [-60, -90]).concat(pb([-60, -90], [-20, -130], [60, -120], [90, -80]), pb([90, -80], [150, -60], [150, 60], [80, 80])), pb([80, 80], [40, 110], [10, 90], [-10, 90]),
    pb([0, -110], [-20, -60], [20, -20], [0, 40]), pb([-100, -30], [-60, -40], [-50, 10], [-80, 40]), pb([60, -40], [100, -20], [90, 30], [50, 40])],
  rec: () => [[[-110, -60], [50, -60], [50, 60], [-110, 60], [-110, -60]], [[50, -20], [110, -55], [110, 55], [50, 20]], pc(-30, 0, 26, 0, PI2, 24)],
  baby: () => [pc(0, -50, 56, 0, PI2, 40), pb([-60, 110], [-80, 20], [80, 20], [60, 110]).concat([[-60, 110]]), pc(-20, -55, 5, 0, PI2, 8), pc(20, -55, 5, 0, PI2, 8), pb([-16, -28], [-6, -18], [6, -18], [16, -28]), pb([0, -106], [10, -126], [30, -120], [20, -104])],
  eraser: () => [[[-100, 20], [10, -90], [100, 0], [-10, 110], [-100, 20]], [[-45, -35], [45, 55]], L2(-120, 120, 120, 120)],
  neuron: () => [pc(0, 0, 34, 0, PI2, 30), pb([30, 10], [80, 20], [110, 60], [140, 70]), pb([-30, -10], [-80, -30], [-90, -80], [-120, -100]), pb([-20, 25], [-50, 70], [-90, 80], [-110, 110]), pb([15, -30], [30, -80], [70, -90], [90, -120]), L2(-90, -80, -60, -120), L2(110, 60, 120, 30)],
  house: () => [[[-110, -10], [0, -110], [110, -10]], [[-90, -25], [-90, 100], [90, 100], [90, -25]], [[-25, 100], [-25, 30], [25, 30], [25, 100]], [[40, -10], [75, -10], [75, 20], [40, 20], [40, -10]]],
  mirror: () => [pc(0, -10, 80, 0, PI2, 44, 105), L2(0, 95, 0, 130), L2(-50, 130, 50, 130), L2(-30, -60, -10, -80), L2(-40, -30, 0, -70)],
  speech: () => [pb([-110, -60], [-110, -100], [110, -100], [110, -60]).concat(pb([110, -60], [110, 40], [60, 40], [20, 40]), [[-30, 90], [-30, 40]], pb([-30, 40], [-110, 40], [-110, 20], [-110, -60])), L2(-60, -30, 60, -30), L2(-60, 0, 30, 0)],
  bulb: () => [pb([-35, 40], [-90, 0], [-70, -110], [0, -110]).concat(pb([0, -110], [70, -110], [90, 0], [35, 40])), L2(-35, 40, 35, 40), L2(-30, 65, 30, 65), L2(-20, 90, 20, 90), pb([-20, 20], [-20, -30], [20, -30], [20, 20])],
  atom: () => [pc(0, 0, 120, 0, PI2, 50, 40), pc(0, 0, 14, 0, PI2, 14)].concat([1, -1].map(sg => pc(0, 0, 120, 0, PI2, 50, 40).map(([x, y]) => [x * 0.5 - sg * y * 0.866, sg * x * 0.866 + y * 0.5]))),
  flip: () => [pb([-90, -20], [-90, -110], [90, -110], [90, -20]), [[60, -50], [90, -20], [120, -50]], pb([90, 20], [90, 110], [-90, 110], [-90, 20]), [[-120, 50], [-90, 20], [-60, 50]]],
  fire: () => [pb([0, 110], [-110, 100], [-90, -10], [-20, -110]).concat(pb([-20, -110], [-10, -40], [40, -50], [30, -100]), pb([30, -100], [110, -20], [100, 100], [0, 110])), pb([0, 90], [-40, 80], [-30, 30], [0, 0]).concat(pb([0, 0], [30, 30], [40, 80], [0, 90]))],
  scale: () => [L2(0, -110, 0, 100), L2(-60, 100, 60, 100), L2(-120, -70, 120, -70), L2(-120, -70, -150, 10), L2(-120, -70, -90, 10), pb([-160, 10], [-150, 40], [-90, 40], [-80, 10]), L2(120, -70, 90, 10), L2(120, -70, 150, 10), pb([80, 10], [90, 40], [150, 40], [160, 10])],
});

// ---- generic ink helpers ----
function limb(g, pts, w, col) { g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.strokeStyle = INK; g.lineWidth = w + 9; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); }
function blob(g, fill, lw = 5) { g.fillStyle = fill; g.fill(); g.strokeStyle = INK; g.lineWidth = lw; g.stroke(); }
function ell(g, x, y, rx, ry, fill, rot = 0, lw = 5) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 7); blob(g, fill, lw); }

// ---- baby: y = ground. o.pose: sit | crawl | walk | stand, o.col onesie, o.mouth 0..1, o.face: happy|cry|wonder ----
function baby(g, x, y, s, t, o = {}) {
  const pose = o.pose || 'sit', col = o.col || '#8fd3ff', colD = mixC(col, '#1a2a40', 0.25), ph = t * (o.speed || 1) * 2.4;
  g.save(); g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s); g.lineCap = 'round'; g.lineJoin = 'round';
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(0, 0, 120, 16, 0, 0, 7); g.fill();
  let hx = 0, hy = -250, bob = Math.sin(ph * 2) * 4;
  if (pose === 'crawl') {
    const a = Math.sin(ph) * 14;
    limb(g, [[-60, -70], [-80 - a, -5]], 30, colD); limb(g, [[60, -80], [80 + a, -5]], 26, SKIN_D);
    ell(g, 0, -95 + bob, 110, 62, col); limb(g, [[-50, -70], [-70 + a, -5]], 30, col); limb(g, [[55, -80], [70 - a, -5]], 26, SKIN);
    hx = 120; hy = -150 + bob;
  } else if (pose === 'walk' || pose === 'stand') {
    const a = pose === 'walk' ? Math.sin(ph) * 16 : 0, sway = pose === 'walk' ? Math.sin(ph) * 6 : 0;
    limb(g, [[-22, -110], [-26 - a, -55], [-30 - a * 1.3, -6]], 34, colD); limb(g, [[22, -110], [26 + a, -55], [30 + a * 1.3, -6]], 34, col);
    ell(g, -32 - a * 1.3, -6, 26, 14, '#ffffff'); ell(g, 30 + a * 1.3, -6, 26, 14, '#ffffff');
    g.beginPath(); g.ellipse(sway, -160, 72, 86, 0, 0, 7); blob(g, col);
    const up = o.armsUp ? -1 : 0;
    limb(g, [[-55 + sway, -200], [-95, -170 + up * 90], [-105, -130 + up * 150]], 24, col); limb(g, [[55 + sway, -200], [95, -170 + up * 90], [105, -130 + up * 150]], 24, col);
    ell(g, -105, -128 + up * 150, 17, 17, SKIN); ell(g, 105, -128 + up * 150, 17, 17, SKIN);
    hx = sway; hy = -300 + bob;
  } else { // sit
    limb(g, [[-30, -40], [-90, -20], [-110, -10]], 34, colD); limb(g, [[30, -40], [90, -20], [110, -10]], 34, col);
    ell(g, -116, -12, 22, 26, '#ffffff'); ell(g, 116, -12, 22, 26, '#ffffff');
    g.beginPath(); g.ellipse(0, -100, 80, 84, 0, 0, 7); blob(g, col);
    const wv = o.wave ? Math.sin(t * 9) * 25 : 0;
    limb(g, [[-60, -130], [-100, -90], [-80, -60]], 24, col); limb(g, [[60, -130], [105, -150 - wv], [120, -200 - wv]], 24, col);
    ell(g, -78, -58, 17, 17, SKIN); ell(g, 122, -205 - wv, 17, 17, SKIN);
    if (o.toy) { g.save(); g.translate(130, -240 - wv); g.rotate(Math.sin(t * 9) * 0.4); limb(g, [[0, 0], [0, -60]], 10, '#ffd23f'); ell(g, 0, -80, 30, 30, '#ff7a8a'); g.restore(); }
    hx = 0; hy = -235 + bob;
  }
  // head
  g.translate(hx, hy); g.rotate((o.tilt || 0) + Math.sin(t * 1.7) * 0.05);
  ell(g, -86, 6, 18, 24, SKIN); ell(g, 86, 6, 18, 24, SKIN);
  g.beginPath(); g.arc(0, 0, 92, 0, 7); blob(g, SKIN, 6);
  g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(-6, -92); g.bezierCurveTo(-10, -130, 30, -136, 26, -110); g.stroke();
  const bl = (t * 0.7 + (o.seed || 0)) % 3.1 < 0.12;
  g.fillStyle = INK;
  if (o.face === 'cry') { g.lineWidth = 6; g.beginPath(); g.moveTo(-46, -8); g.lineTo(-20, 0); g.moveTo(46, -8); g.lineTo(20, 0); g.stroke(); g.fillStyle = '#8fd3ff'; for (const sx of [-34, 34]) { const dy = (t * 140) % 70; g.beginPath(); g.ellipse(sx, 16 + dy, 7, 11, 0, 0, 7); g.fill(); } }
  else if (bl) { g.lineWidth = 5; g.beginPath(); g.moveTo(-44, 0); g.lineTo(-20, 0); g.moveTo(20, 0); g.lineTo(44, 0); g.stroke(); }
  else { for (const sx of [-32, 32]) { g.beginPath(); g.ellipse(sx, -2, 13, o.face === 'wonder' ? 18 : 15, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(sx + 4, -8, 5, 0, 7); g.fill(); g.fillStyle = INK; } }
  g.fillStyle = 'rgba(255,120,120,0.35)'; g.beginPath(); g.ellipse(-58, 30, 18, 11, 0, 0, 7); g.ellipse(58, 30, 18, 11, 0, 0, 7); g.fill();
  const m = o.mouth != null ? o.mouth : (o.face === 'cry' ? 0.9 : 0.15);
  g.fillStyle = '#8a2a2a'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath();
  if (m > 0.2) g.ellipse(0, 44, 14 + m * 6, 6 + m * 16, 0, 0, 7); else { g.moveTo(-16, 40); g.quadraticCurveTo(0, 54, 16, 40); }
  m > 0.2 ? (g.fill(), g.stroke()) : g.stroke();
  g.restore();
}

// ---- mother's helping hands (enter from the side, hold the baby's hands) ----
function momHands(g, x, y, s, t, k = 1) { // arms reach in diagonally from the upper right, holding the baby's raised hands
  g.save(); g.translate(x, y); g.scale(s, s);
  for (const [dx, sh] of [[105, 0], [-105, 60]]) { limb(g, [[dx + 520 + sh, -560], [dx + 260 + sh, -330], [dx, -150]], 40, '#e86a8a'); ell(g, dx, -132, 25, 23, '#e8b48e'); }
  g.restore();
}
// ---- nursery room (1920x1080 world) ----
function nursery(g, t, o = {}) {
  const gr = g.createLinearGradient(0, 0, 0, 820); gr.addColorStop(0, o.wall0 || '#ffe3cf'); gr.addColorStop(1, o.wall1 || '#f6c6a8'); g.fillStyle = gr; g.fillRect(0, 0, W, 820);
  g.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 40; i++) { const x = (i * 197) % W, y = 60 + ((i * 131) % 700); g.save(); g.translate(x, y); g.rotate(i); g.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 7 : 16, a = k * Math.PI / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); g.restore(); }
  // window with sky
  g.save(); g.fillStyle = '#9fdcff'; g.strokeStyle = '#fff'; g.lineWidth = 22; rr(g, 1380, 120, 360, 330, 20); g.fill(); g.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 3; i++) { const cx = 1380 + ((i * 140 + t * 14) % 420) - 30; g.beginPath(); g.arc(cx, 220 + i * 70, 30, 0, 7); g.arc(cx + 32, 210 + i * 70, 38, 0, 7); g.arc(cx + 66, 222 + i * 70, 28, 0, 7); g.fill(); } rr(g, 1380, 120, 360, 330, 20); g.stroke(); g.beginPath(); g.moveTo(1560, 120); g.lineTo(1560, 450); g.moveTo(1380, 285); g.lineTo(1740, 285); g.stroke(); g.restore();
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(255,240,200,0.12)'; g.beginPath(); g.moveTo(1380, 450); g.lineTo(1740, 450); g.lineTo(1500, 1080); g.lineTo(900, 1080); g.fill(); g.restore();
  // floor
  const fg = g.createLinearGradient(0, 820, 0, H); fg.addColorStop(0, '#d39a6a'); fg.addColorStop(1, '#a8714a'); g.fillStyle = fg; g.fillRect(0, 820, W, H - 820);
  g.strokeStyle = 'rgba(80,40,20,0.25)'; g.lineWidth = 3; for (let i = 0; i < 6; i++) { const y = 840 + i * 45; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 812, W, 12);
  ell(g, 960, 985, 520, 70, '#ffb3c7', 0, 4); ell(g, 960, 985, 420, 50, '#ffd0dd', 0, 0);
  // toy blocks
  [['অ', 230, '#ff6b6b'], ['আ', 330, '#4dabf7'], ['ক', 280, '#ffd43b']].forEach(([c, bx, col], i) => { const by = i === 2 ? 830 : 920; g.save(); g.fillStyle = col; g.strokeStyle = INK; g.lineWidth = 5; rr(g, bx - 45, by - 45, 90, 90, 12); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.font = 'bold 60px "Nirmala UI"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(c, bx, by + 4); g.restore(); });
  // hanging mobile
  if (o.mobile !== false) { g.save(); g.translate(700, 0); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 130); g.stroke(); g.rotate(Math.sin(t * 0.8) * 0.1); g.lineWidth = 5; g.beginPath(); g.moveTo(-130, 130); g.lineTo(130, 130); g.stroke(); [['#ffd23f', -120], ['#ff8fb1', 0], ['#8fd3ff', 120]].forEach(([c, mx], i) => { g.lineWidth = 2; g.beginPath(); g.moveTo(mx, 130); g.lineTo(mx, 200 + i * 20); g.stroke(); ell(g, mx, 220 + i * 20 + Math.sin(t * 2 + i) * 5, 26, 26, c, 0, 4); }); g.restore(); }
}

// ---- polaroid memory card: fn(g, w, h) draws the picture in local coords ----
function polaroid(g, x, y, w, rot, k, fn, o = {}) {
  if (k <= 0) return; const h = w * 1.18, ph = w * 0.86;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(easeOutBack(clamp(k)), easeOutBack(clamp(k))); g.globalAlpha = o.a != null ? o.a : 1;
  g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 30; g.shadowOffsetY = 10; g.fillStyle = '#fbf7ef'; g.fillRect(-w / 2, -h / 2, w, h); g.shadowColor = 'transparent';
  const px = -w / 2 + w * 0.07, py = -h / 2 + w * 0.07; g.save(); g.beginPath(); g.rect(px, py, ph, ph); g.clip(); g.translate(px, py); fn(g, ph, ph); g.restore();
  if (o.fade) { g.fillStyle = `rgba(251,247,239,${clamp(o.fade)})`; g.fillRect(px, py, ph, ph); }
  if (o.label) { g.fillStyle = '#3a3a3a'; g.font = `bold ${Math.round(w * 0.09)}px "Nirmala UI"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.label, 0, h / 2 - w * 0.13); }
  g.restore();
}
// tiny pictures for polaroids
const PIC = {
  walk: (g, w, h) => { g.fillStyle = '#ffe3cf'; g.fillRect(0, 0, w, h); g.fillStyle = '#d39a6a'; g.fillRect(0, h * 0.72, w, h); baby(g, w * 0.5, h * 0.95, w / 520, 0.6, { pose: 'walk', armsUp: true, col: '#ffd23f' }); },
  talk: (g, w, h) => { g.fillStyle = '#d8f3ff'; g.fillRect(0, 0, w, h); baby(g, w * 0.45, h * 0.98, w / 480, 0.3, { pose: 'sit', mouth: 0.9, col: '#ff8fb1' }); g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 3; rr(g, w * 0.55, h * 0.06, w * 0.4, h * 0.22, 14); g.fill(); g.stroke(); g.fillStyle = INK; g.font = `bold ${w * 0.12}px "Nirmala UI"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('মা', w * 0.75, h * 0.17); },
  cake: (g, w, h) => { g.fillStyle = '#ffd6e4'; g.fillRect(0, 0, w, h); g.save(); g.translate(w / 2, h * 0.62); g.fillStyle = '#fff3d6'; g.strokeStyle = INK; g.lineWidth = 3; rr(g, -w * 0.3, -h * 0.12, w * 0.6, h * 0.25, 10); g.fill(); g.stroke(); g.fillStyle = '#ff6b8a'; g.fillRect(-w * 0.3, -h * 0.12, w * 0.6, h * 0.06); g.fillStyle = '#4dabf7'; g.fillRect(-4, -h * 0.28, 8, h * 0.16); g.fillStyle = '#ffb02e'; g.beginPath(); g.ellipse(0, -h * 0.31, 7, 12, 0, 0, 7); g.fill(); g.restore(); g.fillStyle = INK; g.font = `bold ${w * 0.16}px "Nirmala UI"`; g.textAlign = 'center'; g.fillText('১', w * 0.5, h * 0.28); },
  mom: (g, w, h) => { g.fillStyle = '#fff1c9'; g.fillRect(0, 0, w, h); g.save(); g.translate(w * 0.5, h * 0.62); ell(g, 0, h * 0.5, w * 0.42, h * 0.32, '#e86a8a', 0, 3); g.fillStyle = '#3a2418'; g.beginPath(); g.ellipse(0, -h * 0.06, w * 0.27, h * 0.33, 0, 0, 7); g.fill(); ell(g, 0, 0, w * 0.2, h * 0.24, '#e8b48e', 0, 3); g.fillStyle = INK; g.beginPath(); g.arc(-w * 0.07, -h * 0.02, 4, 0, 7); g.arc(w * 0.07, -h * 0.02, 4, 0, 7); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.beginPath(); g.arc(0, h * 0.06, w * 0.06, 0.2, 2.9); g.stroke(); g.restore(); },
  bath: (g, w, h) => { g.fillStyle = '#cdeffd'; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(w * hash(i + 3), h * (0.2 + 0.4 * hash(i + 9)), 6 + 10 * hash(i), 0, 7); g.fill(); } baby(g, w * 0.5, h * 0.9, w / 520, 0.2, { pose: 'sit', col: '#cdeffd', toy: true }); g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 3; rr(g, w * 0.05, h * 0.68, w * 0.9, h * 0.3, 16); g.fill(); g.stroke(); },
  toy: (g, w, h) => { g.fillStyle = '#e4ffd8'; g.fillRect(0, 0, w, h); baby(g, w * 0.5, h * 0.96, w / 500, 0.9, { pose: 'sit', toy: true, wave: true, col: '#a9e34b' }); },
};

// ---- brain side view with hippocampus (centered at 0,0, ~ 520 wide). o.hip 0..1 highlight, o.glow ----
function brainSide(g, x, y, s, t, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round';
  const path = () => { g.beginPath(); g.moveTo(-250, 40); g.bezierCurveTo(-290, -110, -170, -230, -10, -225); g.bezierCurveTo(170, -225, 280, -120, 265, 10); g.bezierCurveTo(255, 80, 200, 110, 150, 100); g.bezierCurveTo(120, 140, 40, 150, -20, 120); g.bezierCurveTo(-120, 150, -240, 120, -250, 40); g.closePath(); };
  // stem + cerebellum
  ell(g, 150, 130, 95, 55, o.col2 || '#e88aa2', 0.15, 6); g.save(); g.strokeStyle = 'rgba(122,42,58,0.5)'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(150, 130, 85 - i * 18, 45 - i * 10, 0.15, 3.3, 6.1); g.stroke(); } g.restore();
  g.beginPath(); g.moveTo(40, 120); g.bezierCurveTo(50, 200, 60, 240, 50, 290); g.lineTo(100, 290); g.bezierCurveTo(100, 220, 110, 160, 110, 110); blob(g, o.col2 || '#e88aa2', 6);
  path(); g.fillStyle = o.col || '#f6a9bd'; g.fill();
  // gyri
  g.save(); path(); g.clip(); g.strokeStyle = 'rgba(122,42,58,0.45)'; g.lineWidth = 6;
  for (let i = 0; i < 16; i++) { const a = hash(i + 2), sx = -240 + (i % 6) * 90 + a * 30, sy = -190 + Math.floor(i / 6) * 110 + a * 40; g.beginPath(); g.moveTo(sx, sy); g.bezierCurveTo(sx + 40, sy + 30 * (a - 0.5), sx + 20, sy + 60, sx + 70, sy + 50 + 20 * a); g.stroke(); }
  g.lineWidth = 7; g.strokeStyle = 'rgba(122,42,58,0.6)'; g.beginPath(); g.moveTo(-200, 30); g.bezierCurveTo(-80, -10, 30, 10, 140, -30); g.stroke();
  g.beginPath(); g.moveTo(0, -222); g.bezierCurveTo(-10, -150, 30, -90, 10, -20); g.stroke();
  g.restore(); path(); g.strokeStyle = '#7a2a3a'; g.lineWidth = 7; g.stroke();
  // hippocampus (seahorse curl, deep inside)
  const hk = o.hip || 0;
  if (hk > 0) {
    g.save(); g.globalAlpha = clamp(hk * 2);
    if (o.glow !== false) { g.globalCompositeOperation = 'screen'; glow(g, -10, 40, 220, 'rgba(120,230,255,A)', 0.55 * hk * (0.85 + 0.15 * Math.sin(t * 6))); g.globalCompositeOperation = 'source-over'; }
    g.lineWidth = 34; g.strokeStyle = '#1f6f8b'; g.beginPath(); g.moveTo(-110, 20); g.bezierCurveTo(-60, 90, 60, 100, 90, 30); g.bezierCurveTo(110, -20, 50, -40, 40, 0); g.stroke();
    g.lineWidth = 24; g.strokeStyle = '#8fe3ff'; g.stroke();
    g.restore();
  }
  g.restore();
}

// ---- neurons ----
function neuron(g, x, y, r, col, k, seed = 0, t = 0) {
  if (k <= 0) return; const e = easeOutBack(clamp(k));
  g.save(); g.translate(x, y); g.scale(e, e); g.strokeStyle = col; g.fillStyle = col; g.lineCap = 'round';
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI2 + hash(seed + i) * 0.8, L = r * (2.2 + 1.6 * hash(seed + i + 9)); g.lineWidth = r * 0.28; g.beginPath(); g.moveTo(0, 0); const mx = Math.cos(a) * L * 0.55, my = Math.sin(a) * L * 0.55; g.quadraticCurveTo(mx + Math.sin(t + i) * 4, my, Math.cos(a) * L, Math.sin(a) * L); g.stroke(); g.lineWidth = r * 0.14; g.beginPath(); g.moveTo(mx, my); g.lineTo(mx + Math.cos(a + 0.7) * L * 0.4, my + Math.sin(a + 0.7) * L * 0.4); g.stroke(); }
  g.shadowColor = col; g.shadowBlur = r; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(-r * 0.3, -r * 0.3, r * 0.3, 0, 7); g.fill();
  g.restore();
}
// field of neurons spawning over time; returns positions. k = spawn progress 0..1
function neuronField(g, t, k, box, n, col, seed = 0) {
  const P = []; for (let i = 0; i < n; i++) P.push([box[0] + hash(seed + i) * box[2], box[1] + hash(seed + i + 77) * box[3], clamp(k * n * 1.2 - i * 1.0)]);
  g.save(); g.strokeStyle = col; g.globalAlpha = 0.35; g.lineWidth = 2;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < Math.min(n, i + 4); j++) { const a = P[i], b = P[j]; if (a[2] > 0 && b[2] > 0 && Math.hypot(a[0] - b[0], a[1] - b[1]) < 260) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); const p = (t * 0.8 + hash(i * 7 + j)) % 1; g.fillStyle = '#fff'; g.globalAlpha = 0.9; g.beginPath(); g.arc(lerp(a[0], b[0], p), lerp(a[1], b[1], p), 4, 0, 7); g.fill(); g.globalAlpha = 0.35; } }
  g.restore(); P.forEach(([x, y, kk], i) => neuron(g, x, y, 14 + 8 * hash(seed + i + 5), col, kk, seed + i, t)); return P;
}

// ---- house wall with family photos; o.crack 0..1, o.fall 0..1 (photos drop), o.hammer swing ----
function wallScene(g, t, o = {}) {
  g.fillStyle = '#f3e3cf'; g.fillRect(0, 0, W, H);
  // bricks showing through plaster
  g.strokeStyle = 'rgba(160,110,80,0.25)'; g.lineWidth = 3; for (let y = 0; y < 820; y += 60) for (let x = (y / 60) % 2 ? -60 : 0; x < W; x += 120) { if (hash(x * 0.01 + y) < 0.25) { g.strokeRect(x, y, 120, 60); } }
  g.fillStyle = '#b07a52'; g.fillRect(0, 820, W, H - 820); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, 815, W, 10);
  const fr = [[560, 330, -0.05, 'mom'], [960, 300, 0.03, 'cake'], [1360, 350, -0.02, 'walk']];
  const crack = o.crack || 0, fall = o.fall || 0;
  fr.forEach(([x, y, r, pic], i) => {
    const f = clamp(fall * 1.6 - i * 0.25), fy = y + f * f * 700, fr2 = r + f * (i - 1) * 0.9;
    if (f < 0.98) { if (f === 0) { g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 60, y - 170); g.lineTo(x, y - 230); g.lineTo(x + 60, y - 170); g.stroke(); }
      g.save(); g.translate(x, fy); g.rotate(fr2); g.fillStyle = '#6b4226'; g.strokeStyle = INK; g.lineWidth = 6; rr(g, -150, -170, 300, 340, 10); g.fill(); g.stroke(); g.save(); g.beginPath(); g.rect(-125, -145, 250, 290); g.clip(); g.translate(-125, -145); PIC[pic](g, 250, 290); g.restore();
      if (f > 0.3 || crack > 0.6) { g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-40, -145); g.lineTo(10, -40); g.lineTo(-30, 30); g.lineTo(40, 145); g.moveTo(10, -40); g.lineTo(125, -10); g.stroke(); }
      g.restore(); }
  });
  // cracks spreading from the hit point
  if (crack > 0) { g.save(); g.strokeStyle = '#3a2418'; g.lineWidth = 7; g.lineCap = 'round'; for (let i = 0; i < 9; i++) { const a = i / 9 * PI2 + hash(i) * 0.6, L = crack * (250 + 350 * hash(i + 4)); g.beginPath(); g.moveTo(960, 560); let px = 960, py = 560; for (let s2 = 1; s2 <= 5; s2++) { px = 960 + Math.cos(a + (hash(i * 5 + s2) - 0.5) * 0.6) * L * s2 / 5; py = 560 + Math.sin(a + (hash(i * 5 + s2) - 0.5) * 0.6) * L * s2 / 5; g.lineTo(px, py); } g.stroke(); } g.restore(); }
  // flying chunks
  if (o.debris) { for (let i = 0; i < 26; i++) { const p = clamp(o.debris - hash(i) * 0.2), a = hash(i + 3) * PI2, v = 300 + 600 * hash(i + 8); if (p <= 0) continue; const x = 960 + Math.cos(a) * v * p, y = 560 + Math.sin(a) * v * p + 900 * p * p; g.save(); g.translate(x, y); g.rotate(p * 8 * hash(i)); g.fillStyle = hash(i + 1) > 0.5 ? '#c98a5e' : '#e8d2b8'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(-20, -14); g.lineTo(18, -18); g.lineTo(22, 12); g.lineTo(-16, 18); g.closePath(); g.fill(); g.stroke(); g.restore(); } }
  // hammer
  if (o.hammer != null) { const a = o.hammer; g.save(); g.translate(1500, 980); g.rotate(-1.2 + a * 1.25); limb(g, [[0, 0], [0, -620]], 26, '#a0703a'); g.fillStyle = '#5a6470'; g.strokeStyle = INK; g.lineWidth = 6; rr(g, -110, -700, 220, 110, 16); g.fill(); g.stroke(); g.restore(); }
}

// ---- mirror with baby looking (mirror test) ----
function mirrorScene(g, t, o = {}) {
  nursery(g, t, { mobile: false, wall0: '#e9e2ff', wall1: '#cfc3f5' });
  g.save(); g.translate(1180, 520); g.fillStyle = '#c9a26a'; g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.ellipse(0, 0, 250, 330, 0, 0, 7); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(0, 0, 215, 295, 0, 0, 7); g.fillStyle = '#d7f1ff'; g.fill(); g.clip();
  baby(g, -20, 330, 0.95, t + 0.3, { pose: 'sit', flip: true, face: 'wonder', col: '#ffd23f' });
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(-200, -120); g.lineTo(-80, -300); g.lineTo(-30, -300); g.lineTo(-150, -120); g.fill(); g.restore();
  baby(g, 640, 960, 1.15, t, { pose: 'sit', face: 'wonder', col: '#ffd23f', tilt: 0.12 });
}

// ---- memory cabinet with no shelves: cards fall straight through ----
function cabinet(g, x, y, w, h, t, k, col) {
  g.save(); g.strokeStyle = col; g.lineWidth = 6; g.shadowColor = col; g.shadowBlur = 18; g.setLineDash([22, 14]); g.lineDashOffset = -t * 30; rr(g, x, y, w, h, 24); g.stroke(); g.setLineDash([]); g.restore();
  for (let i = 0; i < 7; i++) { const p = ((t * 0.55 + hash(i + 4)) % 1), cx = x + w * (0.18 + 0.64 * hash(i + 11)), cy = y - 120 + p * (h + 200); g.save(); g.globalAlpha = k * (1 - p) * 0.95; polaroid(g, cx, cy, 120, (hash(i) - 0.5) + p * 2 * (hash(i + 1) - 0.5), 1, PIC[['walk', 'talk', 'cake', 'mom', 'bath', 'toy', 'walk'][i]]); g.restore(); }
}
// user's character drawn in world space, lip-synced
function me(g, t, x, y, s, act, o = {}) {
  const p = Object.assign({ t }, ACT[act](o.lt != null ? o.lt : t, o), o.pose || {}); p.mouth = mouthAt(t);
  shadow(g, x, y, 220 * s, 0.3); (p.view === 'S' ? drawCharS : p.view === 'B' ? drawCharB : drawCharF)(g, x, y, s, p);
}
function dissolveDust(g, x, y, w, h, k, col = '255,255,255', seed = 0) { if (k <= 0) return; g.save(); for (let i = 0; i < 90; i++) { const sx = x + hash(seed + i) * w, sy = y + hash(seed + i + 40) * h, p = clamp(k * 1.4 - hash(seed + i + 3) * 0.4); if (p <= 0) continue; g.globalAlpha = (1 - p) * 0.9; g.fillStyle = `rgb(${col})`; g.beginPath(); g.arc(sx + p * 160 * (hash(i + 7) - 0.3), sy - p * 260 * hash(i + 9), 3 + 5 * hash(i), 0, 7); g.fill(); } g.restore(); }
