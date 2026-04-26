create table if not exists public.ingestion_runs (
  run_id text primary key,
  started_at timestamptz not null,
  finished_at timestamptz,
  status text not null check (status in ('running', 'success', 'failed')),
  trigger text not null default 'manual',
  actor text,
  script_version text,
  source_summaries jsonb not null default '[]'::jsonb,
  table_row_counts jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists ingestion_runs_started_at_idx
  on public.ingestion_runs (started_at desc);

create index if not exists ingestion_runs_status_idx
  on public.ingestion_runs (status);
