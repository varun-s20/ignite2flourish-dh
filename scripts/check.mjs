#!/usr/bin/env node
// Static quality checks over dist/ (run after a build):  npm run check
//
//   • every internal href/src resolves to a file in dist/ (and #anchors exist)
//   • exactly one <h1>, a unique <title> and meta description per page
//   • every <img> has an alt attribute; ids are unique; <html lang> is set
//   • canonical + og:image present; JSON-LD parses
//   • redirect targets exist
//
// Exits 1 if anything fails. External links are listed, not fetched.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DIST = join(ROOT, "dist");
const site = JSON.parse(readFileSync(join(ROOT, "content", "site.json"), "utf8"));
const base = site.basePath || "";

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const pages = walk(DIST).filter((f) => f.endsWith(".html"));
const errors = [];
const warnings = [];
const titles = new Map();
const descriptions = new Map();
const external = new Set();
const idCache = new Map();

const urlOf = (file) => {
  const rel = "/" + relative(DIST, file).split(sep).join("/");
  return rel.endsWith("/index.html") ? rel.slice(0, -"index.html".length) : rel;
};

const idsIn = (file) => {
  if (!idCache.has(file)) {
    const html = readFileSync(file, "utf8");
    idCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idCache.get(file);
};

function resolveTarget(path) {
  let p = path;
  if (base && p.startsWith(base)) p = p.slice(base.length) || "/";
  const full = join(DIST, decodeURIComponent(p));
  if (existsSync(full) && statSync(full).isFile()) return full;
  if (existsSync(join(full, "index.html"))) return join(full, "index.html");
  return null;
}

const redirects = JSON.parse(readFileSync(join(ROOT, "content", "redirects.json"), "utf8")).rules;
const redirectFrom = new Set(redirects.map((r) => r.from));

for (const file of pages) {
  const url = urlOf(file);
  const html = readFileSync(file, "utf8");
  const where = (msg) => `${url}: ${msg}`;

  if (!/<html lang="[a-z-]+/i.test(html)) errors.push(where("missing <html lang>"));
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) errors.push(where(`expected 1 <h1>, found ${h1}`));

  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  if (!title) errors.push(where("missing <title>"));
  else titles.set(title, [...(titles.get(title) || []), url]);
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (!desc) errors.push(where("missing meta description"));
  else {
    descriptions.set(desc, [...(descriptions.get(desc) || []), url]);
    if (desc.length > 170) warnings.push(where(`meta description is ${desc.length} chars`));
  }
  if (!/<link rel="canonical" href="https?:\/\//.test(html)) errors.push(where("missing canonical"));
  const og = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1];
  if (!og) errors.push(where("missing og:image"));
  else if (og.startsWith(site.url) && !resolveTarget(og.slice(site.url.length))) errors.push(where(`og:image file missing: ${og}`));

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch {
      errors.push(where("invalid JSON-LD"));
    }
  }

  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt="/.test(m[0])) errors.push(where(`<img> without alt: ${m[0].slice(0, 80)}`));
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) errors.push(where(`duplicate ids: ${[...new Set(dupes)].join(", ")}`));

  // strip inline scripts/JSON so their contents are not read as markup
  const markup = html.replace(/<script[\s\S]*?<\/script>/g, "");
  for (const m of markup.matchAll(/\s(?:href|src|srcset)="([^"]+)"/g)) {
    const values = m[0].includes("srcset") ? m[1].split(",").map((s) => s.trim().split(/\s+/)[0]) : [m[1]];
    for (let v of values) {
      v = v.replace(/&amp;/g, "&");
      if (/^(mailto:|tel:|data:|javascript:)/.test(v)) continue;
      if (/^https?:\/\//.test(v)) {
        if (!v.startsWith(site.url)) external.add(v);
        continue;
      }
      if (v.startsWith("#")) {
        if (v.length > 1 && !ids.includes(v.slice(1))) errors.push(where(`anchor ${v} not found on page`));
        continue;
      }
      if (!v.startsWith("/")) {
        warnings.push(where(`relative URL ${v}`));
        continue;
      }
      const [pathAndQuery, hash] = v.split("#");
      const path = pathAndQuery.split("?")[0];
      if (redirectFrom.has(path)) {
        warnings.push(where(`links to a redirected URL ${path}`));
        continue;
      }
      const target = resolveTarget(path);
      if (!target) errors.push(where(`broken link ${v}`));
      else if (hash && target.endsWith(".html") && !idsIn(target).has(hash)) errors.push(where(`anchor #${hash} not found in ${path}`));
    }
  }
}

for (const [t, urls] of titles) if (urls.length > 1) errors.push(`duplicate <title> "${t}": ${urls.join(", ")}`);
for (const [d, urls] of descriptions) if (urls.length > 1) warnings.push(`duplicate description on ${urls.join(", ")}`);
for (const r of redirects) {
  const target = r.to.split("#")[0];
  if (!resolveTarget(target)) errors.push(`redirect ${r.from} → ${r.to}: target missing`);
}

console.log(`Checked ${pages.length} pages, ${external.size} unique external links (not fetched).`);
if (warnings.length) console.log(`\nWarnings (${warnings.length}):\n` + warnings.map((w) => `  · ${w}`).join("\n"));
if (errors.length) {
  console.log(`\nErrors (${errors.length}):\n` + errors.map((e) => `  ✗ ${e}`).join("\n"));
  process.exit(1);
}
console.log("\nAll checks passed.");
if (process.argv.includes("--external")) console.log("\nExternal links:\n" + [...external].sort().map((u) => `  ${u}`).join("\n"));
