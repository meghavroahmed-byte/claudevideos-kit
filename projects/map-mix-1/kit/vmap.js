// ===== Vintage atlas map (parchment + teal sea) built from world-atlas countries-50m =====
// World units: x = lon (deg), y = -mercator(lat) in degrees. Camera {lon, lat, z (px per degree), rot}
const VM = { ready: false, countries: [], byName: {}, paper: null, sea: null, land: null };
const mercY = lat => { const r = Math.max(-85, Math.min(85, lat)) * Math.PI / 180; return -Math.log(Math.tan(Math.PI / 4 + r / 2)) * 180 / Math.PI; };
async function buildVMap() {
  for (const res of ['50m', '110m']) { const set = { countries: [], byName: {} }; VM[res] = set;
  const topo = await (await fetch('../node_modules/world-atlas/countries-' + res + '.json')).json();
  const fc = topojson.feature(topo, topo.objects.countries);
  for (const f of fc.features) {
    if (f.properties.name === 'Antarctica') continue;
    const p = new Path2D(); let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, cxs = 0, cys = 0, area = 0;
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [];
    let bigA = 0, bigC = [0, 0];
    for (const poly of polys) for (let ri = 0; ri < poly.length; ri++) {
      const ring0 = poly[ri]; let a = 0, sx = 0, sy = 0; let off = 0; const ring = ring0.map(([lon, lat], i) => { if (i) { const d = lon + off - (ring0[i - 1][0] + 0); if (lon - ring0[i - 1][0] > 180) off -= 360; else if (lon - ring0[i - 1][0] < -180) off += 360; } return [lon + off, lat]; });
      ring.forEach(([lon, lat], i) => { const x = lon, y = mercY(lat); if (i) p.lineTo(x, y); else p.moveTo(x, y); minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); if (i) { const [lo0, la0] = ring[i - 1]; const x0 = lo0, y0 = mercY(la0); const cr = x0 * y - x * y0; a += cr; sx += (x0 + x) * cr; sy += (y0 + y) * cr; } });
      p.closePath(); if (ri === 0 && Math.abs(a) > bigA) { bigA = Math.abs(a); bigC = [sx / (3 * a), sy / (3 * a)]; }
    }
    const c = { name: f.properties.name, id: f.id, path: p, bb: [minx, miny, maxx, maxy], c: bigC };
    set.countries.push(c); set.byName[c.name] = c;
  } }
  VM.countries = VM['50m'].countries; VM.byName = VM['50m'].byName;
  // paper texture tile
  const P = mk(1024, 1024), pg = P.getContext('2d'); pg.fillStyle = '#808080'; pg.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 9000; i++) { const v = Math.round(110 + hash(i) * 40); pg.fillStyle = `rgba(${v},${v},${v},${0.05 + hash(i + 1) * 0.12})`; const r = 1 + hash(i + 2) * (i < 600 ? 60 : 6); pg.beginPath(); pg.arc(hash(i + 3) * 1024, hash(i + 4) * 1024, r, 0, 7); pg.fill(); }
  for (let i = 0; i < 400; i++) { pg.strokeStyle = `rgba(${hash(i) > 0.5 ? 170 : 90},${hash(i) > 0.5 ? 170 : 90},${hash(i) > 0.5 ? 170 : 90},0.10)`; pg.lineWidth = 1; pg.beginPath(); const x = hash(i + 7) * 1024, y = hash(i + 8) * 1024; pg.moveTo(x, y); pg.lineTo(x + (hash(i + 9) - 0.5) * 120, y + (hash(i + 10) - 0.5) * 30); pg.stroke(); }
  VM.paper = P; VM.ready = true;
}
const VSEA = '#5f9ea0', VLAND = '#e2cf9e';
// main draw. o: {fills:{name:[col,k,originLonLat]}, dim: 0..1 (fade other land), borders:true, labels:[...]}
function vmap(g, cam, t, o = {}) {
  const z = cam.z, cx = cam.lon, cy = mercY(cam.lat), rot = cam.rot || 0;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  // sea
  const sg = g.createRadialGradient(W * 0.5, H * 0.45, 100, W * 0.5, H * 0.5, W * 0.8); sg.addColorStop(0, '#79b4b0'); sg.addColorStop(0.6, '#5c9a99'); sg.addColorStop(1, '#3f7479'); g.fillStyle = sg; g.fillRect(0, 0, W, H);
  // sea texture: wave hatching that moves with camera
  const M = (lon, my) => [W / 2 + (lon - cx) * z, H / 2 + (my - cy) * z];
  const xf = () => { g.translate(W / 2, H / 2); g.rotate(rot); g.scale(z, z); g.translate(-cx, -cy); };
  g.save(); xf();
  const vx0 = cx - W / z * 0.8, vx1 = cx + W / z * 0.8, vy0 = cy - H / z * 0.9, vy1 = cy + H / z * 0.9;
  // graticule
  g.strokeStyle = 'rgba(30,60,64,0.22)'; g.lineWidth = 1.6 / z; g.setLineDash([6 / z, 6 / z]);
  const step = z > 40 ? 5 : z > 12 ? 10 : 30;
  for (let lo = Math.floor(vx0 / step) * step; lo <= vx1; lo += step) { g.beginPath(); g.moveTo(lo, vy0); g.lineTo(lo, vy1); g.stroke(); }
  for (let la = -80; la <= 80; la += step) { const y = mercY(la); if (y < vy0 || y > vy1) continue; g.beginPath(); g.moveTo(vx0, y); g.lineTo(vx1, y); g.stroke(); }
  g.setLineDash([]);
  const SET = z < 14 ? VM['110m'] : VM['50m']; const vis = SET.countries.filter(c => !(c.bb[2] < vx0 || c.bb[0] > vx1 || c.bb[3] < vy0 || c.bb[1] > vy1));
  // shallow-water glow around coasts
  g.strokeStyle = 'rgba(200,232,222,0.45)'; g.lineWidth = 12 / z; g.lineJoin = 'bevel'; for (const c of vis) g.stroke(c.path);
  // land
  g.fillStyle = VLAND; for (const c of vis) g.fill(c.path);
  g.restore();
  // paper texture on land + sea (multiply/overlay in screen space but drifting with camera)
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.55; const pat = g.createPattern(VM.paper, 'repeat'); const ox = ((-cx * z * 0.5) % 1024 + 1024) % 1024, oy = ((-cy * z * 0.5) % 1024 + 1024) % 1024; g.translate(ox - 1024, oy - 1024); g.fillStyle = pat; g.fillRect(0, 0, W + 2048, H + 2048); g.restore();
  g.save(); xf();
  // country fills (animated)
  const fills = o.fills || {};
  for (const name in fills) { const c = SET.byName[name] || VM.byName[name]; if (!c) { console.log('NO COUNTRY ' + name); continue; } const [col, k, org] = fills[name]; if (k <= 0) continue;
    g.save(); g.clip(c.path); const o2 = org ? [org[0], mercY(org[1])] : c.c; const R = Math.hypot(c.bb[2] - c.bb[0], c.bb[3] - c.bb[1]) * easeOut(clamp(k)) * 1.05;
    g.fillStyle = col; g.globalAlpha = 0.82; g.beginPath(); g.arc(o2[0], o2[1], Math.max(0.01, R), 0, 7); g.fill();
    // inner shade for depth
    g.globalAlpha = 0.35; g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 10 / z; g.stroke(c.path); g.restore();
    if (k > 0 && k < 1) { g.save(); g.strokeStyle = 'rgba(255,250,220,0.9)'; g.lineWidth = 3 / z; g.beginPath(); g.arc(o2[0], o2[1], Math.max(0.01, R), 0, 7); g.clip(c.path); g.stroke(); g.restore(); }
  }
  if (o.dim) { g.save(); g.fillStyle = `rgba(40,30,20,${0.35 * o.dim})`; for (const c of vis) if (!fills[c.name]) g.fill(c.path); g.restore(); }
  // borders + coast ink
  g.strokeStyle = 'rgba(70,50,30,0.85)'; g.lineWidth = 1.6 / z; for (const c of vis) g.stroke(c.path);
  for (const name in fills) { const c = SET.byName[name] || VM.byName[name]; if (!c || fills[name][1] < 1) continue; g.save(); g.strokeStyle = fills[name][0]; g.globalAlpha = 0.35; g.lineWidth = 9 / z; g.stroke(c.path); g.globalAlpha = 1; g.lineWidth = 3 / z; g.stroke(c.path); g.restore(); }
  g.restore();
  // hand-drawn relief marks on land (screen-space, seeded by lon/lat grid so they stick to the map)
  if (o.relief !== false && z > 8) { g.save(); g.strokeStyle = 'rgba(110,80,40,0.35)'; g.lineWidth = 2; const gs = z > 30 ? 1.5 : 4; for (let lo = Math.floor(vx0 / gs) * gs; lo < vx1; lo += gs) for (let la = -60; la < 75; la += gs) { const hh = hash(lo * 7.1 + la * 3.3); if (hh > 0.18) continue; const [x, y] = M(lo + hash(lo + la) * gs, mercY(la)); if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue; const d = g.getImageData ? null : null; if (!onLand(lo + hash(lo + la) * gs, la)) continue; g.beginPath(); g.moveTo(x - 9, y + 5); g.lineTo(x, y - 8); g.lineTo(x + 9, y + 5); g.stroke(); } g.restore(); }
  // vignette burnt paper
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.66); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,24,10,0.55)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.restore();
  // projector lon/lat -> screen
  return ([lon, lat]) => { const dx = (lon - cx) * z, dy = (mercY(lat) - cy) * z, c = Math.cos(rot), s = Math.sin(rot); return [W / 2 + dx * c - dy * s, H / 2 + dx * s + dy * c]; };
}
// land test via cached low-res mask
let LMASK = null;
function onLand(lon, lat) {
  if (!LMASK) { const c = mk(720, 400), m = c.getContext('2d'); m.fillStyle = '#000'; m.fillRect(0, 0, 720, 400); m.setTransform(2, 0, 0, 2, 360, 200); m.fillStyle = '#fff'; for (const k of VM.countries) m.fill(k.path); LMASK = { d: m.getImageData(0, 0, 720, 400).data }; }
  const x = Math.round(360 + lon * 2), y = Math.round(200 + mercY(lat) * 2); if (x < 0 || y < 0 || x >= 720 || y >= 400) return false; return LMASK.d[(y * 720 + x) * 4] > 128;
}
// crowd of tiny people scattered over land (projected)
let CROWDPTS = null;
function mapCrowd(g, Pj, k, z, o = {}) {
  if (!CROWDPTS) { CROWDPTS = []; let i = 0; while (CROWDPTS.length < 2200 && i < 60000) { i++; const lon = -170 + hash(i * 1.31) * 330, lat = -45 + hash(i * 2.17 + 5) * 110; const dense = (lon > 60 && lon < 125 && lat > 5 && lat < 45) || (lon > -10 && lon < 40 && lat > 35 && lat < 58) || (lon > -20 && lon < 45 && lat > -30 && lat < 15); if (!dense && hash(i + 9) > 0.35) continue; if (onLand(lon, lat)) CROWDPTS.push([lon, lat, hash(i + 3)]); } }
  const s = clamp(z / 6, 0.6, 3) * (o.s || 1);
  g.save(); CROWDPTS.forEach(([lon, lat, h], i) => { const ap = clamp(k * 2.5 - h * 1.5); if (ap <= 0) return; const [x, y] = Pj([lon, lat]); if (x < -10 || x > W + 10 || y < -10 || y > H + 10) return; const pop = easeOutBack(ap); g.globalAlpha = clamp(ap * 2); g.fillStyle = ['#3b6ea5', '#b0405a', '#2f7d6d', '#d9862b', '#7a4fb0', '#444'][i % 6]; g.beginPath(); g.ellipse(x, y, 2.6 * s * pop, 3.6 * s * pop, 0, Math.PI, 0); g.fill(); g.fillStyle = ['#f1c9a5', '#c98a5e', '#8a5a3a', '#e8b48a'][i % 4]; g.beginPath(); g.arc(x, y - 5 * s * pop, 2.4 * s * pop, 0, 7); g.fill(); }); g.restore();
}
// camera helpers
function camLerp(a, b, k) { return { lon: lerp(a.lon, b.lon, k), lat: lerp(a.lat, b.lat, k), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), k)), rot: lerp(a.rot || 0, b.rot || 0, k) }; }
function countryCam(name, pad = 1.4) { const c = VM.byName[name]; const w = c.bb[2] - c.bb[0], h = c.bb[3] - c.bb[1]; const z = Math.min(W / (w * pad), H / (h * pad)); const lat = Math.atan(Math.sinh(-c.c[1] * Math.PI / 180)) * 180 / Math.PI; return { lon: c.c[0], lat, z }; }
function centroid(name) { const c = VM.byName[name]; return [c.c[0], Math.atan(Math.sinh(-c.c[1] * Math.PI / 180)) * 180 / Math.PI]; }
// vintage serif-ish map label (Bangla, Anek Bangla)
function vlabel(g, s, x, y, size, k, col = '#3a2412', o = {}) {
  if (k <= 0) return; const u = easeOut(clamp(k)); g.save(); g.globalAlpha = u; g.font = `${o.w || 700} ${size}px "Anek Bangla"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = (o.ls != null ? o.ls : size * 0.08) * (1 + (1 - u) * 2) + 'px';
  g.lineWidth = size * 0.18; g.strokeStyle = o.halo || 'rgba(245,232,200,0.85)'; g.lineJoin = 'round'; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y); g.restore();
}
// glowing curved arrow route (lon/lat pts) with travelling head
function vroute(g, P, pts, k, col = '#c0261c', w = 6, o = {}) {
  if (k <= 0) return; const S = pts.map(P); const sm = []; for (let i = 0; i < S.length - 1; i++) { const a = S[i], b = S[i + 1]; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], bend = o.bend != null ? o.bend : 0.18; const q = [mx - dy * bend, my + dx * bend]; for (let j = 0; j < 24; j++) { const u = j / 24, v = 1 - u; sm.push([v * v * a[0] + 2 * v * u * q[0] + u * u * b[0], v * v * a[1] + 2 * v * u * q[1] + u * u * b[1]]); } } sm.push(S[S.length - 1]);
  let L = 0; const sl = []; for (let i = 1; i < sm.length; i++) { const d = Math.hypot(sm[i][0] - sm[i - 1][0], sm[i][1] - sm[i - 1][1]); sl.push(d); L += d; }
  let rem = L * clamp(k), end = sm[0], dir = 0; g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  const path = () => { g.beginPath(); g.moveTo(sm[0][0], sm[0][1]); let r = rem; for (let i = 1; i < sm.length && r > 0; i++) { const f = Math.min(1, r / sl[i - 1]); end = [lerp(sm[i - 1][0], sm[i][0], f), lerp(sm[i - 1][1], sm[i][1], f)]; dir = Math.atan2(sm[i][1] - sm[i - 1][1], sm[i][0] - sm[i - 1][0]); g.lineTo(end[0], end[1]); r -= sl[i - 1]; } };
  path(); g.strokeStyle = 'rgba(40,20,10,0.35)'; g.lineWidth = w + 6; g.stroke();
  path(); g.strokeStyle = col; g.lineWidth = w; if (o.dash) g.setLineDash([w * 2.4, w * 1.6]); g.shadowColor = col; g.shadowBlur = o.glow ? 18 : 0; g.stroke(); g.setLineDash([]);
  g.translate(end[0], end[1]); g.rotate(dir); g.fillStyle = col; g.beginPath(); g.moveTo(w * 3, 0); g.lineTo(-w * 1.6, -w * 2.2); g.lineTo(-w * 0.6, 0); g.lineTo(-w * 1.6, w * 2.2); g.closePath(); g.fill(); g.restore();
  return end;
}
// pulsing highlight ring (like the reference's yellow circle)
function vring(g, x, y, r, k, col = '#ffd23f') { if (k <= 0) return; const e = easeOutBack(clamp(k)); g.save(); g.strokeStyle = col; g.lineWidth = 6; g.shadowColor = col; g.shadowBlur = 16; g.beginPath(); g.arc(x, y, r * e, -Math.PI / 2, -Math.PI / 2 + PI2 * clamp(k * 1.4)); g.stroke(); const p = (NOW * 0.9) % 1; g.globalAlpha = (1 - p) * 0.6; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r * e * (1 + p * 0.4), 0, 7); g.stroke(); g.restore(); }
