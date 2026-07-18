### Close the planning sub-tasks once the story reaches review

The sub-tasks under this story are a planning breakdown — you implement the whole
story in one PR; they are not worked individually. So once you have **successfully**
transitioned the parent into **In Review** (the FR18 step above), the work they
describe is delivered. Close them so they stop cluttering the sprint board:

1. Call `list_subtasks("TICKET_KEY")`.
2. For each sub-task that is not already Done: call `get_transitions(<subtask_key>)`,
   pick the transition whose target status name matches "Done" / "Terminé"
   (case-insensitive), and call `transition_issue(<subtask_key>, <id>)`. **Resolve
   the id per sub-task — never hardcode it**; sub-tasks may use a different workflow
   than the story.

Guard: do this **only after** the parent transition to In Review succeeded. If you
hit a blocker and did NOT move the parent to In Review, leave the sub-tasks
untouched. State in your audit comment how many sub-tasks you closed.

### Surface readiness + CI state on the PR — MANDATORY labels

CI does **not** gate you: open the PR and transition to In Review either way. But the
Reviewer runs regardless of CI, so tell it the truth at a glance via PR labels. After
opening the PR, resolve its number
(`gh pr list --state open --head "$(git branch --show-current)" --json number`), give
CI a moment to start (`sleep 30`), then read the true state
(`gh pr checks <PR_NUMBER>` — the required check is `CI / build`, which runs
`pnpm lint && pnpm test && pnpm build`). Apply, on the PR (labels already exist —
never invent variants):

- Always add readiness: `gh pr edit <PR_NUMBER> --add-label "ready-for-review"`
- **CI green** (required checks passed): `gh pr edit <PR_NUMBER> --add-label "ci-green" --remove-label "ci-failing"`
- **CI red / pending / absent**: `gh pr edit <PR_NUMBER> --add-label "ci-failing" --remove-label "ci-green"`

`ci-green` and `ci-failing` are mutually exclusive — never leave both. A failing
`--remove-label` is idempotent; ignore it. This is best-effort and never blocks the
transition — note in the audit comment if labelling failed.

### Required: self-assessment score

Append one final line to the single fingerprinted audit comment you already post
(add it to that `[ferry:…]` comment — do not post a second comment):

`**Confidence (self-critique):** N/10 — <one sentence: what you actually verified, and the weakest or riskiest point that remains>`

- Score 0–10 honestly: 8–10 = implementation verified against tests/acceptance
  criteria with little residual doubt; 5–7 = works but rests on an unverified
  assumption or a dependency outside this PR; ≤4 = a real blocker (e.g. CI you
  could not read, an editorial/content step the pipeline cannot apply).
- The justification must name the weakest link, not restate success. This score
  is a signal to the reviewer and to the human — defensible under-confidence
  beats false certainty.
