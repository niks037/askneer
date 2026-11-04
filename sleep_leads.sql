create table if not exists sleep_leads (
  email text primary key,
  got_guide boolean not null default false,
  wants_plan boolean not null default false,
  src text,
  created_at timestamptz not null default now()
);
alter table sleep_leads enable row level security;
-- No policies: only the server (service key) can read or write.
