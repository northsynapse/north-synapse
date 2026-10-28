-- Store actual uploaded files in Supabase Storage; database rows keep only metadata and file paths.
update storage.buckets
set public = true,
    file_size_limit = 20971520,
    allowed_mime_types = array[
      'application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif',
      'text/plain', 'text/csv', 'application/zip', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
where id = 'resource-attachments';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', true, 5242880,
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

drop policy if exists "Public can read shared resource files" on storage.objects;
create policy "Public can read shared resource files" on storage.objects
for select to anon, authenticated using (bucket_id = 'resource-attachments');

drop policy if exists "Users can upload own resource attachment files" on storage.objects;
create policy "Users can upload own resource attachment files" on storage.objects
for insert to authenticated with check (
  bucket_id = 'resource-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists "Users can update own resource attachment files" on storage.objects;
create policy "Users can update own resource attachment files" on storage.objects
for update to authenticated using (
  bucket_id = 'resource-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
) with check (
  bucket_id = 'resource-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists "Users can delete own resource attachment files" on storage.objects;
create policy "Users can delete own resource attachment files" on storage.objects
for delete to authenticated using (
  bucket_id = 'resource-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Public can read profile avatars" on storage.objects;
create policy "Public can read profile avatars" on storage.objects
for select to anon, authenticated using (bucket_id = 'profile-avatars');
drop policy if exists "Users can upload own profile avatars" on storage.objects;
create policy "Users can upload own profile avatars" on storage.objects
for insert to authenticated with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists "Users can update own profile avatars" on storage.objects;
create policy "Users can update own profile avatars" on storage.objects
for update to authenticated using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
) with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists "Users can delete own profile avatars" on storage.objects;
create policy "Users can delete own profile avatars" on storage.objects
for delete to authenticated using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
