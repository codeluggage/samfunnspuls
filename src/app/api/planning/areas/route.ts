import { NextResponse } from "next/server";
import { buildAreaPlans, type BranchInput, type LowIncomeNeed } from "@/lib/planning";
import { getSupabaseAdmin } from "@/lib/supabase";

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

type NeedRow = {
  region_code: string;
  municipality: string;
  year: number;
  children_count: number | null;
  low_income_percent: number | null;
  source_updated_at: string | null;
  imported_at: string;
};

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const [needsResult, branchesResult, activitiesResult, sourceResult] = await Promise.all([
      supabase.from("need_indicators").select("*").order("low_income_percent", { ascending: false }),
      supabase.from("branches").select("*").order("branch_name", { ascending: true }),
      supabase.from("branch_activities").select("branch_id, activity_name"),
      supabase.from("data_sources").select("*").in("id", ["ssb-08764", "red-cross-organizations"]),
    ]);

    if (needsResult.error) throw needsResult.error;
    if (branchesResult.error) throw branchesResult.error;
    if (activitiesResult.error) throw activitiesResult.error;
    if (sourceResult.error) throw sourceResult.error;

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

    const needs: LowIncomeNeed[] = ((needsResult.data ?? []) as NeedRow[]).map((need) => ({
      regionCode: need.region_code,
      municipality: need.municipality,
      year: String(need.year),
      childrenCount: need.children_count,
      lowIncomePercent: need.low_income_percent,
      sourceUpdatedAt: need.source_updated_at,
    }));

    const latestImport =
      ((needsResult.data ?? []) as NeedRow[])
        .map((need) => need.imported_at)
        .sort()
        .at(-1) ?? new Date().toISOString();

    return NextResponse.json({
      areas: buildAreaPlans({ needs, branches, importedAt: latestImport }),
      metadata: {
        sources: sourceResult.data ?? [],
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
