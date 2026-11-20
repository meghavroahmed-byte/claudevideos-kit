import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 23.2;
export const CAPTIONS = [
  [0.0, 'Could you outrun a cheetah?'],
  [1.86, 'Not a chance!'], [3.36, 'A cheetah hits over 100 km/h'], [6.18, 'in just three seconds'], [8.01, 'The fastest human ever'], [9.53, 'ran about 44'],
  [11.18, "But here's your hope"], [12.61, 'A cheetah can only sprint'], [14.02, 'for about twenty seconds'], [15.39, 'before it overheats and has to stop'],
  [17.79, 'So if you had a huge head start'], [19.92, 'you might just make it'], [21.24, 'Good luck with that!', 23.0],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [0, 0, 0], neck: [0.03, 0, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const run = (t, sp = 11, a = 0.9) => ({ lHip: [-a * Math.sin(t * sp), 0, 0.07], rHip: [a * Math.sin(t * sp), 0, -0.07], lKn: [1.3 * Math.max(0, Math.sin(t * sp + 1.2)), 0, 0], rKn: [1.3 * Math.max(0, -Math.sin(t * sp + 1.2)), 0, 0], lSh: [1.0 * Math.sin(t * sp), 0, 0.15], rSh: [-1.0 * Math.sin(t * sp), 0, -0.15], lEl: [-1.5, 0, 0], rEl: [-1.5, 0, 0], spine: [0.3, 0, 0], neck: [-0.15, 0, 0] });
const HV = 7.0;
// cheetah offset from hero (x), by time
const dOf = (t) => { if (t < 3.0) return lerp(-7, -1.6, easeIn(range(t, 0, 3.0))); if (t < 13.4) return lerp(-1.6, 1.4, smooth(range(t, 3.0, 7.0))); return lerp(1.4, -30, easeIn(range(t, 13.4, 17.2))); };
const cheetahSpeedFactor = (t) => t < 13.4 ? 1 : 1 - smooth(range(t, 13.4, 17.0));

function makeCheetah() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const spotT = canvasTex(256, 256, (gg) => { gg.fillStyle = '#e8b858'; gg.fillRect(0, 0, 256, 256); const r = rng(5); gg.fillStyle = '#2a1a10'; for (let i = 0; i < 90; i++) { gg.beginPath(); gg.arc(r() * 256, r() * 256, 4 + r() * 5, 0, 7); gg.fill(); } });
  const m = new THREE.MeshStandardMaterial({ map: spotT, roughness: 0.8 }), belly = new THREE.MeshStandardMaterial({ color: 0xf4e4c0 });
  body.position.y = 0.72;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.75, 8, 16), m); torso.rotation.z = Math.PI / 2; body.add(torso);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), m); chest.position.x = 0.4; body.add(chest);
  const head = new THREE.Group(); head.position.set(0.68, 0.12, 0); body.add(head);
  const hm = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), m); hm.scale.set(1.1, 0.9, 1); head.add(hm);
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), belly); snout.position.set(0.12, -0.04, 0); head.add(snout);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshBasicMaterial({ color: 0x111111 })); e.position.set(0.1, 0.04, s * 0.07); head.add(e); const ear = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.07, 6), m); ear.position.set(-0.02, 0.12, s * 0.07); head.add(ear); const tear = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.08, 0.008), new THREE.MeshBasicMaterial({ color: 0x111111 })); tear.position.set(0.12, -0.01, s * 0.06); tear.rotation.z = 0.4; head.add(tear); }
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.04), new THREE.MeshStandardMaterial({ color: 0xff6a8a })); tongue.position.set(0.18, -0.1, 0); head.add(tongue);
  const legs = []; for (const [x, z] of [[0.38, 0.1], [0.38, -0.1], [-0.38, 0.1], [-0.38, -0.1]]) { const lg = new THREE.Group(); lg.position.set(x, -0.08, z); body.add(lg); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.62, 8), m); l.position.y = -0.31; lg.add(l); legs.push(lg); }
  const tail = new THREE.Group(); tail.position.set(-0.55, 0.05, 0); body.add(tail); const tm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.7, 6), m); tm.position.x = -0.35; tm.rotation.z = Math.PI / 2; tail.add(tm);
  g.userData = { body, head, legs, tail, tongue, m };
  g.gallop = (ph, amp) => { const s = Math.sin(ph); legs[0].rotation.z = -s * amp; legs[1].rotation.z = -Math.sin(ph + 0.3) * amp; legs[2].rotation.z = s * amp; legs[3].rotation.z = Math.sin(ph + 0.3) * amp; body.position.y = 0.72 + Math.abs(Math.sin(ph)) * 0.08 * amp; body.rotation.z = Math.sin(ph) * 0.12 * amp; tail.rotation.z = 0.2 + Math.sin(ph * 0.5) * 0.3; };
  return g;
}

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 10, sunDir: [-4, 8, 6], sun: 2.8 });
  const U = scene.userData.sky.material.uniforms; U.top.value.set(0x3a8ae0); U.mid.value.set(0x9ac8f0); U.horizon.value.set(0xffe0a8); U.floorC.value.set(0xd8b878);
  scene.fog = new THREE.Fog(0xf4dcb0, 30, 160);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.9;
  const key = scene.userData.key;
  const grassT = canvasTex(512, 512, (g) => { g.fillStyle = '#d8b46a'; g.fillRect(0, 0, 512, 512); const r = rng(4); for (let i = 0; i < 3000; i++) { g.strokeStyle = r() > 0.5 ? 'rgba(170,130,60,0.5)' : 'rgba(240,210,140,0.5)'; g.lineWidth = 2; const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y - 8 - r() * 8); g.stroke(); } });
  grassT.wrapS = grassT.wrapT = THREE.RepeatWrapping; grassT.repeat.set(60, 60);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ map: grassT, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.x = 100; ground.receiveShadow = true; scene.add(ground);
  scene.children.filter(o => o.isMesh && o !== ground && o.geometry && o.geometry.type === 'PlaneGeometry' && !o.material.isShadowMaterial).forEach(o => o.visible = false);
  const acacia = (x, z, s) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 3, 8), new THREE.MeshStandardMaterial({ color: 0x5a3a22 })); tr.position.y = 1.5; g.add(tr); const top = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 1.6, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0x6a8a3a, flatShading: true })); top.position.y = 3.2; g.add(top); };
  const tr = rng(6); for (let i = 0; i < 26; i++) acacia(-20 + i * 8 + tr() * 4, -8 - tr() * 14, 0.9 + tr() * 0.5);
  const grassTufts = []; for (let i = 0; i < 120; i++) { const t2 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 5), new THREE.MeshStandardMaterial({ color: 0xc8a050 })); t2.position.set(-20 + tr() * 200, 0.17, (tr() - 0.5) * 6 + (tr() > 0.5 ? 2.5 : -2.5)); scene.add(t2); }
  const hero = makeHuman('casual', { shirt: 0x39a0ff, jeans: 0x1d3557, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const cheetah = makeCheetah(); scene.add(cheetah);
  const heat = glowSprite(0xff3b1a, 1.4); scene.add(heat);
  const steam = []; for (let i = 0; i < 8; i++) { const s = glowSprite(0xffffff, 0.3); s.userData.ph = i / 8; scene.add(s); steam.push(s); }
  const dust = []; for (let i = 0; i < 20; i++) { const s = glowSprite(0xd8c098, 0.35); s.material.blending = THREE.NormalBlending; s.userData.ph = i / 20; scene.add(s); dust.push(s); }
  const mk = (txt, col) => { const cc = document.createElement('canvas'); cc.width = 768; cc.height = 220; const g = cc.getContext('2d'); const t = new THREE.CanvasTexture(cc); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); s.renderOrder = 31; scene.add(s); let last = ''; s.draw = (str) => { if (str === last) return; last = str; g.clearRect(0, 0, 768, 220); g.font = "400 120px Brand, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 14; g.strokeStyle = 'rgba(0,0,0,0.6)'; g.strokeText(str, 384, 110); g.fillStyle = col; g.fillText(str, 384, 110); t.needsUpdate = true; }; return s; };
  const cSpd = mk('', '#ffd23f'), hSpd = mk('', '#39a0ff'), timer = mk('', '#ff5a3a');
  const luck = stamp('GOOD LUCK!', '#5be37d', 0.6); scene.add(luck);
  const fx = { stop: burst(0xd8c098, 60, 1) }; scene.add(fx.stop);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      const hx = HV * t;
      hero.root.position.set(hx, Math.abs(Math.sin(t * 11)) * 0.06, 0.4); hero.root.rotation.y = Math.PI / 2;
      hero.setPose(over(STAND(t), run(t, 11, 0.9))); hero.setMouth(0.5);
      const d = dOf(t), sf = cheetahSpeedFactor(t);
      const cx = t < 17.2 ? hx + d : HV * 17.2 + dOf(17.2);
      cheetah.position.set(cx, 0, -0.35);
      const lying = smooth(range(t, 16.8, 17.6));
      cheetah.gallop(t * 16 * Math.max(0.15, sf), 0.8 * sf);
      cheetah.userData.body.position.y = lerp(cheetah.userData.body.position.y, 0.32, lying);
      cheetah.userData.legs.forEach(l => l.rotation.z = lerp(l.rotation.z, (l.position.x > 0 ? -1.4 : 1.4), lying));
      cheetah.userData.tongue.visible = t > 14.0;
      cheetah.userData.head.rotation.z = -0.25 * lying;
      const hot = smooth(range(t, 14.8, 15.8));
      cheetah.userData.m.emissive = cheetah.userData.m.emissive || new THREE.Color(); cheetah.userData.m.emissive.setRGB(0.5 * hot * (0.6 + 0.4 * Math.sin(t * 8)), 0.05 * hot, 0);
      heat.position.set(cx, 0.8, -0.35); heat.material.opacity = 0.4 * hot; heat.visible = hot > 0.01;
      steam.forEach((s, i) => { const u2 = (t * 0.8 + s.userData.ph) % 1; s.position.set(cx + Math.sin(i * 2) * 0.3, 1.0 + u2 * 1.2, -0.35); s.material.opacity = hot * 0.5 * (1 - u2); s.visible = hot > 0.01; });
      dust.forEach((s, i) => { const who = i % 2; const u2 = (t * 2 + s.userData.ph) % 1; const bx = who ? hx : cx; s.position.set(bx - 0.5 - u2 * 1.5, 0.1 + u2 * 0.4, who ? 0.4 : -0.35); s.material.opacity = 0.4 * (1 - u2) * (who ? 1 : sf); });
      fx.stop.position.set(cx, 0.3, -0.35); fx.stop.update(t - 17.0);
      // ---------- camera (tracking) ----------
      let camP, camL;
      if (t < 17.4) { const midx = hx + Math.min(0, d) * 0.5; camP = V(midx + 0.5, 2.0, 7.8 + Math.max(0, -d - 1.5) * 2.2); camL = V(midx, 0.8, 0); if (t > 12.6) { const k = smooth(range(t, 12.6, 14.0)); camP.lerp(V(hx + d * 0.5, 2.2, 9.0 + Math.min(10, -d * 0.2)), 0); } }
      // focus on cheetah stopping 13.4..17.4: camera slows, stays with cheetah
      const follow = smooth(range(t, 13.6, 15.0));
      if (t < 17.4) { const p2 = V(cx + 0.3, 1.6, 5.4), l2 = V(cx, 0.6, 0); camP.lerp(p2, follow); camL.lerp(l2, follow); }
      else { const ftx = HV * 17.2 + dOf(17.2); const p3 = V(ftx - 3.6, 1.05, -0.35), l3 = V(ftx + 10, 0.45, -0.3); const p2 = V(cx + 0.3, 1.6, 5.4), l2 = V(cx, 0.6, 0); const k = smooth(range(t, 17.4, 18.6)); camP = p2.lerp(p3, k); camL = l2.lerp(l3, k); }
      const shk = shake(t, 0.8 * (1 - follow * 0.6), 2);
      place(c, [camP.x + shk[0], camP.y + shk[1], camP.z + shk[2]], [camL.x, camL.y, camL.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const ck = t > 3.4 && t < 11.0 ? 1 : 0, hk = t > 8.0 && t < 11.0 ? 1 : 0, tk = t > 12.8 && t < 17.6 ? 1 : 0;
      cSpd.draw(`🐆 ${Math.round(lerp(0, 104, easeOut(range(t, 4.0, 7.0))))} km/h`.replace('🐆 ', '')); cSpd.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.17).addScaledVector(rt, 0.0); cSpd.scale.set(0.32 * ck, 0.092 * ck, 1); cSpd.visible = !!ck;
      hSpd.draw(`YOU ${Math.round(lerp(0, 44, easeOut(range(t, 9.4, 10.4))))} km/h`); hSpd.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.1).addScaledVector(rt, 0.0); hSpd.scale.set(0.32 * hk, 0.092 * hk, 1); hSpd.visible = !!hk;
      timer.draw(`${Math.min(20, Math.max(0, Math.round(lerp(0, 20, range(t, 13.0, 16.8)))))} s`); timer.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.15); timer.scale.set(0.32 * tk, 0.092 * tk, 1); timer.visible = !!tk;
      luck.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); luck.set(t > 21.3 ? easeOut(range(t, 21.3, 21.5)) : 0);
      return { dof: { focus: 6, aperture: 0, maxblur: 0 }, bloom: 0.3, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
