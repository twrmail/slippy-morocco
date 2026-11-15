# First Rabat map PWA

## Purpose
A first visual application for the existing Rabat–Salé roads-and-water dataset. This is a working geographic base, not a visitor guide or authoritative road map.

## Included
- MapLibre GL JS rendering.
- Existing roads, water-lines and water-areas GeoJSON layers.
- A restrained mobile-first map interface with pan and zoom.
- PWA manifest, SVG app icon and a small service-worker cache for the application shell.
- Visible OpenStreetMap attribution.

## Data and licensing
The displayed geographic data is from OpenStreetMap contributors, snapshot `morocco-2026-10-27`, distributed under ODbL 1.0. Attribution is displayed in the application and links to https://www.openstreetmap.org/copyright. Consult `data/rabat/manifest.json` and the source-register documentation for provenance, checksums, extraction bounds and license notes.

The study rectangle is provisional and is not an administrative boundary. The data is not a completeness or authority claim.

## External dependency
MapLibre GL JS and its stylesheet are loaded from the pinned jsDelivr package URL (`maplibre-gl@5.6.2`); road-name labels use the OpenMapTiles hosted glyph endpoint. The application does not use the public OpenStreetMap rendered-tile service. The first version needs an internet connection to load the MapLibre library; the service worker caches the same-origin app shell but does not promise a fully offline map.

## Deliberate exclusions
No routing, buildings, terrain, tourism, visitor services, transit, stadium information, language lessons, or additional source datasets.

## Validation
The GitHub Actions workflow checks required application files, manifest parsing, JavaScript syntax, and that the three referenced GeoJSON files are valid FeatureCollections with non-empty roads and water-line layers. It does not replace visual browser testing on desktop and mobile.
