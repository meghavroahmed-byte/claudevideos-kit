import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 23.4;
export const CAPTIONS = [
  [0.0, 'What does coffee do to your brain?'],
  [2.37, 'All day long'], [3.37, 'your brain builds up a chemical'], [4.99, 'called adenosine'], [6.08, "It's what makes you feel sleepy"],
  [8.38, 'Caffeine looks so similar'], [10.2, 'that it sneaks into the same spots'], [11.96, 'and blocks them'],
  [13.16, "So the sleepy signal can't get through"], [15.4, 'and you feel wide awake'],
  [17.01, 'But when the caffeine wears off'], [18.7, 'all that adenosine hits at once'], [21.1, "That's the crash!", 23.2],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const CRASH = 21.15;

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-2, 6, 4], sun: 0.8 });
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xffe2c0); hemi.groundColor.set(0x5a3a20); hemi.intensity = 0.95;
  // café
  const floorT = canvasTex(512, 512, (g) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#2a2420' : '#e8dcc8'; g.fillRect(i * 64, j * 64, 64, 64); } });
  floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(5, 5);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.6 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const brickT = canvasTex(512, 512, (g) => { g.fillStyle = '#6a3a2a'; g.fillRect(0, 0, 512, 512); for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) { g.fillStyle = ['#a8583a', '#9a4e34', '#b0623e'][(x + y) % 3]; g.fillRect(x * 64 + (y % 2) * 32 + 3, y * 32 + 3, 58, 26); } });
  brickT.wrapS = brickT.wrapT = THREE.RepeatWrapping; brickT.repeat.set(3, 1.5);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), new THREE.MeshStandardMaterial({ map: brickT, roughness: 0.9 })); back.position.set(0, 2, -2.2); scene.add(back);
  const chalkT = canvasTex(512, 320, (g) => { g.fillStyle = '#1e2a24'; g.fillRect(0, 0, 512, 320); g.strokeStyle = '#8a6a40'; g.lineWidth = 18; g.strokeRect(0, 0, 512, 320); g.fillStyle = '#f4f0e0'; g.font = "400 60px Brand, sans-serif"; g.textAlign = 'center'; g.fillText('COFFEE', 256, 90); g.font = "400 34px Brand, sans-serif"; ['ESPRESSO', 'LATTE', 'MOCHA'].forEach((s, i) => g.fillText(s, 256, 150 + i * 50)); });
  const chalk = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.88), new THREE.MeshStandardMaterial({ map: chalkT })); chalk.position.set(-1.2, 2.2, -2.18); scene.add(chalk);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.0, 0.6), new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.6 })); counter.position.set(0.6, 0.5, -1.7); scene.add(counter);
  const ctop = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.05, 0.7), new THREE.MeshStandardMaterial({ color: 0xe8e0d4, roughness: 0.3 })); ctop.position.set(0.6, 1.02, -1.7); scene.add(ctop);
  const machine = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.45), new THREE.MeshStandardMaterial({ color: 0xc8ccd4, metalness: 0.8, roughness: 0.25 })); machine.position.set(1.4, 1.32, -1.75); scene.add(machine);
  const steam = []; for (let i = 0; i < 8; i++) { const s = glowSprite(0xffffff, 0.09); s.userData.ph = i / 8; scene.add(s); steam.push(s); }
  for (const x of [-0.6, 0.6, 1.8]) { const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.8, 4), new THREE.MeshBasicMaterial({ color: 0x222222 })); cord.position.set(x, 2.9, -0.6); scene.add(cord); const shade = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.2, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide })); shade.position.set(x, 2.45, -0.6); scene.add(shade); const bulb = glowSprite(0xffc070, 0.5); bulb.position.set(x, 2.36, -0.6); scene.add(bulb); }
  const warm = new THREE.PointLight(0xffb870, 8, 7, 1.3); warm.position.set(0.3, 2.3, 0.2); scene.add(warm);
  const fill = new THREE.PointLight(0xfff0dc, 5, 8, 1.2); fill.position.set(1.0, 2.0, 3.0); scene.add(fill);
  // high table + cup
  const tm = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.5, roughness: 0.4 });
  const ttop = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.04, 28), new THREE.MeshStandardMaterial({ color: 0xc8a070, roughness: 0.5 })); ttop.position.set(0.15, 1.05, 0.35); scene.add(ttop);
  const tleg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.05, 10), tm); tleg.position.set(0.15, 0.525, 0.35); scene.add(tleg);
  const tbase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.03, 20), tm); tbase.position.set(0.15, 0.015, 0.35); scene.add(tbase);
  const cup = new THREE.Group(); scene.add(cup);
  const cupM = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.1, 20), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })); cup.add(cupM);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.045, 20), new THREE.MeshStandardMaterial({ color: 0x4a2a14 })); coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.045; cup.add(coffee);
  const hdl = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.008, 6, 12), cupM.material); hdl.position.set(0.055, 0, 0); cup.add(hdl);
  // hero
  const hero = makeHuman('casual', { shirt: 0x8a5a3a, jeans: 0x2f3e5a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  // brain-cell zoom bubble
  const zc = document.createElement('canvas'); zc.width = zc.height = 512; const zg = zc.getContext('2d'); const zt = new THREE.CanvasTexture(zc); zt.colorSpace = THREE.SRGBColorSpace;
  const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); bub.renderOrder = 30; scene.add(bub);
  const SLOTS = [80, 170, 260, 350, 440];
  const r9 = rng(7); const ADEN = []; for (let i = 0; i < 18; i++) ADEN.push({ x: 40 + r9() * 430, y: 60 + r9() * 200, ph: r9() * 6, slot: i < 5 ? i : -1 });
  const CAF = []; for (let i = 0; i < 5; i++) CAF.push({ slot: i, x0: 520 + i * 40, y0: 80 + i * 30 });
  const drawB = (aCount, aDock, cIn, cDock, signal, block, flood, tt) => {
    zg.clearRect(0, 0, 512, 512); zg.save(); zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.clip();
    zg.fillStyle = '#1a1030'; zg.fillRect(0, 0, 512, 512);
    // cell membrane with receptor slots
    zg.fillStyle = '#ff8fab'; zg.fillRect(0, 380, 512, 140);
    SLOTS.forEach(x => { zg.fillStyle = '#1a1030'; zg.beginPath(); zg.arc(x, 380, 30, 0, Math.PI); zg.fill(); zg.strokeStyle = '#ffd0dc'; zg.lineWidth = 6; zg.beginPath(); zg.arc(x, 380, 30, 0, Math.PI); zg.stroke(); });
    // adenosine molecules (purple, zZ)
    const n = Math.round(aCount * ADEN.length);
    ADEN.slice(0, n).forEach((a, i) => { let x = a.x + Math.sin(tt * 1.3 + a.ph) * 14, y = a.y + Math.cos(tt * 1.1 + a.ph) * 12; if (a.slot >= 0 && aDock > 0) { const k = Math.min(1, aDock); x = lerp(x, SLOTS[a.slot], k); y = lerp(y, 372, k); }
      if (a.slot >= 0 && block > 0 && cDock > 0.5) { x = lerp(x, a.x, block); y = lerp(y, 120 + (i % 3) * 30, block); }
      if (flood > 0) { const s = a.slot >= 0 ? a.slot : i % 5; x = lerp(x, SLOTS[s], flood); y = lerp(y, 372 - (a.slot >= 0 ? 0 : 40 + (i % 3) * 30), flood); }
      zg.fillStyle = '#9a6aff'; zg.beginPath(); zg.arc(x, y, 22, 0, 7); zg.fill(); zg.fillStyle = '#fff'; zg.font = "400 22px Brand, sans-serif"; zg.textAlign = 'center'; zg.textBaseline = 'middle'; zg.fillText('z', x, y + 1); });
    // caffeine molecules (brown hexagons)
    CAF.forEach((cf, i) => { if (cIn <= 0) return; let x = lerp(cf.x0, SLOTS[cf.slot], easeOut(clamp(cIn * 1.2 - i * 0.05, 0, 1))), y = lerp(cf.y0, 372, easeOut(clamp(cDock * 1.2 - i * 0.05, 0, 1))); if (cIn > 0 && cDock <= 0) y = cf.y0 + Math.sin(tt * 2 + i) * 10; if (flood > 0 || cIn < 1) { x += (1 - cIn) * 300; }
      zg.fillStyle = '#c87a3a'; zg.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + 0.5; zg.lineTo(x + Math.cos(a) * 26, y + Math.sin(a) * 26); } zg.closePath(); zg.fill(); zg.strokeStyle = '#ffe0b0'; zg.lineWidth = 4; zg.stroke(); zg.fillStyle = '#fff'; zg.font = "400 24px Brand, sans-serif"; zg.fillText('C', x, y + 1); });
    // sleepy signal blocked
    if (signal > 0) { const y = 330 - 10 * Math.sin(tt * 8); zg.strokeStyle = `rgba(160,120,255,${signal})`; zg.lineWidth = 10; zg.setLineDash([16, 12]); zg.lineDashOffset = -tt * 80; zg.beginPath(); zg.moveTo(256, 120); zg.lineTo(256, y); zg.stroke(); zg.setLineDash([]); if (block > 0.5) { zg.strokeStyle = `rgba(255,80,80,${signal})`; zg.lineWidth = 12; zg.beginPath(); zg.moveTo(226, y - 30); zg.lineTo(286, y + 10); zg.moveTo(286, y - 30); zg.lineTo(226, y + 10); zg.stroke(); } }
    zg.restore(); zg.strokeStyle = 'rgba(255,255,255,0.95)'; zg.lineWidth = 12; zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.stroke(); zt.needsUpdate = true; };
  const zzz = textSprite('Zzz', '#b89aff', "400 120px Brand, sans-serif"); scene.add(zzz);
  const sparks = []; for (let i = 0; i < 10; i++) { const s = glowSprite(0xffe14d, 0.12); scene.add(s); sparks.push(s); }
  const fx = { jolt: burst(0xffe14d, 60, 1), crash: burst(0x9a6aff, 70, 2) }; Object.values(fx).forEach(f => scene.add(f));
  const crashS = stamp('CRASH!', '#9a6aff', 0.55); scene.add(crashS);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      hero.root.position.set(-0.05, 0, -0.1); hero.root.rotation.y = 0.35;
      const sleepy = smooth(range(t, 5.8, 7.0)) * (1 - smooth(range(t, 12.8, 13.4)));
      const awake = smooth(range(t, 15.3, 15.8)) * (1 - smooth(range(t, 18.6, 19.4)));
      const hookAwake = 1 - smooth(range(t, 1.6, 2.4));
      const crash = smooth(range(t, CRASH - 0.4, CRASH));
      const jit = (awake + hookAwake * 0.7) * Math.sin(t * 35) * 0.03;
      let pose = over(STAND(t), { spine: [0.1 * sleepy + jit, 0, 0], neck: [0.45 * sleepy - 0.15 * awake, jit * 3, 0], lSh: [0.1, 0, 0.12 + 0.1 * sleepy], lEl: [-0.3, 0, 0] });
      if (crash > 0) pose = over(pose, { spine: [0.85 * crash, 0, 0], chest: [0.3 * crash, 0, 0], neck: [0.4 * crash, 0.3 * crash, 0], lSh: [-1.4 * crash, 0, 0.5], rSh: [-1.4 * crash, 0, -0.5], lEl: [-1.4 * crash, 0, 0], rEl: [-1.4 * crash, 0, 0], lKn: [0.3 * crash, 0, 0], rKn: [0.3 * crash, 0, 0] });
      hero.root.position.y = -0.05 * crash;
      hero.setPose(pose);
      const yawn = Math.max(0, Math.sin(Math.PI * range(t, 6.9, 8.1)));
      hero.setMouth(Math.max(yawn * 0.9, awake * 0.35, hookAwake * 0.4, 0.05));
      scene.updateMatrixWorld(true);
      // cup: drink at hook (0.0-1.4) and again at 8.4-9.6
      const rs = hero.j.rSh.getWorldPosition(V());
      const mouth = hero.j.head.localToWorld(V(0, -0.05, 0.18));
      const drink = Math.max(smooth(range(t, 0.0, 0.4)) * (1 - smooth(range(t, 1.2, 1.7))), smooth(range(t, 8.4, 8.9)) * (1 - smooth(range(t, 9.6, 10.1))));
      const tableSpot = V(0.12, 1.12, 0.38);
      const holdC = crash > 0.5 ? tableSpot : tableSpot.clone().lerp(mouth.clone().add(V(0.02, -0.02, 0.06)), drink);
      if (crash < 0.5) { ikArm(hero, 'r', holdC.clone().add(V(0.05, -0.03, -0.01)), rs.clone().add(V(0.2, -0.4, -0.2)), V(0, 0, 1)); scene.updateMatrixWorld(true); }
      cup.position.copy(holdC); cup.rotation.set(-0.9 * drink, 0, 0);
      steam.forEach((s, i) => { const u2 = (t * 0.6 + s.userData.ph) % 1; s.position.copy(i < 4 ? cup.position : machine.position).add(V(Math.sin(i + t) * 0.03, 0.08 + u2 * 0.35, 0)); s.material.opacity = 0.25 * (1 - u2); });
      // zzz & sparks
      const head = hero.j.head.getWorldPosition(V());
      const zk = Math.max(sleepy, smooth(range(t, CRASH, CRASH + 0.4)));
      zzz.position.copy(head).add(V(0.35, 0.3 + Math.sin(t * 2) * 0.03, 0)); zzz.scale.set(0.5 * zk, 0.25 * zk, 1); zzz.material.opacity = zk; zzz.visible = zk > 0.01;
      const sk = Math.max(awake, hookAwake);
      sparks.forEach((s, i) => { const a = i / 10 * 6.283 + t * 2; s.position.copy(head).add(V(Math.cos(a) * 0.3, 0.1 + Math.sin(a) * 0.3, 0.05)); s.material.opacity = sk * (0.5 + 0.5 * Math.sin(t * 12 + i)); s.visible = sk > 0.01; });
      fx.jolt.position.copy(head); fx.jolt.update(t - 15.4);
      fx.crash.position.copy(head); fx.crash.update(t - CRASH);
      // ---------- camera ----------
      const KEYS = [[0, [1.3, 1.6, 4.2], [0.1, 1.05, -0.3]], [2.3, [1.0, 1.55, 3.6], [0.05, 1.05, -0.2]], [21.0, [1.0, 1.55, 3.5], [0.05, 1.0, -0.2]], [23.4, [1.2, 1.6, 3.9], [0.1, 0.95, -0.2]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.4 + awake * 1.2 + (t > CRASH && t < CRASH + 0.4 ? 3 : 0), 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const bk = easeOut(range(t, 2.4, 2.8)) * (1 - smooth(range(t, 20.6, 21.0)));
      if (bk > 0.01) {
        const aCount = smooth(range(t, 2.6, 5.6)) * 0.6 + 0.4 * smooth(range(t, 17.6, 19.0)) + 0.0;
        const aDock = smooth(range(t, 5.4, 6.6)) * (1 - smooth(range(t, 10.4, 11.0)));
        const cIn = smooth(range(t, 8.4, 9.4)) * (1 - smooth(range(t, 17.4, 18.4)));
        const cDock = smooth(range(t, 10.2, 11.3)) * (1 - smooth(range(t, 17.4, 18.0)));
        const signal = smooth(range(t, 13.2, 13.6)) * (1 - smooth(range(t, 16.6, 17.0)));
        const block = smooth(range(t, 10.4, 11.4)) * (1 - smooth(range(t, 17.4, 18.0)));
        const flood = smooth(range(t, 19.5, 20.3));
        drawB(Math.max(0.15, aCount), aDock, cIn, cDock, signal, block, flood, t);
      }
      bub.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.08).addScaledVector(rt, 0.15); bub.scale.setScalar(0.4 * bk); bub.visible = bk > 0.01;
      crashS.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); crashS.set(t > CRASH + 0.05 ? easeOut(range(t, CRASH + 0.05, CRASH + 0.25)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.4, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
