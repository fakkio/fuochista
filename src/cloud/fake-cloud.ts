import { CloudError, stateFromCodes, type Cloud, type StoveInfo, type StoveReading } from "./cloud.ts";

type RawState = Omit<StoveReading, "state">;

export interface FakeCloud extends Cloud {
  /** How many status reads a Stove has received. */
  reads(stoveId: string): number;
  setState(stoveId: string, changes: Partial<RawState>): void;
  setReachable(reachable: boolean): void;
}

const INITIAL: RawState = { statusCode: 0, alarmCode: 0, power: 3, fan: 3, waterSetpoint: 70, waterTemperature: 40 };

/**
 * An in-memory cloud for tests and local development. Later tickets grow it into the
 * full stove state machine (OFF → START → ON → shutdown, ALARM) as writes arrive.
 */
export function createFakeCloud(stoves: StoveInfo[] = [{ id: "fake-1", name: "Stove" }]): FakeCloud {
  const states = new Map(stoves.map((s) => [s.id, { ...INITIAL }]));
  const readCounts = new Map<string, number>();
  let reachable = true;

  const stateOf = (id: string) => {
    const s = states.get(id);
    if (!s) throw new CloudError(`unknown stove ${id}`);
    return s;
  };

  return {
    async listStoves() {
      if (!reachable) throw new CloudError("cloud unreachable");
      return stoves.map((s) => ({ ...s }));
    },
    async readStatus(stoveId) {
      if (!reachable) throw new CloudError("cloud unreachable");
      const s = stateOf(stoveId);
      readCounts.set(stoveId, (readCounts.get(stoveId) ?? 0) + 1);
      return { state: stateFromCodes(s.statusCode, s.alarmCode), ...s };
    },
    reads: (id) => readCounts.get(id) ?? 0,
    setState(id, changes) {
      Object.assign(stateOf(id), changes);
    },
    setReachable(value) {
      reachable = value;
    },
  };
}
