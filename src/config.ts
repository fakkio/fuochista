export interface Config {
  port: number;
  databasePath: string;
  sessionSecret: string;
  secureCookies: boolean;
  /** Where Stove status comes from: the Klover cloud, or the in-memory fake (tests, local development). */
  cloud: { kind: "klover"; email: string; password: string } | { kind: "fake" };
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
export function loadConfig({ requireSecret = true, requireCloud = true } = {}): Config {
  const sessionSecret = process.env.SESSION_SECRET ?? "";
  if (requireSecret && sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters");
  }
  const email = process.env.KLOVER_EMAIL ?? "";
  const password = process.env.KLOVER_PASSWORD ?? "";
  const fake = process.env.FAKE_CLOUD === "true";
  if (requireCloud && !fake && (!email || !password)) {
    throw new Error("KLOVER_EMAIL and KLOVER_PASSWORD must be set (or FAKE_CLOUD=true for development)");
  }
  return {
    port: Number(process.env.PORT ?? 3000),
    databasePath: process.env.DATABASE_PATH ?? "data/fuochista.db",
    sessionSecret,
    secureCookies: process.env.SECURE_COOKIES !== "false",
    cloud: fake ? { kind: "fake" } : { kind: "klover", email, password },
  };
}
