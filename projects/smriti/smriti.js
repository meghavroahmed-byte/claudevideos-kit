// smriti.js: "শৈশবের স্মৃতি কেনো মনে নেই?" Neon 3D short (71 s, voice.wav, timings in lines.json).
// Stations (+z): A baby + memory photos (0,0) · A2 first walk / first word (0,18) · B brain (0,45, also the
// hippocampus close-up) · D old wall -> new room (-6,85) · E toddler + mirror (6,118) · F empty shelf (-5,148)
// · G grown-up brain takes the memories (4,180) · end: oldest memory + comment.
import * as K from '../neon-tech-short/kit/core3d.js';
import { natureWorld } from '../neon-tech-short/kit/nature.js';
import { V, cl, sm, pedestal, brain, polaroid, fadeGroup, baby, burstPool, burst, updateBursts } from '../neon-tech-short/kit/objects3d.js';
const { THREE } = K;
const env = (t, a, b, fi = 0.4, fo = 0.4) => sm(a, a + fi, t) * (1 - sm(b - fo, b, t));
document.fonts.add(await new FontFace('Anek', 'url(../neon-tech-short/kit/fonts/anek.woff2)', { weight: '100 800' }).load());

CFG.duration = 71.04; CFG.captions = false;
K.seed(1912);
// natural dusk meadow world (user: background must be natural, mixed with nature)
const NAT = natureWorld({ z0: -30, z1: 200, corridor: 12, patches: [[0, 0, 10], [0, 20, 8], [0, 45, 10], [-6, 85, 11], [6, 118, 9], [-5, 148, 8], [4, 180, 11]] });

// ---- picture painters for the memory photos ----
const P = {
  steps(c) { c.fillStyle = '#ffd8b0'; for (let i = 0; i < 4; i++) { const x = 70 + i * 40, y = 200 - i * 45 + (i % 2) * 20; c.beginPath(); c.ellipse(x, y, 14, 24, 0.3, 0, 7); c.fill(); for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x - 9 + k * 6, y - 28, 4, 0, 7); c.fill(); } } },
  ma(c) { c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(128, 115, 95, 70, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(80, 170); c.lineTo(60, 220); c.lineTo(120, 180); c.fill(); c.fillStyle = '#ff3d6e'; c.font = '800 90px Anek'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('মা', 128, 122); },
  cake(c) { c.fillStyle = '#ff8fc8'; c.fillRect(60, 140, 136, 80); c.fillStyle = '#fff3d6'; c.fillRect(60, 130, 136, 20); c.fillStyle = '#53e0ff'; c.fillRect(124, 80, 8, 50); c.fillStyle = '#ffc93c'; c.beginPath(); c.ellipse(128, 70, 9, 16, 0, 0, 7); c.fill(); },
  ball(c) { c.fillStyle = '#ff3d6e'; c.beginPath(); c.arc(128, 140, 70, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 10; c.beginPath(); c.arc(128, 140, 70, -0.6, 0.6); c.stroke(); c.beginPath(); c.arc(128, 140, 70, 2.5, 3.7); c.stroke(); },
  mom(c) { c.fillStyle = '#3a2416'; c.beginPath(); c.arc(128, 120, 80, Math.PI, 0); c.fill(); c.fillRect(48, 120, 30, 100); c.fillRect(178, 120, 30, 100); c.fillStyle = '#f2c29b'; c.beginPath(); c.arc(128, 135, 58, 0, 7); c.fill(); c.fillStyle = '#1a1410'; c.beginPath(); c.arc(108, 130, 6, 0, 7); c.arc(148, 130, 6, 0, 7); c.fill(); c.strokeStyle = '#c0504d'; c.lineWidth = 5; c.beginPath(); c.arc(128, 150, 18, 0.2, 2.9); c.stroke(); },
  home(c) { c.fillStyle = '#ffc93c'; c.beginPath(); c.moveTo(40, 130); c.lineTo(128, 50); c.lineTo(216, 130); c.fill(); c.fillStyle = '#f3efe6'; c.fillRect(60, 130, 136, 100); c.fillStyle = '#2b3157'; c.fillRect(110, 170, 36, 60); c.fillStyle = '#53e0ff'; c.fillRect(72, 150, 26, 26); c.fillRect(158, 150, 26, 26); },
  moon(c) { c.fillStyle = '#fff3c8'; c.beginPath(); c.arc(128, 128, 64, 0, 7); c.fill(); c.fillStyle = '#2b3157'; c.beginPath(); c.arc(156, 110, 58, 0, 7); c.fill(); for (let i = 0; i < 9; i++) { c.fillStyle = '#ffffff'; c.fillRect((i * 67) % 230 + 10, (i * 41) % 200 + 20, 4, 4); } },
};
const PICS = [P.steps, P.ma, P.cake, P.ball, P.mom, P.home, P.moon];

// ---------------- A: baby with memory photos ----------------
const Ap = pedestal(0, 0, 0x53e0ff, 2.6);
const Ababy = baby(Ap, 0, 1.2, 0, 1.15); Ababy.rotation.y = Math.PI;
{ const l = new THREE.PointLight(0xffe0c0, 9, 16, 1.4); l.position.set(0, 6, -5); K.scene.add(l); }
const Aph = PICS.slice(0, 6).map((d, i) => polaroid(null, 0, 0, 0, 0.95, d));
// A2: first walk / first word
const A2a = pedestal(-3.2, 20, 0xffc93c, 1.8), A2b = pedestal(3.2, 20, 0xff8fc8, 1.8);
const walkP = polaroid(A2a, 0, 3.4, 0, 2.2, P.steps), wordP = polaroid(A2b, 0, 3.4, 0, 2.2, P.ma);
const shards = burstPool(10, 46, 0xffe9b0);
const redShards = burstPool(8, 40, 0xff3d6e);

// ---------------- B: the brain ----------------
const Bp = pedestal(0, 45, 0xff8fc0, 3.2, 1.2);
const B = brain(null, 0, 5.2, 45, 3.0); const B_YAW = -Math.PI / 2;
const recBlink = K.glowSprite(0xff2d2d, 2.2, 0, B); recBlink.position.set(1.4, 1.3, 0.6);
const inflow = PICS.map(d => polaroid(null, 0, 0, 0, 0.6, d));
// neurons: particles spawned from the hippocampus
const NN = 420, neur = K.instanced(new THREE.SphereGeometry(0.05, 8, 6), K.std({ color: 0x9fe8ff, emissive: 0x53e0ff, emissiveIntensity: 0.45 }), NN);
const nDir = []; for (let i = 0; i < NN; i++) nDir.push([V(K.rnd(-1, 1), K.rnd(-1, 1), K.rnd(-1, 1)).normalize(), K.rnd(0, 1), K.rnd(0.6, 1.6), i % 2 ? 1 : -1]);

// ---------------- D: old wall -> new room ----------------
const D = K.group(-6, 0, 85);
const COLS = 14, ROWS = 9, NB = COLS * ROWS;
const oldB = K.instanced(new THREE.BoxGeometry(0.96, 0.48, 0.5), K.std({ color: 0x9a6a50, roughness: 0.85 }), NB, D);
const newB = K.instanced(new THREE.BoxGeometry(0.96, 0.48, 0.5), K.std({ color: 0x1d3a5a, emissive: 0x53e0ff, emissiveIntensity: 0.18, roughness: 0.5 }), NB, D);
const bInfo = []; for (let i = 0; i < NB; i++) { const c = i % COLS, r = Math.floor(i / COLS); bInfo.push([(c - COLS / 2 + 0.5 + (r % 2) * 0.5) * 1.0, 0.25 + r * 0.5, V(K.rnd(-1, 1), K.rnd(0.2, 1.4), K.rnd(-1.8, -0.4)).multiplyScalar(K.rnd(3, 7)), K.rnd(0, 0.35)]); }
const wallPh = [P.cake, P.mom, P.home].map((d, i) => polaroid(D, (i - 1) * 3.4, 2.9, -0.32, 1.5, d));
wallPh.forEach(p => p.rotation.y = Math.PI);

// ---------------- E: toddler + mirror ----------------
const Ep = pedestal(6, 118, 0xa66bff, 3.0);
const Ebaby = baby(Ep, -1.0, 1.2, 0.4, 1.0, 0xffc93c); Ebaby.rotation.y = 0.9;
const mirror = K.group(1.4, 1.2, -0.4, Ep); mirror.rotation.y = -0.6;
K.box(2.0, 3.0, 0.12, K.std({ color: 0x8f6a3a, roughness: 0.5 }), 0, 1.6, 0, mirror);
const mirTex = K.canvasTex(256, 384, (c) => { const g = c.createLinearGradient(0, 0, 256, 384); g.addColorStop(0, '#cfe0ff'); g.addColorStop(0.5, '#7f8fb8'); g.addColorStop(1, '#dfe8ff'); c.fillStyle = g; c.fillRect(0, 0, 256, 384); c.fillStyle = 'rgba(40,50,90,0.55)'; c.beginPath(); c.arc(128, 150, 48, 0, 7); c.fill(); c.beginPath(); c.ellipse(128, 270, 55, 70, 0, 0, 7); c.fill(); });
K.mesh(new THREE.PlaneGeometry(1.75, 2.75), K.std({ map: mirTex, emissive: 0xffffff, emissiveMap: mirTex, emissiveIntensity: 0.25, metalness: 0.6, roughness: 0.15 }), 0, 1.6, -0.07, mirror).rotation.y = Math.PI;
const qSprite = K.textSprite((c) => { c.font = '800 360px PJS'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffc93c'; c.shadowColor = '#ffb21a'; c.shadowBlur = 40; c.fillText('?', 256, 280); }, 512, 512, 2.2, Ep); qSprite.position.set(-1.0, 5.0, 0.4);
const bubble = K.textSprite((c) => { c.fillStyle = 'rgba(255,255,255,0.92)'; c.beginPath(); c.ellipse(256, 200, 200, 140, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(160, 320); c.lineTo(120, 420); c.lineTo(230, 335); c.fill(); c.fillStyle = '#9aa3c0'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(186 + i * 70, 200, 18, 0, 7); c.fill(); } }, 512, 512, 2.0, Ep); bubble.position.set(-2.6, 4.2, 0.6);

// ---------------- F: empty shelf (no structure) ----------------
const F = K.group(-5, 0, 148);
const shelfM = K.std({ color: 0x2a3160, emissive: 0x53e0ff, emissiveIntensity: 0.25, transparent: true, opacity: 0.85 });
for (const x of [-2.2, 2.2]) for (const z of [-0.7, 0.7]) K.box(0.14, 7.5, 0.14, shelfM, x, 3.75, z, F);
K.box(4.6, 0.14, 1.6, shelfM, 0, 7.5, 0, F);
const ghostM = new THREE.LineBasicMaterial({ color: 0x53e0ff, transparent: true, opacity: 0.35 });
for (const y of [1.5, 3.2, 4.9, 6.4]) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(4.3, 0.1, 1.4)), ghostM); e.position.y = y; F.add(e); }
const fallPh = PICS.slice(1, 6).map(d => polaroid(F, 0, 20, 0, 0.9, d));

// ---------------- G: grown-up brain takes the memories ----------------
const Gp = pedestal(4, 180, 0xffc93c, 3.4, 1.2);
const G = brain(null, 4, 5.6, 180, 3.3, 0xffb86b); G.rotation.y = -Math.PI / 2;
const offer = PICS.map(d => polaroid(null, 0, 0, 0, 0.7, d));
const flames = offer.map(() => K.glowSprite(0xff8a3d, 1.8, 0));
const oldest = polaroid(null, 4, 6.0, 172.5, 1.6, P.mom);
const oldGlow = K.glowSprite(0xffc93c, 5, 0); oldGlow.position.set(4, 6.0, 172.4);

// ---------------- camera ----------------
K.setCamKeys([
  { t: 0, p: [0, 5.5, -15], l: [0, 3.2, 0] },
  { t: 3.8, p: [-2.5, 4.8, -9.5], l: [0, 3.0, 0] },
  { t: 6.8, p: [3, 5.4, -9.5], l: [0, 3.6, 0] },
  { t: 9.4, p: [0, 5.6, -5.5], l: [0, 3.8, 6] },
  { t: 10.6, p: [0, 5.5, 6.5], l: [0, 4.2, 20] },
  { t: 13.2, p: [0, 5.6, 5.5], l: [0, 4.0, 20] },
  { t: 15.2, p: [0, 8, 23], l: [0, 5.6, 45] },
  { t: 19.0, p: [3, 7.5, 26], l: [0, 5.4, 45] },
  { t: 24.5, p: [-3, 8, 27], l: [0, 5.6, 45] },
  { t: 29.3, p: [0, 7, 30], l: [0, 5.4, 45] },
  { t: 31.6, p: [2.5, 6.2, 35.5], l: [0.3, 4.9, 45] },
  { t: 38.0, p: [-2.5, 6.0, 36], l: [-0.3, 4.9, 45] },
  { t: 40.2, p: [-6, 6.5, 68], l: [-6, 3.6, 85] },
  { t: 44.5, p: [-2.5, 8.5, 64], l: [-6, 3.6, 85] },
  { t: 48.8, p: [-1, 7.5, 67], l: [-5, 3.4, 85] },
  { t: 51.0, p: [3.2, 4.6, 109], l: [6, 3.0, 118] },
  { t: 55.2, p: [8.5, 4.8, 110], l: [6, 3.2, 118] },
  { t: 57.8, p: [-3, 6, 136], l: [-5, 3.8, 148] },
  { t: 61.0, p: [2, 9.5, 159], l: [4, 6.5, 180] },
  { t: 65.6, p: [7, 8.5, 162], l: [4, 6.2, 180] },
  { t: 68.2, p: [4, 6.6, 166.5], l: [4, 6.0, 175] },
  { t: 71.1, p: [4, 6.8, 165.5], l: [4, 6.0, 175] },
]);
const SHAKE_T = [[12.9, 0.12], [19.0, 0.16], [25.4, 0.12], [39.8, 0.2], [46.4, 0.1], [63.4, 0.1]];
K.hooks.shake = t => { let a = 0; for (const [s, amp] of SHAKE_T) { const k = (t - s) / 0.45; if (k > 0 && k < 1) a += amp * (1 - k); } return [Math.sin(t * 93) * a, Math.cos(t * 71) * a]; };

const VIS = [
  [[Ap, ...Aph], 0, 13], [[A2a, A2b], 8, 16.5], [[Bp, B, ...inflow, neur], 13, 41.5], [[D], 36, 51.5],
  [[Ep], 47, 59], [[F], 53, 62], [[Gp, G, ...offer, ...flames, oldest, oldGlow], 56, 71.2],
];
burst(shards, 0, V(-3.2, 4.6, 20), 12.85); burst(shards, 1, V(3.2, 4.6, 20), 13.0);

// stone-coloured pedestal bases so they sit in the meadow
for (const pd of [Ap, A2a, A2b, Bp, Ep, Gp]) pd.children[0].material = K.std({ color: 0x6a6878, roughness: 0.8 });
function update(t) {
  NAT.update(t);
  for (const [objs, a, b] of VIS) for (const o of objs) o.visible = t >= a && t <= b;
  const cam = K.camera.position;
  // A: photos orbit the baby; they go blank 7.3-8.6 (no memory left), then fade out
  Aph.forEach((p, i) => {
    const a = i / 6 * Math.PI * 2 + t * 0.25;
    p.position.set(Math.cos(a) * 3.3, 3.6 + Math.sin(t * 1.3 + i) * 0.45, Math.sin(a) * 3.3);
    p.lookAt(cam);
    const blank = sm(7.1 + i * 0.22, 7.6 + i * 0.22, t);
    p.userData.mats[1].opacity = 1 - blank; p.userData.mats[0].opacity = 1 - 0.6 * sm(9.0, 10.2, t);
    p.visible = t < 10.6;
  });
  Ababy.userData.head.rotation.z = Math.sin(t * 1.4) * 0.12;
  Ababy.userData.limbs[0].rotation.z = -0.4 + Math.sin(t * 3) * 0.3; Ababy.userData.limbs[1].rotation.z = 0.4 - Math.sin(t * 3) * 0.3;
  // A2: first walk / first word, wiped at 12.4
  for (const [p, t0] of [[walkP, 12.85], [wordP, 13.0]]) { p.scale.setScalar(2.2 * (1 - sm(t0, t0 + 0.15, t)) + 0.001); p.rotation.y = Math.sin(t * 0.8) * 0.25 + Math.PI; }
  updateBursts(shards, t);
  // B: weak brain (15-19) -> recording everything (19-25) -> destroys them (25.4)
  const lit = sm(18.9, 19.6, t);
  B.userData.shellM.emissiveIntensity = 0.06 + 0.3 * lit; B.userData.shellM.opacity = 0.4 + 0.25 * lit;
  B.userData.rimM.uniforms.a.value = 0.35 + 0.65 * lit;
  B.rotation.y = B_YAW + Math.sin(t * 0.35) * 0.3;
  recBlink.material.opacity = env(t, 21.4, 25.4, 0.2, 0.2) * (Math.floor(t * 2.5) % 2 ? 1 : 0.15);
  inflow.forEach((p, i) => {
    const k = ((t - 21.6) * 0.45 + i / inflow.length) % 1, live = t > 21.6 && t < 25.4;
    const a = i * 0.9 + t * 0.6, r = 6.5 * (1 - k);
    p.position.set(Math.cos(a) * r, 5.2 + Math.sin(a * 1.7) * 1.5 * (1 - k), 45 + Math.sin(a) * r);
    p.lookAt(cam); p.scale.setScalar(0.6 * (live ? 1 - k * 0.7 : 0) + 0.001);
  });
  if (t > 25.3) inflow.forEach((p, i) => { if (i < 8) burst(redShards, i, V(Math.cos(i) * 3.5, 5 + Math.sin(i * 2), 45 + Math.sin(i) * 3.5), 25.4 + i * 0.06); });
  updateBursts(redShards, t);
  // C: hippocampus close-up 30-38.4 (shell fades, hippocampus pulses, neurons pour out)
  const hip = env(t, 30.2, 38.6, 0.8, 0.6);
  B.userData.shellM.opacity = (0.4 + 0.25 * lit) * (1 - 0.75 * hip);
  B.userData.hippoM.emissiveIntensity = 0.25 + hip * (0.5 + 0.25 * Math.sin(t * 9));
  const rate = 0.2 + 1.2 * env(t, 31.5, 38.6, 1.0, 0.6);
  nDir.forEach(([d, ph, sp, side], i) => {
    const k = (t * 0.35 * sp + ph) % 1, on = hip * cl(rate - ph * 0.6);
    const o = V(0.2, 5.2 - 0.5, 45 + side * 1.3);
    K.setInst(neur, i, [o.x + d.x * k * 4.5, o.y + d.y * k * 4.5, o.z + d.z * k * 4.5], on * (1 - k * 0.5) + 0.001);
  });
  neur.instanceMatrix.needsUpdate = true;
  // D: wall breaks at 39.8, photos fall, new glowing bricks rise 41.4-43.6; photos dissolve 45.6-47
  bInfo.forEach(([x, y, v, d], i) => {
    const u = Math.max(0, t - 39.8 - d * 0.3);
    K.setInst(oldB, i, u > 0 ? [x + v.x * u * 0.6, y + v.y * u * 0.6 - 4.9 * u * u * 0.6, v.z * u * 0.6] : [x, y, 0], u > 1.6 ? 0.001 : 1, u * v.x * 0.4, u * 2, 0);
    const r = sm(41.4 + d + (y / 4.5) * 1.2, 41.9 + d + (y / 4.5) * 1.2, t);
    K.setInst(newB, i, [x, y - (1 - r) * 4, 0.6], r + 0.001);
  });
  oldB.instanceMatrix.needsUpdate = true; newB.instanceMatrix.needsUpdate = true;
  wallPh.forEach((p, i) => {
    const u = Math.max(0, t - 39.9 - i * 0.12);
    p.position.set((i - 1) * 3.4 + u * (i - 1) * 0.8, 2.9 + 1.2 * u - 4.9 * u * u * 0.5, -0.32 - u * 1.5);
    p.rotation.z = u * (i - 1.2) * 1.5; p.visible = u < 1.1;
    if (u > 1.0 && !shards.slots[3 + i]) burst(shards, 3 + i, V(-6 + p.position.x, 0.6, 85 + p.position.z), 39.9 + i * 0.12 + 1.0);
  });
  // E: toddler and mirror
  Ebaby.userData.head.rotation.y = Math.sin(t * 1.2) * 0.3;
  qSprite.material.opacity = env(t, 50.4, 55.6, 0.3, 0.4); qSprite.position.y = 5.0 + 0.2 * Math.sin(t * 3);
  bubble.material.opacity = env(t, 52.6, 55.6, 0.3, 0.4);
  // F: photos fall straight through the empty shelf
  fallPh.forEach((p, i) => { const t0 = 55.9 + i * 0.55, u = Math.max(0, t - t0); p.position.set((i - 2) * 0.6, 9.5 - 4.9 * u * u * 0.55, (i % 2) * 0.3); p.rotation.set(u * 0.8, u * 1.6 + i, u * 0.4); p.visible = t > t0 && p.position.y > -1; });
  // G: memories orbit, get pulled in and burn as fuel for the grown-up brain (60.5-65.8)
  G.rotation.y = -Math.PI / 2 + Math.sin(t * 0.3) * 0.3;
  const take = sm(60.6, 65.4, t);
  G.userData.shellM.emissiveIntensity = 0.12 + 0.35 * take; G.userData.rimM.uniforms.a.value = 0.5 + 0.6 * take;
  offer.forEach((p, i) => {
    const k = cl(take * 1.6 - i * 0.09), a = i / offer.length * Math.PI * 2 + t * 0.5, r = 6.2 * (1 - k);
    p.position.set(4 + Math.cos(a) * r, 5.6 + Math.sin(a * 2 + t) * 1.2 * (1 - k), 180 + Math.sin(a) * r);
    p.lookAt(cam); p.scale.setScalar(0.7 * (1 - k) + 0.001);
    flames[i].position.copy(p.position); flames[i].material.opacity = k > 0.05 && k < 0.98 ? 0.9 * Math.sin(k * Math.PI) : 0;
    p.visible = t > 58.5 && k < 0.99;
  });
  // end: the oldest memory floats up in front
  const o = env(t, 66.4, 72, 0.6, 0.1);
  oldest.visible = o > 0.01; oldest.scale.setScalar(1.6 * o + 0.001); oldest.position.y = 6.0 + Math.sin(t * 1.5) * 0.15; oldest.lookAt(cam);
  oldGlow.material.opacity = 0.7 * o;
}
window.BG3D = t => K.draw(t, update);

// ---------------- 2D UI ----------------
const bn = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
SCENE.ui = (g, t) => {
  // L1 0-3.85: hook
  stamp(g, t, 0.25, 3.9, 'ভেবেছেন কখনো?', 560, 104, '#ffc93c', '#7a4a00');
  // L2 4.1-6.8: age < 3
  withPop(g, t, 4.2, 6.9, W / 2, 1420, () => {
    glassCard(g, 190, 1300, 700, 250, { line: 'rgba(83,224,255,0.45)' });
    label(g, 'বয়স', 235, 1350, C.cyan, 24);
    const y = lerp(0, 3, eOut((t - 4.4) / 1.4));
    g.font = `800 92px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = C.white; g.fillText('< ' + bn(Math.round(y)) + ' বছর', 235, 1450);
  });
  // L3 6.8-9.7: zero memories
  withPop(g, t, 6.9, 9.8, W / 2, 1420, () => {
    glassCard(g, 190, 1300, 700, 250, { line: 'rgba(255,61,110,0.5)' });
    label(g, 'মনে আছে এমন স্মৃতি', 235, 1350, C.dim, 24);
    const v = Math.round(lerp(6, 0, eOut((t - 7.1) / 1.6)));
    g.font = `800 110px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = v ? C.white : C.pink; g.shadowColor = C.pink; g.shadowBlur = v ? 0 : 30;
    g.fillText(bn(v) + 'টি', 235, 1455); g.shadowBlur = 0;
  });
  // L4 10-14.7: first walk / first word, who erased them?
  chip(g, t, 10.2, 12.4, 'প্রথম হাঁটা', 300, 1500, C.yellow, 36);
  chip(g, t, 11.0, 12.6, 'প্রথম কথা', 780, 1500, '#ff8fc8', 36);
  stamp(g, t, 12.85, 14.8, 'কে মুছে ফেললো?', 560, 88, '#ff3d6e', '#7a0f26');
  // L5-L6 15-17.3: "weak brain?" (myth)
  withPop(g, t, 15.2, 17.4, W / 2, 1430, () => {
    glassCard(g, 190, 1310, 700, 240, { line: 'rgba(255,61,110,0.5)' });
    label(g, 'আমরা ভাবি', 235, 1360, C.dim, 24);
    g.font = `800 64px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = C.pink; g.fillText('মস্তিষ্ক দুর্বল?', 235, 1440);
    rr(g, 235, 1500, 610, 16, 8); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fill(); rr(g, 235, 1500, 610 * 0.15, 16, 8); g.fillStyle = C.pink; g.fill();
  });
  // L7 17.5-19: can't record
  chip(g, t, 17.55, 19.0, 'REC ✕  রেকর্ড হয়নি?', W / 2, 1460, C.pink, 40);
  // L8 19-21.5: the opposite!
  stamp(g, t, 19.0, 21.5, 'সম্পূর্ণ উল্টো!', 560, 118, '#2ee59d', '#0b5a3a');
  // L9 21.5-25.3: recorded every moment
  withPop(g, t, 21.6, 25.4, W / 2, 1430, () => {
    glassCard(g, 160, 1300, 760, 260, { line: 'rgba(255,61,61,0.5)' });
    g.fillStyle = Math.floor(t * 2.5) % 2 ? '#ff2d2d' : 'rgba(255,45,45,0.25)'; g.beginPath(); g.arc(225, 1360, 14, 0, 7); g.fill();
    label(g, 'REC · প্রতিটি মুহূর্ত', 255, 1360, '#ff6b6b', 24);
    const n = Math.round(lerp(0, 98765, eOut((t - 21.8) / 3.2)));
    g.font = `800 92px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = C.white; g.fillText(bn(n.toLocaleString('en-IN')), 205, 1470);
  });
  // L10 25.3-29.3: destroyed by itself
  stamp(g, t, 25.4, 29.4, 'নিজেই ধ্বংস করেছে!', 560, 96, '#ff3d6e', '#7a0f26');
  // L11 29.3-30.1: why?
  stamp(g, t, 29.35, 30.6, 'কিন্তু কেনো?', 560, 120, '#ffc93c', '#7a4a00');
  // L12 30.1-38.4: hippocampus, first 3 years, lakhs of neurons per second
  if (t > 30.6 && t < 38.5) { const p = K.toScreen(V(0.2, 4.7, 45)); if (p.vis) chip(g, t, 30.6, 38.5, 'হিপোক্যাম্পাস', clamp(p.x + 120, 260, 820), p.y - 90, C.cyan, 34); }
  withPop(g, t, 32.2, 38.5, W / 2, 1450, () => {
    glassCard(g, 140, 1310, 800, 300, { line: 'rgba(83,224,255,0.5)' });
    label(g, 'জন্মের পর প্রথম ৩ বছর', 185, 1360, C.cyan, 24);
    const k = clamp((t - 34.2) / 0.3);
    if (k) { g.save(); g.globalAlpha *= k; g.font = `800 84px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = C.yellow; g.shadowColor = C.yellow; g.shadowBlur = 25; g.fillText('লাখ লাখ', 185, 1455); g.shadowBlur = 0; g.font = `700 36px ${FONT}`; g.fillStyle = C.white; g.fillText('নতুন নিউরন / সেকেন্ড', 520, 1460); g.restore(); }
    const k2 = clamp((t - 36.0) / 0.3);
    if (k2) { g.save(); g.globalAlpha *= k2; pill(g, 'কোষের বিস্ফোরণ', 185, 1550, C.green, { icon: true, size: 30 }); g.restore(); }
  });
  // L13 38.7-43.8: old wall -> new room
  withPop(g, t, 38.9, 43.9, W / 2, 1480, () => {
    glassCard(g, 140, 1380, 800, 200);
    const k1 = clamp((t - 39.0) / 0.3), k2 = clamp((t - 41.4) / 0.3);
    g.font = `800 52px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle';
    if (k1) { g.save(); g.globalAlpha *= k1; g.fillStyle = '#d7a07a'; g.fillText('পুরনো দেয়াল ✕', 185, 1450); g.restore(); }
    if (k2) { g.save(); g.globalAlpha *= k2; g.fillStyle = C.cyan; g.fillText('→ নতুন ঘর', 600, 1450); g.restore(); }
    const k3 = clamp((t - 42.2) / 0.3); if (k3) { g.save(); g.globalAlpha *= k3; pill(g, 'দেয়ালের ছবি নষ্ট', 185, 1530, C.pink, { icon: true, size: 28 }); g.restore(); }
  });
  // L14 43.8-49.4: same with new neurons -> memories erased forever
  chip(g, t, 44.0, 46.3, 'নতুন কোষ = নতুন দেয়াল', W / 2, 1480, C.cyan, 38);
  stamp(g, t, 46.4, 49.5, 'চিরতরে মুছে যায়!', 560, 104, '#ff3d6e', '#7a0f26');
  // L15 49.4-55.4: before 1.5 years: no "me", no language
  withPop(g, t, 49.6, 55.5, W / 2, 1440, () => {
    glassCard(g, 140, 1300, 800, 290, { line: 'rgba(166,107,255,0.5)' });
    label(g, 'দেড় বছরের আগে', 185, 1350, '#c7a6ff', 24);
    const rows = [["'আমি' বোধ", 50.4], ['ভাষা', 53.0]];
    rows.forEach(([s, t0], i) => { const k = clamp((t - t0) / 0.3); if (!k) return; g.save(); g.globalAlpha *= k; g.font = `800 56px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = C.white; g.fillText(s, 185, 1430 + i * 90); g.fillStyle = C.pink; g.fillText('✕', 820, 1430 + i * 90); g.restore(); });
  });
  // L16 55.7-59.1: no structure to hold memories
  withPop(g, t, 55.9, 59.2, W / 2, 1480, () => { pill(g, 'জমা রাখার কাঠামো নেই', W / 2, 1480, C.orange, { center: true, icon: true, size: 40 }); });
  // L17 59.4-66.1: sacrificed to build today's you
  withPop(g, t, 59.6, 66.2, W / 2, 1450, () => {
    glassCard(g, 160, 1330, 760, 240, { line: 'rgba(255,201,60,0.5)' });
    label(g, 'তৈরি হলো', 205, 1380, C.yellow, 24);
    g.font = `800 66px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = C.white; g.fillText("বুদ্ধিমান 'আপনি'", 205, 1465);
  });
  stamp(g, t, 63.3, 66.2, 'স্মৃতির কোরবানি', 560, 104, '#ff8a3d', '#7a3a00');
  // L18-19 66.3-71: comment card
  withPop(g, t, 66.5, 71.5, W / 2, 1440, () => {
    glassCard(g, 90, 1310, 900, 260);
    g.fillStyle = C.yellow; g.beginPath(); g.arc(140, 1364, 16, 0, 7); g.fill();
    label(g, 'কমেন্ট করে জানান', 172, 1364, C.yellow, 24);
    g.font = `700 42px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = C.white;
    g.fillText('সবচেয়ে পুরনো স্মৃতি কোনটা?', 140, 1440);
    const ans = 'মায়ের কোলে প্রথম বৃষ্টি...'; const ty = typeText(t, 68.2, ans, 12);
    g.fillStyle = C.yellow; g.fillText(ty, 140, 1510);
    if (Math.floor(t * 3) % 2 === 0) { g.fillStyle = C.white; g.fillRect(146 + g.measureText(ty).width, 1488, 4, 46); }
  });
};

window.SFXEV = [
  [0.25, 'slam'], [0.4, 'sparkle'], [4.2, 'pop'], [4.4, 'rise'], [6.9, 'pop'], [7.3, 'erase'], [7.9, 'erase'], [8.5, 'erase'],
  [9.9, 'whoosh'], [10.2, 'pop'], [11.0, 'pop'], [12.85, 'shatter'], [12.9, 'slam'],
  [14.9, 'whoosh'], [15.2, 'pop'], [15.6, 'bad'], [17.55, 'rec'], [19.0, 'slam'], [19.1, 'zap'], [21.5, 'rec'], [21.8, 'rise'],
  [22.6, 'tick'], [23.4, 'tick'], [24.2, 'tick'], [25.4, 'shatter'], [25.45, 'slam'], [29.35, 'slam'],
  [30.2, 'whoosh'], [30.6, 'pop'], [31.6, 'zap'], [32.2, 'pop'], [33.0, 'zap'], [34.2, 'tick'], [34.4, 'zap'], [35.6, 'zap'], [36.0, 'good'], [37.0, 'zap'],
  [38.6, 'whoosh'], [39.0, 'pop'], [39.8, 'rumble'], [40.9, 'shatter'], [41.4, 'build'], [42.2, 'tick'], [44.0, 'pop'], [44.6, 'zap'], [46.4, 'slam'], [46.5, 'erase'],
  [48.9, 'whoosh'], [49.6, 'pop'], [50.4, 'bad'], [52.6, 'sparkle'], [53.0, 'bad'], [55.8, 'whoosh'], [55.9, 'pop'],
  [56.2, 'drop'], [56.7, 'drop'], [57.3, 'drop'], [59.0, 'whoosh'], [59.6, 'pop'], [60.6, 'rise'], [61.6, 'burn'], [63.3, 'slam'],
  [65.8, 'whoosh'], [66.4, 'sparkle'], [66.5, 'pop'], [68.2, 'type'],
];

boot();
