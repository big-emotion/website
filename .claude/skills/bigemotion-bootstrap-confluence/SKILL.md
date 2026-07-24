---
name: bigemotion-bootstrap-confluence
description: One-shot, create-only bootstrap of the BIG EMOTION Confluence Engineering tree. Creates Requirements, Decisions, Architecture, and Obsolete skeleton pages, records their IDs, writes the bootstrap sentinel, then refuses all later runs.
metadata:
  author: jnk
  version: "1.0.0"
---

# BIG EMOTION Bootstrap Confluence

Create the canonical Confluence spec tree once. This command is only for a repository that has never been bootstrapped. Ongoing specification work belongs to `/bigemotion-spec`.

## Preconditions

Stop without modifying anything unless every condition passes:

1. `package.json` has `"name": "big-emotion"`.
2. `git status --porcelain` is empty.
3. `docs/.confluence-bootstrap-complete` does not exist. If it exists, print its timestamp and page IDs, then refuse the run.
4. `docs/confluence-spec/config.json` is parseable and contains non-null `cloudId`, `siteUrl`, `spaceKey`, `engineeringRootPageId`, and `engineeringTreePageId`.
5. The configured Atlassian site and space are reachable, and `engineeringTreePageId` resolves to the intended Engineering parent.
6. The parent has no direct child titled `Requirements`, `Decisions`, `Architecture`, or `Obsolete`.

Never hardcode Atlassian IDs in this skill. Read them from the config at runtime.

After the checks pass, print:

```
This is the one-shot bootstrap. After publish, spec intent lives on Confluence and flows from Confluence to code only. Ongoing changes go through /bigemotion-spec.
```

## Allowed and forbidden operations

Allowed:

- Read Atlassian resources, spaces, the Engineering parent, and its descendants.
- Create exactly four child pages under `engineeringTreePageId`.
- Update only the five page-ID fields described below.
- Write the local sentinel and empty requirement catalog.

Forbidden:

- Any Jira read or write.
- Updating or deleting any existing Confluence page.
- Creating a page outside `engineeringTreePageId`.
- Importing project history or publishing REQ/DEC/ARCH sections during bootstrap.
- Retrying a partial publish blindly.

## Phase 1 — Compose skeletons

Prepare these four pages in memory:

- `Requirements` — "This page holds the canonical REQ-NNN requirements of the BIG EMOTION website. Sections are appended by /bigemotion-spec at status Pending; humans manage lifecycle transitions."
- `Decisions` — "This page holds the canonical DEC-NNN decisions of the BIG EMOTION website. Sections are appended by /bigemotion-spec at status Pending; humans manage lifecycle transitions."
- `Architecture` — "This page holds the canonical ARCH-NNN architecture contracts of the BIG EMOTION website. Sections are appended by /bigemotion-spec at status Pending; humans manage lifecycle transitions."
- `Obsolete` — "This page lists retired intent for historical context. Current behavior remains in Requirements, Decisions, and Architecture."

Do not add Status macros or inventory content.

## Phase 2 — Approval gate

Print the parent title/ID and the complete four-page preview. Then require this exact reply on a line by itself:

```
bootstrap publish approved
```

Any other reply, including a synonym or silence, aborts with no write.

## Phase 3 — Publish sequentially

Create `Requirements`, `Decisions`, `Architecture`, then `Obsolete` as direct children of `engineeringTreePageId`. Capture every returned page ID.

If any create fails, stop immediately. Report the pages and IDs already created, do not update local files, and do not delete or retry anything.

## Phase 4 — Persist IDs and lock out later runs

Using the existing JSON indentation and field order, update only:

- `engineeringRootPageId` and `engineeringTreePageId` to the verified Engineering parent ID.
- `requirementsPageId`, `decisionsPageId`, `architecturePageId`, and `obsoletePageId` to the created IDs.

Write `docs/confluence-spec/req-catalog.json`:

```json
{
  "pageId": "<requirementsPageId>",
  "requirements": []
}
```

Write `docs/.confluence-bootstrap-complete` with an ISO-8601 UTC timestamp plus the Engineering parent and four child IDs. Run `pnpm lint:req` to verify the local contract.

Create a dedicated branch from `develop`, commit only the config, catalog, and sentinel with:

```
chore(confluence): bootstrap BIG EMOTION spec tree
```

Do not push. Report the branch and five Confluence URLs for inspection.

## Failure modes

| Condition | Action |
| --- | --- |
| Sentinel already exists | Refuse; print its timestamp and page IDs. |
| Dirty worktree | Stop; ask the user to commit or stash. |
| Missing config or parent ID | Stop; report the missing fields. |
| Atlassian site, space, or parent unavailable | Stop; surface the error. |
| Canonical child already exists | Stop; require manual reconciliation. |
| Approval phrase does not match exactly | Abort without writing. |
| Partial Confluence creation | Stop and report captured IDs; no cleanup or local write. |
| A requested action would update/delete Confluence or touch Jira | Refuse; it violates the create-only bootstrap contract. |
