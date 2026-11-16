# Rabat base data

This directory is reserved for the first working base layers:

- `roads.geojson` — OSM ways tagged `highway=*`
- `water-lines.geojson` — OSM waterways and coastline ways
- `water-areas.geojson` — OSM mapped water polygons
- `sea.geojson` — Atlantic sea polygon **derived** from the OSM coastline ways in `water-lines.geojson` by `scripts/build-sea.py` (OSM puts the sea on the right of a coastline way). Inside the study window it follows OSM; beyond it the boundary is a straight-line extension (not map data, outside the area the app lets you pan to). Still ODbL, © OpenStreetMap contributors.
- `manifest.json` — source snapshot, extraction boundary, attribution, checksums and feature counts

## Scope

The initial study window is a provisional Rabat–Salé / Bouregreg / Atlantic coast rectangle:

`west=-6.98, south=33.90, east=-6.70, north=34.12`

It is a working clip boundary, not an official administrative boundary.

## Source and rights

The base is derived from OpenStreetMap data distributed by OpenStreetMap France extract mirror. OSM data is licensed under the Open Database License (ODbL) 1.0. Attribute the data to OpenStreetMap contributors and link to https://www.openstreetmap.org/copyright. Review ODbL obligations before distributing a database or derivative database.

OpenStreetMap France extract directory: https://download.openstreetmap.fr/extracts/africa/

No OSM public tile imagery is copied. These are vector data derived from the OSM database.

## Reproducibility

The first build used the mirror's Morocco PBF snapshot dated 2026-10-27. It recorded a SHA-256 checksum of `52af8942273bfc2ffc016d317ae021f0fe56891b14b8d558433bc072ed8ca290` and exported 33,956 road ways, 44 water/coastline lines and 58 water-area polygons. The PBF itself is a temporary build input and is not committed. The `smart` extract strategy preserves complete ways and relation members, so features crossing the rectangle edge may extend beyond the nominal bbox.

The data are a working base, not a claim that OSM is complete or authoritative. Official classified-road data and other sources will remain separate until their provenance and reuse rights are resolved.
