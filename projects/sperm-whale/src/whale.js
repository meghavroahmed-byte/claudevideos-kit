import * as THREE from 'three';
import { fabricTexture, glowTexture, rng } from './textures.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------- ocean ----------------
export function ocean(scene) {
  // water colour: bright toward the surface, deep blue below
  const sky = scene.userData.sky; sky.visible = true;
  const u = sky.material.uniforms;
  u.top.value.set(0x6fd2f2); u.mid.value.set(0x1f86bf); u.horizon.value.set(0x0f5a8e); u.floorC.value.set(0x04203a);
  scene.background = null;
  scene.fog = new THREE.FogExp2(0x115b8f, 0.03);
  scene.traverse(o => {
    if (o.isHemisphereLight) { o.color.set(0xaee6ff); o.groundColor.set(0x0a2a44); o.intensity = 1.0; }
    if (o.isMesh && o.material && o.material.isShadowMaterial) o.visible = false;
  });
  scene.userData.key.color.set(0xd8f4ff);
  const r = rng(77);

  // ---- caustics: animated light pattern projected from above ----
  const TS = 256, tile = document.createElement('canvas'); tile.width = tile.height = TS;
  {
    const g = tile.getContext('2d'), img = g.createImageData(TS, TS), K = 2 * Math.PI / TS;
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      const w1 = Math.sin(x * K * 5 + 2.2 * Math.sin(y * K * 3));
      const w2 = Math.sin(y * K * 6 + 2.0 * Math.sin(x * K * 4));
      const w3 = Math.sin((x + y) * K * 4 + 1.6 * Math.sin((x - y) * K * 3));
      const v = Math.pow(1 - Math.min(Math.abs(w1), Math.abs(w2), Math.abs(w3)), 7);
      const i = (y * TS + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.min(255, 10 + v * 230); img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  const cc = document.createElement('canvas'); cc.width = cc.height = TS; const cg = cc.getContext('2d');
  const ctex = new THREE.CanvasTexture(cc); ctex.colorSpace = THREE.SRGBColorSpace;
  const caust = new THREE.SpotLight(0xcff6ff, 60, 60, 0.55, 0.6, 1.2);
  caust.map = ctex; caust.castShadow = true; caust.shadow.mapSize.set(1024, 1024); caust.shadow.bias = -0.0005;
  scene.add(caust, caust.target);

  // ---- surface overhead: rippling, bright ----
  const sc = document.createElement('canvas'); sc.width = sc.height = 256;
  { const g = sc.getContext('2d'); g.drawImage(tile, 0, 0); }
  const stex = new THREE.CanvasTexture(sc); stex.wrapS = stex.wrapT = THREE.RepeatWrapping; stex.repeat.set(18, 18);
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ map: stex, color: 0xbff2ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, fog: true, depthWrite: false }));
  surf.rotation.x = Math.PI / 2; surf.position.y = 17; scene.add(surf);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(4, 32), new THREE.MeshBasicMaterial({ map: glowTexture(), color: 0xffffff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, fog: false, depthWrite: false }));
  sun.rotation.x = Math.PI / 2; sun.position.set(-6, 16.9, 4); scene.add(sun);

  // ---- sea floor: sand, rocks, swaying weed ----
  const floorY = -10;
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(160, 160, 80, 80), new THREE.MeshStandardMaterial({ color: 0xcdbb8a, roughness: 0.95 }));
  { const p = sand.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 0.35) * 0.25 + Math.cos(p.getY(i) * 0.28) * 0.3 + (r() - 0.5) * 0.08); sand.geometry.computeVertexNormals(); }
  sand.rotation.x = -Math.PI / 2; sand.position.y = floorY; sand.receiveShadow = true; scene.add(sand);
  const rockM = new THREE.MeshStandardMaterial({ color: 0x6b7178, roughness: 0.9, flatShading: true });
  for (let i = 0; i < 40; i++) {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + r() * 1.4, 0), rockM);
    m.position.set((r() - 0.5) * 50, floorY + 0.1, (r() - 0.5) * 50 - 2); m.scale.y = 0.5 + r() * 0.6; m.rotation.set(r() * 3, r() * 3, r() * 3);
    m.castShadow = m.receiveShadow = true; scene.add(m);
  }
  const weedM = new THREE.MeshStandardMaterial({ color: 0x3d8a4a, roughness: 0.7 });
  const weeds = [];
  for (let i = 0; i < 70; i++) {
    const h = 1.5 + r() * 3.5, gw = new THREE.CylinderGeometry(0.03, 0.08, h, 6, 8); gw.translate(0, h / 2, 0);
    const m = new THREE.Mesh(gw, weedM); m.position.set((r() - 0.5) * 44, floorY, (r() - 0.5) * 44 - 2); m.castShadow = true; scene.add(m); weeds.push([m, r() * 6]);
  }

  // ---- fish schools ----
  const fishG = new THREE.ConeGeometry(0.08, 0.32, 8); fishG.rotateX(Math.PI / 2);
  const tailG = new THREE.ConeGeometry(0.07, 0.1, 3); tailG.rotateX(-Math.PI / 2); tailG.translate(0, 0, -0.2);
  const fishM = new THREE.MeshStandardMaterial({ color: 0xb9d4e6, metalness: 0.6, roughness: 0.3 });
  const schools = [
    { c: V(3.5, 1.2, 12.5), R: 2.2, n: 26, sp: 0.6, seed: 1 },
    { c: V(-6, 3, 4), R: 3.5, n: 40, sp: 0.45, seed: 2 },
    { c: V(7, -4, -6), R: 3, n: 34, sp: 0.5, seed: 3 },
  ].map(s => {
    const body = new THREE.InstancedMesh(fishG, fishM, s.n), tail = new THREE.InstancedMesh(tailG, fishM, s.n);
    body.frustumCulled = tail.frustumCulled = false; scene.add(body, tail);
    const rr = rng(s.seed * 13); s.off = Array.from({ length: s.n }, () => [r() * 6.28, (rr() - 0.5) * 1.2, (rr() - 0.5) * 0.8, 0.8 + rr() * 0.4]);
    return { ...s, body, tail };
  });
  const mt = new THREE.Matrix4(), qq = new THREE.Quaternion(), e = new THREE.Euler();

  // ---- marine snow + light shafts ----
  const N = 900;
  const pos = new Float32Array(N * 3), base = [];
  for (let i = 0; i < N; i++) base.push([(r() - 0.5) * 50, (r() - 0.5) * 24, (r() - 0.5) * 50, r()]);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const snow = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.05, map: glowTexture(), color: 0xdff4ff, transparent: true, opacity: 0.7, depthWrite: false }));
  snow.frustumCulled = false; scene.add(snow);
  const shaftTex = (() => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    const gx = g.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, 64, 256);
    return new THREE.CanvasTexture(c);
  })();
  const shafts = [];
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5 + r() * 3, 34), new THREE.MeshBasicMaterial({ map: shaftTex, color: 0xbff0ff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.position.set((r() - 0.5) * 36, 0, (r() - 0.5) * 36 + 2); m.rotation.set(0, r() * Math.PI, 0.22); scene.add(m); shafts.push([m, r() * 6]);
  }
  return {
    // focus: where the action is (caustic spot follows it); inside: 0..1 when we are inside the whale
    update(t, focus, inside = 0) {
      // caustic pattern: two drifting copies of the tile
      cg.globalCompositeOperation = 'source-over'; cg.fillStyle = '#000'; cg.fillRect(0, 0, TS, TS);
      cg.globalCompositeOperation = 'lighter'; cg.globalAlpha = 0.6;
      for (const [dx, dy] of [[t * 22, t * 9], [-t * 15, t * 19]]) {
        const ox = ((dx % TS) + TS) % TS, oy = ((dy % TS) + TS) % TS;
        for (const a of [0, -TS]) for (const b of [0, -TS]) cg.drawImage(tile, ox + a, oy + b);
      }
      cg.globalAlpha = 1; ctex.needsUpdate = true;
      caust.position.copy(focus).add(V(-3, 16, 2)); caust.target.position.copy(focus);
      caust.intensity = 14 * (1 - 0.8 * inside);
      stex.offset.set(t * 0.01, t * 0.006);
      for (let i = 0; i < N; i++) {
        const b = base[i];
        pos[i * 3] = b[0] + Math.sin(t * 0.3 + b[3] * 9) * 0.3;
        pos[i * 3 + 1] = ((b[1] - t * 0.15 * (0.5 + b[3]) + 12) % 24 + 24) % 24 - 12;
        pos[i * 3 + 2] = b[2];
      }
      geo.attributes.position.needsUpdate = true;
      for (const [m, p] of shafts) m.material.opacity = 0.16 + 0.08 * Math.sin(t * 0.7 + p);
      for (const [m, p] of weeds) { m.rotation.z = Math.sin(t * 0.9 + p) * 0.18; m.rotation.x = Math.cos(t * 0.7 + p) * 0.12; }
      for (const s of schools) s.off.forEach((o, i) => {
        const a = o[0] + t * s.sp * o[3];
        const p = V(s.c.x + Math.cos(a) * s.R * (1 + o[2] * 0.3), s.c.y + o[1] + Math.sin(a * 2) * 0.15, s.c.z + Math.sin(a) * s.R);
        e.set(0, -a, 0); qq.setFromEuler(e);
        mt.compose(p, qq, V(1, 1, 1)); s.body.setMatrixAt(i, mt);
        e.set(0, -a + Math.sin(t * 14 + i) * 0.4, 0); qq.setFromEuler(e); mt.compose(p, qq, V(1, 1, 1)); s.tail.setMatrixAt(i, mt);
      }) || null;
      for (const s of schools) { s.body.instanceMatrix.needsUpdate = true; s.tail.instanceMatrix.needsUpdate = true; }
    },
  };
}


// ---------------- organ look: veined flesh texture + fold bump ----------------
let _organ = null;
function organTex() {
  if (_organ) return _organ;
  const r = rng(404), S = 512;
  const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  g.fillStyle = '#c4505e'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${150 + r() * 70 | 0},${40 + r() * 40 | 0},${55 + r() * 40 | 0},0.25)`; g.beginPath(); g.arc(r() * S, r() * S, 6 + r() * 30, 0, 7); g.fill(); }
  const vein = (x, y, a, w, n) => { // branching veins
    g.strokeStyle = 'rgba(110,20,45,0.75)'; g.lineWidth = w; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < n; k++) { a += (r() - 0.5) * 0.7; x += Math.cos(a) * 9; y += Math.sin(a) * 9; g.lineTo(x, y); if (r() < 0.12 && w > 0.8) vein(x, y, a + (r() - 0.5) * 1.6, w * 0.6, n - k); }
    g.stroke();
  };
  for (let i = 0; i < 14; i++) vein(r() * S, r() * S, r() * 6.28, 3, 40);
  const b = document.createElement('canvas'); b.width = b.height = S; const h = b.getContext('2d');
  h.fillStyle = '#808080'; h.fillRect(0, 0, S, S);
  for (let i = 0; i < 26; i++) { // wavy folds (rugae)
    h.strokeStyle = `rgba(255,255,255,${0.35 + r() * 0.3})`; h.lineWidth = 6 + r() * 8; h.beginPath();
    const y0 = (i / 26) * S; for (let x = 0; x <= S; x += 8) h.lineTo(x, y0 + Math.sin(x * 0.03 + i) * 10 + Math.sin(x * 0.011 + i * 2) * 14); h.stroke();
  }
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping;
  const bump = new THREE.CanvasTexture(b); bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  _organ = { map, bump }; return _organ;
}
function lumpy(geo, amp = 0.08, seed = 1) {
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = Math.sin(v.x * 3.1 + seed) * Math.sin(v.y * 2.7 + seed * 2) * Math.sin(v.z * 2.3 + seed * 3);
    v.multiplyScalar(1 + amp * n); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals(); return geo;
}
// half-digested squid (what sperm whales actually eat)
function squid(scale = 1) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: 0xe9b9a4, roughness: 0.5, transparent: true });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.42, 6, 14), m); body.rotation.z = Math.PI / 2; g.add(body);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.14, 3), m); fin.rotation.z = Math.PI / 2; fin.position.x = 0.32; fin.scale.z = 0.25; g.add(fin);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.07, 6), new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.3, transparent: true }));
  beak.rotation.z = Math.PI / 2; beak.position.x = -0.3; g.add(beak);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, pts = [];
    for (let k = 0; k <= 6; k++) pts.push(V(-0.28 - k * 0.09, Math.sin(a) * 0.05 + Math.sin(k * 0.9 + i) * 0.03, Math.cos(a) * 0.05 + Math.cos(k * 0.7 + i) * 0.03));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.012, 6, false), m));
  }
  g.scale.setScalar(scale); g.userData.mats = [m, beak.material];
  return g;
}
// floating label (organ names in the x-ray view)
export function label(text) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = 'rgba(10,20,30,0.72)'; g.beginPath(); g.roundRect(8, 24, 496, 80, 40); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 4; g.stroke();
  g.fillStyle = '#fff'; g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 66);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false, depthWrite: false, fog: false }));
  sp.scale.set(1.6, 0.4, 1); sp.renderOrder = 20; sp.visible = false;
  return sp;
}

// ---------------- whale (head toward +z, ~19 m nose to fluke) ----------------
function boxy(geo, e = 0.7) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const f = (v) => Math.sign(v) * Math.abs(v) ** e;
    p.setXYZ(i, f(p.getX(i)), f(p.getY(i)), f(p.getZ(i)));
  }
  geo.computeVertexNormals(); return geo;
}
export function makeWhale() {
  const skin = new THREE.MeshPhysicalMaterial({ color: 0x4f565f, roughness: 0.6, clearcoat: 0.35, clearcoatRoughness: 0.5, bumpMap: fabricTexture(31), bumpScale: 2.5, transparent: true, opacity: 1 });
  const belly = skin.clone(); belly.color.set(0x6b727b);
  const pink = new THREE.MeshStandardMaterial({ color: 0xb85563, roughness: 0.5, transparent: true });
  const toothM = new THREE.MeshStandardMaterial({ color: 0xf2eee2, roughness: 0.35, transparent: true });
  const g = new THREE.Group();
  const add = (geo, mat, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1], parent = g) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.rotation.set(...rot); m.scale.set(...scl); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  // head: big blunt block
  add(boxy(new THREE.SphereGeometry(1, 72, 48), 0.62), skin, [0, 0.25, 7.0], [0, 0, 0], [1.35, 1.55, 3.05]);
  // body
  const prof = [[4.8, 1.42], [3, 1.52], [1, 1.48], [-1, 1.38], [-3, 1.15], [-5, 0.8], [-7, 0.48], [-8.7, 0.28]];
  const pts = []; for (let i = prof.length - 1; i >= 0; i--) pts.push(new THREE.Vector2(prof[i][1], prof[i][0]));
  pts.unshift(new THREE.Vector2(0.01, -8.9)); pts.push(new THREE.Vector2(0.01, 5.0));
  const bodyG = new THREE.LatheGeometry(pts, 64); bodyG.rotateX(Math.PI / 2); bodyG.scale(1, 0.95, 1);
  add(bodyG, skin, [0, 0.1, 0]);
  // dorsal hump + knuckles
  add(new THREE.SphereGeometry(1, 24, 16), skin, [0, 1.3, -3.2], [0, 0, 0], [0.35, 0.3, 0.9]);
  for (let i = 0; i < 4; i++) add(new THREE.SphereGeometry(1, 16, 10), skin, [0, 0.95 - i * 0.12, -4.6 - i * 0.9], [0, 0, 0], [0.18, 0.14, 0.35]);
  // eyes + mouth line
  const eyeM = new THREE.MeshStandardMaterial({ color: 0x111316, roughness: 0.2, transparent: true });
  for (const s of [1, -1]) add(new THREE.SphereGeometry(0.1, 16, 12), eyeM, [s * 1.18, -0.55, 4.95]);
  // pectoral fins
  for (const s of [1, -1]) add(new THREE.SphereGeometry(1, 24, 12), skin, [s * 1.45, -0.85, 3.4], [0.2, s * 0.4, s * 0.55], [0.9, 0.1, 0.42]);
  // inside of the mouth (visible when the jaw drops)
  add(new THREE.SphereGeometry(1, 40, 20), pink, [0, -1.12, 7.0], [0, 0, 0], [1.05, 0.22, 2.7]);
  // lower jaw on a hinge
  const jaw = new THREE.Group(); jaw.position.set(0, -1.15, 4.4); g.add(jaw);
  const jg = new THREE.CapsuleGeometry(0.3, 4.6, 8, 20); jg.rotateX(Math.PI / 2);
  add(jg, belly, [0, 0, 2.6], [0, 0, 0], [1.35, 0.6, 1], jaw);
  for (let z = 1.0; z < 4.8; z += 0.26) for (const s of [1, -1]) add(new THREE.ConeGeometry(0.045, 0.16, 8), toothM, [s * 0.2, 0.2, z], [0, 0, 0], [1, 1, 1], jaw);
  // tail + fluke
  const tail = new THREE.Group(); tail.position.set(0, 0.1, -8.4); g.add(tail);
  for (const s of [1, -1]) add(new THREE.SphereGeometry(1, 32, 12), skin, [s * 1.15, 0, -0.75], [0, s * 0.45, 0], [1.45, 0.1, 0.62], tail);
  // the inside: throat, esophagus, stomach chambers (x-ray)
  const OT = organTex();
  const flesh = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: OT.map, bumpMap: OT.bump, bumpScale: 3, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, emissive: 0x4a0a18, emissiveIntensity: 0.3 });
  const stomachM = flesh.clone(); stomachM.color.set(0xe08a8a); stomachM.bumpScale = 5;
  const throat = new THREE.CatmullRomCurve3([V(0, -1.05, 8.9), V(0, -1.0, 7.2), V(0, -0.85, 5.5), V(0, -0.62, 3.9), V(0, -0.45, 2.3), V(0, -0.38, 1.1), V(0, -0.4, 0.35)]);
  const tube = add(new THREE.TubeGeometry(throat, 160, 0.44, 32, false), flesh); tube.castShadow = false;
  const rings = [];
  for (let i = 0; i < 26; i++) {
    const r = add(new THREE.TorusGeometry(0.46, 0.05, 10, 40), flesh.clone()); r.castShadow = false;
    rings.push(r);
  }
  const C = [
    { c: V(0, -0.55, -0.95), r: 1.15, sz: 1.2 },
    { c: V(0.3, -0.65, -3.15), r: 0.95, sz: 1.15 },
    { c: V(-0.15, -0.6, -4.95), r: 0.8, sz: 1.1 },
  ];
  const chambers = C.map((k, i) => { const m = add(lumpy(new THREE.SphereGeometry(k.r, 64, 40), 0.07, i + 1), stomachM, k.c.toArray(), [0, 0, 0], [1, 1, k.sz]); m.castShadow = false; return m; });
  // stomach contents: half-digested squid floating in the acid
  const squids = [[0, 0.78, -0.55, -0.3, 0.9, 0.8], [0, -0.75, -0.6, -1.75, -0.6, 0.75], [1, 0.1, -0.7, -3.0, 2.2, 0.9], [2, -0.2, -0.65, -4.9, 0.4, 0.8]].map(([ci, x, y, z, ry, sc]) => {
    const q = squid(sc); q.position.set(x, y, z); q.rotation.set(0.2, ry, 0.15); g.add(q); q.userData.ci = ci; return q;
  });
  for (let i = 0; i < 2; i++) {
    const a = C[i].c.clone().add(V(0, 0, -C[i].r * C[i].sz * 0.85)), b = C[i + 1].c.clone().add(V(0, 0, C[i + 1].r * C[i + 1].sz * 0.85));
    const tg = new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 8, 0.3, 20, false);
    add(tg, flesh).castShadow = false;
  }
  // acid in each chamber (clipped by a horizontal plane = acid level)
  const acidM = C.map(() => new THREE.MeshPhysicalMaterial({ color: 0xa8e83a, roughness: 0.1, transparent: true, opacity: 0, depthWrite: false, emissive: 0x5aa000, emissiveIntensity: 0.7, side: THREE.DoubleSide, clippingPlanes: [new THREE.Plane(V(0, -1, 0), 0)] }));
  const acid = C.map((k, i) => { const m = add(new THREE.SphereGeometry(k.r - 0.04, 48, 32), acidM[i], k.c.toArray(), [0, 0, 0], [1, 1, k.sz]); m.castShadow = false; m.renderOrder = 4; return m; });
  const surfM = C.map(() => new THREE.MeshBasicMaterial({ color: 0xd8ff6a, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  const surf = C.map((k, i) => { const m = add(new THREE.CircleGeometry(1, 48), surfM[i], k.c.toArray(), [-Math.PI / 2, 0, 0], [1, k.sz, 1]); m.castShadow = false; m.renderOrder = 5; return m; });
  const shell = [skin, belly, pink, toothM, eyeM];
  return {
    group: g, jaw, tail, throat, rings, chambers: C, flesh, squids,
    setJaw(a) { jaw.rotation.x = a; },
    // 0 = solid whale, 1 = x-ray (skin ghosted, organs visible)
    setXray(k) {
      for (const m of shell) { m.opacity = 1 - 0.84 * k; m.depthWrite = k < 0.05; }
      flesh.opacity = 0.5 * k; stomachM.opacity = 0.55 * k;
      rings.forEach(r => r.material.opacity = 0.6 * k);
    },
    // acid levels (whale-local y) per chamber, and visibility
    setAcid(levels, k, glow = 1) {
      g.updateMatrixWorld(true);
      C.forEach((c, i) => {
        const L = levels[i];
        const wy = g.localToWorld(V(0, L, 0)).y;
        acidM[i].clippingPlanes[0].constant = wy;
        acidM[i].opacity = 0.62 * k; acidM[i].emissiveIntensity = 0.35 + 0.6 * glow;
        const dy = L - c.c.y, rr = Math.sqrt(Math.max(0, (c.r - 0.05) ** 2 - dy * dy));
        surf[i].position.y = L; surf[i].scale.set(rr, rr * c.sz, 1);
        surfM[i].opacity = 0.35 * k * glow;
      });
      squids.forEach(q => q.userData.mats.forEach(m => { m.opacity = k; }));
    },
    // peristalsis: rings squeeze where `u` is on the throat
    squeeze(u, t) {
      rings.forEach((r, i) => {
        const ui = (i + 0.5) / rings.length;
        const p = throat.getPointAt(ui), tg = throat.getTangentAt(ui);
        r.position.copy(p); r.quaternion.setFromUnitVectors(V(0, 0, 1), tg);
        const behind = ui - u;                        // the wave pushes from behind him
        const w = Math.exp(-(((behind - 0.06) / 0.05) ** 2)) + 0.35 * Math.max(0, Math.sin(ui * 40 - t * 6)) * 0.3;
        r.scale.setScalar(1 - 0.22 * Math.min(1, w));
      });
    },
  };
}

// glowing "O2" token
export function o2Token() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 10, 64, 64, 62); gr.addColorStop(0, 'rgba(160,230,255,0.95)'); gr.addColorStop(0.7, 'rgba(60,160,255,0.7)'); gr.addColorStop(1, 'rgba(60,160,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffffff'; g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('O', 56, 66);
  g.font = 'bold 30px sans-serif'; g.fillText('2', 88, 84);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, fog: false }));
  s.scale.setScalar(0.22); s.renderOrder = 8;
  return s;
}
