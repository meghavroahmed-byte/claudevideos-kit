import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp, world, tree } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 25.0;
export const CAPTIONS = [
  [0.0, 'What if you were as strong as an ant?'],
  [2.7, 'An ant can lift about fifty times'], [4.91, 'its own body weight'],
  [6.43, 'If you had that power'], [7.88, 'you could pick up a car over your head'], [9.88, 'like it was a backpack'],
  [11.49, "But here's the catch"], [12.88, "Ants are only strong because they're tiny"],
  [15.82, 'As things get bigger'], [16.93, 'their weight grows much faster'], [19.02, 'than their muscle strength'],
  [20.3, "That's why a giant ant"], [21.58, 'would collapse under its own weight!', 24.8],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.09], rHip: [0, 0, -0.09], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const COLL = 22.0;

function makeAnt(col = 0x8a2a1a) {
  const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.35, metalness: 0.1 });
  const abd = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), m); abd.scale.set(0.8, 0.7, 1.1); abd.position.set(0, 0.55, -0.85); g.add(abd);
  const tho = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), m); tho.scale.set(0.8, 0.75, 1.2); tho.position.set(0, 0.6, 0); g.add(tho);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), m); head.position.set(0, 0.68, 0.55); g.add(head);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 })); e.position.set(s * 0.18, 0.78, 0.72); g.add(e); const an = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.012, 0.6, 5), m); an.position.set(s * 0.12, 1.05, 0.75); an.rotation.set(0.6, 0, -s * 0.5); g.add(an); const mand = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 5), m); mand.position.set(s * 0.08, 0.55, 0.82); mand.rotation.set(1.6, 0, s * 0.4); g.add(mand); }
  const legs = []; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const lg = new THREE.Group(); lg.position.set(s * 0.2, 0.55, -0.15 + i * 0.18); g.add(lg); const up = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.5, 6), m); up.position.set(s * 0.22, 0.12, 0); up.rotation.z = s * 1.1; lg.add(up); const lo = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.015, 0.6, 6), m); lo.position.set(s * 0.48, -0.22, (i - 1) * 0.15); lo.rotation.z = -s * 0.35; lg.add(lo); lg.userData = { s, i }; legs.push(lg); }
  g.userData = { legs, abd, head, tho };
  return g;
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 9, sunDir: [-4, 9, 5], sun: 2.6 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x2a8ae0); u.mid.value.set(0x8ac8f0); u.horizon.value.set(0xe8f4fa); u.floorC.value.set(0x6aa04a);
  scene.fog = new THREE.Fog(0xe0eef4, 30, 120);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.9;
  scene.add(world([]));
  // parking lot + park edge
  const asphT = canvasTex(512, 512, (g) => { g.fillStyle = '#4a4a50'; g.fillRect(0, 0, 512, 512); const r = rng(3); for (let i = 0; i < 2500; i++) { g.fillStyle = r() > 0.5 ? 'rgba(80,80,88,0.5)' : 'rgba(40,40,44,0.5)'; g.fillRect(r() * 512, r() * 512, 2, 2); } g.fillStyle = '#f4f4f4'; for (let i = 0; i < 4; i++) g.fillRect(40 + i * 128, 0, 8, 260); });
  asphT.wrapS = asphT.wrapT = THREE.RepeatWrapping; asphT.repeat.set(2, 2);
  const lot = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), new THREE.MeshStandardMaterial({ map: asphT, roughness: 0.95 })); lot.rotation.x = -Math.PI / 2; lot.position.set(0, 0.01, -2.0); lot.receiveShadow = true; scene.add(lot);
  [[-5, -6.5], [4.5, -7.5], [7, -4]].forEach(([x, z], i) => { const tr = tree({ h: 4, seed: i + 33 }); tr.position.set(x, 0, z); scene.add(tr); });
  // car
  const car = new THREE.Group(); scene.add(car);
  const paint = new THREE.MeshStandardMaterial({ color: 0x39a0ff, metalness: 0.5, roughness: 0.3 }), glass = new THREE.MeshStandardMaterial({ color: 0x223040, metalness: 0.6, roughness: 0.1 }), tyre = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 3.6), paint); body.position.y = 0.55; car.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 1.9), glass); cab.position.set(0, 1.0, -0.2); car.add(cab);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.06, 1.7), paint); roof.position.set(0, 1.24, -0.2); car.add(roof);
  for (const [x, z] of [[-0.85, 1.15], [0.85, 1.15], [-0.85, -1.15], [0.85, -1.15]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.25, 20), tyre); w.rotation.z = Math.PI / 2; w.position.set(x, 0.32, z); car.add(w); }
  for (const x of [-0.55, 0.55]) { const hl = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), new THREE.MeshBasicMaterial({ color: 0xffffe0 })); hl.position.set(x, 0.6, 1.81); car.add(hl); }
  car.traverse(o => { if (o.isMesh) o.castShadow = true; });
  // hero
  const hero = makeHuman('casual', { shirt: 0xe63946, jeans: 0x1d3557, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  // small ant with leaf + giant ant
  const ant = makeAnt(); scene.add(ant);
  const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshStandardMaterial({ color: 0x5aa83a, side: THREE.DoubleSide })); leaf.scale.set(1.4, 0.8, 1); ant.add(leaf); leaf.position.set(0, 1.35, 0.3); leaf.rotation.x = -1.2;
  const giant = makeAnt(0x7a2416); scene.add(giant);
  // cube-law bubble: size doubles -> strength x4, weight x8
  const zc = document.createElement('canvas'); zc.width = zc.height = 512; const zg = zc.getContext('2d'); const zt = new THREE.CanvasTexture(zc); zt.colorSpace = THREE.SRGBColorSpace;
  const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); bub.renderOrder = 30; scene.add(bub);
  const drawS = (k, tt) => { zg.clearRect(0, 0, 512, 512); zg.save(); zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.clip(); zg.fillStyle = '#fff4e0'; zg.fillRect(0, 0, 512, 512);
    const sz = 1 + 2 * k; const musc = sz * sz, wt = sz * sz * sz;
    const bar = (x, v, col, lab) => { const h = Math.min(320, v * 12); zg.fillStyle = col; zg.beginPath(); zg.roundRect(x, 420 - h, 90, h, 12); zg.fill(); zg.font = "400 40px Brand, sans-serif"; zg.textAlign = 'center'; zg.lineWidth = 7; zg.strokeStyle = 'rgba(0,0,0,0.55)'; zg.strokeText(lab, x + 45, 466); zg.fillStyle = '#222'; zg.fillText(lab, x + 45, 466); zg.strokeText(`x${Math.round(v)}`, x + 45, 400 - h); zg.fillStyle = col; zg.fillText(`x${Math.round(v)}`, x + 45, 400 - h); };
    bar(110, musc, '#39a0ff', 'MUSCLE'); bar(310, wt, '#ff5a3a', 'WEIGHT');
    zg.restore(); zg.strokeStyle = 'rgba(255,255,255,0.95)'; zg.lineWidth = 12; zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.stroke(); zt.needsUpdate = true; };
  const cc = document.createElement('canvas'); cc.width = 512; cc.height = 220; const cg = cc.getContext('2d'); const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace;
  const cnt = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); cnt.renderOrder = 31; scene.add(cnt); let lastC = '';
  const drawC = (s) => { if (s === lastC) return; lastC = s; cg.clearRect(0, 0, 512, 220); cg.font = "400 140px Brand, sans-serif"; cg.textAlign = 'center'; cg.textBaseline = 'middle'; cg.lineWidth = 14; cg.strokeStyle = 'rgba(0,0,0,0.6)'; cg.strokeText(s, 256, 110); cg.fillStyle = '#ffd23f'; cg.fillText(s, 256, 110); ct.needsUpdate = true; };
  const fx = { lift: burst(0xffd23f, 60, 1), coll: burst(0xb8a888, 90, 2), crack: burst(0xffffff, 40, 3) }; Object.values(fx).forEach(f => scene.add(f));
  const crunch = stamp('CRUNCH!', '#ff5a3a', 0.6); scene.add(crunch);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // small ant scene 0..6.3 (macro view near ground at x=-1.5)
      const antOn = t < 6.4;
      ant.visible = antOn; ant.scale.setScalar(0.06); ant.position.set(-1.6 + Math.min(t, 5.8) * 0.03, 0.01, 1.4); ant.rotation.y = Math.PI / 2;
      ant.userData.legs.forEach(lg => { const { s, i } = lg.userData; lg.rotation.y = Math.sin(t * 12 + i * 2 + (s > 0 ? Math.PI : 0)) * 0.35; });
      // hero lifts car 6.4..11.4
      hero.root.position.set(0.4, 0, 0.4); hero.root.rotation.y = -0.2;
      const lift = easeInOut(range(t, 8.0, 9.4)), carry = t > 9.4 && t < 11.6;
      const putDown = smooth(range(t, 11.3, 12.2));
      const up = lift * (1 - putDown);
      let pose = STAND(t);
      if (up > 0.01) pose = over(pose, { lSh: [-2.9 * up, 0, 0.35], rSh: [-2.9 * up, 0, -0.35], lEl: [-0.35 * up, 0, 0], rEl: [-0.35 * up, 0, 0], lHip: [0, 0, 0.18], rHip: [0, 0, -0.18] });
      if (t > 7.4 && t < 8.1) pose = over(pose, { lHip: [-0.8, 0, 0.18], rHip: [-0.8, 0, -0.18], lKn: [1.2, 0, 0], rKn: [1.2, 0, 0], spine: [0.4, 0, 0], lSh: [-1.2, 0, 0.3], rSh: [-1.2, 0, -0.3] });
      hero.setPose(pose); hero.setMouth(up > 0.5 ? 0.45 : 0.06);
      if (carry) hero.root.position.x += Math.sin(t * 6) * 0.0;
      scene.updateMatrixWorld(true);
      const head = hero.j.head.getWorldPosition(V());
      const carGround = V(1.8, 0, -1.6), carHigh = head.clone().add(V(0, 0.75, 0));
      car.position.copy(carGround.clone().lerp(carHigh.clone().add(V(0, -0.35, 0)), up)); car.rotation.set(0, lerp(0.3, Math.PI / 2, up), up * 0.06 * Math.sin(t * 3));
      fx.lift.position.copy(car.position); fx.lift.update(t - 9.4);
      // giant ant appears 15.6, grows, collapses at COLL
      const gk = smooth(range(t, 15.6, 16.4));
      const grow = lerp(0.2, 1.5, easeInOut(range(t, 16.4, 20.6)));
      const coll = easeIn(range(t, COLL, COLL + 0.5));
      giant.visible = gk > 0.01; giant.scale.set(grow * gk, grow * gk * (1 - 0.55 * coll), grow * gk);
      giant.position.set(-2.4, -0.25 * grow * coll, -3.6); giant.rotation.y = 0.5;
      giant.userData.legs.forEach(lg => { const { s, i } = lg.userData; lg.rotation.z = lerp(0, s * 0.9, coll) + Math.sin(t * 20 + i) * 0.04 * smooth(range(t, 19.0, 21.8)); });
      fx.coll.position.set(-2.4, 0.3, -3.6); fx.coll.update(t - COLL);
      fx.crack.position.set(-2.4, 1.0, -3.6); fx.crack.update(t - COLL);
      // ---------- camera ----------
      const KEYS = [[0, [-1.2, 0.18, 1.95], [-1.5, 0.05, 1.4]], [5.6, [-1.15, 0.2, 1.95], [-1.42, 0.06, 1.4]], [6.6, [1.2, 2.3, 7.8], [0.7, 1.4, -0.6]], [11.4, [1.2, 2.4, 8.0], [0.5, 1.6, -0.3]], [12.4, [1.4, 1.6, 4.4], [0.4, 1.0, 0.0]], [15.4, [1.4, 1.6, 4.4], [0.4, 1.0, 0.0]], [17.0, [1.2, 2.4, 7.4], [-0.6, 1.3, -1.6]], [25.0, [1.2, 2.4, 7.4], [-0.6, 1.1, -1.6]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.35 + (t > 7.9 && t < 9.4 ? 1.0 : 0) + (t > COLL && t < COLL + 0.6 ? 3.5 : 0), 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      let on = 0; if (t > 3.6 && t < 6.2) { drawC(`x${Math.round(lerp(1, 50, easeOut(range(t, 3.8, 5.2))))}`); on = 1; }
      cnt.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.12).addScaledVector(rt, 0.1); cnt.scale.set(0.36 * on, 0.155 * on, 1); cnt.visible = !!on;
      const bk = easeOut(range(t, 16.8, 17.2)) * (1 - smooth(range(t, 21.5, 21.9)));
      if (bk > 0.01) drawS(easeInOut(range(t, 17.2, 19.6)), t);
      bub.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.09).addScaledVector(rt, -0.16); bub.scale.setScalar(0.27 * bk); bub.visible = bk > 0.01;
      crunch.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); crunch.set(t > COLL + 0.2 ? easeOut(range(t, COLL + 0.2, COLL + 0.4)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.3, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
