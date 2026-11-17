// dv2d.js: déjà vu 2D scene library (world space 1920x1080, action kept near 960±330) + companion-window
// assignment for the hum.js templates. Replaces vo-asif/kit/w2d.js. The user's full-body character (rig2)
// appears only now and then (user: "character kom use korbi").
const HAS2D = new Set(['scene', 'char', 'profile', 'duo']);
const SIDE2D = new Set(['list', 'timeline', 'bars', 'dna', 'tree', 'net', 'height', 'brain', 'rewind', 'custom']);
let SKIPBG = false;
{ const _bg = bgMG; bgMG = function (...a) { if (!SKIPBG) return _bg.apply(this, a); }; const _deco = deco; deco = function (...a) { if (!SKIPBG) return _deco.apply(this, a); }; }

Object.assign(ICONS, {
  phone: () => [[[-60, -110], [60, -110], [60, 110], [-60, 110], [-60, -110]], L2(-20, 90, 20, 90), pc(30, -80, 22, 0, PI2, 18)],
  pill: () => [pb([-90, 30], [-130, -10], [-60, -80], [-20, -40]).concat([[60, 40]], pb([60, 40], [100, 80], [30, 150], [-10, 110]), [[-90, 30]]), L2(-55, -5, 25, 75)],
  tv: () => [[[-120, -80], [120, -80], [120, 70], [-120, 70], [-120, -80]], L2(-40, 70, -70, 110), L2(40, 70, 70, 110), L2(-30, -130, 0, -85), L2(30, -130, 0, -85)],
  vr: () => [pb([-120, -40], [-120, -70], [120, -70], [120, -40]).concat(pb([120, -40], [120, 50], [40, 50], [20, 20]), pb([20, 20], [0, 0], [-20, 20], [-40, 50]), pb([-40, 50], [-120, 50], [-120, 20], [-120, -40]))],
  pen: () => [[[-100, 100], [-80, 40], [60, -100], [100, -60], [-40, 80], [-100, 100]], L2(40, -80, 80, -40)],
  paper: () => [[[-80, -110], [50, -110], [90, -70], [90, 110], [-80, 110], [-80, -110]], L2(-50, -50, 50, -50), L2(-50, -10, 60, -10), L2(-50, 30, 60, 30), L2(-50, 70, 20, 70)],
  key: () => [pc(-60, 0, 40, 0, PI2, 30), L2(-20, 0, 110, 0), L2(80, 0, 80, 30), L2(105, 0, 105, 25)],
  ghost: () => [pb([-70, 100], [-90, -60], [-60, -110], [0, -110]).concat(pb([0, -110], [60, -110], [90, -60], [70, 100]), [[45, 75], [20, 100], [-5, 75], [-30, 100], [-70, 100]]), pc(-25, -40, 10, 0, PI2, 10), pc(25, -40, 10, 0, PI2, 10)],
  moon: () => [pc(0, 0, 100, 0.6, 5.7, 40).concat(pb([82, -56], [20, -40], [20, 40], [82, 56]))],
  bolt: () => [[[20, -120], [-60, 10], [0, 10], [-30, 120], [70, -20], [10, -20], [20, -120]]],
  question2: () => [pc(0, -40, 50, Math.PI * 1.05, Math.PI * 2.4, 30).concat([[0, 30]]), pc(0, 70, 8, 0, PI2, 10)],
});

// ---------- small drawing helpers ----------
function box(c, x, y, w, h, fill, r = 10, lw = 5) { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
function floorWall(c, wallA, wallB, floorA, floorB, fy = 820) {
  let g = c.createLinearGradient(0, 0, 0, fy); g.addColorStop(0, wallA); g.addColorStop(1, wallB); c.fillStyle = g; c.fillRect(0, 0, W, fy);
  g = c.createLinearGradient(0, fy, 0, H); g.addColorStop(0, floorA); g.addColorStop(1, floorB); c.fillStyle = g; c.fillRect(0, fy, W, H - fy); c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(0, fy - 6, W, 10);
}
// a simple modern person silhouette-figure with flat colours (no faces needed; reads as "people")
function figure(c, x, y, s, t, o = {}) {
  const col = o.col || '#5b6b8a', skin = o.skin || '#e0a878', hair = o.hair || '#2a1a12', walk = o.walk ? Math.sin(t * 5 + (o.seed || 0)) * 16 : 0;
  c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s); c.lineCap = 'round'; c.lineJoin = 'round';
  c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(0, 0, 70, 12, 0, 0, 7); c.fill();
  limb(c, [[-14, -160], [-18 - walk, -80], [-20 - walk * 1.2, -6]], 26, o.pants || '#2c3550'); limb(c, [[14, -160], [18 + walk, -80], [20 + walk * 1.2, -6]], 26, o.pants || '#2c3550');
  c.beginPath(); c.roundRect(-46, -300, 92, 150, 30); c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = 5; c.stroke();
  const arm = o.point ? -70 : walk * 0.8;
  limb(c, [[-40, -280], [-56 - walk * 0.6, -210], [-58 - walk, -150]], 20, col); limb(c, [[40, -280], [70, -230 + arm * 0.4], [o.point ? 140 : 58 + walk, o.point ? -260 : -150]], 20, col);
  c.beginPath(); c.arc(0, -350, 44, 0, 7); c.fillStyle = skin; c.fill(); c.strokeStyle = INK; c.lineWidth = 5; c.stroke();
  c.beginPath(); c.arc(0, -362, 46, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(30, -380); c.closePath(); c.fillStyle = hair; c.fill();
  c.fillStyle = INK; c.beginPath(); c.arc(-14, -350, 5, 0, 7); c.arc(14, -350, 5, 0, 7); c.fill();
  if (o.wonder) { c.beginPath(); c.ellipse(0, -326, 7, 10, 0, 0, 7); c.fill(); } else { c.lineWidth = 4; c.beginPath(); c.arc(0, -334, 12, 0.3, 2.8); c.stroke(); }
  c.restore();
}
// déjà-vu double image: draws fn twice, the echo offset and flickering (the "seen it before" feel)
function dejaEcho(c, t, k, fn) {
  fn(); if (k <= 0) return; const ph = (t * 0.7) % 1, a = k * (0.25 + 0.2 * Math.sin(t * 9));
  c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'screen'; c.translate(18 + 10 * Math.sin(t * 3), -6); fn(); c.restore();
  c.save(); c.globalAlpha = k * 0.12; c.fillStyle = '#b8f0ff'; c.fillRect(0, 0, W, H); c.restore();
  for (let i = 0; i < 3; i++) { const y = ((ph + i / 3) % 1) * H; c.save(); c.globalAlpha = k * 0.18; c.fillStyle = '#fff'; c.fillRect(0, y, W, 3); c.restore(); }
}

// ---------- scenes ----------
function livingRoom(c, t, o = {}) {
  floorWall(c, '#f3dcc0', '#e2bf9c', '#9b6a48', '#7a5034');
  box(c, 1240, 150, 380, 300, '#9fd6f0', 16); c.save(); c.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 3; i++) { const cx = 1240 + ((i * 150 + t * 12) % 440) - 40; c.beginPath(); c.arc(cx, 240 + i * 60, 26, 0, 7); c.arc(cx + 30, 232 + i * 60, 32, 0, 7); c.fill(); } c.restore();
  c.strokeStyle = '#fff'; c.lineWidth = 16; c.strokeRect(1240, 150, 380, 300);
  box(c, 330, 230, 200, 150, '#ffd59e', 8); box(c, 560, 260, 130, 170, '#c8e6c9', 8);
  box(c, 560, 620, 760, 170, '#c75b4a', 40); box(c, 520, 560, 120, 230, '#b04a3a', 40); box(c, 1240, 560, 120, 230, '#b04a3a', 40); box(c, 600, 520, 680, 130, '#d06a58', 40);
  limb(c, [[1500, 820], [1500, 520]], 10, '#555'); c.beginPath(); c.moveTo(1430, 520); c.lineTo(1570, 520); c.lineTo(1540, 430); c.lineTo(1460, 430); c.closePath(); c.fillStyle = '#ffe08a'; c.fill(); c.strokeStyle = INK; c.lineWidth = 5; c.stroke();
  c.save(); c.globalCompositeOperation = 'screen'; glow(c, 1500, 500, 260, 'rgba(255,220,140,A)', 0.35); c.restore();
  ell(c, 990, 1000, 420, 50, '#e8c070', 0, 4);
}
function streetScene(c, t, o = {}) {
  const g = c.createLinearGradient(0, 0, 0, 760); g.addColorStop(0, '#2b2f63'); g.addColorStop(1, '#f2906a'); c.fillStyle = g; c.fillRect(0, 0, W, 760);
  for (let i = 0; i < 9; i++) { const x = i * 230 - 40, h = 260 + hash(i + 4) * 300; box(c, x, 760 - h, 210, h, ['#3d3a6b', '#4a4378', '#35325e'][i % 3], 6, 4); c.fillStyle = 'rgba(255,214,120,0.85)'; for (let wy = 760 - h + 30; wy < 720; wy += 60) for (let wx = x + 25; wx < x + 190; wx += 55) if (hash(wx * 0.1 + wy) > 0.45) c.fillRect(wx, wy, 26, 30); }
  c.fillStyle = '#4b4b55'; c.fillRect(0, 760, W, H); c.fillStyle = '#6a6a74'; c.fillRect(0, 760, W, 60); c.fillStyle = '#ffd23f'; for (let x = (-t * 80) % 200; x < W; x += 200) c.fillRect(x, 950, 100, 12);
  [300, 1650].forEach(x => { limb(c, [[x, 820], [x, 470]], 12, '#333'); c.save(); c.globalCompositeOperation = 'screen'; glow(c, x, 470, 160, 'rgba(255,220,150,A)', 0.5); c.restore(); });
}
function hospitalScene(c, t, o = {}) {
  floorWall(c, '#dff3f2', '#bfe2e0', '#cfd8dc', '#aab6bb');
  box(c, 520, 640, 760, 70, '#ffffff', 20); box(c, 520, 600, 200, 60, '#e3f2fd', 30); limb(c, [[560, 710], [560, 820]], 14, '#8a9aa0'); limb(c, [[1240, 710], [1240, 820]], 14, '#8a9aa0');
  figure(c, 900, 640, 0.5, t, { col: '#9ad0ec' }); c.save(); c.translate(0, 0); c.restore();
  box(c, 1340, 260, 380, 260, '#0d1b1e', 18); const sp = o.spike || 0; c.save(); c.strokeStyle = '#3ce39a'; c.lineWidth = 5; c.shadowColor = '#3ce39a'; c.shadowBlur = 12; c.beginPath();
  for (let x = 0; x <= 340; x += 4) { const u = (x / 340 + t * 0.6) % 1, y = 390 + Math.sin(u * 60) * (8 + 70 * sp * hash(Math.floor(u * 80))) ; x ? c.lineTo(1360 + x, y) : c.moveTo(1360, y); } c.stroke(); c.restore();
  limb(c, [[1530, 520], [1530, 820]], 10, '#8a9aa0');
}
function mriScene(c, t, o = {}) {
  floorWall(c, '#e8eef5', '#cfdae6', '#b8c4d0', '#9aa8b6');
  c.save(); c.fillStyle = '#f7f9fb'; c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.ellipse(1080, 520, 300, 300, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#26323c'; c.beginPath(); c.ellipse(1080, 540, 140, 140, 0, 0, 7); c.fill(); c.restore();
  box(c, 380, 600, 760, 60, '#ffffff', 20); limb(c, [[500, 660], [500, 820]], 18, '#8a9aa0');
  box(c, 260, 220, 360, 240, '#0d1b2a', 16); brainSide(c, 440, 350, 0.33, t, { hip: o.hip || 0 });
  if (o.front) { c.save(); c.globalCompositeOperation = 'screen'; glow(c, 340, 320, 70, 'rgba(255,200,60,A)', 0.8 * (0.7 + 0.3 * Math.sin(t * 6))); c.restore(); }
}
function vrScene(c, t, o = {}) {
  c.fillStyle = '#0b1026'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(111,245,230,0.5)'; c.lineWidth = 2;
  for (let i = -20; i <= 20; i++) { c.beginPath(); c.moveTo(960 + i * 40, 560); c.lineTo(960 + i * 260, H); c.stroke(); } for (let j = 0; j < 10; j++) { const y = 560 + Math.pow(((j + t * 0.4) % 10) / 10, 2) * 520; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  const kind = o.kind || 'court', col = kind === 'court' ? '#7dffb0' : '#ffcf5a';
  c.save(); c.strokeStyle = col; c.lineWidth = 6; c.shadowColor = col; c.shadowBlur = 16;
  [[560, 360], [960, 300], [1360, 360]].forEach(([x, y], i) => { if (kind === 'court') { c.beginPath(); c.moveTo(x - 90, y + 330); c.lineTo(x - 90, y + 80); c.arc(x, y + 80, 90, Math.PI, 0); c.lineTo(x + 90, y + 330); c.stroke(); } else { c.strokeRect(x - 100, y + 60, 200, 270); c.strokeRect(x - 70, y + 110, 140, 120); } });
  c.beginPath(); c.arc(960, 900, 90, 0, 7); c.stroke(); c.restore();
}
function phoneScene(c, t, o = {}) {
  floorWall(c, '#2a3550', '#1a2238', '#3a3040', '#241c28');
  c.save(); c.translate(960, 560); c.rotate(-0.05); box(c, -230, -420, 460, 840, '#111', 50, 6); box(c, -205, -380, 410, 740, '#e8f4ff', 20, 2);
  const k = o.k != null ? o.k : clamp(((t * 0.5) % 1) * 3); c.globalAlpha = clamp(k * 2); box(c, -185, -340, 370, 120, '#ffffff', 20, 3); c.fillStyle = '#ff4d5a'; c.beginPath(); c.arc(-130, -280, 30, 0, 7); c.fill();
  c.fillStyle = INK; c.font = 'bold 36px "Nirmala UI"'; c.fillText('নতুন মেসেজ', -80, -290); c.fillStyle = '#888'; c.font = '28px "Nirmala UI"'; c.fillText(o.empty ? '( কিছুই নেই )' : 'এইমাত্র', -80, -250); c.restore();
}
function editorDesk(c, t, o = {}) {
  floorWall(c, '#efe1c4', '#d9c39b', '#8a6a48', '#6a4e34');
  box(c, 260, 640, 1400, 60, '#7a5634', 10); box(c, 640, 330, 640, 330, '#fbf7ef', 6, 4);
  c.fillStyle = '#333'; c.font = 'bold 44px "Nirmala UI"'; c.fillText('আজকের খবর', 690, 400); c.fillStyle = '#9aa'; for (let i = 0; i < 6; i++) c.fillRect(690, 440 + i * 34, 520 - (i % 3) * 60, 12);
  const k = o.k != null ? o.k : clamp((t * 0.6) % 1.4); c.save(); c.strokeStyle = '#e8262c'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.ellipse(900, 488, 200 * clamp(k * 2), 40 * clamp(k * 2), -0.05, 0, Math.PI * 2 * clamp(k * 1.5)); c.stroke(); c.restore();
  c.save(); c.translate(900 + 200 * Math.cos(k * 6), 470 + 40 * Math.sin(k * 6)); c.rotate(0.7); limb(c, [[0, 0], [0, -150]], 16, '#e8262c'); c.restore();
  figure(c, 1480, 640, 0.75, t, { col: '#6a8caf', point: true, flip: true });
}
function medsScene(c, t, o = {}) {
  floorWall(c, '#e7f0f7', '#cddde9', '#b9a58a', '#97836a');
  box(c, 420, 560, 1080, 50, '#d9c3a0', 10); box(c, 640, 430, 120, 130, '#ffffff', 16); c.fillStyle = '#e8262c'; c.fillRect(640, 470, 120, 30);
  box(c, 820, 450, 170, 110, '#ffd23f', 50); c.save(); c.translate(1100, 520); c.rotate(-0.4); box(c, -90, -30, 180, 60, '#4dabf7', 30); c.fillStyle = '#fff'; c.fillRect(-2, -30, 4, 60); c.restore();
  c.save(); c.translate(1300, 520); c.rotate(0.3); box(c, -14, -120, 28, 160, '#fff', 14); c.fillStyle = '#e8262c'; c.fillRect(-6, -40 - 60 * (0.5 + 0.5 * Math.sin(t)), 12, 80); c.restore();
}
function writingScene(c, t, o = {}) {
  c.fillStyle = '#5a4030'; c.fillRect(0, 0, W, H); box(c, 520, 120, 880, 860, '#fbf7ef', 8, 4);
  const word = o.word || 'চাবি', n = Math.min(40, 6 + Math.floor((o.lt || 0) * 2.4)); c.fillStyle = '#2a2a6a'; c.font = 'bold 54px "Nirmala UI"';
  for (let i = 0; i < n; i++) { const row = Math.floor(i / 5), col = i % 5; c.save(); c.globalAlpha = 1 - 0.5 * (row / 8); const wob = row > 3 ? Math.sin(i * 7) * 6 : 0; c.translate(580 + col * 165, 210 + row * 92); c.rotate(wob * 0.01); c.fillText(word, 0, wob); c.restore(); }
  const i = n, row = Math.floor(i / 5), col = i % 5; c.save(); c.translate(620 + col * 165, 190 + row * 92); c.rotate(0.6); limb(c, [[0, 0], [60, -170]], 16, '#3b5bdb'); c.restore();
}
function tvScene(c, t, o = {}) {
  floorWall(c, '#3a3352', '#2a2440', '#5a3a2a', '#3e281c');
  box(c, 700, 230, 640, 400, '#111', 20); const ch = Math.floor(t * 0.8); c.save(); c.beginPath(); c.roundRect(725, 255, 590, 350, 10); c.clip();
  c.fillStyle = ['#2b6cb0', '#c53030', '#2f855a'][ch % 3]; c.fillRect(725, 255, 590, 350); c.fillStyle = '#fff'; c.fillRect(725, 540, 590, 50); c.fillStyle = '#c53030'; c.fillRect(725, 540, 140, 50); c.fillStyle = '#fff'; c.font = 'bold 30px "Nirmala UI"'; c.fillText('খবর', 755, 575);
 c.restore(); limb(c, [[1020, 630], [1020, 700]], 20, '#222');
  box(c, 480, 760, 560, 120, '#556080', 40); figure(c, 760, 840, 0.62, t, { col: '#8a6fb0' });
}
function matrixScene(c, t, o = {}) {
  c.fillStyle = '#020a04'; c.fillRect(0, 0, W, H); c.font = 'bold 34px Consolas, monospace';
  for (let i = 0; i < 48; i++) { const x = i * 40, sp = 120 + hash(i) * 200, off = (t * sp + hash(i + 3) * H) % (H + 400) - 200; for (let j = 0; j < 14; j++) { const y = off - j * 38; c.fillStyle = j ? `rgba(60,227,120,${0.8 - j * 0.055})` : '#d8ffe0'; c.fillText(String.fromCharCode(0x30A0 + Math.floor(hash(i * 31 + j + Math.floor(t * 8)) * 90)), x, y); } }
  const gl = Math.sin(t * 2) > 0.9; if (gl) { c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(0, 300 + hash(Math.floor(t * 20)) * 400, W, 40); }
}
function dreamScene(c, t, o = {}) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#141a45'); g.addColorStop(1, '#3b2a6b'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(t * 2 + i))})`; c.fillRect(hash(i) * W, hash(i + 40) * 600, 3, 3); }
  ell(c, 1500, 200, 80, 80, '#fff6c8', 0, 0); box(c, 560, 700, 800, 120, '#8fa3d8', 30); box(c, 560, 640, 220, 90, '#ffffff', 40);
  c.save(); c.fillStyle = '#c9a2ff'; c.globalAlpha = 0.9; [[1080, 420, 140], [1240, 380, 110], [960, 470, 90]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y + Math.sin(t + x) * 8, r, 0, 7); c.fill(); }); c.restore();
  c.save(); c.globalAlpha = 0.85; c.beginPath(); c.roundRect(1000, 340, 300, 150, 30); c.clip(); livingRoom(c, t); c.restore();
  [[820, 600, 18], [880, 540, 26]].forEach(([x, y, r]) => { c.fillStyle = '#c9a2ff'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); });
}
function brainLab(c, t, o = {}) {
  const g = c.createRadialGradient(960, 540, 50, 960, 540, 1000); g.addColorStop(0, '#16304a'); g.addColorStop(1, '#050b14'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  brainSide(c, 960, 520, 1.25, t, { hip: o.hip != null ? o.hip : 1 });
  if (o.zap) { c.save(); c.strokeStyle = '#fff6a0'; c.lineWidth = 6; c.shadowColor = '#ffd23f'; c.shadowBlur = 20; c.beginPath(); let x = 960, y = 80; c.moveTo(x, y); for (let i = 0; i < 6; i++) { x += (hash(i + Math.floor(t * 12)) - 0.5) * 80; y += 75; c.lineTo(x, y); } c.stroke(); c.restore(); }
  if (o.neurons) neuronField(c, t, 1, [560, 300, 800, 460], 18, o.ncol || '#7dffb0', 9);
}
function pastLife(c, t, o = {}) {
  c.fillStyle = '#3a2a1a'; c.fillRect(0, 0, W, H); c.save(); c.filter = 'sepia(1) contrast(1.1)'; streetScene(c, t * 0.2); c.restore();
  c.fillStyle = 'rgba(60,40,20,0.45)'; c.fillRect(0, 0, W, H); c.save(); c.globalAlpha = 0.55 + 0.2 * Math.sin(t * 3); figure(c, 960, 960, 1.1, t, { col: '#d8c8a8', pants: '#8a7a60', skin: '#e8d8c0', hair: '#6a5a40' }); c.restore();
}
function tongueScene(c, t, o = {}) {
  c.fillStyle = '#2a1e3a'; c.fillRect(0, 0, W, H); ell(c, 960, 560, 300, 360, '#e0a878', 0, 6);
  c.fillStyle = INK; c.beginPath(); c.arc(860, 470, 18, 0, 7); c.arc(1060, 470, 18, 0, 7); c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.beginPath(); c.moveTo(830, 420); c.lineTo(890, 430); c.moveTo(1090, 420); c.lineTo(1030, 430); c.stroke();
  ell(c, 960, 700, 90, 55, '#8a2a2a', 0, 5); ell(c, 960, 730, 60, 30, '#ff8a9a', 0, 0);
  c.save(); c.globalAlpha = 0.5 + 0.3 * Math.sin(t * 4); c.filter = 'blur(6px)'; c.fillStyle = '#fff'; c.font = 'bold 90px "Nirmala UI"'; c.textAlign = 'center'; c.fillText('নাম…?', 960, 870); c.restore();
}
function orchestra(c, t, o = {}) {
  c.fillStyle = '#120a1e'; c.fillRect(0, 0, W, H); c.save(); c.globalCompositeOperation = 'screen'; glow(c, 960, 300, 700, 'rgba(255,200,120,A)', 0.25); c.restore();
  box(c, 200, 760, 1520, 80, '#5a3a24', 10);
  [400, 650, 900, 1150, 1400].forEach((x, i) => { const off = o.sync && (i === 1 || i === 3) ? Math.sin(t * 14) * 30 : Math.sin(t * 3 + i) * 10; figure(c, x, 760, 0.6, t, { col: ['#2c2c44', '#3a2c44', '#2c3a44'][i % 3] }); c.save(); c.translate(x + 40, 560 + off * 0.2); c.rotate(-0.6 + off * 0.01); limb(c, [[0, 0], [120, 0]], 8, '#c8a070'); c.restore(); });
  if (o.sync) { c.save(); c.fillStyle = '#ff4d5a'; c.font = 'bold 80px "Nirmala UI"'; c.textAlign = 'center'; c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 10); c.fillText('♪♪!', 960, 300); c.restore(); }
}

const SC = {
  room: () => ({ fy: 600, draw: (c, t, lt) => dejaEcho(c, t, clamp((lt - 0.8) / 0.6), () => { livingRoom(c, t); figure(c, 760 + Math.min(lt, 2) * 60, 900, 0.95, t, { walk: lt < 2, wonder: lt > 1.4 }); }) }),
  roomPlain: () => ({ fy: 600, draw: (c, t, lt) => { livingRoom(c, t); figure(c, 980, 900, 0.95, t, { col: '#3b8f6b' }); figure(c, 760, 900, 0.95, t, { col: '#5b6b8a', wonder: true, flip: true }); } }),
  street: () => ({ fy: 620, draw: (c, t, lt) => dejaEcho(c, t, clamp((lt - 1) / 0.6), () => { streetScene(c, t); figure(c, 700 + lt * 50, 960, 0.9, t, { walk: true }); figure(c, 1300 - lt * 40, 980, 0.95, t, { walk: true, flip: true, col: '#b0605a', seed: 2 }); }) }),
  hosp: () => ({ fy: 520, draw: (c, t, lt) => hospitalScene(c, t, { spike: clamp((lt - 1) / 1.5) }) }),
  mri: (o = {}) => ({ fx: 900, fy: 520, draw: (c, t, lt) => mriScene(c, t, Object.assign({ hip: 1 }, o)) }),
  vr: kind => ({ fy: 600, draw: (c, t, lt) => vrScene(c, t, { kind }) }),
  phone: empty => ({ fy: 560, z: 1.2, draw: (c, t, lt) => phoneScene(c, t, { empty, k: clamp((lt - 0.3) / 0.4) }) }),
  editor: () => ({ fy: 520, draw: (c, t, lt) => editorDesk(c, t, { k: clamp((lt - 0.5) / 1.4) }) }),
  meds: () => ({ fy: 520, draw: (c, t, lt) => medsScene(c, t) }),
  write: () => ({ fy: 420, z: 0.9, draw: (c, t, lt) => writingScene(c, t, { lt }) }),
  tv: () => ({ fy: 520, draw: (c, t, lt) => tvScene(c, t) }),
  matrix: () => ({ fy: 540, draw: (c, t, lt) => matrixScene(c, t) }),
  dream: () => ({ fx: 1000, fy: 520, draw: (c, t, lt) => dreamScene(c, t) }),
  brain: (o = {}) => ({ fy: 520, draw: (c, t, lt) => brainLab(c, t, o) }),
  past: () => ({ fy: 620, draw: (c, t, lt) => pastLife(c, t) }),
  tongue: () => ({ fy: 600, draw: (c, t, lt) => tongueScene(c, t) }),
  band: sync => ({ fy: 560, draw: (c, t, lt) => orchestra(c, t, { sync }) }),
  mirror: () => ({ fy: 560, draw: (c, t, lt) => mirrorScene(c, t) }),
  polaroids: () => ({ fy: 540, draw: (c, t, lt) => { c.fillStyle = '#10182a'; c.fillRect(0, 0, W, H); ['walk', 'cake', 'mom', 'bath'].forEach((p, i) => polaroid(c, 560 + i * 270, 540 + Math.sin(t + i) * 20, 260, (i - 1.5) * 0.12, 1, PIC[p], { fade: clamp((lt - 1 - i * 0.4) / 0.6) * 0.8 })); } }),
};
// icon -> scene key; otherwise the section's default rotation
const ICONKEY = [[['eye', 'q', 'question2', 'ghost'], 'room'], [['map', 'pin', 'city', 'run'], 'street'], [['heart', 'warn', 'bolt'], 'hosp'], [['micro', 'flask'], 'mri'],
  [['vr', 'stairs'], 'vr'], [['phone', 'bubble'], 'phone'], [['pen', 'paper', 'page', 'check'], 'editor'], [['pill', 'drop'], 'meds'], [['key'], 'brain'], [['book'], 'polaroids'], [['tv'], 'tv'],
  [['dice', 'net'], 'matrix'], [['moon'], 'dream'], [['brain', 'neuron', 'atom'], 'brain'], [['skull', 'grave', 'clock', 'hourglass'], 'past'], [['speech'], 'tongue'], [['people'], 'roomPlain']];
const SECDEF = { teal: ['room', 'street', 'dream'], violet: ['past', 'matrix', 'dream'], red: ['hosp', 'brain', 'mri'], ice: ['brain', 'room', 'phone'], jungle: ['vr', 'street', 'room'],
  gold: ['meds', 'brain', 'editor'], ember: ['editor', 'mri', 'brain'], dark: ['room', 'brain', 'street'] };
function makeScene(key) { if (key === 'vr') return SC.vr('court'); if (key === 'phone') return SC.phone(false); if (key === 'band') return SC.band(true); return SC[key](); }
function pickKey(b, icon, n) {
  if (b.o.w) return b.o.w;
  if (icon) for (const [list, k] of ICONKEY) if (list.includes(icon)) return k;
  const d = SECDEF[b.o.mode] || SECDEF.dark; return d[n % d.length];
}

// ---------- the user's full-body character (rig2) ----------
function hero(g, t, x, o = {}) { me(g, t, x, o.gy || 1000, o.s || 0.68, o.act || 'talk'); }
function meInWorld(c, t, m) {
  const g0 = c.createLinearGradient(0, 600, 0, 1080); g0.addColorStop(0, 'rgba(0,0,0,0)'); g0.addColorStop(1, 'rgba(4,8,14,0.55)'); c.fillStyle = g0; c.fillRect(0, 600, W, 480);
  me(c, t, m.x, 1060, 0.95, m.pose, { lt: t - m.t0 });
}

function assign2D() {
  let since = 4, n = 0;
  B.forEach((b, i) => {
    const o = b.o;
    if (HAS2D.has(b.tpl)) { since = b.tpl === 'char' ? 0 : since + 1; return; }
    const icon = o.icon || (o.items && o.items[0] && typeof o.items[0][0] === 'string' ? o.items[0][0] : null) || (o.L && o.L.icon);
    const key = pickKey(b, icon, n++), sc = o.w2 ? SC[o.w2[0]](...o.w2.slice(1)) : makeScene(key);
    let m = null;
    if (b.tpl !== 'chapter' && b.tpl !== 'cmp' && o.me !== false && (o.me || since >= 9)) { m = { pose: o.me || ['point', 'talk', 'think', 'shrug', 'surprised', 'confused'][i % 6], x: 1180, t0: 0 }; since = 0; } else since++;
    const w2 = { key, sc, me: m, side: i % 2 ? 'L' : 'R' };
    if (b.tpl === 'cmp') { w2.L = o.L && o.L.w ? SC[o.L.w[0]](...o.L.w.slice(1)) : makeScene(pickKey({ o: {} }, o.L && o.L.icon, n)); w2.R = o.R && o.R.w ? SC[o.R.w[0]](...o.R.w.slice(1)) : makeScene(pickKey({ o: {} }, o.R && o.R.icon, n + 1)); n++; }
    b.w2 = w2;
  });
}
function win2D(g, t, b, clip, sc, zb, m) {
  const lt = t - b.t0, len = Math.max(1, b.t1 - b.t0), u = clamp(lt / len);
  const cam = { fx: (sc.fx || 960) + (m ? 60 : 0), fy: sc.fy || 600, z: (sc.z || 1) * zb * (1 + 0.07 * u) };
  if (m) m.t0 = b.t0;
  worldIn(g, c => { sc.draw(c, t, lt, b); if (m) meInWorld(c, t, m); }, cam, clip, t);
}
function drawSide2D(g, t, b) {
  const R = b.w2.side === 'R', col = colOf(b.o), lt = t - b.t0, ke = easeOut(clamp(lt / 0.55));
  deco(g, t, b, Object.assign({ floor: false }, b.o));
  SKIPBG = true; g.save(); const sc = 0.72; g.translate(R ? 20 : 518, 151); g.scale(sc, sc); TPL[b.tpl](g, t, b, b.o); g.restore(); SKIPBG = false;
  const x = R ? 1430 : 30, clip = { x: x + (R ? 1 : -1) * (1 - ke) * 160, y: 200, w: 460, h: 680, rad: 30, col };
  g.save(); g.globalAlpha = ke; g.fillStyle = 'rgba(0,0,0,0.45)'; g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 40; g.beginPath(); g.roundRect(clip.x, clip.y, clip.w, clip.h, 30); g.fill(); g.restore();
  win2D(g, t, b, clip, b.w2.sc, 0.98, b.w2.me);
  corners(g, clip.x - 16, clip.y - 16, clip.w + 32, clip.h + 32, col, 0.6 * ke, 34, 3);
}
