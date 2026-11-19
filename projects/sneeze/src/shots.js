import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { world, tree, stamp } from './ancient.js';
import { brainBubble, textSprite } from './room.js';

export const DURATION = 31.4;
export const CAPTIONS = [
  [0.0, 'What happens when you sneeze?'],
  [2.11, 'When dust or pollen'], [3.37, 'tickles the inside of your nose'], [5.62, 'nerves send an alarm'], [6.91, 'to your brain'],
  [8.11, 'Your brain fires back instantly'], [10.67, 'You take a deep breath'], [12.08, 'your chest muscles squeeze'], [13.89, 'and your eyes close on their own'],
  [15.98, 'Then, boom!'], [17.3, 'Air blasts out'], [18.31, 'of your nose and mouth'], [19.36, 'at up to 160 km per hour'],
  [22.83, 'A single sneeze'], [23.87, 'can spray thousands of tiny droplets'], [26.3, 'more than 6 meters away'], [28.2, 'So always sneeze into your elbow!', 31.2],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const BOOM = 16.24, BOOM2 = 29.3;

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 8, sunDir: [-4, 9, 5], sun: 2.6 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x2f7fd8); u.mid.value.set(0x6aaee8); u.horizon.value.set(0xe0f0f8); u.floorC.value.set(0x7fb24a);
  scene.fog = new THREE.Fog(0xd8ecf4, 30, 120);
  const key = scene.userData.key;
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.85;
  scene.add(world([]));
  const r = rng(6), fcols = [0xffd23f, 0xffffff, 0xff8fab, 0xffb703];
  for (let i = 0; i < 70; i++) { const x = -3 + r() * 2.2, z = -3 + r() * 4; const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.5, 5), new THREE.MeshStandardMaterial({ color: 0x3f8a3a })); st.position.set(x, 0.25, z); scene.add(st); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 6), new THREE.MeshStandardMaterial({ color: fcols[i % 4], roughness: 0.6 })); fl.scale.y = 0.5; fl.position.set(x, 0.52, z); scene.add(fl); }
  [[-5, -8], [6, -10], [-9, -2], [10, -3]].forEach(([x, z], i) => { const tr = tree({ h: 3.6, seed: i + 50 }); tr.position.set(x, 0, z); scene.add(tr); });
  // distance markers 1..6 m in front of him (along +x)
  for (let m = 1; m <= 6; m++) { const line = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 1.6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })); line.rotation.x = -Math.PI / 2; line.position.set(m, 0.01, 0.3); scene.add(line); const lb = textSprite(`${m} m`, '#ffffff', "400 110px Brand, sans-serif"); lb.position.set(m, 0.18, 1.2); lb.scale.set(0.5, 0.25, 1); scene.add(lb); line.userData.lb = lb; }
  const hero = makeHuman('casual', { shirt: 0xe76f51, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  // pollen drifting to the nose
  const pollen = []; for (let i = 0; i < 40; i++) { const s = glowSprite(0xffd23f, 0.05); s.userData.ph = i / 40; scene.add(s); pollen.push(s); }
  // droplet spray (instanced)
  const ND = 600, drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 6, 4), new THREE.MeshStandardMaterial({ color: 0x6fc8ff, emissive: 0x204060, roughness: 0.1, transparent: true, opacity: 0.85 }), ND); drops.frustumCulled = false; scene.add(drops);
  const DV = []; for (let i = 0; i < ND; i++) DV.push(V(0.6 + r() * 1.0, (r() - 0.35) * 0.35, (r() - 0.5) * 0.45).multiplyScalar(5 + r() * 6));
  const mt = new THREE.Matrix4(), zeroM = new THREE.Matrix4().makeScale(0, 0, 0);
  const brain = brainBubble(); scene.add(brain);
  const nerve = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(), V()]), new THREE.LineBasicMaterial({ color: 0xffe14d, transparent: true, toneMapped: false })); scene.add(nerve);
  const spark = glowSprite(0xffe14d, 0.25); scene.add(spark);
  const ah = textSprite('AH...', '#ffffff', "400 120px Brand, sans-serif"); scene.add(ah);
  const choo = textSprite('ACHOO!', '#ff5fa2', "400 130px Brand, sans-serif"); scene.add(choo);
  const speedo = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); speedo.renderOrder = 31; scene.add(speedo);
  const sc = document.createElement('canvas'); sc.width = sc.height = 256; const sg = sc.getContext('2d'); const st2 = new THREE.CanvasTexture(sc); st2.colorSpace = THREE.SRGBColorSpace; speedo.material.map = st2; let lastS = -1;
  const drawS = (v) => { const q = Math.round(v); if (q === lastS) return; lastS = q; sg.clearRect(0, 0, 256, 256); sg.lineWidth = 18; sg.strokeStyle = 'rgba(255,255,255,0.35)'; sg.beginPath(); sg.arc(128, 150, 100, Math.PI, 0); sg.stroke(); sg.strokeStyle = '#ff5fa2'; sg.beginPath(); sg.arc(128, 150, 100, Math.PI, Math.PI + Math.PI * v / 160); sg.stroke(); sg.font = "400 64px Brand, sans-serif"; sg.fillStyle = '#fff'; sg.textAlign = 'center'; sg.lineWidth = 6; sg.strokeStyle = 'rgba(0,0,0,0.5)'; sg.strokeText(`${q}`, 128, 150); sg.fillText(`${q}`, 128, 150); sg.font = "400 30px Brand, sans-serif"; sg.strokeText('km/h', 128, 190); sg.fillText('km/h', 128, 190); st2.needsUpdate = true; };
  const fx = { boom: burst(0xffffff, 80, 1), elbow: burst(0x5be37d, 70, 2) };
  Object.values(fx).forEach(f => scene.add(f));
  const elbow = stamp('USE YOUR ELBOW', '#5be37d', 0.65); scene.add(elbow);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      hero.root.position.set(0, 0, 0.3); hero.root.rotation.y = Math.PI / 2 - 0.35;
      const inhale = smooth(range(t, 10.6, 12.0)) * (1 - smooth(range(t, BOOM - 0.05, BOOM + 0.05)));
      const squeeze = smooth(range(t, 12.1, 12.7));
      const boom = Math.exp(-Math.max(0, t - BOOM) * 4) * (t > BOOM ? 1 : 0);
      const inhale2 = smooth(range(t, 28.4, 29.1)) * (1 - smooth(range(t, BOOM2 - 0.05, BOOM2 + 0.05))), boom2 = Math.exp(-Math.max(0, t - BOOM2) * 4) * (t > BOOM2 ? 1 : 0);
      const elb = smooth(range(t, 28.4, 28.9));
      let pose = over(STAND(t), { neck: [-0.45 * inhale - 0.4 * inhale2 + 0.6 * boom + 0.5 * boom2, 0, 0], spine: [-0.15 * inhale + 0.45 * boom + 0.4 * boom2, 0, 0], chest: [-0.08 * inhale + 0.06 * squeeze * (1 - boom), 0, 0] });
      if (t > 3.3 && t < 5.6) pose = over(pose, { rSh: [-1.5, 0.2, -0.1], rEl: [-2.1, 0, 0], neck: [0.05, 0, 0] });   // scratches his nose
      if (elb > 0) pose = over(pose, { rSh: [-1.7 * elb, -0.6 * elb, -0.3], rEl: [-2.3 * elb, 0, 0] });
      hero.setPose(pose); hero.setMouth(Math.max(0.5 * inhale, 0.7 * boom, 0.5 * boom2, 0.4 * inhale2));
      scene.updateMatrixWorld(true);
      const nose = hero.j.head.localToWorld(V(0, 0.07, 0.15)), head = hero.j.head.localToWorld(V(0, 0.15, 0)), chestP = hero.j.chest.localToWorld(V(0, 0.1, 0.1));
      // pollen drifts in from the flowers to the nose
      pollen.forEach((p, i) => { const u2 = (t * 0.35 + p.userData.ph) % 1; const from = V(-2.2 + Math.sin(i) * 0.6, 0.6, -1 + Math.cos(i * 1.3) * 1.2); p.position.copy(from.lerp(nose, u2)); p.position.y += Math.sin(u2 * Math.PI) * 0.3; p.material.opacity = (t > 2.0 && t < 6.0 ? 1 : 0) * Math.sin(u2 * Math.PI); });
      // nerve alarm nose -> brain (5.6), brain -> body (8.1)
      const sig1 = range(t, 5.6, 7.1), sig2 = range(t, 8.1, 9.6);
      const bpos = head.clone().add(V(-0.1, 0.55, 0.25));
      const showN = (t > 5.6 && t < 7.3) || (t > 8.1 && t < 9.8);
      nerve.visible = showN; spark.visible = showN;
      if (t < 7.5) { nerve.geometry.setFromPoints([nose, bpos]); spark.position.copy(nose).lerp(bpos, sig1); } else { nerve.geometry.setFromPoints([bpos, chestP]); spark.position.copy(bpos).lerp(chestP, sig2); }
      nerve.material.opacity = 0.8; spark.material.opacity = 0.9;
      const bk = easeOut(range(t, 5.5, 5.8)) * (1 - smooth(range(t, 10.4, 10.7)));
      if (bk > 0.01) brain.draw([0, 1, 2, 3, 4].map(i => t > 7.0 ? 0.5 + 0.5 * Math.max(0, Math.sin(t * 14 + i)) : 0.4), -1, t);
      brain.position.copy(bpos); brain.scale.setScalar(0.42 * bk); brain.visible = bk > 0.01;
      ah.position.copy(head).add(V(0.25, 0.3, 0)); const ak = Math.max(inhale, inhale2) * (t > 11 ? 1 : 0); ah.scale.set(0.45 * ak, 0.22 * ak, 1); ah.material.opacity = ak; ah.visible = ak > 0.02;
      choo.position.copy(head).add(V(0.5, 0.3, 0)); const ck = Math.max(boom, 0); choo.scale.set(0.7 * ck, 0.35 * ck, 1); choo.material.opacity = Math.min(1, ck * 1.3); choo.visible = ck > 0.02;
      // spray: blasts out at BOOM, travels to ~6 m; second sneeze into the elbow is blocked
      const dt = t - BOOM;
      for (let i = 0; i < ND; i++) { if (dt <= 0 || dt > 14) { drops.setMatrixAt(i, zeroM); continue; } const v = DV[i], tt = Math.min(dt, 2.2); const p = nose.clone().add(V(v.x * tt * (1 - tt * 0.18), v.y * tt - 0.6 * tt * tt * 0.4, v.z * tt)); if (p.y < 0.01) p.y = 0.01; mt.makeTranslation(p.x, p.y, p.z); drops.setMatrixAt(i, mt); }
      drops.instanceMatrix.needsUpdate = true; drops.material.opacity = 0.85 * (1 - smooth(range(t, 27.8, 28.4)));
      fx.boom.position.copy(nose); fx.boom.update(t - BOOM);
      fx.elbow.position.copy(hero.j.rEl.localToWorld(V(0, 0, 0))); fx.elbow.update(t - BOOM2);
      // ---------- camera ----------
      const KEYS = [[0, [-0.6, 1.8, 5.2], [0.2, 1.1, 0]], [2.0, [-1.4, 1.6, 4.2], [-0.4, 1.2, 0]], [5.5, [0.4, 1.7, 4.0], [0.0, 1.5, 0.2]], [10.5, [0.9, 1.6, 3.8], [0.1, 1.3, 0.3]], [15.9, [0.9, 1.6, 3.8], [0.2, 1.3, 0.3]], [17.0, [-2.2, 1.75, 1.3], [3.5, 0.7, -0.1]], [22.8, [-2.6, 1.9, 1.4], [4.0, 0.5, -0.1]], [28.0, [0.8, 1.6, 3.9], [0.2, 1.2, 0.3]], [31.4, [0.8, 1.6, 3.8], [0.2, 1.2, 0.3]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const sh = shake(t, 0.5 + boom * 6 + boom2 * 3, 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-4, 9, 5));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const sk = easeOut(range(t, 19.3, 19.6)) * (1 - smooth(range(t, 22.5, 22.8)));
      drawS(lerp(0, 160, easeOut(range(t, 19.5, 21.4)))); speedo.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.22).addScaledVector(rt, 0.17); speedo.scale.setScalar(0.24 * sk); speedo.material.opacity = sk; speedo.visible = sk > 0.01;
      elbow.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.25); elbow.set(t > 29.6 ? easeOut(range(t, 29.6, 29.76)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.4, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
