// node thumb.mjs <t> <out.png> '<posx,posy,posz>' '<lookx,looky,lookz>'   -> 720x1280 frame without captions
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const server = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
const [t, out, pos, look] = process.argv.slice(2);
const GL = process.env.GL === 'swiftshader' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--enable-gpu'];
const b = await chromium.launch({ args: [...GL, '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 720, height: 1280 } });
pg.on('pageerror', e => console.log('[pageerror]', e.message));
await pg.goto(`http://localhost:${server.address().port}/index.html?render=1`);
await pg.waitForFunction(() => window.renderAt && window.ready);
await pg.addStyleTag({ content: '#cap,#hud{display:none!important}' });
await pg.evaluate(([p, l]) => { if (p) window.CAM_OVERRIDE = { pos: p.split(',').map(Number), look: l.split(',').map(Number) }; }, [pos, look]);
await pg.evaluate(t => window.renderAt(t), Number(t));
await pg.screenshot({ path: out, clip: { x: 0, y: 0, width: 720, height: 1280 } });
await b.close(); server.close();
