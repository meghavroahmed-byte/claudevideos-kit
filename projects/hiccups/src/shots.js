import * as THREE from 'three';
import { labelCam, loadKit, world, prop, person, label, showLabel, xray, keyCam, stream, canvasTex, ghost, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 29.3;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['dining_table', 'hamburger_buns'], hdris: ['comfy_cafe'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const HICS = [0.6, 1.45, 15.0, 20.2, 25.0, 26.2, 27.4, 28.6];
const hicK = (t) => Math.max(...HICS.map(h => Math.max(0, 1 - Math.abs(t - h) / 0.18)));
function drawDiaphragm(g, k, t, mode) {
  for (const sx of [-1, 1]) { g.save(); g.translate(256 + sx * 90, 200); g.fillStyle = 'rgba(255,150,160,0.7)'; g.beginPath(); g.ellipse(0, 0, 72, 115 + 15 * k, sx * 0.15, 0, 6.283); g.fill(); g.stroke(); g.restore(); }
  const drop = mode === 1 ? 40 * Math.max(0, Math.sin(t * 2.4)) : mode === 2 ? 70 * Math.max(0, Math.sin(t * 30)) * k : 0;
  g.strokeStyle = '#ff5a4a'; g.lineWidth = 16; g.beginPath(); g.moveTo(70, 380); g.quadraticCurveTo(256, 250 + drop * 1.6, 442, 380); g.stroke();
  g.fillStyle = '#ff5a4a'; g.font = '900 34px Cap, sans-serif'; g.textAlign = 'center';
}
function drawFlap(g, k) { // side view of the throat: airway + epiglottis flap closing
  g.lineWidth = 12; g.beginPath(); g.moveTo(200, 60); g.lineTo(200, 460); g.moveTo(300, 60); g.lineTo(300, 200); g.lineTo(300, 460); g.stroke();
  g.save(); g.translate(300, 200); g.rotate(-Math.PI / 2 * (1 - k) + 0.05); g.fillStyle = '#ffd24a'; g.fillRect(-100, -10, 100, 20); g.restore();
  g.fillStyle = 'rgba(160,220,255,0.9)'; for (let i = 0; i < 6; i++) { const y = 420 - ((i * 60 + k * 200) % 220); g.beginPath(); g.arc(250, y, 10, 0, 6.283); g.fill(); }
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-3, 6, 4] }), 'comfy_cafe', { height: 1.6, radius: 9, sun: 1.0, env: 1.0 });
  const table = prop('dining_table'); table.position.set(0.1, 0, -0.75); scene.add(table);
  const burger = prop('hamburger_buns', 1.3); scene.add(burger);
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.12, 32), new THREE.MeshStandardMaterial({ map: canvasTex(256, 128, (c) => { c.fillStyle = '#c8102e'; c.fillRect(0, 0, 256, 128); c.fillStyle = '#fff'; c.font = '900 52px Cap, sans-serif'; c.fillText('FIZZ', 70, 82); }), metalness: 0.6, roughness: 0.3 })); scene.add(can);
  const bubbles = stream(200, 0xffffff, 0.02); scene.add(bubbles);
  const hero = person('hero'); scene.add(hero.root);
  const oldMan = person('hero', { print: false }); ghost(oldMan.root, 0xbfe6ff, { inPlace: true }); scene.add(oldMan.root);
  const xr = xray(0.42); scene.add(xr);
  const L = { dia: label('DIAPHRAGM', 0.85), down: label('MOVES DOWN = BREATHE IN', 1.4), fast: label('EATING TOO FAST', 1.0), fizz: label('FIZZY DRINKS', 0.9), laugh: label('LAUGHING', 0.8), spasm: label('SPASM!', 0.7), gulp: label('GULP OF AIR', 0.85), flap: label('FLAP SLAMS SHUT', 1.0), hic: label('HIC!', 0.7), mins: label('STOPS IN MINUTES', 1.1), yrs: label('68 YEARS!', 1.0) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.7, 1.4, 3.4], [0, 1.1, 0]], [1.8, [0.4, 1.5, 2.3], [0, 1.3, 0]], [8.4, [0.4, 1.5, 2.3], [0, 1.3, 0]], [9.0, [0.8, 1.4, 3.0], [0, 1.1, -0.2]], [13.9, [0.8, 1.4, 3.0], [0, 1.1, -0.2]],
    [14.4, [0.35, 1.55, 2.2], [0, 1.35, 0]], [21.2, [0.35, 1.55, 2.2], [0, 1.4, 0]], [22.0, [0.8, 1.4, 3.4], [0, 1.1, 0]], [24.2, [0.8, 1.4, 3.4], [0, 1.1, 0]], [25.0, [1.4, 1.5, 4.4], [-0.4, 1.0, -0.3]], [29.3, [1.4, 1.5, 4.4], [-0.4, 1.0, -0.3]]];
  return {
    scene, camera: cam,
    update(t) {
      const h = hicK(t);
      const eat = sm(8.6, 8.9, t) * (1 - sm(9.9, 10.2, t)), drink = sm(10.0, 10.3, t) * (1 - sm(11.3, 11.6, t)), laugh = sm(11.6, 11.9, t) * (1 - sm(13.6, 14.0, t));
      hero.update(t, { idle: 1 }, 1, { point: 0.55 * (eat + drink), lookUp: 0.25 * drink, flinch: 0.5 * laugh * Math.abs(Math.sin(t * 8)), lean: 0.3 * laugh, leanBack: 0.35 * h, lookUp2: 0 });
      hero.root.position.set(-0.1, 0.02 * h, 0.1); hero.root.rotation.y = 0.15;
      oldMan.update(t, { idle: 1 }, 1, { leanBack: 0.35 * h, slump: 0.4 }); oldMan.root.fade(0.7 * sm(24.6, 25.0, t)); oldMan.root.position.set(-1.0, 0.02 * h, -0.5); oldMan.root.rotation.y = 0.4;
      const k = keyCam(KEYS, t); const s = 0.02 * h; cam.position.copy(k.pos).add(V(0, s, 0)); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const hand = hero.world('RightHand'), head = hero.headPos(), chest = hero.world('Spine2');
      burger.position.copy(eat > 0.01 ? hand.clone().add(V(0, 0.02, 0.06)) : V(-0.15, 0.87, -0.4)); burger.rotation.set(0, 0, 0);
      can.position.copy(drink > 0.01 ? hand.clone().add(V(0, 0.05, 0.05)) : V(0.25, 0.93, -0.4)); can.rotation.set(-1.6 * drink, 0, 0);
      bubbles.update(can.position.clone().add(V(0, 0.06, 0)), V(0, 1, 0), 9.9, 11.6, t, 0.25, 0.08);
      const x1 = sm(2.0, 2.3, t) * (1 - sm(8.2, 8.5, t)), x2 = sm(14.2, 14.4, t) * (1 - sm(15.8, 16.0, t)), x3 = sm(16.0, 16.2, t) * (1 - sm(19.5, 19.8, t));
      if (x1 > 0.01) xr.show(chest.clone().add(V(0.45, 0.0, 0.2)), x1, (g, kk, tt) => drawDiaphragm(g, kk, tt, t > 5.9 ? 1 : 0), sm(6.0, 8.0, t), t);
      else if (x2 > 0.01) xr.show(chest.clone().add(V(0.45, 0.0, 0.2)), x2, (g, kk, tt) => drawDiaphragm(g, kk, tt, 2), 1, t);
      else if (x3 > 0.01) xr.show(head.clone().add(V(0.38, -0.18, 0.15)), x3, drawFlap, sm(18.3, 18.7, t), t); else xr.visible = false;
      const up = (y) => V(0, y, 0);
      showLabel(L.dia, head.clone().add(up(0.36)), t, 4.4, 5.9); showLabel(L.down, head.clone().add(up(0.36)), t, 6.0, 8.3);
      showLabel(L.fast, head.clone().add(up(0.4)), t, 8.7, 10.0); showLabel(L.fizz, head.clone().add(up(0.4)), t, 10.0, 11.3); showLabel(L.laugh, head.clone().add(up(0.4)), t, 11.6, 13.9);
      showLabel(L.spasm, head.clone().add(up(0.33)), t, 14.4, 15.8); showLabel(L.gulp, head.clone().add(up(0.33)), t, 16.1, 17.3); showLabel(L.flap, head.clone().add(up(0.33)), t, 17.4, 19.6);
      showLabel(L.hic, head.clone().add(V(0.25, 0.3, 0)), t, 20.0, 21.2); showLabel(L.mins, head.clone().add(up(0.4)), t, 21.6, 24.2); showLabel(L.yrs, V(-1.0, 2.3, -0.5), t, 25.0, 29.3);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
