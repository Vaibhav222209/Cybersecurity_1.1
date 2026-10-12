import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function openLab(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Cyber lab", exact: true })
    .click();
  await expect(
    page.getByRole("tab", { name: /TCP handshake/ }),
  ).toHaveAttribute("aria-selected", "true");
}

test("TCP handshake exposes correct sequence and acknowledgment transitions", async ({
  page,
}) => {
  await openLab(page);
  await page.getByRole("button", { name: "Next packet" }).click();
  await expect(page.locator(".learn-code-block")).toContainText(
    "[SYN] seq=1000",
  );
  await expect(page.locator(".learn-endpoints")).toContainText("SYN-SENT");
  await page.getByRole("button", { name: "Next packet" }).click();
  await expect(page.locator(".learn-code-block")).toContainText(
    "seq=7000 ack=1001",
  );
  await expect(page.locator(".learn-endpoints")).toContainText("SYN-RECEIVED");
  await page.getByRole("button", { name: "Next packet" }).click();
  await expect(page.locator(".learn-transport-status")).toContainText(
    "Reliable transport established",
  );
  await expect(page.locator(".learn-code-block")).toContainText(
    "seq=1001 ack=7001",
  );
  await expect(page.locator(".learn-callout")).toContainText("TLS handshake");
  await page.getByRole("button", { name: "Reset handshake" }).click();
  await expect(page.locator(".learn-inspector h3")).toHaveText(
    "Ready to connect",
  );
  await expect(page.locator(".learn-transport-status")).toContainText(
    "0/3 packets",
  );
});

test("OSI layer inspection follows encapsulation from application to physical signals", async ({
  page,
}) => {
  await openLab(page);
  await page.getByRole("tab", { name: /OSI explorer/ }).click();
  await page
    .locator(".learn-osi-layer")
    .filter({ hasText: "Presentation" })
    .click();
  await expect(page.locator(".learn-inspector h3")).toHaveText("Presentation");
  await expect(page.locator(".learn-code-block")).toContainText("UTF-8 / JSON");
  await expect(page.locator(".learn-callout")).toContainText(
    "validate certificates",
  );
  await page.locator(".learn-osi-layer").filter({ hasText: "Network" }).click();
  await expect(page.locator(".learn-code-block")).toContainText("TTL=64");
  await page.getByRole("button", { name: "Send a packet" }).click();
  await expect(
    page.getByRole("button", { name: "Packet in transit" }),
  ).toBeDisabled();
  await expect(page.locator(".learn-osi-layer.selected")).toContainText(
    "Application",
  );
  await expect(page.getByRole("button", { name: "Send a packet" })).toBeEnabled(
    { timeout: 10_000 },
  );
  await expect(page.locator(".learn-inspector h3")).toHaveText("Physical");
  await expect(page.locator(".learn-code-block")).toContainText(
    "Signals traverse the local link",
  );
});

test("attack simulation reaches the first enabled defensive control", async ({
  page,
}) => {
  await openLab(page);
  await page.getByRole("tab", { name: /Attack chain/ }).click();
  await expect(page.locator(".learn-stage-detail h3")).toHaveText("Delivery");
  await page
    .getByRole("button", { name: "Control enabled", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Control disabled", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Simulate attack path" }).click();
  await expect(page.locator(".learn-chain-result")).toContainText(
    "Exercise intercepted at Command & control",
    { timeout: 10_000 },
  );
  await expect(page.locator(".learn-stage-detail h3")).toHaveText(
    "Command & control",
  );
  await expect(page.locator(".learn-chain-result")).toContainText(
    "approved response workflow",
  );
});

test("CIA scenarios recalculate relevant control coverage without overstating assurance", async ({
  page,
}) => {
  await openLab(page);
  await page.getByRole("tab", { name: /CIA triad/ }).click();
  await expect(page.locator(".learn-score > strong")).toHaveText("50%");
  await page.getByRole("button", { name: /Encryption at rest/ }).click();
  await expect(page.locator(".learn-score > strong")).toHaveText("100%");
  await expect(page.locator(".learn-callout")).toContainText(
    "an authenticated application may still decrypt data",
  );
  await page
    .getByRole("button", { name: "Ransomware disruption", exact: true })
    .click();
  await expect(page.locator(".learn-score > strong")).toHaveText("50%");
  await page.getByRole("button", { name: /Redundant services/ }).click();
  await expect(page.locator(".learn-score > strong")).toHaveText("100%");
  await page.getByRole("button", { name: /Tested immutable backups/ }).click();
  await expect(page.locator(".learn-score > strong")).toHaveText("50%");
  await expect(page.locator(".learn-score-footnote")).toContainText(
    "not a risk rating",
  );
});

test("firewall simulator honors ordering, default denial, and known TCP state", async ({
  page,
}) => {
  await openLab(page);
  await page.getByRole("tab", { name: /Firewall policy/ }).click();
  await page.getByRole("button", { name: "Test packet", exact: true }).click();
  await expect(page.locator(".learn-firewall-result")).toContainText(
    "Packet allowed",
  );
  await expect(page.locator(".learn-firewall-result")).toContainText(
    "HTTPS to lab web",
  );
  await page.getByLabel("Packet destination port", { exact: true }).fill("22");
  await page.getByRole("button", { name: "Add rule", exact: true }).click();
  await page.getByRole("button", { name: "Test packet", exact: true }).click();
  await expect(page.locator(".learn-firewall-result")).toContainText(
    "Packet denied",
  );
  await expect(page.locator(".learn-firewall-result")).toContainText(
    "Block remote administration",
  );
  await page
    .getByRole("button", { name: "Move Custom allow on 22 up", exact: true })
    .click();
  await page.getByRole("button", { name: "Test packet", exact: true }).click();
  await expect(page.locator(".learn-firewall-result")).toContainText(
    "Packet allowed",
  );
  await expect(page.locator(".learn-firewall-result")).toContainText(
    "Custom allow on 22",
  );
  await page
    .getByLabel("Packet destination port", { exact: true })
    .fill("9999");
  await page.getByRole("button", { name: "Test packet", exact: true }).click();
  await expect(page.locator(".learn-firewall-result")).toContainText(
    "Default policy: deny",
  );
  await page.getByLabel("Packet connection state").selectOption("ESTABLISHED");
  await page.getByRole("button", { name: "Test packet", exact: true }).click();
  await expect(page.locator(".learn-firewall-result")).toContainText(
    "Tracked TCP connections",
  );
  await expect(page.locator(".learn-firewall-result")).toContainText(
    "Packet allowed",
  );
  await expect(page.locator(".learn-callout").last()).toContainText(
    "ACK flag alone does not prove",
  );
});

test("playbook action decisions and notes survive reload and export as evidence", async ({
  page,
}) => {
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  await navigation
    .getByRole("button", { name: "Response playbooks", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Complete step", exact: true }),
  ).toBeDisabled();
  const note =
    "Tabletop exercise: isolation requires incident commander approval. Evidence ref: LAB-104.";
  await page
    .getByRole("textbox", {
      name: "Analyst notes for Confirm response authority",
    })
    .fill(note);
  const actions = page.locator(".pb-action");
  for (let index = 0; index < (await actions.count()); index++)
    await actions.nth(index).click();
  await page
    .getByRole("button", { name: "Complete step", exact: true })
    .click();
  await expect(page.locator(".pb-step-content h3")).toHaveText(
    "Map critical assets & dependencies",
  );
  await expect(page.locator(".pb-progress-header")).toContainText(
    "1 / 7 steps",
  );
  await page.reload();
  await navigation
    .getByRole("button", { name: "Response playbooks", exact: true })
    .click();
  await expect(page.locator(".pb-progress-header")).toContainText(
    "1 / 7 steps",
  );
  await expect(
    page.getByRole("textbox", {
      name: "Analyst notes for Confirm response authority",
    }),
  ).toHaveValue(note);
  await expect(page.locator(".pb-action.checked")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Reopen step", exact: true }),
  ).toBeEnabled();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export exercise", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    "ransomware-playbook-exercise.json",
  );
  const path = await download.path();
  expect(path).not.toBeNull();
  const report = JSON.parse(await readFile(path!, "utf-8"));
  expect(report.exercise).toBe(true);
  expect(report.framework).toContain("Rev. 3");
  expect(report.progress).toEqual({ completed: 1, total: 7 });
  expect(report.steps[0].completed).toBe(true);
  expect(report.steps[0].checkedActions).toHaveLength(3);
  expect(report.steps[0].notes).toBe(note);
});
