# Fuochista

Unofficial app to control and automate the home's pellet boiler stove (Klover, on the Micronova Agua IOT cloud platform), going beyond what the official "Klover Home" app offers.

## Read before working

- [docs/context.md](docs/context.md): the house, the stove, the platform, what already exists and the open decisions.
- [docs/ideas.md](docs/ideas.md): the feature brainstorm the first release will be picked from.
- [docs/roadmap.md](docs/roadmap.md): the milestones, their scope and the per-milestone process.
- [GLOSSARY.md](GLOSSARY.md): the project's domain terms.

## Rules

- User instructions and preferences for this project go in this file or in the docs under `docs/`, not in the agent's memory.
- The Klover account credentials never appear in code, docs or commits: they're read from environment variables or from a `.env` file excluded from git.
- Stove safety: every automation respects the ignition and shutdown cycles (minimum times between commands, no ignitions and shutdowns close together). A wrong command here has physical effects, not just software ones.
- Call the Micronova cloud only as often as needed, so the account doesn't get blocked.

## Conventions

### Language

Everything written down is in English: code (identifiers, comments, non-user-facing strings), commit messages, issues, and every doc in the repo. Italian is for conversation with the user only.

### Branching (gitflow)

Complex, multi-ticket work branches from `develop` (`feature/<slug>` / `bugfix/<slug>`) and merges back via gitflow; one-off work commits straight to `develop`. See `docs/agents/branching.md`.

### Commits (gitmoji)

Every commit leads with a gitmoji for its type (`<emoji>[(scope)]: <description>`), Conventional Commits structure otherwise. See `docs/agents/commits.md`.

### Releases (gitflow + semver)

Ship from a `release/<version>` (off `develop`) or `hotfix/<version>` (off `main`) branch, version bumped by semver, then merge into both `main` and `develop` and tag. See `docs/agents/releases.md`.

### Changelog (Keep a Changelog)

Every merge or commit onto `develop` adds its entry under `CHANGELOG.md`'s `[Unreleased]` section as it happens; a release renames that section to the version. See `docs/agents/changelog.md`.

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `fakkio/fuochista`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label named after its role (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root, created lazily. See `docs/agents/domain.md`.
