import * as THREE from 'three';
import { rng, glowTexture } from './textures.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const mesh = (geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => { const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); m.scale.set(...s); return m; };
const shadowAll = (g) => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

export function stars(n = 2500) {
  const r = rng(3), pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const v = V(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(250); pos.set([v.x, v.y, v.z], i * 3); const b = 0.6 + r() * 0.4; col.set([b, b, b * (0.9 + r() * 0.2)], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.4, sizeAttenuation: false, vertexColors: true, fog: false, toneMapped: false })); p.frustumCulled = false; return p;
}
export function earth(R = 80) {
  const t = canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#1f5fae'; g.fillRect(0, 0, w, h); const r = rng(8);
    for (let i = 0; i < 22; i++) { g.fillStyle = r() < 0.6 ? '#4f8f3a' : '#b89a5a'; g.beginPath(); const x = r() * w, y = 80 + r() * (h - 160); for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28, rr = 30 + r() * 70; k ? g.lineTo(x + Math.cos(a) * rr * 1.6, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr * 1.6, y + Math.sin(a) * rr); } g.fill(); }
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.4})`; g.beginPath(); g.ellipse(r() * w, r() * h, 30 + r() * 90, 8 + r() * 14, r() - 0.5, 0, 7); g.fill(); }
  });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(R, 64, 40), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 })));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.025, 64, 40), new THREE.MeshBasicMaterial({ color: 0x6fb8ff, transparent: true, opacity: 0.22, side: THREE.BackSide, blending: THREE.AdditiveBlending, fog: false })));
  return g;
}
// airlock wall facing +z with a door opening at x=0 (floor y=0), lit room behind
export function airlock() {
  const g = new THREE.Group(), hull = std(0xdfe3e8, { metalness: 0.4, roughness: 0.45 }), dark = std(0x5a6270, { metalness: 0.5, roughness: 0.5 });
  const panelT = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#e6e9ee'; x.fillRect(0, 0, w, h); x.strokeStyle = '#a9b0ba'; x.lineWidth = 4; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) x.strokeRect(i * 64 + 2, j * 64 + 2, 60, 60); x.fillStyle = '#9aa2ac'; for (let i = 0; i < 16; i++) { x.beginPath(); x.arc((i % 4) * 64 + 8, Math.floor(i / 4) * 64 + 8, 3, 0, 7); x.fill(); } });
  panelT.wrapS = panelT.wrapT = THREE.RepeatWrapping; panelT.repeat.set(3, 2);
  const pm = std(0xffffff, { map: panelT, metalness: 0.35, roughness: 0.5 });
  const W = 9, H = 6, dw = 1.3, dh = 2.25;
  g.add(mesh(new THREE.BoxGeometry((W - dw) / 2, H, 0.3), pm, [-(W + dw) / 4, H / 2 - 1.5, 0]));
  g.add(mesh(new THREE.BoxGeometry((W - dw) / 2, H, 0.3), pm, [(W + dw) / 4, H / 2 - 1.5, 0]));
  g.add(mesh(new THREE.BoxGeometry(dw, H - dh - 1.5, 0.3), pm, [0, dh + (H - dh - 1.5) / 2, 0]));
  g.add(mesh(new THREE.BoxGeometry(dw, 1.5, 0.3), pm, [0, -0.75, 0]));
  // door frame with warning stripes
  const stripe = canvasTex(256, 32, (x, w, h) => { for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#ffcc1a' : '#1a1a1a'; x.beginPath(); x.moveTo(i * 16, 0); x.lineTo(i * 16 + 16, 0); x.lineTo(i * 16, h); x.lineTo(i * 16 - 16, h); x.fill(); } });
  stripe.wrapS = THREE.RepeatWrapping; stripe.repeat.set(2, 1);
  const sm = std(0xffffff, { map: stripe });
  g.add(mesh(new THREE.BoxGeometry(dw + 0.3, 0.15, 0.4), sm, [0, dh + 0.075, 0.02]));
  g.add(mesh(new THREE.BoxGeometry(0.15, dh, 0.4), dark, [-dw / 2 - 0.075, dh / 2, 0.02]));
  g.add(mesh(new THREE.BoxGeometry(0.15, dh, 0.4), dark, [dw / 2 + 0.075, dh / 2, 0.02]));
  // the opened hatch, swung out
  const hatch = new THREE.Group(); hatch.position.set(-dw / 2 - 0.15, 0, 0.2); g.add(hatch);
  hatch.add(mesh(new THREE.BoxGeometry(dw, dh, 0.12), hull, [dw / 2, dh / 2, 0]));
  hatch.add(mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 24), dark, [dw / 2, dh / 2, 0.08]));
  hatch.rotation.y = -1.9;
  // room behind
  const room = new THREE.Group(); room.position.set(0, 0, -1.6); g.add(room);
  room.add(mesh(new THREE.BoxGeometry(2.6, 0.1, 3.0), dark, [0, -0.05, 0]));
  room.add(mesh(new THREE.BoxGeometry(2.6, 0.1, 3.0), pm, [0, 2.6, 0]));
  room.add(mesh(new THREE.BoxGeometry(0.1, 2.6, 3.0), pm, [-1.3, 1.3, 0]));
  room.add(mesh(new THREE.BoxGeometry(0.1, 2.6, 3.0), pm, [1.3, 1.3, 0]));
  room.add(mesh(new THREE.BoxGeometry(2.6, 2.6, 0.1), pm, [0, 1.3, -1.5]));
  const lightStrip = mesh(new THREE.BoxGeometry(1.8, 0.04, 0.12), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), [0, 2.54, 0]); room.add(lightStrip);
  const warn = mesh(new THREE.BoxGeometry(0.18, 0.18, 0.05), new THREE.MeshBasicMaterial({ color: 0xff3030, toneMapped: false }), [0.95, 2.1, -1.44]); room.add(warn);
  // station bits outside: solar panel arms
  const solar = canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#1a2a6a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#8aa0d8'; x.lineWidth = 2; for (let i = 0; i <= 16; i++) { x.beginPath(); x.moveTo(i * 16, 0); x.lineTo(i * 16, h); x.stroke(); } for (let j = 0; j <= 8; j++) { x.beginPath(); x.moveTo(0, j * 16); x.lineTo(w, j * 16); x.stroke(); } });
  for (const s of [1, -1]) {
    g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 5, 8), dark, [s * 7, 3.6, -1.0], [0, 0, Math.PI / 2]));
    g.add(mesh(new THREE.BoxGeometry(5.5, 0.05, 2.4), std(0xffffff, { map: solar, metalness: 0.6, roughness: 0.3 }), [s * 10.5, 3.6, -1.0]));
  }
  g.add(mesh(new THREE.CylinderGeometry(2.2, 2.2, 9, 32), pm, [0, 1.5, -3.6], [0, 0, Math.PI / 2]));
  shadowAll(g);
  g.userData = { warn, hatch };
  return g;
}
// glass helmet + backpack for the rescuer
export function suitUp(h) {
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.21, 28, 20), new THREE.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1, clearcoat: 1 }));
  helm.position.set(0, 0.08, 0.01); h.j.head.add(helm);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 10, 28), std(0xbfc6d0, { metalness: 0.6 })); ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.36, 0); h.j.chest.add(ring);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.22), std(0xe9edf2)); pack.position.set(0, 0.15, -0.22); h.j.chest.add(pack);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.06), std(0x2b6cff)); flag.position.set(0.17, 0.22, 0.14); h.j.chest.add(flag);
}
// dynamic HUD stopwatch + O2 bar
export function stopwatch() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 300; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false })); s.renderOrder = 31;
  let last = '';
  s.set = (sec, o2, col = '#ffffff') => {
    const k = `${sec}|${Math.round(o2 * 40)}|${col}`; if (k === last) return; last = k;
    g.clearRect(0, 0, 512, 300);
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 16;
    g.strokeStyle = col; g.lineWidth = 12; g.beginPath(); g.arc(110, 120, 70, 0, 7); g.stroke(); g.fillStyle = col; g.fillRect(98, 30, 24, 22);
    g.save(); g.translate(110, 120); g.rotate((sec % 60) / 60 * Math.PI * 2); g.fillRect(-4, -58, 8, 60); g.restore();
    g.fillStyle = col; g.font = "400 112px Brand, sans-serif"; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(`${sec}s`, 210, 122);
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.font = "400 40px Brand, sans-serif"; g.fillText('O₂', 34, 250);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.roundRect(100, 232, 370, 36, 18); g.fill();
    g.fillStyle = o2 > 0.5 ? '#5be37d' : o2 > 0.2 ? '#ffd166' : '#ff4a4a'; g.beginPath(); g.roundRect(100, 232, Math.max(18, 370 * o2), 36, 18); g.fill();
    t.needsUpdate = true;
  };
  s.set(0, 1); return s;
}
export function lungsTex(state = 'normal') {
  return canvasTex(512, 512, (g) => {
    const col = state === 'held' ? '#ff4a4a' : '#ff8fab';
    g.fillStyle = '#d6dde6'; g.fillRect(244, 70, 24, 150); g.fillRect(200, 210, 112, 18);
    for (const s of [-1, 1]) { g.fillStyle = col; g.beginPath(); g.ellipse(256 + s * 105, 300, state === 'held' ? 115 : 90, state === 'held' ? 175 : 150, s * 0.12, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.ellipse(256 + s * 85, 250, 25, 50, s * 0.2, 0, 7); g.fill(); }
  });
}
export function comic(text, fill = '#ffd23f', ink = '#ff3b1f') {
  const t = canvasTex(512, 512, (g) => {
    g.fillStyle = fill; g.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * 6.28, r = i % 2 ? 150 : 240; i ? g.lineTo(256 + Math.cos(a) * r, 256 + Math.sin(a) * r) : g.moveTo(256 + Math.cos(a) * r, 256 + Math.sin(a) * r); } g.closePath(); g.fill(); g.strokeStyle = ink; g.lineWidth = 12; g.stroke();
    g.fillStyle = ink; g.font = "400 130px Brand, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 262);
  });
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
}
export function suitIcon() {
  return canvasTex(512, 512, (g) => {
    g.fillStyle = '#e9edf2'; g.beginPath(); g.roundRect(160, 200, 192, 200, 40); g.fill();
    g.fillStyle = '#cfd6df'; g.beginPath(); g.arc(256, 150, 95, 0, 7); g.fill(); g.fillStyle = '#2b3a5a'; g.beginPath(); g.ellipse(256, 155, 65, 55, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.ellipse(230, 135, 18, 12, -0.5, 0, 7); g.fill();
    g.fillStyle = '#e9edf2'; g.beginPath(); g.roundRect(100, 210, 60, 150, 30); g.fill(); g.beginPath(); g.roundRect(352, 210, 60, 150, 30); g.fill();
    g.fillStyle = '#ff5a3a'; g.fillRect(220, 250, 72, 18);
  });
}
