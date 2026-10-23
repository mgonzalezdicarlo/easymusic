import { expect, type Page } from "@playwright/test";

/** Creates a unique account through the UI, then completes the first-run prompt. */
export async function signUpAndOnboard(page: Page) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;

  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("button", { name: "Get started" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  return email;
}
