// ===== Winter video kit: grading, snow, ice-age environments, 3D map, body science =====
// ---------- post: colour grade + grain ----------
let GRAIN, POST, PG;
function buildPost() {
  GRAIN = mk(512, 512); const g = GRAIN.getContext('2d'), id = g.createImageData(512, 512);
  for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (Math.random() - 0.5) * 90; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0);
  POST = mk(W, H); PG = POST.getContext('2d');
}
// grade: {warm: -1..1 (cool..warm), con: contrast, sat, vig, leak}
const GRADES = {
  arctic: { shadow: '#0d2a3a', high: '#ffd9a8', con: 1.10, sat: 1.05, vig: 0.55 },
  golden: { shadow: '#2a1030', high: '#ffb060', con: 1.12, sat: 1.18, vig: 0.5 },
  fire: { shadow: '#1a0805', high: '#ffb070', con: 1.15, sat: 1.2, vig: 0.65 },
  night: { shadow: '#060818', high: '#ffcf90', con: 1.12, sat: 1.1, vig: 0.7 },
  thermal: { shadow: '#10001a', high: '#ffe0a0', con: 1.08, sat: 1.15, vig: 0.6 },
  map: { shadow: '#0a1a1a', high: '#ffe2b0', con: 1.06, sat: 1.08, vig: 0.55 },
  danger: { shadow: '#200000', high: '#ffb0a0', con: 1.18, sat: 1.15, vig: 0.75 },
  aurora: { shadow: '#04101a', high: '#d0ffe0', con: 1.12, sat: 1.25, vig: 0.65 },
};
function grade(src, dst, gname, t) {
  const gd = GRADES[gname] || GRADES.arctic;
  dst.setTransform(1, 0, 0, 1, 0, 0); dst.globalCompositeOperation = 'source-over'; dst.globalAlpha = 1;
  dst.filter = `contrast(${gd.con}) saturate(${gd.sat})`; dst.drawImage(src, 0, 0); dst.filter = 'none';
  // split-tone: shadows + highlights via soft-light
  dst.globalCompositeOperation = 'soft-light'; dst.globalAlpha = 0.35;
  const sg = dst.createLinearGradient(0, H, W, 0); sg.addColorStop(0, gd.shadow); sg.addColorStop(1, gd.high);
  dst.fillStyle = sg; dst.fillRect(0, 0, W, H);
  // bloom-ish glow on highlights
  dst.globalCompositeOperation = 'screen'; dst.globalAlpha = 0.12; dst.filter = 'blur(18px) brightness(1.2)'; dst.drawImage(src, 0, 0); dst.filter = 'none';
  dst.globalCompositeOperation = 'source-over'; dst.globalAlpha = 1;
  // vignette
  const v = dst.createRadialGradient(W / 2, H * 0.5, H * 0.35, W / 2, H / 2, W * 0.72);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${gd.vig})`); dst.fillStyle = v; dst.fillRect(0, 0, W, H);
  // light leak (slow drifting warm flare)
  const lx = W * (0.15 + 0.7 * (0.5 + 0.5 * Math.sin(t * 0.13))), ll = dst.createRadialGradient(lx, -80, 10, lx, -80, 700);
  ll.addColorStop(0, 'rgba(255,170,90,0.10)'); ll.addColorStop(1, 'rgba(255,170,90,0)'); dst.globalCompositeOperation = 'screen'; dst.fillStyle = ll; dst.fillRect(0, 0, W, H);
  // film grain
  dst.globalCompositeOperation = 'overlay'; dst.globalAlpha = 0.09;
  const ox = Math.floor(hash(Math.floor(t * 24)) * 512), oy = Math.floor(hash(Math.floor(t * 24) + 7) * 512);
  dst.save(); dst.translate(-ox, -oy); dst.fillStyle = dst.createPattern(GRAIN, 'repeat'); dst.fillRect(ox, oy, W, H); dst.restore();
  dst.globalCompositeOperation = 'source-over'; dst.globalAlpha = 1;
}

// ---------- snow & weather ----------
function snowfall(g, t, o = {}) {
  const n = o.n || 160, wind = o.wind || 0.3, layers = [[0.5, 0.35], [1, 0.6], [1.8, 0.9]];
  for (const [d, a] of layers) for (let i = 0; i < n / 3; i++) {
    const sp = (40 + hash(i * 3 + d) * 50) * d, x = ((hash(i + d * 100) * (W + 400) + t * sp * wind * 3 + Math.sin(t * 1.3 + i) * 20 * d) % (W + 400)) - 200;
    const y = ((hash(i + d * 300) * (H + 100) + t * sp) % (H + 100)) - 50, r = (1.2 + hash(i + 5) * 2.2) * d;
    g.fillStyle = `rgba(255,255,255,${a * (o.alpha || 1)})`;
    if (o.blizzard) { g.strokeStyle = g.fillStyle; g.lineWidth = r; g.beginPath(); g.moveTo(x, y); g.lineTo(x - wind * 40 * d, y - 12 * d); g.stroke(); }
    else { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  }
}
function blowingSnow(g, t, y0, a = 0.5) { for (let i = 0; i < 6; i++) { const x = ((t * 500 + i * 400) % (W + 800)) - 400; const gr = g.createLinearGradient(x, 0, x + 600, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${a * 0.35})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x, y0 + Math.sin(i) * 40, 600, 60 + i * 10); } }
function breath(g, x, y, t, amt, dir = 1) {
  if (amt <= 0.05) return;
  for (let i = 0; i < 6; i++) { const life = (t * 1.6 + i / 6) % 1; g.fillStyle = `rgba(240,248,255,${0.35 * amt * (1 - life)})`; g.beginPath(); g.arc(x + dir * life * 70, y - life * 30 + Math.sin(life * 6 + i) * 6, 8 + life * 34, 0, 7); g.fill(); }
}
function aurora(g, t, a = 1) {
  for (let k = 0; k < 3; k++) { g.save(); g.globalAlpha = 0.35 * a; g.globalCompositeOperation = 'screen';
    const gr = g.createLinearGradient(0, 80, 0, 520); gr.addColorStop(0, 'rgba(120,255,180,0)'); gr.addColorStop(0.5, ['rgba(90,255,170,0.8)', 'rgba(140,120,255,0.6)', 'rgba(60,230,200,0.7)'][k]); gr.addColorStop(1, 'rgba(60,255,160,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 520);
    for (let x = 0; x <= W; x += 40) g.lineTo(x, 200 + k * 60 + Math.sin(x * 0.004 + t * 0.4 + k) * 90 + Math.sin(x * 0.011 + t * 0.7) * 30);
    g.lineTo(W, 520); g.closePath(); g.fill(); g.restore(); }
}
function stars(g, t, a = 1, n = 200) { for (let i = 0; i < n; i++) { const tw = 0.5 + 0.5 * Math.sin(t * 2 + i * 3); g.fillStyle = `rgba(255,255,255,${a * (0.25 + 0.7 * tw) * hash(i + 2)})`; g.fillRect(hash(i) * W, hash(i + 77) * H * 0.6, 2 + hash(i + 9) * 1.5, 2 + hash(i + 9) * 1.5); } }

// ---------- ice-age tundra environment ----------
// o: {t, pan, time: 'day'|'golden'|'dusk'|'night', storm: 0..1, hz}
function tundra(g, o) {
  const t = o.t, pan = o.pan || 0, hz = o.hz || 600, tm = o.time || 'day';
  const SK = { day: ['#9fb8c8', '#e8e2d6', '#f6efe2'], golden: ['#5a3a6a', '#e88a5a', '#ffd29a'], dusk: ['#2a1a40', '#7a3a5a', '#e07a5a'], night: ['#03060f', '#0b1a26', '#16303a'] }[tm];
  const sky = g.createLinearGradient(0, 0, 0, hz + 60); sky.addColorStop(0, SK[0]); sky.addColorStop(0.65, SK[1]); sky.addColorStop(1, SK[2]); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  if (tm === 'night') { stars(g, t); if (o.aurora !== false) aurora(g, t); }
  // sun / moon
  const sx = o.sunX || 1450, sy = o.sunY || (tm === 'golden' ? hz - 60 : tm === 'dusk' ? hz - 10 : tm === 'night' ? 180 : 200);
  const sc = { day: '#fff8e8', golden: '#ffcf7a', dusk: '#ff8a5a', night: '#f2f0e0' }[tm];
  glow(g, sx, sy, 380, 'rgba(255,220,160,A)', tm === 'night' ? 0.15 : 0.45); g.fillStyle = sc; g.beginPath(); g.arc(sx, sy, tm === 'night' ? 46 : 64, 0, 7); g.fill();
  // mountains (snow capped)
  const mc = { day: ['#b8c4cc', '#8e9ca8'], golden: ['#a07a8a', '#7a5a7a'], dusk: ['#5a3a5a', '#3a2440'], night: ['#16222e', '#0c141c'] }[tm];
  ridge(g, hz - 30, 300, 0.0035, 5, pan * 0.12, mc[0]);
  g.save(); g.globalAlpha = tm === 'night' ? 0.25 : 0.8; g.fillStyle = '#ffffff'; ridgeCaps(g, hz - 30, 300, 0.0035, 5, pan * 0.12); g.restore();
  ridge(g, hz + 40, 150, 0.006, 13, pan * 0.3, mc[1]);
  // conifers (sparse, snowy)
  const tc = { day: '#3a4a40', golden: '#3a2a30', dusk: '#1e1420', night: '#05080a' }[tm];
  for (let i = -2; i < W / 140 + 3; i++) { const k = i + Math.floor(pan * 0.5 / 140); if (hash(k * 5) < 0.45) continue; const x = i * 140 - ((pan * 0.5) % 140) + hash(k) * 60; const h = 90 + hash(k + 1) * 120; pine(g, x, hz + 120 + hash(k + 2) * 30, h, tc); g.fillStyle = 'rgba(255,255,255,0.75)'; for (let j = 0; j < 3; j++) { const yy = hz + 120 - h * 0.18 - j * h * 0.25 + hash(k + 2) * 30, w = h * (0.32 - j * 0.07); g.beginPath(); g.moveTo(x - w * 0.6, yy - h * 0.08); g.lineTo(x, yy - h * 0.38); g.lineTo(x + w * 0.6, yy - h * 0.08); g.closePath(); g.fill(); } }
  // snow ground
  const gc = { day: ['#f4f6f8', '#cfd8de'], golden: ['#ffe2c8', '#d8a890'], dusk: ['#b8a0b8', '#6a5070'], night: ['#2a3a48', '#121a22'] }[tm];
  const gr = g.createLinearGradient(0, hz + 140, 0, H); gr.addColorStop(0, gc[0]); gr.addColorStop(1, gc[1]); g.fillStyle = gr;
  g.beginPath(); g.moveTo(0, hz + 150); for (let x = 0; x <= W; x += 20) g.lineTo(x, hz + 150 + noise((x + pan) * 0.006) * 22); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  // drifts + sparkles
  g.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = -1; i < 6; i++) { const x = i * 420 - (pan % 420); g.beginPath(); g.ellipse(x + 200, H - 60, 260, 40, 0, Math.PI, 0); g.fill(); }
  if (tm !== 'night') for (let i = 0; i < 40; i++) { const tw = Math.sin(t * 5 + i * 7); if (tw > 0.85) { g.fillStyle = '#fff'; g.fillRect((hash(i) * W - pan * 0.9 + W * 10) % W, hz + 170 + hash(i + 3) * (H - hz - 200), 3, 3); } }
  if (o.storm) { g.fillStyle = `rgba(230,236,240,${o.storm * 0.45})`; g.fillRect(0, 0, W, H); blowingSnow(g, t, hz + 100, o.storm); }
}
function ridgeCaps(g, y0, amp, freq, seed, pan) {
  g.beginPath(); let first = true;
  for (let x = -50; x <= W + 50; x += 12) { const u = (x + pan) * freq; const h = (noise(u + seed) * 0.6 + noise(u * 2.3 + seed * 3) * 0.3 + noise(u * 5 + seed) * 0.1) * amp; const y = y0 - Math.abs(h) - amp * 0.2; first ? g.moveTo(x, y) : g.lineTo(x, y); first = false; }
  for (let x = W + 50; x >= -50; x -= 12) { const u = (x + pan) * freq; const h = (noise(u + seed) * 0.6 + noise(u * 2.3 + seed * 3) * 0.3 + noise(u * 5 + seed) * 0.1) * amp; const y = y0 - Math.abs(h) - amp * 0.2; g.lineTo(x, y + Math.max(8, Math.abs(h) * 0.28)); }
  g.closePath(); g.fill();
}
// furred ice-age human (flat, warmer clothing variants)
function iceman(g, x, y, s, t, o = {}) {
  const coat = o.coat || '#7a5534', fur = o.fur || '#d8c8a8';
  caveman(g, x, y, s, Object.assign({ t, col: '#2e211a', cloth: coat, skin: '#8a5a3a', hair: '#1a120d' }, o));
  if (o.hood !== false && (o.pose || 'stand') !== 'sit') { g.save(); g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s); g.strokeStyle = fur; g.lineWidth = 15; g.lineCap = 'round'; g.beginPath(); g.arc(0, -228, 36, Math.PI * 0.82, Math.PI * 2.18); g.stroke(); g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 3; g.beginPath(); g.arc(0, -228, 29, Math.PI * 0.85, Math.PI * 2.15); g.stroke(); g.fillStyle = fur; g.beginPath(); g.ellipse(0, -198, 40, 12, 0, 0, 7); g.fill(); g.restore(); }
}
function mammoth(g, x, y, s, t, col = '#4a3020', walk = 1) {
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round';
  const ph = t * 3 * walk;
  for (const [lx, o] of [[-70, 0], [-40, Math.PI], [60, Math.PI * 0.5], [90, Math.PI * 1.5]]) { const a = Math.sin(ph + o) * 0.25 * walk; g.save(); g.translate(lx, -90); g.rotate(a); rr(g, -18, 0, 36, 95, 14); g.fill(); g.restore(); }
  g.beginPath(); g.ellipse(10, -150, 140, 95, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(110, -200, 70, 75, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(70, -250, 50, 40, 0, 0, 7); g.fill();
  g.lineWidth = 26; g.beginPath(); g.moveTo(160, -190); g.quadraticCurveTo(200 + Math.sin(ph) * 10, -100, 170, -40); g.stroke();
  g.strokeStyle = '#efe6d0'; g.lineWidth = 14; g.beginPath(); g.moveTo(150, -170); g.quadraticCurveTo(250, -120, 230, -220); g.stroke();
  // shaggy fur fringe
  g.strokeStyle = col; g.lineWidth = 6; for (let i = 0; i < 18; i++) { const fx = -120 + i * 14; g.beginPath(); g.moveTo(fx, -80); g.lineTo(fx + Math.sin(t * 2 + i) * 4, -50 - hash(i) * 20); g.stroke(); }
  g.fillStyle = '#111'; g.beginPath(); g.arc(140, -215, 6, 0, 7); g.fill();
  g.restore();
}
function reindeer(g, x, y, s, t, run = 0.6) { deer(g, x, y, s, t, '#6a4a30', run); }

// ---------- thermal (infrared) look for modern intro ----------
function thermalBG(g, t) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0a0018'); gr.addColorStop(1, '#14002a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(120,60,255,0.12)'; g.lineWidth = 1; for (let y = 0; y < H; y += 4) { g.beginPath(); g.moveTo(0, y + (t * 30) % 4); g.lineTo(W, y + (t * 30) % 4); g.stroke(); }
}
function heatShape(g, drawPath, temp, t) {
  // temp 0 (cold, purple) .. 1 (hot, white-yellow)
  const cols = ['#2a0a5a', '#7a1a9a', '#d0306a', '#ff7a2a', '#ffd84a', '#fffbe0'];
  const c = cols[Math.min(5, Math.floor(temp * 5.99))];
  g.save(); g.shadowColor = c; g.shadowBlur = 40; g.fillStyle = c; drawPath(g); g.fill(); g.restore();
  g.save(); g.globalAlpha = 0.6; g.fillStyle = cols[Math.min(5, Math.floor(temp * 5.99) + 1)]; g.filter = 'blur(10px)'; drawPath(g); g.fill(); g.filter = 'none'; g.restore();
}
function thermalHUD(g, t, label) {
  ink(g, 'rgba(255,255,255,0.7)', 3); for (const [x, y, dx, dy] of [[80, 80, 1, 1], [W - 80, 80, -1, 1], [80, H - 80, 1, -1], [W - 80, H - 80, -1, -1]]) { g.beginPath(); g.moveTo(x, y + dy * 60); g.lineTo(x, y); g.lineTo(x + dx * 60, y); g.stroke(); }
  g.fillStyle = '#ff3a3a'; if (Math.sin(t * 4) > 0) { g.beginPath(); g.arc(120, 120, 10, 0, 7); g.fill(); }
  g.font = 'bold 30px Consolas, monospace'; g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillText('IR ● ' + (label || 'THERMAL'), 140, 130);
  const lg = g.createLinearGradient(W - 140, 200, W - 140, 700); ['#fffbe0', '#ffd84a', '#ff7a2a', '#d0306a', '#7a1a9a', '#2a0a5a'].forEach((c, i) => lg.addColorStop(i / 5, c)); g.fillStyle = lg; g.fillRect(W - 140, 200, 26, 500);
  g.fillStyle = '#fff'; g.font = 'bold 26px Consolas'; g.fillText('+৩৭°', W - 230, 214); g.fillText('-২০°', W - 230, 706);
}

// ---------- pro 3D map ----------
const ICE = [ // rough last-glacial ice sheets (stylised)
  [[-10, 54], [0, 60], [5, 62], [10, 66], [20, 70], [30, 70], [40, 68], [50, 66], [60, 68], [62, 72], [40, 76], [15, 76], [0, 70], [-12, 62]],
  [[-140, 60], [-120, 54], [-100, 48], [-80, 42], [-65, 44], [-55, 52], [-60, 62], [-80, 70], [-110, 72], [-135, 68]],
  [[-60, 60], [-20, 60], [-18, 82], [-60, 84]],
];
let MAPC, MAPCG, TILTC, TILTG;
function buildMap3D() {
  MAPC = mk(MAPW, MAPH); const g = MAPC.getContext('2d');
  const oc = g.createLinearGradient(0, 0, 0, MAPH); oc.addColorStop(0, '#0a2230'); oc.addColorStop(0.5, '#0f3442'); oc.addColorStop(1, '#0a2230'); g.fillStyle = oc; g.fillRect(0, 0, MAPW, MAPH);
  for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(120,200,220,${hash(i) * 0.04})`; g.beginPath(); g.arc(hash(i + 1) * MAPW, hash(i + 2) * MAPH, 6 + hash(i + 3) * 50, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(140,220,240,0.10)'; g.lineWidth = 2;
  for (let lon = -180; lon <= 180; lon += 15) { const [x] = proj([lon, 0]); g.beginPath(); g.moveTo(x, 0); g.lineTo(x, MAPH); g.stroke(); }
  for (let lat = -75; lat <= 75; lat += 15) { const [, y] = proj([0, lat]); g.beginPath(); g.moveTo(0, y); g.lineTo(MAPW, y); g.stroke(); }
  const path = poly => { g.beginPath(); poly.forEach((p, i) => { const [x, y] = proj(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); };
  // coastal glow
  for (const poly of LAND) { path(poly); g.save(); g.shadowColor = 'rgba(120,230,255,0.6)'; g.shadowBlur = 40; g.strokeStyle = 'rgba(120,230,255,0.5)'; g.lineWidth = 6; g.stroke(); g.restore(); }
  // land with elevation-ish shading
  for (const poly of LAND) {
    path(poly); g.save(); g.clip();
    const lg = g.createLinearGradient(0, 0, 0, MAPH); lg.addColorStop(0, '#d8d2c0'); lg.addColorStop(0.3, '#8a9a6a'); lg.addColorStop(0.5, '#b89a5a'); lg.addColorStop(0.7, '#6a8a4a'); lg.addColorStop(1, '#c8c0a8'); g.fillStyle = lg; g.fillRect(0, 0, MAPW, MAPH);
    for (let i = 0; i < 4000; i++) { const x = hash(i + 11) * MAPW, y = hash(i + 13) * MAPH, r = 8 + hash(i + 17) * 60; g.fillStyle = hash(i) > 0.5 ? `rgba(255,250,235,${0.05 + hash(i + 5) * 0.08})` : `rgba(40,30,20,${0.04 + hash(i + 6) * 0.08})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    // hillshade strokes
    g.strokeStyle = 'rgba(60,40,20,0.18)'; g.lineWidth = 3; for (let i = 0; i < 900; i++) { const x = hash(i + 31) * MAPW, y = hash(i + 37) * MAPH; g.beginPath(); g.moveTo(x - 14, y + 8); g.lineTo(x, y - 10); g.lineTo(x + 14, y + 8); g.stroke(); }
    g.restore();
    path(poly); g.strokeStyle = 'rgba(30,20,10,0.7)'; g.lineWidth = 3; g.stroke();
  }
  // ice sheets
  for (const poly of ICE) { path(poly); g.save(); g.clip(); g.fillStyle = 'rgba(245,252,255,0.86)'; g.fillRect(0, 0, MAPW, MAPH); g.strokeStyle = 'rgba(150,200,230,0.5)'; g.lineWidth = 2; for (let i = 0; i < 300; i++) { const x = hash(i + 51) * MAPW, y = hash(i + 53) * MAPH * 0.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40, y + 6); g.stroke(); } g.restore(); path(poly); g.save(); g.shadowColor = '#bff'; g.shadowBlur = 30; g.strokeStyle = 'rgba(220,250,255,0.9)'; g.lineWidth = 4; g.stroke(); g.restore(); }
  MAPCG = mk(W * 2, Math.round(H * 1.7)); TILTC = mk(W, H); TILTG = TILTC.getContext('2d');
}
// draws a tilted, flying map. cam {lon, lat, zoom, tilt (0..1.2), rot}
function map3D(g, cam, t, over) {
  const mg = MAPCG.getContext('2d'), MW = MAPCG.width, MH = MAPCG.height;
  const [cx, cy] = proj([cam.lon, cam.lat]), z = cam.zoom;
  mg.setTransform(1, 0, 0, 1, 0, 0); mg.fillStyle = '#081a22'; mg.fillRect(0, 0, MW, MH);
  mg.save(); mg.translate(MW / 2, MH * 0.62); mg.rotate(cam.rot || 0); mg.scale(z, z); mg.translate(-cx, -cy);
  mg.drawImage(MAPC, 0, 0); mg.drawImage(MAPC, -MAPW, 0); mg.drawImage(MAPC, MAPW, 0);
  mg.restore();
  // cloud shadows
  mg.save(); mg.globalAlpha = 0.18; for (let i = 0; i < 8; i++) { mg.fillStyle = '#000'; mg.beginPath(); mg.ellipse(((hash(i) * MW + t * 30) % (MW + 600)) - 300, hash(i + 4) * MH, 260, 120, 0.3, 0, 7); mg.fill(); } mg.restore();
  const S = p => { const [x, y] = proj(p); const rx = (x - cx) * z, ry = (y - cy) * z, c = Math.cos(cam.rot || 0), s = Math.sin(cam.rot || 0); return [MW / 2 + rx * c - ry * s, MH * 0.62 + rx * s + ry * c]; };
  if (over) { mg.save(); over(mg, S); mg.restore(); }
  // perspective tilt: row-slice projection
  const tilt = cam.tilt != null ? cam.tilt : 0.8;
  g.fillStyle = '#05101a'; g.fillRect(0, 0, W, H);
  const rows = 270, sh = H / rows;
  for (let i = 0; i < rows; i++) {
    const u = (i + 0.5) / rows, v = u * (1 + tilt) / (1 + tilt * u);
    const sx = (1 + tilt * u) / (1 + tilt), srcW = (W / sx), srcY = (MH - H) * 0.55 + v * H * 1.0 + (1 - v) * -H * 0.15;
    g.drawImage(MAPCG, MW / 2 - srcW / 2, srcY, srcW, sh * (1 + tilt * 0.3), 0, i * sh, W, sh + 1);
  }
  // atmosphere / horizon haze
  const hz = g.createLinearGradient(0, 0, 0, H * 0.45); hz.addColorStop(0, `rgba(160,220,240,${0.55 * Math.min(1, tilt)})`); hz.addColorStop(1, 'rgba(160,220,240,0)'); g.fillStyle = hz; g.fillRect(0, 0, W, H * 0.45);
  // return projector for screen-space overlays (labels)
  return p => { const [mx, my] = S(p); const srcTop = (MH - H) * 0.55 - H * 0.15; let v = (my - srcTop) / (H * 1.15); v = clamp(v, -0.5, 1.5); const u = v / (1 + tilt - tilt * v); const sx = (1 + tilt * u) / (1 + tilt); return [W / 2 + (mx - MW / 2) * sx, u * H]; };
}
function glowRoute(g, S, pts, k, col = '#ffcf5a', w = 7, t = 0) {
  if (k <= 0) return; const P = pts.map(S); let L = 0, segs = [];
  for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); segs.push(d); L += d; }
  let rem = L * k, end = P[0];
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [lw, a] of [[w * 4, 0.18], [w * 2, 0.35], [w, 1]]) { g.strokeStyle = col; g.globalAlpha = a; g.lineWidth = lw; g.beginPath(); g.moveTo(P[0][0], P[0][1]); let r = rem; for (let i = 1; i < P.length && r > 0; i++) { const f = Math.min(1, r / segs[i - 1]); end = [lerp(P[i - 1][0], P[i][0], f), lerp(P[i - 1][1], P[i][1], f)]; g.lineTo(end[0], end[1]); r -= segs[i - 1]; } g.stroke(); }
  g.globalAlpha = 1; glow(g, end[0], end[1], 50, 'rgba(255,240,180,A)', 0.9); g.fillStyle = '#fff'; g.beginPath(); g.arc(end[0], end[1], w * 0.9, 0, 7); g.fill();
  g.restore();
}
function mapLabel(g, x, y, text, k, col = '#ffcf5a', up = 90) {
  if (k <= 0) return; ink(g, col, 3); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - up * k); g.stroke();
  g.fillStyle = col; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); glow(g, x, y, 40, 'rgba(255,220,120,A)', 0.6 * (0.6 + 0.4 * Math.sin(Date.now() * 0)));
  g.save(); g.globalAlpha = k; g.font = 'bold 44px "Nirmala UI"'; const w = g.measureText(text).width + 40; g.fillStyle = 'rgba(8,20,26,0.82)'; rr(g, x - w / 2, y - up * k - 70, w, 62, 10); g.fill(); g.strokeStyle = col; g.lineWidth = 2; g.stroke(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y - up * k - 38); g.restore();
}

// ---------- body science ----------
// thermal body: core warm, extremities cool by k (0 warm .. 1 hypothermic)
function thermalBody(g, x, y, s, k, t) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const col = (d) => { const temp = clamp(1 - k * (0.4 + d * 1.1)); const cs = ['#2a0a5a', '#7a1a9a', '#d0306a', '#ff7a2a', '#ffd84a', '#fffbe0']; return cs[Math.min(5, Math.floor(temp * 5.99))]; };
  const limb = (pts, wd, d) => { g.save(); g.shadowColor = col(d); g.shadowBlur = 30; g.strokeStyle = col(d); g.lineCap = 'round'; g.lineWidth = wd; g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke(); g.restore(); };
  limb([[-22, -180], [-30, -90], [-32, 0]], 40, 0.6); limb([[22, -180], [30, -90], [32, 0]], 40, 0.6);
  limb([[-55, -360], [-80, -270], [-88, -190]], 30, 0.75); limb([[55, -360], [80, -270], [88, -190]], 30, 0.75);
  g.save(); g.shadowColor = col(0); g.shadowBlur = 50; g.fillStyle = col(0.1); rr(g, -66, -385, 132, 215, 46); g.fill(); g.restore();
  g.save(); g.fillStyle = col(0); g.filter = 'blur(14px)'; rr(g, -40, -350, 80, 150, 40); g.fill(); g.filter = 'none'; g.restore();
  g.save(); g.shadowColor = col(0.35); g.shadowBlur = 40; g.fillStyle = col(0.35); g.beginPath(); g.arc(0, -438, 50, 0, 7); g.fill(); g.restore();
  // fingers/hands
  for (const sx of [-1, 1]) { g.fillStyle = col(1); g.beginPath(); g.arc(sx * 90, -180, 18, 0, 7); g.fill(); }
  g.restore();
}
function coreGauge(g, x, y, k) {
  const temp = lerp(37, 28, k); thermometer(g, x, y, 420, clamp((temp - 26) / 12), mixC('#ff7a2a', '#5ab8ff', k));
  btext(g, BN(temp.toFixed(1)) + '°', x, y - 470, 56, temp < 35 ? '#9fd8ff' : '#ffd23f');
}
// clothing airflow comparison. mode 'drape' | 'sewn'
function airflow(g, cx, cy, s, mode, t, k = 1) {
  g.save(); g.translate(cx, cy); g.scale(s, s);
  bodyOutline(g, 0, 300, 1.0, '#c08a60', t);
  if (mode === 'drape') {
    g.fillStyle = '#8a6a44'; g.strokeStyle = '#3a2810'; g.lineWidth = 5; g.beginPath(); g.moveTo(-80, -90); g.quadraticCurveTo(0, -130, 80, -90); g.lineTo(110, 120); g.quadraticCurveTo(0, 90, -110, 120); g.closePath(); g.fill(); g.stroke();
    // cold arrows entering gaps
    for (let i = 0; i < 9; i++) { const p = (t * 0.9 + i / 9) % 1, side = i % 2 ? 1 : -1, yy = -60 + (i % 5) * 50; g.save(); g.globalAlpha = Math.sin(p * Math.PI) * k; g.translate(side * lerp(360, 70, p), yy); g.rotate(side > 0 ? Math.PI : 0); g.fillStyle = '#7ad8ff'; g.beginPath(); g.moveTo(40, 0); g.lineTo(0, -14); g.lineTo(0, 14); g.fill(); g.fillRect(-60, -5, 60, 10); g.restore(); }
  } else {
    // warm air layer glow
    g.save(); g.globalAlpha = 0.6 * k; g.shadowColor = '#ff9a3a'; g.shadowBlur = 50; g.strokeStyle = 'rgba(255,170,80,0.85)'; g.lineWidth = 26; rr(g, -92, -110, 184, 380, 60); g.stroke(); g.restore();
    g.fillStyle = '#7a5534'; g.strokeStyle = '#3a2810'; g.lineWidth = 5; rr(g, -80, -100, 160, 230, 40); g.fill(); g.stroke();
    ink(g, '#d8c8a8', 6); g.setLineDash([10, 10]); g.beginPath(); g.moveTo(0, -100); g.lineTo(0, 130); g.stroke(); g.setLineDash([]);
    // sleeves
    for (const sx of [-1, 1]) { g.fillStyle = '#7a5534'; g.save(); g.translate(sx * 90, -80); g.rotate(sx * 0.18); rr(g, -24, 0, 48, 170, 20); g.fill(); g.stroke(); g.restore(); }
    // deflected cold arrows
    for (let i = 0; i < 8; i++) { const p = (t * 0.9 + i / 8) % 1, side = i % 2 ? 1 : -1, yy = -60 + (i % 4) * 60; const x = side * lerp(360, 150, Math.min(1, p * 1.4)); const yd = p > 0.7 ? (p - 0.7) * 400 * (i % 2 ? 1 : -1) : 0; g.save(); g.globalAlpha = Math.sin(p * Math.PI) * k; g.translate(x, yy + yd); g.rotate(side > 0 ? Math.PI : 0); g.fillStyle = '#7ad8ff'; g.beginPath(); g.moveTo(40, 0); g.lineTo(0, -14); g.lineTo(0, 14); g.fill(); g.fillRect(-60, -5, 60, 10); g.restore(); }
  }
  g.restore();
}
// bone needle making stages: 0 shard, 1 ground, 2 drilled eye
function needle(g, x, y, s, stage, t) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-0.12);
  const w = lerp(60, 14, clamp(stage)), L = lerp(380, 520, clamp(stage));
  g.fillStyle = BONE; g.strokeStyle = BONE_L; g.lineWidth = 4;
  g.beginPath(); g.moveTo(-L / 2, -w / 2 - (1 - clamp(stage)) * 18 * Math.sin(3)); g.lineTo(L / 2 - 40, -w / 2); g.lineTo(L / 2 + lerp(10, 40, clamp(stage)), 0); g.lineTo(L / 2 - 40, w / 2); g.lineTo(-L / 2, w / 2 + (1 - clamp(stage)) * 20); g.closePath(); g.fill(); g.stroke();
  if (stage > 1) { const e = clamp(stage - 1); g.fillStyle = '#2a1a10'; g.beginPath(); g.ellipse(-L / 2 + 40, 0, 12 * e, 5 * e, 0, 0, 7); g.fill(); }
  g.restore();
}
function grindStone(g, x, y, s, t, active) {
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#8a8478'; g.beginPath(); g.ellipse(0, 0, 320, 70, 0, 0, 7); g.fill(); g.fillStyle = '#a49e90'; g.beginPath(); g.ellipse(0, -14, 300, 50, 0, 0, 7); g.fill();
  if (active) for (let i = 0; i < 14; i++) { const life = (t * 2 + i / 14) % 1; g.fillStyle = `rgba(240,230,210,${1 - life})`; g.beginPath(); g.arc(Math.sin(i * 3) * 120 + life * 80, -30 - life * 80, 3, 0, 7); g.fill(); }
  g.restore();
}
// shelter wall cutaway with layers and heat-loss arrows
function wallLayers(g, x, y, s, layers, t) {
  // layers: number 0..4 (0 bones only, 1 +hides, 2 +sod, 3 +snow)
  g.save(); g.translate(x, y); g.scale(s, s);
  const names = ['হাড়', 'চামড়া', 'মাটির চাকা', 'তুষার'], cols = ['#e8dcc0', '#8a5a3a', '#5a4a2a', '#f4f8fc'];
  for (let i = 0; i < 4; i++) { const kk = clamp(layers - i + 1); if (kk <= 0) continue; const lx = -60 + i * 110; g.globalAlpha = kk; g.fillStyle = cols[i]; rr(g, lx, -320, 100, 640, 16); g.fill(); if (i === 0) { g.fillStyle = 'rgba(0,0,0,0.75)'; for (let j = 0; j < 7; j++) rr(g, lx + 20, -280 + j * 88, 60, 26, 8), g.fill(); } if (i === 3) { g.fillStyle = 'rgba(180,220,255,0.6)'; for (let j = 0; j < 30; j++) { g.beginPath(); g.arc(lx + 15 + hash(j) * 70, -300 + hash(j + 3) * 600, 4 + hash(j + 5) * 6, 0, 7); g.fill(); } } g.globalAlpha = 1; btext(g, names[i], lx + 50, 360 + (i % 2) * 46, 30, '#fff', kk); }
  // heat arrows from inside (left) — escape fraction decreases with layers
  const esc = clamp(1 - layers * 0.3);
  for (let i = 0; i < 6; i++) { const p = (t * 0.7 + i / 6) % 1, yy = -240 + i * 90; const stop = lerp(-60, 400, esc); const xx = lerp(-420, stop, p); g.save(); g.globalAlpha = Math.sin(p * Math.PI); g.translate(xx, yy); g.fillStyle = '#ff8a3a'; g.beginPath(); g.moveTo(36, 0); g.lineTo(0, -14); g.lineTo(0, 14); g.fill(); g.fillRect(-50, -5, 50, 10); g.restore(); }
  g.restore();
}
// mammoth-bone hut, k = build progress 0..1
function boneHut(g, x, y, s, k, t, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const R = 300;
  // base ring of skulls/long bones
  for (let i = 0; i < 16; i++) { const kk = clamp(k * 4 - i / 16 * 1.2); if (kk <= 0) continue; const a = Math.PI + i / 15 * Math.PI; const bx = Math.cos(a) * R, by = Math.sin(a) * 40; g.save(); g.globalAlpha = kk; g.translate(bx, by - (1 - kk) * 80); g.fillStyle = '#e8dcc0'; g.strokeStyle = '#8a7a5a'; g.lineWidth = 4; g.beginPath(); g.ellipse(0, -30, 46, 40, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#5a4a3a'; g.beginPath(); g.arc(-14, -34, 9, 0, 7); g.arc(14, -34, 9, 0, 7); g.fill(); g.restore(); }
  // dome of stacked long bones / jaws (shingles)
  const rows = 7;
  for (let r = 0; r < rows; r++) { const kk = clamp(k * 3 - 0.6 - r * 0.25); if (kk <= 0) continue; const rr_ = R * Math.cos(r / rows * Math.PI / 2) * 0.95, yy = -80 - Math.sin(r / rows * Math.PI / 2) * 380; const n = Math.max(3, Math.round(12 * Math.cos(r / rows * Math.PI / 2)));
    for (let i = 0; i < n; i++) { const a = Math.PI + (i + 0.5) / n * Math.PI; g.save(); g.globalAlpha = kk; g.translate(Math.cos(a) * rr_, yy + Math.sin(a) * 30 - (1 - kk) * 60); g.rotate(Math.cos(a) * 0.4); g.fillStyle = r % 2 ? '#d8ccb0' : '#ece2c8'; g.strokeStyle = '#8a7a5a'; g.lineWidth = 3; g.beginPath(); g.moveTo(-40, 0); g.quadraticCurveTo(0, -36, 40, 0); g.quadraticCurveTo(0, 10, -40, 0); g.fill(); g.stroke(); g.restore(); } }
  // tusk arch entrance
  const tk = clamp(k * 2.2 - 1.1);
  if (tk > 0) { g.globalAlpha = tk; ink(g, '#8a7a5a', 30); g.beginPath(); g.moveTo(-90, 40); g.quadraticCurveTo(-110, -260, 20, -250); g.moveTo(90, 40); g.quadraticCurveTo(110, -260, -20, -250); g.stroke(); ink(g, '#f4ead4', 22); g.stroke(); g.globalAlpha = 1; g.fillStyle = '#120a06'; g.beginPath(); g.ellipse(0, 20, 70, 120, 0, Math.PI, 0); g.fill(); if (o.fireGlow) glow(g, 0, -20, 140, 'rgba(255,140,50,A)', 0.6 + 0.2 * Math.sin(t * 9)); }
  g.restore();
}
function dryingRack(g, x, y, s, t, n = 6, smoke = 1) {
  ink(g, '#4a3420', 10 * s); g.beginPath(); g.moveTo(x - 220 * s, y); g.lineTo(x - 180 * s, y - 300 * s); g.moveTo(x + 220 * s, y); g.lineTo(x + 180 * s, y - 300 * s); g.moveTo(x - 200 * s, y - 290 * s); g.lineTo(x + 200 * s, y - 290 * s); g.stroke();
  for (let i = 0; i < n; i++) { const mx = x - 160 * s + i * 64 * s, sw = Math.sin(t * 2 + i) * 4; g.fillStyle = '#8a2a1a'; g.strokeStyle = '#3a1008'; g.lineWidth = 3; g.beginPath(); g.moveTo(mx - 14 * s, y - 285 * s); g.lineTo(mx + 14 * s, y - 285 * s); g.lineTo(mx + 10 * s + sw, y - 140 * s); g.lineTo(mx - 10 * s + sw, y - 140 * s); g.closePath(); g.fill(); g.stroke(); }
  if (smoke) { embers(g, x, y - 20 * s, s * 0.8, t, 1); for (let i = 0; i < 10; i++) { const life = (t * 0.3 + i / 10) % 1; g.fillStyle = `rgba(190,180,170,${0.35 * (1 - life) * smoke})`; g.beginPath(); g.arc(x + Math.sin(life * 5 + i) * 60 * s, y - 60 * s - life * 380 * s, (30 + life * 80) * s, 0, 7); g.fill(); } }
}
function dayLengthDial(g, x, y, r, daylight, t) {
  // 24h ring; daylight hours highlighted
  g.save(); g.translate(x, y);
  g.fillStyle = '#0a0e18'; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
  const a0 = -Math.PI / 2 - (daylight / 24) * Math.PI, a1 = -Math.PI / 2 + (daylight / 24) * Math.PI;
  g.fillStyle = '#ffcf5a'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, a0, a1); g.closePath(); g.fill();
  g.fillStyle = '#16203a'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, a1, a0 + Math.PI * 2); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 4; for (let h = 0; h < 24; h++) { const a = -Math.PI / 2 + h / 24 * Math.PI * 2; g.beginPath(); g.moveTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); g.stroke(); }
  g.fillStyle = '#0a0e18'; g.beginPath(); g.arc(0, 0, r * 0.55, 0, 7); g.fill();
  btext(g, BN(Math.round(daylight)) + ' ঘণ্টা আলো', 0, -20, r * 0.18, '#ffcf5a'); btext(g, BN(Math.round(24 - daylight)) + ' ঘণ্টা অন্ধকার', 0, r * 0.2, r * 0.15, '#9fb8ff');
  g.restore();
}
// HUD: four threats tracker (retention)
const THREATS = [['ঠান্ডা', '#7ad8ff'], ['রাত', '#b08aff'], ['ক্ষুধা', '#ffb04a'], ['অন্ধকার', '#8a8aa0']];
function threatHUD(g, defeated, active, t, a = 1) {
  if (a <= 0) return; g.save(); g.globalAlpha = a;
  g.fillStyle = 'rgba(5,8,12,0.55)'; rr(g, 30, 30, 4 * 150 + 30, 96, 18); g.fill();
  THREATS.forEach(([n, c], i) => { const x = 60 + i * 150, on = i === active; g.fillStyle = on ? c : 'rgba(255,255,255,0.12)'; rr(g, x, 46, 130, 64, 12); g.fill(); btext(g, n, x + 65, 78, 34, on ? '#111' : '#fff', 1, { stroke: on ? c : '#111' }); if (defeated > i) { ink(g, '#2ecc71', 8); g.beginPath(); g.moveTo(x + 10, 100); g.lineTo(x + 120, 56); g.stroke(); } if (on) { g.strokeStyle = c; g.lineWidth = 3; g.globalAlpha = a * (0.5 + 0.5 * Math.sin(t * 6)); rr(g, x - 4, 42, 138, 72, 14); g.stroke(); g.globalAlpha = a; } });
  g.restore();
}
function chapterCard2(g, num, title, k, t, col) {
  if (k <= 0) return;
  g.save(); g.fillStyle = `rgba(4,6,10,${0.8 * k})`; g.fillRect(0, 0, W, H);
  const w = 1200 * easeOut(k); const gr = g.createLinearGradient(W / 2 - w / 2, 0, W / 2 + w / 2, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(W / 2 - w / 2, H / 2 + 80, w, 6);
  btext(g, num, W / 2, H / 2 - 120, 56, col, easeOutBack(k)); btext(g, title, W / 2, H / 2, 130, '#fff', easeOutBack(clamp(k * 1.3 - 0.2)));
  g.restore();
}

function embers(g, x, y, s, t, a = 1) {
  g.save(); g.globalAlpha = a; g.strokeStyle = '#4a2a16'; g.lineCap = 'round'; g.lineWidth = 22 * s; g.beginPath(); g.moveTo(x - 70 * s, y + 10 * s); g.lineTo(x + 60 * s, y - 14 * s); g.moveTo(x - 60 * s, y - 14 * s); g.lineTo(x + 70 * s, y + 12 * s); g.stroke();
  glow(g, x, y - 10 * s, 120 * s, 'rgba(255,120,40,A)', 0.5 + 0.2 * Math.sin(t * 7));
  for (let i = 0; i < 6; i++) { const life = (t * 0.25 + i / 6) % 1; g.fillStyle = `rgba(160,160,160,${0.4 * (1 - life)})`; g.beginPath(); g.arc(x + Math.sin(life * 5 + i) * 30 * s, y - 40 * s - life * 260 * s, (14 + life * 40) * s, 0, 7); g.fill(); }
  g.restore();
}
