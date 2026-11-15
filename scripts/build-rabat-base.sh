#!/usr/bin/env bash
set -euo pipefail

# Provisional Rabat–Salé / Bouregreg / Atlantic study window.
BBOX="-6.98,33.90,-6.70,34.12"
SNAPSHOT="morocco-261114"
PBF_URL="https://download.geofabrik.de/africa/${SNAPSHOT}.osm.pbf"
WORK_DIR="${RUNNER_TEMP:-/tmp}/rabat-osm-build"
OUT_DIR="data/rabat"

mkdir -p "$WORK_DIR" "$OUT_DIR"
PBF="$WORK_DIR/${SNAPSHOT}.osm.pbf"
CLIPPED="$WORK_DIR/rabat-area.osm.pbf"

echo "Downloading pinned Geofabrik snapshot: $PBF_URL"
curl --fail --location --retry 3 --retry-delay 5 "$PBF_URL" --output "$PBF"

PBF_SHA256="$(sha256sum "$PBF" | awk '{print $1}')"
PBF_SIZE="$(stat -c '%s' "$PBF")"

echo "Clipping complete OSM ways to provisional Rabat bbox: $BBOX"
osmium extract --bbox="$BBOX" --strategy=complete_ways --output="$CLIPPED" "$PBF"

echo "Exporting roads"
ogr2ogr -f GeoJSON -t_srs EPSG:4326 \
  -lco RFC7946=YES -lco COORDINATE_PRECISION=7 \
  "$OUT_DIR/roads.geojson" "$CLIPPED" \
  -sql "SELECT * FROM lines WHERE highway IS NOT NULL" -dialect SQLITE

echo "Exporting waterways and coastline"
ogr2ogr -f GeoJSON -t_srs EPSG:4326 \
  -lco RFC7946=YES -lco COORDINATE_PRECISION=7 \
  "$OUT_DIR/water-lines.geojson" "$CLIPPED" \
  -sql "SELECT * FROM lines WHERE waterway IS NOT NULL OR other_tags LIKE '%\"natural\"=>\"coastline\"%'" -dialect SQLITE

echo "Exporting mapped water areas"
ogr2ogr -f GeoJSON -t_srs EPSG:4326 \
  -lco RFC7946=YES -lco COORDINATE_PRECISION=7 \
  "$OUT_DIR/water-areas.geojson" "$CLIPPED" \
  -sql "SELECT * FROM multipolygons WHERE natural = 'water' OR landuse = 'reservoir' OR other_tags LIKE '%\"water\"=>\"lake\"%' OR other_tags LIKE '%\"water\"=>\"reservoir\"%' OR other_tags LIKE '%\"water\"=>\"pond\"%' OR other_tags LIKE '%\"waterway\"=>\"riverbank\"%'" -dialect SQLITE

echo "Validating GeoJSON and writing manifest"
python3 - "$OUT_DIR" "$PBF_URL" "$SNAPSHOT" "$PBF_SHA256" "$PBF_SIZE" "$BBOX" <<'PY'
import datetime, hashlib, json, pathlib, sys

out = pathlib.Path(sys.argv[1])
pbf_url, snapshot, pbf_sha256, pbf_size, bbox = sys.argv[2:]
outputs = {}
for filename in ("roads.geojson", "water-lines.geojson", "water-areas.geojson"):
    path = out / filename
    if not path.exists() or path.stat().st_size == 0:
        raise SystemExit(f"Missing or empty output: {path}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("type") != "FeatureCollection" or not isinstance(payload.get("features"), list):
        raise SystemExit(f"Invalid GeoJSON FeatureCollection: {path}")
    count = len(payload["features"])
    if filename in ("roads.geojson", "water-lines.geojson") and count == 0:
        raise SystemExit(f"Unexpected empty required layer: {path}")
    outputs[filename] = {
        "feature_count": count,
        "bytes": path.stat().st_size,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }

manifest = {
    "project": "slippy-morocco",
    "area": "Rabat-Sale-Bouregreg provisional study window",
    "source": "OpenStreetMap contributors via Geofabrik",
    "source_url": pbf_url,
    "source_snapshot": snapshot,
    "source_pbf_sha256": pbf_sha256,
    "source_pbf_bytes": int(pbf_size),
    "acquired_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "bbox_west_south_east_north": [float(v) for v in bbox.split(",")],
    "crs": "OGC:CRS84 / WGS 84 longitude-latitude (GeoJSON RFC 7946)",
    "license": "Open Database License (ODbL) 1.0",
    "attribution": "© OpenStreetMap contributors",
    "attribution_url": "https://www.openstreetmap.org/copyright",
    "outputs": outputs,
    "notes": [
        "Working base data only; not an authoritative or completeness claim.",
        "Roads are OSM ways tagged highway.",
        "Water lines include mapped waterways and coastline ways.",
        "Water areas include mapped water, reservoir, lake, pond and riverbank polygons.",
        "Raw PBF is a temporary build input and is not committed."
    ]
}
(out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(json.dumps({k: v["feature_count"] for k, v in outputs.items()}, indent=2))
PY

echo "Rabat OSM base build completed."
