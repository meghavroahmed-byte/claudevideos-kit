import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 26.6;
export const CAPTIONS = [
  [0.0, 'What if you opened a plane door mid-flight?'],
  [2.85, "Good news, you can't!"], [4.8, 'At cruising height'], [5.85, 'the air inside pushes on the door'], [7.77, 'with the weight of about seven cars'],
  [10.34, 'The door is a plug'], [11.47, 'bigger than its frame'], [12.91, 'so the pressure seals it even tighter'],
  [15.4, 'But if a hole did open'], [17.07, 'loose things would get sucked out'], [18.85, 'and oxygen masks would drop'],
  [20.91, "You'd have less than a minute"], [22.22, 'before passing out'], [23.53, 'So put on your own mask first!', 26.4],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const HOLE = 16.2, WX = -1.72;

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-2, 6, 3], sun: 0.6 });
  scene.userData.sky.visible = false; scene.background = new THREE.Color(0x1a2030); scene.fog = null;
  scene.children.filter(o => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry').forEach(o => o.visible = false);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xfff6e8); hemi.groundColor.set(0x5a6070); hemi.intensity = 1.0;
  // cabin shell
  const wallM = new THREE.MeshStandardMaterial({ color: 0xeef0f4, roughness: 0.7, side: THREE.BackSide });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 30, 40, 1, true), wallM); shell.rotation.x = Math.PI / 2; shell.position.set(0, 1.1, -6); scene.add(shell);
  const floorT = canvasTex(256, 256, (g) => { g.fillStyle = '#3a4a7a'; g.fillRect(0, 0, 256, 256); const r = rng(3); for (let i = 0; i < 600; i++) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(r() * 256, r() * 256, 3, 3); } });
  floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(3, 20);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 30), new THREE.MeshStandardMaterial({ map: floorT, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -6); floor.receiveShadow = true; scene.add(floor);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 30), new THREE.MeshBasicMaterial({ color: 0xfff4e0, toneMapped: false })); strip.position.set(0, 2.62, -6); scene.add(strip);
  const ceilL = new THREE.PointLight(0xfff4e0, 6, 8, 1.2); ceilL.position.set(0, 2.4, 1.0); scene.add(ceilL);
  const ceilL2 = new THREE.PointLight(0xfff4e0, 5, 8, 1.2); ceilL2.position.set(0, 2.4, -3.5); scene.add(ceilL2);
  // overhead bins
  const binM = new THREE.MeshStandardMaterial({ color: 0xf8f8fa, roughness: 0.5 });
  for (const x of [-1.3, 1.3]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 30), binM); b.position.set(x, 2.25, -6); scene.add(b); }
  // windows
  const winT = canvasTex(128, 192, (g) => { const gr = g.createLinearGradient(0, 0, 0, 192); gr.addColorStop(0, '#3a8ae0'); gr.addColorStop(1, '#cfe8ff'); g.fillStyle = gr; g.beginPath(); g.roundRect(14, 14, 100, 164, 40); g.fill(); g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(70, 140, 40, 12, 0, 0, 7); g.fill(); g.strokeStyle = '#c8ccd4'; g.lineWidth = 10; g.beginPath(); g.roundRect(14, 14, 100, 164, 40); g.stroke(); });
  const wins = [];
  for (const side of [-1, 1]) for (let i = 0; i < 12; i++) { const z = 2 - i * 1.0; if (side < 0 && Math.abs(z) < 0.8) continue; const w = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.38), new THREE.MeshBasicMaterial({ map: winT, transparent: true, toneMapped: false })); w.position.set(side * 1.74, 1.45, z); w.rotation.y = -side * Math.PI / 2; w.rotation.x = 0; scene.add(w); wins.push(w); }
  // seats
  const seatM = new THREE.MeshStandardMaterial({ color: 0x2a5aa8, roughness: 0.8 }), headM = new THREE.MeshStandardMaterial({ color: 0xe8ecf2 });
  const seat = (x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); const base = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.46), seatM); base.position.y = 0.45; g.add(base); const back = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.75, 0.1), seatM); back.position.set(0, 0.85, -0.22); back.rotation.x = -0.1; g.add(back); const hd = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.11), headM); hd.position.set(0, 1.15, -0.25); g.add(hd); const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.3), new THREE.MeshStandardMaterial({ color: 0x5a5a64 })); leg.position.y = 0.2; g.add(leg); return g; };
  for (let r = 0; r < 9; r++) { const z = -1.4 - r * 0.85; for (const x of [-1.3, -0.82, 0.82, 1.3]) seat(x, z); }
  for (const x of [0.82, 1.3]) seat(x, 0.6);
  // exit door on the left wall
  const door = new THREE.Group(); door.position.set(WX + 0.02, 0, 0); scene.add(door);
  const doorP = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.85, 0.95), new THREE.MeshStandardMaterial({ color: 0xd8dce4, roughness: 0.5 })); doorP.position.y = 1.0; door.add(doorP);
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.065, 1.9, 1.0), new THREE.MeshStandardMaterial({ color: 0x8a909c })); seam.position.y = 1.0; seam.scale.set(0.9, 1, 1); door.add(seam); seam.position.x = -0.01;
  const dWin = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.32), new THREE.MeshBasicMaterial({ map: winT, transparent: true, toneMapped: false })); dWin.position.set(0.04, 1.45, 0); dWin.rotation.y = Math.PI / 2; door.add(dWin);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.4), new THREE.MeshStandardMaterial({ color: 0xff3b3b, roughness: 0.4 })); handle.position.set(0.08, 1.05, 0.15); door.add(handle);
  const exitT = textSprite('EXIT', '#ff3b3b', "400 120px Brand, sans-serif"); exitT.position.set(WX + 0.1, 1.98, 0.62); exitT.scale.set(0.5, 0.25, 1); scene.add(exitT);
  // hero + passengers
  const hero = makeHuman('casual', { shirt: 0xf4a261, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const pass = []; [[0.82, -1.4, 0x6c8a3a], [1.3, -2.25, 0xe76f9a], [-0.82, -2.25, 0x7a4dd8]].forEach(([x, z, col], i) => { const p = makeHuman('casual', { shirt: col, jeans: 0x3a3a48, hair: [0x2a1a10, 0x6a3a1a, 0x3a3a3a][i] }); p.root.position.set(x, 0, z + 0.05); scene.add(p.root); pass.push(p); });
  // pressure arrows toward door
  const arM = new THREE.MeshBasicMaterial({ color: 0x39a0ff, toneMapped: false, transparent: true });
  const arrows = []; for (let i = 0; i < 8; i++) { const g = new THREE.Group(); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8), arM); sh.position.y = 0.22; g.add(sh); const hd = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 10), arM); hd.position.y = 0.5; g.add(hd); g.rotation.z = Math.PI / 2; g.userData = { y: 0.4 + (i % 4) * 0.42, z: -0.3 + Math.floor(i / 4) * 0.6 }; scene.add(g); arrows.push(g); }
  // 7 cars
  const carT = canvasTex(256, 140, (g) => { g.fillStyle = '#ff5a5a'; g.beginPath(); g.roundRect(10, 50, 236, 55, 18); g.fill(); g.beginPath(); g.moveTo(60, 52); g.lineTo(90, 12); g.lineTo(170, 12); g.lineTo(205, 52); g.fill(); g.fillStyle = '#bfe6ff'; g.fillRect(98, 20, 30, 28); g.fillRect(136, 20, 30, 28); g.fillStyle = '#222'; g.beginPath(); g.arc(65, 108, 22, 0, 7); g.arc(190, 108, 22, 0, 7); g.fill(); });
  const cars = []; for (let i = 0; i < 7; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: carT, transparent: true, depthTest: false, toneMapped: false })); s.renderOrder = 30; scene.add(s); cars.push(s); }
  // plug-door cross-section bubble
  const zc = document.createElement('canvas'); zc.width = zc.height = 512; const zg = zc.getContext('2d'); const zt = new THREE.CanvasTexture(zc); zt.colorSpace = THREE.SRGBColorSpace;
  const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); bub.renderOrder = 30; scene.add(bub);
  const drawP = (push, tt) => { zg.clearRect(0, 0, 512, 512); zg.save(); zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.clip();
    zg.fillStyle = '#cfe8ff'; zg.fillRect(0, 0, 256, 512); zg.fillStyle = '#fff4e0'; zg.fillRect(256, 0, 256, 512);
    // fuselage frame (two jaws)
    zg.fillStyle = '#8a909c'; zg.fillRect(220, 0, 60, 150); zg.fillRect(220, 362, 60, 150);
    // plug door: wider on the inside (right)
    const dx = -10 * push;
    zg.fillStyle = '#d8dce4'; zg.strokeStyle = '#4a5060'; zg.lineWidth = 6; zg.beginPath(); zg.moveTo(232 + dx, 160); zg.lineTo(300 + dx, 120); zg.lineTo(300 + dx, 392); zg.lineTo(232 + dx, 352); zg.closePath(); zg.fill(); zg.stroke();
    // pressure arrows from the cabin side
    zg.fillStyle = '#39a0ff'; for (let i = 0; i < 4; i++) { const y = 170 + i * 58, x = 420 - ((tt * 60 + i * 20) % 40); zg.fillRect(x, y - 6, 70, 12); zg.beginPath(); zg.moveTo(x - 22, y); zg.lineTo(x, y - 18); zg.lineTo(x, y + 18); zg.fill(); }
    zg.font = "400 40px Brand, sans-serif"; zg.textAlign = 'center'; zg.fillStyle = '#2a5aa8'; zg.fillText('OUT', 110, 270); zg.fillStyle = '#a85a2a'; zg.fillText('IN', 440, 110);
    zg.restore(); zg.strokeStyle = 'rgba(255,255,255,0.95)'; zg.lineWidth = 12; zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.stroke(); zt.needsUpdate = true; };
  // hole window + flying loose things + fog
  const holeW = wins.find(w => w.position.x < 0 && Math.abs(w.position.z + 3) < 0.01) || wins[0];
  const crackT = canvasTex(128, 192, (g) => { g.fillStyle = '#05070c'; g.beginPath(); g.roundRect(14, 14, 100, 164, 40); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(64, 96); g.lineTo(64 + Math.cos(i) * 70, 96 + Math.sin(i) * 90); g.stroke(); } });
  const loose = []; const lr = rng(9);
  for (let i = 0; i < 14; i++) { const kind = i % 3; const m = kind === 0 ? new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.1, 10), new THREE.MeshStandardMaterial({ color: 0xffffff })) : kind === 1 ? new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.28), new THREE.MeshStandardMaterial({ color: 0xf4f4e8, side: THREE.DoubleSide })) : new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.22), new THREE.MeshStandardMaterial({ color: 0x8ac0ff })); m.userData = { p0: V((lr() - 0.3) * 2.2, 0.5 + lr() * 1.2, -1.5 - lr() * 3), d: lr() * 0.6, sp: V(lr(), lr(), lr()) }; scene.add(m); loose.push(m); }
  const fog = []; for (let i = 0; i < 30; i++) { const s = glowSprite(0xffffff, 0.8); s.material.fog = false; s.material.blending = THREE.NormalBlending; s.userData = { ph: i / 30, x: (lr() - 0.5) * 2.6, z: -0.5 - lr() * 5 }; scene.add(s); fog.push(s); }
  // oxygen masks
  const masks = []; const mxz = [[-1.05, -1.6], [1.05, -1.6], [-1.05, -2.45], [1.05, -2.45], [-1.05, -3.3], [1.05, -3.3], [-0.95, 0.25]];
  mxz.forEach(([x, z]) => { const g = new THREE.Group(); g.position.set(x, 2.02, z); scene.add(g); const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 5), new THREE.MeshStandardMaterial({ color: 0xdddddd })); tube.position.y = -0.5; g.add(tube); const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.07, 14), new THREE.MeshStandardMaterial({ color: 0xffd23f })); cup.position.y = -1; g.add(cup); g.userData = { tube, cup }; masks.push(g); });
  const heroMask = masks[masks.length - 1];
  // timer
  const wc = document.createElement('canvas'); wc.width = 256; wc.height = 256; const wg = wc.getContext('2d'); const wt = new THREE.CanvasTexture(wc); wt.colorSpace = THREE.SRGBColorSpace;
  const watch = new THREE.Sprite(new THREE.SpriteMaterial({ map: wt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); watch.renderOrder = 31; scene.add(watch); let lastW = -1;
  const drawW = (sec) => { const qv = Math.round(sec); if (qv === lastW) return; lastW = qv; wg.clearRect(0, 0, 256, 256); wg.fillStyle = 'rgba(255,255,255,0.95)'; wg.beginPath(); wg.arc(128, 140, 105, 0, 7); wg.fill(); wg.fillRect(110, 14, 36, 26); wg.strokeStyle = '#ff3b3b'; wg.lineWidth = 14; wg.beginPath(); wg.arc(128, 140, 90, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (60 - sec) / 60); wg.stroke(); wg.fillStyle = '#222'; wg.font = "400 66px Brand, sans-serif"; wg.textAlign = 'center'; wg.textBaseline = 'middle'; wg.fillText(`${qv}s`, 128, 146); wt.needsUpdate = true; };
  const fx = { hole: burst(0xffffff, 70, 1), mask: burst(0x5be37d, 50, 2) }; Object.values(fx).forEach(f => scene.add(f));
  const st = { cant: stamp("CAN'T OPEN!", '#ff3b3b', 0.62), first: stamp('YOURS FIRST!', '#5be37d', 0.62) }; Object.values(st).forEach(s => scene.add(s));
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // ---------- hero at the door ----------
      hero.root.position.set(-1.05, 0, 0.05); hero.root.rotation.y = -Math.PI / 2 + 0.5;
      const pull = smooth(range(t, 0.2, 0.6)) * (1 - smooth(range(t, 4.5, 5.0)));
      const tug = Math.sin(t * 10) * 0.04;
      let pose = STAND(t);
      pose = over(pose, { spine: [0.0, 0, -0.15 * pull], lKn: [0.25 * pull, 0, 0], rKn: [0.25 * pull, 0, 0], lHip: [-0.2 * pull, 0, 0.07], rHip: [0.15 * pull, 0, -0.07] });
      const hold = Math.max(smooth(range(t, 20.4, 21.0)), 0);
      if (t > 15.6 && t < 20.4) pose = over(pose, { neck: [-0.2, 0.5 * smooth(range(t, 16.2, 16.6)), 0] });
      hero.setPose(pose); hero.setMouth(pull > 0.5 ? 0.35 : t > 16.2 && t < 17.5 ? 0.6 : 0.08);
      pass.forEach((p, i) => { p.setPose(over(STAND(t, i), { drop: -0.45, lHip: [-1.5, 0, 0.1], lKn: [1.45, 0, 0], rHip: [-1.5, 0, -0.1], rKn: [1.45, 0, 0], lEl: [-0.9, 0, 0], rEl: [-0.9, 0, 0], neck: [t > 16.3 && t < 20 ? -0.2 : 0.05, 0, 0] })); p.setMouth(t > 16.3 && t < 17.5 ? 0.6 : 0.05); });
      scene.updateMatrixWorld(true);
      const hp = handle.getWorldPosition(V());
      const ls = hero.j.lSh.getWorldPosition(V()), rs = hero.j.rSh.getWorldPosition(V());
      if (pull > 0.01) { ikArm(hero, 'r', rs.clone().add(V(0, -0.5, 0.05)).lerp(hp.clone().add(V(0.12 - tug, 0, -0.05)), pull), rs.clone().add(V(0.1, -0.3, -0.3)), V(0, 0, 1)); ikArm(hero, 'l', ls.clone().add(V(0, -0.5, 0.05)).lerp(hp.clone().add(V(0.12 - tug, 0, 0.12)), pull), ls.clone().add(V(0.1, -0.3, 0.3)), V(0, 0, 1)); }
      // mask on
      const mk = smooth(range(t, 23.6, 24.5));
      const face = hero.j.head.localToWorld(V(0, -0.02, 0.13));
      scene.updateMatrixWorld(true);
      // ---------- pressure arrows & cars ----------
      const ak = smooth(range(t, 6.0, 6.5)) * (1 - smooth(range(t, 10.0, 10.4)));
      arrows.forEach((g, i) => { const u2 = (t * 1.2 + i * 0.13) % 1; g.position.set(WX + 0.75 - u2 * 0.35, g.userData.y, g.userData.z); g.scale.setScalar(Math.max(0.001, ak)); g.visible = ak > 0.01; });
      // ---------- masks drop ----------
      const drop = easeOut(range(t, 19.9, 20.3));
      masks.forEach((m, i) => { const sw = Math.sin(t * 3 + i) * 0.15 * drop; m.userData.tube.scale.y = Math.max(0.001, 0.6 * drop); m.userData.tube.position.y = -0.3 * drop; m.userData.cup.position.set(Math.sin(sw) * 0.6 * drop, -0.6 * drop, 0); m.visible = drop > 0.01; });
      if (mk > 0.01) { const local = heroMask.worldToLocal(face.clone()); heroMask.userData.cup.position.lerp(local, mk); heroMask.userData.cup.lookAt(heroMask.localToWorld(local.clone().add(V(0, 0, 1)))); const tp = heroMask.userData.cup.position; heroMask.userData.tube.position.set(tp.x / 2, tp.y / 2, tp.z / 2); heroMask.userData.tube.scale.y = Math.max(0.001, tp.length()); heroMask.userData.tube.lookAt(heroMask.localToWorld(tp.clone())); heroMask.userData.tube.rotateX(Math.PI / 2); }
      if (mk > 0.01) { scene.updateMatrixWorld(true); const cupW = heroMask.userData.cup.getWorldPosition(V()); ikArm(hero, 'r', rs.clone().add(V(0, -0.5, 0.05)).lerp(cupW.clone().add(V(0.05, -0.04, 0.05)), mk), rs.clone().add(V(0.1, -0.4, -0.3)), V(0, 0, 1)); }
      // ---------- hole + loose things ----------
      const hk = t > HOLE ? 1 : 0;
      holeW.material.map = hk ? crackT : winT;
      const hpos = holeW.position.clone();
      loose.forEach((m, i) => { const u2 = clamp((t - HOLE - m.userData.d) / 1.4, 0, 1); const e = u2 * u2; m.position.copy(m.userData.p0).lerp(hpos, e); m.rotation.set(t * 6 * m.userData.sp.x, t * 6 * m.userData.sp.y, 0); m.visible = t > HOLE - 2.5 && u2 < 0.97 && t < 19.8; if (t < HOLE) m.position.copy(m.userData.p0); });
      fog.forEach((s, i) => { const u2 = ((t - HOLE) * 0.5 + s.userData.ph) % 1; s.position.set(lerp(s.userData.x, hpos.x, u2 * 0.5), 1.2 + Math.sin(i) * 0.4, s.userData.z); s.material.opacity = (t > HOLE ? 0.2 : 0) * Math.sin(u2 * Math.PI) * (1 - smooth(range(t, 21, 23))); s.visible = t > HOLE && t < 23; });
      fx.hole.position.copy(hpos); fx.hole.update(t - HOLE);
      fx.mask.position.copy(face); fx.mask.update(t - 24.6);
      // ---------- camera ----------
      const KEYS = [[0, [1.1, 1.6, 4.6], [-1.35, 1.1, -0.1]], [2.8, [0.9, 1.55, 4.0], [-1.35, 1.1, 0.0]], [10.2, [0.9, 1.55, 4.0], [-1.35, 1.1, 0.0]], [15.2, [0.9, 1.6, 4.0], [-1.2, 1.1, -0.5]], [16.4, [1.0, 1.6, 3.6], [-1.0, 1.15, -1.0]], [19.6, [1.0, 1.6, 3.6], [-0.9, 1.25, -1.0]], [21.0, [0.8, 1.55, 3.8], [-1.0, 1.1, -0.3]], [26.6, [0.7, 1.55, 3.6], [-1.0, 1.1, -0.2]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.5 + (t > HOLE && t < HOLE + 2.5 ? 3 : 0) + (t > HOLE + 2.5 ? 1.0 : 0), 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      cars.forEach((s, j) => { const ck = easeOut(range(t, 8.75 + j * 0.09, 8.95 + j * 0.09)) * (1 - smooth(range(t, 10.0, 10.3))); s.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.02 - Math.floor(j / 4) * 0.075).addScaledVector(rt, 0.05 + (j % 4) * 0.075 - (j >= 4 ? -0.035 : 0)); s.scale.set(0.09 * ck, 0.05 * ck, 1); s.visible = ck > 0.01; });
      const bk = easeOut(range(t, 10.4, 10.8)) * (1 - smooth(range(t, 15.0, 15.4)));
      if (bk > 0.01) drawP(smooth(range(t, 12.9, 13.6)), t);
      bub.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.04).addScaledVector(rt, 0.15); bub.scale.setScalar(0.3 * bk); bub.visible = bk > 0.01;
      const wk = easeOut(range(t, 21.0, 21.3)) * (1 - smooth(range(t, 23.4, 23.7)));
      drawW(lerp(60, 52, range(t, 21.3, 23.4)));
      watch.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.02).addScaledVector(rt, 0.16); watch.scale.setScalar(0.2 * wk); watch.visible = wk > 0.01;
      st.cant.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); st.cant.set(t > 3.7 && t < 5.4 ? easeOut(range(t, 3.7, 3.9)) : 0);
      st.first.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); st.first.set(t > 24.8 ? easeOut(range(t, 24.8, 25.0)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.35, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
