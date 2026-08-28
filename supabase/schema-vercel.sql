-- DragonByte — Supabase schema for the all-on-Vercel deployment.
--
-- This is deliberately simple: the Express/Vercel backend always talks to
-- Supabase using the SERVICE ROLE key (server-side only, never exposed to
-- the browser), which bypasses Row Level Security entirely. So there's no
-- RLS policy complexity here — Supabase is just acting as persistent
-- storage for the same Express app that used to write to a local JSON file.
--
-- Column names are camelCase and quoted so the JSON returned by
-- @supabase/supabase-js matches the shapes the existing route code already
-- expects, with zero mapping/translation layer needed.
--
-- HOW TO USE:
--   1. Create a free project at https://supabase.com
--   2. Open the SQL Editor (left sidebar) → New query
--   3. Paste this entire file → Run
--   4. Go to Project Settings → API → copy the "Project URL" and the
--      "service_role" secret key into your Vercel environment variables
--      (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)

create extension if not exists pgcrypto;

-- ── Admin (single row) ──────────────────────────────────────────────────
create table if not exists admin (
  id text primary key default 'main',
  username text not null,
  "passwordHash" text not null
);

-- ── Events ───────────────────────────────────────────────────────────────
create table if not exists events (
  id text primary key,
  "createdAt" text not null,
  "updatedAt" text not null,
  published boolean not null default true,
  featured boolean not null default false,
  title text not null,
  slug text unique,
  category text,
  description text,
  date text,
  time text,
  location text,
  "registrationUrl" text
);

-- ── Projects ─────────────────────────────────────────────────────────────
create table if not exists projects (
  id text primary key,
  "createdAt" text not null,
  "updatedAt" text not null,
  published boolean not null default true,
  featured boolean not null default false,
  name text not null,
  slug text unique,
  category text,
  description text,
  technologies jsonb default '[]'::jsonb,
  "githubUrl" text,
  "demoUrl" text,
  "resourceUrl" text
);

-- ── Contributors / members shown on the Community page ────────────────────
create table if not exists contributors (
  id text primary key,
  "createdAt" text not null,
  "updatedAt" text not null,
  featured boolean not null default false,
  name text not null,
  role text,
  bio text,
  skills jsonb default '[]'::jsonb
);

-- ── Testimonials ─────────────────────────────────────────────────────────
create table if not exists testimonials (
  id text primary key,
  "createdAt" text not null,
  "updatedAt" text not null,
  approved boolean not null default false,
  quote text not null,
  name text not null,
  role text
);

-- ── Members (created automatically when a join request is approved) ──────
create table if not exists members (
  id text primary key,
  name text not null,
  email text not null,
  username text,
  skills text,
  interests jsonb default '[]'::jsonb,
  "joinedAt" text not null
);

-- ── Join requests ────────────────────────────────────────────────────────
create table if not exists "joinRequests" (
  id text primary key,
  status text not null default 'pending',
  "createdAt" text not null,
  name text not null,
  email text not null,
  username text,
  experience text,
  skills text,
  interests jsonb default '[]'::jsonb,
  github text,
  linkedin text,
  message text
);

-- ── Contact messages ─────────────────────────────────────────────────────
create table if not exists messages (
  id text primary key,
  read boolean not null default false,
  "createdAt" text not null,
  name text not null,
  email text not null,
  subject text not null,
  message text not null
);

-- ── CTF challenges (flagHash never leaves the server) ─────────────────────
create table if not exists challenges (
  id text primary key,
  "createdAt" text not null,
  "updatedAt" text not null,
  published boolean not null default true,
  title text not null,
  category text,
  description text,
  points integer default 0,
  "flagHash" text not null
);

-- ── CTF solves ───────────────────────────────────────────────────────────
create table if not exists solves (
  id text primary key,
  "challengeId" text not null references challenges(id) on delete cascade,
  handle text not null,
  points integer default 0,
  "createdAt" text not null
);

create index if not exists solves_challenge_idx on solves("challengeId");
create index if not exists solves_handle_idx on solves(lower(handle));
