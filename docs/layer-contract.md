# Geographic Layer Contract — Initial Draft

## Principle

A rendered layer must remain traceable to its source. A visually convincing map is not sufficient evidence of geographic accuracy.

## Layer metadata

Each derived layer should have a manifest entry with:

- stable layer ID and human-readable name;
- theme and geometry type;
- source-register IDs;
- source version/date and acquisition date;
- source checksum or stable product identifier;
- license/terms decision and attribution;
- processing script/version and parameters;
- output coordinate reference system;
- output extent;
- known limitations;
- validation report reference.

## Feature provenance

Where practical, retain source feature identifiers and source attribution fields. Do not discard source IDs during conversion unless a documented reason requires it. If features are combined from multiple sources, provenance must identify the contributing source(s).

## Coordinate reference systems

- Preserve the source CRS in raw data.
- Record every reprojection.
- Choose a documented project CRS appropriate to Morocco and the intended operation.
- Use a suitable projected CRS for metric measurements and local processing; use WGS 84 longitude/latitude only where required for interchange or web display.
- Never assume coordinates are in the expected CRS based only on their numeric appearance.

The exact project CRS will be selected and documented during acquisition planning, after checking source CRSs and intended operations.

## Terrain-specific requirements

For each DEM, record horizontal resolution, vertical units, vertical datum/reference, no-data value, source date/version, and any void-filling or resampling. Hillshade is a visualization derived from the DEM, not an independent elevation source.

Do not combine elevation rasters with incompatible vertical references without a documented transformation.

## Status vocabulary

- **APPROVED** — terms and technical suitability reviewed for the stated use.
- **HOLD** — unresolved rights, metadata, quality, or coverage question.
- **REJECTED** — unsuitable or prohibited for this project use.
- **PROVISIONAL** — exploratory use only; must not be represented as validated.

Unknown is not equivalent to approved.
