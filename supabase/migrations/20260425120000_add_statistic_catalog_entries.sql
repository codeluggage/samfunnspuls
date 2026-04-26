create table if not exists public.statistic_catalog_entries (
  slug text primary key,
  path text not null,
  title text not null,
  category text not null,
  summary text,
  source text not null,
  status text not null check (status in ('metadata-only', 'api-known', 'integrated')),
  power_bi_report_id text,
  power_bi_report_name text,
  ssb_table_ids text[] not null default '{}'::text[],
  other_api_hints text[] not null default '{}'::text[],
  value_types text[] not null default '{}'::text[],
  geographies text[] not null default '{}'::text[],
  time_dimensions text[] not null default '{}'::text[],
  related_statistics jsonb not null default '[]'::jsonb,
  about_numbers jsonb,
  tags text[] not null default '{}'::text[],
  search_text text not null,
  imported_at timestamptz not null default now()
);

create index if not exists statistic_catalog_category_idx on public.statistic_catalog_entries (category);
create index if not exists statistic_catalog_source_idx on public.statistic_catalog_entries (source);
create index if not exists statistic_catalog_status_idx on public.statistic_catalog_entries (status);
create index if not exists statistic_catalog_search_idx on public.statistic_catalog_entries using gin (to_tsvector('simple', search_text));
