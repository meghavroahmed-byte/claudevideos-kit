import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { infoCard, burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { world, grass, rock, stamp, iconBubble } from './ancient.js';
import { amphora } from './tp.js';

export const DURATION = 28.9;
export const CAPTIONS = [
  [0.0, 'What was a day like'], [1.13, 'for the workers'], [1.96, 'who built the pyramids?'],
  [3.55, "They weren't slaves"], [4.95, 'Most were paid workers'], [6.28, 'who lived in a village'], [7.33, 'right next to the pyramid'],
  [9.24, 'They woke up at sunrise'], [10.57, 'and worked in teams'], [11.62, 'of about twenty people'],
  [13.5, 'Using copper tools'], [14.66, 'they cut huge limestone blocks'], [16.9, 'some weighing'], [17.57, 'more than two tons'],
  [19.4, 'Then they dragged them'], [20.34, 'on wooden sleds'], [21.52, 'pouring water on the sand'], [22.91, 'to make them slide easier'],
  [24.77, 'And their pay?'], [25.81, 'Bread and beer'], [27.04, 'Lots of beer!', 28.7],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const PULL = (p) => { const s = Math.sin(p); return { lHip: [-0.6 - 0.3 * s, 0, 0.05], rHip: [0.25 + 0.3 * s, 0, -0.05], lKn: [0.5, 0, 0], rKn: [0.2, 0, 0], spine: [0.45, 0, 0], neck: [-0.35, 0, 0], lSh: [-1.35, 0, 0.1], rSh: [-1.45, 0, -0.1], lEl: [-0.2, 0, 0], rEl: [-0.3, 0, 0], drop: -0.1 }; };
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const sledX = (t) => -1.2 + t * 0.16;
const SLED_Z = 0, QUARRY = V(-4.2, 0, 9.4), TABLE = V(-9.5, 0, 3.2);

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 8, sunDir: [-4, 9, 4], sun: 2.6 });
  const u = scene.userData.sky.material.uniforms;
  scene.fog = new THREE.Fog(0xf0dcb8, 35, 160);
  const key = scene.userData.key;
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xfff0dc); hemi.groundColor.set(0xd0a868); hemi.intensity = 0.85;
  scene.add(world(['#e3c58c', ['216,186,128', '232,204,150', '204,174,118']]));
  // stepped pyramid under construction + ramp
  const lim = canvasTex(256, 256, (g) => { g.fillStyle = '#e2cf9e'; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(140,110,70,0.45)'; g.lineWidth = 3; for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) g.strokeRect(c * 64 + (r % 2) * 32, r * 32, 64, 32); });
  lim.wrapS = lim.wrapT = THREE.RepeatWrapping; lim.repeat.set(6, 1);
  const pm = new THREE.MeshStandardMaterial({ map: lim, roughness: 0.95 });
  const PY = V(10, 0, -16);
  for (let i = 0; i < 9; i++) { const s = 22 - i * 2.3, h = 1.6; const m = new THREE.Mesh(new THREE.BoxGeometry(s, h, s), pm); m.position.set(PY.x, h / 2 + i * h, PY.z); m.castShadow = m.receiveShadow = true; scene.add(m); }
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(3, 0.6, 18), new THREE.MeshStandardMaterial({ color: 0xc9a46a, roughness: 1 })); ramp.position.set(PY.x - 12, 3.5, PY.z + 4); ramp.rotation.x = -0.4; ramp.rotation.y = 0.9; 
  // village of mud-brick houses
  const mud = new THREE.MeshStandardMaterial({ color: 0xc8a070, roughness: 1 });
  [[4.5, -6], [7.8, -7.5], [11, -5.5], [6, -10], [13.8, -8.2], [1.5, -8.5]].forEach(([x, z], i) => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(2.6 + (i % 2), 2.0, 2.4), mud); b.position.y = 1.0; g.add(b); const d = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.1), new THREE.MeshStandardMaterial({ color: 0x3a2a1c })); d.position.set(0, 0.55, 1.21); g.add(d); const roof = new THREE.Mesh(new THREE.BoxGeometry(2.8 + (i % 2), 0.15, 2.6), new THREE.MeshStandardMaterial({ color: 0x8a6a44 })); roof.position.y = 2.05; g.add(roof); g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); g.position.set(x, 0, z); g.rotation.y = (i % 3 - 1) * 0.3; scene.add(g); });
  const palmM = new THREE.MeshStandardMaterial({ color: 0x3f7f35, side: THREE.DoubleSide });
  [[3, -4.5], [9.5, -4.2], [15, -5], [-6, -6]].forEach(([x, z]) => { const g = new THREE.Group(); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 4.5, 8), new THREE.MeshStandardMaterial({ color: 0x8a6a44 })); tr.position.y = 2.25; tr.rotation.z = 0.1; g.add(tr); for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 2.2), palmM); l.geometry.translate(0, 1.1, 0); l.position.set(0.2, 4.4, 0); l.rotation.set(1.0, i / 7 * 6.28, 0, 'YXZ'); g.add(l); } g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.position.set(x, 0, z); scene.add(g); });
  // quarry wall
  const qt = canvasTex(256, 256, (g) => { g.fillStyle = '#d8c49a'; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(120,96,60,0.4)'; g.lineWidth = 2; for (let i = 0; i < 20; i++) { g.beginPath(); g.moveTo(0, i * 13); g.lineTo(256, i * 13 + 4); g.stroke(); } });
  const qwall = new THREE.Mesh(new THREE.BoxGeometry(6, 3.2, 2), new THREE.MeshStandardMaterial({ map: qt, roughness: 1 })); qwall.position.set(QUARRY.x, 1.6, QUARRY.z - 1.4); qwall.castShadow = qwall.receiveShadow = true; scene.add(qwall);
  const cutBlock = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.9), new THREE.MeshStandardMaterial({ map: lim, roughness: 0.9 })); cutBlock.position.set(QUARRY.x + 0.5, 0.4, QUARRY.z - 0.1); cutBlock.castShadow = true; scene.add(cutBlock);
  // sled + block
  const sled = new THREE.Group(); scene.add(sled);
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a6a44, roughness: 0.9 });
  for (const z of [-0.45, 0.45]) { const r = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 0.16), wood); r.position.set(0, 0.07, z); sled.add(r); }
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 1.1), wood); b.position.set(-1.0 + i * 0.5, 0.17, 0); sled.add(b); }
  const big = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 1.1), new THREE.MeshStandardMaterial({ map: lim, roughness: 0.9 })); big.position.y = 0.81; sled.add(big);
  sled.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 6), new THREE.MeshStandardMaterial({ color: 0xc9a46a })); scene.add(rope);
  // workers
  const SK = [0x8d5524, 0xc68642, 0xa0662a, 0x7a4a24, 0xb57a42];
  const team = []; for (let i = 0; i < 8; i++) { const h = makeHuman('hide', { plain: true, shirt: 0xf2ecdc, belt: 0xb08a5a, skin: SK[i % 5], hair: 0x111111, beard: i % 3 === 0 }); scene.add(h.root); team.push(h); }
  const pourer = makeHuman('hide', { plain: true, shirt: 0xf2ecdc, belt: 0x2a6f9a, skin: 0xa0662a, hair: 0x111111, beard: false }); scene.add(pourer.root);
  const jar = amphora(0.5, 0xb35e32); scene.add(jar);
  const hero = makeHuman('hide', { plain: true, shirt: 0x2a6f9a, belt: 0xe9c46a, skin: 0xc68642, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const chisel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.25, 8), new THREE.MeshStandardMaterial({ color: 0xc87533, metalness: 0.8, roughness: 0.3 })); scene.add(chisel);
  const mallet = new THREE.Group(); mallet.add(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8), wood)); const mh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 12), wood); mh.rotation.z = Math.PI / 2; mh.position.y = 0.17; mallet.add(mh); scene.add(mallet);
  // water + wet sand
  const water = []; for (let i = 0; i < 24; i++) { const s = glowSprite(0x5ab8ff, 0.06); s.userData.ph = i / 24; scene.add(s); water.push(s); }
  const wet = []; for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshStandardMaterial({ color: 0xa88a5a, roughness: 0.4, transparent: true, opacity: 0 })); m.rotation.x = -Math.PI / 2; m.position.set(0, 0.006, SLED_Z); scene.add(m); wet.push(m); }
  // pay table
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.9), wood); table.position.copy(TABLE).add(V(0, 0.75, 0)); table.castShadow = true; scene.add(table);
  for (const [x, z] of [[-1.1, -0.4], [1.1, -0.4], [-1.1, 0.4], [1.1, 0.4]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 0.08), wood); l.position.copy(TABLE).add(V(x, 0.375, z)); scene.add(l); }
  const breads = [], beers = [];
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), new THREE.MeshStandardMaterial({ color: 0xc8843a, roughness: 0.8 })); b.scale.set(1.3, 0.7, 1); b.position.copy(TABLE).add(V(-0.9 + (i % 3) * 0.25, 0.86, -0.2 + Math.floor(i / 3) * 0.3)); b.castShadow = true; scene.add(b); breads.push(b); }
  for (let i = 0; i < 5; i++) { const j = amphora(0.42, 0xa0522d); j.position.copy(TABLE).add(V(0.15 + i * 0.22, 0.79, (i % 2) * 0.2 - 0.1)); scene.add(j); beers.push(j); }
  const heroJug = amphora(0.38, 0xa0522d); scene.add(heroJug);
  const noChain = iconBubble(canvasTex(512, 512, (g) => { g.strokeStyle = '#8a8f96'; g.lineWidth = 28; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(120 + i * 90, 256, 55, 32, 0, 0, 7); g.stroke(); } })); scene.add(noChain);
  const ton = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(512, 220, (g) => { g.fillStyle = 'rgba(40,24,8,0.75)'; g.beginPath(); g.roundRect(6, 6, 500, 208, 36); g.fill(); g.font = "400 120px Brand, sans-serif"; g.fillStyle = '#ffd23f'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('2+ TONS', 256, 116); }), transparent: true, depthWrite: false })); scene.add(ton);
  const counter = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); counter.renderOrder = 31; scene.add(counter);
  const cTex = {}; const cnt = (n) => cTex[n] || (cTex[n] = canvasTex(512, 200, (g) => { g.fillStyle = 'rgba(40,24,8,0.72)'; g.beginPath(); g.roundRect(6, 6, 500, 188, 36); g.fill(); g.font = "400 110px Brand, sans-serif"; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`TEAM × ${n}`, 256, 104); }));
  const sunS = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,250,220,1)', 'rgba(255,170,60,0)'), color: 0xffd090, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false, fog: false })); scene.add(sunS);
  const fx = { chip: [burst(0xe2cf9e, 30, 1), burst(0xe2cf9e, 30, 2), burst(0xe2cf9e, 30, 3)], crack: burst(0xffffff, 60, 4), pay: burst(0xffd23f, 110, 5) };
  for (const v of Object.values(fx)) (Array.isArray(v) ? v : [v]).forEach(f => scene.add(f));
  const payday = stamp('PAYDAY!', '#ffd23f', 0.5); scene.add(payday);
  const card = infoCard(); scene.add(card);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // sunrise at 9.2: warm dawn sky that settles into day
      const dawn = smooth(range(t, 8.9, 9.6)) * (1 - smooth(range(t, 12.6, 14.0)));
      u.top.value.set(0x3a8ad6).lerp(new THREE.Color(0x4a3a6a), dawn); u.mid.value.set(0x8ac0ea).lerp(new THREE.Color(0xf29a6b), dawn); u.horizon.value.set(0xf2e2c0).lerp(new THREE.Color(0xffc27a), dawn); u.floorC.value.set(0xe0c58a);
      key.color.set(0xfff0d8).lerp(new THREE.Color(0xff9a50), dawn); key.intensity = 2.6 - dawn * 1.0;
      // sled moves slowly
      const sx = sledX(t); sled.position.set(sx, 0, SLED_Z);
      const ropeEnd = V(sx + 1.3, 0.25, SLED_Z), ropeFar = V(sx + 1.3 + 7.6, 0.95, SLED_Z);
      const rd = ropeFar.clone().sub(ropeEnd); rope.position.copy(ropeEnd).addScaledVector(rd, 0.5); rope.scale.set(1, rd.length(), 1); rope.quaternion.setFromUnitVectors(V(0, 1, 0), rd.clone().normalize());
      team.forEach((h, i) => { const k = (i + 1) / 9; h.root.position.copy(ropeEnd.clone().lerp(ropeFar, k)).setY(0).add(V(0, 0, (i % 2 ? 0.28 : -0.28))); h.root.rotation.y = Math.PI / 2; h.setPose(PULL(t * 4 + i * 0.7)); h.setMouth(0.15); });
      // water pourer in front of the sled
      pourer.root.position.set(sx + 1.6, 0, SLED_Z + 0.75); pourer.root.rotation.y = -Math.PI / 2 - 0.4;
      const pour = smooth(range(t, 21.4, 21.8)) * (1 - smooth(range(t, 24.4, 24.8)));
      pourer.setPose(over(STAND(t, 3), { spine: [0.35 * pour, 0, 0], lSh: [-1.2 * pour, 0, 0.1], rSh: [-1.0 * pour, 0, -0.1], lEl: [-0.4, 0, 0], rEl: [-0.5, 0, 0] }));
      scene.updateMatrixWorld(true);
      const jp = pourer.j.lWr.localToWorld(V(0, -0.08, 0)).lerp(pourer.j.rWr.localToWorld(V(0, -0.08, 0)), 0.5);
      jar.position.copy(jp); jar.rotation.set(0, 0, 0); jar.rotateX(-1.6 * pour - 0.1); jar.rotation.y = pourer.root.rotation.y;
      water.forEach((s, i) => { const u2 = (t * 1.8 + s.userData.ph) % 1; s.position.copy(jp).add(V(-0.25 - u2 * 0.1, -u2 * (jp.y - 0.02), 0)); s.material.opacity = pour * 0.85; });
      wet.forEach((m, i) => { m.position.x = sx + 1.4 - i * 0.12 + (t > 21.6 ? 0 : 100); m.material.opacity = 0.55 * smooth(range(t, 21.8 + i * 0.1, 22.4 + i * 0.1)); });
      // ---------- hero: hauls (hook), carves (quarry), drinks (pay) ----------
      let hp, rot = 0, pose;
      if (t < 4.5) { hp = ropeEnd.clone().lerp(ropeFar, 0.05).setY(0).add(V(0, 0, 0.34)); rot = Math.PI / 2; pose = PULL(t * 4 + 0.3); hero.setMouth(0.2); }
      else if (t < 21.0) {
        hp = QUARRY.clone().add(V(-0.4, 0, 0.6)); rot = Math.PI + 0.2;
        const strikeP = Math.pow(0.5 - 0.5 * Math.cos((t - 13.6) * Math.PI * 2 / 0.6), 2);
        pose = over(STAND(t), { spine: [0.15, 0, 0], neck: [0.15, 0, 0], lSh: [-1.35, 0, 0.2], lEl: [-0.35, 0, 0], rSh: [lerp(-2.4, -1.4, strikeP), 0, -0.2], rEl: [lerp(-1.4, -0.6, strikeP), 0, 0] }); hero.setMouth(0.1);
      } else { hp = TABLE.clone().add(V(-0.2, 0, 1.0)); rot = 0.1; const cheer = smooth(range(t, 25.8, 26.2)); pose = over(STAND(t), { rSh: [-2.6 * cheer, 0, -0.3], rEl: [-0.3, 0, 0], lSh: [-0.8 * cheer, 0, 0.3], lEl: [-1.2 * cheer, 0, 0] }); hero.setMouth(0.4 * cheer); }
      hero.root.position.copy(hp); hero.root.rotation.y = rot; hero.setPose(pose);
      scene.updateMatrixWorld(true);
      const qk = t > 13.4 && t < 19.4;
      chisel.visible = mallet.visible = qk;
      if (qk) { const lh = hero.j.lWr.localToWorld(V(0, -0.07, 0)), rh = hero.j.rWr.localToWorld(V(0, -0.07, 0)); chisel.position.copy(lh).add(V(0, 0, -0.1)); chisel.rotation.set(Math.PI / 2, 0, 0); mallet.position.copy(rh); mallet.quaternion.copy(hero.j.rWr.getWorldQuaternion(new THREE.Quaternion())); }
      [14.1, 14.7, 15.3].forEach((s, i) => { fx.chip[i].position.copy(QUARRY).add(V(-0.3, 1.1, -0.35)); fx.chip[i].update(t - s); });
      const split = smooth(range(t, 15.9, 16.5)); cutBlock.position.set(QUARRY.x + 0.5, 0.4, QUARRY.z - 0.1 + 0.6 * split); fx.crack.position.copy(cutBlock.position).add(V(0, 0.5, 0)); fx.crack.update(t - 16.2);
      const tk = easeOut(range(t, 17.6, 17.9)) * (1 - smooth(range(t, 19.2, 19.5))); ton.position.copy(cutBlock.position).add(V(0, 1.0, 0.2)); ton.scale.set(0.9 * tk, 0.39 * tk, 1); ton.material.opacity = tk; ton.visible = tk > 0.01;
      heroJug.visible = t > 25.8; heroJug.position.copy(hero.j.rWr.localToWorld(V(0, -0.1, 0))); heroJug.rotation.set(0, 0, 0.3);
      beers.forEach((j, i) => j.visible = !(i === 2 && t > 25.8));
      fx.pay.position.copy(TABLE).add(V(0, 1.4, 0)); fx.pay.update(t - 25.8);
      // ---------- camera ----------
      const S = (x, y, z) => V(x, y, z);
      const KEYS = [
        [0, S(sx + 3.4, 2.2, 8.6), S(sx + 2.6, 1.0, 0)], [3.4, S(sx + 3.0, 2.0, 7.6), S(sx + 2.4, 1.0, 0)],
        [5.0, S(sx + 3.5, 3.0, 9.6), S(8, 1.4, -7)], [8.8, S(sx + 4.0, 3.8, 10.4), S(9, 3.0, -12)],
        [10.2, S(sx + 9.5, 1.7, 5.4), S(sx + 4.5, 1.0, 0)], [12.6, S(sx + 9.0, 1.7, 5.0), S(sx + 4.6, 1.0, 0)],
        [13.6, S(QUARRY.x + 1.4, 1.7, QUARRY.z + 4.2), S(QUARRY.x, 1.0, QUARRY.z)], [18.8, S(QUARRY.x + 1.0, 1.8, QUARRY.z + 4.4), S(QUARRY.x + 0.2, 1.0, QUARRY.z)],
        [20.0, S(sx + 3.2, 1.8, 5.2), S(sx + 1.4, 0.7, 0.3)], [24.2, S(sx + 3.6, 1.8, 5.0), S(sx + 1.6, 0.7, 0.3)],
        [25.4, S(TABLE.x + 0.6, 1.9, TABLE.z + 5.8), S(TABLE.x, 1.0, TABLE.z + 0.4)], [28.9, S(TABLE.x + 0.7, 1.9, TABLE.z + 5.6), S(TABLE.x, 1.0, TABLE.z + 0.4)],
      ];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = KEYS[i][1].clone().lerp(KEYS[i + 1][1], k), lk = KEYS[i][2].clone().lerp(KEYS[i + 1][2], k);
      const sh = shake(t, 0.6, 3);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-4, 9, 4));
      sunS.position.copy(c.position).add(V(40, 6 + 20 * smooth(range(t, 9, 13)), -120)); sunS.scale.setScalar(30); sunS.material.opacity = dawn;
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      noChain.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.1).addScaledVector(rt, 0.15); noChain.set(0.17 * easeOut(range(t, 3.6, 3.85)) * (1 - smooth(range(t, 4.9, 5.2))), smooth(range(t, 3.98, 4.12)));
      noChain.renderOrder = 30;
      const ck2 = smooth(range(t, 11.0, 11.3)) * (1 - smooth(range(t, 12.9, 13.2)));
      const n = Math.max(1, Math.round(lerp(1, 20, easeOut(range(t, 11.2, 12.3))))); if (counter.material.map !== cnt(n)) { counter.material.map = cnt(n); counter.material.needsUpdate = true; }
      counter.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.2); counter.scale.set(0.3 * ck2, 0.117 * ck2, 1); counter.material.opacity = ck2; counter.visible = ck2 > 0.01;
      payday.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.12); payday.set(t > 27.0 ? easeOut(range(t, 27.0, 27.16)) : 0);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 3.4, 'PYRAMID WORKERS', 'A DAY?', '#ffd23f', ''],
        [3.55, 4.95, 'WORKERS', 'NOT SLAVES', '#ff6b5b', ''], [4.95, 8.9, 'WORKERS', 'PAID + VILLAGE', '#ffd23f', 'next to the pyramid'],
        [9.24, 10.57, 'EVERY DAY', 'SUNRISE', '#ffb36b', ''], [10.57, 13.3, 'EVERY DAY', 'TEAMS OF 20', '#ffd23f', ''],
        [13.5, 16.9, 'QUARRY', 'COPPER TOOLS', '#c87533', 'cut limestone'], [16.9, 19.3, 'QUARRY', '2+ TONS', '#ffd23f', 'per block'],
        [19.4, 21.52, 'HAULING', 'WOODEN SLEDS', '#c9a46a', ''], [21.52, 24.6, 'HAULING', 'WET THE SAND', '#5ab8ff', 'it slides easier'],
        [24.77, 28.9, 'THE PAY', 'BREAD + BEER', '#ffd23f', 'lots of beer'],
      ];
      const cu = CARDS.find(([a2, b]) => t >= a2 && t < b); let ck = 0;
      if (cu) { card.set(cu[2], cu[3], cu[4], null, cu[5]); const grp = CARDS.filter(x => x[2] === cu[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk = 1 + 0.09 * Math.exp(-(t - cu[0]) * 9); card.scale.set(0.72 * pk, 0.281 * pk, 1); }
      card.material.opacity = ck; card.visible = false;
      return { dof: { focus: 5, aperture: 0, maxblur: 0 }, bloom: 0.4, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
