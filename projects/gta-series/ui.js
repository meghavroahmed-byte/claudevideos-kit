// ui.js (video 2): no 2D overlay at all. Numbers and names are 3D labels in series.js.
drawFinish = function (g, i) { const v = g.createRadialGradient(W / 2, H * 0.5, H * 0.34, W / 2, H * 0.5, H * 0.82); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.3)'); g.fillStyle = v; g.fillRect(0, 0, W, H); g.save(); g.globalAlpha = 0.035; g.globalCompositeOperation = 'overlay'; g.drawImage(GRAIN[i % GRAIN.length], 0, 0, W, H); g.restore(); };
SCENE.ui = () => {};
