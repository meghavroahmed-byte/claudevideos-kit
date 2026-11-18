import * as THREE from 'three';
import { rng, glowTexture } from './textures.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------- crowd of simple people (instanced) ----------------
// grid of cols x rows, spacing s, front row at z0, centred on x = 0.
export function crowd({ cols = 25, rows = 20, s = 0.9, z0 = 0.6, front = [10, 10], skipRows = 0 } = {}) {
  const N = cols * rows, r = rng(9);
  const bodyG = new THREE.CapsuleGeometry(0.17, 0.55, 4, 10); bodyG.translate(0, 0.62, 0);
  const headG = new THREE.SphereGeometry(0.13, 14, 10); headG.translate(0, 1.18, 0);
  const legG = new THREE.CylinderGeometry(0.14, 0.12, 0.42, 10); legG.translate(0, 0.21, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.7 });
  const skinM = new THREE.MeshStandardMaterial({ roughness: 0.6 });
  const body = new THREE.InstancedMesh(bodyG, mat, N), head = new THREE.InstancedMesh(headG, skinM, N), legs = new THREE.InstancedMesh(legG, new THREE.MeshStandardMaterial({ color: 0x3a4660, roughness: 0.8 }), N);
  const hairG = new THREE.SphereGeometry(0.138, 14, 8, 0, Math.PI * 2, 0, 1.5); hairG.translate(0, 1.2, -0.01);
  const hair = new THREE.InstancedMesh(hairG, new THREE.MeshStandardMaterial({ roughness: 0.85 }), N);
  const hairs = [0x2b1d14, 0x3a2618, 0x111111, 0x6b4a2b, 0xc9a26b, 0x4a3020];
  for (const m of [body, head, legs, hair]) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; }
  const shirts = [0xe76f51, 0x2a9d8f, 0xe9c46a, 0x457b9d, 0xf4a261, 0x8d6cab, 0x43aa8b, 0xd62828, 0x6c757d, 0xff8fab];
  const skins = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac, 0xd99b7a];
  const P = [], base = [], skin = [], ring = [], hcol = [];
  const fc0 = Math.floor((cols - front[0]) / 2);
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    const x = (col - (cols - 1) / 2) * s + (r() - 0.5) * 0.25, z = z0 - row * s + (r() - 0.5) * 0.25;
    const inFront = row < front[1] && col >= fc0 && col < fc0 + front[0];
    P.push({ x, z, row, inFront, ph: r() * 6.28, sc: 0.9 + r() * 0.22, ry: (r() - 0.5) * 0.6 });
    base.push(new THREE.Color(shirts[(r() * shirts.length) | 0])); skin.push(new THREE.Color(skins[(r() * skins.length) | 0])); hcol.push(new THREE.Color(hairs[(r() * hairs.length) | 0]));
  }
  const frontIdx = P.map((p, i) => p.inFront && p.row >= skipRows ? i : -1).filter(i => i >= 0);
  const backIdx = P.map((p, i) => p.inFront ? -1 : i).filter(i => i >= 0);
  // highlight rings under chosen people
  const ringM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, toneMapped: false });
  const rings = new THREE.InstancedMesh(new THREE.TorusGeometry(0.32, 0.035, 8, 32).rotateX(Math.PI / 2), ringM, N);
  rings.frustumCulled = false;
  const g = new THREE.Group(); g.add(body, head, legs, hair, rings);
  const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color(), GRAY = new THREE.Color(0x9aa1a9);
  const pick = (n, seed) => { const rr = rng(seed), a = frontIdx.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (rr() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
  return {
    group: g, frontIdx, pick,
    // rise: 0..1 how far the back crowd has risen; lit: Set of indices or null (all coloured); litCol: colour for lit; gray: 0..1 grey-out of unlit
    update(t, { rise = 0, lit = null, litCol = 0xffffff, gray = 0, pop = 0 } = {}) {
      let ri = 0;
      P.forEach((p, i) => {
        if (p.row < skipRows) { mt.makeScale(0, 0, 0); for (const m of [body, head, legs, hair, rings]) m.setMatrixAt(i, mt); return; }
        const up = p.inFront ? 1 : Math.min(1, Math.max(0, rise * 1.6 - (Math.abs(p.z - z0) / (rows * s)) * 0.6));
        const isLit = lit ? lit.has(i) : false;
        const hop = isLit ? Math.max(0, Math.sin(Math.min(1, pop) * Math.PI)) * 0.6 : 0;
        const y = (up - 1) * 1.6 + hop + Math.sin(t * 2 + p.ph) * 0.01;
        e.set(0, p.ry + Math.sin(t * 0.8 + p.ph) * 0.08, 0); q.setFromEuler(e);
        const sc = p.sc * (isLit ? 1.25 : 1); mt.compose(V(p.x, y, p.z), q, V(sc, sc, sc));
        body.setMatrixAt(i, mt); head.setMatrixAt(i, mt); legs.setMatrixAt(i, mt); hair.setMatrixAt(i, mt);
        hair.setColorAt(i, lit && !isLit ? hcol[i].clone().lerp(GRAY, gray * 0.7) : hcol[i]);
        if (lit) c.copy(isLit ? new THREE.Color(litCol) : base[i].clone().lerp(GRAY, gray)); else c.copy(base[i]);
        body.setColorAt(i, c); head.setColorAt(i, isLit || !lit ? skin[i] : skin[i].clone().lerp(GRAY, gray * 0.6));
        mt.compose(V(p.x, 0.02 + y, p.z), new THREE.Quaternion(), V(isLit && up > 0.99 ? 1.4 : 0, 1, isLit && up > 0.99 ? 1.4 : 0));
        rings.setMatrixAt(i, mt); rings.setColorAt(i, new THREE.Color(litCol));
      });
      for (const m of [body, head, legs, hair, rings]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
    },
  };
}

// ---------------- HUD / icon sprites drawn on canvas ----------------
function canvasSprite(w, h, draw, { depthTest = false } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest, depthWrite: false, fog: false }));
  sp.renderOrder = 20; return sp;
}
// big counter at the top of the screen; set(text, colour) swaps a cached texture
export function counter() {
  const cache = new Map();
  const make = (text, col) => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const g = c.getContext('2d');
    g.font = '900 150px Cap, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = 26; g.strokeStyle = 'rgba(0,0,0,0.9)'; g.strokeText(text, 512, 132);
    g.fillStyle = col; g.fillText(text, 512, 132);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
  };
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, fog: false }));
  sp.renderOrder = 30;
  sp.set = (text, col = '#ffffff') => {
    const k = text + col; if (!cache.has(k)) cache.set(k, make(text, col));
    if (sp.material.map !== cache.get(k)) { sp.material.map = cache.get(k); sp.material.needsUpdate = true; }
  };
  return sp;
}
export function bloodBag() {
  return canvasSprite(256, 320, (g) => {
    g.fillStyle = '#ffffff'; g.fillRect(118, 6, 20, 40);
    g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.roundRect(28, 40, 200, 260, 34); g.fill();
    g.fillStyle = '#c1121f'; g.beginPath(); g.roundRect(44, 110, 168, 176, 24); g.fill();
    g.strokeStyle = '#7a0a12'; g.lineWidth = 6; g.beginPath(); g.roundRect(28, 40, 200, 260, 34); g.stroke();
    g.fillStyle = '#fff'; g.font = '900 78px Cap, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('AB−', 128, 200);
  }, { depthTest: true });
}
export function calendar(day = '29') {
  return canvasSprite(256, 300, (g) => {
    g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(14, 30, 228, 256, 22); g.fill();
    g.fillStyle = '#e63946'; g.beginPath(); g.roundRect(14, 30, 228, 78, [22, 22, 0, 0]); g.fill();
    g.fillStyle = '#fff'; g.font = '900 46px Cap, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FEB', 128, 70);
    g.fillStyle = '#1d1d1f'; g.font = '900 130px Cap, sans-serif'; g.fillText(day, 128, 196);
    g.fillStyle = '#444'; for (const x of [70, 186]) { g.beginPath(); g.arc(x, 30, 12, 0, 7); g.fill(); }
  }, { depthTest: true });
}
export function beam() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  const gx = g.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, 64, 256);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 12, 32, 1, true), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), color: 0xfff3b0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  m.position.y = 6; return m;
}
export { glowTexture };

// glass info card at the top of the screen: label, big value, 10x10 dot grid
export function infoCard() {
  const cache = new Map();
  const make = (label, value, col, lit, note) => {
    const W = 1024, H = 400, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.fillStyle = 'rgba(12,18,32,0.62)'; g.beginPath(); g.roundRect(8, 8, W - 16, H - 16, 48); g.fill();
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,255,255,0.22)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.02)');
    g.fillStyle = gr; g.beginPath(); g.roundRect(8, 8, W - 16, H - 16, 48); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 4; g.beginPath(); g.roundRect(8, 8, W - 16, H - 16, 48); g.stroke();
    g.fillStyle = col; g.beginPath(); g.roundRect(48, 52, 12, 112, 6); g.fill();
    g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillStyle = 'rgba(255,255,255,0.75)'; g.font = "400 46px Brand, sans-serif"; if ('letterSpacing' in g) g.letterSpacing = '4px'; g.fillText(label, 84, 82);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    g.fillStyle = col; g.font = "400 150px Brand, sans-serif"; g.fillText(value, 76, 238);
    if (note) { g.fillStyle = 'rgba(255,255,255,0.7)'; g.font = "400 40px Brand, sans-serif"; g.fillText(note, 84, 345); }
    if (lit != null) { // 10x10 grid
      const x0 = 664, y0 = 52, d = 29.5;
      for (let i = 0; i < 100; i++) {
        const x = x0 + (i % 10) * d, y = y0 + Math.floor(i / 10) * d, on = i >= 100 - lit;
        g.fillStyle = on ? col : 'rgba(255,255,255,0.18)'; g.beginPath(); g.arc(x + 12, y + 12, on ? 11 : 9, 0, 7); g.fill();
      }
    }
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
  };
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, fog: false }));
  sp.renderOrder = 30;
  sp.set = (label, value, col, lit, note = '') => {
    const k = [label, value, col, lit, note].join('|'); if (!cache.has(k)) cache.set(k, make(label, value, col, lit, note));
    if (sp.material.map !== cache.get(k)) { sp.material.map = cache.get(k); sp.material.needsUpdate = true; }
  };
  return sp;
}
// confetti-free sparkle burst (additive points), update(dt)
export function burst(color = 0xffffff, n = 60, seed = 3) {
  const r = rng(seed), pos = new Float32Array(n * 3), V0 = [];
  for (let i = 0; i < n; i++) V0.push(new THREE.Vector3(r() - 0.5, r() * 0.8 + 0.2, r() - 0.5).normalize().multiplyScalar(0.6 + r() * 1.2));
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.06, map: glowTexture(), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  m.frustumCulled = false;
  m.update = (t) => { const tt = Math.max(0, t); V0.forEach((v, i) => { pos[i * 3] = v.x * tt; pos[i * 3 + 1] = v.y * tt - 0.8 * tt * tt; pos[i * 3 + 2] = v.z * tt; }); geo.attributes.position.needsUpdate = true; m.material.opacity = t < 0 ? 0 : Math.max(0, 1 - t / 1.2); };
  m.update(-1); return m;
}
