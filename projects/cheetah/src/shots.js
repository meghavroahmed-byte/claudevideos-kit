import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, texMat, person, label, showLabel, xray, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 23.2;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/cheetah', 'dead_tree_trunk'], hdris: ['rosendal_plains_2'], tex: ['sandy_gravel'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawTemp(g, k, t) {
  g.fillStyle = 'rgba(210,230,255,0.95)'; g.beginPath(); g.roundRect(226, 60, 60, 330, 30); g.fill(); g.beginPath(); g.arc(256, 410, 55, 0, 6.283); g.fill();
  g.fillStyle = k > 0.8 ? '#ff2020' : '#ff7a30'; const h = 300 * k; g.beginPath(); g.roundRect(240, 380 - h, 32, h + 20, 16); g.fill(); g.beginPath(); g.arc(256, 410, 42, 0, 6.283); g.fill();
  g.fillStyle = '#ffd24a'; g.font = '900 48px Cap, sans-serif'; g.textAlign = 'left'; g.fillText(`${Math.round(20 * k)} s`, 310, 260);
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 10, sunDir: [-5, 8, 4] }), 'rosendal_plains_2', { height: 3, radius: 90, sun: 2.3, sunColor: 0xfff0d0, env: 0.95 });
  const groundM = texMat('sandy_gravel', 10, 10, { color: 0xd8c8a0 }); const ground = new THREE.Mesh(new THREE.CircleGeometry(28, 48), groundM); ground.rotation.x = -Math.PI / 2; ground.position.y = 0.01; ground.receiveShadow = true; scene.add(ground);
  const cat = fit(prop('sf/cheetah'), 1.3, 'max'); cat.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(0xd8a862); m.material.roughness = 0.85; } }); const catG = new THREE.Group(); catG.add(cat); scene.add(catG);
  const hero = person('hero'); scene.add(hero.root);
  const bolt = person('hero', { print: false }); ghost(bolt.root, 0xbfe6ff, { inPlace: true }); bolt.root.traverse(m => { if (m.isMesh) m.material.blending = THREE.NormalBlending; }); scene.add(bolt.root);
  const dust = stream(400, 0xc8b490, 0.12); dust.material.opacity = 0.45; scene.add(dust);
  const heat = stream(200, 0xff6030, 0.06); heat.material.blending = THREE.AdditiveBlending; scene.add(heat);
  const xr = xray(1.2); scene.add(xr);
  const L = { no: label('NOT A CHANCE!', 2.4), kmh: label('100+ KM/H', 2.6), s3: label('IN 3 SECONDS', 2.0), human: label('FASTEST HUMAN: 44 KM/H', 1.8), hope: label('YOUR HOPE', 1.4), s20: label('ONLY ~20 SECONDS', 2.4), hot: label('OVERHEATS & STOPS', 2.4), head: label('HUGE HEAD START', 4.0), luck: label('GOOD LUCK!', 3.2) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(44, 720 / 1280, 0.05, 900);
  return {
    scene, camera: cam,
    update(t) {
      // everyone stays near the origin; the ground scrolls (hero runs at 6 m/s)
      groundM.map.offset.y = -t * 6 / 4; if (groundM.normalMap) groundM.normalMap.offset.y = groundM.map.offset.y;
      // cheetah position relative to hero (negative = ahead)
      let gap;
      if (t < 3.4) gap = 9; else if (t < 7.9) gap = lerp(9, 0.6, sm(3.4, 7.9, t)); else if (t < 11.0) gap = 0.4; else if (t < 16.0) gap = lerp(0.4, -6, sm(11.0, 16.0, t)); else gap = lerp(-6, 14, sm(16.0, 18.2, t));
      if (t > 18.2) gap = 14 + 8 * sm(18.2, 20, t);
      const showCat = !(t > 17.6);
      const heroZ = 0, catZ = heroZ + gap;
      hero.update(t, { run: 1 }, 1.25, {}); hero.root.position.set(0.8, 0, heroZ); hero.root.rotation.y = Math.PI;
      const tired = sm(16.4, 17.6, t); const gait = Math.sin(t * 16) * (1 - tired);
      catG.position.set(-0.6, Math.abs(gait) * 0.12, catZ); catG.rotation.set(0.08 * gait, Math.PI, 0); catG.scale.y = 1 - 0.25 * sm(16.8, 17.4, t); catG.visible = showCat;
      const bk = sm(8.0, 8.4, t) * (1 - sm(10.8, 11.2, t)); bolt.update(t, { run: 1 }, 1.25, {}); bolt.root.fade(0.75 * bk); bolt.root.position.set(2.0, 0, heroZ - 0.8); bolt.root.rotation.y = Math.PI;
      const lead = Math.min(0, gap); cam.position.set(2.2, 1.6, lead - 5.0); cam.lookAt(V(0, 0.8, lead + Math.max(0, Math.min(9, Math.abs(gap))) * 0.35)); labelCam(cam);
      scene.updateMatrixWorld(true);
      dust.update(catG.position.clone().add(V(0, 0.1, 0.6)), V(0, 0.5, 1), 3.4, 17.0, t, 2.5, 1.2);
      heat.update(catG.position.clone().add(V(0, 0.8, 0)), V(0, 1, 0), 14.0, 17.4, t, 0.6, 0.6);
      const xk = sm(12.8, 13.1, t) * (1 - sm(16.9, 17.2, t));
      if (xk > 0.01) xr.show(catG.position.clone().add(V(-1.0, 1.5, 0)), xk, drawTemp, sm(13.0, 16.4, t), t); else xr.visible = false;
      const cp = catG.position.clone().add(V(0, 1.4, 0)), hp = hero.headPos().add(V(0, 0.45, 0));
      showLabel(L.no, hp, t, 1.9, 3.3); showLabel(L.kmh, cp, t, 3.6, 6.1); showLabel(L.s3, cp, t, 6.2, 7.9); showLabel(L.human, hp.clone().add(V(0.4, 0, 0)), t, 8.0, 11.0);
      showLabel(L.hope, hp, t, 11.4, 12.5); showLabel(L.s20, cp, t, 12.6, 15.3); showLabel(L.hot, cp, t, 15.4, 17.4); showLabel(L.head, hp, t, 17.8, 21.0); showLabel(L.luck, hp, t, 21.2, 23.2);
      return { bloom: 0.2, exposure: 1.0 };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
