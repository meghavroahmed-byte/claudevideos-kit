import * as THREE from 'three';
import { labelCam, loadKit, world, prop, creature, person, label, showLabel, xray, ghost, keyCam, stream, waterMat, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 22.8;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/african_elephant', 'dead_tree_trunk'], hdris: ['rosendal_plains_2'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawBrain(g, k) {
  g.fillStyle = 'rgba(255,160,180,0.9)'; g.beginPath(); g.ellipse(256, 240, 170 * (0.6 + 0.4 * k), 120 * (0.6 + 0.4 * k), 0, 0, 6.283); g.fill();
  g.strokeStyle = 'rgba(120,0,40,0.4)'; g.lineWidth = 6; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(140 + i * 38, 230 + (i % 2) * 30, 30 * (0.6 + 0.4 * k), 0.4, 2.8); g.stroke(); }
  g.fillStyle = '#ffd24a'; g.font = '900 36px Cap, sans-serif'; g.textAlign = 'center'; g.fillText('~5 KG', 256, 440);
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 16, sunDir: [-5, 8, 4] }), 'rosendal_plains_2', { height: 3, radius: 80, sun: 2.2, sunColor: 0xfff0d0, env: 0.95 });
  const pond = new THREE.Mesh(new THREE.CircleGeometry(4, 48), waterMat(2.0, 0x5a7060)); pond.rotation.x = -Math.PI / 2; pond.position.set(-6, 0.02, -14); scene.add(pond);
  const tree = prop('dead_tree_trunk', 2); tree.position.set(5, 0, -10); scene.add(tree);
  const herd = []; for (let i = 0; i < 4; i++) { const e = creature('sf/african_elephant', i === 0 ? 3.3 : i === 3 ? 1.6 : 2.8, 'y'); scene.add(e.root); herd.push(e); }
  const old = creature('sf/african_elephant', 2.9, 'y'); ghost(old.root, 0xbfe6ff, { inPlace: true }); old.root.traverse(m => { if (m.isMesh) m.material.blending = THREE.NormalBlending; }); scene.add(old.root);
  const trail = stream(300, 0x9fd8ff, 0.12); scene.add(trail);
  const hero = person('hero'); scene.add(hero.root);
  const kindP = person('hero', { print: false }); ghost(kindP.root, 0x9fff9f, { inPlace: true }); scene.add(kindP.root);
  const xr = xray(1.6); scene.add(xr);
  const L = { pretty: label('PRETTY MUCH!', 1.2), brain: label('BIGGEST LAND-ANIMAL BRAIN', 2.2), mat: label('THE MATRIARCH', 4.0), water: label('REMEMBERS WATER', 5.0), dec: label('DECADES LATER', 4.0), drought: label('LEADS THE FAMILY', 4.4), friends: label('REMEMBERS OLD FRIENDS', 2.0), kind: label('KIND OR CRUEL PEOPLE', 1.6) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 600);
  const KEYS = [[0, [3.0, 1.7, 9.0], [0, 1.8, 0]], [2.2, [2.2, 1.6, 7.0], [0, 1.8, 0]], [6.4, [2.2, 1.6, 7.0], [0, 2.0, 0]], [7.0, [6, 6, 12], [-2, 1, -6]], [14.8, [6, 6, 12], [-4, 1, -10]], [15.4, [3.0, 1.8, 8.0], [0, 1.8, -1]], [22.8, [2.6, 1.7, 7.2], [0, 1.7, -1]]];
  const path = [V(-1.5, 0, -2.5), V(-2.5, 0, -6), V(-4, 0, -9), V(-5, 0, -11)];
  return {
    scene, camera: cam,
    update(t) {
      // herd walks to the water 9.2 - 14.5 following the matriarch
      const walkK = sm(9.0, 14.6, t);
      herd.forEach((e, i) => { const u = Math.max(0, walkK - i * 0.08); const seg = u * (path.length - 1); const j = Math.min(path.length - 2, Math.floor(seg)); const f = seg - j;
        const p = path[j].clone().lerp(path[j + 1], f).add(V(i ? (i % 2 ? 1.6 : -1.4) : 0, 0, i * 2.4)); const d = path[j + 1].clone().sub(path[j]);
        const moving = t > 9.0 && t < 14.6; e.play(t + i, moving ? '02_Walk' : '01_Idle', 1); e.root.position.copy(t < 9.0 ? path[0].clone().add(V(i ? (i % 2 ? 1.6 : -1.4) : 0, 0, i * 2.4)) : p); e.root.rotation.y = t < 9 ? -0.6 : Math.atan2(d.x, d.z); e.root.visible = t < 15.2 || i < 2; });
      if (t > 15.2) { herd[0].root.position.set(-1.2, 0, -2.0); herd[0].root.rotation.y = 0.6; herd[1].root.position.set(-3.6, 0, -3.5); herd[1].root.rotation.y = 0.7; }
      const ok = sm(15.2, 15.6, t) * (1 - sm(18.0, 18.4, t)); old.root.fade(0.7 * ok); old.play(t, '01_Idle', 1); old.root.position.set(1.6, 0, -3.0); old.root.rotation.y = -1.6;
      hero.update(t, { idle: 1 }, 1, { point: 0.6 * sm(2.6, 3.0, t) * (1 - sm(5.8, 6.2, t)) }); hero.root.position.set(1.3, 0, 2.2); hero.root.rotation.y = -0.6; hero.root.visible = t < 7.0 || t > 15.2;
      const kk = sm(18.4, 18.8, t); kindP.update(t, { idle: 1 }, 1, { point: 0.6 }); kindP.root.fade(0.7 * kk); kindP.root.position.set(-0.3, 0, 0.8); kindP.root.rotation.y = -0.3;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      trail.update(V(-1.5, 0.3, -2.5), V(-0.4, 0, -0.9), 10.0, 14.6, t, 3.2, 1.0);
      const mh = herd[0].root.position.clone().add(V(0, 3.9, 0));
      const xk = sm(3.6, 3.9, t) * (1 - sm(6.3, 6.6, t));
      if (xk > 0.01) xr.show(mh.clone().add(V(1.2, 0.0, 0)), xk, drawBrain, sm(4.0, 5.8, t), t); else xr.visible = false;
      showLabel(L.pretty, hero.headPos().add(V(0, 0.45, 0)), t, 2.4, 3.5); showLabel(L.brain, mh.clone().add(V(0, 1.2, 0)), t, 3.6, 6.6);
      showLabel(L.mat, mh, t, 6.8, 9.1); showLabel(L.water, V(-6, 3, -14), t, 9.2, 10.8); showLabel(L.dec, mh, t, 10.9, 12.5); showLabel(L.drought, mh, t, 12.6, 14.8);
      showLabel(L.friends, V(0, 4.6, -2.5), t, 15.2, 18.2); showLabel(L.kind, V(-0.3, 2.5, 0.8), t, 18.6, 22.8);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
