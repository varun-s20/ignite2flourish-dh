"""
Functional QA against the running preview (npm run serve).

    python qa/run_qa.py

Each check prints PASS/FAIL with a reason; the script exits 1 on any failure.
Uses Python Playwright with Chromium.
"""

import json
import re
import sys
import urllib.request
from http.client import HTTPConnection

from playwright.sync_api import sync_playwright

BASE = "http://localhost:4173"
RESULTS = []


def check(name, ok, detail=""):
    RESULTS.append((name, bool(ok), detail))
    print(f"{'PASS' if ok else 'FAIL'}  {name}{'  — ' + str(detail) if detail and not ok else ''}")


def http_status(path):
    conn = HTTPConnection("localhost", 4173, timeout=10)
    conn.request("GET", path)
    r = conn.getresponse()
    return r.status, r.getheader("Location")


def all_pages():
    xml = urllib.request.urlopen(BASE + "/sitemap.xml").read().decode()
    paths = [re.sub(r"^https?://[^/]+", "", u) for u in re.findall(r"<loc>([^<]+)</loc>", xml)]
    index = json.loads(urllib.request.urlopen(BASE + "/search-index.json").read())
    paths += [i["url"] for i in index]  # previews are noindex, so not in the sitemap
    return sorted(set(paths + ["/search/", "/404.html"]))


def main():
    # ------------------------------------------------------------ server-level
    for old, new in [("/blog/", "/ideas/"), ("/coaching/", "/about/"), ("/cookies/", "/privacy/#cookie-policy"), ("/feed/", "/feed.xml")]:
        status, loc = http_status(old)
        check(f"redirect {old} → {new}", status == 301 and loc == new, f"{status} {loc}")
    status, _ = http_status("/no-such-page/")
    check("unknown URL returns 404 status", status == 404, status)
    status, _ = http_status("/rethinking-recruitment-moving-beyond-experience-bias/")
    check("migrated article keeps its original URL", status == 200, status)

    with sync_playwright() as p:
        browser = p.chromium.launch()

        # -------------------------------------------- console errors, every page
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        problems = []
        page.on("pageerror", lambda e: problems.append(f"{page.url}: {e}"))
        page.on("console", lambda m: problems.append(f"{page.url}: {m.text}") if m.type == "error" and "404" not in m.text else None)
        pages = all_pages()
        for path in pages:
            page.goto(BASE + path, wait_until="networkidle")
        check(f"no JS errors on {len(pages)} pages", not problems, problems[:3])

        # ------------------------------------------------------- skip link
        page.goto(BASE + "/", wait_until="networkidle")
        page.keyboard.press("Tab")
        check("first Tab focuses the skip link", page.evaluate("document.activeElement.classList.contains('skip-link')"))
        page.keyboard.press("Enter")
        page.wait_for_timeout(200)
        check("skip link moves focus to <main>", page.evaluate("document.activeElement.id") == "main")

        # ----------------------------------------------- nav current state
        page.goto(BASE + "/about/", wait_until="networkidle")
        check("nav marks the current section", page.locator(".site-nav [aria-current=page] .roll__in").first.inner_text() == "About")
        page.goto(BASE + "/rethinking-recruitment-moving-beyond-experience-bias/", wait_until="networkidle")
        check("articles highlight Ideas in the nav", page.locator(".site-nav [aria-current=page] .roll__in").first.inner_text() == "Ideas")

        # ---------------------------------------------------- header on scroll
        page.goto(BASE + "/ideas/", wait_until="networkidle")
        page.mouse.wheel(0, 1600)
        page.wait_for_timeout(400)
        top = page.evaluate("document.querySelector('[data-header]').getBoundingClientRect().top")
        solid = page.evaluate("document.querySelector('[data-header]').classList.contains('is-stuck')")
        check("header stays fixed at the top while scrolling", top == 0 and solid, (top, solid))

        # ---------------------------------------------------- search dialog
        page.goto(BASE + "/", wait_until="networkidle")
        page.keyboard.press("/")
        page.wait_for_timeout(150)
        check("'/' opens the search dialog", page.evaluate("document.querySelector('[data-search-dialog]').open"))
        page.keyboard.type("resilience")
        page.wait_for_selector(".search-dialog .search-result")
        n = page.locator(".search-dialog .search-result").count()
        check("search dialog returns results for 'resilience'", n >= 2, n)
        check("results highlight the query", page.locator(".search-dialog .search-result mark").count() > 0)
        page.keyboard.press("ArrowDown")
        check("ArrowDown moves focus into the results", page.evaluate("document.activeElement.classList.contains('search-result')"))
        page.keyboard.press("Escape")
        page.wait_for_timeout(150)
        check("Escape closes the dialog", not page.evaluate("document.querySelector('[data-search-dialog]').open"))
        page.keyboard.press("Control+k")
        page.wait_for_timeout(150)
        page.fill("[data-search-input]", "qwxzv")
        page.wait_for_timeout(300)
        check("no-result message shown", "No results" in page.inner_text("[data-search-status]"))
        page.keyboard.press("Escape")

        # ------------------------------------------------------- search page
        page.goto(BASE + "/search/?q=mindset", wait_until="networkidle")
        page.wait_for_selector(".search-page__results .search-result")
        total = page.locator(".search-page__results .search-result").count()
        check("search page reads ?q= and lists results", total >= 2, total)
        page.click("[data-type=book-review]")
        books = page.locator(".search-page__results .search-result").count()
        check("type filter narrows results", 0 < books < total, (books, total))
        page.fill("input[name=q]", "recruitment")
        page.keyboard.press("Enter")
        page.wait_for_timeout(300)
        page.go_back()
        page.wait_for_timeout(400)
        check("Back restores the previous search", page.input_value("input[name=q]") == "mindset", page.input_value("input[name=q]"))

        # ----------------------------------------------------------- archive
        page.goto(BASE + "/ideas/", wait_until="networkidle")
        visible = lambda: page.locator("[data-archive-list] [data-item]:visible").count()
        check("Ideas shows the first page of 6", visible() == 6, visible())
        page.click("[data-load-button]")
        page.wait_for_timeout(200)
        check("Load more reveals the rest", visible() == 12, visible())
        check("Load more moves focus to the first new article", page.evaluate("!!document.activeElement.closest('[data-item]')"))
        check("Load more hides when everything is shown", page.locator("[data-load-more]").is_hidden())
        page.fill("[data-archive-input]", "intuition")
        page.wait_for_timeout(800)
        check("archive search filters the list", visible() == 1, visible())
        check("archive search writes ?q= to the URL", "q=intuition" in page.url, page.url)
        check("theme tabs carry the search across", "q=intuition" in page.get_attribute(".tabs__tab[data-filter=flourishing]", "href"))
        page.fill("[data-archive-input]", "zzzqqq")
        page.wait_for_timeout(500)
        check("empty state appears", page.locator("[data-empty]").is_visible())
        page.click(".empty-state [data-archive-reset]")
        page.wait_for_timeout(300)
        check("reset restores the list", visible() == 6 and page.locator("[data-empty]").is_hidden(), visible())
        page.goto(BASE + "/ideas/flourishing/?q=languishing", wait_until="networkidle")
        page.wait_for_timeout(600)
        check("category page + ?q= filters on load", visible() >= 1 and page.input_value("[data-archive-input]") == "languishing")
        page.goto(BASE + "/books-research/research/", wait_until="networkidle")
        check("Books & Research type page lists only research", page.locator("[data-item][data-type=research-review]").count() == page.locator("[data-item]").count() > 0)

        # ------------------------------------------------------ contact form
        page.goto(BASE + "/contact/", wait_until="networkidle")
        page.click("[data-form=contact] [data-submit]")
        page.wait_for_timeout(200)
        check("empty submit shows an error summary", page.locator("[data-error-summary]").is_visible())
        check("error summary receives focus", page.evaluate("document.activeElement.matches('[data-error-summary]')"))
        check("four required-field errors listed", page.locator("[data-error-summary] li").count() == 4, page.locator("[data-error-summary] li").count())
        check("fields flagged aria-invalid", page.locator("[data-form=contact] [aria-invalid=true]").count() == 4)
        page.fill("#c-name", "Test Reader")
        page.fill("#c-email", "not-an-email")
        page.locator("#c-email").blur()
        check("invalid email explained inline", "name@example.com" in page.inner_text("#c-email-err"))
        page.fill("#c-email", "reader@example.com")
        page.click("[data-subject='A different perspective']")
        check("subject quick-pick fills the subject", page.input_value("#c-subject") == "A different perspective")
        page.fill("#c-message", "Short")
        page.locator("#c-message").blur()
        check("too-short message explained", "at least 20" in page.inner_text("#c-message-err"))
        page.fill("#c-message", "I enjoyed the piece on experience bias and see it differently in my sector.")
        check("character counter updates", "/ 4000" in page.inner_text("#c-message-count"))
        page.click("[data-form=contact] [data-submit]")
        page.wait_for_timeout(300)
        result = page.inner_text("[data-form=contact] [data-result]")
        check("preview build says nothing was sent", "not sent" in result and page.locator("[data-form=contact] [data-result]").is_visible(), result[:80])
        page.goto(BASE + "/contact/?about=rethinking-recruitment-moving-beyond-experience-bias", wait_until="networkidle")
        page.wait_for_timeout(400)
        check("?about= pre-fills the subject with the article title", page.input_value("#c-subject") == "Re: Rethinking Recruitment: Moving Beyond Experience Bias", page.input_value("#c-subject"))

        # live-endpoint behaviour, with the network mocked
        for status, expect in [(200, "has been sent"), (500, "didn’t go through")]:
            page.goto(BASE + "/contact/", wait_until="networkidle")
            def respond(code):
                return lambda route: route.fulfill(status=code, body="{}", content_type="application/json")
            page.route("**/__mock-endpoint", respond(status))
            page.evaluate("document.querySelector('[data-form=contact]').setAttribute('data-endpoint', '/__mock-endpoint')")
            page.fill("#c-name", "Test Reader")
            page.fill("#c-email", "reader@example.com")
            page.fill("#c-subject", "A collaboration idea")
            page.fill("#c-message", "This is a test message long enough to pass validation.")
            page.click("[data-form=contact] [data-submit]")
            page.wait_for_selector("[data-form=contact] [data-result]:not([hidden])", timeout=5000)
            text = page.inner_text("[data-form=contact] [data-result]")
            check(f"endpoint {status} → {'success' if status == 200 else 'error'} state", expect in text, text[:80])
            page.unroute("**/__mock-endpoint")

        # ----------------------------------------------- responses (comments)
        page.goto(BASE + "/3-tips-to-build-resilience/", wait_until="networkidle")
        page.click(".responses__compose summary")
        page.fill("[data-form=response] [name=name]", "Reader")
        page.fill("[data-form=response] [name=email]", "reader@example.com")
        page.fill("[data-form=response] [name=message]", "A thoughtful response that is long enough.")
        page.click("[data-form=response] [data-submit]")
        page.wait_for_timeout(300)
        check("response form is explicit that nothing was stored", "stores nothing" in page.inner_text("[data-form=response] [data-result]"))

        # ------------------------------------------------------- copy link
        ctx2 = browser.new_context(viewport={"width": 1280, "height": 900}, permissions=["clipboard-read", "clipboard-write"])
        p2 = ctx2.new_page()
        p2.goto(BASE + "/3-tips-to-build-resilience/", wait_until="networkidle")
        p2.click(".article-end [data-copy-link]")
        p2.wait_for_timeout(300)
        clip = p2.evaluate("navigator.clipboard.readText()")
        check("Copy link copies the canonical URL", clip == "https://ignite2flourish.com/3-tips-to-build-resilience/", clip)
        check("toast confirms the copy", "copied" in p2.inner_text("[data-toast]").lower())
        li = p2.get_attribute(".article-end .share a", "href")
        check("LinkedIn share link targets the canonical URL", "share-offsite/?url=https%3A%2F%2Fignite2flourish.com%2F3-tips" in li, li)
        ctx2.close()
        ctx.close()

        # ------------------------------------------------------ mobile menu
        m = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True)
        mp = m.new_page()
        mp.goto(BASE + "/", wait_until="networkidle")
        check("desktop nav hidden on mobile", mp.locator(".site-nav").is_hidden())
        mp.focus("[data-menu-toggle]")
        mp.keyboard.press("Enter")
        mp.wait_for_timeout(450)
        check("menu opens from the keyboard", mp.get_attribute("[data-menu-toggle]", "aria-expanded") == "true" and mp.locator("[data-menu]").is_visible())
        check("page content is inert while the menu is open", mp.evaluate("document.querySelector('main').inert === true"))
        check("focus moves into the menu", mp.evaluate("!!document.activeElement.closest('[data-menu]')"))
        mp.keyboard.press("Escape")
        mp.wait_for_timeout(450)
        check("Escape closes the menu and returns focus", mp.get_attribute("[data-menu-toggle]", "aria-expanded") == "false" and mp.evaluate("document.activeElement.matches('[data-menu-toggle]')"))
        mp.click("[data-menu-toggle]")
        mp.wait_for_timeout(450)
        mp.click(".site-menu__link >> text=Books & Research")
        mp.wait_for_load_state("networkidle")
        check("menu links navigate", mp.url.endswith("/books-research/"), mp.url)
        # stretched .card-link titles are measured by their card, which is the real target
        sizes = mp.evaluate("""() => [...document.querySelectorAll('a, button')].filter(e => e.offsetParent && !e.closest('.prose, .breadcrumbs, .site-footer__bottom, p'))
            .map(e => e.classList.contains('card-link') ? e.closest('article, li').getBoundingClientRect() : e.getBoundingClientRect())
            .filter(r => r.height < 32 || r.width < 24).length""")
        check("tap targets ≥ 32px high outside running text", sizes == 0, sizes)
        m.close()

        # ------------------------------------------------- reduced motion
        rm = browser.new_context(viewport={"width": 1280, "height": 900}, reduced_motion="reduce")
        rp = rm.new_page()
        rp.goto(BASE + "/", wait_until="networkidle")
        still = rp.evaluate("!document.documentElement.classList.contains('motion') && getComputedStyle(document.querySelector('.hero__title')).opacity === '1'")
        check("reduced motion: entrance animations off, hero shown at once", still)
        check("reduced motion: nothing waits to be revealed", rp.locator("[data-anim]:not(.is-in)").count() == 0)
        check("reduced motion: statement is plain text (no per-letter colouring)", rp.locator(".rc-char").count() == 0)
        check("reduced motion: no pinned or sticky-swap scrolling", rp.locator(".hscroll.is-active, .explore.is-ready").count() == 0)
        rm.close()

        # ----------------------------------------------- JavaScript disabled
        nj = browser.new_context(viewport={"width": 390, "height": 844}, java_script_enabled=False)
        np_ = nj.new_page()
        np_.goto(BASE + "/", wait_until="load")
        check("no-JS: hero headline visible", np_.locator(".hero__title").is_visible())
        check("no-JS: nav links visible on mobile", np_.locator(".site-nav").is_visible())
        np_.goto(BASE + "/ideas/", wait_until="load")
        check("no-JS: archive lists every article", np_.locator("[data-item]:visible").count() == 12)
        np_.goto(BASE + "/rethinking-recruitment-moving-beyond-experience-bias/", wait_until="load")
        check("no-JS: copy-link button stays hidden (cannot work)", np_.locator("[data-copy-link]").first.is_hidden())
        nj.close()

        browser.close()

    failed = [r for r in RESULTS if not r[1]]
    print(f"\n{len(RESULTS) - len(failed)}/{len(RESULTS)} checks passed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
