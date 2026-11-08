// ===== infant-amnesia engine: 2D that looks 3D, one continuous camera =====
const W = 1920, H = 1080, FPS = 30;
const PAL = {
  bg0: '#050812', bg1: '#0a1430', navy: '#0e1b3d', gold: '#ffc65c', gold2: '#ff9f2e', cyan: '#4fd8ff', blue: '#3a7bff',
  pink: '#ff4f8b', red: '#ff3b3b', green: '#5dffa8', violet: '#a07bff', white: '#f4f1ea', ink: '#0b0f1c', teal: '#2de0c8'
};
const FONT_H = '"Anek Bangla", "Nirmala UI", sans-serif';
const FONT_U = '"Hind Siliguri", "Nirmala UI", sans-serif';
const BN = n => String(n).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);

// ---------- colour helpers ----------
function hexRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const v = parseInt(h, 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; }
function shade(h, k) { const [r, g, b] = hexRgb(h); const f = c => Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k)); return `rgb(${f(r)},${f(g)},${f(b)})`; }
function rgba(h, a) { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; }
const easeIO = t => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const spring = (t, f = 9, dmp = 5) => { t = Math.max(0, t); return 1 - Math.exp(-dmp * t) * Math.cos(f * t); };

// ---------- glow sprites (prerendered, cheap) ----------
const SPR = {};
function glowSprite(col, size = 128) {
  const k = col + size; if (SPR[k]) return SPR[k];
  const c = mk(size, size), g = c.getContext('2d'), r = size / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, rgba(col, 1)); gr.addColorStop(0.18, rgba(col, 0.55)); gr.addColorStop(0.5, rgba(col, 0.12)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, size, size); return SPR[k] = c;
}
function glow(g, x, y, r, col, a = 1) { if (a <= 0 || r <= 0) return; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = clamp(a); g.drawImage(glowSprite(col), x - r, y - r, r * 2, r * 2); g.restore(); }

// ---------- iso projection (screen-space, origin ox,oy, scale s) ----------
const C30 = 0.866, S30 = 0.5;
function ISO(ox, oy, s) { return (x, y, z = 0) => [ox + (x - y) * C30 * s, oy + (x + y) * S30 * s - z * s]; }
function poly(g, pts) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); }
// box from (x,y,z) size (w,d,h); visible faces: top, left(+y face), right(+x face)
function isoBox(g, P, x, y, z, w, d, h, col, o = {}) {
  const A = P(x, y + d, z), B = P(x + w, y + d, z), Cc = P(x + w, y, z), T0 = P(x, y, z + h), T1 = P(x + w, y, z + h), T2 = P(x + w, y + d, z + h), T3 = P(x, y + d, z + h), Bt = P(x + w, y + d, z);
  const left = [A, Bt, T2, T3], right = [Bt, Cc, T1, T2], top = [T0, T1, T2, T3];
  g.save(); if (o.alpha != null) g.globalAlpha *= o.alpha;
  const lg = g.createLinearGradient(A[0], A[1] - h, A[0], A[1]); lg.addColorStop(0, shade(col, -0.25)); lg.addColorStop(1, shade(col, -0.55));
  poly(g, left); g.fillStyle = lg; g.fill();
  const rg = g.createLinearGradient(Cc[0], Cc[1] - h, Cc[0], Cc[1]); rg.addColorStop(0, shade(col, -0.05)); rg.addColorStop(1, shade(col, -0.38));
  poly(g, right); g.fillStyle = rg; g.fill();
  const tg = g.createLinearGradient(T0[0], T0[1], T2[0], T2[1]); tg.addColorStop(0, shade(col, 0.32)); tg.addColorStop(1, shade(col, 0.08));
  poly(g, top); g.fillStyle = o.topCol || tg; g.fill();
  if (o.rim !== false) {
    g.lineJoin = 'round'; g.strokeStyle = o.rim || 'rgba(255,240,210,0.55)'; g.lineWidth = o.rimW || 1.6;
    g.beginPath(); g.moveTo(T3[0], T3[1]); g.lineTo(T2[0], T2[1]); g.lineTo(T1[0], T1[1]); g.moveTo(T2[0], T2[1]); g.lineTo(Bt[0], Bt[1]); g.stroke();
  }
  if (o.edge) { g.strokeStyle = o.edge; g.lineWidth = o.edgeW || 2.5; poly(g, top); g.stroke(); }
  g.restore();
  return { top, left, right, T0, T1, T2, T3 };
}
// draw something onto an iso face via affine transform. face: 'top' | 'left' | 'right'
function onFace(g, P, face, x, y, z, s, fn) {
  const o = P(x, y, z); g.save();
  if (face === 'top') g.transform(C30 * s, S30 * s, -C30 * s, S30 * s, o[0], o[1]);
  else if (face === 'left') g.transform(C30 * s, S30 * s, 0, s, o[0], o[1]);
  else g.transform(C30 * s, -S30 * s, 0, s, o[0], o[1]);
  fn(g); g.restore();
}
function floorShadow(g, P, x, y, w, d, a = 0.45, spread = 0.25) {
  const c = P(x + w / 2, y + d / 2, 0); const r = Math.max(w, d) * (1 + spread);
  g.save(); g.translate(c[0], c[1]); g.scale(1, 0.55); const gr = g.createRadialGradient(0, 0, 0, 0, 0, r * 0.9 * (P(1, 0)[0] - P(0, 0)[0]) / C30);
  gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * 2, 0, 7); g.fill(); g.restore();
}

// ---------- text ----------
function txt(g, s, x, y, o = {}) {
  g.save(); g.font = `${o.w || 700} ${o.size || 48}px ${o.font || FONT_H}`; g.textAlign = o.align || 'center'; g.textBaseline = o.base || 'middle';
  if (o.alpha != null) g.globalAlpha *= o.alpha;
  if (o.track) g.letterSpacing = o.track + 'px';
  if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.blur || 24; }
  if (o.stroke) { g.lineWidth = o.stroke; g.strokeStyle = o.strokeCol || PAL.ink; g.lineJoin = 'round'; g.strokeText(s, x, y); }
  if (o.grad) { const m = g.measureText(s); const gr = g.createLinearGradient(0, y - (o.size || 48) / 2, 0, y + (o.size || 48) / 2); o.grad.forEach((c, i) => gr.addColorStop(i / (o.grad.length - 1), c)); g.fillStyle = gr; }
  else g.fillStyle = o.col || PAL.white;
  g.fillText(s, x, y); g.restore();
}
function tw(g, s, size, w = 700, font = FONT_H) { g.save(); g.font = `${w} ${size}px ${font}`; const m = g.measureText(s).width; g.restore(); return m; }
// typewriter: reveal chars by p
function typeOn(s, p) { const a = [...s]; return a.slice(0, Math.floor(a.length * clamp(p) + 0.0001)).join(''); }

// rounded glass panel
function glass(g, x, y, w, h, o = {}) {
  g.save(); if (o.alpha != null) g.globalAlpha *= o.alpha;
  const r = o.r || 22; g.beginPath(); g.roundRect(x, y, w, h, r);
  const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, o.top || 'rgba(30,48,92,0.78)'); gr.addColorStop(1, o.bot || 'rgba(10,18,42,0.86)');
  g.fillStyle = gr; g.fill();
  g.strokeStyle = o.edge || 'rgba(140,190,255,0.35)'; g.lineWidth = o.lw || 2; g.stroke();
  g.beginPath(); g.roundRect(x + 2, y + 2, w - 4, Math.min(40, h / 3), [r, r, 4, 4]); g.fillStyle = 'rgba(255,255,255,0.05)'; g.fill();
  g.restore();
}
function chip(g, s, x, y, col, o = {}) {
  const size = o.size || 30, w = tw(g, s, size, 700, FONT_U) + size * 1.2, h = size * 1.6;
  g.save(); if (o.alpha != null) g.globalAlpha *= o.alpha; const sc = o.scale || 1; g.translate(x, y); g.scale(sc, sc);
  g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, h / 2); g.fillStyle = o.fill || rgba(col, 0.16); g.fill(); g.strokeStyle = col; g.lineWidth = 2.5; g.stroke();
  txt(g, s, 0, 2, { size, font: FONT_U, col: o.tcol || col, w: 700 }); g.restore(); return w;
}
// "একে বলে" term pill (fewshot style)
function termPill(g, t, t0, term, en, col = PAL.gold, x = 120, y = 900) {
  const p = clamp((t - t0) / 0.45), out = 1; if (p <= 0) return;
  const e = easeOutBack(p), size = 64, w = Math.max(tw(g, term, size, 800) + 90, en ? tw(g, en, 26, 600, FONT_U) + 90 : 0), h = 108;
  g.save(); g.globalAlpha = clamp(p * 2) * out; g.translate(x, y); g.scale(lerp(0.7, 1, e), lerp(0.7, 1, e));
  txt(g, 'একে বলে', 8, -h / 2 - 26, { size: 26, font: FONT_U, col: rgba(col, 0.95), align: 'left', w: 600, track: 3 });
  g.beginPath(); g.roundRect(0, -h / 2, w, h, 18); g.fillStyle = 'rgba(8,12,26,0.88)'; g.fill();
  g.lineWidth = 4; g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 22; g.stroke(); g.shadowBlur = 0;
  txt(g, term, 44, en ? -12 : 4, { size, align: 'left', col: PAL.white, w: 800 });
  if (en) txt(g, en, 46, 34, { size: 24, align: 'left', col: rgba(col, 0.9), font: FONT_U, w: 600, track: 2 });
  g.restore();
}
// big kinetic slam word
function slam(g, s, x, y, p, o = {}) {
  if (p <= 0) return; const e = easeOutBack(clamp(p)), sc = lerp(o.from || 2.4, 1, e);
  g.save(); g.globalAlpha = clamp(p * 3) * (o.alpha != null ? o.alpha : 1); g.translate(x, y); g.scale(sc, sc); g.rotate((o.rot || 0) * (1 - e));
  txt(g, s, 0, 0, Object.assign({ size: 120, w: 800, stroke: 10, strokeCol: 'rgba(5,8,18,0.9)' }, o)); g.restore();
}

// ---------- vector icons (line-art, draw-on via p) ----------
function strokeOn(g, p, len = 2000) { g.setLineDash([len, len]); g.lineDashOffset = len * (1 - clamp(p)); }
const ICON = {
  brain(g) { g.beginPath(); g.moveTo(-40, 20); g.bezierCurveTo(-62, 18, -64, -14, -44, -22); g.bezierCurveTo(-44, -46, -14, -54, 0, -40); g.bezierCurveTo(14, -54, 46, -48, 46, -24); g.bezierCurveTo(66, -16, 62, 18, 42, 22); g.bezierCurveTo(34, 40, 6, 40, 0, 28); g.bezierCurveTo(-8, 40, -34, 38, -40, 20); g.moveTo(0, -40); g.lineTo(0, 28); g.moveTo(-30, -8); g.quadraticCurveTo(-18, -2, -24, 12); g.moveTo(26, -10); g.quadraticCurveTo(14, 0, 24, 12); },
  eye(g) { g.beginPath(); g.moveTo(-50, 0); g.quadraticCurveTo(0, -42, 50, 0); g.quadraticCurveTo(0, 42, -50, 0); g.moveTo(16, 0); g.arc(0, 0, 16, 0, 7); },
  ear(g) { g.beginPath(); g.moveTo(-14, 40); g.bezierCurveTo(-30, 30, -36, -10, -24, -30); g.bezierCurveTo(-8, -54, 34, -40, 30, -8); g.bezierCurveTo(28, 10, 8, 12, 8, 28); g.bezierCurveTo(8, 44, -6, 48, -14, 40); g.moveTo(-10, -12); g.bezierCurveTo(-4, -28, 16, -22, 12, -8); },
  nose(g) { g.beginPath(); g.moveTo(-4, -44); g.bezierCurveTo(-6, -10, -30, 10, -26, 26); g.bezierCurveTo(-22, 38, -6, 30, 0, 36); g.bezierCurveTo(6, 30, 22, 38, 26, 26); },
  q(g) { g.beginPath(); g.moveTo(-24, -20); g.bezierCurveTo(-24, -52, 26, -52, 26, -20); g.bezierCurveTo(26, 0, 0, 2, 0, 22); g.moveTo(0, 40); g.arc(0, 38, 2, 0, 7); },
  film(g) { g.beginPath(); g.rect(-50, -34, 100, 68); for (let i = -40; i <= 40; i += 20) { g.moveTo(i - 4, -34); g.lineTo(i - 4, -26); g.moveTo(i - 4, 26); g.lineTo(i - 4, 34); } g.moveTo(-50, -24); g.lineTo(50, -24); g.moveTo(-50, 24); g.lineTo(50, 24); g.moveTo(-8, -10); g.lineTo(12, 0); g.lineTo(-8, 10); g.closePath(); },
  drive(g) { g.beginPath(); g.roundRect(-50, -30, 100, 60, 8); g.moveTo(-36, 14); g.lineTo(10, 14); g.moveTo(30, 14); g.arc(28, 14, 3, 0, 7); g.moveTo(-36, -12); g.lineTo(36, -12); },
  lock(g) { g.beginPath(); g.roundRect(-34, -6, 68, 52, 8); g.moveTo(-22, -6); g.lineTo(-22, -22); g.bezierCurveTo(-22, -52, 22, -52, 22, -22); g.lineTo(22, -6); g.moveTo(0, 12); g.lineTo(0, 28); },
  heart(g) { g.beginPath(); g.moveTo(0, 36); g.bezierCurveTo(-60, -4, -36, -54, 0, -24); g.bezierCurveTo(36, -54, 60, -4, 0, 36); },
  globe(g) { g.beginPath(); g.arc(0, 0, 44, 0, 7); g.moveTo(-44, 0); g.lineTo(44, 0); g.moveTo(0, -44); g.bezierCurveTo(-30, -20, -30, 20, 0, 44); g.moveTo(0, -44); g.bezierCurveTo(30, -20, 30, 20, 0, 44); g.moveTo(-38, -22); g.lineTo(38, -22); g.moveTo(-38, 22); g.lineTo(38, 22); },
  mic(g) { g.beginPath(); g.roundRect(-14, -44, 28, 56, 14); g.moveTo(-28, 0); g.bezierCurveTo(-28, 30, 28, 30, 28, 0); g.moveTo(0, 26); g.lineTo(0, 44); g.moveTo(-16, 44); g.lineTo(16, 44); },
  mirror(g) { g.beginPath(); g.ellipse(0, -10, 30, 40, 0, 0, 7); g.moveTo(0, 30); g.lineTo(0, 48); g.moveTo(-18, 48); g.lineTo(18, 48); g.moveTo(-14, -30); g.lineTo(6, -40); g.moveTo(-18, -16); g.lineTo(10, -30); },
  mouse(g) { g.beginPath(); g.moveTo(-40, 16); g.bezierCurveTo(-40, -18, 10, -26, 30, -4); g.lineTo(46, 4); g.lineTo(30, 12); g.bezierCurveTo(20, 20, -20, 22, -40, 16); g.moveTo(14, -16); g.arc(10, -16, 8, 0, 7); g.moveTo(-40, 16); g.bezierCurveTo(-58, 16, -60, 34, -46, 38); g.moveTo(34, 2); g.arc(33, 2, 1.5, 0, 7); },
  baby(g) { g.beginPath(); g.arc(0, -22, 22, 0, 7); g.moveTo(-22, 34); g.bezierCurveTo(-26, 4, 26, 4, 22, 34); g.closePath(); g.moveTo(-8, -24); g.arc(-8, -24, 1.5, 0, 7); g.moveTo(10, -24); g.arc(8, -24, 1.5, 0, 7); g.moveTo(-6, -12); g.quadraticCurveTo(0, -8, 6, -12); g.moveTo(0, -44); g.quadraticCurveTo(8, -50, 4, -40); },
  book(g) { g.beginPath(); g.moveTo(0, -30); g.bezierCurveTo(-20, -40, -40, -36, -50, -30); g.lineTo(-50, 34); g.bezierCurveTo(-40, 28, -20, 26, 0, 36); g.bezierCurveTo(20, 26, 40, 28, 50, 34); g.lineTo(50, -30); g.bezierCurveTo(40, -36, 20, -40, 0, -30); g.lineTo(0, 36); },
  speech(g) { g.beginPath(); g.roundRect(-48, -36, 96, 60, 16); g.moveTo(-20, 24); g.lineTo(-30, 44); g.lineTo(-4, 24); g.moveTo(-28, -14); g.lineTo(28, -14); g.moveTo(-28, 4); g.lineTo(12, 4); },
  bolt(g) { g.beginPath(); g.moveTo(8, -48); g.lineTo(-24, 6); g.lineTo(0, 6); g.lineTo(-8, 48); g.lineTo(24, -8); g.lineTo(0, -8); g.closePath(); },
  cake(g) { g.beginPath(); g.rect(-40, -4, 80, 40); g.moveTo(-40, 12); g.quadraticCurveTo(-30, 22, -20, 12); g.quadraticCurveTo(-10, 22, 0, 12); g.quadraticCurveTo(10, 22, 20, 12); g.quadraticCurveTo(30, 22, 40, 12); g.moveTo(0, -4); g.lineTo(0, -24); g.moveTo(0, -30); g.quadraticCurveTo(6, -36, 0, -44); g.quadraticCurveTo(-6, -36, 0, -30); },
  foot(g) { g.beginPath(); g.ellipse(0, 8, 18, 30, 0.1, 0, 7); for (let i = 0; i < 5; i++) { g.moveTo(-14 + i * 7 + 4, -30 + Math.abs(i - 1.5) * 3); g.arc(-14 + i * 7, -30 + Math.abs(i - 1.5) * 3, 4 - i * 0.4, 0, 7); } },
  drop(g) { g.beginPath(); g.moveTo(0, -46); g.bezierCurveTo(14, -20, 34, 0, 34, 16); g.bezierCurveTo(34, 36, 18, 46, 0, 46); g.bezierCurveTo(-18, 46, -34, 36, -34, 16); g.bezierCurveTo(-34, 0, -14, -20, 0, -46); },
  house(g) { g.beginPath(); g.moveTo(-46, -4); g.lineTo(0, -44); g.lineTo(46, -4); g.moveTo(-36, -12); g.lineTo(-36, 40); g.lineTo(36, 40); g.lineTo(36, -12); g.moveTo(-10, 40); g.lineTo(-10, 12); g.lineTo(10, 12); g.lineTo(10, 40); },
  photo(g) { g.beginPath(); g.rect(-46, -36, 92, 72); g.moveTo(-46, 22); g.lineTo(-14, -6); g.lineTo(8, 14); g.lineTo(22, 2); g.lineTo(46, 24); g.moveTo(24, -16); g.arc(20, -16, 6, 0, 7); },
  bike(g) { g.beginPath(); g.arc(-28, 16, 20, 0, 7); g.moveTo(48, 16); g.arc(28, 16, 20, 0, 7); g.moveTo(-28, 16); g.lineTo(-6, -14); g.lineTo(20, -14); g.lineTo(28, 16); g.moveTo(-6, -14); g.lineTo(0, 16); g.lineTo(20, -14); g.moveTo(-10, -24); g.lineTo(2, -24); g.moveTo(20, -14); g.lineTo(16, -28); g.lineTo(26, -28); },
  spoon(g) { g.beginPath(); g.ellipse(0, -26, 14, 20, 0, 0, 7); g.moveTo(0, -6); g.lineTo(0, 46); },
  dog(g) { g.beginPath(); g.moveTo(-44, 20); g.lineTo(-40, -6); g.lineTo(20, -6); g.lineTo(26, -26); g.lineTo(38, -30); g.lineTo(48, -18); g.lineTo(40, -10); g.lineTo(34, 20); g.moveTo(-34, -6); g.lineTo(-30, 20); g.moveTo(16, -6); g.lineTo(20, 20); g.moveTo(-40, -6); g.lineTo(-52, -20); g.moveTo(30, -26); g.lineTo(26, -38); },
  cloud(g) { g.beginPath(); g.moveTo(-40, 20); g.bezierCurveTo(-60, 20, -56, -8, -36, -6); g.bezierCurveTo(-34, -30, 0, -34, 6, -14); g.bezierCurveTo(18, -30, 48, -20, 40, 2); g.bezierCurveTo(58, 4, 56, 20, 40, 20); g.closePath(); },
  tiger(g) { g.beginPath(); g.arc(0, 0, 36, 0, 7); g.moveTo(-26, -24); g.lineTo(-30, -40); g.lineTo(-14, -32); g.moveTo(26, -24); g.lineTo(30, -40); g.lineTo(14, -32); g.moveTo(-12, -6); g.arc(-12, -6, 3, 0, 7); g.moveTo(15, -6); g.arc(12, -6, 3, 0, 7); g.moveTo(-6, 12); g.lineTo(0, 16); g.lineTo(6, 12); g.moveTo(-36, 0); g.lineTo(-22, 2); g.moveTo(36, 0); g.lineTo(22, 2); g.moveTo(0, -36); g.lineTo(0, -24); },
  people(g) { for (const [x, s] of [[-30, 0.8], [30, 0.8], [0, 1]]) { g.moveTo(x + 14 * s, -20 * s); g.arc(x, -20 * s, 14 * s, 0, 7); g.moveTo(x - 24 * s, 34 * s); g.bezierCurveTo(x - 24 * s, 0, x + 24 * s, 0, x + 24 * s, 34 * s); } },
  scope(g) { g.beginPath(); g.moveTo(-30, 44); g.lineTo(30, 44); g.moveTo(0, 44); g.lineTo(0, 30); g.moveTo(-20, 30); g.lineTo(20, 30); g.moveTo(-6, 30); g.lineTo(-24, -10); g.moveTo(-34, -6); g.lineTo(-10, -48); g.lineTo(2, -42); g.lineTo(-22, 0); g.closePath(); g.moveTo(10, 30); g.bezierCurveTo(34, 20, 30, -10, 8, -20); },
};
function icon(g, name, x, y, s, col, p = 1, o = {}) {
  if (p <= 0) return; g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = col; g.lineWidth = (o.lw || 4) / s * Math.min(1.6, s); if (o.glow !== false) { g.shadowColor = col; g.shadowBlur = 14; }
  strokeOn(g, p, 900); ICON[name](g); g.stroke(); g.setLineDash([]);
  if (o.fill && p >= 1) { g.globalAlpha = 0.15; g.fillStyle = col; ICON[name](g); g.fill(); }
  g.restore();
}
// glowing icon badge disk sitting in iso space
function badge(g, name, x, y, r, col, p = 1) {
  if (p <= 0) return; const e = easeOutBack(clamp(p));
  g.save(); g.translate(x, y); g.scale(e, e);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(0, r * 1.05, r * 0.95, r * 0.28, 0, 0, 7); g.fill();
  const gr = g.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r); gr.addColorStop(0, shade(col, -0.35)); gr.addColorStop(1, '#070b18');
  g.beginPath(); g.arc(0, 0, r, 0, 7); g.fillStyle = gr; g.fill(); g.lineWidth = 4; g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 20; g.stroke(); g.shadowBlur = 0;
  g.restore(); icon(g, name, x, y, r / 62 * e, PAL.white, clamp(p * 1.4 - 0.2), { lw: 4 });
}

// ---------- the continuous world floor ----------
let FLOOR = null, TRACES = [];
function buildFloor() {
  const S = 2048; FLOOR = mk(S, S); const g = FLOOR.getContext('2d');
  const gr = g.createLinearGradient(0, 0, S, S); gr.addColorStop(0, '#08112a'); gr.addColorStop(1, '#0a1634'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
  // fine grid
  g.strokeStyle = 'rgba(80,120,200,0.07)'; g.lineWidth = 1; for (let i = 0; i <= S; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, S); g.moveTo(0, i); g.lineTo(S, i); g.stroke(); }
  // traces (wrap-safe: generated inside tile with margin, mirrored at edges by drawing 9 offsets)
  let seed = 11; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  TRACES = [];
  for (let k = 0; k < 120; k++) {
    let x = Math.round(R() * 32) * 64, y = Math.round(R() * 32) * 64; const pts = [[x, y]]; let dir = Math.floor(R() * 4);
    const n = 3 + Math.floor(R() * 5);
    for (let s = 0; s < n; s++) { const L = (2 + Math.floor(R() * 6)) * 64; const diag = R() < 0.35; const dx = [1, 0, -1, 0][dir], dy = [0, 1, 0, -1][dir]; if (diag) { x += dx * L * 0.7 + dy * L * 0.7; y += dy * L * 0.7 - dx * L * 0.7; } else { x += dx * L; y += dy * L; } pts.push([x, y]); dir = (dir + (R() < 0.5 ? 1 : 3)) % 4; }
    TRACES.push({ pts, col: R() < 0.72 ? PAL.gold : PAL.cyan, w: R() < 0.2 ? 5 : 2.5 });
  }
  for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
    g.save(); g.translate(ox, oy);
    for (const tr of TRACES) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = rgba(tr.col, 0.12); g.lineWidth = tr.w + 8; g.beginPath(); tr.pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
      g.strokeStyle = rgba(tr.col, 0.55); g.lineWidth = tr.w; g.stroke();
      for (const p of [tr.pts[0], tr.pts[tr.pts.length - 1]]) { g.fillStyle = '#0a1634'; g.beginPath(); g.arc(p[0], p[1], 7, 0, 7); g.fill(); g.strokeStyle = rgba(tr.col, 0.8); g.lineWidth = 2.5; g.stroke(); }
    }
    g.restore();
  }
  // chips / neuron somas
  for (let k = 0; k < 26; k++) {
    const x = R() * S, y = R() * S, w = 60 + R() * 140, h = 40 + R() * 100;
    g.fillStyle = 'rgba(6,10,24,0.9)'; g.fillRect(x, y, w, h); g.strokeStyle = 'rgba(255,198,92,0.35)'; g.lineWidth = 2; g.strokeRect(x, y, w, h);
    for (let i = 8; i < w - 4; i += 14) { g.fillStyle = 'rgba(255,198,92,0.45)'; g.fillRect(x + i, y - 6, 6, 6); g.fillRect(x + i, y + h, 6, 6); }
  }
  for (let k = 0; k < 40; k++) { const x = R() * S, y = R() * S; const r = 3 + R() * 6; g.fillStyle = rgba(R() < 0.5 ? PAL.cyan : PAL.gold, 0.7); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
}
// iso matrix for floor: top-down (u,v) -> screen
function floorM(cx, cy, z) { return [C30 * z, S30 * z, -C30 * z, S30 * z, cx, cy]; }
function drawFloor(g, cam, t, tint) {
  const S = 2048, z = cam.z;
  g.save(); g.fillStyle = PAL.bg0; g.fillRect(0, 0, W, H);
  const m = floorM(W / 2, H * 0.58, z); g.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
  const u0 = ((cam.u % S) + S) % S, v0 = ((cam.v % S) + S) % S;
  g.translate(-u0, -v0);
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) g.drawImage(FLOOR, i * S, j * S);
  // travelling pulses
  g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < TRACES.length; k += 2) {
    const tr = TRACES[k]; let L = 0; const segs = []; for (let i = 1; i < tr.pts.length; i++) { const l = Math.hypot(tr.pts[i][0] - tr.pts[i - 1][0], tr.pts[i][1] - tr.pts[i - 1][1]); segs.push(l); L += l; }
    let d = ((t * 260 + k * 397) % (L + 400)) - 200; if (d < 0 || d > L) continue; let i = 0; while (i < segs.length - 1 && d > segs[i]) { d -= segs[i]; i++; }
    const a = tr.pts[i], b = tr.pts[i + 1], f = d / segs[i], x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f);
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) g.drawImage(glowSprite(tr.col), x + ox - 40, y + oy - 40, 80, 80);
  }
  g.restore();
  // depth fog toward horizon + floor tint
  const fg = g.createLinearGradient(0, 0, 0, H); fg.addColorStop(0, 'rgba(5,8,18,0.96)'); fg.addColorStop(0.28, 'rgba(5,8,18,0.55)'); fg.addColorStop(0.55, 'rgba(5,8,18,0.05)'); fg.addColorStop(1, 'rgba(5,8,18,0.35)');
  g.fillStyle = fg; g.fillRect(0, 0, W, H);
  if (tint) { g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.55; g.fillStyle = tint; g.fillRect(0, 0, W, H); g.restore(); const hz = g.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.3, W * 0.6); hz.addColorStop(0, rgba(tint, 0.16)); hz.addColorStop(1, rgba(tint, 0)); g.fillStyle = hz; g.fillRect(0, 0, W, H); }
  // floating dust motes (parallax)
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 46; k++) { const sp = 0.3 + hash(k) * 1.2; const x = (((hash(k + 3) * W * 1.4 - cam.u * 0.35 * sp + t * 14 * sp) % (W * 1.4)) + W * 1.4) % (W * 1.4) - W * 0.2; const y = (((hash(k + 9) * H - cam.v * 0.2 * sp - t * 10 * sp) % H) + H) % H; const r = 1 + hash(k + 5) * 3 * sp; g.globalAlpha = 0.25 + 0.35 * Math.sin(t * 1.3 + k); g.fillStyle = k % 3 ? '#ffd79a' : '#9be8ff'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  g.restore();
}
// floor point (u,v relative to camera) -> screen
function F2S(cam, du, dv) { return [W / 2 + (du - dv) * C30 * cam.z, H * 0.58 + (du + dv) * S30 * cam.z]; }

// ---------- HUD ----------
function hud(g, t, sec, col) {
  g.save(); g.globalAlpha = 0.92;
  g.font = `600 22px ${FONT_U}`; g.textBaseline = 'middle';
  g.fillStyle = rgba(col, 0.95); g.beginPath(); g.arc(70, 54, 6 + Math.sin(t * 4) * 1.5, 0, 7); g.fill();
  g.fillStyle = 'rgba(244,241,234,0.85)'; g.textAlign = 'left'; g.letterSpacing = '2px'; g.fillText('শৈশবের হারানো স্মৃতি', 90, 55);
  g.fillStyle = rgba(col, 0.9); g.fillText('·  ' + sec, 90 + tw(g, 'শৈশবের হারানো স্মৃতি', 22, 600, FONT_U) + 20, 55);
  g.strokeStyle = 'rgba(244,241,234,0.18)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(60, 84); g.lineTo(560, 84); g.stroke();
  // right: running memory counter
  const ts = Math.floor(t); const mm = String(Math.floor(ts / 60)).padStart(2, '0'), ss = String(ts % 60).padStart(2, '0');
  g.textAlign = 'right'; g.font = `500 20px Consolas, monospace`; g.fillStyle = 'rgba(244,241,234,0.6)'; g.fillText('MEM.SCAN  ' + mm + ':' + ss, W - 64, 55);
  g.fillStyle = rgba(col, 0.8); for (let i = 0; i < 12; i++) { const h = 4 + 14 * Math.abs(Math.sin(t * 3 + i * 0.7)); g.fillRect(W - 300 + i * 9, 66 - h / 2 + 10, 5, h); }
  // corner brackets
  g.strokeStyle = 'rgba(244,241,234,0.22)'; g.lineWidth = 2; const B = 36;
  for (const [x, y, sx, sy] of [[40, 40, 1, 1], [W - 40, 40, -1, 1], [40, H - 40, 1, -1], [W - 40, H - 40, -1, -1]]) { g.beginPath(); g.moveTo(x, y + sy * B); g.lineTo(x, y); g.lineTo(x + sx * B, y); g.stroke(); }
  g.restore();
}

// ---------- user character (rig) ----------
let CHAR_C, CHAR_G;
function charIn(g, t, x, y, s, o = {}) {
  // o.pose: front|side|back|chinta|phone ; o.up arm raise; mouth from voice
  if (!CHAR_C) { CHAR_C = mk(W, H); CHAR_G = CHAR_C.getContext('2d'); }
  const m = o.talk === false ? 0 : mouthAt(t);
  const c = CHAR_G; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
  const pose = o.pose || 'front', st = Object.assign({ t, mouth: m }, o);
  if (pose === 'side' && o.p == null) { st.p = t * 1.3; if (o.e == null) st.e = 0.8; }
  if (typeof st.wave === 'number' && st.wave !== 0 && Math.abs(st.wave) <= 1) st.wave = Math.sin(t * 6) * 10;
  if (pose === 'front') drawFront(c, x, y, s, st);
  else if (pose === 'side') drawSide(c, x, y, s, st);
  else if (pose === 'back') drawBack(c, x, y, s, st);
  else if (pose === 'chinta') drawChinta(c, x, y, s, st);
  else if (pose === 'phone') drawPhone(c, x, y, s, st);
  // rim light from the scene colour
  if (o.rim) { c.globalCompositeOperation = 'source-atop'; const rg = c.createLinearGradient(x - 200 * s, 0, x + 200 * s, 0); rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(0.75, 'rgba(0,0,0,0)'); rg.addColorStop(1, rgba(o.rim, 0.35)); c.fillStyle = rg; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(10,20,60,0.12)'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
  if (pose !== 'chinta') { g.save(); g.translate(x, y); g.scale(1, 0.28); const sg = g.createRadialGradient(0, 0, 0, 0, 0, 170 * s * 1.3); sg.addColorStop(0, 'rgba(0,0,0,0.55)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.beginPath(); g.arc(0, 0, 170 * s * 1.3, 0, 7); g.fill(); g.restore(); }
  g.save(); if (o.alpha != null) g.globalAlpha = o.alpha; g.drawImage(CHAR_C, 0, 0); g.restore();
}
function mouthAt(t) { const i = Math.round(t * FPS); if (!window.ENV || i < 0 || i >= ENV.length) return 0; const v = j => ENV[Math.max(0, Math.min(ENV.length - 1, j))]; const db = (v(i - 1) + 2 * v(i) + v(i + 1)) / 4; return clamp((db + 44) / 22) * (0.7 + 0.3 * Math.abs(Math.sin(t * 17))); }
