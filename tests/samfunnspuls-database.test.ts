import assert from "node:assert/strict";
import test from "node:test";

import { SAMFUNNSPULS_CATALOG } from "../src/lib/samfunnspuls/catalog";
import { toCatalogDatabaseRows } from "../src/lib/samfunnspuls/database";

test("catalog database rows preserve every catalog entry with searchable text", () => {
  const rows = toCatalogDatabaseRows(SAMFUNNSPULS_CATALOG);

  assert.equal(rows.length, SAMFUNNSPULS_CATALOG.length);
  assert.equal(new Set(rows.map((row) => row.slug)).size, rows.length);
  assert.ok(rows.every((row) => row.search_text.length > row.title.length));
});

test("catalog database rows keep typed arrays and json metadata for Supabase", () => {
  const lavinntekt = toCatalogDatabaseRows(SAMFUNNSPULS_CATALOG).find((row) => row.slug === "lavinntekt");

  assert.ok(lavinntekt);
  assert.deepEqual(lavinntekt.ssb_table_ids, ["08764"]);
  assert.deepEqual(lavinntekt.value_types, ["count", "percent"]);
  assert.equal(lavinntekt.status, "integrated");
  assert.equal(lavinntekt.about_numbers?.countDate, "31. desember");
  assert.match(lavinntekt.search_text, /08764/);
  assert.match(lavinntekt.search_text, /fattigdom/);
});
