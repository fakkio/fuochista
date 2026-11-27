import { describe, expect, it } from "vitest";
import { validateProgram } from "./validate.ts";

const weekdays = ["mon", "tue", "wed", "thu", "fri"];

describe("Program validation", () => {
  it("accepts a well-formed Program", () => {
    const result = validateProgram({
      name: "Inverno",
      dayGroups: [
        {
          days: weekdays,
          steps: [
            { time: "06:00", on: true, power: 3, fan: 0, waterTemperature: 70 },
            { time: "08:30", off: true },
            { time: "17:00", on: true },
            { time: "19:00", power: 5 },
            { time: "22:30", off: true },
          ],
        },
        { days: ["sat", "sun"], steps: [{ time: "08:00", on: true }, { time: "23:00", off: true }] },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it("sorts each day group's Steps by time", () => {
    const result = validateProgram({
      name: "P",
      dayGroups: [{ days: ["mon"], steps: [{ time: "20:00", off: true }, { time: "07:00", on: true }] }],
    });
    expect(result.ok && result.program.dayGroups[0].steps.map((s) => s.time)).toEqual(["07:00", "20:00"]);
  });

  it("requires a name", () => {
    expect(validateProgram({ name: "  ", dayGroups: [] })).toEqual({ ok: false, problems: [{ code: "name_required" }] });
  });

  it("rejects a weekday in two day groups", () => {
    const result = validateProgram({
      name: "P",
      dayGroups: [
        { days: ["mon", "tue"], steps: [] },
        { days: ["tue"], steps: [] },
      ],
    });
    expect(result).toEqual({ ok: false, problems: [{ code: "day_in_two_groups", day: "tue" }] });
  });

  it("rejects unknown weekdays and malformed times", () => {
    const result = validateProgram({
      name: "P",
      dayGroups: [{ days: ["xyz"], steps: [{ time: "24:00", off: true }, { time: "7:5", on: true }] }],
    });
    expect(result.ok ? [] : result.problems.map((p) => p.code)).toEqual(["invalid_day", "invalid_time", "invalid_time"]);
  });

  it("rejects an empty Step, two Steps at the same time, and switch off mixed with values", () => {
    const result = validateProgram({
      name: "P",
      dayGroups: [{ days: ["mon"], steps: [{ time: "07:00" }, { time: "08:00", off: true, power: 2 }, { time: "09:00", power: 2 }, { time: "09:00", fan: 1 }] }],
    });
    expect(result.ok ? [] : result.problems.map((p) => p.code)).toEqual(["empty_step", "off_with_values", "duplicate_time"]);
  });

  it.each([
    ["power", 0, 1, 5],
    ["power", 6, 1, 5],
    ["fan", -1, 0, 6],
    ["fan", 7, 0, 6],
    ["waterTemperature", 54, 55, 80],
    ["waterTemperature", 81, 55, 80],
    ["power", 2.5, 1, 5],
  ])("rejects %s = %s (allowed %s–%s)", (field, value, min, max) => {
    const result = validateProgram({ name: "P", dayGroups: [{ days: ["mon"], steps: [{ time: "07:00", [field]: value }] }] });
    expect(result).toEqual({ ok: false, problems: [{ code: "out_of_range", group: 0, time: "07:00", field, min, max }] });
  });

  it.each([
    ["power", 1],
    ["power", 5],
    ["fan", 0],
    ["fan", 6],
    ["waterTemperature", 55],
    ["waterTemperature", 80],
  ])("accepts %s = %s at the edge of its range", (field, value) => {
    expect(validateProgram({ name: "P", dayGroups: [{ days: ["mon"], steps: [{ time: "07:00", [field]: value }] }] }).ok).toBe(true);
  });

  describe("ignition and shutdown at least 30 minutes apart", () => {
    const tooClose = (dayGroups: unknown) => {
      const result = validateProgram({ name: "P", dayGroups });
      return result.ok ? [] : result.problems.filter((p) => p.code === "too_close");
    };

    it("rejects 29 minutes and accepts 30 within a day", () => {
      expect(tooClose([{ days: ["mon"], steps: [{ time: "07:00", on: true }, { time: "07:29", off: true }] }])).toEqual([
        { code: "too_close", first: { day: "mon", time: "07:00" }, second: { day: "mon", time: "07:29" }, minGap: 30 },
      ]);
      expect(tooClose([{ days: ["mon"], steps: [{ time: "07:00", on: true }, { time: "07:30", off: true }] }])).toEqual([]);
    });

    it("checks a shutdown followed by an ignition too", () => {
      expect(tooClose([{ days: ["mon"], steps: [{ time: "07:00", off: true }, { time: "07:10", on: true }] }])).toHaveLength(1);
    });

    it("checks across midnight", () => {
      expect(tooClose([{ days: ["mon", "tue"], steps: [{ time: "00:10", on: true }, { time: "23:50", off: true }] }])).toEqual([
        { code: "too_close", first: { day: "mon", time: "23:50" }, second: { day: "tue", time: "00:10" }, minGap: 30 },
      ]);
    });

    it("checks across day groups", () => {
      expect(
        tooClose([
          { days: ["mon"], steps: [{ time: "23:45", on: true }] },
          { days: ["tue"], steps: [{ time: "00:05", off: true }] },
        ]),
      ).toHaveLength(1);
    });

    it("checks across the end of the week", () => {
      expect(
        tooClose([
          { days: ["sun"], steps: [{ time: "23:55", off: true }] },
          { days: ["mon"], steps: [{ time: "00:20", on: true }] },
        ]),
      ).toEqual([{ code: "too_close", first: { day: "sun", time: "23:55" }, second: { day: "mon", time: "00:20" }, minGap: 30 }]);
    });

    it("ignores Steps that neither switch on nor off", () => {
      expect(tooClose([{ days: ["mon"], steps: [{ time: "07:00", on: true }, { time: "07:05", power: 4 }] }])).toEqual([]);
    });
  });
});
