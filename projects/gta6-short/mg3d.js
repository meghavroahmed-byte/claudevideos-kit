// mg3d.js: the user's approved v2 motion-graphics vocabulary, rebuilt as 3D objects (glowing, bloom-friendly).
// neonIcon (draw-on tubes from the v2 icon paths), ring gauge, spokes/radial diagram, word sprite (glow text),
// strike line, X mark, number sprite, beat/shot camera with hard cuts + push-in.
import * as K from '../neon-tech-short/kit/core3d.js';
import { ICONS } from './icons2d.js';
const { THREE } = K;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const eo = k => 1 - Math.pow(1 - cl(k), 3);
export const ob = k => { k = cl(k); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
const glowMat = (color, op = 1) => new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: op < 1, opacity: op });

// ---- neon draw-on icon: each polyline -> tube; draw progress k (0..1) along total length ----
export function neonIcon(name, size = 2, color = 0xffcf5a, parent, r = 0.045) {
  const g = new THREE.Group(); (parent || K.scene).add(g); const sc = size / 240; const parts = []; let tot = 0;
  for (const p of ICONS[name]()) { if (p.length < 2) continue; const pts = p.map(([x, y]) => new THREE.Vector3(x * sc, -y * sc, 0)); let L = 0; for (let i = 1; i < pts.length; i++) L += pts[i].distanceTo(pts[i - 1]); if (L < 1e-4) continue;
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.0); const geo = new THREE.TubeGeometry(curve, Math.max(8, pts.length * 3), r * size / 2, 6, false);
    const core = new THREE.Mesh(geo, glowMat(0xffffff)); const halo = new THREE.Mesh(geo.clone(), glowMat(color)); halo.scale.setScalar(1); core.scale.set(1, 1, 1);
    const hgeo = new THREE.TubeGeometry(curve, Math.max(8, pts.length * 3), r * size * 1.1, 6, false); const h = new THREE.Mesh(hgeo, glowMat(color, 0.9));
    g.add(h); g.add(core); parts.push({ core, h, L, n: geo.index.count, hn: hgeo.index.count }); tot += L; }
  g.userData.parts = parts; g.userData.tot = tot;
  g.draw = (k) => { let rem = cl(k) * tot; g.visible = k > 0.001; for (const p of parts) { const f = cl(rem / p.L); rem -= p.L; const c = Math.floor(f * p.n / 6) * 6, hc = Math.floor(f * p.hn / 6) * 6; p.core.geometry.setDrawRange(0, c); p.h.geometry.setDrawRange(0, hc); p.core.visible = c > 0; p.h.visible = hc > 0; } };
  g.draw(0); return g;
}
// ---- ring gauge: faint full ring + glowing arc (value v 0..1) ----
export function ringGauge(radius = 2, color = 0x8fe3ff, parent, tube = 0.07) {
  const g = new THREE.Group(); (parent || K.scene).add(g);
  const base = new THREE.Mesh(new THREE.TorusGeometry(radius, tube * 0.6, 8, 96), glowMat(0xffffff, 0.12)); g.add(base);
  const arc = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 160), glowMat(color)); arc.rotation.z = Math.PI / 2; arc.scale.x = -1; g.add(arc);
  g.set = (v, k = 1) => { g.visible = k > 0.01; const n = arc.geometry.index.count; arc.geometry.setDrawRange(0, Math.floor(cl(v) * n / 6) * 6); g.scale.setScalar(Math.max(0.001, ob(k))); };
  g.set(0, 0); return g;
}
// ---- dashed orbit ring that spins ----
export function dashRing(radius = 3, color = 0xffcf5a, parent, n = 40) { const g = new THREE.Group(); (parent || K.scene).add(g); const m = glowMat(color, 0.55); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const d = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.09, 0.03, 0.03), m); d.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0); d.rotation.z = a + Math.PI / 2; g.add(d); } return g; }
// ---- line that draws on between two points ----
export function beam(a, b, color = 0xffcf5a, parent, r = 0.04) { const curve = new THREE.LineCurve3(a, b); const geo = new THREE.TubeGeometry(curve, 24, r, 6, false); const m = new THREE.Mesh(geo, glowMat(color)); (parent || K.scene).add(m); m.draw = k => { m.visible = k > 0.001; geo.setDrawRange(0, Math.floor(cl(k) * geo.index.count / 6) * 6); }; m.draw(0); return m; }
// ---- glowing text sprite (Bangla OK); style: 'glow' (gradient + outline + glow) | 'plain' ----
export function word(text, h = 1, color = '#ffcf5a', parent, style = 'glow') {
  const fs = 140, mc = document.createElement('canvas').getContext('2d'); mc.font = `800 ${fs}px Anek, PJS, sans-serif`; const tw = Math.ceil(mc.measureText(text).width) + 160, th = 260;
  const tex = K.canvasTex(tw, th, (g) => { g.font = `800 ${fs}px Anek, PJS, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    if (style === 'glow') { g.shadowColor = color; g.shadowBlur = 40; g.lineWidth = 22; g.strokeStyle = '#0a0503'; g.strokeText(text, tw / 2, th / 2 + 6); g.shadowBlur = 0; const gr = g.createLinearGradient(0, th / 2 - fs / 2, 0, th / 2 + fs / 2); gr.addColorStop(0, '#fff8dc'); gr.addColorStop(0.55, color); gr.addColorStop(1, color); g.fillStyle = gr; }
    else { g.lineWidth = 20; g.strokeStyle = '#000'; g.strokeText(text, tw / 2, th / 2 + 6); g.fillStyle = '#fff'; }
    g.fillText(text, tw / 2, th / 2 + 6); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, toneMapped: false, fog: false })); s.renderOrder = 50; (parent || K.scene).add(s);
  const asp = tw / th; s.pop = (k) => { s.visible = k > 0.01; const e = ob(k); s.scale.set(h * asp * e, h * e, 1); }; s.pop(0); return s;
}
// ---- red X mark (two beams) ----
export function xMark(size = 1, parent) { const g = new THREE.Group(); (parent || K.scene).add(g); const a = beam(new THREE.Vector3(-size, size, 0), new THREE.Vector3(size, -size, 0), 0xff3b3b, g, size * 0.09), b = beam(new THREE.Vector3(size, size, 0), new THREE.Vector3(-size, -size, 0), 0xff3b3b, g, size * 0.09); g.draw = k => { a.draw(cl(k * 2)); b.draw(cl(k * 2 - 1)); }; g.draw(0); return g; }
// ---- glass-free icon badge: dark disc + ring + icon ----
export function badge(name, radius = 1, color = 0xffcf5a, parent) { const g = new THREE.Group(); (parent || K.scene).add(g); const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), new THREE.MeshBasicMaterial({ color: 0x0a0604, transparent: true, opacity: 0.45 })); g.add(disc); const ring = ringGauge(radius, color, g, 0.05 * radius); const ic = neonIcon(name, radius * 1.25, color, g, 0.05); ic.position.z = 0.02; g.set = (k) => { g.visible = k > 0.01; g.scale.setScalar(Math.max(0.001, ob(cl(k * 2.2)))); ring.set(cl(k * 1.4), 1); ic.draw(cl(k * 1.5 - 0.2)); }; g.set(0); return g; }
// ---- shot list camera: hard cuts between shots, slow push/orbit inside each shot ----
// SHOTS: [{t, p:[x,y,z], l:[x,y,z], fov, push:0.12, orbit:0.0}]
export function shotCam(SHOTS) {
  SHOTS.sort((a, b) => a.t - b.t);
  K.hooks.cam = (t) => { let i = 0; while (i < SHOTS.length - 1 && SHOTS[i + 1].t <= t) i++; const s = SHOTS[i], e = (SHOTS[i + 1] ? SHOTS[i + 1].t : s.t + 4); const u = cl((t - s.t) / Math.max(0.5, e - s.t)); const k = 0.5 - 0.5 * Math.cos(u * Math.PI);
    const p = new THREE.Vector3(...s.p), l = new THREE.Vector3(...s.l); const d = p.clone().sub(l); const ang = (s.orbit || 0) * (k - 0.5); d.applyAxisAngle(new THREE.Vector3(0, 1, 0), ang); d.multiplyScalar(1 - (s.push != null ? s.push : 0.12) * k); if (s.rise) { p.y += s.rise * k; }
    const pp = l.clone().add(d); if (s.rise) pp.y += s.rise * k; if (s.fov) { K.camera.fov = s.fov; } return { w: 1, p: pp, l }; };
  window.CUTS = SHOTS.slice(1).map(s => s.t);
}
