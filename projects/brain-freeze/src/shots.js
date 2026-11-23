import * as THREE from 'three';
import { labelCam, loadKit, world, person, label, showLabel, xray, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 27.6;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { hdris: ['symmetrical_garden_02'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
// side view of the mouth: palate with vessels; mode 0 cold hits, 1 shrink->swell, 2 nerve to forehead, 3 tongue press
function drawMouth(g, k, t, mode) {
  g.lineWidth = 10; g.beginPath(); g.moveTo(60, 110); g.bezierCurveTo(200, 40, 400, 60, 440, 200); g.lineTo(470, 260); g.lineTo(430, 280); g.stroke(); // head/nose profile
  g.beginPath(); g.moveTo(420, 300); g.quadraticCurveTo(300, 300, 180, 320); g.stroke(); // palate (roof of mouth)
  const tongueUp = mode === 3 ? k : 0; g.fillStyle = 'rgba(230,110,120,0.9)'; g.beginPath(); g.ellipse(300, 380 - 50 * tongueUp, 130, 40, 0, 0, 6.283); g.fill();
  const w = mode === 1 ? (k < 0.5 ? 10 - 12 * k : 4 + 26 * (k - 0.5)) : mode >= 2 ? 16 : 10; g.strokeStyle = 'rgba(220,40,50,0.95)'; g.lineWidth = Math.max(3, w);
  g.beginPath(); g.moveTo(190, 312); g.quadraticCurveTo(300, 296, 410, 296); g.stroke();
  if (mode === 0) { g.fillStyle = '#bfe8ff'; for (let i = 0; i < 12; i++) g.fillRect(250 + (i * 37) % 160, 330 + (i * 13) % 40, 10, 10); }
  if (mode === 2) { g.strokeStyle = '#ffd24a'; g.lineWidth = 7; g.setLineDash([16, 10]); g.lineDashOffset = -t * 120; g.beginPath(); g.moveTo(300, 300); g.quadraticCurveTo(300, 200, 380, 120); g.stroke(); g.setLineDash([]); g.fillStyle = '#ff4a4a'; g.beginPath(); g.arc(380, 120, 22 + 8 * Math.sin(t * 12), 0, 6.283); g.fill(); }
}
function iceCream() {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.13, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xc8904a, roughness: 0.9, side: THREE.DoubleSide })); cone.rotation.x = Math.PI; cone.position.y = -0.065; g.add(cone);
  const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 24, 16), new THREE.MeshStandardMaterial({ color: 0xffd6e0, roughness: 0.55 })); s1.position.y = 0.015; g.add(s1);
  const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.034, 24, 16), new THREE.MeshStandardMaterial({ color: 0xfff4e0, roughness: 0.55 })); s2.position.y = 0.06; g.add(s2); g.userData.top = s2;
  return g;
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 6, sunDir: [-4, 8, 3] }), 'symmetrical_garden_02', { height: 2, radius: 50, sun: 2.0, env: 0.95 });
  const hero = person('hero'); scene.add(hero.root);
  const ice = iceCream(); scene.add(ice);
  const chill = stream(80, 0xcfeeff, 0.02); scene.add(chill);
  const xr = xray(0.42); scene.add(xr);
  const L = { bite: label('BIG BITE', 0.7), pain: label('SHARP PAIN!', 0.8), roof: label('ROOF OF YOUR MOUTH', 1.2), vess: label('BLOOD VESSELS', 0.9), shrink: label('SHRINK...', 0.7), swell: label('...THEN SWELL', 0.9), nerves: label('PAIN NERVES', 0.85), head: label('FELT IN YOUR HEAD', 1.1), fix: label('THE FIX:', 0.7), tongue: label('TONGUE ON THE ROOF', 1.2), fade: label('FADES IN SECONDS', 1.1) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.6, 1.5, 3.4], [0, 1.2, 0]], [2.2, [0.3, 1.6, 1.9], [0, 1.5, 0]], [27.6, [0.3, 1.6, 2.0], [0, 1.5, 0]]];
  return {
    scene, camera: cam,
    update(t) {
      const bite = Math.max(0, 1 - Math.abs(t - 2.8) / 0.4), hold = t < 4.6 ? 1 : 0, pain = sm(4.7, 5.2, t) * (1 - sm(21.4, 21.8, t)), relief = sm(25.0, 25.6, t);
      hero.update(t, { idle: 1 }, 1, { point: 0.6 * hold + 0.3 * bite, facepalm: pain * (1 - relief), lean: 0.25 * pain, lookDown: 0.2 * pain });
      hero.mouth(0.7 * bite); hero.root.position.set(0, 0, 0); hero.root.rotation.y = 0;
      const k = keyCam(KEYS, t); const sh = 0.01 * pain * Math.sin(t * 40); cam.position.copy(k.pos).add(V(sh, sh, 0)); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos(), hand = hero.world('RightHand');
      ice.visible = t < 4.8; ice.position.copy(hand.clone().add(V(0, 0.08, 0.05)).lerp(head.clone().add(V(0, -0.06, 0.14)), bite)); ice.userData.top.visible = t < 2.85;
      chill.update(head.clone().add(V(0, -0.06, 0.12)), V(0, 0.4, 0.3), 2.9, 4.2, t, 0.25, 0.2);
      const m = t < 11.9 ? 0 : t < 16.4 ? 1 : t < 21.6 ? 2 : 3;
      const kk = m === 0 ? sm(7.5, 9.0, t) : m === 1 ? sm(12.0, 15.6, t) : m === 2 ? sm(16.5, 18.0, t) : sm(22.6, 23.6, t);
      const xk = sm(7.3, 7.6, t) * (1 - sm(26.6, 27.0, t));
      if (xk > 0.01) xr.show(head.clone().add(V(0.4, 0.14, 0.1)), xk, (g, a, tt) => drawMouth(g, a, tt, m), kk, t); else xr.visible = false;
      const up = (y) => V(0, y, 0); const lp = head.clone().add(V(-0.05, 0.32, 0));
      showLabel(L.bite, lp, t, 2.3, 3.6); showLabel(L.pain, lp, t, 4.8, 7.2); showLabel(L.roof, lp, t, 8.2, 9.6); showLabel(L.vess, lp, t, 10.0, 11.8);
      showLabel(L.shrink, lp, t, 12.1, 13.4); showLabel(L.swell, lp, t, 13.6, 16.2); showLabel(L.nerves, lp, t, 17.5, 19.0); showLabel(L.head, lp, t, 19.1, 21.5);
      showLabel(L.fix, lp, t, 21.7, 22.6); showLabel(L.tongue, lp, t, 22.7, 24.9); showLabel(L.fade, lp, t, 25.0, 27.6);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
