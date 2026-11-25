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
- Heats the basement by radiation and convection, plus the fan. The user **keeps the fan off** because the basement is already very warm without it.
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

- A **VPS** to run the always-on service (programs, automations). OS and resources still to be noted.
- Control goes through the Micronova cloud, so the service doesn't have to live in the house.
- But the VPS can't see the home network: any local sensors (Zigbee, Wi-Fi) need the vendor's cloud service or a link between house and VPS (e.g. Tailscale).
- Discarded idea: a second Claude session on the VPS talking to this one. It's simpler for the agent to work on the VPS over SSH.

## Thermostat and sensors

- No smart thermostat at the moment; the user is willing to buy one.
- Emerging direction: **temperature sensors** (e.g. Shelly H&T) in the day and night zones, with our own logic, are probably enough instead of a full thermostat.

## Open decisions

1. **Architecture**: Home Assistant in Docker on the VPS + the existing integration (recommended in the first session), or our own Python service with a web interface.
2. **Sensors**: which to buy and how to get their data to the VPS.
3. **Official app reviews**: the Play Store doesn't show them to automated access. The user pastes them, or we read them with Claude in Chrome. They're needed to complete the list of improvements.
4. **First release**: which ideas from [ideas.md](ideas.md) make up the first version.

## Proposed next step

A **read-only** test script with py-agua-iot that connects to the Klover account and shows status, temperatures and available parameters. The user runs it on their PC, with the credentials in environment variables. If it works, the existing-libraries path is open.
