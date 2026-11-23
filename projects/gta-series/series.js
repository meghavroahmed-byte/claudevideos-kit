// series.js: "GTA সিরিজের কোন গেম কত আয় করেছে?" (video 2). bright-daylight 3D short (House-In-Crisis-like look, three.js).
// One continuous camera over a sunny grass world; each beat = a hero object on the grass + label pill + x-ray circle.
// Times come from window.TL (written by plan.js from the edit timeline).
import * as K from '../neon-tech-short/kit/core3d.js';
const { THREE } = K;
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const PH = '../../assets/polyhaven/';
import { loadPeople, person, label, showLabel, V as PV } from './people3d.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
{ const FB = '../neon-tech-short/kit/fonts/'; await Promise.all([new FontFace('Anek', `url(${FB}anek.woff2)`, { weight: '100 800' }), new FontFace('PJS', `url(${FB}plus-jakarta-sans-latin-800-normal.woff2)`, { weight: '800' }), new FontFace('Brand', 'url(../../node_modules/@fontsource/righteous/files/righteous-latin-400-normal.woff2)')].map(f => f.load().then(x => document.fonts.add(x)))); }
await loadPeople('./people/');
const hdr = await new RGBELoader().loadAsync(PH + 'kloofendal_48d_partly_cloudy_puresky.hdr'); hdr.mapping = THREE.EquirectangularReflectionMapping;
const GL = new GLTFLoader(); const MODELS = {};
await Promise.all(['gamepad', 'gaming_console', 'treasure_chest', 'alarm_clock_01', 'Camera_01', 'circuit_board', 'metal_office_desk', 'classic_laptop', 'CashRegister_01', 'street_lamp_01', 'grass_medium_01', 'shrub_01', 'Television_01'].map(n => GL.loadAsync(PH + n + '/' + n + '.gltf').then(g => { MODELS[n] = g.scene; })));
// place a Poly Haven model: scaled so its height = h, base centred on (x,y,z), turned ry
function model(name, parent, x, y, z, h, ry = 0) { const src = MODELS[name], o = src.clone(true); const bb = new THREE.Box3().setFromObject(src), sz = bb.getSize(new THREE.Vector3()), k = h / Math.max(1e-6, sz.y); o.scale.setScalar(k); o.position.set(-(bb.min.x + sz.x / 2) * k, -bb.min.y * k, -(bb.min.z + sz.z / 2) * k); const piv = new THREE.Group(); piv.position.set(x, y, z); piv.rotation.y = ry; piv.add(o); (parent || K.scene).add(piv); piv.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return piv; }
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (a, b, t) => { const k = cl((t - a) / (b - a)); return k * k * (3 - 2 * k); };
const env = (t, a, b, fi = 0.4, fo = 0.4) => sm(a, a + fi, t) * (1 - sm(b - fo, b, t));
const TL = window.TL; // {dur, st:{A:[t0,t1],...}, ev:{name:t}}
const E = n => (TL.ev[n] != null ? TL.ev[n] : 1e9);
CFG.duration = TL.dur; CFG.captions = false;
K.seed(66);

// ---------------- daylight world ----------------
const R = K.renderer; R.toneMappingExposure = 0.92; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
K.sky.visible = false;
K.scene.fog = new THREE.Fog(0xbcd3ea, 160, 520);
K.bloom.strength = 0.22; K.bloom.threshold = 0.92; K.bloom.radius = 0.4;
K.hemi.color.set(0xcfe8ff); K.hemi.groundColor.set(0x5a7a3a); K.hemi.intensity = 1.25;
K.moon.color.set(0xfff1dc); K.moon.intensity = 2.6; K.moon.position.set(-40, 70, -20); K.moon.castShadow = true;
K.moon.shadow.mapSize.set(2048, 2048); const SC_ = K.moon.shadow.camera; SC_.left = -26; SC_.right = 26; SC_.top = 26; SC_.bottom = -26; SC_.near = 1; SC_.far = 220; K.moon.shadow.bias = -0.0006; K.moon.shadow.normalBias = 0.03;
K.scene.add(K.moon.target);
{ const pm = new THREE.PMREMGenerator(R); K.scene.environment = pm.fromEquirectangular(hdr).texture; K.scene.environmentIntensity = 0.6; K.scene.background = hdr; K.scene.backgroundIntensity = 1.0; K.scene.backgroundBlurriness = 0.0; }
// sky dome: soft blue gradient + sun glow
const skyM = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { sun: { value: V(-0.5, 0.55, -0.7).normalize() } },
  vertexShader: 'varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `uniform vec3 sun; varying vec3 vp; void main(){ float h = clamp(vp.y,0.,1.); vec3 top = vec3(0.05,0.30,0.80), mid = vec3(0.30,0.60,0.98), hz = vec3(0.78,0.89,1.0);
    vec3 c = mix(hz, mid, smoothstep(0.0,0.22,h)); c = mix(c, top, smoothstep(0.2,0.85,h)); float s = max(dot(vp, sun),0.); c += vec3(1.,0.95,0.8)*pow(s,40.)*0.6 + vec3(1.,0.9,0.7)*pow(s,6.)*0.12; gl_FragColor = vec4(c,1.); }` });
const skyDome = new THREE.Group();
// clouds (soft billboards)
const cloudTex = K.canvasTex(512, 256, (g, w, h) => { for (let i = 0; i < 26; i++) { const x = 70 + K.rnd(0, 370), y = 130 + K.rnd(-40, 50) - Math.sin((x - 70) / 370 * Math.PI) * 40, r = K.rnd(40, 90); const gr = g.createRadialGradient(x, y - r * 0.3, 2, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.6, 'rgba(250,252,255,0.75)'); gr.addColorStop(1, 'rgba(225,235,250,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } });
const clouds = []; for (let i = 0; i < 0; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false, opacity: 0.95 })); const sz = K.rnd(60, 130); s.scale.set(sz, sz / 2, 1); s.position.set(K.rnd(-260, 260), K.rnd(60, 150), K.rnd(-120, 520)); K.scene.add(s); clouds.push([s, K.rnd(0.5, 1.5)]); }
// grass ground
const grassTex = K.canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#5f9a3a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { const x = K.rnd(0, w), y = K.rnd(0, h), l = K.rnd(3, 9); g.strokeStyle = `rgba(${K.rnd(40, 120) | 0},${K.rnd(110, 175) | 0},${K.rnd(20, 60) | 0},${K.rnd(0.4, 0.9)})`; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + K.rnd(-2, 2), y - l); g.stroke(); } }, [90, 90]);
const texL = new THREE.TextureLoader(); const tx = (f, rep, srgb) => { const t = texL.load(PH + f); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
const ground = K.mesh(new THREE.PlaneGeometry(1400, 1400), K.std({ map: tx('aerial_grass_rock_diff_1k.jpg', 160, true), color: 0x8fd06a, normalMap: tx('aerial_grass_rock_nor_gl_1k.jpg', 220), roughnessMap: tx('aerial_grass_rock_rough_1k.jpg', 220), roughness: 1 }), 0, 0, 200); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
// grass tufts (instanced) + distant hills
const tuftM = K.std({ color: 0x4f8a2e, roughness: 1, flatShading: true });
const tufts = K.instanced(new THREE.ConeGeometry(0.12, 0.7, 4), tuftM, 1);
for (let i = 0; i < 0; i++) { const x = K.rnd(-40, 40), z = K.rnd(-20, 360); K.setInst(tufts, i, [x, 0.3, z], [1, K.rnd(0.6, 1.4), 1], K.rnd(-0.3, 0.3), K.rnd(0, 6), K.rnd(-0.3, 0.3)); }
tufts.instanceMatrix.needsUpdate = true;
const hillM = K.std({ color: 0x77b24e, roughness: 1 }); for (let i = 0; i < 0; i++) { const h = K.mesh(new THREE.SphereGeometry(1, 24, 12), hillM, (i % 2 ? 1 : -1) * K.rnd(90, 180), -8, i * 28 - 40); h.scale.set(K.rnd(40, 70), K.rnd(14, 26), K.rnd(30, 50)); }
// a dirt path along the route
const pathTex = K.canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#b89a6a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(${K.rnd(120, 190) | 0},${K.rnd(100, 160) | 0},${K.rnd(70, 110) | 0},0.5)`; g.fillRect(K.rnd(0, w), K.rnd(0, h), 2, 2); } }, [2, 60]);
const ptx = (f, srgb) => { const t = texL.load(PH + f); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 120); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
const path_ = K.mesh(new THREE.PlaneGeometry(7, 420), K.std({ map: ptx('brown_mud_leaves_01_diff_1k.jpg', true), normalMap: ptx('brown_mud_leaves_01_nor_gl_1k.jpg'), roughnessMap: ptx('brown_mud_leaves_01_rough_1k.jpg'), roughness: 1 }), 0, 0.02, 180); path_.rotation.x = -Math.PI / 2; path_.receiveShadow = true;
// wooden fences
const fenceM = K.std({ color: 0x8a6440, roughness: 0.9 });
for (let z = -10; z < 360; z += 6) for (const s of [-1, 1]) { const x = s * 14; const p = K.box(0.25, 1.6, 0.25, fenceM, x, 0.8, z); p.castShadow = true; K.box(0.12, 0.18, 6, fenceM, x, 1.3, z + 3); K.box(0.12, 0.18, 6, fenceM, x, 0.7, z + 3); }
const shadowy = o => o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });

// ---------------- materials / textures ----------------
const M = {
  gold: K.std({ color: 0xffc83a, metalness: 0.9, roughness: 0.25 }),
  cash: K.std({ map: K.canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#7cc98a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2e6b3c'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#d8f2dc'; g.beginPath(); g.ellipse(w / 2, h / 2, 30, 36, 0, 0, 7); g.fill(); g.fillStyle = '#2e6b3c'; g.font = 'bold 52px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', w / 2, h / 2 + 2); g.font = 'bold 22px Arial'; g.fillText('100', 40, 30); g.fillText('100', w - 40, h - 28); }), roughness: 0.7 }),
  band: K.std({ color: 0xe9d27a, roughness: 0.6 }),
  white: K.std({ color: 0xf4f6fa, roughness: 0.5 }),
  dark: K.std({ color: 0x1c2230, roughness: 0.5, metalness: 0.2 }),
  glass: K.std({ color: 0x9fd4ff, roughness: 0.08, metalness: 0.6, transparent: true, opacity: 0.55 }),
  red: K.std({ color: 0xe8262c, roughness: 0.4 }),
  wood: K.std({ color: 0x9a6a3e, roughness: 0.8 }),
  sand: K.std({ color: 0xe2c48e, roughness: 1 }),
  steel: K.std({ color: 0xdde6f0, metalness: 0.55, roughness: 0.22 }),
};
// ---------------- generic game covers (no logos, original art per title) ----------------
const cover = (title, c1, c2, c3, sub) => K.canvasTex(512, 640, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c1); gr.addColorStop(0.55, c2); gr.addColorStop(1, c3); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,240,200,0.85)'; g.beginPath(); g.arc(w / 2, 430, 110, 0, 7); g.fill();
  g.fillStyle = 'rgba(10,6,20,0.92)'; for (let i = 0; i < 14; i++) { const bw = 28 + K.rnd(0, 30), bh = 70 + K.rnd(0, 180); g.fillRect(i * 38 - 10, 560 - bh, bw, bh + 200); }
  g.font = '900 200px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 14; g.strokeStyle = '#fff'; g.fillStyle = c2; g.strokeText(title, w / 2, 170); g.fillText(title, w / 2, 170);
  if (sub) { g.font = '900 46px Arial'; g.fillStyle = '#fff'; g.fillText(sub, w / 2, 300); }
  g.fillStyle = 'rgba(0,0,0,0.8)'; g.fillRect(0, 0, w, 44); g.fillStyle = '#fff'; g.font = 'bold 26px Arial'; g.textAlign = 'left'; g.fillText('GAME', 20, 23);
});
const GAMES = {
  g1: cover('1', '#1d3557', '#457b9d', '#a8dadc', 'GRAND THEFT'), g2: cover('2', '#3d1d57', '#7b459d', '#dca8dc', 'GRAND THEFT'),
  g3: cover('III', '#111', '#c0392b', '#f5b041', 'GRAND THEFT'), vc: cover('VC', '#2a0f52', '#ff3d9a', '#ffb36b', 'VICE'), sa: cover('SA', '#0b3d1e', '#2ecc71', '#f7dc6f', 'SAN ANDREAS'),
  g4: cover('IV', '#1c1c1c', '#7f8c8d', '#d5d8dc', 'GRAND THEFT'), g5: cover('V', '#0b2545', '#13a89e', '#f6d55c', 'GRAND THEFT'), g6: cover('VI', '#2a0f52', '#d8346f', '#ffd27a', 'GRAND THEFT'),
};
function gameCase(parent, key, x, y, z, s = 1, ry = 0) { const c = K.group(x, y, z, parent); c.scale.setScalar(s); c.rotation.y = ry; K.box(5.2, 6.6, 0.7, K.std({ color: 0x1a1a22, roughness: 0.3 }), 0, 3.6, 0, c); K.mesh(new THREE.PlaneGeometry(5.0, 6.3), K.std({ map: GAMES[key], roughness: 0.35 }), 0, 3.6, 0.36, c); K.mesh(new THREE.PlaneGeometry(5.0, 6.3), K.std({ color: 0x24242e }), 0, 3.6, -0.36, c).rotation.y = Math.PI; shadowy(c); return c; }
function cashTower(parent, x, z, w = 3.6, d = 2.6) { const g = K.group(x, 0, z, parent); K.box(w + 0.4, 0.4, d + 0.4, M.wood, 0, 0.2, 0, g).castShadow = true; const body = K.box(w, 1, d, M.cash, 0, 0, 0, g); body.castShadow = true; const bands = [K.box(w + 0.06, 1, 0.3, M.band, 0, 0, -d / 4, g), K.box(w + 0.06, 1, 0.3, M.band, 0, 0, d / 4, g)]; g.userData = { body, bands }; return g; }
function setTower(tw, h) { const { body, bands } = tw.userData; h = Math.max(0.05, h); body.scale.y = h; body.position.y = 0.4 + h / 2; bands.forEach(b => { b.scale.y = h; b.position.y = 0.4 + h / 2; }); }
const HREV = rev => 3.0 * Math.sqrt(rev / 0.5);  // revenue (billion $) -> stack height
// ---------------- stations ----------------
const ST = {}; const Z = { A: 0, B: 40, C: 80, D: 120, E: 160, F: 200, G: 240, H: 290, I: 335 };
const TW = {};
{ const g = K.group(0, 0, Z.A); ST.A = g; ['g1', 'g2', 'g3', 'vc', 'sa', 'g4', 'g5', 'g6'].forEach((k, i) => { const a = (i - 3.5) * 0.22; gameCase(g, k, Math.sin(a) * 16, 0, -Math.cos(a) * 16 + 12, 0.62, -a); }); }
{ const g = K.group(0, 0, Z.B); ST.B = g; gameCase(g, 'g1', -3.4, 0, 0, 0.8, 0.15); gameCase(g, 'g2', 3.4, 0, 0, 0.8, -0.15); g.userData.q = [-3.4, 3.4].map(x => { const s = label('?', 3.2); s.position.set(x, 8.6, 0.4); g.add(s); return s; }); }
const stationGame = (k, key, rev, extra) => { const g = K.group(0, 0, Z[k]); ST[k] = g; gameCase(g, key, -2.8, 0, 0, 0.85, 0.2); TW[k] = cashTower(g, 3.2, 0); TW[k].userData.h = HREV(rev); if (extra) extra(g); return g; };
stationGame('C', 'g3', 0.508);
stationGame('D', 'vc', 0.613, g => { const trunkM = K.std({ color: 0x7a5530, roughness: 1 }), leafM = K.std({ color: 0x2f8a3a, roughness: 0.8, flatShading: true }); for (const [x, z] of [[-8, -3], [8.5, -2], [-7, 4]]) { const p = K.group(x, 0, z, g); K.mesh(new THREE.CylinderGeometry(0.15, 0.28, 6, 6), trunkM, 0, 3, 0, p); for (let l = 0; l < 7; l++) { const lf = K.mesh(new THREE.ConeGeometry(0.45, 3, 4), leafM, 0, 6, 0, p); lf.rotation.z = 1.25; lf.rotation.y = l * 0.9; lf.position.x = Math.cos(l * 0.9) * 0.9; lf.position.z = -Math.sin(l * 0.9) * 0.9; } shadowy(p); } const neon = K.mesh(new THREE.TorusGeometry(2.2, 0.12, 8, 40), new THREE.MeshBasicMaterial({ color: 0xff3d9a }), -2.8, 9.4, 0.3, g); g.userData.neon = neon; });
stationGame('E', 'sa', 0.923, g => { for (let i = 0; i < 4; i++) { const h = K.group(-9 + i * 1.3, 0, -6 - (i % 2), g); K.box(2.6, 2.4, 2.6, K.std({ color: [0xd9c7a0, 0xc9b28a, 0xe0d2b4, 0xbfa77f][i], roughness: 0.9 }), 0, 1.2, 0, h); K.box(2.9, 0.4, 2.9, K.std({ color: 0x5a3a2a }), 0, 2.6, 0, h); shadowy(h); } });
stationGame('F', 'g4', 2.0, g => { for (let i = 0; i < 6; i++) { const b = K.box(2.4, 8 + K.rnd(0, 10), 2.4, K.std({ color: 0x6d7378, roughness: 0.7 }), -10 + i * 4, 0, -9, g); b.position.y = b.geometry.parameters.height / 2; b.castShadow = true; } });
stationGame('G', 'g5', 15.0, g => { const hill = K.mesh(new THREE.ConeGeometry(30, 18, 24), K.std({ color: 0x8a9a5b, roughness: 1 }), -14, 9, -40, g); hill.receiveShadow = true; });
{ const g = K.group(0, 0, Z.H); ST.H = g; gameCase(g, 'g6', -3.6, 0, -0.5, 0.85, 0.25);
  const clk = K.group(4.2, 0, -1.5, g); g.userData.clk = clk; K.mesh(new THREE.CylinderGeometry(0.2, 0.3, 3, 8), M.dark, 0, 1.5, 0, clk); const face = K.mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.5, 48), M.white, 0, 5.2, 0, clk); face.rotation.x = Math.PI / 2; K.mesh(new THREE.TorusGeometry(2.4, 0.2, 12, 48), M.red, 0, 5.2, 0, clk);
  const hand = K.box(0.14, 1.9, 0.08, M.dark, 0, 5.2, 0.32, clk); hand.geometry.translate(0, 0.8, 0); g.userData.hand = hand; shadowy(clk);
  const N = 220; const bills = K.instanced(new THREE.BoxGeometry(0.8, 0.02, 0.4), M.cash, N, g); g.userData.bills = bills; g.userData.billP = Array.from({ length: N }, () => [K.rnd(-1, 1), K.rnd(6, 11), K.rnd(-1, 1), K.rnd(0, 1), K.rnd(0, 6.28)]); }
{ const g = K.group(0, 0, Z.I); ST.I = g; g.userData.bars = [['g3', 0.508], ['vc', 0.613], ['sa', 0.923], ['g4', 2.0], ['g5', 15.0], ['g6', 3.0]].map(([key, rev], i) => { const x = -10 + i * 4; const t = cashTower(g, x, 0, 2.8, 2.2); t.userData.h = HREV(rev) * 0.6; gameCase(g, key, x, 0, 0, 0.34, 0); return t; }); }
// Poly Haven props + grass
model('CashRegister_01', ST.C, 6.4, 0, 2.6, 1.6, -0.4); model('gaming_console', ST.A, 4.2, 0, 10, 1.1, -0.5); model('gamepad', ST.A, -4.2, 0, 10.5, 0.6, 0.6);
model('treasure_chest', ST.H, 0.4, 0, 2, 2.0, 0); model('street_lamp_01', ST.D, 9.5, 0, 2, 6.5, Math.PI); model('Television_01', ST.I, 11, 0, 3, 1.5, -0.6);
for (const k in ST) { const g = ST[k]; for (let i = 0; i < 7; i++) { const sd = i % 2 ? 1 : -1; model('grass_medium_01', g, sd * K.rnd(8, 13), 0, K.rnd(-6, 2), K.rnd(0.6, 1.1), K.rnd(0, 6)); } model('shrub_01', g, -12, 0, K.rnd(-6, 2), 2.2, K.rnd(0, 6)); model('shrub_01', g, 12.5, 0, K.rnd(-6, 2), 1.8, K.rnd(0, 6)); }
// ---------------- realistic people ----------------
const PPL = [];
function addP(kind, st, x, z, ry, s = 1.5, fn, opt = {}) { const p = person(kind, opt); p.root.position.set(x, 0, z); p.root.rotation.y = ry; p.root.scale.setScalar(s); ST[st].add(p.root); const o = { p, st, fn }; PPL.push(o); return o; }
const VO = t => { const E_ = window.ENV || [], i = Math.round(t * 30); if (i < 1 || i >= E_.length - 1) return 0; const db = (E_[i - 1] + 2 * E_[i] + E_[i + 1]) / 4; return cl((db + 42) / 20) * (0.6 + 0.4 * Math.abs(Math.sin(t * 17))); };
const hero = (k, fn) => addP('hero', k, 0, 0, 0, 1.5, t => Object.assign({ w: { idle: 1 }, mouth: VO(t) }, fn ? fn(t) : {}));
const HEROES = {
  A: hero('A', t => ({ point: env(t, 1.0, TL.st.A[1], 0.4, 0.3) })),
  B: hero('B', t => ({ w: { idle: 1 - env(t, E('nohisab'), TL.st.B[1], 0.3, 0.3), headShake: env(t, E('nohisab'), TL.st.B[1], 0.3, 0.3) } })),
  C: hero('C', t => ({ point: env(t, E('r3') - 0.3, TL.st.C[1], 0.3, 0.3) })),
  D: hero('D', t => ({ w: { idle: 1 - env(t, E('emo'), TL.st.D[1], 0.3, 0.3), agree: env(t, E('emo'), TL.st.D[1], 0.3, 0.3) } })),
  E: hero('E', t => ({ point: env(t, E('r_sa') - 0.3, TL.st.E[1], 0.3, 0.3) })),
  F: hero('F', t => ({ point: env(t, E('r4') - 0.3, TL.st.F[1], 0.3, 0.3) })),
  G: hero('G', t => ({ lookUp: sm(E('r5') - 0.2, E('r5') + 0.8, t), flinch: env(t, E('r5'), E('r5') + 1.2, 0.15, 0.5) * 0.6 })),
  H: hero('H', t => ({ w: { idle: 1 - env(t, E('r6'), TL.st.H[1], 0.3, 0.3), headShake: env(t, E('r6'), TL.st.H[1], 0.3, 0.3) } })),
  I: hero('I', t => ({ w: { idle: 1 - env(t, E('comment'), TL.dur, 0.3, 0.3), agree: env(t, E('comment'), TL.dur, 0.3, 0.3) } })),
};
// ---------------- 3D labels ----------------
const LBL = []; const L = (txt, st, pos, a0, a1, h = 1.1) => { const s = label(txt, h); ST[st].add(s); LBL.push([s, PV(...pos), a0, a1]); return s; };
L('GTA সিরিজ', 'A', [0, 7.6, -2], 2.1, TL.st.A[1] + 0.1, 1.6);
L('GTA 1', 'B', [-3.4, 7.0, 0.5], TL.st.B[0] + 0.3, TL.st.B[1], 1.0); L('GTA 2', 'B', [3.4, 7.0, 0.5], TL.st.B[0] + 0.6, TL.st.B[1], 1.0); L('আয়ের হিসাব নেই', 'B', [0, 11.2, 0], E('nohisab'), TL.st.B[1], 1.6);
L('GTA 3', 'C', [-2.8, 7.2, 0.5], TL.st.C[0] + 0.2, TL.st.C[1], 1.1); L('$৫০৮ মিলিয়ন', 'C', [3.2, 0, 0], E('r3'), TL.st.C[1], 1.3);
L('Vice City', 'D', [-2.8, 7.2, 0.5], E('vc'), TL.st.D[1], 1.1); L('ছোটবেলার ইমোশন', 'D', [0, 11.6, 0], E('emo'), E('r_vc') - 0.05, 1.3); L('$৬১৩ মিলিয়ন', 'D', [3.2, 0, 0], E('r_vc'), TL.st.D[1], 1.3);
L('San Andreas', 'E', [-2.8, 7.2, 0.5], E('sa'), TL.st.E[1], 1.1); L('CJ ভাই', 'E', [0, 11.0, 0], E('cj'), E('r_sa') - 0.05, 1.2); L('$৯২৩ মিলিয়ন', 'E', [3.2, 0, 0], E('r_sa'), TL.st.E[1], 1.3);
L('GTA 4', 'F', [-2.8, 7.2, 0.5], TL.st.F[0] + 0.1, TL.st.F[1], 1.1); L('$২ বিলিয়ন', 'F', [3.2, 0, 0], E('r4'), TL.st.F[1], 1.4);
L('GTA 5', 'G', [-2.8, 7.2, 0.5], TL.st.G[0] + 0.1, TL.st.G[1], 1.1); L('$১৫ বিলিয়ন', 'G', [3.2, 0, 0], E('r5'), TL.st.G[1], 2.4);
L('GTA 6', 'H', [-3.6, 7.2, 0], TL.st.H[0] + 0.1, TL.st.H[1], 1.1); L('এক দিনেই', 'H', [4.2, 8.6, -1.5], E('r6') - 0.4, TL.st.H[1], 1.2); L('$৩ বিলিয়ন+', 'H', [0.4, 4.4, 2], E('r6'), TL.st.H[1], 1.4);
L('GTA 6 কত আয় করবে?', 'I', [0, 13, 0], TL.st.I[0] + 0.3, TL.dur, 1.4); L('কমেন্টে জানান', 'I', [0, 11.3, 0], E('comment'), TL.dur, 1.2);
// ---------------- camera rigs (hero in the foreground, subject behind) ----------------
const camKeys = []; const addCam = (t, p, l, fov = 44) => camKeys.push({ t, p, l, fov }); const st = k => TL.st[k];
const RIGS = { A: { S: [0, 3, 2], h: [-1.6, 17], cd: 8, ch: 2.8, so: -1.1 }, B: { S: [0, 4.5, 0], h: [-1.8, 11], cd: 8, ch: 2.9, so: -1.1 }, C: { S: [0.3, 4, 0], h: [-1.8, 10.5], cd: 8, ch: 2.9, so: 1.1 }, D: { S: [0.3, 4, 0], h: [-1.8, 10.5], cd: 8, ch: 2.9, so: -1.1 }, E: { S: [0.3, 4, 0], h: [-1.8, 10.5], cd: 8, ch: 2.9, so: 1.1 }, F: { S: [0.3, 4.5, 0], h: [-1.8, 10.5], cd: 8, ch: 2.9, so: -1.1 }, G: { S: [1, 8, 0], h: [-2, 12], cd: 9, ch: 2.4, so: 1.1, up: 9 }, H: { S: [0, 4.2, 0], h: [-1.6, 10.5], cd: 8, ch: 2.9, so: -1.1 }, I: { S: [0, 5, 0], h: [-1.8, 12], cd: 9, ch: 3.2, so: 1.1 } };
const HP = {};
for (const k in RIGS) { const r = RIGS[k], [a, b] = st(k), z0 = Z[k]; const S = V(r.S[0], r.S[1], r.S[2] + z0), Hh = V(r.h[0], 0, r.h[1] + z0); HP[k] = Hh; const dir = Hh.clone().sub(V(S.x, 0, S.z)).normalize();
  const at = (u, f) => { const ang = (u - 0.5) * 0.22; const d2 = dir.clone().applyAxisAngle(V(0, 1, 0), ang), s2 = V(d2.z, 0, -d2.x); const p = Hh.clone().addScaledVector(d2, r.cd * f).addScaledVector(s2, r.so * f); const up = (r.up || 0) * Math.max(0, u - 0.4) / 0.6; p.y = r.ch + up; const look = S.clone().lerp(V(Hh.x, 1.6, Hh.z), 0.18); look.y += up * 1.2; return [p.toArray(), look.toArray()]; };
  const [p0, l0] = at(0, 1.22), [p1, l1] = at(0.5, 1.0), [p2, l2] = at(1, 0.86); addCam(a + 0.05, p0, l0); addCam((a + b) / 2, p1, l1); addCam(b - 0.05, p2, l2); }
camKeys.sort((a, b) => a.t - b.t); K.setCamKeys(camKeys); window.STZ = Z;
const PLATE = location.search.includes('plate'); window.PLATE = PLATE;
for (const k in HEROES) { const Hh = HP[k], o = HEROES[k].p.root; const c = camKeys.find(q => q.t >= TL.st[k][0]); o.position.set(Hh.x, 0, Hh.z - Z[k]); o.rotation.y = Math.atan2(c.p[0] - Hh.x, c.p[2] - Hh.z) + (RIGS[k].so < 0 ? 0.35 : -0.35); if (PLATE) o.visible = false; }
// ---------------- animation ----------------
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function curStation(t) { let best = 'A'; for (const k in TL.st) if (t >= TL.st[k][0] - 0.8) best = k; return best; }
const REV = { C: 'r3', D: 'r_vc', E: 'r_sa', F: 'r4', G: 'r5' };
function update(t) {
  const z = Z[curStation(t)]; K.moon.position.set(-30, 60, z - 25); K.moon.target.position.set(0, 0, z); K.moon.target.updateMatrixWorld();
  for (const k in ST) { const [a, b] = TL.st[k]; ST[k].visible = t > a - 3.5 && t < b + 2.5; }
  // revenue towers rise on the spoken number; labels ride on top
  for (const k in TW) { const tw = TW[k], k2 = sm(E(REV[k]) - 0.25, E(REV[k]) + (k === 'G' ? 1.6 : 0.9), t); setTower(tw, tw.userData.h * k2); }
  for (const l of LBL) if (l[0].parent === ST.C || l[0].parent === ST.D || l[0].parent === ST.E || l[0].parent === ST.F || l[0].parent === ST.G) { if (l[1].y === 0 || l[0].userData.top) { l[0].userData.top = true; const k = Object.keys(ST).find(q => ST[q] === l[0].parent); l[1].set(3.2, 0.4 + TW[k].userData.body.scale.y + 1.0, 0.8); } }
  ST.B.userData.q.forEach((s, i) => { const k = sm(TL.st.B[0] + 0.5 + i * 0.3, TL.st.B[0] + 0.9 + i * 0.3, t); s.set(k); s.position.y = 8.6 + 0.2 * Math.sin(t * 2 + i); });
  if (ST.D.userData.neon) ST.D.userData.neon.rotation.z = t * 0.6;
  const H = ST.H; H.userData.hand.rotation.z = -t * 2.6; const on = t > E('r6');
  H.userData.billP.forEach(([x, vy, zz, d, r], i) => { const age = ((t - E('r6')) * 0.9 + d) % 1.6; _p.set(0.4 + x * 4 * age, on ? 2 + vy * age - 6 * age * age : -20, 2 + zz * 3 * age); _q.setFromEuler(_e.set(r + t * 3, r, t * 2 + r)); _s.setScalar(on ? 1 : 0.001); _m.compose(_p, _q, _s); H.userData.bills.setMatrixAt(i, _m); }); H.userData.bills.instanceMatrix.needsUpdate = true;
  ST.I.userData.bars.forEach((tw, i) => setTower(tw, tw.userData.h * sm(TL.st.I[0] + 0.3 + i * 0.25, TL.st.I[0] + 1.1 + i * 0.25, t)));
  for (const o of PPL) { if (!ST[o.st].visible || !o.p.root.visible) continue; const r = o.fn(t); const P_ = o.p; P_.update(t, r.w, r.speed || 1);
    if (r.point) P_.point(r.point, 'Right'); if (r.flinch) P_.flinch(r.flinch); if (r.lookUp) P_.turn('Neck', [1, 0, 0], -0.5 * r.lookUp).turn('Head', [1, 0, 0], -0.3 * r.lookUp);
    P_.mouth(Math.min(1, r.mouth || 0)); P_.smile(0.15); }
  for (const [s_, pos, a0, a1] of LBL) { if (!s_.parent.visible) continue; showLabel(s_, pos, t, a0, a1); if (PLATE) s_.visible = false; }
  if (PLATE) ST.B.userData.q.forEach(s => s.visible = false);
}
K.hooks.shake = t => [0, 0];
window.BG3D = t => K.draw(t, update);
window.toScr = (x, y, z) => K.toScreen(V(x, y, z));
boot();
