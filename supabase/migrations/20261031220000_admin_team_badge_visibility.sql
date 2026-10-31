-- 管理员同样拥有默认公开的团队标识，并可自行隐藏。
alter table public.admin_users add column if not exists badge_visible boolean not null default true;

create or replace function public.public_team_badge(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists(select 1 from public.admin_users a where a.user_id=p_user_id and a.badge_visible) then 'administrator'
    when exists(select 1 from public.team_members tm where tm.user_id=p_user_id and tm.badge_visible and tm.role='core_team') then 'core_team'
    when exists(select 1 from public.team_members tm where tm.user_id=p_user_id and tm.badge_visible and tm.role='community_team') then 'community_team'
    else null
  end;
$$;

create or replace function public.set_own_team_badge_visibility(p_visible boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.team_members set badge_visible=p_visible, updated_at=now() where user_id=auth.uid();
  if found then return true; end if;
  update public.admin_users set badge_visible=p_visible where user_id=auth.uid();
  return found;
end;
$$;
revoke all on function public.public_team_badge(uuid) from public;
grant execute on function public.public_team_badge(uuid) to authenticated;
revoke all on function public.set_own_team_badge_visibility(boolean) from public;
grant execute on function public.set_own_team_badge_visibility(boolean) to authenticated;
notify pgrst, 'reload schema';
