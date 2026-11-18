import * as THREE from 'three';
import { makeHuman } from './human.js';
import { materials } from './materials.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { crowd, bloodBag, calendar, beam, infoCard, burst } from './rare.js';
import { rng } from './textures.js';

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

// ---------------- cast: 24 people in the first three rows + the hero ----------------
const HERO = V(0, 0, 2.3);
const SHIRTS = [0xe76f51, 0x457b9d, 0xe9c46a, 0x8d6cab, 0xf4a261, 0x43aa8b, 0xd62828, 0x6c757d, 0xff8fab, 0x264653, 0xb5838d, 0x3a86ff];
const SKINS = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac, 0xd99b7a];
const HAIRS = [0x2b1d14, 0x3a2618, 0x111111, 0x6b4a2b, 0xb08850, 0x4a3020];
const pos = (k) => V((k % 8 - 3.5) * 1.12, 0, [0.6, -0.35, -1.3][Math.floor(k / 8)]);
const GREEN = [2, 13], LEFT = [0, 4, 6, 9, 11, 15, 17, 19, 21, 23], RED = [5, 18], ABNEG = 10;
const t2 = (k) => pos(k).clone().add(V(0, 1.62, 0));           // a person's eye line

// camera keys [t, pos, look] (world)
const K = [
  [0.0, [2.7, 2.9, 10.0], [0, 1.0, 0.0]],
  [1.9, [1.2, 2.2, 7.0], [-1.2, 1.4, 0.8]],
  [2.75, [pos(2).x + 0.3, 1.66, 1.95], [pos(2).x, 1.5, 0.6]],     // her eyes turn green (head + shoulders)
  [3.45, [pos(2).x + 0.34, 1.67, 2.02], [pos(2).x, 1.5, 0.6]],
  [4.45, [1.0, 3.7, 9.0], [0, 0.9, -0.6]],                          // two green beams in the crowd
  [6.0, [-4.8, 2.3, 5.0], [0.2, 1.4, -0.4]],                        // ten left hands go up
  [7.7, [-4.0, 2.9, 6.4], [0.4, 1.2, -0.5]],
  [8.75, [pos(5).x + 1.0, 1.95, 2.75], [pos(5).x, 1.45, 0.6]],     // her hair turns red
  [9.45, [pos(5).x + 1.05, 1.96, 2.8], [pos(5).x, 1.45, 0.6]],
  [10.25, [pos(18).x + 1.3, 2.7, 1.5], [pos(18).x, 1.5, -1.3]],     // and his
  [11.05, [0.6, 3.8, 9.0], [0, 0.9, -0.6]],
  [12.1, [pos(ABNEG).x - 0.7, 2.25, 1.75], [pos(ABNEG).x, 1.35, -0.35]],   // AB-
  [14.3, [-1.0, 3.6, 8.6], [-0.6, 1.0, -0.6]],
  [16.5, [0, 2.5, 7.6], [0, 3.3, -3.2]],                            // giant calendar flips to the 29th
  [18.5, [0, 2.9, 7.2], [0, 2.9, -3.2]],
  [20.4, [1.5, 3.9, 9.0], [0, 0.8, -1.0]],                          // nobody here
  [21.6, [0, 4.6, 11.0], [0, 1.0, 0.0]],
  [23.4, [0, 13.5, 13.0], [0, 0, -5.0]],                            // 500 people
  [24.9, [1.25, 2.35, 6.6], [0, 1.2, 2.3]],                         // him: green eyes AND left hand
  [25.7, [1.35, 2.45, 6.8], [0, 1.2, 2.3]],
  [26.9, [0, 15.5, 10.5], [0, 0, -4.0]],                            // the one in 500
  [27.8, [0, 9.5, 9.5], [0, 0.8, 0.6]],
  [29.5, [0.8, 2.0, 6.9], [0, 1.1, 2.3]],
];
function track(t) {
  const n = K.length, T = (i) => K[clamp(i, 0, n - 1)][0], P = (i, j) => V(...K[clamp(i, 0, n - 1)][j]);
  if (t <= K[0][0]) return [P(0, 1), P(0, 2)];
  if (t >= K[n - 1][0]) return [P(n - 1, 1), P(n - 1, 2)];
  let i = 0; while (K[i + 1][0] < t) i++;
  const u = (t - T(i)) / (T(i + 1) - T(i)), dt = T(i + 1) - T(i);
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  return [1, 2].map(j => {
    const m0 = P(i + 1, j).sub(P(i - 1, j)).multiplyScalar(dt / Math.max(1e-3, T(i + 1) - T(i - 1)) * 0.55);
    const m1 = P(i + 2, j).sub(P(i, j)).multiplyScalar(dt / Math.max(1e-3, T(i + 2) - T(i)) * 0.55);
    return P(i, j).multiplyScalar(h00).add(m0.multiplyScalar(h10)).add(P(i + 1, j).multiplyScalar(h01)).add(m1.multiplyScalar(h11));
  });
}
// beats: who is lit, when
const BEATS = [
  { a: 3.95, b: 5.6, who: GREEN, col: 0x3fe07a, card: ['GREEN EYES', '2%', '#5be37d', 2, 'of the world'] },
  { a: 7.0, b: 8.5, who: LEFT, col: 0xffc233, card: ['LEFT-HANDED', '1 in 10', '#ffd166', 10, 'people'] },
  { a: 9.75, b: 11.6, who: RED, col: 0xff1a1a, card: ['RED HAIR', '1–2%', '#ff3b3b', 2, 'of humans'] },
  { a: 13.75, b: 16.0, who: [ABNEG], col: 0xff3d7f, card: ['AB NEGATIVE', '< 1%', '#ff6b9a', 1, 'fewer than 1 in 100'] },
  { a: 18.55, b: 21.1, who: [], col: 0x66b8ff, card: ['BORN FEB 29', '1 in 1,461', '#8ecbff', 0, 'nobody in this crowd'] },
  { a: 26.0, b: 28.0, who: [], col: 0xffd60a, card: ['GREEN EYES + LEFTY', '1 in 500', '#ffe14d', null, 'just him'] },
];

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-3, 9, 5] });
  // premium night studio
  const u = scene.userData.sky.material.uniforms;
  u.top.value.set(0x0b1028); u.mid.value.set(0x18234a); u.horizon.value.set(0x34467e); u.floorC.value.set(0x141a2c);
  scene.fog = new THREE.Fog(0x1a2550, 16, 42);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.MeshStandardMaterial({ color: 0x252c42, roughness: 0.32, metalness: 0.15 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.001; floor.receiveShadow = true; scene.add(floor);
  const rimA = new THREE.DirectionalLight(0x5ad1ff, 1.1); rimA.position.set(-6, 4, -8); scene.add(rimA);
  const rimB = new THREE.DirectionalLight(0xff5ad1, 0.8); rimB.position.set(6, 3, -8); scene.add(rimB);
  const key = scene.userData.key; key.intensity = 2.0;
  key.target.position.set(0, 0, -1.5); key.position.set(-3, 9, 3.5);

  const C = crowd({ skipRows: 3, z0: 0.6, s: 0.95 }); scene.add(C.group);
  // the cast
  const r = rng(321);
  const cast = [];
  for (let k = 0; k < 24; k++) {
    const female = r() < 0.5;
    const h = makeHuman('casual', { shirt: SHIRTS[k % SHIRTS.length], jeans: [0x34507a, 0x2b2b30, 0x5a6b8a, 0x7a5c3a][k % 4], skin: SKINS[(r() * SKINS.length) | 0], hair: HAIRS[(r() * HAIRS.length) | 0], iris: 0x4a3322, beard: !female && r() < 0.6, long: female });
    h.root.position.copy(pos(k)); h.root.rotation.y = (r() - 0.5) * 0.35; scene.add(h.root);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.035, 8, 40).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, toneMapped: false }));
    ring.position.copy(pos(k)).add(V(0, 0.02, 0)); scene.add(ring);
    const bm = beam(); bm.position.x = pos(k).x; bm.position.z = pos(k).z; bm.scale.set(0.8, 1, 0.8); scene.add(bm);
    cast.push({ h, ring, bm, ph: r() * 6.28, shirt0: h.shirt.color.clone(), skin0: h.M.skin.color.clone(), hair0: h.M.hair.color.clone(), iris0: h.M.iris.color.clone(), eyes: [glowSprite(0x7dffa0, 0.07), glowSprite(0x7dffa0, 0.07)] });
    cast[k].eyes.forEach(e => scene.add(e));
  }
  const hero = makeHuman('casual', { chestText: 'MR. CLOUD' }); hero.root.position.copy(HERO); scene.add(hero.root);
  const M = materials(); const IRIS0 = M.iris.color.clone();
  const heroEyes = [glowSprite(0x7dffa0, 0.08), glowSprite(0x7dffa0, 0.08)]; heroEyes.forEach(e => scene.add(e));
  const heroBeam = beam(); heroBeam.position.set(HERO.x, 6, HERO.z); scene.add(heroBeam);
  const heroRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 40).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd60a, toneMapped: false })); heroRing.position.copy(HERO).add(V(0, 0.02, 0)); scene.add(heroRing);
  const heroGlow = glowSprite(0xffe066, 3.0); heroGlow.position.copy(HERO).add(V(0, 1.0, 0)); scene.add(heroGlow);
  // props
  const bag = bloodBag(); scene.add(bag);
  const pulse = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.36, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff2d55, transparent: true, toneMapped: false, depthWrite: false })); scene.add(pulse);
  const cal28 = calendar('28'), cal29 = calendar('29'); [cal28, cal29].forEach(cg => { cg.position.set(0, 3.4, -3.4); scene.add(cg); });
  const fx = { red1: burst(0xff2020, 70, 5), red2: burst(0xff2020, 70, 6), green1: burst(0x7dffa0, 50, 7), cal: burst(0x8ecbff, 90, 8), gold: burst(0xffe14d, 110, 9), hero: burst(0x7dffa0, 50, 10) };
  Object.values(fx).forEach(f => scene.add(f));
  fx.red1.position.copy(t2(5)).add(V(0, 0.2, 0)); fx.red2.position.copy(t2(18)).add(V(0, 0.2, 0)); fx.green1.position.copy(t2(2));
  fx.cal.position.set(0, 3.4, -3.4); fx.gold.position.copy(HERO).add(V(0, 1.2, 0)); fx.hero.position.copy(HERO).add(V(0, 1.62, 0));
  const card = infoCard(); scene.add(card);
  const c = cam(38);
  const GRAY = new THREE.Color(0x8d939b);

  return {
    scene, camera: c,
    update(t) {
      const bi = BEATS.findIndex(b => t >= b.a - 0.1 && t < b.b);
      const beat = bi >= 0 ? BEATS[bi] : null;
      const dim = beat ? smooth(range(t, beat.a - 0.1, beat.a + 0.35)) * (1 - smooth(range(t, beat.b - 0.35, beat.b))) : 0;
      // ---- cast ----
      cast.forEach((p, k) => {
        const isLit = beat ? beat.who.includes(k) : false;
        // traits switch on and stay
        const g = k === 2 ? smooth(range(t, 2.8, 3.1)) : k === 13 ? smooth(range(t, 3.95, 4.25)) : 0;
        p.h.M.iris.color.copy(p.iris0).lerp(new THREE.Color(0x2fbf55), g);
        const rd = k === 5 ? smooth(range(t, 8.8, 8.92)) : k === 18 ? smooth(range(t, 9.85, 9.97)) : 0;
        p.h.M.hair.color.copy(p.hair0).lerp(new THREE.Color(0xb3101c), rd); p.h.M.hair.emissive = p.h.M.hair.emissive || new THREE.Color(); p.h.M.hair.emissive.setRGB(0.12 * rd + 0.25 * rd * Math.exp(-Math.max(0, t - (k === 5 ? 8.8 : 9.85)) * 1.5), 0, 0.01 * rd);
        // dim the others during a beat
        const d = isLit ? 0 : dim;
        p.h.shirt.color.copy(p.shirt0).lerp(GRAY, d * 0.85); p.h.M.skin.color.copy(p.skin0).lerp(GRAY, d * 0.45);
        // pose: idle; left hands go up in a wave
        const li = LEFT.indexOf(k), up = li >= 0 ? smooth(range(t, 5.85 + (pos(k).x + 4) * 0.06, 6.25 + (pos(k).x + 4) * 0.06)) * (1 - smooth(range(t, 8.3, 8.7))) : 0;
        const ab = k === ABNEG ? smooth(range(t, 11.95, 12.3)) : 0;
        p.h.setPose({
          lSh: [lerp(0.05, -2.8, up), 0, lerp(0.16, 0.3, up) + Math.sin(t * 8 + k) * 0.18 * up], lEl: [lerp(-0.25, -0.3, up), 0, 0],
          rSh: [lerp(0.05, -1.1, ab), lerp(0, -0.3, ab), -0.16], rEl: [lerp(-0.25, -1.2, ab), 0, 0],
          lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07],
          chest: [Math.sin(t * 1.6 + p.ph) * 0.012, 0, 0], neck: [0.05, Math.sin(t * 0.5 + p.ph) * 0.15, 0],
        });
        p.h.setMouth(0);
        const lit = isLit ? smooth(range(t, beat.a, beat.a + 0.3)) * (1 - smooth(range(t, beat.b - 0.3, beat.b))) : 0;
        p.ring.material.color.setHex(beat ? beat.col : 0xffffff); p.ring.scale.setScalar(Math.max(0.0001, lit)); p.ring.visible = lit > 0.01;
        p.bm.material.color.setHex(beat ? beat.col : 0xffffff); p.bm.material.opacity = beat && beat.who.length > 3 ? 0 : 0.5 * lit;
      });
      scene.updateMatrixWorld(true);
      cast.forEach((p, k) => p.eyes.forEach((e, s) => {
        const tg = k === 2 ? 3.0 : k === 13 ? 4.1 : -9;
        e.position.copy(p.h.j.head.localToWorld(V((s ? 1 : -1) * 0.035, 0.11, 0.1))); e.material.opacity = Math.exp(-Math.abs(t - tg) * 4) * 0.9;
      }));
      // pawn crowd
      const rise = smooth(range(t, 22.0, 23.8));
      const one = smooth(range(t, 25.95, 26.4)) * (1 - smooth(range(t, 27.9, 28.5)));
      C.update(t, { rise, lit: beat || one > 0 ? new Set() : null, litCol: 0xffffff, gray: Math.max(dim, one) });
      // ---- hero ----
      const hg = smooth(range(t, 24.4, 24.7)), hl = smooth(range(t, 24.9, 25.3)), point = smooth(range(t, 27.9, 28.4));
      M.iris.color.copy(IRIS0).lerp(new THREE.Color(0x2fbf55), hg);
      hero.setPose({
        lSh: [lerp(0.05, -2.75, hl * (1 - point)), 0, 0.16 + Math.sin(t * 8) * 0.2 * hl * (1 - point)], lEl: [-0.3, 0, 0],
        rSh: [lerp(0.05, -1.45, point), lerp(0, 0.15, point), -0.16], rEl: [lerp(-0.25, -0.05, point), 0, 0],
        lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07],
        chest: [Math.sin(t * 1.6) * 0.012, 0, 0], neck: [0, Math.sin(t * 0.5) * 0.08, 0],
      });
      hero.setMouth(0.12 * Math.max(0, Math.sin(t * 2.7)) * (t < 2 ? 1 : 0));
      scene.updateMatrixWorld(true);
      heroEyes.forEach((e, s) => { e.position.copy(hero.j.head.localToWorld(V((s ? 1 : -1) * 0.035, 0.11, 0.1))); e.material.opacity = Math.exp(-Math.abs(t - 24.7) * 4) * 0.9; });
      heroBeam.material.color.setHex(0xfff3b0); heroBeam.material.opacity = 0.55 * one;
      heroRing.scale.setScalar(Math.max(0.0001, one * 2.2)); heroRing.visible = one > 0.01;
      heroGlow.material.opacity = 0.7 * one;
      // ---- props ----
      const bk = easeOut(range(t, 11.95, 12.35)) * (1 - smooth(range(t, 15.8, 16.2)));
      bag.position.copy(cast[ABNEG].h.j.rWr.localToWorld(V(0, -0.12, 0.06))).add(V(0, 0.12, 0)); bag.scale.set(0.3 * bk, 0.375 * bk, 1); bag.material.opacity = bk; bag.visible = bk > 0.01;
      const pt = (t - 12.0) % 0.9, pk = t > 12.0 && t < 16.0 ? 1 : 0;
      pulse.position.copy(pos(ABNEG)).add(V(0, 0.03, 0)); pulse.scale.setScalar(1 + pt * 3); pulse.material.opacity = pk * (1 - pt / 0.9) * 0.8;
      const ck = easeOut(range(t, 16.5, 16.9)) * (1 - smooth(range(t, 20.6, 21.0))), flip = range(t, 17.45, 17.75);
      const sq = Math.abs(Math.cos(flip * Math.PI));
      cal28.visible = flip < 0.5 && ck > 0.01; cal29.visible = flip >= 0.5 && ck > 0.01;
      [cal28, cal29].forEach(cg => { cg.scale.set(1.9 * ck, 2.2 * ck * Math.max(0.05, sq), 1); cg.material.opacity = ck; cg.position.y = 3.4 + Math.sin(t * 1.5) * 0.05; });
      fx.red1.update(t - 8.8); fx.red2.update(t - 9.85); fx.green1.update(t - 2.95); fx.cal.update(t - 17.6); fx.gold.update(t - 26.0); fx.hero.update(t - 24.6);
      // ---- camera ----
      const [cp, lk] = track(t);
      const sh = shake(t, 0.45, 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      // ---- glass card at the top ----
      const fw = V(0, 0, 0); c.getWorldDirection(fw);
      const upv = V(0, 1, 0).applyQuaternion(c.quaternion);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      let k = 0;
      if (t < 2.0) { card.set('HOW RARE', 'ARE YOU?', '#ffffff', null, ''); k = smooth(range(t, 0.15, 0.45)) * (1 - smooth(range(t, 1.75, 2.0))); }
      else if (t > 28.15) { card.set('NOW YOU', 'COUNT', '#ffffff', null, 'how many did you get?'); k = smooth(range(t, 28.15, 28.45)); }
      else if (beat) { card.set(...beat.card); k = smooth(range(t, beat.a, beat.a + 0.25)) * (1 - smooth(range(t, beat.b - 0.25, beat.b))); }
      const popk = beat ? 1 + 0.08 * Math.exp(-Math.max(0, t - beat.a) * 8) : 1;
      card.scale.set(0.72 * popk, 0.281 * popk, 1); card.material.opacity = k; card.visible = k > 0.01;
      const fd = cp.distanceTo(lk);
      return { dof: { focus: fd, aperture: fd < 3 ? 0.002 : 0.0006, maxblur: 0.006 }, bloom: 0.55, exposure: 1.05 };
    },
  };
}

export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
