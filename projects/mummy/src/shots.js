import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, texMat, person, label, showLabel, xray, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 25.4;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/sarcophagus', 'antique_ceramic_vase_01', 'Lantern_01'], hdris: ['cave_wall'], tex: ['sandstone_cracks'], people: ['hero', 'eric', 'manuel'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawNose(g, k) { // head profile; hook goes up the nose to the brain
  g.lineWidth = 10; g.beginPath(); g.moveTo(120, 120); g.bezierCurveTo(200, 40, 380, 60, 420, 200); g.lineTo(450, 270); g.lineTo(410, 290); g.lineTo(400, 360); g.stroke();
  g.fillStyle = `rgba(255,150,170,${0.85 * (1 - k)})`; g.beginPath(); g.ellipse(270, 170, 110, 70, 0, 0, 6.283); g.fill();
  g.strokeStyle = '#ffd24a'; g.lineWidth = 8; g.beginPath(); const tip = lerp(0, 1, Math.min(1, k * 2)); g.moveTo(520, 300); g.lineTo(lerp(440, 330, tip), lerp(285, 200, tip)); g.arc(lerp(440, 330, tip) - 10, lerp(285, 200, tip), 10, 0, Math.PI); g.stroke();
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-2, 6, 3] }), 'cave_wall', { height: 1.6, radius: 9, sun: 0.7, sunColor: 0xffd8a8, env: 0.5 });
  const stoneM = texMat('sandstone_cracks', 2, 1, { color: 0xa89878 });
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.85, 0.8), stoneM); table.position.set(0, 0.425, -0.5); table.castShadow = table.receiveShadow = true; scene.add(table);
  const lamp = new THREE.PointLight(0xffb060, 6, 6, 1.5); lamp.position.set(0.9, 1.6, 0.3); scene.add(lamp);
  const body = person('eric', { print: false }); scene.add(body.root);
  const linenMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 1 }); const orig = new Map(); body.root.traverse(m => { if (m.isMesh) orig.set(m, m.material); });
  const embalmer = person('manuel', { print: false }); ghost(embalmer.root, 0xffe0b0, { inPlace: true }); embalmer.root.traverse(m => { if (m.isMesh) m.material.blending = THREE.NormalBlending; }); scene.add(embalmer.root);
  const jars = []; for (let i = 0; i < 4; i++) { const j = prop('antique_ceramic_vase_01', 0.75); j.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.map = null; m.material.color.set(0xd8c8a8); } }); j.position.set(-0.75 + i * 0.5, 0, 0.55); scene.add(j); jars.push(j); }
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 14), new THREE.MeshStandardMaterial({ color: 0xc02030, emissive: 0x600010, roughness: 0.4 })); heart.renderOrder = 10; scene.add(heart);
  const salt = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.45, 32, 1), new THREE.MeshStandardMaterial({ color: 0xf4f2ec, roughness: 1 })); salt.scale.set(1.0, 1, 0.33); salt.castShadow = true; scene.add(salt);
  const saltFall = stream(500, 0xffffff, 0.03); scene.add(saltFall);
  const coffin = fit(prop('sf/sarcophagus'), 1.4, 'max'); coffin.position.set(1.7, 0, -1.4); coffin.rotation.y = -0.6; scene.add(coffin);
  const hero = person('hero'); scene.add(hero.root);
  const xr = xray(0.48); scene.add(xr);
  const L = { emb: label('EMBALMERS', 0.8), hook: label('BRAIN OUT THROUGH THE NOSE', 1.6), jarsL: label('ORGANS IN JARS', 1.1), heartL: label('HEART STAYS INSIDE', 1.2), saltL: label('SALT: 40 DAYS', 1.0), dry: label('DRIES IT OUT', 0.9), linen: label('HUNDREDS OF METERS OF LINEN', 1.7), days: label('70 DAYS!', 0.9) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [1.6, 2.6, 3.8], [0, 0.95, -0.5]], [1.8, [0.9, 2.5, 2.6], [-0.3, 1.0, -0.5]], [7.2, [0.9, 2.5, 2.6], [-0.3, 1.0, -0.5]], [7.8, [0.6, 2.2, 3.0], [0, 0.7, 0]], [12.8, [0.6, 2.2, 3.0], [0, 0.85, -0.3]], [13.4, [0.9, 2.7, 3.2], [0, 0.95, -0.5]], [17.0, [0.9, 2.7, 3.2], [0, 0.95, -0.5]], [17.6, [1.4, 2.5, 3.4], [0.2, 0.95, -0.6]], [25.4, [1.6, 2.5, 3.8], [0.4, 0.95, -0.8]]];
  return {
    scene, camera: cam,
    update(t) {
      body.update(0, { idle: 1 }, 1, {}); body.root.position.set(-0.95, 0.88, -0.5); body.root.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
      const wrap = sm(17.6, 21.2, t); body.root.traverse(m => { if (m.isMesh) m.material = wrap > 0.5 ? linenMat : orig.get(m); });
      const ek = sm(1.9, 2.3, t) * (1 - sm(12.6, 13.0, t)) + sm(17.4, 17.8, t) * (1 - sm(21.2, 21.6, t));
      embalmer.update(t, { idle: 1 }, 1, { point: 0.8, lean: 0.4 + 0.1 * Math.sin(t * 4) }); embalmer.root.fade(0.7 * ek); embalmer.root.position.set(-0.2, 0, -1.25); embalmer.root.rotation.y = 0;
      jars.forEach((j, i) => { const k = sm(9.0 + i * 0.25, 9.3 + i * 0.25, t); j.visible = k > 0.01; j.scale.setScalar(0.75 * k); });
      const hk = sm(11.2, 11.5, t) * (1 - sm(13.0, 13.3, t)); heart.visible = hk > 0.01; heart.position.set(-0.2, 1.0, -0.5); heart.scale.setScalar(hk * (1 + 0.15 * Math.sin(t * 8)));
      const sk = sm(13.6, 15.0, t) * (1 - sm(17.0, 17.6, t)); salt.visible = sk > 0.01; salt.position.set(0, 0.85 + 0.2 * sk, -0.5); salt.scale.y = sk;
      hero.update(t, { idle: 1 }, 1, { point: 0.6 * sm(21.6, 22.0, t), handsThroat: 0.5 * sm(3.8, 4.2, t) * (1 - sm(6.6, 7.0, t)) });
      hero.root.position.set(0.95, 0, 0.35); hero.root.rotation.y = -1.0;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      saltFall.update(V(0, 2.2, -0.5), V(0, -1, 0), 13.6, 15.4, t, 2.0, 0.9);
      const bh = body.headPos();
      const xk = sm(3.8, 4.1, t) * (1 - sm(7.0, 7.3, t));
      if (xk > 0.01) xr.show(bh.clone().add(V(0.15, 0.55, 0.2)), xk, drawNose, sm(4.0, 6.6, t), t); else xr.visible = false;
      const tp = V(0, 1.7, -0.5);
      showLabel(L.emb, tp, t, 2.6, 3.7); showLabel(L.hook, tp, t, 3.8, 7.2); showLabel(L.jarsL, V(0, 1.2, 0.55), t, 7.8, 11.0); showLabel(L.heartL, V(-0.2, 1.4, -0.5), t, 11.2, 13.2);
      showLabel(L.saltL, tp, t, 13.4, 15.8); showLabel(L.dry, tp, t, 15.9, 17.2); showLabel(L.linen, tp, t, 17.6, 21.4); showLabel(L.days, hero.headPos().add(V(0, 0.4, 0)), t, 21.6, 25.4);
      return { bloom: 0.3, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
