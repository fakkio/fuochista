"""M0 feasibility spike: the two controlled writes, run with the user at the stove.

    python write.py water   # water setpoint +1 degC, then back to the original value
    python write.py fan     # front fan 1, then 0 (bypassing the library's min = 1 check)

Safety: never switches the stove on or off, refuses to run unless the stove is ON,
asks for confirmation before every write, re-reads at most every 30 s.
"""

import sys
import time
import uuid

from read import API_URL, CUSTOMER_CODE, load_credentials
from py_agua_iot import agua_iot

STATUS_ON = 4
READ_INTERVAL_S = 30
MAX_READS = 6  # up to 3 minutes waiting for a value to show up


def confirm(question: str) -> bool:
    return input(f"{question} [y/N] ").strip().lower() == "y"


def read_value(dev, item):
    dev.update()
    return dev.get_item_value(item)


def write_raw(dev, item, value):
    """Write a raw value, skipping the library's set_min/set_max check (formulas are identity)."""
    start = time.monotonic()
    dev._Device__request_writing(item, [int(value)])
    return time.monotonic() - start


def write_and_watch(dev, item, value, bypass_range=False):
    if not confirm(f"Write {item} = {value}?"):
        print("Skipped.")
        return False
    try:
        if bypass_range:
            elapsed = write_raw(dev, item, value)
        else:
            start = time.monotonic()
            dev.set_item_value(item, value)
            elapsed = time.monotonic() - start
    except Exception as e:
        print(f"Write rejected: {type(e).__name__}: {e}")
        return False
    print(f"Cloud job completed in {elapsed:.1f} s. Check the panel now.")
    t0 = time.monotonic()
    for _ in range(MAX_READS):
        time.sleep(READ_INTERVAL_S)
        current = read_value(dev, item)
        print(f"  +{time.monotonic() - t0:.0f} s: cloud reads {item} = {current}")
        if current == value:
            break
    else:
        print("  The cloud never reported the new value.")
    input("Note what the panel shows, then press Enter... ")
    return True


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] not in ("water", "fan"):
        print(__doc__)
        return 1
    email, password = load_credentials()
    client = agua_iot(API_URL, CUSTOMER_CODE, email, password, str(uuid.uuid4()))
    dev = client.devices[0]
    dev.update()

    print(f"Status: {dev.status} {dev.status_translated}")
    if dev.status != STATUS_ON:
        print("The stove must be ON and stable for this test. Aborting.")
        return 2

    if sys.argv[1] == "water":
        original = dev.get_item_value("temp_water_set")
        print(f"Water setpoint now: {original}")
        if write_and_watch(dev, "temp_water_set", original + 1):
            write_and_watch(dev, "temp_water_set", original)
    else:
        original = dev.get_item_value("vent_front_set")
        print(f"Front fan now: {original}")
        if write_and_watch(dev, "vent_front_set", 1):
            write_and_watch(dev, "vent_front_set", 0, bypass_range=True)
        if read_value(dev, "vent_front_set") != original:
            print(f"Fan is not back to {original}: restore it from the panel.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
