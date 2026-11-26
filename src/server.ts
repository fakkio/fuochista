import { randomUUID } from "node:crypto";
import { serve } from "@hono/node-server";
import { createApp } from "./app.ts";
import { loadConfig, loadEnvFile } from "./config.ts";
import { openDatabase } from "./db.ts";
import { createAguaClient } from "./cloud/agua-client.ts";
import { createFakeCloud } from "./cloud/fake-cloud.ts";
import { createCore } from "./core/core.ts";
import { systemClock } from "./core/clock.ts";

loadEnvFile();

const config = loadConfig();
const db = openDatabase(config.databasePath);
const cloud =
  config.cloud.kind === "fake"
    ? createFakeCloud()
    : createAguaClient({ email: config.cloud.email, password: config.cloud.password, appId: randomUUID() });
const core = createCore({ cloud, clock: systemClock });
await core.start();
const app = createApp({ db, sessionSecret: config.sessionSecret, secureCookies: config.secureCookies, core });

serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  console.log(`fuochista listening on :${port} (${config.cloud.kind} cloud)`);
});
