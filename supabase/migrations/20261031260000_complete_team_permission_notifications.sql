-- 团队通知必须列出成员实际获得的全部权限，包括私人群聊和群公告。
create or replace function public.admin_manage_team_member(
  p_email text, p_action text, p_role text default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_admin_id uuid := auth.uid();
  v_target_id uuid;
  v_email text := lower(trim(coalesce(p_email,'')));
  v_old_role text;
  v_event text;
  v_title text;
  v_message text;
  v_permissions jsonb;
begin
  if v_admin_id is null or not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  if v_email = '' then raise exception 'Email address is required'; end if;
  if p_action not in ('add','update','remove') then raise exception 'Invalid action'; end if;
  if p_action in ('add','update') and p_role not in ('core_team','community_team') then raise exception 'Invalid team role'; end if;
  select u.id into v_target_id from auth.users u where lower(u.email)=v_email limit 1;
  if v_target_id is null then raise exception 'No registered account was found for this email'; end if;
  if exists(select 1 from public.admin_users a where a.user_id=v_target_id) then raise exception 'Administrator accounts cannot be changed'; end if;
  select tm.role into v_old_role from public.team_members tm where tm.user_id=v_target_id;

  if p_action='remove' then
    if v_old_role is null then raise exception 'This account is not a team member'; end if;
    v_event:='removed'; v_title:='Your team membership has changed';
    v_message:='Your North Synapse team membership has been removed. Your account remains a regular user account.';
    v_permissions:='[]'::jsonb;
    insert into public.team_notifications(user_id,event_type,previous_role,new_role,title,message,permissions)
    values(v_target_id,v_event,v_old_role,null,v_title,v_message,v_permissions);
    delete from public.team_members where user_id=v_target_id;
  else
    if v_old_role is null then v_event:='added';
    elsif v_old_role=p_role then raise exception 'This account already has that team role';
    elsif p_role='core_team' then v_event:='promoted';
    else v_event:='demoted'; end if;
    insert into public.team_members(user_id,role,added_by,updated_at)
    values(v_target_id,p_role,v_admin_id,now())
    on conflict(user_id) do update set role=excluded.role,added_by=excluded.added_by,updated_at=now();

    if p_role='core_team' then
      v_title:=case when v_event='added' then 'Welcome to the North Synapse Core Team' else 'Your team role has been updated' end;
      v_message:='You are now a Core Team member. You can view platform statistics, process reports, manage user accounts, handle user support, view administrative activity logs, and use the private Team Chat including group announcements.';
      v_permissions:='["View platform statistics","Review and process user reports","Manage user accounts","Handle user support requests","View administrative activity logs","Access the private Team Chat and send messages","Publish and manage pinned team announcements"]'::jsonb;
    else
      v_title:=case when v_event='added' then 'Welcome to the North Synapse Community Team' else 'Your team role has been updated' end;
      v_message:='You are now a Community Team member. You can view platform statistics, process reports, handle user support, and use the private Team Chat including group announcements.';
      v_permissions:='["View platform statistics","Review and process user reports","Handle user support requests","Access the private Team Chat and send messages","Publish team announcements"]'::jsonb;
    end if;
    insert into public.team_notifications(user_id,event_type,previous_role,new_role,title,message,permissions)
    values(v_target_id,v_event,v_old_role,p_role,v_title,v_message,v_permissions);
  end if;

  insert into public.admin_activity_logs(actor_id,action,target_user_id,details)
  values(v_admin_id,'team_member_'||p_action,v_target_id,jsonb_build_object('previous_role',v_old_role,'new_role',case when p_action='remove' then null else p_role end,'email',v_email));
  return jsonb_build_object('user_id',v_target_id,'email',v_email,'previous_role',v_old_role,'role',case when p_action='remove' then null else p_role end,'action',p_action);
end;
$$;
revoke all on function public.admin_manage_team_member(text,text,text) from public;
grant execute on function public.admin_manage_team_member(text,text,text) to authenticated;
notify pgrst, 'reload schema';
