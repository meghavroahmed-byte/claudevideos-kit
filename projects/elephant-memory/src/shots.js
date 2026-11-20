import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp, world, tree } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 22.8;
export const CAPTIONS = [
  [0.0, 'Do elephants really never forget?'],
  [2.31, 'Pretty much!'], [3.45, 'Elephants have the biggest brain'], [5.07, 'of any land animal'],
  [6.77, 'The matriarch, the oldest female'], [9.16, 'remembers where to find water'], [10.8, 'even decades later'], [12.24, 'and leads her family there'], [13.74, 'during a drought'],
  [15.02, 'They recognize old friends'], [16.49, 'after years apart'], [17.99, 'and they even remember people'], [19.44, 'who were kind, or cruel, to them', 22.6],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function makeElephant(s = 1, col = 0x8a8a92) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body); const m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.95 });
  body.position.y = 1.5;
  const torso = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), m); torso.scale.set(0.95, 0.85, 1.4); body.add(torso);
  const head = new THREE.Group(); head.position.set(0, 0.45, 1.35); body.add(head);
  const hm = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 16), m); hm.scale.set(0.9, 1, 0.85); head.add(hm);
  for (const sx of [-1, 1]) { const ear = new THREE.Mesh(new THREE.CircleGeometry(0.7, 20), new THREE.MeshStandardMaterial({ color: col, roughness: 0.95, side: THREE.DoubleSide })); ear.scale.set(0.8, 1.05, 1); ear.position.set(sx * 0.55, 0.05, -0.15); ear.rotation.y = sx * 1.2; head.add(ear); ear.userData.s = sx; const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshStandardMaterial({ color: 0x111111 })); eye.position.set(sx * 0.33, 0.12, 0.42); head.add(eye); const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.6, 10), new THREE.MeshStandardMaterial({ color: 0xf4ecd8 })); tusk.position.set(sx * 0.22, -0.45, 0.5); tusk.rotation.set(-2.3, 0, sx * 0.15); head.add(tusk); }
  const trunk = []; let parent = head; for (let k = 0; k < 10; k++) { const seg = new THREE.Group(); seg.position.set(0, k === 0 ? -0.3 : -0.17, k === 0 ? 0.42 : 0); parent.add(seg); const r = 0.17 - k * 0.011; const mm = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.19, 12), m); mm.position.y = -0.085; seg.add(mm); trunk.push(seg); parent = seg; }
  const legs = []; for (const [x, z] of [[0.5, 0.8], [-0.5, 0.8], [0.5, -0.8], [-0.5, -0.8]]) { const lg = new THREE.Group(); lg.position.set(x, -0.4, z); body.add(lg); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 1.2, 14), m); l.position.y = -0.55; lg.add(l); legs.push(lg); }
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.8, 6), m); tail.position.set(0, 0.2, -1.4); tail.rotation.x = 0.4; body.add(tail);
  g.scale.setScalar(s); g.userData = { body, head, trunk, legs };
  g.walk = (ph, amp) => { legs.forEach((lg, i) => lg.rotation.x = Math.sin(ph + (i === 0 || i === 3 ? 0 : Math.PI)) * amp); body.position.y = 1.5 + Math.abs(Math.sin(ph)) * amp * 0.08; };
  g.trunkPose = (curl, sway, t) => trunk.forEach((sg, k) => { sg.rotation.x = curl * (k / 10) * 0.6 + 0.05; sg.rotation.z = Math.sin(t * 1.2 + k * 0.4) * sway; });
  return g;
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 14, sunDir: [-5, 7, 4], sun: 2.6 });
  const U = scene.userData.sky.material.uniforms; U.top.value.set(0x3a8ae0); U.mid.value.set(0x9ac8f0); U.horizon.value.set(0xffd8a0); U.floorC.value.set(0xc8a868);
  scene.fog = new THREE.Fog(0xf4dcb0, 30, 140);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.9;
  // dry savanna: cracked earth texture swapped on the ground
  const crackT = canvasTex(512, 512, (g) => { g.fillStyle = '#c8a066'; g.fillRect(0, 0, 512, 512); g.strokeStyle = 'rgba(90,60,30,0.6)'; g.lineWidth = 3; const r = rng(2); for (let i = 0; i < 60; i++) { let x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 80; y += (r() - 0.5) * 80; g.lineTo(x, y); } g.stroke(); } });
  crackT.wrapS = crackT.wrapT = THREE.RepeatWrapping; crackT.repeat.set(30, 30);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ map: crackT, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  scene.children.filter(o => o.isMesh && o !== ground && o.geometry && o.geometry.type === 'PlaneGeometry' && !o.material.isShadowMaterial).forEach(o => o.visible = false);
  const acacia = (x, z, s) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 3, 8), new THREE.MeshStandardMaterial({ color: 0x5a3a22 })); tr.position.y = 1.5; tr.rotation.z = 0.1; g.add(tr); const top = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 1.6, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0x6a8a3a, flatShading: true })); top.position.y = 3.2; g.add(top); };
  acacia(-7, -10, 1.2); acacia(9, -14, 1.4); acacia(-14, -20, 1.1); acacia(4, 8, 1.0);
  // waterhole (appears)
  const pond = new THREE.Mesh(new THREE.CircleGeometry(3.2, 40), new THREE.MeshStandardMaterial({ color: 0x3a8ab8, roughness: 0.1, metalness: 0.2 })); pond.rotation.x = -Math.PI / 2; pond.position.set(6, 0.02, -8); pond.scale.set(1.4, 1, 1); scene.add(pond);
  // elephants
  const mat = makeElephant(1.0, 0x86868e); scene.add(mat);
  const fam = [makeElephant(0.75, 0x8e8e96), makeElephant(0.55, 0x929298), makeElephant(0.42, 0x9a9aa0)]; fam.forEach(f => scene.add(f));
  // hero ranger
  const hero = makeHuman('casual', { shirt: 0xb8a060, jeans: 0x5a5a3a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.03, 20), new THREE.MeshStandardMaterial({ color: 0xa88a50 })); hat.position.y = 0.19; hero.j.head.add(hat); const hatT = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.12, 16), hat.material); hatT.position.y = 0.25; hero.j.head.add(hatT);
  // brain compare bubble + memory map
  const zc = document.createElement('canvas'); zc.width = zc.height = 512; const zg = zc.getContext('2d'); const zt = new THREE.CanvasTexture(zc); zt.colorSpace = THREE.SRGBColorSpace;
  const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); bub.renderOrder = 30; scene.add(bub);
  const brain = (x, y, s) => { zg.fillStyle = '#ffadc4'; zg.beginPath(); zg.ellipse(x, y, 90 * s, 62 * s, 0, 0, 7); zg.fill(); zg.strokeStyle = 'rgba(200,90,130,0.7)'; zg.lineWidth = 5 * s; for (let i = 0; i < 4; i++) { zg.beginPath(); zg.moveTo(x - 60 * s + i * 40 * s, y - 40 * s); zg.bezierCurveTo(x - 40 * s + i * 40 * s, y, x - 70 * s + i * 40 * s, y + 20 * s, x - 50 * s + i * 40 * s, y + 45 * s); zg.stroke(); } };
  const drawB = (k, tt) => { zg.clearRect(0, 0, 512, 512); zg.save(); zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.clip(); zg.fillStyle = '#fff4e0'; zg.fillRect(0, 0, 512, 512);
    brain(150, 300, 0.75); brain(350, 270, 0.75 + 0.9 * k);
    zg.font = "400 40px Brand, sans-serif"; zg.textAlign = 'center'; zg.lineWidth = 7; zg.strokeStyle = 'rgba(0,0,0,0.5)'; zg.strokeText('YOU', 150, 420); zg.fillStyle = '#39a0ff'; zg.fillText('YOU', 150, 420); zg.strokeText('ELEPHANT', 350, 450); zg.fillStyle = '#7a7a82'; zg.fillText('ELEPHANT', 350, 450);
    if (k > 0.9) { zg.strokeText('x3', 350, 120); zg.fillStyle = '#ff5a3a'; zg.fillText('x3', 350, 120); }
    zg.restore(); zg.strokeStyle = 'rgba(255,255,255,0.95)'; zg.lineWidth = 12; zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.stroke(); zt.needsUpdate = true; };
  const heartT = canvasTex(128, 128, (g) => { g.fillStyle = '#ff3b5c'; g.beginPath(); g.moveTo(64, 112); g.bezierCurveTo(10, 70, 10, 20, 40, 20); g.bezierCurveTo(56, 20, 64, 34, 64, 40); g.bezierCurveTo(64, 34, 72, 20, 88, 20); g.bezierCurveTo(118, 20, 118, 70, 64, 112); g.fill(); });
  const heart = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartT, transparent: true, depthTest: false, toneMapped: false })); heart.renderOrder = 30; scene.add(heart);
  const thought = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(256, 256, (g) => { g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(128, 120, 100, 0, 7); g.fill(); g.fillStyle = '#3a8ab8'; g.beginPath(); g.ellipse(128, 130, 70, 34, 0, 0, 7); g.fill(); g.fillStyle = '#6a8a3a'; g.fillRect(72, 60, 10, 40); g.beginPath(); g.ellipse(77, 56, 36, 12, 0, 0, 7); g.fill(); }), transparent: true, depthTest: false, toneMapped: false })); thought.renderOrder = 30; scene.add(thought);
  const yrs = textSprite('40 YRS AGO', '#ffd23f', "400 80px Brand, sans-serif"); yrs.renderOrder = 31; yrs.material.depthTest = false; scene.add(yrs);
  const fx = { splash: burst(0xbfe6ff, 60, 1), love: burst(0xff5fa2, 40, 2) }; Object.values(fx).forEach(f => scene.add(f));
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // ---- matriarch path: hook greet near hero, then lead family to water (6.8..15), back to hero 15..
      const walk1 = smooth(range(t, 0, 2.0)), lead = easeInOut(range(t, 7.2, 14.4)), back = easeInOut(range(t, 14.6, 16.4));
      const H = V(1.5, 0, 0.4);
      let mp = V(-2.0, 0, -5.0).lerp(V(-0.6, 0, -1.4), walk1);
      if (t > 6.8) mp = V(-0.6, 0, -1.4).lerp(V(4.2, 0, -5.4), lead);
      if (t > 14.6) mp = V(4.2, 0, -5.4).lerp(V(-0.6, 0, -1.2), back);
      mat.position.copy(mp);
      const moving = (t < 2.0) || (t > 7.2 && t < 14.4) || (t > 14.6 && t < 16.4);
      mat.rotation.y = t < 2.0 ? Math.atan2(1.4, 3.6) : t < 7.0 ? 0.75 : t < 14.5 ? Math.atan2(4.8, -4.0) : (back < 1 ? Math.atan2(-4.8, 4.2) : 0.85);
      mat.walk(t * 4.5, moving ? 0.35 : 0);
      const greet = smooth(range(t, 16.8, 17.6)) * (1 - smooth(range(t, 21.0, 21.8)));
      mat.trunkPose(lerp(0.6, -3.0, greet), 0.08 + 0.1 * greet, t);
      mat.userData.head.rotation.x = -0.1 * greet;
      // family follows
      const famOn = smooth(range(t, 6.8, 7.6)) * (1 - smooth(range(t, 14.4, 15.0)));
      fam.forEach((f, i) => { const lag = (i + 1) * 0.12; const fl = easeInOut(range(t, 7.2 + (i + 1) * 0.6, 14.4 + (i + 1) * 0.3)); const p = V(-2.6 - i * 1.4, 0, 0.6 + i * 0.8).lerp(V(3.0 - i * 1.3, 0, -4.4 + i * 0.6), fl); f.position.copy(p); f.rotation.y = Math.atan2(5.6, -5.0); f.walk(t * 5 + i, fl > 0 && fl < 1 ? 0.35 : 0); f.trunkPose(0.5, 0.1, t + i); f.visible = famOn > 0.01; });
      // pond appears as they arrive
      const pk = smooth(range(t, 12.6, 14.0)) * (1 - smooth(range(t, 15.2, 15.8)));
      pond.scale.set(1.4 * Math.max(0.001, pk), Math.max(0.001, pk), 1); pond.visible = pk > 0.01;
      fx.splash.position.set(4.6, 0.3, -6.0); fx.splash.update(t - 14.2);
      // hero
      hero.root.position.copy(H); hero.root.rotation.y = -Math.PI / 2 - 0.5;
      let pose = STAND(t);
      hero.setPose(pose); hero.setMouth(greet > 0.5 ? 0.4 : 0.06);
      scene.updateMatrixWorld(true);
      const tip = mat.userData.trunk[9].getWorldPosition(V());
      const rs = hero.j.rSh.getWorldPosition(V());
      if (greet > 0.01) { ikArm(hero, 'r', rs.clone().add(V(0, -0.5, 0.05)).lerp(tip.clone().add(V(0.0, 0.05, 0.1)), greet), rs.clone().add(V(0.3, -0.3, 0.2)), V(0, 0, 1)); }
      const headE = mat.userData.head.getWorldPosition(V());
      const hk = smooth(range(t, 17.4, 17.9)) * (1 - smooth(range(t, 21.6, 22.2)));
      heart.position.copy(headE).add(V(0, 1.1, 0)); heart.scale.setScalar(0.45 * hk * (1 + 0.12 * Math.sin(t * 7))); heart.visible = hk > 0.01;
      fx.love.position.copy(headE).add(V(0, 0.9, 0)); fx.love.update(t - 17.6);
      const tk = smooth(range(t, 9.2, 9.7)) * (1 - smooth(range(t, 12.6, 13.0)));
      thought.position.copy(headE).add(V(0.3, 1.4, 0)); thought.scale.setScalar(1.0 * tk); thought.visible = tk > 0.01;
      const yk = easeOut(range(t, 10.8, 11.1)) * (1 - smooth(range(t, 12.6, 13.0)));
      yrs.position.copy(headE).add(V(0.3, 2.15, 0)); yrs.scale.set(1.2 * yk, 0.3 * yk, 1); yrs.visible = yk > 0.01;
      // ---------- camera ----------
      const KEYS = [[0, [1.4, 2.3, 9.4], [0.55, 1.4, -0.8]], [2.3, [1.3, 2.2, 8.8], [0.6, 1.4, -0.6]], [6.6, [1.3, 2.2, 8.8], [0.6, 1.4, -0.6]], [8.0, [-7.0, 4.6, 10.0], [1.2, 1.1, -2.8]], [14.4, [-5.6, 4.6, 7.8], [2.8, 1.1, -4.4]], [16.6, [1.3, 2.2, 8.8], [0.6, 1.5, -0.6]], [22.8, [1.3, 2.2, 8.6], [0.6, 1.5, -0.6]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.4 + (moving ? 0.4 : 0), 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const bk = easeOut(range(t, 3.6, 4.0)) * (1 - smooth(range(t, 6.5, 6.9)));
      if (bk > 0.01) drawB(easeOut(range(t, 4.2, 5.4)), t);
      bub.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.12).addScaledVector(rt, -0.13); bub.scale.setScalar(0.3 * bk); bub.visible = bk > 0.01;
      return { dof: { focus: 6, aperture: 0, maxblur: 0 }, bloom: 0.3, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
