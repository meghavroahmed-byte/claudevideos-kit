// story3d.js: 3D demo short. Night train -> tower signal -> fly over the city -> scooter rider on a glowing route.
// Copy per video: change CFG, the camera keys, update() and SCENE.ui beats.
import * as N3 from './neon3d.js';
const { THREE } = N3;

CFG.ep = 'EP 01 · TECH';
CFG.handle = 'your_handle';
CFG.duration = 25;
CFG.captions = false;

const RIDE0 = 16.2, RIDE1 = 23.5;
const rideU = t => Math.max(0, Math.min(1, (t - RIDE0) / (RIDE1 - RIDE0)));
const rp = u => N3.ROUTE.getPointAt(u);
const behind = (u, back, up) => { const p = rp(u), q = rp(Math.min(1, u + 0.02)), d = q.clone().sub(p).normalize(); return [p.x - d.x * back, up, p.z - d.z * back]; };
const ahead = (u, f) => { const p = rp(u), q = rp(Math.min(1, u + 0.02)), d = q.clone().sub(p).normalize(); return [p.x + d.x * f, 1.2, p.z + d.z * f]; };

// one continuous camera move
N3.setCamKeys([
  { t: 0, p: [-16, 7, 80], l: [0, 2, 30] },
  { t: 3.6, p: [-14, 6.5, 100], l: [0, 2.5, 64] },
  { t: 6.2, p: [-10, 4.8, 84], l: [1, 2.6, 72] },
  { t: 8.4, p: [-14, 9, 100], l: [3, 3, 108] },
  { t: 11, p: [-18, 22, 120], l: [20, 14, 170] },
  { t: 13.4, p: [-6, 60, 250], l: [8, 0, 350] },
  { t: 15.6, p: [8, 105, 440], l: [12, 0, 560] },
  { t: 17.6, p: behind(rideU(17.6), 16, 22), l: ahead(rideU(17.6), 7) },
  { t: 20.6, p: behind(rideU(20.6), 16, 22), l: ahead(rideU(20.6), 7) },
  { t: 23.2, p: behind(rideU(23.2), 22, 30), l: ahead(rideU(23.2), 4) },
  { t: 25, p: behind(1, 36, 44), l: ahead(1, 0) },
]);

const towerTop = new THREE.Vector3(N3.TOWER.x, 34.6, N3.TOWER.z);
const r1 = N3.ring(N3.TOWER.x, N3.TOWER.z, 0x53e0ff), r2 = N3.ring(N3.TOWER.x, N3.TOWER.z, 0x53e0ff);
function update(t) {
  N3.TRAIN.position.z = N3.trainHead(Math.min(t, 15));
  const loco = new THREE.Vector3(0, 4.6, N3.TRAIN.position.z);
  N3.setBeam(loco, towerTop, Math.max(0, Math.min(1, (t - 8.6) / 0.4)) * Math.max(0, Math.min(1, (12.6 - t) / 0.5)) * 0.9);
  [r1, r2].forEach((r, i) => { const ph = (t * 0.6 + i * 0.5) % 1, k = t > 8 && t < 13 ? 1 : 0; r.scale.setScalar(2 + ph * 18); r.material.opacity = (1 - ph) * k; });
  N3.setRoute(Math.max(0, Math.min(1, (t - 14.6) / 2.2)));
  N3.riderAt(rideU(t));
  N3.PIN.position.y = 0.6 * Math.sin(t * 3);
}
// chase camera over the rider: smoothed direction so turns feel like a drone follow
const v3 = (a) => new THREE.Vector3(...a);
function chase(t) {
  const u = rideU(t), p = rp(u), a = rp(Math.max(0, u - 0.06)), b = rp(Math.min(1, u + 0.06));
  const d = b.clone().sub(a).setY(0).normalize();
  const up = 24 + 18 * clamp((t - 22.6) / 2.4), back = 15 + 12 * clamp((t - 22.6) / 2.4);
  const w = ease(clamp((t - 16.4) / 1.6));
  return { p: new THREE.Vector3(p.x - d.x * back, up, p.z - d.z * back), l: new THREE.Vector3(p.x + d.x * 6, 0, p.z + d.z * 6), w };
}
N3.hooks.cam = t => t > 16.4 ? chase(t) : null;
window.BG3D = t => N3.draw(t, update);

SHAKES = [{ t: 12.7, amp: 22, dur: 0.5 }];

SCENE.ui = (g, t) => {
  // 1: live train card
  withPop(g, t, 0.6, 3.9, W / 2, 1300, () => {
    glassCard(g, 190, 1170, 700, 260);
    rr(g, 230, 1210, 64, 64, 16); g.fillStyle = C.orange; g.fill();
    g.font = `800 34px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🚆', 262, 1244);
    g.textAlign = 'left'; g.font = `800 40px ${FONT}`; g.fillText('12841 Express', 316, 1232);
    label(g, 'Live status', 318, 1268, C.dim, 18);
    const late = Math.round(lerp(0, 18, eOut((t - 1.2) / 1.2)));
    pill(g, late + ' min late', 230, 1360, C.pink, { icon: true, size: 30 });
  });
  // 2: signal weak inside coach
  withPop(g, t, 4.4, 7.9, W / 2, 1320, () => {
    glassCard(g, 270, 1240, 540, 160, { line: 'rgba(255,61,110,0.5)' });
    for (let i = 0; i < 4; i++) { rr(g, 310 + i * 26, 1350 - i * 18 - 30, 18, 30 + i * 18, 4); g.fillStyle = i < 1 ? C.pink : 'rgba(255,255,255,0.15)'; g.fill(); }
    label(g, 'Coach-er bhitore', 430, 1290, C.dim, 18);
    g.font = `800 50px ${FONT}`; g.fillStyle = C.pink; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('SIGNAL: WEAK', 430, 1345);
  });
  // 3: tower id -> ok
  withPop(g, t, 8.8, 12.3, W / 2, 1400, () => {
    pill(g, 'Tower ID 30417', W / 2 - 190, 1400, C.cyan, { center: true, icon: true, size: 30 });
    const ok = t > 9.8;
    pill(g, ok ? 'Location ✓' : '...', W / 2 + 200, 1400, ok ? C.green : C.dim, { center: true, icon: true, size: 30 });
  });
  // 4: TWIST
  slam3D(g, t, 12.7, 14.6, 'TWIST!', H * 0.36);
  if (t > 12.7 && t < 13.0) { g.fillStyle = `rgba(255,240,200,${0.5 * (1 - (t - 12.7) / 0.3)})`; g.fillRect(0, 0, W, H); }
  // 5: big number over the city
  withPop(g, t, 14.8, 17.2, W / 2, 1450, () => {
    glassCard(g, 250, 1320, 580, 260);
    label(g, 'Shohore tower', 290, 1370);
    bigNumber(g, t, 14.8, 1.4, 0, 1240, v => Math.round(v).toLocaleString('en-IN') + '+', W / 2, 1480, 120);
  });
  // 6: rider ETA card
  withPop(g, t, 17.6, 21.0, W / 2, 1500, () => {
    glassCard(g, 180, 1400, 720, 200);
    label(g, 'Rider · route', 220, 1450);
    const km = lerp(2.4, 0.3, eOut((t - 17.6) / 3.2));
    g.font = `800 64px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = C.yellow;
    g.fillText(km.toFixed(1) + ' km', 220, 1530);
    pill(g, 'ETA ' + Math.max(1, Math.round(km * 4)) + ' min', 640, 1530, C.green, { center: true, size: 28, icon: true });
  });
  // 7: comment card
  withPop(g, t, 21.2, 23.0, W / 2, 1450, () => {
    glassCard(g, 90, 1340, 900, 220);
    g.fillStyle = C.yellow; g.beginPath(); g.arc(140, 1394, 16, 0, 7); g.fill();
    label(g, 'Comment koro', 172, 1394, C.yellow);
    const base = 'Tomar train koto late chilo? ', ans = '3 ghonta!';
    const ty = typeText(t, 21.5, base + ans, 26);
    g.font = `700 42px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillStyle = C.white; const b = ty.slice(0, base.length); g.fillText(b, 140, 1480);
    g.fillStyle = C.yellow; g.fillText(ty.slice(base.length), 140 + g.measureText(b).width, 1480);
  });
  // 8: FOLLOW CTA (only if CFG.cta)
  if (!CFG.cta) return;
  if (t > 23.0) {
    const k = clamp((t - 23.0) / 0.35);
    g.save(); g.globalAlpha = k; g.font = `800 ${lerp(150, 120, eOut(k))}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const gr = g.createLinearGradient(0, 420, 0, 520); gr.addColorStop(0, C.yellow2); gr.addColorStop(1, '#ffa812');
    g.fillStyle = gr; g.shadowColor = C.yellow; g.shadowBlur = 40; g.fillText('FOLLOW', W / 2, 470); g.restore();
  }
  withPop(g, t, 23.2, 25.5, W / 2, 1450, () => {
    glassCard(g, 170, 1350, 740, 200, { r: 100 });
    g.fillStyle = '#1d2140'; g.beginPath(); g.arc(270, 1450, 62, 0, 7); g.fill(); g.strokeStyle = C.yellow; g.lineWidth = 4; g.stroke();
    g.font = `800 46px ${FONT}`; g.fillStyle = C.white; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(CFG.handle.slice(0, 2).toUpperCase(), 270, 1452);
    g.textAlign = 'left'; g.font = `700 38px ${FONT}`; g.fillText('@' + CFG.handle, 360, 1430);
    g.font = `500 26px ${FONT}`; g.fillStyle = C.dim; g.fillText('Daily tech · hidden secrets', 360, 1478);
    const clicked = t > 24.4;
    rr(g, 690, 1510, 180, 64, 32); g.fillStyle = clicked ? '#3a3f5c' : C.yellow; g.fill();
    g.font = `800 28px ${FONT}`; g.fillStyle = clicked ? C.white : '#1a1200'; g.textAlign = 'center';
    g.fillText(clicked ? 'Following' : 'Follow', 780, 1543);
    const mv = eOut((t - 23.6) / 0.7);
    cursorHand(g, lerp(980, 790, mv), lerp(1800, 1535, mv), clamp(1 - Math.abs(t - 24.4) / 0.12));
  });
};

boot();
