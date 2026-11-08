// ===== 3D map engine: tilted satellite terrain with real elevation, globe intro, HUD overlays =====
const TEX = 2048, NSEG = 300, EL_DIR = 'file:///D:/ClaudeVideos/cache/maps/elev/tiles/';
let R3, SCN, CAM3, TER, TER_MAT, GTEX, GC, GG, BASEC, BASEG, GLOBE, GLOBE_TEX, GLC, GLG, GLOBE_BASE, ATMO, SKY, CLOUDS = [], SUN;
let REG = null, HGRID = null;
const ELC = {};
async function elevTile(tx, ty) { const k = tx + '_' + ty; if (ELC[k]) return ELC[k]; const im = await loadImg2(EL_DIR + `el_${tx}_${ty}.png`); const c = mk(3600, 3600), g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0); ELC[k] = g.getImageData(0, 0, 3600, 3600).data; return ELC[k]; }
const invMy = ny => Math.atan(Math.sinh(Math.PI * (1 - 2 * ny))) / D2;
function elevKm(lon, lat) { const gx = ((lon + 180) / 360 * 21600 + 21600) % 21600, gy = Math.max(0, Math.min(10799, (90 - lat) / 180 * 10800)); const tx = Math.floor(gx / 3600), ty = Math.floor(gy / 3600); const d = ELC[tx + '_' + ty]; if (!d) return 0; const v = d[(Math.floor(gy - ty * 3600) * 3600 + Math.floor(gx - tx * 3600)) * 4]; return v > 62 ? (v - 62) * 0.034 : 0; }
async function prepRegion(reg) {
  const nx0 = mxN(reg.lon), ny0 = myN(reg.lat), lon0 = (nx0 - reg.span / 2) * 360 - 180, lon1 = (nx0 + reg.span / 2) * 360 - 180, lat0 = invMy(ny0 + reg.span / 2), lat1 = invMy(ny0 - reg.span / 2);
  for (let tx = Math.floor((lon0 + 180) / 60); tx <= Math.floor((lon1 + 180) / 60); tx++) for (let ty = Math.max(0, Math.floor((90 - lat1) / 60)); ty <= Math.min(2, Math.floor((90 - lat0) / 60)); ty++) await elevTile(((tx % 6) + 6) % 6, ty);
  const save = [CAM, CX, CY, GW, GH]; CAM = { lon: reg.lon, lat: reg.lat, z: TEX / reg.span, rot: 0 }; CX = CY = TEX / 2; GW = GH = TEX; for (const k of tilesFor(CAM)) await needTile(k).catch(() => { }); [CAM, CX, CY, GW, GH] = save;
}
function regKey(r) { return [r.lon, r.lat, r.span, r.ex || 0].join('|'); }
function useRegion(reg) {
  if (REG && regKey(REG) === regKey(reg)) return; REG = reg;
  // ground base texture
  const save = [CAM, CX, CY, GW, GH]; CAM = { lon: reg.lon, lat: reg.lat, z: TEX / reg.span, rot: 0 }; CX = CY = TEX / 2; GW = GH = TEX; BASEG.setTransform(1, 0, 0, 1, 0, 0); drawBase(BASEG); if (reg.borders !== 0) borderAll(BASEG, reg.borders != null ? reg.borders : 0.55); [CAM, CX, CY, GW, GH] = save;
  // heights
  const nx0 = mxN(reg.lon), ny0 = myN(reg.lat), spanKm = reg.span * 40075 * Math.cos(reg.lat * D2), ex = reg.ex || 6, pos = TER.geometry.attributes.position; HGRID = new Float32Array((NSEG + 1) * (NSEG + 1));
  for (let j = 0; j <= NSEG; j++) for (let i = 0; i <= NSEG; i++) { const nx = nx0 + (i / NSEG - 0.5) * reg.span, ny = ny0 + (j / NSEG - 0.5) * reg.span; const h = elevKm(nx * 360 - 180, invMy(ny)) / (spanKm / 2) * ex; HGRID[j * (NSEG + 1) + i] = h; pos.setY(j * (NSEG + 1) + i, h); }
  pos.needsUpdate = true; TER.geometry.computeVertexNormals();
  CLOUDS.forEach((c, i) => { c.position.set((hash(i * 3 + reg.span) - 0.5) * 2.2, 0.1 + hash(i + 7) * 0.08 + (reg.cloudH || 0), (hash(i * 5 + 1) - 0.5) * 2.2); c.scale.setScalar(0.25 + hash(i + 11) * 0.35); c.material.opacity = reg.clouds != null ? reg.clouds * (0.35 + hash(i + 2) * 0.4) : 0.45 * (0.35 + hash(i + 2) * 0.4); });
}
// world position of lon/lat on current region (y = terrain height)
function W3(lon, lat, up = 0) { const x = (mxN(lon) - mxN(REG.lon)) / REG.span * 2, z = (myN(lat) - myN(REG.lat)) / REG.span * 2; const i = Math.round((x / 2 + 0.5) * NSEG), j = Math.round((z / 2 + 0.5) * NSEG); const h = i >= 0 && i <= NSEG && j >= 0 && j <= NSEG ? HGRID[j * (NSEG + 1) + i] : 0; return new THREE.Vector3(x, h + up, z); }
function SP(lon, lat, up = 0.01) { const v = W3(lon, lat, up).project(CAM3); return [(v.x + 1) / 2 * PW, (1 - v.y) / 2 * PH, v.z < 1]; }
// ground-texture drawing context: same 2D toolkit, projection onto the texture
function groundBegin() { CAM = { lon: REG.lon, lat: REG.lat, z: TEX / REG.span, rot: 0 }; CX = CY = TEX / 2; GW = GH = TEX; GG.setTransform(1, 0, 0, 1, 0, 0); GG.globalAlpha = 1; GG.drawImage(BASEC, 0, 0); return GG; }
function setCam3(c) { // c: {lon, lat, d, tilt(deg from vertical), head(deg), fov}
  const tg = W3(c.lon, c.lat, 0); tg.y = c.ty != null ? c.ty : tg.y * 0.5; const tl = (c.tilt != null ? c.tilt : 40) * D2, hd = (c.head || 0) * D2, d = c.d || 1.2;
  CAM3.position.set(tg.x + Math.sin(tl) * Math.sin(hd) * d, tg.y + Math.cos(tl) * d, tg.z + Math.sin(tl) * Math.cos(hd) * d); CAM3.up.set(0, 1, 0); CAM3.lookAt(tg); CAM3.fov = c.fov || 38; CAM3.near = 0.002; CAM3.far = 40; CAM3.updateProjectionMatrix();
}
// globe
function globePath(g, name, W2, H2) { const f = FEAT[name]; g.beginPath(); for (const r of f.rings) { let px = null; r.forEach(([nx, ny], i) => { const x = nx * W2, y = (90 - invMy(ny)) / 180 * H2; if (i && Math.abs(x - px) > W2 / 2) g.moveTo(x, y); else i ? g.lineTo(x, y) : g.moveTo(x, y); px = x; }); g.closePath(); } }
function globeBegin() { GLG.setTransform(1, 0, 0, 1, 0, 0); GLG.globalAlpha = 1; GLG.drawImage(GLOBE_BASE, 0, 0); return GLG; }
function globeFill(g, name, col, k) { if (k <= 0) return; g.save(); globePath(g, name, GLC.width, GLC.height); g.globalAlpha = 0.85 * k; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 12; g.fill(); g.globalAlpha = k; g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); g.restore(); }
function setGlobeCam(c) { // c: {lon, lat, dist, tilt}
  const lo = c.lon * D2, la = c.lat * D2, d = c.dist || 3; CAM3.position.set(Math.cos(la) * Math.sin(lo) * d, Math.sin(la) * d, Math.cos(la) * Math.cos(lo) * d); CAM3.up.set(0, 1, 0); CAM3.lookAt(0, 0, 0); CAM3.fov = 36; CAM3.near = 0.01; CAM3.far = 100; CAM3.updateProjectionMatrix();
}
function GP(lon, lat, r = 1.01) { const lo = lon * D2, la = lat * D2; const v = new THREE.Vector3(Math.cos(la) * Math.sin(lo) * r, Math.sin(la) * r, Math.cos(la) * Math.cos(lo) * r); const vis = v.clone().normalize().dot(CAM3.position.clone().normalize()) > 0.15; v.project(CAM3); return [(v.x + 1) / 2 * PW, (1 - v.y) / 2 * PH, vis]; }
function cloudTex() { const c = mk(256, 256), g = c.getContext('2d'); for (let i = 0; i < 26; i++) { const x = 128 + (hash(i) - 0.5) * 120, y = 128 + (hash(i + 9) - 0.5) * 60, r = 30 + hash(i + 3) * 50; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); } return new THREE.CanvasTexture(c); }
function skyTex() { const c = mk(16, 512), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#0b2a55'); gr.addColorStop(0.55, '#4f8fc9'); gr.addColorStop(1, '#bfe0f2'); g.fillStyle = gr; g.fillRect(0, 0, 16, 512); return new THREE.CanvasTexture(c); }
async function init3D() {
  R3 = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false }); R3.setSize(PW, PH, false); R3.setPixelRatio(1); R3.outputColorSpace = THREE.SRGBColorSpace;
  SCN = new THREE.Scene(); CAM3 = new THREE.PerspectiveCamera(38, PW / PH, 0.002, 40);
  SCN.add(new THREE.HemisphereLight(0xdfefff, 0x403020, 1.15)); SUN = new THREE.DirectionalLight(0xfff1dc, 2.3); SUN.position.set(-1.2, 1.0, -0.6); SCN.add(SUN);
  GC = mk(TEX, TEX); GG = GC.getContext('2d'); BASEC = mk(TEX, TEX); BASEG = BASEC.getContext('2d');
  GTEX = new THREE.CanvasTexture(GC); GTEX.colorSpace = THREE.SRGBColorSpace; GTEX.anisotropy = 8;
  const geo = new THREE.PlaneGeometry(2, 2, NSEG, NSEG); geo.rotateX(-Math.PI / 2);
  // PlaneGeometry rows run top(+y)->bottom; after rotation +y -> -z, so row 0 is z=-1 (north). Remap uv so v grows southward like the texture canvas.
  const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setY(k, 1 - uv.getY(k)); geo.attributes.position.array.forEach(() => { });
  TER_MAT = new THREE.MeshStandardMaterial({ map: GTEX, roughness: 0.95, metalness: 0 }); GTEX.flipY = false; TER = new THREE.Mesh(geo, TER_MAT); SCN.add(TER);
  // fix row order: PlaneGeometry vertex j rows start at z=-1 (north). Our HGRID j=0 is north (ny smallest) -> consistent.
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: 0x1a5a8c })); sea.rotation.x = -Math.PI / 2; sea.position.y = -0.004; SCN.add(sea); TER.userData.sea = sea;
  SKY = skyTex(); SCN.background = SKY; SCN.fog = new THREE.Fog(0xa9d3ec, 2.5, 7);
  const ct = cloudTex(); for (let i = 0; i < 18; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, transparent: true, opacity: 0.4, depthWrite: false, fog: true })); CLOUDS.push(s); SCN.add(s); }
  // globe
  GLC = mk(4096, 2048); GLG = GLC.getContext('2d'); GLOBE_BASE = mk(4096, 2048); const ov = await loadImg2('file:///D:/ClaudeVideos/cache/maps/tiles/bm_overview_6000.jpg'); GLOBE_BASE.getContext('2d').drawImage(ov, 0, 0, 4096, 2048);
  // recolour flat navy ocean on globe a bit lighter
  { const g = GLOBE_BASE.getContext('2d'), d = g.getImageData(0, 0, 4096, 2048), p = d.data; for (let i = 0; i < p.length; i += 4) { if (p[i + 2] > p[i] + 25 && p[i + 2] > p[i + 1] + 18 && p[i] < 70) { p[i] = 20; p[i + 1] = 66; p[i + 2] = 120; } } g.putImageData(d, 0, 0); }
  GLOBE_TEX = new THREE.CanvasTexture(GLC); GLOBE_TEX.colorSpace = THREE.SRGBColorSpace;
  GLOBE = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), new THREE.MeshStandardMaterial({ map: GLOBE_TEX, roughness: 1 })); GLOBE.rotation.y = -Math.PI / 2; GLOBE.visible = false; SCN.add(GLOBE);
  const ac = mk(512, 512), ag = ac.getContext('2d'), agr = ag.createRadialGradient(256, 256, 160, 256, 256, 256); agr.addColorStop(0, 'rgba(120,190,255,0.0)'); agr.addColorStop(0.62, 'rgba(120,190,255,0.55)'); agr.addColorStop(1, 'rgba(120,190,255,0)'); ag.fillStyle = agr; ag.fillRect(0, 0, 512, 512);
  ATMO = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(ac), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); ATMO.scale.set(2.62, 2.62, 1); ATMO.visible = false; SCN.add(ATMO);
}
let STARS = null; function starsBg() { if (STARS) return STARS; const c = mk(PW, PH), g = c.getContext('2d'), gr = g.createRadialGradient(PW / 2, PH * 0.45, 100, PW / 2, PH / 2, PH); gr.addColorStop(0, '#0b1f3d'); gr.addColorStop(1, '#02050c'); g.fillStyle = gr; g.fillRect(0, 0, PW, PH); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + hash(i) * 0.7})`; g.fillRect(hash(i + 3) * PW, hash(i + 7) * PH, 1 + hash(i + 9) * 2, 1 + hash(i + 9) * 2); } STARS = new THREE.CanvasTexture(c); STARS.colorSpace = THREE.SRGBColorSpace; return STARS; }
