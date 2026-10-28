-- 持久化文件统一使用 Supabase Storage；结构化内容和文件元数据仍保存在 Postgres 数据表中。
-- 公开笔记附件与头像使用公开读取，写入、修改和删除仅允许登录用户操作自己目录下的文件。

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('resource-attachments', 'resource-attachments', true, 20971520,
   array['image/*', 'application/pdf', 'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-powerpoint',
         'application/vnd.openxmlformats-officedocument.presentationml.presentation',
         'text/plain', 'application/zip'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-avatars', 'profile-avatars', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "North Synapse public read resource attachments" on storage.objects;
create policy "North Synapse public read resource attachments"
on storage.objects for select to anon, authenticated
using (bucket_id = 'resource-attachments');

drop policy if exists "North Synapse users upload own resource attachments" on storage.objects;
create policy "North Synapse users upload own resource attachments"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'resource-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "North Synapse users update own resource attachments" on storage.objects;
create policy "North Synapse users update own resource attachments"
on storage.objects for update to authenticated
using (
  bucket_id = 'resource-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'resource-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "North Synapse users delete own resource attachments" on storage.objects;
create policy "North Synapse users delete own resource attachments"
on storage.objects for delete to authenticated
using (
  bucket_id = 'resource-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "North Synapse public read profile avatars" on storage.objects;
create policy "North Synapse public read profile avatars"
on storage.objects for select to anon, authenticated
using (bucket_id = 'profile-avatars');

drop policy if exists "North Synapse users upload own profile avatars" on storage.objects;
create policy "North Synapse users upload own profile avatars"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "North Synapse users update own profile avatars" on storage.objects;
create policy "North Synapse users update own profile avatars"
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "North Synapse users delete own profile avatars" on storage.objects;
create policy "North Synapse users delete own profile avatars"
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
