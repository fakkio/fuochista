import { defineConfig, devices } from "@playwright/test";
import { E2E_USER } from "./e2e/user.ts";

const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: `http://localhost:${PORT}`, ...devices["Pixel 7"] },
  webServer: {
    // Seeds a fresh database through the real CLI, then starts the real service.
    command: `node e2e/reset-db.ts && node src/cli/create-user.ts ${E2E_USER.username} && node src/server.ts`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: false,
    env: {
      PORT: String(PORT),
      DATABASE_PATH: "test-results/e2e.db",
      SESSION_SECRET: "e2e-session-secret-at-least-32-characters",
      SECURE_COOKIES: "false",
      FUOCHISTA_PASSWORD: E2E_USER.password,
    },
  },
});
