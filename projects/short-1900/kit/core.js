// core 2D helpers: math, fonts, captions, headlines, editorial stage, flags, pills, gauges, finish
const PW = 1080, PH = 1920, FPS = 30;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const easeOut = x => 1 - Math.pow(1 - x, 3);
const easeOutBack = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const BN = s => String(s).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const COL = { ink: '#1d2326', yellow: '#ffd23f', red: '#e5392f', purple: '#8e3fd6', mint: '#dff1ee', mintD: '#bfe3df', paper: '#f6f3ec', blue: '#2f6fe0', gray: '#3f4649' };
const F_HEAD = "'AnekV', 'Nirmala UI'", F_UI = "'Hind Siliguri', 'Nirmala UI'";
function font(g, w, px, fam = F_UI, stretch = 'normal') { g.font = `${w} ${px}px ${fam}`; try { g.fontStretch = stretch; } catch (e) { } }

// ---------- anchors (char-position interpolation inside timeline segments) ----------
let SENT = []; let CUR_FROM = -1; const ANC = {};
function T(str) {
  const key = str + '|' + CUR_FROM.toFixed(1); if (ANC[key] != null) return ANC[key]; let first = null;
  for (const s of SENT) { let k = -1; while ((k = s.text.indexOf(str, k + 1)) >= 0) { const tt = s.s + (s.e - s.s) * k / s.text.length; if (first == null) first = tt; if (tt >= CUR_FROM - 0.6) return ANC[key] = tt; } }
  if (first == null) console.log('MISSING ANCHOR: ' + str); return ANC[key] = first == null ? 0 : first;
}
window.POPS = new Set(); window.BOOMS = new Set();
const P = (t, str, d = 0.35, off = 0) => { const a = T(str) + off; POPS.add(+a.toFixed(2)); return easeOutBack(seg(t, a, a + d)); };
const S = (t, str, d = 0.6, off = 0) => ease(seg(t, T(str) + off, T(str) + off + d));

// ---------- captions (ref 1: dark pill, yellow keywords) ----------
const KW = ['পারমাণবিক', 'বোমা', 'ইরান', 'আমেরিকা', 'ধ্বংস', 'মানুষ', 'পাল্টা', 'আক্রমণ', 'সামরিক', 'ঘাঁটি', 'মিত্রদের', 'মধ্যপ্রাচ্য', 'যুদ্ধে', 'হরমুজ', 'তেল', 'বন্ধ', 'দাম', 'আকাশ', 'তেজস্ক্রিয়তা', 'বৈশ্বিক', 'সংকট', 'পুরো', 'বিশ্ব', 'বিপদের', 'পক্ষে', 'কমেন্ট', 'মুহূর্তের', 'নিরীহ', 'চুপ', 'উত্তেজনা', 'মানবজাতির'];
let CAPS = [];
function buildCaps() {
  CAPS = [];
  SENT.forEach(s => {
    const words = s.text.split(/\s+/).filter(Boolean); let chunk = [], pos = 0, startPos = 0;
    const flush = endPos => { if (!chunk.length) return; CAPS.push({ words: chunk, s: s.s + (s.e - s.s) * startPos / s.text.length, e: s.s + (s.e - s.s) * endPos / s.text.length }); chunk = []; };
    words.forEach((w, i) => {
      const at = s.text.indexOf(w, pos); if (!chunk.length) startPos = at; chunk.push({ w, at: s.s + (s.e - s.s) * at / s.text.length }); pos = at + w.length;
      const len = chunk.map(c => c.w).join(' ').length; if (/[,।?]$/.test(w) || chunk.length >= 4 || len > 20 || i === words.length - 1) flush(pos);
    });
  });
  for (let i = 0; i < CAPS.length - 1; i++) CAPS[i].e = Math.max(CAPS[i].e, Math.min(CAPS[i + 1].s, CAPS[i].e + 0.4));
}
function caption(g, t, y = 1395) {
  const c = CAPS.find(c => t >= c.s - 0.04 && t < c.e + 0.05); if (!c) return; const lt = t - c.s + 0.04, k = easeOutBack(clamp(lt / 0.16));
  font(g, 600, 58); const sp = g.measureText(' ').width * 1.4; const ws = c.words.map(o => ({ w: o.w, at: o.at, wd: g.measureText(o.w).width, kw: KW.some(k => o.w.replace(/[,।?]/g, '').includes(k)) }));
  const tw = ws.reduce((a, b) => a + b.wd, 0) + sp * (ws.length - 1), pw = tw + 70, ph = 100;
  g.save(); g.translate(PW / 2, y); g.scale(0.88 + 0.12 * k, 0.88 + 0.12 * k); g.globalAlpha = clamp(lt / 0.1);
  g.shadowColor = 'rgba(0,0,0,0.3)'; g.shadowBlur = 26; g.shadowOffsetY = 10; g.fillStyle = 'rgba(40,46,50,0.9)'; g.beginPath(); g.roundRect(-pw / 2, -ph / 2, pw, ph, 26); g.fill(); g.shadowColor = 'transparent';
  g.textBaseline = 'middle'; g.textAlign = 'left'; let x = -tw / 2;
  ws.forEach((o, i) => { const nx = i < ws.length - 1 ? ws[i + 1].at : c.e; const act = t >= o.at - 0.03 && t < nx, past = t >= nx, kk = easeOutBack(clamp((t - o.at + 0.03) / 0.14));
    if (act) { g.save(); g.fillStyle = COL.yellow; g.beginPath(); const bw = o.wd + 24; g.translate(x + o.wd / 2, 2); g.scale(0.8 + 0.2 * kk, 0.8 + 0.2 * kk); g.roundRect(-bw / 2, -38, bw, 76, 16); g.fill(); g.restore(); }
    g.save(); g.translate(x + o.wd / 2, 4); const sc = act ? 1 + 0.06 * kk : 1; g.scale(sc, sc); g.globalAlpha = act || past ? 1 : 0.4; g.fillStyle = act ? COL.ink : (o.kw ? COL.yellow : '#fff'); g.fillText(o.w, -o.wd / 2, 0); g.restore(); x += o.wd + sp; });
  g.restore();
}

// ---------- ref 2 headline: condensed heavy, top-left, mask reveal ----------
function headline(g, l1, l2, k1, k2, col2 = COL.yellow, o = {}) {
  const x = o.x || 70, y = o.y || 300, s1 = o.s1 || 84, s2 = o.s2 || 132;
  const line = (txt, yy, sz, k, col) => {
    if (k <= 0) return; g.save(); font(g, 800, sz, F_HEAD, 'condensed'); g.textBaseline = 'alphabetic'; g.textAlign = o.align || 'left';
    g.beginPath(); g.rect(0, yy - sz * 1.25, PW, sz * 1.6); g.clip(); const off = (1 - easeOut(k)) * sz * 1.2;
    g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 18; g.shadowOffsetY = 6; g.fillStyle = col; g.fillText(txt, x, yy + off); g.restore();
  };
  line(l1, y, s1, k1, o.col1 || '#ffffff'); if (l2) line(l2, y + s2 * 1.02, s2, k2, col2);
  if (l2 && k2 > 0) { g.save(); font(g, 800, s2, F_HEAD, 'condensed'); const w = g.measureText(l2).width, kb = easeOut(clamp(k2 * 1.4 - 0.3)); g.fillStyle = col2; g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 10; g.fillRect(x, y + s2 * 1.02 + 22, w * kb, 12); g.restore(); }
}

// ---------- ref 1 pill label with pointer ----------
function pill(g, txt, x, y, k, o = {}) {
  if (k <= 0) return; const sz = o.size || 40; font(g, 600, sz); const w = g.measureText(txt).width + sz * 1.3, h = sz * 1.75;
  const st = { white: ['#ffffff', COL.ink], yellow: [COL.yellow, COL.ink], red: [COL.red, '#fff'], blue: [COL.blue, '#fff'], dark: ['rgba(40,46,50,0.92)', '#fff'] }[o.style || 'white'];
  g.save(); if (o.ax != null) { g.globalAlpha = clamp(k); g.strokeStyle = o.line || 'rgba(255,255,255,0.95)'; g.lineWidth = 4; g.beginPath(); g.moveTo(o.ax, o.ay); g.lineTo(x, y + h / 2 * Math.sign(o.ay - y || 1)); g.stroke(); g.fillStyle = g.strokeStyle; g.beginPath(); g.arc(o.ax, o.ay, 8, 0, 7); g.fill(); }
  const e = easeOutBack(clamp(k)); g.translate(x, y); g.scale(e, e); g.globalAlpha = clamp(k * 2);
  g.shadowColor = 'rgba(0,0,0,0.22)'; g.shadowBlur = 18; g.shadowOffsetY = 6; g.fillStyle = st[0]; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, h / 2); g.fill(); g.shadowColor = 'transparent';
  g.fillStyle = st[1]; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 0, 3); g.restore();
}

// ---------- ref 3 editorial stage: grey studio with diagonal light, floating card ----------
function stage(g, t, o = {}) {
  const bg = g.createLinearGradient(0, 0, PW, PH); bg.addColorStop(0, '#e9eaec'); bg.addColorStop(1, '#c9cbcf'); g.fillStyle = bg; g.fillRect(0, 0, PW, PH);
  g.save(); g.globalCompositeOperation = 'soft-light'; for (let i = 0; i < 6; i++) { const x = -600 + i * 420 + Math.sin(t * 0.3 + i) * 30; g.fillStyle = i % 2 ? 'rgba(255,255,255,0.55)' : 'rgba(120,120,130,0.35)'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 200, 0); g.lineTo(x + 200 + 900, PH); g.lineTo(x + 900, PH); g.fill(); } g.restore();
  const c = { x: 80, y: 150, w: PW - 160, h: 1460 };
  g.save(); g.shadowColor = 'rgba(0,0,0,0.28)'; g.shadowBlur = 70; g.shadowOffsetY = 30; const cg = g.createLinearGradient(0, c.y, 0, c.y + c.h); cg.addColorStop(0, '#fbfbfc'); cg.addColorStop(1, '#e4e5e8'); g.fillStyle = cg; g.beginPath(); g.roundRect(c.x, c.y, c.w, c.h, 46); g.fill(); g.restore();
  g.save(); g.beginPath(); g.roundRect(c.x, c.y, c.w, c.h, 46); g.clip(); g.globalCompositeOperation = 'multiply'; for (let i = 0; i < 3; i++) { const x = c.x - 300 + i * 520; g.fillStyle = 'rgba(200,200,206,0.35)'; g.beginPath(); g.moveTo(x, c.y); g.lineTo(x + 160, c.y); g.lineTo(x + 760, c.y + c.h); g.lineTo(x + 600, c.y + c.h); g.fill(); } g.restore();
  // registration crosses (ref 3 detail)
  g.save(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; [[c.x + 60, c.y + 60], [c.x + c.w - 60, c.y + c.h - 60]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x - 16, y); g.lineTo(x + 16, y); g.moveTo(x, y - 16); g.lineTo(x, y + 16); g.stroke(); }); g.restore();
  return c;
}
// word-by-word reveal; words: [{w, accent, size}] ; returns nothing
function words(g, list, cx, y, size, t, t0, per = 0.16, o = {}) {
  font(g, o.weight || 600, size); const sp = g.measureText(' ').width;
  const ms = list.map(w => { font(g, w.accent ? 700 : (o.weight || 600), w.size || size); return g.measureText(w.w).width; });
  const tw = ms.reduce((a, b) => a + b, 0) + sp * (list.length - 1); let x = cx - tw / 2;
  list.forEach((w, i) => {
    const k = clamp((t - (w.at != null ? w.at : t0 + i * per)) / 0.28); if (k > 0) {
      g.save(); font(g, w.accent ? 700 : (o.weight || 600), w.size || size); g.textBaseline = 'alphabetic'; g.globalAlpha = k; g.filter = k < 1 ? `blur(${(1 - k) * 8}px)` : 'none';
      g.translate(x, y + (1 - easeOut(k)) * 30); if (w.accent) g.transform(1, 0, -0.2, 1, 0, 0); g.fillStyle = w.accent ? (w.col || COL.purple) : (o.col || COL.ink); g.fillText(w.w, 0, 0);
      if (w.box && k >= 1) { const bw = ms[i], bh = (w.size || size); g.strokeStyle = COL.purple; g.lineWidth = 3; g.strokeRect(-10, -bh * 0.95, bw + 20, bh * 1.25); g.fillStyle = '#fff'; [[-10, -bh * 0.95], [bw + 10, -bh * 0.95], [-10, bh * 0.3], [bw + 10, bh * 0.3]].forEach(([a, b]) => { g.fillRect(a - 6, b - 6, 12, 12); g.strokeRect(a - 6, b - 6, 12, 12); }); }
      g.restore();
    } x += ms[i] + sp;
  });
}

// ---------- flags (drawn once, then waved cloth) ----------
const FLAGC = {};
function flagCanvas(type) {
  if (FLAGC[type]) return FLAGC[type]; const w = 600, h = 360, c = mk(w, h), g = c.getContext('2d');
  if (type === 'usa') {
    for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#bf2a37'; g.fillRect(0, i * h / 13, w, h / 13 + 1); }
    g.fillStyle = '#2b3f7a'; g.fillRect(0, 0, w * 0.4, h * 7 / 13); g.fillStyle = '#fff';
    for (let r = 0; r < 9; r++) { const n = r % 2 ? 5 : 6; for (let k = 0; k < n; k++) { const x = (r % 2 ? 2 : 1) * w * 0.4 / 12 + k * w * 0.4 / 6, y = (r + 1) * h * 7 / 13 / 10; star(g, x, y, 7); } }
  } else {
    g.fillStyle = '#239f40'; g.fillRect(0, 0, w, h / 3); g.fillStyle = '#ffffff'; g.fillRect(0, h / 3, w, h / 3); g.fillStyle = '#da0000'; g.fillRect(0, h * 2 / 3, w, h / 3);
    g.fillStyle = 'rgba(255,255,255,0.75)'; for (let i = 0; i < 22; i++) { g.fillRect(8 + i * 27, h / 3 - 9, 16, 4); g.fillRect(8 + i * 27, h * 2 / 3 + 5, 16, 4); }
    // stylised emblem
    g.save(); g.translate(w / 2, h / 2); g.fillStyle = '#da0000'; g.strokeStyle = '#da0000'; g.lineWidth = 7;
    g.beginPath(); g.arc(-14, 2, 34, Math.PI * 0.55, Math.PI * 1.45); g.stroke(); g.beginPath(); g.arc(14, 2, 34, -Math.PI * 0.45, Math.PI * 0.45); g.stroke();
    g.beginPath(); g.arc(-6, 2, 24, Math.PI * 0.6, Math.PI * 1.4); g.stroke(); g.beginPath(); g.arc(6, 2, 24, -Math.PI * 0.4, Math.PI * 0.4); g.stroke();
    g.fillRect(-4, -40, 8, 74); g.beginPath(); g.moveTo(0, -50); g.lineTo(-7, -38); g.lineTo(7, -38); g.fill(); g.restore();
  }
  return FLAGC[type] = c;
}
function star(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
// waving flag card with shadow (ref 3 cutout look)
function flag(g, type, x, y, w, t, k = 1, o = {}) {
  if (k <= 0) return; const src = flagCanvas(type), h = w * 0.6, N = 40, amp = (o.amp != null ? o.amp : 10) * w / 600;
  g.save(); g.globalAlpha = clamp(k * 2); const e = easeOutBack(clamp(k)); g.translate(x, y); g.rotate(o.rot || 0); g.scale(e, e);
  g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 40; g.shadowOffsetY = 22; g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-w / 2, -h / 2, w, h); g.shadowColor = 'transparent';
  for (let i = 0; i < N; i++) { const u = i / N, dy = Math.sin(u * 7 - t * 4) * amp * u, sx = u * src.width, sw = src.width / N + 1; g.drawImage(src, sx, 0, sw, src.height, -w / 2 + u * w, -h / 2 + dy, w / N + 1, h);
    const sh = Math.cos(u * 7 - t * 4) * 0.18 * u; g.fillStyle = sh > 0 ? `rgba(255,255,255,${sh})` : `rgba(0,0,0,${-sh})`; g.fillRect(-w / 2 + u * w, -h / 2 + dy, w / N + 1, h); }
  g.restore();
}

// ---------- gauge (ref 1) ----------
function gauge(g, x, y, r, v, k, label) {
  if (k <= 0) return; g.save(); g.translate(x, y); const e = easeOutBack(clamp(k)); g.scale(e, e); g.globalAlpha = clamp(k * 2);
  g.shadowColor = 'rgba(0,0,0,0.2)'; g.shadowBlur = 30; g.fillStyle = '#fff'; g.beginPath(); g.roundRect(-r - 40, -r - 40, 2 * r + 80, r + 150, 36); g.fill(); g.shadowColor = 'transparent';
  const cols = ['#3cc47c', '#9fd34a', '#ffd23f', '#ff9a2f', '#e5392f']; for (let i = 0; i < 5; i++) { g.strokeStyle = cols[i]; g.lineWidth = 26; g.beginPath(); g.arc(0, 20, r, Math.PI + i * Math.PI / 5 + 0.02, Math.PI + (i + 1) * Math.PI / 5 - 0.02); g.stroke(); }
  const a = Math.PI + Math.PI * clamp(v); g.strokeStyle = COL.ink; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 20); g.lineTo(Math.cos(a) * (r - 30), 20 + Math.sin(a) * (r - 30)); g.stroke(); g.fillStyle = COL.ink; g.beginPath(); g.arc(0, 20, 16, 0, 7); g.fill();
  font(g, 700, 44); g.textAlign = 'center'; g.fillText(label, 0, 100); g.restore();
}

// ---------- finish / grade ----------
let GRAIN;
function buildGrain() { GRAIN = mk(512, 512); const g = GRAIN.getContext('2d'), d = g.createImageData(512, 512); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); }
function finish(dst, src, look, t) {
  dst.setTransform(1, 0, 0, 1, 0, 0); dst.globalAlpha = 1; dst.globalCompositeOperation = 'source-over';
  dst.filter = look === 'drama' ? 'sepia(0.22) saturate(1.18) contrast(1.08)' : look === 'light' ? 'contrast(1.03) saturate(1.05)' : 'none'; dst.drawImage(src, 0, 0); dst.filter = 'none';
  if (look === 'drama') { dst.globalCompositeOperation = 'screen'; dst.globalAlpha = 0.16; dst.filter = 'blur(26px) brightness(1.2)'; dst.drawImage(src, 0, 0); dst.filter = 'none'; dst.globalCompositeOperation = 'source-over'; dst.globalAlpha = 1; }
  const va = { drama: 0.62, light: 0.22, face: 0.38, dark: 0.5 }[look] || 0.3;
  const v = dst.createRadialGradient(PW / 2, PH / 2, PW * 0.4, PW / 2, PH / 2, PH * 0.68); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(${look === 'drama' ? '30,12,0' : '0,0,0'},${va})`); dst.fillStyle = v; dst.fillRect(0, 0, PW, PH);
  dst.globalCompositeOperation = 'overlay'; dst.globalAlpha = look === 'drama' ? 0.1 : 0.05; const f = Math.floor(t * 24), ox = Math.floor(hash(f) * 512), oy = Math.floor(hash(f + 7) * 512);
  dst.save(); dst.translate(-ox, -oy); dst.fillStyle = dst.createPattern(GRAIN, 'repeat'); dst.fillRect(ox, oy, PW, PH); dst.restore(); dst.globalCompositeOperation = 'source-over'; dst.globalAlpha = 1;
}
