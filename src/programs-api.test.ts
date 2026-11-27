import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";
import { openDatabase } from "./db.ts";
import { createUser } from "./auth.ts";
import { createCore } from "./core/core.ts";
import { createFakeCloud } from "./cloud/fake-cloud.ts";
import { createFakeClock } from "./testing/fake-clock.ts";

const SECRET = "test-session-secret-at-least-32-chars!";

const WINTER = {
  name: "Inverno",
  dayGroups: [{ days: ["mon", "tue"], steps: [{ time: "22:00", off: true }, { time: "06:00", on: true, power: 3 }] }],
};

async function setup() {
  const db = openDatabase(":memory:");
  const core = createCore({ cloud: createFakeCloud([{ id: "s1", name: "Basement" }]), clock: createFakeClock(0) });
  await core.start();
  const app = createApp({ db, sessionSecret: SECRET, secureCookies: false, core });
  await createUser(db, "anna", "correct horse");
  const login = await app.request("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "anna", password: "correct horse" }),
  });
  const cookie = (login.headers.get("set-cookie") ?? "").split(";")[0];
  const call = async (method: string, path: string, body?: unknown) => {
    const res = await app.request(path, {
      method,
      headers: { cookie, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, json: res.status === 204 ? null : await res.json() };
  };
  return { call };
}

describe("programs API", () => {
  it("creates, lists, reads, edits and deletes Programs", async () => {
    const { call } = await setup();
    const created = await call("POST", "/api/programs", WINTER);
    expect(created.status).toBe(201);
    expect(created.json).toEqual({
      id: expect.any(Number),
      name: "Inverno",
      dayGroups: [{ days: ["mon", "tue"], steps: [{ time: "06:00", on: true, power: 3 }, { time: "22:00", off: true }] }],
    });
    const id = created.json.id;
    await call("POST", "/api/programs", { name: "Mezza stagione", dayGroups: [] });

    expect((await call("GET", "/api/programs")).json.map((p: { name: string }) => p.name)).toEqual(["Inverno", "Mezza stagione"]);
    expect((await call("GET", `/api/programs/${id}`)).json.name).toBe("Inverno");

    const edited = await call("PUT", `/api/programs/${id}`, { ...WINTER, name: "Inverno rigido" });
    expect(edited.status).toBe(200);
    expect((await call("GET", `/api/programs/${id}`)).json.name).toBe("Inverno rigido");

    expect((await call("DELETE", `/api/programs/${id}`)).status).toBe(204);
    expect((await call("GET", `/api/programs/${id}`)).status).toBe(404);
    expect((await call("GET", "/api/programs")).json).toHaveLength(1);
  });

  it("rejects an invalid Program with its problems, on create and on edit", async () => {
    const { call } = await setup();
    const bad = { name: "P", dayGroups: [{ days: ["mon"], steps: [{ time: "07:00", on: true }, { time: "07:15", off: true }] }] };
    const created = await call("POST", "/api/programs", bad);
    expect(created.status).toBe(400);
    expect(created.json.problems).toEqual([
      { code: "too_close", first: { day: "mon", time: "07:00" }, second: { day: "mon", time: "07:15" }, minGap: 30 },
    ]);
    const { json } = await call("POST", "/api/programs", WINTER);
    expect((await call("PUT", `/api/programs/${json.id}`, bad)).status).toBe(400);
    expect((await call("GET", `/api/programs/${json.id}`)).json.name).toBe("Inverno");
  });

  it("activates a Program for a Stove, pauses and resumes it", async () => {
    const { call } = await setup();
    expect((await call("GET", "/api/stoves/s1/active-program")).json).toEqual({ programId: null, paused: false });

    const { json: program } = await call("POST", "/api/programs", WINTER);
    expect((await call("PUT", "/api/stoves/s1/active-program", { programId: program.id })).json).toEqual({
      programId: program.id,
      paused: false,
    });
    expect((await call("PUT", "/api/stoves/s1/active-program", { programId: program.id, paused: true })).json.paused).toBe(true);
    expect((await call("GET", "/api/stoves/s1/active-program")).json).toEqual({ programId: program.id, paused: true });
    expect((await call("PUT", "/api/stoves/s1/active-program", { programId: program.id, paused: false })).json.paused).toBe(false);

    expect((await call("PUT", "/api/stoves/s1/active-program", { programId: null })).json.programId).toBeNull();
  });

  it("clears the Active Program when its Program is deleted", async () => {
    const { call } = await setup();
    const { json: program } = await call("POST", "/api/programs", WINTER);
    await call("PUT", "/api/stoves/s1/active-program", { programId: program.id });
    await call("DELETE", `/api/programs/${program.id}`);
    expect((await call("GET", "/api/stoves/s1/active-program")).json).toEqual({ programId: null, paused: false });
  });

  it("refuses an unknown Stove or Program", async () => {
    const { call } = await setup();
    expect((await call("PUT", "/api/stoves/nope/active-program", { programId: null })).status).toBe(404);
    expect((await call("PUT", "/api/stoves/s1/active-program", { programId: 999 })).status).toBe(404);
    expect((await call("PUT", "/api/programs/999", WINTER)).status).toBe(404);
  });
});
