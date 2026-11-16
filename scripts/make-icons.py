#!/usr/bin/env python3
"""Regenerate the Slippy compact app icons (SVG masters + PNG sizes).

Not needed for deployment: the generated files are committed in icons/.
Requires: python3 and rsvg-convert (librsvg). Run from the repository root:
    python3 scripts/make-icons.py

Design (compact companion to the detailed Slippy logo, see brand/):
soccer-ball globe centred on Iberia / north-west Africa, Spain yellow,
Morocco red, curved arrow pointing at the Strait of Gibraltar,
navy / ivory / yellow palette. No lettering, so it survives small sizes.
Country outlines are deliberately simplified (icon art, not map data).
"""
import math, subprocess, pathlib

NAVY, NAVY2, IVORY, SEA, YELLOW, ORANGE, RED = "#0f2350", "#1b3b7a", "#f7f4ea", "#dce8f3", "#ffc61a", "#f7931e", "#d9202b"
C, R = 256.0, 168.0            # ball centre and radius in the 512 canvas
LON0, LAT0, KX, KY = -5.0, 35.8, 11.0, 13.6   # simple lon/lat -> icon projection

def pt(lon, lat):
    return (C + (lon - LON0) * KX, C - (lat - LAT0) * KY)

def poly(points, **attrs):
    d = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in (pt(*p) for p in points)) + "Z"
    a = " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in attrs.items())
    return f'<path d="{d}" {a}/>'

SPAIN = [(-9.3,43.1),(-8.0,43.75),(-4.0,43.45),(-1.8,43.35),(0.0,42.7),(1.4,42.7),(3.2,42.4),(3.2,41.9),(2.2,41.4),(1.2,41.1),
         (0.9,40.7),(-0.3,39.5),(0.2,38.7),(-0.5,38.3),(-0.9,37.6),(-2.2,36.7),(-4.4,36.7),(-5.35,36.1),(-5.6,36.0),(-6.3,36.5),
         (-7.4,37.2),(-7.3,38.0),(-7.0,38.9),(-7.3,39.7),(-6.8,40.3),(-6.9,41.0),(-6.5,41.6),(-6.9,42.0),(-8.2,42.0),(-8.9,42.1),(-9.0,42.6)]
MOROCCO = [(-5.92,35.78),(-5.3,35.92),(-4.4,35.2),(-2.95,35.4),(-2.2,35.1),(-1.75,34.75),(-1.7,33.3),(-1.2,32.1),(-3.6,31.4),(-5.5,30.0),
           (-8.67,28.7),(-8.67,27.67),(-12.9,27.67),(-12.9,27.95),(-11.1,28.4),(-9.7,29.8),(-9.65,30.4),(-9.8,31.5),(-9.25,32.3),
           (-8.5,33.2),(-7.6,33.6),(-6.85,34.0),(-6.3,34.9)]

def pentagon(cx, cy, r, rot):
    return "M" + " L".join(f"{cx + r*math.cos(math.radians(rot + 72*i)):.1f} {cy + r*math.sin(math.radians(rot + 72*i)):.1f}" for i in range(5)) + "Z"

def art(tile):
    """tile: 'round' (purpose any) or 'full' (maskable, full-bleed)."""
    bg = (f'<rect width="512" height="512" rx="116" fill="{NAVY}"/>' if tile == "round"
          else f'<rect width="512" height="512" fill="{NAVY}"/>')
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Slippy: soccer-ball globe with Spain in yellow, Morocco in red and an arrow toward the Strait of Gibraltar">',
         f'<defs><clipPath id="ball"><circle cx="{C}" cy="{C}" r="{R}"/></clipPath>',
         f'<linearGradient id="arrow" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="{ORANGE}"/><stop offset="1" stop-color="{YELLOW}"/></linearGradient></defs>',
         bg,
         f'<circle cx="{C}" cy="{C}" r="{R}" fill="{IVORY}"/>',
         f'<g clip-path="url(#ball)"><rect x="80" y="80" width="352" height="352" fill="{SEA}"/>',
         # soccer-ball panels: navy pentagons near the rim with seam lines toward the centre
         ]
    for (px, py, pr, rot) in [(138, 158, 44, -20), (398, 232, 44, 25), (336, 404, 46, 60), (410, 330, 22, 0)]:
        s.append(f'<path d="{pentagon(px, py, pr, rot)}" fill="{NAVY2}"/>')
    s.append(f'<g stroke="{NAVY2}" stroke-width="3.5" stroke-linecap="round" opacity=".45" fill="none">'
             '<path d="M176 182 L208 200"/><path d="M360 238 L330 262"/><path d="M318 368 L306 336"/></g>')
    s.append(poly(MOROCCO, fill=RED, stroke=IVORY, stroke_width=2.5, stroke_linejoin="round"))
    s.append(poly(SPAIN, fill=YELLOW, stroke=IVORY, stroke_width=2.5, stroke_linejoin="round"))
    s.append('</g>')
    s.append(f'<circle cx="{C}" cy="{C}" r="{R}" fill="none" stroke="{NAVY2}" stroke-width="7"/>')
    # arrow: swings round the left/bottom of the globe and points at the Strait of Gibraltar
    E, c4 = (198.0, 298.0), (172.0, 318.0)
    dx, dy = E[0]-c4[0], E[1]-c4[1]; n = math.hypot(dx, dy); dx, dy = dx/n, dy/n
    L, W = 46.0, 26.0
    T = (E[0]+L*dx, E[1]+L*dy)
    body = f"M 104 146 C 40 210 38 352 122 358 C 150 360 {c4[0]:.0f} {c4[1]:.0f} {E[0]:.0f} {E[1]:.0f}"
    s.append(f'<path d="{body}" fill="none" stroke="{NAVY}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>')
    head = f"M {T[0]:.1f} {T[1]:.1f} L {E[0]-W*dy:.1f} {E[1]+W*dx:.1f} L {E[0]+W*dy:.1f} {E[1]-W*dx:.1f} Z"
    s.append(f'<path d="{head}" fill="{NAVY}" stroke="{NAVY}" stroke-width="13" stroke-linejoin="round"/>')
    s.append(f'<path d="{body}" fill="none" stroke="url(#arrow)" stroke-width="25" stroke-linecap="round" stroke-linejoin="round"/>')
    s.append(f'<path d="{head}" fill="{YELLOW}"/>')
    s.append("</svg>")
    return "\n".join(s) + "\n"

def render(svg, out, size):
    subprocess.run(["rsvg-convert", "-w", str(size), "-h", str(size), "-o", str(out), str(svg)], check=True)

if __name__ == "__main__":
    d = pathlib.Path("icons"); d.mkdir(exist_ok=True)
    (d / "icon.svg").write_text(art("round"))
    (d / "icon-maskable.svg").write_text(art("full"))
    for size in (192, 512):
        render(d / "icon.svg", d / f"icon-{size}.png", size)
    for size in (192, 512):
        render(d / "icon-maskable.svg", d / f"icon-maskable-{size}.png", size)
    render(d / "icon-maskable.svg", d / "apple-touch-icon.png", 180)   # opaque, full-bleed: iOS rounds the corners itself
    print("icons written:", sorted(p.name for p in d.iterdir()))
