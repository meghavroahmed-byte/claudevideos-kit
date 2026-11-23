import * as THREE from 'three';
import { makeHuman, torsoShell } from './human.js';
import { materials } from './materials.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { infoCard, burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { world, grass, rock, stamp, iconBubble } from './ancient.js';

export const DURATION = 26.9;
export const CAPTIONS = [
  [0.0, 'How did knights'], [0.84, 'go to the toilet'], [1.84, 'while wearing armor?'],
  [2.77, 'A full suit of armor'], [4.57, 'weighed around 25 kilograms'], [6.97, 'and it took a squire'], [7.88, 'up to half an hour'], [9.01, 'to put on'],
  [10.09, "So knights couldn't just"], [11.1, 'take it off'], [11.7, 'every time nature called'],
  [13.35, 'The trick?'], [14.35, "Plate armor didn't"], [15.31, 'cover everything'], [16.84, 'Underneath'], [17.62, 'knights wore padded clothes'], [19.15, 'and a chainmail skirt'], [20.35, 'that could be pulled aside'],
  [22.03, 'But in long battles'], [23.21, 'some knights simply'], [24.19, 'had to hold it...'], [25.58, 'or not!', 26.7],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const HP = V(0, 0, 0.4);

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-4, 9, 5], sun: 2.4 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x2f7fd8); u.mid.value.set(0x6aaee8); u.horizon.value.set(0xd6e8f2); u.floorC.value.set(0x8a8070);
  scene.fog = new THREE.Fog(0xd0dce6, 40, 140);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.85;
  const key = scene.userData.key;
  scene.add(world(['#8a8070', ['120,112,96', '140,130,112', '106,98,84']]));
  // castle courtyard walls
  const st = canvasTex(256, 256, (g) => { g.fillStyle = '#9a948a'; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(60,56,50,0.5)'; g.lineWidth = 3; for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) g.strokeRect(c * 64 + (r % 2) * 32, r * 32, 64, 32); });
  st.wrapS = st.wrapT = THREE.RepeatWrapping; st.repeat.set(5, 2);
  const sm = new THREE.MeshStandardMaterial({ map: st, roughness: 0.95 });
  const wall = (w, x, z, ry) => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(w, 5, 1), sm); m.position.y = 2.5; g.add(m); for (let i = 0; i < w / 1.2; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 1), sm); b.position.set(-w / 2 + 0.3 + i * 1.2, 5.3, 0); g.add(b); } g.position.set(x, 0, z); g.rotation.y = ry; g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); scene.add(g); };
  wall(24, 0, -8, 0); wall(16, -12, 0, Math.PI / 2); wall(16, 12, 0, Math.PI / 2);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 9, 20), sm); tower.position.set(-11, 4.5, -7.5); tower.castShadow = true; scene.add(tower);
  const roofT = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3, 20), new THREE.MeshStandardMaterial({ color: 0x2a4a8a })); roofT.position.set(-11, 10.5, -7.5); scene.add(roofT);
  for (const x of [-6, 0, 6]) { const ban = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.6), new THREE.MeshStandardMaterial({ color: x === 0 ? 0xb3261e : 0x2a4a8a, side: THREE.DoubleSide })); ban.position.set(x, 3.4, -7.45); scene.add(ban); }
  // outhouse
  const oh = new THREE.Group(); oh.position.set(4.2, 0, -4.6); scene.add(oh);
  const wd = new THREE.MeshStandardMaterial({ color: 0x8a6a44, roughness: 0.9 });
  const boxM = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.3, 1.3), wd); boxM.position.y = 1.15; oh.add(boxM);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.9), new THREE.MeshStandardMaterial({ color: 0x6b4a2e, map: canvasTex(128, 256, (g) => { g.fillStyle = '#6b4a2e'; g.fillRect(0, 0, 128, 256); g.fillStyle = '#1a1208'; g.beginPath(); g.arc(64, 50, 22, 0.6, Math.PI * 2 - 0.6); g.arc(76, 50, 18, Math.PI * 2 - 0.9, 0.9, true); g.fill(); }) })); door.position.set(0, 1.0, 0.66); oh.add(door);
  const ohr = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.5), wd); ohr.position.y = 2.36; oh.add(ohr);
  oh.traverse(o => { if (o.isMesh) o.castShadow = true; });
  // the knight (hero) in plate; MR. CLOUD moved out onto a tabard
  const hero = makeHuman('plate', { chestText: 'MR. CLOUD' }); scene.add(hero.root); hero.root.position.copy(HP);
  const M = materials();
  const tabard = new THREE.Mesh(torsoShell(-0.25, 0.52, (y) => 0.05 + 0.012 * Math.sin(Math.max(0, Math.min(1, (y - 0.02) / 0.45)) * Math.PI) + Math.max(0, -y) * 0.15), new THREE.MeshStandardMaterial({ color: 0x2a4a8a, roughness: 0.85, side: THREE.DoubleSide }));
  tabard.castShadow = true; hero.j.spine.add(tabard);
  hero.root.traverse(o => { if (o.isMesh && o.material.map && o.material.map.image && o.material.map.image.width === 1024 && o.material.map.image.height === 256) { o.position.z += 0.062; o.scale.setScalar(1.08); o.renderOrder = 3; } });
  // armour pieces that get strapped on
  const steelSet = new Set([M.steel, M.steelDark, M.steelBright]);
  const pieces = []; hero.root.traverse(o => { if (o.isMesh && (steelSet.has(o.material) || (o.material.name || '').includes('steel'))) pieces.push(o); });
  hero.root.traverse(o => { if (o.isMesh && o.material && o.material.isMeshPhysicalMaterial && o.material.metalness > 0.5) { if (!pieces.includes(o)) pieces.push(o); } });
  pieces.forEach((p, i) => { p.userData.p0 = p.position.clone(); p.userData.s0 = p.scale.clone(); p.userData.order = i; });
  const steelMats = new Set(pieces.map(p => p.material)); steelMats.forEach(m => { m.transparent = true; });
  // chainmail skirt + padded gambeson for the x-ray reveal
  const mail = new THREE.Mesh(torsoShell(-0.42, -0.05, (y) => 0.035 + Math.max(0, -0.05 - y) * 0.3), M.chainmail); hero.j.spine.add(mail);
  const flap = new THREE.Group(); flap.position.set(0, -0.12, 0.17); hero.j.spine.add(flap);
  const flapM = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3), M.chainmail); flapM.position.y = -0.15; flap.add(flapM);
  // squire
  const sq = makeHuman('casual', { shirt: 0xb3261e, jeans: 0x5a4a3a, skin: 0xf1c27d, hair: 0xc0602a, beard: false }); sq.root.scale.setScalar(0.78); scene.add(sq.root);
  // battle extras
  const foes = [0, 1, 2].map(i => { const k = makeHuman('knight', {}); k.root.position.set(-3 + i * 3, 0, -4.5); k.root.rotation.y = 0.3 * (i - 1); scene.add(k.root); return k; });
  const sword = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.9, 0.015), new THREE.MeshStandardMaterial({ color: 0xd0d6de, metalness: 0.9, roughness: 0.2 })); scene.add(sword);
  // hud bits
  const weight = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(512, 220, (g) => { g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 16; g.fillStyle = '#d0d6de'; g.beginPath(); g.moveTo(60, 170); g.lineTo(90, 70); g.lineTo(150, 70); g.lineTo(180, 170); g.fill(); g.fillStyle = '#222'; g.font = '900 40px sans-serif'; g.textAlign = 'center'; g.fillText('KG', 120, 140); g.font = "400 110px Brand, sans-serif"; g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('25 KG', 210, 116); }), transparent: true, depthTest: false, depthWrite: false })); weight.renderOrder = 31; scene.add(weight);
  const clockS = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false })); clockS.renderOrder = 31; scene.add(clockS);
  const ccv = document.createElement('canvas'); ccv.width = ccv.height = 256; const ccg = ccv.getContext('2d'); const ctex = new THREE.CanvasTexture(ccv); ctex.colorSpace = THREE.SRGBColorSpace; clockS.material.map = ctex;
  const drawClock = (m) => { ccg.clearRect(0, 0, 256, 256); ccg.fillStyle = 'rgba(255,255,255,0.92)'; ccg.beginPath(); ccg.arc(128, 128, 110, 0, 7); ccg.fill(); ccg.strokeStyle = '#2a2a30'; ccg.lineWidth = 10; ccg.stroke(); ccg.fillStyle = 'rgba(255,90,60,0.35)'; ccg.beginPath(); ccg.moveTo(128, 128); ccg.arc(128, 128, 100, -Math.PI / 2, -Math.PI / 2 + m / 60 * Math.PI * 2); ccg.fill(); ccg.save(); ccg.translate(128, 128); ccg.rotate(m / 60 * Math.PI * 2); ccg.fillStyle = '#2a2a30'; ccg.fillRect(-5, -92, 10, 92); ccg.restore(); ccg.font = "400 44px Brand, sans-serif"; ccg.fillStyle = '#2a2a30'; ccg.textAlign = 'center'; ccg.fillText(`${Math.round(m)} MIN`, 128, 200); ctex.needsUpdate = true; };
  const nope = iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#8a6a44'; g.fillRect(170, 120, 172, 290); g.fillStyle = '#1a1208'; g.beginPath(); g.arc(256, 180, 26, 0.6, Math.PI * 2 - 0.6); g.fill(); })); nope.renderOrder = 30; scene.add(nope);
  const stink = []; for (let i = 0; i < 4; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(128, 256, (g) => { g.strokeStyle = '#7fbf3a'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); for (let y = 240; y > 20; y -= 4) g.lineTo(64 + Math.sin(y * 0.06) * 30, y); g.stroke(); }), transparent: true, depthWrite: false })); s.userData.ph = i / 4; scene.add(s); stink.push(s); }
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 12), new THREE.MeshBasicMaterial({ color: 0xffd23f, toneMapped: false })); scene.add(arrow);
  const fx = { snap: burst(0xd0d6de, 40, 1), clang: burst(0xffd166, 60, 2) };
  Object.values(fx).forEach(f => scene.add(f));
  const uhoh = stamp('UH-OH!', '#7fbf3a', 0.45); scene.add(uhoh);
  const card = infoCard(); scene.add(card);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // ---------- armour assembly 3.3 -> 9.3 ----------
      const N = pieces.length;
      pieces.forEach((p, i) => {
        const t0 = 3.3 + (i / N) * 5.6, k = t < 3.3 ? 1 : easeOut(range(t, t0, t0 + 0.35));
        p.visible = k > 0.01; p.scale.copy(p.userData.s0).multiplyScalar(Math.max(0.001, k)); p.position.copy(p.userData.p0).add(V(0, 0.4 * (1 - k), 0.3 * (1 - k)));
      });
      // x-ray: plate goes see-through 14.4 -> 21.6
      const xr = smooth(range(t, 14.3, 14.9)) * (1 - smooth(range(t, 21.4, 22.0)));
      steelMats.forEach(m => { m.opacity = 1 - 0.8 * xr; m.depthWrite = xr < 0.5; });
      tabard.material.opacity = 1 - 0.8 * xr; tabard.material.transparent = xr > 0.01;
      flap.rotation.x = -1.3 * smooth(range(t, 20.4, 20.9)) * (1 - smooth(range(t, 21.6, 22.0)));
      // ---------- hero ----------
      const dance = (t < 3.0 ? 1 : 0) + smooth(range(t, 23.3, 23.7));
      let pose = over(STAND(t), { lHip: [-0.15 * dance, 0, 0.07 - 0.25 * dance * Math.max(0, Math.sin(t * 7))], rHip: [-0.15 * dance, 0, -0.07 + 0.25 * dance * Math.max(0, -Math.sin(t * 7))], lKn: [0.3 * dance, 0, 0], rKn: [0.3 * dance, 0, 0], neck: [0.05, Math.sin(t * 3) * 0.5 * Math.min(1, dance), 0], lSh: [-0.3 * dance, 0, 0.16], rSh: [-0.3 * dance, 0, -0.16], lEl: [-1.2 * dance, 0, 0], rEl: [-1.2 * dance, 0, 0] });
      if (t > 3.2 && t < 9.4) pose = over(pose, { lSh: [0.05, 0, 0.5], rSh: [0.05, 0, -0.5], neck: [0.1, 0, 0] });
      if (t > 10.1 && t < 13.2) pose = over(pose, { neck: [0, -0.6 + Math.sin(t * 6) * 0.3 * smooth(range(t, 11.8, 12.2)), 0] });
      if (t > 22.0 && t < 23.4) pose = over(pose, { rSh: [-1.6, 0, -0.2], rEl: [-0.8, 0, 0] });
      hero.setPose(pose); hero.setMouth(dance > 0.5 ? 0.35 : 0.05);
      hero.root.position.copy(HP); hero.root.rotation.y = t > 10 && t < 13.2 ? 0.3 : 0;
      // squire straps the armour on, then leaves
      const sqk = smooth(range(t, 3.0, 3.4)) * (1 - smooth(range(t, 9.6, 10.0)));
      sq.root.visible = sqk > 0.01; sq.root.position.set(HP.x + 0.75, 0, HP.z + 0.25); sq.root.rotation.y = -1.6;
      sq.setPose(over(STAND(t, 2), { lSh: [-1.4, 0, 0.1], rSh: [-1.2 + Math.sin(t * 9) * 0.3, 0, -0.1], lEl: [-0.6, 0, 0], rEl: [-0.8, 0, 0], spine: [0.15, 0, 0] }));
      // battle line + sword
      const bat = smooth(range(t, 21.9, 22.4));
      foes.forEach((f, i) => { f.root.visible = bat > 0.01; f.setPose(over(STAND(t, i), { rSh: [-2.0 + Math.sin(t * 5 + i) * 0.8, 0, -0.3], rEl: [-0.5, 0, 0], lHip: [-0.3, 0, 0.1], lKn: [0.3, 0, 0] })); });
      scene.updateMatrixWorld(true);
      sword.visible = t > 21.9; sword.position.copy(hero.j.rWr.localToWorld(V(0, -0.08, 0))).add(V(0, 0.45, 0)); sword.rotation.set(0, 0, 0.15);
      [22.6, 23.4].forEach((b, i) => { if (i === 0) { fx.clang.position.set(0, 2, -4.5); fx.clang.update(t - b); } });
      const sk = smooth(range(t, 25.6, 25.9));
      stink.forEach((s, i) => { const u2 = (t * 0.6 + s.userData.ph) % 1; s.position.copy(HP).add(V((i - 1.5) * 0.18, 0.7 + u2 * 0.6, 0.1)); s.scale.set(0.12, 0.24, 1); s.material.opacity = sk * Math.sin(u2 * Math.PI) * 0.9; });
      const ak = smooth(range(t, 20.3, 20.6)) * (1 - smooth(range(t, 21.6, 21.9)));
      arrow.position.copy(hero.j.spine.localToWorld(V(0, -0.05, 0.32))); arrow.rotation.set(Math.PI, 0, 0); arrow.scale.setScalar(Math.max(0.001, ak)); arrow.position.y += Math.sin(t * 8) * 0.03;
      // ---------- camera ----------
      const KEYS = [[0, [1.6, 1.9, 5.6], [0.4, 1.1, -1.5]], [2.8, [1.0, 1.7, 4.6], [0.2, 1.1, 0]], [9.3, [0.8, 1.6, 4.0], [0.25, 1.05, 0.2]], [10.2, [-0.6, 1.9, 5.4], [1.8, 1.2, -2.6]], [13.2, [-0.4, 1.8, 5.2], [1.4, 1.2, -2.2]], [14.3, [0.5, 1.5, 3.9], [0, 1.0, 0.4]], [21.4, [0.7, 1.45, 3.7], [0, 0.95, 0.4]], [22.6, [2.6, 2.2, 6.0], [0, 1.2, -1.6]], [26.9, [2.4, 2.0, 5.4], [0, 1.1, -0.8]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const sh = shake(t, 0.6, 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-4, 9, 5));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const wk = smooth(range(t, 4.5, 4.8)) * (1 - smooth(range(t, 6.9, 7.2)));
      weight.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.14).addScaledVector(rt, 0.18); weight.scale.set(0.3 * wk, 0.129 * wk, 1); weight.material.opacity = wk; weight.visible = wk > 0.01;
      const clk = smooth(range(t, 7.0, 7.3)) * (1 - smooth(range(t, 9.6, 9.9)));
      drawClock(lerp(0, 30, easeInOut(range(t, 7.3, 9.3)))); clockS.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.14).addScaledVector(rt, 0.2); clockS.scale.setScalar(0.2 * clk); clockS.material.opacity = clk; clockS.visible = clk > 0.01;
      nope.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.14).addScaledVector(rt, -0.18); nope.set(0.17 * easeOut(range(t, 11.6, 11.85)) * (1 - smooth(range(t, 13.0, 13.3))), smooth(range(t, 12.2, 12.35)));
      uhoh.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.12); uhoh.set(t > 25.58 ? easeOut(range(t, 25.58, 25.74)) : 0);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 2.75, 'KNIGHTS', 'TOILET?', '#ffffff', 'in full armor'],
        [2.77, 6.97, 'FULL ARMOR', '25 KG', '#d0d6de', ''], [6.97, 10.0, 'FULL ARMOR', '30 MIN TO PUT ON', '#ffd23f', 'with a squire'],
        [10.09, 13.3, 'NATURE CALLS', "CAN'T TAKE IT OFF", '#ff6b5b', 'every time'],
        [13.35, 16.84, 'THE TRICK', 'GAPS', '#8fd3ff', "plate didn't cover everything"], [16.84, 19.15, 'THE TRICK', 'PADDED CLOTHES', '#8fd3ff', 'underneath'], [19.15, 21.9, 'THE TRICK', 'MAIL SKIRT', '#8fd3ff', 'pulled aside'],
        [22.03, 25.5, 'LONG BATTLES', 'HOLD IT...', '#ffd23f', ''], [25.5, 26.9, 'LONG BATTLES', '...OR NOT', '#7fbf3a', ''],
      ];
      const cu = CARDS.find(([a2, b]) => t >= a2 && t < b); let ck = 0;
      if (cu) { card.set(cu[2], cu[3], cu[4], null, cu[5]); const grp = CARDS.filter(x => x[2] === cu[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk = 1 + 0.09 * Math.exp(-(t - cu[0]) * 9); card.scale.set(0.72 * pk, 0.281 * pk, 1); }
      card.material.opacity = ck; card.visible = false;
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.4, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
