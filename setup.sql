-- Dar Najat — database setup
-- Run this once in Supabase: Project > SQL Editor > New query > paste > Run.
-- It creates the feedings table and locks down what the public key can do.

create table if not exists public.feedings (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  feeding_date   date not null,
  location_label text not null check (char_length(location_label) between 1 and 200),
  city           text check (char_length(city) <= 100),
  state          text check (char_length(state) <= 2),
  in_memory_of   text not null default 'Najat Ihsane' check (char_length(in_memory_of) <= 120),
  items          text[] not null default '{}',
  people_count   int check (people_count is null or (people_count >= 0 and people_count <= 100000)),
  note           text check (note is null or char_length(note) <= 500)
);

-- Coverage list reads newest first.
create index if not exists feedings_created_at_idx
  on public.feedings (created_at desc);

-- Row Level Security. Without this line, the public key can read, edit,
-- and delete everything. Do not skip it.
alter table public.feedings enable row level security;

-- Anyone may read the coverage list.
create policy "public can read feedings"
  on public.feedings
  for select
  to anon
  using (true);

-- Anyone may log a feeding.
-- There is no update or delete policy, so the browser cannot change or
-- remove rows. Cleanup happens from the Supabase dashboard, by you.
create policy "public can insert feedings"
  on public.feedings
  for insert
  to anon
  with check (true);

-- Table-level grants. RLS above decides WHICH rows; these grants decide
-- whether the public (anon) role may touch the table at all. Both are
-- required. Without these you get "permission denied for table feedings".
grant usage on schema public to anon;
grant select, insert on public.feedings to anon;

-- ---------------------------------------------------------------------
-- 2026-11 update: global-ready location.
-- Adds a two-letter ISO country code (existing rows become US) and lets
-- "state" hold any region name, not only a two-letter US code.
-- Safe to run more than once. Run this BEFORE pushing the log page that
-- sends a country, or new feedings will fail to save.
-- ---------------------------------------------------------------------
alter table public.feedings
  add column if not exists country text not null default 'US';

alter table public.feedings drop constraint if exists feedings_country_check;
alter table public.feedings
  add constraint feedings_country_check check (country ~ '^[A-Z]{2}$');

alter table public.feedings drop constraint if exists feedings_state_check;
alter table public.feedings
  add constraint feedings_state_check check (state is null or char_length(state) <= 100);

-- ---------------------------------------------------------------------
-- 2026-11 update: hide an entry from the public site.
-- Tick "hidden" on a row in the Supabase Table Editor and it disappears
-- from the log list, the counts, and "Remembered here". Nothing is deleted.
-- ---------------------------------------------------------------------
alter table public.feedings
  add column if not exists hidden boolean not null default false;
alter policy "public can read feedings" on public.feedings using (hidden = false);
alter policy "public can insert feedings" on public.feedings with check (hidden = false);

-- ---------------------------------------------------------------------
-- 2026-11-14 update: planned feedings and the "What would help most" tally.
-- Applied to the live database on 14 November 2026 (migration
-- dar_najat_plans_and_needs). Safe to read as the record of what exists.
-- To hide a plan or a need, tick "hidden" on its row in the Table Editor.
-- ---------------------------------------------------------------------
create table if not exists public.feeding_plans (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  plan_date      date not null,
  part_of_day    text not null check (part_of_day in ('morning','midday','afternoon','evening')),
  location_label text not null check (char_length(location_label) between 1 and 200),
  city           text check (city is null or char_length(city) <= 100),
  state          text check (state is null or char_length(state) <= 100),
  country        text not null default 'US' check (country ~ '^[A-Z]{2}$'),
  items          text[] not null default '{}' check (cardinality(items) <= 8 and char_length(array_to_string(items, '')) <= 200),
  hidden         boolean not null default false
);
create index if not exists feeding_plans_date_idx on public.feeding_plans (plan_date);
alter table public.feeding_plans enable row level security;

-- Plans are visible from the day they are posted until the day after their date.
create policy "public can read upcoming plans" on public.feeding_plans
  for select to anon using (hidden = false and plan_date >= current_date - 1);
create policy "public can post a plan" on public.feeding_plans
  for insert to anon with check (hidden = false and plan_date >= current_date - 1 and plan_date <= current_date + 60);

grant usage on schema public to anon;
grant select on public.feeding_plans to anon;
-- Column-level insert: the public cannot set id, created_at or hidden.
grant insert (plan_date, part_of_day, location_label, city, state, country, items) on public.feeding_plans to anon;

-- One row per tap on "What would help most". A fixed list, no free text,
-- and nothing about the person who tapped.
create table if not exists public.feeding_needs (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  item       text not null check (item in ('hot_meal','water','socks','gloves_hat','blanket','hygiene','poncho','pet_food')),
  hidden     boolean not null default false
);
create index if not exists feeding_needs_created_idx on public.feeding_needs (created_at desc);
alter table public.feeding_needs enable row level security;

create policy "public can read recent needs" on public.feeding_needs
  for select to anon using (hidden = false and created_at > now() - interval '60 days');
create policy "public can add a need" on public.feeding_needs
  for insert to anon with check (hidden = false);

grant select on public.feeding_needs to anon;
grant insert (item) on public.feeding_needs to anon;

-- Thirty-day tally, one row per item. Runs with the caller's rights, so the policies above still apply.
create or replace view public.feeding_needs_tally with (security_invoker = true) as
  select item, count(*)::int as asks
  from public.feeding_needs
  where hidden = false and created_at > now() - interval '30 days'
  group by item;
grant select on public.feeding_needs_tally to anon;

-- Flood guards: a burst of junk is refused instead of filling the tables.
create or replace function public.feeding_needs_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.feeding_needs where created_at > now() - interval '10 minutes') >= 90 then
    raise exception 'Too many requests right now. Try again in a few minutes.';
  end if;
  return new;
end $$;
create or replace function public.feeding_plans_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.feeding_plans where created_at > now() - interval '1 hour') >= 20 then
    raise exception 'Too many plans posted right now. Try again later.';
  end if;
  return new;
end $$;
revoke all on function public.feeding_needs_guard() from public, anon, authenticated;
revoke all on function public.feeding_plans_guard() from public, anon, authenticated;

drop trigger if exists feeding_needs_guard on public.feeding_needs;
create trigger feeding_needs_guard before insert on public.feeding_needs
  for each row execute function public.feeding_needs_guard();
drop trigger if exists feeding_plans_guard on public.feeding_plans;
create trigger feeding_plans_guard before insert on public.feeding_plans
  for each row execute function public.feeding_plans_guard();
