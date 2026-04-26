import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import * as planning from "../src/lib/planning";
import type { LowIncomeNeed } from "../src/lib/planning";
import { SAMFUNNSPULS_CATALOG } from "../src/lib/samfunnspuls/catalog";
import { toCatalogDatabaseRows } from "../src/lib/samfunnspuls/database";

type PlanningModule = typeof import("../src/lib/planning");

const planningModule = (
  (planning as unknown as { default?: PlanningModule }).default ?? planning
) as PlanningModule;
const {
  cleanMunicipalityName,
  isRelevantActivity,
  normalizeName,
  parseLowIncomeJsonStat,
} = planningModule;

const SSB_TABLE_URL = "https://data.ssb.no/api/v0/no/table/08764";
const ORGANIZATION_DATA_PATH = path.join(
  process.cwd(),
  "docs/data/api-getOrganizations-output-21apr26.json",
);

type SsbVariable = {
  code: string;
  values: string[];
  valueTexts: string[];
};

type SsbMetadata = {
  variables: SsbVariable[];
};

type SourceBranch = {
  branchId: string;
  branchName: string;
  branchStatus?: {
    isActive?: boolean;
    isTerminated?: boolean;
  };
  branchLocation?: {
    county?: string;
    municipality?: string;
  };
  communicationChannels?: {
    email?: string;
    phone?: string;
    web?: string;
  };
  branchActivities?: Array<{
    globalActivityName: string;
    localActivityName?: string;
  }>;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.local and use `supabase status` values.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const importedAt = new Date().toISOString();
const organizationPayload = JSON.parse(await readFile(ORGANIZATION_DATA_PATH, "utf8"));
const branches = organizationPayload.data.branches as SourceBranch[];
const ssbMetadata = await fetchJson<SsbMetadata>(SSB_TABLE_URL);
const latestYear = ssbMetadata.variables.find((variable) => variable.code === "Tid")?.values.at(-1);

if (!latestYear) {
  throw new Error("Could not find latest SSB year for table 08764");
}

const selectedRegions = selectRegionsForBranches(ssbMetadata, branches);
const ssbDataset = await fetchJson<Record<string, unknown>>(SSB_TABLE_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: [
      {
        code: "Region",
        selection: {
          filter: "item",
          values: selectedRegions.map((region) => region.code),
        },
      },
      {
        code: "ContentsCode",
        selection: {
          filter: "item",
          values: ["Personer", "EUskala60"],
        },
      },
      {
        code: "Tid",
        selection: {
          filter: "item",
          values: [latestYear],
        },
      },
    ],
    response: { format: "JSON-stat2" },
  }),
});

const needRows = parseLowIncomeJsonStat(ssbDataset).map((need: LowIncomeNeed) => ({
  region_code: need.regionCode,
  municipality: need.municipality,
  year: Number(need.year),
  children_count: need.childrenCount,
  low_income_percent: need.lowIncomePercent,
  source_updated_at: need.sourceUpdatedAt,
  imported_at: importedAt,
}));

const branchRows = uniqueBy(
  branches.map((branch) => ({
    branch_id: branch.branchId,
    branch_name: branch.branchName,
    county: branch.branchLocation?.county ?? null,
    municipality: branch.branchLocation?.municipality ?? null,
    is_active: Boolean(branch.branchStatus?.isActive && !branch.branchStatus?.isTerminated),
    email: branch.communicationChannels?.email ?? null,
    phone: branch.communicationChannels?.phone ?? null,
    web: branch.communicationChannels?.web ?? null,
    source_updated_at: organizationPayload.metadata.timestamp,
    imported_at: importedAt,
  })),
  (branch) => branch.branch_id,
);

const activityRows = uniqueBy(
  branches.flatMap((branch) =>
    (branch.branchActivities ?? []).map((activity) => ({
      branch_id: branch.branchId,
      activity_name: activity.globalActivityName,
      local_activity_name: activity.localActivityName ?? activity.globalActivityName,
      is_relevant: isRelevantActivity(activity.globalActivityName),
      imported_at: importedAt,
    })),
  ),
  (activity) =>
    `${activity.branch_id}|${activity.activity_name}|${activity.local_activity_name}`,
);

await upsert("data_sources", [
  {
    id: "ssb-08764",
    label: "SSB tabell 08764: Barn under 18 år i lavinntekt",
    url: SSB_TABLE_URL,
    source_updated_at: ssbDataset.updated,
    imported_at: importedAt,
    metadata: {
      year: latestYear,
      regionsImported: needRows.length,
      note: ssbDataset.note ?? [],
    },
  },
  {
    id: "red-cross-organizations",
    label: "Røde Kors organisasjoner og aktiviteter",
    url: "https://developer.redcross.no/api-details#api=organizations&operation=getOrganizations",
    source_updated_at: organizationPayload.metadata.timestamp,
    imported_at: importedAt,
    metadata: {
      totalCount: organizationPayload.metadata.totalCount,
      localFile: "docs/data/api-getOrganizations-output-21apr26.json",
    },
  },
]);
await upsert("branches", branchRows);
await supabase.from("branch_activities").delete().neq("branch_id", "");
await insertChunks("branch_activities", activityRows);
await upsert("need_indicators", needRows);
await upsert(
  "statistic_catalog_entries",
  toCatalogDatabaseRows(SAMFUNNSPULS_CATALOG).map((row) => ({
    ...row,
    imported_at: importedAt,
  })),
);

console.log(
  JSON.stringify(
    {
      importedAt,
      latestYear,
      branches: branchRows.length,
      activities: activityRows.length,
      municipalitiesWithNeeds: needRows.length,
      catalogEntries: SAMFUNNSPULS_CATALOG.length,
    },
    null,
    2,
  ),
);

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Fetch failed for ${url}: ${response.status} ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

async function upsert(table: string, rows: Array<Record<string, unknown>>) {
  for (const chunk of chunks(rows, 500)) {
    const { error } = await supabase.from(table).upsert(chunk);
    if (error) throw error;
  }
}

async function insertChunks(table: string, rows: Array<Record<string, unknown>>) {
  for (const chunk of chunks(rows, 500)) {
    const { error } = await supabase.from(table).insert(chunk);
    if (error) throw error;
  }
}

function chunks<T>(rows: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    result.push(rows.slice(index, index + size));
  }
  return result;
}

function uniqueBy<T>(rows: T[], getKey: (row: T) => string): T[] {
  const selected = new Map<string, T>();
  for (const row of rows) {
    selected.set(getKey(row), row);
  }
  return [...selected.values()];
}

function selectRegionsForBranches(metadata: SsbMetadata, sourceBranches: SourceBranch[]) {
  const regionVariable = metadata.variables.find((variable) => variable.code === "Region");

  if (!regionVariable) {
    throw new Error("Could not find Region variable in SSB metadata");
  }

  const regionOptions = regionVariable.values.map((code, index) => ({
    code,
    label: regionVariable.valueTexts[index],
    normalizedLabel: normalizeName(regionVariable.valueTexts[index]),
  }));
  const currentMunicipalities = new Set(
    sourceBranches
      .map((branch) => normalizeName(branch.branchLocation?.municipality))
      .filter(Boolean),
  );
  const selected = new Map<string, { code: string; label: string }>();

  for (const municipality of currentMunicipalities) {
    const candidates = regionOptions
      .filter((region) => region.normalizedLabel === municipality)
      .filter((region) => region.code.length === 4 && !region.label.includes("Uoppgitt"))
      .sort((left, right) => scoreRegion(left) - scoreRegion(right));

    if (candidates[0]) {
      selected.set(candidates[0].code, {
        code: candidates[0].code,
        label: cleanMunicipalityName(candidates[0].label),
      });
    }
  }

  return [...selected.values()].sort((a, b) => a.code.localeCompare(b.code));
}

function scoreRegion(region: { code: string; label: string }) {
  let score = 0;
  if (region.label.includes("(2020-2023)") || region.label.includes("(-")) score += 50;
  if (region.label.includes("(")) score += 4;
  if (/99$/.test(region.code)) score += 20;
  return score;
}
