import type { Database } from "../db.ts";
import type { DayGroup, ProgramInput } from "./validate.ts";

export interface Program extends ProgramInput {
  id: number;
}

/** Which Program a Stove follows; programId null means none. */
export interface ActiveProgram {
  programId: number | null;
  paused: boolean;
}

type Row = { id: number; name: string; day_groups: string };
const toProgram = (r: Row): Program => ({ id: r.id, name: r.name, dayGroups: JSON.parse(r.day_groups) as DayGroup[] });

/** Each Stove's saved Programs and its Active Program. Input must already be validated. */
export function createProgramStore(db: Database) {
  return {
    list(stoveId: string): Program[] {
      return (db.prepare("SELECT id, name, day_groups FROM programs WHERE stove_id = ? ORDER BY id").all(stoveId) as Row[]).map(toProgram);
    },

    /** A Program of another Stove counts as missing. */
    get(stoveId: string, id: number): Program | null {
      const row = db.prepare("SELECT id, name, day_groups FROM programs WHERE stove_id = ? AND id = ?").get(stoveId, id) as Row | undefined;
      return row ? toProgram(row) : null;
    },

    create(stoveId: string, p: ProgramInput): Program {
      const { lastInsertRowid } = db
        .prepare("INSERT INTO programs (stove_id, name, day_groups) VALUES (?, ?, ?)")
        .run(stoveId, p.name, JSON.stringify(p.dayGroups));
      return { id: Number(lastInsertRowid), ...p };
    },

    /** Returns false when the Stove has no such Program. */
    update(stoveId: string, id: number, p: ProgramInput): boolean {
      return (
        db.prepare("UPDATE programs SET name = ?, day_groups = ? WHERE stove_id = ? AND id = ?").run(p.name, JSON.stringify(p.dayGroups), stoveId, id)
          .changes > 0
      );
    },

    /** Deleting the Active Program leaves its Stove with none. */
    delete(stoveId: string, id: number): boolean {
      return db.prepare("DELETE FROM programs WHERE stove_id = ? AND id = ?").run(stoveId, id).changes > 0;
    },

    active(stoveId: string): ActiveProgram {
      const row = db.prepare("SELECT program_id, paused FROM active_programs WHERE stove_id = ?").get(stoveId) as
        | { program_id: number; paused: number }
        | undefined;
      return row ? { programId: row.program_id, paused: row.paused === 1 } : { programId: null, paused: false };
    },

    setActive(stoveId: string, { programId, paused }: ActiveProgram): void {
      if (programId === null) db.prepare("DELETE FROM active_programs WHERE stove_id = ?").run(stoveId);
      else
        db.prepare(
          `INSERT INTO active_programs (stove_id, program_id, paused) VALUES (?, ?, ?)
           ON CONFLICT (stove_id) DO UPDATE SET program_id = excluded.program_id, paused = excluded.paused`,
        ).run(stoveId, programId, paused ? 1 : 0);
    },
  };
}
