// Generative editorial artwork, in place of stock imagery. Each article gets
// a cover composed from its theme's motif, seeded by its slug so it is unique
// but never changes between builds. Colours are the style guide's palette.
// Output is a standalone SVG file referenced with <img>.
//
//   bloom      Flourishing        a sun rising over still water, rays and rings
//   structure  Work & Leadership  a colonnade of arches, one lit from within
//   path       Career & Life      a ribbon of lines travelling to a destination

import { rng } from "../scripts/lib/util.mjs";

const W = 1200;
const H = 800;

const C = {
  ember: "#E34C20",
  flame: "#F6A21C",
  sun: "#FFD900",
  navy: "#193046",
  plum: "#63324A",
  plumDeep: "#3D1529",
  night: "#2A0D1C",
  blush: "#F4D8CF",
  cream: "#FBF3EA",
};

const f = (n) => Math.round(n * 10) / 10;
const between = (r, a, b) => a + r() * (b - a);

function mix(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}
/** Colour along a multi-stop ramp, t in 0..1. */
function ramp(stops, t) {
  const x = Math.min(0.9999, Math.max(0, t)) * (stops.length - 1);
  const i = Math.floor(x);
  return mix(stops[i], stops[i + 1], x - i);
}

/** Catmull-Rom spline through points, sampled to `n` points with normals. */
function sample(points, n) {
  const pts = [points[0], ...points, points.at(-1)];
  const segs = points.length - 1;
  const out = [];
  for (let k = 0; k <= n; k++) {
    const u = (k / n) * segs;
    const i = Math.min(Math.floor(u), segs - 1);
    const t = u - i;
    const [p0, p1, p2, p3] = [pts[i], pts[i + 1], pts[i + 2], pts[i + 3]];
    const t2 = t * t;
    const t3 = t2 * t;
    const pos = [0, 1].map(
      (d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3),
    );
    const tan = [0, 1].map(
      (d) => 0.5 * (-p0[d] + p2[d] + 2 * (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t + 3 * (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t2),
    );
    const len = Math.hypot(tan[0], tan[1]) || 1;
    out.push({ x: pos[0], y: pos[1], nx: -tan[1] / len, ny: tan[0] / len, t: k / n });
  }
  return out;
}

const polyline = (pts) => `M${pts.map((p) => `${f(p[0])},${f(p[1])}`).join(" L")}`;

/** Shaded sphere: a radial gradient lit from the upper left. */
const sphereGrad = (id, stops = ["#FFF6B8", C.sun, C.flame, C.ember, "#8E2414"]) =>
  `<radialGradient id="${id}" cx=".5" cy=".5" r=".5" fx=".34" fy=".3">${stops
    .map((c, i) => `<stop offset="${f((i / (stops.length - 1)) * 100) / 100}" stop-color="${c}"/>`)
    .join("")}</radialGradient>`;

const glowGrad = (id, color, opacity = 0.75) =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${opacity}"/><stop offset=".45" stop-color="${color}" stop-opacity="${f(opacity * 0.35 * 100) / 100}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;

/* ------------------------------------------------------------- bloom */

function bloom(r, id) {
  const horizon = H * between(r, 0.6, 0.68);
  const cx = W / 2 + between(r, -220, 220);
  const R = between(r, 120, 175);
  const cy = horizon - R * between(r, 0.15, 0.55);
  const rays = 44 + Math.floor(r() * 20);
  let out = `<defs>
    <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.night}"/><stop offset=".55" stop-color="${C.plum}"/><stop offset="1" stop-color="#B8442A"/>
    </linearGradient>
    <linearGradient id="${id}sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5A2340"/><stop offset="1" stop-color="${C.night}"/>
    </linearGradient>
    ${sphereGrad(`${id}sun`)}
    ${glowGrad(`${id}glow`, C.flame, 0.85)}
    <clipPath id="${id}top"><rect width="${W}" height="${f(horizon)}"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#${id}sky)"/>
  <g clip-path="url(#${id}top)">
  <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R * 4.2)}" fill="url(#${id}glow)"/>`;
  // rays: alternate thin wedges fanning out from the sun
  for (let i = 0; i < rays; i++) {
    const a0 = Math.PI + (i / rays) * Math.PI;
    const a1 = a0 + (Math.PI / rays) * 0.5;
    const L = 1400;
    out += `<path d="M${f(cx)},${f(cy)} L${f(cx + Math.cos(a0) * L)},${f(cy + Math.sin(a0) * L)} L${f(cx + Math.cos(a1) * L)},${f(cy + Math.sin(a1) * L)}Z" fill="${C.sun}" fill-opacity="${f((0.035 + (i % 3) * 0.018) * 1000) / 1000}"/>`;
  }
  for (let k = 1; k <= 7; k++) {
    out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R + k * between(r, 28, 40))}" fill="none" stroke="${C.sun}" stroke-opacity="${f((0.34 - k * 0.04) * 100) / 100}" stroke-width="${k % 3 === 0 ? 3 : 1.4}"${k % 3 === 0 ? ' stroke-dasharray="1 12" stroke-linecap="round"' : ""}/>`;
  }
  out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R)}" fill="url(#${id}sun)"/></g>
  <rect y="${f(horizon)}" width="${W}" height="${f(H - horizon)}" fill="url(#${id}sea)"/>`;
  // reflection: stacked dashes of light under the sun
  for (let j = 0; j < 14; j++) {
    const y = horizon + 8 + Math.pow(j, 1.35) * 9;
    if (y > H) break;
    const w = R * 2 * (1 - j * 0.045) * between(r, 0.75, 1.05);
    const off = between(r, -26, 26);
    out += `<rect x="${f(cx - w / 2 + off)}" y="${f(y)}" width="${f(w)}" height="${f(3 + j * 0.5)}" rx="2" fill="${ramp([C.sun, C.flame, C.ember], j / 13)}" fill-opacity="${f((0.85 - j * 0.055) * 100) / 100}"/>`;
  }
  out += `<line x1="0" x2="${W}" y1="${f(horizon)}" y2="${f(horizon)}" stroke="${C.sun}" stroke-opacity=".35" stroke-width="1.5"/>`;
  return out;
}

/* --------------------------------------------------------- structure */

function structure(r, id) {
  const base = H * 0.78;
  const n = 6 + Math.floor(r() * 3);
  const usable = W * 0.8;
  const bw = usable / (n * 1.5);
  const gap = bw * 0.5;
  const x0 = (W - (n * bw + (n - 1) * gap)) / 2;
  const lead = 1 + Math.floor(r() * (n - 2));
  let out = `<defs>
    <linearGradient id="${id}bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.navy}"/><stop offset=".78" stop-color="${C.plumDeep}"/><stop offset="1" stop-color="${C.night}"/>
    </linearGradient>
    <linearGradient id="${id}col" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8A4867"/><stop offset=".45" stop-color="${C.plum}"/><stop offset="1" stop-color="#3A1427"/>
    </linearGradient>
    <linearGradient id="${id}lead" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFF1A0"/><stop offset=".3" stop-color="${C.sun}"/><stop offset=".7" stop-color="${C.flame}"/><stop offset="1" stop-color="${C.ember}"/>
    </linearGradient>
    <linearGradient id="${id}fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.night}" stop-opacity=".2"/><stop offset="1" stop-color="${C.night}"/>
    </linearGradient>
    ${glowGrad(`${id}glow`, C.flame, 0.7)}
    ${sphereGrad(`${id}orb`)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#${id}bg)"/>`;
  const arches = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (bw + gap);
    const h = i === lead ? H * between(r, 0.5, 0.56) : H * between(r, 0.24, 0.44);
    arches.push({ x, top: base - h, lead: i === lead });
  }
  const L = arches[lead];
  out += `<ellipse cx="${f(L.x + bw / 2)}" cy="${f(L.top + 40)}" rx="${f(bw * 3.2)}" ry="${f(bw * 3.6)}" fill="url(#${id}glow)"/>`;
  const shape = (a, y0, dir) => {
    const r0 = bw / 2;
    return dir > 0
      ? `M${f(a.x)},${f(y0)} V${f(a.top + r0)} A${f(r0)},${f(r0)} 0 0 1 ${f(a.x + bw)},${f(a.top + r0)} V${f(y0)} Z`
      : `M${f(a.x)},${f(y0)} V${f(2 * y0 - a.top - r0)} A${f(r0)},${f(r0)} 0 0 0 ${f(a.x + bw)},${f(2 * y0 - a.top - r0)} V${f(y0)} Z`;
  };
  // reflections first, then the floor fade over them
  for (const a of arches) out += `<path d="${shape(a, base, -1)}" fill="${a.lead ? `url(#${id}lead)` : `url(#${id}col)`}" fill-opacity="${a.lead ? 0.45 : 0.3}"/>`;
  out += `<rect y="${f(base)}" width="${W}" height="${f(H - base)}" fill="url(#${id}fade)"/>`;
  for (const a of arches) {
    out += `<path d="${shape(a, base, 1)}" fill="${a.lead ? `url(#${id}lead)` : `url(#${id}col)`}"/>`;
    out += `<path d="M${f(a.x + 3)},${f(base)} V${f(a.top + bw / 2)}" stroke="#fff" stroke-opacity="${a.lead ? 0.55 : 0.16}" stroke-width="2"/>`;
  }
  out += `<line x1="0" x2="${W}" y1="${f(base)}" y2="${f(base)}" stroke="${C.sun}" stroke-opacity=".3"/>`;
  const oy = L.top - bw * 0.9;
  out += `<circle cx="${f(L.x + bw / 2)}" cy="${f(oy)}" r="${f(bw * 0.36)}" fill="url(#${id}orb)"/>`;
  for (let k = 1; k <= 3; k++) {
    out += `<circle cx="${f(L.x + bw / 2)}" cy="${f(oy)}" r="${f(bw * 0.36 + k * 16)}" fill="none" stroke="${C.sun}" stroke-opacity="${f((0.4 - k * 0.1) * 100) / 100}"/>`;
  }
  return out;
}

/* -------------------------------------------------------------- path */

function path(r, id, dark = false) {
  const end = [between(r, 820, 980), between(r, 190, 300)];
  const base = [
    [-80, between(r, 640, 760)],
    [between(r, 220, 340), between(r, 520, 640)],
    [between(r, 470, 600), between(r, 600, 700)],
    [between(r, 640, 760), between(r, 360, 470)],
    end,
  ];
  const lines = 32;
  const pts = sample(base, 70);
  const stops = [C.sun, C.flame, C.ember, C.plum, C.navy];
  const darkStops = [C.sun, C.flame, C.ember, "#B85A7E", C.blush];
  let out = `<defs>
    <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${dark ? C.navy : C.cream}"/><stop offset="1" stop-color="${dark ? C.plumDeep : C.blush}"/>
    </linearGradient>
    ${glowGrad(`${id}glow`, C.sun, 0.9)}
    ${sphereGrad(`${id}orb`)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#${id}bg)"/>
  <circle cx="${f(end[0])}" cy="${f(end[1])}" r="330" fill="url(#${id}glow)"/>`;
  for (let k = 0; k < 9; k++) {
    out += `<circle cx="${f(end[0])}" cy="${f(end[1])}" r="${f(70 + k * 46)}" fill="none" stroke="${dark ? C.sun : C.plum}" stroke-opacity="${f((0.16 - k * 0.014) * 1000) / 1000}"/>`;
  }
  const twist = between(r, 0.6, 1.4);
  for (let i = 0; i < lines; i++) {
    const u = i / (lines - 1) - 0.5;
    const line = pts.map((p) => {
      const spread = Math.sin(Math.PI * Math.min(1, p.t * 1.06)) * 190 * twist + 10;
      const wave = Math.sin(p.t * Math.PI * 3 + u * 2) * 10;
      const o = u * spread + wave * u;
      return [p.x + p.nx * o, p.y + p.ny * o];
    });
    out += `<path d="${polyline(line)}" fill="none" stroke="${ramp(dark ? darkStops : stops, i / (lines - 1))}" stroke-width="${f(between(r, 3, 4.6) * 10) / 10}" stroke-linecap="round" stroke-opacity=".9"/>`;
  }
  out += `<circle cx="${f(end[0])}" cy="${f(end[1])}" r="46" fill="url(#${id}orb)"/>`;
  return out;
}


/* ------------------------------------------------------ structure (b) */
/* Nested arches receding to a lit doorway. */
function doorway(r, id) {
  const cx = W / 2 + between(r, -150, 150);
  const base = H * between(r, 0.86, 0.94);
  const n = 11;
  let out = `<defs>
    <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.plumDeep}"/><stop offset="1" stop-color="${C.navy}"/>
    </linearGradient>
    <linearGradient id="${id}core" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFF1A0"/><stop offset=".45" stop-color="${C.sun}"/><stop offset="1" stop-color="${C.ember}"/>
    </linearGradient>
    ${glowGrad(`${id}glow`, C.flame, 0.8)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#${id}bg)"/>
  <ellipse cx="${f(cx)}" cy="${f(base - 140)}" rx="420" ry="360" fill="url(#${id}glow)"/>`;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const w = 760 * (1 - t) + 70;
    const h = 700 * (1 - t) + 150;
    const x = cx - w / 2 + (t - 0.5) * between(r, -30, 30);
    const top = base - h;
    const d = `M${f(x)},${f(base)} V${f(top + w / 2)} A${f(w / 2)},${f(w / 2)} 0 0 1 ${f(x + w)},${f(top + w / 2)} V${f(base)}`;
    out += `<path d="${d}" fill="none" stroke="${ramp([C.plum, "#8A4867", C.ember, C.flame, C.sun], t)}" stroke-width="${f(14 - t * 9)}" stroke-opacity="${f((0.45 + t * 0.55) * 100) / 100}"/>`;
  }
  const w = 70;
  const x = cx - w / 2;
  out += `<path d="M${f(x)},${f(base)} V${f(base - 150 + w / 2)} A${f(w / 2)},${f(w / 2)} 0 0 1 ${f(x + w)},${f(base - 150 + w / 2)} V${f(base)}Z" fill="url(#${id}core)"/>`;
  out += `<rect y="${f(base)}" width="${W}" height="${f(H - base)}" fill="${C.night}"/><line x1="0" x2="${W}" y1="${f(base)}" y2="${f(base)}" stroke="${C.sun}" stroke-opacity=".35"/>`;
  return out;
}

/* --------------------------------------------------------- bloom (b) */
/* A sphere opening like a flower: striped petals radiating from a lit core. */
function petals(r, id) {
  const cx = W / 2 + between(r, -200, 200);
  const cy = H / 2 + between(r, -60, 60);
  const n = 14 + Math.floor(r() * 6);
  const L = between(r, 300, 360);
  const light = r() < 0.5;
  let out = `<defs>
    <radialGradient id="${id}bg" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="${light ? C.cream : C.plum}"/><stop offset="1" stop-color="${light ? C.blush : C.night}"/></radialGradient>
    <linearGradient id="${id}p" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.sun}"/><stop offset=".5" stop-color="${C.flame}"/><stop offset="1" stop-color="${C.ember}"/></linearGradient>
    ${sphereGrad(`${id}s`)}
    ${glowGrad(`${id}glow`, C.sun, 0.7)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#${id}bg)"/>
  <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(L * 1.3)}" fill="url(#${id}glow)"/>`;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 360 + between(r, -4, 4);
    const len = L * between(r, 0.78, 1);
    const wd = len * 0.2;
    out += `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(a)})"><path d="M0,0 C${f(len * 0.3)},${f(-wd)} ${f(len * 0.8)},${f(-wd)} ${f(len)},0 C${f(len * 0.8)},${f(wd)} ${f(len * 0.3)},${f(wd)} 0,0Z" fill="url(#${id}p)" fill-opacity="${i % 2 ? 0.92 : 0.75}"/>`;
    for (let k = 1; k <= 3; k++) {
      out += `<path d="M${f(len * 0.12 * k + 20)},0 L${f(len * 0.92)},0" transform="translate(0 ${f((k - 2) * wd * 0.32)})" stroke="${light ? "#fff" : C.plumDeep}" stroke-opacity=".35" stroke-width="2"/>`;
    }
    out += `</g>`;
  }
  out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(L * 0.26)}" fill="url(#${id}s)"/>`;
  return out;
}

// Two compositions per theme; `variant` alternates them so neighbouring
// articles in the same theme never share a picture.
const MOTIFS = {
  bloom: [bloom, petals],
  structure: [structure, doorway],
  path: [(r, id) => path(r, id, false), (r, id) => path(r, id, true)],
};

/** Standalone SVG document for a cover. */
export function coverSVG({ seed, motif, variant }) {
  const set = MOTIFS[motif];
  if (!set) throw new Error(`Unknown motif "${motif}"`);
  const draw = set[(variant ?? Math.floor(rng(`${seed}-v`)() * set.length)) % set.length];
  const id = `a${(seed.length * 7919 + seed.charCodeAt(0)).toString(36)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${draw(rng(seed), id).replace(/\s*\n\s*/g, "")}</svg>\n`;
}

export const coverPath = (slug) => `/media/covers/${slug}.svg`;
export const topicCoverPath = (slug) => `/media/covers/topic-${slug}.svg`;
