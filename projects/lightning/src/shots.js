import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { infoCard, burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { world, grass, tree, rock, stamp } from './ancient.js';
import { heartSprite } from './snake.js';

export const DURATION = 28.6;
export const CAPTIONS = [
  [0.0, 'What happens to your body'], [1.39, 'when you get struck'], [2.31, 'by lightning?'],
  [3.53, 'A single bolt'], [4.51, 'carries up to'], [5.15, '300 million volts'], [7.52, "and it's five times hotter"], [9.05, 'than the surface of the Sun'],
  [10.81, 'In a split second'], [11.9, 'the current races'], [13.12, 'over your skin'], [14.16, 'burning your clothes'], [15.31, 'and even'], [15.88, 'blowing off your shoes'],
  [17.42, 'It can stop your heart'], [18.74, 'and leave fern-shaped scars'], [20.42, 'called Lichtenberg figures'],
  [22.2, "But here's"], [22.66, 'the surprising part'], [24.26, 'about 90 percent'], [25.43, 'of people struck by lightning'], [27.02, 'survive!', 28.4],
];
export const FADES = [];

const HP = V(0, 0, 0);
const FREEZE0 = 2.62, FREEZE1 = 22.2;
const te = (t) => t < FREEZE0 ? t : t < FREEZE1 ? FREEZE0 + (t - FREEZE0) * 0.004 : FREEZE0 + (FREEZE1 - FREEZE0) * 0.004 + (t - FREEZE1);
const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);

function boltGeo(from, to, seed, segs = 26, jag = 0.6) {
  const r = rng(seed), pts = [];
  for (let i = 0; i <= segs; i++) { const k = i / segs, p = from.clone().lerp(to, k); if (i && i < segs) p.add(V((r() - 0.5) * jag, (r() - 0.5) * jag * 0.3, (r() - 0.5) * jag)); pts.push(p); }
  return pts;
}
function boltMesh(pts, rad = 0.05) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.0);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, pts.length * 4, rad, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, pts.length * 4, rad * 4, 6), new THREE.MeshBasicMaterial({ color: 0x8fb8ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
  return g;
}
function lichtenberg() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); const r = rng(21);
  g.strokeStyle = 'rgba(190,40,50,0.9)'; g.lineCap = 'round';
  const br = (x, y, a, len, w, d) => { if (d > 7 || len < 4) return; const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke(); const n = 2 + (r() < 0.4 ? 1 : 0); for (let i = 0; i < n; i++) br(x2, y2, a + (r() - 0.5) * 1.3, len * (0.62 + r() * 0.2), w * 0.7, d + 1); };
  br(256, 20, Math.PI / 2, 90, 14, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function voltHud() {
  const c = document.createElement('canvas'); c.width = 768; c.height = 220; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false })); s.renderOrder = 31;
  let last = '';
  s.set = (v) => { const txt = Math.round(v).toLocaleString('en-US') + ' V'; if (txt === last) return; last = txt; g.clearRect(0, 0, 768, 220); g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 16;
    g.fillStyle = '#ffe14d'; g.beginPath(); g.moveTo(70, 30); g.lineTo(40, 115); g.lineTo(72, 115); g.lineTo(50, 190); g.lineTo(115, 90); g.lineTo(82, 90); g.lineTo(105, 30); g.fill();
    g.font = "400 92px Brand, sans-serif"; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText(txt, 140, 115); t.needsUpdate = true; };
  s.set(0); return s;
}
function sunCompare() {
  const c = document.createElement('canvas'); c.width = 768; c.height = 420; const g = c.getContext('2d');
  g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 16;
  const gr = g.createRadialGradient(170, 190, 10, 170, 190, 110); gr.addColorStop(0, '#fff3a0'); gr.addColorStop(0.6, '#ffb020'); gr.addColorStop(1, 'rgba(255,120,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(170, 190, 110, 0, 7); g.fill();
  g.fillStyle = '#ffe14d'; g.beginPath(); g.moveTo(560, 40); g.lineTo(500, 200); g.lineTo(560, 200); g.lineTo(520, 360); g.lineTo(650, 160); g.lineTo(585, 160); g.lineTo(630, 40); g.fill();
  g.font = "400 56px Brand, sans-serif"; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('SUN', 170, 345); g.fillText('BOLT', 575, 395 - 0);
  g.font = "400 40px Brand, sans-serif"; g.fillStyle = '#ffd166'; g.fillText('5,500°C', 170, 390); g.fillStyle = '#8fd3ff'; g.fillText('30,000°C', 360, 210);
  g.font = "400 90px Brand, sans-serif"; g.fillStyle = '#ffffff'; g.fillText('<', 360, 140);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false }));
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-3, 9, 4], sun: 1.0 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x1b2230); u.mid.value.set(0x2c3546); u.horizon.value.set(0x4a5466); u.floorC.value.set(0x2a3328);
  scene.fog = new THREE.FogExp2(0x3a4352, 0.03);
  const key = scene.userData.key; key.color.set(0xb8c8e8);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0x9aa8c8); hemi.groundColor.set(0x2f3a28); hemi.intensity = 0.8;
  scene.add(world(['#4a6a38', ['70,100,52', '82,112,60', '60,88,44']]));
  scene.add(grass(2400, [-12, -20, 12, 3.2], [[-0.6, -0.6, 0.6, 0.6]]));
  [[-6, -8], [7, -10], [-11, -14], [12, -6], [3, -16]].forEach(([x, z], i) => { const tr = tree({ h: 3 + (i % 3), seed: i + 2, col: 0x34502c }); tr.position.set(x, 0, z); scene.add(tr); });
  // storm clouds
  const ct = glowTexture('rgba(200,205,215,1)', 'rgba(200,205,215,0)'), r = rng(4);
  for (let i = 0; i < 40; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, color: 0x4a5160, transparent: true, depthWrite: false, opacity: 0.9 })); s.position.set((r() - 0.5) * 60, 14 + r() * 5, -10 - r() * 30); s.scale.set(16 + r() * 10, 7 + r() * 3, 1); scene.add(s); }
  // rain (frozen during the strike)
  const N = 1400, rainG = new THREE.CylinderGeometry(0.004, 0.004, 0.32, 3), rain = new THREE.InstancedMesh(rainG, new THREE.MeshBasicMaterial({ color: 0xbfd2ff, transparent: true, opacity: 0.55 }), N), RP = [];
  for (let i = 0; i < N; i++) RP.push([(r() - 0.5) * 14, r() * 10, (r() - 0.5) * 12 + 1, 7 + r() * 3]);
  rain.frustumCulled = false; scene.add(rain);
  const mt = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), 0.12);
  // hero with umbrella
  const hero = makeHuman('casual', { shirt: 0xff8a3d, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const umb = new THREE.Group(); scene.add(umb);
  umb.add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.0, 8), new THREE.MeshStandardMaterial({ color: 0x8f969e, metalness: 0.8, roughness: 0.3 })));
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.3, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x1f4fa8, side: THREE.DoubleSide, roughness: 0.6 })); canopy.position.y = 0.42; umb.add(canopy);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.12, 8), new THREE.MeshStandardMaterial({ color: 0x8f969e, metalness: 0.8 })); tip.position.y = 0.62; umb.add(tip);
  umb.traverse(o => { if (o.isMesh) o.castShadow = true; });
  // shoes that get blown off
  const shoeM = new THREE.MeshStandardMaterial({ color: 0x2b2b30, roughness: 0.6 });
  const shoes = [0, 1].map(() => { const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.14, 4, 10), shoeM); s.rotation.x = Math.PI / 2; s.castShadow = true; scene.add(s); return s; });
  const footMeshes = []; for (const k of ['lAn', 'rAn']) hero.j[k].traverse(o => { if (o.isMesh && o.material.color && o.material.color.getHex() === 0x2b2b30) footMeshes.push(o); });
  // the bolt
  const top = V(0.6, 16, -2), hit = V(0, 2.25, 0.05);
  const main = boltMesh(boltGeo(top, hit, 3, 30, 1.2), 0.05); scene.add(main);
  const branches = [[V(0.4, 11, -1.5), V(-2.5, 7, -2), 5], [V(0.7, 8, -1), V(2.8, 5, -1.5), 6], [V(0.2, 5, -0.4), V(-1.4, 3.4, 0.2), 7]].map(([a, b, s]) => { const m = boltMesh(boltGeo(a, b, s, 14, 0.6), 0.025); scene.add(m); return m; });
  const flashL = new THREE.PointLight(0xcfe0ff, 0, 30, 1.2); flashL.position.set(0, 4, 1); scene.add(flashL);
  const hitGlow = glowSprite(0xdfeaff, 3); scene.add(hitGlow);
  // body current
  const sparks = []; for (let i = 0; i < 40; i++) { const s = glowSprite(0x9fd0ff, 0.12); s.userData.ph = i / 40; s.userData.path = i % 5; scene.add(s); sparks.push(s); }
  const arcs = []; for (let i = 0; i < 6; i++) { const geo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 8 }, () => V(0, 0, 0))); const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xcfe6ff, transparent: true, toneMapped: false })); scene.add(l); arcs.push(l); }
  const smokeT = glowTexture('rgba(255,255,255,0.8)', 'rgba(255,255,255,0)'); const smokes = []; for (let i = 0; i < 12; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeT, color: 0x6a6a6a, transparent: true, depthWrite: false })); s.userData.ph = i / 12; scene.add(s); smokes.push(s); }
  const heart = heartSprite(); scene.add(heart);
  const lich = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.3), new THREE.MeshBasicMaterial({ map: lichtenberg(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
  lich.position.set(0, -0.12, 0.05); hero.j.lEl.add(lich);
  const lich2 = lich.clone(); lich2.material = lich.material; lich2.position.set(0.0, 0.12, 0.17); lich2.scale.set(1.3, 1.1, 1); hero.j.chest.add(lich2);
  const volt = voltHud(), sunc = sunCompare(); scene.add(volt, sunc);
  const fx = { strike: burst(0xdfeaff, 140, 1), shoes: burst(0xffd166, 50, 2), win: burst(0x5be37d, 100, 3) };
  Object.values(fx).forEach(f => scene.add(f));
  const surv = stamp('SURVIVED!', '#5be37d', 0.6); scene.add(surv);
  const card = infoCard(); scene.add(card);
  const whiteFlash = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xffffff, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false })); whiteFlash.renderOrder = 50; scene.add(whiteFlash);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      const T = te(t), frozen = t > FREEZE0 && t < FREEZE1;
      // rain
      for (let i = 0; i < N; i++) { const [x, y0, z, sp] = RP[i]; const y = ((y0 - T * sp) % 10 + 10) % 10; mt.compose(V(x + y * 0.12, y, z), q, V(1, 1, 1)); rain.setMatrixAt(i, mt); }
      rain.instanceMatrix.needsUpdate = true;
      // ---------- hero ----------
      const struck = t > FREEZE0 - 0.04;
      const fallK = smooth(range(t, 22.4, 23.1)), rise = smooth(range(t, 25.3, 26.5)), thumbs = smooth(range(t, 26.8, 27.2));
      let pose = over(STAND(T), { rSh: [-0.95, 0, -0.2], rEl: [-0.9, 0, 0], neck: [-0.15 - 0.15 * smooth(range(t, 1.6, 2.3)), 0, 0] });
      if (struck) pose = over(pose, { lSh: [-0.5, 0, 0.9], lEl: [-0.2, 0, 0], rSh: [-1.3, 0, -0.5], rEl: [-0.4, 0, 0], neck: [-0.35, 0, 0], spine: [-0.15, 0, 0], lHip: [-0.1, 0, 0.25], rHip: [0.1, 0, -0.25] });
      hero.root.position.copy(HP); hero.root.rotation.set(0, 0, 0);
      if (t > 22.2 && t < 25.3) { hero.root.rotation.x = -Math.PI / 2 * fallK; hero.root.position.y = 0.13 * fallK; hero.root.position.z = -0.0; pose = over(STAND(t), { lSh: [-0.3, 0, 0.4], rSh: [-0.3, 0, -0.4], neck: [0.1, 0.3, 0] }); }
      if (t >= 25.3) { hero.root.rotation.x = -Math.PI / 2 * (1 - rise); hero.root.position.y = 0.13 * (1 - rise); pose = over(STAND(t), { rSh: [-1.6 * thumbs, 0, -0.3], rEl: [-1.7 * thumbs, 0, 0], neck: [0, Math.sin(t * 6) * 0.15 * (1 - thumbs), 0] }); }
      hero.setPose(pose);
      hero.setMouth(struck && t < 22.2 ? 0.75 : t > 25.5 ? 0.3 * thumbs : 0);
      scene.updateMatrixWorld(true);
      // umbrella: in hand, falls away after
      if (t < 22.2) { const h = hero.j.rWr.localToWorld(V(0, -0.07, 0)); umb.position.copy(h).add(V(0, 0.45, 0)); umb.rotation.set(0, 0, struck ? 0.15 : 0.05); }
      else { const d = t - 22.2; umb.position.set(0.6 + d * 0.8, Math.max(0.1, 2.0 - 4.9 * d * d + 1.5 * d), 0.4); umb.rotation.set(0, 0, 0.15 + d * 3); }
      // shoes blown off at 16.24 (inside the freeze, but they fly in slow-motion)
      const so = t - 16.2;
      footMeshes.forEach(m => m.material = so > 0 ? hero.M.skin : shoeM);
      shoes.forEach((s, i) => { const a = hero.j[i ? 'rAn' : 'lAn'].localToWorld(V(0, -0.035, 0.05)); s.visible = so > 0; if (so > 0) { const k = so < 6 ? so : 6; s.position.copy(a).add(V((i ? -1 : 1) * 0.5 * k, 0.6 * k - 0.07 * k * k + 0.02, 0.35 * k)); s.rotation.set(Math.PI / 2 + k * 2, k * (i ? 1 : -1), 0); } });
      fx.shoes.position.copy(HP).add(V(0, 0.1, 0.1)); fx.shoes.update(t - 16.24);
      // bolt
      const bk = t > FREEZE0 - 0.05 && t < 22.25 ? 1 : 0;
      const pre = [0.55, 1.5].some(x => t > x && t < x + 0.06);
      main.visible = bk > 0 || (t > FREEZE0 - 0.12 && t < FREEZE0 - 0.05); branches.forEach(b => b.visible = main.visible);
      const flick = frozen ? 0.85 + 0.15 * Math.sin(t * 40) : 1;
      main.children[1].material.opacity = 0.35 * flick;
      hitGlow.position.copy(hit); hitGlow.material.opacity = bk * 0.8 * flick; hitGlow.scale.setScalar(2.2 + Math.sin(t * 30) * 0.2);
      flashL.intensity = bk * 18 * flick + (pre ? 30 : 0);
      fx.strike.position.copy(hit); fx.strike.update((t - FREEZE0) * (frozen ? 0.08 : 1));
      const wf = Math.exp(-Math.max(0, t - FREEZE0) * 8) * (t > FREEZE0 ? 1 : 0) + Math.exp(-Math.max(0, t - 22.2) * 6) * (t > 22.2 ? 0.7 : 0) + (pre ? 0.25 : 0);
      // current racing over the skin
      const cur = smooth(range(t, 11.85, 12.3)) * (1 - smooth(range(t, 21.8, 22.2)));
      const paths = [['rWr', 'rEl', 'rSh', 'chest', 'spine', 'pelvis'], ['pelvis', 'lHip', 'lKn', 'lAn'], ['pelvis', 'rHip', 'rKn', 'rAn'], ['chest', 'lSh', 'lEl', 'lWr'], ['head', 'neck', 'chest', 'spine']];
      sparks.forEach((s, i) => { const P = paths[s.userData.path], u2 = (t * 1.4 + s.userData.ph * 3) % 1, f = u2 * (P.length - 1), k0 = Math.floor(f), k1 = Math.min(P.length - 1, k0 + 1); const a = hero.j[P[k0]].getWorldPosition(V(0, 0, 0)), b = hero.j[P[k1]].getWorldPosition(V(0, 0, 0)); s.position.copy(a.lerp(b, f - k0)).add(V(Math.sin(i * 7 + t * 9) * 0.06, Math.sin(i * 3 + t * 11) * 0.04, 0.1)); s.material.opacity = cur * (0.6 + 0.4 * Math.sin(t * 30 + i)); s.scale.setScalar(0.16 + 0.1 * Math.sin(t * 20 + i)); });
      arcs.forEach((l, i) => { const P = paths[i % 5], p = l.geometry.attributes.position, rr = rng(Math.floor(t * 20) * 7 + i); for (let k = 0; k < 8; k++) { const f = k / 7 * (P.length - 1), k0 = Math.floor(f), k1 = Math.min(P.length - 1, k0 + 1); const a = hero.j[P[k0]].getWorldPosition(V(0, 0, 0)), b = hero.j[P[k1]].getWorldPosition(V(0, 0, 0)); const v = a.lerp(b, f - k0).add(V((rr() - 0.5) * 0.12, (rr() - 0.5) * 0.08, 0.12)); p.setXYZ(k, v.x, v.y, v.z); } p.needsUpdate = true; l.material.opacity = cur; l.visible = cur > 0.01; });
      const sm = smooth(range(t, 14.1, 14.5)) * (1 - smooth(range(t, 26, 27)));
      const chestW = hero.j.chest.getWorldPosition(V(0, 0, 0));
      smokes.forEach((s, i) => { const u2 = (t * 0.25 + s.userData.ph) % 1; s.position.copy(chestW).add(V(Math.sin(i * 2.3) * 0.25, -0.3 + u2 * 1.4, 0.15)); s.scale.setScalar(0.2 + u2 * 0.6); s.material.opacity = sm * Math.sin(u2 * Math.PI) * 0.5; });
      if (sm > 0) hero.shirt.color.set(0xff8a3d).lerp(new THREE.Color(0x3a2a20), 0.45 * sm);
      // heart stops
      const hk = smooth(range(t, 17.4, 17.7)) * (1 - smooth(range(t, 18.9, 19.2)));
      heart.position.copy(hero.j.chest.localToWorld(V(0.06, 0.2, 0.3))); const beat = Math.pow(Math.max(0, Math.sin(t * 9)), 6) * (t < 18.1 ? 1 : 0);
      heart.scale.setScalar(0.3 * hk * (1 + 0.3 * beat)); heart.material.opacity = hk; heart.visible = hk > 0.01; heart.material.color.setScalar(t > 18.1 ? 0.55 : 1);
      // Lichtenberg figures grow
      const lk = smooth(range(t, 18.9, 20.6));
      lich.scale.set(lk * 1.5 + 0.001, lk * 1.2 + 0.001, 1); lich.material.opacity = lk * (t > 26.5 ? 0.6 : 1); lich2.scale.set(1.3 * lk + 0.001, 1.1 * lk + 0.001, 1);
      // ---------- camera: wide hook, bullet-time orbit while frozen, arm close-up, wide end ----------
      const C = V(0, 1.1, 0);
      let cp, lkp;
      const orbit = (ang, rad, h, ly = 1.1) => [V(Math.sin(ang) * rad, h, Math.cos(ang) * rad), V(0, ly, 0)];
      const KEYS = [[0, orbit(0.35, 7.0, 1.9, 1.6)], [2.4, orbit(0.25, 6.4, 2.0, 1.9)], [3.4, orbit(0.1, 7.2, 2.6, 2.4)], [7.4, orbit(-1.2, 6.6, 2.0, 1.6)], [10.7, orbit(-2.4, 5.2, 1.7, 1.2)], [13.2, orbit(-3.4, 4.6, 1.6, 1.1)], [15.8, orbit(-4.6, 4.3, 1.0, 0.7)], [17.3, orbit(-5.8, 4.0, 1.5, 1.25)], [19.0, orbit(-6.25, 3.6, 1.55, 1.3)], [21.0, orbit(-6.5, 4.0, 1.6, 1.2)], [22.6, orbit(-6.7, 5.2, 2.6, 0.5)], [25.2, orbit(-6.8, 5.0, 2.2, 0.6)], [27.0, orbit(-6.85, 4.8, 1.7, 1.0)], [28.6, orbit(-6.88, 4.7, 1.7, 1.0)]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      cp = KEYS[i][1][0].clone().lerp(KEYS[i + 1][1][0], k); lkp = KEYS[i][1][1].clone().lerp(KEYS[i + 1][1][1], k);
      const sh = shake(t, frozen ? 0.3 : 0.8 + wf * 6, 9);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lkp.x, lkp.y, lkp.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lkp); key.position.copy(lkp).add(V(-3, 9, 4));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      whiteFlash.position.copy(c.position).addScaledVector(fw, 0.5); whiteFlash.scale.set(2, 2, 1); whiteFlash.material.opacity = Math.min(1, wf); whiteFlash.visible = wf > 0.01;
      const vk = smooth(range(t, 4.9, 5.2)) * (1 - smooth(range(t, 7.3, 7.6)));
      volt.set(lerp(0, 300000000, easeInOut(range(t, 5.15, 6.76)))); volt.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.14); volt.scale.set(0.62 * vk, 0.178 * vk, 1); volt.material.opacity = vk; volt.visible = vk > 0.01;
      const sk = smooth(range(t, 7.6, 7.9)) * (1 - smooth(range(t, 10.4, 10.7)));
      sunc.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.14); sunc.scale.set(0.62 * sk, 0.34 * sk, 1); sunc.material.opacity = sk; sunc.visible = sk > 0.01;
      surv.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.02); surv.set(t > 27.0 ? easeOut(range(t, 27.0, 27.16)) : 0);
      fx.win.position.copy(c.position).addScaledVector(fw, 2.4); fx.win.update(t - 27.0);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 3.4, 'WHAT IF', 'STRUCK?', '#ffffff', 'by lightning'],
        [3.53, 7.52, 'ONE BOLT', '300M VOLTS', '#ffe14d', ''], [7.52, 10.7, 'ONE BOLT', '5x HOTTER', '#ffb020', 'than the Sun'],
        [10.81, 14.16, 'SPLIT SECOND', 'CURRENT', '#8fd3ff', 'races over the skin'], [14.16, 15.88, 'SPLIT SECOND', 'CLOTHES BURN', '#ff9a5a', ''], [15.88, 17.3, 'SPLIT SECOND', 'SHOES FLY OFF', '#ffd166', ''],
        [17.42, 18.74, 'AFTER', 'HEART STOPS', '#ff4a4a', ''], [18.74, 22.0, 'AFTER', 'LICHTENBERG', '#ff6b6b', 'fern-shaped scars'],
        [24.26, 28.6, 'STRUCK BY LIGHTNING', '90% SURVIVE', '#5be37d', 90, ''],
      ];
      const cu = CARDS.find(([a, b]) => t >= a && t < b); let ck = 0;
      if (cu) { const lit = typeof cu[5] === 'number' ? cu[5] : null; card.set(cu[2], cu[3], cu[4], lit, lit != null ? cu[6] : cu[5]); const grp = CARDS.filter(x => x[2] === cu[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk = 1 + 0.09 * Math.exp(-(t - cu[0]) * 9); card.scale.set(0.72 * pk, 0.281 * pk, 1); }
      card.material.opacity = ck; card.visible = false;
      const fd = cp.distanceTo(lkp);
      return { dof: { focus: fd, aperture: 0.0008, maxblur: 0.004 }, bloom: 0.8, exposure: 0.95 + (frozen ? 0.1 : 0) };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
