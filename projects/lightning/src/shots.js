import * as THREE from 'three';
import { labelCam, loadKit, world, prop, person, label, showLabel, xray, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 28.6;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['rubber_boots'], hdris: ['approaching_storm'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
const rnd = (s) => { const x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); };

// jagged lightning bolt made of thin glowing tubes; returns group with .regen(seed, from, to)
function bolt(radius = 0.035, branches = 4) {
  const g = new THREE.Group(); const mat = new THREE.MeshBasicMaterial({ color: 0xe8f0ff, toneMapped: false });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x7aa8ff, transparent: true, opacity: 0.35, toneMapped: false, depthWrite: false });
  g.regen = (seed, from, to, amp = 1.4, nseg = 18) => {
    g.children.slice().forEach(c => { c.geometry.dispose(); g.remove(c); });
    const path = (a, b, n, amp, s) => { const pts = [a.clone()]; for (let i = 1; i < n; i++) { const p = a.clone().lerp(b, i / n); p.x += (rnd(s + i) - 0.5) * amp; p.z += (rnd(s + i * 7.3) - 0.5) * amp; pts.push(p); } pts.push(b.clone()); return pts; };
    const add = (pts, r) => { for (let i = 0; i < pts.length - 1; i++) { const c = new THREE.LineCurve3(pts[i], pts[i + 1]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 1, r, 5), mat)); g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 1, r * 3.5, 5), glowMat)); } };
    const main = path(from, to, nseg, amp, seed); add(main, radius);
    for (let b = 0; b < branches; b++) { const i = 2 + Math.floor(rnd(seed + b * 3.1) * (nseg - 6)); const a = main[i]; const e = a.clone().add(V((rnd(seed + b) - 0.5) * 3, -2 - rnd(seed + b * 2) * 3, (rnd(seed + b * 5) - 0.5) * 2)); add(path(a, e, 6, 0.6, seed + b * 11), radius * 0.5); }
  };
  return g;
}
function drawHeart(g, k, t) { // heart beating, then flat ECG
  g.save(); g.translate(256, 230);
  const beat = k < 0.5 ? 1 + 0.12 * Math.max(0, Math.sin(t * 9)) : 1;
  g.scale(beat, beat); g.fillStyle = k < 0.5 ? 'rgba(230,60,70,0.9)' : 'rgba(110,40,45,0.9)';
  g.beginPath(); g.moveTo(0, 60); g.bezierCurveTo(-120, -10, -70, -110, 0, -50); g.bezierCurveTo(70, -110, 120, -10, 0, 60); g.fill(); g.stroke(); g.restore();
  g.strokeStyle = k < 0.5 ? '#5dff8a' : '#ff4a4a'; g.lineWidth = 7; g.beginPath();
  for (let x = 40; x <= 472; x += 4) { const ph = (x / 60 - t * 3) % 1; const y = k < 0.5 && Math.abs(ph - 0.5) < 0.06 ? 360 - 60 * Math.sin((ph - 0.44) / 0.12 * Math.PI) : 360; x === 40 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
}
function drawFern(g, k) { // Lichtenberg figure on skin
  g.fillStyle = 'rgba(214,160,128,1)'; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = 'rgba(176,40,48,0.9)'; g.lineCap = 'round';
  const br = (x, y, a, len, w, d) => { if (d > 7 || len < 6) return; const x2 = x + Math.cos(a) * len * k, y2 = y + Math.sin(a) * len * k; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    br(x2, y2, a - 0.45, len * 0.72, w * 0.7, d + 1); br(x2, y2, a + 0.4, len * 0.68, w * 0.7, d + 1); };
  br(256, 470, -Math.PI / 2, 120, 16, 0); br(150, 480, -Math.PI / 2 - 0.5, 90, 11, 1); br(360, 480, -Math.PI / 2 + 0.5, 90, 11, 1);
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 6, sunDir: [-3, 6, 4] }), 'approaching_storm', { height: 5, radius: 70, sun: 0.5, sunColor: 0xc8d4ff, env: 0.45 });
  const key = scene.userData.key;
  const flash = new THREE.PointLight(0xcfe0ff, 0, 30, 1.2); flash.position.set(0.3, 5, 0.5); scene.add(flash);
  const hero = person('hero'); scene.add(hero.root);
  const B = bolt(); scene.add(B); const arcs = bolt(0.012, 1); scene.add(arcs);
  const boots = prop('rubber_boots', 0.45); scene.add(boots);
  const smoke = stream(300, 0x8c8c8c, 0.22); smoke.material.opacity = 0.35; scene.add(smoke);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.45, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffb030, toneMapped: false })); scene.add(sun);
  const people = []; for (let i = 0; i < 10; i++) { const gh = ghost(hero.root, i === 9 ? 0xff5050 : 0x60ff90); scene.add(gh); people.push(gh); }
  const xr = xray(0.5); scene.add(xr);
  const L = { volts: label('300,000,000 VOLTS', 1.2), hot: label('30,000°C', 0.9), sunL: label('SUN SURFACE 5,500°C', 1.1), skin: label('CURRENT OVER SKIN', 1.1), shoes: label('SHOES BLOWN OFF', 1.0), heart: label('HEART STOPS', 0.9), fern: label('LICHTENBERG FIGURE', 1.1), surv: label('90% SURVIVE', 2.0) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 500);
  const KEYS = [[0, [2.6, 1.5, 7.0], [0, 1.6, 0]], [2.0, [2.0, 1.4, 5.2], [0, 1.4, 0]], [3.4, [1.4, 1.3, 4.2], [0, 1.6, 0]], [7.4, [1.4, 1.3, 4.2], [0, 1.6, 0]],
    [8.2, [2.6, 1.6, 5.6], [0.9, 1.5, 0]], [10.6, [2.6, 1.6, 5.6], [0.9, 1.5, 0]], [11.4, [0.9, 1.25, 3.4], [0, 1.0, 0]], [16.9, [0.9, 1.25, 3.4], [0, 0.9, 0]],
    [17.6, [0.8, 1.6, 2.6], [0, 1.25, 0]], [19.0, [0.8, 1.6, 2.6], [0, 1.2, 0]], [19.6, [1.4, 1.9, 2.8], [0, 0.4, 0.2]], [22.0, [1.4, 1.9, 2.8], [0, 0.4, 0.2]],
    [23.4, [2.2, 1.9, 8.6], [-0.2, 0.9, -1.0]], [28.6, [2.0, 1.8, 8.0], [-0.2, 0.9, -1.0]]];
  let lastSeed = -1;
  return {
    scene, camera: cam,
    update(t) {
      // ---- hero: walks in, struck at 1.9, collapses at 17.8 (heart), lies, gets up at 24 ----
      const walk = 1 - sm(1.6, 1.9, t), down = sm(17.8, 18.8, t) * (1 - sm(24.0, 25.2, t)), jolt = Math.max(0, 1 - Math.abs(t - 2.0) / 0.4);
      hero.update(t, { idle: 1 - walk, walk }, 1, { armsUp: 0.8 * jolt + 0.15 * sm(11.0, 11.5, t) * (1 - sm(16.6, 17.0, t)), leanBack: 0.6 * jolt, handsChest: sm(17.4, 17.7, t) * (1 - down) });
      hero.root.position.set(0, 0, lerp(1.6, 0, sm(0, 1.9, t)) + 0.0);
      hero.root.position.y = 0.25 * down * 0.4; hero.root.rotation.set(-Math.PI / 2 * down, 0.4 * Math.sin(jolt * 20) * jolt, 0);
      // ---- bolt flicker: strike 1.9-2.4, again 3.6-4.6 (volts) and 7.6-8.4 (heat) ----
      const on = (t > 1.9 && t < 2.45) || (t > 3.6 && t < 4.7) || (t > 7.6 && t < 8.5);
      const seed = Math.floor(t * 12);
      if (on && seed !== lastSeed) { B.regen(seed, V(0.6, 18, -1.2), hero.headPos().clone().add(V(0, 0.15, 0))); lastSeed = seed; }
      B.visible = on && (seed % 4 !== 3);
      flash.intensity = B.visible ? 400 : 0; key.intensity = B.visible ? 3.5 : 0.7;
      // body arcs while the current races over the skin
      const arcOn = t > 11.6 && t < 14.4 && (Math.floor(t * 15) % 2 === 0);
      if (arcOn) { const n = ['Head', 'LeftHand', 'RightHand', 'LeftFoot', 'RightFoot', 'Spine2']; const s2 = Math.floor(t * 15); arcs.regen(s2, hero.world(n[s2 % 6]), hero.world(n[(s2 + 3) % 6]), 0.12, 9); }
      arcs.visible = arcOn;
      // shoes fly off at 15.9
      const sk = Math.max(0, t - 15.85); boots.visible = t > 15.8 && t < 19;
      boots.position.set(0.1 + sk * 1.4, Math.max(0.05, 0.1 + sk * 3.2 - 4.9 * sk * sk), 0.2 + sk * 0.9); boots.rotation.set(sk * 9, sk * 4, 0);
      sun.visible = t > 8.4 && t < 10.7; sun.position.set(1.5, 2.2, -0.6); sun.scale.setScalar(sm(8.4, 8.8, t));
      // 10 people, 9 survive
      people.forEach((p, i) => { const k = sm(24.0 + i * 0.12, 24.3 + i * 0.12, t); p.fade(k * 0.9); p.position.set(-2.4 + (i % 5) * 1.1 - (i > 4 ? 0.55 : 0), 0, -1.2 - (i > 4 ? 1.4 : 0)); p.rotation.y = 0.1; });
      const k = keyCam(KEYS, t); const sh = B.visible ? 0.03 : 0; cam.position.copy(k.pos).add(V(rnd(t) * sh, rnd(t + 3) * sh, 0)); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos(), chest = hero.world('Spine2');
      smoke.update(chest, V(0, 1, 0), 13.9, 17.0, t, 0.8, 0.8);
      const x1 = sm(17.6, 17.9, t) * (1 - sm(19.0, 19.3, t)), x2 = sm(19.5, 19.8, t) * (1 - sm(21.9, 22.2, t));
      if (x1 > 0.01) xr.show(chest.clone().add(V(0.35, 0.35, 0.2)), x1, drawHeart, sm(18.15, 18.3, t), t);
      else if (x2 > 0.01) xr.show(hero.world('RightArm').clone().add(V(0.3, 0.5, 0.2)), x2, drawFern, sm(19.6, 21.0, t), t);
      else xr.visible = false;
      const up = (y) => V(0, y, 0);
      showLabel(L.volts, head.clone().add(up(0.45)), t, 5.1, 7.4);
      showLabel(L.hot, V(0.2, 2.6, 0), t, 8.3, 10.7);
      showLabel(L.sunL, sun.position.clone().add(up(0.75)), t, 9.3, 10.7);
      showLabel(L.skin, head.clone().add(up(0.35)), t, 12.1, 14.1);
      showLabel(L.shoes, V(0.6, 1.1, 0.4), t, 16.0, 17.3);
      showLabel(L.heart, chest.clone().add(V(-0.25, 0.55, 0)), t, 18.2, 19.1);
      showLabel(L.fern, V(0.3, 1.25, 0.3), t, 19.7, 22.0);
      showLabel(L.surv, V(-0.2, 2.35, -1.6), t, 25.0, 28.6);
      return { bloom: B.visible ? 1.4 : 0.35, exposure: B.visible ? 1.15 : 0.62 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
