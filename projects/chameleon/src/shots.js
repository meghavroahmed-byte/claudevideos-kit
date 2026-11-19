import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { infoCard, burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { world, grass, stamp, iconBubble } from './ancient.js';
import { fern, jungleTree } from './snake.js';

export const DURATION = 29.8;
export const CAPTIONS = [
  [0.0, 'How does a chameleon'], [1.19, 'really change color?'],
  [2.92, 'Most people think'], [3.82, 'chameleons change color'], [5.16, 'to blend in'], [6.25, "But that's mostly a myth"],
  [8.21, 'Their skin has tiny crystals'], [10.06, 'called nanocrystals'], [11.73, 'When a chameleon gets excited'], [13.63, 'it stretches its skin'], [15.12, 'and the crystals move apart'],
  [16.97, 'That changes how light'], [18.31, 'bounces off them'], [19.43, 'turning the skin from green'], [20.87, 'to yellow'], [21.68, 'orange'], [22.36, 'or even red'],
  [23.63, 'So their colors are mostly about'], [25.3, 'mood'], [25.98, 'temperature'], [26.82, 'and showing off'], [27.92, 'to other chameleons!', 29.6],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function makeChameleon(s = 1) {
  const g = new THREE.Group();
  const scaleT = canvasTex(256, 256, (x) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, 256, 256); for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) { x.fillStyle = `rgba(0,0,0,${0.08 + ((r * 7 + c * 3) % 5) * 0.03})`; x.beginPath(); x.arc(c * 16 + (r % 2) * 8, r * 16, 6, 0, 7); x.fill(); } x.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 5; i++) x.fillRect(0, 40 + i * 44, 256, 8); });
  scaleT.wrapS = scaleT.wrapT = THREE.RepeatWrapping; scaleT.repeat.set(2, 1);
  const skin = new THREE.MeshStandardMaterial({ color: 0x4fbf3a, map: scaleT, roughness: 0.45, emissive: 0x000000 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 18), skin); body.scale.set(0.55, 0.85, 1.25); body.position.y = 0.42; g.add(body);
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), skin); crest.position.set(0, 0.75, -0.05); crest.rotation.x = -0.4; g.add(crest);
  const head = new THREE.Group(); head.position.set(0, 0.5, 0.36); g.add(head);
  const hm = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.4, 16), skin); hm.rotation.x = Math.PI / 2 + 0.3; hm.scale.set(0.8, 1, 1); head.add(hm);
  const casque = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 4), skin); casque.position.set(0, 0.12, -0.12); casque.rotation.x = -0.9; head.add(casque);
  const eyes = [-1, 1].map(x => { const e = new THREE.Group(); e.position.set(x * 0.1, 0.05, 0.02); head.add(e); const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 18, 14), skin); e.add(ball); const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 })); pupil.position.set(x * 0.05, 0, 0.045); e.add(pupil); return e; });
  const tailPts = []; for (let i = 0; i <= 40; i++) { const k = i / 40; const a = k * Math.PI * 2.4; const r = 0.28 * (1 - k * 0.7); tailPts.push(V(0, 0.35 + (k < 0.3 ? 0 : -Math.sin((k - 0.3) / 0.7 * Math.PI * 1.2) * 0.1) - (k < 0.3 ? 0 : (1 - Math.cos(a)) * r * 0.5), -0.35 - (k < 0.3 ? k * 0.8 : 0.24 + Math.sin(a) * r))); }
  const tail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tailPts), 60, 0.05, 10), skin); g.add(tail);
  const legs = []; for (const [x, z] of [[0.16, 0.18], [-0.16, 0.18], [0.16, -0.2], [-0.16, -0.2]]) { const L = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.36, 8), skin); L.position.set(x, 0.18, z); L.rotation.z = x > 0 ? -0.35 : 0.35; g.add(L); legs.push(L); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.scale.setScalar(s); g.skin = skin; g.eyes = eyes;
  return g;
}
const COL = { green: new THREE.Color(0x4fbf3a), yellow: new THREE.Color(0xf2d23a), orange: new THREE.Color(0xff8a2a), red: new THREE.Color(0xe8302a), blue: new THREE.Color(0x2a8adf) };

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-3, 9, 4], sun: 2.2 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x4f8a74); u.mid.value.set(0x8fbca2); u.horizon.value.set(0xcfe0cf); u.floorC.value.set(0x55663a);
  scene.fog = new THREE.FogExp2(0xa8c4ae, 0.03);
  const key = scene.userData.key;
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xd9f0dc); hemi.groundColor.set(0x4f5a30); hemi.intensity = 0.95;
  scene.add(world(['#4f7a32', ['70,110,48', '84,126,56', '60,96,40']]));

  [[-5, -6], [4, -8], [-8, -2], [7, -3], [0, -12]].forEach(([x, z], i) => { const tr = jungleTree(6 + i % 2, i + 4); tr.position.set(x, 0, z); scene.add(tr); });
  [[-2.5, 0.8], [2.8, 1.0], [-3.6, -1.5], [3.6, -1.6]].forEach(([x, z], i) => { const f = fern(1.0, i + 2); f.position.set(x, 0, z); scene.add(f); });
  // branch the chameleons sit on
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4, 12), new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.95 })); branch.rotation.z = Math.PI / 2; branch.position.set(0.6, 1.25, -0.4); branch.castShadow = true; scene.add(branch);
  for (const x of [-1.3, 2.5]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.3, 10), branch.material); post.position.set(x, 0.62, -0.4); scene.add(post); }
  // colourful backdrop for the "blend in" myth
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshStandardMaterial({ color: 0xe8302a, roughness: 0.8, side: THREE.DoubleSide })); panel.position.set(0.6, 1.5, -0.95); scene.add(panel);
  const cham = makeChameleon(1.0); cham.position.set(0.5, 1.3, -0.4); cham.rotation.y = Math.PI / 2; scene.add(cham);
  const cham2 = makeChameleon(0.9); cham2.position.set(1.9, 1.3, -0.4); cham2.rotation.y = -Math.PI / 2; scene.add(cham2);
  const hero = makeHuman('casual', { shirt: 0x8d6cab, jeans: 0x5a4a3a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  // nano-crystal magnifier (dynamic)
  const mc = document.createElement('canvas'); mc.width = mc.height = 512; const mg = mc.getContext('2d'); const mtex = new THREE.CanvasTexture(mc); mtex.colorSpace = THREE.SRGBColorSpace;
  const mag = new THREE.Sprite(new THREE.SpriteMaterial({ map: mtex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); mag.renderOrder = 30; scene.add(mag);
  const drawMag = (spread, col, rays, tt) => { mg.clearRect(0, 0, 512, 512); mg.save(); mg.beginPath(); mg.arc(256, 256, 240, 0, 7); mg.clip(); mg.fillStyle = '#123018'; mg.fillRect(0, 0, 512, 512);
    const d = 46 * (1 + spread * 0.8); for (let r = -6; r <= 6; r++) for (let c = -6; c <= 6; c++) { const x = 256 + c * d + (r % 2 ? d / 2 : 0), y = 256 + r * d * 0.866; mg.fillStyle = col; mg.beginPath(); mg.arc(x, y, 12, 0, 7); mg.fill(); mg.fillStyle = 'rgba(255,255,255,0.6)'; mg.beginPath(); mg.arc(x - 4, y - 4, 4, 0, 7); mg.fill(); }
    if (rays > 0) { mg.strokeStyle = `rgba(255,255,220,${rays})`; mg.lineWidth = 8; for (let i = 0; i < 3; i++) { const x0 = 60 + i * 60; mg.beginPath(); mg.moveTo(x0, 0); mg.lineTo(x0 + 130, 250); mg.lineTo(x0 + 260, 0); mg.stroke(); } mg.strokeStyle = col; mg.lineWidth = 10; mg.beginPath(); mg.moveTo(320, 250); mg.lineTo(470, 30); mg.stroke(); }
    mg.restore(); mg.strokeStyle = 'rgba(220,255,220,0.9)'; mg.lineWidth = 12; mg.beginPath(); mg.arc(256, 256, 240, 0, 7); mg.stroke(); mtex.needsUpdate = true; };
  const ic = {
    temp: iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.roundRect(220, 80, 72, 260, 36); g.fill(); g.beginPath(); g.arc(256, 380, 70, 0, 7); g.fill(); g.fillStyle = '#ff4a1f'; g.beginPath(); g.arc(256, 380, 52, 0, 7); g.fill(); g.fillRect(238, 180, 36, 200); })),
    heart: iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#ff5fa2'; g.beginPath(); g.moveTo(256, 420); g.bezierCurveTo(40, 280, 120, 80, 256, 180); g.bezierCurveTo(392, 80, 472, 280, 256, 420); g.fill(); })),
    mood: iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(256, 256, 170, 0, 7); g.fill(); g.fillStyle = '#3a2a10'; g.beginPath(); g.arc(196, 210, 22, 0, 7); g.arc(316, 210, 22, 0, 7); g.fill(); g.lineWidth = 18; g.strokeStyle = '#3a2a10'; g.beginPath(); g.arc(256, 270, 90, 0.2, Math.PI - 0.2); g.stroke(); })),
  };
  Object.values(ic).forEach(i => { i.renderOrder = 30; scene.add(i); });
  const fx = { flash: burst(0xffd23f, 70, 1), show: burst(0xff5fa2, 90, 2) };
  Object.values(fx).forEach(f => scene.add(f));
  const myth = stamp('MYTH!', '#ff2a2a', 0.42); scene.add(myth);
  const card = infoCard(); scene.add(card);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // chameleon colour timeline
      let col = COL.green.clone();
      if (t < 2.9) { const k = Math.max(0, Math.sin(t * 2.4)); col.lerp(COL.yellow, 0.6 * k * smooth(range(t, 0.8, 1.4))); }
      const step = (a, b, from, to, tt) => (tt < a ? from : tt > b ? to : from.clone().lerp(to, smooth(range(tt, a, b))));
      if (t > 20.4) { col = COL.green.clone(); if (t > 20.9) col = step(20.9, 21.2, COL.green, COL.yellow, t); if (t > 21.6) col = step(21.6, 21.9, COL.yellow, COL.orange, t); if (t > 22.7) col = step(22.7, 23.0, COL.orange, COL.red, t); }
      if (t > 23.6) { const p = Math.sin(t * 3); col = COL.red.clone().lerp(COL.orange, 0.5 + 0.5 * p); }
      cham.skin.color.copy(col); cham.skin.emissive.copy(col).multiplyScalar(0.12);
      const c2 = smooth(range(t, 26.6, 27.2));
      cham2.visible = t > 23.5; cham2.skin.color.copy(COL.green).lerp(COL.blue, c2).lerp(COL.yellow, c2 * (0.5 + 0.5 * Math.sin(t * 4)) * 0.4); cham2.skin.emissive.copy(cham2.skin.color).multiplyScalar(0.12);
      cham2.position.x = lerp(3.0, 1.9, smooth(range(t, 23.6, 24.6)));
      // the "blend in" test: red panel behind, he stays green
      const pk = smooth(range(t, 3.6, 4.1)) * (1 - smooth(range(t, 7.9, 8.3)));
      panel.visible = pk > 0.01; panel.scale.setScalar(Math.max(0.001, pk)); panel.material.color.setHSL((t * 0.15) % 1, 0.7, 0.5);
      // eyes swivel, inflates when excited
      cham.eyes.forEach((e, i) => { e.rotation.y = Math.sin(t * 1.3 + i * 2) * 0.6; e.rotation.x = Math.cos(t * 1.1 + i) * 0.3; });
      const ex = smooth(range(t, 12.6, 13.2)) * (1 - smooth(range(t, 16.4, 17.0)));
      cham.scale.set(1 + 0.25 * ex, 1 + 0.15 * ex, 1); cham.position.y = 1.3 + Math.sin(t * 1.5) * 0.01;
      // hero watches
      hero.root.position.set(-0.35, 0, 0.45); hero.root.rotation.y = 0.9;
      const point = smooth(range(t, 0.4, 0.9)) * (1 - smooth(range(t, 2.6, 3.0)));
      hero.setPose(over(STAND(t), { rSh: [-1.4 * point, 0, -0.3], rEl: [-0.2, 0, 0], neck: [0.05, 0.35, 0], lSh: [-0.4 * smooth(range(t, 26.6, 27.0)), 0, 0.3] }));
      hero.setMouth(0.25 * point + (t > 27 ? 0.3 : 0.05));
      scene.updateMatrixWorld(true);
      fx.flash.position.copy(cham.position).add(V(0, 0.4, 0)); fx.flash.update(t - 20.9);
      fx.show.position.set(1.2, 1.9, -0.4); fx.show.update(t - 27.1);
      // ---------- camera ----------
      const KEYS = [[0, [0.9, 1.6, 5.4], [0.1, 1.1, -0.3]], [2.9, [0.8, 1.55, 4.9], [0.2, 1.15, -0.3]], [8.1, [0.9, 1.5, 4.5], [0.3, 1.15, -0.3]], [16.9, [0.9, 1.5, 4.5], [0.3, 1.15, -0.3]], [23.5, [1.3, 1.6, 4.9], [0.7, 1.15, -0.3]], [29.8, [1.2, 1.6, 4.7], [0.7, 1.15, -0.3]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const sh = shake(t, 0.5, 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-3, 9, 4));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const mk = easeOut(range(t, 8.4, 8.8)) * (1 - smooth(range(t, 23.3, 23.7)));
      if (mk > 0.01) { const spread = smooth(range(t, 13.6, 16.0)); const rays = smooth(range(t, 17.0, 17.6)); const mcol = t < 20.4 ? '#4fbf3a' : '#' + col.getHexString(); drawMag(spread, mcol, rays, t); }
      mag.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.12).addScaledVector(rt, -0.19); mag.scale.setScalar(0.33 * mk); mag.material.opacity = mk; mag.visible = mk > 0.01;
      const side = (s2, y) => c.position.clone().addScaledVector(fw, 2).addScaledVector(rt, s2 * 0.2).addScaledVector(upv, y);
      const icK = (a, b) => easeOut(range(t, a, a + 0.25)) * (1 - smooth(range(t, b, b + 0.3)));
      ic.mood.position.copy(side(-1, 0.17)); ic.mood.set(0.15 * icK(25.2, 29.4), 0);
      ic.temp.position.copy(side(0, 0.17)); ic.temp.set(0.15 * icK(25.9, 29.4), 0);
      ic.heart.position.copy(side(1, 0.17)); ic.heart.set(0.15 * icK(26.8, 29.4), 0);
      myth.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.1); myth.set(t > 7.2 ? easeOut(range(t, 7.2, 7.36)) * (1 - smooth(range(t, 8.2, 8.5))) : 0);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 2.9, 'CHAMELEONS', 'COLOR CHANGE?', '#4fbf3a', 'how does it work'],
        [2.92, 6.25, 'THEY SAY', 'TO BLEND IN', '#ffffff', ''], [6.25, 8.2, 'THEY SAY', 'MOSTLY A MYTH', '#ff4a4a', ''],
        [8.21, 11.73, 'THE SKIN', 'NANOCRYSTALS', '#8fef6a', ''], [11.73, 16.97, 'THE SKIN', 'STRETCHES APART', '#8fef6a', 'when excited'],
        [16.97, 19.43, 'LIGHT', 'BOUNCES', '#fff6c8', ''], [19.43, 23.5, 'LIGHT', 'NEW COLORS', '#ff8a2a', 'green to red'],
        [23.63, 29.8, 'COLORS =', 'MOOD + SHOW-OFF', '#ff5fa2', 'and temperature'],
      ];
      const cu = CARDS.find(([a2, b]) => t >= a2 && t < b); let ck = 0;
      if (cu) { card.set(cu[2], cu[3], cu[4], null, cu[5]); const grp = CARDS.filter(x => x[2] === cu[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk2 = 1 + 0.09 * Math.exp(-(t - cu[0]) * 9); card.scale.set(0.72 * pk2, 0.281 * pk2, 1); }
      card.material.opacity = ck; card.visible = false;
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.4, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
