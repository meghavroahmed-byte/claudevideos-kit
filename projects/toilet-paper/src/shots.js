import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { infoCard, burst } from './rare.js';
import { rng, glowTexture } from './textures.js';
import { world, grass, rock, quadruped, iconBubble, stamp } from './ancient.js';
import { latrine, tersorium, amphora, shard, corn, cornStalk, bigLeaf, moss, woolTuft, cypress, longship, tpRoll } from './tp.js';

export const DURATION = 30.6;
export const CAPTIONS = [
  [0.0, 'What did people use'], [1.14, 'as toilet paper'], [2.12, 'before toilet paper'], [3.0, 'existed?'],
  [4.39, 'Ancient Romans'], [5.25, 'shared a sponge'], [6.22, 'on a stick'], [7.02, 'called a tersorium'], [8.34, 'and rinsed it'], [9.1, 'in salty water'], [10.01, 'for the next person'],
  [11.35, 'The Greeks used'], [12.25, 'smooth pieces'], [13.17, 'of pottery'], [13.99, 'sometimes with'], [14.65, "their enemies' names"], [15.68, 'written on them'],
  [16.7, 'Farmers used'], [17.48, 'corn cobs'], [18.41, 'leaves'], [19.04, 'and moss'], [20.01, 'Vikings'], [20.6, 'used wool'],
  [21.7, 'And real'], [22.04, 'toilet paper?'], [23.33, 'It only showed up'], [24.15, 'in the 1850s'],
  [25.56, 'So next time'], [26.24, 'you run out'], [27.18, 'just be glad'], [27.88, "you're not borrowing"], [28.64, "a Roman's sponge!", 30.4],
];
export const FADES = [];

const HERO = V(0, 0, -0.33), NB = V(1.0, 0, -0.33), LR = V(-1.0, 0, -0.33);
const GK = V(6.0, 0, -0.55), FM = V(11.5, 0, -0.55), VK = V(16.5, 0, -0.55);
const ROLL = V(21.0, 0, -1.55), HERO2 = V(20.15, 0, 0.45), NB2 = V(21.75, 0, 0.55);
const K = [
  [0.0, [0.7, 1.5, 6.2], [0.45, 0.85, -0.35]],
  [2.0, [0.6, 1.45, 5.7], [0.45, 0.88, -0.35]],
  [4.3, [0.55, 1.45, 5.5], [0.45, 0.88, -0.35]],
  [6.4, [0.95, 1.4, 4.9], [0.7, 0.9, -0.3]],
  [9.3, [0.9, 1.35, 4.8], [0.65, 0.8, -0.25]],
  [10.6, [0.65, 1.4, 4.9], [0.45, 0.85, -0.3]],
  [11.6, [5.4, 1.65, 5.3], [5.9, 1.0, -0.5]],
  [16.2, [5.8, 1.6, 5.0], [6.1, 1.05, -0.5]],
  [17.1, [11.1, 1.6, 5.0], [11.4, 1.05, -0.6]],
  [19.7, [11.4, 1.6, 4.9], [11.55, 1.05, -0.6]],
  [20.4, [16.1, 1.65, 5.0], [16.5, 1.05, -0.6]],
  [21.3, [16.6, 1.7, 5.1], [16.9, 1.05, -0.7]],
  [22.2, [19.6, 2.6, 8.0], [20.6, 1.4, -1.0]],
  [23.6, [20.2, 2.2, 7.4], [20.8, 1.1, -0.9]],
  [25.6, [20.8, 1.75, 6.4], [20.95, 1.0, -0.3]],
  [28.6, [21.0, 1.7, 6.0], [20.95, 1.0, -0.2]],
  [30.6, [21.0, 1.7, 5.9], [20.95, 1.0, -0.2]],
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
const SIT = { drop: -0.47, lHip: [-1.5, 0, 0.12], lKn: [1.45, 0, 0], rHip: [-1.5, 0, -0.12], rKn: [1.45, 0, 0], lAn: [0.0, 0, 0], rAn: [0.0, 0, 0], lSh: [-0.45, 0, 0.2], rSh: [-0.45, 0, -0.2], lEl: [-0.7, 0, 0], rEl: [-0.7, 0, 0] };
const WALK = (p, a = 1) => { const s = Math.sin(p); return { lHip: [-0.4 * s * a, 0, 0.05], rHip: [0.4 * s * a, 0, -0.05], lKn: [(0.15 + 0.5 * Math.max(0, Math.sin(p + 1.3))) * a, 0, 0], rKn: [(0.15 + 0.5 * Math.max(0, Math.sin(p + 1.3 + Math.PI))) * a, 0, 0], lSh: [0.35 * s * a, 0, 0.15], rSh: [-0.35 * s * a, 0, -0.15], lEl: [-0.4, 0, 0], rEl: [-0.4, 0, 0], drop: -0.02 + Math.abs(Math.cos(p)) * 0.02 }; };
const over = (a, b) => Object.assign({}, a, b);
const mix = (a, b, k) => { const o = {}; for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) { if (key === 'drop') { o.drop = lerp(a.drop || 0, b.drop || 0, k); continue; } const va = a[key] || [0, 0, 0], vb = b[key] || [0, 0, 0]; o[key] = va.map((x, i) => lerp(x, vb[i], k)); } return o; };
const UP = V(0, 1, 0);
function hold(prop, h, side, dir, along = 0) { const p = h.j[side + 'Wr'].localToWorld(V(0, -0.07, 0)); const d = dir.clone().normalize(); prop.position.copy(p).addScaledVector(d, along); prop.quaternion.setFromUnitVectors(UP, d); }
const handPos = (h, side) => h.j[side + 'Wr'].localToWorld(V(0, -0.07, 0));
function tpIcon() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#e9edf2'; g.beginPath(); g.ellipse(330, 250, 70, 140, 0, 0, 7); g.fill();
  g.fillStyle = '#ffffff'; g.fillRect(170, 110, 160, 280); g.beginPath(); g.ellipse(170, 250, 70, 140, 0, 0, 7); g.fill();
  g.fillStyle = '#d9dee5'; g.beginPath(); g.ellipse(170, 250, 70, 140, 0, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(170, 250, 62, 130, 0, 0, 7); g.fill();
  g.fillStyle = '#b08a5a'; g.beginPath(); g.ellipse(170, 250, 24, 50, 0, 0, 7); g.fill();
  g.fillStyle = '#ffffff'; g.fillRect(250, 330, 140, 130); g.strokeStyle = '#d0d6de'; g.lineWidth = 4; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(250, 400); g.lineTo(390, 400); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function nameCallout() {   // big floating shard with a scratched name
  const c = document.createElement('canvas'); c.width = 512; c.height = 400; const g = c.getContext('2d');
  g.fillStyle = '#c4703e'; g.beginPath(); [[40, 120], [170, 30], [360, 50], [480, 160], [440, 330], [250, 380], [70, 320]].forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
  g.strokeStyle = '#8a4a28'; g.lineWidth = 10; g.stroke();
  g.fillStyle = 'rgba(30,20,15,0.9)'; g.fillRect(80, 92, 350, 18);
  g.fillStyle = '#2a1a10'; g.font = '900 104px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CLEON', 260, 230);
  g.strokeStyle = '#ff3030'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(110, 300); g.lineTo(410, 290); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); return s;
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 7, sunDir: [-4, 9, 5], sun: 2.5 });
  const u = scene.userData.sky.material.uniforms;
  u.top.value.set(0x2a7ad6); u.mid.value.set(0x62acea); u.horizon.value.set(0xcfe6f6); u.floorC.value.set(0xc9b48a);
  scene.fog = new THREE.Fog(0xd4e4ef, 45, 150);
  const key = scene.userData.key; key.color.set(0xfff0dc);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xd9ecff); hemi.groundColor.set(0xb59a6e); hemi.intensity = 0.8;
  scene.add(world(['#cdb88f', ['192,170,128', '214,196,156', '176,156,116']]));
  scene.add(grass(2200, [-12, -24, 34, 10], [[-3.4, -2.2, 3.4, 1.6]]));
  // dressing
  [[-4.2, -3.5], [3.6, -3.8], [8.5, -4.5], [-6.5, -7], [13.8, -5.2], [24.5, -4.5], [27, -2.5], [18.8, -6.5], [-2.2, -9]].forEach(([x, z], i) => { const c = cypress(3.4 + (i % 3) * 0.6, i + 2); c.position.set(x, 0, z); scene.add(c); });
  [[2.8, 0.9, 0.5], [9.0, 0.6, 0.6], [14.2, 0.2, 0.5], [23.4, -0.3, 0.7], [-3.0, 1.2, 0.5]].forEach(([x, z, s], i) => { const k = rock(s, 40 + i, 0xbfae8e); k.position.set(x, 0, z); scene.add(k); });
  const L = latrine(5.2); scene.add(L);

  // ---------- cast ----------
  const hero = makeHuman('hide', { plain: true, shirt: 0x3d6fb6, belt: 0xe9c46a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const toga = (o) => { const h = makeHuman('hide', { plain: true, ...o }); scene.add(h.root); return h; };
  const nb = toga({ shirt: 0xf3efe6, sash: 0xb3261e, belt: 0xb3261e, skin: 0xe0ac69, hair: 0x2b1d14 });
  const lr = toga({ shirt: 0xf3efe6, sash: 0x5a4a8a, belt: 0x5a4a8a, skin: 0xd99b7a, hair: 0x111111, beard: false });
  const gk = toga({ shirt: 0xe9e2d0, sash: 0x2f6f8f, belt: 0x2f6f8f, skin: 0xc68642, hair: 0x3a2618 });
  const fm = makeHuman('hide', { shirt: 0x8a6a44, skin: 0x8d5524, hair: 0x2b1d14 }); scene.add(fm.root);
  const vk = makeHuman('hide', { shirt: 0x6f4a2e, skin: 0xf1c27d, hair: 0xc0602a }); scene.add(vk.root);
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.145, 24, 12, 0, Math.PI * 2, 0, 1.45), new THREE.MeshStandardMaterial({ color: 0x8f969e, metalness: 0.7, roughness: 0.35 })); helm.position.set(0, 0.12, -0.005); helm.castShadow = true; vk.j.head.add(helm);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.09, 0.02), helm.material); nose.position.set(0, 0.07, 0.14); vk.j.head.add(nose);
  // props
  const ters = tersorium(); scene.add(ters);
  const amps = [[6.9, -1.3, 0.9, 0xc06a3a], [7.4, -0.9, 0.7, 0xb35e32], [5.1, -1.4, 1.0, 0xc87a46]].map(([x, z, h, c]) => { const a = amphora(h, c); a.position.set(x, 0, z); scene.add(a); return a; });
  const r = rng(5);
  for (let i = 0; i < 14; i++) { const s = shard('', i + 3, 1); s.position.set(GK.x + 0.4 + (r() - 0.5) * 1.2, 0.012, GK.z - 0.5 + (r() - 0.5) * 0.8); s.rotation.set(-Math.PI / 2, 0, r() * 6.28); scene.add(s); }
  const myShard = shard('', 99, 1.3); scene.add(myShard);
  const callout = nameCallout(); scene.add(callout);
  for (let i = 0; i < 18; i++) { const c = cornStalk(1.7 + r() * 0.4, i); c.position.set(FM.x - 1.6 + (i % 6) * 0.65 + (r() - 0.5) * 0.15, 0, FM.z - 1.2 - Math.floor(i / 6) * 0.7); c.rotation.y = r() * 6.28; scene.add(c); }
  for (let i = 0; i < 9; i++) { const c = corn(); c.position.set(FM.x + 0.55 + (r() - 0.5) * 0.35, 0.05 + Math.floor(i / 4) * 0.06, FM.z + 0.2 + (r() - 0.5) * 0.25); c.rotation.set(Math.PI / 2, r() * 6.28, 0); scene.add(c); }
  const cob = corn(), leaf = bigLeaf(1.3), msh = moss(), wool = woolTuft(); [cob, leaf, msh, wool].forEach(o => scene.add(o));
  const ship = longship(6); ship.position.set(VK.x + 1.0, 0, VK.z - 3.8); ship.rotation.y = 0.45; scene.add(ship);
  const sheep = [[VK.x + 1.2, VK.z + 0.1, -1.2], [VK.x - 1.0, VK.z - 0.6, 0.8], [VK.x + 1.8, VK.z - 1.1, -2.3]].map(([x, z, ry], i) => { const s = quadruped('sheep', 50 + i); s.position.set(x, 0, z); s.rotation.y = ry; scene.add(s); return s; });
  const roll = tpRoll(1.15); scene.add(roll);
  // fx
  const fx = { tp: burst(0xffffff, 60, 1), dip: burst(0xbfe8ff, 50, 2), pot: burst(0xffe14d, 40, 3), items: [burst(0xffd166, 40, 4), burst(0x8fcf6a, 40, 5), burst(0x8fcf6a, 40, 6), burst(0xffffff, 40, 7)], dust: burst(0xe6d3a8, 110, 8), gold: burst(0xffe14d, 120, 9), no: burst(0xff5050, 60, 10) };
  const all = []; for (const v of Object.values(fx)) (Array.isArray(v) ? v : [v]).forEach(f => { scene.add(f); all.push(f); });
  const tpb = iconBubble(tpIcon()); scene.add(tpb);
  const nothanks = stamp('NO THANKS!', '#ff2a2a', 0.66); scene.add(nothanks);
  const card = infoCard(); scene.add(card);
  const rollGlow = glowSprite(0xfff3c0, 4); scene.add(rollGlow);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      L.update(t);
      // ================= LATRINE =================
      const look = smooth(range(t, 0.9, 1.4)) * (1 - smooth(range(t, 3.6, 4.2)));
      const recoil = smooth(range(t, 10.25, 10.55)) * (1 - smooth(range(t, 11.4, 11.8)));
      hero.root.visible = t < 11.0 || t > 11.4;
      if (t < 11.2) {
        hero.root.position.copy(HERO); hero.root.rotation.y = 0;
        hero.setPose(over(SIT, { neck: [lerp(0.05, -0.1, look), Math.sin(t * 2.4) * 0.5 * look + 0.25 * recoil, 0], spine: [0, 0, 0.18 * recoil], chest: [-0.12 * recoil, 0, 0],
          lSh: [lerp(-0.45, -0.3, look) - 1.0 * recoil, 0, 0.2 + 0.4 * look], lEl: [-0.7 - 0.9 * recoil, 0, 0], rSh: [lerp(-0.45, -0.3, look) - 1.1 * recoil, 0, -0.2 - 0.4 * look], rEl: [-0.7 - 0.9 * recoil, 0, 0] }));
        hero.setMouth(0.15 * look + 0.55 * recoil);
      }
      lr.root.position.copy(LR); lr.setPose(over(SIT, { neck: [0.1, 0.3 + Math.sin(t * 0.7) * 0.1, 0] }));
      // neighbour: raises the sponge (5.4), dips it (8.5), offers it (10.1)
      const nbAway = t > 11.2;
      const raise = smooth(range(t, 5.35, 5.9)), dip = smooth(range(t, 8.45, 8.85)) * (1 - smooth(range(t, 9.75, 10.1))), offer = smooth(range(t, 10.0, 10.35)) * (1 - smooth(range(t, 11.6, 12)));
      if (!nbAway) {
        nb.root.position.copy(NB); nb.root.rotation.y = 0;
        nb.setPose(over(SIT, { spine: [0.55 * dip, -0.15 * offer, 0], neck: [0.15 * dip - 0.1 * raise * (1 - dip), -0.5 * offer, 0], lSh: [-0.45, 0, 0.2] }));
        nb.setMouth(0.25 * Math.max(0, Math.sin(t * 9)) * (t > 6 && t < 8 ? 1 : 0));
      }
      scene.updateMatrixWorld(true);
      if (!nbAway) {
        const sh = nb.j.rSh.getWorldPosition(V(0, 0, 0));
        let tgt = sh.clone().add(V(-0.08, -0.45, 0.25));
        tgt.lerp(sh.clone().add(V(-0.12, 0.35, 0.3)), raise);
        if (dip > 0) tgt.lerp(V(NB.x - 0.25, 0.25, 0.08), dip);
        if (offer > 0) tgt.lerp(V(0.4, 0.95, 0.05), offer);
        ikArm(nb, 'r', tgt, sh.clone().add(V(0.3, -0.4, -0.2)), V(0, 0, 1));
        scene.updateMatrixWorld(true);
        const d = V(0.05, 1, 0.25).lerp(V(0.0, -1, 0.15), dip).lerp(V(-1, 0.45, 0.1), offer);
        hold(ters, nb, 'r', d, 0.18);
      }
      ters.visible = t < 11.25 || t > 24.0;
      fx.dip.position.set(NB.x - 0.25, 0.1, 0.12); fx.dip.update(t - 8.7);
      // TP badge above the hero: pops on "toilet paper", slashed on "existed?"
      tpb.position.set(HERO.x + 0.05, 1.63 + Math.sin(t * 2) * 0.02, HERO.z + 0.25);
      tpb.set(0.62 * easeOut(range(t, 1.3, 1.55)) * (1 - smooth(range(t, 4.1, 4.45))) * (1 + 0.12 * Math.sin(clamp(range(t, 1.3, 1.7)) * Math.PI)), smooth(range(t, 3.3, 3.45)));
      fx.tp.position.copy(tpb.position); fx.tp.update(t - 1.32);
      // ================= GREECE =================
      gk.root.position.copy(GK); gk.root.rotation.y = 0.15;
      const pick = smooth(range(t, 11.9, 12.35)), show = smooth(range(t, 12.35, 12.8));
      gk.setPose(over(STAND(t, 1), { spine: [0.55 * pick * (1 - show), 0, 0], lHip: [-0.5 * pick * (1 - show), 0, 0.07], lKn: [0.8 * pick * (1 - show), 0, 0], drop: -0.15 * pick * (1 - show), rSh: [lerp(-0.6 * pick, -1.25, show), 0, -0.15], rEl: [lerp(-0.2, -1.5, show), 0, 0], neck: [0.25 * pick, -0.2 * show, 0] }));
      gk.setMouth(0.2 * smooth(range(t, 14.6, 14.9)) * (t < 16.4 ? 1 : 0));
      scene.updateMatrixWorld(true);
      if (t < 11.9) { myShard.position.set(GK.x + 0.15, 0.02, GK.z + 0.35); myShard.rotation.set(-Math.PI / 2, 0, 0.4); }
      else { myShard.position.copy(handPos(gk, 'r')).add(V(-0.05, 0.08, 0.05)); myShard.rotation.set(-0.2, 0.3, 0.2); }
      fx.pot.position.copy(myShard.position); fx.pot.update(t - 12.74);
      const ck = easeOut(range(t, 14.7, 14.98)) * (1 - smooth(range(t, 16.3, 16.6)));
      callout.position.set(GK.x - 0.68, 1.56 + Math.sin(t * 2) * 0.02, GK.z + 0.25); callout.scale.set(0.82 * ck, 0.64 * ck, 1); callout.material.opacity = Math.min(1, ck * 1.5); callout.visible = ck > 0.01;
      // ================= FARMERS =================
      fm.root.position.copy(FM); fm.root.rotation.y = -0.15;
      const it = t < 18.41 ? 0 : t < 19.16 ? 1 : 2, its = [17.48, 18.41, 19.16][it];
      const up = smooth(range(t, 17.3, 17.65)) * (1 - smooth(range(t, 19.9, 20.3)));
      fm.setPose(over(STAND(t, 2), { rSh: [-1.35 * up, 0, -0.2], rEl: [-1.35 * up, 0, 0], neck: [-0.05, -0.25 * up, 0] }));
      scene.updateMatrixWorld(true);
      const fp = handPos(fm, 'r').add(V(0, 0.1, 0.06)), pop = (a) => Math.max(0.001, easeOut(range(t, a, a + 0.2)) * (1 + 0.25 * Math.sin(clamp(range(t, a, a + 0.35)) * Math.PI)));
      [cob, leaf, msh].forEach((o, i) => { o.visible = i === it && up > 0.05; o.position.copy(fp); o.scale.setScalar(pop(its) * (i === 1 ? 1 : 1.3)); o.rotation.set(i === 0 ? 0.3 : 0, t * 0.6, i === 0 ? -0.4 : 0); });
      fx.items.slice(0, 3).forEach((f, i) => { f.position.copy(fp); f.update(t - [17.48, 18.41, 19.16][i]); });
      // ================= VIKINGS =================
      vk.root.position.copy(VK); vk.root.rotation.y = 0.2;
      const wu = smooth(range(t, 20.5, 20.85));
      vk.setPose(over(STAND(t, 3), { rSh: [-1.3 * wu, 0, -0.2], rEl: [-1.3 * wu, 0, 0], lSh: [0.05, 0, 0.3], neck: [0, -0.2 * wu, 0] }));
      scene.updateMatrixWorld(true);
      wool.visible = wu > 0.05; wool.position.copy(handPos(vk, 'r')).add(V(0, 0.1, 0.06)); wool.scale.setScalar(pop(20.75) * 1.4);
      fx.items[3].position.copy(wool.position); fx.items[3].update(t - 20.75);
      sheep.forEach((s, i) => s.pose(t + i, { graze: 0.5 + 0.5 * Math.sin(t * 1.2 + i * 2) }));
      // ================= GIANT TOILET PAPER =================
      const fall = range(t, 21.95, 22.4), land = t - 22.4;
      roll.position.copy(ROLL); roll.rotation.y = -0.55; roll.position.y = (1 - fall * fall) * 9; roll.visible = t > 21.8;
      const sq = land > 0 ? Math.exp(-land * 7) * Math.sin(land * 30) * 0.12 : 0;
      roll.scale.set(1 + sq, 1 - sq, 1 + sq);
      fx.dust.position.copy(ROLL).add(V(0, 0.1, 0.4)); fx.dust.update(t - 22.4);
      fx.gold.position.copy(ROLL).add(V(0, 1.6, 0)); fx.gold.update(t - 22.5);
      rollGlow.position.copy(ROLL).add(V(0, 0.9, 0)); rollGlow.material.opacity = 0.55 * Math.exp(-Math.max(0, t - 22.45) * 1.5) * (t > 22.45 ? 1 : 0);
      if (t > 11.4) {
        hero.root.position.copy(HERO2);
        const cheer = smooth(range(t, 22.55, 22.85)) * (1 - smooth(range(t, 24.6, 25.1)));
        const turn = smooth(range(t, 26.4, 26.9)), nope = smooth(range(t, 28.15, 28.4));
        hero.root.rotation.y = lerp(0.35, 1.05, turn);
        hero.setPose(over(STAND(t), { neck: [lerp(-0.45, 0, smooth(range(t, 22.4, 22.8))), Math.sin(t * 9) * 0.35 * nope, 0],
          lSh: [-2.7 * cheer - 1.2 * nope, 0, 0.3 + 0.3 * cheer], rSh: [-2.7 * cheer - 1.35 * nope, 0, -0.3 - 0.3 * cheer], lEl: [-0.3 - 0.9 * nope, 0, 0], rEl: [-0.3 - 0.9 * nope, 0, 0], chest: [-0.15 * nope, 0, 0] }));
        hero.setMouth(0.5 * cheer + 0.35 * nope);
      }
      if (nbAway) {   // the Roman walks in with his sponge
        const w = range(t, 24.6, 26.3), p = V(24.4, 0, 0.85).lerp(NB2, easeInOut(w));
        nb.root.position.copy(p); nb.root.rotation.y = -Math.PI / 2 - 0.15;
        const off = smooth(range(t, 26.9, 27.3));
        nb.setPose(over(w < 1 ? WALK((t - 24.6) * 7, 1) : STAND(t, 4), { rSh: [-0.6 - 0.75 * off, 0, -0.15], rEl: [-1.0 + 0.8 * off, 0, 0] }));
        nb.setMouth(0.25 * Math.max(0, Math.sin(t * 8)) * (t > 27 && t < 28 ? 1 : 0));
        scene.updateMatrixWorld(true);
        hold(ters, nb, 'r', V(-0.85, lerp(1, 0.55, off), 0.15), 0.18);
      }
      fx.no.position.copy(HERO2).add(V(0.3, 1.5, 0.2)); fx.no.update(t - 28.64);
      // ---------- camera ----------
      const [cp, lk] = track(t);
      const sh = shake(t, 0.6, 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      key.target.position.copy(lk); key.position.copy(lk).add(V(-4, 9, 5));
      const fw = V(0, 0, 0); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion);
      nothanks.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.12); nothanks.set(t > 28.64 ? easeOut(range(t, 28.64, 28.8)) : 0);
      card.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.5);
      const CARDS = [
        [0.2, 4.2, 'BEFORE', 'TOILET PAPER?', '#ffffff', ''],
        [4.39, 7.31, 'ANCIENT ROME', 'SPONGE', '#ffd166', 'on a stick'], [7.31, 9.2, 'ANCIENT ROME', 'TERSORIUM', '#ffd166', 'shared by everyone'], [9.2, 11.2, 'ANCIENT ROME', 'SALT WATER', '#8fd3ff', 'rinse... next person'],
        [11.35, 14.77, 'ANCIENT GREECE', 'POTTERY', '#ff9a5a', 'smooth shards'], [14.77, 16.5, 'ANCIENT GREECE', 'ENEMY NAMES', '#ff6b5b', 'written on them'],
        [16.7, 18.41, 'FARMERS', 'CORN COBS', '#ffd166', ''], [18.41, 19.16, 'FARMERS', 'LEAVES', '#8fcf6a', ''], [19.16, 19.95, 'FARMERS', 'MOSS', '#8fcf6a', ''],
        [20.01, 21.55, 'VIKINGS', 'WOOL', '#ffffff', ''],
        [23.33, 25.45, 'TOILET PAPER', '1850s', '#ffe14d', 'only ~170 years ago'],
      ];
      const cur = CARDS.find(([a, b]) => t >= a && t < b); let ck2 = 0;
      if (cur) { card.set(cur[2], cur[3], cur[4], null, cur[5]); const grp = CARDS.filter(x => x[2] === cur[2]); const ga = grp[0][0], gb = grp[grp.length - 1][1]; ck2 = smooth(range(t, ga, ga + 0.25)) * (1 - smooth(range(t, gb - 0.25, gb))); const pk = 1 + 0.09 * Math.exp(-(t - cur[0]) * 9); card.scale.set(0.72 * pk, 0.281 * pk, 1); }
      card.material.opacity = ck2; card.visible = false;
      const fd = cp.distanceTo(lk);
      return { dof: { focus: fd, aperture: fd < 6 ? 0.0012 : 0.0004, maxblur: 0.005 }, bloom: 0.4, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
