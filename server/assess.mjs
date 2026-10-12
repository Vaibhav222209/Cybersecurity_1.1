import http from "node:http";
import https from "node:https";
import net from "node:net";
import { randomUUID } from "node:crypto";
import { authorizeTarget, createScope } from "./scope.mjs";

export function requestTarget(target, path = "/", options = {}) {
  return new Promise((resolve, reject) => {
    const deadlineMs =
      Number.isInteger(options.deadlineMs) && options.deadlineMs > 0
        ? Math.min(5000, options.deadlineMs)
        : 5000;
    let settled = false;
    let deadline;
    const succeed = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      resolve(value);
    };
    const fail = (failure) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      reject(failure);
    };
    const transport = target.protocol === "https:" ? https : http;
    const request = transport.request(
      {
        hostname: target.hostname,
        port: target.port,
        path,
        method: "GET",
        family: target.family,
        lookup: (_host, _options, callback) =>
          callback(null, target.address, target.family),
        servername: net.isIP(target.hostname) ? undefined : target.hostname,
        headers: {
          "User-Agent": "AEGIS-Authorized-Baseline/1.0",
          Accept: "text/html,application/json",
          Connection: "close",
        },
        timeout: deadlineMs,
        rejectUnauthorized: true,
      },
      (response) => {
        let body = "";
        let bytes = 0;
        response.on("data", (chunk) => {
          bytes += chunk.length;
          if (bytes > 256 * 1024) {
            request.destroy(
              new Error("Response exceeded the 256 KiB assessment limit."),
            );
            return;
          }
          body += chunk.toString("utf8");
        });
        response.on("end", () =>
          succeed({
            statusCode: response.statusCode,
            headers: response.headers,
            body,
            bytes,
          }),
        );
        response.on("error", fail);
      },
    );
    deadline = setTimeout(
      () =>
        request.destroy(
          new Error(
            `The assessment exceeded its ${deadlineMs / 1000}-second absolute request deadline.`,
          ),
        ),
      deadlineMs,
    );
    request.on("timeout", () =>
      request.destroy(
        new Error(`The target was inactive for ${deadlineMs / 1000} seconds.`),
      ),
    );
    request.on("error", fail);
    request.end();
  });
}

export function tcpProbe(target) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = net.connect({
      host: target.address,
      port: target.port,
      family: target.family,
    });
    const finish = (result) => {
      socket.destroy();
      resolve({
        port: target.port,
        protocol: "tcp",
        latencyMs: Date.now() - start,
        ...result,
      });
    };
    socket.setTimeout(3000);
    socket.once("connect", () =>
      finish({
        state: "open",
        evidence:
          "A TCP connection completed successfully; this is not a packet capture.",
      }),
    );
    socket.once("timeout", () =>
      finish({
        state: "filtered",
        evidence: "TCP connection timed out after 3 seconds.",
      }),
    );
    socket.once("error", (error) =>
      finish({
        state: error.code === "ECONNREFUSED" ? "closed" : "unreachable",
        evidence: error.code || "Connection failed",
      }),
    );
  });
}

const finding = (
  id,
  title,
  severity,
  description,
  evidence,
  remediation,
  cwe,
) => ({
  id,
  title,
  severity,
  description,
  evidence,
  remediation,
  cwe,
  confidence: "observed",
});

function hasFramingProtection(headers) {
  if (
    /^(DENY|SAMEORIGIN)$/i.test(String(headers["x-frame-options"] || "").trim())
  )
    return true;
  const policies = Array.isArray(headers["content-security-policy"])
    ? headers["content-security-policy"]
    : [String(headers["content-security-policy"] || "")];
  const source =
    /^(?:'self'|'none'|[a-z][a-z0-9+.-]*:|(?:(?:[a-z][a-z0-9+.-]*):\/\/)?(?:\*\.)?(?:[a-z0-9-]+(?:\.[a-z0-9-]+)*|\[[a-f0-9:]+\])(?::(?:\d+|\*))?(?:\/[^\s;]*)?)$/i;
  return policies.some((policy) => {
    // Browsers use the first instance when a directive is repeated in one policy.
    const directive = policy
      .split(";")
      .map((item) => item.trim().split(/\s+/))
      .find(([name]) => name.toLowerCase() === "frame-ancestors");
    if (!directive) return false;
    const values = directive.slice(1);
    return (
      values.length > 0 &&
      !values.includes("*") &&
      values.every((value) => source.test(value))
    );
  });
}

export async function runAssessment(input, scope = createScope()) {
  const target = await authorizeTarget(input, scope);
  return assessAuthorizedTarget(target);
}

// Internal assessment engine. HTTP routes always call runAssessment, which enforces scope first.
export async function assessAuthorizedTarget(target) {
  const startedAt = new Date().toISOString();
  const assessment = {
    id: `ASM-${randomUUID().slice(0, 8).toUpperCase()}`,
    target: target.origin,
    profile: "baseline",
    status: "completed",
    startedAt,
    completedAt: null,
    scope: target.lab ? "local training lab" : "explicit authorized origin",
    demo: target.lab,
    findings: [],
    checks: [],
    ports: [],
    limitations: [
      "Read-only baseline checks; findings require analyst verification.",
      "No exploitation, password attempts, subnet discovery, or redirect following.",
      "The TCP test establishes connectivity; it does not capture packets.",
    ],
  };
  assessment.ports.push(await tcpProbe(target));
  if (assessment.ports[0].state !== "open") {
    assessment.status = "failed";
    assessment.error = `Target TCP port ${target.port} is ${assessment.ports[0].state}.`;
  } else {
    try {
      const response = await requestTarget(target);
      assessment.http = {
        status: response.statusCode,
        bytes: response.bytes,
        headers: response.headers,
      };
      assessment.checks.push({
        name: "HTTP response",
        status: "passed",
        evidence: `HTTP ${response.statusCode}; ${response.bytes} bytes`,
      });
      const headerChecks = [
        [
          "content-security-policy",
          "Content-Security-Policy missing",
          "medium",
          "A content security policy can reduce browser script injection impact.",
          "Define a restrictive Content-Security-Policy that fits the application. Start in report-only mode and validate before enforcement.",
          "CWE-693",
        ],
        [
          "x-content-type-options",
          "MIME sniffing protection missing",
          "low",
          "Browsers may infer a content type when the server response lacks nosniff protection.",
          "Set X-Content-Type-Options: nosniff and return accurate Content-Type values.",
          "CWE-693",
        ],
        [
          "referrer-policy",
          "Referrer policy missing",
          "low",
          "The application has not explicitly controlled information shared in outbound referrers.",
          "Set Referrer-Policy: strict-origin-when-cross-origin or a policy appropriate to the application.",
          "CWE-200",
        ],
      ];
      for (const [
        header,
        title,
        severity,
        description,
        remediation,
        cwe,
      ] of headerChecks) {
        const present = Boolean(response.headers[header]);
        assessment.checks.push({
          name: header,
          status: present ? "passed" : "finding",
          evidence: present
            ? String(response.headers[header])
            : "Header absent from the observed response.",
        });
        if (!present)
          assessment.findings.push(
            finding(
              header,
              title,
              severity,
              description,
              "Header absent from the observed HTTP response.",
              remediation,
              cwe,
            ),
          );
      }
      const framing = hasFramingProtection(response.headers);
      assessment.checks.push({
        name: "Anti-framing policy",
        status: framing ? "passed" : "finding",
        evidence: framing
          ? "A valid X-Frame-Options value or restrictive CSP frame-ancestors directive is present."
          : "No valid X-Frame-Options: DENY/SAMEORIGIN or restrictive CSP frame-ancestors directive observed.",
      });
      if (!framing)
        assessment.findings.push(
          finding(
            "framing",
            "Anti-framing protection missing or invalid",
            "medium",
            "Pages may be embedded by another origin; clickjacking impact depends on page functionality.",
            "No valid X-Frame-Options: DENY/SAMEORIGIN or restrictive CSP frame-ancestors directive observed.",
            "Set CSP frame-ancestors 'none' or an appropriate allowlist, or X-Frame-Options: DENY.",
            "CWE-1021",
          ),
        );
      if (target.protocol === "http:")
        assessment.findings.push(
          finding(
            "transport",
            "Unencrypted HTTP transport",
            target.lab ? "info" : "medium",
            target.lab
              ? "The isolated training lab intentionally uses HTTP."
              : "This origin is served over HTTP; transport confidentiality depends on deployment context.",
            "Assessment reached the origin through HTTP.",
            "Use HTTPS with a trusted certificate for production applications.",
            "CWE-319",
          ),
        );
      else if (!response.headers["strict-transport-security"])
        assessment.findings.push(
          finding(
            "hsts",
            "HSTS policy missing",
            "low",
            "A strict HTTPS transport policy was not observed.",
            "Strict-Transport-Security header absent.",
            "Enable HSTS after confirming all required hostnames support HTTPS.",
            "CWE-319",
          ),
        );
      if (response.headers.server || response.headers["x-powered-by"])
        assessment.findings.push(
          finding(
            "banner",
            "Server technology information exposed",
            "info",
            "Server banners can assist technology fingerprinting; this alone is not evidence of an exploitable vulnerability.",
            `server=${response.headers.server || "(absent)"}; x-powered-by=${response.headers["x-powered-by"] || "(absent)"}`,
            "Minimize unnecessary version banners and keep the underlying software patched.",
            "CWE-200",
          ),
        );
      assessment.checks.push({
        name: "TLS verification",
        status: target.protocol === "https:" ? "passed" : "not-applicable",
        evidence:
          target.protocol === "https:"
            ? "Certificate validation remained enabled."
            : "HTTP target; no TLS certificate presented.",
      });
      if (response.statusCode >= 300 && response.statusCode < 400)
        assessment.checks.push({
          name: "Redirect safety",
          status: "informational",
          evidence:
            "Redirects are intentionally not followed; authorize the destination separately.",
        });
    } catch (error) {
      assessment.status = "failed";
      assessment.error = error.message;
    }
  }
  assessment.completedAt = new Date().toISOString();
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const item of assessment.findings) counts[item.severity]++;
  assessment.summary = {
    ...counts,
    total: assessment.findings.length,
    checks: assessment.checks.length,
    riskScore: Math.min(
      100,
      counts.critical * 30 +
        counts.high * 20 +
        counts.medium * 10 +
        counts.low * 3,
    ),
  };
  return assessment;
}
