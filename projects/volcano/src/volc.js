import * as THREE from 'three';
import { rng, glowTexture } from './textures.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...o });
const mesh = (geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => { const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); m.scale.set(...s); return m; };
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

export function lavaLake(R = 13) {
  const r = rng(5), cells = [];
  for (let i = 0; i < 70; i++) cells.push([r() * 512, r() * 512]);
  const draw = (g, glow) => {
    g.fillStyle = glow ? '#000000' : '#2a1610'; g.fillRect(0, 0, 512, 512);
    // voronoi-ish crust plates separated by glowing cracks
    const img = g.getImageData(0, 0, 512, 512), d = img.data;
    for (let y = 0; y < 512; y += 1) for (let x = 0; x < 512; x += 1) {
      let a = 1e9, b = 1e9;
      for (const [cx, cy] of cells) { let dx = Math.abs(x - cx), dy = Math.abs(y - cy); dx = Math.min(dx, 512 - dx); dy = Math.min(dy, 512 - dy); const q = dx * dx + dy * dy; if (q < a) { b = a; a = q; } else if (q < b) b = q; }
      const e = Math.sqrt(b) - Math.sqrt(a), k = Math.max(0, 1 - e / 9), i = (y * 512 + x) * 4;
      if (glow) { d[i] = 255 * k; d[i + 1] = 120 * k * k; d[i + 2] = 20 * k * k * k; }
      else { const c = 0.12 + 0.05 * ((x * 7 + y * 13) % 5) / 5; d[i] = 255 * (c + k * 0.9); d[i + 1] = 255 * (c * 0.7 + k * k * 0.45); d[i + 2] = 255 * (c * 0.5 + k * k * k * 0.08); }
    }
    g.putImageData(img, 0, 0);
  };
  const map = canvasTex(512, 512, (g) => draw(g, false)), em = canvasTex(512, 512, (g) => draw(g, true));
  for (const t of [map, em]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 5); }
  const m = new THREE.Mesh(new THREE.CircleGeometry(R, 64), new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: 0xffffff, emissiveIntensity: 1.6, roughness: 0.6 }));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true;
  m.update = (t) => { map.offset.set(t * 0.004, t * 0.006); em.offset.copy(map.offset); m.material.emissiveIntensity = 1.5 + 0.25 * Math.sin(t * 2.1) + 0.15 * Math.sin(t * 5.3); };
  return m;
}
export function crater(R0 = 13) {
  const pts = [[R0 - 0.2, -0.3], [R0 + 0.5, 0.3], [R0 + 1.6, 2.5], [R0 + 2.4, 5.0], [R0 + 3.0, 7.5], [R0 + 3.3, 9.0], [R0 + 4.5, 9.3], [R0 + 6.5, 9.0], [R0 + 12, 6.5], [R0 + 25, 1.0]].map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(pts, 96); const p = geo.attributes.position, r = rng(9);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x); const n = 1 + 0.035 * Math.sin(a * 7 + y * 0.8) + 0.02 * Math.sin(a * 23 + y * 2.1); p.setX(i, x * n); p.setZ(i, z * n); p.setY(i, y + 0.25 * Math.sin(a * 11 + x * 0.3)); }
  geo.computeVertexNormals();
  const t = canvasTex(512, 512, (g) => { g.fillStyle = '#3a2f2a'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 900; i++) { const v = 30 + r() * 50 | 0; g.fillStyle = `rgba(${v + 20},${v + 8},${v},0.5)`; g.fillRect(r() * 512, r() * 512, 2 + r() * 10, 1 + r() * 4); } for (let i = 0; i < 30; i++) { g.strokeStyle = 'rgba(20,14,12,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, r() * 512); g.lineTo(512, r() * 512); g.stroke(); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 3);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, side: THREE.DoubleSide, flatShading: false }));
  m.receiveShadow = true; m.castShadow = true;
  return m;
}
export function boulder(s = 1, seed = 3) {
  const geo = new THREE.DodecahedronGeometry(0.5 * s, 1), p = geo.attributes.position, r = rng(seed), map = new Map();
  for (let i = 0; i < p.count; i++) { const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`; if (!map.has(k)) map.set(k, 1 + (r() - 0.5) * 0.35); const f = map.get(k); p.setXYZ(i, p.getX(i) * f, p.getY(i) * f * 0.8, p.getZ(i) * f); }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x5a4d45, roughness: 0.9, flatShading: true, emissive: 0xff4a10, emissiveIntensity: 0 }));
  m.castShadow = true; return m;
}
// dynamic thermometer HUD
export function thermo() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 300; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false })); s.renderOrder = 31;
  let last = -1;
  s.set = (deg) => {
    const v = Math.round(deg / 10) * 10; if (v === last) return; last = v;
    g.clearRect(0, 0, 512, 300);
    g.fillStyle = 'rgba(20,8,6,0.65)'; g.beginPath(); g.roundRect(6, 6, 500, 288, 40); g.fill(); g.strokeStyle = 'rgba(255,200,150,0.4)'; g.lineWidth = 4; g.stroke();
    const k = Math.min(1, deg / 1100);
    g.fillStyle = 'rgba(255,255,255,0.2)'; g.beginPath(); g.roundRect(54, 40, 40, 170, 20); g.fill(); g.beginPath(); g.arc(74, 230, 38, 0, 7); g.fill();
    const col = k < 0.4 ? '#ffd166' : k < 0.8 ? '#ff8a3d' : '#ff3b1f';
    g.fillStyle = col; g.beginPath(); g.arc(74, 230, 30, 0, 7); g.fill(); g.fillRect(62, 210 - 160 * k, 24, 160 * k + 10);
    g.font = "400 108px Brand, sans-serif"; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(`${v}°C`, 135, 150);
    t.needsUpdate = true;
  };
  s.set(20); return s;
}
// density bars: water 1 vs lava 3
export function densityChart() {
  const t = canvasTex(512, 420, (g) => {
    g.fillStyle = 'rgba(20,10,8,0.7)'; g.beginPath(); g.roundRect(6, 6, 500, 408, 40); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 4; g.stroke();
    g.font = "400 46px Brand, sans-serif"; g.textAlign = 'center'; g.fillStyle = '#ffffff';
    g.fillStyle = '#4aa8ff'; g.beginPath(); g.roundRect(90, 300 - 80, 120, 80, 14); g.fill();
    g.fillStyle = '#ff6a1a'; g.beginPath(); g.roundRect(300, 300 - 240, 120, 240, 14); g.fill();
    g.fillStyle = '#fff'; g.fillText('WATER', 150, 360); g.fillText('LAVA', 360, 360); g.font = "400 56px Brand, sans-serif"; g.fillText('1x', 150, 200); g.fillText('3x', 360, 45 + 0);
  });
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false }));
}
export function heatSuit(h) {
  const silver = new THREE.MeshStandardMaterial({ color: 0xd9dde2, metalness: 0.85, roughness: 0.25 });
  h.root.traverse(o => { if (o.isMesh && (o.material === h.shirt || o.material.color?.getHex?.() === 0xd8dde3)) o.material = silver; });
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 18), silver); hood.scale.set(1, 1.15, 1.05); hood.position.set(0, 0.1, -0.005); h.j.head.add(hood);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.192, 24, 12, -0.9, 1.8, 1.0, 0.9), new THREE.MeshStandardMaterial({ color: 0xffb020, metalness: 1, roughness: 0.1, emissive: 0x3a2000 })); visor.rotation.y = Math.PI / 2 - Math.PI / 2; visor.position.set(0, 0.1, 0.012); visor.scale.set(1.02, 1.17, 1.08); h.j.head.add(visor);
  h.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return silver;
}
export function smokeColumn(n = 12, col = 0x8a7f78, seed = 3) {
  const tex = glowTexture('rgba(255,255,255,0.85)', 'rgba(255,255,255,0)'), g = new THREE.Group(), r = rng(seed), P = [];
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: col, transparent: true, depthWrite: false })); s.userData.ph = i / n + r() * 0.05; s.userData.x = (r() - 0.5) * 2; g.add(s); P.push(s); }
  g.update = (t, k = 1, rise = 6, size = 4) => P.forEach(s => { const u = (t * 0.12 + s.userData.ph) % 1; s.position.set(s.userData.x + Math.sin(u * 4 + s.userData.ph * 9) * 1.2, u * rise, Math.cos(u * 3 + s.userData.ph * 5) * 0.8); s.scale.setScalar(1 + u * size); s.material.opacity = Math.sin(u * Math.PI) * 0.55 * k; });
  return g;
}
