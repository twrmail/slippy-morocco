#!/usr/bin/env python3
"""Regenerate the app icons from the original Slippy logo (brand/slippy-logo-detailed.png).

Not needed for deployment: the generated PNGs are committed in icons/.
Requires: python3 + Pillow. Run from the repository root:
    python3 scripts/make-icons.py

The logo artwork is used unaltered (resize + padding only) on an ivory square,
the same ivory as the app header. Nothing is redrawn.
 - "any" icons: whole logo, ~92% of the icon width.
 - maskable icons: whole logo scaled down so every visible pixel sits inside
   the maskable safe zone (a circle of 80% of the icon's width).
"""
import math, pathlib
from PIL import Image

SRC = pathlib.Path("brand/slippy-logo-detailed.png")
OUT = pathlib.Path("icons")
BG = (251, 250, 246, 255)  # #fbfaf6

logo = Image.open(SRC).convert("RGBA")
alpha = logo.split()[3]
bbox = alpha.point(lambda v: 255 if v > 10 else 0).getbbox()
w, h = logo.size
px = alpha.load()
max_r = max(math.hypot(x - w / 2, y - h / 2) for y in range(0, h, 2) for x in range(0, w, 2) if px[x, y] > 40)

def make(size, fraction_of_width=None, safe_zone=False):
    if safe_zone:   # farthest visible pixel must stay inside radius 0.40 * size (a hair of margin)
        scale = (0.40 * size * 0.98) / max_r
    else:
        scale = (fraction_of_width * size) / (bbox[2] - bbox[0])
    side = round(w * scale)
    art = logo.resize((side, side), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), BG)
    # centre the logo canvas (its own transparent margin included) on the icon
    canvas.alpha_composite(art, ((size - side) // 2, (size - side) // 2))
    return canvas.convert("RGB")   # opaque: no transparency in icons

OUT.mkdir(exist_ok=True)
make(192, 0.92).save(OUT / "icon-192.png", optimize=True)
make(512, 0.92).save(OUT / "icon-512.png", optimize=True)
make(192, safe_zone=True).save(OUT / "icon-maskable-192.png", optimize=True)
make(512, safe_zone=True).save(OUT / "icon-maskable-512.png", optimize=True)
make(180, 0.92).save(OUT / "apple-touch-icon.png", optimize=True)   # iOS rounds the corners itself
make(48, 0.96).save(OUT / "favicon-48.png", optimize=True)
print("icons written:", sorted(p.name for p in OUT.iterdir()))
