### Parent transition target on this board (overrides the base prompt)

The base prompt tells you to move the parent into its "post-refine column
(typically In Refinement → To Do / Ready for Dev)". On this Jira board that
mapping is wrong: the **`À faire` / To Do** column sits **before** Refinement,
so transitioning there (transition **id 11**) moves the ticket _backward_ into
the backlog and no downstream agent ever picks it up.

After creating the sub-tasks, transition the parent **forward into
`IN DEVELOPMENT`** so the developer agent is triggered. Resolve the id with
`get_transitions("TICKET_KEY")` and choose the transition whose target status is
`IN DEVELOPMENT` (currently transition **id 31** on this project). Never use the
`À faire` transition (id 11).

### Required: self-assessment score

Append one final line to the single fingerprinted audit comment you already post
(add it to that `[ferry:…]` comment — do not post a second comment):

`**Confidence (self-critique):** N/10 — <one sentence: what you actually verified, and the weakest or riskiest point that remains>`

- Score 0–10 honestly: 8–10 = verified against the ticket/source with little
  residual doubt; 5–7 = sound but rests on an unverified assumption or an
  out-of-scope dependency; ≤4 = a real blocker or something you could not confirm.
- The justification must name the weakest link, not restate success. This score
  is a signal to the next agent and to the human — defensible under-confidence
  beats false certainty.
