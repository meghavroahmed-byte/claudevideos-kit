import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, texMat, person, label, showLabel, xray, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 30.6;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: [], hdris: ['snowy_field'], tex: ['snow_02', 'corrugated_iron'], people: ['hero', 'soldier'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawVessels(g, k) {
  for (let i = 0; i < 3; i++) { const y = 150 + i * 110, w = lerp(46, 16, k);
    g.fillStyle = 'rgba(200,40,50,0.95)'; g.beginPath(); g.moveTo(40, y - w / 2); g.bezierCurveTo(200, y - w / 2 - 20, 300, y - w / 2 + 20, 472, y - w / 2); g.lineTo(472, y + w / 2); g.bezierCurveTo(300, y + w / 2 + 20, 200, y + w / 2 - 20, 40, y + w / 2); g.fill(); }
  g.strokeStyle = '#7fd8ff'; g.lineWidth = 8; for (const x of [140, 370]) { g.beginPath(); g.moveTo(x, 80); g.lineTo(x, 110); g.moveTo(x - 15, 95); g.lineTo(x + 15, 95); g.stroke(); }
}
function drawIceLungs(g, k) {
  for (const sx of [-1, 1]) { g.save(); g.translate(256 + sx * 85, 290); g.fillStyle = 'rgba(255,150,160,0.75)'; g.beginPath(); g.ellipse(0, 0, 70, 120, sx * 0.15, 0, 6.283); g.fill(); g.stroke(); g.restore(); }
  g.beginPath(); g.moveTo(256, 90); g.lineTo(256, 190); g.lineTo(215, 230); g.moveTo(256, 190); g.lineTo(297, 230); g.stroke();
  g.fillStyle = 'rgba(200,240,255,0.95)'; for (let i = 0; i < 40 * k; i++) { const x = 150 + (i * 47) % 220, y = 200 + (i * 31) % 190; g.save(); g.translate(x, y); g.rotate(i); g.fillRect(-6, -2, 12, 4); g.fillRect(-2, -6, 4, 12); g.restore(); }
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 8, sunDir: [-4, 5, 3] }), 'snowy_field', { height: 2, radius: 70, sun: 1.6, sunColor: 0xe8f0ff, env: 1.0 });
  const snow = new THREE.Mesh(new THREE.CircleGeometry(30, 64), texMat('snow_02', 12, 12, { color: 0xf4f8ff })); snow.rotation.x = -Math.PI / 2; snow.position.y = 0.01; snow.receiveShadow = true; scene.add(snow);
  const hut = new THREE.Mesh(new THREE.BoxGeometry(4, 2.6, 3), texMat('corrugated_iron', 3, 2, { color: 0xe06a2a, metalness: 0.4 })); hut.position.set(4.6, 1.3, -6); hut.rotation.y = -0.4; hut.castShadow = true; scene.add(hut);
  const sciP = person('soldier', { print: false }); const sci = sciP.root; sci.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.multiply(new THREE.Color(0xff9a70)); } }); scene.add(sci);
  const hero = person('hero'); scene.add(hero.root);
  const skin = []; hero.root.traverse(m => { if (m.isMesh) skin.push(m.material); });
  const breath = stream(240, 0xeaf6ff, 0.05); scene.add(breath);
  const crystals = stream(160, 0xffffff, 0.025); crystals.material.blending = THREE.AdditiveBlending; scene.add(crystals);
  const wind = stream(1400, 0xffffff, 0.07); wind.material.opacity = 0.85; scene.add(wind);
  const xr = xray(0.5); scene.add(xr);
  const L = { deg: label('-90°C', 0.9), ice: label('BREATH → ICE CRYSTALS', 1.4), frost: label('FROSTBITE', 0.8), shiver: label('SHIVERING', 0.8), vess: label('BLOOD VESSELS SQUEEZE', 1.4), lungs: label('LUNG DAMAGE', 0.9), layers: label('THICK LAYERS', 1.0), mask: label('GOGGLES & MASKS', 1.1), long: label('NEVER STAY LONG!', 1.2) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 500);
  const KEYS = [[0, [1.8, 1.6, 6.0], [0, 1.2, 0]], [4.8, [1.0, 1.4, 3.8], [0, 1.1, 0]], [5.4, [0.35, 1.62, 1.5], [0, 1.55, 0]], [10.2, [0.35, 1.62, 1.5], [0, 1.55, 0]], [10.8, [0.7, 1.5, 2.8], [0, 1.3, 0]], [14.2, [0.7, 1.5, 2.8], [0, 1.3, 0]],
    [14.8, [0.9, 1.4, 3.6], [0, 1.1, 0]], [23.2, [0.9, 1.4, 3.6], [0, 1.1, 0]], [24.0, [3.4, 1.8, 3.2], [2.2, 1.2, -1.2]], [30.6, [3.4, 1.8, 3.2], [2.2, 1.2, -1.2]]];
  return {
    scene, camera: cam,
    update(t) {
      const shiver = sm(14.4, 15.0, t) * (t < 24 ? 1 : 0.6), cold = sm(1.0, 4.0, t);
      const j = shiver * Math.sin(t * 38) * 0.6 + cold * 0.15 * Math.sin(t * 25);
      hero.update(t, { idle: 1 }, 1, { handsChest: 0.85 * cold, slump: 0.2 * cold, headTilt: j * 0.15, lean: 0.1 * j, handsThroat: 0.4 * sm(20.6, 21.0, t) * (1 - sm(23.2, 23.6, t)) });
      hero.root.position.set(-0.2 + j * 0.01, 0, 0); hero.root.rotation.y = 0.2;
      // frostbite: skin turns pale-blue
      const fb = sm(11.4, 13.6, t); skin.forEach(m => m.color.setRGB(1 - 0.25 * fb, 1 - 0.12 * fb, 1));
      sci.visible = t > 23.4; sciP.update(t, { idle: 1 }, 1, {}); sci.position.set(2.2, 0, -1.4); sci.rotation.y = -2.5;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos(), chest = hero.world('Spine2'); const mouth = head.clone().add(V(0, -0.06, 0.12));
      breath.update(mouth, V(0.1, 0.25, 1), 0.5, 30.6, t, 0.35, 0.25);
      crystals.update(mouth.clone().add(V(0, 0, 0.12)), V(0.1, 0.1, 1), 5.8, 10.2, t, 0.3, 0.5);
      wind.update(V(-8, 1.2, 0), V(1, -0.05, 0.1), 0, 30.6, t, 9, 6);
      const x1 = sm(17.0, 17.3, t) * (1 - sm(20.2, 20.5, t)), x2 = sm(20.7, 21.0, t) * (1 - sm(23.2, 23.5, t));
      if (x1 > 0.01) xr.show(hero.world('LeftForeArm').clone().add(V(-0.35, 0.3, 0.2)), x1, drawVessels, sm(17.6, 19.6, t), t);
      else if (x2 > 0.01) xr.show(chest.clone().add(V(0.38, 0.25, 0.2)), x2, drawIceLungs, sm(21.2, 22.8, t), t); else xr.visible = false;
      const up = (y) => V(0, y, 0);
      showLabel(L.deg, head.clone().add(up(0.45)), t, 3.3, 5.3); showLabel(L.ice, head.clone().add(V(0.1, 0.24, 0.1)), t, 6.0, 10.2);
      showLabel(L.frost, head.clone().add(up(0.35)), t, 12.8, 14.3); showLabel(L.shiver, head.clone().add(up(0.42)), t, 14.9, 16.8);
      showLabel(L.vess, head.clone().add(up(0.42)), t, 17.2, 20.3); showLabel(L.lungs, head.clone().add(up(0.42)), t, 21.6, 23.4);
      const sh = V(2.2, 2.25, -1.4); showLabel(L.layers, sh, t, 24.9, 26.1); showLabel(L.mask, sh, t, 26.2, 27.8); showLabel(L.long, sh, t, 27.9, 30.6);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
