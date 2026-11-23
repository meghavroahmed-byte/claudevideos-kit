import * as THREE from 'three';
import { labelCam, loadKit, world, prop, texMat, person, label, showLabel, xray, keyCam, stream, waterMat, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 26.0;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['quiver_tree_01', 'namaqualand_boulder_04', 'brass_pan_01'], hdris: ['goegap'], tex: ['sand_01'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawThermo(g, k) { // thermometer rising to 70°C
  g.fillStyle = 'rgba(210,230,255,0.95)'; g.beginPath(); g.roundRect(226, 60, 60, 330, 30); g.fill(); g.beginPath(); g.arc(256, 410, 55, 0, 6.283); g.fill();
  g.fillStyle = '#ff3b30'; const h = 300 * k; g.beginPath(); g.roundRect(240, 380 - h, 32, h + 20, 16); g.fill(); g.beginPath(); g.arc(256, 410, 42, 0, 6.283); g.fill();
  g.fillStyle = '#ffd24a'; g.font = '900 56px Cap, sans-serif'; g.textAlign = 'left'; g.fillText(`${Math.round(70 * k)}°C`, 300, 120 + 260 * (1 - k));
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 9, sunDir: [-2, 10, 2] }), 'goegap', { height: 3, radius: 80, sun: 3.0, sunColor: 0xfff0d0, env: 1.0 });
  const key = scene.userData.key;
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 120, 120), texMat('sand_01', 60, 60, { color: 0xf0d6a8 }));
  { const p = sand.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), d = Math.hypot(x, y); p.setZ(i, d > 6 ? (Math.sin(x * 0.18 + y * 0.06) * 1.4 + Math.sin(x * 0.05 - y * 0.11) * 2.2) * Math.min(1, (d - 6) / 10) : 0); } sand.geometry.computeVertexNormals(); }
  sand.rotation.x = -Math.PI / 2; sand.position.y = 0.01; sand.receiveShadow = true; scene.add(sand);
  const rock = prop('namaqualand_boulder_04', 1.6); rock.position.set(-3.9, 0, -3.4); scene.add(rock);
  const tree = prop('quiver_tree_01', 1.4); tree.position.set(3.2, 0, -3.2); scene.add(tree);
  const pan = prop('brass_pan_01', 2.2); pan.position.set(1.0, 0.0, 1.0); pan.rotation.y = -0.6; scene.add(pan);
  const egg = new THREE.Group(); { const w = new THREE.Mesh(new THREE.CircleGeometry(0.12, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })); w.rotation.x = -Math.PI / 2; const y = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffb020, roughness: 0.3 })); egg.add(w, y); } scene.add(egg);
  const mirage = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), waterMat(2.0, 0xd8f0ff)); mirage.material.transparent = true; mirage.material.opacity = 0.75; mirage.rotation.x = -Math.PI / 2; mirage.position.set(0, 0.06, -15); scene.add(mirage);
  const hero = person('hero'); scene.add(hero.root);
  const sweat = stream(160, 0x9fd8ff, 0.03); scene.add(sweat);
  const heat = stream(500, 0xffe8c0, 0.08); heat.material.opacity = 0.18; scene.add(heat);
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(Array.from({ length: 3000 }, (_, i) => { const k = Math.floor(i / 3), u = ((k * 0.618) % 1) * 0.9 + 0.08, th = k * 2.39996; return i % 3 === 0 ? 120 * Math.sqrt(1 - u * u) * Math.cos(th) : i % 3 === 1 ? 120 * u : 120 * Math.sqrt(1 - u * u) * Math.sin(th); })), 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true }));
  scene.add(stars);
  const xr = xray(0.5); scene.add(xr);
  const L = { deg: label('70°C SAND', 0.9), egg: label('FRIES AN EGG!', 0.9), liter: label('1 LITER / HOUR', 1.0), noon: label("DON'T WALK AT NOON", 1.2), shade: label('REST IN THE SHADE', 1.1), night: label('TRAVEL AT NIGHT', 1.1), mir: label('MIRAGE', 4.0), light: label('JUST BENDING LIGHT', 4.5) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 600);
  const KEYS = [[0, [2.0, 1.6, 6.4], [0, 1.2, 0]], [2.4, [1.6, 1.1, 3.4], [0.6, 0.4, 0.6]], [7.8, [1.6, 1.1, 3.4], [0.6, 0.4, 0.6]], [8.4, [0.5, 1.5, 3.0], [0, 1.2, 0]], [13.0, [0.5, 1.5, 3.0], [0, 1.2, 0]],
    [13.6, [0.6, 1.5, 4.2], [-0.6, 1.0, -0.6]], [18.6, [0.0, 1.5, 4.2], [-1.0, 0.9, -1.6]], [19.2, [0.6, 1.7, 4.0], [0, 1.0, -8]], [26.0, [0.6, 1.7, 3.6], [0, 0.9, -12]]];
  return {
    scene, camera: cam,
    update(t) {
      // day / night: night between 16.8 and 18.8
      const night = sm(16.6, 17.2, t) * (1 - sm(18.6, 19.2, t));
      key.intensity = lerp(3.0, 0.15, night); key.color.setRGB(lerp(1, 0.55, night), lerp(0.94, 0.65, night), lerp(0.82, 1, night)); scene.environmentIntensity = lerp(1.0, 0.12, night); if (scene.userData.gsky) scene.userData.gsky.material.color.setScalar(lerp(1, 0.06, night)); stars.material.opacity = night; stars.visible = night > 0.01;
      const shadeK = sm(15.4, 16.2, t) * (1 - sm(16.6, 17.0, t)), walkN = t > 17.0 && t < 18.8 ? 1 : 0, wipe = sm(8.4, 8.8, t) * (1 - sm(11.8, 12.4, t));
      hero.update(t, { idle: 1 - walkN, walk: walkN }, 1, { facepalm: 0.8 * wipe, slump: 0.4 * sm(3.0, 4.0, t) * (1 - sm(15.0, 15.6, t)), crouch: 0.7 * shadeK, lean: 0.25 * sm(20.6, 21.0, t), point: 0.8 * sm(20.6, 21.0, t), handsHead: 0.6 * sm(13.4, 13.8, t) * (1 - sm(15.0, 15.4, t)) });
      const pos = t < 15.4 ? V(0, 0, 0) : t < 17.0 ? V(-2.3, 0, -1.8).lerp(V(0, 0, 0), 1 - sm(15.4, 16.0, t)) : V(lerp(-2.3, 0.6, sm(17.0, 18.8, t)), 0, lerp(-1.8, -1.0, sm(17.0, 18.8, t)));
      hero.root.position.copy(pos); hero.root.rotation.y = t > 19.0 ? Math.PI : t > 17.0 ? Math.PI / 2 : t > 15.4 ? 0.5 : 0.2;
      egg.visible = t > 5.8 && t < 8.4; egg.position.set(1.0, 0.03, 1.0); egg.scale.setScalar(sm(5.9, 6.2, t));
      mirage.visible = t > 19.4; mirage.material.uniforms.time.value = t;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos();
      sweat.update(head.clone().add(V(0, 0.05, 0.1)), V(0, -1, 0.1), 8.6, 12.6, t, 0.8, 0.35);
      heat.update(V(0, 0.05, -4), V(0, 1, 0), 2.4, 16.4, t, 0.8, 12);
      const xk = sm(3.4, 3.7, t) * (1 - sm(5.6, 5.9, t));
      if (xk > 0.01) xr.show(V(-0.6, 1.0, 1.0), xk, drawThermo, sm(3.6, 5.2, t), t); else xr.visible = false;
      const up = (y) => V(0, y, 0);
      showLabel(L.deg, V(-0.6, 1.5, 1.0), t, 3.8, 5.8); showLabel(L.egg, V(1.0, 0.6, 1.0), t, 6.2, 7.8);
      showLabel(L.liter, head.clone().add(up(0.38)), t, 8.8, 13.0); showLabel(L.noon, head.clone().add(up(0.4)), t, 13.5, 15.3);
      showLabel(L.shade, V(-2.3, 2.0, -1.8), t, 15.6, 16.6); showLabel(L.night, head.clone().add(up(0.45)), t, 16.8, 18.6);
      showLabel(L.mir, V(0, 2.4, -15), t, 19.6, 22.2); showLabel(L.light, V(0, 2.4, -15), t, 22.3, 26.0);
      return { bloom: 0.3, exposure: lerp(1.0, 0.75, night) };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
