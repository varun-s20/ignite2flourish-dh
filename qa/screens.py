"""
Full-page screenshots of the running preview at several widths, plus a
console-error and horizontal-overflow check for every page captured.

    python qa/screens.py --out qa/report/screens [--widths 390,1440] [--pages /,/ideas/]

Needs the preview server running (npm run serve) and Python Playwright
(`pip install playwright && playwright install chromium`).
Screens are captured with prefers-reduced-motion so scroll reveals are not
mid-animation; motion itself is exercised by qa/run_qa.py.
"""

import argparse
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://localhost:4173"
DEFAULT_PAGES = [
    "/",
    "/ideas/",
    "/ideas/flourishing/",
    "/rethinking-recruitment-moving-beyond-experience-bias/",
    "/how-to-transform-your-life-from-languishing-to-flourishing/",
    "/books-research/",
    "/books-research/flourish-martin-seligman/",
    "/books-research/psychological-safety-and-learning-behavior-in-work-teams/",
    "/about/",
    "/contact/",
    "/privacy/",
    "/disclaimer/",
    "/search/?q=resilience",
    "/tag/growth-mindset/",
    "/this-page-does-not-exist/",
]


def slug(path):
    s = path.strip("/").replace("/", "_").replace("?", "_").replace("=", "-") or "home"
    return s[:60]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="qa/report/screens")
    ap.add_argument("--widths", default="390,1440")
    ap.add_argument("--pages", default=",".join(DEFAULT_PAGES))
    ap.add_argument("--viewport-only", action="store_true")
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    widths = [int(w) for w in args.widths.split(",")]
    pages = [p for p in args.pages.split(",") if p]
    report = []

    with sync_playwright() as p:
        browser = p.chromium.launch()
        for width in widths:
            ctx = browser.new_context(
                viewport={"width": width, "height": 900 if width > 700 else 844},
                device_scale_factor=1,
                reduced_motion="reduce",
            )
            page = ctx.new_page()
            errors = []
            page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
            page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
            page.on("requestfailed", lambda r: errors.append(f"requestfailed: {r.url}"))
            for path in pages:
                errors.clear()
                resp = page.goto(BASE + path, wait_until="networkidle")
                # walk down the page so lazy images load, then return to the top
                page.evaluate(
                    """async () => {
                        for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) {
                            scrollTo(0, y); await new Promise(r => setTimeout(r, 60));
                        }
                        scrollTo(0, 0);
                    }"""
                )
                page.wait_for_load_state("networkidle")
                page.wait_for_timeout(250)
                overflow = page.evaluate(
                    "() => { const d = document.documentElement; return d.scrollWidth - d.clientWidth; }"
                )
                wide = page.evaluate(
                    """() => [...document.querySelectorAll('body *')].filter(el => {
                        const r = el.getBoundingClientRect();
                        return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed';
                    }).slice(0, 5).map(el => el.tagName.toLowerCase() + '.' + [...el.classList].join('.'))"""
                )
                name = f"{slug(path)}@{width}.png"
                page.screenshot(path=str(out / name), full_page=not args.viewport_only)
                report.append({
                    "path": path, "width": width, "status": resp.status if resp else None,
                    "overflowX": overflow, "offscreen": wide, "errors": list(errors),
                })
                flag = "OK " if not errors and overflow <= 0 else "!! "
                print(f"{flag}{width:>5} {resp.status if resp else '---'} {path}  overflow={overflow} {wide if overflow > 0 else ''} {errors if errors else ''}")
            ctx.close()
        browser.close()
    (out / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
