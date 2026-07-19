# BIG EMOTION — Production Readiness Audit

Date: 2026-07-19
Commit audited: `f1972b9` (main, tag `v0.1.1`)
Method: read-only. Source, versions, tags, and deploy config were not modified.

> Architecture note: this audit was run after the migration to **standalone
> Next.js + Docker + Traefik** (ADR 0005) and **tag-triggered CI deploy** (ADR
> 0006). The audit skill predates that migration (it still assumes static
> export + Apache/PHP + rsync/`.htaccess`); every check below was re-mapped to
> the architecture as it actually is on disk, per the skill's "report the actual
> state" rule.

---

## 1. The four questions

**1. Is the project production-ready?** — **Conditional.**
The **marketing site** (the live product) is production-ready and already shipping:
`v0.1.1` is deployed, the standalone build compiles (14/14 static pages), lint is
clean, the test suite is green in CI, and the deploy pipeline is tag-gated, queued,
rollback-capable, and smoke-checked. **One legal blocker** stands between it and a
fully compliant public launch: **mentions légales are absent** (see Q2). The
**`/espace` client area and contact form** are *not* functionally complete — the
shared mail transport is stubbed (throws in production, blocked on SWBE-37), the
`/api/contact` route (SWBE-31) is unshipped, and `deploy/env.template` omits the
`AUTH_SECRET` the auth code requires. Those are unreleased features, not live-site
regressions, but they are not shippable today.

**2. Is it legally compliant (RGPD/LCEN)?** — **No — one hard gap.**
- Self-hosted fonts only, **no Google Fonts CDN** — ✅ (`next/font/local`, grep clean).
- **No third-party trackers** loaded by default — ✅ (no gtag/analytics/hotjar/clarity/doubleclick).
- **Mentions légales present and reachable** — ❌ **absent**. No SIRET, legal form,
  address, publication director, or hébergeur anywhere in `src/`, and no
  `/mentions-legales` route in the tree. **LCEN art. 6-III requires this on any
  commercial site**, independent of RGAA. This is the compliance blocker.
- Contact-form / auth PII retention — proportionate (hashed-IP rate-limit file, 1 h
  retention in the legacy `contact.php`; in-memory magic-link store; a signed,
  HttpOnly session cookie carrying only `{email, clientId}`).
- **RGAA does not apply** — BIG EMOTION is a private agency, not a public authority.

**3. Security posture?** — **Strong craft, one latent gap.**
Security headers (HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy`, `Permissions-Policy`) ship from `next.config.ts`; CSP is
deliberately absent and documented. The magic-link auth (SWBE-27) is textbook:
single-use `randomBytes(32)` tokens with a 15-min TTL, anti-enumeration neutral
responses, HMAC-SHA256 signed HttpOnly/Secure/SameSite session cookies with
`timingSafeEqual`, and fail-closed decoding. Deploy SSH uses pinned `known_hosts`;
the Dockerfile runs non-root; no secrets are committed. **Gaps:** the public
`/api/auth/request-link` endpoint has **no rate limiting** (email-bomb /
enumeration-timing vector once mail is live), CI Actions are pinned by **mutable
major tag, not SHA**, there is **no Dependabot**, and one **moderate CVE**
(`postcss`, transitive) is outstanding.

**4. Is the score close to 8–9/10?** — **7.8 / 10. Close, not there.**
The three gaps that would close the distance:
1. Add **mentions légales** (LCEN) — the single biggest lift (D2 6→8+).
2. **Supply-chain hygiene bundle**: Dependabot + SHA-pin Actions + `postcss` override
   + fix `env.template` (D8 6→8+).
3. **Rate-limit `request-link`** and set a **mobile payload budget** for the 3D scene
   (D1 + D7).

---

## 2. Overall score

**7.8 / 10** — A genuinely well-built marketing site with high craft in auth,
accessibility, architecture, and code quality, held back from 8–9 by a legal gap
(mentions légales), supply-chain hygiene debt, a materialised 3D payload risk, and
one latent pre-auth rate-limit gap.

## 3. Score per domain

| # | Domain | Score | One-line basis |
|---|--------|:-----:|----------------|
| 1 | Application security | 8 / 10 | Textbook auth + headers + non-root container; `request-link` unthrottled, no CSP |
| 2 | RGPD / privacy | 6 / 10 | Fonts/trackers clean; **mentions légales absent** (LCEN blocker) |
| 3 | Accessibility (craft) | 9 / 10 | Full landmarks + skip link, `:focus-visible`, reduced-motion on every animation, WebGL fallback |
| 4 | Architecture & standalone integrity | 9 / 10 | `output: standalone`, 301s intact, copy centralised, **0 P0/0 P1 hardcoded values** |
| 5 | Code quality | 9 / 10 | Lint clean; comments justify, names carry domain meaning; server/client split respected |
| 6 | Correctness & tests | 8 / 10 | 80 tests pass, behaviour-driven, CI-gated; stale `out/` artifact pollutes local runs |
| 7 | Performance | 7 / 10 | Self-hosted fonts + image optimiser + CSS animations; **3D scene payload unbudgeted** |
| 8 | Supply chain + release/deploy | 6 / 10 | Deploy pipeline strong; no Dependabot, Actions unpinned, 1 moderate CVE, `env.template` drift |

Mean = (8+6+9+9+9+8+7+6) / 8 = **7.8 / 10**.

## 4. Strengths

- **Magic-link auth is production-grade** (`src/lib/magic-link.ts`, `session.ts`):
  single-use replay-safe tokens, anti-enumeration, HMAC-signed fail-closed sessions,
  `timingSafeEqual`, constant naming discipline.
- **Accessibility craft** (`layout.tsx`, `globals.css`): `<header>/<nav>/<main>/<footer>`
  landmarks, "Aller au contenu" skip link, WCAG `:focus-visible` ring, and
  `prefers-reduced-motion` honoured for *every* animation (marquee, load screen, scene
  loader, scroll cue). The 3D hero degrades to a static wordmark when WebGL is absent —
  and both paths are tested.
- **Constant discipline** (`src/components/scene/states.ts`): the entire scene
  choreography is lifted into named `STATES`/`CAMERA`/`MATERIAL` with an explicit
  "never hardcode inline" guard. The hardcoded-values scan found **zero** P0/P1.
- **Deploy pipeline** (`deploy-production.yml`): `v*`-tag-gated (ADR 0006),
  `workflow_dispatch` rollback, `cancel-in-progress: false` (queues, never cancels),
  lint+test before the Docker build, pinned `known_hosts`, and a smoke check that
  asserts the `/api/health` JSON body (not just a 200).
- **Clean separation**: all copy in `src/content/site.ts`; security headers and 301s in
  `next.config.ts`; non-root multi-stage `Dockerfile`; no committed secrets.

## 5. Gaps and risks

### Domain 1 — Application security
- **P1 — `src/app/api/auth/request-link/route.ts` has no rate limiting.** `rate-limit.ts`
  exists and is wired into `conversation-token` (5/min, auth-gated) but *not* into this
  **public, pre-auth** endpoint, which mints tokens and (once SWBE-37 lands) sends mail.
  Unbounded → email-bomb + enumeration-timing vector + in-memory token-store growth.
  Fix: `checkRateLimit` keyed on client IP, as the legacy `contact.php` already does.
- **P2 — No CSP** (documented tradeoff in `next.config.ts`: Next's inline bootstrap
  `<script>` needs a per-build nonce/hash). Residual XSS-mitigation gap; acceptable and
  deliberate, but track a nonce-based CSP as a follow-up.

### Domain 2 — RGPD / privacy
- **P0 (legal) — Mentions légales absent.** No legal identification in `src/` and no
  legal route. LCEN art. 6-III blocker for a live commercial site. Source it from a new
  `legal` block in `site.ts` and render a `/mentions-legales` (or footer) section.
- **P2 — No privacy policy / cookie notice.** Only a strictly-necessary auth cookie
  today (no consent required), but a policy will be needed once `/espace` and the contact
  form collect PII in production.

### Domain 3 — Accessibility
- No blocking gaps. Watch: verify `alt` text on any future `next/image` content (the site
  is largely typographic today) and keep contact/login form labels associated.

### Domain 4 — Architecture & standalone integrity
- **P2 — Brand hex duplicated in OG/icon generators.** `src/app/opengraph-image.tsx:18`
  and `src/app/apple-icon.tsx:21` hardcode `#f2ff26` instead of `var(--color-lemon)`.
  **Justified exception** — `next/og` `ImageResponse` (Satori) renders at build time with
  no access to CSS custom properties — but it leaves a drift risk if the brand lemon ever
  changes. Lift to a shared `LEMON` constant re-exported from one place.
- **P2 — Stale "static export" comments** in `layout.tsx` (l.10–11), `globals.css`
  (l.52–53), and `public/contact.php` (header) — superseded by standalone (ADR 0005).
- **P2 — Doc drift**: AGENTS.md says "only `site-header.tsx` and `contact-form.tsx` are
  `use client`"; there are now **four** (`+ login-form.tsx`, `+ scene-canvas.tsx`), all
  justified. Update the doc.

#### Hardcoded values (P0/P1)
**None.** The Step 3.5 scan (`src/**/*.{ts,tsx}`, excluding tests) found **0 P0 and 0 P1**.
Runtime tuning constants are all lifted and named — `states.ts` (`STATES`, `CAMERA`,
`MATERIAL`, `computeFit`), `session.ts` (`SESSION_TTL_MS`), `magic-link.ts`
(`TOKEN_TTL_MS`), `conversation-token/route.ts` (`RATE_LIMIT`, `TOKEN_TTL_MS`). No
image-size, truncation, or breakpoint literals in logic. **No penalty applied to Domain 4.**

### Domain 5 — Code quality
- Only the stale "static export" comments above. Otherwise exemplary.

### Domain 6 — Correctness & tests
- **P2 — Stale `out/htaccess.test.ts` fails local `pnpm test`.** `out/` is gitignored
  leftover cruft from the pre-migration static-export era; it reads a removed
  `public/.htaccess`. Vitest has **no `include`/`exclude` scoping**, so it picks the file
  up locally. Invisible in CI (fresh checkout has no `out/`), but a dev who once ran the
  old build sees a red suite that could mask a real failure. Fix: scope vitest `include`
  to `src/**` (or exclude build dirs) and/or `rm -rf out/`.
- Real suite: **80 tests pass, 19/20 files pass** after a clean `pnpm install`. Note: the
  local `node_modules` was stale (missing `three`/`gsap`/`lenis`), which fails both build
  and test until `pnpm install` runs — an environment artifact, not a code defect.

### Domain 7 — Performance
- **P1 (watch) — 3D hero payload is unbudgeted.** The scene pulls Three.js + GLTFLoader +
  DRACOLoader + GSAP + Lenis + `/models/scene.glb` onto the landing page. This is exactly
  the mobile-first payload risk to guard: heavy WebGL bundle + GLB over 4G on a 320px
  phone. The WebGL fallback protects capability, not bytes. Define a payload budget and
  measure the scene's transfer/parse cost on mobile.
- Fundamentals are good: self-hosted `woff2` (`display: swap`), the `next/image`
  optimiser is now active (standalone; `unoptimized` removed), CSS-only marquee/load
  screen, `.next/cache` restored in CI.

### Domain 8 — Supply chain + release/deploy
- **P1 — CI Actions pinned by mutable major tag, not SHA.** `ci.yml`,
  `deploy-production.yml`, `deploy-preview.yml`, `claude*.yml` use `@v4`/`@v1`.
  `deploy-production.yml` runs with `DEPLOY_SSH_KEY` — highest blast radius. Note:
  `ferry-router.yml` **already SHA-pins** `actions/checkout` — the pattern is known, just
  applied inconsistently.
- **P1 — No `.github/dependabot.yml`.** npm dependencies are not auto-monitored.
- **P1 — `deploy/env.template` is out of sync with the code.** It omits **`AUTH_SECRET`**
  (required by `session.ts`; production auth throws/fails-closed without it) and documents
  **`SMTP_*`** vars that no current code reads (mail is stubbed → M365 Graph per SWBE-37,
  not SMTP). Also undocumented: `PORTAL_BASE_URL` (optional).
- **P2 — 1 moderate CVE**: `postcss@8.4.31` (CVE-2026-41305, XSS via unescaped
  `</style>`), transitive via `next@16.2.9`. Low real impact (no user-CSS parsing).
  Fix: pnpm `overrides` to `>=8.5.10`, or await a Next bump.
- **P2 — `deploy-preview.yml` incompatible with standalone.** Still expects the
  static-export `/preview` sub-folder model; non-functional under Docker. Tracked as an
  ADR 0005 follow-up (SWBE-4).
- **P2 — No `lint:tokens` script.** Brand-hex enforcement is manual grep; two literals
  already slipped into the OG/icon generators (D4).
- **P2 — ADR 0005 numbering collision**: `0005-motion-stack.md` and
  `0005-nextjs-standalone-docker.md` share a number; AGENTS.md's "ADR 0005" is ambiguous.
  Renumber one.

## 6. Legal compliance (RGPD / LCEN)

| Check | Status | Evidence |
|-------|:------:|----------|
| Self-hosted fonts, no Google Fonts CDN | ✅ | `next/font/local` in `layout.tsx`; grep for `fonts.googleapis/gstatic` in `src/` clean |
| No third-party trackers by default | ✅ | grep for gtag/analytics/hotjar/clarity/facebook/doubleclick clean |
| Mentions légales present & reachable (LCEN 6-III) | ❌ | No SIRET/address/directeur de publication in `src/`; no legal route in tree |
| Contact/auth PII retention proportionate | ✅ | hashed-IP rate-limit file (1 h), in-memory token store, signed HttpOnly session cookie |
| RGAA accessibility declaration | N/A | Private agency, not a public authority |

**Verdict:** technically privacy-respecting by construction (no CDN fonts, no trackers),
but **not LCEN-compliant** until mentions légales are published.

## 7. Security posture

Strong engineering with one latent gap and supply-chain hygiene debt.

**Strengths**
- Headers: HSTS (`max-age=31536000; includeSubDomains`), `X-Frame-Options: SAMEORIGIN`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` (geolocation/camera/microphone/browsing-topics off).
- Auth: single-use `randomBytes(32)` magic-link tokens (15-min TTL, unconditional
  delete → replay-safe), anti-enumeration neutral responses, HMAC-SHA256 signed
  HttpOnly/Secure/SameSite=lax session cookie, `timingSafeEqual`, fail-closed decoding.
- `conversation-token` is auth-gated (401) and rate-limited (5/min/user); logout is
  POST-only (CSRF-safer).
- Deploy SSH uses pinned `known_hosts` (never `StrictHostKeyChecking=no`); Dockerfile
  runs as non-root `nextjs`; no secrets committed (`env.template` is placeholders).

**Gaps**
- `request-link` (public, pre-auth) is unthrottled — **P1**.
- CI Actions unpinned (mutable tags), no Dependabot, 1 moderate CVE — **P1/P2** (Domain 8).
- No CSP (documented, deferred) — **P2**.
- `AUTH_SECRET` undocumented in `env.template` — a config gap that fails auth closed in
  prod — **P1** (Domain 8).

## 8. Deploy consistency

Re-mapped to the standalone Docker / tag-deploy model (ADR 0005/0006).

| Location | Value | Status |
|----------|-------|--------|
| `package.json` `.version` | `0.1.1` | canonical |
| `next.config.ts` `output` | `standalone` | match (ADR 0005) |
| `next.config.ts` `trailingSlash` | `true` | match (SEO invariant) |
| Legacy WordPress 301s | 4 rules + trailing-slash variants (`contactez-nous`, `les-membres`, `case-study-mamiezi`, `case-study-adolebatisseur`) | match |
| `deploy-production.yml` trigger | `push: tags: v*` + `workflow_dispatch(ref)` | match (ADR 0006 — no push-to-main deploy) |
| `deploy-production.yml` concurrency | `cancel-in-progress: false` | match (queues, never cancels) |
| `deploy-production.yml` smoke check | asserts `/api/health` JSON body | present |
| `deploy.sh` break-glass marker | header documents CI-primary + manual fallback | present |
| `Dockerfile` | multi-stage `node:22-alpine`, non-root `USER nextjs`, standalone | hardened |
| CI Actions SHA-pinning | mutable `@v4`/`@v1` (except `ferry-router` checkout) | **MISSING** |
| `.github/dependabot.yml` | absent | **MISSING** |
| `deploy/env.template` completeness | omits `AUTH_SECRET`; lists unused `SMTP_*` | **DRIFT** |
| `deploy-preview.yml` | expects static-export `/preview` | **INCOMPATIBLE (tracked)** |
| `CHANGELOG.md` / tags | Keep-a-Changelog; `v0.1.0`, `v0.1.1` present | match (bigemotion-release) |
| `pnpm audit` (moderate) | 1 moderate (`postcss`) | **1 open** |

## 9. Prioritized action list

| # | P | Action | Anchor |
|---|---|--------|--------|
| 1 | P0 | Publish **mentions légales** (company, SIRET, address, directeur de publication, hébergeur) — source from `site.ts`, render a `/mentions-legales` or footer section | LCEN 6-III; AGENTS "RGPD" |
| 2 | P1 | Rate-limit `POST /api/auth/request-link` (key on client IP) before SWBE-37 makes mail live | `rate-limit.ts`; SWBE-27 |
| 3 | P1 | Fix `deploy/env.template`: add `AUTH_SECRET` (+`PORTAL_BASE_URL`), drop unused `SMTP_*` | `session.ts`; SWBE-37 |
| 4 | P1 | Add `.github/dependabot.yml` (npm, weekly) | AGENTS "supply chain" |
| 5 | P1 | SHA-pin all CI Actions (`ci.yml`, `deploy-production.yml`, `deploy-preview.yml`, `claude*.yml`) — mirror `ferry-router.yml` | Domain 8 |
| 6 | P1 | Set and measure a **mobile payload budget** for the 3D scene (Three/GSAP/Lenis/GLB) | ADR 0005; revamp program |
| 7 | P2 | pnpm `overrides` → `postcss@>=8.5.10` (CVE-2026-41305) | `pnpm audit` |
| 8 | P2 | Scope vitest `include` to `src/**` (or exclude build dirs); `rm -rf out/` | Domain 6 |
| 9 | P2 | Ship SWBE-31 (`/api/contact`) + SWBE-37 (M365 Graph sender) to make the contact form + auth mail functional | AGENTS; `mail.ts` |
| 10 | P2 | Lift the OG/icon brand hex to a shared `LEMON` constant | `opengraph-image.tsx`, `apple-icon.tsx` |
| 11 | P2 | Update `deploy-preview.yml` for standalone (drop the static-export `/preview` assumption) | ADR 0005 follow-up; SWBE-4 |
| 12 | P2 | Renumber one of the two ADR 0005 files (e.g. motion-stack → 0007) | `docs/adr/` |
| 13 | P2 | Refresh stale "static export" comments and the "only 2 use client" note in AGENTS.md | `layout.tsx`, `globals.css`, AGENTS.md |
| 14 | P2 | Add a `lint:tokens` script to enforce brand-hex discipline automatically | chancellerie parity |
| 15 | P2 | Track a nonce-based CSP as a follow-up | `next.config.ts` header comment |

## 10. Conclusion

The BIG EMOTION site is **well-engineered** — the auth flow, accessibility craft,
architecture, and code quality are all 9-caliber, and the deploy pipeline is genuinely
production-grade (tag-gated, queued, rollback-capable, smoke-checked). It scores
**7.8 / 10**. Three things separate it from the 8–9 target: a **legal blocker**
(mentions légales, which is the only thing gating a compliant public launch of the
already-live marketing site), a **supply-chain hygiene bundle** (Dependabot, SHA-pinned
Actions, the `postcss` CVE, and the `env.template` drift), and a **materialised
performance risk** (the unbudgeted 3D payload on mobile). The `/espace` client area and
contact form are cleanly built but not yet functional — mail transport is stubbed pending
SWBE-37 — which is expected and tracked, not a regression. Close the legal gap and the
supply-chain bundle and this site clears 8.5.
