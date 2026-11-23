import * as THREE from 'three';
import { labelCam, loadKit, world, prop, person, label, showLabel, xray, keyCam, stream, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 25.8;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['GothicBed_01', 'ClassicNightstand_01', 'alarm_clock_01'], hdris: ['hotel_room'], people: ['hero'] });
const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;
function drawMel(g, k, t, blocked) { // brain releasing melatonin drops (or blocked)
  g.fillStyle = 'rgba(255,170,190,0.9)'; g.beginPath(); g.ellipse(256, 200, 150, 105, 0, 0, 6.283); g.fill();
  g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(256, 230, 18, 0, 6.283); g.fill(); // pineal gland
  const n = blocked ? Math.floor(8 * (1 - k)) : Math.floor(10 * k);
  g.fillStyle = '#9f8cff'; for (let i = 0; i < n; i++) { const y = 260 + ((t * 70 + i * 40) % 200); g.beginPath(); g.arc(200 + (i * 37) % 120, y, 12, 0, 6.283); g.fill(); }
  if (blocked) { g.strokeStyle = '#4aa8ff'; g.lineWidth = 12; g.beginPath(); g.moveTo(120, 380); g.lineTo(392, 380); g.stroke(); g.fillStyle = '#4aa8ff'; g.font = '900 34px Cap, sans-serif'; g.textAlign = 'center'; g.fillText('BLOCKED', 256, 440); }
  g.fillStyle = '#fff'; g.font = '900 30px Cap, sans-serif'; g.textAlign = 'left'; g.fillText('● MELATONIN', 40, 60);
}
function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-2, 5, 3] }), 'hotel_room', { height: 1.6, radius: 9, sun: 0.9, env: 1.0 });
  const key = scene.userData.key;
  const bed = prop('GothicBed_01'); bed.position.set(0, 0, -0.6); scene.add(bed);
  const stand = prop('ClassicNightstand_01'); stand.position.set(1.05, 0, -1.6); scene.add(stand);
  const clock = prop('alarm_clock_01', 1.8); clock.position.set(1.05, 0.7, -1.55); clock.rotation.y = -0.5; scene.add(clock);
  const phone = new THREE.Group(); { const body = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.155, 0.009), new THREE.MeshStandardMaterial({ color: 0x15171a, metalness: 0.6, roughness: 0.3 })); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.145), new THREE.MeshBasicMaterial({ color: 0x9fd4ff, toneMapped: false })); scr.position.z = 0.0051; phone.add(body, scr); phone.userData.scr = scr; } scene.add(phone);
  const glow = new THREE.PointLight(0x5aa8ff, 0, 2.5, 1.6); scene.add(glow);
  const blue = stream(220, 0x6ab8ff, 0.03); blue.material.blending = THREE.AdditiveBlending; scene.add(blue);
  const hero = person('hero'); scene.add(hero.root);
  const xr = xray(0.48); scene.add(xr);
  const L = { dark: label('DARK', 0.6), mel: label('MELATONIN', 0.85), time: label('"TIME TO SLEEP"', 1.0), bl: label('BLUE LIGHT', 0.9), day: label('= DAYTIME SKY', 1.0), held: label('MELATONIN HELD BACK', 1.3), awake: label('AWAKE LONGER', 1.0), worse: label('WORSE SLEEP', 0.9), hour: label('PHONE DOWN 1 HOUR BEFORE BED', 1.6) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(42, 720 / 1280, 0.05, 300);
  const KEYS = [[0, [1.6, 2.3, 2.4], [0, 1.0, -0.9]], [2.6, [1.1, 2.0, 1.4], [0, 1.1, -0.9]], [25.8, [1.1, 2.0, 1.4], [0, 1.1, -0.9]]];
  return {
    scene, camera: cam,
    update(t) {
      const dark = sm(2.9, 3.6, t), phoneOn = (t > 10.1 && t < 22.0) ? 1 : 0, putDown = sm(22.2, 23.2, t);
      key.intensity = lerp(0.9, 0.08, dark); scene.environmentIntensity = lerp(1.0, 0.1, dark);
      glow.intensity = 1.6 * phoneOn; phone.userData.scr.material.color.set(phoneOn ? 0x9fd4ff : 0x050608);
      // he lies in bed (rotated), arms up holding the phone over his face
      hero.update(t, { idle: 1 }, 0.5, { point: 0.95 * phoneOn * (1 - putDown), pointL: 0.95 * phoneOn * (1 - putDown) });
      hero.root.position.set(0.05, 0.5, 0.05); hero.root.rotation.set(-Math.PI / 2 + 0.42, 0, 0);
      const k = keyCam(KEYS, t); cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const hand = hero.world('RightHand').lerp(hero.world('LeftHand'), 0.5), head = hero.headPos();
      phone.visible = t > 9.6; const onStand = V(1.0, 0.72, -1.4);
      phone.position.copy(t < 10.1 ? onStand : hand.clone().add(V(0, 0.02, 0)).lerp(onStand, putDown)); phone.lookAt(t < 10.1 || putDown > 0.5 ? onStand.clone().add(V(0, 1, 0)) : head); 
      glow.position.copy(phone.position).add(V(0, 0.05, 0));
      blue.update(phone.position.clone(), head.clone().sub(phone.position).normalize(), 11.2, 14.2, t, 0.35, 0.1);
      const x1 = sm(4.4, 4.7, t) * (1 - sm(9.5, 9.8, t)), x2 = sm(14.5, 14.8, t) * (1 - sm(18.8, 19.1, t));
      if (x1 > 0.01) xr.show(head.clone().add(V(0.3, 0.42, 0)), x1, (g, a, tt) => drawMel(g, a, tt, false), sm(4.6, 7.0, t), t);
      else if (x2 > 0.01) xr.show(head.clone().add(V(0.3, 0.42, 0)), x2, (g, a, tt) => drawMel(g, a, tt, true), sm(15.0, 18.0, t), t); else xr.visible = false;
      const lp = head.clone().add(V(-0.25, 0.75, 0));
      showLabel(L.dark, lp, t, 3.2, 4.3); showLabel(L.mel, lp, t, 6.0, 7.5); showLabel(L.time, lp, t, 7.6, 9.9);
      showLabel(L.bl, lp, t, 11.3, 12.5); showLabel(L.day, lp, t, 12.6, 14.4); showLabel(L.held, lp, t, 17.0, 18.9);
      showLabel(L.awake, lp, t, 19.1, 20.3); showLabel(L.worse, lp, t, 20.4, 21.9); showLabel(L.hour, lp, t, 22.1, 25.8);
      return { bloom: 0.35, exposure: lerp(1.0, 0.85, dark) };
    },
  };
}
export const SHOTS = [{ start: 0, end: 99, build }];
