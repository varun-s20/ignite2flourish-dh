#!/usr/bin/env node
// Static build: content/ + templates/ + src/ → dist/
//
//   node scripts/build.mjs                 preview build (noindex, robots disallow)
//   SITE_ENV=production node scripts/build.mjs
//
// No dependencies. Output is plain HTML/CSS/JS that any static host can serve.

import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { coverSVG, coverPath, topicCoverPath } from "../templates/art.mjs";
import { layout } from "../templates/layout.mjs";
import { ideasPages, reviewPages, tagPages } from "../templates/pages/archive.mjs";
import { articlePage } from "../templates/pages/article.mjs";
import { homePage } from "../templates/pages/home.mjs";
import { reviewPage } from "../templates/pages/review.mjs";
import { aboutPage, contactPage, legalPage, notFoundPage, searchPage } from "../templates/pages/static.mjs";
import { loadContent } from "./lib/content.mjs";
import { esc, formatDate, rfc822 } from "./lib/util.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");

// Order matters: tokens first, motion last so its reduced-motion overrides win.
const CSS = ["tokens", "base", "layout", "components", "pages", "motion"];
const JS = ["core", "navigation", "motion", "search", "archive", "forms", "share"];

const write = (path, data) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
};
const shortHash = (s) => createHash("sha1").update(s).digest("hex").slice(0, 10);

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\s*([{};,])\s*/g, "$1")
    .replace(/\n+/g, " ")
    .replace(/;}/g, "}")
    .trim();
}

function slugifyHeading(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z#0-9]+;/g, "")
    .replace(/[’'"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function build({ env = process.env.SITE_ENV, quiet = false } = {}) {
  const started = Date.now();
  const data = loadContent(ROOT);
  const site = data.site;
  env = env || site.environment || "preview";

  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });

  // ---- static assets (untouched originals live in assets-source/, never published)
  cpSync(join(SRC, "assets"), join(DIST, "assets"), { recursive: true });

  // ---- CSS + JS bundles
  const css = CSS.map((n) => `/* ${n}.css */\n${readFileSync(join(SRC, "css", `${n}.css`), "utf8")}`).join("\n");
  const cssOut = minifyCSS(css);
  write(join(DIST, "css", "site.css"), cssOut);
  const js = JS.map((n) => `/* ---- ${n}.js ---- */\n${readFileSync(join(SRC, "js", `${n}.js`), "utf8")}`).join("\n");
  write(join(DIST, "js", "site.js"), `/*! Ignite2Flourish — site scripts */\n${js}`);
  const versions = { "/css/site.css": shortHash(cssOut), "/js/site.js": shortHash(js) };

  // ---- helpers handed to templates
  const base = site.basePath || "";
  const u = (path) => (/^(https?:|mailto:|#)/.test(path) ? path : `${base}${path}`);
  const ogDir = join(SRC, "assets", "og");
  const ctx = {
    data,
    env,
    year: new Date().getFullYear(),
    u,
    asset: (path) => `${u(path)}?v=${versions[path]}`,
    abs: (path) => `${site.url}${path === "/404.html" ? "/404" : path}`,
    fmt: formatDate,
    clip: (text, n) => (text.length <= n ? text : `${text.slice(0, n - 1).replace(/\s+\S*$/, "")}…`),
    ogImage: (item) => (existsSync(join(ogDir, `${item.slug}.jpg`)) ? `/assets/og/${item.slug}.jpg` : site.defaultOgImage),
    prose: (html) => {
      const used = new Set();
      let tables = 0;
      return html
        .replace(/href="\/(?!\/)/g, `href="${base}/`)
        .replace(/<a href="(https?:\/\/[^"]+)"(?![^>]*rel=)/g, '<a href="$1" class="ext" rel="noopener"')
        .replace(/<(h[23])>([\s\S]*?)<\/\1>/g, (m, tag, inner) => {
          let id = slugifyHeading(inner) || "section";
          while (used.has(id)) id += "-2";
          used.add(id);
          return `<${tag} id="${id}">${inner}</${tag}>`;
        })
        .replace(/<table>([\s\S]*?)<\/table>/g, (m, inner) => `<div class="table-wrap" tabindex="0" role="region" aria-label="Table ${++tables} (scrollable)"><table>${inner}</table></div>`);
    },
  };

  // ---- generative covers
  for (const c of data.categories) {
    const inTheme = data.all.filter((i) => i.category === c.slug);
    inTheme.forEach((item, i) => write(join(DIST, coverPath(item.slug)), coverSVG({ seed: item.slug, motif: c.motif, variant: i % 2 })));
  }
  for (const c of data.categories) {
    write(join(DIST, topicCoverPath(c.slug)), coverSVG({ seed: `topic-${c.slug}-v2`, motif: c.motif }));
  }

  // ---- pages
  const pages = [
    homePage(ctx),
    ...ideasPages(ctx),
    ...tagPages(ctx),
    ...reviewPages(ctx),
    ...data.articles.map((a) => articlePage(ctx, a)),
    ...data.reviews.map((r) => reviewPage(ctx, r)),
    aboutPage(ctx),
    contactPage(ctx),
    legalPage(ctx, "privacy"),
    legalPage(ctx, "disclaimer"),
    searchPage(ctx),
    notFoundPage(ctx),
  ];
  const seen = new Set();
  for (const page of pages) {
    if (seen.has(page.path)) throw new Error(`Two pages render to ${page.path}`);
    seen.add(page.path);
    const file = page.path.endsWith(".html") ? join(DIST, page.path) : join(DIST, page.path, "index.html");
    write(file, layout(ctx, page));
  }

  // ---- search index (loaded on demand by the search dialog and archives)
  const index = data.all.map((i) => ({
    id: i.id,
    type: i.type,
    title: i.title,
    url: u(i.url),
    category: i.categoryObj.name,
    tags: i.tagObjs.map((t) => t.name),
    excerpt: i.excerpt,
    date: i.isPreview ? null : i.date,
    by: i.book ? i.book.authors.join(", ") : i.paper ? `${i.paper.authors.join(", ")} · ${i.paper.journal}` : null,
    preview: i.isPreview || undefined,
    text: i.isPreview ? "" : i.text,
  }));
  write(join(DIST, "search-index.json"), JSON.stringify(index));

  // ---- feeds, sitemap, robots, manifest, redirects
  const indexable = pages.filter((p) => !p.noindex && p.path !== "/404.html");
  const lastmod = (p) => {
    const item = data.all.find((i) => i.url === p.path);
    return item ? item.updated || item.date : new Date().toISOString().slice(0, 10);
  };
  write(
    join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable
      .map((p) => `  <url><loc>${esc(ctx.abs(p.path))}</loc><lastmod>${lastmod(p)}</lastmod></url>`)
      .join("\n")}\n</urlset>\n`,
  );
  write(
    join(DIST, "robots.txt"),
    env === "production"
      ? `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`
      : `# Preview build — keep out of search engines until launch.\nUser-agent: *\nDisallow: /\n`,
  );
  const author = data.authors[site.defaultAuthor];
  write(
    join(DIST, "feed.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(site.name)}</title>
  <link>${site.url}/</link>
  <description>${esc(site.description)}</description>
  <language>${site.locale}</language>
  <atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>
${data.articles
  .map(
    (a) => `  <item>
    <title>${esc(a.title)}</title>
    <link>${site.url}${a.url}</link>
    <guid isPermaLink="true">${site.url}${a.url}</guid>
    <pubDate>${rfc822(a.date)}</pubDate>
    <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">${esc(author.name)}</dc:creator>
    <category>${esc(a.categoryObj.name)}</category>
    <description>${esc(a.excerpt)}</description>
  </item>`,
  )
  .join("\n")}
</channel>
</rss>
`,
  );
  write(
    join(DIST, "site.webmanifest"),
    JSON.stringify(
      {
        name: site.name,
        short_name: site.name,
        start_url: u("/"),
        display: "browser",
        background_color: "#FFFFFF",
        theme_color: "#3D1529",
        icons: [
          { src: u("/assets/icons/icon-192.png"), sizes: "192x192", type: "image/png" },
          { src: u("/assets/icons/icon-512.png"), sizes: "512x512", type: "image/png" },
        ],
      },
      null,
      2,
    ),
  );
  write(join(DIST, "_redirects"), data.redirects.rules.map((r) => `${r.from}  ${r.to}  301`).join("\n") + "\n");
  write(
    join(ROOT, "migration", "redirects.csv"),
    "source,target,code,reason\n" + data.redirects.rules.map((r) => `${r.from},${r.to},301,"${r.reason}"`).join("\n") + "\n",
  );

  const ms = Date.now() - started;
  if (!quiet) {
    console.log(
      `Built ${pages.length} pages (${data.articles.length} articles, ${data.reviews.length} reviews) in ${ms} ms → dist/  [${env}]`,
    );
  }
  return { pages: pages.length, ms };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    build({ env: process.argv.includes("--production") ? "production" : process.env.SITE_ENV });
  } catch (err) {
    console.error(`\nBuild failed: ${err.message}\n`);
    process.exit(1);
  }
}

export { DIST, ROOT };
