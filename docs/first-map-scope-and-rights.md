# Rabat First Map: Minimal Scope and Data Rights

## Decision

The first working map is intentionally limited to two geographic layers:

1. **Roads** — the street and road network needed to orient a person in Rabat.
2. **Water** — coastline, Bouregreg, and mapped waterways/water bodies.

No elevation, buildings, land cover, tourism POIs, routing, or visitor content is required for the first working version.

The purpose is to prove that we can acquire lawful source data, extract Rabat, build our own map presentation, and use it comfortably on desktop and phone.

## Why roads and water first

Roads provide the basic structure for orientation. Water provides major geographic context, especially the Atlantic coast and Bouregreg. Together they are a small, useful first map without prematurely committing to a large multi-layer GIS project.

Water is initially represented as two-dimensional geometry. That is sufficient for this milestone; it does not attempt to describe depth, flow, flood risk, or water level.

## Initial data source: OpenStreetMap

Use downloadable OpenStreetMap data, extracted to the Rabat study area. Do not use screenshots or copy tiles from the public OpenStreetMap tile server as the source for our own map.

OSM data is licensed under the Open Database License (ODbL) 1.0.

Official guidance:
- https://www.openstreetmap.org/copyright
- https://osmfoundation.org/wiki/Licence/Community_Guidelines/Produced_Work_-_Guideline
- https://osmfoundation.org/wiki/Licence/Attribution_Guidelines
- https://osmfoundation.org/wiki/Licence/Licence_and_Legal_FAQ

### Required treatment

- Show clear, readable attribution: **Map data from OpenStreetMap**.
- Link the attribution to https://www.openstreetmap.org/copyright wherever the interface permits.
- If distributing OSM data or a derivative database, provide the applicable ODbL notice and make the database available under the required terms.
- Preserve source identifiers and relevant source metadata in our derived data where practical.
- Record the OSM extract date, provider, extract URL, checksum, extraction query/process, and output date.
- Keep our own application code and visual styling distinguishable from the geographic database.
- Do not assume that all data combined with OSM automatically has the same license. Assess whether the result is a derivative database, collective database, or produced work under ODbL guidance.

The map rendering and the underlying data distribution are different legal questions. Before publishing downloadable combined datasets, review the ODbL obligations for the actual database structure and intended distribution.

## Other sources: not in the first build

### ANCFCC

The Moroccan National Agency for Land Conservation, Cadastre and Cartography lists official topographic maps, city plans, aerial imagery, orthophotos, and digital terrain models among its products.

Official catalog:
- https://www.ancfcc.gov.ma/nosProduits/
- https://www.ancfcc.gov.ma/cartographiepage

These are products offered by the agency, not automatically open data. Viewing, purchasing, or receiving a file does not by itself establish permission to digitize, adapt, publish, or redistribute its contents.

Before using an ANCFCC product in the map, obtain written answers about:
- permitted digital use;
- adaptation and derivative works;
- public web display;
- redistribution of derived geographic data;
- attribution wording;
- any limits on storage, caching, or number of users.

Until those rights are clear, status is **HOLD — rights unresolved**. Official maps may still be used as a visual reference only where the applicable terms permit that use; do not trace or digitize their content without permission.

### Copernicus DEM

Copernicus DEM GLO-30 is a possible later terrain source, not part of the first map. Its published terms require a source notice when communicating or distributing the data, and a modified-data notice when adapted.

Official product and terms:
- https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM
- https://dataspace.copernicus.eu/sites/default/files/media/files/2025-06/copernicus_contributing_mission_data_access_v2_cop_dem_licenses.pdf

Reassess its exact product terms when terrain becomes an approved project layer.

## First-map acceptance criteria

1. Rabat is the clear map focus.
2. The road network is legible at useful city and neighborhood zoom levels.
3. The Atlantic coastline and Bouregreg water geometry provide recognizable context.
4. Map works on a phone and desktop.
5. Attribution is visible and links to the OSM copyright page.
6. The source register records the extract date, provider, license, and processing steps.
7. No unlicensed official map content or third-party tile imagery has been copied into the product.

## Later: terrain for walking effort

Elevation is a useful future feature because a visitor may need to understand whether a walk involves a significant climb. It should be added only after the basic map works.

A future terrain feature should distinguish:
- visual relief / hillshade;
- measured or modelled elevation;
- route-specific ascent and descent estimates.

A hillshade alone does not tell a user how hard a particular walk will be. Route gradient requires a route and elevation sampling, and should communicate uncertainty.

## Out of scope for the first map

- Buildings
- Land cover
- Elevation / contours / hillshade
- Transit
- Tourist destinations
- Stadiums and World Cup information
- Tours, language lessons, directions, or live conditions

These can be added later as independent, justified layers.
