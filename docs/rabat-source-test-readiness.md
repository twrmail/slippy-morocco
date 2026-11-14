# Rabat Source Test: What We Can Actually Compare

**Research date:** 2026-11-14  
**Scope:** First-map roads and water only.  
**Purpose:** Move from candidate-source research toward a real, rights-aware comparison with OSM.

## Current finding

We have identified more concrete comparison candidates, but we have **not yet established permission to incorporate any non-OSM candidate into Slippy Morocco**.

The first comparison should not be a visual comparison of web maps. It should be a controlled comparison of source vector data, after provenance, license, date, coverage and coordinate reference system are established.

## Roads

### A. CNER official road reference — strong authority, unresolved reuse

CNER's official PR Tracker page states that the application is based on the official *Tableau des Routes* published in January 2025. It exposes a national-road workflow with road classes including motorways, RN, RR and RP; filters for region, province and road surface condition; and road-reference / kilometre-point functions.

CNER's application page also states © 2025–2026 CNER, all rights reserved.

What this establishes:
- CNER is a strong institutional source for Morocco's classified road network.
- The official January 2025 road table is the stated reference behind PR Tracker.
- The public application exposes network-related functions and road reference information.

What it does **not** establish:
- that a public GIS export of the road network is available;
- that the network can be downloaded without an account;
- that the geometry can be copied into another application;
- that derived or redistributed road data may be published.

**Status: AUTHORITATIVE REFERENCE — permission needed before copying or redistributing data.**

References:
- https://www.cner.ma/prtracker/
- https://www.cner.ma/portail-applicatif.html
- https://www.cner.ma/index.html

### B. CNER Atlas routier 2024 / January 2025

A community page linking the January 2025 road reference lists a CNER Road Atlas 2024 PDF, 180 pages and approximately 191 MB. The page says the atlas does not contain provincial roads.

This may help a human verify route numbers and classifications. It is not a vector dataset and should not be traced into Slippy Morocco without permission.

**Status: REFERENCE ONLY — not a source for digitizing geometry.**

Reference:
- https://map.comptoir.net/maroc-reseau-routier-2025-01/

### C. January 2025 Morocco road shapefile circulated in the OSM community

The same community page links a 48 MB shapefile described as the 2025 Morocco road network. It lists:
- 23 national route traces (RN);
- 102 regional route traces (RR);
- 1,126 provincial route traces (RP);
- an `etat` field described as 1 = paved, 0 = unpaved, -1 = uncertain / under study.

The page says the file was published on the OSM Morocco mailing list and suggests the hashtag `#MA_RR_202501` to track contributions.

This is an unusually useful lead because it may provide route geometry and road-surface information. However, the community page does not itself establish the original producer, data lineage, license, or right to republish the geometry. It may be related to the CNER official road table, but we must not assume that relationship grants reuse rights.

**Status: HOLD — investigate original provenance and permission. Do not commit or redistribute the shapefile yet.**

Reference:
- https://map.comptoir.net/maroc-reseau-routier-2025-01/

## Water and an additional road candidate

### D. SIG Maroc vector catalogue

SIG Maroc lists both:
- Réseau Hydrographique (Cours d'eau)
- Réseau Routier Complet

The interactive map identifies these as vector layers in EPSG:4326 and offers free area extraction with a stated limit of 30,000 hectares / 150 MB. The catalogue also lists water-body polygons (lakes / dams).

This is the first concrete lead for a paired road-and-water vector comparison around Rabat.

However, there is a significant rights issue:

- SIG Maroc's own terms, updated 16 March 2026, state that reproducing, distributing or publishing site content without prior authorization is prohibited.
- The catalogue says some datasets are free to download, but free download does not itself grant reuse rights.
- Kharita's separate catalogue page describes a Roads (SIG Maroc) dataset and declares CC BY 4.0. That is a potentially helpful license statement, but it is not yet reconciled with SIG Maroc's own terms or confirmed for the hydrography layer.
- We have not confirmed the original source, date, methods, completeness or accuracy of the SIG Maroc roads and water layers.

**Status: HOLD — ask SIG Maroc to clarify dataset-specific reuse rights and source lineage in writing.**

References:
- https://sig-maroc.com/donnees/catalogue
- https://maps.sig-maroc.com/?group=shapefiles-maroc&layer=cours_eau
- https://www.sig-maroc.com/legales/conditions-utilisation
- https://lekharita.com/en/donnees/routes

### E. Kharita catalogue — useful secondary metadata, not final rights clearance

Kharita describes its Roads (SIG Maroc) dataset as:
- national coverage;
- CSV, GeoJSON and Shapefile formats;
- updated 30 July 2026;
- source: SIG Maroc;
- license: CC BY 4.0.

Kharita provides area extraction after email sign-in. The explicit CC BY 4.0 declaration is worth preserving as evidence. But the upstream SIG Maroc terms described above prohibit reproduction/distribution/publication without prior permission. We need the data publisher to explain the relationship between these statements before relying on CC BY 4.0.

No corresponding Kharita hydrography license statement has been verified.

**Status: HOLD — potentially reusable road comparison candidate, subject to written clarification.**

Reference:
- https://lekharita.com/en/donnees/routes

## Correction concerning the national Open Data portal

The previously cited data.gov.ma feedback page is a user-submitted request asking that spatial reference datasets (including roads and hydrography) be made public. It is not an official government declaration that all spatial data are unavailable. It is evidence of a public request / perceived gap, not a definitive statement of portal inventory.

Reference:
- https://www.data.gov.ma/index.php/fr/feedback/rendre-publiques-les-donnees-references-spatiales

## Current comparison matrix

| Candidate | Roads | Water | Provenance / authority | Reuse status | Decision |
|---|---|---|---|---|---|
| OSM | Detailed streets and roads | Coast, river, waterways and water bodies | OpenStreetMap contributors | ODbL 1.0 | Working source |
| CNER PR Tracker / official road table | Classified road reference and route positions | Not established | Strong official institutional reference | Public reuse not established; app says all rights reserved | Ask CNER |
| CNER road atlas | Route reference / classification, not vector GIS | Not established | CNER atlas linked as official | Reproduction / tracing rights not established | Reference only |
| 2025 road shapefile | RN, RR, RP route traces and surface field | No | Community-posted; original lineage unclear | Not established | Hold |
| SIG Maroc roads | National road vector layer | No | Private geospatial provider; source lineage not described on layer page | Site terms restrict reproduction/publication without permission | Hold |
| SIG Maroc hydrography | No | National hydrography vector layer | Private geospatial provider; layer description absent | Same unresolved terms | Hold |
| Kharita / Roads (SIG Maroc) | National road dataset | No | Secondary catalogue says source SIG Maroc | Kharita declares CC BY 4.0; upstream conflict unresolved | Hold pending clarification |
| HydroRIVERS | No | Broad-scale river network | HydroSHEDS / WWF and partners | Separate HydroSHEDS terms apply | Regional cross-check only |

## What a real comparison should measure

Once a non-OSM source has been cleared for analysis, compare it with OSM only within the same Rabat study boundary.

### Roads
- total line length by class, where classes are comparable;
- number of features and route identifiers;
- spatial overlap / near-match rate;
- route sections present in one source but not the other;
- positional offsets between matched line segments;
- road surface or status attributes, only where definitions are known;
- date and coverage differences.

Do not treat every unmatched line as an OSM error. One dataset may include only classified roads while OSM includes local streets, service roads, paths and access ways. Match like with like.

### Water
- compare the Atlantic coastline and Bouregreg geometry separately;
- compare river centerlines separately from water-body / estuary polygons;
- inspect topology and gaps;
- measure positional differences only where the feature definitions and scale are comparable.

Do not compare a coarse river centerline against a detailed estuary polygon as if they represent the same geometry.

## Small next action

Before downloading or processing a third-party dataset, send two focused permission / provenance requests:

1. **CNER:** Is the January 2025 classified road network available as GIS vector data for Rabat? What are the source date, coordinate reference system, feature classes, and written terms for analysis, adaptation, web display and redistribution?
2. **SIG Maroc:** Who produced the Roads and Hydrography layers, what are their original sources and dates, and do the stated CC BY 4.0 terms authorize download, modification, public display and redistribution despite the site's general terms?

If permissions are granted, acquire only the Rabat area, record original files and checksums, and run a reproducible comparison against an OSM extract. Keep all unapproved sources out of the production map.

## What has not happened

- No non-OSM road or water file has been downloaded into this repository.
- No geometry comparison has been run.
- No non-OSM dataset has been approved for incorporation.
- OSM remains the only working source for the first map.
