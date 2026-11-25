# Ideas

Brainstorming of 2026-11-25. The user said they're interested in all of them: they need ranking by priority to decide the first release.

## 1. Programs

- **Multi-step programs**: each time slot gets its own action (ignition, power, fan, water temperature). The reason the project exists.
- **Reusable profiles**: "Quick morning", "Weekend", "Remote work", "Holiday", assigned to days.
- **Calendar with exceptions**: public holidays, vacations, "I'm leaving early tomorrow", without touching the base program.
- **Temporary override**: "one more hour", "skip the next shutdown", then back to the program.
- **Target instead of time**: "I want 21° at 7:30". The system learns how long the house takes to warm up and works out the ignition time.

## 2. Presence (explicit request: two people at home)

- **Schedule of when we're home and when we're out**, for each of the two.
- **Automatic detection**: when the last one leaves, lower or switch off; when someone gets close to home, switch on.
- The user works in the basement: remote-work days are a special case (basement already warm from the stove, the rest of the house can stay lower).

## 3. Comfort and regulation

- **Hold a temperature** by modulating power instead of switching on and off.
- **Per-zone sensors** (day, night): regulate on the zone that matters at that moment.
- **Specific to the boiler stove**:
  - the basement heats itself by radiation, so the stove's probe says nothing about comfort in the rest of the house;
  - **weather compensation curve**: radiator water temperature set from the outdoor temperature;
  - keep the basement from getting too hot while the rest of the house still calls for heat;
  - consider **smart thermostatic radiator valves** to regulate the zones independently.
- **Weather forecast**: switch on earlier if tomorrow is cold, lower it in full sun.

## 4. Pellets and costs

- Consumption estimate from the running hours at each power level.
- Estimated hopper level ("I loaded a 15 kg bag") with a warning before it runs out.
- Daily and monthly cost from the bag price, comparison between seasons.
- Stock: "with 12 bags you'll get to mid-February".

## 5. Alerts and safety

- Notifications for stove alarms, explained in plain words.
- "Did you forget?": on for many hours with nobody home.
- Watchdog: alert if the Micronova cloud or the Wi-Fi module stop responding.
- Protections: minimum times between ignition and shutdown, respect for the burn pot cleaning cycles, configurable maximum power.

## 6. Maintenance

- Hour counter and reminders: burn pot, ash drawer, yearly service.
- Service log (date, what, cost).
- Signs of wear: slower ignitions or struggling to reach temperature → needs cleaning.

## 7. How it's controlled

- **Natural-language Telegram bot**: "switch it on tomorrow at 8 at power 5 and lower it to 2 at 9", interpreted by an AI model and turned into a program.
- Voice assistants (Google, Alexa).
- Widget or quick button on the phone.
- A web interface clearer than the official app.
- Multiple users, each with their own notifications, and a log of who changed what.

## 8. Data and charts

- Charts of room temperature, water temperature, power and status.
- Weekly report: hours, pellets, cost, average temperature.
- Comparison with the weather: how much each degree colder outside costs.

## 9. Ambitious ideas

- Automatic scheduling that learns habits and proposes the program.
- Integration with other systems (boiler, heat pump, solar panels).
- A product for other Micronova stove owners (the platform is shared by dozens of brands).

## To add

- Complaints and requests from the Klover Home app reviews on the Play Store.
