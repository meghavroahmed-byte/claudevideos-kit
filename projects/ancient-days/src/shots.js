import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { infoCard, burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { world, grass, tree, rock, river, quadruped, fish, spear, stoneAxe, torch, basket, gourd, campfire, tent, house, wheat, fence, smoke, ICONS, iconBubble, stamp, sunDisc } from './ancient.js';

export const DURATION = 35.4;
export const CAPTIONS = [
  [0.0, 'What did people do'], [1.14, 'all day'], [1.76, 'in ancient times'], [2.87, 'when there were'], [3.51, 'no jobs'], [4.26, 'offices'], [5.0, 'or even money?'],
  [6.38, 'Well…'], [7.03, 'they definitely'], [7.85, "weren't sitting around"], [8.71, 'doing nothing!'],
  [9.99, 'Most people'], [10.61, 'spent their days'], [11.4, 'hunting animals'], [12.52, 'gathering fruits'], [13.84, 'fishing'], [14.42, 'and searching for'], [15.16, 'clean water'],
  [16.48, 'Others'], [16.87, 'built shelters'], [17.89, 'made tools'], [18.83, 'prepared food'], [19.98, 'and protected'], [20.61, 'their families'], [21.34, 'from wild animals'],
  [22.84, 'As farming'], [23.43, 'developed'], [24.12, 'people started'], [24.91, 'growing crops'], [25.95, 'raising livestock'], [27.03, 'and building'], [27.58, 'permanent communities'],
  [29.32, "And here's"], [29.79, 'the surprising part'], [31.13, 'surviving'], [31.75, 'back then'], [32.39, 'was basically'], [33.33, 'a full-time job!', 35.2],
];
export const FADES = [];   // one continuous take

const H0 = V(0, 0, 0), ROCK = V(0.05, 0, -0.62);
const HUNT_END = V(6.2, 0, -1.2), DEER0 = [V(8.8, 0, -2.9), V(9.8, 0, -3.6)];
const TREE = V(11.5, 0, -2.75), GATH = V(11.15, 0, -1.55), BASKET = V(10.62, 0, -1.25);
const RIVER_X = 15.0, FISHER = V(15.0, 0, -2.1), WATERW = V(16.85, 0, -0.85);
const TENT = V(20.0, 0, -2.7), BUILDER = V(21.25, 0, -1.55);
const TOOLM = V(22.65, 0, -0.75), FIRE = V(24.45, 0, -1.65), COOK = V(25.35, 0, -1.25);
const PROT = V(28.0, 0, 0.3), MOM = V(26.95, 0, -0.55), KID = V(27.35, 0, -0.1), WOLF0 = [V(31.6, 0, -4.6), V(32.4, 0, -3.0)], WOLF1 = [V(29.45, 0, -1.65), V(30.0, 0, -0.55)];
const FIELD = [32.2, -9.5, 39.6, -2.6], FARMER = V(31.55, 0, -1.6);
const PEN = [39.4, -4.4, 43.6, -0.9], HERDER = V(41.0, 0, 0.15);
const HE = V(37.45, 0, 1.75);

// camera keys [t, pos, look]
const K = [
  [0.0, [0.9, 1.75, 7.6], [0, 1.15, 0]],
  [1.9, [0.5, 1.7, 6.9], [0, 1.2, 0]],
  [3.4, [0.1, 1.95, 6.5], [0, 1.6, 0]],
  [5.9, [0, 1.95, 6.3], [0, 1.55, 0]],
  [6.9, [0.45, 1.5, 5.0], [0, 0.85, -0.35]],
  [8.9, [0.55, 1.5, 4.8], [0, 0.85, -0.35]],
  [9.7, [1.5, 1.7, 5.6], [1.2, 1.0, -0.4]],
  [10.5, [3.3, 1.8, 5.6], [3.6, 1.0, -0.8]],
  [11.2, [5.6, 1.95, 5.6], [6.6, 0.95, -1.6]],
  [11.95, [6.4, 2.05, 5.7], [7.2, 0.9, -2.0]],
  [12.6, [8.9, 1.8, 3.9], [11.0, 1.15, -2.0]],
  [13.45, [10.6, 1.75, 3.5], [11.6, 1.15, -1.9]],
  [14.05, [13.6, 1.65, 3.7], [15.1, 0.8, -1.6]],
  [14.7, [14.7, 1.6, 3.7], [15.7, 0.75, -1.3]],
  [15.95, [15.6, 1.6, 3.6], [16.4, 0.65, -1.0]],
  [16.7, [18.5, 2.0, 4.4], [20.1, 1.0, -2.0]],
  [17.75, [19.4, 1.95, 4.2], [20.6, 1.0, -1.9]],
  [18.45, [21.5, 1.65, 3.9], [22.7, 0.7, -0.9]],
  [19.3, [22.9, 1.75, 4.0], [24.1, 0.75, -1.3]],
  [20.2, [28.4, 2.2, 7.4], [28.3, 0.85, -0.6]],
  [21.6, [28.6, 2.1, 7.1], [28.4, 0.85, -0.6]],
  [22.5, [29.2, 2.3, 7.3], [28.9, 0.85, -0.9]],
  [23.5, [29.5, 2.6, 5.1], [32.3, 0.6, -2.9]],
  [24.9, [31.1, 3.2, 5.7], [34.6, 0.4, -4.6]],
  [26.05, [36.2, 2.7, 4.7], [40.8, 0.5, -2.6]],
  [27.15, [38.2, 4.6, 6.8], [41.6, 0.6, -5.0]],
  [28.7, [41.0, 12.0, 12.5], [42.5, 0, -11]],
  [29.6, [40.6, 12.3, 12.9], [42.0, 0, -10.5]],
  [30.95, [38.7, 1.95, 6.7], [37.5, 1.1, 1.75]],
  [33.3, [38.45, 1.85, 6.3], [37.5, 1.15, 1.75]],
  [35.4, [38.3, 1.85, 6.1], [37.5, 1.15, 1.75]],
];
function track(t) {
  const n = K.length, T = (i) => K[clamp(i, 0, n - 1)][0], P = (i, j) => V(...K[clamp(i, 0, n - 1)][j]);
  if (t <= K[0][0]) return [P(0, 1), P(0, 2)];
  if (t >= K[n - 1][0]) return [P(n - 1, 1), P(n - 1, 2)];
  let i = 0; while (K[i + 1][0] < t) i++;
  const u = (t - T(i)) / (T(i + 1) - T(i)), dt = T(i + 1) - T(i);
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  return [1, 2].map(j => {
    const m0 = P(i + 1, j).sub(P(i - 1, j)).multiplyScalar(dt / Math.max(1e-3, T(i + 1) - T(i - 1)) * 0.55);
    const m1 = P(i + 2, j).sub(P(i, j)).multiplyScalar(dt / Math.max(1e-3, T(i + 2) - T(i)) * 0.55);
    return P(i, j).multiplyScalar(h00).add(m0.multiplyScalar(h10)).add(P(i + 1, j).multiplyScalar(h01)).add(m1.multiplyScalar(h11));
  });
}

// ---------- poses ----------
const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
function RUN(p, a = 1, lean = 0.22) {
  const s = Math.sin(p);
  return {
    lHip: [-0.85 * s * a, 0, 0.05], rHip: [0.85 * s * a, 0, -0.05],
    lKn: [(0.25 + 1.0 * Math.max(0, Math.sin(p + 1.3))) * a, 0, 0], rKn: [(0.25 + 1.0 * Math.max(0, Math.sin(p + 1.3 + Math.PI))) * a, 0, 0],
    lAn: [0.2 * a, 0, 0], rAn: [0.2 * a, 0, 0],
    lSh: [0.85 * s * a, 0, 0.2], rSh: [-0.85 * s * a, 0, -0.2], lEl: [-1.3 * a - 0.2, 0, 0], rEl: [-1.3 * a - 0.2, 0, 0],
    spine: [lean * a, 0, 0], chest: [0.05 * a, Math.sin(p) * 0.12 * a, 0], neck: [-lean * 0.7 * a, 0, 0], drop: -0.06 * a + Math.abs(Math.cos(p)) * 0.05 * a,
  };
}
const WALK = (p, a = 1) => RUN(p, a * 0.45, 0.05);
const KNEEL = { drop: -0.5, lHip: [-1.45, 0, 0.1], lKn: [1.5, 0, 0], lAn: [0.0, 0, 0], rHip: [-0.05, 0, -0.08], rKn: [1.55, 0, 0], rAn: [0.6, 0, 0] };
const SIT = { drop: -0.47, lHip: [-1.35, 0, 0.18], lKn: [1.0, 0, 0], rHip: [-1.25, 0, -0.14], rKn: [0.75, 0, 0], lAn: [-0.2, 0, 0], rAn: [-0.2, 0, 0] };
const CROUCH = { drop: -0.42, lHip: [-1.6, 0, 0.22], lKn: [2.0, 0, 0], lAn: [-0.4, 0, 0], rHip: [-1.6, 0, -0.22], rKn: [2.0, 0, 0], rAn: [-0.4, 0, 0], spine: [0.35, 0, 0] };
const mix = (a, b, k) => { const o = {}; for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) { if (key === 'drop') { o.drop = lerp(a.drop || 0, b.drop || 0, k); continue; } const va = a[key] || [0, 0, 0], vb = b[key] || [0, 0, 0]; o[key] = va.map((x, i) => lerp(x, vb[i], k)); } return o; };
const over = (a, b) => Object.assign({}, a, b);
const face = (h, x, z) => { h.root.rotation.y = Math.atan2(x - h.root.position.x, z - h.root.position.z); };
const _q = new THREE.Quaternion(), UP = V(0, 1, 0);
function hold(prop, h, side, dir, along = 0) {   // put a prop in a fist, its +Y along dir (world)
  const p = h.j[side + 'Wr'].localToWorld(V(0, -0.07, 0.0));
  const d = dir.clone().normalize();
  prop.position.copy(p).addScaledVector(d, along); prop.quaternion.setFromUnitVectors(UP, d);
}
const handPos = (h, side) => h.j[side + 'Wr'].localToWorld(V(0, -0.07, 0));

// ---------- the world ----------
function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 7, sunDir: [-4, 9, 5], sun: 2.4 });
  const u = scene.userData.sky.material.uniforms;
  const SKY = { top: new THREE.Color(0x2f7fd8), mid: new THREE.Color(0x67aeea), horizon: new THREE.Color(0xc3e0f5), floorC: new THREE.Color(0xa9c48a) };
  scene.fog = new THREE.Fog(0xc3dcef, 45, 150);
  const key = scene.userData.key;
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xd6ecff); hemi.groundColor.set(0x6f8a4a); hemi.intensity = 0.85;
  scene.add(world());
  scene.add(grass(6000, [-14, -26, 58, 12], [[RIVER_X - 2, -60, RIVER_X + 2, 30], [FIELD[0] - 0.2, FIELD[1], FIELD[2] + 0.2, FIELD[3] + 0.2], [PEN[0], PEN[1], PEN[2], PEN[3]]]));
  const R = river(RIVER_X); scene.add(R);
  // clouds
  const cloudT = glowTexture('rgba(255,255,255,0.95)', 'rgba(255,255,255,0)'), r = rng(19);
  const clouds = [];
  for (let i = 0; i < 26; i++) { const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudT, transparent: true, depthWrite: false, fog: false, opacity: 0.75 })); c.position.set(-40 + r() * 110, 26 + r() * 16, -90 - r() * 30); c.scale.set(18 + r() * 16, 6 + r() * 4, 1); c.userData.x0 = c.position.x; clouds.push(c); scene.add(c); }
  // trees + rocks dressing
  const treeSpots = [[-5, -6], [-7.5, -3], [4.5, -7], [-3, -14], [7, -11], [13.5, -8], [18, -9], [9, -6.5], [24.5, -7], [28, -6.2], [-9, 2], [30.5, -10], [47, -3], [53, -12], [45.5, 3.5], [-4.2, 3.8],];
  treeSpots.forEach(([x, z], i) => { const t = tree({ h: 2.6 + (i * 0.37) % 1.4, seed: i + 5, col: [0x4f8f3a, 0x5c9a3f, 0x3f7f35][i % 3] }); t.position.set(x, 0, z); scene.add(t); });
  const ft = tree({ h: 2.6, seed: 2 }); ft.position.copy(TREE); scene.add(ft);
  const fm = new THREE.MeshStandardMaterial({ color: 0xe0302a, roughness: 0.35 });
  const FRUITS = [[-0.5, 1.82, 0.62], [0.05, 1.72, 0.78], [-0.75, 1.55, 0.45], [0.45, 1.95, 0.6], [-0.2, 2.1, 0.7], [0.65, 1.6, 0.5], [-0.95, 1.9, 0.2]].map(p => { const f = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), fm); f.castShadow = true; f.position.copy(TREE).add(V(...p)); scene.add(f); return f; });
  const F0 = FRUITS.map(f => f.position.clone());
  [[1.3, -0.5, 1.0], [-1.6, -1.3, 0.8], [3.4, -3.0, 1.3], [12.6, 0.6, 0.6], [18.3, -0.4, 0.7], [26.0, -3.6, 1.1], [35.2, 2.4, 0.8], [-2.4, 1.2, 0.6]].forEach(([x, z, s], i) => { const k = rock(s, 30 + i); k.position.set(x, 0, z); scene.add(k); });
  const seat = rock(1.0, 7, 0x8f8a80); seat.position.copy(ROCK); seat.scale.set(1.2, 0.85, 1); scene.add(seat);

  // ---------- cast ----------
  const hero = makeHuman('hide', { chestText: 'MR. CLOUD', shirt: 0x9a6a3c }); scene.add(hero.root);
  const SK = [0xe0ac69, 0xc68642, 0x8d5524, 0xf1c27d, 0xd99b7a];
  const person = (i, o = {}) => { const h = makeHuman('hide', { shirt: [0x8a5a34, 0xb08850, 0x6f4a2e, 0xa77b4f, 0x7d5a3c][i % 5], skin: SK[i % SK.length], hair: [0x2b1d14, 0x3a2618, 0x111111, 0x4a3020][i % 4], ...o }); scene.add(h.root); return h; };
  const G = person(0, { long: true, beard: false }), FI = person(1), W = person(2, { long: true, beard: false }), B = person(3), T = person(4), C = person(5, { long: true, beard: false });
  const MOMh = person(6, { long: true, beard: false }), KIDh = person(7, { beard: false }); KIDh.root.scale.setScalar(0.6);
  const FA = person(8), HD = person(9, { long: true, beard: false });
  const VIL = [person(10), person(11, { long: true, beard: false }), person(12), person(13, { long: true, beard: false })];

  // props
  const hSpear = spear(1.75); scene.add(hSpear);
  const fSpear = spear(1.7); scene.add(fSpear);
  const bsk = basket(); bsk.position.copy(BASKET); scene.add(bsk);
  const grd = gourd(); scene.add(grd);
  const fishM = fish(); scene.add(fishM);
  const tn = tent(); tn.position.copy(TENT); scene.add(tn);
  const mallet = stoneAxe(); scene.add(mallet);
  const core = rock(0.22, 77, 0x6c7075); scene.add(core);
  const axe = stoneAxe(); scene.add(axe);
  const fire = campfire(); fire.position.copy(FIRE); scene.add(fire);
  const tch = torch(); scene.add(tch);
  const hoe = stoneAxe(); scene.add(hoe);
  const hAxe = stoneAxe(); hAxe.scale.setScalar(1.3); scene.add(hAxe);
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.4, 14), new THREE.MeshStandardMaterial({ color: 0x8a6a44, roughness: 0.9 })); log.position.copy(HE).add(V(0.05, 0.2, 0.62)); log.castShadow = log.receiveShadow = true; scene.add(log);
  const logTop = new THREE.Mesh(new THREE.CircleGeometry(0.2, 14), new THREE.MeshStandardMaterial({ color: 0xd8b98a })); logTop.rotation.x = -Math.PI / 2; logTop.position.copy(log.position).add(V(0, 0.201, 0)); scene.add(logTop);
  // animals
  const herd = [[-3.5, -11], [-1.0, -12.5], [2.0, -10.5], [4.2, -13]].map(([x, z], i) => { const d = quadruped('deer', i); d.position.set(x, 0, z); d.rotation.y = 0.8 + i; scene.add(d); return d; });
  const deer = DEER0.map((p, i) => { const d = quadruped('deer', 10 + i); d.position.copy(p); d.rotation.y = -1.9; scene.add(d); return d; });
  const wolves = WOLF0.map((p, i) => { const w = quadruped('wolf', 20 + i); w.scale.setScalar(1.35); w.position.copy(p); scene.add(w); return w; });
  const stock = [];
  for (let i = 0; i < 7; i++) { const a = quadruped(i % 2 ? 'sheep' : 'goat', 30 + i); a.userData.home = V(PEN[0] + 0.7 + (i % 4) * 0.95, 0, PEN[1] + 0.9 + Math.floor(i / 4) * 1.4 + (i % 2) * 0.3); a.position.copy(a.userData.home); a.rotation.y = (i * 1.7) % 6.28; scene.add(a); stock.push(a); }
  // farming
  const field = wheat(FIELD, 1700); scene.add(field);
  scene.add(fence([[PEN[0], PEN[3]], [PEN[0] + 1.7, PEN[3]]]), fence([[PEN[0] + 2.7, PEN[3]], [PEN[2], PEN[3]], [PEN[2], PEN[1]], [PEN[0], PEN[1]], [PEN[0], PEN[3]]]));
  // village
  const rv = rng(55), houses = [];
  const HS = [[34.5, -12.5], [37.5, -14], [40.8, -12.8], [44.2, -11.5], [47.5, -9.5], [46.2, -6.0], [49.8, -13.5], [43.0, -16.5], [36.2, -18.0], [39.8, -19.5], [46.5, -18.2], [51.5, -7.5], [33.0, -16.0], [50.5, -19.0]];
  HS.forEach(([x, z], i) => { const h = house(i + 1); h.position.set(x, 0, z); h.userData.d = Math.hypot(x - 42, z + 13); scene.add(h); houses.push(h); });
  const smokes = [0, 2, 4, 7, 9, 11].map(i => { const s = smoke(9, i); s.position.copy(houses[i].position).add(V(0, 2.6, 0)); scene.add(s); return s; });
  const fireSmoke = smoke(8, 99); fireSmoke.position.copy(FIRE).add(V(0, 1.0, 0)); scene.add(fireSmoke);

  // FX
  const fx = { chips: [burst(0xb9bcc0, 30, 1), burst(0xb9bcc0, 30, 2), burst(0xb9bcc0, 30, 3)], splash: burst(0xd8f0ff, 70, 4), water: burst(0xbfe8ff, 50, 5), torch: burst(0xffb347, 80, 6), dust: [burst(0xd9c49a, 40, 7), burst(0xd9c49a, 40, 8)], gold: burst(0xffe14d, 90, 9), wood: [burst(0xd8b98a, 30, 10), burst(0xd8b98a, 30, 11), burst(0xd8b98a, 30, 12), burst(0xd8b98a, 30, 13), burst(0xd8b98a, 30, 14), burst(0xd8b98a, 30, 15), burst(0xd8b98a, 30, 16)], pop: stock.map((_, i) => burst(0xffffff, 24, 40 + i)), spearHit: burst(0xc9b48a, 40, 17) };
  const allFx = []; for (const v of Object.values(fx)) (Array.isArray(v) ? v : [v]).forEach(f => { scene.add(f); allFx.push(f); });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.26, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false })); scene.add(ring);
  const sparkle = glowSprite(0xcff4ff, 0.5); scene.add(sparkle);
  const torchGlow = glowSprite(0xffa040, 2.5); scene.add(torchGlow);
  const torchLight = new THREE.PointLight(0xff9a40, 0, 7, 1.5); scene.add(torchLight);
  const icons = [ICONS.job(), ICONS.office(), ICONS.money()].map(tx => { const b = iconBubble(tx); scene.add(b); return b; });
  const nope = stamp('NOPE!', '#ff2a2a', 0.6); scene.add(nope);
  const ftj = stamp('FULL-TIME JOB', '#ffd23f', 0.7); scene.add(ftj);
  const card = infoCard(); scene.add(card);
  const sun = sunDisc(); scene.add(sun);
  const c = cam(38);
  const KEYC = new THREE.Color(0xfff3e6);
  const HU = {};

  return {
    scene, camera: c,
    update(t) {
      R.update(t);
      // ================= HERO =================
      // hook: stand with spear, sit 6.45-7.0, spring up 9.1, run 9.35-11.55, throw 11.85
      const sitK = smooth(range(t, 6.45, 7.05)) * (1 - smooth(range(t, 9.05, 9.35)));
      const runStart = 9.3, runEnd = 11.55;
      let hp = H0.clone(), hpose, hdir = 0;
      if (t < runStart) {
        hp.z = lerp(0, -0.28, sitK);
        hpose = mix(STAND(t), over(SIT, { spine: [-0.18, 0, 0], neck: [-0.05, 0.25, 0], lSh: [0.5, 0, 0.5], rSh: [0.45, 0, -0.5], lEl: [-0.2, 0, 0], rEl: [-0.2, 0, 0], chest: [Math.sin(t * 1.4) * 0.02, 0, 0] }), sitK);
        // yawn/stretch while sitting
        const yawn = smooth(range(t, 7.5, 7.9)) * (1 - smooth(range(t, 8.45, 8.8)));
        hpose.lSh = hpose.lSh.map((v, i) => lerp(v, [-2.6, 0, 0.5][i], yawn)); hpose.rSh = hpose.rSh.map((v, i) => lerp(v, [-2.6, 0, -0.5][i], yawn));
        hpose.lEl = [lerp(hpose.lEl[0], -1.6, yawn), 0, 0]; hpose.rEl = [lerp(hpose.rEl[0], -1.6, yawn), 0, 0];
        hero.setMouth(0.6 * yawn);
        if (t < 6.45) { hpose.rSh = [-0.25, 0, -0.25]; hpose.rEl = [-0.9, 0, 0]; hero.setMouth(0); }
        // spring up: crouch then pop
        const pre = smooth(range(t, 9.05, 9.3));
        if (pre > 0) hpose = mix(hpose, over(STAND(t), { drop: -0.12, spine: [0.3, 0, 0], lHip: [-0.4, 0, 0.07], rHip: [-0.4, 0, -0.07], lKn: [0.7, 0, 0], rKn: [0.7, 0, 0], rSh: [-0.6, 0, -0.2], rEl: [-1.0, 0, 0] }), pre);
        hdir = lerp(0, 0.5, sitK * 0) + (t > 9.05 ? smooth(range(t, 9.05, 9.3)) * Math.atan2(HUNT_END.x, HUNT_END.z) : 0);
      } else if (t < runEnd + 0.05) {
        const k = range(t, runStart, runEnd), e = k < 0.15 ? k * k / 0.3 : k > 0.85 ? 1 - (1 - k) ** 2 / 0.3 - 0.0 : (k - 0.075) * 1;
        const ek = clamp(easeInOut(k) * 0.35 + k * 0.65);
        hp = H0.clone().lerp(HUNT_END, ek);
        const dist = H0.distanceTo(HUNT_END) * ek;
        hpose = RUN(dist / 1.7 * Math.PI * 2, 1 - 0.6 * smooth(range(k, 0.88, 1)));
        hdir = Math.atan2(HUNT_END.x, HUNT_END.z);
        hpose.rSh = [-0.5, 0, -0.2]; hpose.rEl = [-1.2, 0, 0];
      } else {
        hp = HUNT_END.clone();
        const wind = smooth(range(t, 11.5, 11.78)), rel = smooth(range(t, 11.82, 11.95)), rec = smooth(range(t, 12.4, 12.9));
        hdir = Math.atan2(DEER0[0].x + 1.4 - hp.x, DEER0[0].z - 1.0 - hp.z);
        hpose = over(STAND(t), { lHip: [-0.5, 0, 0.1], lKn: [0.4, 0, 0], rHip: [0.35, 0, -0.1], rKn: [0.2, 0, 0], drop: -0.05,
          rSh: [lerp(lerp(-0.5, -2.9, wind), -1.4, rel), 0, -0.25], rEl: [lerp(lerp(-1.2, -1.4, wind), -0.1, rel), 0, 0],
          lSh: [lerp(-1.3, 0.4, rel), 0, 0.3], lEl: [-0.4, 0, 0], spine: [lerp(-0.25 * wind, 0.35, rel), lerp(0.5 * wind, -0.3, rel), 0], neck: [-0.1, 0, 0] });
        hpose = mix(hpose, over(STAND(t), { lSh: [-0.3, 0, 0.3], rSh: [-0.6, 0, -0.25], rEl: [-0.4, 0, 0] }), rec * 0.6);
      }
      // protect beat + ending: the hero is elsewhere (off camera between)
      if (t > 13.6 && t < 22.9) {
        hp = PROT.clone(); hdir = Math.atan2(WOLF1[0].x - PROT.x, WOLF1[0].z - PROT.z) - 0.25;
        const step = smooth(range(t, 20.5, 21.0)), th = smooth(range(t, 21.5, 21.75)) * (1 - smooth(range(t, 22.1, 22.6)));
        hp.add(V(0.35, 0, -0.25).multiplyScalar(step));
        hpose = over(STAND(t), { lHip: [-0.35 * step, 0, 0.12], lKn: [0.3 * step, 0, 0], rHip: [0.3 * step, 0, -0.1], drop: -0.06 * step,
          rSh: [lerp(-1.4, -2.2, th), 0, -0.35], rEl: [lerp(-0.6, -0.05, th), 0, 0], lSh: [-0.7, 0, 0.7], lEl: [-0.3, 0, 0], spine: [0.1 + 0.15 * th, 0, 0], neck: [-0.05, 0, 0] });
      }
      if (t >= 22.9) {
        hp = HE.clone(); hdir = 0.1;
        const tl = range(t, 31.1, 33.3), ph = t < 31.1 ? (t - 29) / 1.05 : t < 33.3 ? (31.1 - 29) / 1.05 + (t - 31.1) / 0.38 : (31.1 - 29) / 1.05 + 2.2 / 0.38 + (t - 33.3) / 1.05;
        const sw = Math.pow(0.5 - 0.5 * Math.cos(ph * Math.PI * 2), 1.6);   // 0 = up, 1 = strike
        const stop = smooth(range(t, 33.35, 33.75));
        hpose = over(STAND(t), { lHip: [-0.25, 0, 0.16], rHip: [0.1, 0, -0.16], lKn: [0.25, 0, 0], rKn: [0.15, 0, 0], drop: -0.07,
          lSh: [lerp(-2.7, -1.15, sw), 0, 0.12], rSh: [lerp(-2.7, -1.15, sw), 0, -0.12], lEl: [lerp(-1.2, -0.2, sw), 0, 0], rEl: [lerp(-1.2, -0.2, sw), 0, 0], spine: [lerp(-0.1, 0.45, sw), 0, 0], neck: [lerp(0.0, 0.25, sw), 0, 0] });
        hpose = mix(hpose, over(STAND(t), { lSh: [-2.35, 0.3, 0.45], lEl: [-2.1, 0, 0], rSh: [0.05, 0, -0.2], rEl: [-0.2, 0, 0], neck: [-0.12, 0.15, 0], chest: [-0.06 + Math.sin(t * 3) * 0.02, 0, 0] }), stop);
        HU.sw = sw; HU.ph = ph; HU.stop = stop;
      }
      hero.root.position.copy(hp); hero.root.rotation.y = hdir; hero.setPose(hpose);
      if (t > 9.3) hero.setMouth(t > 11.82 && t < 12.1 ? 0.5 : t > 21.5 && t < 22.0 ? 0.6 : 0.05);
      hero.root.visible = !(t > 13.0 && t < 13.6) && !(t > 22.6 && t < 22.9);
      scene.updateMatrixWorld(true);
      // hero props
      hSpear.visible = t < 22.9;
      if (t < 6.6 || (t > 9.25 && t < 11.86)) {
        const run = t > 9.3 ? V(Math.sin(hdir), 0.35, Math.cos(hdir)) : t > 9.05 ? V(Math.sin(hdir) * 0.6, 1, Math.cos(hdir) * 0.6) : V(0.05, 1, 0.08);
        hold(hSpear, hero, 'r', run, 0.12);
      } else if (t <= 9.25) { hSpear.position.copy(ROCK).add(V(0.62, 0.78, 0.15)); hSpear.quaternion.setFromUnitVectors(UP, V(-0.25, 1, 0.12).normalize()); }
      else { // thrown at 11.86, lands 12.3 (just misses the bolting deer)
        const k = range(t, 11.86, 12.3), A = HUNT_END.clone().add(V(0.25, 1.55, -0.1)), Bp = V(DEER0[0].x + 1.15, 0.35, DEER0[0].z - 0.95);
        const p = A.clone().lerp(Bp, k); p.y += Math.sin(k * Math.PI) * 0.7;
        const d = Bp.clone().sub(A).normalize(); d.y += lerp(0.35, -0.55, k);
        hSpear.position.copy(p); hSpear.quaternion.setFromUnitVectors(UP, d.normalize());
      }
      fx.spearHit.position.set(DEER0[0].x + 1.15, 0.05, DEER0[0].z - 0.95); fx.spearHit.update(t - 12.3);
      // ---- hook icons + card ----
      const icX = [-0.74, 0, 0.74], icT = [3.51, 4.26, 5.41];
      icons.forEach((b, i) => {
        const k = easeOut(range(t, icT[i], icT[i] + 0.25)) * (1 - smooth(range(t, 6.0, 6.35))), pop = 1 + 0.15 * Math.sin(clamp(range(t, icT[i], icT[i] + 0.4)) * Math.PI);
        b.position.set(icX[i], 2.62 + Math.sin(t * 2 + i) * 0.03, 0.2); b.set(k * 0.6 * pop, smooth(range(t, icT[i] + 0.3, icT[i] + 0.45)));
      });
      // ---- deer: graze, then bolt at 11.45 ----
      deer.forEach((d, i) => {
        const bolt = t - 11.62 - i * 0.06, dirv = V(0.45, 0, -1).normalize();
        if (bolt > 0) { const s = bolt * 4.5 + bolt * bolt * 1.5; d.position.copy(DEER0[i]).addScaledVector(dirv, s); d.rotation.y = lerp(-1.9, Math.atan2(dirv.x, dirv.z), smooth(range(bolt, 0, 0.25))); d.pose(t, { run: smooth(range(bolt, 0, 0.15)), freq: 11 }); }
        else d.pose(t, { graze: t > 11.35 ? 1 - smooth(range(t, 11.35, 11.55)) : 0.9 + Math.sin(t * 2 + i) * 0.1 });
        d.visible = bolt < 2.2;
      });
      fx.dust[0].position.copy(DEER0[0]); fx.dust[0].update(t - 11.65); fx.dust[1].position.copy(DEER0[1]); fx.dust[1].update(t - 11.71);
      herd.forEach((d, i) => d.pose(t, { graze: 0.6 + Math.sin(t * 0.8 + i * 2) * 0.4 }));

      // ================= GATHER =================
      G.root.position.copy(GATH); face(G, TREE.x, TREE.z);
      const picks = [[12.5, 12.95, 0], [13.05, 13.5, 1]];
      let reach = 0, carry = -1, carryK = 0;
      picks.forEach(([a, b, fi]) => { const k1 = range(t, a, a + 0.25), k2 = range(t, a + 0.25, b); if (t > a && t < b) { reach = k1 < 1 ? smooth(k1) : 1 - smooth(k2); carry = fi; carryK = k2; } });
      G.setPose(over(STAND(t, 1), { neck: [-0.35, 0, 0], spine: [-0.08, 0, 0], lSh: [-0.6, 0, 0.3], lEl: [-1.1, 0, 0] }));
      scene.updateMatrixWorld(true);
      const shG = G.j.rSh.getWorldPosition(V(0, 0, 0));
      FRUITS.forEach((f, i) => {
        const pk = picks.find(p => p[2] === i);
        if (!pk) return;
        if (t < pk[0] + 0.25) f.position.copy(F0[i]);
        else if (t < pk[1]) { const hp2 = handPos(G, 'r'), k = smooth(range(t, pk[0] + 0.25, pk[1])); f.position.copy(F0[i].clone().lerp(hp2, 1)); if (k > 0.55) f.position.lerp(BASKET.clone().add(V(0.0, 0.2, 0)), smooth((k - 0.55) / 0.45)); }
        else f.position.copy(BASKET).add(V(i ? 0.06 : -0.05, 0.16, i ? -0.03 : 0.04));
      });
      if (reach > 0.01 || carry >= 0) {
        const tgt = carry >= 0 ? (carryK < 0.01 ? F0[carry] : F0[carry].clone().lerp(BASKET.clone().add(V(0, 0.45, 0)), smooth(carryK))) : F0[0];
        const cur = shG.clone().add(V(0.1, -0.55, 0.1)).lerp(tgt, reach > 0.99 ? 1 : Math.max(reach, carryK > 0 ? 1 : 0));
        ikArm(G, 'r', cur, shG.clone().add(V(0.4, -0.4, 0.2)), V(0, 0, 1));
      }
      // ================= FISH =================
      FI.root.position.copy(FISHER); face(FI, FISHER.x + 0.5, FISHER.z + 1.2);
      const th = smooth(range(t, 13.6, 13.86)) * (1 - smooth(range(t, 13.95, 14.35))), up = smooth(range(t, 13.95, 14.35));
      FI.setPose(over(STAND(t, 2), { drop: -0.08, lKn: [0.25, 0, 0], rKn: [0.25, 0, 0], lHip: [-0.25, 0, 0.12], rHip: [-0.1, 0, -0.12], spine: [0.25 + th * 0.25, 0, 0], neck: [0.35, 0, 0],
        rSh: [lerp(lerp(-1.6, -2.4, smooth(range(t, 13.2, 13.6))), -0.9, th) + up * -0.9, 0, -0.15], rEl: [lerp(-1.0, -0.1, th), 0, 0], lSh: [lerp(-1.2, -0.7, th) - up * 0.6, 0, 0.1], lEl: [-0.9, 0, 0] }));
      scene.updateMatrixWorld(true);
      const fdir = V(0.25, -1, 0.55).applyAxisAngle(UP, FI.root.rotation.y * 0).normalize();
      const fwdFI = V(Math.sin(FI.root.rotation.y), 0, Math.cos(FI.root.rotation.y));
      const sdir = fwdFI.clone().multiplyScalar(0.55).add(V(0, lerp(-1, -0.2, up) - 0.1 * (1 - th) * (1 - up), 0)).normalize();
      hold(fSpear, FI, 'r', sdir, 0.35);
      const tip = fSpear.position.clone().addScaledVector(sdir, 0.85 + 0.07);
      fishM.visible = t > 13.86; fishM.position.copy(tip).addScaledVector(sdir, -0.12); fishM.quaternion.setFromUnitVectors(V(0, 0, 1), V(-sdir.z, 0, sdir.x).normalize()); fishM.rotateZ(Math.sin(t * 25) * 0.25 * (t < 14.8 ? 1 : 0.3));
      fx.splash.position.copy(FISHER).add(fwdFI.clone().multiplyScalar(0.55)).setY(0.05); fx.splash.update(t - 13.86);
      // ================= WATER =================
      W.root.position.copy(WATERW); W.root.rotation.y = -Math.PI / 2 - 0.25;
      const dip = smooth(range(t, 14.95, 15.25)) * (1 - smooth(range(t, 15.55, 15.9)));
      W.setPose(over(KNEEL, { spine: [0.35 + dip * 0.35, 0, 0], neck: [0.25, 0, 0], chest: [0.05, 0, 0], rSh: [lerp(-0.9, -0.8, dip) - (1 - dip) * smooth(range(t, 15.6, 15.9)) * 0.7, 0, -0.1], rEl: [lerp(-0.6, -0.05, dip), 0, 0], lSh: [-0.5, 0, 0.25], lEl: [-0.9, 0, 0] }));
      scene.updateMatrixWorld(true);
      hold(grd, W, 'r', V(0, 1, 0), -0.05);
      ring.position.set(RIVER_X + 1.0, 0.045, WATERW.z - 0.1); const rk = range(t, 15.2, 16.0); ring.scale.setScalar(1 + rk * 4); ring.material.opacity = t > 15.2 && t < 16 ? (1 - rk) * 0.8 : 0;
      fx.water.position.copy(grd.position); fx.water.update(t - 15.6);
      sparkle.position.copy(grd.position).add(V(0, 0.2, 0)); sparkle.material.opacity = Math.max(0, Math.sin(clamp(range(t, 15.6, 16.3)) * Math.PI)) * 0.9; sparkle.scale.setScalar(0.35 + Math.sin(t * 20) * 0.05);
      // ================= SHELTER =================
      tn.build(smooth(range(t, 16.85, 17.85)));
      B.root.position.copy(BUILDER); face(B, TENT.x + 0.6, TENT.z + 0.4);
      const bh = Math.max(0, Math.sin((t - 16.85) * 9)) * (t > 16.85 && t < 17.9 ? 1 : 0);
      B.setPose(over(STAND(t, 3), { spine: [0.15, 0, 0], rSh: [lerp(-2.4, -1.3, bh), 0, -0.2], rEl: [lerp(-1.3, -0.3, bh), 0, 0], lSh: [-1.3, 0, 0.1], lEl: [-0.5, 0, 0], lHip: [-0.3, 0, 0.1], rHip: [0.2, 0, -0.1] }));
      scene.updateMatrixWorld(true);
      hold(mallet, B, 'r', V(Math.sin(B.root.rotation.y), 0.6, Math.cos(B.root.rotation.y)).normalize(), 0.0);
      // ================= TOOLS =================
      T.root.position.copy(TOOLM); T.root.rotation.y = 0.35;
      const strikes = [17.95, 18.22, 18.48], sp = strikes.reduce((m, s) => Math.max(m, Math.exp(-Math.abs(t - s) * 14)), 0);
      const raise = smooth(range(t, 18.62, 18.9));
      T.setPose(over(KNEEL, { spine: [0.3 - raise * 0.3, 0, 0], neck: [0.45 - raise * 0.5, 0, 0], lSh: [-0.75, 0, 0.15], lEl: [-0.9, 0, 0], rSh: [lerp(lerp(-1.6, -0.75, sp), -2.6, raise), 0, -0.15], rEl: [lerp(lerp(-1.4, -0.7, sp), -0.3, raise), 0, 0] }));
      scene.updateMatrixWorld(true);
      core.position.copy(handPos(T, 'l')).add(V(0, 0.04, 0)); core.visible = raise < 0.5;
      axe.visible = t > 18.6; hold(axe, T, 'r', V(0, 1, 0.2), 0.0);
      const mrock = new THREE.Vector3(); mrock.copy(handPos(T, 'r')); mallet.userData.t = mrock;
      fx.chips.forEach((f, i) => { f.position.copy(core.position); f.update(t - strikes[i]); });
      // ================= FOOD =================
      const fk = 0.75 + 0.25 * smooth(range(t, 18.85, 19.2));
      fire.update(t, fk); fireSmoke.update(t, 0.6);
      C.root.position.copy(COOK); face(C, FIRE.x, FIRE.z);
      C.setPose(over(CROUCH, { neck: [0.1, 0, 0], lSh: [-0.6, 0, 0.3], lEl: [-1.2, 0, 0], rSh: [-1.1, 0, -0.1], rEl: [-0.4, 0, 0] }));
      scene.updateMatrixWorld(true);
      { const sh = C.j.rSh.getWorldPosition(V(0, 0, 0)), a = t * 1.2; ikArm(C, 'r', FIRE.clone().add(V(0.72, 0.78 + Math.sin(a) * 0.06, Math.cos(a) * 0.06)), sh.clone().add(V(0.3, -0.5, 0.3)), V(0, 0, 1)); }
      // ================= PROTECT =================
      MOMh.root.position.copy(MOM); face(MOMh, WOLF1[0].x, WOLF1[0].z);
      KIDh.root.position.copy(KID); face(KIDh, WOLF1[0].x, WOLF1[0].z);
      const fear = smooth(range(t, 20.3, 20.7)) * (1 - smooth(range(t, 22.2, 22.7)));
      MOMh.setPose(over(STAND(t, 4), { spine: [-0.1 * fear, 0, 0], lSh: [-0.9 * fear, 0, 0.4], lEl: [-1.3 * fear, 0, 0], rSh: [-0.4 * fear, 0, -0.3], neck: [-0.05, 0, 0] }));
      KIDh.setPose(over(STAND(t * 1.3, 5), { lSh: [-0.6 * fear, 0, 0.5], rSh: [-0.6 * fear, 0, -0.5], lEl: [-1.4 * fear, 0, 0], rEl: [-1.4 * fear, 0, 0], neck: [-0.15 * fear, 0, 0] }));
      MOMh.setMouth(0.3 * fear); KIDh.setMouth(0.4 * fear);
      wolves.forEach((w, i) => {
        const appr = smooth(range(t, 19.6, 20.9)), flee = t - 21.85 - i * 0.08, snarl = smooth(range(t, 20.85, 21.1)) * (flee > 0 ? 0 : 1);
        const away = V(0.75, 0, -0.66).normalize();
        if (flee <= 0) { w.position.copy(WOLF0[i]).lerp(WOLF1[i], appr); w.rotation.y = Math.atan2(WOLF1[i].x - WOLF0[i].x, WOLF1[i].z - WOLF0[i].z) * (1 - snarl) + Math.atan2(PROT.x - w.position.x, PROT.z - w.position.z) * snarl; w.pose(t, { run: appr < 1 ? 0.45 : 0, freq: 7, snarl: snarl * (1 + 0.15 * Math.sin(t * 30)) }); }
        else { const s = flee * 3.5 + flee * flee * 2; w.position.copy(WOLF1[i]).addScaledVector(away, s); w.rotation.y = Math.atan2(away.x, away.z); w.pose(t, { run: 1, freq: 12 }); }
        w.visible = t > 19.0 && t < 23.5;
      });
      tch.visible = t > 13.6 && t < 22.9;
      if (tch.visible) { hold(tch, hero, 'r', V(Math.sin(hdir) * 0.5, 1, Math.cos(hdir) * 0.5).normalize(), 0.12); }
      const flare = Math.exp(-Math.max(0, t - 21.62) * 3) * (t > 21.62 ? 1 : 0);
      tch.userData.flame.update(t, 1 + flare * 1.5);
      scene.updateMatrixWorld(true);
      const ft2 = tch.localToWorld(V(0, 0.45, 0));
      torchGlow.position.copy(ft2); torchGlow.material.opacity = tch.visible ? 0.55 + flare * 0.45 : 0; torchGlow.scale.setScalar(1.6 + flare * 2.5);
      torchLight.position.copy(ft2); torchLight.intensity = tch.visible ? 1.5 + flare * 5 : 0;
      fx.torch.position.copy(ft2); fx.torch.update(t - 21.62);
      // ================= FARMING =================
      const till = smooth(range(t, 23.0, 24.2));
      field.soil.scale.x = Math.max(0.001, till); field.soil.position.x = FIELD[0] + (FIELD[2] - FIELD[0]) * till / 2;
      field.update(t, smooth(range(t, 24.85, 25.95)), smooth(range(t, 26.6, 28.4)));
      FA.root.position.copy(FARMER); FA.root.rotation.y = Math.PI / 2 + 0.45;
      const hs = Math.pow(0.5 - 0.5 * Math.cos((t - 22.9) * Math.PI * 2 / 0.75), 1.5);
      FA.setPose(over(STAND(t, 6), { spine: [lerp(0.0, 0.4, hs), 0, 0], lHip: [-0.35, 0, 0.12], lKn: [0.3, 0, 0], drop: -0.05, lSh: [lerp(-2.4, -0.9, hs), 0, 0.1], rSh: [lerp(-2.4, -0.9, hs), 0, -0.1], lEl: [lerp(-1.0, -0.2, hs), 0, 0], rEl: [lerp(-1.0, -0.2, hs), 0, 0], neck: [0.25, 0, 0] }));
      scene.updateMatrixWorld(true);
      { const fw = V(Math.sin(FA.root.rotation.y), 0, Math.cos(FA.root.rotation.y)); hold(hoe, FA, 'r', fw.clone().multiplyScalar(lerp(0.2, 1, hs)).add(V(0, lerp(1, -0.2, hs), 0)).normalize(), 0.12); }
      // ================= LIVESTOCK =================
      stock.forEach((a, i) => {
        const tin = 26.05 + i * 0.09, k = easeOut(range(t, tin, tin + 0.3));
        a.visible = t > tin; a.scale.setScalar(Math.max(0.001, k)); a.position.copy(a.userData.home); a.position.y = Math.max(0, Math.sin(clamp(range(t, tin, tin + 0.45)) * Math.PI) * 0.25);
        a.pose(t + i, { graze: 0.5 + 0.5 * Math.sin(t * 1.3 + i * 2) });
        fx.pop[i].position.copy(a.userData.home).add(V(0, 0.4, 0)); fx.pop[i].update(t - tin);
      });
      HD.root.position.copy(HERDER); HD.root.rotation.y = Math.PI;
      const thr = Math.max(0, Math.sin((t - 25.9) * 7));
      HD.setPose(over(STAND(t, 7), { rSh: [lerp(-0.8, -1.6, thr), 0, -0.2], rEl: [-0.5, 0, 0], lSh: [-0.9, 0, 0.2], lEl: [-1.4, 0, 0] }));
      // ================= VILLAGE =================
      houses.forEach(h => { const tin = 27.15 + h.userData.d * 0.08; h.build(easeOut(range(t, tin, tin + 0.75))); h.visible = t > tin; });
      smokes.forEach((s, i) => s.update(t, smooth(range(t, 28.2 + i * 0.1, 28.9 + i * 0.1))));
      const vpos = [[39.5, -8.5, 1], [44.5, -9.0, -1], [41.0, -15.5, 1], [47.8, -12.0, -1]];
      VIL.forEach((h, i) => {
        const [x, z, d] = vpos[i], dist = (t - 26) * 1.0;
        h.root.position.set(x + d * dist * 0.8, 0, z + Math.sin(dist * 0.3) * 0.4); h.root.rotation.y = d > 0 ? Math.PI / 2 : -Math.PI / 2;
        h.setPose(WALK(dist / 1.1 * Math.PI * 2)); h.root.visible = t > 26.5;
      });
      // hide far actors when nowhere near the camera (speed)
      const near = (x) => Math.abs(x - track(t)[1].x) < 18;
      [G, FI, W, B, T, C, MOMh, KIDh, FA, HD].forEach(h => { h.root.visible = near(h.root.position.x); });
      // ================= ENDING: CHOP + TIME-LAPSE =================
      hAxe.visible = t > 22.9;
      if (hAxe.visible) { const d = V(0, lerp(1, 0.15, HU.sw || 0), lerp(-0.25, 1, HU.sw || 0)).normalize(); hold(hAxe, hero, 'r', d, 0.12); }
      // wood chips at each strike
      const STRK = [30.575, 31.29, 31.67, 32.05, 32.43, 32.81, 33.19];
      fx.wood.forEach((f, i) => { const st = STRK[i]; f.position.copy(log.position).add(V(0, 0.22, 0)); f.update(t - (st ?? 99)); });
      // sun + sky time-lapse 31.1 -> 33.3, ending at golden hour
      const tl = smooth(range(t, 31.1, 33.3));
      const ang = lerp(0.85, 0.85, 0) + (t < 31.1 ? 0 : 0);
      const sunA = t < 31.1 ? 1.15 : lerp(0.08, Math.PI - 0.12, tl);   // angle above east horizon
      const SUN = V(Math.cos(sunA) * -0.2, Math.sin(sunA) * 0.55, -1).normalize(), LDIR = V(Math.cos(sunA) * -1, Math.max(0.25, Math.sin(sunA)), 0.6).normalize();
      clouds.forEach((cl, i) => { cl.position.x = cl.userData.x0 + tl * (30 + (i % 5) * 6); });
      const dawn = t < 31.1 ? 0 : Math.max(0, 1 - Math.sin(sunA) * 1.5);
      const SC = { top: new THREE.Color(0x2f7fd8).lerp(new THREE.Color(0x3a3f7a), dawn * 0.7), mid: SKY.mid.clone().lerp(new THREE.Color(0xf29a6b), dawn * 0.8), horizon: SKY.horizon.clone().lerp(new THREE.Color(0xffc27a), dawn) };
      u.top.value.copy(SC.top); u.mid.value.copy(SC.mid); u.horizon.value.copy(SC.horizon); u.floorC.value.copy(SKY.floorC);
      scene.fog.color.copy(SC.horizon).lerp(new THREE.Color(0xc3dcef), 0.3);
      const [cp, lk] = track(t);
      key.color.copy(KEYC).lerp(new THREE.Color(0xff7a30), dawn); hemi.color.set(0xd6ecff).lerp(new THREE.Color(0xffb27a), dawn); hemi.intensity = 0.85 - 0.3 * dawn; key.intensity = 2.4 * (0.55 + 0.45 * Math.min(1, Math.sin(sunA) * 2));
      key.target.position.copy(lk); key.position.copy(lk).addScaledVector(t < 31.1 ? V(-0.42, 0.85, 0.42).normalize() : LDIR, 14);
      const shs = 7 + Math.min(10, lk.distanceTo(cp) * 0.35); const sc = key.shadow.camera; sc.left = sc.bottom = -shs; sc.right = sc.top = shs; sc.updateProjectionMatrix();
      sun.position.copy(cp).addScaledVector(SUN, 120); sun.visible = t > 30.9; sun.material.opacity = smooth(range(t, 30.9, 31.3));
      // ---- stamps ----
      const fwv = V(0, 0, 0);
      // ---- camera ----
      const sh = shake(t, 0.6, 3);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      c.getWorldDirection(fwv); const upv = V(0, 1, 0).applyQuaternion(c.quaternion);
      nope.position.copy(c.position).addScaledVector(fwv, 2).addScaledVector(upv, 0.08); nope.set(t > 9.03 && t < 10.0 ? easeOut(range(t, 9.03, 9.18)) * (1 - smooth(range(t, 9.75, 10.0))) : 0);
      ftj.position.copy(c.position).addScaledVector(fwv, 2).addScaledVector(upv, 0.12); ftj.set(t > 33.36 ? easeOut(range(t, 33.36, 33.52)) : 0);
      fx.gold.position.copy(c.position).addScaledVector(fwv, 2.4).addScaledVector(upv, 0.1); fx.gold.update(t - 33.4);
      // ---- glass card ----
      card.position.copy(c.position).addScaledVector(fwv, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.25, 3.3, 'WHAT DID THEY DO', 'ALL DAY?', '#ffffff', 'in ancient times'],
        [11.4, 12.52, 'DAILY LIFE', 'HUNTING', '#ffd166', 'animals'], [12.52, 13.84, 'DAILY LIFE', 'GATHERING', '#ff6b5b', 'fruits'], [13.84, 14.59, 'DAILY LIFE', 'FISHING', '#7cc8ff', ''], [14.59, 16.2, 'DAILY LIFE', 'WATER', '#9be7ff', 'clean water'],
        [16.87, 17.89, 'OTHERS', 'SHELTER', '#ffd166', ''], [17.89, 18.83, 'OTHERS', 'TOOLS', '#d6dde6', 'stone tools'], [18.83, 20.09, 'OTHERS', 'FOOD', '#ff9f43', ''], [20.09, 22.55, 'OTHERS', 'PROTECT', '#ff5a5a', 'from wild animals'],
        [23.04, 24.91, 'THEN CAME', 'FARMING', '#9ad46a', ''], [24.91, 25.95, 'THEN CAME', 'CROPS', '#ffd166', ''], [25.95, 27.21, 'THEN CAME', 'LIVESTOCK', '#ffffff', ''], [27.21, 29.1, 'THEN CAME', 'VILLAGES', '#ffb36b', 'permanent homes'],
        [31.13, 31.85, 'SURVIVAL', 'SUNRISE', '#ffc27a', ''], [31.85, 32.6, 'SURVIVAL', 'NOON', '#fff1a8', ''], [32.6, 33.36, 'SURVIVAL', 'SUNSET', '#ff9a5a', ''],
      ];
      const cur = CARDS.find(([a, b]) => t >= a && t < b);
      let ck = 0;
      if (cur) {
        card.set(cur[2], cur[3], cur[4], null, cur[5]);
        const grp = CARDS.filter(x => x[2] === cur[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1];
        ck = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb)));
        const popk = 1 + 0.09 * Math.exp(-(t - cur[0]) * 9);
        card.scale.set(0.72 * popk, 0.281 * popk, 1);
      }
      card.material.opacity = ck; card.visible = ck > 0.01;
      const fd = cp.distanceTo(lk);
      return { dof: { focus: fd, aperture: fd < 6 ? 0.0012 : 0.0004, maxblur: 0.005 }, bloom: 0.45, exposure: 1.0 + dawn * 0.05 };
    },
  };
}

export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
