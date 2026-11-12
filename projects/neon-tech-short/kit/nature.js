// nature.js: natural dusk landscape for Neon 3D shorts (replaces the plain grid void).
// Rolling meadow (flat corridor along the camera path), distant hills, tree belts, grass patches at stations,
// flowers, fireflies, soft clouds, dusk sky with sun glow + stars. Warm low sun + cool sky fill.
// natureWorld({ z0, z1, corridor, patches: [[x,z,r],...] }) -> { update(t) }
import * as K from './core3d.js';
const { THREE } = K;

export function natureWorld({ z0 = -40, z1 = 220, corridor = 13, patches = [] } = {}) {
  const zc = (z0 + z1) / 2, L = z1 - z0 + 260;
  // sky: dusk gradient, warm glow toward the sun (+z, low), faint stars up high
  K.sky.material.fragmentShader = `varying vec3 vp;
    float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
    void main(){
      float y = clamp(vp.y, -0.2, 1.0);
      vec3 top = vec3(0.10,0.14,0.36), mid = vec3(0.42,0.36,0.66), hor = vec3(1.0,0.62,0.42);
      vec3 c = mix(hor, mid, smoothstep(0.0, 0.18, y)); c = mix(c, top, smoothstep(0.18, 0.7, y));
      float sun = pow(max(dot(normalize(vp), normalize(vec3(0.15,0.08,1.0))), 0.0), 40.0);
      c += vec3(1.0,0.75,0.45) * sun * 0.4;
      vec3 q = floor(vp * 420.0); float s = step(0.9965, h(q)) * smoothstep(0.35, 0.8, y);
      c += vec3(s);
      gl_FragColor = vec4(c, 1.0);
    }`;
  K.sky.material.needsUpdate = true;
  K.scene.fog = new THREE.FogExp2(0x7d74a6, 0.0052);
  K.renderer.toneMappingExposure = 1.15;
  K.hemi.color.set(0xa9b8ff); K.hemi.groundColor.set(0x3a4a2a); K.hemi.intensity = 1.6;
  K.moon.color.set(0xffc890); K.moon.intensity = 2.2; K.moon.position.set(30, 40, 160);
  CFG.vignette = 0.25;
  // soft front fill from the camera side (the sun is behind the scene, at +z)
  const fill = new THREE.DirectionalLight(0xdcd6ff, 0.9); fill.position.set(-10, 18, -60); K.scene.add(fill);

  // terrain: flat corridor, hills rising outside it
  const geo = new THREE.PlaneGeometry(520, L, 160, 220); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, col = [];
  const n2 = (x, z) => Math.sin(x * 0.045) * Math.cos(z * 0.038) + 0.5 * Math.sin(x * 0.11 + z * 0.07) + 0.25 * Math.sin(x * 0.31 - z * 0.23);
  const c1 = new THREE.Color(0x3f7a34), c2 = new THREE.Color(0x6f9a3a), c3 = new THREE.Color(0x2c5a3a), cc = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i) + zc, ax = Math.abs(x);
    const rise = Math.max(0, ax - corridor), hgt = Math.pow(rise, 1.35) * 0.09 + n2(x, z) * (0.25 + rise * 0.06);
    p.setY(i, hgt);
    const k = 0.5 + 0.5 * n2(x * 1.7, z * 1.7);
    cc.copy(c1).lerp(c2, k * 0.7).lerp(c3, Math.min(1, rise / 60)); col.push(cc.r, cc.g, cc.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, K.std({ vertexColors: true, roughness: 0.95 })); ground.position.z = zc; K.scene.add(ground);
  const hAt = (x, z) => { const rise = Math.max(0, Math.abs(x) - corridor); return Math.pow(rise, 1.35) * 0.09 + n2(x, z) * (0.25 + rise * 0.06); };

  // distant hills / mountains silhouettes
  const mM = K.std({ color: 0x4a4f7a, roughness: 1, flatShading: true });
  for (let i = 0; i < 26; i++) { const s = K.rnd(30, 70), m = K.mesh(new THREE.ConeGeometry(s, s * K.rnd(0.5, 0.9), 7), mM, (i % 2 ? 1 : -1) * K.rnd(120, 220), s * 0.25, K.rnd(z0, z1 + 120)); m.rotation.y = K.rnd(0, 6); }

  // trees: rounded broadleaf + a few palms/pines, merged by type into instanced meshes
  const trunkM = K.std({ color: 0x4a3324, roughness: 1 }), leafM = K.std({ color: 0xffffff, roughness: 0.85, flatShading: true });
  const trees = [];
  for (let i = 0; i < 520; i++) {
    const side = i % 2 ? 1 : -1, x = side * (corridor + 2 + Math.pow(K.rnd(0, 1), 1.6) * 110), z = K.rnd(z0 - 60, z1 + 80);
    trees.push([x, z, K.rnd(0.7, 1.5)]);
  }
  const NT = trees.length, trunks = K.instanced(new THREE.CylinderGeometry(0.22, 0.35, 4, 6).translate(0, 2, 0), trunkM, NT);
  const blobs = K.instanced(new THREE.IcosahedronGeometry(1.6, 1), leafM, NT * 3);
  trees.forEach(([x, z, s], i) => {
    const y = hAt(x, z);
    K.setInst(trunks, i, [x, y, z], s);
    for (let b = 0; b < 3; b++) {
      K.setInst(blobs, i * 3 + b, [x + (b - 1) * 0.9 * s, y + (4.2 + (b % 2) * 0.9) * s, z + ((b * 7) % 3 - 1) * 0.7 * s], s * (1.15 - (b % 2) * 0.25), b, i, 0);
      blobs.setColorAt(i * 3 + b, new THREE.Color().setHSL(K.rnd(0.22, 0.33), K.rnd(0.35, 0.55), K.rnd(0.18, 0.3)));
    }
  });

  // grass patches + flowers around stations (instanced blades sway)
  const blades = [], NB = 5200;
  const bladeM = K.std({ color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide });
  const bgeo = new THREE.ConeGeometry(0.02, 0.38, 3).translate(0, 0.19, 0);
  const fgeo = new THREE.SphereGeometry(0.07, 6, 5);
  const flowerCols = [0xff8fc8, 0xffe27a, 0xffffff, 0xc7a6ff, 0xff7a5a];
  const fl = [];
  for (const [px, pz, r] of patches) {
    const m = K.instanced(bgeo, bladeM, NB), data = [];
    for (let i = 0; i < NB; i++) {
      const a = K.rnd(0, 6.28), rr = Math.sqrt(K.rnd(0, 1)) * r, x = px + Math.cos(a) * rr, z = pz + Math.sin(a) * rr;
      data.push([x, hAt(x, z), z, K.rnd(0.7, 1.6), K.rnd(0, 6), K.rnd(-0.25, 0.25)]);
      m.setColorAt(i, new THREE.Color().setHSL(K.rnd(0.22, 0.3), K.rnd(0.4, 0.6), K.rnd(0.2, 0.36)));
    }
    blades.push([m, data]);
    for (let i = 0; i < 160; i++) { const a = K.rnd(0, 6.28), rr = Math.sqrt(K.rnd(0, 1)) * r, x = px + Math.cos(a) * rr, z = pz + Math.sin(a) * rr; fl.push([x, hAt(x, z) + 0.35, z, flowerCols[i % 5]]); }
  }
  const flowers = K.instanced(fgeo, K.std({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.15, roughness: 0.6 }), fl.length);
  fl.forEach(([x, y, z, c], i) => { K.setInst(flowers, i, [x, y, z], 1); flowers.setColorAt(i, new THREE.Color(c)); });

  // fireflies
  const NF = 420, fpos = new Float32Array(NF * 3), fdat = [];
  for (let i = 0; i < NF; i++) fdat.push([K.rnd(-22, 22), K.rnd(0.4, 5), K.rnd(z0, z1), K.rnd(0, 6.28)]);
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
  const flies = new THREE.Points(fg, new THREE.PointsMaterial({ color: 0xfff1a0, size: 0.16, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); K.scene.add(flies);

  // soft clouds
  const cloudTex = K.canvasTex(256, 128, (g) => { for (let i = 0; i < 14; i++) { const x = K.rnd(40, 216), y = K.rnd(50, 90), r = K.rnd(20, 50); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,230,240,0.55)'); gr.addColorStop(1, 'rgba(255,230,240,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 128); } });
  const clouds = [];
  for (let i = 0; i < 22; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, color: 0xffd8e8, transparent: true, opacity: 0.6, depthWrite: false, fog: false })); s.scale.set(K.rnd(60, 120), K.rnd(20, 40), 1); s.position.set(K.rnd(-200, 200), K.rnd(45, 90), K.rnd(z0 + 60, z1 + 300)); K.scene.add(s); clouds.push([s, s.position.x]); }

  return {
    heightAt: hAt,
    update(t) {
      for (const [m, data] of blades) { data.forEach(([x, y, z, s, ph, lean], i) => K.setInst(m, i, [x, y, z], s, lean + Math.sin(t * 1.8 + ph + x * 0.4) * 0.14, ph, lean * 0.5)); m.instanceMatrix.needsUpdate = true; }
      fdat.forEach(([x, y, z, ph], i) => { fpos[i * 3] = x + Math.sin(t * 0.6 + ph) * 0.8; fpos[i * 3 + 1] = y + Math.sin(t * 0.9 + ph * 2) * 0.4; fpos[i * 3 + 2] = z + Math.cos(t * 0.5 + ph) * 0.8; });
      fg.attributes.position.needsUpdate = true; flies.material.opacity = 0.6 + 0.3 * Math.sin(t * 3);
      clouds.forEach(([c, x0], i) => c.position.x = x0 + Math.sin(i) * 0.3 * t); // deterministic: parallel workers must agree
    },
  };
}
