import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 27.2;
export const CAPTIONS = [
  [0.0, 'Why do your ears pop on a plane?'],
  [2.53, 'Behind each eardrum'], [3.92, 'is a tiny pocket of air'],
  [6.04, 'As the plane climbs'], [7.4, 'the cabin air pressure drops'], [9.48, 'But the air behind your eardrum'], [11.12, 'stays the same'], [12.41, 'so your eardrum bulges outward'],
  [14.89, 'A thin tube connects that pocket'], [16.81, 'to the back of your throat'], [18.43, 'When you swallow or yawn'], [20.28, 'it opens and lets air through'],
  [22.29, 'Pop!'], [23.03, 'The pressure evens out'], [24.45, 'and you can hear clearly again', 27.0],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const SIT = { drop: -0.45, lHip: [-1.5, 0, 0.1], lKn: [1.45, 0, 0], rHip: [-1.5, 0, -0.1], rKn: [1.45, 0, 0], lEl: [-0.9, 0, 0], rEl: [-0.9, 0, 0] };
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const POP = 22.3;

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-4, 3, 1], sun: 1.2 });
  scene.userData.sky.visible = false; scene.background = new THREE.Color(0x1a2030); scene.fog = null;
  scene.children.filter(o => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry').forEach(o => o.visible = false);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.color.set(0xfff0e0); hemi.groundColor.set(0x5a5060); hemi.intensity = 0.95;
  const cabin = new THREE.Group(); scene.add(cabin);
  const wallM = new THREE.MeshStandardMaterial({ color: 0xf2f0ec, roughness: 0.7, side: THREE.BackSide });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 30, 40, 1, true), wallM); shell.rotation.x = Math.PI / 2; shell.position.set(0, 1.1, -6); cabin.add(shell);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 30), new THREE.MeshStandardMaterial({ color: 0x5a3a4a, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -6); cabin.add(floor);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 30), new THREE.MeshBasicMaterial({ color: 0xffe8d0, toneMapped: false })); strip.position.set(0, 2.62, -6); cabin.add(strip);
  for (const x of [-1.3, 1.3]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 30), new THREE.MeshStandardMaterial({ color: 0xf8f6f4 })); b.position.set(x, 2.25, -6); cabin.add(b); }
  const sunsetT = canvasTex(128, 192, (g) => { const gr = g.createLinearGradient(0, 0, 0, 192); gr.addColorStop(0, '#ff9a5a'); gr.addColorStop(0.6, '#ffd0a0'); gr.addColorStop(1, '#ffffff'); g.fillStyle = gr; g.beginPath(); g.roundRect(14, 14, 100, 164, 40); g.fill(); g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.ellipse(64, 150, 50, 14, 0, 0, 7); g.fill(); g.strokeStyle = '#c8ccd4'; g.lineWidth = 10; g.beginPath(); g.roundRect(14, 14, 100, 164, 40); g.stroke(); });
  for (const side of [-1, 1]) for (let i = 0; i < 14; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.38), new THREE.MeshBasicMaterial({ map: sunsetT, transparent: true, toneMapped: false })); w.position.set(side * 1.74, 1.42, 2.5 - i * 0.95); w.rotation.y = -side * Math.PI / 2; cabin.add(w); }
  const seatM = new THREE.MeshStandardMaterial({ color: 0xe0782a, roughness: 0.8 }), headM = new THREE.MeshStandardMaterial({ color: 0xf4f0e8 });
  const seat = (x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z); cabin.add(g); const base = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.46), seatM); base.position.y = 0.45; g.add(base); const back = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.75, 0.1), seatM); back.position.set(0, 0.85, -0.22); back.rotation.x = -0.1; g.add(back); const hd = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.11), headM); hd.position.set(0, 1.15, -0.25); g.add(hd); for (const ax of [-0.25, 0.25]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.4), new THREE.MeshStandardMaterial({ color: 0x5a5a64 })); arm.position.set(ax, 0.68, -0.02); g.add(arm); } return g; };
  for (let r = 0; r < 9; r++) { const z = -0.3 - r * 0.85; for (const x of [-1.3, -0.82, 0.82, 1.3]) seat(x, z); }
  const sunL = new THREE.PointLight(0xffa860, 6, 5, 1.3); sunL.position.set(-1.5, 1.4, 0.0); cabin.add(sunL);
  const fill = new THREE.PointLight(0xfff0e0, 5, 8, 1.2); fill.position.set(0.5, 2.3, 2.0); cabin.add(fill);
  const neighbour = makeHuman('casual', { shirt: 0x5a7a9a, jeans: 0x3a3a48, hair: 0x6a3a1a }); neighbour.root.position.set(-0.82, 0, -0.25); cabin.add(neighbour.root);
  const hero = makeHuman('casual', { shirt: 0x2a9d8f, jeans: 0x34507a, chestText: 'MR. CLOUD' }); hero.root.position.set(-1.3, 0, -0.25); cabin.add(hero.root);
  // ear bubble
  const zc = document.createElement('canvas'); zc.width = zc.height = 512; const zg = zc.getContext('2d'); const zt = new THREE.CanvasTexture(zc); zt.colorSpace = THREE.SRGBColorSpace;
  const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); bub.renderOrder = 30; scene.add(bub);
  const r9 = rng(5); const OUT = []; for (let i = 0; i < 22; i++) OUT.push({ x: 20 + r9() * 150, y: 190 + r9() * 120, ph: r9() * 6 }); const IN = []; for (let i = 0; i < 12; i++) IN.push({ x: 290 + r9() * 120, y: 200 + r9() * 100, ph: r9() * 6 });
  const drawE = (pocket, outAir, bulge, tube, open, flowK, waves, tt) => { zg.clearRect(0, 0, 512, 512); zg.save(); zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.clip();
    zg.fillStyle = '#f2c4a4'; zg.fillRect(0, 0, 512, 512);
    zg.fillStyle = '#fbe4d4'; zg.fillRect(0, 185, 250, 135);            // ear canal
    zg.fillStyle = `rgba(190,230,255,${0.4 + 0.6 * pocket})`; zg.beginPath(); zg.ellipse(350, 255, 95, 75, 0, 0, 7); zg.fill();   // middle-ear pocket
    if (tube > 0) { zg.strokeStyle = `rgba(255,214,63,${tube})`; zg.lineWidth = 26 + 14 * open; zg.lineCap = 'round'; zg.beginPath(); zg.moveTo(380, 320); zg.quadraticCurveTo(420, 420, 340, 520); zg.stroke(); if (open < 0.5) { zg.strokeStyle = `rgba(200,120,90,${tube})`; zg.lineWidth = 8; zg.beginPath(); zg.moveTo(388, 360); zg.lineTo(424, 360); zg.stroke(); } }
    // eardrum membrane (bulges toward the canal = left)
    zg.strokeStyle = '#ff7a8a'; zg.lineWidth = 12; zg.beginPath(); zg.moveTo(255, 180); zg.quadraticCurveTo(255 - bulge * 70, 255, 255, 330); zg.stroke();
    // air dots
    const nOut = Math.round(OUT.length * outAir);
    OUT.slice(0, nOut).forEach(d => { zg.fillStyle = '#5aa8ff'; zg.beginPath(); zg.arc(d.x + Math.sin(tt * 2 + d.ph) * 8, d.y + Math.cos(tt * 2 + d.ph) * 8, 8, 0, 7); zg.fill(); });
    IN.forEach((d, i) => { let x = d.x + Math.sin(tt * 2 + d.ph) * 6, y = d.y + Math.cos(tt * 2 + d.ph) * 6; if (flowK > 0 && i < 6) { const u2 = clamp(flowK * 1.4 - i * 0.08, 0, 1); x = lerp(x, 360 + Math.sin(u2 * 3) * 30, u2); y = lerp(y, 520, u2); } zg.fillStyle = '#2a7ad8'; zg.beginPath(); zg.arc(x, y, 8, 0, 7); zg.fill(); });
    if (waves > 0) { zg.strokeStyle = `rgba(90,200,120,${waves})`; zg.lineWidth = 7; for (let i = 0; i < 3; i++) { const r = ((tt * 90 + i * 40) % 120) + 20; zg.beginPath(); zg.arc(40, 255, r, -0.6, 0.6); zg.stroke(); } }
    zg.restore(); zg.strokeStyle = 'rgba(255,255,255,0.95)'; zg.lineWidth = 12; zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.stroke(); zt.needsUpdate = true; };
  const pop = textSprite('POP!', '#ff5fa2', "400 150px Brand, sans-serif"); scene.add(pop);
  const fx = { pop: burst(0xff5fa2, 60, 1) }; scene.add(fx.pop);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // plane climbs: tilt cabin nose-up 6..14, then level 23+
      const climb = smooth(range(t, 5.8, 7.8)) * (1 - smooth(range(t, 23.0, 25.0)));
      cabin.rotation.x = 0.07 * climb;
      const ache = Math.max(1 - smooth(range(t, 2.0, 2.5)), smooth(range(t, 12.4, 13.2)) * (1 - smooth(range(t, POP, POP + 0.4))));
      const swallow = Math.max(0, Math.sin(Math.PI * range(t, 18.6, 19.2)));
      const yawn = Math.max(0, Math.sin(Math.PI * range(t, 19.3, 20.8)));
      const happy = smooth(range(t, POP + 0.3, POP + 0.9));
      let hp = over(STAND(t), SIT, { neck: [0.05 - 0.15 * swallow - 0.35 * yawn, 0.15 * ache, 0.1 * ache] });
      hero.setPose(hp); hero.setMouth(Math.max(yawn, 0.25 * ache, 0.05));
      neighbour.setPose(over(STAND(t, 1), SIT, { neck: [0.25, -0.2, 0] })); neighbour.setMouth(0.05);
      scene.updateMatrixWorld(true);
      const ear = hero.j.head.localToWorld(V(0.11, 0.04, 0.0));
      const ls = hero.j.lSh.getWorldPosition(V()), rs = hero.j.rSh.getWorldPosition(V());
      if (ache > 0.01) { ikArm(hero, 'l', ls.clone().add(V(0.05, -0.4, 0.2)).lerp(ear.clone().add(V(0.04, -0.02, 0.0)), ache), ls.clone().add(V(0.45, -0.15, 0.35)), V(0, 0, 1)); }
      if (happy > 0.01) { ikArm(hero, 'r', rs.clone().add(V(-0.05, -0.4, 0.2)).lerp(rs.clone().add(V(-0.05, 0.05, 0.35)), happy), rs.clone().add(V(-0.3, -0.3, 0.0)), V(0, 0, 1)); }
      scene.updateMatrixWorld(true);
      const head = hero.j.head.getWorldPosition(V());
      const pk = easeOut(range(t, POP, POP + 0.15)) * (1 - smooth(range(t, POP + 1.0, POP + 1.3)));
      pop.position.copy(head).add(V(0.2, 0.3, 0.2)); pop.scale.set(0.45 * pk, 0.22 * pk, 1); pop.visible = pk > 0.01;
      fx.pop.position.copy(ear); fx.pop.update(t - POP);
      // ---------- camera ----------
      const KEYS = [[0, [-0.2, 1.6, 4.2], [-0.95, 0.75, -0.3]], [2.4, [-0.45, 1.55, 3.5], [-1.05, 0.75, -0.3]], [27.2, [-0.5, 1.55, 3.4], [-1.05, 0.75, -0.3]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      cp.applyAxisAngle(V(1, 0, 0), cabin.rotation.x); lk.applyAxisAngle(V(1, 0, 0), cabin.rotation.x);
      const shk = shake(t, 0.6 + climb * 0.8 + (Math.abs(t - POP) < 0.25 ? 2.5 : 0), 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const bk = easeOut(range(t, 2.6, 3.0)) * (1 - smooth(range(t, 26.3, 26.7)));
      if (bk > 0.01) {
        const pocket = smooth(range(t, 4.0, 4.8));
        const outAir = 1 - 0.65 * smooth(range(t, 7.6, 9.0)) * (1 - smooth(range(t, POP, POP + 0.6)));
        const bulge = smooth(range(t, 12.8, 13.8)) * (1 - smooth(range(t, POP, POP + 0.3)));
        const tube = smooth(range(t, 15.3, 15.9)); const open = smooth(range(t, 20.2, 20.6)) * (1 - smooth(range(t, POP + 0.4, POP + 1.0)));
        const flowK = range(t, 20.6, 22.2) * (t < POP + 1 ? 1 : 0);
        const waves = smooth(range(t, 24.6, 25.0));
        drawE(pocket, outAir, bulge, tube, open, flowK, waves, t);
      }
      bub.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.05).addScaledVector(rt, 0.14); bub.scale.setScalar(0.4 * bk); bub.visible = bk > 0.01;
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.35, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
