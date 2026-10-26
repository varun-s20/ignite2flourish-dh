#!/usr/bin/env node
// Local preview server for dist/.
//
//   node scripts/serve.mjs            serve the last build on http://localhost:4173
//   node scripts/serve.mjs --watch    rebuild when content/, src/ or templates/ change
//   PORT=8080 node scripts/serve.mjs
//
// Behaves like a typical static host: clean URLs (/ideas/ → ideas/index.html),
// 301s from content/redirects.json, and dist/404.html with a real 404 status.

import { createReadStream, existsSync, readFileSync, statSync, watch } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { createGzip } from "node:zlib";

import { build, DIST, ROOT } from "./build.mjs";

const PORT = Number(process.env.PORT) || 4173;
const WATCH = process.argv.includes("--watch");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};

const redirects = () => {
  try {
    return JSON.parse(readFileSync(join(ROOT, "content", "redirects.json"), "utf8")).rules;
  } catch {
    return [];
  }
};

function resolveFile(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, "");
  const full = resolve(DIST, clean);
  if (full !== DIST && !full.startsWith(DIST + sep)) return null; // no path traversal
  if (existsSync(full) && statSync(full).isFile()) return full;
  if (existsSync(join(full, "index.html"))) return join(full, "index.html");
  return null;
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let path = url.pathname;

  const rule = redirects().find((r) => r.from === path || r.from === `${path}/`);
  if (rule) {
    res.writeHead(301, { Location: rule.to });
    return res.end();
  }
  // /ideas → /ideas/ like most static hosts
  if (!extname(path) && !path.endsWith("/") && existsSync(join(DIST, path, "index.html"))) {
    res.writeHead(301, { Location: `${path}/${url.search}` });
    return res.end();
  }

  const file = resolveFile(path);
  const status = file ? 200 : 404;
  const target = file || join(DIST, "404.html");
  const type = TYPES[extname(target)] || "application/octet-stream";
  const cache = /\.(woff2|png|jpg|webp|svg|ico)$/.test(target) ? "public, max-age=3600" : "no-cache";
  // compress text like any production static host would
  const gzip = /\.(html|css|js|json|xml|svg|txt|webmanifest)$/.test(target) && /\bgzip\b/.test(req.headers["accept-encoding"] || "");
  const headers = { "Content-Type": type, "Cache-Control": cache, "X-Content-Type-Options": "nosniff", Vary: "Accept-Encoding" };
  if (gzip) headers["Content-Encoding"] = "gzip";
  res.writeHead(status, headers);
  if (req.method === "HEAD") return res.end();
  const stream = createReadStream(target);
  if (gzip) stream.pipe(createGzip()).pipe(res);
  else stream.pipe(res);
  if (process.env.LOG) console.log(status, path);
});

if (!existsSync(join(DIST, "index.html")) || WATCH) build();

server.listen(PORT, () => {
  console.log(`Ignite2Flourish preview → http://localhost:${PORT}/${WATCH ? "  (watching for changes)" : ""}`);
});

if (WATCH) {
  let timer;
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        build();
      } catch (err) {
        console.error(`Build failed: ${err.message}`);
      }
    }, 120);
  };
  for (const dir of ["content", "src", "templates"]) watch(join(ROOT, dir), { recursive: true }, rebuild);
}
