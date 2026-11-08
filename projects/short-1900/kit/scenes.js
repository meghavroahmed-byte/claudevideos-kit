// three.js scenes: MAP (Middle East 3D), GLOBE, CITY (blast), CROWD, BARREL, RAD
let R, GLOW; const SC = {}; const DEG = Math.PI / 180;
const LON0 = 50, LAT0 = 28, KZ = 0.25, KX = 0.25 * Math.cos(28 * DEG);
const geoV = (lon, lat, y = 0) => new THREE.Vector3((lon - LON0) * KX, y, -(lat - LAT0) * KZ);
function toScreen(v, cam) { const p = v.clone().project(cam); return [(p.x + 1) / 2 * PW, (1 - p.y) / 2 * PH, p.z < 1]; }
function initGL() {
  R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); R.setPixelRatio(1); R.setSize(PW, PH);
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.outputColorSpace = THREE.SRGBColorSpace;
  const c = mk(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  GLOW = new THREE.CanvasTexture(c); GLOW.colorSpace = THREE.SRGBColorSpace;
}
function spriteGlow(color, s, additive = true) { const m = new THREE.SpriteMaterial({ map: GLOW, color, transparent: true, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false }); const sp = new THREE.Sprite(m); sp.scale.set(s, s, 1); return sp; }
function render3D(g, name, t) { const s = SC[name]; s.update(t); R.toneMapping = s.tone || THREE.NoToneMapping; R.setClearColor(0x000000, 0); R.render(s.scene, s.cam); g.drawImage(R.domElement, 0, 0); }
function lights(sc, o = {}) {
  const h = new THREE.HemisphereLight(o.sky || '#ffffff', o.ground || '#b9d6cf', o.hi || 1.6); sc.add(h);
  const d = new THREE.DirectionalLight(o.dcol || '#fff6ea', o.di || 2.6); d.castShadow = true; d.shadow.mapSize.set(4096, 4096); const S = o.sb || 12; Object.assign(d.shadow.camera, { left: -S, right: S, top: S, bottom: -S, near: 0.5, far: 80 }); d.shadow.bias = -0.0004; d.shadow.radius = 4; sc.add(d); sc.add(d.target); return { h, d };
}
const C = c => new THREE.Color(c);

// ======================= MAP =======================
let FC; // GeoJSON countries
async function buildMap() {
  const topo = await (await fetch('../node_modules/world-atlas/countries-50m.json')).json(); FC = topojson.feature(topo, topo.objects.countries);
  const sc = new THREE.Scene(); const bg = C('#e3f3f0'); sc.background = bg.clone(); sc.fog = new THREE.Fog(bg.clone(), 16, 40);
  const L = lights(sc, { sb: 9 });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: '#bfe2dd', roughness: 1 })); sea.rotation.x = -Math.PI / 2; sea.receiveShadow = true; sc.add(sea);
  const CO = {};
  FC.features.forEach(f => {
    const name = f.properties.name; if (!f.geometry) return; const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    const shapes = [], rings = [];
    polys.forEach(poly => {
      const r0 = poly[0]; let a = 1e9, b = -1e9, c = 1e9, d = -1e9; r0.forEach(([lo, la]) => { a = Math.min(a, lo); b = Math.max(b, lo); c = Math.min(c, la); d = Math.max(d, la); });
      if (b < 8 || a > 92 || d < -8 || c > 56) return; if (r0.length < 4) return;
      const sh = new THREE.Shape(r0.map(([lo, la]) => new THREE.Vector2((lo - LON0) * KX, (la - LAT0) * KZ)));
      poly.slice(1).forEach(h => sh.holes.push(new THREE.Path(h.map(([lo, la]) => new THREE.Vector2((lo - LON0) * KX, (la - LAT0) * KZ))))); shapes.push(sh); rings.push(r0);
    });
    if (!shapes.length) return;
    const top = new THREE.MeshStandardMaterial({ color: '#f7f4ee', roughness: 0.85 }), side = new THREE.MeshStandardMaterial({ color: '#d6ccbb', roughness: 0.9 });
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: 0.06, bevelEnabled: false, curveSegments: 1 }); const m = new THREE.Mesh(geo, [top, side]); m.rotation.x = -Math.PI / 2; m.castShadow = true; m.receiveShadow = true; sc.add(m);
    const lm = new THREE.LineBasicMaterial({ color: '#c3b49c', transparent: true, opacity: 0.9 });
    rings.forEach(r => { const pts = r.map(([lo, la]) => new THREE.Vector3((lo - LON0) * KX, (la - LAT0) * KZ, 0.0615)); m.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lm)); });
    CO[name] = { m, top, side, lm };
  });
  console.log('map countries: ' + Object.keys(CO).length + ' iran=' + !!CO['Iran']);
  // bomb
  const bomb = new THREE.Group(); const prof = [[0, 0], [0.05, 0.02], [0.1, 0.08], [0.13, 0.18], [0.14, 0.3], [0.14, 0.62], [0.12, 0.72], [0.07, 0.8], [0.05, 0.84]].map(([r, y]) => new THREE.Vector2(r, y));
  const bm = new THREE.MeshStandardMaterial({ color: '#4d5544', metalness: 0.45, roughness: 0.45 }); const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), bm); body.castShadow = true; bomb.add(body);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.143, 0.143, 0.05, 48), new THREE.MeshStandardMaterial({ color: '#f2c230', roughness: 0.5 })); band.position.y = 0.4; bomb.add(band);
  for (let i = 0; i < 4; i++) { const fin = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.2, 0.14), bm); fin.position.set(Math.cos(i * Math.PI / 2) * 0.1, 0.84, Math.sin(i * Math.PI / 2) * 0.1); fin.rotation.y = -i * Math.PI / 2; fin.castShadow = true; bomb.add(fin); }
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 8, 40), bm); tail.rotation.x = Math.PI / 2; tail.position.y = 0.9; bomb.add(tail);
  bomb.scale.setScalar(1.0); sc.add(bomb);
  const sP0 = geoV(41, 37.5, 4.8), eP0 = geoV(53.6, 32.4, 0.45); const TRAIL = []; for (let i = 0; i < 18; i++) { const sp = spriteGlow('#e9e3dc', 0.3, false); sp.material.opacity = 0; sc.add(sp); TRAIL.push(sp); }
  const rings = []; for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 72), new THREE.MeshBasicMaterial({ color: '#e5392f', transparent: true, depthWrite: false, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; sc.add(r); rings.push(r); }
  // missiles
  const ROUTES = [[[50.9, 34.6], [51.31, 25.12], 'base'], [[48.7, 31.3], [47.52, 29.35], 'base'], [[46.3, 37.6], [42.44, 33.8], 'base'], [[56.3, 27.2], [54.55, 24.25], 'base'], [[51.5, 32.6], [50.6, 26.22], 'base'], [[47.0, 34.3], [34.9, 31.8], 'ally'], [[49.5, 30.5], [47.58, 24.06], 'ally'], [[47.8, 36.5], [44.0, 36.24], 'base']];
  const MS = ROUTES.map(([a, b, kind], i) => {
    const s = geoV(a[0], a[1], 0.07), e = geoV(b[0], b[1], 0.07), dist = s.distanceTo(e), mid = s.clone().lerp(e, 0.5); mid.y += dist * 0.45 + 0.2;
    const curve = new THREE.QuadraticBezierCurve3(s, mid, e); const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.018, 8, false), new THREE.MeshBasicMaterial({ color: '#ff5a36', transparent: true, opacity: 0.95 })); sc.add(tube);
    const smoke = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.05, 8, false), new THREE.MeshBasicMaterial({ color: '#d9d2cb', transparent: true, opacity: 0.4, depthWrite: false })); sc.add(smoke); const flash = spriteGlow('#fff1b0', 0.8); flash.position.copy(s); sc.add(flash);
    const head = spriteGlow('#ffcf7a', 0.5); sc.add(head); const boom = spriteGlow('#ff7a2a', 1); sc.add(boom);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48), new THREE.MeshBasicMaterial({ color: '#ff5a36', transparent: true, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.copy(e); ring.position.y = 0.075; sc.add(ring);
    const pin = new THREE.Group(); const pc = kind === 'base' ? '#2f6fe0' : '#13a08a';
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8), new THREE.MeshStandardMaterial({ color: '#ffffff' })); stick.position.y = 0.16; const ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 14), new THREE.MeshStandardMaterial({ color: pc, roughness: 0.3 })); ball.position.y = 0.34; stick.castShadow = ball.castShadow = true; pin.add(stick, ball); pin.position.copy(e); pin.position.y = 0.06; sc.add(pin);
    return { curve, tube, smoke, flash, head, boom, ring, pin, e, kind, b, i, n: tube.geometry.index.count };
  });
  // fire / smoke for war
  const FIRES = []; const warLand = [[44, 33], [42, 35.5], [38.5, 35], [36.5, 31.5], [35, 31.6], [45, 24.5], [47.6, 29.3], [51.2, 25.3], [54.4, 24.4], [50.5, 26], [47, 15.5], [52, 33], [49, 31], [56, 27.2], [36, 33.9], [43.5, 36.2], [40, 27], [45.5, 21], [57.5, 22], [33.5, 30]];
  warLand.forEach(([lo, la], i) => { const f = spriteGlow(i % 3 ? '#ff7a2a' : '#ffb347', 0.6); f.position.copy(geoV(lo, la, 0.15)); sc.add(f); const sm = spriteGlow('#5a4d48', 0.8, false); sm.position.copy(geoV(lo, la, 0.4)); sc.add(sm); FIRES.push({ f, sm, i, lo, la }); });
  const warSet = ['Iraq', 'Syria', 'Israel', 'Jordan', 'Lebanon', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Bahrain', 'United Arab Emirates', 'Oman', 'Yemen', 'Palestine', 'Turkey', 'Egypt', 'Iran'];
  // hormuz lane + tankers + barrier
  const lane = new THREE.CatmullRomCurve3([[51.5, 27.0], [54.0, 26.6], [55.6, 26.55], [56.35, 26.5], [56.8, 26.15], [57.3, 25.6], [58.2, 24.95], [59.5, 24.3]].map(([lo, la]) => geoV(lo, la, 0.012)));
  const lanePts = lane.getPoints(200); const laneLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(lanePts), new THREE.LineDashedMaterial({ color: '#ffffff', dashSize: 0.05, gapSize: 0.035 })); laneLine.computeLineDistances(); sc.add(laneLine);
  const wc = mk(256, 64), wg = wc.getContext('2d'), wgr = wg.createLinearGradient(0, 0, 256, 0); wgr.addColorStop(0, 'rgba(255,255,255,0)'); wgr.addColorStop(1, 'rgba(255,255,255,0.85)'); wg.fillStyle = wgr; wg.beginPath(); wg.moveTo(0, 0); wg.lineTo(256, 22); wg.lineTo(256, 42); wg.lineTo(0, 64); wg.fill(); const wakeT = new THREE.CanvasTexture(wc);
  const TK = []; for (let i = 0; i < 5; i++) { const tk = tanker(); const wake = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), new THREE.MeshBasicMaterial({ map: wakeT, transparent: true, depthWrite: false })); wake.rotation.x = -Math.PI / 2; wake.position.set(-1.65, 0.01, 0); tk.add(wake); tk.scale.setScalar(0.13); sc.add(tk); TK.push(tk); }
  const barrier = new THREE.Group(); const wall = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.5), new THREE.MeshStandardMaterial({ color: '#e5392f', emissive: '#7a0f08', transparent: true, opacity: 0.88 })); wall.position.y = 0.11; wall.castShadow = true; barrier.add(wall);
  for (let i = -1; i <= 1; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.07), new THREE.MeshStandardMaterial({ color: '#ffffff' })); st.position.set(0.02, 0.17, i * 0.14); barrier.add(st); }
  barrier.position.copy(geoV(56.42, 26.42, 0)); const tan = lane.getTangent(0.45); barrier.rotation.y = Math.atan2(-tan.z, tan.x); sc.add(barrier);

  const cam = new THREE.PerspectiveCamera(30, PW / PH, 0.05, 200);
  const cIran = C('#e0453a'), cIranS = C('#9e2a22'), cLand = C('#f7f4ee'), cSide = C('#d6ccbb'), cWar = C('#e8784f'), cWarS = C('#9a4a32'), bgL = C('#e3f3f0'), bgW = C('#3d3033');
  const s = SC.map = {
    scene: sc, cam, CO, MS, TK, lane, laneLine, barrier, bomb, rings, L, FIRES,
    keys: [], A: {},
    update(t) {
      const A = s.A;
      // camera
      const g = s.keys.find(k => t >= k[0] && t < k[1]) || s.keys[s.keys.length - 1]; const u = ease(seg(t, g[0], g[1])); const k = g[2].map((v, i) => lerp(v, g[3][i], u));
      const tg = geoV(k[0], k[1], 0), p = k[3] * DEG, y = k[4] * DEG; cam.position.set(tg.x + Math.sin(y) * Math.cos(p) * k[2], Math.sin(p) * k[2], tg.z + Math.cos(y) * Math.cos(p) * k[2]); cam.lookAt(tg);
      L.d.position.set(tg.x - 5, 12, tg.z + 6); L.d.target.position.copy(tg); const sb = Math.max(2.5, k[2] * 0.8); Object.assign(L.d.shadow.camera, { left: -sb, right: sb, top: sb, bottom: -sb }); L.d.shadow.camera.updateProjectionMatrix();
      // war mood
      const war = t >= A.war && t < A.hor ? ease(seg(t, A.war, A.war + 1.2)) : 0;
      sc.background.lerpColors(bgL, bgW, war * 0.85); sc.fog.color.copy(sc.background); L.d.intensity = lerp(2.6, 1.6, war); L.h.intensity = lerp(1.6, 0.7, war); L.d.color.lerpColors(C('#fff6ea'), C('#ffb37a'), war);
      for (const n in CO) { const c = CO[n]; c.top.color.copy(cLand); c.side.color.copy(cSide); c.m.scale.z = 1; }
      // iran
      const ki = ease(seg(t, A.iran - 0.3, A.iran + 0.5)), ir = CO['Iran']; const kh = t >= A.hor ? 0.55 : 1; ir.top.color.lerpColors(cLand, cIran, ki * kh); ir.side.color.lerpColors(cSide, cIranS, ki * kh); ir.m.scale.z = 1 + 1.2 * ki * (t < A.hor ? 1 : 0);
      if (war > 0) warSet.forEach((n, i) => { const c = CO[n]; if (!c || n === 'Iran') return; const kk = clamp(seg(t, A.war + 0.2, A.yud + 0.4) * 1.8 - i * 0.07); c.top.color.lerpColors(cLand, cWar, kk); c.side.color.lerpColors(cSide, cWarS, kk); });
      // bomb
      const inB = t > A.bomb - 0.1 && t < A.b3e + 0.05; bomb.visible = inB; if (inB) { const ub = easeOut(seg(t, A.bomb - 0.1, A.b3e)), sP = geoV(41, 37.5, 4.8), eP = geoV(53.6, 32.4, 0.45); const pos = sP.clone().lerp(eP, ub); pos.y = lerp(sP.y, eP.y, ub) + Math.sin(t * 3) * 0.02; bomb.position.copy(pos); const v = eP.clone().sub(sP).normalize(); const dir = v.clone().lerp(new THREE.Vector3(0, -1, 0), ub * 0.85).normalize(); bomb.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir); }
      TRAIL.forEach((sp, j) => { sp.visible = inB; if (!inB) return; const uj = easeOut(seg(t - j * 0.06, A.bomb - 0.1, A.b3e)); const p = sP0.clone().lerp(eP0, uj); p.y = lerp(sP0.y, eP0.y, uj) + 0.35; sp.position.copy(p); sp.scale.setScalar(0.18 + j * 0.035); sp.material.opacity = (1 - j / 18) * 0.55 * (uj > 0 ? 1 : 0); });
      rings.forEach((r, i) => { const on = t > A.iran && t < A.b3e + 0.05; r.visible = on; if (!on) return; const ph = (t * 0.7 + i / 3) % 1; r.position.copy(geoV(53.6, 32.4, 0.14)); r.scale.setScalar(0.25 + ph * 1.3); r.material.opacity = (1 - ph) * 0.9 * ki; });
      // missiles + pins
      MS.forEach(m => {
        const on = t > A.pal - 0.1 && t < A.war + 0.05; m.tube.visible = m.smoke.visible = m.head.visible = m.boom.visible = m.ring.visible = m.pin.visible = on && t >= A.pal; m.flash.visible = false; if (!on) return;
        const t0 = A.pal + 0.2 + m.i * 0.32, km = seg(t, t0, t0 + 1.5), ek = ease(km); m.tube.geometry.setDrawRange(0, Math.floor(ek * 80) * 8 * 6); m.smoke.geometry.setDrawRange(0, Math.floor(ease(seg(t, t0 + 0.08, t0 + 1.6)) * 80) * 8 * 6); m.smoke.material.opacity = 0.4 * (1 - seg(t, t0 + 2, t0 + 4) * 0.6); m.head.position.copy(m.curve.getPoint(Math.max(0.001, ek))); m.head.visible = km > 0 && km < 1; m.tube.material.opacity = 0.95;
        const kf = seg(t, t0, t0 + 0.35); m.flash.visible = kf > 0 && kf < 1; m.flash.scale.setScalar(0.3 + kf * 1.1); m.flash.material.opacity = 1 - kf;
        const kb = seg(t, t0 + 1.5, t0 + 2.3); m.boom.position.copy(m.e); m.boom.position.y = 0.12; m.boom.visible = kb > 0 && kb < 1; m.boom.scale.setScalar(0.2 + easeOut(kb) * 1.4); m.boom.material.opacity = 1 - kb;
        m.ring.visible = kb > 0 && kb < 1; m.ring.scale.setScalar(0.05 + easeOut(kb) * 0.5); m.ring.material.opacity = 1 - kb;
        const tp = (m.kind === 'base' ? A.base : A.ally) + (m.i % 4) * 0.1 - 0.6, kp = seg(t, tp, tp + 0.55); const bnc = kp < 1 ? (kp < 0.7 ? 1 - (kp / 0.7) ** 2 : Math.sin((kp - 0.7) / 0.3 * Math.PI) * 0.12) : 0; m.pin.visible = m.pin.visible && kp > 0; m.pin.position.y = 0.06 + bnc * 1.8; m.pin.scale.setScalar(1);
      });
      // fires
      FIRES.forEach(F => { const kk = war > 0 ? clamp(seg(t, A.war + 0.3, A.yud + 0.6) * 1.7 - (F.i % 10) * 0.08) : 0; F.f.visible = F.sm.visible = kk > 0; if (kk <= 0) return; const fl = 0.8 + 0.25 * Math.sin(t * 13 + F.i * 3) + 0.15 * Math.sin(t * 29 + F.i); F.f.scale.setScalar(0.55 * kk * fl); F.f.material.opacity = 0.95 * kk; const rs = ((t * 0.25 + F.i * 0.137) % 1); F.sm.position.copy(geoV(F.lo, F.la, 0.25 + rs * 0.7)); F.sm.scale.setScalar((0.4 + rs * 0.9) * kk); F.sm.material.opacity = (1 - rs) * 0.55 * kk; });
      // hormuz
      const hz = t >= A.hor; laneLine.visible = hz; if (hz) laneLine.geometry.setDrawRange(0, Math.floor(201 * ease(seg(t, A.hor + 0.4, A.hor + 2.0))));
      const tkOn = t >= A.hor + 1.2; const t0 = A.hor + 1.2, tc = A.close + 0.2; const tt = t < tc ? t : tc + (1 - Math.exp(-(t - tc) * 3)) / 3;
      TK.forEach((tk, i) => { tk.visible = tkOn; if (!tkOn) return; const uu = clamp(0.12 + i * 0.16 + (tt - t0) * 0.03 - (i % 2) * 0.05, 0, 0.98); const p = s.lane.getPoint(uu), d = s.lane.getTangent(uu); tk.position.set(p.x + (i % 2 ? 0.035 : -0.035), 0, p.z); tk.rotation.y = Math.atan2(-d.z, d.x); tk.position.y = Math.sin(t * 2 + i) * 0.004; });
      barrier.visible = t > A.close - 0.05 && t < A.price + 0.1; barrier.scale.set(1, Math.max(0.001, easeOutBack(seg(t, A.close, A.close + 0.5))), 1);
    }
  };
}
function tanker() {
  const g = new THREE.Group(); const sh = new THREE.Shape([[-0.5, -0.1], [0.36, -0.1], [0.5, 0], [0.36, 0.1], [-0.5, 0.1]].map(([x, y]) => new THREE.Vector2(x, y)));
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: false }), [new THREE.MeshStandardMaterial({ color: '#b5372e', roughness: 0.6 }), new THREE.MeshStandardMaterial({ color: '#2b2f36', roughness: 0.7 })]); hull.rotation.x = -Math.PI / 2; hull.castShadow = true; g.add(hull);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.025, 0.06), new THREE.MeshStandardMaterial({ color: '#59606a' })); deck.position.set(-0.02, 0.11, 0); g.add(deck);
  const sup = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.13, 0.16), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 })); sup.position.set(-0.4, 0.16, 0); sup.castShadow = true; g.add(sup);
  const fun = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.09, 12), new THREE.MeshStandardMaterial({ color: '#e5392f' })); fun.position.set(-0.45, 0.26, 0); g.add(fun);
  return g;
}

// ======================= GLOBE =======================
function buildGlobe() {
  const W = 4096, H = 2048, c = mk(W, H), g = c.getContext('2d'); const og = g.createLinearGradient(0, 0, 0, H); og.addColorStop(0, '#9fd2cd'); og.addColorStop(0.5, '#bfe6e1'); og.addColorStop(1, '#9fd2cd'); g.fillStyle = og; g.fillRect(0, 0, W, H);
  const X = lo => (lo + 180) / 360 * W, Y = la => (90 - la) / 180 * H;
  FC.features.forEach(f => { if (!f.geometry) return; const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates; const iran = f.properties.name === 'Iran';
    g.beginPath(); polys.forEach(poly => poly.forEach(r => { let pl = null; r.forEach(([lo, la], i) => { if (i === 0 || Math.abs(lo - pl) > 180) g.moveTo(X(lo), Y(la)); else g.lineTo(X(lo), Y(la)); pl = lo; }); g.closePath(); }));
    g.fillStyle = iran ? '#e0453a' : '#f7f4ee'; g.fill('evenodd'); g.strokeStyle = iran ? '#9e2a22' : '#c3b49c'; g.lineWidth = 2; g.stroke(); });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const sc = new THREE.Scene(); const L = lights(sc, { hi: 1.4, di: 2.4, sky: '#ffffff', ground: '#6d7a99' }); L.d.castShadow = false; L.d.position.set(-6, 5, 8);
  const outer = new THREE.Group(), inner = new THREE.Group(); outer.add(inner); sc.add(outer);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(2, 160, 120), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })); inner.add(globe);
  const dirOf = (L, la) => new THREE.Vector3(Math.cos(la * DEG) * Math.cos(L * DEG), Math.sin(la * DEG), -Math.cos(la * DEG) * Math.sin(L * DEG));
  const shell = new THREE.Mesh(new THREE.SphereGeometry(2.02, 160, 120), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { c: { value: dirOf(53.5, 32.4) }, r: { value: 0 }, col: { value: C('#ff3b2f') } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 c; uniform float r; uniform vec3 col; varying vec3 vP; void main(){ if (r < 0.001) discard; float d = acos(clamp(dot(vP, c), -1.0, 1.0)); float fill = (1.0 - smoothstep(r - 0.04, r, d)) * 0.42; float edge = (1.0 - smoothstep(0.0, 0.03, abs(d - r))) * 0.95; gl_FragColor = vec4(col, max(fill, edge)); }'
  })); inner.add(shell);
  const CITY = { dc: [-77, 38.9], teh: [51.4, 35.7], mos: [37.6, 55.75], bei: [116.4, 39.9], tlv: [34.8, 32.1], lon: [-0.1, 51.5], del: [77.2, 28.6], riy: [46.7, 24.7], ber: [13.4, 52.5] };
  const PAIRS = [['dc', 'teh'], ['teh', 'tlv'], ['mos', 'teh'], ['bei', 'teh'], ['lon', 'teh'], ['dc', 'mos'], ['bei', 'dc'], ['riy', 'teh'], ['ber', 'mos']];
  const ARCS = PAIRS.map(([a, b], i) => { const A = dirOf(...CITY[a]), B = dirOf(...CITY[b]), ang = A.angleTo(B); const pts = []; for (let k = 0; k <= 64; k++) { const s = k / 64; const v = new THREE.Vector3().copy(A).multiplyScalar(Math.sin((1 - s) * ang) / Math.sin(ang)).add(B.clone().multiplyScalar(Math.sin(s * ang) / Math.sin(ang))); v.normalize().multiplyScalar(2 * (1 + 0.22 * ang * Math.sin(Math.PI * s))); pts.push(v); }
    const curve = new THREE.CatmullRomCurve3(pts); const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.016, 6, false), new THREE.MeshBasicMaterial({ color: '#ff4a36', transparent: true })); inner.add(m); const h = spriteGlow('#ffd08a', 0.35); inner.add(h); return { m, h, curve, i }; });
  Object.values(CITY).forEach(([lo, la]) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), new THREE.MeshBasicMaterial({ color: '#ffffff' })); d.position.copy(dirOf(lo, la).multiplyScalar(2.01)); inner.add(d); });
  const cam = new THREE.PerspectiveCamera(30, PW / PH, 0.1, 100); cam.position.set(0, 0, 16);
  const s = SC.globe = {
    scene: sc, cam, inner, outer, shell, ARCS, A: {}, view: null,
    update(t) {
      const A = s.A; let lon, lat, z, oy = 0;
      if (s.view) [lon, lat, z] = s.view; else if (t < A.g2) { const u = ease(seg(t, A.g1, A.g2)); lon = lerp(15, 40, u); lat = lerp(22, 28, u); z = lerp(17.5, 15.5, u); } else { const u = ease(seg(t, A.g2, A.face)); lon = lerp(40, 53.5, u); lat = lerp(28, 30, u); z = lerp(15.5, 13.2, u); }
      inner.rotation.y = (-90 - lon) * DEG; outer.rotation.x = lat * DEG; cam.position.set(0, oy, z); cam.lookAt(0, 0, 0);
      ARCS.forEach(a => { const t0 = A.g1 + 0.3 + a.i * 0.38, k = ease(seg(t, t0, t0 + 1.3)); a.m.geometry.setDrawRange(0, Math.floor(k * 96) * 6 * 6); a.h.visible = k > 0 && k < 1; a.h.position.copy(a.curve.getPoint(Math.max(0.001, k))); a.m.material.opacity = t > A.g2 ? 1 - seg(t, A.g2, A.g2 + 0.6) * 0.7 : 1; });
      let r = 0; if (t >= A.g2 && !s.view) { r = lerp(0, 0.2, easeOut(seg(t, A.only, A.only + 0.4))) + (Math.PI - 0.2) * ease(seg(t, A.notIran, A.face + 0.2)); } if (s.view) r = s.view[3]; shell.material.uniforms.r.value = r;
    }
  };
}

// ======================= CITY (blast) =======================
function buildCity() {
  const sc = new THREE.Scene(); const sky = mk(16, 512), sg = sky.getContext('2d'), gr = sg.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#120f2e'); gr.addColorStop(0.55, '#3d2557'); gr.addColorStop(0.82, '#a24a5a'); gr.addColorStop(1, '#e88a4c'); sg.fillStyle = gr; sg.fillRect(0, 0, 16, 512);
  const skyT = new THREE.CanvasTexture(sky); skyT.colorSpace = THREE.SRGBColorSpace; sc.background = skyT; sc.fog = new THREE.Fog('#3a2448', 45, 150);
  const hemi = new THREE.HemisphereLight('#7a6cc0', '#20161f', 0.9); sc.add(hemi); const blast = new THREE.DirectionalLight('#ffb070', 0); blast.position.set(0, 25, -95); sc.add(blast); const moon = new THREE.DirectionalLight('#a9b8ff', 0.6); moon.position.set(10, 20, 10); sc.add(moon);
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ color: '#1a1420', roughness: 1 })); gnd.rotation.x = -Math.PI / 2; sc.add(gnd);
  const winTex = []; for (let v = 0; v < 3; v++) { const c = mk(128, 256), g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 128, 256); for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { const on = hash(v * 100 + y * 7 + x) > 0.45; g.fillStyle = on ? (hash(y + x * 3 + v) > 0.5 ? '#ffc56b' : '#ffe0a0') : '#141022'; g.fillRect(10 + x * 30, 10 + y * 30, 16, 18); } const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; winTex.push(tx); }
  const mats = winTex.map(tx => new THREE.MeshStandardMaterial({ color: '#2b2340', emissive: '#ffffff', emissiveMap: tx, emissiveIntensity: 0.9, roughness: 0.9 }));
  const BLD = []; for (let i = 0; i < 170; i++) { const z = -10 - hash(i + 50) * 42, x = (hash(i) - 0.5) * (14 + (-z) * 1.1), w = 0.9 + hash(i + 9) * 2, d = 0.9 + hash(i + 13) * 1.8, h = 1 + hash(i + 3) * 3.5 + (-z / 42) * 4 * hash(i + 21);
    const geo = new THREE.BoxGeometry(w, h, d); const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * w / 0.55, uv.getY(k) * h / 1.0); const b = new THREE.Mesh(geo, mats[i % 3]); b.position.set(x, h / 2, z); sc.add(b); BLD.push(b); }
  // mushroom cloud
  const cloud = new THREE.Group(); cloud.position.set(0, 0, -85); sc.add(cloud); const cm = new THREE.MeshStandardMaterial({ color: '#c79a76', emissive: '#ff6a1a', emissiveIntensity: 3, roughness: 1, flatShading: false });
  const PUFF = []; const sg2 = new THREE.IcosahedronGeometry(1, 2);
  for (let i = 0; i < 46; i++) { const m = new THREE.Mesh(sg2, cm); cloud.add(m); PUFF.push({ m, kind: 'stem', a: hash(i) * 6.28, u: i / 46, r: 1.6 + hash(i + 3) * 1.2 }); }
  for (let i = 0; i < 90; i++) { const m = new THREE.Mesh(sg2, cm); cloud.add(m); PUFF.push({ m, kind: 'cap', a: i / 90 * 6.28 * 3 + hash(i) * 0.3, u: hash(i + 7), r: 2.2 + hash(i + 5) * 1.6 }); }
  for (let i = 0; i < 50; i++) { const m = new THREE.Mesh(sg2, cm); cloud.add(m); PUFF.push({ m, kind: 'skirt', a: i / 50 * 6.28 + hash(i) * 0.2, u: hash(i + 11), r: 1.4 + hash(i + 2) * 1.4 }); }
  const fire = spriteGlow('#ffcf8a', 30); fire.position.set(0, 6, -82); sc.add(fire);
  const wave = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 96), new THREE.MeshBasicMaterial({ color: '#ffb070', transparent: true, depthWrite: false, side: THREE.DoubleSide })); wave.rotation.x = -Math.PI / 2; wave.position.set(0, 0.05, -85); sc.add(wave);
  const cam = new THREE.PerspectiveCamera(42, PW / PH, 0.1, 300);
  const s = SC.city = {
    scene: sc, cam, tone: THREE.ACESFilmicToneMapping, A: {},
    update(t) {
      const A = s.A, lt = t - A.c0, kb = seg(t, A.blast, A.blast + 3.4), eb = easeOut(kb), fl = Math.exp(-Math.max(0, t - A.blast) * 2.2) * (t >= A.blast ? 1 : 0);
      const sh = t >= A.blast ? Math.exp(-(t - A.blast) * 1.6) * 0.18 : 0; cam.position.set(Math.sin(t * 47) * sh * 2, 6.5 + Math.cos(t * 39) * sh * 2, lerp(13, 9, ease(clamp(lt / 4)))); cam.lookAt(0, lerp(7, 13, eb), -80);
      cloud.visible = fire.visible = t >= A.blast; blast.intensity = t >= A.blast ? 1.2 + fl * 9 : 0; hemi.color.lerpColors(C('#7a6cc0'), C('#ff9a5a'), clamp(eb + fl)); hemi.intensity = 0.9 + fl * 2;
      cm.emissiveIntensity = lerp(4, 0.25, easeOut(seg(t, A.blast, A.blast + 3))); cm.emissive.lerpColors(C('#ff6a1a'), C('#7a2a10'), kb);
      const H = 5 + eb * 30, CR = 3 + eb * 12;
      PUFF.forEach(p => { if (p.kind === 'stem') { const yy = p.u * H; p.m.position.set(Math.cos(p.a) * (1.1 + 0.4 * eb), yy, Math.sin(p.a) * (1.1 + 0.4 * eb)); p.m.scale.setScalar(1.4 * p.r * (0.6 + 0.6 * eb) * (0.8 + 0.3 * Math.sin(t * 2 + p.a))); }
        else if (p.kind === 'cap') { const ring = CR * (0.55 + 0.45 * p.u); p.m.position.set(Math.cos(p.a) * ring, H + Math.sin(p.u * 6.28) * 1.6 * (0.5 + eb) + (1 - p.u) * 2.5 * eb, Math.sin(p.a) * ring * 0.8); p.m.scale.setScalar(1.4 * p.r * (0.5 + 1.1 * eb)); }
        else { const ring = (1.5 + eb * 20) * (0.7 + 0.3 * p.u); p.m.position.set(Math.cos(p.a) * ring, 0.6 + p.u * 1.5 * eb, Math.sin(p.a) * ring * 0.6); p.m.scale.setScalar(p.r * (0.4 + 0.9 * eb)); } });
      fire.material.opacity = 0.6 * fl + 0.25 * (1 - kb); fire.position.y = H * 0.9; fire.scale.setScalar(20 + 30 * fl);
      const kw = seg(t, A.blast, A.blast + 2.8); wave.visible = kw > 0 && kw < 1; wave.scale.setScalar(2 + easeOut(kw) * 70); wave.material.opacity = (1 - kw) * 0.8;
    }
  };
}

// ======================= CROWD =======================
function buildCrowd() {
  const sc = new THREE.Scene(); const bg = C('#e3f3f0'); sc.background = bg; sc.fog = new THREE.Fog(bg, 12, 26); const L = lights(sc, { sb: 8 }); L.d.position.set(-4, 10, 5);
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#d4ece7', roughness: 1 })); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = true; sc.add(gnd);
  const N = 15 * 13, bodyG = new THREE.CapsuleGeometry(0.13, 0.32, 4, 14), headG = new THREE.SphereGeometry(0.115, 20, 14);
  const bodyM = new THREE.MeshStandardMaterial({ roughness: 0.6 }), headM = new THREE.MeshStandardMaterial({ roughness: 0.55 });
  const body = new THREE.InstancedMesh(bodyG, bodyM, N), head = new THREE.InstancedMesh(headG, headM, N); body.castShadow = head.castShadow = true; sc.add(body, head);
  const shirts = ['#4f86c6', '#f2a541', '#e86a5a', '#5bb58c', '#8e6cc2', '#f4d35e', '#3c9fb3', '#ef8fa3'].map(C), skins = ['#e8b892', '#c98e66', '#a8714f', '#f0c7a1'].map(C);
  const P0 = []; for (let i = 0; i < N; i++) { const gx = i % 15 - 7, gz = Math.floor(i / 15) - 6; P0.push({ x: gx * 0.52 + (hash(i) - 0.5) * 0.18, z: gz * 0.52 + (hash(i + 4) - 0.5) * 0.18, sc: 0.9 + hash(i + 8) * 0.25, sh: shirts[i % 8], sk: skins[Math.floor(hash(i + 2) * 4)] }); }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 96), new THREE.MeshBasicMaterial({ color: '#e5392f', transparent: true, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; sc.add(ring);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 96), new THREE.MeshBasicMaterial({ color: '#e5392f', transparent: true, opacity: 0.12, depthWrite: false })); disc.rotation.x = -Math.PI / 2; disc.position.y = 0.005; sc.add(disc);
  const cam = new THREE.PerspectiveCamera(32, PW / PH, 0.1, 100); const M = new THREE.Matrix4(), q = new THREE.Quaternion(), grey = C('#a3a9ad'), tmp = new THREE.Color();
  const s = SC.crowd = {
    scene: sc, cam, A: {},
    update(t) {
      const A = s.A, lt = t - A.c0; const a = lerp(-0.25, 0.2, ease(clamp(lt / 4))); cam.position.set(Math.sin(a) * 6, 10.5, Math.cos(a) * 6.8); cam.lookAt(0, 0, 0.6);
      const rw = 5.2 * ease(seg(t, A.loss, A.loss + 2.2)); ring.scale.setScalar(Math.max(0.01, rw)); disc.scale.setScalar(Math.max(0.01, rw)); ring.visible = disc.visible = rw > 0.02;
      P0.forEach((p, i) => { const d = Math.hypot(p.x, p.z), hit = clamp((rw - d) / 0.8), gone = clamp((rw - d - 0.8) / 1.4); const bob = Math.abs(Math.sin(t * 3 + i)) * 0.02 * (1 - hit); const s2 = p.sc * (1 - gone * 0.18);
        M.compose(new THREE.Vector3(p.x, (0.29 + bob) * s2, p.z), q, new THREE.Vector3(s2, s2, s2)); body.setMatrixAt(i, M); M.compose(new THREE.Vector3(p.x, (0.62 + bob) * s2, p.z), q, new THREE.Vector3(s2, s2, s2)); head.setMatrixAt(i, M);
        body.setColorAt(i, tmp.copy(p.sh).lerp(grey, hit)); head.setColorAt(i, tmp.copy(p.sk).lerp(grey, hit)); });
      body.instanceMatrix.needsUpdate = head.instanceMatrix.needsUpdate = true; body.instanceColor.needsUpdate = head.instanceColor.needsUpdate = true;
    }
  };
}

// ======================= BARREL =======================
function buildBarrel() {
  const sc = new THREE.Scene(); const L = lights(sc, { sb: 5 }); L.d.position.set(-4, 8, 6);
  const shadowP = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.22 })); shadowP.rotation.x = -Math.PI / 2; shadowP.receiveShadow = true; sc.add(shadowP);
  const b = new THREE.Group(); const red = new THREE.MeshStandardMaterial({ color: '#d6332b', metalness: 0.35, roughness: 0.35 }), dark = new THREE.MeshStandardMaterial({ color: '#8f1f19', metalness: 0.4, roughness: 0.4 });
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.5, 64), red); cyl.castShadow = true; b.add(cyl);
  [-0.42, 0.42, -1.2, 1.2].forEach(y => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.045, 12, 64), dark); r.rotation.x = Math.PI / 2; r.position.y = y; b.add(r); });
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 0.02, 64), dark); lid.position.y = 1.255; b.add(lid); const bung = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 24), new THREE.MeshStandardMaterial({ color: '#ddd', metalness: 0.6, roughness: 0.3 })); bung.position.set(0.45, 1.28, 0.1); b.add(bung);
  const lc = mk(512, 160), lg = lc.getContext('2d'); lg.fillStyle = '#f7f4ee'; lg.fillRect(0, 0, 512, 160); lg.fillStyle = '#1d2326'; lg.font = "800 92px 'AnekV', 'Nirmala UI'"; lg.textAlign = 'center'; lg.textBaseline = 'middle'; lg.fillText('OIL', 256, 86);
  const lt = new THREE.CanvasTexture(lc); lt.colorSpace = THREE.SRGBColorSpace; const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.905, 0.905, 0.5, 64, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: lt, roughness: 0.6 })); b.add(lab);
  sc.add(b); const cam = new THREE.PerspectiveCamera(32, PW / PH, 0.1, 100);
  const s = SC.barrel = {
    scene: sc, cam, A: {}, b,
    update(t) {
      const A = s.A, lt2 = t - A.c0, kin = easeOutBack(clamp(lt2 / 0.5)), kup = ease(seg(t, A.up, A.up + 1.1));
      b.position.set(0, 1.25 - (1 - kin) * 3 + kup * 2.4 + Math.sin(t * 2) * 0.03 * kup, 0); b.rotation.y = 0.5 + t * 0.6; b.rotation.z = kup * 0.15 * Math.sin(t * 3);
      cam.position.set(0, 2.4 + kup * 1.2, 9.5); cam.lookAt(0, 1.6 + kup * 1.5, 0); shadowP.material.opacity = 0.22 * (1 - kup * 0.6);
    }
  };
}

// ======================= RADIATION =======================
function buildRad() {
  const sc = new THREE.Scene(); const L = lights(sc, { sky: '#fff3c4', ground: '#30402a', hi: 1.3, di: 3 }); L.d.castShadow = false; L.d.position.set(-3, 4, 8);
  const g = new THREE.Group(); const yel = new THREE.MeshStandardMaterial({ color: '#f4c430', roughness: 0.45, metalness: 0.15 }), blk = new THREE.MeshStandardMaterial({ color: '#17181a', roughness: 0.5 });
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.16, 96), yel); disk.rotation.x = Math.PI / 2; g.add(disk);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.07, 16, 96), blk); g.add(rim);
  for (let i = 0; i < 3; i++) { const a0 = (90 + i * 120 - 30) * DEG, a1 = (90 + i * 120 + 30) * DEG, sh = new THREE.Shape(); sh.absarc(0, 0, 1.45, a0, a1, false); sh.absarc(0, 0, 0.45, a1, a0, true); const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), blk); m.position.z = 0.06; g.add(m); }
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.14, 48), blk); c.rotation.x = Math.PI / 2; c.position.z = 0.1; g.add(c); sc.add(g);
  const DUST = []; for (let i = 0; i < 70; i++) { const d = spriteGlow(i % 4 ? '#9dff6a' : '#f4ff9a', 0.12 + hash(i) * 0.2); sc.add(d); DUST.push(d); }
  const cam = new THREE.PerspectiveCamera(32, PW / PH, 0.1, 100); cam.position.set(0, 0, 13);
  const s = SC.rad = {
    scene: sc, cam, A: {},
    update(t) {
      const A = s.A, lt = t - A.c0, k = easeOutBack(clamp(lt / 0.7)); g.scale.setScalar(Math.max(0.001, k)); g.rotation.set(-0.25 + Math.sin(t * 0.9) * 0.08, Math.sin(t * 0.7) * 0.5, t * 0.35); g.position.set(0, 0.6 + Math.sin(t * 1.3) * 0.08, 0);
      DUST.forEach((d, i) => { const ph = (t * 0.12 + hash(i + 3)) % 1, a = hash(i) * 6.28 + t * 0.2; d.position.set(Math.cos(a) * (1.5 + hash(i + 5) * 3), -3 + ph * 7, Math.sin(a) * 2 + 1); d.material.opacity = Math.sin(ph * Math.PI) * 0.8; });
      cam.position.z = lerp(13.5, 11.5, ease(clamp(lt / 3.3)));
    }
  };
}

