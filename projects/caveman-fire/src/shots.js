import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp, world, rock, tree, flame, smoke, campfire } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 24.0;
export const CAPTIONS = [
  [0.0, 'How did cavemen make fire?'],
  [2.36, 'One way was striking two rocks together'], [5.12, 'A hard stone called flint'], [6.97, 'hitting a rock with iron in it'], [8.67, 'throws off hot sparks'],
  [10.65, 'Another way was spinning a wooden stick'], [12.7, 'against a flat piece of wood'], [14.45, 'super fast'], [15.61, 'until the friction made a glowing ember'],
  [18.08, 'Then they dropped it into dry grass'], [20.25, 'blew on it gently'], [21.42, 'and...'], [22.22, 'fire!', 23.8],
];
export const FADES = [];

const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const STRIKES = [0.5, 1.2, 1.9, 3.95, 4.35, 7.3, 8.9, 9.3, 9.7];
const FIRE = 22.2;

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 7, sunDir: [-5, 4, 3], sun: 0.7 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x1a2450); u.mid.value.set(0x5a4a7a); u.horizon.value.set(0xe08a5a); u.floorC.value.set(0x6a6048);
  scene.fog = new THREE.Fog(0x4a3a50, 20, 90);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0x8a90c8); hemi.groundColor.set(0x3a2a20); hemi.intensity = 0.55;
  scene.add(world());
  // cave mouth: big boulders forming an arch behind
  const cm = 0x6a645a; const rr = rng(3);
  for (let i = 0; i < 9; i++) { const a = Math.PI * (i / 8); const r = rock(1.4 + rr() * 0.6, 40 + i, cm); r.position.set(Math.cos(a) * 3.0, Math.sin(a) * 2.6, -3.0); r.scale.setScalar(1.3); scene.add(r); }
  const caveDark = new THREE.Mesh(new THREE.CircleGeometry(2.6, 32, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x0a0806 })); caveDark.position.set(0, 0.01, -3.4); scene.add(caveDark);
  [[-5, -6], [5.5, -7], [-7, -2]].forEach(([x, z], i) => { const tr = tree({ h: 3.4, seed: i + 60, col: 0x3a5a3a }); tr.position.set(x, 0, z); scene.add(tr); });
  // hero caveman kneeling
  const hero = makeHuman('hide', { long: true, beard: true, hair: 0x3a2716, skin: 0xc8946a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  // stones
  const flint = new THREE.Mesh(new THREE.DodecahedronGeometry(0.07, 0), new THREE.MeshStandardMaterial({ color: 0x3a3a42, flatShading: true, roughness: 0.4 })); scene.add(flint);
  const iron = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08, 0), new THREE.MeshStandardMaterial({ color: 0x8a4a2a, flatShading: true, metalness: 0.4 })); scene.add(iron);
  const sparks = STRIKES.map((s, i) => { const b = burst(0xffc040, 26, i + 3); scene.add(b); return b; });
  const lblF = textSprite('FLINT', '#cfd8e8', "400 100px Brand, sans-serif"); scene.add(lblF);
  const lblI = textSprite('IRON ROCK', '#ff9a5a', "400 90px Brand, sans-serif"); scene.add(lblI);
  // fire drill: board + spindle
  const wood = new THREE.MeshStandardMaterial({ color: 0x9a6a3a, roughness: 0.8 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.12), wood); board.position.set(0.05, 0.02, 0.45); scene.add(board);
  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0x7a5a32 })); scene.add(spindle);
  const sm = smoke(10, 4); sm.position.set(0.05, 0.05, 0.45); sm.scale.setScalar(0.3); scene.add(sm);
  const ember = glowSprite(0xff5a1a, 0.18); scene.add(ember);
  const emberL = new THREE.PointLight(0xff6a2a, 0, 2.5, 1.5); scene.add(emberL);
  // grass nest + campfire
  const nest = new THREE.Group(); nest.position.set(0.05, 0, 0.75); scene.add(nest); const nr = rng(9);
  for (let i = 0; i < 40; i++) { const g = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.18, 4), new THREE.MeshStandardMaterial({ color: 0xd8b860 })); const a = nr() * 6.28; g.position.set(Math.cos(a) * 0.08, 0.05, Math.sin(a) * 0.08); g.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2); nest.add(g); }
  const fire = campfire(); fire.position.set(0.05, 0, 0.75); scene.add(fire); fire.userData.meat.visible = false; fire.children.forEach(o => { if (o.geometry && o.geometry.type === 'CylinderGeometry' && o.position.y > 0.3) o.visible = false; });
  const puffs = []; for (let i = 0; i < 6; i++) { const s = glowSprite(0xe8e0d8, 0.12); s.userData.ph = i / 6; scene.add(s); puffs.push(s); }
  const fx = { fire: burst(0xffa040, 80, 1) }; scene.add(fx.fire);
  const fireWord = stamp('FIRE!', '#ff8a2a', 0.5); scene.add(fireWord);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      hero.root.position.set(-0.35, -0.45, 0.3); hero.root.rotation.y = 0.9;
      const drill = smooth(range(t, 10.6, 11.2)) * (1 - smooth(range(t, 17.9, 18.3)));
      const blow = smooth(range(t, 19.9, 20.3)) * (1 - smooth(range(t, 21.8, 22.3)));
      const cheer = smooth(range(t, FIRE + 0.2, FIRE + 0.7));
      const base = { lHip: [-1.3, 0, 0.25], rHip: [-1.3, 0, -0.25], lKn: [2.1, 0, 0], rKn: [2.1, 0, 0], lAn: [0.5, 0, 0], rAn: [0.5, 0, 0], spine: [0.35 + 0.25 * blow, 0, 0], neck: [0.35 + 0.2 * blow, 0, 0], lSh: [0.1, 0, 0.2], rSh: [0.1, 0, -0.2], lEl: [-0.3, 0, 0], rEl: [-0.3, 0, 0] };
      let pose = base;
      if (cheer > 0.01) pose = over(base, { lSh: [-2.6 * cheer, 0, 0.4], rSh: [-2.6 * cheer, 0, -0.4], spine: [0.1, 0, 0], neck: [-0.1, 0, 0] });
      hero.setPose(pose); hero.setMouth(blow > 0.3 ? 0.35 : cheer > 0.3 ? 0.7 : 0.08);
      scene.updateMatrixWorld(true);
      const rs = hero.j.rSh.getWorldPosition(V()), ls = hero.j.lSh.getWorldPosition(V());
      const center = V(0.05, 0.35, 0.55);
      // striking: right hand flint swings onto iron in left hand
      const strikeOn = t < 2.3 || (t > 2.3 && t < 10.5);
      let sk = 0; STRIKES.forEach(s => { sk = Math.max(sk, Math.max(0, 1 - Math.abs(t - s) / 0.18)); });
      if (strikeOn && drill < 0.01 && cheer < 0.01) {
        ikArm(hero, 'l', center.clone().add(V(-0.03, 0.0, 0.0)), ls.clone().add(V(0, -0.3, 0.3)), V(0, 0, 1));
        ikArm(hero, 'r', center.clone().add(V(0.1 - 0.08 * sk, 0.18 - 0.16 * sk, 0.02)), rs.clone().add(V(0.2, -0.3, 0.2)), V(0, 0, 1));
      }
      if (drill > 0.01) { const rub = Math.sin(t * 30) * 0.05; const top = V(0.05, 0.38, 0.45); ikArm(hero, 'l', top.clone().add(V(-0.04, 0, rub)), ls.clone().add(V(0, -0.3, 0.3)), V(0, 0, 1)); ikArm(hero, 'r', top.clone().add(V(0.04, 0, -rub)), rs.clone().add(V(0.2, -0.3, 0.3)), V(0, 0, 1)); }
      scene.updateMatrixWorld(true);
      const lh = hero.j.lWr.localToWorld(V(0, -0.07, 0)), rh = hero.j.rWr.localToWorld(V(0, -0.07, 0));
      iron.position.copy(lh); flint.position.copy(rh); iron.visible = flint.visible = strikeOn && drill < 0.05 && cheer < 0.01;
      STRIKES.forEach((s, i) => { sparks[i].position.copy(lh).add(V(0, 0.05, 0)); sparks[i].update((t - s) * 0.6); });
      const fk = easeOut(range(t, 5.3, 5.6)) * (1 - smooth(range(t, 10.3, 10.6))), ik = easeOut(range(t, 7.0, 7.3)) * (1 - smooth(range(t, 10.3, 10.6)));
      lblF.position.copy(rh).add(V(0.1, 0.25, 0.1)); lblF.scale.set(0.42 * fk, 0.21 * fk, 1); lblF.visible = fk > 0.01;
      lblI.position.copy(lh).add(V(-0.1, -0.2, 0.25)); lblI.scale.set(0.46 * ik, 0.23 * ik, 1); lblI.visible = ik > 0.01;
      // spindle
      spindle.position.set(0.05, 0.32, 0.45); spindle.rotation.y = t * 40; spindle.visible = drill > 0.05;
      board.visible = t > 10.4 && t < 19.0;
      const smk = smooth(range(t, 15.4, 16.0)) * (1 - smooth(range(t, 22.5, 23.2)));
      sm.update(t, smk); sm.visible = smk > 0.01;
      // ember: forms at 16.9, moves to nest 18.4..19.2, grows while blowing
      const ek = smooth(range(t, 16.8, 17.4)) * (1 - smooth(range(t, FIRE, FIRE + 0.2)));
      const mv = smooth(range(t, 18.4, 19.3));
      const ep = V(0.05, 0.05, 0.45).lerp(V(0.05, 0.08, 0.75), mv);
      ember.position.copy(ep); const glowS = 0.12 + 0.12 * blow * (0.6 + 0.4 * Math.sin(t * 12)); ember.scale.setScalar(glowS * ek); ember.visible = ek > 0.01;
      emberL.position.copy(ep).add(V(0, 0.1, 0)); emberL.intensity = ek * (1.5 + 3 * blow);
      const mouth = hero.j.head.localToWorld(V(0, -0.05, 0.16));
      puffs.forEach((s, i) => { const u2 = (t * 1.5 + s.userData.ph) % 1; s.position.copy(mouth).lerp(ep, u2); s.material.opacity = blow * 0.5 * (1 - u2); s.visible = blow > 0.05; });
      // fire!
      const fk2 = easeOut(range(t, FIRE, FIRE + 0.5));
      fire.visible = t > FIRE - 0.1; fire.update(t, fk2); fire.userData.fl.scale.setScalar(0.3 + 1.0 * fk2);
      nest.visible = t < FIRE + 0.3;
      fx.fire.position.set(0.05, 0.3, 0.75); fx.fire.update(t - FIRE);
      // ---------- camera ----------
      const KEYS = [[0, [2.3, 1.75, 4.8], [0.0, 0.55, 0.1]], [2.3, [1.9, 1.55, 4.0], [-0.05, 0.5, 0.2]], [21.6, [1.9, 1.55, 3.9], [0.0, 0.5, 0.25]], [24.0, [2.3, 1.75, 4.6], [0.0, 0.6, 0.2]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.35 + sk * 1.2 + (Math.abs(t - FIRE) < 0.3 ? 2.5 : 0), 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion);
      fireWord.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); fireWord.set(t > FIRE + 0.1 ? easeOut(range(t, FIRE + 0.1, FIRE + 0.3)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.6, exposure: 0.92 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
