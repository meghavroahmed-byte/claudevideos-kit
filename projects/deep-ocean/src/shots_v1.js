import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { rng, glowTexture } from './textures.js';

export const DURATION = 28.4;
export const CAPTIONS = [
  [0.0, 'What if you dove to the bottom of the ocean?'],
  [2.75, 'At ten meters'], [3.82, 'the water already squeezes you'], [5.61, 'twice as hard as the air above'],
  [7.93, 'At two hundred meters'], [9.35, 'the sunlight is gone'], [10.91, "It's cold and pitch black"],
  [13.16, 'At one thousand meters'], [14.74, 'glowing creatures'], [15.74, 'light up the dark'],
  [17.07, 'At four thousand meters'], [18.6, 'the pressure is like'], [19.57, 'an elephant standing on your thumb'],
  [21.77, 'And at the very bottom'], [23.17, 'eleven kilometers down'], [25.0, 'it would crush you flat'], [26.37, 'in an instant', 28.2],
];
export const FADES = [];

const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const CRUSH = 25.25;
// depth (m) by time: piecewise, eased between stops
const STOPS = [[0, 0], [2.0, 0], [3.0, 10], [7.6, 30], [8.6, 200], [12.8, 400], [13.8, 1000], [16.8, 1500], [17.8, 4000], [21.6, 5000], [23.4, 11000], [28.4, 11000]];
const depthAt = (t) => { let i = 0; while (i < STOPS.length - 2 && STOPS[i + 1][0] < t) i++; const [t0, d0] = STOPS[i], [t1, d1] = STOPS[i + 1]; return lerp(d0, d1, easeInOut(range(t, t0, t1))); };
const WATER = [[0, 0x46c0e8], [3, 0x2a92c8], [8.6, 0x0b3a6a], [11, 0x05162e], [14, 0x030a18], [24, 0x010409]];
const waterAt = (t) => { let i = 0; while (i < WATER.length - 2 && WATER[i + 1][0] < t) i++; return new THREE.Color(WATER[i][1]).lerp(new THREE.Color(WATER[i + 1][1]), smooth(range(t, WATER[i][0], WATER[i + 1][0]))); };

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 4, sunDir: [-1, 8, 2], sun: 1.6 });
  scene.userData.sky.visible = false;
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  scene.background = new THREE.Color(0x46c0e8); scene.fog = new THREE.Fog(0x46c0e8, 3, 16);
  const hemi = scene.children.find(o => o.isHemisphereLight); const key = scene.userData.key;
  const rim = new THREE.PointLight(0x6ab8ff, 0, 6, 1.2); rim.position.set(-1.2, 1.6, -1.2); scene.add(rim);
  const front = new THREE.PointLight(0xbfd8ff, 0, 7, 1.2); front.position.set(0.6, 1.4, 2.6); scene.add(front);
  // water surface far above + god rays
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: 0xcff4ff, transparent: true, opacity: 0.9, side: THREE.DoubleSide, fog: false })); surf.rotation.x = Math.PI / 2; scene.add(surf);
  const rays = []; const rayT = canvasTex(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); });
  for (let i = 0; i < 7; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 9), new THREE.MeshBasicMaterial({ map: rayT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide })); r.userData = { x: -3 + i, z: -2.5 + (i % 3) }; r.rotation.z = 0.15; scene.add(r); rays.push(r); }
  // marine snow / bubbles (moves up as we sink)
  const NS = 500, sPos = new Float32Array(NS * 3), r0 = rng(3), base = [];
  for (let i = 0; i < NS; i++) base.push([(r0() - 0.5) * 8, r0() * 8, (r0() - 0.5) * 6 - 0.5]);
  const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  const snow = new THREE.Points(sGeo, new THREE.PointsMaterial({ size: 0.035, map: glowTexture(), color: 0xe8f4ff, transparent: true, depthWrite: false, opacity: 0.8 })); snow.frustumCulled = false; scene.add(snow);
  // hero
  const hero = makeHuman('casual', { shirt: 0xff9f1c, jeans: 0x2f3e5a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  // pressure arrows
  const arrows = []; const arM = new THREE.MeshBasicMaterial({ color: 0x7fe0ff, transparent: true, toneMapped: false });
  for (let i = 0; i < 10; i++) { const g = new THREE.Group(); const cone = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 10), arM); cone.position.y = -0.07; cone.rotation.x = Math.PI; g.add(cone); const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 6), arM); shaft.position.y = 0.1; g.add(shaft); g.userData = { a: i / 10 * Math.PI * 2, y: 0.35 + (i % 5) * 0.3 }; scene.add(g); arrows.push(g); }
  // glowing creatures
  const jellies = []; for (let i = 0; i < 5; i++) { const g = new THREE.Group(); const col = [0x7f5cff, 0x39d0ff, 0xff5fa2, 0x5be37d, 0x39d0ff][i];
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.6, transparent: true, opacity: 0.75, side: THREE.DoubleSide })); g.add(bell);
    for (let k = 0; k < 6; k++) { const tn = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.003, 0.45, 4), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.7, toneMapped: false })); tn.position.set(Math.cos(k) * 0.09, -0.23, Math.sin(k) * 0.09); g.add(tn); }
    const gl = glowSprite(col, 0.8); gl.material.opacity = 0.5; g.add(gl); g.userData = { ph: i * 1.3, x: [-1.0, 0.95, -0.7, 1.1, 0.2][i], y: [1.9, 1.4, 0.5, 0.35, 2.3][i], z: [-0.6, -0.4, 0.4, -1.2, -1.6][i] }; scene.add(g); jellies.push(g); }
  const angler = new THREE.Group(); scene.add(angler);
  const abody = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14), new THREE.MeshStandardMaterial({ color: 0x2a2a38, roughness: 0.6 })); abody.scale.set(1.2, 0.9, 0.8); angler.add(abody);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x1a0a14 })); jaw.position.set(0.22, -0.05, 0); jaw.rotation.z = Math.PI / 2; angler.add(jaw);
  for (let i = 0; i < 7; i++) { const th = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.07, 4), new THREE.MeshStandardMaterial({ color: 0xffffff })); th.position.set(0.3, -0.02 - (i % 2) * 0.06, -0.12 + i * 0.04); th.rotation.z = i % 2 ? 0 : Math.PI; angler.add(th); }
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: 0xe8f0ff })); eye.position.set(0.18, 0.1, 0.16); angler.add(eye);
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.35, 5), abody.material); stalk.position.set(0.15, 0.36, 0); stalk.rotation.z = -0.6; angler.add(stalk);
  const lure = glowSprite(0xfff2a0, 0.35); lure.position.set(0.3, 0.5, 0); angler.add(lure);
  const lureB = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff2a0, toneMapped: false })); lureB.position.copy(lure.position); angler.add(lureB);
  const lureL = new THREE.PointLight(0xfff2a0, 0, 2.5, 1.5); lureL.position.copy(lure.position); angler.add(lureL);
  // elephant on the thumb (silhouette card)
  const eleT = canvasTex(256, 200, (g) => { g.fillStyle = '#9aa4b2'; g.beginPath(); g.ellipse(120, 95, 75, 52, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(195, 75, 38, 34, 0, 0, 7); g.fill(); g.fillRect(212, 85, 16, 70); g.beginPath(); g.ellipse(178, 70, 22, 30, 0.2, 0, 7); g.fillStyle = '#8a94a2'; g.fill(); g.fillStyle = '#9aa4b2'; for (const x of [62, 95, 140, 168]) g.fillRect(x, 120, 22, 72); g.fillStyle = '#222'; g.beginPath(); g.arc(205, 66, 4, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(222, 92); g.lineTo(240, 102); g.lineTo(222, 100); g.fill(); });
  const ele = new THREE.Sprite(new THREE.SpriteMaterial({ map: eleT, transparent: true, fog: false })); scene.add(ele);
  const pressRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 8, 24), new THREE.MeshBasicMaterial({ color: 0xff5a5a, transparent: true, toneMapped: false })); scene.add(pressRing);
  // seafloor
  const floorT = canvasTex(512, 512, (g) => { g.fillStyle = '#3a3a44'; g.fillRect(0, 0, 512, 512); const r = rng(8); for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(${r() > 0.5 ? '200,200,220' : '20,20,30'},0.25)`; g.beginPath(); g.arc(r() * 512, r() * 512, 1 + r() * 4, 0, 7); g.fill(); } });
  floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(6, 6);
  const seafloor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ map: floorT, roughness: 1 })); seafloor.rotation.x = -Math.PI / 2; scene.add(seafloor);
  const rocks = []; for (let i = 0; i < 9; i++) { const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 + (i % 3) * 0.15), new THREE.MeshStandardMaterial({ color: 0x4a4a55, flatShading: true })); rk.userData = { x: [-1.6, 1.4, -0.8, 2.2, -2.5, 0.9, -1.2, 1.8, 0.2][i], z: [-1.5, -1.8, -2.6, -0.6, -0.4, -3.0, 0.6, 0.9, -2.0][i] }; scene.add(rk); rocks.push(rk); }
  const dust = burst(0x9aa0b0, 60, 5); scene.add(dust);
  const splat = burst(0xff5a5a, 80, 6); scene.add(splat);
  // depth readout (left, mid-height)
  const dc = document.createElement('canvas'); dc.width = 512; dc.height = 200; const dg = dc.getContext('2d'); const dt = new THREE.CanvasTexture(dc); dt.colorSpace = THREE.SRGBColorSpace;
  const depthS = new THREE.Sprite(new THREE.SpriteMaterial({ map: dt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); depthS.renderOrder = 31; scene.add(depthS); let lastD = '';
  const drawD = (m) => { const s = m >= 10000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m).toLocaleString('en-US')} m`; if (s === lastD) return; lastD = s; dg.clearRect(0, 0, 512, 200); dg.font = "400 110px Brand, sans-serif"; dg.textAlign = 'left'; dg.textBaseline = 'middle'; dg.lineWidth = 12; dg.strokeStyle = 'rgba(0,0,0,0.55)'; dg.strokeText('▼' + s, 10, 100); dg.fillStyle = '#7fe0ff'; dg.fillText('▼' + s, 10, 100); dt.needsUpdate = true; };
  const flat = stamp('SPLAT!', '#ff3b3b', 0.6); scene.add(flat);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      const D = depthAt(t);
      const col = waterAt(t); scene.background.copy(col); scene.fog.color.copy(col);
      const dark = smooth(range(t, 8.4, 11.0));
      hemi.intensity = lerp(1.0, 0.18, dark); key.intensity = lerp(1.6, 0.0, dark);
      rim.intensity = lerp(0, 3.5, dark); front.intensity = lerp(0, 3.0, dark);
      // surface recedes upward
      surf.position.y = 3.6 + Math.min(D, 60) * 0.5; surf.material.opacity = 0.9 * (1 - smooth(range(t, 2.2, 7.0)));
      rays.forEach((r, i) => { r.position.set(r.userData.x + Math.sin(t * 0.5 + i) * 0.2, 3.6 + Math.min(D, 30) * 0.3, r.userData.z); r.material.opacity = (1 - smooth(range(t, 2.5, 8.8))) * (0.6 + 0.4 * Math.sin(t * 1.3 + i)); });
      // marine snow scroll by depth
      const scroll = D < 1000 ? D * 0.05 : 50 + (D - 1000) * 0.0025;
      for (let i = 0; i < NS; i++) { const b = base[i]; sPos[i * 3] = b[0] + Math.sin(t * 0.3 + i) * 0.05; sPos[i * 3 + 1] = ((b[1] + scroll + t * 0.05) % 8) - 2.5; sPos[i * 3 + 2] = b[2]; }
      sGeo.attributes.position.needsUpdate = true; snow.material.color.set(t < 9 ? 0xe8f4ff : 0x9fb8d8);
      // hero: floating / sinking pose with slow kicks, shiver when cold
      const crushK = easeOut(range(t, CRUSH, CRUSH + 0.12));
      const land = smooth(range(t, 22.8, 23.5));
      const kick = Math.sin(t * 2.4) * (1 - land);
      const cold = smooth(range(t, 10.8, 11.4)) * (1 - smooth(range(t, 13.0, 13.6)));
      const sv = Math.sin(t * 40) * 0.025 * cold;
      hero.root.position.set(0, lerp(0.35 + Math.sin(t * 1.1) * 0.04, 0, land), 0); hero.root.rotation.y = 0.25 + Math.sin(t * 0.3) * 0.08 * (1 - land);
      const sq = Math.max(smooth(range(t, 3.8, 4.4)) * (1 - smooth(range(t, 7.4, 8.0))) * (0.6 + 0.4 * Math.sin(t * 6)), 0);
      const thumb = smooth(range(t, 19.2, 19.7)) * (1 - smooth(range(t, 21.5, 22.0)));
      let pose = { lSh: [-0.1, 0, 0.75 - 0.3 * sq], rSh: [-0.1, 0, -0.75 + 0.3 * sq], lEl: [-0.4, 0, 0], rEl: [-0.4, 0, 0], lHip: [-0.25 + 0.3 * kick, 0, 0.08], rHip: [-0.25 - 0.3 * kick, 0, -0.08], lKn: [0.4, 0, 0], rKn: [0.4, 0, 0], spine: [0, 0, sv], neck: [0.05 + sv, sv * 3, 0] };
      if (land > 0) pose = over(pose, { lHip: [lerp(pose.lHip[0], 0, land), 0, 0.07], rHip: [lerp(pose.rHip[0], 0, land), 0, -0.07], lKn: [lerp(0.4, 0, land), 0, 0], rKn: [lerp(0.4, 0, land), 0, 0], lSh: [0.05, 0, lerp(0.75, 0.2, land)], rSh: [0.05, 0, lerp(-0.75, -0.2, land)] });
      if (cold > 0) pose = over(pose, { lSh: [-0.6, 0, -0.3], rSh: [-0.6, 0, 0.3], lEl: [-1.8, 0, 0], rEl: [-1.8, 0, 0] });
      hero.setPose(pose); hero.setMouth(t > 17.8 && t < 19 ? 0.4 : crushK > 0 ? 0.6 : 0.06);
      hero.root.scale.set(1 + 0.6 * crushK, Math.max(0.08, 1 - 0.92 * crushK), 1 + 0.6 * crushK);
      hero.root.children.forEach(o => {}); // keep
      // squeeze: torso narrows slightly
      hero.j.chest.scale.set(1 - 0.08 * sq, 1, 1 - 0.08 * sq);
      scene.updateMatrixWorld(true);
      // thumb up for the elephant
      const rs = hero.j.rSh.getWorldPosition(V());
      const thumbPos = rs.clone().add(V(0.15, 0.05 - 0.07 * smooth(range(t, 20.3, 20.6)) * (1 + 0.3 * Math.sin(t * 12)), 0.4));
      if (thumb > 0.01) { ikArm(hero, 'r', rs.clone().add(V(0.25, -0.45, 0.1)).lerp(thumbPos, thumb), rs.clone().add(V(-0.2, -0.4, -0.1)), V(0, 0, 1)); scene.updateMatrixWorld(true); }
      const rh = hero.j.rWr.localToWorld(V(0, -0.05, 0));
      const ek = easeOut(range(t, 19.9, 20.3)) * (1 - smooth(range(t, 21.5, 21.9)));
      ele.position.copy(rh).add(V(0, 0.17 + 0.25 * (1 - smooth(range(t, 19.9, 20.4))), 0.02)); ele.scale.set(0.34 * ek, 0.27 * ek, 1); ele.visible = ek > 0.01;
      pressRing.position.copy(rh).add(V(0, 0.04, 0)); pressRing.rotation.x = Math.PI / 2; const pr = smooth(range(t, 20.4, 20.6)) * (1 - smooth(range(t, 21.5, 21.9))); pressRing.scale.setScalar(0.6 + ((t * 2) % 1) * 1.2); pressRing.material.opacity = pr * (1 - ((t * 2) % 1)); pressRing.visible = pr > 0.01;
      // pressure arrows
      const ak = smooth(range(t, 3.9, 4.4)) * (1 - smooth(range(t, 7.6, 8.1)));
      const ak2 = smooth(range(t, 18.6, 19.0)) * (1 - smooth(range(t, 19.6, 20.0)));
      const ark = Math.max(ak, ak2);
      const hc = hero.root.position.clone();
      arrows.forEach((g, i) => { const a = g.userData.a + 0.25, rr = 0.55 - 0.08 * Math.sin(t * 6 + i); const p = hc.clone().add(V(Math.cos(a) * rr, g.userData.y, Math.sin(a) * rr)); g.position.copy(p); const dir = hc.clone().add(V(0, g.userData.y, 0)).sub(p).normalize(); g.quaternion.setFromUnitVectors(V(0, -1, 0), dir); g.scale.setScalar(Math.max(0.001, ark)); g.visible = ark > 0.01; });
      // creatures (appear at 1000 m, stay until bottom)
      const ck = smooth(range(t, 14.4, 15.6)) * (1 - smooth(range(t, 22.2, 23.0)));
      jellies.forEach((g, i) => { const u2 = g.userData; g.position.set(u2.x + Math.sin(t * 0.4 + u2.ph) * 0.15, u2.y + Math.sin(t * 1.2 + u2.ph) * 0.12 + (1 - ck) * -2, u2.z); g.children[0].scale.set(1 + 0.12 * Math.sin(t * 3 + u2.ph), 1 - 0.12 * Math.sin(t * 3 + u2.ph), 1 + 0.12 * Math.sin(t * 3 + u2.ph)); g.visible = ck > 0.01; g.scale.setScalar(Math.max(0.001, ck)); });
      const an = smooth(range(t, 15.2, 16.4)) * (1 - smooth(range(t, 22.2, 23.0)));
      angler.position.set(lerp(2.4, 0.62, an), 1.75 + Math.sin(t * 0.8) * 0.06, -0.7); angler.rotation.y = Math.PI; angler.visible = an > 0.01; lureL.intensity = 4 * an;
      // seafloor rises
      const fl = smooth(range(t, 21.8, 23.2));
      seafloor.position.y = lerp(-8, 0, fl); seafloor.visible = fl > 0.01;
      rocks.forEach((rk, i) => { rk.position.set(rk.userData.x, seafloor.position.y + 0.08, rk.userData.z); rk.visible = fl > 0.01; });
      dust.position.set(0, 0.05, 0); dust.update(t - 23.3);
      splat.position.set(0, 0.2, 0.1); splat.update(t - CRUSH);
      // ---------- camera ----------
      const KEYS = [[0, [0.4, 1.3, 4.4], [0.0, 1.1, 0]], [2.6, [0.3, 1.25, 3.8], [0.0, 1.1, 0]], [13.0, [0.3, 1.25, 3.7], [0.0, 1.05, 0]], [14.4, [0.5, 1.35, 4.6], [0.1, 1.05, -0.3]], [17.0, [0.5, 1.35, 4.6], [0.1, 1.05, -0.3]],
        [18.4, [0.4, 1.3, 3.6], [0.05, 1.1, 0]], [22.0, [0.4, 1.3, 3.6], [0.05, 1.0, 0]], [23.6, [0.5, 1.2, 4.0], [0.05, 0.8, 0]], [28.4, [0.5, 1.15, 3.8], [0.05, 0.6, 0]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const sh = shake(t, 0.5 + (t > CRUSH && t < CRUSH + 0.5 ? 4 : 0) + (t > 23.2 && t < 23.5 ? 1.5 : 0), 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const dk = smooth(range(t, 2.4, 2.8)) * (1 - smooth(range(t, CRUSH, CRUSH + 0.2)));
      drawD(D); depthS.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.12).addScaledVector(rt, -0.14); depthS.scale.set(0.27 * dk, 0.105 * dk, 1); depthS.material.opacity = dk; depthS.visible = dk > 0.01;
      flat.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.05); flat.set(t > CRUSH + 0.15 ? easeOut(range(t, CRUSH + 0.15, CRUSH + 0.35)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.5, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
