# bhuleshwarmate-website

Static copy of https://www.bhuleshwarmate.com, moved off Wix and hosted on Cloudflare Pages.

- `public/` – the deployable site (HTML, `/assets/*` images/fonts/CSS, `_headers`)
- `tools/mirror.mjs` – script that re-snapshots the live Wix site into `public/`

## Deploy on Cloudflare Pages
1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick this repo.
2. Framework preset: **None**. Build command: *(empty)*. Build output directory: `public`.
3. After the first deploy, add `www.bhuleshwarmate.com` (and the apex) under Custom domains,
   then point the domain's DNS at Cloudflare as prompted.

## Known limitations of a static snapshot
Wix's JavaScript is removed, so anything that needed it does not work here: the contact form
submission, hamburger/dropdown menus on small screens, gallery lightboxes and scroll animations.
See the notes in the PR/issue tracker for follow-ups.
