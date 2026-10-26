"""
Cut-out portraits for the home and contact heroes.

    pip install rembg onnxruntime
    python scripts/cutouts.py

Reads  assets/Sanzid-*.jpg              (the client's photo shoot)
Writes assets-source/cutouts/*.png      (full-size masters with transparency)

Only the studio backdrop is removed so he can stand on the site's deep-plum
ground; the person is never retouched, reshaped or recoloured. Run once, or
again after swapping a photo; `npm run images` then makes the web sizes.
The model (BiRefNet, ~220 MB) is downloaded by rembg on first use.
"""

from pathlib import Path

from PIL import Image, ImageOps
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parent.parent
CLIENT = ROOT / "assets"
OUT = ROOT / "assets-source" / "cutouts"

# name: source photo
CUTOUTS = {
    "home": "Sanzid-84-Edit.jpg",  # seated, navy suit, looking to the viewer's left
    "contact": "Sanzid-36-Edit.jpg",  # arms folded, blue blazer, facing the camera
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    session = new_session("birefnet-general-lite")
    for name, file in CUTOUTS.items():
        img = ImageOps.exif_transpose(Image.open(CLIENT / file)).convert("RGB")
        cut = remove(img, session=session, post_process_mask=True)
        cut = cut.crop(cut.getchannel("A").getbbox())
        cut.save(OUT / f"{name}.png", optimize=True)
        print(f"{name}: {file} -> {cut.size[0]}x{cut.size[1]}")


if __name__ == "__main__":
    main()
