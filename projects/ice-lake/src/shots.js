import * as THREE from 'three';
import { labelCam, loadKit, world, texMat, person, label, showLabel, xray, keyCam, stream, waterMat, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 26.4;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { hdris: ['winter_lake_01'], tex: ['snow_02'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawHeart(g, k, t) {
  g.save(); g.translate(256, 230); const beat = 1 + 0.16 * Math.max(0, Math.sin(t * lerp(8, 16, k)));
  g.scale(beat, beat); g.fillStyle = 'rgba(220,40,50,0.92)'; g.beginPath(); g.moveTo(0, 70); g.bezierCurveTo(-130, -10, -80, -120, 0, -55); g.bezierCurveTo(80, -120, 130, -10, 0, 70); g.fill(); g.restore();
  g.strokeStyle = '#5dff8a'; g.lineWidth = 7; g.beginPath(); for (let x = 40; x <= 472; x += 4) { const ph = (x / 45 - t * 5) % 1; const y = Math.abs(ph - 0.5) < 0.05 ? 380 - 70 * Math.sin((ph - 0.45) / 0.1 * Math.PI) : 380; x === 40 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 8, sunDir: [-4, 6, 3] }), 'winter_lake_01', { height: 2, radius: 70, sun: 1.6, sunColor: 0xeef4ff, env: 1.0 });
  // ice sheet with a hole (ring geometry), dark water inside
  const iceM = texMat('snow_02', 14, 14, { color: 0xdce9f2, roughness: 0.25, metalness: 0.05 });
  const ice = new THREE.Mesh(new THREE.RingGeometry(0.9, 30, 64, 1), iceM); ice.rotation.x = -Math.PI / 2; ice.position.y = 0.02; ice.receiveShadow = true; scene.add(ice);
  const edge = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.035, 6, 14), new THREE.MeshStandardMaterial({ color: 0xa8c8dc, roughness: 0.15, transparent: true, opacity: 0.7 })); edge.rotation.x = Math.PI / 2; edge.position.y = 0.0; scene.add(edge);
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.92, 48), waterMat(2.0, 0x6a98aa)); water.rotation.x = -Math.PI / 2; water.position.y = -0.02; scene.add(water);
  const hole = V(0, 0, 0);
  const footprints = new THREE.Group(); for (let i = 0; i < 8; i++) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), new THREE.MeshBasicMaterial({ color: 0xa8bccc })); f.scale.set(0.6, 1.4, 1); f.rotation.x = -Math.PI / 2; f.position.set((i % 2 ? 0.12 : -0.12), 0.025, 1.3 + i * 0.45); footprints.add(f); } scene.add(footprints);
  const hero = person('hero'); scene.add(hero.root);
  const splash = stream(300, 0xdff2ff, 0.05); scene.add(splash);
  const breath = stream(200, 0xeaf6ff, 0.05); scene.add(breath);
  const xr = xray(0.45); scene.add(xr);
  const L = { shock: label('COLD SHOCK', 0.9), gasp: label('GASP!', 0.7), heart: label('HEART RACES', 0.9), panic: label("DON'T PANIC", 0.9), breathe: label('CONTROL YOUR BREATHING', 1.4), back: label('TURN BACK', 0.9), strong: label('STRONGEST ICE', 1.0), arms: label('ARMS ON THE ICE', 1.1), kick: label('KICK!', 0.6), slide: label('SLIDE OUT', 0.8), roll: label('ROLL AWAY', 0.8), stand: label("DON'T STAND UP YET", 1.2) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 500);
  const KEYS = [[0, [2.2, 1.7, 6.8], [0, 1.0, 1.0]], [2.0, [1.6, 1.3, 3.6], [0, 0.6, 0]], [11.0, [1.6, 1.3, 3.6], [0, 0.6, 0]], [11.6, [2.6, 1.6, 4.2], [0, 0.3, 1.2]], [16.2, [2.6, 1.6, 4.2], [0, 0.3, 1.2]],
    [16.8, [2.0, 1.2, 3.4], [0, 0.2, 1.0]], [21.2, [2.0, 1.2, 3.8], [0, 0.2, 1.6]], [21.8, [3.2, 1.6, 6.2], [0, 0.2, 2.8]], [26.4, [3.4, 1.8, 7.2], [0, 0.2, 3.6]]];
  return {
    scene, camera: cam,
    update(t) {
      // walk onto ice from +z (2.4) to the hole; fall at 1.4
      const walk = t < 1.4 ? 1 : 0, fall = sm(1.4, 2.0, t);
      const out = sm(19.4, 20.8, t), roll = sm(21.4, 24.0, t);
      const inWater = t > 1.4 && t < 19.6;
      const armsOn = sm(16.5, 17.2, t), kick = t > 18.2 && t < 19.6 ? Math.sin(t * 9) : 0;
      hero.update(t, { idle: 1 - walk, walk }, 1, { armsUp: 0.6 * sm(1.6, 2.0, t) * (1 - sm(4.6, 5.2, t)), leanBack: 0.4 * sm(5.0, 5.4, t) * (1 - sm(6.8, 7.2, t)), handsChest: 0.5 * sm(8.4, 8.8, t) * (1 - sm(10.8, 11.2, t)), swim: armsOn * (1 - out), lookUp: 0.2 * armsOn });
      let pos = V(0, 0, lerp(2.6, 0, sm(0, 1.4, t))), rx = 0, ry = Math.PI;
      if (inWater) { pos = V(0, lerp(0, -1.25, fall), 0); ry = t < 11.4 ? Math.PI * 0.8 : lerp(Math.PI * 0.8, 0, sm(11.4, 12.6, t)); rx = 0.4 * armsOn + 0.1 * kick; }
      if (t >= 19.4) { pos = V(0, lerp(-1.25, 0.12, out), lerp(0.3, 1.3, out) + 2.2 * roll); ry = 0; rx = Math.PI / 2 * out; }
      hero.root.position.copy(pos); hero.root.rotation.set(rx, ry + (t > 21.4 ? roll * Math.PI * 4 * 0 : 0), t > 21.4 ? roll * Math.PI * 4 : 0);
      footprints.children.forEach(f => f.visible = t > 11.6 && t < 16.2);
      water.material.uniforms.time.value = t;
      const k = keyCam(KEYS, t); const fz = t > 20.6 ? hero.root.position.z - 1.6 : 0; cam.position.copy(k.pos).add(V(0, 0, Math.max(0, fz))); cam.lookAt(t > 20.6 ? hero.root.position.clone().add(V(0, 0.2, 0)) : k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos();
      splash.update(V(0, 0.05, 0), V(0, 1, 0), 1.5, 2.3, t, 2.2, 1.6);
      breath.update(head.clone().add(V(0, -0.05, 0.12)), V(0, 0.4, 0.6), 2.0, 26.4, t, 0.3, 0.3);
      const xk = sm(5.8, 6.1, t) * (1 - sm(7.6, 7.9, t));
      if (xk > 0.01) xr.show(head.clone().add(V(0.4, 0.05, 0.1)), xk, drawHeart, sm(5.9, 6.6, t), t); else xr.visible = false;
      const up = (y) => V(0, y, 0);
      showLabel(L.shock, head.clone().add(up(0.38)), t, 2.9, 4.6); showLabel(L.gasp, head.clone().add(up(0.38)), t, 5.0, 5.9); showLabel(L.heart, head.clone().add(V(-0.1, 0.38, 0)), t, 6.0, 7.6);
      showLabel(L.panic, head.clone().add(up(0.38)), t, 7.7, 8.7); showLabel(L.breathe, head.clone().add(up(0.38)), t, 8.8, 11.2);
      showLabel(L.back, head.clone().add(up(0.4)), t, 11.4, 13.0); showLabel(L.strong, V(0, 0.5, 2.6), t, 13.1, 16.4);
      showLabel(L.arms, head.clone().add(up(0.42)), t, 16.7, 18.2); showLabel(L.kick, head.clone().add(up(0.42)), t, 18.2, 19.4); showLabel(L.slide, head.clone().add(up(0.42)), t, 19.5, 21.2);
      showLabel(L.roll, hero.root.position.clone().add(up(0.8)), t, 21.4, 22.4); showLabel(L.stand, hero.root.position.clone().add(up(0.8)), t, 22.5, 26.4);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
