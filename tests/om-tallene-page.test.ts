import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { SAMFUNNSPULS_CATALOG } from "../src/lib/samfunnspuls/catalog";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("om-tallene route uses catalog search and design-system details", () => {
  const source = readFileSync(path.join(repoRoot, "src/app/om-tallene/page.tsx"), "utf8");

  assert.match(source, /searchCatalog/);
  assert.match(source, /SAMFUNNSPULS_CATALOG/);
  assert.match(source, /Textfield/);
  assert.match(source, /Details/);
  assert.match(source, /<main/);
});

test("home navigation includes om-tallene", () => {
  const source = readFileSync(path.join(repoRoot, "src/app/components/site-header.tsx"), "utf8");

  assert.match(source, /APP_NAV_ITEMS/);
  assert.match(source, /\/om-tallene/);
  assert.match(source, /aria-current/);
  assert.match(source, /event\.preventDefault\(\)/);
});

test("om-tallene filters use visible labels for browser accessibility checks", () => {
  const source = readFileSync(path.join(repoRoot, "src/app/om-tallene/page.tsx"), "utf8");

  assert.match(source, /<label htmlFor="catalog-category">Kategori<\/label>/);
  assert.match(source, /<label htmlFor="catalog-source">Kilde<\/label>/);
  assert.match(source, /<label htmlFor="catalog-value-type">Verditype<\/label>/);
  assert.match(source, /<label htmlFor="catalog-status">Datastatus<\/label>/);
  assert.doesNotMatch(source, /aria-label="Filtrer på/);
});

test("om-tallene uses tags for textual metadata instead of status badges", () => {
  const source = readFileSync(path.join(repoRoot, "src/app/om-tallene/page.tsx"), "utf8");

  assert.doesNotMatch(source, /\bBadge\b/);
  assert.match(source, /<Tag data-color="neutral">/);
});

test("om-tallene related statistics stay in-page until detail routes exist", () => {
  const source = readFileSync(path.join(repoRoot, "src/app/om-tallene/page.tsx"), "utf8");

  assert.doesNotMatch(source, /<Link href=\{related\.path\}/);
  assert.match(source, /onRelatedSelect/);
  for (const entry of SAMFUNNSPULS_CATALOG) {
    for (const related of entry.relatedStatistics ?? []) {
      assert.equal("path" in related, false, `${entry.slug} should not link related statistic ${related.title} to an unimplemented route`);
    }
  }
});

test("home page surfaces a kommune picker as the primary entry point", () => {
  const source = readFileSync(path.join(repoRoot, "src/app/page.tsx"), "utf8");

  assert.match(source, /\bSuggestion\b/);
  assert.match(source, /multiple=\{false\}/);
  assert.match(source, /selected=\{selectedAreaOption \?\? null\}/);
  assert.doesNotMatch(source, /name="kommune"/);
  assert.match(source, /findDefaultArea\(data\.areas\)/);
  assert.match(source, /municipality === "Oslo"/);
  assert.doesNotMatch(source, /Samfunnspuls case/);
  assert.match(source, /Hva trenger lokalsamfunnet ditt/);
});

test("site header exposes global data search routed to /om-tallene", () => {
  const source = readFileSync(path.join(repoRoot, "src/app/components/site-header.tsx"), "utf8");

  assert.match(source, /getGlobalSearchSuggestions/);
  assert.match(source, /Søk i Samfunnspuls/);
  assert.match(source, /\/om-tallene\?q=/);
});
