import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, person, label, showLabel, xray, ghost, keyCam, stream, lavaMaterial, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 27.6;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['rock_face_01', 'rock_face_02', 'namaqualand_boulder_02', 'namaqualand_boulder_03', 'boulder_01', 'sf/astronaut'], hdris: ['valley_of_desolation'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawGasLungs(g, k) {
  g.save(); g.translate(256, 270);
  g.beginPath(); g.moveTo(0, -170); g.lineTo(0, -60); g.lineTo(-40, -20); g.moveTo(0, -60); g.lineTo(40, -20); g.stroke();
  for (const sx of [-1, 1]) { g.save(); g.translate(sx * 85, 30); g.beginPath(); g.ellipse(0, 0, 70, 120, sx * 0.15, 0, Math.PI * 2); g.fillStyle = 'rgba(255,140,150,0.6)'; g.fill(); g.clip();
    g.fillStyle = 'rgba(190,220,40,0.85)'; g.fillRect(-80, 130 - 260 * k, 160, 260); g.restore();
    g.save(); g.translate(sx * 85, 30); g.beginPath(); g.ellipse(0, 0, 70, 120, sx * 0.15, 0, Math.PI * 2); g.stroke(); g.restore(); }
  g.restore();
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 9, sunDir: [-4, 7, 3] }), 'valley_of_desolation', { height: 8, radius: 80, sun: 1.2, sunColor: 0xffd2a8, env: 0.55 });
  const C = V(0, 0, -3); // crater centre
  const lavaM = lavaMaterial(); const lava = new THREE.Mesh(new THREE.CircleGeometry(6.6, 64), lavaM); lava.rotation.x = -Math.PI / 2; lava.position.set(C.x, 0.03, C.z); scene.add(lava);
  const glow = new THREE.PointLight(0xff6a1a, 60, 14, 1.6); glow.position.set(0, 1.2, -1); scene.add(glow);
  const glow2 = new THREE.PointLight(0xff4a10, 30, 10, 1.8); glow2.position.set(0, 0.6, 2); scene.add(glow2);
  // crater wall: ring of rock faces (open towards the camera)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2; if (Math.cos(a) > 0.55) continue; // gap facing +z (camera side)
    const r = prop(i % 2 ? 'rock_face_01' : 'rock_face_02', 1.5 + (i % 3) * 0.2); r.position.set(C.x + Math.sin(a) * 7.3, -0.2, C.z + Math.cos(a) * 7.3); r.rotation.y = a + Math.PI * 0.5 + (i % 2) * 0.4; scene.add(r);
  }
  const ledge = prop('namaqualand_boulder_03', 1.2); ledge.position.set(-3.7, -0.1, 0.8); ledge.rotation.y = 0.3; scene.add(ledge);
  for (const [x, z, s, ry] of [[-4.8, 3.4, 1.3, 1], [4.8, 3.6, 1.1, 2], [5.4, 1.6, 1.2, 0.5]]) { const b = prop('namaqualand_boulder_02', s); b.position.set(x, -0.05, z); b.rotation.y = ry; scene.add(b); }
  const rock = prop('boulder_01', 0.55); scene.add(rock);
  const suit = fit(prop('sf/astronaut'), 1.9, 'y'); suit.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color = new THREE.Color(0xd9d4c8); m.material.metalness = 0.85; m.material.roughness = 0.25; } }); scene.add(suit);
  const hero = person('hero'); scene.add(hero.root);
  const heatGhost = ghost(hero.root, 0xff5030); scene.add(heatGhost);
  const fire = stream(1100, 0xff6a10, 0.2); fire.material.blending = THREE.AdditiveBlending; scene.add(fire);
  const fire2 = stream(700, 0xffc030, 0.12); fire2.material.blending = THREE.AdditiveBlending; scene.add(fire2);
  const gas = stream(260, 0xc8e040, 0.16); gas.material.opacity = 0.35; scene.add(gas);
  const heat = stream(200, 0xffb070, 0.05); heat.material.opacity = 0.5; scene.add(heat);
  const xr = xray(0.5); scene.add(xr);
  const L = { sink: label("DOESN'T SINK", 0.9), dense: label('3× DENSER THAN WATER', 1.3), rock: label('LIKE A ROCK ON MUD', 1.2), deg: label('1000°C', 0.8), first: label('HEAT HITS FIRST', 1.0), fire: label('CLOTHES CATCH FIRE', 1.1), gas: label('TOXIC GAS', 0.85), suit: label('HEAT-PROOF SUIT', 1.0), close: label('NEVER TOO CLOSE', 1.0) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 500);
  const KEYS = [[0, [1.6, 2.6, 6.2], [-2.6, 1.3, 0.6]], [1.4, [1.6, 2.6, 6.2], [-2.4, 1.0, 0.7]], [3.0, [0.4, 2.1, 4.4], [-1.5, 0.3, 0.9]], [8.3, [0.4, 2.1, 4.4], [-1.4, 0.3, 0.9]],
    [9.2, [0.9, 2.0, 4.4], [-1.0, 0.3, 1.1]], [11.0, [0.9, 2.0, 4.4], [-1.0, 0.3, 1.1]], [12.2, [1.4, 2.6, 6.0], [-1.7, 1.0, 0.8]], [16.6, [1.4, 2.6, 6.0], [-1.7, 1.0, 0.8]],
    [17.4, [-0.1, 1.8, 3.5], [-1.5, 0.35, 0.9]], [21.9, [-0.1, 1.8, 3.5], [-1.5, 0.35, 0.9]], [23.2, [4.4, 2.6, 8.4], [0.6, 1.0, 2.0]], [27.6, [4.0, 2.3, 7.6], [1.0, 1.1, 2.2]]];
  return {
    scene, camera: cam,
    update(t) {
      lavaM.uniforms.time.value = t; glow.intensity = 60 + 8 * Math.sin(t * 3.1);
      // ---- hero: stands on ledge, slips at 1.2, falls, lands on lava at 2.9 and lies on top ----
      const fallK = Math.min(1, Math.max(0, (t - 1.25) / 1.6)); const fell = fallK >= 1;
      const top = 1.62, landY = 0.1;
      const y = t < 1.25 ? top : fell ? landY + 0.03 * Math.sin(t * 1.3) : lerp(top, landY, fallK * fallK) + Math.sin(fallK * Math.PI) * 0.4;
      const z = 0.9; const x = t < 1.25 ? -3.3 : lerp(-3.3, -1.6, Math.min(1, fallK * 1.2));
      const lie = sm(1.5, 2.9, t);
      hero.root.position.set(x, y + 0.05 * lie, z); hero.root.rotation.set(-Math.PI / 2 * lie, 1.2 * (1 - lie), 0);
      const gasK = sm(18.9, 19.4, t);
      hero.update(t, { idle: 1 }, 1, { flinch: sm(1.1, 1.4, t) * (1 - sm(3.2, 3.8, t)), armsUp: 0.6 * sm(1.3, 1.6, t) * (1 - sm(2.8, 3.2, t)), handsThroat: gasK, lookUp: 0.2 * lie });
      // ---- rock dropped on the lava: floats like his body ----
      const rk = Math.min(1, Math.max(0, (t - 9.3) / 0.65)); rock.visible = t > 9.2;
      rock.position.set(-0.45, rk < 1 ? lerp(4.5, 0.0, rk * rk) : -0.02 + 0.02 * Math.sin(t * 1.5), 1.3); rock.rotation.set(t * (rk < 1 ? 3 : 0), 0.6, 0);
      // ---- heat aura replay: ghost of him mid-fall glowing red ----
      const hk = sm(14.2, 14.5, t) * (1 - sm(16.4, 16.8, t)); heatGhost.fade(hk); heatGhost.position.set(-2.4, 1.1, 0.9); heatGhost.rotation.set(-0.5, 1.2, 0.3);
      // ---- scientist in heat suit on the rim ----
      suit.visible = t > 22.2; suit.position.set(2.4, 0.35, 3.2); suit.rotation.y = -2.2;
      // ---- camera ----
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const chest = hero.world('Spine2'), head = hero.headPos();
      fire.update(chest, V(0, 1, 0), 17.6, 22.3, t, 0.7, 0.5); fire2.update(hero.world('Hips'), V(0, 1, 0), 17.8, 22.3, t, 0.7, 0.8);
      gas.update(V(-1.6, 0.2, 0.6), V(0, 0.6, 0.6), 18.6, 22.0, t, 1.4, 2.6);
      heat.update(V(-2.0, 0.1, 0.9), V(0, 1, 0), 11.5, 16.8, t, 1.6, 3.0);
      const xk = sm(19.4, 19.7, t) * (1 - sm(21.8, 22.1, t));
      if (xk > 0.01) xr.show(chest.clone().add(V(0.25, 0.5, 0.3)), xk, (g, kk) => drawGasLungs(g, kk), sm(19.6, 21.6, t), t); else xr.visible = false;
      const up = (y) => V(0, y, 0);
      showLabel(L.sink, chest.clone().add(up(0.7)), t, 4.0, 5.3);
      showLabel(L.dense, V(-1.2, 1.0, 0.6), t, 6.1, 8.3);
      showLabel(L.rock, V(-0.7, 1.0, 1.4), t, 9.8, 11.2);
      showLabel(L.deg, V(-1.6, 2.2, 0.8), t, 12.0, 14.1);
      showLabel(L.first, V(-1.6, 2.2, 0.8), t, 14.4, 16.7);
      showLabel(L.fire, chest.clone().add(V(0.3, 0.8, 0)), t, 17.9, 18.9);
      showLabel(L.gas, chest.clone().add(V(0.2, 0.8, 0)), t, 19.1, 21.8);
      showLabel(L.suit, V(2.0, 2.4, 3.2), t, 24.2, 25.6);
      showLabel(L.close, V(2.0, 2.4, 3.2), t, 25.8, 27.6);
      return { bloom: 0.55, exposure: 0.95 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
