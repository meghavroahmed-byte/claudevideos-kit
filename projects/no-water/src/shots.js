import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { infoCard, burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { world, grass, rock, stamp, iconBubble } from './ancient.js';
import { brainBubble } from './room.js';
import { heartSprite } from './snake.js';

export const DURATION = 31.2;
export const CAPTIONS = [
  [0.0, 'How long can you survive'], [1.38, 'without water?'],
  [2.62, 'Your body is about'], [3.62, '60 percent water'], [5.2, 'and you lose some every minute'], [6.99, 'just by breathing'], [8.03, 'and sweating'],
  [9.29, 'After one day'], [10.35, 'you feel thirsty'], [11.57, 'tired'], [12.28, 'and get a headache'],
  [13.63, 'After two days'], [14.68, 'your mouth dries up'], [16.03, 'your skin wrinkles'], [17.39, 'and your heart beats faster'], [18.82, 'to push thicker blood'],
  [20.6, 'By day three'], [21.7, 'your kidneys start shutting down'], [23.63, 'and your brain gets confused'],
  [25.72, 'Most people can only survive'], [27.42, 'about three days'], [28.53, 'without water'], [29.62, 'So drink up!', 31.0],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const WALK = (p, a = 1) => { const s = Math.sin(p); return { lHip: [-0.4 * s * a, 0, 0.05], rHip: [0.4 * s * a, 0, -0.05], lKn: [(0.15 + 0.5 * Math.max(0, Math.sin(p + 1.3))) * a, 0, 0], rKn: [(0.15 + 0.5 * Math.max(0, Math.sin(p + 1.3 + Math.PI))) * a, 0, 0], lSh: [0.35 * s * a, 0, 0.15], rSh: [-0.35 * s * a, 0, -0.15], lEl: [-0.4, 0, 0], rEl: [-0.4, 0, 0], drop: -0.02 + Math.abs(Math.cos(p)) * 0.02 }; };
const KNEEL = { drop: -0.5, lHip: [-1.45, 0, 0.1], lKn: [1.5, 0, 0], rHip: [-0.05, 0, -0.08], rKn: [1.55, 0, 0], rAn: [0.6, 0, 0] };
const over = (a, b) => Object.assign({}, a, b);
const mix = (a, b, k) => { const o = {}; for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) { if (key === 'drop') { o.drop = lerp(a.drop || 0, b.drop || 0, k); continue; } const va = a[key] || [0, 0, 0], vb = b[key] || [0, 0, 0]; o[key] = va.map((x, i) => lerp(x, vb[i], k)); } return o; };
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function tankHud() {   // body silhouette filled with water
  const c = document.createElement('canvas'); c.width = 300; c.height = 520; const g = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false })); s.renderOrder = 31; let last = -1;
  const body = () => { g.beginPath(); g.arc(150, 70, 45, 0, 7); g.moveTo(85, 130); g.roundRect(85, 125, 130, 190, 30); g.roundRect(45, 135, 34, 170, 17); g.roundRect(221, 135, 34, 170, 17); g.roundRect(92, 310, 50, 190, 20); g.roundRect(158, 310, 50, 190, 20); };
  s.set = (lvl, col = '#4ab8ff') => { const q = Math.round(lvl * 100); if (q === last) return; last = q; g.clearRect(0, 0, 300, 520);
    g.save(); body(); g.clip(); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(0, 0, 300, 520); const y = 500 - lvl / 0.6 * 0.6 * 480; g.fillStyle = col; g.fillRect(0, y, 300, 520 - y); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, y, 300, 6); g.restore();
    g.strokeStyle = '#ffffff'; g.lineWidth = 6; body(); g.stroke();
    g.font = "400 64px Brand, sans-serif"; g.fillStyle = '#fff'; g.textAlign = 'center'; g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.strokeText(`${q}%`, 150, 250); g.fillText(`${q}%`, 150, 250); t.needsUpdate = true; };
  s.set(0.6); return s;
}
function dayHud() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 220; const g = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false })); s.renderOrder = 31; let last = -1;
  s.set = (d) => { if (d === last) return; last = d; g.clearRect(0, 0, 512, 220); g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 16;
    g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(90, 110, 44, 0, 7); g.fill(); g.font = "400 108px Brand, sans-serif"; g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(`DAY ${d}`, 180, 116); t.needsUpdate = true; };
  s.set(1); return s;
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-3, 10, 3], sun: 3.0 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x3a8ad6); u.mid.value.set(0x8ac0ea); u.horizon.value.set(0xf2e2c0); u.floorC.value.set(0xe0c58a);
  scene.fog = new THREE.Fog(0xf0dcb4, 30, 140);
  const key = scene.userData.key; key.color.set(0xfff0d0);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xfff0dc); hemi.groundColor.set(0xd0a868); hemi.intensity = 0.9;
  scene.add(world(['#e6c98e', ['220,190,130', '236,206,150', '206,176,118']]));
  // dunes
  const dm = new THREE.MeshStandardMaterial({ color: 0xe2c286, roughness: 1 });
  [[-14, -20, 10], [10, -26, 14], [-30, -40, 18], [24, -12, 9], [2, -45, 22], [-20, 6, 8], [22, 10, 10]].forEach(([x, z, s]) => { const d = new THREE.Mesh(new THREE.SphereGeometry(s, 32, 16), dm); d.scale.set(1.6, 0.28, 1); d.position.set(x, -s * 0.12, z); d.receiveShadow = true; scene.add(d); });
  [[2.2, -1.5, 0.6], [-2.8, -3.2, 0.9], [4.5, -6, 1.2]].forEach(([x, z, s], i) => { const k = rock(s, 80 + i, 0xc79a62); k.position.set(x, 0, z); scene.add(k); });
  // cactus
  const cm = new THREE.MeshStandardMaterial({ color: 0x4f8a3a, roughness: 0.7 });
  for (const [x, z] of [[-3.5, -2], [3.8, -4.5], [-6, -8]]) { const g = new THREE.Group(); g.position.set(x, 0, z); const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 1.4, 6, 12), cm); b.position.y = 0.85; g.add(b); for (const s of [1, -1]) { const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.45, 6, 10), cm); a.position.set(s * 0.28, 1.0 + s * 0.15, 0); g.add(a); const a2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.25, 6, 10), cm); a2.position.set(s * 0.18, 0.8 + s * 0.15, 0); a2.rotation.z = Math.PI / 2; g.add(a2); } g.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(g); }
  const hero = makeHuman('casual', { shirt: 0xe76f51, jeans: 0x6b5a3a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const SKIN0 = hero.M.skin.color.clone();
  const bottle = new THREE.Group(); scene.add(bottle);
  const bm = new THREE.MeshPhysicalMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.5, roughness: 0.05 });
  bottle.add(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.2, 16), bm)); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 12), new THREE.MeshStandardMaterial({ color: 0x2b6cff })); cap.position.y = 0.12; bottle.add(cap);
  const bwater = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.17, 16), new THREE.MeshStandardMaterial({ color: 0x4ab8ff, transparent: true, opacity: 0.8 })); bwater.position.y = -0.01; bottle.add(bwater);
  const breaths = []; for (let i = 0; i < 10; i++) { const s = glowSprite(0xffffff, 0.12); s.userData.ph = i / 10; scene.add(s); breaths.push(s); }
  const sweat = []; for (let i = 0; i < 12; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshStandardMaterial({ color: 0x8fd3ff, roughness: 0.1 })); d.userData.ph = i / 12; scene.add(d); sweat.push(d); }
  const ache = []; for (let i = 0; i < 3; i++) { const r2 = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.18, 32), new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); r2.userData.ph = i / 3; scene.add(r2); ache.push(r2); }
  const heart = heartSprite(); scene.add(heart);
  const brain = brainBubble(); scene.add(brain);
  const icons = {
    thirst: iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#5ab8ff'; g.beginPath(); g.moveTo(256, 70); g.bezierCurveTo(380, 240, 400, 300, 400, 330); g.arc(256, 330, 144, 0, Math.PI); g.bezierCurveTo(112, 300, 132, 240, 256, 70); g.fill(); })),
    skin: iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#d99b7a'; g.fillRect(60, 60, 392, 392); g.strokeStyle = '#8a5a40'; g.lineWidth = 6; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(70, 90 + i * 32); for (let x = 70; x < 450; x += 20) g.lineTo(x, 90 + i * 32 + Math.sin(x * 0.08 + i) * 8); g.stroke(); } })),
    kidney: iconBubble(canvasTex(512, 512, (g) => { for (const [x, s] of [[170, 1], [342, -1]]) { g.fillStyle = '#b84a4a'; g.beginPath(); g.ellipse(x, 256, 70, 120, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x + s * 55, 256, 25, 40, 0, 0, 7); g.fill(); } })),
    blood: iconBubble(canvasTex(512, 512, (g) => { for (let i = 0; i < 7; i++) { const x = 130 + (i % 4) * 85 + (i > 3 ? 40 : 0), y = 200 + (i > 3 ? 110 : 0); g.fillStyle = '#c0182a'; g.beginPath(); g.ellipse(x, y, 52, 40, 0.3, 0, 7); g.fill(); g.fillStyle = '#8a0f1c'; g.beginPath(); g.ellipse(x, y, 22, 16, 0.3, 0, 7); g.fill(); } })),
  };
  Object.values(icons).forEach(i => { i.renderOrder = 30; scene.add(i); });
  const tank = tankHud(), dh = dayHud(); scene.add(tank, dh);
  const fx = { drink: burst(0x5ab8ff, 90, 1), ok: burst(0x5be37d, 100, 2) };
  Object.values(fx).forEach(f => scene.add(f));
  const drink = stamp('DRINK UP!', '#4ab8ff', 0.55); scene.add(drink);
  const card = infoCard(); scene.add(card);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      const day = t < 13.6 ? 1 : t < 20.6 ? 2 : 3; dh.set(day);
      // hero walks the desert, slower each day; kneels on day 3; drinks at the end
      const speed = t < 13.6 ? 0.9 : t < 20.6 ? 0.6 : 0.3;
      const z = -(t < 20.6 ? t * 0.55 : 20.6 * 0.55 + (Math.min(t, 22) - 20.6) * 0.2);
      const kneel = smooth(range(t, 21.6, 22.3)) * (1 - smooth(range(t, 30.0, 30.8)));
      const drinkK = smooth(range(t, 29.5, 29.9));
      hero.root.position.set(Math.sin(t * 0.3) * 0.3, 0, z); hero.root.rotation.y = 0;
      let pose = t < 22 ? WALK(t * 6 * speed, 0.6 + 0.4 * speed) : STAND(t);
      pose = over(pose, { spine: [0.1 + (1 - speed) * 0.25, 0, 0], neck: [0.1 + (1 - speed) * 0.3, 0, 0] });
      if (t > 11.6 && t < 13.4) pose = over(pose, { rSh: [-2.3, 0.3, -0.3], rEl: [-2.0, 0, 0] });   // headache: hand to head
      if (t > 17.4 && t < 20.4) pose = over(pose, { lSh: [-1.0, 0, 0.2], lEl: [-1.7, -0.3, 0] });   // hand on heart
      if (kneel > 0) pose = mix(pose, over(KNEEL, { spine: [0.45, 0, Math.sin(t * 1.5) * 0.1], neck: [0.3, Math.sin(t * 2) * 0.3, 0], lSh: [-0.3, 0, 0.2], rSh: [-0.6, 0, -0.2], rEl: [-0.6, 0, 0] }), kneel);
      if (t > 29.0) pose = over(pose, { rSh: [lerp(-0.6, -2.3, drinkK), 0.2, -0.2], rEl: [-1.6 * drinkK, 0, 0], neck: [lerp(0.3, -0.45, drinkK), 0, 0], spine: [lerp(0.45, 0, drinkK), 0, 0] });
      hero.setPose(pose); hero.setMouth(t > 14.6 && t < 16 ? 0.0 : 0.15 + (t > 30.4 ? 0.3 : 0));
      const dry = smooth(range(t, 9, 25)) * (1 - smooth(range(t, 29.9, 30.8)));
      hero.M.skin.color.copy(SKIN0).lerp(new THREE.Color(0xa87a5a), dry * 0.5);
      scene.updateMatrixWorld(true);
      const head = hero.j.head.localToWorld(V(0, 0.12, 0)), mouth = hero.j.head.localToWorld(V(0, 0.02, 0.13)), chest = hero.j.chest.localToWorld(V(0.06, 0.2, 0.22));
      // bottle appears at 29.3 and he drinks
      bottle.visible = t > 29.1; bottle.position.copy(hero.j.rWr.localToWorld(V(0, -0.1, 0.02))); bottle.quaternion.copy(hero.j.rWr.getWorldQuaternion(new THREE.Quaternion())); bottle.scale.setScalar(easeOut(range(t, 29.1, 29.4)) + 0.001);
      bwater.scale.y = Math.max(0.05, 1 - smooth(range(t, 29.9, 31))); fx.drink.position.copy(bottle.position); fx.drink.update(t - 29.2);
      // breathing vapour + sweat (water loss)
      const lossK = smooth(range(t, 5.2, 5.6)) * (1 - smooth(range(t, 9.0, 9.4)));
      breaths.forEach((s, i) => { const u2 = (t * 0.8 + s.userData.ph) % 1; s.position.copy(mouth).add(V(Math.sin(i * 3) * 0.05, u2 * 0.25, 0.1 + u2 * 0.3)); s.material.opacity = lossK * (1 - u2) * 0.6; s.scale.setScalar(0.05 + u2 * 0.15); });
      sweat.forEach((d, i) => { const u2 = (t * 0.9 + d.userData.ph) % 1; const base = hero.j[i % 2 ? 'head' : 'chest'].localToWorld(V((i % 3 - 1) * 0.09, i % 2 ? 0.1 : 0.1, 0.13)); d.position.copy(base).add(V(0, -u2 * 0.9, 0.03 * u2)); d.visible = lossK > 0.05 || (t > 9 && t < 13.5); d.scale.setScalar(1 - u2 * 0.5); });
      ache.forEach(r2 => { const u2 = (t * 1.5 + r2.userData.ph) % 1, k = smooth(range(t, 12.3, 12.6)) * (1 - smooth(range(t, 13.4, 13.7))); r2.position.copy(head); r2.lookAt(head.clone().add(V(0, 0, 1))); r2.scale.setScalar(1 + u2 * 1.5); r2.material.opacity = k * (1 - u2); });
      const hk = smooth(range(t, 17.4, 17.7)) * (1 - smooth(range(t, 20.4, 20.7)));
      heart.position.copy(chest); heart.scale.setScalar(0.18 * hk * (1 + 0.35 * Math.pow(Math.max(0, Math.sin(t * 15)), 4))); heart.material.opacity = hk; heart.visible = hk > 0.01;
      const bk = easeOut(range(t, 23.6, 23.9)) * (1 - smooth(range(t, 25.6, 25.9)));
      if (bk > 0.01) { brain.draw([0, 1, 2, 3, 4].map(i => 0.2 + 0.8 * Math.max(0, Math.sin(t * 11 + i * 2.3)) * (Math.sin(t * 3 + i) > 0 ? 1 : 0.2)), -1, t); brain.position.copy(head).add(V(0.5, 0.15, 0.1)); brain.scale.setScalar(0.45 * bk); }
      brain.visible = bk > 0.01;
      const side = (s2) => head.clone().add(V(0.5 * s2, 0.12, 0.1));
      const ic = (a, b) => easeOut(range(t, a, a + 0.25)) * (1 - smooth(range(t, b, b + 0.3)));
      icons.thirst.position.copy(side(1)); icons.thirst.set(0.38 * ic(10.4, 11.4), 0);
      icons.skin.position.copy(side(1)); icons.skin.set(0.38 * ic(16.0, 17.2), 0);
      icons.blood.position.copy(side(1)); icons.blood.set(0.38 * ic(19.2, 20.4), 0);
      icons.kidney.position.copy(hero.j.spine.localToWorld(V(0.45, 0.1, 0.1))); icons.kidney.set(0.38 * ic(21.8, 23.5), smooth(range(t, 22.6, 22.8)));
      // ---------- camera (walks with him) ----------
      const hz = hero.root.position.z;
      const KEYS = [[0, [3.6, 2.4, 6.2], 1.1], [2.5, [2.6, 1.8, 4.6], 1.05], [9.3, [1.8, 1.6, 4.2], 1.05], [13.6, [-1.6, 1.7, 4.2], 1.05], [20.6, [1.4, 1.5, 3.8], 0.85], [25.7, [2.2, 2.0, 4.6], 0.8], [29.0, [1.4, 1.5, 3.6], 0.9], [31.2, [1.5, 1.55, 3.8], 1.0]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const off = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), ly = lerp(KEYS[i][2], KEYS[i + 1][2], k);
      const cp = V(hero.root.position.x, 0, hz).add(off), lk = V(hero.root.position.x, ly, hz);
      const sh = shake(t, 0.6 + (t > 23.6 && t < 25.7 ? 1.5 : 0), 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z], (t > 23.6 && t < 25.7 ? Math.sin(t * 2) * 0.06 : 0));
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-3, 10, 3));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const tk = smooth(range(t, 2.7, 3.0)) * (1 - smooth(range(t, 28.8, 29.1)));
      const lvl = t < 9.3 ? 0.6 : lerp(0.6, 0.48, smooth(range(t, 9.3, 28.5)));
      tank.set(t > 29.9 ? lerp(lvl, 0.6, smooth(range(t, 29.9, 31))) : lvl, lvl < 0.53 ? '#ff9a5a' : '#4ab8ff');
      tank.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.12).addScaledVector(rt, -0.26); tank.scale.set(0.13 * tk, 0.225 * tk, 1); tank.material.opacity = tk; tank.visible = tk > 0.01;
      const dk = smooth(range(t, 9.2, 9.5));
      dh.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.14).addScaledVector(rt, 0.2); dh.scale.set(0.26 * dk, 0.112 * dk, 1); dh.material.opacity = dk; dh.visible = dk > 0.01;
      drink.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.1); drink.set(t > 29.6 ? easeOut(range(t, 29.6, 29.76)) : 0);
      fx.ok.position.copy(c.position).addScaledVector(fw, 2.4); fx.ok.update(t - 29.7);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 2.6, 'NO WATER?', 'HOW LONG?', '#4ab8ff', 'could you survive'],
        [2.62, 5.2, 'YOUR BODY', '60% WATER', '#4ab8ff', ''], [5.2, 9.2, 'YOUR BODY', 'LOSES WATER', '#8fd3ff', 'breathing + sweating'],
        [9.29, 13.5, 'DAY 1', 'THIRST + HEADACHE', '#ffd23f', 'and tired'],
        [13.63, 17.39, 'DAY 2', 'DRY + WRINKLED', '#ff9a5a', ''], [17.39, 20.5, 'DAY 2', 'HEART RACES', '#ff4a4a', 'thicker blood'],
        [20.6, 23.63, 'DAY 3', 'KIDNEYS FAIL', '#ff4a4a', ''], [23.63, 25.6, 'DAY 3', 'CONFUSED', '#c58aff', ''],
        [25.72, 29.5, 'LIMIT', '~3 DAYS', '#ffffff', 'without water'],
      ];
      const cu = CARDS.find(([a2, b]) => t >= a2 && t < b); let ck = 0;
      if (cu) { card.set(cu[2], cu[3], cu[4], null, cu[5]); const grp = CARDS.filter(x => x[2] === cu[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk = 1 + 0.09 * Math.exp(-(t - cu[0]) * 9); card.scale.set(0.72 * pk, 0.281 * pk, 1); }
      card.material.opacity = ck; card.visible = false;
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.35, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
