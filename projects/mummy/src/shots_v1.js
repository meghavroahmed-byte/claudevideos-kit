import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp, world } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 25.4;
export const CAPTIONS = [
  [0.0, 'How were mummies made?'],
  [1.75, 'First, Egyptian embalmers'], [3.82, 'pulled the brain out through the nose'], [5.79, 'with a long hook'],
  [7.33, 'Then they removed the organs'], [8.93, 'and stored them in special jars'], [11.13, 'But they left the heart inside'],
  [13.24, 'The body was covered in salt'], [14.78, 'for forty days to dry it out'],
  [17.18, 'Finally, it was wrapped in'], [18.74, 'hundreds of meters of linen bandages'], [21.54, 'The whole process took seventy days!', 25.2],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 7, sunDir: [-4, 8, 5], sun: 2.8 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x2a8ae0); u.mid.value.set(0x8ac8f0); u.horizon.value.set(0xffe8c0); u.floorC.value.set(0xe0b878);
  scene.fog = new THREE.Fog(0xf4e0c0, 30, 140);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.95;
  scene.add(world(['#e0b878', ['200,160,100', '230,190,130', '190,150,90']]));
  for (const [x, z, s] of [[-14, -40, 14], [6, -50, 18], [24, -44, 11]]) { const p = new THREE.Mesh(new THREE.ConeGeometry(s, s * 0.95, 4), new THREE.MeshStandardMaterial({ color: 0xd8b070, flatShading: true })); p.position.set(x, s * 0.47, z); p.rotation.y = Math.PI / 4; scene.add(p); }
  // tent canopy + posts
  const cloth = new THREE.MeshStandardMaterial({ color: 0xf0e4c8, side: THREE.DoubleSide, roughness: 0.9 });
  const canopy = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.6, 8, 8), cloth); canopy.rotation.x = -Math.PI / 2; canopy.position.set(0, 2.9, -0.6); scene.add(canopy);
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a6a40 });
  for (const [x, z] of [[-2.1, -2.3], [2.1, -2.3], [-2.1, 1.1], [2.1, 1.1]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.9, 8), wood); p.position.set(x, 1.45, z); scene.add(p); }
  const stoneM = new THREE.MeshStandardMaterial({ color: 0xc8b898, roughness: 0.9 });
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.85, 0.8), stoneM); table.position.set(-0.45, 0.425, -0.8); scene.add(table);
  // shelf with canopic jars
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.4), wood); shelf.position.set(-1.0, 1.0, -2.0); scene.add(shelf);
  const shelfLeg = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.06), wood); shelfLeg.position.set(-1.0, 0.5, -2.15); scene.add(shelfLeg);
  const jars = []; const headCols = [0x2a5aa8, 0xd8a040, 0x2a2a2e, 0x5a8a4a];
  for (let i = 0; i < 4; i++) { const g = new THREE.Group(); g.position.set(-1.6 + i * 0.4, 1.04, -2.0); scene.add(g); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.32, 14), new THREE.MeshStandardMaterial({ color: 0xf0e8d8, roughness: 0.6 })); body.position.y = 0.16; g.add(body); const lid = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), new THREE.MeshStandardMaterial({ color: headCols[i] })); lid.position.y = 0.38; g.add(lid); const ear = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 4), lid.material); ear.position.set(0.05, 0.47, 0); g.add(ear); const ear2 = ear.clone(); ear2.position.x = -0.05; g.add(ear2); g.scale.setScalar(0.001); jars.push(g); }
  // the body on the table (a dummy person)
  const body = makeHuman('casual', { shirt: 0xd8c8a0, jeans: 0xd8c8a0, skin: 0xc8a888, hair: 0x2a1a10 }); body.root.position.set(-1.3, 0.9, -0.8); body.root.rotation.set(0, 0, 0); body.root.rotation.order = 'YXZ'; body.root.rotation.set(-Math.PI / 2, -Math.PI / 2, 0); scene.add(body.root);
  const lids = []; body.j.head.traverse(o => { if (o.isMesh && o.geometry && o.geometry.parameters && Math.abs((o.geometry.parameters.radius || 0) - 0.0168) < 1e-4) lids.push(o); });
  const bandT = canvasTex(128, 128, (g) => { g.fillStyle = '#f2ead8'; g.fillRect(0, 0, 128, 128); g.strokeStyle = 'rgba(160,140,110,0.6)'; g.lineWidth = 3; for (let i = -4; i < 8; i++) { g.beginPath(); g.moveTo(0, i * 22); g.lineTo(128, i * 22 + 40); g.stroke(); } });
  bandT.wrapS = bandT.wrapT = THREE.RepeatWrapping; bandT.repeat.set(2, 2);
  const bandM = new THREE.MeshStandardMaterial({ map: bandT, roughness: 0.95 });
  const bodyMeshes = []; body.root.traverse(o => { if (o.isMesh) bodyMeshes.push({ o, m: o.material }); });
  // hero embalmer
  const hero = makeHuman('casual', { shirt: 0xf4f0e6, jeans: 0xf4f0e6, skin: 0xb07a50, hair: 0x1a1a1a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  hero.root.traverse(o => { if (o.isMesh && o.material && o.material.color && o.material.color.getHex() === 0xf4f0e6 && !o.material.map) { o.material = o.material.clone(); o.material.color.set(0x2a9d8f); } });
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.022, 8, 24), new THREE.MeshStandardMaterial({ color: 0xffd23f, metalness: 0.7, roughness: 0.3 })); collar.rotation.x = Math.PI / 2; collar.position.y = 0.36; hero.j.chest.add(collar);
  const hook = new THREE.Group(); const hr = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.8 })); hr.position.y = 0.25; hook.add(hr); const hc = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.005, 6, 12, Math.PI), hr.material); hc.position.y = 0.5; hook.add(hc); scene.add(hook);
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 14), bandM); scene.add(roll);
  const brainBit = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff9ab0 })); scene.add(brainBit);
  const organs = []; for (let i = 0; i < 4; i++) { const o = glowSprite(0xff7a9a, 0.16); scene.add(o); organs.push(o); }
  const heartT = canvasTex(128, 128, (g) => { g.fillStyle = '#ff3b5c'; g.beginPath(); g.moveTo(64, 112); g.bezierCurveTo(10, 70, 10, 20, 40, 20); g.bezierCurveTo(56, 20, 64, 34, 64, 40); g.bezierCurveTo(64, 34, 72, 20, 88, 20); g.bezierCurveTo(118, 20, 118, 70, 64, 112); g.fill(); });
  const heart = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartT, transparent: true, depthTest: false, toneMapped: false })); heart.renderOrder = 30; scene.add(heart);
  // salt
  const NS = 260, salt = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }), NS); salt.frustumCulled = false; scene.add(salt);
  const SR = rng(4), SD = []; for (let i = 0; i < NS; i++) SD.push({ x: -1.35 + SR() * 1.8, z: -1.0 + SR() * 0.4, d: SR() * 1.2, h: 0.92 + SR() * 0.12 });
  const mt = new THREE.Matrix4();
  // counter
  const cc = document.createElement('canvas'); cc.width = 768; cc.height = 220; const cg = cc.getContext('2d'); const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace;
  const cnt = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); cnt.renderOrder = 31; scene.add(cnt); let lastC = '';
  const drawC = (s, col) => { if (s === lastC) return; lastC = s; cg.clearRect(0, 0, 768, 220); cg.font = "400 120px Brand, sans-serif"; cg.textAlign = 'center'; cg.textBaseline = 'middle'; cg.lineWidth = 14; cg.strokeStyle = 'rgba(0,0,0,0.6)'; cg.strokeText(s, 384, 110); cg.fillStyle = col; cg.fillText(s, 384, 110); ct.needsUpdate = true; };
  const fx = { done: burst(0xffd23f, 70, 1) }; scene.add(fx.done);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      body.setPose({ lSh: [0.05, 0, 0.12], rSh: [0.05, 0, -0.12], lEl: [-0.1, 0, 0], rEl: [-0.1, 0, 0], lHip: [0, 0, 0.04], rHip: [0, 0, -0.04] }); body.setMouth(0.0);
      lids.forEach(l => l.rotation.x = 1.8);
      // bandage wipe from feet to head 18.2..21.2
      const wrap = range(t, 18.2, 21.2);
      bodyMeshes.forEach(({ o, m }) => { const wp = o.getWorldPosition(V()); const along = clamp((wp.x + 1.4) / 1.85, 0, 1); o.material = along < wrap || t < 1.7 ? bandM : m; });
      // hero embalmer behind the table
      hero.root.position.set(1.0, 0, -0.75); hero.root.rotation.y = -Math.PI / 2 - 0.5;
      const hookK = smooth(range(t, 3.6, 4.1)) * (1 - smooth(range(t, 6.9, 7.3)));
      const wrapK = smooth(range(t, 17.8, 18.2)) * (1 - smooth(range(t, 21.2, 21.6)));
      const saltK = smooth(range(t, 13.3, 13.7)) * (1 - smooth(range(t, 15.6, 16.0)));
      let pose = over(STAND(t), { spine: [0.3 * Math.max(hookK, wrapK, saltK), 0, 0], neck: [0.3, 0, 0] });
      hero.setPose(pose); hero.setMouth(0.06);
      scene.updateMatrixWorld(true);
      const nose = body.j.head.localToWorld(V(0, 0.08, 0.14)), rs = hero.j.rSh.getWorldPosition(V()), ls = hero.j.lSh.getWorldPosition(V());
      if (hookK > 0.01) { const pull = 0.06 * Math.max(0, Math.sin(t * 4)); ikArm(hero, 'r', rs.clone().add(V(0.05, -0.5, 0.1)).lerp(nose.clone().add(V(0.0, 0.32 + pull, 0.05)), hookK), rs.clone().add(V(0.3, -0.2, -0.2)), V(0, 0, 1)); }
      if (wrapK > 0.01) { const wx = lerp(-0.6, 0.85, wrap); const p = V(wx - 0.45, 1.05 + 0.06 * Math.sin(t * 9), -0.8 + 0.12 * Math.cos(t * 9)); ikArm(hero, 'r', rs.clone().add(V(0.05, -0.5, 0.1)).lerp(p, wrapK), rs.clone().add(V(0.3, -0.2, -0.2)), V(0, 0, 1)); }
      if (saltK > 0.01) { const p = V(lerp(-1.0, 0.3, (Math.sin(t * 1.5) + 1) / 2), 1.35, -0.85); ikArm(hero, 'l', ls.clone().add(V(-0.05, -0.5, 0.1)).lerp(p, saltK), ls.clone().add(V(-0.3, -0.2, -0.2)), V(0, 0, 1)); }
      scene.updateMatrixWorld(true);
      const rh = hero.j.rWr.localToWorld(V(0, -0.07, 0));
      hook.position.copy(rh); hook.quaternion.setFromUnitVectors(V(0, 1, 0), nose.clone().sub(rh).normalize()); hook.visible = hookK > 0.05;
      roll.position.copy(rh); roll.visible = wrapK > 0.05; roll.rotation.set(t * 8, 0, Math.PI / 2);
      const bb = range(t, 5.9, 6.9); brainBit.position.copy(nose).add(V(0, 0.05 + bb * 0.35, 0.04)); brainBit.visible = bb > 0 && bb < 1;
      // organs into jars 8.0..10.4
      jars.forEach((j, i) => { const k = easeOut(range(t, 7.6 + i * 0.15, 8.0 + i * 0.15)); j.scale.setScalar(Math.max(0.001, k)); });
      const belly = body.j.spine.getWorldPosition(V());
      organs.forEach((o, i) => { const u2 = range(t, 8.9 + i * 0.3, 9.7 + i * 0.3); const p = belly.clone().lerp(jars[i].position.clone().add(V(0, 0.3, 0)), u2); p.y += Math.sin(u2 * Math.PI) * 0.5; o.position.copy(p); o.visible = u2 > 0 && u2 < 1; });
      const hk = smooth(range(t, 11.6, 12.0)) * (1 - smooth(range(t, 13.0, 13.3)));
      heart.position.copy(body.j.chest.localToWorld(V(0, 0.15, 0.2))).add(V(0, 0.15, 0)); heart.scale.setScalar(0.18 * hk * (1 + 0.15 * Math.sin(t * 8))); heart.visible = hk > 0.01;
      // salt pile
      for (let i = 0; i < NS; i++) { const d = SD[i]; const u2 = clamp((t - 13.4 - d.d) / 0.6, 0, 1); const on = t > 13.4 && t < 18.2; const y = lerp(2.0, d.h, u2 * u2); mt.makeTranslation(d.x, on ? y : -10, d.z); salt.setMatrixAt(i, mt); } salt.instanceMatrix.needsUpdate = true;
      fx.done.position.set(-0.45, 1.4, -0.8); fx.done.update(t - 21.6);
      // ---------- camera ----------
      const KEYS = [[0, [1.6, 2.8, 5.8], [0.0, 0.9, -0.8]], [1.8, [1.4, 2.6, 5.0], [0.0, 0.95, -0.8]], [25.4, [1.5, 2.6, 5.2], [0.0, 0.95, -0.8]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.35, 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      let txt = '', on = 0, col = '#ffd23f';
      if (t > 14.8 && t < 17.0) { txt = `DAY ${Math.max(1, Math.round(lerp(1, 40, easeOut(range(t, 14.9, 16.4)))))}`; on = 1; }
      else if (t > 22.6) { txt = `${Math.round(lerp(40, 70, easeOut(range(t, 22.7, 23.8))))} DAYS`; on = 1; col = '#ff8a3a'; }
      if (on) drawC(txt, col);
      cnt.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.2); cnt.scale.set(0.42 * on, 0.12 * on, 1); cnt.visible = !!on;
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.3, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
