# Changelog: Keep a Changelog + semver

`CHANGELOG.md` at the repo root follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioned per [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (see `docs/agents/releases.md` for how the version number is picked).

## Structure

```
# Changelog

## [Unreleased]

### Added
- Run a program with several steps, each setting its own power, fan and water temperature.

## [0.2.0] - 2027-01-15

### Fixed
- Wait for the stove's cool-down before accepting a new ignition.

[Unreleased]: https://github.com/<owner>/fuochista/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/<owner>/fuochista/compare/v0.1.0...v0.2.0
```

Newest first. Once the repo has a GitHub remote, every version section, `[Unreleased]` included, gets a compare-link footer at the bottom of the file, diffed against the tag directly before it.

## Categories

Standard Keep a Changelog headers, in this order when present: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`. Omit a category entirely when nothing in the version needs it.

## Write entries as you go

Every commit or merge that lands on `develop` (a feature/bugfix branch merging in, or a one-off commit going straight to it, see `docs/agents/branching.md`) adds its entry under `## [Unreleased]` in that same commit or merge. The changelog is always current, so a release only renames a section.

- One entry per user-visible change, not per raw commit: a feature/bugfix branch with many ticket commits gets one entry per ticket.
- Write for the changelog's reader, not the git log: describe the effect ("Run a program with several steps"), not the mechanics ("refactor the scheduler"). Rephrase the underlying commit(s) rather than pasting their messages.
- Commits with no user-visible effect (tooling, CI, tests, style, internal refactors, comments) earn no changelog line.
- Pick the category from what the change does to the user; the commit's gitmoji (`docs/agents/commits.md`) is a hint, not the rule: ✨→Added, 🐛/🚑️/🩹→Fixed, 🔒️/🔐→Security, 🗑️→Deprecated, 🔥/➖→Removed, anything else user-visible→Changed.
- 💥 breaking changes go in whichever category the change itself belongs to, with the line opening on **Breaking:**.

## At release time

Per `docs/agents/releases.md` step 3: rename `## [Unreleased]` to `## [<version>] - <YYYY-MM-DD>` and open a fresh, empty `## [Unreleased]` above it. The entries underneath are already written: there's nothing left to draft.

Hotfix branches start from `main`, which carries no pending `[Unreleased]` entries: add the fix's entry there directly, then rename it the same way. Merging the hotfix into `develop` can conflict with `develop`'s own `[Unreleased]` section on `CHANGELOG.md`: resolve by keeping `[Unreleased]` on top and the hotfix's new version section directly below it.
