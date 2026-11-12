// uiframes.js: render only the 2D UI layer (cards, stamps, progress bar) as transparent PNGs,
// to overlay on shots rendered elsewhere (Blender). Usage:
//   node uiframes.js <page.html> <out_dir> <startFrame> <count>
const path = require('path'), fs = require('fs');
const puppeteer = require('puppeteer-core');
(async () => {
  const [page_, out, s0, n] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium', headless: 'new', args: ['--allow-file-access-from-files', '--disable-web-security', '--no-sandbox'] });
  const p = await b.newPage();
  await p.evaluateOnNewDocument(() => { window.UI_ONLY = true; });
  await p.goto('file://' + path.resolve(page_)); await p.waitForFunction('window.ready === true', { timeout: 120000 });
  for (let i = 0; i < +n; i++) {
    const d = await p.evaluate(f => { const g = document.getElementById('cv'); window.frame(f); return g.toDataURL('image/png'); }, +s0 + i);
    fs.writeFileSync(path.join(out, String(i + 1).padStart(4, '0') + '.png'), Buffer.from(d.split(',')[1], 'base64'));
  }
  await b.close();
})();
