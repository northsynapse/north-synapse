-- 兼容旧版公告表：旧表的 body 为 NOT NULL，新版使用 content。
-- 两个发布入口同时写入 body/content，确保公告可被新旧页面读取。

alter table public.announcements
  add column if not exists is_published boolean not null default true,
  add column if not exists content text not null default '',
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists author_name text default 'North Synapse';

update public.announcements
set content = coalesce(nullif(content, ''), body, ''),
    body = coalesce(nullif(body, ''), content, ''),
    author_name = coalesce(nullif(author_name, ''), 'North Synapse'),
    attachments = coalesce(attachments, '[]'::jsonb),
    is_published = coalesce(is_published, true);

alter table public.announcements
  alter column content set default '',
  alter column content set not null,
  alter column author_name set default 'North Synapse',
  alter column is_published set default true;

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
    title, body, content, author_name, is_published, attachments
  )
  values (
    submission.title,
    submission.content,
    submission.content,
    'North Synapse',
    true,
    coalesce(submission.attachments, '[]'::jsonb)
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
    title, body, content, author_name, is_published, attachments
  )
  values (
    trim(p_title),
    trim(p_content),
    trim(p_content),
    'North Synapse',
    true,
    coalesce(p_attachments, '[]'::jsonb)
  )
  returning id into published_id;

  return published_id;
end;
$$;

revoke all on function public.approve_announcement_submission(uuid) from public;
grant execute on function public.approve_announcement_submission(uuid) to authenticated;
revoke all on function public.publish_announcement(text, text, jsonb) from public;
grant execute on function public.publish_announcement(text, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
