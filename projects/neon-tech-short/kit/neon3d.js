// neon3d.js: real 3D night worlds for the Neon Tech kit (three.js + bloom).
// World 1 (rail): fields, double rail track, catenary poles, trees, lattice tower, lit train with headlight beam.
// World 2 (city, further along +z): lit-window buildings, roads, street lights, taxis, glowing route, scooter rider.
// One continuous camera (Catmull-Rom through keys) flies between them.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const W = 1080, H = 1920;
let R = Math.random; export function seed(s) { let x = s >>> 0; R = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); }
seed(11);
const rnd = (a, b) => a + (b - a) * R();

// ---------- renderer ----------
const cv3 = document.createElement('canvas'); cv3.width = W; cv3.height = H;
const renderer = new THREE.WebGLRenderer({ canvas: cv3, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H, false); renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = false;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070a1c);
scene.fog = new THREE.FogExp2(0x161a3e, 0.0062);
// sky dome: navy top -> purple-blue horizon
{ const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: 'varying vec3 vp; void main(){ float k = clamp(vp.y*2.2,0.,1.); vec3 c = mix(vec3(0.13,0.12,0.27), vec3(0.02,0.03,0.09), pow(k,0.6)); gl_FragColor = vec4(c,1.); }' }));
  sky.position.set(0, 0, 300); scene.add(sky); }
const camera = new THREE.PerspectiveCamera(48, W / H, 0.3, 1600);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.6, 0.5, 0.86);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// lights
scene.add(new THREE.HemisphereLight(0x7183d8, 0x10141f, 1.5));
const moon = new THREE.DirectionalLight(0x9fb0ff, 1.4); moon.position.set(-60, 120, 40); scene.add(moon);
scene.add(new THREE.AmbientLight(0x1a2040, 0.6));

// ---------- helpers ----------
function canvasTex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
const std = (o) => new THREE.MeshStandardMaterial(o);
function box(w, h, d, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); (parent || scene).add(m); return m;
}
function instanced(geo, mat, list) { // list: [{p:[x,y,z], s:[sx,sy,sz], r:ry, c:color}]
  const m = new THREE.InstancedMesh(geo, mat, list.length), o = new THREE.Object3D();
  list.forEach((it, i) => {
    o.position.set(...it.p); o.rotation.set(0, it.r || 0, 0); o.scale.set(...(it.s || [1, 1, 1])); o.updateMatrix();
    m.setMatrixAt(i, o.matrix); if (it.c !== undefined) m.setColorAt(i, new THREE.Color(it.c));
  });
  scene.add(m); return m;
}
function glowSprite(color, size, opacity = 1) {
  const tex = canvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.set(size, size, 1); return s;
}

// ---------- ground: dark field patches ----------
const fieldTex = canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = '#0d1424'; g.fillRect(0, 0, w, h);
  const cols = ['#0f1b2e', '#132235', '#10241c', '#0c1a16', '#16203a', '#0e1830', '#122a20'];
  for (let i = 0; i < 70; i++) {
    g.fillStyle = cols[Math.floor(R() * cols.length)];
    g.fillRect(R() * w, R() * h, rnd(80, 260), rnd(60, 220));
  }
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3;
  for (let i = 0; i < 18; i++) { g.beginPath(); g.moveTo(R() * w, 0); g.lineTo(R() * w, h); g.stroke(); }
}, [6, 6]);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), std({ map: fieldTex, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 300); scene.add(ground);

// ---------- rail world ----------
const RAIL_Z0 = -60, RAIL_Z1 = 400, RAIL_L = RAIL_Z1 - RAIL_Z0, RAIL_ZC = (RAIL_Z0 + RAIL_Z1) / 2;
const ballastM = std({ color: 0x2a2c35, roughness: 1 });
const railM = std({ color: 0xc9ced9, metalness: 0.9, roughness: 0.25 });
const sleeperM = std({ color: 0x3d3a3a, roughness: 0.9 });
for (const tx of [0, 5.2]) {
  box(4.2, 0.35, RAIL_L, ballastM, tx, 0.17, RAIL_ZC);
  for (const rx of [-0.75, 0.75]) box(0.14, 0.22, RAIL_L, railM, tx + rx, 0.46, RAIL_ZC);
  const sl = []; for (let z = RAIL_Z0; z < RAIL_Z1; z += 0.75) sl.push({ p: [tx, 0.38, z] });
  instanced(new THREE.BoxGeometry(2.4, 0.12, 0.28), sleeperM, sl);
}
// catenary poles + wires
const poleM = std({ color: 0x8b93a8, metalness: 0.6, roughness: 0.5 });
const poles = [], arms = [];
for (let z = RAIL_Z0; z < RAIL_Z1; z += 28) { poles.push({ p: [-3.2, 4.5, z] }); poles.push({ p: [8.4, 4.5, z] }); arms.push({ p: [2.6, 8.6, z] }); }
instanced(new THREE.BoxGeometry(0.28, 9, 0.28), poleM, poles);
instanced(new THREE.BoxGeometry(11.6, 0.18, 0.18), poleM, arms);
const wireM = new THREE.MeshBasicMaterial({ color: 0x6c7896 });
for (const wx of [0, 5.2]) box(0.04, 0.04, RAIL_L, wireM, wx, 7.9, RAIL_ZC);

// trees
const trees = [], trunks = [];
for (let i = 0; i < 520; i++) {
  const x = (R() < 0.5 ? -1 : 1) * rnd(12, 160), z = rnd(RAIL_Z0, 330), s = rnd(1.6, 3.6);
  trees.push({ p: [x, 2.2 * s, z], s: [s, s * 1.1, s], r: R() * 6, c: new THREE.Color().setHSL(rnd(0.36, 0.45), 0.45, rnd(0.07, 0.13)) });
  trunks.push({ p: [x, 1.1 * s, z], s: [s * 0.25, s * 2.2, s * 0.25] });
}
instanced(new THREE.IcosahedronGeometry(1.5, 0), std({ color: 0xffffff, flatShading: true, roughness: 0.9 }), trees);
instanced(new THREE.CylinderGeometry(0.4, 0.5, 1, 5), std({ color: 0x1a120c }), trunks);

// lattice telecom tower
export const TOWER = new THREE.Vector3(26, 0, 168);
{
  const g = new THREE.Group(); g.position.copy(TOWER); scene.add(g);
  const hgt = 34, pts = [];
  const leg = (y) => 3.2 * (1 - y / hgt) + 0.5;
  const corners = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
  for (let k = 0; k < 4; k++) {
    const [a, b] = corners[k], [c, d] = corners[(k + 1) % 4];
    pts.push(a * leg(0), 0, b * leg(0), a * leg(hgt), hgt, b * leg(hgt));
    for (let y = 0; y < hgt; y += 3.4) {
      const y2 = y + 3.4;
      pts.push(a * leg(y), y, b * leg(y), c * leg(y2), y2, d * leg(y2));
      pts.push(c * leg(y), y, d * leg(y), a * leg(y2), y2, b * leg(y2));
      pts.push(a * leg(y), y, b * leg(y), c * leg(y), y, d * leg(y));
    }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xb8c4e8 })));
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff3355 }));
  tip.position.y = hgt + 0.6; g.add(tip);
  const tg = glowSprite(0xff3355, 4); tg.position.y = hgt + 0.6; g.add(tg); g.userData.tipGlow = tg;
  for (const s of [-1, 1]) { const p = box(0.8, 2.2, 0.5, std({ color: 0xdfe6ff }), s * 1.3, hgt - 3, 0, g); p.rotation.y = s * 0.4; }
  TOWER.group = g;
}

// ---------- train ----------
const winTex = canvasTex(512, 64, (g, w, h) => {
  g.fillStyle = '#c3c8d4'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9; i++) {
    const x = 18 + i * 54; const lit = R() < 0.85;
    g.fillStyle = lit ? (R() < 0.5 ? '#ffe2a8' : '#fff1d0') : '#2c3245'; g.fillRect(x, 12, 38, 34);
  }
});
const winEm = canvasTex(512, 64, (g, w, h) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  seed(5);
  for (let i = 0; i < 9; i++) { const x = 18 + i * 54; if (R() < 0.85) { g.fillStyle = '#ffcf85'; g.fillRect(x, 12, 38, 34); } }
  seed(99);
});
const bodyM = std({ color: 0xb9bfcc, metalness: 0.55, roughness: 0.35 });
const redM = std({ color: 0xb3172c, metalness: 0.3, roughness: 0.45 });
const roofM = std({ color: 0x7c8394, metalness: 0.6, roughness: 0.4 });
const sideM = std({ color: 0xffffff, map: winTex, emissive: 0xffffff, emissiveMap: winEm, emissiveIntensity: 1.1, roughness: 0.4 });
const COACH_L = 19, GAP = 0.9;
export const TRAIN = new THREE.Group(); scene.add(TRAIN);
function coach(z, loco) {
  const g = new THREE.Group(); g.position.z = z; TRAIN.add(g);
  if (loco) {
    box(3.0, 3.3, COACH_L, redM, 0, 2.35, 0, g);
    box(3.02, 0.5, COACH_L, std({ color: 0xf2f2f2 }), 0, 1.35, 0, g);
    box(2.6, 0.5, COACH_L - 1, roofM, 0, 4.2, 0, g);
    const ws = box(2.4, 1.0, 0.1, std({ color: 0x0c1020, metalness: 0.9, roughness: 0.1 }), 0, 3.2, COACH_L / 2 + 0.01, g);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    hl.position.set(0, 2.2, COACH_L / 2 + 0.1); g.add(hl);
    const hg = glowSprite(0xfff3d6, 4); hg.position.copy(hl.position); g.add(hg);
    for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe0b0 })); m.position.set(s * 1.1, 1.3, COACH_L / 2 + 0.1); g.add(m); }
    // headlight beam: additive cone
    const beam = new THREE.Mesh(new THREE.ConeGeometry(5, 46, 32, 1, true), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { c: { value: new THREE.Color(0xfff0c8) } },
      vertexShader: 'varying float vy; void main(){ vy = position.y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform vec3 c; varying float vy; void main(){ float k = clamp((vy+23.)/46.,0.,1.); gl_FragColor = vec4(c*pow(k,3.0)*0.14,1.); }',
    }));
    beam.rotation.x = -Math.PI / 2; beam.position.set(0, 2.0, COACH_L / 2 + 23); g.add(beam);
    const sp = new THREE.SpotLight(0xfff0d0, 900, 90, 0.42, 0.5, 1.6); sp.position.set(0, 2.4, COACH_L / 2); sp.target.position.set(0, 0, COACH_L / 2 + 40);
    g.add(sp); g.add(sp.target);
  } else {
    box(2.95, 3.0, COACH_L, bodyM, 0, 2.4, 0, g);
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(COACH_L - 0.6, 1.5), sideM);
      p.position.set(s * 1.485, 2.85, 0); p.rotation.y = s * Math.PI / 2; g.add(p);
    }
    box(2.98, 0.55, COACH_L, redM, 0, 1.25, 0, g);
    box(2.6, 0.45, COACH_L - 0.4, roofM, 0, 4.1, 0, g);
  }
  box(2.2, 0.6, COACH_L - 4, std({ color: 0x15161c }), 0, 0.75, 0, g);
}
for (let i = 0; i < 9; i++) coach(-i * (COACH_L + GAP), i === 0);
export function trainHead(t) { return 18 + 11 * t; } // z of loco centre

// ---------- city world ----------
export const CITY = { z0: 430, z1: 720, x0: -170, x1: 170, step: 30, road: 9 };
{
  const { z0, z1, x0, x1, step, road } = CITY;
  const asph = std({ color: 0x15171f, roughness: 0.85 });
  const lineTex = canvasTex(64, 512, (g, w, h) => { g.fillStyle = '#15171f'; g.fillRect(0, 0, w, h); g.fillStyle = '#d9d2b0'; for (let y = 0; y < h; y += 64) g.fillRect(29, y, 6, 34); }, [1, 30]);
  const roadM = std({ map: lineTex, roughness: 0.8 });
  const base = box(x1 - x0 + 40, 0.1, z1 - z0 + 40, std({ color: 0x0d0f17, roughness: 1 }), 0, 0.05, (z0 + z1) / 2);
  for (let x = x0; x <= x1; x += step) { const m = box(road, 0.12, z1 - z0, roadM, x, 0.12, (z0 + z1) / 2); }
  for (let z = z0; z <= z1; z += step) { const m = box(x1 - x0, 0.13, road, asph, 0, 0.13, z); }
  // building materials with lit windows
  const mats = [0, 1, 2, 3].map(v => {
    const s = 100 + v;
    const col = canvasTex(128, 256, (g, w, h) => {
      seed(s); g.fillStyle = ['#1a1e2e', '#20202a', '#171c26', '#262433'][v]; g.fillRect(0, 0, w, h);
      for (let y = 6; y < h; y += 14) for (let x = 6; x < w; x += 14) { g.fillStyle = R() < 0.35 ? '#3b3f52' : '#11131c'; g.fillRect(x, y, 8, 9); }
    });
    const em = canvasTex(128, 256, (g, w, h) => {
      seed(s); g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      for (let y = 6; y < h; y += 14) for (let x = 6; x < w; x += 14) { const r = R(); if (r < 0.35) { g.fillStyle = R() < 0.75 ? '#ffc070' : (R() < 0.5 ? '#9fd8ff' : '#ff8fc8'); g.fillRect(x, y, 8, 9); } }
    });
    seed(200 + v);
    for (const tx of [col, em]) { tx.wrapS = tx.wrapT = THREE.RepeatWrapping; }
    return std({ map: col, emissive: 0xffffff, emissiveMap: em, emissiveIntensity: 1.0, roughness: 0.7 });
  });
  const lists = [[], [], [], []];
  for (let x = x0; x < x1; x += step) for (let z = z0; z < z1; z += step) {
    const bx0 = x + road / 2 + 1, bz0 = z + road / 2 + 1, sz = step - road - 2;
    const n = 2 + Math.floor(R() * 3);
    for (let k = 0; k < n; k++) {
      const w = rnd(4, sz / 1.6), d = rnd(4, sz / 1.6), hgt = rnd(5, 30) * (R() < 0.12 ? 2 : 1);
      const px = bx0 + rnd(w / 2, sz - w / 2), pz = bz0 + rnd(d / 2, sz - d / 2);
      if (Math.abs(px) < 7 && pz < 470) continue;
      lists[Math.floor(R() * 4)].push({ p: [px, hgt / 2, pz], s: [w, hgt, d] });
    }
  }
  lists.forEach((l, i) => {
    const geos = l.map(it => {
      const [w, h, d] = it.s, gb = new THREE.BoxGeometry(w, h, d), uv = gb.attributes.uv;
      // faces: +x,-x,+y,-y,+z,-z (4 verts each). Scale UVs to building size; roofs get a blank texel.
      for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
        const j = f * 4 + v, su = (f < 2 ? d : w) / 11, sv = h / 22;
        if (f === 2 || f === 3) uv.setXY(j, 0.005, 0.995); else uv.setXY(j, uv.getX(j) * su, uv.getY(j) * sv);
      }
      gb.translate(...it.p); return gb;
    });
    if (geos.length) scene.add(new THREE.Mesh(mergeGeometries(geos), mats[i]));
  });
  // street lights: glowing dots along roads
  const lamps = [];
  for (let x = x0; x <= x1; x += step) for (let z = z0; z < z1; z += 10) lamps.push({ p: [x + road / 2 - 0.4, 5, z], s: [1, 1, 1] });
  instanced(new THREE.SphereGeometry(0.28, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffd28a }), lamps);
  // taxis
  const taxis = [];
  for (let i = 0; i < 70; i++) {
    const vert = R() < 0.5;
    const lx = x0 + step * Math.floor(R() * ((x1 - x0) / step + 1)), lz = z0 + step * Math.floor(R() * ((z1 - z0) / step + 1));
    taxis.push(vert ? { p: [lx + (R() < 0.5 ? -2 : 2), 0.9, rnd(z0, z1)], s: [1.8, 1.2, 3.8] } : { p: [rnd(x0, x1), 0.9, lz + (R() < 0.5 ? -2 : 2)], s: [3.8, 1.2, 1.8] });
  }
  instanced(new THREE.BoxGeometry(1, 1, 1), std({ color: 0xf5c518, roughness: 0.4, emissive: 0x3a2a00 }), taxis);
  // neon signs on a few buildings
  for (let i = 0; i < 26; i++) {
    const c = [0xff2e88, 0x2ee6ff, 0xa66bff, 0x2eff9a][i % 4];
    const m = new THREE.Mesh(new THREE.PlaneGeometry(rnd(3, 7), 0.9), new THREE.MeshBasicMaterial({ color: c }));
    const x = x0 + step * Math.floor(R() * 11) + 6, z = rnd(z0, z1);
    m.position.set(x, rnd(4, 9), z); m.rotation.y = -Math.PI / 2; scene.add(m);
  }
}

// glowing route (tube with animated draw range) through city streets
export const ROUTE = new THREE.CatmullRomCurve3([
  [10, 0.4, 440], [10, 0.4, 500], [10, 0.4, 545], [15, 0.4, 550], [35, 0.4, 550], [40, 0.4, 555], [40, 0.4, 600], [40, 0.4, 635], [45, 0.4, 640], [65, 0.4, 640], [70, 0.4, 645], [70, 0.4, 690],
].map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0.2);
const routeGeo = new THREE.TubeGeometry(ROUTE, 400, 0.32, 8, false);
const routeMesh = new THREE.Mesh(routeGeo, new THREE.MeshBasicMaterial({ color: 0x29cdb8 }));
scene.add(routeMesh);
const routeCount = routeGeo.index.count;
export function setRoute(k) { routeGeo.setDrawRange(0, Math.floor(routeCount * Math.max(0, Math.min(1, k)) / 6) * 6); }
setRoute(0);

// destination pin
export const PIN = new THREE.Group(); scene.add(PIN);
{
  const p = ROUTE.getPoint(1); PIN.position.set(p.x, 0, p.z);
  const head = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffc93c }));
  head.position.y = 6; PIN.add(head);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3.5, 16), new THREE.MeshBasicMaterial({ color: 0xffc93c }));
  cone.rotation.x = Math.PI; cone.position.y = 3.6; PIN.add(cone);
  const gs = glowSprite(0xffc93c, 6, 0.7); gs.position.y = 6; PIN.add(gs);
}

// scooter rider
export const RIDER = new THREE.Group(); scene.add(RIDER);
const RIDER_IN = new THREE.Group(); RIDER_IN.scale.setScalar(1.7); RIDER.add(RIDER_IN);
{
  const red = std({ color: 0xe0192f, roughness: 0.35, metalness: 0.2 });
  const blk = std({ color: 0x111111, roughness: 0.6 });
  box(0.7, 0.55, 2.2, red, 0, 0.75, 0, RIDER_IN);                 // body
  box(0.6, 1.1, 0.3, red, 0, 1.3, 0.85, RIDER_IN);                // front column
  for (const z of [-0.8, 0.85]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16), blk); w.rotation.z = Math.PI / 2; w.position.set(0, 0.42, z); RIDER_IN.add(w); }
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.8, 4, 10), red); torso.position.set(0, 1.85, -0.1); torso.rotation.x = 0.25; RIDER_IN.add(torso);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), red); helmet.position.set(0, 2.75, 0.1); RIDER_IN.add(helmet);
  box(1.3, 1.1, 1.1, red, 0, 2.0, -0.95, RIDER_IN);               // delivery bag
  const tl = glowSprite(0xff2040, 2.2); tl.position.set(0, 0.95, -1.15); RIDER_IN.add(tl);
  const hl = glowSprite(0xfff3d6, 1.6, 0.6); hl.position.set(0, 1.5, 1.05); RIDER_IN.add(hl);
  const sp = new THREE.SpotLight(0xfff0d0, 250, 30, 0.5, 0.6, 1.5); sp.position.set(0, 1.5, 1.0); sp.target.position.set(0, 0, 12); RIDER_IN.add(sp); RIDER_IN.add(sp.target);
}
export function riderAt(u) {
  const p = ROUTE.getPointAt(u), q = ROUTE.getPointAt(Math.min(1, u + 0.002));
  RIDER.position.set(p.x, 0, p.z); RIDER.lookAt(q.x, 0, q.z);
  return p;
}

// signal beam (train -> tower)
const beamMat = new THREE.MeshBasicMaterial({ color: 0x53e0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
const beamMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1, 8, 1, true), beamMat); scene.add(beamMesh);
export function setBeam(a, b, k) {
  beamMat.opacity = k; beamMesh.visible = k > 0.01; if (!beamMesh.visible) return;
  const d = new THREE.Vector3().subVectors(b, a); beamMesh.position.copy(a).addScaledVector(d, 0.5);
  beamMesh.scale.set(1, d.length(), 1); beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
}
// ground rings (pulsing)
const rings = [];
export function ring(x, z, color) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64), new THREE.MeshBasicMaterial({ color, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.5, z); scene.add(m); rings.push(m); return m;
}

// ---------- camera path ----------
let camCurve = null, lookCurve = null, camTimes = [];
export function setCamKeys(keys) { // [{t, p:[x,y,z], l:[x,y,z]}]
  camTimes = keys.map(k => k.t);
  camCurve = new THREE.CatmullRomCurve3(keys.map(k => new THREE.Vector3(...k.p)), false, 'centripetal');
  lookCurve = new THREE.CatmullRomCurve3(keys.map(k => new THREE.Vector3(...k.l)), false, 'centripetal');
}
function camU(t) {
  const n = camTimes.length;
  if (t <= camTimes[0]) return 0; if (t >= camTimes[n - 1]) return 1;
  let i = 0; while (t > camTimes[i + 1]) i++;
  const k = (t - camTimes[i]) / (camTimes[i + 1] - camTimes[i]);
  return (i + k) / (n - 1);
}
export const shake = { x: 0, y: 0 };
export const hooks = { cam: null }; // (t) => { p: Vector3, l: Vector3, w: 0..1 } blends over the key path
export function draw(t, update) {
  update && update(t);
  const u = camU(t);
  camera.position.copy(camCurve.getPoint(u)); camera.position.x += shake.x * 0.02; camera.position.y += shake.y * 0.02;
  const look = lookCurve.getPoint(u);
  if (hooks.cam) { const o = hooks.cam(t); if (o && o.w > 0) { camera.position.lerp(o.p, o.w); look.lerp(o.l, o.w); } }
  camera.lookAt(look);
  if (TOWER.group) TOWER.group.userData.tipGlow.material.opacity = 0.5 + 0.5 * Math.abs(Math.sin(t * 3));
  composer.render();
  return cv3;
}
export { THREE, scene, camera, renderer };
