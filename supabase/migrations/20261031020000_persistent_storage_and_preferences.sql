-- 持久化基础：用户上传的文件保存在 Supabase Storage，结构化资料保存在 Postgres。
-- 创建 bucket 时使用 upsert，重复执行不会覆盖已有文件。
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-avatars', 'profile-avatars', true, 5242880, array['image/*']),
  ('resource-attachments', 'resource-attachments', true, 20971520, null)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

-- 用户只能上传/修改/删除自己目录下的文件；公开 bucket 允许网站展示已发布的头像和附件。
drop policy if exists "Public can view North Synapse files" on storage.objects;
create policy "Public can view North Synapse files"
on storage.objects for select to anon, authenticated
using (bucket_id in ('profile-avatars', 'resource-attachments'));

drop policy if exists "Users can upload own North Synapse files" on storage.objects;
create policy "Users can upload own North Synapse files"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('profile-avatars', 'resource-attachments')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can update own North Synapse files" on storage.objects;
create policy "Users can update own North Synapse files"
on storage.objects for update to authenticated
using (
  bucket_id in ('profile-avatars', 'resource-attachments')
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id in ('profile-avatars', 'resource-attachments')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete own North Synapse files" on storage.objects;
create policy "Users can delete own North Synapse files"
on storage.objects for delete to authenticated
using (
  bucket_id in ('profile-avatars', 'resource-attachments')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- 用户界面偏好设置：可逐步扩展，不把可恢复的偏好只留在浏览器内存中。
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "Users can read own preferences" on public.user_preferences;
create policy "Users can read own preferences"
on public.user_preferences for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can insert own preferences" on public.user_preferences;
create policy "Users can insert own preferences"
on public.user_preferences for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Users can update own preferences" on public.user_preferences;
create policy "Users can update own preferences"
on public.user_preferences for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

grant select, insert, update on public.user_preferences to authenticated;
