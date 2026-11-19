import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 26.4;
export const CAPTIONS = [
  [0.0, 'What if you fell through a frozen lake?'],
  [2.68, 'The icy water shocks your body'], [5.07, 'You gasp'], [5.93, 'and your heart races'],
  [7.68, "Don't panic"], [8.76, 'Control your breathing'], [9.86, 'for the first minute'],
  [11.33, 'Turn back the way you came'], [13.09, 'That ice already held you'], [14.88, "so it's the strongest"],
  [16.64, 'Put your arms on the ice'], [18.25, 'kick like a swimmer'], [19.44, 'and slide out on your belly'],
  [21.32, 'Then roll away'], [22.44, "and don't stand up"], [23.52, "until you're far from the hole", 26.2],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const FALL = 1.55, HR = 0.62;

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 8, sunDir: [-6, 4, -3], sun: 2.0 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x3a4a8a); u.mid.value.set(0xc88aa8); u.horizon.value.set(0xffc898); u.floorC.value.set(0xdfe8f2);
  scene.fog = new THREE.Fog(0xe8c8c8, 25, 110);
  scene.children.filter(o => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry' && !o.material.isShadowMaterial).forEach(o => o.visible = false);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xffe4f0); hemi.intensity = 1.0;
  const key = scene.userData.key; key.color.set(0xffd0a0);
  // ice with hole
  const iceT = canvasTex(1024, 1024, (g) => { g.fillStyle = '#cfe6f4'; g.fillRect(0, 0, 1024, 1024); const r = rng(3); for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(255,255,255,${0.3 + r() * 0.4})`; g.lineWidth = 1 + r() * 2; let x = r() * 1024, y = r() * 1024; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 160; y += (r() - 0.5) * 160; g.lineTo(x, y); } g.stroke(); } for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(160,200,230,0.25)'; g.beginPath(); g.arc(r() * 1024, r() * 1024, 4 + r() * 20, 0, 7); g.fill(); } });
  iceT.wrapS = iceT.wrapT = THREE.RepeatWrapping; iceT.repeat.set(10, 10);
  const ice = new THREE.Mesh(new THREE.RingGeometry(HR, 60, 64, 1), new THREE.MeshStandardMaterial({ map: iceT, roughness: 0.25, metalness: 0.1 })); ice.rotation.x = -Math.PI / 2; ice.receiveShadow = true; scene.add(ice);
  { const p = ice.geometry.attributes.position, uv = ice.geometry.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 12, p.getY(i) / 12); }
  const solid = new THREE.Mesh(new THREE.CircleGeometry(HR, 40), ice.material); solid.rotation.x = -Math.PI / 2; solid.position.y = 0.001; scene.add(solid);
  const rimM = new THREE.Mesh(new THREE.TorusGeometry(HR, 0.025, 8, 40), new THREE.MeshStandardMaterial({ color: 0xcfe6f4, roughness: 0.3 })); rimM.rotation.x = Math.PI / 2; scene.add(rimM);
  const water = new THREE.Mesh(new THREE.CircleGeometry(HR + 0.05, 40), new THREE.MeshStandardMaterial({ color: 0x0c2a48, roughness: 0.1, metalness: 0.3 })); water.rotation.x = -Math.PI / 2; water.position.y = -0.06; scene.add(water);
  const chunks = []; const cr = rng(5); for (let i = 0; i < 8; i++) { const ch = new THREE.Mesh(new THREE.BoxGeometry(0.2 + cr() * 0.15, 0.06, 0.18 + cr() * 0.1), ice.material); ch.userData = { a: i / 8 * 6.28 + cr(), r: 0.2 + cr() * 0.3 }; scene.add(ch); chunks.push(ch); }
  // cracks decal
  const crackT = canvasTex(512, 512, (g) => { g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 4; const r = rng(8); for (let i = 0; i < 14; i++) { let x = 256, y = 256; const a = i / 14 * 6.28; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += Math.cos(a + (r() - 0.5)) * 45; y += Math.sin(a + (r() - 0.5)) * 45; g.lineTo(x, y); } g.stroke(); } });
  const cracks = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), new THREE.MeshBasicMaterial({ map: crackT, transparent: true, depthWrite: false })); cracks.rotation.x = -Math.PI / 2; cracks.position.y = 0.006; scene.add(cracks);
  // footprints from +x toward the hole
  const fpT = canvasTex(64, 128, (g) => { g.fillStyle = 'rgba(80,100,130,0.55)'; g.beginPath(); g.ellipse(32, 44, 20, 34, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(32, 104, 16, 18, 0, 0, 7); g.fill(); });
  const prints = []; for (let i = 0; i < 12; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.24), new THREE.MeshBasicMaterial({ map: fpT, transparent: true, depthWrite: false })); f.rotation.set(-Math.PI / 2, 0, Math.PI / 2); f.position.set(0.85 + i * 0.36, 0.007, (i % 2 ? 0.1 : -0.1)); scene.add(f); prints.push(f); }
  const strong = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.0), new THREE.MeshBasicMaterial({ color: 0x5be37d, transparent: true, opacity: 0, depthWrite: false })); strong.rotation.x = -Math.PI / 2; strong.position.set(2.75, 0.008, 0); scene.add(strong);
  const backArrow = new THREE.Group(); const am = new THREE.MeshBasicMaterial({ color: 0x5be37d, toneMapped: false, transparent: true }); const ash = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.14), am); ash.position.x = 0.45; backArrow.add(ash); const ahd = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 3), am); ahd.rotation.z = -Math.PI / 2; ahd.position.x = 1.0; backArrow.add(ahd); backArrow.position.set(0.8, 0.05, 0.55); scene.add(backArrow);
  // shore trees
  const pr = rng(41); for (let i = 0; i < 30; i++) { const a = pr() * Math.PI - Math.PI, rr = 14 + pr() * 10; const x = Math.cos(a) * rr * 1.3, z = Math.sin(a) * rr; const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); const h = 3 + pr() * 2.5; for (let k = 0; k < 3; k++) { const c2 = new THREE.Mesh(new THREE.ConeGeometry(h * (0.3 - k * 0.07), h * 0.45, 8), new THREE.MeshStandardMaterial({ color: k === 2 ? 0xffffff : 0x2f4a44, flatShading: true })); c2.position.y = h * (0.3 + k * 0.22); g.add(c2); } }
  const sunS = glowSprite(0xffb070, 18); sunS.position.set(-30, 8, -60); scene.add(sunS);
  // hero in a pivot (for lying / rolling)
  const pivot = new THREE.Group(); scene.add(pivot);
  const hero = makeHuman('casual', { shirt: 0xe63946, jeans: 0x2f3e5a, chestText: 'MR. CLOUD' }); pivot.add(hero.root);
  const beanie = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffd23f, roughness: 0.9 })); beanie.position.y = 0.17; beanie.scale.set(1.0, 0.7, 1.05); hero.j.head.add(beanie);
  hero.root.rotation.order = 'YXZ';
  const heartT = canvasTex(128, 128, (g) => { g.fillStyle = '#ff3b5c'; g.beginPath(); g.moveTo(64, 112); g.bezierCurveTo(10, 70, 10, 20, 40, 20); g.bezierCurveTo(56, 20, 64, 34, 64, 40); g.bezierCurveTo(64, 34, 72, 20, 88, 20); g.bezierCurveTo(118, 20, 118, 70, 64, 112); g.fill(); });
  const heart = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartT, transparent: true, depthTest: false, toneMapped: false })); heart.renderOrder = 30; scene.add(heart);
  const aura = glowSprite(0x7fd4ff, 1.4); scene.add(aura);
  const puffs = []; for (let i = 0; i < 8; i++) { const s = glowSprite(0xffffff, 0.25); s.userData.ph = i / 8; scene.add(s); puffs.push(s); }
  const breathRing = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.012, 8, 40), new THREE.MeshBasicMaterial({ color: 0x9fe0ff, transparent: true, toneMapped: false })); scene.add(breathRing);
  // 1-minute timer
  const wc = document.createElement('canvas'); wc.width = 256; wc.height = 256; const wg = wc.getContext('2d'); const wt = new THREE.CanvasTexture(wc); wt.colorSpace = THREE.SRGBColorSpace;
  const watch = new THREE.Sprite(new THREE.SpriteMaterial({ map: wt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); watch.renderOrder = 31; scene.add(watch); let lastW = -1;
  const drawW = (sec) => { const qv = Math.round(sec); if (qv === lastW) return; lastW = qv; wg.clearRect(0, 0, 256, 256); wg.fillStyle = 'rgba(255,255,255,0.95)'; wg.beginPath(); wg.arc(128, 140, 105, 0, 7); wg.fill(); wg.fillRect(110, 14, 36, 26); wg.strokeStyle = '#39a0ff'; wg.lineWidth = 14; wg.beginPath(); wg.arc(128, 140, 90, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sec / 60); wg.stroke(); wg.fillStyle = '#222'; wg.font = "400 60px Brand, sans-serif"; wg.textAlign = 'center'; wg.textBaseline = 'middle'; wg.fillText(`${qv}s`, 128, 146); wt.needsUpdate = true; };
  const fx = { splash: burst(0xbfeaff, 90, 1), out: burst(0xffffff, 40, 2), safe: burst(0x5be37d, 60, 3) }; Object.values(fx).forEach(f => scene.add(f));
  const st = { roll: stamp('ROLL!', '#39a0ff', 0.5), safe: stamp('SAFE!', '#5be37d', 0.5) }; Object.values(st).forEach(s => scene.add(s));
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // ---------- hero state machine ----------
      const fall = easeIn(range(t, FALL, FALL + 0.35));
      const turn = smooth(range(t, 11.4, 12.4));
      const arms = smooth(range(t, 16.6, 17.4));
      const slide = smooth(range(t, 19.4, 21.0));
      const lie = smooth(range(t, 18.2, 19.6));
      const rollK = range(t, 21.5, 23.6);
      const standUp = smooth(range(t, 24.4, 25.2));
      let pose = STAND(t);
      pivot.position.set(0, 0, 0); pivot.rotation.set(0, 0, 0);
      hero.root.rotation.set(0, 0, 0); hero.root.position.set(0, 0, 0);
      if (t < FALL) {
        // walking toward the hole from +x
        const wx = lerp(1.6, 0.0, range(t, 0, FALL));
        hero.root.position.set(wx, 0, 0); hero.root.rotation.y = -Math.PI / 2;
        pose = over(pose, { lHip: [-0.4 * Math.sin(t * 5), 0, 0.07], rHip: [0.4 * Math.sin(t * 5), 0, -0.07], lKn: [0.5 * Math.max(0, Math.sin(t * 5 + 1.2)), 0, 0], rKn: [0.5 * Math.max(0, -Math.sin(t * 5 + 1.2)), 0, 0], lSh: [0.3 * Math.sin(t * 5), 0, 0.16], rSh: [-0.3 * Math.sin(t * 5), 0, -0.16] });
      } else if (t < 18.2) {
        const y = lerp(0, -1.08, fall) + Math.sin(t * 1.4) * 0.03;
        hero.root.position.set(0, y, 0); hero.root.rotation.y = lerp(-Math.PI / 2 + 0.6, Math.PI / 2, turn);
        const shock = smooth(range(t, 2.6, 3.0)) * (1 - smooth(range(t, 7.6, 8.2)));
        const tread = Math.sin(t * 3);
        pose = over(pose, { lSh: [-0.3, 0, 1.0 + 0.2 * tread], rSh: [-0.3, 0, -1.0 - 0.2 * tread], lEl: [-0.5, 0, 0], rEl: [-0.5, 0, 0], lHip: [-0.3 + 0.3 * tread, 0, 0.1], rHip: [-0.3 - 0.3 * tread, 0, -0.1], lKn: [0.5, 0, 0], rKn: [0.5, 0, 0], neck: [-0.2 * shock, Math.sin(t * 30) * 0.05 * shock, 0] });
        if (arms > 0.01) pose = over(pose, { lSh: [lerp(-0.3, -1.6, arms), 0, lerp(1.0, 0.25, arms)], rSh: [lerp(-0.3, -1.6, arms), 0, lerp(-1.0, -0.25, arms)], lEl: [lerp(-0.5, -0.15, arms), 0, 0], rEl: [lerp(-0.5, -0.15, arms), 0, 0], spine: [0.35 * arms, 0, 0] });
        hero.root.position.y += 0.18 * arms;
        if (t > 17.8) { const kk = Math.sin(t * 12); pose = over(pose, { lHip: [0.4 * kk, 0, 0.1], rHip: [-0.4 * kk, 0, -0.1], lKn: [0.3, 0, 0], rKn: [0.3, 0, 0] }); }
      } else {
        // lying on the belly, head toward +x; slide out then roll along +x with body axis along z
        const yaw = Math.PI / 2;
        const kk = t < 21.0 ? Math.sin(t * 12) : 0;
        pose = over(STAND(t), { lSh: [-2.9, 0, 0.25], rSh: [-2.9, 0, -0.25], lEl: [-0.15, 0, 0], rEl: [-0.15, 0, 0], lHip: [0.35 * kk, 0, 0.1], rHip: [-0.35 * kk, 0, -0.1], neck: [-0.4, 0, 0] });
        const cx = lerp(0.0, 1.4, slide);
        const ang = -rollK * Math.PI * 4;
        const rollX = rollK * Math.PI * 4 * 0.14;
        if (standUp > 0) { pose = STAND(t); }
        const bodyPitch = lerp(lerp(0.0, Math.PI / 2, lie), 0, standUp);
        const bodyY = lerp(lerp(-0.9, 0.13, lie), 0.0, standUp);
        pivot.position.set(cx, bodyY, -rollK * 2.4);
        pivot.rotation.set(t > 21.5 && standUp < 0.01 ? ang : 0, 0, 0);
        hero.root.rotation.set(bodyPitch, standUp > 0 ? lerp(yaw, Math.PI / 2 + 0.6, standUp) : yaw, 0);
        // place root so the body centre sits at the pivot
        const head = V(0, 1, 0).applyEuler(hero.root.rotation);
        hero.root.position.copy(head.multiplyScalar(standUp > 0 ? 0 : -0.9 * lie));
      }
      hero.setPose(pose); hero.setMouth(t > 5.0 && t < 5.9 ? 0.85 : t > FALL && t < FALL + 0.6 ? 0.7 : 0.08);
      scene.updateMatrixWorld(true);
      // ice cracks + chunks + splash
      const ck = smooth(range(t, 0.9, 1.5));
      cracks.material.opacity = ck * (1 - smooth(range(t, 20, 22))); cracks.visible = ck > 0.01;
      solid.visible = t < FALL; rimM.visible = t >= FALL; water.visible = t >= FALL;
      chunks.forEach((ch, i) => { const a = ch.userData.a; ch.position.set(Math.cos(a) * ch.userData.r * 1.3, -0.02 + Math.sin(t * 2 + i) * 0.01, Math.sin(a) * ch.userData.r * 1.3); ch.rotation.set(Math.sin(t + i) * 0.1, a, 0); ch.visible = t > FALL; });
      fx.splash.position.set(0, 0.05, 0); fx.splash.update(t - FALL - 0.2);
      // cold shock: aura, heart, puffs
      const head = hero.j.head.getWorldPosition(V()), chest = hero.j.chest.getWorldPosition(V());
      const shock = smooth(range(t, 2.6, 3.0)) * (1 - smooth(range(t, 7.6, 8.2)));
      aura.position.copy(chest).add(V(0, 0.3, 0)); aura.material.opacity = 0.45 * shock; aura.visible = shock > 0.01;
      const hb = smooth(range(t, 5.9, 6.2)) * (1 - smooth(range(t, 7.6, 8.0))); const beat = 1 + 0.25 * Math.max(0, Math.sin(t * 22));
      heart.position.copy(chest).add(V(0.35, 0.25, 0.2)); heart.scale.setScalar(0.22 * hb * beat); heart.visible = hb > 0.01;
      puffs.forEach((s, i) => { const u2 = ((t * (t > 8.2 && t < 11.3 ? 0.35 : 1.2)) + s.userData.ph) % 1; s.position.copy(head).add(V(0.15 + u2 * 0.3, -0.02 + u2 * 0.2, 0.15)); s.material.opacity = (t > 2.6 && t < 11.3 ? 0.5 : 0) * (1 - u2); s.visible = t > 2.6 && t < 11.3; });
      const br = smooth(range(t, 8.6, 9.0)) * (1 - smooth(range(t, 11.0, 11.4))); const bph = 0.5 + 0.5 * Math.sin(t * 2.2);
      breathRing.position.copy(head).add(V(0, -0.05, 0)); breathRing.rotation.x = Math.PI / 2; breathRing.scale.setScalar(0.8 + bph * 0.8); breathRing.material.opacity = br * 0.8; breathRing.visible = br > 0.01;
      // way back: footprints glow, arrow, strong ice
      const wk = smooth(range(t, 11.6, 12.2)) * (1 - smooth(range(t, 21.0, 21.6)));
      prints.forEach((f, i) => { f.material.opacity = 1; f.scale.setScalar(1 + 0.3 * wk * Math.max(0, Math.sin(t * 5 - i * 0.6))); });
      strong.material.opacity = 0.3 * smooth(range(t, 14.9, 15.5)) * (1 - smooth(range(t, 21.0, 21.6))) * (0.7 + 0.3 * Math.sin(t * 4)); strong.visible = strong.material.opacity > 0.01;
      backArrow.visible = wk > 0.01; backArrow.scale.setScalar(Math.max(0.001, wk)); am.opacity = wk;
      fx.out.position.set(0.9, 0.1, 0); fx.out.update(t - 20.5);
      fx.safe.position.copy(head).add(V(0, 0.2, 0)); fx.safe.update(t - 25.0);
      // ---------- camera ----------
      const KEYS = [[0, [1.2, 1.7, 5.4], [0.6, 0.6, 0]], [2.6, [0.5, 1.4, 3.6], [0.1, 0.4, 0]], [11.0, [0.6, 1.5, 3.8], [0.3, 0.3, 0]], [16.4, [0.6, 1.6, 4.2], [0.45, 0.25, 0]], [21.2, [1.4, 1.9, 4.6], [1.0, 0.25, -0.3]], [24.0, [1.8, 2.0, 3.4], [1.4, 0.5, -2.2]], [26.4, [1.8, 1.9, 3.2], [1.4, 0.8, -2.4]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.4 + (t > FALL && t < FALL + 0.6 ? 3 : 0) + shock * 0.8, 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const tk = easeOut(range(t, 9.8, 10.2)) * (1 - smooth(range(t, 11.2, 11.5)));
      drawW(lerp(0, 60, range(t, 10.0, 11.3)));
      watch.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.0).addScaledVector(rt, 0.16); watch.scale.setScalar(0.2 * tk); watch.visible = tk > 0.01;
      st.roll.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); st.roll.set(t > 21.6 && t < 23.4 ? easeOut(range(t, 21.6, 21.8)) : 0);
      st.safe.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24).addScaledVector(rt, 0.08); st.safe.set(t > 25.0 ? easeOut(range(t, 25.0, 25.2)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.4, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
