import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, person, label, showLabel, xray, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 23.8;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['wooden_bowl_01', 'vintage_hand_drill', 'brass_candleholders', 'sf/plague_doctor', 'WoodenTable_02'], hdris: ['fireplace'], people: ['hero', 'eric'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
function drawSkull(g, k) {
  g.fillStyle = 'rgba(235,230,215,0.95)'; g.beginPath(); g.ellipse(256, 230, 150, 140, 0, 0, 6.283); g.fill(); g.fillRect(170, 300, 170, 110);
  g.fillStyle = 'rgba(12,20,38,1)'; g.beginPath(); g.ellipse(200, 290, 32, 38, 0, 0, 6.283); g.fill(); g.beginPath(); g.ellipse(312, 290, 32, 38, 0, 0, 6.283); g.fill();
  g.beginPath(); g.arc(300, 120, 6 + 26 * k, 0, 6.283); g.fill();
  g.strokeStyle = '#ffd24a'; g.lineWidth = 9; g.beginPath(); g.moveTo(300, 120 - 20 * k); g.lineTo(380, 20); g.stroke();
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-2, 5, 3] }), 'fireplace', { height: 1.6, radius: 9, sun: 0.9, sunColor: 0xffc890, env: 0.8 });
  const table = prop('WoodenTable_02', 1.8); table.position.set(0.75, 0, -0.2); scene.add(table);
  const candles = prop('brass_candleholders', 1); candles.position.set(0.75, 0.76, -0.25); scene.add(candles);
  const fill = new THREE.PointLight(0xffd8b0, 6, 8, 1.2); scene.add(fill);
  const flame = new THREE.PointLight(0xffa040, 3, 4, 1.5); flame.position.set(0.75, 1.15, -0.2); scene.add(flame);
  const hero = person('hero'); scene.add(hero.root);
  const doc = person('eric', { print: false }); doc.root.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.multiply(new THREE.Color(0x504848)); } }); scene.add(doc.root);
  const plague = fit(prop('sf/plague_doctor'), 1.85, 'y'); scene.add(plague);
  const bowl = prop('wooden_bowl_01', 1.3); scene.add(bowl);
  const blood = stream(120, 0x9a0a10, 0.025); scene.add(blood);
  const drill = prop('vintage_hand_drill', 1); scene.add(drill);
  const leeches = []; for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.06, 6, 12), new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.15, metalness: 0.1 })); scene.add(l); leeches.push(l); }
  const herbs = stream(80, 0x6a9a40, 0.03); scene.add(herbs);
  const xr = xray(0.42); scene.add(xr);
  const L = { fever: label('FEVER?', 0.6), cut: label('CUT TO DRAIN BLOOD', 1.2), bal: label('"BALANCES THE BODY"', 1.2), lee: label('LEECHES', 0.7), head: label('HEADACHE?', 0.7), drillL: label('DRILL A HOLE IN THE SKULL!', 1.6), plagueL: label('PLAGUE DOCTOR', 1.1), mask: label('BIRD MASK FULL OF HERBS', 1.5), smell: label('"BAD SMELLS SPREAD DISEASE"', 1.6) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [1.2, 1.5, 3.6], [0.2, 1.1, 0]], [3.0, [0.9, 1.45, 2.6], [0, 1.15, 0]], [12.0, [0.9, 1.45, 2.6], [0, 1.15, 0]], [12.4, [0.6, 1.6, 2.1], [-0.1, 1.45, 0]], [15.4, [0.6, 1.6, 2.1], [-0.1, 1.45, 0]], [16.0, [0.2, 1.5, 3.0], [-0.8, 1.2, -0.4]], [23.8, [0.0, 1.55, 2.5], [-0.9, 1.45, -0.4]]];
  return {
    scene, camera: cam,
    update(t) {
      const fever = sm(3.2, 3.6, t) * (1 - sm(4.6, 5.0, t)), arm = sm(4.6, 5.0, t) * (1 - sm(11.6, 12.0, t)), pain = sm(12.2, 12.6, t) * (1 - sm(15.2, 15.6, t));
      hero.update(t, { idle: 1 }, 1, { facepalm: 0.8 * fever + 0.7 * pain, point: 0.8 * arm, flinch: 0.4 * sm(5.0, 5.3, t) * (1 - sm(6.0, 6.4, t)) });
      hero.root.position.set(0, 0, 0); hero.root.rotation.y = 0.35;
      const dk = t < 15.6; doc.root.visible = dk; doc.update(t, { idle: 1 }, 1, { point: 0.7 * arm + 0.8 * pain, lean: 0.3 * (arm + pain) }); doc.root.position.set(0.8, 0, -0.45); doc.root.rotation.y = -1.2;
      plague.visible = t > 15.6; plague.position.set(-0.9, 0, -0.5); plague.rotation.y = 0.9;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam); fill.position.copy(cam.position).add(V(0.3, 0.4, 0));
      scene.updateMatrixWorld(true);
      const rh = hero.world('RightHand'), fore = hero.world('RightForeArm'), head = hero.headPos();
      bowl.visible = arm > 0.01; bowl.position.copy(rh).add(V(0, -0.25, 0.05));
      blood.update(fore.clone().lerp(rh, 0.5), V(0, -1, 0), 5.2, 8.6, t, 0.5, 0.03);
      leeches.forEach((l, i) => { const v = t > 8.9 + i * 0.25 && t < 12.0; l.visible = v; l.position.copy(fore.clone().lerp(rh, 0.2 + i * 0.18)).add(V(0, 0.03, 0.03)); l.rotation.set(0.3, i, 1.2); l.scale.setScalar(1 + 0.1 * Math.sin(t * 4 + i)); });
      drill.visible = pain > 0.01; drill.position.copy(head).add(V(0.12, 0.18, 0.02)); drill.rotation.set(0, 0, -0.6);
      herbs.update(V(-1.0, 1.65, -0.35), V(0.3, 0.5, 0.4), 18.8, 20.8, t, 0.3, 0.2);
      const xk = sm(13.2, 13.5, t) * (1 - sm(15.2, 15.5, t));
      if (xk > 0.01) xr.show(head.clone().add(V(-0.32, 0.05, 0.1)), xk, drawSkull, sm(13.6, 14.8, t), t); else xr.visible = false;
      const hp = head.clone().add(V(0, 0.35, 0)); const pp = V(-1.0, 2.3, -0.5);
      showLabel(L.fever, hp, t, 3.3, 4.6); showLabel(L.cut, hp, t, 4.8, 6.6); showLabel(L.bal, hp, t, 6.7, 8.6); showLabel(L.lee, rh.clone().add(V(0, 0.18, 0)), t, 9.4, 12.0);
      showLabel(L.head, hp, t, 12.2, 13.5); showLabel(L.drillL, hp, t, 13.6, 15.5); showLabel(L.plagueL, pp, t, 16.0, 17.9); showLabel(L.mask, pp, t, 18.0, 20.2); showLabel(L.smell, pp, t, 20.3, 23.8);
      return { bloom: 0.15, exposure: 0.78 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
