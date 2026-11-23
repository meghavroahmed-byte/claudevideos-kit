import * as THREE from 'three';
import { labelCam, loadKit, world, prop, person, label, showLabel, xray, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 25.4;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['strawberry_chocolate_cake', 'dining_table'], hdris: ['comfy_cafe'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
// blood-sugar graph: rise (2.8-8) -> peak/energy -> crash below line (11-15) -> wanting more
function drawGraph(g, k, t) {
  g.strokeStyle = 'rgba(210,230,255,0.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(40, 300); g.lineTo(472, 300); g.stroke();
  g.fillStyle = 'rgba(210,230,255,0.7)'; g.font = '900 26px Cap, sans-serif'; g.fillText('NORMAL', 50, 290);
  const f = (u) => u < 0.35 ? 300 - 200 * Math.sin(u / 0.35 * Math.PI / 2) : u < 0.6 ? 100 + 300 * ((u - 0.35) / 0.25) * ((u - 0.35) / 0.25) * 1.0 : 400 - 60 * (u - 0.6) / 0.4;
  g.strokeStyle = '#ff5a6a'; g.lineWidth = 9; g.beginPath(); for (let i = 0; i <= 100 * k; i++) { const u = i / 100, x = 40 + 432 * u, y = Math.min(450, f(u)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  const u = k, x = 40 + 432 * u, y = Math.min(450, f(u)); g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(x, y, 12, 0, 6.283); g.fill();
}
function drawTooth(g, k) {
  g.fillStyle = 'rgba(245,245,235,1)'; g.beginPath(); g.moveTo(150, 120); g.quadraticCurveTo(256, 60, 362, 120); g.lineTo(350, 280); g.lineTo(320, 430); g.lineTo(280, 300); g.lineTo(232, 300); g.lineTo(192, 430); g.lineTo(162, 280); g.closePath(); g.fill();
  g.fillStyle = '#c8e070'; for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(170 + (i * 29) % 180, 70 + (i % 3) * 12, 9, 5, i, 0, 6.283); g.fill(); }
  g.fillStyle = 'rgba(70,45,30,0.95)'; g.beginPath(); g.arc(300, 150, 10 + 45 * k, 0, 6.283); g.fill(); g.beginPath(); g.arc(210, 170, 6 + 25 * k, 0, 6.283); g.fill();
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-3, 6, 4] }), 'comfy_cafe', { height: 1.6, radius: 9, sun: 1.0, env: 1.0 });
  const table = prop('dining_table'); table.position.set(0.9, 0, -0.9); scene.add(table);
  const cake = prop('strawberry_chocolate_cake', 1.8); cake.position.set(0.7, 0.87, -0.6); scene.add(cake);
  const slice = prop('strawberry_chocolate_cake', 0.75); scene.add(slice);
  const spark = stream(120, 0xffe060, 0.05); spark.material.blending = THREE.AdditiveBlending; scene.add(spark);
  const hero = person('hero'); scene.add(hero.root);
  const fat = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), new THREE.MeshStandardMaterial({ color: 0xf8e0a0, transparent: true, opacity: 0.55, roughness: 0.6 })); fat.scale.set(1.2, 0.8, 1.0); scene.add(fat);
  const xr = xray(0.45); scene.add(xr);
  const L = { blood: label('SUGAR RUSH INTO BLOOD', 1.3), ins: label('INSULIN', 0.7), energy: label('ENERGY BURST!', 1.0), drop: label('BLOOD SUGAR DROPS', 1.1), crash: label('CRASH', 0.7), more: label('HUNGRY FOR MORE', 1.0), fatL: label('STORED AS FAT', 1.0), teeth: label('ROTS YOUR TEETH', 1.0) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.6, 1.5, 3.2], [0.2, 1.1, 0]], [2.4, [0.4, 1.55, 2.5], [0.15, 1.3, 0]], [18.2, [0.4, 1.55, 2.5], [0.15, 1.3, 0]], [19.0, [0.4, 1.45, 3.0], [0.1, 1.1, 0]], [25.4, [0.4, 1.45, 3.0], [0.1, 1.1, 0]]];
  return {
    scene, camera: cam,
    update(t) {
      const eat = Math.abs(Math.sin(t * 4)) * (t < 2.4 ? 1 : 0), energy = sm(8.6, 9.2, t) * (1 - sm(11.0, 11.6, t)), crash = sm(14.8, 15.6, t) * (1 - sm(18.0, 18.6, t)), more = sm(16.9, 17.3, t) * (1 - sm(18.2, 18.6, t));
      hero.update(t, { idle: 1 }, 1, { point: 0.8 * (t < 2.4 ? 1 : 0) + 0.8 * more, lean: 0.2 * eat, armsUp: 0.9 * energy * Math.abs(Math.sin(t * 5)), slump: 0.8 * crash, lookDown: 0.4 * crash, handsBelly: 0.6 * sm(20.6, 21.0, t) * (1 - sm(22.0, 22.4, t)), facepalm: 0.4 * sm(23.2, 23.6, t) });
      hero.mouth(eat * 0.6); hero.root.position.set(-0.1, -0.05 * crash, 0); hero.root.rotation.y = 0.25;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos(), belly = hero.world('Spine');
      spark.update(head.clone().add(V(0, 0.2, 0)), V(0, 1, 0), 8.6, 11.0, t, 0.8, 0.9);
      fat.visible = false; const fk = sm(20.3, 21.4, t); hero.root.scale.set(1 + 0.14 * fk, 1, 1 + 0.18 * fk);
      slice.visible = t < 2.6; slice.position.copy(hero.world('RightHand')).lerp(head.clone().add(V(0, -0.08, 0.1)), eat * 0.8).add(V(0, 0.03, 0.05));
      const xk = sm(2.8, 3.1, t) * (1 - sm(18.0, 18.3, t));
      const xt = sm(22.1, 22.4, t);
      if (xk > 0.01) xr.show(head.clone().add(V(0.4, -0.04, 0.1)), xk, drawGraph, sm(2.9, 17.8, t), t); else if (xt > 0.01) xr.show(head.clone().add(V(0.4, -0.04, 0.1)), xt, drawTooth, sm(22.4, 24.6, t), t); else xr.visible = false;
      const lp = head.clone().add(V(0, 0.34, 0));
      showLabel(L.blood, lp, t, 2.9, 5.6); showLabel(L.ins, lp, t, 5.8, 8.4); showLabel(L.energy, lp, t, 8.6, 11.0); showLabel(L.drop, lp, t, 11.2, 15.2);
      showLabel(L.crash, lp, t, 15.3, 16.8); showLabel(L.more, lp, t, 16.9, 18.3); showLabel(L.fatL, lp, t, 20.2, 21.9); showLabel(L.teeth, lp, t, 22.0, 25.4);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
