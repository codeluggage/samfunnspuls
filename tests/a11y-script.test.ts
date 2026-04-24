import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkA11yScript = path.join(repoRoot, "scripts/check-a11y.mjs");

test("check-a11y rejects design-system form controls without stable id and name", () => {
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), "samfunnspuls-a11y-"));
  const appDir = path.join(fixtureRoot, "app");
  mkdirSync(appDir);
  writeFileSync(
    path.join(appDir, "page.tsx"),
    [
      'import { Heading, Select } from "rk-designsystem";',
      "export default function Page() {",
      "  return (",
      '    <main><Heading level={1}>Test</Heading><Select aria-label="Velg kommune" /></main>',
      "  );",
      "}",
      "",
    ].join("\n"),
  );

  const result = spawnSync(process.execPath, [checkA11yScript, appDir], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Select should include id and name/);
});

test("check-a11y accepts named design-system form controls", () => {
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), "samfunnspuls-a11y-"));
  const appDir = path.join(fixtureRoot, "app");
  mkdirSync(appDir);
  writeFileSync(
    path.join(appDir, "page.tsx"),
    [
      'import { Heading, Select } from "rk-designsystem";',
      "export default function Page() {",
      "  return (",
      '    <main><Heading level={1}>Test</Heading><Select id="municipality" name="municipality" aria-label="Velg kommune" /></main>',
      "  );",
      "}",
      "",
    ].join("\n"),
  );

  const output = execFileSync(process.execPath, [checkA11yScript, appDir], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  assert.match(output, /Accessibility checks passed/);
});
