// ===== PRO layer: lit ink characters, kinetic type, rich environments, depth =====
let NOW = 0, CURB = 0, HUDON = false;
const INK = '#241726';
const _tmp = {};
function tmpC(name) { let c = _tmp[name]; if (!c) c = _tmp[name] = mk(W, H); const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, W, H); return [c, x]; }
// draw fn into an offscreen layer (same camera transform), then composite with a CSS filter
function layer(g, filter, fn, alpha = 1, name = 'L1') { const [c, x] = tmpC(name); x.setTransform(g.getTransform()); fn(x); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = alpha; g.filter = filter; g.drawImage(c, 0, 0); g.restore(); }
const blurLayer = (g, px, fn, a = 1) => layer(g, `blur(${px}px)`, fn, a, 'BL');

// ---------- thermal (ironbow) SVG filters ----------
(function () {
  const R = '0.02 0.16 0.48 0.75 1 1 1 1', G = '0 0.04 0.1 0.16 0.35 0.63 0.88 0.98', B = '0.1 0.35 0.6 0.48 0.16 0.12 0.29 0.88';
  const lum = '<feColorMatrix type="matrix" values="0.3 0.59 0.11 0 0 0.3 0.59 0.11 0 0 0.3 0.59 0.11 0 0 0 0 0 1 0"/>';
  const pal = `<feComponentTransfer><feFuncR type="table" tableValues="${R}"/><feFuncG type="table" tableValues="${G}"/><feFuncB type="table" tableValues="${B}"/></feComponentTransfer>`;
  const gam = e => `<feComponentTransfer><feFuncR type="gamma" exponent="${e}"/><feFuncG type="gamma" exponent="${e}"/><feFuncB type="gamma" exponent="${e}"/></feComponentTransfer>`;
  const d = document.createElement('div');
  d.innerHTML = `<svg width="0" height="0" style="position:absolute"><defs><filter id="thEnv" color-interpolation-filters="sRGB">${lum}${gam(2.8)}${pal}</filter><filter id="thHot" color-interpolation-filters="sRGB">${lum}${gam(0.55)}${pal}</filter></defs></svg>`;
  document.body.appendChild(d);
})();
const thermalEnv = (g, fn) => layer(g, 'url(#thEnv)', fn, 1, 'TH1');
const thermalHot = (g, fn) => layer(g, 'url(#thHot) blur(1.5px)', fn, 1, 'TH2');

// ---------- lighting state for characters ----------
const LIGHTS = { day: ['#ffffff', 0, '#5a6a8a', 0.35], golden: ['#ffb070', 0.22, '#5a3a6a', 0.42], dusk: ['#ff9a7a', 0.15, '#2a2040', 0.5], night: ['#8aa0d0', 0.3, '#0a1020', 0.6], fire: ['#ffa050', 0.3, '#2a0e14', 0.55] };
let LT = LIGHTS.day, LD = 1;
function cel(g, x0, x1, base) {
  const lit = LT[1] ? mixC(base, LT[0], LT[1]) : base, sh = mixC(base, LT[2], LT[3]);
  const gr = g.createLinearGradient(x0, 0, x1, 0);
  if (LD > 0) { gr.addColorStop(0, sh); gr.addColorStop(0.3, sh); gr.addColorStop(0.38, lit); gr.addColorStop(1, lit); }
  else { gr.addColorStop(0, lit); gr.addColorStop(0.62, lit); gr.addColorStop(0.7, sh); gr.addColorStop(1, sh); }
  return gr;
}
function inkPath(g, fill, lw = 5) { g.fillStyle = fill; g.fill(); g.strokeStyle = INK; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(); }
function inkLimb(g, pts, w, col) { g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.strokeStyle = INK; g.lineWidth = w + 9; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); }
const armPts = (sx, sy, a1, a2, l1 = 58, l2 = 54) => { const ex = sx + Math.sin(a1) * l1, ey = sy + Math.cos(a1) * l1; return [[sx, sy], [ex, ey], [ex + Math.sin(a2) * l2, ey + Math.cos(a2) * l2]]; };
function mitt(g, x, y, col, r = 14) { g.beginPath(); g.arc(x, y, r, 0, 7); inkPath(g, col, 4.5); }

// ---------- the ice-age person ----------
// act: stand walk carry sit warm sew scrape knap dig lift spear point talk shiver eat sleep throw drag
function person(g, x, y, s, t, o = {}) {
  const act = o.act || 'stand', seed = o.seed != null ? o.seed : (x * 0.013 + s), ph = t * (o.speed || 1) + seed;
  const kid = o.kid, sc = s * (kid ? 0.66 : 1);
  LT = LIGHTS[o.light || 'day']; LD = (o.lx != null ? (o.lx > x ? 1 : -1) : (o.ld || 1)) * (o.flip ? -1 : 1);
  const coat = o.coat || ['#8a5a36', '#6e4a30', '#7a4e3a', '#5e5a44', '#94683e'][Math.floor(hash(Math.round(seed * 7)) * 5)];
  const fur = o.fur || '#efe3c8', skin = o.skin || ['#c98a5e', '#b8784e', '#d29a6a', '#a86a44'][Math.floor(hash(Math.round(seed * 11)) * 4)];
  const pants = mixC(coat, '#20140c', 0.45), boot = '#4a3222';
  g.save(); g.translate(x, y); g.scale(sc * (o.flip ? -1 : 1), sc);
  if (act !== 'sleep') { g.fillStyle = 'rgba(10,6,14,0.3)'; g.beginPath(); g.ellipse(0, 2, act === 'sit' || act === 'warm' || act === 'sew' || act === 'eat' || act === 'knap' ? 92 : 64, 12, 0, 0, 7); g.fill(); }
  if (act === 'sleep') { sleeper(g, ph, coat, fur, skin); g.restore(); return; }
  const sitA = ['sit', 'warm', 'sew', 'eat', 'knap', 'talk'].includes(act) && !(act === 'talk' && !o.seated) ;
  const kneel = act === 'scrape';
  let yo = sitA ? 92 : kneel ? 52 : 0, lean = 0, bob = Math.sin(ph * 2.2) * 1.5;
  let aL = [-0.2, -0.1], aR = [0.2, 0.1], wk = 0, prop = null;
  const sw = Math.sin(ph * 7);
  switch (act) {
    case 'walk': case 'carry': case 'drag': wk = sw; bob = -Math.abs(Math.cos(ph * 7)) * 7; lean = 0.06; aL = [sw * 0.42, sw * 0.42 + 0.35]; aR = [-sw * 0.42, -sw * 0.42 + 0.35];
      if (act === 'carry') { aR = [2.75, 1.75]; aL = [2.95, 2.0]; prop = 'log'; } if (act === 'drag') { aR = [-0.9, -0.9]; aL = [-0.75, -0.8]; lean = 0.22; prop = 'drag'; } break;
    case 'warm': aL = [1.15, 1.35]; aR = [1.25, 1.45]; break;
    case 'sew': { const p = (ph * 0.9) % 1, pull = p < 0.6 ? p / 0.6 : 1 - (p - 0.6) / 0.4; aL = [0.55, 1.5]; aR = [0.5 + pull * 0.9, 1.3 + pull * 1.4]; prop = { k: 'sew', pull }; break; }
    case 'eat': { const e = Math.max(0, Math.sin(ph * 2.5)); aR = [0.6 + e * 1.6, 1.8 + e * 1.6]; aL = [0.4, 1.2]; prop = { k: 'eat', e }; break; }
    case 'knap': { const h = Math.abs(Math.sin(ph * 5)); aR = [1.0 + h * 0.9, 1.6 + h * 0.9]; aL = [0.7, 1.45]; prop = { k: 'knap', h }; break; }
    case 'scrape': { const m = Math.sin(ph * 4.5); lean = 0.42; aL = [0.95 + m * 0.22, 0.75 + m * 0.22]; aR = [1.05 + m * 0.22, 0.85 + m * 0.22]; prop = { k: 'scrape', m }; break; }
    case 'dig': { const m = Math.sin(ph * 4); lean = 0.32 + m * 0.08; aL = [0.85 + m * 0.2, 0.35 + m * 0.3]; aR = [1.0 + m * 0.2, 0.45 + m * 0.3]; prop = { k: 'dig', m }; break; }
    case 'lift': { const m = Math.sin(ph * 2) * 0.08; aL = [-2.45 + m, -2.85 + m]; aR = [2.45 + m, 2.85 + m]; prop = { k: 'lift' }; bob = Math.sin(ph * 2) * 3; break; }
    case 'spear': aR = [0.55, 0.05]; aL = [-0.25, -0.15]; prop = { k: 'spear' }; break;
    case 'point': aR = [1.95, 1.9]; aL = [-0.25, -0.1]; break;
    case 'talk': { const m = Math.sin(ph * 3.1), n = Math.sin(ph * 2.3 + 1); aR = [1.0 + m * 0.45, 1.9 + m * 0.6]; aL = [-0.7 + n * 0.3, -1.6 + n * 0.5]; break; }
    case 'shiver': { aL = [0.55, 2.2]; aR = [-0.55, -2.2]; g.translate(Math.sin(t * 47) * 2.2, 0); break; }
    case 'throw': { const k = o.k != null ? o.k : (ph * 0.8) % 1; aR = [lerp(3.3, 1.6, ease(k)), lerp(3.6, 1.6, ease(k))]; aL = [1.3, 1.5]; prop = { k: 'spearThrow', v: k }; break; }
    case 'sit': aL = [0.35, 1.25]; aR = [0.45, 1.35]; break;
  }
  // ---- legs ----
  if (sitA) {
    g.save(); g.translate(0, 0);
    inkLimb(g, [[-24, -14], [-74, -18], [-6, -4]], 30, pants); inkLimb(g, [[24, -14], [78, -16], [8, -2]], 30, pants);
    for (const bx of [-12, 14]) { g.beginPath(); g.ellipse(bx, -4, 22, 13, 0, 0, 7); inkPath(g, boot); }
    g.restore();
  } else if (kneel) {
    inkLimb(g, [[-18, -52], [-8, -6], [-62, -4]], 28, pants); inkLimb(g, [[18, -52], [46, -10], [6, -2]], 28, pants);
    g.beginPath(); g.ellipse(-70, -8, 22, 12, 0, 0, 7); inkPath(g, boot); g.beginPath(); g.ellipse(0, -6, 22, 12, 0, 0, 7); inkPath(g, boot);
  } else {
    const l1 = wk * 0.42, l2 = -wk * 0.42;
    for (const [hx, a] of [[-18, l2], [18, l1]]) { const kb = Math.max(0, Math.sin(a * 3)) * 0.0; const kx = hx + Math.sin(a) * 50, ky = -100 + yo + bob + Math.cos(a) * 50; const fx = kx + Math.sin(a - Math.max(0, -a) * 0.9) * 48, fy = Math.min(-6, ky + 48); inkLimb(g, [[hx, -104 + bob], [kx, ky], [fx, fy]], 30, pants); g.beginPath(); g.ellipse(fx + 8, fy + 2, 24, 13, 0, 0, 7); inkPath(g, boot); g.strokeStyle = fur; g.lineWidth = 7; g.beginPath(); g.moveTo(fx - 12, fy - 10); g.lineTo(fx + 16, fy - 10); g.stroke(); void kb; }
  }
  if (act === 'scrape') { g.beginPath(); g.moveTo(20, -2); g.quadraticCurveTo(150, -30, 280, -6); g.quadraticCurveTo(292, 6, 270, 10); g.lineTo(20, 10); g.closePath(); inkPath(g, cel(g, 20, 290, '#b08a5c'), 4); g.strokeStyle = 'rgba(80,50,20,0.4)'; g.lineWidth = 2; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(40 + i * 30, -8); g.lineTo(52 + i * 30, 4); g.stroke(); } }
  // ---- torso ----
  g.save(); g.translate(0, yo + bob - (sitA ? 0 : 0)); g.translate(0, -100); g.rotate(lean); g.translate(0, 100);
  if (prop === 'drag') { /* drawn later */ }
  const top = sitA ? -230 : -232;
  if (o.drape) { // hide thrown over bare body (gaps!)
    g.beginPath(); g.moveTo(-34, top + 4); g.quadraticCurveTo(-46, -170, -44, -104); g.lineTo(44, -104); g.quadraticCurveTo(46, -170, 34, top + 4); g.closePath(); inkPath(g, cel(g, -46, 46, skin));
    g.beginPath(); g.moveTo(-50, top - 6); g.quadraticCurveTo(0, top - 30, 50, top - 6); g.lineTo(38, -150); g.lineTo(10, -128); g.lineTo(-20, -160); g.lineTo(-52, -140); g.closePath(); inkPath(g, cel(g, -52, 50, '#8a6a44'));
    g.strokeStyle = 'rgba(40,20,10,0.35)'; g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-40 + i * 15, top); g.lineTo(-44 + i * 15, top + 30); g.stroke(); }
  } else {
    g.beginPath(); g.moveTo(-40, top); g.quadraticCurveTo(-62, -172, -62, -100); g.quadraticCurveTo(0, -90, 62, -100); g.quadraticCurveTo(62, -172, 40, top); g.closePath(); inkPath(g, cel(g, -62, 62, coat));
    // stitched seam (sewn clothing!) + fur hem
    g.strokeStyle = mixC(coat, '#1a0e08', 0.5); g.lineWidth = 3; g.beginPath(); g.moveTo(8, top + 6); g.quadraticCurveTo(12, -160, 8, -100); g.stroke();
    g.strokeStyle = fur; g.lineWidth = 2.5; for (let i = 0; i < 9; i++) { const yy = top + 14 + i * 13; g.beginPath(); g.moveTo(3, yy); g.lineTo(14, yy + 4); g.stroke(); }
    g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 22; g.beginPath(); g.moveTo(-60, -100); g.quadraticCurveTo(0, -88, 60, -100); g.stroke(); g.strokeStyle = fur; g.lineWidth = 15; g.stroke();
    for (let i = 0; i < 12; i++) { const xx = -56 + i * 10; g.strokeStyle = mixC(fur, '#a08a6a', 0.4); g.lineWidth = 2; g.beginPath(); g.moveTo(xx, -96 + Math.abs(xx) * 0.04); g.lineTo(xx + 2, -86 + Math.abs(xx) * 0.04); g.stroke(); }
  }
  // ---- props behind hands ----
  const sL = [-42, top + 22], sR = [42, top + 22];
  const L = armPts(sL[0], sL[1], aL[0], aL[1]), Rr = armPts(sR[0], sR[1], aR[0], aR[1]);
  const sleeve = o.drape ? skin : coat;
  if (prop && prop.k === 'spear') { ink(g, INK, 11); g.beginPath(); g.moveTo(Rr[2][0] + 4, 100 - yo); g.lineTo(Rr[2][0] + 10, -380); g.stroke(); ink(g, '#7a5232', 6); g.stroke(); g.beginPath(); g.moveTo(Rr[2][0] + 2, -378); g.lineTo(Rr[2][0] + 18, -378); g.lineTo(Rr[2][0] + 11, -425); g.closePath(); inkPath(g, '#9a9488', 4); }
  if (prop && prop.k === 'dig') { const hx = (L[2][0] + Rr[2][0]) / 2, hy = (L[2][1] + Rr[2][1]) / 2; ink(g, INK, 12); g.beginPath(); g.moveTo(hx - 40, hy - 70); g.lineTo(hx + 60, hy + 90); g.stroke(); ink(g, '#8a6a44', 7); g.stroke(); }
  // ---- arms ----
  inkLimb(g, L, 24, sleeve); inkLimb(g, Rr, 24, sleeve);
  if (!o.drape) { for (const A of [L, Rr]) { const [ex, ey] = A[2], [px, py] = A[1]; const dx = ex - px, dy = ey - py, d = Math.hypot(dx, dy) || 1; g.strokeStyle = INK; g.lineWidth = 15; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - dx / d * 14, ey - dy / d * 14); g.lineTo(ex - dx / d * 4, ey - dy / d * 4); g.stroke(); g.strokeStyle = fur; g.lineWidth = 9; g.stroke(); } }
  mitt(g, L[2][0], L[2][1], o.drape ? skin : mixC(coat, '#2a1a10', 0.25)); mitt(g, Rr[2][0], Rr[2][1], o.drape ? skin : mixC(coat, '#2a1a10', 0.25));
  // ---- hand props ----
  if (prop === 'log' || (prop && prop.k === 'lift')) { const hx = (L[2][0] + Rr[2][0]) / 2, hy = Math.min(L[2][1], Rr[2][1]) - 6; g.save(); g.translate(hx, hy); g.rotate(prop === 'log' ? -0.08 : 0.05); if (o.item === 'tusk' || (prop.k === 'lift' && o.item !== 'log')) { ink(g, INK, 26); g.beginPath(); g.moveTo(-120, 10); g.quadraticCurveTo(0, -60, 130, -10); g.stroke(); ink(g, '#f2e8d0', 17); g.stroke(); } else if (o.item === 'bone') { ink(g, INK, 22); g.beginPath(); g.moveTo(-110, 0); g.lineTo(110, 0); g.stroke(); ink(g, BONE, 14); g.stroke(); for (const e of [-110, 110]) { g.beginPath(); g.arc(e, -7, 13, 0, 7); g.arc(e, 7, 13, 0, 7); inkPath(g, BONE, 3); } } else { ink(g, INK, 30); g.beginPath(); g.moveTo(-120, 0); g.lineTo(120, -6); g.stroke(); ink(g, '#6a4628', 22); g.stroke(); } g.restore(); }
  if (prop && prop.k === 'sew') { const hide = [L[2][0] + 10, L[2][1] + 4]; g.save(); g.beginPath(); g.ellipse(hide[0] + 20, hide[1] + 14, 58, 26, -0.2, 0, 7); inkPath(g, cel(g, hide[0] - 40, hide[0] + 80, '#9a7048'), 4); g.restore(); ink(g, '#f4ead0', 2.5); g.beginPath(); g.moveTo(hide[0] + 18, hide[1] + 6); g.quadraticCurveTo((hide[0] + Rr[2][0]) / 2, Math.min(hide[1], Rr[2][1]) - 30 * prop.pull, Rr[2][0], Rr[2][1]); g.stroke(); g.save(); g.translate(Rr[2][0], Rr[2][1] - 6); g.rotate(-0.6); g.fillStyle = BONE; g.fillRect(-2, -26, 4, 26); g.restore(); }
  if (prop && prop.k === 'scrape') { const hx = (L[2][0] + Rr[2][0]) / 2; g.save(); g.translate(hx, (L[2][1] + Rr[2][1]) / 2 + 10); g.beginPath(); g.ellipse(0, 0, 16, 9, 0.3, 0, 7); inkPath(g, '#8a8478', 3); g.restore(); if (prop.m > 0.6) for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(240,230,210,0.8)'; g.beginPath(); g.arc(hx + 20 + i * 9, 100 - yo - 30 - i * 6, 3, 0, 7); g.fill(); } }
  if (prop && prop.k === 'knap') { const sx_ = L[2][0] + 6, sy_ = L[2][1] - 2; g.beginPath(); g.ellipse(sx_, sy_, 18, 12, 0.4, 0, 7); inkPath(g, '#6a6e78', 3); g.beginPath(); g.arc(Rr[2][0], Rr[2][1] - 10, 13, 0, 7); inkPath(g, '#8a8478', 3); if (prop.h < 0.2) for (let i = 0; i < 5; i++) { g.fillStyle = '#ffe9a0'; g.fillRect(sx_ + Math.cos(i * 1.3) * (14 + i * 6), sy_ - 10 - Math.sin(i * 1.3) * (10 + i * 5), 4, 4); } }
  if (prop && prop.k === 'eat') { g.beginPath(); g.ellipse(Rr[2][0] + 6, Rr[2][1] - 14, 10, 22, 0.4, 0, 7); inkPath(g, '#8a2a1a', 3); }
  if (prop && prop.k === 'spearThrow' && prop.v < 0.55) { ink(g, INK, 10); g.beginPath(); g.moveTo(Rr[2][0] - 150, Rr[2][1] + 30); g.lineTo(Rr[2][0] + 160, Rr[2][1] - 40); g.stroke(); ink(g, '#7a5232', 5); g.stroke(); }
  // ---- head ----
  headDraw(g, 6, top - 50, ph, t, o, coat, fur, skin);
  g.restore();
  if (prop === 'drag') { /* sledge of bones/wood behind */ g.save(); g.translate(-150 * (o.flip ? -1 : 1), 0); g.restore(); }
  g.restore();
}
function headDraw(g, hx, hy, ph, t, o, coat, fur, skin) {
  g.save(); g.translate(hx, hy); if (o.kid) g.scale(1.16, 1.16);
  const hood = o.hood !== false && !o.drape;
  if (hood) { g.beginPath(); g.ellipse(-2, 4, 58, 60, 0, 0, 7); inkPath(g, cel(g, -60, 56, coat)); }
  else { g.beginPath(); g.ellipse(0, -6, 44, 46, 0, 0, 7); inkPath(g, o.elder ? '#c8c4bc' : '#2a1a12'); }
  // face
  g.beginPath(); g.ellipse(4, 8, 38, 42, 0, 0, 7); inkPath(g, cel(g, -34, 42, skin), 4.5);
  if (!hood) { g.fillStyle = o.elder ? '#c8c4bc' : '#2a1a12'; g.beginPath(); g.ellipse(2, -22, 40, 18, 0, Math.PI, 0); g.fill(); }
  if (o.female) { for (const sx of [-1, 1]) { ink(g, INK, 15); g.beginPath(); g.moveTo(sx * 40 + 4, 10); g.quadraticCurveTo(sx * 48 + 4, 50, sx * 40 + 4, 80); g.stroke(); ink(g, '#3a2414', 9); g.stroke(); } }
  // eyes (3/4 facing +x)
  const bl = ((t * 0.43 + (o.seed || hx) * 0.37) % 1) < 0.04, look = o.look != null ? o.look : 2.5, mood = o.mood || (o.act === 'shiver' ? 'cold' : o.act === 'talk' ? 'talk' : 'neutral');
  for (const ex of [-10, 20]) {
    if (bl) { ink(g, INK, 3.5); g.beginPath(); g.moveTo(ex - 7, 2); g.lineTo(ex + 7, 2); g.stroke(); continue; }
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex, 0, 8.5, 10.5, 0, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = '#1a0e10'; g.beginPath(); g.arc(ex + look, 1 + (mood === 'focus' ? 3 : 0), 5, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(ex + look + 1, -3, 2, 2);
  }
  // brows
  ink(g, o.elder ? '#e8e4dc' : '#2a1a12', 4.5);
  const bi = { neutral: 0, talk: -0.1, happy: -0.15, worried: 0.35, cold: 0.3, focus: -0.3, angry: -0.45 }[mood] || 0;
  g.beginPath(); g.moveTo(-18, -16 + bi * 6); g.lineTo(-3, -17 - bi * 6); g.moveTo(12, -17 - bi * 6); g.lineTo(28, -16 + bi * 6); g.stroke();
  // cheeks + nose
  if (mood === 'cold' || o.cold || o.light === 'night' || o.light === 'day') { g.fillStyle = 'rgba(230,80,80,0.32)'; g.beginPath(); g.arc(-18, 20, 8, 0, 7); g.arc(32, 20, 8, 0, 7); g.fill(); }
  g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(8, 6); g.quadraticCurveTo(16, 18, 6, 20); g.stroke();
  // mouth
  ink(g, INK, 3.5);
  if (mood === 'talk' || o.talking) { const m = 3 + 9 * Math.abs(Math.sin(t * 11 + (o.seed || 0))) * (0.5 + 0.5 * Math.sin(t * 2.3)); g.beginPath(); g.ellipse(9, 32, 9, m, 0, 0, 7); g.fillStyle = '#5a1a20'; g.fill(); g.stroke(); }
  else if (mood === 'happy') { g.beginPath(); g.arc(9, 26, 11, 0.2, Math.PI - 0.2); g.stroke(); }
  else if (mood === 'worried' || mood === 'cold') { g.beginPath(); g.moveTo(0, 34); g.quadraticCurveTo(5, 28, 9, 33); g.quadraticCurveTo(13, 38, 18, 32); g.stroke(); }
  else if (mood === 'focus') { g.beginPath(); g.moveTo(2, 32); g.lineTo(16, 31); g.stroke(); }
  else { g.beginPath(); g.moveTo(1, 31); g.quadraticCurveTo(9, 35, 17, 31); g.stroke(); }
  if (o.beard || o.elder) { g.beginPath(); g.moveTo(-26, 22); g.quadraticCurveTo(8, 86, 40, 22); g.quadraticCurveTo(8, 50, -26, 22); inkPath(g, o.elder ? '#d8d4cc' : '#3a2416', 3); }
  // fur ring on hood
  if (hood) { g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 24; g.beginPath(); g.ellipse(4, 6, 44, 49, 0, 0, 7); g.stroke(); g.strokeStyle = fur; g.lineWidth = 17; g.stroke(); g.strokeStyle = mixC(fur, '#9a8a6a', 0.45); g.lineWidth = 2.5; for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; g.beginPath(); g.moveTo(4 + Math.cos(a) * 40, 6 + Math.sin(a) * 45); g.lineTo(4 + Math.cos(a + 0.06) * 52, 6 + Math.sin(a + 0.06) * 57); g.stroke(); } }
  g.restore();
}
function sleeper(g, ph, coat, fur, skin) {
  const br = Math.sin(ph * 1.6) * 3;
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(0, 4, 140, 16, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(-100, -34, 34, 30, 0, 0, 7); inkPath(g, cel(g, -134, -66, skin));
  ink(g, INK, 3); g.beginPath(); g.moveTo(-108, -36); g.lineTo(-96, -36); g.moveTo(-90, -36); g.lineTo(-80, -36); g.stroke();
  g.beginPath(); g.moveTo(-80, 0); g.quadraticCurveTo(-60, -80 - br, 40, -70 - br); g.quadraticCurveTo(130, -60, 140, 0); g.closePath(); inkPath(g, cel(g, -80, 140, '#9a7a56'));
  g.strokeStyle = mixC(fur, '#a08a6a', 0.3); g.lineWidth = 3; for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(-60 + i * 14, -60 + Math.abs(i - 6) * 4 - br); g.lineTo(-56 + i * 14, -50 + Math.abs(i - 6) * 4 - br); g.stroke(); }
}
// compatibility: old iceman() -> new person()
function iceman(g, x, y, s, t, o = {}) {
  const map = { sit: 'sit', hammer: 'knap', spear: 'spear', throw: 'throw', stand: 'stand' };
  const act = o.act || (o.walk ? 'walk' : map[o.pose || 'stand'] || 'stand');
  person(g, x, y, s * 0.82, t, Object.assign({}, o, { act, coat: o.coat && o.coat !== '#c08a60' ? o.coat : undefined, drape: o.hood === false && o.coat === '#c08a60' }));
}

// ---------- rich environments ----------
function fireLight(g, x, y, r, t, a = 1) { const fl = 0.85 + 0.15 * noise(t * 6) + 0.04 * Math.sin(t * 17); g.save(); g.globalCompositeOperation = 'screen'; glow(g, x, y, r * fl, 'rgba(255,140,60,A)', 0.55 * a); glow(g, x, y, r * 0.45 * fl, 'rgba(255,200,120,A)', 0.4 * a); g.restore(); }
function darkFalloff(g, x, y, r0, r1, a = 0.75) { const m = g.createRadialGradient(x, y, r0, x, y, r1); m.addColorStop(0, 'rgba(8,4,6,0)'); m.addColorStop(1, `rgba(8,4,6,${a})`); g.fillStyle = m; g.fillRect(-200, -200, W + 400, H + 400); }
function firePit(g, x, y, s, t) { for (let i = 0; i < 9; i++) { const a = Math.PI * 0.05 + i / 8 * Math.PI * 0.9; g.beginPath(); g.ellipse(x + Math.cos(a) * 110 * s, y + 6 * s - Math.sin(a) * 18 * s + 8 * s, 26 * s, 17 * s, 0, 0, 7); inkPath(g, mixC('#6a625a', '#ffb070', 0.25 * Math.sin(a)), 3.5 * s); } fire(g, x, y, s, t); }
// inside a mammoth-bone hut
function hutInside(g, t, o = {}) {
  const fx = o.fx != null ? o.fx : 960, pan = o.pan || 0, fy = o.fy || 960;
  const bg = g.createRadialGradient(fx, 640, 40, fx, 560, 1300); bg.addColorStop(0, '#7a4424'); bg.addColorStop(0.4, '#40220f'); bg.addColorStop(1, '#140a06'); g.fillStyle = bg; g.fillRect(-200, -200, W + 400, H + 400);
  // hide panels with seams
  for (let i = -1; i < 9; i++) { const x0 = i * 280 - (pan % 280) - 40; const k = i + Math.floor(pan / 280); g.fillStyle = `rgba(${90 + hash(k) * 40},${52 + hash(k + 1) * 20},${28},${0.55})`; g.beginPath(); g.moveTo(x0 + 10, 1000); g.quadraticCurveTo(x0 + 40 + (x0 - 960) * 0.05, 300, 960 + (x0 - 960) * 0.25, -80); g.lineTo(960 + (x0 + 280 - 960) * 0.25, -80); g.quadraticCurveTo(x0 + 300 + (x0 - 960) * 0.05, 300, x0 + 270, 1000); g.fill(); g.strokeStyle = 'rgba(240,220,180,0.25)'; g.setLineDash([10, 12]); g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + 140, 1000); g.quadraticCurveTo(x0 + 170 + (x0 - 960) * 0.05, 300, 960 + (x0 + 140 - 960) * 0.25, -80); g.stroke(); g.setLineDash([]); }
  // bone ribs
  for (let i = -1; i < 9; i++) { const x0 = i * 280 - (pan % 280) - 40; const ld = x0 < fx ? 1 : -1; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, 1020); g.quadraticCurveTo(x0 + 30 + (x0 - 960) * 0.05, 300, 960 + (x0 - 960) * 0.25, -80); g.strokeStyle = INK; g.lineWidth = 44; g.stroke(); g.strokeStyle = '#d8c8a4'; g.lineWidth = 34; g.stroke(); g.strokeStyle = 'rgba(255,240,210,0.6)'; g.lineWidth = 8; g.save(); g.translate(ld * 8, 0); g.stroke(); g.restore(); }
  // hanging dried meat / bundles / tools
  for (let i = 0; i < 7; i++) { const x = ((i * 310 + 140 - pan * 1.1) % (W + 300) + W + 300) % (W + 300) - 150, len = 90 + hash(i) * 120, sw = Math.sin(t * 1.3 + i) * 0.04; g.save(); g.translate(x, 60); g.rotate(sw); ink(g, '#2a1a10', 3); g.beginPath(); g.moveTo(0, -60); g.lineTo(0, 30); g.stroke(); if (i % 3 === 0) { for (let j = 0; j < 4; j++) { g.beginPath(); g.moveTo(-30 + j * 20, 30); g.lineTo(-26 + j * 20, 30 + len); g.lineTo(-18 + j * 20, 30 + len * 0.9); g.lineTo(-20 + j * 20, 30); g.closePath(); inkPath(g, '#7a2a1a', 3); } } else if (i % 3 === 1) { g.beginPath(); g.ellipse(0, 30 + len * 0.5, 34, len * 0.5, 0, 0, 7); inkPath(g, '#8a7a4a', 3); ink(g, '#5a4a2a', 3); for (let j = 0; j < 3; j++) { g.beginPath(); g.moveTo(-30, 40 + j * len * 0.3); g.lineTo(30, 40 + j * len * 0.3); g.stroke(); } } else { ink(g, INK, 10); g.beginPath(); g.moveTo(0, 30); g.lineTo(0, 30 + len); g.stroke(); ink(g, '#6a4a2a', 6); g.stroke(); g.beginPath(); g.moveTo(-14, 30 + len); g.lineTo(14, 30 + len); g.lineTo(0, 60 + len); g.closePath(); inkPath(g, '#9a948a', 3); } g.restore(); }
  // floor + fur rugs
  const fl = g.createLinearGradient(0, 860, 0, H); fl.addColorStop(0, '#3a2414'); fl.addColorStop(1, '#1a0e08'); g.fillStyle = fl; g.fillRect(-200, 880, W + 400, 400);
  for (let i = 0; i < 5; i++) { const x = ((i * 470 + 200 - pan * 1.2) % (W + 500) + W + 500) % (W + 500) - 250; g.beginPath(); g.ellipse(x, 1000 + (i % 2) * 40, 230, 46, 0, 0, 7); g.fillStyle = ['#8a6a4a', '#a08460', '#6a5038'][i % 3]; g.fill(); g.strokeStyle = 'rgba(255,240,210,0.25)'; g.lineWidth = 2.5; for (let j = 0; j < 30; j++) { const a = j / 30 * Math.PI * 2; g.beginPath(); g.moveTo(x + Math.cos(a) * 200, 1000 + (i % 2) * 40 + Math.sin(a) * 40); g.lineTo(x + Math.cos(a) * 232, 1000 + (i % 2) * 40 + Math.sin(a) * 50); g.stroke(); } }
  // smoke + light shaft from smoke hole
  g.save(); g.globalCompositeOperation = 'screen'; const sh = g.createLinearGradient(fx, -80, fx, 700); sh.addColorStop(0, 'rgba(255,220,170,0.22)'); sh.addColorStop(1, 'rgba(255,220,170,0)'); g.fillStyle = sh; g.beginPath(); g.moveTo(fx - 70, -80); g.lineTo(fx + 70, -80); g.lineTo(fx + 260, 760); g.lineTo(fx - 260, 760); g.fill(); g.restore();
  for (let i = 0; i < 10; i++) { const life = (t * 0.12 + i / 10) % 1; g.fillStyle = `rgba(200,180,160,${0.18 * (1 - life)})`; g.beginPath(); g.arc(fx + Math.sin(life * 5 + i) * 70, fy - 120 - life * 900, 50 + life * 130, 0, 7); g.fill(); }
  if (o.fire !== false) firePit(g, fx, fy, o.fs || 0.85, t);
  darkFalloff(g, fx, fy - 200, 300, 1250, 0.7);
  if (o.fire !== false) fireLight(g, fx, fy - 80, 900, t, 0.9);
}
// rock cave with blizzard entrance
function caveInside(g, t, o = {}) {
  const ex = o.ex != null ? o.ex : 1550, fx = o.fx != null ? o.fx : 760;
  g.fillStyle = '#1e1614'; g.fillRect(-200, -200, W + 400, H + 400);
  // entrance light
  const out = g.createLinearGradient(ex, 200, ex, 1000); out.addColorStop(0, '#c8d8e8'); out.addColorStop(1, '#e8f0f8'); g.fillStyle = out; g.beginPath(); g.ellipse(ex, 900, 300, 560, 0, Math.PI, 0); g.fill();
  g.save(); g.beginPath(); g.ellipse(ex, 900, 300, 560, 0, Math.PI, 0); g.clip(); g.translate(ex - W / 2, 0); tundra(g, { t, time: o.time || 'day', pan: 300, storm: 0.6 }); snowfall(g, t, { blizzard: true, wind: 1.4, n: 120 }); g.restore();
  // rock layers
  for (let L = 0; L < 4; L++) { g.fillStyle = ['#3a2e2a', '#4a3a34', '#2e2420', '#55443c'][L]; g.beginPath(); g.moveTo(-200, 0); for (let x = -200; x <= W + 200; x += 30) g.lineTo(x, 60 + L * 70 + noise(x * 0.004 + L * 3) * 90); g.lineTo(W + 200, -200); g.lineTo(-200, -200); g.fill(); }
  for (let side = 0; side < 2; side++) { g.fillStyle = side ? '#3a2e28' : '#2a201c'; g.beginPath(); const x0 = side ? W + 200 : -200; g.moveTo(x0, -200); for (let y = -200; y <= H + 200; y += 30) g.lineTo((side ? W - 40 : 40) + (side ? -1 : 1) * (noise(y * 0.006 + side * 5) * 120 + 60), y); g.lineTo(x0, H + 200); g.fill(); }
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 4; for (let i = 0; i < 26; i++) { const x = hash(i) * W, y = 40 + hash(i + 3) * 300; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 60 + hash(i + 5) * 120, y + (hash(i + 7) - 0.5) * 40); g.stroke(); }
  const fl = g.createLinearGradient(0, 880, 0, H); fl.addColorStop(0, '#3a2c24'); fl.addColorStop(1, '#16100c'); g.fillStyle = fl; g.fillRect(-200, 900, W + 400, 400);
  if (o.fire !== false) firePit(g, fx, 960, o.fs || 0.8, t);
  darkFalloff(g, fx, 800, 260, 1200, 0.65);
  if (o.fire !== false) fireLight(g, fx, 880, 800, t, 0.85);
}
// macro work surface with shallow depth of field (blurred hut behind)
function bench(g, t, o = {}) {
  blurLayer(g, o.blur || 9, x => hutInside(x, t, { fx: o.fx != null ? o.fx : 1500, pan: o.pan || 600, fs: 0.7 }));
  const top = o.top || 640;
  const gr = g.createLinearGradient(0, top, 0, H); const base = { hide: ['#a07a50', '#5a3e24'], stone: ['#8a8278', '#3e3a34'], snow: ['#eef4f8', '#9aaab8'], wood: ['#8a5a34', '#3a2414'] }[o.surface || 'hide'];
  gr.addColorStop(0, base[0]); gr.addColorStop(1, base[1]); g.fillStyle = gr; g.beginPath(); g.moveTo(-200, H + 200); g.lineTo(-100, top); g.quadraticCurveTo(W / 2, top - 30, W + 100, top); g.lineTo(W + 200, H + 200); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 3; for (let i = 0; i < 40; i++) { const y = top + 20 + hash(i) * (H - top), x = hash(i + 4) * W; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 80 + hash(i + 8) * 200, y + (hash(i + 2) - 0.5) * 20); g.stroke(); }
  if ((o.surface || 'hide') === 'hide') { g.strokeStyle = 'rgba(240,220,180,0.35)'; g.setLineDash([12, 12]); g.lineWidth = 4; g.beginPath(); g.moveTo(-100, top + 60); g.quadraticCurveTo(W / 2, top + 20, W + 100, top + 70); g.stroke(); g.setLineDash([]); }
  // scattered flakes / tools
  for (let i = 0; i < 9; i++) { const x = 120 + hash(i + 20) * (W - 240), y = top + 120 + hash(i + 21) * (H - top - 160); if (Math.abs(x - W / 2) < 420 && y < top + 360) continue; g.save(); g.translate(x, y); g.rotate(hash(i) * 6); g.beginPath(); g.moveTo(-26, 0); g.lineTo(0, -14); g.lineTo(30, 4); g.lineTo(0, 12); g.closePath(); inkPath(g, ['#7a7e88', '#9a948a', BONE][i % 3], 3); g.restore(); }
  // side key light + bokeh embers
  g.save(); g.globalCompositeOperation = 'screen'; glow(g, o.lx != null ? o.lx : 1700, top - 100, 1100, 'rgba(255,150,70,A)', 0.35); g.restore();
  bokeh(g, t, 14, 'rgba(255,170,80,A)');
  const v = g.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(0,0,0,0.25)'); v.addColorStop(0.6, 'rgba(0,0,0,0)'); g.fillStyle = v; g.fillRect(-200, -200, W + 400, H + 400);
}
function bokeh(g, t, n, col = 'rgba(255,255,255,A)', a = 0.5) { g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < n; i++) { const x = ((hash(i + 40) * W + t * (10 + hash(i) * 20)) % (W + 200)) - 100, y = ((hash(i + 41) * H - t * (14 + hash(i + 2) * 30)) % H + H) % H, r = 14 + hash(i + 42) * 40; glow(g, x, y, r, col, a * (0.5 + 0.5 * Math.sin(t * 2 + i))); } g.restore(); }
// near-lens snow bokeh (depth)
function lensSnow(g, t, n = 10, a = 0.55) { g.save(); for (let i = 0; i < n; i++) { const sp = 120 + hash(i + 60) * 160, x = ((hash(i + 61) * (W + 300) + t * sp * 0.5) % (W + 300)) - 150, y = ((hash(i + 62) * (H + 300) + t * sp) % (H + 300)) - 150, r = 10 + hash(i + 63) * 26; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.6, `rgba(255,255,255,${a * 0.5})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } g.restore(); }
// blurred foreground framing (snowy branch / rocks) for depth
function fgFrame(g, t, kind = 'branch', side = 1, a = 1) {
  blurLayer(g, 7, x => {
    x.save(); if (side < 0) { x.translate(W, 0); x.scale(-1, 1); }
    if (kind === 'branch') { const sw = Math.sin(t * 0.8) * 4; x.translate(60 + sw, 0); for (let i = 0; i < 6; i++) { const yy = 120 + i * 175, w = 120 + i * 70; x.fillStyle = '#121a16'; x.beginPath(); x.moveTo(-200, yy + 150); x.lineTo(0, yy - 60); x.lineTo(w, yy + 150); x.closePath(); x.fill(); x.fillStyle = 'rgba(240,246,252,0.92)'; x.beginPath(); x.moveTo(-40, yy - 20); x.lineTo(0, yy - 60); x.lineTo(w * 0.7, yy + 90); x.quadraticCurveTo(w * 0.3, yy + 40, -40, yy - 20); x.fill(); } x.fillStyle = '#1a120c'; x.fillRect(-30, 0, 40, H); }
    else if (kind === 'rocks') { x.fillStyle = '#16120f'; x.beginPath(); x.moveTo(-50, H + 50); x.lineTo(-50, H - 220); x.quadraticCurveTo(160, H - 330, 380, H - 160); x.quadraticCurveTo(470, H - 80, 520, H + 50); x.fill(); x.fillStyle = 'rgba(240,246,250,0.9)'; x.beginPath(); x.moveTo(-50, H - 220); x.quadraticCurveTo(160, H - 340, 380, H - 160); x.quadraticCurveTo(170, H - 280, -50, H - 190); x.fill(); }
    else if (kind === 'bones') { for (let i = 0; i < 3; i++) { ink(x, '#2a2018', 50 - i * 8); x.beginPath(); x.moveTo(-60, H - 60 - i * 70); x.quadraticCurveTo(200, H - 260 - i * 90, 420 - i * 60, H + 40); x.stroke(); ink(x, '#c8b894', 36 - i * 8); x.stroke(); } }
    x.restore();
  }, a);
}

// ---------- modern winter city (night) ----------
function cityWinter(g, t, o = {}) {
  const pan = o.pan || 0, hz = 720;
  const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#060a1c'); sky.addColorStop(0.7, '#1c2444'); sky.addColorStop(1, '#3a3a5a'); g.fillStyle = sky; g.fillRect(-200, -200, W + 400, H + 400);
  for (let i = 0; i < 40; i++) { const x = ((i * 97 - pan * 0.15) % (W + 300) + W + 300) % (W + 300) - 150, h = 200 + hash(i) * 330, w = 70 + hash(i + 1) * 90; g.fillStyle = '#121a30'; g.fillRect(x, hz - h, w, h); for (let wy = hz - h + 16; wy < hz - 20; wy += 26) for (let wx = x + 10; wx < x + w - 12; wx += 20) if (hash(wx * 0.31 + wy * 0.7 + i) > 0.62) { g.fillStyle = `rgba(255,${200 + hash(wx) * 40},120,0.75)`; g.fillRect(wx, wy, 8, 12); } g.fillStyle = 'rgba(230,236,255,0.7)'; g.fillRect(x - 3, hz - h - 5, w + 6, 7); }
  // near buildings (warm windows)
  for (let i = -1; i < 6; i++) { const k = i + Math.floor(pan / 420), x = i * 420 - (pan % 420); const h = 420 + hash(k) * 160, col = ['#4a3a44', '#3a4250', '#54403a', '#3e3a50'][Math.abs(k) % 4];
    g.fillStyle = col; g.fillRect(x, 860 - h, 400, h); g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(x, 860 - h, 400, h);
    g.fillStyle = '#f2f6fc'; g.beginPath(); g.moveTo(x - 14, 860 - h); g.quadraticCurveTo(x + 200, 860 - h - 40, x + 414, 860 - h); g.lineTo(x + 414, 860 - h + 14); g.lineTo(x - 14, 860 - h + 14); g.fill();
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const wx = x + 40 + c * 120, wy = 860 - h + 50 + r * 100; if (wy > 760) continue; const on = hash(k * 13 + r * 3 + c) > 0.3; g.fillStyle = on ? '#ffc870' : '#1a2030'; g.fillRect(wx, wy, 80, 66); if (on) { g.save(); g.globalCompositeOperation = 'screen'; glow(g, wx + 40, wy + 33, 90, 'rgba(255,190,100,A)', 0.35); g.restore(); g.fillStyle = 'rgba(160,60,40,0.5)'; g.fillRect(wx, wy, 18, 66); g.fillRect(wx + 62, wy, 18, 66); } g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(wx, wy, 80, 66); g.fillStyle = 'rgba(245,250,255,0.9)'; g.fillRect(wx - 4, wy + 64, 88, 7); } }
  // sidewalk + road
  g.fillStyle = '#c8d0e0'; g.fillRect(-200, 860, W + 400, 70); g.fillStyle = '#3a4058'; g.fillRect(-200, 930, W + 400, 300);
  g.fillStyle = 'rgba(230,236,248,0.85)'; for (let i = 0; i < 30; i++) { const x = ((i * 140 - pan) % (W + 300) + W + 300) % (W + 300) - 150; g.beginPath(); g.ellipse(x, 935 + (i % 3) * 50, 90, 10, 0, 0, 7); g.fill(); }
  // street lamps with light cones
  for (let i = -1; i < 5; i++) { const x = i * 520 + 200 - (pan * 1.0 % 520); ink(g, INK, 14); g.beginPath(); g.moveTo(x, 900); g.lineTo(x, 470); g.quadraticCurveTo(x, 440, x + 50, 440); g.stroke(); g.fillStyle = '#fff4d0'; g.beginPath(); g.ellipse(x + 56, 446, 26, 10, 0, 0, 7); g.fill();
    g.save(); g.globalCompositeOperation = 'screen'; const cg = g.createLinearGradient(0, 446, 0, 930); cg.addColorStop(0, 'rgba(255,220,150,0.45)'); cg.addColorStop(1, 'rgba(255,220,150,0.04)'); g.fillStyle = cg; g.beginPath(); g.moveTo(x + 40, 446); g.lineTo(x + 72, 446); g.lineTo(x + 200, 930); g.lineTo(x - 90, 930); g.fill(); glow(g, x + 56, 446, 120, 'rgba(255,230,170,A)', 0.6); g.restore(); }
  // parked car with snow
  const cx = 1240 - pan * 1.0 % 2400; g.save(); g.translate(cx, 940); g.beginPath(); g.moveTo(-200, 0); g.lineTo(-200, -60); g.quadraticCurveTo(-120, -80, -90, -130); g.lineTo(80, -130); g.quadraticCurveTo(120, -80, 210, -64); g.lineTo(210, 0); g.closePath(); inkPath(g, '#7a2a30'); g.fillStyle = '#1a2436'; g.fillRect(-70, -118, 60, 44); g.fillRect(0, -118, 60, 44); g.fillStyle = '#f4f8fc'; g.beginPath(); g.ellipse(-5, -134, 100, 16, 0, Math.PI, 0); g.fill(); for (const wx of [-120, 130]) { g.beginPath(); g.arc(wx, 0, 36, 0, 7); inkPath(g, '#16161a'); } g.fillStyle = '#ffe9a8'; g.fillRect(196, -54, 14, 14); g.restore();
  if (o.snow !== false) snowfall(g, t, { n: 120, wind: 0.25 });
}

// ---------- kinetic typography ----------
const TXT = {};
function tAge(key, k) { const kk = CURB + '|' + key; if (TXT[kk] == null) TXT[kk] = k >= 0.98 ? NOW - 5 : NOW - clamp(k) * 0.3; return NOW - TXT[kk]; }
function title(g, s, x, y, k, size = 110, col = '#ffffff') {
  if (k <= 0) return; const lt = tAge('T' + s + x + y, k); if (HUDON && y - size * 0.6 < 140 && x < 900) y = 150 + size * 0.6;
  layer(g, 'none', c => {
    c.font = `bold ${size}px "Nirmala UI"`; c.textAlign = 'left'; c.textBaseline = 'middle';
    const words = s.split(' '), sp = size * 0.26, ws = words.map(w => c.measureText(w).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
    const gold = col === '#ffcf5a' || col === '#ffd23f';
    const gr = c.createLinearGradient(0, y - size * 0.55, 0, y + size * 0.5); gr.addColorStop(0, mixC(col, '#ffffff', 0.6)); gr.addColorStop(0.55, col); gr.addColorStop(1, mixC(col, gold ? '#c0601a' : '#7a8aa0', 0.45));
    let cx = x - tot / 2;
    words.forEach((w, i) => { const u = clamp((lt - i * 0.07) / 0.42); if (u > 0) { const yy = y + (1 - easeOut(u)) * size * 0.75; c.save(); c.beginPath(); c.rect(cx - size, y - size * 1.1, ws[i] + size * 2, size * 1.85); c.clip(); c.globalAlpha = clamp(u * 2.5);
      c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = size * 0.3; c.shadowOffsetY = size * 0.07; c.lineJoin = 'round'; c.lineWidth = size * 0.15; c.strokeStyle = '#120a06'; c.strokeText(w, cx, yy); c.shadowColor = 'transparent'; c.fillStyle = gr; c.fillText(w, cx, yy); c.restore(); } cx += ws[i] + sp; });
    // shine sweep (source-atop on the text only)
    const sh = (lt - words.length * 0.07 - 0.25) / 0.7; if (sh > 0 && sh < 1) { c.save(); c.setTransform(c.getTransform()); c.globalCompositeOperation = 'source-atop'; const sx = lerp(x - tot / 2 - 200, x + tot / 2 + 200, sh); const sg = c.createLinearGradient(sx - 90, 0, sx + 90, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.75)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = sg; c.fillRect(x - tot / 2 - 300, y - size, tot + 600, size * 2); c.restore(); }
    // underline swoosh
    const ul = ease(clamp((lt - words.length * 0.07 - 0.1) / 0.5)); if (ul > 0) { const ug = c.createLinearGradient(x - tot / 2, 0, x + tot / 2, 0); ug.addColorStop(0, 'rgba(0,0,0,0)'); ug.addColorStop(0.2, col); ug.addColorStop(0.8, col); ug.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = ug; c.globalAlpha = 0.9; c.fillRect(x - tot / 2 * ul, y + size * 0.62, tot * ul, Math.max(4, size * 0.05)); c.globalAlpha = 1; }
  });
  // spark burst
  if (lt < 0.7) { g.save(); g.globalCompositeOperation = 'screen'; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283 + hash(i) * 0.5, d = easeOut(lt / 0.7) * (size * 1.6 + hash(i + 3) * size * 2); g.fillStyle = `rgba(255,230,160,${1 - lt / 0.7})`; g.beginPath(); g.arc(x + Math.cos(a) * d * 1.8, y + Math.sin(a) * d * 0.6, 3 + hash(i) * 3, 0, 7); g.fill(); } g.restore(); }
}
function tag(g, s, x, y, k, col = '#ffd23f', size = 56) {
  if (k <= 0) return; const lt = tAge('P' + s + x + y, k); size *= 0.9;
  g.save(); g.font = `bold ${size}px "Nirmala UI"`; const tw = g.measureText(s).width, padX = size * 0.6, h = size * 1.55, w = tw + padX * 2 + size * 0.25;
  const u = easeOut(clamp(lt / 0.32)), u2 = easeOut(clamp((lt - 0.1) / 0.35)), fy = Math.sin(NOW * 1.5 + x * 0.013) * 3; if (HUDON && y - h / 2 < 140 && x - w / 2 < 700) y = 150 + h / 2;
  g.translate(x, y + fy + (1 - u) * 14); g.globalAlpha = clamp(u * 2);
  g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 26; g.shadowOffsetY = 10; g.fillStyle = 'rgba(14,16,24,0.82)'; rr(g, -w / 2, -h / 2, w * u, h, h * 0.24); g.fill(); g.shadowColor = 'transparent';
  const sg = g.createLinearGradient(0, -h / 2, 0, h / 2); sg.addColorStop(0, 'rgba(255,255,255,0.16)'); sg.addColorStop(0.45, 'rgba(255,255,255,0.02)'); sg.addColorStop(1, 'rgba(0,0,0,0.1)'); g.fillStyle = sg; rr(g, -w / 2, -h / 2, w * u, h, h * 0.24); g.fill();
  g.strokeStyle = col; g.globalAlpha = 0.55 * clamp(u * 2); g.lineWidth = 2; rr(g, -w / 2, -h / 2, w * u, h, h * 0.24); g.stroke(); g.globalAlpha = clamp(u * 2);
  g.fillStyle = col; rr(g, -w / 2, -h / 2, size * 0.18, h, [h * 0.24, 0, 0, h * 0.24]); g.fill();
  g.save(); g.globalCompositeOperation = 'screen'; glow(g, -w / 2 + 6, 0, h * 0.9, 'rgba(255,230,160,A)', 0.25); g.restore();
  g.save(); g.beginPath(); g.rect(-w / 2, -h / 2, w * u, h); g.clip(); g.globalAlpha = u2; g.fillStyle = '#ffffff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(s, -w / 2 + padX + size * 0.12 - (1 - u2) * 50, size * 0.04);
  const sh = (lt - 0.45) / 0.6; if (sh > 0 && sh < 1) { const sx = lerp(-w / 2 - 100, w / 2 + 100, sh); const shg = g.createLinearGradient(sx - 60, 0, sx + 60, 0); shg.addColorStop(0, 'rgba(255,255,255,0)'); shg.addColorStop(0.5, 'rgba(255,255,255,0.18)'); shg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = shg; g.fillRect(-w / 2, -h / 2, w, h); }
  g.restore(); g.restore();
}
function stamp2(g, s, x, y, k, col = '#e8262c') {
  if (k <= 0) return; const lt = tAge('S' + s + x + y, k), imp = clamp(lt / 0.16);
  g.save(); const sh = lt < 0.5 ? (1 - lt / 0.5) * 10 : 0; g.translate(x + Math.sin(lt * 90) * sh, y + Math.cos(lt * 70) * sh); g.rotate(-0.12);
  const sc = lerp(2.4, 1, easeOut(imp)); g.scale(sc, sc); g.globalAlpha = clamp(imp * 3);
  g.font = 'bold 104px "Nirmala UI"'; const w = g.measureText(s).width + 90;
  if (lt < 0.25) { g.globalAlpha = 0.5 * (1 - lt / 0.25); g.fillStyle = '#00e5ff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, -8, 8); g.fillStyle = '#ff2060'; g.fillText(s, 8, 8); g.globalAlpha = 1; }
  g.fillStyle = 'rgba(10,6,6,0.55)'; rr(g, -w / 2, -82, w, 164, 18); g.fill();
  g.strokeStyle = col; g.lineWidth = 12; rr(g, -w / 2, -82, w, 164, 18); g.stroke(); g.lineWidth = 4; rr(g, -w / 2 + 14, -68, w - 28, 136, 10); g.stroke();
  g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 0, 8);
  g.restore();
  if (lt < 0.6) { g.save(); g.strokeStyle = col; g.globalAlpha = 1 - lt / 0.6; g.lineWidth = 6; g.beginPath(); g.ellipse(x, y, 200 + lt * 900, 80 + lt * 300, -0.12, 0, 7); g.stroke(); for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283, d = 150 + easeOut(lt / 0.6) * 380; g.fillStyle = `rgba(200,190,180,${0.6 * (1 - lt / 0.6)})`; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.45, 10 + hash(i) * 14, 0, 7); g.fill(); } g.restore(); }
}
function countUp(s, e) { const lat = s.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)); return BN(lat.replace(/\d[\d,]*/g, m => { const v = +m.replace(/,/g, ''); const cur = Math.round(v * e); return m.includes(',') ? cur.toLocaleString('en-IN') : String(cur); })); }
function bigNum(g, s, x, y, size, col, k, sub) {
  if (k <= 0) return; const lt = tAge('N' + s + x + y, k), e = easeOut(clamp(lt / 1.1)); if (HUDON && y - size * 0.6 < 140 && x < 900) y = 150 + size * 0.6;
  g.save(); g.globalCompositeOperation = 'screen'; glow(g, x, y, size * 2.6, 'rgba(255,190,80,A)', 0.3 * clamp(lt * 3)); g.restore();
  const str = countUp(s, e); g.save(); g.translate(x, y); const pop = 1 + 0.08 * Math.sin(clamp(lt / 1.1) * Math.PI); g.scale(pop, pop);
  g.font = `bold ${size}px "Nirmala UI"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = clamp(lt * 4);
  const gr = g.createLinearGradient(0, -size * 0.5, 0, size * 0.5); gr.addColorStop(0, mixC(col, '#ffffff', 0.6)); gr.addColorStop(0.6, col); gr.addColorStop(1, mixC(col, '#8a3a00', 0.4));
  g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 30; g.shadowOffsetY = 8; g.lineJoin = 'round'; g.lineWidth = size * 0.13; g.strokeStyle = '#140a04'; g.strokeText(str, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = gr; g.fillText(str, 0, 0);
  g.restore(); if (sub) tag(g, sub, x, y + size * 0.95, k, col, size * 0.36);
}
function mapPin(g, x, y, text, k, col = '#ffcf5a', up = 110) {
  if (k <= 0) return; const lt = tAge('M' + text, k), drop = easeOutBack(clamp(lt / 0.5));
  g.save(); g.globalCompositeOperation = 'screen'; const bm = g.createLinearGradient(0, y - 420, 0, y); bm.addColorStop(0, 'rgba(255,220,140,0)'); bm.addColorStop(1, 'rgba(255,220,140,0.55)'); g.fillStyle = bm; g.fillRect(x - 10 * drop, y - 420, 20 * drop, 420);
  for (let i = 0; i < 3; i++) { const p = ((NOW * 0.8 + i / 3) % 1); g.strokeStyle = `rgba(255,220,140,${(1 - p) * 0.8})`; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, 20 + p * 110, (20 + p * 110) * 0.35, 0, 0, 7); g.stroke(); } g.restore();
  const py = y - (1 - drop) * 160; g.save(); g.translate(x, py); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-22, -26, -26, -58, 0, -62); g.bezierCurveTo(26, -58, 22, -26, 0, 0); inkPath(g, col, 3.5); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -40, 8, 0, 7); g.fill(); g.restore();
  const lu = easeOut(clamp((lt - 0.3) / 0.4)); if (lu <= 0) return;
  const lx = x + 70, ly = y - up; ink(g, col, 3); g.beginPath(); g.moveTo(x, y - 62); g.lineTo(x + 30 * lu, ly + 30); g.lineTo(lx * 1 + 0 * lu, ly + 30); g.stroke();
  g.save(); g.font = 'bold 44px "Nirmala UI"'; const w = g.measureText(text).width + 50; g.translate(lx, ly); g.beginPath(); g.rect(0, -40, w * lu + 4, 140); g.clip(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 20; g.fillStyle = 'rgba(10,18,24,0.85)'; rr(g, 0, -10, w, 68, 12); g.fill(); g.shadowColor = 'transparent'; g.fillStyle = col; g.fillRect(0, -10, 6, 68); g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(text, 26, 25); g.restore();
}
function chapterCine(g, num, ttl, k, t, col) {
  if (k <= 0) return; const e = easeOut(clamp(k));
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = e; g.filter = 'blur(10px) brightness(0.45)'; g.drawImage(g.canvas, 0, 0); g.filter = 'none'; g.globalAlpha = 1;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, 130 * e); g.fillRect(0, H - 130 * e, W, 130 * e);
  const lw = 1400 * e, lg = g.createLinearGradient(W / 2 - lw / 2, 0, W / 2 + lw / 2, 0); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(0.5, col); lg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = lg; g.fillRect(W / 2 - lw / 2, H / 2 + 92, lw, 5);
  g.save(); g.globalCompositeOperation = 'screen'; glow(g, W / 2, H / 2 + 94, 500 * e, col.length === 7 ? `rgba(${hex2rgb(col).join(',')},A)` : 'rgba(255,220,140,A)', 0.35); g.restore();
  g.font = 'bold 50px "Nirmala UI"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.globalAlpha = clamp(k * 2); g.fillText(num, W / 2, H / 2 - 140 + (1 - e) * 30); g.globalAlpha = 1;
  g.restore();
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); if (k > 0.15) title(g, ttl, W / 2, H / 2 - 10, Math.min(1, (k - 0.15) * 1.5), 140, '#ffffff'); g.restore();
}

// ---------- pro map: clouds with parallax, fly-through, marchers, horizon ----------
function mapPro(g, cam, t, over, o = {}) {
  const P = map3D(g, cam, t, over);
  // horizon atmosphere glow line
  g.save(); g.globalCompositeOperation = 'screen'; const hg = g.createLinearGradient(0, 0, 0, 260); hg.addColorStop(0, 'rgba(120,190,255,0.0)'); hg.addColorStop(0.55, 'rgba(150,210,255,0.35)'); hg.addColorStop(1, 'rgba(150,210,255,0)'); g.fillStyle = hg; g.fillRect(0, 0, W, 260); g.restore();
  // floating clouds anchored to the globe (parallax with camera)
  const cl = o.clouds != null ? o.clouds : 1;
  if (cl > 0) for (let i = 0; i < 26; i++) { const lon = -170 + hash(i + 300) * 340 + t * 0.4, lat = -40 + hash(i + 301) * 110; const [x, y] = P([lon, lat]); if (y < 30 || y > H + 200 || x < -400 || x > W + 400) continue; const sc = clamp(y / H, 0.15, 1.3) * (0.7 + hash(i + 302) * 0.8) * cam.zoom; const lift = 90 * sc;
    g.save(); g.globalAlpha = 0.16 * cl; g.fillStyle = '#000'; g.beginPath(); g.ellipse(x + 30 * sc, y + 10 * sc, 150 * sc, 34 * sc, 0, 0, 7); g.fill(); g.globalAlpha = 0.55 * cl; for (let j = 0; j < 5; j++) { const gr = g.createRadialGradient(x + (j - 2) * 55 * sc, y - lift + Math.sin(j * 2) * 14 * sc, 0, x + (j - 2) * 55 * sc, y - lift, 80 * sc); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - 300 * sc, y - lift - 120 * sc, 600 * sc, 240 * sc); } g.restore(); }
  // fly-through clouds at the start of a map shot
  const th = o.through || 0; if (th > 0) { g.save(); for (let i = 0; i < 9; i++) { const s = 1 + (1 - th) * 3 + hash(i) * 0.5, x = W / 2 + (hash(i + 5) - 0.5) * W * 1.4 * s, y = H / 2 + (hash(i + 6) - 0.5) * H * 1.2 * s, r = 500 * s; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(240,246,252,${0.95 * th})`); gr.addColorStop(1, 'rgba(240,246,252,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); } g.restore(); }
  const v = g.createRadialGradient(W / 2, H * 0.6, H * 0.3, W / 2, H * 0.6, W * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,6,12,0.55)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  return P;
}
function routeAt(pts, k) { const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; } let r = clamp(k) * tot; for (let i = 1; i < pts.length; i++) { if (r <= L[i - 1]) { const f = r / L[i - 1]; return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]; } r -= L[i - 1]; } return pts[pts.length - 1]; }
function marchers(g, P, pts, k, t, n = 6, col = '#2a1a12') {
  for (let i = 0; i < n; i++) { const kk = k - 0.02 - i * 0.018; if (kk <= 0) continue; const [x, y] = P(routeAt(pts, kk)); if (y < 0 || y > H) continue; const sz = lerp(9, 24, clamp(y / H)); const nx = P(routeAt(pts, kk + 0.01)); const dir = nx[0] >= x ? 1 : -1; const ph = t * 8 + i;
    g.save(); g.translate(x, y); g.scale(sz / 20 * dir, sz / 20); g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(0, 1, 9, 2.5, 0, 0, 7); g.fill();
    ink(g, '#fff3d8', 7.5); g.beginPath(); g.moveTo(0, -12); g.lineTo(Math.sin(ph) * 5, 0); g.moveTo(0, -12); g.lineTo(-Math.sin(ph) * 5, 0); g.moveTo(0, -12); g.lineTo(0, -26); g.stroke(); g.beginPath(); g.arc(0, -31, 5.5, 0, 7); g.fillStyle = '#fff3d8'; g.fill();
    ink(g, col, 4); g.beginPath(); g.moveTo(0, -12); g.lineTo(Math.sin(ph) * 5, 0); g.moveTo(0, -12); g.lineTo(-Math.sin(ph) * 5, 0); g.moveTo(0, -12); g.lineTo(0, -26); g.moveTo(0, -22); g.lineTo(6, -14); g.stroke(); g.fillStyle = col; g.beginPath(); g.arc(0, -31, 4, 0, 7); g.fill();
    if (i === 0) { ink(g, col, 2); g.beginPath(); g.moveTo(7, -2); g.lineTo(9, -40); g.stroke(); }
    g.restore(); }
}
function yearBadge(g, s, k, x = W - 300, y = 150) { if (k <= 0) return; const lt = tAge('Y' + s, k), u = easeOut(clamp(lt / 0.4)); g.save(); g.translate(x, y); g.globalAlpha = u; g.font = 'bold 46px "Nirmala UI"'; const w = g.measureText(s).width + 110; g.fillStyle = 'rgba(8,14,20,0.8)'; rr(g, -w / 2, -40, w, 80, 40); g.fill(); g.strokeStyle = 'rgba(255,207,90,0.7)'; g.lineWidth = 2; g.stroke(); g.strokeStyle = '#ffcf5a'; g.lineWidth = 4; g.beginPath(); g.arc(-w / 2 + 42, 0, 18, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-w / 2 + 42, 0); g.lineTo(-w / 2 + 42 + Math.cos(NOW * 3) * 12, Math.sin(NOW * 3) * 12); g.stroke(); g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(s, -w / 2 + 74, 3); g.restore(); }
