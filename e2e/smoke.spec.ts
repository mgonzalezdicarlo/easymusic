import { expect, test } from "@playwright/test";

import { signUpAndOnboard } from "./helpers/auth";

test.describe("smoke", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: "Piano Habit Tracker" }),
    ).toBeVisible();
  });

  test("navigates from the home page to the dashboard", async ({ page }) => {
    await signUpAndOnboard(page);
    await page.goto("/");
    await page.getByRole("link", { name: "Open dashboard" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeVisible();
  });
});
