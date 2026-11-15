# Rabat base data

This directory is reserved for the first working base layers:

- `roads.geojson` — OSM ways tagged `highway=*`
- `water-lines.geojson` — OSM waterways and coastline ways
- `water-areas.geojson` — OSM mapped water polygons
- `manifest.json` — source snapshot, extraction boundary, attribution, checksums and feature counts

## Scope

The initial study window is a provisional Rabat–Salé / Bouregreg / Atlantic coast rectangle:

`west=-6.98, south=33.90, east=-6.70, north=34.12`

It is a working clip boundary, not an official administrative boundary.

## Source and rights

The base is derived from OpenStreetMap data distributed by OpenStreetMap France extract mirror. OSM data is licensed under the Open Database License (ODbL) 1.0. Attribute the data to OpenStreetMap contributors and link to https://www.openstreetmap.org/copyright. Review ODbL obligations before distributing a database or derivative database.

Geofabrik source page: https://download.openstreetmap.fr/extracts/africa/

No OSM public tile imagery is copied. These are vector data derived from the OSM database.

## Reproducibility

The build workflow downloads a dated Morocco PBF snapshot, records its SHA-256 checksum, clips it to the provisional study window, exports the selected feature classes, and writes a manifest. The PBF itself is a temporary build input and is not committed.

The data are a working base, not a claim that OSM is complete or authoritative. Official classified-road data and other sources will remain separate until their provenance and reuse rights are resolved.
