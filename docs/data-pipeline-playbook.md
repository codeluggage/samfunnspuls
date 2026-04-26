# Data Pipeline Playbook

Use this when the app is deployed but has no data yet, or when you add a new data source.

## Goal

From empty database to served data with one repeatable flow:

1. Run migrations.
2. Run importer.
3. Verify ingest history in database.
4. Verify served data in API.

## Prerequisites

- Vercel project created.
- Supabase project created.
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` available.
- Supabase CLI logged in.

## One-time setup per machine

```bash
npm install
supabase login
```

Create or update local env file used by scripts:

```bash
cat > .env.local <<'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
EOF
```

## Empty deployment -> loaded data (copy/paste flow)

Link CLI to your Supabase project:

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Apply all migrations to remote DB:

```bash
supabase db push
```

Run importer against remote Supabase:

```bash
npm run data:sync
```

Expected output includes:

- `runId`
- `branches`
- `activities`
- `indicatorReadings`
- `tableRowCounts`

## Machine-verifiable checks

### 1) Check ingest history directly in app API

Local dev:

```bash
curl -s http://localhost:3000/api/system/data-status | jq
```

Deployed app:

```bash
curl -s https://YOUR_VERCEL_DOMAIN/api/system/data-status | jq
```

What must be true:

- `readiness.ready` is `true`
- `latestRun.status` is `success`
- `tableCounts.indicator_values > 0`
- `tableCounts.branches > 0`
- `tableCounts.branch_activities > 0`

### 2) Check served planning data

Local dev:

```bash
curl -s http://localhost:3000/api/planning/areas | jq '{areas: (.areas | length), sources: (.metadata.sources | length)}'
```

Deployed app:

```bash
curl -s https://YOUR_VERCEL_DOMAIN/api/planning/areas | jq '{areas: (.areas | length), sources: (.metadata.sources | length)}'
```

What must be true:

- `areas` is greater than `0`
- `sources` is at least `3`

## Adding a new source (low-willpower checklist)

1. Define source metadata:
- Add/update source row in `scripts/import-samfunnspuls-data.ts` (`data_sources` upsert).

2. Fetch + parse:
- Add fetch call and parser mapping in `scripts/import-samfunnspuls-data.ts`.
- If parser logic is reusable, place it in `src/lib/planning.ts` or `src/lib/samfunnspuls/*`.

3. Store normalized rows:
- Reuse existing tables if possible.
- If new table needed, add migration in `supabase/migrations`.

4. Expose through app API:
- Extend `src/app/api/planning/areas/route.ts` (or add another API route) with the new data shape.

5. Record ingest visibility:
- Add source summary fields in the `sourceSummaries` array inside importer.
- Confirm it appears in `/api/system/data-status`.

6. Verify:

```bash
npm test
npm run check:ai
npm run data:sync
curl -s http://localhost:3000/api/system/data-status | jq
```

## Failure recovery

If importer fails:

1. Read terminal error.
2. Check latest run:

```bash
curl -s http://localhost:3000/api/system/data-status | jq '.latestRun'
```

3. Confirm `latestRun.status` and `latestRun.errorMessage`.
4. Fix parser/query/schema issue and rerun `npm run data:sync`.
