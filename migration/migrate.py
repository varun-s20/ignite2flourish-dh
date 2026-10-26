"""
One-off migration: WordPress REST export -> Ignite2Flourish content files.

Reads  migration/wordpress-export/posts.json (captured from the live site's
       /wp-json/wp/v2/posts endpoint on 23 Oct 2026)
Writes content/articles/<slug>.html  (JSON front matter + cleaned body HTML)
       migration/content-inventory.md
       migration/redirects.csv

Run from the project root:  python migration/migrate.py

The script is kept for traceability. After the first run the files in
content/articles/ are the source of truth and were hand-checked; re-running
overwrites them, so only do that deliberately.
"""

import html
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXPORT = ROOT / "migration" / "wordpress-export"
OUT = ROOT / "content" / "articles"

# Proposed editorial organisation. Every live post is "Uncategorized" in
# WordPress; these assignments are a recommendation for client approval.
EDITORIAL = {
    786: {"category": "work-leadership", "tags": ["decision-making", "information-overload", "workplace-practice"]},
    732: {"category": "flourishing", "tags": ["resilience", "growth-mindset", "self-compassion"]},
    735: {"category": "work-leadership", "tags": ["recruitment", "hr-practice", "bias"]},
    737: {"category": "career-life", "tags": ["intentions", "momentum", "focus"]},
    739: {"category": "career-life", "tags": ["momentum", "goal-setting", "reflection"]},
    722: {"category": "career-life", "tags": ["growth-mindset", "career-development"]},
    711: {"category": "work-leadership", "tags": ["decision-making", "intuition", "leadership"]},
    701: {"category": "work-leadership", "tags": ["mindfulness", "wellbeing", "workplace-practice"]},
    693: {"category": "flourishing", "tags": ["positive-psychology", "languishing", "wellbeing"]},
    408: {"category": "career-life", "tags": ["career-development", "goal-setting", "feedback"]},
    58: {"category": "flourishing", "tags": ["balance", "focus", "reflection"]},
    385: {"category": "flourishing", "tags": ["self-awareness", "emotional-intelligence"]},
}

# Paragraphs that point readers at the retired coaching offer. The proposal
# says no old offer may appear in the public journey, so they are removed from
# the rendered body and recorded in the inventory for approval.
CTA_PATTERNS = re.compile(
    r"complimentary (strategy )?session|request a (free |complimentary )?(mentoring )?session|"
    r"visit my site|contact me through my website|book a complimentary|free session|free consultation|"
    r"talking to a coach|I can help you identify your strengths",
    re.I,
)

NUMBERED = re.compile(r"^(\d+\.|Tip \d+|Step \d+)", re.I)

ALLOWED = {
    "p", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "strong", "em", "a", "br",
    "table", "thead", "tbody", "tr", "th", "td", "cite", "sup", "sub",
}
DROP_WITH_CONTENT = {"style", "script", "noscript", "svg", "iframe"}
VOID = {"br", "img", "hr", "input", "source", "meta", "link"}


class Node:
    def __init__(self, tag, attrs=None, parent=None):
        self.tag, self.attrs, self.parent, self.children = tag, dict(attrs or {}), parent, []


class TreeBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("root")
        self.cur = self.root

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs, self.cur)
        self.cur.children.append(node)
        if tag not in VOID:
            self.cur = node

    def handle_startendtag(self, tag, attrs):
        self.cur.children.append(Node(tag, attrs, self.cur))

    def handle_endtag(self, tag):
        n = self.cur
        while n is not self.root and n.tag != tag:
            n = n.parent
        if n is not self.root:
            self.cur = n.parent

    def handle_data(self, data):
        self.cur.children.append(data)


def text_of(node):
    if isinstance(node, str):
        return node
    return "".join(text_of(c) for c in node.children)


def esc(s):
    return html.escape(s, quote=False)


def serialize(node, removed):
    if isinstance(node, str):
        return esc(node.replace("\xa0", " "))
    tag = node.tag
    if tag in DROP_WITH_CONTENT:
        return ""
    if tag == "img":
        removed["images"].append(node.attrs.get("src", ""))
        return ""
    if tag == "figure":
        imgs = [d for d in walk(node) if not isinstance(d, str) and d.tag == "img"]
        if imgs:
            for i in imgs:
                removed["images"].append(i.attrs.get("src", ""))
            return ""
    inner = "".join(serialize(c, removed) for c in node.children)
    if tag == "root" or tag not in ALLOWED:
        return inner
    if tag == "br":
        return "<br>"
    if tag == "a":
        href = node.attrs.get("href", "").replace("&amp;", "&")
        if re.match(r"https?://(www\.)?ignite2flourish\.com/?$", href):
            href = "/"
        if not inner.strip():
            return ""
        return f'<a href="{html.escape(href)}">{inner}</a>'
    return f"<{tag}>{inner}</{tag}>"


def walk(node):
    yield node
    if not isinstance(node, str):
        for c in node.children:
            yield from walk(c)


def tidy(body_html):
    """Block-level normalisation on the serialised HTML string."""
    s = body_html
    s = re.sub(r"[ \t\r\n]+", " ", s)
    s = re.sub(r"(\s*<br>\s*)+(?=</li>)", "", s)
    s = re.sub(r"(\s*<br>\s*)+(?=(</(strong|em)>)*</p>)", "", s)
    # WordPress restarted numbering by splitting one list in two
    s = re.sub(r"</ol>\s*<ol>", "", s)
    # Hard line breaks pasted into prose: a double break is a paragraph break,
    # a single one mid-sentence is just a space.
    s = re.sub(r"\s*<br>\s*<br>\s*", "</p><p>", s)
    s = re.sub(r"(?<=[^.?!:>])\s*<br>\s*(?=[^<])", " ", s)
    s = re.sub(r"<p>\s*(<br>\s*)*</p>", "", s)
    s = re.sub(r"<(strong|em)>\s*</\1>", "", s)
    s = re.sub(r"\s*<br>\s*</p>", "</p>", s)
    s = re.sub(r"<p>\s*(<br>\s*)+", "<p>", s)
    # centred "*" dividers from the old layout
    s = re.sub(r"<p>\s*(<(strong|em)>\s*)*\*\s*(</(strong|em)>\s*)*</p>", "", s)
    # "<p><strong>Short title</strong></p>" and "<p>1. <strong>Title</strong></p>"
    # are headings in all but markup. Mark them, decide their level below.
    def pseudo_heading(m):
        plain = re.sub(r"<[^>]+>", "", (m.group(1) or "") + m.group(2)).strip()
        numbered = bool(NUMBERED.match(plain))
        if re.search(r"\w", plain) and len(plain) <= (120 if numbered else 90) and (numbered or not plain.endswith((".", ","))):
            return f"<hp>{plain}</hp>"
        return m.group(0)
    s = re.sub(r"<p>\s*(\d+\.\s*)?<strong>((?:(?!</?p>).)*?)</strong>\s*:?\s*</p>", pseudo_heading, s)
    # heading-wrapped strong is redundant
    s = re.sub(r"<(h[2-4])>\s*<strong>(.*?)</strong>\s*</\1>", r"<\1>\2</\1>", s)
    s = re.sub(r"\s*(</?(p|h[2-4]|hp|ul|ol|li|blockquote|table|thead|tbody|tr)>)\s*", r"\1", s)
    # level real headings so the shallowest becomes h2; pseudo-headings join at h2
    levels = sorted({int(x) for x in re.findall(r"<h([2-4])>", s)})
    if levels and levels[0] != 2:
        shift = levels[0] - 2
        s = re.sub(r"<(/?)h([2-4])>", lambda m: f"<{m.group(1)}h{int(m.group(2)) - shift}>", s)
    s = re.sub(r"<(/?)hp>", r"<\1h2>", s)
    s = re.sub(r"\s*:\s*</(h[2-4])>", r"</\1>", s)
    # numbered h2s ("1. …", "Tip 2 …") sit under their section when the post
    # also has un-numbered h2 sections
    h2s = [re.sub(r"<[^>]+>", "", h) for h in re.findall(r"<h2>(.*?)</h2>", s)]
    if h2s and not NUMBERED.match(h2s[0]) and any(NUMBERED.match(h) for h in h2s):
        s = re.sub(r"<h2>((?:\d+\.|Tip \d+|Step \d+).*?)</h2>", r"<h3>\1</h3>", s, flags=re.I)
    s = re.sub(r"(</(p|h2|h3|h4|ul|ol|blockquote|table)>)", r"\1\n", s)
    s = s.replace("<li>", "\n  <li>").replace("</ul>", "\n</ul>").replace("</ol>", "\n</ol>")
    return s.strip() + "\n"


def strip_cta(body, removed):
    """Drop only the sentences that sell the retired offer; keep the rest."""
    out = []
    for block in re.split(r"(?<=\n)", body):
        plain = re.sub(r"<[^>]+>", "", block)
        if block.startswith("<p>") and CTA_PATTERNS.search(plain):
            inner = block.strip()[3:-4]
            sentences = re.split(r"(?<=[.?!])\s+", inner)
            keep = [x for x in sentences if not CTA_PATTERNS.search(re.sub(r"<[^>]+>", "", x))]
            for x in sentences:
                if x not in keep:
                    removed["paragraphs"].append(html.unescape(re.sub(r"<[^>]+>", "", x).strip()))
            if keep:
                out.append("<p>" + " ".join(keep) + "</p>\n")
            continue
        out.append(block)
    return "".join(out)


def epigraph(quote, who):
    return (f'<figure class="epigraph"><blockquote><p>{quote}</p></blockquote>'
            f"<figcaption>{who}</figcaption></figure>\n")


# Hand-checked corrections applied after cleaning. Each one is listed in the
# inventory so the client can see exactly what changed from the live post.
POST_FIXES = {
    722: [
        ("<p>t fosters relevance", "<p>It fosters relevance", "Typo: restored missing “I” in “It fosters”."),
    ],
    408: [
        ("<p>‘<em>Most of us live our lives by accident – we live it as it happens. Fulfilment comes when we live our lives on purpose.’</em> – Simon Sinek. ",
         epigraph("Most of us live our lives by accident – we live it as it happens. Fulfilment comes when we live our lives on purpose.", "Simon Sinek") + "<p>",
         "Opening quotation set as an epigraph."),
    ],
    58: [
        ("<p>‘Life is a journey, not a destination’ – Ralph Waldo Emerson. ",
         epigraph("Life is a journey, not a destination.", "Ralph Waldo Emerson") + "<p>",
         "Opening quotation set as an epigraph."),
    ],
    385: [
        ("<p><strong>‘If you don’t know where you are going any road will get you there’ – Lewis Carroll</strong>.</p>\n",
         epigraph("If you don’t know where you are going any road will get you there.", "Lewis Carroll"),
         "Opening quotation set as an epigraph."),
    ],
    701: [
        ("<p>1. What to focus on,</p>\n<p>2. How are you going to feel about it, and</p>\n<p>3. What you are going to do about it</p>\n",
         "<ol>\n  <li>What to focus on,</li>\n  <li>How are you going to feel about it, and</li>\n  <li>What you are going to do about it</li>\n</ol>\n",
         "Numbered paragraphs set as a list."),
        ("<p>‘Mindfulness means paying attention in a particular way: on purpose, in the present moment, and nonjudgmentally’.</p>\n<p>– Jon Kabat- Zinn, The founder of Mindfulness-Based Stress Reduction</p>\n",
         '<figure class="pullquote"><blockquote><p>Mindfulness means paying attention in a particular way: on purpose, in the present moment, and nonjudgmentally.</p></blockquote>'
         "<figcaption>Jon Kabat-Zinn, founder of Mindfulness-Based Stress Reduction</figcaption></figure>\n",
         "Quotation set as a block quote."),
    ],
}

# Editorial review (the proposal asks for keep / rework / retire advice).
RECOMMENDATIONS = {
    735: ("Keep", "the strongest HR-leadership piece; proposed as the Featured article"),
    786: ("Keep", ""),
    732: ("Keep", ""),
    737: ("Keep", ""),
    739: ("Keep", "written for mid-year; consider re-dating or framing as evergreen"),
    722: ("Keep", ""),
    408: ("Keep", "light copy-edit"),
    58: ("Keep", "title (“Tips for Focus, Energy, and Balance in Life”) differs from the slug; the URL is kept as is"),
    711: ("Rework", "light copy-edit; check the sourcing for the claims about named business leaders"),
    701: ("Rework", "needs a copy-edit (see notes); long, with several loosely connected sections"),
    693: ("Rework", "includes a coaching client story and a ‘work with a coach’ tip — decide whether they fit the publication positioning"),
    385: ("Rework", "opens with a deliberately click-bait list; copy-edit"),
}

PROOFREADING = {
    711: ["“Opera Winfrey” → “Oprah Winfrey”"],
    701: [
        "“Dont fall into the 3 traps…….” → “Don’t fall into the three traps”",
        "“We tend to but everything into specific box” → “put everything into a specific box”",
        "bold markup splits “Automatic Behavio|r” mid-word",
        "“3 ponts” → “3 points”; “If there are sufficient interest” → “If there is sufficient interest”",
    ],
    385: ["“now a day” → “nowadays”; title capitalisation is inconsistent (“Five Key benefits of being self aware…”)"],
}

# Where the first paragraph is a quotation or a fragment, the excerpt uses the
# post's own opening argument instead.
EXCERPTS = {
    701: "If you are not mindful or conscious, then your life will continue to run on autopilot and you will tend to languish.",
    693: "Have you been feeling like you’re just going through the motions of life lately? If you’ve found yourself joylessly binge-watching TV shows, scrolling endlessly through the news, or just navigating your day feeling uninspired and aimless, you’re not alone.",
    711: "Have you ever made a decision at work that left a pit in your stomach? What if I told you that your gut instinct and deep intuition could be the key to unlocking your true potential for success in your professional career?",
}


def sources_from(body):
    seen, out = set(), []
    for href, label in re.findall(r'<a href="([^"]+)">(.*?)</a>', body):
        href = html.unescape(href)
        if not href.startswith("http") or href in seen:
            continue
        seen.add(href)
        out.append({"label": html.unescape(re.sub(r"<[^>]+>", "", label)).strip(), "url": href})
    return out


def excerpt_from(body, limit=210):
    body = re.sub(r"<figure.*?</figure>", "", body, flags=re.S)
    paras = [html.unescape(re.sub(r"<[^>]+>", "", p)).strip() for p in re.findall(r"<p>(.*?)</p>", body)]
    text = ""
    for p in paras:
        if len(p) < 40:
            continue
        text = p
        break
    if len(text) <= limit:
        return text
    sentences = re.split(r"(?<=[.?!])\s+", text)
    out = ""
    for sent in sentences:
        if len(out) + len(sent) > limit and out:
            break
        out = (out + " " + sent).strip()
    return out if len(out) <= limit + 60 else text[:limit].rsplit(" ", 1)[0] + "…"


def main():
    posts = json.loads((EXPORT / "posts.json").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    inventory, redirects = [], []
    for p in posts:
        pid = p["id"]
        ed = EDITORIAL[pid]
        title = html.unescape(re.sub(r"<[^>]+>", "", p["title"]["rendered"])).strip()
        tb = TreeBuilder()
        tb.feed(p["content"]["rendered"])
        removed = {"images": [], "paragraphs": []}
        body = tidy(serialize(tb.root, removed))
        body = strip_cta(body, removed)
        corrections = []
        for old, new, note in POST_FIXES.get(pid, []):
            if old not in body:
                raise SystemExit(f"fix for {pid} no longer applies: {note}")
            body = body.replace(old, new, 1)
            corrections.append(note)
        words = len(re.sub(r"<[^>]+>", " ", body).split())
        date, modified = p["date"][:10], p["modified"][:10]
        meta = {
            "id": f"wp-{pid}",
            "type": "article",
            "title": title,
            "slug": p["slug"],
            "author": "sanzid-ahmed",
            "date": date,
            "updated": modified if modified != date else None,
            "category": ed["category"],
            "tags": ed["tags"],
            "excerpt": EXCERPTS.get(pid) or excerpt_from(body),
            "featuredImage": None,
            "sources": sources_from(body),
            "related": [],
            "seo": {"title": None, "description": None},
            "legacy": {
                "wordpressId": pid,
                "url": f"/{p['slug']}/",
                "removedImages": removed["images"],
                "removedSentences": removed["paragraphs"],
                "corrections": corrections,
            },
        }
        front = json.dumps(meta, ensure_ascii=False, indent=2)
        (OUT / f"{p['slug']}.html").write_text(f"---\n{front}\n---\n{body}", encoding="utf-8")
        inventory.append((meta, words, p["link"]))
        print(f"{pid:>4} {words:>5}w  img-{len(removed['images'])} cta-{len(removed['paragraphs'])}  {p['slug']}")

    cats = json.loads((ROOT / "content" / "taxonomy.json").read_text(encoding="utf-8"))["categories"]
    ordered = sorted(inventory, key=lambda r: r[0]["date"], reverse=True)
    lines = [
        "# Content inventory — Ignite2Flourish",
        "",
        "_Generated by `python migration/migrate.py` — edit the script, not this file._",
        "",
        "Captured from the live WordPress REST API on 23 Oct 2026: **12 published posts**. Every post keeps its",
        "original URL and publication date. Categories are a proposal — on the live site every post is",
        "“Uncategorized”. Recommendations are editorial suggestions for the client to accept or reject.",
        "",
        "| # | Title | Published | Last updated | URL (unchanged) | Proposed category | Words | Recommendation |",
        "|---|-------|-----------|--------------|-----------------|-------------------|-------|----------------|",
    ]
    for i, (m, words, link) in enumerate(ordered, 1):
        rec = RECOMMENDATIONS.get(m["legacy"]["wordpressId"], ("Keep", ""))[0]
        lines.append(
            f"| {i} | {m['title']} | {m['date']} | {m['updated'] or '—'} | `/{m['slug']}/` | "
            f"{cats[m['category']]['name']} | {words} | {rec} |"
        )
    lines += ["", "## What migration changed, post by post", ""]
    for i, (m, words, link) in enumerate(ordered, 1):
        leg = m["legacy"]
        rec, note = RECOMMENDATIONS.get(leg["wordpressId"], ("Keep", ""))
        lines += [f"### {i}. {m['title']}", "", f"- Original: {link} (WordPress ID {leg['wordpressId']})"]
        lines.append(f"- Recommendation: **{rec}**" + (f" — {note}" if note else ""))
        if leg["removedImages"]:
            lines.append(f"- Removed {len(leg['removedImages'])} stock image(s) (the proposal rules out stock photography; restore any the client licensed and wants):")
            lines += [f"  - `{u.split('/uploads/')[-1].split('?')[0]}`" for u in leg["removedImages"]]
        if leg["removedSentences"]:
            lines.append("- Removed sentence(s) promoting the retired coaching offer:")
            lines += [f"  - “{s}”" for s in leg["removedSentences"]]
        for c in leg["corrections"]:
            lines.append(f"- Formatting/correction: {c}")
        for p in PROOFREADING.get(leg["wordpressId"], []):
            lines.append(f"- Proofreading (not changed — needs the author’s approval): {p}")
        lines.append("")
    (ROOT / "migration" / "content-inventory.md").write_text("\n".join(lines), encoding="utf-8")


def migrate_legal():
    """Privacy + cookie policies, migrated verbatim apart from markup cleanup."""
    pages = {p["slug"]: p for p in json.loads((EXPORT / "pages.json").read_text(encoding="utf-8"))}
    parts = []
    for slug in ("privacy", "cookies"):
        tb = TreeBuilder()
        tb.feed(pages[slug]["content"]["rendered"])
        body = tidy(serialize(tb.root, {"images": [], "paragraphs": []}))
        body = body.replace("email hidden; JavaScript is required", "[email address]")
        # first line is the document title; the page template supplies its own h1
        body = re.sub(r"^<(p|h2)>[^<]*(PRIVACY POLICY|COOKIE POLICY)[^<]*</\1>\n", "", body, flags=re.I)
        parts.append((slug, body))
    front = {
        "title": "Privacy",
        "slug": "privacy",
        "description": "How Ignite2Flourish collects, uses and protects personal information.",
        "eyebrow": "Legal",
        "notice": "Migrated unchanged from the current ignite2flourish.com Privacy and Cookies pages (captured 23 Oct 2026). Before launch it needs review: it still describes coaching services, payments, AWeber and Meta Pixel; it names the business three different ways; and it contains unfilled placeholders, highlighted below.",
        "draft": True,
    }
    privacy, cookies = parts[0][1], parts[1][1]
    out = (
        "---\n" + json.dumps(front, ensure_ascii=False, indent=2) + "\n---\n"
        + privacy
        + '<h2>Cookie policy</h2>\n'
        + cookies
    )
    out = re.sub(r"\[([^\]]{3,120})\]", r'<mark class="needs-input">[\1]</mark>', out)

    def table(m):
        rows = re.findall(r"<tr>(.*?)</tr>", m.group(0))
        head = re.sub(r"<td>(?:<strong>)?(.*?)(?:</strong>)?</td>", r'<th scope="col">\1</th>', rows[0])
        def cell(c):
            items = [x.strip() for x in c.group(1).split("* ") if x.strip()]
            return "<td><ul>" + "".join(f"<li>{x}</li>" for x in items) + "</ul></td>" if c.group(1).lstrip().startswith("*") else c.group(0)
        body = "".join("<tr>" + re.sub(r"<td>(.*?)</td>", cell, r) + "</tr>\n" for r in rows[1:])
        return f"<table>\n<thead><tr>{head}</tr></thead>\n<tbody>\n{body}</tbody>\n</table>"
    out = re.sub(r"<table>.*?</table>", table, out, flags=re.S)
    (ROOT / "content" / "pages" / "privacy.html").write_text(out, encoding="utf-8")
    print("privacy.html", len(out), "chars")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
    migrate_legal()
