import * as THREE from 'three';
import { labelCam, loadKit, world, prop, texMat, person, label, showLabel, xray, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 24.0;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['stone_fire_pit', 'dry_branches_medium_01', 'stone_01', 'namaqualand_boulder_03'], hdris: ['cave_wall'], tex: ['rough_wood', 'forrest_ground_01'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawFriction(g, k, t) { // stick spinning on wood: heat rises, ember forms
  g.fillStyle = '#8a6a44'; g.fillRect(40, 330, 432, 90);
  g.fillStyle = '#a8845a'; g.save(); g.translate(256, 180); g.scale(Math.cos(t * 30) * 0.2 + 0.8, 1); g.fillRect(-18, -150, 36, 300); g.restore();
  const heat = k; g.fillStyle = `rgba(255,${Math.round(lerp(160, 60, heat))},30,${heat})`; g.beginPath(); g.arc(256, 335, 20 + 30 * heat, 0, 6.283); g.fill();
  g.fillStyle = '#5a3a20'; for (let i = 0; i < 12 * k; i++) { g.beginPath(); g.arc(200 + (i * 23) % 120, 345 + (i % 3) * 8, 6, 0, 6.283); g.fill(); }
  g.fillStyle = '#ffd24a'; g.font = '900 34px Cap, sans-serif'; g.textAlign = 'center'; g.fillText('FRICTION = HEAT', 256, 470);
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-3, 6, 3] }), 'cave_wall', { height: 1.6, radius: 9, sun: 0.5, sunColor: 0xd8c8ff, env: 0.45 });
  const pit = prop('stone_fire_pit', 1); pit.position.set(0.2, 0, 0.4); scene.add(pit);
  const grass = new THREE.Group(); for (let i = 0; i < 40; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.2, 4), new THREE.MeshStandardMaterial({ color: 0xc8b070, roughness: 1 })); b.position.set((Math.sin(i * 2.3)) * 0.1, 0.06, Math.cos(i * 1.7) * 0.1); b.rotation.set(Math.sin(i) * 1.2, i, Math.cos(i) * 1.2); grass.add(b); } grass.position.set(0.2, 0.05, 0.4); scene.add(grass);
  const twigs = prop('dry_branches_medium_01', 0.6); twigs.position.set(0.2, 0.05, 0.4); scene.add(twigs);
  const rocks = [prop('stone_01', 1), prop('stone_01', 1)]; rocks.forEach(r => scene.add(r));
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.12), texMat('rough_wood', 1, 1)); board.position.set(-0.4, 0.02, 0.5); scene.add(board);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 10), texMat('rough_wood', 1, 2)); scene.add(stick);
  const sparks = stream(260, 0xffc040, 0.05); sparks.material.blending = THREE.AdditiveBlending; scene.add(sparks);
  const smoke = stream(200, 0x888888, 0.15); smoke.material.opacity = 0.3; scene.add(smoke);
  const flames = stream(900, 0xff7020, 0.18); flames.material.blending = THREE.AdditiveBlending; scene.add(flames);
  const flames2 = stream(500, 0xffd060, 0.1); flames2.material.blending = THREE.AdditiveBlending; scene.add(flames2);
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff6010, toneMapped: false })); scene.add(ember);
  const fireLight = new THREE.PointLight(0xff8030, 0, 6, 1.4); fireLight.position.set(0.2, 0.6, 0.4); scene.add(fireLight);
  const hero = person('hero'); scene.add(hero.root);
  const L = { rocks: label('STRIKE TWO ROCKS', 1.1), flint: label('FLINT', 0.6), iron: label('IRON-RICH ROCK', 1.0), spark: label('HOT SPARKS!', 0.9), spin: label('SPIN A STICK', 0.9), fast: label('SUPER FAST', 0.8), emberL: label('GLOWING EMBER', 1.0), grassL: label('DRY GRASS', 0.8), blow: label('BLOW GENTLY', 0.9), fire: label('FIRE!', 1.0) };
  Object.values(L).forEach(l => scene.add(l));
  const xr = xray(0.42); scene.add(xr);
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [1.4, 1.6, 3.4], [0, 0.8, 0.2]], [2.2, [0.7, 1.3, 2.4], [-0.25, 0.75, 0.2]], [10.0, [0.7, 1.3, 2.4], [-0.25, 0.75, 0.2]], [10.6, [0.5, 1.2, 2.2], [-0.35, 0.6, 0.3]], [17.6, [0.5, 1.2, 2.2], [-0.35, 0.6, 0.3]], [18.2, [0.9, 1.25, 2.4], [-0.05, 0.6, 0.3]], [24.0, [1.2, 1.3, 2.8], [0.1, 0.7, 0.3]]];
  return {
    scene, camera: cam,
    update(t) {
      const strike = t > 2.4 && t < 10.2, drill = t > 10.8 && t < 17.8, blow = sm(20.0, 20.4, t) * (1 - sm(21.6, 22.0, t)), lit = sm(21.9, 22.6, t);
      const hit = strike ? Math.max(0, Math.sin(t * 7)) : 0;
      hero.update(t, { idle: 1 }, 1, { crouch: 0.9, point: strike ? 0.6 + 0.3 * hit : drill ? 0.7 : 0.3 * (1 - lit), pointL: strike ? 0.6 + 0.3 * hit : drill ? 0.7 : 0, lean: 0.4 * blow + (drill ? 0.3 : 0), leanBack: 0.4 * lit, armsUp: 0.5 * lit });
      hero.root.position.set(-0.7, -0.35, -0.1); hero.root.rotation.y = 0.8;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const rh = hero.world('RightHand'), lh = hero.world('LeftHand');
      rocks[0].visible = rocks[1].visible = strike; rocks[0].position.copy(rh); rocks[1].position.copy(lh);
      const sp = rh.clone().lerp(lh, 0.5);
      if (strike && hit > 0.95) sparks.update(sp, V(0.2, -0.3, 0.6), t - 0.35, t, t, 1.6, 1.8); else if (!strike) sparks.update(sp, V(0, 1, 0), 0, 0.1, t, 1, 1);
      stick.visible = drill; stick.position.set(-0.4, 0.3, 0.5); stick.rotation.set(0, t * 40, 0.05);
      smoke.update(V(-0.4, 0.06, 0.5), V(0, 1, 0), 14.6, 17.6, t, 0.4, 0.15);
      const em = sm(16.4, 17.0, t); ember.visible = t > 16.4 && t < 22.4; ember.position.copy(t < 18.6 ? V(-0.4, 0.05, 0.5) : V(-0.4, 0.05, 0.5).lerp(V(0.2, 0.08, 0.4), sm(18.6, 19.4, t))); ember.scale.setScalar(em * (1 + 0.3 * Math.sin(t * 9) + 0.8 * blow));
      flames.update(V(0.2, 0.1, 0.4), V(0, 1, 0), 22.0, 24.0, t, 0.55, 0.5); flames2.update(V(0.2, 0.1, 0.4), V(0, 1, 0), 22.1, 24.0, t, 0.7, 0.2); fireLight.intensity = 14 * lit * (0.85 + 0.15 * Math.sin(t * 17));
      const xk = sm(14.0, 14.3, t) * (1 - sm(17.6, 17.9, t));
      if (xk > 0.01) xr.show(V(0.25, 1.05, 0.5), xk, drawFriction, sm(14.2, 17.0, t), t); else xr.visible = false;
      const hp = hero.headPos().add(V(0.2, 0.3, 0));
      showLabel(L.rocks, hp, t, 2.4, 5.0); showLabel(L.flint, sp.clone().add(V(-0.15, 0.25, 0)), t, 5.2, 9.8); showLabel(L.iron, sp.clone().add(V(0.2, 0.15, 0)), t, 6.9, 9.0); showLabel(L.spark, hp, t, 9.1, 10.3);
      showLabel(L.spin, V(-0.4, 0.85, 0.5), t, 11.2, 13.4); showLabel(L.fast, V(-0.4, 0.85, 0.5), t, 13.5, 14.0); showLabel(L.emberL, V(-0.4, 0.4, 0.5), t, 16.6, 17.9);
      showLabel(L.grassL, V(0.2, 0.45, 0.4), t, 18.8, 20.1); showLabel(L.blow, hp, t, 20.2, 21.7); showLabel(L.fire, V(0.2, 1.1, 0.4), t, 22.0, 24.0);
      return { bloom: 0.5, exposure: 0.95 + 0.15 * lit };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
