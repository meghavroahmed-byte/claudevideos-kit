import * as THREE from 'three';
import { labelCam, loadKit, world, prop, texMat, person, label, showLabel, xray, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 25.8;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['magnifying_glass_01', 'dead_tree_trunk'], hdris: ['kloofendal_48d_partly_cloudy_puresky'], tex: ['sandy_gravel'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawEye(g, k, t, mode) { // side view of eyeball: lens focuses rays to a spot on the retina
  g.fillStyle = 'rgba(245,240,235,1)'; g.beginPath(); g.arc(280, 256, 170, 0, 6.283); g.fill();
  g.strokeStyle = 'rgba(230,90,90,0.9)'; g.lineWidth = 12; g.beginPath(); g.arc(280, 256, 158, -1.0, 1.0); g.stroke(); // retina
  g.fillStyle = 'rgba(160,210,255,0.85)'; g.beginPath(); g.ellipse(125, 256, 22, 70, 0, 0, 6.283); g.fill(); // lens
  if (mode === 0) { g.strokeStyle = '#ffd24a'; g.lineWidth = 6; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(0, 256 + i * 40); g.lineTo(125, 256 + i * 26); g.lineTo(438, 256); g.stroke(); } }
  const spot = mode === 0 ? k : 1; g.fillStyle = mode === 2 ? 'rgba(40,20,20,0.95)' : '#ff4a20'; g.beginPath(); g.arc(436, 256, 8 + 20 * spot, 0, 6.283); g.fill();
  if (mode === 1) { g.fillStyle = '#fff'; g.font = '900 34px Cap, sans-serif'; g.textAlign = 'center'; g.fillText('NO PAIN NERVES', 256, 470); }
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 6, sunDir: [-1, 4, -6] }), 'kloofendal_48d_partly_cloudy_puresky', { height: 3, radius: 80, sun: 2.4, env: 1.0 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(80, 48), texMat('sandy_gravel', 30, 30, { color: 0xb8a888 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 16), new THREE.MeshBasicMaterial({ color: 0xfff4c0, toneMapped: false })); sun.position.set(-8, 20, -60); scene.add(sun);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(2.95, 32, 16), new THREE.MeshBasicMaterial({ color: 0x050505 })); scene.add(moon);
  const glass = prop('magnifying_glass_01', 1.6); scene.add(glass);
  const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.25, 24), new THREE.MeshStandardMaterial({ color: 0xc8a060, roughness: 1, side: THREE.DoubleSide })); leaf.rotation.x = -Math.PI / 2; leaf.position.set(0.8, 0.02, 0.8); scene.add(leaf);
  const smoke = stream(120, 0x888888, 0.06); smoke.material.opacity = 0.4; scene.add(smoke);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.2, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0a0, transparent: true, opacity: 0.25, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })); scene.add(beam);
  const hero = person('hero'); scene.add(hero.root);
  const blur = new THREE.Mesh(new THREE.CircleGeometry(0.4, 32), new THREE.MeshBasicMaterial({ color: 0x101010, transparent: true, opacity: 0.0, depthTest: false, toneMapped: false })); blur.renderOrder = 45; scene.add(blur);
  const xr = xray(0.36); scene.add(xr);
  const L = { lens: label('LENS = MAGNIFYING GLASS', 1.5), spot: label('BURNING HOT SPOT', 1.1), scary: label('THE SCARY PART', 1.0), nopain: label("YOU WON'T FEEL IT", 1.1), hours: label('HOURS LATER', 0.9), blind: label('BLIND SPOT', 0.9), perm: label('CAN BE PERMANENT', 1.1), never: label('NEVER LOOK AT THE SUN', 1.5), eclipse: label('NOT EVEN DURING AN ECLIPSE!', 1.6) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 600);
  const KEYS = [[0, [1.6, 1.3, 4.0], [-0.5, 2.6, -4]], [2.0, [1.8, 1.7, 3.6], [0.4, 0.8, 0.5]], [4.8, [1.8, 1.7, 3.6], [0.5, 0.6, 0.6]], [5.4, [0.35, 1.62, 2.0], [0.08, 1.5, 0]], [15.0, [0.35, 1.62, 2.0], [0.08, 1.5, 0]],
    [15.6, [0.7, 1.5, 2.6], [0, 1.3, 0]], [21.0, [0.7, 1.5, 2.6], [0, 1.3, 0]], [21.6, [1.6, 0.9, 4.2], [-0.6, 2.2, -4]], [25.8, [1.6, 0.9, 4.2], [-0.8, 2.8, -6]]];
  return {
    scene, camera: cam,
    update(t) {
      const stare = sm(0.3, 0.8, t) * (1 - sm(1.8, 2.2, t)) + sm(21.6, 22.2, t) * (1 - sm(23.0, 23.4, t)), hold = sm(2.0, 2.4, t) * (1 - sm(4.8, 5.2, t)), rub = sm(15.4, 15.8, t) * (1 - sm(19.6, 20.0, t)), shield = sm(23.2, 23.6, t);
      hero.update(t, { idle: 1 }, 1, { lookUp: 0.8 * stare, point: 0.8 * hold, facepalm: 0.6 * rub + 0.9 * shield });
      hero.root.position.set(0, 0, 0); hero.root.rotation.y = 0.25;
      moon.visible = t > 23.4; moon.position.copy(sun.position).add(V(lerp(3, 0.8, sm(23.4, 25.6, t)), 0, 1));
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const hand = hero.world('RightHand'), head = hero.headPos();
      glass.visible = hold > 0.01; glass.position.copy(hand).add(V(0.05, 0.0, 0.1)); glass.rotation.set(Math.PI / 2, 0, 0.3);
      beam.visible = hold > 0.5; beam.position.copy(glass.position.clone().lerp(V(0.8, 0.02, 0.8), 0.5)); beam.lookAt(V(0.8, 0.02, 0.8)); beam.rotateX(Math.PI / 2); beam.scale.y = glass.position.distanceTo(V(0.8, 0.02, 0.8)) / 1.2;
      smoke.update(V(0.8, 0.05, 0.8), V(0, 1, 0), 3.2, 5.2, t, 0.6, 0.15); leaf.material.color.set(t > 3.6 && t < 5.4 ? 0x3a2010 : 0xc8a060);
      blur.visible = t > 16.6 && t < 21.2; blur.position.copy(cam.position).add(V(0, 0, -0.5).applyQuaternion(cam.quaternion)); blur.quaternion.copy(cam.quaternion); blur.scale.setScalar(0.18); blur.material.opacity = 0.75 * sm(16.6, 17.4, t);
      const mode = t < 9.7 ? 0 : t < 15.1 ? 1 : 2; const xk = sm(5.6, 5.9, t) * (1 - sm(14.8, 15.1, t));
      if (xk > 0.01) xr.show(head.clone().add(V(0.33, 0.12, 0.1)), xk, (g, a, tt) => drawEye(g, a, tt, mode), sm(6.0, 8.6, t), t); else xr.visible = false;
      const lp = head.clone().add(V(-0.05, 0.3, 0));
      showLabel(L.lens, V(0.6, 1.4, 0.6), t, 2.2, 4.9); showLabel(L.spot, lp, t, 6.4, 9.6); showLabel(L.scary, lp, t, 9.7, 10.8); showLabel(L.nopain, lp, t, 10.9, 15.0);
      showLabel(L.hours, head.clone().add(V(0, 0.4, 0)), t, 15.2, 16.6); showLabel(L.blind, head.clone().add(V(0, 0.4, 0)), t, 16.7, 19.7); showLabel(L.perm, head.clone().add(V(0, 0.4, 0)), t, 19.8, 21.2);
      showLabel(L.never, head.clone().add(V(0.3, 0.6, 0)), t, 21.4, 23.2); showLabel(L.eclipse, head.clone().add(V(0.3, 0.6, 0)), t, 23.3, 25.8);
      return { bloom: 0.5, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
