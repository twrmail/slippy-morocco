#!/usr/bin/env python3
"""Turn raw ogr2ogr OSM exports into one tidy RESEARCH file of POI candidates.

Standard library only. Deterministic: the same input produces byte-identical output.
Nothing written here is production data; a person reviews it and matches records on purpose.

Outputs (in --out):
  candidates.geojson  one Point per OSM feature (areas/lines reduced to a representative point)
  candidates.csv      the same, flat, for reading in a spreadsheet
  report.md           counts and caveats
  manifest.json       provenance: source, checksum, bbox, counts, licence
"""
import argparse, csv, hashlib, json, re, sys
from pathlib import Path

PAIR = re.compile(r'"((?:[^"\\]|\\.)*)"=>"((?:[^"\\]|\\.)*)"')
STAY = {"hotel", "guest_house", "hostel", "motel", "apartment"}
SEE_TOURISM = {"attraction", "museum", "gallery", "viewpoint"}
KEEP = ["name", "name:fr", "name:ar", "name:en", "official_name", "alt_name", "tourism", "amenity",
        "historic", "leisure", "building", "sport", "cuisine", "stars", "website", "contact:website",
        "phone", "contact:phone", "opening_hours", "wikidata", "wikipedia", "operator", "capacity",
        "heritage", "start_date", "addr:housenumber", "addr:street", "addr:suburb", "addr:city",
        "addr:postcode", "addr:full"]
SKIP_COLUMNS = {"osm_id", "osm_way_id", "other_tags", "z_order"}


def unescape(s):
    return s.replace('\\"', '"').replace("\\\\", "\\")


def tags_of(props):
    tags = {k: str(v) for k, v in props.items() if k not in SKIP_COLUMNS and v not in (None, "")}
    for k, v in PAIR.findall(props.get("other_tags") or ""):
        tags[unescape(k)] = unescape(v)
    return tags


def category_of(t):
    if t.get("leisure") == "stadium" or t.get("building") == "stadium":
        return "football"
    if t.get("tourism") in STAY:
        return "stay"
    if t.get("amenity") == "restaurant":
        return "eat"
    if t.get("tourism") in SEE_TOURISM or t.get("historic"):
        return "see"
    return None


def ring_centroid(ring):
    a = cx = cy = 0.0
    for (x0, y0), (x1, y1) in zip(ring, ring[1:]):
        w = x0 * y1 - x1 * y0
        a += w
        cx += (x0 + x1) * w
        cy += (y0 + y1) * w
    if abs(a) < 1e-18:
        xs = [p[0] for p in ring]
        ys = [p[1] for p in ring]
        return sum(xs) / len(xs), sum(ys) / len(ys), 0.0
    return cx / (3 * a), cy / (3 * a), abs(a) / 2


def representative_point(geom):
    kind, c = geom["type"], geom["coordinates"]
    if kind == "Point":
        return c[0], c[1], "point"
    if kind == "LineString":
        xs = [p[0] for p in c]
        ys = [p[1] for p in c]
        return sum(xs) / len(xs), sum(ys) / len(ys), "line-average"
    if kind in ("MultiLineString",):
        pts = [p for line in c for p in line]
        return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts), "line-average"
    polys = [c] if kind == "Polygon" else c if kind == "MultiPolygon" else []
    if polys:
        best = max((ring_centroid(p[0]) for p in polys), key=lambda r: r[2])
        return best[0], best[1], "area-centroid"
    raise ValueError("unsupported geometry " + kind)


def load(path):
    if not path or not Path(path).exists():
        return []
    return json.loads(Path(path).read_text(encoding="utf-8")).get("features", [])


def osm_type_and_id(layer, props):
    if layer == "points":
        return "node", props.get("osm_id")
    if layer == "lines":
        return "way", props.get("osm_id")
    if props.get("osm_way_id") not in (None, ""):
        return "way", props["osm_way_id"]
    return "relation", props.get("osm_id")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--points")
    ap.add_argument("--areas")
    ap.add_argument("--lines")
    ap.add_argument("--out", required=True)
    ap.add_argument("--bbox", required=True)
    ap.add_argument("--source-url", required=True)
    ap.add_argument("--pbf-sha256", required=True)
    ap.add_argument("--pbf-bytes", required=True)
    ap.add_argument("--pbf-data-timestamp", default="unknown")
    a = ap.parse_args()

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    rows, skipped = [], {}
    for layer, path in (("points", a.points), ("areas", a.areas), ("lines", a.lines)):
        for f in load(path):
            props = f.get("properties") or {}
            tags = tags_of(props)
            cat = category_of(tags)
            if not cat:
                key = tags.get("tourism") or tags.get("amenity") or "other"
                skipped[key] = skipped.get(key, 0) + 1
                continue
            if not f.get("geometry"):
                continue
            lon, lat, how = representative_point(f["geometry"])
            otype, oid = osm_type_and_id(layer, props)
            rows.append({
                "osm_type": otype,
                "osm_id": abs(int(oid)),
                "category_guess": cat,
                "name": tags.get("name", ""),
                "lon": round(lon, 7),
                "lat": round(lat, 7),
                "point_from": how,
                "tags": {k: tags[k] for k in KEEP if k in tags},
            })
    rows.sort(key=lambda r: (r["category_guess"], r["name"].lower(), r["osm_type"], r["osm_id"]))

    features = [{
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [r["lon"], r["lat"]]},
        "properties": {k: r[k] for k in ("osm_type", "osm_id", "category_guess", "name", "point_from", "tags")},
    } for r in rows]
    gj = {"type": "FeatureCollection", "name": "rabat-poi-candidates", "features": features}
    (out / "candidates.geojson").write_text(json.dumps(gj, ensure_ascii=False, indent=1, sort_keys=False) + "\n", encoding="utf-8")

    with (out / "candidates.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["category_guess", "name", "name:fr", "name:ar", "osm_type", "osm_id", "lat", "lon",
                    "point_from", "subtype", "addr", "website", "capacity"])
        for r in rows:
            t = r["tags"]
            addr = " ".join(x for x in (t.get("addr:housenumber"), t.get("addr:street"), t.get("addr:suburb"),
                                        t.get("addr:city"), t.get("addr:postcode")) if x) or t.get("addr:full", "")
            sub = t.get("tourism") or t.get("amenity") or t.get("leisure") or t.get("building") or t.get("historic") or ""
            w.writerow([r["category_guess"], r["name"], t.get("name:fr", ""), t.get("name:ar", ""), r["osm_type"],
                        r["osm_id"], r["lat"], r["lon"], r["point_from"], sub, addr,
                        t.get("website") or t.get("contact:website", ""), t.get("capacity", "")])

    counts = {}
    named = {}
    for r in rows:
        counts[r["category_guess"]] = counts.get(r["category_guess"], 0) + 1
        if r["name"]:
            named[r["category_guess"]] = named.get(r["category_guess"], 0) + 1
    cand_bytes = (out / "candidates.geojson").read_bytes()
    manifest = {
        "kind": "research-candidates-not-production-data",
        "area": "Rabat-Sale-Bouregreg provisional study window",
        "bbox_west_south_east_north": [float(x) for x in a.bbox.split(",")],
        "source": "OpenStreetMap contributors via OpenStreetMap France extract mirror",
        "source_url": a.source_url,
        "source_pbf_sha256": a.pbf_sha256,
        "source_pbf_bytes": int(a.pbf_bytes),
        "source_data_timestamp": a.pbf_data_timestamp,
        "license": "Open Database License (ODbL) 1.0",
        "attribution": "© OpenStreetMap contributors",
        "attribution_url": "https://www.openstreetmap.org/copyright",
        "outputs": {"candidates.geojson": {"feature_count": len(features), "bytes": len(cand_bytes),
                                           "sha256": hashlib.sha256(cand_bytes).hexdigest()}},
        "counts_by_category_guess": counts,
        "named_counts_by_category_guess": named,
        "skipped_non_visitor_features": dict(sorted(skipped.items())),
        "notes": [
            "Candidates are unreviewed. Category is a guess from OSM tags.",
            "Areas and lines are reduced to a representative point (point_from says how).",
            "OSM tags may be wrong, missing or out of date. Nothing here is verified."
        ],
    }
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = ["# Rabat POI candidates (research, unreviewed)", "",
             "Source: OpenStreetMap contributors (ODbL 1.0), snapshot data timestamp: " + a.pbf_data_timestamp,
             "PBF SHA-256: `" + a.pbf_sha256 + "`", "", "| Category (guess) | Features | With a name |", "|---|---|---|"]
    for c in ("stay", "eat", "see", "football"):
        lines.append("| %s | %d | %d |" % (c, counts.get(c, 0), named.get(c, 0)))
    lines += ["", "Features skipped (tourism/amenity values that are not visitor places): " +
              (", ".join("%s=%d" % kv for kv in sorted(skipped.items())) or "none"), ""]
    (out / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("candidates:", len(features), counts, file=sys.stderr)


if __name__ == "__main__":
    main()
