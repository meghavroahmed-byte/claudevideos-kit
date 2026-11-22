import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp, world, tree } from './ancient.js';
import { textSprite } from './room.js';
import { rng, glowTexture } from './textures.js';

export const DURATION = 25.8;
export const CAPTIONS = [
  [0.0, 'What if you stared at the Sun?'],
  [2.07, "Your eye's lens works like a magnifying glass"], [4.95, 'It focuses sunlight'], [6.11, 'into a tiny, burning hot spot'], [8.29, 'on the back of your eye'],
  [9.72, 'And the scary part?'], [10.91, 'Your retina has no pain nerves'], [13.1, "so you won't even feel it burning"],
  [15.12, 'Hours later'], [16.02, 'you might notice a blurry blind spot'], [18.03, 'right in the middle of your vision'], [19.78, 'And it can be permanent'],
  [21.25, 'So never look straight at the Sun'], [23.24, 'not even during an eclipse!', 25.6],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, 0, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 8, sunDir: [3, 9, -4], sun: 2.8 });
  const U = scene.userData.sky.material.uniforms; U.top.value.set(0x2a8ae0); U.mid.value.set(0x8ac8f0); U.horizon.value.set(0xeaf6ff); U.floorC.value.set(0x6aa04a);
  scene.fog = new THREE.Fog(0xe0eef4, 30, 140);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.9; const key = scene.userData.key;
  scene.add(world([]));
  [[-5, -7], [5.5, -9], [-8, -14], [9, -6]].forEach(([x, z], i) => { const tr = tree({ h: 4, seed: i + 11 }); tr.position.set(x, 0, z); scene.add(tr); });
  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.45), new THREE.MeshStandardMaterial({ color: 0x8a5a3a })); bench.position.set(-1.6, 0.45, -1.2); scene.add(bench);
  // sun in sky (high, in front-left of hero, behind camera's up-view)
  const SUN = V(-4, 16, -30);
  const sun = glowSprite(0xfff4c0, 18); sun.position.copy(SUN); sun.material.fog = false; scene.add(sun);
  const sunCore = new THREE.Mesh(new THREE.SphereGeometry(2.2, 32, 20), new THREE.MeshBasicMaterial({ color: 0xffffe8, toneMapped: false, fog: false })); sunCore.position.copy(SUN); scene.add(sunCore);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(2.25, 32, 20), new THREE.MeshBasicMaterial({ color: 0x0a0a12, fog: false })); scene.add(moon);
  const corona = glowSprite(0xffffff, 9); corona.material.fog = false; corona.position.copy(SUN); scene.add(corona);
  // hero
  const hero = makeHuman('casual', { shirt: 0xff8a3a, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.03), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 })); glasses.position.set(0, 0.11, 0.12); hero.j.head.add(glasses); glasses.visible = false;
  // light beam from sun to eye (when staring)
  const beamT = canvasTex(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,240,180,0)'); gr.addColorStop(1, 'rgba(255,240,180,0.8)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.012, 1, 16, 1, true), new THREE.MeshBasicMaterial({ map: beamT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); scene.add(beam);
  // eye bubble
  const zc = document.createElement('canvas'); zc.width = zc.height = 512; const zg = zc.getContext('2d'); const zt = new THREE.CanvasTexture(zc); zt.colorSpace = THREE.SRGBColorSpace;
  const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); bub.renderOrder = 30; scene.add(bub);
  const drawEye = (rays, focus, burn, nerve, tt) => { zg.clearRect(0, 0, 512, 512); zg.save(); zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.clip(); zg.fillStyle = '#0e1a30'; zg.fillRect(0, 0, 512, 512);
    // eyeball (side view): front at left
    zg.fillStyle = '#f4f0ec'; zg.beginPath(); zg.arc(290, 256, 170, 0, 7); zg.fill();
    zg.strokeStyle = '#ff8fab'; zg.lineWidth = 14; zg.beginPath(); zg.arc(290, 256, 158, -1.1, 1.1); zg.stroke(); // retina at back (right)
    zg.fillStyle = '#9fd8ff'; zg.beginPath(); zg.ellipse(140, 256, 22, 62, 0, 0, 7); zg.fill(); // lens
    const spot = V(445, 256, 0);
    if (rays > 0) { zg.strokeStyle = `rgba(255,230,120,${0.9 * rays})`; zg.lineWidth = 6; for (let i = -3; i <= 3; i++) { const y0 = 256 + i * 26; const xs = 0, xl = 140; const k = Math.min(1, rays * 1.5); zg.beginPath(); zg.moveTo(xs, y0); zg.lineTo(xl, y0); if (focus > 0) zg.lineTo(lerp(xl, spot.x, focus * k), lerp(y0, spot.y, focus * k)); zg.stroke(); } }
    if (burn > 0) { const r = 10 + 14 * burn + 4 * Math.sin(tt * 12); const gr = zg.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, r * 2.2); gr.addColorStop(0, `rgba(255,255,220,${burn})`); gr.addColorStop(0.4, `rgba(255,120,40,${burn})`); gr.addColorStop(1, 'rgba(255,60,20,0)'); zg.fillStyle = gr; zg.beginPath(); zg.arc(spot.x, spot.y, r * 2.2, 0, 7); zg.fill(); if (burn > 0.5) { zg.fillStyle = `rgba(200,200,200,${0.5 * burn})`; for (let i = 0; i < 4; i++) { const u2 = (tt * 0.8 + i / 4) % 1; zg.beginPath(); zg.arc(spot.x - 20 - u2 * 30, spot.y - 20 - u2 * 70, 8 + u2 * 10, 0, 7); zg.fill(); } } }
    if (nerve > 0) { zg.globalAlpha = nerve; zg.strokeStyle = '#ffd23f'; zg.lineWidth = 8; zg.setLineDash([10, 10]); zg.beginPath(); zg.moveTo(455, 300); zg.lineTo(500, 420); zg.stroke(); zg.setLineDash([]); zg.strokeStyle = '#ff3b3b'; zg.lineWidth = 14; zg.beginPath(); zg.arc(470, 360, 44, 0, 7); zg.moveTo(440, 330); zg.lineTo(500, 390); zg.stroke(); zg.globalAlpha = 1; }
    zg.restore(); zg.strokeStyle = 'rgba(255,255,255,0.95)'; zg.lineWidth = 12; zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.stroke(); zt.needsUpdate = true; };
  // blind spot overlay (camera-pinned)
  const bsT = canvasTex(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(20,16,12,0.92)'); gr.addColorStop(0.55, 'rgba(40,30,20,0.55)'); gr.addColorStop(1, 'rgba(40,30,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  const blind = new THREE.Sprite(new THREE.SpriteMaterial({ map: bsT, transparent: true, depthTest: false, depthWrite: false })); blind.renderOrder = 29; scene.add(blind);
  const clockS = textSprite('+3 HRS', '#ffd23f', "400 120px Brand, sans-serif"); clockS.renderOrder = 31; clockS.material.depthTest = false; scene.add(clockS);
  const dont = stamp("DON'T LOOK!", '#ff3b3b', 0.62); scene.add(dont);
  const fx = { burn: burst(0xffc040, 40, 1) }; scene.add(fx.burn);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // eclipse 22.6..
      const ecl = smooth(range(t, 22.4, 24.0));
      moon.position.copy(SUN).add(V(lerp(6, 0, ecl), lerp(-2, 0, ecl), 0.5)); moon.visible = t > 22.0;
      corona.material.opacity = 0.7 * ecl; corona.visible = ecl > 0.01; sun.material.opacity = 1 - 0.7 * ecl;
      U.top.value.set(0x2a8ae0).lerp(new THREE.Color(0x0a1430), ecl * 0.8); U.mid.value.set(0x8ac8f0).lerp(new THREE.Color(0x2a3a6a), ecl * 0.8); key.intensity = lerp(2.8, 0.8, ecl); hemi.intensity = lerp(0.9, 0.4, ecl);
      // hero: stares up 0..9.6 & 9.7..14.6; later rubs eyes (16..20); final turns away and covers eyes
      hero.root.position.set(0, 0, 0.4); hero.root.rotation.y = 0.25;
      const stare = smooth(range(t, 0.0, 0.6)) * (1 - smooth(range(t, 14.6, 15.2)));
      const rub = smooth(range(t, 16.2, 16.8)) * (1 - smooth(range(t, 19.8, 20.4)));
      const cover = smooth(range(t, 21.4, 22.0));
      let pose = over(STAND(t), { neck: [-0.75 * stare - 0.25 * cover, 0.0, 0], spine: [-0.08 * stare, 0, 0] });
      if (cover > 0.01) pose = over(pose, { neck: [0.35 * cover, 0.9 * cover, 0] });
      hero.setPose(pose); hero.setMouth(0.08);
      hero.root.rotation.y = 0.25 + 0.0 * cover;
      scene.updateMatrixWorld(true);
      const head = hero.j.head.getWorldPosition(V()), eye = hero.j.head.localToWorld(V(0.035, 0.11, 0.1));
      const ls = hero.j.lSh.getWorldPosition(V()), rs = hero.j.rSh.getWorldPosition(V());
      if (rub > 0.01) { const r = Math.sin(t * 8) * 0.02; ikArm(hero, 'r', rs.clone().add(V(0, -0.5, 0.1)).lerp(eye.clone().add(V(0.02 + r, 0, 0.06)), rub), rs.clone().add(V(0.3, -0.3, 0.2)), V(0, 0, 1)); }
      if (cover > 0.01) { const e2 = hero.j.head.localToWorld(V(0, 0.11, 0.14)); ikArm(hero, 'l', ls.clone().add(V(0, -0.5, 0.1)).lerp(e2.clone().add(V(0.03, 0, 0.04)), cover), ls.clone().add(V(-0.3, -0.3, 0.2)), V(0, 0, 1)); ikArm(hero, 'r', rs.clone().add(V(0, -0.5, 0.1)).lerp(e2.clone().add(V(-0.03, 0, 0.04)), cover), rs.clone().add(V(0.3, -0.3, 0.2)), V(0, 0, 1)); }
      // beam
      const bk = stare * smooth(range(t, 4.9, 5.6));
      const dir = SUN.clone().sub(eye); const L = Math.min(dir.length(), 8); dir.normalize();
      beam.position.copy(eye).addScaledVector(dir, L / 2); beam.quaternion.setFromUnitVectors(V(0, -1, 0), dir.clone().negate()); beam.scale.set(1, L, 1); beam.material.opacity = 0.5 * bk; beam.visible = bk > 0.01;
      fx.burn.position.copy(eye); fx.burn.update(t - 7.1);
      // ---------- camera ----------
      const KEYS = [[0, [1.8, 0.45, 5.4], [-0.9, 3.2, -4.0]], [2.0, [1.5, 1.4, 3.8], [0.0, 1.1, 0.0]], [14.8, [1.5, 1.4, 3.6], [0.0, 1.2, 0.0]], [15.6, [0.14, 1.68, 0.78], [1.6, 1.5, 6.0]], [20.6, [0.14, 1.68, 0.78], [1.6, 1.5, 6.0]], [21.4, [1.8, 0.8, 4.6], [-0.4, 2.2, -2.0]], [25.8, [1.9, 0.7, 4.8], [-0.6, 2.6, -3.0]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.4, 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const ek = easeOut(range(t, 2.2, 2.6)) * (1 - smooth(range(t, 14.6, 15.0)));
      if (ek > 0.01) drawEye(smooth(range(t, 2.8, 4.0)), smooth(range(t, 5.0, 6.2)), smooth(range(t, 7.0, 8.0)), smooth(range(t, 11.0, 11.6)), t);
      bub.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.05).addScaledVector(rt, 0.15); bub.scale.setScalar(0.34 * ek); bub.visible = ek > 0.01;
      // POV blind spot 16..20.6
      const bs = smooth(range(t, 16.6, 17.8)) * (1 - smooth(range(t, 20.6, 21.2)));
      blind.position.copy(c.position).addScaledVector(fw, 1.0); blind.scale.setScalar(0.32 * bs * (1 + 0.04 * Math.sin(t * 2))); blind.material.opacity = bs; blind.visible = bs > 0.01;
      const ck = easeOut(range(t, 15.2, 15.5)) * (1 - smooth(range(t, 16.4, 16.7)));
      clockS.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.0); clockS.scale.set(0.42 * ck, 0.21 * ck, 1); clockS.visible = ck > 0.01;
      dont.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); dont.set(t > 23.6 ? easeOut(range(t, 23.6, 23.8)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.6, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
