import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";
import { openDatabase } from "./db.ts";
import { createUser } from "./auth.ts";

const SECRET = "test-session-secret-at-least-32-chars!";

function setup() {
  const db = openDatabase(":memory:");
  const app = createApp({ db, sessionSecret: SECRET, secureCookies: false });
  return { db, app };
}

async function login(app: ReturnType<typeof setup>["app"], username: string, password: string) {
  return app.request("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

function cookieFrom(res: Response): string {
  const header = res.headers.get("set-cookie") ?? "";
  return header.split(";")[0];
}

describe("authentication", () => {
  it("a user created from the CLI can log in and reach the API", async () => {
    const { db, app } = setup();
    await createUser(db, "anna", "correct horse");

    const res = await login(app, "anna", "correct horse");
    expect(res.status).toBe(200);

    const me = await app.request("/api/me", { headers: { cookie: cookieFrom(res) } });
    expect(me.status).toBe(200);
    expect(await me.json()).toEqual({ username: "anna" });
  });

  it("refuses a wrong password and an unknown user", async () => {
    const { db, app } = setup();
    await createUser(db, "anna", "correct horse");

    expect((await login(app, "anna", "wrong")).status).toBe(401);
    expect((await login(app, "bob", "correct horse")).status).toBe(401);
  });

  it("issues a long-lived persistent session cookie", async () => {
    const { db, app } = setup();
    await createUser(db, "anna", "correct horse");

    const header = (await login(app, "anna", "correct horse")).headers.get("set-cookie") ?? "";
    const maxAge = Number(/Max-Age=(\d+)/i.exec(header)?.[1]);
    expect(maxAge).toBeGreaterThanOrEqual(180 * 24 * 3600);
    expect(header).toMatch(/HttpOnly/i);
  });

  it("protects API routes and pages without a session", async () => {
    const { app } = setup();

    expect((await app.request("/api/me")).status).toBe(401);
    const home = await app.request("/");
    expect(home.status).toBe(302);
    expect(home.headers.get("location")).toBe("/login");
    expect((await app.request("/login")).status).toBe(200);
  });

  it("logout ends the session", async () => {
    const { db, app } = setup();
    await createUser(db, "anna", "correct horse");
    const cookie = cookieFrom(await login(app, "anna", "correct horse"));

    const out = await app.request("/api/logout", { method: "POST", headers: { cookie } });
    expect(out.status).toBe(204);
    expect((await app.request("/api/me", { headers: { cookie } })).status).toBe(401);
  });

  it("has no sign-up endpoint", async () => {
    const { app } = setup();
    for (const path of ["/api/signup", "/api/register", "/api/users"]) {
      const res = await app.request(path, { method: "POST", body: "{}" });
      expect(res.status).not.toBe(200);
      expect(res.status).not.toBe(201);
    }
  });

  it("blocks login after repeated failures, even with the right password", async () => {
    const { db, app } = setup();
    await createUser(db, "anna", "correct horse");
    for (let i = 0; i < 10; i++) await login(app, "anna", "wrong");

    expect((await login(app, "anna", "correct horse")).status).toBe(429);
  });

  it("rejects creating the same username twice", async () => {
    const { db } = setup();
    await createUser(db, "anna", "correct horse");
    await expect(createUser(db, "anna", "other")).rejects.toThrow(/exists/);
    await expect(createUser(db, " anna ", "other")).rejects.toThrow(/exists/);
  });
});
