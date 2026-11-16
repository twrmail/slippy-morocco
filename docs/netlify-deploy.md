# Deploying Slippy Morocco to Netlify

This is a plain static site. There is nothing to build or install on Netlify: you upload ready-made files.

## What to publish

The package is one folder, **`slippy-morocco-netlify`**. Its top level contains `index.html`, `manifest.webmanifest`, `sw.js`, `_headers`, and the `css/`, `js/`, `icons/` and `data/` folders. **That folder is the one Netlify publishes.** All paths in the app are relative (`./…`), so it works at the root of a Netlify site such as `https://your-name.netlify.app/`.

The package is the app only. It deliberately does not contain the repository's docs, scripts, workflows or the source logo.

## Getting the package

**Option A: the ZIP you were given** (`slippy-morocco-netlify.zip`).

**Option B: from GitHub, no commands needed.**
1. Open the repository's **Actions** tab and click the latest run of **Validate Rabat map app**.
2. At the bottom, under **Artifacts**, download **slippy-morocco-netlify-package**. GitHub hands you a ZIP with `index.html` at its top level.

## Deploy (new site)

1. Unzip the file. You should get a folder that has `index.html` directly inside it (not a folder inside a folder).
2. Go to <https://app.netlify.com/drop>.
3. Drag that **folder** onto the drop zone. (Netlify also accepts the ZIP itself, but its own guidance is to unzip first.)
4. Wait a few seconds. Netlify shows a `*.netlify.app` address. Open it.

You can deploy first and sign in/claim the site afterwards.

## Update later

Open the site in your Netlify dashboard → **Deploys**, and drag the new folder onto the drop area at the bottom of that page. If the app files changed, also bump `CACHE_NAME` in `sw.js` (the version number at its top) so phones pick up the new shell; the service worker fetches fresh files whenever the phone is online, so this is only a safeguard.

## Check it worked

- **Desktop:** the map shows Rabat and Salé roads, the Bouregreg and the Atlantic coastline; the bottom bar shows "© OpenStreetMap contributors". Loading takes a few seconds because the road data is large (about 18 MB raw; much smaller if Netlify compresses it).
- **Phone:** open the same address. Android Chrome offers **Install app** (and shows an "Install app" button in the header when the browser allows it). On iPhone Safari, use **Share → Add to Home Screen**.
- **Icons:** the installed app should show the Slippy globe icon.

## What works offline, and what does not

| Part | Where it comes from | Offline? |
|---|---|---|
| App shell: `index.html`, CSS, app JS, manifest, icons | Your Netlify site, cached by the service worker | Yes: the page frame opens offline |
| MapLibre GL JS 5.6.2 (map engine and stylesheet) | `cdn.jsdelivr.net` | **No**: needs internet |
| Road/water map data (`data/rabat/*.geojson`, about 18.7 MB) | Your Netlify site, **not** cached by the service worker | **No**: needs internet |
| Street-name label fonts (glyphs) | `fonts.openmaptiles.org` | **No**: needs internet |

So offline, the app opens its frame and shows "The map library could not load. Check your connection and reload." **This version is not an offline map.** Making the map work offline (self-hosting MapLibre, caching the data, self-hosting fonts) is a separate, later decision.

No OpenStreetMap public tile servers are used; the map is drawn from the repository's own GeoJSON files.

## Known things to look at after deploying

- Street-name labels appear only when zoomed in (zoom 14+). Many road names are bilingual (Latin + Arabic script). The hosted font may not draw Arabic letters, so some labels could look incomplete. This could not be checked from the build environment (no access to the font server); please zoom into the city and tell us what you see.
- The Atlantic Ocean is the same beige as land (the data has coastline lines but no sea polygon). The blue coastline marks the edge.
