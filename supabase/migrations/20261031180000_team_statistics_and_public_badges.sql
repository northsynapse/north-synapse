-- 团队统计权限与公开团队徽章查询
create or replace function public.admin_dashboard_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if not public.has_team_permission('statistics') then
    raise exception 'Platform statistics permission required';
  end if;
  select jsonb_build_object(
    'registered_users', (select count(*) from auth.users),
    'online_users', (select count(*) from public.user_presence where last_seen_at > now() - interval '2 minutes'),
    'average_rating', (select coalesce(round(avg(rating)::numeric,2),0) from public.site_ratings),
    'rating_count', (select count(*) from public.site_ratings),
    'pending_feedback', (select count(*) from public.site_feedback where status='Pending'),
    'total_feedback', (select count(*) from public.site_feedback),
    'pending_reports', (select count(*) from public.content_reports where status='Pending'),
    'open_support_tickets', (select count(*) from public.support_tickets where status in ('Open','In Progress'))
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_dashboard_metrics() from public;
grant execute on function public.admin_dashboard_metrics() to authenticated;

create or replace function public.public_team_badge(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case when tm.badge_visible then tm.role else null end
  from public.team_members tm
  where tm.user_id = p_user_id
  limit 1;
$$;
revoke all on function public.public_team_badge(uuid) from public;
grant execute on function public.public_team_badge(uuid) to authenticated;

notify pgrst, 'reload schema';
