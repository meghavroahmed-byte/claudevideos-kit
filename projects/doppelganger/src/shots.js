import * as THREE from 'three';
import { labelCam, loadKit, world, person, label, showLabel, xray, ghost, keyCam, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 24.2;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { hdris: ['wide_street_01'], people: ['hero', 'eric', 'carla', 'claudia', 'sophia', 'manuel'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawFace(g, k, t) { // face scan: landmarks + mesh
  g.strokeStyle = 'rgba(120,230,255,0.9)'; g.lineWidth = 3;
  const P = [[256, 120], [190, 190], [322, 190], [256, 250], [210, 320], [302, 320], [256, 400], [160, 260], [352, 260], [256, 180], [220, 230], [292, 230]];
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { if ((i * 7 + j * 3) % 4) continue; g.beginPath(); g.moveTo(...P[i]); g.lineTo(...P[j]); g.stroke(); }
  g.fillStyle = '#5dff8a'; P.forEach(([x, y], i) => { if (i / P.length < k) { g.beginPath(); g.arc(x, y, 8, 0, 6.283); g.fill(); } });
  const sy = 80 + ((t * 260) % 360); g.strokeStyle = 'rgba(93,255,138,0.8)'; g.lineWidth = 6; g.beginPath(); g.moveTo(40, sy); g.lineTo(472, sy); g.stroke();
}
function drawDNA(g, k, t) {
  for (let i = 0; i < 18; i++) { const y = 60 + i * 22, a = i * 0.55 + t * 2; const x1 = 256 + Math.sin(a) * 110, x2 = 256 - Math.sin(a) * 110;
    g.strokeStyle = i / 18 < k ? '#ffd24a' : 'rgba(210,230,255,0.5)'; g.lineWidth = 6; g.beginPath(); g.moveTo(x1, y); g.lineTo(x2, y); g.stroke();
    g.fillStyle = '#7fd8ff'; g.beginPath(); g.arc(x1, y, 9, 0, 6.283); g.fill(); g.fillStyle = '#ff8fb0'; g.beginPath(); g.arc(x2, y, 9, 0, 6.283); g.fill(); }
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 8, sunDir: [-4, 8, 3] }), 'wide_street_01', { height: 2.2, radius: 60, sun: 1.8, env: 0.9 });
  const hero = person('hero'); scene.add(hero.root);
  const twin = person('hero', { print: false, shirt: 0x3a6e9a }); scene.add(twin.root);
  // passers-by
  const kinds = ['eric', 'carla', 'claudia', 'sophia', 'manuel']; const crowd = [];
  for (let i = 0; i < 14; i++) { const p = person(kinds[i % 5], { print: false }); scene.add(p.root); crowd.push({ p, x: -5 + (i * 2.3) % 10, z: -2.5 - (i % 4) * 1.6, dir: i % 2 ? 1 : -1, sp: 0.9 + (i % 3) * 0.2 }); }
  const looks = []; for (let i = 0; i < 7; i++) { const p = person('hero', { print: false }); ghost(p.root, 0xbfe6ff, { inPlace: true }); p.root.traverse(m => { if (m.isMesh) m.material.blending = THREE.NormalBlending; }); scene.add(p.root); looks.push(p); }
  const xr = xray(0.42); scene.add(xr);
  const L = { q: label('A TWIN?', 1.0), bil: label('8 BILLION PEOPLE', 2.4), some: label('A TWIN SOMEWHERE?', 2.4), sci: label('FACE SCAN', 0.8), tril: label('1 IN A TRILLION', 1.1), seven: label('~7 LOOKALIKES', 2.2), dna: label('SIMILAR DNA!', 0.9) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 500);
  const KEYS = [[0, [1.6, 1.5, 5.2], [0, 1.2, 0]], [3.2, [1.6, 1.5, 5.2], [0, 1.2, 0]], [4.2, [3.0, 2.6, 9.0], [0, 1.2, -2]], [7.8, [3.0, 2.6, 9.0], [0, 1.2, -2]],
    [8.6, [0.2, 1.6, 2.0], [-0.1, 1.5, 0]], [13.6, [0.2, 1.6, 2.0], [-0.1, 1.5, 0]], [14.4, [0.6, 1.8, 7.6], [0, 1.0, -1]], [19.8, [0.6, 1.8, 7.6], [0, 1.0, -1]], [20.4, [1.2, 1.5, 4.2], [0.3, 1.25, 0]], [24.2, [1.2, 1.5, 4.2], [0.3, 1.25, 0]]];
  return {
    scene, camera: cam,
    update(t) {
      const meet = sm(0.6, 1.6, t);
      hero.update(t, { idle: 1 }, 1, { flinch: 0.4 * sm(1.6, 1.9, t) * (1 - sm(3.0, 3.4, t)), point: sm(20.4, 20.8, t) * 0.7 });
      hero.root.position.set(-0.3, 0, 0); hero.root.rotation.y = 0.35;
      const tw = (t < 8.4) || (t > 20.0);
      twin.update(t + 0.6, { idle: 1 }, 1, { flinch: 0.4 * sm(1.6, 1.9, t) * (1 - sm(3.0, 3.4, t)) }); twin.root.visible = tw;
      twin.root.position.set(lerp(2.2, 0.75, meet), 0, lerp(-0.8, 0.25, meet)); twin.root.rotation.y = -0.9;
      const busy = sm(3.6, 4.4, t) * (1 - sm(8.2, 8.6, t)) + (t < 3.4 ? 0.5 : 0);
      crowd.forEach(({ p, x, z, dir, sp }, i) => { const vis = i < 6 ? t < 8.4 || t > 14 : busy > 0.3 && t < 8.4; p.root.visible = vis; if (!vis) return;
        p.update(t + i, { walk: 1 }, sp, {}); p.root.position.set(((x + dir * sp * 1.2 * t + 30) % 12) - 6, 0, z); p.root.rotation.y = dir * Math.PI / 2; });
      looks.forEach((p, i) => { const k = sm(16.6 + i * 0.25, 16.9 + i * 0.25, t) * (1 - sm(19.8, 20.2, t)); p.update(t + i * 0.3, { idle: 1 }, 1, {}); p.root.fade(0.7 * k);
        p.root.position.set(-2.7 + i * 0.9, 0, -1.2 - Math.abs(i - 3) * 0.3); p.root.rotation.y = 0.05 * (3 - i); });
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos(), th = twin.headPos();
      const x1 = sm(9.0, 9.3, t) * (1 - sm(13.4, 13.7, t)), x2 = sm(21.4, 21.7, t);
      if (x1 > 0.01) xr.show(head.clone().add(V(0.33, 0.12, 0.1)), x1, drawFace, sm(9.4, 12.0, t), t);
      else if (x2 > 0.01) xr.show(head.clone().lerp(th, 0.5).add(V(0, 0.5, 0.2)), x2, drawDNA, sm(21.8, 23.2, t), t); else xr.visible = false;
      const up = (y) => V(0, y, 0);
      showLabel(L.q, th.clone().add(up(0.4)), t, 1.8, 3.3); showLabel(L.bil, V(0, 3.2, -2), t, 4.0, 6.0); showLabel(L.some, V(0, 3.2, -2), t, 6.1, 8.2);
      showLabel(L.sci, head.clone().add(V(-0.12, 0.24, 0.1)), t, 9.0, 10.9); showLabel(L.tril, head.clone().add(V(-0.12, 0.24, 0.1)), t, 11.1, 13.6);
      showLabel(L.seven, V(0, 2.6, -1.4), t, 17.2, 19.9); showLabel(L.dna, head.clone().lerp(th, 0.5).add(up(1.0)), t, 22.4, 24.2);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
