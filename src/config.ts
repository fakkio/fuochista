export interface Config {
  port: number;
  databasePath: string;
  sessionSecret: string;
  secureCookies: boolean;
}

/** Loads an optional `.env` file into the environment; without one, the environment alone is used. */
export function loadEnvFile(): void {
  try {
    process.loadEnvFile();
  } catch {
    // No .env file.
  }
}

/** Reads configuration from the environment only (entry points load an optional `.env` first). */
export function loadConfig({ requireSecret = true } = {}): Config {
  const sessionSecret = process.env.SESSION_SECRET ?? "";
  if (requireSecret && sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters");
  }
  return {
    port: Number(process.env.PORT ?? 3000),
    databasePath: process.env.DATABASE_PATH ?? "data/fuochista.db",
    sessionSecret,
    secureCookies: process.env.SECURE_COOKIES !== "false",
  };
}
