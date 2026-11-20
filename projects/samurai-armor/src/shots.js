import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite, sword } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp, world } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 26.6;
export const CAPTIONS = [
  [0.0, 'Could samurai armor stop a sword?'],
  [2.65, 'Samurai armor was made of'], [4.19, 'hundreds of small iron and leather plates'], [7.07, 'laced together with silk cords'],
  [9.44, 'That made it light and flexible'], [11.54, 'so a samurai could run, ride'], [13.67, 'and fight all day'],
  [15.66, 'A sword slash would mostly'], [17.34, 'just bounce off those plates'],
  [19.11, 'So instead, samurai aimed for the gaps'], [21.93, 'the neck'], [22.94, 'the armpits'], [23.75, 'and the inside of the arms', 26.4],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.09], rHip: [0, 0, -0.09], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const HIT1 = 1.2, HIT2 = 17.4;

// lamellar armour: rows of little plates on body parts; returns plates with a build order
function lamellar(h, col, cord) {
  const plateM = new THREE.MeshStandardMaterial({ color: col, roughness: 0.35, metalness: 0.3 }), cordM = new THREE.MeshStandardMaterial({ color: cord, roughness: 0.8 });
  const geo = new THREE.BoxGeometry(0.035, 0.05, 0.012);
  const plates = [];
  const ring = (joint, y, rx, rz, n, order, tilt = 0) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const p = new THREE.Mesh(geo, plateM); p.position.set(Math.sin(a) * rx, y, Math.cos(a) * rz); p.rotation.set(tilt, a, 0); h.j[joint].add(p); p.userData.o = order; plates.push(p); } const cr = new THREE.Mesh(new THREE.TorusGeometry(1, 0.006, 4, 32), cordM); cr.scale.set(rx + 0.008, rz + 0.008, 1); cr.rotation.x = Math.PI / 2; cr.position.y = y + 0.02; cr.userData.o = order; h.j[joint].add(cr); plates.push(cr); };
  let o = 0;
  for (let r = 0; r < 6; r++) ring('chest', -0.02 + r * 0.06, 0.2, 0.15, 30, o++);
  for (let r = 0; r < 2; r++) ring('spine', 0.0 + r * 0.06, 0.19, 0.14, 28, o++);
  for (const s of ['l', 'r']) for (let r = 0; r < 3; r++) ring(s + 'Hip', -0.02 - r * 0.06, 0.12, 0.11, 18, o + r, 0.12);
  o += 3;
  for (const s of ['l', 'r']) for (let r = 0; r < 3; r++) ring(s + 'Sh', -0.02 - r * 0.055, 0.085, 0.085, 14, o + r, -0.1);
  o += 3;
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), plateM); helm.position.y = 0.15; h.j.head.add(helm); helm.userData.o = o;
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.03, 20), plateM); brim.position.y = 0.13; h.j.head.add(brim); brim.userData.o = o;
  const crest = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0xffd23f, metalness: 0.8, roughness: 0.2 })); crest.position.set(0, 0.32, 0.08); h.j.head.add(crest); crest.userData.o = o;
  helm.userData.keep = brim.userData.keep = crest.userData.keep = false; plates.push(helm, brim, crest);
  return { plates, max: o };
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 7, sunDir: [-4, 8, 5], sun: 2.4 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x4a7ac8); u.mid.value.set(0xa8c4e8); u.horizon.value.set(0xffe4e8); u.floorC.value.set(0xc8b48a);
  scene.fog = new THREE.Fog(0xf0e0e4, 30, 110);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.9;
  scene.add(world(['#c8b48a', ['180,160,120', '200,180,140', '170,150,110']]));
  // courtyard: raked gravel, wooden veranda, shoji wall, torii, cherry trees
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a3a24, roughness: 0.8 });
  const ver = new THREE.Mesh(new THREE.BoxGeometry(12, 0.4, 2.2), wood); ver.position.set(0, 0.2, -4.2); scene.add(ver);
  const shojiT = canvasTex(256, 256, (g) => { g.fillStyle = '#f4ecd8'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#4a3220'; g.lineWidth = 8; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); } });
  shojiT.wrapS = THREE.RepeatWrapping; shojiT.repeat.set(5, 1);
  const shoji = new THREE.Mesh(new THREE.PlaneGeometry(12, 2.6), new THREE.MeshStandardMaterial({ map: shojiT, roughness: 0.9 })); shoji.position.set(0, 1.7, -5.2); scene.add(shoji);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(13, 0.25, 3.2), new THREE.MeshStandardMaterial({ color: 0x3a3a44 })); roof.position.set(0, 3.15, -4.4); roof.rotation.x = 0.18; scene.add(roof);
  const red = new THREE.MeshStandardMaterial({ color: 0xd8342a, roughness: 0.5 });
  const torii = new THREE.Group(); torii.position.set(3.6, 0, -2.4); scene.add(torii);
  for (const x of [-1.1, 1.1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.2, 12), red); p.position.set(x, 1.6, 0); torii.add(p); }
  const k1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 0.25), red); k1.position.y = 3.25; torii.add(k1); const k2 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 0.18), red); k2.position.y = 2.7; torii.add(k2);
  const blossom = (x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.6, 8), wood); tr.position.y = 1.3; tr.rotation.z = 0.12; g.add(tr); const r = rng(x * 10 | 0); for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 + r() * 0.3, 1), new THREE.MeshStandardMaterial({ color: [0xffb7c8, 0xffc8d8, 0xffa8c0][i % 3], flatShading: true })); b.position.set((r() - 0.5) * 1.8, 2.7 + r() * 0.8, (r() - 0.5) * 1.2); g.add(b); } };
  blossom(-3.6, -2.6); blossom(5.8, -3.2);
  const petals = []; const pr = rng(4); for (let i = 0; i < 50; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.04), new THREE.MeshStandardMaterial({ color: 0xffb7c8, side: THREE.DoubleSide })); p.userData = { x: (pr() - 0.5) * 8, z: -3 + pr() * 4, ph: pr() }; scene.add(p); petals.push(p); }
  // hero samurai + opponent
  const hero = makeHuman('casual', { shirt: 0x1d3557, jeans: 0x1d3557, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const arm = lamellar(hero, 0xb3261e, 0x2a5aa8);
  const foe = makeHuman('casual', { shirt: 0x2a2a2e, jeans: 0x2a2a2e, hair: 0x1a1a1a }); scene.add(foe.root);
  lamellar(foe, 0x2a2a30, 0x8a6a2a).plates.forEach(p => p.visible = true);
  const kat = sword(); scene.add(kat); const katH = sword(); scene.add(katH);
  // lamellar bubble
  const zc = document.createElement('canvas'); zc.width = zc.height = 512; const zg = zc.getContext('2d'); const zt = new THREE.CanvasTexture(zc); zt.colorSpace = THREE.SRGBColorSpace;
  const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); bub.renderOrder = 30; scene.add(bub);
  const drawL = (n, lace, tt) => { zg.clearRect(0, 0, 512, 512); zg.save(); zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.clip(); zg.fillStyle = '#2a2420'; zg.fillRect(0, 0, 512, 512);
    let k = 0; for (let r = 0; r < 7; r++) for (let c = 0; c < 12; c++) { if (k++ > n * 84) break; const x = 20 + c * 40 + (r % 2) * 20, y = 40 + r * 64; zg.fillStyle = (r + c) % 3 === 0 ? '#8a6a4a' : '#b3261e'; zg.beginPath(); zg.roundRect(x, y, 34, 58, 6); zg.fill(); zg.fillStyle = 'rgba(255,255,255,0.25)'; zg.fillRect(x + 4, y + 4, 6, 50); zg.fillStyle = '#1a1410'; zg.beginPath(); zg.arc(x + 17, y + 14, 3, 0, 7); zg.arc(x + 17, y + 44, 3, 0, 7); zg.fill(); }
    if (lace > 0) { zg.strokeStyle = '#3a7ad8'; zg.lineWidth = 6; for (let r = 0; r < 7; r++) { const y = 54 + r * 64; zg.beginPath(); zg.moveTo(0, y); zg.lineTo(512 * lace, y); zg.stroke(); const y2 = y + 30; zg.beginPath(); zg.moveTo(0, y2); zg.lineTo(512 * lace, y2); zg.stroke(); } }
    zg.restore(); zg.strokeStyle = 'rgba(255,255,255,0.95)'; zg.lineWidth = 12; zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.stroke(); zt.needsUpdate = true; };
  const rings = ['NECK', 'ARMPITS', 'INNER ARMS'].map(() => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.01, 8, 28), new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, toneMapped: false, depthTest: false })); r.renderOrder = 25; scene.add(r); return r; });
  const rings2 = [0, 1].map(() => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.01, 8, 28), rings[0].material); r.renderOrder = 25; scene.add(r); return r; });
  const clang = textSprite('CLANG!', '#ffd23f', "400 130px Brand, sans-serif"); scene.add(clang);
  const fx = { h1: burst(0xffe08a, 50, 1), h2: burst(0xffe08a, 70, 2) }; Object.values(fx).forEach(f => scene.add(f));
  const c = cam(38);
  const setSword = (sw, h, extra) => { const wr = h.j.rWr.getWorldPosition(V()), el = h.j.rEl.getWorldPosition(V()); const dir = wr.clone().sub(el).normalize().add(extra).normalize(); sw.position.copy(wr).addScaledVector(dir, 0.06); sw.quaternion.setFromUnitVectors(V(0, 1, 0), dir); };

  return {
    scene, camera: c,
    update(t) {
      // build plates progressively during 3.5..7.2 (full at hook too)
      const build = t < 2.6 ? 1 : smooth(range(t, 3.4, 7.2));
      arm.plates.forEach(p => { const k = clamp(build * (arm.max + 1) - p.userData.o, 0, 1); p.visible = k > 0.02; if (p.geometry.type !== 'TorusGeometry' && !p.userData.keep) p.scale.setScalar(Math.max(0.001, k)); });
      arm.plates.forEach(p => { if (p.geometry.type === 'TorusGeometry' && p.userData.o >= 0) p.visible = build > 0.02 && clamp(build * (arm.max + 1) - p.userData.o, 0, 1) > 0.5; });
      // hero motion
      const run = smooth(range(t, 11.5, 12.0)) * (1 - smooth(range(t, 13.3, 13.6)));
      const fight = smooth(range(t, 13.6, 14.0)) * (1 - smooth(range(t, 15.4, 15.8)));
      const showGaps = smooth(range(t, 22.7, 23.2));
      hero.root.position.set(-0.35 + (run ? Math.sin(t * 3) * 0.0 : 0), Math.abs(Math.sin(t * 9)) * 0.06 * run, 0.1); hero.root.rotation.y = 0.55 + run * Math.sin(t * 2) * 0.6;
      let pose = STAND(t);
      if (run > 0.01) { const s = Math.sin(t * 9); pose = over(pose, { lHip: [-0.7 * s * run, 0, 0.09], rHip: [0.7 * s * run, 0, -0.09], lKn: [0.9 * Math.max(0, Math.sin(t * 9 + 1.2)) * run, 0, 0], rKn: [0.9 * Math.max(0, -Math.sin(t * 9 + 1.2)) * run, 0, 0], lSh: [0.7 * s * run, 0, 0.16], rSh: [-0.7 * s * run, 0, -0.16], lEl: [-1.3 * run, 0, 0], rEl: [-1.3 * run, 0, 0] }); }
      if (fight > 0.01) { const s = Math.sin(t * 6); pose = over(pose, { rSh: [-1.6 + 1.2 * s, 0, -0.3], rEl: [-0.4, 0, 0], lSh: [-0.8, 0, 0.3], lEl: [-1.2, 0, 0], lHip: [-0.4, 0, 0.2], rHip: [0.2, 0, -0.2], lKn: [0.4, 0, 0], spine: [0.1, 0.3 * s, 0] }); }
      if (showGaps > 0.01) pose = over(pose, { lSh: [-0.2, 0, lerp(0.16, 1.6, showGaps)], rSh: [-0.2, 0, lerp(-0.16, -1.6, showGaps)], lEl: [-0.1, 0, 0], rEl: [-0.1, 0, 0], neck: [-0.2 * showGaps, 0, 0] });
      hero.setPose(pose); hero.setMouth(0.06);
      // foe slashes at HIT1 and HIT2
      const foeOn = t < 2.6 || (t > 15.4 && t < 19.4);
      foe.root.position.set(0.75, 0, -0.55); foe.root.rotation.y = -2.2; foe.root.visible = foeOn || t < 3.0;
      const sl = (h) => { const u2 = range(t, h - 0.45, h + 0.3); return u2 <= 0 || u2 >= 1 ? 0 : u2; };
      const s1 = Math.max(sl(HIT1), sl(HIT2));
      const wind = s1 > 0 ? (s1 < 0.6 ? -s1 / 0.6 : -1 + (s1 - 0.6) / 0.4 * 2.2) : 0;
      const rebound = (t > HIT2 && t < HIT2 + 0.6) ? Math.sin((t - HIT2) / 0.6 * Math.PI) : 0;
      foe.setPose(over(STAND(t, 2), { rSh: [-2.6 - 0.4 * wind + 1.4 * Math.max(0, wind) - 1.2 * rebound, 0, -0.3], rEl: [-0.3, 0, 0], lSh: [-1.0, 0, 0.2], lEl: [-1.2, 0, 0], lHip: [-0.4, 0, 0.12], rHip: [0.2, 0, -0.12], lKn: [0.35, 0, 0], spine: [0.1 * Math.max(0, wind), 0, 0] }));
      foe.setMouth(0.05);
      scene.updateMatrixWorld(true);
      setSword(kat, foe, V(0, 0.2, 0)); kat.visible = foe.root.visible;
      setSword(katH, hero, V(0, 0.3, 0)); katH.visible = fight > 0.05;
      const chest = hero.j.chest.localToWorld(V(0, 0.15, 0.17));
      fx.h1.position.copy(chest); fx.h1.update(t - HIT1); fx.h2.position.copy(chest); fx.h2.update(t - HIT2);
      const ck = easeOut(range(t, HIT2, HIT2 + 0.15)) * (1 - smooth(range(t, HIT2 + 1.0, HIT2 + 1.3)));
      clang.position.copy(chest).add(V(0.35, 0.4, 0.2)); clang.scale.set(0.55 * ck, 0.27 * ck, 1); clang.visible = ck > 0.01;
      // gap rings
      const neck = hero.j.neck.getWorldPosition(V()).add(V(0, 0.04, 0.06));
      const lA = hero.j.lSh.localToWorld(V(0.0, -0.1, 0)), rA = hero.j.rSh.localToWorld(V(0.0, -0.1, 0)), lI = hero.j.lEl.localToWorld(V(0, -0.05, 0)), rI = hero.j.rEl.localToWorld(V(0, -0.05, 0));
      const rk = [easeOut(range(t, 22.2, 22.5)), easeOut(range(t, 23.0, 23.3)), easeOut(range(t, 24.0, 24.3))];
      const posA = [neck, lA, lI], posB = [null, rA, rI];
      rings.forEach((r, i) => { r.position.copy(posA[i]); r.lookAt(c.position); const s = rk[i] * (1 + 0.15 * Math.sin(t * 8)); r.scale.setScalar(Math.max(0.001, s)); r.visible = rk[i] > 0.01; });
      rings2.forEach((r, i) => { r.position.copy(posB[i + 1]); r.lookAt(c.position); const s = rk[i + 1] * (1 + 0.15 * Math.sin(t * 8)); r.scale.setScalar(Math.max(0.001, s)); r.visible = rk[i + 1] > 0.01; });
      petals.forEach((p, i) => { const u2 = (t * 0.12 + p.userData.ph) % 1; p.position.set(p.userData.x + Math.sin(t + i) * 0.4, 3.5 - u2 * 3.5, p.userData.z); p.rotation.set(t * 2 + i, t + i, 0); });
      // ---------- camera ----------
      const KEYS = [[0, [1.6, 1.5, 4.2], [0.15, 1.0, -0.2]], [2.6, [0.6, 1.5, 3.6], [-0.3, 1.05, 0.0]], [15.4, [0.6, 1.5, 3.6], [-0.3, 1.05, 0.0]], [16.2, [1.5, 1.5, 4.0], [0.15, 1.05, -0.2]], [19.2, [1.5, 1.5, 4.0], [0.15, 1.05, -0.2]], [20.0, [0.3, 1.5, 3.4], [-0.35, 1.1, 0.0]], [26.6, [0.3, 1.5, 3.3], [-0.35, 1.1, 0.0]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.4 + (Math.abs(t - HIT1) < 0.25 || Math.abs(t - HIT2) < 0.25 ? 2.5 : 0), 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const bk = easeOut(range(t, 4.0, 4.4)) * (1 - smooth(range(t, 9.2, 9.6)));
      if (bk > 0.01) drawL(smooth(range(t, 4.2, 6.6)), smooth(range(t, 7.1, 8.6)), t);
      bub.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.05).addScaledVector(rt, 0.15); bub.scale.setScalar(0.36 * bk); bub.visible = bk > 0.01;
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.35, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
