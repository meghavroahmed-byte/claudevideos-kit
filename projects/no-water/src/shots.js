import * as THREE from 'three';
import { labelCam, loadKit, world, prop, person, label, showLabel, xray, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 31.2;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['plastic_bottle_gallon', 'namaqualand_boulder_02', 'dead_tree_trunk'], hdris: ['goegap'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawHeart(g, k, t) {
  g.save(); g.translate(256, 220); const bpm = lerp(1.2, 2.6, k); const beat = 1 + 0.14 * Math.max(0, Math.sin(t * bpm * 6.283));
  g.scale(beat, beat); g.fillStyle = 'rgba(200,40,50,0.9)'; g.beginPath(); g.moveTo(0, 70); g.bezierCurveTo(-130, -10, -80, -120, 0, -55); g.bezierCurveTo(80, -120, 130, -10, 0, 70); g.fill(); g.stroke(); g.restore();
  g.fillStyle = `rgba(${Math.round(lerp(220, 110, k))},20,30,0.95)`; for (let i = 0; i < 8; i++) { const x = ((t * 140 * (1 - 0.5 * k) + i * 60) % 420) + 46; g.beginPath(); g.ellipse(x, 380, 18 + 8 * k, 10 + 6 * k, 0, 0, 6.283); g.fill(); }
  g.strokeStyle = 'rgba(210,230,255,0.9)'; g.lineWidth = 6; g.beginPath(); g.moveTo(30, 350); g.lineTo(482, 350); g.moveTo(30, 410); g.lineTo(482, 410); g.stroke();
}
function drawKidneys(g, k) {
  for (const sx of [-1, 1]) { g.save(); g.translate(256 + sx * 95, 260); g.scale(sx, 1); g.fillStyle = k > 0.5 ? 'rgba(120,110,110,0.9)' : 'rgba(190,70,70,0.9)';
    g.beginPath(); g.ellipse(0, 0, 70, 120, 0, 0, 6.283); g.fill(); g.stroke(); g.fillStyle = 'rgba(12,20,38,1)'; g.beginPath(); g.ellipse(-55, 0, 28, 45, 0, 0, 6.283); g.fill(); g.restore(); }
  if (k > 0.5) { g.strokeStyle = '#ff3b30'; g.lineWidth = 14; g.beginPath(); g.moveTo(130, 120); g.lineTo(382, 400); g.moveTo(382, 120); g.lineTo(130, 400); g.stroke(); }
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 6, sunDir: [-4, 8, 3] }), 'goegap', { height: 3, radius: 80, sun: 2.4, sunColor: 0xfff0d6, env: 0.9 });
  for (const [x, z, s] of [[-3.2, -3.0, 1.2], [3.4, -4.4, 1.5]]) { const b = prop('namaqualand_boulder_02', s); b.position.set(x, 0, z); scene.add(b); }
  const trunk = prop('dead_tree_trunk', 1); trunk.position.set(2.4, 0, -2.2); trunk.rotation.y = 1.2; scene.add(trunk);
  const bottle = prop('plastic_bottle_gallon', 0.9); scene.add(bottle);
  const hero = person('hero'); scene.add(hero.root);
  // body-water overlay: a blue ghost of him, clipped at the water level
  const wat = person('hero', { print: false }); ghost(wat.root, 0x2f8fff, { inPlace: true }); scene.add(wat.root);
  const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.07); wat.root.traverse(m => { if (m.isMesh) { m.material.clippingPlanes = [plane]; m.material.blending = THREE.NormalBlending; m.material.depthTest = false; m.renderOrder = 20; } });
  const vapor = stream(160, 0xffffff, 0.05); vapor.material.opacity = 0.5; scene.add(vapor);
  const sweat = stream(120, 0x9fd8ff, 0.035); scene.add(sweat);
  const xr = xray(0.5); scene.add(xr);
  const L = { pct: label('60% WATER', 0.9), breath: label('BREATHING', 0.8), sweatL: label('SWEATING', 0.8), d1: label('DAY 1', 0.7), ache: label('THIRSTY · TIRED · HEADACHE', 1.5), d2: label('DAY 2', 0.7), dry: label('DRY MOUTH', 0.8), wrink: label('SKIN WRINKLES', 0.9), heart: label('THICKER BLOOD', 0.9), d3: label('DAY 3', 0.7), kid: label('KIDNEYS SHUT DOWN', 1.1), conf: label('CONFUSED', 0.8), max: label('~3 DAYS', 0.9), drink: label('DRINK UP!', 0.9) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 500);
  const KEYS = [[0, [1.2, 1.6, 5.2], [0, 1.1, 0]], [2.4, [0.6, 1.35, 3.6], [0, 1.0, 0]], [9.0, [0.6, 1.35, 3.6], [0, 1.0, 0]], [9.8, [0.4, 1.55, 2.4], [0, 1.35, 0]], [13.4, [0.4, 1.55, 2.4], [0, 1.35, 0]],
    [14.0, [0.4, 1.55, 2.2], [0, 1.4, 0]], [20.4, [0.4, 1.45, 2.6], [0, 1.2, 0]], [21.2, [0.9, 1.3, 3.4], [0, 0.85, 0]], [29.4, [0.9, 1.3, 3.4], [0, 0.85, 0]], [31.2, [0.7, 1.4, 3.6], [0, 1.0, 0]]];
  return {
    scene, camera: cam,
    update(t) {
      const ache = sm(12.2, 12.6, t) * (1 - sm(13.5, 13.9, t)), weak = sm(20.8, 21.8, t) * (1 - sm(29.6, 30.4, t)), kneel = sm(25.5, 26.6, t) * (1 - sm(29.7, 30.6, t));
      const drink = sm(29.6, 29.9, t) * (1 - sm(30.9, 31.2, t)), shakeB = (t < 2.3 && t > 0.6) ? Math.sin(t * 14) : 0;
      const pose = { handsHead: ache, slump: 0.6 * weak, crouch: 0.75 * kneel, headTilt: 0.5 * sm(23.6, 24.0, t) * (1 - sm(25.4, 25.8, t)) * Math.sin(t * 3), lookUp: 0.6 * drink, point: 0.7 * drink + 0.4 * (t < 2.4 ? 1 : 0), lookDown: 0.3 * (t < 2.4 ? 1 : 0) };
      hero.update(t, { idle: 1 }, 0.8, pose); wat.update(t, { idle: 1 }, 0.8, pose);
      const drop = -0.1 * kneel;
      hero.root.position.set(0, drop, 0); wat.root.position.copy(hero.root.position);
      // water level: 60% of 1.78 m, drains over the days, refills when he drinks
      const lvl = 0.6 - 0.06 * sm(5.4, 8.6, t) - 0.1 * sm(9.3, 13.0, t) - 0.12 * sm(13.6, 19.5, t) - 0.12 * sm(20.6, 28.5, t) + 0.4 * sm(29.8, 30.8, t);
      plane.constant = 1.78 * Math.min(0.6, lvl) + drop; wat.root.fade(0.55 * sm(2.6, 3.0, t));
      const k = keyCam(KEYS, t); const wob = 0.05 * sm(23.6, 24.0, t) * (1 - sm(25.6, 26.0, t)); cam.position.copy(k.pos).add(V(Math.sin(t * 2.3) * wob, Math.sin(t * 1.9) * wob, 0)); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos(), chest = hero.world('Spine2'), hand = hero.world('RightHand');
      bottle.position.copy(hand).add(V(0, -0.1, 0.05)).lerp(head.clone().add(V(0, -0.02, 0.12)), drink); bottle.rotation.set(drink * 2.0 + 0.3 * shakeB, 0, 0);
      vapor.update(head.clone().add(V(0, -0.05, 0.12)), V(0, 0.3, 1), 5.6, 7.4, t, 0.5, 0.4);
      sweat.update(head.clone().add(V(0, 0.05, 0.08)), V(0, -1, 0.1), 7.6, 9.2, t, 0.8, 0.3);
      const x1 = sm(17.3, 17.6, t) * (1 - sm(19.9, 20.2, t)), x2 = sm(21.6, 21.9, t) * (1 - sm(23.5, 23.8, t));
      if (x1 > 0.01) xr.show(chest.clone().add(V(0.35, 0.2, 0.2)), x1, drawHeart, sm(17.9, 19.0, t), t);
      else if (x2 > 0.01) xr.show(hero.world('Spine').clone().add(V(0.35, 0.25, 0.2)), x2, drawKidneys, sm(22.5, 23.0, t), t); else xr.visible = false;
      const up = (y) => V(0, y, 0);
      showLabel(L.pct, head.clone().add(up(0.45)), t, 3.6, 5.3); showLabel(L.breath, head.clone().add(V(0.3, 0.42, 0)), t, 7.3, 8.1); showLabel(L.sweatL, head.clone().add(V(0.3, 0.42, 0)), t, 8.1, 9.2);
      showLabel(L.d1, head.clone().add(up(0.38)), t, 9.3, 10.4); showLabel(L.ache, head.clone().add(up(0.38)), t, 10.6, 13.5);
      showLabel(L.d2, head.clone().add(up(0.35)), t, 13.6, 14.7); showLabel(L.dry, head.clone().add(up(0.35)), t, 14.8, 16.0); showLabel(L.wrink, head.clone().add(up(0.35)), t, 16.1, 17.3); showLabel(L.heart, head.clone().add(up(0.35)), t, 18.4, 20.3);
      showLabel(L.d3, head.clone().add(up(0.45)), t, 20.6, 21.6); showLabel(L.kid, head.clone().add(up(0.45)), t, 21.8, 23.6); showLabel(L.conf, head.clone().add(up(0.45)), t, 23.8, 25.5);
      showLabel(L.max, head.clone().add(up(0.45)), t, 27.6, 29.4); showLabel(L.drink, head.clone().add(V(0.2, 0.45, 0)), t, 29.6, 31.2);
      return { bloom: 0.25, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
