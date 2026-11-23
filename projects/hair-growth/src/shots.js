import * as THREE from 'three';
import { labelCam, loadKit, world, person, label, showLabel, xray, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 28.6;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { hdris: ['modern_bathroom'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
// follicle cross-section; mode 0 pocket, 1 cells dividing & pushing up, 2 hardening hair grows, 3 old hair falls / new starts
function drawFollicle(g, k, t, mode) {
  g.fillStyle = 'rgba(236,190,160,1)'; g.fillRect(0, 150, 512, 362); g.fillStyle = 'rgba(250,215,190,1)'; g.fillRect(0, 230, 512, 282);
  g.fillStyle = 'rgba(160,110,80,0.9)'; g.beginPath(); g.moveTo(226, 150); g.lineTo(216, 420); g.quadraticCurveTo(256, 470, 296, 420); g.lineTo(286, 150); g.fill(); // follicle pocket
  g.fillStyle = 'rgba(250,215,190,1)'; g.beginPath(); g.moveTo(238, 150); g.lineTo(232, 410); g.quadraticCurveTo(256, 440, 280, 410); g.lineTo(274, 150); g.fill();
  const grow = mode >= 2 ? 140 * k : mode === 1 ? 30 : 0; const fallen = mode === 3 ? k : 0;
  if (fallen < 0.5) { g.fillStyle = '#4a2c1a'; g.fillRect(250, 150 - grow - 120 + 400 * fallen, 12, 270 + grow); }
  if (mode === 3) { g.fillStyle = '#4a2c1a'; g.fillRect(250, 420 - 160 * k, 12, 160 * k); }
  if (mode >= 1) { for (let i = 0; i < 8; i++) { const y = 420 - ((t * 60 + i * 30) % 240); g.fillStyle = y > 330 ? '#ffd24a' : '#c8a080'; g.beginPath(); g.arc(256 + (i % 2 ? 8 : -8), y, 9, 0, 6.283); g.fill(); } }
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-3, 6, 4] }), 'modern_bathroom', { height: 1.6, radius: 8, sun: 1.0, env: 1.0 });
  const hero = person('hero'); scene.add(hero.root);
  const hairs = stream(160, 0x3a2414, 0.05); scene.add(hairs);
  const xr = xray(0.34); scene.add(xr);
  const ruler = new THREE.Group(); { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.12, 0.004), new THREE.MeshBasicMaterial({ color: 0xffd24a, toneMapped: false })); ruler.add(bar); for (let i = 0; i <= 10; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(i % 5 ? 0.02 : 0.035, 0.002, 0.004), bar.material); m.position.y = -0.06 + i * 0.012; m.position.x = 0.01; ruler.add(m); } } scene.add(ruler);
  const L = { foll: label('FOLLICLE', 0.7), cells: label('CELLS DIVIDE FAST', 1.1), push: label('PUSHED UP & OUT', 1.0), dead: label('DEAD CELLS = HAIR', 1.1), cm: label('1 CM / MONTH', 0.9), years: label('GROWS A FEW YEARS', 1.1), falls: label('FALLS OUT', 0.8), newL: label('NEW ONE STARTS', 1.0), hundred: label('UP TO 100 HAIRS A DAY!', 1.4) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.5, 1.5, 3.0], [0, 1.25, 0]], [1.8, [0.3, 1.6, 2.2], [0.05, 1.5, 0]], [23.4, [0.3, 1.6, 2.2], [0.05, 1.5, 0]], [24.2, [0.5, 1.45, 3.0], [0, 1.1, 0]], [28.6, [0.5, 1.45, 3.0], [0, 1.1, 0]]];
  return {
    scene, camera: cam,
    update(t) {
      const touch = sm(0.4, 0.8, t) * (1 - sm(1.6, 2.0, t)) + sm(15.4, 15.8, t) * (1 - sm(17.6, 18.0, t)), comb = sm(23.6, 24.0, t);
      hero.update(t, { idle: 1 }, 1, { facepalm: touch + comb * 0.8, lookUp: 0.2 * touch, lookDown: 0.4 * comb });
      hero.root.position.set(0, 0, 0); hero.root.rotation.y = 0.2;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos();
      hairs.update(head.clone().add(V(0, 0.12, 0)), V(0, -1, 0.2), 24.0, 28.6, t, 0.9, 0.4);
      ruler.visible = t > 15.5 && t < 18.0; ruler.position.copy(head).add(V(0.13, 0.12, 0.06)); ruler.quaternion.copy(cam.quaternion);
      const mode = t < 6.8 ? 0 : t < 12.4 ? 1 : t < 20.9 ? 2 : 3; const kk = mode === 2 ? sm(12.6, 18.0, t) : mode === 3 ? sm(21.2, 23.0, t) : 0;
      const xk = sm(2.0, 2.3, t) * (1 - sm(23.3, 23.6, t));
      if (xk > 0.01) xr.show(head.clone().add(V(0.3, -0.05, 0.1)), xk, (g, a, tt) => drawFollicle(g, a, tt, mode), kk, t); else xr.visible = false;
      const lp = head.clone().add(V(-0.05, 0.3, 0));
      showLabel(L.foll, lp, t, 4.8, 6.7); showLabel(L.cells, lp, t, 7.8, 9.8); showLabel(L.push, lp, t, 9.9, 12.4); showLabel(L.dead, lp, t, 12.5, 15.4);
      showLabel(L.cm, lp, t, 15.6, 18.0); showLabel(L.years, lp, t, 18.2, 21.0); showLabel(L.falls, lp, t, 21.1, 22.1); showLabel(L.newL, lp, t, 22.2, 23.4);
      showLabel(L.hundred, head.clone().add(V(0, 0.45, 0)), t, 23.7, 28.6);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
