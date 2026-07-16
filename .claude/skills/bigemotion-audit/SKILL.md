---
name: bigemotion-audit
description: Production-readiness audit for the BIG EMOTION website. Read-only multi-axis assessment that answers four questions — is it production-ready, is it legally compliant (RGPD), what is the security posture, and is the score close to 8–9/10. Use when the user asks "is the site ready", "audit big emotion", "production-readiness check", or invokes /bigemotion-audit.
metadata:
  author: jnk
  version: "1.0.0"
---

# BIG EMOTION Audit

Read-only audit of the BIG EMOTION website (static-export Next.js, Apache+PHP on the OVH VPS). Produces a scored, evidence-based report and refreshes `docs/PRODUCTION-READINESS-AUDIT.md`.

This skill **never** modifies source, never bumps versions, never tags, never pushes, never deploys. It only reads and writes the audit doc.

Ported from `chancellerie-audit` (see `sitewebgrandechancellerie/.claude/skills/chancellerie-audit/SKILL.md`) and refitted for a static-export marketing site: 8 domains instead of 9, no RGAA (private agency, not a public authority), no Azure/OIDC, real `pnpm` gates instead of invented ones.

## When to Activate

- User asks: "is the big emotion site production-ready", "audit big emotion", "score the project", "is the site ready to ship".
- User asks specifically about RGPD compliance, security posture, or overall score.
- User invokes `/bigemotion-audit`.

## Preconditions

Run from the repo root (path contains `package.json` with `"name": "big-emotion"`). If not, stop and tell the user to `cd` into the repo.

## Inputs

Optional argument: `--quick` (skip running the full test suite and the production build; rely on the most recent CI run instead, or note explicitly that none exists).

Default: full audit.

## Workflow

### Step 1 — Snapshot the repo state

Run in parallel via Bash:

- `git status --porcelain` — flag uncommitted changes (audit a dirty tree is fine but report it).
- `git log --oneline -20` — recent commit cadence.
- `git tag --sort=-creatordate | head -10` — release tags (expect empty pre-launch; report as such, not as a gap).
- `git rev-parse origin/main` — branch tip. This repo has no `develop`/staging branch: a staging build is instead produced locally via `NEXT_PUBLIC_BASE_PATH=/preview pnpm build` and dropped in a subfolder of the live web root (see AGENTS.md). Note this model rather than looking for branch drift.
- `jq '{name, version, private, packageManager, scripts}' package.json` — version, scripts, package manager.
- `ls .github/workflows/ 2>/dev/null || echo "no .github/workflows directory"` — CI/CD surface. As of this writing the repo has none; deploy is manual SSH (`docs/adr/0003`). Report the actual state, don't assume automation exists.
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
- `pnpm test` (skip with `--quick`).
- `pnpm build` (skip with `--quick`; static export — there is no separate typecheck script, `next build` typechecks as part of the build).
- `pnpm audit --json --audit-level=moderate` — dependency CVEs (parse JSON, count by severity).
- `git grep -nE "TODO|FIXME|XXX|HACK" src/ public/ | wc -l` — code debt heuristic (`public/contact.php` is the one piece of server code, include it).
- `gh run list --limit 5 --json status,conclusion,name 2>/dev/null` — recent CI health, best-effort. Expect this to return nothing (no workflows exist yet); say so plainly rather than treating an empty result as success.

**Brand-token discipline** — there is no `lint:tokens` script in this repo (unlike chancellerie), so grep directly for the four distinctive brand hex values outside their source of truth:

```
git grep -niE "#f2ff26|#ff5200|#0024cc|#dbdbdb" -- '*.ts' '*.tsx' '*.css' ':!src/app/globals.css'
```

Any hit is a P1 finding (hardcoded brand color instead of `var(--color-*)`). If the scan is clean across several audit runs, note in "Gaps and risks" that adding a `lint:tokens` script (à la chancellerie) would make this enforcement automatic instead of manual.

For **application security**, check:

- `public/.htaccess` — security headers via `mod_headers`: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, `Strict-Transport-Security`. Read and verify each is present. **No CSP is expected** — the file documents why (Next's static-export inline bootstrap script would be blocked without per-build nonces); treat the absence as a deliberate, documented tradeoff, not an automatic gap, but note the residual XSS-mitigation risk it leaves.
- `public/contact.php` — grep for: a honeypot field (`grep -n honeypot`), the per-IP rate limiter (`rateLimited()`), input validation (`filter_var(...FILTER_VALIDATE_EMAIL)`), an aligned envelope sender (`ENVELOPE_SENDER` constant used with `mail()`'s `-f` flag). Confirm no SMTP credentials, API keys, or other secrets are hardcoded (`grep -niE "password|secret|api[_-]?key" public/contact.php deploy/env.template`) — `deploy/env.template` should hold placeholders only.
- `.github/workflows/*.yml` (if any exist) — third-party Actions pinned by **SHA**, not `@main`/`@v1`/`@latest`: `git grep -nE "uses:\s+[^/\s]+/[^@\s]+@(main|master|v[0-9]+|latest)" .github/workflows/`. If the directory doesn't exist, say so — don't silently skip the check.
- `.github/dependabot.yml` — exists and covers `npm`. If absent, flag as a supply-chain gap (this repo does carry npm dependencies).
- `package.json` `dependencies`/`devDependencies` — none pinned to git refs, file paths, or `link:`/`workspace:` (`grep -E '"(git\+|github:|file:|link:)"' package.json`).

For **legal compliance (RGPD)** — note **RGAA is explicitly out of scope**: BIG EMOTION is a private agency, not a French public authority, so the accessibility-declaration legal obligation that applied to the chancellerie project does not apply here. Check:

- Self-hosted fonts only: `src/app/layout.tsx` uses `next/font/local` against files under `src/app/fonts/`; no `<link>`/`@import` to `fonts.googleapis.com` anywhere in `src/` (`git grep -n "fonts.googleapis\|fonts.gstatic" src/`).
- No third-party trackers loaded by default: `git grep -niE "gtag|analytics|hotjar|clarity|facebook.net|doubleclick" src/`.
- **Mentions légales**: search `src/content/site.ts` and rendered sections/footer for legal identification (company name, address, SIRET, publication director) — French law (LCEN art. 6-III) requires this on any commercial site regardless of RGAA status. If absent, this is a real gap — flag it explicitly, don't soften it.
- Contact-form data handling: read `public/contact.php` — what persists beyond the mail send (the rate-limit file, keyed on IP)? Note the retention and whether it's proportionate.

For **deploy consistency** (Domain 8's evidence table), adapted to this repo's manual-deploy model:

- Canonical version: `package.json` `.version`.
- `deploy/deploy.sh` rsync target: should be `/home/ubuntu/big-emotion/live/` (per `docs/adr/0003`).
- `deploy/deploy.sh` — does the `rsync -a --delete out/ .../live/` step exclude `/preview`? A staging build can be dropped into a `/preview` subfolder of the live web root via `NEXT_PUBLIC_BASE_PATH=/preview`; without `--exclude='/preview'`, every production deploy silently wipes it. Check for the exclude flag; if missing, this is a real finding, not a maybe.
- `deploy/deploy.sh` — a **break-glass marker**: a comment documenting the manual rollback procedure (e.g. how to redeploy a known-good commit if a bad build ships). Check for a comment mentioning rollback/break-glass/previous-ref; if absent, flag as a gap (the script currently has no such note).
- `.github/workflows/deploy-production.yml` — if present, confirm it triggers on push to `main` and mirrors the rsync target/excludes above. If absent (the current state), report deploy as manual-SSH-only; that's a legitimate finding, not a script bug.
- `public/.htaccess` legacy WordPress 301s — spot-check the `RewriteRule` block still redirects the known old URLs (`contactez-nous`, `les-membres`, `case-study-mamiezi`, `case-study-adolebatisseur`) to the correct anchors; these are an SEO invariant and must not regress.
- `CHANGELOG.md` and `git tag --list` — if the `bigemotion-release` skill exists in `.claude/skills/`, verify CHANGELOG/tag state matches its conventions; if neither exists yet, report as pre-launch, not as a gap.

Report the deploy-consistency result as a small table, e.g.:

```
| Location                                  | Value                                             | Status     |
| ------------------------------------------ | -------------------------------------------------- | ---------- |
| package.json .version                     | 0.1.0                                             | canonical  |
| deploy.sh rsync target                    | /home/ubuntu/big-emotion/live/                    | match      |
| deploy.sh --exclude='/preview'            | absent                                            | MISSING    |
| deploy.sh break-glass marker              | absent                                            | MISSING    |
| .github/workflows/deploy-production.yml   | absent — deploy is manual SSH (docs/adr/0003)     | manual     |
| .htaccess legacy WordPress 301s           | 4 rules present, targets verified                 | match      |
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

**Score impact** — feed this into Domain 4 (Architecture & static-export integrity):

- 0 P0 / ≤ 5 P1 → no penalty.
- 1–3 P0 or 6–15 P1 → −1 on Domain 4.
- ≥ 4 P0 or > 15 P1 → −2 on Domain 4.

Include the hardcoded-values report verbatim under section 5 ("Gaps and risks") of `docs/PRODUCTION-READINESS-AUDIT.md`, in a subsection titled **"Hardcoded values (P0/P1)"**. Only list P0 + P1 in the audit doc — keep P2 in the chat output for the user.

### Step 4 — Score the 8 domains

Use this rubric (1–10 each, weighted equal):

| # | Domain | What to look for |
| --- | --- | --- |
| 1 | Application security | `public/.htaccess` headers (HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy — CSP deliberately absent, see file header comment); `public/contact.php` posture (honeypot, per-IP `rateLimited()` throttle, `filter_var` email validation, aligned envelope sender via `-f`); no secrets committed. |
| 2 | RGPD / privacy | Self-hosted fonts only via `next/font/local` (no Google Fonts CDN); no third-party trackers loaded by default; mentions légales present and reachable; contact-form PII handling reviewed (rate-limit file retention). RGAA is **not required** — private agency, not a public authority. |
| 3 | Accessibility (craft, not compliance) | Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`) in `src/app/layout.tsx`; alt text on images driven by `src/content/site.ts`; visible focus styles in `globals.css`; `prefers-reduced-motion` respected by the CSS-only marquee/animations; mobile-first verified at 320–430 px. |
| 4 | Architecture & static-export integrity | `next.config.ts` `output: "export"` intact, no SSR/API-route/middleware leakage; `trailingSlash: true` preserved; all copy lives in `src/content/site.ts` (no inline marketing copy in components); server code confined to `public/contact.php` + `public/.htaccess`; `contact-form.tsx` ↔ `contact.php` JSON/redirect contract in sync; no untunable magic numbers (see Step 3.5). |
| 5 | Code quality | `pnpm lint` clean; comments explain why, not what; names carry domain meaning (no `data`/`handle`/`util`); server vs. client component split respected (only `site-header.tsx` and `contact-form.tsx` are `"use client"`). |
| 6 | Correctness & tests | `pnpm test` passes; Vitest + Testing Library coverage exercises rendered output and user interactions, not implementation details; tests colocated (`*.test.tsx` next to the component); CI green (if CI exists — note if it doesn't). |
| 7 | Performance | Self-hosted woff2 fonts via `next/font/local` with `display: "swap"`; `next/image` `unoptimized: true` policy acknowledged, image weights sane; `.htaccess` caching policy (immutable `_next/static`, no-cache HTML); note the upcoming payload-budget risk once 3D assets land (per the revamp program), even though none exist yet. |
| 8 | Supply chain + release/deploy consistency | `package.json` dependencies free of git-ref/path/`link:` entries; `pnpm audit` clean at `moderate`; `.github/workflows` Actions pinned by SHA + Dependabot configured (if any workflows exist — else flag "no CI/CD automation present" explicitly); deploy-consistency table from Step 3 has no unexplained `MISSING` rows; legacy WordPress 301s in `.htaccess` still present and correct; CHANGELOG/tag state consistent with the `bigemotion-release` skill's conventions (or reported pre-launch). |

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
3. **Security posture?** One short paragraph + bullet list of strengths and gaps. Reference: `.htaccess` headers (and the documented no-CSP tradeoff), `contact.php` posture, secrets handling, supply chain (Actions pinning if any, Dependabot, `pnpm audit`).
4. **Is the score close to 8–9/10?** Quote the computed score, compare to target, list the top 3 gaps that would close the distance.

### Step 6 — Write the report

Update `docs/PRODUCTION-READINESS-AUDIT.md` in place (preserve the existing structure if present; if absent, create it). Bump the `Date:` field to today's date.

Then output a concise summary to the user (≤ 25 lines): the four answers + the computed score + the top 3 actions. The full detail lives in the file.

### Step 7 — Verification

Before reporting done:

- [ ] All 8 domain scores justified by at least one piece of evidence (command output, file path, line number).
- [ ] The four canonical questions are answered explicitly in section 1 of the report.
- [ ] No score is invented — if a check could not run, mark it `N/A` and explain (this includes "no CI exists" — that's a fact to report, not an error to hide).
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
- Prismic checks — this project has no CMS today. Add a domain note once Prismic (or any CMS) lands.
