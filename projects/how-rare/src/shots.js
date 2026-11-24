import * as THREE from 'three';
import { grassTufts, labelCam, loadKit, world3d, prop, fit, creature, person, keyCam, texMat, canvasTex, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

// "How rare are you?" — five rare traits; real 3D people, real 3D eye/hand/head models, fully 3D sets
export const DURATION = 38.1;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, {
  models: ['sf/eyeball', 'sf/mouth', 'sf/hand_anim', 'sf/human_eye', 'sf/office_tower', 'sf/nyc_dwellings', 'sf/trees_realistic', 'painted_wooden_bench', 'street_lamp_01', 'grass_medium_01', 'potted_plant_01'],
  hdris: ['wide_street_01', 'studio_small_09'], tex: ['concrete_floor_02', 'forrest_ground_01'],
  people: ['carla', 'eric', 'sophia', 'manuel', 'claudia', 'nathan'],
});
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
const cam0 = (fov = 38) => new THREE.PerspectiveCamera(fov, 720 / 1280, 0.002, 1500);
const ret = (b = 0.15, e = 1.0) => ({ bloom: b, exposure: e });
const DAY = { sunElev: 42, sunAz: 210, sun: 2.3, env: 0.8, fog: [0xd6e8f5, 120, 900] };
const STUDIO = { ground: null, env: 1.1, sun: 2.0, hemi: 0.4, skyTop: 0x141820, skyMid: 0x252c3a, skyHorizon: 0x3c4658, skyFloor: 0x141820 };

// ---------- shared 3D plaza ----------
function building(name, h, at, ry = 0, face = null) {
  const b = fit(prop(name), h, 'y'); b.position.copy(at); b.rotation.y = ry; b.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  if (face) { b.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(b, true); if (face[0] === '+z') b.position.z += face[1] - bb.max.z; }
  return b;
}
function trees(scene, spots) { spots.forEach(([x, z, h, i]) => { const all = prop('sf/trees_realistic'); const kids = []; all.traverse(o => { if (/^Tree/.test(o.name) && o.parent && !/^Tree/.test(o.parent.name)) kids.push(o); }); const pick = kids[(i || 0) % Math.max(1, kids.length)] || all; const t = fit(pick.clone(), h, 'y'); t.position.set(x, 0, z); t.rotation.y = (i || 0) * 1.7; t.traverse(m => { if (m.isMesh) m.castShadow = true; }); scene.add(t); }); }
function plaza(makeStage) {
  const scene = world3d(makeStage({ shadowSize: 16, sunDir: [-4, 8, 3] }), 'wide_street_01', { ...DAY, ground: 'concrete_floor_02', groundRepeat: 160 });
  for (let i = -2; i <= 2; i++) scene.add(building('sf/nyc_dwellings', 17 + (i % 2) * 3, V(i * 34, 0, -22), 0, ['+z', -22]));
  [[-40, -80, 140], [25, -100, 160], [70, -70, 120]].forEach(([x, z, h]) => scene.add(building('sf/office_tower', h, V(x, 0, z))));
  trees(scene, [[-7, -9, 8, 0], [7, -10, 8.5, 1]]);
  for (const x of [-4.5, 4.5]) { const b = fit(prop('painted_wooden_bench'), 1.8, 'x'); b.position.set(x, 0, -5.5); scene.add(b); const l = fit(prop('street_lamp_01'), 5.5, 'y'); l.position.set(x * 1.6, 0, -6.5); scene.add(l); }
  return scene;
}
// ---------- realistic procedural tongue (curls into a U with k) ----------
function tongue(len = 0.085, wid = 0.05, th = 0.016) {
  const geo = new THREE.SphereGeometry(1, 64, 48); const p = geo.attributes.position; const base = Float32Array.from(p.array);
  const tex = canvasTex(256, 256, (g) => { g.fillStyle = '#d9707a'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 2600; i++) { const x = Math.random() * 256, y = Math.random() * 256; g.fillStyle = `rgba(${235 + Math.random() * 15 | 0},${130 + Math.random() * 40 | 0},${140 + Math.random() * 30 | 0},0.28)`; g.beginPath(); g.arc(x, y, 0.8 + Math.random() * 1.4, 0, 7); g.fill(); } g.fillStyle = 'rgba(150,50,60,0.35)'; g.fillRect(124, 0, 8, 256); });
  const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: tex, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25, sheen: 0.3, sheenColor: new THREE.Color(0xffc0c8) }));
  m.castShadow = true;
  m.curl = (k, ext = 1) => { // x: across, y: along (tip at +y), z: up
    for (let i = 0; i < p.count; i++) {
      let x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
      const taper = 0.55 + 0.45 * Math.sqrt(Math.max(0, 1 - Math.max(0, y) ** 2));
      let X = x * wid * taper, Y = (y * 0.5 + 0.5) * len * ext, Z = z * th * (0.7 + 0.3 * (1 - Math.abs(x)));
      Z -= 0.004 * Math.exp(-x * x * 40); // central groove
      const a = k * 1.4 * x; // roll the sides up into a U / tube
      const r = wid * 0.55; const cx = Math.sin(a) * r * (Math.abs(x) > 0 ? 1 : 0) / (Math.abs(a) > 1e-3 ? (a / x / 1.4) * 0 + 1 : 1);
      const X2 = k > 0.01 ? Math.sin(a) / (1.4 * k) * wid : X, Z2 = k > 0.01 ? Z + (1 - Math.cos(a)) / (1.4 * k) * wid : Z;
      p.setXYZ(i, lerp(X, X2, Math.min(1, k)), Y, lerp(Z, Z2, Math.min(1, k)));
    }
    p.needsUpdate = true; geo.computeVertexNormals();
  };
  m.curl(0); return m;
}

// ---------- A (0 – 1.65): who's rare? a crowd, push in ----------
function sA({ makeStage }) {
  const scene = plaza(makeStage);
  const P = [['carla', -1.6, 0.2], ['eric', -0.75, -0.6], ['sophia', 0, 0.3], ['manuel', 0.8, -0.5], ['claudia', 1.6, 0.1], ['nathan', 0.4, -1.4]].map(([k, x, z], i) => { const p = person(k, { height: ['eric', 'manuel', 'nathan'].includes(k) ? 1.8 : 1.67 }); p.root.position.set(x, 0, z); p.root.rotation.y = -x * 0.15; scene.add(p.root); return p; });
  const cam = cam0();
  return { scene, camera: cam, update(t) {
    P.forEach((p, i) => p.update(t + i, { idle: 1 }, 1, { headTilt: 0.15 * Math.sin(i) }).plant());
    const k = sm(0, 1.65, t); cam.position.set(lerp(0.3, 0.05, k), 1.6, lerp(6.5, 3.2, k)); cam.lookAt(0, 1.35, 0); labelCam(cam);
    return ret();
  } };
}
// ---------- eye helpers ----------
function makeEye(color) {
  const e = fit(prop('sf/eyeball'), 0.024, 'max', { ground: false });
  e.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); if (/IRIS/i.test(m.material.name)) { m.material.color.set(color); m.userData.iris = true; } } });
  return e;
}
function aimEye(e, target) { // turn the eye so its iris faces target
  e.updateMatrixWorld(true); const c = new THREE.Box3().setFromObject(e).getCenter(V()); let ic = null;
  e.traverse(m => { if (m.userData.iris) ic = new THREE.Box3().setFromObject(m).getCenter(V()); });
  if (!ic) return; const cur = ic.sub(c).normalize(), want = target.clone().sub(c).normalize();
  e.quaternion.premultiply(new THREE.Quaternion().setFromUnitVectors(cur, want));
}
// ---------- B1 (1.65 – 3.8): blue eye macro ----------
function sB1({ makeStage }) {
  const scene = world3d(makeStage({ shadowSize: 1, sunDir: [-2, 4, 3] }), 'studio_small_09', STUDIO);
  const eye = makeEye(0x3d7fd6); scene.add(eye); eye.position.set(0, 0, 0);
  const cam = cam0(30); let aimed = false;
  return { scene, camera: cam, update(t) {
    const k = sm(0, 2.15, t); cam.position.set(lerp(0.03, 0.008, k), lerp(0.012, 0.004, k), lerp(0.09, 0.055, k)); cam.lookAt(0, 0, 0); labelCam(cam);
    if (!aimed) { aimEye(eye, V(0.02, 0.01, 0.1)); aimed = true; }
    return ret(0.2, 1.05);
  } };
}
// ---------- B2 (3.8 – 7.82): 1 in 10 people has blue eyes ----------
function sB2({ makeStage }) {
  const scene = plaza(makeStage); scene.environmentIntensity = 0.35; scene.userData.key.intensity = 0.7;
  const kinds = ['eric', 'claudia', 'manuel', 'carla', 'nathan', 'sophia', 'eric', 'claudia', 'manuel', 'carla'];
  const row = kinds.map((k, i) => { const p = person(k, { height: ['eric', 'manuel', 'nathan'].includes(k) ? 1.8 : 1.67 }); p.root.position.set((i - 4.5) * 0.85, 0, -0.3 - (i % 2) * 0.35); scene.add(p.root); return p; });
  const spot = new THREE.SpotLight(0xdff0ff, 0, 12, 0.22, 0.5, 1.2); spot.position.set(0.43, 6, 2); scene.add(spot, spot.target);
  const cam = cam0();
  return { scene, camera: cam, update(t) {
    row.forEach((p, i) => p.update(t + i * 0.7, { idle: 1 }, 1, i === 5 ? { headTilt: 0.15 } : null).plant());
    spot.target.position.copy(row[5].root.position).add(V(0, 1, 0)); spot.intensity = 260 * sm(0.6, 1.0, t);
    const k = sm(0, 4.0, t); cam.position.set(lerp(-2.5, 0.6, k), 1.55, lerp(6.4, 4.2, k)); cam.lookAt(lerp(-1.2, 0.43, k), 1.2, 0); labelCam(cam);
    return ret(0.2, 1.0);
  } };
}
// ---------- C (7.82 – 14.0): tongue rolling ----------
function sC({ makeStage }) {
  const scene = world3d(makeStage({ shadowSize: 1, sunDir: [-2, 4, 3] }), 'studio_small_09', STUDIO);
  const mouth = fit(prop('sf/mouth'), 0.12, 'max', { ground: false }); scene.add(mouth);
  mouth.updateMatrixWorld(true); const mb = new THREE.Box3().setFromObject(mouth); const mc = mb.getCenter(V()), ms = mb.getSize(V());
  const tg = tongue(0.05, 0.032, 0.01); scene.add(tg);
  const cam = cam0(32);
  return { scene, camera: cam, update(t) {
    const out = sm(0.6, 1.4, t), curl = sm(2.4, 3.6, t);
    tg.curl(curl, 0.9 + 0.25 * out);
    tg.position.set(mc.x, mc.y - ms.y * 0.12, mc.z + ms.z * 0.05 + 0.02 * out); tg.quaternion.setFromEuler(new THREE.Euler(Math.PI / 2 + 0.15, 0, 0)); tg.rotateY(Math.PI);
    const k = sm(0, 6.2, t); cam.position.set(mc.x + lerp(0.05, 0.015, k), mc.y + lerp(0.02, 0.035, k), mc.z + lerp(0.3, 0.24, k)); cam.lookAt(mc.x, mc.y - 0.01, mc.z + 0.02); labelCam(cam);
    return ret(0.15, 1.05);
  } };
}
// ---------- D (14.0 – 19.49): heterochromia — one blue eye, one brown ----------
function sD({ makeStage }) {
  const scene = world3d(makeStage({ shadowSize: 1, sunDir: [-2, 4, 3] }), 'studio_small_09', STUDIO);
  const blue = makeEye(0x3d7fd6), brown = makeEye(0x6b3a1c); scene.add(blue, brown);
  blue.position.set(-0.016, 0, 0); brown.position.set(0.016, 0, 0);
  const cam = cam0(30); let aimed = false;
  return { scene, camera: cam, update(t) {
    if (!aimed) { aimEye(blue, V(0, 0, 0.2)); aimEye(brown, V(0, 0, 0.2)); aimed = true; }
    const k = sm(0, 5.5, t); cam.position.set(lerp(-0.01, 0.0, k), lerp(0.006, 0.002, k), lerp(0.2, 0.16, k)); cam.lookAt(0, 0, 0); labelCam(cam);
    return ret(0.2, 1.05);
  } };
}
// ---------- E (19.49 – 25.78): hitchhiker's thumb (real person's hand: fist, thumb up, then bends far back) ----------
const _wq = new THREE.Quaternion();
function rotW(b, axis, ang) { b.parent.getWorldQuaternion(_wq); const la = axis.clone().applyQuaternion(_wq.clone().invert()).normalize(); b.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(la, ang)); b.updateMatrixWorld(true); }
const wp = (b) => b.getWorldPosition(V());
function handPose(p, side, fist, thumbBack, sign = 1) {
  const B = p.bone, S = side; const H = B[S + 'Hand']; if (!H) return;
  const idx = wp(B[S + 'HandIndex1']), pin = wp(B[S + 'HandPinky1']), mid2 = wp(B[S + 'HandMiddle2']), hand = wp(H);
  const fwd = mid2.clone().sub(hand).normalize(), across = pin.clone().sub(idx).normalize();
  const palmN = across.clone().cross(fwd).normalize().multiplyScalar(sign);
  for (const F of ['Index', 'Middle', 'Ring', 'Pinky']) for (const k of [1, 2, 3]) { const b = B[S + 'Hand' + F + k]; if (!b) continue; rotW(b, across.clone().multiplyScalar(-sign), (k === 1 ? 1.35 : 1.45) * fist); }
  const t1 = B[S + 'HandThumb1'], t2 = B[S + 'HandThumb2'], t3 = B[S + 'HandThumb3'];
  if (t1 && t2) { const tdir = wp(t2).sub(wp(t1)).normalize(); const ax = tdir.clone().cross(palmN).normalize(); rotW(t2, ax, -0.75 * thumbBack); if (t3) rotW(t3, ax, -0.95 * thumbBack); }
}
let TW = -3.0;
function sE({ makeStage }) {
  const scene = plaza(makeStage);
  const man = person('eric'); scene.add(man.root);
  const cam = cam0(34);
  return { scene, camera: cam, update(t) {
    const up = sm(0.1, 0.9, t), fist = sm(0.6, 1.4, t), back = sm(2.6, 3.8, t);
    man.update(t, { idle: 1 }, 1, { armUp: 0.0, point: 0.95 * up, lookDown: 0.1 }).plant();
    man.root.position.set(0, man.root.position.y, 0); man.root.rotation.y = 0.5;
    scene.updateMatrixWorld(true);
    { const fa = man.bone.RightForeArm, hb = man.bone.RightHand; const d = wp(hb).sub(wp(fa)).normalize(); rotW(fa, d, TW * up); }
    scene.updateMatrixWorld(true);
    handPose(man, 'Right', fist, back, 1);
    const h = man.world('RightHand');
    const k = sm(0, 6.3, t); cam.position.set(h.x + lerp(0.55, 0.32, k), h.y + lerp(0.12, 0.05, k), h.z + lerp(0.75, 0.42, k)); cam.lookAt(h.x, h.y + 0.05, h.z); labelCam(cam);
    return ret(0.15, 1.0);
  } };
}
// ---------- F (25.78 – 32.85): tongue touching the nose ----------
function sF({ makeStage }) {
  const scene = world3d(makeStage({ shadowSize: 2, sunDir: [-2, 4, 3] }), 'studio_small_09', STUDIO);
  const head = fit(prop('sf/human_eye'), 0.3, 'y', { ground: false }); scene.add(head);
  head.updateMatrixWorld(true); const hb = new THREE.Box3().setFromObject(head); const hc = hb.getCenter(V()), hs = hb.getSize(V());
  const mouthPos = V(hc.x, hb.min.y + hs.y * 0.41, hb.max.z - 0.02);
  const tg = tongue(0.058, 0.03, 0.016); scene.add(tg);
  const eyes = [-1, 1].map(sx => { const e = makeEye(0x4a2a14); e.scale.multiplyScalar(1.05); e.position.set(hc.x + sx * 0.0315, hb.min.y + hs.y * 0.635, hb.max.z - 0.034); scene.add(e); return e; }); let aimed = false;
  const cam = cam0(30);
  return { scene, camera: cam, update(t) {
    const out = sm(1.0, 2.6, t), lift = sm(2.2, 3.4, t);
    tg.curl(0.35, 0.2 + 0.8 * out); if (!aimed) { eyes.forEach(e => aimEye(e, V(hc.x + 0.3, hc.y + 0.05, hc.z + 1))); aimed = true; }
    tg.position.copy(mouthPos); tg.quaternion.setFromEuler(new THREE.Euler(lerp(Math.PI / 2 + 0.2, 0.35, lift), 0, 0)); tg.rotateY(Math.PI);
    const k = sm(0, 7.0, t); const ang = lerp(0.3, 0.65, k);
    cam.position.set(hc.x + Math.sin(ang) * 0.42, mouthPos.y + 0.03, hc.z + Math.cos(ang) * 0.42); cam.lookAt(mouthPos.x, mouthPos.y + 0.03, mouthPos.z - 0.03); labelCam(cam);
    return ret(0.15, 1.05);
  } };
}
// ---------- G (32.85 – end): "are YOU trying right now?" ----------
function sG({ makeStage }) {
  const scene = plaza(makeStage);
  const P = [['manuel', 0, 0.4], ['carla', -1.0, -0.6], ['claudia', 1.1, -0.5]].map(([k, x, z]) => { const p = person(k, { height: k === 'manuel' ? 1.8 : 1.67 }); p.root.position.set(x, 0, z); scene.add(p.root); return p; });
  const cam = cam0();
  return { scene, camera: cam, update(lt, t) {
    const tryK = sm(33.6, 34.2, t), caught = sm(36.4, 36.9, t);
    P.forEach((p, i) => p.update(t + i, { idle: 1 }, 1, { lookUp: 0.55 * tryK * (1 - caught), headTilt: (i ? -0.3 : 0.35) * tryK * (1 - caught), facepalm: i === 0 ? 0.9 * caught : 0, shrug: i ? 0.7 * caught : 0 }).plant());
    P[0].root.rotation.y = 0; P[1].root.rotation.y = 0.35; P[2].root.rotation.y = -0.35;
    const k = sm(32.85, 38.1, t); cam.position.set(0.1, 1.6, lerp(4.6, 2.4, k)); cam.lookAt(0, 1.4, 0); labelCam(cam);
    return ret();
  } };
}
export const SHOTS = [
  { start: 0, end: 1.65, build: sA }, { start: 1.65, end: 3.8, build: sB1 }, { start: 3.8, end: 7.82, build: sB2 }, { start: 7.82, end: 14.0, build: sC },
  { start: 14.0, end: 19.49, build: sD }, { start: 19.49, end: 25.78, build: sE }, { start: 25.78, end: 32.85, build: sF }, { start: 32.85, end: 99, build: sG },
];
