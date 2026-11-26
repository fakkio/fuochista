# platform

What the Micronova Agua IOT cloud allows for the household's **Stove**, as found by the M0 feasibility spike (#1). The spike scripts live in `spikes/m0/`.

Status: complete. Reads verified on 2026-11-25; writes and fan = 0 verified at the stove on 2026-11-26 (stove ON, user watching the panel).

## Stove

- Model: **Klover Style 180**. The cloud names the product `STYLE 180 - SL180`.
- One device on the account, reported online.

## Access

- py-agua-iot 0.0.22 works with the Klover Home brand settings: API URL `https://klover.agua-iot.com`, customer code `143789`, default brand id `1`. The login worked on the first try.
- Credentials are the official app's email and password. The client also sends a random unique id per installation.
- The protocol is plain HTTPS + JSON with a JWT token. Nothing is hard to port: TypeScript is confirmed for the client.

## Read flow

For one full read, the library makes these calls:

1. Login, which returns the token.
2. Device list. For each device it then fetches the device info, which holds the id of the device's register map.
3. Register map: the definition of every register (key, type, offset, formulas, min/max, mask).
4. Buffer reading: an asynchronous job that returns a request id.
5. Job status, polled once a second (up to 10 s) until the job is `completed`. It then holds the values of every offset.

So one status read costs at least two calls plus the polling. The register map is static and can be cached.

## Write flow

Writing posts an asynchronous job to the device-writing endpoint. Its payload holds the protocol `RWMSmaster`, 8-bit little-endian data, and the register offsets, masks and values. The job is then polled like a read. The value goes through the register's `formula_inverse`. The library rejects values outside `set_min`/`set_max` **on the client side**, before calling the cloud.

## Register map

The map has 63 registers. Types: `GET` (read), `SET` (writable setpoint), `ENABLE` (whether a feature applies to this model).

| Key | Type | Range | Observed | Meaning |
|---|---|---|---|---|
| `status_get` | GET | | 0 | Stove state (0 OFF, 1 START, … 4 ON, … 10 ALARM; see py-agua-iot) |
| `alarms_get` | GET | | 0 | Alarm code, 0 = no alarm (missing from the library's translation table, hence a KeyError) |
| `real_power_get` | GET | | 0 | Power the stove is actually running at |
| `power_set` | SET | 1–5 | 5 | Power setpoint |
| `temp_water_get` | GET | | 41 | Radiator water temperature, °C |
| `temp_water_set` | SET | 55–80 | 70 | **Water temperature** setpoint, °C |
| `temp_probe_k_get` | GET | | 48 | Flue gas temperature (thermocouple), °C |
| `vent_front_set` | SET | 1–6 | **0** | Front fan. It reads 0 because the user switched it off from the panel, even though the map declares min 1 |
| `temp_water_boiler_*`, `temp_water_puffer_*` | | | enable = 0 | Domestic hot water and buffer tank: not present on this installation |
| `status_managed_*` | | | 0 | Not yet understood |
| `chrono_general_enable_set`, `chrono_week_enable_set` | SET | 0–1 | 1, 1 | **The stove's Chrono is switched on** |
| `chrono_p1`…`p4` `_start_set` / `_stop_set` | SET | 0–144 | | Time in 10-minute slots from midnight; 144 = unused |
| `chrono_pN_day_<weekday>_set` | SET | 0–1 | | Days each Chrono program applies to |
| `clock_*`, `calendar_*` | SET | | | Stove clock, BCD-encoded (e.g. raw 35 = 0x23 = 23 h) |

There is no air temperature register (the library returns `None`). Nothing in the map reads the room either.

## Write tests (2026-11-26)

| Test | Result |
|---|---|
| `temp_water_set` 70 → 71 → 70 | Accepted. Write job completed in 1.4 s; the panel showed the change; the next cloud read (+32 s) reported it. |
| `vent_front_set` 0 → 1 (through the library) | Accepted, the fan started. |
| `vent_front_set` 1 → 0 (direct write, bypassing the library's min = 1) | **Accepted by the cloud and the stove**: the fan stopped. |

The declared `set_min`/`set_max` are not enforced by the cloud, at least for the fan. Our client must keep its own ranges, and enforce them deliberately (0 allowed for the fan).

## Implications for M1

- A **Step** can turn the fan off (0), which the official app can't do.
- A write takes ~1.5 s to be confirmed by the cloud job. Confirming that a command took effect needs one extra read afterwards.
- Since the cloud doesn't enforce ranges, a wrong value would reach the stove: validation is Fuochista's job.
- The stove's Chrono is active, with two programs. Following the decision that Fuochista keeps the Chrono off, it has to be switched off before Programs take over. Otherwise both will send commands.
- Reads are asynchronous jobs that take a few seconds, so the cloud should not be polled often. Cache the register map.
