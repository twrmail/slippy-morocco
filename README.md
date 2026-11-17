# Slippy Morocco

A separate, source-traceable geographic foundation for Rabat and its surrounding area.

## First milestone: roads and water

The first working map is deliberately limited to:

- the road network, from local streets through major routes;
- the Atlantic coastline, Bouregreg and mapped waterways;
- mapped water bodies and reservoirs.

This is a geographic base layer, not yet a visitor product. Terrain, buildings, land cover, transit, routing, tourism, tours, language lessons, stadium guides and visitor services are later decisions, not prerequisites for this milestone.

## The app and how to deploy it

`index.html` at the repository root is the first Slippy Morocco map (MapLibre, roads and water only). A ready-to-upload Netlify package is built automatically by GitHub Actions (artifact `slippy-morocco-netlify-package`). Step-by-step instructions, what is cached and what needs the internet: [`docs/netlify-deploy.md`](docs/netlify-deploy.md). A second tab, **Learn**, holds "FIFA Tour: Learn the Game", a short football-basics guide: an SVG pitch pinned at the top with ten lessons scrolling beneath it. Its wording is in `data/learn/en.json` (separate from the code so it can be translated) and it works offline. The app icons are made from the original Slippy logo in `brand/` (resize and padding only) by `scripts/make-icons.py`.

## Data principles

1. Every dataset must have a recorded source, acquisition date, version or checksum where available, and license/terms assessment.
2. Publicly viewable or downloadable does not automatically mean reusable. No third-party source is redistributed until its terms are understood.
3. Keep raw source data separate from derived data. Derived outputs must be reproducible from documented inputs and steps.
4. Keep observations from local contributors distinct from authoritative source data. Record evidence and review before incorporating corrections.
5. Do not treat unknown, unverified, or unavailable data as confirmed.
6. Keep this repository independent from Pennsylvania Slippy projects and their data.

## Working geography

The initial study area is Rabat–Salé and the Bouregreg corridor, with enough surrounding context to understand the Atlantic coast and connected urban geography. The first extraction uses a provisional rectangular window, documented in `data/rabat/README.md` and the generated manifest. It is not an official administrative boundary.

## Status

Research and rights documentation are in place. The first OSM roads-and-water base has been generated and validated from the 2026-10-27 Morocco extract mirror snapshot. It contains 33,956 road ways, 44 water/coastline lines and 58 water-area polygons in the provisional window. The source snapshot, checksum, extraction bounds, output checksums and counts are recorded in `data/rabat/manifest.json`. OSM is the working source under ODbL 1.0; CNER classified-road data and SIG Maroc layers remain separate candidates pending provenance and written reuse clarification.
