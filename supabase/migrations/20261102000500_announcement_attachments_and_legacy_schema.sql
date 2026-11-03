-- 兼容旧版 announcements 表，并为公告和投稿增加附件支持。
alter table public.announcements
  add column if not exists content text,
  add column if not exists attachments jsonb not null default '[]'::jsonb;

-- 旧表可能使用 body/message/description 存正文；先迁移可识别的旧字段。
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='announcements' and column_name='body') then
    execute 'update public.announcements set content = coalesce(nullif(content, ''''), body) where content is null or content = ''''';
  elsif exists (select 1 from information_schema.columns where table_schema='public' and table_name='announcements' and column_name='message') then
    execute 'update public.announcements set content = coalesce(nullif(content, ''''), message) where content is null or content = ''''';
  elsif exists (select 1 from information_schema.columns where table_schema='public' and table_name='announcements' and column_name='description') then
    execute 'update public.announcements set content = coalesce(nullif(content, ''''), description) where content is null or content = ''''';
  end if;
end $$;

update public.announcements set content = '' where content is null;
alter table public.announcements alter column content set default '';
alter table public.announcements alter column content set not null;

alter table public.announcement_submissions
  add column if not exists attachments jsonb not null default '[]'::jsonb;

-- 重建审核函数：批准时同时复制附件元数据。
create or replace function public.approve_announcement_submission(p_submission_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  submission public.announcement_submissions%rowtype;
  published_id uuid;
begin
  if auth.uid() is null or not public.is_current_user_admin() then
    raise exception 'Administrator access required';
  end if;

  select * into submission
  from public.announcement_submissions
  where id = p_submission_id
  for update;

  if not found then raise exception 'Announcement submission not found'; end if;
  if submission.status <> 'pending' then raise exception 'This submission has already been reviewed'; end if;

  insert into public.announcements (title, content, author_name, is_published, attachments)
  values (submission.title, submission.content, 'North Synapse', true, coalesce(submission.attachments, '[]'::jsonb))
  returning id into published_id;

  update public.announcement_submissions
  set status='approved', reviewer_id=auth.uid(), reviewed_at=now(), announcement_id=published_id
  where id=p_submission_id;

  return published_id;
end;
$$;

-- 管理员直接发布时也可一次性保存附件元数据。
drop function if exists public.publish_announcement(text, text);
create or replace function public.publish_announcement(
  p_title text,
  p_content text,
  p_attachments jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare published_id uuid;
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

  insert into public.announcements (title, content, author_name, is_published, attachments)
  values (trim(p_title), trim(p_content), 'North Synapse', true, coalesce(p_attachments, '[]'::jsonb))
  returning id into published_id;
  return published_id;
end;
$$;

revoke all on function public.approve_announcement_submission(uuid) from public;
grant execute on function public.approve_announcement_submission(uuid) to authenticated;
revoke all on function public.publish_announcement(text, text, jsonb) from public;
grant execute on function public.publish_announcement(text, text, jsonb) to authenticated;


-- 刷新 PostgREST schema cache，让前端立即识别新函数签名。
notify pgrst, 'reload schema';
