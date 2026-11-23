import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, person, label, showLabel, keyCam, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 25.2;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/human_heart', 'sf/earth'], hdris: ['symmetrical_garden_02'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function counterSprite(w = 0.9, col = '#ffd24a') { const c = document.createElement('canvas'); c.width = 768; c.height = 128; const t = new THREE.CanvasTexture(c); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, toneMapped: false })); s.renderOrder = 41; s.scale.set(w, w / 6, 1);
  s.set = (txt) => { const g = c.getContext('2d'); g.clearRect(0, 0, 768, 128); g.font = '900 96px Cap, sans-serif'; g.textAlign = 'center'; g.lineWidth = 18; g.strokeStyle = '#000'; g.strokeText(txt, 384, 100); g.fillStyle = col; g.fillText(txt, 384, 100); t.needsUpdate = true; }; return s; }
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 6, sunDir: [-4, 8, 3] }), 'symmetrical_garden_02', { height: 2, radius: 50, sun: 2.0, env: 0.95 });
  const hero = person('hero'); scene.add(hero.root);
  const heart = fit(prop('sf/human_heart'), 0.55, 'max', { ground: false }); heart.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(0xb8303a); m.material.roughness = 0.45; } }); scene.add(heart);
  const earth = fit(prop('sf/earth'), 1.0, 'max', { ground: false }); earth.traverse(m => { if (m.isMesh && /atmos|cloud/i.test(m.name)) m.visible = false; }); scene.add(earth);
  // blood-vessel ring wrapping the Earth twice
  const loops = []; for (let i = 0; i < 2; i++) { const g = new THREE.TorusGeometry(0.56 + i * 0.05, 0.014, 8, 128); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xd8202c, roughness: 0.4, emissive: 0x400008 })); scene.add(m); loops.push(m); }
  const cnt = counterSprite(1.0); scene.add(cnt);
  const L = { bpm: label('70 BEATS / MINUTE', 1.2), day: label('100,000+ / DAY', 1.0), life: label('LIFETIME', 0.8), bil: label('~3 BILLION BEATS', 1.2), brk: label('NEVER TAKES A BREAK', 1.3), km: label('100,000 KM OF VESSELS', 1.4), twice: label('2× AROUND THE EARTH', 1.4) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.6, 1.5, 3.4], [0, 1.2, 0]], [2.6, [0.6, 1.5, 3.0], [0.2, 1.35, 0]], [15.4, [0.6, 1.5, 3.0], [0.2, 1.35, 0]], [16.2, [0.3, 1.6, 4.4], [0.25, 1.4, -0.3]], [25.2, [0.3, 1.6, 4.4], [0.25, 1.4, -0.3]]];
  return {
    scene, camera: cam,
    update(t) {
      const beat = 1 + 0.12 * Math.pow(Math.max(0, Math.sin(t * Math.PI * 70 / 60 * 2)), 6);
      hero.update(t, { idle: 1 }, 1, { handsChest: 0.8 * sm(0.4, 0.9, t) * (1 - sm(2.6, 3.0, t)), point: 0.6 * sm(16.4, 16.8, t) });
      hero.root.position.set(-0.3, 0, 0); hero.root.rotation.y = 0.35;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const chest = hero.world('Spine2');
      const hk = sm(2.8, 3.3, t) * (1 - sm(15.8, 16.2, t)); heart.visible = hk > 0.01; heart.position.copy(chest).add(V(0.55, 0.1, 0.25)); heart.scale.setScalar((heart.userData.s0 ??= heart.scale.x) * hk * beat); heart.rotation.y = 0.4;
      const ek = sm(16.0, 16.6, t); earth.visible = ek > 0.01; earth.position.set(0.75, 1.75, -0.6); earth.rotation.y = t * 0.2; earth.scale.setScalar((earth.userData.s0 ??= earth.scale.x) * ek);
      loops.forEach((l, i) => { const lk = sm(21.4 + i * 0.8, 22.4 + i * 0.8, t); l.visible = lk > 0.01; l.position.copy(earth.position); l.rotation.set(Math.PI / 2 + 0.3 * i, 0.2, 0); l.geometry.setDrawRange(0, Math.floor(l.geometry.index.count * lk)); });
      const n = t < 9.4 ? Math.round(100800 * sm(5.6, 8.6, t)) : Math.round(3e9 * sm(11.0, 13.6, t));
      cnt.visible = (t > 5.5 && t < 9.4) || (t > 10.9 && t < 15.6); cnt.position.copy(heart.position).add(V(0, 0.48, 0)); cnt.set(n.toLocaleString('en-US'));
      const hp = heart.position.clone().add(V(0, 0.48, 0)); const ep = V(0.4, 2.45, -0.4);
      showLabel(L.bpm, hp, t, 3.2, 5.5); showLabel(L.day, hp.clone().add(V(0, 0.18, 0)), t, 7.4, 9.4); showLabel(L.life, hp.clone().add(V(0, 0.18, 0)), t, 9.6, 10.9);
      showLabel(L.bil, hp.clone().add(V(0, 0.18, 0)), t, 12.4, 14.2); showLabel(L.brk, hp, t, 14.3, 15.9); showLabel(L.km, ep, t, 17.6, 21.0); showLabel(L.twice, ep, t, 21.2, 25.2);
      return { bloom: 0.25, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
