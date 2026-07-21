import { test, expect } from "@playwright/test";

test.describe("KAI v2 Overlay E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display welcome screen on fresh load", async ({ page }) => {
    await expect(page.locator("h2")).toHaveText("What can I help with?");
    await expect(page.locator("#prompt-input")).toBeVisible();
  });

  test("should enable send button when typing prompt", async ({ page }) => {
    const input = page.locator("#prompt-input");
    const sendBtn = page.locator("#send-btn");

    await expect(sendBtn).toBeDisabled();
    await input.fill("Hello KAI");
    await expect(sendBtn).toBeEnabled();
  });

  test("should open and close settings panel", async ({ page }) => {
    const settingsBtn = page.locator("#open-settings-btn");
    await settingsBtn.click();

    const panel = page.locator("#settings-panel");
    await expect(panel).toBeVisible();

    const closeBtn = page.locator("#close-settings");
    await closeBtn.click();
    await expect(panel).not.toBeAttached();
  });

  test("should switch tabs in settings panel", async ({ page }) => {
    await page.locator("#open-settings-btn").click();

    const personaTab = page.locator('button[data-tab="persona"]');
    await personaTab.click();

    const promptTextarea = page.locator("#setting-system-prompt");
    await expect(promptTextarea).toBeVisible();
  });

  test("should open and close history panel", async ({ page }) => {
    const historyBtn = page.locator("#chats-history-btn");
    await historyBtn.click();

    const panel = page.locator("#history-panel");
    await expect(panel).toBeVisible();

    const closeBtn = page.locator("#history-close");
    await closeBtn.click();
    await expect(panel).toHaveClass(/hidden/);
  });
});
