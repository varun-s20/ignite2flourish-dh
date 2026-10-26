#!/usr/bin/env node
// Lighthouse (the engine behind PageSpeed Insights) against the local preview.
//
//   npm run serve          # in another terminal
//   CHROME_PATH=/path/to/chrome node qa/lighthouse.mjs [--desktop]
//
// Mobile uses Lighthouse's default simulated throttling (slow 4G, mid-range
// phone), the same profile PageSpeed Insights reports. Local numbers are a
// guide: a production host, CDN and real network will differ.

import { mkdirSync, writeFileSync } from "node:fs";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";

const BASE = process.env.BASE || "http://localhost:4173";
const PAGES = [
  "/",
  "/ideas/",
  "/rethinking-recruitment-moving-beyond-experience-bias/",
  "/books-research/",
  "/books-research/psychological-safety-and-learning-behavior-in-work-teams/",
  "/about/",
  "/contact/",
];
const desktop = process.argv.includes("--desktop");
const out = new URL(`./report/lighthouse-${desktop ? "desktop" : "mobile"}/`, import.meta.url);
mkdirSync(out, { recursive: true });

const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new", "--no-sandbox"] });
const rows = [];
try {
  for (const path of PAGES) {
    const result = await lighthouse(
      BASE + path,
      { port: chrome.port, output: "html", logLevel: "error", onlyCategories: ["performance", "accessibility", "best-practices", "seo"] },
      desktop ? desktopConfig : undefined,
    );
    const { categories: c, audits: a } = result.lhr;
    const pct = (k) => Math.round(c[k].score * 100);
    rows.push({
      page: path,
      perf: pct("performance"),
      a11y: pct("accessibility"),
      bp: pct("best-practices"),
      seo: pct("seo"),
      LCP: a["largest-contentful-paint"].displayValue,
      CLS: a["cumulative-layout-shift"].displayValue,
      TBT: a["total-blocking-time"].displayValue,
      FCP: a["first-contentful-paint"].displayValue,
    });
    const name = path === "/" ? "home" : path.replace(/^\/|\/$/g, "").replace(/\//g, "_");
    writeFileSync(new URL(`${name}.html`, out), result.report);
  }
} finally {
  await chrome.kill();
}
console.log(`\nLighthouse ${desktop ? "desktop" : "mobile"} — ${BASE}`);
console.table(rows);
writeFileSync(new URL("summary.json", out), JSON.stringify(rows, null, 2));
