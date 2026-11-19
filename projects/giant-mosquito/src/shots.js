import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { infoCard, burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { world, grass, tree, stamp, iconBubble } from './ancient.js';

export const DURATION = 25.4;
export const CAPTIONS = [
  [0.0, 'What if a mosquito'], [1.13, 'was as big as a human?'],
  [3.04, 'Its wings would beat'], [4.01, 'hundreds of times per second'], [6.09, 'as loud as a helicopter'],
  [8.08, 'Its needle-like mouth'], [9.44, 'called a proboscis'], [10.74, 'would be as long as your arm'],
  [12.76, 'And one bite'], [13.65, 'could suck out liters of blood'], [15.29, 'in seconds!'],
  [16.66, 'Luckily'], [17.49, 'that could never happen'], [19.13, 'Insects breathe through tiny tubes'], [21.32, 'and at that size'], [22.37, "they couldn't get enough oxygen", 25.2],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function makeMosquito() {
  const g = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.5 }), stripeT = canvasTex(64, 256, (x) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#a8a8ae' : '#24242a'; x.fillRect(0, i * 32, 64, 32); } });
  const abdM = new THREE.MeshStandardMaterial({ map: stripeT, roughness: 0.5, emissive: 0x000000 });
  const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), dark); thorax.scale.set(1, 1.1, 1.3); g.add(thorax);
  const abd = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.85, 8, 16), abdM); abd.rotation.x = Math.PI / 2 + 0.35; abd.position.set(0, -0.15, -0.62); g.add(abd);
  const head = new THREE.Group(); head.position.set(0, 0.05, 0.32); g.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), dark));
  for (const x of [-0.08, 0.08]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), new THREE.MeshStandardMaterial({ color: 0x9a1a1a, roughness: 0.25, metalness: 0.2 })); e.position.set(x, 0.03, 0.04); head.add(e); const an = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.4, 5), dark); an.position.set(x * 0.6, 0.15, 0.15); an.rotation.x = -0.9; an.rotation.z = x * 3; head.add(an); }
  const prob = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.004, 0.65, 8), dark); prob.rotation.x = Math.PI / 2 - 0.5; prob.position.set(0, -0.15, 0.3); head.add(prob);
  const legs = []; for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1, k = Math.floor(i / 2); const L = new THREE.Group(); L.position.set(s * 0.12, -0.08, 0.12 - k * 0.14); g.add(L); const up = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.008, 0.7, 5), dark); up.position.set(s * 0.25, 0.1, 0); up.rotation.z = s * 1.0; L.add(up); const lo = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.004, 0.9, 5), dark); lo.position.set(s * 0.58, -0.25, 0); lo.rotation.z = -s * 0.35; L.add(lo); legs.push(L); }
  const wingM = new THREE.MeshStandardMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.35, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false });
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * 0.1, 0.18, 0); g.add(w); const m = new THREE.Mesh(new THREE.CircleGeometry(0.45, 24), wingM); m.scale.set(1, 0.32, 1); m.position.set(s * 0.45, 0, -0.1); m.rotation.x = -Math.PI / 2; w.add(m); return w; });
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.update = (t, flap = 1, fill = 0) => { wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * Math.sin(t * 90) * 0.7 * flap; }); legs.forEach((L, i) => L.rotation.x = Math.sin(t * 2 + i) * 0.1); abd.scale.set(1 + fill * 0.8, 1 + fill * 0.2, 1 + fill * 0.8); abdM.emissive.setRGB(0.45 * fill, 0, 0.02 * fill); abdM.color.setRGB(1, 1 - 0.6 * fill, 1 - 0.6 * fill); };
  g.prob = prob; g.abd = abd;
  return g;
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-4, 7, 4], sun: 2.0 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x3a4a8a); u.mid.value.set(0xc08a8a); u.horizon.value.set(0xffc27a); u.floorC.value.set(0x6a8a4a);
  scene.fog = new THREE.Fog(0xe8b890, 30, 120);
  const key = scene.userData.key; key.color.set(0xffc890);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xffe0c0); hemi.intensity = 0.8;
  scene.add(world(['#6a9a4a', ['96,140,64', '110,152,72', '84,126,58']]));
  scene.add(grass(2000, [-10, -8, 10, 8], []));
  // backyard: fence, house wall, garden chair, string lights
  const fm = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.8 });
  for (let i = 0; i < 24; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.3, 0.06), fm); p.position.set(-7 + i * 0.6, 0.65, -4); p.castShadow = true; scene.add(p); }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.08, 0.06), fm); rail.position.set(0, 0.95, -3.96); scene.add(rail);
  const houseW = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 0.3), new THREE.MeshStandardMaterial({ color: 0xc8a888, roughness: 0.9 })); houseW.position.set(4, 2, -6.5); scene.add(houseW);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.0), new THREE.MeshBasicMaterial({ color: 0xffd890, toneMapped: false })); win.position.set(3, 2.2, -6.34); scene.add(win);
  [[-5, -6], [-8, -2], [7, -2.5]].forEach(([x, z], i) => { const tr = tree({ h: 3.4, seed: i + 9, col: 0x4f7a3a }); tr.position.set(x, 0, z); scene.add(tr); });
  const bulbs = []; for (let i = 0; i < 12; i++) { const b = glowSprite(0xffd890, 0.25); b.position.set(-3 + i * 0.6, 2.6 - Math.sin(i / 11 * Math.PI) * 0.4, -3.5); scene.add(b); bulbs.push(b); }
  const chair = new THREE.Group(); chair.position.set(-1.0, 0, 0.2); scene.add(chair);
  const cm = new THREE.MeshStandardMaterial({ color: 0x2a6f9a }); const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.6), cm); seat.position.y = 0.45; chair.add(seat); const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.06), cm); back.position.set(0, 0.75, -0.3); chair.add(back);
  const hero = makeHuman('casual', { shirt: 0xffffff, jeans: 0x34507a, chestText: 'MR. CLOUD', chestAlpha: 0.7 }); scene.add(hero.root);
  hero.root.traverse(o => { if (o.isMesh && o.material.map && o.material.map.image && o.material.map.image.width === 1024) { const cv = o.material.map.image, gx = cv.getContext('2d'); gx.clearRect(0, 0, 1024, 256); gx.font = "400 136px Brand, sans-serif"; gx.textAlign = 'center'; gx.textBaseline = 'middle'; gx.fillStyle = 'rgba(60,70,90,0.45)'; gx.fillText('MR. CLOUD', 512, 134); o.material.map.needsUpdate = true; } });
  const mos = makeMosquito(); mos.scale.setScalar(1.25); scene.add(mos);
  // hud
  const heli = iconBubble(canvasTex(512, 512, (g) => { g.fillStyle = '#2b3a5a'; g.beginPath(); g.ellipse(230, 290, 130, 80, 0, 0, 7); g.fill(); g.fillRect(330, 270, 140, 24); g.fillRect(90, 180, 330, 16); g.fillRect(245, 196, 14, 30); g.fillStyle = '#8fd3ff'; g.beginPath(); g.ellipse(170, 275, 50, 40, 0, 0, 7); g.fill(); g.fillRect(150, 380, 200, 14); })); heli.renderOrder = 30; scene.add(heli);
  const hz = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(768, 220, (g) => { g.fillStyle = 'rgba(20,20,30,0.72)'; g.beginPath(); g.roundRect(6, 6, 756, 208, 36); g.fill(); g.font = "400 100px Brand, sans-serif"; g.fillStyle = '#ffd23f'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('500 BEATS/SEC', 384, 116); }), transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); hz.renderOrder = 31; scene.add(hz);
  const ruler = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(512, 128, (g) => { g.strokeStyle = '#ffd23f'; g.fillStyle = '#ffd23f'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(20, 64); g.lineTo(492, 64); g.stroke(); for (const x of [20, 492]) { g.beginPath(); g.moveTo(x, 30); g.lineTo(x, 98); g.stroke(); } g.font = "400 44px Brand, sans-serif"; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 6; g.strokeText('= ARM', 256, 36); g.fillText('= ARM', 256, 36); }), transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); ruler.renderOrder = 31; scene.add(ruler);
  const gauge = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); gauge.renderOrder = 31; scene.add(gauge);
  const gc = document.createElement('canvas'); gc.width = 300; gc.height = 520; const gg = gc.getContext('2d'); const gtex = new THREE.CanvasTexture(gc); gtex.colorSpace = THREE.SRGBColorSpace; gauge.material.map = gtex;
  const drawG = (l) => { gg.clearRect(0, 0, 300, 520); gg.fillStyle = 'rgba(20,10,10,0.7)'; gg.beginPath(); gg.roundRect(6, 6, 288, 508, 36); gg.fill(); gg.fillStyle = 'rgba(255,255,255,0.2)'; gg.beginPath(); gg.roundRect(90, 60, 120, 360, 20); gg.fill(); gg.fillStyle = '#c0182a'; const h = 360 * l / 3; gg.beginPath(); gg.roundRect(90, 420 - h, 120, h, 20); gg.fill(); gg.font = "400 64px Brand, sans-serif"; gg.fillStyle = '#fff'; gg.textAlign = 'center'; gg.fillText(`${l.toFixed(1)} L`, 150, 480); gtex.needsUpdate = true; };
  // trachea x-ray
  const trach = []; for (let i = 0; i < 8; i++) { const pts = []; for (let k = 0; k <= 8; k++) pts.push(V(Math.sin(k * 0.8 + i) * 0.08 + (i % 2 ? 0.08 : -0.08), -0.05 - k * 0.07, -0.3 - k * 0.09 + i * 0.03)); const tb = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.012, 6), new THREE.MeshBasicMaterial({ color: 0x5ab8ff, transparent: true, opacity: 0, toneMapped: false, depthTest: false })); tb.renderOrder = 20; mos.add(tb); trach.push(tb); }
  const o2 = []; for (let i = 0; i < 16; i++) { const s = glowSprite(0x8fd3ff, 0.06); s.userData.ph = i / 16; scene.add(s); o2.push(s); }
  const fx = { buzz: burst(0xffffff, 40, 1), shrink: burst(0xffd23f, 80, 2) };
  Object.values(fx).forEach(f => scene.add(f));
  const imp = stamp('IMPOSSIBLE!', '#5be37d', 0.6); scene.add(imp);
  const card = infoCard(); scene.add(card);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // ---------- mosquito ----------
      const shrink = smooth(range(t, 22.4, 23.6));
      const hover = V(1.0 + Math.sin(t * 1.3) * 0.12, 1.85 + Math.sin(t * 2.1) * 0.08, -0.4);
      let mp = hover.clone();
      if (t > 12.6 && t < 16.4) mp = hover.clone().lerp(V(0.55, 1.6, 0.05), smooth(range(t, 12.6, 13.4)) * (1 - smooth(range(t, 15.8, 16.4))));
      if (shrink > 0) mp.lerp(V(2.6, 2.6, -1.2), shrink);
      mos.position.copy(mp); mos.rotation.set(0, -2.5 + Math.sin(t * 0.9) * 0.12, 0); mos.scale.setScalar(Math.max(0.02, 1.25 * (1 - shrink * 0.97)));
      const fill = smooth(range(t, 13.7, 15.6)) * (1 - smooth(range(t, 16.6, 17.5)));
      mos.update(t, 1, fill);
      const xr = smooth(range(t, 19.1, 19.5)) * (1 - smooth(range(t, 22.3, 22.6)));
      trach.forEach(tb => tb.material.opacity = 0.85 * xr);
      // ---------- hero ----------
      hero.root.position.set(-0.4, 0, 0.6); hero.root.rotation.y = 0.5;
      const ears = smooth(range(t, 3.2, 3.5)) * (1 - smooth(range(t, 7.8, 8.1))), duck = smooth(range(t, 12.8, 13.2)) * (1 - smooth(range(t, 16.4, 16.8)));
      let pose = over(STAND(t), { neck: [-0.25, 0.35, 0] });
      if (t < 3) pose = over(pose, { lSh: [-0.5, 0, 0.5], rSh: [-0.5, 0, -0.5], lEl: [-1.2, 0, 0], rEl: [-1.2, 0, 0] });
      if (ears > 0) pose = over(pose, { lSh: [-2.0 * ears, 0.6, 0.6], rSh: [-2.0 * ears, -0.6, -0.6], lEl: [-2.2 * ears, 0, 0], rEl: [-2.2 * ears, 0, 0], neck: [0.1, 0.2, 0] });
      if (t > 10.6 && t < 12.6) pose = over(pose, { lSh: [-1.6, 0, 0.1], lEl: [-0.05, 0, 0] });   // holds out his arm to compare
      if (duck > 0) pose = over(pose, { spine: [-0.25 * duck, 0, -0.2 * duck], neck: [-0.15, 0.6, 0], rSh: [-1.0 * duck, 0, -0.6], rEl: [-1.6 * duck, 0, 0], lSh: [-1.0 * duck, 0, 0.6], lEl: [-1.6 * duck, 0, 0] });
      if (t > 23.3) pose = over(STAND(t), { rSh: [-1.2, 0, -0.3], rEl: [-0.4, 0, 0], neck: [-0.2, 0.6, 0] });
      hero.setPose(pose); hero.setMouth(0.15 + 0.35 * ears + 0.4 * duck);
      hero.M.skin.color.set(0xd99b7a).lerp(new THREE.Color(0xe8d8d0), 0.6 * fill);
      scene.updateMatrixWorld(true);
      // oxygen dots fail to reach the middle of the body
      o2.forEach((s, i) => { const u2 = (t * 0.6 + s.userData.ph) % 1; const p0 = mos.localToWorld(V((i % 2 ? 0.2 : -0.2), -0.1, -0.3 - (i % 4) * 0.12)); s.position.copy(p0).add(V(0, 0, 0)); s.material.opacity = xr * (1 - u2) * (u2 < 0.4 ? 1 : 0.2); s.scale.setScalar(0.08); });
      fx.shrink.position.copy(hover); fx.shrink.update(t - 22.5);
      bulbs.forEach((b, i) => b.material.opacity = 0.7 + 0.3 * Math.sin(t * 2 + i));
      // ---------- camera ----------
      const KEYS = [[0, [0.9, 2.0, 6.8], [0.2, 1.4, 0]], [2.9, [0.7, 1.9, 6.2], [0.2, 1.45, 0]], [8.0, [0.8, 2.0, 6.0], [0.3, 1.5, 0]], [9.0, [1.6, 2.0, 5.0], [0.6, 1.5, -0.1]], [12.6, [1.4, 1.9, 5.2], [0.4, 1.4, 0.1]], [16.6, [0.9, 1.9, 5.8], [0.3, 1.4, 0]], [19.0, [2.2, 2.0, 4.4], [0.8, 1.6, -0.3]], [22.3, [2.2, 2.0, 4.6], [0.8, 1.6, -0.3]], [23.6, [0.9, 1.9, 6.0], [0.4, 1.4, 0]], [25.4, [0.8, 1.9, 5.8], [0.3, 1.3, 0]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const sh = shake(t, 0.6 + 2.5 * ears, 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-4, 7, 4));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const hk = smooth(range(t, 4.0, 4.3)) * (1 - smooth(range(t, 6.0, 6.3)));
      hz.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.22); hz.scale.set(0.6 * hk, 0.172 * hk, 1); hz.material.opacity = hk; hz.visible = hk > 0.01;
      heli.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.2).addScaledVector(rt, 0.18); heli.set(0.17 * easeOut(range(t, 6.6, 6.85)) * (1 - smooth(range(t, 7.8, 8.1))), 0);
      const rk = smooth(range(t, 10.8, 11.1)) * (1 - smooth(range(t, 12.4, 12.7)));
      ruler.position.copy(mos.prob.localToWorld(V(0, 0, 0))).add(V(0, 0.15, 0)); ruler.scale.set(0.8 * rk, 0.2 * rk, 1); ruler.material.opacity = rk; ruler.visible = rk > 0.01;
      const gk = smooth(range(t, 13.6, 13.9)) * (1 - smooth(range(t, 16.4, 16.7)));
      drawG(lerp(0, 2.5, smooth(range(t, 14.0, 15.6)))); gauge.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.12).addScaledVector(rt, -0.24); gauge.scale.set(0.14 * gk, 0.243 * gk, 1); gauge.material.opacity = gk; gauge.visible = gk > 0.01;
      imp.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.1); imp.set(t > 17.5 ? easeOut(range(t, 17.5, 17.66)) * (1 - smooth(range(t, 18.8, 19.1))) : 0);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 2.9, 'WHAT IF', 'GIANT MOSQUITO?', '#ff6b5b', 'as big as you'],
        [3.04, 6.09, 'WINGS', '500×/SEC', '#ffd23f', ''], [6.09, 8.0, 'WINGS', 'HELICOPTER LOUD', '#ffd23f', ''],
        [8.08, 12.7, 'PROBOSCIS', 'ARM-LENGTH', '#ff9a5a', 'needle-like mouth'],
        [12.76, 16.5, 'ONE BITE', 'LITERS OF BLOOD', '#ff2a2a', 'in seconds'],
        [16.66, 19.13, 'LUCKILY', 'IMPOSSIBLE', '#5be37d', ''], [19.13, 25.4, 'WHY?', 'NOT ENOUGH O₂', '#8fd3ff', 'insects breathe through tubes'],
      ];
      const cu = CARDS.find(([a2, b]) => t >= a2 && t < b); let ck = 0;
      if (cu) { card.set(cu[2], cu[3], cu[4], null, cu[5]); const grp = CARDS.filter(x => x[2] === cu[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk = 1 + 0.09 * Math.exp(-(t - cu[0]) * 9); card.scale.set(0.72 * pk, 0.281 * pk, 1); }
      card.material.opacity = ck; card.visible = ck > 0.01;
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.5, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
