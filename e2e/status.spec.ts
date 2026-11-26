import { expect, test } from "@playwright/test";
import { E2E_USER } from "./user.ts";

test("shows the Stove status read from the fake cloud, and refreshes it", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Utente").fill(E2E_USER.username);
  await page.getByLabel("Password").fill(E2E_USER.password);
  await page.getByRole("button", { name: "Accedi" }).click();
  await expect(page).toHaveURL(/\/$/);

  // The fake cloud's Stove starts off, power 3, fan 3, setpoint 70 °C, water at 40 °C.
  const status = page.getByRole("region", { name: "Stufa" });
  await expect(status.getByTestId("state")).toHaveText("Spenta");
  await expect(status.getByTestId("power")).toHaveText("3");
  await expect(status.getByTestId("fan")).toHaveText("3");
  await expect(status.getByTestId("water-setpoint")).toHaveText("70 °C");
  await expect(status.getByTestId("water-temperature")).toHaveText("40 °C");
  await expect(status.getByTestId("read-at")).toHaveText(/\d{2}:\d{2}:\d{2}/);

  const refresh = page.waitForResponse((r) => r.url().endsWith("/refresh") && r.ok());
  await page.getByRole("button", { name: "Aggiorna" }).click();
  await refresh;
  await expect(status.getByTestId("state")).toHaveText("Spenta");
});
