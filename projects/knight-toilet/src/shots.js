import * as THREE from 'three';
import { labelCam, loadKit, world, prop, person, label, showLabel, xray, ghost, keyCam, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 26.9;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['wooden_barrels_01', 'wooden_crate_01'], hdris: ['neurathen_rock_castle'], people: ['hero', 'knight', 'manuel'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
// x-ray of the armour layers around the hips: plates outside, padded cloth, chainmail skirt that slides aside
function drawLayers(g, k, t, phase) {
  g.save(); g.translate(256, 256);
  g.fillStyle = 'rgba(200,210,225,0.95)'; g.fillRect(-170, -150, 340, 70); // plate cuirass
  g.fillRect(-170, -150, 60, 330); g.fillRect(110, -150, 60, 330); // leg plates
  if (phase >= 1) { g.fillStyle = 'rgba(214,180,120,0.95)'; g.fillRect(-105, -78, 210, 60); g.strokeStyle = 'rgba(120,90,50,1)'; g.lineWidth = 4; for (let x = -100; x < 105; x += 18) { g.beginPath(); g.moveTo(x, -78); g.lineTo(x, -18); g.stroke(); } }
  if (phase >= 2) { const off = 150 * k; g.fillStyle = 'rgba(170,175,185,0.95)'; g.fillRect(-105 + off, -15, 210, 120);
    g.strokeStyle = 'rgba(90,95,105,1)'; g.lineWidth = 3; for (let y = -10; y < 105; y += 12) for (let x = -100; x < 105; x += 12) { g.beginPath(); g.arc(x + off, y, 5, 0, 6.283); g.stroke(); } }
  g.restore();
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 6, sunDir: [-4, 7, 3] }), 'neurathen_rock_castle', { height: 2.2, radius: 60, sun: 1.8, env: 0.9 });
  const barrels = prop('wooden_barrels_01'); barrels.position.set(-2.4, 0, -2.0); scene.add(barrels);
  const crate = prop('wooden_crate_01', 1.4); crate.position.set(2.2, 0, -1.6); crate.rotation.y = 0.4; scene.add(crate);
  const knight = person('knight', { height: 1.86 }); scene.add(knight.root);
  const hero = person('hero'); scene.add(hero.root);
  const squire = person('manuel', { print: false }); ghost(squire.root, 0xbfe6ff, { inPlace: true }); squire.root.traverse(m => { if (m.isMesh) m.material.blending = THREE.NormalBlending; }); scene.add(squire.root);
  const army = []; for (let i = 0; i < 6; i++) { const k = person('knight', { height: 1.86 }); scene.add(k.root); army.push(k); }
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), new THREE.MeshStandardMaterial({ color: 0xb89830, roughness: 0.03, metalness: 0.3, transparent: true, opacity: 0.6 })); puddle.rotation.x = -Math.PI / 2; puddle.position.y = 0.01; scene.add(puddle);
  const xr = xray(0.5); scene.add(xr);
  const L = { kg: label('25 KG', 0.7), min: label('UP TO 30 MIN', 0.9), sq: label('SQUIRE', 0.7), nature: label('NATURE CALLS!', 0.9), trick: label('THE TRICK', 0.8), gap: label('PLATES DIDN\'T COVER IT ALL', 1.5), pad: label('PADDED CLOTHES', 1.0), mail: label('CHAINMAIL SKIRT', 1.0), aside: label('PULLED ASIDE', 0.9), hold: label('HOLD IT...', 1.8), not: label('OR NOT!', 0.8) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 500);
  const KEYS = [[0, [1.2, 1.4, 4.8], [0.1, 1.0, 0]], [3.2, [0.8, 1.5, 3.8], [-0.1, 1.1, 0]], [9.8, [0.8, 1.5, 3.8], [-0.1, 1.1, 0]], [10.6, [0.8, 1.3, 3.8], [-0.2, 1.0, 0]], [13.2, [0.8, 1.3, 3.8], [-0.2, 1.0, 0]],
    [14.0, [0.3, 1.2, 2.6], [-0.4, 1.0, 0]], [21.8, [0.3, 1.2, 2.6], [-0.4, 1.0, 0]], [22.8, [2.2, 2.0, 7.4], [-0.4, 1.0, -1.0]], [24.9, [2.2, 2.0, 7.4], [-0.4, 1.0, -1.0]], [25.6, [0.5, 1.3, 3.6], [-0.2, 0.9, 0]], [26.9, [0.5, 1.3, 3.6], [-0.2, 0.9, 0]]];
  return {
    scene, camera: cam,
    update(t) {
      // knight squirms (needs the toilet): hands to belly, shifting
      const need = sm(0.4, 0.8, t) * (1 - sm(3.0, 3.4, t)) + sm(10.4, 10.8, t) * (1 - sm(13.0, 13.4, t)) + sm(23.4, 23.8, t) * (1 - sm(25.4, 25.7, t));
      const relief = sm(25.6, 26.0, t);
      knight.update(t, { idle: 1 }, 1, { handsBelly: need, lean: 0.25 * need * Math.abs(Math.sin(t * 5)), headTilt: 0.3 * need * Math.sin(t * 4), leanBack: 0.3 * relief, lookUp: 0.4 * relief });
      knight.root.position.set(-0.45, 0, 0); knight.root.rotation.y = 0.25 + 0.12 * need * Math.sin(t * 3);
      hero.update(t, { idle: 1 }, 1, { point: sm(3.6, 3.9, t) * (1 - sm(5.8, 6.2, t)), handsHead: sm(25.7, 26.0, t) });
      hero.root.position.set(0.75, 0, 0.5); hero.root.rotation.y = -0.6;
      // squire (ghost) fastening the armour for half an hour
      const sq = sm(6.9, 7.3, t) * (1 - sm(9.6, 10.0, t)); squire.update(t, { idle: 1 }, 1, { point: 0.8, pointL: 0.8, lean: 0.4 + 0.2 * Math.sin(t * 6) });
      squire.root.fade(0.7 * sq); squire.root.position.set(-0.45, 0, 0.75); squire.root.rotation.y = Math.PI;
      // long battle: rows of knights behind
      army.forEach((a, i) => { const vis = t > 22.2 && t < 25.6; a.root.visible = vis; if (!vis) return; a.update(t + i, { idle: 1 }, 1, { handsBelly: 0.6 + 0.3 * Math.sin(t * 3 + i) }); a.root.position.set(-2.6 + (i % 3) * 1.3, 0, -1.8 - Math.floor(i / 3) * 1.3); a.root.rotation.y = 0.1; });
      puddle.visible = t > 25.7; puddle.position.x = -0.45; puddle.position.z = 0.05; puddle.scale.setScalar(sm(25.7, 26.6, t) * 0.55 + 0.01);
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const kh = knight.headPos(), hip = knight.world('Hips');
      const xk = sm(14.2, 14.5, t) * (1 - sm(21.6, 21.9, t));
      if (xk > 0.01) { const phase = t < 16.8 ? 0 : t < 19.2 ? 1 : 2; xr.show(hip.clone().add(V(0.38, 0.2, 0.3)), xk, (g, kk, tt) => drawLayers(g, kk, tt, phase), sm(20.6, 21.3, t), t); } else xr.visible = false;
      const up = (y) => V(0, y, 0);
      showLabel(L.kg, kh.clone().add(up(0.4)), t, 4.6, 6.9); showLabel(L.min, kh.clone().add(up(0.4)), t, 7.3, 9.8); showLabel(L.sq, squire.root.position.clone().add(up(2.05)), t, 7.4, 9.6);
      showLabel(L.nature, kh.clone().add(up(0.4)), t, 11.9, 13.2); showLabel(L.trick, kh.clone().add(up(0.35)), t, 13.4, 14.3); showLabel(L.gap, kh.clone().add(up(0.35)), t, 14.4, 16.7);
      showLabel(L.pad, kh.clone().add(up(0.35)), t, 17.6, 19.1); showLabel(L.mail, kh.clone().add(up(0.35)), t, 19.2, 20.6); showLabel(L.aside, kh.clone().add(up(0.35)), t, 20.7, 21.9);
      showLabel(L.hold, V(-1.3, 2.6, -2.4), t, 24.2, 25.5); showLabel(L.not, kh.clone().add(up(0.4)), t, 25.6, 26.9);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
