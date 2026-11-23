import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 24.8;
export const CAPTIONS = [
  [0.0, 'What should you do in an earthquake?'],
  [2.25, "Don't run outside!"], [3.82, 'Most injuries happen from'], [5.27, 'falling glass and bricks'], [6.79, 'while people are running'],
  [8.22, 'Instead, drop to your hands and knees'], [10.78, 'take cover under a sturdy table'], [12.91, 'and hold on until the shaking stops'],
  [15.56, 'Stay away from windows, shelves'], [17.7, 'and anything heavy that could fall'],
  [19.96, 'Drop, cover, and hold on'], [22.34, 'It could save your life!', 24.6],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [0, 0, 0], neck: [0.03, 0, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const quakeK = (t) => smooth(range(t, 0, 0.3)) * (1 - smooth(range(t, 14.4, 15.2)));

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-2, 6, 4], sun: 1.0 });
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  scene.userData.sky.visible = false; scene.background = new THREE.Color(0xbfd8e8);
  scene.children.filter(o => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry').forEach(o => o.visible = false);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xfff4e8); hemi.groundColor.set(0x6a5040); hemi.intensity = 1.0;
  const room = new THREE.Group(); scene.add(room);
  const floorT = canvasTex(512, 512, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#b08050' : '#a4744a'; g.fillRect(0, i * 64, 512, 64); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, i * 64, 512, 3); } });
  floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(3, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.7 })); floor.rotation.x = -Math.PI / 2; room.add(floor);
  const wallM = new THREE.MeshStandardMaterial({ color: 0xf0e0c8, roughness: 0.9 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.2), wallM); back.position.set(0, 1.6, -2.0); room.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.2), wallM); left.position.set(-3.0, 1.6, 1.0); left.rotation.y = Math.PI / 2; room.add(left);
  // window (shatters)
  const winT = canvasTex(256, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#6ab0e8'); gr.addColorStop(1, '#cfe8f8'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#fff'; g.lineWidth = 14; g.strokeRect(0, 0, 256, 256); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.stroke(); });
  const crackT = canvasTex(256, 256, (g) => { g.drawImage(winT.image, 0, 0); g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 3; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(90, 110); g.lineTo(90 + Math.cos(i) * 160, 110 + Math.sin(i) * 160); g.stroke(); } });
  const brokenT = canvasTex(256, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#6ab0e8'); gr.addColorStop(1, '#cfe8f8'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); g.fillStyle = 'rgba(220,240,255,0.85)'; for (const [x, y, d] of [[0, 0, 1], [256, 0, -1], [0, 256, 1], [256, 256, -1]]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + d * 70, y); g.lineTo(x + d * 20, y + (y ? -50 : 50)); g.closePath(); g.fill(); } g.strokeStyle = '#fff'; g.lineWidth = 14; g.strokeRect(0, 0, 256, 256); });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.2), new THREE.MeshBasicMaterial({ map: winT })); win.position.set(0.8, 1.7, -1.98); room.add(win);
  const shards = []; const sr = rng(4); for (let i = 0; i < 24; i++) { const s = new THREE.Mesh(new THREE.TetrahedronGeometry(0.05 + sr() * 0.05), new THREE.MeshStandardMaterial({ color: 0xcfeaff, transparent: true, opacity: 0.8, metalness: 0.4, roughness: 0.1 })); s.userData = { x: 0.8 + (sr() - 0.5) * 1.2, y: 1.2 + sr() * 1.0, vz: 0.3 + sr() * 0.8, sp: sr() * 6 }; scene.add(s); shards.push(s); }
  // shelf with books
  const wood = new THREE.MeshStandardMaterial({ color: 0x6a4428, roughness: 0.8 });
  const shelf = new THREE.Group(); shelf.position.set(-1.6, 0, -1.75); room.add(shelf);
  const sb = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.35), wood); sb.position.y = 1.0; shelf.add(sb);
  const books = []; const bc = [0xd8342a, 0x2a5aa8, 0x2a9a4a, 0xffd23f, 0x7a4dd8];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.24), new THREE.MeshStandardMaterial({ color: bc[(i + r) % 5] })); b.userData = { p0: V(-2.0 + i * 0.15, 0.55 + r * 0.6, -1.5), fall: 0.8 + sr() * 5.0, dir: V((sr() - 0.5) * 0.6, 0, 0.4 + sr() * 0.6), rs: V(sr() * 4, sr() * 4, sr() * 4) }; scene.add(b); books.push(b); }
  // hanging lamp
  const lampG = new THREE.Group(); lampG.position.set(0.4, 3.0, -0.3); room.add(lampG);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.8, 4), new THREE.MeshBasicMaterial({ color: 0x222222 })); cord.position.y = -0.4; lampG.add(cord);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.25, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a6a5a, side: THREE.DoubleSide })); shade.position.y = -0.9; lampG.add(shade);
  const bulbL = new THREE.PointLight(0xfff0d0, 5, 6, 1.3); bulbL.position.y = -1.0; lampG.add(bulbL);
  // sturdy table
  const table = new THREE.Group(); table.position.set(0.1, 0, 0.2); room.add(table);
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.85), wood); top.position.y = 0.76; top.castShadow = true; table.add(top);
  for (const [x, z] of [[-0.62, -0.36], [0.62, -0.36], [-0.62, 0.36], [0.62, 0.36]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.76, 0.08), wood); l.position.set(x, 0.38, z); table.add(l); }
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.1, 0.06), new THREE.MeshStandardMaterial({ color: 0x8a5a3a })); door.position.set(-2.96, 1.05, 0.9); door.rotation.y = Math.PI / 2; room.add(door);
  const fill = new THREE.PointLight(0xfff0dc, 6, 9, 1.2); fill.position.set(1.2, 2.4, 2.6); scene.add(fill);
  // hero
  const hero = makeHuman('casual', { shirt: 0x2a9d8f, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  // danger rings + labels
  const ringM = new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, toneMapped: false, depthTest: false });
  const rings = [win, sb, shade].map(() => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 8, 40), ringM); r.renderOrder = 25; scene.add(r); return r; });
  const noRun = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(256, 256, (g) => { g.strokeStyle = '#ff3b3b'; g.lineWidth = 34; g.lineCap = 'round'; g.beginPath(); g.moveTo(50, 50); g.lineTo(206, 206); g.moveTo(206, 50); g.lineTo(50, 206); g.stroke(); }), transparent: true, depthTest: false, toneMapped: false })); noRun.renderOrder = 30; scene.add(noRun);
  const words = ['DROP', 'COVER', 'HOLD ON'].map(w => { const s = textSprite(w, '#ffd23f', "400 120px Brand, sans-serif"); s.renderOrder = 31; s.material.depthTest = false; scene.add(s); return s; });
  const fx = { glass: burst(0xcfeaff, 60, 1), save: burst(0x5be37d, 60, 2) }; Object.values(fx).forEach(f => scene.add(f));
  const save = stamp('SAFE!', '#5be37d', 0.5); scene.add(save);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      const q = quakeK(t);
      room.position.set(Math.sin(t * 23) * 0.025 * q, 0, Math.sin(t * 19 + 1) * 0.02 * q); room.rotation.z = Math.sin(t * 17) * 0.006 * q;
      lampG.rotation.z = Math.sin(t * 3.2) * 0.4 * q; lampG.rotation.x = Math.sin(t * 2.7) * 0.25 * q;
      // window cracks/shatters at 5.3
      win.material.map = t > 5.4 ? brokenT : t > 4.9 ? crackT : winT;
      shards.forEach((s, i) => { const dt = t - 5.4; s.visible = dt > 0 && dt < 3.5; if (dt > 0) { s.position.set(s.userData.x, Math.max(0.03, s.userData.y - 4.9 * dt * dt * 0.5), -1.95 + s.userData.vz * dt); s.rotation.set(dt * s.userData.sp, dt * 3, 0); } });
      fx.glass.position.set(0.8, 1.7, -1.8); fx.glass.update(t - 5.4);
      books.forEach(b => { const dt = t - b.userData.fall; if (dt < 0 || q < 0.01 && dt < 0) { b.position.copy(b.userData.p0); b.position.x += Math.sin(t * 23) * 0.025 * q; b.rotation.set(0, 0, Math.sin(t * 20 + b.userData.p0.x * 9) * 0.06 * q); } else { const k = Math.min(dt, 0.9); b.position.copy(b.userData.p0).addScaledVector(b.userData.dir, k); b.position.y = Math.max(0.12, b.userData.p0.y - 4.9 * k * k); b.rotation.set(b.userData.rs.x * k, b.userData.rs.y * k, b.userData.rs.z * k); } });
      // hero path: startled (0-2.2), runs toward door (2.2-3.6), stops; 8.6 drops, crawls under table, holds leg
      const runK = smooth(range(t, 2.2, 3.6)), back = smooth(range(t, 7.6, 8.8));
      const crawl = smooth(range(t, 10.2, 11.8));
      let hp = V(0.6, 0, 1.1).lerp(V(-1.0, 0, 1.1), runK * (1 - back)).lerp(V(0.1, 0, 1.0), back);
      hp.lerp(V(0.1, 0, 0.25), crawl);
      const drop = smooth(range(t, 8.9, 9.6));
      const stand2 = smooth(range(t, 15.3, 16.2));
      hero.root.position.copy(hp); hero.root.position.y = lerp(0, 0.0, drop);
      let pose = STAND(t);
      const s5 = Math.sin(t * 9);
      if (runK > 0 && runK < 1 && back < 0.01) { pose = over(pose, { lHip: [-0.7 * s5, 0, 0.07], rHip: [0.7 * s5, 0, -0.07], lKn: [0.9 * Math.max(0, s5), 0, 0], rKn: [0.9 * Math.max(0, -s5), 0, 0], lSh: [0.8 * s5, 0, 0.15], rSh: [-0.8 * s5, 0, -0.15], spine: [0.25, 0, 0] }); }
      if (t < 2.2) pose = over(pose, { lSh: [-0.6, 0, 0.6], rSh: [-0.6, 0, -0.6], lEl: [-0.8, 0, 0], rEl: [-0.8, 0, 0], lKn: [0.25, 0, 0], rKn: [0.25, 0, 0], lHip: [-0.2, 0, 0.15], rHip: [-0.2, 0, -0.15], neck: [-0.15, 0.4 * Math.sin(t * 3), 0] });
      const onFours = drop * (1 - stand2);
      if (onFours > 0.01) {
        pose = over(pose, { lHip: [-1.5 * onFours, 0, 0.12], rHip: [-1.5 * onFours, 0, -0.12], lKn: [1.55 * onFours, 0, 0], rKn: [1.55 * onFours, 0, 0], lAn: [0.6 * onFours, 0, 0], rAn: [0.6 * onFours, 0, 0], spine: [1.35 * onFours, 0, 0], chest: [0.2 * onFours, 0, 0], neck: [-0.9 * onFours, 0, 0], lSh: [-1.5 * onFours, 0, 0.15], rSh: [-1.5 * onFours, 0, -0.15], lEl: [-0.1, 0, 0], rEl: [-0.1, 0, 0] });
        hero.root.position.y = -0.5 * onFours;
        if (crawl > 0 && crawl < 1) { pose.lHip[0] += 0.25 * s5; pose.rHip[0] -= 0.25 * s5; pose.lSh[0] += 0.3 * s5; pose.rSh[0] -= 0.3 * s5; }
      }
      hero.root.rotation.y = runK > 0.01 && back < 0.5 ? -Math.PI / 2 : lerp(0.0, Math.PI, crawl * (1 - stand2)) + 0.0;
      if (stand2 > 0.01) hero.root.position.lerp(V(0.45, 0, 1.15), stand2);
      hero.setPose(pose); hero.setMouth(t < 3.6 ? 0.6 : 0.08);
      scene.updateMatrixWorld(true);
      const hold = smooth(range(t, 12.9, 13.4)) * (1 - stand2);
      if (hold > 0.01) { const rs = hero.j.rSh.getWorldPosition(V()); const legP = table.localToWorld(V(0.62, 0.35, 0.36)); ikArm(hero, 'r', rs.clone().add(V(0, -0.4, 0.2)).lerp(legP, hold), rs.clone().add(V(0.3, -0.2, 0)), V(0, 1, 0)); }
      // no-run X
      const xk = easeOut(range(t, 2.6, 2.9)) * (1 - smooth(range(t, 4.0, 4.3)));
      noRun.position.copy(hero.j.head.getWorldPosition(V())).add(V(0, 0.4, 0.2)); noRun.scale.setScalar(0.6 * xk); noRun.visible = xk > 0.01;
      // danger rings 15.5..19.4
      const objs = [win.getWorldPosition(V()).add(V(0, 0, 0.05)), V(-1.6, 1.1, -1.5), shade.getWorldPosition(V())];
      const st = [16.4, 17.1, 18.4];
      rings.forEach((r, i) => { const k = easeOut(range(t, st[i], st[i] + 0.3)) * (1 - smooth(range(t, 19.6, 19.9))); r.position.copy(objs[i]); r.lookAt(c.position); r.scale.setScalar(Math.max(0.001, k * [1.4, 1.5, 0.7][i] * (1 + 0.08 * Math.sin(t * 8)))); r.visible = k > 0.01; });
      fx.save.position.copy(hero.j.head.getWorldPosition(V())); fx.save.update(t - 22.6);
      // ---------- camera ----------
      const KEYS = [[0, [0.6, 2.2, 7.8], [-0.2, 1.1, -0.4]], [8.4, [0.6, 2.2, 7.8], [-0.2, 1.0, -0.4]], [10.4, [1.3, 1.5, 4.6], [0.1, 0.55, 0.2]], [15.2, [1.3, 1.5, 4.6], [0.1, 0.55, 0.2]], [16.0, [-0.2, 2.2, 9.4], [-0.35, 1.35, -0.8]], [19.6, [-0.2, 2.2, 9.4], [-0.35, 1.35, -0.8]], [20.6, [0.6, 1.7, 5.6], [0.15, 1.0, 0.3]], [24.8, [0.6, 1.7, 5.6], [0.15, 1.0, 0.3]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.4 + 3.0 * q, 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const wt = [[9.09, 10.7, 19.96], [10.78, 12.8, 20.62], [12.91, 14.8, 21.24]];
      words.forEach((w, j) => { const a1 = easeOut(range(t, wt[j][0], wt[j][0] + 0.2)) * (1 - smooth(range(t, wt[j][1], wt[j][1] + 0.2))); const a2 = t > 19.8 ? easeOut(range(t, wt[j][2], wt[j][2] + 0.2)) : 0; const kk = Math.max(a1, a2); w.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, t > 19.8 ? 0.1 - j * 0.07 : 0.14).addScaledVector(rt, t > 19.8 ? -0.1 : 0); w.scale.set(0.3 * kk, 0.15 * kk, 1); w.visible = kk > 0.01; });
      save.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); save.set(t > 22.6 ? easeOut(range(t, 22.6, 22.8)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.3, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
