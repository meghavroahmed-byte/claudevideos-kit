import * as THREE from 'three';
import { fabricTexture, glowTexture, rng } from './textures.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------- ocean ----------------
export function ocean(scene) {
  scene.userData.sky.visible = false;
  scene.background = new THREE.Color(0x0a3557);
  scene.fog = new THREE.FogExp2(0x0c3f66, 0.028);
  scene.traverse(o => {
    if (o.isHemisphereLight) { o.color.set(0x9fdcff); o.groundColor.set(0x08263f); o.intensity = 0.9; }
    if (o.isMesh && o.material && o.material.isShadowMaterial) o.visible = false;
  });
  scene.userData.key.color.set(0xd8f0ff);
  // marine snow
  const r = rng(77), N = 900;
  const pos = new Float32Array(N * 3), base = [];
  for (let i = 0; i < N; i++) base.push([(r() - 0.5) * 50, (r() - 0.5) * 24, (r() - 0.5) * 50, r()]);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const snow = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.05, map: glowTexture(), color: 0xcfeeff, transparent: true, opacity: 0.6, depthWrite: false }));
  snow.frustumCulled = false; scene.add(snow);
  // light shafts from the surface
  const shaftTex = (() => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    const gx = g.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, 64, 256);
    return new THREE.CanvasTexture(c);
  })();
  const shafts = [];
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.5 + r() * 2, 30), new THREE.MeshBasicMaterial({ map: shaftTex, color: 0x9fe0ff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.position.set((r() - 0.5) * 30, 8, (r() - 0.5) * 30); m.rotation.set(0, r() * Math.PI, 0.25); scene.add(m); shafts.push([m, r() * 6]);
  }
  return {
    update(t) {
      for (let i = 0; i < N; i++) {
        const b = base[i];
        pos[i * 3] = b[0] + Math.sin(t * 0.3 + b[3] * 9) * 0.3;
        pos[i * 3 + 1] = ((b[1] - t * 0.15 * (0.5 + b[3]) + 12) % 24 + 24) % 24 - 12;
        pos[i * 3 + 2] = b[2];
      }
      geo.attributes.position.needsUpdate = true;
      for (const [m, p] of shafts) m.material.opacity = 0.08 + 0.05 * Math.sin(t * 0.7 + p);
    },
  };
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
  const flesh = new THREE.MeshPhysicalMaterial({ color: 0xe0707e, roughness: 0.3, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, emissive: 0x5a1020, emissiveIntensity: 0.35 });
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
  const chambers = C.map(k => { const m = add(new THREE.SphereGeometry(k.r, 48, 32), flesh, k.c.toArray(), [0, 0, 0], [1, 1, k.sz]); m.castShadow = false; return m; });
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
    group: g, jaw, tail, throat, rings, chambers: C, flesh,
    setJaw(a) { jaw.rotation.x = a; },
    // 0 = solid whale, 1 = x-ray (skin ghosted, organs visible)
    setXray(k) {
      for (const m of shell) { m.opacity = 1 - 0.84 * k; m.depthWrite = k < 0.05; }
      flesh.opacity = 0.42 * k;
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
