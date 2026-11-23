import * as THREE from 'three';
import { labelCam, loadKit, prop, fit, creature, person, label, showLabel, ghost, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 27.8;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/black_hole', 'sf/astronaut'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function build({ makeStage }) {
  const scene = makeStage({ shadowSize: 4, sunDir: [6, 3, 4], sun: 2.4 });
  scene.userData.sky.visible = false; scene.background = new THREE.Color(0x000004);
  scene.children.filter(o => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry').forEach(o => o.visible = false);
  scene.children.find(o => o.isHemisphereLight).intensity = 0.15; scene.environmentIntensity = 0.35;
  { const n = 3000, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, th = Math.random() * 6.283, r = 150; a[i * 3] = r * Math.sqrt(1 - u * u) * Math.cos(th); a[i * 3 + 1] = r * u; a[i * 3 + 2] = r * Math.sqrt(1 - u * u) * Math.sin(th); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3)); scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.3 }))); }
  const BH = V(0, -6, -70);
  const hole = creature('sf/black_hole', 70, 'max'); hole.root.position.copy(BH); hole.root.rotation.x = 0.35; scene.add(hole.root);
  const orange = new THREE.PointLight(0xff8a30, 400, 60, 1.2); orange.position.copy(BH).add(V(0, 4, 6)); scene.add(orange);
  const hero = person('hero'); scene.add(hero.root);
  const friend = fit(prop('sf/astronaut'), 1.9, 'y'); scene.add(friend);
  const frozen = ghost(hero.root, 0xff4030); scene.add(frozen);
  const pullArrows = []; for (let i = 0; i < 2; i++) { const a = new THREE.ArrowHelper(V(0, 0, -1), V(), 1, i ? 0xff3b30 : 0xffd24a, 0.25, 0.16); scene.add(a); pullArrows.push(a); }
  const dust = stream(800, 0xffb060, 0.08); dust.material.blending = THREE.AdditiveBlending; scene.add(dust);
  const L = { feet: label('STRONGER PULL ON FEET', 1.3), head: label('WEAKER ON HEAD', 1.0), stretch: label('STRETCHED', 0.9), spag: label('SPAGHETTIFICATION', 2.0), friendL: label('FRIEND FAR AWAY', 1.1), freeze: label('YOU SEEM TO FREEZE', 3.0), red: label('FADING RED', 2.4), time: label('YOUR TIME KEEPS GOING', 2.2), inside: label("NOBODY KNOWS WHAT'S INSIDE", 2.4) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 600);
  return {
    scene, camera: cam,
    update(t) {
      hole.play(t, 0, 0.6);
      // hero drifts toward the hole, feet first (rotated so feet point at it), and stretches
      const fall = sm(2.0, 26.0, t);
      const p = V(0, 1.0, 0).lerp(V(0, -1.0, -22), Math.pow(fall, 1.4));
      const stretch = 1 + 2.6 * sm(7.2, 12.6, t) + 2.0 * sm(20.6, 24.0, t);
      hero.update(t, { idle: 1 }, 0.4, { armsUp: 0.6 * sm(2.2, 3.0, t), flinch: 0.4 * sm(7.0, 7.6, t) });
      hero.root.position.copy(p); hero.root.rotation.set(-1.3 * sm(1.6, 3.6, t), 0, 0);
      hero.root.scale.set(1 / Math.sqrt(stretch), stretch, 1 / Math.sqrt(stretch));
      // friend far away (14 - 20): sees him freeze, red ghost at the edge
      friend.visible = t > 13.8 && t < 20.4; friend.position.set(3.2, -1.2, 9.0); friend.rotation.y = 0.6;
      const fk = sm(16.6, 17.2, t) * (1 - sm(20.0, 20.4, t)); frozen.fade(fk); frozen.position.set(-0.6, -0.2, -12); frozen.rotation.set(-1.3, 0, 0); frozen.scale.set(0.9, 1.4, 0.9);
      frozen.traverse(m => { if (m.isMesh) m.material.color.setRGB(1, 0.4 * (1 - sm(19.0, 20.0, t)), 0.2 * (1 - sm(19.0, 20.0, t))); });
      // camera
      let cp, lk;
      if (t < 13.8) { const fol = hero.root.position; cp = fol.clone().add(V(2.6, 1.0, 3.6 + 2 * sm(7, 12, t))); lk = fol.clone().add(V(0, 0, -1.5)); }
      else if (t < 20.4) { cp = V(5.2, 0.6, 13.0); lk = V(0.4, -0.6, -6); }
      else { const fol = hero.root.position; cp = fol.clone().add(V(1.4, 1.5, 4.0 - 1.5 * sm(24, 27.8, t))); lk = fol.clone().add(V(0, -0.6, -4)); }
      cam.position.copy(cp); cam.lookAt(lk); labelCam(cam);
      scene.updateMatrixWorld(true);
      const feet = hero.world('LeftFoot'), head = hero.headPos();
      const ak = t > 3.4 && t < 7.2; pullArrows.forEach((a, i) => { a.visible = ak; const o = i ? feet : head; a.position.copy(o); a.setDirection(BH.clone().sub(o).normalize()); a.setLength(i ? 1.3 : 0.45, 0.25, 0.16); });
      dust.update(BH.clone().add(V(-14, 3, 4)), V(1, -0.1, 0), 0, 27.8, t, 14, 6);
      const up = (y) => V(0, y, 0); const mid = feet.clone().lerp(head, 0.5);
      showLabel(L.feet, feet.clone().add(V(0.6, -0.2, 0)), t, 4.0, 5.9); showLabel(L.head, head.clone().add(V(0.6, 0.3, 0)), t, 5.9, 7.1);
      showLabel(L.stretch, mid.clone().add(V(0.9, 0, 0)), t, 7.4, 10.0); showLabel(L.spag, mid.clone().add(V(0.9, 0, 0)), t, 10.1, 13.8);
      showLabel(L.friendL, V(3.2, 1.1, 9.0), t, 14.2, 16.3); showLabel(L.freeze, frozen.position.clone().add(up(2.4)), t, 16.5, 19.0); showLabel(L.red, frozen.position.clone().add(up(2.4)), t, 19.1, 20.3);
      showLabel(L.time, head.clone().add(V(0.6, 0.6, 0)), t, 20.8, 24.3); showLabel(L.inside, hero.root.position.clone().add(V(0, 1.5, -2)), t, 24.6, 27.8);
      return { bloom: 0.6, exposure: 1.0 - 0.6 * sm(25.5, 27.8, t) };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
