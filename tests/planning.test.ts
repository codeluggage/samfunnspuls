import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAreaPlans,
  getRelevantActivities,
  parseLowIncomeJsonStat,
} from "../src/lib/planning";

const jsonStatSample = {
  version: "2.0",
  class: "dataset",
  label: "08764",
  source: "Statistisk sentralbyrå",
  updated: "2026-01-16T07:00:00Z",
  id: ["Region", "ContentsCode", "Tid"],
  size: [2, 2, 1],
  dimension: {
    Region: {
      category: {
        index: { "0301": 0, "1103": 1 },
        label: { "0301": "Oslo - Oslove", "1103": "Stavanger" },
      },
    },
    ContentsCode: {
      category: {
        index: { Personer: 0, EUskala60: 1 },
        label: {
          Personer: "Personer under 18 år",
          EUskala60: "EU-skala 60 prosent",
        },
      },
    },
    Tid: {
      category: {
        index: { "2024": 0 },
        label: { "2024": "2024" },
      },
    },
  },
  value: [130343, 13, 31018, 9.9],
};

test("parseLowIncomeJsonStat returns municipality rows for the latest queried year", () => {
  assert.deepEqual(parseLowIncomeJsonStat(jsonStatSample), [
    {
      regionCode: "0301",
      municipality: "Oslo",
      year: "2024",
      childrenCount: 130343,
      lowIncomePercent: 13,
      sourceUpdatedAt: "2026-01-16T07:00:00Z",
    },
    {
      regionCode: "1103",
      municipality: "Stavanger",
      year: "2024",
      childrenCount: 31018,
      lowIncomePercent: 9.9,
      sourceUpdatedAt: "2026-01-16T07:00:00Z",
    },
  ]);
});

test("getRelevantActivities keeps youth and integration activities with stable labels", () => {
  const activities = getRelevantActivities([
    "Hjelpekorps",
    "Barnas Røde Kors",
    "Møteplass Fellesverkene",
    "Leksehjelp",
    "Leksehjelp",
    "Flyktningguide",
  ]);

  assert.deepEqual(activities, [
    "Barnas Røde Kors",
    "Flyktningguide",
    "Leksehjelp",
    "Møteplass Fellesverkene",
  ]);
});

test("buildAreaPlans joins need and local Red Cross activity coverage", () => {
  const plans = buildAreaPlans({
    needs: parseLowIncomeJsonStat(jsonStatSample),
    branches: [
      {
        branchId: "A",
        branchName: "Oslo Røde Kors",
        municipality: "Oslo",
        county: "Oslo",
        isActive: true,
        activities: ["Leksehjelp", "Barnas Røde Kors", "Hjelpekorps"],
      },
      {
        branchId: "B",
        branchName: "Stavanger Røde Kors",
        municipality: "Stavanger",
        county: "Rogaland",
        isActive: true,
        activities: ["Besøkstjeneste"],
      },
    ],
    importedAt: "2026-04-24T12:00:00.000Z",
  });

  assert.equal(plans[0].municipality, "Oslo");
  assert.equal(plans[0].planningSignal.level, "high-covered");
  assert.equal(plans[0].matchingBranchesCount, 1);
  assert.deepEqual(plans[0].topRelevantActivities, [
    { activityName: "Barnas Røde Kors", branchesCount: 1 },
    { activityName: "Leksehjelp", branchesCount: 1 },
  ]);

  assert.equal(plans[1].municipality, "Stavanger");
  assert.equal(plans[1].planningSignal.level, "moderate-limited");
  assert.equal(plans[1].matchingBranchesCount, 0);
});
