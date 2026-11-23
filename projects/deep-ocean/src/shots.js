import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, creature, texMat, person, label, showLabel, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 28.4;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/jellyfish', 'sf/african_elephant', 'namaqualand_boulder_02'], hdris: ['kloofendal_48d_partly_cloudy_puresky'], tex: ['sand_01'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [0, 10, 2] }), 'kloofendal_48d_partly_cloudy_puresky', { sky: false, sun: 2.2, sunColor: 0xbfe8ff, env: 0.6 });
  const key = scene.userData.key; const hemi = scene.children.find(o => o.isHemisphereLight);
  scene.fog = new THREE.FogExp2(0x1b6f9a, 0.08);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 48), texMat('sand_01', 10, 10, { color: 0x8a9aa0 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const rocks = []; for (const [x, z, s] of [[-2.2, -2.5, 1.2], [2.6, -3.4, 1.5], [-3.6, -6, 2]]) { const r = prop('namaqualand_boulder_02', s); r.position.set(x, 0, z); scene.add(r); rocks.push(r); }
  const hero = person('hero'); scene.add(hero.root);
  const head = new THREE.PointLight(0xffffff, 0, 6, 1.6); scene.add(head);
  const jellies = []; for (let i = 0; i < 6; i++) { const j = creature('sf/jellyfish', 0.5 + (i % 3) * 0.15, 'max'); j.root.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.emissive = new THREE.Color(i % 2 ? 0x40e0ff : 0xff60e0); m.material.emissiveIntensity = 1.6; m.material.transparent = true; m.material.opacity = 0.85; } }); scene.add(j.root); jellies.push(j); }
  const glowDots = stream(260, 0x60f0ff, 0.05); glowDots.material.blending = THREE.AdditiveBlending; scene.add(glowDots);
  const ele = creature('sf/african_elephant', 0.55, 'y'); ghost(ele.root, 0xbfe6ff, { inPlace: true }); ele.root.traverse(m => { if (m.isMesh) m.material.blending = THREE.NormalBlending; }); scene.add(ele.root);
  const flat = ghost(hero.root, 0xff8080); scene.add(flat);
  const snow = stream(1200, 0xdfeeff, 0.025); scene.add(snow);
  const bubbles = stream(120, 0xffffff, 0.04); scene.add(bubbles);
  const L = { d10: label('10 M', 0.8), x2: label('2× PRESSURE', 1.0), d200: label('200 M', 0.8), dark: label('NO SUNLIGHT', 0.9), d1000: label('1,000 M', 0.9), glow: label('GLOWING CREATURES', 1.2), d4000: label('4,000 M', 0.9), ele: label('ELEPHANT ON YOUR THUMB', 1.4), d11: label('11 KM DOWN', 1.0), crush: label('CRUSHED FLAT', 1.0) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.8, 1.6, 4.4], [0, 1.4, 0]], [2.6, [0.6, 1.5, 3.6], [0, 1.3, 0]], [16.6, [0.6, 1.5, 3.6], [0, 1.3, 0]], [17.4, [1.4, 1.8, 4.2], [-0.2, 1.4, 0]], [21.4, [1.4, 1.8, 4.2], [-0.2, 1.4, 0]], [22.4, [1.0, 2.0, 4.6], [0, 0.8, -0.5]], [28.4, [1.0, 2.0, 4.6], [0, 0.8, -0.5]]];
  const colors = [[0, 0x3aa6d8, 0.05, 2.2], [7.9, 0x1d6f9e, 0.07, 1.4], [12.5, 0x06243a, 0.11, 0.25], [16.5, 0x020a14, 0.13, 0.05], [28.4, 0x010408, 0.13, 0.03]];
  return {
    scene, camera: cam,
    update(t) {
      // water colour / light by depth
      let i = 0; while (i < colors.length - 2 && colors[i + 1][0] < t) i++; const a = colors[i], b = colors[i + 1]; const u = sm(a[0], b[0], t);
      const c = new THREE.Color(a[1]).lerp(new THREE.Color(b[1]), u); scene.fog.color.copy(c); scene.background = c; scene.fog.density = lerp(a[2], b[2], u); key.intensity = lerp(a[3], b[3], u); hemi.intensity = 0.25 * lerp(a[3], b[3], u) / 2.2;
      scene.environmentIntensity = 0.6 * Math.max(0.08, lerp(a[3], b[3], u) / 2.2);
      const floorVis = t > 21.6; floor.visible = floorVis; rocks.forEach(r => r.visible = floorVis); scene.children.forEach(o => { if (o.material && o.material.isShadowMaterial) o.visible = floorVis; });
      // hero swims down (floats); at the bottom he stands on the sea floor
      const squeeze = sm(4.8, 5.4, t) * (1 - sm(7.0, 7.6, t));
      hero.update(t, { idle: 1 }, 0.5, { handsChest: 0.6 * squeeze, lookUp: 0.3 * sm(9.4, 10.2, t) * (1 - sm(12.4, 13.0, t)), spread: 0.65 * sm(18.2, 18.6, t) * (1 - sm(21.0, 21.4, t)) });
      hero.root.position.set(0, (t < 21.6 ? 0.8 + 0.1 * Math.sin(t * 0.9) : 0), 0); hero.root.rotation.set(0.15 * (t < 21.6 ? 1 : 0), 0.1, 0);
      head.intensity = t > 12.0 ? 3 * sm(12.0, 12.6, t) : 0; head.position.copy(hero.headPos ? hero.headPos() : V()).add(V(0.2, 0.2, 0.5));
      jellies.forEach((j, n) => { const v = t > 13.4 && t < 17.4; j.root.visible = v; if (!v) return; j.play(t, 0, 1); j.root.position.set(-1.6 + n * 0.65, 0.8 + (n % 3) * 0.7 + Math.sin(t + n) * 0.15, -1.2 - (n % 2) * 1.2); });
      const ek = sm(17.6, 18.1, t) * (1 - sm(21.2, 21.6, t)); ele.root.fade(0.75 * ek); ele.play(t, '01_Idle', 1);
      const fk = sm(25.0, 25.3, t) * (1 - sm(27.6, 28.0, t)); flat.fade(0.8 * fk); flat.position.set(0.85, 0, -0.3); flat.scale.set(1.2, Math.max(0.05, 1 - 0.95 * sm(25.2, 25.6, t)), 1.2);
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const hh = hero.headPos(), thumb = hero.world('RightHand');
      ele.root.position.copy(thumb).add(V(0.35, 0.02, 0.15)); ele.root.rotation.y = -0.6;
      snow.update(V(0, -3, 0), V(0, 1, 0), 0, 21.6, t, 4.5, 6);
      bubbles.update(hh.clone().add(V(0, 0, 0.12)), V(0, 1, 0), 0.5, 21.0, t, 1.0, 0.3);
      glowDots.update(V(0, 0, -1.5), V(0, 0.3, 0), 13.4, 17.4, t, 0.5, 4.0);
      const up = (y) => V(0, y, 0);
      showLabel(L.d10, hh.clone().add(V(-0.1, 0.45, 0)), t, 2.8, 4.6); showLabel(L.x2, hh.clone().add(V(-0.1, 0.45, 0)), t, 4.7, 7.6);
      showLabel(L.d200, hh.clone().add(V(-0.1, 0.45, 0)), t, 7.9, 9.4); showLabel(L.dark, hh.clone().add(V(-0.1, 0.45, 0)), t, 9.5, 12.6);
      showLabel(L.d1000, hh.clone().add(V(-0.1, 0.45, 0)), t, 13.1, 14.6); showLabel(L.glow, V(0, 2.9, -1.2), t, 14.7, 17.2);
      showLabel(L.d4000, hh.clone().add(V(-0.1, 0.45, 0)), t, 17.1, 18.6); showLabel(L.ele, hh.clone().add(V(0, 0.62, 0)), t, 18.7, 21.5);
      showLabel(L.d11, hh.clone().add(V(-0.1, 0.45, 0)), t, 22.6, 24.9); showLabel(L.crush, V(0.85, 1.0, -0.3), t, 25.1, 28.4);
      return { bloom: 0.45, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
