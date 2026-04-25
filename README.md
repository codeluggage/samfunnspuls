# Samfunnspuls Case

Initial Samfunnspuls case app for local activity planning in Røde Kors.

The app combines one public humanitarian need indicator from SSB with supplied Røde Kors branch/activity data. The first vertical slice focuses on children and youth: municipalities are ranked by the share of children under 18 living in low-income households, then matched with local activities such as Barnas Røde Kors, Leksehjelp, Ferie for alle, Møteplasser, Norsktrening, and Flyktningguide.

## Case approach

- **Open data API:** SSB table `08764`, fetched from `https://data.ssb.no/api/v0/no/table/08764`.
- **Supplied Røde Kors data:** `docs/data/api-getOrganizations-output-21apr26.json`, originally produced from the Røde Kors Organizations API.
- **Database:** local Supabase stores imported source metadata, branches, activities, and normalized need indicators.
- **Backend:** `GET /api/planning/areas` joins the normalized tables and returns a planning-friendly shape.
- **Frontend:** the Next.js App Router page consumes only the API route and renders a Røde Kors design-system dashboard with loading, empty, error, source metadata, mobile layout, and accessible controls.
- **Deployment:** Vercel and Supabase.

## Data flow

```text
SSB API table 08764
  + local Røde Kors organization JSON
  -> scripts/import-samfunnspuls-data.mts
  -> Supabase tables
  -> /api/planning/areas
  -> dashboard page
```

The importer deduplicates duplicate branch/activity keys from the source JSON before upserting. In the `api-getOrganizations-output-21apr26.json` local import it stores 391 unique branches, 2,375 activities, and 260 municipality need rows for 2024.

## Setup

```bash
npm install
supabase start
cp .env.example .env.local
```

Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` from the `supabase start` output, then run:

```bash
npm run data:sync
npm run build
npm run start
```

Open http://localhost:3000 (or what your devcontainer has configured - typically exposed as port 3000)

Useful checks:

```bash
npm test
npm run typecheck
npm run lint
npm run check:designsystem -- src/app
npm run check:a11y -- src/app
npm run check:agent-context
```

## AI use

AI was used to compress discovery, inspect the brief and local starter context, draft the implementation path, generate code, and run verification loops. Product scope, data choice, accessibility expectations, and final tradeoffs were kept explicit in the implementation and verification process.

## Original template context

Case app workspace derived from the Next.js starter template and pre-configured with the [Røde Kors Design System](https://norwegianredcross.github.io/DesignSystem/storybook/).

- **Next.js 16** (App Router, TypeScript, webpack)
- **React Compiler** enabled
- **rk-designsystem** — Røde Kors component library
- **Design tokens** — Røde Kors theme (colors, spacing, typography)
- **Source Sans 3** font via `next/font`
- **Devcontainer** — open in VS Code and start coding immediately
- **AI_DESIGN_SYSTEM_GUIDE.md** — reference guide for AI-assisted development
- **Repo-scoped skills and rules** (added recently) — shared agent context with guarded propagation to Claude and Cursor
