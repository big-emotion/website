# 0008 — Automate the develop → main promotion

- Status: superseded — rollout abandoned 2026-07-21 (see "Outcome" below)
- Date: 2026-07-21

## Outcome

The workflow specified here was never added, and the owner declined it on the
day the ADR landed. Promotion stays a deliberate manual step:

```
git merge --ff-only origin/develop && git push origin HEAD:main
```

The context and reasoning below are kept because the underlying problem is
real — `develop` did drift 12 commits ahead of `main` before the first manual
promotion on 2026-07-21 — and a future maintainer reconsidering automation
should be able to see what was already weighed. Only the decision to automate
was reversed, not the analysis of why the gap exists.

The rest of ADR 0006 is unaffected: `main` catching up to `develop` still has
no production effect, and only a `v*` tag deploys.

## Context

ADR 0006 moved the deploy trigger to a `v*` tag on `main`, deliberately
decoupling "merged" from "shipped". That decision assumed something would
still move commits from `develop` to `main` in the meantime. Nothing was ever
built to do it: AGENTS.md described the gap plainly — "The promotion is a
deliberate manual step and currently has no owner: work merged to develop
sits there until someone fast-forwards main."

In practice `origin/develop` drifted 6 commits ahead of `origin/main`
(SWBE-21, 22, 23, 24, 80, 82 — all merged, reviewed, CI-green, none deployed)
before anyone noticed. `bigemotion-release` precondition 6 already refuses to
tag while that gap exists, so the release path was blocked by a step nobody
owned, and the gap grows with every Ferry merge to `develop`.

## Decision

- **A GitHub Actions workflow (`.github/workflows/promote-develop.yml`) owns
  the promotion.** It runs after the `CI` workflow completes successfully on
  `develop`, and fast-forwards `main` to `develop`'s tip
  (`git push origin HEAD:main`, only after confirming `main` is an ancestor of
  `develop` — never a force-push, never a merge commit). The exact spec is in
  the "Rollout" appendix below.
- **Fast-forward only.** If `main` is not an ancestor of `develop` (history
  diverged — should not happen under this repo's branching model, but the
  workflow must not paper over it), the job fails loudly instead of forcing
  or merging. That is a signal for a human, not something to auto-resolve.
- **Never deploys.** The workflow pushes a branch, not a tag. Per ADR 0006
  only `push: tags: ["v*"]` triggers `deploy-production.yml`, so `main`
  catching up to `develop` has no production effect until a release is cut
  with `/bigemotion-release`.
- **`bigemotion-release` precondition 6 stays, unweakened.** It still refuses
  to tag while `develop` leads `main`. In steady state it should never fire,
  because promotion now happens automatically on every green `develop`
  build — but it remains the safety net for the gap between a `develop` push
  and the promotion workflow completing, or for a promotion run that failed
  (e.g. branch protection rejected the push). Its fallback is unchanged:
  report the stranded commits, offer `git merge --ff-only origin/develop`,
  never merge unasked.

## Rollout (abandoned)

**This never shipped.** The workflow below was left for a maintainer to add by
hand — Ferry's `claude-code` agents are barred from writing to `.github/`, a
guardrail against automated PRs changing CI/CD trust boundaries — and the
owner decided against adding it. `develop` → `main` promotion remains the
manual `git merge --ff-only origin/develop` that precondition 6 already
offers.

The YAML is kept verbatim as a record of what was specified, not as a task.
Do not add it without reopening the decision.

Was to be added as `.github/workflows/promote-develop.yml`:

```yaml
name: Promote develop to main

# Fast-forwards main to develop's tip once CI is green on develop, so the
# gap AGENTS.md used to describe as "a deliberate manual step... currently
# has no owner" closes automatically. See ADR 0008.
#
# Never deploys: this pushes a branch, not a tag, and only a v* tag on main
# triggers deploy-production.yml (ADR 0006).
on:
  workflow_run:
    workflows: ["CI"]
    branches: [develop]
    types: [completed]
  workflow_dispatch: {}

concurrency:
  group: promote-develop-to-main
  cancel-in-progress: false

jobs:
  promote:
    if: ${{ github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          ref: develop

      - name: Fast-forward main to develop
        run: |
          set -euo pipefail
          git fetch origin main
          if git merge-base --is-ancestor origin/main HEAD; then
            git push origin HEAD:main
          else
            echo "::error::main is not an ancestor of develop — history diverged, refusing to force-push or merge. Needs manual investigation."
            exit 1
          fi
```

## Consequences

- Once rolled out, `main` tracks `develop` continuously after every green CI
  build, closing the gap AGENTS.md flagged as ownerless. A release becomes
  purely "tag `main` HEAD"; it no longer requires a separate promotion step.
- **Bootstrap caveat:** `workflow_run` only fires for a workflow file that
  already exists on the repository's default branch (`main`). Because the
  file must land on `main` before it can trigger itself, the maintainer
  adding it should do so directly on `main` (or dispatch it manually via
  `gh workflow run promote-develop.yml --ref develop` once it also exists on
  `develop`) — plain `git merge --ff-only` for that first promotion works
  just as well. After that one bootstrap, every subsequent green `develop`
  build promotes automatically.
- **Branch protection precondition**, in the same spirit as ADR 0006's
  environment-ref precondition: if `main` has a protection rule requiring
  pull requests (blocking direct pushes, even from Actions), this workflow's
  push fails. The rule must allow the `GITHUB_TOKEN` (or the app pushing on
  its behalf) to fast-forward `main` directly, or promotion stays manual.
  This is a manual owner action, not something this ADR can enforce from
  workflow YAML.
- Clearing the _current_ 6-commit backlog (SWBE-21/22/23/24/80/82) is a
  one-time consequence of adopting this ADR, not a new capability of the
  workflow's steady-state behaviour — it happens via the bootstrap run above,
  and (like the workflow file itself) is a direct-push-to-`main` action this
  PR's author is not permitted to perform.
