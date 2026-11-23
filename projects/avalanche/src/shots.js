import * as THREE from 'three';
import { labelCam, loadKit, world, prop, texMat, person, label, showLabel, xray, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 27.6;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { hdris: ['pizzo_pernice'], tex: ['snow_02'], people: ['hero', 'soldier'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawPocket(g, k) { // cross-section: hand cupped over face making an air pocket in the snow
  g.fillStyle = 'rgba(235,245,255,1)'; g.fillRect(0, 0, 512, 512);
  g.fillStyle = 'rgba(160,200,240,0.55)'; for (let i = 0; i < 60; i++) g.fillRect((i * 83) % 512, (i * 47) % 512, 12, 12);
  g.fillStyle = 'rgba(12,20,38,0.9)'; g.beginPath(); g.ellipse(256, 270, 90 + 40 * k, 70 + 30 * k, 0, 0, 6.283); g.fill();
  g.fillStyle = 'rgba(230,180,150,1)'; g.beginPath(); g.ellipse(256, 300, 55, 70, 0, 0, 6.283); g.fill();
  g.strokeStyle = 'rgba(230,180,150,1)'; g.lineWidth = 26; g.lineCap = 'round'; g.beginPath(); g.arc(256, 270, 95 + 40 * k, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  g.fillStyle = '#7fd8ff'; g.font = '900 44px Cap, sans-serif'; g.textAlign = 'center'; g.fillText('AIR', 256, 220);
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 8, sunDir: [-5, 8, 3] }), 'pizzo_pernice', { height: 3, radius: 80, sun: 2.2, sunColor: 0xf0f6ff, env: 1.0 });
  const snowM = texMat('snow_02', 10, 10, { color: 0xf6faff });
  const slope = new THREE.Mesh(new THREE.PlaneGeometry(40, 40, 1, 1), snowM); slope.rotation.x = -Math.PI / 2; slope.position.y = 0.01; slope.receiveShadow = true; scene.add(slope);
  // the avalanche: a rolling wall of snow (many big white spheres + powder particles)
  const wave = new THREE.Group(); const wm = new THREE.MeshStandardMaterial({ color: 0xf2f6fb, roughness: 0.95 });
  for (let i = 0; i < 160; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25 + (i % 5) * 0.12, 1), wm); b.position.set(-12 + (i * 0.151) % 24, (i % 4) * 0.12, (i % 6) * 0.35); b.scale.set(1.4, 0.5, 1); b.castShadow = true; wave.add(b); }
  scene.add(wave);
  const powder = stream(6000, 0xffffff, 3.2); powder.material.opacity = 0.16; scene.add(powder);
  const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), snowM); mound.scale.set(2.4, 1.15, 2.0); mound.receiveShadow = mound.castShadow = true; scene.add(mound);
  const hero = person('hero'); scene.add(hero.root);
  const rescuers = [0, 1].map(() => { const p = person('soldier', { print: false }); p.root.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.multiply(new THREE.Color(0xff8a60)); } }); scene.add(p.root); return p; });
  const xr = xray(0.55); scene.add(xr);
  const L = { kmh: label('100+ KM/H', 4.0), swim: label('SWIM!', 0.8), surf: label('STAY NEAR THE SURFACE', 1.4), arm: label('ONE ARM UP', 1.0), air: label('AIR POCKET', 1.0), conc: label('HARD AS CONCRETE', 1.3), find: label('RESCUERS FIND YOU', 1.3) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 600);
  const KEYS = [[0, [2.4, 1.6, 7.0], [0, 1.6, -2]], [2.2, [2.4, 1.6, 7.0], [0, 2.4, -6]], [7.2, [3.4, 2.6, 10.0], [0, 1.6, -3]], [7.8, [2.6, 2.2, 6.6], [0, 0.7, 1.0]], [12.4, [2.6, 2.2, 6.6], [0, 0.7, 1.4]],
    [13.2, [1.8, 1.6, 5.0], [0, 0.6, 0.5]], [19.6, [1.8, 1.6, 5.0], [0, 0.4, 0.5]], [20.4, [1.6, 1.4, 4.2], [0, 0.4, 0.5]], [27.6, [2.2, 1.9, 5.6], [0, 0.6, 0.5]]];
  return {
    scene, camera: cam,
    update(t) {
      // wave front z: from far up-slope (-40) to over the hero (0) at 7.6, then stops at 19.9
      const wz = t < 7.6 ? lerp(-40, -2, sm(2.2, 7.6, t)) : t < 19.9 ? -2 + Math.min(8, (t - 7.6) * 0.8) : 6;
      wave.position.set(0, 0, wz); wave.visible = t < 7.9; wave.children.forEach((b, i) => b.rotation.x = t * 2 + i);
      const buried = sm(7.6, 8.6, t);
      const sink = t < 12.6 ? 0.25 * buried : lerp(0.25, 0.82, sm(12.6, 19.8, t));
      const swim = sm(8.4, 9.0, t) * (1 - sm(12.6, 13.4, t));
      hero.update(t, { idle: 1 - 0.0 }, 1, { flinch: sm(6.4, 6.9, t) * (1 - sm(7.8, 8.4, t)), swim: swim * (0.6 + 0.4 * Math.sin(t * 6)), armUp: sm(14.0, 14.8, t), coverFace: sm(16.3, 17.2, t), lookUp: 0.3 * sm(14, 15, t) });
      hero.root.position.set(0, -sink * 1.78, lerp(0, 0.5, buried) + Math.min(1.5, Math.max(0, t - 7.6) * 0.3) * (t < 13 ? 1 : 0)); hero.root.rotation.set(0.25 * swim * Math.sin(t * 3), 0, 0.15 * swim * Math.sin(t * 2.3));
      const mk = sm(19.6, 20.4, t); mound.visible = mk > 0.01; mound.position.set(hero.root.position.x, 0, hero.root.position.z); mound.scale.y = 0.22 * mk;
      // rescuers walk in and find the hand
      const rk = sm(23.4, 25.8, t); rescuers.forEach((r, i) => { const v = t > 23.0; r.root.visible = v; if (!v) return; const wk = t < 25.8 ? 1 : 0; r.update(t + i, { walk: wk, idle: 1 - wk }, 1, { point: (1 - wk) * 0.8 * (i ? 0 : 1), crouch: (1 - wk) * 0.4 * i });
        r.root.position.set(lerp(-5 + i * 9, -1.0 + i * 2.0, rk), 0, lerp(-1.0, 0.8, rk)); r.root.rotation.y = i ? -Math.PI / 2 - 0.4 : Math.PI / 2 + 0.4; });
      const k = keyCam(KEYS, t); const shk = t > 6 && t < 9 ? 0.04 : 0; cam.position.copy(k.pos).add(V(Math.sin(t * 50) * shk, Math.sin(t * 43) * shk, 0)); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      powder.update(V(0, 1.0, Math.min(wz, -1) + 1.5), V(0, 0.6, 1), 2.4, 12.6, t, 3.0, 18);
      const head = hero.headPos(), hand = hero.world('RightHand');
      const xk = sm(17.4, 17.7, t) * (1 - sm(19.6, 19.9, t));
      if (xk > 0.01) xr.show(V(0.9, 1.6, 0.5), xk, drawPocket, sm(17.6, 18.8, t), t); else xr.visible = false;
      const up = (y) => V(0, y, 0);
      showLabel(L.kmh, V(0, 4.6, wz), t, 4.6, 7.3); showLabel(L.swim, head.clone().add(up(0.6)), t, 8.4, 9.6); showLabel(L.surf, head.clone().add(up(0.6)), t, 9.7, 12.4);
      showLabel(L.arm, hand.clone().add(up(0.35)), t, 14.2, 16.2); showLabel(L.air, V(0.9, 2.15, 0.5), t, 17.7, 19.8);
      showLabel(L.conc, V(0, 1.6, 0.5), t, 20.6, 23.2); showLabel(L.find, hand.clone().add(up(0.6)), t, 23.6, 27.6);
      return { bloom: 0.25, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
