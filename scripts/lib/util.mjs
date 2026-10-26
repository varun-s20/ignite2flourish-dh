// Small, dependency-free helpers shared by the build and the templates.

const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escape text for HTML content and attribute values. */
export const esc = (value = "") => String(value ?? "").replace(/[&<>"']/g, (c) => ENTITIES[c]);

const DECODE = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };

/** Plain text from an HTML fragment (for excerpts, search and word counts). */
export const plainText = (html = "") =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => DECODE[m])
    .replace(/\s+/g, " ")
    .trim();

export const wordCount = (html) => (plainText(html).match(/\S+/g) || []).length;

/** Minutes to read at a comfortable 230 words per minute. */
export const readingTime = (words) => Math.max(1, Math.round(words / 230));

const DATE_FMT = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const DATE_SHORT = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const toDate = (iso) => new Date(`${iso}T00:00:00Z`);
export const formatDate = (iso) => (iso ? DATE_FMT.format(toDate(iso)) : "");
export const formatDateShort = (iso) => (iso ? DATE_SHORT.format(toDate(iso)) : "");
export const rfc822 = (iso) => toDate(iso).toUTCString();

/**
 * Light inline markup for short copy stored in JSON: *text* becomes <em>.
 * Everything else is escaped.
 */
export const inline = (text = "") => esc(text).replace(/\*(.+?)\*/g, "<em>$1</em>");

/** Join class names, skipping falsy values. */
export const cx = (...names) => names.flat().filter(Boolean).join(" ");

/** Render attributes from an object; `true` renders a bare attribute. */
export const attrs = (obj = {}) =>
  Object.entries(obj)
    .filter(([, v]) => v !== false && v !== null && v !== undefined)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`))
    .join("");

/** Stable 32-bit hash for seeding generative artwork. */
export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: tiny deterministic PRNG so artwork is identical on every build. */
export function rng(seed) {
  let a = typeof seed === "string" ? hash(seed) : seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Wrap each word of a short heading so it can be revealed word by word. */
export const splitWords = (htmlText) => {
  let i = 0;
  return htmlText
    .split(/(<em>.*?<\/em>|\s+)/)
    .filter((part) => part && !/^\s+$/.test(part))
    .map((part) => {
      const em = part.match(/^<em>(.*?)<\/em>$/);
      const words = em ? em[1].split(/\s+/) : [part];
      return words
        .map((w) => `<span class="w"><span style="--i:${i++}">${em ? `<em>${w}</em>` : w}</span></span>`)
        .join(" ");
    })
    .join(" ");
};
