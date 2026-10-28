-- 社区内容对访客开放只读访问；写入仍必须登录并通过原有 RLS 校验。
-- 作者公开视图只暴露展示资料，不公开邮箱等私密字段。
create or replace view public.public_author_profiles as
select id, username, nickname, grade, gender, bio, avatar_path, created_at
from public.profiles;
grant select on public.public_author_profiles to anon, authenticated;

drop policy if exists "Public can read resources" on public.resources;
create policy "Public can read resources" on public.resources for select to anon, authenticated using (true);
drop policy if exists "Public can read discussions" on public.discussions;
create policy "Public can read discussions" on public.discussions for select to anon, authenticated using (true);
drop policy if exists "Public can read resource attachments metadata" on public.resource_attachments;
create policy "Public can read resource attachments metadata" on public.resource_attachments for select to anon, authenticated using (true);
drop policy if exists "Public can read resource comments" on public.resource_comments;
create policy "Public can read resource comments" on public.resource_comments for select to anon, authenticated using (true);
drop policy if exists "Public can read discussion replies" on public.discussion_replies;
create policy "Public can read discussion replies" on public.discussion_replies for select to anon, authenticated using (true);
drop policy if exists "Public can read resource likes" on public.resource_likes;
create policy "Public can read resource likes" on public.resource_likes for select to anon, authenticated using (true);
drop policy if exists "Public can read resource bookmarks" on public.resource_bookmarks;
create policy "Public can read resource bookmarks" on public.resource_bookmarks for select to anon, authenticated using (true);
drop policy if exists "Public can read comment likes" on public.comment_likes;
create policy "Public can read comment likes" on public.comment_likes for select to anon, authenticated using (true);
drop policy if exists "Public can read discussion bookmarks" on public.discussion_bookmarks;
create policy "Public can read discussion bookmarks" on public.discussion_bookmarks for select to anon, authenticated using (true);
drop policy if exists "Public can read reply likes" on public.reply_likes;
create policy "Public can read reply likes" on public.reply_likes for select to anon, authenticated using (true);

-- 原子累加活跃学习秒数，避免多个标签页的旧值覆盖数据库里的新值。
create or replace function public.add_study_time(p_seconds integer)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare updated_total bigint;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_seconds is null or p_seconds < 0 or p_seconds > 300 then
    raise exception 'Invalid study time increment';
  end if;

  insert into public.profiles (id, email, username, nickname, total_study_seconds)
  select auth.uid(), coalesce(auth.jwt()->>'email', ''), coalesce(auth.jwt()->'user_metadata'->>'username', ''), coalesce(auth.jwt()->'user_metadata'->>'nickname', ''), p_seconds
  on conflict (id) do update
    set total_study_seconds = public.profiles.total_study_seconds + p_seconds,
        updated_at = now()
  returning total_study_seconds into updated_total;

  return updated_total;
end;
$$;
grant execute on function public.add_study_time(integer) to authenticated;
