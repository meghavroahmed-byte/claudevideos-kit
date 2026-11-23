import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { burst } from './rare.js';
import { stamp, world, tree, rock } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 25.6;
export const CAPTIONS = [
  [0.0, 'What should you do if you meet a bear?'],
  [2.49, 'First, never run'], [4.63, 'A bear can run faster'], [6.02, 'than an Olympic sprinter'],
  [7.94, 'Stay calm'], [9.06, 'talk in a low voice'], [10.39, 'and slowly back away'],
  [12.42, "If it's a brown bear"], [13.71, 'and it attacks, play dead'], [15.84, 'Lie on your belly'], [16.81, 'and cover your neck'],
  [18.26, "But if it's a black bear"], [19.85, 'fight back!'], [20.89, 'Make yourself look big'], [22.24, 'and shout as loud as you can!', 25.4],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const run = (t, sp = 9, a = 0.7) => ({ lHip: [-a * Math.sin(t * sp), 0, 0.07], rHip: [a * Math.sin(t * sp), 0, -0.07], lKn: [0.9 * Math.max(0, Math.sin(t * sp + 1.2)), 0, 0], rKn: [0.9 * Math.max(0, -Math.sin(t * sp + 1.2)), 0, 0], lSh: [0.8 * Math.sin(t * sp), 0, 0.15], rSh: [-0.8 * Math.sin(t * sp), 0, -0.15], lEl: [-1.2, 0, 0], rEl: [-1.2, 0, 0], spine: [0.25, 0, 0] });

function makeBear(col, snoutCol) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const fur = new THREE.MeshStandardMaterial({ color: col, roughness: 1 }), sn = new THREE.MeshStandardMaterial({ color: snoutCol, roughness: 0.9 }), blk = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4 });
  body.position.y = 0.72;
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), fur); torso.scale.set(0.85, 0.8, 1.45); body.add(torso);
  const hump = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), fur); hump.position.set(0, 0.28, 0.3); body.add(hump);
  const head = new THREE.Group(); head.position.set(0, 0.22, 0.78); body.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 14), fur));
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), sn); snout.scale.set(0.9, 0.75, 1.3); snout.position.set(0, -0.06, 0.24); head.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), blk); nose.position.set(0, -0.02, 0.41); head.add(nose);
  for (const x of [-0.11, 0.11]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), blk); e.position.set(x, 0.06, 0.23); head.add(e); const ear = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), fur); ear.scale.z = 0.5; ear.position.set(x * 1.6, 0.22, 0.02); head.add(ear); }
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshStandardMaterial({ color: 0x8a2a3a })); jaw.position.set(0, -0.15, 0.25); jaw.scale.set(1, 0.05, 1); head.add(jaw);
  const legs = [];
  for (const [x, z] of [[0.24, 0.48], [-0.24, 0.48], [0.24, -0.48], [-0.24, -0.48]]) { const lg = new THREE.Group(); lg.position.set(x, -0.15, z); body.add(lg); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.6, 12), fur); m.position.y = -0.3; lg.add(m); const paw = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), fur); paw.scale.set(1, 0.5, 1.3); paw.position.set(0, -0.6, 0.04); lg.add(paw); legs.push(lg); }
  const walk = (ph, amp) => { legs.forEach((lg, i) => { lg.rotation.x = Math.sin(ph + (i === 0 || i === 3 ? 0 : Math.PI)) * amp; }); body.position.y = 0.72 + Math.abs(Math.sin(ph)) * amp * 0.08; };
  return { g, body, head, jaw, walk, mats: [fur, sn] };
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 9, sunDir: [-4, 8, 5], sun: 2.4 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x3a8ad8); u.mid.value.set(0x8ac0e8); u.horizon.value.set(0xe0eef0); u.floorC.value.set(0x5a8a3a);
  scene.fog = new THREE.Fog(0xd0e4ea, 18, 70);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.85;
  scene.add(world([]));
  // pine forest + trail
  const pine = (x, z, h) => { const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, h * 0.4, 8), new THREE.MeshStandardMaterial({ color: 0x5a3a22 })); tr.position.y = h * 0.2; g.add(tr); for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(h * (0.32 - i * 0.06), h * 0.4, 9), new THREE.MeshStandardMaterial({ color: [0x2f6a3a, 0x357a42, 0x3a8448, 0x449050][i], flatShading: true })); c.position.y = h * (0.38 + i * 0.17); c.castShadow = true; g.add(c); } return g; };
  const pr = rng(31); for (let i = 0; i < 36; i++) { const x = (pr() - 0.5) * 22, z = -3 - pr() * 18; if (Math.abs(x) < 1.6 && z > -9) continue; pine(x, z, 3 + pr() * 3); }
  [[-2.4, 0.5], [-3.2, -1.6], [3.4, -2.6]].forEach(([x, z]) => pine(x, z, 4.2));
  const trailT = canvasTex(256, 1024, (g) => { g.fillStyle = '#a8865a'; g.fillRect(0, 0, 256, 1024); const r = rng(3); for (let i = 0; i < 800; i++) { g.fillStyle = r() > 0.5 ? 'rgba(120,90,50,0.4)' : 'rgba(200,180,140,0.4)'; g.fillRect(r() * 256, r() * 1024, 3, 3); } });
  const trail = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 30), new THREE.MeshStandardMaterial({ map: trailT, roughness: 1 })); trail.rotation.x = -Math.PI / 2; trail.position.set(0, 0.01, -8); trail.receiveShadow = true; scene.add(trail);
  for (let i = 0; i < 8; i++) { const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15 + pr() * 0.25), new THREE.MeshStandardMaterial({ color: 0x8a8a84, flatShading: true })); rk.position.set((pr() > 0.5 ? 1 : -1) * (1.0 + pr() * 1.5), 0.08, -pr() * 6); scene.add(rk); }
  const mtn = new THREE.Mesh(new THREE.ConeGeometry(14, 12, 6), new THREE.MeshStandardMaterial({ color: 0x7a8aa0, flatShading: true })); mtn.position.set(-8, 0, -50); scene.add(mtn);
  const mtn2 = new THREE.Mesh(new THREE.ConeGeometry(12, 10, 6), new THREE.MeshStandardMaterial({ color: 0x8a9ab0, flatShading: true })); mtn2.position.set(12, 0, -55); scene.add(mtn2);

  const hero = makeHuman('casual', { shirt: 0x3a7a4a, jeans: 0x6a5a40, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.45, 0.2), new THREE.MeshStandardMaterial({ color: 0xd8542a, roughness: 0.8 })); pack.position.set(0, 0.1, -0.2); hero.j.chest.add(pack);
  const ghost = makeHuman('casual', { shirt: 0x3a7a4a, jeans: 0x6a5a40 }); scene.add(ghost.root);
  ghost.root.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0; } });
  const brown = makeBear(0x7a4a26, 0xb08050); scene.add(brown.g);
  const black = makeBear(0x1c1c22, 0xc8a070); scene.add(black.g);
  const gBear = makeBear(0x7a4a26, 0xb08050); scene.add(gBear.g); gBear.g.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0; } });
  const rings = []; for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 8, 28, Math.PI * 0.8), new THREE.MeshBasicMaterial({ color: 0x7fd4ff, transparent: true, toneMapped: false })); r.userData.ph = i / 4; scene.add(r); rings.push(r); }
  const hey = textSprite('HEY!', '#ff3b3b', "400 150px Brand, sans-serif"); scene.add(hey);
  const zzz = textSprite('...', '#ffffff', "400 150px Brand, sans-serif"); scene.add(zzz);
  const fx = { run: burst(0xff5a5a, 40, 1), flee: burst(0xffd23f, 60, 2) }; Object.values(fx).forEach(f => scene.add(f));
  const st = { run: stamp('NEVER RUN!', '#ff3b3b', 0.62), dead: stamp('PLAY DEAD', '#5be37d', 0.62), fight: stamp('FIGHT BACK!', '#ff9f1c', 0.62) };
  Object.values(st).forEach(s => scene.add(s));
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // ---------- hero ----------
      const backK = smooth(range(t, 10.4, 12.3));
      let hz = lerp(0.0, 0.8, backK);
      const walkIn = 1 - smooth(range(t, 0.4, 1.4));
      hz -= walkIn * 0.0;
      const prone = smooth(range(t, 14.6, 15.6)) * (1 - smooth(range(t, 18.3, 19.2)));
      const big = smooth(range(t, 20.7, 21.3));
      let pose = STAND(t);
      if (t < 1.4) pose = over(pose, { lHip: [-0.4 * Math.sin(t * 6) * walkIn, 0, 0.07], rHip: [0.4 * Math.sin(t * 6) * walkIn, 0, -0.07] });
      const freeze = smooth(range(t, 1.2, 1.6));
      pose = over(pose, { neck: [0.03, 0, 0], spine: [-0.05 * freeze, 0, 0] });
      const calm = smooth(range(t, 7.9, 8.4)) * (1 - smooth(range(t, 12.4, 12.9)));
      if (calm > 0.01) pose = over(pose, { lSh: [lerp(0.05, -1.3, calm), 0, 0.3], rSh: [lerp(0.05, -1.3, calm), 0, -0.3], lEl: [lerp(-0.25, -0.9, calm), 0, 0], rEl: [lerp(-0.25, -0.9, calm), 0, 0] });
      if (backK > 0 && backK < 1) pose = over(pose, { lHip: [0.35 * Math.sin(t * 5), 0, 0.07], rHip: [-0.35 * Math.sin(t * 5), 0, -0.07], lKn: [0.3 * Math.max(0, Math.sin(t * 5)), 0, 0], rKn: [0.3 * Math.max(0, -Math.sin(t * 5)), 0, 0] });
      if (prone > 0.01) pose = over(pose, { lSh: [-2.6 * prone, 0, 0.6], rSh: [-2.6 * prone, 0, -0.6], lEl: [-2.0 * prone, 0, 0], rEl: [-2.0 * prone, 0, 0], neck: [0.3 * prone, 0, 0], lHip: [0, 0, 0.1], rHip: [0, 0, -0.1], lKn: [0, 0, 0], rKn: [0, 0, 0] });
      if (big > 0.01) { const sh = Math.sin(t * 10) * 0.1; pose = over(pose, { lSh: [lerp(0.05, -2.2, big) + sh, 0, lerp(0.16, 1.0, big)], rSh: [lerp(0.05, -2.2, big) - sh, 0, lerp(-0.16, -1.0, big)], lEl: [-0.2, 0, 0], rEl: [-0.2, 0, 0], neck: [-0.15 * big, 0, 0], lHip: [0, 0, 0.25 * big], rHip: [0, 0, -0.25 * big] }); }
      hero.root.position.set(0, prone * 0.12, hz); hero.root.rotation.set(-Math.PI / 2 * prone, Math.PI - 0.45 * (1 - prone), 0);
      hero.setPose(pose); hero.setMouth(t > 9.0 && t < 10.4 ? 0.25 + 0.15 * Math.sin(t * 9) : t > 22.2 && t < 24.2 ? 0.9 : 0.06);
      // ghost run demo
      const gk = smooth(range(t, 4.4, 4.8)) * (1 - smooth(range(t, 7.3, 7.8)));
      const gt = Math.max(0, t - 4.6);
      ghost.root.position.set(-gt * 1.2, 0, 0.2 + gt * 0.6); ghost.root.rotation.y = -Math.PI / 2 - 0.4;
      ghost.setPose(over(STAND(t), run(t, 11, 0.8))); ghost.root.traverse(o => { if (o.isMesh) o.material.opacity = 0.75 * gk; }); ghost.root.visible = gk > 0.01;
      const gbt = Math.max(0, t - 5.0);
      gBear.g.position.set(1.0 - gbt * 1.75, 0, -1.6 + gbt * 0.85); gBear.g.rotation.y = -Math.PI / 2 - 0.45; gBear.walk(t * 12, 0.7);
      gBear.g.traverse(o => { if (o.isMesh) o.material.opacity = 0.75 * gk; }); gBear.g.visible = gk > 0.01;
      // ---------- brown bear ----------
      const charge = easeIn(range(t, 13.6, 14.4)), leave = smooth(range(t, 17.2, 18.9));
      let bz = lerp(-3.4, -2.0, smooth(range(t, 0, 1.4)));
      bz = lerp(bz, -1.0, smooth(range(t, 10.4, 12.3)) * 0.0) + charge * 2.2;
      brown.g.position.set(lerp(0.15 - 0.95 * charge, 3.5, leave), 0, Math.min(bz, hz - 0.9) - leave * 1.5); brown.g.rotation.y = lerp(0, Math.PI * 0.6, smooth(range(t, 17.0, 17.6)));
      brown.walk(t * (charge > 0 && charge < 1 ? 14 : leave > 0 && leave < 1 ? 7 : t < 1.4 ? 6 : 0), 0.55);
      brown.head.rotation.x = t > 15.6 && t < 17.0 ? 0.5 + Math.sin(t * 6) * 0.1 : 0; brown.head.rotation.y = Math.sin(t * 0.8) * 0.2;
      brown.jaw.scale.y = t > 13.4 && t < 14.6 ? 0.8 : 0.05;
      brown.g.visible = leave < 0.99;
      // ---------- black bear ----------
      const bIn = smooth(range(t, 18.4, 19.8)), flee = easeIn(range(t, 23.4, 25.0));
      black.g.position.set(lerp(-3.2, -0.2, bIn) - flee * 4, 0, lerp(-3.0, -2.0, bIn) - flee * 3); black.g.rotation.y = flee > 0 ? Math.PI + 0.9 : lerp(Math.PI * 0.6, 0.15, bIn);
      black.walk(t * (bIn > 0 && bIn < 1 ? 7 : flee > 0 ? 13 : 0), 0.55);
      black.g.visible = bIn > 0.01;
      black.body.position.y += t > 22.0 && t < 23.4 ? -0.05 : 0; black.head.rotation.x = t > 22.2 && t < 23.4 ? -0.2 : 0;
      scene.updateMatrixWorld(true);
      const mouthW = hero.j.head.localToWorld(V(0, -0.05, 0.15));
      const lowV = t > 9.0 && t < 10.4 ? 1 : 0, shout = t > 22.2 && t < 24.2 ? 1 : 0;
      rings.forEach((r, i) => { const u2 = (t * (shout ? 1.6 : 0.8) + r.userData.ph) % 1; const on = lowV || shout; r.position.copy(mouthW).add(V(0, 0, -u2 * (shout ? 1.0 : 0.5))); r.rotation.set(0, 0, Math.PI * 0.6); r.scale.setScalar(0.6 + u2 * (shout ? 3 : 1.5)); r.material.color.set(shout ? 0xff3b3b : 0x7fd4ff); r.material.opacity = on * (1 - u2); r.visible = !!on; });
      const hk = easeOut(range(t, 22.3, 22.5)) * (1 - smooth(range(t, 24.2, 24.5)));
      hey.position.copy(hero.j.head.getWorldPosition(V())).add(V(0.4, 0.35, 0)); hey.scale.set(0.6 * hk, 0.3 * hk, 1); hey.visible = hk > 0.01;
      fx.flee.position.copy(black.g.position).add(V(0, 1.0, 0)); fx.flee.update(t - 23.4);
      // ---------- camera (behind-ish 3/4 so hero faces the bear) ----------
      const KEYS = [[0, [2.6, 1.7, 3.6], [0.0, 0.85, -1.2]], [2.4, [2.4, 1.6, 3.2], [0.0, 0.8, -1.0]], [4.4, [3.2, 2.0, 4.2], [-0.8, 0.8, -0.4]], [7.6, [3.2, 2.0, 4.2], [-0.8, 0.8, -0.4]], [8.6, [2.4, 1.6, 3.4], [0.0, 0.85, -0.8]],
        [13.3, [2.6, 1.7, 3.8], [0.0, 0.8, -0.6]], [14.9, [2.9, 2.7, 3.6], [-0.35, 0.4, -0.2]], [18.2, [2.9, 2.7, 3.6], [-0.35, 0.4, -0.2]], [19.6, [2.4, 1.7, 3.8], [-0.2, 0.85, -0.8]], [25.6, [2.4, 1.7, 3.8], [-0.4, 0.85, -1.0]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.5 + (t > 13.9 && t < 14.6 ? 2.5 : 0) + shout * 1.2, 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion);
      const pin = (s, a, b) => { s.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); s.set(t > a && t < b ? easeOut(range(t, a, a + 0.2)) : 0); };
      pin(st.run, 3.3, 4.5); pin(st.dead, 15.0, 17.4); if (t > 15 && t < 17.4) st.dead.position.addScaledVector(upv, 0.3); pin(st.fight, 19.9, 21.0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.3, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
