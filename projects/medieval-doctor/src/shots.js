import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 23.8;
export const CAPTIONS = [
  [0.0, 'What was it like to visit a doctor in the Middle Ages?'],
  [3.25, 'Got a fever?'], [4.28, 'The doctor might cut you to drain some blood'], [6.65, 'believing it would balance your body'],
  [8.74, 'Some even stuck blood-sucking leeches'], [11.02, 'on your skin'],
  [12.18, 'A bad headache?'], [13.26, 'They could drill a hole in your skull!'],
  [15.64, 'And during the plague'], [16.81, 'doctors wore creepy bird masks'], [19.01, 'stuffed with herbs'], [20.32, 'thinking bad smells spread the disease', 23.6],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const SIT = { drop: -0.45, lHip: [-1.5, 0, 0.12], lKn: [1.45, 0, 0], rHip: [-1.5, 0, -0.12], rKn: [1.45, 0, 0] };
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-2, 6, 3], sun: 0.4 });
  scene.userData.sky.visible = false; scene.background = new THREE.Color(0x120c08); scene.fog = null;
  scene.children.filter(o => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry').forEach(o => o.visible = false);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xffd8a0); hemi.groundColor.set(0x2a1a10); hemi.intensity = 0.45;
  // stone room
  const st = canvasTex(256, 256, (g) => { g.fillStyle = '#6a5e50'; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(30,24,18,0.6)'; g.lineWidth = 4; for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) g.strokeRect(c * 64 + (r % 2) * 32, r * 32, 64, 32); });
  st.wrapS = st.wrapT = THREE.RepeatWrapping; st.repeat.set(4, 2);
  const wallM = new THREE.MeshStandardMaterial({ map: st, roughness: 0.95 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), wallM); back.position.set(0, 2, -2.2); scene.add(back);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), wallM); side.position.set(-3.0, 2, 1.0); side.rotation.y = Math.PI / 2; scene.add(side);
  const floorT = canvasTex(256, 256, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#5a3e28' : '#4e3622'; g.fillRect(0, i * 32, 256, 32); } });
  floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(3, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.8 });
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.3), wood); shelf.position.set(-1.2, 1.6, -2.05); scene.add(shelf);
  const jr = rng(3); for (let i = 0; i < 5; i++) { const j = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.22, 12), new THREE.MeshStandardMaterial({ color: [0x4a7a5a, 0x8a5a3a, 0x3a5a8a, 0x7a3a3a, 0x8a8a5a][i], transparent: true, opacity: 0.85 })); j.position.set(-1.8 + i * 0.3, 1.74, -2.05); scene.add(j); }
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), new THREE.MeshStandardMaterial({ color: 0xe8dcc0 })); skull.position.set(-0.45, 1.73, -2.05); scene.add(skull);
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.6), wood); table.position.set(1.3, 0.8, -1.3); scene.add(table);
  for (const [x, z] of [[0.85, -1.05], [1.75, -1.05], [0.85, -1.55], [1.75, -1.55]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.06), wood); l.position.set(x, 0.4, z); scene.add(l); }
  const candles = []; for (const [x, z] of [[1.1, -1.3], [1.55, -1.2], [-1.6, -2.0]]) { const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 10), new THREE.MeshStandardMaterial({ color: 0xf4ecd8 })); const y = x < 0 ? 1.72 : 0.92; cd.position.set(x, y, z); scene.add(cd); const fl = glowSprite(0xffb050, 0.18); fl.position.set(x, y + 0.13, z); scene.add(fl); const L = new THREE.PointLight(0xffa850, 3, 4, 1.4); L.position.set(x, y + 0.2, z + 0.1); scene.add(L); candles.push({ fl, L }); }
  const fill = new THREE.PointLight(0xffd8b0, 4, 7, 1.3); fill.position.set(1.0, 2.2, 2.4); scene.add(fill);
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 16), wood); stool.position.set(-0.25, 0.48, -0.4); scene.add(stool);
  for (let i = 0; i < 3; i++) { const a = i / 3 * 6.28; const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.46, 6), wood); l.position.set(-0.25 + Math.cos(a) * 0.14, 0.23, -0.4 + Math.sin(a) * 0.14); scene.add(l); }
  // patient (hero) + doctor
  const hero = makeHuman('casual', { shirt: 0xd8c8a0, jeans: 0x5a4a3a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  hero.root.traverse(o => { if (o.isMesh && o.material && o.material.color && o.material.color.getHex() === 0xd8c8a0 && !o.material.map) { o.material = o.material.clone(); o.material.color.set(0x7a4a8a); } });
  const doc = makeHuman('casual', { shirt: 0x1a1a1e, jeans: 0x1a1a1e, hair: 0x5a5a5a, beard: true }); scene.add(doc.root);
  const hatM = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.7 });
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.02, 24), hatM); brim.position.y = 0.2; doc.j.head.add(brim); const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.2, 20), hatM); crown.position.y = 0.3; doc.j.head.add(crown);
  // plague mask (appears)
  const mask = new THREE.Group(); doc.j.head.add(mask);
  const leather = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.6 });
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.42, 16), leather); beak.rotation.x = Math.PI / 2 + 0.35; beak.position.set(0, 0.0, 0.3); mask.add(beak);
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 14), leather); hood.position.y = 0.08; hood.scale.set(1, 1.05, 1.05); mask.add(hood);
  for (const s of [-1, 1]) { const eye = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), new THREE.MeshStandardMaterial({ color: 0x9fd8ff, metalness: 0.6, roughness: 0.1, emissive: 0x204060 })); eye.position.set(s * 0.06, 0.11, 0.145); mask.add(eye); const rimm = new THREE.Mesh(new THREE.TorusGeometry(0.037, 0.008, 6, 16), new THREE.MeshStandardMaterial({ color: 0xb08a40, metalness: 0.7 })); rimm.position.copy(eye.position); mask.add(rimm); }
  const herbs = []; for (let i = 0; i < 6; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), new THREE.MeshStandardMaterial({ color: 0x5be37d })); h.scale.set(0.5, 1.6, 0.3); h.position.set((i - 2.5) * 0.015, -0.02 + (i % 2) * 0.02, 0.48); mask.add(h); herbs.push(h); }
  mask.scale.setScalar(0.001);
  // tools
  const knife = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.16, 0.005), new THREE.MeshStandardMaterial({ color: 0xd8dce4, metalness: 0.8, roughness: 0.2 })); scene.add(knife);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xb08a40, metalness: 0.6, side: THREE.DoubleSide })); scene.add(bowl);
  const drops = []; for (let i = 0; i < 8; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), new THREE.MeshBasicMaterial({ color: 0xc0182a })); d.userData.ph = i / 8; scene.add(d); drops.push(d); }
  const leeches = []; for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.05, 4, 8), new THREE.MeshStandardMaterial({ color: 0x1a2a1a, roughness: 0.3 })); scene.add(l); leeches.push(l); }
  const drill = new THREE.Group(); const dbit = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.12, 8), new THREE.MeshStandardMaterial({ color: 0xc8ccd4, metalness: 0.8 })); dbit.rotation.x = Math.PI; dbit.position.y = -0.06; drill.add(dbit); const dsh = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 6), wood); dsh.position.y = 0.15; drill.add(dsh); const dcr = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.02), wood); dcr.position.y = 0.26; drill.add(dcr); scene.add(drill);
  const heat = glowSprite(0xff3b2a, 0.7); scene.add(heat);
  const stars = []; for (let i = 0; i < 6; i++) { const s = glowSprite(0xffe14d, 0.08); scene.add(s); stars.push(s); }
  const stink = []; for (let i = 0; i < 10; i++) { const s = glowSprite(0x7aa83a, 0.4); s.userData.ph = i / 10; scene.add(s); stink.push(s); }
  const fx = { cut: burst(0xc0182a, 20, 1), drill: burst(0xffe14d, 40, 2), mask: burst(0x5be37d, 50, 3) }; Object.values(fx).forEach(f => scene.add(f));
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      candles.forEach(({ fl, L }, i) => { const f = 0.85 + 0.15 * Math.sin(t * 13 + i * 3) + 0.08 * Math.sin(t * 29 + i); fl.scale.setScalar(0.18 * f); L.intensity = 3 * f; });
      // patient
      hero.root.position.set(-0.25, 0.05, -0.4); hero.root.rotation.y = 0.35;
      const fever = smooth(range(t, 3.3, 3.8)) * (1 - smooth(range(t, 8.4, 8.9)));
      const scared = smooth(range(t, 12.4, 12.9)) * (1 - smooth(range(t, 15.4, 15.9)));
      hero.setPose(over(STAND(t), SIT, { lSh: [-0.6, 0, 0.3], lEl: [-0.4, 0, 0], rSh: [0.05, 0, -0.16], rEl: [-0.8, 0, 0], neck: [0.15 - 0.3 * scared, Math.sin(t * 20) * 0.05 * fever, 0], spine: [0.1 - 0.15 * scared, 0, 0] }));
      hero.setMouth(scared > 0.3 ? 0.8 : fever > 0.3 ? 0.25 : 0.06);
      // doctor
      const approach = smooth(range(t, 0.2, 1.8));
      doc.root.position.set(lerp(1.6, 0.45, approach), 0, lerp(-1.5, -0.95, approach)); doc.root.rotation.y = -1.0;
      doc.setPose(over(STAND(t, 2), approach > 0 && approach < 1 ? { lHip: [-0.4 * Math.sin(t * 6), 0, 0.07], rHip: [0.4 * Math.sin(t * 6), 0, -0.07] } : {}, { spine: [0.2, 0, 0], neck: [0.2, 0, 0] }));
      doc.setMouth(0.05);
      const mk = easeOut(range(t, 16.7, 17.3));
      mask.scale.setScalar(Math.max(0.001, mk)); herbs.forEach(h => h.visible = t > 19.0);
      scene.updateMatrixWorld(true);
      const arm = hero.j.lEl.localToWorld(V(0, -0.12, 0)), head = hero.j.head.getWorldPosition(V());
      const drs = doc.j.rSh.getWorldPosition(V()), dls = doc.j.lSh.getWorldPosition(V());
      const cutK = smooth(range(t, 4.2, 4.8)) * (1 - smooth(range(t, 8.4, 8.9)));
      const leechK = smooth(range(t, 8.8, 9.3)) * (1 - smooth(range(t, 11.6, 12.0)));
      const drillK = smooth(range(t, 12.8, 13.6)) * (1 - smooth(range(t, 15.0, 15.5)));
      let rT = drs.clone().add(V(0.05, -0.55, 0.05));
      if (cutK > 0.01) rT = rT.lerp(arm.clone().add(V(0.05, 0.05, 0.05)), cutK);
      if (leechK > 0.01) rT = rT.lerp(arm.clone().add(V(0.05, 0.08 + 0.04 * Math.sin(t * 3), 0.08)), leechK);
      if (drillK > 0.01) rT = rT.lerp(head.clone().add(V(0.04, 0.42 - 0.1 * smooth(range(t, 13.6, 14.4)), 0.02)), drillK);
      ikArm(doc, 'r', rT, drs.clone().add(V(0.2, -0.3, 0.3)), V(0, 0, 1));
      if (cutK > 0.01) ikArm(doc, 'l', dls.clone().add(V(0, -0.55, 0.05)).lerp(arm.clone().add(V(0.0, -0.25, 0.08)), cutK), dls.clone().add(V(-0.2, -0.3, 0.3)), V(0, 0, 1));
      scene.updateMatrixWorld(true);
      const drh = doc.j.rWr.localToWorld(V(0, -0.07, 0)), dlh = doc.j.lWr.localToWorld(V(0, -0.07, 0));
      knife.position.copy(drh); knife.visible = cutK > 0.05 && t < 8.4; knife.rotation.set(0, 0, 0.6);
      bowl.position.copy(dlh).add(V(0, 0.02, 0)); bowl.visible = cutK > 0.05;
      drops.forEach((d, i) => { const u2 = (t * 1.6 + d.userData.ph) % 1; d.position.copy(arm).lerp(bowl.position.clone().add(V(0, 0.05, 0)), u2); d.visible = cutK > 0.5 && t > 5.4; });
      fx.cut.position.copy(arm); fx.cut.update(t - 5.0);
      const hk = fever; heat.position.copy(head); heat.material.opacity = 0.35 * hk * (0.7 + 0.3 * Math.sin(t * 6)); heat.visible = hk > 0.01;
      leeches.forEach((l, i) => { const k = easeOut(range(t, 9.6 + i * 0.25, 9.9 + i * 0.25)) * (1 - smooth(range(t, 11.8, 12.1))); l.position.copy(hero.j.lEl.localToWorld(V(0.045 * Math.cos(i * 1.4), -0.04 - i * 0.045, 0.045 * Math.sin(i * 1.4) + 0.02))); l.scale.setScalar(Math.max(0.001, k * (1 + 0.15 * Math.sin(t * 5 + i)))); l.visible = k > 0.01; l.rotation.set(0.3, i, 1.2); });
      drill.position.copy(drh); drill.rotation.y = t * 25; drill.visible = drillK > 0.05;
      fx.drill.position.copy(head).add(V(0, 0.2, 0)); fx.drill.update(t - 14.4);
      stars.forEach((s, i) => { const a = i / 6 * 6.28 + t * 4; s.position.copy(head).add(V(Math.cos(a) * 0.22, 0.25, Math.sin(a) * 0.22)); s.visible = t > 14.4 && t < 15.6; });
      fx.mask.position.copy(doc.j.head.getWorldPosition(V())); fx.mask.update(t - 16.8);
      const sk = smooth(range(t, 20.3, 20.8));
      stink.forEach((s, i) => { const u2 = (t * 0.25 + s.userData.ph) % 1; s.position.set(-1.6 + u2 * 3.2, 1.2 + Math.sin(i * 2 + t) * 0.4, -1.0 + Math.cos(i) * 0.4); s.material.opacity = sk * 0.45 * Math.sin(u2 * Math.PI); s.visible = sk > 0.01; });
      // ---------- camera ----------
      const KEYS = [[0, [0.9, 1.6, 4.2], [0.1, 0.9, -0.6]], [3.0, [0.7, 1.55, 3.6], [0.1, 0.9, -0.6]], [15.4, [0.7, 1.55, 3.6], [0.1, 0.95, -0.6]], [16.6, [0.9, 1.6, 3.0], [0.35, 1.2, -0.8]], [20.0, [0.9, 1.6, 3.0], [0.3, 1.15, -0.8]], [23.8, [0.9, 1.65, 4.0], [0.1, 0.95, -0.6]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.35 + (t > 14.3 && t < 14.8 ? 2.5 : 0), 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.5, exposure: 1.15 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
