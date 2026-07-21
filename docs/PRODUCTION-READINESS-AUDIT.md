# BIG EMOTION — Production Readiness Audit

Date: 2026-07-21
Commit audited: `505a044` (main, tag `v0.6.0`) — working tree clean
Method: read-only. Source, versions, tags, and deploy config were not modified.

> Architecture note: the audit skill predates the migration to **standalone
> Next.js + Docker + Traefik** (ADR 0005) and **tag-triggered CI deploy** (ADR
> 0006) — it still assumes static export + Apache/PHP + rsync/`.htaccess`, and
> asserts the repo has no CI. All three are stale. Every check below was
> re-mapped to the architecture as it actually is on disk, per the skill's
> "report the actual state" rule. See §11 for the specific skill corrections.
>
> Scope note: this audits **`main` @ `v0.6.0`**, the surface that ships.
> `origin/develop` is level with `main` — the promotion backlog flagged in the
> `v0.5.1` audit is cleared.

---

## 1. The four questions

**1. Is the project production-ready?** — **Conditional.**
The engineering is in good shape and materially better than at `v0.5.1`: `pnpm lint`
is clean, **432 tests across 55 files pass** in 6.6 s, the standalone build compiles
every route, and the two auth findings that blocked the last audit — an unthrottled
mail-sending endpoint and the enumeration timing oracle — are both **fixed**. One
blocker remains, and it is not a code problem:

1. **Mentions légales are still absent** — the LCEN art. 6-III gap, now carried
   through five releases (`v0.2.0` → `v0.6.0`). This is the single item standing
   between the site and "unreservedly ready".
2. **The `/espace` client area still dead-ends** — a successful magic-link login
   redirects to `/espace/{clientId}`, a route that does not exist. The sign-in
   surface (login page, mail-sending endpoint) is live in production with no
   destination behind it.

**2. Is it legally compliant (RGPD/LCEN)?** — **No — one unchanged hard gap.**
- Self-hosted fonts only, **no Google Fonts CDN** — ✅ (`next/font/local`; grep clean).
- **No third-party trackers** loaded by default — ✅ (no gtag/analytics/hotjar/clarity/doubleclick).
- **Mentions légales present and reachable** — ❌ **still absent**. No SIRET, legal form,
  address, directeur de publication or hébergeur anywhere in `src/`; no legal route in
  the build manifest; `site-footer.tsx:22-24` renders only `© {year} BIG EMOTION` plus
  a **tagline** (`footerLegal` = "On ne fait pas des sites, on crée de l'impact") — the
  field name reads as legal content but carries none. **LCEN art. 6-III blocker.**
- Contact/auth PII retention — proportionate (in-memory IP-keyed throttles, in-memory
  15-min magic-link store, a signed HttpOnly cookie carrying only `{userId, clientId}`).
- **RGAA does not apply** — private agency, not a public authority.

**3. Security posture?** — **Good, and improved.** The two findings that dominated the
last audit are closed: `POST /api/auth/request-link` now applies a 5/min per-IP cap
(`route.ts:11,22`) and the send is **fire-and-forget** (`void sendMail(…).catch(…)`,
`route.ts:41-47`) with a comment naming the timing oracle it closes. Headers, auth
crypto, the fail-closed constant-time Prismic webhook, and container hardening are all
genuinely strong. Two things remain: **the in-memory rate-limit stores are unbounded**
(new finding — no eviction path in `src/lib/rate-limit.ts`, so both maps grow one entry
per distinct IP forever), and supply-chain hygiene has **not moved in three audits** —
still no Dependabot, still 16 mutable-tag Action references including the workflow that
holds `DEPLOY_SSH_KEY`.

**4. Is the score close to 8–9/10?** — **7.9 / 10 — the bottom of the target band.**
Up from 7.4. Five of the previous audit's findings were genuinely fixed (rate limit,
timing oracle, the 92-byte placeholder GLB, the release blockage, `env.template` drift),
and the test suite nearly tripled. The remaining distance is concentrated in **two
non-code items**: publish the mentions légales (Domain 2: 6 → 9) and apply the
supply-chain hygiene the repo already knows how to do (Domain 8: 7 → 9). Those two
alone put the project at **8.5 / 10**.

## 2. Overall score

**7.9 / 10** (▲ 0.5 from `v0.5.1`) — A well-engineered site that closed every
engineering finding raised against it, now held back almost entirely by one unpublished
legal page and by supply-chain chores that no release has yet owned.

## 3. Score per domain

| # | Domain | Score | Δ | One-line basis |
|---|--------|:-----:|:--:|----------------|
| 1 | Application security | 8 / 10 | ▲1 | `request-link` now throttled **and** timing-neutral; headers + auth crypto + fail-closed webhook strong; rate-limit stores unbounded |
| 2 | RGPD / privacy | 6 / 10 | — | Fonts/trackers clean; **mentions légales absent** (LCEN blocker, 3 audits running) |
| 3 | Accessibility (craft) | 9 / 10 | — | Landmarks + skip link, `:focus-visible`, **5** reduced-motion blocks, per-axis SR text, WebGL fallback |
| 4 | Architecture & standalone integrity | 8 / 10 | — | `standalone` + 301s + centralised copy + **0 P0/0 P1 hardcoded values**; `proxy` still guards an `/espace` route that doesn't exist |
| 5 | Code quality | 9 / 10 | — | Lint clean; 1 TODO in `src/`; comments justify rather than narrate |
| 6 | Correctness & tests | 8 / 10 | — | **432 tests / 55 files** pass (up from 156/29); still nothing covers the `/espace` dead-end |
| 7 | Performance | 8 / 10 | ▲2 | Real 45 KB Draco GLB replaces the 92-byte placeholder; Three.js dynamically imported behind the `HAS_HERO_MODEL` gate |
| 8 | Supply chain + release/deploy | 7 / 10 | ▲1 | Release unblocked, `env.template` drift fixed; **still** no Dependabot, 16 unpinned Actions, 3 CVEs |

Mean = (8+6+9+8+9+8+8+7) / 8 = **7.875 → 7.9 / 10**.

## 4. Strengths

- **The previous audit's P0 and P1 auth findings are both properly fixed, not papered
  over.** `request-link/route.ts:22` applies `checkRateLimit(clientIp(request), {limit: 5,
  windowMs: 60_000})` *before* parsing the body, and `route.ts:41-47` makes the send
  fire-and-forget with a comment that states the invariant it protects ("awaiting
  sendMail here would make the response slower for a provisioned email than an
  unprovisioned one"). Both branches now return the same body **and** the same latency.
- **Magic-link auth crypto is production-grade** (`src/lib/magic-link.ts`,
  `src/lib/session.ts`): single-use `randomBytes(32)` tokens deleted *unconditionally*
  on lookup (replay-safe even when expired), HMAC-SHA256 signed cookies verified with
  `timingSafeEqual`, and fail-closed decoding on every branch — missing secret, bad
  signature, malformed JSON, wrong field types, expiry.
- **The Prismic webhook fails closed and explains why** (`api/revalidate/handler.ts:46-61`):
  with `PRISMIC_WEBHOOK_SECRET` unset it authorises nobody rather than reading "no secret
  required" as "everyone is welcome", compares constant-time, and returns an identical
  response for a wrong secret and a misconfigured server. The `expire: 0` choice is
  documented against the alternative it rejects.
- **`src/proxy.ts` returns 404, never 403**, for a cross-client `/espace` request, so the
  guard can't confirm another client's space exists — anti-enumeration reasoning applied
  consistently at the routing layer.
- **Constant discipline is exemplary.** The Step 3.5 scan found **zero** P0/P1 hardcoded
  values across `src/**` — three audits running. Every runtime knob is named and exported.
- **Accessibility craft**: landmarks + "Aller au contenu" skip link (`document-shell.tsx:52`),
  `:focus-visible` ring (`globals.css:229`), **five** distinct `prefers-reduced-motion`
  blocks plus JS-side `matchMedia` guards in `scene-canvas.tsx:26,40` and
  `subpage-photo.tsx:13`, and a per-axis screen-reader sentence for a purely visual control.
- **Deploy pipeline** (`deploy-production.yml`): `v*`-tag-gated (ADR 0006), queued not
  cancelled, `workflow_dispatch` rollback, `permissions: contents: read`, pinned
  `known_hosts` (never `StrictHostKeyChecking=no`), Prismic token passed as a BuildKit
  `--secret` mount rather than a build arg.
- **No secrets committed**; `deploy/env.template` holds placeholders only and is now in
  sync with the code; the Dockerfile is multi-stage `node:22-alpine` running as non-root.

## 5. Gaps and risks

### Domain 1 — Application security

- **P1 (new) — The in-memory rate-limit stores have no eviction path.**
  `src/lib/rate-limit.ts:14` keeps a module-level `buckets` Map that is only ever
  written (`buckets.set`, lines 34 and 42) — never deleted, never swept. The contact
  limiter has the same shape: `hitsByKey.set(key, recent)` at line 77 re-stores the key
  even when `recent` has been pruned to an **empty array**, so a key that was seen once
  persists for the life of the process. Both are keyed on the client IP, which an
  attacker controls the variety of. A rotating-source flood, or simply organic traffic
  over a long-lived container, grows both maps without bound → memory pressure on the
  single container instance the whole site runs in. The throttle intended to prevent
  abuse is itself the amplification path.
  **Fix:** sweep expired buckets on write (or evict on read when `now > resetAt`), and
  `hitsByKey.delete(key)` when `recent.length === 0`. Both are a few lines; the Redis
  migration (SWBE-30) is not required to close this.

- **P2 — `PORTAL_BASE_URL` falls back silently to the request origin.**
  `request-link/route.ts:35` uses `process.env.PORTAL_BASE_URL ?? request.nextUrl.origin`.
  `deploy/env.template:11` now sets it, so production is covered — but the fallback is
  silent, and if it ever went unset the verification URL would be built from an
  attacker-controllable `Host`, mailing a poisoned link to the *legitimate* provisioned
  owner. **Fix:** require it in production (throw on startup) rather than defaulting.

- **P2 — `/api/revalidate` is unthrottled.** The secret check fails closed and is
  constant-time, so this is brute-force-resistant, but there is no cap on attempts and a
  caller holding the secret can force full regeneration of every Prismic-backed page on
  demand. Low priority given the credential gate.

- **P2 — The client roster is still a placeholder.** `src/config/clients.ts:50-58` carries
  `TODO(owner)` and maps `contact@big-emotion.com` → `clientId: "chancellerie"`. The
  mechanism shipped (SWBE-27); the real roster did not. Combined with the missing
  `/espace` route (D4), the auth surface is live in production with neither real users
  nor a destination.

- **P2 — No CSP.** Documented tradeoff in `next.config.ts:49-50` (Next's inline bootstrap
  script needs a per-build nonce/hash). Deliberate and reasoned; leaves a residual
  XSS-mitigation gap.

### Domain 2 — RGPD / privacy

- **P0 (legal) — Mentions légales absent.** Unchanged across `v0.2.0`–`v0.6.0`. No legal
  identification anywhere in `src/`, no legal route in the build manifest, and
  `site-footer.tsx:22-24` ends at `© {year} {site.name}` followed by `footerLegal` —
  which despite its name holds a **marketing tagline**, not legal content. LCEN art.
  6-III blocker for a live commercial site.
  **Fix:** add a `legal` block to `src/content/site.ts` (raison sociale, forme juridique,
  capital, RCS/SIRET, siège, directeur de publication, hébergeur = OVH + address) and
  render it as `/mentions-legales` in both locales, plus a footer link.
- **P2 — No privacy policy.** Only a strictly-necessary auth cookie today (no consent
  banner required), but the contact form and `/espace` both process PII in production
  now that the Graph transport is live. RGPD art. 13 expects a notice at collection.

### Domain 3 — Accessibility

- No blocking gaps. The `v0.5.1` caveat — that the reduced-motion fallback was *richer*
  than the default path, because the default rendered an empty GLB — is **resolved**: the
  real 45 KB scene ships and `HAS_HERO_MODEL` (`scene/model-gate.ts:15`) gates the runtime.
- Watch item, not a finding: `src/content/site.test.ts` enforces the display-font ASCII
  rule for `site.ts`, but Prismic-authored titles bypass it (DEC-023). `pnpm
  prismic:check-display` exists to cover that; it is not wired into `ci.yml`.

### Domain 4 — Architecture & standalone integrity

- **P1 — `src/proxy.ts` guards a route that does not exist.** `(auth)/verify/route.ts:20-21`
  redirects a *successfully* authenticated user to `/espace/${consumed.clientId}`. There
  is no `espace` directory under `src/app` (confirmed absent) and no `/espace` entry in
  the build manifest, so the happy path of the entire sign-in flow terminates in
  `not-found.tsx`. Expected for in-progress Portal work — but it is shipped, and no test
  covers it. *(Unchanged from `v0.5.1`.)*
- **P2 — Brand hex duplicated in the OG/icon generators.** `src/app/opengraph-image.tsx:18`
  and `src/app/apple-icon.tsx:21` hardcode `#f2ff26`. **Justified exception** — `next/og`
  (Satori) renders with no access to CSS custom properties — but the two copies can drift
  from `--color-lemon`. Lift to one shared exported constant. *(Unchanged.)*
- **P2 — ADR 0005 numbering collision** persists: `0005-motion-stack.md` and
  `0005-nextjs-standalone-docker.md`. AGENTS.md's "ADR 0005" references are ambiguous.
- **P2 — `public/contact.php` is still in the tree.** AGENTS.md marks it retired and
  behavioural-reference-only; it is not executed by the Node container, and nothing but
  comments reference it now (`handler.ts:5,28`, `contact-form.tsx:12`, `rate-limit.ts:7,75`).
  It ships verbatim as a static asset in `public/`. Harmless but removable.

#### Hardcoded values (P0/P1)

**None.** The Step 3.5 scan over `src/**/*.{ts,tsx}` (tests and stories excluded) across
all five categories — Image & Asset Sizes, Truncation & Content Limits, Animation &
Timing Constants, Layout & Breakpoint Constants, Default Parameters — found **0 P0 and
0 P1**.

Every runtime knob is lifted and named: `states.ts` (`STATES`, `CAMERA`, `MATERIAL`),
`scene-canvas.tsx` (`HOLD_DURATION`, `MOVE_DURATION`, `GLB_URL`, `DRACO_DECODER_PATH`),
`session.ts` (`SESSION_TTL_MS`), `magic-link.ts` (`TOKEN_TTL_MS`), `rate-limit.ts`
(`MIN_INTERVAL_MS`, `MAX_PER_HOUR`, `WINDOW_MS`), `request-link/route.ts` (`RATE_LIMIT`),
`conversation-token/route.ts` (`RATE_LIMIT`, `TOKEN_TTL_MS`), `model-gate.ts`
(`HAS_HERO_MODEL`), `subpage-photo.tsx` (`MOTION_QUERY`), `client-wall.tsx` (`HALF`).

Reviewed and classified **P2, no penalty**: the `next/og` route conventions
(`apple-icon.tsx:6` `180×180`, `opengraph-image.tsx:9` `1200×630`) are platform-fixed
sizes, not tunable knobs; the zod field maxima in `api/contact/handler.ts:18,23,25`
(`200`/`200`/`5000`) read idiomatically inline in the schema they constrain and are
ported for parity with the retired `contact.php`; the numerals in `scene-canvas.tsx:66-71`
are 3D scene geometry, inherently artistic values. **No penalty applied to Domain 4.**

### Domain 5 — Code quality

- Lint clean (`pnpm lint`, no output). Exactly **one** TODO/FIXME/XXX/HACK across `src/`
  and `public/` — `config/clients.ts:50`, which is an owner action item, not code debt.
- Comments consistently justify rather than narrate: the `expire: 0` reasoning in
  `revalidate/handler.ts:37-40`, the fire-and-forget rationale in `request-link/route.ts:37-40`,
  the `createNextIntlPlugin` wrapping note in `next.config.ts:77-80`, and the matcher
  reasoning in `proxy.ts:60-69` are all load-bearing explanations a reader could not
  recover from the code alone.
- Server/client split respected: `"use client"` is confined to the components AGENTS.md
  names.

### Domain 6 — Correctness & tests

- **432 tests / 55 files pass** in 6.6 s (up from 156/29 at `v0.5.1`, 80/20 before that).
  Behaviour-driven through rendered output; colocated with their subjects.
- **P1 — The `/espace` dead-end still has no test coverage.** Nothing asserts where
  `/verify` actually lands, so CI stays green while the sign-in happy path 404s. This is
  the same finding as D4, carried here because it is invisible to the suite *by
  construction*. *(Unchanged from `v0.5.1`.)*
- **P2 — `pnpm prismic:check` / `prismic:check-display` are not in `ci.yml`.** Model drift
  between git and the Prismic dashboard, and accented copy in display-font slots
  (DEC-023), are both detectable by scripts the repo already ships — neither runs
  automatically.
- Harmless noise: jsdom prints ~18 `HTMLCanvasElement.getContext()` warnings.

### Domain 7 — Performance

- **The `v0.5.1` P1 is fixed.** `public/models/scene.glb` is now a real **45,592-byte**
  Draco-compressed asset (was a 92-byte empty container), and `[locale]/page.tsx:14`
  pulls the Three.js runtime in via dynamic import behind the `HAS_HERO_MODEL` gate
  (DEC-027) rather than unconditionally. The 203 KB gzip of Three.js now draws something.
- **P2 — 764 KB of Draco decoder assets ship in every image.** `public/draco/` (512 KB JS
  + 192 KB wasm + 58 KB wrapper). Now genuinely used by the compressed GLB, so this is
  cost-for-value rather than waste, but only the wasm path is needed by modern browsers —
  the 512 KB JS fallback decoder is the removable half.
- **P2 — `src/photos/` is 3.4 MB of source JPEGs.** Served through the `next/image`
  optimiser under standalone, so visitors get resized/AVIF variants — the weight is
  build-time and repo-size cost, not wire cost.
- Fundamentals are good: self-hosted woff2 via `next/font/local` with `display: "swap"`
  (`document-shell.tsx:19,27`), animation CSS-only outside the scene, `.next/cache`
  restored in CI.

### Domain 8 — Supply chain + release/deploy

- **P1 — CI Actions are still pinned by mutable tag, not SHA.** **16 references** across
  five workflows: `ci.yml` (4), `deploy-production.yml` (3), `deploy-preview.yml` (3),
  `claude.yml` (2), `claude-code-review.yml` (2), plus `ferry-router.yml`'s three
  `big-emotion/ferry/…@v1.1.0` composite-action references (a tag is mutable even on a
  first-party repo). `deploy-production.yml` runs with `DEPLOY_SSH_KEY` — the highest
  blast radius in the repo — on `actions/checkout@v4`, `pnpm/action-setup@v4`,
  `actions/setup-node@v4`. `ferry-router.yml:51,73,150` already SHA-pins
  `actions/checkout@de0fac2e…` **with the version in a trailing comment**, so the pattern
  is proven in-repo, just not applied. *(Unchanged across three audits.)*
- **P1 — No `.github/dependabot.yml`.** 1,280 dependencies, unmonitored. *(Unchanged
  across three audits.)*
- **P2 — 3 open advisories** (`pnpm audit`, 1,280 deps: 1 high / 1 moderate / 1 low):
  - **high** `brace-expansion@1.1.15` (GHSA-3jxr-9vmj-r5cp, CVE-2026-13149, ReDoS) —
    transitive via `@storybook/nextjs` and `eslint > @eslint/config-array > minimatch`.
    **Dev-only**, never in the runtime image. Fixed by a pnpm `overrides` to `>=1.1.16`.
  - **moderate** `postcss@8.4.31` (XSS via unescaped `</style>`) — transitive via
    `next@16.2.9`, so it is a **production** dependency. No user-supplied CSS is parsed;
    resolution depends on a Next patch release. *(Unchanged.)*
  - **low** `elliptic@6.6.1` (risky cryptographic primitive) — **new**, transitive via
    `@storybook/nextjs > node-polyfill-webpack-plugin > crypto-browserify`. Dev-only.
- **P2 — `deploy-preview.yml` is definitively broken, not merely incompatible.** It still
  builds a **static export** with `NEXT_PUBLIC_BASE_PATH: /preview` (line 47-50) and
  rsyncs `out/` (line 86) — a directory `output: "standalone"` never produces. Tracked
  ADR 0005 follow-up; it will fail on every run until rewritten.
- **P2 — No `lint:tokens` script.** Brand-hex discipline is manual grep; the two OG/icon
  literals (D4) are exactly what slips through. Adding the script would make Step 3's
  scan automatic, as it is on the chancellerie project.
- **Resolved since `v0.5.1`:** the release blockage (`develop` was 6 commits ahead with no
  promotion owner) is cleared — `v0.6.0` is tagged, `main` and `develop` are level, and
  ADR 0008 settled the promotion question by **declining** automation, which gives the
  manual `git merge --ff-only` path a recorded decision behind it. `deploy/env.template`
  no longer drifts: `AUTH_SECRET` and `PORTAL_BASE_URL` are both present and documented.
- Clean: no git-ref/`file:`/`link:`/`workspace:` dependencies; no secrets committed;
  `permissions: contents: read` on the CI and deploy jobs.

## 6. Legal compliance (RGPD / LCEN)

| Check | Status | Evidence |
|-------|:------:|----------|
| Self-hosted fonts, no Google Fonts CDN | ✅ | `next/font/local` in `document-shell.tsx:11-27`; grep for `fonts.googleapis`/`gstatic` in `src/` clean |
| No third-party trackers by default | ✅ | grep for gtag/analytics/hotjar/clarity/facebook.net/doubleclick in `src/` clean |
| Mentions légales present & reachable (LCEN 6-III) | ❌ | No SIRET/address/directeur de publication in `src/`; no legal route in the build manifest; `site-footer.tsx:22-24` is copyright + tagline only |
| Privacy notice at PII collection (RGPD art. 13) | ❌ | Contact form and `/espace` both process PII with no notice |
| Contact/auth PII retention proportionate | ✅ | In-memory IP throttles, 15-min in-memory token store, cookie carries only `{userId, clientId}` |
| RGAA accessibility declaration | N/A | Private agency, not a public authority |

**Verdict:** privacy-respecting **by construction** — no CDN fonts, no trackers, no
analytics, minimal retention. The data-protection posture is genuinely better than most
commercial sites. But it is **not LCEN-compliant** until mentions légales are published,
and that has now been true across five releases.

## 7. Security posture

Strong cryptographic and infrastructure craft. The two findings that dominated the
`v0.5.1` audit are closed; what remains is one resource-exhaustion gap and the
supply-chain chores.

**Strengths**
- Headers from `next.config.ts:51-74`: HSTS (`max-age=31536000; includeSubDomains`),
  `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`
  (geolocation/camera/microphone/browsing-topics all denied).
- Auth: single-use tokens deleted unconditionally on lookup, HMAC-SHA256 sessions with
  `timingSafeEqual`, fail-closed on every decode branch, `httpOnly` + `secure` in prod +
  `sameSite: lax`.
- **`request-link` is now both throttled (5/min/IP) and timing-neutral** — the
  anti-enumeration guarantee the route documents is actually held.
- `conversation-token` is auth-gated (401) **and** rate-limited.
- Contact route: honeypot → rate limit → zod validation, in that order, with the throttle
  ahead of parsing so malformed floods stay cheap.
- Prismic webhook: constant-time secret comparison, fails closed when unconfigured,
  identical response for wrong-secret and misconfigured.
- Deploy SSH uses pinned `known_hosts`; non-root container; Prismic token via BuildKit
  `--secret` mount, not a build arg.

**Gaps**
- **Unbounded rate-limit stores** (`src/lib/rate-limit.ts` — no eviction) — P1.
- **16 mutable-tag Action references**, including the `DEPLOY_SSH_KEY` workflow — P1.
- **No Dependabot** across 1,280 dependencies — P1.
- Silent `PORTAL_BASE_URL` → request-origin fallback — P2.
- No CSP (documented, deliberate) — P2.
- Placeholder client roster still in `config/clients.ts` — P2.

## 8. Deploy consistency

| Location | Value | Status |
|----------|-------|:------:|
| `package.json` `.version` | `0.6.0` | canonical |
| Latest git tag | `v0.6.0` | match |
| `main` tip | `505a044` (`release: v0.6.0`) | match |
| `origin/develop` vs `main` | level — promotion backlog cleared | match |
| `deploy-production.yml` trigger | `push: tags: ["v*"]` + `workflow_dispatch` (ADR 0006) | match |
| `deploy-production.yml` permissions | `contents: read` | match |
| `deploy.sh` role | break-glass only, documented in the header comment | match |
| `deploy.sh` VPS path | `/home/ubuntu/big-emotion/website` | match |
| `deploy/env.template` vs code | `AUTH_SECRET`, `PORTAL_BASE_URL`, `GRAPH_*`, `MAIL_*` all present | match (▲ fixed) |
| Legacy WordPress 301s | 4 rules × 2 slash variants = 8, `permanent: true`, targets verified | match |
| `CHANGELOG.md` / tags | 8 tags `v0.1.0` → `v0.6.0` | match |
| Actions pinned by SHA | 3 of 19 (`ferry-router.yml` only) | **MISSING** |
| `.github/dependabot.yml` | absent | **MISSING** |
| `deploy-preview.yml` | still static-export + `out/` — cannot succeed under `standalone` | **BROKEN** |

The three flagged rows are the Domain 8 findings above. Everything version-, tag-, and
path-related is consistent; the gaps are all supply-chain and the stale preview workflow.

## 9. Prioritized action list

| # | Pri | Action | Anchor |
|---|:---:|--------|--------|
| 1 | **P0** | Publish **mentions légales** — `legal` block in `src/content/site.ts`, `/mentions-legales` route in both locales, footer link | LCEN 6-III; AGENTS.md "All copy lives in `src/content/site.ts`" |
| 2 | **P1** | Add eviction to `src/lib/rate-limit.ts` — sweep expired buckets on write; `hitsByKey.delete(key)` when the pruned window is empty | AGENTS.md "Shared server libs"; precedes SWBE-30 |
| 3 | **P1** | Add `.github/dependabot.yml` covering `npm` + `github-actions` | Domain 8, unchanged 3 audits |
| 4 | **P1** | SHA-pin all 16 mutable Action references, `deploy-production.yml` first | follow `ferry-router.yml:51` |
| 5 | **P1** | Ship `/espace/[clientId]` or gate the sign-in surface off until it exists; add a test asserting where `/verify` lands | SWBE-27; ADR 0005 |
| 6 | **P2** | Publish a privacy notice at the contact form and `/espace` | RGPD art. 13 |
| 7 | **P2** | Rewrite `deploy-preview.yml` for standalone output, or delete it until it can be | ADR 0005 follow-up |
| 8 | **P2** | Replace the placeholder roster in `src/config/clients.ts` with real provisioned editors | `clients.ts:50` TODO |
| 9 | **P2** | Require `PORTAL_BASE_URL` in production rather than falling back to the request origin | `request-link/route.ts:35` |
| 10 | **P2** | pnpm `overrides` for `brace-expansion >=1.1.16`; track the `postcss` fix into `next` | Domain 8 CVEs |
| 11 | **P2** | Add `pnpm prismic:check` + `prismic:check-display` to `ci.yml` | AGENTS.md Prismic section; DEC-023 |
| 12 | **P2** | Add a `lint:tokens` script; lift `#f2ff26` to one shared constant for the OG/icon routes | AGENTS.md "never hardcode brand values" |
| 13 | **P2** | Rate-limit `/api/revalidate` | Domain 1 |
| 14 | **P2** | Renumber one of the two ADR 0005 files | `docs/adr/` |
| 15 | **P2** | Delete `public/contact.php` — nothing but comments reference it | AGENTS.md "can go once nothing references it" |

## 10. Conclusion

`v0.6.0` is the strongest release this project has audited. Every engineering finding
raised at `v0.5.1` was fixed properly rather than worked around — the rate limit and the
timing oracle were closed with code that explains the invariant it protects, the hero
GLB is real, and the release backlog cleared. The test suite nearly tripled to 432.

The score sits at **7.9 / 10** — the bottom edge of the 8–9 target — and what holds it
there is now almost entirely **not code**. One unpublished legal page moves Domain 2 from
6 to 9. Two configuration chores the repo already demonstrates it knows how to do
(`ferry-router.yml` SHA-pins correctly; Dependabot is a 12-line file) move Domain 8 from
7 to 9. Those three items alone would put BIG EMOTION at **8.5 / 10**.

The one finding worth acting on quickly regardless of scoring is the unbounded
rate-limit store: it is a small fix, it is in the code path specifically built to resist
abuse, and it is the kind of gap that stays invisible until a container has been up long
enough to matter.

## 11. Audit-skill corrections

The `bigemotion-audit` skill is now materially out of date with the repository. Recorded
here so a future run does not re-derive it:

| Skill assumes | Actual state |
|---------------|--------------|
| Static export (`output: "export"`) | `output: "standalone"` (ADR 0005) |
| Apache + `public/.htaccess` headers & 301s | No Apache. Headers and redirects in `next.config.ts:27-74` |
| `public/contact.php` is the live server code | Retired. `src/app/api/contact/` + `src/lib/mail.ts` |
| Manual SSH deploy, no CI | 6 workflows; tag-gated CI deploy (ADR 0006); `deploy.sh` is break-glass |
| No release tags ("pre-launch") | 8 tags, `v0.1.0` → `v0.6.0`, with `CHANGELOG.md` |
| `NEXT_PUBLIC_BASE_PATH=/preview` staging model | Incompatible with standalone; `deploy-preview.yml` is broken |
| No CMS ("add a domain note once Prismic lands") | Prismic shipped (SWBE-24/80/81); models in git, webhook revalidation |
| Single-locale site | Routed FR/EN via next-intl (ADR 0007) |
| `git grep -E` with `\s` for the Actions-pinning check | POSIX ERE has no `\s` — the check silently passes. Use `grep -rn` |
| `git grep -- 'src/**/*.ts'` for Step 3.5 | git pathspec does not glob `**` this way — returns nothing. Use `grep -r src --include='*.ts'` |

The last two are the dangerous ones: both fail **open**, reporting a clean result when
the check never ran. The Actions-pinning check in particular would have reported "all
pinned by SHA" against 16 unpinned references.
