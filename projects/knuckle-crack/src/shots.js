import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, person, label, showLabel, xray, ghost, keyCam, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 26.8;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/hand_bones', 'metal_office_desk'], hdris: ['cayley_interior'], people: ['hero', 'eric'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const POPS = [0.9, 1.3, 16.9, 17.3];
// finger joint: two bone ends inside a capsule with fluid; stretch -> pressure drop -> bubble -> pop
function drawJoint(g, k, t, phase) {
  const gap = phase >= 1 ? 28 * k : 0;
  g.fillStyle = 'rgba(120,190,255,0.45)'; g.beginPath(); g.ellipse(256, 256, 95 + gap * 0.3, 70 + gap, 0, 0, 6.283); g.fill();
  g.strokeStyle = 'rgba(255,210,120,0.95)'; g.lineWidth = 8; g.beginPath(); g.ellipse(256, 256, 99 + gap * 0.3, 74 + gap, 0, 0, 6.283); g.stroke();
  g.fillStyle = 'rgba(240,235,220,1)';
  g.beginPath(); g.moveTo(206, 20); g.lineTo(306, 20); g.lineTo(306, 200 - gap); g.quadraticCurveTo(256, 250 - gap, 206, 200 - gap); g.fill();
  g.beginPath(); g.moveTo(206, 492); g.lineTo(306, 492); g.lineTo(306, 312 + gap); g.quadraticCurveTo(256, 262 + gap, 206, 312 + gap); g.fill();
  if (phase >= 2) { const r = 6 + 22 * k; g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(256, 256, r, 0, 6.283); g.fill(); }
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-3, 6, 4] }), 'cayley_interior', { height: 1.6, radius: 10, sun: 1.0, env: 1.0 });
  const desk = prop('metal_office_desk'); desk.position.set(0, 0, -0.9); scene.add(desk);
  const bones = fit(prop('sf/hand_bones'), 0.65, 'max', { ground: false }); bones.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.emissive = new THREE.Color(0x203040); } }); scene.add(bones);
  const hero = person('hero'); scene.add(hero.root);
  const doc = person('eric', { print: false }); ghost(doc.root, 0xbfe6ff, { inPlace: true }); doc.root.traverse(m => { if (m.isMesh) m.material.blending = THREE.NormalBlending; }); scene.add(doc.root);
  const xr = xray(0.5); scene.add(xr);
  const L = { pop: label('POP!', 0.6), cap: label('CAPSULE', 0.7), fluid: label('SLIPPERY FLUID', 0.95), stretch: label('JOINT STRETCHES', 1.0), press: label('PRESSURE DROPS', 1.0), gas: label('GAS BUBBLE FORMS', 1.1), pop2: label('POP!', 0.7), arth: label('NO ARTHRITIS', 1.0), doc: label('60 YEARS, ONE HAND', 1.2), fine: label('BOTH HANDS FINE', 1.1) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.4, 1.4, 2.8], [0, 1.15, 0]], [2.2, [0.25, 1.4, 2.2], [0.15, 1.3, 0]], [18.0, [0.25, 1.4, 2.2], [0.15, 1.3, 0]], [18.8, [0.2, 1.4, 3.6], [-0.3, 1.1, 0]], [26.8, [0.2, 1.4, 3.6], [-0.3, 1.1, 0]]];
  return {
    scene, camera: cam,
    update(t) {
      const pop = Math.max(...POPS.map(p => Math.max(0, 1 - Math.abs(t - p) / 0.15)));
      const crack = sm(0.3, 0.6, t) * (1 - sm(2.0, 2.4, t)) + sm(7.4, 7.8, t) * (1 - sm(9.4, 9.8, t)) + sm(16.2, 16.5, t) * (1 - sm(17.8, 18.2, t));
      hero.update(t, { idle: 1 }, 1, { handsChest: crack, lean: 0.15 * pop, lookDown: 0.3 * crack });
      hero.root.position.set(-0.05, 0, 0); hero.root.rotation.y = 0.1;
      const dk = sm(20.6, 21.0, t); doc.update(t, { idle: 1 }, 1, { point: 0.6 * sm(23.8, 24.2, t), pointL: 0.6 * sm(24.2, 24.6, t) }); doc.root.fade(0.7 * dk); doc.root.position.set(-0.95, 0, -0.4); doc.root.rotation.y = 0.4;
      const bk = sm(2.4, 2.9, t) * (1 - sm(18.0, 18.4, t)); bones.visible = bk > 0.01; bones.scale.setScalar(bones.userData.s0 ??= bones.scale.x); bones.scale.setScalar(bones.userData.s0 * bk); bones.position.set(0.55, 1.0, -0.45); bones.rotation.set(0.2, t * 0.15, 0);
      const k = keyCam(KEYS, t); cam.position.copy(k.pos).add(V(0, 0.006 * pop, 0)); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const hands = hero.world('RightHand').clone().lerp(hero.world('LeftHand'), 0.5), head = hero.headPos();
      const phase = t < 7.3 ? 0 : t < 12.7 ? 1 : 2;
      const xk = sm(4.0, 4.3, t) * (1 - sm(17.9, 18.2, t));
      if (xk > 0.01) xr.show(V(0.48, 1.88, -0.2), xk, (g, kk, tt) => drawJoint(g, kk, tt, phase), phase === 1 ? sm(9.4, 11.8, t) : phase === 2 ? sm(13.0, 16.4, t) : 0, t); else xr.visible = false;
      const up = (y) => V(0, y, 0);
      showLabel(L.pop, hands.clone().add(V(0.1, 0.22, 0.1)), t, 0.8, 1.8);
      showLabel(L.cap, V(0.4, 2.2, -0.2), t, 4.4, 5.3); showLabel(L.fluid, V(0.4, 2.2, -0.2), t, 5.4, 7.2);
      showLabel(L.stretch, V(0.4, 2.2, -0.2), t, 9.4, 10.7); showLabel(L.press, V(0.4, 2.2, -0.2), t, 10.8, 12.6);
      showLabel(L.gas, V(0.4, 2.2, -0.2), t, 12.8, 16.4); showLabel(L.pop2, hands.clone().add(V(0.1, 0.22, 0.1)), t, 16.6, 17.9);
      showLabel(L.arth, head.clone().add(up(0.4)), t, 18.4, 20.6); showLabel(L.doc, V(-0.95, 2.2, -0.4), t, 20.8, 24.0); showLabel(L.fine, V(-0.95, 2.2, -0.4), t, 24.1, 26.8);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
