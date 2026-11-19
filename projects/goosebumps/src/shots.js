import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { burst } from './rare.js';
import { stamp, world, tree } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 26.4;
export const CAPTIONS = [
  [0.0, 'Why do we get goosebumps?'],
  [2.02, 'When you get cold'], [3.3, 'tiny muscles'], [4.23, 'at the bottom of every hair'], [5.77, 'on your skin'], [6.55, 'pull tight'],
  [7.83, 'The hairs stand straight up'], [9.75, 'and the skin around them'], [10.75, 'pops up into little bumps'],
  [12.87, 'For our furry ancestors'], [14.68, 'this puffed up their fur'], [15.97, 'to trap warm air'],
  [17.7, 'Animals still do it'], [18.81, 'to look bigger'], [19.51, "when they're scared"],
  [20.87, "That's why a scary movie"], [22.48, 'or your favorite song'], [23.84, 'can give you goosebumps too!', 26.2],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const UPY = new THREE.Vector3(0, 1, 0);

// fur strands on a set of joints; puff(k) lifts them from lying-down to standing out
function furCoat(parent, specs, col, n, seed, len = 0.07, rad = 0.012) {
  const r = rng(seed), list = [];
  const geo = new THREE.ConeGeometry(rad, 1, 4); geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 1 });
  for (let i = 0; i < n; i++) {
    const s = specs[Math.floor(r() * specs.length)];
    const a = r() * Math.PI * 2, y = lerp(s.y0, s.y1, r());
    const nrm = V(Math.cos(a), 0, Math.sin(a));
    const m = new THREE.Mesh(geo, mat); m.position.set(nrm.x * s.rx, y, nrm.z * s.rz).add(V(...(s.off || [0, 0, 0])));
    m.userData = { rest: nrm.clone().multiplyScalar(0.35).add(V(0, s.down ?? -1, 0)).normalize(), up: nrm.clone().add(V(0, 0.15, 0)).normalize(), len: len * (0.7 + r() * 0.6) };
    parent(s.j).add(m); list.push(m);
  }
  const q = new THREE.Quaternion(), d = V();
  return { list, puff(k) { list.forEach(m => { d.copy(m.userData.rest).lerp(m.userData.up, k).normalize(); q.setFromUnitVectors(UPY, d); m.quaternion.copy(q); m.scale.set(1 + k * 0.4, m.userData.len * (1 + k * 0.7), 1 + k * 0.4); }); } };
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 8, sunDir: [-3, 5, 4], sun: 1.5 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x3b4f78); u.mid.value.set(0x8a9cc0); u.horizon.value.set(0xf0c9a0); u.floorC.value.set(0x9a8a5a);
  scene.fog = new THREE.Fog(0xc9c2bd, 18, 80);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xdfe6ff); hemi.intensity = 0.95;
  scene.add(world([]));
  // autumn park: bare-ish orange trees, bench, lamp post, fallen leaves
  [[-4.5, -5, 0xd9822b], [3.8, -6, 0xc8551f], [-1.2, -8.5, 0xe0a030], [6.5, -3.5, 0xb84a1a], [-7, -2.5, 0xd06a20]].forEach(([x, z, col], i) => { const tr = tree({ h: 3.8, seed: i + 70, col }); tr.position.set(x, 0, z); scene.add(tr); });
  const bench = new THREE.Group(); const wood = new THREE.MeshStandardMaterial({ color: 0x7a4a26, roughness: 0.8 }), iron = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.6, roughness: 0.4 });
  for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.12), wood); p.position.set(0, 0.45, i * 0.14 - 0.14); bench.add(p); }
  for (let i = 0; i < 2; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.04), wood); p.position.set(0, 0.62 + i * 0.16, -0.24); bench.add(p); }
  for (const x of [-0.65, 0.65]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.4), iron); l.position.set(x, 0.225, -0.05); bench.add(l); }
  bench.position.set(-0.6, 0, -2.6); scene.add(bench);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 3.2, 10), iron); lamp.position.set(2.6, 1.6, -2.2); scene.add(lamp);
  const bulb = glowSprite(0xffd8a0, 0.6); bulb.position.set(2.6, 3.25, -2.2); scene.add(bulb);
  const lr = rng(9), leafCols = [0xd9822b, 0xc8551f, 0xe0a030, 0x9a3a12];
  const leafGeo = new THREE.PlaneGeometry(0.09, 0.06);
  for (let i = 0; i < 160; i++) { const l = new THREE.Mesh(leafGeo, new THREE.MeshStandardMaterial({ color: leafCols[i % 4], side: THREE.DoubleSide, roughness: 0.9 })); l.rotation.set(-Math.PI / 2, 0, lr() * 6); l.position.set((lr() - 0.5) * 12, 0.005, (lr() - 0.6) * 9); scene.add(l); }
  const blow = []; for (let i = 0; i < 40; i++) { const l = new THREE.Mesh(leafGeo, new THREE.MeshStandardMaterial({ color: leafCols[i % 4], side: THREE.DoubleSide })); l.userData = { y: 0.3 + lr() * 2.2, z: -1.5 + lr() * 3.5, ph: lr(), sp: 0.7 + lr() * 0.6 }; scene.add(l); blow.push(l); }

  // hero (cold, short sleeves)
  const hero = makeHuman('casual', { shirt: 0x4a90d9, jeans: 0x2f3e5a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf0c4a0, roughness: 0.7 });
  const bumps = []; const br = rng(4);
  for (const k of ['lEl', 'rEl', 'lSh', 'rSh']) for (let i = 0; i < (k.endsWith('El') ? 46 : 18); i++) { const a = br() * Math.PI * 2, y = k.endsWith('El') ? -0.03 - br() * 0.2 : -0.16 - br() * 0.1; const b = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 6, 4), skinMat); b.position.set(Math.cos(a) * 0.043, y, Math.sin(a) * 0.043); b.scale.setScalar(0.001); hero.j[k].add(b); bumps.push(b); }
  const heroFur = furCoat(k => hero.j[k], [{ j: 'lEl', y0: -0.03, y1: -0.22, rx: 0.044, rz: 0.044 }, { j: 'rEl', y0: -0.03, y1: -0.22, rx: 0.044, rz: 0.044 }], 0x3a2a1a, 60, 3, 0.02, 0.0035);

  // furry ancestor
  const anc = makeHuman('hide', { long: true, beard: true, hair: 0x3a2716, skin: 0xb98a62 }); scene.add(anc.root);
  const ancFur = furCoat(k => anc.j[k], [
    { j: 'lSh', y0: -0.02, y1: -0.26, rx: 0.075, rz: 0.075 }, { j: 'rSh', y0: -0.02, y1: -0.26, rx: 0.075, rz: 0.075 },
    { j: 'lEl', y0: -0.02, y1: -0.22, rx: 0.06, rz: 0.06 }, { j: 'rEl', y0: -0.02, y1: -0.22, rx: 0.06, rz: 0.06 },
    { j: 'lHip', y0: -0.05, y1: -0.4, rx: 0.09, rz: 0.09 }, { j: 'rHip', y0: -0.05, y1: -0.4, rx: 0.09, rz: 0.09 },
    { j: 'chest', y0: -0.05, y1: 0.32, rx: 0.19, rz: 0.13, down: -0.6 }, { j: 'spine', y0: -0.05, y1: 0.15, rx: 0.17, rz: 0.12, down: -0.6 }], 0x5a3a1e, 520, 7, 0.09);
  const warm = []; for (let i = 0; i < 14; i++) { const s = glowSprite(0xff9a3c, 0.35); s.userData.ph = i / 14; scene.add(s); warm.push(s); }

  // black cat
  const cat = new THREE.Group(), catBody = new THREE.Group(); cat.add(catBody); scene.add(cat);
  const blk = new THREE.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.9 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.3, 6, 14), blk); torso.rotation.z = Math.PI / 2; torso.position.y = 0.27; catBody.add(torso);
  const legs = []; for (const [x, z] of [[0.15, 0.06], [0.15, -0.06], [-0.15, 0.06], [-0.15, -0.06]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.022, 0.24, 8), blk); l.position.set(x, 0.12, z); catBody.add(l); legs.push(l); }
  const chead = new THREE.Group(); chead.position.set(0.27, 0.38, 0); catBody.add(chead);
  chead.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), blk));
  for (const z of [0.055, -0.055]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 8), blk); e.position.set(-0.01, 0.09, z); e.rotation.x = z > 0 ? 0.3 : -0.3; chead.add(e); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd23f })); eye.position.set(0.085, 0.02, z * 0.8); chead.add(eye); const pu = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), new THREE.MeshBasicMaterial({ color: 0x000000 })); pu.position.set(0.102, 0.02, z * 0.8); pu.scale.set(0.6, 1.4, 1); chead.add(pu); }
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), new THREE.MeshBasicMaterial({ color: 0xc23a4a })); mouth.position.set(0.09, -0.04, 0); mouth.scale.set(0.5, 0.01, 1); chead.add(mouth);
  const tail = new THREE.Group(); tail.position.set(-0.24, 0.3, 0); catBody.add(tail);
  const tailM = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.36, 8), blk); tailM.position.y = 0.18; tail.add(tailM);
  const catFurSpecs = []; for (let i = 0; i < 1; i++) catFurSpecs.push({ j: 'b', y0: -0.2, y1: 0.2, rx: 0.1, rz: 0.1 });
  const torsoFur = new THREE.Group(); torsoFur.position.y = 0.27; torsoFur.rotation.z = Math.PI / 2; catBody.add(torsoFur);
  const catFur = furCoat(k => k === 'b' ? torsoFur : tail, [{ j: 'b', y0: -0.2, y1: 0.2, rx: 0.1, rz: 0.1, down: -0.25 }, { j: 'b', y0: -0.2, y1: 0.2, rx: 0.1, rz: 0.1, down: -0.25 }, { j: 't', y0: 0.02, y1: 0.36, rx: 0.022, rz: 0.022, down: 0.6 }], 0x1c1c22, 300, 11, 0.032, 0.008);
  const bang = textSprite('!', '#ff3b3b', "400 160px Brand, sans-serif"); scene.add(bang);

  // floating movie screen (ghost) + music notes
  const scrT = canvasTex(512, 320, (g) => { g.fillStyle = '#0a0a14'; g.fillRect(0, 0, 512, 320); const gr = g.createRadialGradient(256, 170, 10, 256, 170, 200); gr.addColorStop(0, 'rgba(90,110,160,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 320);
    g.fillStyle = '#eef2ff'; g.beginPath(); g.arc(256, 140, 70, Math.PI, 0); g.lineTo(326, 260); for (let i = 0; i < 5; i++) g.lineTo(326 - (i + 0.5) * 28, i % 2 ? 260 : 236); g.lineTo(186, 260); g.closePath(); g.fill();
    g.fillStyle = '#0a0a14'; g.beginPath(); g.ellipse(230, 140, 13, 20, 0, 0, 7); g.ellipse(282, 140, 13, 20, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(256, 190, 16, 24, 0, 0, 7); g.fill();
    g.strokeStyle = '#2a2a3a'; g.lineWidth = 16; g.strokeRect(0, 0, 512, 320); });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.56), new THREE.MeshBasicMaterial({ map: scrT, transparent: true, toneMapped: false })); scene.add(screen);
  const noteT = canvasTex(128, 128, (g) => { g.fillStyle = '#ffd23f'; g.strokeStyle = '#ffd23f'; g.lineWidth = 10; g.beginPath(); g.ellipse(44, 96, 22, 16, -0.4, 0, 7); g.fill(); g.beginPath(); g.moveTo(64, 92); g.lineTo(64, 18); g.lineTo(104, 34); g.stroke(); });
  const notes = []; for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteT, transparent: true, depthWrite: false, toneMapped: false })); s.userData.ph = i / 6; scene.add(s); notes.push(s); }

  // skin cross-section zoom bubble (camera-pinned, beside the arm)
  const zc = document.createElement('canvas'); zc.width = zc.height = 512; const zg = zc.getContext('2d'); const zt = new THREE.CanvasTexture(zc); zt.colorSpace = THREE.SRGBColorSpace;
  const zoom = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); zoom.renderOrder = 30; scene.add(zoom);
  const drawZ = (pull, stand, bump, glow) => { zg.clearRect(0, 0, 512, 512); zg.save(); zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.clip();
    zg.fillStyle = '#bfe3ff'; zg.fillRect(0, 0, 512, 512);
    const sy = 250; // skin surface
    zg.fillStyle = '#f2b49a'; zg.beginPath(); zg.moveTo(0, sy); for (let x = 0; x <= 512; x += 8) { const b = Math.exp(-((x - 256) ** 2) / 3000) * 40 * bump + Math.exp(-((x - 80) ** 2) / 1500) * 20 * bump + Math.exp(-((x - 432) ** 2) / 1500) * 20 * bump; zg.lineTo(x, sy - b); } zg.lineTo(512, 512); zg.lineTo(0, 512); zg.fill();
    zg.fillStyle = '#e8957a'; zg.fillRect(0, sy + 60, 512, 260);
    // follicle
    zg.fillStyle = '#c8705a'; zg.save(); zg.translate(256, sy - 40 * bump); zg.rotate(lerp(0.75, 0.05, stand)); zg.beginPath(); zg.ellipse(0, 120, 26, 70, 0, 0, 7); zg.fill();
    zg.strokeStyle = '#3a2516'; zg.lineWidth = 10; zg.lineCap = 'round'; zg.beginPath(); zg.moveTo(0, 170); zg.lineTo(0, -200); zg.stroke(); zg.restore();
    // arrector pili muscle: from follicle base to under the skin on the right
    const fx = 256 + Math.sin(lerp(0.75, 0.05, stand)) * -120, fy = sy - 40 * bump + 120;
    const mx = lerp(390, 350, pull), my = sy + 40;
    zg.strokeStyle = glow > 0.01 ? `rgb(255,${Math.round(80 + 80 * glow)},${Math.round(80 * (1 - glow))})` : '#d63a4a'; zg.lineWidth = lerp(16, 26, pull); zg.beginPath(); zg.moveTo(fx + 10, fy); zg.quadraticCurveTo((fx + mx) / 2, (fy + my) / 2 + 30 * (1 - pull), mx, my); zg.stroke();
    zg.restore(); zg.strokeStyle = 'rgba(255,255,255,0.95)'; zg.lineWidth = 12; zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.stroke(); zt.needsUpdate = true; };
  const fx = { pop: burst(0xffffff, 40, 1), cat: burst(0xff3b3b, 50, 2), scare: burst(0x9fb4ff, 40, 3), end: burst(0xffd23f, 70, 4) };
  Object.values(fx).forEach(f => scene.add(f));
  const end = stamp('GOOSEBUMPS!', '#ffd23f', 0.7); scene.add(end);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // ---------- hero ----------
      hero.root.position.set(0, 0, 0); hero.root.rotation.y = 0.15;
      const shiver = (t < 12.5 ? 1 : 0.3) * Math.sin(t * 38) * 0.03;
      const hug = 1 - smooth(range(t, 20.4, 21.0));
      let pose = over(STAND(t), { lSh: [-0.4, 0, -0.3], lEl: [-1.55, 0, 0], rSh: [-0.4, 0, 0.3], rEl: [-1.55, 0, 0], spine: [0.08, 0, shiver], neck: [0.12, shiver * 2, 0] });
      if (hug < 1) pose = over(pose, { lSh: [lerp(0.05, -0.4, hug), 0, lerp(0.2, -0.3, hug)], lEl: [lerp(-0.4, -1.55, hug), 0, 0], rSh: [lerp(0.05, -0.4, hug), 0, lerp(-0.2, 0.3, hug)], rEl: [lerp(-0.4, -1.55, hug), 0, 0] });
      // rubbing arms while cold
      if (t < 12.5) { const rb = Math.sin(t * 9) * 0.12; pose.lSh = [pose.lSh[0] + rb, 0, pose.lSh[2]]; pose.rSh = [pose.rSh[0] - rb, 0, pose.rSh[2]]; }
      const scared = smooth(range(t, 21.3, 21.7)) * (1 - smooth(range(t, 22.4, 22.8)));
      const groove = smooth(range(t, 22.6, 23.0));
      if (scared > 0.01) pose = over(pose, { spine: [-0.12 * scared, 0, 0], neck: [-0.2 * scared, 0, 0], lSh: [lerp(pose.lSh[0], -1.4, scared), 0, lerp(pose.lSh[2], 0.5, scared)], rSh: [lerp(pose.rSh[0], -1.4, scared), 0, lerp(pose.rSh[2], -0.5, scared)], lEl: [lerp(pose.lEl[0], -1.6, scared), 0, 0], rEl: [lerp(pose.rEl[0], -1.6, scared), 0, 0] });
      if (groove > 0.01) pose = over(pose, { neck: [0.05, Math.sin(t * 8) * 0.25 * groove, Math.sin(t * 8) * 0.1 * groove], spine: [0, 0, Math.sin(t * 8 + 1) * 0.06 * groove] });
      hero.setPose(pose); hero.setMouth(scared > 0.3 ? 0.7 : 0.1);
      // goosebumps on the real arm
      const bk = Math.max(easeOut(range(t, 10.8, 11.6)) * (1 - smooth(range(t, 12.6, 13.4))), easeOut(range(t, 21.5, 21.9)) * 0.9 + 0.1 * Math.sin(t * 6) * smooth(range(t, 21.5, 22)), easeOut(range(t, 23.8, 24.3)));
      bumps.forEach(b => b.scale.setScalar(Math.max(0.001, bk)));
      heroFur.puff(Math.max(smooth(range(t, 8.0, 9.2)) * (1 - smooth(range(t, 12.6, 13.4))), bk));
      // ---------- ancestor ----------
      anc.root.position.set(-1.45, 0, -0.7); anc.root.rotation.y = 0.5;
      const pf = smooth(range(t, 14.7, 15.8));
      anc.setPose(over(STAND(t, 1.3), { lSh: [-0.6, 0, -0.3], lEl: [-1.5, 0, 0], rSh: [-0.6, 0, 0.3], rEl: [-1.5, 0, 0], neck: [0.05, 0.25, 0], spine: [0.05, 0, Math.sin(t * 30) * 0.02 * (1 - pf)] }));
      anc.setMouth(0.05);
      ancFur.puff(pf);
      const wk = smooth(range(t, 15.9, 16.6)) * (1 - smooth(range(t, 17.6, 18.1)));
      scene.updateMatrixWorld(true);
      const ac = anc.j.chest.localToWorld(V(0, 0.05, 0));
      warm.forEach((s, i) => { const a = i / warm.length * Math.PI * 2 + t * 0.6; const yy = (i % 5) * 0.28 - 0.75; s.position.copy(ac).add(V(Math.cos(a) * 0.3, yy, Math.sin(a) * 0.25)); s.material.opacity = 0.55 * wk; s.visible = wk > 0.01; });
      // ---------- cat ----------
      cat.position.set(1.15, 0, -0.1); cat.rotation.y = -0.9;
      const ck = easeOut(range(t, 18.85, 19.25));
      cat.scale.setScalar(lerp(1, 1.35, ck));
      torso.position.y = 0.27 + 0.06 * ck; torsoFur.position.y = torso.position.y; torso.rotation.y = 0; torsoFur.rotation.x = 0;
      torso.scale.set(1, 1, 1); legs.forEach(l => { l.scale.y = 1 + 0.4 * ck; l.position.y = 0.12 * (1 + 0.4 * ck); });
      tail.rotation.z = lerp(0.9, 0.1, ck) + Math.sin(t * 2) * 0.1 * (1 - ck); tail.scale.set(1 + 1.6 * ck, 1, 1 + 1.6 * ck);
      chead.position.y = 0.38 + 0.05 * ck; mouth.scale.set(0.5, 0.01 + 0.9 * ck, 1);
      catFur.puff(ck);
      const ch = chead.localToWorld(V(0, 0.15, 0));
      bang.position.copy(ch).add(V(0, 0.18, 0)); const bkk = easeOut(range(t, 18.9, 19.1)) * (1 - smooth(range(t, 20.6, 20.9))); bang.scale.set(0.5 * bkk, 0.25 * bkk, 1); bang.visible = bkk > 0.01;
      fx.cat.position.copy(ch); fx.cat.update(t - 18.9);
      // ---------- screen + notes ----------
      const head = hero.j.head.localToWorld(V(0, 0.1, 0));
      const sk = easeOut(range(t, 20.9, 21.3)) * (1 - smooth(range(t, 22.3, 22.6)));
      screen.position.set(0.75, 1.95, 0.35); screen.rotation.y = -0.2; screen.scale.setScalar(Math.max(0.001, sk)); screen.visible = sk > 0.01;
      fx.scare.position.copy(head); fx.scare.update(t - 21.5);
      const nk = smooth(range(t, 22.5, 22.9)) * (1 - smooth(range(t, 25.6, 26.2)));
      notes.forEach((s, i) => { const u2 = (t * 0.45 + s.userData.ph) % 1; s.position.copy(head).add(V(Math.sin(i * 2.3 + t) * 0.35, -0.1 + u2 * 0.7, 0.15)); s.scale.setScalar(0.14); s.material.opacity = nk * Math.sin(u2 * Math.PI); s.visible = nk > 0.01; });
      fx.end.position.copy(head).add(V(0, -0.3, 0.1)); fx.end.update(t - 24.0);
      fx.pop.position.copy(hero.j.lEl.localToWorld(V(0, -0.1, 0))); fx.pop.update(t - 10.8);
      // blowing leaves
      blow.forEach((l, i) => { const u2 = (t * 0.18 * l.userData.sp + l.userData.ph) % 1; l.position.set(-6 + u2 * 12, l.userData.y + Math.sin(t * 2 + i) * 0.2, l.userData.z); l.rotation.set(t * 3 + i, t * 2 + i, i); });
      // ---------- camera ----------
      const KEYS = [[0, [0.5, 1.5, 5.4], [0.0, 1.0, 0]], [2.0, [0.3, 1.45, 3.9], [0.0, 1.0, 0]], [7.8, [0.3, 1.4, 3.6], [0.0, 0.95, 0]], [12.6, [0.3, 1.4, 3.7], [-0.1, 0.95, 0]],
        [13.5, [-0.9, 1.4, 4.4], [-1.45, 0.9, -0.6]], [17.4, [-1.0, 1.4, 4.2], [-1.5, 0.9, -0.6]], [18.4, [1.4, 1.1, 3.1], [1.15, 0.5, -0.1]], [20.4, [1.35, 1.1, 3.0], [1.15, 0.5, -0.1]],
        [21.2, [0.5, 1.55, 4.2], [0.25, 1.15, 0]], [26.4, [0.4, 1.5, 4.0], [0.2, 1.1, 0]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const sh = shake(t, 0.5 + (t > 21.4 && t < 21.9 ? 2 : 0), 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const zk = easeOut(range(t, 2.4, 2.8)) * (1 - smooth(range(t, 12.4, 12.8)));
      if (zk > 0.01) drawZ(smooth(range(t, 6.4, 7.0)), smooth(range(t, 8.0, 9.2)), easeOut(range(t, 10.8, 11.5)), t > 6.4 && t < 7.6 ? 0.5 + 0.5 * Math.sin(t * 20) : 0);
      zoom.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.02).addScaledVector(rt, 0.2); zoom.scale.setScalar(0.3 * zk); zoom.material.opacity = zk; zoom.visible = zk > 0.01;
      end.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.28); end.set(t > 24.1 ? easeOut(range(t, 24.1, 24.3)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.35, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
