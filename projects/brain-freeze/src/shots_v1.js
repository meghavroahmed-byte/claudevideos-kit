import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { rng } from './textures.js';

export const DURATION = 27.6;
export const CAPTIONS = [
  [0.0, 'What is brain freeze?'],
  [1.88, 'You take a big bite of ice cream'], [3.73, 'and suddenly'], [4.8, 'a sharp pain'], [5.84, 'stabs your forehead'],
  [7.37, 'The cold hits'], [8.17, 'the roof of your mouth'], [9.47, 'right where'], [10.08, 'a lot of blood vessels sit'],
  [12.0, 'They shrink from the cold'], [13.41, 'then quickly swell back up'], [14.95, 'to warm things again'],
  [16.49, 'That rush of blood'], [17.55, 'sets off pain nerves'], [19.03, 'and your brain thinks'], [20.03, 'the pain is in your head'],
  [21.72, 'The fix?'], [22.64, 'Press your tongue'], [23.53, 'on the roof of your mouth'], [24.92, 'and it fades in seconds', 27.4],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const PAIN = 4.8;

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 7, sunDir: [-3, 8, 5], sun: 2.8 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x1a8ce0); u.mid.value.set(0x5cc0f0); u.horizon.value.set(0xd8f4ff); u.floorC.value.set(0xf0dca8);
  scene.fog = new THREE.Fog(0xd8f0fa, 30, 120);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.9;
  // beach: sand, sea strip, boardwalk, ice-cream cart with umbrella, palm
  const sandT = canvasTex(512, 512, (g) => { g.fillStyle = '#f2dca6'; g.fillRect(0, 0, 512, 512); const r = rng(5); for (let i = 0; i < 2500; i++) { g.fillStyle = r() > 0.5 ? 'rgba(200,170,110,0.35)' : 'rgba(255,245,215,0.5)'; g.fillRect(r() * 512, r() * 512, 2, 2); } });
  sandT.wrapS = sandT.wrapT = THREE.RepeatWrapping; sandT.repeat.set(40, 40);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ map: sandT, roughness: 1 })); sand.rotation.x = -Math.PI / 2; sand.receiveShadow = true; scene.add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(300, 120), new THREE.MeshStandardMaterial({ color: 0x1fa6c8, roughness: 0.15, metalness: 0.2 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.02, -70); scene.add(sea);
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(300, 0.6), new THREE.MeshBasicMaterial({ color: 0xffffff })); foam.rotation.x = -Math.PI / 2; foam.position.set(0, 0.03, -10); scene.add(foam);
  const deck = new THREE.Group(); scene.add(deck); const plank = new THREE.MeshStandardMaterial({ color: 0xa8784a, roughness: 0.8 });
  for (let i = 0; i < 18; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(6, 0.06, 0.2), plank); p.position.set(0, 0.03, -1.7 + i * 0.22); p.receiveShadow = true; deck.add(p); }
  // cart
  const cart = new THREE.Group(); cart.position.set(1.2, 0, -1.1); cart.rotation.y = -0.35; scene.add(cart);
  const cartM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }), stripe = new THREE.MeshStandardMaterial({ color: 0xff6fa0, roughness: 0.5 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 0.6), cartM); box.position.y = 0.6; box.castShadow = true; cart.add(box);
  const band = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.12, 0.62), stripe); band.position.y = 0.72; cart.add(band);
  for (const x of [-0.42, 0.42]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 20), new THREE.MeshStandardMaterial({ color: 0x333338 })); w.position.set(x, 0.2, 0.31); cart.add(w); }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 8), cartM); pole.position.set(0, 1.6, 0); cart.add(pole);
  const umb = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.35, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xff6fa0, side: THREE.DoubleSide, roughness: 0.6 })); umb.position.set(0, 2.3, 0); cart.add(umb);
  const scoopCols = [0xffc0d8, 0x8fe0c0, 0xfff0b0, 0x8a5a3a];
  scoopCols.forEach((col, i) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 })); s.position.set(-0.36 + i * 0.24, 1.02, 0); cart.add(s); });
  // palms
  const palm = (x, z, s) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 4, 8), new THREE.MeshStandardMaterial({ color: 0x8a6a40 })); tr.position.y = 2; tr.rotation.z = 0.12; g.add(tr); for (let i = 0; i < 7; i++) { const lf = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.8, 4), new THREE.MeshStandardMaterial({ color: 0x3f9a3a, flatShading: true })); lf.position.set(0.25 + Math.cos(i * 0.9) * 0.7, 3.85, Math.sin(i * 0.9) * 0.7); lf.rotation.set(Math.sin(i * 0.9) * 1.1, 0, -Math.cos(i * 0.9) * 1.1); g.add(lf); } };
  palm(-2.4, -3.5, 1.0); palm(3.6, -6, 1.1); palm(-5, -9, 1.2);

  const hero = makeHuman('casual', { shirt: 0xffffff, jeans: 0x2a9dbf, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  hero.root.traverse(o => { if (o.isMesh && o.material && o.material.color && o.material.color.getHex() === 0xffffff && !o.material.map) { o.material = o.material.clone(); o.material.color.set(0xff8a5c); } });
  // ice cream cone (big)
  const cone = new THREE.Group(); scene.add(cone);
  const waffle = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 14), new THREE.MeshStandardMaterial({ color: 0xd9a05a, roughness: 0.8 })); waffle.rotation.x = Math.PI; waffle.position.y = -0.1; cone.add(waffle);
  const scoops = [0xffc0d8, 0x8fe0c0, 0xfff0b0].map((col, i) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 12), new THREE.MeshStandardMaterial({ color: col, roughness: 0.55 })); s.position.y = 0.02 + i * 0.09; cone.add(s); return s; });
  // forehead pain: icy shards + red glow
  const ice = []; for (let i = 0; i < 8; i++) { const sh = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.16, 5), new THREE.MeshStandardMaterial({ color: 0xbfeaff, emissive: 0x4ab0ff, emissiveIntensity: 0.8, roughness: 0.1 })); sh.userData.a = i / 8 * Math.PI * 2; scene.add(sh); ice.push(sh); }
  const painGlow = glowSprite(0xff3b3b, 0.5); scene.add(painGlow);
  const coolGlow = glowSprite(0x7fd4ff, 0.6); scene.add(coolGlow);
  // head cross-section bubble
  const zc = document.createElement('canvas'); zc.width = zc.height = 512; const zg = zc.getContext('2d'); const zt = new THREE.CanvasTexture(zc); zt.colorSpace = THREE.SRGBColorSpace;
  const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); bub.renderOrder = 30; scene.add(bub);
  const drawB = (cold, vw, vRed, nerve, pain, tongue, warm, tt) => {
    zg.clearRect(0, 0, 512, 512); zg.save(); zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.clip();
    zg.fillStyle = '#1a2440'; zg.fillRect(0, 0, 512, 512);
    // head profile facing right
    zg.fillStyle = '#f2c4a0'; zg.beginPath(); zg.moveTo(130, 470); zg.bezierCurveTo(90, 330, 80, 120, 230, 70); zg.bezierCurveTo(360, 30, 420, 130, 410, 200); zg.lineTo(440, 250); zg.lineTo(415, 268); zg.lineTo(418, 300); zg.lineTo(425, 330); zg.lineTo(410, 345); zg.bezierCurveTo(405, 400, 360, 420, 330, 430); zg.lineTo(320, 512); zg.lineTo(130, 512); zg.fill();
    // brain
    zg.fillStyle = '#ffadc4'; zg.beginPath(); zg.ellipse(250, 155, 125, 78, -0.1, 0, 7); zg.fill();
    zg.strokeStyle = 'rgba(200,90,130,0.6)'; zg.lineWidth = 5; for (let i = 0; i < 5; i++) { zg.beginPath(); zg.moveTo(150 + i * 40, 110); zg.bezierCurveTo(170 + i * 40, 150, 140 + i * 40, 180, 165 + i * 40, 210); zg.stroke(); }
    // mouth cavity + palate
    zg.fillStyle = '#7a2a3a'; zg.beginPath(); zg.moveTo(410, 300); zg.bezierCurveTo(360, 280, 270, 275, 230, 320); zg.bezierCurveTo(260, 380, 360, 370, 412, 330); zg.fill();
    const pal = (x) => 300 - 22 * Math.sin((x - 230) / 180 * Math.PI) - 10;
    zg.strokeStyle = '#ffd6dc'; zg.lineWidth = 12; zg.beginPath(); for (let x = 230; x <= 410; x += 6) { const y = pal(x); x === 230 ? zg.moveTo(x, y) : zg.lineTo(x, y); } zg.stroke();
    // tongue (rises to press the palate)
    zg.fillStyle = '#e8607a'; zg.beginPath(); zg.ellipse(320, lerp(350, 305, tongue), 75, lerp(22, 20, tongue), -0.05, 0, 7); zg.fill();
    // blood vessels along the palate
    const vcol = vRed > 0.5 ? `rgb(255,${Math.round(40 + 40 * Math.sin(tt * 12))},60)` : `rgb(${Math.round(120 + 135 * vRed)},${Math.round(90 - 50 * vRed)},${Math.round(220 - 160 * vRed)})`;
    zg.strokeStyle = vcol; zg.lineWidth = 7 * vw; zg.lineCap = 'round';
    for (let k = 0; k < 2; k++) { zg.beginPath(); for (let x = 240; x <= 400; x += 6) { const y = pal(x) - 14 - k * 13 + Math.sin(x * 0.08 + k) * 4; x === 240 ? zg.moveTo(x, y) : zg.lineTo(x, y); } zg.stroke(); }
    // cold wave on the palate
    if (cold > 0.01) { zg.fillStyle = `rgba(140,220,255,${0.75 * cold})`; for (let i = 0; i < 18; i++) { const x = 240 + i * 9.5, y = pal(x) + 6 + Math.sin(i + tt * 6) * 3; zg.beginPath(); zg.arc(x, y, 9, 0, 7); zg.fill(); } }
    // pain nerve: from palate up to forehead
    if (nerve > 0.01) { zg.strokeStyle = `rgba(255,225,80,${nerve})`; zg.lineWidth = 6; zg.setLineDash([14, 10]); zg.lineDashOffset = -tt * 120; zg.beginPath(); zg.moveTo(330, pal(330) - 30); zg.quadraticCurveTo(300, 200, 375, 135); zg.stroke(); zg.setLineDash([]); }
    // pain spot at forehead
    if (pain > 0.01) { const r = 30 + 10 * Math.sin(tt * 14); const gr = zg.createRadialGradient(385, 125, 0, 385, 125, r * 2); gr.addColorStop(0, `rgba(255,60,60,${pain})`); gr.addColorStop(1, 'rgba(255,60,60,0)'); zg.fillStyle = gr; zg.beginPath(); zg.arc(385, 125, r * 2, 0, 7); zg.fill(); zg.strokeStyle = `rgba(255,255,255,${pain})`; zg.lineWidth = 6; for (let i = 0; i < 6; i++) { const a = i / 6 * 7 + tt; zg.beginPath(); zg.moveTo(385 + Math.cos(a) * 30, 125 + Math.sin(a) * 30); zg.lineTo(385 + Math.cos(a) * 55, 125 + Math.sin(a) * 55); zg.stroke(); } }
    // warm glow from tongue
    if (warm > 0.01) { const gr = zg.createRadialGradient(320, 300, 0, 320, 300, 120); gr.addColorStop(0, `rgba(255,170,60,${0.7 * warm})`); gr.addColorStop(1, 'rgba(255,170,60,0)'); zg.fillStyle = gr; zg.beginPath(); zg.arc(320, 300, 120, 0, 7); zg.fill(); }
    zg.restore(); zg.strokeStyle = 'rgba(255,255,255,0.95)'; zg.lineWidth = 12; zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.stroke(); zt.needsUpdate = true; };
  const fx = { stab: burst(0x9fe0ff, 60, 1), fix: burst(0x5be37d, 60, 2) };
  Object.values(fx).forEach(f => scene.add(f));
  const fixed = stamp('FIXED!', '#5be37d', 0.6); scene.add(fixed);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      hero.root.position.set(0, 0, 0); hero.root.rotation.y = 0.2;
      const pain = Math.max(smooth(range(t, PAIN - 0.1, PAIN + 0.3)) * (1 - smooth(range(t, 7.0, 7.8))), smooth(range(t, 17.6, 18.2)) * (1 - smooth(range(t, 23.6, 24.8))), (1 - smooth(range(t, 1.2, 1.8))));
      const relief = smooth(range(t, 24.9, 25.6));
      let pose = over(STAND(t), { rSh: [-0.5, 0, -0.15], rEl: [-1.3, 0, 0] });
      pose = over(pose, { spine: [0.12 * pain, 0, 0], neck: [0.25 * pain, 0, 0], lKn: [0.25 * pain, 0, 0], rKn: [0.25 * pain, 0, 0], lHip: [-0.15 * pain, 0, 0.07], rHip: [-0.15 * pain, 0, -0.07] });
      if (relief > 0) pose = over(pose, { neck: [lerp(0.25 * pain, -0.1, relief), 0.2 * relief, 0] });
      hero.root.position.y = -0.03 * pain;
      hero.setPose(pose);
      hero.setMouth(pain > 0.4 ? 0.55 : (t > 2.4 && t < 3.6 ? 0.6 : 0.08));
      scene.updateMatrixWorld(true);
      const head = hero.j.head.localToWorld(V(0, 0.1, 0)), fore = hero.j.head.localToWorld(V(0, 0.16, 0.12)), mouthW = hero.j.head.localToWorld(V(0, -0.04, 0.16));
      // right hand: cone near chest, up to the mouth for the bite
      const bite = smooth(range(t, 2.0, 2.6)) * (1 - smooth(range(t, 3.6, 4.2)));
      const restC = hero.j.chest.localToWorld(V(-0.2, 0.08, 0.32));
      const ct = restC.clone().lerp(mouthW.clone().add(V(0, 0.02, 0.1)), bite);
      const rs = hero.j.rSh.getWorldPosition(V());
      ikArm(hero, 'r', ct.clone().add(V(0, -0.1, 0)), rs.clone().add(V(-0.1, -0.5, 0.2)), V(0, 0, 1));
      // left hand to forehead while in pain
      const ls = hero.j.lSh.getWorldPosition(V());
      if (pain > 0.01) { const lt = ls.clone().add(V(0.06, -0.55, 0.08)).lerp(hero.j.head.localToWorld(V(0.07, 0.2, 0.1)), pain); ikArm(hero, 'l', lt, ls.clone().add(V(0.4, -0.3, 0.2)), V(0, 0, 1)); }
      scene.updateMatrixWorld(true);
      cone.position.copy(hero.j.rWr.localToWorld(V(0, -0.1, 0.02))).add(V(0, 0.12, 0)); cone.rotation.set(0, 0, 0);
      scoops[2].visible = t < 3.0; scoops[2].scale.setScalar(t < 2.8 ? 1 : lerp(1, 0.3, range(t, 2.8, 3.0)));
      // icy shards + pain glow on the forehead
      const stab = easeOut(range(t, PAIN, PAIN + 0.25)) * (1 - smooth(range(t, 6.9, 7.4)));
      const hookStab = 1 - smooth(range(t, 1.2, 1.8));
      const sk = Math.max(stab, hookStab);
      ice.forEach((s, i) => { const a = s.userData.a + t * 0.5; const dir = V(Math.cos(a), Math.sin(a), 0.4).normalize(); s.position.copy(fore).addScaledVector(dir, 0.12 + 0.03 * Math.sin(t * 20 + i)); s.quaternion.setFromUnitVectors(V(0, -1, 0), dir.clone().negate()); s.scale.setScalar(Math.max(0.001, sk)); s.visible = sk > 0.01; });
      const pg = Math.max(sk, smooth(range(t, 19.5, 20.0)) * (1 - smooth(range(t, 23.6, 24.6))));
      painGlow.position.copy(fore); painGlow.scale.setScalar(0.35 * pg * (1 + 0.15 * Math.sin(t * 14))); painGlow.material.opacity = 0.8 * pg; painGlow.visible = pg > 0.01;
      fx.stab.position.copy(fore); fx.stab.update(t - PAIN);
      const ck = smooth(range(t, 24.6, 25.2)) * (1 - smooth(range(t, 26.6, 27.2)));
      coolGlow.position.copy(head); coolGlow.scale.setScalar(0.6 * ck); coolGlow.material.opacity = 0.0; coolGlow.visible = false;
      fx.fix.position.copy(head).add(V(0, 0.1, 0)); fx.fix.update(t - 25.6);
      // ---------- camera ----------
      const KEYS = [[0, [0.3, 1.35, 3.6], [0.1, 0.95, 0]], [1.8, [0.25, 1.35, 3.4], [0.05, 0.95, 0]], [7.2, [0.2, 1.35, 3.3], [0.05, 0.95, 0]], [21.6, [0.3, 1.35, 3.5], [0.05, 0.95, 0]], [27.6, [0.45, 1.4, 3.9], [0.12, 0.95, 0]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const sh = shake(t, 0.4 + (t > PAIN && t < PAIN + 0.5 ? 3 : 0), 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const bk = easeOut(range(t, 7.3, 7.7)) * (1 - smooth(range(t, 26.3, 26.7)));
      if (bk > 0.01) {
        const cold = smooth(range(t, 7.6, 8.2)) * (1 - smooth(range(t, 13.4, 14.2)));
        const vw = t < 12 ? 1 : t < 13.4 ? lerp(1, 0.35, smooth(range(t, 12.0, 12.8))) : t < 22.6 ? lerp(0.35, 1.8, easeOut(range(t, 13.6, 14.4))) * (1 + 0.15 * Math.sin(t * 10)) : lerp(1.8, 1, smooth(range(t, 23.6, 25.0)));
        const vRed = t < 12 ? 0.5 : t < 13.4 ? lerp(0.5, 0, smooth(range(t, 12.0, 12.8))) : t < 23.6 ? 1 : lerp(1, 0.5, smooth(range(t, 23.6, 25.0)));
        const nerve = smooth(range(t, 17.5, 18.0)) * (1 - smooth(range(t, 23.8, 24.6)));
        const pn = smooth(range(t, 19.3, 19.8)) * (1 - smooth(range(t, 23.8, 24.8)));
        const tg = smooth(range(t, 22.6, 23.4)), warm = smooth(range(t, 23.4, 24.2)) * (1 - smooth(range(t, 26.0, 26.4)));
        drawB(cold, vw, vRed, nerve, pn, tg, warm, t);
      }
      bub.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.05).addScaledVector(rt, 0.17); bub.scale.setScalar(0.4 * bk); bub.material.opacity = bk; bub.visible = bk > 0.01;
      fixed.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.28); fixed.set(t > 25.7 ? easeOut(range(t, 25.7, 25.9)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.35, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
