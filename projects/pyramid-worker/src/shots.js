import * as THREE from 'three';
import { labelCam, loadKit, world, prop, texMat, person, label, showLabel, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 28.9;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['antique_ceramic_vase_01', 'jug_01', 'wooden_bucket_01', 'cross_pein_hammer', 'hamburger_buns'], hdris: ['kloofendal_48d_partly_cloudy_puresky'], tex: ['sand_01', 'sandstone_cracks', 'rough_wood', 'beige_wall_001'], people: ['hero', 'manuel', 'eric'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;

function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 12, sunDir: [-6, 8, 5] }), 'kloofendal_48d_partly_cloudy_puresky', { sky: false, sun: 2.6, sunColor: 0xfff0d0, env: 0.8 });
  const key = scene.userData.key;
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), texMat('sand_01', 120, 120, { color: 0xe8d2a8 })); sand.rotation.x = -Math.PI / 2; sand.receiveShadow = true; scene.add(sand);
  // pyramid under construction: stepped courses of limestone with the top missing
  const pyr = new THREE.Group(); for (let i = 0; i < 10; i++) { const w = 150 - i * 13; const c = new THREE.Mesh(new THREE.BoxGeometry(w, 7.5, w), texMat('sandstone_cracks', w / 6, 1.2, { color: 0xf0e2c4 })); c.position.y = 3.75 + i * 7.5; c.castShadow = c.receiveShadow = true; pyr.add(c); }
  pyr.position.set(-40, 0, -230); pyr.rotation.y = 0.5; scene.add(pyr);
  // workers' village: small mud-brick houses
  const mud = texMat('beige_wall_001', 1, 1, { color: 0xc9a87c });
  const village = new THREE.Group(); for (let i = 0; i < 9; i++) { const h = new THREE.Mesh(new THREE.BoxGeometry(3 + (i % 3), 2.4, 3), mud); h.position.set(14 + (i % 3) * 5, 1.2, -18 - Math.floor(i / 3) * 5); h.rotation.y = (i % 2) * 0.1; h.castShadow = h.receiveShadow = true; village.add(h); } scene.add(village);
  // limestone block on a wooden sled
  const block = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.8), texMat('sandstone_cracks', 1, 1, { color: 0xf4ead2 })); block.castShadow = block.receiveShadow = true;
  const sled = new THREE.Group(); const wood = texMat('rough_wood', 1, 1);
  for (const x of [-0.5, 0.5]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 2.4), wood); r.position.set(x, 0.09, 0); r.castShadow = true; sled.add(r); }
  for (const z of [-0.8, 0, 0.8]) { const r = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.2), wood); r.position.set(0, 0.22, z); sled.add(r); }
  block.position.y = 0.76; sled.add(block); scene.add(sled);
  const ropes = new THREE.Group(); for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1, 6), new THREE.MeshStandardMaterial({ color: 0x8a6a40 })); ropes.add(r); } scene.add(ropes);
  const hammer = prop('cross_pein_hammer', 2.2); hammer.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(0xd08850); m.material.metalness = 0.9; m.material.roughness = 0.35; } }); scene.add(hammer);
  const chips = stream(120, 0xf4ead2, 0.05); scene.add(chips);
  const water = stream(200, 0x5fb0ff, 0.05); scene.add(water);
  const jug = prop('jug_01', 1.6); scene.add(jug);
  const bread = prop('hamburger_buns', 2.0); scene.add(bread);
  const jars = []; for (let i = 0; i < 12; i++) { const j = prop('antique_ceramic_vase_01', 1.0); j.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.map = null; m.material.color.set(0xb0683a); m.material.roughness = 0.85; } }); scene.add(j); jars.push(j); }
  const hero = person('hero'); scene.add(hero.root);
  // ghost workers from the past (golden holograms)
  const kinds = ['manuel', 'eric']; const workers = [];
  for (let i = 0; i < 20; i++) { const w = person(kinds[i % 2], { print: false }); ghost(w.root, 0xbfe6ff, { inPlace: true }); w.root.traverse(m => { if (m.isMesh) m.material.blending = THREE.NormalBlending; }); scene.add(w.root); workers.push(w); }
  const L = { slaves: label('NOT SLAVES', 0.9), paid: label('PAID WORKERS', 1.0), vill: label("WORKERS' VILLAGE", 2.4), sun: label('SUNRISE', 0.8), team: label('TEAMS OF ~20', 1.0), copper: label('COPPER TOOLS', 0.9), lime: label('LIMESTONE', 0.8), tons: label('2+ TONS', 0.8), sledL: label('WOODEN SLED', 0.9), waterL: label('WATER = LESS FRICTION', 1.3), breadL: label('BREAD', 0.7), beerL: label('BEER', 0.7), lots: label('LOTS OF BEER!', 1.0) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 2000);
  const KEYS = [[0, [3.5, 2.2, 9.5], [-1, 5.0, -10]], [3.2, [2.2, 1.6, 6.0], [0, 1.2, 0]], [4.8, [2.2, 1.6, 6.0], [0, 1.2, 0]], [5.8, [-2.0, 2.6, 7.0], [10, 1.8, -14]], [8.6, [-2.0, 2.6, 7.0], [10, 1.8, -14]],
    [9.6, [4.0, 3.4, 11.0], [0, 1.0, -2]], [12.8, [4.0, 3.4, 11.0], [0, 1.0, -2]], [13.6, [1.9, 1.6, 4.0], [0.6, 1.0, 0]], [18.6, [1.9, 1.6, 4.0], [0.6, 1.0, 0]],
    [19.6, [4.6, 2.4, 7.2], [0.6, 0.8, -1.4]], [24.0, [4.6, 2.4, 7.2], [1.2, 0.8, -1.4]], [24.8, [1.3, 1.5, 3.6], [0.4, 1.0, 0]], [28.9, [1.3, 1.5, 3.6], [0.4, 1.0, 0]]];
  return {
    scene, camera: cam,
    update(t) {
      // sunrise light during "woke up at sunrise"
      const sr = sm(9.4, 10.0, t) * (1 - sm(12.6, 13.4, t)); key.color.setRGB(1, lerp(0.94, 0.62, sr), lerp(0.82, 0.38, sr)); key.intensity = lerp(2.6, 1.6, sr);
      key.position.set(lerp(-6, -12, sr), lerp(8, 2.5, sr), 5);
      // sled moves when dragged (19.4 - 24)
      const drag = sm(19.6, 23.8, t); const sx = lerp(0, 2.4, drag);
      sled.position.set(sx, 0, -1.4); sled.rotation.y = Math.PI / 2;
      // workers: idle team in a grid (teams of 20), then 8 pull the sled ropes, 1 pours water, 2 cut stone
      const vis = sm(0.0, 0.3, t);
      workers.forEach((w, i) => {
        let pos, ry = 0, pose = {}, wts = { idle: 1 };
        if (t > 19.0 && t < 24.4 && i < 8) { const row = i % 2, n = Math.floor(i / 2); pos = V(sx + 1.9 + n * 0.8, 0, -1.4 + (row ? 0.45 : -0.45)); ry = Math.PI / 2; pose = { lean: 0.7, point: 0.6, pointL: 0.6 }; wts = { walk: 1 }; }
        else if (t > 12.8 && t < 19.0 && i < 2) { pos = V(-0.9 + i * 0.1, 0, -1.4 + (i ? 1.2 : -1.2)); ry = i ? Math.PI : 0; pose = { lean: 0.5, point: Math.abs(Math.sin(t * 4 + i)) }; }
        else { const r = Math.floor(i / 5), c = i % 5; pos = V(-3.4 + c * 1.0, 0, -3.2 - r * 1.0); ry = 0.2; }
        w.update(t + i * 0.37, wts, 1, pose); w.root.position.copy(pos); w.root.rotation.y = ry;
        const k = vis * ((t > 9.8 && t < 12.9) || (t > 19.0 && t < 24.4 && i < 8) || (t > 12.8 && t < 19.0 && i < 2) || t < 3.4 ? 1 : 0.0);
        w.root.fade(0.7 * k);
      });
      hero.update(t, { idle: 1 }, 1, { point: sm(5.8, 6.2, t) * (1 - sm(8.2, 8.6, t)) + sm(25.0, 25.3, t) * (1 - sm(26.6, 27.0, t)) });
      hero.root.position.set(0.9, 0, 0.8); hero.root.rotation.y = -0.3;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      // copper chisel/hammer striking the block
      hammer.visible = t > 13.4 && t < 19.0; const hit = Math.abs(Math.sin(t * 4));
      hammer.position.set(sx - 0.45, 1.5 + 0.25 * hit, -1.4 + 0.2); hammer.rotation.set(0, 0, -0.6 + 0.8 * hit);
      chips.update(V(sx - 0.5, 1.25, -1.2), V(-0.4, 0.6, 0.3), 14.7, 18.6, t, 1.0, 0.6);
      // water poured in front of the sled
      jug.visible = t > 21.2 && t < 24.0; jug.position.set(sx + 1.4, 0.9, -0.5); jug.rotation.z = 1.4;
      water.update(V(sx + 1.3, 0.85, -0.5), V(0, -1, 0), 21.5, 23.8, t, 1.4, 0.15);
      // ropes from sled to the pullers
      ropes.children.forEach((r, i) => { const vis2 = t > 19.0 && t < 24.4; r.visible = vis2; if (!vis2) return; const a = V(sx + 1.1, 0.4, -1.4 + (i % 2 ? 0.2 : -0.2)), b = V(sx + 1.9 + 3.2, 1.0, -1.4 + (i % 2 ? 0.45 : -0.45)); r.position.copy(a).lerp(b, 0.5); r.scale.y = a.distanceTo(b); r.lookAt(b); r.rotateX(Math.PI / 2); });
      // pay: bread + jars of beer appear
      bread.visible = t > 25.6; bread.position.set(0.2, 0.0, 1.2); bread.scale.setScalar(2.0 * sm(25.6, 25.9, t));
      jars.forEach((j, i) => { const kk = sm(26.3 + i * 0.12, 26.5 + i * 0.12, t); j.visible = kk > 0.01; j.scale.setScalar(1.0 * kk); j.position.set(0.5 + (i % 6) * 0.2, 0, 1.0 + Math.floor(i / 6) * 0.25); });
      const head = hero.headPos(); const up = (y) => V(0, y, 0);
      showLabel(L.slaves, head.clone().add(up(0.42)), t, 3.6, 4.9); showLabel(L.paid, head.clone().add(up(0.42)), t, 5.0, 6.4); showLabel(L.vill, V(19, 5.5, -23), t, 6.6, 8.8);
      showLabel(L.sun, V(-2, 4.5, -4), t, 9.8, 11.0); showLabel(L.team, V(-1.4, 2.8, -4), t, 11.1, 12.9);
      showLabel(L.copper, V(sx - 0.3, 2.3, -1.2), t, 13.8, 15.5); showLabel(L.lime, V(sx, 2.0, -1.2), t, 15.6, 16.8); showLabel(L.tons, V(sx, 2.0, -1.2), t, 16.9, 18.6);
      showLabel(L.sledL, V(sx, 2.2, -1.4), t, 20.2, 21.4); showLabel(L.waterL, V(sx + 1.2, 2.2, -0.8), t, 21.6, 24.0);
      showLabel(L.breadL, V(0, 0.75, 1.4), t, 25.8, 26.4); showLabel(L.beerL, V(1.0, 0.95, 1.1), t, 26.4, 27.0); showLabel(L.lots, head.clone().add(V(0.2, 0.45, 0)), t, 27.0, 28.9);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
