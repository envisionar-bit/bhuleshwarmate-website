// Tiny static-site builder (no dependencies).
// src/pages/*.html  ->  <slug>/index.html   (wrapped by src/partials/layout.html)
// Each page starts with a JSON comment: <!--{"title":"…","description":"…","nav":"profile","next":{"href":"…","label":"…"}}-->
// Generators (<!--@work-grid-->, <!--@archive-grid-->) are filled from src/data/*.json.
import fs from 'fs';
import path from 'path';

const SITE = 'Prof. Bhuleshwar Mate';
const ORIGIN = 'https://www.bhuleshwarmate.com';   // canonical domain (used for canonical links and the sitemap)
const MENU = [
  ['home', '', 'Home'],
  ['profile', 'profile/', 'Profile'],
  ['design-practice', 'design-practice/', 'Design practice'],
  ['work', 'work/', 'Work'],
  ['teaching-outreach', 'teaching-outreach/', 'Teaching & outreach'],
  ['administrative-roles', 'administrative-roles/', 'Administrative roles'],
  ['public-engagement', 'public-engagement/', 'Public engagement'],
  ['awards', 'awards/', 'Awards'],
  ['contact', 'contact/', 'Contact'],
];
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const read = f => fs.readFileSync(f, 'utf8');
const layout = read('src/partials/layout.html');
const projects = JSON.parse(read('src/data/projects.json'));
const archive = JSON.parse(read('src/data/archive.json'));

const SERVICES = {
  'brand-identity': 'Brand identity', 'print-design': 'Print design', signage: 'Signage & hoardings',
  packaging: 'Packaging & more', 'exhibition-events': 'Exhibition & events', 'digital-social': 'Digital & social',
};

const generators = {
  'work-filters': () => [['all', 'All work', projects.length], ...Object.entries(SERVICES).map(([k, v]) =>
    [k, v, projects.filter(p => p.svc.includes(k)).length])]
    .map(([k, v, n], i) => `<button type="button" class="chip" data-filter="${k}" aria-pressed="${i === 0}">${esc(v)} <sup>${n}</sup></button>`).join('\n'),
  'work-count': () => String(projects.length),
  'work-grid': () => projects.map(p => `
      <article class="wcard" data-svc="${p.svc.join(' ')}">
        <a class="wimg" href="${p.url}" rel="noopener" tabindex="-1" aria-hidden="true"><img src="{{root}}work/img/${p.slug}.webp" alt="" width="${p.w}" height="${p.h}" loading="lazy" decoding="async"></a>
        <h3><a href="${p.url}" rel="noopener">${esc(p.name)}<span class="arrow"> ↗</span></a></h3>
        <p>${esc(p.desc)}</p>
        <ul class="tags">${p.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      </article>`).join('\n'),
  'archive-grid': () => archive.map(a => `
      <figure class="afig rv"><img src="{{root}}work/archive/${a.file}.webp" alt="${esc(a.alt)}" loading="lazy" decoding="async" width="${a.w}" height="${a.h}"><figcaption>${esc(a.caption)}</figcaption></figure>`).join('\n'),
};

function menuHtml(nav, root) {
  return MENU.map(([key, href, label], i) =>
    `<li><a href="${href ? root + href : root || './'}"${key === nav ? ' aria-current="page"' : ''}><sup>${i + 1}</sup>${label.replace('&', '&amp;')}</a></li>`).join('\n      ');
}

const sitemap = [];
function build(file) {
  const src = read(file);
  const m = src.match(/^<!--(\{[\s\S]*?\})-->\s*/);
  if (!m) throw new Error(file + ': missing JSON header');
  const meta = JSON.parse(m[1]);
  let content = src.slice(m[0].length);
  const slug = meta.slug ?? path.basename(file, '.html');
  const out = meta.out || (slug === 'index' ? 'index.html' : `${slug}/index.html`);
  const depth = slug === 'index' ? 0 : slug.split('/').length;
  // A 404 page can be served from any path, so it must use root-absolute URLs
  const root = meta.absoluteRoot ? '/' : (depth ? '../'.repeat(depth) : '');
  const canonicalUrl = ORIGIN + '/' + (slug === 'index' ? '' : slug + '/');
  if (!meta.redirect && !meta.absoluteRoot) sitemap.push(canonicalUrl);
  if (meta.redirect) {
    fs.mkdirSync(path.dirname(out) || '.', { recursive: true });
    fs.writeFileSync(out, `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Moved – ${SITE}</title>
<meta name="robots" content="noindex"><link rel="canonical" href="${root}${meta.redirect}">
<meta http-equiv="refresh" content="0; url=${root}${meta.redirect}"></head>
<body><p>This page has moved to <a href="${root}${meta.redirect}">${meta.redirect}</a>.</p></body></html>
`);
    return out;
  }
  content = content.replace(/<!--@([a-z-]+)-->/g, (_, k) => generators[k]());
  const next = meta.next ? `
<section class="next" aria-label="Next page"><div class="frame"><a href="{{root}}${meta.next.href}"><span>Next</span><b>${meta.next.label}</b><i class="arrow">→</i></a></div></section>` : '';
  const legal = meta.footer === false ? '' : `
<footer class="site-foot"><div class="frame"><div class="legal">
  <span>© 2026 Bhuleshwar Mate</span>
  <a href="mailto:contact@envisionar.in">contact@envisionar.in</a>
  <a href="https://envisionar.in/" rel="noopener">Design practice: EnVisionAr Design Atelier ↗</a>
</div></div></footer>`;
  const title = meta.title === 'home' ? `${SITE} – Designer, Educator & Founder of EnVisionAr Design Atelier` : `${meta.title} – ${SITE}`;
  let html = layout
    .replaceAll('{{title}}', esc(title))
    .replaceAll('{{description}}', esc(meta.description || ''))
    .replaceAll('{{bodyClass}}', meta.bodyClass || '')
    .replace('{{menu}}', menuHtml(meta.nav, root))
    .replace('{{content}}', content)
    .replace('{{next}}', next + legal)
    .replace('{{canonical}}', meta.absoluteRoot ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${canonicalUrl}">`)
    .replace('{{scripts}}', (meta.scripts || []).map(s => `<script src="{{root}}${s}" defer></script>`).join('\n'))
    .replaceAll('{{home}}', meta.absoluteRoot ? '/' : (root || './'))
    .replaceAll('{{root}}', root);
  fs.mkdirSync(path.dirname(out) || '.', { recursive: true });
  fs.writeFileSync(out, html);
  return out;
}

const files = fs.readdirSync('src/pages').filter(f => f.endsWith('.html')).map(f => path.join('src/pages', f));
console.log('built', files.map(build).join(', '));
fs.writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.sort().map(u => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
