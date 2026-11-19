import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { infoCard, burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { world, grass, rock, iconBubble, stamp } from './ancient.js';
import { snake, fern, jungleTree, heartSprite, iconTex, barSprite } from './snake.js';

export const DURATION = 32.0;
export const CAPTIONS = [
  [0.0, 'What if you got'], [0.71, 'swallowed'], [1.41, 'by a green anaconda?'],
  [3.37, 'First'], [4.15, "it wouldn't bite you"], [5.1, 'to death'],
  [6.13, 'It would wrap around you'], [7.37, 'and squeeze'], [8.56, 'tighter'], [9.01, 'every time'], [9.86, 'you breathe out'],
  [10.87, 'until your heart'], [11.78, "can't pump blood"],
  [13.27, 'Then its jaws'], [14.36, 'stretch wide'], [15.63, 'and it pulls you in'], [16.53, 'headfirst'], [17.58, 'inch by inch'],
  [19.13, 'Inside'], [19.7, "there's no air"], [20.99, 'and powerful acids'], [22.2, 'start to work'], [23.44, 'It could take'], [24.0, 'the snake weeks'], [24.9, 'to digest you'],
  [26.17, 'Luckily'], [26.8, 'anacondas'], [27.53, 'almost never eat humans'], [29.49, "We're just too wide"], [30.44, 'at the shoulders', 31.8],
];
export const FADES = [];

const HP = V(0, 0, 0.6);   // hero stands on the bank
const curve = (pts) => new THREE.CatmullRomCurve3(pts.map(p => V(...p)), false, 'catmullrom', 0.5);
const lerpV = (a, b, k) => a.clone().lerp(b, k);
// camera keys (scene time)
const K = [
  [0.0, [1.7, 1.75, 7.6], [-0.45, 1.05, -0.5]],
  [2.4, [1.3, 1.7, 6.9], [-0.4, 1.15, -0.4]],
  [3.4, [1.1, 1.65, 6.3], [-0.3, 1.15, -0.1]],
  [4.75, [0.95, 1.55, 5.7], [-0.15, 1.2, 0.3]],
  [6.2, [1.0, 1.6, 5.8], [0, 1.0, 0.5]],
  [7.5, [0.8, 1.55, 5.3], [0, 0.95, 0.6]],
  [11.2, [0.5, 1.5, 4.9], [0, 1.0, 0.6]],
  [12.9, [0.45, 1.5, 4.8], [0, 1.0, 0.6]],
  [14.0, [-1.05, 2.4, 6.6], [-1.05, 0.3, 0.6]],
  [15.6, [-1.35, 2.3, 6.3], [-1.35, 0.3, 0.6]],
  [18.6, [-2.6, 2.25, 6.0], [-2.6, 0.28, 0.6]],
  [19.6, [-3.0, 2.25, 5.6], [-3.0, 0.28, 0.55]],
  [26.2, [-3.35, 2.15, 5.2], [-3.2, 0.28, 0.55]],
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
const FRONTCAM = [V(0.6, 1.5, 6.0), V(0.45, 1.15, 0.7)];
const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);

// ---------- snake paths (head first) ----------
function emergePts(ts) {
  const y = lerp(-0.25, 1.85, smooth(range(ts, 0.6, 2.4)));
  let head = V(-1.15, y, -1.65);
  // strike: lunge to the hero's right shoulder, hold, pull back
  const lunge = smooth(range(ts, 4.45, 4.72)) * (1 - smooth(range(ts, 5.3, 5.85)));
  head = lerpV(head, V(-0.38, 1.38, 0.38), lunge);
  const neck = lerpV(V(-1.3, y * 0.55, -1.95), V(-0.95, 1.0, -0.7), lunge);
  return [head, neck, V(-1.55, -0.02, -2.5), V(-2.6, -0.06, -3.0), V(-3.9, -0.06, -3.7), V(-5.2, -0.06, -3.3), V(-6.4, -0.06, -3.9), V(-7.4, -0.06, -4.6)];
}
function coilPts(ts, R) {
  const head = V(0.16, 1.63, 1.2), pts = [head, V(0.42, 1.48, 1.35), V(0.45, 1.3, 0.85)];
  const turns = 2.0, n = 22;
  for (let i = 0; i <= n; i++) { const k = i / n, a = 0.3 + k * turns * Math.PI * 2, rr = R * (1 + 0.15 * k); pts.push(V(HP.x + Math.sin(a) * rr, 1.22 - k * 1.0, HP.z + Math.cos(a) * rr * 0.8)); }
  pts.push(V(-0.6, 0.06, 0.2), V(-1.2, 0.0, -1.3), V(-1.9, -0.05, -2.4), V(-3.3, -0.06, -3.2), V(-4.8, -0.06, -3.4), V(-6.0, -0.06, -4.2));
  return pts;
}
const SW_HEAD = V(-2.25, 0.24, 0.6);
function swallowPts(ts) {
  const w = Math.sin(ts * 1.3) * 0.04;
  return [SW_HEAD.clone(), V(-2.55, 0.24, 0.6), V(-3.3, 0.24, 0.6 + w), V(-4.2, 0.22, 0.57), V(-5.2, 0.18, 0.35), V(-6.1, 0.13, -0.3), V(-6.9, 0.08, -1.1), V(-7.6, 0.02, -2.0), V(-8.2, -0.04, -2.9)];
}
function frontPts(t) {
  const reach = smooth(range(t, 28.5, 29.3)) * (1 - smooth(range(t, 30.9, 31.6)));
  const wob = Math.sin(t * 13) * 0.035 * smooth(range(t, 29.3, 29.6)) * (1 - smooth(range(t, 30.6, 30.9)));
  const away = smooth(range(t, 31.0, 31.9));
  const head = lerpV(lerpV(V(0.95, 1.55, 0.95), V(0.45 + wob, 1.66, 0.72), reach), V(1.6, 0.35, 0.2), away);
  return [head, lerpV(V(1.25, 1.4, 1.0), V(1.9, 0.25, 0.4), away), V(1.4, 0.8, 0.8), V(1.6, 0.06, 0.4), V(1.7, 0.04, -0.6), V(0.9, 0.0, -1.6), V(-0.4, -0.05, -2.4), V(-1.8, -0.06, -3.0), V(-3.3, -0.06, -3.5), V(-4.7, -0.06, -4.2)];
}
function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 7, sunDir: [-3, 9, 4], sun: 2.0 });
  const u = scene.userData.sky.material.uniforms;
  u.top.value.set(0x4f8a74); u.mid.value.set(0x8fbca2); u.horizon.value.set(0xcfe0cf); u.floorC.value.set(0x55663a);
  scene.fog = new THREE.FogExp2(0x9fbba6, 0.035);
  const key = scene.userData.key; key.color.set(0xfff2d6);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xd9f0dc); hemi.groundColor.set(0x4f5a30); hemi.intensity = 0.9;
  scene.add(world(['#5f5532', ['92,84,48', '78,92,44', '110,96,60']]));
  scene.add(grass(1800, [-10, -1.0, 8, 1.3], [[-0.6, 0.0, 0.6, 1.2]]));
  // murky river behind the bank
  const wc = document.createElement('canvas'); wc.width = wc.height = 256; const wg = wc.getContext('2d'); wg.fillStyle = '#4c6a45'; wg.fillRect(0, 0, 256, 256); const r = rng(3);
  for (let i = 0; i < 120; i++) { wg.strokeStyle = `rgba(200,230,200,${0.08 + r() * 0.15})`; wg.lineWidth = 1 + r() * 2; wg.beginPath(); const x = r() * 256, y = r() * 256; wg.moveTo(x, y); wg.lineTo(x + 10 + r() * 30, y + (r() - 0.5) * 3); wg.stroke(); }
  const wt = new THREE.CanvasTexture(wc); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(10, 6); wt.colorSpace = THREE.SRGBColorSpace;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshStandardMaterial({ color: 0xffffff, map: wt, roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.86 }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, 0.03, -20.5); water.receiveShadow = true; scene.add(water);
  const mud = new THREE.Mesh(new THREE.PlaneGeometry(80, 1.2), new THREE.MeshStandardMaterial({ color: 0x4a3c26, roughness: 0.6 })); mud.rotation.x = -Math.PI / 2; mud.position.set(0, 0.01, -0.3); scene.add(mud);
  // jungle
  [[-6, -9], [-2.5, -11], [3, -8.5], [6.5, -12], [-9, -6], [9, -7], [-4.5, 4.5], [4.8, 4.0], [-8, 2.2], [7.5, 2.5], [0.5, -14], [-12, -2]].forEach(([x, z], i) => { const tr = jungleTree(6 + (i % 3) * 1.5, i + 1); tr.position.set(x, 0, z); scene.add(tr); });
  [[-3.5, 0.6], [3.4, 0.4], [-5.2, 0.2], [4.6, -0.1], [-4.6, 1.2], [5.5, 1.5], [-6.5, -0.4], [2.6, -0.5]].forEach(([x, z], i) => { const f = fern(0.9 + (i % 3) * 0.25, i + 3); f.position.set(x, 0, z); scene.add(f); });
  [[-1.7, -0.25, 0.6], [1.9, -0.15, 0.5], [2.8, 0.3, 0.4]].forEach(([x, z, s], i) => { const k = rock(s, 20 + i, 0x6f6a58); k.position.set(x, 0, z); scene.add(k); });

  // hero (explorer)
  const hero = makeHuman('casual', { shirt: 0xb89a5a, jeans: 0x4a5a6a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const clip = new THREE.Plane(V(1, 0, 0), 1000);
  hero.root.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.clippingPlanes = [clip]; } });
  const S = snake(150, 14, 8); scene.add(S);
  // props / fx
  const heart = heartSprite(); scene.add(heart);
  const fang = iconBubble(iconTex('fang')); scene.add(fang);
  const o2 = iconBubble(iconTex('o2')); scene.add(o2);
  const acid = []; for (let i = 0; i < 26; i++) { const s = glowSprite(0x9dff4a, 0.25); s.userData.ph = i / 26; scene.add(s); acid.push(s); }
  const acidGlow = glowSprite(0x7dff3a, 3.0); scene.add(acidGlow);
  const fx = { splash: burst(0xcfe8d0, 80, 1), bite: burst(0xffffff, 40, 2), sq: [burst(0xff7a50, 30, 3), burst(0xff7a50, 30, 4), burst(0xff7a50, 30, 5), burst(0xff7a50, 30, 6)], gulp: burst(0xffffff, 50, 7), wide: burst(0xffe14d, 80, 8) };
  for (const v of Object.values(fx)) (Array.isArray(v) ? v : [v]).forEach(f => scene.add(f));
  const shoulderBar = barSprite('#ffd23f', 'SHOULDERS'), jawBar = barSprite('#ff4a4a', 'JAWS'); scene.add(shoulderBar, jawBar);
  const toowide = stamp('TOO WIDE!', '#ffd23f', 0.62); scene.add(toowide);
  const rew = stamp('◀◀ REWIND', '#ffffff', 0.5); rew.material.rotation = 0; scene.add(rew);
  const card = infoCard(); scene.add(card);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // scene time: real time, except the rewind (26.17 -> 27.0 scrubs back to 3.0)
      const front = t >= 27.0;
      const ts = t < 26.17 ? t : !front ? lerp(26.17, 3.0, easeInOut(range(t, 26.17, 27.0))) : 3.0;
      wt.offset.x = -ts * 0.02;
      // ================= HERO =================
      const collapse = front ? 0 : smooth(range(ts, 13.0, 13.75));
      const slide = front ? 0 : easeInOut(range(ts, 15.6, 18.6));
      const coilK = front ? 0 : smooth(range(ts, 6.1, 7.3)) * (1 - smooth(range(ts, 13.0, 13.8)));
      const breaths = [7.5, 8.6, 10.0, 10.9].filter(b => ts > b).length;
      const pulse = [7.5, 8.6, 10.0, 10.9].reduce((m, b) => Math.max(m, Math.exp(-Math.abs(ts - b - 0.1) * 6)), 0) * coilK;
      hero.root.position.copy(HP); hero.root.rotation.set(0, 0, 0);
      let pose;
      if (front) {
        const fear = smooth(range(t, 27.6, 28.2)), relief = smooth(range(t, 31.0, 31.5));
        pose = over(STAND(t), { lSh: [lerp(-1.2, 0.05, relief) * fear, 0, 0.4], rSh: [lerp(-1.2, 0.05, relief) * fear, 0, -0.4], lEl: [-1.4 * fear * (1 - relief), 0, 0], rEl: [-1.4 * fear * (1 - relief), 0, 0], spine: [-0.15 * fear * (1 - relief), 0, 0], neck: [-0.1 * fear, 0, 0], chest: [-0.08 * relief + Math.sin(t * 3) * 0.02 * relief, 0, 0] });
        hero.setMouth(0.4 * fear * (1 - relief));
      } else {
        const turn = smooth(range(ts, 2.6, 3.2)), flinch = smooth(range(ts, 4.65, 4.8)) * (1 - smooth(range(ts, 5.8, 6.2)));
        pose = over(STAND(ts), { neck: [0.25 * (1 - turn) - 0.05, lerp(0, -0.9, turn) * (1 - coilK), 0], spine: [0, 0, -0.15 * flinch], lSh: [-0.5 * flinch, 0, 0.16 + 0.3 * flinch], rSh: [-1.2 * flinch, 0, -0.16], rEl: [-1.4 * flinch, 0, 0] });
        if (coilK > 0) {
          const sq = Math.min(1, breaths / 4);
          pose = over(pose, { lSh: [0.05, 0, lerp(0.16, 0.03, coilK)], rSh: [0.05, 0, lerp(-0.16, -0.03, coilK)], lEl: [-0.1, 0, 0], rEl: [-0.1, 0, 0], chest: [-0.05 * pulse, 0, 0], neck: [-0.15 * coilK - 0.1 * pulse, Math.sin(ts * 7) * 0.08 * coilK, 0], spine: [0, 0, Math.sin(ts * 5) * 0.03 * coilK] });
          hero.setMouth(coilK * (0.25 + 0.45 * pulse + 0.2 * sq));
        } else hero.setMouth(0.4 * flinch + 0.25 * smooth(range(ts, 2.9, 3.2)) * (1 - smooth(range(ts, 3.6, 4))));
        if (collapse > 0) {
          hero.root.rotation.z = collapse * Math.PI / 2; hero.root.position.y = 0.22 * collapse; hero.root.position.x = HP.x - 2.0 * slide;
          pose = over(pose, { neck: [0.2, 0, 0.2 * collapse], lSh: [-0.3 * collapse, 0, 0.1], rSh: [-0.2 * collapse, 0, -0.1], lHip: [-0.3 * collapse, 0, 0.1], lKn: [0.5 * collapse, 0, 0], rHip: [-0.15 * collapse, 0, -0.07], rKn: [0.3 * collapse, 0, 0] });
          hero.setMouth(0.15);
        }
      }
      hero.setPose(pose);
      // clip whatever is inside the snake's mouth while it swallows; show all again in x-ray
      clip.constant = !front && ts > 15.0 && ts < 19.13 ? 2.0 : 1000;
      hero.root.visible = front || ts < 19.13 || true;
      // ================= SNAKE =================
      let pts, jaw = 0, hs = 1.25, tongue = 0, op = 1;
      const R = 0.42 - 0.022 * breaths - 0.012 * pulse;
      if (front) {
        const k = smooth(range(t, 27.0, 28.2));
        const a = emergePts(3.0), b = frontPts(t);
        const ca = curve(a), cb = curve(b);
        pts = (s) => ca.getPointAt(s).lerp(cb.getPointAt(s), k);
        jaw = smooth(range(t, 28.3, 28.7)) * (1 - smooth(range(t, 30.9, 31.3))) * (0.85 + 0.15 * Math.sin(t * 9)); hs = 1.25 + 0.3 * jaw;
        tongue = (1 - jaw) * Math.max(0, Math.sin(t * 6));
      } else if (ts < 13.0) {
        const ce = curve(emergePts(ts)), cc = coilK > 0 ? curve(coilPts(ts, R)) : null;
        const wig = (s) => s > 0.2 ? Math.sin(s * 14 - ts * 2.5) * 0.12 * (1 - coilK) : 0;
        pts = (s) => { const p = ce.getPointAt(s); p.x += wig(s); return cc ? p.lerp(cc.getPointAt(s), coilK) : p; };
        tongue = Math.max(0, Math.sin(ts * 5)) * (ts > 1.5 ? 1 : 0); jaw = smooth(range(ts, 4.5, 4.65)) * (1 - smooth(range(ts, 4.72, 4.85))) * 0.6;
      } else {
        const k = smooth(range(ts, 13.0, 13.9));
        const cc = curve(coilPts(ts, R)), cs = curve(swallowPts(ts));
        pts = (s) => cc.getPointAt(s).lerp(cs.getPointAt(s), k);
        jaw = smooth(range(ts, 13.8, 15.0)) * (1 - smooth(range(ts, 18.6, 19.1)));
        hs = 1.25 + 0.6 * jaw + 0.25 * smooth(range(ts, 15.0, 18.6)) * (1 - smooth(range(ts, 18.6, 19.1)));
        op = lerp(1, 0.32, smooth(range(ts, 19.13, 19.6)));
      }
      // radius: tapered tail, slim neck, bulge where the hero is inside
      const inside = front ? 0 : ts > 15.0 ? clamp(2.0 * slide + 0.15, 0, 1.95) : 0;
      const bodyLen = 9.0;
      const rad = (s) => {
        let r0 = 0.135 * (s < 0.03 ? 0.75 + s / 0.03 * 0.25 : 1) * (s > 0.7 ? 1 - (s - 0.7) / 0.3 * 0.85 : 1);
        const d = s * bodyLen;
        if (inside > 0) { const b = smooth(clamp((inside + 0.15 - d) / 0.3)) * smooth(clamp(d / 0.12)); r0 = Math.max(r0, 0.31 * b + r0 * (1 - b)); }
        return r0;
      };
      const H = S.update(pts, rad, { jaw, headScale: hs, tongue, opacity: op });
      // ================= FX =================
      fx.splash.position.set(-1.15, 0.05, -1.65); fx.splash.update(ts - 0.75);
      fx.bite.position.set(-0.32, 1.38, 0.45); fx.bite.update(ts - 4.72);
      [7.5, 8.6, 10.0, 10.9].forEach((b, i) => { fx.sq[i].position.set(HP.x + (i % 2 ? 0.3 : -0.3), 0.9 + i * 0.05, HP.z + 0.3); fx.sq[i].update(ts - b - 0.05); });
      // fang badge (not the bite)
      fang.position.set(0.55, 2.0, 0.6); fang.set(front ? 0 : 0.55 * easeOut(range(ts, 4.71, 4.95)) * (1 - smooth(range(ts, 5.9, 6.2))), smooth(range(ts, 5.22, 5.38)));
      // x-ray heart on the chest: beats, slows, stops
      const hk = front ? 0 : smooth(range(ts, 11.15, 11.4)) * (1 - smooth(range(ts, 13.0, 13.3)));
      if (hk > 0) {
        scene.updateMatrixWorld(true);
        heart.position.copy(hero.j.chest.localToWorld(V(0.06, 0.2, 0.25)));
        const rate = ts < 12.19 ? 1.6 : lerp(1.6, 0.2, smooth(range(ts, 12.19, 12.8))), beat = Math.pow(Math.max(0, Math.sin(ts * rate * Math.PI * 2)), 6) * (ts < 12.8 ? 1 : 0);
        heart.scale.setScalar(0.22 * hk * (1 + 0.25 * beat)); heart.material.opacity = hk; heart.material.color.setRGB(1, lerp(1, 0.55, smooth(range(ts, 12.3, 12.9))), lerp(1, 0.6, smooth(range(ts, 12.3, 12.9))));
      }
      heart.visible = hk > 0.01;
      // inside: no air + acid
      o2.position.set(-3.0, 1.05, 0.6); o2.set(front ? 0 : 0.45 * easeOut(range(ts, 20.0, 20.25)) * (1 - smooth(range(ts, 21.0, 21.3))), smooth(range(ts, 20.4, 20.55)));
      const ak = front ? 0 : smooth(range(ts, 21.1, 21.6)) * (1 - smooth(range(ts, 25.9, 26.3)));
      acid.forEach((s, i) => { const u = (ts * 0.25 + s.userData.ph) % 1; s.position.set(-2.3 - s.userData.ph * 1.8, 0.1 + u * 0.38, 0.6 + Math.sin(i * 2.3 + ts) * 0.18); s.material.opacity = ak * Math.sin(u * Math.PI) * 0.8; s.scale.setScalar(0.12 + 0.1 * Math.sin(i)); });
      acidGlow.position.set(-3.1, 0.25, 0.62); acidGlow.material.opacity = 0.45 * ak; acidGlow.scale.set(2.6, 0.9, 1);
      fx.gulp.position.copy(SW_HEAD).add(V(0.3, 0.1, 0)); fx.gulp.update(ts - 18.62);
      // shoulders vs jaws
      const bk = front ? smooth(range(t, 29.5, 29.8)) * (1 - smooth(range(t, 31.2, 31.5))) : 0;
      shoulderBar.position.set(0, 1.4, 0.95); shoulderBar.scale.set(0.62 * bk, 0.155 * bk, 1); shoulderBar.material.opacity = bk; shoulderBar.visible = bk > 0.01;
      jawBar.position.set(0.5, 1.98, 0.8); jawBar.scale.set(0.34 * bk, 0.085 * bk, 1); jawBar.material.opacity = bk; jawBar.visible = bk > 0.01;
      fx.wide.position.set(0, 1.5, 1.0); fx.wide.update(t - 30.5);
      // ---------- camera ----------
      let cp, lk;
      if (!front) [cp, lk] = track(ts);
      else { const [a, b] = track(3.0), k = smooth(range(t, 27.0, 28.1)); cp = a.lerp(FRONTCAM[0], k); lk = b.lerp(FRONTCAM[1], k); }
      const sh = shake(t, coilK > 0 ? 1.0 + pulse * 2 : 0.6, 4);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-3, 9, 4));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion);
      toowide.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.12); toowide.set(t > 30.5 ? easeOut(range(t, 30.5, 30.66)) * (1 - smooth(range(t, 31.6, 31.9))) : 0);
      rew.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.12); const rk = t > 26.17 && t < 27.15 ? 1 : 0; rew.set(rk * (0.9 + 0.1 * (Math.floor(t * 8) % 2))); if (rk) rew.scale.set(0.5, 0.147, 1);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 3.25, 'WHAT IF', 'SWALLOWED?', '#ffffff', 'by a green anaconda'],
        [3.37, 6.0, 'STEP 1', 'NOT THE BITE', '#ff6b5b', "the bite doesn't kill"],
        [6.13, 11.29, 'STEP 2', 'SQUEEZE', '#ffd166', 'tighter every breath out'], [11.29, 13.0, 'STEP 2', 'NO BLOOD FLOW', '#ff4a4a', 'the heart stops'],
        [13.27, 16.53, 'STEP 3', 'JAWS STRETCH', '#ff9a5a', ''], [16.53, 19.0, 'STEP 3', 'HEADFIRST', '#ff9a5a', 'inch by inch'],
        [19.13, 21.13, 'INSIDE', 'NO AIR', '#7fd3ff', ''], [21.13, 24.35, 'INSIDE', 'ACID', '#9dff4a', 'starts to work'], [24.35, 26.0, 'INSIDE', 'WEEKS', '#ffffff', 'to digest'],
        [27.4, 29.4, 'LUCKILY', 'ALMOST NEVER', '#9ad46a', 'eats humans'], [29.49, 31.9, 'WHY?', 'SHOULDERS', '#ffd23f', 'too wide to swallow'],
      ];
      const cur = CARDS.find(([a, b]) => t >= a && t < b); let ck = 0;
      if (cur) { card.set(cur[2], cur[3], cur[4], null, cur[5]); const grp = CARDS.filter(x => x[2] === cur[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk = 1 + 0.09 * Math.exp(-(t - cur[0]) * 9); card.scale.set(0.72 * pk, 0.281 * pk, 1); }
      card.material.opacity = ck; card.visible = false;
      const fd = cp.distanceTo(lk);
      const rewind = t > 26.17 && t < 27.0 ? 1 : 0;
      return { dof: { focus: fd, aperture: fd < 6 ? 0.0012 : 0.0005, maxblur: 0.005 }, bloom: 0.45 + rewind * 0.4, exposure: 1.0 + rewind * 0.15 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
