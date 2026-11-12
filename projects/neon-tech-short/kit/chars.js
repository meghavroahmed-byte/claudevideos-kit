// chars.js: rigged 3D characters for Neon 3D shorts.
// Models live in kit/models/ (not in git): Michelle, Soldier, Xbot, readyplayer.me (three.js examples),
// Fox (KhronosGroup glTF-Sample-Assets, CC-BY 4.0 tomkranis). Fetch: sparse-clone those repos.
// Clips: Soldier Idle/Run/Walk; Xbot idle/walk/run/agree/headShake/sad_pose/sneak_pose; Michelle SambaDance.
import * as K from './core3d.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
const { THREE } = K;
const BASE = new URL('./models/', import.meta.url).href;
const cache = {};
export async function loadModel(name) { return cache[name] ||= new GLTFLoader().loadAsync(BASE + name + '.glb'); }

// Copy a Mixamo clip to another Mixamo-compatible rig whose rest pose differs:
// q_target = restT * restS^-1 * q_source. Bone names may carry a "mixamorig" prefix on either side.
export function retargetRest(clip, srcRoot, dstRoot) {
  const o = clip.clone(), q = new THREE.Quaternion(), d = new THREE.Quaternion();
  const find = (root, bn) => root.getObjectByName(bn) || root.getObjectByName('mixamorig' + bn) || root.getObjectByName(bn.replace(/^mixamorig:?/, ''));
  o.tracks = o.tracks.filter(t => t.name.endsWith('.quaternion'));
  for (const t of o.tracks) {
    const bn = t.name.split('.')[0], sb = find(srcRoot, bn), tb = find(dstRoot, bn);
    if (!sb || !tb) continue;
    t.name = tb.name + '.quaternion';
    d.copy(tb.quaternion).multiply(sb.quaternion.clone().invert());
    for (let i = 0; i < t.values.length; i += 4) { q.fromArray(t.values, i); q.premultiply(d); q.toArray(t.values, i); }
  }
  return o;
}

// character(model, { clip: [srcModel, clipName], scale, pos, rotY, hide: [meshNames] }) -> { root, mixer, set(t) }
export async function character(model, { clip, scale = 1, pos = [0, 0, 0], rotY = 0, hide = [], parent } = {}) {
  const g = await loadModel(model);
  const root = SkeletonUtils.clone(g.scene);
  root.traverse(o => { if (o.isMesh) { o.frustumCulled = false; if (hide.includes(o.name)) o.visible = false; } });
  root.scale.setScalar(scale); root.position.set(...pos); root.rotation.y = rotY;
  (parent || K.scene).add(root);
  const mixer = new THREE.AnimationMixer(root);
  if (clip) {
    const [src, name] = clip, sg = await loadModel(src), c = sg.animations.find(a => a.name === name);
    mixer.clipAction(src === model ? c : retargetRest(c, sg.scene, root)).play();
  }
  return { root, mixer, set: t => mixer.setTime(t) };
}
