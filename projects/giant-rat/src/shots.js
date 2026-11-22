import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GroundedSkybox } from 'three/addons/objects/GroundedSkybox.js';
import { makeHuman } from './human.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 28.2;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];

const A = './assets/';
const ASSETS = {};
export async function PRELOAD(renderer) {
  const gl = new GLTFLoader();
  const names = ['street_rat', 'metal_trash_can', 'fire_hydrant', 'concrete_road_barrier', 'cardboard_box_01', 'Barrel_01', 'covered_car', 'hamburger_buns', 'bananas', 'food_apple_01'];
  await Promise.all(names.map(n => gl.loadAsync(`${A}${n}/${n}.gltf`).then(g => { ASSETS[n] = g.scene; })));
  const hdr = await new RGBELoader().loadAsync(`${A}hdri/urban_alley_01.hdr`);
  hdr.mapping = THREE.EquirectangularReflectionMapping; ASSETS.hdr = hdr;
  const pm = new THREE.PMREMGenerator(renderer); ASSETS.env = pm.fromEquirectangular(hdr).texture;
}

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const clone = (n, s = 1) => { const o = ASSETS[n].clone(true); o.scale.setScalar(s); o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };
// plain label: white bold text with black outline + thin pointer line (no panel)
function label(text, w = 0.5) {
  const t = canvasTex(1024, 256, (g) => { g.font = "900 120px Cap, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 22; g.strokeStyle = '#000'; g.strokeText(text, 512, 128); g.fillStyle = '#fff'; g.fillText(text, 512, 128); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); s.renderOrder = 40; s.userData.w = w;
  s.set = (k) => { s.visible = k > 0.01; s.scale.set(w * k, w * 0.25 * k, 1); }; s.set(0); return s;
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 8, sunDir: [-3, 8, 4], sun: 2.2 });
  scene.userData.sky.visible = false;
  scene.children.filter(o => o.isMesh && !o.material.isShadowMaterial && o.geometry && o.geometry.type === 'PlaneGeometry').forEach(o => o.visible = false);
  scene.environment = ASSETS.env; scene.environmentIntensity = 0.9; scene.fog = null;
  const sky = new GroundedSkybox(ASSETS.hdr, 6, 60); sky.position.y = 6 - 0.01; scene.add(sky);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.25;
  const key = scene.userData.key; key.intensity = 1.6; key.color.set(0xfff1dd);
  // alley props
  const RS = 26; // rat scale: ~0.9 m tall, ~3.9 m long
  const can = clone('metal_trash_can'); can.position.set(-3.0, 0, -4.4); scene.add(can);
  const can2 = clone('metal_trash_can'); can2.position.set(-3.4, 0, -3.5); can2.rotation.y = 1; scene.add(can2);
  const hyd = clone('fire_hydrant'); hyd.position.set(2.9, 0, -2.2); scene.add(hyd);
  const box = clone('cardboard_box_01'); box.position.set(-2.0, 0, -3.3); box.scale.setScalar(1.6); scene.add(box);
  const barrel = clone('Barrel_01'); barrel.position.set(-0.6, 0, -3.4); scene.add(barrel);
  const barrier = clone('concrete_road_barrier'); barrier.position.set(1.0, 0, -3.5); scene.add(barrier);
  const car = clone('covered_car'); car.position.set(3.2, 0, -6.5); car.rotation.y = Math.PI / 2; scene.add(car);
  const food = new THREE.Group(); scene.add(food);
  ['hamburger_buns', 'bananas', 'food_apple_01', 'food_apple_01', 'bananas', 'hamburger_buns', 'food_apple_01'].forEach((n, i) => { const f = clone(n, 2.4); f.position.set(0.7 + (i % 4) * 0.25, 0, 0.2 + Math.floor(i / 4) * 0.25); f.rotation.y = i; food.add(f); });
  const rat = clone('street_rat', RS); const ratG = new THREE.Group(); ratG.add(rat); scene.add(ratG);
  const ghost = clone('street_rat', 1); ghost.traverse(m => { if (m.isMesh) { m.castShadow = false; m.material = new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.5, depthWrite: false }); } }); scene.add(ghost);
  const small = clone('street_rat', 5); scene.add(small);
  const hero = makeHuman('casual', { shirt: 0x2a9d8f, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  // x-ray circle (sits on the rat)
  const xc = document.createElement('canvas'); xc.width = xc.height = 512; const xg = xc.getContext('2d'); const xt = new THREE.CanvasTexture(xc); xt.colorSpace = THREE.SRGBColorSpace;
  const xray = new THREE.Sprite(new THREE.SpriteMaterial({ map: xt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); xray.renderOrder = 35; scene.add(xray);
  const drawX = (mode, k, tt) => { xg.clearRect(0, 0, 512, 512); xg.save(); xg.beginPath(); xg.arc(256, 256, 236, 0, 7); xg.clip(); xg.fillStyle = 'rgba(14,22,40,0.9)'; xg.fillRect(0, 0, 512, 512);
    xg.strokeStyle = 'rgba(220,235,255,0.95)'; xg.fillStyle = 'rgba(220,235,255,0.9)'; xg.lineWidth = 10; xg.lineCap = 'round';
    if (mode === 0) { // skull side view with growing incisors
      xg.beginPath(); xg.moveTo(90, 250); xg.quadraticCurveTo(200, 120, 360, 190); xg.lineTo(420, 250); xg.quadraticCurveTo(300, 300, 110, 300); xg.closePath(); xg.stroke();
      xg.beginPath(); xg.arc(250, 220, 24, 0, 7); xg.stroke();
      const L = 40 + 140 * k; xg.fillStyle = '#ffd24a'; xg.beginPath(); xg.moveTo(400, 245); xg.quadraticCurveTo(430 + L * 0.2, 250 + L * 0.6, 400 + L * 0.15, 250 + L); xg.lineTo(385, 255); xg.closePath(); xg.fill();
      xg.beginPath(); xg.moveTo(395, 300); xg.quadraticCurveTo(420, 300 - L * 0.4, 405, 300 - L * 0.55); xg.lineTo(385, 300); xg.closePath(); xg.fill();
    } else { // leg bone buckling
      xg.save(); xg.translate(256, 256); xg.rotate(0.15 + 0.5 * k); xg.fillRect(-14, -190, 28, 170); xg.restore();
      xg.save(); xg.translate(256, 256); xg.rotate(-0.15 - 0.45 * k); xg.fillRect(-14, 20, 28, 170); xg.restore();
      if (k > 0.5) { xg.strokeStyle = '#ff3b3b'; xg.lineWidth = 9; for (let i = 0; i < 4; i++) { xg.beginPath(); xg.moveTo(256, 256); xg.lineTo(256 + Math.cos(i * 1.6 + tt) * 60, 256 + Math.sin(i * 1.6 + tt) * 60); xg.stroke(); } }
    }
    xg.restore(); xg.strokeStyle = '#ff3b30'; xg.lineWidth = 16; xg.beginPath(); xg.arc(256, 256, 238, 0, 7); xg.stroke(); xt.needsUpdate = true; };
  const lab = { teeth: label('INCISORS', 0.7), cm: label('12 CM / YEAR', 1.1), wood: label('WOOD', 1.5), plastic: label('PLASTIC', 1.5), concrete: label('CONCRETE', 1.3), door: label('CAR DOOR', 1.3), fall: label('5 STORIES', 1.3), legs: label('TOO HEAVY', 1.2) };
  Object.values(lab).forEach(l => scene.add(l));
  const fx = { wood: burst(0xc8a070, 50, 1), plastic: burst(0x3a8ad8, 50, 2), concrete: burst(0xb8b4ac, 70, 3), door: burst(0xd8dce0, 70, 4), land: burst(0xb8a888, 30, 5), sag: burst(0xa89a88, 60, 6) };
  Object.values(fx).forEach(f => scene.add(f));
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.28, 12), new THREE.MeshBasicMaterial({ color: 0x050505 })); hole.scale.set(1.3, 1, 1); scene.add(hole);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // ---------- rat path: [time, [noseX, noseZ, heading]] ----------
      const H = Math.PI / 2, PI = Math.PI;
      const P = [[0, [0.4, -0.6, H]], [8.4, [0.4, -0.6, H]], [9.3, [-2.0, -2.75, PI]], [9.9, [-0.6, -2.85, PI]], [10.8, [1.0, -2.95, PI]], [12.6, [1.0, -2.95, PI]], [14.6, [2.8, -5.45, PI]], [16.6, [2.8, -5.45, PI]], [19.8, [0.4, -0.6, H]], [28.2, [0.4, -0.6, H]]];
      let i = 0; while (i < P.length - 2 && P[i + 1][0] < t) i++;
      const k = smooth(range(t, P[i][0], P[i + 1][0]));
      const a = P[i][1], b = P[i + 1][1];
      const moving = k > 0.01 && k < 0.99 && (a[0] !== b[0] || a[1] !== b[1]);
      const sag = smooth(range(t, 22.4, 23.4)), thin = smooth(range(t, 24.6, 26.6));
      const hd = lerp(a[2], b[2], k), nx = lerp(a[0], b[0], k), nz = lerp(a[1], b[1], k);
      ratG.position.set(nx - Math.sin(hd) * 0.04 * RS, (moving ? Math.abs(Math.sin(t * 14)) * 0.06 : 0) - 0.1 * sag, nz - Math.cos(hd) * 0.04 * RS);
      ratG.rotation.set(0, hd, 0.1 * sag);
      rat.scale.set(RS * (1 - 0.35 * thin), RS * (1 - 0.3 * sag) * (1 - 0.1 * thin), RS);
      const chew = (t > 9.3 && t < 12.6) || (t > 14.8 && t < 16.6);
      rat.rotation.x = chew ? Math.sin(t * 22) * 0.04 : Math.sin(t * 2) * 0.012;
      // ghost: normal-size rat that swells into the giant (rat hidden meanwhile)
      const gk = smooth(range(t, 20.4, 20.6)) * (1 - smooth(range(t, 21.9, 22.2)));
      ghost.visible = gk > 0.01; rat.visible = gk < 0.5;
      ghost.position.copy(ratG.position); ghost.rotation.copy(ratG.rotation); ghost.scale.setScalar(lerp(3, RS, easeInOut(range(t, 20.6, 21.7))));
      ghost.traverse(m => { if (m.isMesh) m.material.opacity = 0.5 * gk; });
      // small rat falls onto the box then runs off
      const fall = range(t, 17.2, 18.4), land = t > 18.4, run = Math.max(0, t - 18.9);
      small.visible = t > 16.9 && t < 20.4;
      const top = 0.54;
      small.position.set(-2.0 + run * 1.4, land ? top * (1 - smooth(range(t, 18.9, 19.2))) + (t < 18.9 ? Math.abs(Math.sin((t - 18.4) * 6)) * 0.08 : 0) : lerp(8, top, fall * fall), -3.15 + run * 0.9);
      small.rotation.set(land ? 0 : t * 4, land ? 0.9 : t * 3, 0);
      fx.land.position.set(-2.0, top, -3.3); fx.land.update(t - 18.4);
      food.visible = t > 24.0; food.scale.setScalar(Math.max(0.001, 1 - smooth(range(t, 25.0, 26.6))));
      // ---------- hero ----------
      hero.root.position.set(1.75, 0, -0.35); hero.root.rotation.y = -H + 0.25;
      const scared = smooth(range(t, 0.3, 0.8)) * (1 - smooth(range(t, 3.0, 4.0)));
      let pose = STAND(t);
      if (scared > 0.01) pose = over(pose, { spine: [-0.15 * scared, 0, 0], lSh: [-1.6 * scared, 0, 0.5], rSh: [-1.6 * scared, 0, -0.5], lEl: [-1.4 * scared, 0, 0], rEl: [-1.4 * scared, 0, 0], neck: [-0.15 * scared, 0, 0] });
      hero.setPose(pose); hero.setMouth(scared > 0.3 ? 0.7 : 0.06);
      scene.updateMatrixWorld(true);
      const head = rat.localToWorld(V(0, 0.022, 0.026)), leg = rat.localToWorld(V(0.012, 0.007, 0.004));
      fx.wood.position.copy(head); fx.wood.update(t - 9.6); fx.plastic.position.copy(head); fx.plastic.update(t - 10.15); fx.concrete.position.copy(head); fx.concrete.update(t - 11.0);
      fx.door.position.copy(head); fx.door.update(t - 15.6);
      fx.sag.position.copy(ratG.position).add(V(0, 0.2, 0)); fx.sag.update(t - 22.6);
      hole.visible = t > 15.7 && t < 20; hole.position.set(2.8, 0.55, -5.58); hole.rotation.y = 0;
      // ---------- camera ----------
      const KEYS = [[0, [4.0, 1.8, 7.5], [0.4, 0.7, -0.6]], [2.4, [1.7, 0.9, 1.7], [0.1, 0.5, -0.7]], [7.8, [1.7, 0.9, 1.7], [0.1, 0.5, -0.7]], [8.8, [4.8, 1.9, 0.6], [-0.4, 0.6, -3.0]], [12.4, [4.8, 1.9, 0.6], [0.6, 0.6, -3.0]], [14.4, [5.6, 1.6, -2.2], [2.4, 0.6, -5.4]], [16.6, [5.6, 1.6, -2.2], [2.4, 0.6, -5.4]], [17.2, [-0.6, 1.6, -0.4], [-1.9, 1.9, -3.2]], [18.4, [-0.6, 1.4, -0.6], [-1.9, 0.6, -3.2]], [19.6, [-0.6, 1.4, -0.6], [-1.5, 0.5, -3.0]], [20.6, [4.0, 1.8, 7.5], [0.4, 0.7, -0.6]], [22.2, [2.0, 1.2, 4.0], [-0.4, 0.5, -0.6]], [24.4, [2.0, 1.2, 4.0], [-0.4, 0.5, -0.6]], [28.2, [3.6, 1.6, 6.8], [0.4, 0.6, -0.4]]];
      let j = 0; while (j < KEYS.length - 2 && KEYS[j + 1][0] < t) j++;
      const kk = smooth(range(t, KEYS[j][0], KEYS[j + 1][0]));
      const cp = V(...KEYS[j][1]).lerp(V(...KEYS[j + 1][1]), kk), lk = V(...KEYS[j][2]).lerp(V(...KEYS[j + 1][2]), kk);
      const shk = shake(t, 0.35 + (Math.abs(t - 15.6) < 0.3 ? 2.5 : 0) + (Math.abs(t - 22.4) < 0.3 ? 2.5 : 0), 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      // x-ray on the head (2.6..7.6) then on the leg (22.0..24.2)
      const x1 = easeOut(range(t, 2.6, 3.0)) * (1 - smooth(range(t, 7.4, 7.7))), x2 = easeOut(range(t, 21.9, 22.2)) * (1 - smooth(range(t, 24.2, 24.5)));
      if (x1 > 0.01) drawX(0, smooth(range(t, 3.6, 6.8)), t); else if (x2 > 0.01) drawX(1, smooth(range(t, 22.6, 23.4)), t);
      xray.position.copy(x1 > 0.01 ? head.clone().add(V(0, 0.2, 0)) : leg); xray.scale.setScalar(0.85 * Math.max(x1, x2)); xray.visible = Math.max(x1, x2) > 0.01;
      // labels near objects
      const L = (l, pos, a0, a1) => { const kk2 = easeOut(range(t, a0, a0 + 0.15)) * (1 - smooth(range(t, a1, a1 + 0.15))); l.position.copy(pos); l.set(kk2); };
      L(lab.teeth, head.clone().add(V(0, 0.5, 0)), 3.1, 5.6); L(lab.cm, head.clone().add(V(0, 0.5, 0)), 5.7, 7.6);
      L(lab.wood, box.position.clone().add(V(0, 1.3, 0)), 9.55, 10.6); L(lab.plastic, barrel.position.clone().add(V(0, 1.5, 0)), 10.1, 11.0); L(lab.concrete, barrier.position.clone().add(V(-0.5, 1.5, 0)), 10.9, 12.3);
      L(lab.door, V(2.4, 1.9, -5.6), 15.6, 16.6); L(lab.fall, V(-1.9, 2.2, -3.3), 17.4, 19.6); L(lab.legs, ratG.position.clone().add(V(0, 1.6, 0)), 22.6, 24.3);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.3, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
