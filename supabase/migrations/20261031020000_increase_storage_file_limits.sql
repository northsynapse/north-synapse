-- Raise per-file limits for uploaded attachments and profile avatars to 20 MB.
-- The application also validates these limits before uploading.
update storage.buckets
set file_size_limit = 20 * 1024 * 1024
where id in ('resource-attachments', 'profile-avatars');
