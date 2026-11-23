import * as THREE from 'three';
import { labelCam, loadKit, world, prop, texMat, person, label, showLabel, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 24.6;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['large_castle_door', 'namaqualand_boulder_02', 'wooden_barrels_01'], hdris: ['kloofendal_48d_partly_cloudy_puresky'], tex: ['medieval_blocks_03', 'rough_wood', 'forrest_ground_01'], people: ['hero', 'knight', 'manuel'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function beam(mat, l, w = 0.25) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, l, w), mat); m.castShadow = m.receiveShadow = true; return m; }
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 18, sunDir: [-6, 10, 5] }), 'kloofendal_48d_partly_cloudy_puresky', { sky: false, sun: 2.4, env: 0.9 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), texMat('forrest_ground_01', 80, 80, { color: 0x9a9a80 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  // castle: curtain wall with two towers and a gate, at z = -14
  const stone = (rx, ry) => texMat('medieval_blocks_03', rx, ry, { color: 0xd8d0c0 });
  const castle = new THREE.Group(); scene.add(castle); castle.position.z = -14;
  const wallL = new THREE.Mesh(new THREE.BoxGeometry(9, 7, 2), stone(4, 3)); wallL.position.set(-6.5, 3.5, 0); castle.add(wallL);
  const wallR = new THREE.Mesh(new THREE.BoxGeometry(9, 7, 2), stone(4, 3)); wallR.position.set(6.5, 3.5, 0); castle.add(wallR);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 2), stone(2, 1.4)); lintel.position.set(0, 5.5, 0); castle.add(lintel);
  for (const x of [-11, 11]) { const tw = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 11, 24), stone(6, 5)); tw.position.set(x, 5.5, 0); castle.add(tw); }
  for (let i = 0; i < 18; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 2.1), stone(0.3, 0.3)); c.position.set(-10.5 + i * 1.24, 7.35, 0); if (Math.abs(c.position.x) > 2.1 || true) castle.add(c); }
  castle.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } });
  const gate = prop('large_castle_door', 1.4); gate.position.set(0, 0, 0.9); castle.add(gate);
  const collapse = wallR; // tunnel collapse target
  // battering ram: roofed wooden frame with a swinging log
  const wood = texMat('rough_wood', 1, 3);
  const ram = new THREE.Group(); for (const [x, z] of [[-0.9, -1.6], [0.9, -1.6], [-0.9, 1.6], [0.9, 1.6]]) { const p = beam(wood, 2.6); p.position.set(x, 1.3, z); ram.add(p); }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 3.8), wood); roof.position.y = 2.65; ram.add(roof);
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 5, 16), wood); log.rotation.x = Math.PI / 2; log.position.y = 1.3; log.castShadow = true; ram.add(log);
  for (const x of [-1, 1]) for (const z of [-1.4, 1.4]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.15, 20), wood); w.rotation.z = Math.PI / 2; w.position.set(x * 1.1, 0.45, z); ram.add(w); }
  scene.add(ram);
  // trebuchet: A-frame + throwing arm + counterweight + sling
  const treb = new THREE.Group(); for (const x of [-1.2, 1.2]) { const a = beam(wood, 6, 0.35); a.position.set(x, 2.8, 0.9); a.rotation.x = 0.33; treb.add(a); const b2 = beam(wood, 6, 0.35); b2.position.set(x, 2.8, -0.9); b2.rotation.x = -0.33; treb.add(b2); }
  const base = beam(wood, 6, 0.4); base.rotation.x = Math.PI / 2; base.position.set(0, 0.2, 0); treb.add(base);
  const pivot = new THREE.Group(); pivot.position.set(0, 5.6, 0); treb.add(pivot);
  const arm = beam(wood, 9, 0.3); arm.position.set(0, 0, 0); arm.rotation.x = Math.PI / 2; arm.position.z = -1.5; pivot.add(arm);
  const cw = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), texMat('rough_wood', 1, 1, { color: 0x6a4a30 })); cw.position.set(0, -1.0, 2.6); pivot.add(cw);
  treb.position.set(-3, 0, 2); treb.rotation.y = 0.1; scene.add(treb);
  const boulder = prop('namaqualand_boulder_02', 1.0); scene.add(boulder);
  const dust = stream(600, 0xbfb2a0, 0.4); dust.material.opacity = 0.4; scene.add(dust);
  const rubble = []; for (let i = 0; i < 24; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.5), stone(0.3, 0.3)); r.castShadow = true; scene.add(r); rubble.push(r); }
  const tunnel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 9), new THREE.MeshBasicMaterial({ color: 0x2a1e14 })); tunnel.position.set(6.5, 0.03, -9); scene.add(tunnel);
  const hero = person('hero'); scene.add(hero.root);
  const army = []; for (let i = 0; i < 16; i++) { const p = person(i % 2 ? 'knight' : 'manuel', { print: false, height: i % 2 ? 1.86 : 1.78 }); scene.add(p.root); army.push(p); }
  const hungry = person('manuel', { print: false }); ghost(hungry.root, 0xbfe6ff, { inPlace: true }); scene.add(hungry.root);
  const L = { surr: label('SURROUND IT', 5.8), food: label('NO FOOD IN', 5.0), months: label('WAIT FOR MONTHS', 6.4), starve: label('STARVING', 5.0), ramL: label('BATTERING RAM', 6.4), gateL: label('SMASH THE GATE', 6.4), trebL: label('TREBUCHET', 6.4), boulderL: label('HUGE BOULDERS', 6.4), tun: label('TUNNELS UNDER THE WALLS', 8.6), coll: label('COLLAPSE!', 7.2) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(46, 720 / 1280, 0.05, 600);
  const KEYS = [[0, [6, 4, 16], [0, 4, -12]], [2.2, [6, 7, 10], [0, 2.5, -8]], [10.6, [6, 7, 10], [0, 3, -9]], [11.4, [5.5, 3.2, -1.0], [0, 2.4, -12]], [14.6, [5.5, 3.2, -1.0], [0, 2.4, -12]],
    [15.2, [7, 4.5, 12], [-3, 4.5, 0]], [17.2, [7, 4.5, 12], [-3, 5.5, -2]], [18.8, [7, 5.5, 13], [-3, 4, -10]], [19.6, [14, 5, 4], [6, 2, -10]], [24.6, [14, 5, 4], [6, 2, -12]]];
  return {
    scene, camera: cam,
    update(t) {
      // army ring around the castle (surround) 2.2 - 10.6
      army.forEach((a, i) => { const v = t > 2.0 && t < 10.8; a.root.visible = v; if (!v) return; a.update(t + i, { idle: 1 }, 1, {}); const row = Math.floor(i / 8), col = i % 8; a.root.position.set(-10.5 + col * 3 + row * 1.5, 0, -5 - row * 1.8); a.root.rotation.y = Math.PI + Math.atan2(a.root.position.x, -14 - a.root.position.z) * 0; });
      const hk = sm(8.4, 8.8, t) * (1 - sm(10.4, 10.8, t)); hungry.update(t, { idle: 1 }, 1, { slump: 0.9, handsBelly: 0.8 }); hungry.root.fade(0.85 * hk); hungry.root.position.set(0, 7.05, -14.2); hungry.root.scale.setScalar(1.5);
      // ram rolls up 11.8-13.4, hits at 13.6 / 14.1
      const rz = lerp(-1, -10.4, sm(11.8, 13.4, t)); ram.position.set(0, 0, rz); ram.visible = t > 10.6 && t < 19;
      const swing = Math.max(0, Math.sin((t - 13.4) * 9)) * (t > 13.4 && t < 14.8 ? 1 : 0); log.position.z = -0.8 * swing;
      gate.rotation.x = -0.12 * sm(14.0, 14.3, t);
      // trebuchet throws at 17.0; boulder flies to the left wall and hits 18.4
      const fire = sm(16.8, 17.4, t); pivot.rotation.x = lerp(0.9, -1.1, fire);
      const bt = (t - 17.2) / 1.2; boulder.visible = t > 15 && t < 18.6;
      if (t < 17.2) { boulder.position.copy(treb.position).add(V(0, 0.6, -4.8)); } else { const a = treb.position.clone().add(V(0, 9, -4)), b = V(-6, 4.5, -13); boulder.position.copy(a.clone().lerp(b, bt)).add(V(0, Math.sin(bt * Math.PI) * 6, 0)); }
      // tunnel collapse 21.5+
      const col = sm(21.8, 23.4, t); collapse.position.y = 3.5 - 4.5 * col; collapse.rotation.z = 0.25 * col; tunnel.visible = t > 19.6;
      rubble.forEach((r, i) => { const k = sm(21.8 + i * 0.02, 22.8, t); r.visible = k > 0.01; r.position.set(6.5 + ((i * 1.37) % 8) - 4, Math.max(0.25, 4 - k * 5 + (i % 3)), -14 + ((i * 0.77) % 3)); r.rotation.set(i, k * 3, i); });
      hero.update(t, { idle: 1 }, 1, { point: sm(1.0, 1.4, t) * (1 - sm(2.0, 2.4, t)) });
      hero.root.position.set(1.2, 0, 4.0); hero.root.rotation.y = 2.9; hero.root.visible = t < 2.4;
      const k = keyCam(KEYS, t); const shk = (Math.abs(t - 18.4) < 0.25 || (t > 21.8 && t < 23.2)) ? 0.15 : 0; cam.position.copy(k.pos).add(V(Math.sin(t * 60) * shk, Math.sin(t * 47) * shk, 0)); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      dust.update(V(-6, 4.5, -13), V(0, 1, 1), 18.4, 19.2, t, 4, 4); dust.update(t > 21 ? V(6.5, 1, -13) : V(-6, 4.5, -13), V(0, 1, 1), t > 21 ? 21.8 : 18.4, t > 21 ? 23.6 : 19.2, t, 4, 7);
      showLabel(L.surr, V(0, 9, -8), t, 2.4, 4.0); showLabel(L.food, V(0, 9, -8), t, 4.2, 6.1); showLabel(L.months, V(0, 9, -8), t, 6.3, 8.3); showLabel(L.starve, V(0, 10.5, -13), t, 8.6, 10.6);
      showLabel(L.ramL, V(0, 4.0, rz), t, 12.0, 13.4); showLabel(L.gateL, V(0, 4.2, -11), t, 13.5, 14.8);
      showLabel(L.trebL, treb.position.clone().add(V(0, 9.5, 0)), t, 15.3, 17.6); showLabel(L.boulderL, V(-5, 9, -10), t, 17.8, 19.2);
      showLabel(L.tun, V(6.5, 3.0, -6), t, 19.8, 21.6); showLabel(L.coll, V(6.5, 9, -13), t, 21.8, 24.6);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
