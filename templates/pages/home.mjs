// Home page (WordPress: front-page.php).
//
// Hero: the client, full height, with an orbiting three-circle mark, after
// gravity-design.de; it stays pinned while the page rises over it.
// Below it, the agreed SwiftForm-style design (themes marquee,
// scroll-coloured statement with odometer stats, sticky "exploring" swap,
// pinned "start here" track, dark featured band, cursor-follow cards).
// Decluttered with cherylcran.com's restraint: one idea and one action per
// section, more space, a photo-beside-panel About block, three theme circles
// and a single glow panel to close.

import { esc, inline } from "../../scripts/lib/util.mjs";
import {
  authorsLine,
  btn,
  conversationBlock,
  cover,
  coverStage,
  draft,
  featureCard,
  icon,
  linkedinIcon,
  marquee,
  odometer,
  pathCard,
  picture,
  postCard,
  sectionHead,
  themeCards,
} from "../components.mjs";

/* ------------------------------------------------------ hero (gravity) */
// After gravity-design.de: the first screen is the person, full height on a
// dark ground, with a small physical "mark" beside him. Here the mark is the
// logo's three round flame heads (one flame disc, a ring and a dot) orbiting
// in his line of sight, passing behind and in front of him. motion.js runs
// the orbits, the click-to-ignite burst and the scroll hand-off; without it
// the mark rests in place. The portrait is the client's photo with only the
// studio backdrop removed (scripts/cutouts.py).

const FIGURE = { widths: [640, 960, 1397], w: 1397, h: 1965 };

function figure(ctx) {
  const name = "cutout-home";
  const set = FIGURE.widths.map((w) => `${ctx.u(`/assets/images/${name}-${w}.webp`)} ${w}w`).join(", ");
  // the figure is the window height less the header on wide screens, the
  // column width on narrow ones
  const sizes = "(min-width: 900px) min(62vw, calc((100vh - 100px) * 0.711)), 92vw";
  return `<picture>
    <source type="image/webp" srcset="${set}" sizes="${sizes}">
    <img class="gravity__img" src="${ctx.u(`/assets/images/${name}-960.png`)}" sizes="${sizes}" width="${FIGURE.w}" height="${FIGURE.h}" alt="Sanzid Ahmed, seated in a navy suit, smiling" fetchpriority="high">
  </picture>`;
}

function hero(ctx) {
  const h = ctx.data.home.hero;
  const { categories, site } = ctx.data;
  const author = ctx.data.authors[site.defaultAuthor];
  return `<section class="gravity dark" aria-labelledby="hero-title" data-gravity>
    <div class="gravity__figure" data-gravity-figure>
      <span class="gravity__glow" aria-hidden="true"></span>
      <svg class="gravity__halo" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><circle cx="50" cy="50" r="22"/><circle cx="50" cy="50" r="34"/><circle cx="50" cy="50" r="48"/></svg>
      ${figure(ctx)}
      <div class="gravity__mark" aria-hidden="true" data-gravity-mark>
        <span class="gravity__orb gravity__orb--mass" data-orb="mass"></span>
        <span class="gravity__orb gravity__orb--ring" data-orb="ring"></span>
        <span class="gravity__orb gravity__orb--dot" data-orb="dot"></span>
      </div>
      <button class="gravity__hint mono" type="button" data-gravity-ignite hidden><span class="gravity__hint-dot" aria-hidden="true"></span>Click to ignite</button>
    </div>
    <div class="container gravity__inner">
      <div class="gravity__intro"${draft(h.draft, "Draft hero copy — awaiting client approval")}>
        <h1 class="display hero__title gravity__title" id="hero-title" data-anim="blur-in" data-delay="900">${inline(h.headline)}</h1>
        <p class="gravity__lede" data-anim="blur-in" data-delay="1000">${esc(h.lede)}</p>
        <div class="gravity__action" data-anim="blur-in" data-delay="1100">${btn({ href: ctx.u(h.primary.href), label: h.primary.label })}</div>
      </div>
      <nav class="gravity__claim" aria-label="Read by theme" data-anim="blur-in" data-delay="1250">
        <p class="mono">Read by theme</p>
        <ul>${categories
          .map(
            (c) => `<li><a class="gravity__theme" href="${ctx.u(c.url)}"><span class="gravity__theme-name">${esc(c.name)}</span><span class="gravity__theme-count">${c.items.length} essays</span></a></li>`,
          )
          .join("")}</ul>
      </nav>
    </div>
    <div class="gravity__foot">
      <div class="container gravity__foot-inner">
        <p class="gravity__name" data-anim="blur-in" data-delay="1350"><strong>${esc(author.name)}</strong><span>${esc(author.descriptor)}</span></p>
        <span class="gravity__scroll" aria-hidden="true"><i></i></span>
        <a class="gravity__social" href="${esc(author.linkedin)}" target="_blank" rel="noopener" data-anim="blur-in" data-delay="1350">${linkedinIcon()}<span>LinkedIn</span><span class="visually-hidden"> (opens in a new tab)</span></a>
      </div>
    </div>
  </section>`;
}

/* The curtain's leading edge: a convex cap that flattens as it rises over
   the pinned hero (gravity-design.de's section arc), then the themes
   ticker and the page. */
const CAP = `<div class="curtain__cap" aria-hidden="true"><svg viewBox="0 0 1000 100" preserveAspectRatio="none" focusable="false"><path d="M0,100 Q500,-100 1000,100 Z"/></svg></div>`;

function ticker(ctx) {
  const themes = [...ctx.data.tags]
    .sort((x, y) => y.items.length - x.items.length)
    .slice(0, 12)
    .map((t) => ({ label: t.name }));
  return `<div class="curtain__ticker">
    <div class="container curtain__ticker-inner"><p class="mono">Ideas I keep returning to</p>${marquee(themes, { label: "Recurring themes" })}</div>
  </div>`;
}

/* ---------------------------------------------------------------- why */

function why(ctx) {
  const w = ctx.data.home.why;
  const stats = (w.stats || []).map((s) => ({ ...s, value: s.value === "{essays}" ? String(ctx.data.articles.length) : s.value }));
  return `<section class="section why" aria-labelledby="why-title">
    <div class="container">
      <div class="why__head"${draft(w.draft)}>
        <h2 class="tag" id="why-title" data-anim="slide-up">${esc(w.eyebrow)}</h2>
        <p class="why__statement" data-reveal-chars data-anim="slide-up">${inline(w.statement)}</p>
      </div>
      <ul class="stats">${stats
        .map(
          (s, i) => `<li class="stat-card stat-card--${s.tone}" data-anim="slide-up" data-delay="${300 + i * 100}">
          <p class="stat-card__value">${odometer(s.value)}</p>
          <p class="stat-card__label">${esc(s.label)}</p>
        </li>`,
        )
        .join("")}</ul>
    </div>
  </section>`;
}

/* ----------------------------------------------- about (photo | panel) */

function aboutSplit(ctx) {
  const a = ctx.data.authors[ctx.data.site.defaultAuthor];
  return `<section class="split" aria-labelledby="about-title">
    <div class="split__media">${picture(ctx, "home-about", { alt: "Sanzid Ahmed in a blue shirt, smiling", sizes: "(min-width: 900px) 50vw, 100vw" })}</div>
    <div class="split__panel dark">
      <div class="split__inner">
        <p class="tag" data-anim="slide-up">About the author</p>
        <h2 class="split__title" id="about-title" data-anim="slide-up">${esc(a.name)}</h2>
        <p class="split__role" data-anim="slide-up">${esc(a.descriptor)}</p>
        <p data-anim="slide-up"${draft(true)}>${esc(a.shortBio)}</p>
        <div data-anim="slide-up">${btn({ href: ctx.u("/about/"), label: "More about Sanzid", variant: "outline-light" })}</div>
      </div>
    </div>
  </section>`;
}

/* -------------------------------------------------------------- topics */

function topics(ctx) {
  return `<section class="section section--soft" aria-labelledby="topics-title">
    <div class="container">
      ${sectionHead({
        tagText: "Topics",
        tagCls: "tag--white",
        title: "Topics I write about",
        intro: "Three themes, one question: how do capable people do their best work — and flourish while doing it?",
        id: "topics-title",
        draftFlag: true,
      })}
      ${themeCards(ctx)}
    </div>
  </section>`;
}

/* ---------------------------------------------------- exploring (sticky) */

function exploring(ctx) {
  const e = ctx.data.home.exploring;
  const items = ctx.data.home.exploringItems;
  const total = items.length + 1;
  const counter = (i) => `<span class="explore__count">0${i + 1} / 0${total}</span>`;
  const blocks = items.map(
    (x, i) => `<div class="explore__block" data-explore-block>
        <p class="tag">What I’m exploring now ${counter(i)}</p>
        <h3 class="h2 explore__title">${esc(x.title)}</h3>
        <p class="explore__note">${esc(x.note)}</p>
        <ul class="explore__links">${x.linkItems
          .map((it) => `<li><a class="link-arrow" href="${ctx.u(it.url)}">${esc(it.title)}${icon("arrow")}</a>${it.isPreview ? ' <span class="chip chip--preview">Preview</span>' : ""}</li>`)
          .join("")}</ul>
      </div>`,
  );
  blocks.push(`<div class="explore__block" data-explore-block>
        <p class="tag">What I’m exploring now ${counter(items.length)}</p>
        <h3 class="h2 explore__title">What should I explore next?</h3>
        <p class="explore__note">${esc(e.invite || "A question from your own working life, a study worth reading, a book that changed your mind — suggestions shape what comes next.")}</p>
        <div>${btn({ href: ctx.u("/contact/"), label: "Suggest a question" })}</div>
      </div>`);

  const cards = [
    ...items.map(
      (x, i) => `<div class="explore-card" data-explore-card aria-hidden="true">
        ${x.linkItems[0] ? cover(ctx, x.linkItems[0]) : ""}
        <span class="explore-card__label">Exploring · 0${i + 1}</span>
      </div>`,
    ),
    `<div class="explore-card explore-card--photo" data-explore-card>
        ${picture(ctx, "exploring", { alt: "Sanzid Ahmed sitting on a wooden garden bench, smiling", sizes: "(min-width: 992px) 46vw, 92vw" })}
        <span class="explore-card__label" aria-hidden="true">Your question could be next</span>
      </div>`,
  ];

  return `<section class="section explore" aria-labelledby="explore-title" data-explore${draft(e.draft, "Owner-editable — placeholder themes for Sanzid to replace")}>
    <h2 class="visually-hidden" id="explore-title">What I’m exploring now</h2>
    <div class="container explore__grid">
      <div class="explore__texts">
        <div class="explore__window" data-explore-window>
          <div class="explore__track" data-explore-track>${blocks.join("")}</div>
        </div>
      </div>
      <div class="explore__cards">${cards.join("")}</div>
    </div>
  </section>`;
}

/* ------------------------------------------------- start here (pinned) */

function startHere(ctx) {
  const s = ctx.data.home.startHere;
  return `<section class="hscroll section--soft" id="start-here" aria-labelledby="start-title" data-hscroll>
    <div class="hscroll__sticky" data-hscroll-sticky>
      <div class="container">
        ${sectionHead({ tagText: "Start here", tagCls: "tag--white", title: "New to Ignite2Flourish? Begin with these three.", intro: s.intro, id: "start-title", draftFlag: true })}
      </div>
      <div class="hscroll__viewport container" data-hscroll-viewport>
        <ol class="hscroll__track" data-hscroll-track>${ctx.data.home.startHereItems
          .map((a, i) => `<li class="hscroll__item" data-anim="slide-up" data-delay="${200 + i * 100}">${pathCard(ctx, a, { index: i })}</li>`)
          .join("")}</ol>
      </div>
    </div>
  </section>`;
}

/* ------------------------------------------------------ featured (dark) */

function featured(ctx) {
  const item = ctx.data.home.featuredItem;
  return `<section class="section section--dark dark" aria-labelledby="featured-title">
    <div class="container">
      ${sectionHead({ tagText: "Featured", title: "An essay worth your time", id: "featured-title", draftFlag: true })}
      ${featureCard(ctx, item, { headingTag: "h3" })}
    </div>
  </section>`;
}

/* ------------------------------------------------------------- latest */

function latest(ctx) {
  const { home, articles } = ctx.data;
  const items = articles.filter((a) => a !== home.featuredItem).slice(0, home.latestCount);
  return `<section class="section" aria-labelledby="latest-title">
    <div class="container">
      ${sectionHead({ tagText: "Latest", title: "Latest writing", id: "latest-title" })}
      <div class="post-grid">${items.map((a, i) => postCard(ctx, a, { index: i })).join("")}</div>
      <div class="section-cta" data-anim="slide-up">${btn({ href: ctx.u("/ideas/"), label: "All ideas", variant: "ink" })}</div>
    </div>
  </section>`;
}

/* ---------------------------------------------------- books & research */

function books(ctx) {
  const { reviews } = ctx.data;
  const book = reviews.find((r) => r.type === "book-review");
  const paper = reviews.find((r) => r.type === "research-review");
  if (!book && !paper) return "";
  const preview = (item) => (item.isPreview ? '<span class="chip chip--preview">Layout preview</span>' : "");
  const bookCell = book
    ? `<article class="bento__wide" data-anim="slide-up" data-delay="200">
        ${coverStage(ctx, book)}
        <div class="bento__body">
          <p class="kicker">Book review</p>
          <h3 class="bento__name"><a class="card-link" href="${ctx.u(book.url)}">${esc(book.book.title)}</a></h3>
          <p class="bento__role">${esc(authorsLine(book.book.authors))} · ${esc(book.book.publisher)}, ${book.book.year}</p>
          <p class="bento__text">${esc(book.excerpt)}</p>
          ${preview(book)}
        </div>
      </article>`
    : "";
  const paperCell = paper
    ? `<article class="bento__stat" data-anim="slide-up" data-delay="300">
        <p class="kicker">Research review</p>
        <p class="bento__year">${odometer(String(paper.paper.year))}</p>
        <h3 class="bento__paper"><a class="card-link" href="${ctx.u(paper.url)}">${esc(paper.paper.title)}</a></h3>
        <p class="bento__journal">${esc(paper.paper.journal)}</p>
        ${preview(paper)}
      </article>`
    : "";
  return `<section class="section section--soft" aria-labelledby="books-title">
    <div class="container">
      ${sectionHead({
        tagText: "Books & Research",
        tagCls: "tag--white",
        title: "Close readings of the books and studies that shape how we work",
        id: "books-title",
        draftFlag: true,
      })}
      <div class="bento">${bookCell}${paperCell}</div>
      ${reviews.every((r) => r.isPreview) ? `<p class="note" role="note">${icon("book")}<span>The first reviews are in preparation. Entries marked “Layout preview” show how books and research will be presented: their bibliographic details are real, their review text is not yet written.</span></p>` : ""}
      <div class="section-cta" data-anim="slide-up">${btn({ href: ctx.u("/books-research/"), label: "Browse books & research", variant: "ink" })}</div>
    </div>
  </section>`;
}

export function homePage(ctx) {
  const { site, authors } = ctx.data;
  const author = authors[site.defaultAuthor];
  return {
    path: "/",
    fullTitle: `${site.name} — ${site.tagline}`,
    description: site.description,
    bodyClass: "page-home",
    jsonld: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: site.name,
        url: ctx.abs("/"),
        description: site.description,
        inLanguage: site.locale,
        publisher: { "@type": "Person", name: author.name },
        potentialAction: {
          "@type": "SearchAction",
          target: `${ctx.abs("/search/")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
    content: [
      hero(ctx),
      `<div class="curtain" data-curtain>`,
      CAP,
      ticker(ctx),
      why(ctx),
      aboutSplit(ctx),
      topics(ctx),
      exploring(ctx),
      startHere(ctx),
      featured(ctx),
      latest(ctx),
      books(ctx),
      `<div class="section"><div class="container">${conversationBlock(ctx)}</div></div>`,
      `</div>`,
    ].join("\n"),
  };
}
