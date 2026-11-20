#!/usr/bin/env python3
"""Propose OSM matches for the POI records. Standard library only. Proposes only; changes nothing.

  python3 scripts/match-poi-seeds.py --candidates research/poi-candidates/rabat-YYYYMMDD/candidates.geojson
  python3 scripts/match-poi-seeds.py ... --only rabat-dar-naji --top 8

A person reads the table and applies a match on purpose with scripts/apply-poi-match.py.
"""
import argparse, glob, json, re, unicodedata
from difflib import SequenceMatcher
from pathlib import Path

GENERIC = {"hotel", "restaurant", "rabat", "the", "le", "la", "el", "al", "de", "du", "des", "collection", "by",
           "stade", "stadium", "prince", "complexe", "sportif"}


def norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    return " ".join(s.split())


def key_tokens(s):
    return {t for t in norm(s).split() if t not in GENERIC and len(t) > 1}


def score(names, cand_names):
    best = 0.0
    for n in names:
        for c in cand_names:
            if not n or not c:
                continue
            r = SequenceMatcher(None, norm(n), norm(c)).ratio()
            a, b = key_tokens(n), key_tokens(c)
            if a and b:
                r = max(r, 0.9 * len(a & b) / min(len(a), len(b)))
            best = max(best, r)
    return best


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--candidates", required=True)
    ap.add_argument("--pois-dir", default="data/pois/rabat")
    ap.add_argument("--only")
    ap.add_argument("--top", type=int, default=5)
    a = ap.parse_args()
    cands = json.loads(Path(a.candidates).read_text(encoding="utf-8"))["features"]
    for path in sorted(glob.glob(a.pois_dir + "/*.geojson")):
        for f in json.loads(Path(path).read_text(encoding="utf-8"))["features"]:
            p = f["properties"]
            if a.only and p["id"] != a.only:
                continue
            names = [p["name"]] + p.get("aliases", [])
            rows = []
            for c in cands:
                cp = c["properties"]
                t = cp["tags"]
                cn = [cp["name"], t.get("name:fr", ""), t.get("name:en", ""), t.get("name:ar", ""),
                      t.get("alt_name", ""), t.get("official_name", "")]
                s = score(names, cn)
                if s >= 0.5:
                    rows.append((s, cp["category_guess"] == p["category"], c))
            rows.sort(key=lambda r: (-(r[0] + (0.05 if r[1] else 0)), r[2]["properties"]["osm_id"]))
            print("\n## %s  (%s, %s)" % (p["id"], p["name"], p["category"]))
            if not rows:
                print("   no candidate with name similarity >= 0.5")
            for s, samecat, c in rows[: a.top]:
                cp, t = c["properties"], c["properties"]["tags"]
                lon, lat = c["geometry"]["coordinates"]
                addr = " ".join(x for x in (t.get("addr:housenumber"), t.get("addr:street"), t.get("addr:suburb"), t.get("addr:postcode")) if x)
                sub = t.get("tourism") or t.get("amenity") or t.get("leisure") or t.get("building") or t.get("historic") or ""
                print("   %.2f %s/%d  %s | %s | cat=%s%s | %.6f,%.6f (%s) | %s | wikidata=%s" % (
                    s, cp["osm_type"], cp["osm_id"], cp["name"], sub, cp["category_guess"], "" if samecat else " (DIFFERENT)",
                    lat, lon, cp["point_from"], addr or "no address tags", t.get("wikidata", "-")))


if __name__ == "__main__":
    main()
