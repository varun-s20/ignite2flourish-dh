// Home page (WordPress: front-page.php).
//
// v5 (27 Oct 2026), after phenom.com's restraint: each section says one
// thing, in a line or two, and lets a number, an icon or an image carry the
// rest. No eyebrow tags or filler subtext above headings.
//   hero        the client full height (gravity-design.de), headline, one
//               line, one button; what he has done on the right
//   numbers     one line, three numbers on related art
//   about       name and role in the spotlight
//   topics      icon list (phenom's industries list)
//   learning    institutions in dark tiles (phenom's "The Doers")
//   exploring   two questions and an invitation; the words swap as the
//               pictures scroll past
//   start here  three numbered pieces
//   featured, latest, books
//   closing     one line and one button (phenom's "Take the first step")

import { esc, inline } from "../../scripts/lib/util.mjs";
import { authorsLine, btn, cover, coverStage, draft, featureCard, icon, linkedinIcon, marquee, numCards, odometer, picture, postCard } from "../components.mjs";

/* A heading with an optional link on the right; nothing above or below. */
const head = (title, id, link) =>
  `<div class="home-head${link ? " home-head--split" : ""}">
    <h2 class="home-head__title" id="${id}" data-anim="slide-up">${title}</h2>
    ${link ? `<a class="link-arrow home-head__link" href="${link.href}" data-anim="slide-up">${esc(link.label)}${icon("arrow")}</a>` : ""}
  </div>`;

/* ------------------------------------------------------ hero (gravity) */
// After gravity-design.de: the first screen is the person, full height on a
// dark ground. To his right, the logo's own symbol (the three flame
// figures, from the client's vector PDF) rises in and glows. motion.js
// runs the scroll hand-off. The portrait is the client's photo with only
// the studio backdrop removed (scripts/cutouts.py).

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
  const author = ctx.data.authors[ctx.data.site.defaultAuthor];
  return `<section class="gravity dark" aria-labelledby="hero-title" data-gravity>
    <div class="gravity__figure" data-gravity-figure>
      <span class="gravity__glow" aria-hidden="true"></span>
      <svg class="gravity__halo" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><circle cx="50" cy="50" r="22"/><circle cx="50" cy="50" r="34"/><circle cx="50" cy="50" r="48"/></svg>
      ${figure(ctx)}
    </div>
    <div class="gravity__brand" aria-hidden="true">
      <span class="gravity__brand-glow"></span>
      <picture><source type="image/webp" srcset="${ctx.u("/assets/logo/ignite2flourish-symbol-360.webp")} 198w, ${ctx.u("/assets/logo/ignite2flourish-symbol-720.webp")} 395w" sizes="(min-width: 900px) 12vw, 60px"><img class="gravity__brand-img" src="${ctx.u("/assets/logo/ignite2flourish-symbol-720.png")}" width="395" height="720" alt=""></picture>
    </div>
    <div class="container gravity__inner">
      <div class="gravity__intro"${draft(h.draft)}>
        <h1 class="display hero__title gravity__title" id="hero-title" data-anim="blur-in" data-delay="900">${inline(h.headline)}</h1>
        <p class="gravity__lede" data-anim="blur-in" data-delay="1000">${esc(h.lede)}</p>
        <div class="gravity__action" data-anim="blur-in" data-delay="1100">${btn({ href: ctx.u(h.primary.href), label: h.primary.label })}</div>
      </div>
      <ul class="gravity__facts" aria-label="Experience"${draft(true)}>${h.facts
        .map(
          (f, i) => `<li class="gravity__fact" data-anim="blur-in" data-delay="${1200 + i * 90}">${icon(f.icon)}<span><strong>${esc(f.title)}</strong><span>${esc(f.text)}</span></span></li>`,
        )
        .join("")}</ul>
    </div>
    <div class="gravity__foot">
      <div class="container gravity__foot-inner">
        <p class="gravity__name" data-anim="blur-in" data-delay="1350"><strong>${esc(author.name)}</strong><span>${esc(author.descriptor)}</span></p>
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
    <div class="container curtain__ticker-inner">${marquee(themes, { label: "Recurring themes" })}</div>
  </div>`;
}

/* ------------------------------------------------------------- numbers */

function numbers(ctx) {
  const n = ctx.data.home.numbers;
  return `<section class="section numbers" aria-labelledby="numbers-title">
    <div class="container">
      <h2 class="numbers__title" id="numbers-title" data-anim="slide-up"${draft(n.draft)}>${inline(n.headline)}</h2>
      ${numCards(ctx, n.items)}
    </div>
  </section>`;
}

/* --------------------------------------------- about (photo | spotlight) */

function about(ctx) {
  const a = ctx.data.authors[ctx.data.site.defaultAuthor];
  const h = ctx.data.home.about;
  return `<section class="split split--home" aria-labelledby="about-title">
    <div class="split__media">${picture(ctx, "home-about", { alt: "Sanzid Ahmed in a blue shirt, smiling", sizes: "(min-width: 900px) 50vw, 100vw" })}</div>
    <div class="split__panel dark">
      <div class="split__inner">
        <p class="spot-role" data-anim="slide-up">${icon("star")}<span>${esc(a.descriptor)}</span></p>
        <h2 class="split__title spot-name" id="about-title" data-anim="slide-up">${esc(a.name)}</h2>
        <p data-anim="slide-up"${draft(true)}>${esc(h.text)}</p>
        <div data-anim="slide-up">${btn({ href: ctx.u("/about/"), label: "More about Sanzid", variant: "white" })}</div>
      </div>
    </div>
  </section>`;
}

/* ------------------------------------------------- topics (icon list) */
// phenom.com's industries list: a large heading on the left, rows on the
// right with an icon, the name, two lines and a chevron.

const TOPIC_ICONS = { "work-leadership": "compass", "career-life": "path", flourishing: "sprout" };

function topics(ctx) {
  const t = ctx.data.home.topics;
  return `<section class="section topics-v5" aria-labelledby="topics-title">
    <div class="container topics-v5__grid">
      <div class="topics-v5__head">
        <h2 class="topics-v5__title" id="topics-title" data-anim="slide-up">${inline(t.headline)}</h2>
        <p class="topics-v5__line" data-anim="slide-up"${draft(t.draft)}>${esc(t.line)}</p>
      </div>
      <ul class="topic-rows">${ctx.data.categories
        .map(
          (c, i) => `<li data-anim="slide-up" data-delay="${150 + i * 90}"><a class="topic-row topic-row--${esc(c.slug)}" href="${ctx.u(c.url)}">
          <span class="topic-row__icon">${icon(TOPIC_ICONS[c.slug] || "flame")}</span>
          <span class="topic-row__body"><span class="topic-row__name">${esc(c.name)}</span><span class="topic-row__text">${esc(c.description)}</span></span>
          <span class="topic-row__meta"><span>${c.items.length} essays</span>${icon("chevron")}</span>
        </a></li>`,
        )
        .join("")}</ul>
    </div>
  </section>`;
}

/* -------------------------------------------- learning (dark name tiles) */
// phenom.com's "The Doers": names in dark tiles. Here, the institutions his
// leadership and coaching learning comes from, set in type (their logos are
// theirs). Each needs the client's confirmation before launch.

function learning(ctx) {
  const l = ctx.data.home.learning;
  return `<section class="section section--dark dark learning" aria-labelledby="learning-title">
    <div class="container">
      <div class="learning__head">
        <h2 class="learning__title" id="learning-title" data-anim="slide-up">${inline(l.headline)}</h2>
        <p class="learning__line" data-anim="slide-up">${esc(l.line)}</p>
      </div>
      <ul class="learning__grid"${draft(l.draft)}>${l.items
        .map(
          (x, i) => `<li class="learning__tile" data-anim="slide-up" data-delay="${150 + i * 70}">
          <p class="learning__name learning__name--${esc(x.style || "sans")}">${esc(x.name)}${x.sub ? `<span>${esc(x.sub)}</span>` : ""}</p>
          <p class="learning__what">${esc(x.what)}</p>
        </li>`,
        )
        .join("")}</ul>
    </div>
  </section>`;
}

/* ---------------------------------------------- exploring (sticky swap) */
// The words on the left swap as each picture on the right scrolls past
// (motion.js, initExplore). Kept for the animation; the copy is one
// question and one line per theme.

function exploring(ctx) {
  const e = ctx.data.home.exploring;
  const items = ctx.data.home.exploringItems;
  const total = items.length + 1;
  const counter = (i) => `<p class="explore__count">0${i + 1} / 0${total}</p>`;
  const blocks = items.map(
    (x, i) => `<div class="explore__block" data-explore-block>
        ${counter(i)}
        <h3 class="h2 explore__title">${esc(x.title)}</h3>
        <p class="explore__note">${esc(x.note)}</p>
        ${x.linkItems[0] ? `<a class="link-arrow" href="${ctx.u(x.linkItems[0].url)}">Read the essay<span class="visually-hidden">: ${esc(x.linkItems[0].title)}</span>${icon("arrow")}</a>` : ""}
      </div>`,
  );
  blocks.push(`<div class="explore__block" data-explore-block>
        ${counter(items.length)}
        <h3 class="h2 explore__title">${esc(e.inviteTitle)}</h3>
        <p class="explore__note">${esc(e.invite)}</p>
        <div>${btn({ href: ctx.u("/contact/"), label: "Suggest a question" })}</div>
      </div>`);

  const cards = [
    ...items.map(
      (x) => `<div class="explore-card" data-explore-card aria-hidden="true">
        ${x.linkItems[0] ? cover(ctx, x.linkItems[0]) : ""}
      </div>`,
    ),
    `<div class="explore-card explore-card--photo" data-explore-card>
        ${picture(ctx, "exploring", { alt: "Sanzid Ahmed sitting on a wooden garden bench, smiling", sizes: "(min-width: 992px) 46vw, 92vw" })}
      </div>`,
  ];

  return `<section class="section explore" aria-labelledby="explore-title" data-explore${draft(e.draft)}>
    <div class="container">${head(esc(e.headline), "explore-title")}</div>
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

/* ------------------------------------------------ start here (numbered) */

function startHere(ctx) {
  const s = ctx.data.home.startHere;
  return `<section class="section section--soft start-v5" id="start-here" aria-labelledby="start-title">
    <div class="container">
      ${head(esc(s.headline), "start-title")}
      <ol class="start-list">${ctx.data.home.startHereItems
        .map(
          (a, i) => `<li data-anim="slide-up" data-delay="${150 + i * 100}"><a class="start-row" href="${ctx.u(a.url)}">
          <span class="start-row__num">0${i + 1}</span>
          <span class="start-row__theme mono">${esc(a.categoryObj.name)}</span>
          <span class="start-row__title">${esc(a.title)}</span>
          <span class="start-row__go">${a.minutes} min read${icon("arrow")}</span>
        </a></li>`,
        )
        .join("")}</ol>
    </div>
  </section>`;
}

/* ------------------------------------------------------ featured (dark) */

function featured(ctx) {
  return `<section class="section section--dark dark featured-v5" aria-label="Featured essay">
    <div class="container">${featureCard(ctx, ctx.data.home.featuredItem, { headingTag: "h2" })}</div>
  </section>`;
}

/* ------------------------------------------------------------- latest */

function latest(ctx) {
  const { home, articles } = ctx.data;
  const items = articles.filter((a) => a !== home.featuredItem).slice(0, home.latestCount);
  return `<section class="section latest-v5" aria-labelledby="latest-title">
    <div class="container">
      ${head("Latest writing", "latest-title", { href: ctx.u("/ideas/"), label: "All ideas" })}
      <div class="post-grid">${items.map((a, i) => postCard(ctx, a, { index: i })).join("")}</div>
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
  return `<section class="section section--soft books-v5" aria-labelledby="books-title">
    <div class="container">
      ${head("Books &amp; research", "books-title", { href: ctx.u("/books-research/"), label: "All reviews" })}
      <div class="bento">${bookCell}${paperCell}</div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------ closing */
// phenom.com's "Take the first step": one line, one sentence, one button.

function closing(ctx) {
  const c = ctx.data.home.closing;
  return `<section class="section closing" aria-labelledby="closing-title">
    <div class="container closing__inner">
      <span class="closing__mark" aria-hidden="true"><i></i><i></i><i></i></span>
      <h2 class="closing__title" id="closing-title" data-anim="slide-up"${draft(c.draft)}>${inline(c.headline)}</h2>
      <p class="closing__line" data-anim="slide-up">${esc(c.line)}</p>
      <div data-anim="slide-up">${btn({ href: ctx.u(c.cta.href), label: c.cta.label })}</div>
    </div>
  </section>`;
}

export function homePage(ctx) {
  const { site, authors } = ctx.data;
  const author = authors[site.defaultAuthor];
  return {
    path: "/",
    fullTitle: `${site.name} | ${site.tagline}`,
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
      numbers(ctx),
      about(ctx),
      topics(ctx),
      learning(ctx),
      exploring(ctx),
      startHere(ctx),
      featured(ctx),
      latest(ctx),
      books(ctx),
      closing(ctx),
      `</div>`,
    ].join("\n"),
  };
}
