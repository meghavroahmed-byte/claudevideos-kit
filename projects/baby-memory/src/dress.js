import * as THREE from 'three';
// Real (separate) loose clothing + hair for a single-mesh skinned body:
// copies the body triangles inside a region, welds + Taubin-smooths them (no anatomy shows through),
// pushes them out along smoothed normals and binds the result to the same skeleton, so it moves with the body.
// opts: { top: color, bottom: color, trim: color, hair: color|null, stripes: bool, flip: bool, sleeve: 0..1, legs: 0..1 }
export function dress(root, opts = {}) {
  const bodies = []; root.traverse(m => { if (m.isSkinnedMesh && !/eye/i.test((m.material && m.material.name) || '')) bodies.push(m); });
  for (const m of bodies) {
    const g = m.geometry; g.computeBoundingBox(); const bb = g.boundingBox; const sz = bb.getSize(new THREE.Vector3());
    const up = sz.y >= sz.z ? 1 : 2, H = up === 1 ? sz.y : sz.z, min = up === 1 ? bb.min.y : bb.min.z;
    const cx = (bb.min.x + bb.max.x) / 2, cz = up === 1 ? (bb.min.z + bb.max.z) / 2 : (bb.min.y + bb.max.y) / 2;
    const P = g.attributes.position, N = P.count;
    const hN = (i) => { const v = (up === 1 ? P.getY(i) : P.getZ(i)) - min; const h = v / H; return opts.flip ? 1 - h : h; };
    const xN = (i) => Math.abs(P.getX(i) - cx) / H;
    const zN = (i) => ((up === 1 ? P.getZ(i) : P.getY(i)) - cz) / H * (opts.fwd ?? 1);
    const sl = opts.sleeve ?? 0.5, lg = opts.legs ?? 0.5;
    const clothMask = (i) => { const h = hN(i), x = xN(i), z = zN(i); if (h > 0.772) return false; if (h > 0.742) return Math.hypot(x, z * 1.2) > 0.052 && x < 0.13; if (h > 0.6) return x < 0.125 + 0.1 * sl * (h - 0.6) / 0.142 + 0.06 * sl; if (h > 0.45) return x < 0.118; return h > 0.43 - 0.13 * lg && x < 0.14; };
    const hairMask = (i) => { const h = hN(i), z = zN(i); if (h < 0.875) return false; if (z > 0.035 && h < 0.94) return false; return true; };
    shell(m, clothMask, 0.02 * H, 70, clothMaterial(opts, { min, H, flip: opts.flip, up }));
    if (opts.hair !== null) shell(m, hairMask, 0.008 * H, 12, hairMaterial(opts.hair ?? 0x4a2c18));
  }
}
function shell(m, mask, offset, iters, material) {
  const g = m.geometry, P = g.attributes.position, N = P.count;
  const idx = g.index ? g.index.array : Array.from({ length: N }, (_, i) => i);
  // weld by position so UV seams don't tear
  const key = (i) => `${Math.round(P.getX(i) * 1e4)},${Math.round(P.getY(i) * 1e4)},${Math.round(P.getZ(i) * 1e4)}`;
  const canon = new Int32Array(N), map = new Map(); let nc = 0;
  for (let i = 0; i < N; i++) { const k = key(i); if (!map.has(k)) map.set(k, nc++); canon[i] = map.get(k); }
  const inMask = new Uint8Array(nc); for (let i = 0; i < N; i++) if (mask(i)) inMask[canon[i]] = 1;
  const tris = []; for (let t = 0; t < idx.length; t += 3) { const a = idx[t], b = idx[t + 1], c = idx[t + 2]; if (inMask[canon[a]] && inMask[canon[b]] && inMask[canon[c]]) tris.push(a, b, c); }
  if (!tris.length) return null;
  const pos = new Float32Array(nc * 3); for (let i = 0; i < N; i++) { const c = canon[i]; pos[c * 3] = P.getX(i); pos[c * 3 + 1] = P.getY(i); pos[c * 3 + 2] = P.getZ(i); }
  const nb = Array.from({ length: nc }, () => new Set());
  for (let t = 0; t < tris.length; t += 3) { const a = canon[tris[t]], b = canon[tris[t + 1]], c = canon[tris[t + 2]]; nb[a].add(b).add(c); nb[b].add(a).add(c); nb[c].add(a).add(b); }
  // boundary vertices stay put (keeps the hem on the body)
  const tmp = new Float32Array(nc * 3);
  const step = (lam) => {
    for (let c = 0; c < nc; c++) { const s = nb[c]; if (!s.size) { tmp[c * 3] = pos[c * 3]; tmp[c * 3 + 1] = pos[c * 3 + 1]; tmp[c * 3 + 2] = pos[c * 3 + 2]; continue; } let x = 0, y = 0, z = 0; for (const n of s) { x += pos[n * 3]; y += pos[n * 3 + 1]; z += pos[n * 3 + 2]; } const k = 1 / s.size; tmp[c * 3] = pos[c * 3] + lam * (x * k - pos[c * 3]); tmp[c * 3 + 1] = pos[c * 3 + 1] + lam * (y * k - pos[c * 3 + 1]); tmp[c * 3 + 2] = pos[c * 3 + 2] + lam * (z * k - pos[c * 3 + 2]); }
    pos.set(tmp);
  };
  for (let i = 0; i < iters; i++) { step(0.55); step(-0.58); }
  // smoothed normals (area weighted) on welded verts
  const nrm = new Float32Array(nc * 3); const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  for (let t = 0; t < tris.length; t += 3) { const a = canon[tris[t]], b = canon[tris[t + 1]], c = canon[tris[t + 2]]; va.fromArray(pos, a * 3); vb.fromArray(pos, b * 3); vc.fromArray(pos, c * 3); e1.subVectors(vb, va); e2.subVectors(vc, va); const n = e1.cross(e2); for (const q of [a, b, c]) { nrm[q * 3] += n.x; nrm[q * 3 + 1] += n.y; nrm[q * 3 + 2] += n.z; } }
  for (let c = 0; c < nc; c++) { const l = Math.hypot(nrm[c * 3], nrm[c * 3 + 1], nrm[c * 3 + 2]) || 1; for (let k = 0; k < 3; k++) pos[c * 3 + k] += nrm[c * 3 + k] / l * offset; }
  // build the shell geometry on the original vertex ids (keeps skin weights / uvs)
  const used = [...new Set(tris)]; const remap = new Map(used.map((v, i) => [v, i]));
  const ng = new THREE.BufferGeometry();
  const np = new Float32Array(used.length * 3); used.forEach((v, i) => { const c = canon[v]; np[i * 3] = pos[c * 3]; np[i * 3 + 1] = pos[c * 3 + 1]; np[i * 3 + 2] = pos[c * 3 + 2]; });
  ng.setAttribute('position', new THREE.BufferAttribute(np, 3));
  for (const name of ['skinIndex', 'skinWeight', 'uv']) { const A = g.attributes[name]; if (!A) continue; const arr = new A.array.constructor(used.length * A.itemSize); used.forEach((v, i) => { for (let k = 0; k < A.itemSize; k++) arr[i * A.itemSize + k] = A.array[v * A.itemSize + k]; }); ng.setAttribute(name, new THREE.BufferAttribute(arr, A.itemSize, A.normalized)); }
  ng.setAttribute('rest', new THREE.BufferAttribute(np.slice(), 3));
  ng.setIndex(tris.map(v => remap.get(v))); ng.computeVertexNormals();
  const sm = new THREE.SkinnedMesh(ng, material); sm.castShadow = true; sm.receiveShadow = true; sm.frustumCulled = false;
  m.parent.add(sm); sm.position.copy(m.position); sm.quaternion.copy(m.quaternion); sm.scale.copy(m.scale);
  sm.bind(m.skeleton, m.bindMatrix);
  return sm;
}
function clothMaterial(opts, R) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0, side: THREE.DoubleSide });
  const U = { uTop: { value: new THREE.Color(opts.top ?? 0xf4c542) }, uBot: { value: new THREE.Color(opts.bottom ?? 0x3d6fb6) }, uTrim: { value: new THREE.Color(opts.trim ?? 0xffffff) }, uMin: { value: R.min }, uH: { value: R.H }, uFlip: { value: R.flip ? 1 : 0 }, uUpZ: { value: R.up === 2 ? 1 : 0 }, uStr: { value: opts.stripes ? 1 : 0 } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 rest; varying vec3 vRest;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRest = rest;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vRest; uniform vec3 uTop, uBot, uTrim; uniform float uMin, uH, uFlip, uUpZ, uStr;
      float hs(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      { float h = ((uUpZ > 0.5 ? vRest.z : vRest.y) - uMin) / uH; if (uFlip > 0.5) h = 1.0 - h;
        vec3 c = h > 0.5 ? uTop : uBot;
        if (uStr > 0.5 && h > 0.5) c = mix(uTop, uTrim, step(0.55, fract(h * 30.0)));
        float waist = 1.0 - smoothstep(0.0, 0.01, abs(h - 0.5));
        c = mix(c, c * 0.7, waist);
        vec3 q = vRest / uH * 900.0; float knit = 0.9 + 0.1 * hs(floor(q)) + 0.05 * sin(q.y * 1.3);
        diffuseColor.rgb = c * knit; }`);
  };
  mat.customProgramCacheKey = () => 'cloth' + JSON.stringify(opts);
  return mat;
}
function hairMaterial(col) {
  const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.75, metalness: 0 });
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 rest; varying vec3 vRest;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRest = rest;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vRest; float hs2(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }')
      .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= 0.75 + 0.5 * hs2(floor(vRest * 3000.0));');
  };
  mat.customProgramCacheKey = () => 'hair' + col;
  return mat;
}
