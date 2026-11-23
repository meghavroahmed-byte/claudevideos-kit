import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { burst } from './rare.js';
import { stamp, iconBubble } from './ancient.js';
import { bedroom, textSprite } from './room.js';

export const DURATION = 29.3;
export const CAPTIONS = [
  [0.0, 'Why do we get hiccups?'],
  [1.85, 'Under your lungs'], [2.85, 'is a dome-shaped muscle'], [4.42, 'called the diaphragm'], [5.93, 'It moves down'], [6.76, 'every time you breathe in'],
  [8.66, 'Eating too fast'], [10.01, 'drinking fizzy drinks'], [11.25, 'or even laughing too hard'], [12.79, 'can irritate it'], [14.1, 'and it suddenly spasms'],
  [16.07, 'You gulp in air'], [17.09, 'and a flap in your throat'], [18.46, 'slams shut'], [19.73, "That's the hic sound!"],
  [21.37, 'Most hiccups stop on their own'], [23.01, 'within a few minutes'], [24.37, 'But one man in America'], [25.87, 'hiccupped for 68 years!', 29.1],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const SIT = { drop: -0.45, lHip: [-1.5, 0, 0.1], lKn: [1.45, 0, 0], rHip: [-1.5, 0, -0.1], rKn: [1.45, 0, 0] };
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const HICS = [16.2, 18.6, 20.25, 22.0, 26.4, 27.6];
const hicK = (t) => HICS.reduce((m, h) => Math.max(m, Math.exp(-Math.abs(t - h) * 9) * (t > h - 0.05 ? 1 : 0)), 0);

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 5, sunDir: [-2, 6, 3], sun: 1.6 });
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xfff4e0); hemi.groundColor.set(0x6a5040); hemi.intensity = 1.05;
  const key = scene.userData.key; key.position.set(-2, 6, 4);
  const room = bedroom(); scene.add(room); room.userData.bed.visible = false; room.userData.desk.visible = false; room.userData.chair.visible = false;
  room.traverse(o => { if (o.isMesh && o.material.map && o.material.map.repeat.x === 4) o.material.color.set(0xffe9b0); });
  const ceil = new THREE.PointLight(0xfff0dc, 6, 9, 1.2); ceil.position.set(0, 2.9, 1.2); scene.add(ceil);
  // diner table + stool + food
  const tbl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 28), new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.4 })); tbl.position.set(0.1, 0.78, 0.15); scene.add(tbl);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.78, 10), new THREE.MeshStandardMaterial({ color: 0xc0c4ca, metalness: 0.8, roughness: 0.3 })); leg.position.set(0.1, 0.39, 0.15); scene.add(leg);
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 20), new THREE.MeshStandardMaterial({ color: 0x2a6f9a })); stool.position.set(0.1, 0.48, -0.55); scene.add(stool);
  const sleg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.48, 8), leg.material); sleg.position.set(0.1, 0.24, -0.55); scene.add(sleg);
  const burger = new THREE.Group(); burger.position.set(-0.1, 0.81, 0.3); scene.add(burger);
  [[0xd8963a, 0.05, 0.12], [0x5a3a20, 0.035, 0.11], [0xffd23f, 0.015, 0.12], [0x5fbf3a, 0.015, 0.12], [0xd8963a, 0.06, 0.12]].reduce((y, [col, h, r]) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 })); m.position.y = y + h / 2; burger.add(m); return y + h; }, 0);
  const soda = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.13, 16), new THREE.MeshStandardMaterial({ color: 0xff3b5c, metalness: 0.6, roughness: 0.3 })); scene.add(soda);
  const bubbles = []; for (let i = 0; i < 14; i++) { const b = glowSprite(0xffffff, 0.03); b.userData.ph = i / 14; scene.add(b); bubbles.push(b); }
  const hero = makeHuman('casual', { shirt: 0xffb703, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const old = makeHuman('casual', { shirt: 0x6c757d, jeans: 0x5a4a3a, hair: 0xd8d8d8 }); scene.add(old.root);
  old.root.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.0; } });
  // x-ray chest bubble (dynamic canvas)
  const xc = document.createElement('canvas'); xc.width = xc.height = 512; const xg = xc.getContext('2d'); const xt = new THREE.CanvasTexture(xc); xt.colorSpace = THREE.SRGBColorSpace;
  const xray = new THREE.Sprite(new THREE.SpriteMaterial({ map: xt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); xray.renderOrder = 30; scene.add(xray);
  const drawX = (breath, spasm, flap, irritate, tt) => { xg.clearRect(0, 0, 512, 512); xg.save(); xg.beginPath(); xg.arc(256, 256, 240, 0, 7); xg.clip(); xg.fillStyle = '#0e1a30'; xg.fillRect(0, 0, 512, 512);
    xg.fillStyle = 'rgba(120,170,255,0.18)'; xg.beginPath(); xg.ellipse(256, 300, 170, 230, 0, 0, 7); xg.fill();
    xg.fillStyle = '#d0d6de'; xg.fillRect(244, 20, 24, 150); // windpipe
    const dy = 330 + breath * 40 + spasm * 55;
    for (const s of [-1, 1]) { xg.fillStyle = '#ff8fab'; xg.beginPath(); xg.ellipse(256 + s * 80, 230 + breath * 10, 62 + breath * 10, 100 + breath * 20, s * 0.12, 0, 7); xg.fill(); }
    xg.strokeStyle = irritate > 0.5 ? `rgb(255,${Math.round(80 + 80 * Math.sin(tt * 20))},60)` : '#ff3b3b'; xg.lineWidth = 20; xg.lineCap = 'round'; xg.beginPath(); xg.moveTo(90, dy + 40); xg.quadraticCurveTo(256, dy - 90, 422, dy + 40); xg.stroke();
    // epiglottis flap at the top of the windpipe
    xg.save(); xg.translate(256, 120); xg.rotate(-1.3 + 1.3 * flap); xg.fillStyle = '#ffd23f'; xg.fillRect(0, -8, 60, 16); xg.restore();
    if (spasm > 0.3) { xg.fillStyle = `rgba(255,255,255,${spasm})`; for (let i = 0; i < 6; i++) { xg.beginPath(); xg.arc(256 + Math.cos(i) * 60, 60 + i * 12, 6, 0, 7); xg.fill(); } }
    xg.restore(); xg.strokeStyle = 'rgba(160,210,255,0.9)'; xg.lineWidth = 12; xg.beginPath(); xg.arc(256, 256, 240, 0, 7); xg.stroke(); xt.needsUpdate = true; };
  const hic = textSprite('HIC!', '#ff5fa2', "400 140px Brand, sans-serif"); scene.add(hic);
  const years = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); years.renderOrder = 31; scene.add(years);
  const yc = document.createElement('canvas'); yc.width = 512; yc.height = 220; const yg = yc.getContext('2d'); const yt = new THREE.CanvasTexture(yc); yt.colorSpace = THREE.SRGBColorSpace; years.material.map = yt; let lastY = -1;
  const drawY = (n) => { if (n === lastY) return; lastY = n; yg.clearRect(0, 0, 512, 220); yg.font = "400 150px Brand, sans-serif"; yg.textAlign = 'center'; yg.textBaseline = 'middle'; yg.lineWidth = 12; yg.strokeStyle = 'rgba(0,0,0,0.5)'; yg.strokeText(`${n} YRS`, 256, 115); yg.fillStyle = '#ffd23f'; yg.fillText(`${n} YRS`, 256, 115); yt.needsUpdate = true; };
  const fx = HICS.map((_, i) => burst(0xff5fa2, 30, i + 1));
  fx.forEach(f => scene.add(f));
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      const hk = hicK(t);
      // hero sits and eats fast, drinks soda, laughs, then hiccups
      hero.root.position.set(0.1, 0, -0.5); hero.root.rotation.y = 0;
      const eat = t > 8.6 && t < 10.0, drink = t > 10.0 && t < 11.2, laugh = t > 11.4 && t < 12.8;
      const bite = Math.max(0, Math.sin(t * 10));
      let pose = over(SIT, { lSh: [-0.6, 0, 0.2], lEl: [-1.2, 0, 0], rSh: [-0.6, 0, -0.2], rEl: [-1.2, 0, 0], neck: [0.1, 0, 0] });
      if (eat) pose = over(pose, { rSh: [-1.0, 0, -0.1], rEl: [-1.9 - 0.2 * bite, 0, 0], lSh: [-1.0, 0, 0.1], lEl: [-1.9 - 0.2 * bite, 0, 0], neck: [0.15, 0, 0] });
      if (drink) pose = over(pose, { rSh: [-1.6, 0, -0.1], rEl: [-1.6, 0, 0], neck: [-0.35, 0, 0] });
      if (laugh) pose = over(pose, { spine: [0.2 + Math.sin(t * 14) * 0.06, 0, Math.sin(t * 9) * 0.08], neck: [-0.3, Math.sin(t * 7) * 0.2, 0], lSh: [-0.5, 0, 0.4], rSh: [-0.5, 0, -0.4] });
      pose = over(pose, { chest: [-0.12 * hk, 0, 0], neck: [(pose.neck ? pose.neck[0] : 0) - 0.3 * hk, 0, 0] });
      if (hk > 0.02) hero.root.position.y = 0.06 * hk;
      hero.setPose(pose); hero.setMouth(eat ? 0.4 * bite : laugh ? 0.6 + 0.3 * Math.sin(t * 18) : 0.35 * hk + 0.05);
      scene.updateMatrixWorld(true);
      const rh = hero.j.rWr.localToWorld(V(0, -0.08, 0));
      soda.position.copy(drink ? rh : V(0.35, 0.87, 0.2)); soda.rotation.set(drink ? -1.2 : 0, 0, 0);
      bubbles.forEach((b, i) => { const u2 = (t * 0.8 + b.userData.ph) % 1; b.position.copy(soda.position).add(V(Math.sin(i * 2) * 0.03, 0.08 + u2 * 0.2, 0)); b.material.opacity = (t > 9.8 && t < 11.6 ? 1 : 0) * (1 - u2); });
      burger.scale.setScalar(t < 8.6 ? 1 : lerp(1, 0.4, range(t, 8.6, 10)));
      const head = hero.j.head.localToWorld(V(0, 0.15, 0.1));
      hic.position.copy(head).add(V(0.35, 0.15, 0)); hic.scale.set(0.42 * hk, 0.21 * hk, 1); hic.material.opacity = Math.min(1, hk * 1.5); hic.visible = hk > 0.03;
      HICS.forEach((h, i) => { fx[i].position.copy(head).add(V(0, -0.15, 0.1)); fx[i].update(t - h); });
      // the 68-year man (ghost) appears beside him
      const ok = smooth(range(t, 24.4, 25.0));
      old.root.visible = ok > 0.01; old.root.position.set(1.15, 0, -0.3); old.root.rotation.y = -0.35;
      old.root.traverse(o => { if (o.isMesh) o.material.opacity = 0.75 * ok; });
      old.setPose(over(STAND(t, 2), { spine: [0.25, 0, 0], neck: [0.2 - 0.3 * hk, 0, 0], chest: [-0.12 * hk, 0, 0], rSh: [-0.3, 0, -0.2] })); old.setMouth(0.35 * hk);
      // ---------- camera ----------
      const KEYS = [[0, [1.0, 1.55, 4.0], [0.15, 0.9, -0.3]], [1.8, [0.9, 1.5, 3.6], [0.2, 0.95, -0.3]], [8.5, [0.7, 1.45, 3.4], [0.2, 0.9, -0.3]], [21.3, [0.8, 1.5, 3.6], [0.25, 0.95, -0.3]], [24.3, [1.5, 1.6, 4.4], [0.6, 0.95, -0.3]], [29.3, [1.6, 1.6, 4.5], [0.65, 0.95, -0.3]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const sh = shake(t, 0.5 + hk * 3, 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const xk = easeOut(range(t, 1.9, 2.3)) * (1 - smooth(range(t, 21.2, 21.6)));
      if (xk > 0.01) { const breath = t < 8.6 ? 0.5 + 0.5 * Math.sin(t * 2.2) : 0.5 + 0.5 * Math.sin(t * 2.2); const fl = hk > 0.3 ? 1 : smooth(range(t, 17.3, 18.4)) * (1 - smooth(range(t, 18.9, 19.3))); drawX(breath, hk, Math.max(fl, hk), t > 12.7 && t < 15.5 ? 1 : 0, t); }
      xray.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.18).addScaledVector(rt, 0.17); xray.scale.setScalar(0.32 * xk); xray.material.opacity = xk; xray.visible = xk > 0.01;
      const yk = easeOut(range(t, 26.4, 26.7));
      drawY(Math.round(lerp(0, 68, easeOut(range(t, 26.5, 27.8)))));
      years.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.22); years.scale.set(0.45 * yk, 0.19 * yk, 1); years.material.opacity = yk; years.visible = yk > 0.01;
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.4, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
