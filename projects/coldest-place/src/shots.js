import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { stamp, iconBubble } from './ancient.js';
import { lungsTex } from './space.js';

export const DURATION = 30.6;
export const CAPTIONS = [
  [0.0, 'What would happen'], [0.96, 'if you stood outside'], [2.2, 'in Antarctica'], [3.13, 'at minus 90 degrees?'],
  [5.47, 'Your breath would freeze'], [6.78, 'into tiny ice crystals'], [8.45, 'the moment it left your mouth'],
  [10.47, 'Within a minute'], [11.52, 'any bare skin'], [12.48, 'would start to get frostbite'],
  [14.42, 'Your body would shiver hard'], [16.05, 'to make heat'], [17.02, 'and your blood vessels'], [18.07, 'would squeeze'], [18.89, 'to keep your organs warm'],
  [20.69, 'Breathing that air'], [21.55, 'could even damage your lungs'],
  [23.57, "That's why scientists there"], [24.88, 'wear thick layers'], [26.16, 'goggles and face masks'], [27.91, 'and never stay outside for long!', 30.4],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const WALK = (p, a = 1) => { const s = Math.sin(p); return { lHip: [-0.4 * s * a, 0, 0.05], rHip: [0.4 * s * a, 0, -0.05], lKn: [(0.15 + 0.5 * Math.max(0, Math.sin(p + 1.3))) * a, 0, 0], rKn: [(0.15 + 0.5 * Math.max(0, Math.sin(p + 1.3 + Math.PI))) * a, 0, 0], lSh: [0.35 * s * a, 0, 0.15], rSh: [-0.35 * s * a, 0, -0.15], lEl: [-0.4, 0, 0], rEl: [-0.4, 0, 0], drop: -0.02 + Math.abs(Math.cos(p)) * 0.02 }; };
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const STATION = V(3.6, 0, -4.5), DOOR = V(2.4, 0, -2.9);

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 7, sunDir: [-6, 4, 3], sun: 2.6 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x1f5fb8); u.mid.value.set(0x6aa8e0); u.horizon.value.set(0xe8f2fa); u.floorC.value.set(0xeef4fa);
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  scene.fog = new THREE.Fog(0xe2eef8, 30, 140);
  const key = scene.userData.key; key.color.set(0xfff4e6);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xe8f4ff); hemi.groundColor.set(0xbfd4e8); hemi.intensity = 1.0;
  const snowT = canvasTex(512, 512, (g) => { g.fillStyle = '#f2f6fa'; g.fillRect(0, 0, 512, 512); const r = rng(2); for (let i = 0; i < 900; i++) { const x = r() * 512, y = r() * 512, s = 6 + r() * 40; const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(200,215,235,0.4)'); gr.addColorStop(1, 'rgba(200,215,235,0)'); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2); } });
  snowT.wrapS = snowT.wrapT = THREE.RepeatWrapping; snowT.repeat.set(30, 30);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ map: snowT, roughness: 0.9 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const iceM = new THREE.MeshStandardMaterial({ color: 0xdfeefa, roughness: 0.6, flatShading: true });
  const r = rng(9); for (let i = 0; i < 16; i++) { const s = 4 + r() * 12; const m = new THREE.Mesh(new THREE.ConeGeometry(s, s * (0.4 + r() * 0.5), 6), iceM); m.position.set(-60 + i * 9 + (r() - 0.5) * 6, s * 0.18, -50 - r() * 30); scene.add(m); }
  for (let i = 0; i < 10; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(1 + r() * 2, 16, 8), new THREE.MeshStandardMaterial({ color: 0xf6f9fc, roughness: 0.95 })); d.scale.y = 0.3; d.position.set(-14 + r() * 28, -0.2, -6 - r() * 14); scene.add(d); }
  // research station
  const st = new THREE.Group(); st.position.copy(STATION); scene.add(st);
  const body = new THREE.Mesh(new THREE.BoxGeometry(5, 2.6, 3.2), new THREE.MeshStandardMaterial({ color: 0xe8642a, roughness: 0.6 })); body.position.y = 1.9; st.add(body);
  for (const x of [-2, 2]) for (const z of [-1.2, 1.2]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0x5a5e66 })); leg.position.set(x, 0.3, z); st.add(leg); }
  for (let i = 0; i < 3; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), new THREE.MeshBasicMaterial({ color: 0xffe0a0, toneMapped: false })); w.position.set(-1.6 + i * 1.3, 2.2, 1.61); st.add(w); }
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.6), new THREE.MeshStandardMaterial({ color: 0x3a3e46 })); door.position.set(-1.2, 1.4, 1.61); st.add(door);
  const steps = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.8), new THREE.MeshStandardMaterial({ color: 0x5a5e66 })); steps.position.set(-1.2, 0.3, 2.0); st.add(steps);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), new THREE.MeshStandardMaterial({ color: 0x2b6cff, side: THREE.DoubleSide })); flag.position.set(2.0, 4.2, 0); st.add(flag);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0xcccccc })); pole.position.set(1.65, 3.8, 0); st.add(pole);
  st.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  // hero in a t-shirt
  const hero = makeHuman('casual', { shirt: 0x2a9d8f, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const SKIN0 = hero.M.skin.color.clone();
  // scientist in a parka
  const sci = makeHuman('casual', { shirt: 0xd62828, jeans: 0x2b2b30, skin: 0xf1c27d, beard: false }); scene.add(sci.root);
  sci.root.traverse(o => { if (o.isMesh && o.material === sci.shirt) o.scale.multiplyScalar(1.0); });
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), new THREE.MeshStandardMaterial({ color: 0xd62828, roughness: 0.8 })); hood.scale.set(1.05, 1.15, 1.1); hood.position.set(0, 0.1, -0.02); sci.j.head.add(hood);
  const fur = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 8, 24), new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: 1 })); fur.position.set(0, 0.1, 0.13); sci.j.head.add(fur);
  const gog = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.04), new THREE.MeshStandardMaterial({ color: 0xffa020, metalness: 0.8, roughness: 0.1 })); gog.position.set(0, 0.13, 0.15); sci.j.head.add(gog);
  const mask = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.04), new THREE.MeshStandardMaterial({ color: 0x2b2b30 })); mask.position.set(0, 0.03, 0.15); sci.j.head.add(mask);
  const puff = new THREE.Mesh(torsoPuff(), new THREE.MeshStandardMaterial({ color: 0xd62828, roughness: 0.8 })); sci.j.chest.add(puff);
  // breath, ice crystals, frost
  const breath = []; for (let i = 0; i < 20; i++) { const s = glowSprite(0xffffff, 0.12); s.userData.ph = i / 20; scene.add(s); breath.push(s); }
  const crystals = []; for (let i = 0; i < 40; i++) { const s = glowSprite(0xbfe8ff, 0.04); s.userData.ph = i / 40; scene.add(s); crystals.push(s); }
  const frost = []; for (const [j, off] of [['head', V(0, 0.12, 0.13)], ['head', V(0.12, 0.12, 0.0)], ['head', V(-0.12, 0.12, 0.0)], ['lWr', V(0, -0.08, 0.03)], ['rWr', V(0, -0.08, 0.03)]]) { const s = glowSprite(0xe8f8ff, 0.12); s.userData = { j, off }; scene.add(s); frost.push(s); }
  const snowfall = []; for (let i = 0; i < 160; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.015, 4, 3), new THREE.MeshBasicMaterial({ color: 0xffffff })); s.userData = { x: (Math.random() - 0.5) * 12, z: (Math.random() - 0.5) * 10, ph: Math.random(), sp: 0.4 + Math.random() * 0.4 }; scene.add(s); snowfall.push(s); }
  const veins = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(256, 512, (g) => { g.strokeStyle = '#ff3b3b'; g.lineCap = 'round'; const br = (x, y, a, l, w, d) => { if (d > 5) return; const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke(); br(x2, y2, a - 0.4, l * 0.7, w * 0.7, d + 1); br(x2, y2, a + 0.4, l * 0.7, w * 0.7, d + 1); }; br(128, 160, Math.PI / 2, 90, 14, 0); br(128, 160, -Math.PI / 2 - 0.3, 60, 10, 2); g.fillStyle = '#ffb347'; g.beginPath(); g.arc(128, 170, 40, 0, 7); g.fill(); }), transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); veins.renderOrder = 25; scene.add(veins);
  const lungs = iconBubble(lungsTex('normal')); lungs.renderOrder = 30; scene.add(lungs);
  const frostLung = glowSprite(0xbfe8ff, 0.4); frostLung.renderOrder = 31; scene.add(frostLung);
  const therm = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(256, 512, (g) => { g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.roundRect(98, 40, 60, 340, 30); g.fill(); g.beginPath(); g.arc(128, 410, 60, 0, 7); g.fill(); g.fillStyle = '#2b6cff'; g.beginPath(); g.arc(128, 410, 46, 0, 7); g.fill(); g.fillRect(114, 330, 28, 80); g.font = "400 64px Brand, sans-serif"; g.fillStyle = '#2b6cff'; g.textAlign = 'center'; g.fillText('-90°', 128, 30 + 0); }), transparent: true, depthWrite: false, toneMapped: false })); scene.add(therm);
  const fx = { door: burst(0xffffff, 60, 1), sci: burst(0x5be37d, 80, 2) };
  Object.values(fx).forEach(f => scene.add(f));
  const inside = stamp('GET INSIDE!', '#2b6cff', 0.55); scene.add(inside);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      snowfall.forEach(s => { const u2 = (t * s.userData.sp * 0.25 + s.userData.ph) % 1; s.position.set(s.userData.x + Math.sin(t + s.userData.ph * 9) * 0.3 + t * 0.3, 4 - u2 * 4, s.userData.z); });
      // hero: arrives in a t-shirt, freezes, shivers, then runs inside
      const run = range(t, 27.9, 29.6);
      let hp = V(-0.3, 0, 0.6), rot = 0.2;
      const shiver = smooth(range(t, 14.3, 14.7)) * (1 - smooth(range(t, 27.8, 28.2)));
      const hug = smooth(range(t, 10.6, 11.2));
      let pose = over(STAND(t), { lSh: [-1.0 * hug, 0.5 * hug, 0.4 - 0.2 * hug], rSh: [-1.0 * hug, -0.5 * hug, -0.4 + 0.2 * hug], lEl: [-2.0 * hug, 0, 0], rEl: [-2.0 * hug, 0, 0], spine: [0.15 * hug + Math.sin(t * 45) * 0.03 * shiver, 0, Math.sin(t * 40) * 0.04 * shiver], neck: [0.1 * hug + Math.sin(t * 38) * 0.05 * shiver, 0, 0], drop: -0.05 * hug });
      if (run > 0) { hp = V(-0.3, 0, 0.6).lerp(DOOR.clone().add(V(0.1, 0, 0.7)), easeInOut(run)); rot = Math.atan2(DOOR.x + 0.1 + 0.3, DOOR.z + 0.7 - 0.6); pose = WALK(t * 9, 1.2); }
      hero.root.position.copy(hp); hero.root.rotation.y = rot; hero.root.visible = t < 29.9;
      hero.setPose(pose); hero.setMouth(t > 5.4 && t < 10.4 ? 0.3 + 0.15 * Math.sin(t * 3) : 0.1 + 0.2 * shiver * Math.abs(Math.sin(t * 30)));
      const cold = smooth(range(t, 2, 14));
      hero.M.skin.color.copy(SKIN0).lerp(new THREE.Color(0x9ab8d8), 0.5 * cold);
      scene.updateMatrixWorld(true);
      const mouth = hero.j.head.localToWorld(V(0, 0.02, 0.14));
      // breath puffs, then ice crystals that fall
      const bk = t > 0.5 && t < 27.8 ? 1 : 0, ice = smooth(range(t, 6.2, 6.8));
      breath.forEach((s, i) => { const u2 = (t * 0.7 + s.userData.ph) % 1; s.position.copy(mouth).add(V(Math.sin(i * 2) * 0.05 * u2, u2 * 0.1, 0.05 + u2 * 0.35)); s.material.opacity = bk * (1 - u2) * 0.6 * (1 - ice * 0.5); s.scale.setScalar(0.06 + u2 * 0.18); });
      crystals.forEach((s, i) => { const u2 = (t * 0.5 + s.userData.ph) % 1; s.position.copy(mouth).add(V(Math.sin(i * 3.1) * 0.15, 0.05 - u2 * 1.4, 0.2 + Math.cos(i * 1.7) * 0.15)); s.material.opacity = ice * bk * (0.5 + 0.5 * Math.sin(t * 20 + i)); s.scale.setScalar(0.035); });
      const fk = smooth(range(t, 12.4, 13.4));
      frost.forEach(s => { s.position.copy(hero.j[s.userData.j].localToWorld(s.userData.off.clone())); s.material.opacity = 0.85 * fk * (t < 29.5 ? 1 : 0); s.scale.setScalar(0.1 + 0.03 * Math.sin(t * 4)); });
      const vk = smooth(range(t, 16.9, 17.3)) * (1 - smooth(range(t, 20.3, 20.6)));
      const sq = smooth(range(t, 18.0, 19.0));
      veins.position.copy(hero.j.chest.localToWorld(V(0, 0.0, 0.25))); veins.scale.set(0.42 * vk * (1 - 0.35 * sq), 0.84 * vk * (1 - 0.35 * sq), 1); veins.material.opacity = vk; veins.visible = vk > 0.01;
      const lk2 = easeOut(range(t, 20.6, 20.9)) * (1 - smooth(range(t, 23.3, 23.6)));
      lungs.position.copy(hero.j.chest.localToWorld(V(0.55, 0.15, 0.1))); lungs.set(0.4 * lk2, smooth(range(t, 22.2, 22.4)));
      frostLung.position.copy(lungs.position); frostLung.material.opacity = 0.7 * lk2 * smooth(range(t, 21.7, 22.3)); frostLung.scale.setScalar(0.6);
      // scientist walks out of the station
      const sk = range(t, 23.5, 26.5);
      sci.root.visible = t > 23.3; sci.root.position.copy(DOOR.clone().add(V(0, 0, 0.8)).lerp(V(0.9, 0, 0.9), easeInOut(sk))); sci.root.rotation.y = sk < 1 ? Math.atan2(0.9 - DOOR.x, 0.9 - DOOR.z - 0.8) : -0.3;
      sci.setPose(sk > 0 && sk < 1 ? WALK(t * 7) : over(STAND(t, 2), { rSh: [-1.4 * smooth(range(t, 27.9, 28.3)), 0, -0.2], rEl: [-0.2, 0, 0] }));
      fx.door.position.copy(DOOR).add(V(0, 1.2, 0.6)); fx.door.update(t - 29.6);
      therm.position.copy(hero.root.position).add(V(-0.7, 2.0, 0)); const tk = easeOut(range(t, 3.2, 3.5)) * (1 - smooth(range(t, 5.2, 5.5))); therm.scale.set(0.35 * tk, 0.7 * tk, 1); therm.material.opacity = tk; therm.visible = tk > 0.01;
      // ---------- camera ----------
      const KEYS = [[0, [1.4, 2.2, 6.8], [0.3, 1.3, -1.0]], [3.0, [1.6, 1.9, 5.6], [-0.2, 1.3, 0.4]], [5.4, [0.9, 1.7, 4.4], [-0.25, 1.4, 0.5]], [10.4, [0.9, 1.65, 4.2], [-0.25, 1.3, 0.5]], [14.3, [1.2, 1.7, 4.6], [-0.2, 1.2, 0.5]], [20.6, [1.0, 1.7, 4.4], [0, 1.3, 0.5]], [22.9, [1.0, 1.7, 4.4], [0, 1.3, 0.5]], [24.2, [1.8, 2.0, 6.4], [1.0, 1.1, -0.8]], [30.6, [1.6, 2.0, 6.2], [1.2, 1.1, -1.0]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const sh = shake(t, 0.6 + 1.2 * shiver, 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-6, 4, 3));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion);
      inside.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.25); inside.set(t > 28.4 ? easeOut(range(t, 28.4, 28.56)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.45, exposure: 1.0 };
    },
  };
}
function torsoPuff() { const g = new THREE.SphereGeometry(0.3, 20, 14); g.scale(1.0, 0.9, 0.75); g.translate(0, 0.08, 0); return g; }
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
