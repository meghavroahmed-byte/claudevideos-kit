import * as THREE from 'three';
import { labelCam, loadKit, prop, fit, person, label, showLabel, xray, ghost, keyCam, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 28.0;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/earth', 'sf/space_station', 'sf/astronaut'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;

// simple particle stream: emits from origin along dir between t0..t1
function stream(n, color, size) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.85, depthWrite: false, sizeAttenuation: true }));
  const seed = Array.from({ length: n }, (_, i) => [Math.sin(i * 12.9898) * 43758.5453 % 1, Math.sin(i * 78.233) * 12543.31 % 1, Math.sin(i * 39.425) * 9631.7 % 1].map(Math.abs));
  p.update = (o, dir, t0, t1, t, speed = 1.2, spread = 0.25) => {
    const a = g.attributes.position.array; let vis = false;
    for (let i = 0; i < n; i++) {
      const born = t0 + (t1 - t0) * seed[i][0]; const age = t - born;
      if (age < 0 || age > 1.2) { a[i * 3 + 1] = -999; continue; } vis = true;
      a[i * 3] = o.x + dir.x * age * speed + (seed[i][1] - 0.5) * spread * age; a[i * 3 + 1] = o.y + dir.y * age * speed + (seed[i][2] - 0.5) * spread * age; a[i * 3 + 2] = o.z + dir.z * age * speed + (seed[i][0] - 0.5) * spread * age;
    }
    g.attributes.position.needsUpdate = true; p.visible = vis; p.frustumCulled = false;
  };
  return p;
}
function drawLungs(g, k) {
  g.save(); g.translate(256, 270);
  const s = 1 - 0.45 * k;
  g.beginPath(); g.moveTo(0, -170); g.lineTo(0, -60); g.moveTo(0, -60); g.lineTo(-40, -20); g.moveTo(0, -60); g.lineTo(40, -20); g.stroke();
  for (const sx of [-1, 1]) { g.save(); g.translate(sx * 85, 30); g.scale(s, s); g.fillStyle = 'rgba(255,140,150,0.75)'; g.beginPath(); g.ellipse(0, 0, 70, 120, sx * 0.15, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore(); }
  g.strokeStyle = '#ffffff'; g.lineWidth = 8;
  for (let i = 0; i < 3; i++) { const y = -110 - ((k * 300 + i * 50) % 120); g.globalAlpha = k > 0.02 ? 0.9 : 0; g.beginPath(); g.moveTo(-14 + i * 14, y + 30); g.lineTo(-14 + i * 14, y); g.lineTo(-24 + i * 14, y + 12); g.moveTo(-14 + i * 14, y); g.lineTo(-4 + i * 14, y + 12); g.stroke(); }
  g.restore();
}
function build({ makeStage }) {
  const scene = makeStage({ shadowSize: 4, sunDir: [6, 3, 4], sun: 3.2 });
  scene.userData.sky.visible = false; scene.background = new THREE.Color(0x000005);
  scene.children.filter(o => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry').forEach(o => o.visible = false);
  scene.children.find(o => o.isHemisphereLight).intensity = 0.12; scene.environmentIntensity = 0.25;
  // stars
  { const n = 2500, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, th = Math.random() * 6.283, r = 150; a[i * 3] = r * Math.sqrt(1 - u * u) * Math.cos(th); a[i * 3 + 1] = r * u; a[i * 3 + 2] = r * Math.sqrt(1 - u * u) * Math.sin(th); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3)); scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, sizeAttenuation: true }))); }
  const earth = fit(prop('sf/earth'), 300, 'max', { ground: false }); earth.position.set(0, -170, -110); scene.add(earth);
  earth.traverse(m => { if (!m.isMesh) return; if (/atmos/i.test(m.name)) m.visible = false; else if (/cloud/i.test(m.name)) m.visible = false; else if (m.material.emissive) m.material.emissiveIntensity = 0.02; });
  const iss = fit(prop('sf/space_station'), 26, 'max', { ground: false }); iss.position.set(-9, 3, -22); iss.rotation.set(0.2, 0.7, 0.1); scene.add(iss);
  const astro = fit(prop('sf/astronaut'), 1.9, 'y'); scene.add(astro);
  const hero = person('hero'); scene.add(hero.root);
  const myth = ghost(hero.root, 0xffd0c0); scene.add(myth);
  const xr = xray(0.55); scene.add(xr);
  const air = stream(160, 0xe8f4ff, 0.035); scene.add(air);
  const boil = stream(90, 0xbfe6ff, 0.025); scene.add(boil);
  const L = { myth: label('MOVIE MYTH', 0.75), air: label('AIR RUSHES OUT', 0.85), hold: label("DON'T HOLD YOUR BREATH", 1.1), s10: label('10 SECONDS', 0.5), boil: label('WATER BOILS', 0.55), swell: label('SKIN SWELLS', 0.8), s15: label('15 SECONDS', 0.75), out: label('NO OXYGEN', 0.75), s90: label('90 SECONDS', 0.8), ok: label('SURVIVE', 0.7) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(38, 720 / 1280, 0.05, 2000);
  const KEYS = [[0, [1.2, 1.5, 6.0], [-0.6, 0.9, -1.5]], [2.8, [0.6, 1.2, 3.8], [0, 0.95, 0]], [5.5, [0.6, 1.2, 3.8], [0, 0.95, 0]],
    [6.4, [0.5, 1.4, 2.4], [0, 1.3, 0]], [10.2, [0.5, 1.4, 2.4], [0, 1.3, 0]], [11.2, [0.35, 1.55, 2.1], [0, 1.45, 0]], [15.0, [0.35, 1.55, 2.1], [0, 1.45, 0]],
    [16.0, [0.6, 1.2, 3.6], [0, 0.95, 0]], [21.0, [0.6, 1.2, 3.6], [0, 0.95, 0]], [23.0, [1.6, 1.4, 5.0], [0.5, 0.95, 0]], [28.0, [1.0, 1.6, 5.6], [-0.4, 1.0, -0.6]]];
  return {
    scene, camera: cam,
    update(t) {
      const out = sm(19.6, 20.6, t);
      const grab = sm(24.0, 25.0, t), tow = sm(25.6, 28.0, t);
      const swell = sm(15.4, 16.6, t) * (1 - 0.5 * tow);
      hero.update(t, { idle: 1 }, 0.6, { armsUp: 0.25 + 0.25 * out, slump: 0.6 * out, lookDown: 0.3 * out, flinch: sm(3.4, 3.7, t) * (1 - sm(4.6, 5.0, t)), handsThroat: sm(6.9, 7.2, t) * (1 - sm(9.8, 10.3, t)) * 0.8 });
      // floating drift (from the station on the left into the open)
      hero.root.position.set(lerp(-0.9, 0, sm(0, 2.6, t)) - 0.6 * tow, 0.05 * Math.sin(t * 0.8) + 0.1 * tow, -0.6 * tow);
      hero.root.rotation.set(0.04 * Math.sin(t * 0.5) + 0.25 * out, 0.15 * Math.sin(t * 0.3), 0.05 * Math.sin(t * 0.7) + 0.2 * out);
      hero.root.scale.set(1 + 0.16 * swell, 1 + 0.04 * swell, 1 + 0.16 * swell);
      // astronaut rescue
      astro.visible = t > 21.4;
      astro.position.set(lerp(3.2, 0.75, sm(21.6, 24.2, t)) - 0.6 * tow, 0.1 + 0.05 * Math.sin(t), lerp(-0.6, 0.15, sm(21.6, 24.2, t)) - 0.6 * tow); astro.rotation.set(0, -1.2 + 0.2 * grab, 0.05 * Math.sin(t * 0.6));
      earth.rotation.y = t * 0.01;
      // movie myth: ghost balloons and pops
      const mk = sm(3.3, 3.6, t) * (1 - sm(4.4, 4.7, t)); myth.fade(mk * 0.9); myth.position.copy(hero.root.position).add(V(0.0, 0, -0.05)); myth.rotation.copy(hero.root.rotation);
      myth.scale.setScalar(lerp(1, 1.8, sm(3.4, 4.4, t)));
      // camera
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos(); const chest = hero.world('Spine2');
      const mouth = head.clone().add(V(0, -0.06, 0.1));
      air.update(mouth, V(0, 0.1, 1), 7.0, 8.4, t, 1.1, 0.5);
      boil.update(head.clone().add(V(0, 0.02, 0.11)), V(0, 0.6, 0.4), 13.2, 15.2, t, 0.5, 0.6);
      const xk = sm(6.4, 6.7, t) * (1 - sm(10.1, 10.4, t));
      if (xk > 0.01) xr.show(chest.clone().add(V(0, 0.02, 0.25)), xk, (g, kk) => drawLungs(g, kk), sm(7.0, 8.4, t), t); else xr.visible = false;
      const up = (y) => V(0, y, 0);
      showLabel(L.myth, head.clone().add(up(0.6)), t, 3.6, 4.9);
      showLabel(L.air, head.clone().add(up(0.32)), t, 7.1, 8.5);
      showLabel(L.hold, head.clone().add(up(0.32)), t, 8.6, 10.2);
      showLabel(L.s10, head.clone().add(up(0.22)), t, 11.0, 12.4);
      showLabel(L.boil, head.clone().add(up(0.22)), t, 13.9, 15.1);
      showLabel(L.swell, head.clone().add(up(0.35)), t, 15.5, 16.9);
      showLabel(L.s15, head.clone().add(up(0.35)), t, 18.0, 19.3);
      showLabel(L.out, head.clone().add(V(0.3, 0.35, 0)), t, 20.2, 21.4);
      showLabel(L.s90, head.clone().add(V(0.4, 0.45, 0)), t, 24.6, 25.9);
      showLabel(L.ok, head.clone().add(V(0.3, 0.45, 0)), t, 26.6, 28.0);
      return { bloom: 0.35, exposure: 1.0 - 0.3 * out * (1 - sm(23.5, 25.5, t)) };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
