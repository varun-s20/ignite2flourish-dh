"""
Dotted world map for the home page's "countries" number.

    python scripts/worldmap.py path/to/countries.geo.json

Source data: world.geo.json (https://github.com/johan/world.geo.json,
public domain, Natural Earth). Land is sampled on a regular grid of dots;
the markets Sanzid has worked in (from his current About page) are drawn
in sun yellow. Drawn for a navy ground. Writes src/assets/images/world-dots.svg.
"""

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "assets" / "images" / "world-dots.svg"

STEP = 2.5  # degrees between dots
LAT_TOP, LAT_BOTTOM = 76, -50
SCALE = 8  # raster pixels per degree for the land mask
# ISO codes of the markets; Hong Kong is too small for the source data, so it
# is placed by coordinates
MARKETS = {"AUS", "GBR", "NZL", "IDN", "BGD", "PAK"}
EXTRA = {"HKG": (114.17, 22.3)}


def main(src):
    data = json.loads(Path(src).read_text(encoding="utf8"))
    w, h = 360 * SCALE, (LAT_TOP - LAT_BOTTOM) * SCALE
    land = Image.new("L", (w, h), 0)
    mark = Image.new("L", (w, h), 0)
    px = lambda lon, lat: ((lon + 180) * SCALE, (LAT_TOP - lat) * SCALE)
    centres = {}
    for f in data["features"]:
        geom = f["geometry"]
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        target = [land] + ([mark] if f["id"] in MARKETS else [])
        best = None
        for poly in polys:
            ring = [px(lon, lat) for lon, lat in poly[0]]
            for im in target:
                ImageDraw.Draw(im).polygon(ring, fill=255)
            if best is None or len(poly[0]) > len(best):
                best = poly[0]
        if f["id"] in MARKETS:
            lons, lats = zip(*best)
            centres[f["id"]] = (sum(lons) / len(lons), sum(lats) / len(lats))

    cols, rows = int(360 / STEP), int((LAT_TOP - LAT_BOTTOM) / STEP)
    dots, hot = [], []
    for r in range(rows):
        for c in range(cols):
            lon, lat = -180 + (c + 0.5) * STEP, LAT_TOP - (r + 0.5) * STEP
            x, y = px(lon, lat)
            if land.getpixel((int(x), int(y))):
                (hot if mark.getpixel((int(x), int(y))) else dots).append((c, r))
    # small markets still get one bright dot at their centre
    for lon, lat in list(centres.values()) + list(EXTRA.values()):
        cell = (int((lon + 180) / STEP), int((LAT_TOP - lat) / STEP))
        if cell not in hot:
            hot.append(cell)
            if cell in dots:
                dots.remove(cell)

    r = 0.32
    circle = lambda c, rr: f'<circle cx="{c[0] + 0.5:g}" cy="{c[1] + 0.5:g}" r="{rr}"/>'
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {cols} {rows}" width="{cols * 10}" height="{rows * 10}">'
        f'<g fill="#ffffff" fill-opacity="0.26">{"".join(circle(d, r) for d in dots)}</g>'
        f'<g fill="#ffd900">{"".join(circle(d, 0.4) for d in hot)}</g>'
        "</svg>\n"
    )
    OUT.write_text(svg, encoding="utf8")
    print(f"world-dots.svg  {len(dots)} land dots, {len(hot)} market dots, {len(svg) // 1024} KB")


if __name__ == "__main__":
    main(sys.argv[1])
