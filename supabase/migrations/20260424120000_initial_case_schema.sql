create table if not exists public.data_sources (
  id text primary key,
  label text not null,
  url text not null,
  source_updated_at timestamptz,
  imported_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.branches (
  branch_id text primary key,
  branch_name text not null,
  county text,
  municipality text,
  is_active boolean not null default false,
  email text,
  phone text,
  web text,
  source_updated_at timestamptz,
  imported_at timestamptz not null default now()
);

create table if not exists public.branch_activities (
  branch_id text not null references public.branches(branch_id) on delete cascade,
  activity_name text not null,
  local_activity_name text,
  is_relevant boolean not null default false,
  imported_at timestamptz not null default now(),
  primary key (branch_id, activity_name, local_activity_name)
);

create table if not exists public.need_indicators (
  region_code text not null,
  municipality text not null,
  year integer not null,
  children_count integer,
  low_income_percent numeric(5, 2),
  source_updated_at timestamptz,
  imported_at timestamptz not null default now(),
  primary key (region_code, year)
);

create index if not exists branches_municipality_idx on public.branches (municipality);
create index if not exists branch_activities_relevant_idx on public.branch_activities (is_relevant);
create index if not exists need_indicators_municipality_idx on public.need_indicators (municipality);
