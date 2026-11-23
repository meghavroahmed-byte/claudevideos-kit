import * as THREE from 'three';
import { labelCam, loadKit, world, texMat, person, label, showLabel, xray, keyCam, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 27.2;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { hdris: ['kloofendal_48d_partly_cloudy_puresky'], tex: ['leather_white'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
// ear cross-section: canal -> eardrum -> middle-ear pocket -> eustachian tube down to throat
function drawEar(g, k, t, mode) {
  g.fillStyle = 'rgba(236,190,160,1)'; g.fillRect(0, 0, 512, 512);
  g.fillStyle = 'rgba(12,20,38,1)'; g.fillRect(0, 200, 210, 70); // ear canal (outside air)
  g.beginPath(); g.ellipse(300, 235, 80, 70, 0, 0, 6.283); g.fill(); // middle ear pocket
  g.lineWidth = 34; g.strokeStyle = mode >= 2 && k > 0.3 ? 'rgba(12,20,38,1)' : 'rgba(150,90,80,1)'; g.beginPath(); g.moveTo(330, 290); g.quadraticCurveTo(360, 400, 300, 500); g.stroke(); // tube
  const bulge = mode === 1 ? 45 * k : mode === 2 ? 45 * (1 - k) : mode === 3 ? 45 * (1 - k) : 0;
  g.strokeStyle = '#ffd24a'; g.lineWidth = 10; g.beginPath(); g.moveTo(218, 175); g.quadraticCurveTo(218 - bulge * 2, 235, 218, 295); g.stroke(); // eardrum
  g.fillStyle = '#7fd8ff'; const n = mode === 0 ? 10 : 10; for (let i = 0; i < n; i++) { g.beginPath(); g.arc(260 + (i * 23) % 80, 205 + (i * 17) % 60, 7, 0, 6.283); g.fill(); }
  const outN = mode === 1 || mode === 2 ? 3 : 10; for (let i = 0; i < outN; i++) { g.beginPath(); g.arc(30 + (i * 37) % 160, 215 + (i * 19) % 40, 7, 0, 6.283); g.fill(); }
  if (mode >= 2 && k > 0.3) { for (let i = 0; i < 4; i++) { const u = (t * 0.8 + i / 4) % 1; g.beginPath(); g.arc(320 + 20 * Math.sin(u * 3), 480 - 190 * u, 7, 0, 6.283); g.fill(); } }
  g.fillStyle = '#fff'; g.font = '900 26px Cap, sans-serif'; g.fillText('EARDRUM', 160, 160); g.fillText('THROAT', 330, 480);
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-3, 6, 4] }), 'kloofendal_48d_partly_cloudy_puresky', { sky: false, sun: 1.0, env: 0.9 }); scene.background = new THREE.Color(0xd8dce2);
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
  door.visible = handle.visible = hole.visible = false;
  const hero = person('hero'); scene.add(hero.root);
  const xr = xray(0.38); scene.add(xr);
  const L = { pocket: label('AIR POCKET', 0.8), climb: label('PLANE CLIMBS', 0.9), drop: label('CABIN PRESSURE DROPS', 1.3), bulge: label('EARDRUM BULGES OUT', 1.3), tube: label('EUSTACHIAN TUBE', 1.1), swallow: label('SWALLOW OR YAWN', 1.1), pop: label('POP!', 0.8), clear: label('HEAR CLEARLY AGAIN', 1.2) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [1.4, 1.5, 3.2], [0.4, 1.1, 0]], [2.4, [1.0, 1.5, 2.3], [0.5, 1.3, 0]], [27.2, [1.0, 1.5, 2.3], [0.5, 1.3, 0]]];
  return {
    scene, camera: cam,
    update(t) {
      const tilt = 0.12 * sm(6.0, 7.0, t) * (1 - sm(13.6, 14.6, t)), discomfort = sm(12.4, 13.0, t) * (1 - sm(22.2, 22.6, t)), yawn = sm(19.3, 19.8, t) * (1 - sm(21.6, 22.0, t));
      cabin.rotation.z = tilt;
      hero.update(t, { idle: 1 }, 1, { facepalm: 0.7 * discomfort * (1 - yawn), armsUp: 0.6 * yawn, leanBack: 0.3 * yawn, lookUp: 0.4 * yawn });
      hero.mouth(yawn); hero.root.position.set(0.6, 0, 0.25); hero.root.rotation.set(0, 0.2, tilt);
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos();
      const mode = t < 6.0 ? 0 : t < 14.8 ? 1 : t < 22.2 ? 2 : 3; const kk = mode === 1 ? sm(9.4, 13.8, t) : mode === 2 ? sm(20.2, 21.6, t) : mode === 3 ? sm(22.2, 22.6, t) : 0;
      const xk = sm(2.6, 2.9, t);
      if (xk > 0.01) xr.show(head.clone().add(V(0.38, -0.12, 0.1)), xk, (g, a, tt) => drawEar(g, a, tt, mode), kk, t); else xr.visible = false;
      const lp = head.clone().add(V(-0.05, 0.3, 0));
      showLabel(L.pocket, lp, t, 4.2, 5.9); showLabel(L.climb, lp, t, 6.2, 7.4); showLabel(L.drop, lp, t, 7.5, 9.4); showLabel(L.bulge, lp, t, 12.3, 14.7);
      showLabel(L.tube, lp, t, 15.0, 18.3); showLabel(L.swallow, lp, t, 18.5, 22.1); showLabel(L.pop, lp, t, 22.2, 22.9); showLabel(L.clear, lp, t, 23.0, 27.2);
      return { bloom: 0.25, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
