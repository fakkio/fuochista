# Context

Gathered on 2026-11-25 in the first brainstorming session.

## The problem

The official app can switch the stove on and off, change power, fan and water temperature, and create programs that **only** switch it on and off at fixed times. It has no multi-step programs, for example:

- 08:00 switch on at power 5, fan 2
- 09:00 lower power to 2 and turn the fan off
- 12:00 switch off

It doesn't talk to external thermostats or sensors either.

## The house

- Two people live in the house. We need a schedule of when each is home and when they're out.
- Three levels:
  - **Basement** (where the stove is installed and where the user works) + an unheated garage.
  - **Day zone**: kitchen and living room, 65 m².
  - **Night zone**: 65 m².

## The stove

- Klover **pellet boiler stove** (hydro pellet stove; exact model still to be noted).
- Heats the basement by radiation and convection, plus the fan. The user **keeps the fan off** because the basement is already very warm without it. The official app can't set the fan to OFF (its minimum is 1), so the user switches it off from the stove's panel. Whether the cloud API accepts fan = 0 is still to be verified.
- Heats the water for the radiators of the whole house.
- Consequence: the stove's room probe (if any) measures the basement, the warmest room. Regulating comfort in the rest of the house needs sensors in the other zones.

## The platform

- Official app: **Klover Home**, `com.micronovasrl.ninaklover` ([Play Store](https://play.google.com/store/apps/details?id=com.micronovasrl.ninaklover&hl=it)).
- It is one of many brands on the **Micronova Agua IOT** cloud platform, already reverse-engineered by the community:
  - [py-agua-iot](https://pypi.org/project/py-agua-iot): Python library. Lists "Klover Home" with URL `https://klover.agua-iot.com` and customer code `143789` (to be verified).
  - [Home Assistant integration](https://github.com/vincentwolsink/home_assistant_micronova_agua_iot) (HACS) built on the library, with Klover Home among the supported brands.
  - [Homebridge plugin](https://www.npmjs.com/package/homebridge-micronova-agua-iot-stove) and [Homey app](https://homey.app/en-ma/app/com.jollymec.pelletstove/) for the same devices.
- **Unverified**: nobody explicitly confirms using it end to end with a Klover. The library has been tried on few devices.
- Plan B if the libraries don't work: decompile the APK with `jadx`, or intercept the traffic with an Android emulator + mitmproxy (with a rooted image and a system certificate, or `apk-mitm` / Frida if there is certificate pinning).

## Available infrastructure

- A **VPS** to run the always-on service (programs, automations), checked on 2026-11-25:
  - **System**: Debian 12 (bookworm), 1 vCPU, 1.9 GB RAM, no swap. About 11 GB of the 40 GB disk are free (72% used).
  - **Docker**: Docker 29 and Docker Compose v5 are installed.
  - **Software that is old or missing**: Node 18, which is end-of-life, and Python 3.11 on the host. Fuochista runs in containers, so it doesn't depend on them. certbot is not installed.
  - **nginx 1.22**: listens on 80 and 443 and has only the `default` site enabled. It is not yet clear where the certificates come from.
  - The user owns several domains, so Fuochista will get a subdomain.
  - Before deploying, the user will have the agent update the system and harden its basic security.
- Control goes through the Micronova cloud, so the service doesn't have to live in the house.
- But the VPS can't see the home network: any local sensors (Zigbee, Wi-Fi) need the vendor's cloud service or a link between house and VPS (e.g. Tailscale).
- Discarded idea: a second Claude session on the VPS talking to this one. It's simpler for the agent to work on the VPS over SSH.

## Temperature sensors

- What the user meant from the start is a **smart thermometer** (a temperature sensor), not a thermostat: Fuochista holds the regulation logic itself. No sensor at the moment; the user is willing to buy them when a milestone needs them (M8).
- Direction: sensors such as the Shelly H&T in the day and night zones, readable from the VPS (through the vendor's cloud or another link between house and VPS).

## Decisions (process grilling, 2026-11-25)

- **Audience**: the household first (two people, one stove, one account), published as **open source** so that anyone can clone and self-host it. A hosted product for other Micronova owners may come later, after checking the legal side.
- **Shape**: our own always-on service on the VPS + a **PWA** as the interface. Both users have Android phones. Telegram may come later as a second channel. See [ADR 0001](adr/0001-own-service-and-pwa-over-home-assistant.md).
- **License and legal**: MIT. The README states that the project is unaffiliated with Klover and Micronova, comes with no warranty, and is used at your own risk. No vendor branding. The repo goes public after M0, once the history is checked for anything sensitive.
- **Deployment**: one household per installation, `docker compose up` + `.env`.
- **Multiple stoves**: the model supports several stoves per account from the start. The UI is designed for one, and the two-stove case is covered only by tests against a fake cloud (untested on real hardware).
- **Stack**: TypeScript for both the service and the PWA. M0 uses py-agua-iot in Python as-is, then the client is rewritten in TS from `docs/platform.md`.
- **Access**: public over HTTPS with a login per user (not Tailscale).
- **Onboarding**: the stove must already be registered on the Micronova cloud through the official app (account, Wi-Fi module setup, product registration). This is a stated prerequisite in the README. When the stove stays unreachable for a long time, Fuochista's notification suggests reconfiguring the module's Wi-Fi from the official app.
- **Bluetooth is out of scope**. Bluetooth control is already available from the official app. Everything Fuochista adds needs the VPS, so it can't work anyway while the module is offline. M0 only notes a local or Bluetooth protocol in `docs/platform.md` if it happens to turn one up.
- **No parity milestone**: the official app stays as a fallback; Fuochista starts from what's missing plus the essential manual controls.
- **Programs live in Fuochista** (see `GLOSSARY.md`): the stove's Chrono stays off, the service sends the commands at the right time, and manual commands from outside (official app, panel) are respected.
- **Milestones are vertical slices**, each deployed and actually used at home; hardware is bought only when a milestone needs it.
- **M0 is a feasibility spike** (read everything, one controlled write, fan = 0), findings in `docs/platform.md`. The stack is confirmed after it.
- **No buffer tank**: water temperature is the only temperature set; the stove modulates power to hold it.

## Open decisions

1. ~~Architecture~~: decided, see above.
2. **Sensors**: which to buy and how to get their data to the VPS.
3. ~~Official app reviews~~: read, see section 10 of [ideas.md](ideas.md).
4. ~~First release~~: see [roadmap.md](roadmap.md).

## Proposed next step

A **read-only** test script with py-agua-iot that connects to the Klover account and shows status, temperatures and available parameters. The user runs it on their PC, with the credentials in environment variables. If it works, the existing-libraries path is open.
