// realtest.js: test of rigged 3D humans + animal in a night forest (Zack-D-like cinematic shots).
// Models: Michelle / Soldier / Xbot / readyplayer.me (three.js examples), Fox (Khronos sample, CC-BY 4.0 tomkranis).
// Models are not in git (licences + size). Fetch: sparse-clone mrdoob/three.js examples/models/gltf (Michelle, Soldier, Xbot, readyplayer.me) and KhronosGroup/glTF-Sample-Assets Models/Fox into ./models/.
import * as K from '../neon-tech-short/kit/core3d.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
const { THREE } = K;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (a, b, t) => { const k = cl((t - a) / (b - a)); return k * k * (3 - 2 * k); };

CFG.duration = 6; CFG.captions = false;
K.seed(7);
const R = K.renderer; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.toneMappingExposure = 1.05;
K.bloom.strength = 0.35; K.bloom.threshold = 0.9;
K.scene.fog = new THREE.FogExp2(0x0d2233, 0.045);
K.sky.material.fragmentShader = 'varying vec3 vp; void main(){ float k = clamp(vp.y*2.0,0.,1.); vec3 c = mix(vec3(0.06,0.20,0.27), vec3(0.01,0.04,0.08), pow(k,0.7)); gl_FragColor = vec4(c,1.); }';
K.sky.material.needsUpdate = true;
K.hemi.color.set(0x6f9fc0); K.hemi.groundColor.set(0x1a2414); K.hemi.intensity = 0.9;
const moon = K.moon; moon.color.set(0xa8c8ff); moon.intensity = 1.6; moon.position.set(-12, 22, -8);
moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 70 }); moon.shadow.bias = -0.0008;
K.scene.add(moon.target);
// warm front fill + cool back rim so the characters read against the dark
const fill = new THREE.DirectionalLight(0xffc89a, 0.9); fill.position.set(4, 5, 14); K.scene.add(fill);
const rim = new THREE.DirectionalLight(0x8fd0ff, 1.4); rim.position.set(-6, 6, -16); K.scene.add(rim);

// ---- ground: dark grass with instanced blades ----
const gTex = K.canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#1d3418'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { g.fillStyle = `hsl(${K.rnd(80, 115)},${K.rnd(30, 55)}%,${K.rnd(8, 22)}%)`; g.fillRect(K.rnd(0, w), K.rnd(0, h), 2, K.rnd(3, 9)); } }, [30, 30]);
const ground = K.mesh(new THREE.PlaneGeometry(200, 200), K.std({ map: gTex, roughness: 1 }), 0, 0, 0); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
const bladeGeo = new THREE.ConeGeometry(0.018, 0.3, 3); bladeGeo.translate(0, 0.15, 0);
const NB = 26000, blades = K.instanced(bladeGeo, K.std({ color: 0xffffff, roughness: 0.9 }), NB);
const bp = [];
for (let i = 0; i < NB; i++) {
  const x = K.rnd(-18, 18), z = K.rnd(-22, 22), s = K.rnd(0.6, 1.6);
  bp.push([x, z, s, K.rnd(0, 6), K.rnd(-0.3, 0.3)]);
  blades.setColorAt(i, new THREE.Color().setHSL(K.rnd(0.2, 0.3), K.rnd(0.35, 0.6), K.rnd(0.12, 0.28)));
}
blades.receiveShadow = true;
// dry tall grass clumps (straw colour)
const NDRY = 2600, dry = K.instanced(new THREE.ConeGeometry(0.025, 1.1, 3).translate(0, 0.55, 0), K.std({ color: 0xa08a55, roughness: 1 }), NDRY);
const dp = []; for (let i = 0; i < NDRY; i++) { const a = K.rnd(0, 6.28), r = K.rnd(7, 18); dp.push([Math.cos(a) * r, Math.sin(a) * r * 1.2, K.rnd(0.7, 1.5), K.rnd(0, 6)]); }
// trees: trunk + clustered canopy blobs, cast shadows
const barkM = K.std({ color: 0x3a2a1e, roughness: 1 }), leafM = K.std({ color: 0x1f3a1c, roughness: 0.9, flatShading: true });
function tree(x, z, h) {
  const g = K.group(x, 0, z);
  const tr = K.mesh(new THREE.CylinderGeometry(0.18 * h / 6, 0.32 * h / 6, h, 8), barkM, 0, h / 2, 0, g); tr.castShadow = true;
  for (let i = 0; i < 9; i++) { const b = K.mesh(new THREE.IcosahedronGeometry(K.rnd(1.0, 1.8) * h / 7, 1), leafM, K.rnd(-1.6, 1.6) * h / 7, h + K.rnd(-1.2, 1.0) * h / 7, K.rnd(-1.6, 1.6) * h / 7, g); b.castShadow = true; }
  return g;
}
for (let i = 0; i < 46; i++) { const a = K.rnd(0, 6.28), r = K.rnd(9, 26), x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.abs(x) < 6 && z < 14) continue; tree(x, z, K.rnd(5, 9)); }

// lantern (warm key on the scene)
const lan = K.group(2.6, 0, 2.2);
K.mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.32, 10), K.std({ color: 0xffd28a, emissive: 0xffb050, emissiveIntensity: 2 }), 0, 0.2, 0, lan);
K.glowSprite(0xffb050, 1.6, 0.8, lan).position.y = 0.22;
const lp = new THREE.PointLight(0xffa850, 8, 9, 1.6); lp.position.y = 0.5; lp.castShadow = true; lan.add(lp);

// ---- load characters ----
const L = new GLTFLoader();
const load = f => L.loadAsync('models/' + f);
const [mich, sold, xbot, rpm, foxG] = await Promise.all(['Michelle.glb', 'Soldier.glb', 'Xbot.glb', 'readyplayer.me.glb', 'Fox.glb'].map(load));
const clip = (gl, name) => gl.animations.find(a => a.name === name);
// Mixamo clips -> any mixamo-compatible rig: drop root motion, optionally strip the "mixamorig:" prefix
function retarget(c, strip) {
  const o = c.clone(); o.tracks = o.tracks.filter(t => !t.name.endsWith('.position'));
  if (strip) o.tracks.forEach(t => t.name = t.name.replace(/mixamorig:?/, ''));
  return o;
}
function prep(root) { root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } }); return root; }

// mother: Michelle running
const mother = prep(mich.scene); mother.scale.setScalar(1.0); K.scene.add(mother);
// retarget by rest-pose delta: q_target = restT * restS^-1 * q_source (same bone names, different rest poses)
function retargetRest(c, srcRoot, dstRoot, strip) {
  const o = c.clone(), q = new THREE.Quaternion(), d = new THREE.Quaternion();
  o.tracks = o.tracks.filter(t => t.name.endsWith('.quaternion'));
  for (const t of o.tracks) {
    const bn = t.name.split('.')[0], tn = strip ? bn.replace(/mixamorig:?/, '') : bn, sb = srcRoot.getObjectByName(bn), tb = dstRoot.getObjectByName(tn);
    t.name = tn + '.quaternion';
    if (!sb || !tb) continue;
    d.copy(tb.quaternion).multiply(sb.quaternion.clone().invert());
    for (let i = 0; i < t.values.length; i += 4) { q.fromArray(t.values, i); q.premultiply(d); q.toArray(t.values, i); }
  }
  return o;
}
const runClip = retargetRest(clip(sold, 'Run'), sold.scene, mother);
const mMix = new THREE.AnimationMixer(mother); const mRun = mMix.clipAction(runClip); mRun.play();
// child: Ready Player Me avatar scaled down, lying in the grass (sad pose), no beard
const child = prep(SkeletonUtils.clone(rpm.scene)); child.scale.setScalar(0.62); K.scene.add(child);
child.traverse(o => { if (o.name === 'Wolf3D_Beard') o.visible = false; });
const cMix = new THREE.AnimationMixer(child); cMix.clipAction(retargetRest(clip(xbot, 'sad_pose'), xbot.scene, child, true)).play();
child.position.set(0.8, 0.0, 6.0); child.rotation.set(-Math.PI / 2 + 0.05, 0, 0.6);
// villager: RPM man idle at the edge with the lantern
const man = prep(rpm.scene); K.scene.add(man);
const vMix = new THREE.AnimationMixer(man); vMix.clipAction(retargetRest(clip(xbot, 'idle'), xbot.scene, man, true)).play();
man.position.set(3.4, 0, 2.4); man.rotation.y = -2.4;
// leopard: Fox rig re-skinned with a rosette coat, scaled up
const cat = prep(foxG.scene); K.scene.add(cat);
const coat = K.canvasTex(512, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d9a441'); gr.addColorStop(0.6, '#e8bd62'); gr.addColorStop(1, '#f3e2b8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { const x = K.rnd(0, w), y = K.rnd(0, h * 0.8), r = K.rnd(5, 11); g.strokeStyle = '#2a1a0a'; g.lineWidth = K.rnd(3, 5); g.beginPath(); g.arc(x, y, r, K.rnd(0, 2), K.rnd(4, 6.2)); g.stroke(); g.fillStyle = 'rgba(150,90,20,0.6)'; g.beginPath(); g.arc(x, y, r * 0.6, 0, 7); g.fill(); }
});
coat.flipY = false;
cat.traverse(o => { if (o.isMesh) { if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals(); o.material = K.std({ map: coat, roughness: 0.75 }); } });
cat.scale.setScalar(0.014);
const fMix = new THREE.AnimationMixer(cat); const fWalk = fMix.clipAction(fox('Walk')), fSur = fMix.clipAction(fox('Survey')); fSur.play();
function fox(n) { return foxG.animations.find(a => a.name === n); }
cat.position.set(-0.6, 0, 6.6); cat.rotation.y = 1.2;

// ---- camera: (0-3) low tracking shot in front of the running mother; (3-6) slow orbit on leopard + child ----
K.setCamKeys([
  { t: 0, p: [0.6, 1.5, -15.5], l: [0.4, 1.1, -9], fov: 40 },
  { t: 2.9, p: [0.9, 1.5, -5.5], l: [0.4, 1.0, 0], fov: 40 },
  { t: 3.1, p: [-3.6, 1.6, 11.5], l: [0.0, 0.6, 6.4], fov: 38 },
  { t: 6, p: [3.2, 1.4, 11.2], l: [0.0, 0.6, 6.4], fov: 34 },
]);
function update(t) {
  // mother runs toward camera along -z -> +z, then off frame
  const z = -10 + Math.min(t, 2.7) * 3.6; mother.position.set(0.4 + Math.sin(t * 1.3) * 0.2, 0, z); mother.rotation.y = 0;
  mMix.setTime(t); cMix.setTime(t); vMix.setTime(t); fMix.setTime(t);
  // grass sway
  bp.forEach(([x, z0, s, ph, lean], i) => K.setInst(blades, i, [x, 0, z0], s, lean + Math.sin(t * 1.6 + ph + x * 0.3) * 0.12, ph, lean * 0.5));
  blades.instanceMatrix.needsUpdate = true;
  dp.forEach(([x, z0, s, ph], i) => K.setInst(dry, i, [x, 0, z0], s, Math.sin(t * 1.2 + ph) * 0.1, ph, 0));
  dry.instanceMatrix.needsUpdate = true;
  lp.intensity = 8 + Math.sin(t * 13) * 0.6 + Math.sin(t * 29) * 0.4;
}
window.BG3D = t => K.draw(t, update);
SCENE.ui = () => {};
boot();
