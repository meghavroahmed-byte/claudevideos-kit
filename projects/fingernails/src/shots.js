import * as THREE from 'three';
import { labelCam, loadKit, world, prop, person, label, showLabel, xray, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 26.4;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['metal_office_desk', 'classic_laptop'], hdris: ['cayley_interior'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
// mode 0: two nail bars (finger vs toe) racing; 1: nail root with blood vessels
function drawNails(g, k, t, mode) {
  if (mode === 0) {
    g.fillStyle = '#fff'; g.font = '900 32px Cap, sans-serif'; g.textAlign = 'left'; g.fillText('FINGER', 40, 150); g.fillText('TOE', 40, 320);
    g.fillStyle = '#ffd0d8'; g.fillRect(40, 170, 432 * Math.min(1, k * 1.0), 70); g.fillStyle = '#ffd0d8'; g.fillRect(40, 340, 432 * Math.min(1, k * 0.45), 70);
    g.fillStyle = '#ffd24a'; g.fillText('3.5 MM', 40 + 432 * k - 120, 280); g.fillText('<1.6 MM', 40 + 432 * k * 0.45, 450);
  } else {
    g.fillStyle = 'rgba(236,190,160,1)'; g.fillRect(0, 160, 512, 352);
    g.fillStyle = '#ffd0d8'; g.beginPath(); g.roundRect(120, 120, 340, 60, 20); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(230, 170, 70, 60); // nail + root
    g.strokeStyle = '#d02838'; g.lineWidth = 8; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(40, 300 + i * 30); g.bezierCurveTo(150, 260 + i * 10, 220, 240, 265, 230); g.stroke(); }
    g.fillStyle = '#ff4050'; for (let i = 0; i < 8; i++) { const u = (t * 0.6 + i / 8) % 1; g.beginPath(); g.arc(40 + 225 * u, 300 - 70 * u, 8, 0, 6.283); g.fill(); }
  }
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-3, 6, 4] }), 'cayley_interior', { height: 1.6, radius: 10, sun: 1.0, env: 1.0 });
  const desk = prop('metal_office_desk'); desk.position.set(0, 0, 0.62); desk.rotation.y = Math.PI; scene.add(desk);
  const laptop = prop('classic_laptop', 0.6); laptop.position.set(0, 0.76, 0.5); laptop.rotation.y = Math.PI; scene.add(laptop);
  const hero = person('hero'); scene.add(hero.root);
  const pulse = stream(120, 0xff4050, 0.035); scene.add(pulse);
  const xr = xray(0.45); scene.add(xr);
  const L = { mm: label('3.5 MM / MONTH', 1.0), toe: label('TOENAILS: < HALF', 1.1), root: label('NAIL ROOT', 0.8), blood: label('LOVES BLOOD SUPPLY', 1.2), heart: label('CLOSER TO THE HEART', 1.2), tap: label('TAPPING', 0.7), type: label('TYPING', 0.7), scratch: label('SCRATCHING', 0.8), x2: label('2× FASTER!', 0.9) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.4, 1.7, 3.2], [0, 1.15, 0]], [2.4, [0.35, 1.7, 2.6], [0, 1.35, 0]], [17.8, [0.35, 1.7, 2.6], [0, 1.35, 0]], [18.6, [0.5, 1.9, 2.0], [0, 1.0, 0.3]], [21.2, [0.5, 1.9, 2.0], [0, 1.0, 0.3]], [22.0, [0.4, 1.7, 3.0], [0, 1.2, 0]], [26.4, [0.4, 1.7, 3.0], [0, 1.2, 0]]];
  return {
    scene, camera: cam,
    update(t) {
      const typing = t > 18.6 && t < 21.3 ? 1 : 0, scratch = sm(20.2, 20.4, t) * (1 - sm(21.2, 21.4, t)), show = sm(3.2, 3.6, t) * (1 - sm(8.8, 9.2, t));
      hero.update(t, { idle: 1 }, 1, { point: 0.5 * show + 0.55 * typing * (1 - scratch), pointL: 0.55 * typing * (1 - scratch), lean: 0.3 * typing, lookDown: 0.4 * typing + 0.3 * show, facepalm: scratch * (0.8 + 0.2 * Math.sin(t * 20)), handsChest: 0.7 * sm(15.2, 15.6, t) * (1 - sm(16.8, 17.2, t)) });
      hero.root.position.set(0, 0, 0); hero.root.rotation.y = 0; const dv = t > 18.2 && t < 21.6; desk.visible = laptop.visible = dv;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos(), chest = hero.world('Spine2'), hand = hero.world('RightHand');
      pulse.update(chest.clone().add(V(0.1, 0, 0.1)), hand.clone().sub(chest).normalize(), 15.6, 17.6, t, 0.6, 0.06);
      const x1 = sm(3.4, 3.7, t) * (1 - sm(9.5, 9.8, t)), x2 = sm(9.8, 10.1, t) * (1 - sm(14.9, 15.2, t)), x3 = sm(22.0, 22.3, t);
      if (x1 > 0.01) xr.show(head.clone().add(V(0.36, -0.05, 0.1)), x1, (g, a, tt) => drawNails(g, a, tt, 0), sm(4.2, 9.2, t), t);
      else if (x2 > 0.01) xr.show(head.clone().add(V(0.36, -0.05, 0.1)), x2, (g, a, tt) => drawNails(g, a, tt, 1), 1, t);
      else if (x3 > 0.01) xr.show(head.clone().add(V(0.36, -0.05, 0.1)), x3, (g, a, tt) => drawNails(g, a, tt, 0), sm(22.2, 25.0, t), t); else xr.visible = false;
      const lp = head.clone().add(V(0, 0.33, 0));
      showLabel(L.mm, lp, t, 4.4, 7.0); showLabel(L.toe, lp, t, 7.2, 9.6); showLabel(L.root, lp, t, 10.6, 12.2); showLabel(L.blood, lp, t, 12.3, 15.0); showLabel(L.heart, lp, t, 15.2, 18.0);
      const dp = V(0, 1.75, 0.2); showLabel(L.tap, dp, t, 18.8, 19.5); showLabel(L.type, dp, t, 19.6, 20.2); showLabel(L.scratch, dp, t, 20.3, 21.3); showLabel(L.x2, lp, t, 23.8, 26.4);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
