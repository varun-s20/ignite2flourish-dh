// Single article (WordPress: single.php). Dark header with a back button and
// the cover overlapping the dark/light edge, then one calm reading column.
// Distraction-free by design: no progress bar, no pop-ups, no sidebars.

import { esc, plainText } from "../../scripts/lib/util.mjs";
import {
  authorBox,
  breadcrumbs,
  btn,
  byline,
  conversationBlock,
  cover,
  icon,
  kicker,
  postCard,
  responses,
  sectionHead,
  share,
} from "../components.mjs";

export function tagList(ctx, item) {
  if (!item.tagObjs.length) return "";
  return `<div class="tag-list"><p class="label">Topics</p><ul>${item.tagObjs
    .map((t) => `<li><a class="chip chip--link" href="${ctx.u(t.url)}">${esc(t.name)}</a></li>`)
    .join("")}</ul></div>`;
}

export function related(ctx, item) {
  if (!item.relatedItems?.length) return "";
  const isReview = item.kind === "review";
  return `<section class="section related" aria-labelledby="related-title">
    <div class="container">
      ${sectionHead({
        tagText: "Keep reading",
        title: isReview ? "Related reading" : "Related articles",
        id: "related-title",
        split: true,
        action: btn({ href: ctx.u(isReview ? "/books-research/" : "/ideas/"), label: isReview ? "All books & research" : "All ideas", variant: "ink" }),
      })}
      <div class="post-grid">${item.relatedItems.map((r, i) => postCard(ctx, r, { index: i })).join("")}</div>
    </div>
  </section>`;
}

export const personLD = (ctx, a) => ({
  "@type": "Person",
  name: a.name,
  jobTitle: a.descriptor,
  url: ctx.abs("/about/"),
  sameAs: [a.linkedin],
});

export const breadcrumbLD = (ctx, trail) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: ctx.abs(c.href) })),
});

function sources(item) {
  if (!item.sources?.length) return "";
  return `<section class="sources" aria-labelledby="sources-${item.slug}">
    <h2 class="sources__title" id="sources-${item.slug}">Sources referenced</h2>
    <ol class="sources__list">${item.sources
      .map((s) => {
        let host = "";
        try {
          host = new URL(s.url).hostname.replace(/^www\d?\./, "");
        } catch {}
        return `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.label)}</a> <span class="sources__host">${esc(host)}</span></li>`;
      })
      .join("")}</ol>
  </section>`;
}

export function articlePage(ctx, item) {
  const c = item.categoryObj;
  const trail = [
    { label: "Home", href: "/" },
    { label: "Ideas", href: "/ideas/" },
    { label: c.name, href: c.url },
    { label: item.title, href: item.url },
  ];
  const body = ctx.prose(item.body);
  // Migrated posts have no separate standfirst; don't repeat the opening line.
  const opening = plainText(item.body.replace(/<figure[\s\S]*?<\/figure>/g, "")).slice(0, 700);
  const showDek = !opening.includes(item.excerpt.replace(/…$/, "").slice(0, 60));
  const content = `<article class="article" data-article>
    <header class="article-hero dark">
      <div class="container container--narrow">
        <div class="article-hero__top" data-anim="blur-in" data-delay="100">
          ${btn({ href: ctx.u("/ideas/"), label: "Back to Ideas", back: true, variant: "dark" })}
          ${breadcrumbs(ctx, trail)}
        </div>
        <div class="article-hero__text" data-anim="blur-in" data-delay="150">
          <p class="article-hero__meta"><span class="muted">Published</span> <time datetime="${item.date}">${ctx.fmt(item.date)}</time>${
            item.updated ? `<span class="sep" aria-hidden="true"></span><span><span class="muted">Last updated</span> <time datetime="${item.updated}">${ctx.fmt(item.updated)}</time></span>` : ""
          }<span class="sep" aria-hidden="true"></span>${kicker(ctx, item)}</p>
          <h1 class="h1 article-hero__title">${esc(item.title)}</h1>
          ${showDek ? `<p class="article-hero__dek">${esc(item.excerpt)}</p>` : ""}
          <div class="article-hero__by">${byline(ctx, item)}<p class="article-hero__time">${icon("doc")}${item.minutes} min read</p></div>
        </div>
        <figure class="article-hero__cover" data-anim="blur-in" data-delay="250" aria-hidden="true">${cover(ctx, item, { loading: "eager", priority: true })}</figure>
      </div>
    </header>
    <div class="container container--read article-body">
      <div class="prose" data-anim="slide-up">${body}</div>
      ${sources(item)}
      <div class="article-end">
        ${tagList(ctx, item)}
        ${share(ctx, item, { label: "Share this article" })}
        <p class="article-end__dates">First published <time datetime="${item.date}">${ctx.fmt(item.date)}</time>${item.updated ? ` · Last updated <time datetime="${item.updated}">${ctx.fmt(item.updated)}</time>` : ""}</p>
      </div>
      ${authorBox(ctx, item.authorObj)}
    </div>
    <div class="container container--narrow article-conversation">${conversationBlock(ctx, { item, compact: true })}</div>
    <div class="container container--read">${responses(ctx, item)}</div>
  </article>
  ${related(ctx, item)}`;

  return {
    path: item.url,
    title: item.seo?.title || item.title,
    description: item.seo?.description || ctx.clip(item.excerpt, 158),
    bodyClass: `page-article theme-${c.slug}`,
    ogType: "article",
    ogImage: ctx.ogImage(item),
    article: { published: item.date, modified: item.updated, section: c.name, tags: item.tagObjs.map((t) => t.name) },
    jsonld: [
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: item.title,
        description: item.excerpt,
        datePublished: item.date,
        dateModified: item.updated || item.date,
        author: personLD(ctx, item.authorObj),
        publisher: personLD(ctx, item.authorObj),
        mainEntityOfPage: ctx.abs(item.url),
        image: ctx.abs(ctx.ogImage(item)),
        articleSection: c.name,
        keywords: item.tagObjs.map((t) => t.name).join(", "),
        wordCount: item.words,
        inLanguage: ctx.data.site.locale,
      },
      breadcrumbLD(ctx, trail),
    ],
    content,
  };
}
