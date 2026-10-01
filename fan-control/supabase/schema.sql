-- Aircare fan cleaning dashboard · Supabase schema
-- Run in a new Supabase project's SQL Editor after checking that public is
-- exposed to the Data API. RLS is enabled on every public table below.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  device_key uuid not null unique default gen_random_uuid(),
  display_name text not null default 'Ceiling fan' check (char_length(display_name) between 1 and 80),
  timezone text not null default 'Asia/Kolkata',
  is_online boolean not null default false,
  fan_is_stopped boolean not null default false,
  cleaning_arms_parked boolean not null default false,
  temperature_c numeric(5,2),
  last_seen timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.cleaning_schedules (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  label text not null default 'Scheduled clean' check (char_length(label) between 1 and 80),
  clean_at time not null,
  days_of_week integer[] not null check (cardinality(days_of_week) > 0 and days_of_week <@ array[0,1,2,3,4,5,6]),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cleaning_runs (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  schedule_id uuid references public.cleaning_schedules(id) on delete set null,
  trigger_source text not null check (trigger_source in ('schedule','manual')),
  status text not null default 'queued' check (status in ('queued','stopping_fan','extending','cleaning','retracting','completed','failed','cancelled')),
  started_at timestamptz,
  finished_at timestamptz,
  error_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.device_commands (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  command text not null check (command in ('clean_now','cancel_cleaning','sync_schedule')),
  status text not null default 'pending' check (status in ('pending','acknowledged','running','completed','failed','rejected')),
  requested_by uuid references auth.users(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  finished_at timestamptz
);

create table if not exists public.device_credentials (
  device_id uuid primary key references public.devices(id) on delete cascade,
  secret_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists cleaning_schedules_device_enabled_idx on public.cleaning_schedules(device_id, enabled);
create index if not exists cleaning_runs_device_created_idx on public.cleaning_runs(device_id, created_at desc);
create index if not exists device_commands_pending_idx on public.device_commands(device_id, created_at) where status = 'pending';

alter table public.devices enable row level security;
alter table public.cleaning_schedules enable row level security;
alter table public.cleaning_runs enable row level security;
alter table public.device_commands enable row level security;
alter table public.device_credentials enable row level security;

drop policy if exists "Owners read their devices" on public.devices;
create policy "Owners read their devices" on public.devices for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Owners read device schedules" on public.cleaning_schedules;
create policy "Owners read device schedules" on public.cleaning_schedules for select to authenticated
  using (exists (select 1 from public.devices d where d.id = device_id and d.owner_id = (select auth.uid())));
drop policy if exists "Owners create device schedules" on public.cleaning_schedules;
create policy "Owners create device schedules" on public.cleaning_schedules for insert to authenticated
  with check (exists (select 1 from public.devices d where d.id = device_id and d.owner_id = (select auth.uid())));
drop policy if exists "Owners update device schedules" on public.cleaning_schedules;
create policy "Owners update device schedules" on public.cleaning_schedules for update to authenticated
  using (exists (select 1 from public.devices d where d.id = device_id and d.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.devices d where d.id = device_id and d.owner_id = (select auth.uid())));
drop policy if exists "Owners delete device schedules" on public.cleaning_schedules;
create policy "Owners delete device schedules" on public.cleaning_schedules for delete to authenticated
  using (exists (select 1 from public.devices d where d.id = device_id and d.owner_id = (select auth.uid())));

drop policy if exists "Owners read cleaning history" on public.cleaning_runs;
create policy "Owners read cleaning history" on public.cleaning_runs for select to authenticated
  using (exists (select 1 from public.devices d where d.id = device_id and d.owner_id = (select auth.uid())));

drop policy if exists "Owners read device commands" on public.device_commands;
create policy "Owners read device commands" on public.device_commands for select to authenticated
  using (exists (select 1 from public.devices d where d.id = device_id and d.owner_id = (select auth.uid())));
drop policy if exists "Owners queue safe device commands" on public.device_commands;
create policy "Owners queue safe device commands" on public.device_commands for insert to authenticated
  with check (
    requested_by = (select auth.uid())
    and command in ('clean_now','cancel_cleaning','sync_schedule')
    and status = 'pending'
    and exists (
      select 1 from public.devices d
      where d.id = device_id and d.owner_id = (select auth.uid())
        and d.is_online and d.fan_is_stopped and d.cleaning_arms_parked
        and d.last_seen > now() - interval '45 seconds'
    )
  );

-- Device credentials are only available to the Edge Function service role.
-- There are deliberately no client policies or client grants for this table.

grant usage on schema public to authenticated;
revoke all on public.devices, public.cleaning_schedules, public.cleaning_runs, public.device_commands, public.device_credentials from anon, authenticated;
grant select on public.devices, public.cleaning_runs to authenticated;
grant select, insert, update, delete on public.cleaning_schedules to authenticated;
grant select, insert on public.device_commands to authenticated;
grant all on public.devices, public.cleaning_schedules, public.cleaning_runs, public.device_commands, public.device_credentials to service_role;

-- New Supabase projects may require adding public to the exposed Data API schemas
-- in Dashboard > Integrations > Data API settings. RLS and the grants above are
-- separate controls and both are required.

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cleaning_schedules') then
    alter publication supabase_realtime add table public.cleaning_schedules;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'devices') then
    alter publication supabase_realtime add table public.devices;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cleaning_runs') then
    alter publication supabase_realtime add table public.cleaning_runs;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'device_commands') then
    alter publication supabase_realtime add table public.device_commands;
  end if;
end $$;
