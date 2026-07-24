---
name: bigemotion-audit
description: Codex bridge for the BIG EMOTION production-readiness audit. Use when the user asks whether the site is ready, requests an RGPD or security audit, asks for a production-readiness score, or invokes bigemotion-audit.
---

# BIG EMOTION Audit — Codex Bridge

The canonical workflow is
`../../../.claude/skills/bigemotion-audit/SKILL.md`.

Before taking any audit action, read that file completely and follow it as the
authoritative project workflow, subject only to the Codex adaptations below.
Do not edit the canonical skill while invoking this bridge.

## Codex adaptations

- Treat `AGENTS.md` as the active project-instruction file.
- Run independent shell checks concurrently when useful. A reference to Bash
  means the available shell executor with the repository root as its working
  directory.
- When checking whether a neighbouring project skill exists, inspect both
  `.agents/skills/` and `.claude/skills/`. The `.agents/skills/` entry is the
  Codex-active bridge; the `.claude/skills/` entry is the canonical workflow.
- Use `apply_patch` for the audit report update. Preserve the source skill's
  read-only contract for application code and external systems.
