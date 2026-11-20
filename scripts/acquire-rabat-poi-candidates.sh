#!/usr/bin/env bash
set -euo pipefail

# Acquire RESEARCH candidates for the Rabat points-of-interest layer from OpenStreetMap.
# Output is a dated research folder. Nothing here is copied into data/pois automatically:
# a person reviews the candidates and matches records deliberately (scripts/match-poi-seeds.py).
#
# Needs: osmium-tool, gdal-bin (ogr2ogr), python3, curl.

BBOX="${BBOX:--6.98,33.90,-6.70,34.12}"   # same provisional Rabat–Salé window as the road/water base
PBF_URL="${PBF_URL:-https://download.openstreetmap.fr/extracts/africa/morocco.osm.pbf}"
STAMP="${STAMP:-$(date -u +%Y%m%d)}"
OUT_DIR="${OUT_DIR:-research/poi-candidates/rabat-$STAMP}"
WORK_DIR="${RUNNER_TEMP:-/tmp}/rabat-poi-build"

mkdir -p "$WORK_DIR" "$OUT_DIR"
PBF="$WORK_DIR/morocco.osm.pbf"

echo "Downloading $PBF_URL"
curl --fail --location --retry 3 --retry-delay 5 "$PBF_URL" --output "$PBF"
PBF_SHA256="$(sha256sum "$PBF" | awk '{print $1}')"
PBF_SIZE="$(stat -c '%s' "$PBF")"
# The mirror's own timestamp for the data (replication timestamp inside the file), if present.
PBF_DATA_TIMESTAMP="$(osmium fileinfo -g header.option.osmosis_replication_timestamp "$PBF" 2>/dev/null || true)"

echo "Clipping to $BBOX"
osmium extract --bbox="$BBOX" --strategy=smart --output="$WORK_DIR/area.osm.pbf" "$PBF"

echo "Filtering visitor-relevant features"
osmium tags-filter "$WORK_DIR/area.osm.pbf" \
  "nwr/tourism=hotel,guest_house,hostel,motel,apartment,attraction,museum,gallery,viewpoint" \
  "nwr/amenity=restaurant" \
  "nwr/historic" \
  "nwr/leisure=stadium" \
  "nwr/building=stadium" \
  --output="$WORK_DIR/poi.osm.pbf" --overwrite

echo "Exporting raw layers"
rm -f "$WORK_DIR"/raw-*.geojson
ogr2ogr -f GeoJSON -t_srs EPSG:4326 -lco RFC7946=YES -lco COORDINATE_PRECISION=7 \
  "$WORK_DIR/raw-points.geojson" "$WORK_DIR/poi.osm.pbf" \
  -sql "SELECT * FROM points WHERE other_tags LIKE '%\"tourism\"=>%' OR other_tags LIKE '%\"amenity\"=>\"restaurant\"%' OR other_tags LIKE '%\"historic\"=>%' OR other_tags LIKE '%\"leisure\"=>\"stadium\"%' OR other_tags LIKE '%\"building\"=>\"stadium\"%'" \
  -dialect SQLITE
ogr2ogr -f GeoJSON -t_srs EPSG:4326 -lco RFC7946=YES -lco COORDINATE_PRECISION=7 \
  "$WORK_DIR/raw-areas.geojson" "$WORK_DIR/poi.osm.pbf" \
  -sql "SELECT * FROM multipolygons WHERE tourism IS NOT NULL OR amenity = 'restaurant' OR historic IS NOT NULL OR leisure = 'stadium' OR building = 'stadium'" \
  -dialect SQLITE
ogr2ogr -f GeoJSON -t_srs EPSG:4326 -lco RFC7946=YES -lco COORDINATE_PRECISION=7 \
  "$WORK_DIR/raw-lines.geojson" "$WORK_DIR/poi.osm.pbf" \
  -sql "SELECT * FROM lines WHERE other_tags LIKE '%\"historic\"=>%' OR other_tags LIKE '%\"tourism\"=>%'" \
  -dialect SQLITE

echo "Normalising into candidates"
python3 scripts/normalize-poi-candidates.py \
  --points "$WORK_DIR/raw-points.geojson" \
  --areas "$WORK_DIR/raw-areas.geojson" \
  --lines "$WORK_DIR/raw-lines.geojson" \
  --out "$OUT_DIR" \
  --bbox "$BBOX" \
  --source-url "$PBF_URL" \
  --pbf-sha256 "$PBF_SHA256" \
  --pbf-bytes "$PBF_SIZE" \
  --pbf-data-timestamp "${PBF_DATA_TIMESTAMP:-unknown}"

echo "Research folder: $OUT_DIR"
ls -l "$OUT_DIR"
