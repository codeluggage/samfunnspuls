import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("utforsk-data route uses catalog search and design-system details", () => {
  const source = readFileSync(path.join(repoRoot, "src/app/utforsk-data/page.tsx"), "utf8");

  assert.match(source, /searchCatalog/);
  assert.match(source, /SAMFUNNSPULS_CATALOG/);
  assert.match(source, /Textfield/);
  assert.match(source, /Details/);
  assert.match(source, /<main/);
});

test("home route navigation links to utforsk-data", () => {
  const source = readFileSync(path.join(repoRoot, "src/app/page.tsx"), "utf8");

  assert.match(source, /Utforsk data/);
  assert.match(source, /\/utforsk-data/);
});
