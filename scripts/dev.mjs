import { spawn } from "node:child_process";
const viteArgs = process.argv.includes("--production")
  ? ["node_modules/vite/bin/vite.js", "preview", "--host", "0.0.0.0"]
  : ["node_modules/vite/bin/vite.js", "--host", "0.0.0.0"];
const apiArgs = process.argv.includes("--production")
  ? ["server/index.mjs"]
  : ["--watch", "server/index.mjs"];
const children = [
  spawn(process.execPath, apiArgs, { stdio: "inherit" }),
  spawn(process.execPath, viteArgs, { stdio: "inherit" }),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const c of children) c.kill("SIGTERM");
  setTimeout(() => process.exit(code), 250);
}
for (const child of children)
  child.on("exit", (code) => {
    if (!stopping) stop(code || 1);
  });
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
