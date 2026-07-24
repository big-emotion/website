---
name: bigemotion-audit
description: Production-readiness audit for the BIG EMOTION website. Read-only multi-axis assessment that answers four questions — is it production-ready, is it legally compliant (RGPD), what is the security posture, and is the score close to 8–9/10. Use when the user asks "is the site ready", "audit big emotion", "production-readiness check", or invokes /bigemotion-audit.
metadata:
  author: jnk
  version: "1.0.0"
---

# BIG EMOTION Audit

Read-only audit of the BIG EMOTION website (standalone Next.js in Docker behind Traefik on the OVH VPS). Produces a scored, evidence-based report and refreshes `docs/PRODUCTION-READINESS-AUDIT.md`.

This skill **never** modifies source, never bumps versions, never tags, never pushes, never deploys. It only reads and writes the audit doc.

Ported from `chancellerie-audit` (see `sitewebgrandechancellerie/.claude/skills/chancellerie-audit/SKILL.md`) and refitted for the standalone marketing, API, auth, Prismic, and deployment surfaces: 8 domains instead of 9, no RGAA (private agency, not a public authority), no Azure/OIDC, and the repository's real `pnpm` gates.

## When to Activate

- User asks: "is the big emotion site production-ready", "audit big emotion", "score the project", "is the site ready to ship".
- User asks specifically about RGPD compliance, security posture, or overall score.
- User invokes `/bigemotion-audit`.

## Preconditions

Run from the repo root (path contains `package.json` with `"name": "big-emotion"`). If not, stop and tell the user to `cd` into the repo. Also require parseable `docs/confluence-spec/config.json` and `docs/confluence-spec/req-catalog.json`, with the catalog `pageId` equal to `requirementsPageId`; otherwise the audit cannot assess traceability.

## Inputs

Optional argument: `--quick` (skip running the full test suite and the production build; rely on the most recent CI run instead, or note explicitly that none exists).

Default: full audit.

## Workflow

### Step 1 — Snapshot the repo state

Run in parallel via Bash:

- `git status --porcelain` — flag uncommitted changes (audit a dirty tree is fine but report it).
- `git log --oneline -20` — recent commit cadence.
- `git tag --sort=-creatordate | head -10` — release tags (expect empty pre-launch; report as such, not as a gap).
- `git rev-parse origin/main origin/develop` and `git rev-list --count origin/main..origin/develop` — release and integration tips plus unpromoted commit count. Feature work targets `develop`; releases are tagged from `main` after a manual fast-forward promotion.
- `jq '{name, version, private, packageManager, scripts}' package.json` — version, scripts, package manager.
- `ls .github/workflows/` — CI/CD surface. Verify `ci.yml` gates pushes and pull requests to `develop` and `main`, while `deploy-production.yml` deploys only `v*` tags.
- `ls docs/ docs/adr/ deploy/` — structural map.

### Step 2 — Read the existing audit (if present)

Read `docs/PRODUCTION-READINESS-AUDIT.md` if it exists. Keep its scoring rubric and section ordering — this skill **updates** that file rather than replacing the format.

The canonical structure is:

1. Scope and method
2. Overall score (X / 10) — one-line verdict
3. Score per domain (table, 8 domains)
4. Strengths (bulleted)
5. Gaps and risks (per domain, with evidence) — includes a **"Hardcoded values (P0/P1)"** subsection
6. Legal compliance (RGPD) — dedicated section
7. Security posture — dedicated section
8. Deploy consistency table (detail for Domain 8)
9. Prioritized action list (15 max, each tied to an AGENTS.md section, an ADR, or a Jira ticket — e.g. SWBE-xxx)
10. Conclusion

### Step 3 — Gather evidence

Run these in parallel (skip any that fail and note it in the report):

- `pnpm lint` — ESLint.
- `pnpm typecheck` — standalone TypeScript validation.
- `pnpm format:check` — formatting drift.
- `pnpm lint:req` — Confluence requirement IDs, lifecycle, and test evidence.
- `pnpm test` (skip with `--quick`).
- `pnpm build` (skip with `--quick`; standalone Next.js production build).
- `pnpm audit --json --audit-level=moderate` — dependency CVEs (parse JSON, count by severity).
- `git grep -nE "TODO|FIXME|XXX|HACK" src/ public/ deploy/ | wc -l` — code debt heuristic. Treat `public/contact.php` as a retired behavioral reference, not active server code.
- `gh run list --limit 5 --json status,conclusion,name,headSha,url 2>/dev/null` — recent CI health, best-effort. Correlate the latest successful `ci.yml` run with the audited commit.

**Brand-token discipline** — there is no `lint:tokens` script in this repo (unlike chancellerie), so grep directly for the four distinctive brand hex values outside their source of truth:

```
git grep -niE "#f2ff26|#ff5200|#0024cc|#dbdbdb" -- '*.ts' '*.tsx' '*.css' ':!src/app/globals.css'
```

Any hit is a P1 finding (hardcoded brand color instead of `var(--color-*)`). If the scan is clean across several audit runs, note in "Gaps and risks" that adding a `lint:tokens` script (à la chancellerie) would make this enforcement automatic instead of manual.

For **Confluence traceability**, check:

- `docs/confluence-spec/config.json` contains the canonical Engineering tree and four child page IDs.
- `docs/confluence-spec/req-catalog.json` has unique monotonic IDs and its `pageId` matches `requirementsPageId`.
- `pnpm lint:req` passes: every `Implemented` or `Approved` requirement has test evidence, `Obsolete` IDs are rejected, and requirement-bearing JSDoc exports have matching tests.
- `.github/workflows/ci.yml` and `lint-staged.config.mjs` invoke the traceability gate.

For **application security**, check:

- `next.config.ts` — security headers, legacy redirects, `trailingSlash`, and `output: "standalone"`.
- `src/app/api/contact/handler.ts`, `src/lib/rate-limit.ts`, and `src/lib/mail.ts` — validation, throttling, anti-abuse behavior, and absence of hardcoded credentials.
- `src/app/api/revalidate/handler.ts` and preview routes — fail-closed webhook authentication, constant-time comparison, coarse `prismic` tag invalidation, and draft-mode isolation.
- `src/proxy.ts`, `src/lib/session.ts`, and `src/lib/magic-link.ts` — auth routing, signed HttpOnly sessions, one-time expiring links, and anti-enumeration behavior.
- `.github/workflows/*.yml` (if any exist) — third-party Actions pinned by **SHA**, not `@main`/`@v1`/`@latest`: `git grep -nE "uses:\s+[^/\s]+/[^@\s]+@(main|master|v[0-9]+|latest)" .github/workflows/`. If the directory doesn't exist, say so — don't silently skip the check.
- `.github/dependabot.yml` — exists and covers `npm`. If absent, flag as a supply-chain gap (this repo does carry npm dependencies).
- `package.json` `dependencies`/`devDependencies` — none pinned to git refs, file paths, or `link:`/`workspace:` (`grep -E '"(git\+|github:|file:|link:)"' package.json`).

For **legal compliance (RGPD)** — note **RGAA is explicitly out of scope**: BIG EMOTION is a private agency, not a French public authority, so the accessibility-declaration legal obligation that applied to the chancellerie project does not apply here. Check:

- Self-hosted fonts only: `src/app/document-shell.tsx` uses `next/font/local` against files under `src/app/fonts/`; no `<link>`/`@import` to `fonts.googleapis.com` anywhere in `src/` (`git grep -n "fonts.googleapis\\|fonts.gstatic" src/`).
- No third-party trackers loaded by default: `git grep -niE "gtag|analytics|hotjar|clarity|facebook.net|doubleclick" src/`.
- **Legal pages**: inspect `src/content/legal.ts`, `src/components/legal/legal-body.tsx`, and the three localized legal routes. Confirm mandatory fallback copy survives missing/undersized Prismic content.
- **Consent**: verify `src/components/consent/consent-manager.ts` remains on-demand only while `CONSENT_SERVICES` is empty, and that its cookie name matches the privacy policy.
- Contact-form data handling: inspect the active API handler and in-memory rate limiter. Note what PII persists, for how long, and whether it is proportionate.

For **deploy consistency** (Domain 8's evidence table):

- Canonical version: `package.json` `.version`.
- `.github/workflows/deploy-production.yml` — confirm it triggers only on `v*` tag pushes plus explicit `workflow_dispatch`, builds the standalone Docker image, transfers it to the VPS, and serializes deployments.
- `deploy/Dockerfile`, `deploy/docker-compose.yml`, and `deploy/deploy.sh` — verify the automated image contract and break-glass rebuild path agree on environment variables, health checks, service name, and Traefik routing.
- `next.config.ts` — spot-check legacy WordPress redirect sources and current destinations; redirects live here, never in `.htaccess`.
- `git rev-list --count origin/main..origin/develop` — zero is required before a release tag can represent all integrated work.
- `CHANGELOG.md` and `git tag --list` — if the `bigemotion-release` skill exists in `.claude/skills/`, verify CHANGELOG/tag state matches its conventions; if neither exists yet, report as pre-launch, not as a gap.

Report the deploy-consistency result as a small table, e.g.:

```
| Location                                  | Value                                             | Status     |
| ------------------------------------------ | -------------------------------------------------- | ---------- |
| package.json .version                     | 0.1.0                                             | canonical  |
| deploy-production.yml trigger             | v* tags + workflow_dispatch                       | match      |
| Docker image / compose runtime contract    | standalone Node server behind Traefik             | match      |
| deploy.sh break-glass path                 | documented and aligned                            | match      |
| next.config.ts legacy WordPress 301s       | source invariants preserved                       | match      |
| origin/main..origin/develop                | 0 before release                                  | match      |
| CHANGELOG.md / git tags                   | absent                                            | pre-launch |
```

Any row marked `MISSING` (other than the pre-launch rows) is a P0/P1 finding for Domain 8, per your judgment of its blast radius.

### Step 3.5 — Hardcoded values scan (`src/**`)

The site has tunable runtime knobs even without a backend — image sizes, truncation lengths, animation durations, breakpoint-adjacent constants. Magic numbers embedded in `src/**` are silent coupling. Scan and score.

**Scope:** `src/**/*.{ts,tsx}` only. Exclude `*.test.ts`, `*.test.tsx`.

**What to flag:**

1. **Magic numbers** in runtime logic — image sizes (`width={1200}`), truncation lengths (`slice(0, N)`, `substring(0, N)`), animation/transition durations (`* 1000`, `* 60`), comparison constants (`if (x > N)`), breakpoint pixel values duplicated outside CSS.
2. **Default function parameters** — `function foo(x = 30)`, `(x: number = 100)`, and literal-RHS coalescing like `opts.timeout ?? 30000`.

**Skip:** `0`/`1`/`-1`/`2` used as indices/exit codes/booleans; HTTP status codes; loop counters; math identities; Tailwind class strings.

**Categories** (use these exact buckets in the report):

- Image & Asset Sizes
- Truncation & Content Limits
- Animation & Timing Constants
- Layout & Breakpoint Constants
- Default Parameters

**Severity:**

- **P0** — must externalize. Affects production behavior or SEO/legal metadata differently per environment.
- **P1** — should externalize or lift to a named constant. Likely to be tuned later (image dimensions, animation timing visible to users, truncation lengths in copy).
- **P2** — acceptable as-is. Internal tuning constant unlikely to change.

**How to scan:**

```
git grep -nE '\b[0-9]{3,}\b' -- 'src/**/*.ts' 'src/**/*.tsx' | grep -vE '\.test\.'
git grep -nE '= [0-9]+[,)]|\?\? [0-9]+|\|\| [0-9]+' -- 'src/**/*.ts' 'src/**/*.tsx'
git grep -nE 'setTimeout|slice\(0,|substring\(0,|\.length > [0-9]' -- 'src/**/*.ts' 'src/**/*.tsx'
```

Read each suspect file to confirm the hit is real (not a string literal, not a comment, not a Tailwind class), capture the line number, and bucket by category + severity.

**Output:** flat markdown list grouped by category, P0 first within each group. Each line: `**Pn** path:line — value — one-line description`.

**Score impact** — feed this into Domain 4 (Architecture & standalone integrity):

- 0 P0 / ≤ 5 P1 → no penalty.
- 1–3 P0 or 6–15 P1 → −1 on Domain 4.
- ≥ 4 P0 or > 15 P1 → −2 on Domain 4.

Include the hardcoded-values report verbatim under section 5 ("Gaps and risks") of `docs/PRODUCTION-READINESS-AUDIT.md`, in a subsection titled **"Hardcoded values (P0/P1)"**. Only list P0 + P1 in the audit doc — keep P2 in the chat output for the user.

### Step 4 — Score the 8 domains

Use this rubric (1–10 each, weighted equal):

| # | Domain | What to look for |
| --- | --- | --- |
| 1 | Application security | Security headers and redirects in `next.config.ts`; contact validation/rate limiting; signed sessions and single-use magic links; fail-closed Prismic webhook; no secrets committed. |
| 2 | RGPD / privacy | Self-hosted fonts; no third-party scripts by default; legal fallback copy remains reachable without Prismic; consent manager behavior matches registered services; contact-form PII handling reviewed. |
| 3 | Accessibility (craft, not compliance) | Semantic landmarks in both document surfaces; content-driven alt text; visible focus styles; reduced-motion behavior; mobile-first verified at 320–430 px. |
| 4 | Architecture & standalone integrity | `output: "standalone"` and `trailingSlash: true`; marketing SSG plus dynamic API/auth routes; locale-aware navigation; server behavior in `next.config.ts`/`deploy/`; no untunable magic numbers (see Step 3.5). |
| 5 | Code quality | `pnpm lint`, `pnpm typecheck`, and `pnpm format:check` pass; comments explain why; names carry domain meaning; server/client boundaries are intentional. |
| 6 | Correctness, tests & traceability | `pnpm test` and `pnpm lint:req` pass; tests exercise contracts; implemented Confluence REQs have annotated evidence; obsolete/unknown IDs fail CI; recent CI is green. |
| 7 | Performance | Self-hosted woff2 fonts; active `next/image` optimization; static marketing routes; Three.js/GSAP/Lenis payload and Draco assets remain bounded; caching/revalidation behavior is intentional. |
| 8 | Supply chain + release/deploy consistency | Dependencies avoid git/file links; `pnpm audit` is clean at `moderate`; Actions are SHA-pinned; Dependabot exists; CI gates `develop`/`main`; production deploys only from `v*` tags; `develop` promotion and CHANGELOG/tag state are consistent. |

Compute overall score = mean of the 8 domain scores, rounded to one decimal.

### Step 5 — Answer the four user-facing questions

Always include a top section answering the four canonical questions explicitly:

1. **Is the project production-ready?** Yes / No / Conditional, plus the 1–3 blockers.
2. **Is it legally compliant (RGPD)?** Walk through:
   - Self-hosted fonts only, no Google Fonts CDN?
   - No third-party trackers loaded by default?
   - Mentions légales present and reachable (LCEN art. 6-III — required regardless of RGAA)?
   - Contact-form data retention proportionate?
   - Note explicitly: RGAA does not apply (private agency).
3. **Security posture?** One short paragraph + bullet list of strengths and gaps. Reference `next.config.ts` headers, API/auth boundaries, Prismic webhook/preview isolation, secrets handling, and supply chain.
4. **Is the score close to 8–9/10?** Quote the computed score, compare to target, list the top 3 gaps that would close the distance.

### Step 6 — Write the report

Update `docs/PRODUCTION-READINESS-AUDIT.md` in place (preserve the existing structure if present; if absent, create it). Bump the `Date:` field to today's date.

Then output a concise summary to the user (≤ 25 lines): the four answers + the computed score + the top 3 actions. The full detail lives in the file.

### Step 7 — Verification

Before reporting done:

- [ ] All 8 domain scores justified by at least one piece of evidence (command output, file path, line number).
- [ ] The four canonical questions are answered explicitly in section 1 of the report.
- [ ] No score is invented — if a check could not run, mark it `N/A` and explain.
- [ ] Confluence config/catalog alignment and `pnpm lint:req` are evidenced under Domain 6.
- [ ] `docs/PRODUCTION-READINESS-AUDIT.md` was updated (or created) and the Date field reflects today.
- [ ] Step 3.5 ran: P0 + P1 hardcoded values are listed under "Gaps and risks > Hardcoded values" in the audit doc, and Domain 4 reflects the penalty (or notes the count was below threshold).
- [ ] Step 3 deploy-consistency table is included in section 8 of the report.
- [ ] `git status` shows no change other than `docs/PRODUCTION-READINESS-AUDIT.md`.

## Output Format

User-facing summary (printed at end):

```
BIG EMOTION Audit — <YYYY-MM-DD>
Score: X.X / 10 (target 8–9)

1. Production-ready? <verdict + 1-line reason>
2. RGPD compliant? <verdict + 1-line reason>
3. Security posture? <one line>
4. Distance to 8–9? <top 3 actions>

Full report: docs/PRODUCTION-READINESS-AUDIT.md
```

## Out of Scope

- Fixing any gap found. The audit only **reports**.
- Bumping versions, creating tags, updating CHANGELOG. Use the `bigemotion-release` skill for that.
- Live Lighthouse / WebPageTest runs. Performance domain scores on configuration and budgets, not live measurement.
- Azure, OIDC, and RGAA-declaration checks — those are chancellerie-specific and do not apply to this project.
- Mutating Prismic schemas or content. The audit may run read-only drift checks but never pushes models or content.
