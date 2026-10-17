import { expect, test } from "@playwright/test";

// Browser zoom reduces the available CSS viewport, just like a shorter window.
const viewports = [
  { width: 1440, height: 900 },
  { width: 1366, height: 650 },
  { width: 1024, height: 576 },
  { width: 800, height: 450 },
  { width: 683, height: 384 },
  { width: 390, height: 568 },
  { width: 390, height: 320 },
  { width: 390, height: 240 },
];

for (const viewport of viewports) {
  test(`sidebar controls remain reachable at ${viewport.width}×${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const sidebar = page.locator(".sidebar");
    const profile = sidebar.locator(".profile");
    const navigation = sidebar.getByRole("navigation", {
      name: "Main navigation",
    });
    if (viewport.width <= 700) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      await expect
        .poll(async () => Math.round((await sidebar.boundingBox())!.x))
        .toBe(0);
    }

    // Common zoom/window sizes keep the footer visible without any scrolling.
    // Extremely short windows can scroll the whole sidebar as a fallback.
    if (viewport.height < 320) {
      // A wheel gesture at the end of navigation must reach the outer fallback,
      // rather than trapping the user above the footer in a tiny window.
      await navigation.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      const box = (await navigation.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, 500);
      await expect
        .poll(async () => {
          const footer = (await profile.boundingBox())!;
          return footer.y + footer.height;
        })
        .toBeLessThanOrEqual(viewport.height + 1);
    }
    const profileBox = (await profile.boundingBox())!;
    expect(profileBox.y).toBeGreaterThanOrEqual(0);
    expect(profileBox.y + profileBox.height).toBeLessThanOrEqual(
      viewport.height + 1,
    );
    await profile.click();
    await expect(
      page.getByRole("dialog", { name: "Workspace information" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    const terminal = navigation.getByRole("button", {
      name: "Terminal",
      exact: true,
    });
    await terminal.focus();
    await expect(terminal).toBeFocused();
    const terminalBox = (await terminal.boundingBox())!;
    const navBox = (await navigation.boundingBox())!;
    const footerBox = (await sidebar.locator(".sidebar-bottom").boundingBox())!;
    expect(terminalBox.y).toBeGreaterThanOrEqual(navBox.y - 1);
    expect(terminalBox.y + terminalBox.height).toBeLessThanOrEqual(
      navBox.y + navBox.height + 1,
    );
    expect(navBox.y + navBox.height).toBeLessThanOrEqual(footerBox.y + 1);
    await terminal.click();
    await expect(
      page.getByRole("heading", { name: "Parrot terminal", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
