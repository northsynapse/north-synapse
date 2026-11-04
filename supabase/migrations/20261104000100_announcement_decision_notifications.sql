-- 公告审核结果通知：保存管理员拒绝原因，并在投稿者下次登录时弹出一次性通知。

-- 同步修复旧版正式公告表缺少 author_name 的问题，避免审批 RPC 再次因该字段失败。
alter table public.announcements
  add column if not exists author_name text;

update public.announcements
set author_name = 'North Synapse'
where author_name is null or btrim(author_name) = '';

alter table public.announcements
  alter column author_name set default 'North Synapse';

alter table public.announcement_submissions
  add column if not exists decision_reason text,
  add column if not exists notification_seen_at timestamptz;

-- 由登录用户调用：仅读取并标记当前用户尚未查看的审核结果。
create or replace function public.consume_announcement_decision_notifications()
returns table (
  submission_id uuid,
  title text,
  status text,
  decision_reason text,
  reviewed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
  update public.announcement_submissions as submission
  set notification_seen_at = now()
  where submission.author_id = auth.uid()
    and submission.status in ('approved', 'rejected')
    and submission.notification_seen_at is null
  returning
    submission.id,
    submission.title,
    submission.status,
    submission.decision_reason,
    submission.reviewed_at;
end;
$$;

revoke all on function public.consume_announcement_decision_notifications() from public;
grant execute on function public.consume_announcement_decision_notifications() to authenticated;

notify pgrst, 'reload schema';
