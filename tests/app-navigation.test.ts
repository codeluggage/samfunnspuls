import assert from "node:assert/strict";
import test from "node:test";

import {
  APP_NAV_ITEMS,
  getGlobalSearchSuggestions,
} from "../src/lib/app-navigation";

test("app navigation surfaces the planning home and the data sources page", () => {
  assert.deepEqual(
    APP_NAV_ITEMS.map((item) => [item.label, item.href]),
    [
      ["Samfunnspuls", "/"],
      ["Om tallene", "/om-tallene"],
    ],
  );
});

test("global search routes catalog hits to /om-tallene", () => {
  const suggestions = getGlobalSearchSuggestions("lavinntekt");
  assert.ok(suggestions.length > 0, "expected at least one suggestion");
  assert.ok(
    suggestions.some(
      (suggestion) => suggestion.href.includes("/om-tallene?") && /lavinntekt/i.test(suggestion.title),
    ),
    "expected lavinntekt catalog suggestion under /om-tallene",
  );
});

test("empty query returns view-level suggestions", () => {
  const suggestions = getGlobalSearchSuggestions("");
  assert.ok(suggestions.some((suggestion) => suggestion.href === "/"));
  assert.ok(suggestions.some((suggestion) => suggestion.href === "/om-tallene"));
});
