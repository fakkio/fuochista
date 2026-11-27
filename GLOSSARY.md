# Fuochista

The language of a household controlling its pellet boiler stove through the vendor's cloud, beyond what the official app allows.

## Language

**Stove**:
The household's Klover pellet boiler stove. It heats the basement directly and the water of the radiators in the whole house.
_Avoid_: boiler, heater, thermo-stove

**Chrono**:
The on/off timer stored inside the **Stove** and edited from the official app or the stove's panel. Fuochista keeps it switched off.
_Avoid_: schedule, timer, program (for this meaning)

**Program**:
A Fuochista plan of timed **Steps** that lives in Fuochista, not in the **Stove**: when a step's time comes, Fuochista sends the commands itself, as if the user had pressed the buttons.
_Avoid_: schedule, chrono, timer

**Step**:
One timed entry of a **Program**: at a given time, the state the **Stove** should be put in (on or off, power, fan, water temperature).
_Avoid_: slot, phase, event

**Day group**:
A set of weekdays within a **Program** that share the same ordered list of **Steps**. Each weekday belongs to at most one day group of a Program.
_Avoid_: day type, profile

**Water temperature**:
The radiator water setpoint of the **Stove**. With no buffer tank, it is the only temperature the household sets, and the stove modulates its power to hold it.
_Avoid_: boiler temperature, H2O

**Active Program**:
The one **Program** whose **Steps** Fuochista is currently following. Several Programs can be saved; only one is active, and it can be paused without being deleted.
_Avoid_: current schedule, enabled program

**Skipped Step**:
A **Step** that could not be applied within its grace window (the cloud was unreachable or the service was down). It is not replayed later; the household is notified.
_Avoid_: missed step, failed step
