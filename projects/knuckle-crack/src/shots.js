import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 26.8;
export const CAPTIONS = [
  [0.0, 'What happens when you crack your knuckles?'],
  [2.52, 'Your finger joints'], [3.46, 'are wrapped in a little capsule'], [5.34, 'filled with a slippery fluid'],
  [7.36, 'When you pull or bend your finger'], [9.35, 'the joint stretches'], [10.73, 'and the pressure inside drops'],
  [12.83, 'Gas dissolved in the fluid'], [14.29, 'suddenly forms a tiny bubble'], [16.61, "That's the pop you hear!"],
  [18.12, "And no, it doesn't cause arthritis"], [20.8, 'One doctor cracked only one hand'], [22.72, 'for sixty years'], [24.17, 'and both hands were fine', 26.6],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const CRACK1 = 1.15, POP = 16.95;

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-2, 6, 4], sun: 0.6 });
  scene.children.filter(o => o.isMesh && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xc8c0ff); hemi.groundColor.set(0x201830); hemi.intensity = 0.85;
  // gaming room
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 1 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const wallT = canvasTex(512, 512, (g) => { g.fillStyle = '#1e2240'; g.fillRect(0, 0, 512, 512); g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 3; for (let i = 0; i < 512; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 512); g.stroke(); } });
  wallT.wrapS = wallT.wrapT = THREE.RepeatWrapping; wallT.repeat.set(4, 2);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), new THREE.MeshStandardMaterial({ map: wallT, roughness: 0.9 })); back.position.set(0, 2, -1.8); scene.add(back);
  const led = new THREE.Mesh(new THREE.BoxGeometry(14, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xb05cff, toneMapped: false })); led.position.set(0, 2.6, -1.77); scene.add(led);
  const led2 = new THREE.Mesh(new THREE.BoxGeometry(14, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0x39d0ff, toneMapped: false })); led2.position.set(0, 0.05, -1.77); scene.add(led2);
  const pl = new THREE.PointLight(0xb05cff, 6, 6, 1.4); pl.position.set(-1.2, 2.4, -1.2); scene.add(pl);
  const pl2 = new THREE.PointLight(0x39d0ff, 5, 6, 1.4); pl2.position.set(1.5, 1.6, -1.0); scene.add(pl2);
  const key2 = new THREE.PointLight(0xffeedd, 8, 9, 1.2); key2.position.set(0.5, 2.6, 2.6); scene.add(key2);
  // desk + monitor + chair
  const dm = new THREE.MeshStandardMaterial({ color: 0x15151c, roughness: 0.5 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.7), dm); desk.position.set(-1.1, 0.75, -1.2); scene.add(desk);
  for (const x of [-1.8, -0.4]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.6), dm); l.position.set(x, 0.375, -1.2); scene.add(l); }
  const monT = canvasTex(320, 180, (g) => { const gr = g.createLinearGradient(0, 0, 320, 180); gr.addColorStop(0, '#3a1a6a'); gr.addColorStop(1, '#0a6a9a'); g.fillStyle = gr; g.fillRect(0, 0, 320, 180); g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(30, 120, 80, 10); g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(220, 80, 30, 0, 7); g.fill(); });
  const mon = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.45), new THREE.MeshBasicMaterial({ map: monT, toneMapped: false })); mon.position.set(-1.1, 1.15, -1.4); scene.add(mon);
  const monB = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.49, 0.03), dm); monB.position.set(-1.1, 1.15, -1.42); scene.add(monB);
  const kb = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.02, 0.15), new THREE.MeshStandardMaterial({ color: 0x222230, emissive: 0x6030a0, emissiveIntensity: 0.4 })); kb.position.set(-1.1, 0.785, -1.05); scene.add(kb);
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.25), dm); shelf.position.set(1.3, 1.6, -1.65); scene.add(shelf);
  [0xff5fa2, 0xffd23f, 0x5be37d].forEach((col, i) => { const f = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.12), new THREE.MeshStandardMaterial({ color: col })); f.position.set(1.0 + i * 0.3, 1.73, -1.65); scene.add(f); });

  const hero = makeHuman('casual', { shirt: 0x7a4dd8, jeans: 0x2f3e5a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const doc = makeHuman('casual', { shirt: 0xf4f4f4, jeans: 0x3a4a5a, hair: 0xdcdcdc, beard: true }); scene.add(doc.root);
  // joint bubble
  const zc = document.createElement('canvas'); zc.width = zc.height = 512; const zg = zc.getContext('2d'); const zt = new THREE.CanvasTexture(zc); zt.colorSpace = THREE.SRGBColorSpace;
  const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); bub.renderOrder = 30; scene.add(bub);
  const drawB = (cap, fluid, gap, press, gas, tt) => {
    zg.clearRect(0, 0, 512, 512); zg.save(); zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.clip();
    zg.fillStyle = '#f0c4a4'; zg.fillRect(0, 0, 512, 512);
    const g2 = gap * 60;
    // capsule
    if (cap > 0.01) { zg.strokeStyle = `rgba(160,80,220,${cap})`; zg.lineWidth = 16; zg.beginPath(); zg.ellipse(256, 256, 120 + g2 * 0.5, 120 - g2 * 0.25, 0, 0, 7); zg.stroke(); }
    if (fluid > 0.01) { zg.fillStyle = `rgba(255,230,120,${0.75 * fluid})`; zg.beginPath(); zg.ellipse(256, 256, 110 + g2 * 0.5, 110 - g2 * 0.25, 0, 0, 7); zg.fill(); }
    // two bone ends
    zg.fillStyle = '#fbf6ea'; zg.strokeStyle = '#c8bca0'; zg.lineWidth = 6;
    zg.beginPath(); zg.moveTo(0, 200); zg.lineTo(170 - g2, 205); zg.quadraticCurveTo(232 - g2, 256, 170 - g2, 307); zg.lineTo(0, 312); zg.fill(); zg.stroke();
    zg.beginPath(); zg.moveTo(512, 205); zg.lineTo(340 + g2, 210); zg.quadraticCurveTo(282 + g2, 256, 340 + g2, 302); zg.lineTo(512, 307); zg.fill(); zg.stroke();
    // gas bubble
    if (gas > 0.01) { zg.fillStyle = `rgba(255,255,255,${0.9 * Math.min(1, gas)})`; zg.strokeStyle = '#7ab8ff'; zg.lineWidth = 6; zg.beginPath(); zg.arc(256, 256, 8 + 30 * gas, 0, 7); zg.fill(); zg.stroke(); }
    // pressure gauge (bottom)
    if (press >= 0) { zg.save(); zg.translate(256, 430); zg.fillStyle = 'rgba(20,20,40,0.85)'; zg.beginPath(); zg.arc(0, 0, 58, Math.PI, 0); zg.fill(); zg.strokeStyle = '#ffffff'; zg.lineWidth = 6; zg.beginPath(); zg.arc(0, 0, 50, Math.PI, 0); zg.stroke(); zg.rotate(-Math.PI / 2 + Math.PI * (press - 0.5)); zg.strokeStyle = '#ff3b3b'; zg.lineWidth = 8; zg.beginPath(); zg.moveTo(0, 0); zg.lineTo(0, -44); zg.stroke(); zg.restore(); }
    zg.restore(); zg.strokeStyle = 'rgba(255,255,255,0.95)'; zg.lineWidth = 12; zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.stroke(); zt.needsUpdate = true; };
  const crack = textSprite('CRACK!', '#ffd23f', "400 130px Brand, sans-serif"); scene.add(crack);
  const pop = textSprite('POP!', '#ff5fa2', "400 140px Brand, sans-serif"); scene.add(pop);
  const yrs = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); yrs.renderOrder = 31; scene.add(yrs);
  const yc = document.createElement('canvas'); yc.width = 512; yc.height = 220; const yg = yc.getContext('2d'); const yt = new THREE.CanvasTexture(yc); yt.colorSpace = THREE.SRGBColorSpace; yrs.material.map = yt; let lastY = -1;
  const drawY = (n) => { if (n === lastY) return; lastY = n; yg.clearRect(0, 0, 512, 220); yg.font = "400 130px Brand, sans-serif"; yg.textAlign = 'center'; yg.textBaseline = 'middle'; yg.lineWidth = 12; yg.strokeStyle = 'rgba(0,0,0,0.5)'; yg.strokeText(`${n} YRS`, 256, 115); yg.fillStyle = '#ffd23f'; yg.fillText(`${n} YRS`, 256, 115); yt.needsUpdate = true; };
  const checkT = canvasTex(128, 128, (g) => { g.fillStyle = '#2bb35a'; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(34, 66); g.lineTo(56, 88); g.lineTo(96, 42); g.stroke(); });
  const checks = [0, 1].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: checkT, transparent: true, depthTest: false, toneMapped: false })); s.renderOrder = 32; scene.add(s); return s; });
  const crackDots = []; for (let i = 0; i < 20; i++) { const s = glowSprite(0xff5a5a, 0.06); scene.add(s); crackDots.push(s); }
  const fx = { c1: burst(0xffd23f, 50, 1), pop: burst(0xff5fa2, 60, 2), fine: burst(0x5be37d, 60, 3) };
  Object.values(fx).forEach(f => scene.add(f));
  const myth = stamp('MYTH!', '#ff3b3b', 0.55); scene.add(myth);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      hero.root.position.set(0, 0, 0); hero.root.rotation.y = 0.25;
      hero.setPose(over(STAND(t), { neck: [0.12, 0.0, 0] })); hero.setMouth(t > 18.2 && t < 19.0 ? 0.3 : 0.06);
      scene.updateMatrixWorld(true);
      const chest = hero.j.chest.localToWorld(V(0, 0.12, 0.0));
      const fwd = V(Math.sin(0.25), 0, Math.cos(0.25));
      const ls = hero.j.lSh.getWorldPosition(V()), rs = hero.j.rSh.getWorldPosition(V());
      // phases: interlock push (0-2.4), relaxed show hands (2.4-7.3), pull finger (7.3-18), shake no (18-20.8), hands up (20.8+)
      const push = smooth(range(t, 0.2, 0.9)) * (1 - smooth(range(t, 1.9, 2.5)));
      const pull = smooth(range(t, 7.4, 8.0)) * (1 - smooth(range(t, 17.6, 18.2)));
      const stretch = smooth(range(t, 7.8, 9.8)) * (1 - smooth(range(t, 17.0, 17.4)));
      const show = smooth(range(t, 2.4, 3.0)) * (1 - smooth(range(t, 7.2, 7.6)));
      const hands = smooth(range(t, 23.9, 24.5));
      const front = chest.clone().addScaledVector(fwd, 0.25 + 0.2 * push).add(V(0, -0.12 + 0.05 * push, 0));
      const side = V(Math.cos(0.25), 0, -Math.sin(0.25));
      let lt = ls.clone().add(V(0.04, -0.55, 0.05)), rt2 = rs.clone().add(V(-0.04, -0.55, 0.05));
      const mix = (a, b, k) => a.clone().lerp(b, k);
      lt = mix(lt, front.clone().addScaledVector(side, 0.02), push); rt2 = mix(rt2, front.clone().addScaledVector(side, -0.02), push);
      const lShow = chest.clone().addScaledVector(fwd, 0.3).addScaledVector(side, 0.08).add(V(0, -0.05, 0));
      lt = mix(lt, lShow, Math.max(show, pull));
      rt2 = mix(rt2, lShow.clone().addScaledVector(side, -0.08 - 0.06 * stretch), pull);
      lt = mix(lt, ls.clone().add(V(0.2, 0.15, 0.25)), hands); rt2 = mix(rt2, rs.clone().add(V(-0.2, 0.15, 0.25)), hands);
      ikArm(hero, 'l', lt, ls.clone().add(V(0.3, -0.4, -0.2)), V(0, 0, 1));
      ikArm(hero, 'r', rt2, rs.clone().add(V(-0.3, -0.4, -0.2)), V(0, 0, 1));
      // doctor walks in
      const dk = smooth(range(t, 20.7, 21.9));
      doc.root.position.set(lerp(2.6, 0.85, dk), 0, -0.25); doc.root.rotation.y = lerp(-1.4, -0.35, dk);
      const walk = dk > 0.02 && dk < 0.98 ? Math.sin(t * 9) : 0;
      doc.setPose(over(STAND(t, 2), { lHip: [-0.4 * walk, 0, 0.07], rHip: [0.4 * walk, 0, -0.07], lKn: [0.3 * Math.max(0, walk), 0, 0], rKn: [0.3 * Math.max(0, -walk), 0, 0] }));
      doc.setMouth(0.06);
      scene.updateMatrixWorld(true);
      const dls = doc.j.lSh.getWorldPosition(V()), drs = doc.j.rSh.getWorldPosition(V());
      const dh = smooth(range(t, 22.3, 22.8));
      const crackDoc = t > 22.0 && t < 23.9 ? Math.sin(t * 10) * 0.04 : 0;
      ikArm(doc, 'l', mix(dls.clone().add(V(0.04, -0.55, 0.05)), dls.clone().add(V(0.15, 0.2 + crackDoc, 0.25)), dh), dls.clone().add(V(0.3, -0.4, -0.2)), V(0, 0, 1));
      ikArm(doc, 'r', mix(drs.clone().add(V(-0.04, -0.55, 0.05)), drs.clone().add(V(-0.15, 0.2, 0.25)), smooth(range(t, 24.2, 24.7))), drs.clone().add(V(-0.3, -0.4, -0.2)), V(0, 0, 1));
      scene.updateMatrixWorld(true);
      const lh = hero.j.lWr.localToWorld(V(0, -0.06, 0)), rh = hero.j.rWr.localToWorld(V(0, -0.06, 0));
      const hmid = lh.clone().lerp(rh, 0.5);
      const ck = easeOut(range(t, CRACK1, CRACK1 + 0.15)) * (1 - smooth(range(t, 2.1, 2.4)));
      crack.position.copy(hmid).add(V(0, 0.28, 0.1)); crack.scale.set(0.5 * ck, 0.25 * ck, 1); crack.visible = ck > 0.01;
      fx.c1.position.copy(hmid); fx.c1.update(t - CRACK1);
      const pk = easeOut(range(t, POP, POP + 0.15)) * (1 - smooth(range(t, 18.0, 18.3)));
      pop.position.copy(hmid).add(V(0.0, 0.25, 0.1)); pop.scale.set(0.42 * pk, 0.21 * pk, 1); pop.visible = pk > 0.01;
      fx.pop.position.copy(hmid); fx.pop.update(t - POP);
      // doctor: crack sparks on his left hand only, years counter, both hands fine
      const dlh = doc.j.lWr.localToWorld(V(0, -0.06, 0)), drh = doc.j.rWr.localToWorld(V(0, -0.06, 0));
      const cd = t > 22.2 && t < 23.9 ? 1 : 0;
      crackDots.forEach((s, i) => { const a = i * 2.4 + t * 3; s.position.copy(dlh).add(V(Math.cos(a) * 0.09, Math.sin(a * 1.3) * 0.09, 0.05)); s.material.opacity = cd * (0.5 + 0.5 * Math.sin(t * 20 + i)); s.visible = cd > 0; });
      const yk = easeOut(range(t, 22.7, 23.0)) * (1 - smooth(range(t, 24.3, 24.6)));
      drawY(Math.round(lerp(0, 60, easeOut(range(t, 22.8, 23.6)))));
      yrs.position.copy(doc.j.head.localToWorld(V(0, -0.35, 0.2))).add(V(-0.05, 0, 0.15)); yrs.scale.set(0.6 * yk, 0.26 * yk, 1); yrs.material.opacity = yk; yrs.visible = yk > 0.01;
      const fk = easeOut(range(t, 24.6, 24.85));
      checks[0].position.copy(dlh).add(V(0, 0.12, 0.05)); checks[1].position.copy(drh).add(V(0, 0.12, 0.05));
      checks.forEach(s => { s.scale.setScalar(0.12 * fk); s.visible = fk > 0.01; });
      fx.fine.position.copy(doc.j.head.localToWorld(V(0, 0.1, 0))); fx.fine.update(t - 24.6);
      // ---------- camera ----------
      const KEYS = [[0, [0.35, 1.35, 3.5], [0.05, 0.95, 0]], [2.4, [0.3, 1.35, 3.2], [0.05, 0.95, 0]], [18.0, [0.3, 1.35, 3.2], [0.05, 0.95, 0]], [20.6, [0.4, 1.35, 3.4], [0.1, 0.95, 0]], [22.0, [0.75, 1.4, 4.6], [0.45, 0.95, -0.1]], [26.8, [0.75, 1.4, 4.4], [0.45, 0.95, -0.1]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const sh = shake(t, 0.4 + ((t > CRACK1 && t < CRACK1 + 0.3) || (t > POP && t < POP + 0.3) ? 2.5 : 0), 2);
      place(c, [cp.x + sh[0], cp.y + sh[1], cp.z + sh[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const bk = easeOut(range(t, 2.6, 3.0)) * (1 - smooth(range(t, 17.9, 18.3)));
      if (bk > 0.01) {
        const cap = smooth(range(t, 3.4, 4.2)), fluid = smooth(range(t, 5.3, 6.2));
        const gap = smooth(range(t, 7.8, 9.8)) * (1 - smooth(range(t, 17.0, 17.4)) * 0.5);
        const press = t < 7 ? -1 : 0.85 - 0.65 * smooth(range(t, 10.8, 11.9));
        const gas = t < 14.3 ? 0 : t < POP ? easeOut(range(t, 14.3, 14.6)) * 0.7 : 0.7 + 0.3 * Math.sin((t - POP) * 25) * Math.exp(-(t - POP) * 5);
        drawB(cap, fluid, gap, press, gas, t);
      }
      bub.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.2).addScaledVector(rt, 0.18); bub.scale.setScalar(0.34 * bk); bub.material.opacity = bk; bub.visible = bk > 0.01;
      myth.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.2); myth.set(t > 19.6 ? easeOut(range(t, 19.6, 19.8)) * (1 - smooth(range(t, 20.6, 20.9))) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.45, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
