-- 自习室数据库迁移测试用的最小 Supabase 兼容结构；仅供 CI 临时数据库使用。
create extension if not exists pgcrypto;

do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;

create schema if not exists auth;
create table auth.users (
  id uuid primary key
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text not null default '',
  nickname text not null default ''
);

create table public.study_rooms (
  id text primary key,
  name text not null check (char_length(trim(name)) between 1 and 100),
  subject text not null default 'General Study',
  description text not null default '',
  is_private boolean not null default false,
  room_code text unique,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  constraint private_room_requires_code check ((is_private and room_code is not null) or (not is_private and room_code is null))
);

create table public.study_room_members (
  room_id text not null references public.study_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
alter table public.study_room_members enable row level security;

create table public.study_room_presence (
  room_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default 'Student',
  avatar_url text not null default '',
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  study_seconds integer not null default 0,
  primary key (room_id, user_id)
);

create table public.study_room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default 'Student',
  avatar_url text not null default '',
  body text not null,
  created_at timestamptz not null default now()
);

create table public.study_room_goals (
  room_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  goal text not null default '' check (char_length(goal) <= 500),
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

alter table public.study_room_presence enable row level security;
alter table public.study_room_messages enable row level security;
alter table public.study_room_goals enable row level security;
