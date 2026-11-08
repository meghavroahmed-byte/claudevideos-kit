// ===== 16:9 beat engine (map-mix) =====
const FPS = 30; let DUR = 508.56, NF = Math.round(DUR * FPS);
let SENT = []; let CUR_FROM = -1; const ANC = {};
// anchor time of a phrase (searches transcript segments; first match at/after current beat start)
function T(str) { const key = str + '|' + CUR_FROM.toFixed(1); if (ANC[key] != null) return ANC[key]; let first = null; for (const s of SENT) { let k = -1; while ((k = s.text.indexOf(str, k + 1)) >= 0) { const tt = s.s + (s.e - s.s) * k / Math.max(1, s.text.length); if (first == null) first = tt; if (tt >= CUR_FROM - 0.6) return ANC[key] = tt; } } if (first == null) console.log('MISSING ANCHOR: ' + str); return ANC[key] = first == null ? CUR_FROM : first; }
window.POPS = new Set(); window.BOOMS = new Set(); window.TICKS = new Set(); window.RISERS = new Set();
const TICK = (t, a) => { TICKS.add(+a.toFixed(2)); }; const RISE = a => { RISERS.add(+a.toFixed(2)); return a; };
const P = (t, str, d = 0.35, off = 0) => { const a = (typeof str === 'number' ? str : T(str)) + off; POPS.add(+a.toFixed(2)); return easeOutBack(seg(t, a, a + d)); };
const S = (t, str, d = 0.6, off = 0) => { const a = (typeof str === 'number' ? str : T(str)) + off; return ease(seg(t, a, a + d)); };
const BOOM = (t, str, off = 0) => { const a = (typeof str === 'number' ? str : T(str)) + off; BOOMS.add(+a.toFixed(2)); return a; };
function mouthAt(t) { const i = Math.round(t * FPS); if (i < 0 || i >= ENV.length) return 0; const v = j => ENV[Math.max(0, Math.min(ENV.length - 1, j))]; const db = (v(i - 1) + 2 * v(i) + v(i + 1)) / 4; return clamp((db + 40) / 22) * (0.65 + 0.35 * Math.abs(Math.sin(t * 17))); }
let CL, CG, WC, WG;
function lit(g, tint, fn) { CG.setTransform(1, 0, 0, 1, 0, 0); CG.clearRect(0, 0, W, H); fn(CG); if (tint) { CG.globalCompositeOperation = 'source-atop'; CG.fillStyle = tint; CG.fillRect(0, 0, W, H); CG.globalCompositeOperation = 'source-over'; } g.drawImage(CL, 0, 0); }
// the user's own character (cut-out rig), lip-synced to the voice
function hero(g, t, x, o = {}) { const m = o.mute ? 0 : mouthAt(t); lit(g, o.tint, c => { shadow(c, x, o.gy || 1000, 105, 0.3); drawFront(c, x, o.gy || 1000, o.s || 0.82, Object.assign({ t, mouth: m }, o)); }); }
// world-space scene drawn into a clipped window
function worldIn(g, fn, cam, clip, t) {
  WG.setTransform(1, 0, 0, 1, 0, 0); WG.globalAlpha = 1; WG.globalCompositeOperation = 'source-over'; WG.filter = 'none'; WG.clearRect(0, 0, W, H); fn(WG);
  const lt = clip.k != null ? clip.k : 1; if (lt <= 0) return; const e = easeOutBack(clamp(lt));
  g.save(); const ccx = clip.r ? clip.x : clip.x + clip.w / 2, ccy = clip.r ? clip.y : clip.y + clip.h / 2; g.translate(ccx, ccy); g.scale(e, e); g.translate(-ccx, -ccy);
  g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 40; g.fillStyle = '#000'; g.beginPath(); if (clip.r) g.arc(clip.x, clip.y, clip.r, 0, 7); else g.roundRect(clip.x, clip.y, clip.w, clip.h, clip.rad || 28); g.fill(); g.restore();
  g.save(); g.beginPath(); if (clip.r) g.arc(clip.x, clip.y, clip.r, 0, 7); else g.roundRect(clip.x, clip.y, clip.w, clip.h, clip.rad || 28); g.clip();
  const cw = clip.r ? clip.r * 2 : clip.w, ch = clip.r ? clip.r * 2 : clip.h;
  const Z = Math.max(cw / 1920, ch / 1080) * (cam.z || 1); g.translate(ccx, ccy); g.scale(Z, Z); g.translate(-cam.fx, -cam.fy); g.drawImage(WC, 0, 0); g.restore();
  g.save(); g.strokeStyle = clip.col || 'rgba(143,227,255,0.8)'; g.lineWidth = 5; g.shadowColor = clip.col || CC.ice; g.shadowBlur = 22; g.beginPath(); if (clip.r) g.arc(clip.x, clip.y, clip.r, 0, 7); else g.roundRect(clip.x, clip.y, clip.w, clip.h, clip.rad || 28); g.stroke(); g.restore();
  g.restore();
}
// ---------- beats ----------
const B = []; const beat = (from, o) => B.push(Object.assign({ from }, o));
let OUTP, OG, PREVP, PG2, FINP, FG;
function prep() {
  let prevT = 0; B.forEach(b => { if (typeof b.from === 'number') b.t0 = b.from; else { CUR_FROM = prevT; b.t0 = T(b.from) - 0.1; } prevT = b.t0 + 0.1; }); CUR_FROM = -1; B.sort((a, b) => a.t0 - b.t0);
  B.forEach((b, i) => b.t1 = i < B.length - 1 ? B[i + 1].t0 : DUR); window.CUTS = B.slice(1).map(b => +b.t0.toFixed(2)); window.B = B;
}
function drawBeat(g, bi, t) {
  const b = B[bi], d = t - b.t0, len = Math.max(0.5, b.t1 - b.t0); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.clearRect(0, 0, W, H);
  CURB = bi; HUDON = false; CUR_FROM = b.t0; NOW = t;
  const u = 1 - Math.pow(1 - clamp(d / Math.min(len, 6)), 2), z = b.noZoom ? 1 : 1.0 + 0.03 * u;
  g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
  b.d(g, t, b, d, len); g.restore(); CUR_FROM = -1;
}
function finish(dst, src, b, t) {
  dst.setTransform(1, 0, 0, 1, 0, 0); dst.globalAlpha = 1; dst.globalCompositeOperation = 'source-over'; dst.filter = 'contrast(1.05) saturate(1.08)'; dst.drawImage(src, 0, 0); dst.filter = 'none';
  { const [sc, sx] = tmpC('BLOOM'); if (sc.width !== 480) { sc.width = 480; sc.height = 270; } sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalCompositeOperation = 'copy'; sx.filter = 'blur(5px) brightness(1.25)'; sx.drawImage(src, 0, 0, 480, 270); sx.filter = 'none'; sx.globalCompositeOperation = 'source-over';
    dst.globalCompositeOperation = 'screen'; dst.globalAlpha = b.map ? 0.10 : 0.16; dst.drawImage(sc, 0, 0, W, H); dst.globalCompositeOperation = 'source-over'; dst.globalAlpha = 1; }
  // warm/cool split tone
  dst.globalCompositeOperation = 'soft-light'; dst.globalAlpha = 0.22; const sg = dst.createLinearGradient(0, H, W, 0); sg.addColorStop(0, b.map ? '#1a2a2a' : '#0a1a2a'); sg.addColorStop(1, '#ffd9a0'); dst.fillStyle = sg; dst.fillRect(0, 0, W, H); dst.globalCompositeOperation = 'source-over'; dst.globalAlpha = 1;
  const v = dst.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, W * 0.68); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)'); dst.fillStyle = v; dst.fillRect(0, 0, W, H);
  dst.globalCompositeOperation = 'overlay'; dst.globalAlpha = 0.07; const ox = Math.floor(hash(Math.floor(t * 24)) * 512), oy = Math.floor(hash(Math.floor(t * 24) + 7) * 512); dst.save(); dst.translate(-ox, -oy); dst.fillStyle = dst.createPattern(GRAIN, 'repeat'); dst.fillRect(ox, oy, W, H); dst.restore(); dst.globalCompositeOperation = 'source-over'; dst.globalAlpha = 1;
}
function render(i) {
  const t = i / FPS; NOW = t; let bi = B.findIndex(b => t >= b.t0 && t < b.t1); if (bi < 0) bi = B.length - 1; const b = B[bi], d = t - b.t0;
  drawBeat(OG, bi, t);
  const TRD = { dissolve: 0.4, zoom: 0.38, circle: 0.45, bars: 0.42, ink: 0.5, swipe: 0.4 }[b.tr] || 0;
  if (bi > 0 && d < TRD) {
    drawBeat(PG2, bi - 1, t); CURB = bi; NOW = t; const p = ease(d / TRD);
    const [c, x] = tmpC('NEWP'); if (c.width !== W) { c.width = W; c.height = H; } x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); x.drawImage(OUTP, 0, 0);
    OG.save(); OG.setTransform(1, 0, 0, 1, 0, 0); OG.clearRect(0, 0, W, H);
    if (b.tr === 'dissolve') { OG.drawImage(PREVP, 0, 0); OG.globalAlpha = p; OG.drawImage(c, 0, 0); }
    else if (b.tr === 'zoom') { OG.drawImage(c, 0, 0); OG.globalAlpha = 1 - p; const s = 1 + p * 0.45; OG.translate(W / 2, H / 2); OG.scale(s, s); OG.translate(-W / 2, -H / 2); OG.filter = `blur(${p * 12}px)`; OG.drawImage(PREVP, 0, 0); }
    else if (b.tr === 'circle') { OG.drawImage(PREVP, 0, 0); const cx = b.cx || W / 2, cy = b.cy || H / 2, r = p * 1250; OG.save(); OG.beginPath(); OG.arc(cx, cy, r, 0, 7); OG.clip(); OG.drawImage(c, 0, 0); OG.restore(); OG.strokeStyle = 'rgba(255,240,200,0.95)'; OG.lineWidth = 12 * (1 - p); OG.shadowColor = CC.ember2; OG.shadowBlur = 30; OG.beginPath(); OG.arc(cx, cy, r, 0, 7); OG.stroke(); }
    else if (b.tr === 'bars') { OG.drawImage(PREVP, 0, 0); for (let k = 0; k < 9; k++) { const pk = ease(clamp((d / TRD) * 1.6 - k * 0.07)); OG.save(); OG.beginPath(); const bw = W / 9 + 4, x0 = k * W / 9; OG.rect(x0, H - pk * H, bw, pk * H); OG.clip(); OG.drawImage(c, 0, 0); OG.restore(); OG.fillStyle = CC.ember2; OG.fillRect(x0, H - pk * H - 8, bw, pk > 0 && pk < 1 ? 8 : 0); } }
    else if (b.tr === 'ink') { OG.drawImage(PREVP, 0, 0); OG.save(); OG.beginPath(); const cx = b.cx || W / 2, cy = b.cy || H / 2; for (let a = 0; a <= 64; a++) { const an = a / 64 * PI2, rr2 = p * 1300 * (1 + 0.12 * Math.sin(an * 7 + 1) + 0.08 * Math.sin(an * 13)); const px = cx + Math.cos(an) * rr2, py = cy + Math.sin(an) * rr2; a ? OG.lineTo(px, py) : OG.moveTo(px, py); } OG.closePath(); OG.clip(); OG.drawImage(c, 0, 0); OG.restore(); }
    else if (b.tr === 'swipe') { OG.drawImage(PREVP, 0, 0); const xx = lerp(-300, W + 300, p); OG.save(); OG.beginPath(); OG.moveTo(-300, 0); OG.lineTo(xx + 200, 0); OG.lineTo(xx - 200, H); OG.lineTo(-300, H); OG.closePath(); OG.clip(); OG.drawImage(c, 0, 0); OG.restore(); OG.strokeStyle = CC.ember2; OG.lineWidth = 10; OG.shadowColor = CC.ember2; OG.shadowBlur = 24; OG.beginPath(); OG.moveTo(xx + 200, 0); OG.lineTo(xx - 200, H); OG.stroke(); }
    OG.restore();
  }
  if (bi > 0 && b.tr === 'whip' && d < 0.28) { const w = 1 - easeOut(d / 0.28), dir = bi % 2 ? 1 : -1; const [c, x] = tmpC('WHP'); if (c.width !== W) { c.width = W; c.height = H; } x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); x.drawImage(OUTP, 0, 0); OG.save(); OG.setTransform(1, 0, 0, 1, 0, 0); OG.clearRect(0, 0, W, H); OG.filter = `blur(${w * 26}px)`; OG.translate(W / 2 + dir * w * 240, H / 2); OG.scale(1 + w * 0.12, 1 + w * 0.12); OG.drawImage(c, -W / 2, -H / 2); OG.restore(); }
  if (bi > 0 && b.tr === 'glitch' && d < 0.22) { const [c, x] = tmpC('GLP'); if (c.width !== W) { c.width = W; c.height = H; } x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); x.drawImage(OUTP, 0, 0); OG.save(); OG.setTransform(1, 0, 0, 1, 0, 0); for (let s = 0; s < 14; s++) { const y0 = hash(s + Math.floor(t * 60)) * H, h = 20 + hash(s + 2) * 110, off = (hash(s + 5 + Math.floor(t * 60)) - 0.5) * 220 * (1 - d / 0.22); OG.drawImage(c, 0, y0, W, h, off, y0, W, h); } OG.globalCompositeOperation = 'screen'; OG.globalAlpha = 0.5 * (1 - d / 0.22); OG.fillStyle = '#ff2a6a'; OG.fillRect(0, hash(Math.floor(t * 60)) * H, W, 6); OG.restore(); }
  finish(FG, OUTP, b, t);
  if (bi > 0 && b.tr === 'flash' && d < 0.2) { FG.fillStyle = `rgba(255,248,235,${0.85 * (1 - d / 0.2)})`; FG.fillRect(0, 0, W, H); }
  // progress bar
  FG.fillStyle = 'rgba(255,255,255,0.12)'; FG.fillRect(0, H - 6, W, 6); const pg = FG.createLinearGradient(0, 0, W, 0); pg.addColorStop(0, CC.ice); pg.addColorStop(1, CC.ember2); FG.fillStyle = pg; FG.fillRect(0, H - 6, W * clamp(t / DUR), 6);
  const fi = seg(t, 0, 0.25); if (fi < 1) { FG.fillStyle = `rgba(0,0,0,${1 - fi})`; FG.fillRect(0, 0, W, H); }
  const fade = seg(t, DUR - 0.6, DUR); if (fade > 0) { FG.fillStyle = `rgba(0,0,0,${fade})`; FG.fillRect(0, 0, W, H); }
}
async function bootEngine() {
  await new Promise(r => document.readyState === 'complete' ? r() : addEventListener('load', r));
  const TL = await (await fetch('../temp/timeline.json')).json(); DUR = TL.dur; NF = Math.round(DUR * FPS); SENT = TL.segs.map(s => ({ s: s.s, e: s.e, text: s.text }));
  await buildVMap(); const S0 = await prepareSheet(); buildRig(S0); buildPost(); if (window.extraBuild) await window.extraBuild();
  CL = mk(W, H); CG = CL.getContext('2d'); WC = mk(W, H); WG = WC.getContext('2d');
  OUTP = mk(W, H); OG = OUTP.getContext('2d'); PREVP = mk(W, H); PG2 = PREVP.getContext('2d'); FINP = mk(W, H); FG = FINP.getContext('2d');
  prep(); await document.fonts.load('800 40px "Anek Bangla"'); await document.fonts.load('600 40px "Hind Siliguri"');
  window.frame = i => { render(i); return FINP.toDataURL('image/jpeg', 0.9); };
  window.prof = ts => ts.map(t => { const i = Math.round(t * FPS); let bi = B.findIndex(b => t >= b.t0 && t < b.t1); const a = performance.now(); drawBeat(OG, bi, t); const b1 = performance.now(); finish(FG, OUTP, B[bi], t); const c = performance.now(); FINP.toDataURL('image/jpeg', 0.9); const e = performance.now(); return [t, Math.round(b1 - a), Math.round(c - b1), Math.round(e - c)]; });
  window.check = (step, from = 0, to = DUR) => { const errs = []; for (let t = from; t < Math.min(to, DUR); t += step) { try { render(Math.round(t * FPS)); } catch (e) { errs.push(t.toFixed(1) + ': ' + e.message); } } return errs; };
  window.still = arg => { if (arg && arg.startsWith('check:')) { const [st, fr, tt] = arg.slice(6).split(':').map(Number); const r = window.check(st, fr || 0, tt || DUR); console.log('CHECK ' + r.length + ' errors'); r.slice(0, 40).forEach(x => console.log('E ' + x)); return 'data:,'; } if (arg && arg.startsWith('prof:')) { const r = window.prof(arg.slice(5).split(',').map(Number)); console.log(JSON.stringify(r)); return 'data:,'; } if (arg === 'beats') return [['beats.json', 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(B.map(b => [String(b.from), +b.t0.toFixed(2), +b.t1.toFixed(2)])))))]]; return arg.split(',').map(Number).map(t => { try { render(Math.round(t * FPS)); } catch (e) { console.log('ERR at ' + t + ': ' + e.message + ' | ' + (e.stack || '').split('\n')[1]); } return [`s_${t}.jpg`, FINP.toDataURL('image/jpeg', 0.75)]; }); };
  window.ready = true;
}
