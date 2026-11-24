import * as THREE from 'three';
import { grassTufts, labelCam, loadKit, world3d, prop, fit, creature, person, keyCam, texMat, canvasTex, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

// "What if dinosaurs never went extinct?" — fully 3D sets (no photo backgrounds), real 3D people and dinosaurs
export const DURATION = 31.7;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [[31.3, 31.6, 31.7, 31.71]];
export const PRELOAD = (r) => loadKit(r, {
  models: ['sf/trex_walk', 'sf/velociraptor', 'sf/sauropod', 'sf/armored_car', 'sf/taxi', 'sf/car_small', 'sf/car_abandoned', 'sf/mouse',
    'sf/nyc_dwellings', 'sf/office_tower', 'sf/london_tower', 'sf/city_block', 'sf/flatiron', 'sf/trees_realistic',
    'modular_chainlink_fence', 'concrete_road_barrier', 'flood_lights', 'street_lamp_01', 'fire_hydrant', 'shrub_02', 'shrub_03', 'shrub_04', 'dead_tree_trunk', 'grass_medium_01', 'painted_wooden_bench'],
  hdris: ['wide_street_01', 'hansaplatz'], tex: ['asphalt_02', 'concrete_wall_003', 'concrete_floor_02', 'forrest_ground_01'],
  people: ['carla', 'eric', 'sophia', 'manuel', 'claudia'],
});
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
const cam0 = () => new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 1500);
const ret = (b = 0.15, e = 1.0) => ({ bloom: b, exposure: e });
const DAY = { sunElev: 42, sunAz: 210, sun: 2.4, env: 0.75, fog: [0xd6e8f5, 120, 900] };
const NIGHT = { sunElev: 30, sunAz: 150, sun: 0.25, sunColor: 0x9fb8ff, env: 0.12, hemi: 0.06, skyTop: 0x02040a, skyMid: 0x0a1428, skyHorizon: 0x22304a, skyFloor: 0x101010, fog: [0x101826, 40, 400] };

// ---------- 3D set pieces ----------
function road(w, l, cross = false) {
  const g = new THREE.Group();
  const r = new THREE.Mesh(new THREE.PlaneGeometry(w, l), texMat('asphalt_02', w / 4, l / 4, { roughness: 0.9 })); r.rotation.x = -Math.PI / 2; r.position.y = 0.012; r.receiveShadow = true; g.add(r);
  for (let z = -l / 2; z < l / 2; z += 6) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 3), new THREE.MeshStandardMaterial({ color: 0xf2c94c, roughness: 0.7 })); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.016, z); g.add(d); }
  if (cross) for (let x = -w / 2 + 0.6; x < w / 2; x += 1.0) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 3.2), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.7 })); s.rotation.x = -Math.PI / 2; s.position.set(x, 0.017, 0); g.add(s); }
  const walk = texMat('concrete_floor_02', 2, l / 4, { roughness: 0.85 });
  for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, l), new THREE.MeshStandardMaterial({ color: 0xb8b4ac, roughness: 0.8 })); c.position.set(sx * (w / 2 + 0.15), 0.08, 0); c.receiveShadow = c.castShadow = true; g.add(c); const side = new THREE.Mesh(new THREE.BoxGeometry(5, 0.16, l), walk); side.position.set(sx * (w / 2 + 2.8), 0.08, 0); side.receiveShadow = true; g.add(side); }
  return g;
}
function building(name, h, at, ry = 0, face = null) {
  const b = fit(prop(name), h, 'y'); b.position.copy(at); b.rotation.y = ry; b.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  if (face) { b.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(b, true); // face: ['+z', value] -> that side of the box sits at value
    if (face[0] === '+z') b.position.z += face[1] - bb.max.z; if (face[0] === '-z') b.position.z += face[1] - bb.min.z; if (face[0] === '-x') b.position.x += face[1] - bb.min.x; if (face[0] === '+x') b.position.x += face[1] - bb.max.x; }
  return b; }
// a NY street: brick rows along the far side, towers behind, a city block on the horizon
function nyBlock(scene, zFar = -24, { towers = true, near = false } = {}) {
  for (let i = -3; i <= 3; i++) scene.add(building('sf/nyc_dwellings', 16 + (i % 2) * 3, V(i * 34, 0, zFar), 0, ['+z', zFar]));
  if (near) for (let i = -2; i <= 2; i++) scene.add(building('sf/nyc_dwellings', 16, V(i * 34, 0, 22), 0, ['-z', 22]));
  if (towers) { [[-40, -90, 'sf/office_tower', 150], [20, -110, 'sf/london_tower', 190], [70, -80, 'sf/office_tower', 130], [-90, -120, 'sf/london_tower', 170], [-5, -150, 'sf/office_tower', 160]].forEach(([x, z, n, h]) => scene.add(building(n, h, V(x, 0, z)))); }
  const cb = fit(prop('sf/city_block'), 420, 'max'); cb.position.set(0, 0, -420); scene.add(cb);
}
function lamps(scene, xs, z, lit = false) { xs.forEach(x => { const l = fit(prop('street_lamp_01'), 6, 'y'); l.position.set(x, 0.16, z); scene.add(l); if (lit) { const p = new THREE.PointLight(0xffd59a, 60, 18, 1.6); p.position.set(x, 5.7, z + 0.6); scene.add(p); } }); }
function trees(scene, spots) { spots.forEach(([x, z, h, i]) => { const all = prop('sf/trees_realistic'); const kids = []; all.traverse(o => { if (/^Tree/.test(o.name) && o.parent && !/^Tree/.test(o.parent.name)) kids.push(o); }); const pick = kids[(i || 0) % Math.max(1, kids.length)] || all; const t = fit(pick.clone(), h, 'y'); t.position.set(x, 0, z); t.rotation.y = (i || 0) * 1.7; t.traverse(m => { if (m.isMesh) m.castShadow = true; }); scene.add(t); }); }
function grassField(scene, cx, cz, w, d, n) { scene.add(grassTufts(n * 12, cx, cz, w, d)); }
function glowSprite(color, size) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,0.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); s.scale.setScalar(size); return s; }
function sirenTower() {
  const g = new THREE.Group(), steel = new THREE.MeshStandardMaterial({ color: 0x8a9098, metalness: 0.7, roughness: 0.35 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 9, 16), steel); pole.position.y = 4.5; pole.castShadow = true; g.add(pole);
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xf2c94c, roughness: 0.5 })); box.position.y = 8.4; box.castShadow = true; g.add(box);
  const stripes = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.18, 0.82), new THREE.MeshStandardMaterial({ color: 0x1a1a1a })); stripes.position.y = 8.4; g.add(stripes);
  for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.08, 0.6, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xdcdcdc, metalness: 0.5, roughness: 0.3, side: THREE.DoubleSide })); h.rotation.z = Math.PI / 2; const p = new THREE.Group(); p.add(h); h.position.x = 0.75; p.rotation.y = a; p.position.y = 9.25; g.add(p); }
  const beacons = [], glows = [];
  for (const x of [-0.45, 0.45]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 12), new THREE.MeshStandardMaterial({ color: 0xff2a1a, emissive: 0xff2010, emissiveIntensity: 0.2 })); b.position.set(x, 8.95, 0); g.add(b); beacons.push(b); const gl = glowSprite(0xff3020, 2.2); gl.position.copy(b.position); g.add(gl); glows.push(gl); }
  const light = new THREE.PointLight(0xff2a1a, 0, 18, 1.6); light.position.set(0, 8.9, 0.5); g.add(light);
  g.flash = (t, on) => { const k = on * (Math.sin(t * 14) > 0 ? 1 : 0.15); beacons.forEach((b, i) => { const kk = i ? k : on * (Math.sin(t * 14 + Math.PI) > 0 ? 1 : 0.15); b.material.emissiveIntensity = 0.2 + 4 * kk; glows[i].material.opacity = kk; }); light.intensity = 40 * k; };
  return g;
}
function nightStreet(scene) {
  world3d(scene, 'hansaplatz', { ...NIGHT, ground: 'asphalt_02', groundRepeat: 120 });
  const rd = road(10, 200); rd.rotation.y = Math.PI / 2; rd.position.set(0, 0, -6); scene.add(rd);
  nyBlock(scene, -20);
  lamps(scene, [-14, -2, 10, 22], -10.5, true);
  scene.traverse(m => { if (m.isMesh && m.material && m.material.emissive && /window|glass|light/i.test(m.material.name || '')) { m.material.emissive.set(0xffc880); m.material.emissiveIntensity = 0.6; } });
}

// ---------- S1 (0 – 2.85): T-Rex roars on a New York street at night ----------
function s1({ makeStage }) {
  const scene = makeStage({ shadowSize: 14, sunDir: [3, 6, 5] }); nightStreet(scene);
  const rex = creature('sf/trex_walk', 12, 'max'); rex.root.position.set(0, 0, -6); scene.add(rex.root);
  const taxi = fit(prop('sf/taxi'), 4.9, 'max'); taxi.position.set(2.8, 0, -2.0); taxi.rotation.y = -0.35; scene.add(taxi);
  const head = new THREE.SpotLight(0xfff0d0, 120, 40, 0.5, 0.6, 1.5); head.position.set(3, 1, 1); head.target.position.set(0, 3, -6); scene.add(head, head.target);
  const cam = cam0();
  const KEYS = [[0, [1.2, 1.1, 9.5], [0, 3.2, -4]], [2.85, [0.6, 1.0, 7.0], [0, 3.6, -4]]];
  return { scene, camera: cam, update(t) {
    rex.play(t, t < 0.6 ? '01_Idle' : '04_Attack', 1);
    const k = keyCam(KEYS, t); const sh = sm(0.9, 1.1, t) * (1 - sm(2.2, 2.8, t)) * 0.04;
    cam.position.copy(k.pos).add(V(Math.sin(t * 50) * sh, Math.cos(t * 43) * sh, 0)); cam.lookAt(k.look); labelCam(cam);
    return ret(0.35, 0.6);
  } };
}
// ---------- S2 (2.85 – 8.35): walking in New York, a T-Rex crosses the street ----------
function s2({ makeStage }) {
  const scene = world3d(makeStage({ shadowSize: 26, sunDir: [-4, 8, 3] }), 'wide_street_01', { ...DAY, ground: 'asphalt_02', groundRepeat: 120 });
  const rd = road(10, 200, true); rd.rotation.y = Math.PI / 2; rd.position.set(0, 0, -9); scene.add(rd);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(200, 20), texMat('concrete_floor_02', 40, 4, { roughness: 0.85 })); side.rotation.x = -Math.PI / 2; side.position.set(0, 0.16, 5.5); side.receiveShadow = true; scene.add(side);
  nyBlock(scene, -24);
  lamps(scene, [-12, 4, 20], -3.7); lamps(scene, [-4, 12], -14.3);
  const hyd = fit(prop('fire_hydrant'), 0.8, 'y'); hyd.position.set(1.6, 0.16, -3.6); scene.add(hyd);
  trees(scene, [[-6, -2.5, 7, 0], [9, -2.5, 6.5, 1]]);
  const rex = creature('sf/trex_walk', 12, 'max'); scene.add(rex.root);
  const taxi = fit(prop('sf/taxi'), 4.9, 'max'); scene.add(taxi);
  const car = fit(prop('sf/car_small'), 4.2, 'max'); scene.add(car);
  const parked = fit(prop('sf/taxi'), 4.9, 'max'); parked.position.set(-9, 0, -12.5); parked.rotation.y = Math.PI / 2; scene.add(parked);
  const her = person('carla', { height: 1.68 }); scene.add(her.root);
  const man = person('eric'); scene.add(man.root);
  const cam = cam0();
  const KEYS = [[0, [0.3, 1.55, 4.2], [0.1, 1.3, -3]], [2.7, [0.25, 1.5, 3.4], [0.1, 1.35, -3]], [3.2, [1.6, 1.7, 4.6], [0.0, 2.8, -9]], [5.5, [1.3, 1.6, 5.0], [0.5, 3.2, -9]]];
  return { scene, camera: cam, update(t) {
    const walk = 1 - sm(2.7, 3.0, t), scared = sm(2.9, 3.2, t);
    her.update(t, walk > 0.5 ? { walk: 1 } : { idle: 1 }, 1, { flinch: scared * 0.9, lookUp: scared * 0.5 }).plant(0.16);
    her.root.position.x = 0.1; her.root.position.z = lerp(-4.0, -1.3, sm(0, 2.9, t)); her.root.rotation.y = lerp(0, Math.PI, sm(3.0, 3.6, t));
    man.update(t, { walk: 1 }, 1).plant(0.16); man.root.position.x = -1.2; man.root.position.z = lerp(-0.5, -3.8, Math.min(1, t / 3.5)); man.root.rotation.y = Math.PI;
    man.root.visible = t < 3.6;
    const rx = lerp(-16, 10, sm(1.8, 5.5, t));
    rex.root.position.set(rx, 0, -9); rex.root.rotation.y = Math.PI / 2; rex.play(t, '02_Walk', 1);
    const tv = Math.max(0, Math.min(t, 2.8)) * 9 + Math.max(0, t - 2.8) * 9 * Math.exp(-(t - 2.8) * 2.5) / 2.5;
    taxi.position.set(lerp(24, -2, Math.min(1, tv / 26)), 0, -6.8); taxi.rotation.y = -Math.PI / 2;
    car.position.set(-30 + t * 7, 0, -11.3); car.rotation.y = Math.PI / 2; car.visible = t < 2.4;
    const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
    return ret(0.15, 1.0);
  } };
}
// ---------- S3 (8.35 – 11.15): Brachiosaurus among skyscrapers ----------
function s3({ makeStage }) {
  const scene = world3d(makeStage({ shadowSize: 60, sunDir: [-4, 8, 3] }), 'wide_street_01', { ...DAY, ground: 'concrete_floor_02', groundRepeat: 160 });
  [[-34, -40, 'sf/office_tower', 140], [18, -30, 'sf/london_tower', 170], [42, -70, 'sf/office_tower', 150], [-60, -90, 'sf/london_tower', 180], [-8, -95, 'sf/office_tower', 160], [70, -20, 'sf/office_tower', 120]].forEach(([x, z, n, h]) => scene.add(building(n, h, V(x, 0, z))));
  const cb = fit(prop('sf/city_block'), 420, 'max'); cb.position.set(0, 0, -400); scene.add(cb);
  const sau = creature('sf/sauropod', 30, 'max'); scene.add(sau.root);
  trees(scene, [[-6, -6, 7, 0], [8, -8, 7, 1]]);
  const a = person('sophia', { height: 1.66 }); scene.add(a.root);
  const b = person('manuel'); scene.add(b.root);
  const cam = cam0();
  const KEYS = [[0, [2.5, 1.2, 9], [-3, 5, -20]], [2.8, [1.2, 1.0, 7.5], [-3, 11, -20]]];
  return { scene, camera: cam, update(t) {
    sau.play(t, 0, 0.6); sau.root.position.set(lerp(-12, -4, t / 2.8), 0, -22); sau.root.rotation.y = Math.PI / 2 - 0.25;
    a.update(t, { idle: 1 }, 1, { lookUp: 0.9, point: 0.8 * sm(0.4, 0.8, t) }).plant(); a.root.position.x = 1.0; a.root.position.z = 2.5; a.root.rotation.y = Math.PI + 0.5;
    b.update(t, { idle: 1 }, 1, { lookUp: 0.9, handsHead: 0.8 * sm(0.8, 1.2, t) }).plant(); b.root.position.x = 2.3; b.root.position.z = 3.2; b.root.rotation.y = Math.PI + 0.3;
    const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
    return ret(0.15, 1.0);
  } };
}
// ---------- S4 (11.15 – 14.1): raptors hunt in a city park ----------
function s4({ makeStage }) {
  const scene = world3d(makeStage({ shadowSize: 20, sunDir: [-4, 8, 3] }), 'wide_street_01', { ...DAY, ground: 'forrest_ground_01', groundRepeat: 140, groundColor: 0x6f9a4a });
  grassField(scene, 6, 0, 46, 16, 360);
  trees(scene, [[-6, -10, 8, 0], [8, -12, 9, 1], [22, -9, 8, 0]]);
  for (let i = 0; i < 3; i++) { const bn = fit(prop('painted_wooden_bench'), 1.8, 'x'); bn.position.set(-2 + i * 12, 0, -4.5); scene.add(bn); }
  lamps(scene, [4, 16, 28], -5.5);
  [[-30, -70, 'sf/office_tower', 120], [10, -90, 'sf/london_tower', 160], [45, -75, 'sf/office_tower', 130]].forEach(([x, z, n, h]) => scene.add(building(n, h, V(x, 0, z))));
  const raps = [0, 1, 2].map(() => { const r = creature('sf/velociraptor', 2.4, 'max'); scene.add(r.root); return r; });
  const jog = person('manuel'); scene.add(jog.root);
  const dust = stream(200, 0x9a8a62, 0.15); dust.material.opacity = 0.35; scene.add(dust);
  const cam = cam0();
  return { scene, camera: cam, update(t) {
    const x = -4 + t * 5.2;
    jog.update(t, { run: 1 }, 1.1).plant(); jog.root.position.x = x + 2.2; jog.root.position.z = 0; jog.root.rotation.y = Math.PI / 2;
    raps.forEach((r, i) => { r.play(t + i * 0.2, 'Sprint', 1); r.root.position.set(x - 1.4 - i * 1.6, 0, (i - 1) * 1.3); r.root.rotation.y = Math.PI / 2; });
    scene.updateMatrixWorld(true);
    dust.update(V(x - 2, 0.1, 0), V(-1, 0.5, 0), 0, 2.9, t, 1.0, 0.8);
    cam.position.set(x + 0.6, 1.3, 9.0); cam.lookAt(x + 0.6, 1.0, 0); labelCam(cam);
    return ret(0.15, 1.0);
  } };
}
// ---------- S5 (14.1 – 20.85): armored cars, giant fences, warning systems ----------
function s5({ makeStage }) {
  const scene = world3d(makeStage({ shadowSize: 30, sunDir: [-4, 8, 3] }), 'wide_street_01', { ...DAY, ground: 'concrete_floor_02', groundRepeat: 160 });
  const rd = road(10, 200); rd.position.set(0, 0, -20); scene.add(rd);
  for (let i = 0; i < 6; i++) scene.add(building('sf/nyc_dwellings', 18, V(24, 0, 10 - i * 36), -Math.PI / 2, ['-x', 13]));
  [[60, -120, 'sf/office_tower', 150], [-70, -160, 'sf/london_tower', 170], [10, -200, 'sf/office_tower', 160]].forEach(([x, z, n, h]) => scene.add(building(n, h, V(x, 0, z))));
  const arm = fit(prop('sf/armored_car'), 2.6, 'y'); scene.add(arm);
  const arm2 = fit(prop('sf/armored_car'), 2.6, 'y'); scene.add(arm2);
  for (let i = 0; i < 6; i++) { const f = fit(prop('modular_chainlink_fence'), 8, 'y'); f.position.set(-7.6, 0, -6 - i * 21); f.rotation.y = Math.PI / 2; scene.add(f); }
  for (let i = 0; i < 12; i++) { const b = fit(prop('concrete_road_barrier'), 1.6, 'max'); b.position.set(-5.6, 0.16, -4 - i * 1.7); b.rotation.y = Math.PI / 2; scene.add(b); }
  trees(scene, [[-20, -14, 8, 0], [-26, -30, 9, 1], [-18, -46, 8, 0]]);
  const rex = creature('sf/trex_walk', 12, 'max'); scene.add(rex.root);
  const tower = sirenTower(); tower.position.set(5.8, 0.16, -10); scene.add(tower);
  const fl = fit(prop('flood_lights'), 1.4, 'max'); fl.position.set(5.8, 9.6, -10); scene.add(fl);
  const runners = ['claudia', 'eric'].map((k, i) => { const p = person(k, { height: i ? 1.8 : 1.66 }); scene.add(p.root); return p; });
  const redTint = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ color: 0xff2010, transparent: true, opacity: 0, depthTest: false, depthWrite: false })); redTint.renderOrder = 50;
  const cam = cam0(); cam.add(redTint); redTint.position.set(0, 0, -0.1); scene.add(cam);
  const KEYS = [[0, [3.4, 1.2, 4], [1.5, 1.4, -14]], [1.8, [3.0, 1.5, 2.5], [1.5, 1.6, -9]],
    [1.95, [-0.5, 2.0, 4.0], [-7.6, 4.2, -14]], [3.0, [-1.2, 2.2, 2.5], [-7.6, 4.0, -18]],
    [3.15, [1.5, 1.6, 3.5], [5.8, 6.5, -10]], [6.75, [0.5, 1.5, 2.5], [5.8, 6.0, -10]]];
  return { scene, camera: cam, update(t) {
    arm.position.set(2.2, 0, lerp(-40, -7, sm(0, 2.4, t))); arm.rotation.y = 0;
    arm2.position.set(-2.2, 0, lerp(-55, -22, sm(0, 2.8, t))); arm2.rotation.y = 0;
    rex.play(t, '02_Walk', 0.8); rex.root.position.set(-16, 0, lerp(-44, -12, t / 6.75)); rex.root.rotation.y = 0;
    const alarm = sm(3.2, 3.4, t);
    tower.flash(t, alarm); redTint.material.opacity = alarm * (Math.sin(t * 14) > 0 ? 0.07 : 0.0);
    runners.forEach((p, i) => { const run = t > 3.4 ? 1 : 0; p.update(t, run ? { run: 1 } : { idle: 1 }, 1.1, { lookUp: (1 - run) * 0.6 }).plant(0.16); p.root.position.x = 4.6 + i * 0.9; p.root.position.z = -3 + (run ? (t - 3.4) * 3.6 : 0) - i * 1.2; p.root.rotation.y = run ? 0 : Math.PI - 0.6; });
    const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
    return ret(0.25, 1.0);
  } };
}
// ---------- S6 (20.85 – 22.6): cities built behind giant walls ----------
function s6({ makeStage }) {
  const scene = world3d(makeStage({ shadowSize: 80, sunDir: [-4, 8, 3] }), 'wide_street_01', { ...DAY, ground: 'forrest_ground_01', groundRepeat: 200, groundColor: 0x7a9a5a });
  const wm = texMat('concrete_wall_003', 6, 2, { roughness: 0.95 });
  for (let i = -4; i <= 4; i++) { const w = new THREE.Mesh(new THREE.BoxGeometry(14, 16, 3), wm); w.position.set(i * 14, 8, -34); w.castShadow = w.receiveShadow = true; scene.add(w); }
  for (const x of [-42, 0, 42]) { const tw = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.8, 22, 24), wm); tw.position.set(x, 11, -34); tw.castShadow = true; scene.add(tw); const top = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 1.2, 24), new THREE.MeshStandardMaterial({ color: 0x6a6f75, roughness: 0.6 })); top.position.set(x, 22.6, -34); scene.add(top); const s = sirenTower(); s.position.set(x, 23.2, -34); s.scale.setScalar(0.5); scene.add(s); }
  [[-30, -70, 'sf/office_tower', 120], [6, -80, 'sf/london_tower', 160], [40, -65, 'sf/office_tower', 110], [-60, -110, 'sf/london_tower', 150]].forEach(([x, z, n, h]) => scene.add(building(n, h, V(x, 0, z))));
  for (let i = -2; i <= 2; i++) scene.add(building('sf/nyc_dwellings', 14, V(i * 34, 0, -50), 0, ['+z', -40]));
  trees(scene, [[-14, -8, 8, 0], [16, -12, 9, 1]]);
  grassField(scene, 0, 4, 30, 10, 160);
  const rex = creature('sf/trex_walk', 12, 'max'); scene.add(rex.root);
  const cam = cam0();
  const KEYS = [[0, [6, 1.8, 24], [0, 11, -34]], [1.75, [4, 4, 18], [0, 13, -34]]];
  return { scene, camera: cam, update(t) {
    rex.play(t, '02_Walk', 0.7); rex.root.position.set(lerp(-26, -12, t / 1.8), 0, -16); rex.root.rotation.y = Math.PI / 2;
    const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
    return ret(0.15, 1.0);
  } };
}
// ---------- S6b (22.6 – 25.85): abandoned, overgrown city ----------
function s6b({ makeStage }) {
  const scene = world3d(makeStage({ shadowSize: 20, sunDir: [-4, 8, 3] }), 'wide_street_01', { ...DAY, skyTop: 0x5f7488, skyMid: 0x93a3ad, skyHorizon: 0xc7c9c2, sun: 1.6, ground: 'forrest_ground_01', groundRepeat: 120, groundColor: 0x8a8f6a, fog: [0xb9bcb2, 30, 260] });
  const rd = road(10, 160); rd.position.set(0, 0, -20); rd.rotation.y = 0.05; scene.add(rd);
  for (let i = 0; i < 4; i++) { scene.add(building('sf/nyc_dwellings', 16, V(-20, 0, 6 - i * 36), Math.PI / 2, ['+x', -10.5])); scene.add(building('sf/nyc_dwellings', 17, V(20, 0, -8 - i * 36), -Math.PI / 2, ['-x', 10.5])); }
  const car = fit(prop('sf/car_abandoned'), 4.4, 'max'); car.position.set(2.2, 0, -5.5); car.rotation.y = -0.7; scene.add(car);
  const car2 = fit(prop('sf/car_small'), 4.2, 'max'); car2.position.set(-2.6, 0, -16); car2.rotation.set(0, 2.2, 0.05); scene.add(car2);
  const trunk = fit(prop('dead_tree_trunk'), 4, 'max'); trunk.position.set(-3.0, 0, -9); trunk.rotation.y = 1.2; scene.add(trunk);
  for (let i = 0; i < 26; i++) { const s = fit(prop(['shrub_02', 'shrub_03', 'shrub_04'][i % 3]), 0.9 + (i % 3) * 0.5, 'y'); s.position.set(Math.sin(i * 2.4) * 7, 0, -2 - (i * 1.37) % 22); scene.add(s); }
  grassField(scene, 0, -10, 16, 22, 320);
  trees(scene, [[-6, -24, 7, 0], [7, -30, 8, 1], [-1, -40, 9, 0]]);
  const raps = [0, 1].map(() => { const r = creature('sf/velociraptor', 2.4, 'max'); scene.add(r.root); return r; });
  const sau = creature('sf/sauropod', 30, 'max'); sau.root.position.set(-8, 0, -70); sau.root.rotation.y = 0.6; scene.add(sau.root);
  const cam = cam0();
  const KEYS = [[0, [0.5, 1.5, 6], [0.5, 1.6, -8]], [3.2, [-0.3, 1.3, 4.6], [0.5, 1.8, -8]]];
  return { scene, camera: cam, update(t) {
    raps[0].play(t, 'Sniff', 1); raps[0].root.position.set(0.6, 0, -2.4); raps[0].root.rotation.y = -0.8;
    raps[1].play(t, 'Idle_02', 1); raps[1].root.position.set(3.2, 0, -3.4); raps[1].root.rotation.y = -2.2;
    sau.play(t, 0, 0.5);
    const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
    return ret(0.12, 0.95);
  } };
}
// ---------- S7 (25.85 – 27.8): "here's the craziest part" — slow push into the T-Rex at night ----------
function s7({ makeStage }) {
  const scene = makeStage({ shadowSize: 14, sunDir: [3, 6, 5] }); nightStreet(scene);
  const rex = creature('sf/trex_walk', 12, 'max'); rex.root.position.set(0, 0, -6); rex.root.rotation.y = -0.4; scene.add(rex.root);
  const rim = new THREE.SpotLight(0xbfd4ff, 160, 40, 0.6, 0.5, 1.5); rim.position.set(-6, 9, -12); rim.target.position.set(0, 3, -6); scene.add(rim, rim.target);
  const cam = cam0();
  return { scene, camera: cam, update(t) {
    rex.play(t, '01_Idle', 0.8);
    const k = t / 1.95; cam.position.set(lerp(3.5, 2.6, k), lerp(3.0, 3.3, k), lerp(3.5, 1.6, k)); cam.lookAt(lerp(0.5, 1.2, k), 3.6, -2); labelCam(cam);
    return ret(0.3, 0.55);
  } };
}
// ---------- S8 (27.8 – end): would humans even exist? ----------
function s8({ makeStage }) {
  const scene = world3d(makeStage({ shadowSize: 10, sunDir: [-3, 7, 3] }), 'wide_street_01', { ...DAY, ground: 'forrest_ground_01', groundRepeat: 120, groundColor: 0x6f9a4a });
  grassField(scene, 0, -2, 7, 8, 260);
  trees(scene, [[-6, -12, 9, 0], [6, -15, 10, 1]]);
  const mouse = creature('sf/mouse', 0.22, 'max'); mouse.root.position.set(0.2, 0, 0.3); mouse.root.rotation.y = 0.6; scene.add(mouse.root);
  const rex = creature('sf/trex_walk', 12, 'max'); scene.add(rex.root);
  const human = person('sophia', { height: 1.66 }); scene.add(human.root);
  const cam = cam0();
  return { scene, camera: cam, update(lt, t) {
    mouse.play(t, 0, 1);
    rex.play(t, '02_Walk', 0.6); rex.root.position.set(lerp(-16, 4, sm(27.8, 31.5, t)), 0, -4.5); rex.root.rotation.y = Math.PI / 2;
    // a real person walks into frame and shrugs: "would we even be here?"
    const inK = sm(29.0, 30.0, t);
    human.update(t, inK < 0.99 ? { walk: 1 } : { idle: 1 }, 1, { shrug: 0.9 * sm(30.0, 30.4, t), headTilt: 0.4 * sm(30.0, 30.4, t) }).plant();
    human.root.position.x = lerp(3.2, 1.0, inK); human.root.position.z = -0.8; human.root.rotation.y = lerp(-Math.PI / 2, -0.35, sm(29.7, 30.1, t)); human.root.visible = t > 28.9;
    const k = sm(27.8, 31.6, t); cam.position.set(lerp(0.6, 1.3, k), lerp(0.25, 1.25, k), lerp(1.4, 4.4, k)); cam.lookAt(lerp(0.2, 0.7, k), lerp(0.1, 1.2, k), 0); labelCam(cam);
    return ret(0.2, 1.0);
  } };
}
export const SHOTS = [
  { start: 0, end: 2.85, build: s1 }, { start: 2.85, end: 8.35, build: s2 }, { start: 8.35, end: 11.15, build: s3 }, { start: 11.15, end: 14.1, build: s4 },
  { start: 14.1, end: 20.85, build: s5 }, { start: 20.85, end: 22.6, build: s6 }, { start: 22.6, end: 25.85, build: s6b }, { start: 25.85, end: 27.8, build: s7 }, { start: 27.8, end: 99, build: s8 },
];
