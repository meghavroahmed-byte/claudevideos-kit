import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, creature, person, keyCam, canvasTex, V } from './real.js';
import { dress } from './dress.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

// "Why can't we remember anything from when we were two?" — realistic people, real props, dive into a toddler's head
export const DURATION = 25.6;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, {
  models: ['Sofa_01', 'modern_coffee_table_01', 'potted_plant_01', 'metal_office_desk', 'industrial_microscope', 'chemistry_set', 'clipboard', 'desk_lamp_arm_01',
    'sf/human_brain', 'sf/neuron', 'sf/golden_retriever', 'sf/teddy_bear', 'sf/toy_blocks', 'rubber_duck_toy', 'wicker_basket_01'],
  hdris: ['lythwood_room', 'hospital_room', 'suburban_garden'], people: ['manuel', 'claudia', 'eric', 'sophia', 'baby2'],
});
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);

function babyFace(g, cx, cy, r, shirt = '#f4c542') {
  g.fillStyle = shirt; g.beginPath(); g.ellipse(cx, cy + r * 1.55, r * 1.1, r * 0.7, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#f2c79b'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
  g.fillStyle = '#5a3a22'; g.beginPath(); g.ellipse(cx, cy - r * 0.8, r * 0.7, r * 0.32, 0, 0, 7); g.fill();
  g.fillStyle = '#2b2018'; g.beginPath(); g.arc(cx - r * 0.35, cy - r * 0.05, r * 0.12, 0, 7); g.arc(cx + r * 0.35, cy - r * 0.05, r * 0.12, 0, 7); g.fill();
  g.fillStyle = 'rgba(240,120,120,0.45)'; g.beginPath(); g.arc(cx - r * 0.55, cy + r * 0.3, r * 0.15, 0, 7); g.arc(cx + r * 0.55, cy + r * 0.3, r * 0.15, 0, 7); g.fill();
  g.strokeStyle = '#8a3a2a'; g.lineWidth = r * 0.07; g.lineCap = 'round'; g.beginPath(); g.arc(cx, cy + r * 0.28, r * 0.25, 0.2, Math.PI - 0.2); g.stroke();
}
function photoFrame(w = 0.24, h = 0.19) {
  const g = new THREE.Group();
  const fr = new THREE.Mesh(new THREE.BoxGeometry(w + 0.03, h + 0.03, 0.015), new THREE.MeshStandardMaterial({ color: 0x8a5a2e, roughness: 0.45 })); fr.castShadow = true; g.add(fr);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: canvasTex(320, 254, (c) => { const gr = c.createLinearGradient(0, 0, 0, 254); gr.addColorStop(0, '#a9d8f5'); gr.addColorStop(1, '#bfe3a8'); c.fillStyle = gr; c.fillRect(0, 0, 320, 254); babyFace(c, 160, 115, 58); }), roughness: 0.35 }));
  p.position.z = 0.0085; g.add(p); return g;
}
function memoryCard(kind) {
  const t = canvasTex(256, 300, (g) => {
    g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, 256, 300); g.save(); g.beginPath(); g.rect(16, 16, 224, 210); g.clip();
    if (kind === 'beach') { g.fillStyle = '#7cc8f2'; g.fillRect(16, 16, 224, 210); g.fillStyle = '#2f8fd0'; g.fillRect(16, 130, 224, 40); g.fillStyle = '#f2d48a'; g.fillRect(16, 165, 224, 70); g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(196, 60, 26, 0, 7); g.fill(); g.fillStyle = '#e8452c'; g.beginPath(); g.moveTo(70, 175); g.lineTo(70, 95); g.lineTo(125, 175); g.fill(); }
    if (kind === 'puppy') { g.fillStyle = '#bde59b'; g.fillRect(16, 16, 224, 210); g.fillStyle = '#b07a46'; g.beginPath(); g.ellipse(128, 160, 70, 45, 0, 0, 7); g.fill(); g.beginPath(); g.arc(128, 100, 42, 0, 7); g.fill(); g.fillStyle = '#7a5030'; g.beginPath(); g.ellipse(92, 92, 14, 30, 0.3, 0, 7); g.ellipse(164, 92, 14, 30, -0.3, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(114, 96, 6, 0, 7); g.arc(142, 96, 6, 0, 7); g.arc(128, 114, 8, 0, 7); g.fill(); }
    if (kind === 'bath') { g.fillStyle = '#d8eef8'; g.fillRect(16, 16, 224, 210); g.fillStyle = '#ffffff'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(40 + i * 24, 150 + (i % 2) * 10, 20, 0, 7); g.fill(); } babyFace(g, 128, 110, 40); g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(190, 150, 22, 16, 0, 0, 7); g.fill(); }
    if (kind === 'swing') { g.fillStyle = '#a8dcf6'; g.fillRect(16, 16, 224, 210); g.fillStyle = '#7fbf5a'; g.fillRect(16, 180, 224, 50); g.strokeStyle = '#6b4a2a'; g.lineWidth = 6; g.beginPath(); g.moveTo(100, 16); g.lineTo(115, 140); g.moveTo(170, 16); g.lineTo(155, 140); g.stroke(); babyFace(g, 135, 120, 32, '#e8452c'); }
    if (kind === 'mom') { g.fillStyle = '#f6e2c8'; g.fillRect(16, 16, 224, 210); g.fillStyle = '#3a2418'; g.beginPath(); g.ellipse(128, 105, 62, 70, 0, 0, 7); g.fill(); g.fillStyle = '#e8b48a'; g.beginPath(); g.arc(128, 110, 44, 0, 7); g.fill(); g.fillStyle = '#d0507a'; g.beginPath(); g.ellipse(128, 215, 80, 50, 0, Math.PI, 0); g.fill(); g.fillStyle = '#2b2018'; g.beginPath(); g.arc(112, 105, 5, 0, 7); g.arc(144, 105, 5, 0, 7); g.fill(); g.strokeStyle = '#8a3a2a'; g.lineWidth = 4; g.beginPath(); g.arc(128, 122, 14, 0.2, Math.PI - 0.2); g.stroke(); }
    g.restore();
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.35), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false }));
  m.renderOrder = 30; return m;
}
function glow(color, size) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  s.scale.setScalar(size); return s;
}
function bubble(draw, tail = true) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(512, 512, (g) => {
    g.fillStyle = 'rgba(255,255,255,0.96)'; g.strokeStyle = 'rgba(40,40,40,0.25)'; g.lineWidth = 8;
    g.beginPath(); g.ellipse(256, 230, 220, 190, 0, 0, 7); g.fill(); g.stroke();
    if (tail) { g.beginPath(); g.arc(150, 450, 26, 0, 7); g.fill(); g.beginPath(); g.arc(110, 495, 14, 0, 7); g.fill(); }
    draw(g);
  }), transparent: true, depthWrite: false, toneMapped: false }));
  s.renderOrder = 35; s.set = (k) => { s.visible = k > 0.01; s.scale.setScalar(Math.max(0.001, k)); s.material.opacity = Math.min(1, k * 3); }; s.set(0);
  return s;
}
function noSlash() {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(512, 512, (g) => { g.strokeStyle = '#ff2a2a'; g.lineWidth = 40; g.lineCap = 'round'; g.beginPath(); g.arc(256, 230, 170, 0, 7); g.stroke(); g.beginPath(); g.moveTo(136, 110); g.lineTo(376, 350); g.stroke(); }), transparent: true, depthWrite: false, toneMapped: false }));
  s.renderOrder = 36; return s;
}
function hippocampus() {
  const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40, a = u * Math.PI * 1.6; pts.push(V(Math.cos(a) * (0.32 - 0.12 * u), Math.sin(a) * (0.22 - 0.08 * u) + u * 0.05, u * 0.12)); }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.06, 16, false), new THREE.MeshStandardMaterial({ color: 0xffc45a, emissive: 0xff9a2a, emissiveIntensity: 0.8, roughness: 0.35 }));
}

// ================= SHOT 1: living room (0 – 3.85) =================
function shotRoom({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 4, sunDir: [-2, 6, 3] }), 'lythwood_room', { height: 1.5, radius: 9, sun: 1.1, env: 1.0 });
  const sofa = fit(prop('Sofa_01'), 1.9, 'x'); sofa.position.set(0.1, 0, -1.25); scene.add(sofa);
  const table = fit(prop('modern_coffee_table_01'), 1.0, 'z'); table.rotation.y = Math.PI / 2; table.position.set(0.1, 0, -0.45); scene.add(table);
  const plant = fit(prop('potted_plant_01'), 1.1, 'y'); plant.position.set(-1.25, 0, -1.3); scene.add(plant);
  const man = person('manuel'); scene.add(man.root);
  const mom = person('claudia', { height: 1.64 }); scene.add(mom.root);
  const photo = photoFrame(); scene.add(photo);
  const think = bubble((g) => babyFace(g, 256, 215, 120)); scene.add(think);
  const slash = noSlash(); scene.add(slash);
  const cam = new THREE.PerspectiveCamera(38, 720 / 1280, 0.05, 200);
  const KEYS = [[0, [0.2, 1.45, 3.3], [0.05, 1.1, -0.2]], [3.85, [0.1, 1.5, 2.55], [0.05, 1.2, -0.2]]];
  return { scene, camera: cam, update(t) {
    const doubt = sm(2.0, 2.4, t);
    man.update(t, { idle: 1 }, 1, { handsChest: 0.85 * (1 - doubt) + 0.3 * doubt, lookDown: 0.7 * (1 - doubt), headTilt: 0.5 * doubt, shrug: 0.9 * doubt }).plant();
    man.root.position.x = -0.25; man.root.position.z = 0.1; man.root.rotation.y = 0.25;
    mom.update(t, { idle: 1 }, 1, { point: 0.55 * sm(0.5, 0.9, t) * (1 - sm(2.6, 3.0, t)), lookDown: 0.4, headTilt: -0.2 }).plant();
    mom.root.position.x = 0.48; mom.root.position.z = -0.15; mom.root.rotation.y = -0.6;
    const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
    scene.updateMatrixWorld(true);
    const lh = man.world('LeftHand'), rh = man.world('RightHand'), head = man.headPos();
    photo.position.copy(lh).lerp(rh, 0.5).add(V(0, 0.1, 0.05)); photo.quaternion.copy(cam.quaternion); photo.rotateX(-0.25);
    think.position.copy(head).add(V(0.12, 0.33, 0.1)); think.set(0.3 * ease((t - 0.55) / 0.25) * (1 - sm(3.3, 3.6, t)));
    slash.position.copy(think.position).add(V(0, 0, 0.01)); slash.visible = t > 1.25 && think.visible; slash.scale.setScalar(think.scale.x * (1 + 0.4 * (1 - sm(1.25, 1.4, t)))); slash.material.opacity = sm(1.25, 1.4, t);
    return { bloom: 0.12, exposure: 1.05 };
  } };
}

// ================= SHOT 2: scientist's lab (3.85 – 6.55) =================
function shotLab({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 4, sunDir: [2, 6, 3] }), 'hospital_room', { height: 1.5, radius: 9, sun: 1.0, env: 1.0 });
  const desk = fit(prop('metal_office_desk'), 1.6, 'x'); desk.position.set(0, 0, -0.55); scene.add(desk);
  desk.updateMatrixWorld(true); const top = new THREE.Box3().setFromObject(desk).max.y;
  const scope = fit(prop('industrial_microscope'), 0.42, 'y'); scope.position.set(-0.55, top, -0.6); scope.rotation.y = 0.6; scene.add(scope);
  const chem = fit(prop('chemistry_set'), 0.55, 'x'); chem.position.set(0.5, top, -0.75); scene.add(chem);
  const lamp = fit(prop('desk_lamp_arm_01'), 0.5, 'y'); lamp.position.set(0.72, top, -0.4); lamp.rotation.y = -2.2; scene.add(lamp);
  const clip = fit(prop('clipboard'), 0.3, 'max'); clip.position.set(0.3, top, -0.35); clip.rotation.y = 0.3; scene.add(clip);
  const brain = fit(prop('sf/human_brain'), 0.3, 'max'); brain.position.set(-0.05, top, -0.5); scene.add(brain);
  const sci = person('eric'); scene.add(sci.root);
  const cam = new THREE.PerspectiveCamera(38, 720 / 1280, 0.05, 200);
  const KEYS = [[0, [0.15, 1.45, 2.6], [-0.3, 1.05, -0.3]], [2.7, [0.05, 1.4, 2.1], [-0.3, 1.0, -0.3]]];
  return { scene, camera: cam, update(t) {
    brain.rotation.y = t * 0.6;
    sci.update(t, { idle: 1 }, 1, { point: 0.85 * sm(0.3, 0.7, t), lookDown: 0.25, lean: 0.15 }).plant();
    sci.root.position.x = -0.5; sci.root.position.z = 0.25; sci.root.rotation.y = 0.55;
    const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
    return { bloom: 0.1, exposure: 1.05 };
  } };
}

// ================= SHOT 3: backyard + inside the toddler's head (6.55 – end) =================
function shotYard({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-3, 7, 4] }), 'suburban_garden', { height: 2, radius: 40, sun: 2.0, env: 1.0 });
  const blanket = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), new THREE.MeshStandardMaterial({ map: canvasTex(256, 200, (g) => { for (let y = 0; y < 200; y += 25) for (let x = 0; x < 256; x += 32) { g.fillStyle = ((x / 32 + y / 25) % 2) ? '#f6d6e6' : '#ffffff'; g.fillRect(x, y, 32, 25); } }), roughness: 0.95 }));
  blanket.rotation.x = -Math.PI / 2; blanket.position.set(-0.55, 0.004, -0.55); blanket.receiveShadow = true; scene.add(blanket);
  const blocks = fit(prop('sf/toy_blocks'), 0.32, 'max'); blocks.position.set(-0.85, 0.004, -0.35); scene.add(blocks);
  const teddy = fit(prop('sf/teddy_bear'), 0.3, 'max'); teddy.position.set(-0.3, 0.004, -0.95); teddy.rotation.y = 0.5; scene.add(teddy);
  const duck = fit(prop('rubber_duck_toy'), 0.12, 'max'); duck.position.set(-0.15, 0.004, -0.3); duck.rotation.y = 0.9; scene.add(duck);
  const basket = fit(prop('wicker_basket_01'), 0.4, 'x'); basket.position.set(-1.2, 0, -0.95); scene.add(basket);
  const dog = creature('sf/golden_retriever', 0.85, 'max'); dog.root.position.set(0.85, 0, -0.75); dog.root.rotation.y = -2.2; scene.add(dog.root);
  const T = person('baby2', { height: 0.86 }); dress(T.root, { top: 0xf4c542, bottom: 0x3d6fb6, hair: 0x4a2c18, flip: true }); scene.add(T.root);
  const T2 = person('baby2', { height: 0.82 }); dress(T2.root, { top: 0x6fb7e8, bottom: 0x2f3e55, trim: 0xffffff, hair: 0x1c120c, stripes: true, flip: true }); scene.add(T2.root);
  const mom = person('sophia', { height: 1.66 }); scene.add(mom.root);
  T.root.traverse(m => { if (m.isMesh && m.material && !m.geometry.attributes.rest) m.material = m.material.clone(); });
  const cards = ['puppy', 'beach', 'mom', 'bath', 'swing'].map(k => { const c = memoryCard(k); scene.add(c); return c; });
  const brain = fit(prop('sf/human_brain'), 0.15, 'max', { ground: false }); scene.add(brain);
  brain.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.transparent = true; m.material.depthWrite = false; m.renderOrder = 20; } });
  const hip = hippocampus(); scene.add(hip);
  const hipGlow = glow(0xffb040, 0.08); scene.add(hipGlow);
  const inLight = new THREE.PointLight(0xffd0a0, 0, 0.6, 1.5); scene.add(inLight);
  const neurons = Array.from({ length: 6 }, () => { const n = fit(prop('sf/neuron'), 0.06, 'max', { ground: false }); n.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.emissive = new THREE.Color(0x3aa8ff); m.material.emissiveIntensity = 0.7; } }); n.userData.s0 = n.scale.x; scene.add(n); return n; });
  const tiny = ['puppy', 'beach', 'mom', 'bath'].map(k => { const c = memoryCard(k); scene.add(c); return c; });
  const links = tiny.map(() => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 1, 6), new THREE.MeshBasicMaterial({ color: 0xbfeaff, transparent: true, toneMapped: false })); scene.add(l); return l; });
  const spark = Array.from({ length: 40 }, () => { const s = glow(0x9fdcff, 0.012); scene.add(s); return s; });
  const talk = bubble((g) => { g.strokeStyle = '#3a3a3a'; g.lineWidth = 18; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(110, 240); for (let i = 0; i < 26; i++) g.lineTo(110 + i * 11 + ((i * 37) % 9 - 4) * 3, 230 + Math.sin(i * 1.7) * 70); g.stroke(); g.fillStyle = '#e8452c'; g.beginPath(); g.arc(150, 140, 22, 0, 7); g.fill(); g.fillStyle = '#2a9df4'; g.beginPath(); g.arc(360, 330, 24, 0, 7); g.fill(); }); scene.add(talk);
  const cam = new THREE.PerspectiveCamera(38, 720 / 1280, 0.004, 200);
  let H0 = null;
  return { scene, camera: cam, update(lt, t) {
    const walk = t < 8.9;
    const point = sm(18.5, 18.9, t) * (1 - sm(21.3, 21.7, t));
    const reach = sm(23.3, 23.8, t);
    T.update(t, walk ? { walk: 1 } : { idle: 1 }, 0.9, { point: 0.9 * point, lookUp: 0.8 * sm(21.9, 22.4, t), armsUp: 0.55 * reach, headTilt: 0.25 * point }).plant();
    const wk = sm(6.55, 8.9, t);
    T.root.position.x = lerp(0.55, 0.05, wk); T.root.position.z = lerp(-1.1, 0.25, wk); T.root.rotation.y = lerp(lerp(-0.35, 0.1, wk), 1.75, point);
    T2.update(t, { idle: 1 }, 1, { lookDown: 0.6, handsBelly: 0.4 }).plant(); T2.root.position.x = -0.7; T2.root.position.z = -0.75; T2.root.rotation.y = 0.6;
    mom.update(t, { idle: 1 }, 1, { lookDown: 0.45, point: 0.4 * sm(19.4, 19.8, t) * (1 - sm(21.3, 21.6, t)) }).plant(); mom.root.position.x = -0.6; mom.root.position.z = -2.0; mom.root.rotation.y = 0.45;
    dog.play(t, 0, 1);
    scene.updateMatrixWorld(true);
    const head = T.headPos(); if (!H0 && t >= 9.2) H0 = head.clone();
    const HH = H0 || head, HC = HH.clone().add(V(0, 0.07, 0.01));
    // x-ray head while inside
    const xr = sm(9.7, 10.15, t) * (1 - sm(18.0, 18.4, t));
    T.root.traverse(m => { if (!m.isMesh) return; const M = m.material; if (M.userData.t0 === undefined) { M.userData.t0 = M.transparent; M.userData.o0 = M.opacity; M.userData.d0 = M.depthWrite; } const on = xr > 0.01; const tr = on || M.userData.t0; if (M.transparent !== tr) { M.transparent = tr; M.needsUpdate = true; } M.opacity = M.userData.o0 * (1 - 0.85 * xr); M.depthWrite = on ? false : M.userData.d0; });
    brain.visible = xr > 0.01; brain.position.copy(HC).add(V(0, -0.075, 0)); brain.rotation.set(0, T.root.rotation.y, 0);
    brain.traverse(m => { if (m.isMesh) m.material.opacity = 0.55 * xr; });
    hip.visible = xr > 0.01; hip.position.copy(HC).add(V(0, -0.01, 0)); hip.rotation.set(0.2, -0.4 + t * 0.05, 0); hip.scale.setScalar(0.035 * (0.75 + 0.25 * sm(12.6, 13.9, t)) * (1 + 0.04 * Math.sin(t * 6)));
    hip.material.emissiveIntensity = 0.5 + 0.6 * sm(10.4, 11.0, t) * (0.7 + 0.3 * Math.sin(t * 7));
    hipGlow.visible = hip.visible; hipGlow.position.copy(hip.position); hipGlow.material.opacity = 0.8 * xr * sm(10.4, 11.0, t);
    inLight.position.copy(HC).add(V(0, 0.04, 0.06)); inLight.intensity = 0.6 * xr;
    // ---- camera (needs HH) ----
    const KEYS = [
      [6.55, [0.55, 0.95, 2.9], [0.25, 0.55, -0.4]], [8.9, [0.25, 0.85, 2.0], [0.05, 0.6, 0.0]],
      [9.4, [HH.x + 0.05, HH.y + 0.05, HH.z + 0.75], [HH.x, HH.y + 0.03, HH.z]],
      [10.2, [HH.x + 0.02, HH.y + 0.07, HH.z + 0.2], [HC.x, HC.y, HC.z]],
      [13.9, [HH.x - 0.09, HH.y + 0.08, HH.z + 0.16], [HC.x, HC.y, HC.z]],
      [16.2, [HH.x + 0.12, HH.y + 0.1, HH.z + 0.12], [HC.x, HC.y, HC.z]],
      [17.9, [HH.x + 0.06, HH.y + 0.07, HH.z + 0.17], [HC.x, HC.y, HC.z]],
      [18.6, [0.55, 0.85, 2.15], [0.3, 0.5, -0.35]], [21.5, [0.45, 0.85, 1.95], [0.3, 0.5, -0.4]],
      [22.2, [0.2, 0.75, 1.7], [0.05, 1.0, 0.0]], [25.6, [0.25, 0.9, 2.3], [0.05, 2.0, -0.4]],
    ];
    const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
    // memories pop over the head (7.6 – 10.2) and fly in
    cards.forEach((c, i) => {
      if (t > 21.8) { const st = 21.9 + i * 0.3, kk = Math.min(1, Math.max(0, (t - st) / 3.0));
        c.visible = t > st && kk < 1; c.position.copy(head).add(V(Math.sin(i * 2.1 + kk * 3) * (0.25 + kk * 0.5), 0.35 + kk * 2.4, -0.1 - kk * 0.6));
        c.scale.setScalar(Math.max(0.001, ease((t - st) / 0.3) * (1 - 0.5 * kk))); c.lookAt(cam.position); c.rotateZ(Math.sin(t + i) * 0.3); c.material.opacity = 1 - sm(0.45, 1.0, kk); return; }
      const st = 7.6 + i * 0.35, kk = ease((t - st) / 0.3), into = sm(9.4, 10.2, t);
      c.visible = t > st && t < 10.25;
      const a = (i - 2) * 0.5; const over = head.clone().add(V(Math.sin(a) * 0.32, 0.24 + Math.cos(a) * 0.08 + Math.sin(t * 2 + i) * 0.015, 0.08));
      c.position.copy(over).lerp(head, into); c.scale.setScalar(Math.max(0.001, 0.6 * kk * (1 - 0.85 * into))); c.lookAt(cam.position); c.material.opacity = 1;
    });
    // stored memories linked to the hippocampus; links snap when the new cells sprout
    const brk = sm(16.4, 17.3, t);
    tiny.forEach((c, i) => {
      const st = 10.9 + i * 0.55, arr = ease((t - st) / 0.6);
      const ang = i * 1.57 + 0.4; const slot = HC.clone().add(V(Math.cos(ang) * 0.05, -0.004 + (i % 2) * 0.02, Math.sin(ang) * 0.05));
      const from = HC.clone().add(V(Math.cos(ang) * 0.4, 0.15, Math.sin(ang) * 0.4 + 0.2));
      c.visible = xr > 0.02 && t > st && brk < 0.98; c.position.copy(from).lerp(slot, arr);
      if (brk > 0) c.position.add(V(Math.cos(ang) * 0.05 * brk, -0.03 * brk, Math.sin(ang) * 0.05 * brk));
      c.scale.setScalar(Math.max(0.001, 0.07 * Math.min(1, arr * 1.5) * (1 - 0.5 * brk))); c.lookAt(cam.position); c.rotateZ(brk * (i % 2 ? 1 : -1) * 1.2); c.material.opacity = 1 - brk;
      const l = links[i]; l.visible = c.visible && arr > 0.95 && brk < 0.6; const d = c.position.clone().sub(hip.position); l.position.copy(hip.position).addScaledVector(d, 0.5); l.scale.set(1, Math.max(0.001, d.length() * (1 - brk * 1.5)), 1); l.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); l.material.opacity = 0.9 * (1 - brk * 1.6);
    });
    neurons.forEach((n, i) => {
      const kk = ease((t - (14.4 + i * 0.32)) / 0.45); n.visible = xr > 0.02 && kk > 0.01;
      const ang = i * 1.05 + 0.3; n.position.copy(HC).add(V(Math.cos(ang) * 0.045, 0.01 + Math.sin(i * 2.3) * 0.02, Math.sin(ang) * 0.045)); n.rotation.set(i, t * 0.3 + i, 0); n.scale.setScalar(n.userData.s0 * Math.max(0.01, kk));
      n.traverse(m => { if (m.isMesh) m.material.emissiveIntensity = 0.5 + 0.6 * Math.max(0, Math.sin(t * 8 + i)); });
    });
    spark.forEach((s, i) => { const born = 16.4 + (i % 10) * 0.08, age = t - born; s.visible = xr > 0.02 && age > 0 && age < 0.9; const dir = V(Math.sin(i * 7.1), Math.cos(i * 3.3) * 0.6, Math.cos(i * 5.7)).normalize(); s.position.copy(HC).addScaledVector(dir, 0.01 + age * 0.08); s.material.opacity = 1 - age / 0.9; });
    talk.position.copy(head).add(V(0.16, 0.2, 0.06)); talk.set(0.2 * ease((t - 18.9) / 0.25) * (1 - sm(21.2, 21.5, t)));
    return { bloom: 0.18 + 0.25 * xr, exposure: 1.0 };
  } };
}
export const SHOTS = [
  { start: 0, end: 3.85, build: shotRoom },
  { start: 3.85, end: 6.55, build: shotLab },
  { start: 6.55, end: 99, build: shotYard },
];
