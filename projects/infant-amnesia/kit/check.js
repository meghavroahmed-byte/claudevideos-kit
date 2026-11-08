// node check.js : verify beat anchors exist & are ordered (mirrors main.html prep)
const fs = require('fs'); global.window = {};
const PAL = { gold: 1, gold2: 1, cyan: 1, blue: 1, pink: 1, red: 1, green: 1, violet: 1, white: 1, teal: 1 }; global.PAL = PAL;
const SENT = JSON.parse(fs.readFileSync(__dirname + '/../temp/timeline.json', 'utf8')).segs;
let CUR_FROM = -1; const miss = [];
function T(str) { let first = null; for (const s of SENT) { let k = -1; while ((k = s.text.indexOf(str, k + 1)) >= 0) { const tt = s.s + (s.e - s.s) * k / s.text.length; if (first == null) first = tt; if (tt >= CUR_FROM - 0.6) return tt; } } if (first == null) miss.push(str); return first || 0; }
eval(fs.readFileSync(__dirname + '/beats.js', 'utf8').replace(/^const /gm, 'var '));
let prev = 0; B.forEach(b => { if (typeof b.at === 'number') b.t0 = b.at; else { CUR_FROM = prev; b.t0 = T(b.at) - 0.15; } prev = b.t0 + 0.15; });
B.forEach(b => { CUR_FROM = b.t0; b.kt = (b.k || []).map(a => typeof a === 'number' ? b.t0 + a : T(a)); });
SECS.forEach(s => { CUR_FROM = -1; if (typeof s.at !== 'number') T(s.at); });
for (let i = 1; i < B.length; i++) { const d = B[i].t0 - B[i - 1].t0; if (d < 1.2) console.log('SHORT/ORDER', i, B[i].at, d.toFixed(2)); }
B.forEach((b, i) => { const t1 = i < B.length - 1 ? B[i + 1].t0 : 1462; b.kt.forEach((k, j) => { if (k < b.t0 - 0.3 || k > t1 + 0.3) console.log('KEY OUT', i, b.tpl, JSON.stringify(b.k[j]), (k - b.t0).toFixed(1), 'len', (t1 - b.t0).toFixed(1)); }); if (t1 - b.t0 > 16) console.log('LONG', i, b.tpl, b.at, (t1 - b.t0).toFixed(1)); });
console.log('beats', B.length, 'missing', JSON.stringify(miss));
const used = new Set(B.map(b => b.tpl)); console.log('templates used', used.size, [...used].join(','));
