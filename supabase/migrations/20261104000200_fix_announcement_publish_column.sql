-- 兼容更早版本的 announcements 表：补齐正式公告发布状态字段。
-- 旧表中已有的公告默认视为已发布，避免迁移后现有公告从主页消失。
alter table public.announcements
  add column if not exists is_published boolean not null default true;

-- 确保审批函数与当前公告表结构一致，并保留投稿附件。
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
    title, content, author_name, is_published, attachments
  )
  values (
    submission.title,
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

revoke all on function public.approve_announcement_submission(uuid) from public;
grant execute on function public.approve_announcement_submission(uuid) to authenticated;

notify pgrst, 'reload schema';
