# 0004 — Deploy via GitHub Actions on push to main

- Status: accepted (trigger superseded)
- Date: 2026-07-16

> **Superseded in part.** The `push: branches: [main]` trigger below is replaced
> by tag-driven deploy in **ADR 0006** (2026-07-19) — production now ships on a
> `v*` tag, not on a merge to `main`. The rsync-over-SSH deploy step was earlier
> replaced by the Docker deploy in **ADR 0005**. The remaining decisions here
> (GitHub-hosted runners, concurrency group, `production` environment) stand.

## Context

Production deploy was manual: SSH to the OVH VPS and run `deploy/deploy.sh`
by hand (git pull + `pnpm build` on the VPS + rsync `out/` into the
container's bind-mounted `live/` web root). This builds on pnpm 11 on the VPS
while local development is pinned to pnpm 9 (an untracked
`pnpm-workspace.yaml` hack papers over the drift), and the build competes for
CPU with the 8 chancellerie self-hosted runners co-located on the same VPS.
A failed build on the VPS also risks a half-published `live/`.

Phase 1 (SWBE-2) already gates every pull request to `main` with
`.github/workflows/ci.yml` (lint, test, build on GitHub-hosted runners). This
decision extends that pipeline to also deploy on merge.

## Decision

- **Trigger: `push: branches: [main]`**, not tag-driven. The chancellerie's
  `v*`-tag production flow presupposes a develop→main release train; this
  repo is trunk-based, and a tag ceremony adds no value for a one-page
  marketing site. `workflow_dispatch` with an optional `ref` input (default
  `main`) is the redeploy/rollback affordance — rerun with a known-good SHA.
- **GitHub-hosted `ubuntu-latest` runners**, not the chancellerie's
  self-hosted runners on the same VPS: cross-org reuse would grant that CI
  surface access to big-emotion's deploy credentials. The build fits
  comfortably in free-tier minutes.
- **Push-based rsync-over-SSH from CI**, not pull-based (SSH in and run
  `deploy.sh`): CI pins Node 22 / pnpm via the `packageManager` field, so
  builds are reproducible independent of what's installed on the VPS.
  `rsync --delete --delay-updates --exclude='/preview'` after a green build
  preserves `deploy.sh`'s near-atomic publish; the Apache container needs no
  restart (read-only bind mount) — shipping files IS the deploy.
- **Concurrency group `deploy-production`, `cancel-in-progress: false`**:
  deploys queue instead of racing or cancelling an in-flight publish.
- **Single build+deploy job**, `environment: production` — no artifact
  hand-off between jobs for a build this size; the environment gates the
  deploy secret/vars and surfaces the live URL in the GitHub UI.
- **`deploy/deploy.sh` is demoted to break-glass**: still versioned in
  `deploy/`, still the fallback for a GitHub/Actions outage, no longer the
  primary route.

## Consequences

- Deploy = merge to `main`. Rollback = `workflow_dispatch` with
  `ref=<last-good-sha>`.
- The VPS no longer builds; the pnpm 9/11 drift and the CPU contention with
  chancellerie runners are gone for the deploy path (`deploy.sh` still builds
  on the VPS when used as break-glass).
- A dedicated deploy keypair and the `production` environment's secret/vars
  (`DEPLOY_SSH_KEY`, `DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_USER`,
  `DEPLOY_KNOWN_HOSTS`) are manual owner preconditions (epic SWBE-1) — the
  workflow fails loudly at the SSH step until they exist.
- Supersedes the "deploy = SSH to the VPS and run `deploy.sh`" part of ADR
  0003; the hosting stack decisions in ADR 0003 (Apache+PHP container behind
  Traefik, direct-send mail) stand unchanged.
