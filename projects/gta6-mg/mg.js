// ===== "Ice & Ember" motion-graphics kit for 1080x1920 shorts =====
const PW = 1080, PH = 1920;
const CC = { bg0: '#040a13', bg1: '#0a1b2c', ice: '#8fe3ff', ice2: '#dff7ff', ember: '#ff8a2a', ember2: '#ffcf5a', red: '#ff4d5a', white: '#f4f8ff', ink: '#02060c', green: '#3ce39a' };
const easeIO = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
// ---------- backgrounds ----------
function bgMG(g, t, mode = 'ice', o = {}) {
  const pal = { ice: ['#0d2a40', '#06121f', '#02060c'], ember: ['#3a160a', '#1a0a06', '#060302'], dark: ['#0a1018', '#04070c', '#010204'], red: ['#3a0a12', '#16050a', '#050103'] }[mode];
  const cx = o.cx || PW / 2, cy = o.cy || PH * 0.42;
  const rg = g.createRadialGradient(cx, cy, 40, cx, cy, PH * 0.75); rg.addColorStop(0, pal[0]); rg.addColorStop(0.55, pal[1]); rg.addColorStop(1, pal[2]); g.fillStyle = rg; g.fillRect(0, 0, PW, PH);
  const ac = mode === 'ember' || mode === 'red' ? '255,150,70' : '143,227,255';
  // dot grid (parallax drift)
  g.save(); g.globalAlpha = 0.18; g.fillStyle = `rgb(${ac})`; const sp = 54, ox = (t * 6) % sp, oy = (t * 10) % sp;
  for (let y = -sp; y < PH + sp; y += sp) for (let x = -sp; x < PW + sp; x += sp) { const d = Math.hypot(x - cx, y - cy) / PH; const r = 1.6 + 1.2 * Math.sin(t * 1.5 + x * 0.02 + y * 0.013); g.globalAlpha = 0.22 * (1 - d); g.beginPath(); g.arc(x + ox, y + oy, Math.max(0.4, r), 0, 7); g.fill(); }
  g.restore();
  // perspective floor grid
  if (o.floor !== false) { const hz = o.hz || 1300; g.save(); g.strokeStyle = `rgba(${ac},0.22)`; g.lineWidth = 2; for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(PW / 2 + i * 30, hz); g.lineTo(PW / 2 + i * 260, PH + 40); g.stroke(); } for (let j = 0; j < 14; j++) { const p = ((j + t * 0.6) % 14) / 14, y = hz + Math.pow(p, 2.2) * (PH - hz + 60); g.globalAlpha = p; g.beginPath(); g.moveTo(0, y); g.lineTo(PW, y); g.stroke(); } g.restore(); const hg = g.createLinearGradient(0, hz - 140, 0, hz + 60); hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(1, `rgba(${ac},0.10)`); g.fillStyle = hg; g.fillRect(0, hz - 140, PW, 200); }
  // big soft orbs
  g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 3; i++) { const x = PW * (0.2 + 0.6 * hash(i + 11)) + Math.sin(t * 0.3 + i) * 60, y = PH * (0.2 + 0.5 * hash(i + 13)) + Math.cos(t * 0.25 + i) * 80; glow(g, x, y, 360 + i * 80, `rgba(${ac},A)`, 0.08); } g.restore();
  // frost / ember particles
  partsP(g, t, mode === 'ember' || mode === 'red' ? 'ember' : 'snow', o.np || 40);
}
function partsP(g, t, kind = 'snow', n = 40, a = 1) {
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) {
    const sp = 30 + hash(i + 3) * 70, r = 1.5 + hash(i + 5) * 4;
    let x, y; if (kind === 'snow') { x = (hash(i) * PW + t * (10 + hash(i + 7) * 20) + Math.sin(t + i) * 20) % PW; y = (hash(i + 1) * PH + t * sp) % PH; }
    else { x = (hash(i) * PW + Math.sin(t * 2 + i) * 30) % PW; y = PH - ((hash(i + 1) * PH + t * sp * 1.6) % PH); }
    const al = (0.35 + 0.65 * hash(i + 9)) * a; g.fillStyle = kind === 'snow' ? `rgba(220,245,255,${al})` : `rgba(255,${140 + Math.round(hash(i) * 90)},60,${al})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  g.restore();
}
function snowStorm(g, t, n = 160, wind = 1, a = 0.8) { g.save(); for (let i = 0; i < n; i++) { const sp = 400 + hash(i) * 600, x = ((hash(i + 1) * (PW + 600) + t * sp * wind) % (PW + 600)) - 300, y = (hash(i + 2) * PH + t * sp * 0.6) % PH, l = 12 + hash(i + 3) * 30; g.strokeStyle = `rgba(230,245,255,${a * (0.3 + hash(i + 4) * 0.6)})`; g.lineWidth = 1.5 + hash(i + 5) * 2.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - l * wind, y - l * 0.6); g.stroke(); } g.restore(); }
// ---------- HUD ----------
function corners(g, x, y, w, h, col = CC.ice, a = 1, L = 46, lw = 4) { g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = lw; g.shadowColor = col; g.shadowBlur = 12; g.beginPath(); for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const px = x + sx * w, py = y + sy * h, dx = sx ? -1 : 1, dy = sy ? -1 : 1; g.moveTo(px, py + dy * L); g.lineTo(px, py); g.lineTo(px + dx * L, py); } g.stroke(); g.restore(); }
function chip(g, s, x, y, col = CC.ice, size = 30, a = 1, align = 'center') { g.save(); g.globalAlpha = a; g.font = `bold ${size}px "Nirmala UI"`; const w = g.measureText(s).width + size * 1.1, h = size * 1.6; const x0 = align === 'left' ? x : x - w / 2; g.fillStyle = 'rgba(4,10,18,0.72)'; rr(g, x0, y - h / 2, w, h, h / 2); g.fill(); g.strokeStyle = col; g.lineWidth = 2; rr(g, x0, y - h / 2, w, h, h / 2); g.stroke(); g.fillStyle = col; g.beginPath(); g.arc(x0 + size * 0.55, y, size * 0.16, 0, 7); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(s, x0 + size * 0.85, y + 1); g.restore(); }
function hudFrame(g, t, col = CC.ice, label = '') { corners(g, 40, 120, PW - 80, PH - 420, col, 0.55, 60, 3); g.save(); g.globalAlpha = 0.5; g.fillStyle = col; g.font = 'bold 24px Consolas, monospace'; g.textAlign = 'left'; g.fillText('● REC  ' + new Date(0, 0, 0, 0, 0, t).toTimeString().slice(3, 8), 70, 160); g.textAlign = 'right'; g.fillText(label, PW - 70, 160); g.restore(); }
// ---------- line-art icons (draw-on) ----------
const PI2 = Math.PI * 2;
function pc(cx, cy, r, a0 = 0, a1 = PI2, n = 40, ry) { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * (ry || r)]); } return p; }
function pb(p0, p1, p2, p3, n = 20) { const o = []; for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; o.push([v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]]); } return o; }
const L2 = (a, b, c, d) => [[a, b], [c, d]];
const ICONS = {
  snow: () => { const o = []; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, c = Math.cos(a), s = Math.sin(a); o.push(L2(0, 0, c * 100, s * 100)); for (const d of [45, 75]) { const bx = c * d, by = s * d, k = d === 45 ? 26 : 18; for (const sg of [-1, 1]) { const b = a + sg * 0.7; o.push(L2(bx, by, bx + Math.cos(b) * k, by + Math.sin(b) * k)); } } } o.push(pc(0, 0, 16, 0, PI2, 6)); return o; },
  flame: () => [pb([0, 100], [-90, 90], [-70, -10], [-10, -100]).concat(pb([-10, -100], [10, -40], [40, -50], [30, -80])).concat(pb([30, -80], [90, -10], [90, 90], [0, 100])), pb([0, 90], [-40, 80], [-30, 20], [0, -20]).concat(pb([0, -20], [10, 20], [45, 40], [0, 90]))],
  thermo: () => [pc(0, 70, 34, -1.15, 4.29, 30).concat([[16, -90]]), [[-16, 40], [-16, -90]], pc(0, -90, 16, Math.PI, PI2, 10), ...[0, 1, 2, 3].map(i => L2(30, -70 + i * 30, 48, -70 + i * 30))],
  blanket: () => [pb([-90, -60], [-30, -80], [30, -40], [90, -60]).concat([[90, 60]]).concat(pb([90, 60], [30, 40], [-30, 80], [-90, 60])).concat([[-90, -60]]), pb([-90, -10], [-30, -30], [30, 10], [90, -10]), L2(-60, -66, -60, 64), L2(60, -56, 60, 54)],
  heater: () => [[[-80, -80], [80, -80], [80, 70], [-80, 70], [-80, -80]], ...[-50, -17, 17, 50].map(x => L2(x, -55, x, 45)), L2(-60, 70, -60, 92), L2(60, 70, 60, 92)],
  shop: () => [[[-90, -40], [90, -40], [90, 90], [-90, 90], [-90, -40]], [[-100, -40], [-80, -90], [80, -90], [100, -40]], ...[-60, -20, 20, 60].map(x => pc(x, -40, 20, 0, Math.PI, 8)), [[-25, 90], [-25, 30], [25, 30], [25, 90]]],
  pelt: () => { const raw = [[0, -95], [35, -88], [55, -120], [75, -80], [70, -40], [110, -30], [120, 0], [85, 15], [80, 60], [105, 100], [70, 115], [35, 85], [0, 105], [-35, 85], [-70, 115], [-105, 100], [-80, 60], [-85, 15], [-120, 0], [-110, -30], [-70, -40], [-75, -80], [-55, -120], [-35, -88]]; let p = raw.concat([raw[0]]); for (let it = 0; it < 3; it++) { const q = []; for (let k = 0; k < p.length - 1; k++) { const a = p[k], b = p[k + 1]; q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } q.push(q[0]); p = q; } return [p, L2(-50, -30, -38, -10), L2(-20, -45, -10, -22), L2(15, -40, 22, -18), L2(45, -25, 52, -5), L2(-35, 30, -25, 50), L2(5, 25, 12, 48), L2(38, 30, 45, 52)]; },
  body: () => [pc(0, -70, 26, 0, PI2, 24), pb([-50, 110], [-55, 20], [-45, -30], [0, -36]).concat(pb([0, -36], [45, -30], [55, 20], [50, 110]))],
  cave: () => [[[-110, 90], [-90, 10], [-60, -50], [-20, -80], [30, -85], [70, -50], [95, 0], [110, 90]], pb([-50, 90], [-45, 0], [45, 0], [50, 90]), L2(-130, 90, 130, 90)],
  shield: () => [pb([0, -100], [40, -80], [70, -80], [80, -80]).concat(pb([80, -80], [85, 20], [50, 70], [0, 100])).concat(pb([0, 100], [-50, 70], [-85, 20], [-80, -80])).concat(pb([-80, -80], [-70, -80], [-40, -80], [0, -100])), [[-35, 0], [-8, 28], [40, -30]]],
  wind: () => [pb([-100, -40], [-20, -40], [40, -40], [40, -70]).concat(pb([40, -70], [40, -95], [10, -95], [10, -75])), pb([-100, 10], [0, 10], [70, 10], [70, -15]).concat(pb([70, -15], [70, -40], [40, -40], [40, -20])), pb([-100, 60], [-10, 60], [50, 60], [50, 85]).concat(pb([50, 85], [50, 105], [25, 105], [25, 90]))],
  meat: () => [pb([-10, -80], [-110, -90], [-120, 40], [-20, 40]).concat(pb([-20, 40], [30, 40], [60, -10], [-10, -80])), pb([-50, -40], [-40, -20], [-20, -10], [0, -20]), [[10, 25], [55, 70]], pc(70, 62, 16, 0, PI2, 14), pc(50, 86, 16, 0, PI2, 14)],
  wolf: () => [[[-70, -90], [-40, -30], [40, -30], [70, -90], [60, 0], [30, 70], [0, 90], [-30, 70], [-60, 0], [-70, -90]], pc(-28, 5, 8, 0, PI2, 8), pc(28, 5, 8, 0, PI2, 8), [[-12, 60], [0, 70], [12, 60]]],
  spear: () => [L2(-100, 100, 60, -60), [[60, -60], [70, -100], [100, -110], [90, -80], [60, -60]], L2(30, -50, 50, -30)],
  plate: () => [pc(0, 0, 80, 0, PI2, 40, 80), pc(0, 0, 54, 0, PI2, 30), L2(-110, -70, -110, 80), L2(-120, -70, -120, -30), L2(-100, -70, -100, -30), pb([110, 80], [110, 0], [110, -40], [125, -70]).concat([[110, -70], [110, -10]])],
  berry: () => [pc(-30, 20, 28, 0, PI2, 20), pc(25, 30, 28, 0, PI2, 20), pc(0, -18, 28, 0, PI2, 20), pb([0, -46], [10, -80], [40, -90], [60, -80]), pb([0, -46], [30, -60], [50, -60], [60, -80])],
  hourglass: () => [L2(-60, -90, 60, -90), L2(-60, 90, 60, 90), [[-50, -90], [-50, -60], [0, 0], [-50, 60], [-50, 90]], [[50, -90], [50, -60], [0, 0], [50, 60], [50, 90]]],
  q: () => [pc(0, -40, 50, Math.PI * 1.05, Math.PI * 2.4, 30).concat([[0, 30]]), pc(0, 70, 8, 0, PI2, 10)],
  bubble: () => [[[-100, -70], [100, -70], [100, 40], [10, 40], [-30, 80], [-25, 40], [-100, 40], [-100, -70]], L2(-60, -30, 60, -30), L2(-60, 0, 30, 0)],
  globe: () => [pc(0, 0, 100, 0, PI2, 48), pc(0, 0, 50, 0, PI2, 40, 100), L2(0, -100, 0, 100), pc(0, 0, 100, 0, PI2, 40, 34)],
  clock: () => [pc(0, 0, 100, 0, PI2, 48), L2(0, 0, 0, -65), L2(0, 0, 45, 25)],
  fireUse: () => [],
};
const ICACHE = {};
function iconPts(name) { if (!ICACHE[name]) { const ps = ICONS[name](); let tot = 0; const lens = ps.map(p => { let l = 0; for (let i = 1; i < p.length; i++) l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); tot += l; return l; }); ICACHE[name] = { ps, lens, tot }; } return ICACHE[name]; }
function drawIcon(g, name, x, y, s, k, col = CC.ice, lw = 7, o = {}) {
  if (k <= 0) return; const I = iconPts(name); let rem = clamp(k) * I.tot;
  g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
  const pass = (w, c, blur) => { let r = rem; g.strokeStyle = c; g.lineWidth = w / s; g.shadowColor = col; g.shadowBlur = blur; for (let j = 0; j < I.ps.length && r > 0; j++) { const p = I.ps[j]; g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) { const d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (r >= d) { g.lineTo(p[i][0], p[i][1]); r -= d; } else { const u = r / d; g.lineTo(p[i - 1][0] + (p[i][0] - p[i - 1][0]) * u, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * u); r = 0; break; } } g.stroke(); } };
  if (o.fill && k >= 1) { g.save(); g.globalAlpha = o.fill; g.fillStyle = col; for (const p of I.ps) { if (p.length < 6) continue; g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (const q of p) g.lineTo(q[0], q[1]); g.fill(); } g.restore(); }
  pass(lw * 2.4, 'rgba(0,0,0,0.35)', 0); pass(lw, col, 22); pass(lw * 0.35, 'rgba(255,255,255,0.85)', 0);
  g.restore();
}
// circular badge with icon
function iconBadge(g, name, x, y, r, k, col = CC.ice, o = {}) {
  if (k <= 0) return; const lt = tAge('IB' + name + x + y, k), e = easeOutBack(clamp(lt / 0.45));
  g.save(); g.translate(x, y); g.scale(e, e);
  g.fillStyle = 'rgba(4,12,22,0.78)'; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
  g.strokeStyle = col; g.lineWidth = 3; g.globalAlpha = 0.9; g.beginPath(); g.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + PI2 * clamp(lt / 0.7)); g.stroke();
  g.globalAlpha = 0.35; g.setLineDash([4, 10]); g.lineDashOffset = -NOW * 30; g.beginPath(); g.arc(0, 0, r + 16, 0, 7); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
  g.restore();
  drawIcon(g, name, x, y, r / 140 * e, clamp((lt - 0.1) / 0.8), col, 7, o);
}
// ---------- kinetic type ----------
function fontPx(size) { return `bold ${size}px "Nirmala UI"`; }
function hlText(g, s, x, y, size, k, fg = CC.ink, bgc = CC.ember2, key = '') {
  if (k <= 0) return; const lt = tAge('HL' + s + key, k); g.save(); g.font = fontPx(size); const w = g.measureText(s).width + size * 0.7, h = size * 1.35;
  const u = easeIO(clamp(lt / 0.35)), v = easeOut(clamp((lt - 0.15) / 0.35));
  g.translate(x, y); g.rotate(-0.025); g.fillStyle = bgc; g.shadowColor = bgc; g.shadowBlur = 30; g.fillRect(-w / 2, -h / 2, w * u, h); g.shadowBlur = 0;
  g.beginPath(); g.rect(-w / 2, -h / 2, w * u, h); g.clip(); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = v; g.fillText(s, (1 - v) * -40, size * 0.04); g.restore();
}
function glitchText(g, s, x, y, size, k, col = CC.ice, key = '') {
  if (k <= 0) return; const lt = tAge('GL' + s + key, k); g.save(); g.font = fontPx(size); g.textAlign = 'center'; g.textBaseline = 'middle';
  const gl = lt < 0.45 ? 1 - lt / 0.45 : (Math.sin(NOW * 9) > 0.97 ? 0.4 : 0); const a = clamp(lt * 5);
  if (gl > 0) { for (let i = 0; i < 3; i++) { const sl = (hash(Math.floor(NOW * 30) + i) - 0.5) * 60 * gl; g.globalAlpha = 0.7 * a; g.fillStyle = ['#ff2a6a', '#2affff', '#ffffff'][i]; g.fillText(s, x + sl + (i - 1) * 10 * gl, y + (i - 1) * 4 * gl); } }
  g.globalAlpha = a; g.shadowColor = col; g.shadowBlur = 40; g.lineWidth = size * 0.12; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.lineJoin = 'round'; g.strokeText(s, x, y); const gr = g.createLinearGradient(0, y - size / 2, 0, y + size / 2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, col); g.fillStyle = gr; g.fillText(s, x, y); g.restore();
}
function slam(g, s, x, y, size, k, col = CC.ember2, key = '') {
  if (k <= 0) return; const lt = tAge('SL' + s + key, k), u = clamp(lt / 0.22), sc = lerp(2.6, 1, easeOut(u)) + (lt > 0.22 ? Math.sin(clamp((lt - 0.22) / 0.4) * Math.PI) * 0.05 : 0);
  if (lt < 0.8) { g.save(); g.strokeStyle = col; g.globalAlpha = (1 - lt / 0.8) * 0.8; g.lineWidth = 8; g.beginPath(); g.ellipse(x, y, 100 + lt * 900, 40 + lt * 360, 0, 0, 7); g.stroke(); g.restore(); }
  g.save(); g.translate(x, y); g.scale(sc, sc); g.globalAlpha = clamp(u * 3); g.font = fontPx(size); g.textAlign = 'center'; g.textBaseline = 'middle';
  if (u < 1) { g.filter = `blur(${(1 - u) * 14}px)`; }
  g.shadowColor = col; g.shadowBlur = 50; g.lineWidth = size * 0.14; g.strokeStyle = '#0a0503'; g.lineJoin = 'round'; g.strokeText(s, 0, 0); g.shadowBlur = 0;
  const gr = g.createLinearGradient(0, -size / 2, 0, size / 2); gr.addColorStop(0, '#fff7d0'); gr.addColorStop(0.5, col); gr.addColorStop(1, mixC(col, '#802000', 0.5)); g.fillStyle = gr; g.fillText(s, 0, 0); g.filter = 'none'; g.restore();
}
function subLine(g, s, x, y, size, k, col = '#cfe6f5', key = '') { if (k <= 0) return; const lt = tAge('SB' + s + key, k), u = easeOut(clamp(lt / 0.5)); g.save(); g.globalAlpha = u; g.font = `${size}px "Nirmala UI"`; g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y + (1 - u) * 20); g.restore(); }
// connecting line that draws on
function drawLine(g, x0, y0, x1, y1, k, col = CC.ice, lw = 3, dash) { if (k <= 0) return; g.save(); g.strokeStyle = col; g.lineWidth = lw; g.shadowColor = col; g.shadowBlur = 10; if (dash) g.setLineDash(dash); g.beginPath(); g.moveTo(x0, y0); g.lineTo(lerp(x0, x1, clamp(k)), lerp(y0, y1, clamp(k))); g.stroke(); g.restore(); if (k > 0 && k < 1) { g.save(); g.globalCompositeOperation = 'screen'; glow(g, lerp(x0, x1, k), lerp(y0, y1, k), 30, 'rgba(255,255,255,A)', 0.8); g.restore(); } }
function strike(g, x, y, w, k, col = CC.red) { if (k <= 0) return; g.save(); g.strokeStyle = col; g.lineWidth = 12; g.lineCap = 'round'; g.shadowColor = col; g.shadowBlur = 18; g.beginPath(); g.moveTo(x - w / 2, y + 10); g.lineTo(x - w / 2 + w * easeOut(clamp(k)), y - 10); g.stroke(); g.restore(); }
// glass panel
function glass(g, x, y, w, h, a = 0.6, col = 'rgba(143,227,255,0.45)', r = 30) { g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 40; g.fillStyle = `rgba(6,14,24,${a})`; rr(g, x, y, w, h, r); g.fill(); g.shadowColor = 'transparent'; const sg = g.createLinearGradient(x, y, x + w * 0.6, y + h); sg.addColorStop(0, 'rgba(255,255,255,0.12)'); sg.addColorStop(0.35, 'rgba(255,255,255,0)'); g.fillStyle = sg; rr(g, x, y, w, h, r); g.fill(); g.strokeStyle = col; g.lineWidth = 2.5; rr(g, x, y, w, h, r); g.stroke(); g.restore(); }
// vertical thermometer gauge
function thermoGauge(g, x, y, h, v, col, k = 1, labels = true) {
  g.save(); g.globalAlpha = clamp(k * 2); glass(g, x - 56, y - h - 40, 112, h + 140, 0.55);
  g.fillStyle = 'rgba(255,255,255,0.08)'; rr(g, x - 18, y - h, 36, h, 18); g.fill();
  const lv = h * clamp(v); const gr = g.createLinearGradient(0, y, 0, y - h); gr.addColorStop(0, col); gr.addColorStop(1, mixC(col, '#ffffff', 0.4)); g.fillStyle = gr; g.shadowColor = col; g.shadowBlur = 24; rr(g, x - 14, y - lv, 28, lv, 14); g.fill(); g.beginPath(); g.arc(x, y + 30, 34, 0, 7); g.fill(); g.shadowBlur = 0;
  if (labels) { g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; for (let i = 0; i <= 8; i++) { const yy = y - h * i / 8; g.beginPath(); g.moveTo(x + 22, yy); g.lineTo(x + (i % 2 ? 32 : 40), yy); g.stroke(); } }
  g.restore();
}
function ringGauge(g, x, y, r, v, col, k = 1, lw = 18) { g.save(); g.globalAlpha = clamp(k * 2); g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = lw; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 20; g.beginPath(); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + PI2 * clamp(v) + 0.001); g.stroke(); g.restore(); }
// rings tunnel (imagination)
function tunnel(g, t, cx, cy, col = '143,227,255', speed = 1) { g.save(); for (let i = 0; i < 16; i++) { const p = ((i / 16 + t * 0.35 * speed) % 1), r = Math.pow(p, 2.4) * 1400; g.strokeStyle = `rgba(${col},${p * 0.6})`; g.lineWidth = 2 + p * 8; g.beginPath(); g.ellipse(cx, cy, r, r * 1.15, 0, 0, 7); g.stroke(); } for (let i = 0; i < 40; i++) { const a = hash(i) * PI2, p = (hash(i + 3) + t * 0.6 * speed) % 1, d0 = Math.pow(p, 2) * 1300, d1 = d0 + 40 + p * 160; g.strokeStyle = `rgba(255,255,255,${p * 0.7})`; g.lineWidth = 1 + p * 3; g.beginPath(); g.moveTo(cx + Math.cos(a) * d0, cy + Math.sin(a) * d0); g.lineTo(cx + Math.cos(a) * d1, cy + Math.sin(a) * d1); g.stroke(); } g.restore(); }
function lightStreak(g, k, y = PH * 0.4, col = '255,220,160') { if (k <= 0 || k >= 1) return; const x = lerp(-300, PW + 300, easeIO(k)); g.save(); g.globalCompositeOperation = 'screen'; const gr = g.createLinearGradient(x - 260, 0, x + 260, 0); gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(0.5, `rgba(${col},0.55)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.translate(x, y); g.rotate(-0.35); g.fillRect(-260, -PH, 520, PH * 2); g.restore(); }
