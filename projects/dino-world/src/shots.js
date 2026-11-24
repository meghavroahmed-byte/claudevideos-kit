import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, creature, person, ghost, keyCam, texMat, canvasTex, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

// "What if dinosaurs never went extinct?" — 8 shots, realistic people, real dinosaurs and city props
export const DURATION = 31.7;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [[31.3, 31.6, 31.7, 31.71]];
export const PRELOAD = (r) => loadKit(r, {
  models: ['sf/trex_walk', 'sf/velociraptor', 'sf/sauropod', 'sf/armored_car', 'sf/taxi', 'sf/car_small', 'sf/car_abandoned', 'sf/mouse',
    'modular_chainlink_fence', 'concrete_road_barrier', 'flood_lights', 'street_lamp_01', 'fire_hydrant', 'shrub_01', 'shrub_02', 'dead_tree_trunk', 'grass_medium_01'],
  hdris: ['hansaplatz', 'canary_wharf', 'rooitou_park', 'wide_street_01', 'roofless_ruins'], tex: ['asphalt_02', 'concrete_wall_003'],
  people: ['carla', 'eric', 'sophia', 'manuel', 'claudia'],
});
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
const cam0 = () => new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 600);
const ret = (b = 0.15, e = 1.0) => ({ bloom: b, exposure: e });
function road(w, l, cross = false) {
  const g = new THREE.Group();
  const r = new THREE.Mesh(new THREE.PlaneGeometry(w, l), texMat('asphalt_02', w / 4, l / 4, { roughness: 0.9 })); r.rotation.x = -Math.PI / 2; r.position.y = 0.01; r.receiveShadow = true; g.add(r);
  const paint = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.7 });
  for (let z = -l / 2; z < l / 2; z += 6) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 3), new THREE.MeshStandardMaterial({ color: 0xf2c94c, roughness: 0.7 })); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.015, z); g.add(d); }
  if (cross) for (let x = -w / 2 + 0.6; x < w / 2; x += 1.0) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 3.2), paint); s.rotation.x = -Math.PI / 2; s.position.set(x, 0.016, 0); g.add(s); }
  const curb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, l), new THREE.MeshStandardMaterial({ color: 0xb8b4ac, roughness: 0.8 }));
  for (const sx of [-1, 1]) { const c = curb.clone(); c.position.set(sx * (w / 2 + 0.15), 0.08, 0); c.receiveShadow = c.castShadow = true; g.add(c); const side = new THREE.Mesh(new THREE.PlaneGeometry(4, l), new THREE.MeshStandardMaterial({ color: 0xa9a59d, roughness: 0.85 })); side.rotation.x = -Math.PI / 2; side.position.set(sx * (w / 2 + 2.3), 0.16, 0); side.receiveShadow = true; g.add(side); }
  return g;
}
function glowSprite(color, size) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,0.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  s.scale.setScalar(size); return s;
}
function sirenTower() {
  const g = new THREE.Group(), steel = new THREE.MeshStandardMaterial({ color: 0x8a9098, metalness: 0.7, roughness: 0.35 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 9, 16), steel); pole.position.y = 4.5; pole.castShadow = true; g.add(pole);
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xf2c94c, roughness: 0.5 })); box.position.y = 8.4; box.castShadow = true; g.add(box);
  const stripes = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.18, 0.82), new THREE.MeshStandardMaterial({ color: 0x1a1a1a })); stripes.position.y = 8.4; g.add(stripes);
  const horns = []; for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.08, 0.6, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xdcdcdc, metalness: 0.5, roughness: 0.3, side: THREE.DoubleSide })); h.rotation.z = Math.PI / 2; const p = new THREE.Group(); p.add(h); h.position.x = 0.75; p.rotation.y = a; p.position.y = 9.25; g.add(p); horns.push(h); }
  const beacons = [], glows = [];
  for (const x of [-0.45, 0.45]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 12), new THREE.MeshStandardMaterial({ color: 0xff2a1a, emissive: 0xff2010, emissiveIntensity: 0.2 })); b.position.set(x, 8.95, 0); g.add(b); beacons.push(b); const gl = glowSprite(0xff3020, 2.2); gl.position.copy(b.position); g.add(gl); glows.push(gl); }
  const light = new THREE.PointLight(0xff2a1a, 0, 18, 1.6); light.position.set(0, 8.9, 0.5); g.add(light);
  g.flash = (t, on) => { const k = on * (Math.sin(t * 14) > 0 ? 1 : 0.15); beacons.forEach((b, i) => { const kk = i ? k : on * (Math.sin(t * 14 + Math.PI) > 0 ? 1 : 0.15); b.material.emissiveIntensity = 0.2 + 4 * kk; glows[i].material.opacity = kk; }); light.intensity = 40 * k; };
  return g;
}
function wallTex(scene) { return texMat('concrete_wall_003', 6, 2, { roughness: 0.95 }); }

// ---------- S1 (0 – 2.85): T-Rex roars in the city at night ----------
function s1({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 12, sunDir: [3, 6, 5] }), 'hansaplatz', { height: 1.7, radius: 70, sun: 1.2, sunColor: 0xbcd0ff, env: 1.1 });
  const rex = creature('sf/trex_walk', 12, 'max'); rex.root.position.set(0, 0, -6); rex.root.rotation.y = 0; scene.add(rex.root);
  const taxi = fit(prop('sf/taxi'), 4.9, 'max'); taxi.position.set(2.6, 0, 1.0); taxi.rotation.y = -0.3; scene.add(taxi);
  const lamp = fit(prop('street_lamp_01'), 4.5, 'y'); lamp.position.set(-3.2, 0, 0.5); scene.add(lamp);
  const cam = cam0();
  const KEYS = [[0, [1.2, 1.1, 9.5], [0, 3.2, -4]], [2.85, [0.6, 1.0, 7.0], [0, 3.6, -4]]];
  return { scene, camera: cam, update(t) {
    rex.play(t, t < 0.6 ? '01_Idle' : '04_Attack', 1);
    const k = keyCam(KEYS, t); const sh = sm(0.9, 1.1, t) * (1 - sm(2.2, 2.8, t)) * 0.04;
    cam.position.copy(k.pos).add(V(Math.sin(t * 50) * sh, Math.cos(t * 43) * sh, 0)); cam.lookAt(k.look); labelCam(cam);
    return ret(0.3, 1.0);
  } };
}
// ---------- S2 (2.85 – 8.35): walking in New York, a T-Rex crosses the street ----------
function s2({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 18, sunDir: [-4, 8, 3] }), 'canary_wharf', { height: 1.7, radius: 90, sun: 1.8, env: 1.0 });
  const rd = road(9, 80, true); rd.rotation.y = Math.PI / 2; rd.position.set(0, 0, -9); scene.add(rd);
  const rex = creature('sf/trex_walk', 12, 'max'); scene.add(rex.root);
  const taxi = fit(prop('sf/taxi'), 4.9, 'max'); scene.add(taxi);
  const car = fit(prop('sf/car_small'), 4.2, 'max'); scene.add(car);
  const taxi2 = fit(prop('sf/taxi'), 4.9, 'max'); taxi2.position.set(9, 0, -11); taxi2.rotation.y = Math.PI / 2; scene.add(taxi2);
  const hyd = fit(prop('fire_hydrant'), 0.8, 'y'); hyd.position.set(1.6, 0.16, -3.6); scene.add(hyd);
  const lamp = fit(prop('street_lamp_01'), 4.8, 'y'); lamp.position.set(-2.2, 0.16, -4.0); scene.add(lamp);
  const her = person('carla', { height: 1.68 }); scene.add(her.root);
  const man = person('eric'); scene.add(man.root);
  const cam = cam0();
  const KEYS = [[0, [0.3, 1.55, 4.2], [0.1, 1.3, -3]], [2.7, [0.25, 1.5, 3.4], [0.1, 1.35, -3]], [3.2, [1.6, 1.7, 4.6], [0.0, 2.6, -9]], [5.5, [1.3, 1.6, 5.0], [0.5, 3.0, -9]]];
  return { scene, camera: cam, update(t) {
    const walk = 1 - sm(2.7, 3.0, t), scared = sm(2.9, 3.2, t);
    her.update(t, walk > 0.5 ? { walk: 1 } : { idle: 1 }, 1, { flinch: scared * 0.9, lookUp: scared * 0.5 }).plant(0.16);
    her.root.position.x = 0.1; her.root.position.z = lerp(-4.2, -1.3, sm(0, 2.9, t)); her.root.rotation.y = lerp(0, Math.PI, sm(3.0, 3.6, t));
    man.update(t, { walk: 1 }, 1).plant(0.16); man.root.position.set(-1.0, man.root.position.y, lerp(-0.5, -6, t / 5.5)); man.root.rotation.y = Math.PI;
    // T-Rex crosses left -> right on the crosswalk from 2.6 s
    const rx = lerp(-26, 14, sm(2.4, 5.5, t) * 0.55 + Math.max(0, t - 2.4) * 0.09);
    rex.root.position.set(rx, 0, -9); rex.root.rotation.y = Math.PI / 2; rex.play(t, '02_Walk', 1);
    // traffic: taxi brakes hard, small car drives the other way
    const tv = Math.max(0, Math.min(t, 2.8)) * 9 + Math.max(0, t - 2.8) * 9 * Math.exp(-(t - 2.8) * 2.5) / 2.5;
    taxi.position.set(lerp(24, 24 - 26, Math.min(1, tv / 26)), 0, -7.0); taxi.rotation.y = -Math.PI / 2;
    car.position.set(-30 + t * 7, 0, -11.2); car.rotation.y = Math.PI / 2; car.visible = t < 2.4;
    const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
    return ret(0.15, 1.0);
  } };
}
// ---------- S3 (8.35 – 11.15): Brachiosaurus among skyscrapers ----------
function s3({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 30, sunDir: [-4, 8, 3] }), 'canary_wharf', { height: 1.7, radius: 90, sun: 1.8, env: 1.0 });
  const sau = creature('sf/sauropod', 30, 'max'); scene.add(sau.root);
  const a = person('sophia', { height: 1.66 }); scene.add(a.root);
  const b = person('manuel'); scene.add(b.root);
  const cam = cam0();
  const KEYS = [[0, [2.5, 1.2, 9], [-2, 4, -14]], [2.8, [1.2, 1.0, 7.5], [-2, 9, -14]]];
  return { scene, camera: cam, update(t) {
    sau.play(t, 0, 0.6); sau.root.position.set(lerp(-14, -6, t / 2.8), 0, -16); sau.root.rotation.y = Math.PI / 2 - 0.25;
    a.update(t, { idle: 1 }, 1, { lookUp: 0.9, point: 0.8 * sm(0.4, 0.8, t) }).plant(); a.root.position.x = 1.0; a.root.position.z = 2.5; a.root.rotation.y = Math.PI + 0.5;
    b.update(t, { idle: 1 }, 1, { lookUp: 0.9, handsHead: 0.8 * sm(0.8, 1.2, t) }).plant(); b.root.position.x = 2.3; b.root.position.z = 3.2; b.root.rotation.y = Math.PI + 0.3;
    const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
    return ret(0.15, 1.0);
  } };
}
// ---------- S4 (11.15 – 14.1): raptors hunt in the park ----------
function s4({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 14, sunDir: [-4, 8, 3] }), 'rooitou_park', { height: 1.7, radius: 80, sun: 2.0, env: 1.0 });
  const raps = [0, 1, 2].map(() => { const r = creature('sf/velociraptor', 2.4, 'max'); scene.add(r.root); return r; });
  const jog = person('manuel'); scene.add(jog.root);
  const dust = stream(200, 0xcbb894, 0.15); dust.material.opacity = 0.4; scene.add(dust);
  const cam = cam0();
  return { scene, camera: cam, update(t) {
    const x = -4 + t * 5.2;
    jog.update(t, { run: 1 }, 1.1).plant(); jog.root.position.x = x + 3.2; jog.root.position.z = 0; jog.root.rotation.y = Math.PI / 2;
    raps.forEach((r, i) => { r.play(t + i * 0.2, 'Sprint', 1); r.root.position.set(x - 1.4 - i * 1.6, 0, (i - 1) * 1.3); r.root.rotation.y = Math.PI / 2; });
    scene.updateMatrixWorld(true);
    dust.update(V(x - 2, 0.1, 0), V(-1, 0.5, 0), 0, 2.9, t, 1.0, 0.8);
    cam.position.set(x + 0.5, 1.2, 6.5); cam.lookAt(x + 0.8, 0.9, 0); labelCam(cam);
    return ret(0.15, 1.0);
  } };
}
// ---------- S5 (14.1 – 20.85): armored cars, giant fences, warning systems ----------
function s5({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 24, sunDir: [-4, 8, 3] }), 'wide_street_01', { height: 1.7, radius: 90, sun: 1.8, env: 1.0 });
  const rd = road(9, 120); rd.position.set(0, 0, -20); scene.add(rd);
  const arm = fit(prop('sf/armored_car'), 2.6, 'y'); scene.add(arm);
  const arm2 = fit(prop('sf/armored_car'), 2.6, 'y'); scene.add(arm2);
  const fence = new THREE.Group(); for (let i = 0; i < 5; i++) { const f = fit(prop('modular_chainlink_fence'), 8, 'y'); f.position.set(-7.5, 0, -6 - i * 21); f.rotation.y = Math.PI / 2; fence.add(f); } scene.add(fence);
  for (let i = 0; i < 10; i++) { const b = fit(prop('concrete_road_barrier'), 1.6, 'max'); b.position.set(-5.6, 0.16, -4 - i * 1.7); b.rotation.y = Math.PI / 2; scene.add(b); }
  const rex = creature('sf/trex_walk', 12, 'max'); scene.add(rex.root);
  const tower = sirenTower(); tower.position.set(5.6, 0.16, -10); scene.add(tower);
  const fl = fit(prop('flood_lights'), 1.4, 'max'); fl.position.set(5.6, 9.6, -10); scene.add(fl);
  const runners = ['claudia', 'eric'].map((k, i) => { const p = person(k, { height: i ? 1.8 : 1.66 }); scene.add(p.root); return p; });
  const redTint = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ color: 0xff2010, transparent: true, opacity: 0, depthTest: false, depthWrite: false })); redTint.renderOrder = 50;
  const cam = cam0(); cam.add(redTint); redTint.position.set(0, 0, -0.1); scene.add(cam);
  const KEYS = [[0, [2.6, 1.1, 6], [0, 1.2, -12]], [1.8, [1.8, 1.4, 4.5], [0, 1.5, -6]],
    [1.95, [3.0, 2.0, 2.0], [-7.5, 4.2, -12]], [3.0, [2.6, 2.2, 0.5], [-7.5, 4.0, -16]],
    [3.15, [1.5, 1.6, 3.5], [5.6, 6.5, -10]], [6.75, [0.5, 1.5, 2.5], [5.6, 6.0, -10]]];
  return { scene, camera: cam, update(t) {
    arm.position.set(1.8, 0, lerp(-40, 3, Math.min(1, t / 2.6))); arm.rotation.y = 0;
    arm2.position.set(-1.8, 0, lerp(-55, -18, Math.min(1, t / 3.0))); arm2.rotation.y = 0;
    rex.play(t, '02_Walk', 0.8); rex.root.position.set(-15, 0, lerp(-40, -10, t / 6.75)); rex.root.rotation.y = 0;
    const alarm = sm(3.2, 3.4, t);
    tower.flash(t, alarm); redTint.material.opacity = alarm * (Math.sin(t * 14) > 0 ? 0.07 : 0.0);
    runners.forEach((p, i) => { const run = t > 3.4 ? 1 : 0; p.update(t, run ? { run: 1 } : { idle: 1 }, 1.1, { lookUp: (1 - run) * 0.6 }).plant(0.16); p.root.position.x = 4.6 + i * 0.9; p.root.position.z = -3 + (run ? (t - 3.4) * 3.6 : 0) - i * 1.2; p.root.rotation.y = run ? 0 : Math.PI - 0.6; });
    const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
    return ret(0.25, 1.0);
  } };
}
// ---------- S6 (20.85 – 25.85): walled cities, uninhabitable places ----------
function s6({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 40, sunDir: [-4, 8, 3] }), 'canary_wharf', { height: 1.7, radius: 120, sun: 1.8, env: 1.0 });
  const wm = wallTex(); const wall = new THREE.Group();
  for (let i = -3; i <= 3; i++) { const w = new THREE.Mesh(new THREE.BoxGeometry(12, 14, 2.5), wm); w.position.set(i * 12, 7, -30); w.castShadow = w.receiveShadow = true; wall.add(w); }
  for (const x of [-30, 0, 30]) { const tw = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.6, 20, 24), wm); tw.position.set(x, 10, -30); tw.castShadow = true; wall.add(tw); const top = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 1.2, 24), new THREE.MeshStandardMaterial({ color: 0x6a6f75, roughness: 0.6 })); top.position.set(x, 20.6, -30); wall.add(top); }
  scene.add(wall);
  const rex = creature('sf/trex_walk', 12, 'max'); scene.add(rex.root);
  const cam = cam0();
  const KEYS = [[0, [6, 1.6, 22], [0, 10, -30]], [1.75, [4, 4, 16], [0, 12, -30]]];
  return { scene, camera: cam, update(t) {
    rex.play(t, '02_Walk', 0.7); rex.root.position.set(lerp(-25, -10, t / 1.8), 0, -14); rex.root.rotation.y = Math.PI / 2;
    const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
    return ret(0.15, 1.0);
  } };
}
function s6b({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 14, sunDir: [-4, 8, 3] }), 'roofless_ruins', { height: 1.7, radius: 60, sun: 1.6, env: 1.0 });
  const car = fit(prop('sf/car_abandoned'), 4.4, 'max'); car.position.set(1.8, 0, -3.5); car.rotation.y = -0.7; scene.add(car);
  const trunk = fit(prop('dead_tree_trunk'), 4, 'max'); trunk.position.set(-2.5, 0, -6); scene.add(trunk);
  for (let i = 0; i < 14; i++) { const s = fit(prop(i % 2 ? 'shrub_01' : 'shrub_02'), 1.0 + (i % 3) * 0.4, 'y'); s.position.set(Math.sin(i * 2.4) * 6, 0, -2 - (i * 0.9) % 9); scene.add(s); }
  for (let i = 0; i < 30; i++) { const g = fit(prop('grass_medium_01'), 0.6, 'y'); g.position.set(Math.sin(i * 1.7) * 5, 0, -1 - (i * 0.53) % 8); scene.add(g); }
  const raps = [0, 1].map(() => { const r = creature('sf/velociraptor', 2.4, 'max'); scene.add(r.root); return r; });
  const sau = creature('sf/sauropod', 30, 'max'); sau.root.position.set(-20, 0, -45); sau.root.rotation.y = 0.6; scene.add(sau.root);
  const cam = cam0();
  const KEYS = [[0, [0.5, 1.5, 6], [0.5, 1.5, -5]], [3.2, [-0.3, 1.3, 4.6], [0.5, 1.6, -5]]];
  return { scene, camera: cam, update(t) {
    raps[0].play(t, 'Sniff', 1); raps[0].root.position.set(0.6, 0, -1.6); raps[0].root.rotation.y = -0.8;
    raps[1].play(t, 'Idle_02', 1); raps[1].root.position.set(2.8, 0, -2.2); raps[1].root.rotation.y = -2.2;
    sau.play(t, 0, 0.5);
    const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
    return ret(0.12, 0.95);
  } };
}
// ---------- S7 (25.85 – 27.8): "here's the craziest part" — slow push into the T-Rex at night ----------
function s7({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 12, sunDir: [3, 6, 5] }), 'hansaplatz', { height: 1.7, radius: 70, sun: 0.9, sunColor: 0xbcd0ff, env: 0.9 });
  const rex = creature('sf/trex_walk', 12, 'max'); rex.root.position.set(0, 0, -4); rex.root.rotation.y = -0.4; scene.add(rex.root);
  const cam = cam0();
  return { scene, camera: cam, update(t) {
    rex.play(t, '01_Idle', 0.8);
    const k = t / 1.95; cam.position.set(lerp(3.5, 2.6, k), lerp(3.0, 3.3, k), lerp(5.5, 3.6, k)); cam.lookAt(lerp(0.5, 1.2, k), 3.6, 0); labelCam(cam);
    return ret(0.2, 0.85);
  } };
}
// ---------- S8 (27.8 – end): would humans exist? tiny mammal + giant foot; a human appears and fades ----------
function s8({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 8, sunDir: [-3, 7, 3] }), 'rooitou_park', { height: 1.7, radius: 60, sun: 1.6, env: 0.9 });
  for (let i = 0; i < 40; i++) { const g = fit(prop('grass_medium_01'), 0.5 + (i % 3) * 0.15, 'y'); g.position.set(Math.sin(i * 2.1) * 2.5, 0, -0.5 - (i * 0.37) % 6); scene.add(g); }
  const mouse = creature('sf/mouse', 0.22, 'max'); mouse.root.position.set(0.2, 0, 0.3); mouse.root.rotation.y = 0.6; scene.add(mouse.root);
  const rex = creature('sf/trex_walk', 12, 'max'); scene.add(rex.root);
  const human = person('sophia', { height: 1.66 }); scene.add(human.root); const gh = ghost(human.root, 0xdff4ff, { inPlace: true });
  const cam = cam0();
  return { scene, camera: cam, update(lt, t) {
    mouse.play(t, 0, 1);
    rex.play(t, '02_Walk', 0.6); rex.root.position.set(lerp(-14, 6, sm(27.8, 31.5, t)), 0, -3.2); rex.root.rotation.y = Math.PI / 2;
    human.update(t, { idle: 1 }, 1, { lookUp: 0.3 }).plant(); human.root.position.x = 0.9; human.root.position.z = -1.2; human.root.rotation.y = -0.4;
    gh.fade(sm(29.2, 29.8, t) * (1 - sm(30.6, 31.2, t)));
    const k = sm(27.8, 31.6, t); cam.position.set(lerp(0.6, 1.3, k), lerp(0.25, 1.2, k), lerp(1.4, 4.2, k)); cam.lookAt(lerp(0.2, 0.6, k), lerp(0.1, 1.2, k), 0); labelCam(cam);
    return ret(0.2, 1.0);
  } };
}
export const SHOTS = [
  { start: 0, end: 2.85, build: s1 },
  { start: 2.85, end: 8.35, build: s2 },
  { start: 8.35, end: 11.15, build: s3 },
  { start: 11.15, end: 14.1, build: s4 },
  { start: 14.1, end: 20.85, build: s5 },
  { start: 20.85, end: 22.6, build: s6 },
  { start: 22.6, end: 25.85, build: s6b },
  { start: 25.85, end: 27.8, build: s7 },
  { start: 27.8, end: 99, build: s8 },
];
