// node anchors_check.js page.html script.txt -> lists anchors (beat + P/S/RG/T) that occur more than once in the script
const fs = require('fs');
const [page, scriptF] = process.argv.slice(2);
const src = fs.readFileSync(page, 'utf8'), script = fs.readFileSync(scriptF, 'utf8');
const re = /(?:beat\(|P\(t, |S\(t, |RG\(t, |T\()'([^']+)'/g;
const seen = new Set(); let m;
while ((m = re.exec(src))) {
  const a = m[1]; if (seen.has(a)) continue; seen.add(a);
  let c = 0, i = -1; while ((i = script.indexOf(a, i + 1)) >= 0) c++;
  if (c !== 1) console.log(c, JSON.stringify(a));
}
// RG second arg
const re2 = /RG\(t, '[^']+', '([^']+)'/g;
while ((m = re2.exec(src))) { const a = m[1]; let c = 0, i = -1; while ((i = script.indexOf(a, i + 1)) >= 0) c++; if (c !== 1) console.log(c, JSON.stringify(a), '(RG end)'); }
