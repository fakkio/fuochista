import { createUser } from "../auth.ts";
import { openDatabase } from "../db.ts";
import { loadConfig, loadEnvFile } from "../config.ts";

async function readPassword(): Promise<string> {
  if (process.env.FUOCHISTA_PASSWORD) return process.env.FUOCHISTA_PASSWORD;
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");
}

loadEnvFile();
const username = process.argv[2];
if (!username) {
  console.error("usage: npm run create-user -- <username>   (password from stdin or FUOCHISTA_PASSWORD)");
  process.exit(1);
}
const db = openDatabase(loadConfig({ requireSecret: false }).databasePath);
try {
  await createUser(db, username, await readPassword());
  console.log(`user "${username.trim()}" created`);
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}
