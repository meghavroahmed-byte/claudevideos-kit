import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 28.6;
export const CAPTIONS = [
  [0.0, 'Why does hair grow?'],
  [1.82, 'Under your skin'], [3.2, 'every hair sits in a tiny pocket'], [5.43, 'called a follicle'],
  [6.85, 'At the bottom'], [7.86, 'cells divide super fast'], [9.76, 'and push the older cells up and out'], [12.53, 'Those dead cells harden'], [14.02, 'into the hair you see'],
  [15.61, 'It grows about a centimeter a month'], [18.28, 'But each hair only grows for a few years'], [21.12, 'then falls out'], [22.16, 'and a new one starts'],
  [23.72, "That's why you lose up to"], [25.0, 'a hundred hairs every single day!', 28.4],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-2, 6, 4], sun: 0.9 });
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xfff4e8); hemi.groundColor.set(0x504040); hemi.intensity = 1.0;
  // barbershop
  const floorT = canvasTex(512, 512, (g) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#1a1a1e' : '#f4f4f0'; g.fillRect(i * 64, j * 64, 64, 64); } });
  floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(6, 6);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.4 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const wallT = canvasTex(512, 512, (g) => { g.fillStyle = '#2a5a4a'; g.fillRect(0, 0, 512, 512); g.fillStyle = '#e8e0cc'; g.fillRect(0, 300, 512, 212); g.fillStyle = '#8a6a40'; g.fillRect(0, 290, 512, 14); });
  wallT.wrapS = wallT.wrapT = THREE.RepeatWrapping; wallT.repeat.set(4, 1);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), new THREE.MeshStandardMaterial({ map: wallT, roughness: 0.9 })); back.position.set(0, 2, -1.8); scene.add(back);
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), new THREE.MeshStandardMaterial({ color: 0xbfd8e8, metalness: 0.9, roughness: 0.05 })); mirror.position.set(-0.9, 1.55, -1.78); scene.add(mirror);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.42, 0.04), new THREE.MeshStandardMaterial({ color: 0xc8a050, metalness: 0.6, roughness: 0.3 })); frame.position.set(-0.9, 1.55, -1.8); scene.add(frame);
  const poleT = canvasTex(128, 512, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 512); for (let i = -4; i < 12; i++) { g.fillStyle = i % 2 ? '#e63946' : '#1d4ed8'; g.beginPath(); g.moveTo(0, i * 64); g.lineTo(128, i * 64 + 64); g.lineTo(128, i * 64 + 96); g.lineTo(0, i * 64 + 32); g.fill(); } });
  poleT.wrapS = poleT.wrapT = THREE.RepeatWrapping;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.0, 24), new THREE.MeshStandardMaterial({ map: poleT, roughness: 0.2 })); pole.position.set(1.2, 1.7, -1.65); scene.add(pole);
  for (const y of [1.18, 2.22]) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 20), new THREE.MeshStandardMaterial({ color: 0xc8ccd4, metalness: 0.8 })); cap.position.set(1.2, y, -1.65); scene.add(cap); }
  const chair = new THREE.Group(); chair.position.set(1.0, 0, -0.9); scene.add(chair);
  const red = new THREE.MeshStandardMaterial({ color: 0xb8283a, roughness: 0.4 }), chrome = new THREE.MeshStandardMaterial({ color: 0xc8ccd4, metalness: 0.8, roughness: 0.25 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.15, 0.55), red); seat.position.y = 0.6; chair.add(seat); const bk = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.12), red); bk.position.set(0, 1.0, -0.25); chair.add(bk); const base = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.25, 0.55, 16), chrome); base.position.y = 0.27; chair.add(base);
  const light = new THREE.PointLight(0xfff0dc, 7, 8, 1.2); light.position.set(0.6, 2.6, 2.0); scene.add(light);
  // hero + comb + extra hair cap that grows
  const hero = makeHuman('casual', { shirt: 0xd8572a, jeans: 0x2f3e5a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const hairM = new THREE.MeshStandardMaterial({ color: 0x3a2516, roughness: 0.8 });
  const grow = new THREE.Mesh(new THREE.SphereGeometry(0.122, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), hairM); grow.position.set(0, 0.155, -0.015); hero.j.head.add(grow);
  const comb = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.01), new THREE.MeshStandardMaterial({ color: 0x222228 })); scene.add(comb);
  // falling hairs
  const fall = []; const fr = rng(6); for (let i = 0; i < 40; i++) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.12, 4), hairM); h.userData = { x: (fr() - 0.5) * 0.4, z: (fr() - 0.5) * 0.3, ph: fr(), rot: fr() * 6 }; scene.add(h); fall.push(h); }
  // ruler beside the hair
  const rulerT = canvasTex(64, 256, (g) => { g.fillStyle = '#ffd23f'; g.fillRect(0, 0, 64, 256); g.fillStyle = '#222'; for (let i = 0; i < 11; i++) g.fillRect(0, i * 24 + 6, i % 5 === 0 ? 40 : 22, 4); });
  const ruler = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.16), new THREE.MeshBasicMaterial({ map: rulerT, transparent: true, toneMapped: false })); scene.add(ruler);
  const cm = textSprite('1 cm', '#ffd23f', "400 120px Brand, sans-serif"); scene.add(cm);
  // follicle bubble
  const zc = document.createElement('canvas'); zc.width = zc.height = 512; const zg = zc.getContext('2d'); const zt = new THREE.CanvasTexture(zc); zt.colorSpace = THREE.SRGBColorSpace;
  const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); bub.renderOrder = 30; scene.add(bub);
  const drawF = (pocket, divide, push, hairLen, out, newH, tt) => { zg.clearRect(0, 0, 512, 512); zg.save(); zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.clip();
    zg.fillStyle = '#bfe3ff'; zg.fillRect(0, 0, 512, 512); zg.fillStyle = '#f2c4a4'; zg.fillRect(0, 170, 512, 342); zg.fillStyle = '#e8a080'; zg.fillRect(0, 250, 512, 262);
    // follicle pocket
    zg.fillStyle = `rgba(200,110,90,${pocket})`; zg.beginPath(); zg.moveTo(226, 170); zg.lineTo(222, 400); zg.quadraticCurveTo(256, 450, 290, 400); zg.lineTo(286, 170); zg.fill();
    zg.strokeStyle = `rgba(150,60,50,${pocket})`; zg.lineWidth = 5; zg.stroke();
    // dividing cells at the bottom
    if (divide > 0) for (let i = 0; i < 6; i++) { const s = (tt * 2 + i * 0.3) % 1; const x = 240 + (i % 3) * 16, y = 405 - Math.floor(i / 3) * 18; zg.fillStyle = `rgba(255,150,190,${divide})`; zg.beginPath(); zg.arc(x - s * 6, y, 9, 0, 7); zg.arc(x + s * 6, y, 9, 0, 7); zg.fill(); }
    // pushed cells moving up into the shaft
    if (push > 0) for (let i = 0; i < 8; i++) { const u2 = (tt * 0.4 + i / 8) % 1; const y = 390 - u2 * 220; zg.fillStyle = `rgba(${Math.round(lerp(255, 90, u2))},${Math.round(lerp(170, 60, u2))},${Math.round(lerp(200, 40, u2))},${push})`; zg.beginPath(); zg.arc(256, y, 10, 0, 7); zg.fill(); }
    // hair shaft (grows up out of skin)
    const top = 170 - hairLen * 170, dx = out * 260, dy = -out * 80;
    if (hairLen > 0.01) { zg.strokeStyle = '#3a2516'; zg.lineWidth = 16; zg.lineCap = 'round'; zg.beginPath(); zg.moveTo(256 + dx, 360 + dy - (out > 0 ? 190 : 0)); zg.lineTo(256 + dx, top + dy); zg.stroke(); }
    if (newH > 0) { zg.strokeStyle = '#3a2516'; zg.lineWidth = 12; zg.beginPath(); zg.moveTo(256, 380); zg.lineTo(256, 380 - newH * 230); zg.stroke(); }
    zg.restore(); zg.strokeStyle = 'rgba(255,255,255,0.95)'; zg.lineWidth = 12; zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.stroke(); zt.needsUpdate = true; };
  // years + 100 counter
  const yc = document.createElement('canvas'); yc.width = 512; yc.height = 200; const yg = yc.getContext('2d'); const yt = new THREE.CanvasTexture(yc); yt.colorSpace = THREE.SRGBColorSpace;
  const yrs = new THREE.Sprite(new THREE.SpriteMaterial({ map: yt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); yrs.renderOrder = 31; scene.add(yrs); let lastY = '';
  const drawY = (s, col) => { if (s === lastY) return; lastY = s; yg.clearRect(0, 0, 512, 200); yg.font = "400 120px Brand, sans-serif"; yg.textAlign = 'center'; yg.textBaseline = 'middle'; yg.lineWidth = 12; yg.strokeStyle = 'rgba(0,0,0,0.5)'; yg.strokeText(s, 256, 100); yg.fillStyle = col; yg.fillText(s, 256, 100); yt.needsUpdate = true; };
  const fx = { hook: burst(0x8a5a3a, 40, 1) }; scene.add(fx.hook);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      poleT.offset.y = -t * 0.4;
      hero.root.position.set(-0.15, 0, 0.1); hero.root.rotation.y = 0.2;
      // hair: hook = long messy hair that's been growing; after centimeter grows again
      const g1 = lerp(1.0, 1.14, smooth(range(t, 0.2, 1.4))) - 0.14 * smooth(range(t, 1.7, 2.2));
      const g2 = 1 + 0.1 * smooth(range(t, 16.0, 17.6));
      const s = t < 15 ? g1 : g2;
      grow.scale.set(s, s * 1.05, s);
      const combK = Math.max(smooth(range(t, 23.8, 24.3)), 1 - smooth(range(t, 1.4, 1.9)));
      let pose = STAND(t);
      hero.setPose(pose); hero.setMouth(t > 25 && t < 26.4 ? 0.4 : 0.06);
      scene.updateMatrixWorld(true);
      const rs = hero.j.rSh.getWorldPosition(V()), head = hero.j.head.getWorldPosition(V());
      if (combK > 0.01) { const ct = head.clone().add(V(0.05 + Math.sin(t * 6) * 0.06, 0.2, 0.05)); ikArm(hero, 'r', rs.clone().add(V(0.05, -0.5, 0.1)).lerp(ct, combK), rs.clone().add(V(0.3, -0.2, -0.2)), V(0, 0, 1)); scene.updateMatrixWorld(true); }
      const rh = hero.j.rWr.localToWorld(V(0, -0.07, 0));
      comb.position.copy(rh); comb.rotation.set(0, 0.2, 0.3); comb.visible = combK > 0.05;
      fall.forEach((h, i) => { const u2 = ((t - 24.0) * 0.45 + h.userData.ph) % 1; h.position.copy(head).add(V(h.userData.x + Math.sin(t * 2 + i) * 0.05, 0.15 - u2 * 1.9, h.userData.z + 0.1)); h.rotation.set(h.userData.rot + t * 2, 0, h.userData.rot); h.visible = (t > 24.0 || t < 1.9) && u2 < 0.98 && (t < 1.9 ? i < 10 : true); });
      const rk = smooth(range(t, 15.8, 16.3)) * (1 - smooth(range(t, 18.0, 18.4)));
      ruler.position.copy(head).add(V(0.17, 0.17, 0.08)); ruler.scale.setScalar(Math.max(0.001, rk * 1.5)); ruler.visible = rk > 0.01; ruler.lookAt(c.position);
      cm.position.copy(head).add(V(0.38, 0.22, 0.05)); cm.scale.set(0.4 * rk, 0.2 * rk, 1); cm.visible = rk > 0.01;
      // ---------- camera ----------
      const KEYS = [[0, [0.6, 1.55, 4.4], [-0.1, 1.0, -0.3]], [1.8, [0.45, 1.5, 3.8], [-0.1, 1.05, -0.2]], [15.4, [0.45, 1.5, 3.7], [-0.1, 1.05, -0.2]], [16.0, [0.3, 1.6, 3.1], [-0.05, 1.15, -0.1]], [18.2, [0.3, 1.6, 3.2], [-0.05, 1.1, -0.1]], [23.6, [0.45, 1.5, 3.7], [-0.1, 1.05, -0.2]], [28.6, [0.55, 1.5, 4.0], [-0.1, 1.0, -0.2]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.4, 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const bk2 = easeOut(range(t, 2.0, 2.4)) * (1 - smooth(range(t, 15.4, 15.8))) + easeOut(range(t, 18.3, 18.7)) * (1 - smooth(range(t, 23.4, 23.8)));
      if (bk2 > 0.01) {
        const pocket = smooth(range(t, 4.3, 5.0)), divide = smooth(range(t, 7.8, 8.4)), push = smooth(range(t, 9.8, 10.4)) * (1 - smooth(range(t, 14.8, 15.4)));
        let hairLen = t < 18 ? 0.4 + 0.3 * smooth(range(t, 12.5, 14.8)) : 0.7 + 0.25 * smooth(range(t, 18.5, 20.8));
        const out = smooth(range(t, 21.1, 22.0)), newH = smooth(range(t, 22.2, 23.4)) * 0.5;
        drawF(pocket, divide, push, hairLen, out, newH, t);
      }
      bub.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.06).addScaledVector(rt, 0.155); bub.scale.setScalar(0.34 * bk2); bub.visible = bk2 > 0.01;
      const yk = easeOut(range(t, 19.0, 19.3)) * (1 - smooth(range(t, 21.0, 21.3))) + easeOut(range(t, 24.9, 25.2));
      if (t < 22) drawY(`${Math.max(1, Math.round(lerp(1, 5, range(t, 19.2, 20.6))))} YRS`, '#ffd23f'); else drawY(`${Math.round(lerp(0, 100, easeOut(range(t, 25.0, 26.6))))} / DAY`, '#ff5fa2');
      yrs.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, t < 22 ? 0.14 : -0.2).addScaledVector(rt, t < 22 ? 0.155 : -0.1); yrs.scale.set(0.34 * yk, 0.133 * yk, 1); yrs.visible = yk > 0.01;
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.35, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
