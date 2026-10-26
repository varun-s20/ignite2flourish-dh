"""
Responsive image derivatives for the client's photography, logo and icon.

    python scripts/images.py

Reads  assets/                      (the client's delivery: photo shoot, logo masters)
       assets-source/cutouts/       (cut-out portraits from scripts/cutouts.py)
Writes src/assets/images/           (cropped WebP + JPEG sizes)
       src/assets/logo/             (logo at display sizes)
       src/assets/icons/            (favicons and app icons from the logo's symbol)

Each photo is cropped to the aspect ratio its component uses, around a focal
point, so the browser never downloads pixels it throws away. Re-run after
replacing a photo; the build copies the results into dist/.
"""

from pathlib import Path

import fitz  # PyMuPDF: renders the client's vector logo PDFs
import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
CLIENT = ROOT / "assets"
OUT = ROOT / "src" / "assets" / "images"

# name: (source file, aspect w/h, focal point x/y as 0-1, zoom, widths)
# zoom > 1 crops tighter than the largest box that fits the aspect.
PHOTOS = {
    "hero": ("Sanzid-43-Edit.jpg", 3 / 4, (0.5, 0.33), 1.0, [480, 720]),
    "home-about": ("Sanzid-123-Edit.jpg", 11 / 10, (0.52, 0.42), 1.0, [640, 960, 1260]),
    "exploring": ("Sanzid-24-Edit.jpg", 1.08, (0.42, 0.5), 1.15, [640, 960, 1240]),
    "about-wide": ("Sanzid-68-Edit.jpg", 1.43, (0.5, 0.42), 1.0, [480, 720]),
    "about-tall": ("Sanzid-102-Edit.jpg", 0.675, (0.5, 0.42), 1.0, [480, 720]),
    "about-statement": ("Sanzid-63-Edit.jpg", 0.9, (0.5, 0.3), 1.0, [600, 980]),
    "avatar": ("Sanzid-72-Edit.jpg", 1, (0.5, 0.27), 1.45, [96, 192]),
}

# Photos shot with almost no room above the head get a little more plain
# wall added on top (each column continues its own top rows), so the head
# is never trimmed when the frame is wider than the photo. Only the empty
# backdrop is extended; the person is untouched.
# name: fraction of the photo's height to add
HEADROOM = {
    "about-statement": 0.06,
}

# Masthead: the reversed logo at hero scale, rendered from the client's vector
# PDFs so it stays sharp at any size. S2_2's PDF has its plum panel baked in,
# so coverage comes from S2_1 (same artwork, transparent) and its navy letters
# take S2_2's white. Nothing is redrawn; the flame pixels are identical in both.
MASTHEAD_WIDTHS = [960, 1600, 2400]

# Cut-out portraits (backdrop removed by scripts/cutouts.py) for the home and
# contact heroes: WebP with transparency, plus one PNG for old browsers.
# name: (master in assets-source/cutouts/, widths)
CUTOUTS = {
    "cutout-home": ("home.png", [640, 960, 1397]),
    "cutout-contact": ("contact.png", [480, 760, 1100]),
}

LOGOS = {
    # file: widths. The trademarked logo is only scaled, never redrawn or recoloured.
    "ignite2flourish-logo": ("Ignite2Flourish_S2_1.png", [180, 360]),
    "ignite2flourish-logo-reversed": ("Ignite2Flourish_S2_2.png", [180, 360]),
}


def add_headroom(img, frac, sample=40):
    w, h = img.size
    pad = round(h * frac)
    wall = np.asarray(img.crop((0, 0, w, sample)), dtype=np.float32).mean(axis=0, keepdims=True)
    top = Image.fromarray(np.repeat(wall, pad, axis=0).clip(0, 255).astype(np.uint8), "RGB")
    out = Image.new("RGB", (w, h + pad))
    out.paste(top, (0, 0))
    out.paste(img, (0, pad))
    return out


def crop_to(img, aspect, focal, zoom=1.0):
    w, h = img.size
    if w / h > aspect:
        nw, nh = h * aspect, h
    else:
        nw, nh = w, w / aspect
    nw, nh = round(nw / zoom), round(nh / zoom)
    fx, fy = focal
    left = min(max(round(fx * w - nw / 2), 0), w - nw)
    top = min(max(round(fy * h - nh / 2), 0), h - nh)
    return img.crop((left, top, left + nw, top + nh))


def make_masthead(logo_dir):
    page = fitz.open(CLIENT / "Ignite2Flourish_S2_1.pdf")[0]
    probe = page.get_pixmap(dpi=72, alpha=True)
    a = np.frombuffer(probe.samples, dtype=np.uint8).reshape(probe.height, probe.width, 4)[..., 3]
    ys, xs = np.where(a > 0)
    clip = fitz.Rect(xs.min() - 1, ys.min() - 1, xs.max() + 2, ys.max() + 2)
    dpi = round(72 * max(MASTHEAD_WIDTHS) * 1.02 / clip.width)
    pm = page.get_pixmap(dpi=dpi, alpha=True, clip=clip)
    px = np.frombuffer(pm.samples, dtype=np.uint8).reshape(pm.height, pm.width, 4).astype(np.float32)
    alpha = px[..., 3:4]
    rgb = np.where(alpha > 0, px[..., :3] * 255.0 / np.maximum(alpha, 1), 0)  # un-premultiply
    navy = np.abs(rgb - np.array([25, 48, 71], np.float32)).sum(-1) < 60
    rgb[navy] = 255.0
    img = Image.fromarray(np.dstack([rgb, alpha]).clip(0, 255).astype(np.uint8), "RGBA")
    bbox = img.getbbox()
    img = img.crop(bbox)
    for w in MASTHEAD_WIDTHS:
        h = round(img.height * w / img.width)
        out = img.resize((w, h), Image.LANCZOS)
        out.save(logo_dir / f"ignite2flourish-masthead-{w}.webp", "WEBP", lossless=True, method=6)
        out.save(logo_dir / f"ignite2flourish-masthead-{w}.png", optimize=True)
        print(f"masthead-{w}  {w}x{h}")


def make_icons(icons):
    """Browser and app icons: the logo's symbol (the three flame figures),
    taken from the client's vector PDF with the navy wordmark removed. The
    wordmark is unreadable at tab size; the symbol itself is not redrawn."""
    page = fitz.open(CLIENT / "Ignite2Flourish_S2_1.pdf")[0]
    pm = page.get_pixmap(dpi=600, alpha=True)
    px = np.frombuffer(pm.samples, dtype=np.uint8).reshape(pm.height, pm.width, 4).astype(np.float32)
    alpha = px[..., 3].copy()
    rgb = np.where(alpha[..., None] > 0, px[..., :3] * 255.0 / np.maximum(alpha[..., None], 1), 0)  # un-premultiply
    alpha[np.abs(rgb - np.array([25, 48, 71], np.float32)).sum(-1) < 90] = 0  # wordmark letters
    # the symbol is everything left of the widest empty band (the gradient "2" is right of it)
    xs = np.where((alpha > 8).any(axis=0))[0]
    split = xs[np.diff(xs).argmax()]
    symbol = Image.fromarray(np.dstack([rgb, alpha])[:, : split + 1].clip(0, 255).astype(np.uint8), "RGBA")
    symbol = symbol.crop(symbol.getbbox())

    def square(size, pad, bg=None):
        canvas = Image.new("RGBA", (size, size), bg or (0, 0, 0, 0))
        fit = symbol.copy()
        fit.thumbnail((round(size * (1 - 2 * pad)),) * 2, Image.LANCZOS)
        canvas.alpha_composite(fit, ((size - fit.width) // 2, (size - fit.height) // 2))
        return canvas

    icons.mkdir(exist_ok=True)
    for old in icons.glob("*"):
        old.unlink()
    # tabs: transparent, nearly edge to edge so the figures stay legible
    square(256, 0.02).save(icons / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    square(32, 0.02).save(icons / "favicon-32.png", optimize=True)
    # home screens and the manifest: on white, as the full-colour logo is
    for size, fname in [(180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")]:
        square(size, 0.12, (255, 255, 255, 255)).convert("RGB").save(icons / fname, optimize=True)
    print("icons  symbol", symbol.size)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*"):
        if old.name != "og-default.jpg":
            old.unlink()
    for name, (file, aspect, focal, zoom, widths) in PHOTOS.items():
        img = ImageOps.exif_transpose(Image.open(CLIENT / file)).convert("RGB")
        if name in HEADROOM:
            img = add_headroom(img, HEADROOM[name])
        img = crop_to(img, aspect, focal, zoom)
        for w in widths:
            w = min(w, img.width)
            h = round(w / aspect)
            out = img.resize((w, h), Image.LANCZOS)
            out.save(OUT / f"{name}-{w}.webp", "WEBP", quality=80, method=6)
            out.save(OUT / f"{name}-{w}.jpg", "JPEG", quality=82, optimize=True, progressive=True)
            print(f"{name}-{w}  {w}x{h}")

    for name, (file, widths) in CUTOUTS.items():
        img = Image.open(ROOT / "assets-source" / "cutouts" / file).convert("RGBA")
        for w in widths:
            w = min(w, img.width)
            h = round(img.height * w / img.width)
            out = img.resize((w, h), Image.LANCZOS)
            out.save(OUT / f"{name}-{w}.webp", "WEBP", quality=82, alpha_quality=90, method=6)
            if w == widths[1]:
                out.save(OUT / f"{name}-{w}.png", optimize=True)
            print(f"{name}-{w}  {w}x{h}")

    logo_dir = OUT.parent / "logo"
    logo_dir.mkdir(exist_ok=True)
    for old in logo_dir.glob("*"):
        old.unlink()
    for name, (file, widths) in LOGOS.items():
        img = Image.open(CLIENT / file).convert("RGBA")
        for w in widths:
            h = round(img.height * w / img.width)
            out = img.resize((w, h), Image.LANCZOS)
            out.save(logo_dir / f"{name}-{w}.png", optimize=True)
            out.save(logo_dir / f"{name}-{w}.webp", "WEBP", lossless=True, method=6)
            print(f"{name}-{w}  {w}x{h}")

    make_masthead(logo_dir)

    make_icons(OUT.parent / "icons")


if __name__ == "__main__":
    main()
