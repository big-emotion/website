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

pnpm prismic:push                         # publish local content models to Prismic
pnpm prismic:check                        # fail if local models and Prismic have drifted
pnpm prismic:pull <id>                    # rapatriate a model created in the dashboard
pnpm prismic:codegen                      # regenerate prismicio-types.d.ts from the models
pnpm prismic:seed-cases fr-fr             # seed an empty repo with the four sector case studies
pnpm prismic:seed-cases fr-fr --repair    # rewrite existing published studies to match the seed
pnpm slicemachine                         # Slice Machine UI, pointed at PRISMIC_REPOSITORY_NAME
```

`pnpm build` needs `PRISMIC_REPOSITORY_NAME` and `PRISMIC_ACCESS_TOKEN` (see `.env.example`) — it pre-renders the case studies and fails fast without them.

Run `pnpm lint && pnpm test && pnpm build` before committing. `pnpm build` is part of the gate because the standalone build fails on things dev mode tolerates. This same gate also runs as a required check on every pull request to `main` (`.github/workflows/ci.yml`).

With pnpm ≥ 10, a fresh clone must approve the `sharp` and `unrs-resolver` postinstall scripts once (`pnpm approve-builds`) or the install errors out. The resulting `pnpm-workspace.yaml` is intentionally NOT committed: its syntax varies across pnpm majors and pnpm 9 (still used locally) rejects it — the VPS keeps its own untracked copy.

## Hard constraints

- **Standalone output** (`output: "standalone"` in `next.config.ts`): marketing pages are SSG (pre-rendered at build time); API routes and the `/espace` client area run dynamically on the Node.js server. `next/image` optimisation is active.
- **No SSR-only platform APIs in components**: Server components are fine; keep `"use client"` for anything that needs browser APIs.
- **Mobile-first.** Colors/type come from the tokens in `src/app/globals.css` (`--color-lemon`, `--color-tangerine`, `--color-lyon`, `--color-brutal`, `--color-ink`, `--color-paper`) — never hardcode brand values in components.
- **The brand charter is `brand/BRAND.md`** — read it before writing anything a visitor sees (colour, type, copy, photography, layout rhythm). It transcribes the designer's `brand/big-emotion-brand-guidelines.pdf` (also exported page by page to `brand/pages/*.jpg`, because an agent can read an image and not a PDF) into rules that can be grepped and reviewed. The `bigemotion-brand` skill loads it on demand. Three of its rules are tests rather than prose: `src/app/globals.css.test.ts` fails the build if a palette hex drifts from the charter or a seventh colour appears, `src/content/site.test.ts` fails if accented copy lands in a `font-display` slot (DEC-023 — all three BBH cuts share the same ASCII-only cmap), and `src/content/tutoiement.test.tsx` fails on any `vous`/`votre`/`vos` or second-person-plural verb in the French copy, since the charter prescribes tutoiement. `BRAND.md` ends with the known charter-vs-site divergences; add to that table rather than editing the charter to match the code.
- `trailingSlash: true` and the legacy-URL 301s in `next.config.ts` `redirects()` preserve old WordPress URLs/SEO — don't break them. The `source` URLs are the invariant; their destinations track wherever that content now lives (they point at the real section routes since SWBE-21). `next.config.ts` must stay wrapped in `createNextIntlPlugin()` — the plugin copies `trailingSlash` into an env var the next-intl middleware reads when normalising its own redirects.
- Keep it KISS. All docs/comments in English.

## Architecture

**Two surfaces: a localized marketing site + an authenticated `/espace` client area.** The marketing surface is `src/app/[locale]/`: `page.tsx` is the scroll experience — six full-viewport `data-scene` panels over the fixed 3D `SceneCanvas` — and `approach/`, `cases/`, `culture/`, `contact/` are real routes carrying the detail sections from `src/components/sections/`. Navigation is route-based, not anchors. "Adding a marketing page" means adding a route under `[locale]/` plus a `nav` entry in the content module.

**Routed FR/EN locales (next-intl).** `/` serves **French** (the default, unprefixed) and `/en/…` serves English, via `localePrefix: "as-needed"` — see `docs/adr/0007-routed-i18n-fr-default.md` and Confluence DEC-024 / REQ-030 / ARCH-017. `src/i18n/` holds it: `locales.ts` (the list, no next-intl import, so content and tests can depend on it), `routing.ts` (next-intl config; `localeDetection: false` — `/` must always be French, never negotiated), `request.ts` (per-request messages), `navigation.ts` (**locale-aware `Link`/`usePathname` — use these, never `next/link`, for internal links**), and `urls.ts` (canonical/hreflang/OG URL builders that apply `trailingSlash`, which next-intl's own `getPathname` does not).

`[locale]` is a top-level dynamic segment, so **there is no single root layout**: `src/app/[locale]/layout.tsx` and `src/app/(auth)/layout.tsx` each own an `<html>`/`<body>`, both delegating the document chrome to `src/app/document-shell.tsx`. Every page and layout under `[locale]` must call `setRequestLocale(locale)` before any next-intl call, or the route silently drops out of SSG.

**All copy lives in `src/content/site.ts`** — a typed module split into `content[locale]` (everything a visitor reads, authored per locale) and module-level exports for what is locale-invariant (`site`, `clients`, `personalityAxes`, `socialHandle`, `espaceB2bHref`). `messages/{fr,en}.json` is reserved for **UI affordances only** — aria labels, form microcopy, the skip link. Never inline marketing copy in a component; never put marketing copy in the message JSON. `src/content/site.test.ts` enforces the display-font ASCII rule and locale parity (matching slugs, hrefs, scene ids) in both locales. Long-form content (case-study write-ups, legal) is planned for MDX later.

**Server components by default.** The `"use client"` components are `site-header.tsx`, `contact-form.tsx`, `scene/scene-canvas.tsx`, and `(auth)/login/login-form.tsx`. Most UI animation is CSS-only. The hero is the exception: `scene/scene-canvas.tsx` drives a Three.js scene imperatively (no react-three-fiber), scroll-linked via **GSAP `ScrollTrigger`** with **Lenis** smooth scroll, decoding a Draco-compressed GLB from self-hosted `public/draco/`. See `docs/adr/0005-motion-stack.md`. GSAP + Lenis are the only animation libraries — reach for CSS first; don't add a third. Its six keyframes live in `scene/states.ts`; the home page's six panels carry the same six ids in the same order, and `src/content/site.test.ts` asserts they stay in sync.

**Fonts are self-hosted** woff2 files committed under `src/app/fonts/` (loaded via `next/font/local` in `src/app/document-shell.tsx`), so builds are offline-reproducible and no visitor request hits Google. Sourced from the `@fontsource*` packages. The display face ships as BBH's **three width cuts** — Bogle (condensed), Hegarty (regular), Bartle (extended) — because the charter makes mixing them within one headline the signature; use `font-display-condensed` / `font-display-extended` as modifiers inside a `.font-display` block. A browser only fetches a cut a page actually sets text in. All three carry the same ASCII-only cmap, so DEC-023 applies to every one of them.

**Server behavior (redirects, headers) lives in `next.config.ts`**, not in `.htaccess` (removed). The HTTP→HTTPS redirect is a Traefik middleware (`deploy/docker-compose.yml`). Do not add `.htaccess` — there is no Apache.

**The contact form works (SWBE-31 shipped).** `src/components/contact-form.tsx` posts to `/api/contact`; `api/contact/handler.ts` validates (zod) and rate-limits, then sends via the shared `lib/mail.ts` Graph seam. `public/contact.php` is the *retired* PHP original, kept only as a behavioural reference (rate-limit parity, field names) — it is NOT executed by the Node.js container and can go once nothing references it.

**Auth & espace client (in progress).** Passwordless magic-link sign-in for provisioned client editors: `POST /api/auth/request-link` mints a single-use token (`lib/magic-link.ts`, 15-min TTL, in-memory) for an allowlisted email and mails it via `lib/mail.ts`; the `(auth)/verify` route exchanges the token for an HttpOnly, HMAC-signed session cookie (`lib/session.ts`, `AUTH_SECRET`, 30-day TTL); `(auth)/logout` clears it. `src/proxy.ts` (Next.js 16 renamed `middleware` → `proxy`) guards `/espace/:clientId` — no session → redirect to `/login`; wrong client → **404**, never 403, so it can't confirm another client's space exists. Next allows only one proxy file, so it also hosts locale routing: `/espace`, `/login`, `/logout`, `/verify` and `/api` branch out **before** next-intl runs and stay French-only, outside the `[locale]` segment (REQ-030); everything else is locale-routed. The allowlist is code-defined in `src/config/clients.ts` (one email ↔ one `clientId`, validated at module load) — a new client is a code change + deploy, no DB. Anti-enumeration is a hard requirement: request-link always returns the same neutral response whether or not the email is provisioned.

**Shared server libs live in `src/lib/`.** `mail.ts` is the single transactional-mail seam (Microsoft Graph, OAuth2 client-credentials; logs-and-resolves stub with no creds in dev, throws in prod) shared by contact, magic-link, and future escalations — same M365 tenant app as the support portal. `rate-limit.ts` holds two throttles: fixed-window `checkRateLimit` (auth link + support conversation-token routes) and `createInMemoryRateLimiter` (the contact form's per-interval + hourly cap, ported from `contact.php`). Both stores are in-memory (one container instance); Redis arrives with Portal 5 (SWBE-30).

**Prismic (SWBE-24, SWBE-80) — git is the source of truth for the content model, Prismic for the content.** Case studies are the one content type that has left `site.ts`: `case_study` documents feed `/cases` (the sector cards) and `/cases/[uid]` (the detail pages).

**Publishing is deploy-free.** Pages are pre-rendered, every Prismic query is cached under the `prismic` cache tag, and `POST /api/revalidate` — the webhook Prismic calls on publish — drops that tag so the next request regenerates the page. Neither route pins `dynamic`; adding `force-static` back would freeze the output until the next deploy and undo this (SWBE-80 / DEC-021 supersedes SWBE-24's rebuild-to-publish caveat).

The webhook authenticates with a **shared secret, not a signature** — Prismic does not sign webhook bodies, it puts the plaintext secret in the JSON payload, so `PRISMIC_WEBHOOK_SECRET` is a bearer credential. The comparison is constant-time and **fails closed**: with the variable unset the route rejects everyone rather than revalidating for anyone. It is runtime-only — the build never reads it, so it belongs in the VPS `.env` (which `deploy/docker-compose.yml` passes through via `env_file`), never in a Docker build arg.

Revalidation is deliberately **coarse: one tag for all Prismic content**. A cache tag must be attached when the request is issued, before the response reveals which documents came back, so per-document tags would need Next's Cache Components (`cacheTag`) — which this app does not enable, and which is also why `@prismicio/next`'s `cacheTagPrismicPages` / `revalidatePrismicPages` helpers are unusable here. Any publish regenerates every Prismic-backed page: a few extra regenerations, never a stale one.

**Preview**: `GET /api/preview` opens a draft-mode session and redirects to the document via the link resolver in `src/prismicio.ts`; `GET /api/exit-preview` closes it; `<PrismicPreview>` in `src/app/[locale]/layout.tsx` loads the toolbar on every page. Those two paths are `<PrismicPreview>`'s defaults, so renaming them means passing `updatePreviewURL`/`exitPreviewURL` too. SSG survives because `getPreviewRef` bails before reading cookies when draft mode is off — only a browser carrying `__prerender_bypass` renders dynamically, so previewing never changes what the public sees.

Models live in the repo, never in the dashboard: custom types under `customtypes/<id>/index.json`, shared slices under `src/slices/<Name>/{model.json,index.tsx}` with the registry in `src/slices/index.ts`. Edit the JSON, `pnpm prismic:push`, then `pnpm prismic:check` (exits non-zero on drift, including dashboard-only orphans — `pnpm prismic:pull` brings those back into git). `prismicio-types.d.ts` is generated by `pnpm prismic:codegen` and is eslint-ignored — never hand-edit it; regenerate after any model change. `slicemachine.config.json` is generated from `PRISMIC_REPOSITORY_NAME` by `scripts/gen-slicemachine-config.mjs` and is **not committed**, so the UI can never open a repository the toolchain is not targeting.

Locales are mapped explicitly in `src/prismicio.ts`: route `fr` → Prismic `fr-fr`, route `en` → `en-us`. A study with no document in the requested locale 404s rather than falling back, so an untranslated draft cannot leak through the other language.

The card order on `/cases` comes from the `display_order` number field, not from publication dates — the studies were seeded in one release, so their timestamps tie and date ordering would vary between builds of identical content. Keep the values spaced (10, 20, 30…) so a study can be slotted in without renumbering, and keep them consistent across locales or `/cases` and `/en/cases` will disagree.

**Two Migration API traps**, both hit while seeding this pilot. Creating a document is a two-pass operation (create, then patch the content); when the second pass fails, the document survives as an **empty shell** that later publishes as a blank card — `pnpm prismic:seed-cases <lang> --repair` rewrites those in place. And an explicit `null` for an image field is rejected outright, so an absent cover must be omitted from the payload rather than nulled.

**Accent caveat:** case study titles and `kind` land in `font-display` slots, and BBH Hegarty has an ASCII-only cmap (DEC-023). `src/content/site.test.ts` guards that rule for `site.ts` copy but cannot reach Prismic — an editor typing "Médias" will silently get a mismatched fallback face. Keep display-slot copy unaccented when authoring in Prismic.

**Health check** at `/api/health` (see `src/app/api/health/route.ts`) — returns `{"status":"ok"}`.

**Everything in `public/` ships verbatim as static assets**, served by the standalone Next.js server. Server behavior belongs in `next.config.ts` (redirects, headers, rewrites) or `deploy/` (Traefik labels, container config) — not in `public/`.

**Deploy** = push a `v*` release tag (cut via `/bigemotion-release`); a merge to `main` no longer deploys (ADR 0006). `.github/workflows/deploy-production.yml` lints, tests, builds a Docker image, ships it as a gzip tarball via SCP to the OVH VPS, loads it, and restarts the container. Deploys queue (never cancel an in-flight one), and `workflow_dispatch` with a `ref` input redeploys/rolls back to any known-good tag or commit. The image build needs the Prismic credentials (`PRISMIC_REPOSITORY_NAME` as a repo variable, `PRISMIC_ACCESS_TOKEN` as a repo secret): the name rides in as a build arg, the token as a BuildKit `--secret` mount so it stays out of the image layers. `deploy/deploy.sh` (SSH to the VPS, git pull + `docker build` + `docker compose up`) is the break-glass fallback for a GitHub/Actions outage — it builds on the VPS, so the VPS `.env` must carry both Prismic variables too. The Dockerfile, compose file, and this script are versioned in `deploy/`.

**Branching: feature work targets `develop`, releases are cut from `main`.** Both automated paths open their PRs against `develop` — Ferry via the `FERRY_INTEGRATION_BRANCH` repo variable, `/bigemotion-ticket` via a hardcoded base — so branch from `origin/develop`, not `main`. `main` advances only when `develop` is promoted onto it, and only a `v*` tag on `main` deploys. **Promotion is manual and deliberately stays that way** — automating it was specified in ADR 0008 and then declined, so `promote-develop.yml` does not exist and should not be added without reopening that decision. Promote with `git merge --ff-only origin/develop && git push origin HEAD:main`; if `main` is not an ancestor of `develop`, merge `main` into `develop` first rather than forcing. `/bigemotion-release` precondition 6 refuses to tag while `develop` has commits `main` lacks, which is the backstop that catches a forgotten promotion. `ci.yml` gates pushes to both branches and PRs into either.

**Preview** = `.github/workflows/deploy-preview.yml` — currently incompatible with standalone output (expects static export + basePath). Needs updating as a follow-up to ADR 0005.

**Decisions are recorded in `docs/adr/`** — 0001 (static export; superseded), 0002 (email deliverability: SPF/DKIM/DMARC), 0003 (OVH VPS: Docker/Traefik; Apache/PHP part superseded), 0004 (GitHub Actions deploy; rsync step + push-to-main trigger superseded), 0005 (standalone Docker, this architecture), 0006 (deploy on a `v*` tag, not push to main), 0007 (routed FR/EN locales, French unprefixed at `/`), 0008 (automate develop → main promotion; superseded — declined, promotion stays manual). Heads-up: two files share number **0005** on disk — `0005-nextjs-standalone-docker.md` and `0005-motion-stack.md` (the Three.js/GSAP/Draco decision); a future ADR should renumber one. Add an ADR when making a decision of that scale.

## Testing

Vitest + Testing Library on jsdom, `globals: true`, alias `@` → `src/`. Tests are colocated with what they test (`*.test.tsx` / `*.test.ts` next to the source). Test behavior through the rendered output and user interactions, not implementation details.
