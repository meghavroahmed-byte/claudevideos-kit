import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { infoCard, burst } from './rare.js';
import { stamp } from './ancient.js';
import { bedroom, brainBubble, textSprite } from './room.js';

export const DURATION = 28.1;
export const CAPTIONS = [
  [0.0, "Why can't you"], [0.7, 'tickle yourself?'],
  [2.05, 'When someone else tickles you'], [3.85, "your brain can't predict"], [5.17, 'where their fingers will go next'], [7.25, 'That surprise'], [8.07, 'sets off your laugh'],
  [9.54, 'But when you try it yourself'], [11.31, 'a part of your brain'], [12.37, 'called the cerebellum'], [13.55, 'predicts every move'], [14.93, 'before it happens'],
  [16.29, 'It tells the rest of your brain'], [17.94, "relax, it's just me"], [19.78, 'So the tickle feeling'], [20.81, 'gets cancelled out'],
  [22.27, 'Fun fact'], [23.29, 'some people'], [24.1, 'with certain brain conditions'], [25.42, 'can actually tickle themselves!', 27.9],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const SIT = { drop: -0.47, lHip: [-1.5, 0, 0.12], lKn: [1.45, 0, 0], rHip: [-1.5, 0, -0.12], rKn: [1.45, 0, 0] };
const WALK = (p, a = 1) => { const s = Math.sin(p); return { lHip: [-0.4 * s * a, 0, 0.05], rHip: [0.4 * s * a, 0, -0.05], lKn: [(0.15 + 0.5 * Math.max(0, Math.sin(p + 1.3))) * a, 0, 0], rKn: [(0.15 + 0.5 * Math.max(0, Math.sin(p + 1.3 + Math.PI))) * a, 0, 0], lSh: [0.35 * s * a, 0, 0.15], rSh: [-0.35 * s * a, 0, -0.15], lEl: [-0.4, 0, 0], rEl: [-0.4, 0, 0], drop: -0.02 + Math.abs(Math.cos(p)) * 0.02 }; };
const over = (a, b) => Object.assign({}, a, b);
function meterHud() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 180; const g = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); s.renderOrder = 31; let last = -1;
  s.set = (v) => { const q = Math.round(v * 40); if (q === last) return; last = q; g.clearRect(0, 0, 512, 180); g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 16;
    g.font = "400 46px Brand, sans-serif"; g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('TICKLE', 32, 56);
    g.fillStyle = 'rgba(255,255,255,0.2)'; g.beginPath(); g.roundRect(32, 100, 448, 44, 22); g.fill(); g.fillStyle = v > 0.5 ? '#ff5fa2' : v > 0.15 ? '#ffd23f' : '#8a8a9a'; g.beginPath(); g.roundRect(32, 100, Math.max(22, 448 * v), 44, 22); g.fill();
    g.font = "400 46px Brand, sans-serif"; g.fillStyle = '#fff'; g.textAlign = 'right'; g.fillText(`${Math.round(v * 100)}%`, 480, 56); t.needsUpdate = true; };
  s.set(1); return s;
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 5, sunDir: [-2, 6, 3], sun: 1.6 });
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xfff4e0); hemi.groundColor.set(0x6a5040); hemi.intensity = 1.0;
  const key = scene.userData.key; key.position.set(-2, 6, 4);
  const room = bedroom(); scene.add(room);
  room.traverse(o => { if (o.isMesh && o.material.map && o.material.map.repeat.x === 4) o.material.color.set(0x9fe0d0); });
  room.userData.bed.visible = false;
  const ceil = new THREE.PointLight(0xfff0dc, 6, 9, 1.2); ceil.position.set(0, 2.9, 1.2); scene.add(ceil);
  // sofa
  const sofa = new THREE.Group(); sofa.position.set(0, 0, -0.75); scene.add(sofa);
  const sm = new THREE.MeshStandardMaterial({ color: 0xe76f51, roughness: 0.85 });
  const box = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), sm); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; sofa.add(m); };
  box(2.0, 0.42, 0.85, 0, 0.21, 0); box(2.0, 0.6, 0.22, 0, 0.62, -0.32); box(0.22, 0.55, 0.85, -1.1, 0.3, 0); box(0.22, 0.55, 0.85, 1.1, 0.3, 0);
  const hero = makeHuman('casual', { shirt: 0x2a9d8f, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root); hero.root.position.set(-0.25, 0, -0.62);
  const fr = makeHuman('casual', { shirt: 0xffb703, jeans: 0x2b2b30, skin: 0xc68642, hair: 0x111111, long: true, beard: false }); scene.add(fr.root);
  const ghost = makeHuman('casual', {}); scene.add(ghost.root);
  ghost.root.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ color: 0xc58aff, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }); o.castShadow = false; } });
  const brain = brainBubble(); scene.add(brain);
  const q = textSprite('?', '#ffd23f', "400 220px Brand, sans-serif"); scene.add(q);
  const speech = textSprite("it's just me", '#ffffff', "400 70px Brand, sans-serif"); scene.add(speech);
  const dots = []; for (let i = 0; i < 10; i++) { const s = glowSprite(0x8fd3ff, 0.06); scene.add(s); dots.push(s); }
  const hahas = [0, 1, 2].map(i => { const s = textSprite(i % 2 ? 'HA!' : 'HA HA', '#ff5fa2', "400 110px Brand, sans-serif"); scene.add(s); return s; });
  const meter = meterHud(); scene.add(meter);
  const fx = { cancel: burst(0x8a8a9a, 50, 1), fun: burst(0xc58aff, 80, 2) };
  Object.values(fx).forEach(f => scene.add(f));
  const cancel = stamp('CANCELLED', '#ff2a2a', 0.6); scene.add(cancel);
  const card = infoCard(); scene.add(card);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // ---------- friend tickles until 9.5, then walks off ----------
      const leave = range(t, 9.6, 11.2);
      const FR0 = V(0.6, 0, -0.05), FR1 = V(2.6, 0, 0.4);
      fr.root.position.copy(FR0.clone().lerp(FR1, easeInOut(leave))); fr.root.rotation.y = leave > 0 && leave < 1 ? Math.PI / 2 : -0.9;
      fr.setPose(leave > 0 && leave < 1 ? WALK(t * 7) : over(STAND(t, 2), { spine: [0.45, 0, 0], neck: [0.1, 0, 0] }));
      fr.setMouth(0.3 * Math.max(0, Math.sin(t * 6)) * (t < 9.5 ? 1 : 0));
      // ---------- hero ----------
      const tickled = t < 9.6 ? 1 : 0, self = smooth(range(t, 10.3, 10.9)) * (1 - smooth(range(t, 21.8, 22.4)));
      const laugh = tickled * (0.7 + 0.3 * Math.sin(t * 18));
      let pose = over(SIT, { spine: [0.15 * laugh + Math.sin(t * 14) * 0.05 * laugh, 0, Math.sin(t * 9) * 0.12 * laugh], neck: [-0.25 * laugh, Math.sin(t * 7) * 0.2 * laugh, 0], lSh: [-0.3, 0, 0.35 * laugh + 0.16], lEl: [-1.2 * laugh - 0.3, 0, 0], rSh: [-0.3, 0, -0.35 * laugh - 0.16], rEl: [-1.2 * laugh - 0.3, 0, 0], chest: [Math.sin(t * 16) * 0.05 * laugh, 0, 0] });
      if (self > 0) pose = over(pose, { spine: [0.05, 0, 0], neck: [0.25, 0, 0], lSh: [-0.15, 0, 0.1], rSh: [-0.15, 0, -0.1], lEl: [-1.9 * self, 0, 0], rEl: [-1.9 * self, 0, 0] });
      if (t > 22.3) pose = over(SIT, { neck: [0.05, 0.4, 0], lSh: [-0.4, 0, 0.2], lEl: [-0.8, 0, 0], rSh: [-0.4, 0, -0.2], rEl: [-0.8, 0, 0] });
      hero.setPose(pose); hero.setMouth(t < 9.6 ? 0.55 + 0.35 * Math.sin(t * 18) : t > 22.3 ? 0.15 : 0.05 + 0.1 * self * Math.max(0, Math.sin(t * 3)));
      scene.updateMatrixWorld(true);
      // friend's hands on his ribs (wiggling)
      if (t < 9.6) { const rib = hero.j.chest.localToWorld(V(0.17, -0.05, 0.05)); for (const s of ['l', 'r']) { const sh = fr.j[s + 'Sh'].getWorldPosition(V(0, 0, 0)); ikArm(fr, s, rib.clone().add(V(Math.sin(t * 22 + (s === 'l' ? 0 : 2)) * 0.03, (s === 'l' ? 0.05 : -0.08) + Math.cos(t * 19) * 0.03, 0.04)), sh.clone().add(V(0.2, -0.5, 0.3)), V(0, 0, 1)); } }
      // his own fingers: wiggle on his ribs
      if (self > 0.3) { for (const [s, x] of [['l', 0.16], ['r', -0.16]]) { const rib = hero.j.chest.localToWorld(V(x, -0.06, 0.07)); const sh = hero.j[s + 'Sh'].getWorldPosition(V(0, 0, 0)); ikArm(hero, s, rib.add(V(Math.sin(t * 10) * 0.02, Math.cos(t * 9) * 0.02, 0)), sh.clone().add(V(x * 2, -0.4, -0.2)), V(0, 0, 1)); } }
      scene.updateMatrixWorld(true);
      const head = hero.j.head.localToWorld(V(0, 0.12, 0));
      // brain bubble: surprise (random flashes) vs predicted (cerebellum glows, rest calm)
      const bk = easeOut(range(t, 3.8, 4.1)) * (1 - smooth(range(t, 21.8, 22.2)));
      if (bk > 0.01) {
        let on;
        if (t < 9.6) on = [0, 1, 2, 3, 4].map(i => 0.4 + 0.6 * Math.max(0, Math.sin(t * 9 + i * 1.7)));
        else { const cb = smooth(range(t, 12.4, 12.9)); on = [0.35, 0.35, 0.35, 0.35 + 0.65 * cb, 0.35]; if (t > 17.9) on = on.map((v, i) => i === 3 ? 1 : lerp(v, 0.2, smooth(range(t, 17.9, 18.6)))); }
        brain.draw(on, -1, t); brain.position.copy(head).add(V(0.55, 0.15, 0.1)); brain.scale.setScalar(0.5 * bk);
      }
      brain.visible = bk > 0.01;
      const qk = (t > 4.4 && t < 9.4 ? 1 : 0) * easeOut(range(t, 4.4, 4.6));
      q.position.copy(brain.position).add(V(0.22, 0.2, 0.05)); q.scale.set(0.25 * qk, 0.125 * qk, 1); q.material.opacity = qk; q.visible = qk > 0.01; q.material.rotation = Math.sin(t * 5) * 0.2;
      const spk = easeOut(range(t, 17.9, 18.2)) * (1 - smooth(range(t, 19.8, 20.1)));
      speech.position.copy(brain.position).add(V(0, -0.33, 0.05)); speech.scale.set(0.55 * spk, 0.275 * spk, 1); speech.material.opacity = spk; speech.visible = spk > 0.01;
      // predicted path ahead of his own fingers
      const pk = smooth(range(t, 13.5, 13.8)) * (1 - smooth(range(t, 15.6, 16.0)));
      dots.forEach((d, i) => { const ph = t * 10 + 0.9 + i * 0.35; const rib = hero.j.chest.localToWorld(V(0.16 + Math.sin(ph) * 0.03, -0.06 + Math.cos(ph * 0.9) * 0.03, 0.12)); d.position.copy(rib); d.material.opacity = pk * (1 - i / 10); });
      hahas.forEach((h, i) => { const u2 = ((t * 0.8) + i / 3) % 1, k = t < 9.4 ? 1 : 0; h.position.copy(head).add(V((i - 1) * 0.35, 0.1 + u2 * 0.5, 0.1)); h.scale.set(0.3, 0.15, 1); h.material.opacity = k * Math.sin(u2 * Math.PI); h.material.rotation = (i - 1) * 0.2; });
      // fun fact: a hologram who CAN tickle himself
      const gk = easeOut(range(t, 23.2, 23.6));
      ghost.root.visible = gk > 0.01; ghost.root.position.set(1.0, 0, 0.1); ghost.root.rotation.y = -0.4; ghost.root.scale.setScalar(gk);
      ghost.setPose(over(STAND(t), { spine: [0.2, 0, Math.sin(t * 9) * 0.12], lSh: [-0.2, 0, 0.1], lEl: [-1.9, 0, 0], rSh: [-0.2, 0, -0.1], rEl: [-1.9, 0, 0], neck: [-0.25, Math.sin(t * 7) * 0.2, 0], chest: [Math.sin(t * 16) * 0.05, 0, 0] })); ghost.setMouth(0.5 + 0.35 * Math.sin(t * 18));
      fx.fun.position.set(1.0, 1.2, 0.1); fx.fun.update(t - 23.3);
      // ---------- camera ----------
      const KEYS = [[0, [0.9, 1.45, 4.3], [0.1, 0.8, -0.5]], [2.0, [0.7, 1.4, 3.9], [0.1, 0.85, -0.5]], [9.4, [0.5, 1.35, 3.6], [0, 0.85, -0.5]], [11.0, [0.2, 1.35, 3.4], [-0.15, 0.9, -0.55]], [16.3, [0.4, 1.35, 3.3], [-0.05, 0.95, -0.55]], [21.8, [0.4, 1.35, 3.4], [-0.05, 0.9, -0.55]], [23.0, [1.4, 1.45, 4.4], [0.4, 0.9, -0.2]], [28.1, [1.5, 1.45, 4.5], [0.4, 0.9, -0.2]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const sh = shake(t, t < 9.5 ? 1.0 : 0.5, 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const mk = smooth(range(t, 2.0, 2.3)) * (1 - smooth(range(t, 21.9, 22.2)));
      const mv = t < 9.6 ? 0.92 + 0.08 * Math.sin(t * 9) : t < 19.8 ? lerp(0.92, 0.35, smooth(range(t, 10.4, 12.0))) : lerp(0.35, 0.0, smooth(range(t, 20.0, 21.4)));
      meter.set(mv); meter.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.14).addScaledVector(rt, -0.17); meter.scale.set(0.3 * mk, 0.105 * mk, 1); meter.material.opacity = mk; meter.visible = mk > 0.01;
      cancel.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.0); cancel.set(t > 21.0 ? easeOut(range(t, 21.0, 21.16)) * (1 - smooth(range(t, 22.0, 22.3))) : 0);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 2.0, "WHY CAN'T YOU", 'TICKLE YOURSELF?', '#ff5fa2', ''],
        [3.85, 9.5, 'SOMEONE ELSE', 'SURPRISE!', '#ffd23f', "brain can't predict it"],
        [11.31, 16.29, 'YOURSELF', 'CEREBELLUM', '#8fd3ff', 'predicts every move'], [16.29, 19.78, 'YOURSELF', "IT'S JUST ME", '#8fd3ff', ''], [19.78, 22.1, 'YOURSELF', 'CANCELLED', '#ff6b6b', 'no tickle feeling'],
        [22.27, 28.1, 'FUN FACT', 'SOME CAN!', '#c58aff', 'certain brain conditions'],
      ];
      const cu = CARDS.find(([a2, b]) => t >= a2 && t < b); let ck = 0;
      if (cu) { card.set(cu[2], cu[3], cu[4], null, cu[5]); const grp = CARDS.filter(x => x[2] === cu[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk2 = 1 + 0.09 * Math.exp(-(t - cu[0]) * 9); card.scale.set(0.72 * pk2, 0.281 * pk2, 1); }
      card.material.opacity = ck; card.visible = false;
      const fd = cp.distanceTo(lk);
      return { dof: { focus: fd, aperture: 0.001, maxblur: 0.004 }, bloom: 0.4, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
