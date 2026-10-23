import { expect, test } from "@playwright/test";

const protectedPaths = [
  "/dashboard",
  "/scales",
  "/exercises",
  "/analytics",
  "/settings",
];

for (const path of protectedPaths) {
  test(`redirects ${path} to sign-in when signed out`, async ({ page }) => {
    await page.goto(path);

    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Sign in" }),
    ).toBeVisible();
  });
}

test("keeps the auth pages public", async ({ page }) => {
  await page.goto("/sign-up");

  await expect(page).toHaveURL(/\/sign-up$/);
});
