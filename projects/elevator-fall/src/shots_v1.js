import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { stamp, iconBubble } from './ancient.js';

export const DURATION = 28.2;
export const CAPTIONS = [
  [0.0, 'What would happen'], [0.94, 'if your elevator cable'], [2.26, 'snapped?'],
  [3.33, "Don't worry"], [4.2, "you wouldn't plummet"], [5.13, 'to the ground'],
  [6.24, 'Elevators hang from'], [7.37, 'several steel cables'], [9.11, 'and each one can hold'], [10.38, 'the full weight on its own'],
  [12.2, 'Even if every cable broke'], [14.34, 'automatic safety brakes'], [15.78, 'would clamp onto the rails'], [17.2, 'and stop the car'],
  [18.55, 'And at the bottom of the shaft'], [20.19, 'giant springs'], [21.32, 'or oil buffers'], [22.19, 'soften any landing'],
  [23.92, 'In fact, elevators are'], [25.49, 'one of the safest ways'], [26.76, 'to travel!', 28.0],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const CAB_W = 1.5, CAB_H = 2.3, TOP = 24;
// car floor height over time
const carY = (t) => { if (t < 12.4) return 12 + Math.sin(t * 0.3) * 0.05 - (t > 2.26 && t < 2.6 ? 0.08 : 0); if (t < 17.3) { const f = clamp((t - 14.0) / 3.3); return 12 - 1.6 * easeIn2(f); } if (t < 18.6) return 10.4; return lerp(10.4, 0.55, easeInOut(range(t, 18.7, 22.6))) - 0.25 * smooth(range(t, 22.5, 23.1)); };
function easeIn2(x) { return x * x; }

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-3, 9, 6], sun: 1.6 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x1a2230); u.mid.value.set(0x2a3446); u.horizon.value.set(0x3a465a); u.floorC.value.set(0x1a1e26);
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xcfd8e8); hemi.groundColor.set(0x40404a); hemi.intensity = 0.9;
  const key = scene.userData.key;
  // shaft cutaway: back wall, side walls, floor numbers, landing doors
  const conc = canvasTex(256, 256, (g) => { g.fillStyle = '#8a8e96'; g.fillRect(0, 0, 256, 256); const r = rng(3); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '60,62,68' : '170,172,178'},0.25)`; g.fillRect(r() * 256, r() * 256, 3, 3); } g.strokeStyle = 'rgba(40,40,46,0.4)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 254); g.lineTo(256, 254); g.stroke(); });
  conc.wrapS = conc.wrapT = THREE.RepeatWrapping; conc.repeat.set(2, 9);
  const wm = new THREE.MeshStandardMaterial({ map: conc, roughness: 0.9 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(4.2, TOP + 2, 0.3), wm); back.position.set(0, TOP / 2 - 1, -1.2); scene.add(back);
  for (const s of [-1, 1]) { const sw = new THREE.Mesh(new THREE.BoxGeometry(0.3, TOP + 2, 2.6), wm); sw.position.set(s * 2.1, TOP / 2 - 1, 0); scene.add(sw); }
  for (let f = 0; f < 8; f++) { const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), new THREE.MeshBasicMaterial({ map: canvasTex(128, 96, (g) => { g.fillStyle = '#ffd23f'; g.fillRect(0, 0, 128, 96); g.fillStyle = '#1a1a1a'; g.font = '900 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(f), 64, 52); }) })); lbl.position.set(-1.6, f * 3 + 2.2, -1.04); scene.add(lbl); }
  const pit = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.2, 2.6), new THREE.MeshStandardMaterial({ color: 0x3a3a40 })); pit.position.y = -0.1; scene.add(pit);
  // guide rails
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa2ac, metalness: 0.8, roughness: 0.35 });
  for (const s of [-1, 1]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, TOP + 2, 0.18), steel); rail.position.set(s * (CAB_W / 2 + 0.2), TOP / 2 - 1, -0.1); scene.add(rail); }
  // buffers (springs) in the pit
  const springs = []; for (const s of [-0.4, 0.4]) { const pts = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 14; pts.push(V(Math.cos(a) * 0.15, i / 120, Math.sin(a) * 0.15)); } const sp = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.025, 6), new THREE.MeshStandardMaterial({ color: 0xffd23f, metalness: 0.5, roughness: 0.4, emissive: 0x000000 })); sp.position.set(s, 0, -0.1); sp.scale.y = 0.7; scene.add(sp); springs.push(sp); }
  const oil = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 16), new THREE.MeshStandardMaterial({ color: 0xc0182a, metalness: 0.4, roughness: 0.4 })); oil.position.set(0, 0.3, -0.1); scene.add(oil);
  // cab
  const cab = new THREE.Group(); scene.add(cab);
  const cm = new THREE.MeshStandardMaterial({ color: 0xc8ccd2, metalness: 0.6, roughness: 0.35 });
  const fl = new THREE.Mesh(new THREE.BoxGeometry(CAB_W, 0.1, 1.4), cm); fl.position.y = -0.05; cab.add(fl);
  const rf = new THREE.Mesh(new THREE.BoxGeometry(CAB_W, 0.1, 1.4), cm); rf.position.y = CAB_H; cab.add(rf);
  const bw = new THREE.Mesh(new THREE.BoxGeometry(CAB_W, CAB_H, 0.06), new THREE.MeshStandardMaterial({ color: 0xb8a888, roughness: 0.6 })); bw.position.set(0, CAB_H / 2, -0.7); cab.add(bw);
  for (const s of [-1, 1]) { const sw = new THREE.Mesh(new THREE.BoxGeometry(0.06, CAB_H, 1.4), cm); sw.position.set(s * CAB_W / 2, CAB_H / 2, 0); cab.add(sw); }
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(CAB_W, CAB_H), new THREE.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.12, roughness: 0.05 })); glass.position.set(0, CAB_H / 2, 0.7); cab.add(glass);
  const lamp = new THREE.PointLight(0xfff0dc, 4, 4, 1.4); lamp.position.set(0, CAB_H - 0.2, 0); cab.add(lamp);
  // safety brakes (wedges on the rails)
  const brakes = [-1, 1].map(s => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.26), new THREE.MeshStandardMaterial({ color: 0xe63946, metalness: 0.5, roughness: 0.4 })); b.position.set(s * (CAB_W / 2 + 0.06), 0.15, -0.1); cab.add(b); return b; });
  cab.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  // cables
  const cables = []; for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 8), new THREE.MeshStandardMaterial({ color: 0x5a5e66, metalness: 0.9, roughness: 0.3, emissive: 0x000000 })); scene.add(c); cables.push(c); }
  const sheave = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 24), steel); sheave.rotation.z = Math.PI / 2; sheave.position.set(0, TOP, -0.1); scene.add(sheave);
  const SNAP = [2.26, 12.75, 13.1, 13.49];
  // hero
  const hero = makeHuman('casual', { shirt: 0x2a9d8f, jeans: 0x34507a, chestText: 'MR. CLOUD' }); cab.add(hero.root); hero.root.position.set(0, 0, 0.1);
  const weights = [0, 1, 2, 3].map(i => { const w = iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#d0d6de'; g.beginPath(); g.moveTo(150, 400); g.lineTo(190, 160); g.lineTo(322, 160); g.lineTo(362, 400); g.fill(); g.strokeStyle = '#d0d6de'; g.lineWidth = 30; g.beginPath(); g.arc(256, 140, 50, Math.PI, 0); g.stroke(); g.fillStyle = '#2a2a30'; g.font = '900 70px sans-serif'; g.textAlign = 'center'; g.fillText('100%', 256, 320); })); w.renderOrder = 30; scene.add(w); return w; });
  const fx = { snap: SNAP.map((_, i) => burst(0xffd166, 50, i + 1)), brake: [burst(0xffb347, 90, 9), burst(0xffb347, 90, 10)], land: burst(0xffffff, 60, 11), safe: burst(0x5be37d, 100, 12) };
  for (const v of Object.values(fx)) (Array.isArray(v) ? v : [v]).forEach(f => scene.add(f));
  const noFall = stamp('NO FREE FALL', '#5be37d', 0.6); scene.add(noFall);
  const safe = stamp('SAFEST RIDE', '#5be37d', 0.6); scene.add(safe);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      const cy = carY(t); cab.position.set(0, cy, 0);
      const falling = t > 14.0 && t < 17.3;
      cab.rotation.z = (t > 2.26 && t < 2.8 ? Math.sin((t - 2.26) * 40) * 0.02 * (1 - range(t, 2.26, 2.8)) : 0) + (t > 17.3 && t < 17.8 ? Math.sin((t - 17.3) * 50) * 0.015 * (1 - range(t, 17.3, 17.8)) : 0);
      // cables: intact ones go up to the sheave; snapped ones whip and fall slack
      cables.forEach((cb, i) => { const x = -0.3 + i * 0.2, top = V(x * 0.4, TOP, -0.1), bot = V(x, cy + CAB_H + 0.05, -0.1); const sn = t - SNAP[i];
        if (sn < 0) { const d = top.clone().sub(bot); cb.position.copy(bot).addScaledVector(d, 0.5); cb.scale.set(1, d.length(), 1); cb.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); }
        else { const len = 3 + sn * 1; const d = V(Math.sin(sn * 3 + i) * 0.4, 1, 0.2).normalize(); const start = top.clone().add(V(0, -Math.min(14, sn * sn * 4.9), 0)); cb.position.copy(start).addScaledVector(d, -len / 2); cb.scale.set(1, len, 1); cb.quaternion.setFromUnitVectors(V(0, 1, 0), d); }
        const glow = smooth(range(t, 7.3 + i * 0.25, 7.6 + i * 0.25)) * (1 - smooth(range(t, 11.6, 12.0))); cb.material.emissive.setRGB(0.2 * glow, 0.7 * glow, 0.3 * glow);
        fx.snap[i].position.copy(top).add(V(0, -(TOP - cy - CAB_H) * 0.5, 0)); fx.snap[i].update(sn); });
      // safety brakes clamp at 15.9
      const clamp1 = smooth(range(t, 15.9, 16.2));
      brakes.forEach((b, i) => { b.position.x = (i ? 1 : -1) * (CAB_W / 2 + 0.06 + 0.06 * clamp1); b.material.emissive.setRGB(0.5 * clamp1 * (t < 18 ? 1 : 0), 0.1 * clamp1, 0); });
      fx.brake.forEach((f, i) => { f.position.set((i ? 1 : -1) * (CAB_W / 2 + 0.2), cy + 0.1, -0.1); f.update((t - 16.0) * 0.6); });
      // springs compress on landing
      const comp = smooth(range(t, 22.5, 23.1)); springs.forEach(sp => { sp.scale.y = 0.7 - 0.25 * comp; sp.material.emissive.setRGB(0.3 * smooth(range(t, 20.1, 20.4)) * (1 - smooth(range(t, 23.4, 24))), 0.25 * smooth(range(t, 20.1, 20.4)) * (1 - smooth(range(t, 23.4, 24))), 0); });
      oil.scale.y = 1 - 0.4 * comp; oil.position.y = 0.3 * (1 - 0.4 * comp);
      fx.land.position.set(0, 0.6, 0.3); fx.land.update(t - 22.6);
      // hero inside
      const scared = smooth(range(t, 2.3, 2.5)) * (1 - smooth(range(t, 3.6, 4.2))) + smooth(range(t, 12.7, 13.0)) * (1 - smooth(range(t, 17.6, 18.2)));
      const thumbs = smooth(range(t, 4.3, 4.7)) * (1 - smooth(range(t, 6.0, 6.4))) + smooth(range(t, 24.6, 25.0));
      hero.setPose(over(STAND(t), { lSh: [-0.6 * scared, 0, 0.9 * scared + 0.16], rSh: [-0.6 * scared - 1.6 * thumbs, 0, -0.9 * scared - 0.16 - 0.2 * thumbs], lEl: [-0.4 * scared, 0, 0], rEl: [-0.4 * scared - 1.6 * thumbs, 0, 0], drop: -0.1 * scared, lKn: [0.25 * scared, 0, 0], rKn: [0.25 * scared, 0, 0], lHip: [-0.15 * scared, 0, 0.07], rHip: [-0.15 * scared, 0, -0.07], neck: [-0.2 * scared, Math.sin(t * 5) * 0.2 * scared, 0] }));
      hero.setMouth(0.5 * scared + 0.25 * thumbs);
      scene.updateMatrixWorld(true);
      // ---------- camera follows the car through the cutaway ----------
      const ly = t < 18.6 ? cy + 1.2 : lerp(cy + 1.2, 1.2, smooth(range(t, 18.6, 20.5)));
      const KEYS = [[0, 2.4, 8.5, 0.6], [2.6, 1.6, 7.0, 0.4], [6.2, 2.4, 8.6, 2.8], [11.8, 2.2, 8.0, 2.4], [12.5, 1.4, 7.0, 0.6], [17.8, 1.5, 7.0, 0.5], [20.0, 1.2, 6.8, 0.3], [23.8, 1.5, 6.2, 0.2], [28.2, 1.4, 6.0, 0.2]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0])), L = (j) => lerp(KEYS[i][j], KEYS[i + 1][j], k);
      const cp = V(L(1), ly + L(3), L(2)), lk = V(0, ly + (t > 6.2 && t < 12.2 ? 2.6 * smooth(range(t, 6.2, 7.2)) * (1 - smooth(range(t, 11.6, 12.2))) : 0), -0.1);
      const sh = shake(t, 0.5 + (falling ? 3 : 0) + (t > 15.9 && t < 16.6 ? 6 : 0), 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-3, 9, 6));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion);
      weights.forEach((w, j) => { const tin = 9.6 + j * 0.25; w.position.set(-0.3 + j * 0.2 * 0.7 - 0.6 + j * 0.25, cy + CAB_H + 1.4 + (j % 2) * 0.35, 0.3); w.set(0.32 * easeOut(range(t, tin, tin + 0.25)) * (1 - smooth(range(t, 11.6, 11.9))), 0); });
      noFall.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.25); noFall.set(t > 4.2 ? easeOut(range(t, 4.2, 4.36)) * (1 - smooth(range(t, 5.9, 6.2))) : 0);
      safe.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.25); safe.set(t > 25.5 ? easeOut(range(t, 25.5, 25.66)) : 0);
      fx.safe.position.copy(c.position).addScaledVector(fw, 2.4).addScaledVector(upv, 0.25); fx.safe.update(t - 25.5);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.45, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
