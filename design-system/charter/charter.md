# Brand charter — token reference

Transcribed from `brand/big-emotion-brand-guidelines.pdf` (v1.0, June 2026) into
the tokens actually shipped in `src/app/globals.css`. This file documents _why_
those tokens are what they are; the CSS is the enforceable source of truth —
components must reference the `--color-*` custom properties, never a raw hex
value (`AGENTS.md`, "Hard constraints").

## Color

| Token               | Hex       | Guideline name   | Usage                                                        |
| ------------------- | --------- | ---------------- | ------------------------------------------------------------ |
| `--color-lemon`     | `#f2ff26` | Lemon Yellow     | Signature accent — the brand's loudest color, used sparingly |
| `--color-tangerine` | `#ff5200` | Orange Tangerine | Secondary accent                                             |
| `--color-lyon`      | `#0024cc` | Deep Lyon Blue   | Secondary accent                                             |
| `--color-brutal`    | `#dbdbdb` | Brutal Grey      | Neutral / structural                                         |
| `--color-ink`       | `#000000` | Black            | Text, high-contrast surfaces                                 |
| `--color-paper`     | `#ffffff` | White            | Base background                                              |

Section-route accents (`src/components/subpage-accents.ts`, SWBE-22) assign one
of the three accent colors (lemon, tangerine, lyon) per route — never invent a
fourth.

## Type

| Token            | Font                                        | Role                                             |
| ---------------- | ------------------------------------------- | ------------------------------------------------ |
| `--font-display` | BBH Hegarty (self-hosted, `src/app/fonts/`) | Headlines, wordmark, anything in `.font-display` |
| `--font-body`    | Bricolage Grotesque (self-hosted)           | Body copy                                        |

The `.font-display` utility (`globals.css`) is the only sanctioned way to opt into
display type: uppercase, tight tracking (`-0.02em`), tight leading (`0.92`), weight 400. BBH Hegarty's cmap is **ASCII-only** (DEC-023) — display-slot copy must stay
unaccented in every locale, including editor-authored Prismic content.

## Spacing & layout

No dedicated spacing scale token exists yet — components use Tailwind's default
scale directly. Mobile-first: design and verify at 320–430px first, then
768–1199px, then ≥1200px (`AGENTS.md`).

## Motion

Not charter-owned tokens (no `--motion-*` custom properties exist); GSAP
ScrollTrigger + Lenis is the sanctioned stack (`docs/adr/0005-motion-stack.md`).
CSS-only animation is preferred where it suffices (see `marquee-x` /
`marquee-x-reverse` keyframes in `globals.css`).
