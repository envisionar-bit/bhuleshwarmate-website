// Snapshots the live Wix site into ./public as static HTML + local assets.
// Usage: node tools/mirror.mjs   (needs `playwright` and a Chromium install)
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ORIGIN = 'https://www.bhuleshwarmate.com';
// Site lives at the repo root so GitHub Pages ("deploy from branch /") serves it directly.
const OUT = path.resolve('.');
// The homepage ('') is hand-designed (index.html + home/), so it is NOT re-mirrored from Wix.
const PAGES = ['profile', 'profile/professionalsummary', 'design-practice', 'teaching-outreach',
  'public-engagement', 'administrative-roles', 'awards', 'gallery', 'contact'];
const ASSET_TYPES = new Set(['image', 'font', 'stylesheet', 'media']);
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg',
  'image/avif': 'avif', 'image/x-icon': 'ico', 'font/woff2': 'woff2', 'font/woff': 'woff', 'font/ttf': 'ttf',
  'text/css': 'css', 'video/mp4': 'mp4', 'application/font-woff2': 'woff2', 'application/font-woff': 'woff' };

// Clean only what this script generates (never tools/, .git, README, ...)
for (const e of ['assets', '_files', ...PAGES.map(p => p.split('/')[0])])
  fs.rmSync(path.join(OUT, e), { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });

const urlToLocal = new Map(); // absolute url -> /assets/xxx.ext
// In the sandbox, traffic goes through a TLS-terminating proxy: trust only that CA (by SPKI pin), keep verification on.
import { execSync } from 'child_process';
const CA = process.env.PROXY_CA || '/root/.ccr/agent-proxy-ca.crt';
const args = [];
if (process.env.HTTPS_PROXY && fs.existsSync(CA)) {
  const spki = execSync(`openssl x509 -in ${CA} -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64`).toString().trim();
  args.push(`--ignore-certificate-errors-spki-list=${spki}`);
}
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined, args });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

function record(resp) {
  return (async () => {
    try {
      const req = resp.request();
      const url = resp.url();
      if (!ASSET_TYPES.has(req.resourceType()) || resp.status() !== 200 || urlToLocal.has(url)) return;
      const ct = (resp.headers()['content-type'] || '').split(';')[0].trim();
      const ext = EXT[ct] || path.extname(new URL(url).pathname).slice(1) || 'bin';
      const body = await resp.body();
      const name = crypto.createHash('sha1').update(url).digest('hex').slice(0, 16) + '.' + ext;
      fs.writeFileSync(path.join(OUT, 'assets', name), body);
      urlToLocal.set(url, '/assets/' + name);
    } catch {}
  })();
}

const htmls = {};
for (const p of PAGES) {
  const page = await ctx.newPage();
  const pending = [];
  page.on('response', r => pending.push(record(r)));
  await page.goto(`${ORIGIN}/${p}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {}); // busy pages may never go fully idle
  // scroll to trigger lazy-loaded media
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1500);
  await Promise.all(pending);
  htmls[p] = await page.evaluate(() => {
    document.querySelectorAll('script, noscript, link[rel=preload], link[rel=modulepreload], link[rel=prefetch], link[rel=dns-prefetch], link[rel=preconnect]').forEach(e => e.remove());
    return '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
  });
  console.log('captured', p || '/', urlToLocal.size, 'assets');
  await page.close();
}
await browser.close();

// Rewrite URLs (longest first so prefixes don't clobber)
const entries = [...urlToLocal.entries()].sort((a, b) => b[0].length - a[0].length);
const esc = s => s.replace(/&/g, '&amp;');
function rewrite(text) {
  for (const [u, l] of entries) {
    text = text.split(u).join(l);
    if (u.includes('&')) text = text.split(esc(u)).join(l);
  }
  return text;
}
// CSS files may reference fonts/images: rewrite in place
for (const [u, l] of entries) if (l.endsWith('.css')) {
  const f = path.join(OUT, l);
  fs.writeFileSync(f, rewrite(fs.readFileSync(f, 'utf8')));
}
for (const [p, html] of Object.entries(htmls)) {
  let h = rewrite(html);
  h = h.replaceAll(`${ORIGIN}/`, '/').replaceAll(ORIGIN, '/');
  const dest = path.join(OUT, p, 'index.html');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, h);
}
// Second pass: srcset variants / unrequested media still pointing at Wix CDNs -> download with curl
const LEFT = /(?:https:)?\/\/static\.(?:wixstatic|parastorage)\.com[^"'\s)<>\\]*/g;
const SKIP = new Set(['node_modules', '.git', 'tools']);
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (SKIP.has(e.name) ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)]);
const textFiles = walk(OUT).filter(f => /\.(html|css)$/.test(f));
const left = new Set();
for (const f of textFiles) for (const m of fs.readFileSync(f, 'utf8').matchAll(LEFT)) left.add(m[0].replace(/&amp;/g, '&')); // may be protocol-relative
const map2 = new Map();
for (const u of left) {
  const url = u.startsWith('//') ? 'https:' + u : u;
  try {
    const tmp = path.join(OUT, 'assets', '.tmp');
    const ct = execSync(`curl -sSf -m 60 -H 'Accept: image/avif,image/webp,image/*,*/*' -o '${tmp}' -w '%{content_type}' '${url}'`).toString().split(';')[0].trim();
    const ext = EXT[ct] || path.extname(new URL(url).pathname).slice(1) || 'bin';
    const name = crypto.createHash('sha1').update(url).digest('hex').slice(0, 16) + '.' + ext;
    fs.renameSync(tmp, path.join(OUT, 'assets', name));
    map2.set(u, '/assets/' + name);
  } catch (e) { console.warn('failed', u); }
}
const e2 = [...map2.entries()].sort((a, b) => b[0].length - a[0].length);
for (const f of textFiles) {
  let t = fs.readFileSync(f, 'utf8');
  for (const [u, l] of e2) t = t.split(u).join(l);
  fs.writeFileSync(f, t);
}
console.log('second pass:', map2.size, 'of', left.size);
// Linked documents served from the Wix domain (/_files/...)
for (const f of walk(OUT).filter(f => f.endsWith('.html'))) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/href="(\/_files\/[^"?]+)/g)) {
    const dest = path.join(OUT, m[1]);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    execSync(`curl -sSfL -m 120 -o '${dest}' '${ORIGIN}${m[1]}'`);
  }
}
execSync('node tools/relativize.mjs', { stdio: 'inherit' });
console.log('done:', Object.keys(htmls).length, 'pages,', urlToLocal.size, 'assets');
