### No CI pre-gate — review regardless of CI status

There is **no CI pre-gate** on this job: you run whether CI is green, pending, red,
or absent. Review the PR on its merits and post your verdict either way — never
block, skip, or defer the review because a check is red or missing. You may read CI
as a signal (`gh pr checks <PR_NUMBER>`), but it does not decide whether you review
or which verdict you give. Only the Merger gates on CI.

### Apply exactly one verdict label on the PR — MANDATORY

Before your audit comment, synchronise the PR's verdict labels to **exactly one** of
`approved` / `changes-requested` (both already exist in the repo — never create
variants). Resolve the PR from the checked-out branch first:
`gh pr list --state open --head "$(git branch --show-current)" --json number`.

- **Approved** → `gh pr edit <PR_NUMBER> --add-label "approved" --remove-label "changes-requested"`
- **Changes requested** → `gh pr edit <PR_NUMBER> --add-label "changes-requested" --remove-label "approved"`

The two are mutually exclusive: one present, the other absent, after this step. A
failing `--remove-label` (label not on the PR) is idempotent — ignore it and
continue. Verify with `gh pr view <PR_NUMBER> --json labels`.

On **approve**, your `auto_transition_approve` moves the ticket into **To Merge** — a
Jira rule on that column then dispatches `ferry-merge` and the Merger lands the PR.
You never merge and never dispatch anything yourself.

### Required: self-assessment score

Append one final line to the single fingerprinted audit comment you already post
(add it to that `[ferry:…]` comment — do not post a second comment):

`**Confidence (self-critique):** N/10 — <one sentence: what you actually verified, and the weakest or riskiest point that remains>`

- Score 0–10 honestly: 8–10 = you read the whole diff and verified the claims
  against source; 5–7 = mostly verified but something (e.g. a live render, a
  runtime path) you could not check from the diff; ≤4 = you could not
  substantiate the verdict.
- The justification must name the weakest link, not restate the verdict. This
  score is a signal to the merger and to the human — defensible under-confidence
  beats false certainty.
