import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { world, grass, tree, stamp, iconBubble } from './ancient.js';

export const DURATION = 30.0;
export const CAPTIONS = [
  [0.0, 'What actually happens'], [1.42, 'when a bee stings you?'],
  [2.98, "A honeybee's stinger"], [4.08, 'has tiny barbs'], [5.62, 'like a harpoon'], [7.01, 'Once it goes into your skin'], [8.81, 'it gets stuck'],
  [10.18, 'When the bee flies away'], [11.55, 'the stinger rips out of its body'], [13.86, 'along with a venom sac'], [15.16, 'that keeps pumping venom'], [16.53, 'for up to a minute'],
  [18.07, "That's why you should"], [18.89, 'scrape it out quickly'], [20.43, 'instead of squeezing it'],
  [22.04, 'Sadly'], [22.77, 'the honeybee dies after stinging'], [25.03, 'But wasps have smooth stingers'], [27.1, 'so they can sting'], [27.9, 'again and again!', 29.8],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
function RUN(p, a = 1, lean = 0.22) { const s = Math.sin(p); return { lHip: [-0.85 * s * a, 0, 0.05], rHip: [0.85 * s * a, 0, -0.05], lKn: [(0.25 + 1.0 * Math.max(0, Math.sin(p + 1.3))) * a, 0, 0], rKn: [(0.25 + 1.0 * Math.max(0, Math.sin(p + 1.3 + Math.PI))) * a, 0, 0], lAn: [0.2 * a, 0, 0], rAn: [0.2 * a, 0, 0], lSh: [0.85 * s * a, 0, 0.2], rSh: [-0.85 * s * a, 0, -0.2], lEl: [-1.3 * a - 0.2, 0, 0], rEl: [-1.3 * a - 0.2, 0, 0], spine: [lean * a, 0, 0], chest: [0.05 * a, Math.sin(p) * 0.12 * a, 0], neck: [-lean * 0.7 * a, 0, 0], drop: -0.06 * a + Math.abs(Math.cos(p)) * 0.05 * a }; }
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function insect(kind = 'bee') {
  const g = new THREE.Group(); const wasp = kind === 'wasp';
  const stripes = canvasTex(64, 256, (x) => { for (let i = 0; i < 6; i++) { x.fillStyle = i % 2 ? '#1a1a1a' : (wasp ? '#ffd400' : '#f2b01e'); x.fillRect(0, i * 43, 64, 43); } });
  const abd = new THREE.Mesh(new THREE.SphereGeometry(0.05, 18, 12), new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.6 })); abd.scale.set(wasp ? 0.75 : 1, wasp ? 0.75 : 1, wasp ? 1.9 : 1.4); abd.rotation.x = Math.PI / 2; abd.position.z = -0.07; g.add(abd);
  const thor = new THREE.Mesh(new THREE.SphereGeometry(0.035, 14, 10), new THREE.MeshStandardMaterial({ color: wasp ? 0x1a1a1a : 0x6a4a1a, roughness: 0.9 })); g.add(thor);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 10), new THREE.MeshStandardMaterial({ color: 0x1a1a1a })); head.position.z = 0.045; g.add(head);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.2 })); e.position.set(s * 0.018, 0.008, 0.06); g.add(e); }
  const sting = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.03, 6), new THREE.MeshStandardMaterial({ color: 0x2a2a2a })); sting.rotation.x = -Math.PI / 2; sting.position.z = wasp ? -0.17 : -0.15; g.add(sting);
  const wm = new THREE.MeshStandardMaterial({ color: 0xdfefff, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false });
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * 0.02, 0.03, 0); g.add(w); const m = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), wm); m.scale.set(1, 0.45, 1); m.position.set(s * 0.05, 0, -0.01); m.rotation.x = -Math.PI / 2; w.add(m); return w; });
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.flap = (t, k = 1) => wings.forEach((w, i) => w.rotation.z = (i ? -1 : 1) * Math.sin(t * 70) * 0.8 * k);
  g.sting = sting; g.abd = abd;
  return g;
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-4, 9, 5], sun: 2.6 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x2f7fd8); u.mid.value.set(0x6aaee8); u.horizon.value.set(0xe0f0f8); u.floorC.value.set(0x7fb24a);
  scene.fog = new THREE.Fog(0xd8ecf4, 30, 120);
  const key = scene.userData.key;
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.85;
  scene.add(world([]));
  // flower garden (no grass spikes)
  const r = rng(4), fcols = [0xff5fa2, 0xffd23f, 0xff8a3d, 0xc58aff, 0xffffff];
  for (let i = 0; i < 90; i++) { const x = (r() - 0.5) * 9, z = -1.5 - r() * 6; const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.45, 5), new THREE.MeshStandardMaterial({ color: 0x3f8a3a })); st.position.set(x, 0.22, z); scene.add(st); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 6), new THREE.MeshStandardMaterial({ color: fcols[i % 5], roughness: 0.6 })); fl.scale.y = 0.5; fl.position.set(x, 0.46, z); scene.add(fl); }
  [[-5, -8], [5, -9], [-8, -3], [8, -4]].forEach(([x, z], i) => { const tr = tree({ h: 3.4, seed: i + 30 }); tr.position.set(x, 0, z); scene.add(tr); });
  const hive = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 6), new THREE.MeshStandardMaterial({ color: 0xe8c86a, roughness: 0.8 })); hive.position.set(2.6, 0.45, -2.6); hive.castShadow = true; scene.add(hive);
  const hero = makeHuman('casual', { shirt: 0x457b9d, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const bee = insect('bee'); bee.scale.setScalar(1.6); scene.add(bee);
  const wasp = insect('wasp'); wasp.scale.setScalar(1.6); scene.add(wasp);
  const stinger = new THREE.Group(); scene.add(stinger);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.006, 0.05, 6), new THREE.MeshStandardMaterial({ color: 0x2a2a2a })); shaft.position.y = 0.025; stinger.add(shaft);
  const sac = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf2e6a0, roughness: 0.3, emissive: 0x302800 })); sac.position.y = 0.055; stinger.add(sac);
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.055, 0.004), new THREE.MeshStandardMaterial({ color: 0x2b6cff, roughness: 0.4 })); scene.add(card);
  const welt = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.5, transparent: true })); welt.scale.set(1, 0.4, 1); scene.add(welt);
  // magnifier (barbed stinger / venom sac)
  const mc = document.createElement('canvas'); mc.width = mc.height = 512; const mg = mc.getContext('2d'); const mtex = new THREE.CanvasTexture(mc); mtex.colorSpace = THREE.SRGBColorSpace;
  const mag = new THREE.Sprite(new THREE.SpriteMaterial({ map: mtex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); mag.renderOrder = 30; scene.add(mag);
  const drawMag = (mode, tt) => { mg.clearRect(0, 0, 512, 512); mg.save(); mg.beginPath(); mg.arc(256, 256, 240, 0, 7); mg.clip(); mg.fillStyle = '#f2c8a8'; mg.fillRect(0, 0, 512, 512); mg.fillStyle = '#e8b090'; mg.fillRect(0, 300, 512, 212);
    mg.fillStyle = '#2a2a2a'; mg.beginPath(); mg.moveTo(240, 80); mg.lineTo(272, 80); mg.lineTo(260, 400); mg.lineTo(252, 400); mg.closePath(); mg.fill();
    for (let i = 0; i < 9; i++) { const y = 140 + i * 28; for (const s of [-1, 1]) { mg.beginPath(); mg.moveTo(256 + s * (10 - i * 0.6), y); mg.lineTo(256 + s * (34 - i * 1.5), y - 22); mg.lineTo(256 + s * (8 - i * 0.6), y - 12); mg.fill(); } }
    if (mode >= 1) { const p = 1 + 0.15 * Math.sin(tt * 9); mg.fillStyle = '#f2e6a0'; mg.beginPath(); mg.ellipse(256, 70, 60 * p, 45 * p, 0, 0, 7); mg.fill(); mg.fillStyle = '#c8a020'; for (let i = 0; i < 5; i++) { const y = ((tt * 160 + i * 60) % 300) + 110; mg.beginPath(); mg.arc(256, y, 7, 0, 7); mg.fill(); } }
    mg.restore(); mg.strokeStyle = 'rgba(255,255,255,0.9)'; mg.lineWidth = 12; mg.beginPath(); mg.arc(256, 256, 240, 0, 7); mg.stroke(); mtex.needsUpdate = true; };
  const timer = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); timer.renderOrder = 31; scene.add(timer);
  const tc = document.createElement('canvas'); tc.width = tc.height = 256; const tg = tc.getContext('2d'); const ttex = new THREE.CanvasTexture(tc); ttex.colorSpace = THREE.SRGBColorSpace; timer.material.map = ttex;
  const drawT = (s) => { tg.clearRect(0, 0, 256, 256); tg.fillStyle = 'rgba(255,255,255,0.92)'; tg.beginPath(); tg.arc(128, 128, 110, 0, 7); tg.fill(); tg.fillStyle = 'rgba(255,90,60,0.4)'; tg.beginPath(); tg.moveTo(128, 128); tg.arc(128, 128, 100, -Math.PI / 2, -Math.PI / 2 + s / 60 * Math.PI * 2); tg.fill(); tg.font = "400 60px Brand, sans-serif"; tg.fillStyle = '#2a2a30'; tg.textAlign = 'center'; tg.textBaseline = 'middle'; tg.fillText(`${Math.round(s)}s`, 128, 132); ttex.needsUpdate = true; };
  const noSqueeze = iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#d99b7a'; g.beginPath(); g.ellipse(170, 256, 70, 110, 0.4, 0, 7); g.fill(); g.beginPath(); g.ellipse(342, 256, 70, 110, -0.4, 0, 7); g.fill(); g.fillStyle = '#2a2a2a'; g.fillRect(250, 200, 12, 90); })); noSqueeze.renderOrder = 30; scene.add(noSqueeze);
  const fx = { sting: burst(0xff6b6b, 40, 1), rip: burst(0xffd23f, 40, 2), scrape: burst(0x5be37d, 50, 3), wasp: [burst(0xff4a4a, 30, 4), burst(0xff4a4a, 30, 5), burst(0xff4a4a, 30, 6)] };
  for (const v of Object.values(fx)) (Array.isArray(v) ? v : [v]).forEach(f => scene.add(f));
  const ouch = stamp('OUCH!', '#ff2a2a', 0.4); scene.add(ouch);
  const scrape = stamp('SCRAPE IT!', '#5be37d', 0.55); scene.add(scrape);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // hero
      const run = range(t, 27.0, 30.0);
      const armOut = smooth(range(t, 1.6, 2.2)) * (1 - smooth(range(t, 21.8, 22.4)));
      let hp = V(-0.2, 0, 0.5), rot = 0.3;
      let pose = over(STAND(t), { lSh: [-1.15 * armOut, 0.35 * armOut, 0.2], lEl: [-0.15 * armOut, 0, 0], neck: [0.25 * armOut, 0.45 * armOut, 0] });
      if (t > 18.6 && t < 21.6) pose = over(pose, { rSh: [-1.3, 0.7, -0.1], rEl: [-1.0, 0, 0] });
      if (run > 0) { hp = V(-0.2, 0, 0.5).lerp(V(-4.5, 0, 2.2), run); rot = -1.2; pose = over(RUN(t * 10, 1), { lSh: [-2.6, 0, 0.6], rSh: [-2.6, 0, -0.6] }); }
      hero.root.position.copy(hp); hero.root.rotation.y = rot; hero.setPose(pose);
      hero.setMouth(t > 8.8 && t < 10 ? 0.6 : t > 25.6 ? 0.55 : 0.1);
      scene.updateMatrixWorld(true);
      const forearm = hero.j.lEl.localToWorld(V(0, -0.15, 0.045));
      const up = V(0, 0, 1).applyQuaternion(hero.j.lEl.getWorldQuaternion(new THREE.Quaternion()));
      // bee: flies in, lands, stings at 7.6, flies off at 10.6 tearing the stinger, falls at 22.8
      let bp;
      if (t < 4.8) { const k = easeInOut(range(t, 0.0, 4.6)); bp = V(2.4, 1.6, -2.4).lerp(forearm.clone().addScaledVector(up, 0.06), k); bp.y += Math.sin(t * 6) * 0.08 * (1 - k); }
      else if (t < 10.6) { bp = forearm.clone().addScaledVector(up, 0.06); }
      else if (t < 22.8) { const k = easeOut(range(t, 10.6, 12.0)); bp = forearm.clone().addScaledVector(up, 0.06).lerp(V(0.9, 1.6, -0.6), k); bp.y += Math.sin(t * 5) * 0.05; }
      else { const k = range(t, 22.8, 23.8); bp = V(0.9, 1.6 - 1.55 * k * k, -0.6); }
      bee.position.copy(bp); bee.lookAt(forearm.clone().add(V(0, -1, 0)).lerp(bp.clone().add(V(-1, 0, 0)), t < 10.6 ? 0.1 : 1)); bee.flap(t, t > 23.6 ? 0 : 1); bee.visible = t < 25.0;
      bee.rotation.z += t > 22.8 ? range(t, 22.8, 23.8) * 3 : 0;
      // stinger stays in the skin
      stinger.visible = t > 7.6 && t < 21.0; stinger.position.copy(forearm).addScaledVector(up, 0.01); stinger.quaternion.setFromUnitVectors(V(0, 1, 0), up);
      sac.visible = t > 10.6; sac.scale.setScalar(1 + 0.25 * Math.sin(t * 9) * (t < 18 ? 1 : 0));
      const sc = smooth(range(t, 19.4, 20.4)); stinger.position.addScaledVector(V(1, 0, 0), 0.08 * sc); stinger.rotation.z += 1.2 * sc;
      welt.visible = t > 7.8; welt.position.copy(forearm); welt.scale.set(0.6 + 0.6 * smooth(range(t, 8, 12)), 0.3, 0.6 + 0.6 * smooth(range(t, 8, 12))); welt.material.opacity = 0.8;
      card.visible = t > 18.8 && t < 21.4; card.position.copy(hero.j.rWr.localToWorld(V(0, -0.1, 0.03))); card.quaternion.copy(hero.j.rWr.getWorldQuaternion(new THREE.Quaternion()));
      fx.sting.position.copy(forearm); fx.sting.update(t - 7.65);
      fx.rip.position.copy(forearm).addScaledVector(up, 0.08); fx.rip.update(t - 10.6);
      fx.scrape.position.copy(forearm); fx.scrape.update(t - 20.2);
      // wasp: stings again and again
      const wk = t > 24.8 ? 1 : 0; wasp.visible = wk > 0;
      const tgt = hero.j.chest.localToWorld(V(0.1, 0.1, 0.2));
      const jab = Math.max(0, Math.sin((t - 25.0) * 6));
      wasp.position.copy(tgt.clone().add(V(0.35 - 0.3 * jab, 0.15, 0.25 - 0.2 * jab))); if (t < 25.4) wasp.position.lerp(V(3, 2, -2), 1 - range(t, 24.8, 25.4)); wasp.lookAt(tgt); wasp.flap(t);
      [26.0, 27.0, 28.1].forEach((b, i) => { fx.wasp[i].position.copy(tgt); fx.wasp[i].update(t - b); });
      // ---------- camera ----------
      const KEYS = [[0, [1.8, 1.9, 5.4], [0.2, 1.2, -0.4]], [3.0, [1.2, 1.7, 4.2], [-0.1, 1.25, 0.3]], [10.2, [1.1, 1.7, 4.0], [-0.1, 1.25, 0.3]], [11.6, [1.6, 1.8, 4.6], [0.2, 1.3, 0]], [18.0, [1.0, 1.7, 4.0], [-0.1, 1.25, 0.3]], [22.0, [2.0, 1.8, 4.8], [0.6, 1.0, -0.2]], [24.8, [1.4, 1.8, 4.6], [-0.2, 1.2, 0.4]], [30.0, [0.2, 1.9, 6.2], [-2.6, 1.0, 1.4]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const sh = shake(t, 0.5 + (t > 7.6 && t < 8.2 ? 3 : 0), 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-4, 9, 5));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const mk = easeOut(range(t, 3.6, 4.0)) * (1 - smooth(range(t, 17.7, 18.0)));
      if (mk > 0.01) drawMag(t > 13.8 ? 1 : 0, t);
      mag.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.2).addScaledVector(rt, 0.17); mag.scale.setScalar(0.3 * mk); mag.material.opacity = mk; mag.visible = mk > 0.01;
      const tk = smooth(range(t, 16.4, 16.7)) * (1 - smooth(range(t, 17.9, 18.2)));
      drawT(lerp(0, 60, smooth(range(t, 16.5, 17.8)))); timer.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.2).addScaledVector(rt, -0.18); timer.scale.setScalar(0.17 * tk); timer.material.opacity = tk; timer.visible = tk > 0.01;
      noSqueeze.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.2).addScaledVector(rt, 0.18); noSqueeze.set(0.17 * easeOut(range(t, 20.4, 20.65)) * (1 - smooth(range(t, 21.8, 22.1))), smooth(range(t, 20.8, 20.95)));
      ouch.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.25); ouch.set(t > 7.65 ? easeOut(range(t, 7.65, 7.8)) * (1 - smooth(range(t, 8.8, 9.1))) : 0);
      scrape.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.25); scrape.set(t > 18.9 ? easeOut(range(t, 18.9, 19.05)) * (1 - smooth(range(t, 20.2, 20.5))) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.4, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
