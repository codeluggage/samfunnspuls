import assert from "node:assert/strict";
import test from "node:test";

import { SAMFUNNSPULS_CATALOG } from "../src/lib/samfunnspuls/catalog";
import {
  getCatalogFilterOptions,
  normalizeSearchText,
  searchCatalog,
} from "../src/lib/samfunnspuls/search";

test("normalizeSearchText makes Norwegian text and punctuation searchable", () => {
  assert.equal(normalizeSearchText("Røde Kors – EU-60, 31. desember"), "røde kors eu 60 31 desember");
  assert.equal(normalizeSearchText("  NAV   arbeidsledige  "), "nav arbeidsledige");
});

test("searchCatalog finds known sources by topic and source IDs", () => {
  assert.equal(topSlug("lavinntekt"), "lavinntekt");
  assert.equal(topSlug("08764"), "lavinntekt");
  assert.equal(topSlug("folketilvekst"), "befolkningsendring-folketilvekst");
  assert.equal(topSlug("06913"), "befolkningsendring-folketilvekst");
  assert.equal(topSlug("NAV arbeidsledige"), "registrerte-arbeidsledige-etter-maned");
  assert.equal(topSlug("sykehjem 12292"), "sykehjem");
});

test("searchCatalog searches captured explanatory text", () => {
  const results = searchCatalog(SAMFUNNSPULS_CATALOG, { query: "EU-ekvivalensskala" });

  assert.equal(results[0]?.entry.slug, "lavinntekt");
  assert.ok(results[0].matchedFields.includes("aboutNumbers"));
});

test("searchCatalog filters by category, source, value type, and readiness status", () => {
  const categoryResults = searchCatalog(SAMFUNNSPULS_CATALOG, {
    query: "lavinntekt",
    filters: { category: "Økonomi" },
  });
  assert.equal(categoryResults[0]?.entry.slug, "personer-som-tilhorer-husholdninger-med-lavinntekt-eu-60-hele-befolkningen");

  const navResults = searchCatalog(SAMFUNNSPULS_CATALOG, {
    query: "arbeidsledige",
    filters: { source: "NAV" },
  });
  assert.deepEqual(navResults.map((result) => result.entry.slug), ["registrerte-arbeidsledige-etter-maned"]);

  const kronerResults = searchCatalog(SAMFUNNSPULS_CATALOG, {
    query: "sosialhjelp",
    filters: { valueType: "kroner" },
  });
  assert.ok(kronerResults.every((result) => result.entry.valueTypes.includes("kroner")));

  const integratedResults = searchCatalog(SAMFUNNSPULS_CATALOG, {
    query: "",
    filters: { status: "integrated" },
  });
  assert.deepEqual(integratedResults.map((result) => result.entry.slug), ["lavinntekt"]);
});

test("getCatalogFilterOptions returns stable option lists", () => {
  const options = getCatalogFilterOptions(SAMFUNNSPULS_CATALOG);

  assert.ok(options.categories.includes("Barn og unge"));
  assert.ok(options.sources.includes("NAV"));
  assert.ok(options.valueTypes.includes("percent"));
  assert.ok(options.statuses.includes("api-known"));
});

function topSlug(query: string) {
  const results = searchCatalog(SAMFUNNSPULS_CATALOG, { query });
  assert.ok(results[0], `Expected results for ${query}`);
  return results[0].entry.slug;
}
