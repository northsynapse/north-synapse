-- North Synapse 初始持久化结构
-- 在 Supabase Dashboard → SQL Editor 中执行一次。
-- 本文件不包含任何 service_role 密钥；所有访问都受 RLS 保护。

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text not null default '',
  nickname text not null default '',
  grade text not null default '',
  gender text not null default 'Prefer not to say',
  bio text not null default '',
  avatar_path text,
  total_study_seconds bigint not null default 0 check (total_study_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  subject text not null default '',
  grade text not null default '',
  description text not null default '',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resource_attachments (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  content_type text not null default 'application/octet-stream',
  storage_path text,
  external_url text,
  created_at timestamptz not null default now(),
  constraint resource_attachment_location check (
    (storage_path is not null and external_url is null)
    or (storage_path is null and external_url is not null)
  )
);

create table if not exists public.resource_comments (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.discussions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  content text not null check (char_length(trim(content)) between 1 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discussion_replies (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.resource_likes (
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (resource_id, user_id)
);

create table if not exists public.resource_bookmarks (
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (resource_id, user_id)
);

create table if not exists public.comment_likes (
  comment_id uuid not null references public.resource_comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create table if not exists public.discussion_bookmarks (
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (discussion_id, user_id)
);

create table if not exists public.reply_likes (
  reply_id uuid not null references public.discussion_replies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reply_id, user_id)
);

create index if not exists resources_created_at_idx on public.resources (created_at desc);
create index if not exists resources_author_id_idx on public.resources (author_id);
create index if not exists resource_comments_resource_id_idx on public.resource_comments (resource_id, created_at);
create index if not exists discussions_created_at_idx on public.discussions (created_at desc);
create index if not exists discussions_author_id_idx on public.discussions (author_id);
create index if not exists discussion_replies_discussion_id_idx on public.discussion_replies (discussion_id, created_at);

-- 新用户注册后自动创建 profile；不会存储密码或其他认证凭据。
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, username, nickname)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(nullif(new.raw_user_meta_data ->> 'nickname', ''), nullif(new.raw_user_meta_data ->> 'username', ''), split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at before update on public.resources
for each row execute procedure public.set_updated_at();

drop trigger if exists discussions_set_updated_at on public.discussions;
create trigger discussions_set_updated_at before update on public.discussions
for each row execute procedure public.set_updated_at();

-- RLS：内容可由已登录学生阅读；只有作者可以创建、修改和删除自己的内容。
alter table public.profiles enable row level security;
alter table public.resources enable row level security;
alter table public.resource_attachments enable row level security;
alter table public.resource_comments enable row level security;
alter table public.discussions enable row level security;
alter table public.discussion_replies enable row level security;
alter table public.resource_likes enable row level security;
alter table public.resource_bookmarks enable row level security;
alter table public.comment_likes enable row level security;
alter table public.discussion_bookmarks enable row level security;
alter table public.reply_likes enable row level security;

drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles" on public.profiles
for select to authenticated using (true);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "Authenticated users can read resources" on public.resources;
create policy "Authenticated users can read resources" on public.resources
for select to authenticated using (true);
drop policy if exists "Users can create own resources" on public.resources;
create policy "Users can create own resources" on public.resources
for insert to authenticated with check (author_id = (select auth.uid()));
drop policy if exists "Authors can update own resources" on public.resources;
create policy "Authors can update own resources" on public.resources
for update to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
drop policy if exists "Authors can delete own resources" on public.resources;
create policy "Authors can delete own resources" on public.resources
for delete to authenticated using (author_id = (select auth.uid()));

drop policy if exists "Authenticated users can read attachments" on public.resource_attachments;
create policy "Authenticated users can read attachments" on public.resource_attachments
for select to authenticated using (true);
drop policy if exists "Users can attach to own resources" on public.resource_attachments;
create policy "Users can attach to own resources" on public.resource_attachments
for insert to authenticated with check (
  author_id = (select auth.uid()) and exists (
    select 1 from public.resources r where r.id = resource_id and r.author_id = (select auth.uid())
  )
);
drop policy if exists "Authors can delete own attachments" on public.resource_attachments;
create policy "Authors can delete own attachments" on public.resource_attachments
for delete to authenticated using (author_id = (select auth.uid()));

drop policy if exists "Authenticated users can read resource comments" on public.resource_comments;
create policy "Authenticated users can read resource comments" on public.resource_comments
for select to authenticated using (true);
drop policy if exists "Users can create own comments" on public.resource_comments;
create policy "Users can create own comments" on public.resource_comments
for insert to authenticated with check (author_id = (select auth.uid()));
drop policy if exists "Authors can delete own comments" on public.resource_comments;
create policy "Authors can delete own comments" on public.resource_comments
for delete to authenticated using (author_id = (select auth.uid()));

drop policy if exists "Authenticated users can read discussions" on public.discussions;
create policy "Authenticated users can read discussions" on public.discussions
for select to authenticated using (true);
drop policy if exists "Users can create own discussions" on public.discussions;
create policy "Users can create own discussions" on public.discussions
for insert to authenticated with check (author_id = (select auth.uid()));
drop policy if exists "Authors can update own discussions" on public.discussions;
create policy "Authors can update own discussions" on public.discussions
for update to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
drop policy if exists "Authors can delete own discussions" on public.discussions;
create policy "Authors can delete own discussions" on public.discussions
for delete to authenticated using (author_id = (select auth.uid()));

drop policy if exists "Authenticated users can read discussion replies" on public.discussion_replies;
create policy "Authenticated users can read discussion replies" on public.discussion_replies
for select to authenticated using (true);
drop policy if exists "Users can create own replies" on public.discussion_replies;
create policy "Users can create own replies" on public.discussion_replies
for insert to authenticated with check (author_id = (select auth.uid()));
drop policy if exists "Authors can delete own replies" on public.discussion_replies;
create policy "Authors can delete own replies" on public.discussion_replies
for delete to authenticated using (author_id = (select auth.uid()));

-- 点赞与收藏的 user_id 必须是当前登录用户，复合主键防止重复计数。
drop policy if exists "Authenticated users can read resource likes" on public.resource_likes;
create policy "Authenticated users can read resource likes" on public.resource_likes
for select to authenticated using (true);
drop policy if exists "Users manage own resource likes" on public.resource_likes;
create policy "Users manage own resource likes" on public.resource_likes
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Authenticated users can read resource bookmarks" on public.resource_bookmarks;
create policy "Authenticated users can read resource bookmarks" on public.resource_bookmarks
for select to authenticated using (true);
drop policy if exists "Users manage own resource bookmarks" on public.resource_bookmarks;
create policy "Users manage own resource bookmarks" on public.resource_bookmarks
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Authenticated users can read comment likes" on public.comment_likes;
create policy "Authenticated users can read comment likes" on public.comment_likes
for select to authenticated using (true);
drop policy if exists "Users manage own comment likes" on public.comment_likes;
create policy "Users manage own comment likes" on public.comment_likes
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Authenticated users can read discussion bookmarks" on public.discussion_bookmarks;
create policy "Authenticated users can read discussion bookmarks" on public.discussion_bookmarks
for select to authenticated using (true);
drop policy if exists "Users manage own discussion bookmarks" on public.discussion_bookmarks;
create policy "Users manage own discussion bookmarks" on public.discussion_bookmarks
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Authenticated users can read reply likes" on public.reply_likes;
create policy "Authenticated users can read reply likes" on public.reply_likes
for select to authenticated using (true);
drop policy if exists "Users manage own reply likes" on public.reply_likes;
create policy "Users manage own reply likes" on public.reply_likes
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 附件桶设为私有；已登录用户可读取，只有文件路径第一段等于自己 UID 的用户可写/删。
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resource-attachments',
  'resource-attachments',
  false,
  20971520,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'text/plain', 'application/zip']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can read resource attachment files" on storage.objects;
create policy "Authenticated users can read resource attachment files" on storage.objects
for select to authenticated using (bucket_id = 'resource-attachments');

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
