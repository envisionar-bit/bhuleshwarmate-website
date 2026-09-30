# bhuleshwarmate-website

Website of Prof. Bhuleshwar Mate, redesigned from the old Wix site (www.bhuleshwarmate.com).
Plain static HTML/CSS/JS with no runtime framework, so the same files work on GitHub Pages
and Cloudflare Pages. All URLs are relative, so it also works under a sub-path
(`/bhuleshwarmate-website/`) or on a domain root.

## Structure

| Path | What |
| --- | --- |
| `src/pages/*.html` | Page content, one file per page (JSON header for title, description, "next" link) |
| `src/partials/layout.html` | Shared shell: head, menu overlay, ghost wordmarks, footer slot |
| `src/data/projects.json`, `archive.json` | Work page data (33 EnVisionAr projects + archive) |
| `tools/build.mjs` | Builds `src/pages` into the `*/index.html` files at the repo root (`npm run build`) |
| `tools/work-images.mjs` | Downloads the project images from envisionar.in into `work/img/` as web-sized WebP (`npm run images`, needs `sharp`) |
| `ds/` | Design system: `site.css` (tokens + components), `site.js`, self-hosted Inter Tight font |
| `img/`, `work/img/`, `work/archive/` | Images |
| `_files/` | The professional summary PDF |

The `*/index.html` files at the root are **generated**. Edit `src/`, run `npm run build`, commit both.

## Editing
- Text on a page: edit `src/pages/<page>.html`.
- Menu, header or footer: edit `src/partials/layout.html` (menu items live in `tools/build.mjs`).
- Add a project to Work: add an entry to `src/data/projects.json`, run `npm run images` then `npm run build`.
- `gallery/` is only a redirect to `work/` for old links.

## Hosting
**GitHub Pages:** Settings → Pages → *Deploy from a branch* → `main`, `/ (root)`. `.nojekyll` is required.
**Cloudflare Pages:** connect this repo, framework preset None, no build command, output directory `/`.
Then add the custom domain.

## Design
Monochrome grotesk layout (inspired by bleibtgleich.dev) with the EnVisionAr blue `#0A00E9` as the only accent.
The contact form prepares an email to contact@envisionar.in (there is no server).
