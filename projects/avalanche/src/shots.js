import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp, quadruped } from './ancient.js';
import { textSprite } from './room.js';
import { rng, glowTexture } from './textures.js';

export const DURATION = 27.6;
export const CAPTIONS = [
  [0.0, 'How do you survive an avalanche?'],
  [2.37, 'An avalanche can race down a mountain'], [4.52, 'at over 100 km per hour'],
  [7.46, 'If you get caught, swim!'], [9.59, 'Kick and paddle hard'], [10.88, 'to stay near the surface'],
  [12.71, 'Right before it stops'], [14.11, 'push one arm up toward the sky'], [16.3, 'and cup your other hand over your face'], [18.33, 'to make an air pocket'],
  [20.03, 'Once it stops'], [20.92, 'the snow sets hard like concrete'], [23.53, 'That raised hand'], [24.49, 'helps rescuers find you fast', 27.4],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const HIT = 7.3;

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 8, sunDir: [4, 7, 5], sun: 2.6 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x2a6ad0); u.mid.value.set(0x7ab0e8); u.horizon.value.set(0xeef6ff); u.floorC.value.set(0xf4f8fc);
  scene.fog = new THREE.Fog(0xe8f2fa, 25, 110);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.9;
  const snowT = canvasTex(512, 512, (g) => { g.fillStyle = '#f4f8fc'; g.fillRect(0, 0, 512, 512); const r = rng(2); for (let i = 0; i < 700; i++) { const x = r() * 512, y = r() * 512, s = 5 + r() * 30; const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(200,215,235,0.35)'); gr.addColorStop(1, 'rgba(200,215,235,0)'); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2); } });
  snowT.wrapS = snowT.wrapT = THREE.RepeatWrapping; snowT.repeat.set(30, 30);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ map: snowT, roughness: 0.9 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  // mountains behind (snowy peaks)
  const peak = (x, z, r, h, col) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), new THREE.MeshStandardMaterial({ color: col, flatShading: true })); m.position.set(x, h / 2 - 0.5, z); scene.add(m); const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.45, h * 0.45, 7), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true })); cap.position.set(x, h * 0.775 - 0.5, z); scene.add(cap); };
  peak(0, -45, 22, 30, 0x8a96aa); peak(-24, -55, 18, 24, 0x7a86a0); peak(26, -52, 18, 26, 0x96a2b4);
  // slope ramp up toward the mountain (visual)
  const slope = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshStandardMaterial({ map: snowT, roughness: 0.9 })); slope.rotation.x = -Math.PI / 2 + 0.38; slope.position.set(0, 7.5, -38); scene.add(slope);
  const pr = rng(41); for (let i = 0; i < 26; i++) { const x = (pr() - 0.5) * 30, z = -6 - pr() * 22; if (Math.abs(x) < 2) continue; const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); const h = 2 + pr() * 2; for (let k = 0; k < 3; k++) { const c2 = new THREE.Mesh(new THREE.ConeGeometry(h * (0.3 - k * 0.07), h * 0.45, 8), new THREE.MeshStandardMaterial({ color: k === 2 ? 0xffffff : 0x2f5a44, flatShading: true })); c2.position.y = h * (0.3 + k * 0.22); g.add(c2); } }
  // avalanche front: instanced puffs
  const NP = 220, puffs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshStandardMaterial({ color: 0xf6f9fd, roughness: 1, flatShading: false }), NP); puffs.frustumCulled = false; scene.add(puffs);
  const PD = []; for (let i = 0; i < NP; i++) PD.push({ x: (pr() - 0.5) * 30, dz: pr() * 6, y: pr() * 5, s: 0.8 + pr() * 2.2, ph: pr() * 6 });
  const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = V();
  // flowing snow level around hero
  const flowT = canvasTex(512, 512, (g) => { g.fillStyle = '#f2f6fb'; g.fillRect(0, 0, 512, 512); const r = rng(6); for (let i = 0; i < 400; i++) { g.strokeStyle = `rgba(180,200,225,${0.2 + r() * 0.3})`; g.lineWidth = 2 + r() * 5; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 20, y + 30, x, y + 60); g.stroke(); } });
  flowT.wrapS = flowT.wrapT = THREE.RepeatWrapping; flowT.repeat.set(8, 8);
  const hardT = canvasTex(512, 512, (g) => { g.fillStyle = '#d8dde4'; g.fillRect(0, 0, 512, 512); const r = rng(7); for (let i = 0; i < 1500; i++) { g.fillStyle = r() > 0.5 ? 'rgba(150,158,170,0.4)' : 'rgba(250,252,255,0.5)'; g.fillRect(r() * 512, r() * 512, 3, 3); } g.strokeStyle = 'rgba(120,128,140,0.6)'; g.lineWidth = 3; for (let i = 0; i < 25; i++) { let x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 80; y += (r() - 0.5) * 80; g.lineTo(x, y); } g.stroke(); } });
  hardT.wrapS = hardT.wrapT = THREE.RepeatWrapping; hardT.repeat.set(8, 8);
  const level = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshStandardMaterial({ map: flowT, roughness: 1 })); level.rotation.x = -Math.PI / 2; scene.add(level);
  const spray = []; for (let i = 0; i < 70; i++) { const s = glowSprite(0xffffff, 0.25 + (i % 3) * 0.12); s.userData = { x: (pr() - 0.5) * 4, ph: pr() }; scene.add(s); spray.push(s); }
  // hero (ski gear)
  const hero = makeHuman('casual', { shirt: 0xe63946, jeans: 0x1d3557, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.04), new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.6, roughness: 0.2 })); goggles.position.set(0, 0.17, 0.11); hero.j.head.add(goggles);
  const beanie = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.9 })); beanie.position.y = 0.17; beanie.scale.set(1.05, 1.0, 1.1); hero.j.head.add(beanie);
  const skis = []; for (const k of ['lAn', 'rAn']) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 1.4), new THREE.MeshStandardMaterial({ color: 0xffd23f })); s.position.set(0, -0.07, 0.15); hero.j[k].add(s); skis.push(s); }
  const pocket = glowSprite(0x9fd8ff, 0.35); scene.add(pocket);
  // rescue dog
  const dog = quadruped('wolf', 3); scene.add(dog);
  dog.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); const h = o.material.color.getHex(); o.material.color.set(h === 0x50555c ? 0xd8a24a : 0xf4e2c0); } });
  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.42), new THREE.MeshStandardMaterial({ color: 0xff2a2a })); scene.add(vest);
  // speedometer (side, mid-height)
  const speedo = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); speedo.renderOrder = 31; scene.add(speedo);
  const sc = document.createElement('canvas'); sc.width = sc.height = 256; const sg = sc.getContext('2d'); const st2 = new THREE.CanvasTexture(sc); st2.colorSpace = THREE.SRGBColorSpace; speedo.material.map = st2; let lastS = -1;
  const drawS = (v) => { const qv = Math.round(v); if (qv === lastS) return; lastS = qv; sg.clearRect(0, 0, 256, 256); sg.lineWidth = 18; sg.strokeStyle = 'rgba(255,255,255,0.45)'; sg.beginPath(); sg.arc(128, 150, 100, Math.PI, 0); sg.stroke(); sg.strokeStyle = '#ff3b3b'; sg.beginPath(); sg.arc(128, 150, 100, Math.PI, Math.PI + Math.PI * v / 130); sg.stroke(); sg.font = "400 64px Brand, sans-serif"; sg.fillStyle = '#fff'; sg.textAlign = 'center'; sg.lineWidth = 6; sg.strokeStyle = 'rgba(0,0,0,0.6)'; sg.strokeText(`${qv}`, 128, 150); sg.fillText(`${qv}`, 128, 150); sg.font = "400 30px Brand, sans-serif"; sg.strokeText('km/h', 128, 190); sg.fillText('km/h', 128, 190); st2.needsUpdate = true; };
  const fx = { hit: burst(0xffffff, 90, 1), found: burst(0x5be37d, 70, 2), hard: burst(0xb8c0cc, 50, 3) }; Object.values(fx).forEach(f => scene.add(f));
  const st = { swim: stamp('SWIM!', '#39a0ff', 0.55), found: stamp('FOUND!', '#5be37d', 0.6) }; Object.values(st).forEach(s => scene.add(s));
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // avalanche front position (z) racing toward hero at z=0
      const frontZ = t < HIT ? lerp(-26, 0.5, Math.pow(range(t, 0, HIT), 1.4)) : 6 + (t - HIT) * 4;
      const flowing = t < 20.0;
      for (let i = 0; i < NP; i++) { const p = PD[i]; const z = frontZ - p.dz * (1 + 0.3 * Math.sin(t + p.ph)); const roll = flowing ? t * 2 + p.ph : 20 * 2 + p.ph; const y = p.y * (t < HIT + 1.5 ? 1 : 1 - smooth(range(t, HIT + 1.5, HIT + 3))) + Math.sin(roll) * 0.3; sv.setScalar(p.s * (t < HIT + 2 ? 1 : 1 - smooth(range(t, HIT + 2, HIT + 3.5)))); q.setFromEuler(new THREE.Euler(roll, p.ph, 0)); mt.compose(V(p.x, Math.max(0.3, y), z), q, sv); puffs.setMatrixAt(i, mt); }
      puffs.instanceMatrix.needsUpdate = true;
      // snow level around hero
      const lv = t < HIT - 0.1 ? -0.1 : lerp(0.0, 1.05, smooth(range(t, HIT - 0.1, HIT + 0.6))) + 0.15 * smooth(range(t, 13.0, 19.5)) + 0.25 * smooth(range(t, 19.0, 20.0));
      level.position.y = lv; level.visible = lv > -0.05;
      if (flowing) flowT.offset.y = -t * 0.6;
      const hard = smooth(range(t, 20.2, 21.6));
      level.material.map = hard > 0.5 ? hardT : flowT; level.material.color.setScalar(lerp(1, 0.92, hard));
      spray.forEach((s, i) => { const u2 = (t * 0.9 + s.userData.ph) % 1; s.position.set(s.userData.x, lv + u2 * 0.8, -1.5 + u2 * 3); s.material.opacity = (t > HIT && t < 19.8 ? 0.7 : 0) * (1 - u2); s.visible = t > HIT && t < 19.8; });
      // ---------- hero ----------
      const sinkY = 0;
      hero.root.position.set(0, sinkY, 0); hero.root.rotation.y = 0.2;
      const swim = smooth(range(t, HIT + 0.4, HIT + 1.0)) * (1 - smooth(range(t, 13.6, 14.3)));
      const armUp = smooth(range(t, 14.1, 14.8));
      const cup = smooth(range(t, 16.4, 17.1));
      let pose = STAND(t);
      if (t < HIT) { const look = smooth(range(t, 1.0, 1.6)); pose = over(pose, { neck: [0.0, 1.2 * look * (1 - smooth(range(t, 5.4, 6.0))), 0], lKn: [0.3, 0, 0], rKn: [0.3, 0, 0], lHip: [-0.2, 0, 0.12], rHip: [-0.2, 0, -0.12], spine: [0.15, 0, 0] }); }
      if (swim > 0.01) { const s1 = t * 5; pose = over(pose, { lSh: [lerp(0.05, -1.6 + 1.8 * Math.sin(s1), swim), 0, 0.45], rSh: [lerp(0.05, -1.6 - 1.8 * Math.sin(s1), swim), 0, -0.45], lEl: [-0.4, 0, 0], rEl: [-0.4, 0, 0], lHip: [0.4 * Math.sin(t * 8) * swim, 0, 0.1], rHip: [-0.4 * Math.sin(t * 8) * swim, 0, -0.1], neck: [-0.2 * swim, 0, 0], spine: [0.1, 0, Math.sin(t * 5) * 0.1] }); }
      hero.setPose(pose); hero.setMouth(t > HIT - 1 && t < HIT + 1 ? 0.6 : 0.08);
      scene.updateMatrixWorld(true);
      const rs = hero.j.rSh.getWorldPosition(V()), ls = hero.j.lSh.getWorldPosition(V());
      if (armUp > 0.01) { ikArm(hero, 'r', rs.clone().add(V(-0.2, -0.3, 0.1)).lerp(rs.clone().add(V(0.05, 0.62, 0.05)), armUp), rs.clone().add(V(-0.4, 0, -0.2)), V(0, 0, 1)); }
      const face = hero.j.head.localToWorld(V(0, 0.05, 0.2));
      if (cup > 0.01) { ikArm(hero, 'l', ls.clone().add(V(0.2, -0.4, 0.15)).lerp(face, cup), ls.clone().add(V(0.4, -0.3, 0.2)), V(0, 0, 1)); }
      scene.updateMatrixWorld(true);
      const pk = smooth(range(t, 18.4, 18.9));
      pocket.position.copy(face).add(V(0, -0.02, 0.06)); pocket.scale.setScalar(0.32 * pk * (1 + 0.1 * Math.sin(t * 4))); pocket.material.opacity = 0.7 * pk; pocket.visible = pk > 0.01;
      fx.hit.position.set(0, 1.4, 0.3); fx.hit.update(t - HIT);
      fx.hard.position.set(0, lv + 0.05, 0.4); fx.hard.update(t - 21.0);
      // rescue dog arrives, sniffs at the hand
      const dk = smooth(range(t, 23.4, 25.0));
      dog.position.set(lerp(3.5, 0.95, dk), lv - 0.02, lerp(0.5, -0.45, dk)); dog.scale.setScalar(0.8); dog.rotation.y = -Math.PI / 2 - 0.3;
      dog.visible = t > 23.2;
      vest.position.copy(dog.position).add(V(0, 0.45, 0)); vest.rotation.y = dog.rotation.y; vest.visible = dog.visible;
      const rh = hero.j.rWr.getWorldPosition(V());
      fx.found.position.copy(rh).add(V(0, 0.1, 0)); fx.found.update(t - 25.4);
      // ---------- camera ----------
      const KEYS = [[0, [1.2, 1.8, 4.8], [-0.3, 1.6, -8.0]], [2.4, [1.2, 1.75, 4.6], [-0.2, 1.4, -6.0]], [6.6, [2.0, 1.7, 4.4], [0.0, 1.2, -1.0]], [HIT + 0.5, [1.4, 1.9, 4.0], [0.0, 1.1, 0]], [20.0, [1.2, 1.9, 3.6], [0.0, 1.25, 0]], [23.2, [2.0, 2.1, 4.6], [0.65, 1.0, -0.2]], [27.6, [1.9, 2.1, 4.4], [0.65, 1.0, -0.2]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.5 + (t > 2 && t < HIT + 1 ? 1.5 * range(t, 2, HIT) : 0) + (t > HIT && t < HIT + 0.6 ? 3 : 0) + (flowing && t > HIT ? 0.8 : 0), 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const sk = easeOut(range(t, 4.3, 4.6)) * (1 - smooth(range(t, 7.0, 7.3)));
      drawS(lerp(0, 130, easeOut(range(t, 4.4, 6.6))));
      speedo.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.02).addScaledVector(rt, 0.15); speedo.scale.setScalar(0.24 * sk); speedo.visible = sk > 0.01;
      st.swim.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); st.swim.set(t > 8.5 && t < 10.4 ? easeOut(range(t, 8.5, 8.7)) : 0);
      st.found.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); st.found.set(t > 25.5 ? easeOut(range(t, 25.5, 25.7)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.3, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
