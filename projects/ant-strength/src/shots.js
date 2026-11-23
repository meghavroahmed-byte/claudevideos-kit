import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, creature, person, label, showLabel, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 25.0;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/ant', 'covered_car', 'food_apple_01'], hdris: ['suburban_garden'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 6, sunDir: [-4, 8, 3] }), 'suburban_garden', { height: 2, radius: 50, sun: 2.2, env: 0.95 });
  const ant = creature('sf/ant', 0.012, 'max'); scene.add(ant.root);
  const crumb = prop('food_apple_01', 0.06); scene.add(crumb);
  const car = prop('covered_car', 1); scene.add(car);
  const hero = person('hero'); scene.add(hero.root);
  const giant = creature('sf/ant', 3.0, 'max'); scene.add(giant.root); const gg = ghost(giant.root, 0xffd0c0, { inPlace: true });
  const dust = stream(300, 0xc8b490, 0.12); dust.material.opacity = 0.5; scene.add(dust);
  const L = { x50: label('LIFTS 50× ITS WEIGHT', 0.03), car: label('A CAR OVER YOUR HEAD', 2.2), bag: label('LIKE A BACKPACK', 1.8), catch: label('THE CATCH', 0.025), tiny: label('STRONG BECAUSE TINY', 0.035), grow: label('WEIGHT GROWS FASTER THAN MUSCLE', 3.6), coll: label('COLLAPSES!', 2.4) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.005, 400);
  // macro on the ant at (0.6, 0, 1.2), then wide on hero
  const KEYS = [[0, [1.2, 1.4, 4.4], [0.3, 0.9, 0.6]], [2.2, [0.66, 0.05, 1.32], [0.6, 0.006, 1.2]], [6.0, [0.66, 0.05, 1.32], [0.6, 0.006, 1.2]], [6.8, [2.0, 1.9, 6.8], [0, 1.7, 0]], [11.0, [2.0, 1.9, 6.8], [0, 1.9, 0]],
    [11.8, [0.65, 0.04, 1.3], [0.6, 0.006, 1.2]], [15.4, [0.65, 0.04, 1.3], [0.6, 0.006, 1.2]], [16.2, [5.0, 2.6, 7.0], [0, 1.0, -1.5]], [25.0, [5.0, 2.6, 7.0], [0, 0.8, -1.5]]];
  return {
    scene, camera: cam,
    update(t) {
      ant.play(t, 0, 1); ant.root.position.set(0.6, 0, 1.2); ant.root.rotation.y = 0.8 + 0.1 * Math.sin(t);
      crumb.position.set(0.6, 0.008, 1.2); crumb.visible = t < 6.2 || (t > 11.6 && t < 15.6);
      const lift = sm(7.2, 8.6, t) * (1 - sm(10.8, 11.4, t));
      hero.update(t, { idle: 1 }, 1, { armsUp: lift, smile: 0 }); hero.root.position.set(0, 0, 0); hero.root.rotation.y = 0.2; hero.root.visible = t > 6.2 && t < 11.6 || t < 2.4;
      car.visible = hero.root.visible; car.position.set(0, lerp(0, 2.05, lift), 0); car.rotation.set(0, 0, 0); car.position.z = lift > 0.01 ? -0.9 : car.position.z; if (lift < 0.01) { car.position.set(1.8, 0, -2.0); car.rotation.y = Math.PI / 2; }
      // giant ant collapses (20.4+)
      const gv = t > 16.0; giant.root.visible = gv; gg.fade(gv ? 0.75 : 0); giant.play(t, 0, 0.6);
      const col = sm(21.4, 22.6, t); giant.root.position.set(0, -0.6 * col, -1.5); giant.root.rotation.set(0, 0.5, 0); giant.root.scale.setScalar((giant.root.userData.s0 ??= giant.root.scale.x) * (1 + 0.6 * sm(16.4, 20.0, t))); giant.root.scale.y *= 1 - 0.55 * col;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      dust.update(V(0, 0.1, -1.5), V(0, 1, 0.3), 21.6, 23.6, t, 1.2, 5);
      const ap = V(0.6, 0.03, 1.2);
      showLabel(L.x50, ap, t, 3.0, 6.0); showLabel(L.car, V(0, 3.6, 0), t, 7.6, 9.8); showLabel(L.bag, V(0, 3.6, 0), t, 9.9, 11.2);
      showLabel(L.catch, ap, t, 11.8, 12.8); showLabel(L.tiny, ap, t, 12.9, 15.4);
      showLabel(L.grow, V(0, 3.8, -1.5), t, 16.2, 20.2); showLabel(L.coll, V(0, 3.0, -1.5), t, 20.4, 25.0);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
