<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# BIG EMOTION website

Static marketing site for the BIG EMOTION agency (`big-emotion.com`). Migrated off WordPress/Divi. Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, exported as static HTML and served from an Apache 2.4 + PHP 8.3 Docker container behind Traefik on the owner's OVH VPS (see `deploy/` and ADR 0003).

## Commands

Package manager is **pnpm**.

```bash
pnpm dev                                  # dev server at http://localhost:3000
pnpm lint                                 # ESLint (flat config)
pnpm test                                 # Vitest, single run
pnpm test:watch                           # Vitest, watch mode
pnpm vitest run src/components/wordmark.test.tsx   # single test file
pnpm vitest run -t "name of the test"     # single test by name
pnpm build                                # static export -> ./out
```

Run `pnpm lint && pnpm test && pnpm build` before committing. `pnpm build` is part of the gate because static export fails on things dev mode tolerates (SSR-only features, dynamic routes without `generateStaticParams`, etc.). This same gate also runs as a required check on every pull request to `main` (`.github/workflows/ci.yml`).

With pnpm ≥ 10, a fresh clone must approve the `sharp` and `unrs-resolver` postinstall scripts once (`pnpm approve-builds`) or the install errors out. The resulting `pnpm-workspace.yaml` is intentionally NOT committed: its syntax varies across pnpm majors and pnpm 9 (still used locally) rejects it — the VPS keeps its own untracked copy.

## Hard constraints

- **Static export** (`output: "export"` in `next.config.ts`): no SSR, no API routes, no server actions, no middleware. `next/image` is `unoptimized`. Anything dynamic goes to `public/contact.php` on the host or a client-side approach.
- **`contact.php` stays dependency-free** (plain PHP, no composer): it runs on PHP 8.3 in the site container and its `mail()` leaves through the container's msmtp relay (direct send to the Microsoft 365 MX — ADR 0003).
- **Mobile-first.** Design follows `brand/big-emotion-brand-guidelines.pdf`; colors/type come from the tokens in `src/app/globals.css` (`--color-lemon`, `--color-tangerine`, `--color-lyon`, `--color-brutal`, `--color-ink`, `--color-paper`) — never hardcode brand values in components.
- `trailingSlash: true` and the legacy-URL 301s in `public/.htaccess` preserve old WordPress URLs/SEO — don't break them.
- Keep it KISS. All docs/comments in English.

## Architecture

**One-page scroll site.** `src/app/page.tsx` composes `Hero` + the section components from `src/components/sections/` (Approach, Cases, Culture); Contact is the footer. Navigation is anchor-based (`/#approach`, `/#cases`, …) — there are no other routes, so "adding a page" usually means adding a section + nav entry.

**All copy lives in `src/content/site.ts`** — a typed, `as const` module (nav, manifesto, services, cases, team, contact details). Components stay declarative and import from it; never inline marketing copy in a component. Long-form content (case-study write-ups, legal) is planned for MDX later.

**Server components by default.** Only `site-header.tsx` and `contact-form.tsx` are `"use client"`. Animations are CSS-only (e.g. the manifesto marquee) — there is no animation library.

**Fonts are self-hosted** woff2 files committed under `src/app/fonts/` (loaded via `next/font/local`), so builds are offline-reproducible and no visitor request hits Google. Sourced from `@fontsource-variable/*`.

**The one piece of server code:** `public/contact.php` receives the contact-form POST, validates, throttles abuse (honeypot + per-IP file-based rate limit), and sends mail with an aligned envelope sender. It answers JSON to `fetch()` and a `/?sent=…#contact` redirect to plain form posts, so the form works without JS. `src/components/contact-form.tsx` is its client counterpart — keep the two contracts in sync.

**Everything in `public/` ships verbatim to the web root**, including `.htaccess` (HTTPS redirect, legacy WordPress 301s, security headers, caching policy). Server behavior changes belong there, not in Next config — except proxy/TLS/mail concerns, which live in `deploy/` (Traefik labels, msmtp relay).

**Deploy** = push to `main`. `.github/workflows/deploy-production.yml` builds, lints, tests, then rsyncs `out/` into the container's bind-mounted `live/` web root over SSH and smoke-checks the live site; deploys queue (never cancel an in-flight one), and `workflow_dispatch` with a `ref` input redeploys/rolls back to any known-good commit. `/home/ubuntu/big-emotion/deploy.sh` (SSH to the OVH VPS, git pull + `pnpm build` + rsync) is the break-glass fallback for a GitHub/Actions outage — no longer the primary path. The container image, compose file, and this script are versioned in `deploy/`. For a staging copy in a subfolder, build with `NEXT_PUBLIC_BASE_PATH=/subfolder` (wired to `basePath` in `next.config.ts`).

**Preview** = `.github/workflows/deploy-preview.yml`, triggered manually (`workflow_dispatch`, required `branch` input) — builds that branch with `NEXT_PUBLIC_BASE_PATH=/preview` and rsyncs it to `live/preview/`, served at https://big-emotion.com/preview/. Not an auto-deploy: this lets the design revamp be reviewed on real hosting before merge without a second always-on deploy target drifting from production. `public/.htaccess` tags every `/preview` response `X-Robots-Tag: noindex` so it's never indexed, and `deploy/deploy.sh` excludes `/preview` from its rsync so a production deploy never wipes it. The `preview` GitHub environment (secret `DEPLOY_SSH_KEY`, vars `DEPLOY_HOST`/`DEPLOY_PORT`/`DEPLOY_USER`/`DEPLOY_KNOWN_HOSTS`) is a manual, owner-only setup step — same pattern as the `production` environment's manual preconditions.

**Decisions are recorded in `docs/adr/`** — 0001 (why static export; its n0c hosting part is superseded), 0002 (email deliverability: SPF/DKIM/DMARC owner actions on DNS), 0003 (OVH VPS: Apache+PHP container behind Traefik, direct-send mail), 0004 (GitHub Actions deploy on push to main; supersedes ADR 0003's manual-deploy part). Add an ADR when making a decision of that scale.

## Testing

Vitest + Testing Library on jsdom, `globals: true`, alias `@` → `src/`. Tests are colocated with what they test (`*.test.tsx` next to the component). Test behavior through the rendered output and user interactions, not implementation details.
