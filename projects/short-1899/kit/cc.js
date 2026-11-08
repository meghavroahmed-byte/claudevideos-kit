const r = require('./sent_times.json');
const c = s => s.replace(/[\s,—\-"“”'।?!;:]/g, '').length;
let a = 0;
r.forEach((x, i) => { a += c(x.text); if ([0, 4, 8, 9, 20, 40, 80, 120, 177].includes(i)) console.log(i, a); });
