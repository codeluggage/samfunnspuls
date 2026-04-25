# Samfunnspuls Reverse UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a typed Samfunnspuls data catalog and a search-first `/utforsk-data` page while preserving the existing `Aktivitetsradar`.

**Architecture:** Keep the catalog file-backed in `src/lib/samfunnspuls/catalog.ts`, with deterministic search helpers in `src/lib/samfunnspuls/search.ts`. Build a client-side App Router page that imports the catalog and search helpers directly, uses Røde Kors design-system components, and keeps any legacy comparison links out of the domain model.

**Tech Stack:** Next.js App Router, React 19, TypeScript, CSS Modules, `rk-designsystem`, Node built-in test runner via `tsx --test`.

---

## File Structure

- Create `src/lib/samfunnspuls/catalog.ts`: type definitions, category constants, and 37 catalog entries.
- Create `src/lib/samfunnspuls/search.ts`: normalization, search indexing, filter options, score calculation, and result shaping.
- Create `tests/samfunnspuls-catalog.test.ts`: catalog integrity and seed metadata tests.
- Create `tests/samfunnspuls-search.test.ts`: search and filter behavior tests.
- Create `src/app/utforsk-data/page.tsx`: client-side search and detail UI.
- Create `src/app/utforsk-data/page.module.css`: route layout styles using `--ds-size-*` tokens.
- Modify `src/app/page.tsx`: add `Utforsk data` to the header navigation.
- Modify `src/app/layout.tsx`: update metadata to cover the wider exploration app.

## Task 1: Catalog Model And Seed Data

**Files:**
- Create: `src/lib/samfunnspuls/catalog.ts`
- Test: `tests/samfunnspuls-catalog.test.ts`

- [ ] **Step 1: Write failing catalog tests**

Add tests that import `SAMFUNNSPULS_CATALOG`, verify exactly 37 entries, no duplicate slugs, required fields on every entry, no legacy URL fields on entries, and known seed metadata for `lavinntekt` and `befolkningsendring-folketilvekst`.

Run: `npm test`
Expected: FAIL because the catalog module does not exist.

- [ ] **Step 2: Implement catalog types and entries**

Create the catalog module with:

```ts
export type CatalogStatus = "metadata-only" | "api-known" | "integrated";
export type ValueType = "count" | "percent" | "rate" | "kroner" | "duration" | "unknown";
export type GeographyType = "municipality" | "county" | "norway" | "school" | "branch" | "unknown";
export type TimeDimension = "year" | "month" | "school-year" | "count-date" | "unknown";

export type RelatedStatistic = {
  title: string;
  path?: string;
};

export type SourceTable = {
  id: string;
  label: string;
};

export type AboutNumbers = {
  statisticName?: string;
  sourceDescription?: string;
  dataType?: string;
  countDate?: string;
  collectionMethod?: string;
  definitions?: string[];
  references?: string[];
};

export type SamfunnspulsCatalogEntry = {
  slug: string;
  path: string;
  title: string;
  category: CatalogCategory;
  summary?: string;
  source: string;
  status: CatalogStatus;
  powerBiReportId?: string;
  powerBiReportName?: string;
  ssbTables?: SourceTable[];
  otherApiHints?: string[];
  valueTypes: ValueType[];
  geographies: GeographyType[];
  timeDimensions: TimeDimension[];
  relatedStatistics?: RelatedStatistic[];
  aboutNumbers?: AboutNumbers;
  tags: string[];
};
```

Populate 37 entries from the two sitemap files. For partially known pages, use `metadata-only`, `unknown` dimensions where needed, and absent optional fields for missing source details.

Run: `npm test`
Expected: catalog tests pass or expose specific data-shape mistakes to fix.

- [ ] **Step 3: Commit catalog**

Run:

```bash
git add src/lib/samfunnspuls/catalog.ts tests/samfunnspuls-catalog.test.ts
git commit -m "feat: add samfunnspuls source catalog"
```

## Task 2: Search Helpers

**Files:**
- Create: `src/lib/samfunnspuls/search.ts`
- Test: `tests/samfunnspuls-search.test.ts`

- [ ] **Step 1: Write failing search tests**

Add tests for `normalizeSearchText`, `searchCatalog`, and filter narrowing. Cover queries: `lavinntekt`, `08764`, `folketilvekst`, `06913`, `NAV arbeidsledige`, `sykehjem 12292`, and Norwegian normalization such as `Røde Kors` matching `rode kors`.

Run: `npm test`
Expected: FAIL because search helpers do not exist.

- [ ] **Step 2: Implement deterministic search**

Implement:

```ts
export type CatalogFilters = {
  category?: CatalogCategory | "all";
  source?: string;
  valueType?: ValueType | "all";
  status?: CatalogStatus | "all";
};

export type CatalogSearchResult = {
  entry: SamfunnspulsCatalogEntry;
  score: number;
  matchedFields: string[];
};
```

Search rules:

- Normalize with lowercasing, `NFKD`, diacritic stripping, punctuation-to-space, and whitespace collapse.
- Build searchable text from title, category, source, summary, tags, SSB table IDs/labels, Power BI IDs, related statistic titles, and `aboutNumbers`.
- Do not index `path`.
- Require all query tokens to appear when a query is present.
- Score title and exact phrase matches higher than body matches.
- Apply filters after text matching.

Run: `npm test`
Expected: search tests pass.

- [ ] **Step 3: Commit search helpers**

Run:

```bash
git add src/lib/samfunnspuls/search.ts tests/samfunnspuls-search.test.ts
git commit -m "feat: add catalog search helpers"
```

## Task 3: Search-First UI

**Files:**
- Create: `src/app/utforsk-data/page.tsx`
- Create: `src/app/utforsk-data/page.module.css`
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add route shell**

Create a `"use client"` page at `/utforsk-data` with a `Header`, one `<main>`, one H1, and imported catalog/search data. Use `Search` or `Textfield` for the query, `Select` controls for filters, `Card`/`CardBlock` for result cards, `Badge`/`Tag` for metadata, and `Details` for captured "Om tallene" content.

Run: `npm run typecheck`
Expected: PASS after fixing component prop details.

- [ ] **Step 2: Add responsive layout styles**

Use CSS Modules with design tokens only for layout:

- `.main` constrained to the existing page width.
- `.hero`, `.searchPanel`, `.filters`, `.resultsLayout`, `.resultList`, `.detailPanel`, `.metaList`, `.tagList`.
- Mobile: single-column layout with filters stacking above results.

Run: `npm run check:designsystem -- src/app/utforsk-data`
Expected: PASS.

- [ ] **Step 3: Add navigation and metadata**

Update the home page header `navItems` to include `{ label: "Utforsk data", href: "/utforsk-data" }`. Update layout metadata title/description to cover both activity planning and data exploration.

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit UI**

Run:

```bash
git add src/app/utforsk-data src/app/page.tsx src/app/layout.tsx
git commit -m "feat: add search-first data explorer"
```

## Task 4: Verification And Polish

**Files:**
- Modify only files touched by previous tasks if verification finds issues.

- [ ] **Step 1: Run focused verification**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run check:designsystem -- src/app
npm run check:a11y -- src/app
```

Expected: all pass. Fix any failures in the smallest relevant file.

- [ ] **Step 2: Run full AI check**

Run:

```bash
npm run check:ai
```

Expected: all pass. If an environment dependency blocks this, capture the exact failure and run the remaining available checks.

- [ ] **Step 3: Browser verify**

Start the app with `npm run dev`, open `/utforsk-data`, and verify:

- query input filters results;
- category/source/status/value filters narrow results;
- `lavinntekt`, `08764`, `folketilvekst`, and `sykehjem 12292` produce relevant hits;
- selecting a result updates the detail panel;
- mobile width remains readable with no overlapping text.

- [ ] **Step 4: Final commit if needed**

If verification required fixes, commit them:

```bash
git add <changed-files>
git commit -m "fix: polish data explorer verification"
```

