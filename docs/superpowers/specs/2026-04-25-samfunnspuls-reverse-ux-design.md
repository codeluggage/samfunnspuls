# Samfunnspuls Reverse UX Design

## Goal

Build the next branch as a structured Samfunnspuls source catalog with a narrow search-first exploration surface. The catalog should make public humanitarian statistics searchable by topic, geography, year, source, value type, IDs, related statistics, and explanatory text.

The existing `Aktivitetsradar` remains intact as the real integrated planning slice. The new work adds the information backbone needed to rebuild more of Samfunnspuls and later invert the UX more fully.

## Product Direction

The original Samfunnspuls UX asks users to understand the site structure first: choose a statistics category, open a page, inspect a Power BI report, then expand supporting details such as "Om tallene" when needed.

This branch should reverse the first step. A user should be able to land on a new exploration page, type plain-language terms such as `lavinntekt`, `Oslo 2024`, `mobbing`, `NAV arbeidsledige`, `sykehjem 12292`, or `folketilvekst`, and find likely data sources without knowing the category structure in advance.

## Initial Scope

### In Scope

- Add a typed metadata catalog for the known Samfunnspuls public statistics currently identified from:
  - `/Users/mf/CLAUDE/career/red-cross/samfunnspuls-sitemap-from-gpt-5.md`
  - `/Users/mf/CLAUDE/career/red-cross/samfunnspuls-sitemap-from-claude.md`
- Cover the known 37 statistic pages across the six categories:
  - Barn og unge
  - Demografi og boforhold
  - Helse og eldre
  - Flyktninger og asylsøkere
  - Frivillighet
  - Økonomi
- Store known domain metadata per statistic:
  - slug and rebuilt app path
  - title
  - category
  - summary text when known
  - source agency, such as SSB, NAV, Udir, IMDi, Røde Kors, or Brønnøysundregistrene
  - known Power BI report ID
  - known SSB table IDs
  - related statistic titles and rebuilt app paths where known
  - value type hints, such as count, percent, rate, kroner, or duration
  - geography hints, such as municipality, county, country, school level, or branch
  - time hints, such as year, month, school year, or snapshot date
  - API readiness status: `metadata-only`, `api-known`, or `integrated`
- Treat the explanatory "Om tallene" text as searchable catalog content. This includes fields like statistic name, source, data type, count date, collection method, definitions, and references.
- Add a search-first page that lets users search and filter the catalog.
- Keep the current activity radar route working.
- Add focused tests for catalog integrity and search behavior.
- Keep legacy/original-site references out of the core catalog model. If the UI needs a comparison link back to an original page, colocate that mapping with the presentation layer and do not feed it into search, filtering, or future data integrations.

### Out of Scope For This Branch

- Fully replacing every Power BI report with live charts.
- Importing all upstream APIs into Supabase.
- Building saved profiles, PowerPoint export, or side-by-side dataset comparison.
- Completing "Om tallene" capture for all 37 pages.
- Expanding the current Supabase schema for catalog metadata unless implementation finds a specific need.

## Content Model

Create a catalog entry model that represents the rebuilt product's statistics, not the old site's implementation state.

Required fields:

- `slug`: stable local slug derived from the statistic topic and category.
- `path`: rebuilt app path for this statistic or search result detail.
- `title`: user-facing title.
- `category`: one of the known statistic categories.
- `source`: source agency label.
- `status`: `metadata-only`, `api-known`, or `integrated`.
- `searchText`: normalized searchable text generated from title, summary, tags, IDs, related statistics, and "Om tallene" fields. Legacy reference URLs must not be included in this field.

Optional fields:

- `summary`: short page intro text.
- `powerBiReportId`: known report ID.
- `powerBiReportName`: known report name when exposed by the Samfunnspuls backend.
- `ssbTables`: SSB table IDs and labels.
- `otherApiHints`: NAV, IMDi, Udir, Brønnøysund, Røde Kors, or other source hints.
- `valueTypes`: count, percent, kroner, duration, rate, or unknown.
- `geographies`: municipality, county, Norway, school, branch, or unknown.
- `timeDimensions`: year, month, school year, count date, or unknown.
- `relatedStatistics`: title and rebuilt app path pairs where the related statistic exists in the catalog; title-only entries where it does not.
- `aboutNumbers`: structured explanatory metadata:
  - `statisticName`
  - `sourceDescription`
  - `dataType`
  - `countDate`
  - `collectionMethod`
  - `definitions`
  - `references`
The core model must not include implementation-process fields such as `inspectionNotes`, `originalUrl`, `legacyUrl`, or `needsInspection`. Missing data should be represented by absent optional fields and rendered in the UI as `Ikke kartlagt ennå` only where that helps the user understand a visible gap.

## Seed Examples

The first metadata set should include the two manually inspected examples from the user message.

### Lavinntekt Barn Og Unge

- Rebuilt path: `/utforsk-data/barn-og-unge/lavinntekt`
- Title: `Barn og unge i husholdninger med lavinntekt (EU-60)`
- Category: `Barn og unge`
- Source: `Statistisk sentralbyrå (SSB)`
- SSB table: `08764`
- Status: `integrated`, because the current activity radar already imports this table.
- Summary concept: children under 18 in low-income households, where low income is below 60 percent of median income.
- Related statistics:
  - `Personer i husholdninger med lavinntekt (EU-60), hele befolkningen`
  - `Barn og unge som bor trangt/romslig/uoppgitt`
  - `Antall sosialhjelpsmottakere`
  - `Antall familier, etter familietype`
- "Om tallene" should capture SSB table `08764`, register data, count date `31. desember`, SSB open API collection, and the long definitions around poverty, low income, median income, and EU equivalence scale.

### Befolkningsendring

- Rebuilt path: `/utforsk-data/demografi-og-boforhold/befolkningsendring-folketilvekst`
- Title: `Befolkningsendring`
- Category: `Demografi og boforhold`
- Source: `Statistisk sentralbyrå (SSB)`
- SSB table: `06913`
- Known Power BI report ID: `92bfaba4-445d-4581-a6d0-0d4b103f146f`
- Status: `api-known`
- Summary concept: population increase or decrease in a selected area over a year.
- Related statistics:
  - `Levendefødte`
  - `Tilflytting`
- "Om tallene" should capture statistic name, SSB table `06913`, register data, count date `31.12`, and SSB open API collection.

## Search UX

Add a new route at `/utforsk-data`. The route should be reachable from the header beside `Aktivitetsradar`, using the navigation label `Utforsk data`.

The first screen should contain:

- One prominent search input.
- Compact filter controls for category, source, value type, and API readiness.
- A result count.
- Result cards optimized for scanning.

Each result card should show:

- Title.
- Category.
- Source agency.
- Short summary or reason the result matched.
- Known IDs, such as SSB table ID or Power BI report ID.
- Geography and time hints.
- API readiness badge.
- Related-statistics count when present.

Selecting a result should show details in-page or on a detail route. The first implementation can use an in-page detail panel to avoid overbuilding routing. The detail should include:

- Known source and API details.
- "Om tallene" fields that have been captured.
- Related statistics as links within the rebuilt app where entries exist; otherwise render the related statistic title as plain text.
- `Ikke kartlagt ennå` labels for missing report IDs, source tables, or explanatory fields where exposing the gap is useful to the user.
- Optional comparison links to original Samfunnspuls pages only in the presentation layer. These links should not be part of the domain catalog entries or search index.

## Technical Approach

Use file-backed typed metadata for the first branch:

- `src/lib/samfunnspuls/catalog.ts`: source catalog entries.
- `src/lib/samfunnspuls/search.ts`: search normalization, scoring, filtering, and result shaping.
- `src/app/utforsk-data/page.tsx`: client page for search and detail inspection.
- `src/app/utforsk-data/page.module.css`: layout only, using design tokens.

If original-page comparison links are shown, keep them in the `/utforsk-data` presentation module or a colocated UI-only helper, not in `src/lib/samfunnspuls/catalog.ts` or `src/lib/samfunnspuls/search.ts`.

Do not add a database migration for catalog metadata in this branch. The metadata is still incomplete and partly research-derived, so keeping it file-backed makes review and iteration easier. The type shape should still be compatible with later Supabase storage.

Use existing project conventions:

- Next.js App Router.
- TypeScript.
- CSS Modules for layout.
- `rk-designsystem` components for common UI.
- `--ds-size-*` tokens for spacing.
- One clear `<main>`, one top-level heading, and predictable heading hierarchy.

## Search Behavior

The first search implementation should be simple and deterministic:

- Normalize Norwegian text with lowercasing, diacritic removal, punctuation cleanup, and whitespace collapse.
- Search across title, category, source, tags, summary, IDs, related titles, and captured "Om tallene" text.
- Score exact phrase and title matches higher than body/definition matches.
- Support multi-token fuzzy-ish search by requiring all tokens to appear somewhere in an entry's searchable text, with ordering by score.
- Let filters narrow the already-searchable catalog.

This is enough for the first reverse-UX slice without adding a heavyweight search dependency.

## Error And Empty States

- If the catalog fails to load, show a clear error state.
- If a search has no matches, show an empty state that suggests broader terms and exposes category/source filters.
- Entries with incomplete metadata must not look broken. Show `Ikke kartlagt ennå` or equivalent labels for missing report IDs, source tables, or explanatory fields.

## Testing

Add unit tests for:

- Catalog has no duplicate slugs.
- Every entry has required fields.
- Known entries for `lavinntekt` and `befolkningsendring` exist and include their known SSB tables.
- Search finds:
  - `lavinntekt`
  - `08764`
  - `folketilvekst`
  - `06913`
  - `NAV arbeidsledige`
  - `sykehjem 12292`
- Search normalization handles Norwegian letters and punctuation.
- Filters narrow results by category, source, value type, and readiness status.

Run at least:

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run check:designsystem -- src/app`
- `npm run check:a11y -- src/app`

Before claiming UI work is complete, run `npm run check:ai` unless a known environment dependency blocks it.

## Future Iterations

After this branch:

- Inspect and capture "Om tallene" text for all 37 statistics pages.
- Add direct SSB API adapters for more known SSB tables.
- Add source-specific adapters for NAV, IMDi, Udir, Brønnøysund, and Røde Kors internal data where feasible.
- Add dataset comparison for entries sharing geography and time dimensions, such as `Oslo` and `2024`.
- Add saved area/source profiles as a stronger successor to the original `Mine statistikker`.
- Consider moving catalog metadata into Supabase once the shape stabilizes.
