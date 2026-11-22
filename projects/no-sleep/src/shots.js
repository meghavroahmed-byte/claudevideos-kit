import * as THREE from 'three';
import { loadKit, world, prop, person, label, showLabel, xray, ghost, keyCam, keyPath, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';
export const DURATION = 29.6;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['GothicBed_01'], hdris: ['hotel_room'], people: ['hero'] });
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5 }), 'hotel_room', { height: 1.6, radius: 8, sun: 0.8, env: 1.0 });
  const hero = person('hero'); scene.add(hero.root);
  const bed = prop('GothicBed_01'); bed.position.set(-1.4, 0, -0.8); scene.add(bed);
  const c = new THREE.PerspectiveCamera(38, 720 / 1280, 0.05, 200);
  return { scene, camera: c, update(t) {
    const PS=['flinch','point','handsHead','handsChest','handsBelly','armsUp','shrug','crouch','slump','lookUp']; hero.update(0, { idle: 1 }, 1, { [PS[Math.floor(t)]]: 1 });
    c.position.set(0.4, 1.2, 3.6); c.lookAt(0, 0.95, 0);
    return { bloom: 0.2 };
  } };
}
export const SHOTS = [{ start: 0, end: 99, build }];
