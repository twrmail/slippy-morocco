# Rabat Source Comparison — Roads and Water

**Research date:** 2026-11-14  
**Purpose:** Identify geographic sources that can be compared with OpenStreetMap (OSM) for the first Rabat map.  
**Scope:** Roads and water only. This is a research register, not an approval to use or redistribute every source listed.

## Bottom line

OSM is currently the only practical, identified source for building the first detailed roads-and-water map. It is openly downloadable and its reuse rules are published. It is not automatically authoritative or complete, so we should compare it where possible.

Morocco has official mapping and road-information institutions. However, the public evidence reviewed so far does **not** establish that their detailed Rabat road and water GIS datasets are freely downloadable and reusable in our application.

The most useful comparison leads are:

1. **ANCFCC** — national mapping authority and official map products.
2. **CNER / Ministry of Equipment and Water** — official classified-road information system.
3. **National Geoportal / Taamir** — intended access point for official geographic reference information.
4. **Morocco Open Data portal** — possible downloadable public datasets, but each dataset must be found and its own terms checked.
5. **HydroRIVERS** — independent broad-scale river-network check, not detailed urban water mapping.
6. **2025 classified-road shapefile circulated in the OSM Morocco community** — potentially valuable road-reference lead, but provenance and reuse rights are not yet established.

No non-OSM source in this document is approved for inclusion in the first map.

## Comparison with the Pennsylvania model

In Pennsylvania, state-produced road information gave us an independent reference against which to compare OSM. The closest Moroccan institutional counterparts identified so far are ANCFCC for national cartography and CNER / the Ministry of Equipment and Water for the classified road network.

The important difference is that finding an official institution or viewing its map is not the same as obtaining a reusable GIS dataset. We have not yet confirmed a public download with clear reuse rights for Rabat from either institution.

## Source findings

### 1. OpenStreetMap — working source for the first map

- **Provider:** OpenStreetMap contributors.
- **Data access:** Downloadable country extracts are available through providers such as Geofabrik.
- **Potential use:** Detailed road network, coastline, Bouregreg, waterways and mapped water bodies.
- **License:** Open Database License (ODbL) 1.0.
- **Status:** **WORKING SOURCE — subject to ODbL compliance.**
- **Cautions:** Preserve extract date, provider, URL, checksum, source identifiers and processing history. Show clear attribution. Before distributing a derived database, determine and meet the applicable ODbL obligations. Do not copy tiles from the public OSM tile server.

References:
- https://www.openstreetmap.org/copyright
- https://osmfoundation.org/wiki/Licence/Community_Guidelines/Produced_Work_-_Guideline
- https://download.geofabrik.de/africa/morocco.html

### 2. ANCFCC — official national mapping authority

- **Organization:** Agence Nationale de la Conservation Foncière, du Cadastre et de la Cartographie.
- **What it publishes/offers:** The official product catalogue lists digital and paper topographic maps at several scales, city plans, thematic maps including road maps, aerial photographs, orthophotos and digital terrain models.
- **Potential comparison:** Official road alignments, city-plan detail, coastline and other mapped features, depending on the specific product.
- **Access and rights:** The catalogue establishes that products exist; it does not establish an open license for reuse in our app.
- **Status:** **HOLD — request product-specific terms before using, tracing, adapting, displaying or redistributing.**

References:
- https://www.ancfcc.gov.ma/nosProduits/
- https://www.ancfcc.gov.ma/cartographiepage

Questions to ask ANCFCC if we pursue a product:
- Is a GIS/vector dataset available for Rabat, rather than only a map image or PDF?
- May we use it in a public-facing digital map?
- May we adapt or derive geographic data from it?
- May we redistribute the derived data?
- What attribution is required?
- Are storage, caching, access or user-count limits imposed?

### 3. CNER / Ministry of Equipment and Water — classified road network

- **Organization:** Centre National d'Études et de Recherches Routières (CNER), associated with the Ministry of Equipment and Water.
- **Official system identified:** SIR — Système d'Information Routière.
- **Published description:** Cartography, inventory, linear referencing and analysis of the classified road network.
- **Potential comparison:** National, regional and provincial classified roads, route identifiers and road-network references.
- **Access and rights:** The official website identifies the system and provides an application launch link. The public page reviewed does not establish an open GIS download or reuse license.
- **Status:** **HOLD — strong lead for an inquiry, not yet a usable data source.**

References:
- https://www.cner.ma/portail-applicatif.html
- https://www.cner.ma/index.html

The Ministry's road network statistics published by the High Commission for Planning provide aggregate national road lengths by category. These figures can help with broad context but are not a spatial road layer and cannot validate individual Rabat streets.

Reference:
- https://www.hcp.ma/file/244257/

### 4. National Geoportal / Taamir

- **Organizations:** The national urban-planning authorities describe a National Geoportal intended to provide official geographic reference information to the public, administrations and professionals.
- **Potential comparison:** Official planning and geographic reference layers, depending on what is actually published and downloadable.
- **Access and rights:** The public description explains the portal's purpose. It does not by itself identify a downloadable Rabat roads or hydrography dataset or grant reuse rights.
- **Status:** **INVESTIGATE — inspect the live portal and individual dataset metadata before relying on it.**

Reference:
- https://taamir.gov.ma
- https://aut.gov.ma/services/

### 5. Morocco national Open Data portal

- **Portal:** data.gov.ma, operated by the Agence de Développement du Digital.
- **Potential use:** Search for public datasets supplied by Moroccan agencies, including any road, water, infrastructure or geographic reference files.
- **Reuse:** The portal describes published open datasets as available for free reuse. The portal's terms and the specific dataset's producer, metadata and license still need to be checked.
- **Important limitation:** The portal FAQ recognizes geospatial data as a possible category, but that does not prove a detailed Rabat road or water dataset is currently available. A portal feedback page has also explicitly called for spatial-reference data such as road and hydrographic networks to be made public. This is a warning not to assume that such files are already available.
- **Status:** **SEARCH CATALOGUE — approve only a specific dataset after inspection.**

References:
- https://www.data.gov.ma/
- https://www.data.gov.ma/fr/faq
- https://www.data.gov.ma/en/node/3827
- https://www.data.gov.ma/fr/node/13
- https://www.data.gov.ma/index.php/fr/feedback/rendre-publiques-les-donnees-references-spatiales

### 6. HydroRIVERS — independent broad-scale river comparison

- **Provider:** HydroSHEDS / WWF and research partners.
- **Product:** Global vector river network.
- **Resolution:** Derived from HydroSHEDS core layers at 15 arc-second resolution.
- **Potential use:** Check the broad regional river-network context around the Bouregreg.
- **Limitations:** It represents river reaches meeting catchment-area or flow thresholds. It is not designed to provide a detailed urban shoreline, small waterways or the precise edge of the estuary.
- **License:** HydroSHEDS license agreement applies. It permits scientific, educational and commercial use subject to its terms, attribution and redistribution restrictions. Review the actual agreement before using or redistributing files.
- **Status:** **REFERENCE ONLY — possible independent check of major river context, not a first-map replacement for OSM water geometry.**

References:
- https://www.hydrosheds.org/products/hydrorivers
- https://data.hydrosheds.org/file/technical-documentation/HydroRIVERS_TechDoc_v10.pdf

### 7. Morocco classified-road shapefile circulated in the OSM community

- **Lead:** A January 2025 Morocco road-network shapefile was linked from a post on the OSM Morocco mailing list.
- **Described contents:** National, regional and provincial road traces, with an `etat` attribute described as paved, unpaved or uncertain.
- **Potential use:** Compare classified-route geometry and route references against OSM.
- **Important uncertainty:** The page describing the file is a community post. The underlying producer, original provenance, date of compilation, completeness and reuse rights have not yet been independently verified. The fact that it was shared on an OSM mailing list does not make it an official government dataset or automatically grant reuse rights.
- **Status:** **HOLD — investigate provenance and license before download/use.**

Reference:
- https://map.comptoir.net/maroc-reseau-routier-2025-01/

## Water-specific judgment

For the first Rabat map, the Atlantic coast and Bouregreg should be represented using OSM water geometry unless a better-licensed, detailed source is found.

HydroRIVERS can provide a broad independent river-network check, but its scale and feature thresholds make it unsuitable as the detailed source for the estuary and urban water edges.

Satellite imagery can help a human visually inspect whether a shoreline or water feature appears plausible, but imagery is not automatically a reusable vector boundary. Do not trace imagery into the product unless the imagery terms permit that use and the interpretation is clearly documented.

## Current source decisions

| Source | Roads | Water | Rights status | Current decision |
|---|---|---|---|---|
| OpenStreetMap | Detailed network | Coast, Bouregreg and mapped water | ODbL 1.0; obligations documented | Working source |
| ANCFCC | Official maps/products | Possible official mapping | Product-specific terms unresolved | Hold |
| CNER / SIR | Classified road network | Not established | Download/reuse rights unresolved | Hold / inquire |
| National Geoportal / Taamir | Possible official reference data | Possible official reference data | Dataset-specific terms not checked | Investigate |
| data.gov.ma | Search for agency datasets | Search for agency datasets | Per-dataset terms required | Search catalogue |
| HydroRIVERS | Not applicable | Major river network only | HydroSHEDS agreement | Reference only |
| 2025 community road shapefile | Classified routes | Not applicable | Provenance/license unresolved | Hold |

## Small next steps

1. Keep OSM as the sole working source for the first map.
2. Search the National Open Data portal for actual downloadable Rabat road and hydrography datasets. Record exact dataset pages, not just portal homepages.
3. Make one focused inquiry to CNER asking whether a public GIS export of the classified road network covering Rabat is available and what reuse terms apply.
4. Inspect the National Geoportal/Taamir and ANCFCC catalogues for specific Rabat layers and metadata.
5. Do not add another dataset to the map until its geometry, coverage, currency, provenance and reuse rights have been checked.

**No external dataset has been downloaded, incorporated or approved by this research note.**
