-- North Synapse 自习室生命周期与权限补充迁移
-- 本迁移只扩展自习室相关表，不修改资源中心、讨论区或个人资料表。

alter table public.study_rooms
  add column if not exists owner_id uuid references auth.users(id) on delete set null,
  add column if not exists is_system_lobby boolean not null default false,
  add column if not exists status text not null default 'active',
  add column if not exists empty_since timestamptz,
  add column if not exists closed_at timestamptz;

alter table public.study_rooms alter column created_by drop not null;

update public.study_rooms
set owner_id = created_by
where owner_id is null and created_by is not null;

alter table public.study_rooms
  drop constraint if exists study_rooms_status_check;
alter table public.study_rooms
  add constraint study_rooms_status_check check (status in ('active', 'ended'));

create unique index if not exists study_rooms_single_system_lobby
  on public.study_rooms (is_system_lobby)
  where is_system_lobby = true;

create index if not exists study_rooms_active_created_idx
  on public.study_rooms (status, created_at desc);
create index if not exists study_rooms_active_users_idx
  on public.study_rooms (status, empty_since);

-- 在线成员的权威记录：user_id 主键确保一个账号同时只能加入一个房间。
create table if not exists public.study_room_active_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  joined_at timestamptz not null default now()
);
create index if not exists study_room_active_members_room_joined_idx
  on public.study_room_active_members (room_id, joined_at asc);

-- 踢出通知由数据库写入，只有被踢出的用户可以读取自己的通知。
create table if not exists public.study_room_kick_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);
create index if not exists study_room_kick_events_user_pending_idx
  on public.study_room_kick_events (user_id, created_at desc)
  where acknowledged_at is null;

alter table public.study_room_active_members enable row level security;
alter table public.study_room_kick_events enable row level security;

drop policy if exists "Authenticated users can read active study room members" on public.study_room_active_members;
create policy "Authenticated users can read active study room members"
  on public.study_room_active_members for select to authenticated
  using (true);

drop policy if exists "Users can read their own study room kick events" on public.study_room_kick_events;
create policy "Users can read their own study room kick events"
  on public.study_room_kick_events for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can acknowledge their own study room kick events" on public.study_room_kick_events;
create policy "Users can acknowledge their own study room kick events"
  on public.study_room_kick_events for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 加入房间：先原子化移除该用户的旧房间，再登记唯一的当前房间。
create or replace function public.join_study_room_v2(
  p_room_id uuid,
  p_room_code text default null
) returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_room public.study_rooms%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_room
  from public.study_rooms
  where id = p_room_id and status = 'active'
  for update;

  if not found then
    raise exception 'Study room is unavailable';
  end if;

  if v_room.is_private and coalesce(v_room.room_code, '') <> upper(trim(coalesce(p_room_code, ''))) then
    raise exception 'Invalid room code';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text)::bigint);

  delete from public.study_room_active_members where user_id = v_user_id;
  delete from public.study_room_members where user_id = v_user_id;
  delete from public.study_room_presence where user_id = v_user_id;

  if v_room.owner_id is null and not v_room.is_system_lobby then
    update public.study_rooms
    set owner_id = v_user_id, empty_since = null, last_activity_at = now()
    where id = p_room_id;
  else
    update public.study_rooms
    set empty_since = null, last_activity_at = now()
    where id = p_room_id;
  end if;

  insert into public.study_room_active_members(user_id, room_id, joined_at)
  values (v_user_id, p_room_id, now())
  on conflict (user_id) do update
    set room_id = excluded.room_id, joined_at = excluded.joined_at;

  insert into public.study_room_members(room_id, user_id)
  values (p_room_id, v_user_id)
  on conflict (room_id, user_id) do nothing;

  return p_room_id;
end;
$$;

create or replace function public.join_private_study_room_v2(p_room_code text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_room_id uuid;
begin
  select id into v_room_id
  from public.study_rooms
  where status = 'active'
    and is_private = true
    and room_code = upper(trim(coalesce(p_room_code, '')))
  limit 1;

  if v_room_id is null then
    raise exception 'No private room found for this code';
  end if;

  return public.join_study_room_v2(v_room_id, p_room_code);
end;
$$;

-- 主动离开时：房主可指定新房主；未指定则交给最早加入的剩余成员。
-- 如果房间暂时无人，保留 24 小时并设置 empty_since，之后由清理任务关闭。
create or replace function public.leave_study_room_v2(
  p_room_id uuid,
  p_new_owner_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_current_owner uuid;
  v_next_owner uuid;
  v_remaining integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select owner_id into v_current_owner
  from public.study_rooms
  where id = p_room_id and status = 'active'
  for update;

  if not found then return null; end if;

  if v_current_owner = v_user_id then
    if p_new_owner_id is not null then
      select user_id into v_next_owner
      from public.study_room_active_members
      where room_id = p_room_id and user_id = p_new_owner_id and user_id <> v_user_id;
      if v_next_owner is null then raise exception 'Selected new owner is not an active room member'; end if;
    else
      select user_id into v_next_owner
      from public.study_room_active_members
      where room_id = p_room_id and user_id <> v_user_id
      order by joined_at asc
      limit 1;
    end if;
  end if;

  delete from public.study_room_active_members where user_id = v_user_id and room_id = p_room_id;
  delete from public.study_room_members where user_id = v_user_id and room_id = p_room_id;
  delete from public.study_room_presence where user_id = v_user_id and room_id = p_room_id;

  select count(*) into v_remaining
  from public.study_room_active_members where room_id = p_room_id;

  if v_current_owner = v_user_id then
    update public.study_rooms
    set owner_id = v_next_owner,
        empty_since = case when v_remaining = 0 then now() else null end,
        last_activity_at = now()
    where id = p_room_id;
  elsif v_remaining = 0 then
    update public.study_rooms set owner_id = null, empty_since = now(), last_activity_at = now() where id = p_room_id;
  end if;

  return v_next_owner;
end;
$$;

create or replace function public.kick_study_room_member_v2(
  p_room_id uuid,
  p_target_user_id uuid
) returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_remaining integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_target_user_id = v_user_id then raise exception 'Room owner cannot kick themselves'; end if;

  select owner_id into v_owner_id
  from public.study_rooms
  where id = p_room_id and status = 'active'
  for update;

  if not found or v_owner_id <> v_user_id then raise exception 'Only the room owner can remove members'; end if;

  if not exists (
    select 1 from public.study_room_active_members
    where room_id = p_room_id and user_id = p_target_user_id
  ) then raise exception 'Target user is not an active member'; end if;

  insert into public.study_room_kick_events(room_id, user_id)
  values (p_room_id, p_target_user_id);

  delete from public.study_room_active_members where room_id = p_room_id and user_id = p_target_user_id;
  delete from public.study_room_members where room_id = p_room_id and user_id = p_target_user_id;
  delete from public.study_room_presence where room_id = p_room_id and user_id = p_target_user_id;

  select count(*) into v_remaining from public.study_room_active_members where room_id = p_room_id;
  if v_remaining = 0 then
    update public.study_rooms set empty_since = now(), last_activity_at = now() where id = p_room_id;
  end if;
  return true;
end;
$$;

create or replace function public.end_study_room_v2(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_is_system_lobby boolean;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select owner_id, is_system_lobby into v_owner_id, v_is_system_lobby
  from public.study_rooms
  where id = p_room_id and status = 'active'
  for update;

  if not found then raise exception 'Study room is unavailable'; end if;
  if v_is_system_lobby then raise exception 'The public lobby cannot be ended'; end if;
  if v_owner_id <> v_user_id then raise exception 'Only the room owner can end this room'; end if;

  update public.study_rooms
  set status = 'ended', closed_at = now(), empty_since = null
  where id = p_room_id;

  delete from public.study_room_active_members where room_id = p_room_id;
  delete from public.study_room_members where room_id = p_room_id;
  delete from public.study_room_presence where room_id = p_room_id;
  return true;
end;
$$;

-- 定时清理：两分钟无心跳视为离线；无人房间保留 24 小时后关闭。
create or replace function public.cleanup_study_rooms()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room record;
  v_removed integer := 0;
  v_owner uuid;
begin
  delete from public.study_room_active_members am
  where not exists (
    select 1 from public.study_room_presence p
    where p.room_id = am.room_id
      and p.user_id = am.user_id
      and p.last_seen_at > now() - interval '2 minutes'
  );

  delete from public.study_room_members m
  where not exists (
    select 1 from public.study_room_active_members am
    where am.room_id = m.room_id and am.user_id = m.user_id
  );

  delete from public.study_room_presence p
  where p.last_seen_at <= now() - interval '2 minutes';

  for v_room in
    select id, owner_id
    from public.study_rooms
    where status = 'active' and is_system_lobby = false
  loop
    select user_id into v_owner
    from public.study_room_active_members
    where room_id = v_room.id and user_id = v_room.owner_id;

    if v_owner is null then
      select user_id into v_owner
      from public.study_room_active_members
      where room_id = v_room.id
      order by joined_at asc
      limit 1;
      update public.study_rooms set owner_id = v_owner where id = v_room.id;
    end if;

    if exists (select 1 from public.study_room_active_members where room_id = v_room.id) then
      update public.study_rooms set empty_since = null where id = v_room.id;
    else
      update public.study_rooms set empty_since = coalesce(empty_since, now()) where id = v_room.id;
    end if;
  end loop;

  update public.study_rooms
  set status = 'ended', closed_at = now()
  where is_system_lobby = false
    and status = 'active'
    and empty_since < now() - interval '24 hours';

  get diagnostics v_removed = row_count;
  return v_removed;
end;
$$;

-- 尝试通过 Supabase pg_cron 每 5 分钟运行清理；若项目未启用 pg_cron，迁移仍可成功。
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule('north-synapse-study-room-cleanup');
    exception when others then
      null;
    end;
    begin
      perform cron.schedule(
        'north-synapse-study-room-cleanup',
        '*/5 * * * *',
        'select public.cleanup_study_rooms();'
      );
    exception when others then
      null;
    end;
  end if;
end;
$$;

-- 固定公共大厅：若历史表约束允许系统创建者为空，则创建 The Commons。
-- 如果当前项目对 created_by 有额外 NOT NULL 约束，需在 Supabase 中手动指定系统创建者后运行该 INSERT。
insert into public.study_rooms
  (id, name, subject, description, is_private, room_code, created_by, owner_id, is_system_lobby, status, empty_since)
values
  ('00000000-0000-4000-8000-000000000001'::uuid,
   'The Commons', 'General Study',
   'The permanent public study hall. Open to all authenticated students.',
   false, null, null, null, true, 'active', null)
on conflict (id) do update
set name = excluded.name,
    subject = excluded.subject,
    description = excluded.description,
    is_private = false,
    is_system_lobby = true,
    status = 'active',
    empty_since = null;

-- Realtime 订阅允许存在时才加入 publication；重复添加不阻断迁移。
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.study_room_active_members; exception when duplicate_object then null; when others then null; end;
    begin alter publication supabase_realtime add table public.study_room_messages; exception when duplicate_object then null; when others then null; end;
    begin alter publication supabase_realtime add table public.study_room_kick_events; exception when duplicate_object then null; when others then null; end;
  end if;
end;
$$;

revoke all on function public.join_study_room_v2(uuid, text) from public, anon;
revoke all on function public.join_private_study_room_v2(text) from public, anon;
revoke all on function public.leave_study_room_v2(uuid, uuid) from public, anon;
revoke all on function public.kick_study_room_member_v2(uuid, uuid) from public, anon;
revoke all on function public.end_study_room_v2(uuid) from public, anon;
revoke all on function public.cleanup_study_rooms() from public, anon, authenticated;

grant execute on function public.join_study_room_v2(uuid, text) to authenticated;
grant execute on function public.join_private_study_room_v2(text) to authenticated;
grant execute on function public.leave_study_room_v2(uuid, uuid) to authenticated;
grant execute on function public.kick_study_room_member_v2(uuid, uuid) to authenticated;
grant execute on function public.end_study_room_v2(uuid) to authenticated;
grant execute on function public.cleanup_study_rooms() to service_role;


-- Private-room metadata and chat are scoped by room membership.
-- Replace existing SELECT policies on these feature tables so an older permissive policy
-- cannot accidentally expose private room codes or private-room chat history.
alter table public.study_rooms enable row level security;
alter table public.study_room_messages enable row level security;
alter table public.study_room_presence enable row level security;

do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'study_rooms'
  loop
    execute format('drop policy %I on public.study_rooms', p.policyname);
  end loop;
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'study_room_messages'
  loop
    execute format('drop policy %I on public.study_room_messages', p.policyname);
  end loop;
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'study_room_presence'
  loop
    execute format('drop policy %I on public.study_room_presence', p.policyname);
  end loop;
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'study_room_active_members'
  loop
    execute format('drop policy %I on public.study_room_active_members', p.policyname);
  end loop;
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'study_room_kick_events'
  loop
    execute format('drop policy %I on public.study_room_kick_events', p.policyname);
  end loop;
end;
$;

create policy "Study rooms visible only when public or joined"
on public.study_rooms for select to authenticated
using (
  status = 'active'
  and (
    not is_private
    or created_by = auth.uid()
    or owner_id = auth.uid()
    or exists (
      select 1 from public.study_room_active_members am
      where am.room_id = study_rooms.id and am.user_id = auth.uid()
    )
  )
);

create policy "Authenticated students can create their own study rooms"
on public.study_rooms for insert to authenticated
with check (
  created_by = auth.uid()
  and owner_id = auth.uid()
  and coalesce(is_system_lobby, false) = false
  and status = 'active'
);

create policy "Study room messages readable by room members"
on public.study_room_messages for select to authenticated
using (
  exists (
    select 1 from public.study_room_active_members am
    where am.room_id = study_room_messages.room_id and am.user_id = auth.uid()
  )
);

create policy "Active members can send study room messages"
on public.study_room_messages for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.study_room_active_members am
    where am.room_id = study_room_messages.room_id and am.user_id = auth.uid()
  )
);

create policy "Presence visible in public rooms or to private room members"
on public.study_room_presence for select to authenticated
using (
  exists (
    select 1 from public.study_rooms r
    where r.id = study_room_presence.room_id
      and (
        not r.is_private
        or exists (
          select 1 from public.study_room_active_members am
          where am.room_id = r.id and am.user_id = auth.uid()
        )
      )
  )
);

create or replace function public.can_view_study_room_members(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $
  select exists (
    select 1 from public.study_rooms r
    where r.id = p_room_id
      and (
        not r.is_private
        or exists (
          select 1 from public.study_room_active_members am
          where am.room_id = r.id and am.user_id = auth.uid()
        )
      )
  );
$;

revoke all on function public.can_view_study_room_members(uuid) from public, anon;
grant execute on function public.can_view_study_room_members(uuid) to authenticated;

create policy "Authenticated users can read visible room membership"
on public.study_room_active_members for select to authenticated
using (user_id = auth.uid() or public.can_view_study_room_members(room_id));

create policy "Users can read their own study room kick events"
on public.study_room_kick_events for select to authenticated
using (user_id = auth.uid());

create policy "Users can acknowledge their own study room kick events"
on public.study_room_kick_events for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can remove their own room presence"
on public.study_room_presence for delete to authenticated
using (user_id = auth.uid());

-- Keep lifecycle/ownership fields under RPC control rather than direct client updates.
create or replace function public.guard_study_room_lifecycle_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      if new.created_by is distinct from auth.uid()
         or new.owner_id is distinct from auth.uid()
         or coalesce(new.is_system_lobby, false)
         or coalesce(new.status, 'active') <> 'active'
         or new.closed_at is not null then
        raise exception 'Lifecycle fields may only be set by trusted room operations';
      end if;
    else
      if new.owner_id is distinct from old.owner_id
         or new.is_system_lobby is distinct from old.is_system_lobby
         or new.status is distinct from old.status
         or new.empty_since is distinct from old.empty_since
         or new.closed_at is distinct from old.closed_at then
        raise exception 'Lifecycle fields may only be changed by trusted room operations';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_study_room_lifecycle_fields on public.study_rooms;
create trigger guard_study_room_lifecycle_fields
before insert or update on public.study_rooms
for each row execute function public.guard_study_room_lifecycle_fields();

-- Publish the room directory itself for live status/owner updates.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.study_rooms; exception when duplicate_object then null; when others then null; end;
  end if;
end;
$$;
