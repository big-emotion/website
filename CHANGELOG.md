# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.8.1] - 2026-07-24

### Fixed

- The four `/cases` sector cards no longer link their titles to `/cases/[uid]`,
  where the write-up is still a placeholder — the titles are plain headings
  until real client stories are published (restoring the link is a one-line
  change; the route and its Prismic documents are untouched).
- The brand personality slider on `/culture` now renders its six axis poles in
  French on the French page. The pole wording moved out of the locale-invariant
  `personalityAxes` export into `content[locale].personalityPoles`; on mobile
  the poles stack above a full-width line so the longer French labels
  ("Institutionnel") no longer clip at 320px.

## [0.8.0] - 2026-07-24

### Added

- The Playground: a localized SSG `/playground` gallery plus a per-effect route,
  built so an unopened effect costs 0 kB. A typed registry is the single entry
  point an effect registers through, an `EffectStage` lazy boundary defers the
  3D, and the home hero's studio rig was extracted so every effect inspects the
  same branded chrome wordmark (SWBE-211, REQ-037, DEC-030, ARCH-019).
- Two effects on that rig. LUMIERE spins the wordmark on a damped trackball and
  reveals a glint once the chrome holds a 6°/800ms key-light alignment
  (SWBE-215). POIDS LOURD is a grab/throw physics toy — semi-implicit Euler,
  elastic wall reflection, pointer-velocity throw and a gesture-gated device
  tilt, hand-rolled rather than pulling in an engine (SWBE-213, DEC-031). Both
  fall back to a text notice without WebGL or under reduced motion.
- A per-effect page frame with a colocated OG card, a native-share control with
  clipboard fallback, and effect URLs in the sitemap (SWBE-212, DEC-034).
  Hidden challenge badges with celebration and share variants land on top
  (SWBE-217).
- A collective play counter: a flat-file store with atomic temp+rename writes
  behind a narrow read/increment interface, a zod-validated rate-limited API
  route that never throws on a persistence failure, a client batcher that
  coalesces plays into one POST per flush window (`sendBeacon` on unload), and
  a chip that updates live off this visitor's own round-trip without polling
  (SWBE-216). The interface is deliberately narrow so SWBE-30 can back it with
  Redis later.
- Legal pages and cookie management, closing an LCEN art. 6-III gap the
  readiness audit had carried as P0 since v0.2.0: `/mentions-legales/`,
  `/politique-de-confidentialite/` and `/accessibilite/` in both locales, from a
  new footer row. They are `legal_page` Prismic documents, but Prismic cannot
  take them down — the renderer falls back to mandatory copy in
  `src/content/legal.ts` whenever a document is missing or its body is under a
  minimum floor, because the obligation does not pause while the CMS is empty.
  Consent is tarteaucitron, vendored and loaded on demand from the footer
  button; a test fails if a consent-gated service is registered while nothing on
  the site needs consent before it runs (SWBE-34).
- The brand charter becomes reviewable: `brand/BRAND.md` transcribes the rules,
  `brand/pages/*.jpg` carries the 15 PDF pages as images an agent can actually
  read, and a `bigemotion-brand` skill loads them on demand. The palette is now
  a test — `globals.css.test.ts` fails the build on a drifted hex or a smuggled
  seventh colour, because a doc nobody reads protects nothing.
- All three BBH width cuts are self-hosted. Only Hegarty shipped before, so no
  headline could set the condensed/regular/extended interplay the charter calls
  the signature; they are width modifiers inside a `.font-display` block, and a
  browser only fetches a cut a page sets text in. All three carry the same
  121-glyph ASCII-only cmap, so DEC-023 is untouched.
- The French copy is swept to tutoiement and the register is now enforced by
  `tutoiement.test.tsx`, which catches the pronoun-less second-person-plural
  verbs ("Revenez bientôt") that have nothing to grep for.
- The brand's real SVG logo lockup replaces the typographic placeholder in the
  marketing header, the espace/auth header and the footer. It draws
  `currentColor`, so each surface drives the mark instead of the file's
  hardcoded lemon. The favicon follows, drawing the "B!" from the real vectors —
  the full lockup is illegible at 16px.
- A three-part footer band — brand mark, social sprite, localized copyright —
  that adopts the surface of the hero it sits under, so `/contact` closes dark.
  The icon row stays unlinked while the profile URLs are unconfirmed (REQ-033).
- The current nav link and the inactive locale are dimmed and marked
  `aria-current="page"`. The dim is opacity on the existing accent, so it stays
  legible on every subpage accent and the visual state cannot diverge from what
  assistive tech announces (REQ-002).
- Each blog article draws one of nine WCAG-AA brand colour associations from the
  guidelines' ASSOCIATIONS board. Every page in the section reads three custom
  properties instead of naming tokens, and contrast is asserted against the
  palette read out of `globals.css` rather than restated in a comment. An
  article also gains the same way out a Playground effect has — one shared
  `BackLink`, not a copy.
- Section heroes are art-directed from the designer's own mood board, and the
  blog gets the stacked title/lead/photo band it never had. Only unmarked frames
  were eligible: several board shots carry another brand's mark, which is
  exactly what SWBE-91 had to replace.

### Changed

- The Approach cards lead with the two trades — conseil and sur-mesure — and
  sell the wow on top, instead of opening on a methodology card that said the
  same thing as the custom-development one. The Culture founders leave the
  static grid for a slow horizontal band on the client wall's marquee
  machinery; the repeated half is out of the accessibility tree, focus pauses
  the band, and reduced motion unwraps it back into the two-column grid.
- Both effects zoom three times deeper. Past the dolly floor the lens takes
  over — `resolveFraming` holds the camera still and narrows the field of view
  by whatever it stopped short of, preserving `distance * tan(fov/2)` so the
  wall and screen-to-world maths never learn about the split. The step became
  multiplicative at the same time.
- Zoom is reachable without a mouse. It was behind "hold a button and turn the
  wheel", a gesture that does not exist on a trackpad, and nothing on screen
  said so. There are now 44px on-screen controls, trackpad pinch (and Ctrl/Cmd +
  wheel), and the original hold-and-wheel untouched. A bare wheel still belongs
  to the page.
- Gallery cards play a sample of the effect they open on hover or focus, behind
  a dynamic import fired from the handler, so the gallery still ships no 3D
  until someone asks for it and touch pays for no WebGL context at all.
- CI gates on gitleaks, typecheck, formatting and Prismic model drift instead of
  running lint/test/build as one job. gitleaks is its own job so it reports in
  seconds even when the build is broken; the Prismic checks run only on
  develop → main, since model drift comes from an editor touching the dashboard,
  not from the diff under review. Husky, commitlint and lint-staged make the
  same surface enforceable locally, and the repository was given a Prettier
  baseline (mechanical — the reformat SHA is in `.git-blame-ignore-revs`).
- `THREE.Clock` is replaced by `THREE.Timer` across the three render loops;
  three r183 deprecated it and warned on every effect mount.

### Removed

- The BIG BANG effect, outright — directory, registry entry, badge copy and the
  burst preview motion the gallery card played, so no shader path survives as
  dead code.
- The full-screen `LoadScreen` marquee that scrolled twelve "B!G" words over the
  home page. The reference loader fades a solid lemon screen to reveal the 3D
  logo spinning into place, which `SceneCanvas` already does now that the hero
  model ships.

### Fixed

- The play counter was structurally stuck at zero: the effects dispatched
  `playground:interaction` and the batcher exposed `recordPlay`, but nothing
  subscribed. The metric is also renamed — "logos maltraités" read as violence
  rather than as play.
- The effect stages called `preventDefault` on every wheel event, taking the
  gesture from the document with no way to scroll back to the header.
- `playground` was missing from the accent ledger, so every Playground route
  closed on a lemon footer instead of its own grey.
- The OG card for a registered effect failed to render: satori rejects a `<div>`
  with more than one text child and no explicit display. Latent since SWBE-212,
  reachable only once `generateStaticParams` had a real effect to prerender.
- 47 type errors across six test files. Nothing here ever ran `tsc --noEmit` —
  `next build` only typechecks its own graph, which excludes tests. All fixes
  are test-side.
- ESLint no longer walks `.claude/worktrees`, where a parked second checkout's
  vendored Draco decoder failed `pnpm lint` for everyone.
- Agent pull requests no longer deadlock behind GitHub's manual "Approve and
  run" gate, which the 2026-06-11 change applies to `github-actions[bot]` runs
  and which both the reviewer and merger read CI status through.

### Security

- The site now loads no third-party script. `<PrismicPreview>` injected
  `static.cdn.prismic.io/prismic.js` on every page for every visitor; it mounts
  only inside a draft-mode session, keeping a small bootstrap so editors still
  enter preview exactly as before. This is also what made the cookie policy
  possible to state honestly.

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

[Unreleased]: https://github.com/big-emotion/website/compare/v0.8.1...HEAD
[0.8.1]: https://github.com/big-emotion/website/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/big-emotion/website/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/big-emotion/website/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/big-emotion/website/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/big-emotion/website/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/big-emotion/website/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/big-emotion/website/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/big-emotion/website/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/big-emotion/website/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/big-emotion/website/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/big-emotion/website/releases/tag/v0.1.0
