import * as THREE from 'three';
import { labelCam, loadKit, world, prop, person, label, showLabel, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 24.8;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['dining_table', 'wooden_bookshelf_worn', 'Chandelier_01', 'ceramic_vase_01'], hdris: ['lythwood_room'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 6, sunDir: [-3, 6, 4] }), 'lythwood_room', { height: 1.6, radius: 9, sun: 1.0, env: 1.0 });
  const table = prop('dining_table'); table.position.set(0.2, 0, -0.4); scene.add(table);
  const shelf = prop('wooden_bookshelf_worn', 1); shelf.position.set(-1.6, 0, -1.4); shelf.rotation.y = 0.4; scene.add(shelf);
  const lamp = prop('Chandelier_01', 1); lamp.position.set(0.2, 2.3, -0.4); scene.add(lamp);
  const vases = [0, 1, 2].map(i => { const v = prop('ceramic_vase_01', 1); v.position.set(-1.5 + i * 0.25, 1.3, -1.35); scene.add(v); return v; });
  const runner = person('hero', { print: false }); ghost(runner.root, 0xffb0a0, { inPlace: true }); runner.root.traverse(m => { if (m.isMesh) m.material.blending = THREE.NormalBlending; }); scene.add(runner.root);
  const glass = stream(300, 0xdff0ff, 0.05); scene.add(glass);
  const bricks = []; for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.1), new THREE.MeshStandardMaterial({ color: 0xa84a30, roughness: 0.9 })); b.castShadow = true; scene.add(b); bricks.push(b); }
  const hero = person('hero'); scene.add(hero.root);
  const L = { no: label("DON'T RUN OUTSIDE!", 1.2), glass: label('FALLING GLASS & BRICKS', 1.4), drop: label('DROP', 0.8), cover: label('COVER', 0.8), hold: label('HOLD ON', 0.9), away: label('AWAY FROM WINDOWS & SHELVES', 1.6), save: label('IT COULD SAVE YOUR LIFE', 1.4) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [1.4, 1.5, 3.6], [0, 1.1, -0.2]], [2.2, [1.4, 1.5, 3.6], [-0.2, 1.1, -0.4]], [8.0, [1.4, 1.5, 3.6], [-0.2, 1.1, -0.4]], [8.8, [1.8, 1.2, 3.0], [0.2, 0.5, -0.4]], [15.2, [1.8, 1.2, 3.0], [0.2, 0.5, -0.4]], [15.8, [1.8, 1.6, 3.4], [-0.6, 1.0, -0.8]], [19.4, [1.8, 1.6, 3.4], [-0.6, 1.0, -0.8]], [20.0, [1.8, 1.2, 3.0], [0.2, 0.5, -0.4]], [24.8, [1.8, 1.3, 3.2], [0.4, 0.8, -0.2]]];
  return {
    scene, camera: cam,
    update(t) {
      const shaking = t > 0.8 && t < 22.2; const amp = shaking ? 0.03 * (0.6 + 0.4 * Math.sin(t * 1.3)) : 0;
      const dropK = sm(9.0, 9.8, t), under = sm(10.8, 12.2, t), standUp = sm(22.4, 23.4, t);
      hero.update(t, { idle: 1 }, 1, { flinch: 0.6 * sm(1.0, 1.4, t) * (1 - sm(8.6, 9.0, t)), crouch: 0.95 * dropK * (1 - standUp), lean: (0.6 * dropK + 0.5 * under) * (1 - standUp), lookDown: 0.7 * under * (1 - standUp), handsHead: 0.6 * sm(12.9, 13.4, t) * (1 - standUp), point: 0.5 * sm(20.0, 20.4, t) * (1 - sm(21.4, 21.8, t)) });
      hero.root.position.set(lerp(1.0, 0.3, under), (-0.25 * dropK - 0.6 * under) * (1 - standUp), lerp(0.8, -0.3, under) + 0.0); hero.root.rotation.y = lerp(-0.4, 0.3, under);
      // ghost runner heading out a door, hit by falling glass
      const rk = sm(2.2, 2.6, t) * (1 - sm(7.8, 8.2, t)); runner.update(t, { run: 1 }, 1, { flinch: sm(5.0, 5.4, t) }); runner.root.fade(0.75 * rk); runner.root.position.set(lerp(-0.4, -2.2, sm(2.4, 5.0, t)), 0, lerp(0.4, 1.2, sm(2.4, 5.0, t))); runner.root.rotation.y = -1.9;
      vases.forEach((v, i) => { const f = sm(16.4 + i * 0.3, 16.9 + i * 0.3, t); v.position.set(-1.5 + i * 0.25 + 0.2 * f, lerp(1.3, 0.0, f * f), lerp(-1.35, -0.9, f)); v.rotation.set(f * 2, 0, f * 1.5); });
      lamp.rotation.z = shaking ? Math.sin(t * 7) * 0.08 : 0; shelf.rotation.z = shaking ? Math.sin(t * 9) * 0.015 : 0;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos).add(V(Math.sin(t * 47) * amp, Math.sin(t * 61) * amp, 0)); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      glass.update(V(-2.2, 2.4, 1.2), V(0, -1, 0), 4.6, 6.4, t, 2.6, 0.8);
      bricks.forEach((b, i) => { const st = 4.9 + i * 0.1, u = Math.max(0, t - st); b.visible = t > st && t < 8.2; b.position.set(-2.1 + (i % 4) * 0.12, Math.max(0.035, 2.6 - 4.9 * u * u), 1.1 + Math.floor(i / 4) * 0.1); b.rotation.set(u * 4, i, u * 3); });
      const hp = hero.headPos().add(V(0, 0.42, 0));
      showLabel(L.no, V(-0.6, 2.2, 0.4), t, 2.2, 3.8); showLabel(L.glass, V(-1.6, 2.2, 0.8), t, 4.9, 7.8);
      showLabel(L.drop, hp, t, 9.0, 10.6); showLabel(L.cover, hp, t, 10.7, 12.8); showLabel(L.hold, hp, t, 12.9, 15.2);
      showLabel(L.away, V(-1.3, 2.4, -1.2), t, 15.6, 19.4); showLabel(L.drop, hp, t, 19.9, 20.5); showLabel(L.cover, hp, t, 20.6, 21.2); showLabel(L.hold, hp, t, 21.3, 22.2); showLabel(L.save, hp, t, 22.3, 24.8);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
