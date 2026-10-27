// About, Continue the Conversation, legal, search and 404
// (WordPress: page-about.php, page-contact.php, page.php, search.php, 404.php).

import { esc, inline, plainText } from "../../scripts/lib/util.mjs";
import {
  btn,
  conversationBlock,
  draft,
  faq,
  icon,
  linkedinIcon,
  NUMBER_ART,
  numCards,
  odometer,
  picture,
  roll,
  sectionHead,
  submitButton,
  tag,
  themeCards,
  topicCover,
} from "../components.mjs";
import { breadcrumbLD, personLD } from "./article.mjs";

const paragraphs = (html = "") => [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => plainText(m[1]));

/* ----------------------------------------------------------------- about */

export function aboutPage(ctx) {
  const p = ctx.data.pages.about;
  const a = ctx.data.authors[ctx.data.site.defaultAuthor];
  const background = paragraphs(p.parts.background);
  const motivation = paragraphs(p.parts.motivation);
  const note = draft(p.draft, "Adapted from the current About page, to be replaced by the client’s supplied copy");
  const EXPERTISE_ICONS = ["people", "chat", "pen", "flame"];

  const content = `<section class="page-hero page-hero--about dark" aria-labelledby="about-title">
    <svg class="hero__rings" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><circle cx="1100" cy="700" r="720"/><circle cx="300" cy="1000" r="900"/></svg>
    <div class="container page-hero__grid">
      <div class="about-hero__text"${note}>
        ${tag(esc(a.descriptor), { cls: "tag--dark", iconName: "star", raw: true }).replace('<p class="', '<p data-anim="blur-in" data-delay="100" class="')}
        <h1 class="display" id="about-title" data-anim="blur-in" data-delay="100">${esc(a.name)}</h1>
        <p class="page-hero__intro" data-anim="blur-in" data-delay="150">${esc(p.lede)}</p>
        <div class="hero__actions" data-anim="blur-in" data-delay="200">
          ${btn({ href: ctx.u("/contact/"), label: "Continue the conversation" })}
          <a class="btn btn--ghost" href="${esc(a.linkedin)}" target="_blank" rel="noopener me">${roll("LinkedIn")}<span class="visually-hidden"> (opens in a new tab)</span></a>
        </div>
      </div>
      <div class="about-gallery">
        <div class="about-gallery__a media" data-anim="blur-in" data-delay="100">${picture(ctx, "about-wide", { alt: "Sanzid Ahmed in a navy suit, smiling", sizes: "(min-width: 992px) 290px, 45vw", priority: true })}</div>
        <div class="about-gallery__b badge-card" data-anim="blur-in" data-delay="200">
          ${NUMBER_ART.years}
          <p class="badge-card__value">${odometer("22")}</p>
          <p class="badge-card__label">years in HR &amp; people leadership</p>
        </div>
        <div class="about-gallery__c media" data-anim="blur-in" data-delay="300">${picture(ctx, "about-tall", { alt: "Sanzid Ahmed in a grey blazer, leaning against a white wall", sizes: "(min-width: 992px) 290px, 45vw", priority: true })}</div>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="bg-title">
    <div class="container">
      <div class="split-head"${note}>
        <h2 class="h2" id="bg-title" data-anim="slide-up">Background</h2>
        <div class="split-head__body">
          <p class="split-head__lead" data-anim="slide-up">${esc(background[0] || "")}</p>
          ${background
            .slice(1)
            .map((t) => `<p class="split-head__text" data-anim="slide-up">${esc(t)}</p>`)
            .join("")}
        </div>
      </div>
      ${numCards(ctx, (p.stats || []).slice(0, 3))}
    </div>
  </section>

  <section class="split split--flip" aria-labelledby="why-i2f-title">
    <div class="split__media">${picture(ctx, "about-statement", { alt: "Sanzid Ahmed, arms folded, in a blue blazer", sizes: "(min-width: 900px) 50vw, 100vw", cls: "picture--top" })}</div>
    <div class="split__panel dark">
      <div class="split__inner"${note}>
        <h2 class="split__title" id="why-i2f-title" data-anim="slide-up">A place to think out loud</h2>
        ${motivation.map((t) => `<p data-anim="slide-up">${esc(t)}</p>`).join("")}
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="philosophy-title">
    <div class="container">
      <div class="split-head">
        <h2 class="h2" id="philosophy-title" data-anim="slide-up">Philosophy</h2>
        <figure class="split-head__body quote">
          <blockquote><p class="why__statement" data-reveal-chars>${esc(p.philosophy.quote)}</p></blockquote>
          <figcaption data-anim="slide-up">${esc(p.philosophy.attribution)}</figcaption>
          <p class="split-head__text" data-anim="slide-up"${note}>${esc(p.philosophy.text)}</p>
        </figure>
      </div>
    </div>
  </section>

  <section class="section section--soft" aria-labelledby="writes-title">
    <div class="container">
      ${sectionHead({ tagText: "Topics", tagCls: "tag--white", title: "Topics I write about", id: "writes-title" })}
      ${themeCards(ctx)}
    </div>
  </section>

  <section class="section" aria-labelledby="expertise-title">
    <div class="container">
      ${sectionHead({ tagText: "Expertise", title: "Areas of expertise", id: "expertise-title" })}
      <ul class="principles">${(p.expertise || [])
        .map(
          (e, i) => `<li class="principle" data-anim="slide-up" data-delay="${200 + (i % 2) * 100}">
          <span class="icon-tile">${icon(EXPERTISE_ICONS[i % EXPERTISE_ICONS.length])}</span>
          <h3 class="title1">${esc(e.title)}</h3>
          <p>${esc(e.text)}</p>
        </li>`,
        )
        .join("")}</ul>
    </div>
  </section>

  <section class="section journey" aria-labelledby="cred-title" data-journey>
    <div class="container journey__grid">
      <div class="journey__head">
        <h2 class="h2" id="cred-title" data-anim="slide-up">Education &amp; training</h2>
      </div>
      <div class="journey__wrap" data-anim="slide-up" data-delay="300">
        <span class="journey__line" aria-hidden="true"><span class="journey__fill" data-journey-fill></span></span>
        <ol class="journey__list">${(p.credentials || [])
          .map(
            (c, i) => `<li class="journey__item" data-journey-item>
            <span class="journey__dot" aria-hidden="true"></span>
            <p class="journey__num">${String(i + 1).padStart(2, "0")}</p>
            <p class="journey__text">${esc(c)}</p>
          </li>`,
          )
          .join("")}</ol>
      </div>
    </div>
  </section>

  <div class="section"><div class="container">${conversationBlock(ctx)}</div></div>`;

  return {
    path: "/about/",
    title: p.title,
    description: p.description,
    bodyClass: "page-about",
    ogType: "profile",
    jsonld: [
      { "@context": "https://schema.org", "@type": "ProfilePage", mainEntity: { ...personLD(ctx, a), description: p.description } },
    ],
    content,
  };
}

/* ---------------------------------------------------------------- contact */

export function contactPage(ctx) {
  const p = ctx.data.pages.contact;
  const endpoint = ctx.data.site.forms.contact.endpoint;
  const a = ctx.data.authors[ctx.data.site.defaultAuthor];
  const name = "cutout-contact";
  const set = [480, 760, 1100].map((w) => `${ctx.u(`/assets/images/${name}-${w}.webp`)} ${w}w`).join(", ");
  const sizes = "(min-width: 900px) min(30vw, 46vh), 70vw";
  // First screen after gravity-design.de's contact: the question under a
  // dark dome, a flame disc bridging it to a large arch (the mark's ring),
  // and Sanzid standing in the arch. The disc leads to the form.
  const content = `<section class="cstage" aria-labelledby="contact-title" data-cstage>
    <div class="cstage__dome dark">
      <div class="container cstage__head">
        <h1 class="display contact-hero__title cstage__title" id="contact-title" data-anim="blur-in" data-delay="150">${inline(p.headline)}</h1>
        <div class="cstage__intro" data-anim="blur-in" data-delay="250"${draft(p.draft)}>${ctx.prose(p.body)}</div>
      </div>
      <svg class="cstage__curve" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0,0 H1000 Q500,200 0,0 Z"/></svg>
    </div>
    <div class="cstage__ground">
      <div class="cstage__arch" aria-hidden="true"></div>
      <picture class="cstage__figure">
        <source type="image/webp" srcset="${set}" sizes="${sizes}">
        <img src="${ctx.u(`/assets/images/${name}-760.png`)}" sizes="${sizes}" width="1100" height="2046" alt="Sanzid Ahmed, arms folded, smiling" loading="eager" fetchpriority="high">
      </picture>
      <a class="cstage__cta" href="#write"><span class="cstage__cta-text">Let’s<strong>talk</strong></span></a>
    </div>
  </section>

  <section class="section cwrite" id="write" aria-labelledby="write-title">
    <div class="container cwrite__grid">
      <div class="cwrite__aside">
        <h2 class="h2 cwrite__title" id="write-title" data-anim="slide-up">What brings you here?</h2>
        <p class="cwrite__lead" data-anim="slide-up">Pick one and the subject fills itself in.</p>
        <ul class="reasons" data-anim="slide-up">${p.reasons
          .map(
            (r, i) => `<li><a class="reason" href="#c-message" data-pick-subject="${esc(p.subjects[i] || r.title)}">
            <span class="reason__num mono">${String(i + 1).padStart(2, "0")}</span>
            <span class="reason__body"><span class="reason__title">${esc(r.title)}</span><span class="reason__text">${esc(r.text)}</span></span>
            <span class="reason__go" aria-hidden="true">${icon("arrow")}</span>
          </a></li>`,
          )
          .join("")}</ul>
        <a class="cwrite__alt" href="${esc(a.linkedin)}" target="_blank" rel="noopener" data-anim="slide-up">${linkedinIcon()}<span>Prefer LinkedIn? Connect with Sanzid</span><span class="visually-hidden"> (opens in a new tab)</span></a>
      </div>

      <div class="form-card dark" data-anim="slide-up">
        <p class="form-card__lead">${esc(p.privateNote)}</p>
        ${endpoint ? "" : `<p class="notice notice--preview" role="note"><strong>Preview build.</strong> This form validates your message but is not yet connected to email, so nothing is sent. In the live site, messages are emailed to Sanzid and stored securely.</p>`}
        <form class="form form--contact" data-form="contact" data-endpoint="${esc(endpoint)}" method="post"${endpoint ? ` action="${esc(endpoint)}"` : ""}>
          <div class="form__summary" data-error-summary tabindex="-1" hidden></div>
          <div class="form__grid">
            <div class="field" data-field>
              <label for="c-name">Full name <span class="field__req" aria-hidden="true">*</span></label>
              <input id="c-name" name="name" type="text" autocomplete="name" required maxlength="80" placeholder="Your name" aria-describedby="c-name-err">
              <p class="field__error" id="c-name-err" data-error></p>
            </div>
            <div class="field" data-field>
              <label for="c-email">Email <span class="field__req" aria-hidden="true">*</span></label>
              <input id="c-email" name="email" type="email" autocomplete="email" required maxlength="160" placeholder="name@example.com" aria-describedby="c-email-err">
              <p class="field__error" id="c-email-err" data-error></p>
            </div>
          </div>
          <div class="field" data-field>
            <label for="c-org">Organisation <span class="field__hint">(optional)</span></label>
            <input id="c-org" name="organisation" type="text" autocomplete="organization" maxlength="120" placeholder="Where you work, if relevant">
          </div>
          <div class="field" data-field>
            <label for="c-subject">Subject <span class="field__req" aria-hidden="true">*</span></label>
            <input id="c-subject" name="subject" type="text" required maxlength="140" placeholder="What would you like to talk about?" aria-describedby="c-subject-hint c-subject-err">
            <div class="subject-chips" id="c-subject-hint" hidden data-subject-chips>
              <span class="subject-chips__label">Quick pick:</span>
              ${p.subjects.map((s) => `<button type="button" class="chip chip--button" data-subject="${esc(s)}" aria-pressed="false">${esc(s)}</button>`).join("")}
            </div>
            <p class="field__error" id="c-subject-err" data-error></p>
          </div>
          <div class="field" data-field>
            <label for="c-message">Message <span class="field__req" aria-hidden="true">*</span></label>
            <textarea id="c-message" name="message" rows="7" required minlength="20" maxlength="4000" placeholder="Share your thoughts here…" aria-describedby="c-message-err c-message-count" data-count></textarea>
            <p class="field__meta"><span class="field__error" id="c-message-err" data-error></span><span class="field__count" id="c-message-count" data-counter aria-live="polite"></span></p>
          </div>
          <div class="hp" aria-hidden="true"><label for="c-website">Website</label><input id="c-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
          <p class="form__consent">Your details are used only to reply to you. See the <a href="${ctx.u("/privacy/")}">privacy policy</a>.</p>
          <noscript><p class="notice">This form needs JavaScript. You can also reach Sanzid on <a href="${esc(a.linkedin)}">LinkedIn</a>.</p></noscript>
          <div class="form__actions">${submitButton("Send message", "sun", "btn--block")}</div>
          <div class="form__result" data-result tabindex="-1" hidden></div>
        </form>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="contact-faq-title">
    <div class="container">
      ${sectionHead({ tagText: "Good to know", title: "Before you write", id: "contact-faq-title" })}
      ${faq([
        { q: "Is my message private?", a: `<p>${esc(p.privateNote)}</p>` },
        {
          q: "Can I respond to an article publicly?",
          a: `<p>Yes. Each article has a Responses section; public responses are moderated and appear once approved. Use this form for anything you would rather keep private.</p><a class="link-arrow" href="${ctx.u("/ideas/")}">Browse the ideas${icon("arrow")}</a>`,
        },
        {
          q: "What kinds of conversation are welcome?",
          a: `<p>${p.reasons.map((r) => esc(r.title)).join(", ")}. Disagreement is welcome. Some of the best ideas start as objections.</p>`,
        },
        {
          q: "Can I suggest a book or research paper?",
          a: `<p>Please do. Say what it is and why it matters for leadership, careers or flourishing at work.</p><a class="link-arrow" href="${ctx.u("/books-research/")}">See books &amp; research${icon("arrow")}</a>`,
        },
      ])}
    </div>
  </section>`;

  return {
    path: "/contact/",
    title: p.title,
    description: p.description,
    bodyClass: "page-contact",
    jsonld: [{ "@context": "https://schema.org", "@type": "ContactPage", name: p.title, url: ctx.abs("/contact/") }],
    content,
  };
}

/* ------------------------------------------------------------------ legal */

export function legalPage(ctx, slug) {
  const p = ctx.data.pages[slug];
  const body = ctx.prose(p.body);
  const tocItems = [...body.matchAll(/<h2 id="([^"]+)">(.*?)<\/h2>/g)].map((m) => ({ id: m[1], label: m[2].replace(/<[^>]+>/g, "") }));
  const trail = [
    { label: "Home", href: "/" },
    { label: p.title, href: `/${slug}/` },
  ];
  return {
    path: `/${slug}/`,
    title: p.title,
    description: p.description,
    bodyClass: "page-legal",
    jsonld: [breadcrumbLD(ctx, trail)],
    content: `<section class="page-hero page-hero--compact dark">
      <div class="container container--narrow">
        <div class="page-hero__head">
          <h1 class="display" data-anim="blur-in" data-delay="100">${esc(p.title)}</h1>
          ${p.notice ? `<div class="notice notice--review" role="note" data-anim="blur-in" data-delay="200"><p><strong>Before launch:</strong> ${esc(p.notice)}</p></div>` : ""}
        </div>
      </div>
    </section>
    <div class="section">
      <div class="container container--narrow legal">
        ${tocItems.length > 3 ? `<nav class="toc legal__toc" aria-label="On this page"><p class="label">On this page</p><ol>${tocItems.map((t) => `<li><a href="#${t.id}">${t.label}</a></li>`).join("")}</ol></nav>` : ""}
        <div class="prose prose--legal">${body}</div>
      </div>
    </div>`,
  };
}

/* ----------------------------------------------------------------- search */

export function searchPage(ctx) {
  const { categories, tags } = ctx.data;
  const popular = [...tags].sort((a, b) => b.items.length - a.items.length).slice(0, 8);
  return {
    path: "/search/",
    title: "Search",
    description: "Search articles, book reviews and research reviews on Ignite2Flourish.",
    bodyClass: "page-search",
    noindex: true,
    content: `<section class="page-hero page-hero--compact dark">
      <div class="container container--narrow">
        <div class="page-hero__head">
          <h1 class="display" data-anim="blur-in" data-delay="100">Find an idea</h1>
        </div>
        <form class="search-page__form" action="${ctx.u("/search/")}" method="get" role="search" data-search-page data-anim="blur-in" data-delay="200">
          <label class="visually-hidden" for="search-page-q">Search ideas, books and research</label>
          ${icon("search", "search-page__icon")}
          <input class="search-page__input" id="search-page-q" name="q" type="search" placeholder="Try “resilience” or “recruitment”" autocomplete="off" spellcheck="false">
          ${submitButton("Search").replace(" data-submit", "")}
        </form>
        <div class="search-page__filters" role="group" aria-label="Filter results" data-search-filters hidden>
          ${[
            ["all", "Everything"],
            ["article", "Articles"],
            ["book-review", "Books"],
            ["research-review", "Research"],
          ]
            .map(([v, l], i) => `<button type="button" class="chip chip--button" data-type="${v}" aria-pressed="${i === 0}">${l}<span class="chip__count" data-type-count="${v}"></span></button>`)
            .join("")}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container container--narrow search-page" aria-label="Results">
        <p class="search-page__status" data-search-page-status aria-live="polite"></p>
        <ol class="search-page__results search-results" data-search-page-results></ol>
        <noscript><p class="notice">Search needs JavaScript. You can browse <a href="${ctx.u("/ideas/")}">all ideas</a> or <a href="${ctx.u("/books-research/")}">books &amp; research</a> instead.</p></noscript>
        <div class="search-page__suggest" data-search-page-suggest>
          <div>
            <p class="label">Browse a theme</p>
            <ul class="chip-list">${categories.map((c) => `<li><a class="chip chip--link" href="${ctx.u(c.url)}"><span class="topic-dot topic-dot--${c.slug}" aria-hidden="true"></span>${esc(c.name)}</a></li>`).join("")}</ul>
          </div>
          <div>
            <p class="label">Popular topics</p>
            <ul class="chip-list">${popular.map((t) => `<li><a class="chip chip--link" href="${ctx.u(t.url)}">${esc(t.name)}</a></li>`).join("")}</ul>
          </div>
        </div>
      </div>
    </section>`,
  };
}

/* -------------------------------------------------------------------- 404 */

export function notFoundPage(ctx) {
  const { categories } = ctx.data;
  return {
    path: "/404.html",
    title: "Page not found",
    description: "The page you were looking for could not be found.",
    bodyClass: "page-404",
    noindex: true,
    content: `<section class="page-hero not-found dark">
      <svg class="hero__rings" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><circle cx="1100" cy="700" r="720"/><circle cx="300" cy="1000" r="900"/></svg>
      <div class="container not-found__grid">
        <div class="not-found__text">
          <p class="tag tag--dark" data-anim="blur-in" data-delay="100">Error 404</p>
          <h1 class="display" data-anim="blur-in" data-delay="100">This page has wandered off.</h1>
          <p class="page-hero__intro" data-anim="blur-in" data-delay="150">It may have moved when Ignite2Flourish was redesigned, or the link may be mistyped. Try a search, or pick up one of the threads below.</p>
          <form class="search-page__form" action="${ctx.u("/search/")}" method="get" role="search" data-anim="blur-in" data-delay="200">
            <label class="visually-hidden" for="nf-q">Search ideas, books and research</label>
            ${icon("search", "search-page__icon")}
            <input class="search-page__input" id="nf-q" name="q" type="search" placeholder="Search the site" autocomplete="off">
            ${submitButton("Search").replace(" data-submit", "")}
          </form>
          <ul class="not-found__links" data-anim="blur-in" data-delay="250">
            <li><a class="link-arrow" href="${ctx.u("/")}">Home${icon("arrow")}</a></li>
            <li><a class="link-arrow" href="${ctx.u("/ideas/")}">All ideas${icon("arrow")}</a></li>
            ${categories.map((c) => `<li><a class="link-arrow" href="${ctx.u(c.url)}">${esc(c.name)}${icon("arrow")}</a></li>`).join("")}
            <li><a class="link-arrow" href="${ctx.u("/books-research/")}">Books &amp; Research${icon("arrow")}</a></li>
          </ul>
        </div>
        <div class="not-found__art media" data-anim="blur-in" data-delay="300" aria-hidden="true">${topicCover(ctx, categories.find((c) => c.motif === "path") || categories[0], { loading: "eager" })}</div>
      </div>
    </section>`,
  };
}
