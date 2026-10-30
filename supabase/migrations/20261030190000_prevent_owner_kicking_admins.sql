-- 房主不能移除管理员：在数据库函数层进行权限校验，避免绕过前端直接调用 RPC。
create or replace function public.kick_study_room_member_v2(
  p_room_id uuid,
  p_target_user_id uuid,
  p_reason text default null
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

  if not found or v_owner_id <> v_user_id then
    raise exception 'Only the room owner can remove members';
  end if;
  if not exists (
    select 1 from public.study_room_active_members
    where room_id::text = p_room_id::text and user_id = v_user_id
  ) then raise exception 'Only an active room owner can remove members'; end if;

  if exists (select 1 from public.admin_users where user_id = p_target_user_id) then
    raise exception 'Room owners cannot remove administrators';
  end if;

  if not exists (
    select 1 from public.study_room_active_members
    where room_id::text = p_room_id::text and user_id = p_target_user_id
  ) then raise exception 'Target user is not an active member'; end if;

  insert into public.study_room_kick_events(room_id, user_id, reason)
  values (p_room_id, p_target_user_id, nullif(left(trim(coalesce(p_reason, '')), 300), ''));

  delete from public.study_room_active_members
  where room_id::text = p_room_id::text and user_id = p_target_user_id;
  delete from public.study_room_members
  where room_id::text = p_room_id::text and user_id = p_target_user_id;
  delete from public.study_room_presence
  where room_id::text = p_room_id::text and user_id = p_target_user_id;

  select count(*) into v_remaining
  from public.study_room_active_members where room_id::text = p_room_id::text;
  if v_remaining = 0 then
    update public.study_rooms set empty_since = now(), last_activity_at = now()
    where id = p_room_id;
  end if;
  return true;
end;
$$;

revoke all on function public.kick_study_room_member_v2(uuid, uuid, text) from public, anon;
grant execute on function public.kick_study_room_member_v2(uuid, uuid, text) to authenticated;

notify pgrst, 'reload schema';
