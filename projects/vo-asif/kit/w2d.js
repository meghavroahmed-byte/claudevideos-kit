// ===== 2D companion windows =====
// Rule (user, 2026-11-08): wherever there is motion graphics there MUST also be a 2D animation,
// and the user's own character must show up regularly. Every beat without its own world gets b.w2.
const HAS2D = new Set(['scene', 'char', 'profile', 'duo']);
const SIDE2D = new Set(['list', 'timeline', 'bars', 'dna', 'tree', 'net', 'height', 'brain', 'rewind', 'custom']);
let SKIPBG = false;
{ const _bg = bgMG; bgMG = function (...a) { if (!SKIPBG) return _bg.apply(this, a); }; const _deco = deco; deco = function (...a) { if (!SKIPBG) return _deco.apply(this, a); }; }

const secIdx = b => { const s = b.sec || ''; const m = s.match(/^০(\d|[০-৯])/); if (!m) return 0; return '০১২৩৪৫৬৭৮৯'.indexOf(s[1]); };
const SPS = ['sap', 'erectus', 'nean', 'deni', 'flores', 'sap'];
const fk = (c, t, list, y, light, lx) => list.forEach(([sp, a, x, s, fl, extra], i) => folk(c, sp, x, y, s, t, a, Object.assign({ light, lx, flip: fl, seed: i * 3 + 1 }, extra || {})));

// ---------- scene library (world space 1920x1080, action kept within 960±330) ----------
const SC = {
  lineup: () => ({ fy: 700, draw: (c, t, lt) => { savanna(c, t, { pan: lt * 12 }); fk(c, t, [['erectus', 'stand', 690, 1.05], ['nean', 'stand', 830, 1.0], ['deni', 'talk', 965, 1.02], ['flores', 'stand', 1090, 0.62], ['sap', 'point', 1220, 1.05, true]], 990, 'golden', 1400); } }),
  walk: sp => ({ fy: 700, draw: (c, t, lt) => { const sav = sp === 'erectus' || sp === 'sap'; if (sav) savanna(c, t, { pan: lt * 50 }); else if (sp === 'flores') jungle(c, t, { pan: lt * 40 }); else tundra(c, { t, time: 'golden', pan: 600 + lt * 40 }); const s = sp === 'flores' ? 0.75 : 1.15; fk(c, t, [[sp, 'walk', 760, s], [sp, 'carry', 960, s], [sp, 'walk', 1160, s * 0.95]], 990, sp === 'flores' ? 'day' : 'golden', 1500); if (!sav && sp !== 'flores') snowfall(c, t, { n: 50 }); } }),
  knap: sp => ({ fy: 720, draw: (c, t, lt) => { bench(c, t, { surface: 'stone', fx: 1300 }); fk(c, t, [[sp, 'knap', 860, 1.5], [sp, 'point', 1130, 1.25, true]], 1060, 'fire', 1300); } }),
  fire: sp => ({ fy: 720, draw: (c, t, lt) => { caveInside(c, t, { fx: 960, fs: 0.9 }); const s = sp === 'flores' ? 0.8 : 1.15; fk(c, t, [[sp, 'warm', 740, s], [sp, 'eat', 1180, s, true]], 1000, 'fire', 960); } }),
  hunt: sp => ({ fx: 1000, fy: 700, draw: (c, t, lt) => { if (sp === 'erectus' || sp === 'flores') { savanna(c, t, { pan: lt * 30 }); fk(c, t, [[sp, 'spear', 760, 1.2], [sp, 'throw', 960, 1.2]], 990, 'golden', 1500); } else { tundra(c, { t, time: 'golden', pan: 600 + lt * 25 }); mammoth(c, 1250 - lt * 15, 1000, 0.75, t * 0.6, '#5a3a24', 0.6); fk(c, t, [[sp, 'spear', 720, 1.2], [sp, 'throw', 920, 1.2]], 1000, 'golden', 1500); snowfall(c, t, { n: 60 }); } } }),
  storm: sp => ({ fy: 700, draw: (c, t, lt) => { tundra(c, { t, time: 'night', pan: 600 + lt * 30, storm: 0.6 }); fk(c, t, [[sp, 'shiver', 880, 1.3], [sp, 'shiver', 1080, 1.15, true]], 1000, 'night'); snowfall(c, t, { n: 170, blizzard: true }); } }),
  care: sp => ({ fy: 730, draw: (c, t, lt) => { caveInside(c, t, { fx: 960, fs: 0.8 }); fk(c, t, [[sp, 'sleep', 760, 1.15], [sp, 'warm', 1170, 1.15, true]], 1000, 'fire', 960); } }),
  alone: sp => ({ fy: 740, draw: (c, t, lt) => { caveInside(c, t, { fx: 960, fs: 0.4 }); fk(c, t, [[sp, 'sit', 900, 1.2]], 1000, 'fire', 960); } }),
  dig: item => ({ fx: 1000, fy: 620, draw: (c, t, lt) => { digSite(c, t, { item }); fk(c, t, [['sap', 'scrape', 1250, 1.25, true, { coat: '#c8a060', skin: '#c98a5e' }]], 760, 'day', 960); } }),
  isl: sp => ({ fy: 600, draw: (c, t, lt) => { islandScene(c, t, {}); fk(c, t, [[sp, 'walk', 880 + lt * 10, 0.6], [sp, 'stand', 1040, 0.6]], 740, 'day'); } }),
  volc: sp => ({ fx: 1060, fy: 560, draw: (c, t, lt) => { islandScene(c, t, { volcano: true, dusk: true }); fk(c, t, [[sp, 'stand', 860, 0.6], [sp, 'point', 990, 0.6]], 740, 'golden', 1250); } }),
  jun: sp => ({ fy: 720, draw: (c, t, lt) => { jungle(c, t, { pan: lt * 30 }); fk(c, t, [[sp, 'walk', 820 + lt * 12, 0.85], [sp, 'spear', 1060, 0.85]], 1000, 'day'); } }),
  jfire: sp => ({ fy: 740, draw: (c, t, lt) => { jungle(c, t, { pan: lt * 10 }); firePit(c, 960, 990, 0.7, t); fireLight(c, 960, 900, 500, t, 0.9); fk(c, t, [[sp, 'warm', 770, 0.85], [sp, 'sit', 1150, 0.85, true]], 1000, 'fire', 960); } }),
  meet: () => ({ fy: 700, draw: (c, t, lt) => { tundra(c, { t, time: 'day', pan: 600 + lt * 20 }); fk(c, t, [['nean', 'stand', 780, 1.25], ['sap', 'talk', 1140, 1.2, true]], 1000, 'golden', 1500); snowfall(c, t, { n: 30 }); } }),
  group: sp => ({ fy: 740, draw: (c, t, lt) => { caveInside(c, t, { fx: 960, fs: 1.0 }); fk(c, t, [[sp, 'talk', 700, 1.05, false, { seated: true }], [sp, 'warm', 860, 1.05], [sp, 'talk', 1080, 1.05, true, { seated: true }], [sp, 'point', 1240, 1.05, true]], 1000, 'fire', 960); } }),
  sew: sp => ({ fy: 740, draw: (c, t, lt) => { caveInside(c, t, { fx: 1150, fs: 0.8 }); fk(c, t, [[sp, 'sew', 860, 1.3]], 1000, 'fire', 1150); } }),
  mtn: () => ({ fy: 680, draw: (c, t, lt) => { tundra(c, { t, time: 'day', pan: 600 + lt * 40 }); fk(c, t, [['sap', 'walk', 860, 1.1], ['sap', 'carry', 1080, 1.1]], 1000, 'day'); snowfall(c, t, { n: 40 }); } }),
  trade: () => ({ fy: 700, draw: (c, t, lt) => { savanna(c, t, { pan: lt * 15 }); fk(c, t, [['sap', 'carry', 780, 1.15], ['sap', 'talk', 1150, 1.15, true]], 990, 'golden', 1400); } }),
};
const ICONKEY = [
  [['flame', 'pelt'], 'fire'], [['snow', 'wind', 'lungs', 'thermo'], 'storm'], [['island', 'wave', 'palm'], 'isl'],
  [['skull', 'finger', 'bone', 'tooth', 'jaw', 'micro', 'flask', 'dna'], 'dig'], [['mountain', 'o2'], 'mtn'],
  [['swords', 'spear', 'arrows', 'meat', 'elephant', 'plate', 'wolf', 'cat'], 'hunt'], [['heart', 'flower', 'grave', 'couple'], 'care'],
  [['people', 'net', 'bubble', 'trade', 'book', 'globe'], 'group'], [['axe', 'brain', 'shield'], 'knap'], [['needle'], 'sew'],
  [['map', 'foot', 'run', 'pin', 'arrows'], 'walk'], [['volcano', 'dice'], 'volc'], [['lizard', 'bird', 'berry'], 'jun'], [['cave'], 'alone'],
];
const SECDEF = [['lineup', 'walk', 'group', 'meet'], ['walk', 'knap', 'fire', 'hunt'], ['hunt', 'fire', 'storm', 'care'], ['dig', 'mtn', 'fire', 'walk'], ['jun', 'isl', 'jfire', 'hunt'], ['group', 'lineup', 'trade', 'sew']];
function makeScene(key, si, salt) {
  const sp = SPS[si];
  if (key === 'dig') return SC.dig(si === 4 ? 'skull' : si === 3 ? 'finger' : 'jaw');
  if (key === 'isl' && si !== 4 && si !== 1) return SC.isl('flores');
  if (key === 'isl') return SC.isl(si === 1 ? 'erectus' : 'flores');
  if (key === 'volc') return SC.volc('flores');
  if (key === 'jun' || key === 'jfire') return SC[key]('flores');
  if (key === 'mtn' || key === 'meet' || key === 'trade' || key === 'lineup') return SC[key]();
  if (key === 'storm' && (sp === 'erectus' || sp === 'flores')) return SC.walk(sp);
  return SC[key](sp);
}
function pickKey(b, icon, si, n) {
  if (b.o.w) return b.o.w;
  if (icon) for (const [list, k] of ICONKEY) if (list.includes(icon)) return k;
  if (b.o.mode === 'red' && n % 2 === 0) return si === 4 ? 'volc' : 'alone';
  const d = SECDEF[si]; return d[n % d.length];
}

// ---------- user's character inside a window ----------
function meInWorld(c, t, me) {
  const g0 = c.createLinearGradient(0, 600, 0, 1080); g0.addColorStop(0, 'rgba(0,0,0,0)'); g0.addColorStop(1, 'rgba(4,8,14,0.55)'); c.fillStyle = g0; c.fillRect(0, 600, W, 480);
  if (me.pose === 'think') { const m = mouthAt(t); lit(c, null, cc => drawChinta(cc, me.x, 760, 1.25, { t, mouth: m })); return; }
  const k = me.pose === 'point' ? 0.55 + 0.45 * Math.max(0, Math.sin((t - me.t0) * 1.3)) : 0;
  hero(c, t, me.x, { s: 0.74, gy: 1090, up: k, upAng: 55, loAng: 95, wave: me.pose === 'wave' ? Math.sin(t * 6) * 14 : 0 });
}

// ---------- assignment (called from prep after sort) ----------
function assign2D() {
  let since = 2, n = 0;
  B.forEach((b, i) => {
    const si = secIdx(b), o = b.o;
    if (HAS2D.has(b.tpl)) { if (b.tpl === 'char') since = 0; else since++; return; }
    const icon = o.icon || (o.items && o.items[0] && typeof o.items[0][0] === 'string' ? o.items[0][0] : null) || (o.L && o.L.icon);
    const key = pickKey(b, icon, si, n++);
    const sc = makeScene(key, si, i);
    let me = null;
    const isQ = icon === 'q' || icon === 'eye';
    if (b.tpl !== 'chapter' && b.tpl !== 'cmp' && o.me !== false && (o.me || since >= 3 || (isQ && since >= 2))) { me = { pose: isQ ? 'think' : (i % 3 === 0 ? 'talk' : 'point'), x: 1180, t0: 0 }; since = 0; } else since++;
    if (i === B.length - 1 && me) me.pose = 'wave';
    const w2 = { key, sc, me, side: i % 2 ? 'L' : 'R' };
    if (b.tpl === 'cmp' && o.L && o.L.fig) w2.forceSide = true;
    if (b.tpl === 'cmp' && !(o.L && o.L.fig)) { w2.L = makeScene(pickKey({ o: {} }, o.L && o.L.icon, si, n), si, i); w2.R = makeScene(pickKey({ o: {} }, o.R && o.R.icon, si, n + 1), si, i + 1); n++; }
    b.w2 = w2;
  });
}
// draw a scene (with optional character) into a clip
function win2D(g, t, b, clip, sc, zb, me) {
  const lt = t - b.t0, len = Math.max(1, b.t1 - b.t0), u = clamp(lt / len);
  const cam = { fx: (sc.fx || 960) + (me ? 60 : 0), fy: sc.fy || 700, z: zb * (1 + 0.07 * u) };
  if (me) me.t0 = b.t0;
  worldIn(g, c => { sc.draw(c, t, lt, b); if (me) meInWorld(c, t, me); }, cam, clip, t);
}
// generic side layout for diagram templates
function drawSide2D(g, t, b) {
  const R = b.w2.side === 'R', col = colOf(b.o), lt = t - b.t0, ke = easeOut(clamp(lt / 0.55));
  deco(g, t, b, Object.assign({ floor: false }, b.o));
  SKIPBG = true; g.save(); const sc = 0.72; g.translate(R ? 20 : 518, 151); g.scale(sc, sc); TPL[b.tpl](g, t, b, b.o); g.restore(); SKIPBG = false;
  const x = R ? 1430 : 30, clip = { x: x + (R ? 1 : -1) * (1 - ke) * 160, y: 200, w: 460, h: 680, rad: 30, col };
  g.save(); g.globalAlpha = ke; g.fillStyle = 'rgba(0,0,0,0.45)'; g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 40; g.beginPath(); g.roundRect(clip.x, clip.y, clip.w, clip.h, 30); g.fill(); g.restore();
  win2D(g, t, b, clip, b.w2.sc, 0.98, b.w2.me);
  corners(g, clip.x - 16, clip.y - 16, clip.w + 32, clip.h + 32, col, 0.6 * ke, 34, 3);
}
