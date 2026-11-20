import * as THREE from 'three';
import { rng, glowTexture } from './textures.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
const shadowAll = (g) => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const mesh = (geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => { const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); m.scale.set(...s); return m; };
const lumpy = (geo, amt, seed) => {
  const r = rng(seed), p = geo.attributes.position, map = new Map();
  for (let i = 0; i < p.count; i++) {
    const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    if (!map.has(k)) map.set(k, 1 + (r() - 0.5) * amt);
    const f = map.get(k); p.setXYZ(i, p.getX(i) * f, p.getY(i) * f, p.getZ(i) * f);
  }
  geo.computeVertexNormals(); return geo;
};

// ---------------- world ----------------
function groundTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#7fb24a'; g.fillRect(0, 0, 512, 512);
  const r = rng(4);
  for (let i = 0; i < 900; i++) {
    const x = r() * 512, y = r() * 512, s = 10 + r() * 50;
    const gr = g.createRadialGradient(x, y, 0, x, y, s);
    const col = r() < 0.5 ? '120,170,62' : r() < 0.6 ? '146,184,78' : '104,150,56';
    gr.addColorStop(0, `rgba(${col},0.5)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 30); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
export function world() {
  const g = new THREE.Group();
  const ground = mesh(new THREE.PlaneGeometry(400, 400), std(0xffffff, { map: groundTexture(), roughness: 0.95 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  ground.receiveShadow = true; g.add(ground);
  // far mountains
  const r = rng(12), mtM = std(0x7d93a8, { roughness: 1, flatShading: true }), snow = std(0xf2f6fa, { roughness: 0.9, flatShading: true });
  for (let i = 0; i < 16; i++) {
    const h = 18 + r() * 26, w = h * (1.2 + r() * 0.6);
    const x = -60 + i * 9 + (r() - 0.5) * 6, z = -85 - r() * 25;
    const m = mesh(lumpy(new THREE.ConeGeometry(w, h, 9, 3), 0.12, i + 3), mtM, [x, h / 2 - 1, z]); g.add(m);
    const s = mesh(lumpy(new THREE.ConeGeometry(w * 0.3, h * 0.3, 9, 1), 0.1, i + 40), snow, [x, h * 0.85 - 1, z]); g.add(s);
  }
  // green hills nearer
  const hillM = std(0x6e9f45, { roughness: 1 });
  for (let i = 0; i < 12; i++) { const s = 10 + r() * 12; g.add(mesh(new THREE.SphereGeometry(s, 24, 12), hillM, [-40 + i * 9 + (r() - 0.5) * 4, -s * 0.72, -42 - r() * 14], [0, 0, 0], [1.6, 1, 1])); }
  return g;
}
// instanced grass tufts scattered on the plain, avoiding rects [[x0,z0,x1,z1]]
export function grass(n = 2200, area = [-12, -22, 56, 10], avoid = []) {
  const blade = new THREE.ConeGeometry(0.022, 0.2, 3); blade.translate(0, 0.1, 0);
  const geos = [];
  for (let k = 0; k < 9; k++) { const b = blade.clone(); b.rotateZ((k - 4) * 0.16); b.rotateY(k * 0.7); b.translate((k - 4) * 0.018, 0, ((k * 37) % 5 - 2) * 0.015); geos.push(b); }
  const tuft = mergeGeos(geos);
  const m = new THREE.InstancedMesh(tuft, std(0xffffff, { roughness: 0.9 }), n), r = rng(31), mt = new THREE.Matrix4(), q = new THREE.Quaternion();
  let i = 0;
  while (i < n) {
    const x = area[0] + r() * (area[2] - area[0]), z = area[1] + r() * (area[3] - area[1]);
    if (avoid.some(a => x > a[0] && x < a[2] && z > a[1] && z < a[3])) continue;
    q.setFromAxisAngle(V(0, 1, 0), r() * 6.28); const s = 0.6 + r() * 0.6;
    mt.compose(V(x, 0, z), q, V(s, s * (0.8 + r() * 0.6), s)); m.setMatrixAt(i, mt);
    m.setColorAt(i, new THREE.Color().setHSL(0.23 + r() * 0.05, 0.45, 0.36 + r() * 0.1)); i++;
  }
  m.receiveShadow = true; return m;
}
function mergeGeos(list) {
  list = list.map(g => g.index ? g.toNonIndexed() : g);
  let n = 0; list.forEach(g => n += g.attributes.position.count);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
  list.forEach(g => { const gg = g.index ? g.toNonIndexed() : g; pos.set(gg.attributes.position.array, o * 3); nor.set(gg.attributes.normal.array, o * 3); o += gg.attributes.position.count; });
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, o * 3), 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor.subarray(0, o * 3), 3));
  return out;
}

export function tree({ h = 3.2, fruit = 0, seed = 1, col = 0x4f8f3a } = {}) {
  const g = new THREE.Group(), r = rng(seed);
  g.add(mesh(new THREE.CylinderGeometry(0.11, 0.18, h * 0.55, 10), std(0x6b4a2e), [0, h * 0.275, 0]));
  const leaf = std(col, { roughness: 0.8, flatShading: true });
  const blobs = [];
  for (let i = 0; i < 5; i++) {
    const s = h * (0.22 + r() * 0.1), p = [(r() - 0.5) * h * 0.35, h * (0.62 + r() * 0.22), (r() - 0.5) * h * 0.3];
    g.add(mesh(lumpy(new THREE.IcosahedronGeometry(s, 1), 0.18, seed * 10 + i), leaf, p)); blobs.push([p, s]);
  }
  const fruits = [];
  if (fruit) {
    const fm = std(0xe0302a, { roughness: 0.35 });
    for (let i = 0; i < fruit; i++) {
      const [p, s] = blobs[i % blobs.length], a = r() * 6.28, b = (r() - 0.3) * 1.2;
      const f = mesh(new THREE.SphereGeometry(0.07, 14, 10), fm, [p[0] + Math.cos(a) * Math.cos(b) * s * 0.98, p[1] + Math.sin(b) * s * 0.98, p[2] + Math.sin(a) * Math.cos(b) * s * 0.98]);
      g.add(f); fruits.push(f);
    }
  }
  g.userData.fruits = fruits;
  return shadowAll(g);
}
export function rock(s = 1, seed = 2, col = 0x9a958c) {
  const m = mesh(lumpy(new THREE.DodecahedronGeometry(0.5 * s, 1), 0.3, seed), std(col, { flatShading: true, roughness: 0.95 }), [0, 0.22 * s, 0], [0, 0, 0], [1.2, 0.6, 1]);
  m.castShadow = m.receiveShadow = true; return m;
}

// river strip along z at x = cx
export function river(cx, w = 2.6, z0 = -60, z1 = 30) {
  const g = new THREE.Group();
  const bank = mesh(new THREE.PlaneGeometry(w + 1.2, z1 - z0), std(0xc9b48a, { roughness: 1 }), [cx, 0.004, (z0 + z1) / 2], [-Math.PI / 2, 0, 0]); bank.receiveShadow = true; g.add(bank);
  const c = document.createElement('canvas'); c.width = 128; c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#2f7fb8'; x.fillRect(0, 0, 128, 512); const r = rng(5);
  for (let i = 0; i < 140; i++) { x.strokeStyle = `rgba(255,255,255,${0.15 + r() * 0.3})`; x.lineWidth = 1 + r() * 2; const yy = r() * 512, xx = r() * 128; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + (r() - 0.5) * 6, yy + 8 + r() * 20); x.stroke(); }
  const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(1, 18); tx.colorSpace = THREE.SRGBColorSpace;
  const water = mesh(new THREE.PlaneGeometry(w, z1 - z0), new THREE.MeshStandardMaterial({ color: 0xffffff, map: tx, roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.9 }), [cx, 0.03, (z0 + z1) / 2], [-Math.PI / 2, 0, 0]);
  water.receiveShadow = true; g.add(water);
  for (let i = 0; i < 26; i++) { const rr = rock(0.25 + r() * 0.35, 60 + i, 0x8d8a83); rr.position.set(cx + (r() < 0.5 ? -1 : 1) * (w / 2 + 0.3 + r() * 0.3), 0.04, z0 + r() * (z1 - z0)); g.add(rr); }
  g.update = (t) => { tx.offset.y = -t * 0.35; };
  return g;
}

// ---------------- animals ----------------
// generic cartoon quadruped. kind: deer | wolf | goat | sheep
export function quadruped(kind = 'deer', seed = 1) {
  const C = {
    deer: { body: 0xa8683a, belly: 0xf0dcc0, len: 0.95, h: 0.95, leg: 0.06, neck: 0.55, head: 0.15, tail: 0.1 },
    wolf: { body: 0x50555c, belly: 0xc7c9cc, len: 0.85, h: 0.62, leg: 0.055, neck: 0.25, head: 0.16, tail: 0.38 },
    goat: { body: 0xf1ece2, belly: 0xffffff, len: 0.7, h: 0.55, leg: 0.045, neck: 0.25, head: 0.12, tail: 0.08 },
    sheep: { body: 0xf7f3ea, belly: 0xffffff, len: 0.72, h: 0.52, leg: 0.045, neck: 0.15, head: 0.12, tail: 0.06 },
  }[kind];
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const bm = std(C.body, { roughness: kind === 'sheep' ? 1 : 0.75 }), lm = kind === 'sheep' ? std(0x3a3430) : bm;
  const by = C.h * 0.62;
  body.position.y = by;
  if (kind === 'sheep') { const r = rng(seed); for (let i = 0; i < 14; i++) body.add(mesh(new THREE.SphereGeometry(0.15, 12, 8), bm, [(r() - 0.5) * 0.25, (r() - 0.3) * 0.18, (r() - 0.5) * C.len * 0.8])); }
  else body.add(mesh(new THREE.CapsuleGeometry(C.h * 0.22, C.len * 0.62, 6, 16), bm, [0, 0, 0], [Math.PI / 2, 0, 0]));
  body.add(mesh(new THREE.CapsuleGeometry(C.h * 0.16, C.len * 0.45, 6, 12), std(C.belly), [0, -C.h * 0.08, 0], [Math.PI / 2, 0, 0]));
  // neck + head
  const neck = new THREE.Group(); neck.position.set(0, C.h * 0.1, C.len * 0.38); body.add(neck);
  neck.add(mesh(new THREE.CapsuleGeometry(C.h * 0.08, C.neck * 0.7, 4, 10), bm, [0, C.neck * 0.4, 0.05], [0.45, 0, 0]));
  const head = new THREE.Group(); head.position.set(0, C.neck * 0.8, 0.12); neck.add(head);
  const hm = kind === 'sheep' ? std(0x3a3430) : bm;
  head.add(mesh(new THREE.SphereGeometry(C.head, 16, 12), hm, [0, 0, 0], [0, 0, 0], kind === 'wolf' ? [0.75, 0.75, 1.0] : [0.85, 0.9, 1.1]));
  const snoutL = kind === 'wolf' ? 0.26 : 0.14;
  head.add(mesh(new THREE.CapsuleGeometry(C.head * 0.5, snoutL, 4, 10), hm, [0, -0.03, C.head * 0.9], [Math.PI / 2 - 0.15, 0, 0]));
  head.add(mesh(new THREE.SphereGeometry(0.025, 8, 6), std(0x111111, { roughness: 0.3 }), [0, -0.01, C.head * 0.9 + snoutL * 0.7 + C.head * 0.4]));
  const eyeM = std(0x111111, { roughness: 0.2 }), white = std(0xffffff, { roughness: 0.3 });
  for (const s of [1, -1]) {
    head.add(mesh(new THREE.SphereGeometry(C.head * 0.26, 12, 8), white, [s * C.head * 0.48, C.head * 0.3, C.head * 0.62]));
    head.add(mesh(new THREE.SphereGeometry(C.head * 0.15, 10, 8), eyeM, [s * C.head * 0.55, C.head * 0.32, C.head * 0.76]));
    const ear = mesh(new THREE.ConeGeometry(C.head * (kind === 'wolf' ? 0.32 : 0.22), C.head * (kind === 'wolf' ? 0.8 : 0.9), 6), hm, [s * C.head * 0.5, C.head * 0.85, -C.head * 0.1], [0, 0, -s * (kind === 'goat' || kind === 'sheep' ? 1.3 : 0.35)]);
    if (kind !== 'wolf') ear.scale.z = 0.4; head.add(ear);
    if (kind === 'deer') { // antlers
      const am = std(0xe8dcc0);
      const a0 = mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.36, 6), am, [s * 0.08, 0.3, -0.02], [0, 0, -s * 0.35]); head.add(a0);
      for (let k = 0; k < 3; k++) head.add(mesh(new THREE.CylinderGeometry(0.01, 0.014, 0.16, 6), am, [s * (0.1 + k * 0.04), 0.27 + k * 0.08, 0.04], [0.6, 0, -s * 0.1]));
    }
    if (kind === 'goat') head.add(mesh(new THREE.ConeGeometry(0.025, 0.2, 6), std(0x8a7a62), [s * 0.05, 0.16, -0.05], [-0.6, 0, -s * 0.2]));
  }
  if (kind === 'wolf') { // teeth for the snarl
    const tm = std(0xffffff, { roughness: 0.3 });
    for (const s of [1, -1]) head.add(mesh(new THREE.ConeGeometry(0.012, 0.04, 5), tm, [s * 0.035, -0.09, C.head * 1.05], [Math.PI, 0, 0]));
  }
  // tail
  const tail = new THREE.Group(); tail.position.set(0, C.h * 0.1, -C.len * 0.42); body.add(tail);
  tail.add(mesh(new THREE.CapsuleGeometry(kind === 'wolf' ? 0.06 : 0.04, C.tail, 4, 8), kind === 'deer' ? std(0xffffff) : bm, [0, -C.tail * 0.3, -C.tail * 0.35], [-2.2, 0, 0]));
  // legs (pivot at top)
  const legs = [];
  for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const L = new THREE.Group(); L.position.set(x * C.h * 0.14, by - C.h * 0.05, z * C.len * 0.3); g.add(L);
    const len = by - C.h * 0.05;
    L.add(mesh(new THREE.CylinderGeometry(C.leg, C.leg * 0.7, len, 8), lm, [0, -len / 2, 0]));
    L.add(mesh(new THREE.CylinderGeometry(C.leg * 0.8, C.leg * 0.9, 0.05, 8), std(0x2a2420), [0, -len + 0.025, 0]));
    legs.push(L);
  }
  shadowAll(g);
  // gait: speed 0 idle, 1 gallop. phase in radians
  g.pose = (t, { run = 0, graze = 0, snarl = 0, freq = 9 } = {}) => {
    const p = t * freq;
    legs.forEach((L, i) => { const off = [0, 0.6, 3.14, 3.74][i]; L.rotation.x = Math.sin(p + off) * 0.75 * run; });
    body.position.y = by + Math.abs(Math.sin(p)) * 0.08 * run * C.h;
    body.rotation.x = Math.sin(p) * 0.08 * run;
    neck.rotation.x = graze * 1.0 + Math.sin(p) * 0.15 * run - snarl * 0.35;
    head.rotation.x = graze * 0.3 + snarl * 0.3;
    tail.rotation.x = Math.sin(t * 6) * 0.25;
  };
  g.pose(0);
  return g;
}
export function fish() {
  const g = new THREE.Group(), m = std(0x8fb7d0, { roughness: 0.3, metalness: 0.3 });
  g.add(mesh(new THREE.SphereGeometry(0.1, 16, 10), m, [0, 0, 0], [0, 0, 0], [0.55, 0.8, 2]));
  g.add(mesh(new THREE.ConeGeometry(0.08, 0.13, 4), m, [0, 0, -0.24], [-Math.PI / 2, 0, 0], [0.25, 1, 1]));
  g.add(mesh(new THREE.SphereGeometry(0.018, 8, 6), std(0x111111), [0.045, 0.025, 0.13]));
  g.add(mesh(new THREE.SphereGeometry(0.018, 8, 6), std(0x111111), [-0.045, 0.025, 0.13]));
  return shadowAll(g);
}

// ---------------- props ----------------
export function spear(len = 1.7) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.016, 0.02, len, 8), std(0x8a6a44), [0, 0, 0]));
  g.add(mesh(lumpy(new THREE.ConeGeometry(0.04, 0.16, 5), 0.2, 3), std(0x5b5e63, { flatShading: true }), [0, len / 2 + 0.07, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.06, 8), std(0x4a2f1a), [0, len / 2 - 0.02, 0]));
  return shadowAll(g);   // along +Y, centred
}
export function stoneAxe() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.5, 8), std(0x8a6a44), [0, 0, 0]));
  g.add(mesh(lumpy(new THREE.DodecahedronGeometry(0.08, 0), 0.25, 9), std(0x6c7075, { flatShading: true }), [0.05, 0.22, 0], [0, 0, 0], [1.4, 0.8, 0.5]));
  return shadowAll(g);
}
export function torch() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.6, 8), std(0x6b4a2e), [0, 0, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.1, 8), std(0x3a2a1a), [0, 0.3, 0]));
  const fl = flame(0.45); fl.position.y = 0.36; g.add(fl); g.userData.flame = fl;
  return shadowAll(g);
}
export function basket() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.18, 16, 1, true), std(0xc79a5a, { side: THREE.DoubleSide }), [0, 0.09, 0]));
  g.add(mesh(new THREE.CircleGeometry(0.12, 16), std(0xb08850), [0, 0.005, 0], [-Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.TorusGeometry(0.17, 0.012, 6, 24), std(0x9a7240), [0, 0.18, 0], [Math.PI / 2, 0, 0]));
  return shadowAll(g);
}
export function gourd() {
  const g = new THREE.Group(), m = std(0xc8a24a, { roughness: 0.6 });
  g.add(mesh(new THREE.SphereGeometry(0.09, 14, 10), m, [0, 0, 0]));
  g.add(mesh(new THREE.SphereGeometry(0.055, 12, 8), m, [0, 0.11, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.05, 8), m, [0, 0.17, 0]));
  return shadowAll(g);
}
// flickering flame: additive sprites; update(t)
let _gt;
export function flame(size = 1) {
  _gt = _gt || glowTexture('rgba(255,240,200,1)', 'rgba(255,120,20,0)');
  const g = new THREE.Group(), parts = [], r = rng(77);
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: _gt, color: new THREE.Color().setHSL(0.06 + r() * 0.06, 1, 0.55), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false }));
    s.userData = { ph: r() * 6.28, x: (r() - 0.5) * 0.25, sp: 1.5 + r() }; g.add(s); parts.push(s);
  }
  g.update = (t, k = 1) => parts.forEach((s, i) => {
    const u = (t * s.userData.sp + s.userData.ph) % 1;
    s.position.set(s.userData.x * size * (1 - u), u * 0.55 * size, 0);
    s.scale.setScalar(size * (0.55 - u * 0.4) * k); s.material.opacity = (1 - u) * 0.85 * k;
  });
  g.update(0); return g;
}
export function campfire() {
  const g = new THREE.Group(), lm = std(0x5a3b22), r = rng(8);
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; g.add(mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.6, 8), lm, [Math.cos(a) * 0.12, 0.1, Math.sin(a) * 0.12], [Math.cos(a) * 1.1, 0, Math.sin(a) * 1.1 + Math.PI / 2 * 0], [1, 1, 1])); }
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; const st = rock(0.28, 90 + i, 0x7d7a73); st.position.set(Math.cos(a) * 0.48, 0, Math.sin(a) * 0.48); g.add(st); }
  const embers = mesh(new THREE.CircleGeometry(0.22, 16), new THREE.MeshBasicMaterial({ color: 0xff6a1a, toneMapped: false }), [0, 0.03, 0], [-Math.PI / 2, 0, 0]); g.add(embers);
  // spit with meat
  const sm = std(0x6b4a2e);
  for (const s of [1, -1]) { g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.85, 6), sm, [s * 0.55, 0.38, 0], [0, 0, s * 0.15])); }
  g.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.3, 6), sm, [0, 0.78, 0], [0, 0, Math.PI / 2]));
  const meat = mesh(new THREE.CapsuleGeometry(0.11, 0.3, 6, 12), std(0x9a4a2a, { roughness: 0.5 }), [0, 0.78, 0], [0, 0, Math.PI / 2]); g.add(meat);
  shadowAll(g);
  const fl = flame(0.9); fl.position.y = 0.08; g.add(fl);
  const light = new THREE.PointLight(0xff8a3a, 0, 6, 1.6); light.position.y = 0.6; g.add(light);
  g.userData = { fl, light, meat, embers };
  g.update = (t, k = 1) => { fl.update(t, k); light.intensity = k * (5 + Math.sin(t * 17) * 0.8 + Math.sin(t * 7.3) * 0.6); meat.rotation.x = t * 1.2; embers.material.color.setRGB(1, 0.42 * k + 0.1, 0.1 * k); };
  return g;
}
// lean-to hide tent: build k 0..1 (poles then cover)
export function tent(seed = 3, col = 0xb08a5c) {
  const g = new THREE.Group(), pm = std(0x6b4a2e), poles = [], R = 1.0, H = 2.0;
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * 6.28, p = new THREE.Group(); p.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
    const top = V(0, H + 0.3, 0).sub(p.position), len = top.length();
    p.add(mesh(new THREE.CylinderGeometry(0.025, 0.03, len, 6), pm, [0, len / 2, 0]));
    p.quaternion.setFromUnitVectors(V(0, 1, 0), top.normalize()); g.add(p); poles.push(p);
  }
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(90,60,30,0.45)'; x.lineWidth = 3;
  for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(0, 40 + i * 40); x.bezierCurveTo(80, 30 + i * 40, 170, 50 + i * 40, 256, 40 + i * 40); x.stroke(); }
  x.fillStyle = 'rgba(160,40,20,0.7)'; for (let i = 0; i < 10; i++) { x.beginPath(); x.moveTo(i * 26, 210); x.lineTo(i * 26 + 13, 190); x.lineTo(i * 26 + 26, 210); x.fill(); }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = THREE.RepeatWrapping; tx.repeat.set(3, 1);
  const cover = mesh(new THREE.ConeGeometry(R * 1.02, H, 24, 1, true, 0.5, 6.28 - 1.0), std(col, { map: tx, side: THREE.DoubleSide, roughness: 0.95 }), [0, H / 2, 0]);
  g.add(cover); shadowAll(g);
  g.build = (k) => {
    poles.forEach((p, i) => { const pk = Math.min(1, Math.max(0, k * 2.2 - i * 0.12)); p.scale.setScalar(Math.max(0.001, pk)); p.visible = pk > 0.01; });
    const ck = Math.min(1, Math.max(0, (k - 0.5) / 0.5)); cover.visible = ck > 0.01;
    cover.scale.set(1, Math.max(0.001, ck), 1); cover.position.y = H / 2 * ck;
  };
  g.build(1); return g;
}
// permanent round house: mud wall + thatch roof. build k 0..1
export function house(seed = 1) {
  const g = new THREE.Group(), r = rng(seed);
  const wall = mesh(new THREE.CylinderGeometry(1.25, 1.3, 1.3, 24), std(0xc89a68, { roughness: 1 }), [0, 0.65, 0]);
  const door = mesh(new THREE.PlaneGeometry(0.6, 0.95), std(0x3a2a1c), [0, 0.48, 1.31]);
  const roof = mesh(lumpy(new THREE.ConeGeometry(1.75, 1.5, 24, 3), 0.05, seed + 4), std(0xd9b45a, { roughness: 1, flatShading: true }), [0, 2.0, 0]);
  const wg = new THREE.Group(); wg.add(wall, door); g.add(wg); g.add(roof); shadowAll(g);
  g.rotation.y = r() * 6.28;
  g.build = (k) => {
    const a = Math.min(1, k * 1.8), b = Math.min(1, Math.max(0, (k - 0.45) / 0.55));
    wg.scale.set(1, Math.max(0.001, a), 1); wg.visible = a > 0.01;
    roof.position.y = 1.3 + 0.7 + (1 - b) * 1.2; roof.scale.setScalar(Math.max(0.001, b)); roof.visible = b > 0.01;
  };
  g.build(1); return g;
}
// wheat field: rows of stalks; grow k 0..1 ; area [x0,z0,x1,z1]
export function wheat(area, n = 1500, seed = 5) {
  const stalk = new THREE.CylinderGeometry(0.008, 0.012, 0.75, 4); stalk.translate(0, 0.375, 0);
  const headG = new THREE.CapsuleGeometry(0.025, 0.1, 3, 6); headG.translate(0, 0.8, 0);
  const sm = new THREE.InstancedMesh(stalk, std(0xffffff), n), hm = new THREE.InstancedMesh(headG, std(0xffffff, { roughness: 0.7 }), n);
  const r = rng(seed), P = [], rows = 14;
  for (let i = 0; i < n; i++) {
    const row = i % rows, x = area[0] + (row + 0.5) * (area[2] - area[0]) / rows + (r() - 0.5) * 0.12, z = area[1] + r() * (area[3] - area[1]);
    P.push({ x, z, s: 0.8 + r() * 0.4, ph: r() * 6.28, d: (x - area[0]) / (area[2] - area[0]) });
  }
  // tilled soil
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#6d4a2c'; x.fillRect(0, 0, 256, 64); for (let i = 0; i < rows; i++) { x.fillStyle = '#4e321d'; x.fillRect(i * 256 / rows + 4, 0, 256 / rows * 0.45, 64); }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  const soil = mesh(new THREE.PlaneGeometry(area[2] - area[0], area[3] - area[1]), std(0xffffff, { map: tx, roughness: 1 }), [(area[0] + area[2]) / 2, 0.006, (area[1] + area[3]) / 2], [-Math.PI / 2, 0, 0]);
  soil.receiveShadow = true;
  const g = new THREE.Group(); g.add(soil, sm, hm); sm.castShadow = hm.castShadow = true;
  const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), green = new THREE.Color(0x7cc04a), gold = new THREE.Color(0xe8c25a), cc = new THREE.Color();
  g.soil = soil;
  g.update = (t, grow, ripe) => {
    P.forEach((p, i) => {
      const k = Math.min(1, Math.max(0, grow * 1.6 - p.d * 0.6)), s = Math.max(0.001, k * p.s);
      e.set(Math.sin(t * 2 + p.ph + p.x) * 0.08, p.ph, 0); q.setFromEuler(e);
      mt.compose(V(p.x, 0, p.z), q, V(1, s, 1)); sm.setMatrixAt(i, mt);
      const hk = Math.max(0.001, Math.min(1, Math.max(0, k * 2 - 1)));
      mt.compose(V(p.x, 0, p.z), q, V(hk, s, hk)); hm.setMatrixAt(i, mt);
      cc.copy(green).lerp(gold, ripe); sm.setColorAt(i, cc); hm.setColorAt(i, cc);
    });
    for (const m of [sm, hm]) { m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; }
  };
  g.update(0, 1, 1);
  return g;
}
export function fence(pts) {
  const g = new THREE.Group(), m = std(0x7a5634);
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i]; g.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.9, 6), m, [x, 0.45, z]));
    if (i < pts.length - 1) {
      const [x2, z2] = pts[i + 1], L = Math.hypot(x2 - x, z2 - z), a = Math.atan2(z2 - z, x2 - x);
      for (const y of [0.35, 0.7]) g.add(mesh(new THREE.BoxGeometry(L, 0.05, 0.04), m, [(x + x2) / 2, y, (z + z2) / 2], [0, -a, 0]));
    }
  }
  return shadowAll(g);
}
// soft smoke column; update(t)
export function smoke(n = 10, seed = 3) {
  const tex = glowTexture('rgba(255,255,255,0.9)', 'rgba(255,255,255,0)'), g = new THREE.Group(), r = rng(seed), P = [];
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xdedede, transparent: true, depthWrite: false })); s.userData.ph = i / n + r() * 0.05; g.add(s); P.push(s); }
  g.update = (t, k = 1) => P.forEach(s => { const u = (t * 0.18 + s.userData.ph) % 1; s.position.set(Math.sin(u * 5 + s.userData.ph * 9) * 0.25 + u * 0.8, u * 4, 0); s.scale.setScalar(0.4 + u * 1.4); s.material.opacity = Math.sin(u * Math.PI) * 0.5 * k; });
  return g;
}

// ---------------- hologram icons (modern stuff that didn't exist) ----------------
function iconTex(draw) { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); draw(g); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
export const ICONS = {
  job: () => iconTex(g => { // briefcase + tie
    g.fillStyle = '#6b4226'; rr(g, 186, 110, 140, 70, 24); g.fill(); g.fillStyle = '#ffffff00'; g.clearRect(0, 0, 0, 0);
    g.fillStyle = '#f5f0e6'; rr(g, 212, 132, 88, 48, 12); g.fill();
    g.fillStyle = '#8b5a2b'; rr(g, 76, 170, 360, 250, 36); g.fill();
    g.fillStyle = '#6b4226'; g.fillRect(76, 270, 360, 16);
    g.fillStyle = '#e9c46a'; rr(g, 228, 252, 56, 52, 10); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.18)'; rr(g, 96, 186, 320, 60, 24); g.fill();
  }),
  office: () => iconTex(g => { // glass office tower
    g.fillStyle = '#5c6b7d'; g.fillRect(150, 60, 212, 400); g.fillStyle = '#4a5664'; g.fillRect(150, 440, 212, 30);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 4; c++) { g.fillStyle = (r + c) % 3 ? '#9fd3ff' : '#e8f6ff'; g.fillRect(166 + c * 48, 80 + r * 40, 36, 26); }
    g.fillStyle = '#2b3440'; g.fillRect(226, 400, 60, 60);
  }),
  money: () => iconTex(g => { // banknote + coins
    g.save(); g.translate(256, 220); g.rotate(-0.12);
    g.fillStyle = '#4caf50'; rr(g, -190, -95, 380, 190, 18); g.fill(); g.strokeStyle = '#2e7d32'; g.lineWidth = 10; rr(g, -170, -75, 340, 150, 12); g.stroke();
    g.fillStyle = '#2e7d32'; g.beginPath(); g.arc(0, 0, 56, 0, 7); g.fill(); g.fillStyle = '#c8f7c5'; g.font = '900 84px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', 0, 4); g.restore();
    for (let i = 0; i < 3; i++) { const x = 170 + i * 86, y = 380 - (i % 2) * 18; g.fillStyle = '#c99a1e'; g.beginPath(); g.ellipse(x, y + 10, 62, 62, 0, 0, 7); g.fill(); g.fillStyle = '#f2c94c'; g.beginPath(); g.ellipse(x, y, 62, 62, 0, 0, 7); g.fill(); g.fillStyle = '#d4a52a'; g.font = '900 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', x, y + 4); }
  }),
};
export function iconBubble(tex) {
  // round glass badge holding the icon + a red "no" slash that draws on
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.arc(256, 256, 240, 0, 7); g.fill();
  const bg = new THREE.CanvasTexture(c); bg.colorSpace = THREE.SRGBColorSpace;
  const grp = new THREE.Group();
  const base = new THREE.Sprite(new THREE.SpriteMaterial({ map: bg, transparent: true, depthWrite: false })); grp.add(base);
  const ic = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); ic.scale.setScalar(0.8); ic.position.z = 0.001; grp.add(ic);
  const no = document.createElement('canvas'); no.width = no.height = 512; const n = no.getContext('2d');
  n.strokeStyle = '#ff2a2a'; n.lineWidth = 46; n.beginPath(); n.arc(256, 256, 214, 0, 7); n.stroke();
  n.lineCap = 'round'; n.beginPath(); n.moveTo(105, 105); n.lineTo(407, 407); n.stroke();
  const nt = new THREE.CanvasTexture(no); nt.colorSpace = THREE.SRGBColorSpace;
  const ns = new THREE.Sprite(new THREE.SpriteMaterial({ map: nt, transparent: true, depthWrite: false, toneMapped: false })); grp.add(ns);
  grp.set = (k, nk) => {
    grp.visible = k > 0.01; grp.scale.setScalar(Math.max(0.001, k));
    base.material.opacity = ic.material.opacity = Math.min(1, k);
    ns.material.opacity = nk; ns.scale.setScalar(1 + (1 - nk) * 0.6);
  };
  return grp;
}
// big red stamp word (canvas sprite)
export function stamp(text, col = '#ff2a2a', w = 1.6) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 300; const g = c.getContext('2d');
  g.shadowColor = 'rgba(0,0,0,0.75)'; g.shadowBlur = 18;
  g.strokeStyle = col; g.lineWidth = 22; rr(g, 30, 30, 964, 240, 30); g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle'; if ('letterSpacing' in g) g.letterSpacing = '8px';
  let fs = 170; g.font = `400 ${fs}px Brand, sans-serif`; const mw = g.measureText(text).width; if (mw > 880) { fs = Math.floor(fs * 880 / mw); g.font = `400 ${fs}px Brand, sans-serif`; }
  g.lineWidth = 12; g.strokeStyle = 'rgba(0,0,0,0.55)'; g.strokeText(text, 512, 160); g.fillStyle = col; g.fillText(text, 512, 160);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false }));
  s.renderOrder = 40; s.userData.w = w; s.material.rotation = -0.18;
  s.set = (k) => { s.visible = k > 0.01; const pop = 1 + 2.2 * (1 - Math.min(1, k * 1.0)); s.scale.set(w * pop, w * 0.293 * pop, 1); s.material.opacity = Math.min(1, k * 1.5); };
  s.set(0); return s;
}
// sun disc for the time-lapse
export function sunDisc() { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,250,220,1)', 'rgba(255,200,80,0)'), color: 0xffe6a0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false, fog: false })); s.scale.setScalar(14); return s; }
