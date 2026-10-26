"""
Cross-browser smoke test: Chromium, Firefox and WebKit (Safari's engine).

    python qa/cross_browser.py [--shots qa/report/cross-browser]

For each engine: loads the key templates at desktop and phone widths, fails
on script errors or horizontal overflow, then exercises the mobile menu,
search dialog, archive search and form validation. WebKit here is the
Playwright build — close to Safari, but not a substitute for a real
iPhone/Mac check before launch.
"""

import argparse
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://localhost:4173"
PAGES = [
    "/",
    "/ideas/",
    "/rethinking-recruitment-moving-beyond-experience-bias/",
    "/books-research/",
    "/books-research/flourish-martin-seligman/",
    "/books-research/the-mental-health-continuum/",
    "/about/",
    "/contact/",
    "/privacy/",
    "/search/?q=resilience",
]
RESULTS = []


def check(engine, name, ok, detail=""):
    RESULTS.append(ok)
    print(f"{'PASS' if ok else 'FAIL'}  [{engine}] {name}{'  — ' + str(detail) if detail and not ok else ''}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--shots", default="")
    args = ap.parse_args()
    shots = Path(args.shots) if args.shots else None
    if shots:
        shots.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        for engine in ("chromium", "firefox", "webkit"):
            # WEBKIT_PATH / FIREFOX_PATH let you point at a specific browser build
            exe = os.environ.get(f"{engine.upper()}_PATH")
            browser = getattr(p, engine).launch(**({"executable_path": exe} if exe else {}))
            for width in (1366, 390):
                ctx = browser.new_context(viewport={"width": width, "height": 860})
                page = ctx.new_page()
                errors = []
                page.on("pageerror", lambda e: errors.append(str(e)))
                bad = []
                for path in PAGES:
                    errors.clear()
                    page.goto(BASE + path, wait_until="networkidle")
                    over = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                    if errors or over > 0:
                        bad.append((path, over, errors[:1]))
                    if shots and path == "/":
                        page.wait_for_timeout(1600)  # let the hero sequence finish
                        page.screenshot(path=str(shots / f"{engine}-{width}-home.png"))
                check(engine, f"{len(PAGES)} pages at {width}px: no script errors or overflow", not bad, bad)

                if width == 390:
                    page.goto(BASE + "/", wait_until="networkidle")
                    page.click("[data-menu-toggle]")
                    page.wait_for_timeout(500)
                    check(engine, "mobile menu opens", page.locator("[data-menu]").is_visible())
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(500)
                    check(engine, "mobile menu closes with Escape", page.locator("[data-menu]").is_hidden())
                else:
                    page.goto(BASE + "/", wait_until="networkidle")
                    page.click("[data-search-open]")
                    page.fill("[data-search-input]", "recruitment")
                    try:
                        page.wait_for_selector(".search-dialog .search-result", timeout=4000)
                        ok = True
                    except Exception:
                        ok = False
                    check(engine, "search dialog finds results", ok)
                    page.keyboard.press("Escape")

                page.goto(BASE + "/ideas/", wait_until="networkidle")
                page.fill("[data-archive-input]", "mindfulness")
                page.wait_for_load_state("networkidle")  # full-text index
                page.wait_for_timeout(400)
                n = page.locator("[data-archive-list] [data-item]:visible").count()
                count = page.inner_text("[data-archive-count]")
                check(engine, f"archive search filters ({width}px)", 0 < n < 12 and count.startswith(f"{n} "), (n, count))

                page.goto(BASE + "/contact/", wait_until="networkidle")
                page.click("[data-form=contact] [data-submit]")
                page.wait_for_timeout(300)
                check(engine, f"form validation summary ({width}px)", page.locator("[data-error-summary] li").count() == 4)
                ctx.close()
            browser.close()

    print(f"\n{sum(RESULTS)}/{len(RESULTS)} checks passed")
    return 0 if all(RESULTS) else 1


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
