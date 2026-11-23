import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { burst } from './rare.js';
import { stamp } from './ancient.js';
import { textSprite } from './room.js';
import { rng, glowTexture } from './textures.js';

export const DURATION = 26.0;
export const CAPTIONS = [
  [0.0, 'What if you got lost in the desert?'],
  [2.34, 'In the day, the sand can heat up'], [4.22, 'to seventy degrees'], [5.91, "That's hot enough to fry an egg!"],
  [8.15, 'Your body sweats out'], [9.3, 'about a liter of water'], [10.71, 'every hour'], [11.66, 'just trying to stay cool'],
  [13.37, "So don't walk in the midday sun"], [15.56, 'Rest in the shade'], [16.69, 'and travel at night'], [17.67, "when it's cooler"],
  [18.9, 'And beware of mirages'], [20.66, 'That shimmering lake ahead?'], [21.83, "It's just light bending"], [23.64, 'over the hot sand', 25.8],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const walkP = (t, sp = 5, a = 0.45) => ({ lHip: [-a * Math.sin(t * sp), 0, 0.07], rHip: [a * Math.sin(t * sp), 0, -0.07], lKn: [0.6 * Math.max(0, Math.sin(t * sp + 1.2)), 0, 0], rKn: [0.6 * Math.max(0, -Math.sin(t * sp + 1.2)), 0, 0], lSh: [0.35 * Math.sin(t * sp), 0, 0.16], rSh: [-0.35 * Math.sin(t * sp), 0, -0.16] });

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 8, sunDir: [3, 9, 2], sun: 3.2 });
  const U = scene.userData.sky.material.uniforms;
  const DAY = { top: 0x2a8ae0, mid: 0x7ac2f0, hor: 0xffe8c0 }, NIGHT = { top: 0x050a24, mid: 0x0e1a44, hor: 0x2a2a5a };
  scene.fog = new THREE.Fog(0xf4dcb0, 30, 130);
  const hemi = scene.children.find(o => o.isHemisphereLight); const key = scene.userData.key;
  // dunes
  const sandT = canvasTex(512, 512, (g) => { g.fillStyle = '#e8b56a'; g.fillRect(0, 0, 512, 512); const r = rng(5); for (let i = 0; i < 3000; i++) { g.fillStyle = r() > 0.5 ? 'rgba(200,140,70,0.35)' : 'rgba(255,220,160,0.4)'; g.fillRect(r() * 512, r() * 512, 2, 2); } g.strokeStyle = 'rgba(190,130,60,0.25)'; g.lineWidth = 4; for (let i = 0; i < 26; i++) { g.beginPath(); g.moveTo(0, i * 20); g.bezierCurveTo(170, i * 20 + 12, 340, i * 20 - 12, 512, i * 20); g.stroke(); } });
  sandT.wrapS = sandT.wrapT = THREE.RepeatWrapping; sandT.repeat.set(30, 30);
  const geo = new THREE.PlaneGeometry(200, 200, 120, 120); const pa = geo.attributes.position;
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i); const d = Math.hypot(x, y + 1); const hgt = (Math.sin(x * 0.18) * Math.cos(y * 0.13) * 1.8 + Math.sin(x * 0.07 + y * 0.05) * 2.4) * smooth(clamp((d - 5) / 10, 0, 1)); pa.setZ(i, hgt); }
  geo.computeVertexNormals();
  const sand = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: sandT, roughness: 1 })); sand.rotation.x = -Math.PI / 2; sand.receiveShadow = true; scene.add(sand);
  scene.children.filter(o => o.isMesh && o !== sand && o.geometry && o.geometry.type === 'PlaneGeometry' && !o.material.isShadowMaterial).forEach(o => o.visible = false);
  // big rock (shade) + dead tree + bones
  const rockM = new THREE.MeshStandardMaterial({ color: 0xa8643a, flatShading: true, roughness: 1 });
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 1), rockM); rock.scale.set(1.4, 1.25, 1.0); rock.position.set(-3.0, 1.1, -2.3); rock.castShadow = true; scene.add(rock);
  const rock2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0), rockM); rock2.position.set(-1.7, 0.4, -2.9); rock2.castShadow = true; scene.add(rock2);
  const twig = new THREE.Group(); twig.position.set(2.2, 0, -2.6); scene.add(twig); const tm = new THREE.MeshStandardMaterial({ color: 0x6a4a2e }); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.4, 6), tm); tr.position.y = 0.7; tr.rotation.z = 0.15; twig.add(tr); for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.6, 5), tm); b.position.set(Math.cos(i * 1.6) * 0.15, 1.0 + i * 0.12, Math.sin(i * 1.6) * 0.15); b.rotation.set(Math.sin(i * 1.6) * 0.9, 0, -Math.cos(i * 1.6) * 0.9); twig.add(b); }
  // sun + moon + stars
  const sun = glowSprite(0xfff2b0, 16); sun.position.set(6, 30, -60); scene.add(sun);
  const sunCore = new THREE.Mesh(new THREE.SphereGeometry(2.6, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffffe0, toneMapped: false, fog: false })); sunCore.position.copy(sun.position); scene.add(sunCore);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(2.0, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf4f0d8, toneMapped: false, fog: false, transparent: true })); moon.position.set(-8, 24, -60); scene.add(moon);
  const NS = 900, sp = new Float32Array(NS * 3), r0 = rng(4);
  for (let i = 0; i < NS; i++) { const v = V(r0() - 0.5, Math.abs(r0() - 0.5) + 0.05, r0() - 0.5).normalize().multiplyScalar(90); sp[i * 3] = v.x; sp[i * 3 + 1] = v.y; sp[i * 3 + 2] = v.z; }
  const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(sgeo, new THREE.PointsMaterial({ size: 0.5, map: glowTexture(), color: 0xffffff, transparent: true, depthWrite: false, fog: false })); scene.add(stars);
  // hero (desert scarf)
  const hero = makeHuman('casual', { shirt: 0x2a9d8f, jeans: 0x8a6a4a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  const scarf = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd8542a, roughness: 0.9 })); scarf.position.y = 0.16; scarf.scale.set(1.05, 1.1, 1.1); scarf.visible = false; hero.j.head.add(scarf);
  hero.root.traverse(o => { if (o.isMesh && o.material.map && o.material.color && o.material.color.getHex() === 0xf4e4c8) {} });
  // egg
  const egg = new THREE.Group(); egg.position.set(0.5, 0.02, 0.45); egg.scale.setScalar(1.7); scene.add(egg);
  const white = new THREE.Mesh(new THREE.CircleGeometry(0.11, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true })); white.rotation.x = -Math.PI / 2; egg.add(white);
  const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 10), new THREE.MeshStandardMaterial({ color: 0xffb000, roughness: 0.4 })); yolk.scale.y = 0.5; yolk.position.y = 0.012; egg.add(yolk);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshStandardMaterial({ color: 0xf6efe0 })); shell.scale.set(0.8, 1.05, 0.8); scene.add(shell);
  const sizzle = []; for (let i = 0; i < 10; i++) { const s = glowSprite(0xffffff, 0.05); s.userData.ph = i / 10; scene.add(s); sizzle.push(s); }
  // heat shimmer streaks
  const heat = []; const hT = canvasTex(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,240,210,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); });
  for (let i = 0; i < 12; i++) { const h = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 1.2), new THREE.MeshBasicMaterial({ map: hT, transparent: true, depthWrite: false, side: THREE.DoubleSide })); h.userData = { x: (i - 6) * 0.5, z: -0.5 - (i % 3) * 0.8, ph: i * 0.7 }; scene.add(h); heat.push(h); }
  // thermometer (side)
  const tc = document.createElement('canvas'); tc.width = 160; tc.height = 512; const tg = tc.getContext('2d'); const tt2 = new THREE.CanvasTexture(tc); tt2.colorSpace = THREE.SRGBColorSpace;
  const thermo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tt2, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); thermo.renderOrder = 31; scene.add(thermo); let lastT = -1;
  const drawT = (v) => { const qv = Math.round(v); if (qv === lastT) return; lastT = qv; tg.clearRect(0, 0, 160, 512); tg.fillStyle = 'rgba(255,255,255,0.95)'; tg.beginPath(); tg.roundRect(55, 40, 50, 360, 25); tg.fill(); tg.beginPath(); tg.arc(80, 420, 48, 0, 7); tg.fill(); tg.fillStyle = '#ff3b1a'; tg.beginPath(); tg.arc(80, 420, 36, 0, 7); tg.fill(); const hh = 330 * qv / 75; tg.fillRect(67, 400 - hh, 26, hh + 10); tg.font = "400 44px Brand, sans-serif"; tg.textAlign = 'center'; tg.lineWidth = 6; tg.strokeStyle = 'rgba(0,0,0,0.6)'; tg.strokeText(`${qv}°C`, 80, 30 + 0); tg.fillStyle = '#fff'; tg.fillText(`${qv}°C`, 80, 30); tt2.needsUpdate = true; };
  // water bottle (1 L) draining
  const bc = document.createElement('canvas'); bc.width = 160; bc.height = 320; const bg = bc.getContext('2d'); const bt = new THREE.CanvasTexture(bc); bt.colorSpace = THREE.SRGBColorSpace;
  const bottle = new THREE.Sprite(new THREE.SpriteMaterial({ map: bt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); bottle.renderOrder = 31; scene.add(bottle); let lastB = -1;
  const drawB = (lvl) => { const qv = Math.round(lvl * 50); if (qv === lastB) return; lastB = qv; bg.clearRect(0, 0, 160, 320); bg.fillStyle = 'rgba(255,255,255,0.35)'; bg.strokeStyle = '#fff'; bg.lineWidth = 8; bg.beginPath(); bg.roundRect(30, 70, 100, 230, 22); bg.fill(); bg.stroke(); bg.fillStyle = '#39a0ff'; bg.fillRect(36, 70 + 224 * (1 - lvl), 88, 224 * lvl); bg.fillStyle = '#fff'; bg.fillRect(58, 30, 44, 40); bg.font = "400 52px Brand, sans-serif"; bg.textAlign = 'center'; bg.lineWidth = 5; bg.strokeStyle = 'rgba(0,0,0,0.5)'; bg.strokeText('1 L', 80, 200); bg.fillStyle = '#fff'; bg.fillText('1 L', 80, 200); bt.needsUpdate = true; };
  const sweat = []; for (let i = 0; i < 16; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshStandardMaterial({ color: 0x9fdcff, roughness: 0.05, transparent: true, opacity: 0.85 })); s.userData.ph = i / 16; scene.add(s); sweat.push(s); }
  // mirage lake + bending ray
  const lakeT = canvasTex(512, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(120,200,255,0)'); gr.addColorStop(0.4, 'rgba(110,190,255,0.85)'); gr.addColorStop(1, 'rgba(160,220,255,0.0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3; for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(40 + i * 40, 100 + i % 3 * 20); g.lineTo(90 + i * 40, 100 + i % 3 * 20); g.stroke(); } });
  const lake = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.8), new THREE.MeshBasicMaterial({ map: lakeT, transparent: true, depthWrite: false, fog: false })); lake.position.set(0.5, 0.5, -9); scene.add(lake);
  const rayDots = []; for (let i = 0; i < 26; i++) { const s = glowSprite(0xfff2a0, 0.12); scene.add(s); rayDots.push(s); }
  const fx = { egg: burst(0xffffff, 30, 1), vanish: burst(0x9fdcff, 60, 2) }; Object.values(fx).forEach(f => scene.add(f));
  const st = { noon: stamp('NOT AT NOON!', '#ff3b3b', 0.62) }; scene.add(st.noon);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // sky: day -> night (16.7..17.6) -> day (18.6..19.3)
      const night = smooth(range(t, 16.6, 17.5)) * (1 - smooth(range(t, 18.5, 19.3)));
      const lc = (a, b) => new THREE.Color(a).lerp(new THREE.Color(b), night);
      U.top.value.copy(lc(DAY.top, NIGHT.top)); U.mid.value.copy(lc(DAY.mid, NIGHT.mid)); U.horizon.value.copy(lc(DAY.hor, NIGHT.hor)); U.floorC.value.copy(lc(0xe8b56a, 0x2a2a44));
      scene.fog.color.copy(lc(0xf4dcb0, 0x141a3a));
      key.intensity = lerp(3.2, 0.5, night); key.color.copy(lc(0xfff2dd, 0x8aa0ff)); hemi.intensity = lerp(0.95, 0.35, night);
      sun.material.opacity = 1 - night; sunCore.visible = night < 0.6; moon.material.opacity = night; moon.visible = night > 0.05; stars.material.opacity = night; stars.visible = night > 0.05;
      // hero path: walk in, stand, walk to rock shade (14.6..15.9), sit, night walk, run to mirage
      const toRock = smooth(range(t, 14.6, 15.9)), nightWalk = smooth(range(t, 16.8, 18.6)), toLake = smooth(range(t, 20.6, 22.0));
      let hx = lerp(0.6 - 0.6 * smooth(range(t, 0, 2.2)), -1.6, toRock); let hz = lerp(0.3, -0.9, toRock);
      hx = lerp(hx, -0.2, nightWalk); hz = lerp(hz, -0.6, nightWalk); hz = lerp(hz, -1.6, toLake);
      const walking = t < 2.2 || (t > 14.6 && t < 15.9) || (t > 16.8 && t < 18.6) || (t > 20.6 && t < 22.0);
      const sit = smooth(range(t, 15.8, 16.3)) * (1 - smooth(range(t, 16.7, 17.1)));
      hero.root.position.set(hx, -0.45 * sit, hz);
      hero.root.rotation.y = toRock > 0 && toRock < 1 ? -Math.PI / 2 - 0.3 : nightWalk > 0 && nightWalk < 1 ? Math.PI * 0.75 : toLake > 0 ? Math.PI : 0.25;
      let pose = over(STAND(t), { spine: [0.18, 0, 0], neck: [0.2, 0, 0] });
      if (walking) pose = over(pose, walkP(t, t > 20.6 ? 9 : 5, t > 20.6 ? 0.7 : 0.45));
      if (sit > 0.01) pose = over(pose, { lHip: [-1.5 * sit, 0, 0.1], rHip: [-1.5 * sit, 0, -0.1], lKn: [1.45 * sit, 0, 0], rKn: [1.45 * sit, 0, 0] });
      const wipe = smooth(range(t, 11.6, 12.0)) * (1 - smooth(range(t, 12.9, 13.3)));
      if (wipe > 0.01) pose = over(pose, { rSh: [-2.3 * wipe, 0, -0.3], rEl: [-1.4 * wipe, 0, 0] });
      hero.setPose(pose); hero.setMouth(t > 21.9 && t < 23 ? 0.5 : 0.1);
      scene.updateMatrixWorld(true);
      // egg falls and fries
      const drop = range(t, 5.9, 6.25);
      shell.visible = t > 5.6 && t < 6.3; shell.position.set(0.5, lerp(1.4, 0.05, drop * drop), 0.45); shell.scale.set(1.4, 1.8, 1.4);
      const fry = smooth(range(t, 6.3, 7.6));
      egg.visible = t > 6.25 && t < 13.3; white.scale.setScalar(lerp(0.3, 1, easeOut(range(t, 6.25, 6.5)))); white.material.color.setRGB(1, 1, 1); white.material.opacity = 1; yolk.material.color.set(fry > 0.5 ? 0xffa000 : 0xffb000);
      white.material.color.lerp(new THREE.Color(0xf0d8b0), fry * 0.4);
      sizzle.forEach((s, i) => { const u2 = (t * 1.5 + s.userData.ph) % 1; s.position.copy(egg.position).add(V(Math.sin(i * 2.1) * 0.08, u2 * 0.35, Math.cos(i * 1.7) * 0.08)); s.material.opacity = (t > 6.3 && t < 9 ? 0.8 : 0) * (1 - u2); s.visible = t > 6.3 && t < 9; });
      fx.egg.position.copy(egg.position); fx.egg.update(t - 6.25);
      // heat shimmer
      const hk = (1 - night) * (smooth(range(t, 2.4, 3.2)) * (1 - smooth(range(t, 8.0, 8.8))) + smooth(range(t, 19.2, 20.0)));
      heat.forEach((h, i) => { h.position.set(h.userData.x + hx * 0.2, 0.6 + Math.sin(t * 2 + h.userData.ph) * 0.1, h.userData.z + hz); h.scale.x = 1 + 0.3 * Math.sin(t * 6 + i); h.material.opacity = hk * (0.5 + 0.5 * Math.sin(t * 4 + h.userData.ph)); h.visible = hk > 0.01; h.lookAt(c.position.x, h.position.y, c.position.z); });
      // sweat
      const swk = smooth(range(t, 8.3, 8.8)) * (1 - smooth(range(t, 13.0, 13.4)));
      const head = hero.j.head.getWorldPosition(V());
      sweat.forEach((s, i) => { const u2 = (t * 0.9 + s.userData.ph) % 1; s.position.copy(head).add(V(Math.sin(i * 2.3) * 0.13, 0.05 - u2 * 1.3, Math.cos(i * 1.9) * 0.1 + 0.05)); s.visible = swk > 0.01 && u2 < 0.95; });
      // mirage
      const mk = smooth(range(t, 20.4, 21.0)) * (1 - smooth(range(t, 22.0, 22.4)));
      lake.position.set(0.5, 0.45 + Math.sin(t * 3) * 0.03, -9 + hz * 0.0); lake.scale.y = 1 + 0.1 * Math.sin(t * 5); lake.material.opacity = mk * (0.8 + 0.2 * Math.sin(t * 9)); lake.visible = mk > 0.01;
      fx.vanish.position.set(0.5, 0.6, -8.5); fx.vanish.update(t - 22.1);
      // bending light ray: sky -> dips near sand -> up into eye
      const rk = smooth(range(t, 22.3, 22.8));
      const eye = hero.j.head.localToWorld(V(0, 0.08, 0.1)), P0 = V(0.8, 5.5, -9.5), P1 = V(0.6, 0.25, -5.5);
      rayDots.forEach((s, i) => { const u2 = i / (rayDots.length - 1); const a = P0.clone().lerp(P1, u2), b = P1.clone().lerp(eye, u2); const p = a.lerp(b, u2); const show = u2 <= ((t - 22.3) * 0.9 + 0.02); s.position.copy(p); s.material.opacity = rk * (show ? 1 : 0); s.visible = rk > 0.01 && show; });
      // ---------- camera ----------
      const KEYS = [[0, [1.9, 1.5, 5.2], [0.0, 1.1, -0.6]], [2.3, [1.6, 1.45, 4.2], [0.2, 0.85, 0.2]], [8.0, [1.4, 1.5, 4.0], [0.15, 1.05, 0.2]], [13.2, [1.4, 1.5, 4.2], [0.0, 1.0, 0.0]],
        [15.6, [0.6, 1.6, 4.4], [-1.1, 0.9, -0.6]], [16.7, [0.6, 1.6, 4.4], [-1.0, 0.9, -0.6]], [18.6, [1.2, 1.5, 3.8], [-0.2, 1.0, -0.6]], [20.4, [1.5, 1.7, 3.8], [0.1, 1.0, -2.0]], [22.3, [1.8, 1.7, 3.2], [0.2, 1.0, -2.4]], [26.0, [2.4, 2.4, 3.2], [0.3, 1.2, -3.6]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.4, 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const tk = easeOut(range(t, 3.2, 3.6)) * (1 - smooth(range(t, 7.9, 8.3)));
      drawT(lerp(30, 70, easeOut(range(t, 3.6, 5.2))));
      thermo.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, 0.0).addScaledVector(rt, 0.17); thermo.scale.set(0.15 * tk, 0.47 * tk, 1); thermo.visible = tk > 0.01;
      const bk = easeOut(range(t, 9.2, 9.6)) * (1 - smooth(range(t, 12.9, 13.3)));
      drawB(1 - smooth(range(t, 10.0, 12.4)));
      bottle.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.02).addScaledVector(rt, 0.17); bottle.scale.set(0.12 * bk, 0.24 * bk, 1); bottle.visible = bk > 0.01;
      st.noon.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); st.noon.set(t > 14.0 && t < 15.5 ? easeOut(range(t, 14.0, 14.2)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.4, exposure: lerp(1.0, 0.9, night) };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
