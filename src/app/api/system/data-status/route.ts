import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type DataSourceRow = {
  id: string;
  label: string;
  url: string;
  source_updated_at: string | null;
  imported_at: string;
  metadata: Record<string, unknown> | null;
};

type IngestionRunRow = {
  run_id: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "success" | "failed";
  trigger: string;
  actor: string | null;
  script_version: string | null;
  source_summaries: unknown;
  table_row_counts: Record<string, number> | null;
  error_message: string | null;
  created_at: string;
};

const REQUIRED_TABLES = [
  "data_sources",
  "branches",
  "branch_activities",
  "need_indicators",
  "indicators",
  "indicator_values",
  "statistic_catalog_entries",
] as const;

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const [
      sourcesResult,
      latestRunResult,
      recentRunsResult,
      ...tableCountResults
    ] = await Promise.all([
      supabase.from("data_sources").select("*").order("id", { ascending: true }),
      supabase
        .from("ingestion_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("ingestion_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10),
      ...REQUIRED_TABLES.map((table) =>
        supabase.from(table).select("*", { count: "exact", head: true }),
      ),
    ]);

    if (sourcesResult.error) throw sourcesResult.error;
    if (latestRunResult.error) throw latestRunResult.error;
    if (recentRunsResult.error) throw recentRunsResult.error;

    const tableCounts = Object.fromEntries(
      REQUIRED_TABLES.map((table, index) => {
        const result = tableCountResults[index];
        if (result.error) throw result.error;
        return [table, result.count ?? 0];
      }),
    );

    const latestRun = latestRunResult.data as IngestionRunRow | null;
    const recentRuns = (recentRunsResult.data ?? []) as IngestionRunRow[];
    const sources = ((sourcesResult.data ?? []) as DataSourceRow[]).map((source) => ({
      id: source.id,
      label: source.label,
      url: source.url,
      sourceUpdatedAt: source.source_updated_at,
      importedAt: source.imported_at,
      daysSinceSourceUpdate: daysSince(source.source_updated_at),
      daysSinceImport: daysSince(source.imported_at),
      metadata: source.metadata ?? {},
    }));

    const checks = [
      {
        id: "has-sources",
        label: "Datakilder registrert",
        ok: tableCounts.data_sources > 0,
        detail: `${tableCounts.data_sources} rader i data_sources`,
      },
      {
        id: "has-indicator-values",
        label: "Indikatorverdier lastet inn",
        ok: tableCounts.indicator_values > 0,
        detail: `${tableCounts.indicator_values} rader i indicator_values`,
      },
      {
        id: "has-branches",
        label: "Røde Kors-foreninger lastet inn",
        ok: tableCounts.branches > 0 && tableCounts.branch_activities > 0,
        detail: `${tableCounts.branches} foreninger, ${tableCounts.branch_activities} aktiviteter`,
      },
      {
        id: "has-catalog",
        label: "Samfunnspuls-katalog lastet inn",
        ok: tableCounts.statistic_catalog_entries > 0,
        detail: `${tableCounts.statistic_catalog_entries} katalograder`,
      },
      {
        id: "latest-run-success",
        label: "Siste ingest-run er vellykket",
        ok: latestRun?.status === "success",
        detail: latestRun
          ? `run ${latestRun.run_id} status=${latestRun.status}`
          : "ingen ingest-run registrert ennå",
      },
    ];

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      readiness: {
        ready: checks.every((check) => check.ok),
        checks,
      },
      latestRun: latestRun
        ? {
            runId: latestRun.run_id,
            startedAt: latestRun.started_at,
            finishedAt: latestRun.finished_at,
            status: latestRun.status,
            trigger: latestRun.trigger,
            actor: latestRun.actor,
            scriptVersion: latestRun.script_version,
            sourceSummaries: latestRun.source_summaries,
            tableRowCounts: latestRun.table_row_counts ?? {},
            errorMessage: latestRun.error_message,
          }
        : null,
      recentRuns: recentRuns.map((run) => ({
        runId: run.run_id,
        startedAt: run.started_at,
        finishedAt: run.finished_at,
        status: run.status,
        trigger: run.trigger,
        actor: run.actor,
        scriptVersion: run.script_version,
        errorMessage: run.error_message,
      })),
      tableCounts,
      sources,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Kunne ikke hente pipeline-status.",
        detail: getErrorDetail(error),
      },
      { status: 500 },
    );
  }
}

function daysSince(value: string | null | undefined): number | null {
  if (!value) return null;
  const milliseconds = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(milliseconds)) return null;
  return Number((milliseconds / (1000 * 60 * 60 * 24)).toFixed(2));
}

function getErrorDetail(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "Ukjent feil";
}
