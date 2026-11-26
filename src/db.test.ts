import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { installationId, openDatabase } from "./db.ts";

const dirs: string[] = [];
afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

describe("installation id", () => {
  it("stays the same across restarts", () => {
    const dir = mkdtempSync(join(tmpdir(), "fuochista-"));
    dirs.push(dir);
    const path = join(dir, "test.db");
    const first = openDatabase(path);
    const id = installationId(first);
    expect(installationId(first)).toBe(id);
    first.close();
    const second = openDatabase(path);
    expect(installationId(second)).toBe(id);
    second.close();
  });

  it("differs between installations", () => {
    expect(installationId(openDatabase(":memory:"))).not.toBe(installationId(openDatabase(":memory:")));
  });
});
