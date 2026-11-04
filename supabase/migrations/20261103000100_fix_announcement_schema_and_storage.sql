-- 修复公告表兼容性，并确保公告附件使用的 Storage bucket 与权限存在。

-- 旧版 announcements 表缺少 author_name，导致管理员发布、审批和前端读取公告失败。
alter table public.announcements
  add column if not exists author_name text;

update public.announcements
set author_name = 'North Synapse'
where author_name is null or btrim(author_name) = '';

alter table public.announcements
  alter column author_name set default 'North Synapse';

-- 公告附件和资源附件共用此 bucket；公开读取用于生成可直接访问的附件链接。
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resource-attachments',
  'resource-attachments',
  true,
  20971520,
  array[
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/octet-stream'
  ]
)
on conflict (id) do update
set public = true,
    file_size_limit = 20971520,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read resource attachments" on storage.objects;
create policy "Public can read resource attachments"
on storage.objects for select
using (bucket_id = 'resource-attachments');

drop policy if exists "Authenticated users can upload own resource attachments" on storage.objects;
create policy "Authenticated users can upload own resource attachments"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'resource-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete own resource attachments" on storage.objects;
create policy "Users can delete own resource attachments"
on storage.objects for delete to authenticated
using (
  bucket_id = 'resource-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

notify pgrst, 'reload schema';
