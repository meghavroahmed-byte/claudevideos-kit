import * as THREE from 'three';
import { glowTexture, rng } from './textures.js';

// ---------- shared materials ----------
let SM = null;
export function slideMats() {
  if (SM) return SM;
  SM = {
    tube: new THREE.MeshPhysicalMaterial({ color: 0xffb51e, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide }),
    tubeIn: new THREE.MeshPhysicalMaterial({ color: 0xffc94a, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03, side: THREE.DoubleSide }),
    stripe: new THREE.MeshPhysicalMaterial({ color: 0x1f6fe0, roughness: 0.2, clearcoat: 1 }),
    ghost: new THREE.MeshPhysicalMaterial({ color: 0xffd36a, roughness: 0.1, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide }),
    water: new THREE.MeshStandardMaterial({ color: 0x1f8fe8, roughness: 0.2, envMapIntensity: 0.15, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.FrontSide, emissive: 0x0a4a90, emissiveIntensity: 0.15 }),
    support: new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.45, metalness: 0.2 }),
    deck: new THREE.MeshStandardMaterial({ color: 0xe9dfcf, roughness: 0.85 }),
    tile: new THREE.MeshStandardMaterial({ color: 0x8fd6f2, roughness: 0.35 }),
    pool: new THREE.MeshPhysicalMaterial({ color: 0x35b6f0, roughness: 0.03, clearcoat: 1, transparent: true, opacity: 0.72, depthWrite: false }),
    bubble: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.55, depthWrite: false }),
  };
  return SM;
}

// ---------- straight cut-away tube, axis along z, open side facing +x ----------
export function tubeSection(len = 8, r = 0.4, cut = 1.9) {
  const M = slideMats();
  const g = new THREE.Group();
  const geo = new THREE.CylinderGeometry(r, r, len, 72, 1, true, Math.PI / 2 + cut / 2, Math.PI * 2 - cut);
  geo.rotateX(Math.PI / 2);
  const shell = new THREE.Mesh(geo, M.tubeIn); shell.receiveShadow = true; g.add(shell);
  const outer = new THREE.CylinderGeometry(r + 0.03, r + 0.03, len, 72, 1, true, Math.PI / 2 + cut / 2, Math.PI * 2 - cut);
  outer.rotateX(Math.PI / 2);
  const out = new THREE.Mesh(outer, M.tube); g.add(out);
  // ghost of the cut part (reads as a closed tube)
  const gg = new THREE.CylinderGeometry(r + 0.01, r + 0.01, len, 48, 1, true, Math.PI / 2 - cut / 2, cut);
  gg.rotateX(Math.PI / 2);
  g.add(new THREE.Mesh(gg, M.ghost));
  // flanged joints
  for (let z = -len / 2 + 0.6; z < len / 2; z += 1.6) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r + 0.04, 0.03, 10, 72, Math.PI * 2 - cut), M.stripe);
    t.rotation.z = cut / 2; t.position.z = z; g.add(t);
  }
  // cut edges (rims)
  for (const s of [1, -1]) {
    const a = Math.PI / 2 + s * cut / 2; // cylinder theta of the edge
    const x = r * Math.sin(a) + 0.0, y = -r * Math.cos(a);
    const e = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, len, 10), M.tube);
    e.rotation.x = Math.PI / 2; e.position.set(x * 1.04, y * 1.04, 0); g.add(e);
  }
  g.userData.r = r; g.userData.len = len;
  return g;
}

// ---------- water inside the tube: setLevel(h) with h in tube-local y ----------
export function tubeWater(len = 8, r = 0.4) {
  const M = slideMats();
  const rw = r - 0.012;
  const m = new THREE.Mesh(new THREE.BufferGeometry(), M.water);
  m.renderOrder = 3;
  const cache = new Map();
  m.setLevel = (h) => {
    const key = Math.round(h * 400);
    if (!cache.has(key)) {
      const hh = key / 400;
      const s = new THREE.Shape();
      if (hh >= rw - 0.002) s.absarc(0, 0, rw, 0, Math.PI * 2, false);
      else {
        const hc = Math.max(-rw + 0.004, hh);
        const p0 = Math.asin(hc / rw);
        s.moveTo(rw * Math.cos(p0), hc);
        s.absarc(0, 0, rw, p0, -Math.PI - p0, true);
        s.lineTo(rw * Math.cos(p0), hc);
      }
      const geo = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, curveSegments: 48 });
      geo.translate(0, 0, -len / 2);
      cache.set(key, geo);
    }
    m.geometry = cache.get(key);
    m.visible = h > -rw + 0.005;
  };
  m.setLevel(-1);
  return m;
}

// ---------- bubbles: deterministic, update(t) ----------
export function bubbles(n = 40, { box = [0.5, 0.3, 1.5], speed = 0.25, size = 0.012, seed = 5 } = {}) {
  const M = slideMats();
  const r = rng(seed);
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), M.bubble, n);
  im.renderOrder = 4; im.frustumCulled = false;
  const B = [];
  for (let i = 0; i < n; i++) B.push({ x: (r() - 0.5) * box[0], y: r() * box[1], z: (r() - 0.5) * box[2], s: size * (0.4 + r()), v: speed * (0.6 + r() * 0.8), p: r() * 6 });
  const mt = new THREE.Matrix4();
  im.update = (t, top = box[1], amt = 1) => {
    B.forEach((b, i) => {
      const y = ((b.y + b.v * t) % top);
      const x = b.x + Math.sin(t * 3 + b.p) * 0.01;
      const s = (i / n < amt ? b.s : 0) * Math.min(1, (top - y) * 20);
      mt.makeScale(s, s, s).setPosition(x, y, b.z);
      im.setMatrixAt(i, mt);
    });
    im.instanceMatrix.needsUpdate = true;
  };
  im.update(0);
  return im;
}

// ---------- splash / spray (additive points), update(dt) ----------
let _glow = null;
export function spray(count = 120, { speed = 2.5, spread = 0.7, gravity = -9, life = 0.9, size = 0.05, seed = 7, dir = new THREE.Vector3(0, 1, 0) } = {}) {
  const r = rng(seed);
  _glow = _glow || glowTexture();
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ size, map: _glow, color: 0xcff0ff, transparent: true, depthWrite: false, opacity: 0.9 });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
  const V = [], L = [];
  const d = dir.clone().normalize();
  for (let i = 0; i < count; i++) {
    V.push(new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(spread).add(d).normalize().multiplyScalar(speed * (0.4 + r() * 0.8)));
    L.push(life * (0.5 + r() * 0.7));
  }
  pts.update = (t) => {
    let alive = 0;
    for (let i = 0; i < count; i++) {
      const tt = Math.max(0, Math.min(t, L[i])), v = V[i];
      const on = t > 0 && t < L[i];
      pos[i * 3] = v.x * tt; pos[i * 3 + 1] = on ? v.y * tt + 0.5 * gravity * tt * tt : -999; pos[i * 3 + 2] = v.z * tt;
      if (on) alive++;
    }
    mat.opacity = 0.9;
    geo.attributes.position.needsUpdate = true;
  };
  pts.update(-1);
  return pts;
}

// glowing ring that travels along the tube (pressure front)
export function pressureRing(r = 0.4) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r - 0.03, 0.02, 10, 72),
    new THREE.MeshBasicMaterial({ color: 0x9fe6ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  m.renderOrder = 6;
  return m;
}

// ---------- exterior: spiral slide tower with a pool ----------
export function slideTower() {
  const M = slideMats();
  const g = new THREE.Group();
  const pts = [];
  const turns = 1.6, H0 = 6.2, H1 = 1.2, R = 2.4;
  for (let i = 0; i <= 64; i++) {
    const k = i / 64, a = k * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * R, H0 + (H1 - H0) * k, Math.sin(a) * R));
  }
  const last = pts[pts.length - 1];
  const tan = last.clone().sub(pts[pts.length - 2]).setY(0).normalize();
  pts.push(last.clone().addScaledVector(tan, 1.2).setY(0.95));
  pts.push(last.clone().addScaledVector(tan, 2.2).setY(0.75));
  const curve = new THREE.CatmullRomCurve3(pts);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 400, 0.42, 40, false), M.tube);
  tube.castShadow = true; tube.receiveShadow = true; g.add(tube);
  // stripe rings
  for (let i = 1; i < 30; i++) {
    const u = i / 30;
    const p = curve.getPointAt(u), t = curve.getTangentAt(u);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.035, 10, 48), M.stripe);
    ring.position.copy(p); ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), t); ring.castShadow = true; g.add(ring);
  }
  // supports
  for (let i = 3; i < 60; i += 6) {
    const p = pts[i];
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, p.y - 0.42, 16), M.support);
    c.position.set(p.x, (p.y - 0.42) / 2, p.z); c.castShadow = true; g.add(c);
  }
  // central tower + platform
  const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 6.6, 24), M.support); tw.position.y = 3.3; tw.castShadow = true; g.add(tw);
  const pl = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.15, 32), M.stripe); pl.position.set(0.9, 6.6, 0); pl.castShadow = true; g.add(pl);
  // entry funnel from the platform into the tube start
  const exitP = curve.getPointAt(1), exitT = curve.getTangentAt(1).setY(0).normalize();
  // deck
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), M.deck); deck.rotation.x = -Math.PI / 2; deck.position.y = 0.001; deck.receiveShadow = true; g.add(deck);
  // pool at the exit
  const pc = exitP.clone().addScaledVector(exitT, 2.4).setY(0);
  const pool = new THREE.Group(); pool.position.copy(pc); pool.rotation.y = Math.atan2(exitT.x, exitT.z); g.add(pool);
  const W = 4.5, Lp = 6;
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  for (const [w, d, x, z] of [[W + 0.6, 0.3, 0, -Lp / 2 - 0.15], [W + 0.6, 0.3, 0, Lp / 2 + 0.15], [0.3, Lp, -W / 2 - 0.15, 0], [0.3, Lp, W / 2 + 0.15, 0]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), rimMat); b.position.set(x, 0.06, z); b.receiveShadow = b.castShadow = true; pool.add(b);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, Lp), M.tile); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.004; pool.add(floor);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(W, Lp, 60, 80), M.pool); water.rotation.x = -Math.PI / 2; water.position.y = 0.09; water.renderOrder = 3; pool.add(water);
  g.userData = { curve, exitP, exitT, pool, poolWater: water, poolCenter: pc };
  return g;
}

// animate pool water ripples around a point (pool-local xz)
export function rippleWater(water, t, cx = 0, cz = 0, amp = 0.03) {
  const p = water.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i); // plane: local x,y -> pool x,-z
    const d = Math.hypot(x - cx, -y - cz);
    const z = Math.sin(d * 9 - t * 7) * amp * Math.exp(-d * 0.7) * Math.min(1, t * 3) + Math.sin(x * 2 + t * 1.3) * 0.006 + Math.cos(y * 2.4 + t) * 0.006;
    p.setZ(i, z);
  }
  p.needsUpdate = true; water.geometry.computeVertexNormals();
}

// orient a human root so its local +Y (head) points along up and local +Z (face) along front
export function orient(root, up, front) {
  const Y = up.clone().normalize(), Z = front.clone().normalize();
  const X = new THREE.Vector3().crossVectors(Y, Z).normalize();
  root.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
}

// ---------- standalone pool (rim, tiles, rippling water) ----------
export function makePool(W = 4.5, Lp = 6) {
  const M = slideMats();
  const pool = new THREE.Group();
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  for (const [w, d, x, z] of [[W + 0.6, 0.3, 0, -Lp / 2 - 0.15], [W + 0.6, 0.3, 0, Lp / 2 + 0.15], [0.3, Lp, -W / 2 - 0.15, 0], [0.3, Lp, W / 2 + 0.15, 0]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), rimMat); b.position.set(x, 0.06, z); b.receiveShadow = b.castShadow = true; pool.add(b);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, Lp), M.tile); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.004; pool.add(floor);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(W, Lp, 60, 80), M.pool); water.rotation.x = -Math.PI / 2; water.position.y = 0.09; water.renderOrder = 3; pool.add(water);
  pool.userData.water = water;
  return pool;
}
