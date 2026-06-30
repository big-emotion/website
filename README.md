# BIG EMOTION — website

Marketing site for the **BIG EMOTION** digital agency (`big-emotion.com`).
Rebuilt from a WordPress/Divi site into a static Next.js app, following the
BIG EMOTION Brand Guidelines v1.0.

## Stack

- **Next.js 16** (App Router) exported as **static HTML** (`output: "export"`)
- **TypeScript** · **Tailwind CSS v4** · **Motion** (animations)
- Content authored in code today; long-form (case studies, legal) moves to MDX
- **Vitest** + Testing Library

No Node runtime in production: the build emits `out/` (plain HTML/CSS/JS), served
by the existing n0c (Apache/LiteSpeed) host. See `docs/adr/0001-static-nextjs-on-n0c.md`.

## Develop

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # unit tests
pnpm lint
pnpm build      # static export -> ./out
```

## Structure

```
src/
  app/         routes (App Router), global styles
  components/  layout, hero, load screen, wordmark
  content/     typed site copy (nav, contact, manifesto)
brand/         brand guidelines (design source of truth)
docs/adr/      architecture decision records
```

## Brand

Palette and type come from `brand/big-emotion-brand-guidelines.pdf`:
Lemon `#f2ff26` · Tangerine `#ff5200` · Lyon Blue `#0024cc` · Brutal Grey `#dbdbdb`
· Black · White. Display type approximates the brand "BBH" with Archivo; body is
Bricolage Grotesque.
