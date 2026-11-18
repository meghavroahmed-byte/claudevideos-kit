import * as THREE from 'three';
import { makeHuman } from './human.js';
import { materials } from './materials.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { crowd, counter, bloodBag, calendar, beam } from './rare.js';

export const DURATION = 29.5;
export const CAPTIONS = [
  [0.09, 'How rare are you?'], [1.12, "Let's find out"], [2.06, 'If you have'], [2.42, 'green eyes'], [3.26, "you're already in"], [4.03, 'just 2%'], [4.91, 'of the world'],
  [5.72, 'Left-handed?'], [6.75, 'Only about'], [7.17, '1 in 10'], [7.80, 'people are'],
  [8.57, 'Red hair?'], [9.46, "That's only"], [9.87, '1 to 2%'], [10.80, 'of humans'],
  [11.70, 'Got AB negative'], [12.60, 'blood?'], [13.29, 'Fewer than'], [13.86, '1 in 100'], [15.18, 'people have it'],
  [16.13, 'And if you were'], [16.52, 'born on'], [16.88, 'February 29th'], [18.32, "that's a"], [18.63, '1 in 1,461'], [20.64, 'chance'],
  [21.15, "Now here's"], [22.17, 'the crazy part'], [23.48, 'Someone with just'], [24.35, 'green eyes'], [24.84, 'AND left hands'], [25.72, 'is about'], [26.03, '1 in 500'],
  [27.33, 'So…'], [28.06, 'how many did you get?', 29.3],
];
export const FADES = [];   // one continuous take

const HERO = V(0, 0, 2.6);
// [t, pos, look] world
const K = [
  [0.0, [2.3, 2.3, 9.0], [0, 1.0, 0.6]],
  [2.1, [1.7, 2.0, 7.8], [0, 1.15, 1.6]],
  [3.0, [0.7, 1.75, 5.0], [0, 1.45, 2.6]],      // head + shoulders: his eyes turn green
  [3.7, [0.75, 1.76, 5.05], [0, 1.45, 2.6]],
  [4.6, [2.6, 3.2, 9.8], [0, 0.7, -2.0]],       // the crowd: only 2 lit
  [5.9, [-2.1, 2.3, 7.6], [0, 1.25, 1.2]],      // left hand up
  [7.6, [-2.0, 3.4, 9.4], [0.7, 0.8, -1.4]],
  [8.8, [1.3, 2.1, 6.4], [0, 1.4, 2.3]],        // red hair
  [10.4, [2.7, 3.5, 9.2], [0, 0.6, -2.5]],
  [12.1, [2.1, 1.8, 6.7], [0.4, 1.2, 2.4]],     // blood bag
  [14.2, [2.6, 3.6, 9.6], [0, 0.5, -3.0]],
  [16.7, [-1.9, 1.85, 6.8], [-0.4, 1.2, 2.4]],  // calendar
  [19.0, [-2.6, 3.8, 9.6], [0, 0.5, -3.0]],
  [21.3, [0, 4.2, 10.8], [0, 1.0, 0.0]],
  [23.4, [0, 14, 13.5], [0, 0, -5.5]],          // rise: 500 people
  [26.2, [0, 18.5, 11.5], [0, 0, -5.0]],
  [27.5, [0, 8.5, 10.5], [0, 0.9, 0.5]],
  [29.5, [0.9, 2.1, 7.4], [0, 1.1, 2.4]],       // back on him, full body
];
function track(t) {
  const n = K.length, T = (i) => K[clamp(i, 0, n - 1)][0], P = (i, j) => V(...K[clamp(i, 0, n - 1)][j]);
  if (t <= K[0][0]) return [P(0, 1), P(0, 2)];
  if (t >= K[n - 1][0]) return [P(n - 1, 1), P(n - 1, 2)];
  let i = 0; while (K[i + 1][0] < t) i++;
  const u = (t - T(i)) / (T(i + 1) - T(i)), dt = T(i + 1) - T(i);
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  return [1, 2].map(j => {
    const m0 = P(i + 1, j).sub(P(i - 1, j)).multiplyScalar(dt / Math.max(1e-3, T(i + 1) - T(i - 1)) * 0.6);
    const m1 = P(i + 2, j).sub(P(i, j)).multiplyScalar(dt / Math.max(1e-3, T(i + 2) - T(i)) * 0.6);
    return P(i, j).multiplyScalar(h00).add(m0.multiplyScalar(h10)).add(P(i + 1, j).multiplyScalar(h01)).add(m1.multiplyScalar(h11));
  });
}

// trait timeline: [start, end, label, colour, number lit in the front 100, seed]
const BEATS = [
  [4.0, 5.6, '2%', '#5be37d', 0x3fd06a, 2, 11],
  [7.1, 8.5, '1 in 10', '#ffd166', 0xffc233, 10, 12],
  [9.8, 11.6, '1–2%', '#ff6b3d', 0xff5a1f, 2, 13],
  [13.8, 16.0, '< 1 in 100', '#ff4d6d', 0xff2d55, 1, 14],
  [18.6, 21.1, '1 in 1,461', '#9ad1ff', 0x66b8ff, 0, 15],
  [26.0, 28.0, '1 in 500', '#ffe14d', 0xffd60a, 0, 16],
];

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-3, 9, 5] });
  const key = scene.userData.key;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.MeshStandardMaterial({ color: 0xe8edf2, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.001; floor.receiveShadow = true; scene.add(floor);
  const C = crowd(); scene.add(C.group);
  const hero = makeHuman('casual'); hero.root.position.copy(HERO); scene.add(hero.root);
  const M = materials();
  const IRIS0 = M.iris.color.clone(), HAIR0 = M.hair.color.clone(), BEARD0 = M.beard.color.clone();
  const eyeGlow = [glowSprite(0x7dffa0, 0.08), glowSprite(0x7dffa0, 0.08)]; eyeGlow.forEach(g => scene.add(g));
  const bag = bloodBag(); bag.scale.set(0.32, 0.4, 1); scene.add(bag);
  const cal = calendar(); cal.scale.set(0.34, 0.4, 1); scene.add(cal);
  const cnt = counter(); scene.add(cnt);
  const bm = beam(); bm.position.x = HERO.x; bm.position.z = HERO.z; scene.add(bm);
  const heroRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 40).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd60a, toneMapped: false }));
  heroRing.position.copy(HERO).add(V(0, 0.02, 0)); scene.add(heroRing);
  const heroGlow = glowSprite(0xffe066, 3.2); heroGlow.position.copy(HERO).add(V(0, 1.0, 0)); heroGlow.renderOrder = 6; scene.add(heroGlow);
  const picks = BEATS.map(b => new Set(C.pick(b[5], b[6])));
  const c = cam(38);
  return {
    scene, camera: c,
    update(t) {
      // ---- hero: traits switch on and stay ----
      const green = smooth(range(t, 2.45, 2.85)), left = smooth(range(t, 5.75, 6.15)) * (1 - smooth(range(t, 8.2, 8.6))), red = smooth(range(t, 8.6, 9.0));
      M.iris.color.copy(IRIS0).lerp(new THREE.Color(0x2fbf55), green);
      M.hair.color.copy(HAIR0).lerp(new THREE.Color(0xc8461e), red); M.beard.color.copy(BEARD0).lerp(new THREE.Color(0xa8401c), red);
      const wave = Math.sin(t * 9) * 0.25 * left;
      const point = smooth(range(t, 27.9, 28.4));
      hero.setPose({
        lSh: [lerp(0.05, -2.75, left), 0, lerp(0.16, 0.35, left) + wave], lEl: [lerp(-0.25, -0.35, left), 0, 0],
        rSh: [lerp(0.05, -1.45, point), lerp(0, 0.15, point), -0.16], rEl: [lerp(-0.25, -0.05, point), 0, 0],
        lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07],
        chest: [Math.sin(t * 1.6) * 0.012, 0, 0], neck: [0, Math.sin(t * 0.5) * 0.08, 0],
      });
      hero.setMouth(0.12 * Math.max(0, Math.sin(t * 2.7)) * (t < 2 ? 1 : 0.4));
      hero.root.rotation.y = 0;
      scene.updateMatrixWorld(true);
      // eye sparkle when they turn green
      const head = hero.j.head;
      [[-1, eyeGlow[0]], [1, eyeGlow[1]]].forEach(([s, g]) => { g.position.copy(head.localToWorld(V(s * 0.035, 0.11, 0.1))); g.material.opacity = Math.exp(-Math.abs(t - 2.85) * 4) * 0.9; });
      // icons beside him
      const bagK = easeOut(range(t, 11.9, 12.3)), calK = easeOut(range(t, 16.85, 17.25));
      bag.position.copy(HERO).add(V(0.62, 1.35 + Math.sin(t * 2) * 0.03, 0.15)); bag.material.opacity = bagK; bag.scale.set(0.32 * bagK, 0.4 * bagK, 1);
      cal.position.copy(HERO).add(V(-0.64, 1.35 + Math.sin(t * 2 + 1) * 0.03, 0.15)); cal.material.opacity = calK; cal.scale.set(0.34 * calK, 0.4 * calK, 1);
      // ---- crowd ----
      const bi = BEATS.findIndex(b => t >= b[0] - 0.1 && t < b[1]);
      const rise = smooth(range(t, 22.3, 24.2));
      if (bi >= 0) {
        const b = BEATS[bi];
        C.update(t, { rise, lit: picks[bi], litCol: b[4], gray: smooth(range(t, b[0] - 0.1, b[0] + 0.3)) * (1 - smooth(range(t, b[1] - 0.3, b[1]))), pop: range(t, b[0], b[0] + 0.5) });
      } else C.update(t, { rise });
      // the one in 500: him
      const one = smooth(range(t, 25.9, 26.4));
      bm.material.opacity = 0.55 * one * (1 - 0.8 * smooth(range(t, 27.8, 28.8))); heroRing.scale.setScalar(one < 0.01 ? 0.0001 : one * lerp(2.4, 1.0, smooth(range(t, 27.4, 28.6)))); heroRing.visible = one > 0.01;
      heroGlow.material.opacity = 0.75 * one * (1 - 0.92 * smooth(range(t, 27.4, 28.6)));
      if (t > 25.9) C.update(t, { rise, lit: new Set(), litCol: 0xffd60a, gray: one });
      // ---- camera ----
      const [cp, lk] = track(t);
      const sh = shake(t, 0.5, 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      key.target.position.set(0, 0, -3); key.position.set(-3, 9, 2);
      // ---- counter at the top of the screen ----
      const fw = V(0, 0, 0); c.getWorldDirection(fw);
      const upv = V(0, 1, 0).applyQuaternion(c.quaternion);
      cnt.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      let ck = 0, txt = '?', col = '#ffffff';
      if (t < 2.0) { ck = smooth(range(t, 0.1, 0.4)); txt = '?'; }
      else if (t > 28.2) { ck = smooth(range(t, 28.2, 28.5)); txt = 'YOU?'; col = '#ffffff'; }
      else if (bi >= 0 || (t > 25.9)) { const b = bi >= 0 ? BEATS[bi] : BEATS[5]; ck = smooth(range(t, b[0], b[0] + 0.25)) * (1 - smooth(range(t, b[1] - 0.25, b[1]))); txt = b[2]; col = b[3]; if (b === BEATS[5]) ck = smooth(range(t, 26.0, 26.25)) * (1 - smooth(range(t, 27.9, 28.2))); }
      else if (t > 28.2) { ck = smooth(range(t, 28.2, 28.5)); txt = 'YOU?'; col = '#ffffff'; }
      cnt.set(txt, col); cnt.material.opacity = ck; const pop = 1 + 0.15 * Math.exp(-Math.max(0, t - (bi >= 0 ? BEATS[bi][0] : 0)) * 8);
      cnt.scale.set(0.9 * pop, 0.225 * pop, 1); cnt.visible = ck > 0.01;
      const fd = cp.distanceTo(lk);
      return { dof: { focus: fd, aperture: 0.0008, maxblur: 0.005 }, bloom: 0.35 };
    },
  };
}

export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
