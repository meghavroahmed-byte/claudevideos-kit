import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, creature, person, label, showLabel, xray, keyCam, stream, waterMat, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 28.6;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/hippo', 'sf/lifeboat', 'binoculars', 'namaqualand_boulder_02'], hdris: ['rosendal_plains_2'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawJaw(g, k) { // jaw hinge opening to ~180 degrees
  g.save(); g.translate(170, 270);
  const a = k * Math.PI * 0.95;
  g.fillStyle = 'rgba(210,230,255,0.9)';
  g.save(); g.rotate(-a / 2); g.fillRect(0, -18, 260, 36); for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(200 + i * 22, 18); g.lineTo(210 + i * 22, 50); g.lineTo(220 + i * 22, 18); g.fill(); } g.restore();
  g.save(); g.rotate(a / 2); g.fillRect(0, -18, 260, 36); for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(200 + i * 22, -18); g.lineTo(210 + i * 22, -50); g.lineTo(220 + i * 22, -18); g.fill(); } g.restore();
  g.strokeStyle = '#ffd24a'; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, 90, -a / 2, a / 2); g.stroke();
  g.fillStyle = '#ffd24a'; g.font = '900 64px Cap, sans-serif'; g.fillText(`${Math.round(k * 180)}°`, 110, 20);
  g.restore();
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 9, sunDir: [-5, 8, 4] }), 'rosendal_plains_2', { height: 2.5, radius: 70, sun: 2.0, env: 0.9 });
  const pond = new THREE.Mesh(new THREE.CircleGeometry(7, 64), waterMat(2.0, 0x8a9a7a)); pond.rotation.x = -Math.PI / 2; pond.position.set(-2.5, 0.02, -7); scene.add(pond);
  const rock = prop('namaqualand_boulder_02', 1.1); rock.position.set(3.4, 0, -4); scene.add(rock);
  const hippo = creature('sf/hippo', 3.9, 'max'); scene.add(hippo.root);
  const boat = fit(prop('sf/lifeboat'), 2.4, 'max'); const boatB = boat.clone(true); scene.add(boat, boatB);
  const clipA = new THREE.Plane(V(1, 0, 0), 0), clipB = new THREE.Plane(V(-1, 0, 0), 0);
  boat.scale.x *= 0.5;
  boatB.scale.x *= 0.5;
  const bino = prop('binoculars', 1.2); scene.add(bino);
  const splash = stream(260, 0xe8f6ff, 0.08); scene.add(splash);
  const dust = stream(200, 0xc8b490, 0.12); dust.material.opacity = 0.4; scene.add(dust);
  const hero = person('hero'); scene.add(hero.root);
  const xr = xray(1.1); scene.add(xr);
  const L = { chubby: label('SLOW & CHUBBY?', 1.8), danger: label('ONE OF AFRICA\'S MOST DANGEROUS', 2.6), kmh: label('30 KM/H', 1.6), faster: label('FASTER THAN YOU', 1.1), deg: label('180° JAWS', 1.6), snap: label('SNAPS A BOAT', 1.0), terr: label('TERRITORIAL', 1.6), charge: label('TOO CLOSE = CHARGE!', 1.9), far: label('ADMIRE FROM FAR AWAY', 2.4) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 600);
  const KEYS = [[0, [3.6, 1.7, 6.2], [0.2, 1.0, -0.6]], [2.6, [3.6, 1.7, 6.2], [0.2, 1.0, -0.6]], [4.4, [4.4, 2.2, 7.2], [-0.4, 1.0, -1.4]], [7.9, [4.4, 2.2, 7.2], [-0.4, 1.0, -1.4]],
    [8.6, [5.0, 1.8, 6.8], [1.4, 1.0, 1.0]], [12.8, [5.0, 1.8, 6.8], [2.6, 1.0, 2.6]], [13.6, [1.6, 1.6, 4.4], [-0.6, 1.0, 0]], [16.4, [1.6, 1.6, 4.4], [-0.6, 1.0, 0]],
    [17.0, [0.6, 1.3, 1.4], [-1.2, 0.3, -2.4]], [20.2, [0.6, 1.3, 1.4], [-1.2, 0.3, -2.4]], [20.8, [3.4, 1.9, 4.6], [-1.0, 0.8, -2.6]], [25.2, [3.4, 1.9, 4.6], [0.0, 0.9, -1.6]],
    [26.0, [9.0, 2.0, 16.0], [6.0, 1.2, 9.0]], [28.6, [9.0, 2.0, 16.0], [6.0, 1.2, 9.0]]];
  return {
    scene, camera: cam,
    update(t) {
      pond.material.uniforms.time.value = t;
      // ---- hippo path: grazing -> charge (8.6-12.6) -> back at the water -> charge from the water (22.4-25.2) ----
      const ch1 = sm(8.6, 12.4, t), back = sm(13.0, 13.4, t), ch2 = sm(23.8, 25.2, t);
      let hp, yaw, clip = 'Iddle', spd = 1;
      if (t < 8.6) { hp = V(-0.8, 0, -1.2); yaw = 0.9; }
      else if (t < 13.0) { hp = V(lerp(-0.8, 2.6, ch1), 0, lerp(-1.2, 2.2, ch1)); yaw = 0.8; clip = 'Walk'; spd = 2.6; }
      else if (t < 23.8) { hp = V(-1.6, -0.55, -4.2); yaw = 0.5; }
      else { hp = V(lerp(-1.6, 0.4, ch2), lerp(-0.55, 0, ch2), lerp(-4.2, -1.4, ch2)); yaw = 0.55; clip = 'Walk'; spd = 3.0; }
      hippo.root.position.copy(hp); hippo.root.rotation.y = yaw; hippo.play(t, clip, spd);
      hippo.root.visible = !(t > 16.6 && t < 20.4);
      // ---- hero: reaches to pet, runs away from the charge, then at the water's edge, then far away with binoculars ----
      const reach = sm(0.6, 1.2, t) * (1 - sm(2.4, 2.8, t)), run = t > 8.8 && t < 12.8 ? 1 : 0, scared = sm(24.0, 24.3, t) * (1 - sm(25.4, 25.6, t));
      let pos = V(0.8, 0, 0.2), ry = -1.2;
      if (run) { pos = V(lerp(0.8, 4.0, sm(8.8, 12.6, t)), 0, lerp(0.2, 3.4, sm(8.8, 12.6, t))); ry = 0.8; }
      else if (t >= 12.8 && t < 20.4) { pos = V(1.2, 0, 0.6); ry = -0.6; }
      else if (t >= 20.4 && t < 25.6) { pos = V(lerp(1.2, 0.6, sm(21.0, 23.4, t)) + 1.4 * sm(24.2, 25.4, t), 0, lerp(0.6, -0.6, sm(21.0, 23.4, t)) + 1.6 * sm(24.2, 25.4, t)); ry = scared > 0.5 ? 0.6 : -2.4; }
      else if (t >= 25.6) { pos = V(6.0, 0, 9.0); ry = -2.6; }
      hero.update(t, { idle: 1 - run, run }, 1.1, { point: reach * 0.9, lean: 0.25 * reach, flinch: scared, handsHead: 0.9 * sm(26.2, 26.6, t) });
      hero.root.position.copy(pos); hero.root.rotation.y = ry;
      // ---- boat snapped in half (16.6 - 20.4) ----
      const bv = t > 16.6 && t < 20.4; boat.visible = boatB.visible = bv; const sp = sm(19.0, 19.6, t);
      boat.position.set(-1.8 - 0.35 * sp, -0.06, -2.4); boat.rotation.set(0, 0, 0.3 * sp); boatB.position.set(-0.6 + 0.35 * sp, -0.06, -2.4); boatB.rotation.set(0, Math.PI, 0.3 * sp);
      clipA.constant = -1.2 - 0.6 * sp + 0.0; clipA.normal.set(-1, 0, 0); clipA.constant = (-1.2 - 0.6 * sp); clipB.normal.set(1, 0, 0); clipB.constant = -(-1.2 + 0.6 * sp);
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const hand = hero.world('RightHand'); bino.visible = t > 25.8; bino.position.copy(hero.headPos()).add(V(-0.08, -0.02, -0.12).applyAxisAngle(V(0, 1, 0), ry)); bino.rotation.y = ry;
      splash.update(V(-1.2, 0.2, -2.4), V(0, 1, 0), 19.1, 19.8, t, 2.0, 2.0);
      dust.update(hippo.root.position.clone(), V(0, 0.6, -0.5), 8.8, 12.6, t, 0.8, 1.6);
      const xk = sm(13.6, 13.9, t) * (1 - sm(16.4, 16.7, t));
      if (xk > 0.01) xr.show(V(-0.2, 2.3, -3.2), xk, drawJaw, sm(14.0, 15.9, t), t); else xr.visible = false;
      const up = (y) => V(0, y, 0); const hh = hippo.root.position.clone().add(up(2.2));
      showLabel(L.chubby, hh, t, 2.8, 4.4); showLabel(L.danger, hh, t, 4.6, 7.9);
      showLabel(L.kmh, hh, t, 9.2, 11.4); showLabel(L.faster, hero.headPos().add(up(0.45)), t, 11.6, 13.0);
      showLabel(L.deg, V(-0.2, 3.3, -3.2), t, 15.0, 16.6); showLabel(L.snap, V(-1.2, 0.9, -2.4), t, 17.0, 20.2);
      showLabel(L.terr, V(-1.6, 1.8, -4.2), t, 20.8, 22.4); showLabel(L.charge, hh, t, 22.6, 25.4); showLabel(L.far, hero.headPos().add(up(0.55)), t, 25.8, 28.6);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
