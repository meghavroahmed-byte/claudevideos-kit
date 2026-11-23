import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, person, label, showLabel, xray, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 30.3;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/stomach', 'sf/intestines', 'metal_trash_can', 'food_lime_01', 'WoodenTable_01'], hdris: ['comfy_cafe'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawThroat(g, k) { // side view: mouth -> throat -> stomach, pink ball moving down
  g.lineWidth = 12; g.beginPath(); g.moveTo(170, 90); g.quadraticCurveTo(230, 150, 240, 230); g.lineTo(250, 400); g.stroke();
  g.beginPath(); g.moveTo(280, 90); g.quadraticCurveTo(290, 160, 290, 230); g.lineTo(300, 400); g.stroke();
  const y = lerp(120, 380, k); g.fillStyle = '#ff6fb0'; g.beginPath(); g.arc(255 + (y - 120) * 0.05, y, 28, 0, Math.PI * 2); g.fill();
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-3, 6, 4] }), 'comfy_cafe', { height: 1.6, radius: 9, sun: 1.0, env: 1.0 });
  const table = prop('WoodenTable_01'); table.position.set(-1.3, 0, -0.6); scene.add(table);
  const bin = prop('metal_trash_can'); bin.position.set(1.9, 0, -1.4); scene.add(bin);
  // giant display organs (semi-transparent so the gum shows inside)
  const organMat = (c) => (m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = 0.55; m.material.depthWrite = false; } };
  const stomach = fit(prop('sf/stomach'), 1.5, 'max', { ground: false }); stomach.traverse(organMat()); scene.add(stomach);
  const guts = fit(prop('sf/intestines'), 1.7, 'max', { ground: false }); guts.traverse(organMat()); scene.add(guts);
  const gumMat = new THREE.MeshStandardMaterial({ color: 0xff6fb0, roughness: 0.55 });
  const gum = new THREE.Mesh(new THREE.SphereGeometry(0.11, 32, 16), gumMat); gum.renderOrder = 5; scene.add(gum);
  const sugar = []; for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })); scene.add(c); sugar.push(c); }
  const lime = prop('food_lime_01', 1.4); scene.add(lime);
  const clump = []; for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 10), gumMat); scene.add(b); clump.push(b); }
  const hero = person('hero'); scene.add(hero.root);
  const xr = xray(0.45); scene.add(xr);
  const L = { yrs: label('7 YEARS?', 0.9), myth: label('MYTH!', 0.8), base: label('RUBBERY BASE', 0.9), sug: label('SUGAR', 0.6), flav: label('FLAVOR', 0.6), abs: label('ABSORBED', 0.75), cant: label("CAN'T DIGEST THE BASE", 1.2), slide: label('SLIDES THROUGH', 1.0), days: label('OUT IN A FEW DAYS', 1.1), block: label('BLOCKAGE!', 0.9), spit: label('SPIT IT OUT', 0.9) };
  Object.values(L).forEach(l => scene.add(l));
  const SP = V(0.7, 1.25, -0.3), GP = V(0.7, 1.1, -0.3); // stomach / intestine display spots
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.6, 1.4, 3.6], [0, 1.1, 0]], [1.4, [0.35, 1.6, 1.9], [0, 1.5, 0]], [3.0, [0.35, 1.6, 1.9], [0, 1.5, 0]], [3.8, [0.6, 1.35, 4.3], [0.3, 1.1, -0.2]], [16.6, [0.6, 1.35, 4.3], [0.3, 1.1, -0.2]],
    [17.4, [0.6, 1.3, 4.1], [0.3, 1.05, -0.2]], [28.6, [0.6, 1.3, 4.1], [0.3, 1.0, -0.2]], [29.4, [0.9, 1.4, 4.0], [0.8, 0.9, -0.6]], [30.3, [0.9, 1.4, 4.0], [0.9, 0.8, -0.8]]];
  return {
    scene, camera: cam,
    update(t) {
      const pain = sm(26.0, 26.5, t) * (1 - sm(28.3, 28.7, t)), spitK = sm(28.7, 29.0, t);
      hero.update(t, { idle: 1 }, 1, { handsBelly: pain, lean: 0.4 * pain + 0.3 * Math.max(0, 1 - Math.abs(t - 29.0) / 0.3), lookUp: 0.3 * Math.max(0, 1 - Math.abs(t - 1.7) / 0.4), point: 0.8 * sm(6.9, 7.2, t) * (1 - sm(7.9, 8.2, t)) });
      hero.root.position.set(-0.25, 0, 0.1); hero.root.rotation.y = 0.35;
      hero.mouth(t < 1.6 ? Math.abs(Math.sin(t * 9)) * 0.5 : 0);
      // organs fade in as displays
      const sk = sm(3.3, 3.8, t) * (1 - sm(16.8, 17.3, t)), gk = sm(17.0, 17.5, t) * (1 - sm(28.4, 28.9, t));
      stomach.visible = sk > 0.01; stomach.scale.setScalar(stomach.userData.s0 ??= stomach.scale.x); stomach.scale.setScalar(stomach.userData.s0 * sk); stomach.position.copy(SP); stomach.rotation.y = 0.3 + t * 0.05;
      guts.visible = gk > 0.01; guts.scale.setScalar(guts.userData.s0 ??= guts.scale.x); guts.scale.setScalar(guts.userData.s0 * gk); guts.position.copy(GP); guts.rotation.y = -0.2 + t * 0.04;
      // gum ball path: inside the stomach (stays) -> out to show ingredients -> back inside -> travels through the intestines
      let gp = SP.clone();
      if (t < 8.1) gp = SP.clone().add(V(0.05, -0.05, 0.15));
      else if (t < 12.0) gp = SP.clone().add(V(0, 0.15, 0.6)).lerp(SP.clone().add(V(0, 0.1, 0.55)), 0.5);
      else if (t < 17) gp = SP.clone().add(V(0.05, -0.05, 0.15)).lerp(SP.clone().add(V(0, 0.1, 0.55)), 1 - sm(12.2, 13.0, t));
      else { const u = sm(19.3, 23.0, t); const a = u * Math.PI * 5; gp = GP.clone().add(V(Math.cos(a) * 0.45 * (1 - u * 0.5), 0.45 - u * 1.0, 0.25 + Math.sin(a) * 0.15)); }
      gum.position.copy(gp); gum.visible = (t > 3.6 && t < 23.5) || (t > 28.9 && t < 29.9);
      gum.scale.setScalar(t > 8.1 && t < 12.6 ? 2.2 : 1);
      if (t > 28.9) { const u = (t - 28.9) / 0.9; gum.position.copy(hero.headPos()).lerp(V(1.9, 0.95, -1.4), u).add(V(0, Math.sin(u * Math.PI) * 0.5, 0)); }
      // ingredients orbit the big gum ball, then get absorbed (shrink into the stomach wall)
      const ing = sm(10.1, 10.5, t) * (1 - sm(12.6, 13.4, t));
      sugar.forEach((c, i) => { const a = t * 1.5 + i * 1.256; c.visible = ing > 0.01; c.position.copy(gp).add(V(Math.cos(a) * 0.36, Math.sin(a * 0.7) * 0.15, Math.sin(a) * 0.36)); c.scale.setScalar(ing); c.rotation.set(a, a, 0); });
      lime.visible = t > 10.9 && ing > 0.01; lime.position.copy(gp).add(V(-0.38, 0.12, 0.1)); lime.scale.setScalar(1.4 * ing);
      // blockage: many gum balls clump in the gut
      clump.forEach((b, i) => { const k2 = sm(24.6 + i * 0.08, 24.9 + i * 0.08, t) * gk; b.visible = k2 > 0.01; b.scale.setScalar(k2); b.position.copy(GP).add(V(-0.1 + (i % 4) * 0.08, -0.1 + Math.floor(i / 4) * 0.07, 0.3)); });
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos();
      const xk = sm(1.5, 1.7, t) * (1 - sm(3.0, 3.3, t));
      if (xk > 0.01) xr.show(head.clone().add(V(0.3, -0.12, 0.1)), xk, drawThroat, sm(1.7, 2.9, t), t); else xr.visible = false;
      const up = (y) => V(0, y, 0);
      showLabel(L.yrs, SP.clone().add(up(0.95)), t, 5.4, 6.7); showLabel(L.myth, SP.clone().add(up(0.95)), t, 7.0, 8.1);
      showLabel(L.base, gp.clone().add(up(0.42)), t, 9.2, 10.1); showLabel(L.sug, gp.clone().add(V(0.45, 0.25, 0)), t, 10.4, 12.0); showLabel(L.flav, gp.clone().add(V(-0.45, 0.32, 0)), t, 11.1, 12.0);
      showLabel(L.abs, SP.clone().add(up(0.95)), t, 12.5, 14.2); showLabel(L.cant, SP.clone().add(up(0.95)), t, 14.4, 16.8);
      showLabel(L.slide, GP.clone().add(up(1.0)), t, 19.2, 21.8); showLabel(L.days, GP.clone().add(up(1.0)), t, 22.0, 23.8);
      showLabel(L.block, GP.clone().add(up(1.0)), t, 26.4, 28.4); showLabel(L.spit, head.clone().add(V(0.3, 0.4, 0)), t, 28.7, 30.3);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
