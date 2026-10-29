-- 管理员可以查看并进入所有有效自习室，包括私密自习室。
-- 管理员进入私密房间时不需要房间密码；普通用户仍然必须提供正确密码。

create policy "Admins can view all active study rooms"
on public.study_rooms for select to authenticated
using (
  status = 'active'
  and (select public.is_current_user_admin())
);

create policy "Admins can view all room members"
on public.study_room_active_members for select to authenticated
using ((select public.is_current_user_admin()));

create policy "Admins can view all room presence"
on public.study_room_presence for select to authenticated
using ((select public.is_current_user_admin()));

create policy "Admins can view all room messages"
on public.study_room_messages for select to authenticated
using ((select public.is_current_user_admin()));

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
  v_old_room_id uuid;
  v_old_owner uuid;
  v_old_next_owner uuid;
  v_old_remaining integer;
  v_is_admin boolean := coalesce(public.is_current_user_admin(), false);
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_room_id is null then
    raise exception 'Invalid study room';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text)::bigint);
  select room_id into v_old_room_id
  from public.study_room_active_members
  where user_id = v_user_id;

  perform 1
  from public.study_rooms
  where id = p_room_id or id = v_old_room_id
  order by id
  for update;

  select * into v_room
  from public.study_rooms
  where id = p_room_id and status = 'active';

  if not found then
    raise exception 'Study room is unavailable';
  end if;

  if v_room.is_private
     and coalesce(v_room.room_code, '') <> upper(trim(coalesce(p_room_code, '')))
     and not v_is_admin then
    raise exception 'Invalid room code';
  end if;

  if v_old_room_id is not null and v_old_room_id <> p_room_id then
    select owner_id into v_old_owner
    from public.study_rooms
    where id = v_old_room_id and status = 'active';

    if v_old_owner = v_user_id then
      select user_id into v_old_next_owner
      from public.study_room_active_members
      where room_id::text = v_old_room_id::text and user_id <> v_user_id
      order by joined_at asc
      limit 1;
    end if;

    delete from public.study_room_active_members
    where user_id = v_user_id and room_id::text = v_old_room_id::text;
    delete from public.study_room_members
    where user_id = v_user_id and room_id::text = v_old_room_id::text;
    delete from public.study_room_presence
    where user_id = v_user_id and room_id::text = v_old_room_id::text;

    select count(*) into v_old_remaining
    from public.study_room_active_members
    where room_id::text = v_old_room_id::text;

    update public.study_rooms
    set owner_id = case
          when v_old_remaining = 0 and not is_system_lobby then null
          when v_old_owner = v_user_id then v_old_next_owner
          else owner_id
        end,
        empty_since = case when v_old_remaining = 0 and not is_system_lobby then coalesce(empty_since, now()) else null end,
        last_activity_at = now()
    where id = v_old_room_id and status = 'active';
  end if;

  update public.study_rooms
  set owner_id = case when owner_id is null and not is_system_lobby then v_user_id else owner_id end,
      empty_since = null,
      last_activity_at = now()
  where id = p_room_id;

  insert into public.study_room_active_members(user_id, room_id, joined_at)
  values (v_user_id, p_room_id, now())
  on conflict (user_id) do update
    set room_id = excluded.room_id,
        joined_at = case
          when public.study_room_active_members.room_id = excluded.room_id
          then public.study_room_active_members.joined_at
          else excluded.joined_at
        end;

  insert into public.study_room_members(user_id, room_id, joined_at)
  values (v_user_id, p_room_id, now())
  on conflict (user_id, room_id) do nothing;

  return p_room_id;
end;
$$;

revoke all on function public.join_study_room_v2(uuid, text) from public, anon;
grant execute on function public.join_study_room_v2(uuid, text) to authenticated;
