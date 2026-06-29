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
