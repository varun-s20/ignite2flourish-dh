// Reusable UI components. Each function returns an HTML string and maps to a
// future WordPress template part (see README › WordPress conversion).

import { coverPath, topicCoverPath } from "./art.mjs";
import { attrs, cx, esc, formatDate, inline } from "../scripts/lib/util.mjs";

/* ---------------------------------------------------------------- icons */

const ICONS = {
  arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M20 12H5M11 6l-6 6 6 6"/>',
  external: '<path d="M8 16 17 7M9 7h8v8"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  rss: '<path d="M5 5a14 14 0 0 1 14 14M5 11a8 8 0 0 1 8 8"/><circle cx="6" cy="18" r="1.2" fill="currentColor"/>',
  doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
  book: '<path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h9"/>',
  flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.4 3.8-7.6.4 1.6 1.2 2.6 2.2 3.1C11.6 7.6 12.6 5 15 3c-.4 2.8.4 4.9 1.8 6.6 1.1 1.4 1.7 3 1.7 4.9C18.5 18.4 15.9 21 12 21Z"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.3"/><path d="M15.8 14.2c2.4.2 4.2 1.8 4.7 4.8"/>',
  chat: '<path d="M4 5.5h16v10H9l-5 4z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>',
  pen: '<path d="M4 20l1.2-4.4L15.6 5.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.4 18.8z"/><path d="M13.5 7.3l3.2 3.2"/>',
  star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" fill="currentColor"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z"/>',
  path: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h5.5a3.5 3.5 0 0 0 0-7h-3a3.5 3.5 0 0 1 0-7H16"/>',
  sprout: '<path d="M12 20v-8"/><path d="M12 12c0-3.6-2.6-6-6.5-6 0 3.6 2.6 6 6.5 6Z"/><path d="M12 14.5c0-3.3 2.4-5.5 6-5.5 0 3.3-2.4 5.5-6 5.5Z"/>',
  briefcase: '<rect x="3.5" y="7" width="17" height="12.5" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5s1.1-6.1 3.4-8.5Z"/>',
  screen: '<rect x="3.5" y="4.5" width="17" height="11.5" rx="1.8"/><path d="M8.5 20h7M12 16v4"/><path d="m10.5 8.2 3.6 2.1-3.6 2.1z"/>',
  cap: '<path d="m2.5 9.5 9.5-4.5 9.5 4.5-9.5 4.5z"/><path d="M6.5 11.5v4.2c1.4 1.4 3.3 2.1 5.5 2.1s4.1-.7 5.5-2.1v-4.2M21.5 9.5v5"/>',
};

export const icon = (name, cls = "") =>
  `<svg class="${cx("icon", cls)}" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

/** LinkedIn's own logo in its brand colours: the white "in" on the blue
    rounded square (#0A66C2), as LinkedIn's brand guidelines show it. */
export const linkedinIcon = () =>
  '<svg class="icon icon--linkedin" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><rect width="24" height="24" rx="4" fill="#0A66C2"/><path fill="#fff" transform="translate(3.6 3.4) scale(0.7)" d="M4.98 3.5a2.48 2.48 0 1 1 0 4.96 2.48 2.48 0 0 1 0-4.96ZM3 9.75h4v11H3zM9.5 9.75h3.83v1.5h.06c.53-1 1.84-2.06 3.79-2.06 4.05 0 4.8 2.67 4.8 6.13v5.43h-4v-4.82c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.9h-4z"/></svg>';

/* ------------------------------------------------------------- buttons */

/** Label that rolls up to a copy of itself on hover. */
export const roll = (label) =>
  `<span class="roll"><span class="roll__in">${label}</span><span class="roll__in" aria-hidden="true">${label}</span></span>`;

/**
 * Pill button. Solid variants carry the round arrow badge; outline variants
 * have a plain arrow; ghost variants are label-only.
 * variant: sun | dark | ink | white | outline | outline-light | ghost | ghost-light
 */
export function btn({ href, label, variant = "sun", cls, back = false, type, attrs: extra = {}, external = false }) {
  const text = esc(label);
  const ghost = variant.startsWith("ghost");
  const outline = variant.startsWith("outline");
  const iconPart = ghost
    ? ""
    : outline
      ? `<span class="btn__arrow" aria-hidden="true">${icon(back ? "arrowLeft" : "arrow")}</span>`
      : `<span class="btn__icon" aria-hidden="true">${icon("arrow")}${icon("arrow")}</span>`;
  const inner = back ? `${iconPart}<span class="btn__text">${roll(text)}</span>` : `<span class="btn__text">${roll(text)}</span>${iconPart}`;
  const classes = cx("btn", `btn--${variant}`, back && "btn--back", cls);
  const ext = external ? `<span class="visually-hidden"> (opens in a new tab)</span>` : "";
  if (!href) return `<button class="${classes}" type="${type || "button"}"${attrs(extra)}>${inner}</button>`;
  return `<a class="${classes}" href="${esc(href)}"${external ? ' target="_blank" rel="noopener"' : ""}${attrs(extra)}>${inner}${ext}</a>`;
}

/** Form submit: forms.js swaps the label text while sending, so no roll. */
export const submitButton = (label, variant = "sun", cls = "") =>
  `<button class="${cx("btn", `btn--${variant}`, cls)}" type="submit" data-submit><span class="btn__text" data-submit-label>${esc(label)}</span><span class="btn__icon" aria-hidden="true">${icon("arrow")}${icon("arrow")}</span></button>`;

/** Round arrow that opens into a labelled pill when its card is hovered. */
export const arrowPill = (label, width = 200) =>
  `<span class="arrow-pill" style="--pill-w:${width}px" aria-hidden="true"><span class="arrow-pill__label">${esc(label)}</span><span class="arrow-pill__icon">${icon("arrow")}</span></span>`;

/* ---------------------------------------------------------------- tags */

export const tag = (text, { cls, iconName, raw = false } = {}) =>
  iconName
    ? `<p class="${cx("tag tag--icon", cls)}"><span class="tag__icon" aria-hidden="true">${icon(iconName)}</span>${raw ? text : esc(text)}</p>`
    : `<p class="${cx("tag", cls)}">${raw ? text : esc(text)}</p>`;

/** Numbers that roll up like an odometer: "22", "100+", "7". */
export function odometer(value) {
  const str = String(value);
  let d = 0;
  const parts = [...str].map((ch) => {
    if (!/\d/.test(ch)) return `<span class="odo__static">${esc(ch)}</span>`;
    const n = Number(ch);
    // a column 0…9 plus a full loop, so every digit travels before landing
    const seq = [];
    for (let k = 0; k <= 10 + n; k++) seq.push(k % 10);
    return `<span class="odo__digit" style="--d:${d++};--n:${seq.length - 1}"><span class="odo__sizer">${n}</span><span class="odo__col">${seq.map((k) => `<span>${k}</span>`).join("")}</span></span>`;
  });
  return `<span class="odo" aria-hidden="true">${parts.join("")}</span><span class="visually-hidden">${esc(str)}</span>`;
}

export function marquee(items, { label, speed } = {}) {
  const list = (hidden) =>
    `<ul class="marquee__list"${hidden ? ' aria-hidden="true"' : ""}>${items.map((it) => `<li class="marquee__item">${esc(it.label)}</li>`).join("")}</ul>`;
  return `<div class="marquee"${label ? ` aria-label="${esc(label)}" role="region"` : ""}${speed ? ` style="--marquee-speed:${speed}s"` : ""}><div class="marquee__track">${list(false)}${list(true)}</div></div>`;
}

/** Accordion built on <details>, so it works without JavaScript. */
export function faq(items, { cls } = {}) {
  return `<div class="${cx("faq", cls)}" data-faq>${items
    .map(
      (it, i) => `<details class="faq__item" data-anim="slide-up" data-delay="${100 + i * 60}"${i === 0 ? " open" : ""}>
        <summary class="faq__q"><span>${esc(it.q)}</span><span class="faq__icon" aria-hidden="true"></span></summary>
        <div class="faq__a"><div class="faq__a-inner">${it.a}</div></div>
      </details>`,
    )
    .join("")}</div>`;
}

/* ------------------------------------------------------------- imagery */

const IMAGES = {
  hero: { widths: [480, 720], w: 720, h: 960 },
  "home-about": { widths: [640, 960, 1260], w: 1260, h: 1145 },
  exploring: { widths: [640, 960, 1240], w: 1240, h: 1148 },
  "about-wide": { widths: [480, 720], w: 720, h: 503 },
  "about-tall": { widths: [480, 720], w: 720, h: 1067 },
  "about-statement": { widths: [600, 980], w: 980, h: 1089 },
  avatar: { widths: [96, 192], w: 192, h: 192 },
};

/** Responsive <picture> for the client's photography (WebP + JPEG). */
export function picture(ctx, name, { alt, sizes, cls, loading = "lazy", priority = false }) {
  const img = IMAGES[name];
  const set = (ext) => img.widths.map((w) => `${ctx.u(`/assets/images/${name}-${w}.${ext}`)} ${w}w`).join(", ");
  const largest = img.widths.at(-1);
  return `<picture class="${cx("picture", cls)}">
    <source type="image/webp" srcset="${set("webp")}" sizes="${esc(sizes)}">
    <img src="${ctx.u(`/assets/images/${name}-${largest}.jpg`)}" srcset="${set("jpg")}" sizes="${esc(sizes)}" width="${img.w}" height="${img.h}" alt="${esc(alt)}"${attrs({ loading: priority ? "eager" : loading, decoding: priority ? null : "async", fetchpriority: priority ? "high" : null })}>
  </picture>`;
}

/** Generative cover for an article or review; purely decorative. */
export function cover(ctx, item, { cls, loading = "lazy", priority = false } = {}) {
  return `<img class="${cx("cover", cls)}" src="${ctx.u(coverPath(item.slug))}" width="1200" height="800" alt=""${attrs({ loading: priority ? "eager" : loading, decoding: "async", fetchpriority: priority ? "high" : null })}>`;
}

export function topicCover(ctx, category, { cls, loading = "lazy" } = {}) {
  return `<img class="${cx("cover", cls)}" src="${ctx.u(topicCoverPath(category.slug))}" width="1200" height="800" alt="" loading="${loading}" decoding="async">`;
}

/* Number cards on art that says what each counts: growth rings for years,
   the dotted world (his markets lit) for countries, a route of seven stops
   for the markets he worked in, a stack of pages for essays. */

export const NUMBER_ART = {
  route: `<svg class="num-card__art num-card__art--route" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><path d="M20 168 C 60 150, 50 110, 92 104 S 150 70, 128 40 S 170 20, 186 30"/>${[[20, 168], [52, 140], [92, 104], [132, 84], [128, 40], [160, 26], [186, 30]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6"/>`)
    .join("")}</svg>`,
  // one bar per year, rising, the latest year lit in sun
  years: `<svg class="num-card__art num-card__art--years" viewBox="0 0 220 120" aria-hidden="true" focusable="false">${Array.from({ length: 22 }, (_, i) => {
    const h = 14 + i * 4.6;
    return `<rect x="${4 + i * 9.6}" y="${116 - h}" width="5.4" height="${h}" rx="2.7"${i === 21 ? ' class="is-now"' : ""} style="--i:${i}"/>`;
  }).join("")}</svg>`,
  world: (ctx) => `<img class="num-card__art num-card__art--map" src="${ctx.u("/assets/images/world-dots.svg")}" alt="" width="1440" height="500" loading="lazy" decoding="async">`,
  pages: `<svg class="num-card__art" viewBox="0 0 200 200" aria-hidden="true" focusable="false">${[0, 1, 2, 3]
    .map((i) => `<g transform="translate(${118 - i * 14} ${46 + i * 16}) rotate(${8 - i * 5})"><rect width="74" height="96" rx="5"/><path d="M12 20h50M12 32h50M12 44h38M12 56h50M12 68h30"/></g>`)
    .join("")}</svg>`,
};

const NUMBER_ICONS = { years: "briefcase", world: "globe", pages: "pen", route: "path" };

export function numCards(ctx, items) {
  const value = (v) => (v === "{essays}" ? String(ctx.data.articles.length) : v);
  return `<ul class="numbers__grid">${items
    .map((s, i) => {
      const art = typeof NUMBER_ART[s.art] === "function" ? NUMBER_ART[s.art](ctx) : NUMBER_ART[s.art] || "";
      return `<li class="num-card num-card--${s.tone}" data-anim="slide-up" data-delay="${200 + i * 100}">
        ${art}
        <span class="num-card__icon" aria-hidden="true">${icon(NUMBER_ICONS[s.art] || "star")}</span>
        <p class="num-card__value">${odometer(value(s.value))}</p>
        <p class="num-card__label">${esc(s.label)}</p>
      </li>`;
    })
    .join("")}</ul>`;
}

/* ------------------------------------------------------------ metadata */

export const draft = (flag, note = "Draft copy, awaiting client approval") =>
  flag ? ` data-draft="${esc(note)}"` : "";

export function kicker(ctx, item, { link = true } = {}) {
  if (item.kind === "review") {
    const label = item.type === "book-review" ? "Book review" : "Research review";
    return `<span class="kicker">${label}</span>`;
  }
  const c = item.categoryObj;
  return link ? `<a class="kicker" href="${ctx.u(c.url)}">${esc(c.name)}</a>` : `<span class="kicker">${esc(c.name)}</span>`;
}

const sep = '<span class="sep" aria-hidden="true"></span>';

/** "Published 13 June 2023 · Work & Leadership" */
export function postMeta(ctx, item, { link = true } = {}) {
  const when = item.isPreview
    ? '<span class="chip chip--preview">Layout preview</span>'
    : `<span class="muted">Published</span> <time datetime="${item.date}">${formatDate(item.date)}</time>`;
  return `<p class="post-card__meta">${when}${sep}${kicker(ctx, item, { link })}</p>`;
}

/* ---------------------------------------------------------------- cards */

const searchText = (item, extra = []) =>
  [item.title, item.excerpt, item.categoryObj.name, ...item.tagObjs.map((t) => t.name), ...extra].join(" ").toLowerCase();

/** Article card: art with a cursor-following arrow badge, meta, title, excerpt. */
export function postCard(ctx, item, { headingTag = "h3", index = 0, filterable = false, anim = true } = {}) {
  const data = filterable
    ? ` data-item data-id="${esc(item.id)}" data-category="${esc(item.category)}" data-type="${esc(item.type)}" data-search="${esc(searchText(item))}" style="--i:${index % 6}"`
    : "";
  const motion = anim ? ` data-anim="slide-up" data-delay="${200 + (index % 3) * 100}"` : "";
  return `<article class="post-card" data-follow${data}${motion}>
    <a class="post-card__thumb" href="${ctx.u(item.url)}" tabindex="-1" aria-hidden="true">
      ${cover(ctx, item)}
      <span class="post-card__badge">${icon("arrow")}</span>
    </a>
    ${postMeta(ctx, item)}
    <${headingTag} class="post-card__title"><a class="card-link" href="${ctx.u(item.url)}">${esc(item.title)}</a></${headingTag}>
    <p class="post-card__excerpt">${esc(item.excerpt)}</p>
  </article>`;
}

/** Dark lead card (the featured essay). */
export function featureCard(ctx, item, { headingTag = "h2", label = "Featured essay", cta = "Read the essay" } = {}) {
  return `<article class="feature" data-anim="blur-in" data-delay="200">
    <div class="feature__media">${cover(ctx, item)}</div>
    <div class="feature__body">
      <p class="feature__meta"><span class="muted">${esc(label)}</span><span aria-hidden="true">·</span><time datetime="${item.date}">${formatDate(item.date)}</time></p>
      ${kicker(ctx, item)}
      <${headingTag} class="feature__title">${esc(item.title)}</${headingTag}>
      <p class="feature__excerpt">${esc(item.excerpt)}</p>
      <div class="feature__actions">${btn({ href: ctx.u(item.url), label: cta, attrs: { "aria-label": `${cta}: ${item.title}` } })}</div>
    </div>
  </article>`;
}

/** Start-here card: art on the left, words on the right, a round arrow that
    opens into a labelled pill on hover. */
export function pathCard(ctx, item, { index = 0, headingTag = "h3" } = {}) {
  return `<article class="path-card">
    <div class="path-card__media">${cover(ctx, item)}</div>
    <div class="path-card__body">
      <p class="path-card__num"><span>0${index + 1}</span>${esc(item.categoryObj.name)}</p>
      <${headingTag} class="path-card__title"><a class="card-link" href="${ctx.u(item.url)}">${esc(item.title)}</a></${headingTag}>
      <p class="path-card__excerpt">${esc(item.excerpt)}</p>
      <div class="path-card__go"><span class="path-card__time">${item.minutes} min read</span>${arrowPill("Read the essay", 186)}</div>
    </div>
  </article>`;
}

/** Topic cards with a large brand-colour circle (owner-editable via taxonomy). */
export function themeCards(ctx, { headingTag = "h3" } = {}) {
  return `<ul class="theme-cards">${ctx.data.categories
    .map(
      (c, i) => `<li class="theme-card theme-card--${c.slug}" data-anim="slide-up" data-delay="${200 + i * 100}">
        <span class="theme-card__orb" aria-hidden="true"><span>${esc(c.name)}</span></span>
        <${headingTag} class="theme-card__title"><a class="card-link" href="${ctx.u(c.url)}">${esc(c.name)}</a></${headingTag}>
        <p class="theme-card__text">${esc(c.description)}</p>
        <span class="theme-card__more" aria-hidden="true">${c.items.length} ${c.items.length === 1 ? "essay" : "essays"}${icon("arrow")}</span>
      </li>`,
    )
    .join("")}</ul>`;
}

/* -------------------------------------------------------- books/research */

export const authorsLine = (list = []) =>
  list.length <= 2 ? list.join(" & ") : `${list.slice(0, -1).join(", ")} & ${list.at(-1)}`;

/** Typographic stand-in for a book cover, never a copy of the real one. */
export function bookCover(item, size = "md") {
  const b = item.book;
  return `<div class="book-cover book-cover--${size} book-cover--${b.coverTone || "plum"}" role="img" aria-label="Typographic cover: ${esc(b.title)} by ${esc(authorsLine(b.authors))}">
    <span class="book-cover__spine" aria-hidden="true"></span>
    <span class="book-cover__title" aria-hidden="true">${esc(b.title)}</span>
    ${b.subtitle ? `<span class="book-cover__sub" aria-hidden="true">${esc(b.subtitle)}</span>` : ""}
    <span class="book-cover__author" aria-hidden="true">${esc(authorsLine(b.authors))}</span>
  </div>`;
}

/** Journal first-page motif for a research paper. */
export function paperCard(item, size = "md") {
  const p = item.paper;
  return `<div class="paper-card paper-card--${size}" role="img" aria-label="Research paper: ${esc(p.title)}, ${esc(p.journal)}, ${p.year}">
    <span class="paper-card__journal" aria-hidden="true">${esc(p.journal)}</span>
    <span class="paper-card__year" aria-hidden="true">${p.year}${p.volume ? ` · Vol. ${esc(p.volume)}` : ""}</span>
    <span class="paper-card__title" aria-hidden="true">${esc(p.title)}</span>
    <span class="paper-card__authors" aria-hidden="true">${esc(authorsLine(p.authors))}</span>
    <span class="paper-card__lines" aria-hidden="true"></span>
  </div>`;
}

/** The book or paper standing on its generative art. */
export function coverStage(ctx, item, { size = "md", cls } = {}) {
  const isBook = item.type === "book-review";
  return `<div class="${cx("cover-stage", !isBook && "cover-stage--paper", cls)}">
    ${cover(ctx, item)}
    <div class="cover-stage__item">${isBook ? bookCover(item, size) : paperCard(item, size)}</div>
  </div>`;
}

export const reviewSource = (item) =>
  item.type === "book-review"
    ? `${authorsLine(item.book.authors)} · ${item.book.publisher}, ${item.book.year}`
    : `${authorsLine(item.paper.authors)} · ${item.paper.journal}, ${item.paper.year}`;

/** Archive row for Books & Research. */
export function reviewRow(ctx, item, { headingTag = "h2", index = 0 } = {}) {
  const isBook = item.type === "book-review";
  return `<article class="review-row" data-item data-id="${esc(item.id)}" data-type="${esc(item.type)}" data-category="${esc(item.category)}" data-search="${esc(searchText(item, [reviewSource(item)]))}" style="--i:${index % 6}">
    ${coverStage(ctx, item)}
    <div class="review-row__body">
      <p class="review-row__top"><span class="kicker">${isBook ? "Book review" : "Research review"}</span>${item.isPreview ? '<span class="chip chip--preview">Layout preview</span>' : ""}</p>
      <${headingTag} class="review-row__title"><a class="card-link" href="${ctx.u(item.url)}">${esc(item.title)}</a></${headingTag}>
      <p class="review-row__source">${esc(reviewSource(item))}</p>
      <p class="review-row__excerpt">${esc(item.excerpt)}</p>
      <div class="path-card__go">${arrowPill("Read the review", 192)}</div>
    </div>
  </article>`;
}

/* ----------------------------------------------------- author & sharing */

export function authorBox(ctx, author, { heading = "About the author" } = {}) {
  return `<aside class="author-box" aria-label="${esc(heading)}" data-anim="slide-up">
    ${picture(ctx, "avatar", { alt: `Portrait of ${author.name}`, sizes: "88px", cls: "author-box__photo" })}
    <div class="author-box__body">
      <p class="label">${esc(heading)}</p>
      <p class="author-box__name"><a href="${ctx.u("/about/")}">${esc(author.name)}</a></p>
      <p class="author-box__role">${esc(author.descriptor)}</p>
      <p class="author-box__bio"${draft(true)}>${esc(author.shortBio)}</p>
      <p class="author-box__links">
        <a class="link-arrow" href="${esc(author.linkedin)}" rel="me noopener" target="_blank">Connect on LinkedIn${icon("external")}<span class="visually-hidden"> (opens in a new tab)</span></a>
        <a class="link-arrow" href="${ctx.u("/about/")}">More about ${esc(author.name.split(" ")[0])}${icon("arrow")}</a>
      </p>
    </div>
  </aside>`;
}

export function byline(ctx, item, { prefix = "By" } = {}) {
  const a = item.authorObj;
  return `<div class="byline">
    ${picture(ctx, "avatar", { alt: "", sizes: "44px", cls: "byline__photo" })}
    <div>
      <p class="byline__name">${prefix} <a href="${ctx.u("/about/")}" rel="author">${esc(a.name)}</a></p>
      <p class="byline__role">${esc(a.descriptor)}</p>
    </div>
  </div>`;
}

export function share(ctx, item, { label = "Share" } = {}) {
  const url = ctx.abs(item.url);
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  return `<div class="share" role="group" aria-label="${esc(label)} this ${item.kind === "review" ? "review" : "article"}">
    <span class="share__label">${esc(label)}</span>
    <a class="share__btn" href="${li}" target="_blank" rel="noopener">${linkedinIcon()}<span>LinkedIn</span><span class="visually-hidden"> (opens in a new tab)</span></a>
    <button class="share__btn" type="button" data-copy-link="${esc(url)}" hidden>${icon("link")}<span data-copy-label>Copy link</span></button>
  </div>`;
}

export function breadcrumbs(ctx, trail, { light = false } = {}) {
  return `<nav class="${cx("breadcrumbs", light && "breadcrumbs--light")}" aria-label="Breadcrumb"><ol>${trail
    .map((c, i) =>
      i === trail.length - 1
        ? `<li><span aria-current="page">${esc(c.label)}</span></li>`
        : `<li><a href="${ctx.u(c.href)}">${esc(c.label)}</a></li>`,
    )
    .join("")}</ol></nav>`;
}

/* -------------------------------------------------------- conversation */

/**
 * "Continue the conversation": an ember-to-plum glow panel. On articles and
 * reviews it carries the brief's end-of-article message.
 */
export function conversationBlock(ctx, { item = null, compact = false } = {}) {
  const h = ctx.data.site.home.conversation;
  const href = item ? `/contact/?about=${encodeURIComponent(item.slug)}` : h.cta.href;
  const id = `conv-${item ? item.slug : "panel"}`;
  // after an article: the brief's end-of-article message, word for word
  const text = item
    ? "I write to clarify my thinking, not to have the final word. If you disagree, know of relevant research, or have seen something different in practice, I would like to hear your perspective."
    : h.text;
  return `<section class="${cx("glow-panel", "glow-panel--compact", !compact && "glow-panel--wide")}" aria-labelledby="${id}" data-anim="slide-up"${draft(!item && h.draft)}>
    <div class="glow-panel__grid">
      <div class="glow-panel__head">
        <h2 class="glow-panel__title" id="${id}">Continue the conversation</h2>
        <p class="glow-panel__text">${esc(text)}</p>
      </div>
      <div class="glow-panel__action">${btn({ href: ctx.u(href), label: item ? "Share your perspective" : h.cta.label, variant: "white" })}</div>
    </div>
  </section>`;
}

/** Public, moderated responses. Needs a backend; preview mode stores nothing. */
export function responses(ctx, item) {
  const endpoint = ctx.data.site.forms.responses.endpoint;
  const id = `responses-${item.slug}`;
  return `<section class="responses" aria-labelledby="${id}">
    <h2 class="responses__title" id="${id}">Responses</h2>
    <p class="responses__policy">Public responses are moderated and appear once approved. For a private reply, use <a href="${ctx.u(`/contact/?about=${encodeURIComponent(item.slug)}`)}">Continue the Conversation</a>.</p>
    <p class="responses__empty">No published responses yet.</p>
    <details class="responses__compose" data-compose>
      <summary class="btn btn--soft btn--sm"><span class="btn__text">${roll("Write a response")}</span><span class="btn__icon" aria-hidden="true">${icon("arrow")}${icon("arrow")}</span></summary>
      ${endpoint ? "" : `<p class="notice notice--preview" role="note"><strong>Preview build.</strong> Responses are not stored or published here. Moderated public responses arrive with the WordPress build.</p>`}
      <form class="form form--response" data-form="response" data-endpoint="${esc(endpoint)}" novalidate>
        <div class="form__summary" data-error-summary tabindex="-1" hidden></div>
        <input type="hidden" name="article" value="${esc(item.slug)}">
        <div class="form__grid">
          <div class="field" data-field>
            <label for="${id}-name">Name <span class="field__req" aria-hidden="true">*</span></label>
            <input id="${id}-name" name="name" type="text" autocomplete="name" required maxlength="80" aria-describedby="${id}-name-err">
            <p class="field__error" id="${id}-name-err" data-error></p>
          </div>
          <div class="field" data-field>
            <label for="${id}-email">Email <span class="field__hint">(never published)</span> <span class="field__req" aria-hidden="true">*</span></label>
            <input id="${id}-email" name="email" type="email" autocomplete="email" required maxlength="160" aria-describedby="${id}-email-err">
            <p class="field__error" id="${id}-email-err" data-error></p>
          </div>
        </div>
        <div class="field" data-field>
          <label for="${id}-message">Your response <span class="field__req" aria-hidden="true">*</span></label>
          <textarea id="${id}-message" name="message" rows="5" required minlength="20" maxlength="3000" aria-describedby="${id}-message-err ${id}-message-count" data-count></textarea>
          <p class="field__meta"><span class="field__error" id="${id}-message-err" data-error></span><span class="field__count" id="${id}-message-count" data-counter aria-live="polite"></span></p>
        </div>
        <div class="hp" aria-hidden="true"><label for="${id}-website">Website</label><input id="${id}-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
        <div class="form__actions">${submitButton("Submit for moderation", "ink")}</div>
        <div class="form__result" data-result tabindex="-1" hidden></div>
      </form>
    </details>
  </section>`;
}

/* --------------------------------------------------------------- archive */

export function tabs(ctx, items, activeHref, label) {
  return `<nav class="tabs" aria-label="${esc(label)}"><ul class="tabs__list">${items
    .map(
      (t) =>
        `<li><a class="tabs__tab" href="${ctx.u(t.href)}" data-filter="${esc(t.value)}"${t.href === activeHref ? ' aria-current="page"' : ""}>${esc(t.label)}<span class="tabs__count">${t.count}</span></a></li>`,
    )
    .join("")}</ul></nav>`;
}

export function archiveSearch(id, label, placeholder) {
  return `<form class="archive-search" role="search" data-archive-search>
    <label class="visually-hidden" for="${id}">${esc(label)}</label>
    ${icon("search", "archive-search__icon")}
    <input id="${id}" type="search" name="q" placeholder="${esc(placeholder)}" autocomplete="off" data-archive-input>
    <button class="archive-search__clear" type="button" data-archive-clear hidden>${icon("close")}<span class="visually-hidden">Clear search</span></button>
  </form>`;
}

export function emptyState(ctx, { title, text, links = [], visible = false }) {
  return `<div class="empty-state" data-empty${visible ? "" : " hidden"}>
    <p class="empty-state__title" data-empty-title>${esc(title)}</p>
    <p class="empty-state__text">${esc(text)}</p>
    <div class="empty-state__actions">
      <button class="btn btn--ghost-light" type="button" data-archive-reset>${roll("Clear search")}</button>
      ${links.map((l) => `<a class="link-arrow" href="${ctx.u(l.href)}">${esc(l.label)}${icon("arrow")}</a>`).join("")}
    </div>
  </div>`;
}

export function loadMore(total, pageSize, noun) {
  return `<div class="load-more" data-load-more data-page-size="${pageSize}" hidden>
    <p class="load-more__status" data-load-status aria-live="polite">Showing ${Math.min(pageSize, total)} of ${total} ${noun}</p>
    <button class="btn btn--ink" type="button" data-load-button><span class="btn__text">${roll(`Show more ${noun}`)}</span><span class="btn__icon" aria-hidden="true">${icon("arrow")}${icon("arrow")}</span></button>
  </div>`;
}

/* ----------------------------------------------------------------- misc */

/** Main heading (+ intro, + action on the right for the split form). No
    eyebrow label above it: the heading says what the section is. */
export function sectionHead({ tagText, title, intro, id, action, split = false, draftFlag, tagCls, titleCls = "h2" }) {
  return `<header class="${cx("section-head", split && "section-head--split")}"${draft(draftFlag)}>
    <h2 class="${titleCls}" id="${id}" data-anim="slide-up">${inline(title)}</h2>
    ${intro ? `<p class="section-head__intro" data-anim="slide-up" data-delay="400">${esc(intro)}</p>` : ""}
    ${action ? `<div class="section-head__action" data-anim="slide-up" data-delay="400">${action}</div>` : ""}
  </header>`;
}
