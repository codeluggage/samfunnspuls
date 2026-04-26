import { NextResponse } from "next/server";
import {
  buildAreaProfiles,
  type BranchInput,
  type IndicatorReading,
} from "@/lib/planning";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { IndicatorId } from "@/lib/samfunnspuls/indicators";

export const dynamic = "force-dynamic";

type BranchRow = {
  branch_id: string;
  branch_name: string;
  municipality: string | null;
  county: string | null;
  is_active: boolean;
  email: string | null;
  phone: string | null;
  web: string | null;
};

type ActivityRow = {
  branch_id: string;
  activity_name: string;
};

type IndicatorValueRow = {
  indicator_id: string;
  region_code: string;
  municipality: string;
  county: string | null;
  period: string;
  value: number | null;
  source_updated_at: string | null;
  imported_at: string;
};

type DataSourceRow = {
  id: string;
  label: string;
  url: string;
  source_updated_at: string | null;
  imported_at: string;
};

const TRACKED_SOURCE_IDS = ["ssb-08764", "ssb-06913", "red-cross-organizations"];

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const [valuesResult, branchesResult, activitiesResult, sourcesResult] = await Promise.all([
      supabase.from("indicator_values").select("*"),
      supabase.from("branches").select("*").order("branch_name", { ascending: true }),
      supabase.from("branch_activities").select("branch_id, activity_name"),
      supabase.from("data_sources").select("*").in("id", TRACKED_SOURCE_IDS),
    ]);

    if (valuesResult.error) throw valuesResult.error;
    if (branchesResult.error) throw branchesResult.error;
    if (activitiesResult.error) throw activitiesResult.error;
    if (sourcesResult.error) throw sourcesResult.error;

    const activitiesByBranch = new Map<string, string[]>();
    for (const activity of (activitiesResult.data ?? []) as ActivityRow[]) {
      const existing = activitiesByBranch.get(activity.branch_id) ?? [];
      existing.push(activity.activity_name);
      activitiesByBranch.set(activity.branch_id, existing);
    }

    const branches: BranchInput[] = ((branchesResult.data ?? []) as BranchRow[]).map((branch) => ({
      branchId: branch.branch_id,
      branchName: branch.branch_name,
      municipality: branch.municipality,
      county: branch.county,
      isActive: branch.is_active,
      email: branch.email,
      phone: branch.phone,
      web: branch.web,
      activities: activitiesByBranch.get(branch.branch_id) ?? [],
    }));

    const readings: IndicatorReading[] = ((valuesResult.data ?? []) as IndicatorValueRow[]).map(
      (row) => ({
        indicatorId: row.indicator_id as IndicatorId,
        regionCode: row.region_code,
        municipality: row.municipality,
        county: row.county,
        period: row.period,
        value: row.value === null ? null : Number(row.value),
        sourceUpdatedAt: row.source_updated_at,
      }),
    );

    const profiles = buildAreaProfiles({ readings, branches });

    return NextResponse.json({
      areas: profiles,
      metadata: {
        sources: ((sourcesResult.data ?? []) as DataSourceRow[]).map((source) => ({
          id: source.id,
          label: source.label,
          url: source.url,
          sourceUpdatedAt: source.source_updated_at,
          importedAt: source.imported_at,
        })),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Kunne ikke hente planleggingsdata.",
        detail: error instanceof Error ? error.message : "Ukjent feil",
      },
      { status: 500 },
    );
  }
}
