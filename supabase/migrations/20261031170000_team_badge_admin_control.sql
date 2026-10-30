-- 管理员可以为团队成员调整公开标识；此设置不改变成员权限。
create or replace function public.admin_set_team_badge_visibility(p_user_id uuid, p_visible boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Administrator access required';
  end if;
  update public.team_members
  set badge_visible = p_visible, updated_at = now()
  where user_id = p_user_id;
  if not found then raise exception 'Team member not found'; end if;
  insert into public.admin_activity_logs(actor_id, action, target_user_id, details)
  values(auth.uid(), 'team_badge_visibility_changed', p_user_id, jsonb_build_object('visible', p_visible));
  return true;
end;
$$;
revoke all on function public.admin_set_team_badge_visibility(uuid,boolean) from public;
grant execute on function public.admin_set_team_badge_visibility(uuid,boolean) to authenticated;
notify pgrst, 'reload schema';
