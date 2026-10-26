"""
Web fonts.

    python scripts/fonts.py

Reads  assets-source/fonts/   (originals, never published)
Writes src/assets/fonts/      (the files the site loads)

- Aspekta (body and interface, SIL OFL with Reserved Font Name "Aspekta")
  and Geist Mono (labels, SIL OFL) are converted to WOFF2 with every glyph
  kept. Subsetting would count as a modified version under the RFN clause,
  so the fonts are only recompressed, never trimmed.
- Nimbus Sans Diagonal D (the "Main Heading" face in the client's style
  guide, a commercial URW font) is copied byte-for-byte. Its embedding flag
  is "preview & print": the client must hold a URW web-font licence before
  launch (see README › Fonts).
"""

import shutil
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-source" / "fonts"
OUT = ROOT / "src" / "assets" / "fonts"

WOFF2 = ["Aspekta-400", "Aspekta-500", "GeistMono-Regular", "GeistMono-Medium"]
COPY = ["NimbusSansDiagDOT-Reg.otf", "OFL-Aspekta.txt", "OFL-GeistMono.txt"]
RETIRED = ["Newsreader-roman-latin", "Newsreader-italic-latin", "InstrumentSans-roman-latin", "InstrumentSans-italic-latin"]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name in WOFF2:
        font = TTFont(SRC / f"{name}.ttf")
        font.flavor = "woff2"
        dest = OUT / f"{name}.woff2"
        font.save(dest)
        print(f"{name}: {(SRC / f'{name}.ttf').stat().st_size // 1024} KB -> {dest.stat().st_size // 1024} KB")
    for name in COPY:
        shutil.copyfile(SRC / name, OUT / name)
        print(f"copied {name}")
    for name in RETIRED:
        for ext in (".woff2",):
            (OUT / f"{name}{ext}").unlink(missing_ok=True)
    for lic in ("OFL-Newsreader.txt", "OFL-InstrumentSans.txt"):
        (OUT / lic).unlink(missing_ok=True)


if __name__ == "__main__":
    main()
