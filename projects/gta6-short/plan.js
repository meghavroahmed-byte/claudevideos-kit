// node plan.js <timeline.json> <voice.wav>  -> tl.js (stations, word anchors, voice envelope)
const fs = require('fs'); const { execSync } = require('child_process');
const [tlF, wav] = process.argv.slice(2);
const T = JSON.parse(fs.readFileSync(tlF, 'utf8'));
const ev = JSON.parse(fs.readFileSync('anchors.json', 'utf8'));
const st = { A: [0, 4.2], B: [4.2, 17.15], C: [17.15, 32.95], D: [32.95, ev.open - 0.2], E: [ev.open - 0.2, ev.chars - 0.15], F: [ev.chars - 0.15, 51.2], G: [51.2, 59.0], H: [59.0, 73.6], I: [73.6, T.dur] };
Object.assign(ev, { tower: ev.burj - 0.4, budget: ev.b1, virtual: ev.virtual, money: ev.inc, years: ev.years, tech: ev.tech });
execSync(`node envelope.js ${wav} env.js 30`);
fs.writeFileSync('tl.js', 'window.TL=' + JSON.stringify({ dur: T.dur, st, ev, face: [[0, 2.0], [52.15, 54.15], [82.15, T.dur]] }) + ';\n' + fs.readFileSync('env.js', 'utf8'));
console.log('ok', T.dur);
