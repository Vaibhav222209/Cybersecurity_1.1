import { defineConfig } from "vite";
import type { ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
const apiProxy: ProxyOptions = {
  target: "http://127.0.0.1:4317",
  configure(proxy) {
    proxy.on("proxyReq", (proxyReq, request) => {
      const origin = request.headers.origin;
      // The web proxy is trusted only for browser requests from its own host.
      // Preserve foreign Origins so the local API can reject cross-origin writes.
      try {
        if (
          typeof origin === "string" &&
          new URL(origin).host === request.headers.host
        )
          proxyReq.removeHeader("origin");
      } catch {
        /* Keep invalid Origins for API validation. */
      }
    });
  },
};
export default defineConfig({
  plugins: [react()],
  server: { host: "0.0.0.0", proxy: { "/api": apiProxy } },
  preview: { host: "0.0.0.0", proxy: { "/api": apiProxy } },
});
