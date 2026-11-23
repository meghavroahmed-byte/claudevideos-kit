import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, person, label, showLabel, xray, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 27.9;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['dining_table', 'wooden_bowl_01', 'brass_goblets', 'dead_quiver_branch_01', 'bull_head', 'sf/toothbrush'], hdris: ['fireplace'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawFray(g, k) { // chewed stick end splitting into fibres
  g.fillStyle = 'rgba(150,110,70,0.95)'; g.fillRect(40, 220, 260, 70);
  g.strokeStyle = 'rgba(200,160,110,0.95)'; g.lineWidth = 5;
  for (let i = 0; i < 22; i++) { const y = 222 + i * 3.1, spread = (i - 11) * 9 * k; g.beginPath(); g.moveTo(300, y); g.quadraticCurveTo(360, y + spread * 0.4, 300 + 160 * (0.4 + 0.6 * k), y + spread); g.stroke(); }
}
function pile(color, r, h) { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 24, 1), new THREE.MeshStandardMaterial({ color, roughness: 1 })); m.castShadow = m.receiveShadow = true; return m; }
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 4, sunDir: [-3, 6, 4] }), 'fireplace', { height: 1.6, radius: 9, sun: 1.2, env: 1.0 });
  const table = prop('dining_table'); table.position.set(0, 0, -0.55); scene.add(table);
  const TOP = 0.87;
  const bowl = prop('wooden_bowl_01', 1.3); bowl.position.set(0.05, TOP, -0.7); scene.add(bowl);
  // eggshell fragments, ash pile, hoof powder pile
  const shells = new THREE.Group(); for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8, 0, Math.PI * (0.6 + (i % 3) * 0.2), 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf4efe4, roughness: 0.6, side: THREE.DoubleSide })); s.position.set(-0.5 + (i % 5) * 0.06, TOP + 0.01, -0.32 + Math.floor(i / 5) * 0.07); s.rotation.set(i, i * 2, 0); shells.add(s); } scene.add(shells);
  const ash = pile(0x8a8884, 0.15, 0.11); ash.position.set(-0.12, TOP + 0.055, -0.3); scene.add(ash);
  const hoof = pile(0x8a6a48, 0.14, 0.1); hoof.position.set(0.25, TOP + 0.05, -0.3); scene.add(hoof);
  const ox = prop('bull_head', 0.9); ox.position.set(0.62, TOP, -0.75); ox.rotation.y = -0.5; scene.add(ox);
  const stick = prop('dead_quiver_branch_01', 0.7); scene.add(stick);
  const brush = fit(prop('sf/toothbrush'), 0.32, 'max', { ground: false }); brush.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(0xe8dcc0); } }); scene.add(brush);
  const goblet = prop('brass_goblets', 1); goblet.position.set(0.45, TOP, -0.3); scene.add(goblet);
  const liquid = new THREE.Mesh(new THREE.CircleGeometry(0.035, 24), new THREE.MeshStandardMaterial({ color: 0xd8c030, roughness: 0.1 })); liquid.rotation.x = -Math.PI / 2; scene.add(liquid);
  const hero = person('hero'); scene.add(hero.root);
  const dust = stream(120, 0xd8d4c8, 0.02); scene.add(dust);
  const xr = xray(0.42); scene.add(xr);
  const L = { yrs: label('5,000 YEARS AGO', 1.1), egy: label('ANCIENT EGYPT', 0.9), egg: label('EGGSHELLS', 0.55), ashL: label('ASHES', 0.45), ox: label('OX HOOVES', 0.55), stickL: label('CHEW STICK', 0.8), fray: label('FRAYED = BRUSH', 0.9), china: label('CHINA', 0.6), hog: label('HOG HAIR', 0.6), bone: label('BONE HANDLE', 0.7), rome: label('ROMANS', 0.7), urine: label('URINE?!', 0.7), amm: label('AMMONIA = WHITER TEETH', 1.3) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.9, 1.5, 3.4], [0, 1.1, -0.3]], [3.3, [0.9, 1.5, 3.4], [0, 1.1, -0.3]], [4.2, [0.5, 1.55, 1.5], [0, 0.95, -0.5]], [9.3, [0.5, 1.55, 1.5], [0, 0.95, -0.5]],
    [10.0, [0.7, 1.5, 2.7], [0.15, 1.3, 0]], [15.4, [0.7, 1.5, 2.7], [0.15, 1.3, 0]], [16.2, [0.7, 1.5, 2.6], [0.15, 1.3, 0]], [21.4, [0.7, 1.5, 2.6], [0.15, 1.3, 0]], [22.0, [0.9, 1.45, 2.9], [0.2, 1.15, -0.2]], [27.9, [0.9, 1.45, 2.9], [0.2, 1.15, -0.2]]];
  return {
    scene, camera: cam,
    update(t) {
      const holdStick = sm(9.8, 10.3, t) * (1 - sm(15.3, 15.8, t)), holdBrush = sm(15.9, 16.4, t) * (1 - sm(21.4, 21.9, t)), rinse = sm(22.9, 23.3, t) * (1 - sm(24.9, 25.3, t)), gross = sm(24.2, 24.6, t) * (1 - sm(25.8, 26.2, t));
      hero.update(t, { idle: 1 }, 1, { point: 0.75 * (holdStick + holdBrush) + rinse, lookDown: 0.25 * Math.max(holdStick, holdBrush), leanBack: 0.8 * gross, handsThroat: 0.6 * gross, lean: 0.3 * sm(4.0, 4.4, t) * (1 - sm(9.0, 9.4, t)) });
      const aside = sm(3.4, 4.0, t) * (1 - sm(9.2, 9.7, t)); const hold = Math.max(holdStick, holdBrush);
      hero.root.position.set(lerp(-0.15, -0.8, aside), 0, 0.45); hero.root.rotation.y = 0.15 + 0.75 * hold + 0.4 * aside;
      const show = (o, a) => { const k = sm(a, a + 0.3, t); o.visible = k > 0.01; return k; };
      shells.scale.setScalar(Math.max(0.01, show(shells, 6.2))); shells.position.y = 0;
      ash.scale.setScalar(Math.max(0.01, show(ash, 7.1))); hoof.scale.setScalar(Math.max(0.01, show(hoof, 8.4))); ox.visible = t > 8.4;
      scene.updateMatrixWorld(true);
      const hand = hero.world('RightHand'), head = hero.headPos();
      const k = keyCam(KEYS, t); const hk = Math.max(holdStick, holdBrush) * 0.85;
      cam.position.copy(k.pos).lerp(hand.clone().add(V(0.35, 0.35, 0.95)), hk); cam.lookAt(k.look.clone().lerp(hand.clone().add(V(0, 0.12, 0)), hk)); labelCam(cam);
      stick.visible = holdStick > 0.01; stick.position.copy(hand).add(V(0, -0.02, 0.06)); stick.rotation.set(-1.2, 0, 0.3);
      brush.visible = holdBrush > 0.01; brush.position.copy(hand).add(V(0, 0.03, 0.08)); brush.rotation.set(-0.3, 0.6, 1.2);
      goblet.position.copy(V(0.45, TOP, -0.3)).lerp(hand.clone().add(V(0, -0.1, 0.05)), rinse); liquid.position.copy(goblet.position).add(V(-0.12, 0.25, 0.05)); liquid.visible = t > 21.8;
      dust.update(V(0, TOP + 0.12, -0.35), V(0, 1, 0), 7.9, 9.2, t, 0.25, 0.25);
      const xk = sm(12.3, 12.6, t) * (1 - sm(15.0, 15.3, t));
      if (xk > 0.01) xr.show(hand.clone().add(V(0.25, 0.25, 0.1)), xk, drawFray, sm(12.8, 14.6, t), t); else xr.visible = false;
      const up = (y) => V(0, y, 0);
      showLabel(L.yrs, head.clone().add(up(0.42)), t, 1.8, 3.4); showLabel(L.egy, V(0, TOP + 0.45, -0.5), t, 3.6, 6.1);
      showLabel(L.egg, V(-0.38, TOP + 0.22, -0.3), t, 6.3, 9.3); showLabel(L.ashL, V(-0.12, TOP + 0.3, -0.3), t, 7.2, 9.3); showLabel(L.ox, V(0.3, TOP + 0.38, -0.3), t, 8.5, 9.3);
      showLabel(L.stickL, head.clone().add(up(0.38)), t, 10.3, 12.2); showLabel(L.fray, head.clone().add(up(0.38)), t, 12.3, 15.2);
      showLabel(L.china, head.clone().add(up(0.38)), t, 15.9, 17.6); showLabel(L.hog, head.clone().add(up(0.38)), t, 19.3, 20.4); showLabel(L.bone, head.clone().add(up(0.38)), t, 20.5, 21.7);
      showLabel(L.rome, head.clone().add(up(0.4)), t, 21.9, 23.2); showLabel(L.urine, head.clone().add(up(0.4)), t, 24.1, 25.2); showLabel(L.amm, head.clone().add(up(0.4)), t, 25.3, 27.9);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
