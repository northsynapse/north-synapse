-- 持久化自习室系统通知，避免 Realtime 广播因订阅时序而丢失。
create table if not exists public.study_room_notifications (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('admin_entered', 'room_ended')),
  actor_name text not null default 'North Synapse administrator',
  room_name text not null,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);
create index if not exists study_room_notifications_pending_idx
  on public.study_room_notifications(user_id, created_at desc)
  where acknowledged_at is null;
alter table public.study_room_notifications enable row level security;
grant select, update on public.study_room_notifications to authenticated;
drop policy if exists "Users can read their own study room notifications" on public.study_room_notifications;
create policy "Users can read their own study room notifications"
on public.study_room_notifications for select to authenticated
using (user_id = (select auth.uid()));
drop policy if exists "Users can acknowledge their own study room notifications" on public.study_room_notifications;
create policy "Users can acknowledge their own study room notifications"
on public.study_room_notifications for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create or replace function public.notify_admin_entered_study_room(p_room_id uuid, p_admin_name text)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_room_name text; v_count integer;
begin
  if auth.uid() is null or not public.is_current_user_admin() then
    raise exception 'Administrator access required';
  end if;
  select name into v_room_name from public.study_rooms
  where id = p_room_id and status = 'active';
  if v_room_name is null then raise exception 'Study room is unavailable'; end if;
  if not exists (select 1 from public.study_room_active_members where room_id = p_room_id and user_id = auth.uid()) then
    raise exception 'Administrator must join the room first';
  end if;
  insert into public.study_room_notifications(room_id,user_id,event_type,actor_name,room_name)
  select p_room_id, am.user_id, 'admin_entered',
    left(coalesce(nullif(trim(p_admin_name),''),'North Synapse administrator'),80), v_room_name
  from public.study_room_active_members am
  where am.room_id = p_room_id and am.user_id <> auth.uid();
  get diagnostics v_count = row_count;
  return v_count;
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
  v_room_name text;
  v_actor_name text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select owner_id, is_system_lobby, name into v_owner_id, v_is_system_lobby, v_room_name
  from public.study_rooms where id = p_room_id and status = 'active' for update;
  if not found then raise exception 'Study room is unavailable'; end if;
  if v_is_system_lobby then raise exception 'The public lobby cannot be ended'; end if;
  if v_owner_id <> v_user_id and not public.is_current_user_admin() then
    raise exception 'Only the room owner or an administrator can end this room';
  end if;
  if v_owner_id = v_user_id and not exists (
    select 1 from public.study_room_active_members where room_id = p_room_id and user_id = v_user_id
  ) then raise exception 'Only an active room owner can end this room'; end if;

  select coalesce(nullif(p.nickname,''), nullif(p.username,''), 'North Synapse administrator')
  into v_actor_name from public.profiles p where p.id = v_user_id;
  if public.is_current_user_admin() and v_owner_id <> v_user_id then
    v_actor_name := coalesce(v_actor_name, 'North Synapse administrator');
  else
    v_actor_name := coalesce(v_actor_name, 'Room host');
  end if;

  insert into public.study_room_notifications(room_id,user_id,event_type,actor_name,room_name)
  select p_room_id, am.user_id, 'room_ended', v_actor_name, v_room_name
  from public.study_room_active_members am
  where am.room_id = p_room_id and am.user_id <> v_user_id;

  update public.study_rooms set status = 'ended', closed_at = now(), empty_since = null
  where id = p_room_id;
  delete from public.study_room_active_members where room_id = p_room_id;
  delete from public.study_room_members where room_id = p_room_id;
  delete from public.study_room_presence where room_id = p_room_id;
  return true;
end;
$$;

revoke all on function public.notify_admin_entered_study_room(uuid,text) from public, anon;
grant execute on function public.notify_admin_entered_study_room(uuid,text) to authenticated;
revoke all on function public.end_study_room_v2(uuid) from public, anon;
grant execute on function public.end_study_room_v2(uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.study_room_notifications; exception when duplicate_object then null; when others then null; end;
  end if;
end;
$$;
notify pgrst, 'reload schema';
