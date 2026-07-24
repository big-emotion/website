# 0010 — Playground dependency envelope: registry-gated, lazy, ≤100 KB gz per effect

- Status: accepted
- Date: 2026-07-23
- Relates to: SWBE-210 (epic), SWBE-211 (story)
- Confluence: ARCH-019 (Architecture), DEC-030 (Decisions), REQ-037 (Requirements)

Numbering note: the ticket asked for this file as `0009-playground-dependency-envelope.md`,
but `0009` was already taken by `0009-blog-motion-boundary.md` (SWBE-191/201, merged
2026-07-22). This ADR takes `0010` instead; a future ADR should still resolve the
pre-existing `0005` duplicate (`0005-nextjs-standalone-docker.md` /
`0005-motion-stack.md`) — this one doesn't add a third collision.

## Context

AGENTS.md's hard constraint is explicit: "GSAP + Lenis are the only animation
libraries — reach for CSS first; don't add a third." The Playground (SWBE-210) exists
specifically to keep experimenting past that envelope — each effect story (3-5) is
free to reach for whatever a given effect actually needs (custom shaders, a physics
step, a different tweening approach) without relitigating the home page's motion
stack every time.

That freedom has to be bounded, or the Playground turns into an ungoverned dependency
sink that also taxes every marketing page's bundle, which is the exact failure mode
the GSAP/Lenis-only rule was written to prevent.

## Decision

The Playground gets its own **governed dependency envelope**, structurally enforced
by this story's shell rather than by convention alone:

- **The effect registry (`src/components/playground/effects.ts`) is the sole entry
  point.** An effect is one `PlaygroundEffect` entry — id, slug, and a `load()` that
  lazily imports its component. Nothing outside the registry may reference an
  effect's implementation module.
- **`EffectStage` (`src/components/playground/effect-stage.tsx`) is the only caller of
  `load()`.** It wraps `React.lazy`/`Suspense`, so an effect's dependencies (whatever
  they are) are fetched only when that effect's own page mounts it — never at
  `/playground` gallery load, and never on any marketing page.
- **Budget: ≤100 KB gzipped per effect chunk**, checked when each effect story ships
  (this shell has nothing to measure yet). **v1 (this story) is 0 KB**: the registry
  is empty, so the gallery and the studio-rig extraction add no new runtime
  dependency at all.
- The **shared studio rig** (`src/components/scene/studio-rig.ts`) — the branded
  chrome wordmark + lighting, moved out of `scene-canvas.tsx` unchanged — is the one
  exception meant to be _reused_, not gated: it's already inside the GSAP/Lenis
  envelope via the home page, and every effect that wants "the" logo reuses this
  module instead of shipping a second copy (the "one logo, one core" rule).

### Alternatives rejected

- **Bundling every effect into one chunk.** Defeats the budget entirely: the chunk
  size becomes the sum of all effects instead of the one a visitor actually opens.
- **Letting each effect page import its dependencies directly**, skipping the
  registry/`EffectStage` indirection. Nothing would then stop an import from leaking
  into a shared chunk that marketing pages also pull in — the registry's value is
  that it's the only place a `load()` reference can exist.

## Consequences

- Adding an effect (stories 3-5) means one registry entry + one lazy component +
  passing the budget check — no changes to the gallery route, nav, or studio rig.
- The GSAP/Lenis-only rule in AGENTS.md still governs the home page and any future
  blog-figure motion (ADR 0009); it does not extend to Playground effects, which is
  the whole point of this envelope.
- A budget violation is a reason to trim the effect or split it, not to raise the
  ceiling by default.
