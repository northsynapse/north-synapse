-- North Synapse persistent file storage.
-- Structured records remain in Postgres; binary uploads live in Supabase Storage.
-- Both buckets are public because published notes and profile avatars are currently public.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-avatars', 'profile-avatars', true, 5242880, array['image/*']::text[]),
  ('resource-attachments', 'resource-attachments', true, 52428800, null)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Public read is required for public profile avatars and published resource attachments.
drop policy if exists "Public can read North Synapse files" on storage.objects;
create policy "Public can read North Synapse files"
on storage.objects for select
to anon, authenticated
using (bucket_id in ('profile-avatars', 'resource-attachments'));

-- Each signed-in user may upload only into a folder named with their own auth UID.
drop policy if exists "Users can upload their own North Synapse files" on storage.objects;
create policy "Users can upload their own North Synapse files"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('profile-avatars', 'resource-attachments')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can update their own North Synapse files" on storage.objects;
create policy "Users can update their own North Synapse files"
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

drop policy if exists "Users can delete their own North Synapse files" on storage.objects;
create policy "Users can delete their own North Synapse files"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('profile-avatars', 'resource-attachments')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
