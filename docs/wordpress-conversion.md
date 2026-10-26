# WordPress conversion notes

This build was designed to drop into WordPress with as little rework as possible. Templates map to theme files, components to template parts, and content files to posts and fields. Recommended route: a **custom classic or hybrid theme** built from these templates, plus ACF for the structured fields. Page builders would fight the bespoke layout and add weight; the agreed scope doesn't need them.

## Templates → theme files

| This build | WordPress |
|---|---|
| `templates/layout.mjs` header / menu / footer / search dialog | `header.php`, `footer.php`, `template-parts/search-dialog.php`; menus via `register_nav_menus` (Primary, Footer ×3) |
| `templates/pages/home.mjs` | `front-page.php` (sections as template parts) |
| `templates/pages/archive.mjs` — Ideas, themes, tags | `home.php` (posts page at `/ideas/`), `category.php`, `tag.php` |
| `templates/pages/archive.mjs` — Books & Research | `archive-review.php` + `taxonomy-review_type.php` |
| `templates/pages/article.mjs` | `single.php` |
| `templates/pages/review.mjs` | `single-review.php` (book and research variants by `review_type`) |
| `templates/pages/static.mjs` — About, Contact | `page-about.php`, `page-contact.php` |
| `templates/pages/static.mjs` — legal | `page.php` |
| `templates/pages/static.mjs` — search, 404 | `search.php`, `404.php` |
| `templates/components.mjs` | `template-parts/` — card variants, kicker, meta, author box, share, breadcrumbs, conversation block, responses (comments.php) |
| `src/css/*` | One enqueued stylesheet (`site.css`); keep the token file at the top |
| `src/js/*` | One enqueued script (`site.js`, `defer`) |

## Content model → post types, taxonomies, fields

| Here | WordPress |
|---|---|
| `content/articles/*.html` | **Posts**. `title`, `slug` (unchanged — permalinks stay `/%postname%/`), `date`, `updated` (post modified), `excerpt`, body → `post_content`, `category` → Category, `tags` → Tags |
| `featuredImage` (null today) | Featured image (optional; the generative cover is the fallback) |
| `sources` | Generated from the body links; can stay automatic or become an ACF repeater |
| `seo.title` / `seo.description` | Yoast or Rank Math fields |
| `legacy.*` | Not imported — kept for the migration record |
| `content/reviews/*.html` | Custom post type **`review`** (`/books-research/%postname%/`) with taxonomy **`review_type`** (books / research) and the shared Category taxonomy |
| `book.*` | ACF group "Book": title, subtitle, authors, publisher, year, ISBN, pages, cover image, link |
| `paper.*` | ACF group "Paper": title, authors, journal, year, volume, issue, pages, DOI, URL |
| `<section data-part="…">` blocks | One ACF WYSIWYG field per part (argument, ideas, takeaways, assessment, audience / question, method, findings, limitations, relevance, interpretation). The template keeps findings and interpretation in separate panels. |
| `verdict`, `bestFor` | ACF text fields |
| `content/authors.json` | WordPress user profile + ACF (descriptor, short bio, LinkedIn); avatar from the media library |
| `content/taxonomy.json` | Categories (Work & Leadership, Career & Life, Flourishing) with descriptions; tag list |
| `content/site.json › home` | ACF **Options page "Home"**: hero copy, Featured post (relationship), Start Here (3 × relationship), What I'm Exploring Now (2 × title / note / related items) — the "owner-editable" items in the proposal |
| `content/pages/about.html` | About page; facts, expertise, philosophy, credentials as ACF fields |
| `content/redirects.json` | Redirection plugin (import `migration/redirects.csv`) or server rules |

Permalink settings: post name; category base `ideas` (gives `/ideas/flourishing/`), tag base `tag`.

## Behaviour that changes in WordPress

| Feature | Static preview | WordPress |
|---|---|---|
| Contact form | Validates; with no endpoint it states clearly that nothing was sent | Fluent Forms / Gravity Forms / CF7 with the same field names (`name`, `email`, `organisation`, `subject`, `message`, honeypot `website`). Submissions emailed (WP Mail SMTP with an authenticated sender) **and** stored. Spam: honeypot + Cloudflare Turnstile or Akismet. Either keep `forms.js` and point `data-endpoint` at the form plugin's REST endpoint, or use the plugin's markup with this CSS. |
| Public responses (comments) | Designed and validated; preview stores nothing | Native comments with "Comment must be manually approved"; render with this markup in `comments.php`. Email and name required; email never shown. |
| Site search | Client-side over `search-index.json` | Native `?s=` (or Relevanssi for weighting). Keep the dialog: either request `/?s=` HTML or expose a small REST route that returns the same JSON shape. |
| Archive in-page search / load-more | Client-side over the rendered list | Keep as-is (works on any server-rendered list), or swap load-more for REST pagination if the archive grows past ~100 posts |
| Generative covers | SVG files written at build time | Port `templates/art.mjs` to PHP (it is deterministic — same seed, same art) or pre-generate one SVG per post and store it as post meta/attachment |
| Share images | `scripts/og.py` → JPEGs | Yoast/Rank Math social image per post (upload the generated JPEGs), default image in plugin settings |
| Sitemap / robots | `sitemap.xml`, environment-aware `robots.txt` | SEO plugin sitemap; Search Console verification; staging set to "Discourage search engines" |
| Structured data | JSON-LD per template (BlogPosting, Book, ScholarlyArticle, ProfilePage, BreadcrumbList, WebSite) | Let the SEO plugin output Article/Breadcrumb/WebSite; add Book/ScholarlyArticle via a small filter. Don't output both. |
| Analytics | None (nothing is tracked in the preview) | GA4 + Search Console as agreed; `forms.js` already fires `document` event `i2f:form` for form-submission tracking. Add a consent banner only if tracking requires one (the proposal's wording). |
| "Review build" badge / draft notes | Preview environment only | Remove — not part of the theme |

## Old site

The live site is WordPress with the Kadence theme and Kadence Blocks; an older Divi build and the "Indeed Membership Pro" and "Maintenance" plugins also appear in archives. Per the proposal, the service pages (Mentoring, ELI assessment, mentoring session, freebie and confirmation pages) should be **unpublished, not deleted**, with the redirects in `content/redirects.json`. Take a full backup and use a staging copy before changing anything live.
