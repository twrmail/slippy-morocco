# Slippy Morocco

A separate, source-traceable geographic foundation for Rabat and its surrounding area.

## First milestone: roads and water

The first working map is deliberately limited to:

- the road network, from local streets through major routes;
- the Atlantic coastline, Bouregreg and mapped waterways;
- mapped water bodies and reservoirs.

This is a geographic base layer, not yet a visitor product. Terrain, buildings, land cover, transit, routing, tourism, tours, language lessons, stadium guides and visitor services are later decisions, not prerequisites for this milestone.

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

Research and rights documentation are in place. The first OSM roads-and-water base build is being prepared from a dated Geofabrik Morocco extract. OSM is the working source under ODbL 1.0; CNER classified-road data and SIG Maroc layers remain separate candidates pending provenance and written reuse clarification.
