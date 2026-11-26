import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";
import { openDatabase } from "./db.ts";
import { createUser } from "./auth.ts";
import { createCore } from "./core/core.ts";
import { createFakeCloud } from "./cloud/fake-cloud.ts";
import { createFakeClock } from "./testing/fake-clock.ts";

const SECRET = "test-session-secret-at-least-32-chars!";
const T0 = Date.parse("2026-11-27T08:00:00Z");

async function setup() {
  const db = openDatabase(":memory:");
  const cloud = createFakeCloud([{ id: "s1", name: "Basement" }]);
  const clock = createFakeClock(T0);
  const core = createCore({ cloud, clock });
  await core.start();
  const app = createApp({ db, sessionSecret: SECRET, secureCookies: false, core });
  await createUser(db, "anna", "correct horse");
  const res = await app.request("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "anna", password: "correct horse" }),
  });
  const cookie = (res.headers.get("set-cookie") ?? "").split(";")[0];
  return { app, cloud, clock, cookie };
}

describe("stoves API", () => {
  it("lists the Stoves with their last status", async () => {
    const { app, cookie } = await setup();
    const res = await app.request("/api/stoves", { headers: { cookie } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      {
        id: "s1",
        name: "Basement",
        state: "off",
        power: 3,
        fan: 3,
        waterSetpoint: 70,
        waterTemperature: 40,
        readAt: "2026-11-27T08:00:00.000Z",
        error: null,
      },
    ]);
  });

  it("refreshes a Stove on demand", async () => {
    const { app, cloud, clock, cookie } = await setup();
    await clock.advance(60_000);
    cloud.setState("s1", { statusCode: 4, power: 5 });
    const res = await app.request("/api/stoves/s1/refresh", { method: "POST", headers: { cookie } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ state: "on", power: 5, readAt: "2026-11-27T08:01:00.000Z" });
    expect(cloud.reads("s1")).toBe(2);
  });

  it("answers 404 for an unknown Stove and 401 without a session", async () => {
    const { app, cookie } = await setup();
    expect((await app.request("/api/stoves/nope/refresh", { method: "POST", headers: { cookie } })).status).toBe(404);
    expect((await app.request("/api/stoves")).status).toBe(401);
  });
});
