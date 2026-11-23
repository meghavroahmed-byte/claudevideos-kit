import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, person, label, showLabel, xray, keyCam, stream, waterMat, V, ASSETS } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 31.9;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/lifeboat', 'dutch_ship_medium', 'plastic_bottle_gallon'], hdris: ['kloofendal_48d_partly_cloudy_puresky'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawCells(g, k) { // salt pulls water out: cells shrink, salt crystals appear
  for (let i = 0; i < 6; i++) { const x = 130 + (i % 3) * 125, y = 190 + Math.floor(i / 3) * 140, r = 52 * (1 - 0.45 * k);
    g.fillStyle = 'rgba(255,170,170,0.8)'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.95)'; for (let i = 0; i < 26 * k; i++) { const x = 70 + (i * 61) % 380, y = 110 + (i * 37) % 300; g.fillRect(x, y, 14, 14); }
  g.strokeStyle = '#6fc3ff'; g.lineWidth = 6; for (let i = 0; i < 6; i++) { const x = 130 + (i % 3) * 125, y = 190 + Math.floor(i / 3) * 140; g.beginPath(); g.moveTo(x + 40, y); g.lineTo(x + 40 + 50 * k, y - 20 * k); g.stroke(); }
}
function drawBattery(g, k) {
  g.strokeStyle = 'rgba(210,230,255,0.95)'; g.lineWidth = 12; g.strokeRect(120, 180, 250, 150); g.fillStyle = 'rgba(210,230,255,0.95)'; g.fillRect(372, 225, 24, 60);
  const lvl = 1 - 0.85 * k; g.fillStyle = lvl > 0.4 ? '#5dff8a' : '#ff4a4a'; g.fillRect(134, 194, 222 * lvl, 122);
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 4, sunDir: [4, 7, 2] }), 'kloofendal_48d_partly_cloudy_puresky', { sky: false, sun: 2.4, env: 0.9 });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), waterMat(2.0)); sea.rotation.x = -Math.PI / 2; sea.position.y = 0; scene.add(sea); scene.children.filter(o => o.material && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const raft = fit(prop('sf/lifeboat'), 2.4, 'max'); scene.add(raft);
  // procedural silver sea fish (mackerel-like)
  const tuna = new THREE.Group(); { const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), new THREE.MeshStandardMaterial({ color: 0x8fa8bd, metalness: 0.75, roughness: 0.25 })); body.scale.set(1, 0.85, 4.2); tuna.add(body);
    const back = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2.3), new THREE.MeshStandardMaterial({ color: 0x1f4f6a, metalness: 0.5, roughness: 0.35 })); back.scale.set(1.02, 0.9, 4.25); tuna.add(back);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.16, 3), new THREE.MeshStandardMaterial({ color: 0x5a7a90, metalness: 0.6, roughness: 0.3 })); tail.rotation.x = -Math.PI / 2; tail.scale.set(1, 1, 0.2); tail.position.z = -0.46; tuna.add(tail); tuna.userData.tail = tail;
    for (const sx of [-1, 1]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 })); eye.position.set(sx * 0.07, 0.02, 0.32); tuna.add(eye); } }
  tuna.traverse(m => { if (m.isMesh) m.castShadow = true; }); tuna.scale.setScalar(0.7); scene.add(tuna); const tMix = { setTime() {} };
  const ship = prop('dutch_ship_medium', 1); scene.add(ship);
  const bottle = prop('plastic_bottle_gallon', 1.4); scene.add(bottle);
  const mirror = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.05 })); scene.add(mirror);
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xffffff, transparent: true, depthWrite: false, toneMapped: false, map: (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, '#fff'); gr.addColorStop(0.2, 'rgba(255,255,230,0.9)'); gr.addColorStop(1, 'rgba(255,255,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); return t; })() })); scene.add(flash);
  const rain = stream(900, 0xcfe6ff, 0.04); scene.add(rain);
  const hero = person('hero'); scene.add(hero.root);
  const skinMats = []; hero.root.traverse(m => { if (m.isMesh && !/Outfit|cloth|jean|shirt/i.test(m.material.name || '')) skinMats.push(m.material); });
  const xr = xray(0.5); scene.add(xr);
  const L = { d1: label('DAY 1', 0.7), burn: label('SUNBURN', 0.8), thirst: label('THIRSTY', 0.8), no: label('NEVER DRINK SEAWATER', 1.3), salt: label('SALT = MORE THIRST', 1.2), d2: label('DAY 2', 0.7), dizzy: label('WEAK & DIZZY', 0.9), rainL: label('COLLECT RAINWATER', 1.2), d3: label('DAY 3', 0.7), energy: label('LOW ENERGY', 0.9), fish: label('FISH = FOOD', 0.9), stay: label('STAY WITH YOUR RAFT', 1.3), mir: label('MIRROR FLASH', 1.0), shipL: label('SHIP', 2.4) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 3000);
  const KEYS = [[0, [3.6, 2.6, 7.0], [0, 0.6, 0]], [3.4, [2.0, 1.6, 4.6], [0, 0.7, 0]], [8.6, [2.0, 1.6, 4.6], [0, 0.7, 0]], [9.4, [1.2, 1.3, 2.9], [0, 0.85, 0]], [13.6, [1.2, 1.3, 2.9], [0, 0.85, 0]],
    [14.4, [2.4, 1.8, 4.8], [0, 0.7, 0]], [19.4, [2.4, 1.8, 4.8], [0, 0.7, 0]], [20.2, [1.3, 1.4, 3.0], [0, 0.85, 0]], [22.6, [1.3, 1.4, 3.0], [0, 0.85, 0]], [23.2, [2.6, 1.4, 4.2], [0.6, 0.6, 0.4]], [24.6, [2.6, 1.4, 4.2], [0.6, 0.6, 0.4]],
    [26.0, [2.4, 2.0, 5.4], [0, 0.8, 0]], [28.0, [2.4, 2.0, 5.4], [0, 0.8, 0]], [29.0, [1.6, 1.6, 3.6], [-14, 2, -60]], [31.9, [1.6, 1.6, 3.6], [-10, 2, -60]]];
  return {
    scene, camera: cam,
    update(t) {
      sea.material.uniforms.time.value = t;
      const bob = Math.sin(t * 1.1) * 0.05, roll = Math.sin(t * 0.9) * 0.04;
      raft.position.set(0, -0.08 + bob, 0); raft.rotation.set(roll, 0.3, Math.sin(t * 0.7) * 0.03);
      // ---- hero kneels in the raft ----
      const weak = sm(14.8, 15.4, t) * (1 - sm(16.8, 17.2, t)) + 0.6 * sm(20.6, 21.2, t) * (1 - sm(22.8, 23.4, t));
      const scoop = sm(9.2, 9.6, t) * (1 - sm(10.6, 11.0, t));
      const catchR = sm(17.0, 17.4, t) * (1 - sm(19.2, 19.6, t));
      const signal = sm(28.0, 28.4, t);
      hero.update(t, { idle: 1 }, 0.7, { crouch: 0.95, slump: 0.4 * weak + 0.25 * sm(5.6, 6.0, t) * (1 - sm(8.6, 9.0, t)), lean: 0.5 * scoop, headTilt: 0.6 * weak * Math.sin(t * 2.2), armsUp: 0.55 * catchR, point: signal, handsThroat: 0.6 * sm(7.6, 7.9, t) * (1 - sm(8.8, 9.1, t)) });
      hero.root.position.set(0, -0.32 + bob, 0); hero.root.rotation.set(roll, -0.4, 0);
      // sunburn: skin reddens on day 1
      const red = sm(5.6, 7.0, t); skinMats.forEach(m => m.color.setRGB(1, 1 - 0.25 * red, 1 - 0.3 * red));
      // rain (day 2)
      rain.update(V(0, 6, 0), V(0, -1, 0), 16.9, 19.4, t, 6, 6);
      // fish jumps next to the raft (day 3)
      const fk = Math.min(1, Math.max(0, (t - 23.0) / 1.2)); tuna.visible = t > 22.9 && t < 24.3; tMix.setTime(t);
      tuna.position.set(lerp(1.7, 0.5, fk), -0.3 + Math.sin(fk * Math.PI) * 1.1, 0.9); tuna.rotation.set((fk - 0.5) * 1.8, -Math.PI / 2, 0); tuna.userData.tail.rotation.y = Math.sin(t * 25) * 0.5;
      bottle.visible = t > 16.8 && t < 19.8; bottle.position.copy(hero.world('RightHand')).add(V(0, 0.05, 0));
      // ship far away + mirror flash
      ship.position.set(lerp(-60, -20, sm(25, 31.9, t)), -2.5, -120); ship.rotation.y = 0.2; ship.visible = t > 25;
      mirror.visible = t > 28.2; mirror.position.copy(hero.world('RightHand')).add(V(0, 0.05, -0.05)); mirror.lookAt(V(-30, 5, -120));
      const k = keyCam(KEYS, t); const wob = 0.04 * weak; cam.position.copy(k.pos).add(V(Math.sin(t * 2.1) * wob, Math.sin(t * 1.7) * wob, 0)); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const fl = (t > 28.9 && Math.sin(t * 9) > 0.2) ? 1 : 0; flash.position.copy(mirror.position); flash.scale.setScalar(0.9 * fl * sm(28.8, 29.0, t)); flash.visible = fl > 0;
      const head = hero.headPos(), chest = hero.world('Spine2'); const up = (y) => V(0, y, 0);
      const x1 = sm(10.8, 11.1, t) * (1 - sm(13.3, 13.6, t)), x2 = sm(20.6, 20.9, t) * (1 - sm(22.6, 22.9, t));
      if (x1 > 0.01) xr.show(chest.clone().add(V(0.4, 0.3, 0.2)), x1, drawCells, sm(11.2, 12.8, t), t);
      else if (x2 > 0.01) xr.show(chest.clone().add(V(0.4, 0.3, 0.2)), x2, drawBattery, sm(20.9, 22.2, t), t); else xr.visible = false;
      showLabel(L.d1, head.clone().add(up(0.45)), t, 4.2, 5.4); showLabel(L.burn, head.clone().add(up(0.45)), t, 5.6, 6.9); showLabel(L.thirst, head.clone().add(up(0.45)), t, 7.1, 8.8);
      showLabel(L.no, head.clone().add(up(0.42)), t, 9.0, 10.8); showLabel(L.salt, head.clone().add(up(0.42)), t, 11.0, 13.6);
      showLabel(L.d2, head.clone().add(up(0.45)), t, 14.0, 15.0); showLabel(L.dizzy, head.clone().add(up(0.45)), t, 15.3, 16.8); showLabel(L.rainL, head.clone().add(up(0.6)), t, 17.1, 19.4);
      showLabel(L.d3, head.clone().add(up(0.42)), t, 19.7, 20.6); showLabel(L.energy, head.clone().add(up(0.42)), t, 21.0, 22.7); showLabel(L.fish, tuna.position.clone().add(up(0.7)), t, 23.2, 24.6);
      showLabel(L.stay, head.clone().add(up(0.55)), t, 26.6, 28.0); showLabel(L.mir, head.clone().add(V(-0.3, 0.45, 0)), t, 28.3, 29.8); showLabel(L.shipL, ship.position.clone().add(up(30)), t, 30.0, 31.9);
      return { bloom: 0.3, exposure: 1.0 - 0.25 * sm(16.6, 17.2, t) * (1 - sm(19.4, 20.0, t)) };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
