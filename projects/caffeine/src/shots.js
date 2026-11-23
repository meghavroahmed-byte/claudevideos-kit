import * as THREE from 'three';
import { labelCam, loadKit, world, prop, person, label, showLabel, xray, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 23.4;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['CoffeeCart_01'], hdris: ['comfy_cafe'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
// receptors: 5 slots on a neuron membrane. mode 0 adenosine fills (sleepy), 1 caffeine blocks, 2 caffeine leaves -> adenosine floods
function drawReceptors(g, k, t, mode) {
  g.fillStyle = 'rgba(255,170,190,0.9)'; g.fillRect(0, 330, 512, 182);
  for (let i = 0; i < 5; i++) { const x = 60 + i * 98; g.fillStyle = 'rgba(12,20,38,1)'; g.beginPath(); g.moveTo(x - 26, 330); g.lineTo(x - 18, 300); g.lineTo(x + 18, 300); g.lineTo(x + 26, 330); g.fill(); }
  const piece = (x, y, col, sq) => { g.fillStyle = col; g.beginPath(); if (sq) g.rect(x - 22, y - 22, 44, 44); else g.arc(x, y, 22, 0, 6.283); g.fill(); };
  for (let i = 0; i < 5; i++) { const x = 60 + i * 98;
    if (mode === 0) { const on = i / 5 < k; piece(x, on ? 312 : 120 + (i * 37) % 120, '#7fb8ff', false); }
    else if (mode === 1) { const on = i / 5 < k; piece(x, on ? 312 : 100 + (i * 41) % 100, '#c88a4a', true); piece(x + 30, 200 + Math.sin(t * 3 + i) * 30, '#7fb8ff', false); }
    else { const c = 312 - 260 * k; piece(x + 20, c, '#c88a4a', true); piece(x, 312 * k + 150 * (1 - k), '#7fb8ff', false); piece(x - 35, 260 * k + 100, '#7fb8ff', false); }
  }
  g.fillStyle = '#fff'; g.font = '900 30px Cap, sans-serif'; g.fillText('● ADENOSINE', 30, 50); g.fillStyle = '#e8b070'; g.fillText('■ CAFFEINE', 300, 50);
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-3, 6, 4] }), 'comfy_cafe', { height: 1.6, radius: 9, sun: 1.0, env: 1.0 });
  const cart = prop('CoffeeCart_01', 1); cart.position.set(1.4, 0, -1.2); cart.rotation.y = -0.5; scene.add(cart);
  const cup = new THREE.Group(); { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.1, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xf4f0e8, roughness: 0.4, side: THREE.DoubleSide })); const cf = new THREE.Mesh(new THREE.CircleGeometry(0.042, 24), new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.2 })); cf.rotation.x = -Math.PI / 2; cf.position.y = 0.04; const h = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.007, 8, 16), c.material); h.position.set(0.05, 0, 0); cup.add(c, cf, h); } scene.add(cup);
  const steam = stream(80, 0xffffff, 0.04); steam.material.opacity = 0.35; scene.add(steam);
  const hero = person('hero'); scene.add(hero.root);
  const xr = xray(0.4); scene.add(xr);
  const L = { aden: label('ADENOSINE BUILDS UP', 1.2), sleepy: label('= SLEEPY', 0.8), look: label('CAFFEINE LOOKS SIMILAR', 1.3), block: label('BLOCKS THE SPOTS', 1.1), awake: label('WIDE AWAKE!', 0.9), off: label('CAFFEINE WEARS OFF', 1.2), crash: label('THE CRASH!', 0.9) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.5, 1.45, 3.2], [0.1, 1.15, 0]], [2.2, [0.4, 1.55, 2.4], [0.2, 1.4, 0]], [23.4, [0.4, 1.55, 2.4], [0.2, 1.4, 0]]];
  return {
    scene, camera: cam,
    update(t) {
      const drink = Math.max(0, 1 - Math.abs(t - 1.0) / 0.5), sleepy = sm(5.8, 7.4, t) * (1 - sm(12.4, 13.2, t)) + sm(20.0, 20.8, t), awake = sm(13.2, 13.8, t) * (1 - sm(17.4, 18.2, t));
      hero.update(t, { idle: 1 }, 1, { point: 0.7 * (t < 8.2 ? 1 : 0) + 0.3 * drink, lookUp: 0.3 * drink, slump: 0.7 * sleepy, lookDown: 0.4 * sleepy, armsUp: 0.8 * awake * Math.abs(Math.sin(t * 3)), facepalm: 0.6 * sm(21.0, 21.4, t) });
      hero.root.position.set(-0.15, -0.06 * sleepy, 0); hero.root.rotation.y = 0.15;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const hand = hero.world('RightHand'), head = hero.headPos();
      cup.visible = t < 8.2; cup.position.copy(hand.clone().add(V(0, 0.04, 0.05)).lerp(head.clone().add(V(0, -0.08, 0.1)), drink)); cup.rotation.x = -0.9 * drink;
      steam.update(cup.position.clone().add(V(0, 0.06, 0)), V(0, 1, 0), 0, 8.0, t, 0.25, 0.08);
      const mode = t < 8.3 ? 0 : t < 17.0 ? 1 : 2; const kk = mode === 0 ? sm(3.5, 7.2, t) : mode === 1 ? sm(10.2, 12.6, t) : sm(17.6, 20.4, t);
      const xk = sm(2.6, 2.9, t);
      if (xk > 0.01) xr.show(head.clone().add(V(0.38, -0.04, 0.1)), xk, (g, a, tt) => drawReceptors(g, a, tt, mode), kk, t); else xr.visible = false;
      const lp = head.clone().add(V(0, 0.34, 0));
      showLabel(L.aden, lp, t, 3.4, 6.1); showLabel(L.sleepy, lp, t, 6.6, 8.2); showLabel(L.look, lp, t, 8.4, 10.2); showLabel(L.block, lp, t, 10.3, 13.0);
      showLabel(L.awake, lp, t, 13.2, 16.8); showLabel(L.off, lp, t, 17.0, 19.6); showLabel(L.crash, lp, t, 19.8, 23.4);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
