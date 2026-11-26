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

**Water temperature**:
The radiator water setpoint of the **Stove**. With no buffer tank, it is the only temperature the household sets, and the stove modulates its power to hold it.
_Avoid_: boiler temperature, H2O
