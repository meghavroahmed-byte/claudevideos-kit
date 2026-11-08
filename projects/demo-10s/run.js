// Linux runner (Playwright Chromium). Same interface as the Windows run.js:
//   node run.js still <page.html> <outDir/x.png> "t1,t2"
//   node run.js video <page.html> <out.mp4> <frames> <fps> [startFrame]
const path = require('path'), fs = require('fs'), { spawn } = require('child_process');
const { chromium } = require('playwright');
(async () => {
  const [mode, page_, out, a1, a2] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security', '--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto('file://' + path.resolve(page_));
  await page.waitForFunction('window.ready === true', null, { timeout: 120000 });
  const save = (d, f) => fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64'));
  if (mode === 'still') {
    const res = await page.evaluate(a => window.still(a), a1 || '0');
    res.forEach(([n, d]) => save(d, path.join(path.dirname(out), n)));
  } else {
    const frames = +a1, fps = +a2, startF = +(process.argv[7] || 0);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < frames; i++) {
      const d = await page.evaluate(i => window.frame(i), i + startF);
      if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 60 === 0) console.log('frame', i);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    const meta = await page.evaluate(() => ({ cuts: window.CUTS || [], pops: window.POPS ? [...window.POPS].sort((a, b) => a - b) : [] }));
    fs.writeFileSync(out + '.json', JSON.stringify(meta));
  }
  await browser.close();
})();
