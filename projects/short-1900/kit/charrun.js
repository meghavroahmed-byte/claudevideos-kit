// node charrun.js  -> renders character sprite PNGs into ../temp/char/c_<frame>.png and list.json
const path = require('path'), fs = require('fs');
const puppeteer = require('D:/ClaudeVideos/cache/npm/_npx/a9cd07ed041d113a/node_modules/puppeteer-core');
const WIN = JSON.parse(fs.readFileSync('charwin.json', 'utf8'));
const only = process.argv[2] ? +process.argv[2] : null;
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'D:/ClaudeVideos/temp/chrome-prof-' + process.pid, args: ['--allow-file-access-from-files', '--disable-web-security', '--no-sandbox'] });
  const p = await b.newPage(); p.on('pageerror', e => console.log('[pageerror]', e.message)); p.on('console', m => console.log('[page]', m.text()));
  await p.goto('file:///' + path.resolve('char.html').replace(/\\/g, '/')); await p.waitForFunction('window.ready === true', { timeout: 120000 });
  const list = [];
  for (const w of WIN) {
    const f0 = Math.round(w.t0 * 30), f1 = Math.round(w.t1 * 30);
    for (let i = f0; i <= f1; i++) { if (only != null && i !== only) continue; const d = await p.evaluate((i, w) => window.frame(i, w), i, w); const name = `c_${String(i).padStart(5, '0')}.png`; fs.writeFileSync(path.join('../temp/char', name), Buffer.from(d.split(',')[1], 'base64')); list.push(i); }
  }
  if (only == null) fs.writeFileSync('../temp/char/list.json', JSON.stringify(list));
  console.log('sprites', list.length); await b.close();
})();
