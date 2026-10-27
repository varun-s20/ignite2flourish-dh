// Archives (WordPress: home.php / category.php / tag.php / archive-review.php).
// Every archive is a real, crawlable page. JavaScript adds instant search
// within the list, load-more and the empty state; without it, everything is
// listed and the filter tabs are ordinary links.
//
// Ideas and its themes: dark header with the three themes as an orbit map
// (the home mark, after gravity-design.de), filter pills, card grid.
// Books & Research: dark header with the books in 3D on a shelf, then a
// sticky filter column beside stacked wide cards. Both headers end in a
// convex edge. Topic pages keep the plain dark header.

import { esc } from "../../scripts/lib/util.mjs";
import { archiveSearch, bookCover, breadcrumbs, emptyState, icon, loadMore, paperCard, postCard, reviewRow, tabs } from "../components.mjs";

function head(ctx, o) {
  return `<div class="page-hero__head">
    ${o.trail ? `<div data-anim="blur-in" data-delay="100">${breadcrumbs(ctx, o.trail)}</div>` : ""}
    <h1 class="display" data-anim="blur-in" data-delay="100">${esc(o.title)}</h1>
    <p class="page-hero__intro" data-anim="blur-in" data-delay="200"${o.draftIntro ? ` data-draft="Draft copy, awaiting client approval"` : ""}>${esc(o.intro)}</p>
    ${o.latest ? latestLink(ctx, o.latest) : ""}
  </div>`;
}

/* "Start with the latest" under the intro */
const latestLink = (ctx, { label, item }) =>
  `<a class="hero-latest" href="${ctx.u(item.url)}" data-anim="blur-in" data-delay="300"><span class="mono hero-latest__label">${esc(label)}</span><span class="hero-latest__title">${esc(item.title)}</span><span class="hero-latest__go" aria-hidden="true">${icon("arrow")}</span></a>`;

/* gravity-design.de's convex section edge: the dark header bulges into the
   page below it (the corners are filled with the page colour) */
const EDGE = `<svg class="page-hero__edge" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0,0 Q500,200 1000,0 V100 H0 Z"/></svg>`;

/* Ideas header art: the home mark as a map of the three themes. The flame
   disc is all the essays; the disc, ring and dot around it are the themes,
   each a link with its count. They spiral out on load, then stay put. */
const ORBIT = [
  { shape: "disc", angle: -146, side: "above" },
  { shape: "ring", angle: -34, side: "above" },
  { shape: "dot", angle: 90, side: "beside" },
];

function themeOrbit(ctx, currentSlug) {
  const { categories, articles } = ctx.data;
  const here = (on) => (on ? ' aria-current="page"' : "");
  return `<nav class="orbit" aria-label="Ideas by theme" data-anim="blur-in" data-delay="200">
    <svg class="orbit__rings" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><circle cx="50" cy="50" r="38"/><circle cx="50" cy="50" r="49.5"/></svg>
    <a class="orbit__core" href="${ctx.u("/ideas/")}"${here(!currentSlug)}><span class="orbit__core-num">${articles.length}</span><span class="orbit__core-label">essays</span><span class="visually-hidden">: all ideas</span></a>
    <ul class="orbit__list">${categories
      .map((c, i) => {
        const o = ORBIT[i % ORBIT.length];
        return `<li class="orbit__body orbit__body--${o.shape} orbit__body--${o.side}" style="--a:${o.angle}deg;--i:${i}">
        <a class="orbit__link" href="${ctx.u(c.url)}"${here(c.slug === currentSlug)}><span class="orbit__shape" aria-hidden="true"></span><span class="orbit__label"><span class="orbit__name">${esc(c.name)}</span><span class="orbit__count">${c.items.length} essays</span></span></a>
      </li>`;
      })
      .join("")}</ul>
  </nav>`;
}

/* Books & Research header art: the books and papers as 3D objects (cover,
   spine, page edges) standing on a shelf in front of the contact page's
   arch, with the flame disc rising in it. The scene turns a little with
   the pointer (motion.js); a book slides forward and faces you on hover. */
function shelf(ctx, items) {
  const row = items.slice(0, 4);
  return `<div class="shelf3d" data-anim="blur-in" data-delay="200" data-shelf3d>
    <span class="shelf__arch" aria-hidden="true"><span class="shelf__sun"></span></span>
    <div class="shelf3d__scene">
      <ul class="shelf3d__row" aria-label="Latest reviews">${row
        .map((it, i) => {
          const isBook = it.type === "book-review";
          const tone = isBook ? it.book.coverTone || "plum" : "paper";
          const spineTitle = isBook ? it.book.title : it.paper.journal;
          return `<li class="b3d b3d--${tone}${isBook ? "" : " b3d--paper"}" style="--i:${i}">
          <a class="b3d__link" href="${ctx.u(it.url)}"><span class="visually-hidden">${isBook ? "Book review" : "Research review"}: ${esc(it.title)}</span>
            <span class="b3d__obj" aria-hidden="true">
              <span class="b3d__face b3d__front">${isBook ? bookCover(it, "md") : paperCard(it, "md")}</span>
              <span class="b3d__face b3d__spine"><span>${esc(spineTitle)}</span></span>
              <span class="b3d__face b3d__pages"></span>
              <span class="b3d__face b3d__top"></span>
              <span class="b3d__face b3d__back"></span>
            </span>
          </a>
        </li>`;
        })
        .join("")}</ul>
      <span class="shelf3d__board" aria-hidden="true"></span>
    </div>
  </div>`;
}

function listSection(ctx, o, list) {
  const pageSize = ctx.data.site.archive.pageSize;
  const rows = o.layout === "rows";
  return `<section class="section archive${rows ? " archive--rows" : ""}" aria-label="${esc(o.listLabel)}" data-archive data-noun="${esc(o.noun)}" data-total="${o.items.length}">
    <div class="container${rows ? " archive__split" : ""}">
      <div class="archive__toolbar">
        ${o.tabs || ""}
        ${archiveSearch("archive-q", o.searchLabel, o.searchPlaceholder)}
        <p class="archive__count" data-archive-count aria-live="polite">${o.items.length} ${o.items.length === 1 ? o.noun.replace(/s$/, "") : o.noun}</p>
      </div>
      <div class="archive__results">
        ${o.items.length ? list : ""}
        ${emptyState(ctx, {
          title: o.items.length ? "Nothing matches that search." : o.emptyTitle || "Nothing here yet.",
          text: o.items.length ? "Try a broader word, check the spelling, or browse a theme instead." : o.emptyText || "New pieces are on the way.",
          links: o.emptyLinks || [],
          visible: !o.items.length,
        })}
        ${o.items.length > pageSize ? loadMore(o.items.length, pageSize, o.noun) : ""}
        ${o.note ? `<p class="note" role="note">${icon("book")}<span>${esc(o.note)}</span></p>` : ""}
      </div>
    </div>
  </section>`;
}

function postArchive(ctx, o) {
  const grid = `<div class="post-grid" data-archive-list>${o.items
    .map((it, i) => postCard(ctx, it, { index: i, filterable: true, anim: false, headingTag: "h2" }))
    .join("")}</div>`;
  if (!o.orbit) {
    return `<section class="page-hero dark">
    <div class="container">${head(ctx, o)}</div>
  </section>
  ${listSection(ctx, o, grid)}`;
  }
  return `<section class="page-hero page-hero--art page-hero--orbit dark">
    <div class="container page-hero__grid">
      ${head(ctx, o)}
      <div class="page-hero__art">${themeOrbit(ctx, o.orbit.current)}</div>
    </div>
    ${EDGE}
  </section>
  ${listSection(ctx, o, grid)}`;
}

function reviewArchive(ctx, o) {
  const list = `<div class="review-list" data-archive-list>${o.items.map((it, i) => reviewRow(ctx, it, { index: i })).join("")}</div>`;
  return `<section class="page-hero page-hero--art page-hero--shelf dark">
    <div class="container page-hero__grid">
      ${head(ctx, { ...o, latest: o.items.length ? { label: "Latest review", item: o.items[0] } : null })}
      ${o.items.length ? `<div class="page-hero__art">${shelf(ctx, o.items)}</div>` : ""}
    </div>
    ${EDGE}
  </section>
  ${listSection(ctx, { ...o, layout: "rows" }, list)}`;
}

const collection = (ctx, path, title, description, items) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: title,
  description,
  url: ctx.abs(path),
  hasPart: items.slice(0, 20).map((i) => ({ "@type": "CreativeWork", headline: i.title, url: ctx.abs(i.url) })),
});

export function ideasPages(ctx) {
  const { articles, categories } = ctx.data;
  const tabItems = [
    { label: "All", href: "/ideas/", value: "all", count: articles.length },
    ...categories.map((c) => ({ label: c.name, href: c.url, value: c.slug, count: c.items.length })),
  ];
  const intro =
    "Essays and practical notes on leadership, careers and flourishing at work, drawn from 22 years in HR and tested against research.";
  const pages = [
    {
      path: "/ideas/",
      title: "Ideas",
      description: "All articles on Ignite2Flourish: work and leadership, career and life, and flourishing.",
      bodyClass: "page-archive page-ideas",
      jsonld: [collection(ctx, "/ideas/", "Ideas", intro, articles)],
      content: postArchive(ctx, {
        eyebrow: `Ideas · ${articles.length} essays`,
        title: "Ideas",
        intro,
        draftIntro: true,
        items: articles,
        orbit: { current: null },
        latest: { label: "Latest essay", item: articles[0] },
        noun: "articles",
        listLabel: "All articles",
        tabs: tabs(ctx, tabItems, "/ideas/", "Filter by theme"),
        searchLabel: "Search all articles",
        searchPlaceholder: "Search all articles",
        emptyLinks: categories.map((c) => ({ href: c.url, label: c.name })),
      }),
    },
  ];
  for (const c of categories) {
    pages.push({
      path: c.url,
      title: `${c.name} | Ideas`,
      description: `${c.description} Articles on ${c.name.toLowerCase()} from Ignite2Flourish.`,
      bodyClass: `page-archive page-ideas page-category-${c.slug}`,
      jsonld: [collection(ctx, c.url, c.name, c.description, c.items)],
      content: postArchive(ctx, {
        trail: [
          { label: "Home", href: "/" },
          { label: "Ideas", href: "/ideas/" },
          { label: c.name, href: c.url },
        ],
        eyebrow: `Theme · ${c.items.length} essays`,
        title: c.name,
        intro: c.description,
        draftIntro: true,
        items: c.items,
        orbit: { current: c.slug },
        latest: c.items.length ? { label: `Latest in ${c.name}`, item: c.items[0] } : null,
        noun: "articles",
        listLabel: `${c.name} articles`,
        tabs: tabs(ctx, tabItems, c.url, "Filter by theme"),
        searchLabel: `Search ${c.name} articles`,
        searchPlaceholder: `Search ${c.name}`,
        emptyLinks: [{ href: "/ideas/", label: "All ideas" }],
      }),
    });
  }
  return pages;
}

export function tagPages(ctx) {
  return ctx.data.tags.map((t) => ({
    path: t.url,
    title: `${t.name} | Topics`,
    description: `Articles and reviews tagged “${t.name}” on Ignite2Flourish.`,
    bodyClass: "page-archive page-tag",
    noindex: t.items.length < 2,
    content: postArchive(ctx, {
      trail: [
        { label: "Home", href: "/" },
        { label: "Ideas", href: "/ideas/" },
        { label: t.name, href: t.url },
      ],
      eyebrow: "Topic",
      title: t.name,
      intro: `${t.items.length} ${t.items.length === 1 ? "piece" : "pieces"} tagged ${t.name.toLowerCase()}.`,
      items: t.items,
      noun: "pieces",
      listLabel: `Tagged ${t.name}`,
      searchLabel: `Search pieces tagged ${t.name}`,
      searchPlaceholder: "Search within this topic",
      emptyLinks: [{ href: "/ideas/", label: "All ideas" }],
    }),
  }));
}

export function reviewPages(ctx) {
  const { reviews, reviewTypes } = ctx.data;
  const tabItems = [
    { label: "All", href: "/books-research/", value: "all", count: reviews.length },
    ...reviewTypes.map((t) => ({ label: t.name, href: t.url, value: t.type, count: t.items.length })),
  ];
  const intro =
    "Book reviews and research reviews on leadership, careers and wellbeing at work. What the source says is kept apart from what Sanzid makes of it.";
  const base = {
    noun: "reviews",
    draftIntro: true,
    emptyTitle: "The first reviews are being written.",
    emptyText: "Have a book or paper you think belongs here? Suggest it.",
    emptyLinks: [{ href: "/contact/", label: "Suggest a book or paper" }],
    note: reviews.every((r) => r.isPreview)
      ? "The first reviews are in preparation. Entries marked “Layout preview” show how books and research will be presented: their bibliographic details are real, their review text is not yet written."
      : null,
  };
  const pages = [
    {
      path: "/books-research/",
      title: "Books & Research",
      description: "Reviews of books and research papers on leadership, careers and flourishing at work.",
      bodyClass: "page-archive page-reviews",
      jsonld: [collection(ctx, "/books-research/", "Books & Research", intro, reviews)],
      content: reviewArchive(ctx, {
        ...base,
        eyebrow: "Books & Research",
        title: "Books & Research",
        intro,
        items: reviews,
        listLabel: "All reviews",
        tabs: tabs(ctx, tabItems, "/books-research/", "Filter by format"),
        searchLabel: "Search books and research",
        searchPlaceholder: "Search titles, authors, journals",
      }),
    },
  ];
  for (const t of reviewTypes) {
    const desc =
      t.type === "book-review"
        ? "Reviews of books on leadership, careers, psychology and working life."
        : "Plain-English reviews of research papers, with findings kept separate from interpretation.";
    pages.push({
      path: t.url,
      title: `${t.name} | Books & Research`,
      description: desc,
      bodyClass: "page-archive page-reviews",
      content: reviewArchive(ctx, {
        ...base,
        trail: [
          { label: "Home", href: "/" },
          { label: "Books & Research", href: "/books-research/" },
          { label: t.name, href: t.url },
        ],
        eyebrow: "Books & Research",
        title: t.name,
        intro: desc,
        items: t.items,
        listLabel: `${t.name} reviews`,
        tabs: tabs(ctx, tabItems, t.url, "Filter by format"),
        searchLabel: `Search ${t.name.toLowerCase()}`,
        searchPlaceholder: t.type === "book-review" ? "Search titles and authors" : "Search papers, authors, journals",
      }),
    });
  }
  return pages;
}
