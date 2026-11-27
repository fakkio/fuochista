/** Weekdays, Monday first; Step times are local (Europe/Rome) wall-clock times. */
export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** Fuochista's own value ranges, narrower than the Stove's where needed. */
export const RANGES = {
  power: { min: 1, max: 5 },
  fan: { min: 0, max: 6 },
  waterTemperature: { min: 55, max: 80 },
} as const;
export type StepField = keyof typeof RANGES;

/** Minimum gap between an ignition and a shutdown, in either order. */
export const MIN_ON_OFF_GAP_MINUTES = 30;

/** A Step either switches the Stove off, or sets a non-empty subset of {on, power, fan, water temperature}. */
export type Step =
  | { time: string; off: true }
  | { time: string; on?: true; power?: number; fan?: number; waterTemperature?: number };

export interface DayGroup {
  days: Weekday[];
  steps: Step[];
}

export interface ProgramInput {
  name: string;
  dayGroups: DayGroup[];
}

type At = { day: Weekday; time: string };

export type Problem =
  | { code: "invalid_shape" }
  | { code: "name_required" }
  | { code: "invalid_day"; group: number; day: unknown }
  | { code: "day_in_two_groups"; day: Weekday }
  | { code: "invalid_time"; group: number; time: unknown }
  | { code: "empty_step"; group: number; time: string }
  | { code: "off_with_values"; group: number; time: string }
  | { code: "invalid_value"; group: number; time: string; field: string }
  | { code: "out_of_range"; group: number; time: string; field: StepField; min: number; max: number }
  | { code: "duplicate_time"; group: number; time: string }
  | { code: "too_close"; first: At; second: At; minGap: number };

export type ValidationResult = { ok: true; program: ProgramInput } | { ok: false; problems: Problem[] };

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;
const FIELDS = Object.keys(RANGES) as StepField[];
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Checks untrusted input against every Program rule; on success returns it normalised (Steps sorted by time). */
export function validateProgram(input: unknown): ValidationResult {
  if (!isObject(input) || typeof input.name !== "string" || !Array.isArray(input.dayGroups)) {
    return { ok: false, problems: [{ code: "invalid_shape" }] };
  }
  const problems: Problem[] = [];
  const name = input.name.trim();
  if (!name) problems.push({ code: "name_required" });

  const seenDays = new Set<Weekday>();
  const dayGroups: DayGroup[] = [];
  for (const [g, raw] of input.dayGroups.entries()) {
    if (!isObject(raw) || !Array.isArray(raw.days) || !Array.isArray(raw.steps)) {
      problems.push({ code: "invalid_shape" });
      continue;
    }
    const days: Weekday[] = [];
    for (const day of raw.days) {
      if (!WEEKDAYS.includes(day)) problems.push({ code: "invalid_day", group: g, day });
      else if (seenDays.has(day)) problems.push({ code: "day_in_two_groups", day });
      else {
        seenDays.add(day);
        days.push(day);
      }
    }
    const steps: Step[] = [];
    for (const s of raw.steps) {
      const step = checkStep(s, g, problems);
      if (step) steps.push(step);
    }
    steps.sort((a, b) => a.time.localeCompare(b.time));
    for (let i = 1; i < steps.length; i++) {
      if (steps[i].time === steps[i - 1].time) problems.push({ code: "duplicate_time", group: g, time: steps[i].time });
    }
    dayGroups.push({ days: WEEKDAYS.filter((d) => days.includes(d)), steps });
  }

  problems.push(...tooClose(dayGroups));
  return problems.length > 0 ? { ok: false, problems } : { ok: true, program: { name, dayGroups } };
}

function checkStep(s: unknown, group: number, problems: Problem[]): Step | null {
  if (!isObject(s) || typeof s.time !== "string" || !TIME.test(s.time)) {
    problems.push({ code: "invalid_time", group, time: isObject(s) ? s.time : undefined });
    return null;
  }
  const time = s.time;
  const present = FIELDS.filter((f) => s[f] !== undefined);
  if (s.off !== undefined) {
    if (s.off !== true) return invalid("off");
    if (s.on !== undefined || present.length > 0) {
      problems.push({ code: "off_with_values", group, time });
      return null;
    }
    return { time, off: true };
  }
  if (s.on !== undefined && s.on !== true) return invalid("on");
  if (s.on === undefined && present.length === 0) {
    problems.push({ code: "empty_step", group, time });
    return null;
  }
  const step: Step = { time };
  if (s.on === true) step.on = true;
  let ok = true;
  for (const field of present) {
    const value = s[field];
    const { min, max } = RANGES[field];
    if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
      problems.push({ code: "out_of_range", group, time, field, min, max });
      ok = false;
    } else step[field] = value;
  }
  return ok ? step : null;

  function invalid(field: string) {
    problems.push({ code: "invalid_value", group, time, field });
    return null;
  }
}

/** Every ignition/shutdown pair closer than the minimum gap, on the weekly timeline that wraps from Sunday to Monday. */
function tooClose(dayGroups: DayGroup[]): Problem[] {
  const events: { at: At; minute: number; kind: "on" | "off" }[] = [];
  for (const group of dayGroups) {
    for (const day of group.days) {
      for (const step of group.steps) {
        const kind = "off" in step ? "off" : step.on ? "on" : null;
        if (!kind) continue;
        const [h, m] = step.time.split(":").map(Number);
        events.push({ at: { day, time: step.time }, minute: WEEKDAYS.indexOf(day) * MINUTES_PER_DAY + h * 60 + m, kind });
      }
    }
  }
  events.sort((a, b) => a.minute - b.minute);
  const problems: Problem[] = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const [a, b] = [events[i], events[j]];
      if (a.kind === b.kind) continue;
      const gap = b.minute - a.minute;
      if (gap < MIN_ON_OFF_GAP_MINUTES) problems.push({ code: "too_close", first: a.at, second: b.at, minGap: MIN_ON_OFF_GAP_MINUTES });
      else if (MINUTES_PER_WEEK - gap < MIN_ON_OFF_GAP_MINUTES) problems.push({ code: "too_close", first: b.at, second: a.at, minGap: MIN_ON_OFF_GAP_MINUTES });
    }
  }
  return problems;
}
