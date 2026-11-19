import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { infoCard, burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { tree, stamp, iconBubble } from './ancient.js';

export const DURATION = 33.4;
export const CAPTIONS = [
  [0.0, 'Could you outrun a tsunami?'],
  [2.08, 'In the deep ocean'], [3.38, 'a tsunami travels'], [4.5, 'as fast as a jet plane'], [6.38, 'over 800 km per hour'],
  [9.19, 'Near the shore'], [10.2, 'it slows down to around'], [11.45, '30 to 50 km per hour'],
  [13.98, "That's as fast as"], [14.96, 'the fastest human sprinter'], [16.82, 'and most of us'], [17.63, 'are much slower'],
  [19.08, "And the water doesn't stop"], [20.83, 'It keeps flooding inland'], [22.4, 'carrying cars'], [23.55, 'trees and debris'],
  [25.08, "So don't try to outrun it"], [26.96, 'Run uphill'], [27.86, 'or climb a tall, strong building'], [29.74, 'as soon as the ground shakes'], [31.32, 'or the sea pulls back', 33.2],
];
export const FADES = [];

const waveZ = (t) => t < 8.5 ? lerp(-260, -170, (t - 0) / 8.5) : t < 13.3 ? lerp(-170, -45, (t - 8.5) / 4.8) : t < 19 ? lerp(-45, 0, (t - 13.3) / 5.7) : 0;
const floodZ = (t) => t < 19 ? -1 : lerp(0, 46, easeOut(range(t, 19, 25.5)));
const floodH = (t) => 1.7 * smooth(range(t, 19, 20.5)) * (1 - 0.15 * smooth(range(t, 27, 33)));
const BLD = V(8, 0, 21), STAIR_X0 = 5.2, STAIR_X1 = 10.8, FLOOR = 3, FLOORS = 6, FRONT = BLD.z - 3.2;
function stairPos(s) {   // s 0..1 up the zigzag on the building front
  const f = s * FLOORS, k = Math.min(FLOORS - 1, Math.floor(f)), u = f - k, dir = k % 2 ? -1 : 1;
  const x = dir > 0 ? lerp(STAIR_X0, STAIR_X1, u) : lerp(STAIR_X1, STAIR_X0, u);
  return [V(x, k * FLOOR + u * FLOOR, FRONT - 0.6), dir];
}
const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
function RUN(p, a = 1, lean = 0.22) { const s = Math.sin(p); return { lHip: [-0.85 * s * a, 0, 0.05], rHip: [0.85 * s * a, 0, -0.05], lKn: [(0.25 + 1.0 * Math.max(0, Math.sin(p + 1.3))) * a, 0, 0], rKn: [(0.25 + 1.0 * Math.max(0, Math.sin(p + 1.3 + Math.PI))) * a, 0, 0], lAn: [0.2 * a, 0, 0], rAn: [0.2 * a, 0, 0], lSh: [0.85 * s * a, 0, 0.2], rSh: [-0.85 * s * a, 0, -0.2], lEl: [-1.3 * a - 0.2, 0, 0], rEl: [-1.3 * a - 0.2, 0, 0], spine: [lean * a, 0, 0], chest: [0.05 * a, Math.sin(p) * 0.12 * a, 0], neck: [-lean * 0.7 * a, 0, 0], drop: -0.06 * a + Math.abs(Math.cos(p)) * 0.05 * a }; }
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function waveMesh(W = 140) {
  const prof = [[-34, 0], [-18, 0.6], [-9, 2.2], [-4, 5.0], [-1.5, 7.4], [0.3, 8.4], [1.6, 8.2], [2.4, 7.2], [2.2, 6.0], [1.2, 5.4]];
  const NX = 80, NP = prof.length, pos = [], col = [], idx = [];
  for (let i = 0; i <= NX; i++) for (let j = 0; j < NP; j++) { const x = -W / 2 + W * i / NX, [z, y] = prof[j]; const wob = Math.sin(i * 0.35) * 0.6; pos.push(x, y * (1 + 0.08 * Math.sin(i * 0.5)), z + wob); const foam = Math.max(0, (y - 6.2) / 2.2); col.push(lerp(0.12, 0.95, foam), lerp(0.45, 0.97, foam), lerp(0.58, 1.0, foam)); }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NP - 1; j++) { const a = i * NP + j, b = a + NP; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.18, metalness: 0.05, side: THREE.DoubleSide, transparent: true, opacity: 0.96 }));
  m.castShadow = true; return m;
}
function house(seed) {
  const r = rng(seed), g = new THREE.Group(), w = 3 + r() * 2, h = 2.6 + r() * 2.5, d = 3 + r() * 1.5;
  const wallT = canvasTex(128, 128, (x) => { x.fillStyle = ['#f2e2c4', '#e8c9a8', '#d8e6ef', '#f6d6d6', '#e2efd8'][seed % 5]; x.fillRect(0, 0, 128, 128); x.fillStyle = '#4a6a8a'; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) x.fillRect(18 + i * 60, 18 + j * 60, 30, 30); });
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ map: wallT, roughness: 0.85 })); b.position.y = h / 2; g.add(b);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, 1.6, 4), new THREE.MeshStandardMaterial({ color: [0xb5452e, 0x5a6f8a, 0x8a4a2a][seed % 3], roughness: 0.8 })); roof.position.y = h + 0.8; roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, d / w); g.add(roof);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g;
}
function carMesh(col) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.35, metalness: 0.3 });
  { const bd = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.9), m); bd.position.set(0, 0.45, 0); g.add(bd); }
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.4, 0.82), new THREE.MeshStandardMaterial({ color: 0x9fc4dd, roughness: 0.1 })); cab.position.set(-0.1, 0.88, 0); g.add(cab);
  for (const [x, z] of [[-0.6, 0.45], [0.6, 0.45], [-0.6, -0.45], [0.6, -0.45]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 14), new THREE.MeshStandardMaterial({ color: 0x1a1a1a })); w.rotation.x = Math.PI / 2; w.position.set(x, 0.22, z); g.add(w); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
}
function jet() {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0xeef2f6, roughness: 0.35, metalness: 0.3 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, 7, 6, 14), m); body.rotation.x = Math.PI / 2; g.add(body);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(10, 0.12, 1.6), m); wing.position.z = 0.4; g.add(wing);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 1.0), m); tail.position.set(0, 1.0, -3.4); g.add(tail);
  const ht = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.1, 0.8), m); ht.position.set(0, 0.3, -3.4); g.add(ht);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0x2b6cff })); stripe.position.y = 0.05; g.add(stripe);
  return g;
}
function speedHud() {
  const c = document.createElement('canvas'); c.width = 768; c.height = 220; const g = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false })); s.renderOrder = 31; let last = '';
  s.set = (v, label, col = '#ffffff') => { const k = Math.round(v) + label; if (k === last) return; last = k; g.clearRect(0, 0, 768, 220); g.fillStyle = 'rgba(6,20,36,0.72)'; g.beginPath(); g.roundRect(6, 6, 756, 208, 36); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 4; g.stroke();
    g.font = "400 40px Brand, sans-serif"; g.fillStyle = 'rgba(255,255,255,0.75)'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(label, 40, 52); g.font = "400 110px Brand, sans-serif"; g.fillStyle = col; g.fillText(`${Math.round(v)} km/h`, 40, 140); t.needsUpdate = true; };
  s.set(0, ''); return s;
}
function raceHud() {
  const c = document.createElement('canvas'); c.width = 768; c.height = 380; const g = c.getContext('2d');
  g.fillStyle = 'rgba(6,20,36,0.72)'; g.beginPath(); g.roundRect(6, 6, 756, 368, 36); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 4; g.stroke();
  const rows = [['WAVE', 40, '#4ab8ff'], ['SPRINTER', 44, '#ffd23f'], ['YOU', 15, '#ff6b6b']];
  rows.forEach(([n, v, col], i) => { const y = 80 + i * 105; g.font = "400 44px Brand, sans-serif"; g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(n, 36, y); g.fillStyle = col; g.beginPath(); g.roundRect(270, y - 26, v * 9, 52, 20); g.fill(); g.fillStyle = '#fff'; g.font = "400 38px Brand, sans-serif"; g.fillText(`${v}`, 285 + v * 9, y); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false })); s.renderOrder = 31; return s;
}
function icon(draw) { const t = canvasTex(512, 512, draw); return iconBubble(t); }

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 12, sunDir: [-5, 10, 4], sun: 2.2 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x3f6f9a); u.mid.value.set(0x7fa6c2); u.horizon.value.set(0xc9d6de); u.floorC.value.set(0x5a7a8a);
  scene.fog = new THREE.Fog(0xc0ced8, 60, 320);
  const key = scene.userData.key; key.color.set(0xfff0dc);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xd8e8f8); hemi.groundColor.set(0x8a9a8a); hemi.intensity = 0.8;
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  // ocean + beach + town ground
  const ot = canvasTex(256, 256, (g) => { g.fillStyle = '#2a6f9a'; g.fillRect(0, 0, 256, 256); const r = rng(2); for (let i = 0; i < 300; i++) { g.strokeStyle = `rgba(255,255,255,${0.06 + r() * 0.12})`; g.lineWidth = 1 + r() * 2; const x = r() * 256, y = r() * 256; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y - 3, x + 20, y); g.stroke(); } });
  ot.wrapS = ot.wrapT = THREE.RepeatWrapping; ot.repeat.set(60, 60);
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(800, 600), new THREE.MeshStandardMaterial({ map: ot, roughness: 0.15, metalness: 0.1 })); ocean.rotation.x = -Math.PI / 2; ocean.position.set(0, -0.05, -300); scene.add(ocean);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(800, 9), new THREE.MeshStandardMaterial({ color: 0xe6d3a2, roughness: 0.95 })); sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0, 4.5); sand.receiveShadow = true; scene.add(sand);
  const land = new THREE.Mesh(new THREE.PlaneGeometry(800, 300), new THREE.MeshStandardMaterial({ color: 0x7fa85a, roughness: 0.95 })); land.rotation.x = -Math.PI / 2; land.position.set(0, -0.01, 159); land.receiveShadow = true; scene.add(land);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(800, 4), new THREE.MeshStandardMaterial({ color: 0x55585e, roughness: 0.8 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 11); road.receiveShadow = true; scene.add(road);
  const hill = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 16), new THREE.MeshStandardMaterial({ color: 0x6f9a4a, roughness: 1 })); hill.scale.set(1.2, 0.5, 1); hill.position.set(-34, -4, 50); scene.add(hill);
  // town
  const r = rng(9);
  for (let i = 0; i < 22; i++) { const x = -26 + (i % 11) * 5 + (r() - 0.5), z = 15 + Math.floor(i / 11) * 9 + (r() - 0.5) * 2; if (Math.abs(x - BLD.x) < 5 && z < 26) continue; const h = house(i); h.position.set(x, 0, z); h.rotation.y = (r() - 0.5) * 0.3; scene.add(h); }
  const bldT = canvasTex(256, 512, (x) => { x.fillStyle = '#c9cdd2'; x.fillRect(0, 0, 256, 512); x.fillStyle = '#5a7a9a'; for (let i = 0; i < 4; i++) for (let j = 0; j < 12; j++) x.fillRect(16 + i * 60, 14 + j * 42, 40, 26); });
  const bld = new THREE.Mesh(new THREE.BoxGeometry(6.4, FLOOR * FLOORS + 0.3, 6.4), new THREE.MeshStandardMaterial({ map: bldT, roughness: 0.8 })); bld.position.set(BLD.x, (FLOOR * FLOORS + 0.3) / 2, BLD.z); bld.castShadow = bld.receiveShadow = true; scene.add(bld);
  const stairM = new THREE.MeshStandardMaterial({ color: 0x8a9098, roughness: 0.6, metalness: 0.3 });
  for (let k = 0; k < FLOORS; k++) { const a = stairPos(k / FLOORS + 0.0001)[0], b = stairPos((k + 0.999) / FLOORS)[0]; const mid = a.clone().lerp(b, 0.5), len = a.distanceTo(b); const ramp = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 1.1), stairM); ramp.position.copy(mid).add(V(0, -0.06, 0)); ramp.rotation.z = Math.atan2(b.y - a.y, b.x - a.x); ramp.castShadow = true; scene.add(ramp);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.05), stairM); rail.position.copy(mid).add(V(0, 0.9, -0.5)); rail.rotation.z = ramp.rotation.z; scene.add(rail); }
  for (let i = 0; i < 14; i++) { const tr = tree({ h: 3 + r() * 1.5, seed: 70 + i, col: 0x4f8f3a }); const x = (i % 2 ? 1 : -1) * (13 + r() * 18); tr.position.set(x, 0, 9 + r() * 4); scene.add(tr); }
  // cars, trees and debris that the flood carries
  const debris = [];
  [0xe63946, 0x2b6cff, 0xffc233, 0xf2f2f2, 0x2a9d8f].forEach((col, i) => { const cm = carMesh(col); cm.position.set(-12 + i * 5.5, 0, 11 + (i % 2) * 1.2); cm.rotation.y = (i % 2) * Math.PI; scene.add(cm); debris.push({ o: cm, x: cm.position.x, z: cm.position.z, ph: i, rot: cm.rotation.y }); });
  for (let i = 0; i < 4; i++) { const tr = tree({ h: 2.6, seed: 90 + i }); tr.position.set(-16 + i * 3.2, 0, 7.5); scene.add(tr); debris.push({ o: tr, x: tr.position.x, z: 7.5, ph: i + 10, rot: 0, tree: true }); }
  for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.8 + r(), 0.3, 0.5 + r() * 0.6), new THREE.MeshStandardMaterial({ color: [0x8a6a44, 0xa0522d, 0x6b4a2e][i % 3], roughness: 0.9 })); b.position.set(-14 + r() * 28, 0.15, 5 + r() * 4); b.castShadow = true; scene.add(b); debris.push({ o: b, x: b.position.x, z: b.position.z, ph: i + 20, rot: r() * 3 }); }
  // the wave, flood
  const wave = waveMesh(); scene.add(wave);
  const crestSpray = []; for (let i = 0; i < 40; i++) { const s = glowSprite(0xffffff, 1.6); s.userData = { x: -60 + i * 3, ph: Math.random() }; scene.add(s); crestSpray.push(s); }
  const flood = new THREE.Mesh(new THREE.PlaneGeometry(140, 1, 40, 1), new THREE.MeshStandardMaterial({ color: 0x5a7a6a, roughness: 0.2, transparent: true, opacity: 0.92 })); flood.rotation.x = -Math.PI / 2; scene.add(flood);
  const foam = []; for (let i = 0; i < 30; i++) { const s = glowSprite(0xf2f6f8, 1.2); s.userData.x = -45 + i * 3; scene.add(s); foam.push(s); }
  const plane = jet(); scene.add(plane);
  // people
  const hero = makeHuman('casual', { shirt: 0xffc233, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const ghost = makeHuman('casual', {}); scene.add(ghost.root);
  ghost.root.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }); o.castShadow = false; } });
  const spd = speedHud(), race = raceHud(); scene.add(spd, race);
  const shakeI = icon((g) => { g.strokeStyle = '#2b3a5a'; g.lineWidth = 16; g.beginPath(); g.moveTo(60, 256); for (let x = 60; x < 452; x += 8) g.lineTo(x, 256 + Math.sin(x * 0.12) * (x > 180 && x < 340 ? 120 : 20)); g.stroke(); });
  const seaI = icon((g) => { g.fillStyle = '#e6d3a2'; g.fillRect(60, 300, 392, 140); g.fillStyle = '#2a6f9a'; g.beginPath(); g.moveTo(60, 300); g.lineTo(200, 300); g.lineTo(200, 240); g.lineTo(60, 240); g.fill(); g.strokeStyle = '#ff4a4a'; g.lineWidth = 18; g.beginPath(); g.moveTo(400, 210); g.lineTo(230, 210); g.stroke(); g.fillStyle = '#ff4a4a'; g.beginPath(); g.moveTo(210, 210); g.lineTo(260, 180); g.lineTo(260, 240); g.fill(); });
  scene.add(shakeI, seaI);
  const fx = { roof: burst(0x5be37d, 100, 1), hit: burst(0xffffff, 140, 2) };
  Object.values(fx).forEach(f => scene.add(f));
  const safe = stamp('SAFE!', '#5be37d', 0.42); scene.add(safe);
  const card = infoCard(); scene.add(card);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      ot.offset.set(t * 0.01, t * 0.02);
      const wz = waveZ(t), fz = floodZ(t), fh = floodH(t);
      const breaking = smooth(range(t, 17.5, 19));
      wave.position.set(0, -0.1, wz); wave.scale.set(1, lerp(1, 0.25, breaking), 1); wave.visible = t < 20;
      crestSpray.forEach((s, i) => { const u2 = (t * 0.8 + s.userData.ph) % 1; s.position.set(s.userData.x + Math.sin(i + t) * 0.5, 8.3 * wave.scale.y + u2 * 1.5, wz + 1.0 + u2 * 1.5); s.material.opacity = (1 - u2) * 0.7 * (t < 19.5 ? 1 : 0); s.scale.setScalar(1.2 + u2 * 1.8); });
      flood.visible = t > 18.9; flood.position.set(0, Math.max(0.02, fh), fz / 2 - 2); flood.scale.set(1, Math.max(0.01, fz + 4), 1);
      foam.forEach((s, i) => { s.position.set(s.userData.x + Math.sin(t * 2 + i) * 0.4, fh + 0.2, fz + Math.sin(i * 3 + t * 3) * 0.3); s.material.opacity = t > 19 && t < 26 ? 0.8 : 0; s.scale.setScalar(1.0 + Math.sin(t * 4 + i) * 0.3); });
      fx.hit.position.set(0, 2, 1); fx.hit.update(t - 19.0);
      debris.forEach(d => { const caught = fz > d.z - 1; if (caught) { const drift = Math.max(0, fz - d.z) * 0.85; d.o.position.set(d.x + Math.sin(d.ph + t) * 0.6, fh - (d.tree ? 0.4 : 0.25) + Math.sin(t * 2 + d.ph) * 0.08, d.z + drift); d.o.rotation.set(Math.sin(t + d.ph) * 0.15, d.rot + drift * 0.08, d.tree ? Math.PI / 2 * smooth(clamp(drift / 3)) : Math.sin(t * 1.3 + d.ph) * 0.12); } });
      // jet beside the wave far out
      const jk = range(t, 4.3, 9.0); plane.visible = t > 4.0 && t < 9.5; plane.position.set(9, 12, wz - 30 + jk * 60); plane.rotation.set(0, 0, -0.05);
      // ================= HERO =================
      let hp = V(0, 0, 2.5), rot = Math.PI, pose = STAND(t);
      const turn = smooth(range(t, 0.9, 1.5));
      rot = Math.PI * (1 - turn);
      pose = over(pose, { neck: [-0.1, 0, 0], lSh: [-0.3 * turn, 0, 0.5 * turn], rSh: [-0.3 * turn, 0, -0.5 * turn] });
      hero.setMouth(0.35 * turn);
      if (t > 13.5) { // runs inland, then to the building and up
        const rk = range(t, 13.8, 20.4), climb = range(t, 20.6, 28.6);
        if (t < 20.6) { hp = V(lerp(0, 5.0, smooth(rk)), 0, lerp(2.5, FRONT - 0.6, rk)); rot = Math.atan2(5.0, FRONT - 3.1); pose = RUN(t * 9, 1); }
        else if (climb < 1) { const [p, dir] = stairPos(climb); hp = p; rot = dir > 0 ? Math.PI / 2 : -Math.PI / 2; pose = RUN(t * 8, 0.7, 0.35); }
        else { hp = V(BLD.x, FLOOR * FLOORS + 0.15, BLD.z - 2.2); rot = 0; const wave2 = Math.sin(t * 8); pose = over(STAND(t), { rSh: [-2.6, 0, -0.3 + wave2 * 0.25], rEl: [-0.3, 0, 0], lSh: [-2.6, 0, 0.3 - wave2 * 0.25], lEl: [-0.3, 0, 0] }); hero.setMouth(0.4); }
      }
      hero.root.position.copy(hp); hero.root.rotation.set(0, rot, 0); hero.setPose(pose);
      // sprinter ghost pulls away from him
      const gk = smooth(range(t, 13.9, 14.3)) * (1 - smooth(range(t, 18.3, 18.8)));
      ghost.root.visible = gk > 0.01; const gz = lerp(2.5, 22, range(t, 13.8, 19)); ghost.root.position.set(-1.6, 0, gz); ghost.root.rotation.y = 0; ghost.setPose(RUN(t * 11, 1)); ghost.root.scale.setScalar(gk);
      if (t > 13.5 && t < 20.6) { hero.root.rotation.y = 0; hero.root.position.x = lerp(0, 0, 0); hero.root.position.z = lerp(2.5, 9.5, range(t, 13.8, 19)) + (t > 19 ? (t - 19) * 4.5 : 0); hero.root.position.x = t > 19 ? lerp(0, 5.2, range(t, 19, 20.6)) : 0; if (t > 19) hero.root.rotation.y = Math.atan2(5.2, FRONT - 0.6 - 9.5); }
      // ---------- camera ----------
      let cp, lk;
      const W = (t2) => V(0, 5, waveZ(t2));
      if (t < 2.0) { cp = V(0.5, 2.0, 10.6).lerp(V(0.4, 2.1, 9.8), t / 2); lk = V(-0.2, 1.3, -20); }
      else if (t < 8.6) { const k = smooth(range(t, 2.0, 5.0)); cp = V(0.4, 2.1, 9.8).lerp(W(t).add(V(26, 9, 40)), k); lk = V(-0.2, 1.3, -20).lerp(W(t).add(V(4, 1, 0)), smooth(range(t, 2.0, 4.0))); }
      else if (t < 13.6) { cp = W(t).add(V(lerp(26, 18, range(t, 8.6, 13.6)), lerp(9, 6, range(t, 8.6, 13.6)), lerp(40, 30, range(t, 8.6, 13.6)))); lk = W(t).add(V(4, 1, 0)); }
      else if (t < 19.0) { const k = smooth(range(t, 13.6, 15.0)); const a = W(13.6).add(V(18, 6, 30)), b = V(6.5, 3.2, hero.root.position.z + 7); cp = a.lerp(b, k); lk = W(13.6).add(V(4, 1, 0)).lerp(V(0, 1.2, hero.root.position.z - 3), k); }
      else if (t < 25.0) { const k = smooth(range(t, 19.0, 20.5)); cp = V(6.5, 3.2, 16.5).lerp(V(-4, 17, -7), k); lk = V(0, 1.2, 6.5).lerp(V(0, 0, 16), k); }
      else { const k = smooth(range(t, 25.0, 26.5)); const s = clamp(range(t, 20.6, 28.6)); const hy = t < 28.6 ? stairPos(Math.min(0.999, s))[0].y : FLOOR * FLOORS; cp = V(-4, 17, -7).lerp(V(BLD.x - 3.5, hy + 2.5, BLD.z - 12), k); lk = V(0, 0, 16).lerp(V(BLD.x, hy + 0.9, FRONT), k); if (t > 28.6) { const e = smooth(range(t, 28.6, 30)); cp = cp.lerp(V(BLD.x - 3.5, FLOOR * FLOORS + 3.2, BLD.z - 9.5), e); lk = lk.lerp(V(BLD.x, FLOOR * FLOORS + 1.0, BLD.z - 2.2), e); } }
      const sh = shake(t, t > 18.5 && t < 21 ? 4 : 0.8, 3);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-5, 10, 4));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const sk = smooth(range(t, 6.2, 6.5)) * (1 - smooth(range(t, 13.7, 14.0)));
      const sv = t < 9.2 ? lerp(0, 800, easeOut(range(t, 6.3, 8.0))) : lerp(800, 40, easeInOut(range(t, 10.2, 12.5)));
      spd.set(sv, t < 9.2 ? 'DEEP OCEAN' : 'NEAR THE SHORE', t < 9.2 ? '#4ab8ff' : '#ffd23f');
      spd.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.22); spd.scale.set(0.6 * sk, 0.172 * sk, 1); spd.material.opacity = sk; spd.visible = sk > 0.01;
      const rk2 = smooth(range(t, 14.0, 14.3)) * (1 - smooth(range(t, 18.6, 18.9)));
      race.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.18); race.scale.set(0.6 * rk2, 0.297 * rk2, 1); race.material.opacity = rk2; race.visible = rk2 > 0.01;
      const ik1 = easeOut(range(t, 30.3, 30.55)), ik2 = easeOut(range(t, 31.5, 31.75));
      shakeI.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(rt, -0.17).addScaledVector(upv, -0.12); shakeI.set(0.2 * ik1, 0);
      seaI.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(rt, 0.17).addScaledVector(upv, -0.12); seaI.set(0.2 * ik2, 0);
      safe.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.12); safe.set(t > 29.0 ? easeOut(range(t, 29.0, 29.16)) * (1 - smooth(range(t, 30.1, 30.4))) : 0);
      fx.roof.position.copy(hp).add(V(0, 1.5, 0)); fx.roof.update(t - 28.8);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 2.0, 'COULD YOU', 'OUTRUN IT?', '#ffffff', 'a tsunami'],
        [2.08, 9.0, 'DEEP OCEAN', 'JET SPEED', '#4ab8ff', '800+ km/h'],
        [9.19, 13.9, 'NEAR THE SHORE', 'SLOWS DOWN', '#ffd23f', '30-50 km/h'],
        [13.98, 18.9, 'NEAR THE SHORE', 'SPRINTER SPEED', '#ffd23f', 'most of us are slower'],
        [19.08, 22.4, 'THEN', 'FLOODS INLAND', '#7fd3ff', "it doesn't stop"], [22.4, 24.8, 'THEN', 'CARS + DEBRIS', '#7fd3ff', 'carried away'],
        [25.08, 27.86, 'DO THIS', 'RUN UPHILL', '#5be37d', "don't try to outrun it"], [27.86, 29.74, 'DO THIS', 'GO UP HIGH', '#5be37d', 'tall, strong building'], [29.74, 33.4, 'WARNING SIGNS', 'SHAKE / SEA PULLS', '#ff9a5a', 'move right away'],
      ];
      const cu = CARDS.find(([a2, b]) => t >= a2 && t < b); let ck = 0;
      if (cu) { card.set(cu[2], cu[3], cu[4], null, cu[5]); const grp = CARDS.filter(x => x[2] === cu[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk = 1 + 0.09 * Math.exp(-(t - cu[0]) * 9); card.scale.set(0.72 * pk, 0.281 * pk, 1); }
      card.material.opacity = ck; card.visible = ck > 0.01;
      const fd = cp.distanceTo(lk);
      return { dof: { focus: fd, aperture: 0.0003, maxblur: 0.003 }, bloom: 0.35, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
