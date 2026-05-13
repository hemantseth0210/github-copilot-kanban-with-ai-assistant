import { expect, test } from "@playwright/test";

test("renders the seeded board", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Launch Kanban" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Rename Backlog column" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sketch onboarding flow" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Seed demo data" })).toBeVisible();
});

test("adds, renames, deletes, and drags cards", async ({ page }) => {
  await page.goto("/");

  const backlogTitle = page.getByRole("textbox", { name: "Rename Backlog column" });
  await backlogTitle.fill("Ideas");
  await expect(page.getByRole("textbox", { name: "Rename Ideas column" })).toHaveValue(
    "Ideas",
  );

  await page.getByRole("textbox", { name: "New Ideas card title" }).fill("Tighten demo");
  await page
    .getByRole("textbox", { name: "New Ideas card details" })
    .fill("Make the board feel ready.");
  await page.getByRole("button", { name: "Add card" }).first().click();
  await expect(page.getByRole("heading", { name: "Tighten demo" })).toBeVisible();

  await page.getByRole("button", { name: "Delete Tighten demo" }).click();
  await expect(page.getByRole("heading", { name: "Tighten demo" })).toBeHidden();

  const handle = page.getByRole("button", { name: "Move Sketch onboarding flow" });
  const target = page.getByTestId("column-review");
  const handleBox = await handle.boundingBox();
  const targetBox = await target.boundingBox();

  expect(handleBox).not.toBeNull();
  expect(targetBox).not.toBeNull();

  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + 24);
  await page.mouse.down();
  await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + 180, {
    steps: 12,
  });
  await page.mouse.up();

  await expect(target.getByRole("heading", { name: "Sketch onboarding flow" })).toBeVisible();
});
