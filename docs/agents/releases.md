# Releases: gitflow + semver

Releases ship via gitflow's `release`/`hotfix` branches (see `docs/agents/branching.md` for gitflow basics), versioned per [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Pick the branch

- **Release** (🔖): shipping what's accumulated on `develop`. Branch `release/<version>` from `develop`.
- **Hotfix** (🚑️): a critical fix needed on production now. Branch `hotfix/<version>` from `main`.

The emoji in parentheses is that branch kind's marker: use it for both the version-bump commit and the tag below.

## Pick the version

Semver: `MAJOR.MINOR.PATCH`. Bump by the highest-impact change type among the commits since the last release, reading the gitmoji catalog in `docs/agents/commits.md`:

- 💥 present anywhere in the range → bump MAJOR.
- No 💥, but ✨ present → bump MINOR.
- Neither (🐛 and the rest) → bump PATCH.

Before the first `1.0.0`, the project is under initial development (semver §4): version however fits, since anything may still change.

## On the release/hotfix branch

Always these three steps, in this order, before merging anywhere:

1. Bump the version in the project's manifest, regenerating any lock file with the package manager rather than by hand. Commit with the branch kind's marker and label: `🔖: release v<version>` or `🚑️: hotfix v<version>`. (The stack isn't chosen yet: once it is, name the manifest and the commands here.)
2. Update the project's dependencies; the build and the tests must pass afterwards.
3. Promote `CHANGELOG.md`'s `[Unreleased]` section to this version (see `docs/agents/changelog.md`): its entries are already there from each merge into `develop`/`main`, so this step renames the section rather than drafting it.

## Merge and tag

Merge the branch into both `main` and `develop`, per gitflow. On `main`, tag the merge commit `v<version>`, annotated with the same marker and label as the bump commit: `🔖: release v<version>` or `🚑️: hotfix v<version>`.
