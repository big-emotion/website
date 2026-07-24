---
name: bigemotion-bootstrap-confluence
description: Codex bridge for the one-shot BIG EMOTION Confluence engineering-tree bootstrap. Creates the four canonical pages only after the exact approval gate, persists their IDs, writes the sentinel, and refuses later runs.
---

# BIG EMOTION Bootstrap Confluence — Codex Bridge

The canonical workflow is
`../../../.claude/skills/bigemotion-bootstrap-confluence/SKILL.md`.

Before taking any bootstrap action, read that file completely and follow it as
the authoritative project workflow, subject only to the Codex adaptations
below. Do not edit the canonical skill while invoking this bridge.

## Codex adaptations

- Treat `AGENTS.md` as the active project-instruction file.
- Use the installed Atlassian Rovo connector for resource discovery,
  Confluence reads, child-page checks, and page creation. Resolve operations by
  capability instead of calling literal legacy MCP identifiers.
- Cross-check the Rovo cloud ID against
  `docs/confluence-spec/config.json` before any remote write.
- Keep the source skill's exact `bootstrap publish approved` gate and all its
  create-only restrictions unchanged.
- Use `apply_patch` for local JSON, catalog, and sentinel edits, preserving the
  existing JSON indentation, field order, and unrelated content.
