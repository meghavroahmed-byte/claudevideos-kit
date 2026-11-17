import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite, streak } from './props.js';
import { kf, lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { slideMats, tubeSection, tubeWater, bubbles, spray, pressureRing, slideTower, rippleWater, orient } from './slide.js';

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
// [fadeInStart, fullStart, fullEnd, fadeOutEnd] to black
export const FADES = [[8.86, 9.0, 9.04, 9.2]];

const R = 0.4, LEN = 9, TILT = 0.1, H = 2.3;
const UPS = V(0, 0, -1);          // head toward -z (up the slide)
const SUP = V(0, 1, 0), PRN = V(0, -1, 0);
function idle(t, k = 1) { return Math.sin(t * 1.6) * 0.012 * k; }

// a straight piece of slide, cut away so we see inside, with a man and water
function tubeScene(makeStage, { prone = false, sunDir = [-2, 7, 3] } = {}) {
  const scene = makeStage({ shadowSize: 3, sunDir });
  const slide = new THREE.Group(); slide.position.y = H; slide.rotation.x = TILT; scene.add(slide);
  const tube = tubeSection(LEN, R); slide.add(tube);
  const water = tubeWater(LEN, R); slide.add(water);
  const M = slideMats();
  for (const z of [-3.2, 0.5, 3.6]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4, 12), M.support);
    p.position.set(0, H - 2 - 0.43 - z * Math.sin(TILT), z); p.castShadow = true; scene.add(p);
  }
  const man = makeHuman('swim'); slide.add(man.root);
  orient(man.root, UPS, prone ? PRN : SUP);
  man.root.position.set(0, -R + 0.13, 0.85);
  scene.updateMatrixWorld(true);
  const W = (x, y, z) => slide.localToWorld(V(x, y, z));
  const look = (c, p, l, s = [0, 0, 0]) => { const a = W(...p), b = W(...l); place(c, [a.x + s[0], a.y + s[1], a.z + s[2]], [b.x, b.y, b.z]); };
  return { scene, slide, tube, water, man, W, look };
}
// body centre z when the man's feet are at fz
const LIE = {
  lSh: [0, 0, 0.14], rSh: [0, 0, -0.14], lEl: [-0.12, 0, 0], rEl: [-0.12, 0, 0],
  lHip: [0, 0, 0.05], rHip: [0, 0, -0.05],
};
function pose(h, base, extra = {}, t = 0) {
  const p = { ...base, ...extra };
  p.chest = [(extra.chest?.[0] || 0) + idle(t), extra.chest?.[1] || 0, extra.chest?.[2] || 0];
  h.setPose(p);
}

// ============ SHOT 1: the slide tower, water gushing out of the exit ============
function shot1({ makeStage }) {
  const scene = makeStage({ shadowSize: 9, sunDir: [-4, 9, 5] });
  const tw = slideTower(); scene.add(tw);
  const { exitP, exitT, poolWater, pool } = tw.userData;
  const jets = [0, 1, 2, 3].map(i => { const s = spray(90, { speed: 2.6, spread: 0.35, gravity: -9, life: 0.7, size: 0.09, seed: 11 + i, dir: exitT.clone().add(V(0, 0.15, 0)) }); s.position.copy(exitP); scene.add(s); return s; });
  const c = cam(40);
  return {
    scene, camera: c,
    update(t) {
      jets.forEach((j, i) => j.update((t + i * 0.18) % 0.72));
      rippleWater(poolWater, t + 2, 0, -2.2, 0.025);
      const k = easeInOut(range(t, 0, 1.8));
      place(c, [lerp(10.5, 8.6, k), lerp(2.6, 3.0, k), lerp(9.5, 7.8, k)], [0.4, lerp(3.0, 3.3, k), 0.3]);
      return { dof: { focus: 11, aperture: 0.0005, maxblur: 0.004 } };
    },
  };
}

// ============ SHOT 2: inside — water floods in behind him ============
function shot2({ makeStage }) {
  const S = tubeScene(makeStage);
  const sp = spray(80, { speed: 1.6, spread: 0.5, gravity: -3, life: 0.6, size: 0.03, seed: 3, dir: V(0, 0.1, 1) });
  S.slide.add(sp);
  const c = cam(38);
  return {
    scene: S.scene, camera: c,
    update(t) {
      const lvl = lerp(-R, -0.27, easeOut(range(t, 0.1, 1.6)));
      S.water.setLevel(lvl);
      sp.position.set(0, lvl + 0.03, lerp(-4.5, -0.4, easeOut(range(t, 0, 0.9)))); sp.update(t % 0.6);
      const startle = smooth(range(t, 0.5, 0.9));
      pose(S.man, LIE, { neck: [0.35 * startle, 0.4 * startle, 0], head: [0.2 * startle, 0.2 * startle, 0], lEl: [-0.9 * startle, 0, 0], rEl: [-0.9 * startle, 0, 0] }, t);
      S.man.setMouth(0.55 * startle);
      const k = easeInOut(range(t, 0, 1.8));
      S.look(c, [lerp(2.2, 1.8, k), lerp(0.8, 0.65, k), lerp(1.2, 0.6, k)], [0, -0.22, lerp(-0.45, -0.6, k)], shake(t, 0.8));
      return { dof: { focus: 2.1, aperture: 0.001, maxblur: 0.006 }, bloom: 0.3 };
    },
  };
}

// ============ SHOT 3: panic — climbing backwards, sliding back down ============
function climb(S, t) {
  const sw = Math.sin(t * 7);
  pose(S.man, {}, {
    lSh: [-3.0 + 0.25 * sw, 0, -0.35], rSh: [-3.0 - 0.25 * sw, 0, 0.35], lEl: [-0.1 - 0.35 * Math.max(0, sw), 0, 0], rEl: [-0.1 - 0.35 * Math.max(0, -sw), 0, 0],
    neck: [-0.55, 0.1 * sw, 0], head: [-0.25, 0, 0],
    lHip: [-0.35 - 0.25 * sw, 0, 0.12], rHip: [-0.35 + 0.25 * sw, 0, -0.12], lKn: [0.7 + 0.3 * sw, 0, 0], rKn: [0.7 - 0.3 * sw, 0, 0],
  }, t);
  S.man.setMouth(0.55 + 0.25 * Math.abs(Math.sin(t * 5)));
}
function shot3({ makeStage }) {
  const S = tubeScene(makeStage, { prone: true });
  S.water.setLevel(-0.33);
  const c = cam(40);
  return {
    scene: S.scene, camera: c,
    update(t) {
      climb(S, t);
      // tries to go up (-z) but drifts back down
      const z = 0.3 + 0.05 * Math.sin(t * 7) + t * 0.18;
      S.man.root.position.set(0, -R + 0.13, z);
      const k = easeInOut(range(t, 0, 2.65));
      S.look(c, [lerp(1.7, 1.45, k), lerp(0.45, 0.5, k), lerp(-2.6, -2.2, k)], [0, -0.15, lerp(-0.9, -0.7, k)], shake(t, 1.6, 2));
      return { dof: { focus: 1.9, aperture: 0.0012, maxblur: 0.006 }, bloom: 0.3 };
    },
  };
}

// ============ SHOT 4: close on the hand slipping on the wet wall ============
function shot4({ makeStage }) {
  const S = tubeScene(makeStage, { prone: true });
  S.water.setLevel(-0.33);
  const tr1 = streak(0xffffff), tr2 = streak(0xffffff); S.scene.add(tr1, tr2);
  const c = cam(44);
  let start = null;
  return {
    scene: S.scene, camera: c,
    update(t) {
      climb(S, 0.35);
      const slip = easeIn(range(t, 0.25, 2.2));
      S.man.root.position.set(0, -R + 0.13, 0.3 + slip * 0.9);
      const rz = 0.3 + slip * 0.9;
      const hl = [0.18, -R + 0.04, rz - 1.95], hr = [-0.18, -R + 0.04, rz - 1.95];
      tr1.set(S.W(...hl), S.W(hl[0], hl[1], hl[2] - slip * 0.9), 0.006, 0.45 * slip);
      tr2.set(S.W(...hr), S.W(hr[0], hr[1], hr[2] - slip * 0.9), 0.006, 0.45 * slip);
      const k = easeInOut(range(t, 0, 2.75));
      const s = shake(t, 1.2, 4);
      S.look(c, [2.0, 0.35, lerp(-1.8, -1.2, k)], [0, -0.4, lerp(-1.45, -0.8, k)], s);
      const cp = c.position, f = S.W(0, -0.25, lerp(-1.45, -0.8, k));
      return { dof: { focus: cp.distanceTo(f), aperture: 0.0015, maxblur: 0.006 }, bloom: 0.4 };
    },
  };
}

// ============ SHOT 5: stay calm ============
function shot5({ makeStage }) {
  const S = tubeScene(makeStage);
  S.water.setLevel(-0.27);
  const c = cam(36);
  return {
    scene: S.scene, camera: c,
    update(t) {
      const br = Math.sin(t * 1.8);
      pose(S.man, LIE, { chest: [-0.03 * br, 0, 0], neck: [0.12, 0, 0] }, 0);
      S.man.setMouth(0);
      const k = easeInOut(range(t, 0, 2.7));
      S.look(c, [lerp(1.5, 0.95, k), lerp(0.9, 0.55, k), lerp(0.2, -0.9, k)], [0, -0.2, lerp(-0.4, -0.85, k)]);
      return { dof: { focus: 1.2, aperture: 0.002, maxblur: 0.006 }, bloom: 0.3 };
    },
  };
}

// ============ SHOT 6: water rises, tilt head back into the air pocket ============
function shot6({ makeStage }) {
  const S = tubeScene(makeStage);
  const bb = bubbles(50, { box: [0.3, 0.3, 1.4], speed: 0.18, size: 0.01, seed: 8 }); S.slide.add(bb);
  const air = glowSprite(0xcff4ff, 0.6); S.slide.add(air);
  const c = cam(34);
  return {
    scene: S.scene, camera: c,
    update(t) {
      const lvl = lerp(-0.27, -0.13, smooth(range(t, 0, 2.2)));
      S.water.setLevel(lvl);
      bb.position.set(0, -R + 0.05, -0.3); bb.update(t, lvl - (-R + 0.05));
      const tilt = smooth(range(t, 0.9, 1.9));
      pose(S.man, LIE, { spine: [0.22 * tilt, 0, 0], chest: [0.08 * tilt, 0, 0], neck: [-0.45 * tilt, 0, 0], head: [-0.3 * tilt, 0, 0] }, t);
      S.man.setMouth(0.12 * tilt + 0.06 * tilt * Math.max(0, Math.sin(t * 3)));
      air.position.set(-0.05, R - 0.12, -0.9); air.material.opacity = 0.35 * smooth(range(t, 2.4, 3.2));
      const k = easeInOut(range(t, 0, 4.4));
      S.look(c, [lerp(1.35, 1.0, k), lerp(0.45, 0.3, k), lerp(-0.1, -0.45, k)], [0, -0.2, -0.95], shake(t, 0.5, 6));
      return { dof: { focus: 0.95, aperture: 0.004, maxblur: 0.008 }, bloom: 0.45 };
    },
  };
}

// ============ SHOT 7: wide — the water keeps rising ============
function shot7({ makeStage }) {
  const S = tubeScene(makeStage);
  const bb = bubbles(60, { box: [0.5, 0.4, 3], speed: 0.25, size: 0.012, seed: 9 }); S.slide.add(bb);
  const c = cam(40);
  return {
    scene: S.scene, camera: c,
    update(t) {
      const lvl = lerp(-0.13, -0.02, easeInOut(range(t, 0, 1.6)));
      S.water.setLevel(lvl);
      bb.position.set(0, -R + 0.05, 0); bb.update(t + 3, lvl - (-R + 0.05));
      pose(S.man, LIE, { spine: [0.22, 0, 0], chest: [0.08, 0, 0], neck: [-0.45, 0, 0], head: [-0.3, 0, 0] }, t);
      S.man.setMouth(0.12);
      const k = easeInOut(range(t, 0, 1.6));
      S.look(c, [lerp(2.8, 3.1, k), lerp(0.45, 0.6, k), lerp(-0.3, -0.1, k)], [0, lerp(-0.15, -0.05, k), -0.85]);
      return { dof: { focus: 3.3, aperture: 0.001, maxblur: 0.004 }, bloom: 0.35 };
    },
  };
}

// ============ SHOT 8: hands push him down the tube ============
function shot8({ makeStage }) {
  const S = tubeScene(makeStage);
  S.water.setLevel(-0.06);
  const bb = bubbles(40, { box: [0.6, 0.3, 2.2], speed: 0.3, size: 0.012, seed: 4 }); S.slide.add(bb);
  const c = cam(40);
  const P = 1.25; // stroke period
  return {
    scene: S.scene, camera: c,
    update(t) {
      const ph = (t / P) % 1, n = Math.floor(t / P);
      const push = ph < 0.55 ? easeInOut(ph / 0.55) : 1 - easeInOut((ph - 0.55) / 0.45); // 1 = arms swept to the feet
      const ab = lerp(2.3, 0.55, push);
      pose(S.man, LIE, {
        lSh: [-0.55, 0, ab], rSh: [-0.55, 0, -ab], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0],
        spine: [0.22, 0, 0], chest: [0.08, 0, 0], neck: [-0.45, 0, 0], head: [-0.3, 0, 0],
      }, t);
      S.man.setMouth(0.1);
      // forward glide: moves on the push, coasts on the recovery
      const glide = (k) => n * 0.55 + (ph < 0.55 ? easeOut(ph / 0.55) * 0.45 : 0.45 + (ph - 0.55) / 0.45 * 0.1);
      const z = 0.0 + glide();
      S.man.root.position.set(0, -R + 0.13, z);
      bb.position.set(0, -R + 0.05, z - 0.9); bb.update(t, 0.33);
      const k = easeInOut(range(t, 0, 3.0));
      S.look(c, [2.4, 0.7, z - 1.0], [0, -0.22, z - 1.45], shake(t, 0.5, 9));
      return { dof: { focus: 2.1, aperture: 0.0012, maxblur: 0.005 }, bloom: 0.35 };
    },
  };
}

// ============ SHOT 9: jammed at a bend — brace and let it fill ============
function shot9({ makeStage }) {
  const S = tubeScene(makeStage);
  const bb = bubbles(70, { box: [0.6, 0.75, 2.4], speed: 0.35, size: 0.012, seed: 14 }); S.slide.add(bb);
  // the bend: a wall closing the tube in front of his feet
  const bend = new THREE.Mesh(new THREE.SphereGeometry(R + 0.02, 48, 24, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, 0, Math.PI / 2), slideMats().tubeIn);
  bend.rotation.x = Math.PI / 2; bend.position.z = 1.0; S.slide.add(bend);
  const c = cam(38);
  return {
    scene: S.scene, camera: c,
    update(t) {
      const lvl = t < 2.9 ? lerp(-0.06, -0.02, range(t, 0, 2.9)) : lerp(-0.02, R + 0.02, easeIn(range(t, 2.9, 4.5)));
      S.water.setLevel(lvl);
      bb.position.set(0, -R + 0.05, -0.3); bb.update(t, Math.min(0.75, lvl + R - 0.05));
      const br = smooth(range(t, 1.5, 2.2));
      const strain = br * (0.5 + 0.5 * Math.sin(t * 17)) * 0.015;
      pose(S.man, LIE, {
        lSh: [lerp(0, -0.5, br), 0, lerp(0.14, 1.25, br)], rSh: [lerp(0, -0.5, br), 0, -lerp(0.14, 1.25, br)],
        lEl: [lerp(-0.12, -1.0, br), 0, 0], rEl: [lerp(-0.12, -1.0, br), 0, 0],
        lHip: [lerp(0, -0.75, br), 0, 0.12], rHip: [lerp(0, -0.75, br), 0, -0.12], lKn: [lerp(0, 1.1, br), 0, 0], rKn: [lerp(0, 1.1, br), 0, 0],
        spine: [0.22, 0, strain], chest: [0.08, 0, 0], neck: [-0.45, 0, 0], head: [-0.3, 0, 0],
      }, t);
      S.man.setMouth(0.25 * br + 0.2 * (1 - br));
      S.man.root.position.set(0, -R + 0.13, 0.15 - 0.35 * br);
      const k = easeInOut(range(t, 0, 4.9));
      S.look(c, [lerp(1.5, 2.7, k), lerp(0.35, 0.6, k), lerp(-1.3, -0.9, k)], [0, -0.18, lerp(-1.6, -1.35, k)], shake(t, 0.6 + 1.5 * br * (1 - range(t, 3.5, 4.9)), 13));
      return { dof: { focus: lerp(1.6, 2.8, k), aperture: 0.002, maxblur: 0.006 }, bloom: 0.35 };
    },
  };
}

// ============ SHOT 10: pressure equalizes (rings meet), he pushes off ============
function shot10({ makeStage }) {
  const S = tubeScene(makeStage);
  S.water.setLevel(R + 0.05);
  const bb = bubbles(60, { box: [0.6, 0.7, 3], speed: 0.2, size: 0.01, seed: 21 }); S.slide.add(bb);
  const rings = [0, 1, 2, 3].map(() => { const r = pressureRing(R); S.slide.add(r); return r; });
  const glow = glowSprite(0x9fe6ff, 1.2); S.slide.add(glow);
  const c = cam(40);
  const TM = 1.2; // rings meet
  return {
    scene: S.scene, camera: c,
    update(t) {
      bb.position.set(0, -R + 0.05, 0); bb.update(t + 5, 0.72);
      rings.forEach((r, i) => {
        const side = i % 2 ? 1 : -1, lag = (i >> 1) * 0.35;
        const k = easeOut(range(t, lag, TM + lag));
        r.position.z = -0.1 + side * lerp(3.6, 0.05, k);
        r.material.opacity = 0.85 * (1 - smooth(range(t, TM + lag, TM + lag + 0.4)));
        r.visible = t > lag;
      });
      glow.position.set(0, 0, -0.1); glow.material.opacity = 0.5 * Math.exp(-Math.abs(t - TM - 0.2) * 3) * (t > TM - 0.2 ? 1 : 0);
      const go = easeIn(range(t, 2.1, 2.7));
      pose(S.man, LIE, { lSh: [-0.5, 0, lerp(1.25, 0.4, go)], rSh: [-0.5, 0, -lerp(1.25, 0.4, go)], lEl: [-0.5, 0, 0], rEl: [-0.5, 0, 0], neck: [-0.3, 0, 0], head: [-0.2, 0, 0] }, t);
      S.man.setMouth(0);
      S.man.root.position.set(0, -R + 0.13, -0.2 + go * 2.5);
      S.look(c, [lerp(3.2, 2.9, range(t, 0, 2.7)), 0.55, -1.0 + go * 1.6], [0, -0.1, -1.45 + go * 2.0]);
      return { dof: { focus: 3.4, aperture: 0.001, maxblur: 0.004 }, bloom: 0.55 };
    },
  };
}

// ============ SHOT 11: he shoots out of the exit and floats in the pool ============
function shot11({ makeStage }) {
  const scene = makeStage({ shadowSize: 5, sunDir: [-3, 8, 4] });
  const tw = slideTower(); scene.add(tw);
  const { exitP, exitT, poolWater, pool, poolCenter } = tw.userData;
  const man = makeHuman('swim'); scene.add(man.root);
  const side = V(-exitT.z, 0, exitT.x);
  const T0 = 0.35, TL = 0.95;
  const land = exitP.clone().addScaledVector(exitT, 1.9).setY(0.13);
  const splash = spray(220, { speed: 3.2, spread: 0.6, gravity: -9, life: 1.1, size: 0.07, seed: 31, dir: V(0, 1, 0).addScaledVector(exitT, 0.3) });
  splash.position.copy(land); scene.add(splash);
  const jet = spray(90, { speed: 2.4, spread: 0.3, gravity: -9, life: 0.6, size: 0.07, seed: 5, dir: exitT.clone().add(V(0, 0.15, 0)) });
  jet.position.copy(exitP); scene.add(jet);
  const c = cam(42);
  return {
    scene, camera: c,
    update(t) {
      jet.update(t % 0.62);
      const lp = pool.worldToLocal(land.clone());
      rippleWater(poolWater, Math.max(0, t - TL), lp.x, lp.z, t > TL ? 0.05 : 0);
      splash.update(t - TL);
      let p, upv;
      if (t < TL) {
        const u = range(t, T0 - 0.4, TL);
        p = exitP.clone().lerp(land, u); p.y = lerp(exitP.y - 0.15, land.y, u * u);
        upv = exitT.clone().negate().add(V(0, 0.25, 0));
      } else {
        const it = t - TL;
        p = land.clone().addScaledVector(exitT, easeOut(range(it, 0, 2.5)) * 1.2);
        p.y = 0.13 + Math.sin(it * 2.2) * 0.02 - 0.05 * Math.exp(-it * 3);
        upv = exitT.clone().negate();
      }
      orient(man.root, upv, V(0, 1, 0).addScaledVector(upv.clone().normalize(), -upv.clone().normalize().y));
      man.root.position.copy(p).addScaledVector(upv.clone().normalize(), -0.85).add(V(0, -0.0, 0));
      const relax = smooth(range(t, TL + 0.4, TL + 1.4));
      pose(man, LIE, { lSh: [0, 0, lerp(0.3, 1.4, relax)], rSh: [0, 0, -lerp(0.3, 1.4, relax)], lHip: [0, 0, 0.25 * relax], rHip: [0, 0, -0.25 * relax], neck: [0.2, 0, 0] }, t);
      man.setMouth(t < TL ? 0.5 : 0.15 * (1 - relax));
      const k = easeInOut(range(t, 0, 3.4));
      const tgt = land.clone().addScaledVector(exitT, -0.3);
      const cp = tgt.clone().addScaledVector(side, lerp(4.2, 3.4, k)).addScaledVector(exitT, lerp(2.2, 2.8, k)).add(V(0, lerp(1.4, 2.0, k), 0));
      place(c, [cp.x, cp.y, cp.z], [tgt.x, lerp(0.7, 0.3, k), tgt.z]);
      return { dof: { focus: cp.distanceTo(tgt), aperture: 0.0008, maxblur: 0.004 }, bloom: 0.35 };
    },
  };
}

export const SHOTS = [
  { start: 0.0, end: 1.8, build: shot1 },
  { start: 1.8, end: 3.6, build: shot2 },
  { start: 3.6, end: 6.25, build: shot3 },
  { start: 6.25, end: 9.0, build: shot4 },
  { start: 9.0, end: 11.6, build: shot5 },
  { start: 11.6, end: 16.0, build: shot6 },
  { start: 16.0, end: 17.6, build: shot7 },
  { start: 17.6, end: 20.6, build: shot8 },
  { start: 20.6, end: 25.5, build: shot9 },
  { start: 25.5, end: 28.2, build: shot10 },
  { start: 28.2, end: DURATION + 1, build: shot11 },
];
