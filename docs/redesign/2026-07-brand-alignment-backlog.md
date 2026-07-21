# Brand Alignment Backlog — July 2026 (ticket drafts)

Status: **drafts for owner review — no Jira ticket has been created yet.**
Source: [`2026-07-brand-alignment-audit.md`](./2026-07-brand-alignment-audit.md) (gap IDs G1–G13 referenced below).
Visual companions: [implementation-reference artifact](https://claude.ai/code/artifact/cf126d9b-644e-41f5-a47b-4a9f6fedaf8e) (annotated screenshots, live BBH/Bricolage specimens) · [Confluence visual page](https://big-emotion.atlassian.net/wiki/spaces/SW/pages/173572109).
Once approved, each draft becomes an SWBE ticket via `docs/templates/jira-ticket-template.md` (A/B/C drafts use its section names; the compact D-track entries are expanded into the full template at Jira-creation time); the Confluence impact sections are then materialized through `/bigemotion-spec`.

## Phasing & dependencies

- **Phase 1 — Brand conformity** (no structural change): A1, A2, A3, A4, A5. Independent of each other except A2 → A4 (loader wants the logo glyphs) and A2 → A6.
- **Phase 2 — Target experience**: B1 (pages, needs ADR) → B4, B6; C1/C2 (mail & domain) run in parallel, owner preconditions first.
- **Phase 3 — Content platform**: B3 (Prismic ADR + skeleton) → B2 (i18n rides on the Prismic locale model) → B5 (content refresh through the CMS).
- **Local DA track** (no site deploy involved): D1, D2, D3, D4, D5 — anytime **once the vector logo exists** (see watchpoint below).

Asset watchpoint: the official **vector logo (SVG/AI) does not exist yet** — request it from the designer (fallback: extract vectors from `brand/big-emotion-brand-guidelines.pdf` p.2). A2, A4, A6, D1–D5 consume it.

---

## Phase 1 — Brand conformity

### A1 — Adopt the BBH display typeface (replace Archivo stand-in)

**Type**: Story · **Gaps**: G1

**Goal.** Titles, nav, wordmark contexts and display text must render in the brand’s BBH family instead of the Archivo stand-in, so the site matches Brand Guidelines p.5 and the designer’s prototype. Archivo was a placeholder chosen when BBH was believed unavailable as a libre font (`src/app/layout.tsx:14-15` comment) — BBH is now on Google Fonts (Studio DRAMA).

**Locked decisions.**
- Primary display face = **BBH Hegarty** (the designer’s prototype uses it exclusively: `BBHHegarty-Regular.ttf` on bigemotion.netlify.app).
- Bogle (condensed) and Bartle (expanded) may be added later for graphic treatments; not required in this ticket.
- Fonts stay **self-hosted woff2** under `src/app/fonts/` (repo rule: offline-reproducible builds, no visitor request to Google). Source from `@fontsource-variable/*` or `@fontsource/*` packages (`bbh-hegarty` / `bbh-sans-*` naming on Fontsource — take whichever package serves Hegarty; verify with `npm view`).
- Keep the CSS contract unchanged: `--font-bbh` / `--font-display` keep their names so `font-display` usage sites don’t change.
- Keep `.font-display { font-weight: 800; text-transform: uppercase; … }` only if BBH Hegarty carries a matching weight; otherwise adjust weight to the heaviest available and re-tune `letter-spacing`/`line-height` against the PDF specimens.
- OG share card: satori (next/og) cannot parse WOFF2 — `src/app/opengraph-image.tsx:20-40` sniffs the signature and always falls back today. Commit an additional **TTF/OTF/WOFF1** build of BBH Hegarty for the OG renderer so the share card really renders BBH.

**Scope.** Swap the woff2 + `localFont` config in `src/app/layout.tsx:16-21`; update the outdated comment; visual pass on hero/nav/sections/footer/404 at 390 px then 1440 px; update `src/app/opengraph-image.tsx` font attempt; adjust `wordmark.test.tsx` if it asserts font classes.
**Out of scope.** The drawn logo (A2), Bogle/Bartle additional faces, any layout change.

**Acceptance criteria.**
* Given the home page, when inspecting the computed style of `h1` and nav links, then the resolved font family is BBH (Hegarty), not Archivo.
* Given `pnpm lint && pnpm test && pnpm build`, when run, then all pass and the standalone build contains no request to fonts.googleapis.com.
* Given the hero at 390 px, when compared to Brand Guidelines p.5/p.13 specimens, then letterforms match (flat-topped G, squared counters — visibly not Archivo).
* Given the generated `opengraph-image` PNG, when rendered, then “B!G EMOTION” shows BBH letterforms (not the bundled fallback face).

**Affected files.** `src/app/fonts/`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/opengraph-image.tsx`, `package.json`.

---

### A2 — Official logo asset (header, footer, favicon)

**Type**: Story · **Gaps**: G2

**Goal.** Replace the CSS-styled text wordmark with the official “B!G EMOTION” logo block and the official “B!” monogram, respecting the logo rules (protection zone = height of “!”, never deformed, only allowed color pairs, no shadow/outline/effect — Brand Guidelines p.2/p.4).

**Manual precondition (owner).** Obtain the vector logo (SVG or AI) from the designer — or approve extraction from the PDF (p.2 embeds vectors).

**Locked decisions.**
- Header: the logo follows the header’s **currentColor contract** — `site-header.tsx:68-69` flips `text-ink` → `text-paper` when scrolled or menu-open (the bar turns `bg-ink`), so the SVG must use `fill="currentColor"`; a hardcoded ink logo would be black-on-black there, violating the p.4 contrast rule. Links to `/`, height sized so the protection zone clears the nav, same slot as today (`site-header.tsx:77-83`).
- Footer: keeps the current **typographic habillage** — the oversized `w-full text-[22vw]` stretch (`site-footer.tsx:44-49`) is legal for the *typo* per p.9–10 but would violate the no-distortion rule if it became the logo block. The footer’s `Wordmark stacked={false}` (“B!G”-only) treatment survives, restyled in BBH; the official logo block goes to header, favicon and OG only.
- Favicon/app icons: replace `src/app/icon.svg` (currently Arial “B!”) and `src/app/apple-icon.tsx` with the official B! monogram.
- Keep `aria-label="BIG EMOTION"` accessibility contract from `wordmark.tsx`.

**Scope.** Add `public/brand/` SVGs (locked location): `logo-block.svg` (full “B!G EMOTION”), `logo-big.svg` (the “B!G” line alone — consumed by A4’s load screen; request it from the designer along with the block), `monogram.svg` (“B!”), each `fill="currentColor"` where possible; rewrite `src/components/wordmark.tsx` to render the SVG (props: stacked/inline, color variant); update header/footer/scene fallback/loader call sites; regenerate OG image with the logo.
**Out of scope.** Load-screen animation (A4), 3D asset (A5), stationery exports (D5).

**Acceptance criteria.**
* Given any page, when viewing the header, then the official logo block renders (not styled text) and links to `/`.
* Given the favicon in a browser tab, when compared to the PDF p.12 “FAVICON” frame, then it is the official B! monogram.
* Given any logo instance, when measured, then no distortion is applied (uniform scale only) and the color pair belongs to the p.4 associations grid.
* Given the rewritten `wordmark.test.tsx` (the `getByText("B!G")`/`EMOTION` text-node assertions at `wordmark.test.tsx:9-15` are replaced — an SVG has no such text nodes), when run, then it passes asserting the accessible name “BIG EMOTION” via `getByLabelText`/`getByRole`.

**Affected files.** `src/components/wordmark.tsx` (+test), `src/components/site-header.tsx`, `src/components/site-footer.tsx`, `src/components/scene/scene-canvas.tsx`, `src/app/icon.svg`, `src/app/apple-icon.tsx`, `src/app/opengraph-image.tsx`, new `public/brand/` or `src/assets/`.

---

### A3 — Hero conformity: centered tagline + clickable SCROLL pill

**Type**: Story · **Gaps**: G3

**Goal.** Match the hero mock (Brand Guidelines p.13): headline centered, SCROLL pill directly below it, intro paragraph bottom-right — and make the pill actually scroll (owner requirement; the prototype’s pill is decorative, we do better).

**Locked decisions.**
- `h1` centered horizontally (`text-center`), vertically centered block; SCROLL pill immediately below the `h1` (not pinned to the viewport bottom), centered.
- The pill is a plain `<a href="#approach">` in `hero.tsx` (retarget once B1 lands), keyboard-focusable. Smooth-scroll mechanism (locked): enable Lenis’s built-in anchor handling — `new Lenis({ anchors: true, lerp: 0.09, smoothWheel: true })` at `scene-canvas.tsx:182` — so in-page anchors are smooth-scrolled with **no new seam** (the Lenis instance is a local inside `buildScroll()` and stays that way). Where Lenis never exists (no-WebGL fallback, reduced motion — `scene-canvas.tsx:227,282,295`), the anchor degrades to a native jump, which is the desired behavior.
- Remove the duplicate dead cues: the “Scroll ↓” `<span>` in `hero.tsx` and the `pointer-events:none` `.scene-scrollcue` in `scene-canvas.tsx:318-320` / `globals.css:167` are replaced by this single pill. **No fade-out logic**: the pill sits in-flow inside the hero section (not fixed), so it scrolls out of the viewport naturally and `Hero` stays a server component.
- Keep the intro paragraph bottom-right (`site.baseline` + “Vraie identité, émotion brute.”).

**Scope.** `src/components/hero.tsx` layout rework (mobile-first: 320–430 px first, then ≥768, then ≥1200); wire pill → Lenis scroll; remove/retire `.scene-scrollcue`; tests for the pill’s accessible role/target.
**Out of scope.** 3D asset (A5), section pages (B1).

**Acceptance criteria.**
* Given the home page at 390 px, when it loads, then the tagline is horizontally centered and the SCROLL pill sits directly under it, centered.
* Given the SCROLL pill with WebGL active, when clicked or activated by keyboard, then the viewport smooth-scrolls (Lenis) to the Approach section.
* Given no WebGL or `prefers-reduced-motion`, when the pill is activated, then a plain non-animated anchor jump to `#approach` occurs.
* Given the page, when searching the DOM, then exactly one scroll cue exists.

**Affected files.** `src/components/hero.tsx`, `src/components/scene/scene-canvas.tsx`, `src/app/globals.css`.

---

### A4 — Load screen per guidelines (wavy B!G loop on white)

**Type**: Story · **Gaps**: G4 · **Depends on**: A2 (logo glyphs)

**Goal.** Make the pre-site load screen match Brand Guidelines p.12: the logo “B!G” repeated in a horizontal **loop with a wavy vertical rhythm, black on white**, introducing the content with a digital feel. Today: flat Archivo spans on lemon (`src/components/load-screen.tsx`).

**Locked decisions.**
- White (`--color-paper`) background, ink glyphs, using **`public/brand/logo-big.svg`** (the “B!G” line alone, delivered by A2 — never a cropped or deformed logo block) — not styled text.
- Keep the pure-CSS, no-JS approach and the existing exit choreography (`loadscreen-out`, reduced-motion fade — `globals.css:54-81`); the wave is CSS transforms on repeated marks.
- Keep `aria-hidden="true"` and the ≤1.5 s total hold.

**Scope.** Restyle `load-screen.tsx` + `globals.css` loadscreen rules; per-instance vertical offset/rotation to reproduce the wavy loop of p.12.
**Out of scope.** The scene’s own loading pulse (stays, but swap glyphs when A2 lands).

**Acceptance criteria.**
* Given a cold load, when the splash shows, then it is white with the official “B!G” mark repeating in a visible wave, and it slides away exactly as before.
* Given `prefers-reduced-motion`, when loading, then the splash fades without the marquee sliding.

**Affected files.** `src/components/load-screen.tsx`, `src/app/globals.css`.

---

### A5 — Ship the real 3D logo in the hero scene

**Type**: Story · **Gaps**: G5

**Goal.** The scroll-driven chrome 3D “B!G EMOTION” finally renders: replace the 92-byte placeholder `public/models/scene.glb` with the designer’s optimized asset. The whole pipeline (GSAP ScrollTrigger + Lenis + Draco + states + mouse parallax) already exists and mirrors the designer’s `main.js`.

**Locked decisions.**
- Use the **Draco-compressed** `BE-logo-3D.min.glb` (45,592 bytes) — fetch from https://bigemotion.netlify.app/BE-logo-3D.min.glb; the raw `~/Documents/BIG_EMOTION/BE-3d.glb` (7.1 MB, non-indexed, no Draco) is the master only. If regeneration is ever needed: `npx @gltf-transform/cli optimize BE-3d.glb scene.glb --compress draco`.
- Keep the filename `public/models/scene.glb` (loader contract `scene-canvas.tsx:15`) and the self-hosted decoder `public/draco/`.
- The GLB has a **baked 45° Y rotation**. The port does **not** cancel it today (verified: no `FACE_OFFSET` anywhere in `src/components/scene/`). Add `holder.rotation.y = -Math.PI / 4` on the normalization holder group (`scene-canvas.tsx:259-263`), mirroring the designer’s `main.js:15-16, 215`. Do **not** put it on the `spin` group — `applyLive()` (`scene-canvas.tsx:144`) resets `spin.rotation` every frame and would silently clobber it.
- Keep current states/material/camera (already identical to the reference).

**Scope.** Asset swap; the FACE_OFFSET fix above; rewrite `public/models/README.md` — drop the “placeholder” current-state section (`README.md:6-9`), replace the stale `gltf-pipeline` recipe (`README.md:13-22`) with the locked `@gltf-transform/cli` command, and record provenance (master: `~/Documents/BIG_EMOTION/BE-3d.glb`; shipped: `BE-logo-3D.min.glb` from bigemotion.netlify.app, 45,592 bytes); manual QA against bigemotion.netlify.app at 390/768/1440 px (grow-through-sections, mouse parallax, reveal spin, mobile FIT).
**Out of scope.** Any state/choreography retune beyond face-on correctness.

**Acceptance criteria.**
* Given the home page with WebGL, when it loads, then the chrome 3D logo spins in face-on (not rotated 45°) and the loader pulse disappears.
* Given a full scroll to the footer, when observing, then the model grows/turns through the six states and ends face-on above the closing content, matching the Netlify reference.
* Given Lighthouse or devtools network, when loading, then the GLB transfer is ≤ 100 KB.
* Given a browser without WebGL or reduced-motion, when loading, then the existing wordmark fallback still renders.

**Affected files.** `public/models/scene.glb`, `public/models/README.md`, `src/components/scene/scene-canvas.tsx` (offset only if missing), `src/components/scene/states.ts` (verify only).

---

### A6 — Social links row in the footer

**Type**: Story · **Gaps**: G13 · **Depends on**: A2 (monogram for visual language) — otherwise independent

**Goal.** The designer’s closing screen (test.pdf p.9) shows a social row (Facebook, X, Instagram, YouTube, LinkedIn, TikTok, WhatsApp) under the manifesto. The live footer prints “@big-emotion on socials” as dead text (`site-footer` / `site.ts:17`).

**Open question (blocks implementation).** Actual profile URLs/handles per network (`@BIGEMOTIONAGENCY` appears in test.pdf — confirm which networks exist).

**Scope.** `social` entry in `src/content/site.ts` becomes a typed list `{ network, href }`; the icon row **replaces the dead-text `<li>` at `site-footer.tsx:34`**. Icons (locked): simple-icons SVG paths pasted inline in `site-footer.tsx` — no runtime dependency added. Style: `fill="currentColor"` ink on lemon; hover/focus switches the fill to `--color-tangerine`.
**Acceptance criteria.**
* Given the footer, when rendered, then one link per confirmed network appears with `aria-label`, opens in a new tab with `rel="noopener"`.
* Given no confirmed handle for a network, when building the list, then that network is omitted (no dead links).

**Affected files.** `src/content/site.ts`, `src/components/site-footer.tsx` (+tests).

---

## Phase 2 — Target experience

### B1 — Real pages per nav entry (ADR + implementation)

**Type**: Story (ADR first) · **Gaps**: G6

**Goal.** Move Approach / Cases & Impact / Culture / Contact from one-page anchors to dedicated routes, with the designer’s sub-page layout: big title + body text left, full-height photo right (desktop ≥1200); stacked title → text → photo on mobile (Netlify classes `subpage-text` / `subpage-photo`).

**Locked decisions.**
- Routes: `/approach/`, `/cases/`, `/culture/`, `/contact/` (trailingSlash stays true).
- Home keeps the 3D scroll experience; section teasers on home may remain (decide in ADR).
- Legacy WP 301s in `next.config.ts:16-51` retarget to the new pages (`/contactez-nous/` → `/contact/`, `/les-membres/` → `/culture/`, case-study URLs → `/cases/`); the current `/#anchor` targets must keep working (either sections stay on home or anchors redirect).
- First page content = the prototype copy in **French** (fetch the full FR strings from `https://bigemotion.netlify.app/js/i18n.js` into `src/content/site.ts` — audit §4 only quotes truncated EN one-liners; EN waits for B2), until Prismic (B3) takes over; photos per B6.
- `/contact/` renders the existing **ContactForm** (owner arbitration: the form stays — the prototype’s mailto-only contact page is a regression we don’t take); the SubpageLayout adapts around the form.
- An ADR records the IA change (also fixes the duplicate-0005 numbering rule going forward).

**Scope.** ADR; `src/app/(marketing)/approach/page.tsx` etc. (structure per repo conventions); shared `SubpageLayout` component (title/text left, photo right); nav hrefs in `src/content/site.ts:24-29`; redirects; sitemap/metadata per page; tests.
**Out of scope.** i18n (B2), CMS (B3), photo generation (B6).

**Acceptance criteria.**
* Given `/approach/` at 390 px, when loaded, then title, body, then photo render stacked, SSG-prerendered.
* Given `/approach/` at ≥1200 px, when loaded, then text occupies the left column and the photo the right, per the Netlify reference.
* Given `/contactez-nous/`, when requested, then a 301 lands on `/contact/`.
* Given `/contact/`, when loaded, then the working contact form is present and posts to `/api/contact`.
* Given a direct visit to `/#approach` (and `/#cases`, `/#culture`, `/#contact`), when loaded, then the visitor lands on the corresponding content (home section or redirect to the new page).
* Given the header nav, when clicking Culture, then `/culture/` loads (no `/#culture` anchor).
* Given `pnpm build`, when run, then all four pages appear in the SSG output.

**Affected files.** `docs/adr/`, `src/app/` (new routes), `src/components/` (SubpageLayout), `src/content/site.ts`, `next.config.ts`, tests.

---

### B2 — FR/EN internationalization (ADR + implementation)

**Type**: Story (ADR first) · **Gaps**: G7 · **Depends on**: B3 recommended first (locale-aware content model avoids migrating copy twice); hard-depends on B1 for per-page routes

**Goal.** The site serves French and English like the designer’s prototype (client-side dictionary with FR/EN toggle; nav FR: APPROCHE / RÉFÉRENCES & IMPACT / CULTURE / CONTACT).

**Locked decisions.**
- FR is the default locale at `/`; EN under `/en/` (SEO-correct, unlike the prototype’s client-side swap). `hreflang` alternates on every page.
- Locale-switch control in the header (FR / EN), preserving the current path.
- Translations live with the content source of the moment: `site.ts` dictionaries pre-Prismic, Prismic locales after (fr-fr / en-us).

**Scope.** ADR (routing strategy, library choice — e.g. `[locale]` segment vs next-intl — argue KISS for a two-locale site); `lang` attribute per locale; translated metadata; translation of the **marketing surface only**: `site.ts` strings, nav, 404 (`src/app/not-found.tsx:3` “Page introuvable”), and component-level UI strings (contact-form labels/feedback — `contact-form.tsx:51,85-89,109`). **Excluded**: the `/login` + `/espace/:clientId` surface stays FR-only, outside `/en/` routing and the locale switcher (`src/proxy.ts:9-14` path guard unchanged). Translation sources: the prototype’s `i18n.js` covers the sub-page copy and the manifesto lines are already EN (`site.ts:41-49`); **EN copy for repo-specific strings (services, cases, team, contact micro-copy) does not exist anywhere** — the implementer drafts it in the brand voice (PDF p.8) and flags it for owner review in the PR.
**Acceptance criteria.**
* Given `/en/approach/`, when loaded, then the page renders in English with `<html lang="en">` and hreflang alternates.
* Given the header on any **marketing** page, when switching FR→EN, then the same page loads in the other locale.
* Given `/`, when crawled, then FR content is served (default locale, no redirect to `/fr/`).

**Affected files.** ADR, `src/app/` routing, `src/content/`, `src/components/site-header.tsx`, metadata files.

---

### B3 — Prismic CMS: ADR + repository skeleton + first migrated type

**Type**: Story (Epic seed) · **Gaps**: G10/G11 enabler · **Depends on**: B1 for the `/cases/` route (pre-B1, acceptance applies to the home cases section) · owner decision “content editable via Prismic” is locked; the integration design is not

**Manual preconditions (owner).**
1. Create the Prismic account + repository (pick the repository name, e.g. `big-emotion`) and choose the plan.
2. Generate the content API access token and a webhook secret; hand them over for `deploy/env.template` + VPS `.env` wiring.

**Goal.** Marketing copy becomes editable without a deploy. Record the integration architecture in an ADR, stand up the Prismic repository, and migrate one content type end-to-end (recommended: **cases**) as the template for the rest.

**Locked decisions.**
- CMS = Prismic (owner decision — do not re-open).
- Rendering stays SSG/ISR on the standalone server: content changes trigger revalidation (Prismic webhook → `revalidatePath`/tag), no client-side fetching.
- `src/content/site.ts` remains the typed fallback until each type is migrated; migration is progressive, never big-bang.
- Locales fr-fr + en-us from day one (feeds B2).

**Scope.** ADR (custom types & slices mapping: page hero/sections, case, team_member, settings; preview strategy; webhook; env/secrets on the VPS; failure mode = build-time fallback to committed content); repository + custom types (the Prismic MCP tooling can create/update *documents*; custom types and slices are defined via Slice Machine or the Custom Types API — the MCP only reads them); `@prismicio/client` integration behind a small `src/lib/cms.ts` seam; cases migrated + rendered.
**Out of scope.** Migrating every type (follow-up tickets per type), i18n routing (B2).

**Acceptance criteria.**
* Given a case edited in Prismic, when published, then the live cases content (home section pre-B1, `/cases/` page post-B1) reflects it within the revalidation window without a redeploy.
* Given Prismic unreachable at build time, when `pnpm build` runs, then the build still succeeds using the committed fallback content.
* Given the ADR, when read, then it records slice/type model, preview, webhook, secrets path, and the progressive-migration rule.

**Affected files.** ADR, `src/lib/cms.ts` (new), `src/content/site.ts`, case components, `deploy/env.template`, VPS env.

---

### B4 — Brand personality slider module

**Type**: Story · **Gaps**: G12 · **Depends on**: B1 (lives on Culture page; interim: Culture section)

**Goal.** Render the Brand Guidelines p.9 personality slider (six axes, dot on a line) as a brand-flavored UI module on the Culture page.

**Locked decisions.**
- Axes and positions (0–100 from left): Formal↔Casual 55 · Cold↔Warm 35 · Serious↔Playful 45 · Detailed↔Minimal 65 · Corporate↔Friendly 42 · Complex↔Simple 55 — **to visually confirm with the designer before merge** (read off the PDF; the PDF’s “Coold”/“Detalied” typos are not reproduced).
- Static presentation (not an input); CSS-only; renders **after the values line** in the Culture section/page (`culture.tsx:28` area); axis labels translated when B2 lands.

**Acceptance criteria.**
* Given the Culture page (or, pre-B1, the Culture section on `/`) at 390 px, when rendered, then six axes display with dots at the locked positions, readable without horizontal scroll.
* Given a screen reader, when traversing, then each axis exposes a text alternative (“Formal–Casual: 55 % toward Casual”).

**Affected files.** `src/components/sections/culture.tsx` (or Culture page), `src/content/site.ts` (axis data), styles.

---

### B6 — Brand-compliant photography set

**Type**: Task · **Gaps**: feeds B1 layouts · **Depends on**: none for the assets; the wiring criterion applies once B1 lands

**Goal.** Produce/collect the per-page photos (approach, cases, culture, contact) following the iconography rules, so sub-pages match the “photo right” layout.

**Locked decisions.**
- **v1 = the designer’s own prototype photos** — they are the designer’s art direction and count as Done. Build the file→page mapping by reading each sub-page’s `<img src>` on bigemotion.netlify.app (e.g. `/approach` → `Photos/approach.jpg`) and fetch those files.
- Replacements/extensions are generated with the canonical prompt from the audit §2 verbatim (generation is allowed: “Génération ou augmentation IA acceptée si le rendu reste photographique”), substituting the bracketed subject to match the photo being replaced; the owner validates any generated replacement.
- Output: **one high-quality JPEG source per photo**, ≥1600 px on the long edge, under `public/photos/` — AVIF/WebP delivery comes from the `next/image` optimizer at request time (active on the standalone server, `next.config.ts:11`), so no pre-generated format variants.

**Acceptance criteria.**
* Given `public/photos/`, when reviewed, then one source photo per page (approach, cases, culture, contact) exists, ≥1600 px, respecting the iconography rules (no white background, no flat light, no pastel).
* Given B1 has landed, when each sub-page loads, then its mapped photo renders through `next/image`.

**Affected files.** `public/photos/`; page components (with/after B1).

---

## Phase 2/3 parallel — Mail & domains (owner + infra + code)

### C1 — `hello@big-emotion.com` replaces `contact@`

**Type**: Story · **Gaps**: G8

**Manual preconditions (owner).**
1. Create `hello@big-emotion.com` in the M365 tenant (mailbox or alias on the existing account — alias is enough since `lib/mail.ts` sends via Graph from `MAIL_SENDER`).
2. Keep `contact@` alive as receiving alias during transition (≥6 months).

**Locked decisions.** Public address becomes `hello@`; the sending identity switches too — that is **`MAIL_SENDER`** (`MAIL_FROM` is a dead SMTP-era template variable nothing reads); SPF/DKIM/DMARC unchanged (same domain, ADR 0002 stays valid — add a note).

**Scope (code, exact touch points).** `src/content/site.ts:13` · `src/lib/contact-mail.ts:10` (RECIPIENT) and `:35` (subject unaffected) · `src/app/api/contact/handler.ts:14` (fallback copy) · `src/components/contact-form.tsx:55` (fallback copy) · VPS `.env`: set **`MAIL_SENDER=hello@big-emotion.com`** — the variable the Graph transport actually reads (`src/lib/mail.ts:38,89-90`; `MAIL_FROM_NAME` optional) · `deploy/env.template`: line 12’s `MAIL_FROM` sits in the retired SMTP block whose own comment says it is unused — add `MAIL_SENDER`/`GRAPH_*` placeholders (or delete the stale SMTP block) so the template matches the Graph transport · related tests. Note: `public/contact.php` is retired reference code — do not update, delete it in its own cleanup if desired.
**Open question.** `src/config/clients.ts:56` allowlists `contact@big-emotion.com` as an espace-client login — decide whether that login email migrates (owner call; separate change since it logs a client in).

**Acceptance criteria.**
* Given the footer, when rendered, then `hello@big-emotion.com` is the visible mailto.
* Given a contact-form submission in production, when delivered, then the notification goes to `hello@` and the From is `hello@`.
* Given an email sent to `contact@`, when received, then it still lands in the same mailbox (alias kept).

**Affected files.** listed above + tests.

---

### C2 — `b2b@` mailbox and `b2b.big-emotion.com` domain (rename from support)

**Type**: Story · **Gaps**: G9 · cross-repo (site + support portal + VPS + DNS + M365)

**Manual preconditions (owner).**
1. M365: rename/alias `support@big-emotion.com` → `b2b@big-emotion.com` (keep `support@` as receiving alias during transition).
2. DNS: create `b2b.big-emotion.com` A/CNAME → the OVH VPS (same target as `support.`); keep `support.` during transition.
3. Provide the support-portal repository URL/path — it is a **separate repo** deployed on the same VPS; its Traefik labels/compose and public-URL config are **not discoverable from this repo** (nothing in `deploy/` or `next.config.ts` references `support.big-emotion.com`).

**Locked decisions.** Public name of the client area = `b2b.big-emotion.com`; old host 301s to the new one at the Traefik level; certificates via the existing Let’s Encrypt resolver.

**Scope.** Support-portal repo/VPS: Traefik router rule + redirect middleware, portal branding/config referencing its own URL, portal mail sender if it uses `support@`. This repo: `src/content/site.ts:36` CTA href; `src/components/site-header.test.tsx:28,41`; word-level `support` references beyond the two href sites are comments/naming only (`src/content/site.ts:31` comment, `src/lib/rate-limit.ts:4-5` comment, `src/lib/mail.ts:5` comment, `src/app/api/support/` route path) — keep the API route path as-is (renaming would break the portal caller) and update the comments opportunistically.
**Acceptance criteria.**
* Given https://b2b.big-emotion.com, when opened, then the client portal loads with a valid certificate.
* Given https://support.big-emotion.com, when opened, then a 301 lands on the b2b host.
* Given the site header, when rendering “Espace client”, then it links to the b2b host (tests updated).
* Given mail sent to `support@`, when received, then it reaches the `b2b@` mailbox.

**Affected files.** this repo: `src/content/site.ts`, `src/components/site-header.test.tsx`; support-portal repo: Traefik labels/compose, app config; VPS DNS/M365 (owner).

---

## Local DA track (no site deploy)

### D1 — Word document template
Build `BIG_EMOTION_document.dotx` (Word template) per Brand Guidelines p.14 “EN TETE DOCUMENT”: logo block top-left on the cover header, BBH (Hegarty) headings, Bricolage body, footer with B! monogram + contact block. **Blocked on the vector logo.** Contact-block address rule: `hello@big-emotion.com` once C1’s mailbox exists; if built before C1, use `contact@` and re-export as part of C1’s rollout. Deliver to `~/Documents/BIG_EMOTION/templates/`. Fonts must be embedded or installed locally (BBH + Bricolage TTFs from Google Fonts). Acceptance: opening the template in Word shows branded styles (Title/Heading1-3/Normal) and prints correctly in B&W.

### D2 — Email signature (HTML) + installation
**Blocked on the vector logo.** Reproduce the p.14 “MAIL SIGN” block as robust email HTML (tables, inline styles, **embedded base64 PNG logo — locked default**, keeping this track deploy-free; a hosted `https://big-emotion.com/brand/…` PNG only after A2 ships `public/brand/`; system-font fallback since most clients won’t load BBH): logo + `hello@big-emotion.com · big-emotion.com · @big-emotion on socials · +33 7 03 676 43 22`. **Graph caveat**: Outlook signatures (roaming signatures) have **no supported public Graph API** — plan manual installation (Outlook settings paste) or document the OWA path; verify what the connected ms365 MCP actually permits before promising automation. Depends on C1 for the address.

### D3 — PowerPoint template (cover + closing page)
`BIG_EMOTION_deck.potx` per p.14 “COUV PPT” (lemon cover, centered logo, text placeholders) and “DER PPT” (full-bleed lemon logo on white) + a basic content layout. **Blocked on the vector logo.** Same font-embedding note as D1. Acceptance: opening the `.potx` in PowerPoint and creating a new deck shows cover, content and closing layouts with branded placeholders and embedded/registered fonts.

### D4 — Business card (deferred — owner said it can wait)
Print-ready PDF per p.14 (front lemon: logo + INFOS block; back black: vertical lemon logo), 85×55 mm + 3 mm bleed, CMYK. Blocked on the vector logo.

### D5 — Brand asset cleanup & exports
Archive the obsolete identity (`Logos_ByTailorBrands/`, 2023 `logo_*.png/jpg`, Nov-2025 `favicon*.ico`) into `~/Documents/BIG_EMOTION/_archive-old-identity/`; export the new logo (from the designer’s vector) as the standard kit: SVG + PNG (6 cm Word, 10 cm PPT, favicon .ico/.png sizes) in the allowed color variants; store under `~/Documents/BIG_EMOTION/Logo_2026/`. Blocked on the vector logo.

---

## Enablement

### E1 — Keep agent docs true while the redesign lands
After each Phase-1/2 ticket merges: update `AGENTS.md` (fonts paragraph, wordmark/logo paragraph, hero/scroll behavior, pages/nav architecture, mail addresses) and prune stale comments (e.g. `layout.tsx:14-15` BBH note). Standing rule for every ticket above: its Definition of Done includes the AGENTS.md touch when it changes something AGENTS.md states.

### E2 — Confluence spec sync
Once the owner validates this backlog: run `/bigemotion-spec` to append the Pending REQ/DEC/ARCH entries mirroring the “Locked decisions” of each ticket (notably: BBH adoption, logo asset contract, real-pages IA, Prismic integration, i18n strategy, hello@/b2b@ renames) and create the SWBE tickets from these drafts via the template.
