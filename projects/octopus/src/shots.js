import * as THREE from 'three';
import { labelCam, loadKit, prop, fit, texMat, person, label, showLabel, xray, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 25.4;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/octopus', 'namaqualand_boulder_02', 'namaqualand_boulder_03'], tex: ['sand_01', 'rock_face_03'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawBrains(g, k, t) { // octopus outline: 1 central brain + 8 arm brains lighting up
  g.fillStyle = 'rgba(255,150,120,0.35)'; g.beginPath(); g.ellipse(256, 150, 90, 80, 0, 0, 6.283); g.fill();
  g.strokeStyle = 'rgba(255,170,140,0.6)'; g.lineWidth = 16; g.lineCap = 'round';
  for (let i = 0; i < 8; i++) { const a = Math.PI * (0.15 + 0.7 * i / 7); g.beginPath(); g.moveTo(256, 200); g.quadraticCurveTo(256 + Math.cos(a) * 160, 260 + Math.sin(a) * 40, 256 + Math.cos(a) * 220 * Math.sign(Math.cos(a) + 1e-3) * 0 + Math.cos(a) * 220, 400 + Math.sin(t * 2 + i) * 20); g.stroke(); }
  const n = Math.floor(9 * k); g.fillStyle = '#ffd24a';
  if (n >= 1) { g.beginPath(); g.arc(256, 150, 26, 0, 6.283); g.fill(); }
  for (let i = 0; i < n - 1; i++) { const a = Math.PI * (0.15 + 0.7 * i / 7); g.beginPath(); g.arc(256 + Math.cos(a) * 120, 300, 14, 0, 6.283); g.fill(); }
}
function build({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [0, 10, 2], sun: 1.8 });
  scene.userData.sky.visible = false; scene.background = new THREE.Color(0x2b8fb0); scene.fog = new THREE.FogExp2(0x2b8fb0, 0.07);
  scene.children.filter(o => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry' && !(o.material && o.material.isShadowMaterial)).forEach(o => o.visible = false);
  scene.userData.key.color.set(0xbfe8ff); scene.environmentIntensity = 0.5;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 48), texMat('sand_01', 14, 14, { color: 0xb0c0b8 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const rock = prop('namaqualand_boulder_03', 0.3); rock.position.set(0.8, 0, -0.55); scene.add(rock);
  const rock2 = prop('namaqualand_boulder_02', 1.2); rock2.position.set(-1.6, 0, -2.2); scene.add(rock2);
  const oct = fit(prop('sf/octopus'), 0.8, 'max'); const octG = new THREE.Group(); octG.add(oct); scene.add(octG);
  const octMats = []; oct.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); octMats.push(m.material); } });
  // glass jar with a crab-like treat
  const jar = new THREE.Group(); { const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.26, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide })); const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.04, 32), new THREE.MeshStandardMaterial({ color: 0xc0c4c8, metalness: 0.8, roughness: 0.3 })); lid.position.y = 0.15; jar.add(glass, lid); jar.userData.lid = lid; } jar.position.set(0.2, 0.13, 0.2); scene.add(jar);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.05, 24), new THREE.MeshBasicMaterial({ color: 0x050808 })); scene.add(hole);
  const hero = person('hero'); scene.add(hero.root);
  const bubbles = stream(120, 0xffffff, 0.035); scene.add(bubbles);
  const xr = xray(0.5); scene.add(xr);
  const L = { nine: label('9 BRAINS!', 0.9), head: label('1 IN THE HEAD', 0.9), arms: label('+1 IN EACH ARM', 1.0), taste: label('ARMS TASTE & TOUCH', 1.2), own: label('DECIDE ON THEIR OWN', 1.2), jars: label('OPENS JARS', 0.9), puzzle: label('SOLVES PUZZLES', 1.0), squeeze: label('SQUEEZES THROUGH HOLES', 1.3), color: label('CHANGES COLOR', 1.0), vanish: label('VANISHES!', 0.9) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.4, 1.3, 4.2], [0, 0.8, -0.2]], [2.2, [0.35, 1.05, 3.0], [0.15, 0.65, -0.2]], [13.2, [0.35, 1.05, 3.0], [0.15, 0.65, -0.2]], [13.8, [0.6, 0.8, 1.9], [0.4, 0.3, -0.1]], [18.6, [0.6, 0.8, 1.9], [0.5, 0.3, -0.2]], [19.2, [1.1, 0.95, 2.1], [0.8, 0.45, -0.45]], [25.4, [1.1, 0.95, 2.1], [0.8, 0.45, -0.45]]];
  const rockCol = new THREE.Color(0x6a6458);
  return {
    scene, camera: cam,
    update(t) {
      // octopus: on the rock -> at the jar (13.3-15.6) -> squeezes into hole (15.8-18.2) -> back on rock, camouflages (19+)
      let p, s = 1;
      if (t < 13.3) p = V(0.75, 0.42, -0.3);
      else if (t < 15.6) p = V(0.75, 0.42, -0.3).lerp(V(0.3, 0.12, 0.05), sm(13.3, 13.9, t));
      else if (t < 18.4) { p = V(0.3, 0.12, 0.05).lerp(V(0.75, 0.35, -0.1), sm(15.8, 17.6, t)); s = lerp(1, 0.25, sm(16.6, 18.0, t)); }
      else p = V(0.8, 0.44, -0.45);
      octG.position.copy(p); octG.rotation.set(0.1 * Math.sin(t * 1.3), t * 0.15, 0.08 * Math.sin(t * 1.7)); octG.scale.set(s * (1 + 0.05 * Math.sin(t * 2.2)), s * (1 - 0.05 * Math.sin(t * 2.2)), s);
      const cam2 = sm(20.0, 21.6, t), van = sm(22.6, 23.6, t);
      octMats.forEach(m => { if (!m.userData.c0) m.userData.c0 = m.color.clone(); m.color.copy(m.userData.c0).lerp(rockCol, cam2); m.transparent = true; m.opacity = 1 - 0.85 * van; });
      jar.userData.lid.position.y = 0.15 + 0.12 * sm(14.0, 14.8, t); jar.userData.lid.rotation.z = 0.6 * sm(14.0, 14.8, t);
      hole.position.set(0.85, 0.25, -0.12); hole.lookAt(V(0.95, 0.38, 3)); hole.visible = t > 15.6 && t < 18.6;
      hero.update(t, { idle: 1 }, 0.5, { spread: 0.4, point: 0.5 * sm(2.6, 3.0, t) * (1 - sm(4.6, 5.0, t)), flinch: 0.3 * sm(22.6, 23.0, t) });
      hero.root.position.set(-0.35, 0.2 + 0.06 * Math.sin(t), -0.1); hero.root.rotation.y = 0.6;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      bubbles.update(hero.headPos().add(V(0, 0, 0.1)), V(0, 1, 0), 0, 25.4, t, 0.8, 0.2);
      const xk = sm(3.4, 3.7, t) * (1 - sm(8.6, 8.9, t));
      if (xk > 0.01) xr.show(p.clone().add(V(-0.45, 0.55, 0.1)), xk, drawBrains, sm(4.0, 8.0, t), t); else xr.visible = false;
      const op = p.clone().add(V(0, 0.55, 0));
      showLabel(L.nine, op, t, 3.5, 4.9); showLabel(L.head, op, t, 5.0, 6.0); showLabel(L.arms, op, t, 6.1, 8.8); showLabel(L.taste, op, t, 9.0, 11.2); showLabel(L.own, op, t, 11.3, 13.2);
      showLabel(L.jars, V(0.25, 0.55, 0.1), t, 13.6, 14.6); showLabel(L.puzzle, V(0.25, 0.55, 0.1), t, 14.7, 15.7); showLabel(L.squeeze, V(0.6, 0.75, -0.1), t, 15.9, 18.6);
      showLabel(L.color, V(0.75, 1.15, -0.35), t, 19.6, 22.4); showLabel(L.vanish, V(0.75, 1.15, -0.35), t, 22.5, 25.4);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
