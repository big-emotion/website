# BIG EMOTION — Production Readiness Audit

Date: 2026-07-24
Commit audited: `9abf4be` (main, tag `v0.8.0`) — working tree clean
Method: read-only. Source, versions, tags, and deploy config were not modified.

> Architecture note: the audit skill predates the migration to **standalone
> Next.js + Docker + Traefik** (ADR 0005) and **tag-triggered CI deploy** (ADR 0006) — it
> still assumes static export + Apache/PHP + rsync/`.htaccess`, and asserts the repo has
> no CI. All three are stale. Every check below was re-mapped to the architecture as it
> actually is on disk, per the skill's "report the actual state" rule. See §11.
>
> Scope note: this audits **`main` @ `v0.8.0`**, the surface that ships. `origin/develop`
> is level with `main` — no promotion backlog.

---

## 1. The four questions

**1. Is the project production-ready?** — **Conditional. Yes for the marketing site,
no for the client area.**

The public marketing surface is ready and already live: `v0.8.0` deployed successfully
through the tag-gated pipeline, all six CI gates are green, `pnpm lint` / `typecheck` /
`format:check` are clean, **768 tests across 98 files pass** in 10.9 s, and the standalone
build compiles every route. The **LCEN blocker that held the last three audits is
closed** — `/mentions-legales`, `/politique-de-confidentialite` and `/accessibilite` all
render in both locales.

Three items stand between this and unreserved readiness, and none of them is a code-craft
problem:

1. **The framework is nine advisories behind.** `next@16.2.9` carries **4 high + 5
   moderate** advisories, all patched in `16.2.11`. One of them is a _Middleware/Proxy
   bypass_ — and this app's entire access control for `/espace` lives in `src/proxy.ts`.
2. **`/espace/[clientId]` still does not exist.** `(auth)/verify/route.ts:20` redirects a
   _successfully_ authenticated user to a route absent from the build manifest. The
   sign-in surface is live in production with nothing behind it. Unchanged for four audits.
3. **`deploy/env.template` omits all three `PRISMIC_*` variables** — including the
   runtime-only `PRISMIC_WEBHOOK_SECRET` that AGENTS.md explicitly says belongs in the VPS
   `.env`. The revalidate route **fails closed**, so if it is unset on the VPS every
   Prismic publish silently stops updating the site. Deploy-free publishing (DEC-021) may
   already be broken in production and nothing would report it.

**2. Is it legally compliant (RGPD/LCEN)?** — **Yes.** This is the headline change since
`v0.6.0`.

- Self-hosted fonts only, **no Google Fonts CDN** — ✅ (`next/font/local`; grep clean).
- **No third-party trackers** loaded by default — ✅ and now structurally enforced: the
  Prismic toolbar only injects `static.cdn.prismic.io` inside a draft-mode session, so a
  public visitor triggers **zero** third-party requests.
- **Mentions légales present and reachable** — ✅ **fixed**. `src/content/legal.ts` carries
  the registered facts (SIREN 983 423 351, RCS Paris, hébergeur OVH SAS) and all three
  legal routes are in the build manifest for `fr` and `en`.
- **Privacy notice at collection (RGPD art. 13)** — ✅ **fixed**.
  `/politique-de-confidentialite` names both cookies and their retention.
- Contact/auth PII retention — proportionate (in-memory IP throttles, 15-min in-memory
  token store, cookie carrying only `{userId, clientId}`).
- **RGAA does not apply** — private agency, not a public authority.

The design deserves specific credit: `legal-body.ts` falls back to the mandatory copy in
`src/content/legal.ts` whenever the Prismic document is missing or below a minimum length,
so **the CMS cannot take the legal pages down**. That is the correct reading of an
obligation that does not pause when a content editor makes a mistake.

**3. Security posture?** — **Strong application craft; the exposure has moved from code to
dependencies and operational config.** Headers, auth crypto, the fail-closed constant-time
webhook, anti-enumeration, gitleaks-in-CI and container hardening are all genuinely good,
and the new Playground endpoint was built with the same care (zod validation, rate limit
before parsing, atomic writes, never throws). What is left is: an unpatched framework with
four high advisories, an unauthenticated endpoint that lets a caller grow a persisted file
without bound, the **still**-unbounded in-memory rate-limit stores, and supply-chain
hygiene that has not moved in four audits.

**4. Is the score close to 8–9/10?** — **8.1 / 10 — inside the target band for the first
time.** Up from 7.9. Closing the LCEN gap moved Domain 2 from 6 → 9 and did most of the
work. The band position is now dragged down almost entirely by **Domain 8 (6/10)**, where
two new findings landed on top of four carried ones. Patching `next`, adding Dependabot,
SHA-pinning the Actions and fixing the env template are all mechanical, and together they
would put the project at **8.6 / 10**.

## 2. Overall score

**8.1 / 10** (▲ 0.2 from `v0.6.0`) — A site whose legal and engineering fundamentals are
now both in order, held at the bottom of the band by supply-chain debt that four
consecutive audits have flagged and no release has yet owned.

## 3. Score per domain

| #   | Domain                              | Score  |  Δ  | One-line basis                                                                                                        |
| --- | ----------------------------------- | :----: | :-: | --------------------------------------------------------------------------------------------------------------------- |
| 1   | Application security                | 7 / 10 | ▼1  | Headers/auth/webhook still strong; rate-limit stores **still** unbounded + unconstrained `effectId` on a public route |
| 2   | RGPD / privacy                      | 9 / 10 | ▲3  | **Three legal routes shipped in both locales**; SIREN/RCS/hébergeur present; CMS cannot take them down                |
| 3   | Accessibility (craft)               | 9 / 10 |  —  | **25** reduced-motion references (was 5), landmarks + skip link, `:focus-visible`, tilt-permission consent card       |
| 4   | Architecture & standalone integrity | 8 / 10 |  —  | `standalone` + 301s + centralised copy + **0 P0/0 P1 hardcoded values**; `/espace` dead-end unchanged                 |
| 5   | Code quality                        | 9 / 10 |  —  | lint + typecheck + format all clean; 1 TODO; comments justify rather than narrate                                     |
| 6   | Correctness & tests                 | 9 / 10 | ▲1  | **768 tests / 98 files** (was 432/55); six CI gates green; `/espace` path still uncovered by construction             |
| 7   | Performance                         | 8 / 10 |  —  | Playground built so an unopened effect costs 0 kB; 45 KB Draco GLB; 764 KB decoder + 3.4 MB source photos remain      |
| 8   | Supply chain + release/deploy       | 6 / 10 | ▼1  | **14 advisories (7 high)**, `next` 9 behind; `env.template` missing every `PRISMIC_*`; no Dependabot; 20/23 unpinned  |

Mean = (7+9+9+8+9+9+8+6) / 8 = **8.125 → 8.1 / 10**.

## 4. Strengths

- **The LCEN/RGPD blocker is properly closed, not minimally patched.** Three routes in two
  locales, real registered facts verified against the RNE, a privacy policy that names both
  cookies and their retention, and — the part that shows judgement — `legal-body.ts`
  refusing to let an empty or truncated Prismic document remove copy the law requires.
  `src/content/legal.ts` also deliberately omits the president's home address, which the
  registry carries and the law does not ask for.
- **The Playground endpoint was built to the same standard as the auth code.** `zod`
  validation, rate limit applied _before_ parsing, `MAX_INCREMENT` clamping enforced in the
  lib rather than only at the API edge, atomic temp-file + rename writes, an in-process
  serialization queue so concurrent read-modify-write cycles cannot lose an update, and a
  handler that never throws so a slow disk cannot take the page down. The persistence seam
  is deliberately narrow so SWBE-30 can swap in Redis without touching callers.
- **The durable volume was actually wired up.** `deploy/docker-compose.yml:20` mounts
  `playground-data:/app/data` and the Dockerfile pre-creates it owned by the `nextjs` user —
  the counter survives a redeploy. This is the kind of detail that is usually discovered in
  production; here it shipped with the feature.
- **Inline scripts are safe and, more importantly, argue for their own safety.**
  `brand-pairings.ts:89-91` documents that the interpolated values are `PaletteToken` names
  and never authored content, so nothing can close the script tag; the JSON-LD block
  serialises a code-defined object. Both are the rare `dangerouslySetInnerHTML` a reviewer
  can clear quickly.
- **Zero third-party requests for a public visitor.** `prismic-toolbar.tsx` loads the
  Prismic script only inside a draft-mode session; consent (tarteaucitron) is vendored and
  loaded on demand; `consent-manager.test.ts` fails the build if a consent-gated service is
  registered while the on-demand load is still in place.
- **Constant discipline remains exemplary — four audits running.** The Step 3.5 scan found
  **0 P0 and 0 P1** across `src/**`, and the roughly two thousand lines of new Playground and
  blog code kept the standard: `CONFETTI_COUNT`, `ALIGNMENT_HOLD_MS`, `SAMPLE_HISTORY_MS`,
  `MAX_INCREMENT`, `MINIMUM_AUTHORED_LENGTH` are all named and exported.
- **Test suite nearly doubled again** — 768 tests / 98 files, and CI now gates on six
  things (gitleaks, lint, typecheck, format:check, test, build), with the gitleaks image
  **pinned by digest**.
- **Accessibility scaled with the feature surface**: 25 `prefers-reduced-motion` references,
  and the motion-heavy `poids-lourd` effect ships an explicit tilt-permission card rather
  than silently requesting device orientation.
- **Release machinery works**: 10 tags `v0.1.0` → `v0.8.0`, a maintained Keep-a-Changelog
  `CHANGELOG.md`, the `v0.8.0` production deploy green, `deploy.sh` documented as break-glass
  only, and the 8 legacy WordPress 301s intact.

## 5. Gaps and risks

### Domain 1 — Application security

- **P1 (new) — `effectId` is unconstrained, so an anonymous caller can grow a persisted
  file without bound.** `api/playground/counter/handler.ts:10-12` validates `effectId` as
  any trimmed string of 1–64 characters. The effect registry
  (`components/playground/effects.ts:40,51`) defines exactly **two** ids — `lumiere` and
  `poids-lourd` — but nothing ties the schema to it. Every unrecognised id becomes a new key
  in `byEffect`, and that object is persisted to `/app/data/playground-counter.json` on a
  **durable volume**. At 20 entries per request the file grows indefinitely, and because
  `incrementCounter` does a full read → parse → serialise → write on every call, the cost of
  each subsequent request grows with it. The endpoint is unauthenticated by design.
  **Fix:** `z.enum` the effect ids off the registry, or drop unknown ids in
  `incrementCounter`. One line, and it makes the API agree with the two-effect gallery it
  serves.

- **P1 (carried, unchanged since `v0.6.0`) — The in-memory rate-limit stores still have no
  eviction path.** `src/lib/rate-limit.ts:14` keeps a module-level `buckets` Map that is only
  ever written, never swept. The contact limiter has the same shape: line 77 re-stores the
  key even when the pruned window is an **empty array**, so a key seen once persists for the
  life of the process. The in-code comment ("keep the pruned window so it stays bounded")
  describes each entry's _length_ being bounded — the number of _keys_ is not. This now
  matters more than it did: `v0.8.0` added a **third** limiter instance
  (`counterRateLimiter`) on a public, unauthenticated, high-frequency endpoint.
  **Fix:** sweep expired buckets on write, and `hitsByKey.delete(key)` when the pruned window
  is empty. Redis (SWBE-30) is not required.

- **P2 — Client IP is taken from the first `X-Forwarded-For` hop in all three routes**
  (`contact/handler.ts:51`, `playground/counter/handler.ts:21`,
  `auth/request-link/route.ts:17`). By convention that end of the chain is the
  _client-supplied_ one. Whether it is spoofable here depends on Traefik's
  `forwardedHeaders.trustedIPs`, which is configured outside this repo and could not be
  verified from the tree — so this is flagged for verification, not asserted as exploitable.
  If it is spoofable, every throttle above becomes bypassable by header rotation, which also
  makes the two unbounded-store findings trivially reachable.
  **Fix:** confirm the Traefik entrypoint sanitises `X-Forwarded-For`, and record the answer
  next to `clientIp` so the next reader does not have to re-derive it.

- **P2 — `PORTAL_BASE_URL` falls back silently to the request origin**
  (`request-link/route.ts:35`). `deploy/env.template:11` sets it, so production is covered,
  but if it ever went unset the verification URL would be built from an attacker-controllable
  `Host` and mail a poisoned link to the legitimate owner. _(Carried.)_

- **P2 — `/api/revalidate` is unthrottled.** The secret check is constant-time and fails
  closed, so it resists brute force, but a caller holding the secret can force full
  regeneration of every Prismic-backed page on demand. _(Carried.)_

- **P2 — The client roster is still a placeholder.** `src/config/clients.ts:46-53` still
  carries `TODO(owner)` and maps `contact@big-emotion.com` → `clientId: "chancellerie"`.
  _(Carried.)_

- **P2 — No CSP.** Documented tradeoff in `next.config.ts:48-50`. Deliberate and reasoned;
  leaves a residual XSS-mitigation gap. _(Carried.)_

### Domain 2 — RGPD / privacy

- No blocking gaps. The LCEN art. 6-III and RGPD art. 13 findings that dominated three
  audits are both **closed**.
- **P2 (watch, not a finding) — the consent loader is on-demand, and that is only correct
  while nothing needs consent before it runs.** `consent-manager.ts:11` states this and
  `consent-manager.test.ts` fails the build if a service is registered while the on-demand
  load is in place. The tripwire is well built; it just needs to hold the first time someone
  adds analytics.
- **P2 — the French legal copy is tutoiement**, enforced by `tutoiement.test.tsx`, where
  legal French is vouvoiement by convention. AGENTS.md already records this as the one place
  the register deliberately slips.

### Domain 3 — Accessibility

- No blocking gaps, and the domain scaled with the feature surface rather than lagging it:
  25 `prefers-reduced-motion` references (was 5), covering the new Playground effects, the
  celebration animation, the blog featured article and the `PipelineBoard` slice.
- Watch item, not a finding: `src/content/site.test.ts` enforces the display-font ASCII rule
  (DEC-023) for `site.ts`, but Prismic-authored blog and case-study titles bypass it.
  `pnpm prismic:check-display` exists to cover exactly that and is **not wired into
  `ci.yml`** — see Domain 6.

### Domain 4 — Architecture & standalone integrity

- **P1 (carried, four audits) — `src/proxy.ts` guards a route that does not exist.**
  `(auth)/verify/route.ts:20` redirects a successfully authenticated user to
  `/espace/${consumed.clientId}`. `find src/app -type d -name 'espace*'` returns nothing and
  the build manifest has no `/espace` entry, so the happy path of the entire sign-in flow
  terminates in `not-found.tsx`. Expected for in-progress Portal work — but it is shipped and
  reachable, and no test covers it.
- **P2 — Brand hex is now duplicated in _three_ files, up from two.**
  `apple-icon.tsx:14`, `opengraph-image.tsx:18` and the new
  `[locale]/playground/[effect]/opengraph-image.tsx:20` each carry `#f2ff26`. The exception
  is justified — `next/og` (Satori) cannot read CSS custom properties — but the count is
  drifting the wrong way, which is precisely what a `lint:tokens` script would have caught.
- **P2 — ADR 0005 numbering collision** persists: `0005-motion-stack.md` and
  `0005-nextjs-standalone-docker.md`. AGENTS.md's "ADR 0005" references stay ambiguous.
- **P2 — `public/contact.php` is still in the tree** (5 133 bytes), shipping verbatim as a
  static asset. AGENTS.md marks it retired and reference-only; nothing but comments reference
  it now. Harmless but removable.

#### Hardcoded values (P0/P1)

**None.** The Step 3.5 scan over `src/**/*.{ts,tsx}` (tests and stories excluded) across all
five categories — Image & Asset Sizes, Truncation & Content Limits, Animation & Timing
Constants, Layout & Breakpoint Constants, Default Parameters — found **0 P0 and 0 P1**, for
the fourth audit running, and this time across a materially larger codebase.

Every runtime knob introduced by `v0.7.0`/`v0.8.0` is lifted and named:
`playground-counter.ts` (`MAX_INCREMENT`), `celebration.tsx` (`CONFETTI_COUNT`),
`alignment-detector.ts` (`ALIGNMENT_HOLD_MS`), `poids-lourd/engine.ts`
(`SAMPLE_HISTORY_MS`), `physics.ts` (`DEFAULT_SAMPLE_WINDOW_MS`), `legal-body.ts`
(`MINIMUM_AUTHORED_LENGTH`), `subpage-photo.tsx` (`TILT_X_DEGREES`, `TILT_Y_DEGREES`) —
alongside the previously catalogued `states.ts`, `scene-canvas.tsx`, `session.ts`,
`magic-link.ts` and `rate-limit.ts` constants.

Reviewed and classified **P2, no penalty**: the `next/og` route conventions (`1200×630`,
`180×180`) are platform-fixed sizes; the zod field maxima in `api/contact/handler.ts:18,23,25`
read idiomatically inline in the schema they constrain; `personality-slider.tsx:10`'s
`position === 50` is the axis midpoint the component is defined around. **No penalty applied
to Domain 4.**

### Domain 5 — Code quality

- `pnpm lint`, `pnpm typecheck` and `pnpm format:check` are all clean. Exactly **one**
  TODO/FIXME/XXX/HACK in runtime code — `config/clients.ts:46`, an owner action item rather
  than code debt.
- Comments consistently justify rather than narrate, and the new code raised the bar:
  `brand-pairings.ts:89-91` argues why an inline script cannot be escaped,
  `article-pairing.tsx:11-35` explains why a layout effect is required and why React's
  dev-only warning is the premise rather than a fault, `playground-counter.ts:74-77` explains
  the serialization queue against the update-loss it prevents, and
  `counter/handler.ts:6-8` explains why the schema's upper bound is generous where the lib
  clamps.
- Server/client split respected; `"use client"` stays confined to components that need
  browser APIs.

### Domain 6 — Correctness & tests

- **768 tests / 98 files pass** in 10.9 s (was 432/55 at `v0.6.0`, 156/29 at `v0.5.1`).
  Behaviour-driven through rendered output, colocated with their subjects. A separate
  Storybook test config (`pnpm test:storybook`) now exists alongside.
- CI is green on every recent run across `main` and `develop`, and the `v0.8.0` production
  deploy succeeded.
- **P1 — the `/espace` dead-end is still uncovered.** Nothing asserts where `/verify`
  actually lands, so CI stays green while the sign-in happy path 404s. Carried here because
  it is invisible to the suite _by construction_. _(Same finding as Domain 4.)_
- **P2 — `pnpm prismic:check` / `prismic:check-display` are still not in `ci.yml`.** Model
  drift between git and the Prismic dashboard, and accented copy in display-font slots
  (DEC-023), are both detectable by scripts the repo already ships — neither runs
  automatically. This matters more now that the blog adds a second Prismic-backed route
  family with editor-authored titles.
- Harmless noise: jsdom prints ~19 `HTMLCanvasElement.getContext()` warnings.

### Domain 7 — Performance

- The Playground was built with a payload budget in mind: a typed registry plus an
  `EffectStage` lazy boundary means **an unopened effect costs 0 kB**, and the home hero's
  studio rig was extracted rather than duplicated (ARCH-019).
- `public/models/scene.glb` is a real 45 592-byte Draco asset and Three.js stays behind a
  dynamic import gated on `HAS_HERO_MODEL`.
- **P2 — 764 KB of Draco decoder assets** still ship in every image (`public/draco/`); only
  the wasm path is needed by modern browsers, so the ~512 KB JS fallback is the removable
  half. _(Carried.)_
- **P2 — `src/photos/` is 3.4 MB of source JPEGs**, served through the `next/image`
  optimiser under standalone — build-time and repo-size cost, not wire cost. _(Carried.)_
- Fundamentals good: self-hosted woff2 via `next/font/local` with `display: "swap"`, CSS-only
  animation outside the 3D surfaces, `.next/cache` restored in CI.

### Domain 8 — Supply chain + release/deploy

- **P1 (new) — 14 open advisories, 7 of them high, across 1 280 dependencies** — up from 3
  at `v0.6.0`. The framework itself is the bulk of it:
  - **`next@16.2.9` — 4 high + 5 moderate, all patched in `16.2.11`.** Highs: DoS in App
    Router Server Actions; **Middleware/Proxy bypass**; SSRF via rewrites with an
    attacker-controlled destination hostname; SSRF in Server Actions on custom servers.
    Moderates: two cache-confusion issues on requests with bodies, Image Optimization DoS via
    SVG, unauthenticated disclosure of internal Server Function endpoints, unbounded Server
    Action payload on Edge. The proxy-bypass advisory deserves specific attention because
    `src/proxy.ts` is where this app's `/espace` access control lives. **A patch release is
    available; this is a version bump, not a migration.**
  - **`sharp@0.34.5` — high** (inherited libvips CVEs, patched in `>=0.35.0`). Production
    dependency, and it is the code path the `next/image` optimiser runs visitor-triggered
    image work through.
  - **`postcss@8.4.31` — high** (arbitrary file read via attacker-controlled
    `sourceMappingURL`) **+ moderate** (XSS via unescaped `</style>`). Reaches the production
    tree via `next`; the dev copies are already on 8.5.16.
  - **`brace-expansion` — high** (ReDoS) and **`elliptic` — low**, both dev-only via
    `@storybook/nextjs` and ESLint.
- **P1 (new) — `deploy/env.template` is missing every `PRISMIC_*` variable.** The container's
  only env source is `env_file: .env` (`docker-compose.yml:13`), and the template — the
  operator's checklist for building that file — lists `NODE_ENV`, `PORT`, `HOSTNAME`,
  `AUTH_SECRET`, `PORTAL_BASE_URL`, `GRAPH_*`, `MAIL_*` and `PLAYGROUND_COUNTER_FILE`, but
  **none of** `PRISMIC_REPOSITORY_NAME`, `PRISMIC_ACCESS_TOKEN` or `PRISMIC_WEBHOOK_SECRET`.
  AGENTS.md is explicit that the webhook secret "belongs in the VPS `.env`". Because
  `revalidate/handler.ts:52` **fails closed**, an unset secret rejects every Prismic webhook —
  publishing appears to succeed in Prismic and the site never updates, with no error surfaced
  to anyone. The two other variables are needed at runtime as well, since a revalidated page
  re-queries Prismic when it regenerates.
  **Fix:** add all three to `deploy/env.template` with a note that they are runtime-only, and
  verify the live VPS `.env` actually carries them.
- **P1 (carried, four audits) — No `.github/dependabot.yml`.** 1 280 dependencies,
  unmonitored. The advisory count quadrupling between two releases is what that costs.
- **P1 (carried, four audits) — CI Actions pinned by mutable tag, not SHA. 20 of 23
  references**, up from 16 as workflows were added. `deploy-production.yml` — the workflow
  holding `DEPLOY_SSH_KEY`, the highest blast radius in the repo — runs
  `actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4`. The repo already
  demonstrates the correct pattern **twice**: `ferry-router.yml:51` SHA-pins `actions/checkout`
  with the version in a trailing comment, and `ci.yml:37` pins the gitleaks image **by
  digest**. It is a known technique here, just not applied.
- **P2 (carried) — `deploy-preview.yml` cannot succeed.** It still builds a static export with
  `NEXT_PUBLIC_BASE_PATH: /preview` (line 47-50) and rsyncs `out/` (line 86) — a directory
  `output: "standalone"` never produces. An ADR 0005 follow-up that has now outlived four
  releases.
- **P2 (carried) — No `lint:tokens` script.** Brand-hex discipline is manual grep, and the
  count went from two literals to three this release — exactly the drift the script prevents.
- **Clean:** no git-ref/`file:`/`link:`/`workspace:` dependencies; no secrets committed
  (gitleaks gates every PR); `permissions: contents: read` on CI and deploy jobs; deploy SSH
  uses pinned `known_hosts`; the Prismic token rides in as a BuildKit `--secret` mount rather
  than a build arg; the container runs non-root from a multi-stage `node:22-alpine`.

## 6. Legal compliance (RGPD / LCEN)

| Check                                             | Status | Evidence                                                                                                         |
| ------------------------------------------------- | :----: | ---------------------------------------------------------------------------------------------------------------- |
| Self-hosted fonts, no Google Fonts CDN            |   ✅   | `next/font/local` in `document-shell.tsx:19-47`; grep for `fonts.googleapis`/`gstatic` in `src/` clean           |
| No third-party trackers by default                |   ✅   | grep for gtag/GTM/hotjar/clarity/facebook.net/doubleclick clean; Prismic script only inside a draft-mode session |
| Mentions légales present & reachable (LCEN 6-III) |   ✅   | `/[locale]/mentions-legales` in the build manifest (fr + en); SIREN 983 423 351, RCS Paris, hébergeur OVH SAS    |
| Privacy notice at PII collection (RGPD art. 13)   |   ✅   | `/[locale]/politique-de-confidentialite` (fr + en); names both cookies and their retention                       |
| Accessibility statement                           |   ✅   | `/[locale]/accessibilite` (fr + en) — voluntary; RGAA does not apply                                             |
| Legal pages survive an empty CMS                  |   ✅   | `legal-body.ts` falls back to `src/content/legal.ts` below a minimum authored length                             |
| Contact/auth PII retention proportionate          |   ✅   | In-memory IP throttles, 15-min in-memory token store, cookie carries only `{userId, clientId}`                   |
| Consent mechanism                                 |   ✅   | Vendored tarteaucitron, on-demand; `consent-manager.test.ts` guards the cookie name against the policy text      |
| RGAA accessibility declaration                    |  N/A   | Private agency, not a public authority                                                                           |

**Verdict:** **compliant**, and privacy-respecting by construction rather than by
configuration — no CDN fonts, no trackers, no analytics, minimal retention, and zero
third-party requests for a public visitor. The gap that ran through `v0.2.0`–`v0.6.0` is
closed.

## 7. Security posture

Application-level craft is strong and consistent; the new Playground endpoint was held to
the same standard as the auth code. The remaining exposure is concentrated in dependencies
and in operational configuration, not in how the code is written.

**Strengths**

- Headers from `next.config.ts:51-71`: HSTS (`max-age=31536000; includeSubDomains`),
  `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`
  (geolocation/camera/microphone/browsing-topics denied).
- Auth: single-use `randomBytes(32)` tokens deleted unconditionally on lookup (replay-safe
  even when expired), HMAC-SHA256 sessions verified with `timingSafeEqual`, fail-closed on
  every decode branch, `httpOnly` + `secure` in prod + `sameSite: lax`.
- `request-link` is both throttled (5/min/IP) and timing-neutral (fire-and-forget send), so
  the anti-enumeration guarantee it documents actually holds; `src/proxy.ts` returns **404,
  never 403**, for a cross-client `/espace` request.
- Prismic webhook: constant-time comparison, fails closed when unconfigured, identical
  response for a wrong secret and a misconfigured server.
- Playground counter: rate limit before parsing, zod-validated batch, clamping enforced in
  the lib, atomic writes, serialized read-modify-write, never throws.
- `dangerouslySetInnerHTML` used twice, both static and both accompanied by an argument for
  why they cannot be escaped.
- gitleaks gates every PR with the scanner image pinned by digest; no secrets committed;
  non-root container; deploy SSH with pinned `known_hosts`.

**Gaps**

- **`next@16.2.9`: 4 high + 5 moderate advisories, patched in 16.2.11** — including a
  proxy-bypass issue against an app whose access control is a proxy — P1.
- **High-severity `sharp@0.34.5` and `postcss@8.4.31` in the production tree** — P1.
- **Unconstrained `effectId` → unbounded growth of a persisted file** on a public endpoint — P1.
- **Unbounded rate-limit stores** (`src/lib/rate-limit.ts`, no eviction), now backing three
  limiters — P1.
- **`PRISMIC_WEBHOOK_SECRET` absent from `deploy/env.template`**, and the route fails closed —
  silent publish breakage — P1.
- **No Dependabot; 20 of 23 Action references on mutable tags**, including the
  `DEPLOY_SSH_KEY` workflow — P1.
- First-hop `X-Forwarded-For` trust, pending Traefik `trustedIPs` verification — P2.
- Silent `PORTAL_BASE_URL` → request-origin fallback — P2.
- `/api/revalidate` unthrottled; placeholder client roster; no CSP (documented) — P2.

## 8. Deploy consistency

| Location                            | Value                                                                      |   Status    |
| ----------------------------------- | -------------------------------------------------------------------------- | :---------: |
| `package.json` `.version`           | `0.8.0`                                                                    |  canonical  |
| Latest git tag                      | `v0.8.0`                                                                   |    match    |
| `main` tip                          | `9abf4be` (`release: v0.8.0`)                                              |    match    |
| `origin/develop` vs `main`          | level — no promotion backlog                                               |    match    |
| Last production deploy              | `Deploy production (v2 — Docker)` on `v0.8.0` — success                    |    match    |
| `deploy-production.yml` trigger     | `push: tags: ["v*"]` + `workflow_dispatch` (ADR 0006)                      |    match    |
| `deploy-production.yml` permissions | `contents: read`                                                           |    match    |
| `deploy.sh` role                    | break-glass only, documented at line 2                                     |    match    |
| `deploy.sh` VPS path                | `/home/ubuntu/big-emotion/website`                                         |    match    |
| Playground counter volume           | `playground-data:/app/data` + `PLAYGROUND_COUNTER_FILE` in template        |    match    |
| Legacy WordPress 301s               | 4 rules × 2 slash variants = 8, `permanent: true`, destinations verified   |    match    |
| `CHANGELOG.md` / tags               | 10 tags `v0.1.0` → `v0.8.0`, Keep a Changelog maintained                   |    match    |
| CI gates                            | gitleaks, lint, typecheck, format:check, test, build — all green           |    match    |
| `deploy/env.template` vs code       | **`PRISMIC_REPOSITORY_NAME` / `_ACCESS_TOKEN` / `_WEBHOOK_SECRET` absent** | **MISSING** |
| Actions pinned by SHA               | 3 of 23 (`ferry-router.yml` checkout ×3; gitleaks pinned by digest)        | **MISSING** |
| `.github/dependabot.yml`            | absent                                                                     | **MISSING** |
| `prismic:check` in `ci.yml`         | absent — model drift and DEC-023 display drift both undetected in CI       | **MISSING** |
| `deploy-preview.yml`                | still static-export + `out/` — cannot succeed under `standalone`           | **BROKEN**  |

Everything version-, tag-, path- and volume-related is consistent, and the release
machinery demonstrably works end to end. The flagged rows are all supply-chain or
configuration debt; `env.template` is the one with a silent production failure mode behind
it.

## 9. Prioritized action list

| #   |  Pri   | Action                                                                                                                          | Anchor                                                 |
| --- | :----: | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | **P1** | Upgrade `next` to `>=16.2.11` (closes 4 high + 5 moderate, incl. the proxy-bypass); bump `sharp` to `>=0.35.0`                  | Domain 8; `src/proxy.ts` is the access-control surface |
| 2   | **P1** | Add `PRISMIC_REPOSITORY_NAME`, `PRISMIC_ACCESS_TOKEN`, `PRISMIC_WEBHOOK_SECRET` to `deploy/env.template`; verify the VPS `.env` | AGENTS.md "runtime-only … belongs in the VPS `.env`"   |
| 3   | **P1** | Constrain `effectId` to the registry (`z.enum` off `playgroundEffects`) or drop unknown ids in `incrementCounter`               | `counter/handler.ts:10`; `effects.ts:40,51`            |
| 4   | **P1** | Add eviction to `src/lib/rate-limit.ts` — sweep expired buckets; `hitsByKey.delete(key)` when the pruned window is empty        | AGENTS.md "Shared server libs"; precedes SWBE-30       |
| 5   | **P1** | Add `.github/dependabot.yml` covering `npm` + `github-actions`                                                                  | Domain 8, unchanged 4 audits                           |
| 6   | **P1** | SHA-pin the 20 mutable Action references, `deploy-production.yml` first                                                         | follow `ferry-router.yml:51` and `ci.yml:37`           |
| 7   | **P1** | Ship `/espace/[clientId]` or gate the sign-in surface off until it exists; add a test asserting where `/verify` lands           | SWBE-27; ADR 0005                                      |
| 8   | **P2** | Confirm Traefik sanitises `X-Forwarded-For`; record the answer beside the three `clientIp` helpers                              | Domain 1                                               |
| 9   | **P2** | Add `pnpm prismic:check` + `prismic:check-display` to `ci.yml`                                                                  | AGENTS.md Prismic section; DEC-023                     |
| 10  | **P2** | Rewrite `deploy-preview.yml` for standalone output, or delete it until it can be                                                | ADR 0005 follow-up, four releases stale                |
| 11  | **P2** | Add a `lint:tokens` script; lift `#f2ff26` to one shared constant for the three OG/icon routes                                  | AGENTS.md "never hardcode brand values"                |
| 12  | **P2** | Replace the placeholder roster in `src/config/clients.ts` with real provisioned editors                                         | `clients.ts:46` TODO                                   |
| 13  | **P2** | Require `PORTAL_BASE_URL` in production rather than falling back to the request origin                                          | `request-link/route.ts:35`                             |
| 14  | **P2** | Rate-limit `/api/revalidate`; renumber one of the two ADR 0005 files                                                            | Domain 1; `docs/adr/`                                  |
| 15  | **P2** | Delete `public/contact.php` — nothing but comments reference it                                                                 | AGENTS.md "can go once nothing references it"          |

## 10. Conclusion

`v0.8.0` is the first release to score inside the 8–9 band. The reason is specific: the
LCEN/RGPD gap that three consecutive audits called the single blocker is **closed**, and
closed well — three routes in two locales, real registered facts, and a fallback that stops
the CMS from removing copy the law requires. Domain 2 moved 6 → 9 and carried the overall
score with it.

The engineering also held its standard while the surface grew substantially. The Playground
and blog added roughly two thousand lines, and the constant discipline (0 P0 / 0 P1 for a
fourth audit), the comment quality, the reduced-motion coverage and the test count (768,
nearly double) all moved in the right direction rather than being spent to ship features.
The counter endpoint in particular reads like the auth code: validated, throttled, clamped
in the lib rather than only at the edge, atomic on disk, and unable to take the page down
when it fails.

What holds the score at the band's lower edge is now almost entirely **Domain 8 (6/10)**,
and it is the same debt the last three audits named. Two items are new and both deserve
attention before the next tag. `next@16.2.9` is nine advisories behind a patch release that
is a version bump away, and one of those advisories is a proxy bypass in the exact mechanism
this app uses for access control. And `deploy/env.template` never gained the three
`PRISMIC_*` variables the runtime needs — which, combined with a webhook route that
correctly fails closed, produces the worst kind of failure: publishing that appears to work
and silently does not.

Neither is a design problem. Items 1–6 on the action list are all mechanical, and together
they would move Domain 8 from 6 to 9 and Domain 1 from 7 to 9 — putting BIG EMOTION at
**8.6 / 10**.

## 11. Audit-skill corrections

The `bigemotion-audit` skill is materially out of date with the repository. Recorded here so
a future run does not re-derive it. _(Carried from the `v0.6.0` audit and re-verified.)_

| Skill assumes                                         | Actual state                                                                                   |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Static export (`output: "export"`)                    | `output: "standalone"` (ADR 0005)                                                              |
| Apache + `public/.htaccess` headers & 301s            | No Apache. Headers and redirects in `next.config.ts:27-71`                                     |
| `public/contact.php` is the live server code          | Retired. `src/app/api/contact/` + `src/lib/mail.ts`                                            |
| Manual SSH deploy, no CI                              | 7 workflows; tag-gated CI deploy (ADR 0006); `deploy.sh` is break-glass                        |
| No release tags ("pre-launch")                        | 10 tags, `v0.1.0` → `v0.8.0`, with `CHANGELOG.md`                                              |
| `NEXT_PUBLIC_BASE_PATH=/preview` staging model        | Incompatible with standalone; `deploy-preview.yml` is broken                                   |
| No CMS ("add a domain note once Prismic lands")       | Prismic shipped (SWBE-24/80/81); models in git, webhook revalidation, blog + case studies      |
| Single-locale site                                    | Routed FR/EN via next-intl (ADR 0007)                                                          |
| Mentions légales absent                               | Shipped — three legal routes, both locales (SWBE-34)                                           |
| `git grep -E` with `\s` for the Actions-pinning check | POSIX ERE has no `\s` — the check silently passes. Use `grep -rn -E "uses: +…"`                |
| `git grep -- 'src/**/*.ts'` for Step 3.5              | git pathspec does not glob `**` this way — returns nothing. Use `grep -r src --include='*.ts'` |

The last two remain the dangerous ones: both fail **open**, reporting a clean result when the
check never ran. The Actions-pinning check in particular would have reported "all pinned by
SHA" against 20 unpinned references.
