#!/usr/bin/env bash
# BIG EMOTION — break-glass Docker deploy, run on the VPS.
#
# Primary path: .github/workflows/deploy-production.yml (CI builds the image,
# ships it as a tarball, and restarts the container).  Run this script by hand
# only during a GitHub/Actions outage.
#
# Prerequisites on the VPS: Docker, Docker Compose plugin, the repo cloned at
# /home/ubuntu/big-emotion/website, and deploy/docker-compose.yml available.
set -euo pipefail

cd /home/ubuntu/big-emotion/website

echo "==> Pulling main"
git fetch origin main
git reset --hard origin/main

echo "==> Building Docker image (standalone Next.js)"
docker build -t big-emotion:live .

echo "==> Restarting container"
docker compose -f deploy/docker-compose.yml up -d --no-deps --pull never big-emotion

echo "==> Done — $(git log -1 --format='%h %s')"
