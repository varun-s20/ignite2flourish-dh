# Design research and direction

> **Update, 26 Oct 2026 — Ideas and Books & Research headers, icons.** Both archive headers now use the home hero's language. **Ideas** (and each theme page): title, intro and a "Latest essay" link on the left; on the right the home mark becomes a map of the three themes, a flame disc with the essay count at the centre and a sun disc, cream ring and cream dot on an orbit, one per theme, each a link with its count (the current theme is ringed). They spiral out on load and then stay still, because they are links. **Books & Research** (and its format pages): a "Latest review" link; on the right the contact page's arch with the flame disc rising in it, books leaning on its left leg and papers on its right, each linking to its review. Both end in gravity's convex edge into the list. Topic pages keep the plain header. **Icons:** the favicon and app icons were an orange disc from the old site; they are now the logo's own symbol (the three flame figures) from the client's vector PDF, with the wordmark removed for legibility at tab size. **About:** the "Why Ignite2Flourish" portrait had almost no space above his head, so wide frames cut it off; a strip of the photo's own plain wall is added above (the person untouched) and the crop is anchored near the top.

> **Update, 26 Oct 2026 — home hero and contact page after gravity-design.de.** The masthead hero below is superseded (its files are kept: `make_masthead` in `scripts/images.py` still renders the logo at hero scale). **Home hero:** the client is the first screen, at full height on the deep-plum ground, as gravity-design.de shows its founder. The portrait is `Sanzid-84-Edit.jpg` with only the studio backdrop removed (`scripts/cutouts.py`, BiRefNet); he is not retouched, reshaped, recoloured or flipped. Beside him, in his line of sight, is a small physical mark like gravity's: here the logo's three round flame heads become a flat flame disc, a cream ring and a cream dot. They spiral in on load, then orbit slowly on tilted paths that pass behind and in front of the disc, lean towards the pointer, and fly wide with a ring and sparks when the figure is clicked ("Click to ignite", a real button for keyboard users). Gravity's claim beside the mark becomes the three themes, with essay counts, on the right; its name lockup and foot row become the foot row (name, role, scroll line, LinkedIn). The headline, positioning line and one button sit bottom-left, aligned with the header's container. From 900px the hero is pinned and the page rises over it with gravity's convex section edge, flattening as it reaches the top; below 900px the words sit above the figure. Reduced motion shows the mark at rest and nothing pinned; without JavaScript the hero is complete and static. Not taken from gravity: its black-and-white photography (the client's colour photos are kept), the "Honors" side tab, the mark docking into the logo, and its German copy. **Contact page:** its first screen follows gravity's contact section: the question ("Ideas get better in conversation.") under a dark dome whose lower edge curves down, a flame disc ("Let's talk") bridging the dome and a large plum arch (the mark's ring), and Sanzid (`Sanzid-36-Edit.jpg`, arms folded, backdrop removed) standing in the arch. The disc leads to the form. The four reasons to write become numbered rows that fill in the subject and move to the message field; they sit beside the unchanged form (same fields, validation, honeypot, preview notice and `?about=` pre-fill) and the FAQ follows.

> **Update, 26 Oct 2026 — new home hero (masthead), superseded.** The statement-left, photo-right hero was judged generic. It is replaced with the first-screen idea of the studio's primary reference, **jasonpontin.com** (picked in `C:\Users\varun\digital-heroes-automation\projects\ignite2flourish\references\picks.md`; measured in `references\deconstruct\jasonpontin.md` and `jasonpontin-motion.md`): the brand at masthead scale on a pinned ground, with the page rising over it like a curtain. Here the masthead is the client's own reversed logo, rendered from his vector PDF (`scripts/images.py`, `make_masthead`; compared against his PNG, average difference about 1/255), never redrawn. On load it rises through a mask while a soft flame-coloured light warms up behind it. From 768px wide it stays pinned while the curtain (rounded top, the themes ticker as its leading edge) slides over it, and it eases back and dims as it is covered. The foot row carries the headline, the positioning line, one button and the three themes as links with essay counts. On the home page the header shows "Sanzid Ahmed · Senior HR & People Leader" instead of the small logo until it is pinned, as the reference shows the name above its wordmark. Not taken from the reference: its red ground (fails contrast with the client's colours), its custom cursor, its auto-scroll and its per-page artwork. The donor references (Asterisk, Maggie Appleton, Benedict Evans, European Review of Books) are noted for the next sections.

> **Update, 26 Oct 2026 — design v4 (current): v2 decluttered with cherylcran.com.** v2 (based on swiftform.webflow.io) is the main design: dark plum header and hero, pill buttons with rolling labels, the themes marquee, the scroll-coloured statement with odometer stats, the sticky "exploring now" swap, the pinned "start here" track, the dark featured band and cursor-follow article cards. It was judged too crowded. v3 copied cherylcran.com wholesale and was rejected. v4 keeps v2 as the base and uses cherylcran.com only as a guide for what to strip back. Sections 1 onwards describe the first (editorial) version and are kept for history.

> **Reference sites and the client.** The client did not supply any. In the Fiverr chat (3 Sept 2026) they wrote that they had no reference website in mind, and they left the requirements form's "Share 3 reference websites" question unanswered. The final brief asks the developer to propose 2–3 examples. Both references were chosen on our side, so present them to the client as a recommendation.

## 0. Version 4: v2 base, decluttered

**What comes from where**

| Concern | Source |
|---|---|
| Visual language, section types, buttons, cards, motion | v2 (swiftform.webflow.io) |
| Spacing, restraint, one idea and one action per section, the photo-beside-panel About block, the three theme circles, the glow invitation panel, the footer layout | cherylcran.com |
| Colours | `Ignite2Flourish_Style guide.pdf`: ember `#E34C20`, sun `#FFD900`, navy `#193046`, plum `#63324A`, deep plum `#3D1529`. Small ember text uses `#B93B16` for contrast. |
| Logo | The reversed master (`Ignite2Flourish_S2_2`) on the deep-plum header and footer, scaled only |
| Headings | Nimbus Sans Diagonal D (style guide "Main Heading") for each page's top heading; Aspekta elsewhere |
| Photography | The client's shoot (`assets/Sanzid-*.jpg`) |
| Content and features | `Ignite2Flourish_Final_Freelancer_Brief.docx` and the existing content files |

**Home page, v2 → v4**

| v2 section | v4 |
|---|---|
| Yellow announcement bar | Removed |
| Hero: tag, headline, lede, two buttons, marquee, photo with two chips and a badge, white checklist card, bar-chart stat card | Tag, headline, lede, two buttons, one portrait with one name chip; the themes marquee moved to a quiet band under a hairline |
| Why: statement + four stat cards (one with a button) | Statement + three stat cards |
| — | About the author: full-bleed photo beside a deep-plum panel (from cherylcran.com) |
| Topics: six icon cards | Three theme cards with large brand-colour circles (from cherylcran.com) |
| Exploring now: sticky swap with a note mock-up, a chart mock-up and a photo | Same sticky swap; the cards are now just the related article's cover art and a photo |
| Ideas cloud of seven tag orbs | Removed |
| Start here: pinned sideways track, cards with checklists | Same pinned track on a soft band; cards without checklists |
| Featured dark band | Kept |
| About split on white | Replaced by the photo-beside-panel block above |
| Books & Research bento of four | Two cells: one book, one paper |
| Latest: three cards | Kept (now excludes the featured essay) |
| FAQ accordion | Replaced by the glow "Continue the conversation" panel; the accordion stays on the contact page |
| Dark footer with logo, three headed columns, invitation card and button | Dark footer with one large invitation line, two plain link columns and a thin bottom bar (from cherylcran.com) |

**Inner pages:** archive headers lose their featured card, chips and second marquee; review rows lose their checklists; articles drop the sidebar for one reading column; About drops the "where I've worked" tiles, slider, mission banner and expertise photo; Contact drops the LinkedIn card for a single link.

**Motion kept:** blur-in page headers, slide-up reveals (now 60px rather than 100px), rolling button and nav labels, cursor-follow card badges, the scroll-coloured statement, odometers, the sticky swap, the pinned track, the marquee, the accordion and the credentials timeline. **Removed:** bar charts, the tag orbs, the slider.

## 1. What the client gave us

| Source | What it told us |
|---|---|
| Requirements form (Oct 2026) | Audience: 30+, 7+ years' corporate experience, global; "want to progress, sometimes stuck, sometimes just going with the flow". Purpose: share thinking and solve everyday professional problems by connecting best practice with 22 years of global experience, plus mindset/positive psychology. Blogs, book reviews, research-paper reviews now; coaching and mentoring only after about 15 months. Moderated comments wanted. Current site "too commercial". |
| Agreed proposal | Modern journal feel: intelligent, calm, credible, contemporary. Trademarked logo kept exactly as it is. Existing colour family preserved and refined. **No** coaching imagery, stock photography, pop-ups, aggressive CTAs, pricing or booking. No reading-progress bar. Mobile-first. |
| Current site (ignite2flourish.com, captured 23 Oct 2026) | Plum `#63324A` theme with a blush tint, orange-red buttons, logo with an ember-to-gold flame and a navy wordmark. Twelve posts, all "Uncategorized", most illustrated with stock images. About page coaching-led. |

Attachments mentioned in the brief (style guide PDF, logo source files, the Nimbus Sans font, "Sanzid Edits.zip", the freelancer brief .docx) were **not** in the project folder; the logo, colours and copy were taken from the live site instead.

## 2. Reference publications

Captured at 1440 px with Playwright on 23 Oct 2026 (three scroll positions each). MBS Works returned HTTP 403 to the automated browser and could not be inspected; the Pinterest and Dribbble boards were not used.

| Reference | Strongest idea | Where it shows up here |
|---|---|---|
| **Psyche** | Warm paper ground, light serif headlines, tiny tracked category labels; themes used as navigation (Understand · Relate · Heal · Transcend) | Paper palette, Newsreader display at light weights, diamond-marked kickers, "Read by theme" strip and the three theme pathways |
| **MIT Sloan Management Review** | Numbered "What to Read Next" list beside the lead story | "Start here" — 01 / 02 / 03 with oversized italic numerals |
| **Harvard Business Review** | Text-only "The Latest" column with strict rules between items | "Latest" column next to the featured article |
| **First Round Review** | One big serif feature with a quieter column beside it | Featured + Latest composition |
| **Five Books** | Bibliographic metadata treated as content — author, publisher, year — next to the cover | Book-review header with a full biblio grid; typographic covers in place of real ones |
| **Behavioral Scientist** | Research presented accessibly, with clear attribution | Research reviews: "From the paper" panel kept visually separate from the author's interpretation |
| **The Marginalian** | A strong, single authorial voice and literary restraint | Epigraphs set as figures, serif reading text, first-person About copy |
| **James Clear** | A plain statement of the question the writing serves; very clean archive | Topics headline ("how do capable people do their best work…"), restrained Ideas archive |
| **Farnam Street** | Big, confident headline with practical framing | Hero headline scale and the "Why Ignite2Flourish" statement |
| **Adam Grant** | Personal brand anchored by a portrait and a role line | Arch portrait with "Senior HR & People Leader" caption |

## 3. Decisions

**Colour.** The proposal says keep the existing family. The plum stays exactly (`#63324A`). The logo supplies ember `#D9481C`, gold `#F2A81D` and navy `#1E3A4C`. The old candy-pink background becomes a warm paper `#F8F4EF` with a blush stone `#F1E8E3` for alternate bands. Each theme has a colour: Work & Leadership = plum, Career & Life = navy (from the wordmark), Flourishing = ember. Every text pair meets WCAG AA; bright ember is used only for large type and decoration, with a darker `#B23A12` for small text.

**Typography.** The client's font (Nimbus Sans Diag) wasn't supplied, and the logo's heavy italic sans shouldn't be imitated in headlines. Instead:
- **Newsreader**, a variable serif with optical sizes designed for reading on screen, for headlines and article text.
- **Instrument Sans** for the interface, labels and short paragraphs.
- Both are open-licensed (OFL) and self-hosted.
- Article bodies are set in the serif because long-form reading is the core experience. Switching that is one token (`.prose { font-family }`).

**Imagery.** Stock photography is ruled out, so nothing from the old posts was carried over. Every article gets a generative cover drawn from its theme's motif and seeded by its URL:
- **Flourishing:** a rising ember sun.
- **Work & Leadership:** arched columns, one leading.
- **Career & Life:** a route across contour lines.

These covers are original, consistent and free of licensing questions. The only photographs are the client's own portraits. Books get typographic covers rather than copies of the real ones.

**Shape.** The arch (portrait frame, share cards, column tops in the artwork) and the ember "sun" (from the site icon) recur as the two brand devices.

**Motion.** It is restrained and purposeful:
- The hero headline rises word by word, and the portrait reveals while the sun rises behind it.
- Sections reveal once as you scroll; the archive animates as you filter; pages crossfade on supporting browsers.
- None of it hides content without JavaScript, and `prefers-reduced-motion` switches all of it off.
- There is no scroll-jacking, parallax or loading screen, and no reading-progress bar (the proposal asked for none).
