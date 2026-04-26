import type { SamfunnspulsCatalogEntry } from "./catalog";
import { getCatalogSearchText } from "./search";

export type CatalogDatabaseRow = {
  slug: string;
  path: string;
  title: string;
  category: string;
  summary: string | null;
  source: string;
  status: string;
  power_bi_report_id: string | null;
  power_bi_report_name: string | null;
  ssb_table_ids: string[];
  other_api_hints: string[];
  value_types: string[];
  geographies: string[];
  time_dimensions: string[];
  related_statistics: Array<{ title: string; slug: string | null }>;
  about_numbers: SamfunnspulsCatalogEntry["aboutNumbers"] | null;
  tags: string[];
  search_text: string;
};

export function toCatalogDatabaseRows(entries: SamfunnspulsCatalogEntry[]): CatalogDatabaseRow[] {
  return entries.map((entry) => ({
    slug: entry.slug,
    path: entry.path,
    title: entry.title,
    category: entry.category,
    summary: entry.summary ?? null,
    source: entry.source,
    status: entry.status,
    power_bi_report_id: entry.powerBiReportId ?? null,
    power_bi_report_name: entry.powerBiReportName ?? null,
    ssb_table_ids: entry.ssbTables?.map((table) => table.id) ?? [],
    other_api_hints: entry.otherApiHints ?? [],
    value_types: entry.valueTypes,
    geographies: entry.geographies,
    time_dimensions: entry.timeDimensions,
    related_statistics:
      entry.relatedStatistics?.map((related) => ({
        title: related.title,
        slug: related.slug ?? null,
      })) ?? [],
    about_numbers: entry.aboutNumbers ?? null,
    tags: entry.tags,
    search_text: getCatalogSearchText(entry),
  }));
}
