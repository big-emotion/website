# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/big-emotion/website/compare/v0.5.1...HEAD
[0.5.1]: https://github.com/big-emotion/website/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/big-emotion/website/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/big-emotion/website/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/big-emotion/website/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/big-emotion/website/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/big-emotion/website/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/big-emotion/website/releases/tag/v0.1.0
