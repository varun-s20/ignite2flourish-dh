"""
Social share images (Open Graph, used by LinkedIn) — 1200×630 JPEGs.

    npm run build && python scripts/og.py

Renders one card per article/review plus the site default with headless
Chromium, using the real brand fonts, the article's generative cover and
the client's portrait, in the site's deep-plum style. Output goes to src/assets/og/ and
src/assets/images/og-default.jpg; run the build again afterwards so the
pages reference them.
"""

import base64
import html
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
SRC = ROOT / "src" / "assets"
OUT = SRC / "og"

def data_uri(path, mime):
    return f"data:{mime};base64,{base64.b64encode(Path(path).read_bytes()).decode()}"


FONTS = f"""
@font-face {{ font-family: D; src: url({data_uri(SRC / 'fonts/NimbusSansDiagDOT-Reg.otf', 'font/otf')}) format('opentype'); }}
@font-face {{ font-family: S; src: url({data_uri(SRC / 'fonts/Aspekta-400.woff2', 'font/woff2')}) format('woff2'); font-weight: 400; }}
@font-face {{ font-family: S; src: url({data_uri(SRC / 'fonts/Aspekta-500.woff2', 'font/woff2')}) format('woff2'); font-weight: 500; }}
@font-face {{ font-family: M; src: url({data_uri(SRC / 'fonts/GeistMono-Regular.woff2', 'font/woff2')}) format('woff2'); }}
"""
LOGO = data_uri(SRC / "logo/ignite2flourish-logo-reversed-360.png", "image/png")

# Same palette and layout language as the site: deep-plum panel, sun-yellow
# accents, the cover (or portrait) as a rounded image on the right.
BASE_CSS = FONTS + """
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #3D1529; color: #fff; font-family: S, sans-serif; overflow: hidden; }
.card { position: relative; display: grid; grid-template-columns: 1fr 460px; gap: 24px; height: 100%; padding: 40px; }
.rings { position: absolute; inset: 0; pointer-events: none; }
.rings i { position: absolute; border: 1.2px solid rgba(255,255,255,.08); border-radius: 50%; }
.text { position: relative; display: flex; flex-direction: column; padding: 14px 8px 8px 24px; }
.logo { height: 62px; width: auto; align-self: flex-start; }
.tag { margin-top: auto; align-self: flex-start; padding: 4px 14px; border-radius: 99px; background: #4A1C33; color: #D9C6D0; font-size: 20px; }
h1 { margin-top: 20px; font-weight: 400; letter-spacing: -0.02em; line-height: 1.06; text-wrap: balance; }
h1.display { font-family: D; letter-spacing: 0; line-height: 1.04; }
h1 em { font-style: normal; color: #FFD900; }
.foot { margin-top: 26px; display: flex; align-items: center; gap: 14px; font-size: 20px; color: #D9C6D0; }
.foot b { color: #fff; font-weight: 500; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: #FFD900; }
.media { position: relative; border-radius: 18px; overflow: hidden; }
.media img { width: 100%; height: 100%; object-fit: cover; display: block; }
"""

RINGS = '<div class="rings"><i style="left:520px;top:300px;width:1200px;height:1200px"></i><i style="left:-500px;top:380px;width:1300px;height:1300px"></i></div>'


def title_size(title):
    n = len(title)
    return 58 if n <= 40 else 50 if n <= 62 else 44 if n <= 85 else 38


def article_card(item, cover):
    label = item["category"] if item["type"] == "article" else ("Book review" if item["type"] == "book-review" else "Research review")
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{BASE_CSS}</style></head><body>
    <div class="card">{RINGS}
      <div class="text">
        <img class="logo" src="{LOGO}" alt="">
        <p class="tag">{html.escape(label)}</p>
        <h1 style="font-size:{title_size(item['title'])}px">{html.escape(item['title'])}</h1>
        <p class="foot"><span><b>Sanzid Ahmed</b> · Senior HR &amp; People Leader</span><span class="dot"></span><span>ignite2flourish.com</span></p>
      </div>
      <div class="media"><img src="{cover}" alt=""></div>
    </div></body></html>"""


def default_card():
    portrait = data_uri(SRC / "images/hero-720.jpg", "image/jpeg")
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{BASE_CSS}
    .card {{ grid-template-columns: 1fr 400px; }}
    .media img {{ object-position: 50% 22%; }}
    </style></head><body>
    <div class="card">{RINGS}
      <div class="text">
        <img class="logo" src="{LOGO}" alt="">
        <p class="tag">Senior HR &amp; People Leader · 22 years in HR</p>
        <h1 class="display" style="font-size:66px">A more thoughtful way to <em>flourish</em> at work.</h1>
        <p class="foot"><span><b>Sanzid Ahmed</b></span><span class="dot"></span><span>ignite2flourish.com</span></p>
      </div>
      <div class="media"><img src="{portrait}" alt=""></div>
    </div></body></html>"""


def main():
    index = json.loads((DIST / "search-index.json").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)

        def shoot(markup, dest):
            page.set_content(markup)
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(120)
            page.screenshot(path=str(dest), type="jpeg", quality=86)
            print("wrote", dest.relative_to(ROOT))

        shoot(default_card(), SRC / "images" / "og-default.jpg")
        for item in index:
            slug = item["url"].rstrip("/").split("/")[-1]
            cover = data_uri(DIST / "media" / "covers" / f"{slug}.svg", "image/svg+xml")
            shoot(article_card(item, cover), OUT / f"{slug}.jpg")
        browser.close()


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
