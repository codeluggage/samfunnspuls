import assert from "node:assert/strict";
import test from "node:test";

import {
  SAMFUNNSPULS_CATALOG,
  type SamfunnspulsCatalogEntry,
} from "../src/lib/samfunnspuls/catalog";

test("catalog contains the known 37 Samfunnspuls statistics", () => {
  assert.equal(SAMFUNNSPULS_CATALOG.length, 37);
});

test("catalog entries have required domain fields and unique slugs", () => {
  const slugs = new Set<string>();

  for (const entry of SAMFUNNSPULS_CATALOG) {
    assert.ok(entry.slug, "slug is required");
    assert.ok(entry.path.startsWith("/utforsk-data/"), `${entry.slug} path should be rebuilt app path`);
    assert.ok(entry.title, `${entry.slug} title is required`);
    assert.ok(entry.category, `${entry.slug} category is required`);
    assert.ok(entry.source, `${entry.slug} source is required`);
    assert.ok(entry.status, `${entry.slug} status is required`);
    assert.ok(entry.valueTypes.length > 0, `${entry.slug} valueTypes are required`);
    assert.ok(entry.geographies.length > 0, `${entry.slug} geographies are required`);
    assert.ok(entry.timeDimensions.length > 0, `${entry.slug} timeDimensions are required`);
    assert.ok(entry.tags.length > 0, `${entry.slug} tags are required`);
    assert.equal(slugs.has(entry.slug), false, `${entry.slug} is duplicated`);
    slugs.add(entry.slug);
  }
});

test("catalog entries do not carry legacy site workflow fields", () => {
  for (const entry of SAMFUNNSPULS_CATALOG as Array<SamfunnspulsCatalogEntry & Record<string, unknown>>) {
    assert.equal("originalUrl" in entry, false, `${entry.slug} should not include originalUrl`);
    assert.equal("legacyUrl" in entry, false, `${entry.slug} should not include legacyUrl`);
    assert.equal("inspectionNotes" in entry, false, `${entry.slug} should not include inspectionNotes`);
    assert.equal("needsInspection" in entry, false, `${entry.slug} should not include needsInspection`);
  }
});

test("lavinntekt entry captures integrated low-income child poverty source details", () => {
  const entry = findEntry("lavinntekt");

  assert.equal(entry.title, "Barn og unge i husholdninger med lavinntekt (EU-60)");
  assert.equal(entry.category, "Barn og unge");
  assert.equal(entry.status, "integrated");
  assert.deepEqual(entry.ssbTables?.map((table) => table.id), ["08764"]);
  assert.equal(entry.aboutNumbers?.dataType, "registerdata");
  assert.equal(entry.aboutNumbers?.countDate, "31. desember");
  assert.match(entry.aboutNumbers?.definitions?.join(" ") ?? "", /EU-ekvivalensskala/);
});

test("befolkningsendring entry captures known SSB table and report details", () => {
  const entry = findEntry("befolkningsendring-folketilvekst");

  assert.equal(entry.title, "Befolkningsendring");
  assert.equal(entry.category, "Demografi og boforhold");
  assert.equal(entry.status, "api-known");
  assert.equal(entry.powerBiReportId, "92bfaba4-445d-4581-a6d0-0d4b103f146f");
  assert.deepEqual(entry.ssbTables?.map((table) => table.id), ["06913"]);
  assert.equal(entry.aboutNumbers?.collectionMethod, "fra SSBs åpne API");
});

function findEntry(slug: string) {
  const entry = SAMFUNNSPULS_CATALOG.find((candidate) => candidate.slug === slug);
  assert.ok(entry, `Expected catalog entry ${slug}`);
  return entry;
}
