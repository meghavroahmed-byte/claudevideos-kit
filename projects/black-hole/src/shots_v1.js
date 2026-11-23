import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { textSprite } from './room.js';
import { rng, glowTexture } from './textures.js';

export const DURATION = 27.8;
export const CAPTIONS = [
  [0.0, 'What if you fell into a black hole?'],
  [2.41, 'As you get close'], [3.56, 'gravity pulls much harder'], [5.34, 'on your feet than on your head'],
  [7.25, 'Your body gets stretched'], [8.44, 'longer and thinner'], [9.87, 'like spaghetti'], [11.08, 'Scientists really call this'], [12.59, 'spaghettification!'],
  [14.21, 'To a friend watching from far away'], [16.44, 'you would seem to slow down'], [17.88, 'and freeze at the edge'], [19.38, 'fading red'],
  [20.53, 'But for you'], [21.5, 'time keeps going'], [22.77, 'straight into the darkness'], [24.73, "And nobody knows what's inside", 27.6],
];
export const FADES = [];

const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const RH = 3.0; // event horizon radius

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 4, sunDir: [3, 4, 6], sun: 1.4 });
  scene.userData.sky.visible = false;
  scene.children.filter(o => o.isMesh && (o.material.isShadowMaterial || o.geometry.type === 'PlaneGeometry')).forEach(o => o.visible = false);
  scene.background = new THREE.Color(0x02030a); scene.fog = null;
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xbfc8ff); hemi.groundColor.set(0xff8a3a); hemi.intensity = 0.7;
  const diskL = new THREE.PointLight(0xffa040, 30, 30, 1.0); diskL.position.set(0, 0.5, 0); scene.add(diskL);
  // stars
  const NS = 1500, sp = new Float32Array(NS * 3), r0 = rng(4);
  for (let i = 0; i < NS; i++) { const v = V(r0() - 0.5, r0() - 0.5, r0() - 0.5).normalize().multiplyScalar(80 + r0() * 40); sp[i * 3] = v.x; sp[i * 3 + 1] = v.y; sp[i * 3 + 2] = v.z; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.5, map: glowTexture(), color: 0xffffff, transparent: true, depthWrite: false, sizeAttenuation: true })));
  // black hole: horizon + accretion disk + photon ring + halo
  const bh = new THREE.Group(); scene.add(bh);
  const horizon = new THREE.Mesh(new THREE.SphereGeometry(RH, 48, 32), new THREE.MeshBasicMaterial({ color: 0x000000 })); bh.add(horizon);
  const diskT = canvasTex(1024, 1024, (g) => { const gr = g.createRadialGradient(512, 512, 0, 512, 512, 512); gr.addColorStop(0.0, 'rgba(0,0,0,0)'); gr.addColorStop(0.36, 'rgba(255,250,220,1)'); gr.addColorStop(0.45, 'rgba(255,190,80,0.95)'); gr.addColorStop(0.7, 'rgba(230,90,30,0.6)'); gr.addColorStop(1, 'rgba(120,20,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
    const r = rng(7); g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(0,0,0,${0.15 + r() * 0.25})`; g.lineWidth = 2 + r() * 6; const rr = 200 + r() * 300, a = r() * 7; g.beginPath(); g.arc(512, 512, rr, a, a + 0.6 + r()); g.stroke(); } });
  const disk = new THREE.Mesh(new THREE.RingGeometry(RH * 1.05, RH * 3.6, 96, 1), new THREE.MeshBasicMaterial({ map: diskT, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  // remap ring UVs radially to the square texture
  { const p = disk.geometry.attributes.position, uv = disk.geometry.attributes.uv, R = RH * 3.6; for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 + p.getX(i) / (2 * R), 0.5 + p.getY(i) / (2 * R)); }
  disk.rotation.x = -Math.PI / 2 + 0.22; bh.add(disk);
  const ringT = canvasTex(512, 512, (g) => { const gr = g.createRadialGradient(256, 256, 150, 256, 256, 256); gr.addColorStop(0, 'rgba(255,220,150,0)'); gr.addColorStop(0.55, 'rgba(255,230,170,0.95)'); gr.addColorStop(0.7, 'rgba(255,150,60,0.4)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512); });
  const photon = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); photon.scale.setScalar(RH * 3.0); bh.add(photon);
  const halo = glowSprite(0xff7a2a, RH * 9); halo.material.opacity = 0.35; bh.add(halo);
  // hero with helmet
  const hero = makeHuman('casual', { shirt: 0xf4f4f4, jeans: 0xdedede, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 16), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.3 })); helmet.position.y = 0.08; hero.j.head.add(helmet);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.38, 0.14), new THREE.MeshStandardMaterial({ color: 0xc8ccd4, roughness: 0.5 })); pack.position.set(0, 0.12, -0.17); hero.j.chest.add(pack);
  const mats = []; hero.root.traverse(o => { if (o.isMesh && o !== helmet) { o.material = o.material.clone(); o.material.transparent = o.material.transparent; mats.push({ m: o.material, c: o.material.color ? o.material.color.clone() : null }); } });
  // friend on a small ship
  const ship = new THREE.Group(); scene.add(ship);
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.25, 32), new THREE.MeshStandardMaterial({ color: 0xc8ccd4, metalness: 0.6, roughness: 0.3 })); ship.add(hull);
  const lights = []; for (let i = 0; i < 10; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x39d0ff : 0xff5fa2, toneMapped: false })); l.position.set(Math.cos(i / 10 * 6.283) * 1.0, -0.02, Math.sin(i / 10 * 6.283) * 1.0); ship.add(l); lights.push(l); }
  const friend = makeHuman('casual', { shirt: 0x39a0ff, jeans: 0x2f3e5a, hair: 0x6a3a1a }); ship.add(friend.root); friend.root.position.y = 0.12;
  const fh = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 16), helmet.material); fh.position.y = 0.08; friend.j.head.add(fh);
  // gravity arrows (feet big, head small)
  const arM = new THREE.MeshBasicMaterial({ color: 0x5be37d, toneMapped: false, transparent: true });
  const mkArrow = () => { const g = new THREE.Group(); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 8), arM); sh.position.y = -0.5; g.add(sh); const hd = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 12), arM); hd.rotation.x = Math.PI; hd.name = 'hd'; g.add(hd); scene.add(g); return g; };
  const arFeet = mkArrow(), arHead = mkArrow();
  const spag = textSprite('SPAGHETTI', '#ffd23f', "400 64px Brand, sans-serif"); scene.add(spag);
  const qm = textSprite('?', '#ffffff', "400 200px Brand, sans-serif"); scene.add(qm);
  const sight = []; for (let i = 0; i < 16; i++) { const s = glowSprite(0x39d0ff, 0.12); scene.add(s); sight.push(s); }
  const clockT = canvasTex(256, 256, (g) => { g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.arc(128, 128, 110, 0, 7); g.fill(); g.strokeStyle = '#222'; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 110, 0, 7); g.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.beginPath(); g.moveTo(128 + Math.cos(a) * 88, 128 + Math.sin(a) * 88); g.lineTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100); g.stroke(); } });
  const clock = new THREE.Sprite(new THREE.SpriteMaterial({ map: clockT, transparent: true, depthTest: false, toneMapped: false })); clock.renderOrder = 30; scene.add(clock);
  const hand = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(256, 256, (g) => { g.strokeStyle = '#ff3b3b'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 40); g.stroke(); }), transparent: true, depthTest: false, toneMapped: false })); hand.renderOrder = 31; scene.add(hand);
  const term = stamp('SPAGHETTIFICATION!', '#ffd23f', 0.75); scene.add(term);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      disk.rotation.z = t * 0.25; photon.material.rotation = t * 0.1;
      // hero fall path (feet toward the hole, which is below)
      const stretch = easeInOut(range(t, 7.3, 13.0));
      const fall = t < 20.5 ? lerp(13.5, 7.8, easeInOut(range(t, 0, 14))) : lerp(7.8, 0, easeIn(range(t, 20.6, 24.4)));
      const freeze = smooth(range(t, 16.4, 18.4)) * (1 - smooth(range(t, 20.4, 20.9)));
      const red = smooth(range(t, 18.8, 20.0)) * (1 - smooth(range(t, 20.4, 20.9)));
      const sy = lerp(1, 3.2, stretch) * (t > 20.5 ? lerp(1, 1.4, range(t, 20.6, 24.0)) : 1), sxz = lerp(1, 0.38, stretch);
      hero.root.position.set(0, fall + (t < 14 ? 0 : 0) + RH * 0.0, 0.6);
      hero.root.scale.set(sxz, sy, sxz); hero.root.rotation.y = 0.35 + (t < 16 || t > 20.5 ? t * 0.05 : 16 * 0.05);
      const tp = freeze > 0.5 ? 17.5 : t;
      const flail = Math.sin(tp * 3) * (1 - stretch * 0.5);
      hero.setPose({ lSh: [-0.2 + 0.3 * flail, 0, 0.9 + 0.3 * flail], rSh: [-0.2 - 0.3 * flail, 0, -0.9 - 0.3 * flail], lEl: [-0.4, 0, 0], rEl: [-0.4, 0, 0], lHip: [-0.2 + 0.25 * flail, 0, 0.12], rHip: [-0.2 - 0.25 * flail, 0, -0.12], lKn: [0.4, 0, 0], rKn: [0.4, 0, 0], neck: [0.25, 0, 0] });
      hero.setMouth(t > 7.3 && t < 13 ? 0.6 : 0.1);
      const vis = t < 24.2 ? 1 : 1 - smooth(range(t, 24.2, 24.6));
      mats.forEach(({ m, c: c0 }) => { if (c0) m.color.copy(c0).lerp(new THREE.Color(0xff2a1a), red * 0.85); if (m.emissive) m.emissive.setRGB(0.5 * red, 0, 0); m.transparent = true; m.opacity = (1 - 0.55 * red) * vis; });
      hero.root.visible = vis > 0.01;
      scene.updateMatrixWorld(true);
      const feet = hero.j.lAn.getWorldPosition(V()).lerp(hero.j.rAn.getWorldPosition(V()), 0.5), head = hero.j.head.getWorldPosition(V());
      // arrows
      const ak = smooth(range(t, 3.5, 4.0)) * (1 - smooth(range(t, 7.0, 7.4)));
      const fp = smooth(range(t, 5.4, 5.8)), hp2 = smooth(range(t, 6.2, 6.6));
      arFeet.position.copy(feet).add(V(0.45, -0.1, 0.2)); arFeet.scale.set(1, Math.max(0.001, ak * lerp(0.6, 1.4, fp)), 1); arFeet.visible = ak > 0.01;
      arHead.position.copy(head).add(V(0.45, 0.2, 0.2)); arHead.scale.set(1, Math.max(0.001, ak * lerp(0.6, 0.3, hp2)), 1); arHead.visible = ak > 0.01;
      arFeet.children.forEach(o => { if (o.name === 'hd') o.position.y = -1; }); arHead.children.forEach(o => { if (o.name === 'hd') o.position.y = -1; });
      // spaghetti word
      const sk = easeOut(range(t, 9.9, 10.2)) * (1 - smooth(range(t, 11.0, 11.4)));
      spag.position.copy(head).add(V(0.0, 0.9, 0.6)); spag.scale.set(4.5 * sk, 1.5 * sk, 1); spag.visible = sk > 0.01;
      // friend ship
      const shp = V(5.5, 15.5, 6.5);
      ship.position.copy(shp).add(V(0, Math.sin(t * 0.8) * 0.1, 0)); ship.rotation.y = -0.6;
      const wave = t > 14.2 && t < 16.0 ? Math.sin(t * 9) : 0;
      friend.root.rotation.y = 0.3 + Math.PI;
      friend.setPose({ lSh: [0.05, 0, 0.16], rSh: [-2.6 + 0.2 * wave, 0, -0.4], lEl: [-0.3, 0, 0], rEl: [-0.4 + 0.3 * wave, 0, 0], neck: [0.5, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07] });
      friend.setMouth(0.06);
      lights.forEach((l, i) => l.visible = Math.sin(t * 4 + i) > -0.3);
      scene.updateMatrixWorld(true);
      const fhd = friend.j.head.getWorldPosition(V());
      const slk = smooth(range(t, 15.2, 15.8)) * (1 - smooth(range(t, 20.2, 20.6)));
      sight.forEach((s, i) => { const u2 = ((i / sight.length) + t * 0.25) % 1; s.position.copy(fhd).lerp(head, u2); s.material.opacity = slk * 0.9; s.visible = slk > 0.01; });
      // ---------- camera ----------
      const KEYS = [[0, [3.5, 9.5, 24], [0, 8.2, 0]], [2.4, [2.2, 12.8, 9.5], [0, 12.2, 0.6]], [7.0, [2.2, 12.0, 10.5], [0, 11.4, 0.6]], [13.0, [3.0, 11.5, 17.5], [0, 10.6, 0.6]], [14.2, [3.0, 11.5, 17.5], [0, 10.6, 0.6]],
        [15.8, [9.5, 15.8, 22.0], [2.8, 12.6, 3.5]], [20.3, [9.3, 15.6, 21.5], [2.8, 12.4, 3.5]], [22.0, [3.2, 11.5, 17.5], [0, 8.5, 0.6]], [24.2, [2.0, 7.0, 12.5], [0, 3.8, 0.6]], [27.8, [0.8, 4.2, 5.2], [0, 2.4, 0]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.6 + stretch * 1.2 * (t < 14 ? 1 : 0), 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      // slow clock beside the frozen hero (friend's view)
      const clk = easeOut(range(t, 16.5, 16.9)) * (1 - smooth(range(t, 20.3, 20.7)));
      const ang = t < 16.5 ? 0 : (t < 18 ? (t - 16.5) * 3 : 4.5 + (1 - Math.exp(-(t - 18) * 1.5)) * 0.4);
      clock.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.12).addScaledVector(rt, 0.16); clock.scale.setScalar(0.18 * clk); clock.visible = clk > 0.01;
      hand.position.copy(clock.position); hand.scale.setScalar(0.18 * clk); hand.material.rotation = -ang; hand.visible = clk > 0.01;
      term.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.22); term.set(t > 12.6 && t < 14.1 ? easeOut(range(t, 12.6, 12.8)) : 0);
      const qk = easeOut(range(t, 25.3, 25.7));
      qm.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.0); qm.scale.set(0.5 * qk, 0.5 * qk * 0.5, 1); qm.material.opacity = qk * (0.8 + 0.2 * Math.sin(t * 5)); qm.visible = qk > 0.01; qm.renderOrder = 40; qm.material.depthTest = false;
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.8, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
