import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { brainBubble, textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 26.2;
export const CAPTIONS = [
  [0.0, 'Why are yawns contagious?'],
  [2.33, 'When you yawn'], [3.4, 'your jaw stretches wide'], [5.06, 'and you suck in'], [5.93, 'a huge gulp of air'],
  [7.78, 'Scientists think'], [8.89, 'it helps cool down your brain'], [10.61, 'like a fan for your head'],
  [12.24, "But here's the weird part"], [13.91, 'Just seeing someone yawn'], [15.41, 'can make you yawn too'],
  [17.36, 'Your brain copies'], [18.44, 'the people around you'], [19.7, 'especially friends and family'],
  [21.64, 'Even reading about yawning works'], [23.85, 'Are you yawning right now?', 26.0],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const SIT = { drop: -0.45, lHip: [-1.5, 0, 0.1], lKn: [1.45, 0, 0], rHip: [-1.5, 0, -0.1], rKn: [1.45, 0, 0], lSh: [0.1, 0, 0.12], rSh: [0.1, 0, -0.12], lEl: [-0.9, 0, 0], rEl: [-0.9, 0, 0] };
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
// yawn envelope: 0 -> 1 (open) -> 0
const yawnK = (t, a, len = 2.4) => { const u = (t - a) / len; return u < 0 || u > 1 ? 0 : Math.sin(Math.PI * Math.min(1, u * 1.25)) ** 0.7 * (u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2); };
function yawnPose(base, k, arms = true) {
  const p = over(base, { neck: [-0.45 * k, 0, 0], chest: [-0.15 * k, 0, 0] });
  if (arms) { p.lSh = [lerp(base.lSh[0], -2.7, k), 0, lerp(base.lSh[2], 0.3, k)]; p.rSh = [lerp(base.rSh[0], -2.7, k), 0, lerp(base.rSh[2], -0.3, k)]; p.lEl = [lerp(base.lEl[0], -0.5, k), 0, 0]; p.rEl = [lerp(base.rEl[0], -0.5, k), 0, 0]; }
  return p;
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-2, 6, 4], sun: 0.9 });
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xffe2c0); hemi.groundColor.set(0x4a3020); hemi.intensity = 0.9;
  // evening living room
  const wallT = canvasTex(512, 512, (g) => { g.fillStyle = '#5b7f7a'; g.fillRect(0, 0, 512, 512); g.fillStyle = 'rgba(255,255,255,0.06)'; for (let x = 0; x < 512; x += 64) g.fillRect(x, 0, 26, 512); });
  wallT.wrapS = wallT.wrapT = THREE.RepeatWrapping; wallT.repeat.set(4, 2);
  const floorT = canvasTex(512, 512, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#8a5a34' : '#7d5030'; g.fillRect(0, i * 64, 512, 64); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, i * 64, 512, 3); } });
  floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(4, 4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.7 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), new THREE.MeshStandardMaterial({ map: wallT, roughness: 0.9 })); back.position.set(0, 2, -1.6); scene.add(back);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), new THREE.MeshStandardMaterial({ map: wallT, roughness: 0.9 })); side.position.set(-3.6, 2, 2); side.rotation.y = Math.PI / 2; scene.add(side);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.6, 40), new THREE.MeshStandardMaterial({ color: 0xc8553d, roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.005, 0.6); rug.scale.y = 0.6; scene.add(rug);
  // night window with moon
  const winT = canvasTex(256, 320, (g) => { const gr = g.createLinearGradient(0, 0, 0, 320); gr.addColorStop(0, '#0b1636'); gr.addColorStop(1, '#2a3d78'); g.fillStyle = gr; g.fillRect(0, 0, 256, 320); g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(180, 80, 30, 0, 7); g.fill(); g.fillStyle = '#ffffff'; const r = rng(3); for (let i = 0; i < 30; i++) g.fillRect(r() * 256, r() * 200, 2, 2); g.strokeStyle = '#e8dcc8'; g.lineWidth = 14; g.strokeRect(0, 0, 256, 320); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 320); g.moveTo(0, 160); g.lineTo(256, 160); g.stroke(); });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.4), new THREE.MeshBasicMaterial({ map: winT, toneMapped: false })); win.position.set(1.6, 1.85, -1.58); scene.add(win);
  // sofa
  const sofaM = new THREE.MeshStandardMaterial({ color: 0x3d5a98, roughness: 0.85 });
  const sofa = new THREE.Group(); scene.add(sofa); sofa.position.set(-0.35, 0, -0.75);
  const sb = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), sofaM); m.position.set(x, y, z); m.castShadow = true; sofa.add(m); return m; };
  sb(2.2, 0.42, 0.85, 0, 0.21, 0); sb(2.2, 0.6, 0.22, 0, 0.62, -0.32); sb(0.2, 0.62, 0.85, -1.15, 0.31, 0); sb(0.2, 0.62, 0.85, 1.15, 0.31, 0);
  // floor lamp (warm)
  const lampM = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.5, roughness: 0.4 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 8), lampM); pole.position.set(-1.9, 0.8, -1.0); scene.add(pole);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.3, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xffb050, emissiveIntensity: 0.8, side: THREE.DoubleSide })); shade.position.set(-1.9, 1.65, -1.0); scene.add(shade);
  const lampL = new THREE.PointLight(0xffb870, 9, 7, 1.3); lampL.position.set(-1.9, 1.5, -0.8); scene.add(lampL);
  const fill = new THREE.PointLight(0xfff0dc, 5, 8, 1.2); fill.position.set(0.8, 2.4, 2.0); scene.add(fill);
  const tv = new THREE.PointLight(0x7fb0ff, 3, 6, 1.5); tv.position.set(0, 1.0, 2.6); scene.add(tv);

  // people
  const hero = makeHuman('casual', { shirt: 0xf4a261, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const friend = makeHuman('casual', { shirt: 0x2a9d8f, jeans: 0x3a3a48, hair: 0x6a3a1a }); scene.add(friend.root);
  const mom = makeHuman('casual', { shirt: 0xe76f9a, jeans: 0x4a4a6a, hair: 0x2a1a10, long: true }); scene.add(mom.root);
  const dad = makeHuman('casual', { shirt: 0x6c8a3a, jeans: 0x2f3e5a, hair: 0x3a3a3a, beard: true }); scene.add(dad.root);
  const kid = makeHuman('casual', { shirt: 0xffd23f, jeans: 0x3a6ab0, hair: 0x5a3a1a }); scene.add(kid.root); kid.root.scale.setScalar(0.68);
  // gulp of air: streak particles sucked into the mouth
  const air = []; for (let i = 0; i < 40; i++) { const s = glowSprite(0xbfe6ff, 0.06); s.userData.ph = i / 40; s.userData.a = i * 2.39; scene.add(s); air.push(s); }
  // brain bubble (cooling wave) + fan
  const brain = brainBubble(); scene.add(brain);
  const fanT = canvasTex(256, 256, (g) => { g.translate(128, 128); g.fillStyle = 'rgba(200,235,255,0.95)'; for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.ellipse(0, -55, 30, 55, 0.4, 0, 7); g.fill(); } g.fillStyle = '#5a8ab8'; g.beginPath(); g.arc(0, 0, 22, 0, 7); g.fill(); });
  const fan = new THREE.Sprite(new THREE.SpriteMaterial({ map: fanT, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); fan.renderOrder = 21; scene.add(fan);
  const cool = []; for (let i = 0; i < 16; i++) { const s = glowSprite(0x8fd8ff, 0.07); s.renderOrder = 22; s.material.depthTest = false; s.userData.ph = i / 16; scene.add(s); cool.push(s); }
  // "seeing" eye-line dots friend -> hero, and copy-arcs between heads
  const dots = []; for (let i = 0; i < 12; i++) { const s = glowSprite(0xffe14d, 0.05); scene.add(s); dots.push(s); }
  const arcs = []; for (let i = 0; i < 36; i++) { const s = glowSprite(0xff8fd0, 0.05); scene.add(s); arcs.push(s); }
  // phone with YAWN text for "reading"
  const phoneT = canvasTex(160, 300, (g) => { g.fillStyle = '#16161c'; g.fillRect(0, 0, 160, 300); g.fillStyle = '#f4f4f8'; g.fillRect(10, 16, 140, 268); g.fillStyle = '#222'; g.font = "400 30px Brand, sans-serif"; g.textAlign = 'center'; g.fillText('YAWN', 80, 60); g.fillStyle = '#bbb'; for (let i = 0; i < 9; i++) g.fillRect(22, 84 + i * 20, 116 - (i % 3) * 20, 8); });
  const phone = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.15, 0.01), [0, 0, 0, 0, 0, 0].map((_, i) => i === 4 ? new THREE.MeshBasicMaterial({ map: phoneT, toneMapped: false }) : new THREE.MeshStandardMaterial({ color: 0x16161c }))); scene.add(phone);
  const fx = { end: burst(0xffd23f, 70, 4) }; scene.add(fx.end);
  const caught = stamp('CAUGHT YOU!', '#ffd23f', 0.7); scene.add(caught);
  const c = cam(38);
  const people = [friend, mom, dad, kid];

  return {
    scene, camera: c,
    update(t) {
      // ---------- yawn schedule ----------
      const hY = Math.max(yawnK(t, 2.3, 5.2), yawnK(t, 24.0, 2.2));
      const fY = Math.max(yawnK(t, 15.7, 2.6), yawnK(t, 24.1, 2.1));
      const momY = Math.max(yawnK(t, 19.0, 2.3), yawnK(t, 24.2, 2.0)), dadY = Math.max(yawnK(t, 19.7, 2.3), yawnK(t, 24.15, 2.0)), kidY = Math.max(yawnK(t, 20.3, 2.2), yawnK(t, 24.25, 1.9));
      const hookY = yawnK(t, -0.4, 2.6); // already mid-yawn at the hook
      const heroY = Math.max(hY, hookY);
      // hero on sofa (middle-left), friend right, mom left, dad + kid standing
      hero.root.position.set(-0.25, 0, -0.6); hero.root.rotation.y = 0.3;
      const read = smooth(range(t, 21.5, 21.9)) * (1 - smooth(range(t, 23.6, 23.95)));
      let hp = over(STAND(t), SIT);
      if (read > 0.01) hp = over(hp, { rSh: [lerp(0.1, -0.7, read), 0, -0.15], rEl: [lerp(-0.9, -1.5, read), 0, 0], neck: [0.3 * read, 0, 0] });
      const look = smooth(range(t, 23.7, 24.0));
      hp = yawnPose(hp, heroY, true);
      hero.setPose(hp); hero.setMouth(Math.min(1, heroY * 1.1) * 1.0 + 0.04);
      friend.root.position.set(0.5, 0, -0.6); friend.root.rotation.y = -0.4;
      const watch = smooth(range(t, 13.8, 14.3)) * (1 - smooth(range(t, 17.0, 17.4)));
      friend.setPose(yawnPose(over(STAND(t, 1), SIT, { neck: [0.05, 0.6 * watch, 0] }), fY, fY > 0.05)); friend.setMouth(fY + 0.04);
      mom.root.position.set(-0.82, 0, -0.62); mom.root.rotation.y = 0.45;
      mom.setPose(yawnPose(over(STAND(t, 2), SIT), momY, false)); mom.setMouth(momY + 0.04);
      dad.root.position.set(0.55, 0, -1.4); dad.root.rotation.y = -0.2;
      dad.setPose(yawnPose(over(STAND(t, 3), {}), dadY, true)); dad.setMouth(dadY + 0.04);
      kid.root.position.set(-0.55, 0, -1.35); kid.root.rotation.y = 0.15;
      kid.setPose(yawnPose(over(STAND(t, 4), {}), kidY, true)); kid.setMouth(kidY + 0.04);
      scene.updateMatrixWorld(true);
      const mouthP = (h) => h.j.head.localToWorld(V(0, -0.05, 0.12));
      const hm = mouthP(hero), hh = hero.j.head.localToWorld(V(0, 0.1, 0));
      // gulp of air
      const ak = smooth(range(t, 5.3, 5.6)) * (1 - smooth(range(t, 7.2, 7.6)));
      air.forEach((s, i) => { const u2 = (t * 0.9 + s.userData.ph) % 1, rr = (1 - u2) * 0.9; s.position.copy(hm).add(V(Math.cos(s.userData.a) * rr, Math.sin(s.userData.a) * rr * 0.6, 0.15 + (1 - u2) * 0.4)); s.material.opacity = ak * u2; s.visible = ak > 0.01; });
      // phone in right hand
      phone.visible = read > 0.01; phone.position.copy(hero.j.rWr.localToWorld(V(0, -0.08, 0.03))); phone.lookAt(hh.clone().add(V(0, 0.05, 0.3)));
      // eye-line: friend sees hero yawn
      const fe = friend.j.head.localToWorld(V(0, 0.08, 0.1));
      const dk = smooth(range(t, 14.0, 14.5)) * (1 - smooth(range(t, 16.4, 16.8)));
      dots.forEach((s, i) => { const u2 = ((i / dots.length) + t * 0.8) % 1; s.position.copy(fe).lerp(hh, u2); s.material.opacity = dk * 0.9; s.visible = dk > 0.01; });
      // copy arcs: from friend to mom, dad, kid
      const ck = smooth(range(t, 18.3, 18.7)) * (1 - smooth(range(t, 21.3, 21.6)));
      const targets = [mom, dad, kid].map(p => p.j.head.localToWorld(V(0, 0.15, 0)));
      arcs.forEach((s, i) => { const tg = targets[i % 3], u2 = ((Math.floor(i / 3) / 12) + t * 0.6) % 1; const p = fe.clone().lerp(tg, u2); p.y += Math.sin(u2 * Math.PI) * 0.35; s.position.copy(p); s.material.opacity = ck * 0.9; s.visible = ck > 0.01; });
      // ---------- camera ----------
      const KEYS = [[0, [0.0, 1.55, 4.9], [0.0, 0.85, -0.6]], [2.2, [-0.2, 1.45, 2.7], [-0.25, 0.8, -0.6]], [7.6, [-0.15, 1.45, 2.6], [-0.2, 0.82, -0.6]], [12.0, [-0.05, 1.45, 2.8], [-0.05, 0.8, -0.6]],
        [13.6, [0.05, 1.45, 3.0], [0.03, 0.8, -0.6]], [16.9, [0.1, 1.45, 3.0], [0.05, 0.8, -0.6]], [18.2, [0.0, 1.6, 5.0], [0.0, 0.85, -0.6]], [21.3, [0.0, 1.6, 4.9], [0.0, 0.85, -0.6]],
        [22.3, [-0.2, 1.45, 2.7], [-0.25, 0.8, -0.6]], [23.6, [-0.2, 1.45, 2.7], [-0.25, 0.8, -0.6]], [24.3, [0.0, 1.55, 4.9], [0.0, 0.85, -0.6]], [26.2, [0.0, 1.5, 4.5], [0.0, 0.85, -0.6]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const sh = shake(t, 0.4, 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      // brain bubble beside the head
      const bk = easeOut(range(t, 7.8, 8.2)) * (1 - smooth(range(t, 11.9, 12.2)));
      if (bk > 0.01) { const heat = 1 - smooth(range(t, 9.2, 10.6)); brain.draw([0.4 + 0.6 * heat, 0.4 + 0.6 * heat, 0.4 + 0.6 * heat, 0.4 + 0.6 * heat, 0.4 + 0.6 * heat], t > 8.9 ? ((t - 8.9) * 0.55) % 1 : -1, t); }
      const bpos = hh.clone().add(V(0.4, -0.05, 0.25));
      brain.position.copy(bpos); brain.scale.setScalar(0.42 * bk); brain.material.opacity = bk; brain.visible = bk > 0.01;
      const fk = easeOut(range(t, 10.6, 10.95)) * (1 - smooth(range(t, 11.9, 12.2)));
      fan.position.copy(bpos).add(V(0.27, 0.13, 0.05)); fan.scale.setScalar(0.17 * fk); fan.material.rotation = -t * 14; fan.visible = fk > 0.01;
      cool.forEach((s, i) => { const u2 = (t * 1.2 + s.userData.ph) % 1; s.position.copy(fan.position).lerp(bpos, u2).add(V(0, Math.sin(i * 2 + t * 4) * 0.05, 0)); s.material.opacity = fk * (1 - u2); s.visible = fk > 0.01; });
      fx.end.position.copy(hh).add(V(0, 0.1, 0.2)); fx.end.update(t - 24.7);
      caught.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.3); caught.set(t > 24.8 ? easeOut(range(t, 24.8, 25.0)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.35, exposure: 1.1 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
