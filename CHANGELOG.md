# Changelog

All notable changes to Fuochista are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Fuochista service with an installable PWA: household members created from the command line log in and stay logged in; Docker and Dokku deploy (#3).
- Stove status screen: state, power, fan, water temperature setpoint and actual, time of the last read; read on opening, on "refresh", and every 5 minutes with the Stove off or 2 with it on, through a TypeScript Agua IOT client with a cached register map (#4).
- Program editor: create, edit and delete each Stove's weekly Programs of day groups and Steps, validated against Fuochista's ranges and the 30-minute gap between ignition and shutdown (across midnight, day groups and the end of the week); choose a Stove's Active Program, pause and resume it. Programs don't run yet (#8).

## [0.1.1] - 2026-11-26

### Added

- README with disclaimer and prerequisites, and the MIT license.

## [0.1.0] - 2026-11-26

### Added

- M0 feasibility spike on the Micronova cloud: read-only and controlled-write scripts, findings in `docs/platform.md` (#1).

[Unreleased]: https://github.com/fakkio/fuochista/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/fakkio/fuochista/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/fakkio/fuochista/releases/tag/v0.1.0
