import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, person, label, showLabel, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 28.1;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/human_brain', 'Sofa_01'], hdris: ['reading_room'], people: ['hero', 'manuel'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;

function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-3, 6, 4] }), 'reading_room', { height: 1.6, radius: 9, sun: 1.0, env: 1.0 });
  const sofa = prop('Sofa_01'); sofa.position.set(-0.2, 0, -1.6); scene.add(sofa);
  const hero = person('hero'); scene.add(hero.root);
  const friend = person('manuel'); scene.add(friend.root);
  const selfGhost = person('hero', { print: false }); ghost(selfGhost.root, 0xbfe6ff, { inPlace: true }); scene.add(selfGhost.root);
  // brain display with the cerebellum glowing
  const brain = fit(prop('sf/human_brain'), 0.75, 'max', { ground: false }); scene.add(brain);
  const cere = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 16), new THREE.MeshBasicMaterial({ color: 0x40c8ff, transparent: true, opacity: 0.75, toneMapped: false, depthTest: false })); cere.renderOrder = 30; scene.add(cere);
  // unpredictable finger path: dotted trail
  const trail = stream(160, 0xffd34a, 0.05); scene.add(trail);
  const signal = stream(140, 0x40c8ff, 0.05); scene.add(signal);
  const cross = new THREE.Group(); { const m = new THREE.MeshBasicMaterial({ color: 0xff3030, toneMapped: false, depthTest: false }); for (const r of [0.785, -0.785]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.07, 0.01), m); b.rotation.z = r; b.renderOrder = 41; cross.add(b); } } scene.add(cross);
  const L = { pred: label("CAN'T PREDICT", 0.9), laugh: label('SURPRISE = LAUGH', 1.1), cere: label('CEREBELLUM', 0.9), every: label('PREDICTS EVERY MOVE', 1.2), relax: label("RELAX, IT'S JUST ME", 1.2), cancel: label('TICKLE CANCELLED', 1.1), fun: label('FUN FACT', 0.8), some: label('SOME PEOPLE CAN!', 1.1) };
  Object.values(L).forEach(l => scene.add(l));
  const BP = V(0.5, 1.95, -0.3); // brain display spot
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.4, 1.3, 3.6], [0, 1.0, 0]], [1.9, [0.4, 1.3, 3.6], [0, 1.0, 0]], [2.6, [0.9, 1.3, 4.0], [0.25, 1.0, 0]], [8.9, [0.9, 1.3, 4.0], [0.25, 1.0, 0]],
    [9.8, [0.45, 1.5, 4.1], [0.2, 1.3, -0.2]], [21.8, [0.45, 1.5, 4.1], [0.2, 1.3, -0.2]], [22.6, [0.2, 1.3, 4.2], [-0.2, 1.0, 0]], [28.1, [0.2, 1.3, 4.0], [-0.2, 1.0, 0]]];
  return {
    scene, camera: cam,
    update(t) {
      // ---- friend tickles 2.0 - 8.9; hero laughs ----
      const fk = sm(1.9, 2.4, t) * (1 - sm(8.9, 9.4, t));
      const jit = Math.sin(t * 13) * 0.5 + 0.5;
      friend.update(t, { idle: 1 }, 1, { point: fk * (0.75 + 0.25 * jit), pointL: fk * (0.75 + 0.25 * (1 - jit)), lean: 0.35 * fk });
      friend.root.position.set(lerp(1.6, 0.65, fk), 0, lerp(0.2, 0.5, fk)); friend.root.rotation.y = -Math.PI / 2 - 0.2;
      friend.root.visible = t > 1.6 && t < 9.8;
      const laugh = fk * (0.6 + 0.4 * Math.abs(Math.sin(t * 7)));
      const selfT = sm(0.2, 0.5, t) * (1 - sm(1.8, 2.0, t)) + sm(9.9, 10.4, t) * (1 - sm(21.6, 22.0, t));
      hero.update(t, { idle: 1 }, 1, { flinch: 0.55 * laugh, lean: 0.35 * laugh * Math.abs(Math.sin(t * 5)), handsBelly: 0.9 * selfT, headTilt: 0.4 * laugh * Math.sin(t * 9) });
      hero.root.position.set(-0.15, 0, 0); hero.root.rotation.y = 0.15 + 0.1 * laugh * Math.sin(t * 6);
      // ---- fun fact: ghost of him tickling himself and laughing ----
      const gk = sm(23.2, 23.6, t);
      selfGhost.update(t, { idle: 1 }, 1, { handsBelly: 0.9, flinch: 0.4 * Math.abs(Math.sin(t * 7)), lean: 0.3 * Math.abs(Math.sin(t * 5)) });
      selfGhost.root.fade(0.75 * gk); selfGhost.root.position.set(-1.1, 0, -0.5); selfGhost.root.rotation.y = 0.4;
      // ---- brain display ----
      const bk = sm(11.2, 11.7, t) * (1 - sm(21.8, 22.3, t));
      brain.visible = bk > 0.01; brain.scale.setScalar(brain.userData.s0 ??= brain.scale.x); brain.scale.setScalar(brain.userData.s0 * bk);
      brain.position.copy(BP); brain.rotation.set(0, -Math.PI / 2 + Math.sin(t * 0.4) * 0.2, 0);
      cere.visible = bk > 0.5 && t > 12.6; cere.material.opacity = 0.45 + 0.35 * Math.abs(Math.sin(t * 5));
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      // cerebellum: back-bottom of the brain (in the brain's frame)
      cere.position.copy(BP).add(V(0.0, -0.13, -0.16).applyEuler(brain.rotation).multiplyScalar(bk));
      const hip = hero.world('Spine'); const head = hero.headPos();
      // squiggly unpredictable path around his belly while the friend tickles
      { const a = trail.geometry.attributes.position.array; const on = fk > 0.5 && t > 4.6 && t < 6.6; for (let i = 0; i < 160; i++) { const u = i / 160; const tt = t * 1.3 - u * 2.5; a[i * 3] = hip.x + Math.sin(tt * 3.1) * 0.25 + Math.sin(tt * 7.3) * 0.08; a[i * 3 + 1] = (on ? hip.y + Math.sin(tt * 2.3) * 0.18 : -99); a[i * 3 + 2] = hip.z + 0.22 + Math.cos(tt * 4.7) * 0.05; } trail.geometry.attributes.position.needsUpdate = true; trail.visible = on; trail.frustumCulled = false; }
      signal.update(cere.position.clone(), head.clone().sub(cere.position).normalize(), 17.2, 19.4, t, 0.9, 0.12);
      cross.visible = t > 20.4 && t < 21.9; cross.position.copy(hip).add(V(0, 0.05, 0.3)); cross.scale.setScalar(sm(20.4, 20.7, t)); cross.quaternion.copy(cam.quaternion);
      const up = (y) => V(0, y, 0);
      showLabel(L.pred, head.clone().add(V(0.4, 0.45, 0)), t, 4.6, 6.6); showLabel(L.laugh, head.clone().add(V(0.3, 0.45, 0)), t, 7.3, 9.2);
      showLabel(L.cere, cere.position.clone().add(V(0.0, -0.3, 0)), t, 12.7, 14.0); showLabel(L.every, BP.clone().add(up(0.55)), t, 13.6, 15.6);
      showLabel(L.relax, BP.clone().add(up(0.55)), t, 17.8, 19.6); showLabel(L.cancel, hip.clone().add(up(0.45)), t, 20.3, 22.0);
      showLabel(L.fun, V(-0.6, 2.25, -0.3), t, 22.3, 23.4); showLabel(L.some, V(-1.1, 2.15, -0.5), t, 23.6, 28.1);
      return { bloom: 0.25, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
