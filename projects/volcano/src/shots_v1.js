import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { infoCard, burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { iconBubble, stamp, flame } from './ancient.js';
import { lavaLake, crater, boulder, thermo, densityChart, heatSuit, smokeColumn } from './volc.js';

export const DURATION = 27.6;
export const CAPTIONS = [
  [0.0, 'What would happen'], [0.94, 'if you fell'], [1.58, 'into a volcano?'],
  [3.11, 'First of all'], [4.01, "you wouldn't sink"], [5.36, 'Lava is about'], [6.2, 'three times denser'], [7.45, 'than water'],
  [8.43, "so you'd land on top of it"], [9.77, 'like a rock on mud'],
  [11.32, 'But at over'], [12.0, '1,000 degrees Celsius'], [14.04, 'the heat would hit you'], [15.3, 'long before'], [15.93, 'you touched it'],
  [16.98, 'Your clothes'], [17.64, 'would catch fire'], [18.75, 'and toxic gases'], [19.78, 'would make it'], [20.31, 'almost impossible'], [21.49, 'to breathe'],
  [22.44, "That's why"], [22.95, 'volcano scientists'], [24.22, 'wear heat-proof suits'], [25.52, 'and never'], [26.19, 'get too close', 27.4],
];
export const FADES = [];

const RIM = V(0, 9.3, 17.3);
function heroPath(t) {
  if (t < 1.25) return RIM.clone();
  if (t < 3.1) { const k = (t - 1.25) / 1.85; return V(0, 9.3 + 0.4 * Math.sin(k * Math.PI * 0.5) - 3.2 * k * k, 17.3 - 3.4 * easeOut(k)); }
  const k = range(t, 3.1, 22.4); return V(0, lerp(6.5, 3.4, k), lerp(13.9, 12.6, k));   // slow motion from here
}
const SCI = V(2.0, 9.25, -17.9);
const K = [
  [0.0, [2.6, 11.0, 23.2], [0, 10.0, 17.0]],
  [1.2, [2.3, 10.9, 22.6], [0, 9.9, 16.8]],
];
const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function o2Icon() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#7fd3ff'; g.beginPath(); g.arc(256, 256, 170, 0, 7); g.fill(); g.fillStyle = '#0d3b5c'; g.font = '900 170px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('O₂', 256, 270);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 8, sunDir: [-6, 10, 4], sun: 1.4 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x2a1e2e); u.mid.value.set(0x6a3a3e); u.horizon.value.set(0xd07a4a); u.floorC.value.set(0x3a2a24);
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  scene.fog = new THREE.FogExp2(0x6a4038, 0.012);
  const key = scene.userData.key; key.color.set(0xffc9a0);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xd8a080); hemi.groundColor.set(0xff6a20); hemi.intensity = 0.7;
  const lava = lavaLake(13.2); scene.add(lava);
  scene.add(crater(13));
  const LL = [[0, 2, 8], [-6, 2, -2], [6, 2, -3], [0, 2, -9]].map(([x, y, z]) => { const l = new THREE.PointLight(0xff6a20, 40, 22, 1.6); l.position.set(x, y, z); scene.add(l); return l; });
  const plumes = [[-5, 0, -4], [5, 0, 2], [0, 0, -8]].map(([x, y, z], i) => { const s = smokeColumn(12, 0x8a7068, i + 2); s.position.set(x, y, z); scene.add(s); return s; });
  const embers = []; for (let i = 0; i < 60; i++) { const s = glowSprite(0xff8a30, 0.12); s.userData = { x: (Math.random() - 0.5) * 22, z: (Math.random() - 0.5) * 22, ph: Math.random(), sp: 0.3 + Math.random() * 0.5 }; scene.add(s); embers.push(s); }
  // cast
  const hero = makeHuman('casual', { shirt: 0x3a86ff, jeans: 0x2b2b30, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const phone = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.15, 0.012), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 })); scene.add(phone);
  const sci = makeHuman('casual', { shirt: 0xd8dde3, jeans: 0xd8dde3 }); const silver = heatSuit(sci); scene.add(sci.root);
  sci.root.traverse(o => { if (o.isMesh && (o.material.color?.getHex?.() === 0x34507a || o.material.color?.getHex?.() === 0xd8dde3)) o.material = silver; });
  const probe = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.4, 8), new THREE.MeshStandardMaterial({ color: 0xbfc6d0, metalness: 0.8, roughness: 0.3 })); scene.add(probe);
  const rock = boulder(1.3, 7); scene.add(rock);
  const flames = [0, 1, 2, 3, 4].map(() => { const f = flame(0.32); scene.add(f); return f; });
  const gas = smokeColumn(14, 0xc8d050, 11); scene.add(gas);
  const heatRings = []; for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.75, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff7a30, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); r.userData.ph = i / 6; scene.add(r); heatRings.push(r); }
  const heatGlow = glowSprite(0xff4a10, 3.5); scene.add(heatGlow);
  const o2 = iconBubble(o2Icon()); scene.add(o2);
  const th = thermo(); scene.add(th);
  const dens = densityChart(); scene.add(dens);
  const fx = { rock: burst(0xffa040, 90, 1), fire: burst(0xffb347, 60, 2), safe: burst(0x5be37d, 70, 3) };
  Object.values(fx).forEach(f => scene.add(f));
  const safe = stamp('SAFE DISTANCE', '#5be37d', 0.66); scene.add(safe);
  const card = infoCard(); scene.add(card);
  const M = hero.M; const SKIN0 = M.skin.color.clone();
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      lava.update(t); plumes.forEach((p, i) => p.update(t + i * 3, 1, 9, 5));
      embers.forEach(e => { const u2 = (t * e.userData.sp * 0.25 + e.userData.ph) % 1; e.position.set(e.userData.x + Math.sin(u2 * 6 + e.userData.ph * 9) * 0.5, u2 * 9, e.userData.z); e.material.opacity = Math.sin(u2 * Math.PI) * 0.9; });
      // ================= HERO =================
      const hp = heroPath(t), fall = smooth(range(t, 1.2, 2.2)), flail = t > 1.25 ? 1 : 0;
      const heat = smooth(range(t, 12.0, 14.5)), fire = smooth(range(t, 17.6, 18.0)), cough = smooth(range(t, 19.0, 19.4));
      hero.root.position.copy(hp);
      hero.root.rotation.set(-1.25 * fall - 0.1 * Math.sin(t * 0.8) * flail, Math.sin(t * 0.3) * 0.2 * flail, Math.sin(t * 0.5) * 0.12 * flail, 'YXZ');
      let pose;
      if (t < 1.25) {
        const selfie = smooth(range(t, 0.1, 0.4)), step = smooth(range(t, 0.9, 1.25));
        pose = over(STAND(t), { rSh: [-1.55 * selfie, 0, -0.55 * selfie], rEl: [-0.35 * selfie, 0, 0], lSh: [0.05, 0, 0.16 + 0.2 * step], rHip: [0.35 * step, 0, -0.07], neck: [-0.08, -0.25 * selfie, 0] });
        hero.setMouth(0.2 * selfie);
      } else {
        const w = Math.sin(t * (t < 3.1 ? 14 : 3.2));
        pose = { lSh: [-2.0 + w * 0.4, 0, 0.8], rSh: [-2.1 - w * 0.4, 0, -0.8], lEl: [-0.5, 0, 0], rEl: [-0.5, 0, 0], lHip: [-0.6 + w * 0.3, 0, 0.15], rHip: [-0.3 - w * 0.3, 0, -0.15], lKn: [0.8, 0, 0], rKn: [0.6, 0, 0], neck: [0.35, 0, 0], spine: [0.2, 0, 0] };
        if (cough > 0) pose = over(pose, { rSh: [lerp(-2.1, -2.4, cough), 0, lerp(-0.8, 0.3, cough)], rEl: [lerp(-0.5, -2.2, cough), 0, 0], neck: [0.35 + Math.sin(t * 18) * 0.08 * cough, 0, 0] });
        hero.setMouth(0.7);
      }
      hero.setPose(pose);
      M.skin.color.copy(SKIN0).lerp(new THREE.Color(0xe0503a), heat * 0.45);
      scene.updateMatrixWorld(true);
      phone.visible = t < 1.4; phone.position.copy(hero.j.rWr.localToWorld(V(0, -0.1, 0.03))); phone.quaternion.copy(hero.j.rWr.getWorldQuaternion(new THREE.Quaternion()));
      // flames on the clothes
      const fpts = [[hero.j.spine, V(0.12, -0.15, 0.12)], [hero.j.spine, V(-0.14, -0.12, 0.1)], [hero.j.lEl, V(0, -0.1, 0.05)], [hero.j.rEl, V(0, -0.1, 0.05)], [hero.j.lKn, V(0, 0.1, 0.06)]];
      flames.forEach((f, i) => { f.position.copy(fpts[i][0].localToWorld(fpts[i][1].clone())); f.update(t + i, fire * (0.8 + 0.2 * Math.sin(t * 7 + i))); f.visible = fire > 0.01 && t < 23; });
      fx.fire.position.copy(hero.j.spine.localToWorld(V(0, 0, 0.15))); fx.fire.update(t - 17.7);
      gas.position.copy(hp).add(V(0, -1.5, 0)); gas.update(t, 0.5 * smooth(range(t, 18.7, 19.2)) * (1 - smooth(range(t, 22.2, 22.8))), 3, 1.6);
      heatRings.forEach(r => { const u2 = ((t - 11.3) * 0.5 + r.userData.ph) % 1, k = heat * (t < 22.8 ? 1 : 0); r.position.set(hp.x, 0.1 + u2 * (hp.y - 0.3), hp.z); r.scale.setScalar(1.6 - u2); r.material.opacity = k * Math.sin(u2 * Math.PI) * 0.6; r.visible = k > 0.01; });
      heatGlow.position.copy(hp).add(V(0, 0.9, 0)); heatGlow.material.opacity = 0.5 * heat * (t < 22.8 ? 1 : 0);
      o2.position.copy(hero.j.chest.getWorldPosition(V(0, 0, 0))).add(V(0.5, 0.55, -0.3)); o2.set(0.55 * easeOut(range(t, 20.3, 20.55)) * (1 - smooth(range(t, 22.1, 22.4))), smooth(range(t, 20.75, 20.9)));
      // rock on mud: falls 5.3, lands 6.15, floats on the lava
      const RK0 = V(-1.3, 9.6, 16.4), RK1 = V(-1.0, 0.32, 12.6), rk = range(t, 5.3, 6.15);
      if (t < 6.15) { rock.position.copy(RK0.clone().lerp(RK1, rk)); rock.position.y = lerp(RK0.y, RK1.y, rk * rk); rock.rotation.set(t * 3, t * 2, 0); }
      else { const d = t - 6.15; rock.position.copy(RK1); rock.position.y += Math.exp(-d * 4) * Math.sin(d * 14) * 0.12 + Math.sin(t * 1.2) * 0.02; rock.rotation.set(18.45, 12.3, 0); }
      rock.material.emissiveIntensity = 0.6 * smooth(range(t, 6.2, 9.0));
      fx.rock.position.copy(RK1); fx.rock.update(t - 6.15);
      // ================= SCIENTIST =================
      const back = smooth(range(t, 25.9, 26.8));
      sci.root.position.copy(SCI).add(V(0, 0, -0.7 * back)); sci.root.rotation.y = 0.1;
      const wv = Math.sin((t - 25.9) * 7) * (t > 25.9 && t < 26.8 ? 1 : 0);
      sci.setPose(over(STAND(t, 2), { rSh: [-0.9, 0, -0.2], rEl: [-0.6, 0, 0], lSh: [-0.9, 0, 0.2], lEl: [-0.7, 0, 0], lHip: [-0.3 * wv, 0, 0.07], rHip: [0.3 * wv, 0, -0.07] }));
      scene.updateMatrixWorld(true);
      { const a = sci.j.rWr.localToWorld(V(0, -0.07, 0)), d = V(0.05, -0.25, 1).normalize(); probe.position.copy(a).addScaledVector(d, 1.0); probe.quaternion.setFromUnitVectors(V(0, 1, 0), d); }
      // ---------- camera ----------
      let cp, lk;
      const C = t < 1.2 ? hp.clone().add(V(0, 0.9, 0)) : hero.j.chest.getWorldPosition(V(0, 0, 0));
      if (t < 1.2) { const k = range(t, 0, 1.2); cp = V(...K[0][1]).lerp(V(...K[1][1]), k); lk = V(...K[0][2]).lerp(V(...K[1][2]), k); }
      else {
        const OFF = [[1.2, [2.3, 1.2, 5.6]], [3.1, [3.6, 1.4, -3.4]], [5.3, [5.6, 0.2, -6.4]], [11.0, [5.4, -0.2, -6.2]], [12.0, [3.6, 1.0, -3.5]], [16.9, [3.0, 0.8, -3.0]], [20.3, [3.4, 1.0, -3.3]], [22.4, [3.8, 1.2, -3.6]]];
        let oi = 0; while (oi < OFF.length - 2 && OFF[oi + 1][0] < t) oi++;
        const ok = smooth(range(t, OFF[oi][0], OFF[oi + 1][0])), off = V(...OFF[oi][1]).lerp(V(...OFF[oi + 1][1]), ok);
        cp = C.clone().add(off); lk = C.clone();
        const rockView = smooth(range(t, 5.2, 6.0)) * (1 - smooth(range(t, 10.8, 11.8)));
        lk.lerp(V(-0.5, 2.6, 13.0), rockView);
        // fly up and over to the scientist on the far rim
        const fly = smooth(range(t, 22.4, 23.9));
        if (fly > 0) {
          const mid = V(4, 15, 0), endP = V(3.2, 10.9, -12.9), endL = SCI.clone().add(V(0, 0.95, 0));
          const q = fly, a = cp.clone().lerp(mid, q), b = mid.clone().lerp(endP, q);
          cp = a.lerp(b, q); lk = lk.clone().lerp(endL, smooth(range(t, 22.6, 23.9)));
          if (t > 23.9) { cp = endP.clone().add(V(0, 0, -0.35 * smooth(range(t, 24, 27.6)))); lk = endL.clone().add(V(0, 0, -0.5 * back)); }
        }
      }
      const sh = shake(t, 0.8 + heat * 0.6, 7);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-6, 10, 4));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const dk = smooth(range(t, 6.0, 6.3)) * (1 - smooth(range(t, 8.6, 8.9)));
      dens.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.18).addScaledVector(rt, 0.18); dens.scale.set(0.3 * dk, 0.246 * dk, 1); dens.material.opacity = dk; dens.visible = dk > 0.01;
      const tk = smooth(range(t, 11.9, 12.2)) * (1 - smooth(range(t, 16.7, 17.0)));
      th.set(lerp(20, 1170, easeInOut(range(t, 12.0, 13.9))));
      th.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.22).addScaledVector(rt, 0.2); th.scale.set(0.32 * tk, 0.1875 * tk, 1); th.material.opacity = tk; th.visible = tk > 0.01;
      safe.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.1); safe.set(t > 26.0 ? easeOut(range(t, 26.0, 26.16)) : 0);
      fx.safe.position.copy(c.position).addScaledVector(fw, 2.4).addScaledVector(upv, -0.1); fx.safe.update(t - 26.0);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 3.0, 'WHAT IF', 'YOU FELL IN?', '#ffffff', 'into a volcano'],
        [3.11, 5.36, 'FIRST', "YOU WON'T SINK", '#ffb36b', ''], [5.36, 8.43, 'LAVA', '3x DENSER', '#ff7a30', 'than water'], [8.43, 11.1, 'LAVA', 'LIKE MUD', '#ff9a5a', 'you land on top'],
        [11.32, 14.04, 'TEMPERATURE', '1,000°C+', '#ff4a1f', ''], [14.04, 16.9, 'TEMPERATURE', 'HEAT HITS FIRST', '#ff4a1f', 'before you even touch it'],
        [16.98, 18.75, 'THEN', 'CLOTHES IGNITE', '#ffb347', ''], [18.75, 22.3, 'THEN', 'TOXIC GAS', '#c8d050', 'impossible to breathe'],
        [22.44, 25.9, 'VOLCANO SCIENTISTS', 'HEAT-PROOF SUITS', '#e6ebf2', ''], [25.9, 27.6, 'VOLCANO SCIENTISTS', 'STAY BACK', '#5be37d', 'never get too close'],
      ];
      const cur = CARDS.find(([a, b]) => t >= a && t < b); let ck = 0;
      if (cur) { card.set(cur[2], cur[3], cur[4], null, cur[5]); const grp = CARDS.filter(x => x[2] === cur[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk = 1 + 0.09 * Math.exp(-(t - cur[0]) * 9); card.scale.set(0.72 * pk, 0.281 * pk, 1); }
      card.material.opacity = ck; card.visible = false;
      const fd = cp.distanceTo(lk);
      return { dof: { focus: fd, aperture: 0.0006, maxblur: 0.004 }, bloom: 0.7, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
