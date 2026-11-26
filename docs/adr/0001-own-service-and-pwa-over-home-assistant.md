# Own service and PWA instead of Home Assistant; Programs live in Fuochista

Fuochista is its own always-on TypeScript service on a VPS, with a PWA as its interface. It is not a Home Assistant setup built on the existing Micronova Agua IOT integration. Home Assistant on a remote VPS can't use the household's local devices, which are its main strength. And the logic we care about would have to be written anyway, whether as YAML or as custom automations:

- multi-step **Programs** with stove-safety constraints;
- pellet tracking;
- a natural-language bot.

For the same reason, **Programs** live in Fuochista and not in the stove's **Chrono**. The Chrono can only switch the stove on and off at fixed times, and it overrides the app when set from the panel. So the Chrono stays off, and Fuochista sends each command at its time, as if the user had pressed the button.

## Consequences

- If the VPS or the Micronova cloud is down at a **Step**'s time, the command doesn't happen. Fuochista must notice this and tell the user. The stove has no on-board fallback.
- Integrating with Home Assistant stays possible later, as a client of Fuochista's own API.
