import type { Clock } from "../core/clock.ts";

/** Lets the pending promise chains triggered by a timer run to completion. */
const settle = () => new Promise<void>((r) => setImmediate(r));

export interface FakeClock extends Clock {
  /** Moves time forward, firing due timers in order and settling their async work. */
  advance(ms: number): Promise<void>;
}

export function createFakeClock(start = 0): FakeClock {
  let now = start;
  let nextId = 1;
  const timers = new Map<number, { at: number; fn: () => void }>();

  return {
    now: () => now,
    setTimeout(fn, ms) {
      const id = nextId++;
      timers.set(id, { at: now + Math.max(0, ms), fn });
      return id;
    },
    clearTimeout(handle) {
      timers.delete(handle as number);
    },
    async advance(ms) {
      const target = now + ms;
      await settle();
      for (;;) {
        const due = [...timers.entries()].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!due) break;
        timers.delete(due[0]);
        now = due[1].at;
        due[1].fn();
        await settle();
      }
      now = target;
    },
  };
}
