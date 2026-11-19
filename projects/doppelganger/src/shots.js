import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { infoCard, burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { stamp, iconBubble } from './ancient.js';

export const DURATION = 24.2;
export const CAPTIONS = [
  [0.0, 'How many people'], [0.8, 'in the world'], [1.4, 'look exactly like you?'],
  [3.39, 'With eight billion people'], [4.89, 'on Earth'], [5.52, "you'd think there must be"], [6.73, 'a twin out there somewhere'],
  [8.32, 'But when scientists'], [9.18, 'measured faces'], [10.4, 'the chance of a perfect match'], [12.01, 'was less than'], [12.61, 'one in a trillion'],
  [14.37, 'Still'], [15.07, 'if you count close lookalikes'], [16.74, 'there could be about'], [17.54, 'seven people'], [18.46, 'who look a lot like you'],
  [20.09, 'And some lookalike strangers'], [21.47, 'even share similar DNA!', 24.0],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 7, sunDir: [-4, 9, 5], sun: 2.4 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x2f7fd8); u.mid.value.set(0x6aaee8); u.horizon.value.set(0xd6e8f2); u.floorC.value.set(0x8a9098);
  scene.fog = new THREE.Fog(0xd0dce6, 30, 120);
  const key = scene.userData.key;
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.85;
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  // city plaza
  const tile = canvasTex(256, 256, (g) => { g.fillStyle = '#c8c4bc'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#a8a49c'; g.lineWidth = 4; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); } });
  tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.repeat.set(40, 40);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ map: tile, roughness: 0.85 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const r = rng(7);
  const winT = canvasTex(128, 256, (g) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 256); g.fillStyle = '#5a7a9a'; for (let i = 0; i < 4; i++) for (let j = 0; j < 10; j++) g.fillRect(8 + i * 30, 8 + j * 25, 20, 16); });
  for (let i = 0; i < 18; i++) { const h = 8 + r() * 18, w = 5 + r() * 4; const ang = (i / 18) * Math.PI * 1.4 - Math.PI * 1.2; const d = 26 + r() * 8; const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshStandardMaterial({ map: winT, color: new THREE.Color().setHSL(0.05 + r() * 0.6, 0.2, 0.7), roughness: 0.8 })); b.position.set(Math.cos(ang) * d, h / 2, Math.sin(ang) * d); scene.add(b); }
  // crowd of pedestrians (simple instanced)
  const N = 220, bodyG = new THREE.CapsuleGeometry(0.18, 0.75, 3, 8); bodyG.translate(0, 0.62, 0); const headG = new THREE.SphereGeometry(0.13, 10, 8); headG.translate(0, 1.32, 0);
  const crowdB = new THREE.InstancedMesh(bodyG, new THREE.MeshStandardMaterial({ roughness: 0.8 }), N), crowdH = new THREE.InstancedMesh(headG, new THREE.MeshStandardMaterial({ color: 0xd99b7a, roughness: 0.7 }), N);
  const CP = []; for (let i = 0; i < N; i++) { const a = r() * 6.28, d = 3 + r() * 16; CP.push({ x: Math.cos(a) * d, z: Math.sin(a) * d - 4, dir: r() * 6.28, sp: 0.6 + r() * 0.8, ph: r() * 6 }); crowdB.setColorAt(i, new THREE.Color().setHSL(r(), 0.45, 0.35 + r() * 0.3)); crowdH.setColorAt(i, new THREE.Color([0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac][i % 5])); }
  crowdB.castShadow = true; scene.add(crowdB, crowdH);
  const mt = new THREE.Matrix4(), q = new THREE.Quaternion();
  // hero + 7 lookalikes
  const hero = makeHuman('casual', { shirt: 0x2a9d8f, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const SH = [0xe63946, 0xffb703, 0x8d6cab, 0x457b9d, 0xf4a261, 0x6c757d, 0xff8fab];
  const looks = SH.map((s, i) => { const h = makeHuman('casual', { shirt: s, jeans: [0x2b2b30, 0x5a6b8a, 0x7a5c3a][i % 3], skin: [0xd99b7a, 0xe0ac69, 0xd99b7a, 0xc8906a][i % 4], hair: [0x3a2618, 0x2b1d14, 0x4a3020][i % 3] }); scene.add(h.root); return h; });
  // globe + counter
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 20), new THREE.MeshStandardMaterial({ map: canvasTex(512, 256, (g) => { g.fillStyle = '#2a6faf'; g.fillRect(0, 0, 512, 256); const rr = rng(4); g.fillStyle = '#4f9a4a'; for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(rr() * 512, 40 + rr() * 176, 20 + rr() * 50, 12 + rr() * 30, rr(), 0, 7); g.fill(); } }), roughness: 0.6 })); scene.add(globe);
  const pins = []; for (let i = 0; i < 7; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd23f, toneMapped: false })); globe.add(p); const a = i * 0.9 + 0.3, b = (i % 3 - 1) * 0.5; p.position.set(Math.cos(a) * Math.cos(b) * 0.61, Math.sin(b) * 0.61, Math.sin(a) * Math.cos(b) * 0.61); pins.push(p); }
  const counter = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); counter.renderOrder = 31; scene.add(counter);
  const cc = document.createElement('canvas'); cc.width = 768; cc.height = 200; const cg = cc.getContext('2d'); const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace; counter.material.map = ct; let lastN = -1;
  const drawN = (n, label) => { if (n === lastN) return; lastN = n; cg.clearRect(0, 0, 768, 200); cg.fillStyle = 'rgba(10,20,40,0.72)'; cg.beginPath(); cg.roundRect(6, 6, 756, 188, 36); cg.fill(); cg.font = "400 40px Brand, sans-serif"; cg.fillStyle = 'rgba(255,255,255,0.7)'; cg.textAlign = 'left'; cg.textBaseline = 'middle'; cg.fillText(label, 36, 50); cg.font = "400 92px Brand, sans-serif"; cg.fillStyle = '#ffd23f'; cg.fillText(typeof n === 'string' ? n : n.toLocaleString('en-US'), 36, 128); ct.needsUpdate = true; };
  // face-scan grid
  const scan = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(256, 256, (g) => { g.strokeStyle = '#4ab8ff'; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 32); g.lineTo(256, i * 32); g.stroke(); } g.fillStyle = '#ffd23f'; for (const [x, y] of [[90, 100], [166, 100], [128, 140], [100, 180], [156, 180], [128, 60], [60, 130], [196, 130]]) { g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); } }), transparent: true, depthTest: false, depthWrite: false, opacity: 0.8, toneMapped: false, blending: THREE.AdditiveBlending })); scan.renderOrder = 25; scene.add(scan);
  // DNA helix between him and a lookalike
  const dna = new THREE.Group(); scene.add(dna);
  for (let i = 0; i < 40; i++) { const k = i / 40, a = k * Math.PI * 6; for (const s of [0, Math.PI]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: s ? 0x5ab8ff : 0xff5fa2, toneMapped: false })); b.position.set(k * 1.6 - 0.8, Math.sin(a + s) * 0.12, Math.cos(a + s) * 0.12); dna.add(b); } }
  const fx = { pop: looks.map((_, i) => burst(0xffd23f, 30, i + 1)), match: burst(0x5ab8ff, 80, 20) };
  for (const v of Object.values(fx)) (Array.isArray(v) ? v : [v]).forEach(f => scene.add(f));
  const tri = stamp('1 IN A TRILLION', '#ff4a4a', 0.68); scene.add(tri);
  const card = infoCard(); scene.add(card);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // crowd walks around; freezes and greys when we look for the twin
      for (let i = 0; i < N; i++) { const p = CP[i]; const d = t * p.sp; const x = p.x + Math.cos(p.dir) * d, z = p.z + Math.sin(p.dir) * d; const bob = Math.abs(Math.sin(t * 6 + p.ph)) * 0.03; q.setFromAxisAngle(V(0, 1, 0), -p.dir + Math.PI / 2); mt.compose(V(x, bob, z), q, V(1, 1, 1)); if (Math.hypot(x, z - 0.3) < 1.6 || z > 1.2) mt.makeScale(0, 0, 0); crowdB.setMatrixAt(i, mt); crowdH.setMatrixAt(i, mt); }
      crowdB.instanceMatrix.needsUpdate = crowdH.instanceMatrix.needsUpdate = true;
      // hero
      hero.root.position.set(0, 0, 0.3); hero.root.rotation.y = 0;
      const look = smooth(range(t, 5.5, 6.0)) * (1 - smooth(range(t, 7.8, 8.2)));
      hero.setPose(over(STAND(t), { neck: [0, Math.sin(t * 1.8) * 0.8 * look, 0], rSh: [-0.6 * look, 0, -0.4], rEl: [-1.4 * look, 0, 0] }));
      hero.setMouth(0.1);
      // lookalikes pop in around him
      looks.forEach((h, i) => { const a = -Math.PI / 2 + (i - 3) * 0.42, tin = 17.5 + i * 0.12, k = easeOut(range(t, tin, tin + 0.3)); h.root.visible = k > 0.01; h.root.position.set(Math.cos(a + Math.PI / 2) * 1.8 * 0 + (i - 3) * 0.75, 0, -0.9 - Math.abs(i - 3) * 0.12); h.root.scale.setScalar(Math.max(0.001, k)); h.root.rotation.y = -(i - 3) * 0.12; h.setPose(over(STAND(t, i), { neck: [0, (i - 3) * -0.1, 0] })); fx.pop[i].position.copy(h.root.position).add(V(0, 1.2, 0)); fx.pop[i].update(t - tin); });
      scene.updateMatrixWorld(true);
      const face = hero.j.head.localToWorld(V(0, 0.1, 0.16));
      const sk = smooth(range(t, 9.0, 9.4)) * (1 - smooth(range(t, 13.9, 14.3)));
      scan.position.copy(face); scan.scale.setScalar(0.36 * sk); scan.material.opacity = 0.8 * sk * (0.7 + 0.3 * Math.sin(t * 10)); scan.visible = sk > 0.01;
      const dk = smooth(range(t, 21.4, 21.9));
      const l3 = looks[4].j.chest.getWorldPosition(V(0, 0, 0)), h3 = hero.j.chest.getWorldPosition(V(0, 0, 0));
      dna.visible = dk > 0.01; dna.position.copy(h3).lerp(l3, 0.5); dna.scale.set(h3.distanceTo(l3) / 1.6 * dk + 0.001, dk + 0.001, dk + 0.001); dna.lookAt(l3); dna.rotateY(-Math.PI / 2); dna.rotation.x = t * 1.5;
      fx.match.position.copy(dna.position); fx.match.update(t - 21.5);
      // ---------- camera ----------
      const KEYS = [[0, [2.6, 3.0, 7.0], [0, 1.2, 0]], [3.3, [1.8, 2.4, 5.6], [0, 1.3, 0]], [8.2, [1.0, 1.9, 4.6], [0, 1.3, 0.2]], [9.3, [0.4, 1.65, 3.7], [0, 1.25, 0.3]], [14.2, [0.5, 1.65, 3.8], [0, 1.25, 0.3]], [17.2, [0.6, 2.2, 6.4], [0, 1.1, -0.5]], [24.2, [0.5, 2.1, 6.0], [0, 1.1, -0.5]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const sh = shake(t, 0.5, 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-4, 9, 5));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const gk = easeOut(range(t, 3.4, 3.8)) * (1 - smooth(range(t, 8.0, 8.4)));
      globe.position.copy(c.position).addScaledVector(fw, 3).addScaledVector(upv, 0.25).addScaledVector(rt, 0.38); globe.scale.setScalar(Math.max(0.001, gk * 0.5)); globe.rotation.y = t * 0.6; globe.visible = gk > 0.01;
      pins.forEach((p, j) => p.visible = false);
      const ck = smooth(range(t, 3.7, 4.0)) * (1 - smooth(range(t, 7.9, 8.2))) + smooth(range(t, 12.5, 12.8)) * (1 - smooth(range(t, 14.1, 14.4)));
      if (t < 10) drawN(Math.round(lerp(0, 8000000000, easeOut(range(t, 3.8, 5.0)))), 'PEOPLE ON EARTH'); else drawN('1 IN 1 TRILLION', 'CHANCE OF A PERFECT MATCH');
      counter.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.25); counter.scale.set(0.6 * ck, 0.156 * ck, 1); counter.material.opacity = ck; counter.visible = ck > 0.01;
      tri.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.05); tri.set(t > 13.0 ? easeOut(range(t, 13.0, 13.16)) * (1 - smooth(range(t, 14.1, 14.4))) : 0);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 3.3, 'HOW MANY PEOPLE', 'LOOK LIKE YOU?', '#ffffff', ''],
        [3.39, 8.2, 'ON EARTH', '8 BILLION', '#ffd23f', 'there must be a twin...'],
        [8.32, 14.3, 'FACE SCIENCE', 'PERFECT MATCH?', '#4ab8ff', 'faces measured'],
        [14.37, 20.09, 'LOOKALIKES', '~7 PEOPLE', '#5be37d', 'look a lot like you'],
        [20.09, 24.2, 'LOOKALIKES', 'SIMILAR DNA', '#ff5fa2', 'some strangers share it'],
      ];
      const cu = CARDS.find(([a2, b]) => t >= a2 && t < b); let ck2 = 0;
      if (cu) { card.set(cu[2], cu[3], cu[4], null, cu[5]); const grp = CARDS.filter(x => x[2] === cu[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck2 = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk = 1 + 0.09 * Math.exp(-(t - cu[0]) * 9); card.scale.set(0.72 * pk, 0.281 * pk, 1); }
      card.material.opacity = ck2; card.visible = false;
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.45, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
