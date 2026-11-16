#!/usr/bin/env python3
"""Derive data/rabat/sea.geojson from the OSM coastline ways already in water-lines.geojson.

Python standard library only. Run from the repository root:
    python3 scripts/build-sea.py

Method
 1. Take the ways tagged natural=coastline from data/rabat/water-lines.geojson.
 2. Chain them end to end into one line (OSM coastline ways connect end to start).
 3. OSM convention: land is on the LEFT of a coastline way, sea on the RIGHT. Chained
    NE -> SW here, the sea is therefore to the north-west.
 4. Extend both ends of the chained line along their final heading, well beyond the
    map's maxBounds (js/app.js), then close the ring through the north-west.
Everything inside the study window comes straight from OSM; only the extensions outside
it are straight-line guesses, and the app never shows them (it limits panning).
Derived data: (c) OpenStreetMap contributors, ODbL 1.0.
"""
import json, hashlib, pathlib

SRC = pathlib.Path("data/rabat/water-lines.geojson")
OUT = pathlib.Path("data/rabat/sea.geojson")
r = lambda p: (round(p[0], 7), round(p[1], 7))

lines = [f["geometry"]["coordinates"] for f in json.load(open(SRC))["features"]
         if "coastline" in (f["properties"].get("other_tags") or "")]
assert lines, "no coastline ways found"
by_start = {r(l[0]): l for l in lines}
ends = {r(l[-1]) for l in lines}
heads = [l for l in lines if r(l[0]) not in ends]
assert len(heads) == 1, f"coastline ways do not form a single chain (found {len(heads)} starts)"
chain, line = [], heads[0]
while True:
    chain += line if not chain else line[1:]
    nxt = by_start.get(r(line[-1]))
    if nxt is None or nxt is line:
        break
    line = nxt
assert len(chain) == sum(len(l) for l in lines) - (len(lines) - 1), "not every coastline way was chained"

def extend(a, b, target_lat):
    """Point on the ray a->b (b is the end) where latitude reaches target_lat."""
    t = (target_lat - b[1]) / (b[1] - a[1])
    return [b[0] + t * (b[0] - a[0]), target_lat]

# Heading at each end uses points ~20 vertices in, which smooths the local wiggles.
ne_dir = extend(chain[20], chain[0], 34.40)      # chain runs NE -> SW, so the NE end is chain[0]
sw_dir = extend(chain[-21], chain[-1], 33.75)
ring = [ne_dir] + chain + [sw_dir, [-7.40, 33.75], [-7.40, 34.45], [ne_dir[0], 34.45], ne_dir]
ring = [[round(x, 6), round(y, 6)] for x, y in ring]

feature = {"type": "Feature",
           "properties": {"name": "Atlantic Ocean (derived)", "derived_from": "OSM natural=coastline ways in water-lines.geojson",
                          "note": "Inside the study window this follows OSM coastline; outside it the boundary is a straight-line extension and not map data."},
           "geometry": {"type": "Polygon", "coordinates": [ring]}}
OUT.write_text(json.dumps({"type": "FeatureCollection", "features": [feature]}, separators=(",", ":")))
b = OUT.read_bytes()
print(f"wrote {OUT}: {len(chain)} coastline vertices, {len(b)} bytes, sha256 {hashlib.sha256(b).hexdigest()}")
