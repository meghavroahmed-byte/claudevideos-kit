import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp, world, tree, tent } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 24.6;
export const CAPTIONS = [
  [0.0, 'How did people attack a castle?'],
  [2.31, 'First, they surrounded it'], [4.22, 'so no food could get in'], [6.22, 'Sometimes they waited for months'], [8.27, 'until everyone inside was starving'],
  [10.93, 'In a hurry?'], [11.84, 'They rolled up a battering ram'], [13.3, 'to smash the gate'],
  [14.82, 'Giant catapults called trebuchets'], [16.99, 'hurled huge boulders at the walls'],
  [19.37, 'And some attackers even dug tunnels'], [21.49, 'under the walls to make them collapse!', 24.4],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const RAM_HIT = 14.0, FIRE = 17.1, BHIT = 18.4, HOOK_FIRE = 0.3, COLL = 22.5, WZ = -9;

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 12, sunDir: [-5, 9, 6], sun: 2.6 });
  const U = scene.userData.sky.material.uniforms; U.floorC.value.set(0x6a8a3a);
  const DAY = [0x2f7fd8, 0x7ab4e8, 0xe0ecf2], NIGHT = [0x0a1430, 0x1a2a5a, 0x3a4a7a];
  scene.fog = new THREE.Fog(0xd8e4ec, 40, 140);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.85; const key = scene.userData.key;
  scene.add(world(['#6a8a3a', ['90,120,60', '110,140,70', '80,110,50']]));
  // castle front
  const st = canvasTex(256, 256, (g) => { g.fillStyle = '#9a948a'; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(60,56,50,0.5)'; g.lineWidth = 3; for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) g.strokeRect(c * 64 + (r % 2) * 32, r * 32, 64, 32); });
  st.wrapS = st.wrapT = THREE.RepeatWrapping; st.repeat.set(4, 2);
  const sm = new THREE.MeshStandardMaterial({ map: st, roughness: 0.95 });
  const wallSeg = (w, x) => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(w, 5, 1.2), sm); m.position.y = 2.5; m.castShadow = true; g.add(m); for (let i = 0; i < w / 1.2; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 1.2), sm); b.position.set(-w / 2 + 0.3 + i * 1.2, 5.3, 0); g.add(b); } g.position.set(x, 0, WZ); scene.add(g); return g; };
  wallSeg(5.6, -3.4); wallSeg(4.0, 6.4); const weak = wallSeg(3.2, 2.9);
  for (const x of [-7.2, 9.2]) { const tw = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 8, 20), sm); tw.position.set(x, 4, WZ); scene.add(tw); const rf = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2.6, 20), new THREE.MeshStandardMaterial({ color: 0x8a2a2a })); rf.position.set(x, 9.3, WZ); scene.add(rf); }
  const gateArch = new THREE.Mesh(new THREE.BoxGeometry(1.8, 5, 1.2), sm); gateArch.position.set(0.4, 2.5, WZ); scene.add(gateArch);
  const gate = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.6, 0.2), new THREE.MeshStandardMaterial({ map: canvasTex(128, 256, (g) => { g.fillStyle = '#6b4a2e'; g.fillRect(0, 0, 128, 256); g.fillStyle = '#4a3220'; for (let i = 0; i < 6; i++) g.fillRect(i * 22, 0, 3, 256); g.fillStyle = '#333'; g.fillRect(0, 60, 128, 10); g.fillRect(0, 190, 128, 10); }) })); gate.position.set(0.4, 1.3, WZ + 0.62); scene.add(gate);
  const defender = makeHuman('casual', { shirt: 0x2a4a8a, jeans: 0x3a3a48, hair: 0x5a3a20 }); defender.root.position.set(-3.0, 5.0, WZ); defender.root.scale.setScalar(0.9); scene.add(defender.root);
  // siege camp
  [[-5.5, 1.5], [5.2, 2.0], [-3.6, 4.2]].forEach(([x, z], i) => { const tn = tent(i + 3, [0xb08a5c, 0xc8a070, 0xa07040][i]); tn.position.set(x, 0, z); scene.add(tn); });
  [[-12, 4], [12, 6], [-14, -3]].forEach(([x, z], i) => { const tr = tree({ h: 4, seed: i + 20 }); tr.position.set(x, 0, z); scene.add(tr); });
  const soldiers = []; const sr = rng(7);
  for (let i = 0; i < 6; i++) { const s = makeHuman('casual', { shirt: 0xb3261e, jeans: 0x4a3a2a, hair: 0x3a2a1a }); const hm = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xa8acb4, metalness: 0.8, roughness: 0.3 })); hm.position.y = 0.16; s.j.head.add(hm); s.root.position.set([-4.4, -3.3, 1.8, 2.9, 4.0, -5.4][i], 0, -3.6 - sr() * 1.0); s.root.rotation.y = Math.PI; scene.add(s.root); soldiers.push(s); }
  // hero commander
  const hero = makeHuman('casual', { shirt: 0xb3261e, jeans: 0x4a3a2a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xc8ccd4, metalness: 0.8, roughness: 0.25 })); helm.position.y = 0.16; hero.j.head.add(helm);
  const plume = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0xffd23f })); plume.position.y = 0.33; hero.j.head.add(plume);
  // battering ram
  const ram = new THREE.Group(); scene.add(ram); const wood = new THREE.MeshStandardMaterial({ color: 0x7a5434, roughness: 0.9 });
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 3.2, 14), wood); log.rotation.x = Math.PI / 2; log.position.y = 0.9; ram.add(log);
  const tipM = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), new THREE.MeshStandardMaterial({ color: 0x555a60, metalness: 0.7 })); tipM.position.set(0, 0.9, -1.6); ram.add(tipM);
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.3, 2.6), wood); r.position.set(s * 0.45, 1.25, 0); r.rotation.z = s * 0.55; ram.add(r); }
  for (const [x, z] of [[-0.5, -0.9], [0.5, -0.9], [-0.5, 0.9], [0.5, 0.9]]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16), wood); wh.rotation.z = Math.PI / 2; wh.position.set(x, 0.3, z); ram.add(wh); }
  // trebuchet
  const treb = new THREE.Group(); treb.position.set(-2.1, 0, -2.4); treb.rotation.y = 0.1; scene.add(treb);
  for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.4, 0.18), wood); a.position.set(s * 0.6, 1.7, 0); treb.add(a); const b = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 3.2), wood); b.position.set(s * 0.6, 0.1, 0); treb.add(b); }
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), wood); axle.rotation.z = Math.PI / 2; axle.position.y = 3.3; treb.add(axle);
  const armG = new THREE.Group(); armG.position.y = 3.3; treb.add(armG);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 5.0), wood); arm.position.z = 0.9; armG.add(arm);
  const cw = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x4a4a50 })); cw.position.set(0, -0.4, -1.4); armG.add(cw);
  const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 1), new THREE.MeshStandardMaterial({ color: 0x8a8a84, flatShading: true })); boulder.castShadow = true; scene.add(boulder);
  const boulder0 = boulder.clone(); scene.add(boulder0);
  // tunnel (dotted glowing path) + digger
  const tdots = []; for (let i = 0; i < 26; i++) { const s = glowSprite(0xc8853a, 0.18); scene.add(s); tdots.push(s); }
  const debris = []; const dr = rng(11); for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), sm); b.userData = { x: 2.9 + (dr() - 0.5) * 2.6, y: 1 + dr() * 4, v: V((dr() - 0.5) * 2, dr() * 2, 1 + dr() * 2) }; b.visible = false; scene.add(b); debris.push(b); }
  // food cart blocked + "X"
  const cart = new THREE.Group(); cart.position.set(1.7, 0, -6.6); scene.add(cart); const cb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.6), wood); cb.position.y = 0.6; cart.add(cb); for (let i = 0; i < 5; i++) { const ap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshStandardMaterial({ color: [0xd8342a, 0xffd23f][i % 2] })); ap.position.set(-0.3 + i * 0.15, 0.85, 0); cart.add(ap); }
  const noT = canvasTex(256, 256, (g) => { g.strokeStyle = '#ff3b3b'; g.lineWidth = 34; g.lineCap = 'round'; g.beginPath(); g.moveTo(50, 50); g.lineTo(206, 206); g.moveTo(206, 50); g.lineTo(50, 206); g.stroke(); });
  const noX = new THREE.Sprite(new THREE.SpriteMaterial({ map: noT, transparent: true, depthTest: false, toneMapped: false })); noX.renderOrder = 30; scene.add(noX);
  const fx = { gate: burst(0xc8a070, 70, 1), wall: burst(0xb8b0a0, 80, 2), coll: burst(0xc8b8a0, 110, 3), hook: burst(0xb8b0a0, 60, 4) }; Object.values(fx).forEach(f => scene.add(f));
  const crack = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (g) => { g.strokeStyle = 'rgba(30,25,20,0.9)'; g.lineWidth = 6; for (let i = 0; i < 9; i++) { let x = 128, y = 128; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += Math.cos(i * 0.7 + k) * 30; y += Math.sin(i * 0.7 + k * 0.5) * 30; g.lineTo(x, y); } g.stroke(); } }), transparent: true, depthWrite: false })); crack.position.set(-3.0, 3.0, WZ + 0.62); scene.add(crack);
  const c = cam(38);
  const shotArc = (t0, t1, a, b, h, t) => { const u2 = clamp((t - t0) / (t1 - t0), 0, 1); const p = a.clone().lerp(b, u2); p.y += 4 * h * u2 * (1 - u2); return p; };

  return {
    scene, camera: c,
    update(t) {
      // day/night cycling = "months" (6.2..10.6)
      const cyc = smooth(range(t, 6.3, 6.8)) * (1 - smooth(range(t, 10.2, 10.7)));
      const nk = cyc * (0.5 - 0.5 * Math.cos((t - 6.3) * 4.5));
      [U.top, U.mid, U.horizon].forEach((un, i) => un.value.copy(new THREE.Color(DAY[i]).lerp(new THREE.Color(NIGHT[i]), nk)));
      key.intensity = lerp(2.6, 0.5, nk); hemi.intensity = lerp(0.85, 0.35, nk);
      // defender gets thinner
      const thin = smooth(range(t, 8.0, 10.4));
      defender.setPose(over(STAND(t, 1), { spine: [0.25 * thin, 0, 0], neck: [0.3 * thin, 0, 0] })); defender.setMouth(0.05);
      defender.j.chest.scale.set(1 - 0.35 * thin, 1, 1 - 0.35 * thin); defender.j.spine.scale.set(1 - 0.35 * thin, 1, 1 - 0.35 * thin);
      defender.root.visible = t < 14.6;
      // hero
      hero.root.position.set(-0.2, 0, 2.0); hero.root.rotation.y = Math.PI + 0.35;
      let pose = STAND(t);
      const point = Math.max(smooth(range(t, 2.4, 2.9)) * (1 - smooth(range(t, 5.6, 6.1))), smooth(range(t, 11.5, 12.0)) * (1 - smooth(range(t, 13.4, 13.8))), smooth(range(t, 16.4, 16.9)) * (1 - smooth(range(t, 18.0, 18.4))));
      hero.setPose(pose); hero.setMouth(point > 0.5 ? 0.4 : 0.06);
      scene.updateMatrixWorld(true);
      if (point > 0.01) { const rs = hero.j.rSh.getWorldPosition(V()); ikArm(hero, 'r', rs.clone().add(V(-0.05, -0.5, 0.05)).lerp(rs.clone().add(V(-0.25, 0.25, -0.5)), point), rs.clone().add(V(0.3, -0.3, 0.2)), V(0, 0, 1)); }
      // soldiers: surround (march sideways), cheer later
      soldiers.forEach((s, i) => { const march = t > 2.3 && t < 6.0; s.root.position.x += 0; s.setPose(over(STAND(t, i), march ? { lHip: [-0.4 * Math.sin(t * 6 + i), 0, 0.07], rHip: [0.4 * Math.sin(t * 6 + i), 0, -0.07] } : (t > 22.6 && t < 24.4 ? { lSh: [-2.6, 0, 0.3], rSh: [-2.6, 0, -0.3] } : {}))); s.setMouth(t > 22.6 ? 0.5 : 0.05); });
      // food cart blocked
      const xk = easeOut(range(t, 4.7, 5.0)) * (1 - smooth(range(t, 6.2, 6.6)));
      noX.position.copy(cart.position).add(V(0, 1.4, 0.3)); noX.scale.setScalar(0.9 * xk); noX.visible = xk > 0.01;
      // battering ram
      const roll = easeInOut(range(t, 11.8, 13.6));
      const swing = t > 13.6 && t < 14.8 ? Math.sin((t - 13.6) / 1.2 * Math.PI * 2 - 1.2) : 0;
      ram.position.set(0.4, 0, lerp(-2.0, WZ + 2.3, roll) + (t > 13.6 ? -0.2 * Math.max(0, Math.sin(Math.PI * range(t, 13.7, RAM_HIT))) : 0)); ram.visible = t > 11.0 && t < 19.4;
      const gk = Math.exp(-Math.max(0, t - RAM_HIT) * 4) * (t > RAM_HIT ? 1 : 0);
      gate.rotation.x = -0.12 * gk * Math.sin((t - RAM_HIT) * 30); gate.position.z = WZ + 0.62 - 0.1 * gk;
      fx.gate.position.set(0.4, 1.2, WZ + 0.9); fx.gate.update(t - RAM_HIT);
      // trebuchet: hook fire + main fire
      const swing1 = easeIn(range(t, HOOK_FIRE - 0.3, HOOK_FIRE + 0.2)), swing2 = easeIn(range(t, FIRE - 0.4, FIRE + 0.1)), rel = smooth(range(t, 1.8, 3.0)) * (1 - swing2) + 0;
      const armAng = t < 3 ? lerp(-0.9, 1.4, swing1) * (1 - smooth(range(t, 2.0, 3.0))) + (-0.9) * smooth(range(t, 2.0, 3.0)) : lerp(-0.9, 1.4, swing2);
      armG.rotation.x = armAng;
      scene.updateMatrixWorld(true);
      const tip = arm.localToWorld(V(0, 0, 2.5));
      const B0 = shotArc(HOOK_FIRE + 0.2, HOOK_FIRE + 2.0, V(-2.0, 5.2, -2.2), V(-4.4, 3.2, WZ + 0.7), 0.5, t);
      boulder0.position.copy(t < HOOK_FIRE + 0.2 ? tip : B0); boulder0.visible = t < HOOK_FIRE + 2.0; boulder0.rotation.set(t * 3, t * 2, 0);
      fx.hook.position.set(-4.4, 3.2, WZ + 0.8); fx.hook.update(t - HOOK_FIRE - 2.0);
      const B1 = shotArc(FIRE, BHIT, V(-2.0, 5.2, -2.4), V(-3.0, 3.0, WZ + 0.7), 0.6, t);
      boulder.position.copy(t < FIRE ? tip : B1); boulder.visible = t > 14.8 && t < BHIT; boulder.rotation.set(t * 3, t * 2, 0);
      fx.wall.position.set(-3.0, 3.0, WZ + 0.8); fx.wall.update(t - BHIT);
      crack.material.opacity = smooth(range(t, BHIT, BHIT + 0.1)); crack.visible = t > BHIT;
      // tunnel + collapse
      const tk = smooth(range(t, 19.6, 21.6));
      tdots.forEach((s, i) => { const u2 = i / (tdots.length - 1); s.position.set(lerp(3.6, 2.9, u2), 0.06, lerp(2.4, WZ + 0.2, u2)); s.material.opacity = (u2 <= tk ? 0.9 : 0) * (0.6 + 0.4 * Math.sin(t * 6 - i)); s.visible = u2 <= tk && t < 23.6; });
      const ck = easeIn(range(t, COLL, COLL + 0.8));
      weak.position.y = -4.6 * ck; weak.rotation.x = 0.25 * ck; weak.visible = ck < 0.99;
      debris.forEach((b, i) => { const dt = t - COLL; b.visible = dt > 0 && dt < 2.4; if (dt > 0) { b.position.set(b.userData.x + b.userData.v.x * dt * 0.5, Math.max(0.2, b.userData.y + b.userData.v.y * dt - 4.9 * dt * dt), WZ + b.userData.v.z * dt * 0.6); b.rotation.set(dt * 3 + i, dt * 2, 0); } });
      fx.coll.position.set(2.9, 1.5, WZ + 0.8); fx.coll.update(t - COLL);
      // ---------- camera ----------
      const KEYS = [[0, [1.2, 2.4, 9.2], [-1.2, 2.0, -6.0]], [2.3, [0.6, 2.2, 8.2], [-0.8, 1.7, -6.0]], [10.8, [0.6, 2.2, 8.2], [-0.8, 1.7, -6.0]], [12.0, [0.9, 2.2, 8.2], [-0.4, 1.6, -6.0]], [14.6, [0.4, 2.3, 8.6], [-1.2, 2.0, -6.0]], [19.2, [0.4, 2.3, 8.6], [-1.0, 2.0, -6.0]], [21.0, [1.5, 2.6, 11.2], [0.8, 1.9, -6.0]], [24.6, [1.5, 2.6, 11.0], [0.8, 1.9, -6.0]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.4 + (Math.abs(t - RAM_HIT) < 0.3 ? 2.5 : 0) + (Math.abs(t - BHIT) < 0.3 ? 2.5 : 0) + (t > COLL && t < COLL + 0.8 ? 3.5 : 0), 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      return { dof: { focus: 6, aperture: 0, maxblur: 0 }, bloom: 0.3, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
