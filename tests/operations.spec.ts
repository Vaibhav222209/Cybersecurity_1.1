import { test, expect } from "@playwright/test";
test("dashboard renders, event filters and raw evidence work", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Command center", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Suspicious PowerShell execution", { exact: true }),
  ).toBeVisible();
  await page
    .locator("nav")
    .getByRole("button", { name: "Event stream", exact: true })
    .click();
  await page.getByLabel("Search security events").fill("PowerShell");
  await expect(page.locator(".full-table tbody tr")).toHaveCount(1);
  await page.locator(".full-table tbody tr").click();
  await expect(page.getByText("RAW EVENT", { exact: true })).toBeVisible();
  await expect(page.locator(".json-block")).toContainText("PowerShell");
  await page.getByLabel("Search security events").fill("nothing-exists-here");
  await expect(page.getByText("No matching events")).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator(".full-table tbody tr").first()).toBeVisible();
  expect(errors).toEqual([]);
});
test("real local assessment returns findings and permits export", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator("nav")
    .getByRole("button", { name: "Vulnerabilities", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Run assessment" }),
  ).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Run assessment" }).click();
  await expect(page.locator(".finding").first()).toBeVisible();
  await page.locator(".finding-heading").first().click();
  await expect(
    page.getByText("OBSERVED EVIDENCE", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".remediation")).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await page
    .locator(".assessment-results")
    .getByRole("button", { name: "Export", exact: true })
    .click();
  expect((await downloaded).suggestedFilename()).toMatch(/\.json$/);
});
test("scope rejects an unapproved external assessment", async ({ page }) => {
  await page.goto("/");
  await page
    .locator("nav")
    .getByRole("button", { name: "Vulnerabilities", exact: true })
    .click();
  await page
    .getByLabel("Target URL or IP address")
    .fill("https://unapproved.invalid");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Run assessment" }).click();
  await expect(page.getByRole("alert")).toContainText(
    /scope|authorized|allow/i,
  );
});
test("terminal performs a real check and rejects shell injection", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator("nav")
    .getByRole("button", { name: "Terminal", exact: true })
    .click();
  const input = page.getByLabel("Terminal command");
  await input.fill("tcp 127.0.0.1:4318");
  await input.press("Enter");
  await expect(page.locator(".terminal-entry").last()).toContainText("open");
  await input.fill("whoami; cat /etc/passwd");
  await input.press("Enter");
  await expect(page.locator(".terminal-entry").last()).toContainText(
    "not supported",
  );
  await input.fill("clear");
  await input.press("Enter");
  await expect(page.locator(".terminal-entry")).toHaveCount(0);
});
test("demo isolation is confirmed and recorded", async ({ page }) => {
  await page.goto("/");
  await page
    .locator("nav")
    .getByRole("button", { name: /^Incidents/ })
    .click();
  await page.getByRole("button", { name: /Asset inventory/ }).click();
  const row = page
    .locator(".full-table tbody tr")
    .filter({ hasText: "FIN-WS-042" });
  await expect(row).toBeVisible();
  if (
    await row
      .getByRole("button", { name: "Isolate (demo)", exact: true })
      .count()
  ) {
    await row
      .getByRole("button", { name: "Isolate (demo)", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      "does not disconnect a real device",
    );
    await page.getByRole("button", { name: "Isolate demo endpoint" }).click();
  }
  await expect(
    row.getByRole("button", { name: "Isolated", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /Investigations/ }).click();
  await expect(
    page.getByRole("button", { name: "Endpoint isolated", exact: true }),
  ).toBeDisabled();
});
test("mobile navigation and key screens remain within viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Command center", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .locator("nav")
    .getByRole("button", { name: "Terminal", exact: true })
    .click();
  await expect(page.locator(".terminal-window")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("imports local JSON logs and makes them searchable", async ({ page }) => {
  await page.goto("/");
  await page
    .locator("nav")
    .getByRole("button", { name: "Event stream", exact: true })
    .click();
  await page.getByRole("button", { name: "Import logs", exact: true }).click();
  const title = `Imported test event ${Date.now()}`;
  await page
    .getByLabel("JSON log events")
    .fill(
      JSON.stringify([
        {
          title,
          message: "Local test log ingestion evidence.",
          severity: "low",
          source: "Application test",
          ip: "192.0.2.10",
        },
      ]),
    );
  await page
    .getByRole("button", { name: "Import events", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Search security events").fill(title);
  await expect(page.locator(".full-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".full-table tbody tr")).toContainText(
    "Application test",
  );
});
test("exports workspace report with real assessment evidence", async ({
  page,
}) => {
  await page.goto("/");
  const pending = page.waitForEvent("download");
  await page.getByText("Export report", { exact: true }).click();
  const report = await pending;
  expect(report.suggestedFilename()).toMatch(/^aegis-report-.*\.json$/);
});
test("web proxy accepts same-host preview actions and preserves foreign-origin rejection", async ({
  request,
}) => {
  const accepted = await request.post("/api/terminal", {
    headers: { Host: "172.26.0.99:5173", Origin: "http://172.26.0.99:5173" },
    data: { command: "whoami" },
  });
  expect(accepted.status()).toBe(200);
  expect((await accepted.json()).output).toContain("analyst@aegis");
  const denied = await request.post("/api/terminal", {
    headers: { Origin: "https://foreign-origin.invalid" },
    data: { command: "whoami" },
  });
  expect(denied.status()).toBe(403);
});
