---
name: bigemotion-release
description: Codex bridge for preparing and shipping a BIG EMOTION production release. Bumps the version, updates the changelog, creates the local commit and annotated tag, then requires explicit confirmation before pushing and deploying.
---

# BIG EMOTION Release — Codex Bridge

The canonical workflow is
`../../../.claude/skills/bigemotion-release/SKILL.md`.

Before taking any release action, read that file completely and follow it as
the authoritative project workflow, subject only to the Codex adaptations
below. Do not edit the canonical skill while invoking this bridge.

## Codex adaptations

- Treat `AGENTS.md` as the active project-instruction file.
- A reference to the Edit tool means a targeted `apply_patch` change. Preserve
  the existing `package.json` formatting and do not reformat unrelated fields.
- A reference to Bash means the available shell executor with the repository
  root as its working directory.
- Interpret the source skill's user-level shadowing note as covering both
  `~/.agents/skills/` and `~/.codex/skills/`.
- Keep both confirmation gates unchanged. In particular, never push `main`, a
  release tag, or create a GitHub Release without the explicit confirmation
  required by the canonical workflow.
