#!/usr/bin/env python3
"""Record a deliberate match between one POI record and one OSM candidate. Standard library only.

  # attach an OSM feature (position, id and provenance come from the candidates file)
  python3 scripts/apply-poi-match.py --candidates research/.../candidates.geojson \
      --id rabat-hassan-tower --osm way/253426261 --note "why this one"

  # record that the place was looked for and not found
  python3 scripts/apply-poi-match.py --id rabat-marea --not-in-osm --note "no feature named Marea"

Only this record changes. status stays as it is unless --status is given. Run
`node scripts/validate-pois.mjs --update-manifest` afterwards.
"""
import argparse, glob, json
from pathlib import Path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pois-dir", default="data/pois/rabat")
    ap.add_argument("--candidates")
    ap.add_argument("--id", required=True)
    ap.add_argument("--osm", help="node/123, way/123 or relation/123")
    ap.add_argument("--not-in-osm", action="store_true")
    ap.add_argument("--note")
    ap.add_argument("--status", choices=["ready", "verify", "placeholder"])
    ap.add_argument("--verified-at")
    a = ap.parse_args()
    if bool(a.osm) == bool(a.not_in_osm):
        ap.error("give exactly one of --osm or --not-in-osm")

    for path in sorted(glob.glob(a.pois_dir + "/*.geojson")):
        fc = json.loads(Path(path).read_text(encoding="utf-8"))
        for f in fc["features"]:
            p = f["properties"]
            if p["id"] != a.id:
                continue
            if a.osm:
                otype, oid = a.osm.split("/")
                oid = int(oid)
                cands = json.loads(Path(a.candidates).read_text(encoding="utf-8"))["features"]
                hit = [c for c in cands if c["properties"]["osm_type"] == otype and c["properties"]["osm_id"] == oid]
                if len(hit) != 1:
                    raise SystemExit("candidate %s not found exactly once in %s" % (a.osm, a.candidates))
                c = hit[0]
                f["geometry"] = {"type": "Point", "coordinates": c["geometry"]["coordinates"]}
                p.update({"osm_type": otype, "osm_id": oid, "source": "OpenStreetMap", "source_id": a.osm,
                          "position_from": c["properties"]["point_from"], "match_status": "matched"})
                wd = c["properties"]["tags"].get("wikidata")
                if wd:
                    p["wikidata"] = wd
            else:
                f["geometry"] = None
                p.update({"osm_type": None, "osm_id": None, "source": "unmatched", "source_id": None,
                          "position_from": None, "match_status": "not-in-osm"})
            if a.note:
                p["match_note"] = a.note
            if a.status:
                p["status"] = a.status
            if a.verified_at:
                p["verified_at"] = a.verified_at
            Path(path).write_text(json.dumps(fc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print("updated", a.id, "->", p["match_status"], p.get("source_id") or "")
            return
    raise SystemExit("no record with id " + a.id)


if __name__ == "__main__":
    main()
