import * as THREE from 'three';
import { labelCam, loadKit, world, texMat, person, label, showLabel, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 28.2;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { hdris: ['skylit_garage'], tex: ['metal_plate', 'concrete_wall_003', 'concrete_floor_02', 'rusty_metal_02', 'green_metal_rust'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;

function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 4, sunDir: [2, 9, 4] }), 'skylit_garage', { sky: false, sun: 1.2, env: 0.8 });
  scene.background = new THREE.Color(0x0b0d10);
  const lamp = new THREE.PointLight(0xfff2dd, 6, 6, 1.5); scene.add(lamp);
  const SH = 24, W = 2.6, D = 2.4; // shaft: floor at y=-12 .. top at +12, open towards the camera (cutaway)
  const wallM = texMat('concrete_wall_003', 2, 10);
  const back = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, SH, 0.3), wallM); back.position.set(0, 0, -D / 2 - 0.15); scene.add(back);
  for (const sx of [-1, 1]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.3, SH, D), wallM); s.position.set(sx * (W / 2 + 0.15), 0, 0); scene.add(s); }
  const pitF = new THREE.Mesh(new THREE.BoxGeometry(W, 0.3, D), texMat('concrete_floor_02', 2, 2)); pitF.position.set(0, -SH / 2, 0); scene.add(pitF);
  [back, pitF].forEach(m => { m.receiveShadow = true; });
  // guide rails
  const railM = texMat('green_metal_rust', 1, 12, { metalness: 0.7, roughness: 0.4 });
  const rails = []; for (const sx of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.12, SH, 0.16), railM); r.position.set(sx * (W / 2 - 0.08), 0, 0); scene.add(r); rails.push(r); }
  // the car (open front)
  const carM = texMat('metal_plate', 2, 2, { metalness: 0.8, roughness: 0.35 });
  const car = new THREE.Group(); const CW = 2.0, CH = 2.4, CD = 1.8;
  const panel = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), carM); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; car.add(m); };
  panel(CW, 0.08, CD, 0, 0, 0); panel(CW, 0.08, CD, 0, CH, 0); panel(CW, CH, 0.06, 0, CH / 2, -CD / 2); panel(0.06, CH, CD, -CW / 2, CH / 2, 0); panel(0.06, CH, CD, CW / 2, CH / 2, 0);
  const brakes = []; for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.3), texMat('rusty_metal_02', 1, 1, { color: 0xffd24a, metalness: 0.6 })); b.position.set(sx * (CW / 2 + 0.05), 0.15, 0); car.add(b); brakes.push(b); }
  scene.add(car);
  // 6 steel cables from the car roof up the shaft
  const cableM = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.9, roughness: 0.3 });
  const cables = []; for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 8), cableM.clone()); scene.add(c); cables.push(c); }
  // buffers at the bottom: 2 springs + 2 oil buffers
  const springs = []; for (const sx of [-0.5, 0.5]) { const pts = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 2 * 8; pts.push(V(Math.cos(a) * 0.18, i / 120 * 1.1, Math.sin(a) * 0.18)); }
    const sp = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.025, 8), new THREE.MeshStandardMaterial({ color: 0xd04030, metalness: 0.6, roughness: 0.35 })); sp.position.set(sx, -SH / 2 + 0.15, 0.35); scene.add(sp); springs.push(sp); }
  for (const sx of [-0.5, 0.5]) { const o = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.2, 24), new THREE.MeshStandardMaterial({ color: 0x2a2f35, metalness: 0.8, roughness: 0.3 })); o.position.set(sx, -SH / 2 + 0.75, -0.45); scene.add(o);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 16), new THREE.MeshStandardMaterial({ color: 0xd8dde3, metalness: 1, roughness: 0.15 })); rod.position.set(sx, -SH / 2 + 1.6, -0.45); scene.add(rod); }
  const sparks = stream(260, 0xffc040, 0.04); sparks.material.blending = THREE.AdditiveBlending; scene.add(sparks);
  const hero = person('hero'); scene.add(hero.root);
  const L = { worry: label("DON'T WORRY", 0.9), cab: label('SEVERAL STEEL CABLES', 2.2), each: label('EACH HOLDS THE FULL WEIGHT', 2.6), all: label('ALL CABLES BROKE?', 1.2), brake: label('SAFETY BRAKES', 1.1), rails: label('CLAMP THE RAILS', 1.1), spr: label('SPRINGS', 0.7), oil: label('OIL BUFFERS', 0.9), safe: label('ONE OF THE SAFEST WAYS TO TRAVEL', 2.4) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 200);
  return {
    scene, camera: cam,
    update(t) {
      // car height: steady, small drop when one cable snaps (2.3), freefall when all break (13.3), brakes catch at 16.2
      const fall = t < 13.3 ? 0 : t < 16.2 ? 0.5 * 9.8 * Math.pow((t - 13.3) * 0.32, 2) : 0.5 * 9.8 * Math.pow(2.9 * 0.32, 2);
      const carY = -0.1 * sm(2.3, 2.5, t) - fall;
      car.position.set(0, carY, 0);
      const snapped = (i) => (i === 0 && t > 2.3) || t > 13.3;
      cables.forEach((c, i) => { const x = -0.5 + i * 0.2, top = 12, bot = carY + CH + 0.04; const s = snapped(i); const end = s ? Math.max(bot, top - 6 - (t - (i === 0 && t < 13.3 ? 2.3 : 13.3)) * 3) : bot;
        const len = top - end; c.scale.y = Math.max(0.01, len); c.position.set(x, end + len / 2, 0); c.material.emissive = new THREE.Color(i === 2 && t > 9.2 && t < 11.6 ? 0x40a0ff : 0x000000); c.material.emissiveIntensity = 1.2; });
      const clamp = sm(16.0, 16.3, t); brakes.forEach((b, i) => { b.position.x = (i ? 1 : -1) * (CW / 2 + 0.05 + 0.06 * clamp); b.material.emissiveIntensity = 0; });
      lamp.position.set(0, carY + CH - 0.25, 0.2);
      const scared = sm(2.3, 2.6, t) * (1 - sm(4.0, 4.6, t)) + sm(13.3, 13.5, t) * (1 - sm(16.6, 17.4, t)), relax = sm(24.0, 24.5, t);
      hero.update(t, { idle: 1 }, 1, { flinch: scared, armsUp: 0.5 * sm(13.4, 13.6, t) * (1 - sm(16.2, 16.6, t)), point: 0.7 * relax, smile: 0 });
      hero.root.position.set(0.15, carY + 0.04, 0.1); hero.root.rotation.y = 0.1;
      // camera: in front of the open car, follows it down; dives to the pit for the buffers
      const pit = sm(18.4, 19.4, t) * (1 - sm(23.4, 24.2, t));
      const fol = V(1.0, carY + 1.5, 4.6), look = V(0, carY + 1.15, 0);
      const wide = sm(5.9, 6.6, t) * (1 - sm(11.6, 12.2, t));
      const pos = fol.clone().lerp(V(1.6, carY + 3.4, 7.0), wide).lerp(V(1.2, -SH / 2 + 2.2, 3.2), pit); const lk = look.clone().lerp(V(0, carY + 4.0, 0), wide).lerp(V(0, -SH / 2 + 0.9, 0), pit);
      const shk = (t > 2.3 && t < 2.6) || (t > 16.1 && t < 16.5) ? 0.05 : 0; cam.position.copy(pos).add(V(Math.sin(t * 70) * shk, Math.sin(t * 53) * shk, 0)); cam.lookAt(lk); labelCam(cam);
      scene.updateMatrixWorld(true);
      sparks.update(V(-CW / 2 - 0.1, carY + 0.15, 0), V(0, 1, 0.3), 16.1, 17.4, t, 1.2, 1.0);
      const head = hero.headPos(); const up = (y) => V(0, y, 0);
      showLabel(L.worry, head.clone().add(up(0.42)), t, 3.3, 5.6);
      showLabel(L.cab, V(0, carY + 4.6, 0.4), t, 6.4, 8.9); showLabel(L.each, V(0, carY + 4.6, 0.4), t, 9.1, 11.8);
      showLabel(L.all, head.clone().add(up(0.42)), t, 12.4, 14.2); showLabel(L.brake, V(0, carY + CH + 0.4, 0.5), t, 14.5, 16.0); showLabel(L.rails, V(0, carY + CH + 0.4, 0.5), t, 16.1, 18.2);
      showLabel(L.spr, V(0, -SH / 2 + 1.75, 0.35), t, 20.3, 21.4); showLabel(L.oil, V(0, -SH / 2 + 2.3, -0.45), t, 21.5, 23.4);
      showLabel(L.safe, head.clone().add(up(0.5)), t, 25.4, 28.2);
      return { bloom: 0.3, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
