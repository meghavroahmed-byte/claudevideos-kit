import * as THREE from 'three';
import { labelCam, loadKit, world, prop, person, label, showLabel, xray, keyCam, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 26.2;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['SchoolDesk_01', 'SchoolChair_01'], hdris: ['school_hall'], people: ['hero', 'manuel', 'sophia', 'carla'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const yawnK = (t, at, d = 2.2) => sm(at, at + 0.6, t) * (1 - sm(at + d - 0.6, at + d, t));
function drawCool(g, k, t) { // brain with cool air streams
  g.fillStyle = 'rgba(255,150,170,0.85)'; g.beginPath(); g.ellipse(256, 230, 160, 110, 0, 0, 6.283); g.fill();
  g.strokeStyle = 'rgba(120,0,40,0.4)'; g.lineWidth = 5; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(150 + i * 42, 220 + (i % 2) * 30, 30, 0.4, 2.8); g.stroke(); }
  g.strokeStyle = '#7fd8ff'; g.lineWidth = 9; g.lineCap = 'round';
  for (let i = 0; i < 4; i++) { const y = 140 + i * 45, ph = (t * 1.4 + i * 0.3) % 1; g.globalAlpha = k; g.beginPath(); g.moveTo(30 + ph * 120, y); g.bezierCurveTo(140 + ph * 120, y - 20, 220 + ph * 120, y + 20, 300 + ph * 120, y); g.stroke(); } g.globalAlpha = 1;
  g.fillStyle = '#7fd8ff'; g.font = '900 60px Cap, sans-serif'; g.fillText('❄', 380, 440);
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 6, sunDir: [-3, 6, 4] }), 'school_hall', { height: 1.8, radius: 14, sun: 1.0, env: 1.0 });
  const desk = prop('SchoolDesk_01', 1); desk.position.set(0.0, 0, -0.8); scene.add(desk);
  const book = new THREE.Group(); { const cover = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.16), new THREE.MeshStandardMaterial({ color: 0x7a2a20, roughness: 0.6 })); const pages = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.032, 0.15), new THREE.MeshStandardMaterial({ color: 0xf2ecdc, roughness: 0.9 })); pages.position.x = 0.004; book.add(cover, pages); } scene.add(book);
  const hero = person('hero'); scene.add(hero.root);
  const friends = [['manuel', -1.0, -0.6, 0.35, 14.9], ['sophia', 1.0, -0.6, -0.35, 16.0], ['carla', -1.9, -1.6, 0.5, 19.4], ['manuel', 1.9, -1.7, -0.5, 20.2]].map(([k, x, z, ry, at]) => { const p = person(k, { print: false }); scene.add(p.root); return { p, x, z, ry, at }; });
  const xr = xray(0.45); scene.add(xr);
  const L = { jaw: label('JAW STRETCHES WIDE', 1.2), air: label('HUGE GULP OF AIR', 1.1), cool: label('COOLS YOUR BRAIN', 1.1), fan: label('LIKE A FAN', 0.8), weird: label('THE WEIRD PART', 1.0), see: label('SEE A YAWN → YAWN', 1.2), copy: label('YOUR BRAIN COPIES', 1.2), fam: label('FRIENDS & FAMILY', 1.1), read: label('EVEN READING!', 0.9), you: label('ARE YOU YAWNING?', 1.2) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.3, 1.5, 3.6], [0, 1.2, 0]], [2.2, [0.25, 1.6, 1.7], [0, 1.55, 0]], [7.6, [0.25, 1.6, 1.7], [0, 1.55, 0]], [8.0, [0.3, 1.6, 2.0], [0, 1.5, 0]], [12.0, [0.3, 1.6, 2.0], [0, 1.5, 0]],
    [12.8, [0.4, 1.7, 5.2], [0, 1.1, -0.9]], [21.2, [0.4, 1.7, 5.2], [0, 1.1, -0.9]], [22.0, [0.3, 1.5, 2.6], [0, 1.25, 0]], [26.2, [0.2, 1.55, 2.0], [0, 1.45, 0]]];
  return {
    scene, camera: cam,
    update(t) {
      const hy = Math.max(yawnK(t, 2.4, 4.8), yawnK(t, 15.6), yawnK(t, 23.0, 3.0));
      const reading = sm(21.4, 21.8, t);
      hero.update(t, { idle: 1 }, 1, { armsUp: 0.75 * hy * (1 - reading), leanBack: 0.35 * hy, lookUp: 0.45 * hy, point: 0.6 * reading * (1 - hy * 0.5), lookDown: 0.3 * reading * (1 - hy) });
      hero.mouth(hy); hero.root.position.set(0, 0, 0); hero.root.rotation.y = 0;
      friends.forEach(({ p, x, z, ry, at }) => { const y = yawnK(t, at); p.update(t + x, { idle: 1 }, 1, { armsUp: 0.7 * y, leanBack: 0.3 * y, lookUp: 0.4 * y }); p.mouth(y); p.root.position.set(x, 0, z); p.root.rotation.y = ry; p.root.visible = t > 12.4 && t < 21.6; });
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos(); book.visible = reading > 0.01; book.position.copy(hero.world('RightHand')).add(V(0, 0.02, 0.08)); book.rotation.set(-1.1, 0, 0);
      const xk = sm(7.9, 8.2, t) * (1 - sm(11.9, 12.2, t));
      if (xk > 0.01) xr.show(head.clone().add(V(0.36, 0.12, 0.1)), xk, drawCool, sm(8.8, 10.0, t), t); else xr.visible = false;
      const up = (y) => V(0, y, 0);
      showLabel(L.jaw, head.clone().add(up(0.3)), t, 3.6, 5.0); showLabel(L.air, head.clone().add(up(0.3)), t, 5.2, 7.6);
      showLabel(L.cool, head.clone().add(V(-0.1, 0.3, 0)), t, 8.8, 10.6); showLabel(L.fan, head.clone().add(V(-0.1, 0.3, 0)), t, 10.7, 12.0);
      showLabel(L.weird, V(0, 2.3, -0.9), t, 12.3, 13.8); showLabel(L.see, V(0, 2.3, -0.9), t, 14.0, 17.2);
      showLabel(L.copy, V(0, 2.3, -0.9), t, 17.4, 19.6); showLabel(L.fam, V(0, 2.3, -0.9), t, 19.7, 21.5);
      showLabel(L.read, head.clone().add(up(0.36)), t, 21.6, 23.6); showLabel(L.you, head.clone().add(up(0.33)), t, 23.8, 26.2);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
