# Ferry article redesign — Direction B (Neon Brutalist, brand-evolved)

Visual reference for the blog-article redesign spec. Direction B was chosen over
Direction A (editorial serif) and Direction C (terminal/minimal). It becomes the
redesign system for **all** blog articles, not just the Ferry piece.

## Files

- `direction-b.html` — the self-contained maquette (mobile-first, responsive). Open
  it and resize the viewport: single column < 768px, hero + board side-by-side ≥ 1200px.
  It carries its own inline CSS + one `IntersectionObserver` (no build, no animation
  library).
- `direction-b-mobile.png` — 390px render.
- `direction-b-desktop.png` — 1280px render.

> The PNGs capture the hero + signature board (the focal content). The lower
> "Cinq agents" list and thesis sticker are entrance-reveal-gated (`opacity:0` until
> scrolled into view), so they read as blank in a full-page screenshot — open the HTML
> to see them animate in.

## What Direction B keeps and repairs

- **Keeps:** the electric `lyon` (#0024CC) + `lemon` (#F2FF26) identity and a heavy
  condensed display face. In the maquette that face is `Impact` as a proxy; the real
  implementation uses `font-display` = **BBH Hegarty** (DEC-023), which has an
  ASCII-only cmap — keep display-slot copy unaccented.
- **Repairs:** a demoted H2 tier, a promoted lede, a rotated thesis pull-quote, the
  failing black-on-blue header (2.12:1) replaced by a solid `ink` bar, and one
  content-true motion (a card slides across the board → a reviewed PR appears).

## Motion

CSS keyframes + one `IntersectionObserver`, `transform`/`opacity` only, honouring
`prefers-reduced-motion` (final state, no animation). This is deliberately distinct
from the home page's GSAP + Lenis scroll stack (ADR 0005 / DEC-005) — see DEC-029.

## Source

Generated from the redesign report at
`launch-your-agent/my-agent/output/ferry/redesign.html` (§06, Direction B).

Spec: Confluence REQ-035 / REQ-036, DEC-028 / DEC-029, ARCH-018 · Jira Epic + 3 Stories.
