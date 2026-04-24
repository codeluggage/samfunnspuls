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

export type LowIncomeNeed = {
  regionCode: string;
  municipality: string;
  year: string;
  childrenCount: number | null;
  lowIncomePercent: number | null;
  sourceUpdatedAt: string | null;
};

export type ActivityCoverage = {
  activityName: string;
  branchesCount: number;
};

export type PlanningSignalLevel =
  | "high-covered"
  | "high-limited"
  | "moderate-covered"
  | "moderate-limited"
  | "lower";

export type AreaPlan = {
  regionCode: string;
  municipality: string;
  county: string | null;
  year: string;
  childrenCount: number | null;
  lowIncomePercent: number | null;
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
  planningSignal: {
    level: PlanningSignalLevel;
    title: string;
    summary: string;
  };
  source: {
    ssbTable: "08764";
    ssbUpdatedAt: string | null;
    importedAt: string;
  };
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

export function parseLowIncomeJsonStat(dataset: unknown): LowIncomeNeed[] {
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
    const childCount = valueAt(parsed, regionIndex, contentsDimension.category.index.Personer, latestYearIndex, contentsSize, timeSize);
    const lowIncomePercent = valueAt(parsed, regionIndex, contentsDimension.category.index.EUskala60, latestYearIndex, contentsSize, timeSize);

    return {
      regionCode,
      municipality: cleanMunicipalityName(regionDimension.category.label[regionCode]),
      year: latestYear,
      childrenCount: childCount,
      lowIncomePercent,
      sourceUpdatedAt: parsed.updated ?? null,
    };
  });
}

export function buildAreaPlans({
  needs,
  branches,
  importedAt,
}: {
  needs: LowIncomeNeed[];
  branches: BranchInput[];
  importedAt: string;
}): AreaPlan[] {
  const activeBranches = branches.filter((branch) => branch.isActive);
  const ssbTable = "08764" as const;

  return needs
    .map((need) => {
      const municipalityKey = normalizeName(need.municipality);
      const localBranches = activeBranches.filter(
        (branch) => normalizeName(branch.municipality) === municipalityKey,
      );
      const branchesWithActivity = localBranches
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

      return {
        regionCode: need.regionCode,
        municipality: need.municipality,
        county: localBranches.find((branch) => branch.county)?.county ?? null,
        year: need.year,
        childrenCount: need.childrenCount,
        lowIncomePercent: need.lowIncomePercent,
        activeBranchesCount: localBranches.length,
        matchingBranchesCount: branchesWithActivity.length,
        topRelevantActivities: [...activityCounts]
          .map(([activityName, branchesCount]) => ({ activityName, branchesCount }))
          .sort((a, b) => b.branchesCount - a.branchesCount || a.activityName.localeCompare(b.activityName, "nb-NO"))
          .slice(0, 6),
        branches: localBranches
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
          .sort((a, b) => b.relevantActivities.length - a.relevantActivities.length || a.branchName.localeCompare(b.branchName, "nb-NO")),
        planningSignal: planningSignal(need.lowIncomePercent, branchesWithActivity.length),
        source: {
          ssbTable,
          ssbUpdatedAt: need.sourceUpdatedAt,
          importedAt,
        },
      };
    })
    .sort(
      (a, b) =>
        (b.lowIncomePercent ?? -1) - (a.lowIncomePercent ?? -1) ||
        (b.childrenCount ?? -1) - (a.childrenCount ?? -1) ||
        a.municipality.localeCompare(b.municipality, "nb-NO"),
    );
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

function planningSignal(
  lowIncomePercent: number | null,
  matchingBranchesCount: number,
): AreaPlan["planningSignal"] {
  if (lowIncomePercent === null) {
    return {
      level: "lower",
      title: "Mangler behovstall",
      summary: "SSB har ikke publisert tall for denne kommunen i valgt år.",
    };
  }

  if (lowIncomePercent >= 12 && matchingBranchesCount > 0) {
    return {
      level: "high-covered",
      title: "Høyt behov og eksisterende aktivitet",
      summary: "Kommunen har høy andel barn i lavinntekt og minst én relevant lokal aktivitet.",
    };
  }

  if (lowIncomePercent >= 12) {
    return {
      level: "high-limited",
      title: "Høyt behov og begrenset aktivitetstreff",
      summary: "Kommunen bør vurderes nærmere fordi behovet er høyt og datagrunnlaget viser få relevante aktiviteter.",
    };
  }

  if (lowIncomePercent >= 9 && matchingBranchesCount > 0) {
    return {
      level: "moderate-covered",
      title: "Moderat behov med lokal aktivitet",
      summary: "Kommunen har relevante aktiviteter og et behovsnivå som kan følges i lokal planlegging.",
    };
  }

  if (lowIncomePercent >= 9) {
    return {
      level: "moderate-limited",
      title: "Moderat behov og få aktivitetstreff",
      summary: "Kommunen har et moderat behovsnivå, men få aktiviteter i de mest relevante kategoriene.",
    };
  }

  return {
    level: "lower",
    title: "Lavere utslag i valgt indikator",
    summary: "Indikatoren alene peker ikke på et særskilt høyt behov, men bør vurderes sammen med lokal kunnskap.",
  };
}
