import * as THREE from 'three';
import { labelCam, loadKit, world, prop, person, label, showLabel, xray, ghost, keyCam, V } from './real.js';
import { CAPTIONS as CAPS, CAP_END } from './caps.js';

export const DURATION = 29.6;
export const CAPTIONS = CAPS.map(([s, w], i) => [s, w, i === CAPS.length - 1 ? CAP_END : undefined]);
export const FADES = [];
export const PRELOAD = (r) => loadKit(r, { models: ['GothicBed_01', 'ClassicNightstand_01', 'alarm_clock_01', 'WoodenTable_01', 'wine_bottles_01', 'baseball_01', 'street_rat'], hdris: ['hotel_room'], people: ['hero'] });

const sm = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const pulse = (t, at, w = 0.35) => Math.max(0, 1 - Math.abs(t - at) / w);

// brain drawn inside the x-ray circle. mode 0: microsleep (patches switch off), 1: cleaning (blue wave washes debris away)
function drawBrain(g, k, t, mode) {
  g.save(); g.translate(256, 262);
  g.beginPath(); g.ellipse(0, 0, 175, 130, 0, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(-10, -128); g.bezierCurveTo(-30, -40, 30, 20, -5, 128); g.stroke();
  for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(-150 + i * 50, -40 + (i % 2) * 70, 34, 0.3, 2.6); g.stroke(); }
  g.beginPath(); g.ellipse(90, 105, 55, 30, 0.2, 0, Math.PI * 2); g.stroke();
  if (mode === 0) {
    const regions = [[-90, -40], [60, -60], [-40, 50], [100, 30], [0, -10]];
    regions.forEach(([x, y], i) => {
      const on = Math.sin(t * 9 + i * 2.1) > (k > 0.5 ? -0.2 : 0.6);
      g.fillStyle = on ? 'rgba(255,214,74,0.85)' : 'rgba(20,20,30,0.95)';
      g.beginPath(); g.arc(x, y, 30, 0, Math.PI * 2); g.fill();
    });
  } else {
    const wx = -220 + 440 * k;
    const grd = g.createLinearGradient(wx - 120, 0, wx + 20, 0); grd.addColorStop(0, 'rgba(60,170,255,0)'); grd.addColorStop(1, 'rgba(60,170,255,0.75)');
    g.fillStyle = grd; g.beginPath(); g.ellipse(0, 0, 172, 127, 0, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 26; i++) {
      const x = -160 + ((i * 53) % 320), y = -95 + ((i * 37) % 190);
      if (x < wx - 30) continue;
      g.fillStyle = 'rgba(200,160,90,0.95)'; g.beginPath(); g.arc(x + (x < wx + 30 ? (wx + 30 - x) * 0.8 : 0), y, 7, 0, Math.PI * 2); g.fill();
    }
  }
  g.restore();
}

function build({ makeStage }) {
  const scene = world(makeStage({ shadowSize: 5, sunDir: [-2, 5, 3] }), 'hotel_room', { height: 1.6, radius: 9, sun: 0.9, env: 1.0 });
  const key = scene.userData.key;
  const bed = prop('GothicBed_01'); bed.position.set(-1.55, 0, -0.75); scene.add(bed);
  const stand = prop('ClassicNightstand_01'); stand.position.set(-0.45, 0, -1.55); scene.add(stand);
  const clock = prop('alarm_clock_01', 1.6); clock.position.set(-0.45, 0.7, -1.5); clock.rotation.y = 0.4; scene.add(clock);
  const table = prop('WoodenTable_01'); table.position.set(1.35, 0, -1.2); scene.add(table);
  const wine = prop('wine_bottles_01'); wine.position.set(1.0, 0.55, -1.2); scene.add(wine);
  const ball = prop('baseball_01', 1.4); scene.add(ball);
  // 11 clocks for the world record
  const clocks = []; for (let i = 0; i < 11; i++) { const c = prop('alarm_clock_01', 3); c.position.set(0.72 + (i % 6) * 0.25, 0.55, -1.0 - Math.floor(i / 6) * 0.3); c.rotation.y = -0.3; c.visible = false; scene.add(c); clocks.push(c); }
  const hero = person('hero'); scene.add(hero.root);
  // hallucinations (day 3): ghost rat + ghost double
  const grat = ghost(prop('street_rat', 7)); scene.add(grat);
  const gman = ghost(hero.root, 0xcfe8ff); scene.add(gman);
  const xr = xray(0.42); scene.add(xr);
  const L = { h24: label('24 HOURS', 0.75), drunk: label('LIKE DRUNK', 0.8), slow: label('SLOW REACTIONS', 0.8), mood: label('BAD MOOD', 0.75), day2: label('DAY 2', 0.6), micro: label('MICROSLEEP', 0.62), day3: label('DAY 3', 0.6), rec: label('WORLD RECORD', 0.9), d11: label('11 DAYS', 0.75), clean: label('BRAIN CLEANING', 0.62) };
  Object.values(L).forEach(l => scene.add(l));
  const cam = new THREE.PerspectiveCamera(38, 720 / 1280, 0.05, 200);
  // camera keys: full body wide -> head close (x-ray) -> wide (ghosts/record) -> bed
  const KEYS = [
    [0, [0.6, 1.25, 4.4], [-0.2, 0.95, -0.4]], [2.8, [0.5, 1.2, 3.7], [0.0, 0.95, -0.2]], [6.0, [0.4, 1.15, 3.6], [0.1, 0.9, -0.2]],
    [9.4, [0.4, 1.15, 3.6], [0.1, 0.9, -0.2]], [10.4, [0.35, 1.62, 1.55], [0.0, 1.55, 0]], [16.9, [0.35, 1.62, 1.55], [0.0, 1.55, 0]],
    [17.8, [1.1, 1.3, 4.6], [0.3, 0.85, -0.3]], [21.0, [1.1, 1.3, 4.6], [0.3, 0.85, -0.3]], [22.2, [1.3, 1.3, 3.7], [0.55, 0.8, -0.6]], [24.2, [1.3, 1.3, 3.7], [0.55, 0.8, -0.6]],
    [25.6, [0.5, 1.3, 3.8], [-0.2, 0.9, -0.3]], [26.8, [0.7, 2.2, 1.9], [-1.45, 0.65, -0.6]], [29.6, [0.5, 2.0, 1.5], [-1.5, 0.65, -0.7]],
  ];
  return {
    scene, camera: cam,
    update(t) {
      // ---------- hero ----------
      const lie = sm(26.0, 27.2, t);
      const tired = 0.35 + 0.3 * sm(3.0, 4.0, t) * (1 - sm(9.0, 9.6, t)) + 0.6 * sm(8.2, 8.8, t) * (1 - sm(9.4, 10.0, t));
      const drunk = sm(4.5, 5.0, t) * (1 - sm(6.0, 6.6, t));
      const reach = sm(7.25, 7.6, t) * (1 - sm(8.0, 8.4, t)); // late grab after the ball already landed
      const nod = Math.max(pulse(t, 12.1, 0.3), pulse(t, 13.25, 0.3), pulse(t, 16.65, 0.35)) * (1 - lie);
      const scared = sm(19.3, 19.6, t) * (1 - sm(20.6, 21.0, t));
      const shake = sm(24.6, 24.9, t) * (1 - sm(25.7, 26.0, t));
      hero.update(t, { idle: 1 - shake, headShake: shake }, 1, {
        slump: tired * (1 - reach) * (1 - scared) * (1 - lie), lookDown: 0.4 * sm(8.2, 8.8, t) * (1 - sm(9.4, 10.0, t)),
        point: reach, nod, flinch: scared, headTilt: drunk * Math.sin(t * 3) * 0.8,
      });
      hero.root.position.set(lerp(0, -1.55, lie), lerp(0, 0.6, lie), lerp(0, 0.1, lie));
      hero.root.rotation.set(-Math.PI / 2 * lie, 0, drunk * Math.sin(t * 2.6) * 0.07);
      // ---------- props ----------
      // ball drops past him at 6.4, lands 6.9, rolls
      const bt = t - 6.4; ball.visible = t > 6.3 && t < 9.5;
      const by = bt < 0.5 ? Math.max(0.07, 2.4 - 9.5 * bt * bt) : 0.07 + Math.abs(Math.sin((bt - 0.5) * 9)) * 0.12 * Math.exp(-(bt - 0.5) * 4);
      ball.position.set(0.45 + Math.max(0, bt - 0.5) * 0.4, by, 0.35); ball.rotation.x = bt * 6;
      clocks.forEach((c, i) => { const k = sm(22.6 + i * 0.12, 22.8 + i * 0.12, t) * (1 - sm(25.5, 25.8, t)); c.visible = k > 0.01; c.scale.setScalar(3 * Math.max(0.01, k)); });
      wine.visible = t < 22.4 || t > 26;
      // hallucinations
      const g1 = sm(18.6, 18.9, t) * (1 - sm(20.6, 21.0, t));
      grat.fade(g1); grat.position.set(lerp(1.3, -1.0, sm(18.6, 20.8, t)), 0, 0.7); grat.rotation.y = -Math.PI / 2 + Math.PI;
      const g2 = sm(19.4, 19.8, t) * (1 - sm(20.6, 21.0, t)); gman.fade(g2 * 0.8); gman.position.set(0.85, 0, -0.35); gman.rotation.y = -0.5;
      // night: room dims while he lies down
      key.intensity = 0.9 * (1 - 0.6 * lie); scene.environmentIntensity = 1.0 - 0.45 * lie;
      // ---------- camera ----------
      const k = keyCam(KEYS, t);
      cam.position.copy(k.pos); cam.lookAt(k.look); labelCam(cam);
      scene.updateMatrixWorld(true);
      const head = hero.headPos();
      // ---------- x-ray (brain) ----------
      const x1 = sm(10.6, 10.9, t) * (1 - sm(16.8, 17.1, t)), x2 = sm(26.6, 26.9, t);
      if (x1 > 0.01) xr.show(head.clone().add(V(0.21, 0.16, 0.1)), x1, (g, kk, tt) => drawBrain(g, kk, tt, 0), sm(11.3, 11.8, t), t);
      else if (x2 > 0.01) xr.show(head.clone().add(V(0.25, 0.35, 0.15)), x2, (g, kk, tt) => drawBrain(g, kk, tt, 1), sm(27.0, 29.2, t), t);
      else xr.visible = false;
      // ---------- labels ----------
      const up = (y) => V(0, y, 0);
      showLabel(L.h24, clock.position.clone().add(up(0.45)), t, 3.1, 5.0);
      showLabel(L.drunk, head.clone().add(up(0.3)), t, 5.25, 6.1);
      showLabel(L.slow, head.clone().add(V(0.22, 0.32, 0)), t, 6.9, 7.9);
      showLabel(L.mood, head.clone().add(up(0.3)), t, 8.3, 9.4);
      showLabel(L.day2, head.clone().add(V(-0.3, 0.32, 0)), t, 9.6, 10.6);
      showLabel(L.micro, head.clone().add(V(-0.22, 0.3, 0.1)), t, 15.9, 17.0);
      showLabel(L.day3, V(0.3, 2.05, -0.3), t, 17.5, 18.6);
      showLabel(L.rec, V(1.05, 1.35, -1.1), t, 21.2, 23.2);
      showLabel(L.d11, V(1.05, 1.15, -1.1), t, 23.3, 24.5);
      showLabel(L.clean, head.clone().add(V(-0.1, 0.72, 0.15)), t, 27.2, 29.6);
      return { bloom: 0.2, exposure: 1.0 - 0.2 * lie };
    },
  };
}
const lerp = (a, b, k) => a + (b - a) * k;
export const SHOTS = [{ start: 0, end: 99, build }];
