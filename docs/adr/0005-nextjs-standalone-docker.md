# 0005 — Switch to Next.js standalone output + Docker (supersedes static export)

- Status: accepted
- Date: 2026-07-18

## Context

ADR 0001 chose `output: "export"` as a temporary measure that fit the n0c
shared-hosting constraint (no Node runtime). ADR 0003 moved to a VPS with
Docker, but kept the static-export + Apache/PHP serving model. Owner decision
2026-07-16: the static export is now the blocker, not the solution — the
planned espace client (SWBE-27..30) requires API routes and SSR.

Constraints that pushed the switch now:

- `/espace` routes need server-side auth, session handling, and data fetching.
- `contact.php` (PHP running in `php:8.3-apache`) is the last PHP dependency;
  its replacement is a Next.js API route (SWBE-31).
- The Apache/PHP container was kept only for `.htaccess` rewrites and PHP mail.
  Both are replaceable in Next.js.

## Decision

- **`output: "standalone"`** in `next.config.ts`: Next.js emits a self-contained
  `server.js` at `.next/standalone`. Marketing pages remain SSG (pre-rendered at
  build time); only routes that opt into dynamic rendering (API routes, future
  `/espace`) require a live server.
- **Multi-stage Docker build** (`Dockerfile` at repo root):
  - Stage 1 (`builder`): `node:22-alpine`, pnpm install, `next build`.
  - Stage 2 (`runner`): `node:22-alpine`, copies `.next/standalone`,
    `.next/static`, and `public/`. Runs as a non-root `nextjs` user.
- **Traefik HTTP→HTTPS redirect** replaces the `.htaccess` RewriteRule.
  The middleware is declared in `deploy/docker-compose.yml` labels; no
  redirect logic lives in the Next.js app.
- **Legacy WordPress 301s** move from `.htaccess` to `next.config.ts`
  `redirects()`. **Security headers** move to `next.config.ts` `headers()`.
- **Deploy path**: CI (`deploy-production.yml`) builds the Docker image,
  saves it as a gzip tarball, SCPs it to the VPS, loads it under the
  `big-emotion:live` tag, and restarts the Compose service — no registry
  required, no VPS-side build (preserving ADR 0004's intent).
- **Break-glass** (`deploy/deploy.sh`): SSH to VPS, `git pull`,
  `docker build`, `docker compose up` — same secrets as before.
- **Health check** at `/api/health` replaces the HTTP-200 smoke check on `/`.

## Consequences

- `contact.php` no longer executes (no PHP runtime in the Node.js container).
  The contact form is broken until SWBE-31 ships the `/api/contact` route.
  The PHP file is kept in the repo as a reference for the API route author.
- `public/.htaccess` is removed; server behaviour is now split between
  `next.config.ts` (redirects, headers) and Traefik labels (TLS, HTTP→HTTPS).
- `next/image` optimisation is now active (no more `unoptimized: true`).
- The `deploy/image/` subtree (Apache/PHP Dockerfile + msmtp entrypoint) is
  deleted; its history remains in git.
- The preview workflow (`deploy-preview.yml`) still expects a static export
  with `basePath=/preview`. It will fail until updated — tracked as a
  follow-up to this ADR.
- Supersedes: ADR 0001's "host on n0c" and "static export" decisions.
  ADR 0003's Apache/PHP container decision. ADR 0004's rsync-over-SSH step
  (the rest of ADR 0004 — GitHub Actions trigger, concurrency, environments —
  remains in effect under this new deploy step).
