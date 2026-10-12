import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("intelligence filters, persists watchlist, and exports the visible collection", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator("nav")
    .getByRole("button", { name: "Threat intelligence", exact: true })
    .click();
  await expect(page.locator(".intel-table tbody tr")).toHaveCount(7);
  await page.getByLabel("Indicator type").selectOption("Domain");
  await expect(page.locator(".intel-table tbody tr")).toHaveCount(3);
  await page.getByLabel("Search indicators").fill("invoice");
  await expect(page.locator(".intel-table tbody tr")).toHaveCount(1);
  await page
    .getByRole("button", { name: "invoice-review.example Domain", exact: true })
    .click();
  await expect(page.locator(".intel-detail-value")).toContainText(
    "invoice-review.example",
  );
  await page
    .getByRole("button", { name: "Add to watchlist", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Remove from watchlist", exact: true }),
  ).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "Export visible indicators as JSON",
      exact: true,
    })
    .click();
  const download = await downloadEvent;
  const artifact = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(artifact.liveFeed).toBe(false);
  expect(artifact.indicators).toHaveLength(1);
  expect(artifact.indicators[0]).toMatchObject({
    value: "invoice-review.example",
    watched: true,
  });
  await page.reload();
  await page
    .locator("nav")
    .getByRole("button", { name: "Threat intelligence", exact: true })
    .click();
  await page.getByRole("button", { name: "Watchlist 1", exact: true }).click();
  await expect(page.locator(".intel-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".intel-table tbody")).toContainText(
    "invoice-review.example",
  );
  await page
    .getByRole("button", { name: /invoice-review.example Domain/ })
    .click();
  await page
    .getByRole("button", { name: "Remove from watchlist", exact: true })
    .click();
  await expect(
    page.getByText("No matching indicators", { exact: true }),
  ).toBeVisible();
});

test("travel hypothesis validates inputs and distinguishes anomaly from compromise", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator("nav")
    .getByRole("button", { name: "VPN tracker", exact: true })
    .click();
  await expect(page.locator(".vpn-speed-result")).toContainText(
    "Exceeds policy threshold",
  );
  await expect(page.locator(".vpn-analysis")).toContainText(
    "geolocation database discrepancy",
  );
  await expect(page.locator(".vpn-analysis")).toContainText("device");
  await page.getByLabel("Minutes between sign-ins").fill("600");
  await expect(page.locator(".vpn-speed-result")).toContainText("711");
  await expect(page.locator(".vpn-speed-result")).toContainText(
    "Within threshold",
  );
  await page
    .getByLabel("Travel speed threshold in kilometers per hour")
    .fill("500");
  await expect(page.locator(".vpn-speed-result")).toContainText(
    "Exceeds policy threshold",
  );
  await page.getByLabel("Minutes between sign-ins").fill("0");
  await expect(page.locator(".vpn-speed-result")).toContainText(
    "CHECK YOUR INPUTS",
  );
  await page.getByLabel("Minutes between sign-ins").fill("2.15");
  await page.getByLabel("Travel distance in kilometers").fill("");
  await expect(page.locator(".vpn-speed-result")).toContainText(
    "CHECK YOUR INPUTS",
  );
});

test("VPN session investigation exports context and persists explicit demo revocation", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator("nav")
    .getByRole("button", { name: "VPN tracker", exact: true })
    .click();
  await page.getByLabel("Search VPN sign-ins").fill("alex");
  await expect(page.locator(".vpn-table tbody tr")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Investigate session", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Alex Morgan's remote session",
  });
  await expect(dialog).toContainText(
    "This pattern does not establish a stolen session.",
  );
  const downloadEvent = page.waitForEvent("download");
  await dialog
    .getByRole("button", { name: "Export investigation note", exact: true })
    .click();
  const artifact = JSON.parse(
    await readFile((await (await downloadEvent).path())!, "utf8"),
  );
  expect(artifact.externalActionTaken).toBe(false);
  expect(artifact.selectedSignIn.session).toBe("SES-9A21");
  await dialog
    .getByRole("button", { name: "Revoke session (demo)", exact: true })
    .click();
  await expect(
    dialog.getByRole("button", {
      name: "Session marked revoked (demo)",
      exact: true,
    }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.locator(".vpn-table tbody .vpn-outcome.revoked"),
  ).toHaveCount(2);
  await page.reload();
  await page
    .locator("nav")
    .getByRole("button", { name: "VPN tracker", exact: true })
    .click();
  await page
    .getByLabel("Filter VPN sign-ins by outcome")
    .selectOption("Revoked (demo)");
  await expect(page.locator(".vpn-table tbody tr")).toHaveCount(2);
});

test("intelligence and VPN pages keep their content within the mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const route of ["Threat intelligence", "VPN tracker"]) {
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
    await page
      .locator("nav")
      .getByRole("button", { name: route, exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
