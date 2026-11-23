import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 26.2;
export const CAPTIONS = [
  [0.0, 'What happens to your body on Everest?'],
  [2.6, 'At the top, each breath holds'], [4.57, 'only a third of the oxygen'], [6.23, 'you get at sea level'],
  [7.88, 'Your heart pounds'], [9.03, 'your head throbs'], [10.33, 'and even a few steps leave you gasping'],
  [13.08, 'Your brain and lungs can start'], [14.67, 'to swell with fluid'], [16.32, 'and frostbite can freeze your fingers'], [18.28, 'in minutes'],
  [19.54, "That's why climbers call it"], [21.11, 'the death zone'], [22.32, 'and most of them carry bottled oxygen to survive', 26.0],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [0, 0, 0], neck: [0.03, 0, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 8, sunDir: [5, 6, 4], sun: 3.0 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x0a2a6a); u.mid.value.set(0x3a6ab8); u.horizon.value.set(0xc8dcf0); u.floorC.value.set(0xeef4fa);
  scene.fog = new THREE.Fog(0xd8e6f4, 40, 200);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.9;
  scene.children.filter(o => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry' && !o.material.isShadowMaterial).forEach(o => o.visible = false);
  // summit ridge
  const snowM = new THREE.MeshStandardMaterial({ color: 0xf4f8fc, roughness: 0.85, flatShading: true }), rockM = new THREE.MeshStandardMaterial({ color: 0x5a5a64, roughness: 0.95, flatShading: true });
  const ridgeG = new THREE.ConeGeometry(6, 5, 7, 3); const rp = ridgeG.attributes.position, r9 = rng(4); for (let i = 0; i < rp.count; i++) { if (rp.getY(i) < 2.4) { rp.setX(i, rp.getX(i) * (0.9 + r9() * 0.25)); rp.setZ(i, rp.getZ(i) * (0.9 + r9() * 0.25)); } } ridgeG.computeVertexNormals();
  const summit = new THREE.Mesh(ridgeG, snowM); summit.position.set(0, -2.5, -0.8); scene.add(summit);
  for (let i = 0; i < 8; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + r9() * 0.4), rockM); r.position.set((r9() - 0.5) * 3.5, -0.5 + r9() * 0.3, -0.5 - r9() * 1.5); scene.add(r); }
  // far peaks below + clouds
  for (let i = 0; i < 9; i++) { const h = 10 + r9() * 12; const m = new THREE.Mesh(new THREE.ConeGeometry(8 + r9() * 6, h, 6), new THREE.MeshStandardMaterial({ color: 0xe8eef6, flatShading: true })); m.position.set(-60 + i * 15, -20 + h / 2 - 6, -50 - r9() * 30); scene.add(m); }
  const cloudM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 26; i++) { const cl = new THREE.Mesh(new THREE.SphereGeometry(3 + r9() * 4, 12, 8), cloudM); cl.scale.y = 0.35; cl.position.set(-60 + r9() * 120, -14 + r9() * 3, -20 - r9() * 50); scene.add(cl); }
  // prayer flags
  const flags = []; const fcols = [0x2a5aa8, 0xffffff, 0xd8342a, 0x2a9a4a, 0xffd23f];
  for (let i = 0; i < 12; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.16), new THREE.MeshStandardMaterial({ color: fcols[i % 5], side: THREE.DoubleSide })); f.position.set(-1.6 + i * 0.28, 0.9 - Math.sin(i / 11 * Math.PI) * 0.35, -1.0); scene.add(f); flags.push(f); }
  const line = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 3.4, 4), new THREE.MeshBasicMaterial({ color: 0x3a3a3a })); line.rotation.z = Math.PI / 2; line.position.set(-0.05, 0.85, -1.0); scene.add(line);
  // hero climber (red suit) + oxygen bottle
  const hero = makeHuman('casual', { shirt: 0xd8342a, jeans: 0xd8342a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), new THREE.MeshStandardMaterial({ color: 0xb82a22 })); hood.position.y = 0.15; hero.j.head.add(hood);
  const gog = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.05), new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.6, roughness: 0.2 })); gog.position.set(0, 0.235, 0.09); gog.rotation.x = -0.5; hero.j.head.add(gog);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.18), new THREE.MeshStandardMaterial({ color: 0x2a3a5a })); pack.position.set(0, 0.1, -0.2); hero.j.chest.add(pack);
  const bottle = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.3, 6, 12), new THREE.MeshStandardMaterial({ color: 0xff8a1a, metalness: 0.5, roughness: 0.3 })); bottle.position.set(0.12, 0.25, -0.25); hero.j.chest.add(bottle);
  const omask = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshStandardMaterial({ color: 0x2a2a30 })); omask.scale.set(1, 0.9, 0.7); omask.position.set(0, 0.03, 0.12); hero.j.head.add(omask);
  const ice = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.75, 6), new THREE.MeshStandardMaterial({ color: 0xc8ccd4, metalness: 0.7 })); scene.add(ice);
  // effects
  const O2 = []; for (let i = 0; i < 30; i++) { const s = glowSprite(0x7fd4ff, 0.08); s.userData.ph = i / 30; scene.add(s); O2.push(s); }
  const heartT = canvasTex(128, 128, (g) => { g.fillStyle = '#ff3b5c'; g.beginPath(); g.moveTo(64, 112); g.bezierCurveTo(10, 70, 10, 20, 40, 20); g.bezierCurveTo(56, 20, 64, 34, 64, 40); g.bezierCurveTo(64, 34, 72, 20, 88, 20); g.bezierCurveTo(118, 20, 118, 70, 64, 112); g.fill(); });
  const heart = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartT, transparent: true, depthTest: false, toneMapped: false })); heart.renderOrder = 30; scene.add(heart);
  const ache = []; for (let i = 0; i < 6; i++) { const s = glowSprite(0xff5a3a, 0.12); scene.add(s); ache.push(s); }
  const frost = []; for (let i = 0; i < 8; i++) { const s = glowSprite(0x9fe0ff, 0.12); scene.add(s); frost.push(s); }
  const NS = 260, sp = new Float32Array(NS * 3), sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const blow = new THREE.Points(sgeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.03, transparent: true, opacity: 0.8 })); blow.frustumCulled = false; scene.add(blow); const SB = []; for (let i = 0; i < NS; i++) SB.push([r9() * 8 - 4, r9() * 3, r9() * 4 - 2, r9()]);
  // lungs/brain swell bubble
  const zc = document.createElement('canvas'); zc.width = zc.height = 512; const zg = zc.getContext('2d'); const zt = new THREE.CanvasTexture(zc); zt.colorSpace = THREE.SRGBColorSpace;
  const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); bub.renderOrder = 30; scene.add(bub);
  const drawO = (k, mode, sw, tt) => { zg.clearRect(0, 0, 512, 512); zg.save(); zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.clip(); zg.fillStyle = '#0e1a30'; zg.fillRect(0, 0, 512, 512);
    if (mode === 0) { // oxygen jars: sea level vs summit
      const jar = (x, fill, lab) => { zg.strokeStyle = '#fff'; zg.lineWidth = 8; zg.strokeRect(x - 60, 150, 120, 220); zg.fillStyle = '#7fd4ff'; const h = 216 * fill; zg.fillRect(x - 56, 368 - h, 112, h); for (let i = 0; i < Math.round(fill * 12); i++) { zg.fillStyle = '#fff'; zg.beginPath(); zg.arc(x - 30 + (i % 3) * 30, 350 - Math.floor(i / 3) * 40, 8, 0, 7); zg.fill(); } zg.font = "400 38px Brand, sans-serif"; zg.textAlign = 'center'; zg.fillStyle = '#fff'; zg.fillText(lab, x, 420); };
      jar(150, 1, 'SEA'); jar(360, lerp(1, 0.33, k), 'TOP');
    } else { // lungs + brain swelling
      zg.fillStyle = '#ffadc4'; zg.beginPath(); zg.ellipse(256, 150, 120 * (1 + 0.12 * sw), 80 * (1 + 0.12 * sw), 0, 0, 7); zg.fill();
      for (const s of [-1, 1]) { zg.fillStyle = '#ff8fab'; zg.beginPath(); zg.ellipse(256 + s * 85, 340, 70 * (1 + 0.15 * sw), 110 * (1 + 0.1 * sw), s * 0.12, 0, 7); zg.fill(); }
      if (sw > 0.05) { zg.fillStyle = `rgba(90,170,255,${0.55 * sw})`; for (let i = 0; i < 14; i++) { zg.beginPath(); zg.arc(170 + (i % 7) * 30, 300 + Math.floor(i / 7) * 80 + Math.sin(tt * 3 + i) * 5, 12, 0, 7); zg.fill(); } zg.beginPath(); zg.ellipse(256, 150, 130 * (1 + 0.12 * sw), 90 * (1 + 0.12 * sw), 0, 0, 7); zg.strokeStyle = `rgba(90,170,255,${0.8 * sw})`; zg.lineWidth = 10; zg.stroke(); }
    }
    zg.restore(); zg.strokeStyle = 'rgba(255,255,255,0.95)'; zg.lineWidth = 12; zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.stroke(); zt.needsUpdate = true; };
  const ctr = textSprite('1/3', '#7fd4ff', "400 160px Brand, sans-serif"); ctr.renderOrder = 31; ctr.material.depthTest = false; scene.add(ctr);
  const zone = stamp('DEATH ZONE', '#ff3b3b', 0.62); scene.add(zone);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      flags.forEach((f, i) => { f.rotation.x = Math.sin(t * 6 + i) * 0.4; f.rotation.y = Math.sin(t * 4 + i * 0.7) * 0.3; });
      for (let i = 0; i < NS; i++) { const b = SB[i]; const u2 = (t * 0.7 + b[3]) % 1; sp[i * 3] = -4 + u2 * 8; sp[i * 3 + 1] = b[1] + Math.sin(t + i) * 0.2; sp[i * 3 + 2] = b[2]; } sgeo.attributes.position.needsUpdate = true;
      // hero: arrives at summit (hook), struggles, frost hands, puts on oxygen mask at 22.3
      const step = t > 10.6 && t < 12.6;
      hero.root.position.set(lerp(-0.6, 0.15, smooth(range(t, 0, 2.2))) + (step ? (t - 10.6) * 0.12 : t > 12.6 ? 0.24 : 0), -0.02, 0.4); hero.root.rotation.y = 0.35;
      const gasp = smooth(range(t, 11.0, 11.6)) * (1 - smooth(range(t, 13.0, 13.6)));
      const handsUp = smooth(range(t, 16.4, 17.0)) * (1 - smooth(range(t, 19.0, 19.5)));
      const head = smooth(range(t, 9.0, 9.4)) * (1 - smooth(range(t, 10.4, 10.8)));
      const oxy = smooth(range(t, 22.4, 23.2));
      let pose = STAND(t);
      if (t < 2.2 || step) { const s = Math.sin(t * 5); pose = over(pose, { lHip: [-0.5 * s, 0, 0.07], rHip: [0.5 * s, 0, -0.07], lKn: [0.6 * Math.max(0, s), 0, 0], rKn: [0.6 * Math.max(0, -s), 0, 0], spine: [0.3, 0, 0] }); }
      if (gasp > 0.01) pose = over(pose, { spine: [0.6 * gasp, 0, 0], lHip: [-0.4 * gasp, 0, 0.1], rHip: [-0.4 * gasp, 0, -0.1], lKn: [0.6 * gasp, 0, 0], rKn: [0.6 * gasp, 0, 0], chest: [0.1 * Math.sin(t * 10) * gasp, 0, 0] });
      if (handsUp > 0.01) pose = over(pose, { lSh: [-1.4 * handsUp, 0, 0.3], rSh: [-1.4 * handsUp, 0, -0.3], lEl: [-1.0 * handsUp, 0, 0], rEl: [-1.0 * handsUp, 0, 0], neck: [0.3 * handsUp, 0, 0] });
      hero.root.position.y -= 0.12 * gasp;
      hero.setPose(pose); hero.setMouth(gasp > 0.3 ? 0.6 + 0.3 * Math.sin(t * 10) : 0.15);
      omask.visible = oxy > 0.5;
      scene.updateMatrixWorld(true);
      const hd = hero.j.head.getWorldPosition(V()), ch = hero.j.chest.localToWorld(V(0.06, 0.12, 0.2));
      if (head > 0.01) { const ls = hero.j.lSh.getWorldPosition(V()); ikArm(hero, 'l', ls.clone().add(V(0, -0.5, 0.05)).lerp(hd.clone().add(V(0.1, 0.08, 0.06)), head), ls.clone().add(V(0.3, -0.3, 0.2)), V(0, 0, 1)); }
      if (oxy > 0.01 && oxy < 0.99) { const rs = hero.j.rSh.getWorldPosition(V()); const k = Math.sin(oxy * Math.PI); ikArm(hero, 'r', rs.clone().add(V(0, -0.5, 0.05)).lerp(hd.clone().add(V(0.02, -0.04, 0.15)), k), rs.clone().add(V(0.3, -0.3, 0.2)), V(0, 0, 1)); }
      scene.updateMatrixWorld(true);
      const rh = hero.j.rWr.localToWorld(V(0, -0.06, 0)); ice.position.copy(rh).add(V(0, 0.1, 0)); ice.visible = t < 16.2 && head < 0.5 && !(oxy > 0.01 && oxy < 0.99);
      // oxygen breath particles: thin early, plenty after mask
      O2.forEach((s, i) => { const u2 = (t * 0.9 + s.userData.ph) % 1; const ang = s.userData.ph * 20; const mouth = hd.clone().add(V(0, -0.05, 0.15)); s.position.copy(mouth).add(V(Math.cos(ang) * (1 - u2) * 0.8, Math.sin(ang) * (1 - u2) * 0.5, (1 - u2) * 0.6)); const dens = t > 22.8 ? 1 : (t > 2.6 && t < 7.8 ? (i % 3 === 0 ? 1 : 0) : 0); s.material.opacity = dens * u2 * 0.9; s.visible = dens > 0; });
      const hk = smooth(range(t, 7.9, 8.3)) * (1 - smooth(range(t, 12.8, 13.2)));
      heart.position.copy(ch); heart.scale.setScalar(0.14 * hk * (1 + 0.3 * Math.max(0, Math.sin(t * 16)))); heart.visible = hk > 0.01;
      ache.forEach((s, i) => { const a = i / 6 * 6.28 + t * 3; s.position.copy(hd).add(V(Math.cos(a) * 0.2, 0.15 + Math.sin(t * 9 + i) * 0.03, Math.sin(a) * 0.2)); s.visible = head > 0.3; });
      const fk = smooth(range(t, 16.6, 17.4)) * (1 - smooth(range(t, 19.4, 19.8)));
      const lh = hero.j.lWr.getWorldPosition(V()), rhh = hero.j.rWr.getWorldPosition(V());
      frost.forEach((s, i) => { const b = i < 4 ? lh : rhh; s.position.copy(b).add(V(Math.cos(i * 1.7) * 0.07, Math.sin(i * 2.3) * 0.07, 0.03)); s.material.opacity = fk * (0.6 + 0.4 * Math.sin(t * 6 + i)); s.visible = fk > 0.01; });
      ['lWr', 'rWr', 'lEl', 'rEl'].forEach(k => hero.j[k].children.forEach(o => { if (o.isMesh && o.material && o.material.color) { if (!o.userData.c0) o.userData.c0 = o.material.color.clone(); } }));
      // ---------- camera ----------
      const KEYS = [[0, [4.2, 2.6, 8.0], [0.0, 0.6, -0.5]], [2.4, [1.5, 1.4, 3.8], [0.1, 0.8, 0.2]], [12.8, [1.4, 1.4, 3.6], [0.2, 0.75, 0.2]], [19.4, [1.4, 1.4, 3.6], [0.2, 0.8, 0.2]], [20.8, [3.2, 2.4, 6.8], [0.0, 0.6, -0.4]], [22.2, [1.4, 1.4, 3.6], [0.2, 0.85, 0.2]], [26.2, [1.6, 1.5, 4.0], [0.2, 0.85, 0.2]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.7 + gasp * 1.2 + hk * 0.5, 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const bk = Math.max(easeOut(range(t, 3.4, 3.8)) * (1 - smooth(range(t, 7.6, 8.0))), easeOut(range(t, 13.1, 13.5)) * (1 - smooth(range(t, 16.2, 16.6))));
      if (bk > 0.01) drawO(easeOut(range(t, 4.6, 5.6)), t < 10 ? 0 : 1, smooth(range(t, 14.6, 15.8)), t);
      bub.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.05).addScaledVector(rt, 0.15); bub.scale.setScalar(0.34 * bk); bub.visible = bk > 0.01;
      const ck = easeOut(range(t, 4.9, 5.2)) * (1 - smooth(range(t, 7.6, 8.0)));
      ctr.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.14).addScaledVector(rt, 0.15); ctr.scale.set(0.24 * ck, 0.12 * ck, 1); ctr.visible = ck > 0.01;
      zone.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); zone.set(t > 21.1 && t < 22.6 ? easeOut(range(t, 21.1, 21.3)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.35, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
