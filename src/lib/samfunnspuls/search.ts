import {
  CATALOG_CATEGORIES,
  type CatalogCategory,
  type CatalogStatus,
  type SamfunnspulsCatalogEntry,
  type ValueType,
} from "./catalog";

export type CatalogFilters = {
  category?: CatalogCategory | "all";
  source?: string;
  valueType?: ValueType | "all";
  status?: CatalogStatus | "all";
};

export type CatalogSearchOptions = {
  query?: string;
  filters?: CatalogFilters;
};

export type CatalogSearchResult = {
  entry: SamfunnspulsCatalogEntry;
  score: number;
  matchedFields: string[];
};

export type CatalogFilterOptions = {
  categories: CatalogCategory[];
  sources: string[];
  valueTypes: ValueType[];
  statuses: CatalogStatus[];
};

const STATUS_ORDER: CatalogStatus[] = ["integrated", "api-known", "metadata-only"];

export function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase("nb-NO")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9æøå]+/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchCatalog(
  entries: SamfunnspulsCatalogEntry[],
  options: CatalogSearchOptions = {},
): CatalogSearchResult[] {
  const query = normalizeSearchText(options.query ?? "");
  const queryTokens = query ? query.split(" ") : [];

  return entries
    .filter((entry) => matchesFilters(entry, options.filters))
    .map((entry, index) => {
      const fields = searchableFields(entry);
      const allText = normalizeSearchText(Object.values(fields).join(" "));

      if (queryTokens.length > 0 && !queryTokens.every((token) => allText.includes(token))) {
        return null;
      }

      const matchedFields = Object.entries(fields)
        .filter(([, fieldValue]) => {
          const normalized = normalizeSearchText(fieldValue);
          return queryTokens.length === 0 || queryTokens.some((token) => normalized.includes(token));
        })
        .map(([fieldName]) => fieldName);

      return {
        entry,
        matchedFields,
        score: scoreEntry(entry, fields, query, queryTokens) - index / 1000,
      };
    })
    .filter((result): result is CatalogSearchResult => result !== null)
    .sort((left, right) => right.score - left.score || left.entry.title.localeCompare(right.entry.title, "nb-NO"));
}

export function getCatalogFilterOptions(entries: SamfunnspulsCatalogEntry[]): CatalogFilterOptions {
  return {
    categories: CATALOG_CATEGORIES.filter((category) => entries.some((entry) => entry.category === category)),
    sources: uniqueSorted(entries.map((entry) => entry.source)),
    valueTypes: uniqueSorted(entries.flatMap((entry) => entry.valueTypes)),
    statuses: STATUS_ORDER.filter((status) => entries.some((entry) => entry.status === status)),
  };
}

function matchesFilters(entry: SamfunnspulsCatalogEntry, filters: CatalogFilters | undefined): boolean {
  if (!filters) return true;

  if (filters.category && filters.category !== "all" && entry.category !== filters.category) {
    return false;
  }

  if (filters.source && filters.source !== "all" && entry.source !== filters.source) {
    return false;
  }

  if (filters.valueType && filters.valueType !== "all" && !entry.valueTypes.includes(filters.valueType)) {
    return false;
  }

  if (filters.status && filters.status !== "all" && entry.status !== filters.status) {
    return false;
  }

  return true;
}

function scoreEntry(
  entry: SamfunnspulsCatalogEntry,
  fields: Record<string, string>,
  query: string,
  queryTokens: string[],
): number {
  if (!query) {
    return statusWeight(entry.status);
  }

  let score = statusWeight(entry.status);
  const title = normalizeSearchText(fields.title);
  const ids = normalizeSearchText(fields.ids);
  const tags = normalizeSearchText(fields.tags);
  const summary = normalizeSearchText(fields.summary);
  const aboutNumbers = normalizeSearchText(fields.aboutNumbers);

  if (title === query) score += 120;
  if (title.includes(query)) score += 80;
  if (ids.includes(query)) score += 70;
  if (tags.includes(query)) score += 45;
  if (summary.includes(query)) score += 30;
  if (aboutNumbers.includes(query)) score += 25;

  for (const token of queryTokens) {
    if (title.includes(token)) score += 18;
    if (ids.includes(token)) score += 16;
    if (tags.includes(token)) score += 10;
    if (summary.includes(token)) score += 6;
    if (aboutNumbers.includes(token)) score += 4;
  }

  return score;
}

function searchableFields(entry: SamfunnspulsCatalogEntry): Record<string, string> {
  return {
    title: entry.title,
    category: entry.category,
    source: entry.source,
    summary: entry.summary ?? "",
    ids: [
      entry.powerBiReportId,
      entry.powerBiReportName,
      ...(entry.ssbTables ?? []).flatMap((table) => [table.id, table.label]),
      ...(entry.otherApiHints ?? []),
    ]
      .filter(Boolean)
      .join(" "),
    relatedStatistics: (entry.relatedStatistics ?? []).map((related) => related.title).join(" "),
    tags: entry.tags.join(" "),
    aboutNumbers: [
      entry.aboutNumbers?.statisticName,
      entry.aboutNumbers?.sourceDescription,
      entry.aboutNumbers?.dataType,
      entry.aboutNumbers?.countDate,
      entry.aboutNumbers?.collectionMethod,
      ...(entry.aboutNumbers?.definitions ?? []),
      ...(entry.aboutNumbers?.references ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  };
}

function statusWeight(status: CatalogStatus): number {
  if (status === "integrated") return 12;
  if (status === "api-known") return 8;
  return 4;
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, "nb-NO"));
}
