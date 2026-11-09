// neon.js: "Neon Tech" 9:16 short engine (dark 3D-grid world + kinetic captions + glass cards).
// Style studied from reference reels: one continuous camera move through a dark world,
// top-centre word-by-word captions (white, keywords yellow/pink with glow), small HUD
// (episode tag left, handle chip right, orange progress bar on top), glass UI cards,
// "TWIST!" slam, big yellow numbers, comment card, follow CTA.
// Everything is deterministic: frame(i) draws time t = i / FPS.
'use strict';

const W = 1080, H = 1920, FPS = 30;
const C = {
  bg0: '#0b1030', bg1: '#04050d', grid: '#3049b8', white: '#f4f6ff', dim: '#8d93ab',
  yellow: '#ffc93c', yellow2: '#ffe27a', pink: '#ff3d6e', green: '#2ee59d', cyan: '#53e0ff',
  orange: '#ff8a3d', card: 'rgba(16,20,44,0.86)', cardLine: 'rgba(140,160,255,0.22)',
};
const FONT = '"PJS", "Anek", system-ui, sans-serif';

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => (k = clamp(k), k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const eOut = k => 1 - Math.pow(1 - clamp(k), 3);
const back = k => { k = clamp(k); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
const win = (t, a, b, fi = 0.25, fo = 0.25) => clamp((t - a) / fi) * clamp((b - t) / fo);
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }

// ---------- camera: one continuous move, keyframed ----------
// key: { t, x, z, yaw, h }   (world units; ground plane y = 0)
let CAM_KEYS = [{ t: 0, x: 0, z: 0, yaw: 0, h: 6 }];
function camAt(t) {
  const K = CAM_KEYS;
  if (t <= K[0].t) return { ...K[0] };
  for (let i = 0; i < K.length - 1; i++) {
    const a = K[i], b = K[i + 1];
    if (t <= b.t) {
      const k = ease((t - a.t) / (b.t - a.t));
      return { x: lerp(a.x, b.x, k), z: lerp(a.z, b.z, k), yaw: lerp(a.yaw, b.yaw, k), h: lerp(a.h, b.h, k) };
    }
  }
  return { ...K[K.length - 1] };
}
// project world (X, Y, Z) to screen; returns null when behind the camera
let CAM = null, SHAKE = { x: 0, y: 0 };
const HORIZON = H * 0.30, FOCAL = 900;
function proj(X, Y, Z) {
  const dx = X - CAM.x, dz = Z - CAM.z, c = Math.cos(CAM.yaw), s = Math.sin(CAM.yaw);
  const rx = dx * c - dz * s, rz = dx * s + dz * c;
  if (rz < 0.4) return null;
  // camera pitched down: blend height into screen y
  return { x: W / 2 + FOCAL * rx / rz + SHAKE.x, y: HORIZON + FOCAL * (CAM.h - Y) / rz + SHAKE.y, z: rz };
}

// ---------- background world ----------
function drawWorld(g, t) {
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, C.bg1); bg.addColorStop(0.28, '#0a0e28'); bg.addColorStop(1, C.bg0);
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // horizon glow
  const hg = g.createRadialGradient(W / 2, HORIZON + 40, 0, W / 2, HORIZON + 40, 900);
  hg.addColorStop(0, 'rgba(70,90,220,0.20)'); hg.addColorStop(1, 'rgba(70,90,220,0)');
  g.fillStyle = hg; g.fillRect(0, 0, W, H);
  // grid: major lines every 4 units, minor every 1
  const step = 1, R = 46;
  const gx0 = Math.floor(CAM.x - R), gz0 = Math.floor(CAM.z - R);
  g.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i <= 2 * R; i += step) {
      const major = ((gx0 + i) % 4 === 0);
      if ((pass === 1) !== major) continue;
      seg(g, gx0 + i, gz0, gx0 + i, gz0 + 2 * R, major);
      const majorZ = ((gz0 + i) % 4 === 0);
      if ((pass === 1) === majorZ) seg(g, gx0, gz0 + i, gx0 + 2 * R, gz0 + i, majorZ);
    }
  }
}
function seg(g, x0, z0, x1, z1, major) {
  // split long lines so the projection stays correct near the camera
  const N = 24;
  let prev = null;
  for (let k = 0; k <= N; k++) {
    const p = proj(lerp(x0, x1, k / N), 0, lerp(z0, z1, k / N));
    if (p && prev) {
      const a = clamp(1 - (p.z - 6) / 48) * (major ? 0.85 : 0.42);
      if (a > 0.01) {
        g.strokeStyle = `rgba(80,115,255,${a})`; g.lineWidth = major ? 2.2 : 1.2;
        g.beginPath(); g.moveTo(prev.x, prev.y); g.lineTo(p.x, p.y); g.stroke();
      }
    }
    prev = p;
  }
}

// ---------- world objects (live on the ground, move with the camera) ----------
function worldPath(g, pts, prog, col, wd = 7, glow = 26) {
  // pts: [[x,z],...]; prog 0..1 draws the path on
  const tot = pts.length - 1, upto = prog * tot;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = col; g.shadowBlur = glow; g.strokeStyle = col; g.lineWidth = wd;
  g.beginPath(); let started = false, head = null;
  for (let i = 0; i < tot && i < upto; i++) {
    const k = Math.min(1, upto - i), SUB = 8;
    for (let s = 0; s <= SUB; s++) {
      const u = (s / SUB) * k;
      const p = proj(lerp(pts[i][0], pts[i + 1][0], u), 0.02, lerp(pts[i][1], pts[i + 1][1], u));
      if (!p) { started = false; continue; }
      if (!started) { g.moveTo(p.x, p.y); started = true; } else g.lineTo(p.x, p.y);
      head = p;
    }
  }
  g.stroke(); g.restore();
  return head;
}
function pathPoint(pts, u) {
  const tot = pts.length - 1, f = clamp(u) * tot, i = Math.min(tot - 1, Math.floor(f)), k = f - i;
  return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)];
}
function worldRing(g, x, z, r, col, a = 1, wd = 3) {
  g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = wd; g.shadowColor = col; g.shadowBlur = 18;
  g.beginPath(); let st = false;
  for (let k = 0; k <= 64; k++) {
    const an = k / 64 * Math.PI * 2, p = proj(x + Math.cos(an) * r, 0.02, z + Math.sin(an) * r);
    if (!p) { st = false; continue; }
    if (!st) { g.moveTo(p.x, p.y); st = true; } else g.lineTo(p.x, p.y);
  }
  g.stroke(); g.restore();
}
function worldTower(g, x, z, hgt, col, a = 1) {
  const b = proj(x, 0, z), tp = proj(x, hgt, z);
  if (!b || !tp) return;
  g.save(); g.globalAlpha = a;
  const s = clamp(14 / b.z, 0.2, 3);
  g.strokeStyle = 'rgba(200,210,255,0.85)'; g.lineWidth = 3 * s;
  g.beginPath(); g.moveTo(b.x - 10 * s, b.y); g.lineTo(tp.x, tp.y); g.lineTo(b.x + 10 * s, b.y); g.stroke();
  g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 20;
  g.beginPath(); g.arc(tp.x, tp.y, 6 * s, 0, 7); g.fill();
  g.restore();
}
function worldDot(g, x, z, col, r = 14) {
  const p = proj(x, 0.05, z); if (!p) return null;
  const s = clamp(14 / p.z, 0.3, 3);
  g.save(); g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 40;
  g.beginPath(); g.ellipse(p.x, p.y, r * s * 1.4, r * s * 0.9, 0, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(p.x, p.y, r * s * 0.6, r * s * 0.4, 0, 0, 7); g.fill();
  g.restore(); return p;
}

// ---------- HUD ----------
const CFG = { ep: 'EP 01 · TECH', handle: 'your_handle', duration: 20, captions: false, tag: false, handle_chip: false, cta: false }; // user: no subtitles, no EP tag, no handle chip, no follow card
function drawHUD(g, t) {
  // top progress bar
  g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(0, 0, W, 8);
  const pw = W * clamp(t / CFG.duration), pg = g.createLinearGradient(0, 0, W, 0);
  pg.addColorStop(0, C.orange); pg.addColorStop(1, C.yellow);
  g.save(); g.shadowColor = C.orange; g.shadowBlur = 16; g.fillStyle = pg; g.fillRect(0, 0, pw, 8); g.restore();
  // episode tag + handle chip: OFF by default (user said no)
  if (!CFG.tag && !CFG.handle_chip) return;
  if (CFG.tag) {
  g.font = `600 26px ${FONT}`; g.fillStyle = C.dim; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.letterSpacing = '5px'; g.fillText(CFG.ep, 64, 140); g.letterSpacing = '0px';
  }
  if (!CFG.handle_chip) return;
  // handle chip
  g.font = `600 28px ${FONT}`;
  const tw = g.measureText(CFG.handle).width, cw = tw + 94, cx = W - 56 - cw, cy = 116;
  rr(g, cx, cy, cw, 50, 25); g.fillStyle = 'rgba(14,16,34,0.9)'; g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = 2; g.stroke();
  const ig = g.createLinearGradient(cx + 14, cy + 37, cx + 44, cy + 13);
  ig.addColorStop(0, '#feda75'); ig.addColorStop(0.5, '#d62976'); ig.addColorStop(1, '#4f5bd5');
  rr(g, cx + 14, cy + 11, 28, 28, 8); g.fillStyle = ig; g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 2.4; g.beginPath(); g.arc(cx + 28, cy + 25, 6, 0, 7); g.stroke();
  g.fillStyle = C.white; g.fillText(CFG.handle, cx + 56, cy + 26);
}

// ---------- captions ----------
// line markup: *word* = yellow highlight, !word! = pink highlight. "/" forces a line break.
// cap: { t0, t1, text, words?: [t...] (optional per-word start times) }
let CAPS = [];
function parseCap(text) {
  // markers may span several words: *tech secret* -> both yellow
  const out = []; let cur = null;
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    if (raw === '/') { out.push({ br: true }); continue; }
    let w = raw, col = cur;
    if (!cur && w[0] === '*') { cur = col = C.yellow; w = w.slice(1); }
    else if (!cur && w[0] === '!' && w.length > 1) { cur = col = C.pink; w = w.slice(1); }
    const m = w.match(/^(.*?)([*!])([.,!?:…]*)$/);
    if (cur && m && ((m[2] === '*' && cur === C.yellow) || (m[2] === '!' && cur === C.pink))) { w = m[1] + m[3]; cur = null; }
    out.push({ w, col });
  }
  return out;
}
function drawCaption(g, t) {
  const cap = CAPS.find(c => t >= c.t0 && t < c.t1 + 0.25);
  if (!cap) return;
  const words = cap._w || (cap._w = parseCap(cap.text));
  const real = words.filter(w => !w.br);
  const n = real.length, span = Math.min(cap.t1 - cap.t0 - 0.3, 0.32 * n);
  const out = clamp((t - cap.t1) / 0.25);
  const fs = cap.size || 88;
  g.font = `800 ${fs}px ${FONT}`; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  // layout: wrap at 900px, centre each line
  const lines = [[]]; let lw = 0; const sp = g.measureText(' ').width;
  for (const wd of words) {
    if (wd.br) { lines.push([]); lw = 0; continue; }
    const ww = g.measureText(wd.w).width;
    if (lw > 0 && lw + sp + ww > 900) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push({ ...wd, ww }); lw += (lw ? sp : 0) + ww;
  }
  let idx = 0; const y0 = cap.y || 360, lh = fs * 1.16;
  lines.forEach((ln, li) => {
    const tot = ln.reduce((s, w) => s + w.ww, 0) + sp * (ln.length - 1);
    let x = W / 2 - tot / 2;
    for (const wd of ln) {
      const ts = cap.words ? cap.words[idx] : cap.t0 + (n > 1 ? span * idx / (n - 1) : 0);
      const k = clamp((t - ts) / 0.28), e = eOut(k);
      if (k > 0) {
        g.save();
        g.globalAlpha = e * (1 - out);
        const blur = (1 - e) * 10 + out * 10;
        if (blur > 0.3) g.filter = `blur(${blur.toFixed(1)}px)`;
        const y = y0 + li * lh + (1 - e) * 26 - out * 18;
        if (wd.col) {
          // keyword: colour wipes in after the word lands, with glow
          const ck = clamp((t - ts - 0.12) / 0.25);
          g.fillStyle = mix(C.white, wd.col, ck);
          g.shadowColor = wd.col; g.shadowBlur = 30 * ck;
          if (wd.col === C.yellow && ck > 0) {
            const gr = g.createLinearGradient(0, y - fs, 0, y);
            gr.addColorStop(0, mix(C.white, C.yellow2, ck)); gr.addColorStop(1, mix(C.white, '#ffb21a', ck));
            g.fillStyle = gr;
          }
        } else {
          g.fillStyle = mix(C.dim, C.white, clamp(k * 1.6));
          g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 18;
        }
        g.fillText(wd.w, x, y);
        g.restore();
      }
      x += wd.ww + sp; idx++;
    }
  });
}
function mix(a, b, k) {
  const pa = hex(a), pb = hex(b);
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(k)))).join(',')})`;
}
function hex(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }

// ---------- UI pieces (screen space) ----------
function popIn(t, t0, t1) { // scale/alpha for cards
  const a = clamp((t - t0) / 0.35), o = clamp((t1 - t) / 0.25);
  return { s: lerp(0.86, 1, back(a)) * lerp(0.94, 1, o), a: eOut(a) * o, blur: (1 - eOut(a)) * 8 + (1 - o) * 8 };
}
function withPop(g, t, t0, t1, cx, cy, fn) {
  if (t < t0 || t > t1) return;
  const p = popIn(t, t0, t1);
  g.save(); g.globalAlpha = p.a; if (p.blur > 0.3) g.filter = `blur(${p.blur.toFixed(1)}px)`;
  g.translate(cx, cy); g.scale(p.s, p.s); g.translate(-cx, -cy); fn(); g.restore();
}
function glassCard(g, x, y, w, h, opts = {}) {
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 50; g.shadowOffsetY = 18;
  rr(g, x, y, w, h, opts.r || 30); g.fillStyle = C.card; g.fill(); g.restore();
  g.save(); rr(g, x, y, w, h, opts.r || 30); g.strokeStyle = opts.line || C.cardLine; g.lineWidth = 2.5; g.stroke();
  // top sheen
  const sh = g.createLinearGradient(0, y, 0, y + h * 0.5);
  sh.addColorStop(0, 'rgba(255,255,255,0.06)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = sh; g.fill(); g.restore();
}
function label(g, txt, x, y, col = C.dim, size = 22) {
  g.font = `700 ${size}px ${FONT}`; g.fillStyle = col; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.letterSpacing = '4px'; g.fillText(txt.toUpperCase(), x, y); g.letterSpacing = '0px';
}
function pill(g, txt, x, y, col, opts = {}) {
  g.font = `700 ${opts.size || 30}px ${FONT}`;
  const tw = g.measureText(txt).width, h = (opts.size || 30) * 1.9, w = tw + h * 0.9 + (opts.icon ? h * 0.6 : 0);
  const X = opts.center ? x - w / 2 : x;
  g.save(); rr(g, X, y - h / 2, w, h, h / 2);
  g.fillStyle = opts.fill || 'rgba(10,14,32,0.92)'; g.fill();
  g.strokeStyle = col; g.lineWidth = 3; g.shadowColor = col; g.shadowBlur = 22; g.stroke(); g.restore();
  g.fillStyle = opts.text || C.white; g.textAlign = 'left'; g.textBaseline = 'middle';
  let tx = X + h * 0.45;
  if (opts.icon) { g.fillStyle = col; g.beginPath(); g.arc(tx + h * 0.18, y, h * 0.16, 0, 7); g.fill(); tx += h * 0.6; g.fillStyle = opts.text || C.white; }
  g.fillText(txt, tx, y + 1);
  return w;
}
// big yellow number, counts up between t0..t0+dur
function bigNumber(g, t, t0, dur, from, to, fmt, x, y, size = 190, col = C.yellow) {
  const v = lerp(from, to, eOut((t - t0) / dur));
  const s = fmt(v);
  g.save(); g.font = `800 ${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const gr = g.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  gr.addColorStop(0, col === C.yellow ? C.yellow2 : col); gr.addColorStop(1, col === C.yellow ? '#ffa812' : col);
  g.shadowColor = col; g.shadowBlur = 40; g.fillStyle = gr; g.fillText(s, x, y); g.restore();
}
// "TWIST!"-style extruded 3D slam word
function slam3D(g, t, t0, t1, txt, y = H * 0.42, size = 210) {
  if (t < t0 || t > t1) return;
  const k = (t - t0) / 0.32, sc = k < 1 ? lerp(2.6, 1, eOut(k)) : 1 + 0.03 * Math.sin((t - t0) * 6);
  const a = clamp(k * 2) * clamp((t1 - t) / 0.25);
  g.save(); g.globalAlpha = a; g.translate(W / 2, y); g.rotate(-0.06); g.scale(sc, sc);
  g.font = `800 italic ${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let d = 18; d > 0; d -= 2) { g.fillStyle = mix('#7a3c00', '#c46a00', 1 - d / 18); g.fillText(txt, d * 0.7, d); }
  const gr = g.createLinearGradient(0, -size / 2, 0, size / 2);
  gr.addColorStop(0, '#fff3a8'); gr.addColorStop(0.45, C.yellow); gr.addColorStop(1, '#ff9f0a');
  g.shadowColor = 'rgba(255,190,40,0.8)'; g.shadowBlur = 50; g.fillStyle = gr; g.fillText(txt, 0, 0);
  g.shadowBlur = 0; g.lineWidth = 4; g.strokeStyle = 'rgba(90,40,0,0.6)'; g.strokeText(txt, 0, 0);
  g.restore();
}
function ringGauge(g, t, t0, dur, pct, x, y, r, col = C.green) {
  const k = eOut((t - t0) / dur) * pct;
  g.save(); g.lineCap = 'round';
  g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 26; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
  g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 30;
  g.beginPath(); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); g.stroke(); g.restore();
  g.save(); g.font = `800 ${r * 0.62}px ${FONT}`; g.fillStyle = C.white; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 20; g.fillText(Math.round(k * 100) + '%', x, y + 4); g.restore();
}
function typeText(t, t0, full, cps = 16) { return full.slice(0, Math.max(0, Math.floor((t - t0) * cps))); }
function cursorHand(g, x, y, press) {
  g.save(); g.translate(x, y); g.scale(1 - press * 0.12, 1 - press * 0.12);
  g.fillStyle = '#fff'; g.strokeStyle = '#111'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 64); g.lineTo(16, 50); g.lineTo(28, 76); g.lineTo(40, 70); g.lineTo(28, 45); g.lineTo(48, 44); g.closePath();
  g.fill(); g.stroke(); g.restore();
}

// ---------- finishing: vignette, caption scrim, grain ----------
let GRAIN = [];
function makeGrain() {
  const r = rng(7);
  for (let n = 0; n < 4; n++) {
    const c = document.createElement('canvas'); c.width = 540; c.height = 960;
    const x = c.getContext('2d'), im = x.createImageData(540, 960);
    for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    x.putImageData(im, 0, 0); GRAIN.push(c);
  }
}
function drawScrim(g) {
  const s = g.createLinearGradient(0, 0, 0, H * 0.4);
  s.addColorStop(0, 'rgba(4,5,14,0.92)'); s.addColorStop(0.55, 'rgba(4,5,14,0.55)'); s.addColorStop(1, 'rgba(4,5,14,0)');
  g.fillStyle = s; g.fillRect(0, 0, W, H * 0.4);
}
function drawFinish(g, i) {
  const v = g.createRadialGradient(W / 2, H * 0.52, H * 0.25, W / 2, H * 0.52, H * 0.78);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.05; g.globalCompositeOperation = 'overlay';
  g.drawImage(GRAIN[i % GRAIN.length], 0, 0, W, H); g.restore();
}

// ---------- main loop ----------
let SCENE = () => {};           // story sets this: (g, t) => draws world objects + UI
let SHAKES = [];                // [{t, amp, dur}]
function render(i) {
  const t = i / FPS, cv = document.getElementById('cv'), g = cv.getContext('2d');
  CAM = camAt(t);
  SHAKE = { x: 0, y: 0 };
  for (const s of SHAKES) {
    const k = (t - s.t) / s.dur;
    if (k >= 0 && k < 1) { const a = s.amp * (1 - k); SHAKE.x += Math.sin(t * 91) * a; SHAKE.y += Math.cos(t * 77) * a; }
  }
  g.save(); g.clearRect(0, 0, W, H);
  if (window.BG3D) g.drawImage(window.BG3D(t), 0, 0, W, H);
  else { drawWorld(g, t); SCENE.world && SCENE.world(g, t); }
  if (CFG.captions) drawScrim(g);
  SCENE.ui && SCENE.ui(g, t);
  if (CFG.captions) drawCaption(g, t);
  drawHUD(g, t);
  drawFinish(g, i);
  g.restore();
  return cv;
}
window.frame = i => render(i).toDataURL('image/jpeg', 0.92);
window.still = arg => {
  const ts = String(arg || '1').split(',').map(Number);
  if (ts.length === 1) return render(Math.round(ts[0] * FPS)).toDataURL('image/png');
  return ts.map(s => ['still_' + String(s).replace('.', '_') + '.png', render(Math.round(s * FPS)).toDataURL('image/png')]);
};
async function boot() {
  await Promise.all([
    new FontFace('PJS', 'url(fonts/plus-jakarta-sans-latin-800-normal.woff2)', { weight: '800' }).load(),
    new FontFace('PJS', 'url(fonts/plus-jakarta-sans-latin-700-normal.woff2)', { weight: '600 700' }).load(),
    new FontFace('PJS', 'url(fonts/plus-jakarta-sans-latin-500-normal.woff2)', { weight: '500' }).load(),
    new FontFace('Anek', 'url(fonts/anek.woff2)', { weight: '100 800' }).load(),
  ].map(p => p.then(f => document.fonts.add(f))));
  makeGrain();
  window.ready = true;
}
