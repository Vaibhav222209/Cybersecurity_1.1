import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { authorizeTarget } from "./scope.mjs";
import { requestTarget, tcpProbe } from "./assess.mjs";

const serverDir = fileURLToPath(new URL(".", import.meta.url));
const binaryNames = ["nmap", "nuclei", "gobuster", "msfconsole"];

export async function findExecutable(name) {
  if (!binaryNames.includes(name)) return null;
  for (const directory of [
    "/workspace/security-tools/bin",
    ...(process.env.PATH || "").split(":").filter(Boolean),
  ]) {
    const path = join(directory, name);
    try {
      await access(path, constants.X_OK);
      return path;
    } catch {
      /* Try next PATH entry. */
    }
  }
  return null;
}

export async function toolCapabilities() {
  return Object.fromEntries(
    await Promise.all(
      binaryNames.map(async (name) => [
        name,
        { installed: Boolean(await findExecutable(name)) },
      ]),
    ),
  );
}

function tokenize(command) {
  if (typeof command !== "string" || command.length > 1000)
    throw new Error("Command must be a string of at most 1,000 characters.");
  if (/[;&|<>`$\r\n\x00]/.test(command))
    throw new Error(
      "Shell operators, substitutions, redirections, and multiline commands are not supported.",
    );
  const parts = command.match(/"[^"\r\n]*"|'[^'\r\n]*'|[^\s]+/g) || [];
  return parts.map((part) => part.replace(/^(['"])(.*)\1$/, "$2"));
}

const help = `AEGIS / PARROT LAB — AUTHORIZED OPERATIONS

  help                        Show this command reference
  whoami                      Show the current training role
  scope                       Show permitted assessment targets
  ls                          List virtual lab endpoints
  clear                       Clear the terminal display
  scan [target]               Run a real read-only HTTP/TCP baseline
  curl [target]               Read the authorized origin response
  tcp [target]                Test TCP connectivity on the authorized port
  nmap [-sV] [target]          Use installed Nmap against the local lab
  nuclei [-u target]          Use installed Nuclei with one local safe template
  gobuster dir [-u target]    Enumerate local lab paths using a tiny fixed wordlist
  msfconsole --version        Show installed Metasploit version

Default target: http://127.0.0.1:4318
External origins require AUTHORIZED_TARGETS. No arbitrary shell or exploit execution.
Containment controls modify demo state only; no endpoint agent is connected.`;

export function runFile(path, args, timeout = 15_000) {
  return new Promise((resolve) => {
    const env = {
      ...process.env,
      XDG_CONFIG_HOME: "/workspace/security-tools/runtime/config",
      XDG_CACHE_HOME: "/workspace/security-tools/runtime/cache",
      XDG_DATA_HOME: "/workspace/security-tools/runtime/data",
    };
    if (path === "/workspace/security-tools/bin/nmap") {
      env.LD_LIBRARY_PATH = [
        "/workspace/security-tools/deb-root/usr/lib/x86_64-linux-gnu",
        process.env.LD_LIBRARY_PATH,
      ]
        .filter(Boolean)
        .join(":");
      env.NMAPDIR = "/workspace/security-tools/deb-root/usr/share/nmap";
    }
    const child = execFile(
      path,
      args,
      { timeout, maxBuffer: 128 * 1024, env, shell: false, windowsHide: true },
      (error, stdout, stderr) => {
        const output = `${stdout || ""}${stderr ? `\n${stderr}` : ""}`
          .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
          .replace(/\r/g, "")
          .trim();
        const failure = error?.killed
          ? `Command stopped after ${timeout / 1000} seconds (execution limit).`
          : error
            ? `Command failed (${error.code || error.signal || "unknown error"}).`
            : "";
        resolve({
          output:
            [output, failure].filter(Boolean).join("\n") ||
            "Command completed with no output.",
          exitCode: error
            ? typeof error.code === "number"
              ? error.code
              : 1
            : 0,
        });
      },
    );
    // Nuclei also checks stdin for targets; close our unused input pipe so it
    // cannot wait indefinitely for a terminal stream that will never arrive.
    child.stdin?.end();
  });
}

function integrationTarget(args, tool) {
  const flags =
    tool === "nmap"
      ? new Set(["-sV", "-sT", "-Pn", "-p"])
      : tool === "nuclei"
        ? new Set(["-u", "-target"])
        : new Set(["dir", "-u", "--url"]);
  let target = "localhost";
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (tool === "gobuster" && arg === "dir") continue;
    if (["-u", "-target", "--url"].includes(arg)) {
      if (!args[i + 1])
        throw new Error(`${arg} requires an authorized target.`);
      target = args[++i];
    } else if (arg === "-p" && tool === "nmap") {
      if (args[++i] !== "4318")
        throw new Error(
          "Nmap integration is limited to the training lab port 4318.",
        );
    } else if (flags.has(arg)) {
      /* Supported options are translated into our fixed invocation. */
    } else if (arg.startsWith("-"))
      throw new Error(
        `Option ${arg} is not supported. Type help for the constrained command syntax.`,
      );
    else if (target === "localhost") target = arg;
    else throw new Error("Only one target is permitted per command.");
  }
  return target;
}

export async function executeTerminal(command, context) {
  const result = {
    command,
    output: "",
    exitCode: 0,
    kind: "builtin",
    scope: context.scope.label,
  };
  let parts;
  try {
    parts = tokenize(command);
  } catch (error) {
    return { ...result, output: error.message, exitCode: 2 };
  }
  const [name, ...args] = parts;
  if (!name) return result;
  try {
    if (name === "help") return { ...result, output: help };
    if (name === "clear") return { ...result, output: "", kind: "clear" };
    if (name === "whoami")
      return {
        ...result,
        output:
          "analyst@aegis-lab\nRole: Security analyst · training workspace\nEndpoint control: demo state only\nEvidence: local baseline assessments are real network requests",
      };
    if (name === "scope")
      return {
        ...result,
        output: `AUTHORIZED ASSESSMENT SCOPE\n${context.scope.targets.map((target) => `  ✓ ${target}`).join("\n")}\n\nExact origins only; redirects are not followed. DNS is checked and pinned per request.`,
      };
    if (name === "ls")
      return {
        ...result,
        output:
          "Virtual training lab routes (not a host filesystem listing):\n/             Training landing page\n/robots.txt   Lab discovery hints\n/health       Lab service health\n/api/status   Synthetic service metadata\n/admin        Training administration placeholder",
      };
    if (name === "scan") {
      if (args.length > 1) throw new Error("Usage: scan [authorized-origin]");
      const assessment = await context.assess(args[0] || "localhost");
      const lines = [
        `AEGIS BASELINE · ${assessment.id}`,
        `Target: ${assessment.target}`,
        `Scope: ${assessment.scope}`,
        `TCP ${assessment.ports[0]?.port}: ${assessment.ports[0]?.state}`,
        `HTTP: ${assessment.http?.status || assessment.error || "unavailable"}`,
        "",
      ];
      for (const check of assessment.checks)
        lines.push(
          `[${check.status.toUpperCase()}] ${check.name}: ${check.evidence}`,
        );
      lines.push(
        "",
        `${assessment.findings.length} baseline finding(s) · critical ${assessment.summary.critical} · high ${assessment.summary.high} · medium ${assessment.summary.medium} · low ${assessment.summary.low} · info ${assessment.summary.info}`,
      );
      for (const item of assessment.findings)
        lines.push(
          `[${item.severity.toUpperCase()}] ${item.title}\n  ${item.remediation}`,
        );
      lines.push(
        "",
        "Read-only observations; no exploitation attempted. Report saved in assessment history.",
      );
      return {
        ...result,
        output: lines.join("\n"),
        assessment,
        exitCode: assessment.status === "failed" ? 1 : 0,
      };
    }
    if (name === "curl" || name === "tcp") {
      if (args.length > 1)
        throw new Error(`Usage: ${name} [authorized-origin]`);
      const target = await authorizeTarget(
        args[0] || "localhost",
        context.scope,
      );
      if (name === "tcp") {
        const probe = await tcpProbe(target);
        return {
          ...result,
          output: `TCP CONNECTIVITY CHECK\nDestination: ${target.origin}\nPinned address: ${target.address}\nPort ${probe.port}: ${probe.state}\nElapsed: ${probe.latencyMs} ms\n${probe.evidence}\n\nA successful connect implies the TCP handshake completed. Packet-level SYN / SYN-ACK / ACK visualization is illustrative.`,
          exitCode: probe.state === "open" ? 0 : 1,
        };
      }
      const response = await requestTarget(target);
      return {
        ...result,
        output: `HTTP ${response.statusCode}\n${Object.entries(response.headers)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")}\n\n${response.body.slice(0, 8000)}`,
      };
    }
    if (binaryNames.includes(name)) {
      const executable = await findExecutable(name);
      if (!executable)
        return {
          ...result,
          kind: "not-installed",
          exitCode: 127,
          output: `${name}: not installed in this cloud environment.\nSee server/README.md for installation guidance.\nUse "scan localhost", "curl localhost", or "tcp localhost" for real built-in lab checks. No simulated tool output is presented as an executed scan.`,
        };
      if (name === "msfconsole") {
        if (
          args.length !== 1 ||
          !["--version", "-v", "--help", "-h"].includes(args[0])
        )
          throw new Error(
            "Metasploit integration supports --version and --help only. Exploit modules and arbitrary console commands are not enabled.",
          );
        return {
          ...result,
          kind: "integration",
          ...(await runFile(executable, [args[0]], 10_000)),
        };
      }
      if (
        args.length === 1 &&
        ["--version", "-version", "-V"].includes(args[0])
      ) {
        const versionFlag =
          name === "nmap"
            ? "--version"
            : name === "nuclei"
              ? "-version"
              : "version";
        return {
          ...result,
          kind: "integration",
          ...(await runFile(executable, [versionFlag], 5000)),
        };
      }
      const target = await authorizeTarget(
        integrationTarget(args, name),
        context.scope,
      );
      if (!target.lab)
        throw new Error(
          "Native tool execution is limited to the local training lab. Use scan, curl, or tcp for DNS-pinned checks of explicit authorized origins.",
        );
      const invocation =
        name === "nmap"
          ? [
              "-sT",
              "-sV",
              "--version-light",
              "-Pn",
              "-p",
              "4318",
              "--host-timeout",
              "12s",
              "127.0.0.1",
            ]
          : name === "nuclei"
            ? [
                "-u",
                "http://127.0.0.1:4318",
                "-t",
                join(serverDir, "templates/header-audit.yaml"),
                "-ni",
                "-duc",
                "-rl",
                "2",
                "-c",
                "1",
                "-timeout",
                "3",
                "-retries",
                "0",
                "-silent",
              ]
            : [
                "dir",
                "-u",
                "http://127.0.0.1:4318",
                "-w",
                join(serverDir, "templates/lab-wordlist.txt"),
                "-t",
                "1",
                "--timeout",
                "3s",
                "-q",
                "--no-error",
              ];
      return {
        ...result,
        kind: "integration",
        ...(await runFile(executable, invocation)),
      };
    }
    return {
      ...result,
      exitCode: 127,
      output: `${name}: command is not supported. Type help to see the authorized command set.`,
    };
  } catch (error) {
    return { ...result, output: error.message, exitCode: 1, kind: "error" };
  }
}
