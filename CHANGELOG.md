# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.0] - 2026-07-23

### Added

- The `/blog` index is rebuilt on Direction B, the bold-brand hierarchy chosen
  over the editorial-serif and terminal directions. The old listing gave the
  page title and all eight articles the same lemon-on-blue treatment at near
  identical size, so nothing led; lemon is now spent on the hero alone, the
  newest post is promoted to a featured lead with excerpt and CTA, and the rest
  fall into a calm date-and-title index. Tangerine becomes the interaction
  accent (SWBE-190).
- Article titles move to the body face in sentence case. `font-display` forces
  uppercase and BBH Hegarty is ASCII-only (DEC-023), which mangled accented
  French titles — so this fixes the accent bug and carries the hero-versus-index
  hierarchy in the same change.
- Article pages gain a stepped hero: the previously-unused `ArticleHeader` is
  wired into the template so eyebrow, title and meta line are separated by size,
  weight and space, and the excerpt is promoted from a body-sized paragraph into
  a focal thesis-sticker pull-quote.
- A `PipelineBoard` figure slice for articles — dashed Jira lanes, a lemon card
  and a tangerine PR chip, all content-driven — with a card-to-PR entrance
  animation. Motion is CSS keyframes gated by one `IntersectionObserver`,
  deliberately not the home page's GSAP + Lenis stack; `prefers-reduced-motion`
  visitors get the end state and never attach an observer at all (SWBE-191,
  ADR/DEC-029).

### Fixed

- Article body copy now actually renders through the Direction B type scale.
  `ArticleSection` had been drawing body text with its own hardcoded size, so
  the 1.25 major-third scale never reached the run-on paragraphs it was added to
  break up. The `.article-prose` colors are also rebased onto paper/lemon/
  tangerine, since its one real consumer is the `lyon` article surface where the
  prior ink-based values were illegible.
- The article H1 reverts to its smaller clamp — it had been sized byte-identical
  to the giant lemon hero it was meant to replace.
- The header no longer falls back to `ink` over the blog's `lyon` surface
  (2.12:1, below the 4.5:1 AA floor). `blog` was missing from the accent map;
  it now uses the same lyon/paper pair as `culture` (~9.9:1).

## [0.6.0] - 2026-07-21

### Added

- Routed FR/EN locales: `/` serves French unprefixed and `/en/...` serves
  English, so the live French site and the eight legacy WordPress 301s stay at
  the root. Locale detection is off — `/` is never negotiated away from French
  (SWBE-21, ADR 0007).
- The home page is the scroll spine of the 3D scene: six full-viewport panels,
  one per keyframe, over the fixed canvas. Copy placement is derived from the
  wordmark's side-slide, so it cannot drift if the choreography is retuned
  (SWBE-21).
- Real routes for the sections — `/approach`, `/cases`, `/culture`, `/contact` —
  in both locales, since the six headline-only panels left the services grid,
  case studies, team, client wall and contact form with nowhere to live
  (SWBE-21).
- Accent hero band crowning each section route: giant title and lead on one
  side, photo on the other, over a per-page accent. Pointer tilt, scroll
  parallax and the staggered entrance are CSS transforms, all inert under
  `prefers-reduced-motion` — and the opt-out restores visibility rather than
  merely stopping the animation (SWBE-22).
- Photography for the four sub-page heroes. The designer's prototype JPEGs could
  not ship — two carried third-party trademarks and all four sat below the
  1600px floor — so they are AI-generated to read as photography, per the brand
  guidelines, with the prompts versioned in `docs/redesign/` (SWBE-91).
- The production 3D logo in the hero, replacing the placeholder that rendered
  nothing, plus the closing beat's handle and network sprite.
- Case studies move to Prismic, with git as the source of truth for the content
  model: custom types and shared slices live in the repo, pushed to the
  dashboard rather than authored in it (SWBE-24).
- Editor preview and publish-time revalidation, so publishing no longer needs a
  deploy. Every Prismic query is cached under one tag that `POST /api/revalidate`
  drops on publish (SWBE-80).
- The home page renders from a Prismic Slice Zone, delivering the first page
  through the page-builder (SWBE-81).
- Bilingual blog from Prismic — `article` and `author` types, the `/blog`
  listing and `/blog/[uid]` detail routes, nav entry, sitemap URLs and hreflang
  alternates built only for the locales an article actually exists in (SWBE-82).
- Long-form reading type scale and branded article components, so an article
  reads as BIG EMOTION rather than as browser defaults (SWBE-118).
- Article `category` taxonomy, stored as locale-neutral keys so French is not
  forced through the English listing (SWBE-119).
- Storybook catalogue and a `design-system/` layer transcribing the brand
  tokens, one spec and reference frame per part (SWBE-23).

### Changed

- The landing page no longer ships the 3D runtime up front. It renders the
  static wordmark and only imports Three.js/GSAP/Lenis once the hero model is
  present, taking ~203 KB gzip off the initial load (DEC-027).
- The client roster closes `/cases` instead of sitting mid-`/culture`, between
  the team and the personality slider, where a list of client names had nothing
  to corroborate. The work is shown first, the names back it up.
- Case studies are ordered by an explicit editorial field. The seeded studies
  share a publication timestamp, so date ordering was liable to differ between
  two builds of identical content.
- Hero photos are served from content-hashed URLs. Art direction replaces these
  files in place, keeping the filename, so a stable URL let browsers and CDNs
  serve the previous image after a deploy.

### Fixed

- Case study and article titles look like links. They carried `hover:underline`
  alone — lemon display type beside headings that are not clickable — so on a
  touch screen the affordance never appeared at all, and the titles were
  reported as dead.
- Blog dates no longer render in a mismatched typeface. The display face has an
  ASCII-only character set and a date built at runtime slipped past the guard
  that covers authored copy, so "21 FEVRIER 2019" fell back mid-word (DEC-023).
- The same accent rule is now enforced on Prismic-authored articles, where four
  had shipped with section headings rendering half in a fallback face. Section
  headings are display slots even though they are plain `<h2>` elements.
- The Approach and Cases heroes are lit faces rather than backlit silhouettes.
  Cropping the head out to keep logos out of frame read as menacing rather than
  energetic, against a brand moodboard that is faces and explicit joy
  throughout. Cases also leaves its crimson ground, which turned to sludge
  beside the tangerine band.
- The social handle is `@bigemotion`; `@bigemotionagency` does not exist.

### Security

- `POST /api/auth/request-link` is rate-limited per IP, rejecting over-limit
  callers before minting a token or sending mail. Mail delivery no longer blocks
  the response, closing a timing oracle that leaked whether an address was
  provisioned — which defeated the route's own anti-enumeration contract
  (REQ-034).

### Removed

- The in-house productions block on `/cases`. Each production now has a full
  article on the blog, so the two-line cards were telling the same story twice
  and worse.
- The footer band on the home page: the scroll story closes on its own final
  beat. Sub-pages keep theirs.

## [0.5.1] - 2026-07-21

### Fixed

- Funecap is spelled correctly in the client wall.
- Accented characters no longer render in a mismatched typeface. The display
  face ships an ASCII-only character set, so every `é`/`É` in display type
  silently fell back to another font — visible on the brand values, the founder
  names and the Approach headline. Copy that lands in display type is now
  written unaccented; body copy keeps correct French, which was never affected.
- The hero's "Scroll" cue is a link into the first section. It was a bare label
  that looked like a control and did nothing when clicked.
- The hero headline is centred.

## [0.5.0] - 2026-07-21

### Added

- Brand personality slider on the Culture surface, rendering the six axes of the
  brand book with a per-axis screen-reader alternative (SWBE-92).
- Client wall in Culture: the brands that trusted the agency, credited as
  scrolling typographic wordmarks rather than third-party logo files. Hovering
  pauses a band so it can be read; under reduced motion the wall reflows into a
  static grid instead of freezing mid-scroll and hiding the tail of the roster.
- Public profile links under each founder's name in Culture. Both LinkedIn links
  share a visible label, so an `aria-label` carries the owner's name (WCAG
  2.4.4).
- Project Standard among the in-house productions — the MIT-licensed Claude Code
  plugin that installs the agency's project standard on any repo.
- Per-call sending mailbox in the `src/lib/mail` Graph seam, so the contact relay
  can send as `hello@` while the portal default stays `MAIL_SENDER` (`espace@`),
  without forking the single send path (REQ-031).

### Changed

- BBH Hegarty is now the display face, replacing Archivo (DEC-023).
- Cases & Impact leads with headline numbers and describes the work by sector.
  The engagements behind them are under NDA, so no per-case figures are claimed.
- The public contact address is `hello@big-emotion.com` and the phone number is
  corrected. The change covers the whole contact path, not just the displayed
  link: the form notifies `hello@`, and both fallback copies point visitors there
  when a submission fails (SWBE-93, REQ-031/DEC-025).
- Marquee pacing is set per band. The manifesto ran at 321px/s and the client
  wall, whose track is half as wide, would have inherited twice that speed. The
  1.4s load-screen intro keeps its old rate or it would read as a frozen image.
- `deploy/env.template` now documents the `GRAPH_*` / `MAIL_SENDER` /
  `MAIL_FROM_NAME` variables the mail seam actually reads.

### Removed

- The two dead case-study cards (Mamiezi, AdoleBatisseur) — neither pointed at
  anything on the live site.
- The Archivo font files, retired with the display-face switch.
- The individual founder name in the footer: the agency answers as a team on that
  surface. Jean-Noé Kollo stays in Culture and as the schema.org founder, which
  are about who the agency is rather than how to reach it.

## [0.4.0] - 2026-07-21

### Changed

- The header call-to-action now points to `b2b.big-emotion.com`, the dedicated
  B2B space, instead of the on-site espace area (SWBE-94).
- The same call-to-action is labelled "Espace B2B" rather than "Espace client",
  matching the destination it now opens.

## [0.3.0] - 2026-07-19

### Added

- External "Espace client" call-to-action in the site header, linking clients to
  the authenticated espace area (SWBE-76).

## [0.2.0] - 2026-07-19

### Added

- Magic-link authentication for the espace client, backed by a provisioned
  client registry (no self-registration) (SWBE-27).
- Same-origin `POST /api/contact` route replacing the legacy `contact.php`:
  honeypot, per-IP rate limiting, and Zod validation, preserving the JSON (with
  JS) and 303-redirect (no-JS) contract of the old endpoint (SWBE-31). This
  restores the contact form flagged as non-functional in 0.1.0.
- Microsoft Graph mail transport in the shared `src/lib/mail` seam, powering
  both the contact relay and the magic-link emails from the M365 tenant — the
  same tenant app the support-agent portal uses (SWBE-31).

## [0.1.1] - 2026-07-19

### Fixed

- Hero 3D scene no longer overlays and hides the page content below the hero.
  The fixed scene layer is now a background underlay (negative z-index) behind
  the in-flow sections, its intended role (SWBE-77).

## [0.1.0] - 2026-07-19

### Added

- Initial production release of the BIG EMOTION marketing site — one-page scroll
  (Hero, Approach, Cases, Culture, Contact), migrated off WordPress/Divi to
  Next.js 16 (App Router) + TypeScript + Tailwind CSS v4.
- Scroll-driven 3D hero scene (Three.js, Draco-compressed GLB) with
  reduced-motion and no-WebGL fallbacks.
- Next.js standalone output served from a Docker container behind Traefik on the
  OVH VPS (ADR 0005).
- Tag-driven production deploy: pushing a `v*` tag builds the image in CI, ships
  it to the VPS, and restarts the container behind a `/api/health` smoke check
  (ADR 0006).

### Known issues

- The contact form is not functional yet: `public/contact.php` no longer runs
  under the Node.js container and its `/api/contact` replacement is not shipped
  (SWBE-31).

[Unreleased]: https://github.com/big-emotion/website/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/big-emotion/website/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/big-emotion/website/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/big-emotion/website/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/big-emotion/website/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/big-emotion/website/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/big-emotion/website/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/big-emotion/website/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/big-emotion/website/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/big-emotion/website/releases/tag/v0.1.0
