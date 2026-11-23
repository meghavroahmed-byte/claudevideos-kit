import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, person, label, showLabel, xray, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 25.4;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/mosquito', 'sf/helicopter', 'plastic_bottle_gallon'], hdris: ['suburban_garden'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawTubes(g, k, t) { // insect body with tracheae; at giant size oxygen can't reach the middle
  g.fillStyle = 'rgba(160,140,110,0.85)'; g.beginPath(); g.ellipse(256, 256, 210, 110, 0, 0, 6.283); g.fill();
  g.strokeStyle = '#d8e8ff'; g.lineWidth = 6; for (let i = 0; i < 8; i++) { const x = 80 + i * 50; g.beginPath(); g.moveTo(x, 160); g.quadraticCurveTo(x + 10, 220, 256, 256); g.stroke(); }
  g.fillStyle = '#7fd8ff'; for (let i = 0; i < 24; i++) { const u = ((t * 0.5 + i / 24) % 1); const reach = lerp(1, 0.35, k); if (u > reach) continue; const x0 = 80 + (i % 8) * 50; g.beginPath(); g.arc(lerp(x0, 256, u), lerp(160, 256, u), 7, 0, 6.283); g.fill(); }
  if (k > 0.5) { g.strokeStyle = '#ff3b30'; g.lineWidth = 10; g.beginPath(); g.arc(256, 256, 44, 0, 6.283); g.stroke(); }
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 6, sunDir: [-4, 8, 3] }), 'suburban_garden', { height: 2, radius: 50, sun: 2.0, env: 0.95 });
  const mos = fit(prop('sf/mosquito'), 2.2, 'max', { ground: false }); mos.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.multiply(new THREE.Color(0x6a5a48)); m.material.roughness = 0.5; } }); const mosG = new THREE.Group(); mosG.add(mos); scene.add(mosG);
  const heli = fit(prop('sf/helicopter'), 8, 'max', { ground: false }); scene.add(heli);
  const blood = new THREE.Group(); for (let i = 0; i < 3; i++) { const b = prop('plastic_bottle_gallon', 2.2); b.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(0x9a0a10); } }); b.position.x = i * 0.45; blood.add(b); } scene.add(blood);
  const hero = person('hero'); scene.add(hero.root);
  const wind = stream(300, 0xffffff, 0.04); wind.material.opacity = 0.4; scene.add(wind);
  const xr = xray(0.7); scene.add(xr);
  const L = { beat: label('HUNDREDS OF BEATS / SECOND', 1.6), heliL: label('LOUD AS A HELICOPTER', 7), prob: label('PROBOSCIS', 1.0), arm: label('= ARM LENGTH', 1.0), liters: label('LITERS OF BLOOD', 1.2), never: label('COULD NEVER HAPPEN', 1.4), tubes: label('BREATHES THROUGH TUBES', 1.5), o2: label('NOT ENOUGH OXYGEN', 1.4) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 400);
  const KEYS = [[0, [0.6, 1.6, 5.4], [0, 1.3, 0]], [3.0, [0.6, 1.6, 5.4], [0, 1.4, 0]], [8.0, [0.5, 1.7, 4.2], [0, 1.4, 0]], [16.4, [0.5, 1.7, 4.2], [0, 1.3, 0]], [17.2, [0.6, 1.8, 5.6], [0, 1.4, 0]], [25.4, [0.6, 1.8, 5.6], [0, 1.4, 0]]];
  return {
    scene, camera: cam,
    update(t) {
      const hover = Math.sin(t * 3) * 0.08, buzz = Math.sin(t * 90) * 0.01;
      const attack = sm(12.8, 13.6, t) * (1 - sm(16.0, 16.6, t));
      mosG.position.set(lerp(0.7, 0.25, attack), 1.6 + hover + buzz - 0.1 * attack, lerp(-0.4, -0.1, attack)); mosG.rotation.set(0.2 * attack, -1.9, 0.05 * Math.sin(t * 2));
      const shrink = sm(17.6, 19.0, t); mosG.scale.setScalar(lerp(1, 0.004, shrink)); mosG.visible = shrink < 0.995 || t > 19.4;
      if (t > 19.4) { mosG.scale.setScalar(1); mosG.position.set(0.7, 1.6, -0.4); }
      hero.update(t, { idle: 1 }, 1, { flinch: 0.7 * sm(0.8, 1.2, t) * (1 - sm(16.6, 17.2, t)), point: 0.6 * sm(17.8, 18.2, t) * (1 - sm(19.0, 19.4, t)) });
      hero.root.position.set(-0.75, 0, 0.3); hero.root.rotation.y = 0.9;
      heli.visible = t > 5.6 && t < 7.8; heli.position.set(2.5, 9 + Math.sin(t) * 0.2, -22); heli.rotation.y = -0.6;
      blood.visible = t > 13.8 && t < 16.6; blood.position.set(-0.5, 0, -0.9);
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      wind.update(mosG.position.clone(), V(-1, -0.2, 0.3), 3.0, 8.0, t, 1.5, 1.2);
      const xk = sm(19.6, 19.9, t);
      if (xk > 0.01) xr.show(mosG.position.clone().add(V(0, 1.0, 0)), xk, drawTubes, sm(21.4, 23.6, t), t); else xr.visible = false;
      const mp = mosG.position.clone().add(V(0, 0.9, 0));
      showLabel(L.beat, mp, t, 3.0, 5.6); showLabel(L.heliL, V(2.5, 13, -22), t, 5.8, 7.8); showLabel(L.prob, mp, t, 8.2, 10.6); showLabel(L.arm, mp, t, 10.7, 12.6);
      showLabel(L.liters, V(-0.2, 1.2, -0.9), t, 13.8, 16.4); showLabel(L.never, hero.headPos().add(V(0, 0.45, 0)), t, 16.7, 19.0);
      showLabel(L.tubes, mp.clone().add(V(0, 0.9, 0)), t, 19.6, 21.6); showLabel(L.o2, mp.clone().add(V(0, 0.9, 0)), t, 21.7, 25.4);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
