import * as THREE from 'three';
import { labelCam, loadKit, prop, fit, creature, texMat, person, label, showLabel, xray, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 24.6;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/great_white_shark', 'sf/lifeboat', 'namaqualand_boulder_02'], tex: ['sand_01'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
// underwater view
function build({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [0, 10, 2], sun: 1.6 });
  scene.userData.sky.visible = false; const col = new THREE.Color(0x2a8fb8); scene.background = col; scene.fog = new THREE.FogExp2(0x2a8fb8, 0.06);
  scene.children.filter(o => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry' && !(o.material && o.material.isShadowMaterial)).forEach(o => o.visible = false);
  scene.userData.key.color.set(0xbfe8ff); scene.environmentIntensity = 0.5;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 48), texMat('sand_01', 14, 14, { color: 0xa8b8b0 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -3; floor.receiveShadow = true; scene.add(floor);
  for (const [x, z, s] of [[-3, -4, 1.4], [3.5, -6, 2]]) { const r = prop('namaqualand_boulder_02', s); r.position.set(x, -3, z); scene.add(r); }
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshBasicMaterial({ color: 0xbfefff, transparent: true, opacity: 0.35, side: THREE.DoubleSide })); surf.rotation.x = Math.PI / 2; surf.position.y = 2.2; scene.add(surf);
  const shark = creature('sf/great_white_shark', 4.2, 'max'); scene.add(shark.root);
  const boat = fit(prop('sf/lifeboat'), 2.4, 'max'); boat.position.set(-3.2, 2.05, -1.0); scene.add(boat);
  const hero = person('hero'); scene.add(hero.root);
  const splash = stream(300, 0xffffff, 0.06); scene.add(splash);
  const prey = ghost(prop('sf/great_white_shark'), 0xff6060); prey.visible = false;
  const rays = new THREE.Group(); for (let i = 0; i < 8; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide })); r.position.set(-6 + i * 1.7, -1, -3 - (i % 3)); r.rotation.z = 0.25; rays.add(r); } scene.add(rays);
  const marks = ['nose', 'eyes', 'gills'].map(n => { const m = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.13, 32), new THREE.MeshBasicMaterial({ color: 0xff3b30, toneMapped: false, depthTest: false, side: THREE.DoubleSide })); m.renderOrder = 30; scene.add(m); return m; });
  const L = { panic: label("DON'T PANIC", 1.2), prey: label('SPLASHING = WOUNDED PREY', 1.8), eyes: label('KEEP EYES ON IT', 1.5), back: label('BACK AWAY SLOWLY', 1.6), nose: label('NOSE', 0.9), eye: label('EYES', 0.9), gills: label('GILLS', 0.9), weak: label('WEAK SPOTS', 1.4), relax: label('RELAX', 1.1), odds: label('LIGHTNING IS MORE LIKELY', 2.0) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [2.2, 0.6, 6.2], [0.2, 0.6, 0]], [2.6, [1.6, 0.8, 4.4], [0, 0.8, 0]], [7.6, [1.6, 0.8, 4.4], [0, 0.8, 0]], [8.2, [1.0, 1.0, 7.0], [-0.2, 0.7, -0.8]], [12.6, [-0.4, 1.0, 7.4], [-0.9, 0.7, -0.5]],
    [13.2, [-0.7, 1.0, 7.8], [-0.7, 0.8, 0.2]], [18.6, [-0.7, 1.0, 7.8], [-0.7, 0.8, 0.2]], [19.4, [-0.4, 1.0, 5.2], [-1.4, 0.8, 0]], [24.6, [-0.4, 1.0, 5.2], [-1.4, 0.8, 0]]];
  return {
    scene, camera: cam,
    update(t) {
      shark.play(t, 0, 1);
      // shark circles (0-8), keeps distance while he backs off (8-12.9), charges (13-14), hit -> turns away (14.2+), swims off (19+)
      let sp, yaw;
      if (t < 13.0) { const a = t * 0.5; sp = V(1.0 + Math.cos(a) * 3.2, 0.2 + Math.sin(t * 0.7) * 0.2, -1.6 + Math.sin(a) * 1.8); yaw = -a; }
      else if (t < 14.1) { const u = sm(13.0, 14.1, t); sp = V(lerp(3.6, 0.4, u), 0.35, 0.4); yaw = -Math.PI / 2; }
      else if (t < 19.0) { sp = V(0.4 + 0.5 * sm(14.3, 15.0, t), 0.35, 0.4); yaw = -Math.PI / 2 + 0.06 * Math.sin(t * 2); }
      else { const u = sm(19.0, 23.0, t); sp = V(lerp(1.5, 10, u), 0.5, lerp(0.4, -7, u)); yaw = lerp(-Math.PI / 2, 2.4, sm(19.0, 19.8, t)); }
      shark.root.position.copy(sp); shark.root.rotation.y = yaw;
      const splashK = sm(3.8, 4.1, t) * (1 - sm(7.2, 7.6, t)), backK = sm(9.4, 12.6, t), punch = Math.max(0, 1 - Math.abs(t - 14.3) / 0.25, 1 - Math.abs(t - 15.4) / 0.25, 1 - Math.abs(t - 16.4) / 0.25);
      hero.update(t, { idle: 1 }, 0.5, { armsUp: 0.9 * splashK * Math.abs(Math.sin(t * 9)), spread: 0.4 * (1 - splashK), point: 0.9 * punch + 0.2 * sm(13.2, 13.6, t) * (1 - sm(17.0, 17.4, t)), lean: 0.3 * punch });
      hero.root.position.set(lerp(0, -1.9, backK), 0.4 + 0.08 * Math.sin(t * 1.1), lerp(0, 0.4, backK)); hero.root.rotation.set(0.1, Math.PI / 2 - 0.3, 0);
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos();
      splash.update(head.clone().add(V(0, 0.4, 0)), V(0, 1, 0), 3.9, 7.4, t, 1.2, 1.4);
      // weak spots relative to the shark's head (front of the body along -x in shark space after yaw)
      const fwd = V(Math.sin(yaw), 0, Math.cos(yaw));
      const nose = sp.clone().addScaledVector(fwd, 2.05).add(V(0, 0.82, 0)), eye = sp.clone().addScaledVector(fwd, 1.72).add(V(0, 1.0, 0.25)), gill = sp.clone().addScaledVector(fwd, 1.1).add(V(0, 0.82, 0.35));
      const mk = [[nose, 14.8], [eye, 15.7], [gill, 16.4]];
      marks.forEach((m, i) => { const vis = t > mk[i][1] && t < 18.6; m.visible = vis; m.position.copy(mk[i][0]); m.quaternion.copy(cam.quaternion); m.scale.setScalar(1 + 0.15 * Math.sin(t * 8)); });
      const up = (y) => V(0, y, 0);
      showLabel(L.panic, head.clone().add(up(0.45)), t, 2.6, 4.3); showLabel(L.prey, head.clone().add(up(0.45)), t, 5.6, 7.6);
      showLabel(L.eyes, head.clone().add(up(0.45)), t, 8.0, 9.5); showLabel(L.back, head.clone().add(up(0.45)), t, 9.6, 12.6);
      showLabel(L.nose, nose.clone().add(up(0.35)), t, 14.9, 18.6); showLabel(L.eye, eye.clone().add(up(0.35)), t, 15.8, 18.6); showLabel(L.gills, gill.clone().add(V(0.2, -0.4, 0)), t, 16.5, 18.6);
      showLabel(L.weak, sp.clone().add(up(2.0)), t, 17.4, 18.8); showLabel(L.relax, head.clone().add(up(0.45)), t, 19.0, 19.9); showLabel(L.odds, head.clone().add(up(0.55)), t, 20.0, 24.6);
      return { bloom: 0.25, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
