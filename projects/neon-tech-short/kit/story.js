// story.js: demo short for the Neon Tech kit ("Metro card tap korle ki hoy?").
// Copy this file per video: change CFG, CAM_KEYS, CAPS and the SCENE beats.
'use strict';

CFG.ep = 'EP 01 · TECH';
CFG.handle = 'your_handle';   // <- nijer Instagram/YouTube handle
CFG.duration = 24;

// One continuous camera move. No hard cuts: beats change what is on top of the same world.
CAM_KEYS = [
  { t: 0, x: -2, z: -6, yaw: 0.25, h: 7 },
  { t: 6.5, x: 1, z: 10, yaw: -0.15, h: 5.5 },
  { t: 12.5, x: 3, z: 24, yaw: 0.2, h: 9 },
  { t: 17.5, x: 0, z: 36, yaw: -0.1, h: 6 },
  { t: 24, x: -1, z: 48, yaw: 0.05, h: 7.5 },
];

// Captions: *yellow*  !pink!  "/" = line break.
CAPS = [
  { t0: 0.3, t1: 3.2, text: 'Card *tap* korlei / gate khule jay...' },
  { t0: 3.4, t1: 6.6, text: 'Kintu card-e to / !battery! nei!' },
  { t0: 6.8, t1: 10.0, text: 'Gate nijei pathay / *radio* signal' },
  { t0: 10.2, t1: 12.8, text: 'Somoy lage matro...' },
  { t0: 14.8, t1: 17.6, text: 'Shob check hoy / *offline*!' },
  { t0: 17.8, t1: 20.5, text: 'Comment koro:' },
  { t0: 20.7, t1: 24.0, text: 'Emon *tech secret* er jonno...', size: 70 },
];

SHAKES = [{ t: 12.9, amp: 22, dur: 0.5 }];

const ROUTE = [[-3, 0], [-1, 8], [2, 16], [1, 24], [4, 32], [2, 40], [0, 50], [-2, 60]];
const STATIONS = [[-1, 8], [1, 24], [2, 40]];

SCENE.world = (g, t) => {
  // metro line draws on across the whole video
  worldPath(g, ROUTE, clamp(0.12 + t / 20), 'rgba(255,255,255,0.9)', 5, 20);
  // stations: tower + pulsing ring
  STATIONS.forEach(([x, z], i) => {
    worldTower(g, x + 2.2, z, 3.2, i === 1 ? C.yellow : C.pink);
    const ph = (t * 0.7 + i * 0.33) % 1;
    worldRing(g, x, z, 1 + ph * 3, i === 1 ? C.yellow : C.cyan, 1 - ph, 3);
  });
  // the "train" dot runs along the route
  const [tx, tz] = pathPoint(ROUTE, clamp(t / 26));
  worldDot(g, tx, tz, C.yellow, 16);
  // radio waves beat
  if (t > 6.8 && t < 10.4) for (let k = 0; k < 3; k++) {
    const ph = ((t - 6.8) * 0.9 + k / 3) % 1;
    worldRing(g, tx, tz, 0.5 + ph * 4, C.cyan, (1 - ph) * win(t, 6.8, 10.4), 4);
  }
};

SCENE.ui = (g, t) => {
  // beat 1: card tap (glass card + "TAP" pill)
  withPop(g, t, 0.6, 3.3, W / 2, 1180, () => {
    glassCard(g, 250, 1020, 580, 330);
    label(g, 'Metro card', 290, 1070);
    g.font = `800 64px ${FONT}`; g.fillStyle = C.white; g.textAlign = 'left'; g.fillText('•••• 4821', 290, 1160);
    const tp = clamp((t - 1.4) / 0.3);
    pill(g, tp > 0.5 ? 'Gate OPEN' : 'Tap...', 290, 1270, tp > 0.5 ? C.green : C.yellow, { icon: true });
  });
  // beat 2: battery = 0
  withPop(g, t, 3.6, 6.7, W / 2, 1150, () => {
    glassCard(g, 300, 1010, 480, 260, { line: 'rgba(255,61,110,0.45)' });
    label(g, 'Card battery', 340, 1060);
    rr(g, 340, 1110, 300, 110, 18); g.strokeStyle = C.pink; g.lineWidth = 6; g.stroke();
    rr(g, 645, 1145, 18, 40, 6); g.fillStyle = C.pink; g.fill();
    g.font = `800 60px ${FONT}`; g.fillStyle = C.pink; g.textAlign = 'center'; g.fillText('0%', 490, 1168);
  });
  // beat 3: signal chip
  withPop(g, t, 7.2, 10.1, W / 2, 1300, () => {
    pill(g, 'NFC · 13.56 MHz', W / 2, 1300, C.cyan, { center: true, size: 34, icon: true });
  });
  // beat 4: big number
  withPop(g, t, 10.6, 12.9, W / 2, 1060, () => {
    glassCard(g, 230, 900, 620, 330);
    label(g, 'Tap → gate', 270, 950);
    bigNumber(g, t, 10.6, 1.2, 2, 0.3, v => v.toFixed(1) + ' s', W / 2, 1080);
    rr(g, 270, 1170, 540, 12, 6); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fill();
    rr(g, 270, 1170, 540 * eOut((t - 10.6) / 1.2), 12, 6); g.fillStyle = C.green; g.fill();
  });
  // beat 5: TWIST slam + flash
  slam3D(g, t, 12.9, 14.7, 'TWIST!');
  if (t > 12.9 && t < 13.2) { g.fillStyle = `rgba(255,240,200,${0.5 * (1 - (t - 12.9) / 0.3)})`; g.fillRect(0, 0, W, H); }
  // beat 6: offline checks
  withPop(g, t, 15.0, 17.7, W / 2, 1150, () => {
    glassCard(g, 200, 980, 680, 360);
    label(g, 'Gate memory', 240, 1030);
    const rows = [['Card ID 48213', C.green], ['Balance OK', C.green], ['Blacklist? Na', C.green]];
    rows.forEach(([s, c], i) => {
      const k = clamp((t - 15.4 - i * 0.35) / 0.25); if (!k) return;
      g.globalAlpha = k; pill(g, s, 240, 1100 + i * 80, c, { icon: true, size: 28 }); g.globalAlpha = 1;
    });
    ringGauge(g, t, 15.4, 1.2, 1, 760, 1210, 70);
  });
  // beat 7: comment card with typing
  withPop(g, t, 18.1, 20.6, W / 2, 760, () => {
    glassCard(g, 90, 640, 900, 230);
    g.fillStyle = C.yellow; g.beginPath(); g.arc(140, 694, 16, 0, 7); g.fill();
    label(g, 'Comment koro', 172, 694, C.yellow);
    const base = 'Amar daily station: ', ans = 'Esplanade!';
    const ty = typeText(t, 18.6, base + ans, 18);
    g.font = `700 46px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillStyle = C.white; const b = ty.slice(0, base.length); g.fillText(b, 140, 790);
    const bw = g.measureText(b).width;
    g.fillStyle = C.yellow; g.fillText(ty.slice(base.length), 140 + bw, 790);
    if (Math.floor(t * 3) % 2 === 0) { g.fillStyle = C.white; g.fillRect(140 + g.measureText(ty).width + 6, 765, 4, 50); }
  });
  // beat 8: FOLLOW CTA (only if CFG.cta)
  // + profile card + cursor click
  if (!CFG.cta) return;
  if (t > 21.2) {
    const k = clamp((t - 21.2) / 0.35);
    g.save(); g.globalAlpha = k; g.font = `800 ${lerp(150, 120, eOut(k))}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const gr = g.createLinearGradient(0, 550, 0, 640); gr.addColorStop(0, C.yellow2); gr.addColorStop(1, '#ffa812');
    g.fillStyle = gr; g.shadowColor = C.yellow; g.shadowBlur = 40; g.fillText('FOLLOW', W / 2, 600); g.restore();
  }
  withPop(g, t, 21.6, 24.5, W / 2, 1300, () => {
    glassCard(g, 170, 1200, 740, 200, { r: 100 });
    const ag = g.createLinearGradient(200, 1240, 320, 1360); ag.addColorStop(0, '#2b2f55'); ag.addColorStop(1, '#14172e');
    g.fillStyle = ag; g.beginPath(); g.arc(270, 1300, 62, 0, 7); g.fill(); g.strokeStyle = C.yellow; g.lineWidth = 4; g.stroke();
    g.font = `800 46px ${FONT}`; g.fillStyle = C.white; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(CFG.handle.slice(0, 2).toUpperCase(), 270, 1302);
    g.textAlign = 'left'; g.font = `700 38px ${FONT}`; g.fillText('@' + CFG.handle, 360, 1280);
    g.font = `500 26px ${FONT}`; g.fillStyle = C.dim; g.fillText('Daily tech · hidden secrets', 360, 1328);
    const clicked = t > 22.9;
    rr(g, 690, 1360, 180, 64, 32); g.fillStyle = clicked ? '#3a3f5c' : C.yellow; g.fill();
    g.font = `800 28px ${FONT}`; g.fillStyle = clicked ? C.white : '#1a1200'; g.textAlign = 'center';
    g.fillText(clicked ? 'Following' : 'Follow', 780, 1393);
    const mv = eOut((t - 22.0) / 0.8);
    cursorHand(g, lerp(980, 790, mv), lerp(1700, 1385, mv), clamp(1 - Math.abs(t - 22.9) / 0.12));
  });
};

boot();
