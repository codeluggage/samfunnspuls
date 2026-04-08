import { spawnSync } from "node:child_process";

const result = spawnSync("node", ["scripts/sync-agent-assets.mjs", "--check"], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
