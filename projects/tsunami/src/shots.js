import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, texMat, person, label, showLabel, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 33.4;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['covered_car', 'tree_stump_01', 'dead_tree_trunk', 'wooden_crate_01', 'Barrel_02', 'sf/airliner'], hdris: ['spiaggia_di_mondello'], tex: ['concrete_wall_003'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;

const WATER_FS = `uniform float time; uniform float foamTop; varying vec2 vUv; varying vec3 vW;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
  void main(){ vec2 p = vW.xz*0.35 + vec2(time*0.3, time*0.2);
    float r = n(p) * 0.6 + n(p*2.7 - time*0.4) * 0.4;
    vec3 deep = vec3(0.02,0.16,0.22), shallow = vec3(0.05,0.36,0.42);
    vec3 col = mix(deep, shallow, smoothstep(0.2, 0.9, vUv.y) * 0.8 + r * 0.25);
    float crest = foamTop < 1.0 ? smoothstep(foamTop, foamTop + 0.08, vUv.y) : 0.0;
    float streak = foamTop < 1.0 ? smoothstep(0.55, 0.9, n(vec2(vW.x*0.6, vUv.y*3. - time*0.8))) * smoothstep(0.3, 0.8, vUv.y) * 0.5 : 0.0;
    float foam = crest + streak + smoothstep(0.8, 0.97, r) * 0.3;
    col = mix(col, vec3(0.92,0.96,0.97), clamp(foam, 0.0, 1.0));
    gl_FragColor = vec4(col, 0.97);
    #include <colorspace_fragment>
  }`;
const WATER_VS = `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const waterMat = (foamTop) => new THREE.ShaderMaterial({ uniforms: { time: { value: 0 }, foamTop: { value: foamTop } }, vertexShader: WATER_VS, fragmentShader: WATER_FS, transparent: true, side: THREE.DoubleSide });

// wall of water: grid bent into a curling profile; setH(height) rebuilds the profile
function waveWall(width = 300) {
  const nu = 60, nv = 24; const geo = new THREE.PlaneGeometry(width, 1, nu, nv); const mat = waterMat(0.86);
  const mesh = new THREE.Mesh(geo, mat); const pos = geo.attributes.position; const base = pos.array.slice();
  mesh.setH = (H, t) => {
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], v = base[i * 3 + 1] + 0.5; // 0..1 up the face
      const ang = v * 2.3; const R = H * 0.55;
      const z = -Math.sin(ang) * R * 0.9 + v * v * R * 0.8 + Math.sin(x * 0.15 + t * 1.3) * 0.3 * v;
      const y = (1 - Math.cos(Math.min(ang, Math.PI * 0.62))) * R * 1.05 + v * H * 0.35;
      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true; geo.computeVertexNormals();
  };
  return mesh;
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 10, sunDir: [-5, 8, 4] }), 'spiaggia_di_mondello', { height: 2.5, radius: 90, sun: 1.8, env: 0.9 });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(600, 200), waterMat(2.0)); sea.rotation.x = -Math.PI / 2; sea.position.set(20, 0.03, -112); scene.add(sea); scene.children.filter(o => o.material && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const wave = waveWall(); scene.add(wave);
  const flood = new THREE.Mesh(new THREE.PlaneGeometry(300, 60, 1, 1), waterMat(2.0)); flood.rotation.x = -Math.PI / 2; scene.add(flood);
  const jet = fit(prop('sf/airliner'), 45, 'max', { ground: false }); scene.add(jet);
  const bump = waveWall(140); bump.scale.set(1, 0.25, 1); scene.add(bump);
  // building to climb
  const bld = new THREE.Mesh(new THREE.BoxGeometry(6, 14, 6), texMat('concrete_wall_003', 2, 5)); bld.position.set(31, 7, 7); bld.castShadow = bld.receiveShadow = true; scene.add(bld);
  const roofHero = person('hero'); scene.add(roofHero.root);
  // debris carried by the flood
  const debris = [['covered_car', 1, -3.5, 0.4], ['covered_car', 1, 3.8, 1.6], ['dead_tree_trunk', 1, -1.0, 2.2], ['tree_stump_01', 1.3, 1.8, 0.8], ['wooden_crate_01', 1.6, -2.2, 1.0], ['Barrel_02', 1, 0.6, 3.0], ['wooden_crate_01', 1.6, 3.0, 3.6], ['Barrel_02', 1, -4.4, 2.8]]
    .map(([n, s, x, ph]) => { const o = prop(n, s); scene.add(o); return { o, x, ph }; });
  const hero = person('hero'); scene.add(hero.root);
  const sprinter = person('hero', { print: false }); ghost(sprinter.root, 0xffffff, { inPlace: true }); sprinter.root.traverse(m => { if (m.isMesh) { m.material.blending = THREE.NormalBlending; m.material.color.set(0xf2fbff); } }); scene.add(sprinter.root);
  const spray = stream(400, 0xffffff, 0.25); spray.material.opacity = 0.6; scene.add(spray);
  const L = { jet: label('800 KM/H', 1.6), jetP: label('= JET PLANE', 1.6), shore: label('30–50 KM/H', 1.0), spr: label('FASTEST SPRINTER', 1.1), you: label('YOU: MUCH SLOWER', 1.1), cars: label('CARS', 1.6), trees: label('TREES', 1.6), deb: label('DEBRIS', 1.7), dont: label("DON'T OUTRUN IT", 1.1), up: label('RUN UPHILL', 1.0), climb: label('CLIMB A STRONG BUILDING', 1.4), shake: label('GROUND SHAKES', 2.4), pull: label('SEA PULLS BACK', 3.2) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 1500);
  // camera keys: x is relative to the running hero
  const KEYS = [[0, [-2.0, 1.4, 9.5], [0.5, 1.6, 0]], [1.9, [-2.0, 1.4, 9.5], [0.5, 2.0, -2]], [3.0, [0, 6, 16], [0, 12, -60]], [8.6, [0, 6, 16], [0, 12, -60]],
    [9.6, [-3.0, 1.8, 11.0], [0.5, 3.5, -4]], [13.6, [-3.0, 1.8, 11.0], [0.5, 4.0, -4]], [14.4, [-1.2, 1.3, 8.4], [0.8, 1.1, 2.5]], [18.6, [-1.2, 1.3, 8.4], [1.4, 1.1, 2.5]],
    [19.6, [-4.0, 4.0, 15.0], [0, 1.0, 2.0]], [24.8, [-4.0, 4.0, 15.0], [0, 1.0, 3.0]], [26.0, [-1.6, 1.4, 8.4], [0, 1.2, 3.0]], [27.4, [-1.6, 1.4, 8.4], [0, 1.2, 3.0]],
    [28.8, [4.5, 15.6, 12.5], [7.3, 14.9, 7.4]], [30.2, [4.5, 15.6, 12.5], [7.3, 14.9, 7.4]], [31.4, [2, 19, 20], [4, 4, -24]], [33.4, [2, 19, 20], [4, 3, -28]]];
  return {
    scene, camera: cam,
    update(t) {
      [sea, wave, flood, bump].forEach(m => m.material.uniforms.time.value = t);
      const HX = (tt) => -20 + 1.6 * Math.min(tt, 26.8); const hx = HX(t);
      // ---- the wave: far away during the jet bit, approaches the shore, slows, rises ----
      const wz = t < 9 ? -70 : lerp(-70, -12, sm(9, 19, t)) + 14 * sm(19, 24, t);
      const H = lerp(4, 11, sm(9, 13.5, t)) * (1 - sm(23, 25, t)) + 0.5;
      wave.position.set(20, 0, wz); wave.setH(H, t); wave.visible = t < 25.5;
      bump.visible = t > 2.6 && t < 9; bump.position.set(hx + lerp(-120, 80, sm(3, 8.6, t)), 0, -60); bump.rotation.y = Math.PI / 2; bump.setH(5, t);
      jet.visible = t > 2.6 && t < 9; jet.position.set(hx + lerp(-110, 90, sm(3, 8.6, t)), 16, -60); jet.rotation.set(0, Math.PI / 2, 0);
      const fl = sm(19.0, 22.5, t) * (1 - sm(31.3, 33.0, t));
      flood.visible = fl > 0.01; flood.position.set(30, -0.3 + 1.3 * fl, lerp(-30, 10, sm(19, 24, t)));
      const DX = HX(22.5);
      debris.forEach(({ o, x, ph }, i) => { const drift = Math.max(0, t - 21); o.visible = t > 20.5 && t < 25.0 && fl > 0.05; o.position.set(DX + x * 1.4, flood.position.y - 0.15 + Math.sin(t * 1.4 + ph) * 0.08, -4 + (i % 3) * 0.8 + drift * 1.6); o.rotation.set(Math.sin(t + ph) * 0.15, ph + drift * 0.3, Math.sin(t * 0.8 + ph) * 0.12); });
      // ---- hero runs along the beach (+x), then is seen on the roof ----
      const runK = t < 26.8 ? 1 : 0;
      hero.update(t, { run: runK, idle: 1 - runK }, 1.0, {});
      hero.root.position.set(hx, 0, 3.0); hero.root.rotation.y = Math.PI / 2; hero.root.visible = t < 27.6;
      sprinter.update(t, { run: 1 }, 1.3, {}); sprinter.root.fade(0.85 * (t > 14.4 && t < 18.8 ? 1 : 0)); sprinter.root.position.set(hx + 0.3 + (t - 14.4) * 0.45, 0, 1.4); sprinter.root.rotation.y = Math.PI / 2;
      roofHero.update(t, { idle: 1 }, 1, { point: sm(29.3, 29.7, t) }); roofHero.root.position.set(30.2, 14, 7.4); roofHero.root.rotation.y = -0.4;
      const k = keyCam(KEYS, t); const camX = t < 27.6 ? hx : HX(26.8);
      const shk = (t > 30.4 && t < 31.3) ? 0.18 : 0;
      cam.position.copy(k.pos).add(V(camX + Math.sin(t * 61) * shk, Math.sin(t * 47) * shk, 0)); cam.lookAt(k.look.clone().add(V(camX, 0, 0))); labelCam(cam);
      scene.updateMatrixWorld(true);
      spray.update(V(hx, H * 0.9, wz + 1), V(0, 0.4, 1), 9.6, 24, t, 3.5, 30);
      const head = hero.headPos();
      showLabel(L.jet, jet.position.clone().add(V(0, 14, 0)), t, 6.4, 8.6); showLabel(L.jetP, jet.position.clone().add(V(0, 9, 0)), t, 5.4, 8.6);
      showLabel(L.shore, V(hx, H + 2.2, wz + 2), t, 11.3, 13.7);
      showLabel(L.spr, sprinter.root.position.clone().add(V(0, 2.2, 0)), t, 15.0, 17.0);
      showLabel(L.you, head.clone().add(V(0.3, 0.45, 0)), t, 17.0, 18.6);
      showLabel(L.cars, debris[0].o.position.clone().add(V(0, 2.0, 0)), t, 22.8, 24.6); showLabel(L.trees, debris[2].o.position.clone().add(V(0, 1.6, 0)), t, 23.5, 24.8); showLabel(L.deb, debris[4].o.position.clone().add(V(0, 1.3, 0)), t, 24.2, 25.0);
      showLabel(L.dont, head.clone().add(V(0, 0.5, 0)), t, 25.2, 26.9);
      showLabel(L.up, head.clone().add(V(0, 0.5, 0)), t, 26.9, 27.9);
      showLabel(L.climb, V(30.2, 16.2, 7.4), t, 28.2, 30.3);
      showLabel(L.shake, V(28, 17, 4), t, 30.4, 31.3); showLabel(L.pull, V(26, 8, -18), t, 31.5, 33.4);
      return { bloom: 0.25, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
