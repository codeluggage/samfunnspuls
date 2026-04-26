import assert from "node:assert/strict";
import test from "node:test";

import {
  APP_NAV_ITEMS,
  getGlobalSearchSuggestions,
  getViewCards,
} from "../src/lib/app-navigation";

test("app navigation exposes home, analysis, and raw data views", () => {
  assert.deepEqual(
    APP_NAV_ITEMS.map((item) => [item.label, item.href]),
    [
      ["Samfunnspuls", "/"],
      ["Aktivitetsradar", "/aktivitetsradar"],
      ["Utforsk data", "/utforsk-data"],
    ],
  );
});

test("view cards include the integrated activity radar as a data view", () => {
  const cards = getViewCards();
  const radar = cards.find((card) => card.href === "/aktivitetsradar");

  assert.equal(radar?.status, "Klar");
  assert.match(radar?.description ?? "", /lavinntekt/i);
  assert.match(radar?.description ?? "", /Røde Kors/i);
});

test("global search suggestions include catalog hits and app views", () => {
  const suggestions = getGlobalSearchSuggestions("lavinntekt");

  assert.equal(suggestions[0]?.href, "/aktivitetsradar");
  assert.ok(
    suggestions.some(
      (suggestion) => suggestion.href.includes("/utforsk-data?") && suggestion.title.includes("lavinntekt"),
    ),
    "expected lavinntekt catalog suggestion",
  );
});
