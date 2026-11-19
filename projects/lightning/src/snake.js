import * as THREE from 'three';
import { rng, glowTexture } from './textures.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
const mesh = (geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => { const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); m.scale.set(...s); return m; };
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

// anaconda skin: olive green with black ovals, yellow belly (u = around, v = along)
function skinTex() {
  const t = canvasTex(256, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#d8c25a'); gr.addColorStop(0.18, '#7d8a33'); gr.addColorStop(0.5, '#5f6e28'); gr.addColorStop(0.82, '#7d8a33'); gr.addColorStop(1, '#d8c25a');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = rng(11);
    for (let i = 0; i < 26; i++) { const y = i * 20 + (r() - 0.5) * 6; g.fillStyle = '#16180c'; g.beginPath(); g.ellipse(w * 0.5 + (i % 2 ? 22 : -22), y, 20, 13, 0, 0, 7); g.fill(); g.fillStyle = '#2a2c12'; g.beginPath(); g.ellipse(w * 0.5 + (i % 2 ? 22 : -22), y, 12, 7, 0, 0, 7); g.fill(); }
    for (let i = 0; i < 40; i++) { const y = r() * h; for (const x of [w * 0.22, w * 0.78]) { g.fillStyle = '#1a1a0e'; g.beginPath(); g.arc(x + (r() - 0.5) * 14, y, 7 + r() * 4, 0, 7); g.fill(); g.fillStyle = '#c9a23a'; g.beginPath(); g.arc(x + (r() - 0.5) * 4, y, 3, 0, 7); g.fill(); } }
    // scales
    g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 1;
    for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) { g.beginPath(); g.arc(x + ((y / 8) % 2) * 4, y, 4, 0, Math.PI); g.stroke(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// Tube snake whose centre line is supplied every frame.
// update(points[] head->tail (Vector3), radiusFn(i, n) , upHint)
export function snake(N = 150, RAD = 14, L = 8) {
  const g = new THREE.Group();
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * RAD * 3), nor = new Float32Array(N * RAD * 3), uv = new Float32Array(N * RAD * 2), idx = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < RAD; j++) { uv[(i * RAD + j) * 2] = j / (RAD - 1); uv[(i * RAD + j) * 2 + 1] = i / (N - 1) * L * 1.6; }
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < RAD - 1; j++) { const a = i * RAD + j, b = a + RAD; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  geo.setIndex(idx); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const mat = std(0xffffff, { map: skinTex(), roughness: 0.42, metalness: 0.05, transparent: true, opacity: 1, side: THREE.DoubleSide });
  const body = new THREE.Mesh(geo, mat); body.castShadow = true; body.receiveShadow = true; body.frustumCulled = false; g.add(body);
  // head (local: +Z = snout direction, +Y = top)
  const head = new THREE.Group(); g.add(head);
  const hm = std(0xffffff, { map: skinTex(), roughness: 0.42, transparent: true });
  const skull = new THREE.Group(); head.add(skull);
  skull.add(mesh(new THREE.SphereGeometry(0.15, 28, 18), hm, [0, 0.02, 0.06], [0, 0, 0], [1.05, 0.55, 1.7]));
  const jaw = new THREE.Group(); jaw.position.set(0, -0.02, -0.06); head.add(jaw);
  jaw.add(mesh(new THREE.SphereGeometry(0.14, 24, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), hm, [0, 0.02, 0.13], [0, 0, 0], [1.0, 0.45, 1.6]));
  const mouthM = std(0xc8505a, { roughness: 0.5, side: THREE.DoubleSide });
  const mouthTop = mesh(new THREE.CircleGeometry(0.14, 24), mouthM, [0, -0.005, 0.13], [Math.PI / 2, 0, 0], [1.0, 1.6, 1]); skull.add(mouthTop);
  const mouthBot = mesh(new THREE.CircleGeometry(0.13, 24), mouthM, [0, 0.015, 0.13], [-Math.PI / 2, 0, 0], [1.0, 1.6, 1]); jaw.add(mouthBot);
  const tooth = std(0xffffff, { roughness: 0.3 });
  for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 2.4; const tt = mesh(new THREE.ConeGeometry(0.008, 0.03, 5), tooth, [Math.sin(a) * 0.12, -0.02, 0.13 + Math.cos(a) * 0.2], [Math.PI, 0, 0]); skull.add(tt); }
  const eyeW = std(0xd9b52a, { roughness: 0.15, emissive: 0x3a2a00 }), eyeP = std(0x050505, { roughness: 0.1 });
  for (const s of [1, -1]) {
    skull.add(mesh(new THREE.SphereGeometry(0.035, 16, 12), eyeW, [s * 0.11, 0.07, 0.14]));
    skull.add(mesh(new THREE.SphereGeometry(0.03, 12, 10), eyeP, [s * 0.128, 0.075, 0.155], [0, 0, 0], [0.35, 1, 0.6]));
    skull.add(mesh(new THREE.SphereGeometry(0.012, 8, 6), eyeP, [s * 0.04, 0.03, 0.33]));
  }
  const tongue = new THREE.Group(); tongue.position.set(0, -0.01, 0.3); head.add(tongue);
  const tm = std(0xb0203a);
  tongue.add(mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.16, 6), tm, [0, 0, 0.08], [Math.PI / 2, 0, 0]));
  for (const s of [1, -1]) tongue.add(mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.06, 5), tm, [s * 0.012, 0, 0.18], [Math.PI / 2, 0, s * 0.4]));
  head.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.mat = mat; g.headMat = hm; g.head = head; g.jaw = jaw; g.tongue = tongue;

  const P = [], T = [], Nn = [], B = [];
  for (let i = 0; i < N; i++) { P.push(V(0, 0, 0)); T.push(V(0, 0, 1)); Nn.push(V(0, 1, 0)); B.push(V(1, 0, 0)); }
  // pts: function(s 0..1 head->tail) -> Vector3 ; rad: function(s, i) -> radius ; jawOpen 0..1 ; headScale
  g.update = (pts, rad, { jaw: jo = 0, headScale = 1, tongue: tg = 0, opacity = 1 } = {}) => {
    for (let i = 0; i < N; i++) P[i].copy(pts(i / (N - 1)));
    for (let i = 0; i < N; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(N - 1, i + 1)]; T[i].subVectors(a, b).normalize(); }   // tangent points toward the head
    // parallel-transport frames
    let up = Math.abs(T[0].y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
    Nn[0].copy(up).addScaledVector(T[0], -up.dot(T[0])).normalize();
    for (let i = 1; i < N; i++) { const n = Nn[i - 1].clone().addScaledVector(T[i], -Nn[i - 1].dot(T[i])); if (n.lengthSq() < 1e-8) n.copy(Nn[i - 1]); Nn[i].copy(n.normalize()); }
    for (let i = 0; i < N; i++) B[i].crossVectors(T[i], Nn[i]);
    for (let i = 0; i < N; i++) {
      const s = i / (N - 1), r = rad(s, i);
      for (let j = 0; j < RAD; j++) {
        const a = j / (RAD - 1) * Math.PI * 2 + Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a), k = (i * RAD + j) * 3;
        const nx = Nn[i].x * ca + B[i].x * sa, ny = Nn[i].y * ca + B[i].y * sa, nz = Nn[i].z * ca + B[i].z * sa;
        const flat = 0.82 + 0.18 * Math.abs(ca);   // slightly oval cross-section
        pos[k] = P[i].x + nx * r * flat; pos[k + 1] = P[i].y + ny * r * (ny > 0 ? 1 : 0.85); pos[k + 2] = P[i].z + nz * r * flat;
        nor[k] = nx; nor[k + 1] = ny; nor[k + 2] = nz;
      }
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.normal.needsUpdate = true; geo.computeBoundingSphere();
    // head at P[0], snout along T[0], top along Nn[0] (made to point up)
    const z = T[0].clone(), yv = V(0, 1, 0).addScaledVector(z, -z.y).normalize(), xv = new THREE.Vector3().crossVectors(yv, z);
    head.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xv, yv, z));
    head.position.copy(P[0]).addScaledVector(z, 0.02 * headScale);
    head.scale.setScalar(headScale);
    jaw.rotation.x = jo * 1.35; tongue.visible = tg > 0.01 && jo < 0.2; tongue.scale.set(1, 1, Math.max(0.01, tg));
    mat.opacity = opacity; hm.opacity = opacity; mat.depthWrite = opacity > 0.95; hm.depthWrite = opacity > 0.95;
    return { head: P[0].clone(), dir: z };
  };
  return g;
}

// jungle bits
export function fern(s = 1, seed = 1) {
  const g = new THREE.Group(), r = rng(seed), m = std(0x3f8a3a, { side: THREE.DoubleSide, roughness: 0.7 });
  const leafG = new THREE.PlaneGeometry(0.16, 0.9, 1, 6); const p = leafG.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) + 0.45; p.setX(i, p.getX(i) * Math.sin(Math.min(1, y / 0.9) * Math.PI) * 1.2); p.setY(i, y); p.setZ(i, -y * y * 0.45); }
  leafG.computeVertexNormals();
  for (let i = 0; i < 9; i++) { const l = new THREE.Mesh(leafG, m); l.rotation.set(-0.5 - r() * 0.4, i / 9 * 6.28 + r() * 0.3, 0, 'YXZ'); l.scale.setScalar(s * (0.8 + r() * 0.4)); g.add(l); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
export function jungleTree(h = 7, seed = 1) {
  const g = new THREE.Group(), r = rng(seed);
  g.add(mesh(new THREE.CylinderGeometry(0.22, 0.4, h, 10), std(0x5a4632, { roughness: 0.95 }), [0, h / 2, 0]));
  for (let i = 0; i < 4; i++) g.add(mesh(new THREE.ConeGeometry(0.15, 0.9, 6), std(0x5a4632), [Math.cos(i * 1.6) * 0.45, 0.3, Math.sin(i * 1.6) * 0.45], [Math.sin(i * 1.6) * 0.6, 0, -Math.cos(i * 1.6) * 0.6]));
  const leaf = std(0x2f6e2c, { flatShading: true, roughness: 0.8 });
  for (let i = 0; i < 6; i++) g.add(mesh(new THREE.IcosahedronGeometry(1.1 + r() * 0.8, 1), leaf, [(r() - 0.5) * 2.4, h + (r() - 0.3) * 1.2, (r() - 0.5) * 2.4]));
  // hanging vines
  const vm = std(0x3d6b2a);
  for (let i = 0; i < 4; i++) { const len = 2 + r() * 3; g.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, len, 5), vm, [(r() - 0.5) * 2.2, h - len / 2, (r() - 0.5) * 2.2])); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
export function heartSprite() {
  const t = canvasTex(256, 256, (g) => { g.fillStyle = '#ff2a3a'; g.beginPath(); g.moveTo(128, 220); g.bezierCurveTo(10, 140, 30, 30, 128, 80); g.bezierCurveTo(226, 30, 246, 140, 128, 220); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(88, 92, 22, 14, -0.6, 0, 7); g.fill(); });
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
}
export function iconTex(kind) {
  return canvasTex(512, 512, (g) => {
    if (kind === 'fang') { g.fillStyle = '#c8505a'; g.beginPath(); g.ellipse(256, 200, 190, 90, 0, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; for (const x of [150, 362]) { g.beginPath(); g.moveTo(x - 38, 200); g.lineTo(x, 400); g.lineTo(x + 38, 200); g.fill(); } for (let i = 0; i < 4; i++) { const x = 210 + i * 30; g.beginPath(); g.moveTo(x - 12, 200); g.lineTo(x, 250); g.lineTo(x + 12, 200); g.fill(); } }
    if (kind === 'o2') { g.fillStyle = '#7fd3ff'; g.beginPath(); g.arc(256, 256, 170, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(196, 190, 50, 0, 7); g.fill(); g.fillStyle = '#0d3b5c'; g.font = '900 170px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('O₂', 256, 270); }
  });
}
// ruler bar sprite (for "too wide at the shoulders")
export function barSprite(col, label) {
  const t = canvasTex(512, 128, (g) => { g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(20, 64); g.lineTo(492, 64); g.stroke(); for (const x of [20, 492]) { g.beginPath(); g.moveTo(x, 30); g.lineTo(x, 98); g.stroke(); } g.font = "400 44px Brand, sans-serif"; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 6; g.strokeText(label, 256, 38); g.fillText(label, 256, 38); });
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
}
