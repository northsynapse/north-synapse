create or replace function public.current_team_badge_visible()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select tm.badge_visible from public.team_members tm where tm.user_id=auth.uid()),
    (select a.badge_visible from public.admin_users a where a.user_id=auth.uid()),
    true
  );
$$;
revoke all on function public.current_team_badge_visible() from public;
grant execute on function public.current_team_badge_visible() to authenticated;
notify pgrst, 'reload schema';
