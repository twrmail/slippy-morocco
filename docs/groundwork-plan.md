# Rabat Groundwork: Physical Geography First

## Purpose

Create a reliable, understandable base map of the land before adding visitor-oriented features. The first deliverable is a geographic foundation, not a finished tourism application.

The map should help someone understand the physical setting: where the land rises and falls, where water flows or meets the sea, what covers the surface, and how the built environment sits within that setting.

## Initial study area

Working concept: Rabat–Salé and the Bouregreg corridor, including enough surrounding land and coast to avoid an arbitrary city-edge cut.

The exact extent is **not yet fixed**. It must be selected from documented administrative or physical geography, then checked against source coverage. A provisional bounding box may be used for exploration, but must never be represented as an official boundary.

## Base layers, in priority order

### 1. Terrain and elevation

- Digital elevation model (DEM), with source, resolution, vertical datum, acquisition/version, and known limitations recorded.
- Derived hillshade for visual relief.
- Contours or slope products only where they improve interpretation and do not imply unsupported precision.
- Check for voids, artifacts, coastline/river-edge artifacts, and vertical datum mismatches.

A 30 m global DEM is a reasonable candidate for regional groundwork, not a survey-grade elevation source. It may not resolve small urban features, embankments, walls, or subtle drainage.

### 2. Water and coast

- Atlantic coastline.
- Bouregreg River, estuary, and connected waterways.
- Lakes, reservoirs, ponds, canals, and other mapped water bodies where source quality supports them.
- Keep riverbanks/water polygons distinct from centerlines where the source provides both.

Water geometry is a critical reference layer. Compare independent sources where possible; do not silently choose one when shorelines disagree.

### 3. Land cover

Broad categories such as built-up area, vegetation, cropland, bare ground, and water. Record classification date and resolution. Land-cover products are classifications, not ground truth for an individual parcel.

### 4. Built environment and movement

- Building footprints, where coverage and licensing permit.
- Roads and paths, classified by type.
- Rail and tram corridors/stations.
- Major bridges, ports, and other prominent structures where supported.

Do not imply that a mapped road or path is open, safe, or currently passable without a suitable current source.

### 5. Names and boundaries

- City, commune, province/prefecture, and neighborhood names where verifiable.
- Arabic and French name forms when supplied by a reliable source.
- Latin-script transliterations and local aliases only when sourced; never invent translations or spellings.
- Administrative boundaries kept distinct from informal neighborhood labels.

## Source handling

Every source must have a source-register entry before it is used in a published layer. Record provider, dataset/product, URL, access date, version/date, spatial resolution or scale, coordinate reference system, license/terms, attribution, transformations, and known limitations.

A web map being visible is not evidence that its underlying data can be downloaded or redistributed. A government agency's ownership of data is not evidence of an open license. Where terms are unclear, mark the source **HOLD — rights unresolved** and do not redistribute its data.

Keep source files separate from derived products. Store large source downloads outside Git where appropriate; track stable identifiers, checksums, metadata, and reproducible acquisition steps in the repository.

## Accuracy and validation

The first map must not be judged only by appearance. For each layer, record:

- positional accuracy or stated scale/resolution;
- temporal currency;
- coverage and gaps;
- geometry validity;
- coordinate reference system;
- independent comparison, if available;
- limitations and unresolved conflicts.

Do not merge conflicting datasets into a falsely seamless layer. Preserve provenance at the layer or feature level where practical.

## Local observations

A local contributor may report a missing feature, incorrect name, changed road, or access issue. Record each observation separately with location, observation date, evidence, contributor note, and review status. A report is not automatically an authoritative correction.

## First acceptance gate

Before adding tourist POIs or tours, demonstrate that:

1. Rabat, Salé, the Bouregreg corridor, and the Atlantic coast are spatially coherent.
2. Terrain relief is legible at regional and city scales.
3. Water geometry is plausible and independently checked where possible.
4. Land-cover classes are dated and clearly described as classifications.
5. Basic roads/buildings/transport are legible without overwhelming the terrain.
6. Every included dataset has traceable provenance and cleared reuse terms.
7. Known gaps and uncertain features are visible in a validation report.

## Explicit non-goals for this milestone

- Complete visitor guide or tour planner.
- Stadium/event catalog.
- Turn-by-turn navigation or live traffic.
- Claims about safety, opening hours, or current access.
- Parcel-level, engineering, or survey-grade elevation.
