import http from "node:http";
import { randomUUID } from "node:crypto";
import { createScope } from "./scope.mjs";
import { runAssessment } from "./assess.mjs";
import { executeTerminal, toolCapabilities } from "./terminal.mjs";

function allowedOrigin(origin) {
  try {
    const url = new URL(origin);
    return (
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

async function readBody(request) {
  let bytes = 0;
  const chunks = [];
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > 32 * 1024) {
      const error = new Error("Request body exceeds 32 KiB.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error();
    return value;
  } catch {
    const error = new Error("Request body must be a JSON object.");
    error.status = 400;
    throw error;
  }
}

function error(message, status = 400) {
  const failure = new Error(message);
  failure.status = status;
  return failure;
}

export function createApiServer(store, options = {}) {
  const scope = options.scope || createScope();
  let activeAssessments = 0;
  const newEvent = (type, title, detail, assetId, severity = "info") => {
    const event = {
      id: `evt-${randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      severity,
      source: "Analyst",
      eventType: type,
      title,
      message: detail,
      assetId,
      actor: "training-analyst",
      ip: "127.0.0.1",
      location: "Local lab",
      tactic: "Response",
      status: "recorded",
      demo: true,
    };
    store.state.events.unshift(event);
    store.state.events = store.state.events.slice(0, 500);
    store.state.audit.unshift(event);
    store.state.audit = store.state.audit.slice(0, 500);
    return event;
  };
  const assess = async (target) => {
    if (activeAssessments >= 2)
      throw error(
        "Two assessments are already running. Retry when one completes.",
        429,
      );
    activeAssessments++;
    try {
      const assessment = await runAssessment(target, scope);
      store.state.assessments.unshift(assessment);
      store.state.assessments = store.state.assessments.slice(0, 100);
      newEvent(
        "assessment",
        "Authorized baseline assessment completed",
        `${assessment.target} · ${assessment.findings.length} finding(s) · ${assessment.status}`,
        null,
      );
      await store.save();
      return assessment;
    } finally {
      activeAssessments--;
    }
  };
  let activeTerminals = 0;
  const server = http.createServer(async (request, response) => {
    const origin = request.headers.origin;
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    };
    if (origin && allowedOrigin(origin))
      Object.assign(headers, {
        "Access-Control-Allow-Origin": origin,
        Vary: "Origin",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
    const send = (status, data) => {
      response.writeHead(status, headers);
      response.end(JSON.stringify(data));
    };
    try {
      if (origin && !allowedOrigin(origin))
        throw error("This API accepts local development origins only.", 403);
      if (request.method === "OPTIONS") {
        response.writeHead(204, headers);
        response.end();
        return;
      }
      const url = new URL(request.url, "http://127.0.0.1:4317");
      const path = url.pathname;
      const method = request.method;
      if (method === "GET" && path === "/api/health")
        return send(200, {
          status: "ok",
          service: "AEGIS SOC API",
          version: "1.0.0",
          demo: true,
          lab: {
            url: "http://127.0.0.1:4318",
            status: options.labReady ? "ready" : "unknown",
          },
          scope: { label: scope.label, targets: scope.targets },
          tools: await toolCapabilities(),
          capabilities: {
            assessment: "read-only HTTP/TCP baseline",
            containment: "demo only",
            terminal: "allowlisted commands; no shell",
          },
        });
      if (method === "GET" && path === "/api/events")
        return send(200, {
          events: store.state.events,
          total: store.state.events.length,
          demo: true,
        });
      if (method === "GET" && path === "/api/assets")
        return send(200, { assets: store.state.assets, demo: true });
      if (method === "GET" && path === "/api/incidents")
        return send(200, { incidents: store.state.incidents, demo: true });
      if (method === "GET" && path === "/api/assessments")
        return send(200, { assessments: store.state.assessments });
      if (method === "GET" && path === "/api/audit")
        return send(200, { audit: store.state.audit, demo: true });
      if (method === "GET" && path === "/api/report")
        return send(200, {
          generatedAt: new Date().toISOString(),
          demo: true,
          scope: scope.targets,
          limitations:
            "SOC telemetry and containment are synthetic. Baseline HTTP/TCP assessment observations are real. No exploitation or connected endpoint management.",
          assets: store.state.assets,
          incidents: store.state.incidents,
          events: store.state.events,
          assessments: store.state.assessments,
          audit: store.state.audit,
        });
      if (method === "POST" && path === "/api/events") {
        const body = await readBody(request);
        if (
          !Array.isArray(body.events) ||
          body.events.length < 1 ||
          body.events.length > 100
        )
          throw error(
            "Provide between 1 and 100 log events in an events array.",
          );
        const limits = {
          title: 180,
          message: 2000,
          source: 100,
          ip: 100,
          actor: 100,
          location: 100,
          tactic: 100,
          eventType: 100,
          status: 50,
          assetId: 100,
        };
        const imported = body.events.map((input, index) => {
          if (!input || typeof input !== "object" || Array.isArray(input))
            throw error(`Event ${index + 1} must be a JSON object.`);
          const fields = {};
          for (const [key, limit] of Object.entries(limits)) {
            if (input[key] === undefined) continue;
            if (typeof input[key] !== "string" || input[key].length > limit)
              throw error(
                `Event ${index + 1}: ${key} must be a string of at most ${limit} characters.`,
              );
            fields[key] = input[key].trim();
          }
          if (!fields.title)
            throw error(`Event ${index + 1} requires a non-empty title.`);
          const severity = input.severity || "info";
          if (!["critical", "high", "medium", "low", "info"].includes(severity))
            throw error(`Event ${index + 1} has an unsupported severity.`);
          let timestamp = new Date().toISOString();
          if (input.timestamp !== undefined) {
            if (
              typeof input.timestamp !== "string" ||
              input.timestamp.length > 100 ||
              Number.isNaN(Date.parse(input.timestamp))
            )
              throw error(`Event ${index + 1} requires a valid timestamp.`);
            timestamp = new Date(input.timestamp).toISOString();
          }
          return {
            id: `evt-${randomUUID().slice(0, 8)}`,
            timestamp,
            severity,
            source: fields.source || "JSON import",
            eventType: fields.eventType || "imported-log",
            title: fields.title,
            message: fields.message || "",
            actor: fields.actor || "unverified",
            ip: fields.ip || "",
            location: fields.location || "",
            tactic: fields.tactic || "Unclassified",
            status: fields.status || "open",
            ...fields,
            demo: false,
            provenance: "user-imported; not independently verified",
          };
        });
        store.state.events = [...imported, ...store.state.events].slice(0, 500);
        const audit = {
          id: `audit-${randomUUID().slice(0, 8)}`,
          timestamp: new Date().toISOString(),
          title: "Local JSON event import",
          message: `${imported.length} event(s) imported; content and source identity are unverified.`,
          actor: "training-analyst",
          eventType: "log-import",
          demo: false,
        };
        store.state.audit.unshift(audit);
        store.state.audit = store.state.audit.slice(0, 500);
        await store.save();
        return send(201, {
          events: imported,
          imported: imported.length,
          total: store.state.events.length,
          demo: true,
          provenance: "user-imported; not independently verified",
        });
      }
      const isolate = path.match(/^\/api\/assets\/([^/]+)\/isolate$/);
      if (method === "POST" && isolate) {
        const body = await readBody(request);
        const asset = store.state.assets.find(
          (item) => item.id === decodeURIComponent(isolate[1]),
        );
        if (!asset) throw error("Asset not found.", 404);
        if (
          body.reason !== undefined &&
          (typeof body.reason !== "string" || body.reason.length > 1000)
        )
          throw error("Reason must be a string of at most 1,000 characters.");
        asset.status = "isolated";
        asset.isolatedAt = new Date().toISOString();
        asset.isolationReason =
          body.reason ||
          "Analyst requested containment in the training scenario.";
        const audit = newEvent(
          "containment",
          `Demo workstation isolated · ${asset.hostname}`,
          `${asset.isolationReason} No real endpoint agent or firewall rule was changed.`,
          asset.id,
        );
        for (const incident of store.state.incidents.filter(
          (item) => item.assetId === asset.id,
        )) {
          if (incident.status !== "resolved") incident.status = "contained";
          const step = incident.playbook.find((item) => item.id === "contain");
          if (step) step.status = "complete";
          incident.timeline.push({
            timestamp: audit.timestamp,
            title: "Demo endpoint containment",
            detail:
              "Workstation isolation recorded in local training state; no remote agent was invoked.",
          });
        }
        await store.save();
        return send(200, { asset, audit, demo: true });
      }
      const actionMatch = path.match(/^\/api\/incidents\/([^/]+)\/actions$/);
      if (method === "POST" && actionMatch) {
        const body = await readBody(request);
        const incident = store.state.incidents.find(
          (item) => item.id === decodeURIComponent(actionMatch[1]),
        );
        if (!incident) throw error("Incident not found.", 404);
        const names = {
          identify: "Validated and scoped evidence",
          investigate: "Investigation recorded",
          contain: "Containment recorded",
          eradicate: "Eradication recorded",
          recover: "Recovery verification recorded",
          review: "Control improvement review recorded",
          resolve: "Incident resolved",
        };
        if (!Object.hasOwn(names, body.action))
          throw error(
            `Unsupported incident action. Choose ${Object.keys(names).join(", ")}.`,
          );
        const step = incident.playbook.find((item) => item.id === body.action);
        if (step) step.status = "complete";
        if (body.action === "contain") {
          incident.status = "contained";
          const asset = store.state.assets.find(
            (item) => item.id === incident.assetId,
          );
          if (asset) {
            asset.status = "isolated";
            asset.isolatedAt = new Date().toISOString();
          }
        } else if (body.action === "resolve") incident.status = "resolved";
        else if (body.action === "investigate")
          incident.status = "investigating";
        const event = newEvent(
          "incident-action",
          `${names[body.action]} · ${incident.id}`,
          "Training playbook action saved. An analyst must verify real-world evidence before performing operational response.",
          incident.assetId,
        );
        incident.timeline.push({
          timestamp: event.timestamp,
          title: names[body.action],
          detail: "Analyst action applied to the synthetic training case.",
        });
        await store.save();
        return send(200, { incident, event, demo: true });
      }
      if (method === "POST" && path === "/api/assessments") {
        const body = await readBody(request);
        if (body.profile !== undefined && body.profile !== "baseline")
          throw error("Only the read-only baseline profile is supported.");
        return send(200, {
          assessment: await assess(body.target || "localhost"),
        });
      }
      if (method === "POST" && path === "/api/terminal") {
        const body = await readBody(request);
        if (typeof body.command !== "string")
          throw error("command must be a string.");
        if (activeTerminals >= 2)
          throw error(
            "Two terminal commands are already running. Retry when one completes.",
            429,
          );
        activeTerminals++;
        try {
          return send(
            200,
            await executeTerminal(body.command, { scope, assess }),
          );
        } finally {
          activeTerminals--;
        }
      }
      throw error("API route not found.", 404);
    } catch (failure) {
      if (!response.headersSent)
        send(failure.status || 500, {
          error: {
            message: failure.status
              ? failure.message
              : "The operation failed. Check the backend service logs.",
            code: failure.name || "Error",
          },
        });
      if (!failure.status) console.error("[AEGIS API]", failure.message);
    }
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 10_000;
  return server;
}
