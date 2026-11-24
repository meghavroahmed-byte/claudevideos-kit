import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, person, V } from './real.js';
import { dress } from './dress.js';
export const DURATION = 3;
export const CAPTIONS = [];
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: [], hdris: ['suburban_garden'], people: ['baby2', 'eric'] });
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-3, 7, 4] }), 'suburban_garden', { height: 2, radius: 40, sun: 2.0, env: 1.0 });
  const b = person('baby2', { height: 0.86 }); dress(b.root, { top: 0xf4c542, bottom: 0x3d6fb6, hair: 0x4a2c18, flip: true }); scene.add(b.root);
  const b2 = person('baby2', { height: 0.84 }); dress(b2.root, { top: 0x6fb7e8, bottom: 0x2f3e55, trim: 0xffffff, hair: 0x1c120c, stripes: true, flip: true }); b2.root.position.set(-0.55, 0, -0.2); scene.add(b2.root);
  const e = person('eric'); e.root.position.set(0.7, 0, -0.5); scene.add(e.root);
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.02, 200);
  return { scene, camera: cam, update(t) { b.update(t, t < 1.5 ? { idle: 1 } : { walk: 1 }, 1).plant(); b2.update(t, { idle: 1 }, 1, { point: 0.8 }); e.update(t, { idle: 1 }, 1).plant(); b2.plant(); b.root.rotation.y = t > 1.5 ? 0.8 : 0; cam.position.set(0.15, 0.75, 2.6 - t * 0.5); cam.lookAt(0, 0.5, 0); labelCam(cam); return { bloom: 0.1, exposure: 1.0 }; } };
}
export const SHOTS = [{ start: 0, end: 99, build }];
