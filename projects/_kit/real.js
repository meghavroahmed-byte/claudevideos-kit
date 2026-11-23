// Shared "realistic" kit (style v2): Poly Haven world, realistic rigged humans, labels, x-ray circle, ghost.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GroundedSkybox } from 'three/addons/objects/GroundedSkybox.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export const A = './assets/';
export const ASSETS = { models: {}, anims: {}, hdr: {}, env: {}, tex: {} };
const Q = () => new THREE.Quaternion();
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// models: Poly Haven names; hdris: names; people: always loaded (rpm avatar + Xbot clips [+ michelle, soldier])
export async function loadKit(renderer, { models = [], hdris = [], tex = [], people = ['hero'] } = {}) {
  const gl = new GLTFLoader();
  const pm = new THREE.PMREMGenerator(renderer);
  await Promise.all([
    ...models.map(n => gl.loadAsync(n.startsWith('sf/') ? `${A}${n}.glb` : `${A}${n}/${n}.gltf`).then(g => { ASSETS.models[n] = g.scene; ASSETS.anims[n] = g.animations; })),
    ...hdris.map(n => new RGBELoader().loadAsync(`${A}hdri/${n}.hdr`).then(h => { h.mapping = THREE.EquirectangularReflectionMapping; ASSETS.hdr[n] = h; ASSETS.env[n] = pm.fromEquirectangular(h).texture; })),
    loadPeople(people),
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
  const o = SkeletonUtils.clone(ASSETS.models[n]); o.scale.setScalar(s);
  o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return o;
}

// scale an object so its size along axis ('x'|'y'|'z'|'max') equals `size` metres, put its lowest point on y=0 and centre it on x/z
export function fit(o, size, axis = 'max', { ground = true, center = true } = {}) {
  o.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(o, true); const d = b.getSize(V());
  const cur = axis === 'max' ? Math.max(d.x, d.y, d.z) : d[axis]; if (cur > 1e-6) o.scale.multiplyScalar(size / cur);
  o.updateMatrixWorld(true); const b2 = new THREE.Box3().setFromObject(o, true); const c = b2.getCenter(V());
  const inner = new THREE.Group(); while (o.children.length) inner.add(o.children[0]);
  inner.position.set(center ? -c.x / o.scale.x : 0, ground ? -b2.min.y / o.scale.y : 0, center ? -c.z / o.scale.z : 0);
  inner.position.applyQuaternion(o.quaternion.clone().invert());
  o.add(inner); return o;
}
// animated model (Sketchfab animals etc.): returns { root, play(t, clip=0, speed=1) , clips }
export function creature(n, size = 1, axis = 'max') {
  const root = fit(prop(n), size, axis);
  const clips = ASSETS.anims[n] || []; const mixer = new THREE.AnimationMixer(root); let cur = null;
  return { root, clips: clips.map(c => c.name), play(t, clip = 0, speed = 1) {
    const c = typeof clip === 'number' ? clips[clip] : clips.find(x => x.name === clip) || clips.find(x => x.name.toLowerCase().includes(String(clip).toLowerCase()));
    if (!c) return; if (cur !== c) { mixer.stopAllAction(); mixer.clipAction(c).play(); cur = c; }
    mixer.setTime((t * speed) % c.duration + 1e-4 * Math.random()); } };
}
export function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

// ---------- realistic person ----------
// kind: 'hero' (Ready Player Me man, MR. CLOUD print), 'michelle', 'soldier'. Animated by Xbot Mixamo clips via model-space retarget.
// person.update(t, { idle:1, walk:0, run:0, agree:0, headShake:0, sad_pose:0, sneak_pose:0 }, speedScale) then person.pose(fn) for bone tweaks.
const SRC = {}; // shared source rig per clip set
// manual clip sampling with weighted slerp blending (quaternion tracks only; hips translation ignored)
function sampleClips(src, weights, time) {
  let acc = {}; const tot = Object.values(weights).reduce((a, b) => a + (b || 0), 0) || 1;
  if (!Object.values(weights).some(w => w > 1e-3)) weights = { idle: 1 };
  for (const [name, w] of Object.entries(weights)) {
    if (!(w > 1e-3)) continue; const c = src.clips[name]; if (!c) continue;
    if (!c._interp) c._interp = c.tracks.filter(tr => tr.name.endsWith('.quaternion')).map(tr => [tr.name.slice(0, -11).replace(/^mixamorig:?/, ''), tr.createInterpolant()]);
    const tt = ((time % c.duration) + c.duration) % c.duration;
    for (const [bn, ip] of c._interp) {
      const b = src.sb[bn]; if (!b) continue; const v = ip.evaluate(tt); const q = new THREE.Quaternion(v[0], v[1], v[2], v[3]);
      if (!acc[bn]) { acc[bn] = { q, w }; } else { const a = acc[bn]; a.w += w; a.q.slerp(q, w / a.w); }
    }
  }
  for (const bn in acc) src.sb[bn].quaternion.copy(acc[bn].q);
}
function srcRig() {
  if (SRC.rig) return SRC.rig;
  const g = ASSETS.xbot; const root = SkeletonUtils.clone(g.scene); const sb = {};
  root.traverse(o => { if (o.isBone) sb[o.name.replace(/^mixamorig:?/, '')] = o; });
  root.updateMatrixWorld(true);
  const rest = {}; for (const n in sb) rest[n] = [sb[n].position.clone(), sb[n].quaternion.clone()];
  return (SRC.rig = { root, sb, rest, clips: Object.fromEntries(g.animations.map(c => [c.name, c])) });
}
const mq = (o, root) => { const q = Q(), r = Q(); o.getWorldQuaternion(q); root.getWorldQuaternion(r); return r.invert().multiply(q); };
// RenderPeople bone names -> Mixamo names
const RPMAP = { hip: 'Hips', spine_01: 'Spine', spine_02: 'Spine1', spine_03: 'Spine2', neck: 'Neck', head: 'Head', jaw: 'Jaw' };
for (const [s, S] of [['l', 'Left'], ['r', 'Right']]) {
  Object.assign(RPMAP, { [`shoulder_${s}`]: `${S}Shoulder`, [`upperarm_${s}`]: `${S}Arm`, [`lowerarm_${s}`]: `${S}ForeArm`, [`hand_${s}`]: `${S}Hand`,
    [`upperleg_${s}`]: `${S}UpLeg`, [`lowerleg_${s}`]: `${S}Leg`, [`foot_${s}`]: `${S}Foot`, [`ball_${s}`]: `${S}ToeBase` });
  for (const [f, F] of [['thumb', 'Thumb'], ['index', 'Index'], ['middle', 'Middle'], ['ring', 'Ring'], ['pinky', 'Pinky']]) for (const k of [1, 2, 3]) RPMAP[`${f}_0${k}_${s}`] = `${S}Hand${F}${k}`;
}
const rpName = (n) => { const m = n.match(/(hip|spine_0\d|neck|head|jaw|shoulder_[lr]|upperarm_[lr]|lowerarm_[lr]|hand_[lr]|upperleg_[lr]|lowerleg_[lr]|foot_[lr]|ball_[lr]|(?:thumb|index|middle|ring|pinky)_0\d_[lr])_\d+$/); return m ? RPMAP[m[1]] : null; };
const CHILD = { Hips: 'Spine', Spine: 'Spine1', Spine1: 'Spine2', Spine2: 'Neck', Neck: 'Head', LeftShoulder: 'LeftArm', LeftArm: 'LeftForeArm', LeftForeArm: 'LeftHand', LeftUpLeg: 'LeftLeg', LeftLeg: 'LeftFoot', LeftFoot: 'LeftToeBase',
  RightShoulder: 'RightArm', RightArm: 'RightForeArm', RightForeArm: 'RightHand', RightUpLeg: 'RightLeg', RightLeg: 'RightFoot', RightFoot: 'RightToeBase', LeftHand: 'LeftHandMiddle1', RightHand: 'RightHandMiddle1' };
// kinds: 'hero' (RenderPeople Nathan, T-shirt + MR. CLOUD), 'eric','carla','claudia','sophia','manuel' (RenderPeople), 'rpm','michelle','soldier'
const KIND = { hero: 'sf/rp_nathan', nathan: 'sf/rp_nathan', eric: 'sf/rp_eric', carla: 'sf/rp_carla', claudia: 'sf/rp_claudia', sophia: 'sf/rp_sophia', manuel: 'sf/rp_manuel', rpm: 'people/readyplayer.me', michelle: 'people/Michelle', soldier: 'people/Soldier' };
export async function loadPeople(kinds = ['hero']) {
  const gl = new GLTFLoader();
  await Promise.all([...new Set(kinds.map(k => KIND[k]))].map(p => ASSETS.models['@' + p] ? null : gl.loadAsync(`${A}${p}.glb`).then(g => { ASSETS.models['@' + p] = g; })));
  if (!ASSETS.xbot) ASSETS.xbot = await gl.loadAsync(`${A}people/Xbot.glb`);
}
export function person(kind = 'hero', { print = kind === 'hero', shirt = null, height = 1.78 } = {}) {
  const key = '@' + KIND[kind];
  const root = SkeletonUtils.clone(ASSETS.models[key].scene);
  const g = new THREE.Group(); g.add(root);
  root.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; if (m.material) { m.material.envMapIntensity = 0.8; } } });
  const bone = {}; root.traverse(o => { if (o.isBone) { const n = rpName(o.name) || o.name.replace(/^mixamorig:?/, ''); if (!bone[n]) bone[n] = o; } });
  // normalise height to `height` metres, feet on y=0
  root.updateMatrixWorld(true); { const b = new THREE.Box3().setFromObject(root, true); const h = b.max.y - b.min.y; if (h > 0.01) { root.scale.multiplyScalar(height / h); root.updateMatrixWorld(true); const b2 = new THREE.Box3().setFromObject(root, true); root.position.y -= b2.min.y; } }
  if (shirt != null) root.traverse(m => { if (m.isMesh && /Outfit_Top/.test(m.name)) { m.material = m.material.clone(); m.material.color.set(shirt); } });
  const faces = []; root.traverse(m => { if (m.isMesh && m.morphTargetDictionary && 'mouthOpen' in m.morphTargetDictionary) faces.push(m); });
  // retarget setup
  const src = srcRig();
  const restPose = {}; Object.keys(src.sb).forEach(n => { restPose[n] = src.sb[n].quaternion.clone(); });
  // rest model-space quats (both in bind pose)
  root.updateMatrixWorld(true); Object.keys(src.sb).forEach(n => src.sb[n].quaternion.copy(restPose[n])); src.root.updateMatrixWorld(true);
  const names = []; (bone.Hips || root).traverse(o => { if (!o.isBone) return; const n = rpName(o.name) || o.name.replace(/^mixamorig:?/, ''); if (src.sb[n] && bone[n] === o && !names.includes(n)) names.push(n); });
  // calibrate target into the source's rest pose (A-pose -> T-pose): align each bone->child direction in model space
  g.updateMatrixWorld(true);
  const wp = (o) => { const v = V(); o.getWorldPosition(v); return v; };
  const toModel = (v, r) => { const q = Q(); r.getWorldQuaternion(q); return v.applyQuaternion(q.invert()); };
  for (const n of names) {
    const c = CHILD[n]; if (!c || !bone[c] || !src.sb[c]) continue;
    const sd = toModel(wp(src.sb[c]).sub(wp(src.sb[n])), src.root).normalize();
    const td = toModel(wp(bone[c]).sub(wp(bone[n])), root).normalize();
    if (sd.lengthSq() < 0.5 || td.lengthSq() < 0.5) continue;
    const dq = new THREE.Quaternion().setFromUnitVectors(td, sd); // model-space rotation
    const rq = Q(); root.getWorldQuaternion(rq); const pq = Q(); bone[n].parent.getWorldQuaternion(pq);
    const local = pq.clone().invert().multiply(rq).multiply(dq).multiply(rq.clone().invert()).multiply(pq); // conjugate into parent frame
    bone[n].quaternion.premultiply(local); bone[n].updateMatrixWorld(true);
  }
  const srest = {}, trest = {}; names.forEach(n => { srest[n] = mq(src.sb[n], src.root).invert(); trest[n] = mq(bone[n], root); });
  // MR. CLOUD chest print: placed in world space at rest (T-pose), then attached to the chest bone
  if (print && bone.Spine2) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.05), new THREE.MeshStandardMaterial({ map: canvasTex(512, 128, (c) => { c.font = "400 92px Brand, sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(255,255,255,0.92)'; c.fillText('MR. CLOUD', 256, 68); }), transparent: true, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -4 }));
    const hs = height / 1.78; const sp = V(); bone.Spine2.getWorldPosition(sp); const ne = V(); (bone.Neck || bone.Spine2).getWorldPosition(ne);
    const gq = Q(); g.getWorldQuaternion(gq); const fwd = V(0, 0, 1).applyQuaternion(gq);
    p.position.copy(sp.lerp(ne, 0.15)).addScaledVector(fwd, 0.125 * hs).add(V(0, -0.03 * hs, 0)); p.quaternion.copy(gq); p.scale.setScalar(hs);
    g.add(p); g.updateMatrixWorld(true); bone.Spine2.attach(p); g.userData.print = p;
  }
  const hipsY0 = bone.Hips ? bone.Hips.position.y : 0; const hipsS = bone.Hips ? 1 / bone.Hips.parent.getWorldScale(V()).y : 1;
  const P = {
    root: g, bone, faces,
    // weights: clip name -> weight. t: time in seconds (clip time = t*speed)
    // pose: object of canned pose weights {flinch, point, pointL, handsHead, handsChest, handsBelly, handsThroat, armsUp, shrug, crouch, lean, lookUp, lookDown, nod, headTilt}
    update(t, weights = { idle: 1 }, speed = 1, pose = null) {
      for (const n in src.sb) { src.sb[n].position.copy(src.rest[n][0]); src.sb[n].quaternion.copy(src.rest[n][1]); }
      sampleClips(src, weights, t * speed);
      src.root.updateMatrixWorld(true);
      if (pose) applyPose(src, pose);
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
    mouth(k) { faces.forEach(m => { m.morphTargetInfluences[m.morphTargetDictionary.mouthOpen] = k; }); if (bone.Jaw && !faces.length) { P.turn('Jaw', [1, 0, 0], 0.25 * k); } return P; },
    smile(k) { faces.forEach(m => { const i = m.morphTargetDictionary.mouthSmile; if (i != null) m.morphTargetInfluences[i] = k; }); return P; },
    // canned bone poses on top of the clip (k = 0..1)
    flinch(k) { if (k < 0.01) return P; return P.turn('Spine', [1, 0, 0], -0.25 * k).turn('LeftArm', [1, 0, 0], -1.3 * k).turn('RightArm', [1, 0, 0], -1.3 * k).turn('LeftForeArm', [0, 1, 0], 1.4 * k).turn('RightForeArm', [0, 1, 0], -1.4 * k); },
    point(k, side = 'Right') { if (k < 0.01) return P; return P.turn(side + 'Arm', [1, 0, 0], -1.35 * k).turn(side + 'Arm', [0, 0, 1], (side === 'Right' ? -0.3 : 0.3) * k); },
    handsOn(part, k) { // part: 'head'|'chest'|'belly'|'throat'
      if (k < 0.01) return P; const a = { head: 2.3, throat: 1.9, chest: 1.5, belly: 1.1 }[part] || 1.5;
      return P.turn('LeftArm', [1, 0, 0], -a * 0.55 * k).turn('RightArm', [1, 0, 0], -a * 0.55 * k).turn('LeftForeArm', [0, 1, 0], 1.6 * k).turn('RightForeArm', [0, 1, 0], -1.6 * k);
    },
    hipsDrop(dy) { if (bone.Hips) bone.Hips.position.y = hipsY0 - dy * hipsS; return P; },
    headPos() { const v = V(); bone.Head.getWorldPosition(v); return v; },
    world(name) { const v = V(); bone[name].getWorldPosition(v); return v; },
  };
  P.update(0);
  return P;
}

// canned poses applied to the Mixamo source rig (model-space axes: x = character's left->right?, y up, z forward)
function sturn(src, name, axis, ang) {
  const b = src.sb[name]; if (!b || !ang) return;
  const rq = Q(); src.root.getWorldQuaternion(rq); const pq = Q(); b.parent.getWorldQuaternion(pq);
  const ax = V(...axis).applyQuaternion(rq).applyQuaternion(pq.invert()).normalize();
  b.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(ax, ang)); b.updateMatrixWorld(true);
}
export const POSES = {
  // each: list of [bone, axis, angle] at weight 1
  flinch: [['Spine', [1, 0, 0], -0.2], ['LeftArm', [1, 0, 0], -1.25], ['RightArm', [1, 0, 0], -1.25], ['LeftArm', [0, 1, 0], -0.5], ['RightArm', [0, 1, 0], 0.5], ['LeftForeArm', [1, 0, 0], -1.6], ['RightForeArm', [1, 0, 0], -1.6]],
  point: [['RightArm', [1, 0, 0], -1.4], ['RightArm', [0, 1, 0], 0.15]],
  pointL: [['LeftArm', [1, 0, 0], -1.4], ['LeftArm', [0, 1, 0], -0.15]],
  handsHead: [['LeftArm', [0, 0, 1], -0.6], ['RightArm', [0, 0, 1], 0.6], ['LeftArm', [1, 0, 0], -1.9], ['RightArm', [1, 0, 0], -1.9], ['LeftForeArm', [1, 0, 0], -1.7], ['RightForeArm', [1, 0, 0], -1.7]],
  handsChest: [['LeftArm', [1, 0, 0], -0.7], ['RightArm', [1, 0, 0], -0.7], ['LeftForeArm', [0, 1, 0], -1.5], ['RightForeArm', [0, 1, 0], 1.5]],
  handsBelly: [['LeftArm', [1, 0, 0], -0.35], ['RightArm', [1, 0, 0], -0.35], ['LeftForeArm', [0, 1, 0], -1.3], ['RightForeArm', [0, 1, 0], 1.3], ['Spine', [1, 0, 0], 0.25]],
  handsThroat: [['LeftArm', [1, 0, 0], -0.9], ['RightArm', [1, 0, 0], -0.9], ['LeftForeArm', [0, 1, 0], -1.9], ['RightForeArm', [0, 1, 0], 1.9]],
  armsUp: [['LeftArm', [0, 0, 1], -2.6], ['RightArm', [0, 0, 1], 2.6]],
  shrug: [['LeftArm', [0, 0, 1], -0.4], ['RightArm', [0, 0, 1], 0.4], ['LeftForeArm', [0, 1, 0], -1.2], ['RightForeArm', [0, 1, 0], 1.2], ['Neck', [0, 0, 1], 0.15]],
  crouch: [['Spine', [1, 0, 0], 0.5], ['LeftUpLeg', [1, 0, 0], -1.1], ['RightUpLeg', [1, 0, 0], -1.1], ['LeftLeg', [1, 0, 0], 1.6], ['RightLeg', [1, 0, 0], 1.6]],
  lean: [['Spine', [1, 0, 0], 0.35]],
  leanBack: [['Spine', [1, 0, 0], -0.3]],
  lookUp: [['Neck', [1, 0, 0], -0.5], ['Head', [1, 0, 0], -0.3]],
  lookDown: [['Neck', [1, 0, 0], 0.45], ['Head', [1, 0, 0], 0.3]],
  headTilt: [['Neck', [0, 0, 1], 0.35]],
  nod: [['Head', [1, 0, 0], 0.5]],
  slump: [['Spine', [1, 0, 0], 0.4], ['Spine1', [1, 0, 0], 0.25], ['Neck', [1, 0, 0], 0.4], ['LeftArm', [0, 0, 1], 0.15], ['RightArm', [0, 0, 1], -0.15]],
};
function applyPose(src, pose) {
  for (const [k, w] of Object.entries(pose)) {
    if (!w) continue;
    if (typeof POSES[k] === 'function') POSES[k](src, w);
    else for (const [b, ax, a] of POSES[k] || []) sturn(src, b, ax, a * w);
  }
}

// plain label: white bold text, thick black outline, no panel
export function label(text, w = 1.0) {
  // canvas sized to the text; w = world width for a ~10-character label (longer text gets proportionally wider)
  const m = document.createElement('canvas').getContext('2d'); m.font = "900 120px Cap, sans-serif";
  const tw = Math.ceil(m.measureText(text).width) + 60, W = Math.max(256, tw), H = 200;
  const t = canvasTex(W, H, (g) => { g.font = "900 120px Cap, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 22; g.strokeStyle = '#000'; g.strokeText(text, W / 2, H / 2 + 4); g.fillStyle = '#fff'; g.fillText(text, W / 2, H / 2 + 4); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); s.renderOrder = 40;
  const ww = Math.min(w * W / 1024 * 1.25, w * 1.6), hh = ww * H / W;
  s.set = (k) => { s.visible = k > 0.01; s.scale.set(ww * k, hh * k, 1); }; s.set(0); return s;
}

// set the camera labels should stay inside of (call once per frame before showLabel, after positioning the camera)
export function labelCam(c) { ASSETS.cam = c; c.updateMatrixWorld(true); }
export function showLabel(l, pos, t, a0, a1) {
  const k = Math.min(1, Math.max(0, (t - a0) / 0.15)) * (1 - Math.min(1, Math.max(0, (t - a1) / 0.15)));
  const e = 1 - Math.pow(1 - k, 3); l.position.copy(pos); l.set(e);
  const c = ASSETS.cam; if (!c || !l.visible) return;
  const ndc = pos.clone().project(c); const dist = c.position.distanceTo(pos);
  const halfH = dist * Math.tan(THREE.MathUtils.degToRad(c.fov / 2)), halfW = halfH * c.aspect;
  let hw = (l.scale.x / 2) / halfW; if (hw > 0.8) { l.scale.multiplyScalar(0.8 / hw); hw = 0.8; } const hh = (l.scale.y / 2) / halfH;
  const mx = 0.97 - hw, my = 0.95 - hh;
  const cx = Math.max(-mx, Math.min(mx, ndc.x)), cy = Math.max(-my, Math.min(my, ndc.y));
  if (cx !== ndc.x || cy !== ndc.y) { ndc.x = cx; ndc.y = cy; l.position.copy(ndc.unproject(c)); }
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

// simple particle stream: emits from origin along dir between t0..t1
export function stream(n, color, size) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const dot = canvasTex(64, 64, (c) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); });
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color, size, map: dot, transparent: true, opacity: 0.85, depthWrite: false, sizeAttenuation: true }));
  const seed = Array.from({ length: n }, (_, i) => [Math.sin(i * 12.9898) * 43758.5453 % 1, Math.sin(i * 78.233) * 12543.31 % 1, Math.sin(i * 39.425) * 9631.7 % 1].map(Math.abs));
  p.update = (o, dir, t0, t1, t, speed = 1.2, spread = 0.25) => {
    const a = g.attributes.position.array; let vis = false;
    for (let i = 0; i < n; i++) {
      const born = t0 + (t1 - t0) * seed[i][0]; const age = t - born;
      if (age < 0 || age > 1.2) { a[i * 3 + 1] = -999; continue; } vis = true;
      a[i * 3] = o.x + dir.x * age * speed + (seed[i][1] - 0.5) * spread * age; a[i * 3 + 1] = o.y + dir.y * age * speed + (seed[i][2] - 0.5) * spread * age; a[i * 3 + 2] = o.z + dir.z * age * speed + (seed[i][0] - 0.5) * spread * age;
    }
    g.attributes.position.needsUpdate = true; p.visible = vis; p.frustumCulled = false;
  };
  return p;
}

// animated glowing lava (ShaderMaterial); call mat.uniforms.time.value = t
export function lavaMaterial() {
  return new THREE.ShaderMaterial({ uniforms: { time: { value: 0 } }, vertexShader: `varying vec2 vUv; varying vec3 vP; void main(){ vUv = uv; vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float time; varying vec2 vUv; varying vec3 vP;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=.5; } return s; }
      void main(){ vec2 p = vP.xy*1.4; float t = time*0.12;
        float c = fbm(p + vec2(fbm(p*0.7 + t), fbm(p*0.7 - t)));
        float line = 1.0 - smoothstep(0.0, 0.05, abs(c - 0.5));
        float pool = smoothstep(0.66, 0.8, c);
        vec3 crust = vec3(0.045,0.035,0.032) * (0.7 + 0.8*fbm(p*6.));
        vec3 hot = mix(vec3(1.0,0.28,0.03), vec3(1.0,0.72,0.25), pool);
        vec3 col = crust + hot * (line*1.8 + pool*1.4 + 0.06);
        gl_FragColor = vec4(col,1.);
        #include <colorspace_fragment>
      }`, toneMapped: true });
}
