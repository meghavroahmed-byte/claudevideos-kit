import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { infoCard, burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { world, grass, rock, stamp, iconBubble } from './ancient.js';
import { cypress } from './tp.js';

export const DURATION = 27.9;
export const CAPTIONS = [
  [0.0, 'How did people brush their teeth'], [1.88, '5,000 years ago?'],
  [3.62, 'Ancient Egyptians'], [4.73, 'made toothpaste'], [5.61, 'from crushed eggshells'], [7.15, 'ashes'], [7.77, 'and powdered ox hooves'],
  [9.58, 'They brushed with chew sticks'], [11.36, 'twigs with frayed ends'], [12.78, 'chewed until they turned'], [14.1, 'into tiny brushes'],
  [15.86, 'The Chinese later made'], [17.17, 'the first bristle toothbrush'], [18.76, 'from stiff hog hair'], [20.04, 'tied to a bone handle'],
  [21.8, 'And the Romans?'], [22.88, 'Some rinsed their mouths'], [24.07, 'with urine'], [24.76, 'because its ammonia'], [25.97, 'helped whiten teeth!', 27.7],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const WALK = (p, a = 1) => { const s = Math.sin(p); return { lHip: [-0.4 * s * a, 0, 0.05], rHip: [0.4 * s * a, 0, -0.05], lKn: [(0.15 + 0.5 * Math.max(0, Math.sin(p + 1.3))) * a, 0, 0], rKn: [(0.15 + 0.5 * Math.max(0, Math.sin(p + 1.3 + Math.PI))) * a, 0, 0], lSh: [0.35 * s * a, 0, 0.15], rSh: [-0.35 * s * a, 0, -0.15], lEl: [-0.4, 0, 0], rEl: [-0.4, 0, 0], drop: -0.02 + Math.abs(Math.cos(p)) * 0.02 }; };
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const ST = [0, 3.4, 6.8, 10.2];   // station x
const heroX = (t) => t < 9.1 ? ST[0] : t < 10.3 ? lerp(ST[0], ST[1], easeInOut(range(t, 9.1, 10.3))) : t < 15.5 ? ST[1] : t < 16.7 ? lerp(ST[1], ST[2], easeInOut(range(t, 15.5, 16.7))) : t < 21.1 ? ST[2] : t < 22.3 ? lerp(ST[2], ST[3], easeInOut(range(t, 21.1, 22.3))) : ST[3];
const walking = (t) => (t > 9.1 && t < 10.3) || (t > 15.5 && t < 16.7) || (t > 21.1 && t < 22.3);

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-4, 9, 5], sun: 2.5 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x2a7ad6); u.mid.value.set(0x62acea); u.horizon.value.set(0xe8e2cc); u.floorC.value.set(0xd0b88a);
  scene.fog = new THREE.Fog(0xe2dccc, 35, 140);
  const key = scene.userData.key;
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.85;
  scene.add(world(['#d8c294', ['204,182,136', '222,204,160', '190,170,126']]));
  // backdrops per era
  const pyr = new THREE.Mesh(new THREE.ConeGeometry(14, 12, 4), new THREE.MeshStandardMaterial({ color: 0xe2c88e, roughness: 0.95, flatShading: true })); pyr.position.set(-3, 6, -28); pyr.rotation.y = Math.PI / 4; scene.add(pyr);
  const palmM = new THREE.MeshStandardMaterial({ color: 0x3f7f35, side: THREE.DoubleSide });
  [[-2.4, -3], [1.6, -4.5]].forEach(([x, z]) => { const g = new THREE.Group(); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 3.6, 8), new THREE.MeshStandardMaterial({ color: 0x8a6a44 })); tr.position.y = 1.8; g.add(tr); for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 1.8), palmM); l.geometry.translate(0, 0.9, 0); l.position.set(0, 3.5, 0); l.rotation.set(1.0, i / 7 * 6.28, 0, 'YXZ'); g.add(l); } g.position.set(x, 0, z); scene.add(g); });
  // miswak bush at station 2
  const bush = new THREE.Group(); bush.position.set(ST[1] + 0.9, 0, -0.9); scene.add(bush);
  for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.3, 6), new THREE.MeshStandardMaterial({ color: 0x7a5a3a })); b.position.set(Math.cos(i) * 0.2, 0.6, Math.sin(i) * 0.2); b.rotation.set(Math.sin(i * 2) * 0.4, 0, Math.cos(i * 2) * 0.4); bush.add(b); const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), new THREE.MeshStandardMaterial({ color: 0x5c9a3f, flatShading: true })); lf.position.set(Math.cos(i) * 0.4, 1.2 + (i % 3) * 0.2, Math.sin(i) * 0.4); bush.add(lf); }
  // pagoda at station 3
  const pg = new THREE.Group(); pg.position.set(ST[2] + 0.5, 0, -6); scene.add(pg);
  for (let i = 0; i < 4; i++) { const s = 3.2 - i * 0.6; const body = new THREE.Mesh(new THREE.BoxGeometry(s * 0.7, 1.2, s * 0.7), new THREE.MeshStandardMaterial({ color: 0xb3261e })); body.position.y = 0.6 + i * 1.5; pg.add(body); const roof = new THREE.Mesh(new THREE.ConeGeometry(s * 0.78, 0.6, 4), new THREE.MeshStandardMaterial({ color: 0x2a6f4f })); roof.position.y = 1.5 + i * 1.5; roof.rotation.y = Math.PI / 4; pg.add(roof); }
  // roman columns at station 4
  const col = new THREE.MeshStandardMaterial({ color: 0xeee8dc, roughness: 0.5 });
  for (let i = 0; i < 4; i++) { const cl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 3.6, 18), col); cl.position.set(ST[3] - 1.2 + i * 0.95, 1.8, -2.6); cl.castShadow = true; scene.add(cl); }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.4, 0.7), col); lintel.position.set(ST[3] + 0.25, 3.8, -2.6); scene.add(lintel);
  [[ST[3] + 3, -4], [ST[2] - 2.2, -3.5]].forEach(([x, z], i) => { const cyp = cypress(3.6, i + 4); cyp.position.set(x, 0, z); scene.add(cyp); });
  // props
  const mortar = new THREE.Group(); mortar.position.set(ST[0] + 0.55, 0, 0.55); scene.add(mortar);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.75, 16), new THREE.MeshStandardMaterial({ color: 0x8a6a44 })); stand.position.y = 0.375; mortar.add(stand);
  const bowl = new THREE.Mesh(new THREE.LatheGeometry([[0.05, 0], [0.16, 0.02], [0.2, 0.12], [0.2, 0.16], [0.17, 0.16], [0.14, 0.05]].map(([x, y]) => new THREE.Vector2(x, y)), 24), new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 0.8, side: THREE.DoubleSide })); bowl.position.y = 0.75; mortar.add(bowl);
  const paste = new THREE.Mesh(new THREE.CircleGeometry(0.15, 20), new THREE.MeshStandardMaterial({ color: 0xbfb6a8, roughness: 0.9 })); paste.rotation.x = -Math.PI / 2; paste.position.y = 0.86; mortar.add(paste);
  const pestle = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.25, 4, 10), new THREE.MeshStandardMaterial({ color: 0x9a948a })); scene.add(pestle);
  const ingr = [
    (() => { const g = new THREE.Group(); for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6, 0, 3, 0, 1.4), new THREE.MeshStandardMaterial({ color: 0xf6f0e2, side: THREE.DoubleSide })); s.position.set((i % 3 - 1) * 0.05, 0, Math.floor(i / 3) * 0.05); s.rotation.set(i, i * 2, 0); g.add(s); } return g; })(),
    new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.08, 14), new THREE.MeshStandardMaterial({ color: 0x5a5a5e, roughness: 1 })),
    new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.09, 10), new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.6 })),
  ];
  ingr.forEach(g => scene.add(g));
  const twig = new THREE.Group(); twig.add(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.009, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0x8a6a44 })));
  const fray = new THREE.Group(); fray.position.y = 0.1; twig.add(fray); for (let i = 0; i < 10; i++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.03, 3), new THREE.MeshStandardMaterial({ color: 0xd8c49a })); f.position.set(Math.cos(i) * 0.005, 0.012, Math.sin(i) * 0.005); f.rotation.set(Math.sin(i) * 0.4, 0, Math.cos(i) * 0.4); fray.add(f); }
  scene.add(twig);
  const brush = new THREE.Group(); brush.add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0xf0e6cc, roughness: 0.6 }))); const br = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.03), new THREE.MeshStandardMaterial({ color: 0x2a2018 })); br.position.set(0.02, 0.085, 0); brush.add(br); scene.add(brush);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.1, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xb87a3a, metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide })); scene.add(cup);
  const cupL = new THREE.Mesh(new THREE.CircleGeometry(0.046, 16), new THREE.MeshStandardMaterial({ color: 0xe8c832, roughness: 0.2 })); cupL.rotation.x = -Math.PI / 2; cupL.position.y = 0.035; cup.add(cupL);
  // people
  const hero = makeHuman('hide', { plain: true, shirt: 0x2a6f9a, belt: 0xe9c46a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const roman = makeHuman('hide', { plain: true, shirt: 0xf3efe6, sash: 0xb3261e, belt: 0xb3261e, skin: 0xe0ac69 }); scene.add(roman.root);
  const toothW = new THREE.MeshStandardMaterial({ color: 0xfffaf0, roughness: 0.3 });
  const glint = glowSprite(0xffffff, 0.3); scene.add(glint);
  const modern = iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#2b6cff'; g.beginPath(); g.roundRect(100, 230, 300, 50, 25); g.fill(); g.fillStyle = '#ffffff'; for (let i = 0; i < 8; i++) g.fillRect(310 + i * 10, 180, 6, 50); g.fillStyle = '#4ab8ff'; g.fillRect(300, 170, 95, 14); })); modern.renderOrder = 30; scene.add(modern);
  const callBrush = iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#f0e6cc'; g.beginPath(); g.roundRect(80, 240, 300, 46, 23); g.fill(); g.fillStyle = '#2a2018'; for (let i = 0; i < 14; i++) g.fillRect(320 + (i % 7) * 12, 160 + (i > 6 ? 6 : 0), 7, 80); })); callBrush.renderOrder = 30; scene.add(callBrush);
  const callFray = iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#8a6a44'; g.fillRect(90, 236, 260, 40); g.strokeStyle = '#d8c49a'; g.lineWidth = 7; for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(350, 240 + i * 2.5); g.lineTo(440, 180 + i * 10); g.stroke(); } })); callFray.renderOrder = 30; scene.add(callFray);
  const fx = { pop: [burst(0xffffff, 30, 1), burst(0x8a8a8e, 30, 2), burst(0x6a4a2e, 30, 3)], snap: burst(0x8a6a44, 30, 4), shine: burst(0xffffff, 80, 5), ew: burst(0xe8c832, 40, 6) };
  for (const v of Object.values(fx)) (Array.isArray(v) ? v : [v]).forEach(f => scene.add(f));
  const eww = stamp('EWW!', '#e8c832', 0.38); scene.add(eww);
  const card = infoCard(); scene.add(card);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      const hx = heroX(t), walk = walking(t);
      hero.root.position.set(hx, 0, 0.3); hero.root.rotation.y = walk ? Math.PI / 2 : 0.15;
      let pose = walk ? WALK(t * 7) : STAND(t);
      const grind = t > 4.7 && t < 9.0 ? Math.sin(t * 9) : 0;
      if (t > 4.7 && t < 9.0) pose = over(pose, { spine: [0.2, 0.3, 0], neck: [0.3, 0.3, 0], rSh: [-0.9 + grind * 0.1, 0.3, -0.1], rEl: [-1.2, 0, grind * 0.2], lSh: [-0.7, 0.3, 0.1], lEl: [-1.0, 0, 0] });
      if (t < 3.5) pose = over(pose, { rSh: [-1.3, 0, -0.2], rEl: [-1.6, 0, 0], neck: [0, -0.3, 0] });
      const chew = t > 12.6 && t < 15.4;
      if (t > 10.4 && t < 15.4) pose = over(pose, { rSh: [-1.2, 0.2, -0.1], rEl: [-2.0, 0, 0] });
      if (t > 16.8 && t < 21.0) pose = over(pose, { rSh: [-1.0, 0.1, -0.15], rEl: [-1.7, 0, 0], neck: [-0.05, -0.2, 0] });
      const sip = smooth(range(t, 23.0, 23.4)) * (1 - smooth(range(t, 24.4, 24.8)));
      if (t > 22.4) pose = over(pose, { rSh: [lerp(-0.8, -1.4, sip), 0.2, -0.2], rEl: [lerp(-1.4, -2.0, sip), 0, 0], neck: [-0.15 * sip + 0.2 * smooth(range(t, 24.2, 24.5)) * (1 - smooth(range(t, 25.5, 25.9))), 0, 0], spine: [-0.1 * smooth(range(t, 24.2, 24.5)), 0, 0] });
      hero.setPose(pose); hero.setMouth(chew ? Math.max(0, Math.sin(t * 9)) * 0.3 : t > 24.2 && t < 25.6 ? 0.45 : t > 25.9 ? 0.5 : 0.05);
      roman.root.position.set(ST[3] + 0.95, 0, 0.0); roman.root.rotation.y = -1.0; roman.root.visible = t > 19;
      roman.setPose(over(STAND(t, 3), { rSh: [-0.9 * smooth(range(t, 22.4, 22.8)) * (1 - smooth(range(t, 22.9, 23.1))), 0, -0.2] }));
      scene.updateMatrixWorld(true);
      const rh = hero.j.rWr.localToWorld(V(0, -0.08, 0)), lh = hero.j.lWr.localToWorld(V(0, -0.08, 0)), mouth = hero.j.head.localToWorld(V(0, 0.02, 0.13));
      // Egypt: ingredients drop into the mortar, pestle grinds
      const drops = [6.3, 7.15, 8.45];
      ingr.forEach((g, i) => { const d0 = drops[i], k = range(t, d0, d0 + 0.45); g.visible = t > d0 - 0.3 && t < 9.2; g.position.copy(mortar.position).add(V(0, 0.95 + (1 - k) * 0.6, 0)); g.scale.setScalar(easeOut(range(t, d0 - 0.3, d0)) * (1 - k * 0.7) + 0.001); fx.pop[i].position.copy(mortar.position).add(V(0, 1.4, 0)); fx.pop[i].update(t - (d0 - 0.25)); });
      paste.material.color.set(0xd8d0c0).lerp(new THREE.Color(0x6a6a66), smooth(range(t, 7.2, 9))); paste.scale.setScalar(smooth(range(t, 6.6, 8.8)) + 0.001);
      pestle.visible = t > 4.6 && t < 9.1; pestle.position.copy(rh); pestle.rotation.set(0.3 + Math.sin(t * 9) * 0.25, 0, 0.3);
      // chew stick
      twig.visible = t > 10.5 && t < 15.5; twig.position.copy(chew ? mouth.clone().add(V(0.04, -0.01, 0.06)) : rh); twig.rotation.set(0, 0, chew ? Math.PI / 2 - 0.2 : 0.2); fray.scale.setScalar(0.2 + smooth(range(t, 12.8, 14.5)) * 1.2);
      fx.snap.position.copy(bush.position).add(V(-0.1, 1.0, 0.1)); fx.snap.update(t - 10.5);
      brush.visible = t > 16.7 && t < 21.2; brush.position.copy(rh); brush.rotation.set(0, 0, -0.4);
      cup.visible = t > 22.6; cup.position.copy(t < 23.0 ? roman.j.rWr.localToWorld(V(0, -0.08, 0)) : rh.clone().add(V(0, 0.04, 0))); cup.rotation.set(-0.6 * sip, 0, 0);
      fx.ew.position.copy(mouth).add(V(0, 0, 0.1)); fx.ew.update(t - 24.25);
      glint.position.copy(mouth).add(V(0.03, 0.01, 0.03)); glint.material.opacity = smooth(range(t, 26.2, 26.5)) * (0.6 + 0.4 * Math.sin(t * 12)); glint.scale.setScalar(0.25 + 0.1 * Math.sin(t * 9));
      fx.shine.position.copy(mouth); fx.shine.update(t - 26.3);
      // ---------- camera trucks with him ----------
      const cx = hx + 0.35;
      const KEYS = [[0, 2.1, 5.2, 1.15], [3.5, 1.7, 4.4, 1.1], [9.0, 1.7, 4.4, 1.05], [12.5, 1.65, 3.6, 1.25], [15.4, 1.7, 4.2, 1.1], [18.0, 1.65, 3.6, 1.25], [21.0, 1.7, 4.3, 1.1], [24.0, 1.65, 3.8, 1.25], [27.9, 1.65, 3.4, 1.35]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0])), L = (j) => lerp(KEYS[i][j], KEYS[i + 1][j], k);
      const cp = V(cx + 0.4, L(1), 0.3 + L(2)), lk = V(cx, L(3), 0.2);
      const sh = shake(t, 0.5, 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-4, 9, 5));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const side = (s2, y) => c.position.clone().addScaledVector(fw, 2).addScaledVector(rt, s2 * 0.2).addScaledVector(upv, y);
      modern.position.copy(side(1, 0.15)); modern.set(0.17 * easeOut(range(t, 0.8, 1.05)) * (1 - smooth(range(t, 3.3, 3.6))), smooth(range(t, 1.9, 2.05)));
      callFray.position.copy(side(1, 0.15)); callFray.set(0.17 * easeOut(range(t, 11.4, 11.65)) * (1 - smooth(range(t, 15.2, 15.5))), 0);
      callBrush.position.copy(side(1, 0.15)); callBrush.set(0.17 * easeOut(range(t, 17.7, 17.95)) * (1 - smooth(range(t, 21.0, 21.3))), 0);
      eww.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.12); eww.set(t > 24.2 ? easeOut(range(t, 24.2, 24.36)) * (1 - smooth(range(t, 25.4, 25.7))) : 0);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 3.5, 'BRUSHING TEETH', '5,000 YEARS AGO?', '#ffffff', ''],
        [3.62, 6.3, 'EGYPT', 'TOOTHPASTE', '#ffd23f', ''], [6.3, 7.15, 'EGYPT', 'EGGSHELLS', '#f6f0e2', ''], [7.15, 7.94, 'EGYPT', 'ASHES', '#c0c0c8', ''], [7.94, 9.4, 'EGYPT', 'OX HOOVES', '#c8a070', 'powdered'],
        [9.58, 15.6, 'EARLY BRUSH', 'CHEW STICKS', '#c8a070', 'frayed twigs'],
        [15.86, 21.6, 'CHINA', 'BRISTLE BRUSH', '#ff6b5b', 'hog hair + bone handle'],
        [21.8, 24.76, 'ROME', 'URINE RINSE', '#e8c832', ''], [24.76, 27.9, 'ROME', 'AMMONIA', '#ffffff', 'whiter teeth'],
      ];
      const cu = CARDS.find(([a2, b]) => t >= a2 && t < b); let ck = 0;
      if (cu) { card.set(cu[2], cu[3], cu[4], null, cu[5]); const grp = CARDS.filter(x => x[2] === cu[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk = 1 + 0.09 * Math.exp(-(t - cu[0]) * 9); card.scale.set(0.72 * pk, 0.281 * pk, 1); }
      card.material.opacity = ck; card.visible = ck > 0.01;
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.4, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
