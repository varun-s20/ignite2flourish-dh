// Loads everything in /content, validates it and derives the fields the
// templates need (URLs, reading time, related items, collections).

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { plainText, readingTime, wordCount } from "./util.mjs";

const readJSON = (path) => JSON.parse(readFileSync(path, "utf8"));

/** Files are `---\n{json}\n---\n<body html>`. */
export function readEntry(path) {
  const raw = readFileSync(path, "utf8").replace(/^﻿/, "");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`${path}: missing ---{json}--- front matter`);
  let meta;
  try {
    meta = JSON.parse(match[1]);
  } catch (err) {
    throw new Error(`${path}: front matter is not valid JSON (${err.message})`);
  }
  return { meta, body: match[2].trim() };
}

const readDir = (dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".html"))
    .sort()
    .map((f) => ({ file: join(dir, f), ...readEntry(join(dir, f)) }));

/** Pull `<section data-part="name">…</section>` blocks out of a review body. */
export function parts(body) {
  const out = {};
  for (const m of body.matchAll(/<section data-part="([\w-]+)">([\s\S]*?)<\/section>/g)) out[m[1]] = m[2].trim();
  return out;
}

export function loadContent(root) {
  const dir = join(root, "content");
  const site = readJSON(join(dir, "site.json"));
  const authors = readJSON(join(dir, "authors.json"));
  const taxonomy = readJSON(join(dir, "taxonomy.json"));
  const redirects = readJSON(join(dir, "redirects.json"));
  const errors = [];

  const categories = Object.entries(taxonomy.categories)
    .map(([slug, c]) => ({ slug, ...c, url: `/ideas/${slug}/` }))
    .sort((a, b) => a.order - b.order);
  const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
  const tagBySlug = Object.fromEntries(
    Object.entries(taxonomy.tags).map(([slug, name]) => [slug, { slug, name, url: `/tag/${slug}/` }]),
  );
  const reviewTypes = Object.entries(taxonomy.reviewTypes).map(([type, t]) => ({
    type,
    ...t,
    url: `/books-research/${t.slug}/`,
  }));

  const enrich = (entry, kind) => {
    const { meta, body, file } = entry;
    for (const key of ["id", "type", "title", "slug", "author", "date", "category", "excerpt"]) {
      if (meta[key] === undefined || meta[key] === "") errors.push(`${file}: missing "${key}"`);
    }
    if (!categoryBySlug[meta.category]) errors.push(`${file}: unknown category "${meta.category}"`);
    if (!authors[meta.author]) errors.push(`${file}: unknown author "${meta.author}"`);
    for (const t of meta.tags || []) if (!tagBySlug[t]) errors.push(`${file}: unknown tag "${t}" (add it to taxonomy.json)`);
    const words = wordCount(body);
    return {
      ...meta,
      kind,
      body,
      parts: kind === "review" ? parts(body) : null,
      url: kind === "article" ? `/${meta.slug}/` : `/books-research/${meta.slug}/`,
      categoryObj: categoryBySlug[meta.category],
      tagObjs: (meta.tags || []).map((t) => tagBySlug[t]).filter(Boolean),
      authorObj: { slug: meta.author, ...authors[meta.author] },
      words,
      minutes: readingTime(words),
      text: plainText(body),
      isPreview: meta.status === "preview",
    };
  };

  const byDateDesc = (a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title);
  const articles = readDir(join(dir, "articles")).map((e) => enrich(e, "article")).sort(byDateDesc);
  const reviews = readDir(join(dir, "reviews")).map((e) => enrich(e, "review")).sort(byDateDesc);
  const all = [...articles, ...reviews];

  const seen = new Map();
  for (const item of all) {
    if (seen.has(item.slug)) errors.push(`duplicate slug "${item.slug}"`);
    seen.set(item.slug, item);
  }
  const bySlug = (slug) => seen.get(slug);

  // Related: manual picks first, then score by shared category and tags.
  for (const item of all) {
    const manual = (item.related || []).map((s) => {
      const hit = bySlug(s);
      if (!hit) errors.push(`${item.slug}: related item "${s}" not found`);
      return hit;
    });
    const pool = (item.kind === "article" ? articles : all).filter((o) => o !== item && !manual.includes(o));
    const scored = pool
      .map((o) => ({
        o,
        score:
          (o.category === item.category ? 3 : 0) +
          2 * (o.tags || []).filter((t) => (item.tags || []).includes(t)).length +
          (o.isPreview ? -4 : 0),
      }))
      .sort((a, b) => b.score - a.score || byDateDesc(a.o, b.o));
    item.relatedItems = [...manual.filter(Boolean), ...scored.map((s) => s.o)].slice(0, 3);
  }

  const pages = Object.fromEntries(
    readDir(join(dir, "pages")).map(({ meta, body }) => [meta.slug, { ...meta, body, parts: parts(body) }]),
  );

  // Home curation references
  const home = site.home;
  const need = (slug, where) => {
    const hit = bySlug(slug);
    if (!hit) errors.push(`site.json ${where}: "${slug}" not found`);
    return hit;
  };
  const featured = need(home.featured, "home.featured");
  const startHere = home.startHere.items.map((s) => need(s, "home.startHere"));
  const exploring = home.exploring.items.map((x) => ({
    ...x,
    linkItems: x.links.map((s) => need(s, "home.exploring")).filter(Boolean),
  }));

  if (errors.length) {
    const msg = errors.map((e) => `  • ${e}`).join("\n");
    throw new Error(`Content problems:\n${msg}`);
  }

  for (const c of categories) c.items = articles.filter((a) => a.category === c.slug);
  for (const t of reviewTypes) t.items = reviews.filter((r) => r.type === t.type);
  const tags = Object.values(tagBySlug)
    .map((t) => ({ ...t, items: all.filter((i) => (i.tags || []).includes(t.slug)) }))
    .filter((t) => t.items.length);

  return {
    site,
    authors,
    categories,
    categoryBySlug,
    reviewTypes,
    tags,
    articles,
    reviews,
    all,
    pages,
    redirects,
    bySlug,
    home: { ...home, featuredItem: featured, startHereItems: startHere, exploringItems: exploring },
  };
}
