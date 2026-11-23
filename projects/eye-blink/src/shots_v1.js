import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 25.8;
export const CAPTIONS = [
  [0.0, 'How many times do you blink in a day?'],
  [2.41, 'About fifteen times a minute'], [4.36, "That's around 15,000 blinks a day!"],
  [7.7, 'Each blink lasts about a third of a second'], [10.42, 'Add them up'], [11.18, 'and your eyes are closed'], [12.27, 'for over an hour every day!'],
  [14.79, 'Blinking wipes tears across your eyes'], [16.91, 'like a windshield wiper'], [18.34, 'washing away dust'],
  [19.71, 'But when you stare at a screen'], [21.38, 'you blink way less'], [22.89, "That's why your eyes feel dry!", 25.6],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
// blink times
const BL = []; { let tt = 0.25; while (tt < 25.6) { BL.push(tt); tt += tt < 2.4 ? 0.45 : tt < 19.8 ? 1.25 + ((BL.length * 7) % 5) * 0.12 : 3.4; } }
const blinkK = (t) => BL.reduce((m, b) => Math.max(m, Math.max(0, 1 - Math.abs(t - b - 0.08) / 0.1)), 0);

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-3, 6, 4], sun: 1.2 });
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xffffff); hemi.groundColor.set(0x8a8a90); hemi.intensity = 1.1;
  // bright office
  const floorT = canvasTex(512, 512, (g) => { g.fillStyle = '#c8b090'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 16; i++) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, i * 32, 512, 2); } });
  floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(4, 4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.6 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), new THREE.MeshStandardMaterial({ color: 0xf2f4f6, roughness: 0.9 })); back.position.set(0, 2, -1.9); scene.add(back);
  const cityT = canvasTex(512, 320, (g) => { const gr = g.createLinearGradient(0, 0, 0, 320); gr.addColorStop(0, '#6ab0e8'); gr.addColorStop(1, '#d8ecf8'); g.fillStyle = gr; g.fillRect(0, 0, 512, 320); const r = rng(4); for (let i = 0; i < 18; i++) { const w = 20 + r() * 40, h = 60 + r() * 200, x = i * 30 - 10; g.fillStyle = ['#8a9ab0', '#7a8aa0', '#9aaabe'][i % 3]; g.fillRect(x, 320 - h, w, h); g.fillStyle = 'rgba(255,255,255,0.5)'; for (let y = 320 - h + 8; y < 310; y += 14) for (let xx = x + 4; xx < x + w - 6; xx += 10) g.fillRect(xx, y, 5, 7); } g.strokeStyle = '#ffffff'; g.lineWidth = 14; g.strokeRect(0, 0, 512, 320); g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 320); g.stroke(); });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicMaterial({ map: cityT, toneMapped: false })); win.position.set(-1.2, 1.75, -1.88); scene.add(win);
  const plant = new THREE.Group(); plant.position.set(1.5, 0, -1.4); scene.add(plant); const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0xffffff })); pot.position.y = 0.2; plant.add(pot); for (let i = 0; i < 9; i++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshStandardMaterial({ color: 0x3a9a4a })); lf.scale.set(0.5, 1.4, 0.2); lf.position.set(Math.cos(i * 0.7) * 0.15, 0.7 + (i % 3) * 0.15, Math.sin(i * 0.7) * 0.15); lf.rotation.set(Math.sin(i) * 0.6, i, Math.cos(i) * 0.6); plant.add(lf); }
  // standing desk + monitor
  const deskM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }), legM = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.5 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.6), deskM); desk.position.set(0.15, 1.05, -0.9); scene.add(desk);
  for (const x of [-0.35, 0.65]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.05, 0.06), legM); l.position.set(x, 0.525, -0.9); scene.add(l); }
  const monC = document.createElement('canvas'); monC.width = 320; monC.height = 180; const mg = monC.getContext('2d'); mg.fillStyle = '#1e3a5f'; mg.fillRect(0, 0, 320, 180); mg.fillStyle = '#fff'; for (let i = 0; i < 7; i++) mg.fillRect(20, 20 + i * 22, 180 + (i % 3) * 30, 8); mg.fillStyle = '#ffd23f'; mg.fillRect(230, 30, 70, 120);
  const monT = new THREE.CanvasTexture(monC); monT.colorSpace = THREE.SRGBColorSpace;
  const mon = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.36), new THREE.MeshBasicMaterial({ map: monT, toneMapped: false })); mon.position.set(0.15, 1.38, -1.08); scene.add(mon);
  const monB = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.4, 0.03), legM); monB.position.set(0.15, 1.38, -1.1); scene.add(monB);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.05), legM); stand.position.set(0.15, 1.15, -1.1); scene.add(stand);
  const screenGlow = new THREE.PointLight(0x9fd0ff, 0, 2.5, 1.5); screenGlow.position.set(0.15, 1.4, -0.8); scene.add(screenGlow);
  const fill = new THREE.PointLight(0xffffff, 6, 9, 1.2); fill.position.set(0.8, 2.4, 2.4); scene.add(fill);
  // hero (faces the camera at first, turns to the monitor for the screen part)
  const hero = makeHuman('casual', { shirt: 0xe76f51, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const lids = []; hero.j.head.traverse(o => { if (o.isMesh && o.geometry && o.geometry.parameters && Math.abs((o.geometry.parameters.radius || 0) - 0.0168) < 1e-4) lids.push(o); });
  // eye bubble
  const zc = document.createElement('canvas'); zc.width = zc.height = 512; const zg = zc.getContext('2d'); const zt = new THREE.CanvasTexture(zc); zt.colorSpace = THREE.SRGBColorSpace;
  const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); bub.renderOrder = 30; scene.add(bub);
  const r9 = rng(3); const DUST = []; for (let i = 0; i < 9; i++) DUST.push({ x: 150 + r9() * 220, y: 200 + r9() * 120 });
  const drawEye = (close, dust, wet, dry, wipe, tt) => { zg.clearRect(0, 0, 512, 512); zg.save(); zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.clip();
    zg.fillStyle = '#f0c4a4'; zg.fillRect(0, 0, 512, 512);
    zg.save(); zg.beginPath(); zg.ellipse(256, 260, 190, 110, 0, 0, 7); zg.clip();
    zg.fillStyle = '#fbfbf8'; zg.fillRect(0, 0, 512, 512);
    if (dry > 0) { zg.strokeStyle = `rgba(220,40,40,${0.7 * dry})`; zg.lineWidth = 3; for (let i = 0; i < 10; i++) { zg.beginPath(); zg.moveTo(i < 5 ? 70 : 442, 220 + (i % 5) * 18); zg.quadraticCurveTo(i < 5 ? 130 : 382, 240 + (i % 3) * 10, i < 5 ? 170 : 342, 250 + (i % 5) * 8); zg.stroke(); } }
    zg.fillStyle = '#3a8ad8'; zg.beginPath(); zg.arc(256, 260, 72, 0, 7); zg.fill(); zg.fillStyle = '#123'; zg.beginPath(); zg.arc(256, 260, 32, 0, 7); zg.fill(); zg.fillStyle = 'rgba(255,255,255,0.9)'; zg.beginPath(); zg.arc(232, 236, 14, 0, 7); zg.fill();
    if (wet > 0) { zg.fillStyle = `rgba(150,210,255,${0.35 * wet})`; zg.fillRect(0, 0, 512, 512); }
    if (dust > 0) DUST.forEach((d, i) => { const gone = wipe > 0 && d.x < 60 + wipe * 400; if (gone) return; zg.fillStyle = `rgba(120,100,70,${dust})`; zg.beginPath(); zg.arc(d.x, d.y, 6, 0, 7); zg.fill(); });
    // upper lid closes from the top
    zg.fillStyle = '#e8b090'; zg.fillRect(0, 0, 512, 150 + close * 220);
    zg.strokeStyle = '#3a2516'; zg.lineWidth = 8; zg.beginPath(); zg.moveTo(66, 150 + close * 220); zg.lineTo(446, 150 + close * 220); zg.stroke();
    zg.restore();
    zg.strokeStyle = '#8a5a40'; zg.lineWidth = 6; zg.beginPath(); zg.ellipse(256, 260, 190, 110, 0, 0, 7); zg.stroke();
    if (wipe > 0 && wipe < 1) { const x = 60 + wipe * 400; zg.strokeStyle = 'rgba(120,200,255,0.9)'; zg.lineWidth = 12; zg.beginPath(); zg.moveTo(x, 160); zg.lineTo(x - 40, 360); zg.stroke(); }
    zg.restore(); zg.strokeStyle = 'rgba(255,255,255,0.95)'; zg.lineWidth = 12; zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.stroke(); zt.needsUpdate = true; };
  // counters (plain text with outline)
  const cc = document.createElement('canvas'); cc.width = 768; cc.height = 220; const cg = cc.getContext('2d'); const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace;
  const cnt = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); cnt.renderOrder = 31; scene.add(cnt); let lastC = '';
  const drawC = (s, col) => { if (s === lastC) return; lastC = s; cg.clearRect(0, 0, 768, 220); cg.font = "400 120px Brand, sans-serif"; cg.textAlign = 'center'; cg.textBaseline = 'middle'; cg.lineWidth = 14; cg.strokeStyle = 'rgba(0,0,0,0.6)'; cg.strokeText(s, 384, 110); cg.fillStyle = col; cg.fillText(s, 384, 110); ct.needsUpdate = true; };
  const fx = { dry: burst(0xff5a5a, 40, 1) }; scene.add(fx.dry);
  const st = stamp('BLINK MORE!', '#39a0ff', 0.6); scene.add(st);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      const screen = smooth(range(t, 19.6, 20.4));
      hero.root.position.set(0.15, 0, lerp(0.2, -0.25, screen)); hero.root.rotation.y = lerp(0.1, Math.PI - 0.35, screen);
      let pose = STAND(t);
      if (screen > 0.01) pose = over(pose, { neck: [0.12 * screen, 0, 0], spine: [0.08 * screen, 0, 0], lSh: [-0.6 * screen, 0, 0.16], rSh: [-0.6 * screen, 0, -0.16], lEl: [-1.2 * screen, 0, 0], rEl: [-1.2 * screen, 0, 0] });
      const rub = smooth(range(t, 23.4, 23.8)) * (1 - smooth(range(t, 24.8, 25.2)));
      hero.setPose(pose); hero.setMouth(0.06);
      const bk = blinkK(t);
      lids.forEach(l => { l.rotation.x = 0.25 + 1.55 * bk; });
      screenGlow.intensity = 3 * screen;
      // ---------- camera ----------
      const KEYS = [[0, [0.7, 1.55, 3.9], [0.15, 1.05, -0.2]], [2.4, [0.6, 1.5, 3.4], [0.15, 1.05, -0.1]], [19.4, [0.6, 1.5, 3.4], [0.15, 1.05, -0.1]], [20.6, [2.0, 1.7, 2.6], [0.2, 1.0, -0.6]], [25.8, [1.9, 1.7, 2.4], [0.2, 1.0, -0.6]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.35, 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const ek = easeOut(range(t, 0.3, 0.7));
      const dust = smooth(range(t, 15.0, 15.5)) * (1 - smooth(range(t, 19.2, 19.6)));
      const wipe = range(t, 16.9, 18.3) * (t < 19.6 ? 1 : 0);
      const wet = smooth(range(t, 16.9, 17.6)) * (1 - smooth(range(t, 19.8, 21.6)));
      const dry = smooth(range(t, 22.6, 23.4));
      drawEye(bk, dust, wet, dry, wipe, t);
      bub.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.07).addScaledVector(rt, 0.155); bub.scale.setScalar(0.34 * ek); bub.visible = ek > 0.01;
      // counters left-middle
      let txt = '', col = '#ffd23f', ck = 0;
      if (t > 2.6 && t < 4.3) { txt = `${Math.min(15, Math.floor(range(t, 2.6, 4.2) * 15) + 1)} / min`; ck = 1; }
      else if (t >= 4.3 && t < 7.6) { txt = Math.round(lerp(15, 15000, easeOut(range(t, 4.5, 6.6)))).toLocaleString('en-US'); ck = 1; }
      else if (t >= 7.6 && t < 10.3) { txt = '0.3 s'; ck = 1; col = '#9fd8ff'; }
      else if (t >= 10.3 && t < 14.6) { txt = `${Math.round(lerp(0, 75, easeOut(range(t, 10.6, 13.2))))} min`; ck = 1; col = '#9fd8ff'; }
      else if (t >= 21.3 && t < 23.0) { txt = `${Math.max(5, Math.round(lerp(15, 5, range(t, 21.3, 22.4))))} / min`; ck = 1; col = '#ff5a5a'; }
      const cIn = ck * Math.min(1, Math.min(range(t, 2.6, 2.8) + (t > 4.3 ? 1 : 0), 1));
      if (ck) drawC(txt, col);
      cnt.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.1).addScaledVector(rt, -0.1); cnt.scale.set(0.46 * cIn, 0.132 * cIn, 1); cnt.visible = ck > 0 && cIn > 0.01;
      fx.dry.position.copy(hero.j.head.getWorldPosition(V())); fx.dry.update(t - 23.0);
      st.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); st.set(t > 23.6 ? easeOut(range(t, 23.6, 23.8)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.3, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
