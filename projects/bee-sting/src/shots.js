import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, creature, person, label, showLabel, xray, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 30.0;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/bee', 'sf/wasp', 'sf/honey_bee'], hdris: ['sunflowers'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawStinger(g, k, t, mode) { // skin cross-section, barbed stinger; mode 0 goes in, 1 venom sac pumping, 2 scrape; 3 smooth wasp stinger
  g.fillStyle = 'rgba(236,190,160,1)'; g.fillRect(0, 260, 512, 252); g.fillStyle = 'rgba(250,215,190,1)'; g.fillRect(0, 300, 512, 212);
  const depth = mode === 0 ? k : 1; const y0 = lerp(80, 200, depth);
  g.strokeStyle = '#3a2a1a'; g.lineWidth = 9; g.beginPath(); g.moveTo(256, y0); g.lineTo(256, y0 + 180); g.stroke();
  if (mode !== 3) { g.lineWidth = 5; for (let i = 1; i < 7; i++) { const y = y0 + i * 24; g.beginPath(); g.moveTo(256, y); g.lineTo(240, y - 14); g.moveTo(256, y); g.lineTo(272, y - 14); g.stroke(); } }
  if (mode === 1 || mode === 2) { const p = 1 + 0.15 * Math.sin(t * 8); g.fillStyle = '#d8c040'; g.beginPath(); g.ellipse(256 + (mode === 2 ? 180 * k : 0), y0 - 20, 36 * p, 28 * p, 0, 0, 6.283); g.fill(); if (mode === 1) { g.fillStyle = 'rgba(200,220,60,0.8)'; for (let i = 0; i < 6; i++) { const yy = y0 + ((t * 120 + i * 30) % 180); g.beginPath(); g.arc(256, yy, 6, 0, 6.283); g.fill(); } } }
  if (mode === 2) { g.fillStyle = '#c8c8d0'; g.fillRect(40 + 200 * k, y0 - 50, 140, 16); }
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-3, 7, 4] }), 'sunflowers', { height: 2, radius: 50, sun: 2.0, env: 0.95 });
  const bush = fit(prop('sf/honey_bee'), 1.2, 'max'); bush.position.set(1.0, 0, -0.8); scene.add(bush);
  const bee = creature('sf/bee', 0.3, 'max'); scene.add(bee.root); const tint = (o, c) => o.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(c); m.material.roughness = 0.6; } }); tint(bee.root, 0xc8901a);
  const wasp = creature('sf/wasp', 0.36, 'max'); scene.add(wasp.root); tint(wasp.root, 0xd8b020);
  const deadBee = fit(prop('sf/bee'), 0.3, 'max'); scene.add(deadBee); tint(deadBee, 0x8a6a2a);
  const hero = person('hero'); scene.add(hero.root);
  const xr = xray(0.34); scene.add(xr);
  const L = { barbs: label('TINY BARBS', 0.8), harpoon: label('LIKE A HARPOON', 1.0), stuck: label('STUCK!', 0.6), rips: label('STINGER RIPS OUT', 1.1), sac: label('VENOM SAC', 0.7), minute: label('PUMPS FOR A MINUTE', 1.2), scrape: label('SCRAPE IT OUT', 0.9), squeeze: label("DON'T SQUEEZE", 0.9), dies: label('THE BEE DIES', 0.9), wasps: label('WASPS: SMOOTH STINGER', 1.3), again: label('STING AGAIN & AGAIN!', 1.3) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.6, 1.5, 3.0], [0.1, 1.2, 0]], [2.6, [0.9, 1.4, 2.4], [0.0, 1.15, 0.1]], [21.8, [0.9, 1.4, 2.4], [0.0, 1.15, 0.1]], [22.4, [0.9, 0.6, 1.6], [0.4, 0.15, 0.3]], [24.8, [0.9, 0.6, 1.6], [0.4, 0.15, 0.3]], [25.4, [0.9, 1.4, 2.4], [0.0, 1.15, 0.1]], [30.0, [0.9, 1.4, 2.4], [0.0, 1.15, 0.1]]];
  return {
    scene, camera: cam,
    update(t) {
      const ouch = sm(1.8, 2.1, t) * (1 - sm(3.0, 3.4, t)) + sm(26.4, 26.6, t) * (1 - sm(27.2, 27.4, t)) + sm(27.9, 28.1, t) * (1 - sm(28.6, 28.8, t));
      hero.update(t, { idle: 1 }, 1, { flinch: 0.5 * ouch, point: 0.7 * sm(2.4, 2.8, t) * (1 - sm(21.6, 22.0, t)), lookDown: 0.4 * sm(2.4, 2.8, t) * (1 - sm(21.6, 22.0, t)) });
      hero.root.position.set(-0.45, 0, 0.0); hero.root.rotation.y = 1.25;
      scene.updateMatrixWorld(true);
      const arm = hero.world('RightForeArm').lerp(hero.world('RightHand'), 0.5);
      // bee: flies in, stings 1.9, flies away 10.2 (leaving stinger), dies on ground 22.4
      const flyAway = sm(10.4, 11.6, t);
      bee.play(t, 'hover', 1.5); bee.root.visible = t < 12 || (t > 21.8 && t < 25.2);
      if (t < 1.9) bee.root.position.copy(arm.clone().add(V(0.6 * (1 - t / 1.9), 0.4 * (1 - t / 1.9), 0.2)));
      else if (t < 21.8) bee.root.position.copy(arm.clone().add(V(0.05 + 1.2 * flyAway, 0.06 + 0.9 * flyAway, 0.05)));
      bee.root.lookAt(arm);
      deadBee.visible = t > 22.2 && t < 25.2; deadBee.position.set(0.4, 0.03, 0.3); deadBee.rotation.set(Math.PI, 0.6, 0);
      wasp.play(t, 0, 1.5); wasp.root.visible = t > 25.0; const wp = Math.sin(t * 4); wasp.root.position.copy(arm.clone().add(V(0.12 + 0.12 * Math.max(0, wp), 0.06 + 0.12 * Math.max(0, wp), 0.06)));
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const mode = t < 10.1 ? 0 : t < 18.0 ? 1 : t < 22 ? 2 : 3; const kk = mode === 0 ? sm(6.8, 8.8, t) : mode === 2 ? sm(18.8, 20.6, t) : 0;
      const xk = sm(3.0, 3.3, t) * (1 - sm(21.6, 21.9, t)) + sm(25.6, 25.9, t);
      if (xk > 0.01) xr.show(arm.clone().add(V(0.05, 0.55, 0.1)), Math.min(1, xk), (g, a, tt) => drawStinger(g, a, tt, mode), kk, t); else xr.visible = false;
      const lp = arm.clone().add(V(0.3, 0.72, 0.1));
      showLabel(L.barbs, lp, t, 4.4, 5.5); showLabel(L.harpoon, lp, t, 5.6, 7.0); showLabel(L.stuck, lp, t, 8.8, 10.1);
      showLabel(L.rips, lp, t, 11.6, 13.8); showLabel(L.sac, lp, t, 14.3, 15.6); showLabel(L.minute, lp, t, 15.7, 18.0);
      showLabel(L.scrape, lp, t, 18.9, 20.4); showLabel(L.squeeze, lp, t, 20.5, 21.8); showLabel(L.dies, V(0.4, 0.4, 0.3), t, 22.8, 24.9);
      showLabel(L.wasps, lp, t, 25.6, 27.0); showLabel(L.again, lp, t, 27.1, 30.0);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
