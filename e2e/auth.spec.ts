import { expect, test } from "@playwright/test";
import { E2E_USER } from "./user.ts";

async function logIn(page: import("@playwright/test").Page, password = E2E_USER.password) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Utente").fill(E2E_USER.username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Accedi" }).click();
}

test("logs in, survives a browser restart, and logs out", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await logIn(page);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("#greeting")).toHaveText(E2E_USER.username);

  // "Closing the browser": a new context with the persisted cookies only.
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === "fuochista_session")?.expires).toBeGreaterThan(Date.now() / 1000);
  await context.close();
  const reopened = await browser.newContext({ storageState: { cookies, origins: [] } });
  const again = await reopened.newPage();
  await again.goto("/");
  await expect(again.locator("#greeting")).toHaveText(E2E_USER.username);

  await again.getByRole("button", { name: "Esci" }).click();
  await expect(again).toHaveURL(/\/login$/);
  await again.goto("/");
  await expect(again).toHaveURL(/\/login$/);
  await reopened.close();
});

test("refuses wrong credentials", async ({ page }) => {
  await logIn(page, "wrong");
  await expect(page.getByRole("alert")).toHaveText("Utente o password non validi");
  await expect(page).toHaveURL(/\/login$/);
});

test("is an installable PWA", async ({ page }) => {
  await page.goto("/login");
  const manifest = await (await page.request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({ name: "Fuochista", start_url: "/", display: "standalone" });
  for (const size of ["192x192", "512x512"]) {
    const icon = manifest.icons.find((i: { sizes: string }) => i.sizes === size);
    expect((await page.request.get(icon.src)).headers()["content-type"]).toBe("image/png");
  }
  const registered = await page.evaluate(async () => !!(await navigator.serviceWorker.ready).active);
  expect(registered).toBe(true);
});
