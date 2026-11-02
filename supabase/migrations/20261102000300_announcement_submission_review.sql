-- 公告投稿审核队列：学生投稿需经管理员批准后才会进入正式公告表。
create table if not exists public.announcement_submissions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_email text not null default '',
  author_name text not null default 'Student',
  title text not null check (char_length(trim(title)) between 1 and 180),
  content text not null check (char_length(trim(content)) between 1 and 10000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  announcement_id uuid references public.announcements(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists announcement_submissions_status_created_idx
  on public.announcement_submissions(status, created_at desc);
create index if not exists announcement_submissions_author_created_idx
  on public.announcement_submissions(author_id, created_at desc);

alter table public.announcement_submissions enable row level security;

drop policy if exists "Users can submit announcement drafts" on public.announcement_submissions;
create policy "Users can submit announcement drafts"
on public.announcement_submissions for insert to authenticated
with check (
  author_id = (select auth.uid())
  and status = 'pending'
  and reviewer_id is null
  and announcement_id is null
);

drop policy if exists "Users can read own announcement submissions" on public.announcement_submissions;
create policy "Users can read own announcement submissions"
on public.announcement_submissions for select to authenticated
using (author_id = (select auth.uid()) or public.is_current_user_admin());

drop policy if exists "Admins can review announcement submissions" on public.announcement_submissions;
create policy "Admins can review announcement submissions"
on public.announcement_submissions for update to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

grant select, insert, update on public.announcement_submissions to authenticated;

-- 批准与正式公告写入放在同一事务中，避免出现已批准却没有正式公告的情况。
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
  if not public.is_current_user_admin() then
    raise exception 'Administrator access required';
  end if;

  select * into submission
  from public.announcement_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Submission not found';
  end if;
  if submission.status <> 'pending' then
    raise exception 'This submission has already been reviewed';
  end if;

  insert into public.announcements (title, content, author_name, is_published)
  values (submission.title, submission.content, 'North Synapse', true)
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
