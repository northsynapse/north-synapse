-- Persistent file storage for Research Hub.
-- Database rows store metadata; binary uploads live in Supabase Storage.
-- Public community files are readable by visitors. Only the owning signed-in user
-- can upload, replace, or delete files in their own user-id folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'profile-avatars',
    'profile-avatars',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']::text[]
  ),
  (
    'resource-attachments',
    'resource-attachments',
    true,
    20971520,
    array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/uri-list', 'application/octet-stream'
    ]::text[]
  )
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Research Hub files are publicly readable" on storage.objects;
create policy "Research Hub files are publicly readable"
on storage.objects for select
to anon, authenticated
using (bucket_id in ('profile-avatars', 'resource-attachments'));

drop policy if exists "Users upload their own Research Hub files" on storage.objects;
create policy "Users upload their own Research Hub files"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('profile-avatars', 'resource-attachments')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users update their own Research Hub files" on storage.objects;
create policy "Users update their own Research Hub files"
on storage.objects for update
to authenticated
using (
  bucket_id in ('profile-avatars', 'resource-attachments')
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id in ('profile-avatars', 'resource-attachments')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users delete their own Research Hub files" on storage.objects;
create policy "Users delete their own Research Hub files"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('profile-avatars', 'resource-attachments')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
