import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { slideMats, tubeSection, tubeWater, bubbles, spray, pressureRing, slideTower, makePool, rippleWater, orient } from './slide.js';

export const DURATION = 30.92;

// [start, text, end?]
export const CAPTIONS = [
  [0.10, 'What should you'], [0.66, 'do if you'], [1.18, 'get trapped inside'], [2.14, 'a flooding water'], [2.86, 'slide?'],
  [3.69, 'Most people panic'], [4.69, 'and try to climb'], [5.36, 'backwards'],
  [6.29, 'but the'], [6.59, 'ultra-slippery'], [7.40, 'walls make that'], [8.09, 'impossible'],
  [9.10, 'The secret is to'], [9.98, 'stay completely calm'],
  [11.67, 'First'], [12.54, 'tilt your head'], [13.25, 'back to breathe'], [13.94, 'from any remaining'], [14.88, 'pockets of air'],
  [16.00, 'As the water'], [16.52, 'keeps rising'],
  [17.60, 'try using your'], [18.36, 'hands to propel'], [19.21, 'yourself down'], [19.83, 'the tube'],
  [20.66, "If you're completely"], [21.57, 'jammed'], [22.27, 'just brace yourself'], [23.40, 'and let the slide'], [24.17, 'fill up entirely'],
  [25.52, 'Once the water'], [26.11, 'pressure equalizes'], [27.44, "you'll be able"], [27.92, 'to easily push'], [28.74, 'forward and float'], [29.62, 'out to safety', 30.72],
];
// one continuous shot: no cuts, no dips
export const FADES = [];

const R = 0.4, LEN = 14, TILT = 0.18, H = 2.55, EXIT = LEN / 2;
const Y0 = -R + 0.13;                         // body axis height inside the tube (slide-local)
const idle = (t, k = 1) => Math.sin(t * 1.6) * 0.012 * k;

// ---------------- the man's story, as functions of time ----------------
// feet position along the tube (slide-local z); head is ~1.75 up-slope (-z)
function feetZ(t) {
  let z = 0;
  if (t > 3.6) z += Math.min(t, 6.25) - 3.6 > 0 ? (Math.min(t, 6.25) - 3.6) * 0.15 + 0.05 * Math.sin(t * 7) * (t < 6.25 ? 1 : 0) : 0;
  z += 0.9 * easeIn(range(t, 6.4, 8.6));
  // propel: three strokes
  if (t > 17.6) {
    const tt = Math.min(t, 20.6) - 17.6, P = 1.25, n = Math.floor(tt / P), ph = (tt / P) % 1;
    z += Math.min(n, 2) * 0.55 + (n > 2 ? 0.55 : ph < 0.55 ? easeOut(ph / 0.55) * 0.45 : 0.45 + (ph - 0.55) / 0.45 * 0.1);
  }
  z += 0.12 * Math.sin(Math.PI * range(t, 20.6, 21.1)) - 0.12 * smooth(range(t, 22.2, 22.8)); // bump into the bend, brace back
  if (t > 27.6) z += (t - 27.6) ** 2 * 2.6;  // shoots off down the tube
  return z;
}
const PRONE = (t) => smooth(range(t, 3.6, 3.95)) * (1 - smooth(range(t, 9.0, 9.4)));
function waterLevel(t) {
  let h = -R;
  h = lerp(-0.34, -0.28, easeOut(range(t, 0, 1.8)));
  h = lerp(h, -0.13, smooth(range(t, 11.6, 13.8)));
  h = lerp(h, -0.02, easeInOut(range(t, 16.0, 17.6)));
  h = lerp(h, R + 0.03, easeIn(range(t, 23.4, 25.1)));
  h = lerp(h, -0.3, smooth(range(t, 28.0, 29.2)));      // flushes out with him
  return h;
}
const LIE = { lSh: [0, 0, 0.14], rSh: [0, 0, -0.14], lEl: [-0.12, 0, 0], rEl: [-0.12, 0, 0], lHip: [0, 0, 0.05], rHip: [0, 0, -0.05] };
const HEADBACK = { spine: [0.22, 0, 0], chest: [0.08, 0, 0], neck: [-0.45, 0, 0], head: [-0.3, 0, 0] };
function mixPose(a, b, k) {
  const o = {}; for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const va = a[key] || [0, 0, 0], vb = b[key] || [0, 0, 0]; o[key] = va.map((x, i) => lerp(x, vb[i], k));
  } return o;
}
function poseAt(t) {
  let mouth = 0, p;
  if (t < 9.2 && PRONE(t) > 0.5) {               // panic climb, then slipping
    const sp = t < 6.4 ? 7 : 4.5, sw = Math.sin(t * sp), fl = t < 6.4 ? 1 : 0.7;
    p = {
      lSh: [-3.0 + 0.25 * sw * fl, 0, -0.35], rSh: [-3.0 - 0.25 * sw * fl, 0, 0.35], lEl: [-0.1 - 0.35 * Math.max(0, sw), 0, 0], rEl: [-0.1 - 0.35 * Math.max(0, -sw), 0, 0],
      neck: [-0.55, 0.1 * sw, 0], head: [-0.25, 0, 0],
      lHip: [-0.35 - 0.25 * sw, 0, 0.12], rHip: [-0.35 + 0.25 * sw, 0, -0.12], lKn: [0.7 + 0.3 * sw, 0, 0], rKn: [0.7 - 0.3 * sw, 0, 0],
    };
    mouth = 0.55 + 0.25 * Math.abs(Math.sin(t * 5));
  } else if (t < 11.6) {                          // flood startle, later calm
    const st = (1 - smooth(range(t, 8.0, 9.0)));
    const br = Math.sin(t * 1.8) * (t > 9 ? 1 : 0);
    p = mixPose(LIE, { ...LIE, neck: [0.35, 0.4, 0], head: [0.2, 0.2, 0], lEl: [-0.9, 0, 0], rEl: [-0.9, 0, 0] }, st);
    p.chest = [-0.03 * br, 0, 0]; if (t > 9) p.neck = [0.12, 0, 0];
    mouth = (0.5 + 0.15 * Math.abs(Math.sin(t * 4))) * st;
  } else if (t < 17.6) {                          // tilt head back into the air pocket
    const k = smooth(range(t, 12.5, 13.4));
    p = mixPose(LIE, { ...LIE, ...HEADBACK }, k);
    mouth = 0.12 * k + 0.06 * k * Math.max(0, Math.sin(t * 3));
  } else if (t < 20.6) {                          // strokes down the tube
    const ph = ((t - 17.6) / 1.25) % 1;
    const push = ph < 0.55 ? easeInOut(ph / 0.55) : 1 - easeInOut((ph - 0.55) / 0.45);
    const ab = lerp(2.3, 0.55, push);
    const k = smooth(range(t, 17.6, 17.9));
    p = mixPose({ ...LIE, ...HEADBACK }, { ...HEADBACK, lSh: [-0.55, 0, ab], rSh: [-0.55, 0, -ab], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.05], rHip: [0, 0, -0.05] }, k);
    mouth = 0.1;
  } else if (t < 25.5) {                          // jammed: brace arms and knees
    const br = smooth(range(t, 22.2, 22.8)), strain = br * (0.5 + 0.5 * Math.sin(t * 17)) * 0.015;
    p = {
      ...HEADBACK, spine: [0.22, 0, strain],
      lSh: [lerp(-0.55, -0.5, br), 0, lerp(0.55, 1.25, br)], rSh: [lerp(-0.55, -0.5, br), 0, -lerp(0.55, 1.25, br)],
      lEl: [lerp(-0.25, -1.0, br), 0, 0], rEl: [lerp(-0.25, -1.0, br), 0, 0],
      lHip: [lerp(0, -0.75, br), 0, 0.12], rHip: [lerp(0, -0.75, br), 0, -0.12], lKn: [lerp(0, 1.1, br), 0, 0], rKn: [lerp(0, 1.1, br), 0, 0],
    };
    mouth = 0.25 * br + 0.2 * (1 - br);
  } else {                                        // equalized: relax, streamline, then float
    const rel = smooth(range(t, 25.5, 26.3)), go = easeIn(range(t, 27.3, 27.8)), star = smooth(range(t, 29.8, 30.6));
    const ab = lerp(lerp(1.25, 0.9, rel), 0.25, go);
    p = {
      lSh: [-0.5 * (1 - go), 0, lerp(ab, 1.4, star)], rSh: [-0.5 * (1 - go), 0, -lerp(ab, 1.4, star)],
      lEl: [-0.5 * (1 - go), 0, 0], rEl: [-0.5 * (1 - go), 0, 0],
      lHip: [lerp(-0.75, 0, rel), 0, lerp(0.12, 0.3, star)], rHip: [lerp(-0.75, 0, rel), 0, -lerp(0.12, 0.3, star)], lKn: [lerp(1.1, 0, rel), 0, 0], rKn: [lerp(1.1, 0, rel), 0, 0],
      neck: [lerp(-0.3, 0.2, star), 0, 0], head: [-0.2 * (1 - star), 0, 0],
    };
    mouth = t > 28.6 && t < 29.6 ? 0.45 : 0.08 * star;
  }
  p.chest = [(p.chest?.[0] || 0) + idle(t), p.chest?.[1] || 0, p.chest?.[2] || 0];
  return { p, mouth };
}

// ---------------- camera path: [time, offset from body centre, look offset] (slide-local) ----------------
const CAM = [
  [0.0, [0.75, 0.32, -0.45], [0, -0.17, -0.78]],
  [1.4, [0.95, 0.4, -0.35], [0, -0.18, -0.72]],
  [1.95, [1.2, 0.5, -0.2], [0, -0.18, -0.65]],
  [2.75, [4.5, 6.5, 15.5], [0, -0.6, 1.2]],
  [3.3, [4.8, 6.9, 16.2], [0, -0.6, 0.9]],
  [4.1, [1.6, 0.55, -1.2], [0, -0.15, -0.75]],
  [4.8, [1.55, 0.5, -1.3], [0, -0.15, -0.75]],
  [6.3, [1.65, 0.45, -1.1], [0, -0.2, -0.7]],
  [8.5, [2.1, 0.4, -0.7], [0, -0.3, -0.6]],
  [10.6, [1.25, 0.6, 0.0], [0, -0.2, -0.6]],
  [12.6, [1.0, 0.35, 0.15], [0, -0.2, -0.75]],
  [15.6, [0.95, 0.3, 0.05], [0, -0.2, -0.75]],
  [17.0, [2.8, 0.6, 0.6], [0, -0.1, -0.1]],
  [18.4, [2.4, 0.7, 0.1], [0, -0.22, -0.4]],
  [20.3, [2.3, 0.7, 0.1], [0, -0.22, -0.4]],
  [21.7, [1.5, 0.4, -0.3], [0, -0.18, -0.6]],
  [24.8, [2.7, 0.6, 0.6], [0, -0.18, -0.3]],
  [27.4, [3.0, 0.55, 0.3], [0, -0.1, -0.2]],
  [28.5, [3.2, 0.9, -0.6], [0, -0.1, 0.4]],
  [29.6, [3.9, 1.7, -1.6], [0, -0.45, 0.3]],
  [30.92, [4.4, 2.3, -2.3], [0, -0.5, 0.2]],
];
// cubic Hermite through time-keyed vectors (smooth velocity, no stops)
function track(t, idx) {
  const K = CAM, n = K.length;
  if (t <= K[0][0]) return K[0][idx];
  if (t >= K[n - 1][0]) return K[n - 1][idx];
  let i = 0; while (K[i + 1][0] < t) i++;
  const [t0, t1] = [K[i][0], K[i + 1][0]], u = (t - t0) / (t1 - t0);
  const P = (j) => K[clamp(j, 0, n - 1)][idx], T = (j) => K[clamp(j, 0, n - 1)][0];
  const tan = (j) => P(j + 1).map((x, c) => (x - P(j - 1)[c]) / Math.max(1e-3, T(j + 1) - T(j - 1)) * (t1 - t0));
  const m0 = tan(i), m1 = tan(i + 1), p0 = P(i), p1 = P(i + 1);
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  return p0.map((x, c) => h00 * x + h10 * m0[c] + h01 * p1[c] + h11 * m1[c]);
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 3, sunDir: [-2, 7, 3] });
  const key = scene.userData.key, SUN = V(-2, 7, 3);
  const M = slideMats();
  // background tower + deck
  const bg = slideTower(); bg.position.set(-9, 0, 4); bg.rotation.y = 0.6; scene.add(bg);
  // our slide: long straight cut-away tube
  const slide = new THREE.Group(); slide.position.y = H; slide.rotation.x = TILT; scene.add(slide);
  slide.add(tubeSection(LEN, R));
  const water = tubeWater(LEN, R); slide.add(water);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(R - 0.02, 0.035, 10, 72, Math.PI * 2 - 1.9), M.stripe);
  collar.rotation.z = 0.95; collar.position.z = 3.3; slide.add(collar);
  for (let z = -6; z <= 6; z += 3) {
    const y = H - z * Math.sin(TILT) - R - 0.03;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, y, 12), M.support);
    p.position.set(0, y / 2, z * Math.cos(TILT)); p.castShadow = true; scene.add(p);
  }
  const towerTop = H + (LEN / 2) * Math.sin(TILT);
  const tw = new THREE.Mesh(new THREE.BoxGeometry(1.6, towerTop, 1.6), M.support); tw.position.set(0, towerTop / 2 - 0.4, -(LEN / 2) * Math.cos(TILT) - 0.8); tw.castShadow = true; scene.add(tw);
  // pool at the exit
  scene.updateMatrixWorld(true);
  const exitW = slide.localToWorld(V(0, Y0, EXIT));
  const pool = makePool(4.5, 6); pool.position.set(0, 0, exitW.z + 3.0); scene.add(pool);
  // man
  const man = makeHuman('swim'); slide.add(man.root);
  const qSup = new THREE.Quaternion(), qPrn = new THREE.Quaternion(), qLvl = new THREE.Quaternion();
  orient(man.root, V(0, 0, -1), V(0, 1, 0)); qSup.copy(man.root.quaternion);
  orient(man.root, V(0, 0, -1), V(0, -1, 0)); qPrn.copy(man.root.quaternion);
  qLvl.setFromAxisAngle(V(1, 0, 0), -TILT).multiply(qSup);
  // effects
  const bb = bubbles(70, { box: [0.5, 0.75, 2.4], speed: 0.25, size: 0.011, seed: 8 }); slide.add(bb);
  const gush = spray(90, { speed: 1.6, spread: 0.5, gravity: -3, life: 0.6, size: 0.03, seed: 3, dir: V(0, 0.1, 1) }); slide.add(gush);
  const rings = [0, 1, 2, 3].map(() => { const r = pressureRing(R); slide.add(r); return r; });
  const flash = glowSprite(0x9fe6ff, 1.2); slide.add(flash);
  const jet = spray(110, { speed: 2.6, spread: 0.3, gravity: -9, life: 0.6, size: 0.06, seed: 5, dir: V(0, 0.05, 1) }); jet.position.copy(exitW); scene.add(jet);
  const splash = spray(220, { speed: 3.0, spread: 0.6, gravity: -9, life: 1.1, size: 0.07, seed: 31, dir: V(0, 1, 0.3) }); scene.add(splash);
  const c = cam(40);
  let tLand = null, landP = null;
  // where is the body centre at time t (world), and orientation blend after the exit
  const cw = new THREE.Vector3();
  function centre(t) {
    const cz = feetZ(t) - 0.9;
    if (cz <= EXIT) return { p: slide.localToWorld(V(0, Y0, cz)), lvl: 0, u: 0 };
    const u = cz - EXIT;
    const dir = V(0, -Math.sin(TILT), Math.cos(TILT));
    let p = exitW.clone().addScaledVector(dir, Math.min(u, 0.3));
    const a = Math.max(0, u - 0.3);
    p.z += a; p.y -= a * Math.tan(TILT) + 0.35 * a * a;
    if (p.y <= 0.12) { // landed: find landing distance, then glide to a stop
      let aL = 0; while (exitW.y - 0.3 * Math.sin(TILT) - aL * Math.tan(TILT) - 0.35 * aL * aL > 0.12) aL += 0.01;
      const z0 = exitW.z + 0.3 * Math.cos(TILT) + aL;
      p = V(0, 0.12, z0 + (1 - Math.exp(-(a - aL) / 0.9)) * 0.9);
    }
    return { p, lvl: smooth(range(u, 0, 1.0)), u };
  }
  return {
    scene, camera: c,
    update(t) {
      const cl0z = feetZ(0) - 0.9;
      // water + flood
      const lvl = waterLevel(t); water.setLevel(lvl);
      gush.position.set(0, lvl + 0.03, cl0z - 0.4); gush.update(t < 3.2 ? t % 0.6 : -1);
      // man
      const { p, mouth } = poseAt(t); man.setPose(p); man.setMouth(mouth);
      const C = centre(t);
      const q = qSup.clone().slerp(qPrn, PRONE(t)); if (C.lvl > 0) q.slerp(qLvl, C.lvl);
      man.root.quaternion.copy(q);
      const cl = slide.worldToLocal(C.p.clone());
      const up = V(0, 1, 0).applyQuaternion(q);
      man.root.position.copy(cl).addScaledVector(up, -0.9);
      // bubbles follow him while underwater-ish
      bb.position.set(0, -R + 0.05, cl.z + 0.2); bb.update(t, clamp(lvl + R - 0.05, 0.01, 0.75), t > 11.6 && t < 28 ? 1 : 0);
      // pressure fronts meet at his chest
      const TM = 26.7;
      rings.forEach((r, i) => {
        const side = i % 2 ? 1 : -1, lag = (i >> 1) * 0.35, t0 = 25.5 + lag;
        const k = easeOut(range(t, t0, TM + lag));
        r.position.z = cl.z + side * lerp(3.6, 0.05, k);
        r.material.opacity = 0.85 * (1 - smooth(range(t, TM + lag, TM + lag + 0.4)));
        r.visible = t > t0 && t < TM + lag + 0.45;
      });
      flash.position.set(0, 0, cl.z); flash.material.opacity = t > TM - 0.2 ? 0.5 * Math.exp(-Math.abs(t - TM - 0.2) * 3) : 0;
      // exit jet + landing splash + pool ripples
      jet.update(t > 28.3 && t < 29.6 ? (t - 28.3) % 0.6 : -1);
      if (C.p.y <= 0.121 && tLand === null) { tLand = t; landP = C.p.clone(); }
      if (tLand !== null && t < tLand) { tLand = null; }
      // landing time is deterministic: search backwards when rendering out of order
      let tl = null; for (let s = 28.5; s < 30.9; s += 0.02) { if (centre(s).p.y <= 0.121) { tl = s; break; } }
      const lp = tl ? centre(tl).p : exitW;
      splash.position.copy(lp); splash.update(tl ? t - tl : -1);
      const pl = pool.worldToLocal(lp.clone());
      rippleWater(pool.userData.water, tl && t > tl ? t - tl : 0, pl.x, pl.z, tl && t > tl ? 0.05 : 0);
      // light + shadows follow him
      key.target.position.copy(C.p); key.position.copy(C.p).add(SUN);
      // camera
      const off = track(t, 1), lo = track(t, 2);
      const camL = V(off[0], off[1], cl.z + off[2]);
      const lookL = V(lo[0], lo[1], cl.z + lo[2]);
      if (C.u > 0) { camL.y += 0; }
      const a = slide.localToWorld(camL), b = slide.localToWorld(lookL);
      const s = shake(t, 0.7 + 1.2 * smooth(range(t, 3.6, 4.0)) * (1 - smooth(range(t, 8.6, 9.2))) + 1.2 * smooth(range(t, 22.2, 22.6)) * (1 - smooth(range(t, 24.6, 25.3))), 5);
      place(c, [a.x + s[0], a.y + s[1], a.z + s[2]], [b.x, b.y, b.z]);
      return { dof: { focus: a.distanceTo(b), aperture: 0.0015, maxblur: 0.006 }, bloom: 0.3 + 0.25 * Math.exp(-Math.abs(t - TM) * 2) };
    },
  };
}

export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
