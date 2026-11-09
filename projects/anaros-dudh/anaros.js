// anaros.js: "আনারস + দুধ = বিষ?" Neon Tech 3D short (86 s, voice: voice.wav).
// One continuous camera through a dark grid world with stations:
//  A dining table (0,0)  B myth/fact pedestals (0,30)  C stomach + pineapple/milk pedestals (0,60)
//  D bowl (-6,95)  E stomach HCl (6,125)  F shield + poison bottle (-6,160)  G globe + drinks (6,195)
//  H problem stomach (-5,235)  I end: bottle X + happy pair (5,262)
import * as K from '../neon-tech-short/kit/core3d.js';
import { V, cl, sm, pedestal, woodTex, pineapple, pineSlice, glassOf, bowlOf, stomach, stomachUpdate, poisonBottle, shield, milkshake, enzyme } from '../neon-tech-short/kit/objects3d.js';
const { THREE } = K;
const env = (t, a, b, fi = 0.4, fo = 0.4) => sm(a, a + fi, t) * (1 - sm(b - fo, b, t));

CFG.duration = 86; CFG.captions = false;
K.seed(42);

// ---------------- world ----------------
K.gridFloor(1400, 6);
K.scene.fog = new THREE.FogExp2(0x10143a, 0.0105);
K.dust(900, -60, 60, -30, 300, 25);

// pedestal: hex base + glowing rim
// ---------------- stations ----------------
// A: dining table under a warm lamp
const A = K.group(0, 0, 0);
{
  const wood = K.std({ map: woodTex, roughness: 0.6 });
  K.box(9, 0.35, 5.6, wood, 0, 3.0, 0, A);
  for (const [x, z] of [[-4, -2.4], [4, -2.4], [-4, 2.4], [4, 2.4]]) K.box(0.35, 3.0, 0.35, wood, x, 1.5, z, A);
  K.mesh(new THREE.CircleGeometry(2.1, 40), K.std({ color: 0xbfa27a, roughness: 1 }), 0.6, 3.19, 0.4, A).rotation.x = -Math.PI / 2; // place mat
  const plate = K.mesh(new THREE.CylinderGeometry(1.5, 1.2, 0.14, 48), K.std({ color: 0xc9ccd6, roughness: 0.4 }), 0.6, 3.25, 0.4, A);
  pineSlice(A, 0.2, 3.42, 0.5, 0.9, 0.0); pineSlice(A, 1.0, 3.5, 0.2, 0.85, 0.25); pineSlice(A, 0.7, 3.6, 0.9, 0.8, -0.2);
  pineapple(A, -2.4, 3.18, -0.6, 0.95);
  A.userData.glass = glassOf(A, 2.9, 3.18, -0.2, 0xf5f1e8, 1.0);
  // hanging lamp
  const lamp = K.group(0.3, 9.2, 0, A);
  K.mesh(new THREE.ConeGeometry(1.6, 1.3, 40, 1, true), K.std({ color: 0x1f5a3c, roughness: 0.5, side: THREE.DoubleSide }), 0, 0, 0, lamp);
  K.mesh(new THREE.CylinderGeometry(0.03, 0.03, 12, 6), K.std({ color: 0x222222 }), 0, 6.5, 0, lamp);
  K.mesh(new THREE.SphereGeometry(0.32, 16, 12), K.basic({ color: 0xfff1c8 }), 0, -0.5, 0, lamp);
  K.glowSprite(0xffd890, 4, 0.7, lamp).position.y = -0.6;
  const sp = new THREE.SpotLight(0xffd29a, 40, 26, 0.9, 0.7, 1.4); sp.position.set(0, -0.5, 0); sp.target.position.set(0, -9, 0); lamp.add(sp); lamp.add(sp.target);
  const pl = new THREE.PointLight(0xffb870, 6, 14, 1.5); pl.position.set(0, -1, 0); lamp.add(pl);
  // chairs
  const chairM = K.std({ color: 0x3b2614, roughness: 0.7 });
  for (const s of [-1, 1]) { const c = K.group(s * 2.2, 0, s * 4.2, A); K.box(2.2, 0.25, 2.0, chairM, 0, 2.0, 0, c); K.box(2.2, 2.6, 0.22, chairM, 0, 3.3, s * 0.95, c); for (const [a, b] of [[-0.9, -0.8], [0.9, -0.8], [-0.9, 0.8], [0.9, 0.8]]) K.box(0.18, 2.0, 0.18, chairM, a, 1.0, b, c); }
  // fake "poison" fumes from the glass (myth visual)
  A.userData.fumes = K.instanced(new THREE.SphereGeometry(0.16, 10, 8), K.std({ color: 0x6cff4a, emissive: 0x3cff2a, emissiveIntensity: 1, transparent: true, opacity: 0.8 }), 18, A);
  A.userData.skull = K.textSprite((c) => {
    c.fillStyle = '#7dff5a'; c.shadowColor = '#3cff2a'; c.shadowBlur = 30;
    c.beginPath(); c.arc(256, 210, 130, 0, 7); c.fill(); c.fillRect(176, 290, 160, 80);
    c.shadowBlur = 0; c.fillStyle = '#0b1a08'; c.beginPath(); c.arc(205, 205, 38, 0, 7); c.arc(307, 205, 38, 0, 7); c.fill();
    c.beginPath(); c.moveTo(256, 250); c.lineTo(236, 290); c.lineTo(276, 290); c.fill();
    for (const x of [206, 246, 286]) c.fillRect(x, 320, 18, 46);
  }, 512, 512, 2.6, A);
  A.userData.skull.position.set(2.9, 7.2, -0.2);
  A.userData.q = K.textSprite((c) => {
    c.font = '800 400px PJS'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const gr = c.createLinearGradient(0, 60, 0, 460); gr.addColorStop(0, '#fff3a8'); gr.addColorStop(1, '#ffa812');
    c.shadowColor = '#ffb21a'; c.shadowBlur = 40; c.fillStyle = gr; c.fillText('?', 256, 280);
  }, 512, 512, 3.6, A);
  A.userData.q.position.set(0.3, 6.8, 0.2);
}

// B: myth / fact pedestals
const Bm = pedestal(-4.5, 30, 0xff2d55), Bf = pedestal(4.5, 30, 0x2ee59d);
pineapple(Bm, -0.6, 1.2, 0, 0.55); glassOf(Bm, 0.8, 1.2, 0.2, 0xf5f1e8, 0.7);
const Bskull = K.textSprite((c) => { c.font = '800 300px PJS'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ff2d55'; c.shadowColor = '#ff2d55'; c.shadowBlur = 30; c.fillText('✕', 256, 270); }, 512, 512, 2.4, Bm); Bskull.position.set(0, 4.6, 0);
shield(Bf, 0, 3.4, 0, 0.75);

// C: stomach + pineapple / milk pedestals
const SC = stomach(null, -1.0, 4.2, 62, 2.0);
const Cp = pedestal(-9, 56, 0xffc93c), Cm = pedestal(9, 56, 0x53e0ff);
pineapple(Cp, 0, 1.2, 0, 0.9);
const Cglass = glassOf(Cm, 0, 1.2, 0, 0xf5f1e8, 1.1);
const enz = []; for (let i = 0; i < 8; i++) enz.push(enzyme(null));
const acid = K.instanced(new THREE.SphereGeometry(0.13, 10, 8), K.std({ color: 0xc8ff4a, emissive: 0x9cff2a, emissiveIntensity: 0.9, transparent: true, opacity: 0.8 }), 26);
const acidP = []; for (let i = 0; i < 26; i++) acidP.push([K.rnd(0, 6.28), K.rnd(1.6, 3.0), K.rnd(1.5, 5.5), K.rnd(0.5, 1.5)]);
const CH = 5, BEADS = 16;
const beads = K.instanced(new THREE.SphereGeometry(0.11, 12, 10), K.std({ color: 0x9fe8ff, emissive: 0x53e0ff, emissiveIntensity: 0.6, roughness: 0.3 }), CH * BEADS);
const chainP = []; for (let c = 0; c < CH; c++) chainP.push([c * 1.26, K.rnd(2.6, 4.2), K.rnd(2.2, 3.4), K.rnd(0.3, 0.8)]);

// D: bowl
const Dp = pedestal(-6, 95, 0xffc93c, 3.6, 1.0);
const bowl = bowlOf(Dp, 0, 1.0, 0, 1.0);
{ const bl = new THREE.PointLight(0xffe2b0, 7, 14, 1.4); bl.position.set(0, 7, 1); Dp.add(bl); }
const chunks = K.instanced(new THREE.BoxGeometry(0.45, 0.4, 0.45), K.std({ color: 0xffd23a, emissive: 0x6a4a00, roughness: 0.5 }), 10, Dp);
const chunkP = []; for (let i = 0; i < 10; i++) chunkP.push([K.rnd(-1.6, 1.6), K.rnd(-1.6, 1.6), K.rnd(0, 0.6), K.rnd(0, 6)]);
const bcurd = K.instanced(new THREE.IcosahedronGeometry(0.2, 1), K.std({ color: 0xfff1cc, roughness: 0.7, emissive: 0xb8a070, emissiveIntensity: 0.12 }), 70, Dp);
const bcurdP = []; for (let i = 0; i < 70; i++) { const a = K.rnd(0, 6.28), r = Math.sqrt(K.rnd(0, 1)) * 2.2; bcurdP.push([Math.cos(a) * r, Math.sin(a) * r, K.rnd(0.6, 1.5), K.rnd(0, 1)]); }
const bowlPine = pineapple(Dp, 3.6, 1.0, -1.4, 0.0001);

// E: stomach with HCl
const SE = stomach(null, 4.5, 4.4, 126, 2.0);
const stream = K.mesh(new THREE.CylinderGeometry(0.14, 0.14, 1, 12), K.std({ color: 0xf8f6ef, emissive: 0x555555 }), 0, 0, 0);
const Eglass = glassOf(null, 0.6, 15.5, 126, 0xf5f1e8, 1.0); Eglass.rotation.z = -2.1;
const hcl = K.instanced(new THREE.SphereGeometry(0.12, 10, 8), K.std({ color: 0xd4ff3a, emissive: 0xb8ff1a, emissiveIntensity: 1, transparent: true, opacity: 0.85 }), 24);
const hclP = []; for (let i = 0; i < 24; i++) hclP.push([K.rnd(-2.5, 4.0), K.rnd(-1.4, 1.4), K.rnd(0, 1), K.rnd(0.6, 1.4)]);

// F: science shield + poison bottle with X
const Fp = pedestal(-7.5, 160, 0x2ee59d), Fb = pedestal(-1.5, 162, 0xa66bff);
const Fsh = shield(Fp, 0, 4.2, 0, 0.9);
const Fbot = poisonBottle(Fb, 0, 1.2, 0, 1.0);

// G: globe + drinks
const globeTex = await new THREE.TextureLoader().loadAsync('../../assets/maps/tiles/bm_overview_6000.jpg'); globeTex.colorSpace = THREE.SRGBColorSpace;
const G = K.group(8, 9, 198);
const globe = K.mesh(new THREE.SphereGeometry(6, 64, 48), K.std({ map: globeTex, emissive: 0xffffff, emissiveMap: globeTex, emissiveIntensity: 0.45, roughness: 0.8 }), 0, 0, 0, G);
K.glowSprite(0x5a8cff, 19, 0.45, G);
const pins = [];
for (const [lat, lon] of [[38, -97], [23, -102], [-10, -52], [13, 122], [15, 101], [22, 79], [-25, 134], [36, 138], [9, -79]]) {
  const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
  const n = V(-Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
  const pg = K.group(0, 0, 0, globe); pg.position.copy(n.clone().multiplyScalar(6.02)); pg.quaternion.setFromUnitVectors(V(0, 1, 0), n);
  K.mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6), K.basic({ color: 0xffc93c }), 0, 0.45, 0, pg);
  K.mesh(new THREE.SphereGeometry(0.2, 12, 8), K.basic({ color: 0xffc93c }), 0, 0.95, 0, pg);
  K.glowSprite(0xffc93c, 1.6, 0.8, pg).position.y = 0.95; pg.scale.setScalar(0.001); pins.push(pg);
}
const Gd1 = pedestal(-2, 188, 0xffc93c, 1.8, 1), Gd2 = pedestal(3.5, 184, 0xff8fc8, 1.8, 1), Gd3 = pedestal(13.5, 188, 0x2ee59d, 1.8, 1);
const shake1 = milkshake(Gd1, 0, 1, 0, 1.0, 0xffe28a);
const shake2 = milkshake(Gd2, 0, 1, 0, 0.9, 0xffc46b);
const dessert = bowlOf(Gd3, 0, 1, 0, 0.5);
for (let i = 0; i < 7; i++) K.box(0.5, 0.45, 0.5, K.std({ color: 0xffd23a, emissive: 0x5a3a00 }), K.rnd(-1.4, 1.4), 1.75, K.rnd(-1.4, 1.4), Gd3).rotation.y = i;

// H: problem stomach (acidic, gas)
const SH = stomach(null, -6, 4.4, 238, 2.0, 0xff5a5a);
const phBar = pedestal(4, 236, 0xff8a3d, 1.6, 1.0);
pineapple(phBar, 0, 1.0, 0, 0.6);

// I: end - bottle with X + happy pair
const Ib = pedestal(1, 262, 0xff2d55, 2.2), Ip = pedestal(9, 262, 0x2ee59d, 2.6);
const Ibot = poisonBottle(Ib, 0, 1.2, 0, 0.9);
pineapple(Ip, -0.9, 1.2, 0, 0.6); milkshake(Ip, 1.0, 1.2, 0.2, 0.75);

// ---------------- camera (one continuous move) ----------------
K.setCamKeys([
  { t: 0.0, p: [0.4, 6.4, 10.5], l: [0.3, 3.8, 0], fov: 44 },
  { t: 3.2, p: [2.0, 5.6, 5.6], l: [1.6, 4.2, 0] },
  { t: 5.6, p: [4.6, 6.4, 4.6], l: [2.9, 5.2, -0.2] },
  { t: 9.8, p: [-8.5, 8.5, 11], l: [0, 3.6, 0] },
  { t: 14.4, p: [7.5, 8.0, 9.5], l: [0.3, 4.4, 0] },
  { t: 16.0, p: [0, 6.8, 15.5], l: [0, 2.2, 30] },
  { t: 17.6, p: [0, 7.5, 19.5], l: [0, 2.8, 31] },
  { t: 20.6, p: [0.5, 8.5, 37], l: [0.5, 7, 62] },
  { t: 24.0, p: [-6, 6.8, 45.5], l: [-9, 3.0, 56] },
  { t: 28.6, p: [6, 7, 45.5], l: [9, 3.2, 56] },
  { t: 31.2, p: [2, 8.5, 42], l: [4, 4.5, 57] },
  { t: 34.0, p: [-7, 9, 83], l: [-6, 2.4, 95] },
  { t: 38.4, p: [-4.5, 6.4, 89], l: [-6, 2.2, 95] },
  { t: 41.6, p: [5, 10, 99], l: [6, 8, 126] },
  { t: 45.6, p: [3, 11.5, 98], l: [5.5, 9, 126] },
  { t: 50.8, p: [14, 9.5, 101], l: [6, 8, 126] },
  { t: 52.4, p: [-2.5, 8.5, 142], l: [-5.5, 4, 160] },
  { t: 54.0, p: [-2, 8.5, 147], l: [-5.5, 3.5, 161] },
  { t: 59.0, p: [-6, 6, 151], l: [-2.5, 3.2, 162] },
  { t: 62.5, p: [-2, 11, 174], l: [6, 7.5, 196] },
  { t: 66.4, p: [18, 10, 170], l: [7, 6.5, 194] },
  { t: 69.0, p: [0, 11, 208], l: [-2, 7.5, 238] },
  { t: 74.0, p: [-3, 10, 210], l: [-2.5, 7.5, 238] },
  { t: 79.8, p: [-11, 9, 213], l: [-3, 7, 238] },
  { t: 81.2, p: [7, 9, 232], l: [5, 4, 262] },
  { t: 82.4, p: [5, 7.5, 249], l: [5, 3.5, 262] },
  { t: 86.0, p: [8, 10, 246], l: [5, 3.0, 262] },
]);
K.hooks.shake = t => { let a = 0; for (const [s, amp] of SHAKE_T) { const k = (t - s) / 0.45; if (k > 0 && k < 1) a += amp * (1 - k); } return [Math.sin(t * 93) * a, Math.cos(t * 71) * a]; };
const SHAKE_T = [[0.15, 0.22], [15.5, 0.12], [31.25, 0.1], [51.55, 0.1], [55.6, 0.12], [66.75, 0.1], [80.6, 0.14]];

// ---------------- per-frame updates ----------------
const VIS = [
  [[A], 0, 18.5], [[Bm, Bf], 12, 24], [[SC, Cp, Cm, acid, beads, ...enz], 14, 37], [[Dp], 27, 45],
  [[SE, stream, Eglass, hcl], 35, 57], [[Fp, Fb], 47, 67], [[G, Gd1, Gd2, Gd3], 55, 73], [[SH, phBar], 62, 81.6], [[Ib, Ip], 74, 86.5],
];
function update(t) {
  for (const [objs, a, b] of VIS) for (const o of objs) o.visible = t >= a && t <= b;
  // A: fumes + skull (myth) 3.4-5.6, question mark 10.7-14.6
  const fum = env(t, 3.3, 6.0, 0.3, 0.5);
  for (let i = 0; i < 18; i++) { const k = (t * 0.5 + i / 18) % 1; K.setInst(A.userData.fumes, i, [2.9 + Math.sin(i * 3 + t) * 0.4 * k, 5.0 + k * 2.4, -0.2 + Math.cos(i * 2) * 0.3 * k], fum * (0.5 + k)); }
  A.userData.fumes.instanceMatrix.needsUpdate = true;
  A.userData.skull.material.opacity = fum; A.userData.skull.scale.setScalar(2.6 * (0.7 + 0.3 * sm(3.3, 3.8, t)));
  const q = env(t, 10.6, 14.8, 0.35, 0.4); A.userData.q.material.opacity = q; A.userData.q.position.y = 6.8 + 0.2 * Math.sin(t * 3);
  A.userData.q.scale.setScalar(3.6 * (0.6 + 0.4 * sm(10.6, 11.0, t)));
  // B pedestals pulse
  Bm.userData.rim.material.color.setHSL(0.97, 1, 0.5 + 0.1 * Math.sin(t * 4));
  // C: stomach glow; enzymes orbit pineapple, then fly to milk chains and cut
  stomachUpdate(SC, t, { curd: 0, bub: 0, pulse: env(t, 17.4, 21, 0.4, 0.6) });
  const fly = sm(29.0, 30.6, t);
  enz.forEach((e, i) => {
    const a = t * 0.9 + i * 0.785, r = 2.6 + 0.4 * Math.sin(t + i);
    const home = V(-9 + Math.cos(a) * r, 3.2 + Math.sin(t * 1.3 + i) * 0.6, 56 + Math.sin(a) * r);
    const c = chainP[i % CH], tgt = V(9 + Math.cos(c[0] + t * 0.3) * c[2], c[1] + 0.2, 56 + Math.sin(c[0] + t * 0.3) * c[2]);
    e.position.copy(home.lerp(tgt, fly));
    e.lookAt(K.camera.position); e.rotation.z += Math.sin(t * 10 + i) * 0.3;
    e.scale.setScalar(0.62 * env(t, 20.8, 32.5, 0.5, 0.6) * (1 + 0.15 * Math.sin(t * 12 + i)));
  });
  const ac = env(t, 22.4, 26.4, 0.5, 0.5);
  acidP.forEach(([a, y, r, sp], i) => K.setInst(acid, i, [-9 + Math.cos(a + t * 0.4 * sp) * r * 0.6, y + 0.3 * Math.sin(t * 2 * sp + i), 56 + Math.sin(a + t * 0.4 * sp) * r * 0.6], ac));
  acid.instanceMatrix.needsUpdate = true;
  const pr = env(t, 25.9, 32.5, 0.5, 0.6), cut = sm(30.0, 31.2, t);
  chainP.forEach(([a0, y, r, ph], c) => {
    const a = a0 + t * 0.3;
    for (let b = 0; b < BEADS; b++) {
      const seg = Math.floor(b / 4), sp = (b - 7.5) * 0.24 + (seg - 1.5) * cut * 0.5;
      const dir = V(-Math.sin(a), 0, Math.cos(a));
      const p = V(9 + Math.cos(a) * r, y + Math.sin(b * 0.9 + t * 2 + ph * 6) * 0.25, 56 + Math.sin(a) * r).addScaledVector(dir, sp);
      K.setInst(beads, c * BEADS + b, [p.x, p.y, p.z], pr);
    }
  });
  beads.instanceMatrix.needsUpdate = true;
  // D: bowl - chunks fall 33.0-34.4, curds 34.8-38.6
  chunkP.forEach(([x, z, dl, r], i) => {
    const k = sm(32.8 + dl, 33.9 + dl, t), y = 1.0 + 1.3 + (1 - k) * 6 - 0.1 * sm(34, 36, t);
    K.setInst(chunks, i, [x, k > 0 ? y : -50, z], 1, r + t * (1 - k) * 3, r, 0);
  });
  chunks.instanceMatrix.needsUpdate = true;
  const cu = sm(34.6, 38.2, t);
  bcurdP.forEach(([x, z, s, ph], i) => { const k = cl(cu * 1.7 - ph * 0.7); K.setInst(bcurd, i, [x, 2.28 + 0.04 * Math.sin(t * 2 + i), z], k * s, i, i, 0); });
  bcurd.instanceMatrix.needsUpdate = true;
  bowl.userData.surf.material.color.set(new THREE.Color(0xf6f3ea).lerp(new THREE.Color(0xf0e2b0), cu));
  bowlPine.scale.setScalar(Math.max(0.0001, env(t, 32.2, 39.0, 0.4, 0.4) * 0.6));
  // E: same in stomach (39-42 curds w/ pineapple yellow), then plain milk + HCl (43.8-51.2)
  const ePhase1 = env(t, 39.0, 43.6, 0.4, 0.6), ePhase2 = sm(46.6, 50.4, t);
  stomachUpdate(SE, t, { curd: Math.max(ePhase1 * sm(39.0, 41.2, t), ePhase2), bub: 0, liqColor: t < 43.7 ? 0xf3e6b4 : 0xf6f2e8, pulse: env(t, 42.3, 43.6, 0.2, 0.3) * 0.6, glowCol: t > 42.2 && t < 43.7 ? 0x2ee59d : 0xff6f91 });
  const pour = env(t, 43.9, 47.2, 0.4, 0.5);
  stream.visible = pour > 0.02;
  const sTop = V(1.2, 14.7, 126), sBot = V(1.6, 7.6, 126);
  stream.position.copy(sTop).lerp(sBot, 0.5); stream.scale.set(pour, sTop.distanceTo(sBot) * sm(43.9, 44.6, t), pour);
  Eglass.visible = env(t, 43.4, 47.8, 0.4, 0.4) > 0.02; Eglass.scale.setScalar(Math.max(0.001, env(t, 43.4, 47.8, 0.4, 0.4)));
  const hk = env(t, 45.6, 51.4, 0.4, 0.5);
  hclP.forEach(([x, z, ph, sp], i) => { const k = (t * 0.3 * sp + ph) % 1; K.setInst(hcl, i, [4.5 + x * 0.9, 4.4 + 4.6 - k * 2.4, 126 + z], hk * (1 - k * 0.5)); });
  hcl.instanceMatrix.needsUpdate = true;
  // F: shield pops at 51.6, X on bottle at 55.6
  Fsh.scale.setScalar(Math.max(0.001, 0.9 * sm(51.4, 52.0, t))); Fsh.rotation.y = Math.sin(t * 0.8) * 0.4;
  Fbot.userData.X.scale.setScalar(Math.max(0.001, sm(55.5, 55.85, t)));
  Fbot.rotation.y = t * 0.3;
  // G: globe spin + pins pop 60-64
  globe.rotation.y = -1.2 + t * 0.12;
  pins.forEach((p, i) => p.scale.setScalar(Math.max(0.001, sm(60.2 + i * 0.35, 60.6 + i * 0.35, t))));
  shake1.rotation.y = t * 0.5; shake2.rotation.y = -t * 0.4;
  // H: acidic stomach: red pulse, gas bubbles from 74
  stomachUpdate(SH, t, { curd: sm(74.5, 77, t) * 0.6, bub: sm(74.4, 75.4, t), liqColor: 0xf0d48a, pulse: env(t, 68, 80.2, 0.6, 0.6), glowCol: 0xff5a3a });
  // I: end X
  Ibot.userData.X.scale.setScalar(Math.max(0.001, sm(80.6, 80.95, t)));
  Ibot.rotation.y = -t * 0.3;
}
window.BG3D = t => K.draw(t, update);

// ---------------- 2D UI (cards, stamps) ----------------
function anchor(v) { return K.toScreen(v); }
function bnum(n) { return String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]); }

SCENE.ui = (g, t) => {
  // 0-3: খবরদার!
  stamp(g, t, 0.12, 3.1, 'খবরদার!', 560, 170, '#ff3d6e', '#7a0f26');
  withPop(g, t, 1.0, 3.2, W / 2, 1460, () => {
    glassCard(g, 170, 1380, 740, 170, { line: 'rgba(255,61,110,0.5)' });
    g.font = `800 52px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = C.yellow; g.fillText('আনারস', 380, 1468); g.fillStyle = C.white; g.fillText('→', 540, 1468); g.fillStyle = '#f4f1ea'; g.fillText('দুধ', 660, 1468);
    g.fillStyle = C.pink; g.fillText('✕', 800, 1466);
  });
  // 3.4-5.6: বিষ → মৃত্যু?
  withPop(g, t, 3.5, 5.8, W / 2, 1400, () => {
    glassCard(g, 230, 1310, 620, 190, { line: 'rgba(255,61,110,0.55)' });
    label(g, 'পেটে তৈরি হবে', 275, 1355, C.dim, 24);
    g.font = `800 72px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = C.pink; g.shadowColor = C.pink; g.shadowBlur = 25;
    g.fillText('বিষ ☠ মৃত্যু?', 275, 1440); g.shadowBlur = 0;
  });
  // 6-10: elders' warning quote card
  withPop(g, t, 6.2, 10.3, W / 2, 1400, () => {
    glassCard(g, 120, 1270, 840, 270);
    g.fillStyle = 'rgba(255,201,60,0.15)'; g.beginPath(); g.arc(200, 1345, 46, 0, 7); g.fill();
    g.font = `800 56px ${FONT}`; g.fillStyle = C.yellow; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('“', 200, 1360);
    g.textAlign = 'left'; g.font = `800 40px ${FONT}`; g.fillStyle = C.white; g.fillText('বাড়ির বড়রা', 270, 1330);
    label(g, 'ছোটবেলা থেকে শুনে আসছি', 272, 1376, C.dim, 22);
    const line = 'আনারসের পর দুধ খাবি না!';
    g.font = `700 46px ${FONT}`; g.fillStyle = mix(C.white, C.yellow, 0.5); g.fillText(typeText(t, 7.0, line, 14), 170, 1470);
  });
  // 10.7-14.5: equation
  if (t > 10.8 && t < 14.7) {
    const items = [['আনারস', C.yellow, 11.0], ['+', C.white, 11.5], ['দুধ', '#f4f1ea', 11.9], ['=', C.white, 12.6], ['বিষ?', C.pink, 13.1]];
    let x = 150; g.save();
    const a = clamp((14.7 - t) / 0.3);
    items.forEach(([s, c, t0]) => {
      g.font = `800 80px ${FONT}`; const w = g.measureText(s).width;
      const k = eOut((t - t0) / 0.3); if (k > 0) {
        g.globalAlpha = k * a; g.fillStyle = c; g.shadowColor = c; g.shadowBlur = c === C.pink ? 35 : 10;
        g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(s, x, 1470 + (1 - k) * 30);
      }
      x += w + 30;
    });
    g.restore();
  }
  // 14.9-17.1: মিথ vs ফ্যাক্ট
  if (t > 14.9 && t < 17.4) {
    stamp(g, t, 15.45, 17.4, 'মিথ', 560, 150, '#ff3d6e', '#7a0f26', -0.06);
    stamp(g, t, 15.9, 17.4, 'vs', 700, 80, '#ffffff', '#444466', 0);
    stamp(g, t, 16.3, 17.4, 'ফ্যাক্ট', 830, 150, '#2ee59d', '#0b5a3a', -0.06);
  }
  // 17.5-20.5: পেটের ভেতর
  chip(g, t, 18.9, 20.7, 'পেটের ভেতর কী ঘটে?', W / 2, 1500, C.pink, 38);
  // 21-25.8: pineapple card
  withPop(g, t, 21.0, 26.0, W / 2, 1420, () => {
    glassCard(g, 140, 1280, 800, 300, { line: 'rgba(255,201,60,0.45)' });
    label(g, 'আনারসের ভেতরে', 185, 1330, C.yellow, 24);
    const r1 = clamp((t - 21.8) / 0.3), r2 = clamp((t - 24.2) / 0.3);
    g.globalAlpha *= 1; if (r1) { g.save(); g.globalAlpha = r1; pill(g, 'ব্রোমেলেইন · এনজাইম', 185, 1410, C.yellow, { icon: true, size: 36 }); g.restore(); }
    if (r2) { g.save(); g.globalAlpha = r2; pill(g, 'সাইট্রিক অ্যাসিড', 185, 1505, '#c8ff4a', { icon: true, size: 36 }); g.restore(); }
  });
  // 26.2-28.8: milk card
  withPop(g, t, 26.3, 29.0, W / 2, 1420, () => {
    glassCard(g, 180, 1300, 720, 240, { line: 'rgba(83,224,255,0.45)' });
    label(g, 'দুধের ভেতরে', 225, 1350, C.cyan, 24);
    g.font = `800 64px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = C.white; g.fillText('প্রচুর প্রোটিন', 225, 1430);
    rr(g, 225, 1490, 630, 14, 7); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fill();
    rr(g, 225, 1490, 630 * eOut((t - 26.6) / 1.4), 14, 7); g.fillStyle = C.cyan; g.fill();
  });
  // 29.2-30.9: big ?
  stamp(g, t, 29.2, 31.0, 'একসাথে খেলে?', 600, 110, '#ffc93c', '#7a4a00');
  // 31.2-31.9: ফ্যাক্ট ১
  stamp(g, t, 31.2, 32.6, 'ফ্যাক্ট ১', 600, 150, '#2ee59d', '#0b5a3a');
  // 32.3-38.7: bowl steps
  withPop(g, t, 32.7, 38.9, W / 2, 1450, () => {
    glassCard(g, 110, 1330, 860, 250);
    label(g, 'বাটিতে পরীক্ষা', 155, 1380, C.dim, 24);
    const st = [['দুধ', '#f4f1ea', 32.9], ['+ টক আনারস', C.yellow, 33.6], ['→ ছানা কাটে', C.green, 35.4]];
    let x = 155;
    st.forEach(([s, c, t0]) => { g.font = `800 52px ${FONT}`; const w = g.measureText(s).width; const k = eOut((t - t0) / 0.3); if (k > 0) { g.save(); g.globalAlpha *= k; g.fillStyle = c; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(s, x, 1470 + (1 - k) * 20); g.restore(); } x += w + 22; });
    const k2 = clamp((t - 36.6) / 0.3); if (k2) { g.save(); g.globalAlpha *= k2; pill(g, 'দইয়ের মতো জমাট', 155, 1540, C.cyan, { icon: true, size: 28 }); g.restore(); }
  });
  // 39.1-42: stomach same
  chip(g, t, 39.4, 42.2, 'পাকস্থলীতেও ঠিক একই ঘটনা', W / 2, 1500, C.yellow, 36);
  // 42.3-43.5: ভয়ের কিছুই নেই
  stamp(g, t, 42.35, 43.7, 'ভয়ের কিছুই নেই', 560, 104, '#2ee59d', '#0b5a3a', -0.04);
  // 43.8-51.2: শুধু দুধ + HCl
  chip(g, t, 43.9, 45.6, 'শুধু দুধ খেলেও', W / 2, 1500, '#f4f1ea', 38);
  withPop(g, t, 45.8, 51.4, W / 2, 1440, () => {
    glassCard(g, 110, 1300, 860, 290, { line: 'rgba(200,255,74,0.45)' });
    label(g, 'পেটের অ্যাসিড', 155, 1350, '#c8ff4a', 24);
    g.font = `800 70px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#d4ff3a'; g.shadowColor = '#b8ff1a'; g.shadowBlur = 25; g.fillText('HCl', 155, 1430); g.shadowBlur = 0;
    g.font = `700 36px ${FONT}`; g.fillStyle = C.white; g.fillText('হাইড্রোক্লোরিক অ্যাসিড', 310, 1432);
    const k = clamp((t - 47.4) / 0.3), k3 = clamp((t - 49.6) / 0.3);
    if (k) { g.save(); g.globalAlpha *= k; pill(g, 'দুধ → ছানা', 155, 1525, C.cyan, { icon: true, size: 30 }); g.restore(); }
    if (k3) { g.save(); g.globalAlpha *= k3; pill(g, 'হজম ✓', 520, 1525, C.green, { icon: true, size: 30 }); g.restore(); }
  });
  // 51.5-54.3: ফ্যাক্ট ২ + science/doctors
  stamp(g, t, 51.5, 53.0, 'ফ্যাক্ট ২', 560, 150, '#2ee59d', '#0b5a3a');
  withPop(g, t, 52.6, 54.6, W / 2, 1480, () => {
    pill(g, 'বিজ্ঞান', W / 2 - 170, 1480, C.cyan, { center: true, icon: true, size: 38 });
    pill(g, 'চিকিৎসক', W / 2 + 170, 1480, C.green, { center: true, icon: true, size: 38 });
  });
  // 54.7-59.4: poison = 0
  withPop(g, t, 54.9, 59.6, W / 2, 1440, () => {
    glassCard(g, 190, 1300, 700, 290, { line: 'rgba(46,229,157,0.45)' });
    label(g, 'শরীরে তৈরি বিষ / পয়জন', 235, 1350, C.dim, 24);
    const v = Math.round(lerp(100, 0, eOut((t - 55.2) / 1.0)));
    g.font = `800 130px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = v > 0 ? C.pink : C.green; g.shadowColor = g.fillStyle; g.shadowBlur = 35;
    g.fillText(bnum(v) + '%', 235, 1475); g.shadowBlur = 0;
    if (t > 56.4) pill(g, 'তৈরি করে না', 600, 1475, C.green, { center: true, icon: true, size: 30 });
  });
  // 59.9-66.3: world
  chip(g, t, 60.0, 62.2, 'পৃথিবীর বহু দেশে', W / 2, 560, C.yellow, 44);
  if (t > 61.0 && t < 66.6) {
    const items = [['পাইনঅ্যাপেল মিল্কশেক', V(-2, 5.6, 188), C.yellow, 61.2], ['স্মুদি', V(3.5, 5.0, 184), '#ff8fc8', 62.6], ['দই-আনারস ডেজার্ট', V(13.5, 3.6, 188), C.green, 63.6]];
    items.forEach(([s, v, c, t0]) => { const p = anchor(v); if (p.vis) chip(g, t, t0, 66.5, s, clamp(p.x, 240, 840), p.y - 60, c, 30); });
  }
  withPop(g, t, 64.4, 66.6, W / 2, 1520, () => { pill(g, 'মানুষ প্রতিদিনই খাচ্ছে', W / 2, 1520, C.green, { center: true, icon: true, size: 38 }); });
  // 66.7-67.7: সমস্যাটা কোথায়?
  stamp(g, t, 66.7, 68.1, 'সমস্যাটা কোথায়?', 560, 104, '#ffc93c', '#7a4a00');
  // 68.2-73.8: acidity + list
  withPop(g, t, 68.3, 74.0, W / 2, 1420, () => {
    glassCard(g, 110, 1250, 860, 360, { line: 'rgba(255,138,61,0.5)' });
    label(g, 'আনারস · প্রচণ্ড অ্যাসিডিক', 155, 1300, C.orange, 24);
    // pH bar
    const bx = 155, bw = 770, by = 1340;
    const gr = g.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#ff3d3d'); gr.addColorStop(0.5, '#2ee59d'); gr.addColorStop(1, '#5a6cff');
    rr(g, bx, by, bw, 22, 11); g.fillStyle = gr; g.fill();
    const mk = bx + bw * lerp(0.5, 0.24, eOut((t - 68.6) / 1.2));
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(mk, by - 6); g.lineTo(mk - 12, by - 26); g.lineTo(mk + 12, by - 26); g.fill();
    const L = [['গ্যাস্ট্রিক', 69.6], ['অ্যাসিডিটি', 71.6], ['ল্যাকটোজ ইনটলারেন্স', 72.4]];
    L.forEach(([s, t0], i) => { const k = clamp((t - t0) / 0.3); if (k) { g.save(); g.globalAlpha *= k; pill(g, s, 155 + (i === 1 ? 300 : 0), 1440 + (i === 2 ? 100 : 0), C.pink, { icon: true, size: 32 }); g.restore(); } });
  });
  // 74.2-80.1: empty stomach + symptoms
  withPop(g, t, 74.3, 80.3, W / 2, 1420, () => {
    glassCard(g, 110, 1270, 860, 330, { line: 'rgba(255,201,60,0.5)' });
    g.font = `800 50px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = C.yellow; g.fillText('⚠ খালি পেটে একসাথে', 155, 1340);
    const L = [['গ্যাস', 77.0], ['বদহজম', 77.7], ['পাতলা পায়খানা', 78.4]];
    let x = 155;
    L.forEach(([s, t0], i) => { const k = clamp((t - t0) / 0.3); g.font = `700 32px ${FONT}`; const w = g.measureText(s).width + 32 * 1.9 * 0.9 + 32 * 1.9 * 0.6; if (k) { g.save(); g.globalAlpha *= k; pill(g, s, i === 2 ? 155 : x, i === 2 ? 1540 : 1440, C.orange, { icon: true, size: 32 }); g.restore(); } x += w + 24; });
  });
  // 80.5-82.2: বিষ নয়!
  stamp(g, t, 80.55, 82.5, 'কখনোই বিষ নয়!', 560, 108, '#2ee59d', '#0b5a3a');
  // 82.6-86: comment card
  withPop(g, t, 82.6, 86.5, W / 2, 1420, () => {
    glassCard(g, 90, 1290, 900, 260);
    g.fillStyle = C.yellow; g.beginPath(); g.arc(140, 1344, 16, 0, 7); g.fill();
    label(g, 'কমেন্টে বলুন', 172, 1344, C.yellow, 24);
    g.font = `700 40px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = C.white;
    g.fillText('বন্ধুরা কী ভয় দেখিয়েছে?', 140, 1420);
    const ans = 'দুধ খেলেই নাকি মরে যাবো!';
    g.fillStyle = C.yellow; const ty = typeText(t, 83.8, ans, 13); g.fillText(ty, 140, 1490);
    if (Math.floor(t * 3) % 2 === 0) { g.fillStyle = C.white; g.fillRect(146 + g.measureText(ty).width, 1468, 4, 46); }
  });
};

// SFX cue list (time, kind) for the synth mixer
window.SFXEV = [
  [0.12, 'slam'], [1.0, 'pop'], [3.4, 'hiss'], [3.5, 'pop'], [6.2, 'whoosh'], [7.0, 'type'], [10.6, 'pop'], [11.0, 'tick'], [11.5, 'tick'], [11.9, 'tick'], [12.6, 'tick'], [13.1, 'bad'],
  [14.9, 'whoosh'], [15.45, 'slam'], [16.3, 'slam'], [17.4, 'whoosh'], [18.9, 'pop'], [21.0, 'pop'], [21.8, 'tick'], [22.4, 'fizz'], [24.2, 'tick'],
  [26.3, 'pop'], [26.6, 'rise'], [29.0, 'whoosh'], [29.2, 'pop'], [30.0, 'snip'], [30.4, 'snip'], [30.8, 'snip'], [31.2, 'slam'], [32.2, 'whoosh'],
  [33.0, 'plop'], [33.3, 'plop'], [33.6, 'plop'], [34.0, 'plop'], [35.0, 'curdle'], [36.6, 'tick'], [39.4, 'whoosh'], [39.6, 'pop'], [42.35, 'good'],
  [43.9, 'pour'], [45.8, 'pop'], [46.0, 'fizz'], [47.4, 'tick'], [49.6, 'good'], [51.5, 'slam'], [52.6, 'pop'], [54.9, 'pop'], [55.2, 'drop'], [55.55, 'bad'], [56.4, 'good'],
  [59.8, 'whoosh'], [60.2, 'tick'], [60.9, 'tick'], [61.6, 'tick'], [62.3, 'tick'], [62.6, 'pop'], [63.6, 'pop'], [64.4, 'good'], [66.7, 'slam'],
  [68.3, 'whoosh'], [68.6, 'rise'], [69.6, 'tick'], [71.6, 'tick'], [72.4, 'tick'], [74.3, 'pop'], [74.6, 'gurgle'], [77.0, 'tick'], [77.7, 'tick'], [78.4, 'tick'],
  [80.4, 'whoosh'], [80.55, 'slam'], [80.7, 'good'], [82.6, 'pop'], [83.8, 'type'],
];

boot();
