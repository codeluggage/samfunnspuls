import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAreaProfiles,
  getRelevantActivities,
  parseLowIncomeJsonStat,
  parsePopulationJsonStat,
} from "../src/lib/planning";

const lowIncomeSample = {
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

const populationSample = {
  version: "2.0",
  class: "dataset",
  label: "06913",
  source: "Statistisk sentralbyrå",
  updated: "2026-01-16T07:00:00Z",
  id: ["Region", "ContentsCode", "Tid"],
  size: [2, 3, 1],
  dimension: {
    Region: {
      category: {
        index: { "0301": 0, "1103": 1 },
        label: { "0301": "Oslo", "1103": "Stavanger" },
      },
    },
    ContentsCode: {
      category: {
        index: { Folkemengde: 0, Folketilvekst: 1, Nettoinnflytting: 2 },
        label: {
          Folkemengde: "Befolkning 1. januar",
          Folketilvekst: "Folketilvekst",
          Nettoinnflytting: "Nettoinnflytting",
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
  value: [700000, 7000, 3500, 150000, -300, 200],
};

test("parseLowIncomeJsonStat returns indicator readings for the latest year", () => {
  const readings = parseLowIncomeJsonStat(lowIncomeSample);
  assert.equal(readings.length, 2);
  assert.equal(readings[0].indicatorId, "low-income-children");
  assert.equal(readings[0].municipality, "Oslo");
  assert.equal(readings[0].value, 13);
  assert.equal(readings[1].municipality, "Stavanger");
  assert.equal(readings[1].value, 9.9);
});

test("parsePopulationJsonStat emits population, growth and net-migration per mille", () => {
  const readings = parsePopulationJsonStat(populationSample);
  const oslo = readings.filter((r) => r.regionCode === "0301");
  const stavanger = readings.filter((r) => r.regionCode === "1103");

  const osloPopulation = oslo.find((r) => r.indicatorId === "population-total");
  const osloGrowth = oslo.find((r) => r.indicatorId === "population-growth");
  const osloMigration = oslo.find((r) => r.indicatorId === "net-migration");

  assert.equal(osloPopulation?.value, 700000);
  assert.equal(osloGrowth?.value, 10); // 7000 / 700000 * 1000
  assert.equal(osloMigration?.value, 5); // 3500 / 700000 * 1000

  const stavangerGrowth = stavanger.find((r) => r.indicatorId === "population-growth");
  assert.ok(stavangerGrowth);
  assert.ok(stavangerGrowth.value !== null && stavangerGrowth.value < 0);
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

test("buildAreaProfiles joins indicators with Røde Kors activity coverage", () => {
  const readings = [
    ...parseLowIncomeJsonStat(lowIncomeSample),
    ...parsePopulationJsonStat(populationSample),
  ];

  const profiles = buildAreaProfiles({
    readings,
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
  });

  const oslo = profiles.find((profile) => profile.municipality === "Oslo");
  const stavanger = profiles.find((profile) => profile.municipality === "Stavanger");

  assert.ok(oslo);
  assert.equal(oslo.pressureBand, "high");
  assert.equal(oslo.matchingBranchesCount, 1);
  assert.equal(oslo.population, 700000);
  assert.deepEqual(
    oslo.topRelevantActivities.map((activity) => activity.activityName).sort(),
    ["Barnas Røde Kors", "Leksehjelp"],
  );
  assert.match(oslo.narrative, /Oslo/);

  assert.ok(stavanger);
  assert.equal(stavanger.pressureBand, "moderate");
  assert.equal(stavanger.matchingBranchesCount, 0);
});
