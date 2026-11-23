import * as THREE from 'three';
import { labelCam, loadKit, world, prop, person, label, showLabel, xray, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 31.4;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { hdris: ['sunflowers'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
function drawNerve(g, k, t, back) { // nose -> brain signal (and back)
  g.lineWidth = 10; g.beginPath(); g.moveTo(120, 140); g.bezierCurveTo(220, 60, 380, 80, 420, 180); g.bezierCurveTo(440, 260, 380, 300, 330, 300); g.stroke(); // head outline
  g.beginPath(); g.moveTo(330, 300); g.lineTo(380, 360); g.lineTo(330, 380); g.stroke(); // nose
  g.fillStyle = 'rgba(255,150,170,0.85)'; g.beginPath(); g.ellipse(250, 160, 90, 60, 0, 0, 6.283); g.fill(); // brain
  g.strokeStyle = '#ffd24a'; g.lineWidth = 6; g.setLineDash([14, 10]); g.lineDashOffset = -t * 120 * (back ? -1 : 1); g.beginPath(); g.moveTo(360, 350); g.quadraticCurveTo(330, 250, 260, 200); g.stroke(); g.setLineDash([]);
  const u = back ? 1 - k : k; const x = 360 + (260 - 360) * u, y = 350 + (200 - 350) * u; g.fillStyle = back ? '#ff4a4a' : '#ffd24a'; g.beginPath(); g.arc(x, y, 16, 0, 6.283); g.fill();
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 6, sunDir: [-4, 7, 3] }), 'sunflowers', { height: 2, radius: 60, sun: 1.8, env: 0.95 });
  const hero = person('hero'); scene.add(hero.root);
  const pollen = stream(180, 0xffd23a, 0.03); scene.add(pollen);
  const blast = stream(1600, 0xdff2ff, 0.03); scene.add(blast);
  const elbowSpray = stream(300, 0xdff2ff, 0.025); scene.add(elbowSpray);
  // distance markers on the ground (every 1 m up to 6 m)
  const marks = []; for (let i = 1; i <= 6; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.06), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.position.set(0.1, 0.02, 0.25 + i); scene.add(m); marks.push(m); }
  const xr = xray(0.36); scene.add(xr);
  const L = { pollen: label('POLLEN', 0.65), alarm: label('NERVES → BRAIN: ALARM!', 1.3), fire: label('BRAIN FIRES BACK', 1.1), breath: label('DEEP BREATH', 0.9), chest: label('CHEST SQUEEZES', 1.0), eyes: label('EYES CLOSE', 0.85), boom: label('BOOM!', 0.9), kmh: label('160 KM/H', 1.0), drops: label('THOUSANDS OF DROPLETS', 1.4), m6: label('6 METERS', 0.9), elbow: label('SNEEZE INTO YOUR ELBOW!', 1.4) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [1.2, 1.5, 3.6], [0, 1.2, 0]], [2.0, [0.35, 1.62, 1.95], [0.05, 1.55, 0]], [10.4, [0.35, 1.62, 1.95], [0.05, 1.55, 0]], [11.0, [0.8, 1.5, 2.6], [0, 1.35, 0]], [15.8, [0.8, 1.5, 2.6], [0, 1.35, 0]],
    [16.4, [2.3, 1.5, 2.0], [0, 1.3, 0.5]], [22.6, [2.3, 1.5, 2.0], [0, 1.3, 0.8]], [23.4, [2.2, 2.1, 7.0], [0, 0.8, 2.0]], [28.0, [2.2, 2.1, 7.0], [0, 0.8, 2.0]], [28.8, [1.2, 1.5, 3.0], [0, 1.3, 0]], [31.4, [1.2, 1.5, 3.0], [0, 1.3, 0]]];
  return {
    scene, camera: cam,
    update(t) {
      const inhale = sm(10.7, 11.6, t) * (1 - sm(16.0, 16.3, t)), squeeze = sm(12.1, 12.6, t) * (1 - sm(16.0, 16.3, t)), boom = Math.max(0, 1 - Math.abs(t - 16.3) / 0.35), elbow = sm(28.2, 28.7, t);
      const boom2 = Math.max(0, 1 - Math.abs(t - 29.9) / 0.35);
      hero.update(t, { idle: 1 }, 1, { leanBack: 0.5 * inhale + 0.3 * (t > 28 ? 0 : 0), lookUp: 0.5 * inhale, lean: 0.8 * boom + 0.5 * boom2, handsChest: 0.5 * squeeze, elbow: elbow, headTilt: 0.2 * sm(2.6, 3.4, t) * (1 - sm(7.0, 7.6, t)) * Math.sin(t * 4) });
      hero.root.position.set(0, 0, 0); hero.root.rotation.y = 0;
      marks.forEach((m, i) => { m.visible = t > 23.2 && t < 28.2; m.material.opacity = 1; m.scale.x = Math.min(1, Math.max(0.01, (t - 23.2 - i * 0.25) * 3)); });
      const k = keyCam(KEYS, t); const shk = 0.04 * boom; cam.position.copy(k.pos).add(V(Math.sin(t * 60) * shk, Math.sin(t * 47) * shk, 0)); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos(); const nose = head.clone().add(V(0, -0.02, 0.12));
      pollen.update(V(0.6, 1.8, 1.0), nose.clone().sub(V(0.6, 1.8, 1.0)).normalize(), 2.2, 5.2, t, 0.9, 0.25);
      blast.update(nose, V(0, -0.05, 1), 16.25, 16.9, t, 5.5, 1.6);
      elbowSpray.update(nose.clone().add(V(0, 0, 0.12)), V(0, -0.3, 0.2), 29.85, 30.1, t, 0.3, 0.4);
      const x1 = sm(5.4, 5.7, t) * (1 - sm(7.6, 7.9, t)), x2 = sm(7.9, 8.1, t) * (1 - sm(10.3, 10.6, t));
      if (x1 > 0.01) xr.show(head.clone().add(V(0.4, 0.14, 0.1)), x1, (g, kk, tt) => drawNerve(g, kk, tt, false), sm(5.6, 7.3, t), t);
      else if (x2 > 0.01) xr.show(head.clone().add(V(0.4, 0.14, 0.1)), x2, (g, kk, tt) => drawNerve(g, kk, tt, true), sm(8.2, 9.8, t), t); else xr.visible = false;
      const up = (y) => V(0, y, 0);
      showLabel(L.pollen, nose.clone().add(V(0.32, 0.2, 0.2)), t, 2.8, 5.3); showLabel(L.alarm, head.clone().add(V(-0.1, 0.27, 0)), t, 5.7, 7.9); showLabel(L.fire, head.clone().add(V(-0.1, 0.27, 0)), t, 8.1, 10.4);
      showLabel(L.breath, head.clone().add(up(0.4)), t, 11.0, 12.1); showLabel(L.chest, head.clone().add(up(0.4)), t, 12.2, 13.9); showLabel(L.eyes, head.clone().add(up(0.4)), t, 14.0, 15.9);
      showLabel(L.boom, head.clone().add(V(0, 0.4, 0.3)), t, 16.1, 17.2); showLabel(L.kmh, V(0, 1.9, 1.6), t, 19.4, 22.6);
      showLabel(L.drops, V(0, 1.4, 3.4), t, 23.0, 26.3); showLabel(L.m6, V(0.1, 0.5, 6.25), t, 26.4, 28.2); showLabel(L.elbow, head.clone().add(up(0.45)), t, 28.4, 31.4);
      return { bloom: 0.25, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
