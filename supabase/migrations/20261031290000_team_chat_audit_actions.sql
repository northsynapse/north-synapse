-- 将团队聊天中的管理性操作也纳入审计日志。
create or replace function public.record_team_activity(
  p_action text,
  p_target_user_id uuid,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_action like 'report_%' then
    if not public.has_team_permission('moderation') then raise exception 'Moderation permission required'; end if;
  elsif p_action like 'support_%' then
    if not public.has_team_permission('support') then raise exception 'Support permission required'; end if;
  elsif p_action like 'chat_%' then
    if not public.has_team_permission('team_chat') then raise exception 'Team chat permission required'; end if;
  else
    raise exception 'Unsupported activity type';
  end if;
  insert into public.admin_activity_logs(actor_id,action,target_user_id,details)
  values(auth.uid(),p_action,p_target_user_id,coalesce(p_details,'{}'::jsonb));
end;
$$;
revoke all on function public.record_team_activity(text,uuid,jsonb) from public;
grant execute on function public.record_team_activity(text,uuid,jsonb) to authenticated;
notify pgrst, 'reload schema';
