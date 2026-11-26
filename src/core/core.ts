import type { Cloud, StoveReading, StoveState } from "../cloud/cloud.ts";
import type { Clock } from "./clock.ts";

const MIN = 60_000;
/** Read cadence: sparing when the Stove is off, closer while it is doing something. */
export const READ_INTERVAL_OFF_MS = 5 * MIN;
export const READ_INTERVAL_ACTIVE_MS = 2 * MIN;
/** On-demand reads closer than this to the last one reuse it, so taps and open tabs don't hammer the cloud. */
export const MIN_ON_DEMAND_READ_GAP_MS = 30_000;
const ACTIVE_STATES = new Set<StoveState>(["starting", "on", "shutting_down"]);

export interface StoveView {
  id: string;
  name: string;
  /** The last successful reading, kept while the cloud is unreachable. */
  reading: StoveReading | null;
  /** When `reading` was taken (epoch ms). */
  readAt: number | null;
  /** Why the last read failed, or null when it succeeded. */
  error: string | null;
}

export interface CoreOptions {
  cloud: Cloud;
  clock: Clock;
}

export class UnknownStoveError extends Error {}

interface StoveSlot {
  view: StoveView;
  timer: unknown;
  inFlight: Promise<StoveView> | null;
}

export function createCore({ cloud, clock }: CoreOptions) {
  const slots = new Map<string, StoveSlot>();
  let startTimer: unknown = null;
  let stopped = false;

  function schedule(slot: StoveSlot) {
    if (stopped) return;
    if (slot.timer !== null) clock.clearTimeout(slot.timer);
    // Fast only while the Stove is burning; off, alarm and unknown states change rarely.
    const active = ACTIVE_STATES.has(slot.view.reading?.state ?? "off");
    slot.timer = clock.setTimeout(() => {
      slot.timer = null;
      void read(slot);
    }, active ? READ_INTERVAL_ACTIVE_MS : READ_INTERVAL_OFF_MS);
  }

  /** Reads one Stove; concurrent requests share the read already in flight. */
  function read(slot: StoveSlot): Promise<StoveView> {
    slot.inFlight ??= (async () => {
      try {
        const reading = await cloud.readStatus(slot.view.id);
        slot.view = { ...slot.view, reading, readAt: clock.now(), error: null };
      } catch (err) {
        slot.view = { ...slot.view, error: (err as Error).message };
      } finally {
        slot.inFlight = null;
        schedule(slot);
      }
      return slot.view;
    })();
    return slot.inFlight;
  }

  async function start(): Promise<void> {
    try {
      const stoves = await cloud.listStoves();
      for (const s of stoves) {
        if (slots.has(s.id)) continue;
        slots.set(s.id, { view: { id: s.id, name: s.name, reading: null, readAt: null, error: null }, timer: null, inFlight: null });
      }
      await Promise.all([...slots.values()].map(read));
    } catch {
      // The cloud is down at start-up: try to discover the Stoves again later.
      if (!stopped) startTimer = clock.setTimeout(() => void start(), READ_INTERVAL_OFF_MS);
    }
  }

  return {
    /** Discovers the account's Stoves, reads each once, then keeps reading at the cadence. */
    start,

    stop() {
      stopped = true;
      if (startTimer !== null) clock.clearTimeout(startTimer);
      for (const slot of slots.values()) if (slot.timer !== null) clock.clearTimeout(slot.timer);
    },

    stoves(): StoveView[] {
      return [...slots.values()].map((s) => s.view);
    },

    /** Reads a Stove now (app opened, "refresh" pressed) unless the last read is fresh; the cadence restarts from a new read. */
    refresh(stoveId: string): Promise<StoveView> {
      const slot = slots.get(stoveId);
      if (!slot) return Promise.reject(new UnknownStoveError(`unknown stove ${stoveId}`));
      const { readAt, error } = slot.view;
      const fresh = error === null && readAt !== null && clock.now() - readAt < MIN_ON_DEMAND_READ_GAP_MS;
      return fresh ? Promise.resolve(slot.view) : read(slot);
    },
  };
}

export type Core = ReturnType<typeof createCore>;
