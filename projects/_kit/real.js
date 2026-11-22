// Shared "realistic" kit (style v2): Poly Haven world, realistic rigged humans, labels, x-ray circle, ghost.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GroundedSkybox } from 'three/addons/objects/GroundedSkybox.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export const A = './assets/';
export const ASSETS = { models: {}, hdr: {}, env: {}, tex: {} };
const Q = () => new THREE.Quaternion();
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// models: Poly Haven names; hdris: names; people: always loaded (rpm avatar + Xbot clips [+ michelle, soldier])
export async function loadKit(renderer, { models = [], hdris = [], tex = [], people = ['readyplayer.me', 'Michelle', 'Soldier'] } = {}) {
  const gl = new GLTFLoader();
  const pm = new THREE.PMREMGenerator(renderer);
  await Promise.all([
    ...models.map(n => gl.loadAsync(`${A}${n}/${n}.gltf`).then(g => { ASSETS.models[n] = g.scene; })),
    ...hdris.map(n => new RGBELoader().loadAsync(`${A}hdri/${n}.hdr`).then(h => { h.mapping = THREE.EquirectangularReflectionMapping; ASSETS.hdr[n] = h; ASSETS.env[n] = pm.fromEquirectangular(h).texture; })),
    ...people.map(n => gl.loadAsync(`${A}people/${n}.glb`).then(g => { ASSETS.models['@' + n] = g; })),
    gl.loadAsync(`${A}people/Xbot.glb`).then(g => { ASSETS.xbot = g; }),
  ]);
  const tl = new THREE.TextureLoader();
  await Promise.all(tex.map(async n => {
    const load = (k) => tl.loadAsync(`${A}tex/${n}_${k}.jpg`).catch(() => null);
    const [d, nr, r] = await Promise.all([load('diff'), load('nor'), load('rough')]);
    if (d) d.colorSpace = THREE.SRGBColorSpace;
    [d, nr, r].forEach(t => { if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; } });
    ASSETS.tex[n] = { map: d, normalMap: nr, roughnessMap: r };
  }));
}

// textured PBR material from a Poly Haven texture set, repeated rx x ry
export function texMat(n, rx = 1, ry = 1, extra = {}) {
  const s = ASSETS.tex[n]; const m = new THREE.MeshStandardMaterial({ roughness: 1, ...extra });
  for (const k of ['map', 'normalMap', 'roughnessMap']) if (s[k]) { m[k] = s[k].clone(); m[k].repeat.set(rx, ry); m[k].needsUpdate = true; }
  return m;
}

// Turn a makeStage() scene into an HDRI world. height = camera-ish height of the photo, radius = ground radius.
export function world(scene, hdri, { height = 6, radius = 60, env = 0.9, sun = 1.6, sunColor = 0xfff1dd, hemi = 0.25, sky = true } = {}) {
  scene.userData.sky.visible = false;
  scene.children.filter(o => o.isMesh && !o.material.isShadowMaterial && o.geometry && o.geometry.type === 'PlaneGeometry').forEach(o => o.visible = false);
  scene.environment = ASSETS.env[hdri]; scene.environmentIntensity = env; scene.fog = null;
  if (sky) { const s = new GroundedSkybox(ASSETS.hdr[hdri], height, radius); s.position.y = height - 0.01; scene.add(s); scene.userData.gsky = s; }
  else scene.background = ASSETS.hdr[hdri];
  const h = scene.children.find(o => o.isHemisphereLight); if (h) h.intensity = hemi;
  const key = scene.userData.key; key.intensity = sun; key.color.set(sunColor);
  return scene;
}

export function prop(n, s = 1) {
  const o = ASSETS.models[n].clone(true); o.scale.setScalar(s);
  o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return o;
}

export function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

// ---------- realistic person ----------
// kind: 'hero' (Ready Player Me man, MR. CLOUD print), 'michelle', 'soldier'. Animated by Xbot Mixamo clips via model-space retarget.
// person.update(t, { idle:1, walk:0, run:0, agree:0, headShake:0, sad_pose:0, sneak_pose:0 }, speedScale) then person.pose(fn) for bone tweaks.
const SRC = {}; // shared source rig per clip set
function srcRig() {
  if (SRC.rig) return SRC.rig;
  const g = ASSETS.xbot; const root = SkeletonUtils.clone(g.scene); const sb = {};
  root.traverse(o => { if (o.isBone) sb[o.name.replace(/^mixamorig:?/, '')] = o; });
  root.updateMatrixWorld(true);
  return (SRC.rig = { root, sb, clips: Object.fromEntries(g.animations.map(c => [c.name, c])) });
}
const mq = (o, root) => { const q = Q(), r = Q(); o.getWorldQuaternion(q); root.getWorldQuaternion(r); return r.invert().multiply(q); };
export function person(kind = 'hero', { print = kind === 'hero', shirt = null } = {}) {
  const key = { hero: '@readyplayer.me', michelle: '@Michelle', soldier: '@Soldier' }[kind];
  const root = SkeletonUtils.clone(ASSETS.models[key].scene);
  const g = new THREE.Group(); g.add(root);
  if (kind !== 'hero') root.scale.setScalar(1); // Michelle/Soldier are already ~1.7 m in their glb root transform
  root.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; } });
  const bone = {}; root.traverse(o => { if (o.isBone) bone[o.name.replace(/^mixamorig:?/, '')] = o; });
  if (shirt != null) root.traverse(m => { if (m.isMesh && /Outfit_Top/.test(m.name)) { m.material = m.material.clone(); m.material.color.set(shirt); } });
  const faces = []; root.traverse(m => { if (m.isMesh && m.morphTargetDictionary && 'mouthOpen' in m.morphTargetDictionary) faces.push(m); });
  if (print && bone.Spine2) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.05), new THREE.MeshStandardMaterial({ map: canvasTex(512, 128, (c) => { c.font = "400 92px Brand, sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(255,255,255,0.92)'; c.fillText('MR. CLOUD', 256, 68); }), transparent: true, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -4 }));
    bone.Spine2.add(p); p.position.set(0, 0.1, 0.135); g.userData.print = p;
  }
  // retarget setup
  const src = srcRig(); const mixer = new THREE.AnimationMixer(src.root); const act = {};
  for (const [n, c] of Object.entries(src.clips)) { act[n] = mixer.clipAction(c); act[n].play(); act[n].weight = 0; }
  const restPose = {}; Object.keys(src.sb).forEach(n => { restPose[n] = src.sb[n].quaternion.clone(); });
  // rest model-space quats (both in bind pose)
  root.updateMatrixWorld(true); mixer.setTime(0); mixer.stopAllAction(); Object.keys(src.sb).forEach(n => src.sb[n].quaternion.copy(restPose[n])); src.root.updateMatrixWorld(true);
  const names = []; (bone.Hips || root).traverse(o => { const n = o.name.replace(/^mixamorig:?/, ''); if (o.isBone && src.sb[n]) names.push(n); });
  const srest = {}, trest = {}; names.forEach(n => { srest[n] = mq(src.sb[n], src.root).invert(); trest[n] = mq(bone[n], root); });
  for (const n in act) act[n].play();
  const hipsY0 = bone.Hips ? bone.Hips.position.y : 0;
  const P = {
    root: g, bone, faces,
    // weights: clip name -> weight. t: time in seconds (clip time = t*speed)
    update(t, weights = { idle: 1 }, speed = 1) {
      for (const n in act) act[n].weight = weights[n] || 0;
      const tot = Object.values(weights).reduce((a, b) => a + b, 0);
      if (tot < 1e-3) act.idle.weight = 1;
      mixer.setTime(t * speed);
      src.root.updateMatrixWorld(true); g.updateMatrixWorld(true);
      const rootQ = Q(); root.getWorldQuaternion(rootQ); const rinv = rootQ.invert();
      for (const n of names) {
        const b = bone[n]; const want = mq(src.sb[n], src.root).multiply(srest[n]).multiply(trest[n]);
        const pq = Q(); b.parent.getWorldQuaternion(pq); const pm = rinv.clone().multiply(pq);
        b.quaternion.copy(pm.invert().multiply(want)); b.updateMatrixWorld(true);
      }
      return P;
    },
    // rotate a bone in its parent's model-space-ish frame: axis in MODEL space (x right, y up, z forward)
    turn(name, axis, ang) {
      const b = bone[name]; if (!b || !ang) return P;
      const rootQ = Q(); root.getWorldQuaternion(rootQ);
      const pq = Q(); b.parent.getWorldQuaternion(pq);
      const worldAxis = V(...axis).applyQuaternion(rootQ).normalize();
      const localAxis = worldAxis.applyQuaternion(pq.invert()).normalize();
      b.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(localAxis, ang)); b.updateMatrixWorld(true);
      return P;
    },
    mouth(k) { faces.forEach(m => { m.morphTargetInfluences[m.morphTargetDictionary.mouthOpen] = k; }); return P; },
    smile(k) { faces.forEach(m => { const i = m.morphTargetDictionary.mouthSmile; if (i != null) m.morphTargetInfluences[i] = k; }); return P; },
    // canned bone poses on top of the clip (k = 0..1)
    flinch(k) { if (k < 0.01) return P; return P.turn('Spine', [1, 0, 0], -0.25 * k).turn('LeftArm', [1, 0, 0], -1.3 * k).turn('RightArm', [1, 0, 0], -1.3 * k).turn('LeftForeArm', [0, 1, 0], 1.4 * k).turn('RightForeArm', [0, 1, 0], -1.4 * k); },
    point(k, side = 'Right') { if (k < 0.01) return P; return P.turn(side + 'Arm', [1, 0, 0], -1.35 * k).turn(side + 'Arm', [0, 0, 1], (side === 'Right' ? -0.3 : 0.3) * k); },
    handsOn(part, k) { // part: 'head'|'chest'|'belly'|'throat'
      if (k < 0.01) return P; const a = { head: 2.3, throat: 1.9, chest: 1.5, belly: 1.1 }[part] || 1.5;
      return P.turn('LeftArm', [1, 0, 0], -a * 0.55 * k).turn('RightArm', [1, 0, 0], -a * 0.55 * k).turn('LeftForeArm', [0, 1, 0], 1.6 * k).turn('RightForeArm', [0, 1, 0], -1.6 * k);
    },
    hipsDrop(dy) { if (bone.Hips) bone.Hips.position.y = hipsY0 - dy / Math.max(1e-6, bone.Hips.parent.getWorldScale(V()).y); return P; },
    headPos() { const v = V(); bone.Head.getWorldPosition(v); return v; },
    world(name) { const v = V(); bone[name].getWorldPosition(v); return v; },
  };
  P.update(0);
  return P;
}

// plain label: white bold text, thick black outline, no panel
export function label(text, w = 1.0) {
  const t = canvasTex(1024, 256, (g) => { g.font = "900 120px Cap, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 22; g.strokeStyle = '#000'; g.strokeText(text, 512, 128); g.fillStyle = '#fff'; g.fillText(text, 512, 128); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); s.renderOrder = 40;
  s.set = (k) => { s.visible = k > 0.01; s.scale.set(w * k, w * 0.25 * k, 1); }; s.set(0); return s;
}
// label shown between a0 and a1 at world position pos
export function showLabel(l, pos, t, a0, a1) {
  const k = Math.min(1, Math.max(0, (t - a0) / 0.15)) * (1 - Math.min(1, Math.max(0, (t - a1) / 0.15)));
  const e = 1 - Math.pow(1 - k, 3); l.position.copy(pos); l.set(e);
}

// x-ray circle: dark inside, red ring; draw(g, k, t) paints the inside on a 512x512 canvas (centre 256,256, radius 236)
export function xray(size = 0.8) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); s.renderOrder = 35; s.visible = false;
  s.show = (pos, k, draw, kk = 0, tt = 0) => {
    s.visible = k > 0.01; if (!s.visible) return;
    g.clearRect(0, 0, 512, 512); g.save(); g.beginPath(); g.arc(256, 256, 236, 0, 7); g.clip();
    g.fillStyle = 'rgba(12,20,38,0.92)'; g.fillRect(0, 0, 512, 512);
    g.strokeStyle = 'rgba(210,230,255,0.95)'; g.fillStyle = 'rgba(210,230,255,0.9)'; g.lineWidth = 10; g.lineCap = 'round'; g.lineJoin = 'round';
    draw(g, kk, tt); g.restore();
    g.strokeStyle = '#ff3b30'; g.lineWidth = 16; g.beginPath(); g.arc(256, 256, 238, 0, 7); g.stroke(); t.needsUpdate = true;
    s.position.copy(pos); s.scale.setScalar(size * (1 - Math.pow(1 - k, 3)));
  };
  return s;
}

// ghost / hologram copy of any object (white-blue translucent)
export function ghost(obj, color = 0xdff4ff) {
  const gh = obj.isObject3D ? SkeletonUtils.clone(obj) : obj;
  const mats = [];
  gh.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; m.material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }); mats.push(m.material); } });
  gh.fade = (k) => { gh.visible = k > 0.01; mats.forEach(m => { m.opacity = 0.55 * k; }); };
  gh.fade(0);
  return gh;
}

// keyframed camera: KEYS = [[t, [px,py,pz], [lx,ly,lz]], ...] with smoothstep between keys
export function keyCam(KEYS, t) {
  let j = 0; while (j < KEYS.length - 2 && KEYS[j + 1][0] < t) j++;
  const a = KEYS[j], b = KEYS[j + 1]; const u = Math.min(1, Math.max(0, (t - a[0]) / Math.max(1e-6, b[0] - a[0]))); const k = u * u * (3 - 2 * u);
  return { pos: V(...a[1]).lerp(V(...b[1]), k), look: V(...a[2]).lerp(V(...b[2]), k) };
}
// keyframed value path: P = [[t, [..values]], ...]
export function keyPath(P, t) {
  let j = 0; while (j < P.length - 2 && P[j + 1][0] < t) j++;
  const a = P[j], b = P[j + 1]; const u = Math.min(1, Math.max(0, (t - a[0]) / Math.max(1e-6, b[0] - a[0]))); const k = u * u * (3 - 2 * u);
  return { v: a[1].map((x, i) => x + (b[1][i] - x) * k), k, moving: k > 0.01 && k < 0.99 && a[1].some((x, i) => x !== b[1][i]) };
}
