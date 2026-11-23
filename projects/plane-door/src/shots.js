import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, texMat, person, label, showLabel, xray, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 26.6;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['covered_car', 'vintage_suitcase'], hdris: ['kloofendal_48d_partly_cloudy_puresky'], tex: ['white_plaster_02', 'floor_pattern_02', 'leather_white'], people: ['hero', 'sophia', 'eric'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawPlug(g, k) { // door plug: wider than the frame, pressure arrows push it into the frame
  g.fillStyle = 'rgba(200,210,225,0.95)'; g.fillRect(60, 120, 70, 280); g.fillRect(382, 120, 70, 280); // frame
  g.fillStyle = '#ffd24a'; g.beginPath(); g.moveTo(110, 140); g.lineTo(402, 140); g.lineTo(402, 380); g.lineTo(110, 380); g.fill(); // door (overlaps frame)
  g.fillStyle = '#7fd8ff'; for (let i = 0; i < 4; i++) { const y = 160 + i * 60, x = 30 + 40 * Math.sin(k * 6 + i); g.beginPath(); g.moveTo(x + 10, y); g.lineTo(x + 60, y + 20); g.lineTo(x + 10, y + 40); g.fill(); }
  g.fillStyle = '#ffffff'; g.font = '900 38px Cap, sans-serif'; g.textAlign = 'center'; g.fillText('INSIDE', 256, 470); g.fillText('OUTSIDE', 256, 80);
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-3, 6, 4] }), 'kloofendal_48d_partly_cloudy_puresky', { sky: false, sun: 1.0, env: 0.9 }); scene.background = new THREE.Color(0xd8dce2);
  // cabin: long tube interior, open to the camera side
  const wall = texMat('white_plaster_02', 4, 1, { color: 0xeceae4 });
  const cabin = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 3.6), new THREE.MeshStandardMaterial({ color: 0x3a4660, roughness: 0.95 })); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.005; floor.receiveShadow = true; cabin.add(floor);
  const plaster = new THREE.MeshStandardMaterial({ color: 0xeeece6, roughness: 0.7 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(16, 2.4, 0.12), plaster); back.position.set(0, 1.2, -1.72); back.receiveShadow = true; cabin.add(back);
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(16, 0.1, 4), plaster); ceil.position.set(0, 2.35, 0); cabin.add(ceil);
  const bins = new THREE.Mesh(new THREE.BoxGeometry(16, 0.38, 0.55), new THREE.MeshStandardMaterial({ color: 0xdcdad4, roughness: 0.5 })); bins.position.set(0, 2.08, -1.38); cabin.add(bins);
  const winM = new THREE.MeshBasicMaterial({ color: 0xbfe0ff, toneMapped: false });
  for (let i = 0; i < 12; i++) { const x = -5.6 + i * 1.0; if (Math.abs(x - 2.0) < 0.7 || Math.abs(x + 1.0) < 0.5) continue; const w = new THREE.Mesh(new THREE.CircleGeometry(0.14, 24), winM); w.scale.y = 1.45; w.position.set(x, 1.32, -1.65); cabin.add(w); }
  const lightStrip = new THREE.Mesh(new THREE.BoxGeometry(16, 0.03, 0.12), new THREE.MeshBasicMaterial({ color: 0xfff6e0, toneMapped: false })); lightStrip.position.set(0, 2.3, -0.4); cabin.add(lightStrip);
  const cabLight = new THREE.PointLight(0xfff4e0, 6, 9, 1.2); cabLight.position.set(0.5, 2.0, 0.6); scene.add(cabLight);
  const seatM = texMat('leather_white', 1, 1, { color: 0x2a3a5a });
  for (let r = 0; r < 6; r++) for (const sx of [-1.1, -0.6]) { const seat = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.5), seatM); b.position.y = 0.45; const back = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.75, 0.1), seatM); back.position.set(0, 0.85, 0.24); seat.add(b, back); seat.position.set(-5 + r * 1.0, 0, sx); seat.rotation.y = Math.PI / 2; seat.children.forEach(m => m.castShadow = true); cabin.add(seat); }
  // door on the far wall (z = -1.6)
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.9, 0.12), new THREE.MeshStandardMaterial({ color: 0xd8dade, metalness: 0.5, roughness: 0.35 })); door.position.set(2.0, 1.0, -1.62); door.castShadow = true; cabin.add(door);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.08), new THREE.MeshStandardMaterial({ color: 0xff4a20, roughness: 0.5 })); handle.position.set(2.0, 1.05, -1.53); cabin.add(handle);
  const win = new THREE.Mesh(new THREE.CircleGeometry(0.12, 24), new THREE.MeshBasicMaterial({ color: 0xbfe0ff })); win.position.set(2.0, 1.45, -1.55); cabin.add(win);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.4, 32), new THREE.MeshBasicMaterial({ color: 0xcfe8ff, toneMapped: false })); hole.position.set(-1.0, 1.4, -1.58); cabin.add(hole);
  scene.add(cabin);
  const masks = []; for (let i = 0; i < 6; i++) { const m = new THREE.Group(); const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0xffd24a, roughness: 0.6 })); const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.6, 6), new THREE.MeshStandardMaterial({ color: 0xffffff })); tube.position.y = 0.34; m.add(cup, tube); m.position.set(-5 + i * 1.0, 2.1, -0.85); cabin.add(m); masks.push(m); }
  const hero = person('hero'); scene.add(hero.root);
  const pax = [['sophia', -1.0, -0.6], ['eric', 0.0, -1.1]].map(([k, x, z]) => { const p = person(k, { print: false }); scene.add(p.root); return { p, x, z }; });
  const cars = []; for (let i = 0; i < 7; i++) { const c = ghost(prop('covered_car'), 0xbfe6ff); c.scale.setScalar(0.22); scene.add(c); cars.push(c); }
  const loose = [0, 1, 2].map(() => { const s = prop('vintage_suitcase', 0.8); scene.add(s); return s; });
  const papers = stream(200, 0xffffff, 0.06); scene.add(papers);
  const myMask = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0xffd24a, roughness: 0.6 })); scene.add(myMask);
  const fog = stream(400, 0xe8f2ff, 0.3); fog.material.opacity = 0.15; scene.add(fog);
  const xr = xray(0.5); scene.add(xr);
  const L = { cant: label("YOU CAN'T!", 0.9), cars: label('= 7 CARS PUSHING', 1.2), plug: label('DOOR = PLUG', 0.9), seal: label('SEALS TIGHTER', 0.9), hole: label('A HOLE?', 0.7), suck: label('THINGS SUCKED OUT', 1.1), masks: label('OXYGEN MASKS DROP', 1.2), min: label('< 1 MINUTE', 0.9), first: label('YOUR MASK FIRST!', 1.1) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(44, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [1.6, 1.5, 2.6], [1.8, 1.1, -1.4]], [4.4, [1.6, 1.5, 2.6], [1.8, 1.1, -1.4]], [5.0, [1.2, 1.6, 2.4], [2.0, 1.2, -1.5]], [9.8, [1.2, 1.6, 2.4], [2.0, 1.2, -1.5]], [10.4, [2.4, 1.4, 1.8], [2.0, 1.1, -1.5]], [15.0, [2.4, 1.4, 1.8], [2.0, 1.1, -1.5]],
    [15.6, [0.6, 1.5, 2.6], [-0.8, 1.2, -1.0]], [20.4, [0.6, 1.5, 2.6], [-0.8, 1.4, -1.0]], [21.0, [1.6, 1.5, 1.8], [1.0, 1.25, -0.4]], [26.6, [1.6, 1.5, 1.8], [1.0, 1.25, -0.4]]];
  return {
    scene, camera: cam,
    update(t) {
      const pull = t > 1.4 && t < 4.6 ? Math.abs(Math.sin(t * 5)) : 0, gasp = sm(21.0, 21.4, t) * (1 - sm(23.4, 23.8, t)), mask = sm(23.6, 24.4, t);
      hero.update(t, { idle: 1 }, 1, { point: 0.9 * (t > 1.2 && t < 4.8 ? 1 : 0), lean: 0.3 * pull, handsThroat: 0.6 * gasp, facepalm: 0.9 * mask, flinch: 0.5 * sm(15.7, 16.0, t) * (1 - sm(17.0, 17.4, t)) });
      hero.root.position.set(t < 15.4 ? 1.35 : 0.9, 0, t < 15.4 ? -0.95 : -0.1); hero.root.rotation.y = t < 15.4 ? 2.3 : 0.35;
      pax.forEach(({ p, x, z }, i) => { p.update(t + i, { idle: 1 }, 1, { flinch: sm(15.8, 16.2, t), facepalm: sm(20.0, 20.6, t) }); p.root.position.set(x, 0, z); p.root.rotation.y = 0.2 - i * 0.4; p.root.visible = t > 15.4; });
      hole.visible = t > 15.6; hole.scale.setScalar(sm(15.6, 15.9, t));
      // pressure: ghost cars pushing on the door
      cars.forEach((c, i) => { const k = sm(8.6 + i * 0.1, 8.8 + i * 0.1, t) * (1 - sm(9.9, 10.2, t)); c.fade(0.9 * k); c.position.set(1.65 + (i % 4) * 0.22, 0.55 + Math.floor(i / 4) * 0.42, -1.25); c.rotation.y = Math.PI / 2; });
      // loose things sucked out
      loose.forEach((s, i) => { const u = sm(17.0 + i * 0.3, 18.2 + i * 0.3, t); s.visible = t > 15.4 && u < 0.98; s.position.set(lerp(-0.2 + i * 0.5, -1.0, u), lerp(0.6, 1.4, u), lerp(0.3, -1.5, u)); s.rotation.set(u * 6, u * 4, 0); s.scale.setScalar(0.8 * (1 - 0.7 * u)); });
      masks.forEach((m, i) => { const u = sm(19.2 + i * 0.05, 19.7 + i * 0.05, t); m.position.y = lerp(2.1, 1.55, u) + Math.sin(t * 6 + i) * 0.02 * u; m.visible = t > 19.1; });
      const k = keyCam(KEYS, t); const shk = t > 15.6 && t < 20.4 ? 0.02 : 0; cam.position.copy(k.pos).add(V(Math.sin(t * 50) * shk, Math.sin(t * 41) * shk, 0)); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      papers.update(V(0.6, 1.0, 0.2), V(-1, 0.25, -0.8), 16.2, 20.4, t, 1.8, 0.6);
      fog.update(V(-1.0, 1.4, -1.5), V(0.4, 0, 1), 15.8, 26.6, t, 1.0, 1.2);
      const xk = sm(10.4, 10.7, t) * (1 - sm(14.8, 15.1, t));
      if (xk > 0.01) xr.show(V(1.3, 1.65, -1.4), xk, drawPlug, (t - 10.4) * 0.6, t); else xr.visible = false;
      const head = hero.headPos(); const up = (y) => V(0, y, 0);
      myMask.visible = mask > 0.6; myMask.position.copy(head).add(V(0.02, -0.08, 0.1)); myMask.rotation.set(Math.PI / 2, 0, 0);
      showLabel(L.cant, head.clone().add(up(0.35)), t, 3.0, 4.7); showLabel(L.cars, V(2.0, 1.75, -1.4), t, 8.4, 10.2);
      showLabel(L.plug, V(2.0, 2.0, -1.4), t, 10.8, 12.8); showLabel(L.seal, V(2.0, 2.0, -1.4), t, 12.9, 15.0);
      showLabel(L.hole, V(-1.0, 2.0, -1.4), t, 15.6, 16.9); showLabel(L.suck, V(-0.4, 2.0, -1.0), t, 17.0, 18.8); showLabel(L.masks, V(-0.4, 2.0, -0.8), t, 19.0, 20.6);
      showLabel(L.min, head.clone().add(up(0.35)), t, 21.0, 23.4); showLabel(L.first, head.clone().add(up(0.35)), t, 23.5, 26.6);
      return { bloom: 0.25, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
