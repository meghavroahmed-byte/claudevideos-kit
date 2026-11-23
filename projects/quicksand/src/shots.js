import * as THREE from 'three';
import { labelCam, loadKit, world, prop, texMat, person, label, showLabel, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 29.6;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['covered_car', 'dead_tree_trunk', 'namaqualand_boulder_02'], hdris: ['mud_road_puresky'], tex: ['coast_sand_01', 'brown_mud_leaves_01'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;

function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 6, sunDir: [-4, 7, 3] }), 'mud_road_puresky', { height: 2, radius: 60, sun: 1.6, env: 0.9 });
  // quicksand pit: wet dark sand disc with a slightly lighter dry rim
  const rim = new THREE.Mesh(new THREE.CircleGeometry(3.4, 64), texMat('coast_sand_01', 5, 5, { color: 0xd8c8a8 })); rim.rotation.x = -Math.PI / 2; rim.position.y = 0.008; rim.receiveShadow = true; scene.add(rim);
  const pitM = texMat('coast_sand_01', 4, 4, { color: 0x8a7458, roughness: 0.35 }); const pit = new THREE.Mesh(new THREE.CircleGeometry(2.4, 64), pitM); pit.rotation.x = -Math.PI / 2; pit.position.y = 0.012; pit.receiveShadow = true; scene.add(pit);
  const tree = prop('dead_tree_trunk', 1.0); tree.position.set(-3.2, 0, -2.6); tree.rotation.y = 0.8; scene.add(tree);
  const rock = prop('namaqualand_boulder_02', 0.8); rock.position.set(2.9, 0, -2.2); scene.add(rock);
  const hero = person('hero'); scene.add(hero.root);
  const myth = ghost(hero.root, 0xffe0c0); scene.add(myth);
  const car = ghost(prop('covered_car'), 0xbfe0ff); scene.add(car);
  const water = stream(300, 0x6fb8ff, 0.09); scene.add(water);
  const grains = stream(260, 0xc8b08a, 0.05); scene.add(grains);
  const L = { myth: label('MOVIE MYTH', 0.9), imp: label('IMPOSSIBLE', 0.9), dense: label('BODY < QUICKSAND DENSITY', 1.4), waist: label('ONLY TO THE WAIST', 1.1), stuck: label('STUCK', 0.6), carL: label('= LIFTING A CAR', 1.1), panic: label("DON'T PANIC", 0.9), lean: label('LEAN BACK', 0.8), arms: label('SPREAD ARMS', 0.9), legs: label('WIGGLE LEGS', 0.9), water: label('WATER SEEPS IN', 1.0), free: label('FLOAT FREE', 0.9) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 500);
  const KEYS = [[0, [1.6, 1.5, 5.6], [0, 0.9, 0]], [2.6, [1.2, 1.3, 4.4], [-0.3, 0.6, 0]], [6.2, [1.2, 1.3, 4.4], [-0.4, 0.5, 0]], [8.4, [0.8, 1.2, 3.4], [0, 0.4, 0]], [14.8, [0.8, 1.2, 3.4], [0, 0.4, 0]],
    [15.8, [1.0, 1.4, 4.6], [0.2, 1.0, -1.4]], [19.4, [1.0, 1.4, 4.6], [0.2, 1.0, -1.4]], [20.4, [0.7, 1.3, 3.2], [0, 0.4, 0]], [25.0, [0.7, 1.4, 3.2], [0, 0.3, 0]], [29.6, [0.4, 2.2, 3.0], [0, 0.2, -0.2]]];
  return {
    scene, camera: cam,
    update(t) {
      // ---- hero: walks onto the pit, sinks to knees, then to waist; leans back, floats free ----
      const walk = 1 - sm(1.2, 1.5, t);
      const depth = 0.4 * sm(1.4, 2.6, t) + 0.25 * sm(2.6, 8.5, t) + 0.33 * sm(8.6, 12.3, t);
      const lean = sm(21.3, 22.0, t), spread = sm(22.0, 22.7, t), float = sm(25.4, 28.6, t);
      const wiggle = (t > 23.3 && t < 25.3) ? Math.sin(t * 7) * 0.03 : 0;
      const pull = (t > 13.3 && t < 15.2) ? Math.abs(Math.sin(t * 5)) : 0;
      hero.update(t, { idle: 1 - walk, walk }, 1, { flinch: sm(1.5, 1.8, t) * (1 - sm(3.0, 3.6, t)), lean: 0.4 * pull, leanBack: 1.2 * lean, spread: spread, lookDown: 0.3 * sm(8.6, 9.0, t) * (1 - sm(12.6, 13.2, t)), handsBelly: 0.5 * sm(19.9, 20.2, t) * (1 - sm(21.0, 21.3, t)) });
      hero.root.position.set(0, -depth * (1 - float) - 0.25 * float + 0.05 * pull + wiggle, lerp(1.6, 0, sm(0, 1.4, t)));
      hero.root.rotation.set(-0.35 * lean * (1 - float) - 1.2 * float, 0, 0);
      // ---- movie myth: a ghost sinks all the way under ----
      const mk = sm(3.1, 3.4, t) * (1 - sm(6.6, 7.2, t)); myth.fade(mk); myth.position.set(-1.25, -2.0 * sm(3.6, 5.6, t), -0.3); myth.rotation.set(0, 0.3, 0); myth.traverse(o => { if (o.isBone) {} });
      // ---- force = lifting a car ----
      const ck = sm(17.0, 17.4, t) * (1 - sm(19.6, 20.0, t)); car.fade(ck); car.position.set(0.4, 0.3 + 0.9 * sm(17.2, 19.0, t), -3.6); car.rotation.y = 0.5;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos();
      water.update(V(0, 0.02, 0), V(0, 0.15, 0), 25.4, 27.4, t, 0.2, 2.6);
      grains.update(V(0, 0.02, 0), V(0, 0.5, 0), 26.4, 28.0, t, 0.6, 1.6);
      const up = (y) => V(0, y, 0);
      showLabel(L.myth, V(-1.25, 2.1, -0.3), t, 3.3, 5.6);
      showLabel(L.imp, V(-1.25, 1.0, -0.3), t, 7.3, 8.5);
      showLabel(L.dense, head.clone().add(up(0.4)), t, 9.2, 11.3);
      showLabel(L.waist, head.clone().add(up(0.4)), t, 11.5, 13.0);
      showLabel(L.stuck, head.clone().add(up(0.4)), t, 14.4, 15.6);
      showLabel(L.carL, V(0.4, 2.8, -3.6), t, 17.4, 19.8);
      showLabel(L.panic, head.clone().add(up(0.4)), t, 20.1, 21.3);
      showLabel(L.lean, head.clone().add(up(0.45)), t, 21.4, 22.2);
      showLabel(L.arms, head.clone().add(up(0.45)), t, 22.2, 23.3);
      showLabel(L.legs, head.clone().add(up(0.45)), t, 23.3, 25.2);
      showLabel(L.water, V(0, 0.8, 0.6), t, 25.4, 26.9);
      showLabel(L.free, head.clone().add(up(0.6)), t, 27.8, 29.6);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
