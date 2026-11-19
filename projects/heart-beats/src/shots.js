import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { burst } from './rare.js';
import { stamp, tree } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 25.2;
export const CAPTIONS = [
  [0.0, 'How many times does your heart beat in a lifetime?'],
  [3.17, 'It beats about seventy times a minute'], [5.66, "That's over 100,000 beats"], [7.86, 'every single day!'],
  [9.61, 'Over a whole lifetime'], [11.24, 'that adds up to around three billion heartbeats'], [14.25, 'and it never takes a break'],
  [16.15, 'Each beat pushes blood through'], [17.72, 'about 100,000 km of blood vessels'], [21.14, "That's enough to wrap around the Earth"], [22.8, 'more than twice!', 25.0],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const beat = (t) => { const p = (t * 1.17) % 1; return Math.exp(-p * 18) + 0.6 * Math.exp(-Math.max(0, p - 0.18) * 18) * (p > 0.18 ? 1 : 0); };
function heartMesh(col = 0xff2a4a) {
  const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.5, roughness: 0.35 });
  const a = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), m); a.position.set(-0.27, 0.15, 0); g.add(a);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), m); b.position.set(0.27, 0.15, 0); g.add(b);
  const c = new THREE.Mesh(new THREE.ConeGeometry(0.68, 1.0, 24), m); c.rotation.z = Math.PI; c.position.y = -0.38; c.scale.z = 0.72; g.add(c);
  return g;
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 8, sunDir: [-4, 8, 5], sun: 2.6 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x2a7ad8); u.mid.value.set(0x7ab8ec); u.horizon.value.set(0xe8f4fa); u.floorC.value.set(0x4a8a3a);
  scene.fog = new THREE.Fog(0xdceef8, 30, 120);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.9;
  // running track
  const trackT = canvasTex(512, 512, (g) => { g.fillStyle = '#c8442e'; g.fillRect(0, 0, 512, 512); const r = rng(2); for (let i = 0; i < 2000; i++) { g.fillStyle = r() > 0.5 ? 'rgba(160,50,30,0.4)' : 'rgba(230,110,80,0.4)'; g.fillRect(r() * 512, r() * 512, 2, 2); } g.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) g.fillRect(i * 85 + 40, 0, 6, 512); });
  trackT.wrapS = trackT.wrapT = THREE.RepeatWrapping; trackT.repeat.set(1, 8);
  const track = new THREE.Mesh(new THREE.PlaneGeometry(6, 60), new THREE.MeshStandardMaterial({ map: trackT, roughness: 0.9 })); track.rotation.x = -Math.PI / 2; track.rotation.z = Math.PI / 2; track.position.set(0, 0.01, -1.0); track.receiveShadow = true; scene.add(track);
  const grassT = canvasTex(256, 256, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#4a9a3a' : '#57a845'; g.fillRect(i * 32, 0, 32, 256); } });
  grassT.wrapS = grassT.wrapT = THREE.RepeatWrapping; grassT.repeat.set(20, 20);
  const field = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ map: grassT, roughness: 1 })); field.rotation.x = -Math.PI / 2; scene.add(field);
  scene.children.filter(o => o.isMesh && o !== field && o !== track && o.geometry && o.geometry.type === 'PlaneGeometry' && !o.material.isShadowMaterial).forEach(o => o.visible = false);
  // bleachers
  const bl = new THREE.Group(); bl.position.set(0, 0, -6.5); scene.add(bl);
  for (let r = 0; r < 6; r++) { const step = new THREE.Mesh(new THREE.BoxGeometry(30, 0.4, 0.8), new THREE.MeshStandardMaterial({ color: [0x3a6ad8, 0xe8e8ec][r % 2] })); step.position.set(0, 0.2 + r * 0.4, -r * 0.8); bl.add(step); }
  const cr = rng(7); for (let i = 0; i < 70; i++) { const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.25, 4, 8), new THREE.MeshStandardMaterial({ color: [0xff5a5a, 0xffd23f, 0x5be37d, 0x39d0ff, 0xb05cff][i % 5] })); const r = Math.floor(cr() * 6); p.position.set((cr() - 0.5) * 26, 0.6 + r * 0.4, -r * 0.8); bl.add(p); }
  [[-6, -9], [7, -10]].forEach(([x, z], i) => { const tr = tree({ h: 4, seed: i + 40 }); tr.position.set(x, 0, z); scene.add(tr); });
  // hero + old self
  const hero = makeHuman('casual', { shirt: 0x2a9d8f, jeans: 0x1d3557, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const old = makeHuman('casual', { shirt: 0x2a9d8f, jeans: 0x1d3557, hair: 0xe0e0e0, beard: true }); scene.add(old.root);
  old.root.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0; } });
  const heart = heartMesh(); heart.scale.setScalar(0.12); scene.add(heart);
  const heart2 = heartMesh(); heart2.scale.setScalar(0.1); scene.add(heart2);
  const rings = []; for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.01, 8, 40), new THREE.MeshBasicMaterial({ color: 0xff5a7a, transparent: true, toneMapped: false })); r.userData.ph = i / 3; scene.add(r); rings.push(r); }
  // vessels: red line from the heart that extends and wraps the globe
  const globeT = canvasTex(512, 256, (g) => { g.fillStyle = '#1f6fd0'; g.fillRect(0, 0, 512, 256); const r = rng(9); g.fillStyle = '#4caf50'; for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(r() * 512, 40 + r() * 176, 20 + r() * 50, 12 + r() * 30, r() * 3, 0, 7); g.fill(); } });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 20), new THREE.MeshStandardMaterial({ map: globeT, roughness: 0.7 })); scene.add(globe);
  const NP = 320, linePos = new Float32Array(NP * 3); const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  const vline = new THREE.Line(lgeo, new THREE.LineBasicMaterial({ color: 0xff2a4a, toneMapped: false })); vline.frustumCulled = false; scene.add(vline);
  const tube = []; for (let i = 0; i < 60; i++) { const s = glowSprite(0xff2a4a, 0.05); scene.add(s); tube.push(s); }
  // counter
  const cc = document.createElement('canvas'); cc.width = 1024; cc.height = 220; const cg = cc.getContext('2d'); const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace;
  const cnt = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); cnt.renderOrder = 31; scene.add(cnt); let lastC = '';
  const drawC = (s, col) => { if (s === lastC) return; lastC = s; cg.clearRect(0, 0, 1024, 220); cg.font = "400 120px Brand, sans-serif"; cg.textAlign = 'center'; cg.textBaseline = 'middle'; cg.lineWidth = 14; cg.strokeStyle = 'rgba(0,0,0,0.6)'; cg.strokeText(s, 512, 110); cg.fillStyle = col; cg.fillText(s, 512, 110); ct.needsUpdate = true; };
  const twice = textSprite('2.5x', '#ffd23f', "400 140px Brand, sans-serif"); scene.add(twice);
  const fx = { wrap: burst(0xffd23f, 60, 1) }; scene.add(fx.wrap);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      const b = beat(t);
      hero.root.position.set(0, 0, 0); hero.root.rotation.y = 0.15;
      const jog = smooth(range(t, 3.0, 3.6)) * (1 - smooth(range(t, 9.4, 10.0)));
      let pose = STAND(t);
      if (jog > 0.01) { const s = Math.sin(t * 8); pose = over(pose, { lHip: [-0.5 * s * jog, 0, 0.07], rHip: [0.5 * s * jog, 0, -0.07], lKn: [0.7 * Math.max(0, Math.sin(t * 8 + 1.2)) * jog, 0, 0], rKn: [0.7 * Math.max(0, -Math.sin(t * 8 + 1.2)) * jog, 0, 0], lSh: [0.6 * s * jog, 0, 0.16], rSh: [-0.6 * s * jog, 0, -0.16], lEl: [-1.4 * jog, 0, 0], rEl: [-1.4 * jog, 0, 0] }); hero.root.position.y = Math.abs(Math.sin(t * 8)) * 0.05 * jog; }
      hero.setPose(pose); hero.setMouth(jog > 0.3 ? 0.3 : 0.06);
      const ok = smooth(range(t, 10.2, 10.9)) * (1 - smooth(range(t, 15.8, 16.4)));
      old.root.position.set(0.8, 0, -0.4); old.root.rotation.y = -0.3;
      old.setPose(over(STAND(t, 2), { spine: [0.2, 0, 0], neck: [0.15, 0, 0], rSh: [-0.3, 0, -0.2], rEl: [-0.4, 0, 0] })); old.setMouth(0.06);
      old.root.traverse(o => { if (o.isMesh) o.material.opacity = ok; }); old.root.visible = ok > 0.01;
      scene.updateMatrixWorld(true);
      const chest = hero.j.chest.localToWorld(V(0.06, 0.12, 0.2));
      heart.position.copy(chest); heart.scale.setScalar(0.11 * (1 + 0.22 * b)); heart.rotation.y = Math.sin(t) * 0.3;
      const ochest = old.j.chest.localToWorld(V(0.06, 0.12, 0.2));
      heart2.position.copy(ochest); heart2.scale.setScalar(Math.max(0.001, 0.1 * (1 + 0.22 * b) * ok)); heart2.visible = ok > 0.01;
      rings.forEach((r, i) => { const u2 = ((t * 1.17) + r.userData.ph) % 1; r.position.copy(chest); r.scale.setScalar(0.5 + u2 * 2.2); r.material.opacity = 0.7 * (1 - u2); r.lookAt(c.position); });
      // vessels + globe (16.1 ->)
      const gk = smooth(range(t, 20.9, 21.6));
      const gpos = V(0.72, 1.2, 0.1);
      globe.position.copy(gpos); globe.scale.setScalar(Math.max(0.001, gk * 0.62)); globe.visible = gk > 0.01; globe.rotation.y = t * 0.4;
      const ext = smooth(range(t, 16.2, 20.6)), wrapK = smooth(range(t, 21.6, 24.2));
      for (let i = 0; i < NP; i++) {
        const u2 = i / (NP - 1); let p;
        if (u2 < 0.3) { const k = u2 / 0.3; p = chest.clone().lerp(gpos.clone().add(V(-0.3, -0.1, 0.15)), k); p.y += Math.sin(k * Math.PI * 3 + t * 2) * 0.12 * (1 - k); }
        else { const k = (u2 - 0.3) / 0.7; const a = k * Math.PI * 2 * 2.5; const yy = (k - 0.5) * 0.6; const yys = yy * 0.62; const rr = (Math.sqrt(Math.max(0.01, 0.45 * 0.45 - yy * yy)) + 0.02) * 0.62; p = gpos.clone().add(V(Math.cos(a) * rr, yys, Math.sin(a) * rr)); }
        const lim = u2 < 0.3 ? ext : wrapK;
        const show = u2 < 0.3 ? (u2 / 0.3) <= ext : ((u2 - 0.3) / 0.7) <= wrapK;
        if (!show) p = i > 0 ? V(linePos[(i - 1) * 3], linePos[(i - 1) * 3 + 1], linePos[(i - 1) * 3 + 2]) : chest.clone();
        linePos[i * 3] = p.x; linePos[i * 3 + 1] = p.y; linePos[i * 3 + 2] = p.z;
      }
      lgeo.attributes.position.needsUpdate = true; vline.visible = ext > 0.01;
      tube.forEach((s, i) => { const idx = Math.floor((i / tube.length) * NP); s.position.set(linePos[idx * 3], linePos[idx * 3 + 1], linePos[idx * 3 + 2]); s.material.opacity = ext > 0.01 ? 0.9 : 0; s.visible = ext > 0.01; });
      const tk = easeOut(range(t, 23.0, 23.3));
      twice.position.copy(gpos).add(V(0.0, -0.45, 0.1)); twice.scale.set(0.6 * tk, 0.3 * tk, 1); twice.visible = tk > 0.01;
      fx.wrap.position.copy(gpos); fx.wrap.update(t - 24.2);
      // ---------- camera ----------
      const KEYS = [[0, [0.6, 1.5, 4.2], [0.1, 1.05, 0]], [3.0, [0.5, 1.45, 3.6], [0.1, 1.0, 0]], [9.6, [0.6, 1.5, 3.8], [0.3, 1.0, -0.2]], [16.0, [0.6, 1.5, 3.8], [0.3, 1.0, -0.2]], [20.6, [0.8, 1.6, 4.2], [0.45, 1.15, 0]], [25.2, [0.8, 1.6, 4.2], [0.45, 1.15, 0]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.35 + 0.4 * b, 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      let txt = '', col = '#ffffff', on = 0;
      if (t > 3.6 && t < 5.6) { txt = `${Math.round(lerp(0, 70, easeOut(range(t, 3.7, 4.9))))} / min`; on = 1; col = '#ff8fa8'; }
      else if (t >= 5.6 && t < 9.5) { txt = `${Math.round(lerp(70, 100800, easeOut(range(t, 5.8, 7.8)))).toLocaleString('en-US')} / day`; on = 1; col = '#ffd23f'; }
      else if (t >= 11.2 && t < 16.0) { txt = Math.round(lerp(100800, 3000000000, easeOut(range(t, 11.6, 13.6)))).toLocaleString('en-US'); on = 1; col = '#ff5a5a'; }
      else if (t >= 17.7 && t < 20.9) { txt = `${Math.round(lerp(0, 100000, easeOut(range(t, 18.0, 19.8)))).toLocaleString('en-US')} km`; on = 1; col = '#ff8fa8'; }
      if (on) drawC(txt, col);
      cnt.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.2).addScaledVector(rt, 0.0); cnt.scale.set(0.6 * on, 0.129 * on, 1); cnt.visible = !!on;
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.45, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
