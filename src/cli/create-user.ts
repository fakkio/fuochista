import { createUser } from "../auth.ts";
import { openDatabase } from "../db.ts";
import { loadConfig, loadEnvFile } from "../config.ts";

/** Prompts on a terminal without echoing the typed characters. */
function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let password = "";
    const onData = (char: string) => {
      if (char === "\r" || char === "\n" || char === "\u0004") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.off("data", onData);
        process.stdout.write("\n");
        resolve(password);
      } else if (char === "\u0003") {
        process.stdout.write("\n");
        process.exit(130);
      } else if (char === "\u007f" || char === "\b") {
        password = password.slice(0, -1);
      } else {
        password += char;
      }
    };
    stdin.on("data", onData);
  });
}

async function readPassword(): Promise<string> {
  if (process.env.FUOCHISTA_PASSWORD) return process.env.FUOCHISTA_PASSWORD;
  if (process.stdin.isTTY) return promptHidden("Password: ");
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");
}

loadEnvFile();
const username = process.argv[2];
if (!username) {
  console.error("usage: npm run create-user -- <username>   (password prompted, piped on stdin, or FUOCHISTA_PASSWORD)");
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
