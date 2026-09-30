// Turns root-absolute URLs (/assets/x, /profile) into relative ones so the site works
// from any base path: GitHub Pages project URL (/bhuleshwarmate-website/) and a domain root (Cloudflare).
// Usage: node tools/relativize.mjs [siteDir]   (idempotent)
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.argv[2] || '.');
const SKIP = new Set(['node_modules', '.git', 'tools']);
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? (SKIP.has(e.name) ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)]);

let n = 0;
for (const f of walk(ROOT)) {
  const rel = path.relative(ROOT, f);
  if (f.endsWith('.css') && rel.startsWith('assets' + path.sep)) {
    // CSS lives in /assets/, so sibling assets are just filenames
    const t = fs.readFileSync(f, 'utf8');
    const o = t.replace(/(["'(])\/assets\//g, '$1');
    if (o !== t) { fs.writeFileSync(f, o); n++; }
  } else if (f.endsWith('.html')) {
    const depth = path.dirname(rel).split(path.sep).filter(s => s && s !== '.').length;
    const prefix = depth ? '../'.repeat(depth) : './';
    const t = fs.readFileSync(f, 'utf8');
    let o = t
      .replace(/(["'(,\s])\/(assets|_files)\//g, `$1${prefix}$2/`)                    // assets, files (incl. srcset lists)
      .replace(/(href=")\/(?=")/g, `$1${prefix}`)                                       // href="/"
      .replace(/(href=")\/(?!assets\/|_files\/|\/)([^"?#.]*?)(\/?)(?=["?#])/g,          // href="/page" -> "<prefix>page/"
        (_, a, p) => `${a}${prefix}${p}/`);
    if (o !== t) { fs.writeFileSync(f, o); n++; }
  }
}
console.log('relativized', n, 'files');
