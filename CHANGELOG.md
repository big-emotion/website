# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/big-emotion/website/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/big-emotion/website/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/big-emotion/website/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/big-emotion/website/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/big-emotion/website/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/big-emotion/website/releases/tag/v0.1.0
