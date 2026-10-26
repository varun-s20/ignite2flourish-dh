# Ignite2Flourish — custom website (design phase)

The redesigned Ignite2Flourish site for Sanzid Ahmed. It's an independent publication on leadership, careers and flourishing at work, built in hand-written HTML, CSS and vanilla JavaScript for client review. Once the design is approved it converts to WordPress; see [docs/wordpress-conversion.md](docs/wordpress-conversion.md).

**Design v4 (26 Oct 2026, current):** the v2 design (dark plum frame, SwiftForm-style sections and motion) decluttered using [cherylcran.com](https://cherylcran.com/) as a guide: more space, fewer elements per section, one action per section. Colours, logo, heading font and photography come from the client's asset pack in `assets/`. The client supplied no reference sites; both references were our choice. Details in [docs/design-research.md](docs/design-research.md) § 0.

**Home hero and contact page (26 Oct 2026):** both follow [gravity-design.de](https://gravity-design.de/): the client at full height with an orbiting three-circle mark on the home page, and a question under a dark dome with a "Let's talk" disc and arch on the contact page. See the design notes for what was and wasn't taken.

- No framework and no runtime dependencies. The output in `dist/` is plain static HTML/CSS/JS.
- Content lives once in `content/` and is rendered into real HTML pages by a small Node build. Pages are fully readable without JavaScript.
- All 12 published posts were migrated from the live site, keeping their original URLs and dates.

## Quick start

```bash
npm install          # optional — only needed for the QA tools (axe-core, Lighthouse)
npm run build        # content/ + templates/ + src/  →  dist/
npm run serve        # http://localhost:4173  (clean URLs, redirects, real 404s, gzip)
npm run dev          # same, rebuilding whenever content/, src/ or templates/ change
npm run check        # build + link/SEO/markup checks
```

Requires **Node 20+**. The asset and QA scripts also need **Python 3.10+** with Playwright and Chromium (`pip install playwright pillow fonttools brotli && playwright install chromium`).

Opening `dist/index.html` straight from disk won't work properly, because links are root-relative (`/ideas/`) as they will be in production. Use `npm run serve`, or upload `dist/` to any static host. If you host it in a sub-folder, set `basePath` in `content/site.json`, for example `"/ignite2flourish"`.

> **Security note.** `sanzidahmed.pdf` (the client brief) contains the client's hosting username and password in plain text. They weren't used. The PDF sits outside `dist/` so it is never published. Don't commit it to a shared repository, and recommend that the client changes that password.

## What's in the site

| URL | Page |
|---|---|
| `/` | Home: hero, featured + 3 latest, Why Ignite2Flourish, Topics, What I'm Exploring Now, Start Here, Books & Research, About block, Continue the Conversation |
| `/ideas/` | All articles: theme tabs, instant search, load-more, empty state |
| `/ideas/work-leadership/`, `/ideas/career-life/`, `/ideas/flourishing/` | Theme archives |
| `/<post-slug>/` | 12 migrated articles, at their **original WordPress URLs** |
| `/books-research/` (+ `/books/`, `/research/`) | Reviews archive with format tabs and search |
| `/books-research/<slug>/` | Book-review and research-review templates (4 layout previews) |
| `/tag/<slug>/` | Topic tags (tags with a single item are `noindex`) |
| `/about/` | Editorial profile |
| `/ideas/`, `/books-research/` | Headers in the hero's language: the three themes as an orbit map (Ideas) and the covers in an arch (Books & Research), each with a "latest" link |
| `/contact/` | Continue the Conversation: question, "Let's talk" arch, reasons that pre-fill the subject, private message form, FAQ |
| `/privacy/`, `/disclaimer/` | Legal (see limitations) |
| `/search/` | Full search results with type filters |
| `/404.html` | Branded not-found page (served with a 404 status) |
| `/feed.xml`, `/sitemap.xml`, `/robots.txt`, `/search-index.json`, `/_redirects` | Generated |

## Project structure

```
content/                 ← everything an editor changes
  site.json              site settings, navigation, home-page curation, form endpoints
  authors.json           author profile (name, descriptor, short bio, LinkedIn)
  taxonomy.json          the three themes, review types, tag names
  redirects.json         old URL → new URL (301)
  articles/*.html        one file per article: JSON front matter + body HTML
  reviews/*.html         book and research reviews (front matter + <section data-part> blocks)
  pages/*.html           about, contact, privacy, disclaimer
templates/               page templates and components (JS functions returning HTML)
  layout.mjs             <head>, header, menu, search dialog, footer
  components.mjs         cards, kicker, meta, author box, share, conversation, responses…
  art.mjs                generative cover artwork (SVG)
  pages/*.mjs            home, archive, article, review, static pages
src/
  css/                   tokens · base · layout · components · pages · motion (bundled in that order)
  js/                    core · navigation · motion · search · archive · forms · share (bundled)
  assets/                fonts, images, icons, logo, og (share images) — copied to dist/
assets/                  the client's delivery: brief, style guide, logo masters, heading font, photo shoot — never published
assets-source/           other originals (site icon, font files, earlier photos) — never published
scripts/                 build.mjs, serve.mjs, check.mjs, images.py, fonts.py, og.py
migration/               WordPress export, migrate.py, content inventory, redirects.csv
qa/                      run_qa.py (functional), a11y.py (axe), screens.py, lighthouse.mjs
docs/                    design research, WordPress conversion notes
dist/                    build output — the publishable site
```

## Editing content

### Articles

Each article is `content/articles/<slug>.html`:

```html
---
{
  "id": "wp-735",
  "type": "article",
  "title": "Rethinking Recruitment: Moving Beyond Experience Bias",
  "slug": "rethinking-recruitment-moving-beyond-experience-bias",
  "author": "sanzid-ahmed",
  "date": "2023-06-13",
  "updated": "2023-12-04",
  "category": "work-leadership",
  "tags": ["recruitment", "hr-practice", "bias"],
  "excerpt": "One or two sentences used on cards, in search and as the meta description.",
  "featuredImage": null,
  "sources": [],
  "related": [],
  "seo": { "title": null, "description": null },
  "legacy": { "...": "migration record — not displayed" }
}
---
<p>Body HTML: p, h2, h3, ul/ol, blockquote, figure.epigraph, figure.pullquote, table, a…</p>
```

- **Add an article:** copy an existing file, give it a new `slug` and `id`, and use a category from `taxonomy.json`. Tags must exist in `taxonomy.json` too; the build stops with a clear message if anything doesn't match.
- **Dates** are ISO dates. Leave `updated` as `null` unless the article was revised.
- **Headings in the body start at `h2`** (the title is the `h1`). They get anchor IDs automatically.
- **External links** get an ↗ marker and `rel="noopener"` automatically.
- **Related articles:** two are picked automatically by shared theme and tags. Put slugs in `related` to choose them yourself.
- **Featured image** is optional. Without one, the article's generative cover is used.
- **Share images:** run `npm run build && npm run og && npm run build` to make the article's LinkedIn image.

### Books & Research

Reviews live in `content/reviews/`, with `"type": "book-review"` or `"research-review"`.

- **Book reviews** carry a `book` block (authors, publisher, year, ISBN, pages, link, `coverTone`: `ember` | `navy` | `plum`). Body parts are `argument`, `ideas`, `takeaways`, `assessment` and `audience`.
- **Research reviews** carry a `paper` block (authors, journal, year, volume, issue, pages, DOI). Body parts are `question`, `method`, `findings`, `limitations`, `relevance` and `interpretation`. Findings and interpretation render in separate, labelled panels.
- Write each part inside `<section data-part="name">…</section>`.
- `"status": "preview"` marks a layout preview. It is labelled on screen, kept out of search engines (`noindex`) and given no Review structured data. **Delete that line once a real review is written.**
- **Do not add real book covers** unless they are licensed. The typographic cover is designed to stand in permanently.

### Home page curation (owner-editable in WordPress)

In `content/site.json › home`:
- `featured`: one article slug.
- `startHere.items`: three slugs.
- `exploring.items`: two themes, each with a title, a note and related slugs.
- Hero copy and the "Why" statement.

The three latest articles are picked automatically.

### Draft copy

Any copy the client hasn't approved yet is marked `"draft": true` in the content files. The draft items (also listed in the client message that goes with the preview) are:
- the hero and the "Why Ignite2Flourish" statement;
- the Topics and Start Here intros;
- What I'm Exploring Now (placeholders for Sanzid's own themes);
- the archive intros;
- the author short bio;
- the About page (adapted from the current site, to be replaced by the client's own copy);
- the contact intro;
- the Disclaimer.

## Images, fonts, icons

- **Photography** comes from the client's shoot in `assets/Sanzid-*.jpg`. `npm run images` crops each photo to the shape its component uses, around a focal point, and writes WebP + JPEG sizes to `src/assets/images/`. Change a crop, a focal point or which photo goes where in `scripts/images.py`.
- **Cut-out portraits** (home hero: `Sanzid-84-Edit.jpg`; contact page: `Sanzid-36-Edit.jpg`) have only the studio backdrop removed, so he can stand on the plum ground; the person is not retouched. `python scripts/cutouts.py` (needs `pip install rembg onnxruntime`; downloads the BiRefNet model on first run) writes full-size masters to `assets-source/cutouts/`, then `npm run images` makes transparent WebP sizes plus one PNG fallback.
- **Logo:** the client's masters `assets/Ignite2Flourish_S2_1.png` (full colour) and `_S2_2.png` (reversed, white wordmark), scaled only — never redrawn or recoloured. The header and footer sit on deep plum, so they use the reversed version.
- **Browser and app icons** are the logo's symbol (the three flame figures), taken from `assets/Ignite2Flourish_S2_1.pdf` with the navy wordmark removed, because the wordmark can't be read at tab size: transparent for tabs, on white for home-screen icons (`make_icons` in `scripts/images.py`).
- **Headroom:** a photo with almost no space above the head (the About "Why Ignite2Flourish" portrait) gets a strip of its own plain wall added on top (`HEADROOM` in `scripts/images.py`), so a wide frame never trims the head.
- **Fonts** (`npm run fonts`, from `assets-source/fonts/`):
  - **Nimbus Sans Diagonal D** is the style guide's "Main Heading" face, used for each page's top heading only. It is a commercial URW font supplied by the client, and its embedding flag is "preview & print". **Before launch, the client must confirm they hold a web-font licence** (or buy one). If not, change `--f-display` in `src/css/tokens.css` to an open alternative.
  - **Aspekta** (body and interface) and **Geist Mono** (small labels) are SIL Open Font License; licences are in `src/assets/fonts/`. They are converted to WOFF2 without subsetting, because Aspekta's licence reserves its name for unmodified files.
- **Covers** are generated at build time in the brand palette, seeded by the slug so they stay stable between builds. Each theme has two compositions that alternate so neighbouring cards differ.
- **Share images (Open Graph):** `npm run og` gives 1200×630 JPEGs in `src/assets/og/` plus `src/assets/images/og-default.jpg`, in the same deep-plum style as the site.

## Motion

Vanilla JavaScript and CSS (`src/js/motion.js`, `src/css/motion.css`), kept from the v2 design and toned down:

- **home hero** (after gravity-design.de): the portrait rises in as a warm light comes up behind him; the mark (a flame disc, a ring and a dot, from the logo's three round heads) spirals in, then orbits slowly in tilted paths that pass behind and in front of the disc, leaning a little towards the pointer. Clicking the figure, or the "Click to ignite" button, sends out a ring and sparks and flings the orbits wide before they settle. From 900px wide the hero stays pinned and the page rises over it with a convex edge that flattens as it reaches the top, while the figure sinks, the mark lifts and the words fade. The loop stops once the hero is covered or off screen;
- **Ideas and Books & Research headers:** the theme circles spiral out from the essay count and then stay put (they are links); the sun rises in the arch and the covers are dealt into two leaning pairs that lift on hover;
- **contact page:** the arch rises, the portrait steps into it, and the "Let's talk" disc pops in with a dot circling it; the disc leans towards the pointer and glides to the form;
- page headers blur in (700 ms); other blocks slide up 60px over one second as they scroll into view;
- buttons and nav links roll their label on hover; article cards zoom gently and show an arrow badge that follows the cursor;
- the "Why Ignite2Flourish" statement and the About quote darken letter by letter as they scroll;
- stat numbers roll up like an odometer; the themes marquee drifts under the hero;
- "What I'm exploring now" swaps its text as each card passes (desktop); "Start here" pins and scrolls sideways (desktop);
- the contact-page accordion and the About credentials timeline.

Start states only apply under `html.motion`. An inline script sets it before first paint and removes it again if `site.js` hasn't started within 2.5 seconds, so content can't get stuck invisible. `prefers-reduced-motion: reduce` switches every effect off, including the pinned and sticky scrolling, and without JavaScript every section renders complete.

## Forms

Both forms (Continue the Conversation, and article Responses) use the same script, `src/js/forms.js`. It handles:
- inline validation as you leave each field;
- an error summary that takes focus and links to each field;
- a character counter;
- quick-pick subjects;
- prefilling the subject from `?about=<article-slug>`, which is how "Continue the conversation" on an article opens the form;
- a honeypot field.

**Preview behaviour (now):** `content/site.json › forms.*.endpoint` is empty, so after validation the form says plainly that **nothing was sent or stored**.

**To connect it:** set `forms.contact.endpoint` to a URL that accepts a `multipart/form-data` POST and returns a 2xx status, for example a WordPress form plugin's REST route, Formspree or a serverless function. The script then:
- shows sending, success or failure states (with a 15-second timeout);
- adds `elapsed_ms` and `page` to the payload for server-side spam checks;
- dispatches a `document` event, `i2f:form` with `{ form, status }`, for analytics.

Spam protection, email delivery and storage must happen on the server; see the WordPress notes.

**Public responses (comments)** need a moderated backend. The design, validation and moderation messaging are built, but nothing is stored or published until WordPress comments, or another backend, are connected.

## Environments and SEO

- `npm run build` creates the **preview** build: every page carries `noindex, nofollow`, and `robots.txt` disallows everything.
- `npm run build:production` creates the **production** build: pages are indexable, `robots.txt` allows crawling and points to the sitemap. Change `site.url` before going live on another domain.
- Every page gets:
  - a unique title and description;
  - a canonical URL;
  - Open Graph and Twitter tags with a 1200×630 image;
  - JSON-LD (WebSite, BlogPosting, Book, ScholarlyArticle, ProfilePage, BreadcrumbList, CollectionPage, ContactPage).
- The RSS feed, XML sitemap and redirect map are generated.

## Quality assurance

```bash
npm run serve                     # keep running, then in another terminal:
npm run check                     # links, anchors, one h1, unique titles/descriptions, alt text, ids, JSON-LD, og:image files, redirect targets
python qa/run_qa.py               # 63 functional checks in Chromium (navigation, menu, search, archive, forms, redirects, reduced motion, no-JS…)
python qa/a11y.py                 # axe-core WCAG 2.2 A/AA + best practice, every page × 2 widths + open menu/dialog/error states
python qa/cross_browser.py        # Chromium, Firefox and WebKit: key pages × 2 widths + menu, search, archive, form
                                  # (set WEBKIT_PATH / FIREFOX_PATH to use a specific browser build)
python qa/screens.py --out qa/report/screens --widths 320,390,768,1440,1600
CHROME_PATH=/path/to/chrome node qa/lighthouse.mjs [--desktop]
```

Last results (26 Oct 2026, design v4, local server):

| Check | Result |
|---|---|
| `npm run check` | all 57 pages pass |
| Functional QA | 63 / 63 pass |
| axe-core | 0 violations (WCAG 2.2 A/AA + best practice), including the open mobile menu and form-error states |
| Horizontal scrolling | none on any page at 320, 390, 768, 1024 or 1440 px |
| Cross-browser smoke test | Chromium and Firefox: 18 / 18. WebKit could not be launched in this environment, so **Safari is untested**. Check on a real iPhone and Mac. |
| Lighthouse | not re-run for v4 |

These are local measurements. PageSpeed Insights on the real host, CDN and network will differ, and has not been run because there is no public URL yet. Edge uses the Chromium engine. Playwright's WebKit is close to Safari but not identical, so check on a real iPhone and Mac before launch.

## Known limitations and assumptions

- **No backend.** Contact submissions aren't sent or stored, public responses aren't stored, and there is no analytics or Search Console. These are deliberate and clearly labelled; they arrive with WordPress.
- **Books & Research has no real reviews yet.** Four layout previews use real, verified bibliographic data (Open Library, Crossref, OpenAlex) with placeholder guidance text. One paper's page range couldn't be verified, so it is left blank.
- **Privacy page:** migrated unchanged from the live site and flagged for review. It still describes coaching, payments, AWeber and Meta Pixel, names the business three ways ("Ignite 2 Flourish Pty Ltd", "Sanzid Alvi Ahmed T/A Ignite2Flourish", "Ignite2Flourish Co Ltd"), contains unfilled placeholders (highlighted on the page), and repeats one table in its GDPR appendix. The **Disclaimer** is a draft outline. Neither has had legal review.
- **Article edits:**
  - Removed: inline stock images, and sentences selling the retired coaching offer.
  - Fixed: one typo ("t fosters" → "It fosters").
  - Reformatted: opening quotations set as epigraphs, plus heading and list markup.
  - Every change is listed in [migration/content-inventory.md](migration/content-inventory.md); other proofreading is suggested there, not applied.
- **Categories and tags** are a proposal; every live post is "Uncategorized".
- **British/Australian spelling** is used in new copy (the client is in Sydney). Migrated articles keep their original spelling.
- **Navigation:** the proposal's "five-section" navigation is Home + four links. On desktop the logo is Home; the mobile menu lists Home explicitly.

## Client inputs still needed

1. **A web-font licence for Nimbus Sans Diagonal D** (the style guide's heading face), or approval to use an open alternative.
2. The "clear versions" of the ten blog posts and the **About copy** (from "Sanzid Edits.zip"). The proposal says the client's About copy is used as final.
3. Approval of the hero and other draft copy, the theme assignments, the featured article and Start Here picks, and the two "What I'm Exploring Now" themes.
4. A fact-check of the About-page figures: 22 years, 100+ countries among colleagues, and 7 countries worked in (counted from the list on the current About page).
5. Decisions on the "Rework" posts and on restoring any stock images the client licensed.
6. The first real book and research reviews.
7. Legal review of Privacy and Disclaimer, and the correct legal entity name and ABN.
8. A destination email for contact submissions, and Google Analytics / Search Console access.

## WordPress conversion

In short: templates become theme files, components become template parts, articles become posts at the same URLs, reviews become a `review` post type with ACF fields, and home curation becomes an ACF options page. The forms become a form plugin with SMTP and storage, responses become moderated native comments, redirects go into the Redirection plugin, and SEO moves to Yoast or Rank Math. Details: [docs/wordpress-conversion.md](docs/wordpress-conversion.md). Design rationale and reference research: [docs/design-research.md](docs/design-research.md).
