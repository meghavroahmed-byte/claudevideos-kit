import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 27.2;
export const CAPTIONS = [
  [0.0, 'What was life like on a Viking ship?'],
  [2.54, 'There were no cabins'], [3.71, 'no beds'], [4.56, 'and no roof'],
  [6.02, 'Dozens of men rowed side by side'], [8.49, 'then slept on deck under animal skins'], [10.86, 'soaking wet'],
  [12.45, 'For weeks they ate dried fish'], [14.46, 'salted meat'], [15.44, 'and hard bread'],
  [16.86, 'The toilet?'], [17.85, 'A bucket'], [18.63, 'or just hang over the side!'],
  [20.6, 'But their fast ships sailed all the way to America'], [23.65, 'five hundred years before Columbus', 27.0],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const SIT = { drop: -0.5, lHip: [-1.5, 0, 0.12], lKn: [1.45, 0, 0], rHip: [-1.5, 0, -0.12], rKn: [1.45, 0, 0] };
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 10, sunDir: [-4, 6, 4], sun: 1.6 });
  const U = scene.userData.sky.material.uniforms;
  const DAY = [0x5a7a9a, 0x9ab0c4, 0xd8e0e6], NIGHT = [0x0a1020, 0x1a2438, 0x3a4458];
  scene.fog = new THREE.Fog(0xb8c8d4, 30, 200);
  const key = scene.userData.key; const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.8;
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const ot = canvasTex(256, 256, (g) => { g.fillStyle = '#2a4a5e'; g.fillRect(0, 0, 256, 256); const r = rng(2); for (let i = 0; i < 300; i++) { g.strokeStyle = `rgba(255,255,255,${0.06 + r() * 0.16})`; g.lineWidth = 1 + r() * 2; const x = r() * 256, y = r() * 256; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 8, y - 4, x + 16, y); g.stroke(); } });
  ot.wrapS = ot.wrapT = THREE.RepeatWrapping; ot.repeat.set(80, 80);
  const og = new THREE.PlaneGeometry(600, 600, 120, 120);
  const ocean = new THREE.Mesh(og, new THREE.MeshStandardMaterial({ map: ot, roughness: 0.2, metalness: 0.1 })); ocean.rotation.x = -Math.PI / 2; scene.add(ocean);
  const OP = og.attributes.position, OX = Float32Array.from(OP.array);
  const swell = (x, z, t) => Math.sin(x * 0.15 + t * 0.9) * 0.35 + Math.sin(z * 0.2 - t * 0.7) * 0.25 + Math.sin((x + z) * 0.5 + t * 1.6) * 0.06;
  scene.children.filter(o => o.isMesh && o !== ocean && o.geometry && o.geometry.type === 'PlaneGeometry').forEach(o => o.visible = false);
  // fjord cliffs
  const cr = rng(5); for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(8 + cr() * 8, 14 + cr() * 14, 6), new THREE.MeshStandardMaterial({ color: [0x4a5258, 0x3a4248, 0x5a6268][i % 3], flatShading: true })); m.position.set(-60 + i * 15, 5, -70 - cr() * 20); scene.add(m); const snow = new THREE.Mesh(new THREE.ConeGeometry(3, 4, 6), new THREE.MeshStandardMaterial({ color: 0xf0f4f8, flatShading: true })); snow.position.set(m.position.x, m.position.y + m.geometry.parameters.height / 2 - 1.5, m.position.z); scene.add(snow); }
  // longship
  const ship = new THREE.Group(); scene.add(ship);
  const wood = new THREE.MeshStandardMaterial({ color: 0x7a5432, roughness: 0.85 }), dark = new THREE.MeshStandardMaterial({ color: 0x4a3220, roughness: 0.9 });
  const hullG = new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); const hull = new THREE.Mesh(hullG, new THREE.MeshStandardMaterial({ color: 0x6a4428, roughness: 0.85, side: THREE.DoubleSide })); hull.scale.set(1.5, 0.9, 7.5); hull.position.y = 0.5; ship.add(hull);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 12), wood); deck.position.y = 0.42; ship.add(deck);
  for (const s of [-1, 1]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 13.0), dark); rail.position.set(s * 1.45, 0.65, 0); ship.add(rail); }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.2, 10), dark); neck.position.set(0, 1.4, 7.3); neck.rotation.x = 0.45; ship.add(neck);
  const dragon = new THREE.Group(); dragon.position.set(0, 2.45, 7.85); ship.add(dragon); const dh = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 8), dark); dh.rotation.x = Math.PI / 2; dh.position.z = 0.25; dragon.add(dh); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd23f })); e.position.set(s * 0.12, 0.1, 0.15); dragon.add(e); const horn = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.3, 6), dark); horn.position.set(s * 0.1, 0.25, -0.05); horn.rotation.x = -0.6; dragon.add(horn); }
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 2.0, 10), dark); tail.position.set(0, 1.3, -7.3); tail.rotation.x = -0.5; ship.add(tail);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 6.5, 10), dark); mast.position.set(0, 3.6, 0.5); ship.add(mast);
  const sailT = canvasTex(256, 256, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f2ece0' : '#b3261e'; g.fillRect(i * 32, 0, 32, 256); } });
  const sailG = new THREE.PlaneGeometry(3.6, 3.0, 12, 8); const sail = new THREE.Mesh(sailG, new THREE.MeshStandardMaterial({ map: sailT, side: THREE.DoubleSide, roughness: 0.9 })); sail.position.set(0, 4.6, 0.6); ship.add(sail);
  const SP = sailG.attributes.position, SX = Float32Array.from(SP.array);
  const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.0, 8), dark); yard.rotation.z = Math.PI / 2; yard.position.set(0, 6.1, 0.6); ship.add(yard);
  const shCols = [0xffd23f, 0xb3261e, 0x2a5aa8, 0x2a2a2e, 0xf2ece0];
  for (const s of [-1, 1]) for (let i = 0; i < 12; i++) { const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 20), new THREE.MeshStandardMaterial({ color: shCols[(i + (s > 0 ? 2 : 0)) % 5] })); sh.rotation.z = Math.PI / 2; sh.position.set(s * 1.5, 0.7, -5.4 + i * 0.95); ship.add(sh); const boss = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshStandardMaterial({ color: 0xc8ccd4, metalness: 0.7 })); boss.position.set(s * 1.53, 0.7, -5.4 + i * 0.95); ship.add(boss); }
  const oars = []; for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const og2 = new THREE.Group(); og2.position.set(s * 1.4, 0.75, -4.0 + i * 1.5); ship.add(og2); const o = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 4.0, 6), wood); o.rotation.z = s * (Math.PI / 2 - 0.35); o.position.set(s * 1.8, -0.6, 0); og2.add(o); og2.userData.s = s; og2.userData.i = i; oars.push(og2); }
  // rowers (seated on chests)
  const rowers = []; const rcols = [0x6a5a3a, 0x3a5a6a, 0x7a3a2a, 0x4a6a3a, 0x5a4a6a, 0x8a6a3a];
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const r = makeHuman('hide', { shirt: rcols[(i * 2 + (s > 0 ? 1 : 0)) % 6], hair: [0xc8a060, 0x6a3a1a, 0x3a2a1a, 0xa86a3a][i], beard: true }); r.root.position.set(s * 0.75, 0.45, -3.6 + i * 1.5); r.root.rotation.y = Math.PI; ship.add(r.root); r.userData = { s, i }; rowers.push(r); const chest = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.35), wood); chest.position.set(s * 0.75, 0.6, -3.6 + i * 1.5); ship.add(chest); }
  const skins = rowers.map(r => { const sk = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 1.6), new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 1 })); ship.add(sk); return sk; });
  // hero viking at the bow
  const hero = makeHuman('hide', { shirt: 0x2a6a5a, hair: 0xc8783a, beard: true, chestText: 'MR. CLOUD' }); ship.add(hero.root);
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xa8acb4, metalness: 0.8, roughness: 0.3 })); helm.position.y = 0.16; hero.j.head.add(helm);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.1, 0.02), helm.material); nose.position.set(0, 0.12, 0.14); hero.j.head.add(nose);
  // food props
  const fish = new THREE.Group(); const fb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshStandardMaterial({ color: 0xa89a7a })); fb.scale.set(1, 0.6, 3); fish.add(fb); const ft = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 4), fb.material); ft.position.z = -0.22; ft.rotation.x = -Math.PI / 2; fish.add(ft); scene.add(fish);
  const meat = new THREE.Group(); const mm = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), new THREE.MeshStandardMaterial({ color: 0xa83a2a })); meat.add(mm); const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0xf4f0e0 })); bone.position.y = -0.1; meat.add(bone); scene.add(meat);
  const bread = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 10), new THREE.MeshStandardMaterial({ color: 0xc89048, roughness: 0.9 })); bread.scale.set(1.3, 0.7, 1); scene.add(bread);
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.3, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x6a4428, side: THREE.DoubleSide })); scene.add(bucket);
  // "no" icons
  const icon = (draw) => { const tx = canvasTex(256, 256, (g) => { draw(g); g.strokeStyle = '#ff3b3b'; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(40, 40); g.lineTo(216, 216); g.stroke(); }); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthTest: false, toneMapped: false })); s.renderOrder = 30; scene.add(s); return s; };
  const noCabin = icon((g) => { g.fillStyle = '#f4f0e6'; g.fillRect(60, 110, 136, 100); g.fillStyle = '#8a5a3a'; g.beginPath(); g.moveTo(40, 115); g.lineTo(128, 40); g.lineTo(216, 115); g.fill(); g.fillStyle = '#5a3a20'; g.fillRect(110, 150, 36, 60); });
  const noBed = icon((g) => { g.fillStyle = '#8a5a3a'; g.fillRect(40, 150, 176, 30); g.fillRect(40, 110, 16, 90); g.fillRect(200, 130, 16, 70); g.fillStyle = '#39a0ff'; g.fillRect(70, 130, 130, 24); g.fillStyle = '#fff'; g.fillRect(56, 124, 40, 26); });
  const noRoof = icon((g) => { g.fillStyle = '#b3261e'; g.beginPath(); g.moveTo(30, 150); g.lineTo(128, 60); g.lineTo(226, 150); g.closePath(); g.fill(); });
  // rain + spray
  const NR = 300, rp = new Float32Array(NR * 3), rgeo = new THREE.BufferGeometry(); rgeo.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.Points(rgeo, new THREE.PointsMaterial({ color: 0xcfe0f0, size: 0.04, transparent: true, opacity: 0.8 })); rain.frustumCulled = false; scene.add(rain);
  const rr2 = rng(9); const RB = []; for (let i = 0; i < NR; i++) RB.push([(rr2() - 0.5) * 8, rr2() * 6, (rr2() - 0.5) * 10, rr2()]);
  // map bubble
  const zc = document.createElement('canvas'); zc.width = zc.height = 512; const zg = zc.getContext('2d'); const zt = new THREE.CanvasTexture(zc); zt.colorSpace = THREE.SRGBColorSpace;
  const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); bub.renderOrder = 30; scene.add(bub);
  const PTS = [[430, 150], [330, 120], [220, 140], [110, 230]];
  const drawM = (route, col, tt) => { zg.clearRect(0, 0, 512, 512); zg.save(); zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.clip(); zg.fillStyle = '#3a7ab8'; zg.fillRect(0, 0, 512, 512);
    zg.fillStyle = '#7ab05a'; zg.beginPath(); zg.ellipse(450, 170, 60, 90, 0.3, 0, 7); zg.fill(); zg.beginPath(); zg.ellipse(330, 110, 30, 20, 0, 0, 7); zg.fill(); zg.fillStyle = '#e8eef4'; zg.beginPath(); zg.ellipse(230, 110, 50, 60, 0, 0, 7); zg.fill(); zg.fillStyle = '#7ab05a'; zg.beginPath(); zg.ellipse(40, 320, 120, 200, 0, 0, 7); zg.fill();
    zg.strokeStyle = '#ffd23f'; zg.lineWidth = 9; zg.setLineDash([16, 12]); zg.beginPath(); let total = route * 3; for (let i = 0; i < 3; i++) { const k = clamp(total - i, 0, 1); if (k <= 0) break; const [x0, y0] = PTS[i], [x1, y1] = PTS[i + 1]; if (i === 0) zg.moveTo(x0, y0); zg.lineTo(lerp(x0, x1, k), lerp(y0, y1, k)); } zg.stroke(); zg.setLineDash([]);
    const seg = Math.min(2, Math.floor(total)), kk = clamp(total - seg, 0, 1); const sx = lerp(PTS[seg][0], PTS[seg + 1][0], kk), sy = lerp(PTS[seg][1], PTS[seg + 1][1], kk);
    zg.fillStyle = '#b3261e'; zg.beginPath(); zg.moveTo(sx - 18, sy); zg.lineTo(sx + 18, sy); zg.lineTo(sx + 10, sy + 10); zg.lineTo(sx - 10, sy + 10); zg.fill(); zg.fillStyle = '#f2ece0'; zg.fillRect(sx - 2, sy - 22, 4, 22); zg.fillRect(sx - 10, sy - 20, 16, 14);
    zg.font = "400 44px Brand, sans-serif"; zg.textAlign = 'center'; zg.lineWidth = 8; zg.strokeStyle = 'rgba(0,0,0,0.6)';
    if (col > 0) { zg.globalAlpha = col; zg.strokeText('1000 AD', 150, 420); zg.fillStyle = '#ffd23f'; zg.fillText('1000 AD', 150, 420); zg.strokeText('1492', 380, 420); zg.fillStyle = '#ffffff'; zg.fillText('1492', 380, 420); zg.globalAlpha = 1; }
    zg.restore(); zg.strokeStyle = 'rgba(255,255,255,0.95)'; zg.lineWidth = 12; zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.stroke(); zt.needsUpdate = true; };
  const fx = { splash: burst(0xdfeef8, 80, 1), crack: burst(0xc89048, 30, 2) }; Object.values(fx).forEach(f => ship.add(f));
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      for (let i = 0; i < OP.count; i++) { const x = OX[i * 3], y = OX[i * 3 + 1]; OP.setZ(i, swell(x, -y, t)); } OP.needsUpdate = true; og.computeVertexNormals();
      const night = smooth(range(t, 8.4, 9.4)) * (1 - smooth(range(t, 12.0, 12.8)));
      [U.top, U.mid, U.horizon].forEach((un, i) => un.value.copy(new THREE.Color(DAY[i]).lerp(new THREE.Color(NIGHT[i]), night)));
      U.floorC.value.set(0x2a4a5e); key.intensity = lerp(1.6, 0.3, night); hemi.intensity = lerp(0.8, 0.3, night);
      // ship bob
      ship.position.set(0, swell(0, 0, t) - 0.05, 0); ship.rotation.set(Math.sin(t * 0.7) * 0.04, 0, Math.sin(t * 0.9) * 0.05);
      ship.position.z = 0;
      for (let i = 0; i < SP.count; i++) { const x = SX[i * 3], y = SX[i * 3 + 1]; SP.setZ(i, (1 - (x / 1.8) ** 2) * (0.35 + 0.08 * Math.sin(t * 2 + y))); } SP.needsUpdate = true; sailG.computeVertexNormals();
      // rowing cycle
      const rowing = t < 8.5 || t > 20.4;
      const rph = t * 2.4;
      oars.forEach(o => { const s = o.userData.s; o.rotation.set(0, s * Math.sin(rph) * 0.35 * (rowing ? 1 : 0.1), s * (Math.cos(rph) * 0.12 * (rowing ? 1 : 0))); });
      const sleep = smooth(range(t, 8.6, 9.2)) * (1 - smooth(range(t, 12.1, 12.6)));
      rowers.forEach((r, k) => { const pl = Math.sin(rph); r.root.position.y = 0.45 - 0.25 * sleep; r.root.rotation.x = -1.4 * sleep;
        r.setPose(over(STAND(t, k), SIT, { spine: [0.35 * pl * (1 - sleep), 0, 0], lSh: [-1.2 + 0.5 * pl, 0, 0.2], rSh: [-1.2 + 0.5 * pl, 0, -0.2], lEl: [-0.4, 0, 0], rEl: [-0.4, 0, 0] })); r.setMouth(0.05); });
      skins.forEach((sk, k) => { const r = rowers[k]; sk.position.set(r.root.position.x, 0.62, r.root.position.z - 0.5); sk.visible = sleep > 0.3; sk.scale.y = sleep; });
      // hero: bow stance; eats; hangs over the side
      const eat = smooth(range(t, 12.4, 12.8)) * (1 - smooth(range(t, 16.6, 17.0)));
      const hang = smooth(range(t, 18.5, 19.2)) * (1 - smooth(range(t, 20.2, 20.7)));
      const sitHero = sleep;
      hero.root.position.set(lerp(0.2, 1.05, hang), 0.45, lerp(4.3, 2.4, Math.max(hang, sitHero * 0.0))); hero.root.rotation.set(0, lerp(Math.PI * 0.85 + 0.0, Math.PI / 2, hang), 0);
      let pose = STAND(t);
      if (sitHero > 0.01) { pose = over(pose, SIT, { neck: [0.3 * sitHero, 0, 0] }); hero.root.position.y = 0.45 + 0.0; }
      if (hang > 0.01) pose = over(pose, { spine: [0.9 * hang, 0, 0], chest: [0.3 * hang, 0, 0], lSh: [-1.0 * hang, 0, 0.2], rSh: [-1.0 * hang, 0, -0.2], lEl: [-0.6, 0, 0], rEl: [-0.6, 0, 0], neck: [0.4 * hang, 0, 0], lHip: [-0.2 * hang, 0, 0.1], rHip: [-0.2 * hang, 0, -0.1] });
      hero.setPose(pose); hero.setMouth(eat > 0.5 ? 0.3 + 0.3 * Math.max(0, Math.sin(t * 10)) : 0.06);
      scene.updateMatrixWorld(true);
      const rsW = hero.j.rSh.getWorldPosition(V()), mouthW = hero.j.head.localToWorld(V(0, -0.04, 0.17));
      if (eat > 0.01) { const bite = 0.5 + 0.5 * Math.sin(t * 5); ikArm(hero, 'r', rsW.clone().add(V(0.0, -0.45, 0.15)).lerp(mouthW.clone().add(V(0.02, -0.03, 0.08 + 0.04 * bite)), eat), rsW.clone().add(V(0.3, -0.3, 0)), V(0, 0, 1)); scene.updateMatrixWorld(true); }
      const rh = hero.j.rWr.localToWorld(V(0, -0.08, 0.02));
      fish.position.copy(rh); fish.visible = eat > 0.01 && t < 14.4; fish.rotation.set(0.3, t, 0);
      meat.position.copy(rh); meat.visible = eat > 0.01 && t >= 14.4 && t < 15.4;
      bread.position.copy(rh); bread.visible = eat > 0.01 && t >= 15.4;
      fx.crack.position.copy(ship.worldToLocal(mouthW.clone())); fx.crack.update(t - 15.9);
      const bk = smooth(range(t, 17.6, 18.0)) * (1 - smooth(range(t, 18.6, 19.0)));
      bucket.position.copy(ship.localToWorld(V(0.7, 0.6, 3.6))); bucket.scale.setScalar(Math.max(0.001, bk)); bucket.visible = bk > 0.01;
      fx.splash.position.set(1.9, 0.1, 2.4); fx.splash.update(t - 19.4);
      // rain at night
      const rk = smooth(range(t, 9.6, 10.4)) * (1 - smooth(range(t, 12.1, 12.6)));
      for (let i = 0; i < NR; i++) { const b = RB[i]; const u2 = (t * 1.6 + b[3]) % 1; rp[i * 3] = b[0]; rp[i * 3 + 1] = rk > 0.01 ? 6 - u2 * 6 : -50; rp[i * 3 + 2] = b[2]; } rgeo.attributes.position.needsUpdate = true;
      // ---------- camera ----------
      const KEYS = [[0, [9.0, 5.0, 14.0], [0, 1.8, 1.5]], [2.4, [4.0, 2.3, 8.4], [0.2, 1.3, 3.8]], [8.2, [4.0, 2.3, 8.4], [0.2, 1.3, 3.8]], [9.4, [4.4, 3.8, 9.0], [0.0, 0.8, 2.4]], [12.2, [4.4, 3.8, 9.0], [0.0, 0.8, 2.4]], [13.0, [3.6, 2.2, 8.0], [0.2, 1.4, 3.8]], [17.8, [3.6, 2.2, 8.0], [0.4, 1.3, 3.5]], [19.0, [4.6, 1.6, 5.6], [1.2, 1.0, 2.4]], [20.4, [4.6, 1.6, 5.6], [1.2, 1.0, 2.4]], [22.0, [9.0, 5.0, 14.0], [0, 1.8, 1.5]], [27.2, [10.0, 5.6, 15.0], [0, 1.8, 1.0]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.5 + rk * 0.8, 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const hd = hero.j.head.getWorldPosition(V());
      [[noCabin, 2.9, 0.42], [noBed, 3.8, 0.0], [noRoof, 4.7, -0.42]].forEach(([s, a, dx]) => { const kk = easeOut(range(t, a, a + 0.2)) * (1 - smooth(range(t, 5.8, 6.1))); s.position.copy(hd).add(V(dx, 0.55, 0.3)); s.scale.setScalar(0.75 * kk); s.visible = kk > 0.01; });
      const mk = easeOut(range(t, 20.8, 21.2));
      drawM(easeInOut(range(t, 21.0, 23.4)), smooth(range(t, 23.6, 24.2)), t);
      bub.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.12).addScaledVector(rt, 0.0); bub.scale.setScalar(0.38 * mk); bub.visible = mk > 0.01;
      return { dof: { focus: 6, aperture: 0, maxblur: 0 }, bloom: 0.3, exposure: lerp(1.05, 0.95, night) };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
