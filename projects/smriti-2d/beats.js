// beats.js: smriti in the v2 "Ice & Ember" MG house style. Every beat = MG layer + a framed 2D animation.
// The user's character appears only 3 times (hook, "কিন্তু কেনো?", "আজকের আপনি").
const B = []; const beat = (from, mode, o) => B.push(Object.assign({ from, mode }, o));
const pop = (t, a, d = 0.35) => easeOutBack(seg(t, a, a + d));
const sm = (t, a, d = 0.6) => ease(seg(t, a, a + d));
const CARD = (x, y, w, h, col) => ({ x, y, w, h, rad: 36, col });
function softBG(c, t, c0, c1) { const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, c0); gr.addColorStop(1, c1); c.fillStyle = gr; c.fillRect(0, 0, W, H); bokeh(c, t, 14); }
function battery(g, x, y, v, t) { g.save(); g.translate(x, y); g.strokeStyle = '#fff'; g.lineWidth = 8; rr(g, -110, -55, 200, 110, 18); g.stroke(); g.fillStyle = '#fff'; g.fillRect(92, -22, 20, 44); const blink = v < 0.25 && Math.sin(t * 10) > 0; g.fillStyle = blink ? 'rgba(255,77,90,0.3)' : CC.red; g.shadowColor = CC.red; g.shadowBlur = 20; rr(g, -98, -43, Math.max(8, 176 * v), 86, 10); g.fill(); g.restore(); }
function viewfinder(g, x, y, w, h, t, label, col = CC.red) { corners(g, x + 20, y + 20, w - 40, h - 40, '#ffffff', 0.9, 50, 5); g.save(); g.fillStyle = col; g.globalAlpha = Math.sin(t * 6) > 0 ? 1 : 0.2; g.beginPath(); g.arc(x + 70, y + 70, 14, 0, 7); g.fill(); g.globalAlpha = 1; g.font = fontPx(34); g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(label, x + 95, y + 72); g.restore(); }
function commentCard(g, x, y, w, k, t, t0) {
  if (k <= 0) return; const e = easeOutBack(clamp(k)); g.save(); g.translate(x, y + (1 - e) * 220); g.globalAlpha = clamp(k * 3);
  g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 40; g.fillStyle = 'rgba(250,250,252,0.97)'; rr(g, -w / 2, -110, w, 220, 40); g.fill(); g.shadowColor = 'transparent';
  g.fillStyle = CC.ice; g.beginPath(); g.arc(-w / 2 + 90, -10, 48, 0, 7); g.fill(); g.fillStyle = '#0a2a3a'; g.font = fontPx(50); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('আ', -w / 2 + 90, -6);
  const msg = 'আমার প্রথম স্মৃতি হলো…', n = Math.floor(clamp((t - t0 - 0.3) / 1.0) * msg.length); g.textAlign = 'left'; g.fillStyle = '#222'; g.font = fontPx(44); g.fillText(msg.slice(0, n) + (Math.sin(t * 8) > 0 ? '|' : ''), -w / 2 + 165, -30);
  g.fillStyle = '#8a8a90'; g.font = '32px "Nirmala UI"'; g.fillText('কমেন্ট করুন', -w / 2 + 165, 40);
  g.fillStyle = CC.red; rr(g, w / 2 - 150, -40, 110, 80, 40); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(w / 2 - 110, -20); g.lineTo(w / 2 - 66, 0); g.lineTo(w / 2 - 110, 20); g.closePath(); g.fill(); g.restore();
}
const MEMS = ['walk', 'talk', 'cake', 'mom', 'bath', 'toy'];

// 1 hook: baby in the nursery + user's character wondering (char #1)
beat(0, 'ice', { tr: 'none', d: (g, t, b) => { const lt = t - b.t0; bgMG(g, t, 'ice');
  worldIn(g, c => { nursery(c, t); baby(c, 960, 980, 1.25, t, { pose: 'sit', toy: true, wave: true, col: '#8fd3ff' }); }, { fx: 960, fy: 620, z: 1.05 + lt * 0.02 }, CARD(90, 330, 900, 820), t);
  chip(g, 'স্মৃতি · মস্তিষ্ক', 540, 220, CC.ice, 36, clamp(lt * 3)); corners(g, 60, 290, PW - 120, 900, CC.ice, 0.6, 60, 4);
  glitchText(g, 'জীবনের প্রথম স্মৃতি', 610, 1290, 96, pop(t, 0.3), '#ffffff');
  worldIn(g, c => { softBG(c, t, '#2a3f6a', '#101a30'); me(c, t, 960, 1060, 1.05, 'think'); }, { fx: 960, fy: 560, z: 1 }, { x: 220, y: 1560, r: 170, col: 'rgba(143,227,255,0.9)' }, t);
  subLine(g, 'কখনো ভেবে দেখেছেন?', 680, 1560, 58, sm(t, 1.4)); drawIcon(g, 'q', 900, 1690, 0.7, sm(t, 2.0, 0.8), CC.ice, 8); } });

// 2 under three years: big 0-3 + timeline, baby crawling
beat(4.11, 'ice', { tr: 'circle', d: (g, t, b) => { const lt = t - b.t0; bgMG(g, t, 'ice');
  bigNum(g, '০-৩', 540, 430, 230, CC.ice, pop(t, 4.25), 'বছর বয়স');
  const tx = 120, tw = 840, ty = 760, kt = sm(t, 4.4, 0.8); g.save(); g.strokeStyle = 'rgba(143,227,255,0.5)'; g.lineWidth = 6; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + tw * kt, ty); g.stroke();
  for (let i = 0; i <= 10; i++) { const x = tx + tw * i / 10; if (i / 10 > kt) break; g.fillStyle = '#cfe6f5'; g.font = fontPx(30); g.textAlign = 'center'; g.fillText(BN(i), x, ty + 54); g.fillRect(x - 2, ty - 14, 4, 28); }
  const kh = sm(t, 5.2, 0.7); g.fillStyle = CC.ember2; g.shadowColor = CC.ember2; g.shadowBlur = 24; rr(g, tx, ty - 18, tw * 0.3 * kh, 36, 18); g.fill(); g.restore();
  chip(g, 'এই সময়টা ফাঁকা', tx + tw * 0.15, ty - 70, CC.ember2, 30, sm(t, 5.6));
  worldIn(g, c => { nursery(c, t); baby(c, 500 + lt * 160, 960, 1.15, t, { pose: 'crawl', col: '#ffb3c7', speed: 1.3 }); }, { fx: 900, fy: 640, z: 1 }, CARD(110, 950, 860, 620), t); } });

// 3 not one memory: polaroids pop in, then go blank
beat(6.8, 'dark', { tr: 'zoom', d: (g, t, b) => { bgMG(g, t, 'dark', { floor: false });
  const pos = [[260, 560, -0.12], [560, 470, 0.05], [850, 580, 0.14], [360, 960, 0.08], [740, 990, -0.07]];
  pos.forEach(([x, y, r], i) => { const ft = 7.3 + i * 0.3; polaroid(g, x, y + Math.sin(t * 1.5 + i) * 8, 280, r, pop(t, 6.9 + i * 0.12), PIC[MEMS[i]], { fade: sm(t, ft, 0.5), label: '???' }); dissolveDust(g, x - 140, y - 160, 280, 330, sm(t, ft, 0.9), '230,240,255', i * 50); });
  glitchText(g, 'একটি স্মৃতিও', 540, 1380, 110, pop(t, 7.0), CC.ice); slam(g, 'মনে নেই!', 540, 1570, 150, pop(t, 8.9), CC.red); } });

// 4 first steps + first word, then an eraser wipes both
beat(10.0, 'ice', { tr: 'bars', d: (g, t, b) => { const lt = t - b.t0; bgMG(g, t, 'ice');
  worldIn(g, c => { nursery(c, t); baby(c, 760 + lt * 70, 990, 1.2, t, { pose: 'walk', armsUp: true, col: '#ffd23f', speed: 0.9 }); }, { fx: 900, fy: 600, z: 1 }, CARD(90, 250, 900, 620), t);
  chip(g, 'প্রথম হাঁটা', 270, 300, CC.ember2, 34, pop(t, 10.2));
  worldIn(g, c => { nursery(c, t, { mobile: false }); baby(c, 760, 990, 1.25, t, { pose: 'sit', mouth: 0.3 + 0.6 * Math.abs(Math.sin(t * 7)), col: '#ff8fb1' }); c.save(); c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 6; rr(c, 1020, 300, 360, 200, 40); c.fill(); c.stroke(); c.fillStyle = INK; c.font = 'bold 120px "Nirmala UI"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('মা!', 1200, 405); c.restore(); }, { fx: 960, fy: 620, z: 1 }, CARD(90, 920, 900, 620), t);
  chip(g, 'প্রথম কথা', 260, 970, CC.ember2, 34, pop(t, 11.0));
  const ke = sm(t, 12.6, 1.4), ex = lerp(-120, 1200, ke);
  if (ke > 0) { g.save(); g.fillStyle = 'rgba(4,10,19,0.94)'; g.fillRect(0, 230, ex, 1340); g.restore(); drawIcon(g, 'eraser', ex, 900, 1.6, 1, '#ffffff', 9); }
  glitchText(g, 'কে মুছে ফেললো?', 540, 1700, 100, pop(t, 13.0), CC.red); } });

// 5 we think the baby brain was weak
beat(15.05, 'dark', { tr: 'dissolve', d: (g, t, b) => { bgMG(g, t, 'dark', { floor: false, np: 14 });
  chip(g, 'আমরা ভাবি…', 540, 230, CC.ice, 38, pop(t, 15.1));
  worldIn(g, c => { nursery(c, t, { wall0: '#d9dde8', wall1: '#b7bdd0' }); baby(c, 960, 990, 1.3, t, { pose: 'sit', face: 'wonder', col: '#c7a6ff' }); }, { fx: 960, fy: 620, z: 1 }, { x: 540, y: 760, r: 380, col: 'rgba(143,227,255,0.8)' }, t);
  battery(g, 540, 1260, lerp(0.8, 0.12, sm(t, 15.6, 1.2)), t); hlText(g, 'দুর্বল মস্তিষ্ক?', 540, 1460, 92, pop(t, 15.8), CC.ink, CC.ice); } });

// 6 so it couldn't record
beat(17.51, 'red', { tr: 'whip', d: (g, t, b) => { bgMG(g, t, 'red');
  worldIn(g, c => { nursery(c, t); baby(c, 960, 990, 1.25, t, { pose: 'crawl', col: '#ffd23f' }); c.fillStyle = `rgba(255,255,255,${0.08 + 0.06 * hash(Math.floor(t * 24))})`; for (let i = 0; i < 300; i++) c.fillRect(hash(i + Math.floor(t * 24)) * W, hash(i * 3 + Math.floor(t * 24)) * H, 3, 3); }, { fx: 960, fy: 600, z: 1 }, CARD(90, 330, 900, 700, 'rgba(255,77,90,0.8)'), t);
  viewfinder(g, 90, 330, 900, 700, t, 'REC'); xMarkMG(g, 540, 680, 160, sm(t, 18.0, 0.4));
  drawIcon(g, 'rec', 540, 1270, 1.3, sm(t, 17.6, 0.6), CC.red, 8); glitchText(g, 'রেকর্ড হয়নি?', 540, 1530, 110, pop(t, 17.7), CC.red); } });

// 7 science says the opposite (world flips)
beat(18.97, 'ember', { tr: 'flash', d: (g, t, b) => { const lt = t - b.t0; bgMG(g, t, 'ember');
  drawIcon(g, 'atom', 540, 470, 1.7, sm(t, 19.0, 0.7), CC.ember2, 7, { rot: t * 0.6 }); chip(g, 'বিজ্ঞান বলছে', 540, 250, CC.ember2, 36, pop(t, 19.1));
  const fl = easeIO(clamp((lt - 0.6) / 0.8));
  worldIn(g, c => { c.save(); c.translate(960, 540); c.rotate(Math.PI * fl); c.translate(-960, -540); nursery(c, t); baby(c, 960, 990, 1.2, t, { pose: 'sit', toy: true, wave: true, col: '#ffd23f' }); c.restore(); }, { fx: 960, fy: 540, z: 1.1 }, CARD(170, 700, 740, 560, 'rgba(255,207,90,0.9)'), t);
  drawIcon(g, 'flip', 900, 760, 0.6, sm(t, 19.4), CC.ember2, 8, { rot: Math.PI * fl });
  slam(g, 'সম্পূর্ণ উল্টো!', 540, 1460, 140, pop(t, 19.9), CC.ember2); } });

// 8 the baby brain recorded EVERY moment
beat(21.49, 'ice', { tr: 'zoom', d: (g, t, b) => { const lt = t - b.t0; bgMG(g, t, 'ice');
  brainSide(g, 540, 640, 1.25, t, { hip: 0 });
  g.save(); g.globalAlpha = Math.sin(t * 6) > 0 ? 1 : 0.25; g.fillStyle = CC.red; g.beginPath(); g.arc(200, 330, 16, 0, 7); g.fill(); g.restore(); chip(g, 'REC · প্রতিটি মুহূর্ত', 400, 330, CC.ice, 32, pop(t, 21.6));
  for (let i = 0; i < 9; i++) { const p = ((lt * 0.55 + i / 9) % 1), x = lerp(540 + (i % 3 - 1) * 330, 540, ease(p)), y = lerp(1700, 650, ease(p)); polaroid(g, x, y, lerp(220, 50, p), (i % 2 ? 1 : -1) * 0.2 * (1 - p), 1, PIC[MEMS[i % 6]], { a: clamp((1 - p) * 3) * clamp(p * 6) }); }
  const n = Math.floor(lerp(0, 98765, clamp(lt / 3.6))); bigNum(g, BN(n.toLocaleString('en-IN')), 540, 1260, 130, '#ffffff', pop(t, 21.7), 'মুহূর্ত রেকর্ড'); } });

// 9 then the brain itself destroyed them
beat(25.34, 'red', { tr: 'glitch', d: (g, t, b) => { const lt = t - b.t0; bgMG(g, t, 'red');
  brainSide(g, 540, 640, 1.25, t, { col: '#ff8f9f', col2: '#d0607a' });
  g.save(); g.globalCompositeOperation = 'screen'; glow(g, 540, 640, 520, 'rgba(255,60,60,A)', 0.25 + 0.15 * Math.sin(t * 8)); g.restore();
  [[200, 360], [880, 380], [170, 900], [910, 930]].forEach(([x, y], i) => { const kb = sm(t, 25.9 + i * 0.45, 0.6); polaroid(g, x, y, 220, (i - 1.5) * 0.15 + kb * 0.5, 1 - kb, PIC[MEMS[i + 1]], { fade: kb }); dissolveDust(g, x - 110, y - 130, 220, 260, kb, '255,140,120', i * 40); });
  partsP(g, t, 'ember', 50); stamp2(g, 'ডিলিট', 540, 1210, pop(t, 26.6), CC.red);
  slam(g, 'নিজেই ধ্বংস করেছে!', 540, 1480, 110, pop(t, 27.4), CC.red); } });

// 10 but why? (char #2: confused)
beat(29.33, 'dark', { tr: 'zoom', d: (g, t, b) => { bgMG(g, t, 'dark', { floor: false }); tunnel(g, t, 540, 700, '143,227,255', 1.4);
  drawIcon(g, 'q', 540, 560, 2.6, sm(t, 29.35, 0.5), '#ffffff', 10);
  worldIn(g, c => { softBG(c, t, '#3a3060', '#141028'); me(c, t, 960, 1060, 1.05, 'confused'); }, { fx: 960, fy: 560, z: 1 }, { x: 540, y: 1250, r: 300, col: 'rgba(255,255,255,0.9)' }, t);
  glitchText(g, 'কিন্তু কেনো?', 540, 1680, 120, pop(t, 29.4), CC.ice); } });

// 11 first three years: baby grows sit -> crawl -> walk
beat(30.11, 'ice', { tr: 'circle', d: (g, t, b) => { bgMG(g, t, 'ice'); chip(g, 'জন্মের পর প্রথম ৩ বছর', 540, 260, CC.ice, 38, pop(t, 30.2));
  [['sit', '১'], ['crawl', '২'], ['walk', '৩']].forEach(([pose, n], i) => { const k = pop(t, 30.4 + i * 0.45), x = 200 + i * 340, y = 820; if (k <= 0) return;
    worldIn(g, c => { nursery(c, t, { mobile: false }); baby(c, pose === 'crawl' ? 860 : 960, 990, 1.3, t + i, { pose, col: ['#8fd3ff', '#ffb3c7', '#ffd23f'][i], armsUp: true }); }, { fx: 960, fy: 640, z: 1 }, { x, y, r: 150 * k, col: 'rgba(143,227,255,0.9)' }, t);
    bigNum(g, n, x, y + 260, 90, CC.ember2, k, 'বছর'); if (i < 2) drawLine(g, x + 160, y, x + 180, y, k, CC.ice, 4); });
  subLine(g, 'মস্তিষ্ক সবচেয়ে দ্রুত বাড়ে', 540, 1420, 56, sm(t, 31.6)); } });

// 12 the hippocampus
beat('আমাদের মস্তিষ্কের', 'ice', { tr: 'bars', d: (g, t, b) => { const lt = t - b.t0, kh = sm(t, b.t0 + 0.4, 1.0), z = 1.2 + 0.25 * ease(clamp(lt / 3));
  brainSide(g, 540 + 40 * (z - 1.2), 760, z, t, { hip: kh });
  drawLine(g, 520, 830, 330, 1200, kh, CC.ice, 4); hlText(g, 'হিপোক্যাম্পাস', 540, 1290, 96, pop(t, T('হিপোক্যাম্পাসে')), CC.ink, CC.ice);
  subLine(g, 'স্মৃতি তৈরির কারখানা', 540, 1420, 54, sm(t, T('হিপোক্যাম্পাসে') + 0.5)); chip(g, 'মস্তিষ্কের ভেতরে', 540, 260, CC.ice, 34, pop(t, b.t0 + 0.1)); } });

// 13 hundreds of thousands of new neurons per second
beat('প্রতি সেকেন্ডে', 'ice', { tr: 'zoom', d: (g, t, b) => { const lt = t - b.t0; bgMG(g, t, 'ice', { floor: false });
  neuronField(g, t, clamp(lt / 2.6), [80, 300, 920, 900], 34, CC.green, 3);
  glass(g, 120, 1260, 840, 360, 0.55, 'rgba(60,227,154,0.5)');
  bigNum(g, 'লাখ লাখ', 540, 1390, 140, CC.green, pop(t, T('লাখ লাখ')), 'নতুন নিউরন / সেকেন্ড');
  drawIcon(g, 'neuron', 180, 1350, 0.5, sm(t, b.t0 + 0.2), CC.green, 6); } });

// 14 analogy: breaking an old wall to build a new room
beat(38.68, 'ember', { tr: 'circle', d: (g, t, b) => { const hm = clamp((t - 39.2) / 0.5), hit = sm(t, 39.75, 0.8);
  bgMG(g, t, 'ember'); chip(g, 'একটা উদাহরণ', 540, 250, CC.ember2, 36, pop(t, 38.75)); drawIcon(g, 'house', 160, 250, 0.5, sm(t, 38.8), CC.ember2, 8);
  worldIn(g, c => { wallScene(c, t, { hammer: t < 39.75 ? easeIO(hm) : 1 - 0.3 * sm(t, 39.8, 0.4), crack: hit, debris: sm(t, 40.0, 1.6) }); }, { fx: 960 + (t > 39.75 && t < 40.1 ? Math.sin(t * 90) * 14 : 0), fy: 540, z: 1 }, CARD(60, 330, 960, 900, 'rgba(255,207,90,0.9)'), t);
  title(g, 'পুরনো দেয়াল ভাঙা', 540, 1390, pop(t, 39.0), 84, '#ffffff'); subLine(g, '→ নতুন ঘর তৈরি', 540, 1510, 60, sm(t, 41.2), CC.ember2); } });

// 15 the photos on that wall get ruined
beat('দেয়ালের ছবিগুলো', 'ember', { tr: 'whip', d: (g, t, b) => { const lt = t - b.t0;
  bgMG(g, t, 'ember'); worldIn(g, c => wallScene(c, t, { crack: 1, fall: clamp(lt / 1.6) }), { fx: 960, fy: 480 + lt * 30, z: 1.25 }, CARD(60, 300, 960, 1000, 'rgba(255,207,90,0.9)'), t);
  stamp2(g, 'নষ্ট!', 540, 1450, pop(t, T('নষ্ট হয়ে')), CC.red); } });

// 16 same way: the neuron explosion
beat(43.84, 'red', { tr: 'flash', d: (g, t, b) => { const lt = t - b.t0; bgMG(g, t, 'red');
  brainSide(g, 540, 700, 1.3, t, { hip: 1, glow: false });
  g.save(); for (let i = 0; i < 3; i++) { const p = ((lt * 0.8 + i / 3) % 1); g.strokeStyle = `rgba(255,140,60,${1 - p})`; g.lineWidth = 10 * (1 - p); g.beginPath(); g.arc(530, 750, 60 + p * 520, 0, 7); g.stroke(); } g.restore();
  neuronField(g, t, clamp(lt / 1.4), [250, 520, 580, 380], 22, CC.ember, 41);
  [[260, 420], [820, 420], [300, 1060]].forEach(([x, y], i) => { const kb = sm(t, 45.0 + i * 0.4, 0.7); polaroid(g, x, y, 200, (i - 1) * 0.2, 1 - kb * 0.6, PIC[MEMS[i + 2]], { fade: kb }); dissolveDust(g, x - 100, y - 120, 200, 240, kb, '255,170,120', i * 30); });
  glitchText(g, 'নতুন কোষের বিস্ফোরণ', 540, 1430, 92, pop(t, 44.4), CC.ember2); } });

// 17 childhood memories erased forever
beat('চিরতরে মুছে', 'dark', { tr: 'zoom', d: (g, t, b) => { bgMG(g, t, 'dark', { floor: false, np: 10 });
  for (let i = 0; i < 4; i++) { const x = 180 + i * 240, y = 720 + (i % 2) * 90, kb = sm(t, b.t0 + 0.3 + i * 0.35, 0.6); polaroid(g, x, y, 220, (i - 1.5) * 0.1, 1, PIC[MEMS[i]], { a: 1 - kb, fade: kb * 0.8 }); dissolveDust(g, x - 110, y - 130, 220, 260, kb, '210,225,255', i * 20); }
  drawIcon(g, 'eraser', 540, 400, 1.0, sm(t, b.t0 + 0.1), '#ffffff', 8);
  slam(g, 'চিরতরে মুছে যায়!', 540, 1300, 120, pop(t, b.t0 + 0.2), '#ffffff'); chip(g, 'শৈশবের স্মৃতি', 540, 1460, CC.ice, 36, sm(t, b.t0 + 0.6)); } });

// 18 before 1.5 years: no sense of "me" (mirror test)
beat(49.44, 'ice', { tr: 'bars', d: (g, t, b) => { bgMG(g, t, 'ice');
  worldIn(g, c => mirrorScene(c, t), { fx: 960, fy: 560, z: 1 }, CARD(90, 280, 900, 820), t);
  drawIcon(g, 'q', 780, 470, 0.55, sm(t, T('আমি') - 0.2, 0.6), CC.ember2, 8);
  bigNum(g, '১.৫', 300, 1300, 160, CC.ice, pop(t, 49.6), 'বছরের আগে'); hlText(g, '‘আমি’ = ?', 760, 1290, 90, pop(t, T('আমি')), CC.ink, CC.ember2);
  subLine(g, 'নিজেকে চেনার বোধ নেই', 540, 1600, 56, sm(t, T('অস্তিত্বের'))); } });

// 19 and no language
beat('কোনো ভাষা', 'dark', { tr: 'whip', d: (g, t, b) => { bgMG(g, t, 'dark', { floor: false });
  worldIn(g, c => { nursery(c, t, { mobile: false }); baby(c, 860, 990, 1.3, t, { pose: 'sit', mouth: 0.3 + 0.6 * Math.abs(Math.sin(t * 6)), col: '#a9e34b' }); c.save(); c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 6; rr(c, 1100, 260, 400, 210, 40); c.fill(); c.stroke(); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); for (let x = 0; x < 300; x += 6) c.lineTo(1150 + x, 365 + Math.sin(x * 0.12 + t * 8) * 40 * Math.sin(x * 0.03)); c.stroke(); c.restore(); }, { fx: 960, fy: 620, z: 1 }, { x: 540, y: 720, r: 360, col: 'rgba(143,227,255,0.85)' }, t);
  ['অ', 'আ', 'ক'].forEach((ch, i) => { const k = pop(t, b.t0 + 0.2 + i * 0.15), x = 300 + i * 240; iconBadge(g, 'speech', x, 1250, 90, k, CC.ice); g.save(); g.globalAlpha = k; g.font = fontPx(80); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, x, 1255); g.restore(); xMarkMG(g, x, 1250, 70, sm(t, b.t0 + 0.8 + i * 0.15, 0.3)); });
  hlText(g, 'ভাষাও নেই', 540, 1500, 96, pop(t, b.t0 + 0.4), CC.ink, CC.ice); } });

// 20 no structure to store memories: cards fall straight through
beat(55.71, 'ice', { tr: 'circle', d: (g, t, b) => { bgMG(g, t, 'ice');
  chip(g, 'স্মৃতি রাখার তাক', 540, 250, CC.ice, 36, pop(t, 55.8)); cabinet(g, 190, 360, 700, 860, t, 1, CC.ice);
  slam(g, 'কাঠামোই নেই!', 540, 1500, 130, pop(t, T('কাঠামোই')), CC.ember2); subLine(g, 'স্মৃতি জমা থাকে না', 540, 1650, 56, sm(t, 57.6)); } });

// 21 today's smart "you" (char #3)
beat(59.35, 'ember', { tr: 'zoom', d: (g, t, b) => { const lt = t - b.t0; bgMG(g, t, 'ember');
  worldIn(g, c => { softBG(c, t, '#5a3a1a', '#1e1208'); me(c, t, 960, 1040, 1.0, lt < 1.6 ? 'point' : 'thumbsUp', { lt: lt < 1.6 ? lt : lt - 1.6 }); }, { fx: 960, fy: 560, z: 1 }, CARD(170, 300, 740, 900, 'rgba(255,207,90,0.9)'), t);
  iconBadge(g, 'bulb', 860, 380, 100, pop(t, 60.0), CC.ember2); g.save(); g.globalCompositeOperation = 'screen'; glow(g, 860, 380, 220, 'rgba(255,207,90,A)', 0.3 * sm(t, 60.0)); g.restore();
  title(g, 'আজকের বুদ্ধিমান ‘আপনি’', 540, 1380, pop(t, 60.2), 82, '#ffffff'); } });

// 22 the sacrifice: memories burn to build the thinking brain
beat('শৈশবের স্মৃতিগুলোকে', 'red', { tr: 'flash', d: (g, t, b) => { const lt = t - b.t0; bgMG(g, t, 'red');
  drawIcon(g, 'scale', 540, 520, 1.8, sm(t, b.t0 - 1.2, 0.8), CC.ember2, 8);
  const tip = sm(t, b.t0, 1.2) * 0.25; g.save(); g.translate(540, 394); g.rotate(-tip);
  polaroid(g, -270, 210, 150, -0.1, 1, PIC.cake, { fade: sm(t, b.t0 + 0.2, 1.4) }); polaroid(g, -200, 190, 150, 0.12, 1, PIC.walk, { fade: sm(t, b.t0 + 0.4, 1.4) });
  iconBadge(g, 'bulb', 270, 180, 80, 1, CC.ember2); g.restore();
  g.save(); g.globalCompositeOperation = 'screen'; fireLight(g, 300, 650, 320, t, sm(t, b.t0, 0.6)); g.restore(); partsP(g, t, 'ember', 70);
  worldIn(g, c => { nursery(c, t, { wall0: '#ffd8b0', wall1: '#e8a070' }); baby(c, 960, 990, 1.25, t, { pose: 'sit', toy: true, col: '#ffb3c7' }); c.fillStyle = `rgba(30,8,4,${0.7 * sm(t, b.t0, 1.6)})`; c.fillRect(0, 0, W, H); }, { fx: 960, fy: 620, z: 1 }, { x: 540, y: 1080, r: 200, col: 'rgba(255,138,42,0.9)' }, t);
  drawIcon(g, 'fire', 540, 1080, 0.9, sm(t, b.t0 + 0.4), CC.ember, 8);
  slam(g, 'কোরবানি!', 540, 1480, 160, pop(t, T('কোরবানি')), CC.ember2); subLine(g, 'শৈশবের স্মৃতির বদলে', 540, 1640, 54, sm(t, b.t0 + 0.3)); } });

// 23 what's your oldest memory?
beat(66.33, 'ice', { tr: 'circle', d: (g, t, b) => { const lt = t - b.t0; bgMG(g, t, 'ice');
  polaroid(g, 540, 760, 560, Math.sin(t * 0.8) * 0.05, pop(t, 66.4, 0.5), (c, w, h) => { PIC.toy(c, w, h); c.fillStyle = 'rgba(10,20,40,0.7)'; c.fillRect(0, 0, w, h); }, { label: 'আপনার প্রথম স্মৃতি?' });
  drawIcon(g, 'q', 540, 700, 1.4, sm(t, 66.8, 0.7), '#ffffff', 9);
  glitchText(g, 'সবচেয়ে পুরনো স্মৃতি', 540, 1290, 96, pop(t, 66.6), CC.ice); subLine(g, 'আজও কোনটা মনে পড়ে?', 540, 1430, 60, sm(t, 68.0)); } });

// 24 comment CTA
beat(69.83, 'ice', { tr: 'zoom', d: (g, t, b) => { bgMG(g, t, 'ice'); drawIcon(g, 'bubble', 540, 560, 2.0, sm(t, 69.85, 0.5), CC.ice, 8);
  worldIn(g, c => { nursery(c, t); baby(c, 960, 990, 1.3, t, { pose: 'sit', wave: true, toy: true, col: '#8fd3ff' }); }, { fx: 960, fy: 620, z: 1 }, { x: 540, y: 560, r: 150, col: 'rgba(143,227,255,0.9)' }, t);
  commentCard(g, 540, 1080, 960, sm(t, 69.95, 0.4), t, 69.95); slam(g, 'কমেন্ট করে জানান!', 540, 1420, 110, pop(t, 70.1), CC.ember2); } });

// SFX cues for sfx.py ([time, kind])
window.SFXEV = [
  [0.2, 'sparkle'], [0.3, 'slam'], [1.4, 'pop'], [4.11, 'whoosh'], [4.25, 'slam'], [4.5, 'tick'], [5.2, 'rise'], [5.6, 'pop'],
  [6.8, 'whoosh'], [6.9, 'pop'], [7.0, 'pop'], [7.3, 'erase'], [7.9, 'erase'], [8.5, 'erase'], [8.9, 'slam'],
  [10.0, 'whoosh'], [10.2, 'pop'], [11.0, 'pop'], [12.6, 'erase'], [13.0, 'bad'],
  [15.05, 'whoosh'], [15.6, 'bad'], [15.8, 'pop'], [17.51, 'whoosh'], [17.6, 'rec'], [18.0, 'bad'],
  [18.97, 'slam'], [19.1, 'zap'], [19.6, 'rise'], [19.9, 'slam'], [21.49, 'whoosh'], [21.6, 'rec'], [22.2, 'tick'], [23.0, 'tick'], [23.8, 'tick'],
  [25.34, 'zap'], [25.9, 'shatter'], [26.6, 'slam'], [27.4, 'shatter'], [29.33, 'whoosh'], [29.4, 'bad'],
  [30.11, 'whoosh'], [30.4, 'pop'], [30.85, 'pop'], [31.3, 'pop'], [32.6, 'whoosh'], [33.2, 'sparkle'], [34.4, 'zap'], [35.0, 'zap'], [35.6, 'zap'], [36.2, 'good'],
  [38.68, 'whoosh'], [39.0, 'pop'], [39.75, 'rumble'], [39.8, 'shatter'], [41.2, 'build'], [42.0, 'whoosh'], [42.6, 'shatter'],
  [43.84, 'slam'], [44.0, 'rumble'], [44.4, 'zap'], [45.0, 'erase'], [45.8, 'erase'], [46.6, 'whoosh'], [46.8, 'slam'],
  [49.44, 'whoosh'], [49.6, 'pop'], [50.6, 'sparkle'], [52.6, 'whoosh'], [53.0, 'pop'], [53.4, 'bad'],
  [55.71, 'whoosh'], [56.2, 'drop'], [56.8, 'drop'], [57.4, 'drop'], [59.35, 'whoosh'], [60.0, 'good'], [60.2, 'pop'],
  [62.4, 'burn'], [62.6, 'slam'], [66.33, 'whoosh'], [66.6, 'sparkle'], [69.83, 'whoosh'], [70.0, 'type'], [70.1, 'pop'],
];
