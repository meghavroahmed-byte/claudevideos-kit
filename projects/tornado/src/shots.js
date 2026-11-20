import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp, world } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 28.0;
export const CAPTIONS = [
  [0.0, 'What if you got caught in a tornado?'],
  [2.35, 'The winds inside can spin faster'], [4.36, 'than 300 km per hour'], [7.01, "That's strong enough to lift cars"], [8.87, 'and rip houses apart'],
  [10.76, 'The real danger is flying debris'], [13.22, 'wood, glass, and metal'], [15.25, 'all hurled like bullets'],
  [17.37, "If you're caught outside, find a ditch"], [19.8, 'lie flat, and cover your head'],
  [22.05, 'And never try to hide under a highway bridge'], [24.77, 'The wind there gets even faster!', 27.8],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [0, 0, 0], neck: [0.03, 0, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 10, sunDir: [-4, 7, 4], sun: 1.0 });
  const U = scene.userData.sky.material.uniforms; U.top.value.set(0x2a3038); U.mid.value.set(0x5a6458); U.horizon.value.set(0x9aa088); U.floorC.value.set(0x6a7a3a);
  scene.fog = new THREE.Fog(0x7a8070, 20, 110);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xb8c0a8); hemi.intensity = 0.8;
  scene.add(world(['#6a7a3a', ['90,110,50', '110,130,60', '80,100,40']]));
  // farm: house, fence, road
  const wood = new THREE.MeshStandardMaterial({ color: 0xb03a2a, roughness: 0.8 });
  const house = new THREE.Group(); house.position.set(-5.5, 0, -12); scene.add(house);
  const hb = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 2.6), wood); hb.position.y = 1.1; house.add(hb);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.4, 4), new THREE.MeshStandardMaterial({ color: 0x3a3a3a })); roof.rotation.y = Math.PI / 4; roof.scale.set(1.25, 1, 1.0); roof.position.y = 2.9; house.add(roof);
  const roadT = canvasTex(64, 512, (g) => { g.fillStyle = '#4a4a4e'; g.fillRect(0, 0, 64, 512); g.fillStyle = '#ffd23f'; for (let i = 0; i < 8; i++) g.fillRect(29, i * 64, 6, 32); });
  roadT.wrapS = roadT.wrapT = THREE.RepeatWrapping; roadT.repeat.set(1, 20);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(4, 200), new THREE.MeshStandardMaterial({ map: roadT })); road.rotation.x = -Math.PI / 2; road.rotation.z = Math.PI / 2; road.position.set(0, 0.02, -4.5); scene.add(road);
  // car
  const car = new THREE.Group(); scene.add(car);
  const paint = new THREE.MeshStandardMaterial({ color: 0x39a0ff, metalness: 0.5, roughness: 0.3 });
  const cb = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.5, 1.6), paint); cb.position.y = 0.55; car.add(cb);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 1.45), new THREE.MeshStandardMaterial({ color: 0x223040 })); cab.position.set(-0.2, 1.0, 0); car.add(cab);
  for (const [x, z] of [[1.1, 0.8], [1.1, -0.8], [-1.1, 0.8], [-1.1, -0.8]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0x1a1a1e })); w.rotation.x = Math.PI / 2; w.position.set(x, 0.32, z); car.add(w); }
  // tornado funnel: rings of dark sprites spinning
  const funnel = new THREE.Group(); scene.add(funnel);
  const dustT = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(80,80,76,0.9)'); gr.addColorStop(1, 'rgba(80,80,76,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const FP = []; const fr = rng(3); for (let i = 0; i < 260; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dustT, transparent: true, depthWrite: false, opacity: 0.8 })); s.userData = { h: fr(), a: fr() * 6.28, sp: 2 + fr() * 2, sz: 1.2 + fr() * 1.6 }; funnel.add(s); FP.push(s); }
  const cloudLid = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 3, 32), new THREE.MeshStandardMaterial({ color: 0x3a3e40, transparent: true, opacity: 0.85 })); cloudLid.position.y = 22; scene.add(cloudLid);
  // debris
  const debris = []; const dr = rng(7);
  const dmk = (kind) => kind === 0 ? new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.18), new THREE.MeshStandardMaterial({ color: 0x8a6a40 })) : kind === 1 ? new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), new THREE.MeshStandardMaterial({ color: 0xcfeaff, transparent: true, opacity: 0.7, side: THREE.DoubleSide, metalness: 0.5 })) : new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.5), new THREE.MeshStandardMaterial({ color: 0xa8acb4, metalness: 0.8, roughness: 0.3 }));
  for (let i = 0; i < 24; i++) { const k = i % 3; const m = dmk(k); m.userData = { k, y: 0.5 + dr() * 3.5, z: -2 + dr() * 5, ph: dr(), sp: 0.7 + dr() * 0.6, r: V(dr() * 9, dr() * 9, dr() * 9) }; scene.add(m); debris.push(m); }
  const labels = ['WOOD', 'GLASS', 'METAL'].map(w => { const s = textSprite(w, '#ffd23f', "400 110px Brand, sans-serif"); s.renderOrder = 31; s.material.depthTest = false; scene.add(s); return s; });
  // ditch
  const ditch = new THREE.Mesh(new THREE.BoxGeometry(5, 0.6, 1.3), new THREE.MeshStandardMaterial({ color: 0x4a3a22, roughness: 1 })); ditch.position.set(3.0, -0.28, 2.6); ditch.visible = false; scene.add(ditch);
  const ditchTop = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.3), new THREE.MeshStandardMaterial({ color: 0x3a2e1a })); ditchTop.rotation.x = -Math.PI / 2; ditchTop.position.set(3.0, 0.03, 2.6); scene.add(ditchTop);
  // highway bridge (appears later, far right)
  const bridge = new THREE.Group(); bridge.position.set(16, 0, 1.5); scene.add(bridge);
  const conc = new THREE.MeshStandardMaterial({ color: 0x9a9a94, roughness: 0.9 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 10), conc); deck.position.y = 3.2; bridge.add(deck);
  for (const z of [-3.5, 3.5]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.0, 0.5), conc); p.position.set(0, 1.5, z); bridge.add(p); }
  const slope = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.0, 3.0), conc); slope.position.set(0, 1.5, -4.8); bridge.add(slope);
  const windLines = []; for (let i = 0; i < 14; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 1.4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })); l.userData = { y: 0.5 + (i % 5) * 0.5, x: -0.8 + (i % 4) * 0.5, ph: i / 14 }; bridge.add(l); windLines.push(l); }
  const noX = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(256, 256, (g) => { g.strokeStyle = '#ff3b3b'; g.lineWidth = 34; g.lineCap = 'round'; g.beginPath(); g.moveTo(50, 50); g.lineTo(206, 206); g.moveTo(206, 50); g.lineTo(50, 206); g.stroke(); }), transparent: true, depthTest: false, toneMapped: false })); noX.renderOrder = 30; scene.add(noX);
  // hero
  const hero = makeHuman('casual', { shirt: 0xffd23f, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const spd = textSprite('', '#ffffff'); scene.add(spd);
  const cc = document.createElement('canvas'); cc.width = 768; cc.height = 220; const cg = cc.getContext('2d'); const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace;
  const cnt = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); cnt.renderOrder = 31; scene.add(cnt); let lastC = '';
  const drawC = (s, col) => { if (s === lastC) return; lastC = s; cg.clearRect(0, 0, 768, 220); cg.font = "400 120px Brand, sans-serif"; cg.textAlign = 'center'; cg.textBaseline = 'middle'; cg.lineWidth = 14; cg.strokeStyle = 'rgba(0,0,0,0.6)'; cg.strokeText(s, 384, 110); cg.fillStyle = col; cg.fillText(s, 384, 110); ct.needsUpdate = true; };
  const fx = { roof: burst(0x5a5a5a, 60, 1) }; scene.add(fx.roof);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // funnel position: far behind, approaches, passes left
      const fpos = V(-9 + t * 0.3, 0, -17 + t * 0.35);
      funnel.position.copy(fpos);
      FP.forEach(s => { const h = s.userData.h; const r = 0.6 + h * h * 6; const a = s.userData.a + t * s.userData.sp * (1.6 - h); s.position.set(Math.cos(a) * r, h * 20, Math.sin(a) * r); s.scale.setScalar(s.userData.sz * (1 + h * 2)); });
      // car lifted (7.0..10.6)
      const lift = easeIn(range(t, 7.2, 10.4));
      car.position.set(lerp(-1.0, fpos.x + 3, lift), lift * 9, lerp(-4.5, fpos.z + 2, lift)); car.rotation.set(lift * 4, lift * 3, lift * 2);
      // roof rips 9.2
      const rr = easeIn(range(t, 9.2, 10.8));
      roof.position.set(rr * 3, 2.9 + rr * 7, rr * -2); roof.rotation.set(rr * 3, Math.PI / 4 + rr * 5, rr * 2);
      fx.roof.position.set(-5.5, 3.0, -12); fx.roof.update(t - 9.2);
      // debris flies across (10.8..17.3), from left to right past hero
      const dk = smooth(range(t, 10.6, 11.2)) * (1 - smooth(range(t, 17.0, 17.6)));
      debris.forEach((d, i) => { const u2 = (t * 0.35 * d.userData.sp + d.userData.ph) % 1; d.position.set(-9 + u2 * 18, d.userData.y + Math.sin(u2 * 6 + i) * 0.4, d.userData.z); d.rotation.set(d.userData.r.x * t, d.userData.r.y * t, d.userData.r.z * t * 0.3); d.visible = dk > 0.01; });
      // hero
      const runK = smooth(range(t, 15.2, 18.6));
      const lie = smooth(range(t, 19.6, 20.4));
      const toBridge = t > 21.9;
      let hp = V(0.6, 0, 2.2).lerp(V(3.0, 0, 2.6), runK);
      hero.root.position.copy(hp); hero.root.rotation.set(0, runK > 0.01 && runK < 0.99 ? Math.PI / 2 : -0.3, 0);
      let pose = STAND(t);
      if (t < 15) { const lean = 0.25 + 0.05 * Math.sin(t * 9); pose = over(pose, { spine: [lean, 0, -0.1], lSh: [-0.4, 0, 0.5 + 0.1 * Math.sin(t * 13)], rSh: [-1.2, 0, -0.2], rEl: [-1.4, 0, 0], neck: [0.1, -0.3, 0] }); }
      if (runK > 0.01 && runK < 0.99) { const s5 = Math.sin(t * 10); pose = over(pose, { lHip: [-0.7 * s5, 0, 0.07], rHip: [0.7 * s5, 0, -0.07], lKn: [1.0 * Math.max(0, s5), 0, 0], rKn: [1.0 * Math.max(0, -s5), 0, 0], lSh: [0.8 * s5, 0, 0.15], rSh: [-0.8 * s5, 0, -0.15], spine: [0.3, 0, 0] }); }
      if (lie > 0.01) { pose = over(STAND(t), { lSh: [-2.8 * lie, 0, 0.3], rSh: [-2.8 * lie, 0, -0.3], lEl: [-2.0 * lie, 0, 0], rEl: [-2.0 * lie, 0, 0], neck: [0.3, 0, 0] }); hero.root.rotation.set(-Math.PI / 2 * lie, Math.PI / 2, 0, 'YXZ'); hero.root.position.y = 0.13 * lie; }
      if (t > 22.3) { hero.root.position.set(16.3, 0, 2.6); hero.root.rotation.set(0, -0.6, 0); const w = Math.sin(t * 14) * 0.05; pose = over(STAND(t), { spine: [0.2, 0, 0.25 + w], lSh: [-1.0, 0, 0.6], rSh: [-1.6, 0, -0.4], neck: [0.1, 0, 0.2], lHip: [-0.2, 0, 0.2], rHip: [0.1, 0, -0.1] }); }
      hero.setPose(pose); hero.setMouth(t < 3 || t > 24.7 ? 0.6 : 0.1);
      scene.updateMatrixWorld(true);
      // labels near debris pieces
      const lt = [13.22, 13.83, 14.5];
      labels.forEach((l, j) => { const k = easeOut(range(t, lt[j], lt[j] + 0.2)) * (1 - smooth(range(t, 16.6, 17.0))); const piece = debris[j + 3]; l.position.copy(piece.position).add(V(0, 0.45, 0.2)); l.scale.set(0.9 * k, 0.45 * k, 1); l.visible = k > 0.01; });
      // bridge
      const bk = smooth(range(t, 22.0, 22.6));
      windLines.forEach(l => { const u2 = (t * 2.2 + l.userData.ph) % 1; l.position.set(l.userData.x, l.userData.y, -5 + u2 * 10); l.material.opacity = bk * (t > 24.7 ? 1 : 0.4) * Math.sin(u2 * Math.PI); l.scale.z = t > 24.7 ? 2.2 : 1; });
      const xk = easeOut(range(t, 23.3, 23.6));
      noX.position.copy(bridge.position).add(V(0.6, 2.4, 1.6)); noX.scale.setScalar(1.1 * xk); noX.visible = xk > 0.01;
      // ---------- camera ----------
      const KEYS = [[0, [3.2, 1.8, 10.5], [-1.2, 3.0, -6]], [2.3, [3.2, 1.8, 10.0], [-1.0, 2.6, -6]], [7.0, [3.5, 2.2, 7.5], [-2.0, 2.0, -6.0]], [10.6, [3.0, 1.8, 8.5], [0.5, 1.4, 1.0]], [17.0, [3.0, 1.8, 8.5], [1.6, 1.0, 2.0]], [19.4, [3.2, 2.6, 7.0], [2.2, 0.3, 2.6]], [21.6, [3.2, 2.6, 7.0], [2.2, 0.3, 2.6]], [22.8, [12.0, 2.2, 11.0], [16.0, 1.5, 2.0]], [28.0, [12.4, 2.0, 10.0], [16.1, 1.4, 2.2]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 1.2 + (t > 7 && t < 17 ? 1.0 : 0), 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion);
      let on = 0; if (t > 3.4 && t < 7.0) { drawC(`${Math.round(lerp(0, 300, easeOut(range(t, 3.6, 6.2))))} km/h`, '#ffd23f'); on = 1; }
      cnt.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.2); cnt.scale.set(0.42 * on, 0.12 * on, 1); cnt.visible = !!on;
      return { dof: { focus: 6, aperture: 0, maxblur: 0 }, bloom: 0.3, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
