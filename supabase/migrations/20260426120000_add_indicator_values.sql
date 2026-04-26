create table if not exists public.indicators (
  indicator_id text primary key,
  label text not null,
  short_label text not null,
  unit text not null,
  source text not null,
  source_table text not null,
  source_url text not null,
  description text not null,
  direction text not null
);

create table if not exists public.indicator_values (
  indicator_id text not null references public.indicators(indicator_id) on delete cascade,
  region_code text not null,
  municipality text not null,
  county text,
  period text not null,
  value numeric,
  source_updated_at timestamptz,
  imported_at timestamptz not null default now(),
  primary key (indicator_id, region_code, period)
);

create index if not exists indicator_values_region_idx
  on public.indicator_values (region_code);

create index if not exists indicator_values_indicator_idx
  on public.indicator_values (indicator_id, period);
