import * as THREE from 'three';
import { labelCam, loadKit, world, prop, creature, person, label, showLabel, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 25.6;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/bear_brown', 'dead_tree_trunk', 'namaqualand_boulder_02'], hdris: ['birchwood'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 8, sunDir: [-4, 8, 3] }), 'birchwood', { height: 2, radius: 50, sun: 1.6, env: 0.9 });
  const log = prop('dead_tree_trunk', 1.2); log.position.set(-2.5, 0, -2.5); scene.add(log);
  const bear = creature('sf/bear_brown', 2.4, 'max'); scene.add(bear.root);
  const black = creature('sf/bear_brown', 1.7, 'max'); black.root.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(0x1a1a1a); } }); scene.add(black.root);
  const sprinter = person('hero', { print: false }); ghost(sprinter.root, 0xbfe6ff, { inPlace: true }); sprinter.root.traverse(m => { if (m.isMesh) m.material.blending = THREE.NormalBlending; }); scene.add(sprinter.root);
  const hero = person('hero'); scene.add(hero.root);
  const shout = stream(120, 0xffffff, 0.04); scene.add(shout);
  const L = { never: label('NEVER RUN!', 1.0), olym: label('FASTER THAN AN OLYMPIC SPRINTER', 1.8), calm: label('STAY CALM', 0.9), low: label('LOW VOICE', 0.9), back: label('BACK AWAY SLOWLY', 1.2), brown: label('BROWN BEAR?', 1.2), dead: label('PLAY DEAD', 1.0), neck: label('BELLY DOWN, COVER NECK', 1.5), blackL: label('BLACK BEAR?', 1.0), fight: label('FIGHT BACK!', 1.0), big: label('LOOK BIG & SHOUT!', 1.3) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 400);
  const KEYS = [[0, [2.6, 1.6, 5.4], [0, 1.0, -1]], [4.4, [2.6, 1.6, 5.4], [0, 1.0, -1]], [5.0, [4.0, 1.6, 4.0], [0, 1.0, -2]], [7.6, [4.0, 1.6, 4.0], [0, 1.0, -2]], [8.2, [2.6, 1.6, 5.0], [0, 1.0, -1]], [12.2, [2.6, 1.6, 5.0], [0, 1.0, -1]],
    [12.8, [2.8, 2.6, 4.2], [0.1, 0.4, -0.2]], [18.0, [2.8, 2.6, 4.2], [0.1, 0.4, -0.2]], [18.6, [2.4, 1.6, 5.0], [0, 1.1, -1]], [25.6, [2.4, 1.6, 5.0], [0, 1.2, -1]]];
  return {
    scene, camera: cam,
    update(t) {
      const brownPhase = t < 18.2; bear.root.visible = brownPhase; black.root.visible = !brownPhase;
      // brown bear approaches; charges 13.8; sniffs the 'dead' hero, leaves
      const bz = t < 8 ? -5 : t < 13.6 ? lerp(-5, -4, sm(8, 12, t)) : lerp(-4, -1.6, sm(13.6, 14.6, t));
      bear.play(t, t > 13.6 && t < 14.6 ? '_BearCombatIdle' : t > 3.0 && t < 5.0 ? '_BearCombatIdle' : '_BearCombatIdle', 1);
      bear.root.position.set(0, 0, bz); bear.root.rotation.y = 0;
      const sk = sm(5.0, 5.4, t) * (1 - sm(7.6, 8.0, t)); sprinter.update(t, { run: 1 }, 1.4, {}); sprinter.root.fade(0.7 * sk); sprinter.root.position.set(1.0, 0, lerp(-1, 4, sm(5, 7.6, t))); sprinter.root.rotation.y = 0;
      const lie = sm(14.6, 15.8, t) * (1 - sm(17.8, 18.3, t)), backK = sm(9.8, 12.2, t);
      black.play(t, '_BearCombatIdle', 1); black.root.position.set(0, 0, lerp(-5, -3.2, sm(19.0, 20.4, t))); black.root.rotation.y = 0;
      const fight = sm(19.8, 20.4, t);
      hero.update(t, { idle: 1 }, 1, { spread: 0.4 * sm(7.9, 8.3, t) * (1 - sm(9.6, 10.0, t)), handsHead: lie, armsUp: fight, lean: 0.3 * fight });
      hero.root.position.set(0.2, lie * 0.05, lerp(0.6, 1.4, backK) - 0.6 * lie * 0 ); hero.root.rotation.set(0, 0, 0); hero.root.rotateY(-Math.PI / 2 * lie + Math.PI * (1 - lie)); hero.root.rotateX(Math.PI / 2 * lie); hero.root.position.x = 0.2 + 1.7 * lie; hero.root.position.z -= 0.6 * lie;
      if (!lie) hero.root.rotation.set(0, Math.PI, 0);
      hero.mouth(fight * Math.abs(Math.sin(t * 8)));
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      shout.update(hero.headPos().add(V(0, 0, -0.15)), V(0, 0.2, -1), 22.4, 24.6, t, 0.8, 0.6);
      const bp = V(0, 2.5, bz), hp = hero.headPos().add(V(0, 0.42, 0));
      showLabel(L.never, hp, t, 2.4, 4.6); showLabel(L.olym, V(0.6, 2.6, -1), t, 4.8, 7.6);
      showLabel(L.calm, hp, t, 7.9, 9.0); showLabel(L.low, hp, t, 9.0, 10.3); showLabel(L.back, hp, t, 10.4, 12.2);
      showLabel(L.brown, bp, t, 12.6, 14.2); showLabel(L.dead, V(0.2, 1.2, 1.4), t, 14.6, 15.8); showLabel(L.neck, V(0.2, 1.2, 1.4), t, 15.9, 18.0);
      showLabel(L.blackL, V(0, 2.2, -3.6), t, 18.3, 19.8); showLabel(L.fight, hp, t, 19.9, 20.8); showLabel(L.big, hp, t, 20.9, 25.6);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
