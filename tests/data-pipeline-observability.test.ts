import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("import script records ingestion runs and table counts", () => {
  const source = readFileSync(
    path.join(repoRoot, "scripts/import-samfunnspuls-data.ts"),
    "utf8",
  );

  assert.match(source, /ingestion_runs/);
  assert.match(source, /status:\s*"running"/);
  assert.match(source, /status:\s*"success"/);
  assert.match(source, /status:\s*"failed"/);
  assert.match(source, /countPipelineTables/);
});

test("pipeline status route exposes readiness and table counts", () => {
  const source = readFileSync(
    path.join(repoRoot, "src/app/api/system/data-status/route.ts"),
    "utf8",
  );

  assert.match(source, /readiness/);
  assert.match(source, /tableCounts/);
  assert.match(source, /latestRun/);
  assert.match(source, /REQUIRED_TABLES/);
});

test("readme links to the machine-verifiable status endpoint and playbook", () => {
  const source = readFileSync(path.join(repoRoot, "README.md"), "utf8");

  assert.match(source, /\/api\/system\/data-status/);
  assert.match(source, /docs\/data-pipeline-playbook\.md/);
});
