---
type: Story
project: SWBE
parent_epic: ""
assignee: ""
---

# Title

<!-- Concise, business-readable. One short sentence that names the outcome, not the
     implementation. Example: "Production deploy on merge to main". Avoid jargon and
     ticket IDs here. -->

## Goal (what + why)

<!-- One or two paragraphs: what this ticket delivers and why it matters — tie it to a
     concrete driver (a bug, a manual step being automated, a spec gap, an owner ask). -->

## User story

<!-- if: type == "Story" -->
<!-- Optional. Include only when a role/capability/outcome framing adds clarity beyond
     the Goal paragraph above.

As a <role>
I want <capability>
so that <business outcome>.
-->
<!-- /if -->

## Locked decisions

<!-- Optional. Bullet list of decisions already made and not open for the implementer to
     re-litigate: trigger conditions, tool/library choices, naming, config values, IDs.
     Each bullet should be specific enough that a fresh agent doesn't have to guess. -->

## Manual preconditions (owner, outside code)

<!-- Optional — Epic-level tickets only. Numbered list of actions only the owner can take
     (generating secrets, choosing infrastructure, enabling settings) before implementation
     can start or land. -->

## Scope

<!-- Bullet list of what IS included in this ticket. -->

## Out of scope

<!-- Bullet list of what is explicitly NOT included (deferred, separate ticket, owner
     action, or already covered elsewhere). -->

## Reproduction steps

<!-- if: type == "Bug" -->

1. <step one>
2. <step two>
3. <step three>

<!-- /if -->

## Expected vs Actual behavior

<!-- if: type == "Bug" -->

### Expected

<expected behavior>

### Actual

<actual behavior>
<!-- /if -->

## Acceptance criteria (Given/When/Then)

<!-- Required. One bullet per criterion, in the exact house form used across SWBE-1..4:
     "Given <context>, when <action>, then <observable outcome>." -->

- Given <context>, when <action>, then <observable outcome>.

## Confluence impact (load-bearing)

<!-- MANDATORY whenever this ticket originates from a `/bigemotion-spec` run. List every
     REQ / DEC / ARCH touched by this ticket with one of three allowed verbs: NEW, EDIT,
     RETIRE. No other verbs (REMOVE, UPDATE, ADD, …) are allowed.

     Omit this section entirely for tickets with no Confluence-tracked spec change (e.g. a
     pure CI/tooling task like SWBE-2). The bullet character is `•`. -->

• REQ-042 — EDIT statement
Current: "<verbatim current statement>"
Proposed: "<new statement>"
GWT changes: <which GWT blocks change, and how>

• DEC-018 — NEW
Context: <why this decision is being recorded now>
Decision: <the decision itself, one sentence>
Alternatives: <options considered, briefly>
Tradeoffs: <what we accept by choosing this option>
Requirements satisfied: <REQ-xxx, REQ-yyy>

• ARCH-007 — EDIT body
Summary change: <one-line diff of the architecture contract>
Source files (expected): <paths that should anchor this contract>
Tests anchoring this contract: <test files / spec ids>

## Affected files/areas

<!-- File paths / directories this ticket is expected to touch. -->

## Links

<!-- Epic (if any), Depends on / Blocked by, related tickets, source references, ADRs. -->

## Assumptions / open questions

<!-- Optional. Anything assumed while writing the ticket, or questions that need a
     product/design/lead decision before implementation can start. -->
