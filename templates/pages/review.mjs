// Book review and research review (WordPress: single-review.php with ACF
// fields for the bibliographic data and each section in `parts`).
// Dark header with a centred title and the cover on its art overlapping the
// edge, then the review text beside an "at a glance" panel.

import { esc } from "../../scripts/lib/util.mjs";
import {
  authorBox,
  authorsLine,
  breadcrumbs,
  btn,
  byline,
  conversationBlock,
  coverStage,
  icon,
  picture,
  share,
} from "../components.mjs";
import { breadcrumbLD, personLD, related, tagList } from "./article.mjs";

const BOOK_PARTS = [
  ["argument", "The central argument"],
  ["ideas", "Main ideas"],
  ["takeaways", "Practical takeaways"],
  ["assessment", "Critical assessment"],
  ["audience", "Who should read it"],
];

/** "Amy Edmondson" → "Edmondson, A."; "Corey L. M. Keyes" → "Keyes, C. L. M." */
const apaName = (full) => {
  const parts = full.replace(/\./g, "").split(/\s+/);
  const family = parts.pop();
  return `${family}, ${parts.map((p) => `${p[0]}.`).join(" ")}`;
};
const apaAuthors = (list) =>
  list.length === 1 ? apaName(list[0]) : `${list.slice(0, -1).map(apaName).join(", ")}, & ${apaName(list.at(-1))}`;

function previewNotice(item) {
  if (!item.isPreview) return "";
  const what = item.type === "book-review" ? "book" : "paper";
  return `<div class="notice notice--preview review-notice" role="note">
    <p><strong>Layout preview, not a published review.</strong> The ${what}’s bibliographic details are accurate and were verified against public records. The section text below is placeholder guidance showing what each part of a review will contain.</p>
  </div>`;
}

const part = (item, html) =>
  item.isPreview ? `<div class="placeholder" data-placeholder><p class="placeholder__label">Placeholder guidance</p>${html}</div>` : html;

const section = (ctx, item, key, title, cls = "") =>
  item.parts[key]
    ? `<section class="review-section ${cls}" aria-labelledby="s-${key}"><h2 id="s-${key}">${title}</h2>${part(item, ctx.prose(item.parts[key]))}</section>`
    : "";

function trailFor(item) {
  const isBook = item.type === "book-review";
  return [
    { label: "Home", href: "/" },
    { label: "Books & Research", href: "/books-research/" },
    { label: isBook ? "Books" : "Research", href: isBook ? "/books-research/books/" : "/books-research/research/" },
    { label: item.title, href: item.url },
  ];
}

function glance(ctx, item) {
  const isBook = item.type === "book-review";
  const b = item.book;
  const p = item.paper;
  const rows = isBook
    ? [
        ["Author", authorsLine(b.authors)],
        ["Publisher", b.publisher],
        ["Published", b.year],
        ["Pages", b.pages],
        ["ISBN", b.isbn],
        ["Theme", item.categoryObj.name],
        ["Verdict", item.verdict || (item.isPreview ? "To come with the review" : "")],
      ]
    : [
        ["Authors", authorsLine(p.authors)],
        ["Journal", p.journal],
        ["Year", p.year],
        ["Volume", p.volume ? `${p.volume}${p.issue ? ` (${p.issue})` : ""}` : ""],
        ["Pages", p.pages],
        ["Theme", item.categoryObj.name],
      ];
  const link = isBook
    ? b.link
      ? `<a class="link-arrow" href="${esc(b.link)}" rel="noopener">Book details on Open Library${icon("external")}</a>`
      : ""
    : p.doi
      ? `<a class="link-arrow" href="https://doi.org/${esc(p.doi)}" rel="noopener">Read the paper (DOI)${icon("external")}</a>`
      : "";
  return `<aside class="glance" aria-label="At a glance">
    <p class="glance__title">At a glance</p>
    <dl>${rows
      .filter(([, v]) => v)
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
      .join("")}</dl>
    ${link}
    <div class="glance__by">${byline(ctx, item, { prefix: "Reviewed by" })}</div>
    ${share(ctx, item)}
  </aside>`;
}

function body(ctx, item) {
  if (item.type === "book-review") {
    return BOOK_PARTS.map(([key, title]) => section(ctx, item, key, title)).join("");
  }
  const p = item.paper;
  const citation = `${apaAuthors(p.authors)} (${p.year}). ${esc(p.title)}. <em>${esc(p.journal)}</em>${p.volume ? `, <em>${esc(p.volume)}</em>` : ""}${p.issue ? `(${esc(p.issue)})` : ""}${p.pages ? `, ${esc(p.pages)}` : ""}.${p.doi ? ` <a href="https://doi.org/${esc(p.doi)}" rel="noopener">https://doi.org/${esc(p.doi)}</a>` : ""}`;
  return `${section(ctx, item, "question", "Research question")}
    ${section(ctx, item, "method", "Methodology")}
    <div class="panel panel--source">
      <p class="panel__label">${icon("doc")}From the paper</p>
      ${section(ctx, item, "findings", "What the research found")}
    </div>
    ${section(ctx, item, "limitations", "Limitations")}
    ${section(ctx, item, "relevance", "Practical relevance")}
    <div class="panel panel--author">
      <p class="panel__label">${picture(ctx, "avatar", { alt: "", sizes: "28px", cls: "panel__avatar" })}${esc(item.authorObj.name)}’s interpretation</p>
      ${section(ctx, item, "interpretation", "What I make of it")}
    </div>
    <section class="references" aria-labelledby="refs-${item.slug}">
      <h2 id="refs-${item.slug}">Reference</h2>
      <p class="references__cite">${citation}</p>
    </section>`;
}

export function reviewPage(ctx, item) {
  const isBook = item.type === "book-review";
  const title = isBook ? `${item.book.title} by ${item.book.authors.join(", ")} | Book review` : `${item.title} | Research review`;
  const heading = isBook ? item.book.title : item.paper.title;
  const by = isBook
    ? `by ${esc(authorsLine(item.book.authors))} · ${esc(item.book.publisher)}, ${item.book.year}`
    : `${esc(authorsLine(item.paper.authors))} · <em>${esc(item.paper.journal)}</em>, ${item.paper.year}`;
  const content = `<article class="review">
    <header class="review-hero dark">
      <div class="container container--narrow">
        <div class="review-hero__top" data-anim="blur-in" data-delay="100">
          ${btn({ href: ctx.u("/books-research/"), label: "Back to Books & Research", back: true, variant: "dark" })}
          ${breadcrumbs(ctx, trailFor(item))}
        </div>
        <div class="review-hero__text" data-anim="blur-in" data-delay="150">
          <p class="review-hero__tags"><span class="tag tag--dark">${isBook ? "Book review" : "Research review"}</span>${item.isPreview ? '<span class="chip chip--preview">Layout preview</span>' : ""}</p>
          <h1 class="h1 review-hero__title">${esc(heading)}</h1>
          ${isBook && item.book.subtitle ? `<p class="review-hero__subtitle">${esc(item.book.subtitle)}</p>` : ""}
          <p class="review-hero__by">${by}</p>
        </div>
        <div class="review-hero__stage" data-anim="blur-in" data-delay="250">${coverStage(ctx, item, { size: "lg" })}</div>
      </div>
    </header>
    <div class="container container--narrow review-body">
      ${previewNotice(item)}
      <div class="review-layout">
        <div class="review-main prose">${body(ctx, item)}</div>
        ${glance(ctx, item)}
      </div>
      <div class="review-end">
        ${tagList(ctx, item)}
        ${authorBox(ctx, item.authorObj, { heading: "About the reviewer" })}
        ${conversationBlock(ctx, { item, compact: true })}
      </div>
    </div>
  </article>
  ${related(ctx, item)}`;

  const ld = isBook
    ? {
        "@context": "https://schema.org",
        "@type": "Book",
        name: item.book.title,
        author: item.book.authors.map((n) => ({ "@type": "Person", name: n })),
        publisher: item.book.publisher,
        datePublished: String(item.book.year),
        isbn: item.book.isbn || undefined,
      }
    : {
        "@context": "https://schema.org",
        "@type": "ScholarlyArticle",
        headline: item.paper.title,
        author: item.paper.authors.map((n) => ({ "@type": "Person", name: n })),
        datePublished: String(item.paper.year),
        isPartOf: { "@type": "Periodical", name: item.paper.journal },
        sameAs: item.paper.doi ? `https://doi.org/${item.paper.doi}` : undefined,
      };
  // A real review adds Review markup; previews deliberately do not.
  if (!item.isPreview) {
    ld.review = { "@type": "Review", author: personLD(ctx, item.authorObj), datePublished: item.date, url: ctx.abs(item.url) };
  }
  return {
    path: item.url,
    title,
    description: item.seo?.description || ctx.clip(item.excerpt, 158),
    bodyClass: `page-review page-review--${isBook ? "book" : "research"} theme-${item.category}`,
    ogType: "article",
    ogImage: ctx.ogImage(item),
    noindex: item.isPreview,
    jsonld: [ld, breadcrumbLD(ctx, trailFor(item))],
    content,
  };
}
