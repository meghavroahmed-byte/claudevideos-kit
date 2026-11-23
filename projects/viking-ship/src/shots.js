import * as THREE from 'three';
import { labelCam, loadKit, world, prop, fit, texMat, person, label, showLabel, ghost, keyCam, stream, waterMat, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 27.2;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['sf/viking_ship', 'wooden_bucket_02', 'hamburger_buns'], hdris: ['kloofendal_48d_partly_cloudy_puresky'], people: ['hero', 'manuel', 'eric'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 8, sunDir: [-4, 8, 3] }), 'kloofendal_48d_partly_cloudy_puresky', { sky: false, sun: 1.8, env: 0.8 });
  scene.children.filter(o => o.material && o.material.isShadowMaterial).forEach(o => o.visible = false);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), waterMat(2.0, 0x7a98a8)); sea.rotation.x = -Math.PI / 2; scene.add(sea);
  const ship = prop('sf/viking_ship'); const rm = []; ship.traverse(m => { if (m.isMesh && /sail|rope|yard|rigging/i.test(m.name)) rm.push(m); }); rm.forEach(m => m.parent.remove(m)); const shipW = new THREE.Group(); shipW.add(ship); fit(shipW, 12, 'max'); const shipG = new THREE.Group(); shipG.add(shipW); scene.add(shipG);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.06, 9), new THREE.MeshStandardMaterial({ color: 0x6a4a30, roughness: 0.9 })); deck.position.y = 0.55; deck.visible = false;
  const crew = []; for (let i = 0; i < 10; i++) { const p = person(i % 2 ? 'manuel' : 'eric', { print: false }); shipG.add(p.root); crew.push(p); }
  const oars = []; for (let i = 0; i < 10; i++) { const o = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4, 8), new THREE.MeshStandardMaterial({ color: 0x8a6a40, roughness: 0.8 })); shipG.add(o); oars.push(o); }
  const skins = []; for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.8, 6, 6), new THREE.MeshStandardMaterial({ color: 0x6a4e34, roughness: 1, side: THREE.DoubleSide })); const p = s.geometry.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, Math.sin(p.getX(k) * 4) * 0.06 + Math.cos(p.getY(k) * 3) * 0.05); s.geometry.computeVertexNormals(); s.rotation.x = -Math.PI / 2; s.position.set((i % 2 ? 0.55 : -0.55), 0.75, -3 + Math.floor(i / 2) * 2.2); shipG.add(s); skins.push(s); }
  const hero = person('hero'); shipG.add(hero.root);
  const bucket = prop('wooden_bucket_02', 1); shipG.add(bucket);
  const food = new THREE.Group(); { const fish = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshStandardMaterial({ color: 0xa89068, roughness: 0.8 })); fish.scale.set(1, 0.4, 4); fish.position.set(-0.25, 0, 0); const meat = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.14), new THREE.MeshStandardMaterial({ color: 0x8a3a30, roughness: 0.7 })); meat.position.set(0.05, 0.03, 0); const bread = prop('hamburger_buns', 1.6); bread.position.set(0.28, 0, 0); food.add(fish, meat, bread); } shipG.add(food);
  const rain = stream(1200, 0xcfe0ee, 0.03); scene.add(rain);
  const spray = stream(300, 0xffffff, 0.06); scene.add(spray);
  const cols = ghost(fit(prop('sf/viking_ship'), 14, 'max'), 0xbfe6ff); scene.add(cols);
  const L = { cabin: label('NO CABINS', 0.8), beds: label('NO BEDS', 0.7), roof: label('NO ROOF', 0.7), row: label('ROWING SIDE BY SIDE', 1.4), sleep: label('SLEPT UNDER ANIMAL SKINS', 1.6), wet: label('SOAKING WET', 1.0), weeks: label('FOR WEEKS', 0.8), fish: label('DRIED FISH', 0.6), meat: label('SALTED MEAT', 0.6), bread: label('HARD BREAD', 0.6), toilet: label('TOILET = A BUCKET', 1.0), side: label('OR OVER THE SIDE!', 1.0), america: label('TO AMERICA', 4.0), cols: label('500 YEARS BEFORE COLUMBUS', 6.0) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(44, 720 / 1280, 0.05, 3000);
  const KEYS = [[0, [8, 5, 14], [0, 1, 0]], [2.4, [2.4, 2.4, 7.6], [0, 1.3, 3.6]], [5.8, [2.4, 2.4, 7.6], [0, 1.3, 3.6]], [6.4, [6, 4.5, 9], [0, 1, -1]], [8.4, [6, 4.5, 9], [0, 1, -1]], [9.0, [2.4, 3.2, 4.0], [0, 0.6, -1.2]], [11.8, [2.4, 3.2, 4.0], [0, 0.6, -1.2]],
    [12.4, [1.2, 2.0, 6.8], [0, 1.6, 4.3]], [16.4, [1.2, 2.0, 6.8], [0, 1.6, 4.3]], [17.0, [2.4, 2.2, 7.2], [0.2, 1.2, 4.0]], [20.2, [2.4, 2.2, 7.2], [0.2, 1.2, 4.0]], [21.0, [11, 5, 16], [0, 2, 0]], [27.2, [16, 8, 26], [0, 2, -6]]];
  return {
    scene, camera: cam,
    update(t) {
      sea.material.uniforms.time.value = t;
      const roll = Math.sin(t * 0.9) * 0.05, pitch = Math.sin(t * 0.7) * 0.03;
      shipG.position.set(0, -0.35 + Math.sin(t * 1.1) * 0.08, -t * 0.6 * (t < 21 ? 1 : 3)); shipG.rotation.set(pitch, 0, roll);
      const sleeping = t > 8.4 && t < 11.9;
      crew.forEach((c, i) => { const side = i % 2 ? 1 : -1, row = Math.floor(i / 2); const r = Math.sin(t * 2.4 + 0.0);
        c.update(t + i * 0.1, { idle: 1 }, 1, sleeping ? {} : { crouch: 0.75, point: 0.6 + 0.3 * r, pointL: 0.6 + 0.3 * r, lean: 0.3 + 0.25 * r });
        c.root.position.set(side * 0.55, sleeping ? 0.55 : 0.3, -3.5 + row * 1.6); c.root.rotation.set(sleeping ? -Math.PI / 2 : 0, sleeping ? 0 : Math.PI, 0);
        const o = oars[i]; o.visible = !sleeping; o.position.set(side * 1.5, 0.5, -3.5 + row * 1.6 + 0.3 * r); o.rotation.set(0.25 * r, 0, side * (Math.PI / 2 - 0.35)); });
      skins.forEach(s => s.visible = sleeping);
      const hold = sm(12.4, 12.8, t) * (1 - sm(16.4, 16.8, t));
      hero.update(t, { idle: 1 }, 1, { point: 0.8 * hold, handsBelly: 0.6 * sm(17.0, 17.4, t) * (1 - sm(18.4, 18.8, t)), lean: 0.6 * sm(18.8, 19.2, t) * (1 - sm(20.2, 20.6, t)), point2: 0 });
      hero.root.position.set(0.0, 0.45, 4.3); hero.root.rotation.y = t > 16.8 && t < 20.4 ? -Math.PI / 2 + 0.3 : 0;
      bucket.position.set(0.25, 0.3, 3.7); bucket.visible = t > 16.8;
      cols.fade(0); cols.position.set(-30, -0.35, -40); cols.rotation.y = 0.4;
      const k = keyCam(KEYS, t); cam.position.copy(k.pos).add(V(0, 0, shipG.position.z)); cam.lookAt(k.look.clone().add(V(0, 0, shipG.position.z))); labelCam(cam);
      scene.updateMatrixWorld(true);
      const hand = hero.world('RightHand'); food.visible = hold > 0.01; food.position.copy(hand).add(V(0, 0.05, 0.12)); food.quaternion.copy(cam.quaternion);
      rain.update(cam.position.clone().add(V(0, 6, -4)), V(0.1, -1, 0), 8.6, 12.0, t, 8, 8); spray.update(V(0, 0.6, shipG.position.z - 5.5), V(0, 1, -0.4), 6, 12, t, 2, 3);
      const head = hero.headPos(); const sz = shipG.position.z; const up = (y) => V(0, y, 0);
      showLabel(L.cabin, head.clone().add(up(0.4)), t, 2.8, 3.7); showLabel(L.beds, head.clone().add(up(0.4)), t, 3.8, 4.7); showLabel(L.roof, head.clone().add(up(0.4)), t, 4.8, 5.9);
      showLabel(L.row, V(0, 3.2, sz), t, 6.2, 8.4); showLabel(L.sleep, V(0, 2.4, sz - 1), t, 8.6, 10.8); showLabel(L.wet, V(0, 2.4, sz - 1), t, 10.9, 12.0);
      showLabel(L.weeks, head.clone().add(up(0.35)), t, 12.4, 13.5); const fp = food.position.clone().add(V(0, 0.2, 0)); showLabel(L.fish, fp.clone().add(V(-0.25, 0, 0)), t, 13.7, 16.4); showLabel(L.meat, fp.clone().add(V(0, 0.12, 0)), t, 14.4, 16.4); showLabel(L.bread, fp.clone().add(V(0.3, 0, 0)), t, 15.4, 16.4);
      showLabel(L.toilet, head.clone().add(up(0.4)), t, 17.0, 18.6); showLabel(L.side, head.clone().add(up(0.4)), t, 18.7, 20.4);
      showLabel(L.america, V(0, 8, sz), t, 21.6, 23.4); showLabel(L.cols, V(0, 8, sz), t, 23.6, 27.2);
      return { bloom: 0.2, exposure: 1.0 - 0.25 * (sleeping ? 1 : 0) };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
