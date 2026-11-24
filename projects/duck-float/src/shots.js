import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, creature, person, keyCam, stream, canvasTex, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

// "What if you could float like a duck?" — Zack-style split water view, close-ups, cuts, phrase captions
export const DURATION = 31.6;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/mallard', 'sf/lungs'], hdris: ['lake_pier'], people: ['hero'] });

const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
const FZ = 0.9;          // z of the "aquarium" cut plane: in front of it the camera sees under the water
const SPINE_AX = ['y', 'z'];

// ---------- water pieces ----------
function underwater(scene) {
  // interior of the water volume (seen through the cut plane): depth gradient
  const box = new THREE.Mesh(new THREE.BoxGeometry(40, 6, 30), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: true,
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `varying vec3 vW; void main(){ float d = clamp(-vW.y/4.5, 0., 1.);
      vec3 c = mix(vec3(0.16,0.52,0.50), vec3(0.02,0.13,0.17), pow(d, 0.8));
      float ray = smoothstep(0.75, 1.0, sin(vW.x*1.7 + vW.y*0.6)*0.5+0.5) * (1.-d) * 0.12; c += vec3(ray);
      gl_FragColor = vec4(c,1.);
      #include <colorspace_fragment>
    }` }));
  box.position.set(0, -3.01, FZ - 15); scene.add(box);
  // the cut plane itself: a teal tint over everything below the surface + bright waterline
  const tint = new THREE.Mesh(new THREE.PlaneGeometry(40, 6), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { time: { value: 0 } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float time; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      void main(){ float d = clamp(-vW.y/4.0, 0., 1.);
        float wave = 0.012*sin(vW.x*7.0 + time*2.2) + 0.008*sin(vW.x*13.0 - time*3.1);
        if (vW.y > wave) discard;
        float line = 1.0 - smoothstep(0.0, 0.025, wave - vW.y);
        float caus = smoothstep(0.55, 0.95, n(vW.xy*5.0 + vec2(time*0.4, -time*0.3)) * n(vW.xy*3.1 - time*0.25)) * (1.-d);
        vec3 c = mix(vec3(0.10,0.55,0.52), vec3(0.02,0.16,0.20), d) + caus*0.25;
        float a = mix(0.38, 0.8, d);
        c = mix(c, vec3(0.85,0.97,1.0), line*0.85); a = max(a, line*0.9);
        gl_FragColor = vec4(c, a);
        #include <colorspace_fragment>
      }` }));
  tint.position.set(0, -3.0, FZ); tint.renderOrder = 20; scene.add(tint);
  // surface (only behind the cut plane), glossy, reflecting the HDRI
  const nrm = canvasTex(512, 512, (g) => { const im = g.createImageData(512, 512); for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) { const i = (y * 512 + x) * 4; const a = Math.sin(x * 0.07 + Math.sin(y * 0.05) * 2) * 0.5 + Math.sin((x + y) * 0.11) * 0.3 + Math.sin(y * 0.19 - x * 0.03) * 0.2; im.data[i] = 128 + a * 50; im.data[i + 1] = 128 + Math.cos(y * 0.09 + x * 0.02) * 50; im.data[i + 2] = 255; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); });
  nrm.wrapS = nrm.wrapT = THREE.RepeatWrapping; nrm.repeat.set(60, 60); nrm.colorSpace = THREE.NoColorSpace;
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshPhysicalMaterial({ color: 0x2a6964, roughness: 0.07, metalness: 0.0, normalMap: nrm, normalScale: new THREE.Vector2(0.35, 0.35), transparent: true, opacity: 0.9, envMapIntensity: 1.2 }));
  surf.rotation.x = -Math.PI / 2; surf.position.set(0, 0, FZ - 60); surf.receiveShadow = true; scene.add(surf);
  return { tint, surf, nrm };
}

// procedural feather texture (white-ish, tinted per instance)
function featherTex() {
  return canvasTex(64, 128, (g) => {
    g.clearRect(0, 0, 64, 128);
    g.save(); g.translate(32, 4);
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(30, 20, 26, 90, 0, 122); g.bezierCurveTo(-26, 90, -30, 20, 0, 0); g.fill();
    g.strokeStyle = 'rgba(70,55,40,0.55)'; g.lineWidth = 1;
    for (let y = 8; y < 118; y += 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(22 * Math.sin((y / 122) * Math.PI), y + 9); g.moveTo(0, y); g.lineTo(-22 * Math.sin((y / 122) * Math.PI), y + 9); g.stroke(); }
    g.fillStyle = 'rgba(60,45,35,0.55)'; for (let y = 30; y < 110; y += 14) { g.beginPath(); g.ellipse(0, y, 14, 3, 0, 0, 6.3); g.fill(); }
    g.strokeStyle = 'rgba(240,230,210,0.95)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 122); g.stroke();
    g.restore();
  });
}

// thousands of feathers that ride the skinned surface (CPU-skinned anchor each frame), each grows in on its own delay
function plumage(hero, scene, count = 16000) {
  const R = hero.root; R.updateMatrixWorld(true);
  const meshes = []; R.traverse(m => { if (m.isSkinnedMesh && !/eye|teeth|tongue|lash|brow/i.test(m.name)) meshes.push(m); });
  const v = V(), bw = V(), cw = V(), bq = new THREE.Quaternion();
  const rnd = (i) => Math.abs(Math.sin(i * 91.17 + 0.3) * 43758.5453) % 1;
  const skip = /head|neck|mouth|eye|jaw|hand|finger|thumb|index|middle|ring|pinky|toe|foot/i;
  const list = []; let tries = 0;
  while (list.length < count && tries < count * 12) {
    tries++;
    const m = meshes[Math.floor(rnd(tries) * meshes.length)]; const pa = m.geometry.attributes.position; const vi = Math.floor(rnd(tries * 3.7 + 1) * pa.count);
    const si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight; let bi = 0, best = -1;
    for (let k = 0; k < 4; k++) { const w = sw.getComponent(vi, k); if (w > best) { best = w; bi = si.getComponent(vi, k); } }
    const bone = m.skeleton.bones[bi]; if (!bone || skip.test(bone.name)) continue;
    if (list.length < count * 0.55 && !/spine|hip|pelvis|clavicle|shoulder/i.test(bone.name)) continue;
    m.getVertexPosition(vi, v); m.localToWorld(v);
    bone.getWorldPosition(bw); const kids = bone.children.filter(c => c.isBone); const ch = kids.find(c => /spine|neck/i.test(c.name)) || kids[0];
    if (ch) ch.getWorldPosition(cw); else cw.copy(bw).add(V(0, 0.1, 0));
    const ax = cw.clone().sub(bw); const L = ax.length(); ax.normalize(); const along = Math.max(0, Math.min(L, v.clone().sub(bw).dot(ax)));
    const n = v.clone().sub(bw.clone().addScaledVector(ax, along)); if (n.lengthSq() < 1e-6) continue; n.normalize();
    let down = V(0, -1, 0).addScaledVector(n, n.y); if (down.lengthSq() < 0.05) down = ax.clone().negate(); down.normalize();
    const xx = down.clone().cross(n).normalize();
    const qw = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xx, down, n)).multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -0.15));
    bone.getWorldQuaternion(bq); const binv = bq.clone().invert();
    list.push({ m, vi, bone, ql: binv.clone().multiply(qw), nl: n.clone().applyQuaternion(binv), size: 0.75 + 0.5 * rnd(tries * 5.1), delay: 0.75 * rnd(tries * 9.3) + 0.25 * Math.min(1, Math.abs(v.x) / 0.8), col: rnd(tries * 2.2) });
  }
  const geo = new THREE.PlaneGeometry(0.05, 0.11); geo.translate(0, 0.05, 0);
  const mat = new THREE.MeshStandardMaterial({ map: featherTex(), alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.92, metalness: 0 });
  const im = new THREE.InstancedMesh(geo, mat, list.length); im.frustumCulled = false; scene.add(im);
  const palette = [0x5a4532, 0x6e5640, 0x4a3a2c, 0x8a7258, 0x3e342b, 0x9a948a, 0x75614a].map(c => new THREE.Color(c));
  list.forEach((f, i) => im.setColorAt(i, palette[Math.floor(f.col * palette.length)]));
  const tmp = new THREE.Matrix4(), q = new THREE.Quaternion(), s = V(), p = V(), nw = V();
  return {
    count: list.length,
    grow(k) {
      im.visible = k > 0.001; if (!im.visible) return;
      list.forEach((f, i) => {
        const g = Math.min(1, Math.max(0, (k * 1.6 - f.delay) / 0.35)); const e = g * g * (3 - 2 * g);
        if (e < 0.001) { tmp.makeScale(0, 0, 0); im.setMatrixAt(i, tmp); return; }
        f.m.getVertexPosition(f.vi, p); f.m.localToWorld(p);
        f.bone.getWorldQuaternion(bq); q.copy(bq).multiply(f.ql); nw.copy(f.nl).applyQuaternion(bq);
        p.addScaledVector(nw, 0.004); s.setScalar(f.size * e); tmp.compose(p, q, s); im.setMatrixAt(i, tmp);
      });
      im.instanceMatrix.needsUpdate = true;
    },
  };
}

function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 6, sunDir: [-3, 7, 4] }), 'lake_pier', { height: 1.6, radius: 80, sun: 1.8, env: 1.0 });
  const water = underwater(scene); if (scene.userData.gsky) scene.userData.gsky.rotation.y = 2.4;
  const hero = person('hero'); scene.add(hero.root);
  // body materials that can fade into an x-ray look
  const bodyMats = []; hero.root.traverse(m => { if (m.isMesh && m.material) { m.material = m.material.clone(); bodyMats.push(m.material); } });
  const feathers = plumage(hero, scene);
  const duck = creature('sf/mallard', 0.5, 'max'); scene.add(duck.root);
  const lungs = fit(prop('sf/lungs'), 0.36, 'y', { ground: false }); scene.add(lungs);
  lungs.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.transparent = true; m.renderOrder = 31; } });
  const sacMat = new THREE.MeshPhysicalMaterial({ color: 0x7fd6ff, roughness: 0.05, transparent: true, opacity: 0.35, emissive: 0x2a9cff, emissiveIntensity: 0.5, depthWrite: false });
  const SACS = [['Spine2', [0.1, 0.02, 0.02], 0.085], ['Spine2', [-0.1, 0.02, 0.02], 0.085], ['Spine1', [0.09, 0, 0.04], 0.075], ['Spine1', [-0.09, 0, 0.04], 0.075], ['Spine', [0.06, 0.02, 0.05], 0.07], ['Spine', [-0.06, 0.02, 0.05], 0.07], ['Spine', [0, -0.06, 0.06], 0.065]];
  const sacs = SACS.map(() => { const s = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), sacMat); s.renderOrder = 32; scene.add(s); return s; });
  const bubbles = stream(160, 0xdff6ff, 0.035); scene.add(bubbles);
  const kick = stream(200, 0xdff6ff, 0.03); scene.add(kick);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.42, 48), new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 40, 128, 128, 128); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }), transparent: true, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; scene.add(ring);
  const cam = new THREE.PerspectiveCamera(40, 720 / 1280, 0.03, 300);
  // camera: one key list; pairs 0.02 s apart are hard cuts
  const KEYS = [
    [0.0, [0.4, -0.03, 4.1], [-0.2, -0.62, 0]], [2.45, [0.32, -0.03, 3.6], [-0.2, -0.55, 0]],                          // 1 struggling next to the duck
    [2.47, [0.75, -0.05, 2.0], [0.0, -0.22, 0]], [6.40, [0.6, -0.1, 1.75], [0.0, -0.24, 0]],                          // 2 belly close-up
    [6.42, [2.3, 0.02, 2.9], [0.0, -0.35, 0]], [10.95, [2.0, 0.05, 2.6], [0.0, -0.3, 0]],                             // 3 profile: spine arches
    [10.97, [2.6, -0.03, 3.4], [0.0, -0.82, -0.2]], [15.80, [2.35, -0.03, 3.1], [0.0, -0.8, -0.25]],                  // 4 under water: legs become paddles
    [15.82, [0.4, -0.05, 2.0], [0.0, -0.12, 0]], [21.20, [0.35, 0.0, 1.8], [0.0, -0.06, 0]],                          // 5 x-ray: air sacs
    [21.22, [0.8, 0.02, 1.6], [0.0, -0.12, 0]], [26.95, [0.95, 0.02, 2.3], [0.0, -0.2, 0]],                           // 6 feathers sprout
    [26.97, [0.45, -0.02, 3.0], [-0.25, -0.4, 0]], [31.6, [0.8, 0.0, 4.2], [-0.25, -0.45, 0]],                           // 7 floating like a duck
  ];
  let xrayOn = false;
  return {
    scene, camera: cam,
    update(t) {
      water.tint.material.uniforms.time.value = t; water.nrm.offset.set(t * 0.01, t * 0.006);
      // ---- progress values ----
      const belly = sm(3.9, 5.8, t), lean = sm(6.6, 7.4, t) * (1 - sm(8.2, 8.9, t)), arch = sm(8.0, 9.4, t), legs = sm(11.7, 13.4, t);
      const sacK = sm(17.0, 19.6, t), xr = sm(16.0, 16.5, t) * (1 - sm(20.9, 21.3, t)), feath = sm(21.6, 26.2, t);
      const struggle = 1 - sm(2.2, 2.6, t);
      // ---- hero ----
      const profile = (t > 6.4 && t < 15.82) ? 1 : 0;
      hero.update(t, { idle: 1 }, 1, { spread: 0.8 + 0.15 * struggle, lean: 0.9 * lean, leanBack: 0.8 * arch, lookUp: 0.25 * struggle });
      const tread = Math.sin(t * (struggle > 0.5 ? 9 : 4.2));
      hero.turn('LeftArm', [0, 1, 0], -0.25 - 0.3 * tread).turn('RightArm', [0, 1, 0], 0.25 + 0.3 * tread).turn('LeftArm', [0, 0, 1], 0.12 * struggle * tread).turn('RightArm', [0, 0, 1], 0.12 * struggle * tread);
      if (arch > 0.01) hero.turn('Spine1', [1, 0, 0], -0.22 * arch).turn('Spine2', [1, 0, 0], -0.18 * arch).turn('Neck', [1, 0, 0], 0.45 * arch);
      // legs: tread under the body, then swing behind as paddles
      const pad = Math.sin(t * 5.5);
      const thigh = lerp(-0.25 + 0.25 * Math.sin(t * 4.2), 0.75 + 0.22 * pad, legs), knee = lerp(0.35 + 0.25 * Math.max(0, Math.sin(t * 4.2 + 1)), 0.55 + 0.45 * Math.max(0, -pad), legs);
      hero.turn('LeftUpLeg', [1, 0, 0], thigh).turn('RightUpLeg', [1, 0, 0], legs > 0.5 ? 0.75 - 0.22 * pad : -0.25 - 0.25 * Math.sin(t * 4.2 + 2)).turn('LeftLeg', [1, 0, 0], knee).turn('RightLeg', [1, 0, 0], legs > 0.5 ? 0.55 + 0.45 * Math.max(0, pad) : knee);
      // belly swells like a built-in life jacket
      const B = hero.bone; const sw = 1 + 0.45 * belly;
      if (B.Spine) { SPINE_AX.forEach(a => B.Spine.scale[a] = sw); }
      if (B.Spine1) { SPINE_AX.forEach(a => B.Spine1.scale[a] = (1 + 0.22 * belly) / sw); }
      if (B.Spine2) { SPINE_AX.forEach(a => B.Spine2.scale[a] = 1 / (1 + 0.22 * belly)); }
      // float height: low and choppy at first, higher as each change lands
      const lift = 0.08 * belly + 0.03 * arch + 0.04 * legs + 0.15 * sacK + 0.06 * feath;
      const bob = Math.sin(t * (struggle > 0.5 ? 6 : 1.6)) * (struggle > 0.5 ? 0.06 : 0.025);
      hero.root.position.set(0, -1.6 + lift + bob, 0);
      hero.root.rotation.set(-0.12 * legs, profile ? -0.78 : 0.0, 0);
      // x-ray body fade
      const on = xr > 0.01;
      if (on !== xrayOn) { bodyMats.forEach(m => { m.transparent = on; m.depthWrite = !on; m.needsUpdate = true; }); xrayOn = on; }
      bodyMats.forEach(m => { m.opacity = 1 - 0.78 * xr; if (m.emissive) { m.emissive.setRGB(0.05 * xr, 0.22 * xr, 0.4 * xr); } });
      scene.updateMatrixWorld(true);
      feathers.grow(feath);
      // lungs + air sacs inside the torso
      const s2 = hero.world('Spine2'), s1 = hero.world('Spine1');
      const fwd = V(0, 0, 1).applyQuaternion(hero.root.quaternion);
      lungs.visible = xr > 0.01; lungs.position.copy(s2).lerp(s1, 0.3).addScaledVector(fwd, 0.02).add(V(0, -0.1, 0)); lungs.quaternion.copy(hero.root.quaternion);
      lungs.traverse(m => { if (m.isMesh) m.material.opacity = xr; });
      sacs.forEach((s, i) => {
        const [bn, off, r] = SACS[i]; const k = sm(16.9 + i * 0.25, 18.0 + i * 0.25, t) * xr;
        s.visible = k > 0.01; const breathe = 1 + 0.06 * Math.sin(t * 3 + i);
        s.position.copy(hero.world(bn)).add(V(...off).applyQuaternion(hero.root.quaternion)); s.scale.setScalar(0.8 * r * k * breathe * (bn === 'Spine' ? sw * 0.9 : 1));
      });
      sacMat.opacity = 0.38 * xr;
      // duck: always calm, half in the water
      duck.play(t, 0, 0.6); duck.root.position.set(-0.7, -0.17 + Math.sin(t * 1.6 + 1) * 0.015, -0.45); duck.root.rotation.y = 1.2 + 0.08 * Math.sin(t * 0.5);
      duck.root.visible = t < 2.47 || t > 26.95;
      // water details
      const head = hero.headPos();
      ring.position.set(0, 0.012, 0); ring.scale.setScalar(1 + 0.35 * belly + 0.1 * Math.sin(t * 3));
      bubbles.update(head.clone().add(V(0, -0.18, 0.1)), V(0, 1, 0.05), 0.0, 2.3, t, 0.5, 0.25);
      kick.update(hero.world('LeftFoot').add(V(0, 0, -0.05)), V(0, 0.4, -0.6), 12.2, 15.7, t, 0.6, 0.4);
      // ---- camera ----
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      return { bloom: 0.18, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
