# BIG EMOTION — Production Readiness Audit

Date: 2026-07-21
Commit audited: `a66eec0` (main, tag `v0.5.1`) — working tree clean
Method: read-only. Source, versions, tags, and deploy config were not modified.

> Architecture note: the audit skill predates the migration to **standalone
> Next.js + Docker + Traefik** (ADR 0005) and **tag-triggered CI deploy** (ADR
> 0006) — it still assumes static export + Apache/PHP + rsync/`.htaccess`. Every
> check below was re-mapped to the architecture as it actually is on disk, per
> the skill's "report the actual state" rule.
>
> Scope note: this audits **`main`** — the surface that ships. `develop` is
> 6 commits ahead (Prismic, blog, Storybook, sub-pages, FR/EN locales) and is
> **not** covered here; see Domain 8 for why that gap is itself a finding.

---

## 1. The four questions

**1. Is the project production-ready?** — **Conditional.**
The marketing site is live and structurally sound: `v0.5.1` is deployed, `pnpm lint`
is clean, **156 tests across 29 files pass**, the standalone build compiles (15/15
pages), and the deploy pipeline is tag-gated, queued, rollback-capable and
smoke-checked against the `/api/health` JSON body. Three things stand between it and
"unreservedly ready":
1. **Mentions légales are still absent** — the same LCEN blocker as the 2026-07-19
   audit, now carried through four releases (`v0.2.0` → `v0.5.1`).
2. **The hero's 3D brand asset is a 92-byte placeholder**, so the signature chrome
   wordmark renders as *nothing* for the default visitor while 203 KB (gzip) of
   Three.js still ships to draw it.
3. **The `/espace` client area dead-ends**: a successful magic-link login redirects to
   `/espace/{clientId}`, a route that does not exist — it 404s.

**2. Is it legally compliant (RGPD/LCEN)?** — **No — one unchanged hard gap.**
- Self-hosted fonts only, **no Google Fonts CDN** — ✅ (`next/font/local`; grep clean).
- **No third-party trackers** loaded by default — ✅ (no gtag/analytics/hotjar/clarity/doubleclick).
- **Mentions légales present and reachable** — ❌ **still absent**. No SIRET, legal form,
  address, directeur de publication, or hébergeur anywhere in `src/`; no legal route in
  the build's 15-page manifest; `site-footer.tsx` carries only a copyright line.
  **LCEN art. 6-III requires this on a live commercial site.** This is the blocker.
- Contact/auth PII retention — proportionate (in-memory IP-keyed throttles, in-memory
  15-min magic-link store, a signed HttpOnly cookie carrying only `{userId, clientId}`).
- **RGAA does not apply** — private agency, not a public authority.

**3. Security posture?** — **Strong craft; one gap that got worse, not better.**
Headers, auth crypto, container hardening and secret hygiene are all genuinely good.
But the previously-*latent* rate-limit gap on `POST /api/auth/request-link` is now
**live-exploitable**, because the Microsoft Graph mail transport shipped in the
meantime. Worse, the same code path contains a **timing side-channel that defeats the
route's own documented anti-enumeration guarantee**: `await sendMail()` sits inline in
the request, so an allowlisted address costs a Graph round-trip while an unlisted one
returns immediately — identical body, very different latency. Supply-chain hygiene is
also unimproved: still no Dependabot, Actions still unpinned, and a **new high-severity
CVE** has appeared alongside the known moderate one.

**4. Is the score close to 8–9/10?** — **7.4 / 10. Slightly further away than in July.**
The score moved 7.8 → 7.4 not because the code got worse — the craft is, if anything,
better (tests nearly doubled, the Actions-pinning pattern is proven in `ferry-router`,
the compose-drift deploy bug was fixed) — but because **the previously-flagged gaps went
unaddressed across four releases while their severity increased**. The three moves that
close the distance:
1. **Publish mentions légales** (D2 6→8+) — still the single biggest lift.
2. **Rate-limit `request-link` and move the send off the request path** (D1 7→9).
3. **Ship the real GLB or drop Three.js from the landing bundle** (D7 6→8+).

---

## 2. Overall score

**7.4 / 10** — A well-engineered site whose craft (auth crypto, accessibility,
architecture, constant discipline) is 9-caliber, held back by one unfixed legal
blocker, a now-live auth abuse vector, 203 KB of gzipped 3D runtime rendering an empty
placeholder, and supply-chain hygiene that has not moved in two audits.

## 3. Score per domain

| # | Domain | Score | Δ | One-line basis |
|---|--------|:-----:|:--:|----------------|
| 1 | Application security | 7 / 10 | ▼1 | Textbook auth + headers + non-root; `request-link` unthrottled **with mail now live**, plus a confirmed enumeration timing oracle |
| 2 | RGPD / privacy | 6 / 10 | — | Fonts/trackers clean; **mentions légales absent** (LCEN blocker, 2 audits running) |
| 3 | Accessibility (craft) | 9 / 10 | — | Landmarks + skip link, `:focus-visible`, 4 reduced-motion blocks, per-axis SR text, WebGL fallback |
| 4 | Architecture & standalone integrity | 8 / 10 | ▼1 | `standalone` + 301s + centralised copy + **0 P0/0 P1 hardcoded values**; but `proxy` guards an `/espace` route that doesn't exist |
| 5 | Code quality | 9 / 10 | — | Lint clean; comments justify rather than narrate; names carry domain meaning |
| 6 | Correctness & tests | 8 / 10 | — | 156 tests pass (up from 80), build green; no test catches the empty-GLB or `/espace` dead-ends |
| 7 | Performance | 6 / 10 | ▼1 | 203 KB gzip Three.js on the landing page to render a **92-byte empty GLB** |
| 8 | Supply chain + release/deploy | 6 / 10 | — | Pipeline strong; no Dependabot, Actions unpinned, **new high CVE**, `develop` 6 commits ahead of `main` with no promotion owner |

Mean = (7+6+9+8+9+8+6+6) / 8 = **7.4 / 10**.

## 4. Strengths

- **Magic-link auth crypto is production-grade** (`src/lib/magic-link.ts`,
  `src/lib/session.ts`): single-use `randomBytes(32)` tokens deleted *unconditionally*
  on lookup (replay-safe even when expired), HMAC-SHA256 signed cookies verified with
  `timingSafeEqual`, and fail-closed decoding on every branch — missing secret, bad
  signature, malformed JSON, wrong field types, expiry.
- **`src/proxy.ts` returns 404, never 403**, for a cross-client `/espace` request, so the
  guard can't confirm another client's space exists — the anti-enumeration reasoning is
  applied consistently at the routing layer.
- **Constant discipline is exemplary** (`src/components/scene/states.ts`): the entire
  six-keyframe choreography, camera, and material config are named and exported with an
  explicit "never hardcode these inline" instruction. The Step 3.5 scan found **zero**
  P0/P1 hardcoded values across `src/**` — twice running.
- **Accessibility craft** (`layout.tsx`, `globals.css`, `personality-slider.tsx`):
  landmarks + "Aller au contenu" skip link, `:focus-visible` ring, **four** distinct
  `prefers-reduced-motion` blocks (marquee, load screen, scene loader, scroll cue), the
  decorative client wall reflowed rather than frozen under reduced motion, and a
  per-axis screen-reader sentence for a control that is otherwise purely visual.
- **Deploy pipeline** (`deploy-production.yml`): `v*`-tag-gated (ADR 0006),
  `cancel-in-progress: false`, `workflow_dispatch` rollback, and a smoke check that
  asserts the `/api/health` **JSON body** with `curl -L` — because `trailingSlash`
  308-redirects would otherwise let a bare 200 pass as healthy. The compose file is
  shipped **from the CI checkout**, with a comment explaining that reading the VPS's
  stale clone is exactly what broke the SWBE-26 cutover.
- **No secrets committed**; `deploy/env.template` holds placeholders only; the Dockerfile
  is multi-stage `node:22-alpine` running as non-root `nextjs`.

## 5. Gaps and risks

### Domain 1 — Application security

- **P0 — `POST /api/auth/request-link` is unthrottled and mail is now live.**
  `src/app/api/auth/request-link/route.ts` has no rate limiting, while
  `src/lib/rate-limit.ts` exports `checkRateLimit` and already protects
  `conversation-token` (5/min). Since the Graph transport shipped, this public,
  pre-auth endpoint sends real email. An attacker who guesses one provisioned address
  can flood that editor's mailbox and burn the tenant's Graph quota — the same app
  registration the support portal depends on, so the blast radius crosses products.
  *Was P1 "latent" in the 2026-07-19 audit; the mail transport landing made it live.*
  **Fix:** `checkRateLimit` keyed on the `X-Forwarded-For` client IP, exactly as
  `api/contact/handler.ts:49` already derives it behind Traefik.

- **P1 — The anti-enumeration guarantee is defeated by a timing side-channel.**
  `route.ts:16-25` awaits `sendMail()` *inside* the request. `mintMagicLinkToken`
  returns `null` for an unprovisioned address (`magic-link.ts:21`), so that path returns
  immediately; a provisioned address pays a full OAuth + `sendMail` round-trip to
  `graph.microsoft.com`. The response body is identical — the response *time* is not.
  The route's own comment calls neutrality "the whole anti-enumeration point", so this
  is a broken invariant, not a missing nice-to-have.
  **Fix:** don't await the send in the response path (fire-and-forget with error
  logging), or pad both branches to a fixed floor.

- **P2 — No CSP.** Documented tradeoff in `next.config.ts:54-55` (Next's inline bootstrap
  script needs a per-build nonce/hash). Deliberate and reasoned; leaves a residual
  XSS-mitigation gap. Note `layout.tsx:81-84` injects JSON-LD via
  `dangerouslySetInnerHTML` — safe today (the payload is built from the typed `site`
  module, not user input) but it is exactly the shape a CSP would otherwise cover.

### Domain 2 — RGPD / privacy

- **P0 (legal) — Mentions légales absent.** Unchanged since 2026-07-19 and now shipped
  through `v0.2.0`–`v0.5.1`. No legal identification in `src/`, no legal route among the
  15 built pages, and `site-footer.tsx:50-52` ends at `© {year} {site.name}`.
  LCEN art. 6-III blocker.
  **Fix:** add a `legal` block to `src/content/site.ts` (raison sociale, forme juridique,
  capital, RCS/SIRET, siège, directeur de publication, hébergeur = OVH + address) and
  render it as `/mentions-legales` plus a footer link.
- **P2 — No privacy policy.** Only a strictly-necessary auth cookie today (no consent
  banner required), but the contact form and `/espace` both process PII in production
  now that mail is live.

### Domain 3 — Accessibility

- No blocking gaps. The one thing to watch is a *consequence* of the empty GLB (D7): the
  default visual path renders no brand mark at all, while the reduced-motion / no-WebGL
  path correctly renders the static `<Wordmark>` fallback. The accessible fallback is
  currently richer than the default experience — the inverse of the usual failure, and
  harmless for AT (the scene is `aria-hidden`), but worth knowing.

### Domain 4 — Architecture & standalone integrity

- **P1 — `src/proxy.ts` guards a route that does not exist.** The matcher is
  `/espace/:path*` and `(auth)/verify/route.ts:20-22` redirects a *successfully*
  authenticated user to `/espace/${clientId}`. There is no `espace` directory under
  `src/app` and no `/espace` entry in the build manifest, so the happy path of the entire
  sign-in flow terminates in `not-found.tsx`. Expected for in-progress Portal work — but
  it is shipped, and no test covers it.
- **P2 — Brand hex duplicated in the OG/icon generators.** `src/app/opengraph-image.tsx:18`
  and `src/app/apple-icon.tsx:21` hardcode `#f2ff26`. **Justified exception** — `next/og`
  (Satori) renders at build time with no access to CSS custom properties — but the two
  copies can drift from `--color-lemon`. Lift to one shared exported constant.
- **P2 — Stale "static export" comment** in `layout.tsx:11` ("keeps the static export
  build offline-reproducible"), superseded by ADR 0005.
- **P2 — ADR 0005 numbering collision** persists: `0005-motion-stack.md` and
  `0005-nextjs-standalone-docker.md`. AGENTS.md's "ADR 0005" references are ambiguous.

#### Hardcoded values (P0/P1)

**None.** The Step 3.5 scan over `src/**/*.{ts,tsx}` (tests excluded) across all five
categories — Image & Asset Sizes, Truncation & Content Limits, Animation & Timing
Constants, Layout & Breakpoint Constants, Default Parameters — found **0 P0 and 0 P1**.

Every runtime knob is lifted and named: `states.ts` (`STATES`, `CAMERA`, `MATERIAL`,
`TAU`, `computeFit`), `scene-canvas.tsx` (`HOLD_DURATION`, `MOVE_DURATION`, `GLB_URL`,
`DRACO_DECODER_PATH`), `session.ts` (`SESSION_TTL_MS`), `magic-link.ts` (`TOKEN_TTL_MS`),
`rate-limit.ts` (`MIN_INTERVAL_MS`, `MAX_PER_HOUR`, `WINDOW_MS`),
`conversation-token/route.ts` (`RATE_LIMIT`, `TOKEN_TTL_MS`), `client-wall.tsx` (`HALF`,
derived not literal). The only bare numerals in logic are semantic midpoints and
identities (`position === 50` for a percentage axis centre, `|| 1` as a divide guard),
which the rubric explicitly skips. **No penalty applied to Domain 4.**

### Domain 5 — Code quality

- Lint clean. Comments consistently justify rather than narrate — the z-index rationale
  in `scene-canvas.tsx:284-290`, the compose-shipping incident note in
  `deploy-production.yml:74-81`, and the seamless-loop reasoning in `client-wall.tsx:3-8`
  are all load-bearing explanations a reader could not recover from the code.
- Only the stale static-export comment above detracts.

### Domain 6 — Correctness & tests

- **156 tests / 29 files pass** in 4.9 s (up from 80/20). Behaviour-driven through
  rendered output; colocated. The stale `out/htaccess.test.ts` failure from the previous
  audit is **resolved**.
- **P1 — Two shipped dead-ends have no test coverage.** `scene-canvas.test.tsx` mocks
  `GLTFLoader`, so nothing exercises the real 92-byte GLB → the suite is green while
  production renders an empty hero. Likewise nothing asserts where `/verify` actually
  lands. Both failures are invisible to CI by construction.
- Harmless noise: jsdom prints ~19 `HTMLCanvasElement.getContext()` warnings.

### Domain 7 — Performance

- **P1 — 203 KB (gzip) of Three.js ships to render nothing.** `public/models/scene.glb`
  is **92 bytes** — a valid but empty glTF container (`glTF` magic, total length `0x5c`),
  committed as a deliberate placeholder per `public/models/README.md` pending the
  designer's asset. Because `GLTFLoader.load` *succeeds* on it, `scene-canvas.tsx:265`
  sets status `"ready"` and the static `<Wordmark>` fallback is **not** rendered. The
  default visitor therefore downloads the largest chunk on the site —
  `750,015 B raw / 203,508 B gzip` — plus GSAP and Lenis, to display an empty canvas.
  This is the payload risk the previous audit flagged as "watch", now measured, and
  currently pure waste.
- **P2 — 764 KB of Draco decoder assets are dead weight in the repo and image.**
  `public/draco/` (512 KB JS + 192 KB wasm + 58 KB wrapper) is only fetched when a
  `KHR_draco_mesh_compression` primitive appears — which an empty GLB has none of. Not
  on the wire today, but shipped in every Docker image.
- Fundamentals are good: self-hosted woff2 (12 KB + 44 KB, `display: swap`), the
  `next/image` optimiser is active under standalone, animation is CSS-only outside the
  scene, and `.next/cache` is restored in CI.

### Domain 8 — Supply chain + release/deploy

- **P1 — CI Actions are still pinned by mutable tag, not SHA.** `ci.yml` (4),
  `deploy-production.yml` (3), `deploy-preview.yml` (3), `claude.yml` (2),
  `claude-code-review.yml` (2) all use `@v4`/`@v1`. `deploy-production.yml` runs with
  `DEPLOY_SSH_KEY` — the highest blast radius in the repo. `ferry-router.yml:51` already
  SHA-pins `actions/checkout@de0fac2e…`, so the pattern is proven, just not applied.
  *(Unchanged from the previous audit.)*
- **P1 — No `.github/dependabot.yml`.** 549 dependencies, unmonitored.
  *(Unchanged from the previous audit.)*
- **P1 — Release is blocked and the blocker has no owner.** `origin/develop` is **6
  commits ahead of `origin/main`** (SWBE-21/22/24/80/82/23 — the one-pager restructure,
  sub-pages, Prismic foundation + preview, the bilingual blog, and Storybook).
  `/bigemotion-release` refuses to tag while `develop` leads, and AGENTS.md records that
  the `main`←`develop` promotion "currently has no owner". Substantial reviewed,
  CI-green work is parked indefinitely.
- **P2 — 1 new high CVE + 1 known moderate.**
  - **high** `brace-expansion@1.1.15` (GHSA-3jxr-9vmj-r5cp, DoS) — transitive via
    `eslint > minimatch`, 70 paths. **Dev-only**, never in the runtime image; low real
    risk, trivially fixed by a pnpm `overrides` to `>=1.1.16`.
  - **moderate** `postcss@8.4.31` (GHSA-qx2v-qp2m-jg93, XSS via unescaped `</style>`) —
    transitive via `next@16.2.9`. No user-supplied CSS is parsed. *(Unchanged.)*
- **P2 — `deploy/env.template` still drifts from the code.** The unused `SMTP_*` block was
  correctly removed, but it still omits **`AUTH_SECRET`** (required by `session.ts:76`;
  auth throws on write and fails closed on read without it), **`PORTAL_BASE_URL`**
  (`request-link/route.ts:18` — without it magic-link URLs are built from the request
  origin), and **`AZURE_TENANT_ID`** (`mail.ts:35`, the documented tenant fallback).
- **P2 — `deploy-preview.yml` remains incompatible with standalone output** (still
  expects the static-export `/preview` sub-folder model). Tracked ADR 0005 follow-up.
- **P2 — No `lint:tokens` script.** Brand-hex discipline is manual grep; the two OG/icon
  literals (D4) are what slips through. Adding the script would make Step 3's scan
  automatic, as it is on the chancellerie project.
- Clean: no git-ref/`file:`/`link:` dependencies; no secrets committed; `.dockerignore`
  excludes `.env*`, `.git`, `docs/`, `deploy/`.

## 6. Legal compliance (RGPD / LCEN)

| Check | Status | Evidence |
|-------|:------:|----------|
| Self-hosted fonts, no Google Fonts CDN | ✅ | `next/font/local` in `layout.tsx:18-32`; grep for `fonts.googleapis`/`gstatic` in `src/` clean |
| No third-party trackers by default | ✅ | grep for gtag/analytics/hotjar/clarity/facebook.net/doubleclick in `src/` clean |
| Mentions légales present & reachable (LCEN 6-III) | ❌ | No SIRET/address/directeur de publication in `src/`; no legal route among 15 built pages; `site-footer.tsx:50` is copyright-only |
| Contact/auth PII retention proportionate | ✅ | In-memory IP throttles, 15-min in-memory token store, cookie carries only `{userId, clientId}` |
| RGAA accessibility declaration | N/A | Private agency, not a public authority |

**Verdict:** privacy-respecting **by construction** — no CDN fonts, no trackers, no
analytics, minimal retention. But **not LCEN-compliant** until mentions légales are
published, and that has now been true across four releases.

## 7. Security posture

Strong cryptographic and infrastructure craft, undermined by one abuse vector that
became live between audits and supply-chain hygiene that has not moved.

**Strengths**
- Headers from `next.config.ts:56-79`: HSTS (`max-age=31536000; includeSubDomains`),
  `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`
  (geolocation/camera/microphone/browsing-topics all denied).
- Auth: single-use tokens deleted unconditionally on lookup, HMAC-SHA256 sessions with
  `timingSafeEqual`, fail-closed on every decode branch, `httpOnly` + `secure` in prod +
  `sameSite: lax`, POST-only logout.
- `conversation-token` is auth-gated (401) **and** rate-limited (5/min/user).
- Contact route: honeypot → rate limit → zod validation, in that order, with the throttle
  ahead of parsing so malformed floods stay cheap.
- Deploy SSH uses pinned `known_hosts` (never `StrictHostKeyChecking=no`); non-root
  container; TLS terminated by Traefik with an HTTP→HTTPS permanent redirect.

**Gaps**
- `request-link` unthrottled **with live mail** — **P0** (email bomb + shared Graph quota).
- `request-link` timing oracle defeats its own anti-enumeration contract — **P1**.
- Actions unpinned, no Dependabot, 1 high (dev-only) + 1 moderate CVE — **P1/P2** (D8).
- `AUTH_SECRET` / `PORTAL_BASE_URL` / `AZURE_TENANT_ID` undocumented in `env.template` —
  a config gap that silently fails auth closed in production — **P2** (D8).
- No CSP — documented and deliberate — **P2**.

## 8. Deploy consistency

Re-mapped to the standalone Docker / tag-deploy model (ADR 0005 / 0006).

| Location | Value | Status |
|----------|-------|--------|
| `package.json` `.version` | `0.5.1` | canonical |
| Latest git tag | `v0.5.1` | match |
| `CHANGELOG.md` top entry | `## [0.5.1] - 2026-07-21` | match (Keep a Changelog) |
| `next.config.ts` `output` | `standalone` | match (ADR 0005) |
| `next.config.ts` `trailingSlash` | `true` | match (SEO invariant) |
| Legacy WordPress 301s | 4 routes × 2 (bare + trailing-slash) = 8 rules, targets verified | match |
| `deploy-production.yml` trigger | `push: tags: ["v*"]` + `workflow_dispatch(ref)` | match (ADR 0006 — no push-to-main deploy) |
| `deploy-production.yml` concurrency | `cancel-in-progress: false` | match (queues, never cancels) |
| `deploy-production.yml` smoke check | `curl -L` + asserts `"status":"ok"` body | present |
| Compose shipped from CI checkout | yes (SWBE-26 drift fix, commented) | match |
| `deploy.sh` break-glass marker | header documents CI-primary + outage-only fallback | present |
| `Dockerfile` | multi-stage `node:22-alpine`, non-root `USER nextjs` | hardened |
| Traefik HTTP→HTTPS redirect | `redirectscheme` middleware, `permanent=true` | match |
| CI Actions SHA-pinning | mutable `@v4`/`@v1` in 5 of 6 workflows | **MISSING** |
| `.github/dependabot.yml` | absent | **MISSING** |
| `deploy/env.template` completeness | omits `AUTH_SECRET`, `PORTAL_BASE_URL`, `AZURE_TENANT_ID` | **DRIFT** |
| `main` vs `develop` | `develop` +6 commits; promotion has no owner | **BLOCKED** |
| `deploy-preview.yml` | expects static-export `/preview` | **INCOMPATIBLE (tracked)** |
| `pnpm audit` (moderate+) | 1 high (`brace-expansion`, dev-only) + 1 moderate (`postcss`) | **2 open** |

## 9. Prioritized action list

| # | P | Action | Anchor |
|---|---|--------|--------|
| 1 | P0 | Publish **mentions légales** (raison sociale, RCS/SIRET, siège, directeur de publication, hébergeur OVH) — add a `legal` block to `site.ts`, render `/mentions-legales` + footer link | LCEN 6-III; unfixed since 2026-07-19 |
| 2 | P0 | **Rate-limit `POST /api/auth/request-link`** on client IP via `checkRateLimit` — mail is live, this is an active email-bomb vector | `rate-limit.ts`; `handler.ts:49` |
| 3 | P1 | Move `sendMail()` off the `request-link` response path (or pad both branches) to close the enumeration timing oracle | `request-link/route.ts:16-25` |
| 4 | P1 | Ship the real Draco GLB **or** lazy-load/drop Three.js until it exists — 203 KB gzip currently renders an empty canvas | `public/models/README.md`; ADR 0005 |
| 5 | P1 | Build the `/espace/{clientId}` route (or stop redirecting there) so a successful login doesn't 404 | `verify/route.ts:20`; `proxy.ts` |
| 6 | P1 | Assign an owner to the `main`←`develop` promotion; 6 CI-green commits are parked | AGENTS.md "Branching"; `/bigemotion-release` |
| 7 | P1 | Add `.github/dependabot.yml` (npm, weekly) | 549 deps unmonitored |
| 8 | P1 | SHA-pin all CI Actions across the 5 unpinned workflows — mirror `ferry-router.yml:51` | Domain 8 |
| 9 | P2 | Fix `deploy/env.template`: add `AUTH_SECRET`, `PORTAL_BASE_URL`, `AZURE_TENANT_ID` | `session.ts:76`; `mail.ts:35` |
| 10 | P2 | pnpm `overrides`: `brace-expansion@>=1.1.16`, `postcss@>=8.5.10` | `pnpm audit` |
| 11 | P2 | Cover the real GLB load and the post-login destination in tests — both dead-ends are green in CI today | `scene-canvas.test.tsx`; `verify/route.test.ts` |
| 12 | P2 | Replace the placeholder client roster (`contact@big-emotion.com`) with real provisioned editors before relying on sign-in | `clients.ts:50` TODO |
| 13 | P2 | Add a `lint:tokens` script to automate brand-hex enforcement; lift the OG/icon `#f2ff26` to one shared constant | `opengraph-image.tsx:18`, `apple-icon.tsx:21` |
| 14 | P2 | Update `deploy-preview.yml` for standalone; renumber one ADR 0005; refresh the stale static-export comment | ADR 0005 follow-up; `layout.tsx:11` |
| 15 | P2 | Track a nonce-based CSP as a follow-up | `next.config.ts:54` |

## 10. Conclusion

The BIG EMOTION site remains **well-engineered**. The auth cryptography, accessibility
craft, constant discipline, and deploy pipeline are all genuinely 9-caliber, and the
engineering has visibly progressed since July 19 — tests nearly doubled to 156, the
stale-artifact test failure is gone, the compose-drift deploy bug was found and fixed
with an explanatory comment, and the Step 3.5 hardcoded-values scan came back at **zero**
P0/P1 for the second audit running.

It scores **7.4 / 10**, down from 7.8 — and the reason is worth stating plainly: **no
finding from the previous audit was closed.** Mentions légales are still absent. Actions
are still unpinned. Dependabot still doesn't exist. Meanwhile two of those open findings
got worse on their own: the unthrottled `request-link` became live-exploitable when the
Graph transport shipped, and the "unbudgeted 3D payload" resolved into a measured
203 KB gzip of Three.js rendering a 92-byte empty placeholder. Two new gaps surfaced
alongside them — a login flow that 404s on success, and six weeks of CI-green work parked
on `develop` behind a promotion step nobody owns.

None of this is a live-site regression; the marketing page works, looks right, and
deploys safely. But the gap between "shipping" and "production-ready" is now made
entirely of items that have been written down once already. Close the legal blocker and
the auth throttle — two focused changes — and this clears 8.
