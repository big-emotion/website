---
name: bigemotion-ticket
description: End-to-end local automation for a single Jira ticket on the BIG EMOTION website repo. Paste an SWBE ticket URL (or key) and the skill self-assigns the ticket, reads it, refines it (applying the Prismic/Frame coupling rules when they're wired up), creates the Jira sub-tasks, branches off main in an isolated git worktree, implements the work in parallel via sub-agents, opens the pull request, then transitions the ticket to review and comments the PR link. Runs fully automatically with no confirmation gates. Use when the user pastes an SWBE Jira ticket link, says "prends ce ticket", "implémente ce ticket Jira", "traite ce ticket", or invokes /bigemotion-ticket.
metadata:
  author: jnk
  version: "1.0.0"
---

# BIG EMOTION Ticket

Take a single Jira ticket from link to merged-ready PR, locally and unattended.

This repo is trunk-based with no release train: there is no Ferry-style async/cloud counterpart to this skill and no `ferry.config.json` indirection to read branch or column names from. **Base branch and target branch are always `main`** — stated directly here rather than sourced from a config file, so there is nothing to drift against.

## Operating mode — FULL AUTO

The user chose **no confirmation gates**. The skill runs the entire chain — assign → read → refine → sub-tasks → worktree → implement → PR → Jira transition + comment — without stopping to ask.

"Full auto" removes *confirmation* prompts. It does **not** remove *safety blockers*: a small set of hard preconditions where proceeding would corrupt shared state or produce a broken PR. On a safety blocker the skill **stops and reports** — it does not guess or force through. These are listed under Preconditions and are non-negotiable.

## When to Activate

- User pastes a Jira ticket URL (e.g. `https://big-emotion.atlassian.net/browse/SWBE-123`) or a bare issue key.
- User says: "prends ce ticket", "implémente / traite ce ticket Jira", "fais ce ticket".
- User invokes `/bigemotion-ticket <jira-url-or-key>`.

## Inputs

A single argument: the Jira ticket URL or issue key.

- Accept `.../browse/SWBE-123`, `...selectedIssue=SWBE-123`, `...?...&issueKey=SWBE-123`, or a bare `SWBE-123`.
- Extract the issue key with the regex `[A-Z][A-Z0-9]+-\d+`. If zero or more than one distinct key is found, **stop** and ask the user for the exact key (ambiguous input is a safety blocker, not a design choice).

## Preconditions (safety blockers — stop and report if any fail)

1. **Repo root** — `package.json` `.name` is `big-emotion`. If not, stop and tell the user to `cd` in.
2. **Atlassian MCP reachable** — `mcp__atlassian__getAccessibleAtlassianResources` returns the `big-emotion.atlassian.net` site. Resolve and keep `cloudId` for every subsequent Jira call. If it fails, stop — the Jira half of the workflow is impossible.
3. **gh authenticated** — `gh auth status` succeeds for `big-emotion/website`.
4. **Base branch fetchable** — `git fetch origin` succeeds and `origin/main` exists. Implementation runs in a dedicated worktree (Step 5), so the user's main checkout is never touched and need not be clean — but the worktree must be cut from a real remote base branch.

Fixed values (no config file — this is trunk-based, single-branch):

- `base_branch` = `main` (branch to cut from)
- `target_branch` = `main` (PR base)

## Workflow

### Step 1 — Resolve ticket and Jira identity

- `cloudId` from `getAccessibleAtlassianResources` (site `big-emotion.atlassian.net`).
- `getJiraIssue(cloudId, issueIdOrKey=SWBE-123)` — fetch summary, description, issue type, status, acceptance criteria, attachments, existing sub-tasks, comments.
- `atlassianUserInfo` → own `accountId` (the assignee).

### Step 2 — Self-assign

- `editJiraIssue(cloudId, SWBE-123, fields={ assignee: { accountId: <own> } })`.
- If the ticket is already assigned to someone else, still assign to self (the user explicitly wants to take the ticket) but note the previous assignee in the final report.

### Step 3 — Read & refine

- Summarise the ticket's intent, scope, and acceptance criteria.
- **Surface assumptions explicitly** in the refinement (per the core operating behaviors): any ambiguous requirement gets a stated assumption rather than a silent guess.
- **Prismic coupling rule — conditional on repo state.** Check whether `customtypes/` exists at the repo root.
  - If it does **not** exist: the design-revamp epic hasn't landed the Prismic integration yet. Note **"Prismic check N/A — not wired yet"** in the refinement comment and skip the rest of this rule.
  - If it **does** exist, apply the full rule:
    1. Decide whether the ticket touches an **editorial surface** (page, listing, hub, content section, fiche, article — anything editors manage).
    2. If yes, enumerate the required custom types / shared slices. Naming: `lower_snake_case` type IDs (e.g. `news_article`), PascalCase slice names.
    3. Check existence: custom types under `customtypes/<id>/index.json`; shared slices under `src/slices/<Name>/model.json`.
    4. For every **missing** type/slice, the **first** sub-task MUST be: _"Model Prismic custom type `<id>` (or slice `<Name>`)"_, and every UI / data-fetching sub-task **depends on it** and cannot start until it is done.
- **Frame coupling rule — conditional on repo state.** Check whether `design-system/frames/` exists at the repo root.
  - If it does **not** exist: the Storybook/design-system work hasn't landed yet. Note **"Frame check N/A — not wired yet"** in the refinement comment and skip the rest of this rule. The PR body's "Visual parity" section is omitted entirely in this case.
  - If it **does** exist, apply the full rule (adapt the exact spec-refresh mechanism to whatever frame tooling has landed by then):
    1. Detect UI work via signals: (a) Figma URL anywhere in the ticket, (b) visual keywords (header, footer, hero, section, layout, padding, color, breakpoint, responsive, mobile, accessible, page), (c) paths likely touched (`src/components/**`, `src/app/**`, `design-system/**`, `src/app/globals.css`). If no signal fires → non-visual ticket: note "Frame check N/A — non-visual ticket" and skip the rest of this rule.
    2. If the frame rule fires: a Figma URL is mandatory — request it if absent.
    3. Check whether `design-system/frames/<part>/<part>.spec.md` exists and is current. If stale or missing, the **first** sub-task (after any Prismic modeling sub-task) MUST be a frame-spec refresh, and all UI sub-tasks **depend on it**.
    4. **Spec wins over ticket** on any conflict — the frame spec is source of truth, not the ticket description.
    5. Override: for UI changes with no Figma counterpart (ARIA-only fix, animation, micro-interaction), note `Frame check N/A — <reason>` instead.
- Write the refined breakdown back to Jira as a comment on the ticket (`addCommentToJiraIssue`) so the refinement is visible to the team — concise: intent, assumptions, sub-task list with any Prismic/frame dependency ordering called out (or the N/A notes above).

### Step 4 — Create sub-tasks in Jira

- For each refined item, `createJiraIssue(cloudId, fields={ project: { key: "SWBE" }, parent: { key: SWBE-123 }, issuetype: { name: "Sous-tâche" }, summary, description })`.
  - `"Sous-tâche"` (id `10357`) is the confirmed SWBE sub-task issue type. If it's ever missing, resolve the correct name via `getJiraProjectIssueTypesMetadata(cloudId, "SWBE")` instead of guessing.
- **Order matters** when the Prismic or frame rules fired: any Prismic modeling sub-task is created first, any frame-refresh sub-task second, both must complete before any UI sub-tasks start. Each dependency sub-task's description states that all dependent sub-tasks cannot start until it is done.
- Collect the created sub-task keys; they drive the implementation plan and the PR checklist.

### Step 5 — Create an isolated worktree off `main`

All implementation happens in a **dedicated git worktree**, never in the user's main checkout. This keeps the user's working directory and current branch untouched for the entire full-auto run, and is what makes precondition 4 a non-blocker on a dirty main tree.

- `git fetch origin`.
- Branch name: `<prefix>/<key-lower>-<slug>` where:
  - `prefix` = `fix` if issue type is Bug, else `feat`.
  - `key-lower` = the issue key lowercased (e.g. `swbe-123`).
  - `slug` = kebab-cased, ASCII, ≤ 5 words from the summary.
- Worktree path: a sibling of the repo root — `../big-emotion-worktrees/<key-lower>-<slug>` (outside the repo so Next.js / ESLint tooling never scans it; the dir-name segment drops the `<prefix>/` so no nested directory is created).
- Create branch + worktree in one step, cutting from the **remote** base branch (not local, to avoid stale state):
  `git worktree add -b <branch> <worktree-path> origin/main`
- **Every subsequent step — implement, verify, commit, push, open PR — runs with the worktree as the working directory.** Pass it as `cwd` to Bash calls and as the repo path in every sub-agent brief. Never run implementation commands in the main checkout.

### Step 6 — Implement (parallel sub-agents)

Follow TDD and KISS (user `CLAUDE.md`): tests before code, simplest design that satisfies acceptance criteria, surgical scope — touch only what the ticket requires.

Dependency-aware execution:

1. **If a Prismic modeling sub-task exists, it runs FIRST and alone.** No UI/data sub-task starts until it is green.
2. **If a frame-refresh sub-task exists, it runs after the Prismic step and before UI sub-tasks.** No UI sub-task starts until it is done.
3. **Independent sub-tasks run in parallel** via the `Agent` tool (`general-purpose`, or `test-engineer` for test-heavy slices). Always parallelise when sub-tasks have no dependency between them — launch the independent sub-agents in a single message so they run concurrently. Each sub-agent gets a self-contained brief: the worktree path as its working directory, the sub-task summary, acceptance criteria, relevant file paths, the TDD + KISS + mobile-first constraints, the instruction to write tests first, and — if the frame rule fired for this sub-task — the path to the relevant frame spec with the note "spec wins over ticket on conflict". All sub-agents share the one worktree (they implement different sub-tasks of the same branch), so do not give them separate worktree isolation.
4. **Mobile-first** (user `CLAUDE.md`): any UI work is designed and verified at 320–430 px first, then 768–1199 px, then ≥1200 px.
5. **No raw hex/brand literals** — use the `--color-*` tokens in `src/app/globals.css` (project `AGENTS.md`); marketing copy comes from `src/content/site.ts`, never inlined in a component.

### Step 7 — Verify (safety blocker if it fails)

Before any PR, this must pass on the branch (this repo's gate per `AGENTS.md` — there is no typecheck script):

```bash
pnpm lint && pnpm test && pnpm build
```

If Prismic models changed (rule fired in Step 3), also run whatever Prismic check command exists in `package.json` at that time.

If a check fails, iterate on the implementation to fix the **root cause** (do not disable checks, do not `--no-verify`). If it is genuinely unrecoverable, **stop and report** — never open a broken PR. A broken PR on a shared branch is exactly the shared-state corruption full-auto must still refuse.

### Step 7.5 — Visual parity check (when the frame rule fired)

If `design-system/frames/` exists and the frame rule fired for any sub-task during Step 3:

1. Render the live build and compare it against the relevant `design-system/frames/<part>/<part>.spec.md` using whatever frame-verification tooling exists in the repo at that time.
2. If drift is significant (layout regression, missing content, wrong token), iterate on the implementation to fix the root cause before proceeding.
3. Capture the drift report (summary + any screenshot diff). It will be attached to the PR body in Step 9 under `## Visual parity`.

If the frame rule did not fire (non-visual ticket, or `design-system/frames/` doesn't exist yet), skip this step entirely and omit the `## Visual parity` section from the PR body.

### Step 8 — Commit & push

- Commit per sub-task (or logically grouped), Conventional Commits, message references the Jira key (e.g. `feat(hero): add spring animation (SWBE-123)`).
- **Never add `Co-Authored-By` trailers** (user `CLAUDE.md`).
- Commit messages, code comments, PR body — **English** (user `CLAUDE.md`), even where site copy is French.
- `git push -u origin <branch>`.

### Step 9 — Open the pull request

```bash
gh pr create --repo big-emotion/website \
  --base main --head <branch> \
  --title "<type>(<scope>): <summary> (SWBE-123)" \
  --body "$(cat <<'EOF'
## Summary
<1-3 bullets — what and why>

Jira: <full ticket URL>

## Sub-tasks
- [x] <sub-task KEY-1 summary>
- [x] <sub-task KEY-2 summary>
...

## Test plan
- [ ] <how to verify each acceptance criterion>

## Visual parity
<drift report from Step 7.5 — section omitted entirely if the frame rule did not fire>

EOF
)"
```

Capture the PR URL from the command output.

### Step 10 — Transition Jira to review + comment

- `getTransitionsForJiraIssue(cloudId, SWBE-123)` → find the transition whose **target status name** matches the review column. On this instance that is the transition labeled `IN REVIEW`, whose target status is named `Revue en cours` — match on the target status name, not the transition's own name, and don't assume the transition id is stable across issues/statuses.
- `transitionJiraIssue(cloudId, SWBE-123, transition=<id>)`.
- `addCommentToJiraIssue(cloudId, SWBE-123, "PR ready for review: <PR URL>")`.
- If no transition leads to a review column (workflow misconfigured, board changed, or wrong current status), do not invent one — leave the ticket where it is, still post the PR-link comment, and flag the missing transition in the final report.

### Step 11 — Report

End-of-turn summary (one or two sentences): the ticket key, the branch, the worktree path (kept for follow-up — remove with `git worktree remove <path>` once the PR is merged), the PR URL, the Jira status it now sits in, and any flagged anomalies (previous assignee overridden, missing transition, assumptions made during refinement).

## Failure handling

- Safety blockers (Preconditions, Step 7 verification, ambiguous issue key) → **stop and report**, leave shared state untouched.
- Recoverable implementation failures → iterate to root cause within the implementation loop.
- Never disable quality gates, never `--no-verify`, never force-push, never open a knowingly-broken PR.
- If a Jira write fails mid-chain (e.g. sub-task creation), report exactly what was created vs. not so the user can reconcile manually — do not retry blindly in a loop.

## Cleanup

If any temporary files are created (e.g. `.playwright-mcp/` during browser verification), delete them immediately after use (user `CLAUDE.md`).
