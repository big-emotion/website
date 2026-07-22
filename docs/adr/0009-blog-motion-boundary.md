# 0009 — Blog article motion boundary: CSS + IntersectionObserver, not GSAP/Lenis

- Status: accepted
- Date: 2026-07-22
- Relates to: SWBE-191 (story), SWBE-201 (sub-task)
- Confluence: ARCH-018 (Architecture), DEC-029 (Decisions), REQ-035 (Requirements)

## Context

SWBE-191 adds the first figure to a blog article: a shared `PipelineBoard` Prismic
slice (`src/slices/PipelineBoard/`) rendering the Ferry "pipeline board" — Jira-style
lanes with a card that slides to the next lane as a reviewed-PR chip appears
(REQ-035, article figure capability).

The home page already has a motion stack: Three.js driven imperatively, scroll-linked
via GSAP `ScrollTrigger` with Lenis smooth scroll (ADR 0005). That stack exists to
choreograph one continuous, scroll-scrubbed 3D scene across six full-viewport panels.
A blog article figure is a different problem: one small, self-contained animation that
plays once when it scrolls into a normal (non-Lenis) document, then stops.

## Decision

Blog article motion — starting with `PipelineBoard` — uses **CSS keyframes**, triggered
by a **minimal `use client` `IntersectionObserver`** that only flips a `data-visible`
attribute the first time the figure enters the viewport, then disconnects. No GSAP,
no Lenis, no scroll-scrubbing: the motion contract is

- **transform and opacity only** — no layout-triggering properties,
- **one pass** — the observer disconnects after the first intersection, and the CSS
  animation uses `forwards` fill so nothing loops or resets,
- **`@media (prefers-reduced-motion: reduce)` renders the end state directly** — card in
  the last lane, PR chip visible — independent of whether the observer ever ran; the
  component additionally skips attaching the observer under this preference (belt and
  suspenders, not a substitute for the CSS override).

Implementation: `src/slices/PipelineBoard/index.tsx` (the trigger) and
`src/app/globals.css` (`.pipeline-board*` rules, keyed off `data-visible` and a
content-driven `--pipeline-lane-count` custom property so the slide distance is exact
regardless of how many lanes an editor adds).

### GSAP/Lenis — rejected for this use case

Reusing the home's GSAP `ScrollTrigger` would mean either running Lenis on article
pages too (a second smooth-scroll instance fighting the browser's native scroll on a
page that doesn't need it) or wiring `ScrollTrigger` without Lenis, which still pulls
in a ~50 kB dependency to do what a single `IntersectionObserver` callback and a CSS
`@keyframes` block already do. KISS: match the tool to the scope, as ADR 0005 already
did for react-three-fiber.

## Consequences

- The home page's motion stack (Three.js/GSAP/Lenis, ADR 0005) is unchanged and remains
  the only place those libraries are used.
- Any future article figure follows the same boundary: CSS + `IntersectionObserver`,
  transform/opacity only, one pass, reduced-motion renders the final state. A figure
  that genuinely needs scroll-scrubbing (not just "animate once on entry") would be a
  reason to revisit this ADR, not to reach for GSAP by default.
- `src/app/globals.css` keeps growing with each animated component rather than
  spawning a per-feature stylesheet; that mirrors how `.scene-*` and `.subpage-*` rules
  already live there.
