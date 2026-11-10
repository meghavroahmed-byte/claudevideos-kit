// objects3d.js: reusable 3D props for Neon Tech videos (all low-poly, night-lit, bloom-friendly).
// pedestal, pineapple, pineSlice, glassOf, bowlOf, stomach (+stomachUpdate), poisonBottle, shield, milkshake, enzyme.
// Every builder: (parent|null, x, y, z, scale, ...) -> THREE.Group added to parent or scene.
import * as K from './core3d.js';
const { THREE } = K;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (a, b, t) => { const k = cl((t - a) / (b - a)); return k * k * (3 - 2 * k); };
export { V, cl, sm };

export function pedestal(x, z, color, r = 2.4, h = 1.2) {
  const g = K.group(x, 0, z);
  K.mesh(new THREE.CylinderGeometry(r, r * 1.08, h, 6), K.std({ color: 0x141936, roughness: 0.5, metalness: 0.4 }), 0, h / 2, 0, g);
  const rim = K.mesh(new THREE.CylinderGeometry(r * 1.01, r * 1.01, 0.08, 6, 1, true), K.basic({ color, side: THREE.DoubleSide }), 0, h, 0, g);
  K.mesh(new THREE.CylinderGeometry(r * 0.96, r * 0.96, 0.04, 6), K.std({ color: 0x1e2550, emissive: color, emissiveIntensity: 0.12 }), 0, h + 0.01, 0, g);
  const gl = K.glowSprite(color, r * 4, 0.35, g); gl.position.y = 0.2;
  g.userData.top = h; g.userData.rim = rim; return g;
}


// ---- textures ----
export const pineTex = K.canvasTex(512, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d99a24'); gr.addColorStop(0.5, '#e8b232'); gr.addColorStop(1, '#a8661a');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const s = 42;
  for (let y = -s; y < h + s; y += s) for (let x = -s; x < w + s; x += s) {
    const ox = ((y / s) % 2) * s / 2;
    g.fillStyle = 'rgba(255,220,120,0.35)'; g.beginPath(); g.ellipse(x + ox, y, s * 0.33, s * 0.28, 0, 0, 7); g.fill();
    g.fillStyle = '#5a3510'; g.beginPath(); g.arc(x + ox, y - 2, 4, 0, 7); g.fill();
  }
  g.strokeStyle = 'rgba(80,45,10,0.75)'; g.lineWidth = 4;
  for (let i = -h; i < w + h; i += s) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke(); }
});
export const sliceTex = K.canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#8a5a14'; g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill();
  const gr = g.createRadialGradient(128, 128, 10, 128, 128, 116); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(0.3, '#ffd94a'); gr.addColorStop(1, '#f2b81e');
  g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 116, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,250,210,0.55)'; g.lineWidth = 3;
  for (let a = 0; a < 6.28; a += 0.2) { g.beginPath(); g.moveTo(128 + Math.cos(a) * 30, 128 + Math.sin(a) * 30); g.lineTo(128 + Math.cos(a) * 110, 128 + Math.sin(a) * 110); g.stroke(); }
  g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(128, 128, 26, 0, 7); g.fill();
});
export const woodTex = K.canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = '#5b3a1e'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(${30 + K.rnd(0, 40)},${18 + K.rnd(0, 20)},8,0.5)`; g.lineWidth = K.rnd(1, 4); const y = K.rnd(0, h); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w / 3, y + K.rnd(-12, 12), 2 * w / 3, y + K.rnd(-12, 12), w, y); g.stroke(); }
});

// ---- object builders ----
export function pineapple(parent, x, y, z, s = 1) {
  const g = K.group(x, y, z, parent); g.scale.setScalar(s);
  const body = K.mesh(new THREE.SphereGeometry(1, 40, 28), K.std({ map: pineTex, roughness: 0.65, bumpMap: pineTex, bumpScale: 2 }), 0, 1.25, 0, g);
  body.scale.set(0.78, 1.25, 0.78);
  const leafM = K.std({ color: 0x2f9a45, roughness: 0.55, flatShading: true });
  const leafM2 = K.std({ color: 0x1f6e33, roughness: 0.6, flatShading: true });
  for (let i = 0; i < 22; i++) {
    const L = i < 8 ? 1.9 : i < 15 ? 1.5 : 1.0, a = i * 2.4;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.16, L, 4), i % 2 ? leafM : leafM2);
    leaf.scale.z = 0.35;
    const piv = new THREE.Group(); piv.position.y = 2.45; piv.rotation.y = a; g.add(piv);
    leaf.position.y = L / 2; leaf.rotation.y = 0; piv.add(leaf);
    piv.rotation.z = (i < 8 ? 0.75 : i < 15 ? 0.45 : 0.15);
  }
  return g;
}
export function pineSlice(parent, x, y, z, s = 1, tilt = 0) {
  const g = K.group(x, y, z, parent);
  const m = K.mesh(new THREE.CylinderGeometry(0.9 * s, 0.9 * s, 0.22 * s, 40), [
    K.std({ color: 0xb07a1c, roughness: 0.7 }), K.std({ map: sliceTex, roughness: 0.5, emissive: 0x2a1a00 }), K.std({ map: sliceTex })], 0, 0, 0, g);
  m.rotation.x = tilt; return g;
}
export function glassOf(parent, x, y, z, fill = 0xf5f1e8, s = 1, h = 1.8) {
  const g = K.group(x, y, z, parent); g.scale.setScalar(s);
  K.mesh(new THREE.CylinderGeometry(0.6, 0.5, h, 40, 1, true), K.std({ color: 0xcfe0ff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false }), 0, h / 2, 0, g);
  K.mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 32), K.std({ color: 0xcfe0ff, transparent: true, opacity: 0.4 }), 0, 0.03, 0, g);
  const liq = K.mesh(new THREE.CylinderGeometry(0.55, 0.47, h * 0.78, 40), K.std({ color: fill, roughness: 0.35, emissive: fill, emissiveIntensity: 0.04 }), 0, h * 0.42, 0, g);
  const rim = K.mesh(new THREE.TorusGeometry(0.6, 0.025, 8, 48), K.std({ color: 0xffffff, transparent: true, opacity: 0.5 }), 0, h, 0, g); rim.rotation.x = Math.PI / 2;
  g.userData.liq = liq; return g;
}
export function bowlOf(parent, x, y, z, s = 1) {
  const g = K.group(x, y, z, parent); g.scale.setScalar(s);
  const pts = []; for (let i = 0; i <= 20; i++) { const a = i / 20 * Math.PI / 2; pts.push(new THREE.Vector2(Math.sin(a) * 2.6 + 0.01, 1.6 - Math.cos(a) * 1.6)); }
  const outer = K.mesh(new THREE.LatheGeometry(pts, 64), K.std({ color: 0x2d6fd6, roughness: 0.35, side: THREE.DoubleSide }), 0, 0, 0, g);
  const pts2 = pts.map(p => new THREE.Vector2(p.x * 0.94, p.y + 0.06));
  K.mesh(new THREE.LatheGeometry(pts2, 64), K.std({ color: 0xf2f4fa, roughness: 0.3, side: THREE.BackSide }), 0, 0, 0, g);
  const rim = K.mesh(new THREE.TorusGeometry(2.6, 0.08, 10, 64), K.std({ color: 0xdfe8ff }), 0, 1.6, 0, g); rim.rotation.x = Math.PI / 2;
  const surf = K.mesh(new THREE.CircleGeometry(2.38, 64), K.std({ color: 0xf6f3ea, roughness: 0.4, emissive: 0xf6f3ea, emissiveIntensity: 0.05 }), 0, 1.25, 0, g); surf.rotation.x = -Math.PI / 2;
  g.userData.surf = surf; return g;
}
export function stomach(parent, x, y, z, s = 2.2, color = 0xff6f91) {
  const g = K.group(x, y, z, parent); g.scale.setScalar(s);
  const curve = new THREE.CatmullRomCurve3([V(-1.5, 4.4, 0), V(-1.35, 3.0, 0), V(-1.0, 1.7, 0), V(-0.3, 0.5, 0), V(0.8, 0.05, 0), V(1.9, 0.45, 0), V(2.45, 1.35, 0), V(2.75, 0.75, 0), V(2.6, -0.3, 0)]);
  const TS = 140, RS = 28, geo = new THREE.TubeGeometry(curve, TS, 1, RS, false), pos = geo.attributes.position;
  const rad = u => u < 0.12 ? 0.33 : u < 0.3 ? 0.33 + (1.45 - 0.33) * sm(0.12, 0.3, u) : u < 0.58 ? 1.45 : u < 0.8 ? 1.45 - (1.45 - 0.42) * sm(0.58, 0.8, u) : 0.42 - 0.08 * sm(0.8, 1, u);
  for (let i = 0; i <= TS; i++) {
    const u = i / TS, c = curve.getPointAt(u), r = rad(u);
    for (let j = 0; j <= RS; j++) { const k = i * (RS + 1) + j; const p = V(pos.getX(k), pos.getY(k), pos.getZ(k)).sub(c).multiplyScalar(r).add(c); pos.setXYZ(k, p.x, p.y, p.z); }
  }
  geo.computeVertexNormals();
  const shellM = K.std({ color, roughness: 0.35, transparent: true, opacity: 0.5, emissive: color, emissiveIntensity: 0.22, side: THREE.DoubleSide, depthWrite: false });
  const shell = K.mesh(geo, shellM, 0, 0, 0, g);
  // fresnel rim
  const rimM = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { c: { value: new THREE.Color(color) }, a: { value: 1 } },
    vertexShader: 'varying vec3 n; varying vec3 v; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); n = normalize(normalMatrix*normal); v = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 c; uniform float a; varying vec3 n; varying vec3 v; void main(){ float f = pow(1.-abs(dot(n,v)),2.5); gl_FragColor = vec4(c*f*1.4*a,1.); }' });
  K.mesh(geo, rimM, 0, 0, 0, g);
  // liquid blob inside the lower curve
  const liqM = K.std({ color: 0xf6f0e0, roughness: 0.3, emissive: 0xf6f0e0, emissiveIntensity: 0.15, transparent: true, opacity: 0.95 });
  const liq = K.mesh(new THREE.SphereGeometry(1, 32, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), liqM, 0.35, 1.05, 0, g);
  liq.scale.set(1.45, 0.75, 0.82); liq.rotation.z = 0.2;
  const top = K.mesh(new THREE.CircleGeometry(1, 40), liqM, 0.35, 1.05, 0, g); top.rotation.x = -Math.PI / 2; top.scale.set(1.4, 0.8, 1);
  // curds + bubbles
  const curds = K.instanced(new THREE.IcosahedronGeometry(0.16, 1), K.std({ color: 0xfff6dc, roughness: 0.6, emissive: 0x3a3320 }), 46, g);
  const cp = []; for (let i = 0; i < 46; i++) cp.push([0.35 + K.rnd(-1.4, 1.4), 1.05 + K.rnd(-0.55, 0.08), K.rnd(-0.75, 0.75), K.rnd(0.7, 1.5), K.rnd(0, 1)]);
  const bubbles = K.instanced(new THREE.SphereGeometry(0.12, 12, 8), K.std({ color: 0xffb36b, emissive: 0xff7a2e, emissiveIntensity: 0.8, transparent: true, opacity: 0.85 }), 30, g);
  const bp = []; for (let i = 0; i < 30; i++) bp.push([K.rnd(-1.3, 1.6), K.rnd(-0.6, 0.6), K.rnd(0, 1), K.rnd(0.6, 1.4)]);
  const glow = K.glowSprite(color, 9, 0.25, g); glow.position.set(0.4, 1.4, -0.5);
  g.userData = { shellM, rimM, liqM, curds, cp, bubbles, bp, glow, liq, top };
  return g;
}
export function stomachUpdate(S, t, { curd = 0, bub = 0, liqColor = null, pulse = 0, glowCol = null }) {
  const d = S.userData;
  d.cp.forEach(([x, y, z, s, ph], i) => { const k = cl(curd * 1.6 - ph * 0.6); K.setInst(d.curds, i, [x, y + 0.03 * Math.sin(t * 2 + i), z], k * s, i, i * 2, 0); });
  d.curds.instanceMatrix.needsUpdate = true;
  d.bp.forEach(([x, z, ph, sp], i) => { const k = (t * 0.35 * sp + ph) % 1; K.setInst(d.bubbles, i, [x * (1 - 0.3 * k), 0.7 + k * 3.0, z], bub * (0.6 + 0.6 * Math.sin(k * 3.14))); });
  d.bubbles.instanceMatrix.needsUpdate = true;
  if (liqColor) { d.liqM.color.set(liqColor); d.liqM.emissive.set(liqColor); }
  d.shellM.emissiveIntensity = 0.22 + pulse * (0.3 + 0.3 * Math.sin(t * 8));
  if (glowCol) d.glow.material.color.set(glowCol);
  d.glow.material.opacity = 0.25 + pulse * 0.35;
}
export function poisonBottle(parent, x, y, z, s = 1) {
  const g = K.group(x, y, z, parent); g.scale.setScalar(s);
  const prof = [[0, 0], [0.9, 0], [1.0, 0.15], [1.0, 1.9], [0.85, 2.3], [0.38, 2.6], [0.34, 3.2], [0.42, 3.3], [0.42, 3.55], [0, 3.55]].map(p => new THREE.Vector2(p[0] + 0.001, p[1]));
  K.mesh(new THREE.LatheGeometry(prof, 48), K.std({ color: 0x6a2bd8, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.2, emissive: 0x2a0a60, depthWrite: false }), 0, 0, 0, g);
  const liq = K.mesh(new THREE.CylinderGeometry(0.88, 0.85, 1.7, 40), K.std({ color: 0x5cff6a, emissive: 0x3cff4a, emissiveIntensity: 0.6, transparent: true, opacity: 0.85 }), 0, 0.95, 0, g);
  K.mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.3, 24), K.std({ color: 0x3a2412 }), 0, 3.5, 0, g);
  const lab = K.canvasTex(256, 256, (c) => {
    c.fillStyle = '#f1e7cf'; c.fillRect(0, 0, 256, 256);
    c.fillStyle = '#1b1b1b'; c.beginPath(); c.arc(128, 104, 58, 0, 7); c.fill(); c.fillRect(92, 140, 72, 40);
    c.fillStyle = '#f1e7cf'; c.beginPath(); c.arc(104, 100, 16, 0, 7); c.arc(152, 100, 16, 0, 7); c.fill();
    c.fillRect(108, 150, 8, 26); c.fillRect(124, 150, 8, 26); c.fillRect(140, 150, 8, 26);
    c.strokeStyle = '#1b1b1b'; c.lineWidth = 16; c.beginPath(); c.moveTo(50, 200); c.lineTo(206, 240); c.moveTo(206, 200); c.lineTo(50, 240); c.stroke();
  });
  K.mesh(new THREE.CylinderGeometry(1.01, 1.01, 1.1, 40, 1, true, -0.9, 1.8), K.std({ map: lab, roughness: 0.8 }), 0, 1.1, 0, g);
  K.glowSprite(0x5cff6a, 5, 0.35, g).position.y = 1.2;
  // red X (hidden until set)
  const X = K.group(0, 1.8, 1.4, g), xm = K.basic({ color: 0xff2d55 });
  K.box(4.4, 0.55, 0.3, xm, 0, 0, 0, X).rotation.z = 0.8; K.box(4.4, 0.55, 0.3, xm, 0, 0, 0, X).rotation.z = -0.8;
  K.glowSprite(0xff2d55, 7, 0.6, X); X.scale.setScalar(0.001);
  g.userData = { X, liq }; return g;
}
export function shield(parent, x, y, z, s = 1, color = 0x2ee59d) {
  const g = K.group(x, y, z, parent); g.scale.setScalar(s);
  const sh = new THREE.Shape(); sh.moveTo(0, 2.2); sh.bezierCurveTo(0.9, 1.9, 1.5, 2.0, 1.8, 1.8); sh.bezierCurveTo(1.8, 0.4, 1.3, -0.9, 0, -1.8); sh.bezierCurveTo(-1.3, -0.9, -1.8, 0.4, -1.8, 1.8); sh.bezierCurveTo(-1.5, 2.0, -0.9, 1.9, 0, 2.2);
  K.mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 3 }), K.std({ color: 0x0f3b2c, emissive: color, emissiveIntensity: 0.25, metalness: 0.5, roughness: 0.3 }), 0, 0, -0.2, g);
  const ck = new THREE.Shape(); ck.moveTo(-0.9, 0.3); ck.lineTo(-0.3, -0.35); ck.lineTo(1.0, 1.05); ck.lineTo(1.3, 0.75); ck.lineTo(-0.3, -0.9); ck.lineTo(-1.2, 0.0); ck.lineTo(-0.9, 0.3);
  K.mesh(new THREE.ExtrudeGeometry(ck, { depth: 0.3, bevelEnabled: false }), K.basic({ color }), 0, 0.2, 0.35, g);
  K.glowSprite(color, 9, 0.4, g);
  return g;
}
export function milkshake(parent, x, y, z, s = 1, fill = 0xffe28a) {
  const g = K.group(x, y, z, parent); g.scale.setScalar(s);
  const prof = [[0.35, 0], [0.5, 0.05], [0.7, 2.4], [0.78, 2.5]].map(p => new THREE.Vector2(p[0], p[1]));
  K.mesh(new THREE.LatheGeometry(prof, 40), K.std({ color: 0xd8e6ff, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }), 0, 0, 0, g);
  K.mesh(new THREE.CylinderGeometry(0.66, 0.38, 2.2, 32), K.std({ color: fill, emissive: fill, emissiveIntensity: 0.18, roughness: 0.4 }), 0, 1.15, 0, g);
  for (let i = 0; i < 5; i++) K.mesh(new THREE.SphereGeometry(0.42 - i * 0.06, 20, 14), K.std({ color: 0xfffaf0, roughness: 0.6 }), Math.sin(i) * 0.15, 2.4 + i * 0.2, Math.cos(i) * 0.12, g);
  const straw = K.mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 12), K.std({ color: 0xff4d6d }), 0.3, 3.0, 0, g); straw.rotation.z = -0.3;
  const wedge = K.mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.18, 24, 1, false, 0, 1.2), [K.std({ color: 0xb07a1c }), K.std({ map: sliceTex }), K.std({ map: sliceTex })], -0.62, 2.45, 0, g);
  wedge.rotation.set(Math.PI / 2, 0, 0.4);
  return g;
}
export function enzyme(parent, color = 0xffc93c) {
  const g = K.group(0, 0, 0, parent);
  K.mesh(new THREE.SphereGeometry(0.42, 24, 16, 0.55, Math.PI * 2 - 1.1), K.std({ color, emissive: color, emissiveIntensity: 0.45, roughness: 0.3, side: THREE.DoubleSide }), 0, 0, 0, g);
  const e = K.mesh(new THREE.SphereGeometry(0.06, 8, 6), K.basic({ color: 0x111111 }), 0.12, 0.25, 0.3, g);
  return g;
}

