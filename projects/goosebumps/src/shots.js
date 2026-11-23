import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, creature, person, label, showLabel, xray, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 26.4;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['Television_01', 'WoodenTable_01', 'boombox', 'Sofa_01', 'sf/chimpanzee'], hdris: ['reading_room'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
function drawFollicle(g, k) { // skin cross-section: hair, follicle, arrector pili muscle; k = 0 relaxed .. 1 goosebump
  const bump = 34 * k; g.fillStyle = 'rgba(236,190,160,1)';
  g.beginPath(); g.moveTo(0, 250); g.lineTo(150, 250); g.quadraticCurveTo(256, 250 - bump * 2, 362, 250); g.lineTo(512, 250); g.lineTo(512, 512); g.lineTo(0, 512); g.fill();
  g.fillStyle = 'rgba(250,215,190,1)'; g.fillRect(0, 300, 512, 212);
  g.strokeStyle = 'rgba(120,70,50,1)'; g.lineWidth = 9; g.beginPath(); g.moveTo(256, 360); const ang = -Math.PI / 2 + (1 - k) * 0.9; g.lineTo(256 + Math.cos(ang) * 230, 360 + Math.sin(ang) * 230); g.stroke();
  g.strokeStyle = 'rgba(160,110,80,1)'; g.lineWidth = 14; g.beginPath(); g.ellipse(256, 380, 22, 40, 0, 0, 6.283); g.stroke();
  g.strokeStyle = '#ff4a5a'; g.lineWidth = 14 + 8 * k; g.beginPath(); g.moveTo(276, 395); g.quadraticCurveTo(330, 380 - 10 * k, 360 - 20 * k, 320); g.stroke();
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-3, 6, 4] }), 'reading_room', { height: 1.6, radius: 9, sun: 1.0, env: 1.0 });
  const sofa = prop('Sofa_01'); sofa.position.set(-0.3, 0, -1.7); scene.add(sofa);
  const table = prop('WoodenTable_01'); table.position.set(1.1, 0, 0.2); table.rotation.y = Math.PI / 2; scene.add(table);
  const tv = prop('Television_01', 1.4); tv.position.set(1.1, 0.55, 0.1); tv.rotation.y = -0.7; scene.add(tv);
  const screen = new THREE.PointLight(0xff3020, 0, 3, 1.5); screen.position.set(0.7, 1.0, 0.1); scene.add(screen);
  const radio = prop('boombox', 0.7); radio.position.set(1.1, 0.55, 0.75); radio.rotation.y = -0.6; scene.add(radio);
  const ape = creature('sf/chimpanzee', 1.2, 'y'); ghost(ape.root, 0xffe0b0, { inPlace: true }); ape.root.traverse(m => { if (m.isMesh) m.material.blending = THREE.NormalBlending; }); scene.add(ape.root);
  const fur = stream(400, 0xffe0b0, 0.04); scene.add(fur);
  const cold = stream(700, 0xdff4ff, 0.04); scene.add(cold);
  const notes = stream(60, 0xffd24a, 0.08); scene.add(notes);
  const hero = person('hero'); scene.add(hero.root);
  const xr = xray(0.42); scene.add(xr);
  const L = { cold: label('COLD!', 0.6), mus: label('TINY MUSCLES PULL TIGHT', 1.4), hair: label('HAIRS STAND UP', 1.0), bump: label('GOOSEBUMPS', 0.9), anc: label('FURRY ANCESTORS', 1.1), puff: label('FUR TRAPS WARM AIR', 1.2), big: label('LOOK BIGGER WHEN SCARED', 1.4), movie: label('SCARY MOVIE', 0.9), song: label('FAVORITE SONG', 1.0) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.3, 1.4, 3.6], [0, 1.1, 0]], [2.6, [0.3, 1.4, 3.6], [0, 1.1, 0]], [3.4, [0.2, 1.45, 2.4], [0, 1.25, 0]], [12.4, [0.2, 1.45, 2.4], [0, 1.25, 0]],
    [13.2, [-0.2, 1.3, 3.4], [-0.45, 1.0, -0.3]], [20.6, [-0.2, 1.3, 3.4], [-0.45, 1.0, -0.3]], [21.4, [-0.6, 1.4, 3.0], [0.4, 1.0, 0]], [26.4, [-0.6, 1.4, 3.0], [0.4, 1.0, 0]]];
  return {
    scene, camera: cam,
    update(t) {
      const shiver = sm(2.2, 2.8, t) * (1 - sm(12.4, 13.0, t)), thrill = sm(21.6, 22.0, t);
      hero.update(t, { idle: 1 }, 1, { handsChest: 0.85 * shiver, headTilt: (shiver + 0.5 * thrill) * Math.sin(t * 30) * 0.12, flinch: 0.5 * sm(21.6, 21.9, t) * (1 - sm(22.6, 23.0, t)), lookUp: 0.3 * sm(23.2, 23.6, t), smile: 0 });
      hero.root.position.set(0, 0, 0); hero.root.rotation.y = 0.5 * thrill;
      // ghost ancestor ape: fur puffs up (13-17), then looks bigger when scared (17.7-20)
      const ak = sm(12.9, 13.4, t) * (1 - sm(20.4, 20.9, t)); ape.root.fade(0.75 * ak); ape.play(t, '01_Idle', 1);
      const puff = sm(14.8, 15.6, t) + 0.25 * sm(18.4, 19.0, t); ape.root.position.set(-0.75, 0, -0.2); ape.root.rotation.y = 0.5; ape.root.scale.setScalar(ape.root.userData.s0 ??= ape.root.scale.x); ape.root.scale.setScalar(ape.root.userData.s0 * (1 + 0.18 * puff));
      screen.intensity = t > 21.3 && t < 23.2 ? 5 + 4 * Math.sin(t * 23) : 0;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      cold.update(V(-3.0, 1.4, 0.5), V(1, -0.05, 0), 1.6, 12.4, t, 3.5, 2.0);
      fur.update(V(-0.75, 0.6, -0.2), V(0, 1, 0), 15.0, 17.0, t, 0.4, 1.1);
      notes.update(V(1.1, 0.9, 0.75), V(-0.5, 1, 0), 23.3, 25.9, t, 0.6, 0.5);
      const xk = sm(3.3, 3.6, t) * (1 - sm(12.3, 12.6, t));
      if (xk > 0.01) xr.show(hero.world('Spine2').clone().add(V(0.42, -0.05, 0.25)), xk, drawFollicle, sm(6.4, 7.0, t) * 0.5 + sm(8.0, 9.2, t) * 0.25 + sm(10.6, 11.4, t) * 0.25, t); else xr.visible = false;
      const head = hero.headPos(); const up = (y) => V(0, y, 0);
      showLabel(L.cold, head.clone().add(up(0.38)), t, 2.4, 3.3); showLabel(L.mus, head.clone().add(up(0.33)), t, 3.6, 7.6);
      showLabel(L.hair, head.clone().add(up(0.33)), t, 7.8, 9.7); showLabel(L.bump, head.clone().add(up(0.33)), t, 9.8, 12.4);
      const ah = V(-0.75, 1.65, -0.2); showLabel(L.anc, ah, t, 13.0, 14.6); showLabel(L.puff, ah, t, 14.8, 17.2); showLabel(L.big, ah, t, 17.6, 20.6);
      showLabel(L.movie, V(1.0, 1.45, 0.1), t, 21.4, 22.4); showLabel(L.song, V(1.0, 1.2, 0.75), t, 22.6, 26.4);
      return { bloom: 0.25, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
