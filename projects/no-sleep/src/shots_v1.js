import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { infoCard, burst } from './rare.js';
import { iconBubble, stamp } from './ancient.js';
import { bedroom, dayDisplay, brainBubble, ghost, textSprite, cloud } from './room.js';

export const DURATION = 29.6;
export const CAPTIONS = [
  [0.0, 'What happens to your body'], [1.45, 'if you stop sleeping?'],
  [3.01, 'After 24 hours'], [4.55, "you feel like you're drunk"], [6.22, 'Your reactions'], [6.92, 'slow down'], [7.79, 'and your mood crashes'],
  [9.5, 'By day two'], [10.58, 'your brain'], [11.07, 'starts shutting off'], [12.05, 'for a few seconds'], [13.03, 'at a time'], [13.83, 'even with your eyes open'],
  [15.49, 'These are called'], [16.08, 'microsleeps'],
  [17.44, 'On day three'], [18.59, 'you may start seeing things'], [19.81, "that aren't there"],
  [21.11, 'The world record'], [21.88, 'for staying awake'], [22.83, 'is about 11 days'],
  [24.61, "But don't try it"], [25.69, 'because your brain'], [26.43, 'needs sleep'], [27.18, 'to clean itself'], [28.18, 'every night', 29.4],
];
export const FADES = [];

const CHAIR = V(-1.85, 0, -1.0), MID = V(0, 0, 0.2), BEDFOOT = V(1.75, 0, -0.35), DISP = V(1.05, 1.62, -2.9);
const K = [
  [0.0, [0.9, 1.6, 4.9], [-1.2, 1.0, -1.1]],
  [2.8, [0.4, 1.55, 4.4], [-1.5, 1.0, -1.0]],
  [4.0, [1.0, 1.6, 4.7], [-0.4, 1.0, -0.2]],
  [5.2, [0.9, 1.55, 4.6], [0, 1.0, 0.1]],
  [9.3, [0.8, 1.55, 4.5], [0, 1.0, 0.1]],
  [10.6, [0.95, 1.6, 4.2], [0.2, 1.2, 0.1]],
  [13.9, [0.7, 1.55, 3.8], [0.15, 1.15, 0.2]],
  [16.8, [0.8, 1.6, 4.3], [0.1, 1.1, 0.1]],
  [17.8, [0.3, 1.7, 5.0], [0, 1.25, -0.3]],
  [20.8, [0.45, 1.7, 4.9], [0.2, 1.35, -0.6]],
  [22.0, [0.75, 1.65, 5.0], [0.5, 1.45, -1.2]],
  [24.4, [0.8, 1.65, 4.9], [0.55, 1.4, -1.2]],
  [25.7, [1.4, 1.75, 4.6], [1.3, 0.9, -0.8]],
  [27.0, [1.6, 2.25, 3.7], [1.7, 0.9, -1.5]],
  [29.6, [1.65, 2.2, 3.5], [1.7, 0.95, -1.5]],
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
const SIT = { drop: -0.45, lHip: [-1.5, 0, 0.1], lKn: [1.45, 0, 0], rHip: [-1.5, 0, -0.1], rKn: [1.45, 0, 0] };
const WALK = (p, a = 1) => { const s = Math.sin(p); return { lHip: [-0.4 * s * a, 0, 0.05], rHip: [0.4 * s * a, 0, -0.05], lKn: [(0.15 + 0.5 * Math.max(0, Math.sin(p + 1.3))) * a, 0, 0], rKn: [(0.15 + 0.5 * Math.max(0, Math.sin(p + 1.3 + Math.PI))) * a, 0, 0], lSh: [0.35 * s * a, 0, 0.15], rSh: [-0.35 * s * a, 0, -0.15], lEl: [-0.4, 0, 0], rEl: [-0.4, 0, 0], drop: -0.02 + Math.abs(Math.cos(p)) * 0.02 }; };
const over = (a, b) => Object.assign({}, a, b);
function beerIcon() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#ffc233'; g.beginPath(); g.roundRect(150, 170, 190, 250, 24); g.fill();
  g.strokeStyle = '#e8eef5'; g.lineWidth = 34; g.beginPath(); g.arc(345, 290, 62, -1.3, 1.3); g.stroke();
  g.fillStyle = '#ffffff'; for (const [x, y, r] of [[170, 165, 48], [230, 140, 58], [295, 158, 50], [330, 180, 36]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(180, 210, 26, 180);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 5, sunDir: [-2, 6, 3], sun: 1.0 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x0b1230); u.mid.value.set(0x16204a); u.horizon.value.set(0x2a3a70); u.floorC.value.set(0x101420);
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const key = scene.userData.key; key.color.set(0x9db8ff); key.intensity = 1.1; key.position.set(-1.5, 5, 1); key.target.position.set(0, 0, -1);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0x8fa6d8); hemi.groundColor.set(0x3a3040); hemi.intensity = 0.75;
  const room = bedroom(); scene.add(room);
  const R = room.userData;
  const monLight = new THREE.PointLight(0x7fc4ff, 5, 4, 1.5); monLight.position.set(-2.3, 1.2, -1.0); scene.add(monLight);
  const lamp = new THREE.PointLight(0xffb45a, 6, 6, 1.4); lamp.position.set(0.7, 0.95, -2.4); scene.add(lamp);
  const ceil = new THREE.PointLight(0xfff0dc, 4, 9, 1.2); ceil.position.set(0, 2.9, 0.8); scene.add(ceil);
  const purple = new THREE.PointLight(0xb06bff, 0, 7, 1.2); purple.position.set(0, 2.2, 0.6); scene.add(purple);
  const disp = dayDisplay(); disp.position.copy(DISP); scene.add(disp);
  const hero = makeHuman('casual', { shirt: 0x4b5d8a, jeans: 0x2b2b30, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.5 })); ball.castShadow = true; scene.add(ball);
  const storm = cloud(); scene.add(storm);
  const flash = new THREE.PointLight(0xcfe6ff, 0, 5, 1.3); scene.add(flash);
  const brain = brainBubble(); scene.add(brain);
  const beer = iconBubble(beerIcon()); scene.add(beer);
  const ghosts = [['fish', '#6fe3ff'], ['jelly', '#ff7ae0'], ['duck', '#ffe14d'], ['eye', '#9dff6a'], ['fish', '#b98aff']].map(([k, col]) => { const g = ghost(k, col); scene.add(g); return g; });
  const zs = [0, 1, 2].map(i => { const z = textSprite('z', '#bfe3ff'); scene.add(z); return z; });
  const timer = textSprite('3 SEC', '#ff6b6b'); scene.add(timer);
  const fx = { hit: burst(0xffd166, 40, 1), gold: burst(0xffe14d, 110, 2), rec: burst(0xffe14d, 60, 3), poof: burst(0xb06bff, 70, 4) };
  Object.values(fx).forEach(f => scene.add(f));
  const donttry = stamp("DON'T TRY IT!", '#ff2a2a', 0.66); scene.add(donttry);
  const card = infoCard(); scene.add(card);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // ---------- display ----------
      const hrs = t < 3.0 ? 16 : Math.round(lerp(16, 24, smooth(range(t, 3.0, 3.9))));
      if (t < 9.5) disp.set(1, `${hrs} HRS`);
      else if (t < 17.5) disp.set(2, 'DAY 2', '#ffb02e');
      else if (t < 22.0) disp.set(3, 'DAY 3', '#ff7ae0');
      else if (t < 25.9) { const d = Math.round(lerp(3, 11, easeInOut(range(t, 22.0, 23.4)))); disp.set(d, `DAY ${d}`, d >= 11 ? '#ffe14d' : '#ff7ae0'); }
      else disp.set('-', 'SLEEP', '#7fc4ff');
      // ---------- hero ----------
      const standUp = smooth(range(t, 3.35, 3.9)), walk1 = range(t, 3.9, 5.0);
      const lieK = smooth(range(t, 25.95, 26.6)), walk2 = range(t, 24.95, 25.95);
      let pose, rot = 0, pos = CHAIR.clone(), roll = 0;
      if (t < 3.9) {
        pos = CHAIR.clone().lerp(CHAIR.clone().add(V(0.35, 0, 0)), standUp); rot = -Math.PI / 2 + standUp * 0.6;
        const type = Math.sin(t * 22) * 0.06 * (1 - standUp);
        pose = SIT; pose = over(STAND(t), { ...Object.fromEntries(Object.entries(SIT).map(([k, v]) => [k, Array.isArray(v) ? v.map(x => x * (1 - standUp)) : v * (1 - standUp)])), lSh: [lerp(-0.9, 0.05, standUp), 0, 0.15], rSh: [lerp(-0.9, 0.05, standUp), 0, -0.15], lEl: [lerp(-0.9, -0.25, standUp) + type, 0, 0], rEl: [lerp(-0.9, -0.25, standUp) - type, 0, 0], spine: [0.15 * (1 - standUp), 0, 0], neck: [0.05, 0, 0] });
        hero.setMouth(0);
      } else if (t < 24.95) {
        const wk = easeInOut(walk1), from = CHAIR.clone().add(V(0.35, 0, 0));
        pos = from.lerp(MID, wk);
        rot = walk1 < 1 ? Math.atan2(MID.x - from.x, MID.z - from.z) * (1 - smooth(range(walk1, 0.7, 1))) : 0;
        const drunk = smooth(range(t, 4.6, 5.2)) * (1 - smooth(range(t, 9.2, 9.8)));
        roll = Math.sin(t * 1.9) * 0.12 * drunk;
        pos.x += Math.sin(t * 1.9) * 0.12 * drunk;
        pose = walk1 < 1 ? WALK((t - 3.9) * 7, 1) : STAND(t);
        pose = over(pose, { spine: [0.05 * drunk, 0, Math.sin(t * 1.9 + 0.5) * 0.18 * drunk], neck: [0.25 * drunk, 0, Math.sin(t * 1.9 + 1.2) * 0.25 * drunk] });
        // late reaction: hands up AFTER the ball hits
        const late = smooth(range(t, 7.45, 7.7)) * (1 - smooth(range(t, 8.2, 8.5)));
        const hitk = Math.exp(-Math.max(0, t - 7.0) * 6) * (t > 7.0 ? 1 : 0);
        if (late > 0 || hitk > 0) pose = over(pose, { lSh: [-2.2 * late, 0, 0.3], rSh: [-2.2 * late, 0, -0.3], lEl: [-1.6 * late, 0, 0], rEl: [-1.6 * late, 0, 0], neck: [-0.4 * hitk, 0, 0.3 * hitk] });
        const grump = smooth(range(t, 8.0, 8.3)) * (1 - smooth(range(t, 9.5, 9.9)));
        if (grump > 0) pose = over(pose, { lSh: [-1.0 * grump, 0, 0.1], rSh: [-1.0 * grump, 0, -0.1], lEl: [-1.9 * grump, -0.3, 0], rEl: [-1.9 * grump, 0.3, 0], neck: [0.25 * grump, 0, 0] });
        // day 3: looks around, points at the hallucinations
        const look3 = smooth(range(t, 18.4, 18.8)) * (1 - smooth(range(t, 21.0, 21.5)));
        if (look3 > 0) pose = over(pose, { neck: [-0.25 * look3, Math.sin(t * 1.5) * 0.7 * look3, 0], rSh: [-1.6 * look3, 0, -0.3 - 0.4 * Math.sin(t * 1.5) * look3], rEl: [-0.1, 0, 0], spine: [-0.08 * look3, Math.sin(t * 1.5) * 0.25 * look3, 0] });
        // record: tired slump
        const slump = smooth(range(t, 21.3, 21.8)) * (1 - smooth(range(t, 24.6, 25.0)));
        if (slump > 0) pose = over(pose, { spine: [0.25 * slump, 0, 0], neck: [0.3 * slump, 0, 0], lSh: [0.1, 0, 0.1], rSh: [0.1, 0, -0.1] });
        hero.setMouth(0.3 * grump + 0.35 * Math.exp(-Math.max(0, t - 7.0) * 3) * (t > 7 ? 1 : 0) + 0.25 * look3);
      } else {
        const wk = easeInOut(walk2);
        pos = MID.clone().lerp(BEDFOOT, wk); rot = Math.atan2(BEDFOOT.x - MID.x, BEDFOOT.z - MID.z) * (1 - lieK);
        pose = walk2 < 1 ? WALK((t - 24.95) * 7, 1) : STAND(t);
        if (lieK > 0) {
          pos = BEDFOOT.clone().lerp(V(1.75, 0.6, -0.55), lieK);
          pose = over(STAND(t), { lSh: [0.05, 0, 0.25], rSh: [0.05, 0, -0.25], neck: [0.1, 0.2 * lieK, 0], chest: [Math.sin(t * 1.3) * 0.03, 0, 0] });
        }
        hero.setMouth(0);
      }
      hero.root.position.copy(pos); hero.root.rotation.set(-Math.PI / 2 * lieK, t >= 24.95 ? rot : rot, 0, 'YXZ');
      if (lieK > 0) hero.root.rotation.set(-Math.PI / 2 * lieK, rot * (1 - lieK), 0, "YXZ");
      hero.setPose(pose);
      scene.updateMatrixWorld(true);
      const headW = hero.j.head.localToWorld(V(0, 0.1, 0));
      // ---------- props / fx ----------
      beer.position.copy(headW).add(V(0.48, 0.05, 0.1)); beer.set(0.45 * easeOut(range(t, 5.25, 5.5)) * (1 - smooth(range(t, 6.1, 6.4))), 0);
      // ball: thrown at 6.45, hits the head at 7.0, bounces off
      if (t < 7.0) { const k = range(t, 6.45, 7.0); ball.position.copy(V(3.2, 1.4, 0.6).lerp(headW.clone().add(V(0.12, 0.02, 0.05)), k)); ball.position.y += Math.sin(k * Math.PI) * 0.35; }
      else { const d = t - 7.0; ball.position.copy(headW).add(V(0.12 + d * 1.6, 0.02 + d * 2.0 - 4.9 * d * d, 0.05 + d * 0.8)); if (ball.position.y < 0.09) ball.position.y = 0.09; }
      ball.visible = t > 6.45 && t < 8.6;
      fx.hit.position.copy(headW).add(V(0.12, 0.05, 0.05)); fx.hit.update(t - 7.0);
      const sk = smooth(range(t, 8.0, 8.3)) * (1 - smooth(range(t, 9.4, 9.8)));
      storm.position.copy(headW).add(V(0, 0.36, 0)); storm.scale.setScalar(Math.max(0.001, sk)); storm.visible = sk > 0.01; storm.update(t);
      flash.position.copy(storm.position); flash.intensity = Math.exp(-Math.max(0, t - 8.45) * 10) * (t > 8.45 ? 8 : 0);
      // brain bubble: day 2 (shutting off) and the end (cleaning)
      const b1 = easeOut(range(t, 10.55, 10.85)) * (1 - smooth(range(t, 16.9, 17.3))), b2 = easeOut(range(t, 26.4, 26.7));
      const off1 = smooth(range(t, 11.4, 11.9)) * (1 - smooth(range(t, 13.0, 13.4))), off2 = smooth(range(t, 14.1, 14.4)) * (1 - smooth(range(t, 15.2, 15.5)));
      const off = Math.max(off1, off2);
      const on = [0, 1, 2, 3, 4].map(i => 1 - off * clamp((t - 11.4 - i * 0.08) * 4 + (off2 > 0 ? 1 : 0)));
      if (b1 > 0.01) { brain.draw(on, -1, t); brain.position.copy(headW).add(V(0.5, -0.05, 0.15)); brain.scale.setScalar(0.55 * b1); }
      else if (b2 > 0.01) { brain.draw([1, 1, 1, 1, 1], range(t, 27.2, 28.7), t); brain.position.set(1.75, 1.55, -1.75); brain.scale.setScalar(0.8 * b2); }
      brain.visible = b1 > 0.01 || b2 > 0.01;
      timer.position.copy(brain.position).add(V(0, -0.5 * brain.scale.x, 0)); const tk = (t > 12.0 && t < 13.3 ? 1 : 0) * b1; timer.scale.set(0.45 * tk, 0.225 * tk, 1); timer.visible = tk > 0;
      // day 3: hallucinations drift around him
      const gk = smooth(range(t, 18.5, 19.0)) * (1 - smooth(range(t, 21.0, 21.5)));
      ghosts.forEach((g, i) => { const a = t * 0.6 + i * 1.26; g.position.set(MID.x + Math.cos(a) * (0.9 + (i % 2) * 0.3), 1.3 + Math.sin(t * 1.3 + i) * 0.35 + (i % 3) * 0.25, MID.z - 0.3 + Math.sin(a) * 0.6); g.scale.setScalar(0.42 * gk * (i === 3 ? 0.8 : 1)); g.material.opacity = 0.85 * gk; g.visible = gk > 0.01; g.material.rotation = Math.sin(t + i) * 0.2; });
      fx.poof.position.copy(MID).add(V(0, 1.5, -0.2)); fx.poof.update(t - 18.6);
      purple.intensity = 7 * gk;
      fx.rec.position.copy(DISP).add(V(0, 0, 0.2)); fx.rec.update(t - 23.4);
      // lights out for sleep
      const dark = smooth(range(t, 26.2, 26.6));
      lamp.intensity = 6 * (1 - dark); ceil.intensity = 4 * (1 - dark * 0.85); monLight.intensity = 5 * (1 - dark); R.screen.material.color.setScalar(1 - dark * 0.9); R.shade.material.emissiveIntensity = 0.6 * (1 - dark);
      zs.forEach((z, i) => { const u2 = ((t - 27.4) * 0.5 + i / 3) % 1, k = t > 27.4 ? 1 : 0; z.position.set(2.05 + u2 * 0.4, 1.0 + u2 * 0.8, -2.15); z.scale.setScalar((0.25 + u2 * 0.2) * k); z.material.opacity = Math.sin(u2 * Math.PI) * k; });
      // microsleep blackout + the camera
      const [cp, lk] = track(t);
      const sh = shake(t, 0.6, 5);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z], roll * 0.5);
      c.updateMatrixWorld(true);
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion);
      donttry.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.1); donttry.set(t > 25.0 ? easeOut(range(t, 25.0, 25.16)) * (1 - smooth(range(t, 26.2, 26.5))) : 0);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 2.9, 'WHAT IF', 'NO SLEEP?', '#ffffff', 'you just stop sleeping'],
        [3.33, 6.22, '24 HOURS', 'LIKE DRUNK', '#ffc233', 'no sleep = drunk'], [6.22, 7.79, '24 HOURS', 'SLOW REACTIONS', '#ffd166', ''], [7.79, 9.4, '24 HOURS', 'MOOD CRASH', '#8ecbff', ''],
        [9.66, 13.83, 'DAY 2', 'BRAIN OFF', '#ff9a5a', 'a few seconds at a time'], [13.83, 15.49, 'DAY 2', 'EYES OPEN', '#ff9a5a', 'still shutting off'], [15.49, 17.3, 'DAY 2', 'MICROSLEEPS', '#ff9a5a', ''],
        [17.62, 21.0, 'DAY 3', 'HALLUCINATIONS', '#ff7ae0', "things that aren't there"],
        [21.11, 24.5, 'WORLD RECORD', '11 DAYS', '#ffe14d', 'without sleep'],
        [26.43, 29.6, 'SLEEP', 'BRAIN CLEANING', '#7fc4ff', 'every night'],
      ];
      const cur = CARDS.find(([a, b]) => t >= a && t < b); let ck = 0;
      if (cur) { card.set(cur[2], cur[3], cur[4], null, cur[5]); const grp = CARDS.filter(x => x[2] === cur[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk = 1 + 0.09 * Math.exp(-(t - cur[0]) * 9); card.scale.set(0.72 * pk, 0.281 * pk, 1); }
      card.material.opacity = ck; card.visible = false;
      const fd = cp.distanceTo(lk);
      const blackout = off * 0.45;
      return { dof: { focus: fd, aperture: 0.0012, maxblur: 0.005 }, bloom: 0.5, exposure: (1.1 - blackout) * (1 - dark * 0.25) };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
