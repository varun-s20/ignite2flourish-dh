"""
Automated accessibility audit (axe-core, WCAG 2.0/2.1/2.2 A + AA rules) for
every page, at desktop and mobile widths, with the search dialog and mobile
menu opened as well.

    npm install            # provides node_modules/axe-core
    python qa/a11y.py

Automated rules catch roughly a third of accessibility issues; keyboard and
screen-reader behaviour is covered in qa/run_qa.py and by manual review.
"""

import json
import re
import sys
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
BASE = "http://localhost:4173"
AXE = (ROOT / "node_modules" / "axe-core" / "axe.min.js").read_text(encoding="utf-8")
TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]


def pages():
    xml = urllib.request.urlopen(BASE + "/sitemap.xml").read().decode()
    paths = [re.sub(r"^https?://[^/]+", "", u) for u in re.findall(r"<loc>([^<]+)</loc>", xml)]
    index = json.loads(urllib.request.urlopen(BASE + "/search-index.json").read())
    return sorted(set(paths + [i["url"] for i in index] + ["/search/?q=mindset", "/404.html"]))


def run(page):
    page.add_script_tag(content=AXE)
    return page.evaluate(
        """async (tags) => {
            const r = await axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] });
            return r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map(n => n.target.join(' ')) }));
        }""",
        TAGS,
    )


def main():
    total = {}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for width in (1280, 390):
            ctx = browser.new_context(viewport={"width": width, "height": 900}, reduced_motion="reduce")
            page = ctx.new_page()
            for path in pages():
                page.goto(BASE + path, wait_until="networkidle")
                for v in run(page):
                    key = (v["id"], v["impact"], v["help"])
                    total.setdefault(key, []).append(f"{path}@{width} {v['nodes']}")
            # interactive states
            page.goto(BASE + "/", wait_until="networkidle")
            if width > 900:
                page.keyboard.press("/")
                page.fill("[data-search-input]", "resilience")
                page.wait_for_selector(".search-dialog .search-result")
                state = "search dialog"
            else:
                page.click("[data-menu-toggle]")
                page.wait_for_timeout(450)
                state = "mobile menu"
            for v in run(page):
                total.setdefault((v["id"], v["impact"], v["help"]), []).append(f"{state}@{width} {v['nodes']}")
            page.goto(BASE + "/contact/", wait_until="networkidle")
            page.click("[data-form=contact] [data-submit]")
            for v in run(page):
                total.setdefault((v["id"], v["impact"], v["help"]), []).append(f"contact errors@{width} {v['nodes']}")
            ctx.close()
        browser.close()

    if not total:
        print("axe-core: no violations found (WCAG 2.2 A/AA + best-practice rules).")
        return 0
    for (rule, impact, help_), where in sorted(total.items(), key=lambda kv: kv[0][1] or ""):
        print(f"[{impact}] {rule}: {help_}  ({len(where)} occurrences)")
        for w in where[:4]:
            print(f"    {w}")
    return 1


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
