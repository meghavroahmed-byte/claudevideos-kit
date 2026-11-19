import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { infoCard, burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { stamp, iconBubble, fish } from './ancient.js';
import { cloud } from './room.js';

export const DURATION = 31.9;
export const CAPTIONS = [
  [0.0, 'What would happen'], [0.95, 'if you were lost at sea'], [2.36, 'on a tiny raft?'],
  [4.17, 'Day one'], [5.17, 'the sun burns your skin'], [6.87, "and you're already thirsty"], [8.89, 'But never drink seawater'], [10.82, 'The salt makes you'], [11.82, 'even more dehydrated'],
  [13.99, 'Day two'], [14.99, 'you feel weak and dizzy'], [17.04, 'Collect rainwater'], [17.99, 'any way you can'],
  [19.64, 'Day three'], [20.68, 'your body is running out'], [22.01, 'of energy'], [22.93, 'Fish can keep you alive'],
  [24.83, 'And the best way'], [25.45, 'to get rescued?'], [26.6, 'Stay with your raft'], [27.93, 'and use a mirror'], [28.94, 'to flash sunlight'], [29.96, 'at passing ships', 31.7],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const SIT = { drop: -0.72, lHip: [-1.45, 0, 0.25], lKn: [1.0, 0, 0], rHip: [-1.45, 0, -0.25], rKn: [1.0, 0, 0], lAn: [-0.3, 0, 0], rAn: [-0.3, 0, 0] };
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const DAYS = [[0, 1], [13.9, 2], [19.6, 3]];
function dayHud() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 220; const g = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false })); s.renderOrder = 31; let last = -1;
  s.set = (d) => { if (d === last) return; last = d; g.clearRect(0, 0, 512, 220); g.fillStyle = 'rgba(6,20,36,0.7)'; g.beginPath(); g.roundRect(6, 6, 500, 208, 36); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(90, 110, 44, 0, 7); g.fill(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; g.fillRect(90 + Math.cos(a) * 62 - 6, 110 + Math.sin(a) * 62 - 6, 12, 12); }
    g.font = "400 108px Brand, sans-serif"; g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(`DAY ${d}`, 180, 116); t.needsUpdate = true; };
  s.set(1); return s;
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 5, sunDir: [-4, 9, 3], sun: 2.8 });
  const u = scene.userData.sky.material.uniforms;
  scene.fog = new THREE.Fog(0xbfd8e8, 40, 260);
  const key = scene.userData.key;
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.85;
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const ot = canvasTex(256, 256, (g) => { g.fillStyle = '#1f6f9f'; g.fillRect(0, 0, 256, 256); const r = rng(2); for (let i = 0; i < 300; i++) { g.strokeStyle = `rgba(255,255,255,${0.06 + r() * 0.14})`; g.lineWidth = 1 + r() * 2; const x = r() * 256, y = r() * 256; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y - 3, x + 20, y); g.stroke(); } });
  ot.wrapS = ot.wrapT = THREE.RepeatWrapping; ot.repeat.set(80, 80);
  const og = new THREE.PlaneGeometry(600, 600, 120, 120);
  const ocean = new THREE.Mesh(og, new THREE.MeshStandardMaterial({ map: ot, roughness: 0.15, metalness: 0.1 })); ocean.rotation.x = -Math.PI / 2; ocean.receiveShadow = true; scene.add(ocean);
  const OP = og.attributes.position, OX = Float32Array.from(OP.array);
  const swell = (x, z, t) => Math.sin(x * 0.18 + t * 0.9) * 0.18 + Math.sin(z * 0.23 - t * 0.7) * 0.14 + Math.sin((x + z) * 0.5 + t * 1.6) * 0.04;
  // raft
  const raft = new THREE.Group(); scene.add(raft);
  const tube = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.2, 16, 40), new THREE.MeshStandardMaterial({ color: 0xff6a1a, roughness: 0.5 })); tube.rotation.x = Math.PI / 2; tube.position.y = 0.12; raft.add(tube);
  const floorM = new THREE.Mesh(new THREE.CircleGeometry(0.95, 32), new THREE.MeshStandardMaterial({ color: 0x2b2b30, roughness: 0.8 })); floorM.rotation.x = -Math.PI / 2; floorM.position.y = 0.02; raft.add(floorM);
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; const rope = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 12), new THREE.MeshStandardMaterial({ color: 0xffffff })); rope.position.set(Math.cos(a) * 1.15, 0.12, Math.sin(a) * 1.15); rope.rotation.y = -a; raft.add(rope); }
  raft.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const hero = makeHuman('casual', { shirt: 0x2a9d8f, jeans: 0x5a6b8a, chestText: 'MR. CLOUD' }); raft.add(hero.root);
  hero.root.position.set(0, 0.05, -0.15);
  const SKIN0 = hero.M.skin.color.clone();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.13, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xe8e8e8, side: THREE.DoubleSide, roughness: 0.4 })); scene.add(cup);
  const cupWater = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), new THREE.MeshStandardMaterial({ color: 0x5ab8ff, roughness: 0.1 })); cupWater.rotation.x = -Math.PI / 2; cup.add(cupWater);
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(0, 0, 0)]), new THREE.LineBasicMaterial({ color: 0xffffff })); scene.add(line);
  const fishM = fish(); fishM.scale.setScalar(2.4); scene.add(fishM);
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.09), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.05, side: THREE.DoubleSide })); scene.add(mirror);
  const glint = glowSprite(0xffffff, 0.8); scene.add(glint);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.5, 1, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })); scene.add(beam);
  // ship
  const ship = new THREE.Group(); scene.add(ship);
  const hull = new THREE.Mesh(new THREE.BoxGeometry(12, 2.2, 3), new THREE.MeshStandardMaterial({ color: 0x2a3a5a })); hull.position.y = 1.0; ship.add(hull);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(4, 2.2, 2.6), new THREE.MeshStandardMaterial({ color: 0xf2f2f2 })); deck.position.set(-2.5, 3.2, 0); ship.add(deck);
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 2, 16), new THREE.MeshStandardMaterial({ color: 0xe63946 })); funnel.position.set(-2.5, 5.2, 0); ship.add(funnel);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(12.05, 0.3, 3.05), new THREE.MeshStandardMaterial({ color: 0xe63946 })); stripe.position.y = 1.6; ship.add(stripe);
  // weather
  const storm = cloud(); storm.scale.setScalar(4); scene.add(storm);
  const rainDrops = []; for (let i = 0; i < 80; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.25, 4), new THREE.MeshBasicMaterial({ color: 0xbfd2ff, transparent: true })); d.userData = { x: (Math.random() - 0.5) * 3, z: (Math.random() - 0.5) * 3, ph: Math.random() }; scene.add(d); rainDrops.push(d); }
  const dizzy = []; for (let i = 0; i < 4; i++) { const s = glowSprite(0xffe14d, 0.12); scene.add(s); dizzy.push(s); }
  const sunS = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,250,220,1)', 'rgba(255,200,80,0)'), color: 0xffe6a0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false, fog: false })); scene.add(sunS);
  const heatWaves = glowSprite(0xff7a30, 2.5); scene.add(heatWaves);
  const thirsty = iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#5ab8ff'; g.beginPath(); g.moveTo(256, 70); g.bezierCurveTo(380, 240, 400, 300, 400, 330); g.arc(256, 330, 144, 0, Math.PI); g.bezierCurveTo(112, 300, 132, 240, 256, 70); g.fill(); g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(200, 300, 25, 50, -0.3, 0, 7); g.fill(); }));
  const salt = iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#ffffff'; for (let i = 0; i < 14; i++) { const x = 140 + (i % 5) * 60, y = 180 + Math.floor(i / 5) * 70; g.save(); g.translate(x, y); g.rotate(i); g.fillRect(-22, -22, 44, 44); g.restore(); } g.strokeStyle = '#9ab'; g.lineWidth = 4; g.strokeRect(120, 150, 280, 220); }));
  scene.add(thirsty, salt);
  const dh = dayHud(); scene.add(dh);
  const fx = { splash: burst(0xdff2ff, 60, 1), fish: burst(0xdff2ff, 60, 2), ship: burst(0xffe14d, 90, 3) };
  Object.values(fx).forEach(f => scene.add(f));
  const never = stamp('NEVER!', '#ff2a2a', 0.42); scene.add(never);
  const saved = stamp('RESCUED!', '#5be37d', 0.55); scene.add(saved);
  const card = infoCard(); scene.add(card);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      ot.offset.set(t * 0.004, t * 0.006);
      for (let i = 0; i < OP.count; i++) { const x = OX[i * 3], y = OX[i * 3 + 1]; OP.setZ(i, swell(x, -y, t)); }
      OP.needsUpdate = true; og.computeVertexNormals();
      const day = t < 13.9 ? 1 : t < 19.6 ? 2 : 3; dh.set(day);
      // sky per day: bright -> grey rain -> pale
      const rainK = smooth(range(t, 15.8, 16.6)) * (1 - smooth(range(t, 19.2, 19.8)));
      const top = new THREE.Color(0x2b7ad6).lerp(new THREE.Color(0x4a5566), rainK), mid = new THREE.Color(0x6aaee8).lerp(new THREE.Color(0x7a8494), rainK), hor = new THREE.Color(0xd6ebf6).lerp(new THREE.Color(0xa0a8b0), rainK);
      u.top.value.copy(top); u.mid.value.copy(mid); u.horizon.value.copy(hor); u.floorC.value.set(0x2a6f9a); scene.fog.color.copy(hor);
      key.intensity = 2.8 * (1 - 0.6 * rainK); hemi.intensity = 0.85;
      // raft bobbing on the swell
      raft.position.set(0, swell(0, 0, t) + 0.02, 0); raft.rotation.set(Math.sin(t * 0.9) * 0.06, t * 0.05, Math.sin(t * 0.7 + 1) * 0.05);
      // ---------- hero ----------
      const burn = smooth(range(t, 5.2, 6.4)) * (1 - 0.4 * smooth(range(t, 24, 26)));
      hero.M.skin.color.copy(SKIN0).lerp(new THREE.Color(0xe0644a), burn * 0.4);
      const scoop = smooth(range(t, 8.6, 9.1)) * (1 - smooth(range(t, 10.4, 10.8)));
      const sway = smooth(range(t, 14.9, 15.3)) * (1 - smooth(range(t, 17.0, 17.4)));
      const collect = smooth(range(t, 17.0, 17.4)) * (1 - smooth(range(t, 19.4, 19.8)));
      const fishK = smooth(range(t, 22.2, 22.6)) * (1 - smooth(range(t, 24.6, 25.0)));
      const flash = smooth(range(t, 27.9, 28.3));
      let pose = over(SIT, { spine: [0.1 + 0.25 * scoop, 0, Math.sin(t * 2.2) * 0.15 * sway], neck: [0.15 + 0.3 * scoop, Math.sin(t * 1.6) * 0.3 * (1 - flash), Math.sin(t * 2.2 + 1) * 0.2 * sway], lSh: [-0.5, 0, 0.25], lEl: [-0.8, 0, 0], rSh: [-0.5, 0, -0.25], rEl: [-0.8, 0, 0], chest: [Math.sin(t * 1.4) * 0.02, 0, 0] });
      if (t < 4.0) pose = over(pose, { neck: [-0.15, Math.sin(t * 1.2) * 0.6, 0] });
      if (t > 6.9 && t < 8.5) pose = over(pose, { rSh: [-1.6, 0, -0.1], rEl: [-1.5, 0, 0], neck: [-0.2, 0, 0] });   // wipes forehead, thirsty
      if (scoop > 0) pose = over(pose, { rSh: [lerp(-0.5, -0.9, scoop), 0, lerp(-0.25, -0.9, scoop)], rEl: [-0.2, 0, 0] });
      if (collect > 0) pose = over(pose, { lSh: [-1.6 * collect, 0, 0.25], rSh: [-1.6 * collect, 0, -0.25], lEl: [-0.9 * collect, 0, 0], rEl: [-0.9 * collect, 0, 0], neck: [-0.4 * collect, 0, 0] });
      if (fishK > 0) pose = over(pose, { rSh: [-1.4 - 0.6 * smooth(range(t, 22.9, 23.3)), 0, -0.3], rEl: [-0.3, 0, 0], lSh: [-1.1, 0, 0.2], lEl: [-0.6, 0, 0] });
      if (t > 25.0) { const wave = smooth(range(t, 26.6, 27.0)) * (1 - flash); pose = over(pose, { lSh: [-2.7 * wave - 1.2 * flash, 0, 0.3 + Math.sin(t * 8) * 0.3 * wave], lEl: [-0.2, 0, 0], rSh: [-1.35 * flash, 0.2, -0.2], rEl: [-0.6 * flash, 0, 0], neck: [-0.1, -0.4 * flash, 0], spine: [-0.05, -0.3 * flash, 0] }); }
      hero.setPose(pose); hero.setMouth(0.15 + 0.3 * sway + (t > 26.5 ? 0.35 : 0));
      scene.updateMatrixWorld(true);
      const rh = hero.j.rWr.localToWorld(V(0, -0.08, 0)), lh = hero.j.lWr.localToWorld(V(0, -0.08, 0)), head = hero.j.head.localToWorld(V(0, 0.12, 0));
      // cup: seawater scoop, then rain collecting
      cup.visible = scoop > 0.01 || collect > 0.01; cup.position.copy(scoop > 0.01 ? rh : rh.clone().lerp(lh, 0.5).add(V(0, 0.06, 0))); cup.rotation.set(0, 0, 0);
      cupWater.position.y = scoop > 0.01 ? 0.04 : lerp(-0.06, 0.05, smooth(range(t, 17.6, 19.2))); cupWater.material.color.set(scoop > 0.01 ? 0x3a8ab0 : 0x7fd3ff);
      fx.splash.position.copy(rh).setY(0.05); fx.splash.update(t - 9.0);
      // fishing line + fish
      const tipP = rh.clone().add(V(0.0, 0.1, 0.6));
      const fishY = t < 22.95 ? -0.3 : lerp(-0.3, 0.9, easeOut(range(t, 22.95, 23.5)));
      const fp = V(tipP.x + 0.35, fishY, tipP.z + 0.5 * (1 - smooth(range(t, 23.2, 23.8))));
      line.visible = fishK > 0.01; line.geometry.setFromPoints([rh, fp]);
      fishM.visible = fishK > 0.01 && t > 22.9; fishM.position.copy(fp); fishM.rotation.set(Math.PI / 2, 0, Math.sin(t * 25) * 0.4);
      fx.fish.position.copy(fp).setY(0.05); fx.fish.update(t - 22.95);
      // mirror flash toward the ship
      const SHIP = V(-30 + 8 * smooth(range(t, 25.0, 31.9)), 0, -40);
      ship.position.copy(SHIP).setY(swell(SHIP.x, SHIP.z, t) * 0.3); ship.rotation.y = lerp(0, 0.6, smooth(range(t, 30.0, 31.5))); ship.visible = t > 24.5;
      mirror.visible = t > 27.9; mirror.position.copy(rh); mirror.lookAt(SHIP.clone().add(V(0, 3, 0)));
      const fl = flash * (0.6 + 0.4 * Math.max(0, Math.sin(t * 9)));
      glint.position.copy(rh); glint.material.opacity = fl; glint.scale.setScalar(0.5 + fl * 0.8);
      const bd = SHIP.clone().add(V(0, 3, 0)).sub(rh), bl = bd.length(); beam.position.copy(rh).addScaledVector(bd, 0.5); beam.scale.set(1, bl, 1); beam.quaternion.setFromUnitVectors(V(0, 1, 0), bd.clone().normalize().negate()); beam.material.opacity = 0.22 * fl; beam.visible = fl > 0.01;
      fx.ship.position.copy(SHIP).add(V(0, 6, 0)); fx.ship.update(t - 30.6);
      // weather / fx
      storm.position.set(0.2, 3.2, -0.2); storm.visible = rainK > 0.01; storm.scale.setScalar(4 * Math.max(0.001, rainK)); storm.update(t);
      rainDrops.forEach(d => { const u2 = (t * 1.6 + d.userData.ph) % 1; d.position.set(d.userData.x, 2.8 - u2 * 2.8, d.userData.z); d.material.opacity = rainK * 0.7; d.visible = rainK > 0.01; });
      dizzy.forEach((s, i) => { const a = t * 4 + i * 1.57; s.position.copy(head).add(V(Math.cos(a) * 0.22, 0.12, Math.sin(a) * 0.22)); s.material.opacity = sway; });
      const sunDir = V(-0.25, 0.55, -1).normalize(); sunS.position.copy(c.position).addScaledVector(sunDir, 150); sunS.scale.setScalar(26); sunS.material.opacity = 1 - rainK;
      heatWaves.position.copy(head).add(V(0, 0.2, 0)); heatWaves.material.opacity = 0.35 * smooth(range(t, 5.2, 5.8)) * (1 - smooth(range(t, 8.4, 8.9)));
      thirsty.position.copy(head).add(V(0.5, 0.25, 0)); thirsty.set(0.4 * easeOut(range(t, 7.2, 7.45)) * (1 - smooth(range(t, 8.4, 8.7))), 0);
      salt.position.copy(head).add(V(0.5, 0.25, 0)); salt.set(0.4 * easeOut(range(t, 10.9, 11.15)) * (1 - smooth(range(t, 13.5, 13.8))), smooth(range(t, 12.5, 12.65)));
      // ---------- camera: slow orbit of the raft ----------
      const KEYS = [[0, 0.9, 9.5, 3.4, 0.8], [3.0, 0.7, 6.5, 2.4, 0.8], [6.0, 0.35, 4.6, 1.9, 0.75], [9.0, 0.1, 4.0, 1.6, 0.6], [13.0, -0.3, 4.4, 1.8, 0.7], [16.0, -0.7, 5.6, 2.8, 1.2], [19.6, -1.0, 4.4, 1.8, 0.7], [23.0, -1.3, 4.2, 1.7, 0.7], [25.0, -1.0, 7.5, 3.0, 0.9], [28.0, -0.6, 6.0, 2.1, 0.9], [31.9, -0.45, 6.6, 2.3, 1.0]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0])), L = (j) => lerp(KEYS[i][j], KEYS[i + 1][j], k);
      const ang = L(1), rad = L(2), cy = L(3), ly = L(4);
      let cp = V(Math.sin(ang) * rad, cy, Math.cos(ang) * rad), lk = V(0, ly, 0);
      if (t > 24.8) { const e = smooth(range(t, 24.8, 26.4)); cp = cp.lerp(V(3.0, 2.0, 5.4).lerp(V(2.8, 1.9, 5.0), smooth(range(t, 26.4, 31.9))), e); lk = lk.lerp(V(-8, 0.6, -12), e); }
      const sh = shake(t, 0.7, 4);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z], Math.sin(t * 0.9) * 0.02);
      c.updateMatrixWorld(true);
      key.target.position.set(0, 0, 0); key.position.set(-4, 9, 3);
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const hk = smooth(range(t, 4.1, 4.4));
      dh.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.26).addScaledVector(rt, 0.2); dh.scale.set(0.28 * hk, 0.12 * hk, 1); dh.material.opacity = hk; dh.visible = hk > 0.01;
      const pop = (a) => 1 + 0.15 * Math.exp(-Math.max(0, t - a) * 8) * (t > a ? 1 : 0); dh.scale.multiplyScalar(pop(13.99) * pop(19.64));
      never.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.05); never.set(t > 9.05 ? easeOut(range(t, 9.05, 9.2)) * (1 - smooth(range(t, 10.4, 10.7))) : 0);
      saved.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.05); saved.set(t > 30.6 ? easeOut(range(t, 30.6, 30.76)) : 0);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 4.0, 'WHAT IF', 'LOST AT SEA?', '#ffffff', 'on a tiny raft'],
        [5.17, 8.89, 'DAY 1', 'SUNBURN + THIRST', '#ffb36b', ''], [8.89, 13.8, 'DAY 1', 'NO SEAWATER', '#ff4a4a', 'salt dehydrates you'],
        [14.99, 17.04, 'DAY 2', 'WEAK + DIZZY', '#ffd23f', ''], [17.04, 19.5, 'DAY 2', 'CATCH RAIN', '#7fd3ff', 'any way you can'],
        [20.68, 22.93, 'DAY 3', 'NO ENERGY', '#ff9a5a', ''], [22.93, 24.7, 'DAY 3', 'EAT FISH', '#8fd3ff', 'keeps you alive'],
        [26.6, 27.93, 'GET RESCUED', 'STAY WITH RAFT', '#5be37d', ''], [27.93, 31.9, 'GET RESCUED', 'MIRROR FLASH', '#ffe14d', 'at passing ships'],
      ];
      const cu = CARDS.find(([a2, b]) => t >= a2 && t < b); let ck = 0;
      if (cu) { card.set(cu[2], cu[3], cu[4], null, cu[5]); const grp = CARDS.filter(x => x[2] === cu[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk = 1 + 0.09 * Math.exp(-(t - cu[0]) * 9); card.scale.set(0.72 * pk, 0.281 * pk, 1); }
      card.material.opacity = ck; card.visible = ck > 0.01;
      const fd = cp.distanceTo(lk);
      return { dof: { focus: fd, aperture: 0.0008, maxblur: 0.004 }, bloom: 0.45, exposure: 1.0 - 0.15 * rainK };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
