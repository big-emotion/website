---
name: bigemotion-spec
description: Codex bridge for maintaining the BIG EMOTION Confluence specification and creating matching SWBE Jira drafts. Use for feature intent, bugs that require specification changes, requirements, decisions, or architecture work.
---

# BIG EMOTION Spec — Codex Bridge

The canonical workflow is
`../../../.claude/skills/bigemotion-spec/SKILL.md`.

Before taking any specification action, read that file completely and follow it
as the authoritative project workflow, subject only to the Codex adaptations
below. Do not edit the canonical skill while invoking this bridge.

## Codex adaptations

- Treat `AGENTS.md` as the active project-instruction file.
- Use the installed Atlassian Rovo connector for Atlassian resource and user
  discovery, Jira and Confluence reads, CQL/JQL searches, Confluence updates,
  and Jira creation. Resolve operations by capability instead of calling
  literal legacy MCP identifiers.
- Cross-check the Rovo cloud ID and Jira project against
  `docs/confluence-spec/config.json` before any remote write.
- Preserve the canonical allowlist and denylist semantically: using Rovo does
  not broaden which Jira or Confluence operations the skill may perform.
- Keep the canonical user approval gate, Confluence-first ordering, append-only
  contract, and partial-failure handling unchanged.
- Use `apply_patch` for local catalog edits while preserving JSON indentation,
  field order, and unrelated content.
