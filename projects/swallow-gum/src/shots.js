import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { infoCard, burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { stamp, iconBubble } from './ancient.js';
import { bedroom } from './room.js';

export const DURATION = 30.3;
export const CAPTIONS = [
  [0.0, 'What really happens'], [1.32, 'if you swallow'], [2.0, 'chewing gum?'],
  [3.1, 'Some people say'], [4.08, 'it stays in your stomach'], [5.33, 'for seven years'], [6.77, "That's a myth!"],
  [8.28, 'Gum is made of'], [9.14, 'a rubbery base'], [10.18, 'plus sugar and flavor'], [12.06, 'Your body absorbs'], [13.06, 'the sugar and flavor'],
  [14.33, 'but your stomach'], [15.13, "can't digest the gum base"], [17.08, "Still, it doesn't get stuck"],
  [19.23, 'It slides through'], [20.01, 'your intestines'], [21.96, 'and leaves your body'], [22.87, 'in a few days'],
  [24.05, 'But swallowing lots of gum'], [25.6, 'at once'], [26.05, 'can cause a blockage'], [27.45, "so it's still better"], [28.63, 'to spit it out', 30.1],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const HP = V(0, 0, 0.3);
// digestive path (world), head -> exit
const P = (x, y, z) => V(x, y, z + HP.z);
const PATH = [P(0, 1.6, 0.11), P(0, 1.47, 0.04), P(0, 1.3, 0.02), P(0.03, 1.17, 0.04), P(0.08, 1.1, 0.07), P(0.05, 1.04, 0.08), P(-0.03, 1.02, 0.07)];
for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI * 4, y = 0.98 - i / 16 * 0.1; PATH.push(P(Math.cos(a) * 0.07, y, 0.07 + Math.sin(a) * 0.03)); }
PATH.push(P(0.11, 0.86, 0.05), P(0.12, 1.0, 0.05), P(0.0, 1.02, 0.06), P(-0.12, 1.0, 0.05), P(-0.11, 0.86, 0.05), P(-0.03, 0.8, 0.02), P(0, 0.76, -0.04));
const tract = new THREE.CatmullRomCurve3(PATH);
const STOMACH_U = 0.2, IN_U = 0.3;

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 5, sunDir: [-2, 6, 3], sun: 1.6 });
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xfff4e0); hemi.groundColor.set(0x6a5040); hemi.intensity = 1.0;
  const key = scene.userData.key; key.position.set(-2, 6, 4);
  const room = bedroom(); scene.add(room);
  room.traverse(o => { if (o.isMesh && o.material.map && o.material.map.repeat.x === 4) o.material.color.set(0xffd9a8); });
  const ceil = new THREE.PointLight(0xfff0dc, 6, 9, 1.2); ceil.position.set(0, 2.9, 1.0); scene.add(ceil);
  // hero
  const hero = makeHuman('casual', { shirt: 0x8d6cab, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  hero.root.position.copy(HP);
  const mats = []; hero.root.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.userData.c0 = o.material.color ? o.material.color.clone() : null; o.material.userData.tr0 = o.material.transparent; mats.push(o.material); } });
  // tract + stomach (x-ray)
  const tractM = new THREE.MeshStandardMaterial({ color: 0xff8fab, emissive: 0xff4f7a, emissiveIntensity: 0.35, transparent: true, opacity: 0, depthWrite: false });
  const tube = new THREE.Mesh(new THREE.TubeGeometry(tract, 240, 0.022, 10), tractM); tube.renderOrder = 5; scene.add(tube);
  const stomach = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16), tractM); stomach.scale.set(1.2, 0.85, 0.7); stomach.position.copy(P(0.07, 1.09, 0.07)); stomach.rotation.z = -0.5; stomach.renderOrder = 5; scene.add(stomach);
  const acid = []; for (let i = 0; i < 14; i++) { const s = glowSprite(0xb6ff4a, 0.04); s.userData.ph = i / 14; s.renderOrder = 6; scene.add(s); acid.push(s); }
  // gum
  const gumM = new THREE.MeshStandardMaterial({ color: 0xff5fa2, roughness: 0.4, emissive: 0xff2f80, emissiveIntensity: 0.25 });
  const gum = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 14), gumM); gum.renderOrder = 7; scene.add(gum);
  const gumGlow = glowSprite(0xff5fa2, 0.25); gumGlow.renderOrder = 7; scene.add(gumGlow);
  const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 18), new THREE.MeshStandardMaterial({ color: 0xff8fc0, roughness: 0.2, transparent: true, opacity: 0.85 })); scene.add(bubble);
  const gums = []; for (let i = 0; i < 6; i++) { const g = new THREE.Mesh(new THREE.SphereGeometry(0.026, 16, 12), gumM); g.renderOrder = 7; scene.add(g); gums.push(g); }
  const shield = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), new THREE.MeshBasicMaterial({ color: 0x8fd3ff, transparent: true, opacity: 0, wireframe: true })); shield.renderOrder = 8; scene.add(shield);
  const nutrients = []; for (let i = 0; i < 30; i++) { const s = glowSprite(i % 2 ? 0xffffff : 0x8fef6a, 0.05); s.userData = { dir: V(Math.cos(i * 2.4), (i % 7) / 7 - 0.3, Math.sin(i * 2.4) * 0.3), ph: (i * 0.13) % 1 }; scene.add(s); nutrients.push(s); }
  const alarm = glowSprite(0xff2020, 0.6); alarm.renderOrder = 6; scene.add(alarm);
  // trash bin
  const bin = new THREE.Group(); bin.position.set(1.15, 0, 0.6); scene.add(bin);
  bin.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.5, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x3a8a5a, side: THREE.DoubleSide })).translateY(0.25));
  bin.add(new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), new THREE.MeshStandardMaterial({ color: 0x2a5a3a })).rotateX(-Math.PI / 2).translateZ(0.02));
  // hologram callouts
  const icons = {
    cal: iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.roundRect(110, 140, 292, 260, 30); g.fill(); g.fillStyle = '#e63946'; g.beginPath(); g.roundRect(110, 140, 292, 80, [30, 30, 0, 0]); g.fill(); g.fillStyle = '#222'; g.font = '900 150px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('7', 256, 315); g.fillStyle = '#fff'; g.font = '900 50px sans-serif'; g.fillText('YEARS', 256, 182); })),
    base: iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#c9c2b8'; g.beginPath(); g.ellipse(256, 270, 150, 110, 0, 0, 7); g.fill(); g.strokeStyle = '#a49a8e'; g.lineWidth = 10; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(256, 270, 40 + i * 25, 0.3, 2.6); g.stroke(); } })),
    sugar: iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) { g.save(); g.translate(170 + i * 85, 280 - (i % 2) * 50); g.rotate(0.3 * i); g.fillRect(-45, -45, 90, 90); g.restore(); } g.strokeStyle = '#ccd'; g.lineWidth = 4; })),
    flavor: iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#4fbf5a'; g.beginPath(); g.moveTo(256, 120); g.quadraticCurveTo(400, 230, 256, 400); g.quadraticCurveTo(112, 230, 256, 120); g.fill(); g.strokeStyle = '#2f8f3a'; g.lineWidth = 10; g.beginPath(); g.moveTo(256, 140); g.lineTo(256, 390); g.stroke(); })),
  };
  Object.values(icons).forEach(i => scene.add(i));
  const days = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); days.renderOrder = 31; scene.add(days);
  const dayTex = [1, 2, 3].map(d => canvasTex(512, 200, (g) => { g.fillStyle = 'rgba(30,10,30,0.72)'; g.beginPath(); g.roundRect(6, 6, 500, 188, 36); g.fill(); g.font = "400 110px Brand, sans-serif"; g.fillStyle = '#ff8fc0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`DAY ${d}`, 256, 104); }));
  const fx = { pop: burst(0xff8fc0, 50, 1), gulp: burst(0xffffff, 30, 2), bin: burst(0x5be37d, 80, 3), exit: burst(0xff8fc0, 50, 4) };
  Object.values(fx).forEach(f => scene.add(f));
  const myth = stamp('MYTH!', '#ff2a2a', 0.45); scene.add(myth);
  const spit = stamp('SPIT IT OUT', '#5be37d', 0.6); scene.add(spit);
  const card = infoCard(); scene.add(card);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // x-ray amount
      const xr = smooth(range(t, 2.5, 3.1)) * (1 - smooth(range(t, 27.4, 28.0)));
      mats.forEach(m => { m.transparent = m.userData.tr0 || xr > 0.01; m.opacity = 1 - 0.78 * xr; m.depthWrite = xr < 0.5; if (m.userData.c0) m.color.copy(m.userData.c0).lerp(new THREE.Color(0x6fb8ff), 0.6 * xr); });
      tractM.opacity = 0.85 * xr;
      // ---------- hero ----------
      const chew = t < 1.5 ? Math.max(0, Math.sin(t * 9)) * 0.35 : 0;
      const gulp = smooth(range(t, 1.5, 1.7)) * (1 - smooth(range(t, 2.6, 3.0)));
      const spitK = smooth(range(t, 28.2, 28.6));
      hero.root.rotation.y = lerp(0, 0.55, smooth(range(t, 27.6, 28.2)));
      let pose = over(STAND(t), { neck: [-0.1 * gulp, 0, 0], rSh: [-1.3 * gulp, 0.3, -0.1], rEl: [-1.9 * gulp, 0, 0] });
      if (t > 3 && t < 27.5) pose = over(pose, { neck: [0.35, 0, 0], lSh: [-0.35, 0, 0.2], lEl: [-1.2, 0, 0], rSh: [-0.35, 0, -0.2], rEl: [-1.2, 0, 0] });   // looks down at his belly
      if (t > 24.2 && t < 27.4) pose = over(pose, { lSh: [-0.6, 0, 0.3], lEl: [-1.6, 0, 0], rSh: [-0.6, 0, -0.3], rEl: [-1.6, 0, 0], spine: [0.15, 0, 0] });
      if (t > 27.6) pose = over(STAND(t), { neck: [-0.1 * spitK, 0.4, 0], chest: [-0.08 * spitK, 0, 0] });
      hero.setPose(pose);
      hero.setMouth(t < 1.5 ? chew : t < 3 ? 0.35 * gulp : t > 28.1 && t < 28.6 ? 0.5 : 0.05);
      scene.updateMatrixWorld(true);
      const mouth = hero.j.head.localToWorld(V(0, 0.02, 0.13));
      // bubble blow + pop
      const bk = smooth(range(t, 0.55, 1.15)) * (t < 1.2 ? 1 : 0);
      bubble.visible = bk > 0.01; bubble.position.copy(mouth).add(V(0, -0.01, 0.06 + 0.08 * bk)); bubble.scale.setScalar(Math.max(0.01, bk));
      fx.pop.position.copy(mouth).add(V(0, 0, 0.12)); fx.pop.update(t - 1.2);
      // gum position along the tract
      let gu;
      if (t < 1.55) gu = -1; else if (t < 3.4) gu = STOMACH_U * easeInOut(range(t, 1.55, 3.3)); else if (t < 19.2) gu = STOMACH_U; else gu = lerp(STOMACH_U, 1.0, easeInOut(range(t, 19.3, 23.4)));
      gum.visible = gu >= 0 && t < 23.45; gumGlow.visible = gum.visible && xr > 0.2;
      if (gu >= 0) { const p = gu === STOMACH_U ? stomach.position.clone().add(V(Math.sin(t * 2) * 0.012, Math.cos(t * 1.7) * 0.008, 0.01)) : tract.getPointAt(Math.min(1, gu)); gum.position.copy(p); gumGlow.position.copy(p); gumGlow.material.opacity = xr; }
      if (t > 27.9) { gum.visible = true; const k = range(t, 28.6, 29.3); const a = mouth.clone(), b = bin.position.clone().add(V(0, 0.5, 0)); gum.position.copy(a.lerp(b, k)); gum.position.y += Math.sin(k * Math.PI) * 0.35; gum.visible = t > 28.55 && k < 1; }
      fx.bin.position.copy(bin.position).add(V(0, 0.6, 0)); fx.bin.update(t - 29.3);
      fx.exit.position.copy(tract.getPointAt(1)); fx.exit.update(t - 23.4);
      // stomach acid can't digest it
      const ak = smooth(range(t, 14.4, 14.8)) * (1 - smooth(range(t, 17.6, 18.0)));
      acid.forEach((s, i) => { const u2 = (t * 0.7 + s.userData.ph) % 1, a = i * 2.4; s.position.copy(stomach.position).add(V(Math.cos(a) * 0.05 * (1 - u2 * 0.5), (u2 - 0.5) * 0.08, Math.sin(a) * 0.03 + 0.02)); s.material.opacity = ak * Math.sin(u2 * Math.PI); });
      shield.position.copy(gum.position); shield.material.opacity = 0.6 * ak; shield.rotation.y = t * 2;
      // sugar + flavor absorbed into the body
      const nk = smooth(range(t, 12.1, 12.5)) * (1 - smooth(range(t, 14.0, 14.4)));
      nutrients.forEach(s => { const u2 = ((t - 12.1) * 0.6 + s.userData.ph) % 1; s.position.copy(stomach.position).addScaledVector(s.userData.dir, u2 * 0.55); s.material.opacity = nk * (1 - u2); });
      // too much gum: blockage
      const bl = smooth(range(t, 24.2, 25.4));
      gums.forEach((g, i) => { const u0 = 0.55 + i * 0.012; g.visible = bl > 0.01 && t < 27.6; g.position.copy(tract.getPointAt(lerp(STOMACH_U, u0, bl))).add(V(Math.sin(i * 2) * 0.012, 0, 0)); g.scale.setScalar(1 + 0.25 * bl); });
      alarm.position.copy(tract.getPointAt(0.57)); alarm.material.opacity = smooth(range(t, 26.0, 26.4)) * (1 - smooth(range(t, 27.3, 27.6))) * (0.6 + 0.4 * Math.sin(t * 12));
      // ---------- camera ----------
      const KEYS = [[0, [0.6, 1.5, 4.2], [0, 1.2, 0.3]], [2.4, [0.4, 1.4, 3.6], [0, 1.15, 0.3]], [3.3, [0.35, 1.35, 3.25], [0, 1.15, 0.3]], [8.3, [0.5, 1.35, 3.15], [0.03, 1.15, 0.3]], [14.3, [0.25, 1.3, 3.05], [0.05, 1.12, 0.3]], [19.2, [-0.3, 1.3, 3.1], [0, 1.1, 0.3]], [24.0, [0.3, 1.3, 3.1], [0, 1.1, 0.3]], [27.5, [0.9, 1.4, 3.8], [0.45, 1.0, 0.4]], [30.3, [1.0, 1.45, 4.0], [0.5, 1.0, 0.4]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const sh = shake(t, 0.5, 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      // callouts beside him (screen-anchored left/right)
      const side = (s2, y) => c.position.clone().addScaledVector(fw, 2).addScaledVector(rt, s2 * 0.24).addScaledVector(upv, y);
      const ic = (a, b) => easeOut(range(t, a, a + 0.25)) * (1 - smooth(range(t, b, b + 0.3)));
      icons.cal.position.copy(side(1, 0.12)); icons.cal.set(0.2 * ic(5.4, 7.8), smooth(range(t, 7.25, 7.4)));
      icons.base.position.copy(side(-1, 0.18)); icons.base.set(0.17 * ic(9.15, 16.6), smooth(range(t, 15.6, 15.75)) * 0);
      icons.sugar.position.copy(side(1, 0.2)); icons.sugar.set(0.15 * ic(10.4, 13.9), 0);
      icons.flavor.position.copy(side(1, 0.0)); icons.flavor.set(0.15 * ic(11.1, 13.9), 0);
      Object.values(icons).forEach(o => o.renderOrder = 30);
      const dk = smooth(range(t, 22.0, 22.2)) * (1 - smooth(range(t, 23.8, 24.0)));
      const di = t < 22.5 ? 0 : t < 23.0 ? 1 : 2; if (days.material.map !== dayTex[di]) { days.material.map = dayTex[di]; days.material.needsUpdate = true; }
      days.position.copy(side(1, 0.2)); days.scale.set(0.25 * dk, 0.098 * dk, 1); days.material.opacity = dk; days.visible = dk > 0.01;
      myth.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.05); myth.set(t > 7.25 ? easeOut(range(t, 7.25, 7.4)) * (1 - smooth(range(t, 8.0, 8.3))) : 0);
      spit.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.12); spit.set(t > 29.0 ? easeOut(range(t, 29.0, 29.16)) : 0);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 3.0, 'WHAT IF', 'YOU SWALLOW GUM?', '#ff8fc0', ''],
        [3.1, 8.2, 'THEY SAY', '7 YEARS?', '#ffffff', 'stuck in your stomach'],
        [8.28, 12.06, 'GUM =', 'BASE + SUGAR', '#ff8fc0', '+ flavor'], [12.06, 14.33, 'GUM =', 'SUGAR ABSORBED', '#8fef6a', 'flavor too'], [14.33, 17.0, 'GUM =', "BASE WON'T DIGEST", '#b6ff4a', ''],
        [17.08, 21.96, 'STILL', 'NOT STUCK', '#8fd3ff', 'slides through the intestines'], [21.96, 23.9, 'STILL', 'OUT IN DAYS', '#ff8fc0', ''],
        [24.05, 27.45, 'BUT', 'TOO MUCH = BLOCKAGE', '#ff4a4a', 'lots of gum at once'],
      ];
      const cu = CARDS.find(([a2, b]) => t >= a2 && t < b); let ck = 0;
      if (cu) { card.set(cu[2], cu[3], cu[4], null, cu[5]); const grp = CARDS.filter(x => x[2] === cu[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk = 1 + 0.09 * Math.exp(-(t - cu[0]) * 9); card.scale.set(0.72 * pk, 0.281 * pk, 1); }
      card.material.opacity = ck; card.visible = false;
      const fd = cp.distanceTo(lk);
      return { dof: { focus: fd, aperture: 0.001, maxblur: 0.004 }, bloom: 0.45 + 0.2 * xr, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
