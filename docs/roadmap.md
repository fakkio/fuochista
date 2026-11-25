# Roadmap

The index of Fuochista's milestones. Each milestone is a vertical slice that ends deployed and used at home.

## Process

Each milestone goes through the same cycle:

1. a detailed grilling (`/grill-with-docs`);
2. a spec, published as a GitHub issue (`/to-spec`);
3. tickets (`/to-tickets`);
4. implementation on `feature/<milestone>` (`/implement-spec`);
5. a release.

Every milestone also exists as a GitHub Milestone grouping its spec and tickets. This file stays the reference for each milestone's scope and status.

## Milestones

| # | Milestone | Scope | Status |
|---|---|---|---|
| M0 | Feasibility | Read every parameter, one controlled write with the user at the stove, check that fan = 0 is accepted. Findings in `docs/platform.md`. The stack is confirmed after this. Spec: #1 (spike: no tickets, straight on `develop`). | In progress |
| Prep | VPS hardening | Before M1's first deploy: system and package updates, basic security (SSH, firewall, automatic updates, swap), HTTPS certificates for a Fuochista subdomain. Not needed for M0, which runs on the user's PC. | Not started |
| M1 | Programs | Always-on service on the VPS + PWA. Stove status, essential manual controls, weekly multi-step **Programs** (power, fan including off, water temperature per **Step**), stove protections (minimum times, cloud call limits), confirmation that each command took effect, notifications for alarms and an unreachable cloud. | Not started |
| M2 | Calendar | Reusable profiles, exceptions (holidays, vacations), temporary overrides ("one more hour", "skip the next shutdown"). | Not started |
| M3 | History | Log of status and commands, charts, hour counter, "who changed what". | Not started |
| M4 | Pellets and maintenance | Consumption estimate from the history, hopper level, reserve warning, costs and stock, cleaning and yearly service reminders. | Not started |
| M5 | Advanced alarms | Alarm codes explained in plain words, "did you forget?", remote restart after an alarm under deliberately designed safety rules. | Not started |
| M6 | Weather | Weather compensation curve (water temperature from the outdoor temperature, from a weather service, no hardware), earlier ignition on cold days. | Not started |
| M7 | Presence | Who is home and when, detection from the phones. | Not started |
| M8 | Sensors and comfort | Per-zone sensors (purchase), holding a temperature, "I want 21° at 7:30". | Not started |
| M9 | More channels | Natural-language Telegram bot, voice assistants. | Not started |
| Later | Ambitious ideas | Scheduling that learns habits, integration with other systems, a hosted product for other Micronova owners. | Not planned |

## Ordering rationale

- Weather (M6) comes before sensors (M8) because it needs no hardware.
- History (M3) comes before pellets (M4) because consumption is estimated from the history.

## Out of scope

- **Bluetooth or local control**, including the first Wi-Fi setup of the module: the official app already does it. Every Fuochista feature needs the VPS and the cloud, so a local path wouldn't keep them working.

## Risks

- **Unofficial API**: the vendor can change or block it at any time. The reviews show a cloud that is often unreliable.
- **Hosted product (the "Later" row)**: handling other people's Klover credentials needs real legal advice before starting.
