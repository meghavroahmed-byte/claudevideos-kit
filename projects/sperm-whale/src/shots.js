import * as THREE from 'three';
import { makeHuman } from './human.js';
import { materials } from './materials.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { bubbles, orient } from './slide.js';
import { ocean, makeWhale, o2Token, label } from './whale.js';

export const DURATION = 27.14;
export const CAPTIONS = [
  [0.10, 'What would actually'], [0.95, 'happen if'], [1.48, 'a sperm whale'], [2.21, 'swallowed you whole?'],
  [3.40, 'First'], [4.16, "you'd be tightly"], [5.03, 'squeezed down'], [5.70, 'its giant throat'], [6.75, 'and pushed through'], [7.53, 'the esophagus'],
  [8.60, 'From there'], [9.43, "you'd drop into"], [10.03, 'a series of'], [10.59, 'stomach chambers'],
  [11.59, 'completely flooded'], [12.82, 'with powerful'], [13.56, 'digestive acids'], [14.52, 'that would instantly'], [15.53, 'begin dissolving'], [16.30, 'your body'],
  [17.17, 'Yet'], [17.91, 'even if you'], [18.40, 'miraculously'], [19.17, 'survived the acid'], [20.55, "you wouldn't last long"],
  [21.77, 'the total'], [22.37, 'lack of oxygen'], [23.20, "inside the whale's"], [23.93, 'stomach'], [24.38, 'would cause you'], [24.96, 'to suffocate'], [25.63, 'almost immediately', 26.94],
];
export const FADES = [];   // one continuous take

const SKIN0 = new THREE.Color(0xd99b7a), ACIDSKIN = new THREE.Color(0xb7b46a), BLUE = new THREE.Color(0x93a9cc);
const whaleZ = (t) => lerp(-6, 0, easeOut(range(t, 0, 2.6)));
const jawA = (t) => 0.95 * (1 - easeIn(range(t, 2.45, 2.85)));
const throatU = (t) => t < 2.95 ? 0.04 : t < 4.2 ? 0.04 : t < 6.75 ? lerp(0.04, 0.35, range(t, 4.2, 6.75)) : lerp(0.35, 0.985, easeInOut(range(t, 6.75, 8.4)));
const acidLevel = (t) => lerp(lerp(-1.5, -1.45, range(t, 8, 9)), -0.78, smooth(range(t, 11.5, 13.2)));

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 3, sunDir: [-2, 9, 3] });
  const sea = ocean(scene);
  const key = scene.userData.key, SUN = V(-2, 9, 3);
  const W = makeWhale(); scene.add(W.group);
  const man = makeHuman('swim'); scene.add(man.root);
  const M = materials();
  const fizz = bubbles(90, { box: [0.7, 0.5, 1.6], speed: 0.35, size: 0.012, seed: 12 });
  fizz.material = new THREE.MeshBasicMaterial({ color: 0xd8ff7a, transparent: true, opacity: 0.85, depthWrite: false }); scene.add(fizz);
  const air = bubbles(30, { box: [0.3, 1.2, 0.3], speed: 0.6, size: 0.02, seed: 3 }); scene.add(air);
  const o2 = [0, 1, 2, 3, 4, 5].map(() => { const s = o2Token(); scene.add(s); return s; });
  const c = cam(38);
  const C1 = W.chambers[0];
  // organ labels: [sprite, whale-local position, t-in, t-out]
  const labels = [
    [label('THROAT'), (p) => p.clone().add(V(0, 0.3, 1.35)), 4.4, 6.7],
    [label('ESOPHAGUS'), (p) => p.clone().add(V(0, 0.3, 1.35)), 6.9, 8.5],
    [label('STOMACH'), (p) => p.clone().add(V(0, 0.75, -1.6)), 9.9, 13.4],
  ];
  labels.forEach(([sp]) => scene.add(sp));
  const q = new THREE.Quaternion();

  // body centre (world) + orientation at time t
  function body(t) {
    const wz = whaleZ(t);
    const throatW = (u) => W.throat.getPointAt(u).clone().add(V(0, 0, wz));
    let p, up, front;
    if (t < 2.25) {
      p = V(0, -0.9 + Math.sin(t * 2.2) * 0.05, 9.6 + t * 0.25); up = V(0, 0.15, 1); front = V(0, -1, 0.15);
    } else if (t < 2.95) {
      const k = easeIn(range(t, 2.25, 2.95));
      p = V(0, -0.9, 9.6 + 2.25 * 0.25).lerp(throatW(0.04), k);
      const tg = W.throat.getTangentAt(0.04).negate();
      up = V(0, 0.15, 1).lerp(tg, k).normalize(); front = V(0.0001, -1, 0.15).lerp(V(0, 1, 0), smooth(k)).normalize();
    } else if (t < 8.6) {
      const u = throatU(t);
      p = throatW(u); up = W.throat.getTangentAt(u).negate(); front = V(0, 1, 0);
    } else {
      const end = throatW(0.985), land = V(0, acidLevel(t) + 0.02, C1.c.z);
      const k = range(t, 8.6, 9.9);
      p = end.clone().lerp(land, easeIn(k)); p.y = lerp(end.y, land.y, k * k) + Math.sin(k * Math.PI) * 0.15;
      if (t > 9.9) { p = land; p.y += Math.sin(t * 1.7) * 0.025; p.x = Math.sin(t * 0.6) * 0.05; }
      up = W.throat.getTangentAt(0.985).negate().lerp(V(0, 0, 1), smooth(k)).normalize(); front = V(0, 1, 0);
    }
    front.addScaledVector(up, -front.dot(up)).normalize();
    return { p, up, front };
  }

  function poseAt(t) {
    const s = Math.sin(t * 5), s2 = Math.sin(t * 3.3);
    if (t < 2.25) { const a = t * 4.2; return [{
      lSh: [-3.14 + 3.14 * (0.5 + 0.5 * Math.sin(a)), 0, 0.25], rSh: [-3.14 + 3.14 * (0.5 - 0.5 * Math.sin(a)), 0, -0.25], lEl: [-0.3, 0, 0], rEl: [-0.3, 0, 0],
      lHip: [0.25 * Math.sin(t * 9), 0, 0.06], rHip: [-0.25 * Math.sin(t * 9), 0, -0.06], lKn: [0.25, 0, 0], rKn: [0.25, 0, 0], neck: [-0.55, 0.35 * Math.sin(a), 0],
    }, 0.45]; }
    if (t < 2.95) return [{ lSh: [-1.45, 0, 0.3], rSh: [-1.45, 0, -0.3], lEl: [-0.2, 0, 0], rEl: [-0.2, 0, 0], lHip: [-0.6, 0, 0.1], rHip: [-0.6, 0, -0.1], lKn: [0.4, 0, 0], rKn: [0.4, 0, 0], neck: [0.25, 0, 0] }, 0.9];
    if (t < 8.6) return [{ lSh: [-3.0, 0, -0.15], rSh: [-3.0, 0, 0.15], lEl: [-0.15, 0, 0], rEl: [-0.15, 0, 0], neck: [0.1, 0.15 * s2, 0], lHip: [0, 0, 0.03], rHip: [0, 0, -0.03] }, 0.35 + 0.2 * Math.abs(s2)];
    if (t < 11.5) return [{ lSh: [-0.6 + 0.5 * s, 0, 1.3], rSh: [-0.6 - 0.5 * s, 0, -1.3], lEl: [-0.6, 0, 0], rEl: [-0.6, 0, 0], lHip: [-0.5 - 0.3 * s2, 0, 0.15], rHip: [-0.5 + 0.3 * s2, 0, -0.15], lKn: [0.9, 0, 0], rKn: [0.9, 0, 0], neck: [0.3, 0, 0] }, 0.7];
    if (t < 17.0) return [{ lSh: [-0.9 + 0.3 * s, 0, 0.9], rSh: [-0.9 - 0.3 * s, 0, -0.9], lEl: [-1.2 - 0.3 * s2, 0, 0], rEl: [-1.2 + 0.3 * s2, 0, 0], lHip: [-0.7, 0, 0.1], rHip: [-0.5, 0, -0.1], lKn: [1.1 + 0.2 * s, 0, 0], rKn: [0.9 - 0.2 * s, 0, 0], neck: [0.35, 0.2 * s2, 0], spine: [0.15, 0, 0] }, 0.5 + 0.25 * Math.abs(Math.sin(t * 7))];
    const limp = smooth(range(t, 24.0, 25.4));
    const gasp = t < 21.8 ? Math.abs(Math.sin(t * 3)) : Math.abs(Math.sin(t * lerp(2.2, 0.8, range(t, 21.8, 24)))) * (1 - limp);
    return [{
      lSh: [-0.5 * (1 - limp), 0, lerp(1.0, 1.4, limp)], rSh: [-0.5 * (1 - limp), 0, -lerp(1.0, 1.4, limp)], lEl: [lerp(-0.8, -0.3, limp), 0, 0], rEl: [lerp(-0.8, -0.3, limp), 0, 0],
      lHip: [lerp(-0.5, -0.15, limp), 0, 0.12], rHip: [lerp(-0.5, -0.15, limp), 0, -0.12], lKn: [lerp(0.8, 0.3, limp), 0, 0], rKn: [lerp(0.8, 0.3, limp), 0, 0],
      neck: [lerp(0.25, -0.15, limp), 0, 0], head: [0, lerp(0, 0.35, limp), 0],
    }, t > 24 ? lerp(0.25 + 0.4 * gasp, 1.0, limp) : 0.2 + 0.45 * gasp];
  }

  // camera keys: [t, pos, look, relative-to-body?]
  const K = [
    [0.0, [2.6, 0.9, 14.6], [-0.3, -0.8, 8.9], 0],
    [1.3, [2.9, 1.1, 15.0], [-0.3, -0.8, 8.7], 0],
    [1.42, [2.92, 1.11, 15.03], [-0.3, -0.8, 8.7], 0],
    [2.1, [4.5, 13.5, 25], [0, -1.2, -0.5], 0],
    [2.9, [4.2, 12.5, 23], [0, -1.2, 0.5], 0],
    [3.9, [2.4, 3.0, -2.2], [0, 0, 0], 1],
    [4.6, [1.1, 2.5, -2.0], [0, 0, 0.1], 1],
    [6.7, [1.0, 2.4, -2.1], [0, 0, 0.1], 1],
    [8.3, [1.4, 2.7, -2.4], [0, -0.1, 0], 1],
    [9.7, [2.2, 3.0, -2.4], [0, -0.3, -0.3], 1],
    [11.3, [4.2, 2.6, 4.2], [0, -0.35, -2.0], 1],
    [13.0, [1.0, 2.7, -1.9], [0, 0, 0.15], 1],
    [16.4, [0.8, 2.5, -1.8], [0, 0, 0.2], 1],
    [19.5, [0.9, 2.6, -1.9], [0, 0, 0.2], 1],
    [22.0, [0.7, 2.4, -1.7], [0, 0.05, 0.25], 1],
    [25.3, [0.9, 2.7, -2.0], [0, 0.05, 0.2], 1],
    [27.14, [16, 3.5, 13], [0, -0.5, 0], 0],
  ];
  function track(t, P) {
    const val = (i, j) => { const k = K[clamp(i, 0, K.length - 1)]; const v = V(...k[j]); return k[3] ? v.add(P) : v; };
    const T = (i) => K[clamp(i, 0, K.length - 1)][0];
    if (t <= K[0][0]) return [val(0, 1), val(0, 2)];
    if (t >= K[K.length - 1][0]) return [val(K.length - 1, 1), val(K.length - 1, 2)];
    let i = 0; while (K[i + 1][0] < t) i++;
    const u = (t - T(i)) / (T(i + 1) - T(i)), dt = T(i + 1) - T(i);
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
    return [1, 2].map(j => {
      const p0 = val(i, j), p1 = val(i + 1, j);
      const m0 = val(i + 1, j).sub(val(i - 1, j)).multiplyScalar(dt / Math.max(1e-3, T(i + 1) - T(i - 1)));
      const m1 = val(i + 2, j).sub(val(i, j)).multiplyScalar(dt / Math.max(1e-3, T(i + 2) - T(i)));
      return p0.multiplyScalar(h00).add(m0.multiplyScalar(h10)).add(p1.multiplyScalar(h01)).add(m1.multiplyScalar(h11));
    });
  }

  return {
    scene, camera: c,
    update(t) {
      W.group.position.z = whaleZ(t);
      W.tail.rotation.x = Math.sin(t * 1.4) * 0.22;
      W.setJaw(jawA(t));
      W.setXray(smooth(range(t, 3.1, 4.0)));
      const B = body(t);
      sea.update(t, B.p, smooth(range(t, 3.1, 4.0)) * (1 - smooth(range(t, 25.4, 26.6))));
      W.squeeze(t < 8.6 ? throatU(t) : 2, t);
      const L = acidLevel(t), glow = 1 - 0.65 * smooth(range(t, 16.8, 18.5));
      W.setAcid([L, -0.9, -0.85], smooth(range(t, 8.4, 9.4)), glow);
      // man
      const [pose, mouth] = poseAt(t);
      pose.chest = [Math.sin(t * 1.6) * 0.012, 0, 0];
      man.setPose(pose); man.setMouth(mouth);
      orient(man.root, B.up, B.front);
      man.root.position.copy(B.p).addScaledVector(B.up, -0.9);
      // skin: acid then blue
      const ak = smooth(range(t, 13.4, 16.3)) * (1 - 0.6 * smooth(range(t, 17.2, 19.0)));
      const bk = smooth(range(t, 22.4, 25.6));
      M.skin.color.copy(SKIN0).lerp(ACIDSKIN, ak).lerp(BLUE, bk);
      M.skin.emissive = M.skin.emissive || new THREE.Color(); M.skin.emissive.setRGB(0.08 * ak, 0.14 * ak, 0);
      // fizz while in acid, air bubbles in the hook
      fizz.position.set(B.p.x, L - 0.05, B.p.z); fizz.update(t, 0.6, t > 12.4 && t < 17.3 ? 1 : t > 17.3 && t < 19 ? 0.3 : 0);
      fizz.visible = t > 12.3 && t < 19.2;
      air.position.copy(B.p).add(V(0, 0.75, 0.12)); air.update(t, 1.2, t < 2.4 ? 1 : 0); air.visible = t < 2.5;
      // oxygen tokens around his head, blinking out one by one
      const head = B.p.clone().addScaledVector(B.up, 0.75).add(V(0, 0.2, 0));
      o2.forEach((s, i) => {
        const a = t * 0.8 + i * Math.PI / 3, appear = smooth(range(t, 21.6, 22.2)), gone = range(t, 22.6 + i * 0.5, 22.9 + i * 0.5);
        s.position.copy(head).add(V(Math.cos(a) * 0.5, 0.12 + Math.sin(a * 2) * 0.05, Math.sin(a) * 0.5));
        s.scale.setScalar(0.22 * appear * (1 - gone) + (gone > 0 && gone < 1 ? 0.15 * Math.sin(gone * Math.PI) : 0));
        s.material.opacity = 1 - gone; s.visible = t > 21.6 && gone < 1;
      });
      // light + shadows follow him
      key.target.position.copy(B.p); key.position.copy(B.p).add(SUN);
      // camera
      const [cp, lk] = track(t, B.p);
      const sh = shake(t, 0.6 + 1.5 * smooth(range(t, 2.4, 2.8)) * (1 - smooth(range(t, 3.2, 3.8))) + 0.8 * smooth(range(t, 4.2, 4.6)) * (1 - smooth(range(t, 8.2, 8.6))), 3);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      labels.forEach(([sp, lp, a, b]) => {
        const k = smooth(range(t, a, a + 0.3)) * (1 - smooth(range(t, b - 0.3, b)));
        sp.visible = k > 0.01; sp.material.opacity = k;
        // pinned near the top of the screen, above the action
        const fw = new THREE.Vector3(); c.getWorldDirection(fw);
        const upv = new THREE.Vector3(0, 1, 0).applyQuaternion(c.quaternion);
        sp.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.42);
        sp.scale.set(0.36, 0.09, 1);
      });
      const fd = cp.distanceTo(lk);
      return { dof: { focus: fd, aperture: fd < 3 ? 0.0015 : 0.0004, maxblur: 0.006 }, bloom: 0.35 + 0.25 * ak * glow };
    },
  };
}

export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
