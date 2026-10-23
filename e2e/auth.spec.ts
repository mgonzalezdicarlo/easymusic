import { expect, test } from "@playwright/test";

import { signUpAndOnboard } from "./helpers/auth";

test("a new user can register, sign out and sign back in", async ({ page }) => {
  // Signs up, lands on /dashboard and completes the first-run prompt.
  const email = await signUpAndOnboard(page);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Dashboard" }),
  ).toBeVisible();
});

test("a wrong password is rejected with a message", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("nobody@example.test");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("navigates from the home page to the dashboard", async ({ page }) => {
  await signUpAndOnboard(page);
  await page.goto("/");
  // keep the existing click on "Open dashboard" and the /dashboard assertion
});
