#!/usr/bin/env bash
# BIG EMOTION — pull + rebuild + publish, run on the VPS.
#
# Break-glass only: .github/workflows/deploy-production.yml is the primary
# deploy path (push to main). Run this by hand only during a GitHub/Actions
# outage.
#
# The container serves ./live via a read-only bind mount, so a deploy is just
# "refresh live/": no container restart needed. We never serve ./website/out
# directly because "next build" empties it mid-build; rsync into live/ only
# runs after a successful build, so a failed build never touches the live site.
set -euo pipefail

cd /home/ubuntu/big-emotion/website

echo "==> Pulling main"
git fetch origin main
git reset --hard origin/main

echo "==> Installing deps (frozen lockfile)"
pnpm install --frozen-lockfile

echo "==> Building static export"
pnpm build   # writes ./out — aborts the script on failure, live site untouched

echo "==> Publishing"
# live/ is the bind-mounted web root. rsync keeps the swap near-atomic and
# removes files deleted upstream. The trailing slashes matter. --exclude
# protects the Phase 3 preview subfolder even before it exists.
rsync -a --delete --exclude='/preview' out/ /home/ubuntu/big-emotion/live/

echo "==> Done — $(git log -1 --format='%h %s')"
