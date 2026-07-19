<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# BIG EMOTION website

Marketing site for the BIG EMOTION agency (`big-emotion.com`). Migrated off WordPress/Divi. Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, served as a standalone Next.js app in a Docker container behind Traefik on the owner's OVH VPS (see `deploy/` and ADR 0005).

## Commands

Package manager is **pnpm**.

```bash
pnpm dev                                  # dev server at http://localhost:3000
pnpm lint                                 # ESLint (flat config)
pnpm test                                 # Vitest, single run
pnpm test:watch                           # Vitest, watch mode
pnpm vitest run src/components/wordmark.test.tsx   # single test file
pnpm vitest run -t "name of the test"     # single test by name
pnpm build                                # standalone build -> .next/standalone
```

Run `pnpm lint && pnpm test && pnpm build` before committing. `pnpm build` is part of the gate because the standalone build fails on things dev mode tolerates. This same gate also runs as a required check on every pull request to `main` (`.github/workflows/ci.yml`).

With pnpm ≥ 10, a fresh clone must approve the `sharp` and `unrs-resolver` postinstall scripts once (`pnpm approve-builds`) or the install errors out. The resulting `pnpm-workspace.yaml` is intentionally NOT committed: its syntax varies across pnpm majors and pnpm 9 (still used locally) rejects it — the VPS keeps its own untracked copy.

## Hard constraints

- **Standalone output** (`output: "standalone"` in `next.config.ts`): marketing pages are SSG (pre-rendered at build time); API routes and future `/espace` routes run dynamically on the Node.js server. `next/image` optimisation is active.
- **No SSR-only platform APIs in components**: Server components are fine; keep `"use client"` for anything that needs browser APIs.
- **Mobile-first.** Design follows `brand/big-emotion-brand-guidelines.pdf`; colors/type come from the tokens in `src/app/globals.css` (`--color-lemon`, `--color-tangerine`, `--color-lyon`, `--color-brutal`, `--color-ink`, `--color-paper`) — never hardcode brand values in components.
- `trailingSlash: true` and the legacy-URL 301s in `next.config.ts` `redirects()` preserve old WordPress URLs/SEO — don't break them.
- Keep it KISS. All docs/comments in English.

## Architecture

**One-page scroll site.** `src/app/page.tsx` composes `Hero` + the section components from `src/components/sections/` (Approach, Cases, Culture); Contact is the footer. Navigation is anchor-based (`/#approach`, `/#cases`, …) — there are no other routes, so "adding a page" usually means adding a section + nav entry.

**All copy lives in `src/content/site.ts`** — a typed, `as const` module (nav, manifesto, services, cases, team, contact details). Components stay declarative and import from it; never inline marketing copy in a component. Long-form content (case-study write-ups, legal) is planned for MDX later.

**Server components by default.** Only `site-header.tsx` and `contact-form.tsx` are `"use client"`. UI animations are CSS-only (e.g. the manifesto marquee) — there is no animation library. The single exception is the hero 3D scene, which uses Three.js imperatively (no react-three-fiber); see `docs/adr/0005-motion-stack.md`.

**Fonts are self-hosted** woff2 files committed under `src/app/fonts/` (loaded via `next/font/local`), so builds are offline-reproducible and no visitor request hits Google. Sourced from `@fontsource-variable/*`.

**Server behavior (redirects, headers) lives in `next.config.ts`**, not in `.htaccess` (removed). The HTTP→HTTPS redirect is a Traefik middleware (`deploy/docker-compose.yml`). Do not add `.htaccess` — there is no Apache.

**`public/contact.php`** is a legacy reference kept for SWBE-31 (the `/api/contact` route that will replace it). It is NOT executed by the Node.js container. The contact form (`src/components/contact-form.tsx`) is broken until SWBE-31 ships.

**Health check** at `/api/health` (see `src/app/api/health/route.ts`) — returns `{"status":"ok"}`.

**Everything in `public/` ships verbatim as static assets**, served by the standalone Next.js server. Server behavior belongs in `next.config.ts` (redirects, headers, rewrites) or `deploy/` (Traefik labels, container config) — not in `public/`.

**Deploy** = push a `v*` release tag (cut via `/bigemotion-release`); a merge to `main` no longer deploys (ADR 0006). `.github/workflows/deploy-production.yml` lints, tests, builds a Docker image, ships it as a gzip tarball via SCP to the OVH VPS, loads it, and restarts the container. Deploys queue (never cancel an in-flight one), and `workflow_dispatch` with a `ref` input redeploys/rolls back to any known-good tag or commit. `deploy/deploy.sh` (SSH to the VPS, git pull + `docker build` + `docker compose up`) is the break-glass fallback for a GitHub/Actions outage. The Dockerfile, compose file, and this script are versioned in `deploy/`.

**Preview** = `.github/workflows/deploy-preview.yml` — currently incompatible with standalone output (expects static export + basePath). Needs updating as a follow-up to ADR 0005.

**Decisions are recorded in `docs/adr/`** — 0001 (why static export; superseded), 0002 (email deliverability: SPF/DKIM/DMARC), 0003 (OVH VPS: Docker/Traefik; Apache/PHP part superseded), 0004 (GitHub Actions deploy; rsync step + push-to-main trigger superseded), 0005 (standalone Docker, this architecture), 0006 (deploy on a `v*` tag, not push to main). Add an ADR when making a decision of that scale.

## Testing

Vitest + Testing Library on jsdom, `globals: true`, alias `@` → `src/`. Tests are colocated with what they test (`*.test.tsx` / `*.test.ts` next to the source). Test behavior through the rendered output and user interactions, not implementation details.
