---
name: bigemotion-release
description: Prepare and ship a BIG EMOTION website production release. Bumps the semver version, updates CHANGELOG.md (Keep a Changelog format, creates it if missing), updates package.json version, creates an annotated git tag, then asks for explicit confirmation before pushing. Pushing `main` triggers deploy-production.yml (production deploy on push to main); the tag is a version marker only and does not deploy. After both pushes succeed, creates a GitHub Release with generated notes. Use when the user says "release big emotion", "cut a release", "bump version", "tag a new version", or invokes /bigemotion-release.
metadata:
  author: jnk
  version: "1.0.0"
---

# BIG EMOTION Release

Prepare a release locally (bump version, update CHANGELOG, create the commit and tag), then ask for explicit confirmation before pushing.

This skill writes to the local repo first. It only runs `git push` after the user explicitly confirms. Without confirmation, the commit + tag stay local.

## When to Activate

- User says: "release big emotion", "cut a release", "bump version", "tag a new version", "ship a release".
- User invokes `/bigemotion-release` (optionally with a bump level: `patch | minor | major | <explicit-version>`).

## Preconditions

Verify all of the following before any write. If any fail, **do not modify anything** — report the blocker and exit.

1. **In the big-emotion repo root** — `package.json` has `"name": "big-emotion"`. If not, stop and tell the user to `cd` to the right directory.
2. **Clean working tree** — `git status --porcelain` must be empty. If dirty, stop and ask the user to commit or stash.
3. **On `main` branch** — `git branch --show-current` must return `main`. If not, stop.
4. **Up to date with `origin/main`** — run `git fetch origin` then `git rev-list --count main..origin/main`. If > 0, stop and tell the user to `git pull`.
5. **CI green on HEAD** — run:
   ```bash
   HEAD_SHA=$(git rev-parse HEAD)
   gh run list --repo big-emotion/website \
     --commit "$HEAD_SHA" --workflow ci.yml \
     --limit 1 --json conclusion,status,url
   ```
   The latest run must have `conclusion: "success"`. If no run exists for HEAD, or the conclusion is not `success`, stop and provide the run URL so the user can investigate.

This repo is trunk-based (`main` only, no `develop`) — there is no ancestor-promotion check to run.

## Inputs

Argument is the bump level or explicit version:

- `patch` — `0.1.0 → 0.1.1`
- `minor` — `0.1.0 → 0.2.0`
- `major` — `0.1.0 → 1.0.0`
- `<explicit>` — e.g. `0.1.0-rc.1`, `1.0.0`

If no argument is provided, propose a bump based on commit messages since the last tag using the Conventional Commits heuristic:
- `feat!:` or body contains `BREAKING CHANGE` → major
- `feat:` → minor
- anything else (fix, refactor, perf, style, docs, ci, chore) → patch

Show the proposal and **ask the user to confirm or override** before proceeding.

## Workflow

### Step 1 — Determine current and target versions

- Read current version from `package.json` (`.version`).
- Determine `previous_tag` = `git describe --tags --abbrev=0 2>/dev/null` (empty if no tag yet).
- Compute `next_version` from the bump level.
- Validate: `next_version` must be strictly greater than `current_version` (semver comparison). If not, stop and ask the user for an explicit higher version.

### Step 2 — Collect changes since last tag

Run:
```bash
git log --pretty=format:"%h %s" <previous_tag>..HEAD
# If no previous tag:
git log --pretty=format:"%h %s"
```

Group commits by Conventional Commit type:

| CHANGELOG section | Commit type prefixes |
| --- | --- |
| **Added** | `feat:`, `feat(...):`  |
| **Changed** | `refactor:`, `perf:`, `style:` |
| **Fixed** | `fix:`, `fix(...):` |
| **Security** | `security:` |
| **Removed** | `revert:` or commits describing removal |

Filter out merge commits and `chore:`, `ci:`, `docs:`, `test:` entries (too noisy for a user-facing changelog) unless they carry noteworthy messages.

### Step 3 — Update or create `CHANGELOG.md`

Use [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

**If `CHANGELOG.md` does not exist**, create it with this skeleton (start at `next_version` — do not backfill history for releases that predate this skill):

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [<next_version>] - <YYYY-MM-DD>

### Added
- ...

[Unreleased]: https://github.com/big-emotion/website/compare/v<next_version>...HEAD
[<next_version>]: https://github.com/big-emotion/website/releases/tag/v<next_version>
```

**If `CHANGELOG.md` exists**:

- Move any items under `[Unreleased]` into the new `[<next_version>] - <YYYY-MM-DD>` section.
- Append the grouped commits from Step 2 under the appropriate subsections (deduplicate; skip sections with no entries).
- Keep an empty `[Unreleased]` section at the top for the next cycle.
- Update the link references at the bottom:
  - `[Unreleased]` → `compare/v<next_version>...HEAD`
  - Add `[<next_version>]` → `releases/tag/v<next_version>`

Use today's date (`date -u +%Y-%m-%d`) for the release date.

### Step 4 — Update `package.json`

Set `.version` to `<next_version>` using the Edit tool (targeted field update — do not reformat the file).

### Step 5 — Commit and tag (local only)

Stage exactly the two files changed:

```bash
git add CHANGELOG.md package.json
```

(Do not `git add -A` — do not pick up unrelated dirty paths.)

Commit with the message:

```
release: v<next_version>
```

One-line subject only. No body unless there are breaking changes — then add a `BREAKING CHANGE:` paragraph in the body.

**No `Co-Authored-By` trailer.**

Then create an annotated tag:

```bash
git tag -a v<next_version> -m "BIG EMOTION website v<next_version>"
```

### Step 6 — Report and ask for push confirmation

Print a summary:

```
BIG EMOTION website v<next_version> prepared locally.

Files changed:
  - package.json        (version: <current_version> → <next_version>)
  - CHANGELOG.md         (new section [<next_version>] - <today>)

Commit:  <short-sha>  release: v<next_version>
Tag:     v<next_version> (annotated, local only)

Ready to push `main` + `v<next_version>` to origin?
Pushing `main` triggers deploy-production.yml → production deploy.
The tag is a version marker only — it does not trigger a deploy.

Reply `yes` / `push` / `go` / `oui` / `ok` to proceed.
Anything else → keeps commit + tag local only.
```

**Wait for explicit confirmation.** Do not push without it.

- Affirmative tokens (case-insensitive): `yes`, `y`, `push`, `ship`, `go`, `oui`, `ok`.
- Anything else (including silence, "let me check first", partial answers) → treat as stop. Skip Step 7.

### Step 7 — Push and publish the release (only after confirmation)

Push `main` and the tag in order, as **separate** commands:

```bash
git push origin main
git push origin v<next_version>
```

**Not** `--follow-tags`. Separate commands so a tag-push failure doesn't leave `main` pushed ambiguously. If `git push origin main` fails (e.g. non-fast-forward, branch protection), stop immediately — do not push the tag.

After both pushes succeed, create the GitHub Release yourself (this repo has no tag-triggered workflow to do it for you):

```bash
gh release create v<next_version> --repo big-emotion/website --generate-notes
```

Then print:

```
Pushed.
  - origin/main now at <short-sha> — this triggered the production deploy (deploy-production.yml).
  - tag v<next_version> published (version marker only, no deploy).

GitHub Release v<next_version> created with auto-generated notes.

Watch the deploy at:
  https://github.com/big-emotion/website/actions/workflows/deploy-production.yml
```

### Step 8 — Verification checklist

- [ ] Version in `package.json` matches the new tag.
- [ ] `CHANGELOG.md` has a `[<next_version>]` section dated today.
- [ ] Exactly one commit was created. Exactly one annotated tag was created.
- [ ] If user confirmed: both `main` and `v<next_version>` are pushed to origin, and a GitHub Release exists for `v<next_version>`.
- [ ] If user did not confirm: commit + tag remain local only, no `git push` was executed.

## Failure Modes — Stop Without Modifying

| Condition | Action |
| --- | --- |
| Not in the big-emotion repo root | Stop. Tell user to `cd` to the right directory. |
| Working tree dirty | Stop. Ask user to commit or stash. |
| Not on `main` branch | Stop. Report current branch. |
| Behind `origin/main` | Stop. Tell user to `git pull`. |
| CI not green on HEAD | Stop. Print the run URL for investigation. |
| Target version ≤ current version | Stop. Ask for an explicit higher version. |
| `git push origin main` fails | Stop. Do not push the tag. |
| `gh release create` fails after both pushes | Report the pushes succeeded but the Release needs manual creation; do not retry destructively. |

## Out of Scope

- npm publish (package is `private: true`).
- Staging releases (no staging environment/branch defined for this repo).
- Backfilling `CHANGELOG.md` for releases that predate this skill (history starts at the next tagged version).
- The deploy workflow itself (`deploy-production.yml`) — that is a separate concern; this skill only pushes the commit that triggers it.
- Prismic prod schema sync — revisit once a Prismic repo exists (design-revamp epic); this repo has no Prismic integration yet.
- A user-level copy of this skill in `~/.claude/skills/` (epic decision: skills live per-repo).
- Audit/scoring of release readiness (preconditions in the Preconditions section are sufficient).
- Pushing without explicit user confirmation in Step 6.
