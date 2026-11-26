import { expect, type Page } from "@playwright/test";

export const E2E_USER = { username: "anna", password: "correct horse" };

/** Opens the app logged out and logs in through the login page. */
export async function logIn(page: Page, password = E2E_USER.password) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Utente").fill(E2E_USER.username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Accedi" }).click();
}
