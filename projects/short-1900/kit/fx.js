// fx.js — depth/motion layers: bokeh, embers, smoke, light sweep, cloud pass, hazard tape, radar, HUD, speed lines, bubbles, shake
function bokeh(g, t, col = '255,255,255', n = 18, a = 0.35, seed = 0) {
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) { const k = i + seed * 50, r = 14 + hash(k) * 60, sp = 8 + hash(k + 1) * 26; const x = (hash(k + 2) * PW + Math.sin(t * 0.3 + k) * 40), y = ((hash(k + 3) * (PH + 200)) - t * sp) % (PH + 200); const yy = y < -100 ? y + PH + 200 : y;
    const gr = g.createRadialGradient(x, yy, 0, x, yy, r); gr.addColorStop(0, `rgba(${col},${a * (0.5 + 0.5 * hash(k + 4))})`); gr.addColorStop(0.7, `rgba(${col},${a * 0.25})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, yy, r, 0, 7); g.fill(); }
  g.restore();
}
function embers(g, t, n = 50, col = '255,150,60', k = 1) {
  if (k <= 0) return; g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) { const sp = 60 + hash(i + 7) * 160, ph = (t * sp / PH + hash(i)) % 1, x = hash(i + 3) * PW + Math.sin(t * 2 + i) * 30, y = PH * (1 - ph), s = 2 + hash(i + 5) * 5, a = Math.sin(ph * Math.PI) * k;
    g.fillStyle = `rgba(${col},${a})`; g.shadowColor = `rgba(${col},1)`; g.shadowBlur = 12; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); }
  g.restore();
}
const SMOKEC = {};
function smokeTex(rgb = '255,255,255') { if (SMOKEC[rgb]) return SMOKEC[rgb]; const c = mk(256, 256), g = c.getContext('2d'); for (let i = 0; i < 26; i++) { const x = 60 + hash(i) * 136, y = 60 + hash(i + 9) * 136, r = 30 + hash(i + 4) * 60, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},0.22)`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); } return SMOKEC[rgb] = c; }
function smokeLayer(g, t, rgb = '40,30,30', a = 0.6, n = 7, yBand = [1300, 1920], seed = 0) {
  const tex = smokeTex(rgb); g.save();
  for (let i = 0; i < n; i++) { const k = i + seed * 20, s = 500 + hash(k) * 600, x = ((hash(k + 1) * (PW + s) + t * (20 + hash(k + 2) * 40)) % (PW + s)) - s / 2, y = lerp(yBand[0], yBand[1], hash(k + 3)) - t * 12;
    g.globalAlpha = a * (0.5 + 0.5 * hash(k + 4)); g.drawImage(tex, x - s / 2, y - s / 2, s, s); }
  g.restore();
}
function lightSweep(g, t, period = 4.5, a = 0.22, off = 0) {
  const ph = ((t + off) % period) / period; if (ph > 0.45) return; const x = lerp(-700, PW + 700, ph / 0.45);
  g.save(); g.globalCompositeOperation = 'screen'; g.translate(x, PH / 2); g.rotate(0.35); const gr = g.createLinearGradient(-160, 0, 160, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-160, -PH, 320, PH * 2); g.restore();
}
// fly-through clouds at the start of a map beat (k: 0 -> 1 over ~0.9 s)
function cloudPass(g, k) {
  if (k >= 1) return; const tex = smokeTex(); g.save();
  for (let i = 0; i < 9; i++) { const ang = hash(i + 3) * 6.28, d0 = 80 + hash(i) * 300, s = lerp(900, 3600, easeOut(k)) * (0.7 + hash(i + 1) * 0.6), d = d0 + easeOut(k) * 900;
    g.globalAlpha = (1 - k) * 0.95; g.drawImage(tex, 540 + Math.cos(ang) * d - s / 2, 900 + Math.sin(ang) * d - s / 2, s, s); }
  g.globalAlpha = (1 - easeOut(k)) * 0.85; g.fillStyle = '#f4fbfa'; g.fillRect(0, 0, PW, PH); g.restore();
}
function hazardTape(g, t, y, ang = -0.06, k = 1) {
  if (k <= 0) return; g.save(); g.translate(PW / 2, y); g.rotate(ang); g.globalAlpha = clamp(k * 2); const w = PW * 1.4, h = 70, off = (t * 160) % 120;
  g.fillStyle = '#f4c430'; g.fillRect(-w / 2, -h / 2, w, h); g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.clip(); g.fillStyle = '#17181a'; for (let x = -w / 2 - 120; x < w / 2 + 120; x += 120) { g.beginPath(); g.moveTo(x + off, -h / 2); g.lineTo(x + off + 60, -h / 2); g.lineTo(x + off + 20, h / 2); g.lineTo(x + off - 40, h / 2); g.fill(); }
  g.restore();
}
function radar(g, x, y, r, t, k, col = '229,57,47') {
  if (k <= 0) return; g.save(); g.globalAlpha = clamp(k); g.translate(x, y); g.scale(1, 0.55);
  for (let i = 1; i <= 3; i++) { g.strokeStyle = `rgba(${col},0.45)`; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, r * i / 3, 0, 7); g.stroke(); }
  const a = t * 2.4; const gr = g.createConicGradient ? g.createConicGradient(a, 0, 0) : null; if (gr) { gr.addColorStop(0, `rgba(${col},0.55)`); gr.addColorStop(0.18, `rgba(${col},0)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); }
  g.restore();
}
function hud(g, x, y, w, h, k, col = '#e5392f', lab) {
  if (k <= 0) return; const e = easeOutBack(clamp(k)), L = 46; g.save(); g.translate(x, y); g.scale(lerp(1.6, 1, e), lerp(1.6, 1, e)); g.globalAlpha = clamp(k * 2); g.strokeStyle = col; g.lineWidth = 6; g.lineCap = 'round';
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => { g.beginPath(); g.moveTo(sx * w / 2, sy * (h / 2 - L)); g.lineTo(sx * w / 2, sy * h / 2); g.lineTo(sx * (w / 2 - L), sy * h / 2); g.stroke(); });
  g.lineWidth = 3; g.beginPath(); g.moveTo(-22, 0); g.lineTo(22, 0); g.moveTo(0, -22); g.lineTo(0, 22); g.stroke();
  if (lab) { font(g, 700, 30); g.fillStyle = col; g.textAlign = 'left'; g.fillText(lab, -w / 2, -h / 2 - 16); }
  g.restore();
}
function speedLines(g, cx, cy, t, k, col = 'rgba(255,255,255,A)') {
  if (k <= 0) return; g.save(); g.lineCap = 'round';
  for (let i = 0; i < 26; i++) { const a = hash(i) * 6.28, r0 = 260 + ((t * 900 + hash(i + 2) * 800) % 800), len = 80 + hash(i + 3) * 160; g.strokeStyle = col.replace('A', (0.5 * k * (1 - r0 / 1100)).toFixed(3)); g.lineWidth = 3 + hash(i + 4) * 4;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * (r0 + len), cy + Math.sin(a) * (r0 + len)); g.stroke(); }
  g.restore();
}
function upArrows(g, t, k, col = '#e5392f') {
  if (k <= 0) return; g.save();
  for (let i = 0; i < 9; i++) { const ph = (t * 0.5 + hash(i)) % 1, x = 80 + hash(i + 5) * 920, y = PH - ph * (PH + 200), s = 0.6 + hash(i + 2) * 0.8; g.globalAlpha = Math.sin(ph * Math.PI) * 0.75 * k; g.fillStyle = col;
    g.save(); g.translate(x, y); g.scale(s, s); g.beginPath(); g.moveTo(0, -60); g.lineTo(45, -5); g.lineTo(17, -5); g.lineTo(17, 55); g.lineTo(-17, 55); g.lineTo(-17, -5); g.lineTo(-45, -5); g.closePath(); g.fill(); g.restore(); }
  g.restore();
}
function bubbles(g, t, t0, list) {
  list.forEach(([txt, col, x, delay], i) => { const lt = t - t0 - delay; if (lt <= 0) return; const ph = clamp(lt / 2.6), y = lerp(1760, 1200, easeOut(ph)), e = easeOutBack(clamp(lt / 0.35));
    g.save(); g.translate(x + Math.sin(lt * 3 + i) * 14, y); g.scale(e, e); g.globalAlpha = 1 - clamp((ph - 0.75) / 0.25); font(g, 600, 34); const w = g.measureText(txt).width + 70;
    g.shadowColor = 'rgba(0,0,0,0.2)'; g.shadowBlur = 16; g.fillStyle = '#fff'; g.beginPath(); g.roundRect(-w / 2, -36, w, 72, 36); g.fill(); g.shadowColor = 'transparent'; g.fillStyle = col; g.beginPath(); g.arc(-w / 2 + 34, 0, 14, 0, 7); g.fill();
    g.fillStyle = COL.ink; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(txt, -w / 2 + 56, 3); g.restore(); });
}
function alarm(g, t, k) { if (k <= 0) return; const p = 0.5 + 0.5 * Math.sin(t * 9); const v = g.createRadialGradient(PW / 2, PH / 2, PW * 0.35, PW / 2, PH / 2, PH * 0.7); v.addColorStop(0, 'rgba(229,57,47,0)'); v.addColorStop(1, `rgba(229,57,47,${0.45 * p * k})`); g.fillStyle = v; g.fillRect(0, 0, PW, PH); }
function lightLeak(g, t, k = 1, col = '255,170,90') { if (k <= 0) return; g.save(); g.globalCompositeOperation = 'screen'; const x = PW * (0.1 + 0.25 * Math.sin(t * 0.7)), y = PH * (0.15 + 0.1 * Math.cos(t * 0.5)); const gr = g.createRadialGradient(x, y, 0, x, y, 900); gr.addColorStop(0, `rgba(${col},${0.35 * k})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(0, 0, PW, PH); g.restore(); }
// shake events: [t, amp, decay]
const SHAKES = [];
function shakeAt(t) { let x = 0, y = 0, r = 0; SHAKES.forEach(([t0, a, dc]) => { if (t < t0 || t > t0 + 2.5) return; const e = a * Math.exp(-(t - t0) * dc); x += Math.sin(t * 61 + t0) * e; y += Math.cos(t * 53 + t0 * 2) * e; r += Math.sin(t * 37) * e * 0.0009; }); return [x, y, r]; }
// character sprites (pre-rendered PNGs of the user's rig)
const CHAR = {}; let CHARLIST = new Set();
async function ensureChar(i) { if (!CHARLIST.has(i) || CHAR[i]) return; CHAR[i] = await loadImg(`../temp/char/c_${String(i).padStart(5, '0')}.png`); for (const k in CHAR) if (+k < i - 3) delete CHAR[k]; }
function drawChar(g, t, x, feetY, s, o = {}) {
  const i = Math.round(t * FPS), im = CHAR[i]; if (!im) return; const k = o.k == null ? 1 : o.k; if (k <= 0) return;
  g.save(); g.globalAlpha = clamp(k * 2); const e = easeOutBack(clamp(k)); g.translate(x + (1 - e) * (o.fromX || 0), feetY + (1 - e) * (o.fromY || 0)); g.scale(s * (o.flip ? -1 : 1), s);
  if (o.shadow !== false) { g.fillStyle = 'rgba(0,0,0,0.28)'; g.filter = 'blur(10px)'; g.beginPath(); g.ellipse(0, -6, 170, 26, 0, 0, 7); g.fill(); g.filter = 'none'; }
  if (o.rim) { g.shadowColor = o.rim; g.shadowBlur = 30; }
  g.drawImage(im, -300, -860); g.restore();
}
