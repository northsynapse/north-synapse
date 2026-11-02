-- 管理员直接发布公告使用受保护的 RPC，避免客户端直接写表时遇到 RLS/权限差异。
create or replace function public.publish_announcement(
  p_title text,
  p_content text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  published_id uuid;
begin
  if auth.uid() is null or not public.is_current_user_admin() then
    raise exception 'Administrator access required';
  end if;

  if p_title is null or char_length(trim(p_title)) not between 1 and 180 then
    raise exception 'Announcement title must be between 1 and 180 characters';
  end if;

  if p_content is null or char_length(trim(p_content)) not between 1 and 10000 then
    raise exception 'Announcement content must be between 1 and 10000 characters';
  end if;

  insert into public.announcements (title, content, author_name, is_published)
  values (trim(p_title), trim(p_content), 'North Synapse', true)
  returning id into published_id;

  return published_id;
end;
$$;

revoke all on function public.publish_announcement(text, text) from public;
grant execute on function public.publish_announcement(text, text) to authenticated;
