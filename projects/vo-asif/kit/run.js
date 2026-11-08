// Usage:
//   node run.js still <page.html> <out.png> [arg]
//   node run.js video <page.html> <out.mp4> <frames> <fps>
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const puppeteer = require('D:/ClaudeVideos/cache/npm/_npx/a9cd07ed041d113a/node_modules/puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const [mode, page_, out, a1, a2] = process.argv.slice(2);
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new', userDataDir: 'D:/ClaudeVideos/temp/chrome-prof-' + process.pid,
    args: ['--allow-file-access-from-files', '--disable-web-security', '--no-sandbox'],
  });
  const page = await browser.newPage();
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto('file:///' + path.resolve(page_).replace(/\\/g, '/'));
  await page.waitForFunction('window.ready === true', { timeout: 120000 });

  const save = (dataUrl, file) => fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));

  if (mode === 'still') {
    const res = await page.evaluate(a => window.still(a), a1 || null);
    if (Array.isArray(res)) res.forEach(([name, d]) => save(d, path.join(path.dirname(out), name)));
    else save(res, out);
  } else {
    const frames = +a1, fps = +a2, startF = +(process.argv[7] || 0);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < frames; i++) {
      const d = await page.evaluate(i => window.frame(i), i + startF);
      const buf = Buffer.from(d.split(',')[1], 'base64');
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 30 === 0) console.log('frame', i);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    const meta = await page.evaluate(() => ({ cuts: window.CUTS || [], pops: window.POPS ? [...window.POPS].sort((a, b) => a - b) : [], beats: window.BEATS || [] }));
    fs.writeFileSync(out + '.json', JSON.stringify(meta));
  }
  await browser.close();
})();
