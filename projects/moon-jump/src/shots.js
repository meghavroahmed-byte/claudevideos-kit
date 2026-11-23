import * as THREE from 'three';
import { labelCam, loadKit, prop, fit, texMat, person, label, showLabel, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 23.6;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/earth', 'sf/astronaut', 'moon_rock_01', 'moon_rock_03'], tex: ['moon_dusted_01'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function build({ makeStage }) {
  const scene = makeStage({ shadowSize: 7, sunDir: [6, 5, 3], sun: 3.4 });
  scene.userData.sky.visible = false; scene.background = new THREE.Color(0x000003);
  scene.children.filter(o => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry' && !(o.material && o.material.isShadowMaterial)).forEach(o => o.visible = false);
  scene.children.find(o => o.isHemisphereLight).intensity = 0.08; scene.environmentIntensity = 0.3;
  { const n = 2500, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = Math.random() * 0.9 + 0.05, th = Math.random() * 6.283, r = 180; a[i * 3] = r * Math.sqrt(1 - u * u) * Math.cos(th); a[i * 3 + 1] = r * u; a[i * 3 + 2] = r * Math.sqrt(1 - u * u) * Math.sin(th); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3)); scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35 }))); }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 100, 100), texMat('moon_dusted_01', 40, 40, { color: 0xb8b8b8 }));
  { const p = ground.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), d = Math.hypot(x, y); p.setZ(i, d > 8 ? Math.sin(x * 0.21) * Math.cos(y * 0.17) * 0.8 + Math.sin(x * 0.07 + y * 0.05) * 1.5 : 0); } ground.geometry.computeVertexNormals(); }
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  for (let i = 0; i < 14; i++) { const r = prop(i % 2 ? 'moon_rock_01' : 'moon_rock_03', 2 + (i % 4) * 2.5); r.position.set(-9 + (i * 3.7) % 18, 0, -3 - (i * 2.3) % 12); r.rotation.y = i; scene.add(r); }
  const earth = fit(prop('sf/earth'), 14, 'max', { ground: false }); earth.traverse(m => { if (m.isMesh && /atmos|cloud/i.test(m.name)) m.visible = false; }); earth.position.set(-18, 26, -90); scene.add(earth);
  // basketball hoop (3.05 m)
  const hoop = new THREE.Group(); { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.3, 16), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 })); pole.position.y = 1.65; hoop.add(pole);
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.04), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })); board.position.set(0, 3.35, 0.12); hoop.add(board);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.015, 8, 32), new THREE.MeshStandardMaterial({ color: 0xff5a1a, metalness: 0.5, roughness: 0.4 })); rim.rotation.x = Math.PI / 2; rim.position.set(0, 3.05, 0.4); hoop.add(rim); }
  hoop.position.set(1.4, 0, -0.3); scene.add(hoop);
  const hero = person('hero'); scene.add(hero.root);
  const earthGhost = person('hero', { print: false }); ghost(earthGhost.root, 0x9fe0ff, { inPlace: true }); scene.add(earthGhost.root);
  const astros = []; for (let i = 0; i < 3; i++) { const a = fit(prop('sf/astronaut'), 1.9, 'y'); scene.add(a); astros.push(a); }
  const dust = stream(200, 0xbbbbbb, 0.05); scene.add(dust);
  const ruler = new THREE.Group(); for (let i = 0; i <= 6; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(i % 2 ? 0.12 : 0.24, 0.025, 0.025), new THREE.MeshBasicMaterial({ color: 0xffd24a, toneMapped: false })); m.position.y = i * 0.5; ruler.add(m); } { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.025, 3.0, 0.025), new THREE.MeshBasicMaterial({ color: 0xffd24a, toneMapped: false })); bar.position.y = 1.5; ruler.add(bar); } ruler.position.set(-0.9, 0, 0); scene.add(ruler);
  const L = { earth: label('ON EARTH: 0.5 M', 1.7), six: label('GRAVITY ÷ 6', 1.7), three: label('3 METERS!', 1.6), hoopL: label('ABOVE THE HOOP', 1.7), slow: label('FLOATS UP SLOWLY', 1.6), four: label('~4 SECONDS IN THE AIR', 2.0), kang: label('KANGAROO HOPS!', 2.4) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 600);
  const KEYS = [[0, [2.2, 1.8, 7.4], [0.3, 1.6, 0]], [6.6, [2.2, 1.8, 7.4], [0.3, 1.6, 0]], [8.4, [2.4, 1.9, 7.6], [0.4, 1.6, 0]], [19.0, [2.4, 1.9, 7.6], [0.4, 1.6, 0]], [20.0, [4.0, 2.8, 12.0], [-1.0, 1.4, -3]], [23.6, [4.0, 2.8, 12.0], [-1.0, 1.4, -3]]];
  // jump: earth ghost 2.6-4.6 (0.5 m, 0.64 s); moon jump 9.9 - 13.8 (3 m), second jump 14.6 - 18.6 (slow float)
  const arc = (t, t0, T, H) => { const u = (t - t0) / T; return u > 0 && u < 1 ? 4 * H * u * (1 - u) : 0; };
  return {
    scene, camera: cam,
    update(t) {
      const y = Math.max(arc(t, 9.9, 3.9, 3.05), arc(t, 14.6, 3.9, 3.05));
      const air = y > 0.02, crouchK = Math.max(0, 1 - Math.abs(t - 9.75) / 0.3, 1 - Math.abs(t - 14.45) / 0.3);
      hero.update(t, { idle: 1 }, 0.7, { crouch: 0.45 * crouchK, armsUp: air ? 0.9 : 0, spread: air ? 0.3 : 0, lookDown: air ? 0.3 : 0 });
      hero.root.position.set(0.6, y, 0.2); hero.root.rotation.y = -0.2;
      const ey = arc(t, 3.6, 0.64, 0.5) + arc(t, 4.6, 0.64, 0.5); earthGhost.update(t, { idle: 1 }, 1, { armsUp: ey > 0.02 ? 0.8 : 0 });
      earthGhost.root.fade(0.75 * sm(2.4, 2.8, t) * (1 - sm(6.3, 6.7, t))); earthGhost.root.position.set(-0.9, ey, 0.4);
      ruler.visible = t > 9.6 && t < 18.6; ruler.scale.y = Math.max(0.01, sm(9.9, 11.8, t));
      // hopping astronauts at the end
      astros.forEach((a, i) => { const v = t > 19.6; a.visible = v; if (!v) return; const ph = (t * 0.55 + i * 0.33) % 1; a.position.set(-4 + i * 2.2 + ph * 2.0, 4 * 1.4 * ph * (1 - ph), -4 - i * 1.5); a.rotation.set(0.15, 1.2, 0); });
      const k = keyCam(KEYS, t); const fy = t > 9 && t < 19.4 ? y * 0.75 : 0; cam.position.copy(k.pos).add(V(0, fy, 0)); cam.lookAt(k.look.clone().add(V(0, fy, 0))); labelCam(cam);
      scene.updateMatrixWorld(true);
      dust.update(V(0.6, 0.02, 0.2), V(0, 0.4, 0), 9.85, 10.1, t, 1.2, 1.5);
      const head = hero.headPos(); const up = (y) => V(0, y, 0);
      showLabel(L.earth, V(-0.9, 2.5, 0.4), t, 2.8, 6.4); showLabel(L.six, V(0.4, 4.0, 0), t, 7.0, 9.6);
      showLabel(L.three, V(-0.9, 3.4, 0), t, 11.3, 12.9); showLabel(L.hoopL, V(1.4, 3.9, -0.3), t, 13.0, 14.6);
      showLabel(L.slow, head.clone().add(up(0.5)), t, 15.1, 16.4); showLabel(L.four, head.clone().add(up(0.6)), t, 16.5, 19.2); showLabel(L.kang, V(-1.0, 3.6, -4), t, 20.0, 23.6);
      return { bloom: 0.3, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
