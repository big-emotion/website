#!/usr/bin/env bash
# Ferry PR-label taxonomy — the six state labels the pipeline agents apply.
# Each label is owned by a specific agent and reflects one pipeline state so the
# Reviewer (and a human) can read a PR's status at a glance:
#   ready-for-review  — Developer opened the PR (first review pending)
#   needs-rereview    — Iterator pushed fixes (re-review pending)
#   ci-green          — required checks (CI / build) passed   (Developer / Iterator)
#   ci-failing        — required checks failing / pending      (Developer / Iterator)
#   approved          — Reviewer approved (→ ticket to To Merge → Merger lands it)
#   changes-requested — Reviewer requested changes (→ Changes Requested → Iterator)
#
# Idempotent: `gh label create --force` updates colour/description if the label
# exists. Run against the current repo (or pass -R owner/repo).
set -euo pipefail

repo_arg=("${@}")

label() { gh label create "$1" --color "$2" --description "$3" --force "${repo_arg[@]}"; }

label "ready-for-review"  "1D76DB" "ferry: PR opened by the Developer — first review pending"
label "needs-rereview"    "FBCA04" "ferry: Iterator pushed fixes — awaiting re-review"
label "ci-green"          "0E8A16" "ferry: required checks (CI / build) green"
label "ci-failing"        "B60205" "ferry: required checks failing, pending, or absent"
label "approved"          "0E8A16" "ferry: Reviewer approved"
label "changes-requested" "D93F0B" "ferry: Reviewer requested changes"

echo "Ferry labels ensured."
