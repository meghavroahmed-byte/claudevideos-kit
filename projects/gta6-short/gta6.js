// gta6.js: "GTA 6 কেন এত ব্যয়বহুল?" bright-daylight 3D short (House-In-Crisis-like look, three.js).
// One continuous camera over a sunny grass world; each beat = a hero object on the grass + label pill + x-ray circle.
// Times come from window.TL (written by plan.js from the edit timeline).
import * as K from '../neon-tech-short/kit/core3d.js';
const { THREE } = K;
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const PH = '../../assets/polyhaven/';
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
// game cover art (generic, no logos): sunset, palms, skyline + big "VI"
const coverTex = K.canvasTex(512, 640, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a0f52'); gr.addColorStop(0.45, '#d8346f'); gr.addColorStop(0.75, '#ff9a4a'); gr.addColorStop(1, '#ffd27a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(w / 2, 400, 120, 0, 7); g.fill(); g.fillStyle = '#d8346f'; for (let i = 0; i < 6; i++) g.fillRect(0, 410 + i * 20, w, 4 + i * 2);
  g.fillStyle = '#1b0a2a'; for (let i = 0; i < 14; i++) { const bw = 30 + K.rnd(0, 30), bh = 80 + K.rnd(0, 170); g.fillRect(i * 38 - 10, 520 - bh, bw, bh + 200); }
  const palm_ = (x, y, s) => { g.strokeStyle = '#120618'; g.lineWidth = 10 * s; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + 30 * s, y + 150 * s, x + 10 * s, y); g.stroke(); g.fillStyle = '#120618'; for (let a = 0; a < 7; a++) { const an = -Math.PI + a * Math.PI / 6; g.beginPath(); g.ellipse(x + 10 * s + Math.cos(an) * 60 * s, y + Math.sin(an) * 22 * s + 15 * s, 70 * s, 12 * s, an, 0, 7); g.fill(); } };
  palm_(70, 330, 1.1); palm_(450, 360, 0.9);
  g.font = '900 230px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 14; g.strokeStyle = '#ffffff'; g.fillStyle = '#ff3d9a'; g.strokeText('VI', w / 2, 170); g.fillText('VI', w / 2, 170);
  g.fillStyle = '#ffffff'; g.font = '900 54px Arial'; g.fillText('GRAND THEFT', w / 2, 300 - 30);
  g.fillStyle = 'rgba(0,0,0,0.8)'; g.fillRect(0, 0, w, 44); g.fillStyle = '#fff'; g.font = 'bold 26px Arial'; g.textAlign = 'left'; g.fillText('GAME', 20, 23);
});

// ---------------- stations ----------------
const ST = {}; // groups by key
const Z = { A: 0, B: 42, C: 84, D: 126, E: 170, F: 212, G: 254, H: 296, I: 336 };

// A: giant game case standing on the grass, slowly turning; money glow inside (x-ray)
{
  const g = K.group(0, 0, Z.A); ST.A = g;
  const cs = K.group(0, 0, 0, g); g.userData.case = cs;
  K.box(5.2, 6.6, 0.7, K.std({ color: 0x1a1a22, roughness: 0.3 }), 0, 3.6, 0, cs);
  const front = K.mesh(new THREE.PlaneGeometry(5.0, 6.3), K.std({ map: coverTex, roughness: 0.35 }), 0, 3.6, 0.36, cs);
  K.mesh(new THREE.PlaneGeometry(5.0, 6.3), K.std({ color: 0x24242e, roughness: 0.4 }), 0, 3.6, -0.36, cs).rotation.y = Math.PI;
  shadowy(cs);
  // price tag on a string
  const tag = K.group(2.6, 6.4, 0.4, cs); g.userData.tag = tag;
  K.mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6), K.std({ color: 0x333333 }), 0, -0.7, 0, tag);
  const tagTex = K.canvasTex(256, 160, (c, w, h) => { c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(40, 0); c.lineTo(w, 0); c.lineTo(w, h); c.lineTo(40, h); c.lineTo(0, h / 2); c.closePath(); c.fill(); c.fillStyle = '#1a1a1a'; c.font = '900 90px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$$$', 150, h / 2 + 4); c.fillStyle = '#fff'; c.beginPath(); c.arc(30, h / 2, 10, 0, 7); c.fill(); });
  const tg = K.mesh(new THREE.PlaneGeometry(1.6, 1.0), K.std({ map: tagTex, side: THREE.DoubleSide, roughness: 0.6 }), 0.7, -1.7, 0, tag); tg.castShadow = true;
  // a hay bale + barrel props for a farm feel
  const bale = K.mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.6, 24), K.std({ color: 0xd9b45a, roughness: 1 }), -6, 1.1, 2); bale.rotation.z = Math.PI / 2; bale.castShadow = true; g.add(bale); bale.position.set(-6, 1.1, 2);
}
// B: money mountain + supertall tower (sand pad)
{
  const g = K.group(0, 0, Z.B); ST.B = g;
  const pad = K.mesh(new THREE.CylinderGeometry(11, 12, 0.3, 48), M.sand, 0, 0.15, 0, g); pad.receiveShadow = true;
  // stepped supertall (generic): rises with time
  const tw = K.group(4.5, 0, -2, g); g.userData.tower = tw;
  const tiers = [[3.4, 9], [2.8, 16], [2.2, 23], [1.6, 29], [1.1, 34], [0.7, 38], [0.4, 41]];
  let y0 = 0; tiers.forEach(([r, top]) => { const m = K.mesh(new THREE.CylinderGeometry(r * 0.85, r, top - y0, 6), M.steel, 0, (y0 + top) / 2, 0, tw); m.castShadow = true; y0 = top; });
  const spire = K.mesh(new THREE.CylinderGeometry(0.05, 0.25, 8, 8), M.steel, 0, 45, 0, tw); spire.castShadow = true;
  // window bands
  const bandM = K.std({ color: 0x3a6c9a, metalness: 0.7, roughness: 0.2 }); for (let i = 1; i < 40; i += 2) { const r = tiers.find(([_, top]) => i < top)?.[0] || 0.4; K.mesh(new THREE.CylinderGeometry(r * 0.87, r * 0.87, 0.25, 6), bandM, 0, i, 0, tw); }
  // money mountain: instanced cash bricks
  const brick = new THREE.BoxGeometry(1.0, 0.32, 0.5);
  const N = 520; const cash = K.instanced(brick, M.cash, N, g); cash.castShadow = true; g.userData.cash = cash; const P = []; for (let i = 0; i < N; i++) { const a = K.rnd(0, 6.28), r = Math.pow(K.rnd(0, 1), 0.7) * 6.5; const hgt = (1 - r / 6.6) * 5.5; P.push([-4 + Math.cos(a) * r, 0.3 + K.rnd(0, hgt), 1 + Math.sin(a) * r, K.rnd(0, 6.28), K.rnd(0, 1)]); } g.userData.cashP = P;
}
// C: three cash pallets (1, 1.5, 2 billion)
{
  const g = K.group(0, 0, Z.C); ST.C = g; g.userData.stacks = [];
  [[-6, 0.5], [0, 0.75], [6, 1.0]].forEach(([x, f], i) => {
    const st = K.group(x, 0, 0, g); K.box(4.2, 0.4, 3.2, M.wood, 0, 0.2, 0, st).castShadow = true;
    const body = K.box(3.8, 1, 2.8, M.cash, 0, 0, 0, st); body.castShadow = true; const bands = [K.box(3.86, 1, 0.3, M.band, 0, 0, -0.6, st), K.box(3.86, 1, 0.3, M.band, 0, 0, 0.6, st)];
    g.userData.stacks.push({ st, body, bands, f });
  });
}
// D: studio office (glass) with desks; floating calendar "12"
{
  const g = K.group(0, 0, Z.D); ST.D = g;
  const bld = K.group(0, 0, -3, g);
  for (let fl = 0; fl < 5; fl++) { const y = fl * 3.2; K.box(16, 0.4, 9, M.white, 0, y + 0.2, 0, bld).castShadow = true; const gl = K.box(15.6, 2.8, 8.6, M.glass, 0, y + 1.8, 0, bld); gl.castShadow = false; for (let d = 0; d < 7; d++) { K.box(1.2, 0.08, 0.7, M.wood, -6 + d * 2, y + 1.15, 1.5, bld); const mon = K.box(0.9, 0.55, 0.06, K.std({ color: 0x0a1420, emissive: 0x2ab8ff, emissiveIntensity: 0.9 }), -6 + d * 2, y + 1.6, 1.2, bld); } }
  K.box(16.4, 0.5, 9.4, M.dark, 0, 16.2, 0, bld); shadowy(bld);
  const cal = K.group(9.5, 0, 3, g); g.userData.cal = cal; K.box(3.4, 3.6, 0.4, M.white, 0, 3.6, 0, cal); K.box(3.4, 0.9, 0.42, M.red, 0, 5.0, 0, cal);
  const calNum = K.textSprite((c) => { c.fillStyle = '#1a1a22'; c.font = '900 300px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('12', 256, 290); }, 512, 512, 3.0, cal); calNum.position.set(0, 3.3, 0.3); calNum.visible = false; shadowy(cal);
}
// E: open-world island diorama with roads, buildings, palms, cars
const cars = [];
{
  const g = K.group(0, 0, Z.E); ST.E = g;
  const water = K.mesh(new THREE.CylinderGeometry(12, 12, 0.5, 64), K.std({ color: 0x2c8fd6, roughness: 0.15, metalness: 0.3 }), 0, 0.25, 0, g); water.receiveShadow = true;
  const isl = K.mesh(new THREE.CylinderGeometry(9.5, 10.2, 0.9, 40), K.std({ color: 0xe8d49a, roughness: 1 }), 0, 0.5, 0, g); isl.receiveShadow = true;
  const top = K.mesh(new THREE.CylinderGeometry(8.6, 9.0, 0.3, 40), K.std({ color: 0x6aa84a, roughness: 1 }), 0, 1.05, 0, g); top.receiveShadow = true;
  const roadM = K.std({ color: 0x3a3d46, roughness: 0.9 }); const ring = K.mesh(new THREE.TorusGeometry(6, 0.42, 6, 60), roadM, 0, 1.2, 0, g); ring.rotation.x = Math.PI / 2; ring.scale.z = 0.2;
  K.box(12, 0.06, 0.8, roadM, 0, 1.22, 0, g);
  const bM = [K.std({ color: 0xf2c4d8, roughness: 0.6 }), K.std({ color: 0xbfe6f5, roughness: 0.6 }), K.std({ color: 0xfff0c4, roughness: 0.6 }), K.std({ color: 0xd7d0ff, roughness: 0.6 })];
  for (let i = 0; i < 22; i++) { const a = K.rnd(0, 6.28), r = K.rnd(0.8, 4.6); const h = K.rnd(0.8, 4.5) * (r < 2.5 ? 1.6 : 1); const b = K.box(K.rnd(0.7, 1.4), h, K.rnd(0.7, 1.4), bM[i % 4], Math.cos(a) * r, 1.2 + h / 2, Math.sin(a) * r + (Math.abs(Math.sin(a) * r) < 0.7 ? 1.2 : 0), g); b.castShadow = true; }
  const trunkM = K.std({ color: 0x7a5530, roughness: 1 }), leafM = K.std({ color: 0x2f8a3a, roughness: 0.8, flatShading: true });
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28 + 0.2, r = 7.6; const p = K.group(Math.cos(a) * r, 1.2, Math.sin(a) * r, g); K.mesh(new THREE.CylinderGeometry(0.08, 0.14, 2.2, 6), trunkM, 0, 1.1, 0, p); for (let l = 0; l < 6; l++) { const lf = K.mesh(new THREE.ConeGeometry(0.22, 1.4, 4), leafM, 0, 2.2, 0, p); lf.rotation.z = 1.2; lf.rotation.y = l; lf.position.x = Math.cos(l) * 0.4; lf.position.z = -Math.sin(l) * 0.4; } shadowy(p); }
  const carCols = [0xff3d9a, 0xffd23f, 0x3de8ff, 0xffffff, 0xff6b2a];
  for (let i = 0; i < 5; i++) { const c = K.group(0, 1.35, 0, g); K.box(0.7, 0.25, 0.36, K.std({ color: carCols[i], roughness: 0.3, metalness: 0.4 }), 0, 0, 0, c); K.box(0.36, 0.2, 0.32, K.std({ color: 0x223344, roughness: 0.2 }), -0.05, 0.2, 0, c); shadowy(c); cars.push([c, i / 5 * 6.28, 0.5 + i * 0.07]); }
}
// F: motion capture: mannequin with markers, tripod cameras, big mic and a glowing chip
const mannequin = (parent, x, z, col = 0x22242c) => {
  const m = K.group(x, 0, z, parent); const mat = K.std({ color: col, roughness: 0.6 }); const mk = K.std({ color: 0xe9ff7a, emissive: 0xc8ff3a, emissiveIntensity: 1 });
  const part = (geo, px, py, pz, p = m) => { const o = K.mesh(geo, mat, px, py, pz, p); o.castShadow = true; return o; };
  const hip = K.group(0, 2.1, 0, m), chest = K.group(0, 0.2, 0, hip); part(new THREE.CapsuleGeometry(0.42, 0.9, 6, 12), 0, 0.75, 0, chest); part(new THREE.SphereGeometry(0.32, 16, 12), 0, 1.75, 0, chest);
  const limb = (p, px, py, len) => { const j = K.group(px, py, 0, p); part(new THREE.CapsuleGeometry(0.14, len, 4, 8), 0, -len / 2, 0, j); const j2 = K.group(0, -len - 0.1, 0, j); part(new THREE.CapsuleGeometry(0.12, len, 4, 8), 0, -len / 2, 0, j2); K.mesh(new THREE.SphereGeometry(0.07, 8, 6), mk, 0.12, -len / 2, 0.1, j); K.mesh(new THREE.SphereGeometry(0.07, 8, 6), mk, 0.12, -len, 0.08, j2); return [j, j2]; };
  const armL = limb(chest, -0.6, 1.25, 0.6), armR = limb(chest, 0.6, 1.25, 0.6), legL = limb(hip, -0.25, 0, 0.75), legR = limb(hip, 0.25, 0, 0.75);
  [[0, 1.95, 0.3], [0, 1.2, 0.42], [-0.4, 0.4, 0.3], [0.4, 0.4, 0.3]].forEach(p => K.mesh(new THREE.SphereGeometry(0.08, 8, 6), mk, p[0], p[1], p[2], chest));
  m.userData = { hip, chest, armL, armR, legL, legR }; return m;
};
{
  const g = K.group(0, 0, Z.F); ST.F = g;
  const mat_ = K.mesh(new THREE.BoxGeometry(10, 0.1, 8), K.std({ color: 0x2b2f3c, roughness: 0.9 }), -2, 0.05, 0, g); mat_.receiveShadow = true;
  g.userData.man = mannequin(g, -2, 0);
  for (let i = 0; i < 4; i++) { const a = i / 4 * 6.28 + 0.4, r = 6; const tp = K.group(-2 + Math.cos(a) * r, 0, Math.sin(a) * r, g); for (let l = 0; l < 3; l++) { const leg = K.mesh(new THREE.CylinderGeometry(0.04, 0.04, 3, 6), M.dark, Math.cos(l * 2.1) * 0.4, 1.4, Math.sin(l * 2.1) * 0.4, tp); leg.rotation.z = Math.cos(l * 2.1) * 0.25; leg.rotation.x = -Math.sin(l * 2.1) * 0.25; } const cam = K.box(0.6, 0.4, 0.8, M.dark, 0, 3.0, 0, tp); tp.lookAt(-2, 3, 0); K.mesh(new THREE.SphereGeometry(0.08, 8, 6), K.basic({ color: 0xff2a3a }), 0.2, 3.15, 0.3, tp); shadowy(tp); }
  // studio mic
  const mic = K.group(7, 0, -1, g); g.userData.mic = mic; K.mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.4, 8), M.dark, 0, 2.2, 0, mic); K.mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 24), M.dark, 0, 0.06, 0, mic);
  const head = K.mesh(new THREE.CapsuleGeometry(0.55, 0.9, 8, 16), M.steel, 0, 5.1, 0, mic); K.mesh(new THREE.TorusGeometry(0.75, 0.07, 8, 32), M.dark, 0, 4.8, 0, mic).rotation.x = Math.PI / 2; shadowy(mic);
  // chip
  const chip = K.group(-2, 0, -9, g); g.userData.chip = chip; K.box(3.4, 0.4, 3.4, K.std({ color: 0x1a1f2a, metalness: 0.6, roughness: 0.3 }), 0, 2.6, 0, chip); K.box(2.0, 0.42, 2.0, K.std({ color: 0x2a3140, emissive: 0x3de8ff, emissiveIntensity: 0.25, metalness: 0.7, roughness: 0.25 }), 0, 2.62, 0, chip); for (let i = 0; i < 8; i++) for (const s of [-1, 1]) { K.box(0.12, 0.08, 0.6, M.gold, -1.4 + i * 0.4, 2.5, s * 2.0, chip); K.box(0.6, 0.08, 0.12, M.gold, s * 2.0, 2.5, -1.4 + i * 0.4, chip); } shadowy(chip);
}
// G: virtual world: glass dome over a mini city on a pedestal
{
  const g = K.group(0, 0, Z.G); ST.G = g;
  K.mesh(new THREE.CylinderGeometry(6.4, 7, 1.4, 48), M.white, 0, 0.7, 0, g).castShadow = true;
  const cityG = K.group(0, 1.4, 0, g); const bM = [K.std({ color: 0xff7ab8, roughness: 0.5 }), K.std({ color: 0x6fd6ff, roughness: 0.5 }), K.std({ color: 0xffe07a, roughness: 0.5 })];
  for (let i = 0; i < 40; i++) { const a = K.rnd(0, 6.28), r = Math.sqrt(K.rnd(0, 1)) * 5.2; const h = K.rnd(0.4, 3.6) * (1.3 - r / 6); const b = K.box(0.6, h, 0.6, bM[i % 3], Math.cos(a) * r, h / 2, Math.sin(a) * r, cityG); b.castShadow = true; }
  const dome = K.mesh(new THREE.SphereGeometry(6.2, 48, 24, 0, 6.29, 0, Math.PI / 2), K.std({ color: 0xbfe8ff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.3 }), 0, 1.4, 0, g); g.userData.dome = dome;
  const grid = K.mesh(new THREE.SphereGeometry(6.25, 24, 12, 0, 6.29, 0, Math.PI / 2), K.basic({ color: 0x3de8ff, wireframe: true, transparent: true, opacity: 0.35 }), 0, 1.4, 0, g); g.userData.grid = grid;
}
// H: release day: giant clock + money fountain
{
  const g = K.group(0, 0, Z.H); ST.H = g;
  const clk = K.group(-5, 0, -1, g); g.userData.clk = clk; K.mesh(new THREE.CylinderGeometry(0.2, 0.3, 3, 8), M.dark, 0, 1.5, 0, clk);
  const face = K.mesh(new THREE.CylinderGeometry(3, 3, 0.6, 48), M.white, 0, 6, 0, clk); face.rotation.x = Math.PI / 2; K.mesh(new THREE.TorusGeometry(3, 0.25, 12, 48), M.red, 0, 6, 0, clk);
  const clkTex = K.canvasTex(512, 512, (c) => { c.fillStyle = '#1a1a22'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; c.fillRect(256 + Math.cos(a) * 200 - 8, 256 + Math.sin(a) * 200 - 8, 16, 16); } c.font = '900 90px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#e8262c'; c.fillText('24h', 256, 360); });
  const fp = K.mesh(new THREE.CircleGeometry(2.9, 48), K.std({ map: clkTex, transparent: true }), 0, 6, 0.32, clk);
  const hand = K.box(0.16, 2.4, 0.08, M.dark, 0, 6, 0.4, clk); hand.geometry.translate(0, 1.0, 0); g.userData.hand = hand; const hand2 = K.box(0.2, 1.6, 0.08, M.red, 0, 6, 0.42, clk); hand2.geometry.translate(0, 0.65, 0); g.userData.hand2 = hand2; shadowy(clk);
  const N = 260; const bills = K.instanced(new THREE.BoxGeometry(0.8, 0.02, 0.4), M.cash, N, g); g.userData.bills = bills; g.userData.billP = Array.from({ length: N }, () => [K.rnd(-1, 1), K.rnd(6, 11), K.rnd(-1, 1), K.rnd(0, 1), K.rnd(0, 6.28)]);
  const chest = K.group(5, 0, 0, g); K.box(4, 2, 2.6, M.wood, 0, 1, 0, chest); K.box(4.1, 0.3, 2.7, M.gold, 0, 1.6, 0, chest); const lid = K.group(0, 2, -1.3, chest); K.box(4, 0.5, 2.6, M.wood, 0, 0.25, 1.3, lid); g.userData.lid = lid; shadowy(chest);
  const goldPile = K.instanced(new THREE.BoxGeometry(0.6, 0.25, 0.3), M.gold, 40, chest); for (let i = 0; i < 40; i++) K.setInst(goldPile, i, [K.rnd(-1.6, 1.6), 2.1 + K.rnd(0, 0.5), K.rnd(-1, 1)], 1, 0, K.rnd(0, 3), 0); goldPile.instanceMatrix.needsUpdate = true;
}
// I: end: giant phone with a play button, mini gameplay screen
{
  const g = K.group(0, 0, Z.I); ST.I = g;
  const ph = K.group(0, 0, 0, g); g.userData.phone = ph;
  K.box(4.6, 8.8, 0.5, K.std({ color: 0x15161c, roughness: 0.3, metalness: 0.5 }), 0, 5, 0, ph);
  const scrTex = K.canvasTex(360, 680, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a0f52'); gr.addColorStop(0.6, '#d8346f'); gr.addColorStop(1, '#ffb36b'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#ffe08a'; c.beginPath(); c.arc(w / 2, 430, 90, 0, 7); c.fill(); c.fillStyle = '#1b0a2a'; for (let i = 0; i < 12; i++) { const bh = 60 + K.rnd(0, 160); c.fillRect(i * 32, 560 - bh, 28, bh + 200); } c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8262c'; c.beginPath(); c.roundRect(w / 2 - 70, 290, 140, 100, 26); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(w / 2 - 22, 310); c.lineTo(w / 2 + 34, 340); c.lineTo(w / 2 - 22, 370); c.fill(); c.fillStyle = '#fff'; c.fillRect(20, h - 60, w * 0.62, 8); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(20 + w * 0.62, h - 60, w * 0.3, 8); });
  K.mesh(new THREE.PlaneGeometry(4.2, 8.2), K.std({ map: scrTex, emissive: 0xffffff, emissiveMap: scrTex, emissiveIntensity: 0.5 }), 0, 5, 0.26, ph); shadowy(ph);
  K.mesh(new THREE.CylinderGeometry(1.8, 2.2, 0.6, 32), M.white, 0, 0.3, -0.2, g).castShadow = true;
}
// ---- Poly Haven props per station ----
model('gaming_console', ST.A, -4.6, 0, 2.2, 1.3, 0.5); model('gamepad', ST.A, 4.4, 0, 2.8, 0.7, -0.6);
model('CashRegister_01', ST.C, 0, 0, 5, 1.7, 0.2);
[-4.5, 0, 4.5].forEach((x, i) => { model('metal_office_desk', ST.D, x, 0, 7, 1.5, 0); model('classic_laptop', ST.D, x, 1.5, 7, 0.55, Math.PI + (i - 1) * 0.2); });
model('Television_01', ST.D, -9, 0, 4, 1.6, 0.6);
ST.F.children.forEach(c => { if (c.type === 'Group' && c !== ST.F.userData.man && c !== ST.F.userData.mic && c !== ST.F.userData.chip && c.children.length > 3) { c.children.filter(m => m.isMesh && m.geometry.type === 'BoxGeometry').forEach(m => m.visible = false); model('Camera_01', c, 0, 2.75, 0, 0.7, Math.PI / 2); } });
model('circuit_board', ST.F.userData.chip, 0, 2.0, 0, 0.35, 0).scale.multiplyScalar(1);
ST.H.children.forEach(c => { if (c.children.length && c.position.x === 5) c.children.forEach(m => { if (m.isMesh || m === ST.H.userData.lid) m.visible = false; }); });
model('treasure_chest', ST.H, 5, 0, 0, 2.6, -0.3); model('alarm_clock_01', ST.H, -1.5, 0, 3, 0.9, 0.4);
[-1, 1].forEach(sd => { model('street_lamp_01', ST.I, sd * 5.5, 0, -1, 7, sd > 0 ? Math.PI : 0); });
// grass clumps + shrubs around every station (culled with the station)
for (const k in ST) { const g = ST[k]; for (let i = 0; i < 7; i++) { const sd = i % 2 ? 1 : -1; model('grass_medium_01', g, sd * K.rnd(5, 12), 0, K.rnd(-4, 12), K.rnd(0.6, 1.1), K.rnd(0, 6)); } model('shrub_01', g, -11, 0, K.rnd(-6, 2), 2.2, K.rnd(0, 6)); model('shrub_01', g, 11.5, 0, K.rnd(-6, 2), 1.8, K.rnd(0, 6)); }
Object.values(ST).forEach(g => g.traverse(m => { if (m.isMesh && m.castShadow === false && !m.material.transparent) m.receiveShadow = true; }));

// ---------------- camera ----------------
// keys at each station: start a bit wide, end close; side swings for parallax
const st = k => TL.st[k];
const camKeys = [];
const addCam = (t, p, l, fov = 42) => camKeys.push({ t, p, l, fov });
{
  const A = st('A'); addCam(A[0], [0, 4.2, 25], [0, 3.6, 0], 42); addCam((A[0] + A[1]) / 2, [-5, 4.6, 20], [0, 3.6, 0], 42); addCam(A[1], [2, 4.2, 16], [0, 3.8, 0], 42);
  const B = st('B'), bm = (B[0] + B[1]) / 2; addCam(B[0], [-12, 5, Z.B + 34], [-1, 6, Z.B], 46); addCam(E('burj'), [-16, 14, Z.B + 50], [2, 18, Z.B], 48); addCam(B[1], [-9, 26, Z.B + 62], [4, 24, Z.B], 48);
  const C = st('C'); addCam(C[0], [0, 7, Z.C + 36], [0, 4, Z.C], 44); addCam(E('b3'), [9, 8, Z.C + 30], [0, 5, Z.C], 44); addCam(C[1], [-4, 9, Z.C + 26], [1, 5.5, Z.C], 44);
  const D = st('D'); addCam(D[0], [-8, 5, Z.D + 32], [0, 6, Z.D], 44); addCam(E('devs'), [7, 9, Z.D + 34], [0, 8, Z.D - 3], 44); addCam(D[1], [11, 6, Z.D + 24], [4, 5, Z.D + 2], 44);
  const E_ = st('E'); addCam(E_[0], [0, 21, Z.E + 28], [0, 1, Z.E], 46); addCam(E_[1], [11, 13, Z.E + 20], [0, 1.5, Z.E], 44);
  const F = st('F'); addCam(F[0], [-3, 4.5, Z.F + 15], [-2, 3.2, Z.F], 44); addCam(E('voice'), [5, 5, Z.F + 17], [3, 3.8, Z.F - 1], 44); addCam(F[1], [-2, 7, Z.F + 6], [-2, 2.6, Z.F - 9], 46);
  const G = st('G'); addCam(G[0], [0, 10, Z.G + 25], [0, 3, Z.G], 46); addCam((G[0] + G[1]) / 2, [-13, 8, Z.G + 19], [0, 3, Z.G], 44); addCam(G[1], [0, 15, Z.G + 20], [0, 2, Z.G], 46);
  const H_ = st('H'); addCam(H_[0], [0, 7, Z.H + 32], [0, 5, Z.H], 44); addCam(E('inc'), [-5, 7, Z.H + 25], [-1, 5, Z.H], 44); addCam(H_[1], [6, 6, Z.H + 22], [3, 3.5, Z.H], 44);
  const I_ = st('I'); addCam(I_[0], [0, 6, Z.I + 24], [0, 5, Z.I], 44); addCam(I_[1], [0, 5.6, Z.I + 17], [0, 5, Z.I], 42);
}
camKeys.sort((a, b) => a.t - b.t);
K.setCamKeys(camKeys);
window.STZ = Z;

// ---------------- animation ----------------
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function curStation(t) { let best = 'A'; for (const k in TL.st) if (t >= TL.st[k][0] - 0.8) best = k; return best; }
function update(t) {
  // keep shadow camera on the current station
  const z = Z[curStation(t)]; K.moon.position.set(-30, 60, z - 25); K.moon.target.position.set(0, 0, z); K.moon.target.updateMatrixWorld();
  skyDome.position.copy(K.camera.position);
  clouds.forEach(([s, sp], i) => { s.position.x = ((s.position.x + 260 + sp * 0.02) % 520) - 260; });
  // visibility windows
  for (const k in ST) { const [a, b] = TL.st[k]; ST[k].visible = t > a - 3.5 && t < b + 2.5; }
  // A
  const A = ST.A; A.userData.case.rotation.y = Math.sin(t * 0.5) * 0.35 - 0.15; A.userData.case.position.y = 0.15 * Math.sin(t * 1.6); A.userData.tag.rotation.z = Math.sin(t * 2.2) * 0.25; A.userData.tag.rotation.y = Math.sin(t * 1.3) * 0.6;
  // B tower rises; cash mountain grows
  const B = ST.B, [b0, b1] = TL.st.B; const rise = sm(E('tower') - 0.2, E('tower') + 2.2, t); B.userData.tower.scale.set(1, Math.max(0.001, rise), 1);
  const cashK = sm(b0 - 0.3, b0 + 1.8, t); B.userData.cashP.forEach(([x, y, zz, r, d], i) => { const k = cl(cashK * 1.6 - d * 0.6); _p.set(x, y + (1 - k) * 12, zz); _q.setFromEuler(_e.set(0, r + (1 - k) * 3, 0)); _s.setScalar(Math.max(0.001, k)); _m.compose(_p, _q, _s); B.userData.cash.setMatrixAt(i, _m); }); B.userData.cash.instanceMatrix.needsUpdate = true;
  // C stacks grow
  ST.C.userData.stacks.forEach(({ st: s, body, bands, f }, i) => { const tb = [E('b1'), E('b2'), E('b3')][i]; const k = sm(tb - 0.1, tb + 0.9, t); const h = 0.05 + 9 * f * k; body.scale.y = h; body.position.y = 0.4 + h / 2; bands.forEach(b => { b.scale.y = h; b.position.y = 0.4 + h / 2; }); });
  // D calendar flips
  const cal = ST.D.userData.cal; cal.rotation.y = -0.5 + Math.sin(t * 0.8) * 0.15; cal.position.y = sm(E('years') - 0.3, E('years') + 0.4, t) * 0.0 + (1 - sm(E('years') - 0.3, E('years') + 0.5, t)) * -8;
  // E cars drive round the ring road
  cars.forEach(([c, ph, sp]) => { const a = ph + t * sp; c.position.x = Math.cos(a) * 6; c.position.z = Math.sin(a) * 6; c.rotation.y = -a - Math.PI / 2; });
  // F mannequin performs (run + punch loop)
  const mu = ST.F.userData.man.userData, ph = t * 3.2;
  mu.hip.position.y = 2.1 + Math.abs(Math.sin(ph)) * 0.12; mu.chest.rotation.y = Math.sin(ph) * 0.3; mu.legL[0].rotation.x = Math.sin(ph) * 0.7; mu.legL[1].rotation.x = Math.max(0, -Math.sin(ph)) * 1.1; mu.legR[0].rotation.x = -Math.sin(ph) * 0.7; mu.legR[1].rotation.x = Math.max(0, Math.sin(ph)) * 1.1;
  mu.armL[0].rotation.x = -Math.sin(ph) * 0.9; mu.armL[1].rotation.x = -0.8; mu.armR[0].rotation.x = Math.sin(ph) * 0.9 - (Math.sin(t * 1.3) > 0.7 ? 1.2 : 0); mu.armR[1].rotation.x = -0.6;
  ST.F.userData.man.rotation.y = Math.sin(t * 0.4) * 0.6;
  ST.F.userData.chip.children[1].material.emissiveIntensity = 0.25 + 0.6 * env(t, E('tech') - 0.1, E('tech') + 2.5, 0.3, 0.6) * (0.7 + 0.3 * Math.sin(t * 8));
  ST.F.userData.mic.rotation.y = Math.sin(t) * 0.2;
  // G dome builds (wire fades in), city spins
  const dk = sm(E('virtual') - 0.2, E('virtual') + 1.2, t); ST.G.userData.grid.material.opacity = 0.05 + 0.4 * dk; ST.G.userData.dome.scale.setScalar(0.6 + 0.4 * dk); ST.G.userData.grid.scale.setScalar(0.6 + 0.4 * dk); ST.G.rotation.y = t * 0.15;
  // H clock hands + money fountain + chest lid
  const H = ST.H; H.userData.hand.rotation.z = -t * 2.6; H.userData.hand2.rotation.z = -t * 0.22; const mk = sm(E('money') - 0.1, E('money') + 0.6, t);
  H.userData.lid.rotation.x = -1.6 * mk;
  H.userData.billP.forEach(([x, vy, zz, d, r], i) => { const age = ((t - E('money')) * 0.9 + d) % 1.6; const on = t > E('money'); const tt = age; _p.set(5 + x * 4 * tt, on ? 2 + vy * tt - 6 * tt * tt : -20, zz * 3 * tt); _q.setFromEuler(_e.set(r + t * 3, r, t * 2 + r)); _s.setScalar(on ? 1 : 0.001); _m.compose(_p, _q, _s); H.userData.bills.setMatrixAt(i, _m); }); H.userData.bills.instanceMatrix.needsUpdate = true;
  // I phone gently floats
  ST.I.userData.phone.position.y = 0.2 * Math.sin(t * 1.4); ST.I.userData.phone.rotation.y = Math.sin(t * 0.6) * 0.25;
  // camera shake hooks
}
K.hooks.shake = t => { let x = 0, y = 0; for (const [tt, amp] of (window.SHK || [])) { const k = (t - tt) / 0.45; if (k >= 0 && k < 1) { const a = amp * (1 - k); x += Math.sin(t * 91) * a; y += Math.cos(t * 77) * a; } } return [x, y]; };
window.BG3D = t => K.draw(t, update);
window.toScr = (x, y, z) => K.toScreen(V(x, y, z));
window.UI_READY && window.UI_READY();
boot();
