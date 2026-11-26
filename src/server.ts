import { serve } from "@hono/node-server";
import { createApp } from "./app.ts";
import { loadConfig, loadEnvFile } from "./config.ts";
import { openDatabase } from "./db.ts";

loadEnvFile();

const config = loadConfig();
const db = openDatabase(config.databasePath);
const app = createApp({ db, sessionSecret: config.sessionSecret, secureCookies: config.secureCookies });

serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  console.log(`fuochista listening on :${port}`);
});
