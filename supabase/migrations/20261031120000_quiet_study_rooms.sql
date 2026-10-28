-- Quiet study rooms: durable chat history and database-backed online presence.
create table if not exists public.study_room_presence (
  room_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default 'Student',
  avatar_url text not null default '',
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  study_seconds integer not null default 0 check (study_seconds >= 0),
  primary key (room_id, user_id)
);
create table if not exists public.study_room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default 'Student',
  avatar_url text not null default '',
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists study_room_presence_last_seen_idx on public.study_room_presence (room_id, last_seen_at);
create index if not exists study_room_messages_room_created_idx on public.study_room_messages (room_id, created_at);
alter table public.study_room_presence enable row level security;
alter table public.study_room_messages enable row level security;
drop policy if exists "Authenticated users can read study room presence" on public.study_room_presence;
create policy "Authenticated users can read study room presence" on public.study_room_presence for select to authenticated using (true);
drop policy if exists "Users can manage their own study room presence" on public.study_room_presence;
create policy "Users can manage their own study room presence" on public.study_room_presence for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "Authenticated users can read study room messages" on public.study_room_messages;
create policy "Authenticated users can read study room messages" on public.study_room_messages for select to authenticated using (true);
drop policy if exists "Users can send their own study room messages" on public.study_room_messages;
create policy "Users can send their own study room messages" on public.study_room_messages for insert to authenticated with check (user_id = (select auth.uid()));
create or replace function public.heartbeat_study_room(p_room_id text, p_display_name text, p_avatar_url text, p_seconds integer default 0)
returns integer language plpgsql security invoker set search_path = public as $$
declare current_seconds integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_room_id is null or char_length(p_room_id) > 80 then raise exception 'Invalid room'; end if;
  if p_seconds is null or p_seconds < 0 or p_seconds > 30 then raise exception 'Invalid study time increment'; end if;
  insert into public.study_room_presence (room_id, user_id, display_name, avatar_url, joined_at, last_seen_at, study_seconds)
  values (p_room_id, auth.uid(), left(coalesce(nullif(trim(p_display_name), ''), 'Student'), 80), coalesce(p_avatar_url, ''), now(), now(), p_seconds)
  on conflict (room_id, user_id) do update set display_name = excluded.display_name, avatar_url = excluded.avatar_url, last_seen_at = now(), study_seconds = public.study_room_presence.study_seconds + p_seconds
  returning study_seconds into current_seconds;
  return current_seconds;
end;
$$;
grant execute on function public.heartbeat_study_room(text, text, text, integer) to authenticated;
grant select, insert on public.study_room_messages to authenticated;
grant select, insert, update, delete on public.study_room_presence to authenticated;
