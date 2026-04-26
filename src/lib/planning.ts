import { INDICATORS, INDICATOR_ORDER } from "./samfunnspuls/indicators";
import type { IndicatorDefinition, IndicatorId } from "./samfunnspuls/indicators";

export type BranchInput = {
  branchId: string;
  branchName: string;
  municipality: string | null;
  county: string | null;
  isActive: boolean;
  email?: string | null;
  phone?: string | null;
  web?: string | null;
  activities: string[];
};

export type IndicatorReading = {
  indicatorId: IndicatorId;
  regionCode: string;
  municipality: string;
  county: string | null;
  period: string;
  value: number | null;
  sourceUpdatedAt: string | null;
};

export type IndicatorSnapshot = {
  indicator: IndicatorDefinition;
  period: string;
  value: number | null;
  nationalAverage: number | null;
  rank: number | null;
  totalRanked: number;
  comparison: "above-average" | "near-average" | "below-average" | "no-comparison";
};

export type ActivityCoverage = {
  activityName: string;
  branchesCount: number;
};

export type AreaProfile = {
  regionCode: string;
  municipality: string;
  county: string | null;
  population: number | null;
  indicators: IndicatorSnapshot[];
  pressureScore: number | null;
  pressureBand: "high" | "moderate" | "lower" | "unknown";
  narrative: string;
  activeBranchesCount: number;
  matchingBranchesCount: number;
  topRelevantActivities: ActivityCoverage[];
  branches: Array<{
    branchId: string;
    branchName: string;
    county: string | null;
    municipality: string | null;
    relevantActivities: string[];
    allActivitiesCount: number;
    email?: string | null;
    phone?: string | null;
    web?: string | null;
  }>;
};

export type AreaProfileBundle = {
  areas: AreaProfile[];
  generatedAt: string;
  sources: Array<{
    id: string;
    label: string;
    url: string;
    sourceUpdatedAt: string | null;
    importedAt: string;
  }>;
};

const RELEVANT_ACTIVITY_NAMES = [
  "Barnas Røde Kors",
  "Digital leksehjelp",
  "Ferie for alle",
  "Flyktningguide",
  "Leksehjelp",
  "Mentorfamilie",
  "Møteplass Fellesverkene",
  "Møteplasser",
  "Norsktrening",
  "Språkgruppe",
  "Treffpunkt - Røde Kors Ungdom",
  "Vennefamilie",
  "Øvrige aktiviteter - Røde Kors Ungdom",
];

const RELEVANT_ACTIVITY_SET = new Set(RELEVANT_ACTIVITY_NAMES);

type JsonStatDimension = {
  category: {
    index: Record<string, number>;
    label: Record<string, string>;
  };
};

type JsonStatDataset = {
  updated?: string;
  id: string[];
  size: number[];
  dimension: Record<string, JsonStatDimension>;
  value: Array<number | null>;
};

export function cleanMunicipalityName(value: string): string {
  return value
    .replace(/\s+-\s+.+$/, "")
    .replace(/\s+\(.+\)$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeName(value: string | null | undefined): string {
  return cleanMunicipalityName(value ?? "")
    .toLocaleLowerCase("nb-NO")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getRelevantActivities(activityNames: string[]): string[] {
  return [...new Set(activityNames.filter((name) => RELEVANT_ACTIVITY_SET.has(name)))]
    .sort((a, b) => a.localeCompare(b, "nb-NO"));
}

export function isRelevantActivity(activityName: string): boolean {
  return RELEVANT_ACTIVITY_SET.has(activityName);
}

export function parseLowIncomeJsonStat(dataset: unknown): IndicatorReading[] {
  const parsed = dataset as JsonStatDataset;
  const regionDimension = parsed.dimension.Region;
  const contentsDimension = parsed.dimension.ContentsCode;
  const timeDimension = parsed.dimension.Tid;
  const timeCodes = codesByIndex(timeDimension);
  const latestYear = timeCodes[timeCodes.length - 1];
  const latestYearIndex = timeDimension.category.index[latestYear];
  const contentsSize = parsed.size[parsed.id.indexOf("ContentsCode")];
  const timeSize = parsed.size[parsed.id.indexOf("Tid")];

  return codesByIndex(regionDimension).map((regionCode) => {
    const regionIndex = regionDimension.category.index[regionCode];
    const lowIncomePercent = valueAt(
      parsed,
      regionIndex,
      contentsDimension.category.index.EUskala60,
      latestYearIndex,
      contentsSize,
      timeSize,
    );

    return {
      indicatorId: "low-income-children" as const,
      regionCode,
      municipality: cleanMunicipalityName(regionDimension.category.label[regionCode]),
      county: null,
      period: latestYear,
      value: lowIncomePercent,
      sourceUpdatedAt: parsed.updated ?? null,
    };
  });
}

export function parsePopulationJsonStat(dataset: unknown): IndicatorReading[] {
  const parsed = dataset as JsonStatDataset;
  const regionDimension = parsed.dimension.Region;
  const contentsDimension = parsed.dimension.ContentsCode;
  const timeDimension = parsed.dimension.Tid;
  const timeCodes = codesByIndex(timeDimension);
  const contentsSize = parsed.size[parsed.id.indexOf("ContentsCode")];
  const timeSize = parsed.size[parsed.id.indexOf("Tid")];

  const populationIndex = contentsDimension.category.index.Folkemengde;
  const growthIndex = contentsDimension.category.index.Folketilvekst;
  const netMigrationIndex = contentsDimension.category.index.Nettoinnflytting;

  const readings: IndicatorReading[] = [];

  function latestNonNull(
    regionIndex: number,
    contentsIndex: number,
  ): { value: number; period: string } | null {
    for (let timeOffset = timeCodes.length - 1; timeOffset >= 0; timeOffset--) {
      const period = timeCodes[timeOffset];
      const timeIndex = timeDimension.category.index[period];
      const value = valueAt(parsed, regionIndex, contentsIndex, timeIndex, contentsSize, timeSize);
      if (value !== null) return { value, period };
    }
    return null;
  }

  for (const regionCode of codesByIndex(regionDimension)) {
    const regionIndex = regionDimension.category.index[regionCode];
    const municipality = cleanMunicipalityName(regionDimension.category.label[regionCode]);

    const population = latestNonNull(regionIndex, populationIndex);
    const growth = latestNonNull(regionIndex, growthIndex);
    const netMigration = latestNonNull(regionIndex, netMigrationIndex);

    const populationForRates = population?.value ?? null;

    readings.push({
      indicatorId: "population-total",
      regionCode,
      municipality,
      county: null,
      period: population?.period ?? "",
      value: population?.value ?? null,
      sourceUpdatedAt: parsed.updated ?? null,
    });
    readings.push({
      indicatorId: "population-growth",
      regionCode,
      municipality,
      county: null,
      period: growth?.period ?? "",
      value:
        growth && populationForRates && populationForRates > 0
          ? (growth.value / populationForRates) * 1000
          : null,
      sourceUpdatedAt: parsed.updated ?? null,
    });
    readings.push({
      indicatorId: "net-migration",
      regionCode,
      municipality,
      county: null,
      period: netMigration?.period ?? "",
      value:
        netMigration && populationForRates && populationForRates > 0
          ? (netMigration.value / populationForRates) * 1000
          : null,
      sourceUpdatedAt: parsed.updated ?? null,
    });
  }

  return readings;
}

export function buildAreaProfiles({
  readings,
  branches,
}: {
  readings: IndicatorReading[];
  branches: BranchInput[];
}): AreaProfile[] {
  const activeBranches = branches.filter((branch) => branch.isActive);

  const readingsByRegion = new Map<string, Map<IndicatorId, IndicatorReading>>();
  const municipalityByRegion = new Map<string, string>();
  const countyByRegion = new Map<string, string | null>();

  for (const reading of readings) {
    const regionMap = readingsByRegion.get(reading.regionCode) ?? new Map();
    regionMap.set(reading.indicatorId, reading);
    readingsByRegion.set(reading.regionCode, regionMap);
    if (!municipalityByRegion.has(reading.regionCode)) {
      municipalityByRegion.set(reading.regionCode, reading.municipality);
    }
  }

  const branchesByMunicipality = new Map<string, BranchInput[]>();
  for (const branch of activeBranches) {
    const key = normalizeName(branch.municipality);
    if (!key) continue;
    const existing = branchesByMunicipality.get(key) ?? [];
    existing.push(branch);
    branchesByMunicipality.set(key, existing);
  }

  for (const [regionCode, name] of municipalityByRegion) {
    const branchesForArea = branchesByMunicipality.get(normalizeName(name)) ?? [];
    const county = branchesForArea.find((branch) => branch.county)?.county ?? null;
    countyByRegion.set(regionCode, county);
  }

  const nationalAverages = new Map<IndicatorId, number>();
  const totals = new Map<IndicatorId, number[]>();
  for (const indicatorId of INDICATOR_ORDER) {
    const values: number[] = [];
    for (const [regionCode, regionReadings] of readingsByRegion) {
      if (regionCode === "0" || regionCode.length !== 4) continue;
      const reading = regionReadings.get(indicatorId);
      if (reading?.value !== null && reading?.value !== undefined) {
        values.push(reading.value);
      }
    }
    totals.set(indicatorId, values);
    if (values.length > 0) {
      nationalAverages.set(indicatorId, values.reduce((sum, value) => sum + value, 0) / values.length);
    }
  }

  const ranks = new Map<IndicatorId, Map<string, number>>();
  for (const indicatorId of INDICATOR_ORDER) {
    const indicator = INDICATORS[indicatorId];
    if (indicator.direction === "context-only") continue;
    const ranked = [...readingsByRegion.entries()]
      .filter(([regionCode]) => regionCode !== "0" && regionCode.length === 4)
      .map(([regionCode, regionReadings]) => ({
        regionCode,
        value: regionReadings.get(indicatorId)?.value ?? null,
      }))
      .filter((entry): entry is { regionCode: string; value: number } => entry.value !== null)
      .sort((a, b) =>
        indicator.direction === "higher-is-pressure" ? b.value - a.value : a.value - b.value,
      );
    const rankMap = new Map<string, number>();
    ranked.forEach((entry, index) => rankMap.set(entry.regionCode, index + 1));
    ranks.set(indicatorId, rankMap);
  }

  const profiles: AreaProfile[] = [];

  for (const [regionCode, regionReadings] of readingsByRegion) {
    if (regionCode === "0") continue;
    if (regionCode.length !== 4) continue;
    const municipality = municipalityByRegion.get(regionCode);
    if (!municipality) continue;

    const branchesForArea = branchesByMunicipality.get(normalizeName(municipality)) ?? [];
    const branchesWithActivity = branchesForArea
      .map((branch) => ({
        ...branch,
        relevantActivities: getRelevantActivities(branch.activities),
      }))
      .filter((branch) => branch.relevantActivities.length > 0);

    const activityCounts = new Map<string, number>();
    for (const branch of branchesWithActivity) {
      for (const activity of branch.relevantActivities) {
        activityCounts.set(activity, (activityCounts.get(activity) ?? 0) + 1);
      }
    }

    const indicators: IndicatorSnapshot[] = INDICATOR_ORDER.map((indicatorId) => {
      const reading = regionReadings.get(indicatorId);
      const indicator = INDICATORS[indicatorId];
      const nationalAverage = nationalAverages.get(indicatorId) ?? null;
      const rankMap = ranks.get(indicatorId);
      const totalRanked = rankMap?.size ?? 0;
      const rank = rankMap?.get(regionCode) ?? null;
      const value = reading?.value ?? null;

      let comparison: IndicatorSnapshot["comparison"] = "no-comparison";
      if (value !== null && nationalAverage !== null) {
        const delta = value - nationalAverage;
        const sensitivity = Math.max(Math.abs(nationalAverage) * 0.15, 0.5);
        if (delta > sensitivity) comparison = "above-average";
        else if (delta < -sensitivity) comparison = "below-average";
        else comparison = "near-average";
      }

      return {
        indicator,
        period: reading?.period ?? "",
        value,
        nationalAverage,
        rank,
        totalRanked,
        comparison,
      };
    });

    const lowIncomeSnapshot = indicators.find((s) => s.indicator.id === "low-income-children");
    const populationSnapshot = indicators.find((s) => s.indicator.id === "population-total");
    const pressureScore = computePressureScore(lowIncomeSnapshot);
    const pressureBand = bandForScore(pressureScore);

    profiles.push({
      regionCode,
      municipality,
      county: countyByRegion.get(regionCode) ?? null,
      population: populationSnapshot?.value ?? null,
      indicators,
      pressureScore,
      pressureBand,
      narrative: buildNarrative({
        municipality,
        indicators,
        branchesWithActivityCount: branchesWithActivity.length,
      }),
      activeBranchesCount: branchesForArea.length,
      matchingBranchesCount: branchesWithActivity.length,
      topRelevantActivities: [...activityCounts]
        .map(([activityName, branchesCount]) => ({ activityName, branchesCount }))
        .sort(
          (a, b) =>
            b.branchesCount - a.branchesCount ||
            a.activityName.localeCompare(b.activityName, "nb-NO"),
        )
        .slice(0, 6),
      branches: branchesForArea
        .map((branch) => ({
          branchId: branch.branchId,
          branchName: branch.branchName,
          county: branch.county,
          municipality: branch.municipality,
          relevantActivities: getRelevantActivities(branch.activities),
          allActivitiesCount: branch.activities.length,
          email: branch.email,
          phone: branch.phone,
          web: branch.web,
        }))
        .sort(
          (a, b) =>
            b.relevantActivities.length - a.relevantActivities.length ||
            a.branchName.localeCompare(b.branchName, "nb-NO"),
        ),
    });
  }

  return profiles.sort(
    (a, b) =>
      (b.pressureScore ?? -Infinity) - (a.pressureScore ?? -Infinity) ||
      a.municipality.localeCompare(b.municipality, "nb-NO"),
  );
}

function computePressureScore(
  lowIncome: IndicatorSnapshot | undefined,
): number | null {
  if (!lowIncome || lowIncome.value === null) return null;
  return lowIncome.value;
}

function bandForScore(score: number | null): AreaProfile["pressureBand"] {
  if (score === null) return "unknown";
  if (score >= 12) return "high";
  if (score >= 9) return "moderate";
  return "lower";
}

function buildNarrative({
  municipality,
  indicators,
  branchesWithActivityCount,
}: {
  municipality: string;
  indicators: IndicatorSnapshot[];
  branchesWithActivityCount: number;
}): string {
  const lowIncome = indicators.find((s) => s.indicator.id === "low-income-children");
  const growth = indicators.find((s) => s.indicator.id === "population-growth");
  const netMigration = indicators.find((s) => s.indicator.id === "net-migration");

  const sentences: string[] = [];

  if (lowIncome?.value !== null && lowIncome?.value !== undefined && lowIncome.nationalAverage !== null) {
    const compare =
      lowIncome.comparison === "above-average"
        ? "høyere enn landsgjennomsnittet"
        : lowIncome.comparison === "below-average"
          ? "lavere enn landsgjennomsnittet"
          : "rundt landsgjennomsnittet";
    sentences.push(
      `Andelen barn i lavinntekt i ${municipality} er ${compare} (${formatPercent(lowIncome.value)} mot ${formatPercent(lowIncome.nationalAverage)} nasjonalt).`,
    );
  }

  if (growth?.value !== null && growth?.value !== undefined) {
    if (growth.value > 5) {
      sentences.push(
        `Folketallet vokser raskt — netto vekst tilsvarer ${formatPerMille(growth.value)} per 1 000 innbyggere siste år.`,
      );
    } else if (growth.value < -5) {
      sentences.push(
        `Folketallet synker — netto endring var ${formatPerMille(growth.value)} per 1 000 innbyggere siste år.`,
      );
    } else {
      sentences.push(
        `Folketallet er relativt stabilt (${formatPerMille(growth.value)} per 1 000 innbyggere).`,
      );
    }
  }

  if (netMigration?.value !== null && netMigration?.value !== undefined) {
    if (netMigration.value > 5) {
      sentences.push(
        `Kommunen har stor tilflytting (${formatPerMille(netMigration.value)} per 1 000), noe som kan bety nye behov for integrering, norsktrening og møteplasser.`,
      );
    } else if (netMigration.value < -5) {
      sentences.push(
        `Det er netto utflytting (${formatPerMille(netMigration.value)} per 1 000), som ofte påvirker eldre som blir igjen og lokalt frivillig miljø.`,
      );
    }
  }

  if (branchesWithActivityCount === 0) {
    sentences.push(
      `Ingen registrerte Røde Kors-aktiviteter i de prioriterte kategoriene her i dag — dette er et område der nye tilbud kan ha stor effekt.`,
    );
  } else if (branchesWithActivityCount === 1) {
    sentences.push(
      `Én lokal Røde Kors-forening tilbyr i dag relevante aktiviteter — kapasiteten er begrenset.`,
    );
  } else {
    sentences.push(
      `${branchesWithActivityCount} lokale Røde Kors-foreninger tilbyr i dag relevante aktiviteter i kommunen.`,
    );
  }

  return sentences.join(" ");
}

function formatPercent(value: number): string {
  return `${value.toLocaleString("nb-NO", { maximumFractionDigits: 1 })} %`;
}

function formatPerMille(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("nb-NO", { maximumFractionDigits: 1 })}`;
}

function codesByIndex(dimension: JsonStatDimension): string[] {
  return Object.entries(dimension.category.index)
    .sort(([, left], [, right]) => left - right)
    .map(([code]) => code);
}

function valueAt(
  dataset: JsonStatDataset,
  regionIndex: number,
  contentsIndex: number,
  timeIndex: number,
  contentsSize: number,
  timeSize: number,
): number | null {
  const index = regionIndex * contentsSize * timeSize + contentsIndex * timeSize + timeIndex;
  return dataset.value[index] ?? null;
}
