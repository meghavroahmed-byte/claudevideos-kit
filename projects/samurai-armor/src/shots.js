import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, person, label, showLabel, xray, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 26.6;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/samurai_domaru', 'antique_katana_01'], hdris: ['studio_kominka_02'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawLacing(g, k) { // small plates (lames) laced with silk cords
  for (let r = 0; r < 6; r++) for (let c = 0; c < 9; c++) { const x = 40 + c * 50 + (r % 2) * 10, y = 90 + r * 58; g.fillStyle = r % 2 ? 'rgba(60,50,45,1)' : 'rgba(120,110,100,1)'; g.fillRect(x, y, 46, 50); }
  g.strokeStyle = '#d83a4a'; g.lineWidth = 7; for (let c = 0; c < 9; c++) { const x = 63 + c * 50; g.beginPath(); g.moveTo(x, 80); g.lineTo(x, 80 + 360 * k); g.stroke(); }
  g.fillStyle = '#fff'; g.font = '900 28px Cap, sans-serif'; g.fillText('IRON', 40, 470); g.fillText('LEATHER', 160, 470); g.fillStyle = '#ff7a8a'; g.fillText('SILK', 330, 470);
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-3, 6, 4] }), 'studio_kominka_02', { height: 1.6, radius: 10, sun: 1.3, env: 1.0 });
  const armor = fit(prop('sf/samurai_domaru'), 2.35, 'y'); armor.position.set(-0.45, 0, -0.4); armor.rotation.y = 0.2; scene.add(armor);
  const sword = prop('antique_katana_01', 1); scene.add(sword);
  const hero = person('hero'); scene.add(hero.root);
  const runner = person('hero', { print: false }); ghost(runner.root, 0xbfe6ff, { inPlace: true }); runner.root.traverse(m => { if (m.isMesh) m.material.blending = THREE.NormalBlending; }); scene.add(runner.root);
  const sparks = stream(160, 0xffd060, 0.04); sparks.material.blending = THREE.AdditiveBlending; scene.add(sparks);
  const rings = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.075, 32), new THREE.MeshBasicMaterial({ color: 0xff3b30, toneMapped: false, depthTest: false, side: THREE.DoubleSide })); m.renderOrder = 30; scene.add(m); return m; });
  const xr = xray(0.45); scene.add(xr);
  const L = { plates: label('HUNDREDS OF SMALL PLATES', 1.4), silk: label('LACED WITH SILK', 1.0), light: label('LIGHT & FLEXIBLE', 1.1), run: label('RUN · RIDE · FIGHT', 1.2), bounce: label('SLASH BOUNCES OFF', 1.2), gaps: label('AIM FOR THE GAPS', 1.2), neck: label('NECK', 0.5), pits: label('ARMPITS', 0.6), arms: label('INSIDE OF ARMS', 0.8) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.8, 1.5, 3.6], [0, 1.1, -0.2]], [2.6, [0.1, 1.6, 2.6], [-0.3, 1.45, -0.4]], [9.2, [0.1, 1.6, 2.6], [-0.3, 1.45, -0.4]], [9.8, [1.2, 1.5, 4.2], [0.2, 1.0, -0.4]], [15.2, [1.2, 1.5, 4.2], [0.2, 1.0, -0.4]],
    [15.8, [0.6, 1.55, 3.4], [-0.1, 1.3, -0.3]], [18.8, [0.6, 1.55, 3.4], [-0.1, 1.3, -0.3]], [19.4, [-0.2, 1.65, 2.2], [-0.45, 1.6, -0.4]], [26.6, [-0.2, 1.65, 2.2], [-0.45, 1.6, -0.4]]];
  return {
    scene, camera: cam,
    update(t) {
      const slash = sm(15.6, 16.2, t) * (1 - sm(18.4, 18.8, t)), hit = Math.max(0, 1 - Math.abs(t - 16.3) / 0.12, 1 - Math.abs(t - 17.4) / 0.12);
      hero.update(t, { idle: 1 }, 1, { point: 0.6 * sm(2.8, 3.2, t) * (1 - sm(8.8, 9.2, t)) + 0.9 * slash, lean: 0.3 * slash, leanBack: 0.4 * hit });
      hero.root.position.set(0.3, 0, 0.2); hero.root.rotation.y = -1.1;
      const rk = sm(10.4, 10.8, t) * (1 - sm(14.8, 15.2, t)); runner.update(t, { run: 1 }, 1.2, {}); runner.root.fade(0.75 * rk); runner.root.position.set(lerp(2.2, -2.2, ((t - 10.4) / 4.4) % 1), 0, -1.0); runner.root.rotation.y = -Math.PI / 2;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const hand = hero.world('RightHand'); sword.visible = slash > 0.01; sword.position.copy(hand); sword.rotation.set(0.3, -0.9, -1.2 + 1.0 * Math.sin(t * 3));
      const hitP = armor.position.clone().add(V(0.15, 1.5, 0.25));
      sparks.update(hitP, V(0.5, 0.6, 0.6), 16.25, 16.5, t, 1.2, 0.8); sparks.update(hitP, V(0.5, 0.6, 0.6), t < 17 ? 16.25 : 17.35, t < 17 ? 16.5 : 17.6, t, 1.2, 0.8);
      const gp = [[0, 1.73, 0.18, 21.9], [-0.33, 1.52, 0.15, 22.9], [0.33, 1.52, 0.15, 23.1], [0.37, 1.24, 0.15, 23.8]];
      rings.forEach((r, i) => { const [x, y, z, a] = gp[i]; r.visible = t > a; r.position.copy(armor.position).add(V(x, y, z).applyAxisAngle(V(0, 1, 0), armor.rotation.y)); r.quaternion.copy(cam.quaternion); r.scale.setScalar(1 + 0.2 * Math.sin(t * 8)); });
      const xk = sm(4.0, 4.3, t) * (1 - sm(9.0, 9.3, t));
      if (xk > 0.01) xr.show(armor.position.clone().add(V(0.55, 1.85, 0.1)), xk, drawLacing, sm(7.0, 8.6, t), t); else xr.visible = false;
      const ap = armor.position.clone().add(V(0.3, 2.5, 0));
      showLabel(L.plates, ap, t, 3.6, 7.0); showLabel(L.silk, ap, t, 7.1, 9.2); showLabel(L.light, ap, t, 9.4, 11.4); showLabel(L.run, V(0, 2.2, -1), t, 11.5, 15.0);
      showLabel(L.bounce, ap, t, 15.8, 18.8); showLabel(L.gaps, ap, t, 19.2, 21.8);
      showLabel(L.neck, rings[0].position.clone().add(V(0, 0.12, 0)), t, 22.3, 26.6); showLabel(L.pits, rings[1].position.clone().add(V(-0.2, 0, 0)), t, 23.1, 26.6); showLabel(L.arms, rings[3].position.clone().add(V(0.25, -0.12, 0)), t, 24.0, 26.6);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
