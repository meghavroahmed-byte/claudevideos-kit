import * as THREE from 'three';
import { labelCam, loadKit, world, prop, person, label, showLabel, xray, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 25.8;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['classic_laptop', 'metal_office_desk'], hdris: ['cayley_interior'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
function drawEye(g, k, t, mode) { // eye front view with lid wiping; mode 0 normal wipe, 1 dry eye (cracks), counter text
  g.fillStyle = '#f4f0ea'; g.beginPath(); g.ellipse(256, 256, 200, 120, 0, 0, 6.283); g.fill();
  g.fillStyle = '#4a7aa0'; g.beginPath(); g.arc(256, 256, 80, 0, 6.283); g.fill(); g.fillStyle = '#0a0a0a'; g.beginPath(); g.arc(256, 256, 34, 0, 6.283); g.fill();
  if (mode === 0) { g.fillStyle = 'rgba(160,110,90,0.8)'; for (let i = 0; i < 8; i++) { const x = 120 + (i * 41) % 280, y = 200 + (i * 23) % 120; if (Math.sin(t * 1.4) * 0.5 + 0.5 < x / 512) { g.beginPath(); g.arc(x, y, 6, 0, 6.283); g.fill(); } } }
  if (mode === 1) { g.strokeStyle = '#e04040'; g.lineWidth = 3; for (let i = 0; i < 10; i++) { g.beginPath(); const a = i * 0.63; g.moveTo(256 + Math.cos(a) * 190, 256 + Math.sin(a) * 110); g.lineTo(256 + Math.cos(a + 0.2) * 120, 256 + Math.sin(a + 0.2) * 80); g.stroke(); } }
  const lid = mode === 0 ? Math.max(0, Math.sin(t * 1.4)) : Math.max(0, Math.sin(t * 0.5)) ** 8;
  g.fillStyle = 'rgba(232,188,160,1)'; g.fillRect(40, 120, 432, 270 * lid);
  g.strokeStyle = '#5a3a2a'; g.lineWidth = 8; g.beginPath(); g.moveTo(56, 120 + 270 * lid); g.lineTo(456, 120 + 270 * lid); g.stroke();
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-3, 6, 4] }), 'cayley_interior', { height: 1.6, radius: 10, sun: 1.0, env: 1.0 });
  const desk = prop('metal_office_desk'); desk.position.set(0, 0, 0.62); desk.rotation.y = Math.PI; scene.add(desk);
  const laptop = prop('classic_laptop', 0.6); laptop.position.set(0, 0.76, 0.5); laptop.rotation.y = Math.PI; scene.add(laptop);
  const screen = new THREE.PointLight(0x9fc8ff, 0, 1.5, 1.6); screen.position.set(0, 1.0, 0.45); scene.add(screen);
  const hero = person('hero'); scene.add(hero.root);
  const lids = []; hero.root.traverse(o => { if (o.isBone && /eyelid/i.test(o.name) && !/end/i.test(o.name)) lids.push([o, o.quaternion.clone()]); });
  const counter = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const t = new THREE.CanvasTexture(c); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, toneMapped: false })); s.renderOrder = 41; s.scale.set(0.7, 0.175, 1); s.set = (txt) => { const g = c.getContext('2d'); g.clearRect(0, 0, 512, 128); g.font = '900 96px Cap, sans-serif'; g.textAlign = 'center'; g.lineWidth = 18; g.strokeStyle = '#000'; g.strokeText(txt, 256, 100); g.fillStyle = '#ffd24a'; g.fillText(txt, 256, 100); t.needsUpdate = true; }; return s; })(); scene.add(counter);
  const xr = xray(0.42); scene.add(xr);
  const L = { min: label('15 / MINUTE', 0.9), sec: label('1/3 SECOND EACH', 1.1), hour: label('EYES CLOSED 1+ HOUR / DAY', 1.5), wiper: label('LIKE A WINDSHIELD WIPER', 1.4), dust: label('WASHES AWAY DUST', 1.1), screenL: label('SCREEN = FEWER BLINKS', 1.4), dry: label('DRY EYES!', 0.9) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.4, 1.7, 3.0], [0, 1.25, 0]], [2.2, [0.3, 1.66, 2.0], [0.08, 1.55, 0]], [19.2, [0.3, 1.66, 2.0], [0.08, 1.55, 0]], [19.8, [0.5, 1.75, 2.4], [0, 1.35, 0.2]], [25.8, [0.5, 1.75, 2.4], [0, 1.35, 0.2]]];
  return {
    scene, camera: cam,
    update(t) {
      const stare = t > 19.6;
      const period = stare ? 4.5 : 1.2; const ph = (t % period) / period; const blink = ph < 0.08 ? Math.sin(ph / 0.08 * Math.PI) : 0;
      hero.update(t, { idle: 1 }, 1, { lookDown: stare ? 0.45 : 0, point: stare ? 0.5 : 0, pointL: stare ? 0.5 : 0, facepalm: 0.7 * sm(23.0, 23.4, t) });
      lids.forEach(([b, q0]) => { b.quaternion.copy(q0); b.rotateX(1.2 * blink); });
      hero.root.position.set(0, 0, 0); desk.visible = laptop.visible = stare; screen.intensity = stare ? 2 : 0;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos();
      const n = Math.round(15000 * sm(4.5, 6.8, t)); counter.visible = t > 4.4 && t < 7.6; counter.position.copy(head).add(V(0, 0.32, 0)); counter.set(n.toLocaleString('en-US'));
      const x1 = sm(14.6, 14.9, t) * (1 - sm(19.4, 19.7, t)), x2 = sm(22.6, 22.9, t);
      if (x1 > 0.01) xr.show(head.clone().add(V(0.36, 0.02, 0.1)), x1, (g, a, tt) => drawEye(g, a, tt, 0), 1, t); else if (x2 > 0.01) xr.show(head.clone().add(V(0.38, 0.05, 0.1)), x2, (g, a, tt) => drawEye(g, a, tt, 1), 1, t); else xr.visible = false;
      const lp = head.clone().add(V(0, 0.32, 0));
      showLabel(L.min, lp, t, 2.6, 4.3); showLabel(L.sec, lp, t, 7.7, 10.3); showLabel(L.hour, lp, t, 10.4, 14.5); showLabel(L.wiper, lp, t, 14.8, 18.2); showLabel(L.dust, lp, t, 18.3, 19.6);
      showLabel(L.screenL, head.clone().add(V(0, 0.45, 0)), t, 19.9, 22.8); showLabel(L.dry, head.clone().add(V(0, 0.45, 0)), t, 22.9, 25.8);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
