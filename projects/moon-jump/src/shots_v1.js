import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { textSprite } from './room.js';
import { rng, glowTexture } from './textures.js';

export const DURATION = 23.6;
export const CAPTIONS = [
  [0.0, 'How high could you jump on the Moon?'],
  [2.31, 'On Earth, a strong jump'], [4.04, 'lifts you about half a meter'], [5.7, 'off the ground'],
  [6.81, "But the Moon's gravity"], [7.9, 'is six times weaker'],
  [9.78, 'So the same jump'], [10.77, 'would launch you three meters high'], [12.98, 'higher than a basketball hoop!'],
  [15.01, "You'd float up slowly"], [16.47, 'and hang in the air'], [17.56, 'for almost four seconds'],
  [19.43, "That's why the astronauts"], [20.55, 'hopped around like kangaroos!', 23.4],
];
export const FADES = [];

const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.2], rSh: [0.05, 0, -0.2], lEl: [-0.3, 0, 0], rEl: [-0.3, 0, 0], lHip: [0, 0, 0.09], rHip: [0, 0, -0.09], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
// jump arc: crouch before t0, airborne t0..t1 with height h (parabola), land squash after
function jump(t, t0, t1, h) { if (t < t0 - 0.35 || t > t1 + 0.4) return { y: 0, crouch: 0, air: 0 }; if (t < t0) return { y: 0, crouch: smooth(range(t, t0 - 0.35, t0 - 0.05)), air: 0 }; if (t <= t1) { const u = (t - t0) / (t1 - t0); return { y: 4 * h * u * (1 - u), crouch: 0, air: 1 }; } return { y: 0, crouch: Math.sin(Math.PI * range(t, t1, t1 + 0.4)) * 0.8, air: 0 }; }
const T0 = 11.0, T1 = 18.6, H = 3.0;
const HOPS = [[19.6, 20.5], [20.75, 21.65], [21.9, 22.8]];

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 8, sunDir: [-5, 7, 4], sun: 3.0 });
  scene.userData.sky.visible = false; scene.background = new THREE.Color(0x020308); scene.fog = null;
  scene.children.filter(o => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry' && !o.material.isShadowMaterial).forEach(o => o.visible = false);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xdfe6ff); hemi.groundColor.set(0x404048); hemi.intensity = 0.55;
  // stars + Earth
  const NS = 1200, sp = new Float32Array(NS * 3), r0 = rng(4);
  for (let i = 0; i < NS; i++) { const v = V(r0() - 0.5, Math.abs(r0() - 0.5) + 0.02, r0() - 0.5).normalize().multiplyScalar(90); sp[i * 3] = v.x; sp[i * 3 + 1] = v.y; sp[i * 3 + 2] = v.z; }
  const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sgeo, new THREE.PointsMaterial({ size: 0.45, map: glowTexture(), color: 0xffffff, transparent: true, depthWrite: false })));
  const earthT = canvasTex(512, 256, (g) => { g.fillStyle = '#1f6fd0'; g.fillRect(0, 0, 512, 256); const r = rng(9); g.fillStyle = '#4caf50'; for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(r() * 512, 40 + r() * 176, 20 + r() * 50, 12 + r() * 30, r() * 3, 0, 7); g.fill(); } g.fillStyle = 'rgba(255,255,255,0.75)'; for (let i = 0; i < 24; i++) { g.beginPath(); g.ellipse(r() * 512, r() * 256, 18 + r() * 40, 5 + r() * 8, 0, 0, 7); g.fill(); } });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(4, 40, 28), new THREE.MeshStandardMaterial({ map: earthT, roughness: 0.8, emissive: 0x0a2040, emissiveIntensity: 0.4 })); earth.position.set(-14, 16, -45); scene.add(earth);
  const eg = glowSprite(0x6ab8ff, 13); eg.material.opacity = 0.35; eg.position.copy(earth.position); scene.add(eg);
  // moon ground with craters
  const groundT = canvasTex(1024, 1024, (g) => { g.fillStyle = '#8a8a90'; g.fillRect(0, 0, 1024, 1024); const r = rng(12); for (let i = 0; i < 4000; i++) { g.fillStyle = r() > 0.5 ? 'rgba(60,60,66,0.25)' : 'rgba(200,200,206,0.25)'; g.fillRect(r() * 1024, r() * 1024, 3, 3); } for (let i = 0; i < 40; i++) { const x = r() * 1024, y = r() * 1024, rr = 10 + r() * 60; g.fillStyle = 'rgba(50,50,56,0.45)'; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); g.strokeStyle = 'rgba(220,220,226,0.5)'; g.lineWidth = 4; g.beginPath(); g.arc(x - 3, y - 3, rr, 3.6, 6.0); g.stroke(); } });
  groundT.wrapS = groundT.wrapT = THREE.RepeatWrapping; groundT.repeat.set(12, 12);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ map: groundT, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const rocks = []; const rr = rng(21); for (let i = 0; i < 18; i++) { const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1 + rr() * 0.4), new THREE.MeshStandardMaterial({ color: 0x75757c, flatShading: true, roughness: 1 })); rk.position.set((rr() - 0.5) * 16, 0.05, -3 - rr() * 12); rk.castShadow = true; scene.add(rk); }
  // lander
  const lander = new THREE.Group(); lander.position.set(3.2, 0, -5.5); lander.rotation.y = -0.5; scene.add(lander);
  const gold = new THREE.MeshStandardMaterial({ color: 0xd8a640, metalness: 0.8, roughness: 0.35 }), silver = new THREE.MeshStandardMaterial({ color: 0xc8ccd4, metalness: 0.7, roughness: 0.3 });
  const lb = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.6), gold); lb.position.y = 1.3; lander.add(lb);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.9, 8), silver); top.position.y = 2.2; lander.add(top);
  for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), silver); l.position.set(x * 0.95, 0.6, z * 0.95); l.rotation.set(z * 0.4, 0, -x * 0.4); lander.add(l); const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 12), silver); pad.position.set(x * 1.2, 0.02, z * 1.2); lander.add(pad); }
  // flag
  const flagT = canvasTex(256, 160, (g) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 160); g.fillStyle = '#39a0ff'; g.font = "400 56px Brand, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CLOUD', 128, 82); });
  const fpole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.0, 8), silver); fpole.position.set(-2.2, 1.0, -2.6); scene.add(fpole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), new THREE.MeshStandardMaterial({ map: flagT, side: THREE.DoubleSide })); flag.position.set(-1.8, 1.72, -2.6); scene.add(flag);
  // height pole with marks
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.05, 3.4, 0.05), new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0x6a5000 })); pole.position.set(0.85, 1.7, -0.2); scene.add(pole);
  const marks = [[0.5, '0.5 m'], [1, '1 m'], [2, '2 m'], [3, '3 m']].map(([h, txt]) => { const tk = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.03), pole.material); tk.position.set(0.85, h, -0.2); scene.add(tk); const lb2 = textSprite(txt, '#ffd23f', "400 90px Brand, sans-serif"); lb2.position.set(1.38, h, -0.2); lb2.scale.set(0.8, 0.4, 1); scene.add(lb2); return lb2; });
  // basketball hoop (3.05 m)
  const hoop = new THREE.Group(); hoop.position.set(-0.95, 0, -0.7); scene.add(hoop);
  const hp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.45, 10), new THREE.MeshStandardMaterial({ color: 0x40444c, metalness: 0.5 })); hp.position.y = 1.72; hoop.add(hp);
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.04), new THREE.MeshStandardMaterial({ color: 0xffffff })); board.position.set(0, 3.3, 0.12); hoop.add(board);
  const sq = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.22), new THREE.MeshBasicMaterial({ color: 0xff5a2a })); sq.position.set(0, 3.2, 0.145); hoop.add(sq);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.015, 8, 24), new THREE.MeshStandardMaterial({ color: 0xff6a1a })); rim.rotation.x = Math.PI / 2; rim.position.set(0, 3.05, 0.36); hoop.add(rim);
  // hero (space suit) + earth twin ghost
  const suit = { shirt: 0x8fa0bc, jeans: 0x8fa0bc, chestText: 'MR. CLOUD' };
  const hero = makeHuman('casual', suit); scene.add(hero.root);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 16), new THREE.MeshStandardMaterial({ color: 0xffd890, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.5 })); helmet.position.y = 0.08; hero.j.head.add(helmet);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.4, 0.16), new THREE.MeshStandardMaterial({ color: 0xdfe2e8 })); pack.position.set(0, 0.12, -0.18); hero.j.chest.add(pack);
  const twin = makeHuman('casual', { shirt: 0x5be37d, jeans: 0x3a8a5a }); scene.add(twin.root);
  twin.root.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0; } });
  const earthIcon = new THREE.Sprite(new THREE.SpriteMaterial({ map: earthT, transparent: true })); scene.add(earthIcon);
  const earthIconB = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 16), new THREE.MeshStandardMaterial({ map: earthT, emissive: 0x1a3060, emissiveIntensity: 0.6 })); scene.add(earthIconB);
  const moonIcon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 16), new THREE.MeshStandardMaterial({ map: groundT, color: 0xdddddd, emissive: 0x303030 })); scene.add(moonIcon);
  earthIcon.visible = false;
  // gravity arrows
  const arM = new THREE.MeshBasicMaterial({ color: 0xff5a5a, toneMapped: false, transparent: true });
  const mkArrow = () => { const g = new THREE.Group(); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 8), arM); sh.position.y = -0.5; g.add(sh); const hd = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 12), arM); hd.rotation.x = Math.PI; hd.position.y = -1; g.add(hd); scene.add(g); return g; };
  const arE = mkArrow(), arM2 = mkArrow();
  const six = textSprite('÷6', '#ff5a5a', "400 220px Brand, sans-serif"); scene.add(six);
  // stopwatch
  const wc = document.createElement('canvas'); wc.width = 256; wc.height = 256; const wg = wc.getContext('2d'); const wt = new THREE.CanvasTexture(wc); wt.colorSpace = THREE.SRGBColorSpace;
  const watch = new THREE.Sprite(new THREE.SpriteMaterial({ map: wt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); watch.renderOrder = 31; scene.add(watch); let lastW = -1;
  const drawW = (sec) => { const q = Math.round(sec * 10); if (q === lastW) return; lastW = q; wg.clearRect(0, 0, 256, 256); wg.fillStyle = 'rgba(255,255,255,0.95)'; wg.beginPath(); wg.arc(128, 140, 105, 0, 7); wg.fill(); wg.fillRect(110, 14, 36, 26); wg.strokeStyle = '#ff5a2a'; wg.lineWidth = 12; wg.beginPath(); wg.arc(128, 140, 92, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sec / 4); wg.stroke(); wg.fillStyle = '#222'; wg.font = "400 64px Brand, sans-serif"; wg.textAlign = 'center'; wg.textBaseline = 'middle'; wg.fillText(`${(q / 10).toFixed(1)}s`, 128, 146); wt.needsUpdate = true; };
  const dustFx = [T1, ...HOPS.map(h => h[1])].map((_, i) => burst(0xb8b8c0, 40, i + 3)); dustFx.forEach(d => scene.add(d));
  const twinDust = burst(0x9fe0a0, 25, 9); scene.add(twinDust);
  const hopWord = textSprite('BOING!', '#ffd23f', "400 110px Brand, sans-serif"); scene.add(hopWord);
  const c = cam(38);
  const crouchPose = (base, k) => over(base, { lHip: [-0.9 * k, 0, 0.09], rHip: [-0.9 * k, 0, -0.09], lKn: [1.4 * k, 0, 0], rKn: [1.4 * k, 0, 0], lAn: [-0.5 * k, 0, -0.07], rAn: [-0.5 * k, 0, 0.07], spine: [0.35 * k, 0, 0], lSh: [0.5 * k, 0, 0.2], rSh: [0.5 * k, 0, -0.2] });
  const airPose = (base, k, t) => over(base, { lSh: [-2.6 * k, 0, 0.3], rSh: [-2.6 * k, 0, -0.3], lEl: [-0.2, 0, 0], rEl: [-0.2, 0, 0], lHip: [-0.3 * k, 0, 0.12], rHip: [-0.1 * k, 0, -0.12], lKn: [0.5 * k, 0, 0], rKn: [0.3 * k, 0, 0] });

  return {
    scene, camera: c,
    update(t) {
      // ---------- hero ----------
      const hx = 0.15;
      let J = jump(t, T0, T1, H);
      let hop = null; for (const [a, b] of HOPS) { const j = jump(t, a, b, 0.9); if (j.air || j.crouch) { hop = j; } }
      if (hop && !(J.air || J.crouch)) J = hop;
      const forward = t > 19.3 ? (t - 19.3) * 0.45 : 0;
      hero.root.position.set(hx - forward * 0.35, J.y * 1.0 + (J.air ? 0 : 0), forward * 0.25); hero.root.rotation.y = t > 19.3 ? -0.8 : 0.1;
      let pose = STAND(t);
      if (J.crouch) pose = crouchPose(pose, J.crouch);
      if (J.air) pose = airPose(pose, t > T0 && t < T1 ? 0.8 : 0.5, t);
      if (J.air && t > 19.3) pose = over(pose, { lHip: [-1.0, 0, 0.12], rHip: [-1.0, 0, -0.12], lKn: [1.3, 0, 0], rKn: [1.3, 0, 0], lSh: [-0.6, 0, 0.3], rSh: [-0.6, 0, -0.3], lEl: [-1.2, 0, 0], rEl: [-1.2, 0, 0] });
      const lookUp = smooth(range(t, 12.2, 12.8)) * (1 - smooth(range(t, 14.0, 14.6)));
      pose.neck = [-0.3 * lookUp, 0.4 * lookUp, 0];
      hero.root.position.y -= J.crouch * 0.18;
      hero.setPose(pose); hero.setMouth(t > T0 && t < 13 ? 0.45 : 0.06);
      // ---------- earth twin ----------
      const tw = smooth(range(t, 2.3, 2.9)) * (1 - smooth(range(t, 9.6, 10.2)));
      const TJ = jump(t, 4.35, 4.99, 0.5);
      twin.root.position.set(-0.55, TJ.y - TJ.crouch * 0.18, 0.35); twin.root.rotation.y = 0.3;
      let tp = STAND(t, 2); if (TJ.crouch) tp = crouchPose(tp, TJ.crouch); if (TJ.air) tp = airPose(tp, 0.6, t);
      twin.setPose(tp); twin.setMouth(0.06);
      twin.root.traverse(o => { if (o.isMesh) o.material.opacity = 0.75 * tw; }); twin.root.visible = tw > 0.01;
      twinDust.position.set(-0.55, 0.05, 0.35); twinDust.update(t - 4.99);
      scene.updateMatrixWorld(true);
      const th = twin.j.head.getWorldPosition(V()), hh = hero.j.head.getWorldPosition(V());
      earthIconB.position.copy(th).add(V(0, 0.42, 0)); earthIconB.scale.setScalar(Math.max(0.001, tw)); earthIconB.visible = tw > 0.01; earthIconB.rotation.y = t;
      const mk = smooth(range(t, 6.8, 7.3)) * (1 - smooth(range(t, 10.0, 10.6)));
      moonIcon.position.copy(hh).add(V(0, 0.42, 0)); moonIcon.scale.setScalar(Math.max(0.001, mk)); moonIcon.visible = mk > 0.01; moonIcon.rotation.y = t;
      // gravity arrows: earth big, moon 1/6
      const gk = smooth(range(t, 7.3, 7.8)) * (1 - smooth(range(t, 9.6, 10.0)));
      const g6 = smooth(range(t, 8.0, 8.8));
      arE.position.copy(th).add(V(0.33, 0.0, 0.1)); arE.scale.set(1, Math.max(0.001, gk * 1.2), 1); arE.visible = gk > 0.01;
      arM2.position.copy(hh).add(V(0.38, 0.0, 0)); arM2.scale.set(1, Math.max(0.001, gk * lerp(1.2, 0.2, g6)), 1); arM2.visible = gk > 0.01;
      six.position.copy(hh).add(V(0.62, -0.25, 0)); const sk = easeOut(range(t, 8.4, 8.7)) * (1 - smooth(range(t, 9.6, 10.0))); six.scale.set(0.8 * sk, 0.4 * sk, 1); six.visible = sk > 0.01;
      // marks pop when passed
      const yTop = hero.root.position.y;
      marks.forEach((m, i) => { const h = [0.5, 1, 2, 3][i]; const hit = yTop >= h - 0.02 && t > T0 && t < T1 ? 1 : 0; m.scale.set(0.8 * (1 + 0.4 * hit), 0.4 * (1 + 0.4 * hit), 1); });
      const twinHit = TJ.air && TJ.y > 0.45 ? 1 : 0; if (t < 10) marks[0].scale.set(0.8 * (1 + 0.4 * twinHit), 0.4 * (1 + 0.4 * twinHit), 1);
      rim.material.emissive = rim.material.emissive || new THREE.Color(); rim.material.emissive.setRGB(yTop > 3.0 ? 1 : 0, yTop > 3.0 ? 0.5 : 0, 0);
      [T1, ...HOPS.map(h => h[1])].forEach((tt, i) => { dustFx[i].position.set(hero.root.position.x, 0.05, hero.root.position.z); dustFx[i].update(t - tt); });
      const hw = Math.max(...HOPS.map(([a]) => Math.max(0, 1 - Math.abs(t - a - 0.3) * 2.5)));
      hopWord.position.copy(hh).add(V(0.5, 0.05, 0)); hopWord.scale.set(0.9 * hw, 0.45 * hw, 1); hopWord.visible = hw > 0.02;
      flag.rotation.y = Math.sin(t * 0.7) * 0.05;
      // ---------- camera ----------
      const KEYS = [[0, [0.4, 1.4, 6.0], [0.0, 1.2, 0]], [2.2, [0.1, 1.35, 4.6], [-0.15, 1.05, 0]], [6.6, [0.2, 1.35, 4.6], [-0.05, 1.05, 0]], [10.4, [0.3, 1.6, 5.2], [0.0, 1.3, 0]],
        [12.6, [0.4, 2.6, 9.2], [0.0, 2.6, -0.2]], [16.8, [0.4, 2.6, 9.2], [0.0, 2.6, -0.2]], [18.8, [0.4, 1.5, 5.6], [0.0, 1.1, 0]], [23.6, [0.6, 1.5, 5.8], [-0.4, 1.1, 0.3]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.4 + (Math.abs(t - T1) < 0.3 ? 2 : 0), 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const wk = easeOut(range(t, 16.4, 16.8)) * (1 - smooth(range(t, 19.2, 19.6)));
      drawW(t < T0 ? 0 : Math.min(3.9, (Math.min(t, T1) - T0) / (T1 - T0) * 3.9));
      watch.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.08).addScaledVector(rt, -0.17); watch.scale.setScalar(0.2 * wk); watch.visible = wk > 0.01;
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.4, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
