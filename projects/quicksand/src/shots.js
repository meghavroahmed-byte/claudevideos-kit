import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { infoCard, burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { world, grass, tree, rock, river, stamp } from './ancient.js';

export const DURATION = 29.6;
export const CAPTIONS = [
  [0.0, 'What would happen'], [0.95, 'if you got stuck'], [1.81, 'in quicksand?'],
  [3.06, 'In the movies'], [4.09, 'people sink all the way under'], [5.74, 'But in real life'], [7.21, "that's impossible"],
  [8.62, 'Your body is less dense'], [10.03, 'than quicksand'], [10.97, "so you'd only sink"], [11.85, 'up to your waist'],
  [13.16, 'The real danger'], [14.09, 'is getting stuck'], [15.71, 'Pulling your foot out fast'], [17.06, 'takes as much force'], [18.3, 'as lifting a car!'],
  [19.96, "So don't panic"], [21.39, 'Lean back'], [22.16, 'spread your arms'], [23.18, 'and wiggle your legs slowly'],
  [25.32, 'Water seeps in'], [26.23, 'the sand loosens'], [27.76, 'and you float free', 29.4],
];
export const FADES = [];

const PIT = V(0, 0, 0), START = V(-2.6, 0, 0.6);
const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const WALK = (p, a = 1) => { const s = Math.sin(p); return { lHip: [-0.4 * s * a, 0, 0.05], rHip: [0.4 * s * a, 0, -0.05], lKn: [(0.15 + 0.5 * Math.max(0, Math.sin(p + 1.3))) * a, 0, 0], rKn: [(0.15 + 0.5 * Math.max(0, Math.sin(p + 1.3 + Math.PI))) * a, 0, 0], lSh: [0.35 * s * a, 0, 0.15], rSh: [-0.35 * s * a, 0, -0.15], lEl: [-0.4, 0, 0], rEl: [-0.4, 0, 0], drop: -0.02 + Math.abs(Math.cos(p)) * 0.02 }; };
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function hudSprite(w, h, draw) { const t = canvasTex(w, h, draw); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false })); s.renderOrder = 31; return s; }

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-4, 9, 5], sun: 2.6 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x3a86d6); u.mid.value.set(0x7ab8ea); u.horizon.value.set(0xe8dcc0); u.floorC.value.set(0xc9b48a);
  scene.fog = new THREE.Fog(0xe2d8c4, 30, 120);
  const key = scene.userData.key; key.color.set(0xfff0d8);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xdfeeff); hemi.groundColor.set(0xb59a6e); hemi.intensity = 0.8;
  scene.add(world(['#d2bd92', ['196,176,134', '214,198,160', '184,164,124']]));
  scene.add(grass(900, [-12, -18, 12, 3], [[-2.6, -2.6, 2.6, 2.6], [-3.5, 0, 0, 1.4]]));
  const R = river(7.5, 3.0); scene.add(R);
  [[-6, -7], [5, -9], [-10, -3], [10, -4]].forEach(([x, z], i) => { const tr = tree({ h: 3 + i % 2, seed: i + 30, col: 0x5f8f3a }); tr.position.set(x, 0, z); scene.add(tr); });
  [[-3.2, -1.6, 0.8], [2.8, -1.8, 0.6], [3.4, 1.2, 0.5], [-4.2, 2.0, 0.6]].forEach(([x, z, s], i) => { const k = rock(s, 60 + i, 0xb8a888); k.position.set(x, 0, z); scene.add(k); });
  // quicksand pit (wet, glossy, rippling)
  const wetT = canvasTex(512, 512, (g) => { g.fillStyle = '#8a7350'; g.fillRect(0, 0, 512, 512); const r = rng(8); for (let i = 0; i < 1600; i++) { const v = r(); g.fillStyle = `rgba(${v < 0.5 ? '110,92,62' : '160,138,100'},0.35)`; g.beginPath(); g.arc(r() * 512, r() * 512, 1 + r() * 4, 0, 7); g.fill(); } });
  wetT.wrapS = wetT.wrapT = THREE.RepeatWrapping; wetT.repeat.set(3, 3);
  const pitMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: wetT, roughness: 0.22, metalness: 0.05 });
  const pit = new THREE.Mesh(new THREE.CircleGeometry(2.3, 64), pitMat); pit.rotation.x = -Math.PI / 2; pit.position.set(0, 0.012, 0); pit.receiveShadow = true; scene.add(pit);
  const rim = new THREE.Mesh(new THREE.RingGeometry(2.25, 2.6, 64), new THREE.MeshStandardMaterial({ color: 0xa8916a, roughness: 0.9, transparent: true, opacity: 0.8 })); rim.rotation.x = -Math.PI / 2; rim.position.y = 0.011; scene.add(rim);
  const ripples = []; for (let i = 0; i < 4; i++) { const r2 = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.34, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x5a4a32, transparent: true, depthWrite: false })); r2.position.y = 0.02; r2.userData.ph = i / 4; scene.add(r2); ripples.push(r2); }
  // hero (sand clips him)
  const hero = makeHuman('casual', { shirt: 0xe63946, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const clip = new THREE.Plane(V(0, 1, 0), -0.0);
  hero.root.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.clippingPlanes = [clip]; } });
  // movie ghost
  const ghost = makeHuman('casual', {}); scene.add(ghost.root);
  ghost.root.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ color: 0x7fd3ff, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending, clippingPlanes: [clip] }); o.castShadow = false; } });
  // waist marker ring
  const waist = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.018, 8, 48).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd23f, toneMapped: false, transparent: true })); waist.position.set(0, 0.03, 0); scene.add(waist);
  // car hologram
  const car = new THREE.Group(); const hm = new THREE.MeshBasicMaterial({ color: 0x8fd3ff, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false });
  car.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.75), hm)); const cab = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.3, 0.7), hm); cab.position.set(-0.1, 0.32, 0); car.add(cab);
  for (const [x, z] of [[-0.55, 0.38], [0.55, 0.38], [-0.55, -0.38], [0.55, -0.38]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 18), hm); w.rotation.x = Math.PI / 2; w.position.set(x, -0.18, z); car.add(w); }
  scene.add(car);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 16), new THREE.MeshBasicMaterial({ color: 0xffd23f, toneMapped: false, transparent: true })); scene.add(arrow);
  const chart = hudSprite(512, 420, (g) => { g.fillStyle = 'rgba(30,20,10,0.72)'; g.beginPath(); g.roundRect(6, 6, 500, 408, 40); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 4; g.stroke(); g.fillStyle = '#ff6b6b'; g.beginPath(); g.roundRect(90, 300 - 110, 120, 110, 14); g.fill(); g.fillStyle = '#c9a26b'; g.beginPath(); g.roundRect(300, 300 - 220, 120, 220, 14); g.fill(); g.font = "400 46px Brand, sans-serif"; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('BODY', 150, 360); g.fillText('QUICKSAND', 360, 360); g.font = "400 52px Brand, sans-serif"; g.fillText('1x', 150, 170); g.fillText('2x', 360, 62); });
  const water = []; for (let i = 0; i < 30; i++) { const s = glowSprite(0x5ab8ff, 0.3); s.userData.ph = i / 30; scene.add(s); water.push(s); }
  const fx = { step: burst(0x8a7350, 50, 1), car: burst(0x8fd3ff, 60, 2), free: burst(0x5be37d, 100, 3), pull: burst(0x8a7350, 40, 4) };
  Object.values(fx).forEach(f => scene.add(f));
  const imp = stamp('IMPOSSIBLE!', '#ff2a2a', 0.62); scene.add(imp);
  const panic = stamp("DON'T PANIC", '#ffd23f', 0.62); scene.add(panic);
  const free = stamp('FREE!', '#5be37d', 0.42); scene.add(free);
  const card = infoCard(); scene.add(card);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      R.update(t); wetT.offset.set(Math.sin(t * 0.3) * 0.01, t * 0.002);
      // ================= HERO =================
      const walk = range(t, 0.0, 1.4);
      let pos = START.clone().lerp(PIT, easeOut(walk) * (1 - 0) * 1.0);
      // depth below the sand surface
      const d1 = 0.45 * easeOut(range(t, 1.4, 2.4)), d2 = 0.95 * smooth(range(t, 10.9, 12.3));
      const fl = smooth(range(t, 25.6, 28.5));
      let depth = Math.max(d1, d2) * (1 - fl);
      const lean = smooth(range(t, 21.3, 21.9)) * (1 - 0) , floatLean = fl;
      const a = lerp(0.45 * lean, Math.PI / 2 - 0.12, floatLean);
      const pivotH = Math.max(0.05, depth + 0.02 * (1 - fl));
      // keep the point at sand level fixed while leaning back
      const z = pos.z - pivotH * Math.sin(a), y = -depth + pivotH * (1 - Math.cos(a)) + 0.18 * fl;
      hero.root.position.set(pos.x, y, z); hero.root.rotation.set(-a, walk < 1 ? Math.PI / 2 * (1 - smooth(range(walk, 0.7, 1))) : 0, 0, 'YXZ');
      let pose = walk < 1 ? WALK(t * 7.5, 1) : STAND(t);
      const flail = smooth(range(t, 1.5, 1.8)) * (1 - smooth(range(t, 3.0, 3.5)));
      pose = over(pose, { lSh: [-1.8 * flail, 0, 0.6 * flail + 0.16], rSh: [-1.7 * flail, 0, -0.6 * flail - 0.16], lEl: [-0.6 * flail - 0.25, 0, 0], rEl: [-0.6 * flail - 0.25, 0, 0] });
      const tug = Math.max(0, Math.sin((t - 14.2) * 6)) * (t > 14.2 && t < 19.4 ? 1 : 0);
      if (t > 13.9 && t < 20.0) pose = over(pose, { spine: [0.3 * tug, 0, 0.1 * Math.sin(t * 3)], lSh: [-0.9, 0, 0.3], rSh: [-0.9, 0, -0.3], lEl: [-1.3 - 0.3 * tug, 0, 0], rEl: [-1.3 - 0.3 * tug, 0, 0], lHip: [-0.4 * tug, 0, 0.07], lKn: [0.5 * tug, 0, 0] });
      const calm = smooth(range(t, 20.0, 20.6)), spread = smooth(range(t, 22.1, 22.6)), wig = smooth(range(t, 23.2, 23.5)) * (1 - smooth(range(t, 25.5, 26)));
      if (t >= 20.0) pose = over(STAND(t), { lSh: [lerp(-0.3, -0.2, spread), 0, lerp(0.5, 1.45, spread)], rSh: [lerp(-0.3, -0.2, spread), 0, lerp(-0.5, -1.45, spread)], lEl: [-0.3 * (1 - spread), 0, 0], rEl: [-0.3 * (1 - spread), 0, 0], neck: [0.25 * lean + 0.2 * fl, 0, 0], lHip: [Math.sin(t * 5) * 0.25 * wig, 0, 0.1], rHip: [-Math.sin(t * 5) * 0.25 * wig, 0, -0.1], spine: [0, 0, Math.sin(t * 5) * 0.04 * wig] });
      hero.setPose(pose);
      hero.setMouth(0.5 * flail + 0.35 * tug + (t > 28 ? 0.25 : 0));
      // movie ghost sinks fully
      const gk = easeOut(range(t, 3.1, 3.4)) * (1 - smooth(range(t, 7.5, 8.2))), gs = easeInOut(range(t, 3.5, 5.6));
      ghost.root.visible = gk > 0.01; ghost.root.position.set(1.25, -1.95 * gs, -0.6); ghost.root.rotation.y = -0.4;
      ghost.setPose(over(STAND(t), { lSh: [-2.9, 0, 0.3], rSh: [-2.6 + Math.sin(t * 8) * 0.3, 0, -0.3], lEl: [-0.2, 0, 0], rEl: [-0.2, 0, 0] })); ghost.root.scale.setScalar(gk);
      // ripples / waist marker
      ripples.forEach(r2 => { const u2 = (t * 0.6 + r2.userData.ph) % 1, k = t > 1.4 ? 1 : 0; r2.position.x = hero.root.position.x; r2.position.z = PIT.z; r2.scale.setScalar(1 + u2 * 3); r2.material.opacity = k * (1 - u2) * 0.5; });
      const wk = smooth(range(t, 11.9, 12.3)) * (1 - smooth(range(t, 13.0, 13.4)));
      waist.position.set(hero.root.position.x, 0.04, PIT.z); waist.scale.setScalar(Math.max(0.001, wk)); waist.material.opacity = wk;
      fx.step.position.set(0, 0.05, 0.1); fx.step.update(t - 1.42);
      fx.pull.position.set(0, 0.05, 0.1); fx.pull.update(t - 16.4);
      // car = force
      const ck = smooth(range(t, 18.2, 18.6)) * (1 - smooth(range(t, 19.7, 20.0)));
      car.position.set(0.75, 1.65 + Math.sin(t * 2) * 0.05, -0.3); car.rotation.y = t * 0.6; car.scale.setScalar(Math.max(0.001, ck)); car.visible = ck > 0.01;
      arrow.position.set(0.75, 1.2, -0.3); arrow.rotation.x = Math.PI; arrow.scale.setScalar(Math.max(0.001, ck)); arrow.visible = ck > 0.01;
      fx.car.position.copy(car.position); fx.car.update(t - 18.3);
      // water seeping in
      const wsk = smooth(range(t, 25.3, 25.8)) * (1 - smooth(range(t, 28.4, 29.0)));
      water.forEach((s, i) => { const u2 = (t * 0.5 + s.userData.ph) % 1, ang = i * 2.4; s.position.set(Math.cos(ang) * (1.4 - u2 * 1.0), 0.05, Math.sin(ang) * (1.4 - u2 * 1.0)); s.material.opacity = wsk * Math.sin(u2 * Math.PI) * 0.8; s.scale.setScalar(0.35); });
      pitMat.color.setRGB(1 - 0.25 * smooth(range(t, 25.5, 27)), 1 - 0.15 * smooth(range(t, 25.5, 27)), 1);
      fx.free.position.set(0, 0.6, 0.2); fx.free.update(t - 28.0);
      // ---------- camera ----------
      const KEYS = [[0, [-0.6, 1.9, 7.4], [-1.0, 0.9, 0.2]], [1.5, [0.4, 1.8, 6.4], [-0.1, 0.85, 0.2]], [3.2, [1.4, 1.8, 6.2], [0.6, 0.75, -0.2]], [7.5, [1.3, 1.75, 5.6], [0.4, 0.75, -0.1]], [8.6, [0.6, 1.6, 4.6], [0, 0.55, 0]], [13.0, [0.5, 1.5, 4.1], [0, 0.55, 0]], [17.6, [0.6, 1.7, 5.0], [0.35, 1.0, 0]], [19.9, [0.3, 1.7, 4.6], [0, 0.8, 0]], [24.5, [0.8, 1.7, 4.4], [0, 0.55, -0.2]], [27.0, [1.6, 2.7, 4.6], [0, 0.2, -0.4]], [29.6, [1.7, 2.8, 4.5], [0, 0.2, -0.45]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const sh = shake(t, 0.6, 3);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-4, 9, 5));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const chk = smooth(range(t, 8.6, 8.9)) * (1 - smooth(range(t, 10.9, 11.2)));
      chart.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.18).addScaledVector(rt, 0.18); chart.scale.set(0.3 * chk, 0.246 * chk, 1); chart.material.opacity = chk; chart.visible = chk > 0.01;
      imp.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.05); imp.set(t > 7.4 ? easeOut(range(t, 7.4, 7.56)) * (1 - smooth(range(t, 8.3, 8.6))) : 0);
      panic.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.1); panic.set(t > 20.1 ? easeOut(range(t, 20.1, 20.26)) * (1 - smooth(range(t, 21.1, 21.4))) : 0);
      free.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.1); free.set(t > 28.4 ? easeOut(range(t, 28.4, 28.56)) : 0);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 3.0, 'WHAT IF', 'QUICKSAND?', '#ffffff', "you're stuck"],
        [3.06, 7.3, 'IN MOVIES', 'SINK UNDER', '#8fd3ff', ''],
        [8.62, 11.85, 'YOUR BODY', 'LESS DENSE', '#ff6b6b', 'than quicksand'], [11.85, 13.1, 'YOUR BODY', 'TO THE WAIST', '#ffd23f', 'that is all'],
        [13.16, 18.3, 'REAL DANGER', 'STUCK', '#ff9a5a', ''], [18.3, 19.9, 'REAL DANGER', '= LIFTING A CAR', '#8fd3ff', 'to pull a foot out fast'],
        [21.39, 22.16, 'ESCAPE', 'LEAN BACK', '#5be37d', 'step 1'], [22.16, 23.18, 'ESCAPE', 'SPREAD ARMS', '#5be37d', 'step 2'], [23.18, 25.3, 'ESCAPE', 'WIGGLE SLOWLY', '#5be37d', 'step 3'],
        [25.32, 27.76, 'THEN', 'WATER SEEPS IN', '#5ab8ff', 'sand loosens'], [27.76, 29.6, 'THEN', 'FLOAT FREE', '#5be37d', ''],
      ];
      const cu = CARDS.find(([a2, b]) => t >= a2 && t < b); let ck2 = 0;
      if (cu) { card.set(cu[2], cu[3], cu[4], null, cu[5]); const grp = CARDS.filter(x => x[2] === cu[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck2 = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk = 1 + 0.09 * Math.exp(-(t - cu[0]) * 9); card.scale.set(0.72 * pk, 0.281 * pk, 1); }
      card.material.opacity = ck2; card.visible = false;
      const fd = cp.distanceTo(lk);
      return { dof: { focus: fd, aperture: 0.0008, maxblur: 0.004 }, bloom: 0.35, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
