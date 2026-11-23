import * as THREE from 'three';
import { labelCam, loadKit, world, prop, texMat, person, label, showLabel, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 28.0;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['covered_car', 'wooden_crate_01', 'Barrel_02', 'concrete_road_barrier'], hdris: ['approaching_storm'], tex: ['concrete_wall_003', 'weathered_brown_planks'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
// funnel of particles: dense swirling cone
function funnel(n = 7000) {
  const g = new THREE.BufferGeometry(); const a = new Float32Array(n * 3); g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x3a3836, size: 2.2, map: new THREE.CanvasTexture(c), transparent: true, opacity: 0.55, depthWrite: false })); p.frustumCulled = false;
  const seed = Array.from({ length: n }, (_, i) => [Math.random(), Math.random(), Math.random()]);
  p.update = (cx, cz, t) => { for (let i = 0; i < n; i++) { const [h, r0, ph] = seed[i]; const y = h * 40; const rad = 1.2 + y * 0.32 + r0 * 1.5; const ang = ph * 6.283 + t * (3.2 - h * 1.8); a[i * 3] = cx + Math.cos(ang) * rad; a[i * 3 + 1] = y; a[i * 3 + 2] = cz + Math.sin(ang) * rad; } g.attributes.position.needsUpdate = true; };
  return p;
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 14, sunDir: [-3, 6, 4] }), 'approaching_storm', { height: 3, radius: 90, sun: 0.9, sunColor: 0xc8d0e0, env: 0.6 });
  const tw = funnel(); scene.add(tw);
  const house = new THREE.Group(); { const m = texMat('weathered_brown_planks', 2, 1); const w = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 4), m); w.position.y = 1.5; house.add(w); const roof = new THREE.Mesh(new THREE.ConeGeometry(3.8, 1.8, 4), texMat('weathered_brown_planks', 2, 1, { color: 0x6a4a3a })); roof.rotation.y = Math.PI / 4; roof.position.y = 3.9; house.add(roof); house.userData.roof = roof; } house.position.set(-10, 0, -20); scene.add(house);
  const car = prop('covered_car', 1); car.position.set(5, 0, -10); scene.add(car);
  const debris = []; for (let i = 0; i < 30; i++) { const d = i % 3 === 0 ? new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.2), new THREE.MeshStandardMaterial({ color: 0x8a6a44 })) : i % 3 === 1 ? new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.4), new THREE.MeshStandardMaterial({ color: 0xcfe0ee, metalness: 0.6, roughness: 0.1, transparent: true, opacity: 0.7, side: THREE.DoubleSide })) : new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.5), new THREE.MeshStandardMaterial({ color: 0x8a9098, metalness: 0.8 })); d.castShadow = true; scene.add(d); debris.push(d); }
  // ditch
  const ditch = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.02, 0.8), new THREE.MeshStandardMaterial({ color: 0x5a4a30, roughness: 1 })); ditch.position.set(0, 0.01, 1.25); ditch.rotation.y = Math.PI / 2; scene.add(ditch);
  // highway bridge
  const bridge = new THREE.Group(); { const m = texMat('concrete_wall_003', 4, 1); const deck = new THREE.Mesh(new THREE.BoxGeometry(14, 1.0, 5), m); deck.position.y = 4.5; bridge.add(deck); for (const x of [-5, 5]) { const p = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 4), m); p.position.set(x, 2, 0); bridge.add(p); } } bridge.position.set(0, 0, -3); scene.add(bridge);
  const windS = stream(1500, 0xbfb8a8, 0.06); scene.add(windS);
  const hero = person('hero'); scene.add(hero.root);
  const L = { kmh: label('300+ KM/H WINDS', 14), lift: label('LIFTS CARS', 5), rip: label('RIPS HOUSES APART', 6), debris: label('FLYING DEBRIS', 1.6), wood: label('WOOD', 1.4), glass: label('GLASS', 1.4), metal: label('METAL', 1.4), bullets: label('LIKE BULLETS', 1.2), ditch: label('FIND A DITCH', 1.0), flat: label('LIE FLAT', 0.8), head: label('COVER YOUR HEAD', 1.1), never: label('NEVER UNDER A BRIDGE', 3.6), faster: label('WIND GETS FASTER!', 3.4) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(46, 720 / 1280, 0.05, 600);
  const KEYS = [[0, [4, 2, 12], [0, 6, -14]], [2.2, [6, 4, 14], [0, 10, -16]], [10.4, [6, 4, 14], [-2, 6, -14]], [11.0, [2.2, 1.6, 6.2], [0, 1.2, 1.6]], [16.8, [2.2, 1.6, 6.2], [0, 1.2, 1.6]], [17.4, [1.8, 1.8, 5.0], [0, 0.4, 2]], [21.6, [1.8, 1.8, 5.0], [0, 0.3, 2]], [22.2, [4, 2.2, 9], [0, 2.5, -3]], [28.0, [4, 2.2, 9], [0, 2.5, -3]]];
  return {
    scene, camera: cam,
    update(t) {
      const tx = lerp(-6, 4, t / 28), tz = -45; tw.update(tx, tz, t);
      const liftC = sm(7.6, 9.6, t); car.position.set(lerp(5, tx + 3, liftC), 8 * liftC + Math.sin(t * 3) * liftC, lerp(-10, tz + 2, liftC)); car.rotation.set(t * liftC, t * 1.5 * liftC, 0);
      const rip = sm(9.0, 10.6, t); house.userData.roof.position.set(4 * rip, 3.9 + 10 * rip, -3 * rip); house.userData.roof.visible = t < 10.8; house.userData.roof.rotation.set(rip * 3, Math.PI / 4 + rip * 4, rip);
      const fl = t > 11 && t < 17;
      debris.forEach((d, i) => { const u = ((t * (1.4 + (i % 5) * 0.2) + i * 0.37) % 2) / 2; d.visible = fl || t < 11; d.position.set(lerp(-8, 8, u), 0.6 + (i % 4) * 0.7 + Math.sin(u * 6 + i) * 0.3, 0.5 + (i % 6) * 0.5 - 1.5); d.rotation.set(t * 5 + i, t * 3, i); });
      const lie = sm(19.6, 20.6, t), cover = sm(20.6, 21.2, t);
      hero.update(t, { idle: 1, run: t > 17.4 && t < 19.6 ? 1 : 0 }, 1, { flinch: 0.6 * sm(11, 11.4, t) * (1 - sm(17, 17.4, t)), handsHead: cover * (1 - sm(21.6, 22, t)), leanBack: 0.4 * sm(24.6, 25, t) });
      hero.root.position.set(t > 21.8 ? 0 : 0, lie * (1 - sm(21.8, 22.2, t)) * 0.12, t > 21.8 ? -3 : lerp(3.6, 2, sm(17.4, 19.6, t))); hero.root.rotation.set(-Math.PI / 2 * lie * (1 - sm(21.8, 22.2, t)), Math.PI, 0);
      bridge.visible = t > 21.8; ditch.visible = t > 17.2 && t < 22;
      const k = keyCam(KEYS, t); const shk = 0.05; cam.position.copy(k.pos).add(V(Math.sin(t * 40) * shk, Math.sin(t * 33) * shk, 0)); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      windS.update(V(-10, 1.5, 0), V(1, 0.1, 0.1), 0, 28, t, 12, 8); if (t > 24.6) windS.update(V(-6, 1.5, -3), V(1, 0, 0), 24.6, 28, t, 20, 3);
      const hp = hero.headPos().add(V(0, 0.45, 0));
      showLabel(L.kmh, V(tx, 30, tz), t, 3.4, 7.0); showLabel(L.lift, car.position.clone().add(V(0, 3, 0)), t, 7.8, 9.0); showLabel(L.rip, V(-8, 9, -14), t, 9.2, 10.6);
      showLabel(L.debris, V(0, 3.2, 0), t, 11.2, 13.0); showLabel(L.wood, debris[0].position.clone().add(V(0, 0.5, 0)), t, 13.1, 13.8); showLabel(L.glass, debris[1].position.clone().add(V(0, 0.5, 0)), t, 13.8, 14.4); showLabel(L.metal, debris[2].position.clone().add(V(0, 0.5, 0)), t, 14.4, 15.2); showLabel(L.bullets, V(0, 3.2, 0), t, 15.3, 17.0);
      showLabel(L.ditch, V(0, 1.2, 2), t, 18.6, 19.7); showLabel(L.flat, V(0, 1.2, 2), t, 19.8, 20.6); showLabel(L.head, V(0, 1.2, 2), t, 20.7, 21.8);
      showLabel(L.never, V(0, 6.2, -3), t, 22.1, 24.6); showLabel(L.faster, V(0, 6.2, -3), t, 24.7, 28.0);
      return { bloom: 0.2, exposure: 0.85 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
