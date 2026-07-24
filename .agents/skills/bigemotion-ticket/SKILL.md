---
name: bigemotion-ticket
description: Codex bridge for the end-to-end BIG EMOTION Jira ticket workflow. Resolves and refines one SWBE ticket, creates sub-tasks, implements with TDD in an isolated worktree, verifies the full gate, opens a PR, and transitions Jira to review.
---

# BIG EMOTION Ticket — Codex Bridge

The canonical workflow is
`../../../.claude/skills/bigemotion-ticket/SKILL.md`.

Before taking any ticket action, read that file completely and follow it as the
authoritative project workflow, subject only to the Codex adaptations below.
Do not edit the canonical skill while invoking this bridge.

## Codex adaptations

- Treat `AGENTS.md` as the active project-instruction file wherever the
  canonical workflow refers to the user's `CLAUDE.md`.
- Use the installed Atlassian Rovo connector for Atlassian resource and user
  discovery, Jira reads and edits, comments, issue creation, transition
  discovery, and workflow transitions. Resolve operations by capability instead
  of calling literal legacy MCP identifiers.
- Cross-check the Rovo cloud ID and `SWBE` project against
  `docs/confluence-spec/config.json` before any remote write.
- A reference to Bash means the available shell executor with the explicitly
  required repository or worktree path as its working directory.
- A reference to the Agent tool means Codex collaboration agents. Use
  `spawn_agent` with the `worker` role for independent implementation slices,
  never exceed the available concurrency slots, and assign clear file or module
  ownership. Tell every worker that other agents share the codebase and that it
  must preserve and accommodate others' edits.
- The canonical workflow explicitly requests parallel agents, so that request
  authorizes their use only within an invoked ticket run. It does not authorize
  delegation for unrelated work.
- Use `apply_patch` for local source edits. Keep the TDD, KISS, mobile-first,
  worktree-isolation, verification, Jira, and no-confirmation operating rules
  otherwise unchanged.
