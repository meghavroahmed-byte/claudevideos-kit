import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { infoCard, burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { stamp, iconBubble } from './ancient.js';

export const DURATION = 28.7;
export const CAPTIONS = [
  [0.0, 'What was life like'], [1.14, 'for a Roman gladiator?'],
  [3.06, 'Most gladiators were'], [4.22, 'slaves or prisoners'], [5.88, 'but some were free men'], [7.02, 'who signed up'], [7.73, 'for fame and money'],
  [9.4, 'They trained every day'], [10.63, 'at special schools'], [11.91, 'and ate a diet'], [12.72, 'of barley and beans'], [14.01, 'to build a layer of fat'], [15.4, 'that protected them from cuts'],
  [17.46, 'And unlike in the movies'], [19.19, "most fights didn't end in death"], [21.58, 'Gladiators were expensive'], [23.25, 'so a fallen fighter'], [24.33, 'was often spared'],
  [25.28, 'And the crowd'], [26.54, 'helped decide his fate', 28.5],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const WALK = (p, a = 1) => { const s = Math.sin(p); return { lHip: [-0.4 * s * a, 0, 0.05], rHip: [0.4 * s * a, 0, -0.05], lKn: [(0.15 + 0.5 * Math.max(0, Math.sin(p + 1.3))) * a, 0, 0], rKn: [(0.15 + 0.5 * Math.max(0, Math.sin(p + 1.3 + Math.PI))) * a, 0, 0], lSh: [0.35 * s * a, 0, 0.15], rSh: [-0.35 * s * a, 0, -0.15], lEl: [-0.4, 0, 0], rEl: [-0.4, 0, 0], drop: -0.02 + Math.abs(Math.cos(p)) * 0.02 }; };
const KNEEL = { drop: -0.5, lHip: [-1.45, 0, 0.1], lKn: [1.5, 0, 0], rHip: [-0.05, 0, -0.08], rKn: [1.55, 0, 0], rAn: [0.6, 0, 0] };
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const POST = V(-4.5, 0, -2.0);
function helmet(h, crest = 0xb3261e) {
  const m = new THREE.MeshStandardMaterial({ color: 0xc8a050, metalness: 0.85, roughness: 0.3 });
  const g = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 14, 0, Math.PI * 2, 0, 1.6), m); g.position.set(0, 0.11, 0); h.j.head.add(g);
  const brim = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.02, 8, 30), m); brim.rotation.x = Math.PI / 2; brim.position.set(0, 0.1, 0); h.j.head.add(brim);
  const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 20, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: crest, roughness: 0.9 })); cr.rotation.set(0, Math.PI / 2, Math.PI / 2); cr.position.set(0, 0.25, 0); h.j.head.add(cr);
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 7, sunDir: [-4, 10, 5], sun: 2.6 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x2a7ad6); u.mid.value.set(0x62acea); u.horizon.value.set(0xe8e2cc); u.floorC.value.set(0xd8c294);
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const key = scene.userData.key;
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.85;
  // arena: sand floor, wall, stands, crowd
  const sandT = canvasTex(512, 512, (g) => { g.fillStyle = '#dcc394'; g.fillRect(0, 0, 512, 512); const r = rng(3); for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '190,166,120' : '236,214,170'},0.4)`; g.fillRect(r() * 512, r() * 512, 2, 2); } });
  sandT.wrapS = sandT.wrapT = THREE.RepeatWrapping; sandT.repeat.set(6, 6);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 64), new THREE.MeshStandardMaterial({ map: sandT, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const stoneT = canvasTex(256, 128, (g) => { g.fillStyle = '#c8b694'; g.fillRect(0, 0, 256, 128); g.strokeStyle = 'rgba(100,84,60,0.5)'; g.lineWidth = 3; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) g.strokeRect(c * 64 + (r % 2) * 32, r * 32, 64, 32); g.fillStyle = '#5a3a2a'; for (let i = 0; i < 8; i++) { g.beginPath(); g.ellipse(16 + i * 32, 70, 10, 22, 0, 0, 7); g.fill(); } });
  stoneT.wrapS = THREE.RepeatWrapping; stoneT.repeat.set(30, 1);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 3, 96, 1, true), new THREE.MeshStandardMaterial({ map: stoneT, side: THREE.BackSide, roughness: 0.9 })); wall.position.y = 1.5; scene.add(wall);
  const sm = new THREE.MeshStandardMaterial({ color: 0xbfae8e, roughness: 0.95, side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) { const r = 16.5 + i * 1.5, y = 3 + i * 1.1; const step = new THREE.Mesh(new THREE.CylinderGeometry(r + 1.5, r + 1.5, 0.3, 96, 1, true), sm); step.position.y = y; scene.add(step); const tread = new THREE.Mesh(new THREE.RingGeometry(r, r + 1.5, 96), sm); tread.rotation.x = -Math.PI / 2; tread.position.y = y + 0.15; scene.add(tread); }
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(27, 27, 14, 96, 1, true), new THREE.MeshStandardMaterial({ map: stoneT, side: THREE.BackSide })); outer.position.y = 7; scene.add(outer);
  // crowd (instanced)
  const N = 1400, cr = rng(5);
  const bodyG = new THREE.CapsuleGeometry(0.18, 0.4, 3, 8); bodyG.translate(0, 0.45, 0);
  const headG = new THREE.SphereGeometry(0.13, 10, 8); headG.translate(0, 0.95, 0);
  const crowdB = new THREE.InstancedMesh(bodyG, new THREE.MeshStandardMaterial({ roughness: 0.8 }), N), crowdH = new THREE.InstancedMesh(headG, new THREE.MeshStandardMaterial({ color: 0xc68642, roughness: 0.7 }), N);
  const CP = [];
  for (let i = 0; i < N; i++) { const row = i % 6, a = cr() * Math.PI * 2, r = 17.2 + row * 1.5; CP.push({ a, r, y: 3.15 + row * 1.1, ph: cr() * 6.28 }); crowdB.setColorAt(i, new THREE.Color().setHSL(cr(), 0.5, 0.45 + cr() * 0.25)); }
  scene.add(crowdB, crowdH);
  const mt = new THREE.Matrix4(), q = new THREE.Quaternion();
  const cloths = []; for (let i = 0; i < 70; i++) { const p = CP[i * 17 % N]; const s = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.25), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide })); s.userData = p; scene.add(s); cloths.push(s); }
  // training post + food
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.9, 12), new THREE.MeshStandardMaterial({ color: 0x8a6a44, roughness: 0.9 })); post.position.copy(POST).add(V(0, 0.95, 0)); post.castShadow = true; scene.add(post);
  const bowl = new THREE.Group(); bowl.position.copy(POST).add(V(1.4, 0, 2.4)); scene.add(bowl);
  const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.7, 16), new THREE.MeshStandardMaterial({ color: 0x8a6a44 })); bt.position.y = 0.35; bowl.add(bt);
  const bw = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xa0522d, side: THREE.DoubleSide })); bw.position.y = 0.88; bowl.add(bw);
  for (let i = 0; i < 18; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xd8b26a : 0x8a4a2a })); b.position.set((Math.random() - 0.5) * 0.18, 0.86, (Math.random() - 0.5) * 0.18); bowl.add(b); }
  // fighters
  const hero = makeHuman('hide', { plain: true, shirt: 0xb3261e, belt: 0xc8a050, chestText: 'MR. CLOUD' }); scene.add(hero.root); helmet(hero, 0xffd23f);
  const foe = makeHuman('hide', { plain: true, shirt: 0x2a6f9a, belt: 0x6b4a2e, skin: 0x8d5524, hair: 0x111111 }); scene.add(foe.root); helmet(foe, 0x2a6f9a);
  const swordM = new THREE.MeshStandardMaterial({ color: 0xd8dee6, metalness: 0.9, roughness: 0.2 });
  const sword = new THREE.Group(); const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 0.012), swordM); blade.position.y = 0.32; sword.add(blade); const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8), new THREE.MeshStandardMaterial({ color: 0x5a3a20 })); sword.add(hilt); const guard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 0.04), new THREE.MeshStandardMaterial({ color: 0xc8a050, metalness: 0.8 })); guard.position.y = 0.06; sword.add(guard); scene.add(sword);
  const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.8, 24, 1, true, -0.7, 1.4), new THREE.MeshStandardMaterial({ color: 0xb3261e, side: THREE.DoubleSide, roughness: 0.6 })); scene.add(shield);
  const boss = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshStandardMaterial({ color: 0xc8a050, metalness: 0.9, roughness: 0.3 })); scene.add(boss);
  const trident = new THREE.Group(); const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.8, 8), new THREE.MeshStandardMaterial({ color: 0x8a6a44 })); trident.add(shaft); for (const x of [-0.06, 0, 0.06]) { const p = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.2, 6), swordM); p.position.set(x, 1.0, 0); trident.add(p); } scene.add(trident);
  [sword, shield, trident, boss].forEach(o => o.traverse(m => { if (m.isMesh) m.castShadow = true; }));
  // icons + hud
  const ic = {
    chain: iconBubble(canvasTex(512, 512, (g) => { g.strokeStyle = '#8a8f96'; g.lineWidth = 28; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(120 + i * 90, 256, 55, 32, 0, 0, 7); g.stroke(); } })),
    fame: iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#ffd23f'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 80 : 180; g.lineTo(256 + Math.cos(a) * r, 236 + Math.sin(a) * r); } g.fill(); g.fillStyle = '#c99a1e'; g.beginPath(); g.arc(360, 380, 70, 0, 7); g.fill(); g.fillStyle = '#f2c94c'; g.beginPath(); g.arc(360, 372, 66, 0, 7); g.fill(); })),
    fat: iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#e8b090'; g.fillRect(90, 120, 332, 60); g.fillStyle = '#ffe08a'; g.fillRect(90, 180, 332, 110); g.fillStyle = '#c0485a'; g.fillRect(90, 290, 332, 110); g.font = "400 40px Brand, sans-serif"; g.fillStyle = '#5a3a1a'; g.textAlign = 'center'; g.fillText('FAT', 256, 248); g.fillStyle = '#fff'; g.fillText('MUSCLE', 256, 358); g.strokeStyle = '#ff2a2a'; g.lineWidth = 10; g.beginPath(); g.moveTo(130, 110); g.lineTo(200, 205); g.stroke(); })),
    coin: iconBubble(canvasTex(512, 512, (g) => { for (let i = 0; i < 5; i++) { g.fillStyle = '#c99a1e'; g.beginPath(); g.ellipse(256, 380 - i * 45, 120, 40, 0, 0, 7); g.fill(); g.fillStyle = '#f2c94c'; g.beginPath(); g.ellipse(256, 370 - i * 45, 120, 40, 0, 0, 7); g.fill(); } })),
  };
  Object.values(ic).forEach(i => { i.renderOrder = 30; scene.add(i); });
  const fx = { hit: [burst(0xffffff, 40, 1), burst(0xffffff, 40, 2), burst(0xffd166, 50, 3)], dust: burst(0xdcc394, 70, 4), cheer: burst(0xffffff, 120, 5) };
  for (const v of Object.values(fx)) (Array.isArray(v) ? v : [v]).forEach(f => scene.add(f));
  const myth = stamp('MOVIE MYTH', '#ff2a2a', 0.58); scene.add(myth);
  const spared = stamp('SPARED!', '#5be37d', 0.5); scene.add(spared);
  const card = infoCard(); scene.add(card);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // crowd bounce + waving cloths
      const roar = 0.3 + 0.7 * (smooth(range(t, 0, 0.5)) * (1 - smooth(range(t, 2.5, 3.5))) + smooth(range(t, 7.6, 8.2)) * (1 - smooth(range(t, 9.0, 9.6))) + smooth(range(t, 17.5, 18)) * (1 - smooth(range(t, 21, 21.6))) + smooth(range(t, 25.2, 25.8)));
      for (let i = 0; i < N; i++) { const p = CP[i]; const hop = Math.max(0, Math.sin(t * 7 + p.ph)) * 0.12 * roar; q.setFromAxisAngle(V(0, 1, 0), -p.a + Math.PI / 2 * 0 - Math.PI / 2); mt.compose(V(Math.cos(p.a) * p.r, p.y + hop, Math.sin(p.a) * p.r), q, V(1, 1, 1)); crowdB.setMatrixAt(i, mt); crowdH.setMatrixAt(i, mt); }
      crowdB.instanceMatrix.needsUpdate = crowdH.instanceMatrix.needsUpdate = true; crowdB.instanceColor.needsUpdate = true;
      const wave = smooth(range(t, 25.4, 26.0));
      cloths.forEach((s, i) => { const p = s.userData; s.position.set(Math.cos(p.a) * p.r, p.y + 1.35 + Math.sin(t * 9 + i) * 0.15, Math.sin(p.a) * p.r); s.rotation.set(0, -p.a, Math.sin(t * 10 + i) * 0.5); s.visible = wave > 0.01; s.scale.setScalar(wave + 0.001); });
      // ---------- hero ----------
      let hp = V(0, 0, 0.5), rot = 0, pose = STAND(t);
      const raise = smooth(range(t, 7.6, 8.1)) * (1 - smooth(range(t, 9.0, 9.4)));
      pose = over(pose, { rSh: [lerp(-0.6, -2.8, raise), 0, -0.25], rEl: [lerp(-0.9, -0.2, raise), 0, 0], lSh: [-0.9, 0.3, 0.2], lEl: [-1.3, 0, 0], neck: [-0.15 * raise, 0, 0] });
      if (t > 9.0 && t < 17.3) {   // walks to the training post, strikes, then eats
        const w = range(t, 9.0, 10.0); hp = V(0, 0, 0.5).lerp(POST.clone().add(V(0.7, 0, 0.5)), easeInOut(w)); rot = w < 1 ? -2.2 : -2.0;
        if (w < 1) pose = WALK(t * 7);
        else if (t < 12.2) { const s = Math.pow(0.5 - 0.5 * Math.cos((t - 10.1) * Math.PI * 2 / 0.55), 2); pose = over(STAND(t), { rSh: [lerp(-2.5, -1.2, s), 0.3, -0.3], rEl: [lerp(-1.4, -0.2, s), 0, 0], lSh: [-1.0, 0.3, 0.3], lEl: [-1.2, 0, 0], spine: [0.1 + 0.15 * s, 0.3 * s, 0], lHip: [-0.4, 0, 0.1], lKn: [0.3, 0, 0] }); }
        else { hp = POST.clone().add(V(1.4, 0, 1.75)); rot = 0; const e = Math.max(0, Math.sin((t - 12.2) * 5)); pose = over(STAND(t), { rSh: [-1.1 - 0.5 * e, 0, -0.1], rEl: [-1.6 - 0.4 * e, 0, 0], lSh: [-0.8, 0, 0.1], lEl: [-1.4, 0, 0], neck: [0.25, 0, 0] }); hero.setMouth(0.3 * e); }
      }
      if (t >= 17.3) {   // fights the retiarius in the centre
        const back = range(t, 17.3, 18.0); hp = POST.clone().add(V(1.4, 0, 1.75)).lerp(V(-0.6, 0, 0.6), easeInOut(back)); rot = back < 1 ? 1.2 : Math.PI / 2;
        if (back < 1) pose = WALK(t * 7);
        else { const s = Math.pow(0.5 - 0.5 * Math.cos((t - 18.0) * Math.PI * 2 / 0.8), 2) * (t < 21.0 ? 1 : 0); pose = over(STAND(t), { rSh: [lerp(-1.0, -2.2, s), 0.2, -0.3], rEl: [lerp(-0.9, -0.3, s), 0, 0], lSh: [-1.2, 0.4, 0.3], lEl: [-1.0, 0, 0], lHip: [-0.45, 0, 0.12], lKn: [0.35, 0, 0], drop: -0.06 }); const help = smooth(range(t, 26.6, 27.4)); if (help > 0) pose = over(pose, { lSh: [-1.0 * help, 0, 0.2], lEl: [-0.4, 0, 0], rSh: [-2.6 * smooth(range(t, 27.6, 28.0)), 0, -0.3] }); }
      }
      hero.root.position.copy(hp); hero.root.rotation.y = rot; hero.setPose(pose); if (t < 12.2 || t > 17) hero.setMouth(0.2 * raise + (t > 18 && t < 21 ? 0.3 : 0));
      // foe
      foe.root.visible = t > 16.5; const fall = smooth(range(t, 21.0, 21.5)), getUp = smooth(range(t, 27.0, 27.8));
      foe.root.position.set(0.85, 0, 0.6); foe.root.rotation.y = -Math.PI / 2;
      let fp = over(STAND(t, 2), { rSh: [-1.2 + Math.sin(t * 4) * 0.4, 0, -0.2], rEl: [-0.4, 0, 0], lSh: [-0.8, 0, 0.3], lEl: [-0.8, 0, 0], lHip: [-0.4, 0, 0.1], lKn: [0.35, 0, 0], drop: -0.05 });
      if (fall > 0) fp = over(KNEEL, { spine: [0.35, 0, 0], neck: [0.3, 0, 0], lSh: [-2.7 * smooth(range(t, 23.4, 23.8)), 0, 0.2], lEl: [-0.1, 0, 0], rSh: [0.05, 0, -0.2] });
      if (getUp > 0) fp = over(STAND(t), { rSh: [-1.0 * (1 - getUp), 0, -0.2] });
      foe.setPose(fp);
      scene.updateMatrixWorld(true);
      const rh = hero.j.rWr.localToWorld(V(0, -0.08, 0)), lh = hero.j.lWr.localToWorld(V(0, -0.06, 0));
      sword.position.copy(rh); sword.quaternion.copy(hero.j.rWr.getWorldQuaternion(new THREE.Quaternion())); sword.rotateX(-Math.PI / 2);
      const showShield = !(t > 9.4 && t < 17.6); shield.visible = boss.visible = showShield;
      const lx = V(Math.cos(rot), 0, -Math.sin(rot)); shield.position.copy(hero.root.position).addScaledVector(lx, 0.05).add(V(0, 0.95, 0)); shield.rotation.set(0, rot + Math.PI / 2, 0); boss.position.copy(hero.root.position).addScaledVector(lx, 0.62).add(V(0, 0.95, 0));
      trident.visible = foe.root.visible && fall < 0.5; trident.position.copy(foe.j.rWr.localToWorld(V(0, -0.08, 0))); trident.rotation.set(0, 0, Math.PI / 2 - 0.3);
      [18.4, 19.2, 20.0].forEach((b, i) => { fx.hit[i].position.set(0.15, 1.3, 0.6); fx.hit[i].update(t - b); });
      fx.dust.position.set(0.85, 0.1, 0.6); fx.dust.update(t - 21.3);
      fx.cheer.position.set(0, 4, -6); fx.cheer.update(t - 25.4);
      // ---------- camera ----------
      const KEYS = [[0, [3.2, 2.6, 8.4], [0, 1.4, 0]], [2.8, [2.2, 2.0, 6.2], [0, 1.2, 0.3]], [8.2, [1.6, 1.6, 5.0], [0, 1.2, 0.4]], [9.8, [-5.4, 1.7, 2.2], [-3.9, 1.0, -1.4]], [11.8, [-5.2, 1.7, 2.4], [-3.8, 1.0, -1.2]], [12.6, [-2.3, 1.7, 6.6], [-3.1, 1.0, 1.6]], [16.8, [-2.4, 1.7, 6.4], [-3.1, 1.0, 1.4]], [18.0, [0.2, 1.7, 4.8], [0.1, 1.1, 0.5]], [21.5, [0.6, 1.6, 4.4], [0.2, 0.9, 0.5]], [25.2, [1.6, 2.6, 6.2], [0.2, 1.4, -0.5]], [28.7, [1.2, 2.2, 5.4], [0.1, 1.2, 0.3]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const sh = shake(t, 0.7 + (t > 18 && t < 21.5 ? 0.8 : 0), 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-4, 10, 5));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const side = (s2, y) => c.position.clone().addScaledVector(fw, 2).addScaledVector(rt, s2 * 0.2).addScaledVector(upv, y);
      const icK = (a, b) => easeOut(range(t, a, a + 0.25)) * (1 - smooth(range(t, b, b + 0.3)));
      ic.chain.position.copy(side(1, 0.15)); ic.chain.set(0.17 * icK(4.2, 5.8), 0);
      ic.fame.position.copy(side(1, 0.15)); ic.fame.set(0.17 * icK(7.6, 9.2), 0);
      ic.fat.position.copy(side(1, 0.15)); ic.fat.set(0.19 * icK(14.0, 17.0), 0);
      ic.coin.position.copy(side(1, 0.15)); ic.coin.set(0.17 * icK(21.6, 23.3), 0);
      myth.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.12); myth.set(t > 18.3 ? easeOut(range(t, 18.3, 18.46)) * (1 - smooth(range(t, 19.6, 19.9))) : 0);
      spared.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.12); spared.set(t > 24.85 ? easeOut(range(t, 24.85, 25.0)) * (1 - smooth(range(t, 26.0, 26.3))) : 0);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 2.9, 'ROMAN GLADIATOR', 'A LIFE?', '#ffd23f', ''],
        [3.06, 5.88, 'WHO FOUGHT', 'SLAVES + PRISONERS', '#c0c0c8', ''], [5.88, 9.3, 'WHO FOUGHT', 'VOLUNTEERS', '#ffd23f', 'for fame + money'],
        [9.4, 11.91, 'EVERY DAY', 'TRAINING SCHOOL', '#c8a070', ''], [11.91, 14.01, 'EVERY DAY', 'BARLEY + BEANS', '#d8b26a', ''], [14.01, 17.3, 'EVERY DAY', 'A FAT SHIELD', '#ffe08a', 'protected from cuts'],
        [19.19, 21.58, 'THE FIGHTS', 'RARELY DEADLY', '#5be37d', ''], [21.58, 25.2, 'THE FIGHTS', 'TOO EXPENSIVE', '#ffd23f', 'fallen fighters spared'],
        [25.28, 28.7, 'THE CROWD', 'DECIDES', '#ffffff', 'his fate'],
      ];
      const cu = CARDS.find(([a2, b]) => t >= a2 && t < b); let ck = 0;
      if (cu) { card.set(cu[2], cu[3], cu[4], null, cu[5]); const grp = CARDS.filter(x => x[2] === cu[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk = 1 + 0.09 * Math.exp(-(t - cu[0]) * 9); card.scale.set(0.72 * pk, 0.281 * pk, 1); }
      card.material.opacity = ck; card.visible = false;
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.4, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
