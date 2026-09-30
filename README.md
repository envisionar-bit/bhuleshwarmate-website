# bhuleshwarmate-website

Static copy of https://www.bhuleshwarmate.com, moved off Wix. The site itself lives at the
repo root (`index.html`, one folder per page, `assets/`, `_files/`), so the same files can be
served by GitHub Pages and Cloudflare Pages. All URLs are relative, so it works from a
sub-path (`/bhuleshwarmate-website/`) or from a domain root.

- `tools/mirror.mjs` – re-snapshots the live Wix site into the repo root (`npm run mirror`)
- `tools/relativize.mjs` – converts absolute URLs to relative ones (run by the mirror script)
- `.nojekyll` – needed so GitHub Pages serves `_files/` and `_headers`

## GitHub Pages
Settings → Pages → Source: *Deploy from a branch* → Branch: the default branch, folder `/ (root)`.
Live at https://envisionar-bit.github.io/bhuleshwarmate-website/

## Cloudflare Pages
Workers & Pages → Create → Pages → Connect to Git → this repo. Framework preset: None,
build command: empty, build output directory: `/` (repo root). Then add the custom domain.

## Known limitations of a static snapshot
Wix's JavaScript is removed, so anything that needed it does not work here: the contact form
submission, hamburger/dropdown menus on small screens, gallery lightboxes and scroll animations.
