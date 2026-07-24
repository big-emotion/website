# 0006 — Trigger production deploy on a v* tag, not on push to main

- Status: accepted
- Date: 2026-07-19

## Context

ADR 0004 set the production deploy to fire on every push to `main`, reasoning
that a trunk-based one-page site gains nothing from a tag ceremony. ADR 0005
(standalone Docker) reworked _how_ the deploy runs — build a Docker image, ship
the tarball, restart the container — but explicitly kept ADR 0004's
`push: branches: [main]` trigger.

In practice the owner wants an explicit release gesture to control _when_
production changes. Under the push-to-main trigger, every merged PR ships to
visitors immediately; there is no way to land work on `main` without deploying
it. The `bigemotion-release` skill already produces an annotated `v<semver>`
tag on `main` HEAD (after checking the tree is clean, on `main`, up to date, and
CI-green), but that tag was inert — a version marker that deployed nothing.

## Decision

- **Trigger: `push: tags: ["v*"]`** instead of `push: branches: [main]`. A merge
  to `main` no longer deploys. Pushing a `v*` tag — which `/bigemotion-release`
  creates on `main` HEAD — is the sole automatic production deploy trigger.
  `workflow_dispatch` with a `ref` input stays the manual redeploy/rollback
  affordance (dispatch with a known-good tag or SHA).
- **No branch-ancestry guard (KISS).** CI does not verify that the tagged commit
  is an ancestor of `origin/main`. `/bigemotion-release` only ever tags `main`
  HEAD, and only after its clean-tree / on-main / up-to-date / CI-green
  preconditions pass; re-checking that in a CI guard job would duplicate a
  discipline the release path already enforces. A `v*` tag pushed by hand onto a
  non-main commit would deploy — an accepted, owner-only risk, in the same
  spirit as ADR 0004 trusting the owner with `workflow_dispatch`.
- **Post-merge validation moves with the trigger.** `ci.yml` still gates every
  PR to `main` (lint, test, build). `main` is no longer built after merge until
  a release tag is cut; the deploy job itself re-runs lint + test + the Docker
  build on the tagged commit before it ships, so nothing reaches production
  unbuilt.

## Consequences

- Deploy = push a `v*` tag (via `/bigemotion-release`). Rollback =
  `workflow_dispatch` with `ref=<last-good-tag-or-sha>`.
- Merges to `main` accumulate without shipping; a release becomes a deliberate
  act. This trades away ADR 0004's "main is always live" property in exchange
  for release control — the owner's stated goal.
- Between a merge and the next release tag, `main` has no automated build. PRs
  remain the build gate; a `main` broken by an interaction between two merged
  PRs surfaces at release time, not before. Acceptable for a one-page site with
  a single maintainer.
- **Owner precondition:** if the `production` GitHub environment restricts
  deployment refs to the `main` branch ("Deployment branches and tags"), a tag
  deployment is blocked. The `v*` tag pattern (or "All refs") must be allowed in
  the environment settings, or the tag-triggered deploy will never run. This is
  a manual owner action, like the deploy secrets/vars in ADR 0004.
- Supersedes the trigger decision of ADR 0004 (`push: branches: [main]`). The
  rest of ADR 0004 — GitHub-hosted runners, concurrency group, the `production`
  environment — and all of ADR 0005 (standalone Docker deploy mechanism) stand
  unchanged.
