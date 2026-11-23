import * as THREE from 'three';
import { labelCam, loadKit, world, prop, texMat, person, label, showLabel, xray, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 26.2;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['propane_tank'], hdris: ['pizzo_pernice'], tex: ['snow_02'], people: ['hero', 'soldier'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
function drawO2(g, k) { // two lungs of dots: sea level vs summit
  g.fillStyle = '#fff'; g.font = '900 30px Cap, sans-serif'; g.textAlign = 'center'; g.fillText('SEA LEVEL', 130, 70); g.fillText('SUMMIT', 382, 70);
  g.strokeStyle = 'rgba(210,230,255,0.6)'; g.lineWidth = 4; g.beginPath(); g.moveTo(256, 90); g.lineTo(256, 470); g.stroke();
  g.fillStyle = '#7fd8ff'; for (let i = 0; i < 30; i++) { g.beginPath(); g.arc(50 + (i % 6) * 32, 120 + Math.floor(i / 6) * 60, 11, 0, 6.283); g.fill(); }
  for (let i = 0; i < Math.round(30 - 20 * k); i++) { g.beginPath(); g.arc(302 + (i % 6) * 32, 120 + Math.floor(i / 6) * 60, 11, 0, 6.283); g.fill(); }
}
function drawSwell(g, k) {
  g.fillStyle = 'rgba(255,160,180,0.9)'; g.beginPath(); g.ellipse(256, 160, 120 * (1 + 0.15 * k), 85 * (1 + 0.15 * k), 0, 0, 6.283); g.fill();
  for (const sx of [-1, 1]) { g.save(); g.translate(256 + sx * 80, 360); g.fillStyle = 'rgba(255,150,160,0.8)'; g.beginPath(); g.ellipse(0, 0, 60, 95, sx * 0.15, 0, 6.283); g.fill(); g.restore(); }
  g.fillStyle = 'rgba(120,200,255,0.7)'; for (let i = 0; i < 24 * k; i++) { g.beginPath(); g.arc(150 + (i * 47) % 220, 300 + (i * 31) % 150, 8, 0, 6.283); g.fill(); }
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 8, sunDir: [-5, 7, 3] }), 'pizzo_pernice', { height: 3, radius: 80, sun: 2.6, sunColor: 0xf0f6ff, env: 1.0 });
  const snow = new THREE.Mesh(new THREE.PlaneGeometry(120, 120, 80, 80), texMat('snow_02', 12, 12, { color: 0xf6faff }));
  { const p = snow.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.max(0, y - 6) * 0.06 + Math.sin(x * 0.4) * 0.15 * Math.min(1, Math.abs(y) / 4)); } snow.geometry.computeVertexNormals(); }
  snow.rotation.x = -Math.PI / 2; snow.receiveShadow = true; scene.add(snow);
  const flag = new THREE.Group(); { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0x888888 })); pole.position.y = 0.8; flag.add(pole); for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), new THREE.MeshStandardMaterial({ color: [0x2a6ad8, 0xffffff, 0xd83a2a, 0x2aa84a, 0xf0c020][i], side: THREE.DoubleSide })); f.position.set(0.18 + i * 0.32, 1.45 - i * 0.05, 0); flag.add(f); } } flag.position.set(-1.6, 0.2, -2.5); scene.add(flag);
  const hero = person('hero'); scene.add(hero.root);
  const climber = person('soldier', { print: false }); climber.root.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.multiply(new THREE.Color(0xff9a60)); } }); scene.add(climber.root);
  const tank = prop('propane_tank', 0.6); tank.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(0xd84020); } }); scene.add(tank);
  const breath = stream(240, 0xeaf6ff, 0.025); breath.material.opacity = 0.5; scene.add(breath);
  const windS = stream(1600, 0xffffff, 0.06); windS.material.opacity = 0.8; scene.add(windS);
  const xr = xray(0.48); scene.add(xr);
  const skin = []; hero.root.traverse(m => { if (m.isMesh) skin.push(m.material); });
  const L = { top: label('8,849 M', 0.8), third: label('1/3 OF THE OXYGEN', 1.2), heart: label('HEART POUNDS', 0.9), head: label('HEAD THROBS', 0.9), gasp: label('GASPING', 0.8), swell: label('BRAIN & LUNGS SWELL', 1.3), frost: label('FROSTBITE IN MINUTES', 1.3), death: label('THE DEATH ZONE', 1.2), o2: label('BOTTLED OXYGEN', 1.1) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 500);
  const KEYS = [[0, [2.4, 1.9, 6.4], [0, 1.2, 0]], [2.4, [0.6, 1.6, 2.8], [0, 1.35, 0]], [19.2, [0.6, 1.6, 2.8], [0, 1.35, 0]], [19.8, [2.4, 1.8, 5.2], [0.4, 1.1, -0.5]], [26.2, [2.4, 1.8, 5.2], [0.4, 1.1, -0.5]]];
  return {
    scene, camera: cam,
    update(t) {
      const pant = sm(7.8, 8.4, t) * (1 - sm(19.0, 19.6, t)), headK = sm(9.0, 9.4, t) * (1 - sm(10.3, 10.7, t)), gasp = sm(10.6, 11.0, t) * (1 - sm(12.6, 13.0, t));
      hero.update(t, { idle: 1 }, 1, { handsChest: 0.8 * pant * (1 - headK), facepalm: headK, lean: 0.45 * gasp + 0.2 * pant, slump: 0.3 * pant });
      hero.root.position.set(0, 0, 0); hero.root.rotation.y = 0.2; hero.root.visible = t < 19.6;
      const fb = sm(16.4, 18.4, t); skin.forEach(m => m.color.setRGB(1 - 0.2 * fb, 1 - 0.1 * fb, 1));
      climber.update(t, { walk: t > 19.6 && t < 22 ? 1 : 0, idle: 1 }, 0.7, { lean: 0.3 }); climber.root.visible = t > 19.4; climber.root.position.set(0.2, 0, -1.2 + 1.0 * sm(19.6, 22, t)); climber.root.rotation.y = Math.PI + 0.3;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = (t < 19.6 ? hero : climber).headPos(), chest = hero.world('Spine2');
      tank.visible = t > 22.2; tank.position.copy(climber.world('Spine2')).add(V(0, -0.1, -0.22).applyAxisAngle(V(0, 1, 0), 0.3)); tank.rotation.set(0, 0.3, 0);
      breath.update(head.clone().add(V(0, -0.06, 0.12)), V(0.1, 0.3, 1), 0, 26.2, t, 0.35, 0.3);
      windS.update(V(-10, 1.5, 0), V(1, 0, 0.1), 0, 26.2, t, 10, 8);
      const x1 = sm(3.4, 3.7, t) * (1 - sm(7.6, 7.9, t)), x2 = sm(13.1, 13.4, t) * (1 - sm(16.2, 16.5, t));
      if (x1 > 0.01) xr.show(head.clone().add(V(0.42, 0.05, 0.1)), x1, drawO2, sm(4.2, 6.4, t), t); else if (x2 > 0.01) xr.show(head.clone().add(V(0.38, 0.0, 0.1)), x2, drawSwell, sm(13.6, 15.6, t), t); else xr.visible = false;
      const lp = head.clone().add(V(0, 0.33, 0));
      showLabel(L.top, lp, t, 2.6, 3.5); showLabel(L.third, lp, t, 3.6, 7.6); showLabel(L.heart, lp, t, 7.9, 9.1); showLabel(L.head, lp, t, 9.2, 10.4); showLabel(L.gasp, lp, t, 10.5, 12.9);
      showLabel(L.swell, lp, t, 13.1, 16.2); showLabel(L.frost, lp, t, 16.3, 19.2); showLabel(L.death, lp.clone().add(V(0, 0.1, 0)), t, 19.6, 22.2); showLabel(L.o2, lp.clone().add(V(0, 0.1, 0)), t, 22.3, 26.2);
      return { bloom: 0.25, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
