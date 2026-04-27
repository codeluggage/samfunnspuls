# Samfunnspuls Case

A case app that helps Røde Kors volunteers see what their municipality needs and what local activities already exist.

It pulls public numbers from SSB (children in low-income households, population change, net migration) and pairs them with Røde Kors branch and activity data. You pick a municipality, see the key figures, and get an overview of local Røde Kors activities like Barnas Røde Kors, Leksehjelp, Ferie for alle, Møteplasser, Norsktrening, and Flyktningguide.

## How it works

- **SSB data:** table `08764` from `https://data.ssb.no/api/v0/no/table/08764`.
- **Røde Kors data:** `docs/data/api-getOrganizations-output-21apr26.json`, from the Røde Kors Organizations API.
- **Database:** Supabase stores branches, activities, and indicators of a humanitarian need (_Note: these are assumptions based on the trends in the data and may not be accurate_).
- **API:** `GET /api/planning/areas` returns municipality profiles. `GET /api/system/data-status` shows what data is loaded and how fresh it is.
- **Frontend:** Next.js App Router page with the Røde Kors design system.
- **Deployed at:** https://samfunnspuls-v2.vercel.app (Supabase: https://ypcjawytwpjvzmvhuzjy.supabase.co)

## Data flow

```text
SSB API table 08764
  + local Røde Kors organization JSON
  -> scripts/import-samfunnspuls-data.ts
  -> Supabase tables
  -> /api/system/data-status
  -> /api/planning/areas
  -> dashboard page
```

The importer removes duplicates before writing. As of 2026-04-21 that JSON stores 391 branches, 2,375 activities, and 260 municipality rows for 2024.

## Setup

```bash
npm install
supabase start
cp .env.example .env.local
```

Set both `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_SECRET_KEY` in `.env.local` to the service_role key from `supabase start` (locally both use the same value), then:

```bash
supabase db reset # Only once each time you have a migration change
npm run data:sync:local # Each time you want to ingest data locally. See  docs/data-pipeline-playbook.md if you want to update the data on the hosted supabase for https://samfunnspuls-v2.vercel.app/
npm run build && npm run start # alternatively `npm run dev`
```

Open http://localhost:3000 (or whichever port your devcontainer exposes).

Useful checks:

```bash
npm test
npm run typecheck
npm run lint
npm run check:designsystem -- src/app
npm run check:a11y -- src/app
npm run check:agent-context

# or do it bundled up in one step (which AI agents often need) with `npm run check:ai`
```

Data pipeline runbook: `docs/data-pipeline-playbook.md`

## Template baseline

Built on the Next.js starter template with the [Røde Kors Design System](https://norwegianredcross.github.io/DesignSystem/storybook/).

- Next.js 16 (App Router, TypeScript, webpack)
- React Compiler
- `rk-designsystem` component library and design tokens
- Source Sans 3 via `next/font`
- Devcontainer for VS Code
- `AI_DESIGN_SYSTEM_GUIDE.md` for AI-assisted development
