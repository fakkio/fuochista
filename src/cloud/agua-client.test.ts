import { describe, expect, it } from "vitest";
import { createAguaClient, evaluateFormula } from "./agua-client.ts";
import registersMap from "./fixtures/registers-map.json" with { type: "json" };
import bufferReadingJob from "./fixtures/buffer-reading-job.json" with { type: "json" };

// The M0 spike saved the register map and one buffer read (stove ON, power 5, fan 0,
// setpoint 70, water 69). Login and device-list responses were not recorded; the ones
// below follow py-agua-iot's shapes with made-up ids.
function jwt(exp: number) {
  const part = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${part({ alg: "none" })}.${part({ exp })}.sig`;
}

interface Call {
  path: string;
  body: unknown;
  headers: Record<string, string>;
}

function fakeAgua({ pendingPolls = 2, devices = ["dev-a"], tokenLifetimeS = 3600 } = {}) {
  const calls: Call[] = [];
  let polls = 0;
  /** Paths that answer 401 once (an expired session), or fail at the network level. */
  const unauthorizedOnce = new Set<string>();
  const unreachable = new Set<string>();
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  const fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ path: url.pathname, body, headers: init?.headers as Record<string, string> });
    if (unreachable.has(url.pathname)) throw new TypeError("fetch failed");
    if (unauthorizedOnce.delete(url.pathname)) return reply(401, {});
    switch (url.pathname) {
      case "/appSignup":
        return reply(201, {});
      case "/userLogin":
        return body.password === "secret"
          ? reply(200, { token: jwt(Date.now() / 1000 + tokenLifetimeS), refresh_token: "r" })
          : reply(401, {});
      case "/refreshToken":
        return reply(201, { token: jwt(Date.now() / 1000 + 3600) });
      case "/deviceList":
        return reply(200, {
          device: devices.map((id, i) => ({
            id: i,
            id_device: id,
            id_product: `prod-${id}`,
            product_serial: "x",
            name: `Stove ${id}`,
            is_online: true,
            name_product: "STYLE 180 - SL180",
          })),
        });
      case "/deviceGetInfo":
        return reply(200, { device_info: [{ id_registers_map: "map-0" }] });
      case "/deviceGetRegistersMap":
        return reply(200, registersMap);
      case "/deviceGetBufferReading":
        polls = 0;
        return reply(200, { idRequest: "job-1" });
      case "/deviceJobStatus/job-1":
        return polls++ < pendingPolls ? reply(200, { jobAnswerStatus: "pending" }) : reply(200, bufferReadingJob);
    }
    return reply(404, {});
  };
  return { fetch, calls, devices, unauthorizedOnce, unreachable };
}

function client(fake: ReturnType<typeof fakeAgua>, password = "secret") {
  return createAguaClient({
    email: "someone@example.com",
    password,
    appId: "app-id",
    fetch: fake.fetch,
    sleep: async () => {},
  });
}

describe("Agua IOT cloud client", () => {
  it("lists the account's Stoves", async () => {
    const fake = fakeAgua({ devices: ["dev-a", "dev-b"] });
    expect(await client(fake).listStoves()).toEqual([
      { id: "dev-a", name: "Stove dev-a" },
      { id: "dev-b", name: "Stove dev-b" },
    ]);
  });

  it("reads and decodes the Stove's status, polling the job until it completes", async () => {
    const fake = fakeAgua({ pendingPolls: 3 });
    const status = await client(fake).readStatus("dev-a");
    expect(status).toEqual({
      state: "on",
      statusCode: 4,
      alarmCode: 0,
      power: 5,
      fan: 0,
      waterSetpoint: 70,
      waterTemperature: 69,
    });
    expect(fake.calls.filter((c) => c.path === "/deviceJobStatus/job-1")).toHaveLength(4);
    expect(fake.calls.find((c) => c.path === "/deviceGetBufferReading")?.body).toEqual({
      id_device: "dev-a",
      id_product: "prod-dev-a",
      BufferId: 1,
    });
  });

  it("sends the Klover brand headers and the token", async () => {
    const fake = fakeAgua();
    await client(fake).readStatus("dev-a");
    const read = fake.calls.find((c) => c.path === "/deviceGetBufferReading")!;
    expect(read.headers).toMatchObject({ customer_code: "143789", id_brand: "1", local: "false" });
    expect(read.headers.Authorization).toMatch(/^[\w-]+\.[\w-]+\./);
  });

  it("caches the register map and the login across reads", async () => {
    const fake = fakeAgua();
    const c = client(fake);
    await c.readStatus("dev-a");
    await c.readStatus("dev-a");
    await c.readStatus("dev-a");
    const count = (p: string) => fake.calls.filter((call) => call.path === p).length;
    expect(count("/deviceGetRegistersMap")).toBe(1);
    expect(count("/userLogin")).toBe(1);
    expect(count("/deviceGetBufferReading")).toBe(3);
  });

  it("renews an expiring token without logging in again", async () => {
    const fake = fakeAgua({ tokenLifetimeS: 30 }); // inside the renewal margin
    const c = client(fake);
    await c.readStatus("dev-a");
    await c.readStatus("dev-a");
    const count = (p: string) => fake.calls.filter((call) => call.path === p).length;
    expect(count("/userLogin")).toBe(1);
    expect(count("/refreshToken")).toBeGreaterThan(0);
  });

  it("renews the session and retries once when the cloud answers 401", async () => {
    const fake = fakeAgua();
    const c = client(fake);
    await c.readStatus("dev-a");
    fake.unauthorizedOnce.add("/deviceGetBufferReading");
    expect((await c.readStatus("dev-a")).state).toBe("on");
    expect(fake.calls.filter((call) => call.path === "/refreshToken")).toHaveLength(1);
  });

  it("signs the installation up once, even when it has to log in again", async () => {
    const fake = fakeAgua({ tokenLifetimeS: 30 });
    fake.unauthorizedOnce.add("/refreshToken"); // a refused renewal forces a new login
    await client(fake).readStatus("dev-a");
    expect(fake.calls.filter((call) => call.path === "/userLogin")).toHaveLength(2);
    expect(fake.calls.filter((call) => call.path === "/appSignup")).toHaveLength(1);
  });

  it("stops polling the job as soon as the cloud is unreachable", async () => {
    const fake = fakeAgua({ pendingPolls: 5 });
    fake.unreachable.add("/deviceJobStatus/job-1");
    await expect(client(fake).readStatus("dev-a")).rejects.toThrow(/unreachable/);
    expect(fake.calls.filter((call) => call.path === "/deviceJobStatus/job-1")).toHaveLength(1);
  });

  it("finds a Stove added to the account after the first device list", async () => {
    const fake = fakeAgua();
    const c = client(fake);
    expect(await c.listStoves()).toHaveLength(1);
    fake.devices.push("dev-b");
    expect((await c.readStatus("dev-b")).state).toBe("on");
    expect((await c.listStoves()).map((s) => s.id)).toEqual(["dev-a", "dev-b"]);
  });

  it("fails when the job never completes", async () => {
    const fake = fakeAgua({ pendingPolls: 1000 });
    await expect(client(fake).readStatus("dev-a")).rejects.toThrow(/job/i);
  });

  it("fails on wrong credentials", async () => {
    await expect(client(fakeAgua(), "wrong").readStatus("dev-a")).rejects.toThrow(/login/i);
  });

  it("evaluates the register map's formulas", () => {
    // Formulas found in the M0 map: identity, the buffer tank's halving, the calendar year.
    expect(evaluateFormula("#", 69)).toBe(69);
    expect(evaluateFormula("#/2", 141)).toBe(70);
    expect(evaluateFormula("#+2000", 26)).toBe(2026);
    expect(evaluateFormula("#*2", 35)).toBe(70);
    expect(evaluateFormula("#-2000", 2026)).toBe(26);
  });

  it("fails for an unknown Stove", async () => {
    await expect(client(fakeAgua()).readStatus("nope")).rejects.toThrow(/unknown stove/i);
  });
});
