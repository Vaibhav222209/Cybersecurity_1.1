import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createStore } from "./store.mjs";
import { createApiServer } from "./app.mjs";
import { createLabServer } from "./lab.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const bindHost = "127.0.0.1";
const apiPort = Number(process.env.API_PORT || 4317);
const labPort = 4318;
const store = await createStore(
  resolve(
    process.env.AEGIS_RUNTIME_DIR || resolve(root, ".runtime"),
    "soc-state.json",
  ),
);
const lab = createLabServer();
await new Promise((resolveStart, reject) => {
  lab.once("error", reject);
  lab.listen(labPort, bindHost, resolveStart);
});
const api = createApiServer(store, { labReady: true });
await new Promise((resolveStart, reject) => {
  api.once("error", reject);
  api.listen(apiPort, bindHost, resolveStart);
});
console.log(`AEGIS API ready at http://${bindHost}:${apiPort}`);
console.log(`Read-only training lab ready at http://${bindHost}:${labPort}`);
console.log(
  "SOC telemetry and endpoint containment are demonstrations. Baseline assessments perform real authorized network requests.",
);

let closing = false;
const shutdown = async () => {
  if (closing) return;
  closing = true;
  await store.save();
  api.close();
  lab.close();
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
