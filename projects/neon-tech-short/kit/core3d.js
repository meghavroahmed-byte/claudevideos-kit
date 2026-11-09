// core3d.js: shared three.js core for Neon Tech videos (renderer + bloom, night sky, grid floor,
// helpers, Catmull-Rom camera through keys, world->screen projection). Each video builds its own objects.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
export { THREE };

export const W = 1080, H = 1920;
let R = Math.random;
export function seed(s) { let x = s >>> 0; R = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); }
seed(1);
export const rnd = (a = 0, b = 1) => a + (b - a) * R();

const cv3 = document.createElement('canvas'); cv3.width = W; cv3.height = H;
export const renderer = new THREE.WebGLRenderer({ canvas: cv3, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H, false); renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070a1c);
scene.fog = new THREE.FogExp2(0x10143a, 0.012);
export const camera = new THREE.PerspectiveCamera(46, W / H, 0.1, 1500);
export const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
export const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.6, 0.5, 0.86);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// sky dome
export const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: 'varying vec3 vp; void main(){ float k = clamp(vp.y*2.2,0.,1.); vec3 c = mix(vec3(0.10,0.10,0.24), vec3(0.015,0.02,0.07), pow(k,0.6)); gl_FragColor = vec4(c,1.); }',
}));
scene.add(sky);

// lights
export const hemi = new THREE.HemisphereLight(0x7183d8, 0x10141f, 1.3); scene.add(hemi);
export const moon = new THREE.DirectionalLight(0x9fb0ff, 1.3); moon.position.set(-60, 120, 40); scene.add(moon);
scene.add(new THREE.AmbientLight(0x1a2040, 0.6));

// ---------- helpers ----------
export function canvasTex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
export const std = (o) => new THREE.MeshStandardMaterial(o);
export const basic = (o) => new THREE.MeshBasicMaterial(o);
export function mesh(geo, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); (parent || scene).add(m); return m;
}
export function box(w, h, d, mat, x, y, z, parent) { return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent); }
export function group(x = 0, y = 0, z = 0, parent) { const g = new THREE.Group(); g.position.set(x, y, z); (parent || scene).add(g); return g; }
export function instanced(geo, mat, n, parent) {
  const m = new THREE.InstancedMesh(geo, mat, n); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); (parent || scene).add(m); return m;
}
const _o = new THREE.Object3D();
export function setInst(m, i, p, s = 1, rx = 0, ry = 0, rz = 0) {
  _o.position.set(p[0], p[1], p[2]); _o.rotation.set(rx, ry, rz);
  if (typeof s === 'number') _o.scale.setScalar(Math.max(1e-4, s)); else _o.scale.set(...s);
  _o.updateMatrix(); m.setMatrixAt(i, _o.matrix);
}
let _glowTex = null;
export function glowSprite(color, size, opacity = 1, parent) {
  _glowTex = _glowTex || canvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: _glowTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.set(size, size, 1); if (parent) parent.add(s); return s;
}
// text/icon sprite drawn on a canvas (always faces camera)
export function textSprite(draw, w = 512, h = 512, size = 4, parent) {
  const t = canvasTex(w, h, draw);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(size, size * h / w, 1); (parent || scene).add(s); return s;
}

// grid floor
export function gridFloor(size = 1200, cell = 64, opts = {}) {
  const tex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = opts.bg || '#0a0d22'; g.fillRect(0, 0, w, h);
    g.strokeStyle = opts.line || 'rgba(70,95,220,0.55)'; g.lineWidth = 3; g.strokeRect(0, 0, w, h);
    g.strokeStyle = opts.line2 || 'rgba(70,95,220,0.18)'; g.lineWidth = 2;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * w / 4, 0); g.lineTo(i * w / 4, h); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); }
  }, [size / cell, size / cell]);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), std({ map: tex, roughness: 0.9, metalness: 0.1 }));
  m.rotation.x = -Math.PI / 2; scene.add(m); return m;
}
// floating dust
export function dust(n, x0, x1, z0, z1, y1 = 30) {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = rnd(x0, x1); pos[i * 3 + 1] = rnd(0.5, y1); pos[i * 3 + 2] = rnd(z0, z1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x8fa8ff, size: 0.12, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(p); return p;
}

// ---------- camera ----------
let camCurve, lookCurve, camTimes = [], fovKeys = null;
export function setCamKeys(keys) { // [{t, p:[x,y,z], l:[x,y,z], fov?}]
  camTimes = keys.map(k => k.t);
  camCurve = new THREE.CatmullRomCurve3(keys.map(k => new THREE.Vector3(...k.p)), false, 'centripetal');
  lookCurve = new THREE.CatmullRomCurve3(keys.map(k => new THREE.Vector3(...k.l)), false, 'centripetal');
  fovKeys = keys.map(k => k.fov || 46);
}
const easeIO = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
function camU(t) {
  const n = camTimes.length;
  if (t <= camTimes[0]) return [0, 0, 0]; if (t >= camTimes[n - 1]) return [1, n - 2, 1];
  let i = 0; while (t > camTimes[i + 1]) i++;
  // ease inside each span (gentle settle on every key, but path stays continuous)
  const k = (t - camTimes[i]) / (camTimes[i + 1] - camTimes[i]);
  const e = 0.35 * k + 0.65 * easeIO(k);
  return [(i + e) / (n - 1), i, e];
}
export const hooks = { cam: null, shake: () => [0, 0] };
export function toScreen(v) {
  const p = v.clone().project(camera);
  return { x: (p.x * 0.5 + 0.5) * W, y: (1 - (p.y * 0.5 + 0.5)) * H, vis: p.z < 1 };
}
export function draw(t, update) {
  const [u, i, e] = camU(t);
  camera.position.copy(camCurve.getPoint(u));
  const look = lookCurve.getPoint(u);
  camera.fov = fovKeys[i] + (fovKeys[Math.min(i + 1, fovKeys.length - 1)] - fovKeys[i]) * e; camera.updateProjectionMatrix();
  if (hooks.cam) { const o = hooks.cam(t); if (o && o.w > 0) { camera.position.lerp(o.p, o.w); look.lerp(o.l, o.w); } }
  const [sx, sy] = hooks.shake(t); camera.position.x += sx; camera.position.y += sy;
  camera.lookAt(look);
  camera.updateMatrixWorld();
  update && update(t);
  composer.render();
  return cv3;
}
