# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/big-emotion/website/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/big-emotion/website/releases/tag/v0.1.0
