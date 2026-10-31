-- 为群聊身份标签提供仅返回布尔值的管理员身份查询。
create or replace function public.is_platform_admin(p_user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.admin_users a where a.user_id = p_user_id); $$;
revoke all on function public.is_platform_admin(uuid) from public;
grant execute on function public.is_platform_admin(uuid) to authenticated;

-- 团队成员角色变更通过 Realtime 同步到在线用户。
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='team_members') then
    alter publication supabase_realtime add table public.team_members;
  end if;
end $$;
notify pgrst, 'reload schema';
