import { expect, test } from "@playwright/test";
import { logIn } from "./user.ts";

test("creates a Program, fails validation, activates it and pauses it", async ({ page }) => {
  await logIn(page);
  const programs = page.getByRole("region", { name: "Programmi" });
  await programs.getByRole("button", { name: "Nuovo programma" }).click();

  const editor = page.getByRole("form", { name: "Programma" });
  await editor.getByLabel("Nome").fill("Inverno e2e");
  const group = editor.getByRole("group", { name: "Gruppo 1" });
  for (const day of ["Lun", "Mar", "Mer"]) await group.getByLabel(day, { exact: true }).check();

  await group.getByRole("button", { name: "Aggiungi passo" }).click();
  const first = group.getByRole("group", { name: "Passo 1" });
  await first.getByLabel("Ora").fill("06:00");
  await first.getByLabel("Azione").selectOption({ label: "Accendi" });
  await first.getByLabel("Potenza").fill("3");

  await group.getByRole("button", { name: "Aggiungi passo" }).click();
  const second = group.getByRole("group", { name: "Passo 2" });
  await second.getByLabel("Ora").fill("06:20");
  await second.getByLabel("Azione").selectOption({ label: "Spegni" });

  await editor.getByRole("button", { name: "Salva" }).click();
  await expect(editor.getByRole("alert")).toContainText("almeno 30 minuti");

  await second.getByLabel("Ora").fill("22:00");
  await editor.getByRole("button", { name: "Salva" }).click();
  await expect(editor).toBeHidden();

  const item = programs.getByRole("listitem").filter({ hasText: "Inverno e2e" });
  await expect(item).toBeVisible();
  await item.getByRole("button", { name: "Attiva" }).click();
  await expect(programs.getByTestId("active-program")).toHaveText("Attivo: Inverno e2e");

  await programs.getByRole("button", { name: "Metti in pausa" }).click();
  await expect(programs.getByTestId("active-program")).toHaveText("Attivo: Inverno e2e (in pausa)");
  await page.reload();
  await expect(programs.getByTestId("active-program")).toHaveText("Attivo: Inverno e2e (in pausa)");
  await programs.getByRole("button", { name: "Riprendi" }).click();
  await expect(programs.getByTestId("active-program")).toHaveText("Attivo: Inverno e2e");
});
