import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 25.4;
export const CAPTIONS = [
  [0.0, 'What happens when you eat too much sugar?'],
  [2.8, 'Sugar rushes into your blood in minutes'], [5.47, 'and your body pumps out insulin'], [7.32, 'to clean it up'],
  [8.47, 'For a while'], [9.4, 'you feel a burst of energy'],
  [11.11, 'But insulin works so fast'], [12.98, 'that your blood sugar drops too low'], [15.29, 'You crash'], [16.31, 'tired, and hungry for more'],
  [18.41, 'Do it too often'], [19.51, 'and the extra sugar gets stored as fat'], [22.01, 'and feeds the germs that rot your teeth', 25.2],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
// blood sugar level over time (0..1, normal = 0.4)
const level = (t) => { if (t < 2.8) return 0.4; if (t < 8.5) return lerp(0.4, 0.95, easeOut(range(t, 2.8, 8.5))); if (t < 11.0) return 0.95; if (t < 15.0) return lerp(0.95, 0.12, easeInOut(range(t, 11.0, 15.0))); return lerp(0.12, 0.2, range(t, 15.0, 18.4)); };

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-2, 6, 4], sun: 0.9 });
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xffeef6); hemi.groundColor.set(0x8a5a7a); hemi.intensity = 1.05;
  // candy shop
  const floorT = canvasTex(512, 512, (g) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#ffd6e8' : '#ffffff'; g.fillRect(i * 64, j * 64, 64, 64); } });
  floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(5, 5);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.5 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const wallT = canvasTex(512, 512, (g) => { g.fillStyle = '#ffb3d1'; g.fillRect(0, 0, 512, 512); for (let x = 0; x < 512; x += 64) { g.fillStyle = '#ffc8de'; g.fillRect(x, 0, 32, 512); } });
  wallT.wrapS = wallT.wrapT = THREE.RepeatWrapping; wallT.repeat.set(4, 2);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), new THREE.MeshStandardMaterial({ map: wallT, roughness: 0.9 })); back.position.set(0, 2, -2.0); scene.add(back);
  // shelves with candy jars
  const shelfM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const jarCols = [0xff5fa2, 0xffd23f, 0x5be37d, 0x39d0ff, 0xb05cff, 0xff8a3a];
  const jr = rng(3);
  for (let row = 0; row < 3; row++) { const sh = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.05, 0.35), shelfM); sh.position.set(0, 0.9 + row * 0.6, -1.82); scene.add(sh);
    for (let k = 0; k < 9; k++) { const jar = new THREE.Group(); jar.position.set(-2.0 + k * 0.5, 0.93 + row * 0.6, -1.82); scene.add(jar); const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.36, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.05 })); glass.position.y = 0.18; jar.add(glass); const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.05, 16), new THREE.MeshStandardMaterial({ color: jarCols[(k + row) % 6] })); lid.position.y = 0.38; jar.add(lid); for (let b = 0; b < 8; b++) { const cd = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshStandardMaterial({ color: jarCols[(b + k + row * 2) % 6], roughness: 0.3 })); cd.position.set((jr() - 0.5) * 0.18, 0.05 + jr() * 0.22, (jr() - 0.5) * 0.18); jar.add(cd); } } }
  // counter with treats
  const counter = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.55), new THREE.MeshStandardMaterial({ color: 0xff7ab0, roughness: 0.6 })); counter.position.set(-1.25, 0.45, -0.6); scene.add(counter);
  const donuts = []; for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.04, 10, 20), new THREE.MeshStandardMaterial({ color: [0xff8fc8, 0x8a5a3a, 0xffd6a0, 0xb05cff][i] })); d.rotation.x = Math.PI / 2; d.position.set(-1.7 + i * 0.25, 0.94, -0.55); scene.add(d); donuts.push(d); }
  const lolli = new THREE.Group(); scene.add(lolli); const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 6), new THREE.MeshStandardMaterial({ color: 0xffffff })); stick.position.y = -0.15; lolli.add(stick); const swirl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 24), new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#ff3b8a'; g.lineWidth = 12; g.beginPath(); for (let a = 0; a < 18; a += 0.2) g.lineTo(64 + Math.cos(a) * a * 3.2, 64 + Math.sin(a) * a * 3.2); g.stroke(); }) })); swirl.rotation.x = Math.PI / 2; lolli.add(swirl);
  const key2 = new THREE.PointLight(0xfff0f6, 8, 9, 1.2); key2.position.set(0.8, 2.6, 2.6); scene.add(key2);
  // sugar cube rain (hook)
  const cubes = []; const cr = rng(5); for (let i = 0; i < 30; i++) { const cb = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })); cb.userData = { x: (cr() - 0.5) * 2.4, z: (cr() - 0.5) * 1.2, ph: cr(), sp: V(cr(), cr(), cr()) }; scene.add(cb); cubes.push(cb); }
  // hero
  const hero = makeHuman('casual', { shirt: 0x39a0ff, jeans: 0x2f3e5a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  // graph sprite
  const gc = document.createElement('canvas'); gc.width = 512; gc.height = 384; const gg = gc.getContext('2d'); const gt = new THREE.CanvasTexture(gc); gt.colorSpace = THREE.SRGBColorSpace;
  const graph = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); graph.renderOrder = 30; scene.add(graph);
  const drawG = (tNow) => { gg.clearRect(0, 0, 512, 384); gg.strokeStyle = 'rgba(0,0,0,0.55)'; gg.lineWidth = 16; gg.lineCap = 'round'; gg.beginPath(); for (let tt = 2.0; tt <= Math.min(tNow, 18.4); tt += 0.1) { const x = 40 + (tt - 2.0) / 16.4 * 440, y = 330 - level(tt) * 280; tt === 2.0 ? gg.moveTo(x, y) : gg.lineTo(x, y); } gg.stroke(); gg.strokeStyle = '#ffffff'; gg.lineWidth = 6; gg.beginPath(); gg.moveTo(30, 20); gg.lineTo(30, 340); gg.lineTo(495, 340); gg.stroke();
    const X = (tt) => 40 + (tt - 2.0) / 16.4 * 440, Y = (v) => 330 - v * 280;
    gg.setLineDash([12, 10]); gg.strokeStyle = 'rgba(255,255,255,0.6)'; gg.lineWidth = 4; gg.beginPath(); gg.moveTo(30, Y(0.4)); gg.lineTo(490, Y(0.4)); gg.stroke(); gg.setLineDash([]);
    gg.strokeStyle = '#ff5fa2'; gg.lineWidth = 10; gg.lineCap = 'round'; gg.beginPath(); for (let tt = 2.0; tt <= Math.min(tNow, 18.4); tt += 0.1) { const x = X(tt), y = Y(level(tt)); tt === 2.0 ? gg.moveTo(x, y) : gg.lineTo(x, y); } gg.stroke();
    const tn = Math.min(tNow, 18.4); gg.fillStyle = '#fff'; gg.beginPath(); gg.arc(X(tn), Y(level(tn)), 12, 0, 7); gg.fill();
    if (tNow > 14.0) { gg.fillStyle = 'rgba(255,60,60,0.25)'; gg.fillRect(34, Y(0.4), 456, Y(0) - Y(0.4) + 6); } gt.needsUpdate = true; };
  // blood vessel bubble: sugar cubes + insulin
  const zc = document.createElement('canvas'); zc.width = zc.height = 512; const zg = zc.getContext('2d'); const zt = new THREE.CanvasTexture(zc); zt.colorSpace = THREE.SRGBColorSpace;
  const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); bub.renderOrder = 30; scene.add(bub);
  const r9 = rng(11); const SC = []; for (let i = 0; i < 26; i++) SC.push({ y: 140 + r9() * 230, ph: r9(), sp: 0.5 + r9() * 0.5 }); const RBC = []; for (let i = 0; i < 10; i++) RBC.push({ y: 150 + r9() * 210, ph: r9() });
  const drawV = (sugar, ins, cleared, tt) => { zg.clearRect(0, 0, 512, 512); zg.save(); zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.clip();
    zg.fillStyle = '#f2a0a0'; zg.fillRect(0, 0, 512, 512); zg.fillStyle = '#b8283a'; zg.fillRect(0, 120, 512, 270);
    RBC.forEach(r => { const x = ((r.ph + tt * 0.25) % 1) * 600 - 40; zg.fillStyle = '#e8384a'; zg.beginPath(); zg.ellipse(x, r.y, 30, 18, 0, 0, 7); zg.fill(); zg.fillStyle = '#c02a3a'; zg.beginPath(); zg.ellipse(x, r.y, 12, 7, 0, 0, 7); zg.fill(); });
    const n = Math.round(sugar * SC.length);
    SC.slice(0, n).forEach((s, i) => { const x = ((s.ph + tt * 0.3 * s.sp) % 1) * 600 - 40; const gone = i < Math.round(cleared * n); if (gone) return; zg.fillStyle = '#ffffff'; zg.strokeStyle = '#ddd'; zg.lineWidth = 3; zg.fillRect(x - 14, s.y - 14, 28, 28); zg.strokeRect(x - 14, s.y - 14, 28, 28); });
    if (ins > 0) for (let i = 0; i < 5; i++) { const x = 90 + i * 85 + Math.sin(tt * 3 + i) * 20, y = 200 + (i % 2) * 90 + Math.cos(tt * 4 + i) * 20; zg.fillStyle = `rgba(57,160,255,${ins})`; zg.beginPath(); zg.arc(x, y, 24, 0.5 + 0.3 * Math.sin(tt * 12), 6.28 - 0.5 - 0.3 * Math.sin(tt * 12)); zg.lineTo(x, y); zg.fill(); }
    zg.restore(); zg.strokeStyle = 'rgba(255,255,255,0.95)'; zg.lineWidth = 12; zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.stroke(); zt.needsUpdate = true; };
  // tooth + germs bubble
  const tc2 = document.createElement('canvas'); tc2.width = tc2.height = 512; const tg2 = tc2.getContext('2d'); const tt2 = new THREE.CanvasTexture(tc2); tt2.colorSpace = THREE.SRGBColorSpace;
  const toothB = new THREE.Sprite(new THREE.SpriteMaterial({ map: tt2, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); toothB.renderOrder = 30; scene.add(toothB);
  const drawTooth = (rot, tt) => { tg2.clearRect(0, 0, 512, 512); tg2.save(); tg2.beginPath(); tg2.arc(256, 256, 240, 0, 7); tg2.clip(); tg2.fillStyle = '#ffd6e0'; tg2.fillRect(0, 0, 512, 512);
    tg2.fillStyle = '#ffffff'; tg2.strokeStyle = '#c8c0b0'; tg2.lineWidth = 8; tg2.beginPath(); tg2.moveTo(150, 140); tg2.bezierCurveTo(150, 60, 362, 60, 362, 140); tg2.lineTo(350, 300); tg2.lineTo(320, 430); tg2.lineTo(290, 430); tg2.lineTo(266, 320); tg2.lineTo(246, 320); tg2.lineTo(222, 430); tg2.lineTo(192, 430); tg2.lineTo(162, 300); tg2.closePath(); tg2.fill(); tg2.stroke();
    if (rot > 0) { tg2.fillStyle = `rgba(90,60,30,${rot})`; tg2.beginPath(); tg2.arc(230, 150, 30 * rot, 0, 7); tg2.arc(300, 190, 22 * rot, 0, 7); tg2.fill(); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + tt; const x = 256 + Math.cos(a) * 150, y = 200 + Math.sin(a) * 120; tg2.fillStyle = '#5be37d'; tg2.beginPath(); tg2.arc(x, y, 26, 0, 7); tg2.fill(); tg2.fillStyle = '#fff'; tg2.beginPath(); tg2.arc(x - 8, y - 6, 7, 0, 7); tg2.arc(x + 8, y - 6, 7, 0, 7); tg2.fill(); tg2.fillStyle = '#000'; tg2.beginPath(); tg2.arc(x - 8, y - 5, 3, 0, 7); tg2.arc(x + 8, y - 5, 3, 0, 7); tg2.fill(); }
    tg2.restore(); tg2.strokeStyle = 'rgba(255,255,255,0.95)'; tg2.lineWidth = 12; tg2.beginPath(); tg2.arc(256, 256, 240, 0, 7); tg2.stroke(); tt2.needsUpdate = true; };
  const sparks = []; for (let i = 0; i < 12; i++) { const s = glowSprite(0xffe14d, 0.12); scene.add(s); sparks.push(s); }
  const hungry = textSprite('MORE?', '#ff5fa2', "400 110px Brand, sans-serif"); scene.add(hungry);
  const fx = { burst: burst(0xffe14d, 70, 1), crash: burst(0x9a6aff, 50, 2) }; Object.values(fx).forEach(f => scene.add(f));
  const crashS = stamp('SUGAR CRASH!', '#9a6aff', 0.62); scene.add(crashS);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // ---------- hero ----------
      const energy = smooth(range(t, 8.9, 9.4)) * (1 - smooth(range(t, 11.4, 12.2)));
      const crash = smooth(range(t, 15.2, 15.9)) * (1 - smooth(range(t, 18.3, 18.9)));
      const fat = smooth(range(t, 20.4, 21.4));
      const hop = energy * Math.abs(Math.sin(t * 7)) * 0.15;
      hero.root.position.set(0.05, hop - 0.42 * crash, 0.0); hero.root.rotation.y = 0.15 + energy * Math.sin(t * 4) * 0.4;
      let pose = STAND(t);
      if (energy > 0.01) { const d = Math.sin(t * 7); pose = over(pose, { lSh: [-2.4 * energy + 0.3 * d, 0, 0.5], rSh: [-2.4 * energy - 0.3 * d, 0, -0.5], lEl: [-0.3, 0, 0], rEl: [-0.3, 0, 0], lKn: [0.4 * Math.abs(d) * energy, 0, 0], rKn: [0.4 * Math.abs(d) * energy, 0, 0], neck: [-0.15 * energy, 0.2 * d * energy, 0] }); }
      if (crash > 0.01) pose = over(pose, { lHip: [-1.5 * crash, 0, 0.25], rHip: [-1.5 * crash, 0, -0.25], lKn: [1.0 * crash, 0, 0], rKn: [1.0 * crash, 0, 0], spine: [0.35 * crash, 0, 0], neck: [0.5 * crash, 0, 0], lSh: [0.1, 0, 0.3], rSh: [0.1, 0, -0.3], lEl: [-0.2, 0, 0], rEl: [-0.2, 0, 0] });
      hero.setPose(pose); hero.setMouth(energy > 0.3 ? 0.6 : t < 2.6 ? 0.3 + 0.3 * Math.max(0, Math.sin(t * 9)) : 0.05);
      hero.j.chest.scale.set(1 + 0.35 * fat, 1, 1 + 0.45 * fat); hero.j.spine.scale.set(1 + 0.3 * fat, 1, 1 + 0.4 * fat);
      scene.updateMatrixWorld(true);
      // eating: lollipop to mouth during hook
      const rs = hero.j.rSh.getWorldPosition(V()), mouth = hero.j.head.localToWorld(V(0, -0.05, 0.18));
      const eat = smooth(range(t, 0.0, 0.3)) * (1 - smooth(range(t, 2.6, 3.0)));
      if (eat > 0.01) { const tgt = mouth.clone().add(V(0.02, 0, 0.12 + 0.04 * Math.sin(t * 9))); ikArm(hero, 'r', rs.clone().add(V(0.05, -0.5, 0.1)).lerp(tgt, eat), rs.clone().add(V(0.2, -0.4, -0.2)), V(0, 0, 1)); scene.updateMatrixWorld(true); }
      const rh = hero.j.rWr.localToWorld(V(0, -0.08, 0));
      lolli.position.copy(rh).add(V(0, 0.12, 0.02)); lolli.visible = t < 3.2; lolli.lookAt(lolli.position.clone().add(V(0, 0, 1)));
      // reach for more (hungry) at 16.9
      const reach = smooth(range(t, 16.8, 17.4)) * (1 - smooth(range(t, 18.2, 18.6)));
      if (reach > 0.01) { const ls = hero.j.lSh.getWorldPosition(V()); ikArm(hero, 'l', ls.clone().add(V(-0.05, -0.5, 0.1)).lerp(donuts[3].position.clone().add(V(0.1, 0.05, 0.15)), reach), ls.clone().add(V(-0.2, -0.4, -0.2)), V(0, 0, 1)); }
      // cube rain in hook
      cubes.forEach((cb, i) => { const u2 = (t * 0.7 + cb.userData.ph) % 1; cb.position.set(cb.userData.x, 2.8 - u2 * 2.8, cb.userData.z); cb.rotation.set(t * cb.userData.sp.x * 4, t * cb.userData.sp.y * 4, 0); cb.visible = t < 2.7; });
      const head = hero.j.head.getWorldPosition(V());
      sparks.forEach((s, i) => { const a = i / 12 * 6.283 + t * 3; s.position.copy(head).add(V(Math.cos(a) * 0.45, -0.2 + Math.sin(a) * 0.45, 0.1)); s.material.opacity = energy * (0.5 + 0.5 * Math.sin(t * 12 + i)); s.visible = energy > 0.01; });
      fx.burst.position.copy(head); fx.burst.update(t - 9.0);
      fx.crash.position.copy(head); fx.crash.update(t - 15.3);
      const hk = easeOut(range(t, 17.0, 17.3)) * (1 - smooth(range(t, 18.2, 18.5)));
      hungry.position.copy(head).add(V(0.0, 0.42, 0)); hungry.scale.set(0.5 * hk, 0.25 * hk, 1); hungry.visible = hk > 0.01;
      // ---------- camera ----------
      const KEYS = [[0, [1.0, 1.55, 4.4], [-0.3, 1.05, -0.4]], [2.6, [0.9, 1.5, 3.8], [0.1, 1.0, -0.2]], [18.2, [0.9, 1.5, 3.8], [0.1, 0.95, -0.2]], [25.4, [0.8, 1.5, 3.6], [0.1, 1.0, -0.2]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.4 + energy * 1.5 + (t > 15.2 && t < 15.6 ? 2.5 : 0), 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const vk = easeOut(range(t, 2.9, 3.3)) * (1 - smooth(range(t, 8.4, 8.8)));
      if (vk > 0.01) drawV(smooth(range(t, 3.0, 5.5)), smooth(range(t, 6.6, 7.1)), smooth(range(t, 7.3, 8.4)) * 0.6, t);
      bub.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.06).addScaledVector(rt, 0.15); bub.scale.setScalar(0.36 * vk); bub.visible = vk > 0.01;
      const gk = easeOut(range(t, 8.6, 9.0)) * (1 - smooth(range(t, 18.3, 18.7)));
      if (gk > 0.01) drawG(Math.max(2.0, t));
      graph.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.08).addScaledVector(rt, 0.15); graph.scale.set(0.3 * gk, 0.225 * gk, 1); graph.visible = gk > 0.01;
      const tk = easeOut(range(t, 22.4, 22.8));
      drawTooth(smooth(range(t, 23.2, 24.4)), t);
      toothB.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.06).addScaledVector(rt, 0.15); toothB.scale.setScalar(0.32 * tk); toothB.visible = tk > 0.01;
      crashS.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); crashS.set(t > 15.4 && t < 17.0 ? easeOut(range(t, 15.4, 15.6)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.4, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
