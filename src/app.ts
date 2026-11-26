import { Hono } from "hono";
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie";
import { serveStatic } from "@hono/node-server/serve-static";
import { authenticate, endSession, SESSION_TTL_SECONDS, sessionUser, startSession } from "./auth.ts";
import type { Database } from "./db.ts";
import { UnknownStoveError, type Core, type StoveView } from "./core/core.ts";

const COOKIE = "fuochista_session";
const PUBLIC_PATHS = new Set([
  "/login",
  "/login.js",
  "/style.css",
  "/manifest.webmanifest",
  "/sw.js",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/api/login",
]);

const MAX_LOGIN_FAILURES = 10;
const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;

export interface AppOptions {
  db: Database;
  sessionSecret: string;
  secureCookies?: boolean;
  publicDir?: string;
  core?: Core;
}

/** The API shape of a Stove's status: flat, with ISO times. */
function stoveJson(v: StoveView) {
  const r = v.reading;
  return {
    id: v.id,
    name: v.name,
    state: r?.state ?? null,
    power: r?.power ?? null,
    fan: r?.fan ?? null,
    waterSetpoint: r?.waterSetpoint ?? null,
    waterTemperature: r?.waterTemperature ?? null,
    readAt: v.readAt === null ? null : new Date(v.readAt).toISOString(),
    error: v.error,
  };
}

type Env = { Variables: { username: string } };

export function createApp({ db, sessionSecret, secureCookies = true, publicDir = "public", core }: AppOptions) {
  const app = new Hono<Env>();
  // Failed logins per username, in memory: a restart resets them, which is fine at this scale.
  const loginFailures = new Map<string, number[]>();

  app.use("*", async (c, next) => {
    if (PUBLIC_PATHS.has(c.req.path)) return next();
    const token = await getSignedCookie(c, sessionSecret, COOKIE);
    const user = token ? sessionUser(db, token) : null;
    if (!user) {
      return c.req.path.startsWith("/api/") ? c.json({ error: "unauthorized" }, 401) : c.redirect("/login");
    }
    c.set("username", user.username);
    return next();
  });

  app.post("/api/login", async (c) => {
    const body: unknown = await c.req.json().catch(() => ({}));
    const { username, password } = (body ?? {}) as { username?: unknown; password?: unknown };
    if (typeof username !== "string" || typeof password !== "string") {
      return c.json({ error: "invalid credentials" }, 401);
    }
    const now = Date.now();
    const recent = (loginFailures.get(username) ?? []).filter((t) => now - t < LOGIN_FAILURE_WINDOW_MS);
    if (recent.length >= MAX_LOGIN_FAILURES) return c.json({ error: "too many attempts" }, 429);
    const userId = await authenticate(db, username, password);
    if (userId === null) {
      loginFailures.set(username, [...recent, now]);
      return c.json({ error: "invalid credentials" }, 401);
    }
    loginFailures.delete(username);
    await setSignedCookie(c, COOKIE, startSession(db, userId), sessionSecret, {
      httpOnly: true,
      secure: secureCookies,
      sameSite: "Lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return c.json({ username });
  });

  app.post("/api/logout", async (c) => {
    const token = await getSignedCookie(c, sessionSecret, COOKIE);
    if (token) endSession(db, token);
    deleteCookie(c, COOKIE, { path: "/" });
    return c.body(null, 204);
  });

  app.get("/api/me", (c) => c.json({ username: c.get("username") }));

  if (core) {
    app.get("/api/stoves", (c) => c.json(core.stoves().map(stoveJson)));

    app.post("/api/stoves/:id/refresh", async (c) => {
      try {
        return c.json(stoveJson(await core.refresh(c.req.param("id"))));
      } catch (err) {
        if (err instanceof UnknownStoveError) return c.json({ error: "unknown stove" }, 404);
        throw err;
      }
    });
  }

  app.all("/api/*", (c) => c.json({ error: "not found" }, 404));

  app.get("/login", serveStatic({ path: `${publicDir}/login.html` }));
  app.get("/", serveStatic({ path: `${publicDir}/index.html` }));
  app.use("*", serveStatic({ root: publicDir }));

  return app;
}
