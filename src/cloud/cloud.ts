/** The cloud port the core depends on: high level, no raw registers. */

export type StoveState = "off" | "starting" | "on" | "shutting_down" | "alarm" | "unknown";

export interface StoveInfo {
  id: string;
  name: string;
}

export interface StoveReading {
  state: StoveState;
  /** Raw `status_get`, kept for diagnosis. */
  statusCode: number;
  /** Raw `alarms_get`, 0 when there is no alarm. */
  alarmCode: number;
  power: number;
  fan: number;
  waterSetpoint: number;
  waterTemperature: number;
}

export interface Cloud {
  listStoves(): Promise<StoveInfo[]>;
  readStatus(stoveId: string): Promise<StoveReading>;
}

/** Maps `status_get` (py-agua-iot's table) and `alarms_get` to a Stove state. */
export function stateFromCodes(statusCode: number, alarmCode: number): StoveState {
  if (alarmCode !== 0) return "alarm";
  switch (statusCode) {
    case 0:
      return "off";
    case 1: // START
    case 2: // LOAD PELLETS
    case 3: // FLAME LIGHT
      return "starting";
    case 4: // ON
    case 5: // CLEANING FIRE-POT
    case 7: // ECO-STOP: paused on temperature, it relights by itself
      return "on";
    case 6: // CLEANING FINAL
      return "shutting_down";
    case 8: // PELLETS DEPLETED
    case 9: // IGNITION FAILED
    case 10: // ALARM
    case 11: // MEM.ALM
      return "alarm";
    default:
      return "unknown";
  }
}

/** A cloud call failed: unreachable, rejected, or a job that never completed. */
export class CloudError extends Error {}

/** The cloud could not be reached at all (network down, DNS, timeout). */
export class CloudUnreachableError extends CloudError {}
