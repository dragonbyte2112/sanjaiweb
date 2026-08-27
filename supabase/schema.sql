-- =========================================================================
-- DragonByte — Supabase schema
-- Run this whole file once in Supabase Dashboard → SQL Editor → New query
-- =========================================================================

-- Needed for password/flag hashing (crypt, gen_salt)
create extension if not exists pgcrypto;

-- =========================================================================
-- TABLES
-- =========================================================================

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date text,
  time text,
  location text,
  category text,
  image text,
  registration_url text,
  featured boolean default false,
  published boolean default true,
  slug text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image text,
  github_url text,
  demo_url text,
  technologies text[] default '{}',
  contributors text[] default '{}',
  category text,
  featured boolean default false,
  published boolean default true,
  slug text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table contributors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  bio text,
  photo text,
  skills text[] default '{}',
  github text,
  linkedin text,
  featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  name text not null,
  role text,
  photo text,
  approved boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  username text,
  skills text,
  interests text[] default '{}',
  joined_at timestamptz default now()
);

create table join_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  username text not null,
  skills text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

create table challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  difficulty text default 'Easy' check (difficulty in ('Easy', 'Medium', 'Hard', 'Insane')),
  points integer default 50,
  flag_hash text not null,
  published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table solves (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  handle text not null,
  points integer not null,
  created_at timestamptz default now(),
  unique (challenge_id, handle)
);

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================
-- Model: anyone (anon) can read published/approved content and submit
-- join/contact/CTF-flag requests. Only a signed-in admin (authenticated
-- role) can create/edit/delete content. There is one admin account,
-- created via Supabase Auth (see SUPABASE_SETUP.md, step 3).

alter table events enable row level security;
alter table projects enable row level security;
alter table contributors enable row level security;
alter table testimonials enable row level security;
alter table members enable row level security;
alter table join_requests enable row level security;
alter table messages enable row level security;
alter table challenges enable row level security;
alter table solves enable row level security;

-- events
create policy "events_select_public" on events for select using (published = true or auth.role() = 'authenticated');
create policy "events_write_admin" on events for insert with check (auth.role() = 'authenticated');
create policy "events_update_admin" on events for update using (auth.role() = 'authenticated');
create policy "events_delete_admin" on events for delete using (auth.role() = 'authenticated');

-- projects
create policy "projects_select_public" on projects for select using (published = true or auth.role() = 'authenticated');
create policy "projects_write_admin" on projects for insert with check (auth.role() = 'authenticated');
create policy "projects_update_admin" on projects for update using (auth.role() = 'authenticated');
create policy "projects_delete_admin" on projects for delete using (auth.role() = 'authenticated');

-- contributors (always public — no "published" concept)
create policy "contributors_select_public" on contributors for select using (true);
create policy "contributors_write_admin" on contributors for insert with check (auth.role() = 'authenticated');
create policy "contributors_update_admin" on contributors for update using (auth.role() = 'authenticated');
create policy "contributors_delete_admin" on contributors for delete using (auth.role() = 'authenticated');

-- testimonials
create policy "testimonials_select_public" on testimonials for select using (approved = true or auth.role() = 'authenticated');
create policy "testimonials_write_admin" on testimonials for insert with check (auth.role() = 'authenticated');
create policy "testimonials_update_admin" on testimonials for update using (auth.role() = 'authenticated');
create policy "testimonials_delete_admin" on testimonials for delete using (auth.role() = 'authenticated');

-- members (private — admin only)
create policy "members_admin_only_select" on members for select using (auth.role() = 'authenticated');
create policy "members_write_admin" on members for insert with check (auth.role() = 'authenticated');
create policy "members_update_admin" on members for update using (auth.role() = 'authenticated');
create policy "members_delete_admin" on members for delete using (auth.role() = 'authenticated');

-- join_requests (anyone can apply; only admin can read/manage)
create policy "join_requests_insert_public" on join_requests for insert with check (true);
create policy "join_requests_select_admin" on join_requests for select using (auth.role() = 'authenticated');
create policy "join_requests_update_admin" on join_requests for update using (auth.role() = 'authenticated');
create policy "join_requests_delete_admin" on join_requests for delete using (auth.role() = 'authenticated');

-- messages (anyone can send; only admin can read/manage)
create policy "messages_insert_public" on messages for insert with check (true);
create policy "messages_select_admin" on messages for select using (auth.role() = 'authenticated');
create policy "messages_update_admin" on messages for update using (auth.role() = 'authenticated');
create policy "messages_delete_admin" on messages for delete using (auth.role() = 'authenticated');

-- challenges: NO direct select/insert/update for anyone (not even admin) —
-- reads go through the views below, writes go through the RPC functions
-- below, so the flag_hash column is never selectable from the client.
create policy "challenges_delete_admin" on challenges for delete using (auth.role() = 'authenticated');

-- solves: public read (needed for the leaderboard); inserts only via the
-- submit_flag() function below (SECURITY DEFINER bypasses RLS), so there
-- is intentionally no insert policy here.
create policy "solves_select_public" on solves for select using (true);

-- =========================================================================
-- VIEWS  (hide flag_hash from every client, admin included)
-- =========================================================================

-- Public challenge list: published only, no flag_hash, with solve counts.
create view public_challenges
with (security_invoker = false) as
select
  c.id, c.title, c.description, c.category, c.difficulty, c.points, c.published,
  c.created_at, c.updated_at,
  (select count(*) from solves s where s.challenge_id = c.id) as solved_count
from challenges c
where c.published = true;

grant select on public_challenges to anon, authenticated;

-- Admin challenge list: every row, still no flag_hash, plus whether a flag exists.
create view admin_challenges
with (security_invoker = false) as
select
  c.id, c.title, c.description, c.category, c.difficulty, c.points, c.published,
  c.created_at, c.updated_at, true as has_flag
from challenges c;

grant select on admin_challenges to authenticated;

-- Leaderboard: points/solves aggregated per handle.
create view leaderboard
with (security_invoker = false) as
select
  handle,
  sum(points) as points,
  count(*) as solves,
  max(created_at) as last_solve_at
from solves
group by handle
order by points desc, last_solve_at asc;

grant select on leaderboard to anon, authenticated;

-- =========================================================================
-- FUNCTIONS  (SECURITY DEFINER — run with elevated rights, bypass RLS,
-- but each one enforces its own rules explicitly below)
-- =========================================================================

-- Create a challenge. Only callable by a signed-in user (admin).
create or replace function admin_create_challenge(
  p_title text, p_description text, p_category text, p_difficulty text,
  p_points integer, p_flag text, p_published boolean
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  new_id uuid;
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Not authorized';
  end if;

  insert into challenges (title, description, category, difficulty, points, flag_hash, published)
  values (p_title, p_description, p_category, p_difficulty, p_points, crypt(p_flag, gen_salt('bf')), p_published)
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function admin_create_challenge from public;
grant execute on function admin_create_challenge to authenticated;

-- Update a challenge. p_flag = null keeps the existing flag unchanged.
create or replace function admin_update_challenge(
  p_id uuid, p_title text, p_description text, p_category text, p_difficulty text,
  p_points integer, p_flag text, p_published boolean
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Not authorized';
  end if;

  update challenges set
    title = p_title,
    description = p_description,
    category = p_category,
    difficulty = p_difficulty,
    points = p_points,
    published = p_published,
    flag_hash = case when p_flag is not null and length(trim(p_flag)) > 0
                      then crypt(p_flag, gen_salt('bf'))
                      else flag_hash end,
    updated_at = now()
  where id = p_id;
end;
$$;

revoke all on function admin_update_challenge from public;
grant execute on function admin_update_challenge to authenticated;

-- Submit a flag. Callable by anyone (anon or authenticated). Verifies the
-- flag server-side against the hidden flag_hash, records one solve per
-- handle per challenge, and returns the points awarded.
create or replace function submit_flag(p_challenge_id uuid, p_handle text, p_flag text)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_challenge challenges%rowtype;
  v_points integer;
begin
  select * into v_challenge from challenges where id = p_challenge_id and published = true;
  if not found then
    raise exception 'Challenge not found';
  end if;

  if exists (select 1 from solves where challenge_id = p_challenge_id and lower(handle) = lower(p_handle)) then
    raise exception 'You already solved this challenge';
  end if;

  if v_challenge.flag_hash <> crypt(p_flag, v_challenge.flag_hash) then
    raise exception 'Incorrect flag';
  end if;

  insert into solves (challenge_id, handle, points) values (p_challenge_id, p_handle, v_challenge.points);
  v_points := v_challenge.points;
  return v_points;
end;
$$;

revoke all on function submit_flag from public;
grant execute on function submit_flag to anon, authenticated;

-- Approve a join request: marks it approved and creates a Member row.
create or replace function admin_approve_join_request(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_req join_requests%rowtype;
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Not authorized';
  end if;

  select * into v_req from join_requests where id = p_id;
  if not found then raise exception 'Application not found'; end if;

  update join_requests set status = 'approved' where id = p_id;

  if not exists (select 1 from members where email = v_req.email) then
    insert into members (name, email, username, skills)
    values (v_req.name, v_req.email, v_req.username, v_req.skills);
  end if;
end;
$$;

revoke all on function admin_approve_join_request from public;
grant execute on function admin_approve_join_request to authenticated;

-- Admin dashboard stats in one call.
create or replace function admin_stats() returns json
language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Not authorized';
  end if;

  return json_build_object(
    'members', (select count(*) from members),
    'events', (select count(*) from events),
    'projects', (select count(*) from projects),
    'joinRequests', (select count(*) from join_requests where status = 'pending'),
    'messages', (select count(*) from messages where read = false),
    'testimonials', (select count(*) from testimonials),
    'challenges', (select count(*) from challenges),
    'ctfSolves', (select count(*) from solves)
  );
end;
$$;

revoke all on function admin_stats from public;
grant execute on function admin_stats to authenticated;
