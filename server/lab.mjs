import http from "node:http";

export function createLabServer() {
  return http.createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, {
        "Content-Type": "text/plain",
        Allow: "GET, HEAD",
      });
      response.end("Read-only training lab.");
      return;
    }
    const path = new URL(request.url, "http://127.0.0.1:4318").pathname;
    // These missing browser-hardening headers and the banner are intentional lab observations.
    const headers = {
      Server: "AEGIS-Training-Lab/1.0",
      "X-Powered-By": "Node.js (training)",
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
    };
    const pages = {
      "/": '<!doctype html><html lang="en"><meta charset="utf-8"><title>AEGIS · Authorized training lab</title><body><h1>AEGIS training lab</h1><p>This service intentionally omits selected security headers for read-only assessment exercises.</p><p>No customer records, real credentials, or exploitable modules are present.</p><a href="/health">Lab health</a></body></html>',
      "/admin":
        '<!doctype html><html lang="en"><title>Training administration</title><body><h1>Administration placeholder</h1><p>Demonstration route only. No login, privileges, or real administrative action.</p></body></html>',
    };
    let body;
    let status = 200;
    if (pages[path]) body = pages[path];
    else if (path === "/health") {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify({
        status: "ready",
        service: "AEGIS training lab",
        demo: true,
      });
    } else if (path === "/api/status") {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify({
        service: "training-web",
        environment: "isolated lab",
        debug: true,
        data: "synthetic only",
      });
    } else if (path === "/robots.txt") {
      headers["Content-Type"] = "text/plain";
      body =
        "User-agent: *\nDisallow: /admin\n# Training route only; robots.txt is not an access control.\n";
    } else {
      status = 404;
      headers["Content-Type"] = "text/plain";
      body = "Training route not found.";
    }
    response.writeHead(status, headers);
    response.end(request.method === "HEAD" ? undefined : body);
  });
}
