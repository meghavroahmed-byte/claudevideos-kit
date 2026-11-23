import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { textSprite } from './room.js';
import { rng, glowTexture } from './textures.js';

export const DURATION = 24.6;
export const CAPTIONS = [
  [0.0, 'What should you do if a shark attacks?'],
  [2.64, "First, don't panic"], [4.31, 'and splash around'], [5.71, 'That makes you look'], [6.59, 'like wounded prey'],
  [8.01, 'Keep your eyes on the shark'], [9.35, 'and slowly back away'], [10.94, 'toward the shore or a boat'],
  [12.94, 'If it charges'], [14.01, 'hit it hard on the nose'], [15.56, 'the eyes'], [16.25, 'or the gills'], [17.34, 'Those are its weak spots'],
  [18.95, 'But relax'], [19.89, "You're more likely to be struck by lightning"], [21.95, 'than bitten by a shark!', 24.4],
];
export const FADES = [];

const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const SURF = 3.2, PUNCH = 14.05;

function makeShark() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const grey = new THREE.MeshStandardMaterial({ color: 0x6f8496, roughness: 0.5 }), belly = new THREE.MeshStandardMaterial({ color: 0xe8eef2, roughness: 0.6 });
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), grey); top.scale.set(2.0, 0.85, 0.75); top.rotation.z = 0; body.add(top);
  const bot = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45), belly); bot.scale.set(2.0, 0.85, 0.75); body.add(bot);
  const fin = (w, h, mat) => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(w, 0); s.quadraticCurveTo(w * 0.2, h * 0.3, -w * 0.15, h); s.lineTo(0, 0); const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false }), mat); return m; };
  const dorsal = fin(0.45, 0.5, grey); dorsal.position.set(0.05, 0.36, -0.015); dorsal.rotation.y = Math.PI; body.add(dorsal);
  for (const z of [1, -1]) { const p = fin(0.35, 0.35, grey); p.position.set(0.3, -0.15, 0.2 * z); p.rotation.set(z * 1.2, Math.PI, 0); body.add(p); }
  const tail = new THREE.Group(); tail.position.set(-0.95, 0.02, 0); body.add(tail);
  const stalk = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 16), grey); stalk.rotation.z = Math.PI / 2; stalk.position.x = -0.15; tail.add(stalk);
  const up = fin(0.25, 0.55, grey); up.position.set(-0.35, 0, -0.015); up.rotation.set(0, Math.PI, 0.35); tail.add(up);
  const dn = fin(0.22, 0.38, grey); dn.position.set(-0.35, 0, 0.015); dn.rotation.set(Math.PI, Math.PI, -0.35); tail.add(dn);
  const eyes = []; for (const z of [1, -1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: 0x0a0a0a })); e.position.set(0.72, 0.09, 0.2 * z); body.add(e); eyes.push(e); }
  for (let i = 0; i < 4; i++) for (const z of [1, -1]) { const gl = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.16, 0.01), new THREE.MeshBasicMaterial({ color: 0x3a4a58 })); gl.position.set(0.5 - i * 0.06, -0.02, 0.27 * z); gl.rotation.z = 0.25; body.add(gl); }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 6, 16, Math.PI), new THREE.MeshBasicMaterial({ color: 0x3a2a2a })); mouth.position.set(0.72, -0.16, 0); mouth.rotation.set(Math.PI / 2, 0, Math.PI / 2 + Math.PI); mouth.scale.set(1, 1.4, 1); body.add(mouth);
  const teeth = []; for (let i = 0; i < 9; i++) { const th = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.05, 4), new THREE.MeshStandardMaterial({ color: 0xffffff })); const a = (i / 8 - 0.5) * 2.4; th.position.set(0.66 + Math.cos(a) * 0.12, -0.13, Math.sin(a) * 0.17); th.rotation.x = Math.PI; body.add(th); teeth.push(th); }
  return { g, body, tail, nose: V(0.98, 0.0, 0), eye: V(0.72, 0.09, 0.2), gill: V(0.42, -0.02, 0.27) };
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-1, 8, 2], sun: 1.8 });
  scene.userData.sky.visible = false;
  scene.children.filter(o => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry' && !o.material.isShadowMaterial).forEach(o => o.visible = false);
  scene.background = new THREE.Color(0x1f9fc8); scene.fog = new THREE.Fog(0x1f9fc8, 4, 22);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xcff4ff); hemi.groundColor.set(0x2a6a7a); hemi.intensity = 1.1;
  // seabed: sand + rocks + coral
  const sandT = canvasTex(512, 512, (g) => { g.fillStyle = '#e8d9a8'; g.fillRect(0, 0, 512, 512); const r = rng(5); for (let i = 0; i < 2000; i++) { g.fillStyle = r() > 0.5 ? 'rgba(190,170,120,0.35)' : 'rgba(255,250,225,0.5)'; g.fillRect(r() * 512, r() * 512, 2, 2); } g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 6; for (let i = 0; i < 18; i++) { g.beginPath(); g.moveTo(0, i * 30); g.bezierCurveTo(170, i * 30 + 20, 340, i * 30 - 20, 512, i * 30); g.stroke(); } });
  sandT.wrapS = sandT.wrapT = THREE.RepeatWrapping; sandT.repeat.set(20, 20);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ map: sandT, roughness: 1 })); sand.rotation.x = -Math.PI / 2; sand.receiveShadow = true; sand.position.y = -1.2; scene.add(sand);
  const rr = rng(8); const coralCols = [0xff6f91, 0xffb347, 0xb05cff, 0xff4d6d, 0x39d0ff];
  for (let i = 0; i < 26; i++) { const x = (rr() - 0.5) * 14, z = -2 - rr() * 9; if (rr() > 0.5) { const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + rr() * 0.6), new THREE.MeshStandardMaterial({ color: 0x6a7a74, flatShading: true })); rk.position.set(x, -1.1, z); scene.add(rk); } else { const cg = new THREE.Group(); cg.position.set(x, -1.2, z); scene.add(cg); const col = coralCols[i % 5]; for (let k = 0; k < 5; k++) { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.6 + rr() * 0.6, 6), new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 })); br.position.set((rr() - 0.5) * 0.3, 0.35, (rr() - 0.5) * 0.3); br.rotation.set((rr() - 0.5) * 0.8, 0, (rr() - 0.5) * 0.8); cg.add(br); } } }
  // surface + rays
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(80, 80, 40, 40), new THREE.MeshStandardMaterial({ color: 0x9fe8ff, emissive: 0x5fc8e8, emissiveIntensity: 0.6, transparent: true, opacity: 0.85, side: THREE.DoubleSide, roughness: 0.1 })); surf.rotation.x = Math.PI / 2; surf.position.y = SURF; scene.add(surf);
  const rayT = canvasTex(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); });
  const rays = []; for (let i = 0; i < 8; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 6), new THREE.MeshBasicMaterial({ map: rayT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); r.position.set(-4 + i * 1.1, SURF - 3, -1.5 - (i % 3)); r.rotation.z = 0.2; scene.add(r); rays.push(r); }
  // boat hull seen from below (left)
  const boat = new THREE.Group(); boat.position.set(-3.2, SURF, -0.6); scene.add(boat);
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd84a3a, roughness: 0.6 })); hull.scale.set(2.2, 0.5, 0.8); boat.add(hull);
  // fish school
  const fish = []; for (let i = 0; i < 18; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 6), new THREE.MeshStandardMaterial({ color: 0xffd23f })); f.rotation.z = -Math.PI / 2; f.userData = { ph: i * 0.6, y: 0.2 + (i % 4) * 0.25, z: -3.5 - (i % 3) * 0.4 }; scene.add(f); fish.push(f); }
  // bubbles
  const NB = 80, bp = new Float32Array(NB * 3), bgeo = new THREE.BufferGeometry(); bgeo.setAttribute('position', new THREE.BufferAttribute(bp, 3));
  const bubs = new THREE.Points(bgeo, new THREE.PointsMaterial({ size: 0.05, map: glowTexture(), color: 0xffffff, transparent: true, depthWrite: false })); bubs.frustumCulled = false; scene.add(bubs);
  // hero (treading water)
  const hero = makeHuman('casual', { shirt: 0xff5a5a, jeans: 0x2a4a7a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const shark = makeShark(); scene.add(shark.g); shark.g.scale.setScalar(0.8);
  // target rings on weak spots
  const ringM = () => new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 8, 28), new THREE.MeshBasicMaterial({ color: 0xffe14d, transparent: true, toneMapped: false, depthTest: false }));
  const rings = [ringM(), ringM(), ringM()]; rings.forEach(r => { r.renderOrder = 25; scene.add(r); });
  const ringLbl = ['NOSE', 'EYES', 'GILLS'].map(s => { const t = textSprite(s, '#ffe14d', "400 100px Brand, sans-serif"); t.renderOrder = 26; t.material.depthTest = false; scene.add(t); return t; });
  const eyeDots = []; for (let i = 0; i < 12; i++) { const s = glowSprite(0xffffff, 0.06); scene.add(s); eyeDots.push(s); }
  const prey = glowSprite(0xff3b3b, 1.2); scene.add(prey);
  // relax: lightning vs shark icons
  const boltT = canvasTex(256, 256, (g) => { g.fillStyle = '#ffd23f'; g.strokeStyle = '#fff'; g.lineWidth = 8; g.beginPath(); g.moveTo(150, 10); g.lineTo(60, 140); g.lineTo(120, 140); g.lineTo(90, 246); g.lineTo(200, 100); g.lineTo(138, 100); g.closePath(); g.fill(); g.stroke(); });
  const sharkT = canvasTex(256, 160, (g) => { g.fillStyle = '#6f8496'; g.beginPath(); g.ellipse(120, 90, 90, 32, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(110, 60); g.lineTo(140, 15); g.lineTo(150, 62); g.fill(); g.beginPath(); g.moveTo(35, 90); g.lineTo(0, 55); g.lineTo(10, 92); g.lineTo(0, 128); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(185, 82, 5, 0, 7); g.fill(); });
  const bolt = new THREE.Sprite(new THREE.SpriteMaterial({ map: boltT, transparent: true, depthTest: false, toneMapped: false })); bolt.renderOrder = 30; scene.add(bolt);
  const sIcon = new THREE.Sprite(new THREE.SpriteMaterial({ map: sharkT, transparent: true, depthTest: false, toneMapped: false })); sIcon.renderOrder = 30; scene.add(sIcon);
  const gt = textSprite('>', '#ffffff', "400 200px Brand, sans-serif"); gt.renderOrder = 30; gt.material.depthTest = false; scene.add(gt);
  const fx = { punch: burst(0xffffff, 60, 1), flash: burst(0xffd23f, 60, 2) }; Object.values(fx).forEach(f => scene.add(f));
  const noSplash = stamp("DON'T SPLASH!", '#ff3b3b', 0.7); scene.add(noSplash);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // water motion
      const pa = surf.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i); pa.setZ(i, Math.sin(x * 0.8 + t * 1.5) * 0.06 + Math.cos(y * 0.7 + t * 1.2) * 0.06); } pa.needsUpdate = true;
      rays.forEach((r, i) => r.material.opacity = 0.6 + 0.4 * Math.sin(t * 1.1 + i * 1.7));
      fish.forEach((f, i) => { const u2 = f.userData; f.position.set(((t * 0.6 + u2.ph) % 12) - 6, u2.y + Math.sin(t * 2 + i) * 0.05, u2.z); });
      // ---------- hero ----------
      const panic = smooth(range(t, 4.2, 4.6)) * (1 - smooth(range(t, 7.3, 7.9)));
      const back = smooth(range(t, 9.6, 12.6));
      const hx = lerp(0.2, -1.1, back);
      hero.root.position.set(hx, 0.9 + Math.sin(t * 1.6) * 0.05, 0); hero.root.rotation.y = lerp(0.5, 0.9, smooth(range(t, 7.8, 8.4)));
      const scull = Math.sin(t * 3);
      let pose = { lSh: [-0.2, 0, 0.9 + 0.2 * scull], rSh: [-0.2, 0, -0.9 - 0.2 * scull], lEl: [-0.5, 0, 0], rEl: [-0.5, 0, 0], lHip: [-0.3 + 0.35 * Math.sin(t * 3.4), 0, 0.08], rHip: [-0.3 - 0.35 * Math.sin(t * 3.4), 0, -0.08], lKn: [0.6 + 0.3 * Math.sin(t * 3.4), 0, 0], rKn: [0.6 - 0.3 * Math.sin(t * 3.4), 0, 0], neck: [0.05, 0, 0] };
      if (panic > 0.01) { const f = Math.sin(t * 16); pose = over(pose, { lSh: [lerp(-0.2, -2.4 + 0.6 * f, panic), 0, 0.5], rSh: [lerp(-0.2, -2.4 - 0.6 * f, panic), 0, -0.5], lEl: [-0.4 - 0.4 * f, 0, 0], rEl: [-0.4 + 0.4 * f, 0, 0], lHip: [-0.6 * f * panic, 0, 0.1], rHip: [0.6 * f * panic, 0, -0.1], neck: [-0.2 * panic, 0.3 * f * panic, 0] }); }
      // punch at PUNCH
      const pk = smooth(range(t, PUNCH - 0.3, PUNCH)) * (1 - smooth(range(t, PUNCH + 0.35, PUNCH + 0.8)));
      hero.setPose(pose); hero.setMouth(panic > 0.3 ? 0.6 : 0.08);
      // ---------- shark path ----------
      let sp, dir;
      if (t < 12.8) { const w = t * 0.5; sp = V(0.45 + 1.0 * Math.cos(w), 0.45 + Math.sin(t * 0.7) * 0.1, -2.0 + 0.35 * Math.sin(w)); dir = V(-Math.sin(w) * 1.0, 0, Math.cos(w) * 0.35).normalize();
        const foc = smooth(range(t, 5.2, 6.4)); if (foc > 0) { const tgt = V(hx + 1.2, 0.95, -0.7); sp.lerp(tgt, foc); dir.lerp(V(-1, 0, 0.35).normalize(), foc).normalize(); } }
      else if (t < 17.4) { const ch = easeOut(range(t, 12.9, PUNCH)); const start = V(hx + 3.2, 0.9, -0.9), end = V(hx + 1.05, 1.5, -0.05); sp = start.clone().lerp(end, ch); const rec = smooth(range(t, PUNCH, PUNCH + 0.5)); sp.x += 0.5 * rec; dir = V(-1, 0, 0.4).normalize(); }
      else { const u2 = easeIn(range(t, 17.4, 19.6)); sp = V(hx + 1.75 + u2 * 7, 0.9 - u2 * 0.5, -0.05 - u2 * 4); dir = V(1, 0, -0.5).normalize(); }
      shark.g.position.copy(sp); shark.g.quaternion.setFromUnitVectors(V(1, 0, 0), dir);
      shark.tail.rotation.y = Math.sin(t * (t > 12.9 && t < PUNCH ? 14 : 6)) * 0.45; shark.body.rotation.y = Math.sin(t * 6 + 1) * 0.06;
      scene.updateMatrixWorld(true);
      // punch IK toward shark nose
      const nose = shark.body.localToWorld(shark.nose.clone());
      if (pk > 0.01) { const rs = hero.j.rSh.getWorldPosition(V()); ikArm(hero, 'r', rs.clone().add(V(0.2, -0.4, 0.2)).lerp(nose, pk), rs.clone().add(V(-0.2, -0.4, -0.3)), V(0, 0, 1)); scene.updateMatrixWorld(true); }
      fx.punch.position.copy(nose); fx.punch.update(t - PUNCH);
      // weak-spot rings
      const spots = [nose, shark.body.localToWorld(shark.eye.clone()), shark.body.localToWorld(shark.gill.clone())];
      const st = [14.75, 15.55, 16.25];
      rings.forEach((r, i) => { const k = easeOut(range(t, st[i], st[i] + 0.25)) * (1 - smooth(range(t, 17.3, 17.6))); r.position.copy(spots[i]).add(V(0, 0, 0.12)); r.lookAt(r.position.clone().add(V(0, 0, 1))); r.scale.setScalar(Math.max(0.001, k * (1 + 0.1 * Math.sin(t * 8)))); r.visible = k > 0.01; ringLbl[i].position.copy(spots[i]).add(V([-0.3, 0.15, 0.05][i], [0.22, 0.36, -0.3][i], 0.15)); ringLbl[i].scale.set(0.7 * k, 0.35 * k, 1); ringLbl[i].visible = k > 0.01; });
      // eye contact line
      const he = hero.j.head.localToWorld(V(0, 0.08, 0.1)), se = spots[1];
      const ek = smooth(range(t, 8.0, 8.4)) * (1 - smooth(range(t, 12.6, 13.0)));
      eyeDots.forEach((s, i) => { const u2 = ((i / eyeDots.length) + t * 0.5) % 1; s.position.copy(he).lerp(se, u2); s.material.opacity = ek * 0.9; s.visible = ek > 0.01; });
      prey.position.copy(hero.root.position).add(V(0, 1.0, 0)); prey.material.opacity = 0.35 * smooth(range(t, 5.8, 6.4)) * (1 - smooth(range(t, 7.3, 7.9))) * (0.6 + 0.4 * Math.sin(t * 8)); prey.visible = prey.material.opacity > 0.01;
      // bubbles from hero (heavy during panic)
      const bc = hero.root.position;
      for (let i = 0; i < NB; i++) { const u2 = ((i / NB) + t * (0.4 + panic * 0.8)) % 1; const on = i < 20 + panic * 60; bp[i * 3] = bc.x + Math.sin(i * 7.1) * (0.2 + panic * 0.4); bp[i * 3 + 1] = on ? bc.y + 1.2 + u2 * 1.2 : -50; bp[i * 3 + 2] = bc.z + Math.cos(i * 3.3) * 0.25; }
      bgeo.attributes.position.needsUpdate = true;
      // ---------- camera ----------
      const KEYS = [[0, [1.0, 1.5, 7.8], [0.3, 1.0, -0.9]], [2.6, [0.8, 1.5, 7.4], [0.2, 1.0, -0.7]], [7.6, [0.7, 1.5, 7.2], [0.15, 1.0, -0.6]], [12.6, [0.0, 1.5, 7.2], [-0.4, 1.0, -0.5]], [17.6, [0.0, 1.5, 7.0], [-0.4, 1.0, -0.5]], [19.0, [-0.6, 1.5, 5.6], [-1.0, 1.2, -0.1]], [24.6, [-0.6, 1.5, 5.4], [-1.0, 1.2, -0.1]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.5 + (Math.abs(t - PUNCH - 0.1) < 0.25 ? 3 : 0), 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      noSplash.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); noSplash.set(t > 4.5 && t < 7.6 ? easeOut(range(t, 4.5, 4.7)) : 0);
      const ik = easeOut(range(t, 20.6, 20.9)), ik2 = easeOut(range(t, 22.2, 22.5));
      const base = c.position.clone().addScaledVector(fw, 2).addScaledVector(upv, -0.12);
      bolt.position.copy(base).addScaledVector(rt, -0.16); bolt.scale.setScalar(0.24 * ik); bolt.visible = ik > 0.01;
      gt.position.copy(base); gt.scale.set(0.24 * ik2, 0.12 * ik2, 1); gt.visible = ik2 > 0.01;
      sIcon.position.copy(base).addScaledVector(rt, 0.15); sIcon.scale.set(0.15 * ik2, 0.094 * ik2, 1); sIcon.visible = ik2 > 0.01;
      fx.flash.position.copy(hero.root.position).add(V(0, 1.6, 0)); fx.flash.update(t - 20.7);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.4, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
