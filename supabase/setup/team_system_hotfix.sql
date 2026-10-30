-- North Synapse team system hotfix
-- 中文注释：修复团队目录 RPC 返回类型，并收紧群聊消息和公告的数据库权限。
begin;
create or replace function public.team_user_directory(p_search text default '')
returns table(user_id uuid, email text, username text, nickname text, created_at timestamptz, team_role text)
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.has_team_permission('users') then raise exception 'User management permission required'; end if;
  return query
    select u.id, u.email::text,
      coalesce(p.username::text, split_part(coalesce(u.email::text, ''), '@', 1))::text,
      coalesce(p.nickname::text, p.username::text, split_part(coalesce(u.email::text, ''), '@', 1))::text,
      u.created_at,
      case when a.user_id is not null then 'administrator'::text else tm.role::text end
    from auth.users u
    left join public.profiles p on p.id=u.id
    left join public.team_members tm on tm.user_id=u.id
    left join public.admin_users a on a.user_id=u.id
    where coalesce(u.email::text,'') ilike '%'||trim(coalesce(p_search,''))||'%'
       or coalesce(p.username::text,'') ilike '%'||trim(coalesce(p_search,''))||'%'
       or coalesce(p.nickname::text,'') ilike '%'||trim(coalesce(p_search,''))||'%'
    order by u.created_at desc limit 100;
end;
$$;
revoke all on function public.team_user_directory(text) from public;
grant execute on function public.team_user_directory(text) to authenticated;

drop policy if exists "Authors and core team can update chat messages" on public.team_chat_messages;
drop policy if exists "Authors and core team can delete chat messages" on public.team_chat_messages;
create policy "Owners within five minutes and admins can update chat messages"
on public.team_chat_messages for update to authenticated
using (public.is_current_user_admin() or (user_id=auth.uid() and created_at >= now()-interval '5 minutes'))
with check (public.is_current_user_admin() or user_id=auth.uid());
create policy "Owners within five minutes and admins can delete chat messages"
on public.team_chat_messages for delete to authenticated
using (public.is_current_user_admin() or (user_id=auth.uid() and created_at >= now()-interval '5 minutes'));

drop policy if exists "Team can publish announcements" on public.team_chat_announcements;
drop policy if exists "Team can manage announcements" on public.team_chat_announcements;
drop policy if exists "Core team can delete announcements" on public.team_chat_announcements;
create policy "Administrators can publish announcements" on public.team_chat_announcements for insert to authenticated
with check (author_id=auth.uid() and public.is_current_user_admin());
create policy "Administrators can manage announcements" on public.team_chat_announcements for update to authenticated
using (public.is_current_user_admin()) with check (public.is_current_user_admin());
create policy "Administrators can delete announcements" on public.team_chat_announcements for delete to authenticated
using (public.is_current_user_admin());
notify pgrst, 'reload schema';
commit;