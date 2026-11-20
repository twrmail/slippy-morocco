# Points of Interest (POI) layer

The geography is the foundation. The places are layers. The visitor guide is built on top.

Roads, water and sea stay in `data/rabat/`. Places live in their own dataset in `data/pois/`. This first step
(Rabat POI Layer 01) is **data structure, acquisition, provenance and validation only**. The map app does not
load the POI files yet, and they are not in the Netlify package.

## Hybrid model

- **One canonical record per place.** The map pin, the tap-to-open card and any Guide entry are all that record.
- `featured` controls whether a place appears in the curated Guide. Unfeatured places can still be on the map.
- `guide_topic` links a place to a Guide topic (`must-see`, `where-to-stay`, `eat`, `match-day-stadiums`).
- Four categories, each its own file and, later, its own visibility control: **Stay** (`stay`), **Eat** (`eat`),
  **See** (`see`), **Football** (`football`).

## Files

```
data/pois/
  manifest.json            provenance, acquisition record, file checksums
  rabat/
    stay.geojson  eat.geojson  see.geojson  football.geojson
scripts/
  acquire-rabat-poi-candidates.sh   run by the workflow: OSM extract -> research candidates
  normalize-poi-candidates.py       tidies raw exports into candidates.geojson/csv/report/manifest
  match-poi-seeds.py                PROPOSES OSM matches for each record (changes nothing)
  apply-poi-match.py                records one deliberate match (or "not in OSM") in one record
  validate-pois.mjs                 the checks below; run in CI
.github/workflows/acquire-rabat-poi-candidates.yml
```

A new city is a new folder (`data/pois/<city>/`) with the same four files. The map does not need rebuilding for that.

## Record fields

Every feature is a GeoJSON `Feature` (a `Point`, or `null` geometry while a place has no position).

| Field | Meaning |
|---|---|
| `id` | Permanent id, `rabat-some-name`. Never reused. |
| `name`, `aliases` | Display name; other names used when searching and matching. |
| `category` | `stay`, `eat`, `see` or `football`. Must match the file. |
| `description` | One or two sentences in our own words. |
| `address`, `address_status`, `address_source` | `verified` = checked against the operator's or an official page; `cross-checked` = agreed by two or more non-official sources; `unverified`. |
| `osm_type`, `osm_id` | The OpenStreetMap feature the position comes from (`node`, `way`, `relation`). |
| `source`, `source_id` | `OpenStreetMap` and `node/123`-style id, or `unmatched`. Kept generic so other sources can be added. |
| `position_from` | `point`, `area-centroid` or `line-average`: how the pin was derived from the OSM feature. |
| `match_status`, `match_note` | `matched`, `unmatched` (not tried yet) or `not-in-osm` (searched, not found), and why. |
| `verified_at` | Date the position **and** address were last checked. `null` otherwise. |
| `status` | `ready` (position matched, address verified, owner reviewed), `verify`, or `placeholder` (no position). |
| `featured`, `guide_topic` | See "Hybrid model". |
| `operating_status` | `unverified` until someone checks it at a named source (then `verified` plus `operating_checked_at` and `operating_source`). |
| `website` | `https` link or `null`; filled only when verified. |
| `wikidata` | Optional Wikidata id taken from the OSM feature. |
| `capacity` | Football records only. `status` `VERIFY` with `seats` `null` until an official source confirms. `reported` lists claimed figures and who made them. |

## Data rules

1. **Positions and ids come from OpenStreetMap.** Reuse the matching OSM feature; never create a second geographic
   record for a place OSM already has. If a place is not in OSM, it stays without a position until a separately
   documented point is added.
2. **No invented positions.** A record with no OSM match has `geometry: null` and status `placeholder`.
3. **No Google data.** No ratings, review counts, photos, opening hours or "open/closed" status, and no Google place ids.
   The validator rejects field names that look like these.
4. **Descriptions are written independently**, not copied from listings.
5. **Addresses are verified** and say how (`address_status`, `address_source`). Heritage sites with no street address stay `null`.
6. **Restaurant status stays `unverified`** until checked at a named source.
7. **Stadium capacity stays `VERIFY`** until an official source confirms a number. Reported figures are kept with who reported them.
8. **No match or tournament role** is assigned to any stadium without official confirmation.
9. **Attribution:** the data are © OpenStreetMap contributors (ODbL 1.0). The map shows that attribution already; the manifest records it.

## How candidates are acquired

`.github/workflows/acquire-rabat-poi-candidates.yml` is run by hand (Actions tab, Run workflow). It downloads the same
OSM France Morocco extract as the roads/water base, clips it to the Rabat–Salé window, keeps hotels, restaurants, sights and
stadiums, and writes a dated research folder:

- as a workflow artifact (30 days), and
- to a side branch named `research/rabat-poi-candidates-YYYYMMDD` (only the research folder; it is not merged anywhere).

Nothing from the research folder reaches `data/pois/` automatically. A person reads `match-poi-seeds.py` output,
applies a match with `apply-poi-match.py`, then runs `node scripts/validate-pois.mjs --update-manifest`.

The roads/water base and the POI candidates can come from different OSM snapshots; the manifest records each.

## Validation

`node scripts/validate-pois.mjs` (also run in CI) checks: all four files exist and are FeatureCollections; unique ids;
required fields and allowed values; no unknown or Google-style fields; matched records have a Point inside the study
window, an OSM id and a consistent `source_id`; unmatched records have no geometry; featured records have a `guide_topic`;
football records carry a `VERIFY` capacity; no file in the folder is unlisted; manifest checksums match.

## Not in this step

Map markers, category toggles, tap cards, the Guide screens, routing, reservations, reviews, prices, offline redesign.
