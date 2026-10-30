-- 管理员账号也出现在团队目录中，但不允许通过普通团队管理操作修改。
create or replace function public.team_user_directory(p_search text default '')
returns table(user_id uuid, email text, username text, nickname text, created_at timestamptz, team_role text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_team_permission('users') then raise exception 'User management permission required'; end if;
  return query
    select u.id, u.email,
      coalesce(p.username, split_part(coalesce(u.email,''),'@',1)),
      coalesce(p.nickname, p.username, split_part(coalesce(u.email,''),'@',1)),
      u.created_at,
      case when a.user_id is not null then 'administrator' else tm.role end
    from auth.users u
    left join public.profiles p on p.id=u.id
    left join public.team_members tm on tm.user_id=u.id
    left join public.admin_users a on a.user_id=u.id
    where (coalesce(u.email,'') ilike '%' || trim(coalesce(p_search,'')) || '%'
       or coalesce(p.username,'') ilike '%' || trim(coalesce(p_search,'')) || '%'
       or coalesce(p.nickname,'') ilike '%' || trim(coalesce(p_search,'')) || '%')
      and (a.user_id is not null or tm.user_id is not null)
    order by case when a.user_id is not null then 0 else 1 end, u.created_at desc
    limit 100;
end;
$$;
revoke all on function public.team_user_directory(text) from public;
grant execute on function public.team_user_directory(text) to authenticated;
notify pgrst, 'reload schema';
