import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite } from './props.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { burst } from './rare.js';
import { stamp, world, tree } from './ancient.js';
import { textSprite } from './room.js';
import { rng } from './textures.js';

export const DURATION = 26.4;
export const CAPTIONS = [
  [0.0, 'Why do fingernails grow faster than toenails?'],
  [3.32, 'Your fingernails grow about'], [4.73, '3.5 millimeters a month'], [7.19, 'Your toenails?'], [8.36, 'Less than half that'],
  [9.85, 'Nails grow from a root under your skin'], [12.31, 'and that root loves a good blood supply'],
  [15.18, 'Your hands are closer to your heart'], [17.13, 'and you use them all day'], [18.91, 'Tapping, typing, and scratching'],
  [21.45, 'All that action helps your fingernails'], [23.32, 'grow more than twice as fast!', 26.2],
];
export const FADES = [];

const STAND = (t, ph = 0) => ({ lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07], chest: [Math.sin(t * 1.6 + ph) * 0.015, 0, 0], neck: [0.03, Math.sin(t * 0.5 + ph) * 0.12, 0] });
const over = (a, b) => Object.assign({}, a, b);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function oneTake({ makeStage }) {
  const scene = makeStage({ shadowSize: 7, sunDir: [-5, 5, 4], sun: 2.4 });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x4a8ad8); u.mid.value.set(0xa0c8f0); u.horizon.value.set(0xffd8a8); u.floorC.value.set(0x6aa04a);
  scene.fog = new THREE.Fog(0xf0dcc0, 25, 90);
  const hemi = scene.children.find(o => o.isHemisphereLight); hemi.intensity = 0.9;
  scene.userData.key.color.set(0xffe0b0);
  scene.add(world([]));
  // backyard deck
  const deckT = canvasTex(512, 512, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#b07a4a' : '#a46e40'; g.fillRect(0, i * 64, 512, 64); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, i * 64, 512, 3); } });
  deckT.wrapS = deckT.wrapT = THREE.RepeatWrapping; deckT.repeat.set(3, 3);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(6, 0.12, 4), new THREE.MeshStandardMaterial({ map: deckT, roughness: 0.8 })); deck.position.set(0, 0.06, -0.6); deck.receiveShadow = true; scene.add(deck);
  const fenceM = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.8 });
  for (let i = 0; i < 26; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.4, 0.04), fenceM); p.position.set(-5 + i * 0.4, 0.7, -3.4); scene.add(p); }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.08, 0.05), fenceM); rail.position.set(0, 1.1, -3.38); scene.add(rail);
  [[-3.8, -6], [3.5, -7], [6, -5]].forEach(([x, z], i) => { const tr = tree({ h: 4, seed: i + 90 }); tr.position.set(x, 0, z); scene.add(tr); });
  // stool + small table + laptop
  const wood = new THREE.MeshStandardMaterial({ color: 0x6a4a2e, roughness: 0.7 });
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 20), wood); stool.position.set(0, 0.6, -0.55); scene.add(stool);
  for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.5, 6), wood); const a = i / 3 * 6.283; l.position.set(Math.cos(a) * 0.15, 0.36, -0.55 + Math.sin(a) * 0.15); scene.add(l); }
  const table = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.4), wood); table.position.set(0.0, 0.75, 0.0); scene.add(table);
  for (const [x, z] of [[-0.26, -0.16], [0.26, -0.16], [-0.26, 0.16], [0.26, 0.16]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.03), wood); l.position.set(x, 0.43, z); scene.add(l); }
  const laptop = new THREE.Group(); laptop.position.set(0.0, 0.78, 0.02); scene.add(laptop);
  const lb = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.015, 0.23), new THREE.MeshStandardMaterial({ color: 0xc8ccd4, metalness: 0.6 })); laptop.add(lb);
  const ls = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.01), lb.material); ls.position.set(0, 0.11, 0.11); ls.rotation.x = -0.25; laptop.add(ls);
  const lscr = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.19), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, toneMapped: false })); lscr.position.set(0, 0.11, 0.104); lscr.rotation.set(-0.25, Math.PI, 0); laptop.add(lscr);
  laptop.visible = false; table.visible = false;
  // hero barefoot
  const hero = makeHuman('casual', { shirt: 0x2a9d8f, jeans: 0x34507a, chestText: 'MR. CLOUD' }); scene.add(hero.root);
  hero.root.traverse(o => { if (o.isMesh && o.material && o.material.color && o.material.color.getHex() === 0x2b2b30) { o.material = o.material.clone(); o.material.color.set(0xe8b896); } });
  // race bars (nail plates growing) - in world, beside hero
  const nailM = (col) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.25, metalness: 0.05 });
  const fn = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1, 0.03), nailM(0xffc0cc)); scene.add(fn);
  const tn = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1, 0.03), nailM(0xf0b8a8)); scene.add(tn);
  const fnL = textSprite('FINGER', '#ffffff', "400 90px Brand, sans-serif"); scene.add(fnL);
  const tnL = textSprite('TOE', '#ffffff', "400 90px Brand, sans-serif"); scene.add(tnL);
  // ruler bubble (finger vs toe nail per month)
  const zc = document.createElement('canvas'); zc.width = zc.height = 512; const zg = zc.getContext('2d'); const zt = new THREE.CanvasTexture(zc); zt.colorSpace = THREE.SRGBColorSpace;
  const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: zt, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); bub.renderOrder = 30; scene.add(bub);
  const drawR = (fg, tg, tt) => { zg.clearRect(0, 0, 512, 512); zg.save(); zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.clip(); zg.fillStyle = '#fff4e8'; zg.fillRect(0, 0, 512, 512);
    // finger (left) and toe (right) tips seen from above
    const tip = (x, w, len, grow, col) => { zg.fillStyle = '#e8b896'; zg.beginPath(); zg.roundRect(x - w / 2, 220, w, 300, w / 2); zg.fill(); zg.fillStyle = col; zg.beginPath(); zg.roundRect(x - w * 0.36, 250 - grow, w * 0.72, 110 + grow, w * 0.3); zg.fill(); zg.fillStyle = 'rgba(255,255,255,0.8)'; zg.fillRect(x - w * 0.36, 250 - grow, w * 0.72, 10); };
    tip(160, 110, 0, fg * 70, '#ffc0cc'); tip(360, 140, 0, tg * 70, '#f0b8a8');
    // rulers
    zg.fillStyle = '#ffd23f'; zg.fillRect(90, 120, 16, 160); zg.fillRect(270, 120, 16, 160); zg.fillStyle = '#222'; for (let i = 0; i < 9; i++) { zg.fillRect(90, 270 - i * 18, i % 4 === 0 ? 16 : 9, 3); zg.fillRect(270, 270 - i * 18, i % 4 === 0 ? 16 : 9, 3); }
    zg.font = "400 44px Brand, sans-serif"; zg.textAlign = 'center'; zg.lineWidth = 8; zg.strokeStyle = 'rgba(0,0,0,0.55)';
    if (fg > 0.05) { const s = `${(fg * 3.5).toFixed(1)} mm`; zg.strokeText(s, 160, 100); zg.fillStyle = '#ff5fa2'; zg.fillText(s, 160, 100); }
    if (tg > 0.05) { const s = `${(tg * 3.5).toFixed(1)} mm`; zg.strokeText(s, 360, 100); zg.fillStyle = '#ff8a3a'; zg.fillText(s, 360, 100); }
    zg.restore(); zg.strokeStyle = 'rgba(255,255,255,0.95)'; zg.lineWidth = 12; zg.beginPath(); zg.arc(256, 256, 240, 0, 7); zg.stroke(); zt.needsUpdate = true; };
  // nail root cross-section bubble
  const rc2 = document.createElement('canvas'); rc2.width = rc2.height = 512; const rg = rc2.getContext('2d'); const rtx = new THREE.CanvasTexture(rc2); rtx.colorSpace = THREE.SRGBColorSpace;
  const rootB = new THREE.Sprite(new THREE.SpriteMaterial({ map: rtx, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); rootB.renderOrder = 30; scene.add(rootB);
  const drawRoot = (root, blood, tt) => { rg.clearRect(0, 0, 512, 512); rg.save(); rg.beginPath(); rg.arc(256, 256, 240, 0, 7); rg.clip(); rg.fillStyle = '#cfe8ff'; rg.fillRect(0, 0, 512, 512);
    rg.fillStyle = '#e8b896'; rg.beginPath(); rg.moveTo(0, 200); rg.lineTo(380, 200); rg.quadraticCurveTo(470, 210, 470, 290); rg.quadraticCurveTo(470, 380, 380, 390); rg.lineTo(0, 390); rg.fill();
    rg.fillStyle = '#d89a7a'; rg.fillRect(0, 300, 420, 30);
    rg.fillStyle = '#ffc0cc'; rg.beginPath(); rg.roundRect(170, 180, 300, 26, 13); rg.fill();
    if (root > 0) { rg.fillStyle = `rgba(255,120,160,${root})`; rg.beginPath(); rg.ellipse(170, 215, 46, 24, 0, 0, 7); rg.fill(); rg.strokeStyle = `rgba(255,255,255,${root})`; rg.lineWidth = 5; rg.stroke(); }
    if (blood > 0) { rg.strokeStyle = `rgba(220,30,50,${blood})`; rg.lineWidth = 10; rg.beginPath(); rg.moveTo(0, 270); rg.bezierCurveTo(80, 250, 120, 280, 170, 235); rg.stroke(); for (let i = 0; i < 6; i++) { const u2 = (tt * 0.6 + i / 6) % 1; const x = u2 * 170, y = 270 - u2 * 35; rg.fillStyle = `rgba(255,60,80,${blood})`; rg.beginPath(); rg.arc(x, y, 9, 0, 7); rg.fill(); } }
    rg.restore(); rg.strokeStyle = 'rgba(255,255,255,0.95)'; rg.lineWidth = 12; rg.beginPath(); rg.arc(256, 256, 240, 0, 7); rg.stroke(); rtx.needsUpdate = true; };
  // heart + flow dots to hands and feet
  const heartT = canvasTex(128, 128, (g) => { g.fillStyle = '#ff3b5c'; g.beginPath(); g.moveTo(64, 112); g.bezierCurveTo(10, 70, 10, 20, 40, 20); g.bezierCurveTo(56, 20, 64, 34, 64, 40); g.bezierCurveTo(64, 34, 72, 20, 88, 20); g.bezierCurveTo(118, 20, 118, 70, 64, 112); g.fill(); });
  const heart = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartT, transparent: true, depthTest: false, toneMapped: false })); heart.renderOrder = 30; scene.add(heart);
  const flow = []; for (let i = 0; i < 28; i++) { const s = glowSprite(0xff3b5c, 0.07); s.material.depthTest = false; s.renderOrder = 29; scene.add(s); flow.push(s); }
  const words = ['TAP', 'TYPE', 'SCRATCH'].map(w => { const s = textSprite(w, '#ffd23f', "400 110px Brand, sans-serif"); scene.add(s); return s; });
  const fx = { win: burst(0xff5fa2, 60, 1) }; scene.add(fx.win);
  const st = stamp('2X FASTER!', '#ff5fa2', 0.6); scene.add(st);
  const c = cam(38);

  return {
    scene, camera: c,
    update(t) {
      // hero sits on the stool, barefoot
      hero.root.position.set(0, 0.12 + 0.03, -0.45); hero.root.rotation.y = 0.0;
      const work = smooth(range(t, 17.0, 17.6)) * (1 - smooth(range(t, 21.2, 21.8)));
      table.visible = laptop.visible = work > 0.01 || (t > 16.8 && t < 22);
      const sit = { drop: -0.45, lHip: [-1.45, 0, 0.12], lKn: [1.4, 0, 0], rHip: [-1.45, 0, -0.12], rKn: [1.4, 0, 0] };
      let pose = over(STAND(t), sit, { lSh: [0.1, 0, 0.15], rSh: [0.1, 0, -0.15], lEl: [-0.8, 0, 0], rEl: [-0.8, 0, 0] });
      // hook: holds hand up looking at nails
      const look = smooth(range(t, 0.1, 0.6)) * (1 - smooth(range(t, 2.8, 3.3)));
      pose = over(pose, { neck: [0.25 * look + 0.05, -0.2 * look, 0] });
      hero.setPose(pose); hero.setMouth(0.06);
      scene.updateMatrixWorld(true);
      const rs = hero.j.rSh.getWorldPosition(V()), lsw = hero.j.lSh.getWorldPosition(V()), head = hero.j.head.getWorldPosition(V());
      if (look > 0.01) { ikArm(hero, 'r', rs.clone().add(V(-0.05, -0.45, 0.2)).lerp(head.clone().add(V(0.12, -0.12, 0.3)), look), rs.clone().add(V(0.3, -0.3, 0)), V(0, 0, 1)); }
      // typing / tapping / scratching (17.3..21.4)
      if (work > 0.01) {
        const kb = laptop.position.clone().add(V(0, 0.02, -0.02));
        const tap = Math.sin(t * 18) * 0.015;
        const scratch = smooth(range(t, 20.1, 20.4)) * (1 - smooth(range(t, 21.0, 21.3)));
        ikArm(hero, 'l', lsw.clone().add(V(0.05, -0.45, 0.2)).lerp(kb.clone().add(V(0.08, 0.02 + tap, 0)), work), lsw.clone().add(V(0.3, -0.3, 0)), V(0, 0, 1));
        const rT = kb.clone().add(V(-0.08, 0.02 - tap, 0)).lerp(head.clone().add(V(-0.06, 0.14 + Math.sin(t * 20) * 0.03, 0.02)), scratch);
        ikArm(hero, 'r', rs.clone().add(V(-0.05, -0.45, 0.2)).lerp(rT, work), rs.clone().add(V(-0.3, -0.3, 0)), V(0, 0, 1));
      }
      scene.updateMatrixWorld(true);
      // race nails beside hero (hook + finale)
      const rk = Math.max(smooth(range(t, 0.3, 0.7)) * (1 - smooth(range(t, 3.0, 3.4))), smooth(range(t, 21.5, 22.0)));
      const growF = t < 4 ? 0.3 + 0.5 * range(t, 0.5, 3.0) : 0.3 + 0.9 * easeOut(range(t, 22.0, 24.6)), growT = t < 4 ? 0.3 + 0.22 * range(t, 0.5, 3.0) : 0.3 + 0.38 * easeOut(range(t, 22.0, 24.6));
      fn.scale.set(1, Math.max(0.001, growF * rk), 1); fn.position.set(0.5, 0.15 + growF * rk / 2, 0.3); fn.visible = rk > 0.01;
      tn.scale.set(1, Math.max(0.001, growT * rk), 1); tn.position.set(0.74, 0.15 + growT * rk / 2, 0.3); tn.visible = rk > 0.01;
      fnL.position.set(0.5, 0.06, 0.4); fnL.scale.set(0.5 * rk, 0.25 * rk, 1); fnL.visible = rk > 0.01; tnL.position.set(0.76, 0.06, 0.4); tnL.scale.set(0.5 * rk, 0.25 * rk, 1); tnL.visible = rk > 0.01;
      fx.win.position.set(0.5, 0.2 + growF, 0.3); fx.win.update(t - 24.6);
      // heart & flow (15.2..17.0)
      const hk = smooth(range(t, 15.2, 15.6)) * (1 - smooth(range(t, 17.6, 18.0)));
      const chest = hero.j.chest.localToWorld(V(0.05, 0.12, 0.12));
      heart.position.copy(chest); heart.scale.setScalar(0.12 * hk * (1 + 0.2 * Math.max(0, Math.sin(t * 9)))); heart.visible = hk > 0.01;
      const lh = hero.j.lWr.getWorldPosition(V()), rh = hero.j.rWr.getWorldPosition(V()), lf = hero.j.lAn.getWorldPosition(V()), rf = hero.j.rAn.getWorldPosition(V());
      const targets = [lh, rh, lf, rf];
      flow.forEach((s, i) => { const tg = targets[i % 4]; const near = i % 4 < 2; const u2 = ((Math.floor(i / 4) / 7) + t * (near ? 1.0 : 0.45)) % 1; s.position.copy(chest).lerp(tg, u2); s.material.opacity = hk * 0.9; s.visible = hk > 0.01; });
      // action words
      [[18.9, 19.5], [19.55, 20.15], [20.25, 21.2]].forEach(([a, b], i) => { const k = easeOut(range(t, a, a + 0.15)) * (1 - smooth(range(t, b, b + 0.15))); words[i].position.copy(head).add(V(0.42, 0.18, 0.1)); words[i].scale.set(0.5 * k, 0.25 * k, 1); words[i].visible = k > 0.01; });
      // ---------- camera ----------
      const KEYS = [[0, [0.8, 1.4, 3.6], [0.3, 0.75, -0.1]], [3.2, [0.5, 1.35, 3.0], [0.0, 0.72, -0.3]], [15.0, [0.5, 1.35, 3.0], [0.0, 0.72, -0.3]], [17.2, [0.7, 1.4, 2.9], [0.0, 0.78, -0.25]], [21.4, [0.8, 1.4, 3.6], [0.3, 0.75, -0.1]], [26.4, [0.8, 1.4, 3.5], [0.3, 0.75, -0.1]]];
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] < t) i++;
      const k = smooth(range(t, KEYS[i][0], KEYS[i + 1][0]));
      const cp = V(...KEYS[i][1]).lerp(V(...KEYS[i + 1][1]), k), lk = V(...KEYS[i][2]).lerp(V(...KEYS[i + 1][2]), k);
      const shk = shake(t, 0.35, 2);
      place(c, [cp.x + shk[0], cp.y + shk[1], cp.z + shk[2]], [lk.x, lk.y, lk.z]);
      c.updateMatrixWorld(true);
      const fw = V(); c.getWorldDirection(fw); const upv = V(0, 1, 0).applyQuaternion(c.quaternion), rt = V(1, 0, 0).applyQuaternion(c.quaternion);
      const bk = easeOut(range(t, 3.4, 3.8)) * (1 - smooth(range(t, 9.6, 10.0)));
      if (bk > 0.01) drawR(easeOut(range(t, 4.7, 6.3)), easeOut(range(t, 8.3, 9.3)) * 0.46, t);
      bub.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.02).addScaledVector(rt, 0.15); bub.scale.setScalar(0.42 * bk); bub.visible = bk > 0.01;
      const rb = easeOut(range(t, 9.9, 10.3)) * (1 - smooth(range(t, 14.9, 15.3)));
      if (rb > 0.01) drawRoot(smooth(range(t, 10.8, 11.4)), smooth(range(t, 13.5, 14.0)), t);
      rootB.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.02).addScaledVector(rt, 0.15); rootB.scale.setScalar(0.42 * rb); rootB.visible = rb > 0.01;
      st.position.copy(c.position).addScaledVector(fw, 2).addScaledVector(upv, -0.24); st.set(t > 24.6 ? easeOut(range(t, 24.6, 24.8)) : 0);
      return { dof: { focus: 4, aperture: 0, maxblur: 0 }, bloom: 0.35, exposure: 1.05 };
    },
  };
}
export const SHOTS = [{ start: 0, end: DURATION + 1, build: oneTake }];
