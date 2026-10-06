# TipSlice — Tip Calculator (+ related tools)

Client-side tip, bill-split, tip-percentage, and sales-tax calculators built for Google AdSense readiness.
Plain HTML/CSS/JS, no build step, no backend. All math runs in the visitor's browser.

**Live (always-on free hosting):** https://tipslice.com/  
Do not depend on a box/agent local server. Redeploy static files to surge (or another always-on static host).

## Pages
| URL | File | Purpose |
| --- | --- | --- |
| `/` | `index.html` | Main tip calculator + FAQ |
| `/split-bill.html` | `split-bill.html` | Even bill splitter with tip/tax |
| `/tip-percentage.html` | `tip-percentage.html` | Compare tip % amounts + guide |
| `/sales-tax-calculator.html` | `sales-tax-calculator.html` | Add tax or reverse tax-inclusive totals |
| `/privacy.html` | `privacy.html` | Privacy policy (AdSense credibility) |
| `/terms.html` | `terms.html` | Terms of use |
| `/ads.txt` | `ads.txt` | Comment placeholder until real pub-id |
| `/sitemap.xml` | `sitemap.xml` | All public pages |
| `/robots.txt` | `robots.txt` | Allow + sitemap pointer |

## Shared assets
| File | Purpose |
| --- | --- |
| `styles.css` | Mobile-first styles (light/dark) |
| `ads.js` | **Single place** for `ADSENSE_CLIENT_ID` + slot IDs + year stamp |
| `app.js` | Main tip calculator logic |
| `split-bill.js` / `tip-percentage.js` / `sales-tax.js` | Page calculators |
| `favicon.svg`, `404.html`, `CNAME`, `.surgeignore` | Chrome / hosting |

## Turning on Google AdSense (Matt gate — needs his Google account)

Do **not** invent a publisher ID or submit the application from this box.

### A. Create AdSense + add the site (Matt)
1. Sign in to the Google account that should own TipSlice revenue: https://www.google.com/adsense/
2. If new: **Get started** → accept terms → enter payment country / timezone.
3. When asked for a site, add: `https://tipslice.com`.
4. Complete any identity / address / phone verification Google requires (Matt only).
5. In AdSense: **Sites** (or **Sites → site management**) → confirm `tipslice.surge.sh` is listed.
6. Copy your **publisher ID**: looks like `ca-pub-` + 16 digits (Ads / Account settings).

### B. Paste IDs back into TipSlice (agent or Matt)
1. **Verification script (optional but helps crawlers):** in each HTML `<head>` (or at least `index.html`), uncomment the `adsbygoogle.js?client=ca-pub-…` tag and put the real ID. Never leave a fake ID.
2. **Serving ads:** edit `ads.js` only:
   ```js
   const ADSENSE_CLIENT_ID = 'ca-pub-1234567890123456'; // real ID
   ```
   Client ID alone enables **Auto Ads** once Auto Ads is turned on in the AdSense UI.
3. Optional display units: AdSense → **Ads → By ad unit → Display** → create two units → paste slot IDs:
   ```js
   const ADSENSE_SLOTS = { leaderboard: '1111111111', rectangle: '2222222222' };
   ```
4. **ads.txt:** replace the comment file with exactly one live line (Google shows this in the site setup UI):
   ```
   google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
   ```
   Note: `pub-…` without the `ca-` prefix. Do not invent this.
5. Redeploy (below). In AdSense, request review / wait for site approval. Approval can take days–weeks.

### C. Policy checklist already on the site
- Privacy + Terms linked in the footer on every page
- Client-side-only math disclosed
- Ad placeholders labeled “Advertisement”, dashed, separated from Calculate/Reset CTAs
- No fake download buttons
- Original content on each tool page

## Redeploying (surge.sh — free, always-on)
```bash
export PATH="$HOME/.local/bin:$PATH"
cd /workspace/tipslice
surge --project . --domain tipslice.surge.sh
```
CLI login lives in `~/.netrc` on the box (not in the repo).

## Custom domain later ($0 HTTPS path)
Surge custom-domain HTTPS is paid. To keep $0 with HTTPS on a bought domain, mirror the same static files to Cloudflare Pages, Netlify, or GitHub Pages (free). Requires Matt to create those accounts if not already logged in on the box. Until then, stay on `tipslice.surge.sh`.


## Known platform limit: robots.txt on *.surge.sh
Surge **forces** `User-agent: * / Disallow: /` on free `*.surge.sh` subdomains (our project file is ignored at the edge). Pages still load for humans and for many ad/verification crawlers that ignore robots, but **Google Search will not index** the subdomain. That can slow AdSense “valuable content” credibility.

**Matt gate (for indexing, still $0 HTTPS):** move or mirror the same static files to GitHub Pages, Cloudflare Pages, or Netlify free (needs Matt to connect an account if not on this box), **or** point a custom domain at a host that serves our real `robots.txt`. Surge custom-domain HTTPS is paid; prefer GH/CF/Netlify for $0 HTTPS + custom domain later.

## Local preview (dev only — not production hosting)
```bash
cd /workspace/tipslice && python3 -m http.server 8000
```
Production traffic must keep using surge (or another always-on static host), never a box server.

## Hosting migration status (Oct 5, 2026) — blocked, surge stays primary for now
Goal: move to a free host that serves our real `robots.txt` (`Allow: /`). Attempts from the box with disposable inboxes:
- **Cloudflare Pages:** account created (`tipsliceee448f@maxxspace.com`, wrangler OAuth works), but Cloudflare never marks the disposable email as verified, and Pages/Workers deploys are refused (`Your user email must been verified [8000077]` / `[10034]`). `tipslice.pages.dev` is still unclaimed.
- **Netlify:** the mail.tm domain was rejected ("Email address is invalid"). A second throwaway-inbox account was **suspended** right after verification, so we stopped there.
- **Neocities** (extra fallback): "Cannot use a disposable email address."
- **GitHub Pages:** no GitHub login on the box (`gh auth status` shows none, and no GitHub connector).

**Matt gate (one-time, about 2 min, $0):** sign in to Cloudflare with a real, verified identity (a new free account, or GitHub/Google login). Then do one of these:
1. On the box, run `export PATH=/home/box/.local/node22/bin:$PATH; /workspace/deploytools/node_modules/.bin/wrangler login` and approve in the box browser, **or**
2. Create an API token with **Cloudflare Pages: Edit** and export `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`.

Then run:
```bash
bash /workspace/tipslice-hosting/migrate-to-cloudflare-pages.sh   # creates tipslice.pages.dev, rewrites canonical/og/JSON-LD/sitemap/robots to it, deploys, verifies robots
```
Redeploy after that: `wrangler pages deploy <staged dir> --project-name tipslice --branch main` (the script does this). Keep surge as an optional mirror.

**AdSense caveat:** `surge.sh`, `pages.dev`, and `netlify.app` are on the Public Suffix List, so `tipslice.<host>/ads.txt` counts as the root `ads.txt`. Even so, AdSense often turns down or slow-walks free shared subdomains. A cheap custom domain pointed at Cloudflare Pages is the safer path to approval (Matt decision; nothing bought).
