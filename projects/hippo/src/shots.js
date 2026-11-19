import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { infoCard, burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { world, grass, tree, rock, river, stamp, iconBubble } from './ancient.js';

export const DURATION = 28.6;
export const CAPTIONS = [
  [0.0, 'Why should you never'], [1.09, 'try to pet a hippo?'],
  [2.71, 'They look slow and chubby'], [4.5, 'but hippos are one of'], [5.59, 'the most dangerous animals'], [7.15, 'in Africa'],
  [8.17, 'A hippo can run up to'], [9.29, '30 km per hour'], [10.95, 'on land'], [11.73, 'faster than most people'],
  [13.5, 'Its jaws open'], [14.44, 'nearly 180 degrees'], [16.66, 'and its bite is strong enough'], [18.24, 'to snap a small boat in half'],
  [20.56, "And they're very territorial"], [22.41, 'If you get too close'], [23.57, 'to their water'], [24.23, 'they will charge'],
  [25.65, 'So admire them'], [26.76, 'from far away!', 28.4],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
function RUN(p, a = 1, lean = 0.22) { const s = Math.sin(p); return { lHip: [-0.85 * s * a, 0, 0.05], rHip: [0.85 * s * a, 0, -0.05], lKn: [(0.25 + 1.0 * Math.max(0, Math.sin(p + 1.3))) * a, 0, 0], rKn: [(0.25 + 1.0 * Math.max(0, Math.sin(p + 1.3 + Math.PI))) * a, 0, 0], lAn: [0.2 * a, 0, 0], rAn: [0.2 * a, 0, 0], lSh: [0.85 * s * a, 0, 0.2], rSh: [-0.85 * s * a, 0, -0.2], lEl: [-1.3 * a - 0.2, 0, 0], rEl: [-1.3 * a - 0.2, 0, 0], spine: [lean * a, 0, 0], chest: [0.05 * a, Math.sin(p) * 0.12 * a, 0], neck: [-lean * 0.7 * a, 0, 0], drop: -0.06 * a + Math.abs(Math.cos(p)) * 0.05 * a }; }
const WALK = (p, a = 1) => RUN(p, a * 0.45, 0.05);
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function makeHippo() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const skin = new THREE.MeshStandardMaterial({ color: 0x7d6b75, roughness: 0.55 }), pink = new THREE.MeshStandardMaterial({ color: 0xd99a9a, roughness: 0.6 });
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.9, 32, 20), skin); torso.scale.set(1.0, 0.8, 1.55); torso.position.y = 1.0; body.add(torso);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 14), pink); belly.scale.set(0.9, 0.6, 1.4); belly.position.y = 0.88; body.add(belly);
  const head = new THREE.Group(); head.position.set(0, 1.15, 1.25); body.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), skin); skull.scale.set(1.0, 0.85, 1.0); head.add(skull);
  const upper = new THREE.Group(); upper.position.set(0, 0.0, 0.25); head.add(upper);
  const um = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), skin); um.scale.set(1.15, 0.6, 1.25); um.position.set(0, 0.05, 0.4); upper.add(um);
  const jaw = new THREE.Group(); jaw.position.set(0, -0.12, 0.2); head.add(jaw);
  const jm = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 16), skin); jm.scale.set(1.1, 0.45, 1.25); jm.position.set(0, -0.08, 0.4); jaw.add(jm);
  const mouthIn = new THREE.Mesh(new THREE.CircleGeometry(0.38, 24), new THREE.MeshStandardMaterial({ color: 0xc8506a, side: THREE.DoubleSide })); mouthIn.rotation.x = -Math.PI / 2; mouthIn.position.set(0, -0.0, 0.42); mouthIn.scale.set(1.1, 1.3, 1); jaw.add(mouthIn);
  const tm = new THREE.MeshStandardMaterial({ color: 0xfff6e0, roughness: 0.3 });
  for (const x of [-0.3, 0.3]) { const tk = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 10), tm); tk.position.set(x, 0.12, 0.62); jaw.add(tk); const tu = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.16, 8), tm); tu.position.set(x * 0.8, -0.1, 0.68); tu.rotation.x = Math.PI; upper.add(tu); }
  for (const x of [-0.12, 0.12]) { const n = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshStandardMaterial({ color: 0x3a2a30 })); n.position.set(x, 0.3, 0.82); upper.add(n); }
  for (const x of [-0.25, 0.25]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), skin); e.position.set(x, 0.33, 0.05); head.add(e); const ey = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 })); ey.position.set(x, 0.36, 0.11); head.add(ey); const ear = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), skin); ear.scale.set(0.7, 1.2, 0.5); ear.position.set(x * 1.3, 0.42, -0.15); head.add(ear); }
  const legs = []; for (const [x, z] of [[0.55, 0.8], [-0.55, 0.8], [0.55, -0.8], [-0.55, -0.8]]) { const L = new THREE.Group(); L.position.set(x, 0.7, z); g.add(L); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.7, 14), skin); m.position.y = -0.35; L.add(m); legs.push(L); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.pose = (t, { run = 0, mouth = 0, freq = 10 } = {}) => { legs.forEach((L, i) => L.rotation.x = Math.sin(t * freq + [0, 3.1, 1.6, 4.7][i]) * 0.6 * run); body.position.y = Math.abs(Math.sin(t * freq)) * 0.1 * run; body.rotation.x = Math.sin(t * freq) * 0.05 * run; head.rotation.x = -mouth * 0.5; jaw.rotation.x = mouth * 1.6; upper.rotation.x = -mouth * 0.7; };
  g.head = head; return g;
}
function canoe() {
  const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: 0xb5652e, roughness: 0.7, side: THREE.DoubleSide });
  const halves = [0, 1].map(i => { const h = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), m); h.scale.set(0.9, 0.6, 2.2); const grp = new THREE.Group(); grp.add(h); const clip = new THREE.Group(); g.add(grp); return grp; });
  halves[0].children[0].geometry = halves[0].children[0].geometry.clone();
  g.halves = halves; g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 8, sunDir: [-4, 9, 5], sun: 2.6 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x3a86d6); u.mid.value.set(0x86bce8); u.horizon.value.set(0xf0e2c0); u.floorC.value.set(0xc9b48a);
  scene.fog = new THREE.Fog(0xe8dcc0, 40, 160);
  const key = scene.userData.key;
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.85;
  scene.add(world(['#c8b878', ['186,170,110', '206,192,130', '170,156,100']]));
  scene.add(grass(2200, [-16, -14, 16, 12], [[-12, -9, 12, -2.6]]));
  // the river (runs along x, at z -6)
  const wt = canvasTex(256, 256, (g) => { g.fillStyle = '#4a7a7a'; g.fillRect(0, 0, 256, 256); const r = rng(5); for (let i = 0; i < 180; i++) { g.strokeStyle = `rgba(255,255,255,${0.08 + r() * 0.15})`; g.lineWidth = 1 + r() * 2; const x = r() * 256, y = r() * 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10 + r() * 20, y + (r() - 0.5) * 3); g.stroke(); } });
  wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(8, 2);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(60, 7), new THREE.MeshStandardMaterial({ map: wt, roughness: 0.12, transparent: true, opacity: 0.92 })); water.rotation.x = -Math.PI / 2; water.position.set(0, 0.05, -6); scene.add(water);
  const mudbank = new THREE.Mesh(new THREE.PlaneGeometry(60, 1.4), new THREE.MeshStandardMaterial({ color: 0x7a6040, roughness: 0.6 })); mudbank.rotation.x = -Math.PI / 2; mudbank.position.set(0, 0.03, -2.4); scene.add(mudbank);
  const terr = new THREE.Mesh(new THREE.RingGeometry(3.6, 3.8, 64), new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0, toneMapped: false, side: THREE.DoubleSide })); terr.rotation.x = -Math.PI / 2; terr.position.set(0, 0.08, -4.6); scene.add(terr);
  // acacia trees
  const acM = new THREE.MeshStandardMaterial({ color: 0x5c7a32, flatShading: true });
  [[-9, 4], [8, 6], [14, -12], [-15, -12], [3, 9], [-4, 11]].forEach(([x, z]) => { const g = new THREE.Group(); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 3, 8), new THREE.MeshStandardMaterial({ color: 0x6b4a2e })); tr.position.y = 1.5; g.add(tr); const cn = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 8), acM); cn.scale.set(1.4, 0.3, 1.2); cn.position.y = 3.2; g.add(cn); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.position.set(x, 0, z); scene.add(g); });
  // far hill for the ending
  const hill = new THREE.Mesh(new THREE.SphereGeometry(8, 32, 16), new THREE.MeshStandardMaterial({ color: 0xa8a060, roughness: 1 })); hill.scale.set(1.4, 0.3, 1); hill.position.set(-14, -0.4, 10); scene.add(hill);
  const hippo = makeHippo(); scene.add(hippo);
  const hero = makeHuman('casual', { shirt: 0xe9c46a, jeans: 0x6b5a3a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const binoc = new THREE.Group(); for (const x of [-0.04, 0.04]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0x222228 })); b.rotation.x = Math.PI / 2; b.position.x = x; binoc.add(b); } scene.add(binoc);
  const boat = new THREE.Group(); scene.add(boat);
  const bm = new THREE.MeshStandardMaterial({ color: 0xb5652e, roughness: 0.7, side: THREE.DoubleSide });
  const halves = [0, 1].map(i => { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 1.2, 16, 1, true, 0, Math.PI), bm); h.rotation.set(Math.PI / 2, 0, Math.PI / 2); const gg = new THREE.Group(); gg.add(h); h.position.z = i ? 0.62 : -0.62; boat.add(gg); return gg; });
  const ic = {
    africa: iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#c8843a'; g.beginPath(); [[200, 80], [330, 90], [400, 170], [430, 230], [360, 300], [330, 420], [260, 460], [230, 360], [170, 270], [110, 210], [130, 140]].forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.fill(); g.fillStyle = '#ff2a2a'; g.beginPath(); g.arc(280, 250, 34, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '900 50px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', 280, 254); })),
  };
  Object.values(ic).forEach(i => { i.renderOrder = 30; scene.add(i); });
  const speeds = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(768, 300, (g) => { g.fillStyle = 'rgba(30,20,10,0.72)'; g.beginPath(); g.roundRect(6, 6, 756, 288, 36); g.fill(); [['HIPPO', 30, '#ff6b5b'], ['YOU', 15, '#4ab8ff']].forEach(([n, v, col], i) => { const y = 90 + i * 110; g.font = "400 50px Brand, sans-serif"; g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(n, 36, y); g.fillStyle = col; g.beginPath(); g.roundRect(230, y - 28, v * 14, 56, 22); g.fill(); g.fillStyle = '#fff'; g.fillText(`${v} km/h`, 240 + v * 14, y); }); }), transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); speeds.renderOrder = 31; scene.add(speeds);
  const angle = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(512, 512, (g) => { g.strokeStyle = '#ffd23f'; g.lineWidth = 14; g.beginPath(); g.arc(256, 300, 170, Math.PI, 0); g.stroke(); g.font = "400 110px Brand, sans-serif"; g.fillStyle = '#ffd23f'; g.textAlign = 'center'; g.fillText('180°', 256, 270); }), transparent: true, depthWrite: false, toneMapped: false })); scene.add(angle);
  const fx = { splash: burst(0xdff2ff, 80, 1), snap: burst(0xb5652e, 60, 2), dust: burst(0xc8b878, 60, 3) };
  Object.values(fx).forEach(f => scene.add(f));
  const danger = stamp('DANGER!', '#ff2a2a', 0.5); scene.add(danger);
  const far = stamp('FROM FAR AWAY', '#5be37d', 0.62); scene.add(far);
  const card = infoCard(); scene.add(card);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      wt.offset.x = t * 0.02;
      // ---------- hippo ----------
      let hpos = V(0, -0.35, -3.9), hrot = 0, run = 0, mouth = 0;
      if (t > 2.7 && t < 4.3) mouth = 0.35 * Math.sin(range(t, 2.9, 4.2) * Math.PI);   // cute yawn
      if (t >= 8.1 && t < 13.3) { const k = range(t, 8.3, 12.6); hpos = V(0, -0.35, -3.9).lerp(V(0, 0, 4.5), easeInOut(k)); hpos.y = lerp(-0.35, 0, smooth(range(t, 8.3, 9.0))); run = smooth(range(t, 8.3, 8.8)) * (1 - smooth(range(t, 12.4, 12.8))); }
      if (t >= 13.3 && t < 20.4) { hpos = V(3.2, -0.35, -5.6); hrot = -0.5; mouth = smooth(range(t, 13.7, 14.4)) * (1 - smooth(range(t, 18.1, 18.3))) + smooth(range(t, 18.6, 18.8)) * 0 ; if (t > 18.15 && t < 18.3) mouth = 0.1; if (t > 18.3) mouth = 0.3 * (1 - smooth(range(t, 18.5, 19.2))); }
      if (t >= 20.4) { const ch = smooth(range(t, 24.2, 24.6)) * (1 - smooth(range(t, 25.3, 26.0))); hpos = V(0, lerp(-0.35, 0, ch), lerp(-4.6, -2.2, ch)); run = ch; mouth = 0.5 * ch; }
      hippo.position.copy(hpos); hippo.rotation.y = hrot; hippo.pose(t, { run, mouth });
      fx.splash.position.set(0, 0.2, -3.0); fx.splash.update(t - 8.4);
      // canoe snapped in half at 18.24
      boat.position.set(3.2 + Math.sin(-0.5) * 1.6 * 0 + 0.0, 0.12, -5.6 + 1.9); boat.rotation.y = Math.PI / 2;
      const sn = smooth(range(t, 18.2, 18.7));
      halves.forEach((h, i) => { h.rotation.x = (i ? 1 : -1) * 0.6 * sn; h.position.y = -0.2 * sn; h.position.z = (i ? 1 : -1) * 0.2 * sn; });
      boat.visible = t > 13.0 && t < 20.6;
      fx.snap.position.copy(boat.position).add(V(0, 0.3, 0)); fx.snap.update(t - 18.24);
      terr.material.opacity = smooth(range(t, 20.8, 21.3)) * (1 - smooth(range(t, 25.4, 25.8))) * (0.6 + 0.4 * Math.sin(t * 6));
      // ---------- hero ----------
      let hp, rot = Math.PI, pose;
      if (t < 8.2) { hp = V(0.3, 0, -1.3); const reach = smooth(range(t, 0.3, 1.0)) * (1 - smooth(range(t, 4.4, 4.8))); pose = over(STAND(t), { rSh: [-1.4 * reach, 0, -0.1], rEl: [-0.2, 0, 0], spine: [0.2 * reach, 0, 0], neck: [0.1, 0, 0] }); if (t > 4.6) pose = over(pose, { lSh: [-0.9, 0, 0.4], rSh: [-0.9, 0, -0.4], lEl: [-1.3, 0, 0], rEl: [-1.3, 0, 0], spine: [-0.15, 0, 0] }); hero.setMouth(t > 4.6 ? 0.45 : 0.1); }
      else if (t < 13.4) { const k = range(t, 8.4, 13.3); hp = V(0.3, 0, -1.3).lerp(V(0.6, 0, 9.0), k); rot = 0; pose = RUN(t * 9, 1); hero.setMouth(0.5); }
      else if (t < 20.5) { hp = V(-1.6, 0, -1.4); rot = Math.PI + 0.6; pose = over(STAND(t), { neck: [-0.05, 0, 0] }); hero.setMouth(t > 18.2 ? 0.45 : 0.1); }
      else if (t < 25.6) { const step = smooth(range(t, 22.4, 23.6)), back = smooth(range(t, 24.4, 25.2)); hp = V(0.4, 0, lerp(-0.2, -1.2, step) + 2.0 * back); rot = Math.PI; pose = back > 0.05 && back < 0.99 ? over(RUN(t * 9, 1), {}) : STAND(t); if (back > 0.05) rot = 0; hero.setMouth(0.5 * back); }
      else { hp = V(-13.2, 1.95, 9.4); rot = 2.36; pose = over(STAND(t), { lSh: [-1.6, 0.3, 0.2], rSh: [-1.6, -0.3, -0.2], lEl: [-1.7, 0, 0], rEl: [-1.7, 0, 0], neck: [-0.05, 0, 0] }); hero.setMouth(0.1); }
      hero.root.position.copy(hp); hero.root.rotation.y = rot; hero.setPose(pose);
      scene.updateMatrixWorld(true);
      binoc.visible = t > 25.6; binoc.position.copy(hero.j.head.localToWorld(V(0, 0.1, 0.17))); binoc.quaternion.copy(hero.j.head.getWorldQuaternion(new THREE.Quaternion()));
      fx.dust.position.copy(hpos).setY(0.2); fx.dust.update(t - 24.4);
      // ---------- camera ----------
      const KEYS = [[0, [3.6, 2.4, 4.6], [0.1, 0.9, -2.6]], [2.6, [2.8, 2.0, 3.6], [0.1, 0.9, -2.8]], [8.0, [2.6, 2.0, 3.2], [0.1, 0.8, -2.6]], [9.6, [3.6, 2.0, 7.0], [0.3, 1.0, 1.0]], [12.8, [3.4, 2.0, 11.0], [0.5, 1.0, 5.6]], [13.8, [-0.2, 2.4, 1.8], [2.8, 1.0, -4.4]], [20.2, [0.0, 2.3, 1.6], [2.6, 0.9, -4.0]], [21.0, [2.6, 2.6, 4.2], [0.2, 0.6, -2.6]], [25.2, [2.4, 2.4, 3.8], [0.2, 0.7, -2.0]], [26.4, [-15.4, 3.9, 13.2], [-9.5, 1.6, 2.5]], [28.6, [-15.6, 4.0, 13.6], [-8.5, 1.2, 0.5]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const sh = shake(t, 0.6 + (run > 0.5 ? 1.5 : 0), 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-4, 9, 5));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      ic.africa.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(rt, 0.2).addScaledVector(upv, 0.15); ic.africa.set(0.17 * easeOut(range(t, 6.6, 6.85)) * (1 - smooth(range(t, 7.9, 8.2))), 0);
      const sk = smooth(range(t, 9.2, 9.5)) * (1 - smooth(range(t, 13.0, 13.3)));
      speeds.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.2); speeds.scale.set(0.6 * sk, 0.234 * sk, 1); speeds.material.opacity = sk; speeds.visible = sk > 0.01;
      const ak = smooth(range(t, 14.4, 14.8)) * (1 - smooth(range(t, 16.6, 16.9)));
      angle.position.copy(hippo.head.localToWorld(V(0, 0.2, 0.6))); angle.scale.setScalar(1.6 * ak); angle.material.opacity = ak; angle.visible = ak > 0.01;
      danger.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.1); danger.set(t > 4.5 ? easeOut(range(t, 4.5, 4.66)) * (1 - smooth(range(t, 5.8, 6.1))) : 0);
      far.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.12); far.set(t > 26.8 ? easeOut(range(t, 26.8, 26.96)) : 0);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 2.6, 'NEVER', 'PET A HIPPO', '#ff6b5b', ''],
        [2.71, 4.5, 'THEY LOOK', 'CHUBBY + SLOW', '#d99a9a', ''], [4.5, 8.0, 'BUT', 'DEADLY', '#ff2a2a', 'one of Africa’s most dangerous'],
        [8.17, 13.3, 'ON LAND', '30 KM/H', '#ff6b5b', 'faster than most people'],
        [13.5, 16.66, 'JAWS', '180° OPEN', '#ffd23f', ''], [16.66, 20.4, 'JAWS', 'SNAPS A BOAT', '#ff6b5b', 'in half'],
        [20.56, 25.5, 'TERRITORIAL', "THEY'LL CHARGE", '#ff2a2a', 'too close to their water'],
      ];
      const cu = CARDS.find(([a2, b]) => t >= a2 && t < b); let ck = 0;
      if (cu) { card.set(cu[2], cu[3], cu[4], null, cu[5]); const grp = CARDS.filter(x => x[2] === cu[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk = 1 + 0.09 * Math.exp(-(t - cu[0]) * 9); card.scale.set(0.72 * pk, 0.281 * pk, 1); }
      card.material.opacity = ck; card.visible = ck > 0.01;
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.35, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
