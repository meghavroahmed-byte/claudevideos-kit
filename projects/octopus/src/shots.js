import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { textSprite } from './room.js';
import { rng, glowTexture } from './textures.js';

export const DURATION = 25.4;
export const CAPTIONS = [
  [0.0, 'Why are octopuses so smart?'],
  [2.41, 'An octopus has nine brains!'], [4.97, 'One in its head'], [6.05, 'and a mini brain in each of its eight arms'],
  [8.96, 'Each arm can taste, touch'], [10.95, 'and even make decisions on its own'],
  [13.33, 'They can open jars'], [14.7, 'solve puzzles'], [15.78, 'and squeeze through any hole'], [17.5, 'bigger than their beak'],
  [18.89, 'And they can change color and texture'], [21.21, 'in a split second'], [22.57, 'to vanish into the background', 25.2],
];
export const FADES = [];

const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const OC = new THREE.Vector3(0.2, 0.0, -0.6);

function makeOcto() {
  const g = new THREE.Group(); const mat = new THREE.MeshStandardMaterial({ color: 0xff6a3a, roughness: 0.45 });
  const mantle = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), mat); mantle.scale.set(1, 1.35, 1); mantle.position.y = 0.55; mantle.rotation.x = -0.35; g.add(mantle);
  const headM = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), mat); headM.position.set(0, 0.3, 0.06); g.add(headM);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshStandardMaterial({ color: 0xffe8a0 })); e.position.set(s * 0.12, 0.38, 0.16); g.add(e); const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: 0x111111 })); p.position.set(s * 0.12, 0.38, 0.215); g.add(p); }
  const arms = []; const SEG = 12;
  for (let a = 0; a < 8; a++) { const segs = []; let parent = g; const ang = a / 8 * Math.PI * 2 + 0.2;
    const root = new THREE.Group(); root.position.set(Math.cos(ang) * 0.14, 0.2, Math.sin(ang) * 0.14); root.rotation.y = -ang + Math.PI / 2; g.add(root); parent = root;
    for (let k = 0; k < SEG; k++) { const r = 0.05 * (1 - k / SEG) + 0.008; const seg = new THREE.Group(); seg.position.z = k === 0 ? 0 : 0.07; parent.add(seg); const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, 0.06, 4, 8), mat); m.rotation.x = Math.PI / 2; m.position.z = 0.035; seg.add(m); segs.push(seg); parent = seg; }
    const tip = new THREE.Object3D(); tip.position.z = 0.07; parent.add(tip);
    arms.push({ segs, root, tip, ang }); }
  g.userData = { mat, arms, mantle };
  return g;
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-1, 8, 2], sun: 1.6 });
  scene.userData.sky.visible = false;
  scene.children.filter(o => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry' && !o.material.isShadowMaterial).forEach(o => o.visible = false);
  scene.background = new THREE.Color(0x1a8ab0); scene.fog = new THREE.Fog(0x1a8ab0, 3, 18);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xcff4ff); hemi.groundColor.set(0x2a6a6a); hemi.intensity = 1.15;
  // sandy reef floor + rocks + coral
  const sandT = canvasTex(512, 512, (g) => { g.fillStyle = '#e0d0a0'; g.fillRect(0, 0, 512, 512); const r = rng(5); for (let i = 0; i < 2000; i++) { g.fillStyle = r() > 0.5 ? 'rgba(190,170,120,0.35)' : 'rgba(255,250,225,0.5)'; g.fillRect(r() * 512, r() * 512, 2, 2); } g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 5; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(0, i * 44); g.bezierCurveTo(170, i * 44 + 20, 340, i * 44 - 20, 512, i * 44); g.stroke(); } });
  sandT.wrapS = sandT.wrapT = THREE.RepeatWrapping; sandT.repeat.set(12, 12);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ map: sandT, roughness: 1 })); sand.rotation.x = -Math.PI / 2; scene.add(sand);
  const rockT = canvasTex(256, 256, (g) => { g.fillStyle = '#7a6a5a'; g.fillRect(0, 0, 256, 256); const r = rng(7); for (let i = 0; i < 400; i++) { g.fillStyle = ['#5a8a6a', '#9a7a6a', '#6a5a4a', '#b88a6a'][i % 4]; g.beginPath(); g.arc(r() * 256, r() * 256, 3 + r() * 10, 0, 7); g.fill(); } });
  const rockM = new THREE.MeshStandardMaterial({ map: rockT, roughness: 1, flatShading: true });
  const bigRock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 1), rockM); bigRock.scale.set(1.6, 0.9, 1.0); bigRock.position.set(-1.6, 0.4, -1.8); scene.add(bigRock);
  const cr = rng(8); const cc = [0xff6f91, 0xffb347, 0xb05cff, 0x39d0ff, 0x5be37d];
  for (let i = 0; i < 18; i++) { const x = (cr() - 0.5) * 10, z = -2.5 - cr() * 6; const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.5 + cr() * 0.6, 6), new THREE.MeshStandardMaterial({ color: cc[i % 5] })); b.position.set((cr() - 0.5) * 0.3, 0.3, (cr() - 0.5) * 0.3); b.rotation.set((cr() - 0.5) * 0.8, 0, (cr() - 0.5) * 0.8); g.add(b); } }
  const raysT = canvasTex(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); });
  const rays = []; for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 6), new THREE.MeshBasicMaterial({ map: raysT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); r.position.set(-3 + i * 1.2, 3, -2 - (i % 3)); r.rotation.z = 0.2; scene.add(r); rays.push(r); }
  // octopus
  const oct = makeOcto(); oct.position.copy(OC); scene.add(oct); const OS = 0.6;
  const brains = []; for (let i = 0; i < 9; i++) { const s = glowSprite(i === 0 ? 0xffe14d : 0x7fe0ff, i === 0 ? 0.35 : 0.2); s.material.depthTest = false; s.renderOrder = 25; scene.add(s); brains.push(s); }
  const nine = textSprite('9', '#ffe14d', "400 200px Brand, sans-serif"); scene.add(nine);
  // jar + puzzle + hole
  const jar = new THREE.Group(); scene.add(jar); const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.36, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xcff4ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide })); glass.position.y = 0.18; jar.add(glass); const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 20), new THREE.MeshStandardMaterial({ color: 0xff3b3b })); lid.position.y = 0.38; jar.add(lid); const crab = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff8a3a })); crab.position.y = 0.08; jar.add(crab);
  const pipe = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.05, 10, 24), new THREE.MeshStandardMaterial({ color: 0x8a8a8a, metalness: 0.5 })); scene.add(pipe);
  // hero diver
  const hero = makeHuman('casual', { shirt: 0x1a1a22, jeans: 0x1a1a22, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const mask = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.06), new THREE.MeshStandardMaterial({ color: 0x39d0ff, transparent: true, opacity: 0.6, metalness: 0.4 })); mask.position.set(0, 0.11, 0.11); hero.j.head.add(mask);
  const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.35, 6, 12), new THREE.MeshStandardMaterial({ color: 0xffd23f, metalness: 0.5, roughness: 0.3 })); tank.position.set(0, 0.12, -0.17); hero.j.chest.add(tank);
  const fins = []; for (const k of ['lAn', 'rAn']) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.35), new THREE.MeshStandardMaterial({ color: 0xffd23f })); f.position.set(0, -0.06, 0.15); hero.j[k].add(f); fins.push(f); }
  const NB = 60, bp = new Float32Array(NB * 3), bgeo = new THREE.BufferGeometry(); bgeo.setAttribute('position', new THREE.BufferAttribute(bp, 3));
  const bubs = new THREE.Points(bgeo, new THREE.PointsMaterial({ size: 0.04, map: glowTexture(), color: 0xffffff, transparent: true, depthWrite: false })); bubs.frustumCulled = false; scene.add(bubs);
  const ink = []; for (let i = 0; i < 10; i++) { const s = glowSprite(0x1a1a2a, 0.5); s.material.blending = THREE.NormalBlending; scene.add(s); ink.push(s); }
  const fx = { open: burst(0xffe14d, 40, 1), poof: burst(0x9fe0ff, 50, 2) }; Object.values(fx).forEach(f => scene.add(f));
  const c = cam(38);
  const COL0 = new THREE.Color(0xff6a3a), CAM = new THREE.Color(0x7a6a5a);

  return {
    scene, camera: c,
    update(t) {
      rays.forEach((r, i) => r.material.opacity = 0.6 + 0.4 * Math.sin(t * 1.1 + i * 1.7));
      // octopus position by phase
      const toJar = smooth(range(t, 12.9, 13.6)), toPipe = smooth(range(t, 15.6, 16.2)), toRock = smooth(range(t, 18.6, 19.2));
      let pos = OC.clone();
      pos.lerp(V(0.3, 0.0, -0.5), toJar); pos.lerp(V(0.25, 0.0, -0.9), toPipe); pos.lerp(V(-0.45, 0.72, -1.75), toRock);
      const squeeze = Math.max(0, Math.sin(Math.PI * range(t, 16.6, 18.0)));
      oct.position.copy(pos); oct.position.y += Math.sin(t * 1.3) * 0.05;
      oct.rotation.y = Math.sin(t * 0.4) * 0.3;
      oct.scale.set(OS * (1 - 0.55 * squeeze), OS * (1 + 0.2 * squeeze), OS * (1 - 0.55 * squeeze));
      // arms wave; during jar opening two arms grip lid
      const ud = oct.userData;
      ud.arms.forEach((a, i) => { const curl = 0.18 + 0.12 * Math.sin(t * 2.2 + i * 0.9); a.root.rotation.x = 0.5 + 0.2 * Math.sin(t * 1.7 + i); const indep = t > 9.0 && t < 12.8 ? Math.sin(t * (3 + i * 0.7) + i * 2) * 0.25 : 0;
        a.segs.forEach((s, k) => { s.rotation.x = curl + indep * (k / 12); s.rotation.y = Math.sin(t * 1.5 + i + k * 0.3) * 0.06; }); });
      // camouflage
      const camo = smooth(range(t, 21.2, 21.6));
      ud.mat.color.copy(COL0).lerp(CAM, camo); ud.mat.roughness = lerp(0.45, 1.0, camo); ud.mat.flatShading = camo > 0.5; ud.mat.needsUpdate = camo > 0.49 && camo < 0.52;
      // brains glow 2.4..8.8
      scene.updateMatrixWorld(true);
      const bk = smooth(range(t, 3.4, 4.0)) * (1 - smooth(range(t, 8.6, 9.0)));
      brains[0].position.copy(ud.mantle.getWorldPosition(V())); brains[0].material.opacity = smooth(range(t, 4.9, 5.3)) * (1 - smooth(range(t, 8.6, 9.0))) * (0.7 + 0.3 * Math.sin(t * 6));
      ud.arms.forEach((a, i) => { const p = a.segs[5].getWorldPosition(V()); brains[i + 1].position.copy(p); brains[i + 1].material.opacity = smooth(range(t, 6.3 + i * 0.17, 6.6 + i * 0.17)) * (1 - smooth(range(t, 8.6, 9.0))) * (0.7 + 0.3 * Math.sin(t * 6 + i)); });
      brains.forEach(b => b.visible = b.material.opacity > 0.01);
      const nk = easeOut(range(t, 3.4, 3.7)) * (1 - smooth(range(t, 4.8, 5.1)));
      nine.position.copy(oct.position).add(V(0.0, 0.95, 0.1)); nine.scale.set(0.6 * nk, 0.3 * nk, 1); nine.visible = nk > 0.01;
      // jar
      const jk = smooth(range(t, 12.9, 13.3)) * (1 - smooth(range(t, 15.4, 15.8)));
      jar.position.set(0.3, 0, -0.05); jar.scale.setScalar(Math.max(0.001, jk)); jar.visible = jk > 0.01;
      const twist = smooth(range(t, 13.6, 14.4)); lid.rotation.y = twist * 6; lid.position.y = 0.38 + 0.25 * smooth(range(t, 14.2, 14.6));
      fx.open.position.set(0.3, 0.6, -0.05); fx.open.update(t - 14.4);
      const pk = smooth(range(t, 15.6, 16.0)) * (1 - smooth(range(t, 18.4, 18.8)));
      pipe.position.set(0.25, 0.45, -0.9); pipe.scale.setScalar(Math.max(0.001, pk)); pipe.visible = pk > 0.01; pipe.rotation.y = 0.3;
      fx.poof.position.copy(oct.position).add(V(0, 0.4, 0)); fx.poof.update(t - 21.2);
      // hero diver floats, watching
      hero.root.position.set(-1.25, 0.3 + Math.sin(t * 1.1) * 0.06, -0.6); hero.root.rotation.set(0, 1.2, 0);
      const kick = Math.sin(t * 2.2), look = t > 21.6 ? Math.sin(t * 2) * 0.5 : 0;
      hero.setPose({ lSh: [-0.2, 0, 0.5], rSh: [-0.2, 0, -0.5], lEl: [-0.5, 0, 0], rEl: [-0.5, 0, 0], lHip: [0.3 * kick - 0.2, 0, 0.08], rHip: [-0.3 * kick - 0.2, 0, -0.08], lKn: [0.3, 0, 0], rKn: [0.3, 0, 0], neck: [0.15, look, 0] });
      hero.setMouth(t > 21.6 ? 0.3 : 0.05);
      scene.updateMatrixWorld(true);
      const hh = hero.j.head.getWorldPosition(V());
      for (let i = 0; i < NB; i++) { const u2 = ((i / NB) + t * 0.4) % 1; bp[i * 3] = hh.x + Math.sin(i * 7.1) * 0.08; bp[i * 3 + 1] = hh.y + 0.1 + u2 * 2.5; bp[i * 3 + 2] = hh.z + Math.cos(i * 3.3) * 0.08; }
      bgeo.attributes.position.needsUpdate = true;
      // ---------- camera ----------
      const KEYS = [[0, [0.5, 1.6, 5.0], [-0.45, 0.8, -0.6]], [2.4, [0.5, 1.45, 4.4], [-0.4, 0.75, -0.6]], [12.8, [0.5, 1.45, 4.4], [-0.35, 0.75, -0.6]], [13.4, [0.7, 1.45, 4.4], [-0.2, 0.7, -0.5]], [18.4, [0.7, 1.45, 4.4], [-0.25, 0.7, -0.6]], [19.4, [0.4, 1.55, 4.4], [-0.6, 0.85, -1.0]], [25.4, [0.4, 1.6, 4.6], [-0.6, 0.85, -1.0]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.5, 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.4, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
