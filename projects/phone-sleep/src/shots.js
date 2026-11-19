import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { bedroom, textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 25.8;
export const CAPTIONS = [
  [0.0, 'Why do phones at night ruin your sleep?'],
  [2.89, 'When it gets dark'], [4.17, 'your brain releases a hormone'], [5.82, 'called melatonin'], [6.84, "It's the signal that says"], [8.92, 'time to sleep'],
  [10.21, 'But your phone screen'], [11.24, 'blasts blue light'], [12.58, 'just like the daytime sky'],
  [14.58, "Your brain thinks it's still daytime"], [16.68, 'so it holds back the melatonin'],
  [19.07, 'You lie awake longer'], [20.4, 'and sleep worse'], [21.96, 'So put the phone down'], [23.28, 'an hour before bed', 25.6],
];
export const FADES = [];

const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 5, sunDir: [-2, 6, 3], sun: 0.4 });
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0x8a9cff); hemi.groundColor.set(0x1a1a30);
  const key = scene.userData.key;
  const room = bedroom(); scene.add(room); room.userData.desk.visible = false; room.userData.chair.visible = false;
  room.traverse(o => { if (o.isMesh && o.material.map && o.material.map.repeat.x === 4) { o.material = o.material.clone(); o.material.color.set(0x8fd0c4); } });
  room.userData.bed.children.forEach(o => { if (o.geometry && o.geometry.type === 'CapsuleGeometry') o.visible = false; });
  room.userData.blanket.material = room.userData.blanket.material.clone(); room.userData.blanket.material.color.set(0x7a4dd8);
  const lampL = new THREE.PointLight(0xffc880, 6, 6, 1.3); lampL.position.set(0.7, 1.0, -2.2); scene.add(lampL);
  const moonL = new THREE.PointLight(0x7a8cff, 2.5, 8, 1.2); moonL.position.set(-1.5, 2.2, 0.5); scene.add(moonL);
  // nightstand + wall clock
  const ns = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.4), new THREE.MeshStandardMaterial({ color: 0x5a3a28 })); ns.position.set(0.72, 0.25, -2.55); scene.add(ns);
  const cc = document.createElement('canvas'); cc.width = cc.height = 256; const cg = cc.getContext('2d'); const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace;
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.22, 32), new THREE.MeshBasicMaterial({ map: ct, toneMapped: false })); clock.position.set(1.45, 1.52, -2.86); scene.add(clock); let lastC = -1;
  const drawC = (hrs) => { const q = Math.round(hrs * 60); if (q === lastC) return; lastC = q; cg.fillStyle = '#f4f0e6'; cg.beginPath(); cg.arc(128, 128, 124, 0, 7); cg.fill(); cg.strokeStyle = '#222'; cg.lineWidth = 10; cg.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; cg.fillStyle = '#222'; cg.fillRect(128 + Math.cos(a) * 100 - 4, 128 + Math.sin(a) * 100 - 4, 8, 8); } const ha = (hrs % 12) / 12 * 6.283 - Math.PI / 2, ma = (hrs % 1) * 6.283 - Math.PI / 2; cg.lineCap = 'round'; cg.lineWidth = 12; cg.beginPath(); cg.moveTo(128, 128); cg.lineTo(128 + Math.cos(ha) * 55, 128 + Math.sin(ha) * 55); cg.stroke(); cg.lineWidth = 7; cg.strokeStyle = '#ff3b3b'; cg.beginPath(); cg.moveTo(128, 128); cg.lineTo(128 + Math.cos(ma) * 90, 128 + Math.sin(ma) * 90); cg.stroke(); ct.needsUpdate = true; };
  // hero lying in bed
  const hero = makeHuman('casual', { shirt: 0x4a7ad8, jeans: 0x3a3a52, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const phone = new THREE.Group(); scene.add(phone);
  const pbody = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.15, 0.01), new THREE.MeshStandardMaterial({ color: 0x16161c })); phone.add(pbody);
  const pscreen = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.138), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, toneMapped: false })); pscreen.position.z = -0.006; pscreen.rotation.y = Math.PI; phone.add(pscreen);
  const phoneL = new THREE.PointLight(0x5aa8ff, 0, 2.2, 1.4); scene.add(phoneL);
  const phoneGlow = glowSprite(0x6ab8ff, 0.32); scene.add(phoneGlow);
  const beamT = canvasTex(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(120,190,255,0.6)'); gr.addColorStop(1, 'rgba(120,190,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 20, 1, true), new THREE.MeshBasicMaterial({ map: beamT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); scene.add(beam);
  // brain bubble: pineal gland, melatonin drops, sun blocks
  const zc = document.createElement('canvas'); zc.width = zc.height = 512; const zg = zc.getContext('2d'); const zt = new THREE.CanvasTexture(zc); zt.colorSpace = THREE.SRGBColorSpace;
  const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); bub.renderOrder = 30; scene.add(bub);
  const r9 = rng(12); const DROPS = []; for (let i = 0; i < 14; i++) DROPS.push({ a: r9() * 6.28, sp: 0.5 + r9() * 0.5, ph: r9() });
  const drawB = (night, mel, sun, block, tt) => { zg.clearRect(0, 0, 512, 512); zg.save(); zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.clip();
    const bgN = [16, 20, 56], bgD = [120, 190, 255]; const bg = bgN.map((v, i) => Math.round(lerp(bgD[i], v, night))); zg.fillStyle = `rgb(${bg})`; zg.fillRect(0, 0, 512, 512);
    zg.fillStyle = '#ffadc4'; zg.beginPath(); zg.ellipse(256, 270, 170, 130, 0, 0, 7); zg.fill(); zg.strokeStyle = 'rgba(200,90,130,0.6)'; zg.lineWidth = 6; for (let i = 0; i < 6; i++) { zg.beginPath(); zg.moveTo(120 + i * 50, 170); zg.bezierCurveTo(140 + i * 50, 230, 110 + i * 50, 300, 140 + i * 50, 380); zg.stroke(); }
    zg.fillStyle = '#9a6aff'; zg.beginPath(); zg.arc(256, 290, 24, 0, 7); zg.fill();
    DROPS.forEach((d, i) => { const u2 = (tt * 0.35 * d.sp + d.ph) % 1; const vis = mel * (block > 0.5 ? Math.max(0, 1 - u2 * 6) : 1); if (vis <= 0.02) return; const x = 256 + Math.cos(d.a) * u2 * 190, y = 290 - Math.abs(Math.sin(d.a)) * u2 * 210; zg.fillStyle = `rgba(190,150,255,${vis * (1 - u2)})`; zg.beginPath(); zg.arc(x, y, 16, 0.6, 5.7); zg.arc(x + 7, y - 2, 12, 5.7, 0.6, true); zg.fill(); });
    if (sun > 0) { zg.fillStyle = `rgba(255,214,63,${sun})`; zg.beginPath(); zg.arc(400, 110, 46, 0, 7); zg.fill(); zg.strokeStyle = `rgba(255,214,63,${sun})`; zg.lineWidth = 8; for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 + tt; zg.beginPath(); zg.moveTo(400 + Math.cos(a) * 60, 110 + Math.sin(a) * 60); zg.lineTo(400 + Math.cos(a) * 80, 110 + Math.sin(a) * 80); zg.stroke(); } }
    else if (night > 0.5) { zg.fillStyle = '#f4f0d8'; zg.beginPath(); zg.arc(400, 110, 40, 0, 7); zg.fill(); zg.fillStyle = `rgb(${bg})`; zg.beginPath(); zg.arc(420, 98, 36, 0, 7); zg.fill(); }
    if (block > 0) { zg.strokeStyle = `rgba(255,60,60,${block})`; zg.lineWidth = 16; zg.lineCap = 'round'; zg.beginPath(); zg.moveTo(216, 250); zg.lineTo(296, 330); zg.moveTo(296, 250); zg.lineTo(216, 330); zg.stroke(); }
    zg.restore(); zg.strokeStyle = 'rgba(255,255,255,0.95)'; zg.lineWidth = 12; zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.stroke(); zt.needsUpdate = true; };
  const zzz = textSprite('Zzz', '#b89aff', "400 120px Brand, sans-serif"); scene.add(zzz);
  const fx = { down: burst(0x5be37d, 50, 2) }; scene.add(fx.down);
  const st = stamp('PHONE DOWN!', '#5be37d', 0.6); scene.add(st);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // lighting: lamp off at 3.0 (dark), phone on from 10.2 to 22.4
      const lampOn = 1 - smooth(range(t, 2.9, 3.3));
      lampL.intensity = 6 * lampOn; hemi.intensity = lerp(0.6, 0.32, 1 - lampOn); key.intensity = 0.3 * lampOn;
      const ph = Math.max(1 - smooth(range(t, 2.5, 3.0)), smooth(range(t, 10.2, 10.7)) * (1 - smooth(range(t, 22.3, 22.8))));
      // hero lying on his back, head toward -z
      hero.root.position.set(1.75, 0.62, -0.8); hero.root.rotation.set(-Math.PI / 2, 0, 0);
      const toss = smooth(range(t, 19.2, 19.6)) * (1 - smooth(range(t, 21.6, 22.0)));
      hero.root.rotation.z = toss * Math.sin(t * 3) * 0.35;
      const sleepy = smooth(range(t, 7.2, 8.0)) * (1 - smooth(range(t, 10.0, 10.5)));
      const asleep = smooth(range(t, 23.6, 24.4));
      hero.setPose({ lSh: [0.05, 0, 0.2], rSh: [0.05, 0, -0.2], lEl: [-0.2, 0, 0], rEl: [-0.2, 0, 0], lHip: [0, 0, 0.06], rHip: [0, 0, -0.06], lKn: [0.1, 0, 0], rKn: [0.1, 0, 0], neck: [-0.25, 0.2 * sleepy + 0.25 * asleep, 0] });
      hero.setMouth(sleepy > 0.5 ? 0.5 * Math.max(0, Math.sin(t * 2)) : 0.05);
      scene.updateMatrixWorld(true);
      const head = hero.j.head.getWorldPosition(V());
      const above = head.clone().add(V(0, 0.36, 0.12));
      const rs = hero.j.rSh.getWorldPosition(V()), ls = hero.j.lSh.getWorldPosition(V());
      const hold = ph;
      const putDown = smooth(range(t, 22.2, 23.0));
      const nsSpot = V(0.75, 0.52, -2.55);
      const pTarget = above.clone().lerp(nsSpot, putDown);
      if (hold > 0.01 || putDown > 0.01) {
        const k2 = Math.max(hold, putDown * (1 - smooth(range(t, 23.0, 23.4))));
        ikArm(hero, 'r', rs.clone().add(V(-0.05, -0.05, 0.45)).lerp(pTarget.clone().add(V(-0.04, 0, 0.0)), k2), rs.clone().add(V(-0.3, -0.2, 0.1)), V(0, 1, 0));
        if (putDown < 0.2) ikArm(hero, 'l', ls.clone().add(V(0.05, -0.05, 0.45)).lerp(pTarget.clone().add(V(0.04, 0, 0.0)), hold), ls.clone().add(V(0.3, -0.2, 0.1)), V(0, 1, 0));
        scene.updateMatrixWorld(true);
      }
      phone.position.copy(t > 23.0 ? nsSpot : pTarget); phone.rotation.set(t > 23.0 ? -Math.PI / 2 : Math.PI / 2, 0, 0);
      const screenOn = ph * (t > 22.6 ? 0 : 1);
      pscreen.material.color.set(screenOn > 0.1 ? 0x9fd8ff : 0x111118);
      phoneL.position.copy(phone.position).add(V(0, -0.1, 0)); phoneL.intensity = 5 * screenOn * (t > 10 ? 1.4 : 0.8);
      phoneGlow.position.copy(phone.position).add(V(0, -0.05, 0)); phoneGlow.material.opacity = 0.6 * screenOn; phoneGlow.visible = screenOn > 0.01;
      const bk = smooth(range(t, 11.2, 11.7)) * (1 - smooth(range(t, 21.8, 22.3)));
      beam.position.copy(phone.position).add(V(0, -0.2, 0)); beam.rotation.set(0, 0, 0); beam.material.opacity = bk; beam.visible = bk > 0.01; beam.scale.setScalar(1 + 0.08 * Math.sin(t * 8));
      // clock: 11pm normally; spins 19.2-21.8 to 3am
      drawC(23 + 4 * easeInOut(range(t, 19.2, 21.8)));
      const zk = Math.max(sleepy, asleep);
      zzz.position.copy(head).add(V(-0.3, 0.45, 0.1)); zzz.scale.set(0.5 * zk, 0.25 * zk, 1); zzz.visible = zk > 0.01;
      fx.down.position.copy(nsSpot); fx.down.update(t - 23.0);
      // ---------- camera ----------
      const KEYS = [[0, [-0.6, 2.2, 1.3], [1.5, 0.65, -1.7]], [2.8, [-0.3, 2.1, 0.8], [1.55, 0.65, -1.8]], [19.0, [-0.3, 2.1, 0.8], [1.55, 0.7, -1.8]], [21.8, [-0.4, 2.15, 0.9], [1.5, 0.75, -1.7]], [25.8, [-0.4, 2.1, 0.9], [1.45, 0.7, -1.75]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.35, 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const bb = easeOut(range(t, 4.1, 4.5)) * (1 - smooth(range(t, 18.8, 19.2)));
      if (bb > 0.01) { const night = 1 - smooth(range(t, 12.6, 13.4)); const mel = smooth(range(t, 5.6, 6.4)); const sun = smooth(range(t, 12.8, 13.4)); const block = smooth(range(t, 16.8, 17.4)); drawB(night, mel, sun, block, t); }
      bub.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.05).addScaledVector(rt, -0.15); bub.scale.setScalar(0.32 * bb); bub.visible = bb > 0.01;
      st.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); st.set(t > 22.6 && t < 24.4 ? easeOut(range(t, 22.6, 22.8)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.5, exposure: 1.1 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
