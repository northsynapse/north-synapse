-- North Synapse 管理面板、反馈、评分与在线状态
-- 在 Supabase Dashboard → SQL Editor 中执行本迁移。

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.site_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('General Suggestion', 'Report Issue / Bug', 'Content Request')),
  details text not null check (char_length(trim(details)) between 1 and 5000),
  status text not null default 'Pending' check (status in ('Pending', 'Reviewed', 'Resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_ratings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 2000),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

create index if not exists site_feedback_created_at_idx on public.site_feedback(created_at desc);
create index if not exists site_feedback_status_idx on public.site_feedback(status, created_at desc);
create index if not exists user_presence_last_seen_at_idx on public.user_presence(last_seen_at desc);

alter table public.admin_users enable row level security;
alter table public.site_feedback enable row level security;
alter table public.site_ratings enable row level security;
alter table public.user_presence enable row level security;

-- 管理员身份只存放在受保护的 admin_users 表，不使用用户可自行修改的 metadata。
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;

drop policy if exists "Admins can read admin list" on public.admin_users;
create policy "Admins can read admin list" on public.admin_users
for select to authenticated using ((select public.is_current_user_admin()));

drop policy if exists "Users can submit feedback" on public.site_feedback;
create policy "Users can submit feedback" on public.site_feedback
for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "Users can read own feedback" on public.site_feedback;
create policy "Users can read own feedback" on public.site_feedback
for select to authenticated using (user_id = (select auth.uid()) or (select public.is_current_user_admin()));

drop policy if exists "Admins can update feedback status" on public.site_feedback;
create policy "Admins can update feedback status" on public.site_feedback
for update to authenticated using ((select public.is_current_user_admin()))
with check ((select public.is_current_user_admin()));

drop policy if exists "Users can read aggregate rating records" on public.site_ratings;
create policy "Users can read rating records" on public.site_ratings
for select to authenticated using (user_id = (select auth.uid()) or (select public.is_current_user_admin()));

drop policy if exists "Users can submit own rating" on public.site_ratings;
create policy "Users can insert own rating" on public.site_ratings
for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "Users can update own rating" on public.site_ratings;
create policy "Users can update own rating" on public.site_ratings
for update to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users can manage own presence" on public.user_presence;
create policy "Users can insert own presence" on public.user_presence
for insert to authenticated with check (user_id = (select auth.uid()));

create policy "Users can update own presence" on public.user_presence
for update to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Admins can read presence" on public.user_presence;
create policy "Admins can read presence" on public.user_presence
for select to authenticated using ((select public.is_current_user_admin()));

-- 注册时为预先指定的管理员邮箱授予角色；不授予任何其他账号。
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

  if lower(coalesce(new.email, '')) = 'northsynapse@gmail.com' then
    insert into public.admin_users (user_id, email)
    values (new.id, lower(new.email))
    on conflict (user_id) do update set email = excluded.email;
  end if;

  return new;
end;
$$;

-- 如果管理员账号已注册，立即授予其管理角色。
insert into public.admin_users (user_id, email)
select id, lower(email)
from auth.users
where lower(email) = 'northsynapse@gmail.com'
on conflict (user_id) do update set email = excluded.email;

-- 仅管理员可调用的统计接口，不向普通用户暴露全站注册人数。
create or replace function public.admin_dashboard_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not (select public.is_current_user_admin()) then
    raise exception 'Administrator access required';
  end if;

  select jsonb_build_object(
    'registered_users', (select count(*) from auth.users),
    'online_users', (select count(*) from public.user_presence where last_seen_at > now() - interval '2 minutes'),
    'average_rating', (select coalesce(round(avg(rating)::numeric, 2), 0) from public.site_ratings),
    'rating_count', (select count(*) from public.site_ratings),
    'pending_feedback', (select count(*) from public.site_feedback where status = 'Pending'),
    'total_feedback', (select count(*) from public.site_feedback)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_dashboard_metrics() from public;
grant execute on function public.admin_dashboard_metrics() to authenticated;
