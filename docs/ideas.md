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

## 10. From the official app's reviews

Collected on 2026-11-25.

**Sources**
- All 136 written Google Play reviews (Italian store), read in the browser.
- About 13 App Store reviews.
- Reviews of sibling apps on the same Micronova platform.

**Ratings**
- Google Play: 1.9★ from 352 ratings, 10K+ downloads. 200 of the 344 phone ratings are 1★.
- Italian App Store: 2.0★.

**Themes, roughly in order of frequency**

- **Cloud and connection reliability**: far ahead of everything else, more than half the reviews.
  - Symptoms: "unknown status", "an error occurred, try again later", "authentication failed", app offline while the phone is online, and commands that work "one time out of three".
  - Platform-wide outages: on 2022-10-09 and 2022-11-21/22, many reviews report the app dead on every device at once.
  - Some users must unplug the stove, or reconfigure the Wi-Fi module after a power cut, to get the connection back.
  - The Home Assistant and Homebridge communities report the same about the Agua IOT API (errors 500, JWT login failures).
  - Consequences for us: retries, confirming that each command took effect, a watchdog, and telling the user when the cloud is down instead of failing silently.
- **The fan can't be set to OFF from the app**: about 12 reviews, from 2021 to 2026. It can only be set to 1…auto, so OFF needs the stove's panel. In 2021 the option disappeared after an update. Some also ask to see or adjust the exhaust fan speed. **This matters to us directly: the user keeps the fan off.** M0 must check whether the API accepts fan = 0.
- **Program slots should carry parameters**: power, fan and water temperature per slot, not just on/off. About 6 reviews; one says "it used to be possible". Other requests:
  - named programs, each enabled or disabled individually;
  - more than **4 programs**, which is the current limit;
  - fan control from the chrono.
  This is exactly our multi-step program.
- **The stove panel's chrono overrides the app**: if the chrono is set on the stove's touch panel, "the app has no power to interfere". Confirms that two schedulers conflict.
- **Pellet reserve**: about 8 reviews. People want a notification when the reserve is reached (today it shows only on the stove's display), a level indicator, or a beep.
- **Alarm notifications**: about 8 reviews. Push notifications for alarms, errors, missing pellets and power cuts, with a description and not just a code.
- **Restart after an alarm, remotely**: about 5 reviews. After a failed ignition or empty-pellet alarm, people want to reset and restart from outside the house. One complains they can't even switch off a stove that is in block. **This is a safety question to decide on purpose, not a convenience.**
- **More parameters and settings** in the app:
  - hours of operation, the stove's date and time, winter/summer mode;
  - user calibrations ("tarature utente");
  - technical water temperature, water pressure;
  - ducted-air temperature and the room temperature near it.
- **Voice assistants and smart home**: Alexa and Google, ignition driven by an external smart thermostat (about 4).
- **Implausible readings**: flame temperature stuck at 212 or 15071 °C. One user set water to 65 °C but the stove "goes to 70". Consequences for us: validate readings and explain setpoint behaviour.
- **Login**: the session expires and asks for the password again, activation emails never arrive. Not relevant to us beyond keeping our own session stable.
- From the App Store and sibling apps:
  - standby can't be managed from the app;
  - users ask for an operation history;
  - one asks to read and adjust the buffer-tank temperature.
- Positive notes: when it connects, it does the basics, namely remote ignition, power and water temperature, and the weekly on/off schedule.
