-- 公告标题格式持久化，并确保直接发布与审核通过使用相同字段。
-- 依赖前序公告兼容迁移已创建 body/content、attachments、is_published 等字段。

alter table public.announcements
  add column if not exists title_style jsonb not null default '{}'::jsonb;

alter table public.announcement_submissions
  add column if not exists title_style jsonb not null default '{}'::jsonb;

create or replace function public.publish_announcement(
  p_title text,
  p_content text,
  p_attachments jsonb default '[]'::jsonb,
  p_title_style jsonb default '{}'::jsonb
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

  insert into public.announcements (
    title, body, content, author_name, is_published, attachments, title_style
  )
  values (
    trim(p_title), trim(p_content), trim(p_content), 'North Synapse', true,
    coalesce(p_attachments, '[]'::jsonb),
    coalesce(p_title_style, '{}'::jsonb)
  )
  returning id into published_id;

  return published_id;
end;
$$;

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

  if not found then
    raise exception 'Announcement submission not found';
  end if;
  if submission.status <> 'pending' then
    raise exception 'This submission has already been reviewed';
  end if;

  insert into public.announcements (
    title, body, content, author_name, is_published, attachments, title_style
  )
  values (
    submission.title, submission.content, submission.content, 'North Synapse', true,
    coalesce(submission.attachments, '[]'::jsonb),
    coalesce(submission.title_style, '{}'::jsonb)
  )
  returning id into published_id;

  update public.announcement_submissions
  set status = 'approved',
      reviewer_id = auth.uid(),
      reviewed_at = now(),
      announcement_id = published_id
  where id = p_submission_id;

  return published_id;
end;
$$;

revoke all on function public.publish_announcement(text, text, jsonb, jsonb) from public;
grant execute on function public.publish_announcement(text, text, jsonb, jsonb) to authenticated;
revoke all on function public.approve_announcement_submission(uuid) from public;
grant execute on function public.approve_announcement_submission(uuid) to authenticated;

notify pgrst, 'reload schema';
