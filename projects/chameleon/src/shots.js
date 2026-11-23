import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, person, label, showLabel, xray, ghost, keyCam, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 29.8;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/chameleon', 'dead_tree_trunk', 'potted_plant_02'], hdris: ['studio_garden'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawCrystals(g, k, t) { // skin cell with a lattice of nanocrystals; spacing grows -> reflected colour shifts green->red
  const sp = lerp(26, 46, k); const col = k < 0.33 ? '#3ad04a' : k < 0.66 ? '#f0d020' : k < 0.85 ? '#ff8a20' : '#e83020';
  g.fillStyle = 'rgba(240,220,200,0.9)'; g.fillRect(40, 140, 432, 300);
  g.fillStyle = 'rgba(200,220,255,0.95)'; for (let y = 160; y < 430; y += sp) for (let x = 60; x < 460; x += sp) { g.beginPath(); g.arc(x, y, 7, 0, 6.283); g.fill(); }
  g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.beginPath(); g.moveTo(40, 40); g.lineTo(200, 150); g.stroke(); g.strokeStyle = col; g.lineWidth = 9; g.beginPath(); g.moveTo(300, 150); g.lineTo(470, 40); g.stroke();
  g.fillStyle = col; g.beginPath(); g.arc(470, 40, 18, 0, 6.283); g.fill();
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-3, 6, 4] }), 'studio_garden', { height: 1.6, radius: 10, sun: 1.6, env: 1.0 });
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.6, 12), new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.9 })); branch.rotation.z = Math.PI / 2 - 0.15; branch.position.set(0.3, 1.25, -0.3);
  const cham = fit(prop('sf/chameleon'), 0.8, 'max', { ground: false }); scene.add(cham);
  const mats = []; cham.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.userData.c0 = m.material.color.clone(); mats.push(m.material); } });
  const rival = ghost(cham, 0xffa060); scene.add(rival);
  const hero = person('hero'); scene.add(hero.root);
  const xr = xray(0.45); scene.add(xr);
  const L = { blend: label('TO BLEND IN?', 0.7), myth: label('MOSTLY A MYTH', 0.8), nano: label('NANOCRYSTALS', 0.8), excited: label('EXCITED', 0.6), stretch: label('SKIN STRETCHES', 0.8), apart: label('CRYSTALS MOVE APART', 1.0), light: label('LIGHT BOUNCES DIFFERENTLY', 1.2), mood: label('MOOD', 0.5), temp: label('TEMPERATURE', 0.7), show: label('SHOWING OFF', 0.7) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [0.0, 1.5, 3.0], [0.0, 1.25, -0.2]], [2.6, [0.1, 1.55, 2.3], [0.35, 1.5, -0.3]], [29.8, [0.1, 1.55, 2.3], [0.35, 1.5, -0.3]]];
  const COLS = [new THREE.Color(0x4ab04a), new THREE.Color(0xe8d020), new THREE.Color(0xf08020), new THREE.Color(0xd83020)];
  return {
    scene, camera: cam,
    update(t) {
      // colour: green until 19.6, then -> yellow (21), orange (21.7), red (22.8); back to green for 'mood', then shifting
      const s1 = sm(19.6, 21.0, t), s2 = sm(21.4, 22.0, t), s3 = sm(22.4, 23.0, t), back = sm(24.0, 24.6, t), show = sm(27.0, 27.6, t);
      const c = COLS[0].clone().lerp(COLS[1], s1).lerp(COLS[2], s2).lerp(COLS[3], s3).lerp(COLS[0], back * (1 - show)).lerp(COLS[3], show);
      mats.forEach(m => m.color.copy(m.userData ? c : c));
      cham.position.set(0.15, 1.3, -0.3); cham.rotation.set(0, 0.3, 0); cham.scale.setScalar((cham.userData.s0 ??= cham.scale.x) * (1 + 0.06 * sm(12.4, 13.2, t)));
      rival.fade(0.7 * sm(27.6, 28.0, t)); rival.position.set(0.95, 1.3, -0.4); rival.rotation.set(0, -0.6, 0);
      hero.update(t, { idle: 1 }, 1, { point: 0.6 * sm(3.0, 3.4, t) * (1 - sm(7.0, 7.4, t)) }); hero.root.position.set(-0.35, 0, 0.1); hero.root.rotation.y = 0.7;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const xk = sm(10.0, 10.3, t) * (1 - sm(19.4, 19.7, t));
      if (xk > 0.01) xr.show(V(0.5, 1.68, -0.25), xk, drawCrystals, sm(14.4, 16.4, t), t); else xr.visible = false;
      const cp = V(0.35, 1.52, -0.3);
      showLabel(L.blend, cp, t, 4.6, 6.2); showLabel(L.myth, cp, t, 6.3, 8.1); showLabel(L.nano, V(0.5, 1.98, -0.25), t, 10.4, 11.7);
      showLabel(L.excited, cp, t, 11.9, 13.6); showLabel(L.stretch, V(0.5, 1.98, -0.25), t, 13.7, 15.1); showLabel(L.apart, V(0.5, 1.98, -0.25), t, 15.2, 17.0); showLabel(L.light, V(0.5, 1.98, -0.25), t, 17.1, 19.4);
      showLabel(L.mood, cp, t, 25.2, 25.9); showLabel(L.temp, cp, t, 25.9, 26.8); showLabel(L.show, cp, t, 27.1, 29.8);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
