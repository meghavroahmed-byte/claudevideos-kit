import * as THREE from 'three';
import { rng, glowTexture } from './textures.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
const mesh = (geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => { const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); m.scale.set(...s); return m; };
const shadowAll = (g) => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const lumpy = (geo, amt, seed) => {
  const r = rng(seed), p = geo.attributes.position, map = new Map();
  for (let i = 0; i < p.count; i++) {
    const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    if (!map.has(k)) map.set(k, 1 + (r() - 0.5) * amt);
    const f = map.get(k); p.setXYZ(i, p.getX(i) * f, p.getY(i) * f, p.getZ(i) * f);
  }
  geo.computeVertexNormals(); return geo;
};
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

// ---------------- Roman public latrine ----------------
export function latrine(len = 5.2) {
  const g = new THREE.Group();
  const marble = std(0xeee8dc, { roughness: 0.45, map: canvasTex(512, 128, (x, w, h) => { x.fillStyle = '#f4efe6'; x.fillRect(0, 0, w, h); const r = rng(3); x.strokeStyle = 'rgba(150,140,130,0.35)'; for (let i = 0; i < 18; i++) { x.lineWidth = 0.5 + r() * 1.5; x.beginPath(); let px = r() * w, py = r() * h; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (r() - 0.3) * 60; py += (r() - 0.5) * 20; x.lineTo(px, py); } x.stroke(); } }) });
  const stone = std(0xd8c7a6, { roughness: 0.9 });
  // seat slab with keyhole openings (dark decals) + front slots
  g.add(mesh(new THREE.BoxGeometry(len, 0.08, 0.62), marble, [0, 0.46, -0.45]));
  g.add(mesh(new THREE.BoxGeometry(len, 0.42, 0.06), stone, [0, 0.21, -0.18]));
  const holeM = new THREE.MeshBasicMaterial({ color: 0x1a1410 });
  for (let i = -2; i <= 2; i++) {
    g.add(mesh(new THREE.CircleGeometry(0.11, 20), holeM, [i * 1.0, 0.502, -0.5], [-Math.PI / 2, 0, 0], [1, 1.25, 1]));
    g.add(mesh(new THREE.PlaneGeometry(0.1, 0.2), holeM, [i * 1.0, 0.502, -0.27], [-Math.PI / 2, 0, 0]));
    g.add(mesh(new THREE.PlaneGeometry(0.1, 0.3), holeM, [i * 1.0, 0.3, -0.148]));
  }
  // back wall + columns + roof beam
  const wallT = canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#c9a77a'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(120,90,60,0.4)'; x.lineWidth = 3; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) x.strokeRect(c * 64 + (r % 2) * 32, r * 32, 64, 32); x.fillStyle = '#a8442e'; x.fillRect(0, 70, w, 18); });
  g.add(mesh(new THREE.BoxGeometry(len + 0.6, 2.6, 0.25), std(0xffffff, { map: wallT, roughness: 0.95 }), [0, 1.3, -1.0]));
  for (const x of [-len / 2 - 0.1, len / 2 + 0.1]) g.add(mesh(new THREE.CylinderGeometry(0.15, 0.17, 2.7, 20), marble, [x, 1.35, -0.55]));
  g.add(mesh(new THREE.BoxGeometry(len + 0.9, 0.22, 0.95), marble, [0, 2.75, -0.62]));
  // water channel in front of the bench
  const wt = canvasTex(256, 32, (x, w, h) => { x.fillStyle = '#3a8fc0'; x.fillRect(0, 0, w, h); const r = rng(9); for (let i = 0; i < 50; i++) { x.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.4})`; x.fillRect(r() * w, r() * h, 6 + r() * 12, 1.5); } });
  wt.wrapS = THREE.RepeatWrapping; wt.repeat.set(6, 1);
  g.add(mesh(new THREE.BoxGeometry(len + 0.4, 0.06, 0.4), stone, [0, 0.03, 0.2]));
  const water = mesh(new THREE.PlaneGeometry(len + 0.3, 0.26), std(0xffffff, { map: wt, roughness: 0.1, transparent: true, opacity: 0.92 }), [0, 0.065, 0.2], [-Math.PI / 2, 0, 0]);
  g.add(water);
  for (const z of [0.05, 0.35]) g.add(mesh(new THREE.BoxGeometry(len + 0.4, 0.1, 0.06), stone, [0, 0.08, z]));
  // floor mosaic
  const mos = canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#efe3c8'; x.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#2f4f6f' : '#efe3c8'; x.fillRect(i * 32 + 8, j * 32 + 8, 16, 16); } x.strokeStyle = '#a8442e'; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10); });
  const fl = mesh(new THREE.PlaneGeometry(len + 1.2, 2.6), std(0xffffff, { map: mos, roughness: 0.6 }), [0, 0.005, 0.1], [-Math.PI / 2, 0, 0]); g.add(fl);
  shadowAll(g); fl.castShadow = false; water.castShadow = false;
  g.update = (t) => { wt.offset.x = -t * 0.6; };
  return g;
}
export function tersorium() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.9, 8), std(0x8a6a44), [0, 0, 0]));
  const sp = mesh(lumpy(new THREE.IcosahedronGeometry(0.09, 2), 0.35, 4), std(0xe0b94c, { roughness: 1, map: canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); const r = rng(2); for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(120,80,20,${0.25 + r() * 0.4})`; x.beginPath(); x.arc(r() * w, r() * h, 1 + r() * 3, 0, 7); x.fill(); } }) }), [0, 0.5, 0], [0, 0, 0], [1, 1.3, 1]);
  g.add(sp); g.userData.sponge = sp;
  return shadowAll(g);   // +Y = sponge end, centred
}
export function amphora(h = 0.9, col = 0xc06a3a) {
  const pts = [[0.02, 0], [0.12, 0.06], [0.2, 0.25], [0.22, 0.45], [0.18, 0.62], [0.08, 0.75], [0.07, 0.9], [0.09, 0.95]].map(([x, y]) => new THREE.Vector2(x * h / 0.9 * 1.0, y * h / 0.9 * 1.0));
  const m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.65, map: canvasTex(256, 128, (x, w, hh) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, hh); x.fillStyle = 'rgba(20,14,10,0.85)'; x.fillRect(0, 70, w, 6); x.fillRect(0, 96, w, 4); for (let i = 0; i < 8; i++) { x.beginPath(); x.arc(i * 32 + 16, 50, 10, Math.PI, 0); x.fill(); } }) });
  const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 28), m));
  for (const s of [1, -1]) g.add(mesh(new THREE.TorusGeometry(0.07 * h / 0.9, 0.012, 6, 16, Math.PI), m, [s * 0.12 * h / 0.9, 0.72 * h / 0.9, 0], [0, 0, s * -1.2]));
  return shadowAll(g);
}
// pottery shard (ostrakon) with an optional scratched name
export function shard(name = '', seed = 1, s = 1) {
  const r = rng(seed), shape = new THREE.Shape(), n = 7;
  for (let i = 0; i < n; i++) { const a = i / n * 6.28, rr = (0.08 + r() * 0.05) * s; i ? shape.lineTo(Math.cos(a) * rr * 1.3, Math.sin(a) * rr) : shape.moveTo(Math.cos(a) * rr * 1.3, Math.sin(a) * rr); }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.015 * s, bevelEnabled: true, bevelSize: 0.006 * s, bevelThickness: 0.004 * s, bevelSegments: 1 });
  geo.computeBoundingBox(); const bb = geo.boundingBox, uv = geo.attributes.uv, p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (p.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
  const tex = canvasTex(256, 192, (x, w, h) => { x.fillStyle = '#c4703e'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(30,20,15,0.9)'; x.fillRect(0, 20, w, 14); if (name) { x.fillStyle = '#2a1a10'; x.font = '900 54px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(name, w / 2, h * 0.62); } });
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex, roughness: 0.7 }));
  m.castShadow = true; return m;
}
export function corn() {   // a cob with husk (dried)
  const g = new THREE.Group();
  const cobT = canvasTex(128, 256, (x, w, h) => { x.fillStyle = '#b8862e'; x.fillRect(0, 0, w, h); for (let i = 0; i < 10; i++) for (let j = 0; j < 24; j++) { x.fillStyle = (i + j) % 3 ? '#e2b347' : '#d29a33'; x.beginPath(); x.ellipse(i * 13 + 6, j * 11 + 5, 5, 4.5, 0, 0, 7); x.fill(); } });
  g.add(mesh(new THREE.CapsuleGeometry(0.045, 0.16, 6, 14), std(0xffffff, { map: cobT, roughness: 0.6 })));
  return shadowAll(g);
}
export function cornStalk(h = 1.9, seed = 1) {
  const g = new THREE.Group(), r = rng(seed), gm = std(0x6aa040, { side: THREE.DoubleSide });
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.03, h, 6), gm, [0, h / 2, 0]));
  for (let i = 0; i < 6; i++) {
    const lf = mesh(new THREE.PlaneGeometry(0.09, 0.7), gm, [0, 0.4 + i * 0.22, 0], [0.9 + r() * 0.3, i * 2.3, 0]); lf.geometry.translate(0, 0.35, 0); g.add(lf);
  }
  const cb = corn(); cb.position.set(0.06, h * 0.55, 0); cb.rotation.z = -0.5; g.add(cb);
  return shadowAll(g);
}
export function bigLeaf(s = 1) {
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(0.12 * s, 0.12 * s, 0, 0.32 * s); sh.quadraticCurveTo(-0.12 * s, 0.12 * s, 0, 0);
  const m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 10), std(0x4f9a3a, { side: THREE.DoubleSide, roughness: 0.6 }));
  m.add(mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.32 * s, 4), std(0x8fcf6a), [0, 0.16 * s, 0.002]));
  m.castShadow = true; return m;
}
export function moss() {
  const g = new THREE.Group(), r = rng(7), m = std(0x5d8f2e, { roughness: 1, flatShading: true });
  for (let i = 0; i < 9; i++) g.add(mesh(lumpy(new THREE.IcosahedronGeometry(0.035 + r() * 0.025, 1), 0.4, i), m, [(r() - 0.5) * 0.12, (r() - 0.5) * 0.05, (r() - 0.5) * 0.1]));
  return shadowAll(g);
}
export function woolTuft() {
  const g = new THREE.Group(), r = rng(8), m = std(0xf7f3ea, { roughness: 1 });
  for (let i = 0; i < 10; i++) g.add(mesh(new THREE.SphereGeometry(0.04 + r() * 0.025, 10, 8), m, [(r() - 0.5) * 0.14, (r() - 0.5) * 0.06, (r() - 0.5) * 0.08]));
  return shadowAll(g);
}
export function cypress(h = 4, seed = 1) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.6, 8), std(0x5a3e28), [0, 0.3, 0]));
  g.add(mesh(lumpy(new THREE.SphereGeometry(0.5, 14, 12), 0.12, seed), std(0x2f5a2c, { flatShading: true }), [0, h * 0.55, 0], [0, 0, 0], [1, h / 1.1, 1]));
  return shadowAll(g);
}
export function longship(len = 6) {
  const g = new THREE.Group(), wood = std(0x7a4f2c, { roughness: 0.8 }), dark = std(0x4e321c);
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), wood); hull.scale.set(0.9, 0.7, len / 2); hull.position.y = 0.7; g.add(hull);
  hull.material.side = THREE.DoubleSide;
  for (const s of [1, -1]) { const p = mesh(new THREE.TorusGeometry(0.9, 0.08, 8, 24, Math.PI * 0.6), dark, [0, 1.3, s * len / 2 - s * 0.6], [0, Math.PI / 2, 0]); p.rotation.z = s > 0 ? -0.3 : Math.PI + 0.3; g.add(p); }
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.07, 4.2, 10), dark, [0, 2.6, 0]));
  const sail = canvasTex(256, 256, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#c8352a' : '#f2e6cf'; x.fillRect(i * 32, 0, 32, h); } });
  g.add(mesh(new THREE.PlaneGeometry(2.6, 1.9), std(0xffffff, { map: sail, side: THREE.DoubleSide }), [0, 3.1, 0.05], [0, Math.PI / 2, 0]));
  for (let i = 0; i < 5; i++) for (const s of [1, -1]) g.add(mesh(new THREE.CircleGeometry(0.28, 20), std(i % 2 ? 0xe9c46a : 0x2b5a8a, { side: THREE.DoubleSide }), [s * 0.9, 1.0, -1.6 + i * 0.8], [0, s * Math.PI / 2, 0]));
  return shadowAll(g);
}
// giant toilet paper roll with a draped sheet
export function tpRoll(s = 1) {
  const g = new THREE.Group(), R = 0.7 * s, H = 1.2 * s;
  const paperT = canvasTex(512, 128, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(180,190,200,0.5)'; x.lineWidth = 2; for (let i = 0; i < 16; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, h); x.stroke(); } for (let i = 0; i < 64; i++) for (let j = 0; j < 16; j++) { x.fillStyle = 'rgba(200,210,220,0.35)'; x.beginPath(); x.arc(i * 8 + 4, j * 8 + 4, 1.2, 0, 7); x.fill(); } });
  const pm = std(0xffffff, { map: paperT, roughness: 0.9 });
  const body = mesh(new THREE.CylinderGeometry(R, R, H, 48, 1, true), pm, [0, R, 0], [0, 0, Math.PI / 2]); g.add(body);
  for (const sgn of [1, -1]) {
    const ring = mesh(new THREE.RingGeometry(R * 0.32, R, 48), std(0xf4f6f8, { side: THREE.DoubleSide, roughness: 0.95 }), [sgn * H / 2, R, 0], [0, Math.PI / 2, 0]); g.add(ring);
    g.add(mesh(new THREE.CircleGeometry(R * 0.32, 32), std(0xb08a5a, { side: THREE.DoubleSide }), [sgn * (H / 2 - 0.01), R, 0], [0, Math.PI / 2, 0]));
  }
  g.add(mesh(new THREE.CylinderGeometry(R * 0.31, R * 0.31, H * 0.98, 32, 1, true), std(0x9a7448, { side: THREE.DoubleSide }), [0, R, 0], [0, 0, Math.PI / 2]));
  // sheet hanging from the front, lying on the ground
  const shm = std(0xffffff, { map: paperT, side: THREE.DoubleSide, roughness: 0.9 });
  g.add(mesh(new THREE.PlaneGeometry(H * 0.96, R), shm, [0, R / 2, R + 0.004]));
  g.add(mesh(new THREE.PlaneGeometry(H * 0.96, 1.1 * s), shm, [0, 0.006, R + 0.55 * s], [-Math.PI / 2, 0, 0]));
  return shadowAll(g);
}
