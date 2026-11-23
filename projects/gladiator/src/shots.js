import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, texMat, person, label, showLabel, xray, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 28.7;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/roman_soldier', 'kite_shield', 'wooden_handle_saber', 'wooden_bowl_02'], hdris: ['colosseum'], people: ['hero', 'manuel'], tex: ['rough_wood'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawFat(g, k) { // skin / fat / muscle layers; a blade cut stops in the fat
  g.fillStyle = 'rgba(232,180,150,1)'; g.fillRect(0, 150, 512, 40);
  g.fillStyle = 'rgba(250,220,120,1)'; g.fillRect(0, 190, 512, 40 + 50 * k);
  g.fillStyle = 'rgba(190,60,60,1)'; g.fillRect(0, 230 + 50 * k, 512, 300);
  g.strokeStyle = '#e8eef5'; g.lineWidth = 10; g.beginPath(); g.moveTo(330, 40); g.lineTo(260, 150 + 60 * Math.min(1, k * 1.5)); g.stroke();
}
function gladiator(kind, scene) {
  const p = person(kind, { print: false }); scene.add(p.root);
  const helm = fit(prop('sf/roman_soldier'), 0.34, 'y', { ground: false }); scene.add(helm);
  const shield = prop('kite_shield', 0.9); scene.add(shield);
  const sword = prop('wooden_handle_saber', 0.75); scene.add(sword);
  p.sync = () => { const h = p.headPos(); const yaw = p.root.rotation.y; helm.position.copy(h).add(V(0, 0.07, 0)); helm.rotation.set(0, yaw, 0);
    shield.position.copy(p.world('LeftHand')).add(V(0, 0, 0.12).applyAxisAngle(V(0, 1, 0), yaw)); shield.rotation.set(0, yaw, 0);
    sword.position.copy(p.world('RightHand')); sword.rotation.set(1.3, yaw, 0); [helm, shield, sword].forEach(o => o.visible = p.root.visible); };
  return p;
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 7, sunDir: [-4, 8, 3] }), 'colosseum', { height: 3, radius: 50, sun: 2.0, env: 0.9 });
  const hero = person('hero'); scene.add(hero.root);
  const g1 = gladiator('manuel', scene), g2 = gladiator('manuel', scene);
  const myth = ghost(g2.root, 0xff8080); scene.add(myth);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.9, 16), texMat('rough_wood', 1, 3)); post.castShadow = true; post.position.set(1.6, 0.95, -0.9); scene.add(post);
  const bowl = prop('wooden_bowl_02', 2.2); scene.add(bowl);
  const beans = new THREE.Group(); for (let i = 0; i < 40; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x7a4a30 : 0xd8c088, roughness: 0.8 })); b.scale.set(1.3, 0.8, 1); b.position.set(Math.cos(i * 2.4) * 0.11 * Math.sqrt(i / 40), 0.06, Math.sin(i * 2.4) * 0.11 * Math.sqrt(i / 40)); beans.add(b); } scene.add(beans);
  const coins = stream(160, 0xffd24a, 0.06); scene.add(coins);
  const xr = xray(0.45); scene.add(xr);
  const L = { slaves: label('SLAVES OR PRISONERS', 1.2), free: label('FREE MEN', 0.8), fame: label('FAME & MONEY', 0.9), school: label('GLADIATOR SCHOOL', 1.1), diet: label('BARLEY & BEANS', 1.0), fat: label('FAT LAYER = ARMOR', 1.1), movie: label('MOVIE MYTH', 0.9), most: label('MOST SURVIVED', 1.0), exp: label('EXPENSIVE!', 0.8), spared: label('SPARED', 0.7), crowd: label('THE CROWD DECIDES', 1.5) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 500);
  const KEYS = [[0, [2.8, 1.6, 6.4], [1.0, 1.3, -0.4]], [3.0, [1.8, 1.5, 4.8], [1.0, 1.1, -0.5]], [8.8, [1.8, 1.5, 4.8], [1.0, 1.1, -0.5]], [9.6, [1.0, 1.5, 3.2], [1.3, 1.1, -0.8]], [11.8, [1.0, 1.5, 3.2], [1.3, 1.1, -0.8]],
    [12.6, [3.2, 1.45, 2.8], [2.4, 1.1, 0.6]], [16.8, [3.2, 1.45, 2.8], [2.4, 1.1, 0.6]], [17.6, [1.9, 1.6, 5.6], [0.9, 0.9, -0.7]], [25.0, [1.9, 1.6, 5.6], [0.9, 0.8, -0.7]], [26.0, [2.2, 1.4, 5.0], [1.5, 1.6, -1.5]], [28.7, [2.2, 1.4, 5.0], [1.5, 2.0, -2.5]]];
  return {
    scene, camera: cam,
    update(t) {
      const fight = (t < 3.0) || (t > 17.4 && t < 21.0);
      const train = t > 9.4 && t < 12.0;
      const fall = sm(21.4, 22.4, t), spare = sm(24.2, 24.8, t);
      // gladiator 1: fights, trains at the post, then spares the fallen one
      g1.update(t, { idle: 1 }, 1.2, { point: fight || train ? 0.5 + 0.5 * Math.abs(Math.sin(t * 4)) : 0.3 * (1 - spare), lean: fight || train ? 0.3 : 0, armsUp: 0, lookDown: 0.4 * fall });
      g1.root.position.set(train ? 1.0 : 0.6, 0, train ? -0.9 : -0.9); g1.root.rotation.y = train ? Math.PI / 2 : -Math.PI / 2 + 0.3;
      g2.update(t, { idle: 1 }, 1.1, { point: fight ? 0.5 + 0.5 * Math.abs(Math.sin(t * 4 + 1.5)) : 0, flinch: 0.6 * fall, leanBack: 0.4 * fall });
      g2.root.position.set(-0.5, 0.12 * fall, -0.9); g2.root.rotation.set(-1.4 * fall, Math.PI / 2 - 0.3, 0); g2.root.visible = !train;
      // movie myth: ghost of him dying
      const mk = sm(18.0, 18.3, t) * (1 - sm(20.4, 20.8, t)); myth.fade(mk * 0.8); myth.position.set(-0.5, 0, -0.9); myth.rotation.set(-1.4 * sm(18.2, 19.0, t), Math.PI / 2 - 0.3, 0);
      hero.update(t, { idle: 1 }, 1, { point: sm(25.4, 25.8, t) * 0.4, armsUp: 0.6 * sm(25.6, 26.2, t), lookUp: 0.5 * sm(25.4, 26.0, t) });
      hero.root.position.set(2.6, 0, 0.7); hero.root.rotation.y = -0.9;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      g1.sync(); g2.sync();
      bowl.visible = t > 12.4 && t < 17.0; bowl.position.copy(hero.world('RightHand')).add(V(0.05, -0.02, 0.12)); beans.visible = bowl.visible; beans.position.copy(bowl.position);
      coins.update(V(0.6, 2.4, -0.9), V(0, -1, 0), 7.6, 8.9, t, 1.8, 1.0);
      const xk = sm(14.1, 14.4, t) * (1 - sm(16.6, 16.9, t));
      if (xk > 0.01) xr.show(hero.world('Spine').clone().add(V(0.33, 0.25, 0.2)), xk, drawFat, sm(14.4, 15.6, t), t); else xr.visible = false;
      const h1 = g1.headPos(), hh = hero.headPos(); const up = (y) => V(0, y, 0);
      showLabel(L.slaves, h1.clone().add(up(0.5)), t, 4.1, 5.8); showLabel(L.free, h1.clone().add(up(0.5)), t, 6.2, 7.6); showLabel(L.fame, h1.clone().add(up(0.5)), t, 7.7, 9.2);
      showLabel(L.school, V(1.3, 2.4, -0.9), t, 9.8, 12.0); showLabel(L.diet, hh.clone().add(up(0.35)), t, 12.6, 14.0); showLabel(L.fat, hh.clone().add(up(0.35)), t, 14.4, 16.8);
      showLabel(L.movie, V(-0.5, 2.3, -0.9), t, 18.3, 19.4); showLabel(L.most, V(0.0, 2.4, -0.9), t, 19.5, 21.2);
      showLabel(L.exp, h1.clone().add(up(0.5)), t, 21.6, 23.3); showLabel(L.spared, h1.clone().add(up(0.5)), t, 24.3, 25.3);
      showLabel(L.crowd, hero.headPos().add(V(0, 0.55, 0)), t, 25.9, 28.7);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
