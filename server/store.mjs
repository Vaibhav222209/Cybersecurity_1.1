import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { seedState } from "./data.mjs";

export async function createStore(file) {
  let state;
  try {
    state = JSON.parse(await readFile(file, "utf8"));
    if (
      state.version !== 1 ||
      !["assets", "events", "incidents", "assessments", "audit"].every((key) =>
        Array.isArray(state[key]),
      )
    )
      throw new Error("Invalid persisted state schema.");
  } catch (error) {
    if (error.code !== "ENOENT")
      throw new Error(`Could not load demo state: ${error.message}`);
    state = seedState();
  }
  await mkdir(dirname(file), { recursive: true });
  let writes = Promise.resolve();
  const save = () => {
    const snapshot = JSON.stringify(state, null, 2);
    writes = writes
      .catch(() => {})
      .then(async () => {
        await writeFile(`${file}.tmp`, snapshot, { mode: 0o600 });
        await rename(`${file}.tmp`, file);
      });
    return writes;
  };
  await save();
  return { state, save };
}
