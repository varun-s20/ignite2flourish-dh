// Document shell: <head> metadata, header, menu, search dialog and footer.
// WordPress equivalents: header.php / footer.php + wp_head().

import { esc } from "../scripts/lib/util.mjs";
import { btn, icon, linkedinIcon, roll } from "./components.mjs";

// The client's trademarked logo, scaled only. Header and footer sit on the
// deep-plum brand colour, so they use the reversed (white wordmark) master.
const logo = (ctx, { reversed = true, lazy = false, height = 48 } = {}) => {
  const name = reversed ? "ignite2flourish-logo-reversed" : "ignite2flourish-logo";
  const set = (ext) => `${ctx.u(`/assets/logo/${name}-180.${ext}`)} 180w, ${ctx.u(`/assets/logo/${name}-360.${ext}`)} 360w`;
  const w = Math.round((height * 1532) / 899);
  return `<picture><source type="image/webp" srcset="${set("webp")}" sizes="${w}px"><img src="${ctx.u(`/assets/logo/${name}-360.png`)}" srcset="${set("png")}" sizes="${w}px" width="${w}" height="${height}" alt="Ignite2Flourish — home"${lazy ? ' loading="lazy" decoding="async"' : ""}></picture>`;
};

const isCurrent = (path, item, data) => {
  if (item.href === "/") return path === "/";
  if (item.match?.some((m) => path.startsWith(m))) return true;
  if (item.matchArticles && data.articles.some((a) => a.url === path)) return true;
  return false;
};

function header(ctx, path) {
  const { site } = ctx.data;
  const links = [{ label: "Home", href: "/" }, ...site.nav.filter((n) => n.style !== "outline")]
    .map((item) => {
      const current = isCurrent(path, item, ctx.data);
      return `<li><a class="nav-link" href="${ctx.u(item.href)}"${current ? ' aria-current="page"' : ""}>${roll(esc(item.label))}</a></li>`;
    })
    .join("");
  const cta = site.nav.find((n) => n.style === "outline");
  return `<div class="header-shell">
  <header class="site-header" data-header>
    <div class="site-header__inner container">
      <a class="brand" href="${ctx.u("/")}"${path === "/" ? ' aria-current="page"' : ""}>${logo(ctx)}</a>
      <nav class="site-nav" aria-label="Primary"><ul class="site-nav__list">${links}</ul></nav>
      <div class="site-header__tools">
        <a class="icon-btn" href="${ctx.u("/search/")}" data-search-open aria-haspopup="dialog">${icon("search")}<span class="visually-hidden">Search</span></a>
        ${btn({ href: ctx.u(cta.href), label: cta.label, variant: "dark", cls: "btn--nav", attrs: isCurrent(path, cta, ctx.data) ? { "aria-current": "page" } : {} })}
        <button class="menu-btn" type="button" data-menu-toggle aria-expanded="false" aria-controls="site-menu"><span class="visually-hidden" data-menu-label>Menu</span><span class="menu-btn__icon" aria-hidden="true"><i></i><i></i><i></i></span></button>
      </div>
    </div>
  </header>
  </div>`;
}

function menu(ctx, path) {
  const { site, categories } = ctx.data;
  const items = [{ label: "Home", href: "/" }, ...site.nav];
  return `<div class="site-menu" id="site-menu" data-menu hidden>
    <div class="site-menu__inner container">
      <nav aria-label="Menu">
        <ul class="site-menu__list">${items
          .map(
            (item, i) =>
              `<li style="--i:${i}"><a class="site-menu__link" href="${ctx.u(item.href)}"${isCurrent(path, item, ctx.data) ? ' aria-current="page"' : ""}>${esc(item.label)}</a></li>`,
          )
          .join("")}</ul>
      </nav>
      <nav class="site-menu__aside" aria-label="Themes">
        <p class="label">Themes</p>
        <ul class="site-menu__topics">${categories.map((c) => `<li><a href="${ctx.u(c.url)}">${esc(c.name)}</a></li>`).join("")}<li><a href="${ctx.u("/books-research/")}">Books &amp; Research</a></li></ul>
        <ul class="social"><li><a href="${esc(ctx.data.authors[site.defaultAuthor].linkedin)}" target="_blank" rel="noopener">${linkedinIcon()}<span class="visually-hidden">Sanzid on LinkedIn (opens in a new tab)</span></a></li></ul>
      </nav>
    </div>
  </div>`;
}

function searchDialog(ctx) {
  const { categories } = ctx.data;
  return `<dialog class="search-dialog" data-search-dialog aria-label="Search Ignite2Flourish">
    <div class="search-dialog__panel">
      <form class="search-dialog__form" action="${ctx.u("/search/")}" method="get" role="search" data-search-form>
        ${icon("search", "search-dialog__icon")}
        <label class="visually-hidden" for="site-search">Search ideas, books and research</label>
        <input class="search-dialog__input" id="site-search" name="q" type="search" placeholder="Search ideas, books and research" autocomplete="off" spellcheck="false" data-search-input aria-describedby="site-search-status">
        <button class="search-dialog__close" type="button" data-search-close><span aria-hidden="true">Esc</span><span class="visually-hidden">Close search</span></button>
      </form>
      <div class="search-dialog__body">
        <p class="search-dialog__status" id="site-search-status" data-search-status aria-live="polite"></p>
        <ol class="search-results" data-search-results></ol>
        <div class="search-dialog__suggest" data-search-suggest>
          <p class="label">Browse a theme</p>
          <ul class="chip-list">${categories.map((c) => `<li><a class="chip chip--link" href="${ctx.u(c.url)}"><span class="topic-dot topic-dot--${c.slug}" aria-hidden="true"></span>${esc(c.name)}</a></li>`).join("")}<li><a class="chip chip--link" href="${ctx.u("/books-research/")}">Books &amp; Research</a></li></ul>
        </div>
        <p class="search-dialog__more" data-search-more hidden><a class="link-arrow" href="${ctx.u("/search/")}" data-search-all>See all results${icon("arrow")}</a></p>
      </div>
      <p class="search-dialog__keys" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> to move</span><span><kbd>Enter</kbd> to open</span><span><kbd>Esc</kbd> to close</span></p>
    </div>
  </dialog>`;
}

function footer(ctx, path) {
  const { site } = ctx.data;
  const author = ctx.data.authors[site.defaultAuthor];
  const link = (l) => `<li><a href="${ctx.u(l.href)}"${path === l.href ? ' aria-current="page"' : ""}>${esc(l.label)}</a></li>`;
  return `<footer class="site-footer dark">
    <div class="container">
      <div class="site-footer__top">
        <div class="site-footer__invite">
          <p class="site-footer__statement"><a href="${ctx.u("/contact/")}">Have a thought worth sharing?</a></p>
          <ul class="social" aria-label="Elsewhere">
            <li><a href="${esc(author.linkedin)}" target="_blank" rel="noopener">${linkedinIcon()}<span class="visually-hidden">Sanzid on LinkedIn (opens in a new tab)</span></a></li>
            <li><a href="${ctx.u("/feed.xml")}">${icon("rss")}<span class="visually-hidden">RSS feed</span></a></li>
            <li><a href="${ctx.u("/search/")}" data-search-open>${icon("search")}<span class="visually-hidden">Search</span></a></li>
          </ul>
        </div>
        ${site.footer.columns
          .map(
            (col) => `<nav class="site-footer__col" aria-label="${esc(col.title)}">
          <ul>${col.links.map(link).join("")}</ul>
        </nav>`,
          )
          .join("")}
      </div>
      <div class="site-footer__bottom">
        <a class="brand brand--footer" href="${ctx.u("/")}">${logo(ctx, { lazy: true, height: 40 })}</a>
        <p>© ${ctx.year} Ignite2Flourish. The views expressed are the author’s own.</p>
        <p class="site-footer__legal"><a href="${ctx.u("/privacy/")}">Privacy</a><a href="${ctx.u("/disclaimer/")}">Disclaimer</a><a href="#main">Back to top</a></p>
      </div>
    </div>
  </footer>`;
}

// Runs before first paint. `motion` turns on the hidden start states of the
// scroll animations; if site.js never confirms it is running, the class is
// removed again so nothing can stay invisible.
const NO_FLASH = `(function(d,h){h.classList.add("js");try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches){h.classList.add("motion");setTimeout(function(){if(!window.I2F_MOTION)h.classList.remove("motion")},2500)}}catch(e){}})(document,document.documentElement);`;

/**
 * @param {object} ctx  build context
 * @param {object} page { path, title, description, content, bodyClass, ogImage, ogType, jsonld, article, noindex, fullTitle }
 */
export function layout(ctx, page) {
  const { site } = ctx.data;
  const title = page.fullTitle || (page.title ? `${page.title} — ${site.name}` : `${site.name} — ${site.tagline}`);
  const description = page.description || site.description;
  const canonical = ctx.abs(page.path);
  const ogImage = ctx.abs(page.ogImage || site.defaultOgImage);
  const robots = ctx.env === "preview" || page.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large";
  const article = page.article
    ? [
        `<meta property="article:published_time" content="${page.article.published}">`,
        page.article.modified ? `<meta property="article:modified_time" content="${page.article.modified}">` : "",
        `<meta property="article:author" content="${esc(ctx.abs("/about/"))}">`,
        page.article.section ? `<meta property="article:section" content="${esc(page.article.section)}">` : "",
        ...(page.article.tags || []).map((t) => `<meta property="article:tag" content="${esc(t)}">`),
      ].join("\n  ")
    : "";
  const jsonld = (page.jsonld || [])
    .map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`)
    .join("\n  ");

  return `<!doctype html>
<html lang="${site.locale}" data-base="${esc(site.basePath)}" data-env="${ctx.env}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${esc(canonical)}">
  <meta name="theme-color" content="#3D1529">
  <meta name="color-scheme" content="light">
  <script>${NO_FLASH}</script>
  <link rel="preload" href="${ctx.u("/assets/fonts/Aspekta-400.woff2")}" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${ctx.u("/assets/fonts/NimbusSansDiagDOT-Reg.otf")}" as="font" type="font/otf" crossorigin>
  <link rel="stylesheet" href="${ctx.asset("/css/site.css")}">
  <link rel="icon" href="${ctx.u("/assets/icons/favicon.ico")}" sizes="48x48">
  <link rel="icon" href="${ctx.u("/assets/icons/favicon-32.png")}" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="${ctx.u("/assets/icons/apple-touch-icon.png")}">
  <link rel="manifest" href="${ctx.u("/site.webmanifest")}">
  <link rel="alternate" type="application/rss+xml" title="${esc(site.name)}" href="${ctx.u("/feed.xml")}">
  <meta property="og:site_name" content="${esc(site.name)}">
  <meta property="og:locale" content="${site.locale.replace("-", "_")}">
  <meta property="og:type" content="${page.ogType || "website"}">
  <meta property="og:title" content="${esc(page.title || site.name)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(page.ogImageAlt || `${page.title || site.name} — ${site.name}`)}">
  <meta name="twitter:card" content="summary_large_image">
  ${article}
  ${jsonld}
  <script src="${ctx.asset("/js/site.js")}" defer></script>
</head>
<body class="${esc(page.bodyClass || "")}">
  <a class="skip-link" href="#main">Skip to content</a>
  ${header(ctx, page.path)}
  ${menu(ctx, page.path)}
  <main id="main" tabindex="-1">
${page.content}
  </main>
  ${footer(ctx, page.path)}
  ${searchDialog(ctx)}
  <div class="toast" data-toast role="status" aria-live="polite" hidden></div>
</body>
</html>
`;
}
