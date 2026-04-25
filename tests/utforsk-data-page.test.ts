import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { SAMFUNNSPULS_CATALOG } from "../src/lib/samfunnspuls/catalog";

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
  const source = readFileSync(path.join(repoRoot, "src/app/components/site-header.tsx"), "utf8");

  assert.match(source, /Utforsk data/);
  assert.match(source, /\/utforsk-data/);
  assert.match(source, /aria-current/);
  assert.match(source, /event\.preventDefault\(\)/);
});

test("utforsk-data filters use visible labels for browser accessibility checks", () => {
  const source = readFileSync(path.join(repoRoot, "src/app/utforsk-data/page.tsx"), "utf8");

  assert.match(source, /<label htmlFor="catalog-category">Kategori<\/label>/);
  assert.match(source, /<label htmlFor="catalog-source">Kilde<\/label>/);
  assert.match(source, /<label htmlFor="catalog-value-type">Verditype<\/label>/);
  assert.match(source, /<label htmlFor="catalog-status">Datastatus<\/label>/);
  assert.doesNotMatch(source, /aria-label="Filtrer på/);
});

test("utforsk-data uses tags for textual metadata instead of status badges", () => {
  const source = readFileSync(path.join(repoRoot, "src/app/utforsk-data/page.tsx"), "utf8");

  assert.doesNotMatch(source, /\bBadge\b/);
  assert.match(source, /<Tag data-color="neutral">/);
});

test("utforsk-data related statistics stay in-page until detail routes exist", () => {
  const source = readFileSync(path.join(repoRoot, "src/app/utforsk-data/page.tsx"), "utf8");

  assert.doesNotMatch(source, /<Link href=\{related\.path\}/);
  assert.match(source, /onRelatedSelect/);
  for (const entry of SAMFUNNSPULS_CATALOG) {
    for (const related of entry.relatedStatistics ?? []) {
      assert.equal("path" in related, false, `${entry.slug} should not link related statistic ${related.title} to an unimplemented route`);
    }
  }
});

test("home municipality picker is searchable and defaults to Oslo", () => {
  const source = readFileSync(path.join(repoRoot, "src/app/page.tsx"), "utf8");

  assert.match(source, /\bSuggestion\b/);
  assert.match(source, /findDefaultArea\(data\.areas\)/);
  assert.match(source, /municipality === "Oslo"/);
  assert.doesNotMatch(source, /Samfunnspuls case/);
});
