-- Persistent public/private study rooms, room codes, and activity sorting.
create table if not exists public.study_rooms (
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

create table if not exists public.study_room_members (
  room_id text not null references public.study_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index if not exists study_rooms_created_at_idx on public.study_rooms (created_at desc);
create index if not exists study_rooms_last_activity_idx on public.study_rooms (last_activity_at desc);
create index if not exists study_room_members_user_idx on public.study_room_members (user_id, joined_at desc);

alter table public.study_rooms enable row level security;
alter table public.study_room_members enable row level security;
grant select on public.study_rooms to anon, authenticated;
grant insert, update on public.study_rooms to authenticated;
grant select, insert, delete on public.study_room_members to authenticated;

drop policy if exists "Users can view public rooms and rooms they belong to" on public.study_rooms;
create policy "Users can view public rooms and rooms they belong to" on public.study_rooms
for select to anon, authenticated using (
  not is_private
  or created_by = (select auth.uid())
  or exists (select 1 from public.study_room_members m where m.room_id = id and m.user_id = (select auth.uid()))
);
drop policy if exists "Authenticated users can create study rooms" on public.study_rooms;
create policy "Authenticated users can create study rooms" on public.study_rooms
for insert to authenticated with check (created_by = (select auth.uid()));
drop policy if exists "Room owners can update their rooms" on public.study_rooms;
create policy "Room owners can update their rooms" on public.study_rooms
for update to authenticated using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()));
drop policy if exists "Users can view study room memberships in rooms they can access" on public.study_room_members;
create policy "Users can view their own study room memberships" on public.study_room_members
for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Room owners can add members" on public.study_room_members;
create policy "Room owners can add members" on public.study_room_members
for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.study_rooms r where r.id = room_id and (not r.is_private or r.created_by = (select auth.uid())))
);
drop policy if exists "Users can leave rooms" on public.study_room_members;
create policy "Users can leave rooms" on public.study_room_members
for delete to authenticated using (user_id = (select auth.uid()));

-- A room code grants membership without exposing private-room records in the public list.
create or replace function public.join_private_study_room(p_room_code text)
returns table (id text, name text, subject text, description text, is_private boolean, room_code text, created_at timestamptz, last_activity_at timestamptz, created_by uuid)
language plpgsql
security definer
set search_path = public
as $$
declare target public.study_rooms%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into target from public.study_rooms r
    where r.is_private and upper(r.room_code) = upper(trim(p_room_code))
    limit 1;
  if target.id is null then raise exception 'Private room code not found'; end if;
  insert into public.study_room_members (room_id, user_id)
  values (target.id, auth.uid())
  on conflict (room_id, user_id) do nothing;
  return query select target.id, target.name, target.subject, target.description, target.is_private,
    null::text, target.created_at, target.last_activity_at, target.created_by;
end;
$$;
grant execute on function public.join_private_study_room(text) to authenticated;

-- Restrict private-room presence and messages to members; public rooms remain open to signed-in students.
drop policy if exists "Authenticated users can read study room presence" on public.study_room_presence;
create policy "Authenticated users can read study room presence" on public.study_room_presence
for select to authenticated using (
  exists (select 1 from public.study_rooms r where r.id = room_id and (not r.is_private or exists (select 1 from public.study_room_members m where m.room_id = r.id and m.user_id = (select auth.uid()))))
);
drop policy if exists "Users can manage their own study room presence" on public.study_room_presence;
create policy "Users can manage their own study room presence" on public.study_room_presence
for all to authenticated using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid()) and exists (select 1 from public.study_rooms r where r.id = room_id and (not r.is_private or exists (select 1 from public.study_room_members m where m.room_id = r.id and m.user_id = (select auth.uid()))))
);
drop policy if exists "Authenticated users can read study room messages" on public.study_room_messages;
create policy "Authenticated users can read study room messages" on public.study_room_messages
for select to authenticated using (
  exists (select 1 from public.study_rooms r where r.id = room_id and (not r.is_private or exists (select 1 from public.study_room_members m where m.room_id = r.id and m.user_id = (select auth.uid()))))
);
drop policy if exists "Users can send their own study room messages" on public.study_room_messages;
create policy "Users can send their own study room messages" on public.study_room_messages
for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (select 1 from public.study_rooms r where r.id = room_id and (not r.is_private or exists (select 1 from public.study_room_members m where m.room_id = r.id and m.user_id = (select auth.uid()))))
);

-- Seed the existing rooms into persistent storage. This is safe to run more than once.
insert into public.study_rooms (id, name, subject, description, is_private, room_code, created_by)
values
  ('l1', 'AP Calculus & Advanced Math Focus', 'Mathematics', 'Silent study & problem solving for AP Calculus and Fermat/Euclid contest prep.', false, null, null),
  ('l2', 'Grade 11 & 12 Physics / Chemistry Lab', 'Science', 'Discussion & peer review for physics problem sets and chemistry labs.', false, null, null),
  ('l3', 'Computer Science & Algorithmic Practice', 'Computer Science & Tech', 'CCC Contest coding practice and Python/Java algorithm discussions.', false, null, null)
on conflict (id) do nothing;

-- Update room activity whenever a member sends a message or checks in.
create or replace function public.touch_study_room_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.study_rooms set last_activity_at = now() where id = new.room_id;
  return new;
end;
$$;
drop trigger if exists study_room_messages_touch_activity on public.study_room_messages;
create trigger study_room_messages_touch_activity after insert on public.study_room_messages
for each row execute function public.touch_study_room_activity();

create or replace function public.heartbeat_study_room(p_room_id text, p_display_name text, p_avatar_url text, p_seconds integer default 0)
returns integer language plpgsql security invoker set search_path = public as $$
declare current_seconds integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_room_id is null or char_length(p_room_id) > 80 then raise exception 'Invalid room'; end if;
  if p_seconds is null or p_seconds < 0 or p_seconds > 30 then raise exception 'Invalid study time increment'; end if;
  if not exists (select 1 from public.study_rooms r where r.id = p_room_id and (not r.is_private or exists (
    select 1 from public.study_room_members m where m.room_id = r.id and m.user_id = auth.uid()
  ))) then raise exception 'Room not found or membership required'; end if;
  insert into public.study_room_presence (room_id, user_id, display_name, avatar_url, joined_at, last_seen_at, study_seconds)
  values (p_room_id, auth.uid(), left(coalesce(nullif(trim(p_display_name), ''), 'Student'), 80), coalesce(p_avatar_url, ''), now(), now(), p_seconds)
  on conflict (room_id, user_id) do update set display_name = excluded.display_name, avatar_url = excluded.avatar_url, last_seen_at = now(), study_seconds = public.study_room_presence.study_seconds + p_seconds
  returning study_seconds into current_seconds;
  update public.study_rooms set last_activity_at = now() where id = p_room_id;
  return current_seconds;
end;
$$;
grant execute on function public.heartbeat_study_room(text, text, text, integer) to authenticated;
