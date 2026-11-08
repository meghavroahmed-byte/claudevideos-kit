// ===== Original chibi "toy figurine" characters (peg-doll body, big glossy head) =====
// toy(g, x, y, s, t, o): (x,y) = feet centre, s = scale (1 => ~300px tall)
// o: {coat, coat2, skin, hair, hat, beard, mous, tie, belt, epau, medal, glasses, mood, talk, act, flip, k (appear 0..1), bob, look}
const TOYS = {
  leader:   { coat: '#2b3a67', coat2: '#e9e2cf', hat: 'peak', hatc: '#2b3a67', epau: '#e0b23a', medal: true, belt: '#3a2a18', hair: '#2a1d14', mous: true },
  diplomat: { coat: '#2a2a30', coat2: '#f2f2f2', hat: 'none', tie: '#a3242a', hair: '#3a3a3a', glasses: true },
  soldier:  { coat: '#4f5a35', coat2: '#4f5a35', hat: 'helmet', hatc: '#4a5532', belt: '#3a2a18', hair: '#2a1d14' },
  sheikh:   { coat: '#f4f1ea', coat2: '#f4f1ea', hat: 'keffiyeh', hatc: '#f4f1ea', beard: '#2a1d14', hair: '#2a1d14' },
  mullah:   { coat: '#3a332c', coat2: '#e8e2d4', hat: 'turban', hatc: '#151515', beard: '#d9d4c8', hair: '#d9d4c8', glasses: true },
  worker:   { coat: '#3b6ea5', coat2: '#3b6ea5', hat: 'hardhat', hatc: '#f2b31b', belt: '#5a4430', hair: '#2a1d14' },
  trader:   { coat: '#7a4b2a', coat2: '#efe3c8', hat: 'none', tie: '#d4a02a', hair: '#2a1d14', mous: true },
  scientist:{ coat: '#f3f4f6', coat2: '#9ab3c9', hat: 'none', hair: '#4a3a2a', glasses: true, tie: '#2d5d8a' },
  sailor:   { coat: '#f2f2f2', coat2: '#1d3a6b', hat: 'sailor', hatc: '#f2f2f2', hair: '#2a1d14' },
  king:     { coat: '#7a1f2a', coat2: '#f2e6c8', hat: 'crown', hatc: '#e8b923', beard: '#3a2a1a', hair: '#3a2a1a', belt: '#e8b923' },
  farmer:   { coat: '#8a6a3a', coat2: '#d8c49a', hat: 'straw', hatc: '#d9b45a', hair: '#2a1d14' },
  woman:    { coat: '#b0405a', coat2: '#f1d7c8', hat: 'none', hair: '#2a1a12', long: true },
  man:      { coat: '#2f7d6d', coat2: '#2f7d6d', hat: 'none', hair: '#1d140e', tee: true },
  man2:     { coat: '#e0a02a', coat2: '#e0a02a', hat: 'none', hair: '#2a1d14', tee: true, skin: '#c99068' },
  girl:     { coat: '#7a4fb0', coat2: '#e9d8f5', hat: 'none', hair: '#1d140e', long: true, skin: '#e8b892' },
  hijabi:   { coat: '#2f5d8a', coat2: '#2f5d8a', hat: 'hijab', hatc: '#c25b7a', skin: '#e3b08a' },
  kid:      { coat: '#e5533d', coat2: '#e5533d', hat: 'none', hair: '#2a1d14', tee: true },
  oldman:   { coat: '#6e6a62', coat2: '#e8e2d4', hat: 'none', hair: '#d9d4c8', beard: '#e4e0d6', glasses: true, skin: '#d9a77e' },
  ancestor: { coat: '#8a5a32', coat2: '#a8743e', hat: 'none', hair: '#3a2414', beard: '#3a2414', fur: true, skin: '#c98a5e' },
  aberash:  { coat: '#d9572b', coat2: '#f4d35e', hat: 'none', hair: '#e9e6ea', curly: true, skin: '#f6dcd2', eye: '#5aa9e6', seed: 3 },
  aberashD: { coat: '#d9572b', coat2: '#f4d35e', hat: 'none', hair: '#151010', curly: true, skin: '#6b4026', eye: null, seed: 3 },
  doctor:   { coat: '#f3f4f6', coat2: '#6fb3a8', hat: 'none', hair: '#2a1d14', tie: '#2d5d8a', glasses: true, steth: true },
};
function shadeRad(g, x, y, r, base, hi = 0.35, lo = 0.35) { const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r * 1.05); gr.addColorStop(0, mixC(base, '#ffffff', hi)); gr.addColorStop(0.55, base); gr.addColorStop(1, mixC(base, '#000000', lo)); return gr; }
function shadeCyl(g, x0, x1, base) { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, mixC(base, '#000000', 0.38)); gr.addColorStop(0.3, mixC(base, '#ffffff', 0.18)); gr.addColorStop(0.55, base); gr.addColorStop(1, mixC(base, '#000000', 0.45)); return gr; }
const OUT = 'rgba(30,18,10,0.85)';
function toy(g, x, y, s, t, o = {}) {
  const P = Object.assign({ skin: '#f1c9a5', mood: 'neutral' }, TOYS[o.type] || {}, o);
  const k = P.k == null ? 1 : P.k; if (k <= 0) return;
  const lt = P.key ? tAge('TOY' + P.key, k) : 9, pop = P.key ? easeOutBack(clamp(lt / 0.45)) : 1, drop = P.key ? (1 - easeOutBounce(clamp(lt / 0.55))) * 120 : 0;
  const ph = t * 2.2 + (P.seed || x * 0.01);
  const bob = Math.sin(ph * 2) * 0.012, sq = 1 + bob, st = 1 - bob;
  const walk = P.act === 'walk' ? Math.sin(t * 9 + (P.seed || 0)) : 0;
  g.save(); g.translate(x, y); g.scale(s * pop, s * pop);
  // ground shadow
  g.save(); g.globalAlpha = 0.45 * clamp(1 - drop / 140); g.translate(0, 4); g.scale(1, 0.24); const sgr = g.createRadialGradient(0, 0, 10, 0, 0, 88); sgr.addColorStop(0, 'rgba(26,15,5,0.9)'); sgr.addColorStop(1, 'rgba(26,15,5,0)'); g.fillStyle = sgr; g.beginPath(); g.arc(0, 0, 88, 0, 7); g.fill(); g.restore();
  g.translate(0, -drop - Math.abs(walk) * 10); if (P.flip) g.scale(-1, 1); g.rotate(walk * 0.06 + (P.lean || 0)); g.scale(st, sq);
  const lw = 3.2;
  // --- body (peg) ---
  const bw = 66, bt = -160, bb = 0;
  g.beginPath(); g.moveTo(-bw, bb - 6); g.quadraticCurveTo(-bw - 6, bb + 6, -bw + 10, bb + 6); g.lineTo(bw - 10, bb + 6); g.quadraticCurveTo(bw + 6, bb + 6, bw, bb - 6); g.lineTo(bw - 6, bt + 30); g.quadraticCurveTo(bw - 8, bt, bw - 40, bt - 4); g.lineTo(-bw + 40, bt - 4); g.quadraticCurveTo(-bw + 8, bt, -bw + 6, bt + 30); g.closePath();
  g.fillStyle = shadeCyl(g, -bw, bw, P.coat); g.fill(); g.strokeStyle = OUT; g.lineWidth = lw; g.stroke();
  // shirt front / lapels
  g.save(); g.clip(); g.fillStyle = shadeCyl(g, -24, 24, P.coat2); g.beginPath(); g.moveTo(-22, bt - 4); g.lineTo(22, bt - 4); g.lineTo(0, bt + 70); g.closePath(); g.fill();
  if (P.tie) { g.fillStyle = P.tie; g.beginPath(); g.moveTo(-6, bt + 4); g.lineTo(6, bt + 4); g.lineTo(9, bt + 50); g.lineTo(0, bt + 62); g.lineTo(-9, bt + 50); g.closePath(); g.fill(); }
  if (P.tee) { g.fillStyle = mixC(P.coat, '#000', 0.25); g.beginPath(); g.ellipse(0, bt - 2, 26, 12, 0, 0, Math.PI); g.fill(); g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = 'bold 30px Arial'; g.textAlign = 'center'; if (P.logo) g.fillText(P.logo, 0, bt + 70); }
  else if (P.fur) { g.fillStyle = mixC(P.coat, '#000', 0.25); g.beginPath(); g.moveTo(-bw, bt + 40); for (let i = 0; i <= 10; i++) g.lineTo(-bw + i * bw * 0.2, bt + 50 + (i % 2 ? 14 : 0)); g.lineTo(bw, bt + 40); g.lineTo(bw, bb); g.lineTo(-bw, bb); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 2; for (let i = 0; i < 18; i++) { const xx = -bw + hash(i) * bw * 2, yy = bt + 30 + hash(i + 1) * 140; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + 4, yy + 10); g.stroke(); } }
  else if (P.type === 'sheikh' || P.type === 'mullah') { g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 22, bt + 30); g.lineTo(i * 26, bb); g.stroke(); } }
  else { g.fillStyle = mixC('#d8c08a', '#000', 0.1); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(0, bt + 82 + i * 26, 4.5, 0, 7); g.fill(); } }
  if (P.steth) { g.strokeStyle = '#333'; g.lineWidth = 4; g.beginPath(); g.moveTo(-20, bt); g.quadraticCurveTo(-30, bt + 70, 0, bt + 80); g.quadraticCurveTo(30, bt + 70, 20, bt); g.stroke(); g.fillStyle = '#999'; g.beginPath(); g.arc(0, bt + 82, 8, 0, 7); g.fill(); }
  if (P.belt) { g.fillStyle = P.belt; g.fillRect(-bw, -62, bw * 2, 14); g.fillStyle = '#e0b23a'; g.fillRect(-9, -64, 18, 18); }
  if (P.medal) { g.fillStyle = '#c0392b'; g.fillRect(-48, bt + 46, 8, 14); g.fillStyle = '#e0b23a'; g.beginPath(); g.arc(-44, bt + 66, 6, 0, 7); g.fill(); g.fillStyle = '#2d5d8a'; g.fillRect(-34, bt + 46, 8, 14); g.fillStyle = '#e0b23a'; g.beginPath(); g.arc(-30, bt + 66, 6, 0, 7); g.fill(); }
  // sheen
  const sh = g.createLinearGradient(-bw, 0, bw, 0); sh.addColorStop(0.18, 'rgba(255,255,255,0)'); sh.addColorStop(0.26, 'rgba(255,255,255,0.18)'); sh.addColorStop(0.34, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(-bw, bt - 10, bw * 2, 200);
  g.restore();
  // feet nubs
  g.fillStyle = '#1e1712'; for (const fx of [-26, 26]) { g.beginPath(); g.ellipse(fx + walk * (fx > 0 ? 6 : -6), 4, 20, 8, 0, 0, 7); g.fill(); }
  // epaulettes
  if (P.epau) for (const sx of [-1, 1]) { g.fillStyle = shadeRad(g, sx * 52, bt + 6, 18, P.epau); g.beginPath(); g.ellipse(sx * 50, bt + 6, 22, 10, sx * 0.25, 0, 7); g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke(); g.strokeStyle = P.epau; g.lineWidth = 2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(sx * 50 + i * 7, bt + 14); g.lineTo(sx * 50 + i * 7, bt + 26); g.stroke(); } }
  // --- arms ---
  const arm = (side, ang) => { g.save(); g.translate(side * (bw - 6), bt + 24); g.rotate(ang * side); const L = 70; g.beginPath(); g.moveTo(-13, 0); g.lineTo(-11, L); g.quadraticCurveTo(0, L + 10, 11, L); g.lineTo(13, 0); g.quadraticCurveTo(0, -12, -13, 0); g.fillStyle = shadeCyl(g, -13, 13, P.coat); g.fill(); g.strokeStyle = OUT; g.lineWidth = lw * 0.8; g.stroke(); g.fillStyle = shadeRad(g, 0, L + 8, 13, P.skin, 0.3, 0.25); g.beginPath(); g.arc(0, L + 8, 12, 0, 7); g.fill(); g.stroke(); g.restore(); };
  let aL = 0.18, aR = 0.18; const act = P.act || 'idle';
  if (act === 'point') aR = -1.9 + Math.sin(t * 3) * 0.05; else if (act === 'wave') aR = -2.4 + Math.sin(t * 10) * 0.35; else if (act === 'talk') { aR = 0.5 + Math.sin(t * 4) * 0.5; aL = 0.3 + Math.sin(t * 3.3 + 1) * 0.3; } else if (act === 'cheer') { aR = -2.6 + Math.sin(t * 8) * 0.2; aL = -2.6 + Math.sin(t * 8 + 1) * 0.2; } else if (act === 'walk') { aR = walk * 0.5; aL = -walk * 0.5; } else if (act === 'angry') { aR = -0.5 + Math.abs(Math.sin(t * 7)) * -1.2; aL = 0.6; } else if (act === 'shrug') { aR = -0.9; aL = -0.9; } else { aR = 0.15 + Math.sin(ph) * 0.04; aL = 0.15 + Math.sin(ph + 1) * 0.04; }
  arm(-1, aL); arm(1, aR);
  // --- head ---
  const hr = 74, HS = 1.28, hy = bt - hr * HS + 18, look = (P.look || 0) * 8;
  g.save(); g.translate(0, hy); g.scale(HS, HS); g.rotate(Math.sin(ph * 0.7) * 0.04 + (act === 'talk' ? Math.sin(t * 5) * 0.03 : 0));
  // neck shadow
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(0, hr - 6, 34, 10, 0, 0, 7); g.fill();
  // hair back / long hair
  if (P.long) { g.fillStyle = shadeRad(g, 0, -10, hr + 12, P.hair, 0.2, 0.3); g.strokeStyle = OUT; g.lineWidth = lw; g.beginPath(); g.arc(0, -4, hr + 8, Math.PI, 0); g.lineTo(hr + 8, hr * 0.75); g.quadraticCurveTo(hr + 6, hr + 24, hr * 0.55, hr + 18); g.lineTo(hr * 0.5, 10); g.lineTo(-hr * 0.5, 10); g.lineTo(-hr * 0.55, hr + 18); g.quadraticCurveTo(-hr - 6, hr + 24, -hr - 8, hr * 0.75); g.closePath(); g.fill(); g.stroke(); }
  if (P.hat === 'keffiyeh') { g.fillStyle = shadeRad(g, 0, 0, hr + 18, P.hatc, 0.2, 0.25); g.beginPath(); g.moveTo(-hr - 14, 10); g.quadraticCurveTo(-hr - 20, hr + 50, -hr + 10, hr + 46); g.lineTo(hr - 10, hr + 46); g.quadraticCurveTo(hr + 20, hr + 50, hr + 14, 10); g.arc(0, 0, hr + 14, 0, Math.PI, true); g.closePath(); g.fill(); g.strokeStyle = OUT; g.lineWidth = lw; g.stroke(); }
  // ears
  g.fillStyle = shadeRad(g, 0, 0, 16, P.skin, 0.2, 0.3); for (const ex of [-1, 1]) { g.beginPath(); g.ellipse(ex * (hr - 4), 6, 13, 18, 0, 0, 7); g.fill(); g.strokeStyle = OUT; g.lineWidth = lw * 0.8; g.stroke(); }
  // face sphere
  g.fillStyle = shadeRad(g, 0, 0, hr, P.skin, 0.32, 0.28); g.beginPath(); g.arc(0, 0, hr, 0, 7); g.fill(); g.strokeStyle = OUT; g.lineWidth = lw; g.stroke();
  // hair top
  if (!['keffiyeh', 'turban', 'helmet', 'hardhat'].includes(P.hat) && P.hair && P.type !== 'bald') { g.save(); g.beginPath(); g.arc(0, 0, hr, 0, 7); g.clip(); g.fillStyle = shadeRad(g, -10, -hr * 0.8, hr, P.hair, 0.22, 0.2); g.beginPath(); g.moveTo(-hr - 4, 0); g.quadraticCurveTo(-hr + 6, -hr * 1.25, 10, -hr - 6); g.quadraticCurveTo(hr * 1.1, -hr * 0.9, hr + 4, -6); g.quadraticCurveTo(hr * 0.5, -hr * 0.55, 20, -hr * 0.62); g.quadraticCurveTo(-10, -hr * 0.3, -hr * 0.55, -hr * 0.5); g.quadraticCurveTo(-hr * 0.8, -hr * 0.2, -hr - 4, 0); g.fill(); g.restore(); }
  // curly hair puff (afro-style curls)
  if (P.curly) { const hc = P.hair || '#2a1d14'; // dome of small tight curls covering the top of the head
    g.fillStyle = shadeRad(g, -10, -hr * 0.6, hr * 1.1, hc, 0.25, 0.3); g.beginPath(); g.arc(0, -8, hr + 10, Math.PI * 1.02, Math.PI * 1.98); g.quadraticCurveTo(hr * 0.6, -hr * 0.42, 0, -hr * 0.46); g.quadraticCurveTo(-hr * 0.6, -hr * 0.42, -hr - 9, -10); g.fill();
    for (let i = 0; i < 46; i++) { const a = Math.PI * (1.0 + hash(i * 3.1) * 1.0), r = hr * (0.55 + hash(i * 7.7) * 0.5); const px = Math.cos(a) * r, py = Math.sin(a) * r * 0.95 - 10; if (py > -hr * 0.4) continue; const cr = 7 + hash(i) * 5; g.fillStyle = shadeRad(g, px, py, cr, hc, 0.45, 0.25); g.beginPath(); g.arc(px, py, cr, 0, 7); g.fill(); g.strokeStyle = 'rgba(70,70,80,0.3)'; g.lineWidth = 1.2; g.stroke(); }
    for (let i = 0; i < 18; i++) { const a = Math.PI * (1.0 + i / 17), px = Math.cos(a) * (hr + 9), py = Math.sin(a) * (hr + 7) - 8; const cr = 9 + hash(i + 50) * 4; g.fillStyle = shadeRad(g, px, py, cr, hc, 0.45, 0.25); g.beginPath(); g.arc(px, py, cr, 0, 7); g.fill(); g.strokeStyle = 'rgba(70,70,80,0.3)'; g.lineWidth = 1.2; g.stroke(); } }
  // cheeks
  g.fillStyle = 'rgba(235,110,100,0.28)'; for (const cx2 of [-1, 1]) { g.beginPath(); g.ellipse(cx2 * 40 + look, 26, 13, 8, 0, 0, 7); g.fill(); }
  // eyes
  const blink = (Math.floor(t * 0.35 + (P.seed || 0)) !== Math.floor(t * 0.35 + 0.04 + (P.seed || 0))) ? 0.1 : 1;
  for (const ex of [-1, 1]) { const exx = ex * 24 + look, eyy = 4; g.save(); g.translate(exx, eyy); g.scale(1, blink); g.fillStyle = '#1b120c'; g.beginPath(); g.ellipse(0, 0, 9.5, 12.5, 0, 0, 7); g.fill(); const eyeC = P.eyes ? P.eyes[ex < 0 ? 0 : 1] : P.eye; if (eyeC) { g.fillStyle = eyeC; g.beginPath(); g.ellipse(0, 1.5, 7, 9.5, 0, 0, 7); g.fill(); g.fillStyle = '#10141c'; g.beginPath(); g.arc(0, 2, 3.6, 0, 7); g.fill(); } g.fillStyle = '#fff'; g.beginPath(); g.arc(-3, -5, 3.6, 0, 7); g.fill(); g.beginPath(); g.arc(3, 4, 1.6, 0, 7); g.fill(); g.restore(); }
  // brows
  g.strokeStyle = P.beard && P.type === 'mullah' ? '#bdb6a8' : '#2a1d14'; g.lineWidth = 4.5; g.lineCap = 'round'; const bm = { angry: 0.35, worried: -0.35, happy: -0.1, shock: -0.25 }[P.mood] || 0; for (const ex of [-1, 1]) { g.beginPath(); g.moveTo(ex * 14 + look, -16 + (P.mood === 'shock' ? -6 : 0)); g.lineTo(ex * 34 + look, -18 - ex * 0 + (ex * bm * -10) * -1 + (P.mood === 'shock' ? -6 : 0)); g.stroke(); }
  if (P.glasses) { g.strokeStyle = '#1b1b1b'; g.lineWidth = 3; for (const ex of [-1, 1]) { g.beginPath(); g.arc(ex * 24 + look, 4, 17, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(-7 + look, 2); g.lineTo(7 + look, 2); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.18)'; for (const ex of [-1, 1]) { g.beginPath(); g.arc(ex * 24 + look, 4, 15, 0, 7); g.fill(); } }
  // nose
  g.fillStyle = mixC(P.skin, '#a0522d', 0.3); g.beginPath(); g.ellipse(look, 20, 6, 4.5, 0, 0, 7); g.fill();
  // beard / moustache
  if (P.beard) { g.fillStyle = shadeRad(g, 0, 44, 48, P.beard, 0.15, 0.25); g.beginPath(); g.moveTo(-hr + 8, 8); g.quadraticCurveTo(-hr + 4, hr + 26, look, hr + 30); g.quadraticCurveTo(hr - 4, hr + 26, hr - 8, 8); g.quadraticCurveTo(hr * 0.5, 40, look, 36); g.quadraticCurveTo(-hr * 0.5, 40, -hr + 8, 8); g.fill(); g.strokeStyle = OUT; g.lineWidth = lw * 0.8; g.stroke(); }
  if (P.mous || P.beard) { g.fillStyle = P.beard || P.hair || '#2a1d14'; g.beginPath(); g.moveTo(look, 28); g.quadraticCurveTo(-18 + look, 22, -30 + look, 36); g.quadraticCurveTo(-14 + look, 34, look, 32); g.quadraticCurveTo(14 + look, 34, 30 + look, 36); g.quadraticCurveTo(18 + look, 22, look, 28); g.fill(); }
  // mouth
  const m = P.talk ? clamp(P.talk) : 0; g.fillStyle = '#5a1a14'; g.strokeStyle = '#3a120c'; g.lineWidth = 3;
  if (m > 0.08) { g.beginPath(); g.ellipse(look, 44, 9, 3 + m * 9, 0, 0, 7); g.fill(); } else if (P.mood === 'happy') { g.beginPath(); g.arc(look, 36, 12, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); } else if (P.mood === 'angry' || P.mood === 'worried') { g.beginPath(); g.arc(look, 54, 10, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); } else if (P.mood === 'shock') { g.beginPath(); g.ellipse(look, 46, 8, 11, 0, 0, 7); g.fill(); } else { g.beginPath(); g.moveTo(-8 + look, 44); g.lineTo(8 + look, 44); g.stroke(); }
  // hats
  const hat = P.hat;
  if (hat === 'peak') { g.fillStyle = shadeRad(g, 0, -hr * 0.8, hr, P.hatc, 0.25, 0.3); g.beginPath(); g.ellipse(0, -hr * 0.72, hr * 0.95, hr * 0.42, 0, Math.PI, 0); g.lineTo(hr * 0.78, -hr * 0.55); g.lineTo(-hr * 0.78, -hr * 0.55); g.closePath(); g.fill(); g.strokeStyle = OUT; g.lineWidth = lw; g.stroke(); g.fillStyle = '#151515'; g.beginPath(); g.ellipse(0, -hr * 0.52, hr * 0.85, 12, 0, 0, Math.PI); g.fill(); g.fillStyle = '#e0b23a'; g.fillRect(-hr * 0.78, -hr * 0.66, hr * 1.56, 7); g.beginPath(); g.arc(0, -hr * 0.86, 9, 0, 7); g.fill(); }
  else if (hat === 'helmet' || hat === 'hardhat') { g.fillStyle = shadeRad(g, -10, -hr * 0.6, hr * 1.05, P.hatc, 0.3, 0.3); g.beginPath(); g.arc(0, -hr * 0.18, hr * 1.02, Math.PI * 1.02, Math.PI * 1.98); g.quadraticCurveTo(hr * 1.2, -hr * 0.08, hr * 1.12, 0); g.lineTo(-hr * 1.12, 0); g.quadraticCurveTo(-hr * 1.2, -hr * 0.08, -hr * 1.0, -hr * 0.2); g.closePath(); g.fill(); g.strokeStyle = OUT; g.lineWidth = lw; g.stroke(); if (hat === 'hardhat') { g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(-8, -hr * 1.18, 16, hr * 1.0); } }
  else if (hat === 'turban') { g.fillStyle = shadeRad(g, 0, -hr * 0.6, hr * 1.1, P.hatc, 0.25, 0.25); g.beginPath(); g.ellipse(0, -hr * 0.52, hr * 1.04, hr * 0.62, 0, 0, 7); g.fill(); g.strokeStyle = OUT; g.lineWidth = lw; g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 4; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(0, -hr * 0.55 + i * 10 - 14, hr * (0.95 - i * 0.05), hr * 0.3, 0.08 * (i % 2 ? 1 : -1), 0, Math.PI); g.stroke(); } }
  else if (hat === 'keffiyeh') { g.fillStyle = shadeRad(g, 0, -hr * 0.6, hr * 1.1, P.hatc, 0.2, 0.2); g.beginPath(); g.arc(0, -4, hr + 12, Math.PI * 1.0, Math.PI * 2); g.lineTo(hr + 12, 4); g.quadraticCurveTo(hr * 0.9, -hr * 0.55, 0, -hr * 0.6); g.quadraticCurveTo(-hr * 0.9, -hr * 0.55, -hr - 12, 4); g.closePath(); g.fill(); g.strokeStyle = OUT; g.lineWidth = lw; g.stroke(); g.fillStyle = '#151515'; g.beginPath(); g.ellipse(0, -hr * 0.7, hr * 0.95, 11, 0, 0, 7); g.fill(); }
  else if (hat === 'crown') { g.fillStyle = shadeRad(g, 0, -hr, 50, P.hatc, 0.4, 0.3); g.beginPath(); g.moveTo(-46, -hr * 0.7); for (let i = 0; i <= 4; i++) { g.lineTo(-46 + i * 23, -hr * 0.7 - (i % 2 ? 22 : 48)); g.lineTo(-46 + i * 23 + 11.5, -hr * 0.7 - 16); } g.lineTo(46, -hr * 0.7); g.closePath(); g.fill(); g.strokeStyle = OUT; g.lineWidth = lw; g.stroke(); g.fillStyle = '#c0392b'; g.beginPath(); g.arc(0, -hr * 0.82, 6, 0, 7); g.fill(); }
  else if (hat === 'sailor') { g.fillStyle = '#f7f7f7'; g.beginPath(); g.ellipse(0, -hr * 0.82, hr * 0.7, hr * 0.26, 0, 0, 7); g.fill(); g.strokeStyle = OUT; g.lineWidth = lw; g.stroke(); g.fillStyle = '#1d3a6b'; g.fillRect(-hr * 0.66, -hr * 0.8, hr * 1.32, 8); }
  else if (hat === 'straw') { g.fillStyle = shadeRad(g, 0, -hr * 0.7, hr * 1.4, P.hatc, 0.3, 0.2); g.beginPath(); g.ellipse(0, -hr * 0.58, hr * 1.35, 22, 0, 0, 7); g.fill(); g.strokeStyle = OUT; g.lineWidth = lw; g.stroke(); g.beginPath(); g.ellipse(0, -hr * 0.78, hr * 0.68, hr * 0.38, 0, Math.PI, 0); g.fill(); g.stroke(); g.fillStyle = '#8a3a1a'; g.fillRect(-hr * 0.66, -hr * 0.72, hr * 1.32, 9); }
  else if (hat === 'hijab') { g.save(); g.fillStyle = shadeRad(g, -8, -20, hr * 1.15, P.hatc, 0.25, 0.3); g.beginPath(); g.arc(0, -2, hr + 10, Math.PI * 0.82, Math.PI * 2.18); g.quadraticCurveTo(hr * 0.9, hr + 30, 0, hr + 34); g.quadraticCurveTo(-hr * 0.9, hr + 30, -hr - 6, hr * 0.5); g.closePath(); g.fill(); g.strokeStyle = OUT; g.lineWidth = lw; g.stroke(); g.globalCompositeOperation = 'destination-out'; g.restore(); g.save(); g.beginPath(); g.ellipse(0, 10, hr * 0.74, hr * 0.8, 0, 0, 7); g.clip(); g.fillStyle = shadeRad(g, 0, 0, hr, P.skin, 0.32, 0.2); g.fillRect(-hr, -hr, hr * 2, hr * 2); g.restore(); g.strokeStyle = mixC(P.hatc, '#000', 0.3); g.lineWidth = 2.5; g.beginPath(); g.ellipse(0, 10, hr * 0.74, hr * 0.8, 0, 0, 7); g.stroke();
    // redraw face features over the skin window
    for (const ex of [-1, 1]) { g.fillStyle = '#1b120c'; g.beginPath(); g.ellipse(ex * 24 + look, 6, 9.5, 12.5, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex * 24 + look - 3, 1, 3.6, 0, 7); g.fill(); g.fillStyle = 'rgba(235,110,100,0.28)'; g.beginPath(); g.ellipse(ex * 38 + look, 28, 11, 7, 0, 0, 7); g.fill(); }
    g.fillStyle = mixC(P.skin, '#a0522d', 0.3); g.beginPath(); g.ellipse(look, 22, 5.5, 4, 0, 0, 7); g.fill(); g.strokeStyle = '#5a1a14'; g.lineWidth = 3; if (P.talk > 0.08) { g.fillStyle = '#5a1a14'; g.beginPath(); g.ellipse(look, 44, 8, 3 + P.talk * 8, 0, 0, 7); g.fill(); } else { g.beginPath(); g.arc(look, 36, 10, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); } }
  else if (hat === 'tophat') { g.fillStyle = shadeCyl(g, -44, 44, '#1d1d22'); g.fillRect(-44, -hr * 1.75, 88, hr * 1.05); g.strokeStyle = OUT; g.lineWidth = lw; g.strokeRect(-44, -hr * 1.75, 88, hr * 1.05); g.beginPath(); g.ellipse(0, -hr * 0.7, 76, 14, 0, 0, 7); g.fillStyle = '#1d1d22'; g.fill(); g.stroke(); g.fillStyle = '#7a1f2a'; g.fillRect(-44, -hr * 0.92, 88, 12); }
  // glossy head highlight
  g.save(); g.globalCompositeOperation = 'screen'; const hl = g.createRadialGradient(-hr * 0.38, -hr * 0.45, 2, -hr * 0.38, -hr * 0.45, hr * 0.5); hl.addColorStop(0, 'rgba(255,255,255,0.35)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = hl; g.beginPath(); g.arc(0, 0, hr, 0, 7); g.fill(); g.restore();
  g.restore();
  // prop in hand
  if (P.prop) { g.save(); g.translate(bw - 6, bt + 24); g.rotate(aR); g.translate(0, 84); g.rotate(-aR); propDraw(g, P.prop, t); g.restore(); }
  g.restore();
  // speech bubble / emote above head
  if (P.emote) emote(g, x + 80 * s, y - 380 * s, s, P.emote, P.key ? lt : t);
}
function easeOutBounce(x) { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; }
function propDraw(g, p, t) {
  if (p === 'money') { for (let i = 0; i < 3; i++) { g.save(); g.translate(0, -i * 10); g.fillStyle = '#4f8a4a'; rr(g, -30, -14, 60, 28, 4); g.fill(); g.strokeStyle = '#1e3a1c'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#9fd09a'; g.beginPath(); g.arc(0, 0, 7, 0, 7); g.fill(); g.restore(); } }
  else if (p === 'paper') { g.fillStyle = '#f5ecd5'; g.save(); g.rotate(-0.2); rr(g, -24, -34, 48, 64, 3); g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke(); g.strokeStyle = 'rgba(0,0,0,0.4)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-16, -22 + i * 10); g.lineTo(16, -22 + i * 10); g.stroke(); } g.restore(); }
  else if (p === 'flag') { g.strokeStyle = '#5a3a1a'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 20); g.lineTo(0, -110); g.stroke(); g.fillStyle = '#c0392b'; g.beginPath(); g.moveTo(0, -110); for (let i = 0; i <= 10; i++) g.lineTo(i * 7, -110 + Math.sin(t * 6 + i * 0.7) * 5); g.lineTo(70, -70); for (let i = 10; i >= 0; i--) g.lineTo(i * 7, -70 + Math.sin(t * 6 + i * 0.7) * 5); g.fill(); }
  else if (p === 'oil') { g.fillStyle = shadeCyl(g, -24, 24, '#2c3e50'); rr(g, -24, -40, 48, 70, 6); g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke(); g.fillStyle = '#e0b23a'; g.fillRect(-24, -14, 48, 8); }
}
function emote(g, x, y, s, kind, lt) { const e = easeOutBack(clamp(lt / 0.35)); if (e <= 0) return; g.save(); g.translate(x, y); g.scale(s * e, s * e); g.fillStyle = '#fffaf0'; g.strokeStyle = OUT; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, 44, 38, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-18, 30); g.lineTo(-30, 52); g.lineTo(-4, 34); g.fill(); g.font = 'bold 46px "Segoe UI Emoji","Nirmala UI"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = kind === '!' ? '#c0392b' : kind === '?' ? '#2d5d8a' : '#222'; g.fillText(kind, 0, 2); g.restore(); }
// small 3D-ish props that sit on the map
function ship(g, x, y, s, t, col = '#7a3b1f', flag = '#c0392b') { g.save(); g.translate(x, y + Math.sin(t * 2) * 3 * s); g.rotate(Math.sin(t * 1.6) * 0.04); g.scale(s, s); g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(0, 8, 80, 12, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(-80, -20); g.lineTo(80, -20); g.quadraticCurveTo(70, 10, 50, 12); g.lineTo(-56, 12); g.quadraticCurveTo(-74, 6, -80, -20); g.fillStyle = shadeCyl(g, -80, 80, col); g.fill(); g.strokeStyle = OUT; g.lineWidth = 3; g.stroke(); g.fillStyle = '#e8d9b0'; g.fillRect(-70, -26, 140, 8);
  g.strokeStyle = '#4a2a14'; g.lineWidth = 5; g.beginPath(); g.moveTo(-10, -20); g.lineTo(-10, -150); g.stroke(); for (const [yy, w] of [[-140, 60], [-95, 76]]) { g.fillStyle = '#f6efdc'; g.beginPath(); g.moveTo(-10 - w / 2, yy); g.quadraticCurveTo(-10, yy - 6, -10 + w / 2, yy); g.quadraticCurveTo(-10 + w / 2 + 8, yy + 20, -10 + w / 2, yy + 40); g.quadraticCurveTo(-10, yy + 30, -10 - w / 2, yy + 40); g.quadraticCurveTo(-10 - w / 2 - 6, yy + 20, -10 - w / 2, yy); g.fill(); g.strokeStyle = OUT; g.lineWidth = 2.5; g.stroke(); }
  g.fillStyle = flag; g.beginPath(); g.moveTo(-10, -150); g.lineTo(22 + Math.sin(t * 7) * 3, -142); g.lineTo(-10, -134); g.fill(); g.restore(); }
function moneyStack(g, x, y, s, n = 5) { g.save(); g.translate(x, y); g.scale(s, s); for (let i = 0; i < n; i++) { const xx = (i % 3 - 1) * 46, yy = -Math.floor(i / 3) * 18; g.save(); g.translate(xx, yy); g.fillStyle = '#3f7a3c'; rr(g, -40, -16, 80, 26, 3); g.fill(); g.strokeStyle = '#1e3a1c'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#8fc98a'; g.fillRect(-40, -16, 80, 6); g.fillStyle = '#cfe8cc'; g.beginPath(); g.arc(0, -3, 6, 0, 7); g.fill(); g.restore(); } g.restore(); }
function coin(g, x, y, r, t) { const w = Math.abs(Math.cos(t * 3)); g.save(); g.translate(x, y); g.scale(Math.max(0.15, w), 1); g.fillStyle = shadeRad(g, 0, 0, r, '#e8b923', 0.4, 0.3); g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.strokeStyle = '#8a6410'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#8a6410'; g.font = `bold ${r}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', 0, 1); g.restore(); }
// framed painting / photo insert that pops up behind toys (like the reference's frame)
function frameCard(g, x, y, w, h, k, drawFn, o = {}) { if (k <= 0) return; const lt = tAge('FC' + x + y, k), e = easeOutBack(clamp(lt / 0.5)); g.save(); g.translate(x, y); g.rotate((o.rot || -0.03) * e); g.scale(e, e); g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 30; g.shadowOffsetY = 12; g.fillStyle = '#6b4423'; g.fillRect(-w / 2 - 18, -h / 2 - 18, w + 36, h + 36); g.shadowColor = 'transparent'; const fg = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); fg.addColorStop(0, '#a87a3e'); fg.addColorStop(0.5, '#6b4423'); fg.addColorStop(1, '#a87a3e'); g.strokeStyle = fg; g.lineWidth = 14; g.strokeRect(-w / 2 - 9, -h / 2 - 9, w + 18, h + 18); const [fc, fx] = tmpC('FRAMEC'); if (fc.width !== W) { fc.width = W; fc.height = H; } fx.setTransform(1, 0, 0, 1, 0, 0); fx.globalAlpha = 1; fx.clearRect(0, 0, W, H); drawFn(fx, W, H); const sc = Math.max(w / W, h / H); g.save(); g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.clip(); g.drawImage(fc, -W * sc / 2, -H * sc / 2, W * sc, H * sc); g.restore(); g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; g.strokeRect(-w / 2, -h / 2, w, h); g.restore(); }
