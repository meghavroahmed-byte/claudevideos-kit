// ================= 9:16 satellite map engine =================
const FPS = 30; let DUR = 70, NF = 2100, TL = null, SENT = [], CUR_FROM = -1; const ANC = {};
const MERC = 'file:///D:/ClaudeVideos/cache/maps/merc/';
function T(str) { const key = str + '|' + CUR_FROM.toFixed(1); if (ANC[key] != null) return ANC[key]; let first = null; for (const s of SENT) { let k = -1; while ((k = s.text.indexOf(str, k + 1)) >= 0) { const tt = s.ct ? s.ct[k] : s.s + (s.e - s.s) * k / s.text.length; if (first == null) first = tt; if (tt >= CUR_FROM - 0.6) return ANC[key] = tt; } } if (first == null) console.log('MISSING ANCHOR: ' + str); return ANC[key] = first || 0; }
window.POPS = new Set();
const at = (t, a, d = 0.5, off = 0) => { const s = (typeof a === 'number' ? a : T(a)) + off; POPS.add(+s.toFixed(2)); return clamp((t - s) / d); };
function mouthAt(t) { const i = Math.round(t * FPS); if (i < 0 || i >= ENV.length) return 0; const v = j => ENV[Math.max(0, Math.min(ENV.length - 1, j))]; const db = (v(i - 1) + 2 * v(i) + v(i + 1)) / 4; return clamp((db + 44) / 22) * (0.7 + 0.3 * Math.abs(Math.sin(t * 17))); }

// ---------- projection ----------
const D2 = Math.PI / 180;
const mxN = lon => (lon + 180) / 360;
const myN = lat => { const s = Math.sin(Math.max(-85, Math.min(85, lat)) * D2); return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI); };
let CAM = { lon: 0, lat: 0, z: 2000, rot: 0 };
let CX = 540, CY = 900, GW = 1080, GH = 1920;
function P(lon, lat) { return PN(mxN(lon), myN(lat)); }
function PN(nx, ny) { let x = (nx - mxN(CAM.lon)) * CAM.z, y = (ny - myN(CAM.lat)) * CAM.z; if (CAM.rot) { const c = Math.cos(CAM.rot), s = Math.sin(CAM.rot); [x, y] = [x * c - y * s, x * s + y * c]; } return [CX + x, CY + y]; }
// km per screen px at camera latitude
const kmPerPx = () => 40075 * Math.cos(CAM.lat * D2) / CAM.z;

// ---------- basemap ----------
const TILES = {}; let L0 = null;
const loadImg2 = u => new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => j(u); i.src = u; });
async function needTile(k) { if (!TILES[k]) TILES[k] = await loadImg2(MERC + 'L1_' + k + '.jpg'); if (TILES[k].decode) await TILES[k].decode().catch(() => { }); return TILES[k]; }
function tilesFor(cam) { const save = CAM; CAM = cam; const o = []; if (cam.z > 5000) { const corners = [[-60, -60], [GW + 60, -60], [-60, GH + 60], [GW + 60, GH + 60]].map(([x, y]) => unP(x, y)); const xs = corners.map(c => c[0]), ys = corners.map(c => c[1]); for (let tx = Math.floor(Math.min(...xs) * 6); tx <= Math.floor(Math.max(...xs) * 6); tx++) for (let ty = Math.max(0, Math.floor(Math.min(...ys) * 6)); ty <= Math.min(5, Math.floor(Math.max(...ys) * 6)); ty++) o.push(((tx % 6) + 6) % 6 + '_' + ty); } CAM = save; return o; }
function unP(x, y) { let dx = x - CX, dy = y - CY; if (CAM.rot) { const c = Math.cos(-CAM.rot), s = Math.sin(-CAM.rot); [dx, dy] = [dx * c - dy * s, dx * s + dy * c]; } return [mxN(CAM.lon) + dx / CAM.z, myN(CAM.lat) + dy / CAM.z]; }
function drawBase(g) {
  g.save(); g.fillStyle = '#103462'; g.fillRect(0, 0, GW, GH);
  const [ox, oy] = PN(0, 0); g.translate(CX, CY); g.rotate(CAM.rot || 0); g.translate(-CX, -CY);
  const ox0 = CX - mxN(CAM.lon) * CAM.z, oy0 = CY - myN(CAM.lat) * CAM.z; void ox; void oy;
  if (CAM.z <= 5000 || !Object.keys(TILES).length) { for (const k of [-1, 0, 1]) g.drawImage(L0, ox0 + k * CAM.z, oy0, CAM.z, CAM.z); }
  else { const ts = CAM.z / 6; for (const k of tilesFor(CAM)) { const [tx, ty] = k.split('_').map(Number); const im = TILES[k]; if (!im) continue; for (const w of [-1, 0, 1]) { const x = ox0 + (tx + w * 6) * ts, y = oy0 + ty * ts; if (x > GW + 200 || x + ts < -200) continue; g.drawImage(im, x, y, ts + 1, ts + 1); } } }
  g.restore();
}

// ---------- countries ----------
let FEAT = {}, FEATS = [];
function prepFeatures(fc) { for (const f of fc.features) { const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : []; const rings = []; for (const poly of polys) for (const ring of poly) rings.push(ring.map(([lo, la]) => [mxN(lo), myN(la)])); const it = { name: f.properties.name, rings }; FEAT[f.properties.name] = it; FEATS.push(it); } }
function cPath(g, name, xf) { const f = FEAT[name]; if (!f) { console.log('NO COUNTRY ' + name); return; } g.beginPath(); for (const r of f.rings) { r.forEach(([nx, ny], i) => { let [x, y] = PN(nx, ny); if (xf) [x, y] = xf(x, y); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); } }
// glowing fill (reference: bold red country)
function fillC(g, name, col, k, o = {}) { if (k <= 0) return; g.save(); cPath(g, name, o.xf); g.globalAlpha = (o.a != null ? o.a : 0.82) * k; g.shadowColor = col; g.shadowBlur = o.blur != null ? o.blur : 30; g.fillStyle = col; g.fill(); g.globalAlpha = k; g.shadowBlur = 0; if (o.stroke !== false) { g.strokeStyle = o.sc || 'rgba(255,255,255,0.9)'; g.lineWidth = o.lw || 3; g.lineJoin = 'round'; g.stroke(); } g.restore(); }
function borderAll(g, a) { if (a <= 0) return; g.save(); g.strokeStyle = `rgba(255,255,255,${0.35 * a})`; g.lineWidth = 1.5; for (const f of FEATS) { cPath(g, f.name); g.stroke(); } g.restore(); }
function politicalAll(g, k, pal) { if (k <= 0) return; g.save(); FEATS.forEach((f, i) => { cPath(g, f.name); g.globalAlpha = 0.9 * k; g.fillStyle = pal ? pal(f.name, i) : POLPAL[i % POLPAL.length]; g.fill(); g.globalAlpha = k; g.strokeStyle = 'rgba(40,20,10,0.8)'; g.lineWidth = 2; g.stroke(); }); g.restore(); }
const POLPAL = ['#e9c46a', '#f4a261', '#e76f51', '#8ab17d', '#2a9d8f', '#d4a5a5', '#9c89b8', '#f2cc8f', '#81b29a', '#e07a5f', '#c9ada7', '#b5838d'];
function centroidN(name) { const f = FEAT[name]; let best = null, ba = -1; for (const r of f.rings) { let x0 = 9, x1 = -9, y0 = 9, y1 = -9; for (const [x, y] of r) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } const a = (x1 - x0) * (y1 - y0); if (x1 - x0 < 0.5 && a > ba) { ba = a; best = [(x0 + x1) / 2, (y0 + y1) / 2]; } } return best; }
// draw a country shape moved so its centroid sits on screen point (sx,sy), same scale as current map
function shapeAt(g, name, sx, sy, col, k, o = {}) { const [cx, cy] = centroidN(name); const [px, py] = PN(cx, cy); fillC(g, name, col, k, Object.assign({ xf: (x, y) => { let dx = x - px, dy = y - py; if (o.rot) { const c = Math.cos(o.rot), s = Math.sin(o.rot); [dx, dy] = [dx * c - dy * s, dx * s + dy * c]; } return [sx + dx * (o.s || 1), sy + dy * (o.s || 1)]; } }, o)); }

// ---------- annotation toolkit (reference look) ----------
function label(g, s, x, y, size, k, o = {}) {
  if (k <= 0 || !s) return; const e = easeOutBack(clamp(k)); g.save(); g.translate(x, y); g.rotate(o.rot || 0); g.scale(e, e);
  g.font = `${o.it ? 'italic ' : ''}${o.w || 800} ${size}px ${o.font || '"Anek", "Nirmala UI"'}`; g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.globalAlpha = clamp(k * 3); g.strokeStyle = o.sc || 'rgba(0,0,0,0.85)'; g.lineWidth = size * 0.16; g.strokeText(s, 0, 0); g.fillStyle = o.col || '#ffffff'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 12; g.fillText(s, 0, 0); g.restore();
}
function curvePts(x0, y0, x1, y1, bend) { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0; const cx = mx - dy * bend, cy = my + dx * bend; const o = []; for (let i = 0; i <= 40; i++) { const u = i / 40, v = 1 - u; o.push([v * v * x0 + 2 * v * u * cx + u * u * x1, v * v * y0 + 2 * v * u * cy + u * u * y1]); } return o; }
function arrow(g, x0, y0, x1, y1, k, o = {}) {
  if (k <= 0) return; const pts = curvePts(x0, y0, x1, y1, o.bend != null ? o.bend : 0.18), n = Math.max(2, Math.round(pts.length * clamp(k))); const col = o.col || '#ffffff', lw = o.lw || 14;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; for (const [c, w] of [['rgba(0,0,0,0.45)', lw + 8], [col, lw]]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); for (let i = 0; i < n; i++) i ? g.lineTo(...pts[i]) : g.moveTo(...pts[i]); g.stroke(); }
  if (k >= 0.98) { const [ax, ay] = pts[pts.length - 1], [bx, by] = pts[pts.length - 4], a = Math.atan2(ay - by, ax - bx), L = lw * 3.2; for (const [c, w] of [['rgba(0,0,0,0.45)', lw + 8], [col, lw]]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(ax - Math.cos(a - 0.55) * L, ay - Math.sin(a - 0.55) * L); g.lineTo(ax, ay); g.lineTo(ax - Math.cos(a + 0.55) * L, ay - Math.sin(a + 0.55) * L); g.stroke(); } }
  g.restore();
}
function measure(g, x0, y0, x1, y1, txt, k, o = {}) {
  if (k <= 0) return; const col = o.col || '#ffe14a', e = clamp(k * 1.4), xa = lerp((x0 + x1) / 2, x0, e), ya = lerp((y0 + y1) / 2, y0, e), xb = lerp((x0 + x1) / 2, x1, e), yb = lerp((y0 + y1) / 2, y1, e), a = Math.atan2(y1 - y0, x1 - x0);
  g.save(); g.lineCap = 'round'; for (const [c, w] of [['rgba(0,0,0,0.5)', 11], [col, 6]]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(xa, ya); g.lineTo(xb, yb); for (const [px, py] of [[xa, ya], [xb, yb]]) { g.moveTo(px - Math.sin(a) * 22, py + Math.cos(a) * 22); g.lineTo(px + Math.sin(a) * 22, py - Math.cos(a) * 22); } g.stroke(); } g.restore();
  let ra = a; if (ra > Math.PI / 2) ra -= Math.PI; if (ra < -Math.PI / 2) ra += Math.PI;
  label(g, txt, (x0 + x1) / 2 - Math.sin(ra) * (o.off || 46), (y0 + y1) / 2 + Math.cos(ra) * -(o.off || 46), o.size || 60, clamp(k * 2 - 0.6), { col, rot: ra, it: true });
}
function cityDot(g, x, y, s, k, o = {}) { if (k <= 0) return; const e = easeOutBack(k); g.save(); g.fillStyle = o.col || '#ff3b4a'; g.strokeStyle = '#fff'; g.lineWidth = 5; g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 10; g.beginPath(); g.arc(x, y, 13 * e, 0, 7); g.fill(); g.stroke(); g.restore(); label(g, s, x + (o.dx != null ? o.dx : 0), y + (o.dy != null ? o.dy : -48), o.size || 50, k, { col: o.lc }); }
// parchment look over the current base
let PAPER = null;
function makePaper() { const c = mk(PW, PH), g = c.getContext('2d'); g.fillStyle = '#d9c39a'; g.fillRect(0, 0, PW, PH); const id = g.getImageData(0, 0, PW, PH), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 26; d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.8; } g.putImageData(id, 0, 0); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(120,80,40,${0.04 + Math.random() * 0.06})`; g.beginPath(); g.ellipse(Math.random() * PW, Math.random() * PH, 60 + Math.random() * 260, 40 + Math.random() * 200, Math.random() * 3, 0, 7); g.fill(); } const v = g.createRadialGradient(PW / 2, PH / 2, PH * 0.25, PW / 2, PH / 2, PH * 0.75); v.addColorStop(0, 'rgba(90,50,20,0)'); v.addColorStop(1, 'rgba(90,50,20,0.55)'); g.fillStyle = v; g.fillRect(0, 0, PW, PH); return c; }
function parchment(g, k) { if (k <= 0) return; const [c, x] = tmpC2('PARCH'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.filter = 'sepia(1) saturate(0.6) contrast(1.05) brightness(1.35)'; x.drawImage(g.canvas, 0, 0); x.filter = 'none'; x.globalCompositeOperation = 'multiply'; x.drawImage(PAPER, 0, 0); x.globalCompositeOperation = 'source-over'; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = k; g.drawImage(c, 0, 0); g.restore(); }
const TMP2 = {}; function tmpC2(k) { if (!TMP2[k]) { const c = mk(PW, PH); TMP2[k] = [c, c.getContext('2d')]; } return TMP2[k]; }
// simple caravel ship
function ship(g, x, y, s, t, k, flip) { if (k <= 0) return; g.save(); g.translate(x, y + Math.sin(t * 3 + x) * 3); g.scale(s * (flip ? -1 : 1) * easeOutBack(k), s * easeOutBack(k)); g.rotate(Math.sin(t * 2.2 + x) * 0.05); g.lineJoin = 'round';
  g.fillStyle = '#6b3f1f'; g.strokeStyle = '#2a160a'; g.lineWidth = 4; g.beginPath(); g.moveTo(-60, -6); g.lineTo(62, -6); g.lineTo(44, 22); g.lineTo(-44, 22); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-6, -6); g.lineTo(-6, -92); g.stroke(); g.beginPath(); g.moveTo(30, -6); g.lineTo(30, -64); g.stroke();
  g.fillStyle = '#f3ead2'; for (const [mx, top, w, h] of [[-6, -88, 34, 70], [30, -60, 24, 46]]) { g.beginPath(); g.moveTo(mx - w, top); g.quadraticCurveTo(mx, top + 8, mx + w, top); g.lineTo(mx + w * 0.9, top + h); g.quadraticCurveTo(mx, top + h + 8, mx - w * 0.9, top + h); g.closePath(); g.fill(); g.stroke(); }
  g.fillStyle = '#c0392b'; g.beginPath(); g.moveTo(-6, -92); g.lineTo(16, -86); g.lineTo(-6, -80); g.fill(); g.restore(); }

// ---------- user's character window ----------
let CL, CG;
function lit(g, tint, fn) { CG.setTransform(1, 0, 0, 1, 0, 0); CG.clearRect(0, 0, CL.width, CL.height); fn(CG); g.drawImage(CL, 0, 0); }
function charWin(g, t, k, o = {}) {
  if (k <= 0) return; const e = easeOutBack(clamp(k)), x = o.x != null ? o.x : 230, y = o.y != null ? o.y : 1560, r = (o.r || 200) * e, m = mouthAt(t);
  g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.closePath(); g.fillStyle = o.bg || '#1d5f8a'; g.fill(); g.clip();
  const gr = g.createRadialGradient(x, y - r * 0.3, 10, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0.25)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  const up = o.point ? 0.55 + 0.45 * Math.max(0, Math.sin(t * 1.4)) : 0;
  g.translate(x, y); g.scale(r / 200, r / 200); g.translate(-x, -y);
  if (o.think) { lit(g, null, c => drawChinta(c, x + 20, y + 40, 0.95, { t, mouth: m })); }
  else lit(g, null, c => drawFront(c, x, y + 640, 0.92, { t, mouth: m, up, upAng: 55, loAng: 95, wave: o.wave ? Math.sin(t * 6) * 14 : 0 }));
  g.restore();
  g.save(); g.strokeStyle = '#fff'; g.lineWidth = 9; g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 18; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); g.restore();
}

