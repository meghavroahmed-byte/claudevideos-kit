// gta6ui.js: 2D overlay kept to the minimum the user allows: plain outlined counters (no box, no glass card,
// no stamps, no captions), mid-frame at the side. Everything else (people, labels, x-ray) is 3D in gta6.js.
const A = window.TL.ev;
const BN = s => String(s).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
drawFinish = function (g, i) {
  const v = g.createRadialGradient(W / 2, H * 0.5, H * 0.34, W / 2, H * 0.5, H * 0.82); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.3)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.035; g.globalCompositeOperation = 'overlay'; g.drawImage(GRAIN[i % GRAIN.length], 0, 0, W, H); g.restore();
};
// plain outlined counter text (white fill, thick dark outline), pops in, counts up
function counter(g, t, t0, t1, from, to, fmt, x, y, size = 120, col = '#ffffff') {
  if (t < t0 || t > t1) return; const k = back(clamp((t - t0) / 0.3)) * clamp((t1 - t) / 0.2); const v = lerp(from, to, eOut((t - t0) / 1.0));
  g.save(); g.translate(x, y); g.scale(k, k); g.font = `800 ${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = size * 0.2; g.strokeStyle = '#000'; g.strokeText(fmt(v), 0, 0); g.fillStyle = col; g.fillText(fmt(v), 0, 0); g.restore();
}
SCENE.ui = (g, t) => {
  const S = window.TL.st;
  counter(g, t, A.taka - 0.1, A.burj - 0.1, 0, 2000000000, v => '$' + Math.round(v).toLocaleString('en-US'), W / 2, 1180, 84);
  counter(g, t, A.b1, A.b2 - 0.05, 0, 1, v => '$' + BN(v.toFixed(0)) + ' বিলিয়ন', W / 2, 1240, 104);
  counter(g, t, A.b2, A.b3 - 0.05, 1, 1.5, v => '$' + BN(v.toFixed(1)) + ' বিলিয়ন', W / 2, 1240, 104);
  counter(g, t, A.b3, A.cmp - 0.1, 1.5, 2, v => '$' + BN(v.toFixed(0)) + ' বিলিয়ন', W / 2, 1240, 118, '#ffe27a');
  counter(g, t, A.inc, A.kolpona - 0.05, 0, 3, v => '$' + BN(v.toFixed(0)) + ' বিলিয়ন', W / 2, 1240, 118, '#b6ffcf');
  counter(g, t, A.labh, S.H[1], 0, 1, v => '$' + BN(v.toFixed(0)) + ' বিলিয়ন+', W / 2, 1240, 118, '#ffe27a');
};
