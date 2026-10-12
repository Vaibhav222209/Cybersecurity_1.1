import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { authorizeTarget, createScope, parseTarget } from "./scope.mjs";
import { assessAuthorizedTarget, requestTarget } from "./assess.mjs";
import { executeTerminal, runFile } from "./terminal.mjs";
import { createStore } from "./store.mjs";
import { createApiServer } from "./app.mjs";

const listen = (server) =>
  new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
const close = (server) => new Promise((resolve) => server.close(resolve));

test("scope permits only the fixed localhost lab by default", async () => {
  const target = await authorizeTarget("localhost", createScope(""));
  assert.equal(target.address, "127.0.0.1");
  assert.equal(target.port, 4318);
  assert.equal(target.lab, true);
  await assert.rejects(
    authorizeTarget("http://localhost:3000", createScope("")),
    /outside the authorized scope/,
  );
  await assert.rejects(
    authorizeTarget("https://example.com", createScope("")),
    /outside the authorized scope/,
  );
});

test("scope rejects dangerous URL forms and requires exact scheme + host + port", async () => {
  for (const target of [
    "file:///etc/passwd",
    "http://user:password@example.com",
    "https://example.com/a",
    "https://example.com/?token=secret",
  ])
    assert.throws(() => parseTarget(target));
  const scope = createScope("https://example.com");
  await assert.rejects(
    authorizeTarget("http://example.com", scope),
    /outside the authorized scope/,
  );
  await assert.rejects(
    authorizeTarget("https://example.com:8443", scope),
    /outside the authorized scope/,
  );
});

test("DNS is checked and pinned, rejecting private answers and mixed public/private rebinding", async () => {
  const scope = createScope("https://example.com");
  const publicLookup = async () => [{ address: "93.184.216.34", family: 4 }];
  const target = await authorizeTarget(
    "https://example.com",
    scope,
    publicLookup,
  );
  assert.equal(target.address, "93.184.216.34");
  const mixedLookup = async () => [
    { address: "93.184.216.34", family: 4 },
    { address: "127.0.0.1", family: 4 },
  ];
  await assert.rejects(
    authorizeTarget("https://example.com", scope, mixedLookup),
    /private or local address/,
  );
  const metadataLookup = async () => [
    { address: "169.254.169.254", family: 4 },
  ];
  await assert.rejects(
    authorizeTarget("https://example.com", scope, metadataLookup),
    /metadata/,
  );
});

test("explicit internal IP origins are permitted but metadata and alternative loopbacks remain forbidden", async () => {
  const target = await authorizeTarget(
    "http://10.0.0.12:8080",
    createScope("http://10.0.0.12:8080"),
  );
  assert.equal(target.address, "10.0.0.12");
  for (const target of [
    "http://169.254.169.254",
    "http://100.100.100.200",
    "http://168.63.129.16",
    "http://[fd00:ec2::254]",
    "http://127.0.0.2",
    "http://[::ffff:7f00:1]",
  ])
    await assert.rejects(authorizeTarget(target, createScope(target)));
});

test("assessment makes actual HTTP/TCP requests and derives findings from observed headers", async () => {
  let requests = 0;
  const server = http.createServer((_request, response) => {
    requests++;
    response.writeHead(200, {
      "Content-Type": "text/html",
      Server: "TestLab/1.0",
      "X-Content-Type-Options": "nosniff",
    });
    response.end("<h1>Training lab</h1>");
  });
  const port = await listen(server);
  try {
    const target = {
      hostname: "127.0.0.1",
      address: "127.0.0.1",
      family: 4,
      port,
      protocol: "http:",
      origin: `http://127.0.0.1:${port}`,
      lab: true,
    };
    const assessment = await assessAuthorizedTarget(target);
    assert.equal(assessment.status, "completed");
    assert.equal(assessment.ports[0].state, "open");
    assert.equal(assessment.http.status, 200);
    assert.equal(requests, 1);
    assert(
      assessment.findings.some(
        (finding) => finding.id === "content-security-policy",
      ),
    );
    assert(
      !assessment.findings.some(
        (finding) => finding.id === "x-content-type-options",
      ),
    );
    assert(assessment.findings.some((finding) => finding.id === "banner"));
    assert.equal(assessment.summary.total, assessment.findings.length);
  } finally {
    await close(server);
  }
});

test("HTTP client does not follow redirects, including redirects outside scope", async () => {
  let destinationRequests = 0;
  const destination = http.createServer((_request, response) => {
    destinationRequests++;
    response.end("must not be read");
  });
  const destinationPort = await listen(destination);
  const source = http.createServer((_request, response) => {
    response.writeHead(302, {
      Location: `http://127.0.0.1:${destinationPort}`,
    });
    response.end();
  });
  const sourcePort = await listen(source);
  try {
    const result = await requestTarget({
      hostname: "127.0.0.1",
      address: "127.0.0.1",
      family: 4,
      port: sourcePort,
      protocol: "http:",
    });
    assert.equal(result.statusCode, 302);
    assert.equal(destinationRequests, 0);
  } finally {
    await close(source);
    await close(destination);
  }
});

test("HTTP absolute deadline stops a streaming response that continually avoids idle timeout", async () => {
  const server = http.createServer((_request, response) => {
    response.writeHead(200);
    response.write("start");
    const stream = setInterval(() => response.write("."), 30);
    response.on("close", () => clearInterval(stream));
  });
  const port = await listen(server);
  try {
    const start = Date.now();
    await assert.rejects(
      requestTarget(
        {
          hostname: "127.0.0.1",
          address: "127.0.0.1",
          family: 4,
          port,
          protocol: "http:",
        },
        "/",
        { deadlineMs: 150 },
      ),
      /absolute request deadline/,
    );
    assert(
      Date.now() - start < 1500,
      "Slow streaming must be bounded by an absolute deadline.",
    );
  } finally {
    await close(server);
  }
});

test("anti-framing checks reject invalid values and unrelated CSP substrings", async () => {
  let headers = {
    "X-Frame-Options": "ALLOWALL",
    "Content-Security-Policy": "default-src https://frame-ancestors.example",
  };
  const server = http.createServer((_request, response) => {
    response.writeHead(200, headers);
    response.end("lab");
  });
  const port = await listen(server);
  const target = {
    hostname: "127.0.0.1",
    address: "127.0.0.1",
    family: 4,
    port,
    protocol: "http:",
    origin: `http://127.0.0.1:${port}`,
    lab: true,
  };
  try {
    assert(
      (await assessAuthorizedTarget(target)).findings.some(
        (finding) => finding.id === "framing",
      ),
    );
    headers = {
      "Content-Security-Policy": "default-src 'self'; frame-ancestors *",
    };
    assert(
      (await assessAuthorizedTarget(target)).findings.some(
        (finding) => finding.id === "framing",
      ),
    );
    headers = {
      "Content-Security-Policy": "frame-ancestors *; frame-ancestors 'none'",
    };
    assert(
      (await assessAuthorizedTarget(target)).findings.some(
        (finding) => finding.id === "framing",
      ),
    );
    headers = {
      "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none'",
    };
    assert(
      !(await assessAuthorizedTarget(target)).findings.some(
        (finding) => finding.id === "framing",
      ),
    );
    headers = { "X-Frame-Options": "SAMEORIGIN" };
    assert(
      !(await assessAuthorizedTarget(target)).findings.some(
        (finding) => finding.id === "framing",
      ),
    );
  } finally {
    await close(server);
  }
});

test("terminal rejects shell injection and never invokes arbitrary commands", async () => {
  const context = {
    scope: createScope(""),
    assess: () => {
      throw new Error("Unexpected scan");
    },
  };
  for (const command of [
    "scan localhost; cat /etc/passwd",
    "curl $(whoami)",
    "nmap localhost | sh",
    "help\nwhoami",
    "curl `id`",
  ]) {
    const result = await executeTerminal(command, context);
    assert.equal(result.exitCode, 2);
    assert.match(result.output, /Shell operators/);
  }
  const unknown = await executeTerminal("cat /etc/passwd", context);
  assert.equal(unknown.exitCode, 127);
  assert.match(unknown.output, /not supported/);
});

test("native command runner closes stdin and applies a clear execution timeout", async () => {
  const eof = await runFile(
    process.execPath,
    [
      "-e",
      "process.stdin.on('end',()=>console.log('input closed'));process.stdin.resume();",
    ],
    2000,
  );
  assert.equal(eof.exitCode, 0);
  assert.equal(eof.output, "input closed");
  const stalled = await runFile(
    process.execPath,
    ["-e", "setInterval(()=>{},1000)"],
    100,
  );
  assert.equal(stalled.exitCode, 1);
  assert.match(stalled.output, /execution limit/);
});

test("JSON event import validates atomically and persists user supplied logs with provenance", async () => {
  const directory = await mkdtemp(join(tmpdir(), "aegis-import-test-"));
  const store = await createStore(join(directory, "state.json"));
  const server = createApiServer(store, { scope: createScope("") });
  const port = await listen(server);
  const origin = `http://127.0.0.1:${port}`;
  const post = (events) =>
    fetch(`${origin}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    });
  try {
    const count = store.state.events.length;
    const invalid = await post([
      { title: "Valid" },
      { title: "Invalid", severity: "invented" },
    ]);
    assert.equal(invalid.status, 400);
    assert.equal(store.state.events.length, count);
    const valid = await post([
      {
        title: "Local firewall event",
        source: "Firewall JSON",
        severity: "medium",
        message: "Denied management connection",
        timestamp: "2026-10-12T10:00:00Z",
      },
    ]);
    assert.equal(valid.status, 201);
    const result = await valid.json();
    assert.equal(result.imported, 1);
    assert.equal(result.events[0].demo, false);
    assert.match(result.events[0].provenance, /not independently verified/);
    const reloaded = await createStore(join(directory, "state.json"));
    assert.equal(reloaded.state.events[0].title, "Local firewall event");
  } finally {
    await close(server);
    await rm(directory, { recursive: true, force: true });
  }
});

test("isolation persists demo state and audit; unauthorized API origins are rejected", async () => {
  const directory = await mkdtemp(join(tmpdir(), "aegis-backend-test-"));
  const file = join(directory, "state.json");
  const store = await createStore(file);
  const server = createApiServer(store, { scope: createScope("") });
  const port = await listen(server);
  const origin = `http://127.0.0.1:${port}`;
  try {
    const response = await fetch(`${origin}/api/assets/ast-01/isolate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Test scenario containment" }),
    });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.asset.status, "isolated");
    assert.equal(result.demo, true);
    const persisted = JSON.parse(await readFile(file, "utf8"));
    assert.equal(
      persisted.assets.find((asset) => asset.id === "ast-01").status,
      "isolated",
    );
    assert.equal(persisted.audit.length, 1);
    assert.equal(
      persisted.incidents.find((incident) => incident.id === "INC-2048").status,
      "contained",
    );
    const forbidden = await fetch(`${origin}/api/assets`, {
      headers: { Origin: "https://untrusted.example" },
    });
    assert.equal(forbidden.status, 403);
    const invalidAction = await fetch(
      `${origin}/api/incidents/INC-2048/actions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "launch-exploit" }),
      },
    );
    assert.equal(invalidAction.status, 400);
  } finally {
    await close(server);
    await rm(directory, { recursive: true, force: true });
  }
});
