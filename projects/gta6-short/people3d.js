// people3d.js: realistic rigged humans for the GTA-6 short (from the user's zach-d-films v2 kit, _kit/real.js).
// Ready Player Me hero (MR. CLOUD chest print) / Michelle / Soldier, animated by Xbot Mixamo clips (model-space retarget).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
export const ASSETS = { models: {} };
const Q = () => new THREE.Quaternion();
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export async function loadPeople(base = './people/') {
  const gl = new GLTFLoader();
  await Promise.all([...['readyplayer.me', 'Michelle', 'Soldier'].map(n => gl.loadAsync(base + n + '.glb').then(g => { ASSETS.models['@' + n] = g; })), gl.loadAsync(base + 'Xbot.glb').then(g => { ASSETS.xbot = g; })]);
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

// plain label: white bold text, thick black outline, no panel (Bangla-safe font, width fits text)
export function label(text, h = 0.5) {
  const fs = 120, mc = document.createElement('canvas').getContext('2d'); mc.font = `800 ${fs}px Anek, PJS, sans-serif`; const tw = Math.ceil(mc.measureText(text).width) + 80;
  const t = canvasTex(tw, 220, (g) => { g.font = `800 ${fs}px Anek, PJS, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 24; g.strokeStyle = '#000'; g.strokeText(text, tw / 2, 118); g.fillStyle = '#fff'; g.fillText(text, tw / 2, 118); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false })); s.renderOrder = 40;
  const asp = tw / 220; s.set = (k) => { s.visible = k > 0.01; s.scale.set(h * asp * k, h * k, 1); }; s.set(0); return s;
}
// label shown between a0 and a1 at world position pos
export function showLabel(l, pos, t, a0, a1) {
  const k = Math.min(1, Math.max(0, (t - a0) / 0.15)) * (1 - Math.min(1, Math.max(0, (t - a1) / 0.15)));
  const e = 1 - Math.pow(1 - k, 3); l.position.copy(pos); l.set(e);
}

