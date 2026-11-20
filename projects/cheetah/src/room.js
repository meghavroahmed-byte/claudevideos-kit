import * as THREE from 'three';
import { rng, glowTexture } from './textures.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
const mesh = (geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => { const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); m.scale.set(...s); return m; };
const shadowAll = (g) => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

export function bedroom() {
  const g = new THREE.Group();
  const floorT = canvasTex(512, 512, (x, w, h) => { const r = rng(4); for (let i = 0; i < 8; i++) { x.fillStyle = `hsl(28, 35%, ${30 + r() * 8}%)`; x.fillRect(i * 64, 0, 64, h); x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 2; x.strokeRect(i * 64, 0, 64, h); for (let k = 0; k < 14; k++) { x.strokeStyle = `rgba(0,0,0,${0.05 + r() * 0.08})`; x.beginPath(); const xx = i * 64 + r() * 64; x.moveTo(xx, 0); x.bezierCurveTo(xx + 6, h / 3, xx - 6, h * 2 / 3, xx, h); x.stroke(); } } });
  floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(2, 2);
  const floor = mesh(new THREE.PlaneGeometry(7, 7), std(0xffffff, { map: floorT, roughness: 0.55 }), [0, 0, -0.2], [-Math.PI / 2, 0, 0]); floor.receiveShadow = true; g.add(floor);
  const wallT = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#3b4a6b'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,0.04)'; for (let i = 0; i < 16; i++) x.fillRect(i * 16, 0, 8, h); });
  wallT.wrapS = THREE.RepeatWrapping; wallT.repeat.set(4, 1);
  const wm = std(0xffffff, { map: wallT, roughness: 0.9 });
  g.add(mesh(new THREE.BoxGeometry(7, 3.2, 0.12), wm, [0, 1.6, -3.0]));
  g.add(mesh(new THREE.BoxGeometry(0.12, 3.2, 6.5), wm, [-3.3, 1.6, -0.2]));
  g.add(mesh(new THREE.BoxGeometry(0.12, 3.2, 6.5), wm, [3.3, 1.6, -0.2]));
  g.add(mesh(new THREE.BoxGeometry(7, 0.12, 0.14), std(0xe8e2d4), [0, 0.06, -2.93]));
  // window with night sky + moon
  const sky = canvasTex(256, 256, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0b1230'); gr.addColorStop(1, '#2a3a70'); x.fillStyle = gr; x.fillRect(0, 0, w, h); const r = rng(6); for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`; x.fillRect(r() * w, r() * h * 0.8, 1.5, 1.5); } x.fillStyle = '#fff7d6'; x.beginPath(); x.arc(170, 80, 34, 0, 7); x.fill(); x.fillStyle = '#16204a'; for (let i = 0; i < 6; i++) { x.fillRect(i * 46, h - 40 - (i * 37) % 50, 40, 60); } x.fillStyle = '#ffd36b'; for (let i = 0; i < 14; i++) x.fillRect((i * 53) % w, h - 30 + (i % 3) * 8, 5, 5); });
  g.add(mesh(new THREE.PlaneGeometry(1.5, 1.3), new THREE.MeshBasicMaterial({ map: sky }), [-0.6, 1.75, -2.93]));
  const fr = std(0xe8e2d4);
  for (const [w, h, x, y] of [[1.66, 0.08, -0.6, 2.44], [1.66, 0.08, -0.6, 1.06], [0.08, 1.46, -1.39, 1.75], [0.08, 1.46, 0.19, 1.75], [0.05, 1.3, -0.6, 1.75]]) g.add(mesh(new THREE.BoxGeometry(w, h, 0.06), fr, [x, y, -2.9]));
  // bed (right, headboard on back wall)
  const bed = new THREE.Group(); bed.position.set(1.75, 0, -1.75); g.add(bed);
  bed.add(mesh(new THREE.BoxGeometry(1.5, 0.3, 2.2), std(0x6b4a33), [0, 0.2, 0]));
  bed.add(mesh(new THREE.BoxGeometry(1.42, 0.2, 2.1), std(0xf2f0ea, { roughness: 0.9 }), [0, 0.45, 0]));
  bed.add(mesh(new THREE.BoxGeometry(1.5, 1.1, 0.1), std(0x6b4a33), [0, 0.65, -1.12]));
  bed.add(mesh(new THREE.CapsuleGeometry(0.12, 0.6, 6, 12), std(0xdfe6f2, { roughness: 0.95 }), [0, 0.62, -0.85], [0, 0, Math.PI / 2], [1, 1, 0.6]));
  const blanket = mesh(new THREE.BoxGeometry(1.46, 0.06, 1.35), std(0x3f6fb5, { roughness: 0.95 }), [0, 0.58, 0.35]); bed.add(blanket);
  // desk (left wall), chair, monitor
  const desk = new THREE.Group(); desk.position.set(-2.6, 0, -1.0); g.add(desk);
  desk.add(mesh(new THREE.BoxGeometry(0.8, 0.05, 1.6), std(0xd9c4a0), [0, 0.76, 0]));
  for (const [x, z] of [[-0.35, -0.75], [0.35, -0.75], [-0.35, 0.75], [0.35, 0.75]]) desk.add(mesh(new THREE.BoxGeometry(0.05, 0.76, 0.05), std(0x2b2b30), [x, 0.38, z]));
  const screenT = canvasTex(320, 200, (x, w, h) => { x.fillStyle = '#0e1726'; x.fillRect(0, 0, w, h); x.fillStyle = '#3ea0ff'; x.fillRect(14, 14, 150, 10); for (let i = 0; i < 9; i++) { x.fillStyle = ['#9ad46a', '#ffd166', '#ff7ab6', '#8ecbff'][i % 4]; x.fillRect(14 + (i % 3) * 16, 40 + i * 16, 60 + (i * 37) % 160, 7); } });
  const screen = mesh(new THREE.PlaneGeometry(0.9, 0.56), new THREE.MeshBasicMaterial({ map: screenT, toneMapped: false }), [-0.1, 1.15, 0], [0, Math.PI / 2, 0]); desk.add(screen);
  desk.add(mesh(new THREE.BoxGeometry(0.04, 0.6, 0.95), std(0x1a1a1e), [-0.13, 1.15, 0]));
  desk.add(mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), std(0x1a1a1e), [-0.15, 0.92, 0]));
  desk.add(mesh(new THREE.BoxGeometry(0.2, 0.02, 0.45), std(0x222228), [0.18, 0.79, 0]));
  const cans = [];
  for (let i = 0; i < 5; i++) { const c = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.13, 14), std([0x26c281, 0xff3b5c, 0x26c281, 0xffc233, 0xff3b5c][i], { metalness: 0.6, roughness: 0.3 }), [0.22 + (i % 2) * 0.1, 0.85, -0.6 + i * 0.09]); desk.add(c); cans.push(c); }
  const chair = new THREE.Group(); chair.position.set(-1.85, 0, -1.0); g.add(chair);
  chair.add(mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), std(0x2b2b30), [0, 0.48, 0]));
  chair.add(mesh(new THREE.BoxGeometry(0.06, 0.6, 0.5), std(0x2b2b30), [0.25, 0.8, 0]));
  chair.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), std(0x111111), [0, 0.24, 0]));
  // lamp + rug + nightstand
  g.add(mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.01, 40), std(0x8a5a7a, { roughness: 1 }), [0, 0.006, 0.2]));
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.5, 0.45), std(0x6b4a33), [0.7, 0.25, -2.55]));
  const shade = mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.2, 20, 1, true), std(0xffe2a8, { side: THREE.DoubleSide, emissive: 0xffb04a, emissiveIntensity: 0.6 }), [0.7, 0.8, -2.55]); g.add(shade);
  g.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8), std(0x333333), [0.7, 0.62, -2.55]));
  shadowAll(g); screen.castShadow = false;
  g.userData = { bed, blanket, screen, shade, cans, desk, chair };
  return g;
}
// wall display: DAY n + hh:mm, redrawn each frame
export function dayDisplay() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const grp = new THREE.Group();
  grp.add(mesh(new THREE.BoxGeometry(1.25, 0.66, 0.06), std(0x15151a, { roughness: 0.4 }), [0, 0, -0.03]));
  const face = mesh(new THREE.PlaneGeometry(1.15, 0.575), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); grp.add(face);
  let last = '';
  grp.set = (day, hhmm, col = '#ff4a4a') => {
    const k = day + hhmm + col; if (k === last) return; last = k;
    g.fillStyle = '#05060a'; g.fillRect(0, 0, 512, 256);
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.font = "400 56px Brand, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(day === '-' ? 'GOOD NIGHT' : 'AWAKE', 256, 62);
    g.fillStyle = col; g.font = "700 120px 'Cap', monospace"; g.fillText(hhmm, 256, 168);
    t.needsUpdate = true;
  };
  grp.set(1, '23:59'); return grp;
}
// x-ray brain bubble (dynamic): on[0..1] per lobe, wave 0..1 cleaning sweep
export function brainBubble() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })); sp.renderOrder = 20;
  const lobes = [[200, 230, 95, 70], [300, 215, 100, 75], [255, 300, 120, 60], [355, 300, 55, 45], [175, 315, 60, 45]];
  sp.draw = (on = [1, 1, 1, 1, 1], wave = -1, tt = 0) => {
    g.clearRect(0, 0, 512, 512);
    g.save(); g.beginPath(); g.arc(256, 256, 240, 0, 7); g.clip();
    g.fillStyle = 'rgba(10,18,40,0.88)'; g.fillRect(0, 0, 512, 512);
    // head silhouette
    g.fillStyle = 'rgba(120,170,255,0.18)'; g.beginPath(); g.ellipse(262, 255, 175, 190, 0, 0, 7); g.fill();
    lobes.forEach(([x, y, rx, ry], i) => {
      const k = on[i] ?? 1;
      g.fillStyle = `rgba(${Math.round(70 + 185 * k)},${Math.round(80 + 60 * k)},${Math.round(110 + 40 * k)},1)`;
      g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill();
      g.strokeStyle = `rgba(${Math.round(30 + 120 * k)},${Math.round(30 + 40 * k)},60,0.8)`; g.lineWidth = 5;
      for (let s = 0; s < 3; s++) { g.beginPath(); g.moveTo(x - rx * 0.7, y - ry * 0.3 + s * ry * 0.35); g.bezierCurveTo(x - rx * 0.2, y - ry * 0.6 + s * ry * 0.35, x + rx * 0.2, y + s * ry * 0.3, x + rx * 0.7, y - ry * 0.2 + s * ry * 0.35); g.stroke(); }
      if (k > 0.5) { g.fillStyle = `rgba(255,255,200,${(k - 0.5) * 0.9 * (0.6 + 0.4 * Math.sin(tt * 9 + i * 2))})`; g.beginPath(); g.arc(x + Math.sin(tt * 3 + i) * rx * 0.4, y, 7, 0, 7); g.fill(); }
    });
    if (wave >= 0) { // cleaning wave sweeping left -> right
      const x = -120 + wave * 760, gr = g.createLinearGradient(x - 110, 0, x + 40, 0);
      gr.addColorStop(0, 'rgba(80,180,255,0)'); gr.addColorStop(0.75, 'rgba(110,210,255,0.75)'); gr.addColorStop(1, 'rgba(200,240,255,0)');
      g.fillStyle = gr; g.fillRect(x - 110, 0, 150, 512);
      for (let i = 0; i < 14; i++) { const by = (i * 37 + tt * 120) % 512; g.fillStyle = 'rgba(220,245,255,0.8)'; g.beginPath(); g.arc(x - 30 + Math.sin(i * 3) * 30, by, 4 + (i % 3) * 2, 0, 7); g.fill(); }
      // gunk being cleared: dots that disappear behind the wave
      const r = rng(5); for (let i = 0; i < 40; i++) { const dx = 120 + r() * 280, dy = 170 + r() * 200; if (dx > x - 60) { g.fillStyle = 'rgba(150,120,60,0.85)'; g.beginPath(); g.arc(dx, dy, 4, 0, 7); g.fill(); } }
    }
    g.restore();
    g.strokeStyle = 'rgba(160,210,255,0.9)'; g.lineWidth = 10; g.beginPath(); g.arc(256, 256, 240, 0, 7); g.stroke();
    t.needsUpdate = true;
  };
  sp.draw(); return sp;
}
// translucent hallucinations
export function ghost(kind, col) {
  const t = canvasTex(256, 256, (g) => {
    g.shadowColor = col; g.shadowBlur = 24; g.fillStyle = col; g.strokeStyle = '#ffffff'; g.lineWidth = 5;
    if (kind === 'fish') { g.beginPath(); g.ellipse(120, 128, 80, 46, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(190, 128); g.lineTo(245, 80); g.lineTo(245, 176); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(80, 115, 12, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(78, 115, 6, 0, 7); g.fill(); }
    if (kind === 'jelly') { g.beginPath(); g.arc(128, 110, 75, Math.PI, 0); g.closePath(); g.fill(); g.strokeStyle = col; g.lineWidth = 8; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(70 + i * 29, 110); g.bezierCurveTo(60 + i * 29, 160, 85 + i * 29, 190, 70 + i * 29, 240); g.stroke(); } g.fillStyle = '#fff'; g.beginPath(); g.arc(105, 85, 9, 0, 7); g.arc(150, 85, 9, 0, 7); g.fill(); }
    if (kind === 'duck') { g.beginPath(); g.ellipse(120, 160, 85, 55, 0, 0, 7); g.fill(); g.beginPath(); g.arc(170, 85, 45, 0, 7); g.fill(); g.fillStyle = '#ffb02e'; g.beginPath(); g.moveTo(205, 85); g.lineTo(250, 95); g.lineTo(205, 105); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(180, 72, 10, 0, 7); g.fill(); }
    if (kind === 'eye') { g.beginPath(); g.ellipse(128, 128, 110, 60, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 42, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(128, 128, 20, 0, 7); g.fill(); }
  });
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
}
export function textSprite(text, col = '#ffffff', font = "400 120px Brand, sans-serif") {
  const t = canvasTex(512, 256, (g) => { g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.strokeText(text, 256, 128); g.fillStyle = col; g.fillText(text, 256, 128); });
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
}
export function cloud() {
  const g = new THREE.Group(), m = std(0x5d6470, { roughness: 1 }), r = rng(3);
  for (let i = 0; i < 7; i++) g.add(mesh(new THREE.SphereGeometry(0.14 + r() * 0.08, 14, 10), m, [(i - 3) * 0.1, (r() - 0.5) * 0.08, (r() - 0.5) * 0.1]));
  const drops = [];
  for (let i = 0; i < 14; i++) { const d = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.08, 4), new THREE.MeshBasicMaterial({ color: 0x8fc8ff, transparent: true }), [(r() - 0.5) * 0.6, -0.2, (r() - 0.5) * 0.2]); d.userData.ph = r(); g.add(d); drops.push(d); }
  g.update = (t) => drops.forEach(d => { const u = (t * 2.2 + d.userData.ph) % 1; d.position.y = -0.12 - u * 0.6; d.material.opacity = 1 - u; });
  return g;
}
