"""M0 feasibility spike: read-only. Logs in once, lists devices, dumps every register.

Raw output goes to out/ (git-ignored, local only: it holds device IDs and serials).
"""

import json
import os
import sys
import uuid
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from py_agua_iot import agua_iot

# Klover Home brand settings, as listed by the community (to be verified by this spike).
API_URL = "https://klover.agua-iot.com"
CUSTOMER_CODE = "143789"

OUT = Path(__file__).parent / "out"


def load_credentials() -> tuple[str, str]:
    load_dotenv(Path(__file__).parent / ".env")
    email = os.environ.get("KLOVER_EMAIL")
    password = os.environ.get("KLOVER_PASSWORD")
    if not email or not password:
        sys.exit("Set KLOVER_EMAIL and KLOVER_PASSWORD in spikes/m0/.env")
    return email, password


def main() -> int:
    email, password = load_credentials()

    print("Logging in...")
    try:
        client = agua_iot(API_URL, CUSTOMER_CODE, email, password, str(uuid.uuid4()))
    except Exception as e:  # stop and report: no retries, see the M0 spec
        print(f"Login failed: {type(e).__name__}: {e}")
        return 2

    print(f"Logged in. Devices found: {len(client.devices)}")
    if not client.devices:
        return 3

    OUT.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

    for i, dev in enumerate(client.devices):
        print(f"\n--- Device {i}: {dev.name} ({dev.name_product}), online={dev.is_online}")
        try:
            dev.update()  # register map + one buffer read (the library polls the job up to 10 s)
        except Exception as e:
            print(f"Read failed: {type(e).__name__}: {e}")
            continue

        def show(label, fn):
            try:
                print(f"{label:<18} {fn()}")
            except Exception as e:
                print(f"{label:<18} n/a ({type(e).__name__})")

        show("status", lambda: f"{dev.status} {dev.status_translated}")
        show("alarms", lambda: f"{dev.alarms} {dev.alarms_translated}")
        show("power", lambda: f"{dev.power} (real {dev.real_power}, range {dev.min_power}-{dev.max_power})")
        show("water temp", lambda: dev.water_temp)
        show("water setpoint", lambda: f"{dev.set_water_temp} (range {dev.min_water_temp}-{dev.max_water_temp})")
        show("air temp", lambda: dev.air_temp)
        show("gas temp", lambda: dev.gas_temp)

        data = dev.full_data_map
        path = OUT / f"registers-{stamp}-dev{i}.json"
        path.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")
        print(f"\n{len(data)} registers dumped to {path}")
        fans = [k for k in data if "fan" in k.lower() or "vent" in k.lower()]
        print(f"Fan-related registers: {fans}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
