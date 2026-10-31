-- 中文注释：为团队聊天创建私有附件存储，并限制仅团队成员访问。
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'team-chat-attachments',
  'team-chat-attachments',
  false,
  15728640,
  array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/zip'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Team members can upload team chat attachments" on storage.objects;
create policy "Team members can upload team chat attachments"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'team-chat-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (
    exists (select 1 from public.team_members tm where tm.user_id = auth.uid())
    or coalesce(public.is_platform_admin(auth.uid()), false)
  )
);

drop policy if exists "Team members can read team chat attachments" on storage.objects;
create policy "Team members can read team chat attachments"
on storage.objects for select to authenticated
using (
  bucket_id = 'team-chat-attachments'
  and (
    exists (select 1 from public.team_members tm where tm.user_id = auth.uid())
    or coalesce(public.is_platform_admin(auth.uid()), false)
  )
);

drop policy if exists "Owners and admins can delete team chat attachments" on storage.objects;
create policy "Owners and admins can delete team chat attachments"
on storage.objects for delete to authenticated
using (
  bucket_id = 'team-chat-attachments'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or coalesce(public.is_platform_admin(auth.uid()), false)
  )
);
