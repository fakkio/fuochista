import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Database } from "./db.ts";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const KEY_LENGTH = 64;

export const SESSION_TTL_SECONDS = 365 * 24 * 3600;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, key] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "base64");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

// A fixed hash so unknown usernames cost the same time as wrong passwords.
const DUMMY_HASH = await hashPassword("unused-dummy-password");

/** Checks credentials; returns the user id, or null when they are wrong. */
export async function authenticate(db: Database, username: string, password: string): Promise<number | null> {
  const row = db.prepare("SELECT id, password_hash FROM users WHERE username = ?").get(username) as
    | { id: number; password_hash: string }
    | undefined;
  const ok = await verifyPassword(password, row?.password_hash ?? DUMMY_HASH);
  return row && ok ? row.id : null;
}

export async function createUser(db: Database, username: string, password: string): Promise<void> {
  const name = username.trim();
  if (!name || !password) throw new Error("username and password are required");
  const exists = db.prepare("SELECT 1 FROM users WHERE username = ?").get(name);
  if (exists) throw new Error(`user "${name}" already exists`);
  db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(name, await hashPassword(password));
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export function startSession(db: Database, userId: number, now = Date.now()): string {
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
  const token = randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(
    hashToken(token),
    userId,
    now + SESSION_TTL_SECONDS * 1000,
  );
  return token;
}

export function sessionUser(db: Database, token: string, now = Date.now()): { username: string } | null {
  const row = db
    .prepare(
      `SELECT u.username FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(hashToken(token), now) as { username: string } | undefined;
  return row ?? null;
}

export function endSession(db: Database, token: string): void {
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
}
