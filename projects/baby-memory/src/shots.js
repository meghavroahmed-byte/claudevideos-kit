import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { rng } from './textures.js';
import { world, grass, tree, rock, quadruped, iconBubble } from './ancient.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

// "Why can't you remember being two?" — one travelling take through 5 vignettes, many characters, every line acted out
export const DURATION = 30.3;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];

const A = V(0, 0, 0), B = V(8, 0, 0), C = V(17, 0, -1.5), D = V(26, 0, 0), E = V(34, 0, 0);
const K = [
  [0.0, [0.55, 1.35, 3.4], [0.15, 1.0, -0.7]],
  [2.5, [0.35, 1.3, 2.9], [0.15, 1.0, -0.7]],
  [2.8, [0.35, 1.3, 2.85], [0.2, 1.0, -0.7]],
  [3.35, [8.0, 1.15, 4.3], [8.0, 0.55, 0.0]],
  [3.6, [8.02, 1.13, 4.2], [8.0, 0.54, 0.0]],
  [5.7, [8.25, 1.0, 3.7], [8.0, 0.48, 0.0]],
  [5.95, [8.3, 1.0, 3.65], [8.0, 0.5, 0.0]],
  [6.55, [15.2, 2.3, 7.2], [17.0, 1.9, -1.5]],
  [6.8, [15.3, 2.28, 7.0], [17.0, 1.9, -1.5]],
  [8.4, [16.2, 2.1, 5.8], [17.0, 1.9, -1.5]],
  [9.2, [17.15, 1.75, 1.55], [17.0, 1.55, -1.3]],
  [12.8, [17.45, 1.65, 1.3], [17.0, 1.45, -1.3]],
  [13.6, [16.3, 2.0, 2.0], [17.0, 1.6, -1.3]],
  [17.8, [17.8, 1.75, 1.6], [17.0, 1.5, -1.3]],
  [18.05, [17.85, 1.75, 1.6], [17.0, 1.5, -1.3]],
  [18.7, [25.95, 0.95, 3.0], [26.1, 0.45, -0.1]],
  [18.95, [25.97, 0.94, 2.95], [26.1, 0.45, -0.1]],
  [20.4, [26.15, 0.9, 2.6], [26.15, 0.45, -0.2]],
  [21.2, [27.05, 0.95, 1.6], [26.45, 0.5, -0.9]],
  [22.7, [27.0, 0.95, 1.5], [26.45, 0.5, -0.9]],
  [23.3, [26.1, 1.0, 2.9], [26.0, 1.15, 0.0]],
  [26.0, [26.2, 1.5, 3.4], [26.0, 2.0, -0.3]],
  [26.2, [26.22, 1.52, 3.42], [26.0, 2.0, -0.3]],
  [26.75, [34.6, 1.35, 4.0], [34.0, 0.85, 0.0]],
  [27.0, [34.58, 1.36, 4.05], [34.0, 0.85, 0.0]],
  [30.3, [34.3, 1.6, 5.2], [34.0, 0.95, 0.0]],
];
function track(t) {
  const n = K.length, T = (i) => K[clamp(i, 0, n - 1)][0], P = (i, j) => V(...K[clamp(i, 0, n - 1)][j]);
  if (t <= K[0][0]) return [P(0, 1), P(0, 2)];
  if (t >= K[n - 1][0]) return [P(n - 1, 1), P(n - 1, 2)];
  let i = 0; while (K[i + 1][0] < t) i++;
  const u = (t - T(i)) / (T(i + 1) - T(i)), dt = T(i + 1) - T(i);
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  return [1, 2].map(j => {
    const m0 = P(i + 1, j).sub(P(i - 1, j)).multiplyScalar(dt / Math.max(1e-3, T(i + 1) - T(i - 1)) * 0.4);
    const m1 = P(i + 2, j).sub(P(i, j)).multiplyScalar(dt / Math.max(1e-3, T(i + 2) - T(i)) * 0.4);
    return P(i, j).multiplyScalar(h00).add(m0.multiplyScalar(h10)).add(P(i + 1, j).multiplyScalar(h01)).add(m1.multiplyScalar(h11));
  });
}
// ---------- poses ----------
const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const SIT = { drop: -0.47, lHip: [-1.5, 0, 0.12], lKn: [1.45, 0, 0], rHip: [-1.5, 0, -0.12], rKn: [1.45, 0, 0], lSh: [-0.45, 0, 0.2], rSh: [-0.45, 0, -0.2], lEl: [-0.7, 0, 0], rEl: [-0.7, 0, 0] };
const FLOORSIT = { drop: -0.84, lHip: [-1.45, 0, 0.3], rHip: [-1.45, 0, -0.3], lKn: [0.25, 0, 0], rKn: [0.25, 0, 0], lSh: [-0.6, 0, 0.25], rSh: [-0.6, 0, -0.25], lEl: [-0.8, 0, 0], rEl: [-0.8, 0, 0], spine: [0.15, 0, 0] };
const KNEEL = { drop: -0.5, lHip: [-1.55, 0, 0.12], lKn: [1.6, 0, 0], rHip: [-0.1, 0, -0.1], rKn: [1.75, 0, 0], spine: [0.2, 0, 0] };
const WALK = (p, a = 1) => { const s = Math.sin(p); return { lHip: [-0.4 * s * a, 0, 0.05], rHip: [0.4 * s * a, 0, -0.05], lKn: [(0.15 + 0.5 * Math.max(0, Math.sin(p + 1.3))) * a, 0, 0], rKn: [(0.15 + 0.5 * Math.max(0, Math.sin(p + 1.3 + Math.PI))) * a, 0, 0], lSh: [0.35 * s * a, 0, 0.15], rSh: [-0.35 * s * a, 0, -0.15], lEl: [-0.4, 0, 0], rEl: [-0.4, 0, 0], drop: -0.02 + Math.abs(Math.cos(p)) * 0.02 }; };
const CRAWL = (p) => { const s = Math.sin(p); return { drop: -0.47, pelvis: [1.35, 0, 0], lHip: [-1.3 + 0.25 * s, 0, 0.12], rHip: [-1.3 - 0.25 * s, 0, -0.12], lKn: [1.5, 0, 0], rKn: [1.5, 0, 0], lSh: [-1.35 - 0.3 * s, 0, 0.12], rSh: [-1.35 + 0.3 * s, 0, -0.12], lEl: [-0.2, 0, 0], rEl: [-0.2, 0, 0], neck: [-1.0, 0, 0], head: [-0.2, 0, 0] }; };
const CLAP = (t, ph = 0) => { const c = Math.abs(Math.sin(t * 7 + ph)); return { lSh: [-1.15, 0, -0.1 + 0.35 * c], rSh: [-1.15, 0, 0.1 - 0.35 * c], lEl: [-1.0, 0, 0], rEl: [-1.0, 0, 0] }; };
const over = (a, b) => Object.assign({}, a, b);
const UP = V(0, 1, 0);
const handPos = (h, side) => h.j[side + 'Wr'].localToWorld(V(0, -0.07, 0));
function hold(prop, h, side, dir, along = 0) { const p = handPos(h, side); const d = dir.clone().normalize(); prop.position.copy(p).addScaledVector(d, along); prop.quaternion.setFromUnitVectors(UP, d); }

// ---------- materials / small builders ----------
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o });
const box = (w, h, d, m, p = [0, 0, 0]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(...p); b.castShadow = b.receiveShadow = true; return b; };
const cyl = (r0, r1, h, m, p = [0, 0, 0], seg = 24) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), m); c.position.set(...p); c.castShadow = c.receiveShadow = true; return c; };
const ball = (r, m, p = [0, 0, 0]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), m); s.position.set(...p); s.castShadow = true; return s; };
function tex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
// cartoon toddler face (photo frames, bubbles)
function babyFace(g, cx, cy, r, { hair = '#5a3a22', skin = '#f2c79b', shirt = '#f4c542' } = {}) {
  g.fillStyle = shirt; g.beginPath(); g.ellipse(cx, cy + r * 1.55, r * 1.1, r * 0.7, 0, Math.PI, 0); g.fill();
  g.fillStyle = skin; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
  g.beginPath(); g.arc(cx - r * 0.98, cy + r * 0.05, r * 0.2, 0, 7); g.arc(cx + r * 0.98, cy + r * 0.05, r * 0.2, 0, 7); g.fill();
  g.fillStyle = hair; g.beginPath(); g.ellipse(cx, cy - r * 0.78, r * 0.62, r * 0.3, 0, 0, 7); g.fill();
  g.fillStyle = '#2b2018'; g.beginPath(); g.arc(cx - r * 0.35, cy - r * 0.05, r * 0.13, 0, 7); g.arc(cx + r * 0.35, cy - r * 0.05, r * 0.13, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(cx - r * 0.31, cy - r * 0.1, r * 0.045, 0, 7); g.arc(cx + r * 0.39, cy - r * 0.1, r * 0.045, 0, 7); g.fill();
  g.fillStyle = 'rgba(240,120,120,0.45)'; g.beginPath(); g.arc(cx - r * 0.55, cy + r * 0.3, r * 0.16, 0, 7); g.arc(cx + r * 0.55, cy + r * 0.3, r * 0.16, 0, 7); g.fill();
  g.strokeStyle = '#8a3a2a'; g.lineWidth = r * 0.07; g.lineCap = 'round'; g.beginPath(); g.arc(cx, cy + r * 0.28, r * 0.25, 0.2, Math.PI - 0.2); g.stroke();
}
function photoFrame(w = 0.32, h = 0.26) {
  const g = new THREE.Group();
  g.add(box(w + 0.04, h + 0.04, 0.025, std(0xc08a4a, { roughness: 0.5 })));
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex(320, 260, (c, W, H) => { const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#9fd3f5'); gr.addColorStop(1, '#bfe6a8'); c.fillStyle = gr; c.fillRect(0, 0, W, H); babyFace(c, W / 2, H * 0.45, 62); }), roughness: 0.6 }));
  p.position.z = 0.014; g.add(p); return g;
}
// polaroid memory card (pictures only, no words)
function memoryCard(kind) {
  const t = tex(256, 300, (g) => {
    g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, 256, 300);
    g.save(); g.beginPath(); g.rect(16, 16, 224, 210); g.clip();
    if (kind === 'beach') { g.fillStyle = '#7cc8f2'; g.fillRect(16, 16, 224, 210); g.fillStyle = '#2f8fd0'; g.fillRect(16, 130, 224, 40); g.fillStyle = '#f2d48a'; g.fillRect(16, 165, 224, 70); g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(196, 60, 26, 0, 7); g.fill(); g.fillStyle = '#e8452c'; g.beginPath(); g.moveTo(70, 175); g.lineTo(70, 95); g.lineTo(125, 175); g.fill(); }
    if (kind === 'puppy') { g.fillStyle = '#bde59b'; g.fillRect(16, 16, 224, 210); g.fillStyle = '#b07a46'; g.beginPath(); g.ellipse(128, 160, 70, 45, 0, 0, 7); g.fill(); g.beginPath(); g.arc(128, 100, 42, 0, 7); g.fill(); g.fillStyle = '#7a5030'; g.beginPath(); g.ellipse(92, 92, 14, 30, 0.3, 0, 7); g.ellipse(164, 92, 14, 30, -0.3, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(114, 96, 6, 0, 7); g.arc(142, 96, 6, 0, 7); g.arc(128, 114, 8, 0, 7); g.fill(); }
    if (kind === 'bath') { g.fillStyle = '#d8eef8'; g.fillRect(16, 16, 224, 210); g.fillStyle = '#ffffff'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(40 + i * 24, 150 + (i % 2) * 10, 20, 0, 7); g.fill(); } babyFace(g, 128, 110, 42); g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(190, 150, 22, 16, 0, 0, 7); g.fill(); }
    if (kind === 'swing') { g.fillStyle = '#a8dcf6'; g.fillRect(16, 16, 224, 210); g.fillStyle = '#7fbf5a'; g.fillRect(16, 180, 224, 50); g.strokeStyle = '#6b4a2a'; g.lineWidth = 6; g.beginPath(); g.moveTo(100, 16); g.lineTo(115, 140); g.moveTo(170, 16); g.lineTo(155, 140); g.stroke(); babyFace(g, 135, 120, 34, { shirt: '#e8452c' }); }
    if (kind === 'cake') { g.fillStyle = '#ffe0ef'; g.fillRect(16, 16, 224, 210); g.fillStyle = '#f7a8c8'; g.fillRect(60, 130, 136, 70); g.fillStyle = '#fff'; g.fillRect(60, 125, 136, 14); for (let i = 0; i < 3; i++) { g.fillStyle = '#6ac1f0'; g.fillRect(92 + i * 32, 92, 8, 34); g.fillStyle = '#ffb02e'; g.beginPath(); g.ellipse(96 + i * 32, 84, 7, 12, 0, 0, 7); g.fill(); } }
    g.restore();
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.35), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide, toneMapped: false }));
  return m;
}
function iconTex(draw) { return tex(512, 512, draw); }
function wall(w, h, col, win = false) {
  const g = new THREE.Group(); g.add(box(w, h, 0.12, std(col, { roughness: 0.95 }), [0, h / 2, 0]));
  g.add(box(w, 0.12, 0.16, std(0xffffff, { roughness: 0.6 }), [0, 0.06, 0.02]));
  if (win) { g.add(box(1.1, 0.9, 0.14, std(0xffffff), [0.6, 1.55, 0.01])); const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.8), new THREE.MeshBasicMaterial({ color: 0xbfe4ff })); gl.position.set(0.6, 1.55, 0.085); g.add(gl); }
  return g;
}
function sofa(col = 0x6a8caf) {
  const g = new THREE.Group(), m = std(col, { roughness: 0.95 });
  g.add(box(1.9, 0.42, 0.85, m, [0, 0.21, 0]), box(1.9, 0.5, 0.2, m, [0, 0.62, -0.33]), box(0.2, 0.62, 0.85, m, [-0.95, 0.31, 0]), box(0.2, 0.62, 0.85, m, [0.95, 0.31, 0]));
  g.add(box(0.85, 0.12, 0.62, std(col, { roughness: 1 }).clone(), [-0.44, 0.48, 0.07]), box(0.85, 0.12, 0.62, std(col, { roughness: 1 }), [0.44, 0.48, 0.07]));
  return g;
}
function lamp() { const g = new THREE.Group(); g.add(cyl(0.18, 0.2, 0.04, std(0x333333), [0, 0.02, 0]), cyl(0.02, 0.02, 1.45, std(0x333333), [0, 0.74, 0]), cyl(0.15, 0.27, 0.3, std(0xfff3d6, { emissive: 0xffd9a0, emissiveIntensity: 0.6 }), [0, 1.52, 0])); return g; }
function hardHat(h) { const hat = new THREE.Group(); const m = std(0xffc21a, { roughness: 0.35 }); const s = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 12, 0, Math.PI * 2, 0, 1.5), m); s.castShadow = true; hat.add(s); const brim = cyl(0.19, 0.19, 0.015, m, [0, 0.0, 0.02]); hat.add(brim); hat.position.set(0, 0.14, 0); h.j.head.add(hat); }
function child(h, s, headS) {
  h.root.scale.setScalar(s); h.j.head.scale.setScalar(headS * 1.08);
  const kid = s < 0.7; const leg = kid ? 0.78 : 0.9;
  for (const k of ['lHip', 'rHip']) h.j[k].scale.set(1.3, leg, 1.3);
  for (const k of ['lSh', 'rSh']) h.j[k].scale.set(1.25, kid ? 0.82 : 0.92, 1.25);
  h.j.spine.scale.set(1.22, kid ? 0.92 : 0.97, 1.3);
  const base = h.setPose; const lift = 0.9 * (1 - leg);
  h.setPose = (p) => { base(p); h.j.pelvis.position.y -= lift; };
  h.setPose({}); return h;
}
// giant brain: two lumpy hemispheres with gyri
function brainMesh() {
  const geo = new THREE.SphereGeometry(1, 128, 96); const p = geo.attributes.position, v = V(0, 0, 0);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const n = v.clone();
    const gy = Math.sin(n.x * 9 + Math.sin(n.y * 7) * 1.7) * Math.sin(n.z * 8 + Math.sin(n.x * 6) * 1.4) + Math.sin(n.y * 13 + n.z * 5) * 0.4;
    const r = 1 + 0.045 * gy - 0.06 * Math.exp(-n.x * n.x * 160) * (n.y > -0.3 ? 1 : 0);
    v.multiplyScalar(r); p.setXYZ(i, v.x * 1.15, v.y * 0.85, v.z * 1.35);
  }
  geo.computeVertexNormals();
  const m = new THREE.MeshPhysicalMaterial({ color: 0xf2a0a8, roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.4, transparent: true, opacity: 1 });
  const b = new THREE.Mesh(geo, m); b.castShadow = true; b.receiveShadow = true;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.9, 24), std(0xe58f98)); stem.position.set(0, -0.95, -0.4); stem.rotation.x = 0.35; b.add(stem);
  return b;
}
function scaffold(w, h, d) {
  const g = new THREE.Group(), m = std(0x8f969e, { metalness: 0.6, roughness: 0.4 }), pl = std(0xb58a52, { roughness: 0.9 });
  for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) g.add(cyl(0.03, 0.03, h, m, [x, h / 2, z], 8));
  for (let y = 0.9; y < h; y += 0.9) { g.add(box(w, 0.035, 0.035, m, [0, y, d / 2]), box(w, 0.035, 0.035, m, [0, y, -d / 2])); g.add(box(w, 0.04, 0.35, pl, [0, y + 0.02, d / 2 + 0.1])); }
  return g;
}
function cone() { const g = new THREE.Group(); g.add(cyl(0.0, 0.13, 0.42, std(0xff6a1a), [0, 0.21, 0])); g.add(cyl(0.085, 0.1, 0.06, std(0xffffff), [0, 0.2, 0])); g.add(box(0.3, 0.03, 0.3, std(0xff6a1a), [0, 0.015, 0])); return g; }
function cabinet() {
  const g = new THREE.Group(), w = std(0x9a6a3c, { roughness: 0.6 });
  g.add(box(0.5, 0.9, 0.42, w, [0, 0.45, 0]));
  const drawers = [];
  for (let i = 0; i < 4; i++) { const d = box(0.44, 0.19, 0.4, std(0xb07b48, { roughness: 0.55 }), [0, 0.13 + i * 0.215, 0.03]); d.add(box(0.12, 0.025, 0.03, std(0xd9d9d9, { metalness: 0.8, roughness: 0.3 }), [0, 0.02, 0.21])); g.add(d); drawers.push(d); }
  g.drawers = drawers; return g;
}
function folder(col) { const g = new THREE.Group(); g.add(box(0.2, 0.15, 0.012, std(col, { roughness: 0.8 }))); g.add(box(0.07, 0.025, 0.012, std(col, { roughness: 0.8 }), [-0.05, 0.085, 0])); return g; }
// hippocampus: glowing curled tube (seahorse shape)
function hippocampus() {
  const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40, a = u * Math.PI * 1.6; pts.push(V(Math.cos(a) * (0.32 - 0.12 * u), Math.sin(a) * (0.22 - 0.08 * u) + u * 0.05, u * 0.12)); }
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.055, 16, false);
  const m = new THREE.Mesh(geo, std(0xffc45a, { emissive: 0xff9a2a, emissiveIntensity: 0.55, roughness: 0.35 })); m.castShadow = true;
  return m;
}
// neuron: glowing body + branching dendrites that grow with k
function neuron(seed) {
  const g = new THREE.Group(), r = rng(seed), mat = std(0x8fd8ff, { emissive: 0x3aa8ff, emissiveIntensity: 0.9, roughness: 0.3 });
  g.add(ball(0.06, mat));
  const br = [];
  for (let i = 0; i < 6; i++) {
    const dir = V(r() - 0.5, r() - 0.5, r() - 0.5).normalize(); const len = 0.18 + r() * 0.22;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.016, len, 6), mat); c.geometry.translate(0, len / 2, 0);
    c.quaternion.setFromUnitVectors(UP, dir); g.add(c); br.push(c);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.009, len * 0.6, 6), mat); tip.geometry.translate(0, len * 0.3, 0); tip.position.y = len; tip.rotation.z = (r() - 0.5) * 1.4; c.add(tip);
  }
  g.grow = (k) => { g.visible = k > 0.01; g.scale.setScalar(Math.max(0.001, Math.min(1, k * 1.4))); br.forEach((b, i) => { b.scale.y = Math.max(0.001, Math.min(1, k * 1.6 - i * 0.08)); }); };
  return g;
}
function toyBlock(col, s = 0.12) { const b = box(s, s, s, std(col, { roughness: 0.5 })); return b; }
function stripedBall() { return ball(0.13, new THREE.MeshStandardMaterial({ map: tex(256, 128, (g) => { const c = ['#e8452c', '#ffd23f', '#2a9df4', '#ffffff']; for (let i = 0; i < 8; i++) { g.fillStyle = c[i % 4]; g.fillRect(i * 32, 0, 32, 128); } }), roughness: 0.4 })); }
function cake() {
  const g = new THREE.Group();
  g.add(cyl(0.26, 0.26, 0.16, std(0xf7a8c8, { roughness: 0.6 }), [0, 0.08, 0], 40), cyl(0.27, 0.27, 0.03, std(0xffffff, { roughness: 0.5 }), [0, 0.17, 0], 40), cyl(0.36, 0.36, 0.015, std(0xeeeeee, { metalness: 0.3 }), [0, 0.0, 0], 40));
  const flames = [];
  for (let i = 0; i < 3; i++) { const x = (i - 1) * 0.1; g.add(cyl(0.012, 0.012, 0.12, std([0x6ac1f0, 0xffd23f, 0x8fcf6a][i]), [x, 0.24, 0])); const f = glowSprite(0xffa030, 0.12); f.position.set(x, 0.33, 0); g.add(f); flames.push(f); }
  g.flames = flames; return g;
}
function balloon(col) { const g = new THREE.Group(); const b = ball(0.16, std(col, { roughness: 0.25, metalness: 0.05 })); b.scale.y = 1.2; b.position.y = 1.0; g.add(b); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 1.0, 4), std(0xffffff)); s.position.y = 0.5; g.add(s); return g; }
function partyHat(h, col) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 20), std(col, { roughness: 0.5 })); c.position.set(0.02, 0.27, 0); c.rotation.z = -0.15; c.castShadow = true; h.j.head.add(c); }
function table(w = 1.4, d = 0.8, h = 0.72, col = 0xffffff) { const g = new THREE.Group(); g.add(box(w, 0.04, d, std(col, { roughness: 0.6 }), [0, h, 0])); for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) for (const z of [-d / 2 + 0.06, d / 2 - 0.06]) g.add(cyl(0.025, 0.025, h, std(0x8a6a44), [x, h / 2, z], 8)); return g; }
function modernHouse() {
  const g = new THREE.Group();
  g.add(box(5, 2.8, 3.5, std(0xf0e2c8, { roughness: 0.95 }), [0, 1.4, 0]));
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 2.9, 1.4, 4, 1), std(0xa8452c, { roughness: 0.8 })); roof.rotation.y = Math.PI / 4; roof.scale.set(1.25, 1, 0.9); roof.position.y = 3.5; roof.castShadow = true; g.add(roof);
  g.add(box(0.9, 1.9, 0.08, std(0x6b4226), [0, 0.95, 1.76]));
  for (const x of [-1.6, 1.6]) { g.add(box(1.0, 0.9, 0.06, std(0xffffff), [x, 1.6, 1.76])); const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.75), new THREE.MeshBasicMaterial({ color: 0xbfe0f5 })); gl.position.set(x, 1.6, 1.8); g.add(gl); }
  return g;
}
function scribbleTex() { return iconTex((g) => { g.strokeStyle = '#3a3a3a'; g.lineWidth = 18; g.lineCap = 'round'; g.lineJoin = 'round'; const r = rng(4); g.beginPath(); g.moveTo(110, 250); for (let i = 0; i < 26; i++) g.lineTo(110 + i * 11 + (r() - 0.5) * 20, 250 + Math.sin(i * 1.7) * 70 + (r() - 0.5) * 40); g.stroke(); g.fillStyle = '#e8452c'; g.beginPath(); g.arc(150, 150, 22, 0, 7); g.fill(); g.fillStyle = '#2a9df4'; g.beginPath(); g.arc(360, 360, 26, 0, 7); g.fill(); }); }
function babyIcon() { return iconTex((g) => babyFace(g, 256, 230, 150)); }
function dogIcon() { return iconTex((g) => { g.fillStyle = '#b07a46'; g.beginPath(); g.arc(256, 260, 150, 0, 7); g.fill(); g.fillStyle = '#7a5030'; g.beginPath(); g.ellipse(140, 220, 45, 100, 0.3, 0, 7); g.ellipse(372, 220, 45, 100, -0.3, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(205, 240, 18, 0, 7); g.arc(307, 240, 18, 0, 7); g.arc(256, 300, 26, 0, 7); g.fill(); }); }

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 8, sunDir: [-4, 9, 5], sun: 2.4 });
  const u = scene.userData.sky.material.uniforms;
  u.top.value.set(0x2a7ad6); u.mid.value.set(0x62acea); u.horizon.value.set(0xd8ecf8); u.floorC.value.set(0x7fb069);
  scene.fog = new THREE.Fog(0xd8ecf8, 40, 140);
  const key = scene.userData.key; key.color.set(0xfff0dc);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xd9ecff); hemi.groundColor.set(0x8aa86a); hemi.intensity = 0.85;
  scene.add(world(['#79a85a', ['110,160,80', '130,180,95', '95,145,70']]));
  scene.add(grass(2600, [-6, -14, 42, 8], [[-2.6, -2.4, 2.6, 2.0], [24.2, -2.4, 28.2, 2.0]]));
  [[4.0, -5.5], [12.5, -6.5], [21.5, -6], [30.5, -5.2], [38, -4.5], [-4, -6], [14, 2.6], [37.5, 2.4]].forEach(([x, z], i) => { const tr = tree({ h: 3.4 + (i % 3) * 0.5, seed: i + 3, col: [0x4f8f3a, 0x5c9c42, 0x447f33][i % 3] }); tr.position.set(x, 0, z); scene.add(tr); });
  const house = modernHouse(); house.position.set(B.x - 0.5, 0, -4.2); scene.add(house);
  const house2 = modernHouse(); house2.position.set(E.x + 0.5, 0, -4.5); scene.add(house2);

  // ===== A: living room — grown-up looks at a baby photo =====
  const floorA = box(5.2, 0.04, 4.4, std(0xc8a26e, { roughness: 0.7 }), [A.x, 0.02, A.z - 0.2]); scene.add(floorA);
  const rugA = cyl(1.3, 1.3, 0.012, std(0xd9b38c, { roughness: 1 }), [A.x, 0.045, A.z + 0.3], 48); rugA.scale.z = 0.7; scene.add(rugA);
  const wA = wall(5.2, 2.8, 0xe9dcc6, true); wA.position.set(A.x, 0, A.z - 2.35); scene.add(wA);
  const wA2 = wall(4.4, 2.8, 0xdfd0b8); wA2.rotation.y = Math.PI / 2; wA2.position.set(A.x - 2.55, 0, A.z - 0.2); scene.add(wA2);
  const so = sofa(0x5f7fa3); so.position.set(A.x, 0.04, A.z - 1.25); scene.add(so);
  const lp = lamp(); lp.position.set(A.x + 1.35, 0.04, A.z - 1.6); scene.add(lp);
  const shelfPhotos = [0, 1, 2].map(i => { const f = photoFrame(0.22, 0.17); f.position.set(A.x - 1.6 + i * 0.32, 1.55, A.z - 2.27); scene.add(f); return f; });
  const hero = makeHuman('casual', { shirt: 0x2a9d8f, jeans: 0x34507a, chestText: 'MR. CLOUD', skin: 0xe0ac69, hair: 0x2b1d14, beard: true }); scene.add(hero.root);
  const grandma = makeHuman('casual', { shirt: 0x8e5aa8, jeans: 0x5a4a6a, skin: 0xf1c27d, hair: 0xd8d8d8, beard: false, long: true }); scene.add(grandma.root);
  const photo = photoFrame(); scene.add(photo);
  const thinkA = iconBubble(babyIcon()); scene.add(thinkA);

  // ===== B: backyard — learning something new every day =====
  const blanket = box(2.2, 0.02, 2.2, std(0xf4d35e, { roughness: 1 }), [B.x + 0.1, 0.01, B.z + 1.0]); scene.add(blanket);
  const dad = makeHuman('casual', { shirt: 0x3d6fb6, jeans: 0x2f3e55, skin: 0xc68642, hair: 0x1a120c }); scene.add(dad.root);
  const momB = makeHuman('casual', { shirt: 0xe76f8a, jeans: 0x34507a, skin: 0xc68642, hair: 0x2b1d14, beard: false, long: true }); scene.add(momB.root);
  const walker = child(makeHuman('casual', { shirt: 0xf4c542, jeans: 0x6aa0d8, skin: 0xc68642, hair: 0x1a120c, beard: false }), 0.5, 1.5); scene.add(walker.root);
  const builder = child(makeHuman('casual', { shirt: 0xe8452c, jeans: 0x34507a, skin: 0xf1c27d, hair: 0xc0802a, beard: false }), 0.48, 1.5); scene.add(builder.root);
  const crawler = child(makeHuman('casual', { shirt: 0x8fcf6a, jeans: 0xf2f2f2, skin: 0xe0ac69, hair: 0x3a2618, beard: false }), 0.4, 1.6); scene.add(crawler.root);
  const kicker = child(makeHuman('casual', { shirt: 0x9b5de5, jeans: 0x34507a, skin: 0x8d5524, hair: 0x111111, beard: false }), 0.52, 1.45); scene.add(kicker.root);
  const blocks = [0xe8452c, 0x2a9df4, 0xffd23f, 0x8fcf6a, 0xff8c42, 0x9b5de5].map(c => { const b = toyBlock(c); scene.add(b); return b; });
  const kball = stripedBall(); scene.add(kball);
  const fxB = { step: burst(0xffe14d, 50, 11), stack: burst(0xffffff, 40, 12) }; Object.values(fxB).forEach(f => scene.add(f));

  // ===== C: the brain under construction =====
  const brain = brainMesh(); brain.scale.setScalar(1.55); brain.position.set(C.x, 1.95, C.z); scene.add(brain);
  const scaf = scaffold(4.6, 3.6, 4.4); scaf.position.set(C.x, 0, C.z); scene.add(scaf);
  [[-2.4, 1.6], [2.5, 1.5], [-1.2, 2.1], [1.3, 2.2]].forEach(([x, z]) => { const c = cone(); c.position.set(C.x + x, 0, C.z + z); scene.add(c); });
  const workers = [0, 1, 2].map(i => { const w = makeHuman('casual', { shirt: 0xff7a1a, jeans: [0x34507a, 0x2f3e55, 0x4a5a6a][i], skin: [0xc68642, 0xf1c27d, 0x8d5524][i], hair: 0x2b1d14, beard: i !== 1 }); hardHat(w); scene.add(w.root); return w; });
  const beam = box(1.6, 0.12, 0.12, std(0x8f969e, { metalness: 0.6, roughness: 0.4 })); scene.add(beam);
  // inside the brain (seen when it turns see-through)
  const inner = new THREE.Group(); inner.position.set(C.x, 0, C.z); scene.add(inner);
  const shelf = cyl(0.75, 0.75, 0.04, std(0xd98a94, { roughness: 0.7 }), [0, 1.05, 0.1], 40); inner.add(shelf);
  const hip = hippocampus(); hip.position.set(0.3, 1.45, 0.05); hip.rotation.set(0.2, -0.3, 0); hip.scale.setScalar(1.2); inner.add(hip);
  const hipGlow = glowSprite(0xffb040, 0.9); hipGlow.position.set(0.3, 1.45, 0.1); inner.add(hipGlow);
  const cab = cabinet(); cab.scale.setScalar(0.62); cab.position.set(-0.3, 1.07, 0.05); inner.add(cab);
  const tiny = makeHuman('casual', { shirt: 0xff7a1a, jeans: 0x34507a, skin: 0xe0ac69, hair: 0x2b1d14 }); hardHat(tiny); tiny.root.scale.setScalar(0.3); scene.add(tiny.root);
  const folders = Array.from({ length: 9 }, (_, i) => { const f = folder([0xf2c66d, 0xe8b04a, 0xf7d98a][i % 3]); f.scale.setScalar(0.75); scene.add(f); return f; });
  const neurons = Array.from({ length: 9 }, (_, i) => { const n = neuron(i + 7); scene.add(n); return n; });
  const NPOS = [[-0.7, 1.7, 0.3], [0.8, 1.85, 0.2], [-0.2, 2.15, 0.35], [0.55, 1.15, 0.45], [-0.85, 1.2, 0.35], [0.1, 1.75, 0.55], [1.05, 1.5, -0.1], [-1.0, 1.95, -0.2], [0.35, 2.3, 0.0]];
  const wires = new THREE.Group(); inner.add(wires);
  const wireMat = std(0x9fe2ff, { emissive: 0x3aa8ff, emissiveIntensity: 0.8 });
  const WIRES = [[0, 2], [2, 1], [1, 6], [4, 3], [5, 0], [7, 2], [8, 1], [3, 6]].map(([a, b]) => { const pa = V(...NPOS[a]), pb = V(...NPOS[b]); const mid = pa.clone().lerp(pb, 0.5).add(V(0, 0.15, 0.1)); const geo = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(pa, mid, pb), 24, 0.008, 6, false); const m = new THREE.Mesh(geo, wireMat); wires.add(m); return m; });
  const fxC = { papers: burst(0xfff3c4, 70, 21), sparks: burst(0x8fd8ff, 80, 22), drop: burst(0xffe14d, 30, 23) }; Object.values(fxC).forEach(f => scene.add(f));

  // ===== D: nursery — no words, no "me" =====
  const floorD = box(4.4, 0.04, 4.2, std(0xdcc7a3, { roughness: 0.7 }), [D.x, 0.02, D.z - 0.3]); scene.add(floorD);
  const rugD = cyl(1.0, 1.0, 0.012, std(0x9fd3f5, { roughness: 1 }), [D.x, 0.045, D.z + 0.2], 48); scene.add(rugD);
  const wD = wall(4.4, 2.6, 0xcfe8d0, true); wD.position.set(D.x, 0, D.z - 2.35); scene.add(wD);
  const wD2 = wall(4.2, 2.6, 0xd8eedb); wD2.rotation.y = -Math.PI / 2; wD2.position.set(D.x + 2.15, 0, D.z - 0.3); scene.add(wD2);
  const tod = child(makeHuman('casual', { shirt: 0x2a9df4, jeans: 0xf4d35e, skin: 0xf1c27d, hair: 0x7a4a22, beard: false }), 0.5, 1.5); scene.add(tod.root);
  const refl = child(makeHuman('casual', { shirt: 0x2a9df4, jeans: 0xf4d35e, skin: 0xf1c27d, hair: 0x7a4a22, beard: false }), 0.5, 1.5); scene.add(refl.root);
  const momD = makeHuman('casual', { shirt: 0xf4a261, jeans: 0x34507a, skin: 0xf1c27d, hair: 0x7a4a22, beard: false, long: true }); scene.add(momD.root);
  const dog = quadruped('wolf', 5); dog.traverse(m => { if (m.isMesh && m.material && m.material.color) { m.material = m.material.clone(); m.material.color.lerp(new THREE.Color(0xb07a46), 0.8); } }); dog.scale.setScalar(0.55); scene.add(dog);
  const talk = iconBubble(scribbleTex()); scene.add(talk);
  const dogThought = iconBubble(dogIcon()); scene.add(dogThought);
  // standing mirror (toddler faces -z; reflection is mirrored about z = MZ)
  const MZ = D.z - 0.95;
  const mirror = new THREE.Group(); mirror.position.set(D.x + 0.55, 0, MZ); scene.add(mirror);
  const fr = std(0xffffff, { roughness: 0.4 });
  mirror.add(box(0.08, 1.35, 0.06, fr, [-0.45, 0.68, 0]), box(0.08, 1.35, 0.06, fr, [0.45, 0.68, 0]), box(0.98, 0.08, 0.06, fr, [0, 1.34, 0]), box(0.98, 0.08, 0.06, fr, [0, 0.04, 0]));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.22), new THREE.MeshPhysicalMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.2 })); glass.position.set(0, 0.68, 0.01); mirror.add(glass);
  // mirror room behind the glass (reflection of the nursery)
  const mroom = box(1.0, 1.3, 1.4, std(0xcfe8d0, { side: THREE.BackSide, roughness: 1 }), [0, 0.68, -0.72]); mirror.add(mroom);
  const qD = burst(0xffffff, 40, 31); scene.add(qD);
  // memories that float away
  const cards = ['beach', 'puppy', 'bath', 'swing', 'beach'].map(k => { const m = memoryCard(k); scene.add(m); return m; });

  // ===== E: third birthday — the first memory that stays =====
  const tb = table(1.5, 0.9, 0.55, 0xffffff); tb.position.set(E.x, 0, E.z - 0.35); scene.add(tb);
  const cloth = box(1.56, 0.012, 0.96, std(0xff9ec4, { roughness: 1 }), [E.x, 0.565, E.z - 0.35]); scene.add(cloth);
  const ck = cake(); ck.position.set(E.x, 0.575, E.z - 0.3); scene.add(ck);
  const bday = child(makeHuman('casual', { shirt: 0xffd23f, jeans: 0x6aa0d8, skin: 0xe0ac69, hair: 0x2b1d14, beard: false }), 0.6, 1.4); partyHat(bday, 0xe8452c); scene.add(bday.root);
  const sib = child(makeHuman('casual', { shirt: 0x8fcf6a, jeans: 0x34507a, skin: 0xe0ac69, hair: 0x2b1d14, beard: false, long: true }), 0.75, 1.25); partyHat(sib, 0x2a9df4); scene.add(sib.root);
  const momE = makeHuman('casual', { shirt: 0xe76f8a, jeans: 0x34507a, skin: 0xe0ac69, hair: 0x2b1d14, beard: false, long: true }); scene.add(momE.root);
  const dadE = makeHuman('casual', { shirt: 0x3d6fb6, jeans: 0x2f3e55, skin: 0xe0ac69, hair: 0x1a120c }); scene.add(dadE.root);
  const granE = makeHuman('casual', { shirt: 0x8e5aa8, jeans: 0x5a4a6a, skin: 0xf1c27d, hair: 0xd8d8d8, beard: true }); scene.add(granE.root);
  const balloons = [[-1.3, -0.9, 0xe8452c], [-1.1, -1.0, 0x2a9df4], [1.2, -0.95, 0xffd23f], [1.4, -0.85, 0x9b5de5], [1.3, -1.05, 0x8fcf6a]].map(([x, z, c]) => { const b = balloon(c); b.position.set(E.x + x, 0.55, E.z + z); scene.add(b); return b; });
  const firstMem = memoryCard('cake'); scene.add(firstMem);
  const memGlow = glowSprite(0xfff0b0, 1.2); scene.add(memGlow);
  const fxE = { confetti: [burst(0xff5d8f, 90, 41), burst(0x5ab8ff, 90, 42), burst(0xffe14d, 90, 43)], blow: burst(0xffffff, 40, 44) };
  fxE.confetti.forEach(f => scene.add(f)); scene.add(fxE.blow);

  const c = cam(38);
  return {
    scene, camera: c,
    update(t) {
      // ================= A =================
      hero.root.position.set(A.x - 0.3, 0.04, A.z - 0.95); hero.root.rotation.y = 0;
      const doubt = smooth(range(t, 1.9, 2.3));
      hero.setPose(over(SIT, { neck: [0.35 - 0.3 * doubt, 0.25 * doubt, 0.15 * doubt], spine: [0.08, 0, 0], lSh: [-0.75, 0, 0.18], lEl: [-1.25, 0, 0], rSh: [-0.75 - 1.6 * doubt, 0, -0.18 - 0.2 * doubt], rEl: [-1.25 - 0.6 * doubt, 0, 0] }));
      hero.setMouth(0.15 * doubt);
      grandma.root.position.set(A.x + 0.55, 0.04, A.z - 0.95); grandma.root.rotation.y = -0.35;
      const gp = smooth(range(t, 0.4, 0.8)) * (1 - smooth(range(t, 2.4, 2.8)));
      grandma.setPose(over(SIT, { neck: [0.3, -0.35, 0], lSh: [-0.45, 0, 0.2], rSh: [-0.45 - 0.75 * gp, 0.0, -0.2 - 0.2 * gp], rEl: [-0.7 + 0.4 * gp, 0, 0] }));
      grandma.setMouth(0.3 * Math.max(0, Math.sin(t * 10)) * gp);
      scene.updateMatrixWorld(true);
      const pl = handPos(hero, 'l'); photo.position.copy(pl).add(V(0.12, 0.08, 0.06)); photo.rotation.set(-0.55, 0.15, 0);
      thinkA.position.set(A.x - 0.25, 1.85 + Math.sin(t * 2) * 0.02, A.z - 0.75);
      thinkA.set(0.42 * easeOut(range(t, 0.55, 0.8)) * (1 - smooth(range(t, 2.8, 3.1))), smooth(range(t, 0.95, 1.15)));

      // ================= B =================
      // walker: first steps from the blanket into dad's arms
      const wk = range(t, 3.0, 5.4), wpos = V(B.x + 0.35, 0, B.z + 0.4).lerp(V(B.x - 0.42, 0, B.z + 0.45), easeInOut(wk));
      walker.root.position.copy(wpos); walker.root.rotation.y = -Math.PI / 2 + 0.2;
      const wob = Math.sin(t * 9) * 0.12;
      walker.setPose(over(wk > 0 && wk < 1 ? WALK((t - 3) * 9, 0.8) : STAND(t, 1), { lSh: [-0.6, 0, 0.9], rSh: [-0.6, 0, -0.9], lEl: [-0.3, 0, 0], rEl: [-0.3, 0, 0], spine: [0, 0, wob * (wk > 0 && wk < 1 ? 1 : 0)] }));
      walker.setMouth(0.3 * smooth(range(t, 5.2, 5.5)));
      dad.root.position.set(B.x - 0.85, 0, B.z + 0.5); dad.root.rotation.y = Math.PI / 2 - 0.15;
      const catchK = smooth(range(t, 5.0, 5.6));
      dad.setPose(over(KNEEL, { lSh: [-1.2 + 0.3 * catchK, 0, 0.75 - 0.5 * catchK], rSh: [-1.2 + 0.3 * catchK, 0, -0.75 + 0.5 * catchK], lEl: [-0.3 - 0.8 * catchK, 0, 0], rEl: [-0.3 - 0.8 * catchK, 0, 0], neck: [0.1, 0, 0] }));
      dad.setMouth(0.35 * Math.max(0, Math.sin(t * 6)) * (t > 3.2 && t < 6 ? 1 : 0));
      // builder: stacks blocks one by one
      builder.root.position.set(B.x + 0.55, 0.02, B.z + 1.35); builder.root.rotation.y = -0.5;
      const reachB = Math.max(0, Math.sin(t * 4.2));
      builder.setPose(over(FLOORSIT, { rSh: [-0.9 - 0.4 * reachB, 0, -0.2], rEl: [-0.6, 0, 0], neck: [0.3, 0, 0] }));
      const stackN = Math.floor(clamp(range(t, 2.8, 5.8)) * 6);
      blocks.forEach((b, i) => { const k = i < stackN ? 1 : 0; const pos = k ? V(B.x + 0.32, 0.07 + i * 0.12, B.z + 1.5) : V(B.x + 0.55 + (i % 3) * 0.14, 0.07, B.z + 1.72 + Math.floor(i / 3) * 0.14); b.position.copy(pos); b.rotation.y = i * 0.3 + (k ? 0 : 0.6); });
      fxB.stack.position.set(B.x + 0.32, 0.8, B.z + 1.5); fxB.stack.update(t - 5.75);
      // crawler crawls across the blanket
      const cr = range(t, 2.8, 6.2); crawler.root.position.set(lerp(B.x + 0.9, B.x - 0.7, cr), 0.02, B.z + 1.75); crawler.root.rotation.y = -Math.PI / 2;
      crawler.setPose(CRAWL(t * 6)); crawler.setMouth(0.2);
      // kicker kicks the ball
      kicker.root.position.set(B.x + 0.75, 0, B.z - 0.7); kicker.root.rotation.y = -0.6;
      const kick = smooth(range(t, 4.1, 4.35)) * (1 - smooth(range(t, 4.5, 4.8)));
      kicker.setPose(over(STAND(t, 3), { rHip: [-1.0 * kick + 0.3 * smooth(range(t, 3.8, 4.1)) * (1 - kick), 0, -0.05], rKn: [0.4 * (1 - kick), 0, 0], lSh: [0.3 * kick, 0, 0.5], rSh: [-0.4 * kick, 0, -0.5] }));
      const bf = Math.max(0, t - 4.25); kball.position.set(B.x + 0.6 - bf * 0.9, 0.13 + Math.abs(Math.sin(bf * 5)) * 0.25 * Math.exp(-bf * 1.2), B.z - 0.5 + bf * 0.15); kball.rotation.z = bf * 8;
      // mom claps
      momB.root.position.set(B.x - 0.25, 0, B.z - 1.4); momB.root.rotation.y = 0.2;
      momB.setPose(over(STAND(t, 2), t > 5.1 ? CLAP(t) : { neck: [0.25, -0.5, 0] })); momB.setMouth(t > 5.1 ? 0.5 : 0.1);
      fxB.step.position.copy(wpos).add(V(0, 0.9, 0)); fxB.step.update(t - 5.45);

      // ================= C =================
      const seeThrough = smooth(range(t, 8.6, 9.3)) * (1 - smooth(range(t, 17.9, 18.4)));
      brain.material.opacity = 1 - 0.62 * seeThrough; brain.material.depthWrite = seeThrough < 0.5; brain.material.side = seeThrough > 0.02 ? THREE.DoubleSide : THREE.FrontSide;
      inner.visible = seeThrough > 0.02; scaf.visible = seeThrough < 0.95;
      brain.rotation.y = Math.sin(t * 0.3) * 0.05;
      // workers on the scaffolding: hammering, carrying a beam
      workers.forEach((w, i) => {
        const hp = [[-2.2, 0, 1.9], [2.2, 0.92, 2.32], [0.2, 0.92, 2.32]][i];
        w.root.position.set(C.x + hp[0], hp[1], C.z + hp[2]); w.root.rotation.y = [0.4, -0.5, 0][i] + Math.PI;
        if (i === 2) { const wk2 = range(t, 6.0, 8.6); w.root.position.x = C.x + lerp(-2.1, -0.9, wk2); w.root.rotation.y = Math.PI / 2; w.setPose(over(WALK(t * 7, 0.7), { lSh: [-2.6, 0, 0.3], rSh: [-2.6, 0, -0.3], lEl: [-0.4, 0, 0], rEl: [-0.4, 0, 0] })); }
        else { const hm = Math.abs(Math.sin(t * 6 + i)); w.setPose(over(STAND(t, i), { rSh: [-1.6 - 0.9 * hm, 0, -0.1], rEl: [-0.6, 0, 0], neck: [-0.25, 0, 0] })); }
      });
      scene.updateMatrixWorld(true);
      beam.position.copy(workers[2].j.head.localToWorld(V(0, 0.35, 0))); beam.rotation.y = 0;
      // tiny worker inside tries to file folders into the unfinished cabinet
      const files = smooth(range(t, 10.2, 10.8));
      tiny.root.position.set(C.x - 0.05, 1.07, C.z + 0.35); tiny.root.rotation.y = -1.9;
      const fall = smooth(range(t, 11.6, 12.1)), scr = smooth(range(t, 14.0, 14.4));
      tiny.setPose(over(scr > 0 ? STAND(t, 5) : WALK(t * 4 * (1 - fall), 0.5), { lSh: [-1.1 * (1 - fall) - 2.5 * scr, 0, 0.2 + 0.4 * scr], rSh: [-1.1 * (1 - fall) - 2.5 * scr, 0, -0.2 - 0.4 * scr], lEl: [-0.8 * (1 - scr), 0, 0], rEl: [-0.8 * (1 - scr), 0, 0], neck: [0.2 * fall, Math.sin(t * 8) * 0.4 * scr, 0] }));
      tiny.setMouth(0.4 * fall);
      cab.drawers.forEach((d, i) => { d.visible = i < 2; });
      scene.updateMatrixWorld(true);
      const tHand = handPos(tiny, 'l').add(handPos(tiny, 'r')).multiplyScalar(0.5);
      const scramble = range(t, 14.2, 17.8);
      folders.forEach((f, i) => {
        f.visible = inner.visible;
        if (t < 11.6) { f.position.copy(tHand).add(V(0, 0.02 + i * 0.012, 0.03)); f.rotation.set(0, -1.9, 0); }
        else if (t < 14.2) { const k = smooth(range(t, 11.6 + i * 0.05, 12.1 + i * 0.05)); f.position.copy(tHand).add(V(0.15 * Math.sin(i * 2.4) * k, -0.05 * k + 0.02 + i * 0.012 * (1 - k), 0.12 * Math.cos(i * 1.7) * k)); f.position.y = lerp(f.position.y, C.y + 1.1, k); f.rotation.set(-Math.PI / 2 * k, i, 0); }
        else { const a = i * 0.7 + scramble * 7; f.position.set(C.x + Math.cos(a) * (0.35 + 0.08 * i % 3), 1.25 + Math.sin(scramble * 6 + i) * 0.35 + i * 0.03, C.z + 0.1 + Math.sin(a) * 0.35); f.rotation.set(scramble * 9 + i, scramble * 5, i); }
      });
      fxC.drop.position.set(C.x - 0.1, 1.15, C.z + 0.35); fxC.drop.update(t - 11.7);
      // neurons sprout and wires reroute
      neurons.forEach((n, i) => { n.position.set(C.x + NPOS[i][0], NPOS[i][1], C.z + NPOS[i][2]); n.grow(smooth(range(t, 13.1 + i * 0.25, 13.8 + i * 0.25)) * (inner.visible ? 1 : 0)); n.rotation.y = t * 0.4 + i; });
      WIRES.forEach((w, i) => { const k = smooth(range(t, 15.0 + i * 0.18, 15.4 + i * 0.18)); w.visible = k > 0.02; w.scale.setScalar(Math.max(0.001, k)); w.material.emissiveIntensity = 0.6 + 0.6 * Math.max(0, Math.sin(t * 9 + i)); });
      fxC.sparks.position.set(C.x, 1.7, C.z + 0.3); fxC.sparks.update(t - 15.2);
      fxC.papers.position.set(C.x, 1.3, C.z + 0.3); fxC.papers.update(t - 16.3);
      hip.material.emissiveIntensity = 0.45 + 0.35 * Math.max(0, Math.sin(t * 5)) * smooth(range(t, 8.8, 9.3));
      hipGlow.material.opacity = 0.7 * smooth(range(t, 8.9, 9.4));

      // ================= D =================
      const toMirror = smooth(range(t, 20.4, 21.1));
      const tp = V(D.x - 0.05, 0.04, D.z + 0.3).lerp(V(D.x + 0.5, 0.04, MZ + 0.42), toMirror);
      tod.root.position.copy(tp); tod.root.rotation.y = lerp(1.9, Math.PI, toMirror);
      const point = smooth(range(t, 18.3, 18.6)) * (1 - smooth(range(t, 20.2, 20.5)));
      const babble = t > 18.5 && t < 20.3 ? Math.max(0, Math.sin(t * 13)) : 0;
      const wave = smooth(range(t, 21.2, 21.4)) * (1 - smooth(range(t, 22.3, 22.6)));
      const peek = smooth(range(t, 21.9, 22.3));
      const tpose = over(toMirror > 0.05 && toMirror < 0.95 ? WALK(t * 9, 0.7) : STAND(t, 4), { rSh: [-1.4 * point - 2.2 * wave, 0, -0.15 - 0.3 * wave + Math.sin(t * 12) * 0.25 * wave], rEl: [-0.2 - 0.3 * wave, 0, 0], neck: [0.05, -0.4 * peek + 0.3 * point, 0.35 * peek], lSh: [-0.3 * point, 0, 0.3] });
      tod.setPose(tpose); tod.setMouth(0.6 * babble + 0.3 * peek);
      // reflection: same pose, mirrored about the glass
      const rp = tp.clone(); rp.z = 2 * MZ - tp.z;
      refl.root.position.copy(rp); refl.root.rotation.y = tod.root.rotation.y; refl.root.scale.set(0.5, 0.5, -0.5);
      refl.setPose(tpose); refl.setMouth(0.3 * peek);
      refl.root.visible = t > 19.0 && t < 23.0;
      momD.root.position.set(D.x - 0.45, 0, D.z - 1.1); momD.root.rotation.y = 0.5;
      momD.setPose(over(STAND(t, 5), { neck: [0.35, 0.3, -0.1], spine: [0.2, 0, 0], lSh: [-0.5, 0, 0.3], lEl: [-1.2, 0, 0], rSh: [-0.2, 0, -0.2] }));
      dog.position.set(D.x + 0.55, 0.04, D.z - 0.15); dog.rotation.y = -1.6; dog.pose && dog.pose(t, { graze: 0 });
      talk.position.set(tp.x - 0.1, 1.05 + Math.sin(t * 3) * 0.02, tp.z + 0.1);
      talk.set(0.34 * easeOut(range(t, 18.6, 18.85)) * (1 - smooth(range(t, 20.2, 20.5))), 0);
      dogThought.position.set(D.x + 0.55, 0.85, D.z - 0.15); dogThought.set(0.26 * easeOut(range(t, 18.3, 18.5)) * (1 - smooth(range(t, 20.2, 20.5))), 0);
      scene.updateMatrixWorld(true);
      qD.position.copy(tp).add(V(0, 1.0, 0)); qD.update(t - 22.0);
      // memories float up and away
      const memK = range(t, 22.8, 26.4);
      cards.forEach((m, i) => {
        const st = 22.95 + i * 0.35, k = clamp((t - st) / 3.0);
        m.visible = t > st && t < 26.6;
        const hp = V(D.x - 0.05, 0.9, D.z + 0.3);
        m.position.copy(hp).add(V(Math.sin(i * 2.1 + k * 3) * (0.25 + k * 0.6), k * 3.2 + 0.1, Math.cos(i * 1.3) * 0.25 - k * 1.2));
        m.rotation.set(0, Math.sin(t + i) * 0.4, Math.sin(t * 1.3 + i) * 0.25);
        m.scale.setScalar(Math.max(0.001, easeOut(clamp((t - st) / 0.3))) * (1 - 0.6 * k));
        m.material.opacity = 1 - smooth(clamp((k - 0.55) / 0.45));
      });
      if (memK > 0) { tod.root.position.set(D.x - 0.05, 0.04, D.z + 0.3); tod.root.rotation.y = 0.15; const reach = smooth(range(t, 24.6, 25.0)); tod.setPose(over(STAND(t, 4), { neck: [-0.55, 0, 0], lSh: [-2.6 * reach, 0, 0.3], rSh: [-2.6 * reach, 0, -0.3] })); tod.setMouth(0.3 + 0.3 * reach); refl.root.visible = false; }

      // ================= E =================
      bday.root.position.set(E.x, 0, E.z + 0.25); bday.root.rotation.y = Math.PI;
      const blow = smooth(range(t, 28.6, 28.85)) * (1 - smooth(range(t, 29.4, 29.7)));
      const cheer = smooth(range(t, 29.3, 29.6));
      bday.setPose(over(STAND(t, 6), { spine: [0.35 * blow, 0, 0], neck: [0.25 - 0.4 * cheer, 0, 0], lSh: [-2.6 * cheer, 0, 0.35], rSh: [-2.6 * cheer, 0, -0.35] }));
      bday.setMouth(0.8 * blow + 0.6 * cheer);
      bday.root.rotation.y = lerp(Math.PI, 0.0, smooth(range(t, 29.2, 29.8)));
      const fam = [[momE, -0.75, -0.95, 0.4], [dadE, 0.75, -0.95, -0.4], [granE, -1.05, -0.2, 0.9], [sib, 0.95, -0.15, -0.9]];
      fam.forEach(([h, x, z, ry], i) => { h.root.position.set(E.x + x, 0, E.z + z); h.root.rotation.y = ry; h.setPose(over(STAND(t, i), t > 26.8 && t < 28.5 || t > 29.0 ? CLAP(t, i) : { neck: [0.2, 0, 0] })); h.setMouth(t > 29.0 ? 0.6 : 0.25 * Math.max(0, Math.sin(t * 7 + i))); });
      balloons.forEach((b, i) => { b.rotation.z = Math.sin(t * 1.3 + i) * 0.06; b.position.y = 0.55 + Math.sin(t * 1.1 + i) * 0.03; });
      ck.flames.forEach((f, i) => { const out = t > 28.9 + i * 0.06; f.visible = !out; f.scale.setScalar(0.12 * (1 + 0.15 * Math.sin(t * 23 + i))); });
      fxE.blow.position.set(E.x, 0.95, E.z - 0.3); fxE.blow.update(t - 28.95);
      fxE.confetti.forEach((f, i) => { f.position.set(E.x + (i - 1) * 0.6, 1.4, E.z - 0.4); f.update(t - 29.15 - i * 0.05); });
      // the first memory pops up, glows and stays
      const fm = easeOut(range(t, 27.4, 27.8));
      firstMem.visible = fm > 0.01; firstMem.position.set(E.x - 0.55, 1.55 + Math.sin(t * 2) * 0.03, E.z - 0.1); firstMem.scale.setScalar(Math.max(0.001, fm * 1.25)); firstMem.rotation.set(0, 0.25, -0.08);
      memGlow.position.copy(firstMem.position).add(V(0, 0, -0.02)); memGlow.material.opacity = 0.8 * fm * (0.85 + 0.15 * Math.sin(t * 4));

      // ---------- camera ----------
      const [cp, lk] = track(t);
      const sh = shake(t, 0.7, 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-4, 9, 5));
      const fd = cp.distanceTo(lk);
      return { dof: { focus: fd, aperture: fd < 6 ? 0.0012 : 0.0004, maxblur: 0.005 }, bloom: 0.4, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
