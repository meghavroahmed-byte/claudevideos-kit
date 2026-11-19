import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { infoCard, burst } from './rare.js';
import { iconBubble, stamp } from './ancient.js';
import { stars, earth, airlock, suitUp, stopwatch, lungsTex, comic, suitIcon } from './space.js';

export const DURATION = 28.0;
export const CAPTIONS = [
  [0.0, 'What if you stepped'], [0.94, 'into space'], [1.72, 'without a spacesuit?'],
  [3.16, "You wouldn't explode"], [4.26, 'like in the movies'],
  [5.58, 'Instead'], [6.41, 'the air would rush out'], [7.61, 'of your lungs'], [8.47, 'so never'], [9.19, 'hold your breath'],
  [10.42, 'After about 10 seconds'], [11.98, 'the water in your mouth'], [13.17, 'and eyes'], [13.65, 'starts to boil'],
  [14.95, 'and your skin'], [15.54, 'swells up'], [16.29, 'like a balloon'],
  [17.41, 'After about 15 seconds'], [19.19, "you'd pass out"], [20.02, 'from lack of oxygen'],
  [21.55, "But here's"], [22.03, 'the surprising part'], [23.37, "if you're rescued"], [24.16, 'within about 90 seconds'], [25.92, 'you could still survive!', 27.8],
];
export const FADES = [];

const INSIDE = V(0, 0, -0.9);
function heroPath(t) {   // float path out of the door
  if (t < 2.3) return INSIDE.clone().lerp(V(0, 0, -0.15), smooth(range(t, 0.9, 2.2)));
  const k = t - 2.3, z = -0.15 + 6.8 * (1 - Math.exp(-k * 0.42)), y = Math.min(1.0, k * 0.35);
  return V(0.05 + k * 0.025, y, z);
}
const K = [
  [0.0, [-1.4, 1.7, 5.4], [0, 1.0, -0.6]],
  [2.2, [-1.25, 1.6, 4.7], [0, 1.05, -0.2]],
  [3.6, [2.6, 2.0, 6.6], [0.75, 1.25, 1.6]],
  [4.6, [4.4, 1.9, 4.6], [0.7, 1.4, 3.2]],
  [5.8, [1.6, 1.85, 1.0], [0.12, 1.95, 4.6]],
  [5.6, [-0.65, 1.95, 1.3], [0.3, 1.1, 5.4]],
  [7.6, [-0.45, 1.85, 1.6], [0.35, 1.15, 5.8]],
  [10.4, [0.15, 1.75, 2.4], [0.4, 1.25, 6.0]],
  [12.9, [0.35, 1.8, 3.25], [0.45, 1.55, 6.15]],
  [15.4, [0.0, 1.85, 2.5], [0.5, 1.2, 6.3]],
  [18.0, [-0.5, 2.0, 2.4], [0.55, 1.1, 6.45]],
  [21.4, [-0.8, 2.4, 2.1], [0.6, 1.0, 6.6]],
  [22.8, [3.6, 2.2, 5.6], [0.4, 1.0, 4.4]],
  [24.4, [4.2, 2.0, 4.6], [0.3, 1.0, 3.2]],
  [25.6, [2.4, 1.8, 3.6], [0.1, 1.0, 0.2]],
  [26.5, [1.25, 1.6, 4.4], [0, 1.0, -0.6]],
  [28.0, [1.05, 1.6, 4.2], [0, 1.0, -0.6]],
];
function track(t) {
  const n = K.length, T = (i) => K[clamp(i, 0, n - 1)][0], P = (i, j) => V(...K[clamp(i, 0, n - 1)][j]);
  if (t <= K[0][0]) return [P(0, 1), P(0, 2)];
  if (t >= K[n - 1][0]) return [P(n - 1, 1), P(n - 1, 2)];
  let i = 0; while (K[i + 1][0] < t) i++;
  const u = (t - T(i)) / (T(i + 1) - T(i)), dt = T(i + 1) - T(i);
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  return [1, 2].map(j => {
    const m0 = P(i + 1, j).sub(P(i - 1, j)).multiplyScalar(dt / Math.max(1e-3, T(i + 1) - T(i - 1)) * 0.55);
    const m1 = P(i + 2, j).sub(P(i, j)).multiplyScalar(dt / Math.max(1e-3, T(i + 2) - T(i)) * 0.55);
    return P(i, j).multiplyScalar(h00).add(m0.multiplyScalar(h10)).add(P(i + 1, j).multiplyScalar(h01)).add(m1.multiplyScalar(h11));
  });
}
const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const FLOAT = (t) => ({ lSh: [-0.3 + Math.sin(t * 1.1) * 0.15, 0, 0.75], rSh: [-0.25 + Math.sin(t * 1.3) * 0.15, 0, -0.7], lEl: [-0.5, 0, 0], rEl: [-0.55, 0, 0], lHip: [-0.35, 0, 0.12], rHip: [-0.15, 0, -0.1], lKn: [0.6, 0, 0], rKn: [0.35, 0, 0], neck: [0.05, Math.sin(t * 0.7) * 0.2, 0], chest: [Math.sin(t * 1.2) * 0.02, 0, 0] });
const over = (a, b) => Object.assign({}, a, b);
const mixP = (a, b, k) => { const o = {}; for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) { if (key === 'drop') { o.drop = lerp(a.drop || 0, b.drop || 0, k); continue; } const va = a[key] || [0, 0, 0], vb = b[key] || [0, 0, 0]; o[key] = va.map((x, i) => lerp(x, vb[i], k)); } return o; };
const secAt = (t) => { const P = [[2.9, 0], [11.03, 10], [18.04, 15], [21.5, 19]]; if (t <= P[0][0]) return 0; for (let i = 0; i < P.length - 1; i++) if (t <= P[i + 1][0]) return Math.floor(lerp(P[i][1], P[i + 1][1], (t - P[i][0]) / (P[i + 1][0] - P[i][0]))); return 19; };

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [6, 5, 7], sun: 3.2 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x000208); u.mid.value.set(0x01040e); u.horizon.value.set(0x030a1c); u.floorC.value.set(0x000208);
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0x9bb8ff); hemi.groundColor.set(0x1a3a6a); hemi.intensity = 0.5;
  const key = scene.userData.key; key.color.set(0xfff6e8);
  scene.environmentIntensity = 0.6;
  scene.add(stars());
  const E = earth(80); E.position.set(10, -96, 95); scene.add(E);
  const earthLight = new THREE.DirectionalLight(0x6fa8ff, 0.7); earthLight.position.set(0, -5, 4); scene.add(earthLight);
  const A = airlock(); A.userData.hatch.visible = false; scene.add(A);
  const roomLight = new THREE.PointLight(0xdfe9ff, 6, 5, 1.3); roomLight.position.set(0, 2.2, -1.5); scene.add(roomLight);
  const hero = makeHuman('casual', { shirt: 0x2a9d8f, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const res = makeHuman('casual', { shirt: 0xeef1f5, jeans: 0xeef1f5 }); suitUp(res); scene.add(res.root);
  // movie myth ghost
  const ghost = makeHuman('casual', { shirt: 0x2a9d8f }); scene.add(ghost.root);
  ghost.root.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ color: 0x7fd3ff, transparent: true, opacity: 0.26, depthWrite: false, blending: THREE.AdditiveBlending }); o.castShadow = false; } });
  const boom = comic('BOOM!'); scene.add(boom);
  const suitB = iconBubble(suitIcon()); scene.add(suitB);
  const lungN = iconBubble(lungsTex('normal')), lungH = iconBubble(lungsTex('held')); scene.add(lungN, lungH);
  const mist = []; for (let i = 0; i < 24; i++) { const s = glowSprite(0xe8f4ff, 0.2); s.userData.ph = i / 24; scene.add(s); mist.push(s); }
  const boil = []; for (let i = 0; i < 18; i++) { const s = glowSprite(0xbfe8ff, 0.05); s.userData.ph = (i * 0.37) % 1; s.userData.k = i % 3; scene.add(s); boil.push(s); }
  const sw = stopwatch(); scene.add(sw);
  const fx = { boom: burst(0xffa040, 120, 1), grab: burst(0xffffff, 50, 2), win: burst(0x5be37d, 110, 3) };
  Object.values(fx).forEach(f => scene.add(f));
  const myth = stamp('MYTH!', '#ff2a2a', 0.5); scene.add(myth);
  const surv = stamp('SURVIVED!', '#5be37d', 0.62); scene.add(surv);
  const card = infoCard(); scene.add(card);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      A.userData.warn.material.color.setHex(Math.floor(t * 2.5) % 2 ? 0xff3030 : 0x551010);
      // ================= HERO =================
      const rescued = t > 24.1, back = smooth(range(t, 24.1, 25.6));
      let hp = heroPath(Math.min(t, 24.1));
      if (rescued) hp = hp.clone().lerp(V(0, 0, -0.75), easeInOut(back));
      const out = smooth(range(t, 2.2, 3.0)) * (1 - smooth(range(t, 25.4, 25.9)));
      const swell = smooth(range(t, 15.4, 16.6)) * (1 - smooth(range(t, 25.4, 26.2)));
      const limp = smooth(range(t, 19.3, 20.0)) * (1 - smooth(range(t, 25.7, 26.1)));
      const air = smooth(range(t, 6.9, 7.2)) * (1 - smooth(range(t, 8.3, 8.6)));
      let pose = mixP(STAND(t), FLOAT(t), out);
      if (t < 2.3) pose = over(pose, { neck: [-0.1, 0, 0], lHip: [-0.35 * smooth(range(t, 2.0, 2.3)), 0, 0.07], lKn: [0.5 * smooth(range(t, 2.0, 2.3)), 0, 0] });
      pose = mixP(pose, over(FLOAT(t), { lSh: [-1.6, 0, 0.6], rSh: [-1.5, 0, -0.6], lEl: [-0.2, 0, 0], rEl: [-0.2, 0, 0], neck: [0.55, 0.3, 0], lHip: [-0.5, 0, 0.15], lKn: [0.8, 0, 0], rKn: [0.6, 0, 0] }), limp);
      if (air > 0) pose = over(pose, { chest: [0.12 * air, 0, 0], neck: [-0.2 * air, 0, 0] });
      if (t > 25.6) { const up = smooth(range(t, 26.2, 26.6)); pose = over(STAND(t), { rSh: [-1.7 * up, 0, -0.3], rEl: [-1.7 * up, 0, 0], chest: [-0.06 * smooth(range(t, 25.8, 26.1)), 0, 0] }); }
      hero.setPose(pose);
      hero.root.position.copy(hp); hero.root.position.y += out * Math.sin(t * 0.9) * 0.05;
      const turnK = smooth(range(t, 2.6, 4.4)) * (1 - smooth(range(t, 25.5, 26.0)));
      hero.root.rotation.set(Math.sin(t * 0.4) * 0.12 * out + 0.25 * limp, Math.PI * turnK + Math.sin(t * 0.25) * 0.2 * out, Math.sin(t * 0.33) * 0.15 * out + 0.4 * limp * Math.sin(t * 0.5));
      hero.root.scale.set(1 + 0.22 * swell, 1 + 0.05 * swell, 1 + 0.28 * swell); hero.j.head.scale.setScalar(1 + 0.16 * swell);
      hero.setMouth(t > 25.6 ? 0.55 * Math.exp(-Math.max(0, t - 25.9) * 2) : Math.max(0.6 * air, 0.25 * smooth(range(t, 12.5, 13.0)) * (1 - limp)));
      scene.updateMatrixWorld(true);
      const head = hero.j.head.localToWorld(V(0, 0.1, 0)), mouth = hero.j.head.localToWorld(V(0, 0.02, 0.13));
      // ================= RESCUER =================
      res.root.visible = t > 23.0;
      if (res.root.visible) {
        const go = easeInOut(range(t, 23.3, 24.1));
        const start = V(0, 0.2, -0.6), reach = heroPath(24.1).add(V(0, 0.15, -0.55));
        let rp = start.clone().lerp(reach, go);
        if (rescued) rp = reach.clone().lerp(V(0.55, 0, -1.4), easeInOut(back));
        res.root.position.copy(rp); res.root.rotation.set(-0.15 * (1 - back), 0, 0);
        res.setPose(over(FLOAT(t), { lSh: [-1.5, 0, 0.3], rSh: [-1.5, 0, -0.3], lEl: [-0.1, 0, 0], rEl: [-0.1, 0, 0] }));
        if (t > 25.6) res.setPose(over(STAND(t, 2), { lSh: [-0.6, 0, 0.6], lEl: [-1.2, 0, 0] }));
      }
      fx.grab.position.copy(heroPath(24.1)).add(V(0, 1.2, -0.3)); fx.grab.update(t - 24.1);
      // ================= MYTH (movies) =================
      const gk = easeOut(range(t, 3.2, 3.45)) * (t < 4.2 ? 1 : 0), inflate = smooth(range(t, 3.55, 4.18));
      ghost.root.visible = gk > 0.01; ghost.root.position.copy(heroPath(t)).add(V(1.15, 0.1, -0.2)); ghost.root.rotation.y = -0.6;
      ghost.setPose(FLOAT(t)); ghost.root.scale.set((1 + inflate * 0.8) * gk, (1 + inflate * 0.35) * gk, (1 + inflate * 0.8) * gk); ghost.j.head.scale.setScalar(1 + inflate * 0.9);
      const bk = t > 4.2 ? easeOut(range(t, 4.2, 4.35)) * (1 - smooth(range(t, 4.9, 5.3))) : 0;
      boom.position.copy(ghost.root.position).add(V(0, 0.95, 0)); boom.scale.setScalar(0.85 * bk); boom.material.opacity = bk; boom.visible = bk > 0.01;
      fx.boom.position.copy(boom.position); fx.boom.update(t - 4.2);
      suitB.position.copy(INSIDE).add(V(0.72, 1.45, 0.5)); suitB.set(0.5 * easeOut(range(t, 1.72, 1.95)) * (1 - smooth(range(t, 2.9, 3.2))), smooth(range(t, 2.05, 2.2)));
      // ================= LUNGS =================
      const lk = easeOut(range(t, 6.3, 6.6)) * (1 - smooth(range(t, 9.05, 9.2))), hk2 = easeOut(range(t, 9.15, 9.35)) * (1 - smooth(range(t, 10.2, 10.5)));
      lungN.position.copy(head).add(V(0.36, -0.5, -0.15)); lungN.set(0.4 * lk * (1 - 0.25 * smooth(range(t, 7.1, 8.3))), 0);
      lungH.position.copy(lungN.position); lungH.set(0.44 * hk2 * (1 + 0.05 * Math.sin(t * 20)), smooth(range(t, 9.45, 9.6)));
      mist.forEach((s, i) => { const u2 = ((t - 7.0) * 1.6 + s.userData.ph) % 1, k = air * (t > 7 ? 1 : 0); s.position.copy(mouth).add(V(Math.sin(i * 2.1) * 0.06 * u2, u2 * 0.15, u2 * 0.9)); s.scale.setScalar(0.08 + u2 * 0.3); s.material.opacity = k * (1 - u2) * 0.7; });
      // ================= BOILING SALIVA / TEARS =================
      const bo = smooth(range(t, 13.6, 13.9)) * (1 - smooth(range(t, 15.2, 15.6)));
      const spots = [hero.j.head.localToWorld(V(0.035, 0.11, 0.11)), hero.j.head.localToWorld(V(-0.035, 0.11, 0.11)), mouth];
      boil.forEach((s, i) => { const u2 = (t * 2.2 + s.userData.ph) % 1; s.position.copy(spots[s.userData.k]).add(V(Math.sin(i * 3.1) * 0.02, u2 * 0.08, 0.02 + u2 * 0.05)); s.scale.setScalar(0.05 + 0.05 * Math.sin(u2 * Math.PI)); s.material.opacity = bo * Math.sin(u2 * Math.PI); });
      // ================= HUD stopwatch =================
      const swk = smooth(range(t, 10.3, 10.6)) * (1 - smooth(range(t, 21.3, 21.6)));
      sw.set(secAt(t), clamp(1 - (t - 10.5) / 8.5), secAt(t) >= 15 ? '#ff6b6b' : '#ffffff');
      // ---------- camera ----------
      const C = hp.clone().add(V(0, 0.95, 0));
      const OFF = [[5.0, [1.4, -0.1, -3.6]], [7.0, [0.2, 0.2, -3.5]], [8.6, [-1.2, 0.35, -3.4]], [10.4, [-1.0, 0.25, -3.2]], [12.9, [-0.6, 0.15, -3.0]], [15.4, [-1.2, 0.3, -3.6]], [18.0, [-1.6, 0.6, -3.7]], [22.6, [-1.9, 1.0, -3.9]]];
      let oi = 0; while (oi < OFF.length - 2 && OFF[oi + 1][0] < t) oi++;
      const ok = smooth(range(t, OFF[oi][0], OFF[oi + 1][0])), off = V(...OFF[oi][1]).lerp(V(...OFF[oi + 1][1]), ok);
      const [ap, al] = track(Math.min(t, 5.8));
      const bp = C.clone().add(off), bl = C.clone();
      const rc = res.root.position.clone().add(V(0, 0.95, 0)), rp = rc.clone().add(V(2.2, 0.9, 3.4));
      const dp = V(1.2, 1.6, 4.4), dl = V(0, 1.0, -0.6);
      const w1 = smooth(range(t, 5.8, 7.0)), w2 = smooth(range(t, 22.4, 23.6)), w3 = smooth(range(t, 24.4, 25.3));
      const cp = ap.lerp(bp, w1).lerp(rp, t > 23.0 ? w2 : 0).lerp(dp, w3), lkp = al.lerp(bl, w1).lerp(rc, t > 23.0 ? w2 : 0).lerp(dl, w3);
      const sh = shake(t, 0.5, 6);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lkp.x, lkp.y, lkp.z], Math.sin(t * 0.3) * 0.03);
      c.updateMatrixWorld(true);
      key.target.position.copy(lkp); key.position.copy(lkp).add(V(6, 5, 7));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      sw.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.22).addScaledVector(rt, 0.2); sw.scale.set(0.3 * swk, 0.176 * swk, 1); sw.material.opacity = swk; sw.visible = swk > 0.01;
      myth.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.05); myth.set(t > 4.63 ? easeOut(range(t, 4.63, 4.8)) * (1 - smooth(range(t, 5.4, 5.7))) : 0);
      surv.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.06); surv.set(t > 26.24 ? easeOut(range(t, 26.24, 26.4)) : 0);
      fx.win.position.copy(c.position).addScaledVector(fw, 2.4).addScaledVector(upv, 0.06); fx.win.update(t - 26.24);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 3.1, 'WHAT IF', 'NO SPACESUIT?', '#ffffff', 'one step into space'],
        [3.16, 5.5, 'MOVIES', 'EXPLODE?', '#ff6b5b', ''],
        [5.58, 9.19, 'FIRST', 'AIR RUSHES OUT', '#8ecbff', 'out of your lungs'], [9.19, 10.4, 'FIRST', "DON'T HOLD IT", '#ff4a4a', 'never hold your breath'],
        [10.42, 15.54, '10 SECONDS', 'WATER BOILS', '#7fd3ff', 'mouth and eyes'], [15.54, 17.35, '10 SECONDS', 'SKIN SWELLS', '#ffb36b', 'like a balloon'],
        [17.41, 21.4, '15 SECONDS', 'PASS OUT', '#ff6b6b', 'no oxygen'],
        [21.55, 23.6, "HERE'S THE", 'SURPRISE', '#ffffff', ''], [23.6, 26.1, 'RESCUE WITHIN', '90 SECONDS', '#5be37d', 'and you could survive'],
      ];
      const cur = CARDS.find(([a, b]) => t >= a && t < b); let ck = 0;
      if (cur) { card.set(cur[2], cur[3], cur[4], null, cur[5]); const grp = CARDS.filter(x => x[2] === cur[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk = 1 + 0.09 * Math.exp(-(t - cur[0]) * 9); card.scale.set(0.72 * pk, 0.281 * pk, 1); }
      card.material.opacity = ck; card.visible = ck > 0.01;
      const fd = cp.distanceTo(lkp);
      return { dof: { focus: fd, aperture: 0.0008, maxblur: 0.004 }, bloom: 0.5, exposure: 1.05 - 0.4 * limp * (t < 23 ? 1 : 0) };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
