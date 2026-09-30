// Downloads the project images from envisionar.in and writes web-sized copies to work/img/.
// Usage: node tools/work-images.mjs   (needs `sharp`; source list: src/data/projects.json)
import fs from 'fs';
import { execSync } from 'child_process';
import sharp from 'sharp';

const projects = JSON.parse(fs.readFileSync('src/data/projects.json', 'utf8'));
fs.mkdirSync('work/img', { recursive: true });
for (const p of projects) {
  const out = `work/img/${p.slug}.webp`;
  if (!fs.existsSync(out)) {
    const tmp = `work/img/.${p.slug}.src`;
    execSync(`curl -sSf -m 60 -o '${tmp}' 'https://envisionar.in/images/${p.file}'`);
    await sharp(tmp).rotate().resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
    fs.unlinkSync(tmp);
    console.log('ok', p.slug);
  }
  const m = await sharp(out).metadata();   // dimensions let the page reserve space (no layout shift)
  p.w = m.width; p.h = m.height;
}
fs.writeFileSync('src/data/projects.json', JSON.stringify(projects, null, 1));
