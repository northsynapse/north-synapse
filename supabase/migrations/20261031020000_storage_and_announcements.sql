-- Persist official announcements and ensure uploaded files have durable Storage buckets.
-- Resource attachments and profile avatars are stored in Supabase Storage; this migration
-- makes sure the required buckets and access policies exist.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'resource-attachments',
    'resource-attachments',
    true,
    20971520,
    array[
      'image/*', 'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  ),
  (
    'profile-avatars',
    'profile-avatars',
    true,
    5242880,
    array['image/*']
  )
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Public files can be viewed, while signed-in users can manage files in their own folder.
drop policy if exists "Public can view resource attachments" on storage.objects;
create policy "Public can view resource attachments"
on storage.objects for select to anon, authenticated
using (bucket_id in ('resource-attachments', 'profile-avatars'));

drop policy if exists "Users upload own resource attachments" on storage.objects;
create policy "Users upload own resource attachments"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('resource-attachments', 'profile-avatars')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users update own uploaded files" on storage.objects;
create policy "Users update own uploaded files"
on storage.objects for update to authenticated
using (
  bucket_id in ('resource-attachments', 'profile-avatars')
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id in ('resource-attachments', 'profile-avatars')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users delete own uploaded files" on storage.objects;
create policy "Users delete own uploaded files"
on storage.objects for delete to authenticated
using (
  bucket_id in ('resource-attachments', 'profile-avatars')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  author_name text not null default 'North Synapse Official',
  created_at timestamptz not null default now(),
  is_published boolean not null default true
);

alter table public.announcements enable row level security;

drop policy if exists "Anyone can read published announcements" on public.announcements;
create policy "Anyone can read published announcements"
on public.announcements for select to anon, authenticated
using (is_published = true);

drop policy if exists "Admins can manage announcements" on public.announcements;
create policy "Admins can manage announcements"
on public.announcements for all to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;

insert into public.announcements (title, content, author_name, created_at, is_published)
select seed.title, seed.content, 'North Synapse Official', seed.created_at::timestamptz, true
from (values
  (
    'Welcome to North Synapse Academic Platform',
    'A centralized workspace for verified course resources, virtual study rooms, and academic peer discussions.',
    '2026-10-24T12:00:00Z'
  ),
  (
    'AP & Competition Prep Resource Categories Added',
    'We updated our Resource Hub filter tags with AP Courses, Academic Competitions, French, and Geography!',
    '2026-10-24T12:05:00Z'
  )
) as seed(title, content, created_at)
where not exists (
  select 1 from public.announcements existing where existing.title = seed.title
);
