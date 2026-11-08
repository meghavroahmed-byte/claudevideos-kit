// Ancient-world drawing kit: landscape, props, icons, map, text
const W = window.VW || 1080, H = window.VH || 1920;
const BN = s => String(s).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);

// ---------- colour ----------
function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
function mixC(a, b, k) { const A = hex2rgb(a), B = hex2rgb(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(k))).toString(16).padStart(2, '0')).join(''); }
function mood(day, dawn, night, o) { return mixC(mixC(day, dawn, o.dawn || 0), night, o.night || 0); }

// ---------- text ----------
function btext(g, s, x, y, size, fill = '#fff', k = 1, o = {}) {
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.rotate(o.rot || 0); g.scale(k, k); g.globalAlpha = o.alpha != null ? o.alpha : 1;
  g.font = `bold ${size}px "Nirmala UI", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (o.pill) {
    const w = g.measureText(s).width + size * 0.9, h = size * 1.45;
    g.fillStyle = o.pill; g.strokeStyle = '#111'; g.lineWidth = 6; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, h / 2); g.fill(); g.stroke();
  }
  g.lineJoin = 'round'; g.lineWidth = size * 0.18; g.strokeStyle = o.stroke || '#111'; g.strokeText(s, 0, size * 0.05);
  g.fillStyle = fill; g.fillText(s, 0, size * 0.05); g.restore();
}
function symbolText(g, s, x, y, size, fill, k = 1, rot = 0) {
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(k, k);
  g.font = `900 ${size}px "Arial Black", Impact, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = size * 0.16; g.strokeStyle = '#111'; g.strokeText(s, 0, 0); g.fillStyle = fill; g.fillText(s, 0, 0); g.restore();
}

// ---------- landscape ----------
function ridge(g, y0, amp, freq, seed, pan, color, x0 = -50, x1 = W + 50) {
  g.fillStyle = color; g.beginPath(); g.moveTo(x0, H + 10);
  for (let x = x0; x <= x1; x += 12) {
    const u = (x + pan) * freq;
    const h = (noise(u + seed) * 0.6 + noise(u * 2.3 + seed * 3) * 0.3 + noise(u * 5 + seed) * 0.1) * amp;
    g.lineTo(x, y0 - Math.abs(h) - amp * 0.2);
  }
  g.lineTo(x1, H + 10); g.closePath(); g.fill();
}
function pine(g, x, y, h, col) {
  g.fillStyle = col;
  g.fillRect(x - h * 0.04, y - h * 0.25, h * 0.08, h * 0.25);
  for (let k = 0; k < 3; k++) { const yy = y - h * 0.18 - k * h * 0.25, w = h * (0.32 - k * 0.07); g.beginPath(); g.moveTo(x - w, yy); g.lineTo(x, yy - h * 0.42); g.lineTo(x + w, yy); g.closePath(); g.fill(); }
}
function palm(g, x, y, h, col, t, seed = 0) {
  g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineCap = 'round';
  const bend = h * 0.18, sway = Math.sin(t * 1.3 + seed) * 0.05;
  g.lineWidth = h * 0.06; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + bend, y - h * 0.5, x + bend * 0.6, y - h); g.stroke();
  g.translate(x + bend * 0.6, y - h); g.rotate(sway);
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k - 3) * 0.45, L = h * 0.5;
    g.beginPath(); g.moveTo(0, 0);
    g.quadraticCurveTo(Math.cos(a) * L * 0.6, Math.sin(a) * L * 0.6 - h * 0.08, Math.cos(a) * L, Math.sin(a) * L + h * 0.12);
    g.quadraticCurveTo(Math.cos(a) * L * 0.5, Math.sin(a) * L * 0.5 + h * 0.02, 0, 0); g.fill();
  }
  g.restore();
}
function fern(g, x, y, s, col, t, seed) {
  g.save(); g.translate(x, y); g.strokeStyle = col; g.lineCap = 'round';
  for (let k = 0; k < 6; k++) {
    const a = -Math.PI / 2 + (k - 2.5) * 0.35 + Math.sin(t * 1.6 + seed + k) * 0.04;
    g.lineWidth = 6 * s; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(a) * 60 * s, Math.sin(a) * 90 * s, Math.cos(a) * 110 * s, Math.sin(a) * 90 * s + 40 * s); g.stroke();
  }
  g.restore();
}
function rock(g, x, y, s, col, hi) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = col; g.beginPath(); g.moveTo(-60, 0); g.lineTo(-48, -38); g.lineTo(-10, -55); g.lineTo(35, -42); g.lineTo(60, 0); g.closePath(); g.fill();
  g.fillStyle = hi; g.beginPath(); g.moveTo(-44, -36); g.lineTo(-10, -52); g.lineTo(10, -46); g.lineTo(-30, -26); g.closePath(); g.fill();
  g.restore();
}
function cloud(g, x, y, s, a) {
  g.save(); g.globalAlpha = a; g.fillStyle = '#fff';
  for (const [dx, dy, r] of [[0, 0, 50], [50, -18, 60], [105, 0, 46], [55, 18, 44]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, 7); g.fill(); }
  g.restore();
}
function volcano(g, x, y, s, col, t, smokeA) {
  g.fillStyle = col; g.beginPath(); g.moveTo(x - 260 * s, y); g.lineTo(x - 50 * s, y - 230 * s); g.lineTo(x + 40 * s, y - 230 * s); g.lineTo(x + 260 * s, y); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,90,30,0.85)'; g.beginPath(); g.moveTo(x - 40 * s, y - 230 * s); g.lineTo(x + 30 * s, y - 230 * s); g.lineTo(x + 5 * s, y - 180 * s); g.closePath(); g.fill();
  for (let k = 0; k < 7; k++) {
    const life = (t * 0.18 + k / 7) % 1;
    g.fillStyle = `rgba(110,100,110,${smokeA * 0.55 * (1 - life)})`;
    g.beginPath(); g.arc(x + Math.sin(life * 4 + k) * 30 * s + life * 90 * s, y - 250 * s - life * 380 * s, (30 + life * 90) * s, 0, 7); g.fill();
  }
}
// main ancient landscape. o: {t, dawn, night, pan, horizon, sunY}
function land(g, o) {
  const t = o.t, pan = o.pan || 0, hz = o.horizon || 1250;
  const sky = g.createLinearGradient(0, 0, 0, hz + 200);
  sky.addColorStop(0, mood('#4fa3df', '#2c3a78', '#03060f', o)); sky.addColorStop(0.6, mood('#9fd6f5', '#e58a63', '#0c1430', o)); sky.addColorStop(1, mood('#e4f6ff', '#ffd18f', '#1a2448', o));
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // stars
  if (o.night > 0) for (let i = 0; i < 120; i++) { const tw = 0.5 + 0.5 * Math.sin(t * 3 + i); g.fillStyle = `rgba(255,255,255,${o.night * (0.3 + 0.6 * tw) * hash(i + 5)})`; g.fillRect(hash(i) * W, hash(i + 99) * hz * 0.9, 3, 3); }
  // sun / moon
  const sunY = o.sunY != null ? o.sunY : 380, sunX = o.sunX || 790;
  const sc = mood('#fff3b0', '#ffb15c', '#f4f0dc', o);
  const glow = g.createRadialGradient(sunX, sunY, 20, sunX, sunY, 320); glow.addColorStop(0, sc + 'aa'); glow.addColorStop(1, sc + '00');
  g.fillStyle = glow; g.fillRect(sunX - 330, sunY - 330, 660, 660);
  g.fillStyle = sc; g.beginPath(); g.arc(sunX, sunY, o.night > 0.5 ? 58 : 80, 0, 7); g.fill();
  if (o.night > 0.5) { g.fillStyle = mood('#000000', '#000000', '#c9c3ad', o); g.globalAlpha = 0.35; g.beginPath(); g.arc(sunX - 14, sunY - 10, 12, 0, 7); g.arc(sunX + 18, sunY + 16, 8, 0, 7); g.fill(); g.globalAlpha = 1; }
  // clouds
  for (let i = 0; i < 4; i++) cloud(g, ((i * 330 + t * 14 - pan * 0.05) % (W + 400)) - 200, 180 + i * 110, 0.9 + hash(i) * 0.6, (1 - (o.night || 0)) * 0.7);
  // far mountains + volcano
  const ms = o.ms || 1, ts = o.ts || 1, hs = o.hs || 1;
  ridge(g, hz - 60 * hs, 380 * ms, 0.004, 3, pan * 0.15, mood(o.c1 || '#9db9cf', '#9a789a', '#141b33', o));
  if (!o.noVolcano) volcano(g, 210 - pan * 0.2, hz - 40 * hs, 1.2 * ms, mood('#7e8fa3', '#6f5476', '#10152a', o), t, 1 - (o.night || 0) * 0.6);
  ridge(g, hz + 30 * hs, 220 * ms, 0.006, 11, pan * 0.3, mood(o.c2 || '#77a0b0', '#7a5f7e', '#10172b', o));
  // mid hills with trees
  ridge(g, hz + 150 * hs, 120 * ms, 0.005, 21, pan * 0.55, mood(o.c3 || '#5f9c58', '#4f6a4c', '#0c1620', o));
  const tc = mood(o.c4 || '#2f6b3a', '#2f4636', '#060d12', o);
  if (!o.noTrees) for (let i = -2; i < W / 110 + 4; i++) {
    const wx = i * 110 - ((pan * 0.55) % 110) + hash(i + Math.floor(pan * 0.55 / 110)) * 40;
    const k = i + Math.floor(pan * 0.55 / 110);
    if (o.sparse && hash(k * 7) > 0.25) continue;
    if (hash(k * 3) > 0.5) pine(g, wx, hz + (175 + hash(k) * 30) * hs, (120 + hash(k + 1) * 90) * ts, tc);
    else palm(g, wx, hz + (180 + hash(k) * 30) * hs, (150 + hash(k + 2) * 80) * ts, tc, t, k);
  }
  // ground
  const gy = o.groundTop || 1480;
  const gr = g.createLinearGradient(0, gy, 0, H);
  gr.addColorStop(0, mood(o.g1 || '#86b85c', '#6c8a4c', '#0e1a12', o)); gr.addColorStop(1, mood(o.g2 || '#4d8436', '#3f5b31', '#050c08', o));
  g.fillStyle = gr; g.beginPath(); g.moveTo(0, gy + 20);
  for (let x = 0; x <= W; x += 20) g.lineTo(x, gy + noise((x + pan) * 0.01) * 18); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  // path
  g.fillStyle = mood(o.pc || '#c9b07a', '#b08c62', '#1a1a14', o); g.globalAlpha = 0.55;
  g.beginPath(); g.ellipse(W / 2, o.pathY || 1790, W * 0.85, 90, 0, 0, 7); g.fill(); g.globalAlpha = 1;
  // foreground props (parallax)
  if (!o.noProps) for (let i = -1; i < W / 260 + 2; i++) {
    const k = i + Math.floor(pan / 260), x = i * 260 - (pan % 260) + hash(k) * 80;
    const y = (o.propY || 1560) + hash(k + 7) * 60;
    if (hash(k + 3) > 0.55) rock(g, x, y, 0.6 + hash(k) * 0.6, mood('#8d8a80', '#7a6a62', '#141614', o), mood('#b3afa3', '#a08c80', '#22261f', o));
    else fern(g, x, y, 0.8 + hash(k) * 0.5, mood('#3f7d32', '#3d5a33', '#07120b', o), t, k);
  }
  // atmospheric haze
  if (o.dawn) { g.fillStyle = `rgba(255,170,110,${0.12 * o.dawn})`; g.fillRect(0, 0, W, H); }
}
function foregroundGrass(g, t, o, pan = 0) {
  g.save(); g.strokeStyle = mood('#2e6b26', '#31502c', '#030805', o); g.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const x = ((i * 31 - pan * 1.4) % (W + 60) + W + 60) % (W + 60) - 30, h = 40 + hash(i) * 70, sw = Math.sin(t * 2 + i) * 8;
    g.lineWidth = 7; g.beginPath(); g.moveTo(x, H + 5); g.quadraticCurveTo(x + sw * 0.5, H - h * 0.6, x + sw, H - h); g.stroke();
  }
  g.restore();
}
function vignette(g, a = 0.5, col = '0,0,0') {
  const v = g.createRadialGradient(W / 2, H * 0.48, H * 0.25, W / 2, H / 2, H * 0.75);
  v.addColorStop(0, `rgba(${col},0)`); v.addColorStop(1, `rgba(${col},${a})`); g.fillStyle = v; g.fillRect(0, 0, W, H);
}
function dust(g, t, n = 40, col = '255,240,200', a = 0.5) {
  for (let i = 0; i < n; i++) {
    const x = (hash(i) * W + t * (10 + hash(i + 3) * 30)) % W, y = (hash(i + 7) * H - t * (8 + hash(i + 5) * 20) + H * 10) % H;
    g.fillStyle = `rgba(${col},${a * (0.3 + 0.7 * hash(i + 11)) * (0.5 + 0.5 * Math.sin(t * 2 + i))})`;
    g.beginPath(); g.arc(x, y, 1.5 + hash(i + 2) * 3, 0, 7); g.fill();
  }
}

// ---------- props ----------
function fire(g, x, y, s, t) {
  const gl = g.createRadialGradient(x, y - 40 * s, 10, x, y - 40 * s, 520 * s);
  gl.addColorStop(0, `rgba(255,170,60,${0.55 + 0.1 * Math.sin(t * 13)})`); gl.addColorStop(1, 'rgba(255,120,40,0)');
  g.fillStyle = gl; g.fillRect(x - 600 * s, y - 600 * s, 1200 * s, 1200 * s);
  g.save(); g.translate(x, y); g.scale(s, s);
  g.strokeStyle = '#4a2a16'; g.lineCap = 'round'; g.lineWidth = 22;
  g.beginPath(); g.moveTo(-70, 10); g.lineTo(60, -14); g.moveTo(-60, -14); g.lineTo(70, 12); g.stroke();
  const layers = [['#ff5a1f', 1, 0], ['#ffa21f', 0.72, 1.3], ['#ffe27a', 0.42, 2.1]];
  for (const [c, k, ph] of layers) {
    g.fillStyle = c; g.beginPath(); g.moveTo(-60 * k, 0);
    for (let i = 0; i <= 8; i++) {
      const u = i / 8, xx = lerp(-60, 60, u) * k, hh = (Math.sin(u * Math.PI) * 150 + noise(t * 6 + i * 1.7 + ph) * 40) * k;
      g.quadraticCurveTo(xx - 8, -hh * 0.6, xx, -hh);
    }
    g.lineTo(60 * k, 0); g.closePath(); g.fill();
  }
  for (let i = 0; i < 10; i++) { const life = (t * 0.8 + i / 10) % 1; g.fillStyle = `rgba(255,200,90,${1 - life})`; g.beginPath(); g.arc(Math.sin(i * 7 + t * 2) * 50 * life, -120 - life * 260, 4 * (1 - life) + 1, 0, 7); g.fill(); }
  g.restore();
}
// caveman silhouette / flat figure
function caveman(g, x, y, s, o = {}) {
  const t = o.t || 0, col = o.col || '#3b2a20', skin = o.skin || col, pose = o.pose || 'stand', cloth = o.cloth || col;
  g.save(); g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s); g.lineCap = 'round'; g.lineJoin = 'round';
  const limb = (pts, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke(); };
  if (pose === 'sit') {
    limb([[-14, -60], [-40, -40], [-30, 0]], 16, skin); limb([[14, -60], [40, -40], [36, 0]], 16, skin);
    g.fillStyle = cloth; g.beginPath(); g.moveTo(-30, -140); g.lineTo(30, -140); g.lineTo(38, -55); g.lineTo(-38, -55); g.closePath(); g.fill();
    limb([[-22, -125], [-38, -80], [-15, -70]], 14, skin); limb([[22, -125], [40 + Math.sin(t * 4) * 10, -95], [55, -110 + Math.sin(t * 4) * 12]], 14, skin);
    g.fillStyle = skin; g.beginPath(); g.arc(0, -165, 26, 0, 7); g.fill();
    g.fillStyle = o.hair || '#1a120d'; g.beginPath(); g.arc(0, -172, 28, Math.PI * 0.95, Math.PI * 2.05); g.fill();
  } else {
    const wk = o.walk ? Math.sin(t * 7) : 0;
    limb([[-10, -95], [-16 - wk * 18, -45], [-14 - wk * 26, 0]], 18, skin); limb([[10, -95], [16 + wk * 18, -45], [14 + wk * 26, 0]], 18, skin);
    g.fillStyle = cloth; g.beginPath(); g.moveTo(-30, -200); g.lineTo(30, -200); g.lineTo(40, -88); g.lineTo(0, -78); g.lineTo(-40, -90); g.closePath(); g.fill();
    if (pose === 'throw') { const k = o.k || 0; limb([[22, -185], [50, -230 + k * 40], [80 - k * 20, -260 + k * 80]], 15, skin); limb([[-22, -185], [-50, -150], [-60, -120]], 15, skin); }
    else if (pose === 'hammer') { const hk = Math.abs(Math.sin(t * 6)); limb([[22, -185], [55, -160 - hk * 30], [70, -140 - hk * 60]], 15, skin); g.fillStyle = '#7d7d7d'; g.beginPath(); g.arc(72, -142 - hk * 60, 14, 0, 7); g.fill(); limb([[-22, -185], [-40, -140], [-20, -120]], 15, skin); }
    else if (pose === 'spear') { limb([[22, -185], [40, -150], [45, -120]], 15, skin); limb([[-22, -185], [-36, -145], [-30, -112]], 15, skin); g.strokeStyle = '#6b4a2a'; g.lineWidth = 7; g.beginPath(); g.moveTo(45, -20); g.lineTo(52, -290); g.stroke(); g.fillStyle = '#9a9a9a'; g.beginPath(); g.moveTo(46, -290); g.lineTo(58, -290); g.lineTo(52, -325); g.fill(); }
    else { limb([[22, -185], [36 + wk * 14, -140], [40 + wk * 20, -100]], 15, skin); limb([[-22, -185], [-36 - wk * 14, -140], [-40 - wk * 20, -100]], 15, skin); }
    g.fillStyle = skin; g.beginPath(); g.arc(0, -228, 28, 0, 7); g.fill();
    g.fillStyle = o.hair || '#1a120d'; g.beginPath(); g.arc(0, -236, 31, Math.PI * 0.9, Math.PI * 2.1); g.fill();
    if (o.beard) { g.beginPath(); g.arc(0, -212, 20, 0, Math.PI); g.fill(); }
  }
  g.restore();
}
function deer(g, x, y, s, t, col, run = 1) {
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round';
  const ph = t * 9 * run;
  g.lineWidth = 9;
  [[-55, 0], [-40, Math.PI], [45, Math.PI * 0.5], [58, Math.PI * 1.5]].forEach(([lx, o]) => { const a = Math.sin(ph + o) * 0.6 * run; g.beginPath(); g.moveTo(lx, -70); g.lineTo(lx + Math.sin(a) * 40, -70 + Math.cos(a) * 40); g.lineTo(lx + Math.sin(a) * 40 + Math.sin(a * 1.5) * 30, -70 + Math.cos(a) * 40 + 32); g.stroke(); });
  const bob = Math.sin(ph * 2) * 4 * run;
  g.beginPath(); g.ellipse(0, -90 + bob, 78, 32, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(55, -105 + bob); g.lineTo(85, -165 + bob); g.lineTo(105, -160 + bob); g.lineTo(80, -95 + bob); g.fill();
  g.beginPath(); g.ellipse(102, -168 + bob, 26, 13, 0.3, 0, 7); g.fill();
  g.lineWidth = 5; g.beginPath(); g.moveTo(92, -180 + bob); g.lineTo(80, -225 + bob); g.moveTo(85, -205 + bob); g.lineTo(65, -215 + bob); g.moveTo(98, -182 + bob); g.lineTo(108, -228 + bob); g.moveTo(104, -210 + bob); g.lineTo(125, -222 + bob); g.stroke();
  g.restore();
}
function fish(g, x, y, s, ang, col) {
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s); g.fillStyle = col;
  g.beginPath(); g.ellipse(0, 0, 40, 16, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(-34, 0); g.lineTo(-62, -18); g.lineTo(-62, 18); g.closePath(); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(24, -4, 4, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(25, -4, 2, 0, 7); g.fill();
  g.restore();
}
function wolf(g, x, y, s, col, howl) {
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col;
  g.beginPath();
  g.moveTo(-90, 0); g.lineTo(-80, -60); g.lineTo(-100, -90); g.lineTo(-70, -80); g.lineTo(-40, -95); g.lineTo(10, -100);
  g.lineTo(30, -140 - howl * 20); g.lineTo(40, -185 - howl * 30); g.lineTo(52, -160 - howl * 25); g.lineTo(78, -195 - howl * 45); g.lineTo(70, -150 - howl * 20); g.lineTo(55, -110);
  g.lineTo(50, -60); g.lineTo(55, 0); g.lineTo(38, 0); g.lineTo(30, -50); g.lineTo(-20, -55); g.lineTo(-45, 0); g.closePath(); g.fill();
  g.restore();
}
function glowingEyes(g, x, y, s, a, t, seed) {
  const bl = (Math.sin(t * 1.3 + seed * 5) > 0.95) ? 0.1 : 1;
  for (const dx of [-14, 14]) {
    const gl = g.createRadialGradient(x + dx * s, y, 0, x + dx * s, y, 22 * s); gl.addColorStop(0, `rgba(255,230,90,${a})`); gl.addColorStop(1, 'rgba(255,200,40,0)');
    g.fillStyle = gl; g.fillRect(x + dx * s - 25 * s, y - 25 * s, 50 * s, 50 * s);
    g.fillStyle = `rgba(255,250,200,${a})`; g.beginPath(); g.ellipse(x + dx * s, y, 7 * s, 4 * s * bl, dx > 0 ? -0.2 : 0.2, 0, 7); g.fill();
  }
}
function wheat(g, x, y, h, t, col, seed) {
  if (h <= 2) return;
  const sw = Math.sin(t * 1.8 + seed) * 6 * (h / 120);
  g.save(); g.strokeStyle = '#7a8c3a'; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + sw * 0.4, y - h * 0.5, x + sw, y - h); g.stroke();
  if (h > 60) { g.fillStyle = col; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(x + sw + (k % 2 ? 6 : -6), y - h + 8 + k * 9, 6, 10, k % 2 ? 0.5 : -0.5, 0, 7); g.fill(); } }
  g.restore();
}

// ---------- icons ----------
function iconTile(g, x, y, r, k, draw, cross = 0, bg = '#fff8ea') {
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.scale(k, k);
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(6, 10, r, 0, 7); g.fill();
  g.fillStyle = bg; g.strokeStyle = '#1b1b1b'; g.lineWidth = 7; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.stroke();
  g.save(); draw(g, r); g.restore();
  if (cross > 0) {
    g.strokeStyle = '#e8262c'; g.lineWidth = r * 0.14; g.lineCap = 'round';
    g.beginPath(); g.arc(0, 0, r * 0.86, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(cross * 2)); g.stroke();
    const c2 = clamp(cross * 2 - 1); if (c2 > 0) { const a = r * 0.6; g.beginPath(); g.moveTo(-a, -a); g.lineTo(lerp(-a, a, c2), lerp(-a, a, c2)); g.stroke(); }
  }
  g.restore();
}
const ICON = {
  phone(g, r) { g.fillStyle = '#222'; g.beginPath(); g.roundRect(-r * 0.3, -r * 0.55, r * 0.6, r * 1.1, r * 0.1); g.fill(); g.fillStyle = '#5ab8ff'; g.fillRect(-r * 0.24, -r * 0.45, r * 0.48, r * 0.85); g.fillStyle = '#fff'; for (let i = 0; i < 4; i++) g.fillRect(-r * 0.16 + i * r * 0.09, -r * 0.05 - i * r * 0.07, r * 0.06, r * 0.07 + i * r * 0.07); },
  bulb(g, r) { g.fillStyle = '#ffd84a'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.beginPath(); g.arc(0, -r * 0.15, r * 0.38, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#8a8a8a'; g.fillRect(-r * 0.18, r * 0.2, r * 0.36, r * 0.28); g.strokeRect(-r * 0.18, r * 0.2, r * 0.36, r * 0.28); },
  glass(g, r) { g.strokeStyle = '#1b1b1b'; g.lineWidth = 6; g.fillStyle = '#e8f6ff'; g.beginPath(); g.moveTo(-r * 0.35, -r * 0.5); g.lineTo(r * 0.35, -r * 0.5); g.lineTo(r * 0.25, r * 0.5); g.lineTo(-r * 0.25, r * 0.5); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#3aa5ff'; g.beginPath(); g.moveTo(-r * 0.3, -r * 0.1); g.lineTo(r * 0.3, -r * 0.1); g.lineTo(r * 0.24, r * 0.45); g.lineTo(-r * 0.24, r * 0.45); g.closePath(); g.fill(); },
  shop(g, r) { g.fillStyle = '#f2f2f2'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.fillRect(-r * 0.5, -r * 0.1, r, r * 0.6); g.strokeRect(-r * 0.5, -r * 0.1, r, r * 0.6); for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#fff' : '#e8262c'; g.fillRect(-r * 0.58 + i * r * 0.232, -r * 0.45, r * 0.232, r * 0.35); } g.strokeRect(-r * 0.58, -r * 0.45, r * 1.16, r * 0.35); g.fillStyle = '#5ab8ff'; g.fillRect(-r * 0.15, r * 0.1, r * 0.3, r * 0.4); },
  food(g, r) { g.fillStyle = '#fff'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.beginPath(); g.ellipse(0, r * 0.1, r * 0.42, r * 0.42, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#f39b2b'; g.beginPath(); g.arc(0, r * 0.1, r * 0.24, 0, 7); g.fill(); g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(-r * 0.62, -r * 0.35); g.lineTo(-r * 0.62, r * 0.5); g.moveTo(r * 0.62, -r * 0.35); g.lineTo(r * 0.62, r * 0.5); g.stroke(); },
  fridge(g, r) { g.fillStyle = '#dfe9f2'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 5; g.beginPath(); g.roundRect(-r * 0.32, -r * 0.6, r * 0.64, r * 1.2, 8); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-r * 0.32, -r * 0.15); g.lineTo(r * 0.32, -r * 0.15); g.stroke(); g.lineWidth = 7; g.beginPath(); g.moveTo(r * 0.2, -r * 0.45); g.lineTo(r * 0.2, -r * 0.27); g.moveTo(r * 0.2, -r * 0.02); g.lineTo(r * 0.2, r * 0.3); g.stroke(); },
  briefcase(g, r) { g.fillStyle = '#8a5a2b'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 6; g.beginPath(); g.roundRect(-r * 0.55, -r * 0.25, r * 1.1, r * 0.75, 10); g.fill(); g.stroke(); g.beginPath(); g.roundRect(-r * 0.2, -r * 0.45, r * 0.4, r * 0.22, 6); g.stroke(); g.fillStyle = '#ffd84a'; g.fillRect(-r * 0.08, -r * 0.02, r * 0.16, r * 0.14); },
  hourglass(g, r, t = 0) { const k = (t % 3) / 3; g.strokeStyle = '#1b1b1b'; g.lineWidth = 6; g.fillStyle = '#e9d5a8'; g.beginPath(); g.moveTo(-r * 0.35, -r * 0.55); g.lineTo(r * 0.35, -r * 0.55); g.lineTo(0, 0); g.lineTo(r * 0.35, r * 0.55); g.lineTo(-r * 0.35, r * 0.55); g.lineTo(0, 0); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#e0a020'; g.beginPath(); g.moveTo(-r * 0.3 * (1 - k), -r * 0.48 * (1 - k)); g.lineTo(r * 0.3 * (1 - k), -r * 0.48 * (1 - k)); g.lineTo(0, 0); g.fill(); g.beginPath(); g.moveTo(-r * 0.3 * k - 2, r * 0.5); g.lineTo(r * 0.3 * k + 2, r * 0.5); g.lineTo(0, r * 0.5 - r * 0.45 * k); g.fill(); g.fillRect(-2, 0, 4, r * 0.5); },
};

// rounded card with mini scene
function card(g, x, y, w, h, k, label, draw, rot = 0, labelCol = '#ffd23f') {
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.rotate(rot * (1 - k)); g.scale(k, k);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.roundRect(-w / 2 + 10, -h / 2 + 14, w, h, 34); g.fill();
  g.save(); g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 34); g.clip(); g.translate(-w / 2, -h / 2); draw(g, w, h); g.restore();
  g.strokeStyle = '#fff8ea'; g.lineWidth = 10; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 34); g.stroke();
  if (label) btext(g, label, 0, h / 2 - 8, 58, '#1b1b1b', 1, { pill: labelCol, stroke: labelCol });
  g.restore();
}

// ---------- parchment world map ----------
const LAND = [
  [[-17,21],[-16,28],[-10,31],[-6,36],[10,37],[11,33],[20,31],[25,32],[32,31],[34,28],[37,22],[39,15],[43,12],[51,12],[49,6],[44,0],[40,-5],[40,-11],[40,-16],[35,-22],[35,-25],[32,-29],[28,-33],[20,-35],[18,-32],[15,-27],[12,-18],[13,-12],[12,-5],[9,-1],[9,4],[5,5],[0,5],[-5,5],[-8,4],[-12,7],[-15,11],[-17,14]],
  [[44,-25],[47,-25],[50,-15],[49,-12],[44,-17]],
  [[-9,37],[-9,43],[-2,43.5],[-4,48],[2,51],[5,53],[8,54],[10,57],[12,55],[14,54],[20,55],[22,57],[24,60],[22,61],[17,61],[18,63],[21,65],[24,66],[25,68],[29,70],[32,69],[40,67],[44,68],[50,68],[60,69],[70,73],[80,73],[90,76],[105,78],[115,74],[130,72],[140,72],[150,70],[160,70],[170,70],[180,67],[180,65],[175,64],[165,60],[163,56],[157,51],[156,58],[150,59],[142,59],[136,54],[140,48],[134,43],[130,42],[128,39],[126,35],[126,38],[122,40],[118,39],[122,36],[120,32],[122,30],[120,26],[116,23],[110,21],[108,19],[106,21],[106,17],[109,13],[109,11],[105,9],[103,10],[100,13],[99,10],[103,1],[101,3],[98,8],[98,16],[94,17],[92,22],[88,22],[86,20],[80,15],[80,10],[77,8],[73,16],[72,21],[67,24],[62,25],[57,26],[56,27],[52,28],[48,30],[50,26],[51,24],[56,26],[58,23],[59,22],[55,17],[52,16],[45,13],[43,13],[39,21],[35,28],[33,30],[35,32],[36,36],[30,36],[27,37],[26,40],[29,41],[28,42],[24,40],[22,37],[21,40],[19,42],[14,45],[13,46],[16,42],[18,40],[15,38],[12,42],[10,44],[7,44],[3,43],[0,40],[-2,37],[-5,36]],
  [[-5,50],[1,51],[2,53],[-1,55],[-2,57],[-3,58.6],[-6,58],[-5,55],[-3,54],[-5,52]],
  [[130,31],[132,34],[135,34],[140,35],[141,38],[142,41],[140,41],[139,38],[136,36],[132,35]],
  [[95,5],[98,4],[104,-2],[106,-6],[102,-4],[98,0]],
  [[109,1],[111,-3],[116,-4],[119,1],[117,7],[113,4]],
  [[131,-1],[138,-2],[147,-6],[150,-10],[143,-9],[138,-8],[132,-4]],
  [[105,-6],[114,-7],[114,-8.5],[106,-7.5]],
  [[114,-22],[114,-26],[115,-34],[118,-35],[124,-34],[130,-32],[135,-35],[138,-35],[140,-38],[146,-39],[150,-37],[153,-31],[153,-26],[150,-22],[146,-19],[145,-15],[142,-11],[141,-15],[140,-17],[136,-15],[136,-12],[132,-11],[130,-13],[127,-14],[124,-16],[122,-18]],
  [[-168,66],[-162,70],[-156,71],[-140,70],[-128,70],[-115,68],[-100,68],[-95,72],[-85,70],[-80,63],[-90,58],[-94,59],[-85,55],[-80,52],[-78,58],[-70,60],[-64,60],[-60,55],[-56,52],[-60,47],[-65,44],[-70,42],[-74,40],[-76,35],[-81,31],[-80,26],[-82,25],[-83,29],[-90,30],[-95,29],[-97,26],[-97,22],[-94,18],[-90,21],[-87,21],[-88,16],[-84,15],[-83,10],[-79,9],[-77,8],[-80,7],[-85,11],[-88,13],[-92,15],[-96,16],[-105,20],[-106,23],[-110,27],[-112,31],[-115,30],[-110,23],[-112,25],[-115,28],[-117,32],[-121,35],[-124,40],[-124,46],[-123,49],[-127,51],[-132,55],[-137,58],[-142,60],[-150,60],[-152,58],[-158,57],[-162,55],[-158,59],[-162,60],[-166,62],[-165,65]],
  [[-73,78],[-60,82],[-30,83],[-20,80],[-20,72],[-25,69],[-35,65],[-43,60],[-50,63],[-54,67],[-56,72],[-66,76]],
  [[-77,8],[-72,12],[-63,11],[-60,8],[-52,5],[-50,0],[-44,-2],[-35,-5],[-35,-9],[-39,-14],[-39,-19],[-41,-22],[-48,-26],[-49,-29],[-53,-34],[-58,-35],[-57,-38],[-62,-39],[-65,-42],[-64,-46],[-68,-50],[-69,-53],[-72,-54],[-74,-50],[-75,-45],[-73,-40],[-73,-35],[-71,-30],[-71,-25],[-70,-18],[-76,-14],[-80,-6],[-81,-3],[-80,1],[-78,4]],
];
const MAPW = 3600, MAPH = 1800;
const proj = ([lon, lat]) => [(lon + 180) / 360 * MAPW, (90 - lat) / 180 * MAPH];
let PARCH;
function buildParchment() {
  const c = mk(MAPW, MAPH), g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, MAPH); bg.addColorStop(0, '#e9d3a3'); bg.addColorStop(1, '#d9bd84');
  g.fillStyle = bg; g.fillRect(0, 0, MAPW, MAPH);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(120,80,30,${hash(i) * 0.06})`; g.beginPath(); g.arc(hash(i + 1) * MAPW, hash(i + 2) * MAPH, 4 + hash(i + 3) * 40, 0, 7); g.fill(); }
  // sea ripples
  g.strokeStyle = 'rgba(110,80,40,0.18)'; g.lineWidth = 3;
  for (let y = 40; y < MAPH; y += 70) for (let x = (y / 70 % 2) * 60; x < MAPW; x += 120) { g.beginPath(); g.arc(x, y, 14, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
  // graticule
  g.strokeStyle = 'rgba(110,70,30,0.22)'; g.lineWidth = 2; g.setLineDash([10, 10]);
  for (let lon = -180; lon <= 180; lon += 30) { const [x] = proj([lon, 0]); g.beginPath(); g.moveTo(x, 0); g.lineTo(x, MAPH); g.stroke(); }
  for (let lat = -60; lat <= 60; lat += 30) { const [, y] = proj([0, lat]); g.beginPath(); g.moveTo(0, y); g.lineTo(MAPW, y); g.stroke(); }
  g.setLineDash([]);
  // land
  for (const poly of LAND) {
    g.beginPath(); poly.forEach((p, i) => { const [x, y] = proj(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath();
    g.save(); g.shadowColor = 'rgba(90,50,10,0.5)'; g.shadowBlur = 30; g.fillStyle = '#c8a46a'; g.fill(); g.restore();
    g.fillStyle = '#cfae74'; g.fill();
    g.strokeStyle = '#5a3a1a'; g.lineWidth = 5; g.lineJoin = 'round'; g.stroke();
    g.strokeStyle = 'rgba(90,58,26,0.25)'; g.lineWidth = 18; g.stroke();
  }
  // hand-drawn mountains & trees texture on land
  const isLand = (x, y) => { const d = g.getImageData(x, y, 1, 1).data; return d[0] > 195 && d[0] < 215 && d[1] > 165 && d[1] < 185; };
  for (let i = 0; i < 600; i++) {
    const x = hash(i + 50) * MAPW, y = hash(i + 80) * MAPH;
    if (!isLand(x, y)) continue;
    g.strokeStyle = 'rgba(90,58,26,0.6)'; g.lineWidth = 3;
    if (hash(i) > 0.5) { g.beginPath(); g.moveTo(x - 16, y + 8); g.lineTo(x, y - 14); g.lineTo(x + 16, y + 8); g.stroke(); }
    else { g.beginPath(); g.arc(x, y - 6, 7, 0, 7); g.moveTo(x, y + 1); g.lineTo(x, y + 10); g.stroke(); }
  }
  return c;
}
// cam: {lon, lat, zoom}; returns screen mapping fn
function drawMap(g, cam, t) {
  const [cx, cy] = proj([cam.lon, cam.lat]), z = cam.zoom;
  g.fillStyle = '#d9bd84'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-cx, -cy);
  g.drawImage(PARCH, 0, 0); g.drawImage(PARCH, -MAPW, 0); g.drawImage(PARCH, MAPW, 0);
  g.restore();
  // burnt edges
  vignette(g, 0.75, '70,40,10');
  return p => { const [x, y] = proj(p); return [W / 2 + (x - cx) * z, H / 2 + (y - cy) * z]; };
}
// animated route along lon/lat points, k = 0..1 progress
function route(g, S, pts, k, col = '#c0261c', w = 9) {
  if (k <= 0) return;
  const P = pts.map(S); let L = 0; const segs = [];
  for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); segs.push(d); L += d; }
  let rem = L * k;
  g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.setLineDash([w * 2.2, w * 1.6]);
  g.beginPath(); g.moveTo(P[0][0], P[0][1]); let end = P[0], dir = [1, 0];
  for (let i = 1; i < P.length && rem > 0; i++) {
    const f = Math.min(1, rem / segs[i - 1]); end = [lerp(P[i - 1][0], P[i][0], f), lerp(P[i - 1][1], P[i][1], f)];
    dir = [P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]]; g.lineTo(end[0], end[1]); rem -= segs[i - 1];
  }
  g.stroke(); g.setLineDash([]);
  const a = Math.atan2(dir[1], dir[0]);
  g.translate(end[0], end[1]); g.rotate(a); g.fillStyle = col; g.beginPath(); g.moveTo(w * 2.6, 0); g.lineTo(-w * 1.2, -w * 1.8); g.lineTo(-w * 1.2, w * 1.8); g.closePath(); g.fill();
  g.restore();
}
function pinDot(g, x, y, r, t, col = '#c0261c') {
  const p = (t * 1.2) % 1;
  g.strokeStyle = col; g.globalAlpha = 1 - p; g.lineWidth = 5; g.beginPath(); g.arc(x, y, r + p * r * 3, 0, 7); g.stroke(); g.globalAlpha = 1;
  g.fillStyle = col; g.strokeStyle = '#2a1608'; g.lineWidth = 4; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke();
}
function compass(g, x, y, r, rot) {
  g.save(); g.translate(x, y); g.rotate(rot); g.strokeStyle = '#5a3a1a'; g.fillStyle = '#5a3a1a'; g.lineWidth = 3;
  g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.8, 0, 7); g.stroke();
  for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, -r * 1.05); g.lineTo(r * 0.15, 0); g.lineTo(-r * 0.15, 0); g.closePath(); g.fill(); }
  g.restore();
}
